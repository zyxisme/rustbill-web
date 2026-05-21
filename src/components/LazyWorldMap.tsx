import { useState, useEffect, useRef } from 'react';
import { clusters, accent } from 'virtual:brand';

interface ClusterMarker {
  lat: number;
  lng: number;
  name: string;
  zones: number;
  latency: string;
}

interface PinPoint {
  x: number;
  y: number;
  data?: ClusterMarker;
}

function WorldMapSkeleton() {
  return (
    <div className="w-full aspect-[2/1] max-w-[900px] mx-auto rounded-lg bg-canvas-soft animate-shimmer" />
  );
}

export default function LazyWorldMap() {
  const [visible, setVisible] = useState(false);
  const [svgContent, setSvgContent] = useState('');
  const [pinPoints, setPinPoints] = useState<PinPoint[]>([]);
  const [svgViewBox, setSvgViewBox] = useState({ w: 900, h: 450 });
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  // IntersectionObserver — lazy load the map when scrolled near
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: '100px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Dynamic import dotted-map + generate SVG
  useEffect(() => {
    if (!visible || loadedRef.current) return;
    loadedRef.current = true;

    let cancelled = false;

    import('dotted-map').then((mod) => {
      if (cancelled) return;
      const DottedMap = mod.default;

      const map = new DottedMap({ height: 60, grid: 'diagonal' });

      for (const c of clusters) {
        map.addPin({
          lat: c.lat,
          lng: c.lng,
          svgOptions: { color: accent, radius: 0.5 },
          data: c as ClusterMarker,
        });
      }

      const svg = map.getSVG({
        radius: 0.25,
        color: '#4b5563',
        shape: 'circle',
        backgroundColor: '#11161e',
      });

      // Extract viewBox dimensions
      const vbMatch = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
      const w = vbMatch ? parseFloat(vbMatch[1]) : 900;
      const h = vbMatch ? parseFloat(vbMatch[2]) : 450;

      // Modify SVG: add title elements to pin circles for native tooltips
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const circles = doc.querySelectorAll('circle');

      // Pins have larger radius (0.5 vs 0.2 base), identifiable by radius
      const pinData: PinPoint[] = [];
      for (const c of circles) {
        const r = parseFloat(c.getAttribute('r') || '0');
        if (r >= 0.4) {
          // Find matching cluster by fill color (accent)
          const fill = c.getAttribute('fill');
          if (fill && clusters.length > 0) {
            const cx = parseFloat(c.getAttribute('cx') || '0');
            const cy = parseFloat(c.getAttribute('cy') || '0');
            pinData.push({ x: cx, y: cy });
          }
        }
      }

      // Remove duplicate pin overlays (dotted-map may render pins in nested groups)
      // Take unique pin positions
      const uniquePins: PinPoint[] = [];
      const seen = new Set<string>();
      for (const p of pinData) {
        const key = `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniquePins.push(p);
        }
      }

      // Assign cluster data to pins in order
      const orderedPins = uniquePins.slice(0, clusters.length).map((p, i) => ({
        ...p,
        data: clusters[i] as ClusterMarker,
      }));

      if (!cancelled) {
        setSvgContent(svg);
        setSvgViewBox({ w, h });
        setPinPoints(orderedPins);
      }
    });

    return () => { cancelled = true; };
  }, [visible]);

  if (clusters.length === 0) return null;

  return (
    <div ref={containerRef}>
      {visible && svgContent ? (
        <div className="relative w-full max-w-[900px] mx-auto">
          <div
            className="w-full [&_svg]:w-full [&_svg]:h-auto [&_svg]:block"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />

          {/* Overlay hover zones on each pin */}
          {pinPoints.map((p, i) => {
            const leftPct = (p.x / svgViewBox.w) * 100;
            const topPct = (p.y / svgViewBox.h) * 100;
            const cluster = p.data;
            if (!cluster) return null;

            return (
              <div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Invisible hit area */}
                <div className="w-6 h-6 rounded-full cursor-default" />

                {/* Tooltip */}
                {hoveredIdx === i && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-canvas-soft border border-hairline rounded-lg px-3 py-2 text-xs shadow-lg pointer-events-none whitespace-nowrap z-10">
                    <div className="text-ink font-medium text-sm">{cluster.name}</div>
                    <div className="text-mute mt-0.5">
                      <span className="text-success font-mono">{cluster.latency}</span>
                      {' · '}
                      {cluster.zones} AZ
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <WorldMapSkeleton />
      )}
    </div>
  );
}

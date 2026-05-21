import { useState, useEffect, useRef } from 'react';

export function LazyTerminal() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="min-h-[12rem]">
      {visible ? (
        <div className="bg-canvas rounded-md border border-hairline overflow-hidden shadow-[0_0_30px_rgba(0,209,167,0.06)]">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-hairline bg-canvas-soft-2">
            <span className="w-3 h-3 rounded-full bg-error/80" />
            <span className="w-3 h-3 rounded-full bg-warning/80" />
            <span className="w-3 h-3 rounded-full bg-success/80" />
            <span className="ml-3 text-xs font-mono text-mute">terminal — rustbill</span>
          </div>
          <div className="p-5 font-mono text-sm leading-relaxed overflow-x-auto">
            <span className="text-mute">$ </span>
            <span className="text-primary">rustbill deploy</span>
            <span className="text-body"> --name my-cloud --region us-west-1</span>
            <br />
            <span className="text-mute">  ✓ </span>
            <span className="text-success">Provisioning instance</span>
            <span className="text-mute"> ... 2.4s</span>
            <br />
            <span className="text-mute">  ✓ </span>
            <span className="text-success">Assigning IPv4</span>
            <span className="text-mute"> ........... 0.3s</span>
            <br />
            <span className="text-mute">  ✓ </span>
            <span className="text-success">Configuring firewall</span>
            <span className="text-mute"> .... 1.1s</span>
            <br />
            <span className="text-mute">  ✓ </span>
            <span className="text-success">Instance ready</span>
            <span className="text-mute"> ......... </span>
            <span className="text-primary">203.0.113.42</span>
            <br />
            <br />
            <span className="text-mute">$ </span>
            <span className="text-body">ssh root@203.0.113.42</span>
            <br />
            <span className="text-success">Welcome to Ubuntu 24.04 LTS</span>
            <br />
            <span className="text-mute">root@my-cloud:~# </span>
            <span className="cursor-blink">_</span>
          </div>
        </div>
      ) : (
        <div className="bg-canvas rounded-md border border-hairline h-48 animate-shimmer" />
      )}
    </div>
  );
}

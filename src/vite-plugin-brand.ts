import type { Plugin, ResolvedConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import YAML from 'yaml';

// ─── Types ───

interface LogoConfig {
  type: 'svg' | 'url' | 'text';
  svg?: string;
  url?: string;
}

interface NavItem {
  i18n?: string;
  label?: string;
  href?: string;
  external?: boolean;
  icon?: string;
  children?: NavItem[];
}

interface Cluster {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zones: number;
  latency: string;
}

interface BrandConfig {
  brandName: string;
  tagline?: string;
  accent: string;
  logo?: LogoConfig;
  favicon?: string;
  colors?: Record<string, string>;
  header?: { nav?: NavItem[] };
  sidebar?: { nav?: NavItem[] };
  clusters?: Cluster[];
}

// ─── HSL Color Utilities ───

interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

function hexToHsl(hex: string): HSL {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(hsl: HSL): string {
  const h = ((hsl.h % 360) + 360) % 360 / 360;
  const s = Math.max(0, Math.min(100, hsl.s)) / 100;
  const l = Math.max(0, Math.min(100, hsl.l)) / 100;

  function hue2rgb(p: number, q: number, t: number): number {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }

  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ─── Color Derivation ───

function deriveColors(accent: string, overrides?: Record<string, string>): Record<string, string> {
  if (!/^#[0-9a-fA-F]{6}$/.test(accent)) {
    throw new Error(`brand.yaml: accent "${accent}" is not a valid #RRGGBB hex color`);
  }
  const base = hexToHsl(accent);

  const derived: Record<string, string> = {
    // Surface ladder — dark, desaturated accent background
    canvas: hslToHex({ h: base.h, s: Math.round(base.s * 0.3), l: 8 }),
    'canvas-soft': hslToHex({ h: base.h, s: Math.round(base.s * 0.3), l: 12 }),
    'canvas-soft-2': hslToHex({ h: base.h, s: Math.round(base.s * 0.3), l: 18 }),

    // Primary
    primary: accent,
    'primary-hover': hslToHex({ h: base.h, s: base.s, l: Math.max(5, base.l - 10) }),
    'primary-foreground': hslToHex({ h: base.h, s: Math.round(base.s * 0.6), l: 6 }),

    // Text — near-white with accent hue tint
    ink: hslToHex({ h: base.h, s: 5, l: 92 }),
    body: hslToHex({ h: base.h, s: 5, l: 65 }),
    mute: hslToHex({ h: base.h, s: 5, l: 45 }),

    // Borders — subtle accent hue
    hairline: hslToHex({ h: base.h, s: 8, l: 12 }),
    'hairline-strong': hslToHex({ h: base.h, s: 8, l: 20 }),

    // Links — brighter accent
    link: hslToHex({ h: base.h, s: base.s, l: Math.min(95, base.l + 12) }),
    'link-deep': hslToHex({ h: base.h, s: base.s, l: Math.max(5, base.l - 10) }),
    'link-bg-soft': hslToHex({ h: base.h, s: Math.round(base.s * 0.5), l: 15 }),

    // Semantic — hue rotated
    success: hslToHex({ h: (base.h + 30) % 360, s: base.s, l: Math.min(95, base.l + 10) }),
    error: '#ef4444',
    'error-soft': '#3b121a',
    'error-deep': '#b91c1c',
    warning: '#f59e0b',
    'warning-soft': '#2d1f0a',
    'warning-deep': '#b45309',
    violet: hslToHex({ h: (base.h + 130) % 360, s: Math.round(base.s * 0.8), l: base.l }),
    'violet-soft': hslToHex({ h: (base.h + 130) % 360, s: Math.round(base.s * 0.4), l: 12 }),
    'violet-deep': hslToHex({ h: (base.h + 130) % 360, s: Math.round(base.s * 0.8), l: Math.max(5, base.l - 8) }),

    // Cyan scale
    cyan: accent,
    'cyan-soft': hslToHex({ h: base.h, s: Math.round(base.s * 0.5), l: 15 }),
    'cyan-deep': hslToHex({ h: base.h, s: base.s, l: Math.max(5, base.l - 10) }),
    'highlight-cyan': hslToHex({ h: base.h, s: base.s, l: Math.min(95, base.l + 12) }),
    'highlight-teal': hslToHex({ h: (base.h + 20) % 360, s: base.s, l: Math.min(95, base.l + 10) }),

    // Gradient
    'gradient-start': accent,
    'gradient-mid': hslToHex({ h: base.h, s: base.s, l: Math.max(5, base.l - 10) }),
    'gradient-end': hslToHex({ h: base.h, s: base.s, l: Math.max(5, base.l - 20) }),

    // Selection
    'selection-bg': accent,
    'selection-fg': hslToHex({ h: base.h, s: Math.round(base.s * 0.6), l: 6 }),
  };

  // Apply overrides
  if (overrides) {
    for (const [key, value] of Object.entries(overrides)) {
      if (value && value !== 'null') {
        derived[key] = value;
      }
    }
  }

  return derived;
}

// ─── Default Brand Config (when brand.yaml is missing) ───

const DEFAULT_BRAND: BrandConfig = {
  brandName: 'RustBill',
  accent: '#00d1a7',
  tagline: '高性能云计算平台',
  header: {
    nav: [
      { i18n: 'nav.home', href: '/' },
      { i18n: 'nav.products', children: [
        { i18n: 'nav.catalog', href: '/catalog' },
      ] },
      { i18n: 'nav.legal', children: [
        { i18n: 'nav.terms', href: '/legal/terms' },
        { i18n: 'nav.privacy', href: '/legal/privacy' },
      ] },
    ],
  },
  sidebar: {
    nav: [
      { i18n: 'nav.overview', href: '/dashboard', icon: 'LayoutDashboard' },
      { i18n: 'nav.myOrders', href: '/dashboard/orders', icon: 'ShoppingCart' },
      { i18n: 'nav.myInstances', href: '/dashboard/instances', icon: 'Server' },
      { i18n: 'nav.myInvoices', href: '/dashboard/invoices', icon: 'FileText' },
      { i18n: 'nav.myTickets', href: '/dashboard/tickets', icon: 'Ticket' },
      { i18n: 'nav.myBalance', href: '/dashboard/balance', icon: 'Wallet' },
      { i18n: 'nav.apiKeys', href: '/dashboard/api-keys', icon: 'Key' },
      { i18n: 'nav.settings', href: '/dashboard/settings', icon: 'Settings' },
    ],
  },
  clusters: [],
};

// ─── Load & Parse brand.yaml ───

function loadBrandConfig(rootDir: string): BrandConfig {
  const yamlPath = resolve(rootDir, 'brand.yaml');
  try {
    const raw = readFileSync(yamlPath, 'utf-8');
    const parsed = YAML.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_BRAND;
    return {
      brandName: parsed.brandName ?? DEFAULT_BRAND.brandName,
      tagline: parsed.tagline ?? DEFAULT_BRAND.tagline,
      accent: parsed.accent ?? DEFAULT_BRAND.accent,
      logo: parsed.logo ?? undefined,
      favicon: parsed.favicon ?? undefined,
      colors: parsed.colors || undefined,
      header: parsed.header || DEFAULT_BRAND.header,
      sidebar: parsed.sidebar || DEFAULT_BRAND.sidebar,
      clusters: Array.isArray(parsed.clusters) ? parsed.clusters : [],
    };
  } catch (err) {
    console.warn(`[vite-plugin-brand] Failed to load ${yamlPath}:`, err instanceof Error ? err.message : err);
    return DEFAULT_BRAND;
  }
}

// ─── Generate CSS Variable String ───

function generateCSS(colors: Record<string, string>): string {
  let css = ':root {\n';
  for (const [key, value] of Object.entries(colors)) {
    css += `  --color-${key}: ${value};\n`;
  }
  css += '}\n';
  return css;
}

// ─── Virtual Module Codegen ───

function getDerivedFavicon(config: BrandConfig): string | null {
  if (config.favicon != null) return config.favicon;
  if (config.logo) {
    if (config.logo.type === 'svg' && config.logo.svg) {
      const b64 = Buffer.from(config.logo.svg.trim()).toString('base64');
      return `data:image/svg+xml;base64,${b64}`;
    }
    if (config.logo.type === 'url' && config.logo.url) {
      return config.logo.url;
    }
  }
  return '/favicon.svg';
}

function generateVirtualModule(config: BrandConfig): string {
  const colors = deriveColors(config.accent, config.colors);

  const lines: string[] = [
    `export const brandName = ${JSON.stringify(config.brandName)};`,
    `export const tagline = ${JSON.stringify(config.tagline ?? '')};`,
    `export const accent = ${JSON.stringify(config.accent)};`,
    `export const logo = ${JSON.stringify(config.logo ?? null)};`,
    `export const favicon = ${JSON.stringify(getDerivedFavicon(config))};`,
    `export const colors = ${JSON.stringify(colors)};`,
    `export const header = ${JSON.stringify(config.header ?? null)};`,
    `export const sidebar = ${JSON.stringify(config.sidebar ?? null)};`,
    `export const clusters = ${JSON.stringify(config.clusters ?? [])};`,
  ];

  return lines.join('\n');
}

// ─── Vite Plugin ───

const VIRTUAL_ID = 'virtual:brand';
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID;

export default function vitePluginBrand(): Plugin {
  let rootDir = process.cwd();

  return {
    name: 'vite-plugin-brand',

    configResolved(config: ResolvedConfig) {
      rootDir = config.root;
    },

    resolveId(id: string) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
    },

    load(id: string) {
      if (id === RESOLVED_VIRTUAL_ID) {
        const config = loadBrandConfig(rootDir);
        return generateVirtualModule(config);
      }
    },

    transformIndexHtml(html: string) {
      const config = loadBrandConfig(rootDir);
      const colors = deriveColors(config.accent, config.colors);
      const css = generateCSS(colors);

      // Replace title
      html = html.replace(/<title>.*?<\/title>/, `<title>${config.brandName}</title>`);

      // Replace favicon
      const deriveFavicon = getDerivedFavicon(config);
      if (deriveFavicon) {
        html = html.replace(/<link rel="icon"[^>]*>/, `<link rel="icon" type="image/svg+xml" href="${deriveFavicon}" />`);
      }

      return {
        html,
        tags: [
          {
            tag: 'style',
            attrs: { id: 'rustbill-brand' },
            children: css,
            injectTo: 'head' as const,
          },
        ],
      };
    },

    handleHotUpdate({ file, server }) {
      if (file.endsWith('brand.yaml')) {
        server.ws.send({ type: 'full-reload' });
      }
    },
  };
}

/// <reference types="vite/client" />

interface NavItem {
  i18n?: string;
  label?: string;
  href?: string;
  external?: boolean;
  icon?: string;
  children?: NavItem[];
}

interface LogoConfig {
  type: 'svg' | 'url' | 'text';
  svg?: string;
  url?: string;
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
  tagline: string;
  accent: string;
  logo: LogoConfig | null;
  favicon: string;
  colors: Record<string, string>;
  header: { nav: NavItem[] } | null;
  sidebar: { nav: NavItem[] } | null;
  clusters: Cluster[];
}

declare module 'harmonyos-sans-webfont-splitted';

declare module 'virtual:brand' {
  export const brandName: string;
  export const tagline: string;
  export const accent: string;
  export const logo: LogoConfig | null;
  export const favicon: string;
  export const colors: Record<string, string>;
  export const header: { nav: NavItem[] } | null;
  export const sidebar: { nav: NavItem[] } | null;
  export const clusters: Cluster[];

  export type { NavItem, LogoConfig, BrandConfig, Cluster };
}

declare module '*.md?html' {
  const html: string;
  export default html;
}

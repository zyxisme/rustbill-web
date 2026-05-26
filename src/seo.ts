import { brandName } from 'virtual:brand';

export interface SEOMeta {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  jsonLd?: Record<string, unknown>;
}

export function homeSEO(): SEOMeta {
  return {
    title: `${brandName} — 全球云基础设施`,
    description: '高性能云服务器、裸金属、Kubernetes 集群，全球多区域部署，按需计费。',
    ogType: 'website',
    ogImage: '/og-image.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: brandName,
      url: '/',
      logo: '/favicon.svg',
    },
  };
}

export function catalogSEO(): SEOMeta {
  return {
    title: `云服务器产品 — ${brandName}`,
    description: '浏览全部云服务器产品，按需选择配置和计费周期。',
    ogType: 'website',
    ogImage: '/og-image.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: [],
    },
  };
}

export function productDetailSEO(name: string, summary: string): SEOMeta {
  return {
    title: `${name} — ${brandName}`,
    description: summary,
    ogType: 'product',
    ogImage: '/og-image.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      description: summary,
    },
  };
}

export function termsSEO(): SEOMeta {
  return {
    title: `用户服务协议 — ${brandName}`,
    description: '',
    ogType: 'website',
  };
}

export function privacySEO(): SEOMeta {
  return {
    title: `隐私政策 — ${brandName}`,
    description: '',
    ogType: 'website',
  };
}

export function sitemapURLs(): string[] {
  return [
    '/',
    '/catalog',
    '/legal/terms',
    '/legal/privacy',
  ];
}

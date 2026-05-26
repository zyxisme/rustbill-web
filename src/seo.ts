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
    description: `${brandName} 用户服务协议，包含服务条款、用户权利与义务、隐私保护及免责声明等内容。`,
    ogType: 'website',
  };
}

export function privacySEO(): SEOMeta {
  return {
    title: `隐私政策 — ${brandName}`,
    description: `${brandName} 隐私政策，包含用户信息收集、数据使用、信息存储及用户权利等隐私保护条款。`,
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

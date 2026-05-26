import { privacySEO } from '@/seo';

export default function Head() {
  const meta = privacySEO();
  return (
    <>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta property="og:title" content={meta.ogTitle || meta.title} />
      <meta property="og:description" content={meta.ogDescription || meta.description} />
      <meta property="og:type" content={meta.ogType || 'website'} />
      <meta name="twitter:card" content="summary_large_image" />
    </>
  );
}

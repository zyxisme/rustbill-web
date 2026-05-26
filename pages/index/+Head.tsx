import { homeSEO } from '@/seo';

export default function Head() {
  const meta = homeSEO();
  return (
    <>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta property="og:title" content={meta.ogTitle || meta.title} />
      <meta property="og:description" content={meta.ogDescription || meta.description} />
      <meta property="og:type" content={meta.ogType || 'website'} />
      {meta.ogImage && <meta property="og:image" content={meta.ogImage} />}
      <meta name="twitter:card" content="summary_large_image" />
      {meta.canonical && <link rel="canonical" href={meta.canonical} />}
      {meta.jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(meta.jsonLd) }} />
      )}
    </>
  );
}

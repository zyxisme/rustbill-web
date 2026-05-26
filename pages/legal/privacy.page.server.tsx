import { privacySEO } from '@/seo';

export function Head() {
  const meta = privacySEO();
  return (
    <>
      <title>{meta.title}</title>
      <meta property="og:title" content={meta.ogTitle || meta.title} />
      <meta name="twitter:card" content="summary_large_image" />
    </>
  );
}

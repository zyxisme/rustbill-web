import { termsSEO } from '@/seo';

export default function Head() {
  const meta = termsSEO();
  return (
    <>
      <title>{meta.title}</title>
      <meta property="og:title" content={meta.ogTitle || meta.title} />
      <meta name="twitter:card" content="summary_large_image" />
    </>
  );
}

import { colors, favicon } from 'virtual:brand';

export default function Head() {
  const vars = Object.entries(colors as Record<string, string>)
    .map(([k, v]) => `--color-${k}:${v}`)
    .join(';');

  return (
    <>
      <link rel="icon" href={favicon} />
      <style id="rustbill-brand">{`:root{${vars}}`}</style>
    </>
  );
}

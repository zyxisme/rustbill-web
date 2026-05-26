import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'dist', 'client');

const brandPath = join(__dirname, '..', 'brand.yaml');
const brand = existsSync(brandPath)
  ? YAML.parse(readFileSync(brandPath, 'utf-8'))
  : {};
const baseUrl = process.env.SITE_URL || brand.siteUrl || 'https://rb.monesy.cn';
const today = new Date().toISOString().split('T')[0];

const urls = [
  { loc: '/', priority: '1.0', changefreq: 'daily' },
  { loc: '/catalog', priority: '0.9', changefreq: 'daily' },
  { loc: '/legal/terms', priority: '0.5', changefreq: 'monthly' },
  { loc: '/legal/privacy', priority: '0.5', changefreq: 'monthly' },
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ loc, priority, changefreq }) => `  <url>
    <loc>${baseUrl}${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>`;

writeFileSync(join(outDir, 'sitemap.xml'), xml);
console.log('sitemap.xml generated');

writeFileSync(join(outDir, 'robots.txt'), `User-agent: *
Allow: /
Sitemap: ${baseUrl}/sitemap.xml
`);
console.log('robots.txt generated');

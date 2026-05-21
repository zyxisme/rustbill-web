import { getMapJSON } from 'dotted-map';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, '../src/assets/map-data.json');

const json = getMapJSON({ height: 35, grid: 'diagonal' });
writeFileSync(outPath, json, 'utf-8');

console.log(`Map data written to ${outPath} (${json.length} bytes)`);

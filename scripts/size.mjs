import { gzipSync } from 'node:zlib';
import { readFileSync, statSync } from 'node:fs';

const files = [
  'dist/daily-kural.min.js',
  'dist/daily-kural.bundled.min.js',
  'dist/index.mjs',
  'dist/index.cjs',
  'dist/index.d.ts',
  'dist/element.mjs',
  'dist/element.cjs',
  'dist/cli.js',
  'fonts/fonts.css',
];

const rows = files.map((file) => {
  const raw = statSync(file).size;
  const gzip = gzipSync(readFileSync(file)).length;
  return { file, raw, gzip };
});

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
const width = Math.max(...rows.map((row) => row.file.length));
console.log(`${'file'.padEnd(width)}  raw        gzip`);
for (const row of rows) {
  console.log(`${row.file.padEnd(width)}  ${kb(row.raw).padStart(8)}  ${kb(row.gzip).padStart(8)}`);
}
const script = rows.find((row) => row.file === 'dist/daily-kural.min.js');
const bundled = rows.find((row) => row.file === 'dist/daily-kural.bundled.min.js');
console.log('');
console.log(`Browser script (fetches data): ${kb(script.raw)} raw, ${kb(script.gzip)} gzip.`);
console.log(`Browser script (data inside):  ${kb(bundled.raw)} raw, ${kb(bundled.gzip)} gzip.`);

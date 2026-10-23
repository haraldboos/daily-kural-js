#!/usr/bin/env node
/**
 * Download OFL-licensed Noto Tamil WOFF2 subsets into fonts/ and write fonts.css.
 * Files come from Fontsource (Noto Serif Tamil and Noto Sans Tamil).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fontsDir = join(root, 'fonts');

const FACES = [
  {
    family: 'Noto Serif Tamil',
    weight: 400,
    file: 'noto-serif-tamil-400.woff2',
    urls: [
      'https://cdn.jsdelivr.net/fontsource/fonts/noto-serif-tamil@5.2.5/tamil-400-normal.woff2',
    ],
  },
  {
    family: 'Noto Serif Tamil',
    weight: 700,
    file: 'noto-serif-tamil-700.woff2',
    urls: [
      'https://cdn.jsdelivr.net/fontsource/fonts/noto-serif-tamil@5.2.5/tamil-700-normal.woff2',
    ],
  },
  {
    family: 'Noto Sans Tamil',
    weight: 400,
    file: 'noto-sans-tamil-400.woff2',
    urls: [
      'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-tamil@5.2.5/tamil-400-normal.woff2',
    ],
  },
  {
    family: 'Noto Sans Tamil',
    weight: 700,
    file: 'noto-sans-tamil-700.woff2',
    urls: [
      'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-tamil@5.2.5/tamil-700-normal.woff2',
    ],
  },
];

const OFL_URL = 'https://github.com/notofonts/tamil/raw/main/OFL.txt';

async function download(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function firstAvailable(urls) {
  let last = null;
  for (const url of urls) {
    try {
      return await download(url);
    } catch (err) {
      last = err;
    }
  }
  throw last;
}

await mkdir(fontsDir, { recursive: true });

/** @type {typeof FACES} */
const saved = [];
for (const face of FACES) {
  try {
    const bytes = await firstAvailable(face.urls);
    await writeFile(join(fontsDir, face.file), bytes);
    saved.push(face);
    console.log(`saved ${face.file} (${bytes.length} bytes)`);
  } catch (err) {
    console.warn(`skip ${face.file}: ${err && err.message ? err.message : err}`);
  }
}

if (!saved.some((face) => face.family === 'Noto Serif Tamil' && face.weight === 400)
  || !saved.some((face) => face.family === 'Noto Sans Tamil' && face.weight === 400)) {
  throw new Error('Required Tamil faces (weight 400) were not downloaded.');
}

const css = `/* OFL licensed Noto Tamil subsets. See OFL.txt. */
${saved.map((face) => `@font-face {
  font-family: "${face.family}";
  font-style: normal;
  font-weight: ${face.weight};
  font-display: swap;
  src: url("./${face.file}") format("woff2");
  unicode-range: U+0B80-0BFF;
}`).join('\n')}
`;
await writeFile(join(fontsDir, 'fonts.css'), css);

try {
  const ofl = await download(OFL_URL);
  await writeFile(join(fontsDir, 'OFL.txt'), ofl);
  console.log('saved OFL.txt');
} catch (err) {
  console.warn(`could not download OFL.txt: ${err && err.message ? err.message : err}`);
}

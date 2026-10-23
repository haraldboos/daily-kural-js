import { chmodSync, copyFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { build } from 'esbuild';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const versionLine = readFileSync('src/constants.js', 'utf8').match(/export const VERSION = '([^']+)'/);
if (!versionLine || versionLine[1] !== pkg.version) {
  console.error(`VERSION in src/constants.js (${versionLine && versionLine[1]}) must match package.json (${pkg.version}).`);
  process.exit(1);
}

mkdirSync('dist', { recursive: true });
for (const stale of ['dist/cli.cjs', 'dist/cli.mjs', 'dist/daily-kural.bundled.js']) {
  rmSync(stale, { force: true });
}

const shared = {
  bundle: true,
  target: ['es2020'],
  legalComments: 'none',
  logLevel: 'info',
};

await build({
  ...shared,
  entryPoints: ['src/index.js'],
  format: 'esm',
  platform: 'neutral',
  outfile: 'dist/index.mjs',
});

await build({
  ...shared,
  entryPoints: ['src/index.js'],
  format: 'cjs',
  platform: 'node',
  outfile: 'dist/index.cjs',
  target: ['node18'],
});

await build({
  ...shared,
  entryPoints: ['src/element.js'],
  format: 'esm',
  platform: 'neutral',
  outfile: 'dist/element.mjs',
});

await build({
  ...shared,
  entryPoints: ['src/element.js'],
  format: 'cjs',
  platform: 'node',
  outfile: 'dist/element.cjs',
  target: ['node18'],
});

await build({
  ...shared,
  entryPoints: ['src/browser.js'],
  format: 'iife',
  platform: 'browser',
  outfile: 'dist/daily-kural.min.js',
  minify: true,
  ignoreAnnotations: true,
});

await build({
  ...shared,
  entryPoints: ['src/bundled-browser.js'],
  format: 'iife',
  platform: 'browser',
  outfile: 'dist/daily-kural.bundled.min.js',
  minify: true,
  ignoreAnnotations: true,
});

await build({
  ...shared,
  entryPoints: ['src/bin.js'],
  format: 'esm',
  platform: 'node',
  outfile: 'dist/cli.js',
  target: ['node18'],
  banner: { js: '#!/usr/bin/env node' },
});

copyFileSync('types/index.d.ts', 'dist/index.d.ts');
copyFileSync('types/index.d.ts', 'dist/index.d.mts');
copyFileSync('types/index.d.ts', 'dist/index.d.cts');
copyFileSync('types/element.d.ts', 'dist/element.d.ts');
copyFileSync('types/element.d.ts', 'dist/element.d.mts');
copyFileSync('types/element.d.ts', 'dist/element.d.cts');
chmodSync('dist/cli.js', 0o755);

const cliHead = readFileSync('dist/cli.js', 'utf8').slice(0, 20);
if (!cliHead.startsWith('#!/usr/bin/env node')) {
  console.error('dist/cli.js is missing the node shebang.');
  process.exit(1);
}

console.log('built dist/');

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const errors = [];

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === 'site') continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, acc);
    else if (/\.(mjs|cjs|js)$/.test(name)) acc.push(path);
  }
  return acc;
}

const files = [...walk('src'), ...walk('scripts'), ...walk('test')];
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    errors.push(`${file}\n${result.stderr || result.stdout}`);
  }
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const required = ['name', 'version', 'description', 'license', 'author', 'type', 'main', 'module', 'types', 'exports', 'files', 'bin', 'engines', 'publishConfig'];
for (const key of required) {
  if (pkg[key] == null) errors.push(`package.json is missing "${key}".`);
}
if (pkg.name !== 'daily-kural-js') errors.push(`package name is ${pkg.name}, expected daily-kural-js.`);
if (pkg.license !== 'MIT') errors.push('license must be MIT.');
if (pkg.type !== 'module') errors.push('type must be "module".');
if (pkg.bin?.['daily-kural'] !== 'dist/cli.js') errors.push('bin.daily-kural must be dist/cli.js.');
if (pkg.unpkg !== 'dist/daily-kural.min.js' || pkg.jsdelivr !== 'dist/daily-kural.min.js') {
  errors.push('unpkg and jsdelivr must point at dist/daily-kural.min.js.');
}
if (pkg.engines?.node !== '>=18') errors.push('engines.node must be >=18.');
if (pkg.publishConfig?.access !== 'public' || pkg.publishConfig?.provenance !== true) {
  errors.push('publishConfig must set access public and provenance true.');
}

const constants = readFileSync('src/constants.js', 'utf8');
const version = constants.match(/export const VERSION = '([^']+)'/);
if (!version || version[1] !== pkg.version) {
  errors.push(`src/constants.js VERSION must match package.json (${pkg.version}).`);
}

const config = readFileSync('src/config.js', 'utf8');
if (!/export const THIRUKKURAL_DATA_REV = '[0-9a-f]{40}'/.test(config)) {
  errors.push('src/config.js must export THIRUKKURAL_DATA_REV as a 40-character commit SHA.');
}
const srcText = files.filter((file) => file.startsWith('src/')).map((file) => readFileSync(file, 'utf8')).join('\n');
if (/@master\b|\/master\//.test(srcText)) {
  errors.push('src still points at a moving master branch. Pin THIRUKKURAL_DATA_REV instead.');
}

if (errors.length) {
  console.error(errors.join('\n\n'));
  process.exit(1);
}
console.log(`lint ok (${files.length} files syntax-checked)`);

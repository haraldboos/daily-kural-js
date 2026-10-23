/**
 * Run the JavaScript samples in the docs.
 * Usage: node scripts/verify-docs.mjs <directory where `daily-kural-js` resolves>
 * Blocks that need a browser, or the repo's data/ folder, are skipped here.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cwd = process.argv[2];
const repo = fileURLToPath(new URL('..', import.meta.url));
if (!cwd) {
  console.error('Pass the directory that has daily-kural-js installed.');
  process.exit(1);
}

const docs = [
  ['README.md', join(repo, 'README.md')],
  ['USER_MANUAL.md', join(repo, 'USER_MANUAL.md')],
  ['docs/api.md', join(repo, 'docs/api.md')],
];

function fences(markdown) {
  const lines = markdown.split('\n');
  const blocks = [];
  for (let i = 0; i < lines.length; i += 1) {
    const open = /^```(\w*)/.exec(lines[i]);
    if (!open) continue;
    const lang = open[1];
    const body = [];
    i += 1;
    while (i < lines.length && !lines[i].startsWith('```')) {
      body.push(lines[i]);
      i += 1;
    }
    blocks.push({ lang, code: body.join('\n') });
  }
  return blocks;
}

let failed = 0;
let ran = 0;
const dir = join(cwd, '.snippet-tmp');
mkdirSync(dir, { recursive: true });

for (const [name, path] of docs) {
  const blocks = fences(readFileSync(path, 'utf8'));
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (block.lang !== 'js' && block.lang !== 'javascript') continue;
    if (!block.code.includes('daily-kural-js') && !block.code.includes('DailyKural')) continue;
    if (!/^\s*import\s/m.test(block.code) && !block.code.includes('require(')) continue;
    if (block.code.includes('mount(') || block.code.includes('from \'react\'')) {
      console.log(`skip ${name} #${i} (browser or React runtime)`);
      continue;
    }
    const file = join(dir, block.code.includes('require(') ? `snippet-${ran}.cjs` : `snippet-${ran}.mjs`);
    writeFileSync(file, block.code);
    const preload = fileURLToPath(new URL('./fetch-local.mjs', import.meta.url));
    const result = spawnSync(process.execPath, ['--import', preload, file], { cwd, encoding: 'utf8', timeout: 120000 });
    ran += 1;
    const expected = blocks[i + 1] && blocks[i + 1].lang === 'text' ? blocks[i + 1].code.trim() : null;
    const stdout = (result.stdout || '').trim();
    if (result.status !== 0) {
      failed += 1;
      console.error(`FAIL ${name} snippet ${i}\n${result.stderr || result.stdout}`);
      continue;
    }
    if (expected != null && stdout !== expected) {
      failed += 1;
      console.error(`FAIL ${name} snippet ${i} output\nexpected:\n${expected}\nactual:\n${stdout}`);
      continue;
    }
    console.log(`ok ${name} snippet ${i}${expected ? ' (output matched)' : ''}`);
  }
}

console.log(`ran ${ran}, failed ${failed}`);
process.exit(failed ? 1 : 0);

import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const version = (process.argv[2] || pkg.version).replace(/^v/, '');
const text = readFileSync('CHANGELOG.md', 'utf8');
const match = text.match(new RegExp(`## \\[${version}\\][\\s\\S]*?(?=\\n## |$)`));
if (!match) {
  console.error(`CHANGELOG.md has no entry for ${version}.`);
  process.exit(1);
}
process.stdout.write(`${match[0].trim()}\n`);

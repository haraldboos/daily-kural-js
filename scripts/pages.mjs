/**
 * Build the GitHub Pages site into site/.
 * The live demo uses the bundled script so it does not wait on npm or GitHub.
 */
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const site = join(root, 'site');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

rmSync(site, { recursive: true, force: true });
mkdirSync(join(site, 'assets'), { recursive: true });
mkdirSync(join(site, 'vendor'), { recursive: true });
mkdirSync(join(site, 'fonts'), { recursive: true });

cpSync(join(root, 'dist', 'daily-kural.bundled.min.js'), join(site, 'vendor', 'daily-kural.bundled.min.js'));
cpSync(join(root, 'fonts'), join(site, 'fonts'), { recursive: true });
const preview = join(root, 'docs', 'assets', 'preview.png');
try {
  cpSync(preview, join(site, 'assets', 'preview.png'));
} catch {
  // The screenshot is optional until it has been generated.
}

const css = `
:root { color-scheme: light; --bg:#f6f1e7; --fg:#2b241c; --muted:#6e6256; --card:#fffaf3; --line:#e4d7c6; --accent:#8f3d22; }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--fg); font:18px/1.55 Georgia, "Iowan Old Style", serif; }
header, main, footer { width:min(860px, calc(100% - 2rem)); margin:0 auto; }
header { padding:1.5rem 0 0.5rem; }
h1 { font-family:"Noto Serif Tamil","Noto Sans Tamil",serif; font-weight:400; font-size:clamp(2rem,5vw,3rem); line-height:1.7; margin:0; }
a { color:var(--accent); }
nav a { margin-right:1rem; }
.card { background:var(--card); border:1px solid var(--line); border-radius:18px; padding:0.5rem; margin:1rem 0 2rem; }
img.preview { width:100%; border-radius:12px; border:1px solid var(--line); }
article { background:var(--card); border:1px solid var(--line); border-radius:18px; padding:1.25rem 1.4rem 2rem; margin:1rem 0 2rem; }
article h1, article h2, article h3 { line-height:1.3; }
pre { overflow:auto; background:#241c16; color:#f6efe6; padding:0.9rem 1rem; border-radius:12px; }
code { font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:0.9em; }
table { border-collapse:collapse; width:100%; margin:1rem 0; }
th, td { border:1px solid var(--line); padding:0.45rem 0.6rem; text-align:left; vertical-align:top; }
th { background:#f3e4d6; }
footer { color:var(--muted); padding-bottom:2rem; }
`;

function page(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="./fonts/fonts.css">
  <style>${css}</style>
</head>
<body>
  <header>
    <p><a href="./">daily-kural-js</a></p>
    <nav>
      <a href="./">Demo</a>
      <a href="./manual.html">Manual</a>
      <a href="./api.html">API</a>
      <a href="https://github.com/haraldboos/daily-kural-js">GitHub</a>
      <a href="https://www.npmjs.com/package/daily-kural-js">npm</a>
    </nav>
  </header>
  <main>${body}</main>
  <footer>
    <p>Code is MIT. Thirukkural data is Apache-2.0 from tk120404/thirukkural. Fonts are SIL OFL 1.1.</p>
  </footer>
</body>
</html>
`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inline(text) {
  const images = [];
  const withoutImages = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, src) => {
    const href = src.replace(/^docs\/assets\//, './assets/');
    images.push(`<img src="${href}" alt="${escapeHtml(alt)}">`);
    return `\u0000${images.length - 1}\u0000`;
  });
  const html = escapeHtml(withoutImages)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) => `<a href="${href}">${label}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return html.replace(/\u0000(\d+)\u0000/g, (_m, index) => images[Number(index)]);
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const buf = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith('```')) {
        buf.push(lines[i]);
        i += 1;
      }
      out.push(`<pre><code${lang ? ` class="language-${escapeHtml(lang)}"` : ''}>${escapeHtml(buf.join('\n'))}</code></pre>`);
      i += 1;
      continue;
    }
    if (line.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        rows.push(lines[i]);
        i += 1;
      }
      const parsed = rows
        .filter((row) => !/^\|\s*-+/.test(row))
        .map((row) => row.split('|').slice(1, -1).map((cell) => cell.trim()));
      if (parsed.length) {
        const head = parsed[0].map((cell) => `<th>${inline(cell)}</th>`).join('');
        const body = parsed.slice(1).map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`).join('');
        out.push(`<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`);
      }
      continue;
    }
    const heading = /^(#{1,3}) (.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }
    if (line.trim() === '') {
      i += 1;
      continue;
    }
    if (line.startsWith('> ')) {
      out.push(`<blockquote><p>${inline(line.slice(2))}</p></blockquote>`);
      i += 1;
      continue;
    }
    if (/^[-*] /.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(`<li>${inline(lines[i].slice(2))}</li>`);
        i += 1;
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }
    if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\d+\. /, ''))}</li>`);
        i += 1;
      }
      out.push(`<ol>${items.join('')}</ol>`);
      continue;
    }
    const buf = [line];
    i += 1;
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith('#') && !lines[i].startsWith('```') && !lines[i].startsWith('|') && !/^[-*] /.test(lines[i]) && !/^\d+\. /.test(lines[i])) {
      buf.push(lines[i]);
      i += 1;
    }
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return out.join('\n');
}

const demo = `
  <h1>திருக்குறள்</h1>
  <p>A Thirukkural for today, in the browser. This page is the <strong>daily-kural-js</strong> demo (${escapeHtml(pkg.version)}).</p>
  <p><img class="preview" src="./assets/preview.png" alt="The daily-kural card showing a Tamil couplet, its English translation, and commentary tabs."></p>
  <div class="card">
    <daily-kural mode="daily" lang="both" theme="light" load-fonts="self" font-base="./fonts/" show-translation show-meta></daily-kural>
  </div>
  <p>Read the <a href="./manual.html">step-by-step manual</a> or the <a href="./api.html">API reference</a>.</p>
  <script src="./vendor/daily-kural.bundled.min.js"></script>
`;

writeFileSync(join(site, 'index.html'), page('daily-kural-js', demo));
writeFileSync(join(site, 'manual.html'), page('Manual — daily-kural-js', `<article>${markdownToHtml(readFileSync(join(root, 'USER_MANUAL.md'), 'utf8'))}</article>`));
writeFileSync(join(site, 'api.html'), page('API — daily-kural-js', `<article>${markdownToHtml(readFileSync(join(root, 'docs', 'api.md'), 'utf8'))}</article>`));
writeFileSync(
  join(root, 'docs', 'manual.md'),
  readFileSync(join(root, 'USER_MANUAL.md'), 'utf8').replaceAll('docs/assets/preview.png', 'assets/preview.png'),
);

console.log('wrote site/ for GitHub Pages');

import { GOOGLE_FONTS_HREF } from '../constants.js';

const applied = new Set();

/**
 * Load Tamil fonts into the document (not the shadow root).
 * `google` adds a stylesheet link and copies the @font-face rules into `<head>`.
 * `self` links a local fonts.css (unicode-range subset).
 * `none` leaves fonts to the host page.
 *
 * @param {'google' | 'self' | 'none' | string | null | undefined} mode
 * @param {string} [fontBase]
 */
export function ensureFonts(mode, fontBase) {
  if (typeof document === 'undefined' || !mode || mode === 'none') return Promise.resolve();
  if (mode === 'self') return ensureSelf(fontBase);
  if (mode === 'google') return ensureGoogle();
  return Promise.resolve();
}

function ensureGoogle() {
  const id = 'daily-kural-google-fonts';
  if (applied.has(id)) return Promise.resolve();
  applied.add(id);
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = GOOGLE_FONTS_HREF;
  document.head.appendChild(link);

  const styleId = 'daily-kural-google-fonts-css';
  return fetch(GOOGLE_FONTS_HREF)
    .then((response) => (response.ok ? response.text() : ''))
    .then((css) => {
      if (!css || document.getElementById(styleId)) return;
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = css;
      document.head.appendChild(style);
    })
    .catch(() => {
      // The <link> in <head> still loads the faces when the network allows it.
    });
}

function ensureSelf(fontBase) {
  const base = fontBase || guessFontBase();
  if (!base) return Promise.resolve();
  const absolute = new URL(base, document.baseURI).href;
  const href = new URL('fonts.css', absolute.endsWith('/') ? absolute : `${absolute}/`).href;
  if (applied.has(href) || document.getElementById('daily-kural-self-fonts')) return Promise.resolve();
  applied.add(href);
  const link = document.createElement('link');
  link.id = 'daily-kural-self-fonts';
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
  return Promise.resolve();
}

function guessFontBase() {
  const scripts = document.getElementsByTagName('script');
  for (let i = scripts.length - 1; i >= 0; i -= 1) {
    const src = scripts[i].src;
    if (src && src.indexOf('daily-kural') !== -1) return new URL('../fonts/', src).href;
  }
  return null;
}

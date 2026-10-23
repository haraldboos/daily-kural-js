import { registerDailyKuralElement } from './element.js';

const DATA_ATTRS = [
  ['mode', 'mode'],
  ['filter', 'filter'],
  ['lang', 'lang'],
  ['theme', 'theme'],
  ['commentary', 'commentary'],
  ['number', 'number'],
  ['paal', 'paal'],
  ['iyal', 'iyal'],
  ['chapter', 'chapter'],
  ['range', 'range'],
  ['loadFonts', 'load-fonts'],
  ['autoRefresh', 'auto-refresh'],
  ['fontBase', 'font-base'],
  ['timezone', 'timezone'],
];

/**
 * Upgrade every `[data-daily-kural]` placeholder into a `<daily-kural>` element.
 * Runs on DOMContentLoaded, or immediately if the document is already loaded.
 */
export function autoInitWidgets() {
  if (typeof document === 'undefined') return;
  const run = () => {
    registerDailyKuralElement();
    const nodes = document.querySelectorAll('[data-daily-kural]');
    nodes.forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      if (node.dataset.dkReady === '1') return;
      node.dataset.dkReady = '1';
      if (node.tagName === 'DAILY-KURAL') return;
      const el = document.createElement('daily-kural');
      for (const [dataKey, attr] of DATA_ATTRS) {
        const value = node.dataset[dataKey];
        if (value != null && value !== '') el.setAttribute(attr, value);
      }
      if ('showTransliteration' in node.dataset) {
        el.setAttribute('show-transliteration', node.dataset.showTransliteration || '');
      }
      if ('showTranslation' in node.dataset) {
        el.setAttribute('show-translation', node.dataset.showTranslation || '');
      }
      if ('showMeta' in node.dataset) el.setAttribute('show-meta', node.dataset.showMeta || '');
      if ('syncUrl' in node.dataset) el.setAttribute('sync-url', '');
      if (!el.hasAttribute('load-fonts')) el.setAttribute('load-fonts', 'google');
      node.replaceChildren(el);
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
}

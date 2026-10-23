import { COMMENTARY_META } from '../constants.js';
import { escapeHtml } from './escape.js';

export { escapeHtml };

/**
 * Decide which pieces of a kural to show.
 * @param {object} [options]
 */
export function resolveView(options = {}) {
  const lang = options.lang === 'ta' || options.lang === 'en' ? options.lang : 'both';
  const commentary = ['mv', 'sp', 'mk', 'all', 'none'].includes(options.commentary) ? options.commentary : 'all';
  const showTransliteration = flag(options.showTransliteration, false);
  const showTranslation = flag(options.showTranslation, true);
  const showMeta = flag(options.showMeta, true);
  let ids = [];
  if (commentary === 'all') ids = ['mv', 'sp', 'mk', 'explanation'];
  else if (commentary !== 'none') ids = [commentary];
  const notes = COMMENTARY_META.filter((note) => ids.includes(note.id));
  return {
    lang,
    commentary,
    showLines: lang !== 'en',
    showEnglish: lang !== 'ta' && showTranslation,
    showTransliteration,
    showMeta,
    notes,
  };
}

function flag(value, fallback) {
  if (value == null || value === '') return fallback;
  if (value === false || value === 'false' || value === '0') return false;
  if (value === true || value === 'true' || value === '1') return true;
  return fallback;
}

/**
 * Escaped HTML for one kural. Safe to insert into the document.
 * @param {object} kural
 * @param {object} [options]
 */
export function renderKuralHTML(kural, options = {}) {
  const view = resolveView(options);
  const parts = ['<article class="dk-kural">'];
  if (view.showMeta) {
    parts.push('<header class="dk-kural-meta">');
    parts.push(`<p class="dk-number">Kural ${escapeHtml(kural.Number)}</p>`);
    parts.push(`<p class="dk-chapter" lang="ta">${escapeHtml(kural.chapter && kural.chapter.name)}</p>`);
    parts.push(
      `<p class="dk-paal" lang="ta">${escapeHtml(kural.paal && kural.paal.name)} · ${escapeHtml(kural.iyal && kural.iyal.name)}</p>`,
    );
    parts.push('</header>');
  }
  if (view.showLines) {
    parts.push(`<p class="dk-line" lang="ta">${escapeHtml(kural.Line1)}</p>`);
    parts.push(`<p class="dk-line" lang="ta">${escapeHtml(kural.Line2)}</p>`);
  }
  if (view.showTransliteration) {
    parts.push(`<p class="dk-translit" lang="en">${escapeHtml(kural.transliteration1)}</p>`);
    parts.push(`<p class="dk-translit" lang="en">${escapeHtml(kural.transliteration2)}</p>`);
  }
  if (view.showEnglish) {
    parts.push(`<p class="dk-translation" lang="en">${escapeHtml(kural.Translation)}</p>`);
    parts.push(`<p class="dk-couplet" lang="en">${escapeHtml(kural.couplet)}</p>`);
  }
  if (view.notes.length) {
    parts.push('<section class="dk-notes">');
    for (const note of view.notes) {
      parts.push(`<h3 lang="${note.lang}">${escapeHtml(note.title)}</h3>`);
      parts.push(`<p lang="${note.lang}">${escapeHtml(kural[note.field])}</p>`);
    }
    parts.push('</section>');
  }
  parts.push('</article>');
  return parts.join('');
}

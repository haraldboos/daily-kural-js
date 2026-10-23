import { collapseSpace } from './text.js';

const FIELD_MAP = {
  line1: ['line1'],
  line2: ['line2'],
  transliteration: ['transliteration1', 'transliteration2'],
  transliteration1: ['transliteration1'],
  transliteration2: ['transliteration2'],
  translation: ['translation'],
  mv: ['mv'],
  sp: ['sp'],
  mk: ['mk'],
  explanation: ['explanation'],
  couplet: ['couplet'],
  commentary: ['mv', 'sp', 'mk'],
  Line1: ['line1'],
  Line2: ['line2'],
  Translation: ['translation'],
};

const DEFAULT_FIELDS = ['line1', 'line2', 'transliteration1', 'transliteration2', 'translation', 'mv', 'sp', 'mk', 'explanation', 'couplet'];

/**
 * @param {Map<number, Record<string, string>>} searchIndex
 * @param {readonly number[]} numbers
 * @param {string} query
 * @param {{ fields?: string[], limit?: number, offset?: number }} [options]
 */
export function searchNumbers(searchIndex, numbers, query, options = {}) {
  const needle = collapseSpace(query);
  if (!needle) {
    return { total: 0, offset: options.offset || 0, limit: options.limit == null ? 20 : options.limit, items: [] };
  }
  const fields = resolveFields(options.fields);
  /** @type {number[]} */
  const hits = [];
  for (const n of numbers) {
    const hay = searchIndex.get(n);
    if (!hay) continue;
    for (let i = 0; i < fields.length; i += 1) {
      if (hay[fields[i]] && hay[fields[i]].includes(needle)) {
        hits.push(n);
        break;
      }
    }
  }
  const offset = options.offset > 0 ? options.offset : 0;
  const limit = options.limit == null ? 20 : options.limit;
  const end = limit < 0 ? hits.length : offset + limit;
  return {
    total: hits.length,
    offset,
    limit,
    items: hits.slice(offset, end),
  };
}

function resolveFields(fields) {
  if (!fields || fields.length === 0) return DEFAULT_FIELDS;
  /** @type {string[]} */
  const out = [];
  for (const field of fields) {
    const mapped = FIELD_MAP[field];
    if (!mapped) continue;
    for (const name of mapped) {
      if (!out.includes(name)) out.push(name);
    }
  }
  return out;
}

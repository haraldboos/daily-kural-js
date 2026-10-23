import { FILTER_KEYS } from './constants.js';
import { DailyKuralError, assertKuralNumber } from './errors.js';
import { asNfc, fold } from './text.js';

/** @type {Map<string, readonly number[]>} */
const cache = new Map();

export function clearFilterCache() {
  cache.clear();
}

/**
 * Parse `paal=1&chapter=5&range=1-50&number=12&numbers=1,5,100&exclude=3,4`.
 * A leading `?` is accepted. Unknown keys are ignored.
 * @param {string} input
 */
export function parseFilterString(input) {
  const out = {};
  if (input == null) return out;
  let text = String(input).trim();
  if (text.startsWith('?')) text = text.slice(1);
  if (!text) return out;
  const parts = text.split('&');
  for (const part of parts) {
    if (!part) continue;
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = decodeToken(part.slice(0, eq));
    if (!FILTER_KEYS.includes(key)) continue;
    const raw = part.slice(eq + 1);
    if (key === 'range') out.range = parseRange(raw);
    else if (key === 'numbers' || key === 'exclude') out[key] = splitList(raw);
    else if (key === 'number') out.number = parseScalar(raw);
    else out[key] = parseMaybeList(raw);
  }
  return out;
}

/**
 * Serialize a filter to the shared string form.
 * `stringifyFilter(parseFilterString(s))` parses back to the same value.
 * @param {object} [filter]
 */
export function stringifyFilter(filter) {
  if (filter == null || filter === '') return '';
  const source = normalizeFilter(filter);
  const parts = [];
  for (const key of FILTER_KEYS) {
    if (source[key] == null || source[key] === '') continue;
    if (Array.isArray(source[key]) && source[key].length === 0) continue;
    parts.push(`${key}=${encodeFilterValue(key, source[key])}`);
  }
  return parts.join('&');
}

/**
 * Resolve a filter to the sorted kural numbers it allows.
 * Repeated calls with the same logical filter return the cached array.
 *
 * Keys combine with AND. `paal`, `iyal` and `chapter` accept a value or an
 * array (OR inside that key). `number` / `numbers` start the candidate set
 * and are still checked against the other keys.
 *
 * @param {object | string | null | undefined} filter
 * @param {{ paals: any[], iyals: any[], chapters: any[], allNumbers: number[] }} catalog
 * @returns {readonly number[]}
 */
export function resolveFilter(filter, catalog) {
  const normalized = normalizeFilter(filter);
  const key = stableStringify(foldFilter(normalized));
  const hit = cache.get(key);
  if (hit) return hit;
  const numbers = computeFilter(normalized, catalog);
  const frozen = Object.freeze(numbers);
  cache.set(key, frozen);
  return frozen;
}

/**
 * Coerce a filter object or string into a validated filter.
 * An empty object means “all kurals” and does not throw.
 * @param {object | string | null | undefined} filter
 */
export function normalizeFilter(filter) {
  if (filter == null || filter === '') return {};
  const source = typeof filter === 'string' ? parseFilterString(filter) : filter;
  if (typeof source !== 'object' || Array.isArray(source)) {
    throw new DailyKuralError('EMPTY_FILTER', 'Filter must be an object or a query string.');
  }
  /** @type {Record<string, any>} */
  const out = {};
  if (source.number != null && source.number !== '') out.number = assertKuralNumber(source.number);
  if (source.numbers != null && source.numbers !== '') {
    const list = asList(source.numbers).map((value) => assertKuralNumber(value));
    out.numbers = dedupe(list);
  }
  if (source.range != null && source.range !== '') {
    const range = Array.isArray(source.range) ? source.range : parseRange(String(source.range));
    if (!Array.isArray(range) || range.length !== 2) {
      throw new DailyKuralError('INVALID_NUMBER', 'A range needs two integers, for example [1, 50] or "1-50".');
    }
    const start = assertKuralNumber(range[0], 'range start');
    const end = assertKuralNumber(range[1], 'range end');
    if (start > end) {
      throw new DailyKuralError('INVALID_NUMBER', `Invalid range ${start}-${end}. Start must be less than or equal to end.`);
    }
    out.range = [start, end];
  }
  for (const key of ['paal', 'iyal', 'chapter']) {
    if (source[key] == null || source[key] === '') continue;
    const list = asList(source[key]).map(canonicalQuery).filter((value) => value !== '');
    if (list.length === 0) {
      out[key] = [];
    } else if (list.length === 1 && !Array.isArray(source[key])) {
      out[key] = list[0];
    } else {
      out[key] = list;
    }
  }
  if (source.exclude != null && source.exclude !== '') {
    out.exclude = dedupe(asList(source.exclude).map((value) => assertKuralNumber(value, 'exclude')));
  }
  return out;
}

/**
 * Chips for the active filter. Labels prefer the Tamil name.
 * @param {object | string | null | undefined} filter
 * @param {{ paals: any[], iyals: any[], chapters: any[] }} catalog
 */
export function describeFilter(filter, catalog) {
  const normalized = normalizeFilter(filter);
  /** @type {{ key: string, value: any, label: string }[]} */
  const chips = [];
  if (normalized.number != null) {
    chips.push({ key: 'number', value: normalized.number, label: `No. ${normalized.number}` });
  }
  if (normalized.numbers) {
    for (const n of normalized.numbers) chips.push({ key: 'numbers', value: n, label: `No. ${n}` });
  }
  if (normalized.range) {
    chips.push({ key: 'range', value: normalized.range, label: `${normalized.range[0]}–${normalized.range[1]}` });
  }
  if (normalized.paal != null) pushCategory(chips, 'paal', normalized.paal, catalog.paals);
  if (normalized.iyal != null) pushCategory(chips, 'iyal', normalized.iyal, catalog.iyals);
  if (normalized.chapter != null) pushCategory(chips, 'chapter', normalized.chapter, catalog.chapters);
  if (normalized.exclude) {
    for (const n of normalized.exclude) chips.push({ key: 'exclude', value: n, label: `exclude ${n}` });
  }
  return chips;
}

/**
 * @param {unknown} query
 * @param {any[]} entries
 * @param {string} kind
 */
export function matchCategories(query, entries, kind) {
  const queries = Array.isArray(query) ? query : [query];
  if (queries.length === 0) {
    throw new DailyKuralError('UNKNOWN_CATEGORY', unknownMessage(kind, query, entries));
  }
  /** @type {any[]} */
  const matched = [];
  for (const item of queries) {
    const hits = entries.filter((entry) => categoryMatches(entry, item));
    if (hits.length === 0) {
      throw new DailyKuralError('UNKNOWN_CATEGORY', unknownMessage(kind, item, entries));
    }
    for (const hit of hits) {
      if (!matched.includes(hit)) matched.push(hit);
    }
  }
  return matched;
}

function computeFilter(filter, catalog) {
  /** @type {number[] | null} */
  let current = null;

  const intersect = (nums) => {
    const set = new Set(nums);
    if (current === null) {
      current = [...set].sort((a, b) => a - b);
    } else {
      current = current.filter((n) => set.has(n));
    }
  };

  if (filter.number != null) intersect([filter.number]);
  if (filter.numbers) intersect(filter.numbers);
  if (filter.range) {
    const span = [];
    for (let n = filter.range[0]; n <= filter.range[1]; n += 1) span.push(n);
    intersect(span);
  }
  if (filter.paal != null) intersect(numbersFor(filter.paal, catalog.paals, 'paal'));
  if (filter.iyal != null) intersect(numbersFor(filter.iyal, catalog.iyals, 'iyal'));
  if (filter.chapter != null) intersect(numbersFor(filter.chapter, catalog.chapters, 'chapter'));

  if (current === null) current = catalog.allNumbers.slice();

  if (filter.exclude && filter.exclude.length) {
    const skip = new Set(filter.exclude);
    current = current.filter((n) => !skip.has(n));
  }

  if (current.length === 0) {
    const printed = stringifyFilter(filter);
    throw new DailyKuralError(
      'EMPTY_FILTER',
      printed
        ? `No kurals match the given filter (${printed}).`
        : 'No kurals match the given filter.',
    );
  }
  return current;
}

function numbersFor(query, entries, kind) {
  const matched = matchCategories(query, entries, kind);
  const set = new Set();
  for (const entry of matched) {
    for (const n of entry.numbers) set.add(n);
  }
  return [...set];
}

function pushCategory(chips, key, query, entries) {
  const queries = Array.isArray(query) ? query : [query];
  for (const value of queries) {
    const match = entries.find((entry) => categoryMatches(entry, value));
    chips.push({ key, value, label: match ? match.name : String(value) });
  }
}

export function categoryMatches(entry, query) {
  if (typeof query === 'number') return entry.number === query;
  const text = asNfc(query).trim();
  if (/^-?\d+$/.test(text)) return entry.number === Number(text);
  const folded = fold(text);
  return fold(entry.name) === folded
    || fold(entry.translation) === folded
    || fold(entry.transliteration) === folded;
}

function unknownMessage(kind, query, entries) {
  const label = kind === 'paal' ? 'paal (பால்)' : kind === 'iyal' ? 'iyal (இயல்)' : 'chapter (அதிகாரம்)';
  const options = entries
    .map((entry) => `${entry.number} ${entry.name} | ${entry.translation} | ${entry.transliteration}`)
    .join('; ');
  return `Unknown ${label} "${query}". Valid options: ${options}`;
}

function canonicalQuery(value) {
  if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new DailyKuralError('INVALID_NUMBER', `Invalid category number: ${value}.`);
    }
    return value;
  }
  const text = asNfc(value).trim();
  if (/^-?\d+$/.test(text)) return Number(text);
  return text;
}

function asList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.includes(',')) return splitList(value);
  return [value];
}

function dedupe(list) {
  const seen = new Set();
  const out = [];
  for (const n of list) {
    if (!seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}

/**
 * Stable cache / daily-seed key. Category text is case-folded and list order
 * does not matter, so `paal: 'Virtue'` and `paal: 'virtue'` share a cycle.
 * @param {object | string | null | undefined} filter
 */
export function filterCacheKey(filter) {
  return stableStringify(foldFilter(normalizeFilter(filter)));
}

function foldFilter(filter) {
  /** @type {Record<string, any>} */
  const out = {};
  for (const key of FILTER_KEYS) {
    if (filter[key] == null) continue;
    if (key === 'paal' || key === 'iyal' || key === 'chapter') {
      const foldOne = (value) => (typeof value === 'number' ? value : fold(value));
      out[key] = Array.isArray(filter[key])
        ? filter[key].map(foldOne).sort(compareQuery)
        : foldOne(filter[key]);
    } else if (key === 'numbers' || key === 'exclude') {
      out[key] = filter[key].slice().sort((a, b) => a - b);
    } else {
      out[key] = filter[key];
    }
  }
  return out;
}

function compareQuery(a, b) {
  const left = typeof a === 'number' ? String(a).padStart(8, '0') : String(a);
  const right = typeof b === 'number' ? String(b).padStart(8, '0') : String(b);
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function encodeFilterValue(key, value) {
  if (key === 'range') return `${value[0]}-${value[1]}`;
  if (key === 'numbers' || key === 'exclude') return value.map((item) => encodeToken(item)).join(',');
  if (Array.isArray(value)) return value.map((item) => encodeToken(item)).join(',');
  return encodeToken(value);
}

function encodeToken(value) {
  return encodeURIComponent(String(value));
}

function decodeToken(value) {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
}

function parseScalar(raw) {
  const text = asNfc(decodeToken(raw)).trim();
  if (/^-?\d+$/.test(text)) return Number(text);
  return text;
}

function splitList(raw) {
  return String(raw)
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => parseScalar(item));
}

function parseMaybeList(raw) {
  if (String(raw).includes(',')) {
    const list = splitList(raw);
    return list.length === 1 ? list[0] : list;
  }
  return parseScalar(raw);
}

function parseRange(raw) {
  const text = decodeToken(String(raw)).trim();
  const match = text.match(/^(-?\d+)\s*[-–—:,]\s*(-?\d+)$/);
  if (!match) {
    throw new DailyKuralError('INVALID_NUMBER', `Invalid range "${raw}". Use start-end, for example 1-50.`);
  }
  return [Number(match[1]), Number(match[2])];
}

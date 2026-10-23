import { KURAL_MAX } from './constants.js';
import { addDays, kuralNumberForDate, localDateISO } from './daily.js';
import { DailyKuralError, assertKuralNumber } from './errors.js';
import {
  describeFilter as describeFilterWithCatalog,
  filterCacheKey,
  matchCategories,
  normalizeFilter,
  parseFilterString,
  resolveFilter as resolveFilterWithCatalog,
  stringifyFilter,
} from './filter.js';
import { searchNumbers } from './search.js';
import { bindDailyPicker, scheduleDaily } from './schedule.js';
import { getCatalog, init, present, toPublicChapter, toPublicIyal, toPublicPaal, useBundledData } from './store.js';

/** @type {Map<string, number[]>} */
const randomHistory = new Map();

export { init, useBundledData, parseFilterString, stringifyFilter, scheduleDaily };

bindDailyPicker((options) => getDaily(options));

/**
 * @param {object | string | null | undefined} filter
 * @returns {readonly number[]}
 */
export function resolveFilter(filter) {
  return resolveFilterWithCatalog(filter, getCatalog());
}

/**
 * @param {object | string | null | undefined} filter
 */
export function describeFilter(filter) {
  return describeFilterWithCatalog(filter, getCatalog());
}

/**
 * @param {number | string} n
 */
export function getByNumber(n) {
  return present(assertKuralNumber(n));
}

/**
 * @param {{ filter?: object | string, avoid?: number | number[] }} [options]
 */
export function getRandom(options = {}) {
  const numbers = resolveFilter(options.filter);
  const key = filterCacheKey(options.filter);
  /** @type {number[]} */
  let banned = [];
  if (Array.isArray(options.avoid)) banned = options.avoid.map((value) => assertKuralNumber(value));
  else if (typeof options.avoid === 'number' && options.avoid > 0) {
    const history = randomHistory.get(key) || [];
    banned = history.slice(-options.avoid);
  }
  const ban = new Set(banned);
  let pool = numbers.filter((n) => !ban.has(n));
  if (pool.length === 0) pool = numbers.slice();
  const n = pool[Math.floor(Math.random() * pool.length)];
  const history = randomHistory.get(key) || [];
  history.push(n);
  const cap = Math.max(numbers.length, 32);
  if (history.length > cap) history.splice(0, history.length - cap);
  randomHistory.set(key, history);
  return present(n);
}

/**
 * Deterministic kural for a civil date inside the filter.
 * @param {{ filter?: object | string, date?: string | Date, timezone?: string, timeZone?: string }} [options]
 */
export function getDaily(options = {}) {
  const numbers = resolveFilter(options.filter);
  const picked = kuralNumberForDate({
    numbers,
    filterKey: filterCacheKey(options.filter),
    date: options.date,
    timeZone: options.timezone || options.timeZone,
  });
  return present(picked.number);
}

/**
 * @param {string | Date} date
 * @param {{ filter?: object | string, timezone?: string, timeZone?: string }} [options]
 */
export function getDailyFor(date, options = {}) {
  return getDaily({ ...options, date });
}

/**
 * @param {{ filter?: object | string, date?: string | Date, timezone?: string, timeZone?: string }} [options]
 */
export function getNextDaily(options = {}) {
  const timeZone = options.timezone || options.timeZone;
  const base = localDateISO(options.date, timeZone);
  return getDaily({ ...options, date: addDays(base, 1) });
}

/**
 * @param {{ filter?: object | string, limit?: number, offset?: number }} [options]
 */
export function list(options = {}) {
  const numbers = resolveFilter(options.filter);
  const offset = options.offset > 0 ? options.offset : 0;
  const limit = options.limit == null ? numbers.length : options.limit;
  const items = numbers.slice(offset, offset + Math.max(0, limit)).map((n) => present(n));
  return { total: numbers.length, offset, limit, items };
}

/**
 * @param {{ filter?: object | string }} [options]
 */
export function count(options = {}) {
  return resolveFilter(options.filter).length;
}

/** @param {number | string} chapter */
export function getByChapter(chapter) {
  return resolveFilter({ chapter }).map((n) => present(n));
}

/** @param {number | string} iyal */
export function getByIyal(iyal) {
  return resolveFilter({ iyal }).map((n) => present(n));
}

/** @param {number | string} paal */
export function getByPaal(paal) {
  return resolveFilter({ paal }).map((n) => present(n));
}

export function listPaals() {
  return getCatalog().paals.map((paal) => toPublicPaal(paal));
}

/** @param {number | string} [paal] */
export function listIyals(paal) {
  const catalog = getCatalog();
  let rows = catalog.iyals;
  if (paal != null && paal !== '') {
    const ids = new Set(matchCategories(paal, catalog.paals, 'paal').map((entry) => entry.number));
    rows = rows.filter((iyal) => ids.has(iyal.paalNumber));
  }
  return rows.map((iyal) => toPublicIyal(iyal));
}

/**
 * @param {{ paal?: number | string, iyal?: number | string }} [options]
 */
export function listChapters(options = {}) {
  const catalog = getCatalog();
  let rows = catalog.chapters;
  if (options.paal != null && options.paal !== '') {
    const ids = new Set(matchCategories(options.paal, catalog.paals, 'paal').map((entry) => entry.number));
    rows = rows.filter((chapter) => ids.has(chapter.paalNumber));
  }
  if (options.iyal != null && options.iyal !== '') {
    const ids = new Set(matchCategories(options.iyal, catalog.iyals, 'iyal').map((entry) => entry.number));
    rows = rows.filter((chapter) => ids.has(chapter.iyalNumber));
  }
  return rows.map((chapter) => toPublicChapter(chapter));
}

/**
 * @param {string} query
 * @param {{ filter?: object | string, fields?: string[], limit?: number, offset?: number }} [options]
 */
export function search(query, options = {}) {
  const catalog = getCatalog();
  const numbers = resolveFilter(options.filter);
  const result = searchNumbers(catalog.searchIndex, numbers, query, options);
  return {
    total: result.total,
    offset: result.offset,
    limit: result.limit,
    items: result.items.map((n) => present(n)),
  };
}

/**
 * @param {number | string} start
 * @param {number | string} end
 */
export function getRange(start, end) {
  const from = assertKuralNumber(start, 'range start');
  const to = assertKuralNumber(end, 'range end');
  if (from > to) {
    throw new DailyKuralError('INVALID_NUMBER', `Invalid range ${from}-${to}. Start must be less than or equal to end.`);
  }
  const items = [];
  for (let n = from; n <= to; n += 1) items.push(present(n));
  return items;
}

/**
 * Next kural inside the filter, wrapping to the first.
 * @param {number | string} n
 * @param {{ filter?: object | string }} [options]
 */
export function next(n, options = {}) {
  return step(n, options, 1);
}

/**
 * Previous kural inside the filter, wrapping to the last.
 * @param {number | string} n
 * @param {{ filter?: object | string }} [options]
 */
export function prev(n, options = {}) {
  return step(n, options, -1);
}

function step(n, options, direction) {
  const numbers = resolveFilter(options.filter);
  const current = assertKuralNumber(n);
  const index = numbers.indexOf(current);
  if (index === -1) {
    if (direction > 0) {
      const higher = numbers.find((value) => value > current);
      return present(higher == null ? numbers[0] : higher);
    }
    let lower = null;
    for (let i = numbers.length - 1; i >= 0; i -= 1) {
      if (numbers[i] < current) {
        lower = numbers[i];
        break;
      }
    }
    return present(lower == null ? numbers[numbers.length - 1] : lower);
  }
  const nextIndex = (index + direction + numbers.length) % numbers.length;
  return present(numbers[nextIndex]);
}

/**
 * @param {'paal' | 'iyal' | 'chapter'} kind
 * @param {number | string | null | undefined} query
 */
export function findCategory(kind, query) {
  if (query == null || query === '' || Array.isArray(query)) return null;
  const catalog = getCatalog();
  const entries = kind === 'paal' ? catalog.paals : kind === 'iyal' ? catalog.iyals : catalog.chapters;
  try {
    const hit = matchCategories(query, entries, kind)[0];
    if (!hit) return null;
    if (kind === 'chapter') return toPublicChapter(hit);
    if (kind === 'iyal') return toPublicIyal(hit);
    return toPublicPaal(hit);
  } catch (err) {
    if (err instanceof DailyKuralError && err.code === 'UNKNOWN_CATEGORY') return null;
    throw err;
  }
}

export { normalizeFilter, KURAL_MAX };

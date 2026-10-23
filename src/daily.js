import { DailyKuralError } from './errors.js';
import { EPOCH } from './constants.js';

export { EPOCH };

/**
 * Days from 2024-01-01 to an ISO civil date. Negative before the epoch.
 * @param {string} iso
 */
export function daysSinceEpoch(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  const [y0, m0, d0] = EPOCH.split('-').map(Number);
  const ms = Date.UTC(year, month - 1, day) - Date.UTC(y0, m0 - 1, d0);
  return Math.round(ms / 86400000);
}

/**
 * @param {string} iso
 * @param {number} days
 */
export function addDays(iso, days) {
  const [year, month, day] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day + days));
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * @param {Date} date
 * @param {string | undefined} timeZone
 */
export function zonedParts(date, timeZone) {
  let fmt;
  try {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || undefined,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (err) {
    throw new DailyKuralError('DATA', `Invalid timezone: ${timeZone}`);
  }
  /** @type {Record<string, string>} */
  const parts = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== 'literal') parts[part.type] = part.value;
  }
  let hour = Number(parts.hour);
  if (hour === 24) hour = 0;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour,
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/**
 * A `YYYY-MM-DD` string is already a civil date and is not shifted.
 * A Date is read in `timeZone` (or the runtime local zone).
 * @param {string | Date | undefined | null} date
 * @param {string | undefined} timeZone
 */
export function localDateISO(date, timeZone) {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) return date.trim();
  const value = date instanceof Date ? date : new Date();
  if (Number.isNaN(value.getTime())) {
    throw new DailyKuralError('DATA', `Invalid date: ${date}`);
  }
  const parts = zonedParts(value, timeZone);
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${parts.year}-${month}-${day}`;
}

/** FNV-1a, 32-bit. Stable across JS engines. */
export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 PRNG. Returns floats in [0, 1). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher–Yates shuffle driven by mulberry32.
 * @param {readonly number[]} items
 * @param {number} seed
 */
export function seededShuffle(items, seed) {
  const copy = items.slice();
  const rand = mulberry32(seed);
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

/** @type {Map<string, number[]>} */
const shuffleCache = new Map();

export function clearDailyCache() {
  shuffleCache.clear();
}

/**
 * Deterministic kural of the day inside a filtered set.
 * The cycle length is the set size, so a cycle shows every kural once.
 * Seed = hash(filterKey + '#' + cycleNumber). Epoch is 2024-01-01.
 *
 * @param {{ numbers: readonly number[], filterKey: string, date?: string | Date, timeZone?: string }} args
 */
export function kuralNumberForDate(args) {
  const iso = localDateISO(args.date, args.timeZone);
  const day = daysSinceEpoch(iso);
  const size = args.numbers.length;
  if (size === 0) {
    throw new DailyKuralError('EMPTY_FILTER', 'No kurals match the given filter.');
  }
  const cycle = Math.floor(day / size);
  const index = ((day % size) + size) % size;
  const cacheKey = `${args.filterKey}#${cycle}`;
  let order = shuffleCache.get(cacheKey);
  if (!order) {
    const seed = hashString(`${args.filterKey}#${cycle}`);
    order = seededShuffle(args.numbers, seed);
    shuffleCache.set(cacheKey, order);
  }
  return {
    number: order[index],
    date: iso,
    cycle,
    index,
    epoch: EPOCH,
  };
}

/**
 * Milliseconds until the next HH:MM in a timezone.
 * @param {number} hours
 * @param {number} minutes
 * @param {string | undefined} timeZone
 * @param {Date} [now]
 */
export function msUntilClock(hours, minutes, timeZone, now = new Date()) {
  const parts = zonedParts(now, timeZone);
  const current = parts.hour * 3600 + parts.minute * 60 + parts.second;
  const target = hours * 3600 + minutes * 60;
  let delta = target - current;
  if (delta <= 0) delta += 24 * 3600;
  return delta * 1000;
}

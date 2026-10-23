import { beforeAll, describe, expect, it } from 'vitest';
import { ready } from './helpers.js';

/** @type {typeof import('../src/index.js').DailyKural} */
let api;

beforeAll(async () => {
  api = await ready();
});

describe('search', () => {
  it('finds Tamil and English inside a filter', () => {
    const kural = api.getByNumber(1);
    const tamil = api.search(kural.Line1, { filter: { chapter: 1 }, limit: 10 });
    expect(tamil.items.some((item) => item.Number === 1)).toBe(true);
    const blocked = api.search(kural.Line1, { filter: { chapter: 133 }, limit: 50 });
    expect(blocked.items.some((item) => item.Number === 1)).toBe(false);

    const english = api.search('ETERNAL GOD', { filter: { paal: 1 }, fields: ['explanation'] });
    expect(english.items.some((item) => item.Number === 1)).toBe(true);
    const linesOnly = api.search('eternal God', { filter: { paal: 1 }, fields: ['line1'] });
    expect(linesOnly.items.some((item) => item.Number === 1)).toBe(false);
  });

  it('returns an empty page for a blank query', () => {
    expect(api.search('   ', { limit: 5 })).toEqual({ total: 0, offset: 0, limit: 5, items: [] });
  });
});

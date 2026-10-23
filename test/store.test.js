import { afterEach, describe, expect, it } from 'vitest';
import { DailyKural } from '../src/index.js';
import { PRIMARY_DETAIL_URL, PRIMARY_KURAL_URL } from '../src/constants.js';
import { fixture } from './helpers.js';

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('KuralStore', () => {
  it('loads in-memory data without fetching', async () => {
    let called = false;
    globalThis.fetch = async () => {
      called = true;
      throw new Error('network should not be used');
    };
    const { data, detail } = fixture();
    const info = await DailyKural.init({ data, detail, cache: false, force: true });
    expect(called).toBe(false);
    expect(info.count).toBe(1330);
    expect(DailyKural.getByNumber(1).chapter.name).toBe('கடவுள் வாழ்த்து');
  });

  it('reads local JSON files in Node', async () => {
    const info = await DailyKural.init({
      source: 'file',
      dataPath: new URL('../data/thirukkural.json', import.meta.url),
      detailPath: new URL('../data/detail.json', import.meta.url),
      cache: false,
      force: true,
    });
    expect(info.source).toBe('file');
    expect(DailyKural.getByNumber(1330).chapter.number).toBe(133);
  });

  it('falls back to jsDelivr when the raw GitHub URL fails', async () => {
    const { data, detail } = fixture();
    /** @type {string[]} */
    const calls = [];
    globalThis.fetch = async (url) => {
      const href = String(url);
      calls.push(href);
      if (href.includes('raw.githubusercontent.com')) {
        throw new Error('network down');
      }
      return {
        ok: true,
        status: 200,
        json: async () => (href.includes('detail.json') ? detail : data),
      };
    };
    const info = await DailyKural.init({ cache: false, force: true, source: 'network' });
    expect(info.source).toBe('network');
    expect(DailyKural.getByNumber(1).Line1).toContain('அகர');
    expect(calls.some((href) => href === PRIMARY_KURAL_URL || href.includes('raw.githubusercontent.com'))).toBe(true);
    expect(calls.some((href) => href.includes('cdn.jsdelivr.net'))).toBe(true);
    expect(calls.some((href) => href === PRIMARY_DETAIL_URL || href.includes('detail.json'))).toBe(true);
  });
});

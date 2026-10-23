/**
 * Test helper. Serves the repo's JSON to DailyKural.init() so doc samples
 * can run without downloading the dataset once per sample.
 * A separate check still calls the real pinned URLs.
 */
import { readFileSync } from 'node:fs';

const data = readFileSync(new URL('../data/thirukkural.json', import.meta.url), 'utf8');
const detail = readFileSync(new URL('../data/detail.json', import.meta.url), 'utf8');

globalThis.fetch = async (url) => {
  const href = String(url);
  const body = href.includes('detail.json') ? detail : data;
  return {
    ok: true,
    status: 200,
    json: async () => JSON.parse(body),
  };
};

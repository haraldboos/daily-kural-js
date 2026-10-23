import { readFileSync } from 'node:fs';
import { DailyKural } from '../src/index.js';

export function fixture() {
  const data = JSON.parse(readFileSync(new URL('../data/thirukkural.json', import.meta.url), 'utf8'));
  const detail = JSON.parse(readFileSync(new URL('../data/detail.json', import.meta.url), 'utf8'));
  return { data, detail };
}

export async function ready() {
  const { data, detail } = fixture();
  await DailyKural.init({ data, detail, cache: false, force: true });
  return DailyKural;
}

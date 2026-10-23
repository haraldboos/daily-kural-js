import { beforeAll, describe, expect, it } from 'vitest';
import { ready } from './helpers.js';

/** @type {typeof import('../src/index.js').DailyKural} */
let api;

beforeAll(async () => {
  api = await ready();
});

describe('catalog join', () => {
  it('attaches chapter, iyal, and paal for 1, 10, 11, and 1330', () => {
    const first = api.getByNumber(1);
    expect(first.Line1).toBe('அகர முதல எழுத்தெல்லாம் ஆதி');
    expect(first.Line1.normalize('NFC')).toBe(first.Line1);
    expect(first.chapter).toMatchObject({
      name: 'கடவுள் வாழ்த்து',
      translation: 'The Praise of God',
      transliteration: 'Katavul Vaazhththu',
      number: 1,
      start: 1,
      end: 10,
    });
    expect(first.iyal).toMatchObject({ name: 'பாயிரவியல்', translation: 'Prologue', number: 1 });
    expect(first.paal).toMatchObject({ name: 'அறத்துப்பால்', translation: 'Virtue', number: 1 });

    expect(api.getByNumber(10).chapter.number).toBe(1);
    expect(api.getByNumber(11).chapter).toMatchObject({
      name: 'வான்சிறப்பு',
      number: 2,
      start: 11,
      end: 20,
    });
    const last = api.getByNumber(1330);
    expect(last.chapter).toMatchObject({
      name: 'ஊடலுவகை',
      number: 133,
      start: 1321,
      end: 1330,
    });
    expect(last.iyal.name).toBe('கற்பியல்');
    expect(last.paal.name).toBe('காமத்துப்பால்');
    expect(last.Line1.normalize('NFC')).toBe(last.Line1);
  });

  it('lists the three paals, iyals, and chapters', () => {
    const paals = api.listPaals();
    expect(paals.map((paal) => paal.number)).toEqual([1, 2, 3]);
    expect(paals.reduce((sum, paal) => sum + paal.count, 0)).toBe(1330);
    expect(api.listIyals().length).toBe(13);
    expect(api.listIyals(1).every((iyal) => iyal.paalNumber === 1)).toBe(true);
    const chapters = api.listChapters({ iyal: 1 });
    expect(chapters.length).toBe(4);
    expect(chapters[0]).toMatchObject({ number: 1, start: 1, end: 10 });
    expect(api.listChapters().length).toBe(133);
  });
});

describe('navigation and list', () => {
  it('wraps next and prev inside the filter', () => {
    expect(api.next(1330).Number).toBe(1);
    expect(api.prev(1).Number).toBe(1330);
    expect(api.next(10, { filter: { chapter: 1 } }).Number).toBe(1);
    expect(api.prev(1, { filter: { chapter: 1 } }).Number).toBe(10);
    expect(api.next(5, { filter: { numbers: [1, 5, 100] } }).Number).toBe(100);
    expect(api.next(100, { filter: { numbers: [1, 5, 100] } }).Number).toBe(1);
    expect(api.prev(1, { filter: { numbers: [1, 5, 100] } }).Number).toBe(100);
  });

  it('paginates list and returns ranges', () => {
    const page = api.list({ filter: { chapter: 1 }, limit: 3, offset: 2 });
    expect(page.total).toBe(10);
    expect(page.items.map((kural) => kural.Number)).toEqual([3, 4, 5]);
    expect(api.getRange(1, 10).map((kural) => kural.Number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(api.getRange(1330, 1330)).toHaveLength(1);
    expect(api.getByChapter(1)).toHaveLength(10);
    expect(api.getByIyal('prologue')).toHaveLength(40);
    expect(api.getByPaal('Virtue').length).toBe(api.listPaals()[0].count);
  });
});

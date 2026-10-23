import { beforeAll, describe, expect, it } from 'vitest';
import { DailyKuralError } from '../src/errors.js';
import { ready } from './helpers.js';

/** @type {typeof import('../src/index.js').DailyKural} */
let api;

beforeAll(async () => {
  api = await ready();
});

describe('resolveFilter', () => {
  it('returns every kural when the filter is empty', () => {
    expect(api.resolveFilter({}).length).toBe(1330);
    expect(api.resolveFilter().length).toBe(1330);
    expect(api.count()).toBe(1330);
  });

  it('matches paal by number, Tamil name, translation, and transliteration', () => {
    const byNumber = api.resolveFilter({ paal: 1 });
    const byName = api.resolveFilter({ paal: 'அறத்துப்பால்' });
    const byTranslation = api.resolveFilter({ paal: 'Virtue' });
    const byTranslit = api.resolveFilter({ paal: 'Araththuppaal' });
    expect(byName).toEqual(byNumber);
    expect(byTranslation).toEqual(byNumber);
    expect(byTranslit).toEqual(byNumber);
    expect(api.resolveFilter({ paal: '  virtue  ' })).toBe(api.resolveFilter({ paal: 'VIRTUE' }));
    const paals = api.listPaals();
    expect(byNumber.length).toBe(paals[0].count);
  });

  it('matches iyal and chapter the same way', () => {
    const chapter = [...api.resolveFilter({ chapter: 'கடவுள் வாழ்த்து' })];
    expect(chapter).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect([...api.resolveFilter({ chapter: 'the praise of god' })]).toEqual(chapter);
    expect([...api.resolveFilter({ chapter: 'Katavul Vaazhththu' })]).toEqual(chapter);
    expect([...api.resolveFilter({ chapter: 1 })]).toEqual(chapter);
    expect(api.resolveFilter({ iyal: 'prologue' }).length).toBe(40);
    expect(api.resolveFilter({ iyal: 'பாயிரவியல்' }).length).toBe(40);
    expect(api.resolveFilter({ iyal: 'Paayiraviyal' }).length).toBe(40);
    expect([...api.resolveFilter({ iyal: 1 })]).toEqual([...api.resolveFilter({ iyal: 'prologue' })]);
  });

  it('treats an array as OR inside one key', () => {
    const paals = api.listPaals();
    expect(api.count({ filter: { paal: [1, 3] } })).toBe(paals[0].count + paals[2].count);
    expect(api.count({ filter: { chapter: [1, 2] } })).toBe(20);
  });

  it('combines keys with AND and still checks number against the rest', () => {
    expect([...api.resolveFilter({ number: 12, numbers: [1, 12, 50], range: [10, 20], paal: 1 })]).toEqual([12]);
    expect([...api.resolveFilter({ number: 12, range: [1, 50] })]).toEqual([12]);
    expect(api.count({ filter: { paal: 1, range: [1, 25] } })).toBe(25);
    expect([...api.resolveFilter({ range: [1, 5], exclude: [2, 4] })]).toEqual([1, 3, 5]);
    expect([...api.resolveFilter({ numbers: [1, 11, 1330], paal: 1 })]).toEqual([1, 11]);
    expect([...api.resolveFilter({ numbers: [1, 5, 100], exclude: [5] })]).toEqual([1, 100]);
    expect([...api.resolveFilter({ chapter: 2, number: 12 })]).toEqual([12]);
  });

  it('caches identical logical filters', () => {
    expect(api.resolveFilter({ paal: 'Virtue' })).toBe(api.resolveFilter({ paal: 'virtue' }));
    expect(api.resolveFilter({ numbers: [100, 1] })).toBe(api.resolveFilter({ numbers: [1, 100] }));
  });

  it('throws EMPTY_FILTER when nothing is left', () => {
    expect(() => api.resolveFilter({ paal: 1, chapter: 133 })).toThrow(DailyKuralError);
    expect(() => api.resolveFilter({ number: 12, chapter: 1 })).toThrow(DailyKuralError);
    expect(() => api.resolveFilter({ range: [1, 5], exclude: [1, 2, 3, 4, 5] })).toThrow(DailyKuralError);
    try {
      api.resolveFilter({ number: 1, chapter: 2 });
    } catch (err) {
      expect(err.code).toBe('EMPTY_FILTER');
      expect(err.message).toMatch(/No kurals match/);
    }
  });

  it('throws INVALID_NUMBER for values outside 1..1330', () => {
    for (const filter of [
      { number: 0 },
      { number: 1331 },
      { number: 1.5 },
      { number: 'nope' },
      { numbers: [1, 2000] },
      { range: [0, 10] },
      { range: '10-1' },
      { exclude: [1400] },
    ]) {
      try {
        api.resolveFilter(filter);
        throw new Error(`expected throw for ${JSON.stringify(filter)}`);
      } catch (err) {
        expect(err).toBeInstanceOf(DailyKuralError);
        expect(err.code).toBe('INVALID_NUMBER');
      }
    }
    expect(() => api.getByNumber(1331)).toThrow(DailyKuralError);
    expect(() => api.getByNumber(0)).toThrow(DailyKuralError);
  });

  it('throws UNKNOWN_CATEGORY and lists valid options', () => {
    try {
      api.resolveFilter({ paal: 'nope' });
      throw new Error('expected throw');
    } catch (err) {
      expect(err.code).toBe('UNKNOWN_CATEGORY');
      expect(err.message).toContain('அறத்துப்பால்');
      expect(err.message).toContain('Virtue');
      expect(err.message).toContain('Araththuppaal');
      expect(err.message).toContain('பொருட்பால்');
      expect(err.message).toContain('காமத்துப்பால்');
    }
    expect(() => api.resolveFilter({ iyal: 99 })).toThrow(DailyKuralError);
    try {
      api.resolveFilter({ chapter: 'missing-chapter' });
    } catch (err) {
      expect(err.code).toBe('UNKNOWN_CATEGORY');
      expect(err.message).toContain('கடவுள் வாழ்த்து');
    }
    expect(() => api.resolveFilter({ paal: [1, 'nope'] })).toThrow(DailyKuralError);
  });
});

describe('filter strings', () => {
  it('parses the documented query form', () => {
    expect(api.parseFilterString('paal=1&chapter=5&range=1-50&number=12&numbers=1,5,100&exclude=3,4')).toEqual({
      paal: 1,
      chapter: 5,
      range: [1, 50],
      number: 12,
      numbers: [1, 5, 100],
      exclude: [3, 4],
    });
    expect(api.parseFilterString('?paal=1')).toEqual({ paal: 1 });
  });

  it('round-trips objects and strings', () => {
    const samples = [
      { number: 12, numbers: [1, 5, 100], range: [1, 50], paal: 1, chapter: 5, exclude: [3, 4] },
      { paal: 'அறத்துப்பால்', iyal: ['பாயிரவியல்', 2], chapter: 'The Praise of God' },
      { numbers: [10, 20], exclude: [10] },
    ];
    for (const sample of samples) {
      expect(api.parseFilterString(api.stringifyFilter(sample))).toEqual(sample);
      expect(api.stringifyFilter(api.parseFilterString(api.stringifyFilter(sample)))).toBe(api.stringifyFilter(sample));
    }
    const printed = api.stringifyFilter(api.parseFilterString('paal=1&chapter=5&range=1-50&number=12&numbers=1,5,100&exclude=3,4'));
    expect(printed).toBe('number=12&numbers=1,5,100&range=1-50&paal=1&chapter=5&exclude=3,4');
    expect(api.parseFilterString(printed)).toEqual(api.parseFilterString('paal=1&chapter=5&range=1-50&number=12&numbers=1,5,100&exclude=3,4'));
  });
});

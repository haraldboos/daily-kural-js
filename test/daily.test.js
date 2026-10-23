import { beforeAll, describe, expect, it, vi } from 'vitest';
import { addDays } from '../src/daily.js';
import { ready } from './helpers.js';

/** @type {typeof import('../src/index.js').DailyKural} */
let api;

beforeAll(async () => {
  api = await ready();
});

describe('kural of the day', () => {
  it('is deterministic for a date and timezone', () => {
    const a = api.getDaily({ date: '2024-01-01', timezone: 'UTC' });
    const b = api.getDaily({ date: '2024-01-01', timezone: 'UTC' });
    expect(a.Number).toBe(b.Number);
    expect(api.getDailyFor('2024-01-01', { timezone: 'UTC' }).Number).toBe(a.Number);
    expect(api.getNextDaily({ date: '2024-01-01', timezone: 'UTC' }).Number)
      .toBe(api.getDaily({ date: '2024-01-02', timezone: 'UTC' }).Number);
  });

  it('does not repeat inside a full cycle', () => {
    const seen = new Set();
    for (let day = 0; day < 1330; day += 1) {
      seen.add(api.getDaily({ date: addDays('2024-01-01', day), timezone: 'UTC' }).Number);
    }
    expect(seen.size).toBe(1330);
  });

  it('does not repeat inside a filtered cycle', () => {
    const seen = new Set();
    for (let day = 0; day < 10; day += 1) {
      const number = api.getDaily({
        date: addDays('2024-01-01', day),
        timezone: 'UTC',
        filter: { chapter: 1 },
      }).Number;
      seen.add(number);
      expect(number).toBeGreaterThanOrEqual(1);
      expect(number).toBeLessThanOrEqual(10);
    }
    expect(seen.size).toBe(10);
    const nextCycle = api.getDaily({
      date: addDays('2024-01-01', 10),
      timezone: 'UTC',
      filter: { chapter: 1 },
    }).Number;
    expect(nextCycle).toBeGreaterThanOrEqual(1);
    expect(nextCycle).toBeLessThanOrEqual(10);
  });

  it('reads a Date in the requested timezone', () => {
    const instant = new Date('2024-01-01T23:30:00Z');
    expect(api.getDaily({ date: instant, timezone: 'Asia/Kolkata' }).Number)
      .toBe(api.getDaily({ date: '2024-01-02', timezone: 'UTC' }).Number);
    expect(api.getDaily({ date: instant, timezone: 'UTC' }).Number)
      .toBe(api.getDaily({ date: '2024-01-01', timezone: 'UTC' }).Number);
  });

  it('fires scheduleDaily at the requested local time', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T05:59:00Z'));
    const calls = [];
    const cancel = api.scheduleDaily((kural) => {
      calls.push(kural.Number);
    }, { at: '06:00', timezone: 'UTC', filter: { number: 8 } });
    await vi.advanceTimersByTimeAsync(61 * 1000);
    cancel();
    vi.useRealTimers();
    expect(calls).toEqual([8]);
  });
});

describe('random', () => {
  it('avoids the numbers it was given', () => {
    const seen = [];
    for (let i = 0; i < 10; i += 1) {
      const kural = api.getRandom({ filter: { chapter: 1 }, avoid: seen.slice() });
      expect(seen).not.toContain(kural.Number);
      seen.push(kural.Number);
    }
    expect(new Set(seen).size).toBe(10);
  });

  it('uses the avoid count against recent picks', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const first = api.getRandom({ filter: { numbers: [4, 5, 6] }, avoid: 1 });
    const second = api.getRandom({ filter: { numbers: [4, 5, 6] }, avoid: 1 });
    spy.mockRestore();
    expect(first.Number).not.toBe(second.Number);
  });
});

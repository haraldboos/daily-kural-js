import { afterEach, describe, expect, it } from 'vitest';
import { main } from '../src/cli.js';

describe('daily-kural CLI', () => {
  /** @type {typeof console.log} */
  let log;
  /** @type {typeof console.error} */
  let error;
  /** @type {string[]} */
  let logs;
  /** @type {string[]} */
  let errors;

  afterEach(() => {
    console.log = log;
    console.error = error;
  });

  function capture() {
    logs = [];
    errors = [];
    log = console.log;
    error = console.error;
    console.log = (...args) => logs.push(args.map(String).join(' '));
    console.error = (...args) => errors.push(args.map(String).join(' '));
  }

  it('prints kural 1 in Tamil', async () => {
    capture();
    const code = await main(['node', 'daily-kural', 'number', '1', '--lang', 'ta']);
    expect(code).toBe(0);
    expect(logs.join('\n')).toContain('அகர முதல எழுத்தெல்லாம் ஆதி');
  });

  it('lists an iyal as JSON', async () => {
    capture();
    const code = await main(['node', 'daily-kural', 'list', '--iyal', '1', '--limit', '2', '--json']);
    expect(code).toBe(0);
    const parsed = JSON.parse(logs.join('\n'));
    expect(parsed.total).toBe(40);
    expect(parsed.items).toHaveLength(2);
    expect(parsed.items[0].Number).toBe(1);
  });

  it('searches inside a paal', async () => {
    capture();
    const code = await main(['node', 'daily-kural', 'search', 'அகர', '--paal', 'அறத்துப்பால்', '--json', '--limit', '5']);
    expect(code).toBe(0);
    const parsed = JSON.parse(logs.join('\n'));
    expect(parsed.items.some((item) => item.Number === 1)).toBe(true);
  });

  it('returns a non-zero code for an invalid number', async () => {
    capture();
    const code = await main(['node', 'daily-kural', 'number', '9999']);
    expect(code).toBe(1);
    expect(errors.join('\n')).toContain('INVALID_NUMBER');
  });
});

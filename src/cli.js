import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  count,
  getByNumber,
  getDaily,
  getRandom,
  init,
  list,
  search,
} from './api.js';
import { parseFilterString } from './filter.js';

const HELP = `daily-kural — Thirukkural in the terminal

Usage
  daily-kural daily [filters]
  daily-kural random [filters]
  daily-kural number <1-1330> [filters]
  daily-kural search <text> [filters]
  daily-kural list [filters]

Filters (combined with AND; repeatable values use commas)
  --paal <name|translation|transliteration|number>
  --iyal <name|translation|transliteration|number>
  --chapter <name|translation|transliteration|number>
  --range 1-50
  --number 12
  --numbers 1,5,100
  --exclude 3,4
  --filter paal=1&chapter=5

Options
  --lang ta|en|both          default both
  --commentary mv|sp|mk|all|none
  --json
  --date YYYY-MM-DD          daily only
  --timezone <IANA name>     daily only
  --limit <n>                list and search
  --offset <n>               list and search
  --fields line1,translation search fields
  --avoid <n>                random: skip the last n shown this run
`;

/**
 * @param {string[]} [argv]
 * @returns {Promise<number>}
 */
export async function main(argv = process.argv) {
  try {
    return await run(argv);
  } catch (err) {
    const code = err && err.code ? err.code : 'ERROR';
    console.error(`${code}: ${err && err.message ? err.message : err}`);
    return 1;
  }
}

async function run(argv) {
  const parsed = parseArgs(argv.slice(2));
  if (!parsed.cmd || parsed.cmd === 'help' || parsed.flags.help) {
    console.log(HELP);
    return parsed.cmd ? 0 : 1;
  }
  await loadData();
  const filter = filterFromFlags(parsed.flags);
  const lang = parsed.flags.lang || 'both';
  const commentary = parsed.flags.commentary || 'none';
  const asJson = Boolean(parsed.flags.json);

  if (parsed.cmd === 'daily') {
    const kural = getDaily({
      filter,
      date: parsed.flags.date,
      timezone: parsed.flags.timezone,
    });
    console.log(asJson ? JSON.stringify(kural, null, 2) : formatKural(kural, { lang, commentary }));
    return 0;
  }
  if (parsed.cmd === 'random') {
    const avoid = parsed.flags.avoid != null ? Number(parsed.flags.avoid) : 8;
    const kural = getRandom({ filter, avoid });
    console.log(asJson ? JSON.stringify(kural, null, 2) : formatKural(kural, { lang, commentary }));
    return 0;
  }
  if (parsed.cmd === 'number') {
    const raw = parsed.positionals[0] || parsed.flags.number;
    const kural = getByNumber(raw);
    console.log(asJson ? JSON.stringify(kural, null, 2) : formatKural(kural, { lang, commentary }));
    return 0;
  }
  if (parsed.cmd === 'search') {
    const query = parsed.positionals.join(' ');
    if (!query) {
      console.error('ERROR: search needs text. Example: daily-kural search அகர --paal 1');
      return 1;
    }
    const fields = parsed.flags.fields ? String(parsed.flags.fields).split(',') : undefined;
    const result = search(query, {
      filter,
      fields,
      limit: parsed.flags.limit != null ? Number(parsed.flags.limit) : 20,
      offset: parsed.flags.offset != null ? Number(parsed.flags.offset) : 0,
    });
    if (asJson) console.log(JSON.stringify(result, null, 2));
    else {
      console.log(`${result.total} match${result.total === 1 ? '' : 'es'}`);
      for (const kural of result.items) console.log(formatKural(kural, { lang, commentary }));
    }
    return 0;
  }
  if (parsed.cmd === 'list') {
    const result = list({
      filter,
      limit: parsed.flags.limit != null ? Number(parsed.flags.limit) : undefined,
      offset: parsed.flags.offset != null ? Number(parsed.flags.offset) : 0,
    });
    if (asJson) console.log(JSON.stringify(result, null, 2));
    else {
      console.log(`${result.total} kural${result.total === 1 ? '' : 's'}`);
      for (const kural of result.items) {
        const line = lang === 'en' ? kural.Translation : kural.Line1;
        console.log(`${kural.Number}. ${line}`);
      }
    }
    return 0;
  }
  if (parsed.cmd === 'count') {
    const total = count({ filter });
    console.log(asJson ? JSON.stringify({ total }) : String(total));
    return 0;
  }
  console.error(`ERROR: Unknown command "${parsed.cmd}".\n`);
  console.error(HELP);
  return 1;
}

async function loadData() {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const dir = join(here, '..', 'data');
    const data = JSON.parse(readFileSync(join(dir, 'thirukkural.json'), 'utf8'));
    const detail = JSON.parse(readFileSync(join(dir, 'detail.json'), 'utf8'));
    await init({ data, detail, cache: false, force: true });
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      await init({ cache: false, force: true });
      return;
    }
    throw err;
  }
}

/**
 * @param {string[]} args
 */
export function parseArgs(args) {
  /** @type {Record<string, string | boolean>} */
  const flags = {};
  /** @type {string[]} */
  const positionals = [];
  const cmd = args[0] && !args[0].startsWith('--') ? args[0] : '';
  const start = cmd ? 1 : 0;
  for (let i = start; i < args.length; i += 1) {
    const token = args[i];
    if (token.startsWith('--')) {
      const body = token.slice(2);
      const eq = body.indexOf('=');
      if (eq !== -1) flags[body.slice(0, eq)] = body.slice(eq + 1);
      else {
        const next = args[i + 1];
        if (next == null || next.startsWith('--')) flags[body] = true;
        else {
          flags[body] = next;
          i += 1;
        }
      }
    } else positionals.push(token);
  }
  return { cmd, flags, positionals };
}

/**
 * @param {Record<string, string | boolean>} flags
 */
export function filterFromFlags(flags) {
  /** @type {Record<string, any>} */
  const filter = flags.filter ? parseFilterString(String(flags.filter)) : {};
  for (const key of ['paal', 'iyal', 'chapter', 'range', 'number', 'numbers', 'exclude']) {
    if (flags[key] == null || flags[key] === true) continue;
    const parsed = parseFilterString(`${key}=${flags[key]}`);
    if (parsed[key] != null) filter[key] = parsed[key];
  }
  return filter;
}

/**
 * @param {object} kural
 * @param {{ lang: string, commentary: string }} options
 */
export function formatKural(kural, options) {
  const lines = [];
  lines.push(`${kural.Number}. ${kural.chapter.name} — ${kural.chapter.translation}`);
  lines.push(`${kural.paal.name} · ${kural.iyal.name}`);
  lines.push('');
  if (options.lang !== 'en') {
    lines.push(kural.Line1);
    lines.push(kural.Line2);
    lines.push('');
  }
  if (options.lang !== 'ta') {
    lines.push(kural.transliteration1);
    lines.push(kural.transliteration2);
    lines.push('');
    lines.push(kural.Translation);
    if (kural.couplet) lines.push(kural.couplet);
    lines.push('');
  }
  const ids = options.commentary === 'all'
    ? ['mv', 'sp', 'mk', 'explanation']
    : options.commentary && options.commentary !== 'none'
      ? [options.commentary]
      : [];
  const titles = {
    mv: 'மு. வரதராசனார்',
    sp: 'சாலமன் பாப்பையா',
    mk: 'மு. கருணாநிதி',
    explanation: 'English explanation',
  };
  for (const id of ids) {
    if (!kural[id]) continue;
    lines.push(titles[id] || id);
    lines.push(kural[id]);
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

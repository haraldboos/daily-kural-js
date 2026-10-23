# API reference

`daily-kural-js` exports a `DailyKural` object and the same functions as named exports. Call `init` once before any function that reads a kural.

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
```

In the browser bundle, the same object is `window.DailyKural`. The script also registers `<daily-kural>`.

Errors are `DailyKuralError`. `error.code` is one of `NOT_READY`, `INVALID_NUMBER`, `UNKNOWN_CATEGORY`, `EMPTY_FILTER`, `NETWORK`, or `DATA`.

A kural object keeps the source fields and adds the section it belongs to:

| Field | Meaning |
| --- | --- |
| `Number` | 1–1330 |
| `Line1`, `Line2` | Tamil lines |
| `Translation` | English prose |
| `transliteration1`, `transliteration2` | Roman spelling |
| `couplet` | English verse |
| `mv`, `sp`, `mk` | Tamil commentaries |
| `explanation` | English explanation |
| `chapter`, `iyal`, `paal` | `{ name, translation, transliteration, number, count }` |

`chapter` also has `start`, `end`, `paalNumber`, and `iyalNumber`. `iyal` has `paalNumber`.

## `init(options?)`

Load the catalogue.

```ts
init(options?: InitOptions): Promise<InitInfo>
```

| Option | Meaning |
| --- | --- |
| `data`, `detail` | Already-parsed JSON. Both are required together. |
| `source: 'file'` | Read `dataPath` and `detailPath` in Node. |
| `source: 'network'` | Skip bundled data and fetch. |
| `dataUrl`, `detailUrl` | A URL or a list. The pinned jsDelivr mirror is still tried after a custom URL. |
| `cache` | `true` in the browser stores the payload in `localStorage`, then IndexedDB. `false` or `'memory'` keeps it in memory only. |
| `force` | Reload even if `init` already succeeded. |

Returns `{ source, count, fromCache }`. `source` is `data`, `file`, `bundle`, `cache`, or `network`. `count` is `1330` for the full book.

Errors: `DATA` if a file source is missing a path. `NETWORK` if every URL fails. A bad JSON file rejects with a `SyntaxError`.

```js
import { DailyKural } from 'daily-kural-js';

const info = await DailyKural.init();
console.log(info.count);
```

## `useBundledData(kural, detail)`

Give the library JSON before `init`. The offline browser build calls this for you.

```ts
useBundledData(kural: unknown, detail: unknown): void
```

No error of its own. `init` later throws `DATA` if the JSON shape is wrong.

```js
import { DailyKural } from 'daily-kural-js';
import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync('data/thirukkural.json', 'utf8'));
const detail = JSON.parse(readFileSync('data/detail.json', 'utf8'));
DailyKural.useBundledData(data, detail);
await DailyKural.init();
```

Those files are in the source repository. They are not inside the npm tarball. The published package fetches the pinned URLs, or you pass `data` and `detail` yourself.

## `getByNumber(n)`

```ts
getByNumber(n: number | string): Kural
```

Returns that kural.

Errors: `NOT_READY` before `init`. `INVALID_NUMBER` if `n` is not an integer from 1 to 1330.

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
const kural = DailyKural.getByNumber(1);
console.log(kural.Line1);
```

Output:

```text
அகர முதல எழுத்தெல்லாம் ஆதி
```

## `getRandom(options?)`

```ts
getRandom(options?: { filter?: Filter | string, avoid?: number | number[] }): Kural
```

Picks a uniform random kural inside the filter.

`avoid` is either how many recent picks to skip for this filter, or a list of numbers to skip. If that leaves no kural, the full filter is used.

Errors: `NOT_READY`, `EMPTY_FILTER`, `INVALID_NUMBER` (a bad number inside `avoid` or the filter), `UNKNOWN_CATEGORY`.

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
const kural = DailyKural.getRandom({
  filter: { chapter: 'கடவுள் வாழ்த்து' },
  avoid: 3,
});
console.log(kural.Number);
```

The number is random. It is between 1 and 10 for this chapter.

## `getDaily(options?)`

```ts
getDaily(options?: {
  filter?: Filter | string,
  date?: string | Date,
  timezone?: string,
  timeZone?: string,
}): Kural
```

Returns the kural for a civil date. The same filter, date, and timezone always return the same kural.

- Day 0 is `2024-01-01` (`DailyKural.EPOCH`).
- A `YYYY-MM-DD` string is that civil date.
- A `Date`, or no date, is read in `timezone` (IANA). If `timezone` is omitted, the runtime's local zone is used.
- The filtered numbers are shuffled per cycle with a fixed seed, then indexed by the day.

Errors: `NOT_READY`, `EMPTY_FILTER`, `INVALID_NUMBER`, `UNKNOWN_CATEGORY`. A bad IANA name can throw a `RangeError` from `Intl`.

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
const kural = DailyKural.getDaily({
  date: '2026-10-23',
  timezone: 'Asia/Kolkata',
});
console.log(kural.Number);
console.log(kural.Line1);
```

Output:

```text
100
இனிய உளவாக இன்னாத கூறல்
```

## `getDailyFor(date, options?)`

```ts
getDailyFor(date: string | Date, options?: { filter?: Filter | string, timezone?: string, timeZone?: string }): Kural
```

Same as `getDaily`, with the date as the first argument.

Errors: the same as `getDaily`.

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
const kural = DailyKural.getDailyFor('2026-10-23', { timezone: 'Asia/Kolkata' });
console.log(kural.Number);
```

Output:

```text
100
```

## `getNextDaily(options?)`

```ts
getNextDaily(options?: {
  filter?: Filter | string,
  date?: string | Date,
  timezone?: string,
  timeZone?: string,
}): Kural
```

The kural for the next civil date after `date` (or after today).

Errors: the same as `getDaily`.

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
const kural = DailyKural.getNextDaily({
  date: '2026-10-23',
  timezone: 'Asia/Kolkata',
});
console.log(kural.Number);
```

The number is the kural for 24 October 2026 in that zone. It is stable for that date.

## `list(options?)`

```ts
list(options?: { filter?: Filter | string, limit?: number, offset?: number }): {
  total: number,
  offset: number,
  limit: number,
  items: Kural[],
}
```

`limit` defaults to the whole match. `offset` defaults to 0.

Errors: `NOT_READY`, `EMPTY_FILTER`, `INVALID_NUMBER`, `UNKNOWN_CATEGORY`.

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
const page = DailyKural.list({ filter: 'chapter=1', limit: 2 });
console.log(page.total);
console.log(page.items.map((kural) => kural.Number).join(','));
```

Output:

```text
10
1,2
```

## `count(options?)`

```ts
count(options?: { filter?: Filter | string }): number
```

Errors: the same as `list`.

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
console.log(DailyKural.count({ filter: { paal: 'Virtue', range: [1, 25] } }));
```

Output:

```text
25
```

## `getByChapter(chapter)`

```ts
getByChapter(chapter: number | string): Kural[]
```

Every kural in that chapter, in number order.

Errors: `NOT_READY`, `UNKNOWN_CATEGORY`.

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
const rows = DailyKural.getByChapter('கடவுள் வாழ்த்து');
console.log(rows.length);
console.log(rows[0].Number);
```

Output:

```text
10
1
```

## `getByIyal(iyal)`

```ts
getByIyal(iyal: number | string): Kural[]
```

Errors: `NOT_READY`, `UNKNOWN_CATEGORY`.

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
console.log(DailyKural.getByIyal(1).length);
```

Output:

```text
40
```

Iyal 1 is பாயிரவியல். It holds the first four chapters.

## `getByPaal(paal)`

```ts
getByPaal(paal: number | string): Kural[]
```

Errors: `NOT_READY`, `UNKNOWN_CATEGORY`.

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
console.log(DailyKural.getByPaal('அறத்துப்பால்').length);
```

Output:

```text
380
```

## `listPaals()`

```ts
listPaals(): Category[]
```

The 3 paals. Each has `name`, `translation`, `transliteration`, `number`, and `count`.

Errors: `NOT_READY`.

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
console.log(DailyKural.listPaals().map((paal) => paal.name).join(', '));
```

Output:

```text
அறத்துப்பால், பொருட்பால், காமத்துப்பால்
```

## `listIyals(paal?)`

```ts
listIyals(paal?: number | string): Iyal[]
```

Iyals, optionally inside one paal. Each iyal also has `paalNumber`.

Errors: `NOT_READY`, `UNKNOWN_CATEGORY` if `paal` is set and does not match.

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
console.log(DailyKural.listIyals(1)[0].name);
```

Output:

```text
பாயிரவியல்
```

## `listChapters(options?)`

```ts
listChapters(options?: { paal?: number | string, iyal?: number | string }): Chapter[]
```

Chapters. Each has `start` and `end` as well as the category fields.

Errors: `NOT_READY`, `UNKNOWN_CATEGORY`.

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
const chapter = DailyKural.listChapters({ iyal: 1 })[0];
console.log(chapter.name, chapter.start + '-' + chapter.end);
```

Output:

```text
கடவுள் வாழ்த்து 1-10
```

## `search(query, options?)`

```ts
search(query: string, options?: {
  filter?: Filter | string,
  fields?: string[],
  limit?: number,
  offset?: number,
}): { total: number, offset: number, limit: number, items: Kural[] }
```

Case-insensitive substring search. Text is Unicode NFC. The default `limit` is 20.

Default fields: `line1`, `line2`, `transliteration`, `translation`, `mv`, `sp`, `mk`, `explanation`, `couplet`. You can also pass `commentary` (the three Tamil commentaries) or a single field name.

An empty query returns `total: 0`. It does not throw.

Errors: `NOT_READY`, and the filter errors from `list`.

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
const page = DailyKural.search('அகர', { filter: { paal: 1 }, limit: 5 });
console.log(page.total);
console.log(page.items[0].Number);
```

Output:

```text
1
1
```

## `getRange(start, end)`

```ts
getRange(start: number | string, end: number | string): Kural[]
```

Inclusive. This does not take a filter. Use `list({ filter: { range: [start, end] } })` when you also want a paal or an exclude list.

Errors: `NOT_READY`, `INVALID_NUMBER` if a bound is out of range or `start` is greater than `end`.

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
const rows = DailyKural.getRange(1, 3);
console.log(rows.map((kural) => kural.Number).join(','));
```

Output:

```text
1,2,3
```

## `next(n, options?)` and `prev(n, options?)`

```ts
next(n: number | string, options?: { filter?: Filter | string }): Kural
prev(n: number | string, options?: { filter?: Filter | string }): Kural
```

The neighbour inside the filter, wrapping at the ends. If `n` is outside the filter, `next` walks forward to the following match (or the first), and `prev` walks backward.

Errors: `NOT_READY`, `INVALID_NUMBER`, `EMPTY_FILTER`, `UNKNOWN_CATEGORY`.

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
console.log(DailyKural.next(1, { filter: { chapter: 1 } }).Number);
console.log(DailyKural.prev(1, { filter: { chapter: 1 } }).Number);
```

Output:

```text
2
10
```

## `resolveFilter(filter?)`

```ts
resolveFilter(filter?: Filter | string | null): readonly number[]
```

The sorted kural numbers that pass. An empty filter returns every number from 1 to 1330. The result is cached.

Errors: `NOT_READY`, `EMPTY_FILTER`, `INVALID_NUMBER`, `UNKNOWN_CATEGORY`.

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
const numbers = DailyKural.resolveFilter({ chapter: 1, exclude: [1] });
console.log(numbers.join(','));
```

Output:

```text
2,3,4,5,6,7,8,9,10
```

## `parseFilterString(input)` and `stringifyFilter(filter?)`

```ts
parseFilterString(input: string): Filter
stringifyFilter(filter?: Filter | string | null): string
```

`parseFilterString` accepts a leading `?`. Unknown keys are ignored. It does not need `init`, and it does not check that a chapter exists.

`stringifyFilter` writes keys in this order: `number`, `numbers`, `range`, `paal`, `iyal`, `chapter`, `exclude`.

`stringifyFilter` and `parseFilterString` throw `INVALID_NUMBER` for a bad number or a bad range. A numeric token such as `paal=1` is parsed as the number `1`, which matches the same paal as `'அறத்துப்பால்'`.

```js
import { DailyKural } from 'daily-kural-js';

console.log(DailyKural.stringifyFilter({ paal: 1, range: [1, 50], exclude: [3, 4] }));
console.log(JSON.stringify(DailyKural.parseFilterString('paal=1&range=1-50')));
```

Output:

```text
range=1-50&paal=1&exclude=3,4
{"paal":1,"range":[1,50]}
```

## `describeFilter(filter?)`

```ts
describeFilter(filter?: Filter | string | null): { key: string, value: unknown, label: string }[]
```

Chips for a UI. Category labels are the Tamil names. Needs `init`.

Errors: the same as `resolveFilter`, except an empty filter returns an empty array and does not throw.

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
console.log(DailyKural.describeFilter({ paal: 1 })[0].label);
```

Output:

```text
அறத்துப்பால்
```

## `findCategory(kind, query)`

```ts
findCategory(kind: 'paal' | 'iyal' | 'chapter', query: number | string | null | undefined): Category | null
```

The first match, or `null` if the query is empty or unknown. Unlike the filter keys, this does not throw `UNKNOWN_CATEGORY`.

Errors: `NOT_READY`.

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
console.log(DailyKural.findCategory('chapter', 'Katavul Vaazhththu').name);
console.log(DailyKural.findCategory('paal', 'no-such-paal'));
```

Output:

```text
கடவுள் வாழ்த்து
null
```

## `scheduleDaily(callback, options?)`

```ts
scheduleDaily(
  callback: (kural: Kural) => void | Promise<void>,
  options?: { at?: string, filter?: Filter | string, timezone?: string, timeZone?: string, onError?: (err: unknown) => void },
): () => void
```

Calls `callback` at a local clock time every day. `at` defaults to `06:00` (`HH:MM`). If the tab is asleep at that moment, the callback runs on `visibilitychange` or `focus` when that day's slot was missed. The returned function cancels the timer.

Call `init` before the scheduled time. The callback reads the kural with `getDaily`.

Errors: `DATA` if `at` is not `HH:MM`. Errors inside the callback go to `onError` when you pass one.

This uses timers and window events. It is for the browser.

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
const cancel = DailyKural.scheduleDaily((kural) => {
  console.log(kural.Number);
}, { at: '06:00', filter: { paal: 1 }, timezone: 'Asia/Kolkata' });
cancel();
```

## `renderKuralHTML(kural, options?)`

```ts
renderKuralHTML(kural: Kural, options?: {
  lang?: 'ta' | 'en' | 'both',
  commentary?: 'mv' | 'sp' | 'mk' | 'all' | 'none',
  showTransliteration?: boolean,
  showTranslation?: boolean,
  showMeta?: boolean,
}): string
```

Escaped HTML. Source text is not inserted raw. Defaults: `lang` `both`, `commentary` `all`, transliteration off, translation on, meta on.

Errors: none of its own. A missing kural field is rendered as empty text.

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
const html = DailyKural.renderKuralHTML(DailyKural.getByNumber(1), {
  lang: 'ta',
  commentary: 'none',
  showMeta: false,
});
console.log(html.includes('அகர'));
```

Output:

```text
true
```

## `mount(selector, options?)`

```ts
mount(selector: string | Element, options?: MountOptions): Element
```

Creates a `<daily-kural>` inside the element `selector` finds, or configures that element if it is already `<daily-kural>`. Registers the custom element first.

`MountOptions` includes the render options plus `mode`, `filter`, `number`, `paal`, `iyal`, `chapter`, `range`, `theme`, `autoRefresh`, `syncUrl`, `loadFonts`, `fontBase`, `timezone`, and `onChange`.

Errors: `NOT_READY` if there is no document, or if the selector matches nothing.

```js
import { DailyKural } from 'daily-kural-js';

const card = DailyKural.mount('#slot', {
  mode: 'daily',
  filter: { paal: 1 },
  timezone: 'Asia/Kolkata',
});
```

The page needs `<div id="slot"></div>`.

## `loadFonts(mode?, fontBase?)`

```ts
loadFonts(mode?: 'google' | 'self' | 'none', fontBase?: string): Promise<void>
```

| Mode | Behaviour |
| --- | --- |
| `google` | Link Noto Serif Tamil and Noto Sans Tamil, and copy the `@font-face` rules into `document.head`. |
| `self` | Link `fonts.css` under `fontBase`. |
| `none` | Do nothing. |

In Node, where `document` is missing, the promise resolves without doing anything.

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.loadFonts('none');
```

## `register()`

```ts
register(): void
```

Defines `<daily-kural>` if `customElements` exists and the name is free. Safe to call twice. `import 'daily-kural-js/element'` calls this for you.

```js
import { register } from 'daily-kural-js/element';

register();
```

## `DailyKuralError`

```ts
class DailyKuralError extends Error {
  code: 'EMPTY_FILTER' | 'INVALID_NUMBER' | 'UNKNOWN_CATEGORY' | 'NETWORK' | 'NOT_READY' | 'DATA';
  constructor(code: ErrorCode, message: string);
}
```

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
try {
  DailyKural.getByNumber(9999);
} catch (error) {
  console.log(error.name, error.code);
}
```

Output:

```text
DailyKuralError INVALID_NUMBER
```

## `DailyKural.version` and `DailyKural.EPOCH`

`version` is the package version (`0.1.0` in this release). `EPOCH` is `2024-01-01`, the first day of the daily cycle.

```js
import { DailyKural } from 'daily-kural-js';

console.log(DailyKural.version);
console.log(DailyKural.EPOCH);
```

Output:

```text
0.1.0
2024-01-01
```

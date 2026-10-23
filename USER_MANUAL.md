# daily-kural-js user manual

This guide is for someone who has never used npm. You can put a Thirukkural card on a web page in a few minutes.

The same text is also at `docs/manual.md`.

## 1. What this library does

`daily-kural-js` shows a Thirukkural (திருக்குறள்). There are 1,330 short poems. The card can show today's poem, a random poem, or one poem you choose.

The card has the Tamil lines, an English translation, and short commentaries.

![The daily-kural card with Tamil text, English, and a commentary.](docs/assets/preview.png)

You do not need a server. The page loads a script. The script draws the card.

## 2. Easiest way: any web page in 2 minutes

1. Copy the file below into a text editor.
2. Save it as `kural.html`.
3. Upload it to any host that serves HTML. You can also open it from a local server.
4. You should see a card with Tamil and English.

Do not double-click the file if you use the small script. Browsers block `fetch` on a `file://` page. Upload it, or use the offline script in [section 11](#11-offline-use-and-updating).

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Today's Thirukkural</title>
</head>
<body>
  <daily-kural mode="daily" lang="both" load-fonts="google"></daily-kural>
  <script
    src="https://cdn.jsdelivr.net/npm/daily-kural-js@0.1.0/dist/daily-kural.min.js"
    integrity="sha384-TDofA9os2y9uduCSZg/dj5mF1ForeFUgmhrnKZbKsqlKpHgMltdoqRk7UxnEOdMr"
    crossorigin="anonymous"></script>
</body>
</html>
```

What each part means:

- `<daily-kural>` is the card.
- `mode="daily"` means "show the kural of the day".
- `lang="both"` means Tamil and English.
- `load-fonts="google"` downloads a Tamil font so the letters are not empty boxes.
- The `<script>` line loads the library from jsDelivr. `@0.1.0` is the version. Keep the version in the address so a later release cannot change your page by surprise.

This address starts working after the package is published to npm.

## 3. Four ways to show a kural

### Kural of the day

Everyone with the same date, the same filter, and the same timezone sees the same kural. Nothing is stored.

```html
<daily-kural mode="daily" timezone="Asia/Kolkata" lang="both"></daily-kural>
```

`timezone="Asia/Kolkata"` uses the date in India. Without it, the card uses the visitor's own timezone. Near midnight, two timezones can be on different dates. That is why the kural can change "early" for one reader.

On 23 October 2026, in `Asia/Kolkata`, with no filter, the kural is **100**.

### A random kural

```html
<daily-kural mode="random" lang="both"></daily-kural>
```

The card has a button, **New random kural**. Each press picks another kural. A random pick is not the same for every visitor.

### One kural by number

Kurals are numbered from 1 to 1330.

```html
<daily-kural mode="number" number="1" lang="both"></daily-kural>
```

Kural 1 starts:

```text
அகர முதல எழுத்தெல்லாம் ஆதி
பகவன் முதற்றே உலகு.
```

### Browse by category

The book has three levels:

1. **பால் (paal)** — 3 large parts.
2. **இயல் (iyal)** — groups inside a paal.
3. **அதிகாரம் (adhigaram, called chapter here)** — 133 chapters, usually 10 kurals each.

```html
<daily-kural mode="browse" paal="அறத்துப்பால்" lang="both"></daily-kural>
```

The card's menus walk paal, then iyal, then chapter. You can also set them in HTML:

```html
<daily-kural mode="daily" chapter="கடவுள் வாழ்த்து" lang="ta"></daily-kural>
```

`chapter="கடவுள் வாழ்த்து"` keeps the card inside that chapter. Daily mode then cycles through those 10 kurals.

You can use the Tamil name, the English name, the transliteration, or the number:

```html
<daily-kural mode="daily" paal="Virtue"></daily-kural>
<daily-kural mode="daily" paal="1"></daily-kural>
<daily-kural mode="daily" chapter="The Praise of God"></daily-kural>
```

## 4. Filters made simple

A filter is a rule for which kurals are allowed. The card, the buttons, and the "kural of the day" all stay inside that rule.

| I want… | Use this |
| --- | --- |
| Every kural | leave the filter empty |
| Only kural 12 | `number="12"` |
| Kurals 1, 5, and 100 | `numbers="1,5,100"` |
| Kurals 1 through 50 | `range="1-50"` |
| Only அறத்துப்பால் | `paal="1"` or `paal="அறத்துப்பால்"` |
| Only one iyal | `iyal="பாயிரவியல்"` |
| Only one chapter | `chapter="கடவுள் வாழ்த்து"` |
| All of those, but skip 3 and 4 | `exclude="3,4"` |
| Today's kural inside a paal | `mode="daily" paal="1"` |
| A random kural inside a chapter | `mode="random" chapter="1"` |

You can combine them. This is "today's kural, from kurals 1 to 50, inside paal 1, skipping 3 and 4":

```html
<daily-kural mode="daily" paal="1" range="1-50" exclude="3,4"></daily-kural>
```

The same rule as one string:

```html
<daily-kural mode="daily" filter="paal=1&range=1-50&exclude=3,4"></daily-kural>
```

Rules that are easy to miss:

- The keys work together. All of them must match.
- `paal="1"` and `chapter="50"` can match nothing, because chapter 50 is not inside paal 1. The card then shows an empty-filter error and a **Clear filter** button.
- Numbers must be from 1 to 1330.
- An empty filter is fine. It means the whole book.

## 5. Choosing what to display

| You want | Set this |
| --- | --- |
| Tamil only | `lang="ta"` |
| English only | `lang="en"` |
| Tamil and English | `lang="both"` |
| Hide the English translation but keep Tamil | `lang="ta"` or `show-translation="false"` |
| Show the Roman spelling | `show-transliteration` |
| Hide chapter badges | `show-meta="false"` |
| One commentary | `commentary="mv"` or `sp` or `mk` |
| All commentaries | `commentary="all"` |
| No commentary | `commentary="none"` |

```html
<daily-kural
  mode="number"
  number="1"
  lang="both"
  show-transliteration
  commentary="mv"
></daily-kural>
```

The commentary names:

- `mv` — மு. வரதராசனார்
- `sp` — சாலமன் பாப்பையா
- `mk` — மு. கருணாநிதி
- The English explanation is the fourth tab when `commentary="all"`.

## 6. Tamil fonts

Sometimes Tamil shows as boxes (□) or as the missing-glyph symbol. The page has the letters, but the font does not contain Tamil.

Fix it in one of three ways.

1. **Google fonts (default).** Leave `load-fonts` unset, or set `load-fonts="google"`. The page asks Google for Noto Serif Tamil and Noto Sans Tamil. This needs a network.
2. **Fonts from this package.** Set `load-fonts="self"`. The script loads `fonts.css` from the package. On a CDN:

```html
<daily-kural
  mode="daily"
  load-fonts="self"
  font-base="https://cdn.jsdelivr.net/npm/daily-kural-js@0.1.0/fonts/"
></daily-kural>
```

3. **Your own font.** Set `load-fonts="none"` and choose the family:

```css
daily-kural {
  --dk-font-tamil: "Noto Sans Tamil", "Latha", sans-serif;
}
```

A font that is already installed, such as Latha or Nirmala UI on Windows, is used automatically when the Noto files are missing. Phones often need one of the three modes above.

## 7. Colours, size, and themes

`theme="light"`, `theme="dark"`, or `theme="auto"`. Auto follows the device.

You can also paint the card with CSS variables.

Palm leaf:

```css
daily-kural {
  --dk-bg: #f6f1e7;
  --dk-card: #fffaf3;
  --dk-fg: #2b241c;
  --dk-accent: #8f3d22;
}
```

Temple night:

```css
daily-kural {
  --dk-bg: #1b1613;
  --dk-card: #261f1a;
  --dk-fg: #f6efe6;
  --dk-muted: #cbbba8;
  --dk-accent: #e0a070;
  --dk-border: #3d332b;
}
```

Sea green:

```css
daily-kural {
  --dk-bg: #f3f7f4;
  --dk-card: #ffffff;
  --dk-accent: #1f4d3a;
  --dk-accent-soft: #d7ebe3;
}
```

A larger verse:

```css
daily-kural {
  --dk-font-size: 2rem;
  --dk-line-height: 1.8;
}
```

Put the CSS in a `<style>` tag on the page. The variables cross the shadow root. Ordinary class names inside the card do not.

## 8. React, Vue, and WordPress

### React

1. In the project folder, run `npm install daily-kural-js`.
2. Add a component file:

```jsx
import { useEffect, useState } from 'react';
import { DailyKural } from 'daily-kural-js';

export function KuralOfTheDay() {
  const [kural, setKural] = useState(null);
  useEffect(() => {
    let live = true;
    DailyKural.init().then(() => {
      if (live) setKural(DailyKural.getDaily({ timezone: 'Asia/Kolkata' }));
    });
    return () => {
      live = false;
    };
  }, []);
  if (!kural) return <p>Loading…</p>;
  return (
    <article lang="ta">
      <p>{kural.Line1}</p>
      <p>{kural.Line2}</p>
    </article>
  );
}
```

3. Render `<KuralOfTheDay />` from a page.

To use the card element instead, add `import 'daily-kural-js/element';` once, then `<daily-kural mode="daily" lang="both"></daily-kural>`.

### Vue

1. Run `npm install daily-kural-js`.
2. In your component:

```vue
<script setup>
import 'daily-kural-js/element';
</script>

<template>
  <daily-kural mode="daily" lang="both" timezone="Asia/Kolkata"></daily-kural>
</template>
```

If Vue warns that the tag is unknown, tell the compiler to ignore it, or use the JavaScript API the same way as React.

### WordPress

1. Edit a page.
2. Add a **Custom HTML** block.
3. Paste this:

```html
<script
  src="https://cdn.jsdelivr.net/npm/daily-kural-js@0.1.0/dist/daily-kural.min.js"
  integrity="sha384-TDofA9os2y9uduCSZg/dj5mF1ForeFUgmhrnKZbKsqlKpHgMltdoqRk7UxnEOdMr"
  crossorigin="anonymous"></script>
<daily-kural mode="daily" lang="both" load-fonts="google"></daily-kural>
```

4. Update the page and view it.

If you only see an empty line, WordPress removed the `<script>`. Ask an administrator to allow this script, or enqueue it from a plugin.

## 9. The command line

You need Node.js 18 or newer. Check with `node -v`.

1. Open a terminal.
2. Run:

```bash
npx daily-kural-js daily
```

The first time, npm may ask to install the package. Say yes.

More commands:

```bash
npx daily-kural-js daily --paal 1 --timezone Asia/Kolkata
npx daily-kural-js random --chapter "கடவுள் வாழ்த்து"
npx daily-kural-js number 1 --lang ta
npx daily-kural-js search அகர --paal 1
npx daily-kural-js list --range 1-10 --limit 3
```

After `npm install -g daily-kural-js`, you can type `daily-kural` instead of `npx daily-kural-js`.

`--json` prints the raw record. `--lang ta` prints Tamil only. `--commentary mv` adds one commentary.

## 10. A Node.js project

1. Create a folder.
2. Run `npm init -y`.
3. Run `npm install daily-kural-js`.
4. Save this as `show.mjs`:

```js
import { DailyKural } from 'daily-kural-js';

await DailyKural.init();
const kural = DailyKural.getByNumber(1);
console.log(kural.Number + '. ' + kural.chapter.name);
console.log(kural.Line1);
console.log(kural.Line2);
console.log(kural.Translation);
```

5. Run `node show.mjs`.

Output:

```text
1. கடவுள் வாழ்த்து
அகர முதல எழுத்தெல்லாம் ஆதி
பகவன் முதற்றே உலகு.
'A' leads letters; the Ancient Lord Leads and lords the entire world
```

Today's kural, pinned to a date so the sample does not change overnight:

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

CommonJS works too. Save this as `show.cjs`:

```js
const { DailyKural } = require('daily-kural-js');

DailyKural.init().then(() => {
  const kural = DailyKural.getByNumber(1330);
  console.log(kural.Number + '. ' + kural.chapter.name);
});
```

The full function list is in [docs/api.md](docs/api.md).

## 11. Offline use and updating

The normal script downloads the verses when the page opens. The bundled script already contains them. Use it when the page must work with no extra fetch:

```html
<script
  src="https://cdn.jsdelivr.net/npm/daily-kural-js@0.1.0/dist/daily-kural.bundled.min.js"
  integrity="sha384-3gvwRBt2FOCaC92hJ6P86xvZ70+QwbQ6AgYu+Od+eRMOoawyiuvLdcsfzVEWVe8V"
  crossorigin="anonymous"></script>
<daily-kural mode="daily" lang="both" load-fonts="google"></daily-kural>
```

That file is about 3.7 MB (about 591 kB over the wire). The small script is about 53 kB and then downloads the data once. The browser remembers the data for the next visit.

To move to a new version:

1. Read [CHANGELOG.md](CHANGELOG.md).
2. Replace `0.1.0` in the script address with the new version.
3. Replace the `integrity` value. The old hash will not match the new file. The release notes include the new hash.
4. If you installed with npm, run `npm install daily-kural-js@<version>`.

`@1` means "any 1.x release". It can change without a hash update, so do not use it with `integrity`. `@latest` is for experiments, not for a site you leave running.

## 12. Troubleshooting

| What you see | Cause | Fix |
| --- | --- | --- |
| The card stays blank | The script did not load, or the page is still fetching. | Open the browser network panel. Check the script address. Wait for the first load. Confirm the package version is published. |
| Empty boxes instead of Tamil | No Tamil font. | Set `load-fonts="google"`, or `load-fonts="self"` with `font-base` pointing at the `fonts/` folder. |
| A CORS or network error | The data request was blocked, or the machine is offline. | Use the bundled script in section 11. The data URLs already send `Access-Control-Allow-Origin: *`. |
| "No kurals match the given filter" | The rules exclude every kural. For example kural 12 is not in chapter 1. | Remove one rule, or press **Clear filter**. |
| The CDN shows an old file | jsDelivr cached a copy. | Open `https://purge.jsdelivr.net/npm/daily-kural-js@0.1.0/dist/daily-kural.min.js` once. Prefer a pinned version. |
| The kural changes near midnight, or not when you expect | Daily mode uses a civil date. Another timezone is already on the next day. | Set `timezone="Asia/Kolkata"` (or your zone) on the element and in the API. |
| The page is `file://` and the card errors | Browsers block `fetch` from a file URL. | Serve the folder, or use the bundled script. |
| "Invalid kural number" | The number is outside 1–1330, or it is not an integer. | Use a whole number in that range. |
| "Unknown paal" or unknown chapter | The name does not match Tamil, English, transliteration, or the number. | Copy the name from `listPaals()`, `listIyals()`, or `listChapters()`. Matching ignores case and extra space. |
| It works in the browser and fails in Next.js | The element was rendered on the server. | Add `'use client'` at the top of the component file. |
| WordPress shows the tag but no card | The script tag was stripped. | Enqueue the CDN script from a plugin, or allow unfiltered HTML. |
| `daily-kural` is not found | The package is not installed, or Node is older than 18. | Run `node -v`. Use `npx daily-kural-js daily`. |
| `npm publish` asks for a password or a code | npm 2FA is on. That is expected. | Type the one-time code in the terminal. Do not put it in a file or a chat. |

## 13. Glossary

| Word | Meaning |
| --- | --- |
| Kural | One of the 1,330 couplets. Two Tamil lines. Numbered 1 to 1330. |
| பால் (paal) | A top-level part of the book. There are 3: அறத்துப்பால் (Virtue), பொருட்பால் (Wealth), காமத்துப்பால் (Love). |
| இயல் (iyal) | A group of chapters inside a paal. |
| அதிகாரம் (adhigaram) | A chapter. In this library the filter key is `chapter`. Most chapters hold 10 kurals. |
| Commentary | A short explanation. This data set includes மு. வரதராசனார், சாலமன் பாப்பையா, and மு. கருணாநிதி, plus an English explanation. |

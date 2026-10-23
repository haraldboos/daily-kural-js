# Changelog

All notable changes to `daily-kural-js` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-23

First public release.

### Added

- `DailyKural` for Node and the browser: daily kural, random kural, search, filters, and the section lists.
- `<daily-kural>` custom element and `window.DailyKural`.
- `daily-kural` command (`npx daily-kural-js`).
- ESM (`dist/index.mjs`), CommonJS (`dist/index.cjs`), and TypeScript types.
- Small browser build that fetches the verses, and a bundled build with the verses inside.
- Tamil font subset (Noto Serif Tamil and Noto Sans Tamil, SIL OFL 1.1) and `fonts/fonts.css`.
- Data URLs pinned to `tk120404/thirukkural` commit `cf3ff6c5a73c23b4092913156830457caab65fd4`.

[0.1.0]: https://github.com/haraldboos/daily-kural-js/releases/tag/v0.1.0

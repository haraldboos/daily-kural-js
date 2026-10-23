# Contributing to daily-kural-js

Thank you for helping. This project shows the Thirukkural in the browser and in Node. Please keep changes easy to review, and keep the Tamil text intact.

## Set up

You need Node.js 18 or newer.

```bash
git clone https://github.com/haraldboos/daily-kural-js.git
cd daily-kural-js
npm install
npm test
npm run lint
npm run build
```

`npm run demo` serves the repository. Open `http://127.0.0.1:8080/demo/`.

## What to change

- Library code lives in `src/`.
- The data pin is the one constant `THIRUKKURAL_DATA_REV` in `src/config.js`. Do not point the data URLs at `master`.
- `src/constants.js` `VERSION` must match `package.json`.
- Tests live in `test/`. Run `npm test`.
- User-facing docs are `README.md`, `USER_MANUAL.md`, and `docs/api.md`. If you change behaviour, update the docs in the same pull request. Every code sample should be something you have run.

## Pull requests

1. Open an issue for a large change, so we can agree the shape first.
2. Branch from `main`.
3. Keep the diff focused.
4. Run `npm test`, `npm run lint`, and `npm run build`.
5. Describe what changed and how you checked it.

## Reporting bugs

Use the bug report template. Include the package version and a short snippet.

Please do not open a public issue for a security problem. See [SECURITY.md](SECURITY.md).

By contributing, you agree that your code is licensed under the MIT licence in [LICENSE](LICENSE). Do not add verses or commentary under a different licence. The data stays Apache-2.0, from the pinned upstream commit. The fonts stay SIL OFL 1.1.

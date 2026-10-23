# Releasing daily-kural-js

Do these steps in order. The first release is manual, from your own machine, so you can see the npm 2FA prompt. Later releases are tagged git pushes. GitHub Actions publishes them.

The package name is `daily-kural-js`. The first version in this repo is `0.1.0`. Move to `1.0.0` when you are ready to call the API stable. That bump is `npm version major`.

The GitHub repository is `haraldboos/daily-kural-js`. Pages will be at `https://haraldboos.github.io/daily-kural-js/`.

## One-time setup

### 1. Create an npm account and log in

1. Open [https://www.npmjs.com/signup](https://www.npmjs.com/signup) and create an account.
2. Confirm the email npm sends you.
3. In the account, open **Account → Two-Factor Authentication** and enable 2FA for authorization and writes. Use an authenticator app.
4. In a terminal, from this repository:

```bash
npm login
```

npm asks for the username, password, email, and a one-time code. Type the code in the terminal. Do not paste it into chat, a file, or a screenshot.

Check:

```bash
npm whoami
```

### 2. Choose how later releases authenticate

**Recommended: trusted publishing.** After the first manual publish, open the package on npmjs.com → **Settings → Trusted Publisher**. Add a GitHub Actions publisher:

- Organization or user: your GitHub username
- Repository: `daily-kural-js`
- Workflow filename: `release.yml`

No token is stored. The workflow in `.github/workflows/release.yml` already asks for `id-token: write` and runs `npm publish --provenance --access public`.

**Alternative: a granular access token.** Use this if you cannot use trusted publishing.

1. On npmjs.com open **Access Tokens → Generate New Token → Granular Access Token**.
2. Limit it to the package `daily-kural-js`, with read and write permission to publish. Set an expiry.
3. Copy the token once, into a password manager. Do not put it in the repo, in chat, or in a workflow file.
4. On GitHub, open the repository → **Settings → Secrets and variables → Actions → New repository secret**. Name it `NPM_TOKEN`. Paste the token as the value.
5. In `.github/workflows/release.yml`, add this `env` on the publish step:

```yaml
env:
  NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Trusted publishing and a token should not both be required. Prefer the trusted publisher, and leave `NPM_TOKEN` unset.

### 3. Create the GitHub repository

```bash
git init
git add .
git commit -m "Prepare daily-kural-js 0.1.0 for release."
gh repo create daily-kural-js --public --source=. --remote=origin
git push -u origin main
```

`dist/` is gitignored. The publish workflow builds it. Do not commit `node_modules`, `.env`, or tokens.

Enable Pages: **Settings → Pages → Source: GitHub Actions**.

## First manual publish

From a clean tree, on Node 18+:

```bash
npm test
npm run lint
npm run build
npm run size
npm run sri
npm pack --dry-run
```

Read the file list. You should see `dist/`, `fonts/`, `README.md`, `USER_MANUAL.md`, `LICENSE`, `NOTICE`, and `CHANGELOG.md`. You should not see `test/`, `src/`, or `.cursor`.

When the dry run looks right:

```bash
npm publish --access public
```

`publishConfig.provenance` is `true`, which is what CI wants. A laptop is not a supported provenance environment. If npm stops and says provenance cannot be generated, publish this first version without it:

```bash
npm publish --access public --provenance false
```

npm then asks for a one-time 2FA code (`Enter OTP` or similar). Type it in the terminal. The package will be public because of `--access public`.

Check:

- [https://www.npmjs.com/package/daily-kural-js](https://www.npmjs.com/package/daily-kural-js)
- The README on that page shows headings, tables, code, and Tamil.
- A few minutes later, the jsDelivr URL in the README returns the script.

Then attach the trusted publisher (step 2) so the next tag can publish from GitHub.

## Later releases

1. Update `CHANGELOG.md` with a new `## [x.y.z] - YYYY-MM-DD` section.
2. Set `VERSION` in `src/constants.js` to that same `x.y.z`.
3. Stage those files, then bump, commit, and tag:

```bash
git add CHANGELOG.md src/constants.js
npm version patch
```

Use `minor` for a new feature that does not break callers, or `major` for a breaking change. `npm version` updates `package.json`, commits, and creates tag `vX.Y.Z`. The version in `src/constants.js` must already be the new number, or `npm run build` fails.

4. Rebuild the SRI hashes and put them in `README.md`, `USER_MANUAL.md`, and `examples/cdn.html`:

```bash
npm run build
npm run sri
```

The hash changes every time those files change. An old `integrity` attribute will refuse to run the new file. Commit the doc update if the hashes changed (they will, because the version string is inside the bundle).

5. Push the commit and the tag:

```bash
git push --follow-tags
```

6. The **Release** workflow installs, tests, builds, runs `npm publish --provenance --access public`, and opens a GitHub Release whose notes are the changelog section.

7. Verify:

- The npm page for the new version.
- `https://cdn.jsdelivr.net/npm/daily-kural-js@VERSION/dist/daily-kural.min.js`
- `https://unpkg.com/daily-kural-js@VERSION/dist/daily-kural.min.js`
- `https://cdn.jsdelivr.net/npm/daily-kural-js@VERSION/+esm`
- `https://cdn.jsdelivr.net/npm/daily-kural-js@VERSION/fonts/fonts.css`
- `https://cdn.jsdelivr.net/npm/daily-kural-js@VERSION/dist/daily-kural.bundled.min.js`
- `npx daily-kural-js@VERSION daily` from an empty folder.

8. If jsDelivr is stale, purge the file:

```text
https://purge.jsdelivr.net/npm/daily-kural-js@VERSION/dist/daily-kural.min.js
```

9. Announce the release where you like. A short Tamil and English text is in `docs/ANNOUNCEMENT.md`.

## A bad version

Prefer a new patch. Deprecate the bad one:

```bash
npm deprecate daily-kural-js@0.1.0 "Broken release. Use 0.1.1 or newer."
```

`npm deprecate` keeps the version installable and marks it on the npm page. People who already pinned it still get that code.

Unpublish is only for a fresh mistake. npm allows `npm unpublish daily-kural-js@0.1.0` for **72 hours** after that version was published, and only when no other package depends on it. After 72 hours, unpublish is refused. Do not unpublish a version that anyone might already be loading from a CDN. Deprecate it, and publish a fix.

```bash
npm unpublish daily-kural-js@0.1.0
```

Unpublishing the whole package name (`npm unpublish daily-kural-js --force`) is similarly limited and can be blocked once the name has been public. Do not force-unpublish a package other people use.

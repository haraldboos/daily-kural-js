# Security policy

## Supported versions

| Version | Supported |
| --- | --- |
| 0.1.x | yes |

Older versions are not patched. Upgrade, or pin a version you have reviewed.

## Reporting a vulnerability

Please do not open a public GitHub issue for a security problem.

Use **Security → Report a vulnerability** on the GitHub repository (a private advisory). Include:

- the package version
- what an attacker can do
- a short way to reproduce it, if you have one

You should get an acknowledgement within 7 days. If the report is accepted, the fix will be released as a patch, and you will be credited if you want to be.

Do not include passwords, tokens, or one-time codes in the report.

## What this library loads

The browser build fetches Thirukkural JSON from a pinned commit of `tk120404/thirukkural`, first from `raw.githubusercontent.com`, then from jsDelivr. Both send cross-origin headers so a page can read them. If you do not want that request, use `dist/daily-kural.bundled.min.js`.

`load-fonts="google"` loads stylesheets from Google Fonts. `load-fonts="self"` or `load-fonts="none"` does not.

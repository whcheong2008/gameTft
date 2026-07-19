# DEPLOY.md — GitHub Pages activation (one-time, user-gated)

Everything the game needs to run publicly is already in the repo (PWA manifest,
service worker, `index.html` alias, versioned save export/import). **Nothing in
this repo turns Pages on by itself** — that is a manual, one-time step the repo
owner takes in the GitHub UI. This document is that step.

## Before you flip the switch

1. Merge `feature/phase8-ship` (and every other outstanding Phase 8 branch) to
   `main` first — Pages will serve whatever is on the branch you point it at,
   live, the moment it's enabled.
2. Run the version stamp once, from a clean `main` checkout, right before you
   enable Pages (not before merging — you want it to capture the exact commit
   that goes live):
   ```
   node scripts/stamp-version.js
   git add js/version.js
   git commit -m "Stamp version for v1.0.0 deploy"
   ```
   This rewrites `js/version.js`'s `GAME_BUILD` constant to the current
   `git describe --tags --always --dirty` output. It also changes the service
   worker's cache name (`sw.js` pulls `GAME_VERSION`/`GAME_BUILD` in via
   `importScripts('js/version.js')`), so every previously-cached client picks
   up the new deploy on next visit instead of being stuck on a stale cache.
3. Optionally tag the release (`git tag v1.0.0 && git push origin v1.0.0`) —
   matches MASTERPLAN.md's Phase 8 "Done when" convention.

## Enabling GitHub Pages

1. Push `main` (with the stamped version commit) to GitHub, if you haven't
   already: `git push origin main`.
2. In the GitHub web UI: **Settings → Pages**.
3. Under **Build and deployment → Source**, select **Deploy from a branch**.
4. Under **Branch**, select `main` and folder `/ (root)`. Click **Save**.
5. GitHub builds and serves the site within a minute or two. The URL is shown
   at the top of the same Pages settings page — normally
   `https://<username>.github.io/<repo-name>/`.
6. Visit that URL. It should load `index.html`, which immediately redirects to
   `game-v2.html` (the real game shell — see `index.html`'s own comment for
   why the redirect exists instead of just serving the game directly as
   `index.html`).

No GitHub Actions workflow, build step, or `gh-pages` branch is needed — Pages
serves the checked-in static files directly, which is why this project's "no
build system" rule (CLAUDE.md) was safe to keep all the way through Phase 8.

## Verifying the deploy

- Open the Pages URL in a normal (non-incognito) browser tab.
- Confirm zero console errors on load.
- Confirm the tab title reads "Shattered Veil" and the browser's install
  prompt / "Add to Home Screen" affordance is available (desktop Chrome:
  an install icon appears in the address bar) — this confirms
  `manifest.json` + `sw.js` registered correctly.
- Open DevTools → Application → Service Workers: confirm one is registered
  and activated, scoped to `/`.
- Open DevTools → Application → Cache Storage: confirm a
  `shattered-veil-<version>-<build>` cache exists and is populated.
- Reload with DevTools' network throttling set to "Offline" — the game
  should still load (service worker cache-first fallback).
- Play through: summon a unit, build a team, run one mission, confirm a save
  persists across a reload.

## Re-deploying after future changes

Repeat "Before you flip the switch" steps 2-3 (re-stamp the version, commit,
push to `main`) — GitHub Pages automatically re-serves the new content within
a minute or two of the push landing on `main`. No re-enabling needed.

## Rolling back

GitHub Pages has no built-in rollback UI for the "deploy from a branch" mode
used here. To roll back: `git revert` (or reset, if you're comfortable
force-pushing) `main` back to the last known-good commit and push — Pages
picks up the change the same way it picks up any other push.

## Custom domain (optional, not required for launch)

Not covered here — this is a plain `github.io` deploy. If a custom domain is
wanted later, GitHub's own docs for "Configuring a custom domain for your
GitHub Pages site" apply unmodified; nothing in this repo's static-file
structure needs to change for it.

# Prompt 82 — Phase 8.1/8.2/8.3-prep/8.4: Performance, Onboarding, Deploy Prep, QA

**Branch**: `feature/phase8-ship` (create from `main`)
**Read first**: `CLAUDE.md`, MASTERPLAN § Phase 8, `js/render-pixi.js`, `js/vfx.js`,
`game-v2.html`, `js/save.js`, `tests/balance-sim.js`.

The PUBLIC deploy itself (enabling GitHub Pages) is user-gated and NOT part of this task — you
prepare everything so it's one switch away.

## Task 1 — Performance (8.1)

- Profile the real hot paths headlessly (tests/harness runCombat with timers) + document findings.
- Pixi: verify no per-frame allocations of Graphics/Text in steady state (pool or cache anything
  found); confirm texture/canvas reuse for repeated glyphs (emoji Text sprites are the likely
  offender — cache by glyph+size); cap devicePixelRatio at 2.
- Load time: script load order audit — defer any file not needed before first paint of the hub
  (data files must stay synchronous); measure and report load milestones before/after.
- Memory: run 20 missions headlessly + in-browser; report heap growth; fix leaks found.
- Budget targets: steady 60fps at 4× with 18 units + VFX; <5s load on a cold cache; stable heap.

## Task 2 — Onboarding (8.2)

- First-session flow: fresh save currently drops the player on the hub with 10 starter units and
  zero guidance. Add a lightweight 5-step guided flow (overlay pointers, dismissable, never
  blocking): summon intro → first roll → team builder place 3 → first mission → results/upgrade
  pointer. State in save (backfill convention), never shows again after completion/dismissal.
- Lock-system-as-tutorial check: verify R1 stage locks actually teach (locks exist and their
  requirement text renders — they do per Phase 6; fix gaps found, report).

## Task 3 — Deploy prep (8.3, everything except going public)

- PWA: `manifest.json` (name Shattered Veil, icons — generate simple SVG-based icons with the
  summon-circle motif, 192/512), service worker with cache-first for same-origin assets +
  version-keyed cache invalidation tied to a `GAME_VERSION` constant; register in game-v2.html.
- `index.html` → thin redirect/alias to game-v2.html (Pages serves index).
- Save export/import: buttons in the settings drawer — export = versioned JSON download, import =
  file picker + validation via existing migration path + confirm dialog. Version display
  (GAME_VERSION + git describe baked by a tiny `scripts/stamp-version.js` node script run
  manually — no build system).
- A `DEPLOY.md` with the exact one-time GitHub Pages activation steps for the user.

## Task 4 — QA sweep (8.4)

- `node tests/balance-sim.js` full run — confirm targets still hold post-Phases 3-7; report.
- Full headless playthrough script additions to the suite if gaps found during QA.
- BUGS.md: file anything found during this task; fix CRITICAL/HIGH yourself, log the rest.

## Verify

Suite green twice; goldens byte-identical; browser pass: fresh-save onboarding flow end-to-end,
export/import round-trip, service worker registers + serves from cache on reload (report), perf
numbers before/after. Use a fresh port (8130+) to avoid stale squatters.

Commit as "Prompt 82: performance pass, onboarding, PWA + deploy prep, QA sweep". Push.
Do not merge.

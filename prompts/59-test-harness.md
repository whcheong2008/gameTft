# Prompt 59 — Phase 1: Headless Test Harness + CI

**Branch**: `feature/phase1-harness` (create from `main`)
**Read first**: `CLAUDE.md`, `MASTERPLAN.md` § Phase 1, `GROUND-TRUTH.md` (testable values/formulas).

## Goal

`node tests/run.js` runs the whole suite headlessly with zero npm dependencies, deterministic under
seed, and CI runs it on every push. This is the safety net for all future work — build it solid.

## Task 1 — Harness (`tests/harness.js`)

- Browser shims: `window` (=globalThis), `localStorage` (in-memory), `document` stub whose methods
  are safe no-ops (`getElementById` returns a permissive element stub: `.style={}`, `.classList`
  with no-op methods, `innerHTML`/`textContent` settable, `appendChild` no-op, etc.), `alert`/`confirm`
  no-ops, `requestAnimationFrame` immediate.
- Parse `game-v2.html` to extract the script load order (don't hardcode it — the list will change),
  load each file via `vm` in shared context.
- **Seeded RNG**: before loading game scripts, replace `Math.random` with a seedable PRNG
  (mulberry32 is fine). Export `setSeed(n)`. All tests that touch RNG must set a seed.
- Helper API for tests: `freshSave()` (localStorage cleared + initGameV2), `getSaveData()`, plus
  a `runCombat(playerTeamSetup, stageIndex)` helper that mirrors the real flow
  (uiStartStoryMission → startWaveCombat → pump combatTick until result) and returns
  `{result, ticks, log}`.

## Task 2 — Test runner (`tests/run.js`)

- Discovers and runs `tests/test-*.js` files, each exporting an array of `{name, fn}` cases.
- Assertions: tiny built-in assert (equal, close, throws, ok) — no dependencies.
- Output: per-file pass/fail counts, non-zero exit code on any failure, total runtime.

## Task 3 — Core tests

1. `tests/test-load.js` — all scripts load with no exception; key globals exist (UNIT_TEMPLATES=66,
   EVOLVED_TEMPLATES=66, STAGES/STORY_MISSIONS=74 entries, HEROES defined, save version 12).
2. `tests/test-save-migration.js` — build minimal fixture saves for at least v5, v8, v10, v11
   (read js/save.js migrations to construct realistic minimal fixtures), load each, assert migration
   reaches v12 without throwing and preserves collection/VE/progress fields.
3. `tests/test-gacha.js` — seeded: 10,000 single rolls at player level 1 and level 20; assert tier
   distribution within ±2% of the weights in code; assert pity triggers at its threshold; assert VE
   is deducted correctly and never goes negative.
4. `tests/test-starup.js` — tiered copy thresholds (T1=3, T2=4, T3=5, T4=8, T5=10 per star),
   star-up consumes copies correctly, stat scaling matches formula in GROUND-TRUTH.md.
5. `tests/test-items.js` — seeded item generation respects tier/rarity bounds; enhancement +0→+10
   cost/pity behavior; gem socketing rules.
6. `tests/test-synergies.js` — element thresholds 2/4/7/10 and archetype thresholds produce the
   documented bonuses; one-family-one-slot rule enforced; evolved-T5-counts-double rule.
7. `tests/test-combat-golden.js` — 3 seeded scenarios (T1 duo vs stage 1; mixed 5-unit team vs a
   mid-stage; a boss stage) run to completion; assert result + tick count + survivor count match
   recorded golden values (generate the goldens on first run, commit them as
   `tests/golden/*.json`, and assert exact match thereafter).
8. `tests/test-economy.js` — mission rewards apply Warehouse/Training multipliers correctly; VE
   invariants (never negative, spend functions reject insufficient funds).

If a test reveals an actual game bug, do NOT fix the game — mark the test `KNOWN_BUG` (runner skips
but reports it loudly) and list it in your report.

## Task 4 — CI

`.github/workflows/tests.yml`: on push + PR, checkout, setup-node (LTS), `node tests/run.js`.

## Verification

1. `node tests/run.js` — full suite green (or KNOWN_BUG-flagged) locally, twice in a row with the
   same seeds → identical golden results (proves determinism).
2. Report: suite inventory, pass/fail/known-bug counts, determinism confirmation, any game bugs found.

Commit as "Prompt 59: headless test harness, core suites, CI". Push the branch. Do not merge.

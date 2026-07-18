# Prompt 66 — Phase 2 closeout: Minion Crash, Enemy Star Scaling, Boss Difficulty

**Branch**: `fix/phase2-closeout` (create from `main`)
**Read first**: `CLAUDE.md`, `BALANCE-REPORT.md` (out-of-scope findings), `BUGS.md` #8/#9/#10,
`tests/balance-sim.js` (your measuring instrument).
**File scope**: `js/combat-boss.js`, `js/combat-core.js`, `js/combat-passives.js`, `js/missions.js`
(generation functions + BOSS_DATA), `js/endless.js` (generation only), tests, BALANCE-REPORT.md,
BUGS.md rows 8-10.

This prompt authorizes generation-LOGIC and BOSS_DATA changes that Prompt 65 was barred from.
Unit/item/ability stats remain off-limits.

## Task 1 — Fix BUGS #8 (CRITICAL): minion passive-state crash

Boss-spawned minions skip `initUnitPassiveState()`; a minion with an on-attack passive crashes
combat. Route ALL unit spawn paths (boss minions, reinforcement-pressure spawns, any future spawner)
through one shared spawn helper that fully initializes combat state (passives, mana, status arrays,
hero fields default-safe). Regression test: seeded infernal_wyvern fight runs to completion with
flame_warrior minions attacking.

## Task 2 — Fix BUGS #9: region-scaled enemy stars

Add region-based enemy star scaling to `generateMissionWave()` / `generateEndlessEnemies()`:
e.g. R1-R2 → 1★, R3-R4 → 2★, R5-R6 → 3★, R7 → 3-4★, R8 → 4★; endless floors continue the
progression (`// TUNABLE`, pick values that kill the 9 remaining freewins without creating walls —
iterate with the sim). Reduce the Prompt-65 budget inflation for R6-R8 if star scaling overshoots
(record reversals in BALANCE-REPORT.md).

## Task 3 — Fix BUGS #10: boss difficulty

Adjust the `BOSS_DATA` HP-scaling formula (and per-boss HP baselines if needed) so r1_boss and
r8_boss land in the 40-60% clear-rate band at reference power in the sim. Keep boss MECHANICS
untouched — this is a numbers pass. Element bosses should also be beatable at their unlock-time
reference power (R4+); verify with the sim.

## Task 4 — Verify + document

- `node tests/balance-sim.js`: 0 non-boss walls, all bosses 40-60%, freewins past R2 ≤ 3.
- `node tests/run.js` fully green twice. Golden-file rule as in Prompt 65 (regenerate deliberately
  only if a golden stage's generation changed; explain).
- Update BALANCE-REPORT.md (final tables) and BUGS.md rows 8-10 to FIXED with one-line summaries.

Commit as "Prompt 66: minion spawn init, region star scaling, boss difficulty pass". Push. Do not merge.

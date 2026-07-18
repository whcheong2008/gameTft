# Prompt 65 — Phase 2.10: Balance Verification Pass

**Branch**: `balance/phase2-pass` (create from `main`)
**Read first**: `CLAUDE.md`, `MASTERPLAN.md` § Phase 2, `PROGRESSION-REWORK.md` (income/power
curves), `GROUND-TRUTH.md` (formulas), `js/unit-simulator.js` (existing sim infrastructure).
**File scope**: NEW `tests/balance-sim.js` + `BALANCE-REPORT.md`; tuning edits ONLY to stage/wave
data in `js/missions.js` (budgets, wave counts, maxCost) and the `// TUNABLE` constants in
`js/endless.js` / `js/challenges.js` / `js/combat-encounters.js`. Do NOT touch unit stats, item
stats, or ability numbers — those carry 131 human-playtested adjustments.

## Task 1 — Balance simulator CLI (`tests/balance-sim.js`)

`node tests/balance-sim.js` (not part of the test suite) simulating a reference player:
- **Reference progression model**: for each region, derive the expected player state (level, team
  size, unit stars, roster tier mix) from cumulative VE income of all prior stages (first-clear +
  a modest grind factor, `// MODEL` constants documented in the file) fed through gacha expected
  values and tiered star-up costs. Document the model at the top of the file.
- For each of the 74 stages: run 7 seeded combats with the reference team for that region.
  Output a table: stage, clear rate, avg result margin (surviving units / ticks), star rating avg.
- Also simulate: endless floors 1–30 with a post-R8 reference team (find the wall floor);
  the 4 element bosses; time-trial pars (beatable at reference power?).

## Task 2 — Report (`BALANCE-REPORT.md`)

Full results table + flagged outliers:
- **Wall**: clear rate < 40% at reference power (excluding bosses, which may sit at 40-60%).
- **Freewin**: clear rate 100% with zero units lost across all seeds for a NON-tutorial stage
  (regions 3+).
- Endless: floor where clear rate crosses 50% (should be roughly floor 10–20 at reference power;
  report, don't force).

## Task 3 — Tuning

Fix flagged outliers via stage data / TUNABLE constants only. Re-run the sim after each change.
Iterate until no walls remain and freewins past region 2 are rare. Record every change in
BALANCE-REPORT.md ("was → now → why").
**Golden-file rule**: if you must retune a stage used by `tests/golden/*.json` (r1_s1, r2_s5,
r1 boss), regenerate the golden deliberately and explain in the report; otherwise goldens must
stay byte-identical.

## Verification

`node tests/run.js` fully green twice. `node tests/balance-sim.js` runs clean end-to-end and its
final table matches BALANCE-REPORT.md. Report: outliers found, changes made, final clear-rate
summary per region.

Commit as "Prompt 65: balance simulator + Phase 2 balance pass". Push. Do not merge.

# Prompt 61 — Phase 2.4/2.5/2.9: Region Reward Payouts, Achievement Wiring, Cleanups

**Branch**: `feature/phase2-rewards` (create from `main`)
**Read first**: `CLAUDE.md`, `MASTERPLAN.md` § Phase 2, `PHASE2-AUDIT.md` items 5+6, `BUGS.md` #5.
**File scope**: `js/missions.js`, `js/hub.js`, `js/items.js`, `js/teams.js`, `js/save.js`,
`js/ui-missions.js`, `js/ui-hub.js`, `js/ui-items.js`, `game-v2.html`, tests.
Do NOT touch `js/combat-*.js` or `js/heroes.js` — another worker is editing those in parallel.
Combat-driven stats (bossesDefeated, deathlessBossClears, maxSingleHit, fastestWin,
maxElementSynergy) are OUT of scope — a follow-up task wires those onto the new combat event bus.

## Task 1 — Region reward payouts (PHASE2-AUDIT item 6)

`claimRegionReward` (missions.js:2559) currently pays only `gold`→VE and `freeMultiRoll`. Fix:
- `randomUnit`: roll a random base unit of the specified cost, add copies to collection, show what
  was won in the claim feedback.
- `essenceChoice` / `mythicMaterialChoice`: simple picker modal in ui-missions (list options, click
  to choose, then claim completes). No new save fields beyond what claiming already uses — if you
  must add one, bump save version with migration per CLAUDE.md.
- Fix stale names in reward description strings (e.g. "Evolution Lab", "Forge Level 3") to the
  current building names in hub.js. Rewards do NOT unlock buildings — buildings stay VE/level-gated;
  make descriptions honest about what's actually granted.

## Task 2 — Achievement stat wiring (non-combat part, PHASE2-AUDIT item 5)

`trackStat` (hub.js:454) has zero call sites. Wire the non-combat stats so their achievements work:
- `forgeOperations`: every forge op (reroll/disassemble/transmute/craft paths in items.js).
- `uniqueBondsUsed`: on team deploy (teams.js), record distinct active bond ids into the stat
  (check how the achievement reads it and store accordingly).
Confirm `checkAchievements` picks both up (achievements fire via existing call sites).

## Task 3 — Cleanups

- Delete `js/ability-templates.js` (confirmed dead — PHASE2-AUDIT item 10).
- Fix BUGS.md #5: delete the shadowed dead `applyMissionRewards` in items.js:1605 (missions.js's
  version is the live one). Then convert the KNOWN_BUG case in `tests/test-economy.js` into a real
  assertion of the surviving behavior. Also delete its dead partner `generateMissionRewards` if
  (and only if) nothing else calls it — verify first.
- Update BUGS.md rows #4/#5 status only if you fixed them (#5 yours; #4 belongs to the other worker —
  leave it).

## Task 4 — Tests

- New `tests/test-region-rewards.js`: seeded claims — VE payout, freeMultiRoll, randomUnit adds
  copies of the right cost, essence/material choice grants the chosen one, double-claim blocked.
- New cases in an appropriate suite for forgeOperations and uniqueBondsUsed stat increments +
  achievement firing.

## Verification

`node tests/run.js` fully green twice (economy KNOWN_BUG now a real pass; goldens untouched).
Also verify the picker modal renders: describe the DOM structure you added (orchestrator will
browser-verify interactively). Report: payout matrix (region → what's now actually granted),
stat wiring call sites, cleanup confirmations.

Commit as "Prompt 61: region reward payouts, achievement stat wiring, dead-code cleanup".
Push the branch. Do not merge.

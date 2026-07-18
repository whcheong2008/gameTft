# Prompt 64 — Phase 2.6/2.7: Endless Mode (The Abyss) + Challenge Modes

**Branch**: `feature/phase2-endless` (create from `main`)
**Read first**: `CLAUDE.md`, `MASTERPLAN.md` § Phase 2, `PHASE2-AUDIT.md` items 1+2,
`CONTENT-DESIGN.md` (The Abyss + challenge modes sections), `SCOPE.md` (endless = core, personal
bests only — no server leaderboards), `js/combat-encounters.js` (reuse as floor modifiers).
**File scope**: NEW files (`js/endless.js`, `js/challenges.js`), `js/missions.js`, `js/ui-missions.js`,
`js/ui-hub.js` (entry buttons only), `js/save.js` (backfill convention), minimal `js/ui-combat.js`
(mission-flow seams only), `game-v2.html`, tests. No other combat file edits.

## Task 1 — Endless mode: The Abyss (`js/endless.js`)

- Unlocks after clearing the R8 boss (`r8_boss` in stageProgress).
- Infinite floors, 1 wave each; enemy budget scales per floor (start ≈ R7-stage budget, grow
  ~8%/floor compounding; `// TUNABLE`). Enemy tier mix shifts upward with depth.
- **Floor modifiers** from floor 3+: each floor rolls one — reuse the 6 encounter mechanics via
  `combat-encounters.js` (pass the mechanic key through the mission/stage object) plus 3-4 pure
  stat modifiers (e.g. "enemies +25% ATK", "player -20% healing"; `// TUNABLE`). Show the modifier
  on the floor intro and combat banner (the encounter banner already renders from stage data).
- Between floors: continue (no healing reset — per CONTENT-DESIGN the run is a gauntlet; units
  keep current HP; dead units stay dead for the run) or retreat (bank rewards).
- Rewards: VE per floor scaling with depth, paid on retreat/defeat; first-time floor milestones
  (every 5 floors) pay a bonus. `// TUNABLE` values.
- Personal best: `saveData.endless = {bestFloor, totalRuns, ...}` via backfill convention. Show
  "Your best: Floor N" on the entry screen.

## Task 2 — Challenge modes (`js/challenges.js`)

Unlock after clearing R4's boss. Entry screen listing:
1. **Time Trial** — clear a chosen already-cleared stage under a par time (par = `// TUNABLE`
   per-stage formula off stage budget). Reward: VE; best time stored.
2. **Survival** — endless waves on a fixed board (reuse endless wave generation, no floors/modifiers);
   best wave count stored.
3. **Restricted Roster** — clear a chosen cleared stage with a rolled restriction (mono-element team,
   no items, max team size 4, no healers — roll 1). Reward: VE multiplier on the stage's base reward.
4. **Element Bosses** — the 4 orphaned bosses (missions.js:1541–1658: infernal_wyvern,
   tidal_leviathan, stone_colossus, storm_phoenix) as standalone boss fights via the existing boss
   framework. First-clear reward each (VE + 1 essence of the boss's element); repeatable.
Track per-challenge bests in `saveData.challenges` (backfill convention).

## Task 3 — Cleanup

Delete the dead encounter scaffold in `js/missions.js` (~lines 1151–1487: orphaned
`ENCOUNTER_MECHANICS` / `setupEncounterMechanics` / `tickEncounterMechanics` built against a unit
shape that doesn't exist; `js/combat-encounters.js` is the live implementation). Verify zero callers
before deleting.

## Task 4 — Tests (`tests/test-endless.js`, `tests/test-challenges.js`)

- Endless: locked before R8 clear; floor budget scaling monotonic; modifier assignment from floor 3;
  HP/death carryover between floors; retreat banks VE; bestFloor updates; defeat ends run and pays.
- Challenges: locked before R4 boss; each mode playable to a result headlessly (seeded); restriction
  actually enforced (e.g., mono-element deploy check rejects mixed team); element bosses load and
  fight via boss framework; bests persist.
- Goldens must stay byte-identical.

## Verification

`node tests/run.js` fully green twice. Report: unlock gates, TUNABLE table, per-mode notes,
what the entry screens look like (DOM summary) for orchestrator browser verification.

Commit as "Prompt 64: endless mode (The Abyss) + 4 challenge modes + dead scaffold removal".
Push. Do not merge.

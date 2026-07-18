# Bug Tracker — HTML Prototype

> Log bugs during playtesting. Game-breakers get fixed now.
> (2026-07-18: Unity is parked per MASTERPLAN.md — "deferred to Unity" no longer exists as a
> category; the web game is the product. Old deferrals fold into MASTERPLAN phases.)

## Severity Levels
- **CRITICAL**: Game crashes, softlocks, save corruption, can't progress
- **HIGH**: System not working (combat broken, gacha not rolling, heroes not applying)
- **MEDIUM**: Numbers wrong, UI broken but playable, visual glitches
- **LOW**: Polish issues, text errors, minor UI quirks → Unity

## Active Bugs (Fix Now)

| # | Severity | System | Description | Status |
|---|----------|--------|-------------|--------|
| 1 | CRITICAL | Team Builder / Heroes | Team builder crashes after hero assignment — `unitHero.def.emoji.charAt(0)` fails because HERO_DATA has no `emoji` field. Causes: can't navigate back, black squares on grid (partial render before crash). | **FIXED** — replaced with unicode ⚔ |
| 2 | CRITICAL | Combat / Synergies | Combat crashes on wave start — `unitHasArchetype is not defined` (main-v2.js:6502). Function exists in synergies.js but that file is NOT loaded in V2. Combat board renders but units never fight. | **FIXED** — added `unitHasArchetype()` to units-core.js |
| 3 | CRITICAL | Combat / Stasis | Enemy units with Burrow passive (Mud Stalker, Quake Reaper) are permanently untargetable. Stasis timer only decremented in player-unit loop, not for enemies. Enemy Mud Stalker stays burrowed forever. | **FIXED** — added stasis decrement in allUnits loop |
| 4 | MEDIUM | Combat / Synergies | `updateActiveSynergies` (combat-core.js ~1316) counts flat +1 per unit, ignoring `getUnitArchetypeContribution()` (ascension double-count / secondary archetype). UI previews use the correct helper → preview vs real-combat mismatch. Latent while ascension is unreachable, but must be fixed before ascension ships. Found by test-synergies.js (KNOWN_BUG). | **FIXED** (Prompt 60) — `updateActiveSynergies` now uses `getUnitArchetypeContribution()`; test-synergies KNOWN_BUG converted to a real assertion. |
| 5 | LOW | Rewards | `applyMissionRewards` in items.js:1605 is dead code permanently shadowed by the same-named function in missions.js:2706 (different reward shape). Harmless today, live footgun. Found by test-economy.js (KNOWN_BUG). | **FIXED** — deleted the dead items.js copy; missions.js's version is the sole, live definition. test-economy.js KNOWN_BUG converted to a real passing assertion. |
| 6 | HIGH | Bonds | Unit bonds NEVER applied in combat: inline detection read `bond.effect`, a field UNIT_BONDS entries don't have (they use `bonus`) — silently applied nothing. Found during Prompt 62. | **FIXED** (Prompt 62) — combat now uses canonical `detectActiveBonds()` + full `bonus` schema. |
| 7 | HIGH | Bonds | `detectActiveBonds()` read `saveData.buildings.bond_hall`, renamed to `kindred_circle` in a save migration — bond multiplier and trio unlock permanently zeroed. | **FIXED** (Prompt 62) — delegates to `getBondHallBonuses()` as single source of truth. |

## Deferred to Unity

| # | Severity | System | Description |
|---|----------|--------|-------------|
| | | | (none yet) |

## Known Limitations (Not Bugs)

- No story content / cutscenes (intentionally deferred to Unity)
- No hard mode stages (design not finalized)
- No endless mode / challenge modes (deferred)
- Fragment stub in heroes.js (harmless, returns empty)
- Many hero skill node effects are placeholder `function(unit, hero) {}` — combat integration is partial. Full implementation in Unity.
- Item system may have old references to "gold" instead of "Veil Essence" in some UI strings

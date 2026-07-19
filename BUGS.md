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
| 8 | CRITICAL | Combat / Bosses | Boss-spawned minions skip `initUnitPassiveState()` — crash when a minion with an on-attack passive (e.g. flame_warrior) attacks. Reachable via infernal_wyvern element boss challenge. Found by balance sim (Prompt 65). | **FIXED** (Prompt 66) — all mid-combat spawn paths (boss minions, reinforcement-pressure adds) now route through one shared helper, `initSpawnedCombatUnitState()` (combat-core.js), that fully initializes passives/mana/status/CC state. Regression test: tests/test-boss-minions.js. |
| 9 | MEDIUM | Balance / Generation | Enemy star level is fixed in `generateMissionWave()`/`generateEndlessEnemies()` regardless of region → late-region freewins persist after budget tuning (9 remain, mostly R7). | **FIXED** (Prompt 66) — region/floor-scaled per-enemy chance to roll 1 star higher (`ENEMY_STAR_BANDS_BY_REGION` in missions.js, `ENDLESS_ENEMY_STAR_BANDS` in endless.js), starting at R6. Clears all 9 freewins with 0 new walls (see BALANCE-REPORT.md). |
| 11 | HIGH | Combat / Abilities | 12 roster units (ashen_watcher, abyssal_guardian, grove_warden, tempest_weaver, voltfang_stalker, iron_duelist + their 6 evolved forms) have full ability data and mana-cast wiring but NO `case` in `executeAbility` — their casts do nothing mechanically. Pre-existing; found by Prompt 73's VFX mapping. | **FIXED** (Prompt 74) — added all 12 `executeAbility` cases in combat-abilities.js (+ a small combat-damage.js extension for iron_duelist/warforged_champion's "empower next auto-attack" shape). Innate PASSIVE_DATA effects for these 6 units remain unimplemented (need new on_heal/on_crit/on_ability_cast passive-trigger dispatch machinery that doesn't exist yet) — out of this bug's scope (BUGS #11 was executeAbility only); flagged separately. |
| 10 | MEDIUM | Balance / Bosses | `BOSS_DATA` HP-scaling formula leaves r1_boss and r8_boss as hard walls at reference player power. | **FIXED** (Prompt 66) — full BOSS_DATA difficulty pass: all 8 story bosses + all 4 element bosses now beatable at reference power (see BALANCE-REPORT.md "Tuning Changes" for exact numbers and the note on why the sim reports boss clear rates as exactly 0%/100%, never fractional, regardless of tuning). |
| 12 | MEDIUM | Combat / Passives | The same 6 units from #11 (+ evolved) have innate PASSIVE_DATA that never executes — 3 of them need passive trigger types that don't exist in combat-passives.js (on_heal, on_crit, on_ability_cast). Found during Prompt 74. | **FIXED** (Prompt 75) — added on_heal/on_crit/on_ability_cast as combatEvents subscribers (unitHealed/unitDamaged.isCrit/abilityCast) feeding the existing processPassives machinery, plus a small combat-status.js burn-immunity gate and combat-passives.js tick-time companions for passives whose declared trigger fires once (combat_start Rival tracking for iron_duelist/warforged_champion; Vortex tick/expiry for tempest_weaver/stormweft_oracle) but need continuous evaluation. Implemented all 12 innate passives (6 base + 6 evolved). Also found and fixed a pre-existing blocking bug while wiring this: `unit.isEvolved` was never set anywhere in the live combat pipeline, so `getPassiveData()` silently returned null for EVERY evolved unit in the game (not just this bug's 6) — see js/combat-core.js's `su.isEvolved = ...` comment. Re-tuned r8_s2 + r8_boss (void_sovereign atkScaling) in js/missions.js — the passive fixes made buildReferenceTeam()'s R8 picks stronger a second time, re-flipping two of Prompt 74's already-tuned stages into freewins (see BALANCE-REPORT.md "Tuning Changes"). Tests: tests/test-passive-triggers.js. |
| 13 | HIGH | Save / Migration | `migrateSave()`'s v11→v12 step (js/save.js) dereferenced `data.missions.regionProgress[n]` to backfill all 8 regions without first checking `data.missions.regionProgress` itself existed — any save missing that whole object crashed with `Cannot read properties of undefined` instead of being backfilled like every other version-agnostic default in the same function. Unreachable via normal play (regionProgress has existed on every real save since v6) but directly reachable via Prompt 82's new save-import feature, which accepts arbitrary hand-edited/corrupted JSON through this exact code path. Found by a new tests/test-onboarding.js migration fixture. | **FIXED** (Prompt 82) — guard `if (!data.missions.regionProgress) data.missions.regionProgress = {};` before the per-region backfill loop. |

## Deferred to Unity

| # | Severity | System | Description |
|---|----------|--------|-------------|
| | | | (none yet) |

## Known Limitations (Not Bugs)

> Updated 2026-07-18 at Phase 2 completion (`v0.7.0-logic-complete`). Old entries about missing
> endless/challenges/lore/hero-skills are resolved — those systems now exist (prompts 60-66).

- No hard mode stages (design not finalized)
- Fragment stub in heroes.js (harmless, returns empty)
- Boss fights are deterministic at fixed team composition (no crit/dodge/random targeting in story
  boss kits) — sim reports 0%/100% only; tuned for close fights instead (see BALANCE-REPORT.md)
- 3 Time Trial pars remain unbeatable at reference power (acceptable — they're stretch goals)
- Hero skill nodes: a handful of APPROXIMATED effects where the engine lacks primitives
  (documented inline in heroes.js, tagged APPROXIMATED)

# Phase 2 Gap Audit — 2026-07-18

> Code-level audit of what actually exists in the HTML game vs. what the design docs claim.
> Produced by read-only audit agent; the code is the truth. Feeds the Phase 2 specs (MASTERPLAN.md).

## Summary

CONTINUITY.md's "content-complete" claim is overstated. Core loop, 74 stages, items, gacha,
heroes-as-stat-bonuses all work. But several designed systems are absent or half-wired.

## P0 — designed core features entirely absent

| System | Finding |
|---|---|
| Endless mode (The Abyss) | No code, no UI. Only ability-name string matches. |
| Challenge modes | No code. The 4 element bosses (infernal_wyvern, tidal_leviathan, stone_colossus, storm_phoenix) exist as orphaned data at missions.js:1541–1658 — no stage/UI references them. |
| Lore system in-game | No codex/unit lore/bond stories/boss dialogue rendering anywhere. The only "codex" is the Equipment Codex (item discovery, ui-v2.js:3670). Lore exists only in docs. |
| Encounter mechanics | Stages carry `encounterMechanic` labels (protect_objective, vip_target, countdown, reinforcement_pressure, …) but NOTHING consumes the field outside missions.js. All 6 mechanics inert. |

## P1 — half-wired / silently broken

| System | Finding |
|---|---|
| Hero skill trees | 108 `apply:` nodes in heroes.js: 84 are empty placeholders (conditional/triggered nodes with no combat event hooks); 13 write `unit.heroSkillBonuses.*` flags that nothing reads; only ~11 flat-stat nodes actually work (applied via applyHeroStatBonuses, main-v2.js:124). |
| Achievement stat pipeline | `trackStat` (hub.js:454) has ZERO call sites. 7 achievements permanently unobtainable: bossesDefeated, deathlessBossClears, maxSingleHit, fastestWin, maxElementSynergy, uniqueBondsUsed, forgeOperations. Achievements checked via checkAchievements (ui-v2.js:74,156,3028,4102) — the rest do fire. |
| Region reward payouts | `claimRegionReward` (missions.js:2559) pays only `gold`→VE and `freeMultiRoll`; ignores `randomUnit`, `essenceChoice`, `mythicMaterialChoice`, and every promised building unlock. Reward descriptions also reference stale building names. |
| Unit bonds | Work in combat (main-v2.js:221–251) but only with Bond Hall built (by design). Canonical `detectActiveBonds` (units-bonds.js:152) is dead code — combat re-implements detection inline. |

## P2 — cleanup

- `js/ability-templates.js` (83KB): loaded by no HTML, all 12 globals it defines referenced nowhere else. **Confirmed safe to delete.**
- "gold" survives only as internal identifiers (rewards.gold, transmuteGoldCost, #player-gold); no player-visible mislabels.
- Docs drift: CONTINUITY.md claims daily quests/achievements "DONE"; reward descriptions name old buildings.

## Resolved design calls (orchestrator, 2026-07-18)

- **Daily quests: stay removed.** hub.js:297 comment records a deliberate later decision ("doesn't fit
  single-player design"). Do not rebuild. Docs to be reconciled instead.
- **Ascension: stays deferred** per SCOPE.md (dormant data + stat plumbing harmless; `ascendUnit`
  intentionally unreachable). Not Phase 2 work.
- **Bond Hall gating: by design.** Only cleanup is deleting/using `detectActiveBonds` consistently.
- Everything else in P0/P1 is real Phase 2 work — see MASTERPLAN.md Phase 2 task list.

## Verified-fine

- BUGS.md: all 3 active bugs marked FIXED, nothing open.
- Visible currency labels correctly say "VE" everywhere in the V2 path.

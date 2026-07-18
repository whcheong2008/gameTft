# Prompt 60 — Phase 2.2: Combat Event Hooks + Hero Skill Effects

**Branch**: `feature/phase2-hero-skills` (create from `main`)
**Read first**: `CLAUDE.md`, `MASTERPLAN.md` § Phase 2, `PHASE2-AUDIT.md` item 7, `HERO-REWORK.md`
(the source of truth for what every skill node does), `BUGS.md` #4.
**File scope**: `js/combat-*.js`, `js/heroes.js`, `js/units-core.js`, tests. Do NOT touch
`js/missions.js`, `js/hub.js`, `js/items.js`, or ui files except where a hook genuinely requires it
(report any such touch) — another worker is editing those in parallel.

## Problem

108 hero skill nodes in heroes.js: only ~11 flat-stat nodes work. 84 are empty placeholders needing
combat event hooks that don't exist; 13 write `unit.heroSkillBonuses.*` flags nothing reads
(PHASE2-AUDIT.md item 7 has the breakdown).

## Task 1 — Combat event framework (`js/combat-events.js`, load before combat-core)

A minimal global event bus for combat:
- `combatEvents.on(event, fn)`, `combatEvents.emit(event, payload)`, `combatEvents.reset()`
  (reset called at combat start).
- Emit from the existing pipeline at these points (find the right seams in combat-core/damage/status/
  abilities): `combatStart`, `waveStart`, `unitDamaged` (after damage resolution: {source, target,
  amount, isCrit}), `unitHealed`, `unitKilled` ({killer, victim}), `ccApplied` ({source, target, type}),
  `abilityCast` ({caster, key}), `tick` ({dt}), `combatEnd` ({result}).
- Derived conditions the nodes need (evaluate on relevant events, not every tick where avoidable):
  ally-below-X%-HP, last-surviving-ally, adjacent-ally checks.

## Task 2 — Implement all 108 nodes

- Convert the 13 dead `heroSkillBonuses` flag-writers to real effects (either combat consumes the
  flag at the right point, or reimplement as event listeners — pick per node, be consistent).
- Implement the 84 placeholders as event listeners / stat hooks per HERO-REWORK.md's description of
  each node. Register listeners at combat start for the assigned hero's LEARNED nodes only.
- Keep the ~11 working flat-stat nodes as they are (they're fine).
- If a node's description is genuinely unimplementable with the current engine, implement the closest
  faithful version and list it in your report (do not silently skip).

## Task 3 — Fix BUGS.md #4 (synergy counting)

`updateActiveSynergies` (combat-core.js ~1316) must use `getUnitArchetypeContribution()`
(units-ascension.js:150) so real combat matches the UI previews (Transcendent primary counts 2,
ascended secondary counts). Behavior is unchanged today (ascensionTier is always null) but the
preview/real mismatch must die. Then convert the KNOWN_BUG case in `tests/test-synergies.js` into a
real passing assertion.

## Task 4 — Tests

- New `tests/test-hero-skills.js`: for each of ~10 representative nodes across all 6 heroes (include
  at least one converted flag-node and several event-driven ones), seeded headless combat with the
  hero assigned + node learned vs. not learned → assert the effect changed the outcome/stat it claims.
- Golden combat files must remain byte-identical (no hero assigned in golden scenarios). If any
  golden changes, STOP and investigate — that means you changed baseline combat behavior.

## Verification

`node tests/run.js` fully green (including your new suite; synergy KNOWN_BUG now a real pass), twice,
goldens unchanged. Report: per-node implementation table (node → mechanism → tested?), any
approximated nodes, any file-scope exceptions.

Commit as "Prompt 60: combat event framework + all 108 hero skill nodes + synergy count fix".
Push the branch. Do not merge.

# Prompt 75 — Fix BUGS #12: Missing Passive Triggers + 6 Units' Innate Passives

**Branch**: `fix/passive-triggers` (create from `main`)
**Read first**: `CLAUDE.md`, `BUGS.md` #12, `js/combat-passives.js` (existing trigger dispatch),
`js/combat-events.js` (prefer wiring new triggers off the event bus), PASSIVE_DATA entries for
ashen_watcher, abyssal_guardian, grove_warden, tempest_weaver, voltfang_stalker, iron_duelist
(+ evolved) in `js/units-abilities.js` / UNITS-DESIGN.md.
**File scope**: `js/combat-passives.js`, `js/combat-events.js` (emit-data only if needed),
minor `js/combat-damage.js`/`js/combat-abilities.js` seams, tests. Do NOT touch `js/vfx*.js`,
`js/render-pixi.js`, `js/ui-combat.js` — a parallel worker owns those.

## Tasks

1. Add the missing passive trigger types to the dispatch: `on_heal` (unit heals or is healed —
   read the specific passive's wording), `on_crit`, `on_ability_cast`. Implement them as
   combatEvents subscribers (unitHealed / unitDamaged.isCrit / abilityCast already exist) feeding
   the existing processPassives machinery — keep reentry guards consistent with current patterns.
2. Implement the 12 innate passives (6 base + 6 evolved) per PASSIVE_DATA/UNITS-DESIGN.md, using
   the same approximation discipline as Prompt 74 (document ambiguity calls; match same-tier
   archetype precedent for numbers).
3. Tests: `tests/test-passive-triggers.js` — each new trigger type fires exactly when specified
   (and not reentrantly); each of the 12 passives has a seeded case asserting its effect.
4. Suite green twice. Goldens: same policy as Prompt 74 (none of these units in fixtures → expect
   byte-identical; else regenerate deliberately with explanation).
5. `node tests/balance-sim.js` re-run (reference teams use some of these units); tune only
   budgets/counts/TUNABLEs if targets drift. Update BUGS.md #12 + BALANCE-REPORT.md.

Commit as "Prompt 75: passive trigger types + 12 innate passives (BUGS #12)". Push. Do not merge.

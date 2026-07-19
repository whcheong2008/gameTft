# Prompt 74 — Fix BUGS #11: 12 Units With Unimplemented Abilities

**Branch**: `fix/missing-abilities` (create from `main`)
**Read first**: `CLAUDE.md`, `BUGS.md` #11, `js/units-abilities.js` (the ability DATA for the 12),
UNITS-DESIGN.md (design intent), `js/combat-abilities.js` (the switch + existing patterns),
`js/vfx-abilities.js` (recipes already exist for these — match your mechanics to them where sane).

## Task

Implement the missing `executeAbility` cases for: ashen_watcher, abyssal_guardian, grove_warden,
tempest_weaver, voltfang_stalker, iron_duelist, and their 6 evolved forms. Follow the ability data +
UNITS-DESIGN.md descriptions; reuse the established helpers (getUnitsInRadius, hexRay, dealDamage,
dealHealing, addStatus, grid.js) and existing switch-case idioms. Where a description is ambiguous,
match the closest existing pattern of the same archetype/tier and document the call.

## Tests + verify

- New `tests/test-missing-abilities.js`: for each of the 12, a seeded cast asserting its mechanical
  effect happened (damage dealt / status applied / heal / summon — whatever the kit says).
- Suite green twice. Goldens: verify none of the 12 appear in golden fixture teams or their enemy
  waves — if any do, goldens will legitimately change; regenerate deliberately and explain which
  fixture and why. Otherwise byte-identical.
- `node tests/balance-sim.js`: these units can roll as enemies, so outcomes may shift. Re-run;
  fix any new walls/freewins via stage budgets/TUNABLEs only (Prompt 65/66 rules). Report deltas.
- Update BUGS.md #11 to FIXED with a one-liner.

Commit as "Prompt 74: implement 12 missing unit abilities (BUGS #11)". Push. Do not merge.

# Prompt 73 — Phase 4.3: Ability VFX Coverage (all 132 abilities)

**Branch**: `feature/phase4-ability-vfx` (create from `main`)
**Read first**: `CLAUDE.md`, `MASTERPLAN.md` § Phase 4, `js/vfx.js` (the 12 primitives),
`js/combat-abilities.js` (what each ability actually does), `js/units-abilities.js` (descriptions),
UNITS-DESIGN.md for flavor where code is terse.

## Goal

Every one of the 132 abilities (66 base + 66 evolved) plays a distinct, flavor-appropriate effect
composition when cast — replacing the generic aura+beacon from Prompt 72 for mapped abilities.

## Task 1 — Recipe registry (`js/vfx-abilities.js`, NEW)

- `ABILITY_VFX = { <abilityKey>: recipe }` where a recipe is data, not code:
  `{ cast: [steps], travel: [steps], impact: [steps] }` — each step
  `{ p: 'primitiveName', ...opts, delay, at: 'caster'|'target'|'cells'|'path'|'each-target' }`.
  A small interpreter executes recipes off the `abilityCast` event payload (extend the payload with
  target/cells data where the ability executor knows it — event DATA only, zero behavior change,
  goldens byte-identical).
- Element + archetype **default recipes** for anything unmapped (guarantees 132/132 coverage from
  day one, then explicit entries override).
- Explicit recipes for ALL 132 (this is the bulk of the task — batch internally ~30 at a time,
  verifying suite green between batches). Match mechanics: AoE novas sized to the real
  `cellsInRange`, chains use the real bounce list, pierce beams along the real `hexRay` cells,
  cones over the real cone cells (the executor computes these — pass them through the event).
- The 12 primitives should suffice; if a recipe genuinely needs a new primitive, you may add at
  most 2 (document why). Respect the 400-particle cap — dense recipes must degrade (fewer
  particles), not exceed.

## Task 2 — Signature moments

The 6 T5 legendary passives (MaxMana 0) and the 8 story bosses' abilities get hand-tuned, bigger
compositions (screen-noticeable but still capped). Evolved abilities reuse their base recipe with
an intensity/gold-tint modifier by default; give distinct recipes to the ~12 evolved abilities
whose mechanics differ substantially from base (list them in the report).

## Task 3 — Tests

- `tests/test-ability-vfx.js`: registry completeness (132/132 resolve to a recipe — explicit or
  default), recipe schema validation (every step names a real primitive, every `at:` is legal),
  interpreter smoke via seeded fights with a VFX.play spy (a chain ability produces a chain call
  with >1 targets; an AoE produces cell-anchored steps; a pierce produces path steps), RNG-stream
  isolation still holds (Prompt 72's test pattern).
- Suite green twice; goldens byte-identical.

## Verification

Browser (port 8124): run fights featuring at least one chain (shock_mage), one big AoE, one pierce
(wind_archer line), one cone (fire_dragon), a T5 legendary, and one boss — visually distinct,
correctly positioned effects; performance instrumentation as in Prompt 72 (report ms/frame at 4×
in a dense fight).

Report: coverage table (how many explicit vs default-with-override), the distinct-evolved list,
any new primitives, perf numbers.

Commit as "Prompt 73: ability VFX recipes — 132/132 coverage". Push. Do not merge.

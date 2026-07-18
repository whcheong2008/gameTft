# Prompt 62 — Phase 2.3 + rest of 2.5/2.9: Encounter Mechanics, Combat-Driven Stats, Bond Unification

**Branch**: `feature/phase2-encounters` (create from `main`)
**Read first**: `CLAUDE.md`, `MASTERPLAN.md` § Phase 2, `PHASE2-AUDIT.md` items 5+8+11,
`MISSIONS-DESIGN.md` § encounter mechanics (the design source of truth).
**File scope**: `js/combat-*.js`, `js/ui-combat.js`, `js/missions.js` (read stage fields; minor edits
only), `js/units-bonds.js`, tests. Another worker is editing ui-hub/ui-roster/ui-missions/ui-heroes
and creating lore files in parallel — do not touch those.

## Task 1 — Encounter mechanics (PHASE2-AUDIT item 8)

Stages carry `encounterMechanic` labels but nothing consumes them. Implement all 6 per
MISSIONS-DESIGN.md, driven off the Prompt-60 event bus (`js/combat-events.js`) where possible:

1. **VIP Target** — a marked enemy buffs/heals its allies until killed; killing it removes the effect.
2. **Countdown** — a destructible structure (use a stationary unit entity) wipes the player team if
   not destroyed within its timer; show remaining time in the combat UI.
3. **Reinforcement Pressure** — fixed spawn cells produce extra enemies on an interval until the
   wave is cleared (cap total spawns per design).
4. **Protect the Objective** — a friendly NPC entity must survive the wave; loss if it dies.
5. **Split Formation** — player team is deployed in two forced groups (deployment constraint,
   applied when building the combat board).
6. **Escalating Threat** — enemy stats ramp on an interval; show stack count in the combat UI.

Requirements:
- A mechanic banner in the combat UI (`ui-combat.js`): icon + one-line description at wave start so
  the player knows the rule (keep it simple — reuse the wave-transition visual language).
- Mechanics apply per stage data; stages without the field are unaffected (golden scenarios use
  plain stages — goldens must stay byte-identical).
- If MISSIONS-DESIGN.md's numbers are unimplementably vague somewhere, pick sane values, tag with
  `// TUNABLE`, and list them in your report.

## Task 2 — Combat-driven achievement stats (rest of PHASE2-AUDIT item 5)

Wire via the event bus (listeners registered at combat start, written back on combatEnd):
- `bossesDefeated` (+1 per boss stage victory), `deathlessBossClears` (+1 boss win with zero player
  unit deaths), `maxSingleHit` (max damage in one hit, mode 'max'), `fastestWin` (seconds, keep the
  minimum — note trackStat has no 'min' mode; add one or store negated with 'max' — prefer adding
  'min' to trackStat cleanly), `maxElementSynergy` (highest element synergy count active at combat
  start, mode 'max').
- Use `trackStat` (hub.js:454) — if you add a 'min' mode, that single hub.js edit is allowed
  (report it; nothing else in hub.js).

## Task 3 — Bond detection unification (PHASE2-AUDIT item 11)

Combat re-implements bond detection inline (combat-core.js, formerly main-v2.js:221–251) instead of
calling `detectActiveBonds()` (units-bonds.js:152). Make combat use the canonical function; behavior
must not change (same bonds, same multipliers, Bond Hall gating preserved). Delete the inline copy.

## Task 4 — Tests

- `tests/test-encounters.js`: one seeded case per mechanic (6+) asserting the mechanic's observable
  effect (VIP buff drops on kill, countdown wipes on expiry AND is survivable when destroyed,
  reinforcements spawn and cap, objective death = loss, split deployment positions, escalation stacks).
- Extend `tests/test-achievements.js`: combat-driven stats recorded correctly after a seeded win
  (incl. deathless and fastestWin minimum-keeping).
- Bond unification: existing tests must stay green; add one case asserting combat bonds equal
  `detectActiveBonds` output for a bonded team.

## Verification

`node tests/run.js` fully green twice; goldens byte-identical. Report: per-mechanic implementation
notes + TUNABLE values, stat wiring points, bond unification diff summary.

Commit as "Prompt 62: encounter mechanics, combat-driven stats, bond unification". Push. Do not merge.

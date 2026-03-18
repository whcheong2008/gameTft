# Prompt 27 — Archetype Synergy Rework Implementation

> **Purpose**: Replace all 9 archetype synergy definitions with the reworked versions from `SYNERGY-REWORK.md`. Update the combat engine to apply archetype-scoped bonuses correctly.
>
> **PREREQUISITE**: Prompt 26 must be completed first (units.js has been split into multiple files). If `js/units-core.js` exists, work with that. If it doesn't exist and `js/units.js` still exists, work with `units.js` instead.
>
> **Pattern**: All `var`, global scope, NO ES modules, NO import/export. Match existing code style.
>
> **Read before starting**: `SYNERGY-REWORK.md` (the full rework proposal), and whichever file contains the `ARCHETYPES` object (either `js/units-core.js` or `js/units.js`).

---

## Part A: Replace ARCHETYPES Data

Replace the entire `ARCHETYPES` object with the new definitions from `SYNERGY-REWORK.md`. Every archetype now has 4 thresholds (2/4/6/8). Every bonus object includes `scope: 'archetype'`.

Copy the JavaScript objects directly from SYNERGY-REWORK.md — they are provided in ready-to-use format.

---

## Part B: Update Synergy Counting

Find wherever archetype synergy counts are calculated (likely in `main-v2.js`, `ui-v2.js`, or a synergy calculation function). Update the counting logic to account for:

1. **Primary archetype**: Each unit counts as 1 toward its primary archetype (or 2 if the unit has `ascensionTier === 'transcendent'`)
2. **Secondary archetype**: If the unit has `ascensionTier` of `'awakened'`, `'exalted'`, or `'transcendent'`, it also counts as 1 toward its `secondaryArchetype`
3. If `secondaryArchetype` is undefined or unit isn't ascended, only count primary

The counting function should return an object like: `{ guardian: 3, sage: 2, duelist: 1 }` etc.

---

## Part C: Update Combat Engine — Archetype-Scoped Application

Currently, synergy bonuses may be applied to all units or all allies. Change this so bonuses are only applied to units that HAVE the relevant archetype (primary or secondary).

In the combat initialization or synergy application code:
1. For each active archetype synergy (count >= threshold), determine the bonus tier
2. Loop through player units
3. For each unit, check if it has this archetype as primary OR secondary
4. Only apply the bonus to units that qualify

### New Combat Effects to Implement

These are new properties from the reworked synergies that didn't exist before. Implement each:

**Guardian:**
- `startShieldPct`: At combat start, grant qualifying units a shield equal to this % of max HP
- `shieldBreakTenacity`: When a Guardian's shield is fully broken, grant tenacity for `shieldBreakTenacityDuration` seconds
- `lastStandThreshold`/`lastStandInvulnDuration`/`lastStandTaunt`: First time a Guardian drops below threshold HP, become invulnerable for duration and taunt nearby enemies. Once per unit per combat.

**Warden:**
- `ccAppliesAtkSpdSlow`/`ccAtkSpdSlowDuration`: When a Warden applies CC, also apply ATK speed slow to the target
- `ccSpreadRoot`/`ccSpreadRadius`/`ccSpreadDuration`: When a Warden CCs an enemy, root all enemies within radius for duration
- `wardenCcImmune`: Complete CC immunity (upgrade from `wardenFirstCcImmune`)

**Vanguard:**
- `frontRowMultiplier`: If unit is in front row (rows 4-5 in combat grid, i.e., the 2 rows closest to enemy), multiply HP/ATK bonuses by this value
- `chargeDmgBonus`/`chargeDuration`: For the first N seconds of combat, Vanguard units deal bonus damage
- `chargeStunDuration`: During charge window, attacks stun for this duration
- `slowImmune`: Vanguard units are immune to Slow effects

**Duelist:**
- `guaranteedCritEveryN`: Every Nth auto-attack is a guaranteed critical strike
- `rampingAtkPctPerSec`/`rampingAtkCap`: Each second of combat, Duelist ATK increases by this %. Capped at `rampingAtkCap` (0.40 = 40%).

**Predator:**
- `onKillAtkBuff`/`onKillAtkBuffDuration`: On kill, gain ATK buff for duration (stacks)
- `onKillManaRefundPct`: On kill, refund this % of max mana

**Ranger:**
- `focusedShotEveryN`/`focusedShotIgnoreDR`: Every Nth attack is a Focused Shot (guaranteed crit, ignores this % of target DR)
- `pierceAll`: Attacks pierce through ALL enemies in a line (upgrade from `pierceCount`)
- `markTargetDmgAmp`: Ranger's current target takes this % more damage from ALL sources

**Sorcerer:**
- `spellPenetration`: Sorcerer ability damage ignores this % of target's DR
- `postCastAtkSpdBuff`/`postCastAtkSpdDuration`: After casting ability, gain ATK speed buff
- `firstCastDoubleDamage`: First ability cast per combat deals 2x damage

**Mystic:**
- `elemStatusDurationBonus`: Increase duration of element-based status effects (Burn, Freeze, Slow, Root) by this %
- `elemResistShred`/`elemResistShredDuration`: When Mystic applies element effect, reduce target's element resist
- `abilityDmgPerElement`: Mystic gains this % ability damage per unique element on the team
- `randomElementProcChance`/`randomElementProcDuration`: Chance for Mystic abilities to apply a random additional element effect

**Sage:**
- `healShieldPct`/`healShieldDuration`: When a Sage heals, the target also gains a shield equal to this % of the heal amount
- `passiveManaPerSec`: Sage units gain this much mana per second passively
- `overhealToShieldPct`: Overhealing converts to permanent shield at this efficiency
- `deathSaveOnce`/`deathSaveHealPct`: Once per combat, when any ally would take lethal damage, negate it and heal to this % HP. Only the strongest Sage (highest ATK) triggers this.

---

## Part D: Update Synergy Sidebar UI

Update the synergy sidebar in team builder and combat to reflect the new 2/4/6/8 thresholds. Each archetype should now show 4 tiers instead of 2-3.

The sidebar should indicate the current tier reached and display the bonus description for each threshold.

---

## Implementation Notes

- Many of the new effects are combat-event-driven (on kill, on CC, on shield break, etc.). Implement them as checks within the existing combat loop rather than a separate event system.
- The `scope: 'archetype'` property is informational — use it as a reminder during implementation, but the actual scoping is done in the application code.
- Test edge cases: a unit with both primary and secondary archetype shouldn't get double bonuses from the same synergy.
- The `frontRowMultiplier` for Vanguard checks row position at combat start (rows 4-5 are front, 6-7 are back in the 8-row grid).
- Commit when done and the game loads without console errors.

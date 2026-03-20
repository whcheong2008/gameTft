# Process: How to Rework a Unit's Ability

> Step-by-step process for changing any unit's active ability. Covers the design session workflow — from deciding what to change, to implementing it, to verifying it works.

---

## When to Use This Process

- Reworking a unit that feels wrong for its role (e.g., a healer that doesn't heal)
- Changing a unit's template classification after a design review
- Tuning ability multipliers, CC durations, or secondary effects
- Adding a new unit to the roster

---

## Architecture Overview (Read First)

The ability system has three independent layers:

| Layer | What It Controls | File | How to Change |
|-------|-----------------|------|---------------|
| **Element passive** | Auto-attack effects (burn, slow, shield, dodge, crit, DR ignore) | `main-v2.js` synergy system | Don't touch — comes from element synergy (2) threshold |
| **Template tag** | Playstyle classification (for synergy bridges, UI tags, balance analysis) | `units-templates.js` → `abilityTemplate` field | Change the string value |
| **Active ability** | What happens when the unit casts (unique per unit) | `ability-templates.js` → `UNIT_ABILITIES[unitKey]` | Rewrite the function |

The element passive fires automatically from auto-attacks when the team hits the element synergy (2) threshold. It has nothing to do with the ability. A Fire unit always burns on auto — whether their ability is an execute, a heal, or a shield.

The template tag is just a label. Changing it doesn't change what the ability does. It affects which "playstyle family" the unit belongs to for bridge synergy analysis and UI display.

The active ability is the unique function that fires when the unit's mana bar fills. This is what you're reworking.

---

## Step 1: Decide What to Change

Look at the unit's current state:

```
Unit: [name]
Role: [type] (warrior/tank/archer/mage/assassin/healer)
Element: [element]
Template: [abilityTemplate]
Current ability: [what it does]
Problem: [why it needs to change]
```

Common reasons to rework:
- **Role mismatch**: Healer ability doesn't heal, tank ability doesn't protect
- **Template mismatch**: Ability doesn't fit the template's playstyle pattern
- **Balance outlier**: Ability is too strong/weak relative to tier peers
- **Redundancy**: Two units on the same team feel identical

---

## Step 2: Design the New Ability

The ability should fit three constraints:
1. **Role**: A healer's ability should heal (or shield + heal). A tank's should protect.
2. **Template pattern**: A Chain Killer should dash/chain. An Execute Striker should finish low-HP targets. But the specifics are unique.
3. **Tier power**: T1 = simple, 150-200% ATK. T4 = complex, 250-320% ATK. T5 = passive only.

Write a one-line description: "[Unit] does [X] to [target], dealing [Y]% ATK, applying [Z], and [secondary effect]."

---

## Step 3: Implement (3 Files to Edit)

### File 1: `js/ability-templates.js` — The Ability Function

Find the unit's entry in `UNIT_ABILITIES`:
```javascript
UNIT_ABILITIES = {
    ...
    unit_key: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        // OLD ABILITY CODE
    },
    ...
};
```

Replace the function body with the new ability. Available helpers:
- `dealDamage(caster, target, amount, {isAbility: true, forceCrit: bool, canCrit: bool})`
- `dealHealing(caster, target, amount)`
- `grantShield(caster, target, amount)`
- `addStatus(unit, type, duration, value, caster)` — types: burn, slow, stun, root, freeze, silence, taunt, atkBuff, atkMod, drMod, dodgeBuff, critBuff, vulnerability, regen, reflect
- `getUnitsInRadius(gridRow, gridCol, radius, unitArray)`
- `getLowestHpUnit(unitArray)` / `getLowestHpUnits(unitArray, count)`
- `findEmptyCellNear(gridRow, gridCol, grid)` — returns `{row, col}`
- `moveUnitToCell(unit, row, col, grid)`
- `getScale(tierCost, isEvolved)` — returns `{abilityMult, dotDps, ccDur, shieldPct}`

**Also update the evolved form** (separate entry in UNIT_ABILITIES). Evolved should be ~30-40% stronger.

### File 2: `js/units-abilities.js` — The Description Text

Find and update the ABILITY_DATA entry:
```javascript
ABILITY_DATA = {
    ...
    unit_key: { name: 'Ability Name', desc: 'What it does with actual numbers.' },
    evolved_key: { name: 'Enhanced Ability Name', desc: 'Evolved version description.' },
    ...
};
```

The description should match what the code actually does. Include multipliers, durations, and percentages.

### File 3: `js/units-templates.js` — The Template Tag (Optional)

If the rework changes the unit's playstyle category, update the `abilityTemplate` field:
```javascript
UNIT_TEMPLATES = {
    ...
    unit_key: { ..., abilityTemplate: 'new_template_name', ... },
    ...
};
```
Also update the evolved form in `EVOLVED_TEMPLATES`.

---

## Step 4: Verify

Run the combat test:
```bash
cd "Game TFT" && node test-combat.js
```

Check for:
- 0 errors for the reworked unit
- The unit deals damage / heals / shields (depending on role)
- The unit casts its ability (if maxMana > 0)

For a quick single-unit test:
```bash
node -e "
// ... load game files ...
// Create unit, run combat, check combatStats
"
```

---

## Step 5: Update Handoff Doc (If Handing to Unity)

If this change needs to go to the Unity session, update `TEMPLATE-V2-HANDOFF.md`:
- Update the unit's entry in the mapping table
- Note the change in the "Known Design Issues" section if applicable

---

## Example: Reworking Gale Dancer

**Before**: drain_fighter template. Ability heals 1 ally + drains enemy ATK. Self-sustain only, no team healing.

**Problem**: She's a healer but her ability doesn't serve the team.

**Step 1**:
```
Unit: Gale Dancer
Role: Healer (Wind)
Template: drain_fighter
Current: Heal 1 ally + drain enemy ATK
Problem: Self-sustain template on a healer — no team value
```

**Step 2**: New design: "Heal 2 lowest-HP allies for 140% ATK each. Deal 60% ATK to 2 nearest enemies. Apply 12% ATK speed buff to healed allies for 3s."

**Step 3**: Edit 3 files:
1. `ability-templates.js` — rewrite gale_dancer + stormweaver functions
2. `units-abilities.js` — update description text
3. `units-templates.js` — change abilityTemplate from 'drain_fighter' to 'heal_and_harm'

**Step 4**: Run `node test-combat.js`, verify 0 errors, verify healing > 0.

---

## Reference: Healer Rules

Healers are special. Their auto-attacks heal the lowest-HP ally (not damage enemies). Their ATK stat feeds healing. The ability should ALSO heal or shield allies, plus optionally deal secondary damage. See `HEALER-FIX-HANDOFF.md` for full details.

Healers generate mana from:
- Auto-healing allies (+10 per heal)
- Taking damage (`floor((damage / maxHp) × 50)`)

They do NOT generate mana from dealing damage (because they don't auto-attack enemies).

---

## Reference: Template List

| Template | Playstyle | Bridge Elements |
|----------|-----------|-----------------|
| dot_spreader | Spread ticking damage | Fire★ |
| dot_detonator | Stack marks → burst | Fire ↔ Lightning |
| revenge_tank | Reflect + taunt + explode | Fire ↔ Earth |
| heal_and_harm | Heal allies + damage enemies | Fire ↔ Water |
| execute_striker | Finish low-HP targets | Fire ↔ Force |
| crowd_puller | AoE pull + slow | Water★ |
| shield_stacker | Shield self + allies | Water ↔ Earth |
| cc_chainer | Cascade different CC types | Water ↔ Lightning |
| drain_fighter | Damage + self-heal + steal | Water ↔ Wind |
| terrain_shaper | Create zones + hazards | Earth★ |
| lockdown_specialist | Root/stun + damage amp | Earth ↔ Lightning |
| unkillable_wall | Self-shield + DR + invuln | Earth ↔ Force |
| dodge_tank | Dodge buff + counter | Wind★ |
| multi_striker | Rapid multi-hit flurry | Wind★ |
| chain_killer | Kill → chain to next | Wind ↔ Lightning |
| blink_striker | Teleport + damage + escape | Wind ↔ Force |
| frontload_nuker | Massive first cast | Lightning★ |
| ramping_attacker | Stacking ATK over time | Force★ |
| bodyguard | Leap to ally + protect | Force★ |

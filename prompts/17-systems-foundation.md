# Prompt 17: Systems Foundation — Elements, Archetypes, Team Size, UI

## Goal

Expand the unit/element/archetype systems to support Phase 2 depth. Add 2 new elements (lightning, force) with 6-element economy, rewrite element synergies to support 2/4/7/10 thresholds, restructure 6 archetypes into 9 (delete striker), implement level-based team size progression with barracks, enforce one-family-one-slot rule, and update UI to show all 6 elements and 9 archetypes with prismatic detection.

## ⚠️ Implementation Order — READ FIRST

### Phase A: Data Definitions (units.js)
1. Add `lightning` and `force` to ELEMENTS constant
2. Add ELEMENT_MATCHUPS lookup table for 6-element damage multipliers
3. Rewrite ELEMENT_SYNERGIES from 4 elements × [2,4] to 6 elements × [2,4,7,10]
4. Replace ARCHETYPES: delete striker, add warden/duelist/ranger/sorcerer (9 total)
5. Update UNIT_TEMPLATES archetype assignments for all 20 units

### Phase B: Combat Engine Updates (main-v2.js)
6. Update dealDamage() to use ELEMENT_MATCHUPS lookup instead of if/else
7. Update element counting logic to count evolved T5 units as 2
8. Rewrite applyElementBonuses() for 6 elements and 4-tier thresholds
9. Rewrite applySynergyBonuses() to apply 9-archetype bonuses with new mechanics
10. Integrate archetype-specific combat features (double-strike, execute damage, pierce, etc.)

### Phase C: Team Management (save.js, teams.js)
11. Rewrite getMaxTeamSize() with level-based progression + barracks
12. Implement one-family-one-slot enforcement in team placement logic
13. Gate barracks visibility/upgrades to level 10+
14. Add save version bump and migration for old archetypes

### Phase D: UI Rendering (ui-v2.js, game-v2.html)
15. Update synergy sidebar: 6 elements + 9 archetypes, 2/4/7/10 display
16. Add Lightning (#ffcc00) and Force (#cc8844) CSS colors and styles
17. Add prismatic highlight (gold/rainbow gradient animation)
18. Test: verify all synergies display correctly and thresholds animate

## Context

**Existing System**: Phase 1 complete. Combat engine (grid, movement, damage, mana, 36 abilities, status effects) fully implemented. 20 base units with current archetype assignments (striker, guardian, predator, mystic, vanguard, sage).

**Script Load Order**: `units.js → save.js → gacha.js → teams.js → hub.js → items.js → missions.js → ui-v2.js → main-v2.js`

**Code Pattern**: All `var`, global scope, NO ES modules, NO `let`/`const`/arrow functions.

**Save Format**: Existing unit templates and synergy data must maintain backward compatibility where possible (migration on load).

---

## Phase A: Data Definitions (units.js)

### A1: Add Lightning and Force to ELEMENTS

Expand ELEMENTS from 4 to 6:

```javascript
var ELEMENTS = {
    fire:      { name: 'Fire',      emoji: '\u{1F525}', color: '#ff4444', strong: 'wind',  weak: 'water' },
    water:     { name: 'Water',     emoji: '\u{1F4A7}', color: '#4488ff', strong: 'fire',  weak: 'earth' },
    earth:     { name: 'Earth',     emoji: '\u{1F33F}', color: '#44aa44', strong: 'water', weak: 'wind'  },
    wind:      { name: 'Wind',      emoji: '\u{1F4A8}', color: '#aa44ff', strong: 'earth', weak: 'fire'  },
    lightning: { name: 'Lightning', emoji: '\u{26A1}', color: '#ffcc00', strong: 'water', weak: 'earth' },
    force:     { name: 'Force',     emoji: '\u{1F4AA}', color: '#cc8844', strong: null,    weak: null   }
};
```

**Notes on Force**:
- `strong` and `weak` are both `null` (neutral 1.0× damage multiplier vs all elements)
- Force is a "blank slate" element for meta units that don't fit the elemental triangle
- Symbol 💪 (U+1F4AA) for strength/power theme

---

### A2: Add ELEMENT_MATCHUPS Lookup Table

After ELEMENTS, add a lookup table for 6-element damage type counters:

```javascript
var ELEMENT_MATCHUPS = {
    fire:      { strong: ['wind'],           weak: ['water'] },
    water:     { strong: ['fire'],           weak: ['earth', 'lightning'] },
    earth:     { strong: ['water', 'lightning'], weak: ['wind'] },
    wind:      { strong: ['earth'],          weak: ['fire'] },
    lightning: { strong: ['water'],          weak: ['earth'] },
    force:     { strong: [],                 weak: [] }
};
```

**Usage**: `dealDamage()` will look up `ELEMENT_MATCHUPS[attackerElement].strong.includes(defenderElement)` to determine 1.3× or 0.7× multipliers.

---

### A3: Rewrite ELEMENT_SYNERGIES with 6 Elements and 2/4/7/10 Thresholds

Replace the entire `ELEMENT_SYNERGIES` object. Each element gets 4 tiers (indices 0, 1, 2, 3 for thresholds 2, 4, 7, 10):

```javascript
var ELEMENT_SYNERGIES = {
    fire: {
        name: 'Fire', emoji: '\u{1F525}', color: '#ff4444',
        thresholds: [2, 4, 7, 10],
        bonuses: [
            {
                desc: 'Attacks apply Burn (10 DPS, 3s duration)',
                burnDps: 10, burnDuration: 3
            },
            {
                desc: 'Burn 20 DPS. On kill, enemy explodes for 15% max HP to adjacent',
                burnDps: 20, killExplosionPct: 0.15
            },
            {
                desc: 'Burn 35 DPS, 5s duration. Fire abilities apply Burn. Fire units +20% ATK. Kill explosions chain',
                burnDps: 35, burnDuration: 5, abilityBurn: true, fireAtkBonus: 0.20, chainExplosions: true
            },
            {
                desc: 'Conflagration: Enemies start Burning (3% max HP/s). Fire abilities 50% mana cost. Deaths explode 200 AoE. Fire units immune to Burn',
                isPrismatic: true, combatStartBurn: 0.03, abilityCostReduce: 0.50, deathExplosionDamage: 200,
                fireImmuneBurn: true
            }
        ]
    },
    water: {
        name: 'Water', emoji: '\u{1F4A7}', color: '#4488ff',
        thresholds: [2, 4, 7, 10],
        bonuses: [
            {
                desc: 'Enemy attack speed -15%',
                enemyAtkSpdReduction: 0.15
            },
            {
                desc: 'Enemy attack speed -25%. Allies heal 1.5% max HP/s',
                enemyAtkSpdReduction: 0.25, allyRegenPct: 0.015
            },
            {
                desc: 'Enemy attack speed -40%. Heal 3% max HP/s. Enemies below 40% HP deal 20% less damage',
                enemyAtkSpdReduction: 0.40, allyRegenPct: 0.03, weakEnemyDmgReduce: 0.20, weakEnemyThreshold: 0.40
            },
            {
                desc: 'Absolute Zero: Enemies permanently slowed 35%. Water abilities heal 20% of damage dealt. Enemies below 25% HP Frozen 2s (once)',
                isPrismatic: true, permanentSlow: 0.35, abilityHealConvert: 0.20, frozenThreshold: 0.25, frozenDuration: 2
            }
        ]
    },
    earth: {
        name: 'Earth', emoji: '\u{1F33F}', color: '#44aa44',
        thresholds: [2, 4, 7, 10],
        bonuses: [
            {
                desc: 'Allies start with shield: 15% max HP',
                shieldPct: 0.15
            },
            {
                desc: 'Shield 25% max HP. +8% DR',
                shieldPct: 0.25, damageReduction: 0.08
            },
            {
                desc: 'Shield 40% max HP. +15% DR. Shields regen 3%/sec when not taking damage',
                shieldPct: 0.40, damageReduction: 0.15, shieldRegenPct: 0.03, shieldRegenOnlyWhenUnhit: true
            },
            {
                desc: 'Tectonic Fortress: Shield 60% max HP. +25% DR. Shields regen 5%/sec always. Every 8s random enemy Rooted 3s. Earth units can\'t be crit',
                isPrismatic: true, shieldPct: 0.60, damageReduction: 0.25, shieldRegenPct: 0.05, rootCooldown: 8,
                rootDuration: 3, earthNoCrit: true
            }
        ]
    },
    wind: {
        name: 'Wind', emoji: '\u{1F4A8}', color: '#aa44ff',
        thresholds: [2, 4, 7, 10],
        bonuses: [
            {
                desc: 'Allies +15% attack speed',
                allyAtkSpdBoost: 0.15
            },
            {
                desc: '+25% attack speed. +12% dodge',
                allyAtkSpdBoost: 0.25, dodgeChance: 0.12
            },
            {
                desc: '+40% attack speed. +25% dodge. Dodged attacks grant 10 mana and deal 40% ATK back',
                allyAtkSpdBoost: 0.40, dodgeChance: 0.25, dodgeCounterMana: 10, dodgeCounterDmgPct: 0.40
            },
            {
                desc: 'Eye of the Storm: +60% attack speed. +40% dodge. Abilities 40% chance to cast twice. Dodged attacks grant 15 mana and 80% ATK back',
                isPrismatic: true, allyAtkSpdBoost: 0.60, dodgeChance: 0.40, abilityDoubleChance: 0.40,
                dodgeCounterMana: 15, dodgeCounterDmgPct: 0.80
            }
        ]
    },
    lightning: {
        name: 'Lightning', emoji: '\u{26A1}', color: '#ffcc00',
        thresholds: [2, 4, 7, 10],
        bonuses: [
            {
                desc: '+10% crit chance. Crits chain 50 damage to 1 adjacent',
                critChance: 0.10, chainCount: 1, chainDamage: 50
            },
            {
                desc: '+18% crit chance. +15% crit damage. Chains hit 2 adjacent',
                critChance: 0.18, critDamageBonus: 0.15, chainCount: 2
            },
            {
                desc: '+30% crit chance. +30% crit damage. Chains hit 3. Abilities can crit (15%)',
                critChance: 0.30, critDamageBonus: 0.30, chainCount: 3, abilityCritChance: 0.15
            },
            {
                desc: 'Superconductor: +50% crit chance. +60% crit damage. All abilities chain to 2 extra targets at 50%. On crit, 120 bonus lightning to all within 2 cells',
                isPrismatic: true, critChance: 0.50, critDamageBonus: 0.60, abilityChainCount: 2,
                abilityChainChance: 0.50, critAoeBonus: 120, critAoeRange: 2
            }
        ]
    },
    force: {
        name: 'Force', emoji: '\u{1F4AA}', color: '#cc8844',
        thresholds: [2, 4, 7, 10],
        bonuses: [
            {
                desc: '+10% ATK, +10% HP',
                atkBonus: 0.10, hpBonus: 0.10
            },
            {
                desc: '+18% ATK, +18% HP. Ignore 10% DR',
                atkBonus: 0.18, hpBonus: 0.18, drIgnore: 0.10
            },
            {
                desc: '+30% ATK, +30% HP. Ignore 20% DR. Force units immune to first CC each combat',
                atkBonus: 0.30, hpBonus: 0.30, drIgnore: 0.20, forceFirstCcImmune: true
            },
            {
                desc: 'Unstoppable: +50% ATK, +50% HP. Ignore 40% DR. CC immunity first 6s. Every 5th combined Force hit stuns 1s. Force units revive once at 30% HP',
                isPrismatic: true, atkBonus: 0.50, hpBonus: 0.50, drIgnore: 0.40, ccImmune6s: true,
                stunCounter: 5, stunDuration: 1, reviveOnce: 0.30
            }
        ]
    }
};
```

**Structure Details**:
- Each threshold is represented by a bonus object at the same index: bonuses[0] = 2-count, bonuses[1] = 4-count, etc.
- Special fields like `isPrismatic` flag the 10-threshold power spike
- Complex effects like `chainExplosions`, `abilityHealConvert`, `shieldRegenOnlyWhenUnhit` are data flags that combat functions will check

---

### A4: Replace ARCHETYPES — Delete Striker, Add 9 New Archetypes

Remove striker entirely. Replace ARCHETYPES with:

```javascript
var ARCHETYPES = {
    guardian: {
        name: 'Guardian', emoji: '\u{1F6E1}\uFE0F',
        thresholds: [2, 4, 6],
        bonuses: [
            { desc: '+200 HP', hpBonus: 200 },
            { desc: '+500 HP +5% DR', hpBonus: 500, damageReduction: 0.05 },
            { desc: '+800 HP +12% DR', hpBonus: 800, damageReduction: 0.12 }
        ]
    },
    warden: {
        name: 'Warden', emoji: '\u{26D4}\uFE0F',
        thresholds: [2, 4],
        bonuses: [
            { desc: '+15% CC duration. Allies +10% tenacity', ccDurationBonus: 0.15, tenacity: 0.10 },
            { desc: '+30% CC duration. +25% tenacity. Wardens immune to first CC', ccDurationBonus: 0.30, tenacity: 0.25, wardenFirstCcImmune: true }
        ]
    },
    vanguard: {
        name: 'Vanguard', emoji: '\u{1F3F0}',
        thresholds: [2, 4],
        bonuses: [
            { desc: 'Front-row units +200 HP +15 ATK', frontHpBonus: 200, frontAtkBonus: 15 },
            { desc: '+500 HP +30 ATK +10% lifesteal', frontHpBonus: 500, frontAtkBonus: 30, lifestealPct: 0.10 }
        ]
    },
    duelist: {
        name: 'Duelist', emoji: '\u{2694}\uFE0F',
        thresholds: [2, 4, 6],
        bonuses: [
            { desc: '15% double-strike chance', doubleStrikeChance: 0.15 },
            { desc: '30% double-strike +10% lifesteal', doubleStrikeChance: 0.30, lifestealPct: 0.10 },
            { desc: '40% double-strike +15% lifesteal. Attacks can\'t miss', doubleStrikeChance: 0.40, lifestealPct: 0.15, cantMissAttacks: true }
        ]
    },
    predator: {
        name: 'Predator', emoji: '\u{1F43E}',
        thresholds: [2, 4],
        bonuses: [
            { desc: '+25% ATK speed +15% dmg to <50% HP enemies', atkSpdBoost: 0.25, executeDamageBonus: 0.15, executeThreshold: 0.50 },
            { desc: '+40% ATK speed +25% dmg <50% HP. Reset dash on kill', atkSpdBoost: 0.40, executeDamageBonus: 0.25, dashResetOnKill: true }
        ]
    },
    ranger: {
        name: 'Ranger', emoji: '\u{1F3F9}',
        thresholds: [2, 4, 6],
        bonuses: [
            { desc: '+1 range +10% dmg to furthest enemy', rangeBonus: 1, furthestDmgBonus: 0.10 },
            { desc: '+1 range +20% furthest +15% ATK speed', rangeBonus: 1, furthestDmgBonus: 0.20, atkSpdBoost: 0.15 },
            { desc: '+2 range +30% furthest. Attacks pierce (hit 1 extra)', rangeBonus: 2, furthestDmgBonus: 0.30, pierceCount: 1 }
        ]
    },
    sorcerer: {
        name: 'Sorcerer', emoji: '\u{1F9D9}',
        thresholds: [2, 4, 6],
        bonuses: [
            { desc: '+15% ability dmg +10 starting mana', abilityDmgBonus: 0.15, startingManaBonus: 10 },
            { desc: '+30% ability dmg +20 starting mana', abilityDmgBonus: 0.30, startingManaBonus: 20 },
            { desc: '+50% ability dmg +30 starting mana. Abilities refund 15% mana', abilityDmgBonus: 0.50, startingManaBonus: 30, abilityManaRefund: 0.15 }
        ]
    },
    mystic: {
        name: 'Mystic', emoji: '\u{1F52E}',
        thresholds: [2, 4],
        bonuses: [
            { desc: '+20% element dmg +15% element resist', elemDmgBonus: 0.20, elemResist: 0.15 },
            { desc: '+40% element dmg +30% resist. Enemies take 10% more element dmg', elemDmgBonus: 0.40, elemResist: 0.30, enemyElemDmgDebuff: 0.10 }
        ]
    },
    sage: {
        name: 'Sage', emoji: '\u{1F4D6}',
        thresholds: [2, 4, 6],
        bonuses: [
            { desc: '+30% healing', healBonus: 0.30 },
            { desc: '+60% healing. Allies regen 1% max HP/s', healBonus: 0.60, teamRegenPct: 0.01 },
            { desc: '+100% healing. 2% regen. Overheal converts to shield 50%', healBonus: 1.00, teamRegenPct: 0.02, overhealToShieldPct: 0.50 }
        ]
    }
};
```

**Notes**:
- Striker is completely removed
- All archetypes follow data format: name, emoji, thresholds array, bonuses array (parallel indexing)
- Vanguard applies only to front-row units (row 4 or 5 on player side)
- Ranger's pierce allows attacks to hit 1 additional unit behind primary target
- Mystic's `enemyElemDmgDebuff` means debuffing enemies so they take more element damage

---

### A5: Update UNIT_TEMPLATES Archetype Assignments

In the UNIT_TEMPLATES object, update all 20 unit archetype assignments per UNITS-DESIGN.md section 4. Key changes:

**Fire**:
- Flame Warrior: striker → **duelist**
- Ember Scout: predator (stays)
- Cinder Archer: (new unit in phase 18, skip for now)
- Fire Acolyte: (new unit in phase 18, skip for now)

**Water**:
- Tide Hunter: vanguard (stays)
- Frost Archer: striker → **ranger**
- Reef Stalker: predator (stays)

**Earth**:
- Stone Guard: guardian (stays)
- Bramble Knight: vanguard (stays)
- Seedling Archer: (new unit in phase 18, skip for now)

**Wind**:
- Zephyr Scout: predator (stays)
- Wind Archer: striker → **ranger**
- Gale Dancer: sage (stays)
- Wind Squire: vanguard (stays)

**Lightning** (note: currently assigned to Fire/Water, reassign):
- Spark Fencer: (new unit in phase 18, skip for now)
- Volt Runner: (new unit in phase 18, skip for now)
- Thunder Archer: (new unit in phase 18, skip for now)
- Pulse Mender: (new unit in phase 18, skip for now)

**Force** (note: currently assigned to Fire/Water, reassign):
- Iron Soldier: vanguard (stays)
- Shadow Blade: predator (stays)
- Steel Archer: ranger (stays)

For the existing 20 units in your current codebase, update the `archetype` field to match the new 9-archetype system. Example for Flame Warrior (line ~131):

```javascript
flame_warrior: {
    name: 'Flame Warrior', cost: 1, type: 'warrior', archetype: 'duelist', element: 'fire',
    hp: 600, attack: 50, attackSpd: 0.8, range: 1, moveSpd: 2.0, maxMana: 60,
    emoji: '\u{2694}\uFE0F\u{1F525}', evolvedForm: 'fire_berserker'
},
```

**Full list of updates needed**:
1. flame_warrior: striker → duelist
2. frost_archer: striker → ranger
3. wind_archer: striker → ranger
4. Any other units with `archetype: 'striker'` → update per UNITS-DESIGN.md (verify none remain)

---

## Phase B: Combat Engine Updates (main-v2.js)

### B1: Update dealDamage() to Use ELEMENT_MATCHUPS

Find the existing `dealDamage(attacker, defender, baseDamage)` function. Update the element multiplier logic:

**Before** (if/else chains):
```javascript
var elemMultiplier = 1.0;
if (attacker.element === 'fire' && defender.element === 'wind') elemMultiplier = 1.3;
if (attacker.element === 'fire' && defender.element === 'water') elemMultiplier = 0.7;
// ... many more lines
```

**After** (lookup table):
```javascript
var elemMultiplier = 1.0;
if (ELEMENT_MATCHUPS[attacker.element].strong.includes(defender.element)) {
    elemMultiplier = 1.3;
} else if (ELEMENT_MATCHUPS[attacker.element].weak.includes(defender.element)) {
    elemMultiplier = 0.7;
}
```

This is a 2-line replacement of the previous 8+ line if/else chain. Works for all 6 elements including Force (which has empty strong/weak arrays, so multiplier stays 1.0).

---

### B2: Update Element Counting — Count Evolved T5 as 2

Find the function that counts elements for synergy (likely `updateActiveSynergies()` or `initCombat()`). When iterating through board units to count their elements:

```javascript
// OLD: just count unit.element += 1
function countElement(unit) {
    var isEvolvedT5 = unit.cost === 5 && unit.isEvolved;
    return isEvolvedT5 ? 2 : 1;
}
```

Update the element counting loop to use this logic:

```javascript
for (var i = 0; i < boardUnits.length; i++) {
    var unit = boardUnits[i];
    var elementCount = countElement(unit);  // returns 1 or 2
    var elem = unit.element;

    if (!elementCounts[elem]) elementCounts[elem] = 0;
    elementCounts[elem] += elementCount;
}
```

This allows a 9-unit board (8 units counting as 1 + 1 evolved T5 as 2 = 10) to reach the prismatic threshold.

---

### B3: Rewrite applyElementBonuses()

The current function handles 4 elements with [2, 4] thresholds. Rewrite to handle all 6 elements with [2, 4, 7, 10]:

```javascript
function applyElementBonuses(unit, combatState) {
    var elementCounts = combatState.elementCounts;
    var unitElem = unit.element;
    if (!ELEMENT_SYNERGIES[unitElem]) return;

    var synergy = ELEMENT_SYNERGIES[unitElem];
    var activeThreshold = 0;

    // Find the highest threshold met
    for (var i = synergy.thresholds.length - 1; i >= 0; i--) {
        if (elementCounts[unitElem] >= synergy.thresholds[i]) {
            activeThreshold = i;
            break;
        }
    }

    if (activeThreshold === -1) return;  // No threshold met

    var bonus = synergy.bonuses[activeThreshold];

    // Apply basic bonuses
    if (bonus.burnDps) unit.burnDps = (unit.burnDps || 0) + bonus.burnDps;
    if (bonus.burnDuration) unit.burnDuration = bonus.burnDuration;
    if (bonus.killExplosionPct) unit.killExplosionPct = bonus.killExplosionPct;
    if (bonus.enemyAtkSpdReduction) combatState.enemyAtkSpdReduction = bonus.enemyAtkSpdReduction;
    if (bonus.allyRegenPct) combatState.allyRegenPct = bonus.allyRegenPct;
    if (bonus.shieldPct) unit.shieldPct = bonus.shieldPct;
    if (bonus.damageReduction) unit.damageReduction = (unit.damageReduction || 0) + bonus.damageReduction;
    if (bonus.allyAtkSpdBoost) unit.atkSpd *= (1 + bonus.allyAtkSpdBoost);
    if (bonus.dodgeChance) unit.dodgeChance = (unit.dodgeChance || 0) + bonus.dodgeChance;
    if (bonus.critChance) unit.critChance = (unit.critChance || 0) + bonus.critChance;
    if (bonus.critDamageBonus) unit.critDamageBonus = (unit.critDamageBonus || 0) + bonus.critDamageBonus;
    if (bonus.chainCount) unit.chainCount = bonus.chainCount;
    if (bonus.chainDamage) unit.chainDamage = bonus.chainDamage;
    if (bonus.atkBonus) unit.attack *= (1 + bonus.atkBonus);
    if (bonus.hpBonus) unit.maxHp *= (1 + bonus.hpBonus);
    if (bonus.drIgnore) unit.drIgnore = (unit.drIgnore || 0) + bonus.drIgnore;

    // Tier 7+ effects (store flags for combat to check)
    if (activeThreshold >= 2) {
        if (bonus.abilityBurn) unit.abilityBurn = true;
        if (bonus.fireAtkBonus) unit.fireAtkBonus = bonus.fireAtkBonus;
        if (bonus.chainExplosions) combatState.chainExplosions = true;
        if (bonus.weakEnemyDmgReduce) combatState.weakEnemyDmgReduce = bonus.weakEnemyDmgReduce;
        if (bonus.weakEnemyThreshold) combatState.weakEnemyThreshold = bonus.weakEnemyThreshold;
        if (bonus.dodgeCounterMana) unit.dodgeCounterMana = bonus.dodgeCounterMana;
        if (bonus.dodgeCounterDmgPct) unit.dodgeCounterDmgPct = bonus.dodgeCounterDmgPct;
        if (bonus.shieldRegenOnlyWhenUnhit) combatState.shieldRegenOnlyWhenUnhit = true;
        if (bonus.shieldRegenPct) combatState.shieldRegenPct = bonus.shieldRegenPct;
        if (bonus.abilityCritChance) unit.abilityCritChance = bonus.abilityCritChance;
    }

    // Tier 10 (Prismatic) effects
    if (activeThreshold >= 3) {
        combatState.prismaticElement = unitElem;

        if (bonus.isPrismatic) {
            if (bonus.combatStartBurn) combatState.combatStartBurn = bonus.combatStartBurn;
            if (bonus.abilityCostReduce) unit.abilityCostReduce = bonus.abilityCostReduce;
            if (bonus.deathExplosionDamage) combatState.deathExplosionDamage = bonus.deathExplosionDamage;
            if (bonus.fireImmuneBurn) unit.fireImmuneBurn = true;
            if (bonus.permanentSlow) combatState.permanentSlow = bonus.permanentSlow;
            if (bonus.abilityHealConvert) unit.abilityHealConvert = bonus.abilityHealConvert;
            if (bonus.frozenThreshold) combatState.frozenThreshold = bonus.frozenThreshold;
            if (bonus.frozenDuration) combatState.frozenDuration = bonus.frozenDuration;
            if (bonus.rootCooldown) combatState.rootCooldown = bonus.rootCooldown;
            if (bonus.rootDuration) combatState.rootDuration = bonus.rootDuration;
            if (bonus.earthNoCrit) unit.earthNoCrit = true;
            if (bonus.abilityDoubleChance) unit.abilityDoubleChance = bonus.abilityDoubleChance;
            if (bonus.abilityChainCount) unit.abilityChainCount = bonus.abilityChainCount;
            if (bonus.abilityChainChance) unit.abilityChainChance = bonus.abilityChainChance;
            if (bonus.critAoeBonus) unit.critAoeBonus = bonus.critAoeBonus;
            if (bonus.critAoeRange) unit.critAoeRange = bonus.critAoeRange;
            if (bonus.ccImmune6s) unit.ccImmune6s = true;
            if (bonus.stunCounter) unit.stunCounter = bonus.stunCounter;
            if (bonus.stunDuration) unit.stunDuration = bonus.stunDuration;
            if (bonus.reviveOnce) unit.reviveOnce = bonus.reviveOnce;
        }
    }
}
```

**Notes**:
- This function is called for each unit after element counts are finalized
- Flags like `unit.abilityBurn`, `unit.fireAtkBonus` are checked during ability execution
- Complex effects (like periodic root casts, dodge counter-attacks, death explosions) store flags in combatState for main combat loop to check
- TODO: Advanced effects (DoT regen, periodic roots, dodge counters) need integration into main combat loop timing logic

---

### B4: Rewrite applySynergyBonuses() for 9 Archetypes

The current function only handles 6 archetypes. Rewrite to handle all 9 new archetypes:

```javascript
function applySynergyBonuses(unit, combatState) {
    var archetypeCounts = combatState.archetypeCounts;
    var archetype = unit.archetype;

    if (!ARCHETYPES[archetype]) return;

    var syncData = ARCHETYPES[archetype];
    var activeThreshold = 0;

    // Find highest threshold met
    for (var i = syncData.thresholds.length - 1; i >= 0; i--) {
        if (archetypeCounts[archetype] >= syncData.thresholds[i]) {
            activeThreshold = i;
            break;
        }
    }

    if (activeThreshold === -1) return;

    var bonus = syncData.bonuses[activeThreshold];

    // Guardian: HP + DR
    if (archetype === 'guardian') {
        if (bonus.hpBonus) unit.maxHp += bonus.hpBonus;
        if (bonus.damageReduction) unit.damageReduction = (unit.damageReduction || 0) + bonus.damageReduction;
    }

    // Warden: CC duration + tenacity + first CC immune
    if (archetype === 'warden') {
        if (bonus.ccDurationBonus) unit.ccDurationBonus = (unit.ccDurationBonus || 0) + bonus.ccDurationBonus;
        if (bonus.tenacity) combatState.allyTenacity = (combatState.allyTenacity || 0) + bonus.tenacity;
        if (bonus.wardenFirstCcImmune) unit.wardenFirstCcImmune = true;
    }

    // Vanguard: Front-row only (row >= 4)
    if (archetype === 'vanguard') {
        if (unit.combatGridRow >= 4) {  // Front row for player side
            if (bonus.frontHpBonus) unit.maxHp += bonus.frontHpBonus;
            if (bonus.frontAtkBonus) unit.attack += bonus.frontAtkBonus;
            if (bonus.lifestealPct) unit.lifesteal = (unit.lifesteal || 0) + bonus.lifestealPct;
        }
    }

    // Duelist: Double-strike + lifesteal + can't miss
    if (archetype === 'duelist') {
        if (bonus.doubleStrikeChance) unit.doubleStrikeChance = bonus.doubleStrikeChance;
        if (bonus.lifestealPct) unit.lifesteal = (unit.lifesteal || 0) + bonus.lifestealPct;
        if (bonus.cantMissAttacks) unit.cantMissAttacks = true;
    }

    // Predator: ATK speed + execute damage + dash reset on kill
    if (archetype === 'predator') {
        if (bonus.atkSpdBoost) unit.atkSpd *= (1 + bonus.atkSpdBoost);
        if (bonus.executeDamageBonus) unit.executeDamageBonus = bonus.executeDamageBonus;
        if (bonus.executeThreshold) unit.executeThreshold = bonus.executeThreshold;
        if (bonus.dashResetOnKill) unit.dashResetOnKill = true;
    }

    // Ranger: Range + furthest damage + pierce
    if (archetype === 'ranger') {
        if (bonus.rangeBonus) unit.range += bonus.rangeBonus;
        if (bonus.furthestDmgBonus) unit.furthestDmgBonus = bonus.furthestDmgBonus;
        if (bonus.atkSpdBoost) unit.atkSpd *= (1 + bonus.atkSpdBoost);
        if (bonus.pierceCount) unit.pierceCount = bonus.pierceCount;
    }

    // Sorcerer: Ability damage + starting mana + mana refund
    if (archetype === 'sorcerer') {
        if (bonus.abilityDmgBonus) unit.abilityDmgBonus = (unit.abilityDmgBonus || 0) + bonus.abilityDmgBonus;
        if (bonus.startingManaBonus) unit.startingMana = (unit.startingMana || 0) + bonus.startingManaBonus;
        if (bonus.abilityManaRefund) unit.abilityManaRefund = bonus.abilityManaRefund;
    }

    // Mystic: Element damage + element resist + enemy debuff
    if (archetype === 'mystic') {
        if (bonus.elemDmgBonus) unit.elemDmgBonus = (unit.elemDmgBonus || 0) + bonus.elemDmgBonus;
        if (bonus.elemResist) unit.elemResist = (unit.elemResist || 0) + bonus.elemResist;
        if (bonus.enemyElemDmgDebuff) combatState.enemyElemDmgDebuff = bonus.enemyElemDmgDebuff;
    }

    // Sage: Healing bonus + team regen + overheal→shield
    if (archetype === 'sage') {
        if (bonus.healBonus) unit.healBonus = (unit.healBonus || 0) + bonus.healBonus;
        if (bonus.teamRegenPct) combatState.sageTeamRegen = (combatState.sageTeamRegen || 0) + bonus.teamRegenPct;
        if (bonus.overhealToShieldPct) unit.overhealToShieldPct = bonus.overhealToShieldPct;
    }
}
```

**Notes**:
- Vanguard checks `unit.combatGridRow >= 4` to determine front-row status
- Flags like `unit.doubleStrikeChance`, `unit.cantMissAttacks`, `unit.pierceCount` are checked during attack resolution
- TODO: Advanced mechanics (dash reset on kill, mana refunds, overheal→shield conversion) require integration in main combat loop

---

### B5: Integrate Archetype Combat Mechanics (TODO Comments)

The above rewrite stores flags on units. The main combat loop (`performAttack()`, `dealDamage()`, `processHeal()`, etc.) must check these flags:

**In performAttack()** (when attacking):
- Check `unit.doubleStrikeChance`: if rand < chance, attack twice
- Check `unit.dodgeChance`: if dodge triggers and `unit.dodgeCounterMana > 0`, grant mana to unit
- TODO: Integrate double-strike and dodge counter-attack logic

**In dealDamage()**:
- Check `unit.executeDamageBonus` and `unit.executeThreshold`: if target HP% < threshold, increase damage
- Check `unit.pierceCount`: after hitting primary target, continue projectile to pierce adjacent units
- Check `unit.critAoeBonus` and `unit.critAoeRange`: on crit, add AoE bonus damage in radius
- TODO: Integrate execute, pierce, and crit AoE logic

**In processHeal()**:
- Check `unit.overhealToShieldPct`: if heal exceeds target max HP, convert excess to shield
- Check `unit.abilityManaRefund`: if unit used ability to heal, refund mana
- TODO: Integrate overheal conversion and mana refund logic

For now, add TODO comments indicating where these checks belong. Advanced integration can follow in Phase B.5 (combat refinement). The data structure is now in place.

---

## Phase C: Team Management (save.js, teams.js)

### C1: Rewrite getMaxTeamSize()

Find and replace the current `getMaxTeamSize(saveData)` function in save.js:

```javascript
function getMaxTeamSize(saveData) {
    var level = saveData.player.level;

    // Base slots: 2 + 1 per 2 levels until level 10 (cap 7)
    var baseSlots = Math.min(7, 2 + Math.floor(level / 2));

    // Barracks bonus: only available at level 10+
    var barracksBonus = 0;
    if (level >= 10) {
        var barracksLevel = saveData.buildings && saveData.buildings.barracks ? saveData.buildings.barracks : 0;
        barracksBonus = Math.min(2, Math.floor(barracksLevel / 2));
    }

    return Math.min(9, baseSlots + barracksBonus);
}
```

**Progression**:
- Level 1-2: 2 slots (baseSlots = 2 + floor(1/2) = 2)
- Level 3-4: 3 slots (baseSlots = 2 + floor(3/2) = 3)
- Level 5-6: 4 slots (baseSlots = 2 + floor(5/2) = 4)
- Level 7-8: 5 slots (baseSlots = 2 + floor(7/2) = 5)
- Level 9-10: 6-7 slots (baseSlots = 2 + floor(9/2) = 6, or 7 at level 10)
- Level 10+: 7 base + barracks (level 10 barracks = 1, level 12 = 2, max 9 total)

**Notes**:
- Barracks building must be initialized in save.js: `saveData.buildings.barracks = 0` (default)
- Barracks is only visible/upgradeable in hub.js UI if `player.level >= 10`
- This encourages progression while allowing endgame flexibility

---

### C2: One-Family-One-Slot Enforcement in teams.js

In the team builder placement logic (likely in `placeUnitOnTeam()` or similar), add a check:

```javascript
function placeUnitOnTeam(team, unitKey, slotIndex) {
    var unitTemplate = UNIT_TEMPLATES[unitKey];

    // Check for family conflict
    var familyConflict = null;
    for (var i = 0; i < team.length; i++) {
        if (team[i] && team[i] !== unitKey) {
            var otherUnit = UNIT_TEMPLATES[team[i]];

            // Is unitKey an evolved form of team[i]?
            if (otherUnit.evolvedForm === unitKey) {
                familyConflict = team[i];
                break;
            }

            // Is team[i] an evolved form of unitKey?
            if (unitTemplate.evolvedForm === team[i]) {
                familyConflict = team[i];
                break;
            }
        }
    }

    if (familyConflict) {
        // Remove the conflicting unit
        team = team.filter(function(u) { return u !== familyConflict; });
        showNotification('Removed ' + UNIT_TEMPLATES[familyConflict].name + ' — same family');
    }

    // Place the unit
    team[slotIndex] = unitKey;
    return team;
}
```

**Logic**:
- Check each unit on team for `evolvedForm` field matching the new unit
- Check new unit's `evolvedForm` field against each unit on team
- If conflict detected, remove the other unit and show notification
- Place the new unit in the slot

This ensures only one member of each evolution family can be on the team at once.

---

### C3: Gate Barracks to Level 10+

In hub.js (or wherever buildings are displayed), check `saveData.player.level >= 10` before showing Barracks:

```javascript
// In the buildings section of hub UI
if (saveData.player.level >= 10) {
    // Show barracks building, allow upgrades
    // displayBuilding('barracks', saveData.buildings.barracks, 'addMaxTeamSize');
} else {
    // Show locked message: "Unlock at level 10"
    // displayLockedBuilding('barracks', 'Unlock at level 10');
}
```

This visually gates the feature while the progression system handles the validation.

---

### C4: Save Migration

In save.js, add a save version bump and migration:

```javascript
function migrateSave(saveData) {
    // Bump version
    if (!saveData.version) saveData.version = 1;

    // v1 → v2: Migrate archetype 'striker' units
    if (saveData.version < 2) {
        // If any unit in inventory or team has archetype 'striker', update it
        var strikerUpdates = {
            'flame_warrior': 'duelist',
            'frost_archer': 'ranger',
            'wind_archer': 'ranger',
            // ... add any other striker units
        };

        // Update inventory units
        if (saveData.units) {
            for (var i = 0; i < saveData.units.length; i++) {
                var unit = saveData.units[i];
                if (strikerUpdates[unit.key]) {
                    unit.archetype = strikerUpdates[unit.key];
                }
            }
        }

        // Update team compositions
        if (saveData.teams) {
            for (var teamIdx = 0; teamIdx < saveData.teams.length; teamIdx++) {
                var team = saveData.teams[teamIdx];
                // Teams store unit keys, so no archetype update needed here
                // (archetype comes from UNIT_TEMPLATES at runtime)
            }
        }

        saveData.version = 2;
    }

    return saveData;
}
```

Call this in the save load function:
```javascript
function loadSave() {
    var saveData = JSON.parse(localStorage.getItem('autoTFTSave'));
    saveData = migrateSave(saveData);
    // ... rest of load
}
```

---

## Phase D: UI Rendering (ui-v2.js, game-v2.html)

### D1: Update Synergy Sidebar for 6 Elements + 9 Archetypes + 2/4/7/10 Display

In ui-v2.js, find the synergy display function (likely `renderSynergies()` or `updateSynergySidebar()`). Rewrite to:

```javascript
function renderSynergies(combatState) {
    var html = '<div class="synergies-container">';

    // Elements (6)
    html += '<div class="synergy-section"><h3>Elements</h3>';
    for (var elemKey in ELEMENT_SYNERGIES) {
        var synergy = ELEMENT_SYNERGIES[elemKey];
        var count = combatState.elementCounts[elemKey] || 0;
        var isPrismatic = count >= synergy.thresholds[3];  // 10-count

        var thresholdStr = '';
        for (var t = 0; t < synergy.thresholds.length; t++) {
            var met = count >= synergy.thresholds[t];
            thresholdStr += met ? '●' : '○';
        }

        var className = 'synergy-item';
        if (isPrismatic) className += ' prismatic';

        html += '<div class="' + className + '" style="color: ' + synergy.color + '">';
        html += synergy.emoji + ' ' + synergy.name + ' ' + count + '/10 [' + thresholdStr + ']';

        // Show active bonus description
        var activeIdx = -1;
        for (var i = synergy.thresholds.length - 1; i >= 0; i--) {
            if (count >= synergy.thresholds[i]) {
                activeIdx = i;
                break;
            }
        }
        if (activeIdx >= 0) {
            html += '<br><small>' + synergy.bonuses[activeIdx].desc + '</small>';
        }

        html += '</div>';
    }
    html += '</div>';

    // Archetypes (9)
    html += '<div class="synergy-section"><h3>Archetypes</h3>';
    for (var archKey in ARCHETYPES) {
        var arch = ARCHETYPES[archKey];
        var count = combatState.archetypeCounts[archKey] || 0;

        var thresholdStr = '';
        for (var t = 0; t < arch.thresholds.length; t++) {
            var met = count >= arch.thresholds[t];
            thresholdStr += met ? '●' : '○';
        }

        html += '<div class="synergy-item">';
        html += arch.emoji + ' ' + arch.name + ' ' + count + ' [' + thresholdStr + ']';

        // Show active bonus
        var activeIdx = -1;
        for (var i = arch.thresholds.length - 1; i >= 0; i--) {
            if (count >= arch.thresholds[i]) {
                activeIdx = i;
                break;
            }
        }
        if (activeIdx >= 0) {
            html += '<br><small>' + arch.bonuses[activeIdx].desc + '</small>';
        }

        html += '</div>';
    }
    html += '</div>';

    html += '</div>';
    document.getElementById('synergy-sidebar').innerHTML = html;
}
```

**Features**:
- Shows all 6 elements with count (e.g., "7/10") and threshold indicators (● for met, ○ for unmet)
- Shows all 9 archetypes with count and thresholds
- Displays active bonus description for each active threshold
- Highlights prismatic (10-count element) with CSS class for special styling

---

### D2: Add Lightning and Force Colors to CSS

In game-v2.html or a linked CSS file, add:

```css
/* Element colors */
.element-fire { color: #ff4444; }
.element-water { color: #4488ff; }
.element-earth { color: #44aa44; }
.element-wind { color: #aa44ff; }
.element-lightning { color: #ffcc00; }
.element-force { color: #cc8844; }

/* Prismatic highlight */
.synergy-item.prismatic {
    background: linear-gradient(90deg, #ffcc00, #ff6600, #ffcc00);
    background-size: 200% 100%;
    animation: prismatic-glow 2s ease-in-out infinite;
    font-weight: bold;
}

@keyframes prismatic-glow {
    0%, 100% { background-position: 0% 0%; }
    50% { background-position: 100% 0%; }
}
```

---

### D3: Update Synergy Display to Remove Striker References

In ui-v2.js, any place that lists archetype names or IDs (team builder, unit details, etc.) must remove references to 'striker' and ensure '9 archetypes' is shown instead of '6'.

Check for:
- Hard-coded lists like `['guardian', 'striker', 'predator', ...]`
- Descriptive text like "6 archetypes" → "9 archetypes"
- Tooltips or info panels about archetype system

---

### D4: TEST Checkpoint After Phase D

**Test plan**:
1. Load game with a team of 6 units (2 of same element, 2 of same archetype)
2. Verify synergy sidebar shows correct counts and highlights 2/4 thresholds
3. Add more units to reach 4-count on an element → verify 4-threshold activates
4. Try to reach 7-count → verify 7-threshold bonuses appear in description
5. Place an evolved T5 unit (should count as 2) → verify element count jumps by 2
6. Attempt one-family-one-slot: place a unit, then place its evolved form → verify old unit removed and notification shown
7. Check that Level 1 can only have 2 team slots, Level 10 has 7 + barracks
8. Verify all 6 element colors and 9 archetype emojis display correctly
9. Test prismatic animation when 10-count element is reached (visual only, functionality TODO)

---

## Implementation Notes

### Architecture Patterns
- **Data-driven**: ELEMENT_SYNERGIES and ARCHETYPES are structured data that combat functions iterate over, not hard-coded if/else chains
- **Parallel indexing**: bonus[0] = 2-threshold, bonus[1] = 4-threshold, etc. makes threshold logic clean and scalable
- **Flag-based combat**: Complex effects (dodge counters, execute damage, pierce) are stored as flags on units, checked during attack resolution

### Phased Effect Implementation
- **Tier 2/4 effects**: Simple stat bonuses, fully implemented in applySynergyBonuses()
- **Tier 7 effects**: More complex but mostly stat/flag based; some require combat loop checks (marked TODO)
- **Tier 10 (Prismatic)**: Game-warping effects; some are data-only (flags), others need main loop integration (marked TODO)

### Avoid Breaking Changes
- Existing 20 units keep their base stats and abilities
- Only archetype field changes (striker → duelist/ranger/sorcerer)
- Element field unchanged (still 4 current elements, 2 new added)
- Evolution pairs unchanged
- Save migration handles old archetype names

### TODO for Future Phases
1. **B5 Integration**: Combat loop checks for double-strike, dodge counters, execute damage, pierce, crit AoE, mana refunds, overheal→shield
2. **Complex Element Effects**: Periodic roots, shield regen, dodge-triggered counter-attacks, death explosions, frozen freeze mechanic
3. **Prismatic Combat Mechanics**: Combat start burns, permanent slows, revive logic, CC immunity first 6s, stun counter
4. **UI Polish**: Threshold progress bars, animation for reaching new thresholds, visual effects for prismatic procs

---

## File Checklist

### Modify:
- [ ] `/sessions/lucid-youthful-meitner/mnt/Game TFT/js/units.js` — ELEMENTS, ELEMENT_MATCHUPS, ELEMENT_SYNERGIES, ARCHETYPES, UNIT_TEMPLATES
- [ ] `/sessions/lucid-youthful-meitner/mnt/Game TFT/js/main-v2.js` — dealDamage(), element counting, applyElementBonuses(), applySynergyBonuses()
- [ ] `/sessions/lucid-youthful-meitner/mnt/Game TFT/js/save.js` — getMaxTeamSize(), save migration
- [ ] `/sessions/lucid-youthful-meitner/mnt/Game TFT/js/teams.js` — placeUnitOnTeam() one-family-one-slot
- [ ] `/sessions/lucid-youthful-meitner/mnt/Game TFT/js/hub.js` — gate barracks to level 10+
- [ ] `/sessions/lucid-youthful-meitner/mnt/Game TFT/js/ui-v2.js` — renderSynergies(), remove striker references
- [ ] `/sessions/lucid-youthful-meitner/mnt/Game TFT/game-v2.html` — add CSS for Lightning/Force colors, prismatic animation

### Test:
- [ ] Synergy display (6 elements, 9 archetypes, thresholds)
- [ ] Element matchups (1.3× advantage, 0.7× disadvantage, Force neutral)
- [ ] Evolved T5 counting as 2
- [ ] Prismatic 10-threshold detection and highlighting
- [ ] One-family-one-slot enforcement
- [ ] Team size progression (level 1→2, level 10→7, barracks +0-2)
- [ ] Barracks visibility gated to level 10+
- [ ] Save migration (old 'striker' units → new archetypes)

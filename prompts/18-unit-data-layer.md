# Prompt 18: Unit Data Layer — 60-Unit Roster Implementation

**Phase**: 2, Chunk 2
**Status**: Ready for implementation (depends on Prompt 17: Systems Foundation)
**Scope**: Replace existing 20-unit UNIT_TEMPLATES with all 60 base units; add all 60 evolved forms; populate ABILITY_DATA (120 entries); introduce PASSIVE_DATA (60 base + 60 evolved).

## Overview

This chunk transforms the unit system from a stub (20 units) to a complete, data-driven roster of 60 unique units across 6 elements, 6 types, and 9 archetypes. All units are fully defined in UNITS-DESIGN.md; this prompt bridges design → code via structured JavaScript data structures.

**Authoritative source**: `/Game TFT/UNITS-DESIGN.md` section 4 (Full Roster). Every stat, passive name, ability description, and evolved form name comes from there.

---

## Implementation Phases

### Phase A: Core Unit Data (UNIT_TEMPLATES, EVOLVED_TEMPLATES, EVOLUTIONS, ABILITY_DATA)

#### 1. Backup Existing Code
```bash
# In units.js, create comments marking original stubs
// ===== OLD STUB (20 units) =====
// var UNIT_TEMPLATES = { ... };
// var EVOLVED_TEMPLATES = { ... };
// var ABILITY_DATA = { ... };
// var EVOLUTIONS = { ... };
// ===== END OLD STUB =====

// ===== NEW COMPLETE ROSTER (60 units) =====
// [New code goes here]
// ===== END NEW ROSTER =====
```

#### 2. UNIT_TEMPLATES — All 60 Base Units

Replace the existing 20-unit UNIT_TEMPLATES with all 60 entries, organized by element. **Format**:

```javascript
var UNIT_TEMPLATES = {
    // --- FIRE (10 units) ---
    flame_warrior: {
        name: 'Flame Warrior', cost: 1, type: 'warrior', archetype: 'duelist', element: 'fire',
        hp: 600, attack: 50, attackSpd: 0.85, range: 1, moveSpd: 1.9, maxMana: 65,
        emoji: '⚔️🔥', evolvedForm: 'fire_berserker'
    },
    ember_scout: {
        name: 'Ember Scout', cost: 1, type: 'assassin', archetype: 'predator', element: 'fire',
        hp: 390, attack: 46, attackSpd: 0.5, range: 1, moveSpd: 3.9, maxMana: 45,
        emoji: '🗡️🔥', evolvedForm: 'flame_rogue'
    },
    // ... [58 more entries]
};
```

**Key Rules**:
- `cost` = tier (1–5; maps to shop rarity)
- `archetype` = one of: **duelist, predator, ranger, guardian, vanguard, warden, sorcerer, mystic, sage** (from prompt 17)
- Stats come **verbatim** from UNITS-DESIGN.md section 4
- `evolvedForm` = snake_case key of evolved unit for all 60 units
- Emoji pattern:
  - **Type emoji** + **element emoji**
  - Warrior: ⚔️
  - Tank: 🛡️
  - Archer: 🏹
  - Mage: 🔮
  - Assassin: 🗡️
  - Healer: 💚
  - Elements: Fire 🔥, Water 💧, Earth 🌿, Wind 💨, Lightning ⚡, Force 💪
  - Example: ⚔️🔥 = Warrior + Fire, 🏹⚡ = Archer + Lightning

**Unit List** (All 60, organized by element, then tier):

**FIRE (10 units)**
1. flame_warrior (T1)
2. ember_scout (T1)
3. cinder_archer (T1)
4. fire_acolyte (T1)
5. magma_knight (T2)
6. blaze_lancer (T2)
7. pyromancer (T3)
8. inferno_fox (T3)
9. fire_dragon (T4)
10. phoenix (T5, maxMana: 0)

**WATER (10 units)**
1. tide_hunter (T1)
2. frost_archer (T1)
3. reef_stalker (T1)
4. coral_priest (T2)
5. hydro_mage (T2)
6. shell_knight (T2)
7. tidal_shaman (T3)
8. riptide_blade (T3)
9. kraken (T4)
10. leviathan (T5, maxMana: 0)

**EARTH (10 units)**
1. stone_guard (T1)
2. bramble_knight (T1)
3. seedling_archer (T1)
4. earth_shaman (T2)
5. crystal_mage (T2)
6. mud_stalker (T2)
7. golem (T3)
8. terra_sage (T3)
9. ancient_treant (T4)
10. world_tree (T5, maxMana: 0)

**WIND (10 units)**
1. zephyr_scout (T1)
2. wind_archer (T1)
3. gale_dancer (T1)
4. wind_squire (T1)
5. sky_knight (T2)
6. gust_sentinel (T2)
7. monsoon_caller (T3)
8. wind_duelist (T3)
9. storm_sovereign (T4)
10. void_wyrm (T5, maxMana: 0)

**LIGHTNING (10 units)** — NEW ELEMENT
1. spark_fencer (T1)
2. volt_runner (T1)
3. thunder_archer (T1)
4. pulse_mender (T1)
5. tesla_knight (T2)
6. shock_mage (T2)
7. ball_lightning (T3)
8. thunder_warden (T3)
9. thunderbird (T4)
10. storm_dragon (T5, maxMana: 0)

**FORCE (10 units)** — NEW ELEMENT
1. iron_soldier (T1)
2. shadow_blade (T1)
3. steel_archer (T1)
4. war_cleric (T2)
5. battle_mage (T2)
6. shield_bearer (T2)
7. gladiator (T3)
8. fortress (T3)
9. siege_engineer (T4)
10. titan_lord (T5, maxMana: 0)

#### 3. EVOLVED_TEMPLATES — All 60 Evolved Forms

All 60 units evolve. Every unit in UNIT_TEMPLATES has an `evolvedForm` key pointing to its evolved variant in EVOLVED_TEMPLATES.

**Format**:
```javascript
var EVOLVED_TEMPLATES = {
    fire_berserker: {
        name: 'Fire Berserker', baseCost: 1, type: 'warrior', archetype: 'duelist', element: 'fire',
        hp: 750, attack: 70, attackSpd: 0.6, range: 1, moveSpd: 2.5, maxMana: 65,
        emoji: '⚔️🔥✨', ability: 'Enhanced Heated Blows + stronger Blade Inferno',
        baseKey: 'flame_warrior'
    },
    // ... [59 more entries for all 60 evolved units]
};
```

**Key Rules**:
- `baseCost` = cost of base unit (e.g., 1 if evolved from T1)
- `baseKey` = snake_case key of base unit (not display name)
- Evolved stats are 20–30% higher than base (pull exact values from UNITS-DESIGN.md evolved section)
- `maxMana` stays the same as base (evolved units don't change mana requirements)
- Emoji = base emoji + ✨ sparkle
- `ability` = brief description (will be superseded by ABILITY_DATA entries, but useful for reference)

**Evolved Unit List** (60 total: 10 Fire, 10 Water, 10 Earth, 10 Wind, 10 Lightning, 10 Force):

**FIRE EVOLVED**
1. fire_berserker (from flame_warrior)
2. flame_rogue (from ember_scout)
3. cinder_marksman (from cinder_archer)
4. ember_saint (from fire_acolyte)
5. volcano_titan (from magma_knight)
6. inferno_lancer (from blaze_lancer)
7. arcane_inferno (from pyromancer)
8. ninetail_blaze (from inferno_fox)
9. elder_wyrm (from fire_dragon)
10. eternal_phoenix (from phoenix)

**WATER EVOLVED**
1. tsunami_blade (from tide_hunter)
2. ice_sniper (from frost_archer)
3. tidal_phantom (from reef_stalker)
4. ocean_sage (from coral_priest)
5. abyssal_mage (from hydro_mage)
6. armored_sentinel (from shell_knight)
7. stormtide_oracle (from tidal_shaman)
8. tsunami_warlord (from riptide_blade)
9. abyssal_terror (from kraken)
10. primordial_leviathan (from leviathan)

**EARTH EVOLVED**
1. mountain_lord (from stone_guard)
2. ironwood_sentinel (from bramble_knight)
3. thornwood_ranger (from seedling_archer)
4. gaia_priest (from earth_shaman)
5. geomancer (from crystal_mage)
6. quake_reaper (from mud_stalker)
7. iron_colossus (from golem)
8. earthweaver (from terra_sage)
9. world_sentinel (from ancient_treant)
10. yggdrasil (from world_tree)

**WIND EVOLVED**
1. storm_assassin (from zephyr_scout)
2. gale_sniper (from wind_archer)
3. stormweaver (from gale_dancer)
4. zephyr_warrior (from wind_squire)
5. aegis_paladin (from sky_knight)
6. tempest_guardian (from gust_sentinel)
7. tempest_lord (from monsoon_caller)
8. hurricane_blade (from wind_duelist)
9. tempest_emperor (from storm_sovereign)
10. dimensional_dragon (from void_wyrm)

**LIGHTNING EVOLVED**
1. arc_duelist (from spark_fencer)
2. lightning_phantom (from volt_runner)
3. storm_archer (from thunder_archer)
4. storm_medic (from pulse_mender)
5. storm_bastion (from tesla_knight)
6. tempest_mage (from shock_mage)
7. plasma_core (from ball_lightning)
8. storm_fortress (from thunder_warden)
9. roc_of_storms (from thunderbird)
10. thunder_god (from storm_dragon)

**FORCE EVOLVED**
1. legionnaire (from iron_soldier)
2. night_stalker (from shadow_blade)
3. ballista_archer (from steel_archer)
4. battle_priest (from war_cleric)
5. force_archmage (from battle_mage)
6. bastion (from shield_bearer)
7. champion (from gladiator)
8. citadel (from fortress)
9. war_architect (from siege_engineer)
10. cosmic_titan (from titan_lord)

#### 4. EVOLUTIONS — All 60 Evolution Paths

Map base → evolved for all 60 units.

```javascript
var EVOLUTIONS = {
    flame_warrior:    { evolved: 'fire_berserker',    requirements: [{ type: 'stars', value: 3 }] },
    ember_scout:      { evolved: 'flame_rogue',       requirements: [{ type: 'stars', value: 3 }] },
    cinder_archer:    { evolved: 'cinder_marksman',   requirements: [{ type: 'stars', value: 3 }] },
    fire_acolyte:     { evolved: 'ember_saint',       requirements: [{ type: 'stars', value: 3 }] },
    // ... [56 more for remaining units]
};
```

**Key Rules**:
- All 60 units have entries (60 total)
- `requirements` is an array of requirement objects:
  - `{ type: 'stars', value: 3 }` = unit must reach 3★

#### 5. ABILITY_DATA — All 120 Ability Entries (60 Base + 60 Evolved)

**Format**:
```javascript
var ABILITY_DATA = {
    // --- Base Abilities ---
    flame_warrior: {
        name: 'Blade Inferno',
        desc: 'Slash forward, dealing 150% ATK in a cone. Apply Burn (15 DPS, 3s) to all hit.'
    },
    // --- Evolved Abilities ---
    fire_berserker: {
        name: 'Inferno Slash',
        desc: 'Slash forward dealing 200% ATK to target + adjacent enemies. Apply Burn (25 DPS, 4s).'
    },
    // ... [118 more entries]
};
```

**Key Rules**:
- Every base unit (60) has an entry
- Every evolved unit (60) has an entry
- No empty or null entries
- Descriptions are pulled **verbatim** from UNITS-DESIGN.md section 4
- Format: `name` (string), `desc` (string, can include % symbols, conditions, element damage notes)

**Ability Data Instructions**:

For each unit, extract from UNITS-DESIGN.md:
1. **Ability name** (e.g., "Blade Inferno")
2. **Full description** (e.g., "Slash forward, dealing 150% ATK in a cone. Apply Burn (15 DPS, 3s) to all hit.")
3. For evolved units, use the evolved ability name and description (found in **Evolved Form** section)

**Example entries**:
```javascript
// FIRE, T1
flame_warrior: { name: 'Blade Inferno', desc: 'Slash forward, dealing 150% ATK in a cone. Apply Burn (15 DPS, 3s) to all hit.' },
ember_scout: { name: 'Ambush', desc: 'Dash behind target, dealing 200% ATK and applying Burn (10 DPS, 3s). Refund 30 mana if it kills.' },
cinder_archer: { name: 'Fire Arrow', desc: 'Next auto-attack empowered, deals 180% ATK and applies Burn (15 DPS, 3s).' },
fire_acolyte: { name: 'Sacred Flame', desc: 'Heal lowest-HP ally for 140% ATK. If ally is below 35% HP, heal for 220% instead.' },

// FIRE, T1 EVOLVED
fire_berserker: { name: 'Inferno Slash', desc: 'Slash forward dealing 200% ATK to target + adjacent enemies. Apply Burn (25 DPS, 4s).' },
flame_rogue: { name: 'Phantom Blaze', desc: 'Dash behind target, dealing 250% ATK and leaving fire trail (25 DPS, 3s).' },
cinder_marksman: { name: 'Fire Barrage', desc: 'Fire 2 arrows (120% each) and apply Burn (15 DPS, 3s). Enemies hit take +20% burn damage.' },
ember_saint: { name: 'Holy Inferno', desc: 'Heal lowest-HP ally for 160% ATK. Grant +15% ATK. Apply Burn (15 DPS, 3s) to nearest enemy.' },

// ... [112 more entries for all other units]
```

---

### Phase B: Passive Data (NEW)

#### 6. PASSIVE_DATA — 60 Base Unit Innate Passives (All Tiers)

This is a **new data structure** not in the old code. It defines every unit's innate (always-on) passive ability.

**Format**:
```javascript
var PASSIVE_DATA = {
    flame_warrior: {
        name: 'Heated Blows',
        desc: 'Every 3rd auto-attack deals 25% bonus damage.',
        trigger: 'on_attack',
        params: { interval: 3, bonusDamage: 0.25 }
    },
    ember_scout: {
        name: 'First Blood',
        desc: 'First attack after entering combat deals 50% bonus damage.',
        trigger: 'combat_start',
        params: { bonusDamage: 0.50 }
    },
    stone_guard: {
        name: 'Fortify',
        desc: 'Gain 4% DR for every ally within 2.5 cells (max 20%).',
        trigger: 'aura',
        params: { drPerAlly: 0.04, range: 2.5, max: 0.20 }
    },
    // ... [57 more entries]
};
```

**Trigger Types** (what event activates the passive):

| Trigger | Description | Examples |
|---------|-------------|----------|
| `on_attack` | Fires when this unit attacks (e.g., every Nth attack bonus) | Heated Blows (every 3rd), Momentum (per hit) |
| `on_hit` | Fires when this unit takes damage | Molten Armor (reflect), Thorns (melee counter) |
| `on_kill` | Fires when this unit kills an enemy | Windwalk (move speed after kill), On kill heal |
| `periodic` | Fires every N seconds (independent of combat actions) | Ink Cloud (every 15s), Bloom of Life (every 8s) |
| `aura` | Constantly checks nearby allies/enemies; ticks frequently | Fortify (DR per ally), Inspiring Presence (damage aura) |
| `combat_start` | Fires once at combat initialization | First Blood (first attack bonus), Deep Roots (regen) |

**Key Rules**:
- Extract **Innate Passive** name and description from UNITS-DESIGN.md section 4
- `params` object holds all configurable values (cooldowns, percentages, ranges, durations)
- All numeric values are decimals (0.25 = 25%, 2.5 = 2.5 cells)
- If a passive has no "duration" component (aura-based), omit `duration` from params
- Use clear, exact parameter names matching the description (e.g., `drPerAlly`, `burnDps`, `range`, `maxStacks`)

**Complete PASSIVE_DATA — 60 Entries**

Extract from UNITS-DESIGN.md section 4 for each unit:

**FIRE**
```javascript
flame_warrior: { name: 'Heated Blows', desc: 'Every 3rd auto-attack deals 25% bonus damage.', trigger: 'on_attack', params: { interval: 3, bonusDamage: 0.25 } },
ember_scout: { name: 'First Blood', desc: 'First attack after entering combat deals 50% bonus damage.', trigger: 'combat_start', params: { bonusDamage: 0.50 } },
cinder_archer: { name: 'Ignition', desc: 'Auto-attacks against Burning enemies deal 20% bonus damage.', trigger: 'on_attack', params: { conditionalBonus: 0.20, condition: 'target_burning' } },
fire_acolyte: { name: 'Cauterize', desc: 'Heals also apply Burn (8 DPS, 2s) to the nearest enemy.', trigger: 'on_attack', params: { burnDps: 8, burnDuration: 2 } },
magma_knight: { name: 'Molten Armor', desc: 'When hit by melee attack, deals 15 fire damage back to attacker.', trigger: 'on_hit', params: { reflectDamage: 15 } },
blaze_lancer: { name: 'Momentum', desc: 'Consecutive hits on the same target increase damage by 8% per stack (max 5).', trigger: 'on_attack', params: { damagePerStack: 0.08, maxStacks: 5 } },
pyromancer: { name: 'Pyromaniac', desc: 'Burn effects on enemy hit by Pyromancer last 50% longer and deal 20% more DPS.', trigger: 'on_attack', params: { burnDurationMultiplier: 1.5, burnDpsMultiplier: 1.20 } },
inferno_fox: { name: 'Foxfire', desc: 'Leaves fire trail when moving. Trail lasts 2.5s and deals 18 DPS to enemies on it.', trigger: 'periodic', params: { trailDps: 18, trailDuration: 2.5 } },
fire_dragon: { name: 'Dragonfire Aura', desc: 'Enemies within 2 cells take 20 fire damage per second.', trigger: 'aura', params: { auraDps: 20, range: 2 } },
phoenix: { name: 'Eternal Flame', desc: 'While alive, all Fire allies gain 15% ATK and 8% lifesteal. On revival, aura doubles for 6s.', trigger: 'aura', params: { atkBonus: 0.15, lifesteal: 0.08, range: 999 } },
```

**WATER** — 10 more entries (tide_hunter through leviathan)
**EARTH** — 10 more entries
**WIND** — 10 more entries
**LIGHTNING** — 10 more entries
**FORCE** — 10 more entries

**Total**: 60 entries covering all base units.

#### 7. EVOLVED_PASSIVE_DATA — 60 Evolved Unit Passives (All Tiers)

**Format**:
```javascript
var EVOLVED_PASSIVE_DATA = {
    fire_berserker: {
        name: 'Scorching Blows',
        desc: 'Every 2.5 attacks deals 40% bonus and applies Burn (10 DPS, 2s).',
        trigger: 'on_attack',
        params: { interval: 2.5, bonusDamage: 0.40, burnDps: 10, burnDuration: 2 }
    },
    // ... [39 more entries]
};
```

**Key Rules**:
- All 60 evolved forms have entries
- Extract **Evolved Form** passive upgrades from UNITS-DESIGN.md section 4
- Use same trigger types and parameter structure as PASSIVE_DATA
- Evolved passives are typically stronger (higher percentages, longer durations, wider ranges)

**Complete EVOLVED_PASSIVE_DATA — 60 Entries**

Extract from UNITS-DESIGN.md section 4 **Evolved Form** descriptions:

**FIRE EVOLVED** (6 entries)
```javascript
fire_berserker: { name: 'Scorching Blows', desc: 'Every 2.5 attacks deals 40% bonus and applies Burn (25 DPS, 4s).', trigger: 'on_attack', params: { interval: 2.5, bonusDamage: 0.40, burnDps: 25, burnDuration: 4 } },
flame_rogue: { name: 'First Blood Enhanced', desc: 'First attack deals 80% bonus and ignores 50% DR.', trigger: 'combat_start', params: { bonusDamage: 0.80, drIgnore: 0.50 } },
cinder_marksman: { name: 'Ignition Amplified', desc: 'Bonus increases to 30% and applies 10 DPS Burn back to archer.', trigger: 'on_attack', params: { conditionalBonus: 0.30, reflectBurnDps: 10 } },
ember_saint: { name: 'Cauterize Aura', desc: 'Affects 2 nearest enemies.', trigger: 'aura', params: { targets: 2 } },
volcano_titan: { name: 'Molten Armor Enhanced', desc: 'Deals 25 damage and leaves 3s lava pool (30 DPS).', trigger: 'on_hit', params: { reflectDamage: 25, lavaPoolDps: 30, lavaPoolDuration: 3 } },
inferno_lancer: { name: 'Momentum Mastery', desc: 'Stacks increase to 10% and grant 5% lifesteal per stack.', trigger: 'on_attack', params: { damagePerStack: 0.10, maxStacks: 5, lifestealPerStack: 0.05 } },
```

**WATER EVOLVED** (10 entries)
**EARTH EVOLVED** (10 entries)
**WIND EVOLVED** (10 entries)
**LIGHTNING EVOLVED** (10 entries)
**FORCE EVOLVED** (10 entries)

**Total**: 60 entries covering all evolved units.

---

### Phase C: Verification & Gacha Integration

#### 8. Update SHOP_POOL_KEYS

The gacha system pulls unit keys from SHOP_POOL_KEYS. Since UNIT_TEMPLATES now has 60 entries, update:

```javascript
var SHOP_POOL_KEYS = Object.keys(UNIT_TEMPLATES);
```

This auto-expands to include all 60 units.

#### 9. Verify ELEMENTS Object (Lightning & Force)

Add new elements to the existing ELEMENTS object in units.js if not already present:

```javascript
var ELEMENTS = {
    fire:      { name: 'Fire',      emoji: '🔥', color: '#ff4444', strong: 'wind',  weak: 'water' },
    water:     { name: 'Water',     emoji: '💧', color: '#4488ff', strong: 'fire',  weak: 'earth' },
    earth:     { name: 'Earth',     emoji: '🌿', color: '#44aa44', strong: 'water', weak: 'wind'  },
    wind:      { name: 'Wind',      emoji: '💨', color: '#aa44ff', strong: 'earth', weak: 'fire'  },
    lightning: { name: 'Lightning', emoji: '⚡', color: '#ffff44', strong: 'water',  weak: 'fire'  },
    force:     { name: 'Force',     emoji: '💪', color: '#ff88ff', strong: 'wind',   weak: 'water' }
};
```

(Adjust element weak/strong relationships if game design specifies different matchups.)

#### 10. Verify ELEMENT_SYNERGIES (Lightning & Force)

If not already in units.js, add synergy thresholds for Lightning and Force (copy existing Fire/Water structure):

```javascript
var ELEMENT_SYNERGIES = {
    // ... existing Fire, Water, Earth, Wind ...
    lightning: {
        name: 'Lightning', emoji: '⚡',
        thresholds: [2, 4, 7, 10],
        bonuses: [
            { desc: 'All allies gain 12% crit chance and chain damage', critChance: 0.12 },
            { desc: 'Crit chance 25%. Attacks chain to 1 nearby enemy at 60% damage', critChance: 0.25, chainDamage: 0.60 },
            { desc: 'Crit chance 40%. All Lightning attacks ignore 20% DR', critChance: 0.40, drIgnore: 0.20 },
            { desc: 'Crit chance 60%. Lightning allies gain 15% lifesteal. Unlock Prismatic bonus', critChance: 0.60, lifesteal: 0.15 }
        ]
    },
    force: {
        name: 'Force', emoji: '💪',
        thresholds: [2, 4, 7, 10],
        bonuses: [
            { desc: 'All allies gain 8% DR and deal 15% true damage vs shields', drBonus: 0.08, trueVsShield: 0.15 },
            { desc: 'DR 15%. Force allies ignore 12% enemy DR', drBonus: 0.15, drIgnore: 0.12 },
            { desc: 'DR 22%. Knockback range +1 cell', drBonus: 0.22, knockbackBonus: 1 },
            { desc: 'DR 30%. All Force allies gain +20% ATK. Unlock Prismatic bonus', drBonus: 0.30, atkBonus: 0.20 }
        ]
    }
};
```

#### 11. Update ARCHETYPES to 9 (if not in Prompt 17)

Verify ARCHETYPES in units.js includes all 9 from prompt 17:
- guardian, striker, predator, mystic, vanguard, sage, sorcerer, duelist, warden

(These should already exist from prompt 17.)

---

### Phase D: Testing & Verification

#### 12. Log Test: Roster Completeness

Add a debug function in units.js after all data structures are defined:

```javascript
function verifyRosterIntegrity() {
    var allErrors = [];
    var baseKeys = Object.keys(UNIT_TEMPLATES);
    var evolvedKeys = Object.keys(EVOLVED_TEMPLATES);
    var passiveKeys = Object.keys(PASSIVE_DATA);
    var evolvedPassiveKeys = Object.keys(EVOLVED_PASSIVE_DATA);
    var abilityKeys = Object.keys(ABILITY_DATA);
    var evolutionKeys = Object.keys(EVOLUTIONS);

    console.log('=== ROSTER INTEGRITY CHECK ===');

    // Check 1: UNIT_TEMPLATES has 60 units
    if (baseKeys.length !== 60) {
        allErrors.push('UNIT_TEMPLATES has ' + baseKeys.length + ' units (expected 60)');
    } else {
        console.log('✓ UNIT_TEMPLATES: 60 base units');
    }

    // Check 2: EVOLVED_TEMPLATES has 60 units
    if (evolvedKeys.length !== 60) {
        allErrors.push('EVOLVED_TEMPLATES has ' + evolvedKeys.length + ' units (expected 60)');
    } else {
        console.log('✓ EVOLVED_TEMPLATES: 60 evolved units');
    }

    // Check 3: PASSIVE_DATA has 60 entries
    if (passiveKeys.length !== 60) {
        allErrors.push('PASSIVE_DATA has ' + passiveKeys.length + ' entries (expected 60)');
    } else {
        console.log('✓ PASSIVE_DATA: 60 base passives');
    }

    // Check 4: EVOLVED_PASSIVE_DATA has 60 entries
    if (evolvedPassiveKeys.length !== 60) {
        allErrors.push('EVOLVED_PASSIVE_DATA has ' + evolvedPassiveKeys.length + ' entries (expected 60)');
    } else {
        console.log('✓ EVOLVED_PASSIVE_DATA: 60 evolved passives');
    }

    // Check 5: ABILITY_DATA has 120 entries (60 base + 60 evolved)
    if (abilityKeys.length !== 120) {
        allErrors.push('ABILITY_DATA has ' + abilityKeys.length + ' entries (expected 120)');
    } else {
        console.log('✓ ABILITY_DATA: 120 ability entries');
    }

    // Check 6: Each base unit has a matching ABILITY_DATA entry
    for (var i = 0; i < baseKeys.length; i++) {
        var key = baseKeys[i];
        if (!ABILITY_DATA[key]) {
            allErrors.push('Missing ABILITY_DATA for base unit: ' + key);
        }
    }

    // Check 7: Each evolved unit has a matching ABILITY_DATA entry
    for (var i = 0; i < evolvedKeys.length; i++) {
        var key = evolvedKeys[i];
        if (!ABILITY_DATA[key]) {
            allErrors.push('Missing ABILITY_DATA for evolved unit: ' + key);
        }
    }

    // Check 8: Each base unit has a matching PASSIVE_DATA entry
    for (var i = 0; i < baseKeys.length; i++) {
        var key = baseKeys[i];
        if (!PASSIVE_DATA[key]) {
            allErrors.push('Missing PASSIVE_DATA for base unit: ' + key);
        }
    }

    // Check 9: Each evolved unit has a matching EVOLVED_PASSIVE_DATA entry
    for (var i = 0; i < evolvedKeys.length; i++) {
        var key = evolvedKeys[i];
        if (!EVOLVED_PASSIVE_DATA[key]) {
            allErrors.push('Missing EVOLVED_PASSIVE_DATA for evolved unit: ' + key);
        }
    }

    // Check 10: Each T1–3 base unit has an EVOLUTIONS entry
    for (var i = 0; i < baseKeys.length; i++) {
        var key = baseKeys[i];
        var unit = UNIT_TEMPLATES[key];
        if (unit.cost <= 3 && !EVOLUTIONS[key]) {
            allErrors.push('Missing EVOLUTIONS entry for T1–3 unit: ' + key);
        }
    }

    // Check 11: Each evolution key resolves to an evolved unit in EVOLVED_TEMPLATES
    for (var i = 0; i < evolutionKeys.length; i++) {
        var key = evolutionKeys[i];
        var evo = EVOLUTIONS[key];
        if (!EVOLVED_TEMPLATES[evo.evolved]) {
            allErrors.push('EVOLUTIONS[' + key + '].evolved points to missing unit: ' + evo.evolved);
        }
    }

    // Check 12: Element distribution (should be 10 per element)
    var elementCounts = {};
    for (var i = 0; i < baseKeys.length; i++) {
        var key = baseKeys[i];
        var unit = UNIT_TEMPLATES[key];
        elementCounts[unit.element] = (elementCounts[unit.element] || 0) + 1;
    }

    var elementKeys = Object.keys(elementCounts);
    for (var i = 0; i < elementKeys.length; i++) {
        var elem = elementKeys[i];
        if (elementCounts[elem] !== 10) {
            allErrors.push('Element "' + elem + '" has ' + elementCounts[elem] + ' units (expected 10)');
        }
    }

    if (elementCounts['fire']) console.log('✓ Fire: ' + elementCounts['fire'] + ' units');
    if (elementCounts['water']) console.log('✓ Water: ' + elementCounts['water'] + ' units');
    if (elementCounts['earth']) console.log('✓ Earth: ' + elementCounts['earth'] + ' units');
    if (elementCounts['wind']) console.log('✓ Wind: ' + elementCounts['wind'] + ' units');
    if (elementCounts['lightning']) console.log('✓ Lightning: ' + elementCounts['lightning'] + ' units');
    if (elementCounts['force']) console.log('✓ Force: ' + elementCounts['force'] + ' units');

    // Check 13: Tier distribution (T1: 21, T2: 15, T3: 12, T4: 6, T5: 6)
    var tierCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (var i = 0; i < baseKeys.length; i++) {
        var key = baseKeys[i];
        var unit = UNIT_TEMPLATES[key];
        tierCounts[unit.cost]++;
    }

    if (tierCounts[1] === 21) console.log('✓ Tier 1: 21 units');
    else allErrors.push('Tier 1 has ' + tierCounts[1] + ' units (expected 21)');

    if (tierCounts[2] === 15) console.log('✓ Tier 2: 15 units');
    else allErrors.push('Tier 2 has ' + tierCounts[2] + ' units (expected 15)');

    if (tierCounts[3] === 12) console.log('✓ Tier 3: 12 units');
    else allErrors.push('Tier 3 has ' + tierCounts[3] + ' units (expected 12)');

    if (tierCounts[4] === 6) console.log('✓ Tier 4: 6 units');
    else allErrors.push('Tier 4 has ' + tierCounts[4] + ' units (expected 6)');

    if (tierCounts[5] === 6) console.log('✓ Tier 5: 6 units');
    else allErrors.push('Tier 5 has ' + tierCounts[5] + ' units (expected 6)');

    // Report errors
    if (allErrors.length === 0) {
        console.log('\n✓✓✓ ALL CHECKS PASSED ✓✓✓\n');
        return true;
    } else {
        console.error('\n❌ ERRORS FOUND (' + allErrors.length + '):');
        for (var i = 0; i < allErrors.length; i++) {
            console.error('  [' + (i + 1) + '] ' + allErrors[i]);
        }
        return false;
    }
}

// Call on startup (in main.js or game-v2.html script)
// verifyRosterIntegrity();
```

#### 13. Manual Test: Gacha & Team Builder

In the game UI:

1. **Open Shop (Gacha)**
   - Click "Refresh" multiple times
   - Verify units from all 60 appear (names, emojis correct)
   - Check that Tier 1 appears frequently, Tier 5 rarely

2. **Place Units on Board**
   - Drag a Fire unit onto board
   - Verify element/archetype synergies display correctly (from UI-v2)
   - Place another Fire unit, check synergy icon updates

3. **Evolution Test**
   - Roll 3 copies of same T1 unit (e.g., flame_warrior)
   - Click "Evolve" in team builder
   - Verify evolved form appears (fire_berserker name, updated stats, ✨ emoji)
   - Check ABILITY_DATA loads correct evolved ability description

4. **Passive Display** (if UI supports it)
   - Hover/click unit on board
   - Verify passive name and description appear from PASSIVE_DATA
   - For evolved unit, check EVOLVED_PASSIVE_DATA description shows

---

## File Organization & Code Structure

### units.js Structure (Final)

```javascript
// units.js

// =============================================================================
// CONSTANTS & LOOKUPS
// =============================================================================

var ELEMENTS = { ... };
var ELEMENT_SYNERGIES = { ... };
var ARCHETYPES = { ... };
var UNIT_TYPE_DESCRIPTIONS = { ... };

// =============================================================================
// UNIT DATA STRUCTURES (60 UNITS)
// =============================================================================

var UNIT_TEMPLATES = {
    // --- FIRE (10 units) ---
    // --- WATER (10 units) ---
    // --- EARTH (10 units) ---
    // --- WIND (10 units) ---
    // --- LIGHTNING (10 units) ---
    // --- FORCE (10 units) ---
};

var EVOLVED_TEMPLATES = {
    // --- FIRE EVOLVED (6 units) ---
    // --- WATER EVOLVED (6 units) ---
    // --- EARTH EVOLVED (6 units) ---
    // --- WIND EVOLVED (6 units) ---
    // --- LIGHTNING EVOLVED (6 units) ---
    // --- FORCE EVOLVED (6 units) ---
};

var EVOLUTIONS = {
    // --- All evolution mappings (60 entries) ---
};

var ABILITY_DATA = {
    // --- BASE ABILITIES (60 entries) ---
    // --- EVOLVED ABILITIES (60 entries) ---
};

var PASSIVE_DATA = {
    // --- BASE PASSIVES (60 entries) ---
};

var EVOLVED_PASSIVE_DATA = {
    // --- EVOLVED PASSIVES (60 entries) ---
};

var SHOP_POOL_KEYS = Object.keys(UNIT_TEMPLATES);

// =============================================================================
// UNIT CREATION & UTILITIES
// =============================================================================

function createUnit(templateKey) { ... }
function getStarMultiplier(stars) { ... }
function upgradeUnit(unit) { ... }
function checkEvolutionRequirements(saveData, templateKey) { ... }
function checkEnemyEvolution(unit) { ... }
function evolveUnit(saveData, baseTemplateKey) { ... }
function getElementMultiplier(attackerElem, defenderElem) { ... }
function getSellValue(unit) { ... }
function verifyRosterIntegrity() { ... }
```

---

## Critical Notes

1. **NO Combat Logic Yet**: This prompt is data-only. PASSIVE_DATA and ABILITY_DATA are metadata (names + descriptions + trigger types). The actual `processPassive()` and `executeAbility()` functions come in prompts 19a & 19b. For now, just define the data structures.

2. **Archetype Authority**: The 9 archetypes from prompt 17 must match exactly:
   - **duelist**: 7 units (melee carries, lifesteal focus)
   - **predator**: 7 units (assassins, burst/chain kills)
   - **ranger**: 6 units (ranged carries, sustained damage)
   - **guardian**: 7 units (tanks, tanky support, shields)
   - **vanguard**: 6 units (frontline fighters, front-row buffs)
   - **warden**: 6 units (crowd control, stuns/roots, defensive)
   - **sorcerer**: 7 units (mage synergy, ability spam)
   - **mystic**: 7 units (element specialists, damage amp/resist)
   - **sage**: 7 units (healers, sustain, shields)

3. **Stats Authority**: All HP, ATK, AtkSpd, Range, MoveSpd, MaxMana come from UNITS-DESIGN.md section 4. **No improvisation**.

4. **Evolved Stat Rules**:
   - Evolved stats are 20–30% higher than base (pull exact values from evolved form descriptions in UNITS-DESIGN.md)
   - Example: flame_warrior (HP 600) → fire_berserker (HP 750) = +25%
   - MaxMana stays the same (evolved units keep base mana requirement)

5. **Emoji Format**:
   - Type + Element (e.g., ⚔️🔥 = Warrior + Fire)
   - Evolved adds ✨ (e.g., ⚔️🔥✨ = Evolved Warrior + Fire)
   - Must be consistent with all 60 units

6. **All Units**:
   - All 60 units have `evolvedForm` pointing to their evolved variant
   - All 60 have entries in EVOLVED_TEMPLATES
   - All 60 have entries in EVOLUTIONS
   - T5 evolved units keep `maxMana: 0`

7. **Data Immutability**: Once this prompt is done, UNIT_TEMPLATES, EVOLVED_TEMPLATES, etc. should not be hand-edited—they're derived from UNITS-DESIGN.md as the single source of truth.

8. **New Elements (Lightning, Force)**:
   - Add to ELEMENTS (emoji, color, weak/strong matchups)
   - Add to ELEMENT_SYNERGIES (thresholds and bonuses)
   - 10 units per element (same as Fire/Water/Earth/Wind)

---

## Testing Checklist

- [ ] `verifyRosterIntegrity()` runs with 0 errors
- [ ] Gacha refreshes show units from all 6 elements
- [ ] Tier 1 units appear in ~40% of rolls; Tier 5 in ~1%
- [ ] Evolved units show correct names, stats, emojis
- [ ] Archetype filters work (can sort by Guardian, Striker, etc.)
- [ ] Element synergies display for 2+ units of same element
- [ ] ABILITY_DATA and PASSIVE_DATA are not null for any unit

---

## Success Criteria

✓ All 60 base units defined in UNIT_TEMPLATES
✓ All 60 evolved units defined in EVOLVED_TEMPLATES
✓ All 60 evolution paths in EVOLUTIONS
✓ All 120 abilities (60 base + 60 evolved) in ABILITY_DATA
✓ All 60 base passives in PASSIVE_DATA
✓ All 60 evolved passives in EVOLVED_PASSIVE_DATA
✓ `verifyRosterIntegrity()` passes all 13 checks
✓ Gacha shows new units correctly
✓ Team builder displays synergies
✓ No console errors related to missing keys

---

## Next Steps (Prompts 19a & 19b)

After this chunk is complete:
- **Prompt 19a**: Implement `processPassive()` logic for trigger execution
- **Prompt 19b**: Implement `executeAbility()` logic for 100+ ability effects
- Both will reference PASSIVE_DATA and ABILITY_DATA as blueprints

---

**Prompt Author**: Claude
**Date**: 2026-03-17
**Phase**: 2, Chunk 2
**Dependency**: Prompt 17 (Systems Foundation) ✓

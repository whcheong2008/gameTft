# Prompt 32: T4 Expansion — 6 New Units (66 Total Roster)

> Implement 6 new Tier 4 units expanding the roster from 60 to 66 base units (132 total with evolutions). Uses EXACT specs from T4-EXPANSION.md. Integrates all new units into templates, abilities, passives, bonds, and gacha pool.

---

## Overview

**Current State:**
- 60 base units (12 T4: Fire Dragon, Kraken, Ancient Treant, Storm Sovereign, Thunderbird, Siege Engineer)
- 120 evolved forms
- 6 elements × 10 units = 60 roster

**Target State:**
- 66 base units (12 T4 → 12 T4: add Ashen Watcher, Abyssal Guardian, Grove Warden, Tempest Weaver, Voltfang Stalker, Iron Duelist)
- 132 evolved forms (6 new evolved pairs)
- 6 elements × 11 units = 66 roster
- All 6 new units in gacha T4 pool
- 3 new bonds wired into combat

**Key Stats:**
- **Tier Distribution**: 21 T1 / 15 T2 / 12 T3 / 12 T4 / 6 T5 = 66 base
- **Gacha Impact**: T4 pool expands from 6→12. Per-unit copy rate ~19 by campaign end (down from ~38 at 6 units). See PROGRESSION-REWORK.md for tiered star-up math.

---

## Part 1: Base Unit Templates

Add 6 new entries to `UNIT_TEMPLATES` in `units-templates.js`. Place them in element sections, sorted by tier:

```javascript
// FIRE — add after fire_dragon at T4
ashen_watcher: {
    name: 'Ashen Watcher', cost: 4, type: 'healer', archetype: 'sage', secondaryArchetype: 'mystic',
    element: 'fire', hp: 780, attack: 72, attackSpd: 0.8, range: 3, moveSpd: 1.6, maxMana: 75,
    emoji: '\u{2694}\uFE0F\u{1F525}', evolvedForm: 'phoenix_priest'
},

// WATER — add after kraken at T4
abyssal_guardian: {
    name: 'Abyssal Guardian', cost: 4, type: 'tank', archetype: 'guardian', secondaryArchetype: 'warden',
    element: 'water', hp: 1350, attack: 55, attackSpd: 0.6, range: 1, moveSpd: 1.2, maxMana: 90,
    emoji: '\u{1F52E}\u{1F4A7}', evolvedForm: 'hadal_colossus'
},

// EARTH — add after ancient_treant at T4
grove_warden: {
    name: 'Grove Warden', cost: 4, type: 'archer', archetype: 'ranger', secondaryArchetype: 'guardian',
    element: 'earth', hp: 680, attack: 88, attackSpd: 0.75, range: 5, moveSpd: 1.0, maxMana: 70,
    emoji: '\u{1F3F9}\u{1F33F}', evolvedForm: 'worldroot_sentinel'
},

// WIND — add after storm_sovereign at T4
tempest_weaver: {
    name: 'Tempest Weaver', cost: 4, type: 'mage', archetype: 'sorcerer', secondaryArchetype: 'ranger',
    element: 'wind', hp: 650, attack: 92, attackSpd: 0.85, range: 3, moveSpd: 2.0, maxMana: 65,
    emoji: '\u{1F4A8}\u{1F52E}', evolvedForm: 'stormweft_oracle'
},

// LIGHTNING — add after thunderbird at T4
voltfang_stalker: {
    name: 'Voltfang Stalker', cost: 4, type: 'assassin', archetype: 'predator', secondaryArchetype: 'duelist',
    element: 'lightning', hp: 700, attack: 95, attackSpd: 0.5, range: 1, moveSpd: 3.8, maxMana: 50,
    emoji: '\u{26A1}\u{1F5E1}\uFE0F', evolvedForm: 'plasma_ravager'
},

// FORCE — add after siege_engineer at T4
iron_duelist: {
    name: 'Iron Duelist', cost: 4, type: 'warrior', archetype: 'duelist', secondaryArchetype: 'vanguard',
    element: 'force', hp: 950, attack: 105, attackSpd: 0.85, range: 1, moveSpd: 1.8, maxMana: 60,
    emoji: '\u{2694}\uFE0F\u{1F4AA}', evolvedForm: 'warforged_champion'
},
```

---

## Part 2: Evolved Unit Templates

Add 6 new entries to `EVOLVED_TEMPLATES` in `units-templates.js`. Place them with evolved forms, sorted by element/T4:

```javascript
// Phoenix Priest (evolved Ashen Watcher)
phoenix_priest: {
    name: 'Phoenix Priest', baseCost: 4, type: 'healer', archetype: 'sage', secondaryArchetype: 'mystic',
    element: 'fire', hp: 780, attack: 72, attackSpd: 0.8, range: 3, moveSpd: 1.6, maxMana: 75,
    emoji: '\u{2694}\uFE0F\u{1F525}\u{2728}', ability: 'Pyre of Renewal Enhanced', baseKey: 'ashen_watcher'
},

// Hadal Colossus (evolved Abyssal Guardian)
hadal_colossus: {
    name: 'Hadal Colossus', baseCost: 4, type: 'tank', archetype: 'guardian', secondaryArchetype: 'warden',
    element: 'water', hp: 1350, attack: 55, attackSpd: 0.6, range: 1, moveSpd: 1.2, maxMana: 90,
    emoji: '\u{1F52E}\u{1F4A7}\u{2728}', ability: 'Tidal Fortress Enhanced', baseKey: 'abyssal_guardian'
},

// Worldroot Sentinel (evolved Grove Warden)
worldroot_sentinel: {
    name: 'Worldroot Sentinel', baseCost: 4, type: 'archer', archetype: 'ranger', secondaryArchetype: 'guardian',
    element: 'earth', hp: 680, attack: 88, attackSpd: 0.75, range: 5, moveSpd: 1.0, maxMana: 70,
    emoji: '\u{1F3F9}\u{1F33F}\u{2728}', ability: 'Thornstorm Enhanced', baseKey: 'grove_warden'
},

// Stormweft Oracle (evolved Tempest Weaver)
stormweft_oracle: {
    name: 'Stormweft Oracle', baseCost: 4, type: 'mage', archetype: 'sorcerer', secondaryArchetype: 'ranger',
    element: 'wind', hp: 650, attack: 92, attackSpd: 0.85, range: 3, moveSpd: 2.0, maxMana: 65,
    emoji: '\u{1F4A8}\u{1F52E}\u{2728}', ability: 'Cyclone Barrage Enhanced', baseKey: 'tempest_weaver'
},

// Plasma Ravager (evolved Voltfang Stalker)
plasma_ravager: {
    name: 'Plasma Ravager', baseCost: 4, type: 'assassin', archetype: 'predator', secondaryArchetype: 'duelist',
    element: 'lightning', hp: 700, attack: 95, attackSpd: 0.5, range: 1, moveSpd: 3.8, maxMana: 50,
    emoji: '\u{26A1}\u{1F5E1}\uFE0F\u{2728}', ability: 'Lightning Pounce Enhanced', baseKey: 'voltfang_stalker'
},

// Warforged Champion (evolved Iron Duelist)
warforged_champion: {
    name: 'Warforged Champion', baseCost: 4, type: 'warrior', archetype: 'duelist', secondaryArchetype: 'vanguard',
    element: 'force', hp: 950, attack: 105, attackSpd: 0.85, range: 1, moveSpd: 1.8, maxMana: 60,
    emoji: '\u{2694}\uFE0F\u{1F4AA}\u{2728}', ability: 'Decisive Strike Enhanced', baseKey: 'iron_duelist'
},
```

---

## Part 3: Base Unit Abilities

Add 6 new ability definitions to `ABILITY_DATA` in `units-abilities.js`. Organized by element, placed in BASE section:

```javascript
// Add in FIRE BASE section, after fire_dragon
ashen_watcher: {
    name: 'Pyre of Renewal',
    desc: 'Target lowest-HP ally. Column of flame erupts beneath them, healing for 300% ATK over 3s. Target immune to CC during heal. If Burning, consume Burn and increase heal 50%.'
},

// Add in WATER BASE section, after kraken
abyssal_guardian: {
    name: 'Tidal Fortress',
    desc: 'Slam ground, creating 2-cell radius zone for 5s. Enemies Slowed 25%, take 80% ATK/s. Allies +10% DR. Guardian Rooted during channel, gains +20% DR.'
},

// Add in EARTH BASE section, after ancient_treant
grove_warden: {
    name: 'Thornstorm',
    desc: 'Fire 5 thorn projectiles at random enemies. Each deals 120% ATK and applies Slow 15% for 2s. Rooted or Slowed targets take 40% bonus damage.'
},

// Add in WIND BASE section, after storm_sovereign
tempest_weaver: {
    name: 'Cyclone Barrage',
    desc: 'Launch twisting projectile at highest-ATK enemy. Deal 220% ATK, knock 1 cell back. If knocked into another enemy, both take 120% ATK and Slow 20% for 2s.'
},

// Add in LIGHTNING BASE section, after thunderbird
voltfang_stalker: {
    name: 'Lightning Pounce',
    desc: 'Dash to lowest-HP enemy within 4 cells, deal 200% ATK. On kill, dash to next lowest-HP and deal 150% ATK. Chain up to 3 kills. Each dash leaves Afterimage (2s, 50% ATK to enemies stepping through).'
},

// Add in FORCE BASE section, after siege_engineer
iron_duelist: {
    name: 'Decisive Strike',
    desc: 'Next auto-attack deals 280% ATK and ignores 30% of target\u0027s DR. If target is Rival, apply Wound (target receives 30% less healing, 2s).'
},
```

---

## Part 4: Base Unit Passives

Add 6 new passive definitions to `PASSIVE_DATA` in `units-abilities.js`. Organized by element, placed in BASE section:

```javascript
// Add in FIRE section
ashen_watcher: {
    name: 'Ember Shroud',
    desc: 'Heals on allies linger as warm afterglow. Healed allies gain Shield equal to 15% of heal amount for 4s. Applies to all heals (abilities, lifesteal, regen). If ally Burning, shield grants 2s Burn immunity when applied.',
    trigger: 'on_heal',
    params: { shieldPct: 0.15, shieldDuration: 4, burnImmunityDuration: 2 }
},

// Add in WATER section
abyssal_guardian: {
    name: 'Pressure Depths',
    desc: 'For every 10% max HP lost, gain +3% DR (stacks up to +30% at 1 HP). Attacks against this unit slowed 10%. Deeper health drops, harder to finish the kill.',
    trigger: 'aura',
    params: { drPerTenPct: 0.03, drMax: 0.30, attackerSlowPct: 0.10 }
},

// Add in EARTH section
grove_warden: {
    name: 'Deep Roots',
    desc: 'While stationary for 3+ seconds, gain +15% ATK and +1 Range (total 6). Auto-attacks from rooted position have 20% chance to apply Root (1s) to target. Moving resets timer.',
    trigger: 'periodic',
    params: { stationaryDuration: 3, atkBonus: 0.15, rangeBonus: 1, rootChance: 0.20, rootDuration: 1 }
},

// Add in WIND section
tempest_weaver: {
    name: 'Lingering Gales',
    desc: 'Whenever Tempest Weaver casts ability, Vortex remains on target cell for 6s. Vortices deal 20% ATK/s to enemies, grant +15% dodge to allies. Max 3 active (oldest fades when 4th created). Stack with Wind dodge bonuses.',
    trigger: 'on_ability_cast',
    params: { vortexDps: 0.20, vortexAllydodgeBonus: 0.15, maxVortices: 3, vortexDuration: 6 }
},

// Add in LIGHTNING section
voltfang_stalker: {
    name: 'Overcharge Frenzy',
    desc: 'Every crit grants +8% ATK speed for 4s (stacks up to 5 = +40%). At max stacks, auto-attacks chain to 1 adjacent enemy for 40% damage. Lightning crit bonus fuels this passive.',
    trigger: 'on_crit',
    params: { atkSpdPerStack: 0.08, maxStacks: 5, stackDuration: 4, chainDamage: 0.40, chainCount: 1 }
},

// Add in FORCE section
iron_duelist: {
    name: 'Challenge Protocol',
    desc: 'At combat start, mark highest-ATK enemy as Rival. While fighting Rival, gain +20% ATK and +10% DR. On Rival death, next highest-ATK becomes new Rival. If no Rival in range, gain +15% move speed toward Rival.',
    trigger: 'combat_start',
    params: { rivalAtkBonus: 0.20, rivalDrBonus: 0.10, moveSpdBonus: 0.15, rivalDiameter: 5 }
},
```

---

## Part 5: Evolved Unit Abilities

Add 6 new evolved ability definitions to `ABILITY_DATA` in `units-abilities.js`. Organized by element, placed in T3-T5 EVOLVED section:

```javascript
// Add in FIRE T3-T5 EVOLVED section
phoenix_priest: {
    name: 'Pyre of Renewal Enhanced',
    desc: 'Target lowest and second-lowest HP allies. Column of flame erupts beneath them, healing 300% ATK over 3s. Target immune to CC during heal. If Burning, consume and heal +50%. Leave healing zone (50% ATK/s, 3s, 2-cell radius).'
},

// Add in WATER T3-T5 EVOLVED section
hadal_colossus: {
    name: 'Tidal Fortress Enhanced',
    desc: 'Slam ground, creating 3-cell radius zone for 5s. Enemies Slowed 35%, take 80% ATK/s. Allies +10% DR. Guardian Rooted during channel, gains +20% DR. Enemies leaving zone Rooted 1s.'
},

// Add in EARTH T3-T5 EVOLVED section
worldroot_sentinel: {
    name: 'Thornstorm Enhanced',
    desc: 'Fire 7 thorn projectiles at random enemies. Each deals 120% ATK, apply Slow 15% for 2s. Rooted/Slowed targets take 40% bonus. Plant Seedlings on each hit (4s duration). Seedlings Root enemies stepping on them (1.5s).'
},

// Add in WIND T3-T5 EVOLVED section
stormweft_oracle: {
    name: 'Cyclone Barrage Enhanced',
    desc: 'Launch twisting projectile at highest-ATK enemy. Deal 220% ATK, knock 2 cells back. If knocked into wall/edge, Stun 1.5s. If into another enemy, both take 120% ATK and Slow 20% for 2s. Max 4 vortices.'
},

// Add in LIGHTNING T3-T5 EVOLVED section
plasma_ravager: {
    name: 'Lightning Pounce Enhanced',
    desc: 'Dash to lowest-HP enemy within 4 cells, deal 200% ATK. On kill, dash to next lowest-HP and deal 200% ATK. Chain up to 4 kills. Each dash leaves Afterimage (2s). Afterimages explode after 2s for 100% ATK in 1-cell radius.'
},

// Add in FORCE T3-T5 EVOLVED section
warforged_champion: {
    name: 'Decisive Strike Enhanced',
    desc: 'Next auto-attack deals 350% ATK, ignores 50% of target\u0027s DR. If target is Rival, apply Wound (30% less healing, 2s). On kill, refund 50% mana. If Rival killed, gain +10% permanent ATK (stacks).'
},
```

---

## Part 6: Evolved Unit Passives

Add 6 new evolved passive definitions to `PASSIVE_DATA` in `units-abilities.js`. Organized by element, placed in T3-T5 EVOLVED section:

```javascript
// Add in FIRE T3-T5 EVOLVED section
phoenix_priest: {
    name: 'Ember Shroud Enhanced',
    desc: 'Heals linger as warm afterglow. Healed allies gain Shield 25% of heal amount for 4s and 2s Burn immunity. Applies to all heals. Second healing zone grants +15% move speed.',
    trigger: 'on_heal',
    params: { shieldPct: 0.25, shieldDuration: 4, burnImmunityDuration: 2, areaMoveSpdBonus: 0.15 }
},

// Add in WATER T3-T5 EVOLVED section
hadal_colossus: {
    name: 'Pressure Depths Enhanced',
    desc: 'For every 10% max HP lost, gain +3% DR (up to +40% at 1 HP) and +2% lifesteal. Attacks against this unit slowed 10%. Deeper drops, harder kill and more survivability.',
    trigger: 'aura',
    params: { drPerTenPct: 0.03, drMax: 0.40, lifestealPerTenPct: 0.02, attackerSlowPct: 0.10 }
},

// Add in EARTH T3-T5 EVOLVED section
worldroot_sentinel: {
    name: 'Deep Roots Enhanced',
    desc: 'While stationary 2+ seconds (instead of 3), gain +25% ATK and +2 Range (total 7). Auto-attacks have 20% chance to Root (1.5s). Every Thornstorm plants Seedlings (4s, Root enemies 1.5s on step).',
    trigger: 'periodic',
    params: { stationaryDuration: 2, atkBonus: 0.25, rangeBonus: 2, rootChance: 0.20, rootDuration: 1.5 }
},

// Add in WIND T3-T5 EVOLVED section
stormweft_oracle: {
    name: 'Lingering Gales Enhanced',
    desc: 'Ability casts leave Vortices (8s). Vortices deal 30% ATK/s to enemies, grant +25% dodge to allies. Max 4 active. Stack with Wind dodge. Merged zones combine damage and buffs.',
    trigger: 'on_ability_cast',
    params: { vortexDps: 0.30, vortexAllyDodgeBonus: 0.25, maxVortices: 4, vortexDuration: 8 }
},

// Add in LIGHTNING T3-T5 EVOLVED section
plasma_ravager: {
    name: 'Overcharge Frenzy Enhanced',
    desc: 'Every crit grants +8% ATK speed (up to 7 = +56%). At max stacks, auto-attacks chain 60% damage to 1 adjacent. Afterimage explosions scale with stacks.',
    trigger: 'on_crit',
    params: { atkSpdPerStack: 0.08, maxStacks: 7, stackDuration: 4, chainDamage: 0.60, chainCount: 1 }
},

// Add in FORCE T3-T5 EVOLVED section
warforged_champion: {
    name: 'Challenge Protocol Enhanced',
    desc: 'Mark highest-ATK as Rival. While fighting Rival, gain +30% ATK and +15% DR. On Rival death, next highest becomes Rival and gain +10% permanent ATK (stacks). If no Rival in range, +15% move speed.',
    trigger: 'combat_start',
    params: { rivalAtkBonus: 0.30, rivalDrBonus: 0.15, permanentAtkPerKill: 0.10, moveSpdBonus: 0.15, rivalDiameter: 5 }
},
```

---

## Part 7: Evolution Entries

Add 6 new evolution entries to `EVOLUTIONS` in `units-templates.js`:

```javascript
// Add in EVOLUTIONS object
ashen_watcher: { evolved: 'phoenix_priest', requirements: [{ type: 'stars', value: 3 }] },
abyssal_guardian: { evolved: 'hadal_colossus', requirements: [{ type: 'stars', value: 3 }] },
grove_warden: { evolved: 'worldroot_sentinel', requirements: [{ type: 'stars', value: 3 }] },
tempest_weaver: { evolved: 'stormweft_oracle', requirements: [{ type: 'stars', value: 3 }] },
voltfang_stalker: { evolved: 'plasma_ravager', requirements: [{ type: 'stars', value: 3 }] },
iron_duelist: { evolved: 'warforged_champion', requirements: [{ type: 'stars', value: 3 }] },
```

---

## Part 8: New Bonds

Add 3 new entries to `UNIT_BONDS` in `units-bonds.js`:

```javascript
// Add to UNIT_BONDS
'deep_and_shallow': {
    name: 'Deep & Shallow',
    units: ['abyssal_guardian', 'tide_hunter'],
    type: 'duo',
    bonuses: {
        active: { desc: 'Abyssal Guardian + Tide Hunter (both Water) present' },
        effect: { desc: 'Both gain +12% HP. When Abyssal Guardian\u0027s Tidal Fortress activates, Tide Hunter gains +20% ATK for the duration.' }
    }
},

'fire_and_ash': {
    name: 'Fire and Ash',
    units: ['fire_dragon', 'ashen_watcher'],
    type: 'duo',
    bonuses: {
        active: { desc: 'Fire Dragon + Ashen Watcher (both Fire) present' },
        effect: { desc: 'Fire Dragon\u0027s Dragonfire Aura heals allies for 5% of aura damage dealt. Ashen Watcher\u0027s heals on Burning allies are +20% stronger.' }
    }
},

'eye_of_the_storm': {
    name: 'Eye of the Storm',
    units: ['tempest_weaver', 'monsoon_caller', 'storm_sovereign'],
    type: 'trio',
    bonuses: {
        active: { desc: 'Tempest Weaver + Monsoon Caller + Storm Sovereign (all Wind) present' },
        effect: { desc: 'Vortices and Monsoon zones merge: shared zones deal combined damage and grant combined buffs. All Wind allies gain +8% ability damage.' }
    }
},
```

---

## Part 9: Gacha Pool Update

Update the `GACHA_POOL` in `gacha.js` to include all 6 new T4 units.

**Current T4 entries** (remove hardcoded list, replace with dynamic):

Find the T4 pool definition (cost 4 units). Verify these 6 keys are included:
- `ashen_watcher`
- `abyssal_guardian`
- `grove_warden`
- `tempest_weaver`
- `voltfang_stalker`
- `iron_duelist`

If using a filtered approach like `Object.keys(UNIT_TEMPLATES).filter(k => UNIT_TEMPLATES[k].cost === 4)`, verify it dynamically picks up all 12 T4 units.

**Also update evolved gacha** (cost 4 evolved): Add evolved forms to the pool when their base forms are unlocked:
- `phoenix_priest`
- `hadal_colossus`
- `worldroot_sentinel`
- `stormweft_oracle`
- `plasma_ravager`
- `warforged_champion`

---

## Part 10: Unit Count Updates

Update ALL hardcoded unit counts throughout the codebase:

1. **units-templates.js** — Update comment at top of UNIT_TEMPLATES:
   - Change: `// 60 UNIT_TEMPLATES (6 elements × 10 units)`
   - To: `// 66 UNIT_TEMPLATES (6 elements × 11 units)`
   - Change: `// 60 EVOLVED_TEMPLATES`
   - To: `// 66 EVOLVED_TEMPLATES`

2. **CONTINUITY.md** — Update roster stats:
   - Change: `60 base units evolve → 120 total`
   - To: `66 base units evolve → 132 total`
   - Change: `Tier distribution: 21 T1 / 15 T2 / 12 T3 / **6 T4** / 6 T5 = 60`
   - To: `Tier distribution: 21 T1 / 15 T2 / 12 T3 / **12 T4** / 6 T5 = 66`

3. **ui-v2.js or any UI displaying total unit count** — Search for "60 units" and replace with "66 units"

4. **Any achievement/milestone checking total units** — Update count checks from 60→66

---

## Part 11: Verification Checklist

Before launching, verify:

- [ ] **Templates**: All 6 base units in `UNIT_TEMPLATES` with correct cost=4, element, stats, secondaryArchetype
- [ ] **Evolved Templates**: All 6 evolved units in `EVOLVED_TEMPLATES` with correct baseCost=4, baseKey reference
- [ ] **Base Abilities**: All 6 base abilities in `ABILITY_DATA` with correct naming and descriptions
- [ ] **Evolved Abilities**: All 6 evolved abilities in `ABILITY_DATA` with stat upgrades matching T4-EXPANSION.md
- [ ] **Base Passives**: All 6 base passives in `PASSIVE_DATA` with correct trigger types and params
- [ ] **Evolved Passives**: All 6 evolved passives in `PASSIVE_DATA` with enhancements
- [ ] **Evolution Entries**: All 6 entries in `EVOLUTIONS` linking base→evolved (requirements: 3-star)
- [ ] **Bonds**: 3 new bonds in `units-bonds.js` wired correctly (2 duos, 1 trio)
- [ ] **Gacha Pool**: All 12 T4 units (6 original + 6 new) appear in T4 gacha roll list
- [ ] **Evolved Gacha**: All 6 new evolved forms can be rolled once base form is unlocked
- [ ] **Unit Counts**: "60 units" → "66 units", "6 T4" → "12 T4" everywhere in code and docs
- [ ] **No Syntax Errors**: All new entries follow exact pattern of existing units (var, global scope, no ES modules)
- [ ] **Roster Verification**: 6 elements × 11 units = 66 base. Verify each element has 11 units now.
- [ ] **Secondary Archetypes**: All 6 new units have correct secondary archetype:
  - Ashen Watcher → Mystic
  - Abyssal Guardian → Warden
  - Grove Warden → Guardian
  - Tempest Weaver → Ranger
  - Voltfang Stalker → Duelist
  - Iron Duelist → Vanguard
- [ ] **Game Loads**: No console errors, game-v2.html loads without issues
- [ ] **Gacha Rolls Work**: T4 gacha rolls include at least one of the 6 new units (probabilistic, may take ~100 rolls at high level)
- [ ] **Team Builder**: New units appear in roster, team builder, unit detail panel
- [ ] **Combat Loads**: Manually spawning enemies with new units in combat doesn't crash

---

## Notes

- **No changes to:** Gacha rates, star-up costs, team size, economy (all handled by prompt 31)
- **No changes to:** Element matchups, archetype thresholds, existing unit stats (only adding new units)
- **Pattern reminder:** All `var`, global scope, NO ES modules, NO import/export
- **Self-contained:** This prompt is self-contained. Worker implements from just this file, no external design docs needed during execution.
- **Data-driven bonds:** If bonds system has custom trigger logic, verify `units-bonds.js` evaluates conditions correctly (e.g., "all Wind allies gain +8% ability damage" must apply during synergy calc).

---

## Implementation Notes

1. **Exact Naming**: Use exact key names from specs:
   - Base: `ashen_watcher`, `abyssal_guardian`, `grove_warden`, `tempest_weaver`, `voltfang_stalker`, `iron_duelist`
   - Evolved: `phoenix_priest`, `hadal_colossus`, `worldroot_sentinel`, `stormweft_oracle`, `plasma_ravager`, `warforged_champion`

2. **Stat Accuracy**: Copy stats EXACTLY from T4-EXPANSION.md. No approximations or balancing.

3. **Ability Descriptions**: Match the exact ability specs, including mana costs and scaling percentages.

4. **Secondary Archetypes**: These are used by the ascension system (prompt 26). All 6 new units already have secondaryArchetype assigned in templates above.

5. **Bond Integration**: Bonds are purely data-driven. Verify the bond check in combat properly evaluates:
   - `'deep_and_shallow'`: needs both `abyssal_guardian` AND `tide_hunter` on team
   - `'fire_and_ash'`: needs both `fire_dragon` AND `ashen_watcher` on team
   - `'eye_of_the_storm'`: needs all 3 (`tempest_weaver` + `monsoon_caller` + `storm_sovereign`) on team

6. **Testing**: After implementation, roll T4 gacha ~50+ times at level 9+. Statistically should see at least one new T4 unit copy.

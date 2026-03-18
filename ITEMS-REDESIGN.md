# Item System Redesign — RPG Equipment Slots + Diablo-Style Loot

> **Status**: Design proposal (no code changes)
> **Replaces**: Component-based crafting (items.js, ITEMS-DESIGN.md)
> **Depends on**: Hero System (HERO-SYSTEM-DESIGN.md) — only hero-equipped units can use items

---

## 1. Design Philosophy

Two axes of loot progression: **Tier** (region-gated, deterministic) and **Rarity** (RNG, exciting). Every drop rolls both.

### Key Principles
1. **Tier = power floor**: Higher regions drop higher-tier items with better base stats. Deterministic progression.
2. **Rarity = power ceiling**: RNG rolls determine how good a drop is within its tier. A Legendary low-tier item can compete with a Common high-tier item — creating real loot decisions.
3. **Bonus affixes**: Rarity adds random bonus stats from a slot-appropriate pool. Every item is unique.
4. **Passives on top rarity**: Epic gets a minor passive, Legendary gets a major one. These are the chase items.
5. **Hero-gated**: Only units with an equipped hero can wear equipment.
6. **Easy to tune**: All multipliers, weights, and affix pools are defined in config objects for quick balancing.

---

## 2. Equipment Slots (8 total)

| Slot | Role | Primary Stats | Notes |
|------|------|---------------|-------|
| **Weapon** | Offense | ATK, Crit, ATK Speed | Determines attack style fantasy |
| **Helm** | Defense | HP, DR | Head protection |
| **Chest Armor** | Defense | HP, DR | Largest defensive stat budget |
| **Gauntlets** | Offense | ATK, Crit, ATK Speed | Offensive gloves |
| **Boots** | Utility | ATK Speed, Tenacity, Start Mana | Speed and utility |
| **Shield / Off-hand** | Defense / Utility | HP, DR, Shield, Heal Power | Tanks get shields; supports get tomes |
| **Accessory 1** | Flexible | Any stat | Ring or amulet |
| **Accessory 2** | Flexible | Any stat | Ring or amulet |

### Slot Rules
- Each slot holds exactly 1 piece of equipment
- Equipment is slot-locked (a weapon can only go in the weapon slot)
- Equipment can be freely unequipped and transferred between hero-equipped units
- Accessories are universal — any accessory fits either slot

---

## 3. Two-Axis Loot System

### Axis 1: Tier (Region-Gated)

Tier determines the **base item line** and **base stat values**. Higher regions drop higher-tier items.

| Tier | Region | Example Weapon | Base ATK |
|------|--------|---------------|----------|
| T1 | R1-R2 | Iron Sword | 12 |
| T2 | R3-R4 | Steel Sword | 18 |
| T3 | R5-R6 | Mithril Sword | 26 |
| T4 | R7 | Adamant Sword | 36 |
| T5 | R8 | Celestial Blade | 48 |

**Tier stat multipliers** (configurable):
```javascript
var TIER_CONFIG = {
    statMultipliers: [1.0, 1.5, 2.17, 3.0, 4.0],  // T1 through T5
    // Index 0 = T1, Index 4 = T5
};
```

### Axis 2: Rarity (RNG per Drop)

Every drop rolls a rarity. Rarity determines: stat multiplier on base, number of bonus affixes, and whether the item has a passive effect.

| Rarity | Color | Stat Mult | Bonus Affixes | Passive |
|--------|-------|----------|---------------|---------|
| Common | White | 1.0x | 0 | None |
| Uncommon | Green | 1.2x | 1 random | None |
| Rare | Blue | 1.5x | 2 random | None |
| Epic | Purple | 1.8x | 2 random | Minor |
| Legendary | Orange | 2.2x | 3 random | Major |

**Rarity config** (all weights/multipliers easily adjustable):
```javascript
var RARITY_CONFIG = {
    tiers: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    colors: { common: '#ffffff', uncommon: '#4ade80', rare: '#60a5fa', epic: '#c084fc', legendary: '#fb923c' },
    statMultipliers: { common: 1.0, uncommon: 1.2, rare: 1.5, epic: 1.8, legendary: 2.2 },
    affixCount: { common: 0, uncommon: 1, rare: 2, epic: 2, legendary: 3 },
    hasMinorPassive: { common: false, uncommon: false, rare: false, epic: true, legendary: true },
    hasMajorPassive: { common: false, uncommon: false, rare: false, epic: false, legendary: true },
    dropWeights: {
        // Base weights — modified by region and luck bonuses
        common: 50,
        uncommon: 30,
        rare: 13,
        epic: 5.5,
        legendary: 1.5
    }
};
```

### Combined Power Formula
An item's total stat value = `baseStat × TIER_CONFIG.statMultipliers[tier] × RARITY_CONFIG.statMultipliers[rarity]`

Example: Iron Sword (T1) base ATK = 12
- Common Iron Sword: 12 × 1.0 × 1.0 = 12 ATK
- Legendary Iron Sword: 12 × 1.0 × 2.2 = 26 ATK + 3 affixes + major passive
- Common Mithril Sword (T3): 12 × 2.17 × 1.0 = 26 ATK
- Legendary Mithril Sword (T3): 12 × 2.17 × 2.2 = 57 ATK + 3 affixes + major passive

**A Legendary T1 ≈ Common T3** — this is the sweet spot where rarity and tier create real decisions.

---

## 4. Bonus Affix System

When an item drops with affixes, each affix is randomly selected from the slot's affix pool. No duplicates on the same item.

### Affix Pools by Slot

**Weapon affixes:**
```javascript
var WEAPON_AFFIXES = [
    { key: 'flatAtk', name: '+{v} ATK', range: [3, 15] },
    { key: 'atkPct', name: '+{v}% ATK', range: [3, 10] },
    { key: 'critChance', name: '+{v}% Crit Chance', range: [3, 12] },
    { key: 'critDamage', name: '+{v}% Crit Damage', range: [5, 20] },
    { key: 'atkSpeed', name: '-{v}s ATK Speed', range: [0.02, 0.08] },
    { key: 'lifesteal', name: '+{v}% Lifesteal', range: [2, 8] },
    { key: 'armorPen', name: 'Ignore {v}% DR', range: [3, 10] },
    { key: 'startMana', name: '+{v} Starting Mana', range: [5, 15] },
];
```

**Helm affixes:**
```javascript
var HELM_AFFIXES = [
    { key: 'flatHp', name: '+{v} HP', range: [30, 150] },
    { key: 'hpPct', name: '+{v}% HP', range: [3, 10] },
    { key: 'dr', name: '+{v}% DR', range: [2, 8] },
    { key: 'tenacity', name: '+{v}% Tenacity', range: [3, 12] },
    { key: 'elemResist', name: '+{v}% Element Resist', range: [3, 10] },
    { key: 'startMana', name: '+{v} Starting Mana', range: [5, 12] },
    { key: 'abilityDmg', name: '+{v}% Ability Damage', range: [3, 8] },
];
```

**Chest affixes:**
```javascript
var CHEST_AFFIXES = [
    { key: 'flatHp', name: '+{v} HP', range: [50, 200] },
    { key: 'hpPct', name: '+{v}% HP', range: [4, 12] },
    { key: 'dr', name: '+{v}% DR', range: [3, 10] },
    { key: 'flatAtk', name: '+{v} ATK', range: [2, 8] },
    { key: 'healPower', name: '+{v}% Heal Power', range: [3, 10] },
    { key: 'regenPct', name: '+{v}% HP Regen/s', range: [0.3, 1.0] },
];
```

**Gauntlet affixes:**
```javascript
var GAUNTLET_AFFIXES = [
    { key: 'flatAtk', name: '+{v} ATK', range: [3, 12] },
    { key: 'atkPct', name: '+{v}% ATK', range: [3, 8] },
    { key: 'critChance', name: '+{v}% Crit Chance', range: [3, 10] },
    { key: 'atkSpeed', name: '-{v}s ATK Speed', range: [0.02, 0.06] },
    { key: 'lifesteal', name: '+{v}% Lifesteal', range: [2, 6] },
    { key: 'onHitDmg', name: '+{v} On-Hit Damage', range: [3, 15] },
    { key: 'manaPerHit', name: '+{v} Mana per Hit', range: [1, 5] },
];
```

**Boot affixes:**
```javascript
var BOOT_AFFIXES = [
    { key: 'atkSpeed', name: '-{v}s ATK Speed', range: [0.02, 0.08] },
    { key: 'moveSpeed', name: '+{v}% Move Speed', range: [5, 15] },
    { key: 'dodge', name: '+{v}% Dodge', range: [3, 10] },
    { key: 'tenacity', name: '+{v}% Tenacity', range: [3, 10] },
    { key: 'startMana', name: '+{v} Starting Mana', range: [5, 12] },
    { key: 'flatHp', name: '+{v} HP', range: [20, 80] },
    { key: 'slowImmune', name: 'Slow Immunity', range: [1, 1], isBinary: true, minRarity: 'rare' },
];
```

**Shield/Off-hand affixes:**
```javascript
var OFFHAND_AFFIXES = [
    { key: 'flatHp', name: '+{v} HP', range: [30, 150] },
    { key: 'dr', name: '+{v}% DR', range: [2, 8] },
    { key: 'startShield', name: '+{v} Shield at Start', range: [30, 120] },
    { key: 'healPower', name: '+{v}% Heal Power', range: [5, 15] },
    { key: 'abilityDmg', name: '+{v}% Ability Damage', range: [3, 8] },
    { key: 'startMana', name: '+{v} Starting Mana', range: [5, 12] },
    { key: 'tauntDuration', name: '+{v}s Taunt Duration', range: [0.5, 1.5] },
];
```

**Accessory affixes** (broadest pool — any stat):
```javascript
var ACCESSORY_AFFIXES = [
    { key: 'flatHp', name: '+{v} HP', range: [30, 120] },
    { key: 'flatAtk', name: '+{v} ATK', range: [3, 12] },
    { key: 'atkSpeed', name: '-{v}s ATK Speed', range: [0.02, 0.06] },
    { key: 'critChance', name: '+{v}% Crit Chance', range: [3, 8] },
    { key: 'dr', name: '+{v}% DR', range: [2, 6] },
    { key: 'startMana', name: '+{v} Starting Mana', range: [5, 12] },
    { key: 'tenacity', name: '+{v}% Tenacity', range: [3, 8] },
    { key: 'healPower', name: '+{v}% Heal Power', range: [3, 8] },
    { key: 'elemResist', name: '+{v}% Element Resist', range: [3, 8] },
    { key: 'allStatsPct', name: '+{v}% All Stats', range: [1, 4] },
];
```

### Affix Value Rolling
Each affix value is rolled uniformly within its range, then scaled by rarity:
```javascript
var AFFIX_RARITY_SCALING = { common: 0, uncommon: 0.6, rare: 0.8, epic: 1.0, legendary: 1.0 };
// Uncommon affixes roll at 60% of the range, Rare at 80%, Epic/Legendary at 100%
// Legendary gets more affixes (3 vs 2) instead of higher per-affix values
```

---

## 5. Passive Effects

### Minor Passives (Epic rarity)
Each item line has a defined minor passive that activates at Epic rarity.

**Weapon minor passives:**
| Item Line | Minor Passive |
|-----------|--------------|
| Sword | Attacks deal +8% bonus damage to the current target per consecutive hit (resets on target switch, max 24%) |
| Bow | +10% damage to targets more than 3 cells away |
| Staff | Abilities deal +10% damage |
| Axe | +12% crit damage |
| Daggers | Every 4th attack deals +25% damage |
| Hammer | Attacks reduce target DR by 4% for 3s (stacks to 12%) |

**Helm minor passives:**
| Item Line | Minor Passive |
|-----------|--------------|
| Leather Cap | +5% dodge chance |
| Iron Helm | Take 8% less damage from abilities |
| Mage's Circlet | +8% ability damage |
| Warden's Visor | First CC received per combat: -50% duration |
| Crown of Thorns | Reflect 4% of damage taken |

*(Similar tables for all slots — each item line has exactly 1 defined minor passive.)*

### Major Passives (Legendary rarity)
Legendary items get the minor passive PLUS a major passive. These are the chase effects.

**Weapon major passives:**
| Item Line | Major Passive |
|-----------|--------------|
| Sword | "Blade Storm" — Every 8th attack, slash all adjacent enemies for 60% ATK |
| Bow | "Sniper's Mark" — Attacks mark target; marked targets take +12% damage from all sources for 3s |
| Staff | "Echo Cast" — 20% chance for abilities to fire a second time at 40% power |
| Axe | "Executioner" — Kills cause target to explode, dealing 25% of their max HP to nearby enemies |
| Daggers | "Shadow Strike" — Every 6th attack, teleport behind target and deal 80% ATK (ignores DR) |
| Hammer | "Shockwave" — Every 5th attack sends a shockwave dealing 40% ATK in a line and stunning 0.5s |

*(Similar tables for all slots.)*

### Passive Config (for easy tuning)
```javascript
var PASSIVE_CONFIG = {
    weapons: {
        sword: {
            minor: { key: 'consecutiveHitBonus', bonusPct: 0.08, maxStacks: 3 },
            major: { key: 'bladeStorm', everyN: 8, damagePct: 0.60, aoeRadius: 1 }
        },
        bow: {
            minor: { key: 'longRangeBonus', bonusPct: 0.10, rangeThreshold: 3 },
            major: { key: 'sniperMark', dmgAmp: 0.12, duration: 3 }
        },
        // ... etc
    },
    // ... other slots
};
```

---

## 6. Item Lines — Full Catalog

### Weapons (6 lines)
| Key | T1 Name | T2 Name | T3 Name | T4 Name | T5 Name | Identity |
|-----|---------|---------|---------|---------|---------|----------|
| sword | Iron Sword | Steel Sword | Mithril Sword | Adamant Sword | Celestial Blade | Balanced melee |
| bow | Hunting Bow | Composite Bow | Windcarver Bow | Dragonbone Bow | Astral Longbow | Ranged attacker |
| staff | Arcane Staff | Runic Staff | Leyline Staff | Voidtouched Staff | Staff of Eternity | Ability power |
| axe | War Axe | Battle Axe | Executioner's Axe | Doomcleaver | World Splitter | Crit/burst |
| daggers | Twin Daggers | Shadow Blades | Venom Fangs | Eclipse Daggers | Oblivion's Edge | Attack speed |
| hammer | Warhammer | Maul of Ruin | Seismic Hammer | Titan's Maul | Godforge Hammer | Tank offense |

### Helms (5 lines)
| Key | T1 | T2 | T3 | T4 | T5 | Identity |
|-----|----|----|----|----|-----|----------|
| leather_cap | Leather Cap | Hardened Cap | Reinforced Hood | Shadow Cowl | Phantom Crown | Light defense |
| iron_helm | Iron Helm | Steel Helm | Mithril Helm | Adamant Helm | Celestial Helm | Heavy defense |
| circlet | Mage's Circlet | Runic Circlet | Leyline Circlet | Void Circlet | Crown of Stars | Mana utility |
| visor | Warden's Visor | Guardian Visor | Bastion Visor | Fortress Visor | Eternal Visor | CC resistance |
| thorn_crown | Crown of Thorns | Crown of Barbs | Crown of Spikes | Crown of Agony | Crown of Vengeance | Retaliation |

### Chest Armor (5 lines)
| Key | T1 | T2 | T3 | T4 | T5 | Identity |
|-----|----|----|----|----|-----|----------|
| leather_vest | Leather Vest | Studded Vest | Reinforced Vest | Shadow Vest | Phantom Weave | Light armor |
| chainmail | Chain Mail | Heavy Mail | Mithril Mail | Adamant Mail | Celestial Aegis | Heavy armor |
| robe | Mage's Robe | Enchanted Robe | Arcane Robe | Void Robe | Robe of Eternity | Ability support |
| harness | Battle Harness | War Harness | Commander's Harness | Champion's Harness | Warlord's Harness | Aggressive |
| vestment | Healer's Vestment | Blessed Vestment | Sacred Vestment | Divine Vestment | Celestial Vestment | Healing boost |

### Gauntlets (5 lines)
| Key | T1 | T2 | T3 | T4 | T5 | Identity |
|-----|----|----|----|----|-----|----------|
| leather_gloves | Leather Gloves | Studded Gloves | Reinforced Gloves | Shadow Gloves | Phantom Grips | Balanced |
| spiked | Spiked Gauntlets | Razored Gauntlets | Serrated Gauntlets | Cruel Gauntlets | Devastator Grips | On-hit |
| mana_gauntlets | Mana Gauntlets | Channeling Gauntlets | Leyline Gauntlets | Void Gauntlets | Eternity Gauntlets | Mana gen |
| bloodstained | Bloodstained Claws | Crimson Claws | Gore Claws | Abyssal Claws | Soulreaver Claws | Lifesteal |
| swift_bracers | Swift Bracers | Haste Bracers | Windweave Bracers | Stormweave Bracers | Lightspeed Bracers | Speed |

### Boots (5 lines)
| Key | T1 | T2 | T3 | T4 | T5 | Identity |
|-----|----|----|----|----|-----|----------|
| leather_boots | Leather Boots | Sturdy Boots | Reinforced Boots | Shadow Boots | Phantom Striders | Basic speed |
| windwalker | Windwalker Boots | Galeforce Boots | Stormstride Boots | Cyclone Boots | Voidwalker Boots | Dodge/speed |
| ironclad | Ironclad Treads | Fortified Treads | Adamant Treads | Titan Treads | Immovable Treads | Tank speed |
| arcane_slippers | Arcane Slippers | Runic Slippers | Leyline Slippers | Void Slippers | Eternity Steps | Mana speed |
| stalker_steps | Stalker's Steps | Shadow Steps | Phantom Steps | Eclipse Steps | Oblivion Steps | Assassin |

### Shield / Off-hand (5 lines)
| Key | T1 | T2 | T3 | T4 | T5 | Identity |
|-----|----|----|----|----|-----|----------|
| wooden_shield | Wooden Shield | Iron Shield | Mithril Shield | Adamant Shield | Celestial Ward | Basic tank |
| tower_shield | Tower Shield | Fortress Shield | Bastion Shield | Citadel Shield | Eternal Bulwark | Heavy defense |
| spell_tome | Spell Tome | Runic Tome | Arcane Grimoire | Void Grimoire | Tome of Ages | Support caster |
| ward_stone | Ward Stone | Barrier Stone | Aegis Stone | Nullifier Stone | Infinity Stone | Starting shield |
| healing_orb | Healing Orb | Blessed Orb | Sacred Orb | Divine Orb | Orb of Life | Healer focus |

### Accessories (8 lines)
| Key | T1 | T2 | T3 | T4 | T5 | Identity |
|-----|----|----|----|----|-----|----------|
| ruby_ring | Ruby Ring | Ruby Band | Ruby Signet | Ruby Crown Ring | Heart of Fire | HP stacking |
| sapphire_pendant | Sapphire Pendant | Sapphire Chain | Sapphire Amulet | Sapphire Choker | Soul of Ice | ATK stacking |
| emerald_brooch | Emerald Brooch | Emerald Clasp | Emerald Medallion | Emerald Crest | Shield of Earth | DR stacking |
| topaz_band | Topaz Band | Topaz Ring | Topaz Circlet | Topaz Crown | Storm's Eye | Speed |
| diamond_pin | Diamond Pin | Diamond Brooch | Diamond Pendant | Diamond Star | Star of Destiny | Crit |
| amethyst_charm | Amethyst Charm | Amethyst Focus | Amethyst Orb | Amethyst Core | Void Heart | Mana |
| onyx_sigil | Onyx Sigil | Onyx Ward | Onyx Aegis | Onyx Bulwark | Unyielding Will | Tenacity |
| prismatic_locket | Prismatic Locket | Prismatic Chain | Prismatic Amulet | Prismatic Crown | Infinity Locket | Hybrid |

### Total: 39 item lines × 5 tiers × 5 rarities = 975 possible item variations
(But only ~39 unique item lines to define — the rest is math.)

---

## 7. Mythic Equipment (6 items)

Mythic items are unique. They don't roll rarity — they are always Mythic tier (red). One per slot archetype. Only 1 mythic per unit.

| Mythic | Slot | Stats | Unique Passive | Craft Source |
|--------|------|-------|----------------|-------------|
| **Infinity Gauntlet** | Gauntlets | +50 ATK | Abilities deal 50% bonus damage. Every 3rd cast hits ALL enemies. | Legendary Gauntlets + Dragon Scale + 250g |
| **Aegis of Immortality** | Shield | +600 HP, +15% DR | Revive at 60% HP, invulnerable 3s + taunt. Once per combat. | Legendary Shield + Dragon Scale + 250g |
| **Eclipse** | Weapon | +35 ATK | 20% lifesteal. Excess heals → shield (max 30% HP). While shielded, +15% dmg. | Legendary Weapon + Void Crystal + 250g |
| **Staff of Ages** | Weapon | +45 ATK, +20 Start Mana | Ability damage permanently +3% per cast (no cap). | Legendary Weapon + Void Crystal + 250g |
| **Worldbreaker** | Weapon | +30 ATK, -0.15s AtkSpd | On kill: +15% ATK/AS for 8s (5x max). At 5 stacks, splash. | Legendary Weapon + World Shard + 250g |
| **Crown of Ages** | Helm | +40 Start Mana | After casting, next ability costs 0 mana (12s CD). While on CD, +15% DR. | Legendary Helm + World Shard + 250g |

---

## 8. Drop System

### Region Drop Tiers
```javascript
var REGION_DROP_CONFIG = {
    // Each region defines which tiers can drop and at what weight
    1: { tiers: { 1: 100 } },                         // R1: T1 only
    2: { tiers: { 1: 70, 2: 30 } },                   // R2: mostly T1, some T2
    3: { tiers: { 1: 20, 2: 70, 3: 10 } },            // R3: mostly T2
    4: { tiers: { 2: 50, 3: 50 } },                   // R4: T2-T3
    5: { tiers: { 2: 15, 3: 70, 4: 15 } },            // R5: mostly T3
    6: { tiers: { 3: 40, 4: 60 } },                   // R6: T3-T4
    7: { tiers: { 3: 10, 4: 70, 5: 20 } },            // R7: mostly T4
    8: { tiers: { 4: 30, 5: 70 } },                   // R8: T4-T5
};
```

### Rarity Weights by Region (luck scaling)
Higher regions have better rarity chances:
```javascript
var REGION_RARITY_BONUS = {
    // Additive bonus to legendary/epic weights per region
    1: { legendary: 0, epic: 0 },
    2: { legendary: 0, epic: 1 },
    3: { legendary: 0.5, epic: 2 },
    4: { legendary: 0.5, epic: 3 },
    5: { legendary: 1.0, epic: 4 },
    6: { legendary: 1.5, epic: 5 },
    7: { legendary: 2.0, epic: 6 },
    8: { legendary: 3.0, epic: 8 },
};
// R8: Legendary weight = 1.5 + 3.0 = 4.5%, Epic = 5.5 + 8 = 13.5%
```

### Boss Drop Bonuses
- Boss kills guarantee +1 rarity tier on the drop (Common → Uncommon minimum)
- Region bosses additionally drop 1 guaranteed slot-specific item matching the boss's combat style

### Drops per Mission
```javascript
var DROP_CONFIG = {
    dropsPerMission: 1,           // Base drops per mission
    bonusDropOn3Star: 1,          // Extra drop for 3-star rating
    bossExtraDrop: 1,             // Boss missions give +1 drop
    gemDropChance: 0.15,          // 15% chance per mission for a gem drop (scales with region)
    materialDropChance: 0.25,     // 25% chance for upgrade material
};
```

---

## 9. Equipment Enhancement (Kept)

Same as current system. Applied to any equipment Uncommon rarity or higher.

```javascript
var ENHANCEMENT_CONFIG = {
    maxLevel: 10,
    costs: [20, 30, 50, 80, 120, 180, 250, 350, 500, 750],
    successRates: [1.0, 1.0, 1.0, 0.9, 0.8, 0.7, 0.55, 0.4, 0.25, 0.15],
    failurePenalty: [0, 0, 0, 0, 0, -1, -1, -2, -2, -2], // levels lost on failure (0=stay)
    statBonusPct: [0.05, 0.10, 0.15, 0.22, 0.30, 0.40, 0.52, 0.66, 0.82, 1.00],
    pityThreshold: 3,  // consecutive failures at same level = guaranteed success
    mythicCostMult: 1.5,
};
```

---

## 10. Gem Socket System (Kept)

Socket count per rarity:
```javascript
var SOCKET_CONFIG = {
    socketsPerRarity: { common: 0, uncommon: 0, rare: 1, epic: 1, legendary: 2, mythic: 2 },
    gemTypes: ['ruby', 'sapphire', 'emerald', 'topaz', 'diamond', 'amethyst', 'opal', 'onyx', 'prismatic'],
    gemRarities: ['standard', 'uncommon', 'rare', 'epic'],
    combineCost: 15,    // gold to combine 3 gems
    removeCost: 10,     // gold to remove a socketed gem
};
```

---

## 11. Forge Operations (Updated)

| Operation | Forge Level | Cost | Description |
|-----------|------------|------|-------------|
| **Salvage** | 1+ | Free | Break equipment into scraps of its tier + return gems |
| **Enhance** | 1+ | 20-750g | Increase equipment stats (+0 to +10) |
| **Reforge Affixes** | 3+ | 40g | Reroll all bonus affixes on an item (keeps rarity, tier, passive) |
| **Gem Combine** | 3+ | 15g | 3 same gems → 1 higher rarity |
| **Set Infuse** | 4+ | 50g + Essence | Add set tag to Epic+ equipment |
| **Set Cleanse** | 4+ | 25g | Remove set tag (essence lost) |
| **Mythic Forge** | 5 | 250g + mat | Legendary equip + Mythic Material → Mythic |

**Reforge Affixes** is the key new operation — lets players re-roll bad affixes while keeping the item's base line, tier, rarity, and passive. This is the primary gold sink for min-maxing.

---

## 12. Equipment Sets (4 elemental sets)

Set infusion works on Epic+ rarity items. An infused item gains a set tag and bonus stats.

| Set | Element | Required Slots | 2pc Bonus | 3pc Bonus |
|-----|---------|---------------|-----------|-----------|
| Inferno | Fire | Weapon, Helm, Chest | +15% ATK, fire allies +8% ATK | +25% ATK, fire allies +15% ATK, attacks burn |
| Tidal | Water | Weapon, Shield, Boots | +10% HP, water allies +8% HP | +20% HP, water allies +15% HP, 1% regen |
| Gaia | Earth | Gauntlets, Shield, Chest | +10% DR, earth allies +8% DR | +18% DR, earth allies +15% DR, +150 shield |
| Tempest | Wind | Weapon, Boots, Accessory | +15% ATK Spd, wind allies +10% ATK Spd | +25% ATK Spd, wind allies +20% ATK Spd, +10% dodge |

---

## 13. Hero Interaction

- Equipment slots are LOCKED on units without a hero
- When a hero is equipped, all 8 slots unlock
- When a hero is unequipped, all equipment returns to inventory
- Each hero has 1-2 preferred slots with +15% bonus stats (see HERO-SYSTEM-DESIGN.md for assignments)

---

## 14. Save Data Structure

```javascript
saveData.equipment = {
    inventory: [
        {
            id: "abc123",
            slot: "weapon",
            itemKey: "sword",           // item line
            tier: 3,                    // 1-5
            rarity: "epic",             // common/uncommon/rare/epic/legendary
            enhanceLevel: 7,
            gems: ["ruby_rare", null],
            affixes: [
                { key: "critChance", value: 8.5 },
                { key: "atkSpeed", value: 0.04 }
            ],
            setId: null,                // "inferno" if infused
            equipped: { unitId: "unit_01", heroId: "hero_kael" }  // or null
        }
    ],
    materials: {
        commonScraps: 0, uncommonScraps: 0, rareScraps: 0, epicScraps: 0,
        oreShards: 0, refinedOre: 0, elementalDust: 0, prismaticShards: 0
    },
    mythicMaterials: { dragon_scale: 0, void_crystal: 0, world_shard: 0 },
    essences: { fire: 0, water: 0, earth: 0, wind: 0, arcane: 0 },
    codex: { discovered: {} },
    slotFocus: { slot: null, remaining: 0 }
};
```

---

## 15. Migration Notes

The entire old item system (components, recipes, bench) is replaced. Migration converts existing items to equivalent new equipment based on their power level. Enhancement levels and gems are preserved. See Section 13 of the previous draft for detailed migration strategy.

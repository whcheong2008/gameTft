# Prompt 30: Item System Rework — RPG Equipment Slots + Diablo-Style Loot

**Status**: Implementation prompt
**Depends on**: Prompt 29 (hero system) + PROGRESSION-REWORK.md (VE costs/region unlock map)
**Target file**: `/js/items.js` (full replacement)
**Pattern**: All `var`, global scope, NO ES modules
**Scope**: This is a LARGE rework. Recommend splitting into 2 sub-prompts if needed:
- **30a**: Item data + generation + drops + save migration
- **30b**: UI + Echo Shaping + hero gating + load/test

---

## Overview

Replace the current component/recipe item system with **RPG equipment slots** and **Diablo-style two-axis loot** (Tier × Rarity with random affixes). This rework is the core of the item progression system. Items can ONLY be equipped on hero-equipped units (enforced by the hero system). Equipment drops from stages and scales with region tier.

**Key deliverables**:
1. 8 equipment slots per unit (Weapon, Armor, Helmet, Boots, Gloves, Accessory 1, Accessory 2, Trinket)
2. Two-axis loot: Tier (region-gated) × Rarity (RNG) → random affixes + passives at Epic/Legendary
3. Item generation: slot-specific affix pools, random rolling with rarity scaling
4. Enhancement system: +0 to +10 with pity counter and success rates (kept from current)
5. Gem sockets: 0-2 sockets per item based on rarity (kept from current)
6. Echo Shaping: Reroll/Disassemble/Upgrade Rarity/Transmute (replaces old Forge operations for items)
7. Stage drops: 0-2 items per mission based on star rating, tier by region, rarity distribution
8. Hero gating: Equipment UI locked on non-hero units (equipment slots grayed out)
9. Mythic items: 6 unique items with red rarity, special passives, craftable via special recipe
10. Save migration: Old component/recipe items converted to VE (refunded) since they don't map to new system

---

## Part 1: Item Data Structures & Configuration

### 1.1 Tier & Rarity Config

```javascript
// ---- Tier Config (region-gated, deterministic progression) ----

var TIER_CONFIG = {
    statMultipliers: [1.0, 1.5, 2.17, 3.0, 4.0]  // T1=idx0 … T5=idx4
    // Index 0 = T1, Index 4 = T5
};

// ---- Rarity Config (RNG per drop) ----

var RARITY_CONFIG = {
    tiers: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'],
    colors: {
        common: '#ffffff',
        uncommon: '#4ade80',
        rare: '#60a5fa',
        epic: '#c084fc',
        legendary: '#fb923c',
        mythic: '#ff4500'
    },
    statMultipliers: { common: 1.0, uncommon: 1.2, rare: 1.5, epic: 1.8, legendary: 2.2, mythic: 2.8 },
    affixCount: { common: 0, uncommon: 1, rare: 2, epic: 2, legendary: 3, mythic: 3 },
    hasMinorPassive: { common: false, uncommon: false, rare: false, epic: true, legendary: true, mythic: true },
    hasMajorPassive: { common: false, uncommon: false, rare: false, epic: false, legendary: true, mythic: true },
    dropWeights: {
        // Base weights — modified by region and luck bonuses
        common: 50,
        uncommon: 30,
        rare: 13,
        epic: 5.5,
        legendary: 1.5,
        mythic: 0
        // mythic weight = 0 normally (craftable only)
    }
};

var AFFIX_RARITY_SCALING = {
    common: 0, uncommon: 0.6, rare: 0.8, epic: 1.0, legendary: 1.0, mythic: 1.0
    // Uncommon affixes roll at 60% of their range max, Rare at 80%, Epic+ at 100%
};

// ---- Region Drop Config ----

var REGION_DROP_CONFIG = {
    1: { tiers: { 1: 100 } },
    2: { tiers: { 1: 70, 2: 30 } },
    3: { tiers: { 1: 20, 2: 70, 3: 10 } },
    4: { tiers: { 2: 50, 3: 50 } },
    5: { tiers: { 2: 15, 3: 70, 4: 15 } },
    6: { tiers: { 3: 40, 4: 60 } },
    7: { tiers: { 3: 10, 4: 70, 5: 20 } },
    8: { tiers: { 4: 30, 5: 70 } }
};

var REGION_RARITY_BONUS = {
    // Additive bonus to legendary/epic weights per region
    1: { legendary: 0, epic: 0 },
    2: { legendary: 0, epic: 1 },
    3: { legendary: 0.5, epic: 2 },
    4: { legendary: 0.5, epic: 3 },
    5: { legendary: 1.0, epic: 4 },
    6: { legendary: 1.5, epic: 5 },
    7: { legendary: 2.0, epic: 6 },
    8: { legendary: 3.0, epic: 8 }
};

var DROP_CONFIG = {
    dropsPerMission: 1,           // Base drops per mission
    bonusDropOn3Star: 1,          // Extra drop for 3-star rating
    bossExtraDrop: 1,             // Boss missions give +1 drop
    gemDropChance: 0.15,          // 15% chance per mission for a gem drop
    materialDropChance: 0.25      // 25% chance for upgrade material
};
```

### 1.2 Equipment Slots & Display

```javascript
// ---- Equipment Slots (8 total) ----

var EQUIPMENT_SLOTS = [
    'weapon', 'helm', 'chest', 'gauntlets', 'boots', 'offhand',
    'accessory1', 'accessory2'
];

var SLOT_DISPLAY = {
    weapon: { name: 'Weapon', emoji: '⚔️', type: 'weapon' },
    helm: { name: 'Helm', emoji: '🪖', type: 'armor' },
    chest: { name: 'Chest Armor', emoji: '🛡️', type: 'armor' },
    gauntlets: { name: 'Gauntlets', emoji: '🥊', type: 'armor' },
    boots: { name: 'Boots', emoji: '👢', type: 'utility' },
    offhand: { name: 'Off-hand', emoji: '🔮', type: 'utility' },
    accessory1: { name: 'Accessory 1', emoji: '💍', type: 'accessory' },
    accessory2: { name: 'Accessory 2', emoji: '📿', type: 'accessory' }
};
```

### 1.3 Item Lines (39 lines)

Define ITEM_LINES with all 39 item lines from ITEMS-REDESIGN.md. Each line has:
- `slot`: which slot it fills
- `baseStats`: base stat object (e.g., `{ atk: 12 }` for weapons)
- `names`: tier-keyed names (e.g., `{ 1: 'Iron Sword', 2: 'Steel Sword', ... }`)
- `identity`: flavor/thematic description
- `minorPassive`: Epic-level passive (key, description, parameters)
- `majorPassive`: Legendary-level passive (key, description, parameters)

Example structure:
```javascript
var ITEM_LINES = {
    // === Weapons (6) ===
    sword: {
        slot: 'weapon',
        baseStats: { atk: 12 },
        identity: 'Balanced melee',
        names: {
            1: 'Iron Sword', 2: 'Steel Sword', 3: 'Mithril Sword',
            4: 'Adamant Sword', 5: 'Celestial Blade'
        },
        minorPassive: {
            key: 'consecutiveHitBonus',
            bonusPct: 0.08,
            maxStacks: 3,
            desc: '+8% damage per consecutive hit on same target (max 24%)'
        },
        majorPassive: {
            key: 'bladeStorm',
            everyN: 8,
            damagePct: 0.60,
            aoeRadius: 1,
            desc: 'Every 8th attack slashes adjacent enemies for 60% ATK'
        }
    },
    // ... (bow, staff, axe, daggers, hammer)

    // === Helms (5) ===
    leather_cap: {
        slot: 'helm',
        baseStats: { hp: 80 },
        identity: 'Light defense',
        names: { /* ... */ },
        minorPassive: { /* ... */ },
        majorPassive: { /* ... */ }
    },
    // ... (iron_helm, circlet, visor, thorn_crown)

    // === Chest Armor (5) ===
    // ... (leather_vest, chainmail, robe, harness, vestment)

    // === Gauntlets (5) ===
    // ... (leather_gloves, spiked, mana_gauntlets, bloodstained, swift_bracers)

    // === Boots (5) ===
    // ... (leather_boots, windwalker, ironclad, arcane_slippers, stalker_steps)

    // === Off-hand (5) ===
    // ... (wooden_shield, tower_shield, spell_tome, ward_stone, healing_orb)

    // === Accessories (8) ===
    // ... (ruby_ring, sapphire_pendant, emerald_brooch, topaz_band, diamond_pin, amethyst_charm, onyx_sigil, prismatic_locket)
};
```

**Full item line definitions must be pulled from ITEMS-REDESIGN.md § 6. Include all 39 lines with complete stat/passive data.**

### 1.4 Affix Pools (Slot-Specific)

Define all 8 affix pools:

```javascript
var WEAPON_AFFIXES = [
    { key: 'flatAtk', name: '+{v} ATK', range: [3, 15] },
    { key: 'atkPct', name: '+{v}% ATK', range: [3, 10] },
    { key: 'critChance', name: '+{v}% Crit Chance', range: [3, 12] },
    { key: 'critDamage', name: '+{v}% Crit Damage', range: [5, 20] },
    { key: 'atkSpeed', name: '-{v}s ATK Speed', range: [0.02, 0.08] },
    { key: 'lifesteal', name: '+{v}% Lifesteal', range: [2, 8] },
    { key: 'armorPen', name: 'Ignore {v}% DR', range: [3, 10] },
    { key: 'startMana', name: '+{v} Starting Mana', range: [5, 15] }
];

var HELM_AFFIXES = [
    { key: 'flatHp', name: '+{v} HP', range: [30, 150] },
    { key: 'hpPct', name: '+{v}% HP', range: [3, 10] },
    { key: 'dr', name: '+{v}% DR', range: [2, 8] },
    { key: 'tenacity', name: '+{v}% Tenacity', range: [3, 12] },
    { key: 'elemResist', name: '+{v}% Element Resist', range: [3, 10] },
    { key: 'startMana', name: '+{v} Starting Mana', range: [5, 12] },
    { key: 'abilityDmg', name: '+{v}% Ability Damage', range: [3, 8] }
];

var CHEST_AFFIXES = [
    { key: 'flatHp', name: '+{v} HP', range: [50, 200] },
    { key: 'hpPct', name: '+{v}% HP', range: [4, 12] },
    { key: 'dr', name: '+{v}% DR', range: [3, 10] },
    { key: 'flatAtk', name: '+{v} ATK', range: [2, 8] },
    { key: 'healPower', name: '+{v}% Heal Power', range: [3, 10] },
    { key: 'regenPct', name: '+{v}% HP Regen/s', range: [0.3, 1.0] }
];

var GAUNTLET_AFFIXES = [
    { key: 'flatAtk', name: '+{v} ATK', range: [3, 12] },
    { key: 'atkPct', name: '+{v}% ATK', range: [3, 8] },
    { key: 'critChance', name: '+{v}% Crit Chance', range: [3, 10] },
    { key: 'atkSpeed', name: '-{v}s ATK Speed', range: [0.02, 0.06] },
    { key: 'lifesteal', name: '+{v}% Lifesteal', range: [2, 6] },
    { key: 'onHitDmg', name: '+{v} On-Hit Damage', range: [3, 15] },
    { key: 'manaPerHit', name: '+{v} Mana per Hit', range: [1, 5] }
];

var BOOT_AFFIXES = [
    { key: 'atkSpeed', name: '-{v}s ATK Speed', range: [0.02, 0.08] },
    { key: 'moveSpeed', name: '+{v}% Move Speed', range: [5, 15] },
    { key: 'dodge', name: '+{v}% Dodge', range: [3, 10] },
    { key: 'tenacity', name: '+{v}% Tenacity', range: [3, 10] },
    { key: 'startMana', name: '+{v} Starting Mana', range: [5, 12] },
    { key: 'flatHp', name: '+{v} HP', range: [20, 80] },
    { key: 'slowImmune', name: 'Slow Immunity', range: [1, 1], isBinary: true, minRarity: 'rare' }
];

var OFFHAND_AFFIXES = [
    { key: 'flatHp', name: '+{v} HP', range: [30, 150] },
    { key: 'dr', name: '+{v}% DR', range: [2, 8] },
    { key: 'startShield', name: '+{v} Shield at Start', range: [30, 120] },
    { key: 'healPower', name: '+{v}% Heal Power', range: [5, 15] },
    { key: 'abilityDmg', name: '+{v}% Ability Damage', range: [3, 8] },
    { key: 'startMana', name: '+{v} Starting Mana', range: [5, 12] },
    { key: 'tauntDuration', name: '+{v}s Taunt Duration', range: [0.5, 1.5] }
];

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
    { key: 'allStatsPct', name: '+{v}% All Stats', range: [1, 4] }
];

var SLOT_AFFIXES = {
    weapon: WEAPON_AFFIXES,
    helm: HELM_AFFIXES,
    chest: CHEST_AFFIXES,
    gauntlets: GAUNTLET_AFFIXES,
    boots: BOOT_AFFIXES,
    offhand: OFFHAND_AFFIXES,
    accessory1: ACCESSORY_AFFIXES,
    accessory2: ACCESSORY_AFFIXES
};
```

### 1.5 Enhancement Config (Kept from current)

```javascript
var ENHANCEMENT_CONFIG = {
    maxLevel: 10,
    costs: [20, 30, 50, 80, 120, 180, 250, 350, 500, 750],
    successRates: [1.0, 1.0, 1.0, 0.9, 0.8, 0.7, 0.55, 0.4, 0.25, 0.15],
    failurePenalty: [0, 0, 0, 0, 0, -1, -1, -2, -2, -2],
    statBonusPct: [0.05, 0.10, 0.15, 0.22, 0.30, 0.40, 0.52, 0.66, 0.82, 1.00],
    pityThreshold: 3,
    mythicCostMult: 1.5
};
```

### 1.6 Socket Config (Kept from current)

```javascript
var SOCKET_CONFIG = {
    socketsPerRarity: { common: 0, uncommon: 0, rare: 1, epic: 1, legendary: 2, mythic: 2 },
    gemTypes: ['ruby', 'sapphire', 'emerald', 'topaz', 'diamond', 'amethyst', 'opal', 'onyx', 'prismatic'],
    gemRarities: ['standard', 'uncommon', 'rare', 'epic'],
    combineCost: 15,
    removeCost: 10
};
```

### 1.7 Mythic Items (6 items)

```javascript
var MYTHIC_ITEMS = {
    infinity_gauntlet: {
        slot: 'gauntlets',
        name: 'Infinity Gauntlet',
        baseStats: { atk: 50 },
        majorPassive: {
            key: 'infinityPower',
            desc: 'Abilities deal 50% bonus damage. Every 3rd cast hits ALL enemies.'
        },
        craftSource: {
            baseItem: 'legendary_gauntlets',
            materials: ['dragon_scale'],
            materialCount: 1,
            goldCost: 250
        }
    },
    aegis_of_immortality: {
        slot: 'offhand',
        name: 'Aegis of Immortality',
        baseStats: { hp: 600, dr: 0.15 },
        majorPassive: {
            key: 'immortalAegis',
            desc: 'Revive at 60% HP, invulnerable 3s + taunt. Once per combat.'
        },
        craftSource: {
            baseItem: 'legendary_shield',
            materials: ['dragon_scale'],
            materialCount: 1,
            goldCost: 250
        }
    },
    eclipse: {
        slot: 'weapon',
        name: 'Eclipse',
        baseStats: { atk: 35 },
        majorPassive: {
            key: 'eclipsePower',
            desc: '20% lifesteal. Excess heals → shield (max 30% HP). While shielded, +15% dmg.'
        },
        craftSource: {
            baseItem: 'legendary_weapon',
            materials: ['void_crystal'],
            materialCount: 1,
            goldCost: 250
        }
    },
    staff_of_ages: {
        slot: 'weapon',
        name: 'Staff of Ages',
        baseStats: { atk: 45, startMana: 20 },
        majorPassive: {
            key: 'staffOfAges',
            desc: 'Ability damage permanently +3% per cast (no cap).'
        },
        craftSource: {
            baseItem: 'legendary_weapon',
            materials: ['void_crystal'],
            materialCount: 1,
            goldCost: 250
        }
    },
    worldbreaker: {
        slot: 'weapon',
        name: 'Worldbreaker',
        baseStats: { atk: 30, atkSpeed: -0.15 },
        majorPassive: {
            key: 'worldbreaker',
            desc: 'On kill: +15% ATK/AS for 8s (5x max). At 5 stacks, splash.'
        },
        craftSource: {
            baseItem: 'legendary_weapon',
            materials: ['world_shard'],
            materialCount: 1,
            goldCost: 250
        }
    },
    crown_of_ages: {
        slot: 'helm',
        name: 'Crown of Ages',
        baseStats: { startMana: 40 },
        majorPassive: {
            key: 'crownOfAges',
            desc: 'After casting, next ability costs 0 mana (12s CD). While on CD, +15% DR.'
        },
        craftSource: {
            baseItem: 'legendary_helm',
            materials: ['world_shard'],
            materialCount: 1,
            goldCost: 250
        }
    }
};

var MYTHIC_MATERIALS = {
    dragon_scale: { name: 'Dragon Scale', drops: ['R6+'] },
    void_crystal: { name: 'Void Crystal', drops: ['R7+'] },
    world_shard: { name: 'World Shard', drops: ['R8'] }
};
```

---

## Part 2: Item Generation Functions

### 2.1 Core Generation Function

```javascript
// ---- Generate a random item drop ----
// Returns: { id, slot, itemKey, tier, rarity, enhanceLevel, gems, affixes, setId, equipped, majorPassive, minorPassive }

function generateItem(region, starRating) {
    // Step 1: Roll tier (region-gated)
    var tierWeights = REGION_DROP_CONFIG[region].tiers;
    var tier = rollFromWeights(tierWeights);  // 1-5

    // Step 2: Roll rarity (RNG, modified by region bonus + star rating)
    var rarity = rollRarity(region, starRating);

    // Step 3: Roll slot (random from 8)
    var slot = EQUIPMENT_SLOTS[Math.floor(Math.random() * EQUIPMENT_SLOTS.length)];

    // Step 4: Determine item line from slot
    var itemLine = selectItemLineForSlot(slot, tier);

    // Step 5: Calculate base stats
    var baseStats = ITEM_LINES[itemLine].baseStats;
    var tierMult = TIER_CONFIG.statMultipliers[tier - 1];
    var rarityMult = RARITY_CONFIG.statMultipliers[rarity];
    var finalStats = scaleStats(baseStats, tierMult, rarityMult);

    // Step 6: Roll affixes based on rarity
    var affixes = rollAffixes(slot, rarity);

    // Step 7: Assign passives (Epic+ only)
    var minorPassive = null;
    var majorPassive = null;
    if (RARITY_CONFIG.hasMinorPassive[rarity]) {
        minorPassive = ITEM_LINES[itemLine].minorPassive;
    }
    if (RARITY_CONFIG.hasMajorPassive[rarity]) {
        majorPassive = ITEM_LINES[itemLine].majorPassive;
    }

    // Step 8: Determine gem sockets
    var socketCount = SOCKET_CONFIG.socketsPerRarity[rarity];
    var gems = new Array(socketCount).fill(null);

    // Step 9: Create item object
    var item = {
        id: generateItemId(),
        slot: slot,
        itemKey: itemLine,
        tier: tier,
        rarity: rarity,
        name: ITEM_LINES[itemLine].names[tier],
        baseStats: finalStats,
        affixes: affixes,
        enhanceLevel: 0,
        gems: gems,
        setId: null,
        minorPassive: minorPassive,
        majorPassive: majorPassive,
        equipped: null  // { unitId, heroId } or null
    };

    return item;
}

function rollRarity(region, starRating) {
    // Base weights
    var weights = { ...RARITY_CONFIG.dropWeights };

    // Add region bonus
    var bonus = REGION_RARITY_BONUS[region] || { legendary: 0, epic: 0 };
    weights.legendary += bonus.legendary;
    weights.epic += bonus.epic;

    // Modify by star rating (higher stars = better rarity)
    if (starRating >= 3) {
        weights.legendary *= 1.5;
        weights.epic *= 1.2;
    } else if (starRating === 2) {
        weights.epic *= 1.1;
    }

    return rollFromWeights(weights);
}

function rollAffixes(slot, rarity) {
    var affixPool = SLOT_AFFIXES[slot];
    var count = RARITY_CONFIG.affixCount[rarity] || 0;

    if (count === 0) return [];

    var affixes = [];
    var used = {};

    for (var i = 0; i < count; i++) {
        // Pick random affix that hasn't been used yet
        var affix;
        var attempts = 0;
        do {
            affix = affixPool[Math.floor(Math.random() * affixPool.length)];
            attempts++;
        } while (used[affix.key] && attempts < 10);

        if (used[affix.key]) continue;  // Skip if we can't find a unique one

        used[affix.key] = true;

        // Roll value within affix range
        var scaling = AFFIX_RARITY_SCALING[rarity];
        var min = affix.range[0];
        var max = affix.range[1];
        var value;

        if (affix.isBinary) {
            value = 1;
        } else {
            var range = max - min;
            value = min + (range * scaling) + (Math.random() * range * (1 - scaling));
            value = parseFloat(value.toFixed(2));
        }

        affixes.push({
            key: affix.key,
            name: affix.name.replace('{v}', value),
            value: value
        });
    }

    return affixes;
}

function scaleStats(baseStats, tierMult, rarityMult) {
    var scaled = {};
    for (var key in baseStats) {
        scaled[key] = baseStats[key] * tierMult * rarityMult;
    }
    return scaled;
}

function selectItemLineForSlot(slot, tier) {
    // Get all item lines for this slot
    var candidates = [];
    for (var key in ITEM_LINES) {
        if (ITEM_LINES[key].slot === slot) {
            candidates.push(key);
        }
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
}

function generateItemId() {
    return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
```

### 2.2 Utility Functions

```javascript
function rollFromWeights(weights) {
    // Supports: { 1: 100, 2: 50, 3: 25 } or { common: 50, uncommon: 30, rare: 15 }
    var total = 0;
    for (var key in weights) {
        total += weights[key];
    }

    var roll = Math.random() * total;
    var sum = 0;
    for (var key in weights) {
        sum += weights[key];
        if (roll <= sum) {
            return isNaN(key) ? key : parseInt(key);
        }
    }

    // Fallback (shouldn't happen)
    return Object.keys(weights)[0];
}

function formatItemStat(key, value) {
    // Format stat display (e.g., "atk: 15" → "+15 ATK")
    var name = {
        atk: 'ATK', hp: 'HP', dr: 'DR', atkSpeed: 'ATK Speed',
        critChance: 'Crit Chance', critDamage: 'Crit Damage'
    }[key] || key;

    if (typeof value === 'number') {
        if (value < 1) {
            return (value * 1000).toFixed(0) + ' ' + name;
        } else if (value < 10 && ['atkSpeed', 'dr'].includes(key)) {
            return (value * 1000).toFixed(0) + 'ms ' + name;
        } else {
            return value.toFixed(0) + ' ' + name;
        }
    }
    return value + ' ' + name;
}
```

---

## Part 3: Echo Shaping (Item Crafting)

Echo Shaping replaces the old Forge operations for items. It operates on items in the player's inventory.

```javascript
// ---- Echo Shaping Operations ----

function echoShapingReroll(itemId) {
    // Cost: 100 VE
    // Effect: Reroll all affixes on item (keep tier, rarity, slot, passive)

    var item = saveData.equipment.inventory.find(function(i) { return i.id === itemId; });
    if (!item) return { success: false, msg: 'Item not found' };
    if (item.rarity === 'common') return { success: false, msg: 'Common items have no affixes' };

    var cost = 100;  // VE cost
    if (saveData.veilEssence < cost) {
        return { success: false, msg: 'Not enough Veil Essence' };
    }

    saveData.veilEssence -= cost;
    item.affixes = rollAffixes(item.slot, item.rarity);

    return { success: true, msg: 'Affixes rerolled!' };
}

function echoShapingDisassemble(itemId) {
    // Cost: Free
    // Effect: Break item into VE + materials
    // Common → 50 VE
    // Uncommon → 100 VE
    // Rare → 200 VE
    // Epic → 500 VE
    // Legendary → 1,000 VE

    var item = saveData.equipment.inventory.find(function(i) { return i.id === itemId; });
    if (!item) return { success: false, msg: 'Item not found' };
    if (item.equipped) {
        return { success: false, msg: 'Cannot disassemble equipped item' };
    }

    var veValues = { common: 50, uncommon: 100, rare: 200, epic: 500, legendary: 1000, mythic: 2000 };
    var veGain = veValues[item.rarity] || 0;

    saveData.veilEssence += veGain;

    // Remove item from inventory
    var idx = saveData.equipment.inventory.indexOf(item);
    if (idx >= 0) {
        saveData.equipment.inventory.splice(idx, 1);
    }

    return { success: true, msg: 'Item disassembled for ' + veGain + ' VE' };
}

function echoShapingUpgradeRarity(itemId) {
    // Cost: Scales by target rarity
    // Common → Uncommon: 100 VE
    // Uncommon → Rare: 200 VE
    // Rare → Epic: 400 VE
    // Epic → Legendary: 800 VE

    var item = saveData.equipment.inventory.find(function(i) { return i.id === itemId; });
    if (!item) return { success: false, msg: 'Item not found' };
    if (item.rarity === 'legendary') return { success: false, msg: 'Already legendary' };
    if (item.rarity === 'mythic') return { success: false, msg: 'Mythic items cannot be upgraded' };

    var rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    var currentIdx = rarities.indexOf(item.rarity);
    var targetRarity = rarities[currentIdx + 1];

    var costs = { common: 100, uncommon: 200, rare: 400, epic: 800 };
    var cost = costs[item.rarity] || 0;

    if (saveData.veilEssence < cost) {
        return { success: false, msg: 'Not enough Veil Essence' };
    }

    saveData.veilEssence -= cost;

    // Upgrade rarity and recalculate everything
    item.rarity = targetRarity;
    item.baseStats = scaleStats(
        ITEM_LINES[item.itemKey].baseStats,
        TIER_CONFIG.statMultipliers[item.tier - 1],
        RARITY_CONFIG.statMultipliers[targetRarity]
    );

    // Add new affix if rarity now has more
    var oldCount = RARITY_CONFIG.affixCount[rarities[currentIdx]] || 0;
    var newCount = RARITY_CONFIG.affixCount[targetRarity] || 0;
    if (newCount > oldCount) {
        var newAffixes = rollAffixes(item.slot, targetRarity);
        item.affixes = newAffixes.slice(0, newCount);
    }

    // Add passive if this rarity now has one
    if (RARITY_CONFIG.hasMinorPassive[targetRarity] && !item.minorPassive) {
        item.minorPassive = ITEM_LINES[item.itemKey].minorPassive;
    }
    if (RARITY_CONFIG.hasMajorPassive[targetRarity] && !item.majorPassive) {
        item.majorPassive = ITEM_LINES[item.itemKey].majorPassive;
    }

    // Add socket if rarity grants one
    var oldSockets = SOCKET_CONFIG.socketsPerRarity[rarities[currentIdx]] || 0;
    var newSockets = SOCKET_CONFIG.socketsPerRarity[targetRarity] || 0;
    if (newSockets > oldSockets) {
        for (var i = oldSockets; i < newSockets; i++) {
            item.gems.push(null);
        }
    }

    return { success: true, msg: 'Item upgraded to ' + targetRarity + '!' };
}

function echoShapingTransmute(fromItemId, toSlot) {
    // Cost: 200 VE
    // Effect: Convert item slot to another slot
    // Keeps: tier, rarity, enhancement level, passives
    // Changes: slot, base stats, affixes (new ones for target slot)

    var item = saveData.equipment.inventory.find(function(i) { return i.id === fromItemId; });
    if (!item) return { success: false, msg: 'Item not found' };
    if (item.slot === toSlot) return { success: false, msg: 'Already in that slot' };
    if (item.equipped) {
        return { success: false, msg: 'Cannot transmute equipped item' };
    }

    var cost = 200;
    if (saveData.veilEssence < cost) {
        return { success: false, msg: 'Not enough Veil Essence' };
    }

    saveData.veilEssence -= cost;

    item.slot = toSlot;
    var newLine = selectItemLineForSlot(toSlot, item.tier);
    item.itemKey = newLine;
    item.name = ITEM_LINES[newLine].names[item.tier];

    // Recalculate base stats with new line
    item.baseStats = scaleStats(
        ITEM_LINES[newLine].baseStats,
        TIER_CONFIG.statMultipliers[item.tier - 1],
        RARITY_CONFIG.statMultipliers[item.rarity]
    );

    // Reroll affixes for new slot
    item.affixes = rollAffixes(toSlot, item.rarity);

    return { success: true, msg: 'Item transmuted to ' + toSlot + '!' };
}
```

---

## Part 4: Stage Drops & Rewards Integration

### 4.1 Generate Item Drops for Mission Rewards

Integrate with existing missions.js reward system:

```javascript
function generateMissionItemDrops(region, isBoss, starRating) {
    // Determine drop count
    var drops = DROP_CONFIG.dropsPerMission;
    if (starRating === 3) drops += DROP_CONFIG.bonusDropOn3Star;
    if (isBoss) drops += DROP_CONFIG.bossExtraDrop;

    var items = [];
    for (var i = 0; i < drops; i++) {
        var item = generateItem(region, starRating);
        items.push(item);
    }

    return items;
}

// Hook into existing reward system (in missions.js completion):
function addMissionRewards(mission, starRating) {
    // ... existing XP/VE code ...

    // Add item drops
    var items = generateMissionItemDrops(mission.region, mission.isBoss, starRating);
    for (var i = 0; i < items.length; i++) {
        saveData.equipment.inventory.push(items[i]);
    }

    // Show drops in mission results
    return { items: items, /* ... other rewards ... */ };
}
```

---

## Part 5: Equipment Management (Unit Level)

### 5.1 Equip/Unequip on Units

```javascript
function equipItem(itemId, unitId, heroId) {
    // Verify hero-gating: unit must have a hero
    var unit = saveData.units.find(function(u) { return u.id === unitId; });
    if (!unit) return { success: false, msg: 'Unit not found' };
    if (!unit.assignedHero || unit.assignedHero !== heroId) {
        return { success: false, msg: 'This unit does not have a hero assigned' };
    }

    var item = saveData.equipment.inventory.find(function(i) { return i.id === itemId; });
    if (!item) return { success: false, msg: 'Item not found' };

    // Check if slot is free or has existing item
    var existingItem = saveData.equipment.inventory.find(function(i) {
        return i.slot === item.slot && i.equipped && i.equipped.unitId === unitId;
    });

    if (existingItem) {
        // Unequip existing item first
        existingItem.equipped = null;
    }

    item.equipped = { unitId: unitId, heroId: heroId };

    return { success: true, msg: 'Item equipped!' };
}

function unequipItem(itemId) {
    var item = saveData.equipment.inventory.find(function(i) { return i.id === itemId; });
    if (!item) return { success: false, msg: 'Item not found' };
    if (!item.equipped) return { success: false, msg: 'Item not equipped' };

    item.equipped = null;

    return { success: true, msg: 'Item unequipped!' };
}

function getUnitEquipment(unitId) {
    // Returns equipped items for a unit, keyed by slot
    var equipped = {};

    EQUIPMENT_SLOTS.forEach(function(slot) {
        var item = saveData.equipment.inventory.find(function(i) {
            return i.equipped && i.equipped.unitId === unitId && i.slot === slot;
        });
        equipped[slot] = item || null;
    });

    return equipped;
}

function getUnitEquipmentStats(unitId) {
    // Sum all stats from equipped items
    var stats = { atk: 0, hp: 0, dr: 0, /* ... all stat keys ... */ };
    var equipped = getUnitEquipment(unitId);

    for (var slot in equipped) {
        var item = equipped[slot];
        if (item) {
            // Add base stats
            for (var key in item.baseStats) {
                stats[key] = (stats[key] || 0) + item.baseStats[key];
            }

            // Add affix stats
            item.affixes.forEach(function(affix) {
                stats[affix.key] = (stats[affix.key] || 0) + affix.value;
            });

            // Apply enhancement bonus
            if (item.enhanceLevel > 0) {
                var bonusMultiplier = 1 + ENHANCEMENT_CONFIG.statBonusPct[item.enhanceLevel - 1];
                for (var key in item.baseStats) {
                    stats[key] *= bonusMultiplier;
                }
            }
        }
    }

    return stats;
}
```

### 5.2 Enhancement System

```javascript
function enhanceItem(itemId) {
    // Cost: ENHANCEMENT_CONFIG.costs[currentLevel] VE

    var item = saveData.equipment.inventory.find(function(i) { return i.id === itemId; });
    if (!item) return { success: false, msg: 'Item not found' };
    if (item.rarity === 'common') {
        return { success: false, msg: 'Common items cannot be enhanced' };
    }
    if (item.enhanceLevel >= ENHANCEMENT_CONFIG.maxLevel) {
        return { success: false, msg: 'Already at max enhancement' };
    }

    var level = item.enhanceLevel;
    var cost = ENHANCEMENT_CONFIG.costs[level];
    var successRate = ENHANCEMENT_CONFIG.successRates[level];

    if (saveData.veilEssence < cost) {
        return { success: false, msg: 'Not enough Veil Essence' };
    }

    saveData.veilEssence -= cost;

    // Roll for success
    var rolled = Math.random();
    var succeeded = rolled < successRate;

    if (succeeded) {
        item.enhanceLevel += 1;
        item.enhancePity = 0;
        return { success: true, msg: 'Enhancement successful! Item is now +' + item.enhanceLevel };
    } else {
        // Failure
        var penalty = ENHANCEMENT_CONFIG.failurePenalty[level];
        if (penalty < 0) {
            item.enhanceLevel = Math.max(0, item.enhanceLevel + penalty);
        }

        item.enhancePity = (item.enhancePity || 0) + 1;

        // Pity: guaranteed success after N failures
        if (item.enhancePity >= ENHANCEMENT_CONFIG.pityThreshold) {
            item.enhanceLevel += 1;
            item.enhancePity = 0;
            return { success: false, msg: 'Enhancement failed, but pity triggered! Item is now +' + item.enhanceLevel };
        }

        return { success: false, msg: 'Enhancement failed! Penalty: ' + penalty + ' levels' };
    }
}
```

### 5.3 Gem Sockets

```javascript
function socketGem(itemId, socketIndex, gemType, gemRarity) {
    // gemType: 'ruby', 'sapphire', etc.
    // gemRarity: 'standard', 'uncommon', 'rare', 'epic'

    var item = saveData.equipment.inventory.find(function(i) { return i.id === itemId; });
    if (!item) return { success: false, msg: 'Item not found' };
    if (socketIndex >= item.gems.length) {
        return { success: false, msg: 'Socket does not exist' };
    }

    var gemId = gemType + '_' + gemRarity;

    // Deduct gem from inventory
    var gemCount = (saveData.equipment.gems[gemId] || 0);
    if (gemCount < 1) {
        return { success: false, msg: 'You don\'t have this gem' };
    }

    saveData.equipment.gems[gemId] -= 1;
    item.gems[socketIndex] = gemId;

    return { success: true, msg: 'Gem socketed!' };
}

function removeGem(itemId, socketIndex) {
    var item = saveData.equipment.inventory.find(function(i) { return i.id === itemId; });
    if (!item) return { success: false, msg: 'Item not found' };

    var gemId = item.gems[socketIndex];
    if (!gemId) return { success: false, msg: 'No gem in this socket' };

    var cost = SOCKET_CONFIG.removeCost;
    if (saveData.veilEssence < cost) {
        return { success: false, msg: 'Not enough Veil Essence' };
    }

    saveData.veilEssence -= cost;

    saveData.equipment.gems[gemId] = (saveData.equipment.gems[gemId] || 0) + 1;
    item.gems[socketIndex] = null;

    return { success: true, msg: 'Gem removed!' };
}
```

---

## Part 6: Save Data Structure

Update saveData format:

```javascript
// Initialize equipment section if missing
if (!saveData.equipment) {
    saveData.equipment = {
        inventory: [],  // All non-equipped items
        materials: {
            commonScraps: 0, uncommonScraps: 0, rareScraps: 0, epicScraps: 0,
            oreShards: 0, refinedOre: 0, elementalDust: 0, prismaticShards: 0
        },
        gems: {
            ruby_standard: 0, ruby_uncommon: 0, ruby_rare: 0, ruby_epic: 0,
            sapphire_standard: 0, sapphire_uncommon: 0, sapphire_rare: 0, sapphire_epic: 0,
            // ... all 9 gem types × 4 rarities
        },
        mythicMaterials: { dragon_scale: 0, void_crystal: 0, world_shard: 0 },
        essences: { fire: 0, water: 0, earth: 0, wind: 0, arcane: 0 },
        slotFocus: { slot: null, remaining: 0 }
    };
}
```

---

## Part 7: Save Migration

### 7.1 Migrate Old Item System to New

When loading save file, detect old item format and migrate:

```javascript
function migrateOldItems(saveData) {
    // Old system had: components (base items), combined items
    // New system has: equipment inventory

    if (!saveData.equipment) {
        saveData.equipment = {
            inventory: [],
            materials: {},
            gems: {},
            mythicMaterials: { dragon_scale: 0, void_crystal: 0, world_shard: 0 },
            essences: {}
        };
    }

    // If old items exist, refund them as VE
    if (saveData.items && saveData.items.length > 0) {
        var refund = 0;
        saveData.items.forEach(function(oldItem) {
            // Components worth 50 VE, combined items worth 100-500 VE based on rarity
            var value = oldItem.rarity === 'epic' ? 500 :
                        oldItem.rarity === 'rare' ? 200 :
                        oldItem.rarity === 'uncommon' ? 100 : 50;
            refund += value;
        });

        saveData.veilEssence = (saveData.veilEssence || 0) + refund;

        // Clear old items
        saveData.items = [];
    }

    // Mark migration complete
    saveData.itemMigrationVersion = 1;
}
```

---

## Part 8: Verification Checklist

Before marking complete:

- [ ] All 39 item lines defined with correct stats, passives, names
- [ ] Item generation works: tier rolled by region, rarity rolled by RNG + region bonus, affixes generated per rarity
- [ ] Enhancement system working: cost scaling, success rates, pity counter
- [ ] Gem sockets: socket count per rarity correct, socketing/removing works
- [ ] Echo Shaping: reroll, disassemble, upgrade rarity, transmute all working
- [ ] Equipment management: equip/unequip respects hero-gating, equipment stats calculated correctly
- [ ] Stage drops: integrated with mission rewards, drop count correct, tier/rarity distribution correct
- [ ] Save/load: equipment persists, old items migrated and refunded as VE
- [ ] UI ready for prompt 30b (equipment panel, inventory, tooltips)
- [ ] No console errors
- [ ] Test with fresh save and migrated save

---

## Notes for Implementation

1. **Hero-gating is enforced by UI** (prompt 30b will lock slots visually), but core functions should check `assignedHero` on unit objects.
2. **All costs in Veil Essence** (no gold). Integrate with saveData.veilEssence deductions.
3. **Affixes scale with rarity** — the value range shrinks at lower rarities (e.g., Uncommon rolls 60% of max value).
4. **Mythic items are craftable only** (weight 0 in normal drops). They require special recipe crafting (deferred to prompt 30b or later).
5. **Passive effects are descriptive only for now** (implementation in combat happens later as combat integration).
6. **Materials system** (scraps, shards, dust) are defined in data but not yet generated in drops. Leave empty for now.
7. **Slot affinity** (from old system) not yet integrated. Items are slot-locked from generation (accessory slots are interchangeable).

---

## If Splitting into 30a + 30b

**Prompt 30a** (this file): Items data + generation + drops + save migration
- All item line definitions
- Generation, rarity rolling, affix rolling
- Echo Shaping functions
- Stage drop integration
- Save migration

**Prompt 30b** (separate): UI + Hero Gating + Load/Test
- Equipment panel UI (8 slots per unit, drag-to-equip or click)
- Item inventory list (scrollable, filter by slot/tier/rarity)
- Item comparison tooltip (equipped vs candidate)
- Echo Shaping panel UI (5 tabs: Reroll, Disassemble, Upgrade, Transmute, Materials)
- Hero-gating: gray out equipment slots on non-hero units
- Enhancement UI
- Gem socket UI
- Test with generated items, equip/unequip, enhance, echo shape

**Merge point**: After 30a lands, integrate items.js into game. Verify item generation, drops, and data persistence work. Then run 30b for full UI.


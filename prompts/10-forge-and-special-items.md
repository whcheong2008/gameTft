# Prompt 10 — Forge Building & Special Items (Set, Ability, Evolution-Gated)

> **One-liner for Claude Code:** `Read the file prompts/10-forge-and-special-items.md and implement everything it describes.`

## Context

Read `CONTINUITY.md` for full project context. The game is a browser-based gacha auto-battler. We have 8 base components and 8 combined item recipes with a rarity system. The `passive`, `ability`, and `setId` fields on item recipes are currently `null` — this prompt activates them.

**Script load order:** `units.js → save.js → gacha.js → teams.js → hub.js → items.js → missions.js → ui-v2.js → main-v2.js`

**Rules:** All files use `var`, global scope, NO ES modules, NO import/export. Match existing code style.

---

## 1. New Building: Forge (`hub.js`)

Add to `BUILDINGS`:

```js
forge: {
    name: 'Forge',
    emoji: '🔨',
    description: 'Reforge, disassemble, and craft powerful items',
    maxLevel: 5,
    upgradeCosts: [0, 200, 500, 1000, 2000, 4000],
    effects: [
        'Locked — build to unlock the Forge',
        'Reroll Rarity: change a component\'s rarity tier',
        'Disassemble: break combined items back into components',
        'Transmute: convert one component type into another',
        'Set Crafting: forge set items using Essences',
        'Advanced Crafting: forge ability items and evolution-gated items'
    ]
}
```

Add `forge: 0` to default buildings in `save.js`'s `createDefaultSaveData()` and `validateSaveData()`.

**Bump `SAVE_VERSION` to 3.** Update `migrateSave()`:

```js
function migrateSave(data) {
    if (!data.version || data.version < 2) {
        if (!data.buildings) data.buildings = {};
        if (typeof data.buildings.evolution_lab === 'undefined') {
            data.buildings.evolution_lab = 0;
        }
        data.version = 2;
    }
    if (data.version < 3) {
        if (!data.buildings) data.buildings = {};
        if (typeof data.buildings.forge === 'undefined') {
            data.buildings.forge = 0;
        }
        // Add essences inventory if missing
        if (!data.items.essences) {
            data.items.essences = { fire: 0, water: 0, earth: 0, wind: 0 };
        }
        data.version = 3;
    }
    return data;
}
```

Also update `validateSaveData()` to ensure `buildings.forge` and `items.essences` exist.

---

## 2. Essence Drop System (`items.js`)

Essences are a new rare drop from missions, tied to the element system. They're the crafting catalyst for set items.

### 2a. Essence Data

```js
var ESSENCES = {
    fire:  { name: 'Fire Essence',  emoji: '🔥💎', color: '#ff4444' },
    water: { name: 'Water Essence', emoji: '💧💎', color: '#4488ff' },
    earth: { name: 'Earth Essence', emoji: '🌿💎', color: '#44aa44' },
    wind:  { name: 'Wind Essence',  emoji: '💨💎', color: '#aa44ff' }
};
```

### 2b. Essence Drops from Missions

In `missions.js`, when generating mission rewards, add an essence drop chance. Essences should drop **after story mission 7** and scale with difficulty:

```
- Mission level 8–10: 10% chance of 1 essence
- Mission level 11–13: 20% chance of 1 essence, 5% chance of 2
- Mission level 14+: 30% chance of 1 essence, 10% chance of 2
- 3-star bonus: +15% to all essence drop chances
```

The element of the dropped essence is biased toward the mission's `elementBias` if it has one (70% chance to match), otherwise random.

For grind missions: same rates based on the grind mission's computed level.

Add to the mission reward logic (wherever gold, XP, and item drops are calculated):

```js
function rollEssenceDrops(missionLevel, starRating, elementBias) {
    var drops = [];
    if (missionLevel < 8) return drops;

    var baseChance = 0.10;
    var doubleChance = 0.00;
    if (missionLevel >= 14) { baseChance = 0.30; doubleChance = 0.10; }
    else if (missionLevel >= 11) { baseChance = 0.20; doubleChance = 0.05; }

    if (starRating >= 3) {
        baseChance += 0.15;
        doubleChance += 0.05;
    }

    var count = 0;
    if (Math.random() < doubleChance) count = 2;
    else if (Math.random() < baseChance) count = 1;

    var elements = ['fire', 'water', 'earth', 'wind'];
    for (var i = 0; i < count; i++) {
        var elem;
        if (elementBias && Math.random() < 0.7) {
            elem = elementBias;
        } else {
            elem = elements[Math.floor(Math.random() * elements.length)];
        }
        drops.push(elem);
    }
    return drops;
}
```

Store essences in `saveData.items.essences`:
```js
// In default save data:
essences: { fire: 0, water: 0, earth: 0, wind: 0 }
```

When essences drop, increment: `saveData.items.essences[element]++`

Show essence drops in the mission results screen alongside item drops.

---

## 3. Forge Operations (`items.js`)

Add these Forge functions. Each checks the required Forge level.

### 3a. Reroll Rarity (Forge Level 1+)

```js
var REROLL_COSTS = { standard: 10, uncommon: 20, rare: 40, epic: 80 };

function forgeRerollRarity(saveData, itemId) {
    if (getBuildingLevel(saveData, 'forge') < 1) return { success: false, reason: 'Forge not built' };

    var item = findBenchItem(saveData, itemId);
    if (!item) return { success: false, reason: 'Item not found' };
    if (item.type !== 'component') return { success: false, reason: 'Can only reroll components' };
    if (item.equipped) return { success: false, reason: 'Unequip first' };

    var cost = REROLL_COSTS[item.rarity] || 10;
    if (saveData.player.gold < cost) return { success: false, reason: 'Not enough gold (' + cost + 'g)' };

    spendGold(saveData, cost);

    // Roll new rarity (weighted, can be same or different)
    var newRarity = rollItemRarity(10, 2); // Use moderate weights
    var oldRarity = item.rarity;
    item.rarity = newRarity;

    autoSave(saveData);
    return { success: true, oldRarity: oldRarity, newRarity: newRarity, cost: cost };
}
```

### 3b. Disassemble (Forge Level 2+)

Break a combined item back into its two component parts. The components inherit the original rarities. Gold cost: 15g flat.

```js
function forgeDisassemble(saveData, itemId) {
    if (getBuildingLevel(saveData, 'forge') < 2) return { success: false, reason: 'Forge level 2 required' };

    var item = findBenchItem(saveData, itemId);
    if (!item) return { success: false, reason: 'Item not found' };
    if (item.type !== 'combined') return { success: false, reason: 'Can only disassemble combined items' };
    if (item.equipped) return { success: false, reason: 'Unequip first' };

    var recipe = ITEM_RECIPES[item.key];
    if (!recipe) return { success: false, reason: 'Unknown recipe' };

    // Check bench space: removing 1 combined, adding 2 components = net +1
    if (saveData.items.bench.length >= getItemBenchSize(saveData)) {
        return { success: false, reason: 'Need 1 free bench slot' };
    }

    var cost = 15;
    if (saveData.player.gold < cost) return { success: false, reason: 'Not enough gold (15g)' };

    spendGold(saveData, cost);

    // Remove combined item
    removeItemFromBench(saveData, itemId);

    // Create two components with original rarities
    var comp1 = createItemInstance('component', recipe.components[0], item.comp1Rarity);
    var comp2 = createItemInstance('component', recipe.components[1], item.comp2Rarity);

    saveData.items.bench.push(comp1);
    saveData.items.bench.push(comp2);

    autoSave(saveData);
    return { success: true, comp1: comp1, comp2: comp2 };
}
```

### 3c. Transmute Component (Forge Level 3+)

Convert one component type into a different one. Keeps the rarity. Gold cost: 25g.

```js
function forgeTransmute(saveData, itemId, targetComponentKey) {
    if (getBuildingLevel(saveData, 'forge') < 3) return { success: false, reason: 'Forge level 3 required' };

    var item = findBenchItem(saveData, itemId);
    if (!item) return { success: false, reason: 'Item not found' };
    if (item.type !== 'component') return { success: false, reason: 'Can only transmute components' };
    if (item.equipped) return { success: false, reason: 'Unequip first' };
    if (!ITEM_COMPONENTS[targetComponentKey]) return { success: false, reason: 'Invalid target component' };
    if (item.key === targetComponentKey) return { success: false, reason: 'Already this type' };

    var cost = 25;
    if (saveData.player.gold < cost) return { success: false, reason: 'Not enough gold (25g)' };

    spendGold(saveData, cost);

    var oldKey = item.key;
    item.key = targetComponentKey;

    autoSave(saveData);
    return { success: true, oldKey: oldKey, newKey: targetComponentKey };
}
```

### 3d. Helper: Find Bench Item

```js
function findBenchItem(saveData, itemId) {
    if (!saveData.items) return null;
    for (var i = 0; i < saveData.items.bench.length; i++) {
        if (saveData.items.bench[i].id === itemId) {
            return saveData.items.bench[i];
        }
    }
    return null;
}
```

---

## 4. Set Items (`items.js`)

### 4a. Set Definitions

```js
var ITEM_SETS = {
    inferno: {
        name: 'Inferno Set',
        emoji: '🔥',
        element: 'fire',
        thresholds: [2, 3],
        bonuses: [
            { desc: 'All fire allies: +20% attack', stat: 'elemAttackBoost', element: 'fire', value: 0.20 },
            { desc: 'All fire allies: +20% attack, enemies take 10 burn/s', stat: 'elemAttackBoost', element: 'fire', value: 0.20, burnDPS: 10 }
        ]
    },
    tidal: {
        name: 'Tidal Set',
        emoji: '💧',
        element: 'water',
        thresholds: [2, 3],
        bonuses: [
            { desc: 'All water allies: +15% max HP', stat: 'elemHPBoost', element: 'water', value: 0.15 },
            { desc: 'All water allies: +15% max HP, heal 1% HP/s', stat: 'elemHPBoost', element: 'water', value: 0.15, regenPct: 0.01 }
        ]
    },
    gaia: {
        name: 'Gaia Set',
        emoji: '🌿',
        element: 'earth',
        thresholds: [2, 3],
        bonuses: [
            { desc: 'All earth allies: +15% damage reduction', stat: 'elemDRBoost', element: 'earth', value: 0.15 },
            { desc: 'All earth allies: +15% DR, +150 shield at start', stat: 'elemDRBoost', element: 'earth', value: 0.15, shield: 150 }
        ]
    },
    tempest: {
        name: 'Tempest Set',
        emoji: '💨',
        element: 'wind',
        thresholds: [2, 3],
        bonuses: [
            { desc: 'All wind allies: +20% attack speed', stat: 'elemSpdBoost', element: 'wind', value: 0.20 },
            { desc: 'All wind allies: +20% AS, 10% dodge', stat: 'elemSpdBoost', element: 'wind', value: 0.20, dodge: 0.10 }
        ]
    }
};
```

### 4b. Set Item Recipes (Forge Level 4+)

Set items are crafted from a **specific combined item** + **1 Essence** of the matching element. They are a new item type: `'set'`.

```js
var SET_ITEM_RECIPES = {
    // Fire Set — 3 items
    inferno_edge: {
        name: 'Inferno Edge', emoji: '⚔️🔥',
        baseCombined: 'infinity_edge',
        essenceElement: 'fire',
        setId: 'inferno',
        stats: { attack: 35, critChance: 0.25 },
        special: null
    },
    inferno_blade: {
        name: 'Inferno Blade', emoji: '🗡️🔥',
        baseCombined: 'blade_ruined_king',
        essenceElement: 'fire',
        setId: 'inferno',
        stats: { attack: 20 },
        special: { type: 'onHit', effect: 'bork', pctMaxHp: 0.03 }
    },
    inferno_cannon: {
        name: 'Inferno Cannon', emoji: '🏹🔥',
        baseCombined: 'rapid_firecannon',
        essenceElement: 'fire',
        setId: 'inferno',
        stats: { attackSpd: -0.2, range: 1 },
        special: null
    },
    // Water Set — 3 items
    tidal_armor: {
        name: 'Tidal Armor', emoji: '🛡️💧',
        baseCombined: 'titans_resolve',
        essenceElement: 'water',
        setId: 'tidal',
        stats: { hp: 250, damageReduction: 0.15 },
        special: null
    },
    tidal_warmog: {
        name: 'Tidal Warmog', emoji: '💪💧',
        baseCombined: 'warmogs_armor',
        essenceElement: 'water',
        setId: 'tidal',
        stats: { hp: 700 },
        special: { type: 'tick', effect: 'warmogRegen', regenPct: 0.025 }
    },
    tidal_staff: {
        name: 'Tidal Staff', emoji: '🪄💧',
        baseCombined: 'archangels_staff',
        essenceElement: 'water',
        setId: 'tidal',
        stats: { attack: 25, healPower: 0.35 },
        special: { type: 'onHeal', effect: 'archangelDmg', damagePct: 0.25 }
    },
    // Earth Set — 3 items
    gaia_claw: {
        name: 'Gaia Claw', emoji: '🧥🌿',
        baseCombined: 'dragons_claw',
        essenceElement: 'earth',
        setId: 'gaia',
        stats: { damageReduction: 0.30, elemResist: 0.25 },
        special: null
    },
    gaia_resolve: {
        name: 'Gaia Resolve', emoji: '🛡️🌿',
        baseCombined: 'titans_resolve',
        essenceElement: 'earth',
        setId: 'gaia',
        stats: { hp: 300, damageReduction: 0.18 },
        special: null
    },
    gaia_warmog: {
        name: 'Gaia Warmog', emoji: '💪🌿',
        baseCombined: 'warmogs_armor',
        essenceElement: 'earth',
        setId: 'gaia',
        stats: { hp: 750 },
        special: { type: 'tick', effect: 'warmogRegen', regenPct: 0.025 }
    },
    // Wind Set — 3 items
    tempest_edge: {
        name: 'Tempest Edge', emoji: '⚔️💨',
        baseCombined: 'hand_of_justice',
        essenceElement: 'wind',
        setId: 'tempest',
        stats: { attack: 20, critChance: 0.15 },
        special: { type: 'onKill', effect: 'hojHeal', healPct: 0.12 }
    },
    tempest_bow: {
        name: 'Tempest Bow', emoji: '🏹💨',
        baseCombined: 'rapid_firecannon',
        essenceElement: 'wind',
        setId: 'tempest',
        stats: { attackSpd: -0.25, range: 1 },
        special: null
    },
    tempest_cannon: {
        name: 'Tempest Cannon', emoji: '🏹⚡💨',
        baseCombined: 'blade_ruined_king',
        essenceElement: 'wind',
        setId: 'tempest',
        stats: { attack: 18 },
        special: { type: 'onHit', effect: 'bork', pctMaxHp: 0.04 }
    }
};
```

### 4c. Set Crafting Function

```js
function forgeCraftSetItem(saveData, setRecipeKey) {
    if (getBuildingLevel(saveData, 'forge') < 4) return { success: false, reason: 'Forge level 4 required' };

    var recipe = SET_ITEM_RECIPES[setRecipeKey];
    if (!recipe) return { success: false, reason: 'Unknown set recipe' };

    // Find an unequipped combined item of the right type on bench
    var sourceItem = null;
    for (var i = 0; i < saveData.items.bench.length; i++) {
        var bi = saveData.items.bench[i];
        if (bi.type === 'combined' && bi.key === recipe.baseCombined && !bi.equipped) {
            sourceItem = bi;
            break;
        }
    }
    if (!sourceItem) return { success: false, reason: 'Need unequipped ' + ITEM_RECIPES[recipe.baseCombined].name };

    // Check essence
    var essElem = recipe.essenceElement;
    if (!saveData.items.essences || (saveData.items.essences[essElem] || 0) < 1) {
        return { success: false, reason: 'Need 1 ' + ESSENCES[essElem].name };
    }

    // Gold cost: 50g
    var cost = 50;
    if (saveData.player.gold < cost) return { success: false, reason: 'Not enough gold (50g)' };

    // Execute crafting
    spendGold(saveData, cost);
    saveData.items.essences[essElem]--;

    // Replace the combined item with the set item (keep the bench slot)
    // The set item inherits the component rarities from the source
    var setItem = {
        id: generateItemId(),
        type: 'set',
        key: setRecipeKey,
        setId: recipe.setId,
        comp1Rarity: sourceItem.comp1Rarity,
        comp2Rarity: sourceItem.comp2Rarity,
        equipped: null
    };

    // Remove old combined item, add set item
    removeItemFromBench(saveData, sourceItem.id);
    saveData.items.bench.push(setItem);

    autoSave(saveData);
    return { success: true, item: setItem };
}
```

### 4d. Set Bonus Calculation (Combat — `main-v2.js` or `items.js`)

Add a function to calculate and apply set bonuses at combat start, after all items are applied:

```js
function calculateActiveSetBonuses(playerUnits, saveData) {
    // Count set pieces across all player units
    var setCounts = {};

    for (var u = 0; u < playerUnits.length; u++) {
        var unit = playerUnits[u];
        var equipped = getEquippedItems(saveData, unit.key);
        for (var i = 0; i < equipped.length; i++) {
            var item = equipped[i];
            if (item.type === 'set' && item.setId) {
                setCounts[item.setId] = (setCounts[item.setId] || 0) + 1;
            }
        }
    }

    return setCounts;
}

function applySetBonuses(playerUnits, setCounts) {
    var setKeys = Object.keys(setCounts);
    for (var s = 0; s < setKeys.length; s++) {
        var setId = setKeys[s];
        var setData = ITEM_SETS[setId];
        if (!setData) continue;

        var count = setCounts[setId];
        var activeTier = -1;
        for (var t = 0; t < setData.thresholds.length; t++) {
            if (count >= setData.thresholds[t]) activeTier = t;
        }
        if (activeTier < 0) continue;

        var bonus = setData.bonuses[activeTier];

        // Apply bonus to matching element units
        for (var u = 0; u < playerUnits.length; u++) {
            var unit = playerUnits[u];
            if (unit.element !== bonus.element) continue;

            if (bonus.stat === 'elemAttackBoost') {
                unit.attack = Math.floor(unit.attack * (1 + bonus.value));
            } else if (bonus.stat === 'elemHPBoost') {
                var hpAdd = Math.floor(unit.maxHp * bonus.value);
                unit.hp += hpAdd;
                unit.maxHp += hpAdd;
            } else if (bonus.stat === 'elemDRBoost') {
                unit.damageReduction = (unit.damageReduction || 0) + bonus.value;
            } else if (bonus.stat === 'elemSpdBoost') {
                unit.attackSpd = Math.max(0.2, unit.attackSpd * (1 - bonus.value));
            }

            // Tier 2 extras
            if (bonus.shield) unit.shield = (unit.shield || 0) + bonus.shield;
            if (bonus.regenPct) {
                if (!unit.itemSpecials) unit.itemSpecials = [];
                unit.itemSpecials.push({ type: 'tick', effect: 'setRegen', regenPct: bonus.regenPct });
            }
            if (bonus.dodge) unit.dodgeChance = (unit.dodgeChance || 0) + bonus.dodge;
            if (bonus.burnDPS) {
                if (!unit.itemSpecials) unit.itemSpecials = [];
                unit.itemSpecials.push({ type: 'tick', effect: 'setBurn', burnDPS: bonus.burnDPS });
            }
        }
    }
}
```

Call `calculateActiveSetBonuses` and `applySetBonuses` in `startMissionCombat()` in `ui-v2.js`, AFTER `applySynergyBonuses` and item stat application.

Also process the new combat specials (`setRegen`, `setBurn`) in the combat tick in `main-v2.js`:
- `setRegen`: heals unit by `regenPct × maxHp` per second (same pattern as warmogRegen)
- `setBurn`: deals `burnDPS` damage to the target being attacked each tick

---

## 5. Ability Items (`items.js`)

### 5a. Ability Item Definitions

Ability items are crafted from **two different combined items** (Forge Level 5) or dropped as **story mission milestone rewards**.

```js
var ABILITY_ITEMS = {
    zhonyas_hourglass: {
        name: "Zhonya's Hourglass", emoji: '⏳✨',
        craftFrom: ['titans_resolve', 'warmogs_armor'],  // 2 combined items consumed
        missionReward: null,  // can also be crafted
        stats: { hp: 300, damageReduction: 0.10 },
        ability: { type: 'onLowHP', trigger: 0.25, effect: 'stasis', duration: 2.0, cooldown: 15.0,
                   desc: 'When HP drops below 25%: become invulnerable for 2s (once per fight)' },
        requiresEvolved: false
    },
    guardian_angel: {
        name: 'Guardian Angel', emoji: '👼✨',
        craftFrom: ['warmogs_armor', 'dragons_claw'],
        missionReward: null,
        stats: { hp: 400 },
        ability: { type: 'onDeath', effect: 'revive', revivePct: 0.30, cooldown: 999,
                   desc: 'On death: revive with 30% HP (once per combat)' },
        requiresEvolved: false
    },
    rabadons_deathcap: {
        name: "Rabadon's Deathcap", emoji: '🎩✨',
        craftFrom: ['archangels_staff', 'infinity_edge'],
        missionReward: null,
        stats: { attack: 40 },
        ability: { type: 'passive', effect: 'spellAmp', value: 0.35,
                   desc: '+35% total attack damage' },
        requiresEvolved: false
    },
    bloodthirster: {
        name: 'Bloodthirster', emoji: '🩸✨',
        craftFrom: ['blade_ruined_king', 'hand_of_justice'],
        missionReward: null,
        stats: { attack: 25 },
        ability: { type: 'onHit', effect: 'lifesteal', pct: 0.15,
                   desc: 'Heal for 15% of damage dealt' },
        requiresEvolved: false
    }
};
```

### 5b. Evolution-Gated Ability Items (Forge Level 5+)

These can only be equipped on evolved units. They're crafted like normal ability items but have the `requiresEvolved: true` flag.

```js
// Add to ABILITY_ITEMS:
var EVOLVED_ABILITY_ITEMS = {
    primal_fury: {
        name: 'Primal Fury', emoji: '🐾⚡',
        craftFrom: ['infinity_edge', 'rapid_firecannon'],
        missionReward: null,
        stats: { attack: 20, attackSpd: -0.15 },
        ability: { type: 'onKill', effect: 'frenzy', atkSpdBonus: -0.10, stackMax: 3,
                   desc: 'On kill: +10% attack speed, stacks 3 times' },
        requiresEvolved: true
    },
    elemental_core: {
        name: 'Elemental Core', emoji: '💠⚡',
        craftFrom: ['archangels_staff', 'dragons_claw'],
        missionReward: null,
        stats: { attack: 15, hp: 200, elemResist: 0.15 },
        ability: { type: 'passive', effect: 'elemMastery', elemDmgBoost: 0.25,
                   desc: '+25% element advantage damage (1.3x → 1.55x)' },
        requiresEvolved: true
    },
    titan_heart: {
        name: "Titan's Heart", emoji: '❤️‍🔥⚡',
        craftFrom: ['warmogs_armor', 'titans_resolve'],
        missionReward: null,
        stats: { hp: 600, damageReduction: 0.10 },
        ability: { type: 'passive', effect: 'titanResolve', hpThreshold: 0.5, bonusDR: 0.20,
                   desc: 'Below 50% HP: +20% damage reduction' },
        requiresEvolved: true
    }
};
```

Merge `EVOLVED_ABILITY_ITEMS` into `ABILITY_ITEMS` at load time (or just define them all in one object). The `requiresEvolved` flag is what enforces the equip restriction.

### 5c. Ability Item Crafting Function

```js
function forgeCraftAbilityItem(saveData, abilityItemKey) {
    if (getBuildingLevel(saveData, 'forge') < 5) return { success: false, reason: 'Forge level 5 required' };

    var recipe = ABILITY_ITEMS[abilityItemKey];
    if (!recipe) return { success: false, reason: 'Unknown ability item' };
    if (!recipe.craftFrom) return { success: false, reason: 'This item cannot be crafted' };

    // Find two unequipped combined items matching craftFrom
    var found = [];
    var usedIds = {};
    for (var c = 0; c < recipe.craftFrom.length; c++) {
        var needed = recipe.craftFrom[c];
        var foundItem = null;
        for (var i = 0; i < saveData.items.bench.length; i++) {
            var bi = saveData.items.bench[i];
            if (bi.type === 'combined' && bi.key === needed && !bi.equipped && !usedIds[bi.id]) {
                foundItem = bi;
                break;
            }
        }
        if (!foundItem) {
            return { success: false, reason: 'Need unequipped ' + ITEM_RECIPES[needed].name };
        }
        found.push(foundItem);
        usedIds[foundItem.id] = true;
    }

    // Gold cost: 100g
    var cost = 100;
    if (saveData.player.gold < cost) return { success: false, reason: 'Not enough gold (100g)' };

    // Execute
    spendGold(saveData, cost);

    // Average the component rarities from both source items
    var rarityOrder = ['standard', 'uncommon', 'rare', 'epic'];
    var allRarities = [];
    for (var f = 0; f < found.length; f++) {
        allRarities.push(rarityOrder.indexOf(found[f].comp1Rarity));
        allRarities.push(rarityOrder.indexOf(found[f].comp2Rarity));
    }
    var avgRarity = Math.round(allRarities.reduce(function(a, b) { return a + b; }, 0) / allRarities.length);
    var bestRarity = rarityOrder[Math.min(avgRarity + 1, 3)]; // Bump up 1 tier from average

    // Remove source items
    for (var r = 0; r < found.length; r++) {
        removeItemFromBench(saveData, found[r].id);
    }

    // Create ability item
    var abilityItem = {
        id: generateItemId(),
        type: 'ability',
        key: abilityItemKey,
        rarity: bestRarity,
        equipped: null
    };

    saveData.items.bench.push(abilityItem);
    autoSave(saveData);
    return { success: true, item: abilityItem };
}
```

### 5d. Story Mission Milestone Rewards

Add milestone ability item rewards to specific story missions. Add a `milestoneReward` field to the mission definition. When a player 3-stars these missions for the first time, they get the ability item:

- Story mission 10 (3-star first clear): Zhonya's Hourglass
- Story mission 13 (3-star first clear): Guardian Angel

In the mission reward logic, check if a milestone reward exists and the player hasn't already claimed it. Store claimed milestones in `saveData.missions.milestonesClaimed` (array of mission IDs).

### 5e. Equip Restriction for Evolution-Gated Items

Update `equipItem()` in `items.js` to check `requiresEvolved`:

```js
// In equipItem(), after finding the item, before equipping:
if (item.type === 'ability') {
    var abilityData = ABILITY_ITEMS[item.key];
    if (abilityData && abilityData.requiresEvolved) {
        // Check if the target unit is an evolved unit
        if (!EVOLVED_TEMPLATES[unitKey]) {
            return 'evolved_only'; // UI should show "Only evolved units can equip this"
        }
    }
}
```

---

## 6. Combat Integration for Abilities (`main-v2.js`)

Update the combat tick processing to handle new ability effects. Add to the item stat application phase:

### 6a. Apply Ability Item Stats

When applying item stats at combat start, also handle ability items:

```js
// In applyItemStats(), add handling for type 'ability' and 'set':
if (item.type === 'ability') {
    var abilityData = ABILITY_ITEMS[item.key];
    if (!abilityData) continue;
    var abilityMult = 1 + (ITEM_RARITIES[item.rarity] ? ITEM_RARITIES[item.rarity].bonus : 0);
    var aStatKeys = Object.keys(abilityData.stats);
    for (var as = 0; as < aStatKeys.length; as++) {
        applyStatToUnit(unit, aStatKeys[as], abilityData.stats[aStatKeys[as]] * abilityMult);
    }
    // Store ability on unit for combat processing
    if (abilityData.ability) {
        if (!unit.abilities) unit.abilities = [];
        unit.abilities.push(abilityData.ability);
    }
}

if (item.type === 'set') {
    var setRecipe = SET_ITEM_RECIPES[item.key];
    if (!setRecipe) continue;
    var setMult = getCombinedItemStatMultiplier(item.comp1Rarity, item.comp2Rarity);
    var sStatKeys = Object.keys(setRecipe.stats);
    for (var ss = 0; ss < sStatKeys.length; ss++) {
        applyStatToUnit(unit, sStatKeys[ss], setRecipe.stats[sStatKeys[ss]] * setMult);
    }
    if (setRecipe.special) {
        if (!unit.itemSpecials) unit.itemSpecials = [];
        unit.itemSpecials.push(setRecipe.special);
    }
}
```

### 6b. Process Abilities During Combat

In the combat tick loop, process these ability effects:

- **`stasis` (Zhonya's)**: When unit HP drops below trigger threshold, set `unit.stasis = duration`. While stasis > 0, unit cannot take damage or act. Decrement stasis each tick. Only triggers once (`unit.stasisUsed = true`).

- **`revive` (Guardian Angel)**: When unit would die (HP ≤ 0), instead set HP to `revivePct × maxHp` and mark `unit.reviveUsed = true`. Only triggers once.

- **`spellAmp` (Rabadon's)**: Already applied at combat start — multiply `unit.attack` by `(1 + value)` after all other stat applications.

- **`lifesteal` (Bloodthirster)**: After dealing damage, heal attacker by `pct × damageDealt`.

- **`frenzy` (Primal Fury)**: On kill, reduce attackSpd by bonus (faster attacks). Track stacks in `unit.frenzyStacks`.

- **`elemMastery` (Elemental Core)**: When calculating element damage multiplier, if unit has this ability, add `elemDmgBoost` to the strong multiplier (1.3 + 0.25 = 1.55).

- **`titanResolve` (Titan's Heart)**: Each tick, if `unit.hp / unit.maxHp < hpThreshold`, apply bonus damage reduction.

---

## 7. Item Display Updates (`items.js`, `ui-v2.js`)

### 7a. Update Item Display Functions

Update `getItemName()`, `getItemEmoji()`, `getItemRarityColor()`, `getItemRarityName()`, `getItemStatDescription()` to handle the new types (`'set'` and `'ability'`).

For set items, show the set name and piece count (e.g., "Inferno Edge [Inferno 1/3]").
For ability items, show the ability description prominently.
For evolution-gated items, show a "⚡ Evolved Only" badge.

### 7b. Update `getItemSellValue()` for New Types

```js
// Set items: slightly more valuable than combined
// Sell value = combined item value × 2
// Ability items: most valuable
// Sell value = 100g flat (they cost 100g + 2 combined items to make)
```

### 7c. Update Item Bench Rendering

Items on the bench should show type badges:
- Components: just the rarity border (existing)
- Combined: existing style
- Set items: rarity border + small set icon in corner
- Ability items: golden border + star icon
- Evolved-gated items: golden border + ⚡ icon

---

## 8. Forge UI (`ui-v2.js`)

### 8a. Forge Panel

When the player clicks the Forge building (level ≥ 1), show a tabbed panel with sections based on unlocked forge level:

**Tab 1: Reroll (Level 1+)**
- List all unequipped components on bench
- Each shows: emoji, name, current rarity (colored), [REROLL - Xg] button
- On click: reroll, show old → new rarity with brief animation
- Show cost next to button

**Tab 2: Disassemble (Level 2+)**
- List all unequipped combined items on bench
- Each shows: emoji, name, component breakdown preview
- [DISASSEMBLE - 15g] button
- Result: "Broke down [item] into [comp1] + [comp2]"

**Tab 3: Transmute (Level 3+)**
- List all unequipped components
- Select one, then pick target component type from 8 options
- [TRANSMUTE - 25g] button
- Shows: "Converted [old] → [new] (kept [rarity])"

**Tab 4: Set Crafting (Level 4+)**
- Show all 12 set item recipes grouped by element
- Each shows: required combined item, required essence, gold cost
- Grayed out if missing ingredients, green [CRAFT] button if available
- Show current essence inventory at top: 🔥×3 💧×1 🌿×5 💨×2

**Tab 5: Advanced Crafting (Level 5+)**
- Show all 7 ability item recipes (4 normal + 3 evolution-gated)
- Each shows: two required combined items, gold cost, ability description
- Evolution-gated items marked with ⚡ badge
- Grayed out if missing ingredients, [CRAFT] button if available

### 8b. Essence Display

Add essence counts to the hub top bar or as a sub-display on the Forge building card. Format: `🔥×N 💧×N 🌿×N 💨×N`

Show essence drops in mission results alongside item drops with a distinct visual style.

---

## 9. Summary of File Changes

| File | Changes |
|------|---------|
| `items.js` | Add `ESSENCES`, `ITEM_SETS`, `SET_ITEM_RECIPES`, `ABILITY_ITEMS`, `EVOLVED_ABILITY_ITEMS`. Add `rollEssenceDrops()`, `findBenchItem()`, `forgeRerollRarity()`, `forgeDisassemble()`, `forgeTransmute()`, `forgeCraftSetItem()`, `forgeCraftAbilityItem()`, `calculateActiveSetBonuses()`, `applySetBonuses()`. Update `getItemName/Emoji/RarityColor/StatDescription/SellValue` for new types. Update `equipItem()` for evolved-only check. Update `applyItemStats()` for set and ability items. |
| `hub.js` | Add `forge` building definition |
| `save.js` | Bump SAVE_VERSION to 3, update `migrateSave()`, update `validateSaveData()`, add `essences` to default save, add `milestonesClaimed` |
| `missions.js` | Add `rollEssenceDrops()`, integrate essence drops into reward logic, add milestone reward data to missions 10 and 13 |
| `ui-v2.js` | Add Forge panel UI (5 tabs), update item bench rendering for new types, show essences in hub/results, show set bonus info on equipped items |
| `main-v2.js` | Process new combat abilities (stasis, revive, spellAmp, lifesteal, frenzy, elemMastery, titanResolve), process set bonus specials (setRegen, setBurn), call `applySetBonuses()` at combat start |

---

## 10. Testing Checklist

1. Forge building appears in hub, can be built and upgraded through 5 levels
2. **Reroll**: component rarity changes, gold deducted, can't reroll equipped items
3. **Disassemble**: combined item splits into 2 components with original rarities, needs bench space
4. **Transmute**: component type changes, rarity preserved, gold deducted
5. **Essences**: drop from missions level 8+, element-biased, shown in results screen
6. **Set crafting**: consumes combined item + essence + gold, creates set item
7. **Set bonuses**: 2-piece and 3-piece thresholds apply correct buffs in combat
8. **Ability crafting**: consumes 2 combined items + gold, creates ability item
9. **Stasis**: Zhonya's triggers at 25% HP, unit invulnerable for 2s
10. **Revive**: Guardian Angel triggers on death, revives with 30% HP
11. **Spell amp**: Rabadon's +35% attack applied correctly
12. **Lifesteal**: Bloodthirster heals on hit
13. **Evolution-gated**: can only equip on evolved units, shows error otherwise
14. **Frenzy stacks**: Primal Fury gains attack speed on kill
15. **Element mastery**: Elemental Core boosts element advantage
16. **Titan resolve**: bonus DR below 50% HP
17. **Milestone rewards**: story mission 10/13 give ability items on first 3-star
18. **Save/load**: all new item types persist correctly, old saves migrate
19. **Item selling**: set/ability items have correct sell values
20. **Item display**: all new types render correctly on bench, equipped, in detail panel

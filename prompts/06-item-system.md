# Prompt 06 — Item System (Components, Recipes, Rarities, Drops)

## Context

You're working on a browser-based gacha auto-battler game (V2). The codebase uses **modular JS via global scope** — NO ES modules, NO import/export. All files are loaded via `<script>` tags in `game-v2.html`.

**Load order**: `units.js → save.js → gacha.js → teams.js → hub.js → missions.js → ui-v2.js → main-v2.js`

This prompt implements the full item system: components with rarity tiers, recipe combining, mission drops, equipment UI, and combat integration. The data structures include hooks for future ability-altering items and set items (not implemented yet, just the fields).

---

## New File: `js/items.js`

Create this file and add it to the script load order in `game-v2.html` AFTER `hub.js` and BEFORE `missions.js`:
```
units.js → save.js → gacha.js → teams.js → hub.js → items.js → missions.js → ui-v2.js → main-v2.js
```

---

## Part 1: Item Data Definitions (items.js)

### Rarity System

```js
var ITEM_RARITIES = {
    standard:  { name: 'Standard',  color: '#aaaaaa', bonus: 0.00 },
    uncommon:  { name: 'Uncommon',  color: '#44bb44', bonus: 0.12 },
    rare:      { name: 'Rare',      color: '#4488ff', bonus: 0.25 },
    epic:      { name: 'Epic',      color: '#aa44ff', bonus: 0.50 }
};

// Rarity drop weights — base distribution, modified by mission difficulty + star rating
var BASE_RARITY_WEIGHTS = { standard: 60, uncommon: 25, rare: 12, epic: 3 };
```

### Base Components (8)

```js
var ITEM_COMPONENTS = {
    bf_sword:       { name: 'BF Sword',           emoji: '🗡️', stat: 'attack',          value: 15 },
    chain_vest:     { name: 'Chain Vest',          emoji: '🛡️', stat: 'hp',              value: 200 },
    giants_belt:    { name: "Giant's Belt",        emoji: '💪', stat: 'hp',              value: 300 },
    recurve_bow:    { name: 'Recurve Bow',         emoji: '🏹', stat: 'attackSpd',       value: -0.1 },
    large_rod:      { name: 'Needlessly Large Rod',emoji: '🪄', stat: 'attack',          value: 20 },
    negatron_cloak: { name: 'Negatron Cloak',      emoji: '🧥', stat: 'damageReduction', value: 0.10 },
    sparring_gloves:{ name: 'Sparring Gloves',     emoji: '🥊', stat: 'critChance',      value: 0.10 },
    tear:           { name: 'Tear of the Goddess',  emoji: '💧', stat: 'healPower',       value: 0.20 }
};
```

### Combined Item Recipes (8)

Each recipe has:
- `components`: array of 2 component keys
- `stats`: base stat bonuses (before rarity scaling)
- `special`: combat effect (if any) — implemented in combat
- `passive`: null (future: passive ability hook)
- `ability`: null (future: active ability override hook)
- `setId`: null (future: set item grouping)

```js
var ITEM_RECIPES = {
    infinity_edge: {
        name: 'Infinity Edge', emoji: '⚔️✨',
        components: ['bf_sword', 'bf_sword'],
        stats: { attack: 30, critChance: 0.25 },
        special: null,
        passive: null, ability: null, setId: null
    },
    blade_ruined_king: {
        name: 'Blade of the Ruined King', emoji: '🗡️👑',
        components: ['bf_sword', 'recurve_bow'],
        stats: { attack: 15 },
        special: { type: 'onHit', effect: 'bork', pctMaxHp: 0.03 },
        passive: null, ability: null, setId: null
    },
    titans_resolve: {
        name: "Titan's Resolve", emoji: '🛡️💎',
        components: ['chain_vest', 'negatron_cloak'],
        stats: { hp: 200, damageReduction: 0.15 },
        special: null,
        passive: null, ability: null, setId: null
    },
    warmogs_armor: {
        name: "Warmog's Armor", emoji: '💪❤️',
        components: ['giants_belt', 'giants_belt'],
        stats: { hp: 600 },
        special: { type: 'tick', effect: 'warmogRegen', regenPct: 0.02 },
        passive: null, ability: null, setId: null
    },
    rapid_firecannon: {
        name: 'Rapid Firecannon', emoji: '🏹⚡',
        components: ['recurve_bow', 'recurve_bow'],
        stats: { attackSpd: -0.2, range: 1 },
        special: null,
        passive: null, ability: null, setId: null
    },
    archangels_staff: {
        name: "Archangel's Staff", emoji: '🪄💧',
        components: ['large_rod', 'tear'],
        stats: { attack: 20, healPower: 0.30 },
        special: { type: 'onHeal', effect: 'archangelDmg', damagePct: 0.20 },
        passive: null, ability: null, setId: null
    },
    hand_of_justice: {
        name: 'Hand of Justice', emoji: '🥊🗡️',
        components: ['sparring_gloves', 'bf_sword'],
        stats: { attack: 15, critChance: 0.10 },
        special: { type: 'onKill', effect: 'hojHeal', healPct: 0.10 },
        passive: null, ability: null, setId: null
    },
    dragons_claw: {
        name: "Dragon's Claw", emoji: '🧥🐉',
        components: ['negatron_cloak', 'negatron_cloak'],
        stats: { damageReduction: 0.25, elemResist: 0.20 },
        special: null,
        passive: null, ability: null, setId: null
    }
};
```

### Item Instance Structure

When a component drops or a recipe is crafted, create item instances like this:

```js
// Component instance
{
    id: 'unique_id',
    type: 'component',
    key: 'bf_sword',        // maps to ITEM_COMPONENTS
    rarity: 'rare',          // standard/uncommon/rare/epic
    equipped: null            // null or { unitKey: 'flame_warrior', slot: 0 }
}

// Combined item instance
{
    id: 'unique_id',
    type: 'combined',
    key: 'infinity_edge',    // maps to ITEM_RECIPES
    comp1Rarity: 'rare',     // rarity of first component used
    comp2Rarity: 'standard', // rarity of second component used
    equipped: null
}
```

### Rarity Scaling for Combined Items

Both components contribute their rarity bonus independently:
```
totalStats = baseStats × (1 + comp1RarityBonus + comp2RarityBonus)
```

Examples:
- Standard + Standard = base × 1.0 (no bonus)
- Uncommon + Standard = base × 1.12
- Rare + Rare = base × 1.50
- Epic + Epic = base × 2.0
- Epic + Standard = base × 1.50

Function to calculate:
```js
function getCombinedItemStatMultiplier(comp1Rarity, comp2Rarity) {
    var b1 = ITEM_RARITIES[comp1Rarity] ? ITEM_RARITIES[comp1Rarity].bonus : 0;
    var b2 = ITEM_RARITIES[comp2Rarity] ? ITEM_RARITIES[comp2Rarity].bonus : 0;
    return 1 + b1 + b2;
}
```

---

## Part 2: Item Inventory in Save Data (save.js)

Add to `createDefaultSaveData()`:
```js
items: {
    bench: [],       // Array of item instances (max 10 slots)
    benchSize: 10
}
```

Add migration in `loadGame()` — if `saveData.items` is missing, add the default.

### Helper Functions (items.js)

```js
function addItemToBench(saveData, item)       // Add item, return false if bench full
function removeItemFromBench(saveData, itemId) // Remove by ID
function getBenchItems(saveData)               // Return bench array
function isBenchFull(saveData)                 // Check if bench has 10 items
```

---

## Part 3: Item Drops from Missions (missions.js)

Modify `calculateMissionRewards` to include item drops.

### Drop Rules:
- Every mission completion: **1 guaranteed component drop**
- 3-star rating: **+1 bonus component drop** (2 total)
- Grind missions: same rules

### Rarity Distribution:
Rarity weights shift based on mission difficulty and star rating.

```js
function rollItemRarity(missionLevel, starRating) {
    // Start with base weights
    var weights = {
        standard: BASE_RARITY_WEIGHTS.standard,
        uncommon: BASE_RARITY_WEIGHTS.uncommon,
        rare: BASE_RARITY_WEIGHTS.rare,
        epic: BASE_RARITY_WEIGHTS.epic
    };

    // Mission difficulty bonus: per mission level, shift weights
    // Every 2 levels: -5 standard, +3 uncommon, +1.5 rare, +0.5 epic
    var diffBonus = Math.floor(missionLevel / 2);
    weights.standard = Math.max(10, weights.standard - diffBonus * 5);
    weights.uncommon += diffBonus * 3;
    weights.rare += diffBonus * 1.5;
    weights.epic += diffBonus * 0.5;

    // Star rating bonus
    if (starRating >= 3) {
        weights.standard = Math.max(5, weights.standard - 15);
        weights.uncommon += 5;
        weights.rare += 7;
        weights.epic += 3;
    } else if (starRating >= 2) {
        weights.standard = Math.max(10, weights.standard - 8);
        weights.uncommon += 4;
        weights.rare += 3;
        weights.epic += 1;
    }

    // Roll from weighted distribution
    // ... standard weighted random selection
}
```

### Drop a random component:
```js
function rollItemDrop(missionLevel, starRating) {
    var rarity = rollItemRarity(missionLevel, starRating);
    var compKeys = Object.keys(ITEM_COMPONENTS);
    var key = compKeys[Math.floor(Math.random() * compKeys.length)];
    return createItemInstance('component', key, rarity);
}
```

### Integration with calculateMissionRewards:
Add `itemDrops: []` to the rewards object. Call `rollItemDrop` 1-2 times based on star rating.

### Integration with applyMissionRewards:
Add each item drop to the bench. If bench is full, show a warning (items overflow goes to a temporary overflow — or just notify player to clear bench).

---

## Part 4: Equip/Unequip UI (ui-v2.js)

### Item Bench Panel
Add a new section to the hub screen OR a dedicated "Inventory" screen. Show:
- All items on bench with emoji, name, rarity color border
- Tap a component to see what recipes it can make
- Auto-combine: when player drags a 2nd matching component onto a unit that has the first, combine

### Equipping Flow:
1. Player opens roster/team builder
2. Each unit card shows 3 item slots (empty or filled)
3. Player taps bench item → taps a unit → item equips to next open slot
4. If unit already has a component and a matching recipe exists with the new component, auto-combine
5. Combined items cannot be unequipped or disassembled (permanent)
6. Components CAN be moved between units (unequip returns to bench)

### Visual Display:
- Component: show emoji + rarity-colored border
- Combined: show recipe emoji + glow based on average rarity
- In combat: show small item icons below unit name in `renderCombatUnitCell`

### Implementation approach:
- Add item slot display to team builder unit cards and roster cards
- Add an "Item Bench" button on hub that opens a panel/overlay
- When clicking bench item: enters "equip mode" (similar to how team builder selects a unit)
- Click on a team unit to equip
- Right-click or long-press on equipped component to unequip (return to bench)

---

## Part 5: Combat Integration (main-v2.js)

### Apply Item Stats at Combat Start

In `initCombat` (or right before it), iterate over player units and apply item stats:

```js
function applyItemStats(unit, saveData) {
    // Find this unit's equipped items from saveData
    var equippedItems = getEquippedItems(saveData, unit.key);

    for (var i = 0; i < equippedItems.length; i++) {
        var item = equippedItems[i];
        var stats, multiplier;

        if (item.type === 'component') {
            var comp = ITEM_COMPONENTS[item.key];
            var rarityBonus = ITEM_RARITIES[item.rarity] ? ITEM_RARITIES[item.rarity].bonus : 0;
            multiplier = 1 + rarityBonus;
            // Apply single component stat
            applyStatToUnit(unit, comp.stat, comp.value * multiplier);
        } else if (item.type === 'combined') {
            var recipe = ITEM_RECIPES[item.key];
            multiplier = getCombinedItemStatMultiplier(item.comp1Rarity, item.comp2Rarity);
            // Apply all recipe stats
            var statKeys = Object.keys(recipe.stats);
            for (var s = 0; s < statKeys.length; s++) {
                applyStatToUnit(unit, statKeys[s], recipe.stats[statKeys[s]] * multiplier);
            }
            // Mark special effects on unit for combat processing
            if (recipe.special) {
                if (!unit.itemSpecials) unit.itemSpecials = [];
                unit.itemSpecials.push(recipe.special);
            }
        }
    }
}

function applyStatToUnit(unit, stat, value) {
    if (stat === 'attack') unit.attack += Math.floor(value);
    else if (stat === 'hp') { unit.hp += Math.floor(value); unit.maxHp += Math.floor(value); }
    else if (stat === 'attackSpd') unit.attackSpd += value; // negative = faster
    else if (stat === 'damageReduction') unit.damageReduction = (unit.damageReduction || 0) + value;
    else if (stat === 'critChance') unit.critChance = (unit.critChance || 0) + value;
    else if (stat === 'healPower') unit.healBonus = (unit.healBonus || 0) + value;
    else if (stat === 'range') unit.range += Math.floor(value);
    else if (stat === 'elemResist') unit.elemResist = (unit.elemResist || 0) + value;
}
```

### Process Special Effects in Combat

In `performAttack` in `main-v2.js`, add hooks for item specials:

```js
// After damage is dealt:
if (attacker.itemSpecials) {
    for (var sp = 0; sp < attacker.itemSpecials.length; sp++) {
        var spec = attacker.itemSpecials[sp];

        // Blade of the Ruined King: bonus %maxHP damage
        if (spec.effect === 'bork' && target.hp > 0) {
            var borkDmg = Math.floor(target.maxHp * spec.pctMaxHp);
            target.hp -= borkDmg;
        }

        // Hand of Justice: heal on kill
        if (spec.effect === 'hojHeal' && target.hp <= 0) {
            attacker.hp = Math.min(attacker.maxHp, attacker.hp + Math.floor(attacker.maxHp * spec.healPct));
        }
    }
}

// In combatTick, add Warmog's regen:
// For each player unit with warmogRegen special, heal per tick

// For Archangel's: in healer logic, when heal happens, deal damage to nearest enemy
```

### Crit chance processing:
In `performAttack`, after calculating base damage, add:
```js
if (attacker.critChance && Math.random() < attacker.critChance) {
    dmg = Math.floor(dmg * 1.5); // 50% bonus crit damage
}
```

### Element resist:
In `performAttack`, when applying element multiplier:
```js
if (target.elemResist && elemMult > 1.0) {
    elemMult = 1.0 + (elemMult - 1.0) * (1 - target.elemResist);
    // e.g., 1.3x strong becomes 1.3 - 0.06 = 1.24x with 20% resist
}
```

---

## Part 6: Display Item Drops in Mission Results (ui-v2.js)

In `showMissionResults`, after the unit copies section, add:
```
Items found:
🗡️ BF Sword (Rare) · 🏹 Recurve Bow (Standard)
```

Use the rarity color for the rarity label text.

If bench is full, show: "⚠️ Item bench full! Clear space to collect more items."

---

## Code Quality Notes

- All functions go in global scope (no ES modules)
- Use `var` not `let`/`const`
- New saveData fields need migration in `save.js` `loadGame()`
- Item instances need unique IDs: use `Math.random().toString(36).substr(2, 9)`
- The `passive`, `ability`, `setId` fields on recipes should be `null` for now — they exist purely as future hooks
- Keep item bench UI simple for now — can polish in later prompts

---

## Testing Checklist

- [ ] Complete a mission → receive 1-2 component drops
- [ ] 3-star a mission → get bonus drop
- [ ] Component rarity varies (check high-level missions give more Uncommon/Rare)
- [ ] Equip a component to a unit from bench → stat changes visible
- [ ] Equip two matching components to same unit → auto-combine into recipe
- [ ] Combined item stats scale with component rarities (Standard+Standard vs Rare+Rare)
- [ ] BotRK special: bonus %maxHP damage in combat
- [ ] Warmog's: HP regen ticking during combat
- [ ] Hand of Justice: heal on kill
- [ ] Archangel's: healer deals damage when healing
- [ ] Crit chance works (visible as higher damage numbers)
- [ ] Dragon's Claw element resist reduces strong-element damage
- [ ] Rapid Firecannon grants +1 range
- [ ] Item icons show on units in combat view
- [ ] Mission results display item drops with rarity colors
- [ ] Old saves load correctly (migration adds empty items.bench)
- [ ] Bench full → warning shown, items don't silently disappear
- [ ] Reset game → fresh save has correct item defaults

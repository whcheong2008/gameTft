# Prompt 30 — Item System Rework (RPG Equipment + Diablo-Style Loot)

> **Purpose**: Replace the component-based item system with RPG equipment slots and a Diablo-style tier + rarity loot system. This is a major rework of `items.js` and related systems.
>
> **PREREQUISITE**: Prompt 29 (hero system) must be completed first. Items are gated behind heroes.
>
> **Source of truth**: `ITEMS-REDESIGN.md` (complete design with all config objects, item catalog, affix pools, passive definitions, drop system, forge operations).
>
> **Pattern**: All `var`, global scope, NO ES modules, NO import/export. Match existing code style.
>
> **Read before starting**: `ITEMS-REDESIGN.md` (entire document), `js/items.js` (current system to replace), `js/heroes.js` (hero gating), `js/save.js`, `js/ui-v2.js`.

---

## Part A: Replace items.js

Rewrite `js/items.js` completely. The new file contains:

### Config Objects (all tunable)
Copy these directly from `ITEMS-REDESIGN.md` Sections 3-4:
- `TIER_CONFIG` — stat multipliers per tier (T1-T5)
- `RARITY_CONFIG` — rarity names, colors, stat multipliers, affix counts, drop weights
- `AFFIX_RARITY_SCALING` — how affix value ranges scale with rarity
- `REGION_DROP_CONFIG` — which tiers drop in which regions
- `REGION_RARITY_BONUS` — luck scaling by region
- `DROP_CONFIG` — drops per mission, boss bonuses, etc.
- `ENHANCEMENT_CONFIG` — enhancement costs, rates, penalties (kept from current system)
- `SOCKET_CONFIG` — gem sockets per rarity (kept from current system)

### Item Line Definitions
Define all 39 item lines from `ITEMS-REDESIGN.md` Section 6:
```javascript
var ITEM_LINES = {
    // Weapons (6)
    sword: {
        slot: 'weapon',
        names: { 1: 'Iron Sword', 2: 'Steel Sword', 3: 'Mithril Sword', 4: 'Adamant Sword', 5: 'Celestial Blade' },
        baseStats: { atk: 12 },
        identity: 'Balanced melee',
        minorPassive: { key: 'consecutiveHitBonus', bonusPct: 0.08, maxStacks: 3, desc: '+8% damage per consecutive hit on same target (max 24%)' },
        majorPassive: { key: 'bladeStorm', everyN: 8, damagePct: 0.60, aoeRadius: 1, desc: 'Every 8th attack slashes adjacent enemies for 60% ATK' }
    },
    // ... all 39 item lines from ITEMS-REDESIGN.md
};
```

### Affix Pool Definitions
Copy all affix pools from `ITEMS-REDESIGN.md` Section 4:
- `WEAPON_AFFIXES`, `HELM_AFFIXES`, `CHEST_AFFIXES`, `GAUNTLET_AFFIXES`, `BOOT_AFFIXES`, `OFFHAND_AFFIXES`, `ACCESSORY_AFFIXES`

Map slots to their affix pool:
```javascript
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

### Set Definitions
Copy from `ITEMS-REDESIGN.md` Section 12:
```javascript
var EQUIPMENT_SETS = {
    inferno: { name: 'Inferno', element: 'fire', slots: ['weapon', 'helm', 'chest'], bonuses: { /* 2pc, 3pc */ } },
    tidal: { /* ... */ },
    gaia: { /* ... */ },
    tempest: { /* ... */ }
};
```

### Mythic Definitions
Copy from `ITEMS-REDESIGN.md` Section 7:
```javascript
var MYTHIC_EQUIPMENT = {
    infinity_gauntlet: { slot: 'gauntlets', stats: { atk: 50 }, passive: { /* ... */ }, recipe: { /* ... */ } },
    // ... all 6 mythics
};
```

### Core Functions
```javascript
function generateEquipmentDrop(regionId, isBoss, is3Star) {
    // 1. Roll tier from REGION_DROP_CONFIG[regionId]
    // 2. Roll rarity from RARITY_CONFIG.dropWeights + REGION_RARITY_BONUS[regionId]
    // 3. Pick random item line for a random slot (or slotFocus if active)
    // 4. Roll affix count based on rarity, select random affixes from slot pool
    // 5. Roll affix values within range, scaled by AFFIX_RARITY_SCALING
    // 6. Attach minor/major passive if rarity qualifies
    // 7. Boss bonus: bump minimum rarity by 1 tier
    // 8. Return complete equipment object
}

function calculateEquipmentStats(equipment) {
    // baseStat × TIER_CONFIG.statMultipliers[tier] × RARITY_CONFIG.statMultipliers[rarity] × (1 + enhanceBonus)
    // + affix bonuses + gem bonuses + set bonuses + hero affinity bonus
}

function salvageEquipment(equipment) {
    // Returns: 1 scrap of item's rarity tier + 50% enhancement gold + gems returned
}

function enhanceEquipment(saveData, equipmentId) {
    // Same logic as current system, using ENHANCEMENT_CONFIG
}

function reforgeAffixes(saveData, equipmentId) {
    // Reroll all affixes (keep rarity, tier, item line, passive, enhancement, gems)
    // Cost: 40g
}

function infuseSet(saveData, equipmentId, setKey) {
    // Add set tag to Epic+ equipment. Cost: 50g + 1 essence
}

function cleansSet(saveData, equipmentId) {
    // Remove set tag. Cost: 25g. Essence NOT returned.
}

function craftMythic(saveData, legendaryEquipmentId, mythicKey) {
    // Consume legendary equipment + mythic material + 250g
}

function equipItem(saveData, equipmentId, unitId) {
    // Check: unit has a hero assigned (required)
    // Check: slot is correct
    // Check: mythic limit (1 per unit)
    // Assign equipment.equipped = { unitId, heroId }
}

function unequipItem(saveData, equipmentId) {
    // Return to inventory
}

function getEquippedItems(saveData, unitId) {
    // Return all 8 slot items for this unit (or null per slot)
}
```

---

## Part B: Save Data Migration

Major save structure change. Bump save version.

### New Save Structure
```javascript
// Replace saveData.items with saveData.equipment
equipment: {
    inventory: [],          // array of equipment objects
    materials: { commonScraps: 0, uncommonScraps: 0, rareScraps: 0, epicScraps: 0, oreShards: 0, refinedOre: 0, elementalDust: 0, prismaticShards: 0 },
    mythicMaterials: { dragon_scale: 0, void_crystal: 0, world_shard: 0 },
    essences: { fire: 0, water: 0, earth: 0, wind: 0, lightning: 0, force: 0, arcane: 0 },
    codex: { discovered: {} },
    slotFocus: { slot: null, remaining: 0 }
}
```

### Migration from Old System
Old items → new equipment conversion:
- Components (old) → Common T1 equipment, matched to closest slot by stat type
- Combined items (old) → Uncommon T2 equipment
- Set items (old) → Rare T3 equipment with set infusion preserved
- Ability items (old) → Epic T3 equipment (passive effect preserved where possible)
- Mythic items (old) → Mythic equipment (direct mapping — Infinity Edge → Infinity Gauntlet, etc.)
- Enhancement levels preserved
- Gems preserved
- Essences and mythic materials carried over
- Old bench items that don't map cleanly → converted to scraps + gold refund
- Old recipeBook → codex.discovered (best effort mapping)

---

## Part C: Combat Integration

### Stat Application
At combat start, for each player unit with a hero:
1. Get all equipped items via `getEquippedItems()`
2. Call `calculateEquipmentStats()` for each item
3. Sum all equipment stats and apply to unit
4. Check for set bonuses (count set pieces on this unit, apply 2pc/3pc bonuses)
5. Apply hero affinity bonus (+15% stats in preferred slots)
6. Apply equipment passives (minor at Epic, major at Legendary)

### Equipment Passive Effects in Combat
Implement all minor and major passives from `ITEMS-REDESIGN.md` Section 5. These are combat-event-triggered effects:
- On-hit effects (Spiked Gauntlets, Hammer DR shred)
- Nth-attack effects (Dagger every 4th, Sword Blade Storm every 8th)
- Conditional effects (Battle Harness +ATK above 70% HP)
- Proc effects (Staff Echo Cast 20% chance)
- Aura effects (Healing Orb heal power aura)

Use the same pattern as archetype synergy combat effects.

### Mythic Equipment Passives
Same as current system — these already have combat hooks. Just update the data source from old item format to new equipment format.

---

## Part D: Mission Reward Integration

### Equipment Drops
Replace old item drops in mission rewards with equipment drops:
1. After mission victory, call `generateEquipmentDrop(regionId, isBoss, is3Star)`
2. Show the drop with full tooltip (tier, rarity, stats, affixes, passive if applicable)
3. Add to `saveData.equipment.inventory`
4. Also roll for material drops (ore shards, refined ore, etc.) based on `DROP_CONFIG.materialDropChance`
5. Also roll for gem drops based on `DROP_CONFIG.gemDropChance`

### Boss-Specific Drops
Boss kills:
- Guarantee minimum Uncommon rarity
- Drop slot-specific items matching boss combat style
- Guarantee 1 upgrade material

---

## Part E: Forge UI Update

Replace all old forge operations with new ones from `ITEMS-REDESIGN.md` Section 11:

### Forge Panel Tabs
1. **Enhance** — Select equipment, pay gold, attempt enhancement (+0 to +10)
2. **Salvage** — Select equipment, break down into scraps + return gems
3. **Reforge** — Select equipment, pay 40g, reroll all affixes
4. **Gem** — Combine gems (3→1 higher rarity), socket/remove gems
5. **Set Infuse** — Select Epic+ equipment + essence → apply set tag (Forge L4+)
6. **Mythic Forge** — Select Legendary + mythic material → craft mythic (Forge L5)

### Remove Old Operations
- Remove: Reroll Rarity, Transmute, Disassemble, Ability Craft, Set Craft (old style)
- These no longer exist in the new system

---

## Part F: Equipment UI

### Inventory Screen
Replace the old item bench with an inventory browser:
- Filter by: slot, tier, rarity, set
- Sort by: power rating, tier, rarity, slot, enhancement level
- Show item tooltip on hover/click: name, tier badge, rarity color, base stats, affixes, passive (if any), enhancement level, gem sockets, set tag

### Per-Unit Equipment Screen
When clicking a hero-equipped unit (in team builder or roster):
- Show 8 equipment slots arranged visually (helm top, chest center, weapon left, etc.)
- Each slot shows equipped item (or empty slot)
- Click empty slot → opens inventory filtered to that slot
- Click equipped item → option to unequip or swap
- Show total equipment stat contribution
- Show set bonus status (2/3 pieces, bonus active/inactive)
- Show hero affinity indicator on preferred slots

### Equipment Comparison
When selecting an item to equip:
- Show side-by-side comparison with currently equipped item
- Green/red arrows for stat changes
- Show affix differences

---

## Part G: Equipment Codex

Replace Recipe Book with Equipment Codex:
- One page per slot
- Show all item lines per tier
- Discovered items show full info; undiscovered show silhouette + "???"
- Collection milestones from `ITEMS-REDESIGN.md` Section 15

---

## Implementation Notes

- **Delete old item data** from `items.js` (components, recipes, combined items, old sets, old ability items). Keep only what the new system uses.
- **Gem system** is mostly unchanged — just update socket count to use `SOCKET_CONFIG.socketsPerRarity[rarity]` instead of the old rarity-based system.
- **The forge building** definition in `hub.js` stays. Only the forge panel UI and operations change.
- **Equipment gating**: Always check `getHeroForUnit(saveData, unitId)` before allowing equip. If no hero, show "Assign a hero to equip items."
- **Load order**: `items.js` should load AFTER `heroes.js` (needs hero functions for gating checks).
- **Performance**: Equipment stat calculation should be cached and only recalculated on equip/unequip/enhance. Don't recalculate every frame.
- Commit when done and the game loads without console errors.

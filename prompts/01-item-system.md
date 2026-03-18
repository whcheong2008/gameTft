# Prompt: Implement Item System

You are adding an Item System to a modular auto-battler game. The game is split across multiple JS files loaded via plain `<script>` tags (global scope, no imports/exports).

## FIRST: Read these files to understand the codebase
- `MECHANICS.md` — Full game rules reference
- `game.html` — HTML shell + CSS
- `js/units.js` — Unit definitions and templates
- `js/combat.js` — Combat engine (you'll hook into this)
- `js/ui.js` — All rendering (you'll add item rendering here)
- `js/main.js` — Game state and round flow (you'll add item drops here)
- `js/board.js` — Board/bench management

Read ALL of these before writing any code.

## What You're Building

A complete item system: components drop from rounds, can be equipped on units, and auto-combine into powerful completed items when two components are on the same unit.

## Item Data — Add to js/units.js (or create js/items.js)

You may create a new `js/items.js` file. If you do, add `<script src="js/items.js"></script>` to game.html AFTER units.js and BEFORE synergies.js.

### Base Components (8)
```js
const ITEM_COMPONENTS = {
    bf_sword:       { name: 'BF Sword',              emoji: '🗡️', stats: { attack: 15 } },
    chain_vest:     { name: 'Chain Vest',             emoji: '🛡️', stats: { hp: 200 } },
    giants_belt:    { name: "Giant's Belt",           emoji: '💪', stats: { hp: 300 } },
    recurve_bow:    { name: 'Recurve Bow',            emoji: '🏹', stats: { attackSpd: -0.1 } },
    needlessly_rod: { name: 'Needlessly Large Rod',   emoji: '🪄', stats: { attack: 20 } },
    negatron_cloak: { name: 'Negatron Cloak',         emoji: '🧥', stats: { damageReduction: 0.10 } },
    sparring_gloves:{ name: 'Sparring Gloves',        emoji: '🥊', stats: { critChance: 0.10 } },
    tear:           { name: 'Tear of the Goddess',    emoji: '💧', stats: { healPower: 0.20 } }
};
```

### Combined Items (8 recipes)
```js
const ITEM_RECIPES = {
    infinity_edge:    { name: 'Infinity Edge',        emoji: '⚔️✨', components: ['bf_sword', 'bf_sword'],
                        stats: { attack: 30, critChance: 0.25 } },
    blade_ruined_king:{ name: 'Blade of the Ruined King', emoji: '🗡️👑', components: ['bf_sword', 'recurve_bow'],
                        stats: { attack: 15 }, special: 'bork' },  // 3% target max HP bonus damage
    titans_resolve:   { name: "Titan's Resolve",      emoji: '🛡️💎', components: ['chain_vest', 'negatron_cloak'],
                        stats: { hp: 200, damageReduction: 0.15 } },
    warmogs:          { name: "Warmog's Armor",        emoji: '💪❤️', components: ['giants_belt', 'giants_belt'],
                        stats: { hp: 600 }, special: 'warmogs' },  // regen 2% maxHp/sec
    rapid_firecannon: { name: 'Rapid Firecannon',     emoji: '🏹⚡', components: ['recurve_bow', 'recurve_bow'],
                        stats: { attackSpd: -0.2, range: 1 } },
    archangels:       { name: "Archangel's Staff",    emoji: '🪄💧', components: ['needlessly_rod', 'tear'],
                        stats: { attack: 20, healPower: 0.30 }, special: 'archangels' },  // heals also deal 20% as damage
    hand_of_justice:  { name: 'Hand of Justice',      emoji: '🥊🗡️', components: ['sparring_gloves', 'bf_sword'],
                        stats: { attack: 15, critChance: 0.10 }, special: 'hoj' },  // on kill: heal 10% maxHp
    dragons_claw:     { name: "Dragon's Claw",        emoji: '🧥🐉', components: ['negatron_cloak', 'negatron_cloak'],
                        stats: { damageReduction: 0.25, elemResist: 0.20 } }
};
```

### Item System Rules

**Slots**: Each unit holds max **3 items** (components or combined). A completed item takes 1 slot.

**Auto-combine**: When a unit with 1 component receives a 2nd component, check all recipes. If the two components match a recipe, replace both with the combined item (freeing a slot). If no recipe matches, both stay as separate components.

**Item Bench**: Global array `gameState.itemBench` (max 10 slots) stores unequipped items. Items go here when dropped.

**Equipping**: Player clicks an item in the item bench → item becomes "selected" → player clicks a unit on board or bench → item equips to that unit. If unit has 3 items already, show warning and cancel.

**Items are permanent**: Cannot unequip. Selling a unit destroys its items. Show this clearly in tooltips.

**Item Drops**:
- Creep rounds (1, 2, 3): Always drop 1 random component after combat
- Every 5th round (5, 10, 15, 20...): Drop 1 random component after combat
- On any win: 10% chance to drop a random component
- Show notification: "Item dropped: [name] [emoji]!"

### Combat Integration

Item stats are applied at combat start, same time as synergy bonuses. Add this to the combat preparation phase.

**Stat application**:
- `attack`: add to unit.attack
- `hp`: add to unit.maxHp AND unit.hp
- `attackSpd`: add to unit.attackSpd (negative = faster)
- `damageReduction`: add to unit.damageReduction
- `critChance`: add to unit.critChance
- `healPower`: add to unit.healBonus
- `range`: add to unit.range
- `elemResist`: add to unit.elemResist

**Special effects** (need hooks in combat loop):
- `bork` (Blade of the Ruined King): On each attack, deal bonus damage = floor(target.maxHp × 0.03)
- `warmogs` (Warmog's Armor): Each tick, heal floor(unit.maxHp × 0.02 × dt) (2% max HP per second)
- `archangels` (Archangel's Staff): When this unit heals an ally, also deal floor(healAmount × 0.20) damage to the nearest enemy
- `hoj` (Hand of Justice): On kill, heal self for floor(unit.maxHp × 0.10)

### UI Changes

1. **Item Bench** — New row below the unit bench in game.html. 10 slots. Each shows item emoji. Selected item gets highlighted border. Add the HTML div and CSS for this.

2. **Shop/Bench Unit Tooltips** — Add "Items:" section showing equipped items with names and stats.

3. **Item Tooltip** — Hover over item in item bench → show name, stats, and list of possible combinations with items you currently have.

4. **Drop Notification** — Brief animated text near the game info area when an item drops.

5. **Recipe Preview** — When hovering a selected component over a unit that has another component, show what combined item they'd create (small preview text).

### Files to Modify

- **js/items.js** (NEW): Item data, equip logic, drop logic, recipe checking
- **js/combat.js**: Apply item stats at combat start. Hook special effects into damage/heal/tick logic.
- **js/ui.js**: Add renderItemBench(), update renderTooltip() for items, add drop notification
- **js/main.js**: Add item drops to round end logic. Add item bench click handlers. Add gameState.itemBench.
- **game.html**: Add item bench HTML div, script tag for items.js, CSS for item bench

### What NOT to Change
- Unit stats, synergy values, evolution criteria — leave all existing balance alone
- Combat targeting, movement, or core loop structure — just add hooks
- Economy (gold income, shop costs) — untouched
- Enemy generation — enemies don't use items

### Testing Mentally
After implementation, trace through:
1. Win round 1 (creep) → item drops → appears in item bench
2. Click item → click unit on board → item equips → shows in tooltip
3. Equip 2 matching components on same unit → auto-combines into completed item
4. Start combat → item stats visible in damage numbers
5. BotRK: each attack shows bonus % damage
6. Warmog's: unit slowly regenerates in combat
7. Unit at 3 items → try to equip 4th → warning shown
8. Sell unit with items → items are gone (not recovered)

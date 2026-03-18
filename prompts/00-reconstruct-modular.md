# Prompt: Reconstruct Auto-Battler as Modular JS

The original single-file game.html was accidentally destroyed during a bad modularization attempt. You must reconstruct the complete game from the specification documents, building directly into a modular file structure.

## FIRST: Read the specification documents
Read these files CAREFULLY before writing any code — they are the authoritative source of truth:
- `MECHANICS.md` — Complete game mechanics: every formula, every stat table, every rule, every edge case
- `DESIGN.md` — Architecture overview, unit roster, system descriptions

## Target File Structure

```
game.html              ← HTML + CSS + <script> tags only (NO inline JS logic)
js/units.js            ← Unit templates, constants, element/archetype data, creation/upgrade/evolution functions
js/synergies.js        ← Synergy calculation, bonus application
js/enemies.js          ← Enemy wave generation
js/economy.js          ← Gold income, interest, XP, leveling
js/shop.js             ← Shop rolling, buy/sell, pool weights
js/board.js            ← Board/bench grid management, unit placement
js/combat.js           ← Real-time combat engine
js/ui.js               ← All DOM rendering, tooltips, combat log
js/main.js             ← Global game state, init, round flow, event wiring
```

## CRITICAL ARCHITECTURE RULES

1. **Plain `<script>` tags** — NO `import`, NO `export`, NO `type="module"`. All scripts share global scope.
2. **Script load order in game.html**: units → synergies → enemies → economy → shop → board → combat → ui → main
3. **No classes** — Use plain functions and objects only. A global `gameState` object holds all state.
4. **All DOM manipulation in ui.js** — Other modules compute data, ui.js renders it.
5. **No external dependencies** — Pure vanilla JS.

---

## MODULE SPECIFICATIONS

### js/units.js

Define these globals:

#### ELEMENTS
```js
const ELEMENTS = {
    fire: { name: 'Fire', emoji: '🔥', color: '#ff4444', strong: 'wind', weak: 'water' },
    water: { name: 'Water', emoji: '💧', color: '#4488ff', strong: 'fire', weak: 'earth' },
    earth: { name: 'Earth', emoji: '🌿', color: '#44aa44', strong: 'water', weak: 'wind' },
    wind: { name: 'Wind', emoji: '💨', color: '#aa44ff', strong: 'earth', weak: 'fire' }
};
```

#### ARCHETYPES (see MECHANICS.md §7.2 for exact bonus values)
```js
const ARCHETYPES = {
    guardian: {
        name: 'Guardian', emoji: '🛡️',
        thresholds: [2, 4, 6],
        bonuses: [
            { stat: 'hp', value: 150 },
            { stat: 'hp', value: 350 },
            { stat: 'hp', value: 600, special: 'damageReduction', specialVal: 0.10 }
        ]
    },
    striker: {
        name: 'Striker', emoji: '⚔️',
        thresholds: [2, 4, 6],
        bonuses: [
            { stat: 'attackMult', value: 0.15 },
            { stat: 'attackMult', value: 0.30 },
            { stat: 'attackMult', value: 0.50, special: 'crit', specialVal: 0.10 }
        ]
    },
    predator: {
        name: 'Predator', emoji: '🐾',
        thresholds: [2, 4],
        bonuses: [
            { stat: 'attackSpdMult', value: 0.20 },
            { stat: 'attackSpdMult', value: 0.40 }
        ]
    },
    mystic: {
        name: 'Mystic', emoji: '🔮',
        thresholds: [2, 4],
        bonuses: [
            { stat: 'elemDmgMult', value: 0.20 },
            { stat: 'elemDmgMult', value: 0.40, special: 'elemResist', specialVal: 0.15 }
        ]
    },
    vanguard: {
        name: 'Vanguard', emoji: '🏰',
        thresholds: [2, 4],
        bonuses: [
            { stat: 'frontBonus', hpVal: 200, atkVal: 10 },
            { stat: 'frontBonus', hpVal: 450, atkVal: 25 }
        ]
    },
    sage: {
        name: 'Sage', emoji: '📖',
        thresholds: [2, 4, 6],
        bonuses: [
            { stat: 'healMult', value: 0.30 },
            { stat: 'healMult', value: 0.60, special: 'regen', specialVal: 100 },
            { stat: 'healMult', value: 1.00, special: 'regen', specialVal: 200 }
        ]
    }
};
```

#### UNIT_TEMPLATES — All 22 base units
Use exact stats from MECHANICS.md §12.1. Keys are snake_case.

| Key | Name | Cost | Type | Archetype | Element | HP | ATK | AtkSpd | Range | MoveSpd | Emoji | EvolvedForm |
|-----|------|------|------|-----------|---------|-----|-----|--------|-------|---------|-------|-------------|
| flame_warrior | Flame Warrior | 1 | warrior | striker | fire | 600 | 50 | 0.8 | 1 | 2.0 | ⚔️🔥 | fire_berserker |
| ember_scout | Ember Scout | 1 | assassin | predator | fire | 420 | 40 | 0.5 | 1 | 3.5 | 🗡️🔥 | flame_rogue |
| tide_hunter | Tide Hunter | 1 | warrior | vanguard | water | 580 | 48 | 0.8 | 1 | 2.0 | ⚔️💧 | tsunami_blade |
| frost_archer | Frost Archer | 1 | archer | striker | water | 380 | 52 | 0.7 | 3 | 2.0 | 🏹💧 | ice_sniper |
| stone_guard | Stone Guard | 1 | tank | guardian | earth | 750 | 30 | 1.0 | 1 | 1.5 | 🛡️🌿 | mountain_lord |
| zephyr_scout | Zephyr Scout | 1 | assassin | predator | wind | 400 | 42 | 0.45 | 1 | 4.0 | 🗡️💨 | storm_assassin |
| wind_archer | Wind Archer | 1 | archer | striker | wind | 370 | 50 | 0.65 | 4 | 2.2 | 🏹💨 | gale_sniper |
| magma_knight | Magma Knight | 2 | tank | guardian | fire | 900 | 35 | 1.0 | 1 | 1.3 | 🛡️🔥 | volcano_titan |
| coral_priest | Coral Priest | 2 | healer | sage | water | 450 | 25 | 1.2 | 2 | 1.5 | 💚💧 | ocean_sage |
| hydro_mage | Hydro Mage | 2 | mage | mystic | water | 400 | 65 | 1.0 | 3 | 1.5 | 🔮💧 | abyssal_mage |
| vine_archer | Vine Archer | 2 | archer | predator | earth | 400 | 55 | 0.7 | 3 | 1.8 | 🏹🌿 | thorn_ranger |
| earth_shaman | Earth Shaman | 2 | healer | sage | earth | 480 | 28 | 1.2 | 2 | 1.5 | 💚🌿 | gaia_priest |
| storm_mage | Storm Mage | 2 | mage | mystic | wind | 420 | 60 | 0.9 | 3 | 1.5 | 🔮💨 | tempest_wizard |
| sky_knight | Sky Knight | 2 | warrior | guardian | wind | 700 | 42 | 0.9 | 1 | 2.0 | ⚔️💨 | aegis_paladin |
| pyromancer | Pyromancer | 3 | mage | sage | fire | 380 | 80 | 1.0 | 3 | 1.5 | 🔮🔥 | inferno_mage |
| golem | Golem | 3 | tank | vanguard | earth | 1100 | 45 | 1.2 | 1 | 1.0 | 🛡️🌿 | titan |
| fire_dragon | Fire Dragon | 4 | mage | striker | fire | 1100 | 85 | 0.9 | 2 | 1.8 | 🐉🔥 | null |
| leviathan | Leviathan | 4 | tank | guardian | water | 1300 | 60 | 1.0 | 1 | 1.5 | 🐉💧 | null |
| phoenix | Phoenix | 5 | mage | sage | fire | 900 | 110 | 0.8 | 3 | 2.5 | 🔥✨ | null |
| world_tree | World Tree | 5 | healer | sage | earth | 1200 | 20 | 1.5 | 4 | 0.5 | 🌳✨ | null |

Note: We need exactly 22 base units. The table above has 20. We're missing 2 base units. Check DESIGN.md for the full list. There should be additional cost-1 or cost-2 units. If the docs only show 20 base units, that's fine — use what's documented.

#### EVOLVED_TEMPLATES — All 16 evolved forms
Use exact stats from MECHANICS.md §12.2:

| Key | Name | BaseCost | Type | Archetype | Element | HP | ATK | AtkSpd | Range | MoveSpd | Ability |
|-----|------|----------|------|-----------|---------|-----|-----|--------|-------|---------|---------|
| fire_berserker | Fire Berserker | 1 | warrior | striker | fire | 750 | 70 | 0.6 | 1 | 2.5 | Higher base stats (burn approximation) |
| flame_rogue | Flame Rogue | 1 | assassin | predator | fire | 500 | 55 | 0.4 | 1 | 4.0 | Targets backline (assassin type) |
| volcano_titan | Volcano Titan | 2 | tank | guardian | fire | 1200 | 50 | 1.0 | 1 | 1.2 | 200 AoE fire damage on death |
| inferno_mage | Inferno Mage | 3 | mage | sage | fire | 450 | 110 | 1.0 | 4 | 1.5 | Splash: 30% damage to enemies within 1.5 of target |
| tsunami_blade | Tsunami Blade | 1 | warrior | vanguard | water | 700 | 65 | 0.75 | 1 | 2.2 | Stacking 5% multiplicative slow |
| ice_sniper | Ice Sniper | 1 | archer | striker | water | 420 | 75 | 0.65 | 5 | 2.0 | Every 3rd attack adds +0.5s to target cooldown |
| ocean_sage | Ocean Sage | 2 | healer | sage | water | 550 | 35 | 1.0 | 3 | 1.5 | Heals also grant 50 shield |
| abyssal_mage | Abyssal Mage | 2 | mage | mystic | water | 480 | 85 | 0.9 | 4 | 1.5 | +25% damage vs tank type units |
| mountain_lord | Mountain Lord | 1 | tank | guardian | earth | 950 | 45 | 1.0 | 1 | 1.5 | Taunt (planned — not yet implemented) |
| thorn_ranger | Thorn Ranger | 2 | archer | predator | earth | 480 | 70 | 0.6 | 4 | 2.0 | Attackers take 15 reflect damage |
| gaia_priest | Gaia Priest | 2 | healer | sage | earth | 580 | 40 | 1.0 | 3 | 1.5 | Heals 2 lowest-HP allies |
| titan | Titan | 3 | tank | vanguard | earth | 1500 | 60 | 1.3 | 1 | 0.8 | Every 4th attack stuns adjacent enemies (+0.5s cooldown) |
| storm_assassin | Storm Assassin | 1 | assassin | predator | wind | 470 | 55 | 0.35 | 1 | 4.5 | On kill: 50 damage to nearest enemy |
| gale_sniper | Gale Sniper | 1 | archer | striker | wind | 420 | 70 | 0.6 | 5 | 2.2 | Target's damage reduction × 0.8 |
| tempest_wizard | Tempest Wizard | 2 | mage | mystic | wind | 500 | 80 | 0.8 | 4 | 1.5 | Attacks bounce to 1 extra target at 50% damage |
| aegis_paladin | Aegis Paladin | 2 | warrior | guardian | wind | 900 | 55 | 0.85 | 1 | 2.0 | Combat start: +100 shield to all allies |

#### EVOLUTIONS — Criteria for each evolution (see MECHANICS.md §13)
```js
const EVOLUTIONS = {
    flame_warrior:  { into: 'fire_berserker',  criteria: { stars: 3 } },
    ember_scout:    { into: 'flame_rogue',     criteria: { stars: 3 } },
    magma_knight:   { into: 'volcano_titan',   criteria: { synergy: 'guardian', count: 4 } },
    pyromancer:     { into: 'inferno_mage',    criteria: { stars: 2, synergy: 'sage', count: 2 } },
    tide_hunter:    { into: 'tsunami_blade',   criteria: { stars: 3 } },
    frost_archer:   { into: 'ice_sniper',      criteria: { stars: 3 } },
    coral_priest:   { into: 'ocean_sage',      criteria: { synergy: 'sage', count: 4 } },
    hydro_mage:     { into: 'abyssal_mage',    criteria: { stars: 2, synergy: 'mystic', count: 2 } },
    stone_guard:    { into: 'mountain_lord',   criteria: { stars: 3 } },
    vine_archer:    { into: 'thorn_ranger',    criteria: { synergy: 'predator', count: 4 } },
    earth_shaman:   { into: 'gaia_priest',     criteria: { stars: 2, synergy: 'sage', count: 2 } },
    golem:          { into: 'titan',           criteria: { stars: 2, synergy: 'guardian', count: 4 } },
    zephyr_scout:   { into: 'storm_assassin',  criteria: { stars: 3 } },
    wind_archer:    { into: 'gale_sniper',     criteria: { stars: 3 } },
    storm_mage:     { into: 'tempest_wizard',  criteria: { stars: 2, synergy: 'mystic', count: 2 } },
    sky_knight:     { into: 'aegis_paladin',   criteria: { synergy: 'guardian', count: 4 } }
};
```

#### SHOP_POOL_KEYS
Array of all base unit keys that can appear in the shop (all base units, NOT evolved forms).

#### Functions:
- `createUnit(templateKey)` — Create a unit instance from a template. Returns object with: key, name, emoji, cost, type, archetype, element, hp, maxHp, attack, attackSpd, range, moveSpd, stars: 1, evolved: false, evolvedForm, items: []
- `upgradeUnit(unit)` — Increase star level. Recalculate HP and ATK using `floor(base × 1.8^(stars-1))`. Other stats (attackSpd, range, moveSpd) are NOT affected by stars.
- `checkEvolution(unit, gameState)` — Check if unit meets evolution criteria. If yes, transform in-place: keep stars, update stats to evolved template × star multiplier, set evolved: true, update key/name/emoji.
- `getElementMultiplier(attackerElem, defenderElem)` — Returns 1.3 (strong), 0.7 (weak), or 1.0 (neutral/same/null).
- `getSellValue(unit)` — Returns `cost × 3^(stars-1)`.

### js/synergies.js

- `updateActiveSynergies(gameState)` — Count archetypes and elements from board units only (not bench). Store in gameState.activeSynergies (archetype→count) and gameState.activeElements (element→count).
- `getActiveSynergyBonus(gameState, archetypeKey)` — Returns highest active tier bonus or null.
- `applySynergyBonuses(gameState, combatUnits, side)` — Apply all archetype bonuses. Rules per MECHANICS.md §7.2:
  - Only highest tier applies (no stacking across tiers)
  - HP bonuses: flat, added to maxHp AND current hp
  - ATK%: multiply attack stat
  - Attack speed: `attackSpd = base × (1 - bonus)` (lower = faster)
  - Vanguard front rows: units with combat cy >= 5
  - Heal power: stored as healBonus
  - Regen: stored as regenPerSec = specialVal / 5
  - Crit chance: stored as critChance
  - Damage reduction: stored as damageReduction
  - Element resist: stored as elemResist
  - Also: Aegis Paladin evolved → +100 shield to all allies at combat start

### js/enemies.js

- `generateCreepWave(round)` — Fixed PvE creeps (MECHANICS.md §10.1):
  - Round 1: 1× Slime (200 HP, 15 ATK, 1.2s speed)
  - Round 2: 2× Slime (200 HP, 15 ATK, 1.2s speed)
  - Round 3: 1× Wolf (350 HP, 30 ATK, 0.8s) + 2× Slime (250 HP, 20 ATK, 1.2s)
  - Creeps: type warrior, no archetype, no element
- `generateEnemyWave(round)` — Round 4+ (MECHANICS.md §10.2):
  - gold_budget = floor(3 + round × 1.5)
  - max_unit_cost = round < 6 ? 2 : round < 10 ? 3 : round < 15 ? 4 : 5
  - max_units = 7
  - Randomly pick units from SHOP_POOL_KEYS filtered by cost ≤ max_unit_cost
  - Round 8+: 30% chance each unit is 2-star (hp × 1.8, attack × 1.8)
- `placeEnemies(enemies)` — Random placement on enemy 4×7 grid

### js/economy.js

- `calculateIncome(gameState)` — Returns { base: 5, interest: min(5, floor(gold/10)), total }
- `XP_TABLE` = [0, 2, 4, 8, 12, 20, 32, 48, 68]
- `addXP(gameState, amount)` — Add XP, handle level-up(s). Update unitCap = level.
- `buyXP(gameState)` — Spend 4 gold for 4 XP. Check affordability.
- Free XP: 2 per round (applied in main.js round flow)

### js/shop.js

- `SHOP_WEIGHTS` — Level-gated cost tier table (MECHANICS.md §5):
```js
const SHOP_WEIGHTS = {
    1: [100, 0, 0, 0, 0],
    2: [100, 0, 0, 0, 0],
    3: [75, 25, 0, 0, 0],
    4: [55, 30, 15, 0, 0],
    5: [45, 33, 20, 2, 0],
    6: [30, 35, 25, 10, 0],
    7: [20, 30, 30, 15, 5],
    8: [15, 20, 30, 25, 10]   // 8+ uses this row
};
```
- `rollShop(gameState)` — Generate 5 shop cards. For each card: pick cost tier from weighted table, then pick random unit of that cost from SHOP_POOL_KEYS.
- `buyUnit(gameState, shopIndex)` — Purchase unit from shop slot. Check gold. Add to bench (find empty slot). Auto-merge: if buying creates 3 copies of same unit at same star level, merge to star+1. Cascading merges. Check evolution after merge. Mark shop slot as sold.
- `sellUnit(gameState, unit)` — Remove unit, add gold = getSellValue(unit).
- `refreshShop(gameState)` — Spend 2 gold, re-roll shop.

### js/board.js

- Board: 4×7 2D array (gameState.board[row][col], null = empty)
- Bench: array of 9 slots (gameState.bench[0..8], null = empty)
- `placeUnit(gameState, unit, row, col)` — Place on board if under unit cap
- `removeFromBoard(gameState, row, col)` — Remove unit from board position
- `addToBench(gameState, unit)` — Find first empty bench slot, place unit. Return false if bench full.
- `removeFromBench(gameState, index)` — Remove unit from bench slot
- `getPlayerBoardUnits(gameState)` — Return array of all units on the board
- `getPlayerBenchUnits(gameState)` — Return array of all units on bench
- `getAllPlayerUnits(gameState)` — Board + bench combined
- `countBoardUnits(gameState)` — Number of units on board
- `swapUnits(gameState, from, to)` — Swap two positions (board↔board, board↔bench, bench↔bench)

### js/combat.js

Full real-time combat engine. See MECHANICS.md §8 for all rules.

- `startCombat(gameState)` — Prepare player and enemy combat units. Map board positions to combat coordinates (player: cy = row + 4, cx = col; enemy: cy = 3 - row, cx = col). Apply synergy bonuses. Set initial cooldowns (attackSpd × 0.5). Begin requestAnimationFrame loop.

- **Targeting** (MECHANICS.md §8.2 — Sticky):
  - Assassins → furthest alive enemy
  - Healers → lowest HP% ally (for heal target, but they still attack nearest enemy)
  - All others → nearest alive enemy
  - Once acquired, keep target until it dies
  - Chase timeout: if chasing for attackSpd × 3 seconds without attacking, look for nearest alternative excluding current target. Only switch if alternative is 30%+ closer (altDist < currentDist × 0.7)

- **Movement**: Move toward target at moveSpd cells/second. Direction = normalized vector from unit to target.

- **Attack Cycle** (MECHANICS.md §8.4):
  1. Check if target within range + 0.3 buffer
  2. If in range, decrement cooldown by dt
  3. When cooldown ≤ 0: attack, reset cooldown = attackSpd

- **Damage Formula** (MECHANICS.md §8.5):
  1. base_damage = attacker.attack
  2. element_mult = getElementMultiplier(attacker.element, target.element)
  3. damage = floor(base_damage × element_mult)
  4. If elemDmgBonus > 0 AND attacker has element: damage = floor(damage × (1 + elemDmgBonus))
  5. Crit: if critChance > 0 AND random() < critChance: damage = floor(damage × 1.5)
  6. Damage reduction: target.damageReduction. Gale Sniper: DR × 0.8. Elem resist adds to DR for elemental attacks.
  7. damage = floor(damage × (1 - damageReduction))
  8. damage = max(1, damage)
  9. Shield absorbs first, remainder hits HP
  10. target.hp -= remaining damage

- **Healer Behavior** (MECHANICS.md §8.6):
  - Heal target: lowest HP% ally (not self) with HP < 95%
  - Heal amount: floor(attack × 1.5 × (1 + healBonus))
  - World Tree: heals ALL alive allies
  - Gaia Priest: heals 2 lowest-HP allies
  - Ocean Sage: heal also grants 50 shield

- **HP Regen** (MECHANICS.md §8.7): regenAccum += regenPerSec × dt. When ≥ 1, heal floor(regenAccum).

- **All 16 Evolved Abilities** (MECHANICS.md §9):
  - Fire Berserker: just better stats (no special code needed)
  - Flame Rogue: assassin type handles this (targets furthest)
  - Volcano Titan: on death → 200 damage to all enemies within distance 2
  - Inferno Mage: each attack → 30% damage to enemies within 1.5 of target
  - Tsunami Blade: each attack → target.moveSpd *= 0.95
  - Ice Sniper: track hit count, every 3rd hit → target.attackCooldown += 0.5
  - Ocean Sage: handled in healer section
  - Abyssal Mage: if target.type === 'tank' → damage × 1.25
  - Mountain Lord: taunt NOT YET IMPLEMENTED (skip, add comment)
  - Thorn Ranger: when taking damage → attacker takes 15 damage
  - Gaia Priest: handled in healer section
  - Titan: track attack count, every 4th → all enemies within 1.5 get +0.5s cooldown
  - Storm Assassin: on kill → 50 damage to nearest alive enemy
  - Gale Sniper: handled in damage formula
  - Tempest Wizard: each attack → 50% damage to 1 random other alive enemy
  - Aegis Paladin: handled in synergies (combat start shield)
  - Phoenix: on first death → restore to 50% maxHp, set hasRevived = true

- **Delta time**: capped at 0.05s per tick
- **Combat end**: when all units on one (or both) sides are dead
- **Result**: win → advance round. lose → damage = 2 + (surviving_enemies × 2). draw → no damage, no advance.
- **Round progression**: rounds only advance on WIN. Lose/draw = retry same round.

### js/ui.js

All DOM rendering functions. Reference elements by id from game.html.

- `renderBoard(gameState)` — Draw 4×7 player grid. Each cell shows unit emoji if occupied. Element-colored borders. Evolved units get golden glow. Click handler to select/place/swap.
- `renderEnemyBoard(enemies)` — Draw 4×7 enemy grid during combat.
- `renderBench(gameState)` — Draw 9 bench slots with units.
- `renderShop(gameState)` — Draw 5 shop cards. Show unit name, cost, element emoji, archetype emoji, type. Sold-out slots greyed. Click to buy.
- `renderSynergyBar(gameState)` — Show active archetypes with count and tier indicator (bronze/silver/gold). Show element counts.
- `renderGameInfo(gameState)` — HP bar, gold count, level, XP progress, round number.
- `renderTooltip(unit, x, y)` — Popup showing: name, stars, all 4 tags (type/archetype/element/evolved), current stats, evolution progress, ability description if evolved.
- `addCombatLog(message)` — Append to scrolling combat log.
- `renderCombat(allCombatUnits)` — Render the 8-row combined grid during combat. Show HP bars. Show damage numbers briefly.
- `renderGameOver(round)` — Game over screen with final round, restart button.
- `hideTooltip()` — Remove tooltip.

### js/main.js

- Define global `gameState` object:
```js
let gameState = {
    hp: 100,
    gold: 10,
    level: 1,
    xp: 0,
    xpToLevel: 2,  // XP_TABLE[1]
    round: 1,
    phase: 'planning',
    unitCap: 1,
    board: [],      // 4×7 2D array, initialized by initBoard()
    bench: [],      // 9 slots
    shop: [],       // 5 shop card slots
    activeSynergies: {},
    activeElements: {},
    selectedUnit: null,
    selectedFrom: null  // { type: 'board'|'bench', row, col } or { type: 'bench', index }
};
```

- `initGame()` — Initialize board/bench arrays, roll first shop, update synergies, render everything.
- `startPlanningPhase()` — Award income (base + interest), give 2 free XP, check all evolutions, roll new shop, update synergies, render.
- `startCombatPhase()` — Generate enemies (creep or scaling), start combat with callback for result.
- `handleCombatEnd(result, survivingEnemies)` — Process result: win → advance round. Loss → take damage, check game over. Draw → no damage. Then start next planning phase (unless game over).
- `handleBoardClick(row, col)` — If unit selected: place or swap. If cell has unit: select it. If empty and unit selected from bench: place (check cap).
- `handleBenchClick(index)` — Select or swap bench units. Double-click to sell (or have a sell button).
- `handleShopClick(index)` — Buy unit at shop index.
- `resetGame()` — Reset all state, re-init.
- Event listeners wired in an init function or DOMContentLoaded.

### game.html

HTML structure:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Auto Battler</title>
    <style>
        /* ALL CSS HERE — dark theme */
    </style>
</head>
<body>
    <div id="game-container">
        <div id="game-info"><!-- HP, gold, level, XP, round --></div>
        <div id="synergy-bar"><!-- Active synergies --></div>
        <div id="enemy-board"><!-- 4×7 enemy grid --></div>
        <div id="player-board"><!-- 4×7 player grid --></div>
        <div id="bench"><!-- 9 bench slots --></div>
        <div id="shop"><!-- 5 shop cards + refresh/buy XP buttons --></div>
        <div id="controls">
            <button id="btn-refresh">Refresh (2g)</button>
            <button id="btn-buy-xp">Buy XP (4g)</button>
            <button id="btn-start-combat">Start Combat</button>
            <button id="btn-sell">Sell Unit</button>
        </div>
        <div id="combat-log"><!-- Scrolling log --></div>
        <div id="tooltip" style="display:none;"></div>
        <div id="game-over" style="display:none;"><!-- Game over screen --></div>
    </div>

    <script src="js/units.js"></script>
    <script src="js/synergies.js"></script>
    <script src="js/enemies.js"></script>
    <script src="js/economy.js"></script>
    <script src="js/shop.js"></script>
    <script src="js/board.js"></script>
    <script src="js/combat.js"></script>
    <script src="js/ui.js"></script>
    <script src="js/main.js"></script>
</body>
</html>
```

CSS: Dark theme (#1a1a2e background, #e0e0e0 text). Grid cells ~60px. Element colors for borders. Gold = #ffd700. HP bar red/green. Synergy tier colors: bronze=#cd7f32, silver=#c0c0c0, gold=#ffd700. Shop cards as horizontal row. Evolved units have box-shadow glow. Tooltip positioned absolute near cursor.

## VERIFICATION CHECKLIST

After writing all files, verify:
- [ ] No `import` or `export` statements anywhere
- [ ] No class definitions (use plain functions/objects)
- [ ] All 22 base units defined with correct stats
- [ ] All 16 evolved forms defined with correct stats
- [ ] All 16 evolution criteria match MECHANICS.md §13
- [ ] Shop weight table matches MECHANICS.md §5
- [ ] Damage formula matches MECHANICS.md §8.5
- [ ] All 6 archetype bonuses match MECHANICS.md §7.2
- [ ] Element damage cycle correct: Fire>Wind>Earth>Water>Fire
- [ ] Star scaling: 1.8^(stars-1) for HP and ATK only
- [ ] Sell value: cost × 3^(stars-1)
- [ ] Income: 5 + min(5, floor(gold/10))
- [ ] Creep rounds 1-3 correct per §10.1
- [ ] Enemy scaling formula correct per §10.2
- [ ] No function/variable used before defined (respect load order)

## IMPORTANT
- Build each file completely. Do not leave TODOs or placeholder comments.
- Every formula, every stat, every threshold must match MECHANICS.md exactly.
- Test your logic mentally as you write — trace through a round of gameplay.
- The game must be fully playable when game.html is opened in a browser.

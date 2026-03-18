# Prompt 11: Combat Engine Rebuild — Grid & Movement Foundation

## Goal
Replace the current combat system (array-order targeting, no movement) with a proper grid-based tactical combat engine where units move toward targets, respect grid positions, and attack based on range. This is the foundation for mana, abilities, and status effects in future prompts.

## Context
- **Current state**: `main-v2.js` has `initCombat`, `combatTick`, `findTarget`, `performAttack`. Units don't move — targeting is array-order (first alive enemy, last alive for assassins). The combat board in `ui-v2.js` renders units at fixed grid positions that never change.
- **Target state**: Units occupy grid cells and physically move toward targets. Melee units walk up to attack. Ranged units attack from distance. Assassins dash to the backline. The combat board visually reflects unit positions changing each tick.
- **Script order**: `units.js → save.js → gacha.js → teams.js → hub.js → items.js → missions.js → ui-v2.js → main-v2.js`
- **Pattern**: All `var`, global scope, NO ES modules, NO import/export

## The Combat Grid

The battlefield is a **4-row × 14-column** unified grid:
- **Columns 0–6**: Player side (column 0 = player back, column 6 = player front)
- **Columns 7–13**: Enemy side (column 7 = enemy front, column 13 = enemy back)

Player units start at their team builder positions (rows 0–3, cols 0–6).
Enemy units start mirrored (rows 0–3, cols 7–13, placed front-to-back starting at col 7).

```
Col:  0  1  2  3  4  5  6 | 7  8  9  10 11 12 13
      [--- Player Side ---] [--- Enemy Side ------]
      back            front  front            back
```

### Grid Data Structure
```js
// In combatState:
combatState.grid = [];  // 4 rows × 14 cols, each cell = unit reference or null

// Each unit gets:
unit.gridRow = r;  // 0-3
unit.gridCol = c;  // 0-13
```

## Unit Types & Movement/Range

Each unit type has a base movement speed and attack range:

| Type | Move Speed (cells/tick at 20fps) | Attack Range (cells) | Behavior |
|---|---|---|---|
| warrior | 1 cell/0.5s | 1 (adjacent) | Move toward nearest enemy, attack when adjacent |
| tank | 1 cell/0.6s | 1 (adjacent) | Move toward nearest enemy, slowest movement |
| assassin | 1 cell/0.3s | 1 (adjacent) | At combat start: dash to enemy back row (col 12-13). Then attack normally. |
| archer | 1 cell/0.5s | 3 cells | Move until within range, then stop and attack |
| mage | 1 cell/0.5s | 4 cells | Move until within range, then stop and attack |
| healer | 1 cell/0.5s | 3 cells (heal range) | Move toward injured allies; heal instead of attack |

**Movement rules:**
- Movement happens BEFORE attack each tick (if not in range of target)
- Units move one cell at a time toward their target using BFS shortest path
- Units cannot pass through occupied cells (friend or foe)
- If the shortest path is blocked, the unit waits (does not attack)
- Diagonal movement is NOT allowed — only up/down/left/right (4-directional)
- A unit stops moving once its target is within attack range

**Distance calculation:** Manhattan distance: `|row1 - row2| + |col1 - col2|`

## BFS Pathfinding

```js
function findPath(grid, fromRow, fromCol, toRow, toCol) {
    // BFS on the 4×14 grid
    // Returns array of {row, col} steps (excluding start, including destination)
    // Returns null if no path exists
    // Cells occupied by other units are blocked (except the destination cell)
    // 4-directional movement only
}
```

The unit only needs the NEXT cell in the path (not the full path), so BFS can return just the first step. Recalculate path each tick (targets may move or die).

## Targeting Changes

Replace the current `findTarget()` with grid-aware targeting:

```js
function findTarget(unit, enemyPool) {
    // Filter to alive enemies
    // For each alive enemy, calculate Manhattan distance from unit's grid position
    // Return target based on unit type:
    //   - warrior/tank: closest enemy (lowest distance)
    //   - archer/mage: closest enemy (lowest distance) — they'll stop at range
    //   - assassin: lowest HP enemy in back rows (cols 11-13 for enemies, cols 0-2 for players)
    //              fallback to closest if no backline targets
    //   - healer: lowest HP% ally that is not at full HP
    //              fallback to closest enemy if all allies full HP
    // Tie-breaking: prefer lower row index, then lower col index
}
```

## Assassin Dash

At the START of combat (first tick only), assassins perform a special dash:
1. Find target (lowest HP enemy in back rows)
2. Teleport to an empty cell adjacent to that target (prefer cell closest to their starting position)
3. If no adjacent cell is free, move normally instead

This happens once. After the dash, assassins move and attack normally.

## Attack Range Checking

```js
function isInRange(attacker, target) {
    var range = getAttackRange(attacker.type);
    var dist = Math.abs(attacker.gridRow - target.gridRow) + Math.abs(attacker.gridCol - target.gridCol);
    return dist <= range;
}

function getAttackRange(type) {
    if (type === 'archer') return 3;
    if (type === 'mage') return 4;
    if (type === 'healer') return 3;
    return 1; // warrior, tank, assassin
}
```

## Updated combatTick Flow

```
1. Check win/loss conditions (unchanged)
2. Process regen/healing ticks (unchanged)
3. For each alive unit:
   a. If no target or target dead → find new target
   b. If target exists and in range → attack (performAttack unchanged for now)
   c. If target exists but NOT in range → move one step toward target (BFS)
   d. Update unit.gridRow and unit.gridCol
   e. Update grid[row][col] references
```

## Visual Changes (ui-v2.js)

### renderCombatBoard() — Unified Grid
Change from rendering two separate 4×7 grids to a single 4×14 grid:

```
[Row 0: cols 0-6 = player back | cols 7-13 = enemy back]
[Row 1: ...]
[Row 2: ...]
[Row 3: cols 0-6 = player front | cols 7-13 = enemy front]
```

- Remove the divider row
- Add a visual center line between cols 6 and 7 (CSS border or subtle color change)
- Units visually move between cells as their gridRow/gridCol changes
- Shrink cell size slightly to fit 14 columns (current cells are ~40px, target ~28px)
- Keep the existing HP bar, emoji, name, item icons per unit

### CSS Adjustments
- Combat board: `grid-template-columns: repeat(14, 1fr)`
- Cell size: ~28px wide (down from ~40px)
- Player cells: subtle blue tint background
- Enemy cells: subtle red tint background
- Center divider: 2px solid border between col 6 and col 7

## What NOT To Change
- `initCombat()` — keep the unit array building, synergy application, item stat application. Just also populate `combatState.grid`.
- `performAttack()` — keep ALL existing damage calculation, item specials, on-kill effects, revive, etc. The attack logic is fine; only the targeting and movement around it change.
- `onWaveCombatEnd()`, `trackWaveDamage()`, `calculateStarRating()` — unchanged
- `placeEnemiesOnBoard()` — update to use the unified grid (cols 7–13) instead of a separate `enemyBoard`
- Wave transition, mission results — unchanged

## Testing Checklist
After implementation, these should all work:
- [ ] Player units start at their team builder positions (cols 0-6)
- [ ] Enemy units start on the enemy side (cols 7-13)
- [ ] Melee units (warrior, tank) walk toward enemies and stop when adjacent
- [ ] Ranged units (archer, mage) walk toward enemies and stop within their range
- [ ] Healers move toward injured allies and heal them
- [ ] Assassins dash to enemy backline at combat start
- [ ] Units find new targets when current target dies
- [ ] Units cannot walk through each other
- [ ] Combat visually shows units moving across the 14-column grid
- [ ] All existing item specials still work (BotRK, Warmog's, etc.)
- [ ] All existing synergy effects still apply (fire burn, earth shield, etc.)
- [ ] Win/loss detection still works
- [ ] Wave transitions still work (heal between waves, reposition)
- [ ] Star rating calculation unchanged
- [ ] Grind missions still generate and play correctly

## File Changes
- **main-v2.js**: Modify `initCombat`, `combatTick`, `findTarget`. Add `findPath`, `isInRange`, `getAttackRange`, `moveUnit`. Keep `performAttack` mostly unchanged.
- **ui-v2.js**: Modify `renderCombatBoard`, `placeEnemiesOnBoard`. Update CSS for 14-column grid. Remove `enemyBoard` global (use `combatState.grid` instead).
- Do NOT create new files. All changes go in existing files.

# Prompt 11b: Fix Combat Grid — Vertical Orientation (Top-to-Bottom)

## Problem
Chunk 1 implemented a **4×14 horizontal grid** (left-to-right: cols 0-6 player, cols 7-13 enemy). This is wrong. The team builder uses a 4×7 vertical grid, and the battlefield should flow **top-to-bottom** — enemies at the top, player units at the bottom. The current implementation also shows enemies not appearing on their side.

## Correct Grid: 8 rows × 7 columns (vertical)

```
Row:  0  [--- Enemy back row ---]     (cols 0-6)
      1  [--- Enemy row 2 ------]
      2  [--- Enemy row 3 ------]
      3  [--- Enemy front row ---]
      ─────── center line ───────
      4  [--- Player front row --]
      5  [--- Player row 2 -----]
      6  [--- Player row 3 -----]
      7  [--- Player back row ---]
```

- **Rows 0–3**: Enemy side (row 0 = enemy back, row 3 = enemy front)
- **Rows 4–7**: Player side (row 4 = player front, row 7 = player back)
- **Columns 0–6**: Same width throughout, matches team builder exactly

### Team Builder → Combat Grid Mapping
Player units' team builder positions (row 0-3, col 0-6) map to combat grid as:
```js
combatGridRow = 7 - teamBuilderRow;  // row 0 (back) → row 7, row 3 (front) → row 4
combatGridCol = col;                  // unchanged
```

### Enemy Placement
Enemies fill front-to-back starting at row 3 (enemy front):
```js
function placeEnemiesOnBoard(enemies) {
    var idx = 0;
    for (var row = 3; row >= 0 && idx < enemies.length; row--) {
        for (var col = 0; col < 7 && idx < enemies.length; col++) {
            enemies[idx].gridRow = row;
            enemies[idx].gridCol = col;
            enemies[idx].side = 'enemy';
            idx++;
        }
    }
}
```

## Changes Required

### main-v2.js

#### 1. `initCombat()` — Fix player grid position mapping
Change how player units get their gridRow:
```js
// OLD (wrong — uses team builder row directly on a 4×14 grid):
u.gridRow = r;
u.gridCol = c;

// NEW (maps to bottom half of 8×7 grid):
u.gridRow = 7 - r;  // team row 0 (back) → combat row 7 (back), team row 3 (front) → combat row 4 (front)
u.gridCol = c;       // column unchanged
```
Also update `_origRow` storage to use the NEW gridRow (so wave repositioning works).

#### 2. `buildCombatGrid()` — Change dimensions to 8×7
```js
function buildCombatGrid(playerUnits, enemyUnits) {
    var grid = [];
    for (var r = 0; r < 8; r++) {      // 8 rows, not 4
        grid[r] = [];
        for (var c = 0; c < 7; c++) {   // 7 cols, not 14
            grid[r][c] = null;
        }
    }
    // Place player units (rows 4-7)
    for (var p = 0; p < playerUnits.length; p++) {
        var pu = playerUnits[p];
        if (pu.hp > 0) {
            grid[pu.gridRow][pu.gridCol] = pu;
        }
    }
    // Place enemy units (rows 0-3)
    for (var e = 0; e < enemyUnits.length; e++) {
        var eu = enemyUnits[e];
        if (eu.hp > 0) {
            grid[eu.gridRow][eu.gridCol] = eu;
        }
    }
    return grid;
}
```

#### 3. `findPathNextStep()` — Change grid dimensions
```js
var rows = 8, cols = 7;  // was rows = 4, cols = 14
```

#### 4. `performAssassinDash()` — Change backline from columns to rows
```js
// OLD (column-based backline):
// player assassin targets enemy cols 11-13
// enemy assassin targets player cols 0-2

// NEW (row-based backline):
var backRowMin, backRowMax;
if (unit.side === 'player') {
    backRowMin = 0; backRowMax = 1;   // enemy back rows (rows 0-1)
} else {
    backRowMin = 6; backRowMax = 7;   // player back rows (rows 6-7)
}
// Filter targets by gridRow (not gridCol):
if (e.gridRow >= backRowMin && e.gridRow <= backRowMax) { ... }
```
Also fix bounds check:
```js
if (ar < 0 || ar >= 8 || ac < 0 || ac >= 7) continue;  // was ar >= 4, ac >= 14
```

#### 5. `findTarget()` — Change assassin backline targeting from columns to rows
```js
// OLD:
backColMin = 11; backColMax = 13;  // enemy back cols
backColMin = 0; backColMax = 2;    // player back cols

// NEW: use backRowMin/backRowMax instead
var backRowMin, backRowMax;
if (unit.side === 'player') {
    backRowMin = 0; backRowMax = 1;   // enemy back rows
} else {
    backRowMin = 6; backRowMax = 7;   // player back rows
}
// Check gridRow instead of gridCol:
if (alive[b].gridRow >= backRowMin && alive[b].gridRow <= backRowMax) { ... }
```

#### 6. `combatTick()` — No structural changes needed
The movement, attack, and dead-unit cleanup logic uses `unit.gridRow`/`unit.gridCol` generically, so it works with the new 8×7 grid. Just make sure `combatState.grid` is the 8×7 grid.

### ui-v2.js

#### 7. `placeEnemiesOnBoard()` — Place in rows 0-3 (top of grid)
```js
function placeEnemiesOnBoard(enemies) {
    var idx = 0;
    for (var row = 3; row >= 0 && idx < enemies.length; row--) {
        for (var col = 0; col < 7 && idx < enemies.length; col++) {
            enemies[idx].gridRow = row;
            enemies[idx].gridCol = col;
            enemies[idx].side = 'enemy';
            idx++;
        }
    }
}
```

#### 8. `renderCombatBoard()` — Render 8×7 vertical grid
```js
function renderCombatBoard() {
    var boardEl = document.getElementById('combat-board');
    if (!combatState) return;
    var grid = combatState.grid;
    var html = '';

    for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 7; c++) {
            var cssClass = r <= 3 ? 'enemy-row' : 'player-row';
            var borderStyle = r === 4 ? ' border-top:2px solid #555;' : '';
            var unit = grid ? grid[r][c] : null;
            // ... rest of unit rendering unchanged ...
        }
    }
    boardEl.innerHTML = html;
}
```

#### 9. `healBoardUnits()` — Fix wave repositioning
When restoring player units between waves, convert back from combat grid to combatBoard (4×7):
```js
// _origRow and _origCol are now in combat grid coordinates (rows 4-7)
// combatBoard is still 4×7 (team builder coordinates)
// Convert: teamRow = 7 - combatRow
var teamRow = 7 - u._origRow;
var teamCol = u._origCol;
if (!combatBoard[teamRow][teamCol]) {
    combatBoard[teamRow][teamCol] = u;
    u.gridRow = u._origRow;  // keep combat row for next wave init
    u.gridCol = u._origCol;
    placed = true;
}
```
Also update the fallback placement loop to iterate player-side team rows (0-3 on combatBoard).

### game-v2.html

#### 10. CSS — Change grid to 8 rows × 7 columns
```css
.combat-board {
    display: grid;
    grid-template-columns: repeat(7, 1fr);   /* was 14 */
    gap: 2px;
}
.combat-cell {
    min-height: 36px; min-width: 0;
    /* same styling as before */
}
.player-row { background: #0a1628; }
.enemy-row { background: #1a0a0a; }
```

### Team Builder — Show Enemy Zone
Add a visual indicator on the team builder page showing where enemies will appear. Above the 4×7 player grid, add 4 rows of greyed-out cells labeled "Enemy Zone":

In `renderTeamScreen()` (or wherever the team board is rendered), add above the `team-board` div:
```js
// Add enemy zone preview above team board
var enemyPreview = '<div class="board-grid" style="gap:2px; opacity:0.3; margin-bottom:4px;">';
for (var er = 0; er < 4; er++) {
    for (var ec = 0; ec < 7; ec++) {
        enemyPreview += '<div class="board-cell" style="min-height:30px; background:#1a0a0a; border-color:#3a1a1a; cursor:default;"></div>';
    }
}
enemyPreview += '</div>';
enemyPreview += '<div style="text-align:center; font-size:10px; color:#666; margin-bottom:2px;">↑ Enemy Zone ↑ · ↓ Your Team ↓</div>';
```
Insert this HTML before the team-board grid.

## What NOT To Change
- `performAttack()` — unchanged
- `combatTick()` flow — same logic, just operates on 8×7 grid now
- `onWaveCombatEnd()`, `trackWaveDamage()`, `calculateStarRating()` — unchanged
- Wave transition, mission results — unchanged
- `getMoveSpeed()`, `getAttackRange()`, `isInRange()`, `getManhattanDist()` — unchanged (they're coordinate-agnostic)

## Testing Checklist
- [ ] Player units appear in bottom 4 rows of combat grid (rows 4-7)
- [ ] Enemy units appear in top 4 rows (rows 0-3), with front units at row 3
- [ ] Units visually move top-to-bottom / bottom-to-top toward each other
- [ ] Assassins dash to enemy back rows (rows 0-1 for player assassins)
- [ ] All existing combat mechanics still work (items, synergies, etc.)
- [ ] Wave transitions correctly restore player positions
- [ ] Team builder shows greyed-out enemy zone above player grid
- [ ] Combat grid is 7 columns wide (matches team builder)

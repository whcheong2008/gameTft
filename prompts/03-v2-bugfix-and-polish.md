# V2 Bug Fix & Integration Polish

## Context
This is a browser-based gacha auto-battler game (V2 rewrite). The game uses plain JavaScript with global scope (NO ES modules, NO import/export). All files load via `<script>` tags in `game-v2.html`.

**Read these files first to understand the full system:**
- `DESIGN-V2.md` — Full game design document
- `game-v2.html` — HTML shell, CSS, script load order
- All files in `js/` that are loaded by game-v2.html (see load order below)

**Load order (game-v2.html):**
```
js/units.js → js/save.js → js/gacha.js → js/teams.js → js/hub.js → js/missions.js → js/ui-v2.js → js/main-v2.js
```

Note: `synergies.js` and `combat.js` (V1 files) are NOT loaded. V2 has its own combat engine in `main-v2.js` and synergy logic in `main-v2.js` + `teams.js`.

---

## Known Bugs (Fix These)

### BUG 1: Combat board does not match team builder grid
**Problem:** The team builder uses a 4×7 grid where you place units at specific (row, col) positions. But the combat screen renders a flat list — enemies in one row, players in another — ignoring the actual grid positions. Units appear in wrong locations.

**Expected:** Combat should render the SAME 4×7 grid the player arranged their team on. Player units should appear at their exact (row, col) from the team config. Enemies should appear on a separate 4×7 grid above (or use a simpler layout, but must be visually distinct from player side).

**Files to fix:** `js/ui-v2.js` (renderCombatBoard function) and possibly `js/main-v2.js` (combat initialization).

### BUG 2: Combat board only shows 2 rows instead of full grid
**Problem:** The combat screen renders a cramped 2-row layout (1 row enemies, 1 row players). Should show the full 4-row player grid + enemy area.

**Expected:** Combat area should show:
- Enemy zone (top): enemies placed on their grid
- Divider
- Player zone (bottom): 4×7 grid matching team builder positions

**Files to fix:** `js/ui-v2.js` (renderCombatBoard), `game-v2.html` (combat CSS if needed).

### BUG 3: Enemy placement in combat
**Problem:** `placeEnemiesOnBoard()` in `ui-v2.js` just sets `x` and `y` properties but the combat engine and renderer don't use grid coordinates consistently.

**Expected:** Enemies should be placed on their own grid rows and the combat engine should process all units correctly regardless of grid position (since it's auto-combat, position mainly matters for display and targeting).

---

## Feature Gaps (Implement These)

### GAP 1: Position swapping between waves
**Design:** Between waves, the player should be able to drag/rearrange unit positions on their 4×7 grid. Currently the wave transition screen shows a "Start Next Wave" button but no repositioning UI.

**Implement:** During wave transition, show the player's 4×7 grid with their surviving units. Allow clicking a unit then clicking an empty cell to swap/move. Add a visual indicator for selected unit. When "Start Next Wave" is clicked, use the updated positions.

### GAP 2: Gacha results should show element + archetype + type info
**Current:** Gacha cards only show element emoji, name, and cost.
**Expected:** Also show archetype emoji and unit type (Tank/Warrior/etc.) so player can evaluate what they rolled.

### GAP 3: Roster screen should show unit stats
**Current:** Shows name, stars, element, archetype, cost, copies.
**Expected:** Also show base HP and ATK (scaled by star level) so player can compare units.

### GAP 4: Team builder should show unit stats on hover/click
**Current:** Roster panel items only show name and element emoji.
**Expected:** When hovering or clicking a unit in the team builder roster panel, show a tooltip or detail panel with full stats, type, archetype, element, star level.

### GAP 5: Mission rewards should sometimes include unit copies
**Design (from DESIGN-V2.md):** Mission rewards include gold, XP, and "random unit copies." Currently only gold and XP are awarded.
**Implement:** On mission completion, roll 1-3 random unit copies (using the gacha tier weights at the player's level) and add them to the collection. Show which units were received in the results screen.

---

## Code Quality Notes

- All JS uses `var` declarations (not let/const) — maintain this style
- All functions are in global scope — no modules, no classes
- Keep the existing function signatures — other files depend on them
- The game state is in the global `saveData` variable, accessed via `getSaveData()`
- After any mutation to saveData, call `autoSave(saveData)` to persist
- `UNIT_TEMPLATES`, `ELEMENTS`, `ARCHETYPES`, `SHOP_POOL_KEYS`, `EVOLVED_TEMPLATES`, `getStarMultiplier()`, `getElementMultiplier()` all come from `units.js`

---

## Testing Checklist
After making changes, verify in the browser:
1. [ ] Open game-v2.html, hit "Reset Game" to start fresh with 500g
2. [ ] Roll 10x units in Summon — cards should show element, archetype, type, cost
3. [ ] Check Collection — units show stats (HP, ATK at current star level)
4. [ ] Open Team Builder — place 2-3 units on the 4×7 grid at specific positions
5. [ ] Start a story mission — combat grid should show units at their EXACT team builder positions
6. [ ] Combat should run and resolve (win or lose)
7. [ ] On victory, results should show gold + XP + unit copies earned
8. [ ] If multi-wave, wave transition should let you reposition units before continuing
9. [ ] After mission, return to hub with updated gold/XP
10. [ ] Save persists — refresh the page and all progress is retained

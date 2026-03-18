# Prompt 16: Combat Engine Rebuild — Speed Controls & Visual Polish

## Goal
Add speed controls (1×/2×/4×), floating damage/heal numbers, smooth unit movement, death animations, ability cast indicators, and general visual polish to make combat readable, satisfying, and watchable. This is the final chunk of the combat engine rebuild.

## ⚠️ Implementation Order — READ FIRST

### Phase A: Speed Controls (ui-v2.js + game-v2.html)
1. Add speed multiplier variable and speed toggle button
2. Wire speed into combat loop timing
3. Add auto-battle option for 3-starred missions

### Phase B: Floating Damage Numbers (ui-v2.js + main-v2.js + game-v2.html)
4. Create damage number system (DOM elements that float up and fade)
5. Wire into `dealDamage()` and `dealHealing()` return paths
6. Color-code: white (normal), yellow (crit), red (DoT), green (heal), blue (shield), gray (dodge)

### Phase C: Death Animations (ui-v2.js + game-v2.html)
7. Add fade-out + shrink animation when unit dies
8. Leave faint ghost marker on cell where unit died
9. On-death effects get a brief visual flash (Volcano Titan explosion, Phoenix rebirth)

### Phase D: Movement Smoothing (ui-v2.js + game-v2.html)
10. Track previous position per unit, use CSS transitions for cell changes
11. Assassin dash gets a fast blur trail effect

### Phase E: Ability Cast Visuals (ui-v2.js + game-v2.html)
12. Unit glows with element color while casting (0.3s cast time)
13. AoE abilities briefly highlight affected cells
14. **TEST**: Full mission + boss playthrough at all 3 speeds. Verify all visuals work.

---

## Context
- **Chunks 1-5 (done)**: Grid, movement, damage pipeline, mana, 36 abilities, full status effects, boss framework with telegraphs
- **Current rendering**: Full board rebuild every 50ms via `setTimeout(combatLoop, COMBAT_TICK_MS)`. HP bars have CSS transitions. No floating damage numbers, no death animations, no speed controls.
- **COMBAT_TICK_MS = 50** (20 FPS), **COMBAT_DT = 0.05**
- **Pattern**: All `var`, global scope, NO ES modules, NO import/export

---

## Part 1: Speed Controls

### Speed Multiplier Variable
Add a global speed setting:
```js
var COMBAT_SPEED = 1; // 1, 2, or 4
```

### Modify Combat Loop
The combat loop currently uses fixed `COMBAT_TICK_MS = 50`. Change to scale with speed:
```js
function combatLoop() {
    // Run multiple physics ticks per frame at higher speeds
    for (var s = 0; s < COMBAT_SPEED; s++) {
        if (combatState && combatState.running) {
            combatTick(COMBAT_DT);
        }
    }
    renderCombatBoard();

    if (combatState && combatState.running) {
        setTimeout(combatLoop, COMBAT_TICK_MS);
    } else {
        onWaveCombatEnd();
    }
}
```

This approach keeps the render rate at 20 FPS but advances the simulation faster. At 2×, each frame runs 2 physics ticks. At 4×, each frame runs 4 ticks. This is simpler than changing the setTimeout interval and avoids rendering issues.

### Speed Toggle Button
Add a button in the combat screen, above the combat board:

**HTML** (`game-v2.html`, inside `#screen-combat`, before `#combat-area`):
```html
<div id="combat-controls" style="display:flex; justify-content:space-between; align-items:center; padding:4px 8px;">
    <div id="wave-info" class="wave-info">Wave 1 / 1</div>
    <div style="display:flex; gap:4px;">
        <button id="speed-btn" class="speed-btn" onclick="toggleCombatSpeed()">1×</button>
    </div>
</div>
```

Move the existing `wave-info` into this controls bar so speed and wave info are on the same row.

**JavaScript** (in `ui-v2.js`):
```js
function toggleCombatSpeed() {
    if (COMBAT_SPEED === 1) COMBAT_SPEED = 2;
    else if (COMBAT_SPEED === 2) COMBAT_SPEED = 4;
    else COMBAT_SPEED = 1;
    var btn = document.getElementById('speed-btn');
    if (btn) btn.textContent = COMBAT_SPEED + '×';
}
```

**CSS**:
```css
.speed-btn {
    background: #1b2838;
    color: #ffd700;
    border: 1px solid #ffd700;
    border-radius: 4px;
    padding: 2px 10px;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    min-width: 36px;
}
.speed-btn:hover { background: #2a3848; }
```

### Auto-Battle for Cleared Content
For missions the player has already 3-starred, show an "Auto" button that instantly resolves combat:

```js
function autoBattle() {
    // Run combat silently to completion
    while (combatState && combatState.running) {
        combatTick(COMBAT_DT);
    }
    // Skip rendering, go straight to results
    onWaveCombatEnd();
}
```

Only show the Auto button if the mission's best star rating is 3 in save data. Add to the mission card or combat start screen. The auto-battle runs the same simulation but skips rendering — results are deterministic based on team comp.

**Implementation**: Check `saveData.missionStars[missionId] >= 3` (you may need to add `missionStars` to save data if it doesn't exist). Show a button "⚡ Auto" next to "Start Mission" that calls `autoBattle()` instead of `startWaveCombat()`.

---

## Part 2: Floating Damage Numbers

### System Design
When `dealDamage()` or `dealHealing()` produces a visible result, spawn a temporary DOM element positioned over the target unit's cell that floats upward and fades out.

### Damage Number Container
Add an absolutely-positioned container overlaying the combat board:
```html
<!-- Inside #combat-main, after #combat-board -->
<div id="damage-numbers" style="position:absolute; top:0; left:0; right:0; bottom:0; pointer-events:none; overflow:hidden;"></div>
```

Make `#combat-main` position:relative so the overlay positions correctly.

### `spawnDamageNumber(row, col, text, type)`
```js
function spawnDamageNumber(row, col, text, type) {
    var container = document.getElementById('damage-numbers');
    if (!container) return;

    var board = document.getElementById('combat-board');
    if (!board) return;

    // Calculate pixel position from grid cell
    // Each cell is board.offsetWidth / 7 wide, board.offsetHeight / 8 tall
    var cellW = board.offsetWidth / 7;
    var cellH = board.offsetHeight / 8;
    var x = col * cellW + cellW / 2;
    var y = row * cellH + cellH / 2;

    // Add random horizontal offset to prevent overlap (-10 to +10 px)
    x += (Math.random() - 0.5) * 20;

    var el = document.createElement('div');
    el.className = 'dmg-number dmg-' + type;
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    container.appendChild(el);

    // Remove after animation
    setTimeout(function() {
        if (el.parentNode) el.parentNode.removeChild(el);
    }, 800);
}
```

### CSS
```css
#combat-main { position: relative; }

.dmg-number {
    position: absolute;
    font-weight: bold;
    font-size: 13px;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
    pointer-events: none;
    animation: floatUp 0.8s ease-out forwards;
    z-index: 20;
    white-space: nowrap;
}
.dmg-normal { color: #ffffff; }
.dmg-crit { color: #ffdd00; font-size: 16px; }
.dmg-dot { color: #ff6633; font-size: 11px; }
.dmg-heal { color: #44ee44; }
.dmg-shield { color: #4488ff; font-size: 11px; }
.dmg-dodge { color: #999999; font-style: italic; font-size: 11px; }
.dmg-ability { color: #ff88ff; }
.dmg-boss { color: #ff4444; font-size: 15px; }

@keyframes floatUp {
    0% { transform: translateY(0) scale(1); opacity: 1; }
    20% { transform: translateY(-8px) scale(1.1); opacity: 1; }
    100% { transform: translateY(-30px) scale(0.8); opacity: 0; }
}
```

### Wire Into Damage/Heal Functions

**In `dealDamage()` — after damage is calculated, before return:**
```js
// Spawn damage number (only if combat is rendering, skip during auto-battle)
if (!combatState.autoBattle) {
    if (wasDodged) {
        spawnDamageNumber(target.gridRow, target.gridCol, 'DODGE', 'dodge');
    } else if (totalDmg > 0) {
        var numType = 'normal';
        if (wasCrit) numType = 'crit';
        else if (options.isTrueDamage && !options.isAutoAttack) numType = 'dot';
        else if (options.isAbility) numType = 'ability';
        else if (source && source.isBoss) numType = 'boss';
        var numText = '' + totalDmg;
        if (wasCrit) numText += '!';
        spawnDamageNumber(target.gridRow, target.gridCol, numText, numType);
    }
}
```

**In `dealHealing()` — after heal is applied:**
```js
if (!combatState.autoBattle && actualHeal > 0) {
    spawnDamageNumber(target.gridRow, target.gridCol, '+' + actualHeal, 'heal');
}
```

**In `grantShield()` — after shield is applied:**
```js
if (!combatState.autoBattle && amount > 0) {
    spawnDamageNumber(target.gridRow, target.gridCol, '+' + amount + ' 🛡️', 'shield');
}
```

### Throttling at High Speeds
At 4× speed, damage numbers would flood the screen. Add a simple throttle:
```js
var lastDmgNumberTime = 0;
function spawnDamageNumber(row, col, text, type) {
    var now = Date.now();
    // At 4× speed, only show every 3rd damage number (except crits and abilities)
    if (COMBAT_SPEED >= 4 && type !== 'crit' && type !== 'ability' && type !== 'boss') {
        if (now - lastDmgNumberTime < 150) return;
    }
    // At 2× speed, show every other
    if (COMBAT_SPEED >= 2 && type === 'dot') {
        if (now - lastDmgNumberTime < 100) return;
    }
    lastDmgNumberTime = now;
    // ... rest of function
}
```

---

## Part 3: Death Animations

### Unit Death Fade
When a unit's HP reaches 0, don't immediately remove it from rendering. Instead:
1. Add a `deathTimer` field on the unit
2. During the death animation, render the unit with a fade/shrink effect
3. After 0.5s, stop rendering the unit

**In `dealDamage()` or wherever HP reaches 0:**
```js
if (target.hp <= 0 && !target.deathAnimating) {
    target.deathAnimating = true;
    target.deathTimer = 0.5; // 0.5s death animation
}
```

**In `combatTick()`, tick down deathTimer:**
```js
if (unit.deathAnimating) {
    unit.deathTimer -= dt;
    if (unit.deathTimer <= 0) {
        unit.deathComplete = true;
        // Remove from grid
        if (combatState.grid[unit.gridRow] && combatState.grid[unit.gridRow][unit.gridCol] === unit) {
            combatState.grid[unit.gridRow][unit.gridCol] = null;
        }
    }
}
```

**In `renderCombatBoard()`, render dying units with fade:**
```js
if (unit.deathAnimating && !unit.deathComplete) {
    var deathPct = unit.deathTimer / 0.5; // 1.0 → 0.0
    cellStyle += 'opacity:' + deathPct.toFixed(2) + '; transform:scale(' + (0.5 + deathPct * 0.5).toFixed(2) + ');';
}
```

### Ghost Markers
After a unit dies, leave a faint marker on the cell:
```js
// When rendering an empty cell that had a unit die on it:
if (!unit && combatState.deathMarkers && combatState.deathMarkers[r + ',' + c]) {
    cellHtml = '<div class="death-marker">' + combatState.deathMarkers[r + ',' + c] + '</div>';
}
```

Track death markers:
```js
// When a unit's death completes:
if (!combatState.deathMarkers) combatState.deathMarkers = {};
combatState.deathMarkers[unit.gridRow + ',' + unit.gridCol] = '💀';
```

**CSS**:
```css
.death-marker {
    font-size: 10px;
    opacity: 0.2;
    text-align: center;
    line-height: 36px;
}
```

### On-Death Effect Visuals
When Volcano Titan explodes or Phoenix revives, spawn a brief visual indicator:
```js
// Volcano Titan explosion — spawn damage numbers on all hit cells
// (already handled by dealDamage calls in executeAbility)

// Phoenix rebirth — spawn a special golden text
spawnDamageNumber(unit.gridRow, unit.gridCol, '🔥 REBIRTH!', 'crit');
```

---

## Part 4: Movement Smoothing

### Approach
Instead of CSS grid position changes (which causes instant jumps), use CSS transitions on the unit element's position within the board.

The simplest approach: track each unit's previous grid position. If it changed since last render, apply a CSS transition.

**Track previous position on each unit:**
```js
unit._prevRow = unit.gridRow;
unit._prevCol = unit.gridCol;
```

**In `renderCombatBoard()`**, instead of rebuilding the entire board from scratch, use a more targeted approach:

Option A (simpler — keep full rebuild but add transition hints):
After building the grid HTML, units whose position changed get a CSS class that triggers a brief slide animation.

Option B (recommended — position units absolutely within the board):
Switch from CSS Grid cell placement to absolute positioning within the board container. Each unit is a div with `position: absolute; left: Xpx; top: Ypx; transition: left 0.15s, top 0.15s;`. When gridRow/gridCol changes, the left/top values change and CSS transitions handle the smoothing.

**Go with Option B** since it produces the smoothest result:

### Rendering Overhaul
Replace the current approach of creating a cell per grid position with:
1. Render the 56 background cells (empty grid) once (or rebuild each frame — they're lightweight)
2. Render units as absolutely-positioned divs overlaying the grid, with pixel positions calculated from their gridRow/gridCol
3. Update unit positions each frame — CSS transition handles interpolation

```js
function renderCombatBoard() {
    var board = document.getElementById('combat-board');
    if (!board || !combatState) return;

    var boardW = board.offsetWidth;
    var boardH = board.offsetHeight;
    var cellW = boardW / 7;
    var cellH = boardH / 8;

    // Render background grid cells (static, only rebuild if needed)
    if (!board._gridRendered) {
        var gridHtml = '';
        for (var r = 0; r < 8; r++) {
            for (var c = 0; c < 7; c++) {
                var cls = r < 4 ? 'enemy-row' : 'player-row';
                // Check death marker
                var marker = '';
                if (combatState.deathMarkers && combatState.deathMarkers[r + ',' + c]) {
                    marker = '<div class="death-marker">' + combatState.deathMarkers[r + ',' + c] + '</div>';
                }
                // Check telegraph danger zone
                var dangerCls = '';
                // ... (telegraph check logic)
                gridHtml += '<div class="combat-cell ' + cls + ' ' + dangerCls + '">' + marker + '</div>';
            }
        }
        board.innerHTML = gridHtml;
        board._gridRendered = true;
    }

    // Update danger zones on existing cells
    updateDangerZones(board);

    // Render unit overlays in a separate container
    var unitLayer = document.getElementById('combat-unit-layer');
    if (!unitLayer) {
        unitLayer = document.createElement('div');
        unitLayer.id = 'combat-unit-layer';
        unitLayer.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;';
        board.parentNode.style.position = 'relative';
        board.parentNode.insertBefore(unitLayer, board.nextSibling);
    }

    // Create/update unit elements
    var allUnits = combatState.playerUnits.concat(combatState.enemyUnits);
    var existingEls = {};
    var children = unitLayer.children;
    for (var i = 0; i < children.length; i++) {
        existingEls[children[i].dataset.uid] = children[i];
    }

    var activeIds = {};
    for (var u = 0; u < allUnits.length; u++) {
        var unit = allUnits[u];
        if (unit.deathComplete) continue;
        if (!unit._uid) unit._uid = 'u' + u + '_' + Math.random().toString(36).substr(2, 4);
        activeIds[unit._uid] = true;

        var el = existingEls[unit._uid];
        if (!el) {
            el = document.createElement('div');
            el.dataset.uid = unit._uid;
            el.className = 'combat-unit-overlay';
            unitLayer.appendChild(el);
        }

        // Position with transition
        var targetX = unit.gridCol * cellW;
        var targetY = unit.gridRow * cellH;

        // Boss: span 2×2
        if (unit.isBoss) {
            el.style.width = (cellW * 2) + 'px';
            el.style.height = (cellH * 2) + 'px';
        } else {
            el.style.width = cellW + 'px';
            el.style.height = cellH + 'px';
        }

        el.style.left = targetX + 'px';
        el.style.top = targetY + 'px';

        // Death animation
        if (unit.deathAnimating) {
            var deathPct = Math.max(0, unit.deathTimer / 0.5);
            el.style.opacity = deathPct;
            el.style.transform = 'scale(' + (0.5 + deathPct * 0.5) + ')';
        } else {
            el.style.opacity = '1';
            el.style.transform = 'scale(1)';
        }

        // Casting glow
        if (unit.isCasting) {
            var elemColor = unit.element ? (ELEMENTS[unit.element] ? ELEMENTS[unit.element].color : '#ffffff') : '#ffffff';
            el.style.boxShadow = '0 0 8px ' + elemColor;
        } else {
            el.style.boxShadow = 'none';
        }

        // Render unit content (emoji, name, HP bar, mana bar, status icons)
        el.innerHTML = buildUnitCellHtml(unit);
    }

    // Remove elements for dead/gone units
    for (var uid in existingEls) {
        if (!activeIds[uid]) {
            existingEls[uid].parentNode.removeChild(existingEls[uid]);
        }
    }

    // Update scoreboard
    renderCombatScoreboard();
}
```

**CSS for unit overlays:**
```css
.combat-unit-overlay {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: left 0.15s ease-out, top 0.15s ease-out, opacity 0.3s, transform 0.3s;
    pointer-events: none;
    z-index: 5;
    font-size: 10px;
    text-align: center;
    padding: 1px;
    box-sizing: border-box;
}
```

The 0.15s transition on left/top creates smooth movement between grid cells. At 2× and 4× speed, movements happen faster but still animate.

### `buildUnitCellHtml(unit)`
Extract the existing per-unit rendering into a helper function. This builds the emoji, name, HP bar, mana bar, status icons — same content as current renderCombatBoard, just isolated into a reusable function.

### Board Grid Background
The background grid of 56 cells stays as CSS grid with colored backgrounds (player blue, enemy red). It only needs to rebuild when death markers change or telegraph danger zones update. Units overlay on top.

### Invalidation
Set `board._gridRendered = false` when:
- A death marker is added
- Telegraph danger zones change (check each frame, or set a dirty flag)
- Wave transitions (always rebuild)

### Assassin Dash Visual
When `performAssassinDash()` is called, briefly add a trail effect:
```js
// After moving assassin to new position:
spawnDamageNumber(oldRow, oldCol, '💨', 'dodge'); // trail marker at old position
```

---

## Part 5: Ability Cast Visuals

### Element Glow While Casting
Already handled in Part 4 — when `unit.isCasting`, the unit overlay gets a `box-shadow` glow in the unit's element color.

### AoE Ability Cell Highlights
When `executeAbility()` resolves an AoE ability, briefly highlight the affected cells. Add a function:

```js
function flashAbilityCells(cells, color, duration) {
    // cells = [{row, col}, ...]
    // color = element color string
    // duration = ms
    if (combatState.autoBattle) return;

    var board = document.getElementById('combat-board');
    if (!board) return;

    for (var i = 0; i < cells.length; i++) {
        var idx = cells[i].row * 7 + cells[i].col;
        var cell = board.children[idx];
        if (cell) {
            cell.style.boxShadow = 'inset 0 0 12px ' + color;
            (function(c) {
                setTimeout(function() { c.style.boxShadow = 'none'; }, duration || 300);
            })(cell);
        }
    }
}
```

Call this from `executeAbility()` for AoE abilities:
```js
// Example: Pyromancer Meteor
case 'pyromancer':
    if (target && target.hp > 0) {
        var meteorTargets = getUnitsInRadius(target.gridRow, target.gridCol, 2, enemies);
        // Flash cells
        var meteorCells = getCellsInRadius(target.gridRow, target.gridCol, 2);
        flashAbilityCells(meteorCells, '#ff4444', 400);
        // ... deal damage
    }
    break;
```

Add `flashAbilityCells()` calls to the most visually impactful abilities:
- Pyromancer/Inferno Mage: red flash on AoE cells
- Golem/Titan: green flash on AoE cells
- Storm Mage/Tempest Wizard: purple flash on target + bounce cells
- Fire Dragon: orange flash on cone cells
- Leviathan: blue flash on all enemy cells
- Coral Priest/Ocean Sage/Gaia Priest: green flash on healed ally cells
- Sky Knight/Aegis Paladin: gold flash on all ally cells

Don't add flashes to every single-target ability — keep it selective for AoE/team-wide effects.

---

## Part 6: Combat Start/End Polish

### Combat Start
Add a brief "FIGHT!" text overlay when combat begins:
```js
function showCombatStartText() {
    var overlay = document.createElement('div');
    overlay.className = 'combat-start-text';
    overlay.textContent = 'FIGHT!';
    document.getElementById('combat-area').appendChild(overlay);
    setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 1000);
}
```

**CSS:**
```css
.combat-start-text {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    font-size: 36px;
    font-weight: bold;
    color: #ffd700;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    z-index: 30;
    pointer-events: none;
    animation: combatStartAnim 1s ease-out forwards;
}
@keyframes combatStartAnim {
    0% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
    20% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    80% { opacity: 1; }
    100% { opacity: 0; }
}
```

### Victory/Defeat Text
Enhance the results overlay with a brief animation before showing rewards:
```css
.results-title {
    font-size: 28px;
    animation: resultsBounce 0.5s ease-out;
}
@keyframes resultsBounce {
    0% { transform: scale(0); }
    60% { transform: scale(1.2); }
    100% { transform: scale(1); }
}
```

---

## Part 7: Enrage Timer Display

Show a countdown timer for boss enrage in the combat controls bar:
```js
// In renderCombatBoard() or a separate function:
if (combatState.bossUnit && combatState.bossUnit.hp > 0 && !combatState.bossUnit.enraged) {
    var timeLeft = combatState.bossUnit.bossData.enrageTime - combatState.elapsed;
    if (timeLeft > 0 && timeLeft <= 30) {
        // Show warning when under 30s
        var timerEl = document.getElementById('enrage-timer');
        if (timerEl) timerEl.textContent = '⏱️ Enrage: ' + Math.ceil(timeLeft) + 's';
    }
}
```

Add `<span id="enrage-timer" style="color:#ff6644; font-size:11px;"></span>` to the combat controls bar.

---

## Files to Modify

### `main-v2.js`
- Add `combatState.autoBattle` flag
- In `dealDamage()`: add `spawnDamageNumber()` calls after damage/dodge
- In `dealHealing()`: add `spawnDamageNumber()` call
- In `grantShield()`: add `spawnDamageNumber()` call
- Add death animation fields: `deathAnimating`, `deathTimer`, `deathComplete`
- In `combatTick()`: tick `deathTimer`, handle `deathComplete` grid removal
- Don't count dying units as "alive" for win/loss checks

### `ui-v2.js`
- Add `COMBAT_SPEED` variable
- Modify `combatLoop()` to run multiple ticks per frame based on speed
- Add `toggleCombatSpeed()` function
- Add `spawnDamageNumber()` function with throttling
- Add `flashAbilityCells()` function
- Add `showCombatStartText()` function
- Overhaul `renderCombatBoard()`: background grid + unit overlay layer with CSS transitions
- Add `buildUnitCellHtml(unit)` helper
- Add auto-battle function
- Add enrage timer display
- Wire ability cast visuals into `executeAbility()` (selective AoE flashes)

### `game-v2.html`
- Add `#combat-controls` bar with speed button + enrage timer
- Add damage number CSS (`.dmg-number`, `.dmg-*` types, `@keyframes floatUp`)
- Add death animation CSS (`.death-marker`)
- Add unit overlay CSS (`.combat-unit-overlay` with transitions)
- Add combat start/end animations CSS
- Add speed button CSS (`.speed-btn`)

### `missions.js` (minor)
- No structural changes, but auto-battle needs a way to check mission star history

### `save.js` (minor)
- If `missionStars` tracking doesn't exist, add it: `saveData.missionStars = {}` (map missionId → best star rating). Update on mission completion.

## What NOT to Do
- Do NOT change combat logic (damage formulas, abilities, status effects) — only visual presentation
- Do NOT add new abilities, units, or boss mechanics
- Do NOT change the save format beyond adding `missionStars` if missing
- Do NOT use requestAnimationFrame (keep setTimeout for consistency)
- Do NOT use ES modules, import/export, `let`, `const`, or arrow functions

## Testing Checklist
1. Speed button shows "1×" by default, cycles to "2×" then "4×"
2. At 2×, combat is noticeably faster. At 4×, very fast.
3. Damage numbers float up from units — white for normal, yellow+bigger for crits
4. Heal numbers show green "+N" over healed units
5. "DODGE" appears in gray when attacks miss
6. DoT damage numbers are smaller/red
7. Death: unit fades out and shrinks over 0.5s, skull marker left on cell
8. Units slide smoothly between cells instead of teleporting
9. Casting units glow with their element color
10. AoE abilities flash affected cells briefly
11. "FIGHT!" text appears at combat start
12. Boss enrage countdown shows when under 30s remaining
13. Auto-battle button appears for 3-starred missions (if missionStars tracking exists)
14. At 4× speed, damage numbers are throttled (not flooding the screen)
15. No console errors at any speed

# Prompt 12: Combat Engine Rebuild — Damage Pipeline & Live Scoreboard

## Goal
Replace the current flat `performAttack()` with a unified multi-step damage pipeline (`dealDamage()`), add a healing pipeline, wire up all existing item on-hit/on-kill effects through the new pipeline, and add a **live combat scoreboard sidebar** that shows per-unit damage dealt / damage taken / healing done in real time.

## Context
- **Chunk 1 (done)**: 8×7 vertical grid, BFS pathfinding, grid-aware targeting, movement, assassin dash. Grid rows 0-3 enemy, 4-7 player. Manhattan distance.
- **Current damage**: `performAttack()` in `main-v2.js` (lines ~441-605) is a monolithic function handling element mult, crit, dodge, burn, DR, shield, on-hit items, on-kill effects. No stat tracking.
- **Target state**: All damage flows through `dealDamage()`. All healing flows through `dealHealing()`. Both functions record stats to `combatState.stats`. A sidebar renders these stats live every tick.
- **Script order**: `units.js → save.js → gacha.js → teams.js → hub.js → items.js → missions.js → ui-v2.js → main-v2.js`
- **Pattern**: All `var`, global scope, NO ES modules, NO import/export
- **Grid**: 8 rows × 7 cols. Rows 0-3 enemy, rows 4-7 player.

## Part 1: Combat Stat Tracking

### Data Structure
Add to `initCombat()` setup, on each unit:
```js
unit.combatStats = {
    damageDealt: 0,    // total damage applied to enemy HP (after all reductions)
    damageTaken: 0,    // total damage applied to this unit's HP
    healingDone: 0,    // total healing applied to allies (or self)
    shieldGiven: 0,    // total shield value granted
    kills: 0           // number of killing blows
};
```

Every function that modifies HP or shield MUST go through `dealDamage()` or `dealHealing()` so stats are tracked consistently.

## Part 2: Unified Damage Pipeline — `dealDamage()`

Replace `performAttack()` with a two-function design:

### `performAttack(attacker, target)` — the combat action
This is called from `combatTick()` when a unit attacks. It:
1. Decides if this is a heal (healer targeting ally) → calls `dealHealing()` instead
2. Calculates raw damage and applies the pipeline
3. Processes on-hit and on-kill effects

### `dealDamage(source, target, rawDamage, options)` — the damage pipeline
All damage in the game goes through this function — auto-attacks, item procs (BotRK, set burn, fire kill AoE, Archangel's), and future abilities/DoTs. Returns an object with the results.

**`options` parameter**:
```js
{
    isAutoAttack: false,     // true for normal auto-attacks
    isAbility: false,        // true for ability damage (future chunk 3)
    isTrueDamage: false,     // skips DR and element resist
    isOnHit: false,          // true for item proc damage (BotRK, setBurn)
    canCrit: true,           // whether this damage can crit
    canDodge: true,          // whether this damage can be dodged
    applyElement: true,      // whether to apply element multiplier
    triggerOnHit: true       // whether to trigger on-hit item effects
}
```

**Pipeline steps** (in order):

```
Step 1: Raw Damage
  dmg = rawDamage (passed in)

Step 2: Element Multiplier (if options.applyElement)
  elemMult = getElementMultiplier(source.element, target.element)
  Apply Elemental Core ability bonus (if source has elemMastery and elemMult > 1.0)
  Apply target's elemResist (reduce bonus portion: elemMult = 1.0 + (elemMult - 1.0) * (1 - target.elemResist))
  dmg = floor(dmg * elemMult)

Step 3: Critical Strike (if options.canCrit)
  if (source.critChance && random < source.critChance): dmg = floor(dmg * 1.5)
  Track wasCrit = true for visual feedback

Step 4: Damage Reduction (if !options.isTrueDamage)
  if (target.damageReduction): dmg = floor(dmg * (1 - target.damageReduction))
  Minimum damage = 1 (no zero-damage hits except dodge)

Step 5: Dodge Check (if options.canDodge)
  if (target.dodgeChance && random < target.dodgeChance): dmg = 0, wasDodged = true
  If dodged, skip everything below and return early

Step 6: Shield Absorption
  if (target.shield > 0):
    shieldAbsorbed = min(target.shield, dmg)
    target.shield -= shieldAbsorbed
    dmg -= shieldAbsorbed

Step 7: Apply to HP
  target.hp -= dmg
  if (target.hp < 0) target.hp = 0
  Record: target.combatStats.damageTaken += (dmg + shieldAbsorbed)
  Record: source.combatStats.damageDealt += (dmg + shieldAbsorbed)

Step 8: On-Hit Triggers (if options.triggerOnHit && options.isAutoAttack)
  Burn damage (Fire synergy): dealDamage(source, target, source.burnDamage, {isTrueDamage:true, canCrit:false, canDodge:false, applyElement:false, triggerOnHit:false})
  BotRK: dealDamage(source, target, floor(target.maxHp * spec.pctMaxHp), {isTrueDamage:true, canCrit:false, canDodge:false, applyElement:false, triggerOnHit:false})
  Set Burn: dealDamage(source, target, spec.burnDPS, {isTrueDamage:true, canCrit:false, canDodge:false, applyElement:false, triggerOnHit:false})
  Lifesteal: dealHealing(source, source, floor(totalDamageDealt * lifestealPct))
  NOTE: on-hit procs call dealDamage with triggerOnHit:false to prevent infinite recursion

Step 9: Death Check & On-Kill Effects
  if (target.hp <= 0):
    Check Guardian Angel revive (same logic as current)
    If target actually dead:
      source.combatStats.kills++
      Hand of Justice heal: dealHealing(source, source, floor(source.maxHp * specK.healPct))
      Frenzy stacks: same logic
      Fire kill AoE: for each surviving enemy, dealDamage(source, enemy, source.killAoE, {isTrueDamage:true, canCrit:false, canDodge:false, applyElement:false, triggerOnHit:false})
```

**Return value**:
```js
return {
    totalDamage: dmg + shieldAbsorbed,  // total damage including shield
    hpDamage: dmg,                       // damage to actual HP
    shieldDamage: shieldAbsorbed,        // damage absorbed by shield
    wasCrit: wasCrit,
    wasDodged: wasDodged,
    killed: target.hp <= 0
};
```

## Part 3: Healing Pipeline — `dealHealing()`

```js
function dealHealing(source, target, amount) {
    // Healing cannot overheal
    var actualHeal = Math.min(amount, target.maxHp - target.hp);
    target.hp += actualHeal;

    // Track stats
    if (source && source.combatStats) {
        source.combatStats.healingDone += actualHeal;
    }

    // Future hook: healing reduction from Burn/Poison (chunk 4)
    // Future hook: Sage synergy overheal → shield (chunk 4)

    return { healed: actualHeal };
}
```

### Healer Attack → Heal
In `performAttack()`, when a healer targets an ally:
```js
if (attacker.type === 'healer' && target.side === attacker.side) {
    var healAmt = attacker.attack || 10;
    if (attacker.healBonus) healAmt = Math.floor(healAmt * (1 + attacker.healBonus));
    dealHealing(attacker, target, healAmt);

    // Archangel's Staff: healer deals damage to nearest enemy
    if (attacker.itemSpecials) {
        for (var as = 0; as < attacker.itemSpecials.length; as++) {
            if (attacker.itemSpecials[as].effect === 'archangelDmg' && combatState) {
                var arcDmg = Math.floor(healAmt * attacker.itemSpecials[as].damagePct);
                var enemyPool = attacker.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
                var arcTarget = findNearestAlive(attacker, enemyPool);
                if (arcTarget) {
                    dealDamage(attacker, arcTarget, arcDmg, {isTrueDamage:true, canCrit:false, canDodge:false, applyElement:false, triggerOnHit:false});
                }
            }
        }
    }
    return;
}
```

**`findNearestAlive(source, pool)`**: Return the alive unit in `pool` with smallest Manhattan distance to `source`. This replaces the current "first alive in array" approach for Archangel's targeting.

### Warmog's Regen
Warmog's (regen per tick) in `combatTick()` should also go through `dealHealing()`:
```js
if (unit.regenPct && unit.hp > 0 && unit.hp < unit.maxHp) {
    var regenAmt = Math.floor(unit.maxHp * unit.regenPct * COMBAT_DT);
    dealHealing(unit, unit, regenAmt);
}
```
This means Warmog's self-heal counts toward the unit's `healingDone` stat.

## Part 4: Live Combat Scoreboard Sidebar

### Layout
Add a **scrollable sidebar** to the right of the combat board. The combat area becomes a flex row:

```
┌──────────────────────┐ ┌───────────────────┐
│                      │ │  COMBAT STATS     │
│   COMBAT BOARD       │ │                   │
│   (8×7 grid)         │ │  🔥 Flame Warrior │
│                      │ │  DMG: 1,284       │
│                      │ │  TAKEN: 340       │
│                      │ │  HEAL: 0          │
│                      │ │                   │
│                      │ │  🐚 Coral Priest  │
│                      │ │  DMG: 0           │
│                      │ │  TAKEN: 120       │
│                      │ │  HEAL: 890        │
│                      │ │  ...              │
└──────────────────────┘ └───────────────────┘
```

### HTML Changes (`game-v2.html`)
Inside `#combat-area`, wrap the board and add a sidebar:
```html
<div id="combat-area">
    <div id="combat-main" style="display:flex; gap:8px;">
        <div class="combat-board" id="combat-board"></div>
        <div id="combat-scoreboard" class="combat-scoreboard"></div>
    </div>
    <!-- results overlay and wave transition stay outside combat-main -->
    <div class="combat-results" id="combat-results">...</div>
    <div class="wave-transition" id="wave-transition">...</div>
</div>
```

### CSS (`game-v2.html`)
```css
.combat-scoreboard {
    width: 180px;
    min-width: 180px;
    max-height: 400px;          /* match grid height roughly */
    overflow-y: auto;
    background: #0d1b2a;
    border: 1px solid #1b2838;
    border-radius: 6px;
    padding: 6px;
    font-size: 11px;
}
.combat-scoreboard .sb-header {
    font-size: 12px;
    font-weight: bold;
    color: #ffd700;
    text-align: center;
    padding-bottom: 4px;
    border-bottom: 1px solid #1b2838;
    margin-bottom: 4px;
}
.combat-scoreboard .sb-unit {
    padding: 3px 4px;
    border-bottom: 1px solid #111a2a;
    display: flex;
    flex-direction: column;
    gap: 1px;
}
.combat-scoreboard .sb-unit.dead {
    opacity: 0.4;
}
.combat-scoreboard .sb-name {
    font-weight: bold;
    color: #e0e0e0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.combat-scoreboard .sb-name.enemy {
    color: #ff6b6b;
}
.combat-scoreboard .sb-stats {
    display: flex;
    gap: 6px;
    font-size: 10px;
    color: #888;
}
.combat-scoreboard .sb-stats .dmg { color: #ff7043; }
.combat-scoreboard .sb-stats .taken { color: #ef5350; }
.combat-scoreboard .sb-stats .heal { color: #66bb6a; }
```

### Rendering — `renderCombatScoreboard()`
Add this function to `ui-v2.js`. Call it at the end of `renderCombatBoard()` so it updates every tick.

```js
function renderCombatScoreboard() {
    var sb = document.getElementById('combat-scoreboard');
    if (!sb || !combatState) return;

    var html = '<div class="sb-header">Combat Stats</div>';

    // Player units first, sorted by damage dealt descending
    var pUnits = combatState.playerUnits.slice().sort(function(a, b) {
        return (b.combatStats ? b.combatStats.damageDealt : 0) - (a.combatStats ? a.combatStats.damageDealt : 0);
    });

    html += '<div style="color:#4fc3f7; font-size:10px; padding:2px 4px; font-weight:bold;">Your Team</div>';
    for (var i = 0; i < pUnits.length; i++) {
        var u = pUnits[i];
        var stats = u.combatStats || {damageDealt:0, damageTaken:0, healingDone:0};
        var deadClass = u.hp <= 0 ? ' dead' : '';
        html += '<div class="sb-unit' + deadClass + '">';
        html += '<div class="sb-name">' + (u.emoji || '') + ' ' + (u.name || 'Unit') + '</div>';
        html += '<div class="sb-stats">';
        html += '<span class="dmg">' + formatNum(stats.damageDealt) + ' dmg</span>';
        if (stats.healingDone > 0) {
            html += '<span class="heal">' + formatNum(stats.healingDone) + ' heal</span>';
        }
        html += '</div>';
        html += '<div class="sb-stats"><span class="taken">' + formatNum(stats.damageTaken) + ' taken</span></div>';
        html += '</div>';
    }

    // Enemy units, sorted by damage dealt descending
    var eUnits = combatState.enemyUnits.slice().sort(function(a, b) {
        return (b.combatStats ? b.combatStats.damageDealt : 0) - (a.combatStats ? a.combatStats.damageDealt : 0);
    });

    html += '<div style="color:#ef5350; font-size:10px; padding:2px 4px; margin-top:4px; font-weight:bold;">Enemy Team</div>';
    for (var j = 0; j < eUnits.length; j++) {
        var e = eUnits[j];
        var eStats = e.combatStats || {damageDealt:0, damageTaken:0, healingDone:0};
        var eDeadClass = e.hp <= 0 ? ' dead' : '';
        html += '<div class="sb-unit' + eDeadClass + '">';
        html += '<div class="sb-name enemy">' + (e.emoji || '') + ' ' + (e.name || 'Enemy') + '</div>';
        html += '<div class="sb-stats">';
        html += '<span class="dmg">' + formatNum(eStats.damageDealt) + ' dmg</span>';
        if (eStats.healingDone > 0) {
            html += '<span class="heal">' + formatNum(eStats.healingDone) + ' heal</span>';
        }
        html += '</div>';
        html += '<div class="sb-stats"><span class="taken">' + formatNum(eStats.damageTaken) + ' taken</span></div>';
        html += '</div>';
    }

    sb.innerHTML = html;
}

// Helper: format large numbers compactly
function formatNum(n) {
    if (n >= 10000) return (n / 1000).toFixed(1) + 'k';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return '' + n;
}
```

### Scoreboard on Results Screen
After combat ends, include a **final scoreboard summary** in the results overlay. Add a compact MVP line:
```
MVP: 🔥 Flame Warrior — 2,340 damage, 2 kills
```
Pick the player unit with the highest `damageDealt`. Show this above the rewards in `combat-results`.

## Part 5: Wire Up Existing Systems

### Regen in `combatTick()`
The existing per-tick regen (Warmog's, Water synergy, set regen) currently modifies `hp` directly. Change all of them to use `dealHealing()`:
```js
// In combatTick, where regen is applied:
if (unit.regenPct && unit.hp > 0 && unit.hp < unit.maxHp) {
    var regenAmt = Math.floor(unit.maxHp * unit.regenPct * COMBAT_DT);
    if (regenAmt > 0) dealHealing(unit, unit, regenAmt);
}
```

### Shield Granting
Track shields through `combatStats.shieldGiven` if you add a `grantShield(source, target, amount)` helper. Not strictly required for chunk 2 but nice to have for the scoreboard:
```js
function grantShield(source, target, amount) {
    target.shield = (target.shield || 0) + amount;
    if (source && source.combatStats) source.combatStats.shieldGiven += amount;
}
```
Use this for Earth synergy shield application in `initCombat()` and any future shield effects.

### Combat Log Integration
The existing `#combat-log` text log should still work. Optionally enhance it: when `dealDamage()` returns a crit, log it in yellow. When dodged, log "DODGE" in white. This is low priority — the scoreboard replaces most of the log's usefulness.

## Part 6: Between-Wave Stat Persistence
Combat stats should **accumulate across waves** within a single mission. Do NOT reset `combatStats` between waves. This means the scoreboard shows total mission performance, not just the current wave. The stats reset only when `initCombat()` is called for a new mission.

## Files to Modify

### `main-v2.js`
- Add `dealDamage(source, target, rawDamage, options)` function
- Add `dealHealing(source, target, amount)` function
- Add `grantShield(source, target, amount)` helper
- Add `findNearestAlive(source, pool)` helper
- Refactor `performAttack()` to use `dealDamage()` and `dealHealing()`
- In `initCombat()`: initialize `unit.combatStats` on every unit (player and enemy)
- In `combatTick()`: change direct HP modifications (regen) to use `dealHealing()`
- Do NOT reset `combatStats` between waves

### `ui-v2.js`
- Add `renderCombatScoreboard()` function
- Add `formatNum()` helper
- Call `renderCombatScoreboard()` at the end of `renderCombatBoard()`
- In the results screen renderer: add MVP line to combat results

### `game-v2.html`
- Restructure `#combat-area` to include `#combat-main` flex wrapper
- Add `#combat-scoreboard` div
- Add scoreboard CSS

## What NOT to Do
- Do NOT add mana, abilities, or status effects — those are chunks 3 and 4
- Do NOT change the grid, movement, pathfinding, or targeting — that's chunk 1 (done)
- Do NOT add damage numbers floating text — that's chunk 6
- Do NOT change the save format — combat state is ephemeral
- Do NOT use ES modules, import/export, `let`, `const`, or arrow functions — all `var`, all global scope
- Do NOT break the existing combat tick loop structure or rendering cycle

## Testing Checklist
After implementing, verify:
1. Start a mission — combat plays out, units deal damage, HP goes down
2. Scoreboard appears on the right side with all player + enemy units
3. Scoreboard numbers update in real time as combat progresses
4. Healer units show healing numbers in the scoreboard
5. Dead units appear faded in the scoreboard
6. Scoreboard sorts by damage dealt (top damage dealers first)
7. Stats persist across waves (wave 2 scoreboard shows cumulative totals)
8. MVP line shows on the results screen after combat ends
9. BotRK, Warmog's, Fire synergy burn, Fire kill AoE, Lifesteal, Archangel's, HoJ, Frenzy, Guardian Angel — all still work correctly
10. No console errors

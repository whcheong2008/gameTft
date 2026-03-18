# Prompt 15: Combat Engine Rebuild — Boss Framework

## Goal
Add boss fights to the combat system. Bosses are large (2×2 grid) single-enemy encounters with multiple phases, telegraphed AoE abilities on independent cooldown timers, minion spawning, and enrage mechanics. Implement the boss framework plus the first 3 bosses (Veil Guardian, Infernal Wyvern, Tidal Leviathan) fully, with data stubs for the remaining 3.

## ⚠️ Implementation Order — READ FIRST

### Phase A: Boss Data & Infrastructure (missions.js + main-v2.js)
1. Add `BOSS_DATA` lookup table in `missions.js` with all boss definitions
2. Add boss-specific fields to `initCombat()` (phase tracking, ability cooldowns, telegraph queue)
3. Add 2×2 grid occupation logic (boss occupies 4 cells)

### Phase B: Boss Combat AI (main-v2.js)
4. Add `processBossTick(boss, dt)` — cooldown-based ability execution
5. Add telegraph system — mark cells, delay, then resolve damage
6. Add phase transition logic (HP threshold → invulnerability → new abilities)
7. Add enrage timer
8. Add minion spawning

### Phase C: Boss Rendering (ui-v2.js + game-v2.html)
9. Render boss as 2×2 unit spanning 4 cells with large HP bar
10. Render telegraph danger zones (red-highlighted cells)
11. Render phase transition overlay (brief screen flash)
12. Render enrage warning

### Phase D: Mission Integration (missions.js + ui-v2.js)
13. Add boss missions to story mission data (missions 7 and 14)
14. Wire boss spawning into `generateMissionWave()` / `startMissionCombat()`
15. **TEST**: Play boss missions. Phases transition, telegraphs show, minions spawn, boss dies.

---

## Context
- **Chunks 1-4 (done)**: Grid, movement, damage pipeline, mana, 36 abilities, full status effects with DR/CC immunity/visual icons
- **Current missions**: 14 story missions + grind. Enemies are normal units generated from UNIT_TEMPLATES. No boss mechanic exists.
- **Script order**: `units.js → save.js → gacha.js → teams.js → hub.js → items.js → missions.js → ui-v2.js → main-v2.js`
- **Pattern**: All `var`, global scope, NO ES modules, NO import/export
- **Grid**: 8 rows × 7 cols. Rows 0-3 enemy, rows 4-7 player. Manhattan distance.
- **Source of truth**: COMBAT-DESIGN.md §10 (Boss Fight Design), CONTENT-DESIGN.md §4 (Boss Encounters)

---

## Part 1: Boss Data Structure

Add `BOSS_DATA` in `missions.js` (after the mission definitions). Each boss is a data object:

```js
var BOSS_DATA = {

    veil_guardian: {
        name: 'Veil Guardian',
        emoji: '👁️',
        element: null,  // no element
        size: [2, 2],   // rows × cols occupied
        baseHp: 5000,
        hpScaling: 8,        // HP = baseHp + (avgUnitHp × hpScaling)
        baseAtk: 0,
        atkScaling: 1.5,     // ATK = avgUnitAtk × atkScaling
        dr: 0.15,
        attackSpd: 1.5,      // base auto-attack speed (seconds)
        range: 1,            // melee
        enrageTime: 90,
        enrageAtkMult: 1.5,
        enrageSpdMult: 1.3,
        phases: [
            {
                hpThreshold: 1.0,  // phase starts at 100%
                abilities: [
                    {
                        name: 'Veil Slam',
                        cooldown: 10,
                        telegraphTime: 2.0,
                        targetType: 'highest_hp',       // target the highest HP player unit
                        aoeRadius: 2,                    // Manhattan distance from target center
                        damage: 1.5,                     // multiplier of boss ATK
                        statusEffect: null,
                        desc: 'Slams the area around highest-HP unit'
                    },
                    {
                        name: 'Energy Pulse',
                        cooldown: 20,
                        telegraphTime: 0,                // instant, no telegraph
                        targetType: 'all_players',
                        aoeRadius: 0,
                        damage: 0,                       // flat damage instead
                        flatDamage: 50,
                        statusEffect: null,
                        desc: 'All player units take 50 flat damage'
                    }
                ]
            }
        ],
        minionSpawns: [],  // no minions
        loot: { gold: 250, xp: 500, firstClearGold: 500 }
    },

    infernal_wyvern: {
        name: 'Infernal Wyvern',
        emoji: '🐉🔥',
        element: 'fire',
        size: [2, 2],
        baseHp: 15000,
        hpScaling: 3,        // HP = baseHp + (teamPower × hpScaling)  [teamPower = sum of all unit HP]
        baseAtk: 0,
        atkScaling: 2.0,
        dr: 0.20,
        attackSpd: 1.2,
        range: 2,
        enrageTime: 120,
        enrageAtkMult: 2.0,
        enrageSpdMult: 1.5,
        phases: [
            {
                hpThreshold: 1.0,
                abilities: [
                    {
                        name: 'Flame Breath',
                        cooldown: 8,
                        telegraphTime: 1.5,
                        targetType: 'cone',              // cone in front of boss
                        coneColumns: [2, 3, 4, 5],       // columns hit
                        coneRows: 2,                      // rows deep from boss front
                        damage: 0.8,
                        statusEffect: { type: 'burn', duration: 3, value: 20 },
                        desc: 'Fire cone covering columns 2-5'
                    },
                    {
                        name: 'Tail Swipe',
                        cooldown: 12,
                        telegraphTime: 1.5,
                        targetType: 'melee_range',        // all units within 1 cell of boss
                        aoeRadius: 1,
                        damage: 1.0,
                        knockback: 1,                     // push 1 cell away from boss
                        statusEffect: null,
                        desc: 'Hits all melee units, knockback 1 cell'
                    },
                    {
                        name: 'Ember Rain',
                        cooldown: 25,
                        telegraphTime: 2.0,
                        targetType: 'random_cells',
                        cellCount: 3,
                        damage: 0.6,
                        statusEffect: { type: 'burn', duration: 5, value: 15 },
                        desc: '3 random cells marked then explode'
                    }
                ]
            },
            {
                hpThreshold: 0.5,   // phase 2 at 50% HP
                abilities: [
                    {
                        name: 'Flame Breath',
                        cooldown: 6,              // faster
                        telegraphTime: 1.5,
                        targetType: 'cone',
                        coneColumns: [1, 2, 3, 4, 5, 6], // wider
                        coneRows: 2,
                        damage: 0.8,
                        statusEffect: { type: 'burn', duration: 3, value: 25 },
                        desc: 'Wider fire cone, columns 1-6'
                    },
                    {
                        name: 'Tail Swipe',
                        cooldown: 12,
                        telegraphTime: 1.5,
                        targetType: 'melee_range',
                        aoeRadius: 1,
                        damage: 1.0,
                        knockback: 1,
                        statusEffect: null,
                        desc: 'Same tail swipe'
                    },
                    {
                        name: 'Inferno',
                        cooldown: 15,
                        telegraphTime: 1.0,
                        targetType: 'all_players',
                        damage: 0.6,
                        statusEffect: { type: 'healReduction', duration: 5, value: 0.5 },
                        desc: 'All units take fire damage + grievous wounds'
                    }
                ]
            }
        ],
        minionSpawns: [
            {
                phase: 1,            // only in phase 2 (0-indexed)
                cooldown: 25,
                maxAlive: 4,
                units: [
                    { key: 'flame_warrior', stars: 2, count: 2, name: 'Fire Drake' }
                ]
            }
        ],
        loot: { gold: 500, xp: 800, firstClearGold: 500 }
    },

    tidal_leviathan: {
        name: 'Tidal Leviathan',
        emoji: '🐙💧',
        element: 'water',
        size: [2, 2],
        baseHp: 18000,
        hpScaling: 3,
        baseAtk: 0,
        atkScaling: 1.8,
        dr: 0.25,
        attackSpd: 1.5,
        range: 2,
        enrageTime: 120,
        enrageAtkMult: 2.0,
        enrageSpdMult: 1.5,
        regenPct: 0.01,  // passive 1% maxHP/s regen in phase 1
        phases: [
            {
                hpThreshold: 1.0,
                abilities: [
                    {
                        name: 'Tidal Wave',
                        cooldown: 10,
                        telegraphTime: 2.0,
                        targetType: 'rows',
                        targetRows: [4, 5],      // player front rows
                        damage: 0.7,
                        statusEffect: { type: 'slow', duration: 2, value: 0.3 },
                        desc: 'Wave hits rows 4-5'
                    },
                    {
                        name: 'Whirlpool',
                        cooldown: 15,
                        telegraphTime: 2.0,
                        targetType: 'aoe_pull',
                        aoeSize: 2,              // 2×2 area
                        damage: 0.9,
                        pullStrength: 1,          // pull units 1 cell toward center
                        desc: '2×2 area, pulls units toward center'
                    }
                ]
            },
            {
                hpThreshold: 0.5,
                abilities: [
                    {
                        name: 'Tsunami',
                        cooldown: 8,
                        telegraphTime: 2.0,
                        targetType: 'rows',
                        targetRows: [4, 5, 6],    // wider, hits 3 rows
                        damage: 0.8,
                        statusEffect: { type: 'slow', duration: 3, value: 0.4 },
                        desc: 'Wider wave hits rows 4-6'
                    },
                    {
                        name: 'Whirlpool',
                        cooldown: 15,
                        telegraphTime: 2.0,
                        targetType: 'aoe_pull',
                        aoeSize: 3,              // 3×3 in phase 2
                        damage: 0.9,
                        pullStrength: 1,
                        desc: 'Larger whirlpool 3×3'
                    }
                ]
            }
        ],
        minionSpawns: [
            {
                phase: 1,
                cooldown: 20,
                maxAlive: 4,
                units: [
                    { key: 'tide_hunter', stars: 2, count: 2, name: 'Kraken Arm' }
                ]
            }
        ],
        loot: { gold: 500, xp: 800, firstClearGold: 500 }
    },

    // --- STUBS: Data defined but boss AI logic not implemented in this chunk ---

    stone_colossus: {
        name: 'Stone Colossus',
        emoji: '🗿🌿',
        element: 'earth',
        size: [2, 2],
        baseHp: 22000,
        hpScaling: 3,
        baseAtk: 0,
        atkScaling: 1.5,
        dr: 0.35,
        attackSpd: 2.0,
        range: 1,
        enrageTime: 120,
        enrageAtkMult: 2.0,
        enrageSpdMult: 1.5,
        phases: [
            {
                hpThreshold: 1.0,
                abilities: [
                    { name: 'Ground Pound', cooldown: 8, telegraphTime: 1.5, targetType: 'aoe_around_self', aoeRadius: 2, damage: 1.0, statusEffect: { type: 'root', duration: 1.5, value: 0 }, desc: 'AoE around self, roots' },
                    { name: 'Stone Skin', cooldown: 20, telegraphTime: 0, targetType: 'self_shield', shieldPct: 0.10, desc: 'Gains shield = 10% maxHP' },
                    { name: 'Boulder Toss', cooldown: 12, telegraphTime: 2.0, targetType: 'highest_atk', aoeRadius: 0, damage: 1.2, knockback: 2, desc: 'Hits highest ATK unit, knockback 2' }
                ]
            },
            {
                hpThreshold: 0.5,
                abilities: [
                    { name: 'Ground Pound', cooldown: 8, telegraphTime: 1.5, targetType: 'aoe_around_self', aoeRadius: 2, damage: 1.0, statusEffect: { type: 'root', duration: 1.5, value: 0 }, desc: 'Same + slow' },
                    { name: 'Stone Skin', cooldown: 15, telegraphTime: 0, targetType: 'self_shield', shieldPct: 0.10, desc: 'Faster shield regen' },
                    { name: 'Boulder Toss', cooldown: 12, telegraphTime: 2.0, targetType: 'highest_atk', aoeRadius: 0, damage: 1.2, knockback: 2, desc: 'Same' },
                    { name: 'Tectonic Shift', cooldown: 25, telegraphTime: 1.0, targetType: 'swap_positions', swapCount: 3, desc: 'Swaps 3 random player units' }
                ]
            }
        ],
        minionSpawns: [
            { phase: 1, cooldown: 30, maxAlive: 4, units: [{ key: 'stone_guard', stars: 2, count: 2, name: 'Stone Sentinel' }] }
        ],
        loot: { gold: 500, xp: 800, firstClearGold: 500 }
    },

    storm_phoenix: {
        name: 'Storm Phoenix',
        emoji: '🦅💨',
        element: 'wind',
        size: [2, 2],
        baseHp: 14000,
        hpScaling: 3,
        baseAtk: 0,
        atkScaling: 2.2,
        dr: 0.10,
        dodgeChance: 0.25,
        attackSpd: 0.8,
        range: 3,
        enrageTime: 120,
        enrageAtkMult: 2.0,
        enrageSpdMult: 1.5,
        phases: [
            {
                hpThreshold: 1.0,
                abilities: [
                    { name: 'Gale Strike', cooldown: 5, telegraphTime: 0.5, targetType: 'highest_atk', damage: 1.3, desc: 'Fast single-target' },
                    { name: 'Wind Wall', cooldown: 15, telegraphTime: 1.0, targetType: 'column_wall', wallDuration: 5, desc: 'Blocks ranged attacks across column' },
                    { name: 'Feather Storm', cooldown: 20, telegraphTime: 1.5, targetType: 'random_cells', cellCount: 5, damage: 0.5, desc: '5 random cells take damage' }
                ]
            },
            {
                hpThreshold: 0.5,
                rebirth: true,  // special: dies then revives at 50% with AoE
                abilities: [
                    { name: 'Gale Strike', cooldown: 5, telegraphTime: 0.5, targetType: 'highest_atk_x2', damage: 1.3, desc: 'Hits 2 targets' },
                    { name: 'Cyclone', cooldown: 15, telegraphTime: 1.5, targetType: 'aoe_pull', aoeSize: 3, damage: 0.3, pullStrength: 1, persistent: true, persistDuration: 5, desc: '3×3 persistent zone' },
                    { name: 'Feather Storm', cooldown: 20, telegraphTime: 1.5, targetType: 'random_cells', cellCount: 5, damage: 0.5, desc: 'Same' }
                ]
            }
        ],
        minionSpawns: [
            { phase: 1, cooldown: 20, maxAlive: 3, units: [{ key: 'zephyr_scout', stars: 1, count: 3, name: 'Wind Wisp' }] }
        ],
        loot: { gold: 500, xp: 800, firstClearGold: 500 }
    },

    void_sovereign: {
        name: 'The Void Sovereign',
        emoji: '👿✨',
        element: null,  // void = no element advantage
        size: [2, 2],
        baseHp: 30000,
        hpScaling: 4,
        baseAtk: 0,
        atkScaling: 2.5,
        dr: 0.20,
        attackSpd: 1.0,
        range: 3,
        enrageTime: 150,
        enrageAtkMult: 2.0,
        enrageSpdMult: 2.0,
        phases: [
            {
                hpThreshold: 1.0,
                abilities: [
                    { name: 'Void Tendrils', cooldown: 8, telegraphTime: 1.0, targetType: 'random_units', targetCount: 3, damage: 0.5, statusEffect: { type: 'root', duration: 1.5, value: 0 }, desc: '3 random units rooted + damaged' },
                    { name: 'Void Barrier', cooldown: 20, telegraphTime: 0, targetType: 'self_shield', shieldPct: 0.15, desc: 'Regenerating shield' }
                ]
            },
            {
                hpThreshold: 0.5,
                abilities: [
                    { name: 'Void Beam', cooldown: 10, telegraphTime: 2.0, targetType: 'row_most_units', damage: 1.0, desc: 'Line across row with most player units' },
                    { name: 'Void Barrier', cooldown: 20, telegraphTime: 0, targetType: 'self_shield', shieldPct: 0.15, desc: 'Same shield' },
                    { name: 'Annihilation', cooldown: 15, telegraphTime: 1.5, targetType: 'all_players', damage: 0.7, desc: 'Unavoidable team-wide damage' }
                ]
            }
        ],
        minionSpawns: [
            { phase: 1, cooldown: 30, maxAlive: 4, units: [{ key: 'hydro_mage', stars: 2, count: 2, name: 'Void Spawn' }, { key: 'flame_warrior', stars: 2, count: 2, name: 'Void Spawn' }] }
        ],
        loot: { gold: 1000, xp: 1500, firstClearGold: 1000 }
    }
};
```

---

## Part 2: 2×2 Grid Occupation

### Boss Placement
Bosses occupy a 2×2 block on the enemy side. Default position: rows 2-3, cols 3-4 (center-front of enemy area).

In `initCombat()`, when the enemy list contains a boss:
```js
// Detect boss: enemy has .isBoss = true (set by mission generation)
if (enemy.isBoss) {
    // Place 2×2 at rows 2-3, cols 3-4
    enemy.gridRow = 2;
    enemy.gridCol = 3;
    enemy.bossSize = enemy.bossData.size; // [2, 2]
    // Mark all 4 cells as occupied by this boss
    for (var br = 0; br < enemy.bossSize[0]; br++) {
        for (var bc = 0; bc < enemy.bossSize[1]; bc++) {
            grid[enemy.gridRow + br][enemy.gridCol + bc] = enemy;
        }
    }
}
```

### Grid Collision
When checking if a cell is occupied, treat all 4 boss cells as containing the boss. When pathfinding around the boss, all 4 cells are blocked.

### Distance to Boss
When calculating distance TO a boss (for targeting, range checks), use the nearest of the 4 cells:
```js
function getDistToBoss(unit, boss) {
    var minDist = 999;
    for (var br = 0; br < boss.bossSize[0]; br++) {
        for (var bc = 0; bc < boss.bossSize[1]; bc++) {
            var d = getManhattanDist(unit.gridRow, unit.gridCol, boss.gridRow + br, boss.gridCol + bc);
            if (d < minDist) minDist = d;
        }
    }
    return minDist;
}
```

### Boss Movement
Bosses do NOT move. They stay in their starting position. Skip movement logic for boss units in `combatTick()`.

### Boss Auto-Attacks
Bosses auto-attack the nearest player unit in range (use `getDistToBoss()` for range check). They attack like normal units but use their own `attackSpd`. Damage goes through `dealDamage()` as usual.

---

## Part 3: Boss Combat AI — `processBossTick()`

Add a new function called from `combatTick()` for each boss unit. This runs the boss's ability cooldowns, telegraphs, and phase transitions.

```js
function processBossTick(boss, dt) {
    if (!boss || boss.hp <= 0 || !boss.isBoss) return;

    var bossData = boss.bossData;
    var phase = boss.currentPhase;
    var phaseData = bossData.phases[phase];

    // --- Phase transition check ---
    if (phase < bossData.phases.length - 1) {
        var nextPhaseData = bossData.phases[phase + 1];
        if (boss.hp / boss.maxHp <= nextPhaseData.hpThreshold) {
            // Transition to next phase
            boss.currentPhase++;
            boss.phaseTransitioning = true;
            boss.phaseTransitionTimer = 2.0; // 2s invulnerability
            boss.stasis = 2.0;  // use existing stasis for invulnerability
            // Reset all ability cooldowns for new phase
            boss.abilityCooldowns = {};
            for (var a = 0; a < bossData.phases[boss.currentPhase].abilities.length; a++) {
                boss.abilityCooldowns[a] = 3.0; // 3s grace period before first ability in new phase
            }
            addCombatLog('⚠️ ' + boss.name + ' enters Phase ' + (boss.currentPhase + 1) + '!');
            return; // skip ability processing during transition
        }
    }

    // --- Phase transition timer ---
    if (boss.phaseTransitioning) {
        boss.phaseTransitionTimer -= dt;
        if (boss.phaseTransitionTimer <= 0) {
            boss.phaseTransitioning = false;
        }
        return; // skip abilities during transition
    }

    // --- Enrage check ---
    if (!boss.enraged && combatState.elapsed >= bossData.enrageTime) {
        boss.enraged = true;
        boss.attack = Math.floor(boss.attack * bossData.enrageAtkMult);
        boss.attackSpd = boss.attackSpd / bossData.enrageSpdMult;
        addCombatLog('🔴 ' + boss.name + ' ENRAGES!');
    }

    // --- Passive regen (Tidal Leviathan) ---
    if (bossData.regenPct && boss.hp > 0) {
        var bossRegen = Math.floor(boss.maxHp * bossData.regenPct * dt);
        if (bossRegen > 0) dealHealing(boss, boss, bossRegen);
    }

    // --- Ability cooldowns ---
    phaseData = bossData.phases[boss.currentPhase]; // refresh in case phase changed
    if (!boss.abilityCooldowns) boss.abilityCooldowns = {};

    for (var i = 0; i < phaseData.abilities.length; i++) {
        if (boss.abilityCooldowns[i] === undefined) {
            boss.abilityCooldowns[i] = phaseData.abilities[i].cooldown * 0.5; // first use at half cooldown
        }
        boss.abilityCooldowns[i] -= dt;

        if (boss.abilityCooldowns[i] <= 0) {
            var ability = phaseData.abilities[i];
            // Start telegraph or execute immediately
            if (ability.telegraphTime > 0) {
                startBossTelegraph(boss, ability, i);
            } else {
                executeBossAbility(boss, ability);
            }
            boss.abilityCooldowns[i] = ability.cooldown; // reset cooldown
        }
    }

    // --- Process active telegraphs ---
    processBossTelegraphs(boss, dt);

    // --- Minion spawning ---
    processBossMinions(boss, dt);
}
```

---

## Part 4: Telegraph System

### Data
Each boss has a `telegraphs` array (initialized to `[]` in combat):
```js
boss.telegraphs = []; // active telegraphs
// Each telegraph:
{
    ability: abilityData,
    abilityIndex: i,
    timer: 2.0,           // seconds until damage resolves
    targetCells: [{row: 4, col: 2}, ...],  // cells marked as danger
    targetUnits: [...]     // or specific target units (for single-target)
}
```

### `startBossTelegraph(boss, ability, abilityIndex)`
Determine which cells will be affected, add a telegraph entry:

```js
function startBossTelegraph(boss, ability, abilityIndex) {
    var cells = [];
    var targets = [];
    var players = combatState.playerUnits;

    switch (ability.targetType) {
    case 'highest_hp':
        // Find highest HP player, mark cells around them
        var bestTarget = null;
        for (var i = 0; i < players.length; i++) {
            if (players[i].hp > 0 && (!bestTarget || players[i].hp > bestTarget.hp)) bestTarget = players[i];
        }
        if (bestTarget) {
            cells = getCellsInRadius(bestTarget.gridRow, bestTarget.gridCol, ability.aoeRadius || 1);
            targets = [bestTarget];
        }
        break;

    case 'highest_atk':
    case 'highest_atk_x2':
        var sorted = players.filter(function(u){ return u.hp > 0; }).sort(function(a,b){ return b.attack - a.attack; });
        var count = ability.targetType === 'highest_atk_x2' ? 2 : 1;
        for (var i = 0; i < Math.min(count, sorted.length); i++) {
            targets.push(sorted[i]);
            cells = cells.concat(getCellsInRadius(sorted[i].gridRow, sorted[i].gridCol, ability.aoeRadius || 0));
        }
        break;

    case 'cone':
        // Mark specific columns in front of boss (player side)
        var startRow = boss.gridRow + boss.bossSize[0]; // first row past boss
        for (var r = startRow; r < startRow + (ability.coneRows || 2) && r < 8; r++) {
            for (var ci = 0; ci < ability.coneColumns.length; ci++) {
                var col = ability.coneColumns[ci];
                if (col >= 0 && col < 7) cells.push({row: r, col: col});
            }
        }
        break;

    case 'melee_range':
        // All cells within radius of any boss cell
        for (var br = 0; br < boss.bossSize[0]; br++) {
            for (var bc = 0; bc < boss.bossSize[1]; bc++) {
                var adjCells = getCellsInRadius(boss.gridRow + br, boss.gridCol + bc, ability.aoeRadius || 1);
                for (var ac = 0; ac < adjCells.length; ac++) {
                    // Only player-side cells (rows 4-7)
                    if (adjCells[ac].row >= 4) {
                        var exists = false;
                        for (var ec = 0; ec < cells.length; ec++) {
                            if (cells[ec].row === adjCells[ac].row && cells[ec].col === adjCells[ac].col) { exists = true; break; }
                        }
                        if (!exists) cells.push(adjCells[ac]);
                    }
                }
            }
        }
        break;

    case 'random_cells':
        // Pick N random cells on player side
        var candidates = [];
        for (var r = 4; r < 8; r++) {
            for (var c = 0; c < 7; c++) candidates.push({row: r, col: c});
        }
        // Shuffle and pick
        for (var j = candidates.length - 1; j > 0; j--) {
            var k = Math.floor(Math.random() * (j + 1));
            var tmp = candidates[j]; candidates[j] = candidates[k]; candidates[k] = tmp;
        }
        cells = candidates.slice(0, ability.cellCount || 3);
        break;

    case 'rows':
        // Mark all cells in specific rows
        for (var ri = 0; ri < ability.targetRows.length; ri++) {
            for (var c = 0; c < 7; c++) {
                cells.push({row: ability.targetRows[ri], col: c});
            }
        }
        break;

    case 'aoe_pull':
        // Pick a random area on player side, mark cells
        var centerR = 5 + Math.floor(Math.random() * 2); // rows 5-6
        var centerC = 1 + Math.floor(Math.random() * 5); // cols 1-5
        var halfSize = Math.floor((ability.aoeSize || 2) / 2);
        for (var r = centerR - halfSize; r <= centerR + halfSize; r++) {
            for (var c = centerC - halfSize; c <= centerC + halfSize; c++) {
                if (r >= 4 && r < 8 && c >= 0 && c < 7) cells.push({row: r, col: c});
            }
        }
        // Store center for pull calculation
        ability._pullCenter = {row: centerR, col: centerC};
        break;

    case 'random_units':
        var alive = players.filter(function(u){ return u.hp > 0; });
        var shuffled = alive.slice();
        for (var j = shuffled.length - 1; j > 0; j--) {
            var k = Math.floor(Math.random() * (j + 1));
            var tmp = shuffled[j]; shuffled[j] = shuffled[k]; shuffled[k] = tmp;
        }
        targets = shuffled.slice(0, ability.targetCount || 3);
        for (var t = 0; t < targets.length; t++) {
            cells.push({row: targets[t].gridRow, col: targets[t].gridCol});
        }
        break;

    case 'row_most_units':
        // Find row 4-7 with most alive player units
        var rowCounts = [0, 0, 0, 0];
        for (var i = 0; i < players.length; i++) {
            if (players[i].hp > 0 && players[i].gridRow >= 4) rowCounts[players[i].gridRow - 4]++;
        }
        var bestRow = 4;
        for (var r = 0; r < 4; r++) {
            if (rowCounts[r] > rowCounts[bestRow - 4]) bestRow = r + 4;
        }
        for (var c = 0; c < 7; c++) cells.push({row: bestRow, col: c});
        break;

    case 'all_players':
        // No telegraph cells for team-wide (instant warning text only)
        break;

    case 'self_shield':
    case 'column_wall':
        // No telegraph needed
        executeBossAbility(boss, ability);
        return;
    }

    if (cells.length > 0 || targets.length > 0) {
        boss.telegraphs.push({
            ability: ability,
            abilityIndex: abilityIndex,
            timer: ability.telegraphTime,
            targetCells: cells,
            targetUnits: targets
        });
        addCombatLog('⚠️ ' + boss.name + ' telegraphs ' + ability.name + '!');
    } else if (ability.targetType === 'all_players') {
        // Short telegraph for all-player abilities
        boss.telegraphs.push({
            ability: ability,
            timer: ability.telegraphTime || 1.0,
            targetCells: [],
            targetUnits: [],
            isTeamWide: true
        });
        addCombatLog('⚠️ ' + boss.name + ' charges ' + ability.name + '!');
    }
}
```

### `processBossTelegraphs(boss, dt)`
Tick down each telegraph, resolve when timer hits 0:
```js
function processBossTelegraphs(boss, dt) {
    for (var i = boss.telegraphs.length - 1; i >= 0; i--) {
        boss.telegraphs[i].timer -= dt;
        if (boss.telegraphs[i].timer <= 0) {
            executeBossAbility(boss, boss.telegraphs[i].ability, boss.telegraphs[i]);
            boss.telegraphs.splice(i, 1);
        }
    }
}
```

### `getCellsInRadius(row, col, radius)`
```js
function getCellsInRadius(centerRow, centerCol, radius) {
    var cells = [];
    for (var r = centerRow - radius; r <= centerRow + radius; r++) {
        for (var c = centerCol - radius; c <= centerCol + radius; c++) {
            if (r >= 0 && r < 8 && c >= 0 && c < 7 && getManhattanDist(centerRow, centerCol, r, c) <= radius) {
                cells.push({row: r, col: c});
            }
        }
    }
    return cells;
}
```

---

## Part 5: `executeBossAbility(boss, ability, telegraph)`

Resolve the ability's damage and effects on all units in the target area:

```js
function executeBossAbility(boss, ability, telegraph) {
    var players = combatState.playerUnits;
    var grid = combatState.grid;
    var bossAtk = boss.attack;

    // Find targets based on telegraph data or ability type
    var hitUnits = [];

    if (telegraph && telegraph.targetCells && telegraph.targetCells.length > 0) {
        // Hit all alive player units on the marked cells
        for (var i = 0; i < players.length; i++) {
            if (players[i].hp <= 0) continue;
            for (var j = 0; j < telegraph.targetCells.length; j++) {
                if (players[i].gridRow === telegraph.targetCells[j].row && players[i].gridCol === telegraph.targetCells[j].col) {
                    hitUnits.push(players[i]);
                    break;
                }
            }
        }
    } else if (telegraph && telegraph.targetUnits) {
        hitUnits = telegraph.targetUnits.filter(function(u){ return u.hp > 0; });
    } else if (ability.targetType === 'all_players') {
        hitUnits = players.filter(function(u){ return u.hp > 0; });
    }

    // --- Apply damage ---
    var dmgValue = ability.damage ? Math.floor(bossAtk * ability.damage) : 0;
    if (ability.flatDamage) dmgValue = ability.flatDamage;

    for (var h = 0; h < hitUnits.length; h++) {
        if (dmgValue > 0) {
            dealDamage(boss, hitUnits[h], dmgValue, {isAbility: true, triggerOnHit: false, applyElement: !!boss.element});
        }
        // Apply status effect
        if (ability.statusEffect) {
            addStatus(hitUnits[h], ability.statusEffect.type, ability.statusEffect.duration, ability.statusEffect.value, boss);
        }
    }

    // --- Knockback ---
    if (ability.knockback && ability.knockback > 0) {
        for (var h = 0; h < hitUnits.length; h++) {
            var unit = hitUnits[h];
            if (unit.hp <= 0) continue;
            // Push away from boss center
            var bossCenter = { row: boss.gridRow + 0.5, col: boss.gridCol + 0.5 };
            var dr = unit.gridRow > bossCenter.row ? 1 : -1;
            var dc = unit.gridCol > bossCenter.col ? 1 : (unit.gridCol < bossCenter.col ? -1 : 0);
            for (var kb = 0; kb < ability.knockback; kb++) {
                var newR = unit.gridRow + dr;
                var newC = unit.gridCol + dc;
                if (newR >= 4 && newR < 8 && newC >= 0 && newC < 7 && !grid[newR][newC]) {
                    moveUnitToCell(unit, newR, newC, grid);
                }
            }
        }
    }

    // --- Pull toward center (Whirlpool) ---
    if (ability.pullStrength && ability._pullCenter) {
        for (var h = 0; h < hitUnits.length; h++) {
            var unit = hitUnits[h];
            if (unit.hp <= 0) continue;
            var pullDr = ability._pullCenter.row > unit.gridRow ? 1 : (ability._pullCenter.row < unit.gridRow ? -1 : 0);
            var pullDc = ability._pullCenter.col > unit.gridCol ? 1 : (ability._pullCenter.col < unit.gridCol ? -1 : 0);
            var newR = unit.gridRow + pullDr;
            var newC = unit.gridCol + pullDc;
            if (newR >= 4 && newR < 8 && newC >= 0 && newC < 7 && (!grid[newR][newC] || grid[newR][newC] === unit)) {
                moveUnitToCell(unit, newR, newC, grid);
            }
        }
    }

    // --- Self Shield ---
    if (ability.targetType === 'self_shield') {
        grantShield(boss, boss, Math.floor(boss.maxHp * ability.shieldPct));
        addCombatLog(boss.name + ' gains a barrier!');
    }

    // --- Swap positions (Tectonic Shift) ---
    if (ability.targetType === 'swap_positions') {
        var alive = players.filter(function(u){ return u.hp > 0; });
        for (var j = alive.length - 1; j > 0; j--) {
            var k = Math.floor(Math.random() * (j + 1));
            var tmp = alive[j]; alive[j] = alive[k]; alive[k] = tmp;
        }
        var swapCount = Math.min(ability.swapCount || 2, Math.floor(alive.length / 2));
        for (var s = 0; s < swapCount * 2; s += 2) {
            if (s + 1 < alive.length) {
                var u1 = alive[s], u2 = alive[s + 1];
                var tmpR = u1.gridRow, tmpC = u1.gridCol;
                moveUnitToCell(u1, u2.gridRow, u2.gridCol, grid);
                moveUnitToCell(u2, tmpR, tmpC, grid);
            }
        }
        addCombatLog(boss.name + ' uses Tectonic Shift! Positions scrambled!');
    }

    if (ability.name) {
        addCombatLog(boss.name + ' uses ' + ability.name + '!');
    }
}
```

---

## Part 6: Minion Spawning

```js
function processBossMinions(boss, dt) {
    if (!boss.bossData.minionSpawns || boss.bossData.minionSpawns.length === 0) return;

    for (var i = 0; i < boss.bossData.minionSpawns.length; i++) {
        var spawn = boss.bossData.minionSpawns[i];
        if (boss.currentPhase < spawn.phase) continue; // not in this phase yet

        if (!boss.minionCooldowns) boss.minionCooldowns = {};
        if (boss.minionCooldowns[i] === undefined) boss.minionCooldowns[i] = spawn.cooldown * 0.5;
        boss.minionCooldowns[i] -= dt;

        if (boss.minionCooldowns[i] <= 0) {
            boss.minionCooldowns[i] = spawn.cooldown;

            // Count alive minions (non-boss enemies)
            var aliveMinions = 0;
            for (var m = 0; m < combatState.enemyUnits.length; m++) {
                if (!combatState.enemyUnits[m].isBoss && combatState.enemyUnits[m].hp > 0) aliveMinions++;
            }

            if (aliveMinions >= spawn.maxAlive) continue; // at cap

            // Spawn minions
            for (var u = 0; u < spawn.units.length; u++) {
                var minionDef = spawn.units[u];
                for (var c = 0; c < minionDef.count; c++) {
                    if (aliveMinions >= spawn.maxAlive) break;
                    // Create minion unit from template
                    var minion = createUnit(minionDef.key, minionDef.stars || 1);
                    minion.name = minionDef.name || minion.name;
                    minion.side = 'enemy';
                    minion.templateKey = minionDef.key;
                    // Initialize combat fields
                    minion.currentMana = 0;
                    minion.maxMana = (UNIT_TEMPLATES[minionDef.key] || {}).maxMana || 0;
                    minion.statusEffects = [];
                    minion.combatStats = { damageDealt: 0, damageTaken: 0, healingDone: 0, shieldGiven: 0, kills: 0, abilityCasts: 0 };
                    minion.ccHistory = [];
                    minion.ccImmuneUntil = 0;
                    minion.tenacity = 0;
                    minion.abilityBuffs = {};
                    minion.moveCooldown = 0;
                    minion.attackCooldown = 0;
                    minion.isCasting = false;
                    minion.castTimer = 0;

                    // Find empty cell on enemy side (rows 0-3)
                    var placed = false;
                    for (var row = 0; row < 4 && !placed; row++) {
                        for (var col = 0; col < 7 && !placed; col++) {
                            if (!combatState.grid[row][col]) {
                                minion.gridRow = row;
                                minion.gridCol = col;
                                combatState.grid[row][col] = minion;
                                placed = true;
                            }
                        }
                    }

                    if (placed) {
                        combatState.enemyUnits.push(minion);
                        aliveMinions++;
                        addCombatLog(boss.name + ' summons ' + minion.name + '!');
                    }
                }
            }
        }
    }
}
```

---

## Part 7: Mission Integration

### Add Boss Missions
Modify mission data in `missions.js`. Missions 7 and 14 become boss encounters. Add a `boss` field:

```js
// story_7 (existing mission — modify):
{
    id: 'story_7',
    name: 'The Veil Guardian',
    description: 'A powerful guardian blocks the path forward.',
    requiredLevel: 7,
    waves: [], // boss fight = single wave, no normal enemies
    boss: 'veil_guardian',
    rewards: { gold: 250, xp: 500 }
}

// story_14 (existing mission — modify):
{
    id: 'story_14',
    name: 'The Void Sovereign',
    description: 'The source of the corruption. End this.',
    requiredLevel: 14,
    waves: [],
    boss: 'void_sovereign',
    rewards: { gold: 1000, xp: 1500 }
}
```

### Boss Enemy Generation
In `startMissionCombat()` (ui-v2.js) or wherever enemies are set up, detect `mission.boss`:

```js
if (mission.boss && BOSS_DATA[mission.boss]) {
    var bossData = BOSS_DATA[mission.boss];
    // Calculate boss stats from player team
    var avgHp = 0, avgAtk = 0, teamPower = 0;
    var unitCount = 0;
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 7; c++) {
            var u = combatBoard[r][c];
            if (u && u.hp > 0) {
                avgHp += u.maxHp;
                avgAtk += u.attack;
                teamPower += u.maxHp;
                unitCount++;
            }
        }
    }
    if (unitCount > 0) { avgHp /= unitCount; avgAtk /= unitCount; }

    // Create boss unit
    var boss = {
        name: bossData.name,
        emoji: bossData.emoji,
        element: bossData.element,
        hp: bossData.baseHp + Math.floor((bossData.hpScaling > 10 ? avgHp : teamPower) * bossData.hpScaling),
        attack: bossData.baseAtk + Math.floor(avgAtk * bossData.atkScaling),
        attackSpd: bossData.attackSpd,
        range: bossData.range,
        moveSpd: 0,  // bosses don't move
        damageReduction: bossData.dr,
        dodgeChance: bossData.dodgeChance || 0,
        type: 'boss',
        side: 'enemy',
        isBoss: true,
        bossData: bossData,
        bossSize: bossData.size,
        currentPhase: 0,
        phaseTransitioning: false,
        phaseTransitionTimer: 0,
        enraged: false,
        telegraphs: [],
        abilityCooldowns: {},
        minionCooldowns: {},
        maxMana: 0,  // bosses use cooldowns, not mana
        currentMana: 0
    };
    boss.maxHp = boss.hp;

    // Set as the sole enemy (or alongside pre-placed normal enemies)
    combatEnemies = [boss];
}
```

### Boss in Combat Tick
In `combatTick()`, call `processBossTick()` for each boss unit:
```js
// In the unit processing loop:
if (unit.isBoss) {
    processBossTick(unit, dt);
    // Boss still auto-attacks via normal attack logic
    // But skip movement (bosses are stationary)
}
```

---

## Part 8: Boss Rendering

### 2×2 Boss on Grid
In `renderCombatBoard()` (ui-v2.js), when rendering a boss unit:
- The boss renders in its top-left cell but spans across 2×2
- Other 3 cells show as "part of boss" (don't render a separate unit there)
- Boss cell gets a larger display: bigger emoji, bigger HP bar

```js
// When iterating grid cells for rendering:
if (unit && unit.isBoss) {
    // Only render in the top-left cell of the boss
    if (r === unit.gridRow && c === unit.gridCol) {
        // Render boss (spanning 2×2 via CSS)
        cellHtml = '<div class="boss-unit" style="grid-row: span 2; grid-column: span 2;">';
        cellHtml += '<div class="boss-emoji">' + unit.emoji + '</div>';
        cellHtml += '<div class="boss-name">' + unit.name + '</div>';
        // Phase indicator
        cellHtml += '<div class="boss-phase">Phase ' + (unit.currentPhase + 1) + '</div>';
        // HP bar (wider)
        var hpPct = Math.max(0, Math.floor(unit.hp / unit.maxHp * 100));
        cellHtml += '<div class="boss-hp-bar"><div class="boss-hp-fill" style="width:' + hpPct + '%"></div></div>';
        // Shield bar
        if (unit.shield > 0) {
            var shPct = Math.min(100, Math.floor(unit.shield / unit.maxHp * 100));
            cellHtml += '<div class="boss-shield-bar"><div class="boss-shield-fill" style="width:' + shPct + '%"></div></div>';
        }
        // Enrage indicator
        if (unit.enraged) cellHtml += '<div class="boss-enrage">ENRAGED</div>';
        // Status icons
        // ... reuse existing status icon rendering
        cellHtml += '</div>';
    } else {
        // This cell is part of the boss — skip rendering a unit here
        cellHtml = '<div class="boss-occupied"></div>';
    }
}
```

### Telegraph Danger Zones
Render telegraph cells as red-highlighted overlays on the grid. In `renderCombatBoard()`:
```js
// After rendering all units, overlay telegraphs
var bossList = combatState.enemyUnits.filter(function(u){ return u.isBoss && u.hp > 0; });
for (var b = 0; b < bossList.length; b++) {
    var boss = bossList[b];
    for (var t = 0; t < boss.telegraphs.length; t++) {
        var tele = boss.telegraphs[t];
        for (var tc = 0; tc < tele.targetCells.length; tc++) {
            var cell = tele.targetCells[tc];
            // Add danger-zone class to the cell at (cell.row, cell.col)
            // The cell index in the flat grid = cell.row * 7 + cell.col
            var cellIdx = cell.row * 7 + cell.col;
            var cellEl = combatBoard.children[cellIdx];
            if (cellEl) cellEl.classList.add('danger-zone');
        }
    }
}
```

### CSS (`game-v2.html`)
```css
/* Boss unit */
.boss-unit {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle, #2a0a0a 0%, #1a0a0a 100%);
    border: 2px solid #ff4444;
    border-radius: 6px;
    padding: 4px;
    z-index: 2;
}
.boss-emoji { font-size: 28px; line-height: 1; }
.boss-name { font-size: 11px; font-weight: bold; color: #ff6666; }
.boss-phase { font-size: 9px; color: #ff9999; }
.boss-hp-bar {
    width: 90%;
    height: 6px;
    background: #333;
    border-radius: 3px;
    overflow: hidden;
    margin-top: 2px;
}
.boss-hp-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff2222 0%, #ff6644 100%);
    transition: width 0.1s;
}
.boss-shield-bar {
    width: 90%;
    height: 3px;
    background: #1a1a3a;
    border-radius: 1px;
    overflow: hidden;
}
.boss-shield-fill { height: 100%; background: #4488ff; }
.boss-enrage {
    font-size: 8px;
    color: #ff0000;
    font-weight: bold;
    animation: pulse 0.5s infinite;
}
.boss-occupied {
    background: rgba(255, 0, 0, 0.05);
    border: 1px dashed rgba(255, 68, 68, 0.3);
}

/* Telegraph danger zones */
.danger-zone {
    background: rgba(255, 0, 0, 0.25) !important;
    border: 1px solid rgba(255, 0, 0, 0.6) !important;
    animation: dangerPulse 0.5s infinite;
}
@keyframes dangerPulse {
    0%, 100% { background: rgba(255, 0, 0, 0.15); }
    50% { background: rgba(255, 0, 0, 0.35); }
}
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

/* Phase transition flash */
.phase-transition-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(255, 100, 0, 0.3);
    pointer-events: none;
    animation: phaseFlash 2s ease-out forwards;
    z-index: 10;
}
@keyframes phaseFlash {
    0% { opacity: 1; }
    100% { opacity: 0; }
}
```

### Phase Transition Visual
When `boss.phaseTransitioning` becomes true, add a brief flash overlay:
```js
if (boss.phaseTransitioning && boss.phaseTransitionTimer > 1.5) {
    // Show phase transition overlay (only for first 0.5s of the 2s transition)
    var overlay = document.createElement('div');
    overlay.className = 'phase-transition-overlay';
    document.getElementById('combat-area').appendChild(overlay);
    setTimeout(function(){ if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 2000);
}
```

---

## Part 9: Boss Win Condition

Currently, combat ends when all enemies are dead. For boss fights:
- The boss is the primary target. When boss HP reaches 0, the fight is WON (even if minions are alive).
- In `combatTick()`, add a boss-specific win check:

```js
// After existing win/loss check:
if (combatState.bossUnit && combatState.bossUnit.hp <= 0) {
    combatState.running = false;
    combatState.result = 'win';
}
```

Set `combatState.bossUnit` in `initCombat()` if a boss is present.

---

## Part 10: Boss in Scoreboard

In `renderCombatScoreboard()`, show the boss prominently at the top of the enemy section with a special label:

```js
if (unit.isBoss) {
    html += '<div class="sb-unit boss-sb">';
    html += '<div class="sb-name enemy" style="color:#ff4444;font-size:12px;">👑 ' + unit.name + '</div>';
    html += '<div class="sb-stats" style="font-size:10px;">';
    html += '<span style="color:#ff9999;">Phase ' + (unit.currentPhase + 1) + '</span>';
    html += '<span class="dmg">' + formatNum(stats.damageDealt) + ' dmg</span>';
    html += '</div>';
    html += '</div>';
}
```

---

## Files to Modify

### `missions.js`
- Add `BOSS_DATA` object with all 6 boss definitions
- Modify `story_7` and `story_14` mission data to include `boss` field
- Optionally add standalone boss challenge missions (future)

### `main-v2.js`
- Add `processBossTick()`, `startBossTelegraph()`, `processBossTelegraphs()`, `executeBossAbility()`, `processBossMinions()`
- Add `getCellsInRadius()`, `getDistToBoss()`
- In `initCombat()`: detect boss, set `combatState.bossUnit`, initialize boss fields
- In `combatTick()`: call `processBossTick()` for bosses, skip movement for bosses, boss win condition
- In `buildCombatGrid()`: handle 2×2 boss occupation

### `ui-v2.js`
- In `renderCombatBoard()`: render 2×2 boss spanning cells, telegraph danger zones
- In `renderCombatScoreboard()`: boss-specific display
- In `startMissionCombat()`: detect boss mission, create boss unit, pass to initCombat

### `game-v2.html`
- Add boss CSS (`.boss-unit`, `.boss-emoji`, `.boss-hp-bar`, `.danger-zone`, `.phase-transition-overlay`, etc.)

## What NOT to Do
- Do NOT implement Wind Wall (ranged attack blocking) — too complex for this chunk, add as a TODO comment
- Do NOT implement persistent Cyclone zones — simplified to one-time damage + pull
- Do NOT add new mission content beyond wiring story_7 and story_14 as boss fights
- Do NOT change the save format
- Do NOT use ES modules, import/export, `let`, `const`, or arrow functions

## Testing Checklist
1. Start mission 7 (Veil Guardian) — boss appears as 2×2, has large HP bar
2. Veil Slam: red danger zone appears on cells for 2s, then damage lands
3. Energy Pulse: all player units take 50 flat damage
4. Boss auto-attacks nearest player unit
5. Boss dies → mission won (even with potential minions alive in future bosses)
6. Start a higher-level boss (adjust test data if needed) — Infernal Wyvern
7. Phase 1: Flame Breath cone lights up columns 2-5 in red
8. At 50% HP: phase transition flash, brief invulnerability, abilities change
9. Phase 2: Flame Breath widens to columns 1-6, Inferno hits all units
10. Fire Drakes spawn after ~12s in phase 2
11. Minion cap (4 max) respected
12. Enrage triggers at 120s: boss ATK doubles, log message
13. Scoreboard shows boss with phase indicator
14. Telegraph cells pulse red and clear after ability resolves
15. No console errors

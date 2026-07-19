// combat-boss.js -- boss AI, phases, telegraphs, minions (split from main-v2.js)

function processBossTick(boss, dt) {
    if (!boss || boss.hp <= 0 || !boss.isBoss) return;

    var bossData = boss.bossData;
    var phase = boss.currentPhase;

    // --- Phase transition check ---
    if (phase < bossData.phases.length - 1) {
        var nextPhaseData = bossData.phases[phase + 1];
        if (boss.hp / boss.maxHp <= nextPhaseData.hpThreshold) {
            boss.currentPhase++;
            boss.phaseTransitioning = true;
            boss.phaseTransitionTimer = 2.0;
            boss.stasis = 2.0;
            boss.abilityCooldowns = {};
            for (var a = 0; a < bossData.phases[boss.currentPhase].abilities.length; a++) {
                boss.abilityCooldowns[a] = 3.0;
            }
            addCombatLog('⚠️ ' + boss.name + ' enters Phase ' + (boss.currentPhase + 1) + '!');
            return;
        }
    }

    // --- Phase transition timer ---
    if (boss.phaseTransitioning) {
        boss.phaseTransitionTimer -= dt;
        if (boss.phaseTransitionTimer <= 0) {
            boss.phaseTransitioning = false;
        }
        return;
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
    var phaseData = bossData.phases[boss.currentPhase];
    if (!boss.abilityCooldowns) boss.abilityCooldowns = {};

    for (var i = 0; i < phaseData.abilities.length; i++) {
        if (boss.abilityCooldowns[i] === undefined) {
            boss.abilityCooldowns[i] = phaseData.abilities[i].cooldown * 0.5;
        }
        boss.abilityCooldowns[i] -= dt;

        if (boss.abilityCooldowns[i] <= 0) {
            var ability = phaseData.abilities[i];
            if (ability.telegraphTime > 0) {
                startBossTelegraph(boss, ability, i);
            } else {
                executeBossAbility(boss, ability);
            }
            boss.abilityCooldowns[i] = ability.cooldown;
        }
    }

    // --- Process active telegraphs ---
    processBossTelegraphs(boss, dt);

    // --- Minion spawning ---
    processBossMinions(boss, dt);
}

function startBossTelegraph(boss, ability, abilityIndex) {
    var cells = [];
    var targets = [];
    var players = combatState.playerUnits;

    switch (ability.targetType) {
    case 'highest_hp':
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
        // Row band immediately below the boss's occupied cells (bossCells(),
        // grid.js -- "the row after the boss's 2 rows" holds regardless of
        // hex/square since bossCells() always spans exactly 2 rows).
        var bossRows = bossCells(boss.gridRow, boss.gridCol).map(function(c){ return c.row; });
        var startRow = Math.max.apply(null, bossRows) + 1;
        for (var r = startRow; r < startRow + (ability.coneRows || 2) && r < 8; r++) {
            for (var ci = 0; ci < ability.coneColumns.length; ci++) {
                var col = ability.coneColumns[ci];
                if (col >= 0 && col < 7) cells.push({row: r, col: col});
            }
        }
        break;

    case 'melee_range':
        var meleeAnchorCells = bossCells(boss.gridRow, boss.gridCol);
        for (var mi = 0; mi < meleeAnchorCells.length; mi++) {
            var adjCells = getCellsInRadius(meleeAnchorCells[mi].row, meleeAnchorCells[mi].col, ability.aoeRadius || 1);
            for (var ac = 0; ac < adjCells.length; ac++) {
                if (adjCells[ac].row >= 4) {
                    var exists = false;
                    for (var ec = 0; ec < cells.length; ec++) {
                        if (cells[ec].row === adjCells[ac].row && cells[ec].col === adjCells[ac].col) { exists = true; break; }
                    }
                    if (!exists) cells.push(adjCells[ac]);
                }
            }
        }
        break;

    case 'aoe_around_self':
        var selfAnchorCells = bossCells(boss.gridRow, boss.gridCol);
        for (var si = 0; si < selfAnchorCells.length; si++) {
            var selfCells = getCellsInRadius(selfAnchorCells[si].row, selfAnchorCells[si].col, ability.aoeRadius || 2);
            for (var sc = 0; sc < selfCells.length; sc++) {
                var dup = false;
                for (var dc = 0; dc < cells.length; dc++) {
                    if (cells[dc].row === selfCells[sc].row && cells[dc].col === selfCells[sc].col) { dup = true; break; }
                }
                if (!dup) cells.push(selfCells[sc]);
            }
        }
        break;

    case 'random_cells':
        var candidates = [];
        for (var r = 4; r < 8; r++) {
            for (var c = 0; c < 7; c++) candidates.push({row: r, col: c});
        }
        for (var j = candidates.length - 1; j > 0; j--) {
            var k = Math.floor(Math.random() * (j + 1));
            var tmp = candidates[j]; candidates[j] = candidates[k]; candidates[k] = tmp;
        }
        cells = candidates.slice(0, ability.cellCount || 3);
        break;

    case 'rows':
        for (var ri = 0; ri < ability.targetRows.length; ri++) {
            for (var c = 0; c < 7; c++) {
                cells.push({row: ability.targetRows[ri], col: c});
            }
        }
        break;

    case 'aoe_pull':
        // Prompt 69 hex migration: was a (2*halfSize+1)^2 square box (9 cells
        // at the default aoeSize 2); now cellsInRange radius halfSize (7 cells
        // at radius 1) clipped to the player half -- the nearest-smaller hex
        // AoE (see the Prompt 69 report's judgment-call table).
        var centerR = 5 + Math.floor(Math.random() * 2);
        var centerC = 1 + Math.floor(Math.random() * 5);
        var halfSize = Math.floor((ability.aoeSize || 2) / 2);
        var pullCells = cellsInRange(centerR, centerC, halfSize);
        for (var pc = 0; pc < pullCells.length; pc++) {
            if (pullCells[pc].row >= 4) cells.push(pullCells[pc]);
        }
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
        break;

    case 'self_shield':
    case 'column_wall':
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
        // Prompt 72 (VFX framework, Task 3): event DATA only -- js/vfx.js
        // renders pulsing groundDecals over `cells` for `duration`; nothing
        // else listens, so this cannot change combat behavior/goldens.
        if (typeof combatEvents !== 'undefined') {
            // Prompt 73: `ability` added to the payload (already-computed
            // reference, no new work) so js/vfx-abilities.js can look up a
            // hand-tuned boss "signature moment" recipe by boss+ability name
            // instead of the generic decal -- event DATA only.
            combatEvents.emit('bossTelegraphStart', { boss: boss, cells: cells, duration: ability.telegraphTime, ability: ability });
        }
    } else if (ability.targetType === 'all_players') {
        boss.telegraphs.push({
            ability: ability,
            timer: ability.telegraphTime || 1.0,
            targetCells: [],
            targetUnits: [],
            isTeamWide: true
        });
        addCombatLog('⚠️ ' + boss.name + ' charges ' + ability.name + '!');
        if (typeof combatEvents !== 'undefined') {
            combatEvents.emit('bossTelegraphStart', { boss: boss, cells: [], duration: ability.telegraphTime || 1.0, isTeamWide: true, ability: ability });
        }
    }
}

function processBossTelegraphs(boss, dt) {
    for (var i = boss.telegraphs.length - 1; i >= 0; i--) {
        boss.telegraphs[i].timer -= dt;
        if (boss.telegraphs[i].timer <= 0) {
            // Prompt 72 (VFX framework, Task 3): fired BEFORE executeBossAbility
            // (which itself may emit unitDamaged/ccApplied for the hit units) so
            // js/vfx.js's detonation nova+burst reads as "the telegraph zone went
            // off", then per-unit hit VFX layers on top. Event DATA only.
            if (typeof combatEvents !== 'undefined') {
                combatEvents.emit('bossTelegraphDetonate', {
                    boss: boss, cells: boss.telegraphs[i].targetCells,
                    targetUnits: boss.telegraphs[i].targetUnits,
                    isTeamWide: !!boss.telegraphs[i].isTeamWide,
                    ability: boss.telegraphs[i].ability
                });
            }
            executeBossAbility(boss, boss.telegraphs[i].ability, boss.telegraphs[i]);
            boss.telegraphs.splice(i, 1);
        }
    }
}

function executeBossAbility(boss, ability, telegraph) {
    var players = combatState.playerUnits;
    var grid = combatState.grid;
    var bossAtk = boss.attack;

    var hitUnits = [];

    if (telegraph && telegraph.targetCells && telegraph.targetCells.length > 0) {
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

    // Apply damage
    var dmgValue = ability.damage ? Math.floor(bossAtk * ability.damage) : 0;
    if (ability.flatDamage) dmgValue = ability.flatDamage;

    for (var h = 0; h < hitUnits.length; h++) {
        if (dmgValue > 0) {
            dealDamage(boss, hitUnits[h], dmgValue, {isAbility: true, triggerOnHit: false, applyElement: !!boss.element});
        }
        if (ability.statusEffect) {
            addStatus(hitUnits[h], ability.statusEffect.type, ability.statusEffect.duration, ability.statusEffect.value, boss);
        }
    }

    // Knockback: push directly away from the boss, one hex step per
    // knockback point, along the direction from the nearest occupied boss
    // cell (bossCells(), grid.js) to the unit -- computed once per unit
    // (matching the old code's "one dr/dc for the whole knockback distance"
    // behavior) via hexDirectionIndex(), then walked with hexStep().
    if (ability.knockback && ability.knockback > 0) {
        for (var h = 0; h < hitUnits.length; h++) {
            var unit = hitUnits[h];
            if (unit.hp <= 0) continue;
            var nearestBossCell = boss.gridRow, nearestBossCellCol = boss.gridCol, nearestBossDist = 999;
            var kbAnchorCells = bossCells(boss.gridRow, boss.gridCol);
            for (var kai = 0; kai < kbAnchorCells.length; kai++) {
                var kad = hexDistance(unit.gridRow, unit.gridCol, kbAnchorCells[kai].row, kbAnchorCells[kai].col);
                if (kad < nearestBossDist) { nearestBossDist = kad; nearestBossCell = kbAnchorCells[kai].row; nearestBossCellCol = kbAnchorCells[kai].col; }
            }
            var kbDir = hexDirectionIndex(nearestBossCell, nearestBossCellCol, unit.gridRow, unit.gridCol);
            for (var kb = 0; kb < ability.knockback; kb++) {
                var kbCell = hexStep(unit.gridRow, unit.gridCol, kbDir, 1);
                if (kbCell && kbCell.row >= 4 && kbCell.row < 8 && !grid[kbCell.row][kbCell.col]) {
                    moveUnitToCell(unit, kbCell.row, kbCell.col, grid);
                }
            }
        }
    }

    // Pull toward center (Whirlpool): one hex step toward ability._pullCenter,
    // direction via hexDirectionIndex()/hexStep() instead of square dr/dc sign.
    if (ability.pullStrength && ability._pullCenter) {
        for (var h = 0; h < hitUnits.length; h++) {
            var unit = hitUnits[h];
            if (unit.hp <= 0) continue;
            var pullDir = hexDirectionIndex(unit.gridRow, unit.gridCol, ability._pullCenter.row, ability._pullCenter.col);
            var pullCell = hexStep(unit.gridRow, unit.gridCol, pullDir, 1);
            if (pullCell && pullCell.row >= 4 && pullCell.row < 8 && (!grid[pullCell.row][pullCell.col] || grid[pullCell.row][pullCell.col] === unit)) {
                moveUnitToCell(unit, pullCell.row, pullCell.col, grid);
            }
        }
    }

    // Self Shield
    if (ability.targetType === 'self_shield') {
        grantShield(boss, boss, Math.floor(boss.maxHp * ability.shieldPct));
        addCombatLog(boss.name + ' gains a barrier!');
    }

    // Swap positions (Tectonic Shift)
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

    if (ability.name && ability.targetType !== 'self_shield' && ability.targetType !== 'swap_positions') {
        addCombatLog(boss.name + ' uses ' + ability.name + '!');
    }
}

function processBossMinions(boss, dt) {
    if (!boss.bossData.minionSpawns || boss.bossData.minionSpawns.length === 0) return;

    for (var i = 0; i < boss.bossData.minionSpawns.length; i++) {
        var spawn = boss.bossData.minionSpawns[i];
        if (boss.currentPhase < spawn.phase) continue;

        if (!boss.minionCooldowns) boss.minionCooldowns = {};
        if (boss.minionCooldowns[i] === undefined) boss.minionCooldowns[i] = spawn.cooldown * 0.5;
        boss.minionCooldowns[i] -= dt;

        if (boss.minionCooldowns[i] <= 0) {
            boss.minionCooldowns[i] = spawn.cooldown;

            var aliveMinions = 0;
            for (var m = 0; m < combatState.enemyUnits.length; m++) {
                if (!combatState.enemyUnits[m].isBoss && combatState.enemyUnits[m].hp > 0) aliveMinions++;
            }

            if (aliveMinions >= spawn.maxAlive) continue;

            for (var u = 0; u < spawn.units.length; u++) {
                var minionDef = spawn.units[u];
                for (var c = 0; c < minionDef.count; c++) {
                    if (aliveMinions >= spawn.maxAlive) break;
                    var minion = createUnit(minionDef.key, minionDef.stars || 1);
                    if (!minion) continue;
                    minion.name = minionDef.name || minion.name;
                    minion.templateKey = minionDef.key;
                    // BUGS.md #8 fix (Prompt 66): route through the shared
                    // spawn-init helper (combat-core.js) instead of hand-copying
                    // runtime fields -- this is what actually gives the minion
                    // initUnitPassiveState(), the piece the old hand-copy missed
                    // and which crashed combat the instant a minion with an
                    // on-attack passive (e.g. flame_warrior) attacked.
                    initSpawnedCombatUnitState(minion, 'enemy');

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
                        combatState.allUnits.push(minion);
                        aliveMinions++;
                        addCombatLog(boss.name + ' summons ' + minion.name + '!');
                    }
                }
            }
        }
    }
}


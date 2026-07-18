// ui-combat.js -- combat screen UI: scoreboard, synergy bars, wave transitions, results (split from ui-v2.js)

// ---- Combat Screen ----

var pendingMissionIndex = -1;
var pendingMissionIsStory = false;
var combatBoard = null;
var combatEnemies = [];
var currentWaveConfig = null;
var missionStarTracking = { totalDamageTaken: 0, unitsLostTotal: 0 };

function beginCombatScreen(sd) {
    showScreen('combat');
    missionStarTracking = { totalDamageTaken: 0, unitsLostTotal: 0 };

    // Reset speed button display
    var speedBtn = document.getElementById('speed-btn');
    if (speedBtn) speedBtn.textContent = COMBAT_SPEED + '\u00d7';

    // Clean up any previous unit layer
    var oldUnitLayer = document.getElementById('combat-unit-layer');
    if (oldUnitLayer) oldUnitLayer.remove();
    var dmgNums = document.getElementById('damage-numbers');
    if (dmgNums) dmgNums.innerHTML = '';

    // Deploy player team
    combatBoard = deployTeam(sd);

    // Hide overlays
    document.getElementById('combat-results').className = 'combat-results';
    document.getElementById('wave-transition').className = 'wave-transition';
    document.getElementById('combat-start-overlay').className = 'combat-start-overlay';

    // Check if mission is 3-starred → show Auto button
    var autoBtn = document.getElementById('auto-battle-btn');
    if (autoBtn) autoBtn.remove();
    if (pendingMissionIsStory && pendingMissionIndex >= 0) {
        var missionId = STORY_MISSIONS[pendingMissionIndex].id || ('story_' + pendingMissionIndex);
        if (sd.missions.storyStars[missionId] >= 3) {
            var startOverlay = document.getElementById('combat-start-overlay');
            if (startOverlay) {
                var ab = document.createElement('button');
                ab.id = 'auto-battle-btn';
                ab.className = 'btn-primary mt-md';
                ab.style.background = '#9944ff';
                ab.textContent = '\u26a1 Auto';
                ab.onclick = function() {
                    document.getElementById('combat-start-overlay').className = 'combat-start-overlay';
                    autoBattle();
                };
                startOverlay.appendChild(ab);
            }
        }
    }

    // Start first wave
    startWaveCombat();
}

function startWaveCombat() {
    var waveConfig = getCurrentWave();

    var progress = getMissionProgress();

    // Boss fight: no waves, generate boss enemy instead
    if (activeMission && activeMission.boss && BOSS_DATA && BOSS_DATA[activeMission.boss]) {
        document.getElementById('wave-info').textContent =
            progress.missionName + ' — Boss Fight!';

        var logEl = document.getElementById('combat-log');
        logEl.innerHTML = '';
        addLogEntry('👑 Boss fight begins!', 'warning');

        currentWaveConfig = null;
        combatEnemies = [];

        startMissionCombat(combatBoard, combatEnemies);
        return;
    }

    if (!waveConfig) return;

    document.getElementById('wave-info').textContent =
        progress.missionName + ' — Wave ' + progress.currentWave + ' / ' + progress.totalWaves;

    // Generate enemies
    combatEnemies = generateMissionWave(waveConfig);

    // Store wave config for combat init to read
    currentWaveConfig = waveConfig;

    // Clear log
    var logEl = document.getElementById('combat-log');
    logEl.innerHTML = '';
    addLogEntry('⚔️ Wave ' + progress.currentWave + ' begins!', 'info');

    // Start combat using V1 engine (adapted)
    startMissionCombat(combatBoard, combatEnemies);
}

function startMissionCombat(playerBoard, enemies) {
    // Build a gameState-like object for the combat engine
    var gs = {
        board: playerBoard,
        enemies: enemies,
        phase: 'combat',
        activeSynergies: {},
        activeElements: {}
    };

    // Calculate synergies from deployed board
    updateActiveSynergies(gs);

    // Boss mission: create boss unit from BOSS_DATA
    if (activeMission && activeMission.boss && BOSS_DATA && BOSS_DATA[activeMission.boss]) {
        var bossData = BOSS_DATA[activeMission.boss];
        // Calculate boss stats from player team
        var avgHp = 0, avgAtk = 0, teamPower = 0;
        var unitCount = 0;
        for (var br = 0; br < 4; br++) {
            for (var bc = 0; bc < 7; bc++) {
                var bu = playerBoard[br][bc];
                if (bu && bu.hp > 0) {
                    avgHp += bu.maxHp;
                    avgAtk += bu.attack;
                    teamPower += bu.maxHp;
                    unitCount++;
                }
            }
        }
        if (unitCount > 0) { avgHp /= unitCount; avgAtk /= unitCount; }

        var boss = {
            name: bossData.name,
            emoji: bossData.emoji,
            element: bossData.element,
            hp: bossData.baseHp + Math.floor((bossData.hpScaling > 10 ? avgHp : teamPower) * bossData.hpScaling),
            attack: bossData.baseAtk + Math.floor(avgAtk * bossData.atkScaling),
            attackSpd: bossData.attackSpd,
            range: bossData.range,
            moveSpd: 0,
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
            maxMana: 0,
            currentMana: 0,
            gridRow: 2,
            gridCol: 3
        };
        boss.maxHp = boss.hp;

        gs.enemies = [boss];
        enemies = [boss];
    }

    // Apply enemy synergies and evolutions if wave config says so
    var wc = currentWaveConfig;
    if (wc && (wc.enemySynergies || wc.enemyEvolutions)) {
        var enemyArchCounts = {};
        var enemyElemCounts = {};
        for (var si = 0; si < enemies.length; si++) {
            var su = enemies[si];
            if (su.archetype) enemyArchCounts[su.archetype] = (enemyArchCounts[su.archetype] || 0) + 1;
            if (su.element) enemyElemCounts[su.element] = (enemyElemCounts[su.element] || 0) + 1;
        }

        if (wc.enemyEvolutions) {
            var fakeGS = { activeSynergies: enemyArchCounts };
            for (var ev = 0; ev < enemies.length; ev++) {
                // Boost some enemies to star 2 for evolution eligibility
                if (enemies[ev].stars < 2 && Math.random() < 0.4) {
                    enemies[ev].stars = 2;
                    var evTmpl = UNIT_TEMPLATES[enemies[ev].key];
                    if (evTmpl) {
                        var evMult = getStarMultiplier(2);
                        enemies[ev].hp = Math.floor(evTmpl.hp * evMult);
                        enemies[ev].maxHp = Math.floor(evTmpl.hp * evMult);
                        enemies[ev].attack = Math.floor(evTmpl.attack * evMult);
                    }
                }
                checkEnemyEvolution(enemies[ev]);
            }
            // Recalculate counts after evolutions
            enemyArchCounts = {};
            enemyElemCounts = {};
            for (var ri = 0; ri < enemies.length; ri++) {
                if (enemies[ri].archetype) enemyArchCounts[enemies[ri].archetype] = (enemyArchCounts[enemies[ri].archetype] || 0) + 1;
                if (enemies[ri].element) enemyElemCounts[enemies[ri].element] = (enemyElemCounts[enemies[ri].element] || 0) + 1;
            }
        }

        if (wc.enemySynergies) {
            applySynergyBonuses(enemies, enemyArchCounts);
            applyEnemyElementBonuses(enemies, enemyElemCounts);
        }

        // Show enemy synergy info in combat log
        var synText = [];
        var archKeys2 = Object.keys(enemyArchCounts);
        for (var sk = 0; sk < archKeys2.length; sk++) {
            var aKey2 = archKeys2[sk];
            var aData2 = ARCHETYPES[aKey2];
            if (aData2) {
                var cnt2 = enemyArchCounts[aKey2];
                for (var tt = 0; tt < aData2.thresholds.length; tt++) {
                    if (cnt2 >= aData2.thresholds[tt]) {
                        synText.push(aData2.emoji + aData2.name + '(' + cnt2 + ')');
                    }
                }
            }
        }
        if (synText.length > 0) {
            addLogEntry('⚠️ Enemy synergies active: ' + synText.join(', '), 'warning');
        }
    }

    // Place enemies on the enemy rows (rows 0-3)
    placeEnemiesOnBoard(enemies);

    // Init combat
    initCombat(gs);

    // Clean up unit layer for fresh rendering
    var prevUnitLayer = document.getElementById('combat-unit-layer');
    if (prevUnitLayer) prevUnitLayer.remove();

    // Render synergy bar
    renderCombatSynergyBar();

    // Show start overlay instead of immediately starting combat
    document.getElementById('combat-start-overlay').className = 'combat-start-overlay show';

    // Defer initial board render until after the browser has laid out the combat screen.
    // On first load after refresh, offsetWidth/offsetHeight are 0 if we render synchronously,
    // which causes all unit overlays to stack at (0,0).
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            renderCombatBoard();
        });
    });
}

var COMBAT_TICK_MS = 50; // 20 fps
var COMBAT_DT = COMBAT_TICK_MS / 1000;
var COMBAT_SPEED = 1; // 1, 2, or 4

function toggleCombatSpeed() {
    if (COMBAT_SPEED === 1) COMBAT_SPEED = 2;
    else if (COMBAT_SPEED === 2) COMBAT_SPEED = 4;
    else COMBAT_SPEED = 1;
    var btn = document.getElementById('speed-btn');
    if (btn) btn.textContent = COMBAT_SPEED + '\u00d7';
}

function uiStartCombatLoop() {
    // Hide start overlay
    document.getElementById('combat-start-overlay').className = 'combat-start-overlay';

    // Initialize combat synergy sidebars
    if (combatState && typeof initCombatSynergySidebars === 'function') {
        initCombatSynergySidebars(combatState.playerUnits || [], combatState.enemyUnits || []);
    }

    // Re-render board with correct dimensions before combat starts
    // (sidebars may have changed the board width)
    renderCombatBoard();

    // Show FIGHT! text
    showCombatStartText();

    // Start combat loop
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
    setTimeout(combatLoop, COMBAT_TICK_MS);
}

function autoBattle() {
    // Run all waves silently to completion
    var maxIterations = 100000; // safety limit
    var iterations = 0;

    function runCurrentWave() {
        if (combatState) combatState.autoBattle = true;
        while (combatState && combatState.running && iterations < maxIterations) {
            combatTick(COMBAT_DT);
            iterations++;
        }
    }

    runCurrentWave();

    if (!combatState) { onWaveCombatEnd(); return; }

    var result = combatState.result;
    if (result === 'loss' || result === 'draw') {
        showMissionResults(false, 0);
        return;
    }

    // Track damage for star rating
    trackWaveDamage();

    // Loop through remaining waves
    while (advanceWave()) {
        healBoardUnits();
        startWaveCombat();
        if (combatState) combatState.autoBattle = true;
        while (combatState && combatState.running && iterations < maxIterations) {
            combatTick(COMBAT_DT);
            iterations++;
        }
        if (!combatState || combatState.result === 'loss' || combatState.result === 'draw') {
            showMissionResults(false, 0);
            return;
        }
        trackWaveDamage();
    }

    // All waves cleared
    var stars = calculateStarRating();
    showMissionResults(true, stars);
}

function showCombatStartText() {
    var area = document.getElementById('combat-area');
    if (!area) return;
    var overlay = document.createElement('div');
    overlay.className = 'combat-start-text';
    overlay.textContent = 'FIGHT!';
    area.appendChild(overlay);
    setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 1000);
}

// ---- Floating Damage Numbers ----

var lastDmgNumberTime = 0;

function spawnDamageNumber(row, col, text, type) {
    if (combatState && combatState.autoBattle) return;

    var now = Date.now();
    // Throttle at high speeds
    if (COMBAT_SPEED >= 4 && type !== 'crit' && type !== 'ability' && type !== 'boss') {
        if (now - lastDmgNumberTime < 150) return;
    }
    if (COMBAT_SPEED >= 2 && type === 'dot') {
        if (now - lastDmgNumberTime < 100) return;
    }
    lastDmgNumberTime = now;

    var container = document.getElementById('damage-numbers');
    if (!container) return;

    var board = document.getElementById('combat-board');
    if (!board) return;

    // Calculate pixel position from grid cell
    var cellW = board.offsetWidth / 7;
    var cellH = board.offsetHeight / 8;
    var x = col * cellW + cellW / 2;
    var y = row * cellH + cellH / 2;

    // Random horizontal offset to prevent overlap
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

// ---- AoE Ability Cell Highlights ----

function flashAbilityCells(cells, color, duration) {
    if (combatState && combatState.autoBattle) return;

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

function placeEnemiesOnBoard(enemies) {
    // Place enemies on rows 0-3 (top of 8x7 grid)
    // Front-to-back: row 3 is enemy front, row 0 is enemy back
    var idx = 0;
    for (var row = 3; row >= 0 && idx < enemies.length; row--) {
        for (var col = 0; col < 7 && idx < enemies.length; col++) {
            // Skip boss — already positioned
            if (enemies[idx].isBoss) {
                enemies[idx].side = 'enemy';
                idx++;
                continue;
            }
            enemies[idx].gridRow = row;
            enemies[idx].gridCol = col;
            enemies[idx].side = 'enemy';
            idx++;
        }
    }
}

function onWaveCombatEnd() {
    if (!combatState) return;
    var result = combatState.result;

    if (result === 'loss' || result === 'draw') {
        // Mission failed
        showMissionResults(false, 0);
        return;
    }

    // Track damage for star rating
    trackWaveDamage();

    // Check if more waves
    var hasMore = advanceWave();
    if (hasMore) {
        // Heal units and show wave transition
        healBoardUnits();
        showWaveTransition();
    } else {
        // Mission complete - calculate stars
        var stars = calculateStarRating();
        showMissionResults(true, stars);
    }
}

function trackWaveDamage() {
    // Count damage taken and units lost from player units
    if (!combatState) return;
    for (var i = 0; i < combatState.playerUnits.length; i++) {
        var u = combatState.playerUnits[i];
        if (u && u.hp < u.maxHp && u.hp > 0) {
            missionStarTracking.totalDamageTaken += (u.maxHp - u.hp);
        }
        if (u && u.hp <= 0) {
            missionStarTracking.unitsLostTotal++;
        }
    }
}

function healBoardUnits() {
    // Reset player units back to their combatBoard positions and heal them
    // First clear the combatBoard
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 7; c++) {
            combatBoard[r][c] = null;
        }
    }
    // Restore surviving player units to board
    if (combatState) {
        for (var i = 0; i < combatState.playerUnits.length; i++) {
            var u = combatState.playerUnits[i];
            if (u && u.hp > 0) {
                u.hp = u.maxHp;
                u.shield = 0;
                u.target = null;
                u.attackCooldown = 0;
                u.moveCooldown = 0;
                u.stasisUsed = false;
                u.titanResolveActive = false;
                u.frenzyStacks = 0;
                // Mana/ability reset between waves
                u.currentMana = 0;
                u.isCasting = false;
                u.castTimer = 0;
                u.statusEffects = [];
                u.ccHistory = [];
                u.ccImmuneUntil = 0;
                u.abilityBuffs = {};
                u.phoenixReviveUsed = false;
                u.phoenixRevivePending = false;
                u.deathAnimating = false;
                u.deathComplete = false;
                u.deathTimer = 0;
                // Restore to original player-side position
                // _origRow/_origCol are in combat grid coords (rows 4-7)
                // combatBoard is 4x7 (team builder coords): teamRow = combatRow - 4
                var placed = false;
                if (u._origRow !== undefined && u._origCol !== undefined) {
                    var teamRow = u._origRow - 4;
                    var teamCol = u._origCol;
                    if (teamRow >= 0 && teamRow < 4 && !combatBoard[teamRow][teamCol]) {
                        combatBoard[teamRow][teamCol] = u;
                        u.gridRow = u._origRow;
                        u.gridCol = u._origCol;
                        placed = true;
                    }
                }
                if (!placed) {
                    // Find any free cell on player side (team builder rows 0-3)
                    for (var pr = 0; pr < 4 && !placed; pr++) {
                        for (var pc = 0; pc < 7 && !placed; pc++) {
                            if (!combatBoard[pr][pc]) {
                                combatBoard[pr][pc] = u;
                                u.gridRow = 4 + pr;
                                u.gridCol = pc;
                                placed = true;
                            }
                        }
                    }
                }
            }
        }
    }
}

function calculateStarRating() {
    if (missionStarTracking.unitsLostTotal === 0 && missionStarTracking.totalDamageTaken === 0) return 3;
    if (missionStarTracking.unitsLostTotal === 0) return 2;
    return 1;
}

var waveRepositionSelected = null; // {row, col} of selected unit for repositioning

function showWaveTransition() {
    var progress = getMissionProgress();
    document.getElementById('wave-text').textContent = 'Wave ' + progress.currentWave;
    document.getElementById('wave-transition').className = 'wave-transition show';
    waveRepositionSelected = null;
    renderWaveRepositionGrid();
}

function renderWaveRepositionGrid() {
    // Find or create the reposition grid container
    var container = document.getElementById('wave-reposition-grid');
    if (!container) {
        container = document.createElement('div');
        container.id = 'wave-reposition-grid';
        container.style.cssText = 'margin-top:10px; width:100%; max-width:400px;';
        var btn = document.querySelector('#wave-transition .btn-primary');
        btn.parentNode.insertBefore(container, btn);
    }

    var html = '<div class="board-grid" style="gap:2px;">';
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 7; c++) {
            var u = combatBoard[r][c];
            var isSelected = waveRepositionSelected && waveRepositionSelected.row === r && waveRepositionSelected.col === c;
            var cellClass = 'board-cell' + (u && u.hp > 0 ? ' occupied' : '') + (isSelected ? ' selected' : '');
            var outline = isSelected ? 'outline:2px solid #e2b714;' : '';

            if (u && u.hp > 0) {
                html += '<div class="' + cellClass + '" style="' + outline + '" data-wr="' + r + ',' + c + '">' +
                    '<div class="cell-unit">' + ELEMENTS[u.element].emoji + '<br>' + u.name.split(' ')[0] + '</div></div>';
            } else {
                html += '<div class="' + cellClass + '" style="' + outline + '" data-wr="' + r + ',' + c + '"></div>';
            }
        }
    }
    html += '</div>';
    html += '<div style="font-size:11px; color:#888; margin-top:4px; text-align:center;">Click a unit, then click an empty cell to move it</div>';
    container.innerHTML = html;

    // Bind click handlers
    var cells = container.querySelectorAll('.board-cell');
    for (var i = 0; i < cells.length; i++) {
        cells[i].addEventListener('click', function() {
            var coords = this.getAttribute('data-wr').split(',');
            var cr = parseInt(coords[0]);
            var cc = parseInt(coords[1]);
            onWaveRepositionClick(cr, cc);
        });
    }
}

function onWaveRepositionClick(row, col) {
    var unit = combatBoard[row][col];

    if (waveRepositionSelected) {
        var sr = waveRepositionSelected.row;
        var sc = waveRepositionSelected.col;
        var srcUnit = combatBoard[sr][sc];

        // Swap or move
        combatBoard[sr][sc] = combatBoard[row][col];
        combatBoard[row][col] = srcUnit;

        // Update grid positions on unit objects
        if (srcUnit) { srcUnit.gridRow = row; srcUnit.gridCol = col; }
        if (combatBoard[sr][sc]) { combatBoard[sr][sc].gridRow = sr; combatBoard[sr][sc].gridCol = sc; }

        waveRepositionSelected = null;
        renderWaveRepositionGrid();
    } else if (unit && unit.hp > 0) {
        waveRepositionSelected = { row: row, col: col };
        renderWaveRepositionGrid();
    }
}

function uiNextWave() {
    document.getElementById('wave-transition').className = 'wave-transition';
    // Clean up reposition grid
    var grid = document.getElementById('wave-reposition-grid');
    if (grid) grid.remove();
    waveRepositionSelected = null;
    startWaveCombat();
}

function showMissionResults(victory, stars) {
    // Hide wave transition overlay if still showing
    document.getElementById('wave-transition').className = 'wave-transition';
    var grid = document.getElementById('wave-reposition-grid');
    if (grid) grid.remove();

    var sd = getSaveData();

    var titleEl = document.getElementById('results-title');
    titleEl.textContent = victory ? 'Victory!' : 'Defeat';
    titleEl.className = 'results-title ' + (victory ? 'victory' : 'defeat');

    var starsHtml = '';
    if (victory) {
        for (var i = 0; i < 3; i++) {
            starsHtml += i < stars ? '⭐' : '☆';
        }
    }
    document.getElementById('results-stars').textContent = starsHtml;

    if (victory && activeMission) {
        var rewards = calculateMissionRewards(sd, activeMission, stars);

        // Calculate base rewards for bonus display
        var starMult = 1.0;
        if (stars <= 1) starMult = 0.5;
        else if (stars <= 2) starMult = 0.75;
        var baseVE = activeMission.rewards.ve || activeMission.rewards.gold || 0;
        var baseGold = Math.floor(baseVE * starMult);
        var baseXP = Math.floor((activeMission.rewards.xp || 0) * starMult);
        var goldMult = getGoldMultiplier(sd);
        var xpMult = getXPMultiplier(sd);

        var goldBonusText = '';
        if (goldMult > 1.0) {
            goldBonusText = ' (+' + Math.round((goldMult - 1) * 100) + '% from Essence Reservoir)';
        }
        var xpBonusText = '';
        if (xpMult > 1.0) {
            xpBonusText = ' (+' + Math.round((xpMult - 1) * 100) + '% from Training Ground)';
        }

        var rewardHtml =
            '<span class="text-gold">+' + rewards.gold + ' VE' + goldBonusText + '</span> · ' +
            '<span class="text-green">+' + rewards.xp + ' XP' + xpBonusText + '</span>';

        // Show unit copies earned
        if (rewards.unitCopies && rewards.unitCopies.length > 0) {
            rewardHtml += '<br><span style="font-size:13px; color:#8bbcff;">Units earned:</span> ';
            for (var ri = 0; ri < rewards.unitCopies.length; ri++) {
                var rKey = rewards.unitCopies[ri];
                var rTmpl = UNIT_TEMPLATES[rKey];
                if (rTmpl) {
                    rewardHtml += '<span style="font-size:12px;">' + ELEMENTS[rTmpl.element].emoji + ' ' + rTmpl.name + '</span>';
                    if (ri < rewards.unitCopies.length - 1) rewardHtml += ', ';
                }
            }
        }

        // Show equipment drops (new system)
        if (rewards.equipmentDrops && rewards.equipmentDrops.length > 0) {
            rewardHtml += '<br><span style="font-size:13px; color:#e2b714;">Equipment found:</span> ';
            for (var ii = 0; ii < rewards.equipmentDrops.length; ii++) {
                var drop = rewards.equipmentDrops[ii];
                var dropColor = getItemRarityColor(drop);
                rewardHtml += '<span style="font-size:12px;">' + getItemEmoji(drop) + ' ' + getItemName(drop) +
                    ' (<span style="color:' + dropColor + ';">T' + drop.tier + ' ' + getItemRarityName(drop) + '</span>)</span>';
                if (ii < rewards.equipmentDrops.length - 1) rewardHtml += ' · ';
            }
        }

        // Show essence drops
        if (rewards.essenceDropsNew) {
            var enKeys = Object.keys(rewards.essenceDropsNew);
            if (enKeys.length > 0) {
                rewardHtml += '<br><span style="font-size:13px; color:#aa44ff;">Essences:</span> ';
                for (var eid = 0; eid < enKeys.length; eid++) {
                    var essKey = enKeys[eid];
                    var essData = ESSENCES[essKey];
                    rewardHtml += '<span style="font-size:12px; color:' + (essData ? essData.color : '#fff') + ';">' + (essData ? essData.emoji : '') + ' ' + essKey + ' x' + rewards.essenceDropsNew[essKey] + '</span>';
                    if (eid < enKeys.length - 1) rewardHtml += ' · ';
                }
            }
        }

        // Show gem drops
        if (rewards.gemDrops && rewards.gemDrops.length > 0) {
            rewardHtml += '<br><span style="font-size:13px; color:#4488ff;">Gems:</span> ';
            for (var gdi = 0; gdi < rewards.gemDrops.length; gdi++) {
                rewardHtml += '<span style="font-size:12px;">💎 ' + rewards.gemDrops[gdi] + '</span>';
                if (gdi < rewards.gemDrops.length - 1) rewardHtml += ' · ';
            }
        }

        document.getElementById('results-rewards').innerHTML = rewardHtml;

        // Mark story mission complete FIRST (so boss clear raises level cap before XP is awarded)
        if (pendingMissionIsStory && pendingMissionIndex >= 0) {
            completeStoryMission(sd, pendingMissionIndex, stars);
        }

        var leveled = applyMissionRewards(sd, rewards);
        if (leveled) {
            document.getElementById('results-rewards').innerHTML +=
                '<br><span class="text-green" style="font-size:20px;">LEVEL UP!</span>';
        }

        // Show hero level-ups
        if (rewards.heroLevelUps && rewards.heroLevelUps.length > 0) {
            var heroLvHtml = '<br><span style="font-size:13px; color:#e2b714;">Hero Level Ups:</span> ';
            for (var hli = 0; hli < rewards.heroLevelUps.length; hli++) {
                var hlvl = rewards.heroLevelUps[hli];
                heroLvHtml += '<span style="font-size:12px;">' + hlvl.name + ' Lv.' + hlvl.oldLevel + ' \u2192 Lv.' + hlvl.newLevel + '</span>';
                if (hli < rewards.heroLevelUps.length - 1) heroLvHtml += ', ';
            }
            document.getElementById('results-rewards').innerHTML += heroLvHtml;
        }

        // Show hero events (unlocks, deaths, departures)
        if (sd._pendingHeroEvents && sd._pendingHeroEvents.length > 0) {
            for (var hei = 0; hei < sd._pendingHeroEvents.length; hei++) {
                var hevt = sd._pendingHeroEvents[hei];
                var evtColor = hevt.type === 'death' ? '#ff4444' : (hevt.type === 'leave' ? '#ff8844' : '#44ff88');
                var evtIcon = hevt.type === 'unlock' ? '🆕' : (hevt.type === 'death' ? '💀' : (hevt.type === 'leave' ? '👋' : (hevt.type === 'return' ? '🔙' : '👻')));
                var evtMsg = hevt.message || (hevt.type === 'unlock' ? 'Hero ' + hevt.name + ' has joined!' : hevt.name);
                document.getElementById('results-rewards').innerHTML +=
                    '<br><span style="font-size:14px; color:' + evtColor + '; font-weight:bold;">' + evtIcon + ' ' + evtMsg + '</span>';
            }
            sd._pendingHeroEvents = [];
            autoSave(sd);
        }

        // Check achievements after mission
        var missionAch = checkAchievements(sd);
        if (missionAch.length > 0) { autoSave(sd); showAchievementToasts(missionAch); }
    } else {
        document.getElementById('results-rewards').textContent = 'No rewards earned.';
    }

    // MVP line
    if (combatState && combatState.playerUnits) {
        var mvp = null;
        for (var mv = 0; mv < combatState.playerUnits.length; mv++) {
            var mu = combatState.playerUnits[mv];
            if (mu.combatStats && (!mvp || mu.combatStats.damageDealt > mvp.combatStats.damageDealt)) {
                mvp = mu;
            }
        }
        if (mvp && mvp.combatStats && mvp.combatStats.damageDealt > 0) {
            var mvpEmoji = '';
            if (mvp.element && typeof ELEMENTS !== 'undefined' && ELEMENTS[mvp.element]) {
                mvpEmoji = ELEMENTS[mvp.element].emoji + ' ';
            }
            var mvpHtml = '<div style="margin-top:8px; font-size:13px; color:#e2b714;">MVP: ' +
                mvpEmoji + (mvp.name || 'Unit') + ' — ' +
                formatNum(mvp.combatStats.damageDealt) + ' damage' +
                (mvp.combatStats.kills > 0 ? ', ' + mvp.combatStats.kills + ' kill' + (mvp.combatStats.kills > 1 ? 's' : '') : '') +
                '</div>';
            document.getElementById('results-rewards').innerHTML += mvpHtml;
        }
    }

    document.getElementById('combat-results').className = 'combat-results show';
    renderTopBar();
}

function uiReturnFromCombat() {
    activeMission = null;
    // Clean up any lingering overlays
    document.getElementById('combat-results').className = 'combat-results';
    document.getElementById('wave-transition').className = 'wave-transition';
    var grid = document.getElementById('wave-reposition-grid');
    if (grid) grid.remove();
    // Clean up unit overlay layer and damage numbers
    var unitLayer = document.getElementById('combat-unit-layer');
    if (unitLayer) unitLayer.remove();
    var dmgNums = document.getElementById('damage-numbers');
    if (dmgNums) dmgNums.innerHTML = '';
    var enrageTimer = document.getElementById('enrage-timer');
    if (enrageTimer) enrageTimer.textContent = '';
    showScreen('hub');
}

// ---- Combat Board Rendering ----

function renderCombatUnitCell(unit, cssClass) {
    if (unit && unit.hp > 0) {
        var hpPct = Math.floor((unit.hp / unit.maxHp) * 100);
        var shieldPct = (unit.shield && unit.shield > 0) ? Math.min(100 - hpPct, Math.floor((unit.shield / unit.maxHp) * 100)) : 0;
        var shieldBar = shieldPct > 0 ?
            '<div style="height:100%; background:#4488ff; position:absolute; left:' + hpPct + '%; width:' + shieldPct + '%;"></div>' : '';
        var evolvedStyle = unit.evolved ? ' border:1px solid #e2b714; box-shadow:0 0 6px rgba(226,183,20,0.5);' : '';
        var evolvedIcon = unit.evolved ? '✨' : '';
        // Item icons for combat units
        var combatItemIcons = '';
        if (unit.combatItems && unit.combatItems.length > 0) {
            combatItemIcons = '<div style="font-size:7px; line-height:1;">';
            for (var ci = 0; ci < unit.combatItems.length; ci++) {
                combatItemIcons += unit.combatItems[ci];
            }
            combatItemIcons += '</div>';
        }
        var unitElemEmoji = (unit.element && ELEMENTS[unit.element]) ? ELEMENTS[unit.element].emoji : '';
        return '<div class="combat-cell ' + cssClass + '" style="' + evolvedStyle + '"><div class="combat-unit">' +
            unitElemEmoji + evolvedIcon +
            '<div style="font-size:8px;">' + unit.name.split(' ')[0] + '</div>' +
            combatItemIcons +
            '<div class="hp-bar" style="position:relative;"><div class="hp-fill' + (hpPct < 30 ? ' low' : '') +
            '" style="width:' + hpPct + '%"></div>' + shieldBar + '</div>' +
            '</div></div>';
    }
    return '<div class="combat-cell ' + cssClass + '"></div>';
}

function buildUnitCellHtml(unit) {
    if (unit.isBoss && unit.hp > 0) {
        var bHpPct = Math.max(0, Math.floor(unit.hp / unit.maxHp * 100));
        var bShieldBar = '';
        if (unit.shield && unit.shield > 0) {
            var bShPct = Math.min(100, Math.floor(unit.shield / unit.maxHp * 100));
            bShieldBar = '<div class="boss-shield-bar"><div class="boss-shield-fill" style="width:' + bShPct + '%"></div></div>';
        }
        var enrageHtml = unit.enraged ? '<div class="boss-enrage">ENRAGED</div>' : '';
        var phaseTransHtml = '';
        if (unit.phaseTransitioning) {
            phaseTransHtml = '<div style="font-size:8px; color:#ff9900; font-weight:bold;">INVULNERABLE</div>';
        }
        var bossEmoji = unit.emoji || '\ud83d\udc51';
        return '<div class="boss-unit">' +
            '<div class="boss-emoji">' + bossEmoji + '</div>' +
            '<div class="boss-name">' + unit.name + '</div>' +
            '<div class="boss-phase">Phase ' + (unit.currentPhase + 1) + '</div>' +
            '<div class="boss-hp-bar"><div class="boss-hp-fill" style="width:' + bHpPct + '%"></div></div>' +
            bShieldBar + enrageHtml + phaseTransHtml +
            '</div>';
    }

    var hpPct = Math.floor((unit.hp / unit.maxHp) * 100);
    var shieldPct = (unit.shield && unit.shield > 0) ? Math.min(100 - hpPct, Math.floor((unit.shield / unit.maxHp) * 100)) : 0;
    var shieldBar = shieldPct > 0 ?
        '<div style="height:100%; background:#4488ff; position:absolute; left:' + hpPct + '%; width:' + shieldPct + '%;"></div>' : '';
    var evolvedIcon = unit.evolved ? '\u2728' : '';
    var combatItemIcons = '';
    if (unit.combatItems && unit.combatItems.length > 0) {
        combatItemIcons = '<div style="font-size:7px; line-height:1;">';
        for (var ci = 0; ci < unit.combatItems.length; ci++) {
            combatItemIcons += unit.combatItems[ci];
        }
        combatItemIcons += '</div>';
    }
    var manaBar = '';
    if (unit.maxMana && unit.maxMana > 0) {
        var manaPct = Math.floor((unit.currentMana / unit.maxMana) * 100);
        manaBar = '<div class="mana-bar"><div class="mana-fill" style="width:' + manaPct + '%"></div></div>';
    }
    var statusIconsHtml = '';
    if (unit.statusEffects && unit.statusEffects.length > 0) {
        statusIconsHtml = '<div class="status-icons">';
        var shown = 0;
        var uniqueTypes = [];
        for (var si = 0; si < unit.statusEffects.length; si++) {
            var sType = unit.statusEffects[si].type;
            if (uniqueTypes.indexOf(sType) >= 0) continue;
            uniqueTypes.push(sType);
            if (shown < 3) {
                var sIcon = STATUS_ICONS[sType] || '?';
                statusIconsHtml += '<span class="status-icon" title="' + sType + '">' + sIcon + '</span>';
                shown++;
            }
        }
        if (uniqueTypes.length > 3) {
            statusIconsHtml += '<span class="status-overflow">+' + (uniqueTypes.length - 3) + '</span>';
        }
        statusIconsHtml += '</div>';
    }
    var elemEmoji = (unit.element && ELEMENTS[unit.element]) ? ELEMENTS[unit.element].emoji : '';
    return '<div class="combat-unit">' +
        elemEmoji + evolvedIcon +
        '<div style="font-size:7px;' + (unit.side === 'enemy' ? 'color:#ff6b6b;' : '') + '">' + unit.name.split(' ')[0] + '</div>' +
        combatItemIcons +
        '<div class="hp-bar" style="position:relative;"><div class="hp-fill' + (hpPct < 30 ? ' low' : '') +
        '" style="width:' + hpPct + '%"></div>' + shieldBar + '</div>' +
        manaBar +
        statusIconsHtml +
        '</div>';
}

function renderCombatBoard() {
    var boardEl = document.getElementById('combat-board');
    if (!combatState) return;

    var grid = combatState.grid;

    // Use percentage-based positioning so units are correct regardless of board size/timing
    var cellWPct = 100 / 7;
    var cellHPct = 100 / 8;

    // Collect telegraph danger cells
    var dangerCells = {};
    var bossList = combatState.enemyUnits.filter(function(u){ return u.isBoss && u.hp > 0; });
    for (var b = 0; b < bossList.length; b++) {
        var bossU = bossList[b];
        for (var t = 0; t < bossU.telegraphs.length; t++) {
            var tele = bossU.telegraphs[t];
            for (var tc = 0; tc < tele.targetCells.length; tc++) {
                dangerCells[tele.targetCells[tc].row + ',' + tele.targetCells[tc].col] = true;
            }
        }
    }

    // Rebuild background grid (always rebuild to keep danger zones and death markers current)
    var gridHtml = '';
    for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 7; c++) {
            var cls = r <= 3 ? 'enemy-row' : 'player-row';
            var borderStyle = r === 4 ? ' border-top:2px solid #555;' : '';
            var dangerClass = dangerCells[r + ',' + c] ? ' danger-zone' : '';
            var marker = '';
            if (combatState.deathMarkers && combatState.deathMarkers[r + ',' + c]) {
                marker = '<div class="death-marker">' + combatState.deathMarkers[r + ',' + c] + '</div>';
            }
            gridHtml += '<div class="combat-cell ' + cls + dangerClass + '" style="' + borderStyle + '">' + marker + '</div>';
        }
    }
    boardEl.innerHTML = gridHtml;

    // Render unit overlays inside the board (board is position:relative)
    var unitLayer = document.getElementById('combat-unit-layer');
    if (!unitLayer) {
        unitLayer = document.createElement('div');
        unitLayer.id = 'combat-unit-layer';
        unitLayer.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:4;';
        boardEl.appendChild(unitLayer);
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
        if (unit.hp <= 0 && !unit.deathAnimating) continue;
        if (!unit._uid) unit._uid = 'u' + u + '_' + Math.random().toString(36).substr(2, 4);
        activeIds[unit._uid] = true;

        var el = existingEls[unit._uid];
        if (!el) {
            el = document.createElement('div');
            el.dataset.uid = unit._uid;
            el.className = 'combat-unit-overlay';
            unitLayer.appendChild(el);
        }

        // Position with percentage-based layout (immune to board resize/timing issues)
        var targetXPct = unit.gridCol * cellWPct;
        var targetYPct = unit.gridRow * cellHPct;

        // Boss: span 2x2
        if (unit.isBoss) {
            el.style.width = (cellWPct * 2) + '%';
            el.style.height = (cellHPct * 2) + '%';
        } else {
            el.style.width = cellWPct + '%';
            el.style.height = cellHPct + '%';
        }

        el.style.left = targetXPct + '%';
        el.style.top = targetYPct + '%';

        // Death animation
        if (unit.deathAnimating) {
            var deathPct = Math.max(0, unit.deathTimer / 0.5);
            el.style.opacity = deathPct.toFixed(2);
            el.style.transform = 'scale(' + (0.5 + deathPct * 0.5).toFixed(2) + ')';
        } else {
            el.style.opacity = '1';
            el.style.transform = 'scale(1)';
        }

        // Casting glow — element color
        if (unit.isCasting) {
            var elemColor = '#ffffff';
            if (unit.element && typeof ELEMENTS !== 'undefined' && ELEMENTS[unit.element]) {
                elemColor = ELEMENTS[unit.element].color || '#ffffff';
            }
            el.style.boxShadow = '0 0 8px ' + elemColor;
        } else {
            el.style.boxShadow = 'none';
        }

        // Evolved border
        if (unit.evolved) {
            el.style.border = '1px solid #e2b714';
        } else {
            el.style.border = 'none';
        }

        // Render unit content
        el.innerHTML = buildUnitCellHtml(unit);
    }

    // Remove elements for dead/gone units
    for (var uid in existingEls) {
        if (!activeIds[uid]) {
            existingEls[uid].parentNode.removeChild(existingEls[uid]);
        }
    }

    // Phase transition flash overlay
    for (var bi = 0; bi < bossList.length; bi++) {
        var bossF = bossList[bi];
        if (bossF.phaseTransitioning && bossF.phaseTransitionTimer > 1.5) {
            var phOverlay = document.createElement('div');
            phOverlay.className = 'phase-transition-overlay';
            document.getElementById('combat-area').appendChild(phOverlay);
            setTimeout(function(){ if (phOverlay.parentNode) phOverlay.parentNode.removeChild(phOverlay); }, 2000);
        }
    }

    // Enrage timer display
    if (combatState.bossUnit && combatState.bossUnit.hp > 0 && !combatState.bossUnit.enraged) {
        var bossData = combatState.bossUnit.bossData || {};
        var enrageTime = bossData.enrageTime || 120;
        var timeLeft = enrageTime - combatState.elapsed;
        var timerEl = document.getElementById('enrage-timer');
        if (timerEl) {
            if (timeLeft > 0 && timeLeft <= 30) {
                timerEl.textContent = '\u23f1\ufe0f Enrage: ' + Math.ceil(timeLeft) + 's';
            } else {
                timerEl.textContent = '';
            }
        }
    } else {
        var timerEl2 = document.getElementById('enrage-timer');
        if (timerEl2) timerEl2.textContent = '';
    }

    renderCombatScoreboard();

    // Attach unit data to cells for tooltips
    var combatCells = boardEl.querySelectorAll('.combat-cell');
    for (var tc = 0; tc < combatCells.length; tc++) {
        var cellEl = combatCells[tc];
        var cellUnit = cellEl._unitRef;
        if (cellUnit) {
            cellEl._unitData = cellUnit;
        }
    }
}

// ---- Combat Scoreboard ----

function formatNum(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return '' + n;
}

function renderCombatScoreboard() {
    var sb = document.getElementById('combat-scoreboard');
    if (!sb || !combatState) return;

    var html = '<div class="sb-header">Combat Stats</div>';

    // Player units sorted by damage dealt descending
    var pUnits = combatState.playerUnits.slice().sort(function(a, b) {
        return (b.combatStats ? b.combatStats.damageDealt : 0) - (a.combatStats ? a.combatStats.damageDealt : 0);
    });

    html += '<div style="color:#4fc3f7; font-size:10px; padding:2px 4px; font-weight:bold;">Your Team</div>';
    for (var i = 0; i < pUnits.length; i++) {
        var u = pUnits[i];
        var stats = u.combatStats || {damageDealt:0, damageTaken:0, healingDone:0};
        var deadClass = u.hp <= 0 ? ' dead' : '';
        html += '<div class="sb-unit' + deadClass + '">';
        html += '<div class="sb-name">' + (u.emoji || '') + ' ' + (u.name || 'Unit');
        if (u.maxMana && u.maxMana > 0 && u.hp > 0) {
            html += ' <span style="color:#4488ff; font-size:9px;">\u26A1' + (u.currentMana || 0) + '/' + u.maxMana + '</span>';
        }
        html += '</div>';
        html += '<div class="sb-stats">';
        html += '<span class="dmg">' + formatNum(stats.damageDealt) + ' dmg</span>';
        if (stats.healingDone > 0) {
            html += '<span class="heal">' + formatNum(stats.healingDone) + ' heal</span>';
        }
        if (stats.abilityCasts && stats.abilityCasts > 0) {
            html += '<span style="color:#aa88ff;">' + stats.abilityCasts + ' cast' + (stats.abilityCasts > 1 ? 's' : '') + '</span>';
        }
        html += '</div>';
        html += '<div class="sb-stats"><span class="taken">' + formatNum(stats.damageTaken) + ' taken</span></div>';
        html += '</div>';
    }

    // Enemy units sorted by damage dealt descending
    var eUnits = combatState.enemyUnits.slice().sort(function(a, b) {
        return (b.combatStats ? b.combatStats.damageDealt : 0) - (a.combatStats ? a.combatStats.damageDealt : 0);
    });

    html += '<div style="color:#ef5350; font-size:10px; padding:2px 4px; margin-top:4px; font-weight:bold;">Enemy Team</div>';
    for (var j = 0; j < eUnits.length; j++) {
        var e = eUnits[j];
        var eStats = e.combatStats || {damageDealt:0, damageTaken:0, healingDone:0};
        var eDeadClass = e.hp <= 0 ? ' dead' : '';

        if (e.isBoss) {
            // Boss-specific scoreboard entry
            html += '<div class="sb-unit boss-sb' + eDeadClass + '">';
            html += '<div class="sb-name enemy" style="color:#ff4444;font-size:12px;">👑 ' + e.name + '</div>';
            html += '<div class="sb-stats" style="font-size:10px;">';
            html += '<span style="color:#ff9999;">Phase ' + (e.currentPhase + 1) + '</span>';
            html += '<span class="dmg">' + formatNum(eStats.damageDealt) + ' dmg</span>';
            html += '</div>';
            if (e.hp > 0) {
                var bossHpPct = Math.floor(e.hp / e.maxHp * 100);
                html += '<div class="sb-stats"><span style="color:#ff6666;">' + formatNum(e.hp) + '/' + formatNum(e.maxHp) + ' HP (' + bossHpPct + '%)</span></div>';
            }
            html += '<div class="sb-stats"><span class="taken">' + formatNum(eStats.damageTaken) + ' taken</span></div>';
            html += '</div>';
        } else {
            html += '<div class="sb-unit' + eDeadClass + '">';
            html += '<div class="sb-name enemy">' + (e.emoji || '') + ' ' + (e.name || 'Enemy');
            if (e.maxMana && e.maxMana > 0 && e.hp > 0) {
                html += ' <span style="color:#4488ff; font-size:9px;">\u26A1' + (e.currentMana || 0) + '/' + e.maxMana + '</span>';
            }
            html += '</div>';
            html += '<div class="sb-stats">';
            html += '<span class="dmg">' + formatNum(eStats.damageDealt) + ' dmg</span>';
            if (eStats.healingDone > 0) {
                html += '<span class="heal">' + formatNum(eStats.healingDone) + ' heal</span>';
            }
            if (eStats.abilityCasts && eStats.abilityCasts > 0) {
                html += '<span style="color:#aa88ff;">' + eStats.abilityCasts + ' cast' + (eStats.abilityCasts > 1 ? 's' : '') + '</span>';
            }
            html += '</div>';
            html += '<div class="sb-stats"><span class="taken">' + formatNum(eStats.damageTaken) + ' taken</span></div>';
            html += '</div>';
        }
    }

    sb.innerHTML = html;
}

// ---- Combat Synergy Bar ----

function renderCombatSynergyBar() {
    var bar = document.getElementById('combat-synergy-bar');
    if (!bar || !combatState) { if (bar) bar.innerHTML = ''; return; }

    // Use vertical layout for readable synergy descriptions
    var html = '<div style="display:flex; flex-direction:column; gap:3px;">';

    // Active archetype synergies
    var archKeys = Object.keys(combatState.activeSynergies || {});
    for (var i = 0; i < archKeys.length; i++) {
        var aKey = archKeys[i];
        var arch = ARCHETYPES[aKey];
        if (!arch) continue;
        var count = combatState.activeSynergies[aKey];
        var tierReached = 0;
        for (var t = 0; t < arch.thresholds.length; t++) {
            if (count >= arch.thresholds[t]) tierReached = t + 1;
        }
        if (tierReached > 0) {
            var archDesc = getSynergyArchBonusDesc(aKey, tierReached - 1);
            var thresholdStr = '';
            for (var th = 0; th < arch.thresholds.length; th++) {
                thresholdStr += (th === tierReached - 1 ? '<b style="color:#e2b714;">' + arch.thresholds[th] + '</b>' : '<span style="color:#555;">' + arch.thresholds[th] + '</span>');
                if (th < arch.thresholds.length - 1) thresholdStr += '/';
            }
            html += '<div style="background:#2a3a5e; padding:3px 8px; border-radius:4px; border-left:3px solid #e2b714;">' +
                '<div style="font-size:11px;">' + arch.emoji + ' <b>' + arch.name + '</b> <span style="color:#e2b714;">' + count + '</span> (' + thresholdStr + ')</div>' +
                '<div style="font-size:10px; color:#aaa; margin-top:1px;">' + archDesc + '</div></div>';
        }
    }

    // Active element synergies
    var elemBonuses = combatState.activeElementBonuses || {};
    var elemKeys = Object.keys(elemBonuses);
    for (var j = 0; j < elemKeys.length; j++) {
        var eKey = elemKeys[j];
        var elemSyn = ELEMENT_SYNERGIES[eKey];
        if (!elemSyn) continue;
        var eCount = (combatState.activeElements || {})[eKey] || 0;
        var isPrismatic = elemBonuses[eKey] && elemBonuses[eKey].isPrismatic;
        var bgColor = isPrismatic ? '#5a4a2e' : '#1a2a4e';
        var borderColor = isPrismatic ? '#e2b714' : (elemSyn.color || '#4a6a9e');
        var eTierReached = 0;
        for (var et = 0; et < elemSyn.thresholds.length; et++) {
            if (eCount >= elemSyn.thresholds[et]) eTierReached = et + 1;
        }
        var elemDesc = (eTierReached > 0 && elemSyn.bonuses[eTierReached - 1]) ? elemSyn.bonuses[eTierReached - 1].desc : '';
        var eThresholdStr = '';
        for (var eth = 0; eth < elemSyn.thresholds.length; eth++) {
            eThresholdStr += (eth === eTierReached - 1 ? '<b style="color:' + (elemSyn.color || '#e2b714') + ';">' + elemSyn.thresholds[eth] + '</b>' : '<span style="color:#555;">' + elemSyn.thresholds[eth] + '</span>');
            if (eth < elemSyn.thresholds.length - 1) eThresholdStr += '/';
        }
        html += '<div style="background:' + bgColor + '; padding:3px 8px; border-radius:4px; border-left:3px solid ' + borderColor + ';">' +
            '<div style="font-size:11px; color:' + (elemSyn.color || '#fff') + ';">' + elemSyn.emoji + ' <b>' + elemSyn.name + '</b> <span style="color:' + (elemSyn.color || '#e2b714') + ';">' + eCount + '</span> (' + eThresholdStr + ')</div>' +
            '<div style="font-size:10px; color:#aaa; margin-top:1px;">' + elemDesc + '</div></div>';
    }

    html += '</div>';
    bar.innerHTML = html || '<span class="text-muted">No active synergies</span>';
}

// ---- Log ----

function addLogEntry(msg, type) {
    var log = document.getElementById('combat-log');
    if (!log) return;
    var entry = document.createElement('div');
    entry.className = 'log-entry log-' + (type || 'info');
    entry.textContent = msg;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

function clearLog() {
    var log = document.getElementById('combat-log');
    if (log) log.innerHTML = '';
}

// ---- In-Combat Synergy Sidebars (Prompt 20 Phase D1) ----

function initCombatSynergySidebars(playerTeam, enemyTeam) {
    var playerSynergies = calculateTeamSynergies(playerTeam);
    var enemySynergies = calculateTeamSynergies(enemyTeam);

    renderCombatSynergySidebar('left', playerSynergies, 'Player');
    renderCombatSynergySidebar('right', enemySynergies, 'Enemy');
}

function calculateTeamSynergies(team) {
    var elementCounts = {};
    var archetypeCounts = {};

    for (var i = 0; i < team.length; i++) {
        var unit = team[i];
        if (!unit || unit.hp <= 0) continue;
        elementCounts[unit.element] = (elementCounts[unit.element] || 0) + 1;

        // Ascension-aware archetype counting
        if (typeof getUnitArchetypeContribution === 'function') {
            var contrib = getUnitArchetypeContribution(unit);
            archetypeCounts[contrib.primary] = (archetypeCounts[contrib.primary] || 0) + contrib.primaryCount;
            if (contrib.secondary && contrib.secondaryCount > 0) {
                archetypeCounts[contrib.secondary] = (archetypeCounts[contrib.secondary] || 0) + contrib.secondaryCount;
            }
        } else {
            archetypeCounts[unit.archetype] = (archetypeCounts[unit.archetype] || 0) + 1;
        }
    }

    return { elements: elementCounts, archetypes: archetypeCounts };
}

function renderCombatSynergySidebar(side, synergies, label) {
    var containerId = 'synergy-sidebar-' + side;
    var container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.cssText = 'font-size:10px; padding:4px; background:#16213e; border-radius:4px; min-width:80px;';
        var combatMain = document.getElementById('combat-main');
        if (combatMain) {
            if (side === 'left') {
                combatMain.insertBefore(container, combatMain.firstChild);
            } else {
                combatMain.appendChild(container);
            }
        }
    }

    container.innerHTML = '<div style="font-weight:bold; color:#888; margin-bottom:2px;">' + label + '</div>';

    // Elements
    var allElements = Object.keys(ELEMENTS);
    for (var ei = 0; ei < allElements.length; ei++) {
        var element = allElements[ei];
        var count = synergies.elements[element] || 0;
        if (count === 0) continue;

        var item = document.createElement('div');
        item.style.cssText = 'padding:1px 0;' + (count >= 2 ? ' color:#e2b714;' : ' color:#666;');

        var thresholdMarkers = '';
        var thresholds = [2, 4, 7, 10];
        for (var t = 0; t < thresholds.length; t++) {
            var lit = count >= thresholds[t];
            thresholdMarkers += '<span style="color:' + (lit ? '#e2b714' : '#333') + ';">●</span>';
        }

        item.innerHTML = getElementEmoji(element) + count + ' ' + thresholdMarkers;
        container.appendChild(item);
    }

    // Archetypes
    var allArchetypes = Object.keys(ARCHETYPES);
    for (var ai = 0; ai < allArchetypes.length; ai++) {
        var archetype = allArchetypes[ai];
        var aCount = synergies.archetypes[archetype] || 0;
        if (aCount === 0) continue;

        var aItem = document.createElement('div');
        var archData = ARCHETYPES[archetype];
        var isActive = archData && archData.thresholds && archData.thresholds.length > 0 && aCount >= archData.thresholds[0];
        aItem.style.cssText = 'padding:1px 0;' + (isActive ? ' color:#e2b714;' : ' color:#666;');
        aItem.textContent = archData.emoji + ' ' + aCount;
        container.appendChild(aItem);
    }
}

// ---- Combat Unit Tooltips (Prompt 20 Phase D2) ----

function initCombatUnitTooltips() {
    var unitCells = document.querySelectorAll('#combat-board .combat-cell');
    for (var i = 0; i < unitCells.length; i++) {
        (function(cell) {
            cell.addEventListener('mouseenter', function(e) {
                var unitData = cell._unitData;
                if (!unitData) return;

                var tooltip = document.createElement('div');
                tooltip.className = 'unit-combat-tooltip';
                tooltip.style.cssText = 'position:fixed; background:#16213e; border:1px solid #444; border-radius:6px; padding:8px; font-size:11px; z-index:100; pointer-events:none; max-width:200px;';

                var buffsHTML = '';
                if (unitData.buffs && unitData.buffs.length > 0) {
                    for (var b = 0; b < unitData.buffs.length; b++) {
                        buffsHTML += '<div style="color:#66bb6a;">' + unitData.buffs[b] + '</div>';
                    }
                }

                tooltip.innerHTML =
                    '<div style="font-weight:bold;">' + unitData.name + '</div>' +
                    '<div>HP: ' + Math.floor(unitData.hp) + ' / ' + unitData.maxHp + '</div>' +
                    '<div>ATK: ' + unitData.attack + '</div>' +
                    '<div>' + getElementEmoji(unitData.element) + ' ' + unitData.element + '</div>' +
                    (buffsHTML || '<div style="color:#555;">No active buffs</div>');

                document.body.appendChild(tooltip);

                var rect = cell.getBoundingClientRect();
                tooltip.style.left = (rect.right + 10) + 'px';
                tooltip.style.top = (rect.top) + 'px';

                cell._tooltip = tooltip;
            });

            cell.addEventListener('mouseleave', function() {
                if (cell._tooltip) {
                    cell._tooltip.remove();
                    cell._tooltip = null;
                }
            });
        })(unitCells[i]);
    }
}

// ---- Combat Log Enhancement (Prompt 20 Phase D3) ----

function logCombatAction(actionType, details) {
    var logContainer = document.getElementById('combat-log');
    if (!logContainer) return;

    var message = '';
    var color = '';

    if (actionType === 'passive-trigger') {
        message = details.unit + '\'s ' + details.passive + ' deals ' + details.damage + ' bonus!';
        color = getElementColor(details.element);
    } else if (actionType === 'ability-trigger') {
        message = details.unit + '\'s ' + details.ability + ' activates!';
        color = '#FFD700';
    } else if (actionType === 'attack') {
        message = details.attacker + ' attacks ' + details.defender + ' for ' + details.damage + ' damage';
        color = '#ccc';
    } else if (actionType === 'death') {
        message = details.unit + ' has been defeated!';
        color = '#ff4444';
    } else if (actionType === 'synergy') {
        message = details.name + ' synergy activated! (' + details.count + ')';
        color = '#e2b714';
    } else {
        message = details.message || actionType;
        color = '#888';
    }

    var entry = document.createElement('div');
    entry.style.cssText = 'font-size:11px; padding:1px 4px; color:' + color + ';';
    entry.textContent = message;
    logContainer.appendChild(entry);

    // Auto-scroll
    logContainer.scrollTop = logContainer.scrollHeight;

    // Limit log entries to prevent memory issues
    while (logContainer.children.length > 200) {
        logContainer.removeChild(logContainer.firstChild);
    }
}


// ui-combat.js -- combat screen UI: scoreboard, synergy bars, wave transitions, results (split from ui-v2.js)

// ---- Combat Screen ----

var pendingMissionIndex = -1;
var pendingMissionIsStory = false;
var combatBoard = null;
var combatEnemies = [];
var currentWaveConfig = null;
var missionStarTracking = { totalDamageTaken: 0, unitsLostTotal: 0 };

// Prompt 67: registered ONCE, at script-load time, via combatEvents.onPersistent()
// -- NOT per-wave. See the matching comment in js/render-dom.js (RENDER_DOM's
// floatingText/abilityFlash registration) for why: initCombat() can emit
// 'logMessage' (via combat-core.js's addCombatLog(), e.g. from a combat-start
// passive) before a per-wave on() listener registered after initCombat()
// returns would exist yet. addLogEntry itself is defined further down this
// file, but that's fine -- this closure doesn't call it until an event fires,
// long after the whole script has finished loading.
if (typeof combatEvents !== 'undefined' && typeof combatEvents.onPersistent === 'function') {
    combatEvents.onPersistent('logMessage', function(p) { addLogEntry(p.text, p.cls); });
}

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

    // Prompt 64: endless mode / Survival challenge generate their own
    // tier-weighted enemy rosters (see js/endless.js's generateEndlessEnemies)
    // instead of the generic per-stage generateMissionWave(), and "Wave N/M"
    // doesn't make sense for either (both are open-ended).
    if (activeMission && activeMission.isEndless) {
        document.getElementById('wave-info').textContent = '🕳️ The Abyss — Floor ' + endlessRunState.floor;
        combatEnemies = generateEndlessEnemies(endlessRunState.floor);
    } else if (activeMission && activeMission.isChallengeSurvival) {
        document.getElementById('wave-info').textContent = '🌊 Survival — Wave ' + survivalRunState.wave;
        combatEnemies = generateEndlessEnemies(survivalRunState.wave);
    } else {
        document.getElementById('wave-info').textContent =
            progress.missionName + ' — Wave ' + progress.currentWave + ' / ' + progress.totalWaves;
        combatEnemies = generateMissionWave(waveConfig);
    }

    // Store wave config for combat init to read
    currentWaveConfig = waveConfig;

    // Clear log
    var logEl = document.getElementById('combat-log');
    logEl.innerHTML = '';
    if (activeMission && activeMission.isEndless) {
        addLogEntry('⚔️ Floor ' + endlessRunState.floor + ' begins!', 'info');
    } else if (activeMission && activeMission.isChallengeSurvival) {
        addLogEntry('⚔️ Wave ' + survivalRunState.wave + ' begins!', 'info');
    } else {
        addLogEntry('⚔️ Wave ' + progress.currentWave + ' begins!', 'info');
    }

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

    // Prompt 64: endless mode's pure-stat floor modifiers (enemy ATK/DR up,
    // player healing/attack-speed down) are applied directly to combatState
    // here, right after initCombat()'s per-unit resets run -- the same timing
    // synergy/hero bonuses already use. Encounter-mechanic-kind modifiers need
    // no seam: they ride activeMission.encounterMechanic, which initCombat()
    // already reads via setupCombatEncounterMechanics(). No-op outside endless.
    if (typeof applyEndlessFloorModifierEffects === 'function') applyEndlessFloorModifierEffects(combatState);

    // Prompt 67: resolve + init the active renderer for this wave. The
    // combatEvents listeners it needs (floatingText/abilityFlash) and the
    // 'logMessage' chrome listener above are registered once at script-load
    // time (combatEvents.onPersistent(), see js/render-dom.js and the top of
    // this file) -- they survive initCombat()'s per-wave combatEvents.reset(),
    // so there's nothing per-wave to (re)register here anymore, just the
    // renderer's own per-wave init() (board DOM cleanup).
    var activeRenderer = (typeof getActiveRenderer === 'function') ? getActiveRenderer() : null;
    if (activeRenderer && typeof activeRenderer.init === 'function') {
        var rendererProgress = getMissionProgress();
        activeRenderer.init(document.getElementById('combat-area'), combatState, {
            missionName: rendererProgress ? rendererProgress.missionName : null,
            waveIndex: rendererProgress ? rendererProgress.currentWave : null,
            totalWaves: rendererProgress ? rendererProgress.totalWaves : null,
            encounterMechanic: activeMission ? activeMission.encounterMechanic : null,
            isBoss: !!(activeMission && activeMission.boss)
        });
    }

    // Render synergy bar
    renderCombatSynergyBar();

    // Show start overlay instead of immediately starting combat
    document.getElementById('combat-start-overlay').className = 'combat-start-overlay show';

    // Defer initial board render until after the browser has laid out the combat screen.
    // On first load after refresh, offsetWidth/offsetHeight are 0 if we render synchronously,
    // which causes all unit overlays to stack at (0,0).
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            renderCombatFrame(activeRenderer, 0);
        });
    });
}

// ---- Prompt 62: Encounter mechanic banner + live HUD readout ----
// Prompt 67: moved to js/render-dom.js (renderEncounterMechanicBanner /
// updateEncounterMechanicHud) -- battlefield overlay content, called every
// frame from render-dom.js's renderCombatBoard(), not chrome.

var COMBAT_TICK_MS = 50; // 20 fps
var COMBAT_DT = COMBAT_TICK_MS / 1000;
var COMBAT_SPEED = 1; // 1, 2, or 4

// Prompt 67: renderer + render-loop bookkeeping. The combat tick pump
// (setTimeout, COMBAT_TICK_MS-cadenced, unchanged from before this refactor)
// and the render loop (requestAnimationFrame, browser-cadenced) are now two
// independent loops instead of one fused setTimeout callback -- see
// uiStartCombatLoop() below. combatRenderLoopActive is the render loop's own
// stop flag; a stray leftover requestAnimationFrame callback checks it and
// no-ops instead of rendering/rescheduling once combat has ended.
var combatRenderLoopActive = false;

// Renders one frame through whichever renderer is active (falls back to the
// DOM board renderer directly if none is registered/resolvable -- keeps this
// helper safe to call even before js/render-dom.js registers 'dom').
function renderCombatFrame(renderer, dtMs) {
    if (renderer && typeof renderer.frame === 'function') {
        renderer.frame(dtMs);
    } else if (typeof renderCombatBoard === 'function') {
        renderCombatBoard();
    }
}

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

    var activeRenderer = (typeof getActiveRenderer === 'function') ? getActiveRenderer() : null;

    // Re-render board with correct dimensions before combat starts
    // (sidebars may have changed the board width)
    renderCombatFrame(activeRenderer, 0);

    // Show FIGHT! text
    showCombatStartText();

    // Prompt 67: the combat tick (logic pump) and the render loop are now
    // independent. The tick pump keeps its exact pre-refactor cadence/
    // semantics (setTimeout, COMBAT_TICK_MS, COMBAT_SPEED ticks per call).
    function tickLoop() {
        // Run multiple physics ticks per frame at higher speeds
        for (var s = 0; s < COMBAT_SPEED; s++) {
            if (combatState && combatState.running) {
                combatTick(COMBAT_DT);
            }
        }

        if (combatState && combatState.running) {
            setTimeout(tickLoop, COMBAT_TICK_MS);
        } else {
            // Render the final post-combat state once more before handing off
            // to the results/wave-transition flow -- guarantees a render always
            // happens immediately before onWaveCombatEnd(), exactly like the old
            // fused loop did, regardless of how the independent rAF render loop
            // below happens to be scheduled relative to this setTimeout.
            combatRenderLoopActive = false;
            renderCombatFrame(activeRenderer, 0);
            onWaveCombatEnd();
        }
    }

    // Render loop: requestAnimationFrame, decoupled from the tick pump above.
    combatRenderLoopActive = true;
    var lastFrameTime = null;
    function renderLoop(now) {
        if (!combatRenderLoopActive) return;
        var dtMs = lastFrameTime === null ? 0 : (now - lastFrameTime);
        lastFrameTime = now;
        renderCombatFrame(activeRenderer, dtMs);
        if (combatRenderLoopActive) requestAnimationFrame(renderLoop);
    }
    requestAnimationFrame(renderLoop);

    setTimeout(tickLoop, COMBAT_TICK_MS);
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

// Prompt 67: showCombatStartText / spawnDamageNumber / flashAbilityCells all
// moved to js/render-dom.js -- battlefield visuals, not chrome. combat-*.js
// still calls spawnDamageNumber()/flashAbilityCells() by the same names; those
// are now logic-layer combatEvents-emitting shims defined in combat-core.js
// (see the Prompt 67 comment block there), not this file.

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

    // Prompt 64: endless mode and the Survival challenge are both
    // continuous, open-ended "missions" (see js/endless.js and
    // js/challenges.js) that manage their own floor/wave progression and
    // never use the generic star-rated results screen -- route to them
    // before any of the normal win/loss handling below.
    if (activeMission && activeMission.isEndless) {
        onEndlessFloorEnd(result === 'win');
        return;
    }
    if (activeMission && activeMission.isChallengeSurvival) {
        onSurvivalWaveEnd(result === 'win');
        return;
    }
    // Time Trial accumulates elapsed combat time across every wave of its
    // (possibly multi-wave) stage, win or lose, so a losing attempt doesn't
    // silently drop the clock -- only used at victory time in
    // renderChallengeVictoryResults().
    if (activeMission && activeMission.isChallengeTimeTrial && typeof accumulateTimeTrialElapsed === 'function') {
        accumulateTimeTrialElapsed();
    }

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

// Prompt 64: skipHpReset lets endless/survival floor transitions reuse this
// exact restore-to-board logic (position/cooldown/status reset, dead units
// dropped) while carrying HP forward instead of fully healing -- "no healing
// reset — units keep current HP; dead units stay dead for the run" per the
// endless mode spec. Regular mission wave transitions call this with no
// argument and are unaffected (skipHpReset is falsy -> full heal as before).
function healBoardUnits(skipHpReset) {
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
                if (!skipHpReset) u.hp = u.maxHp;
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
    var subEl = document.getElementById('wave-subtext');
    if (subEl) subEl.textContent = 'Tap to reposition units, then continue';
    document.getElementById('wave-transition').className = 'wave-transition show';
    waveRepositionSelected = null;
    // Prompt 64: endless mode's floor-transition screen (showEndlessFloorTransition
    // in js/endless.js) reuses this same #wave-transition overlay but hides the
    // default button and injects its own Continue/Retreat controls -- restore
    // both to their normal state here so a regular mission's wave transition
    // is never left showing endless-mode leftovers.
    var defaultBtn = document.querySelector('#wave-transition .btn-primary');
    if (defaultBtn) defaultBtn.style.display = '';
    var endlessContainer = document.getElementById('endless-transition-controls');
    if (endlessContainer) endlessContainer.remove();
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
        // Prompt 64: Time Trial / Restricted Roster / Element Boss challenges
        // grant custom, non-star-scaled rewards (par-time bonus, restriction
        // VE multiplier, first-clear essence) that calculateMissionRewards()
        // doesn't model -- js/challenges.js's renderChallengeVictoryResults()
        // fully owns #results-rewards for these missions and returns early.
        if (activeMission.isChallengeTimeTrial || activeMission.isChallengeRestricted || activeMission.isChallengeElementBoss) {
            if (typeof renderChallengeVictoryResults === 'function') renderChallengeVictoryResults(sd, activeMission);
            document.getElementById('combat-results').className = 'combat-results show';
            renderTopBar();
            return;
        }
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
    // Prompt 64: defensively end any endless/survival run state so a stray
    // return-to-hub mid-run (rather than via Retreat/defeat) can't leave a
    // "phantom" active run behind.
    if (typeof endlessRunState !== 'undefined' && endlessRunState) endlessRunState.active = false;
    if (typeof survivalRunState !== 'undefined' && survivalRunState) survivalRunState.active = false;
    var endlessControls = document.getElementById('endless-transition-controls');
    if (endlessControls) endlessControls.remove();
    // Clean up any lingering overlays
    document.getElementById('combat-results').className = 'combat-results';
    document.getElementById('wave-transition').className = 'wave-transition';
    var grid = document.getElementById('wave-reposition-grid');
    if (grid) grid.remove();
    // Prompt 67: stop the render loop and let the active renderer tear down
    // everything it put on the battlefield (unit overlay layer, damage
    // numbers, enrage timer -- was inline DOM cleanup here before this
    // refactor; see RENDER_DOM.destroy() in js/render-dom.js).
    combatRenderLoopActive = false;
    var endingRenderer = (typeof getActiveRenderer === 'function') ? getActiveRenderer() : null;
    if (endingRenderer && typeof endingRenderer.destroy === 'function') endingRenderer.destroy();
    showScreen('hub');
}

// Prompt 67: renderCombatUnitCell / buildUnitCellHtml / renderCombatBoard all
// moved to js/render-dom.js -- board DOM, unit cells, hp/mana bars, status
// icons, boss telegraph visuals, encounter banner/HUD, enrage timer. This
// file (ui-combat.js) keeps only the chrome renderCombatBoard() calls into:
// renderCombatScoreboard() below (scoreboard sidebar).

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

// Prompt 67: initCombatUnitTooltips() (Prompt 20 Phase D2) moved to
// js/render-dom.js -- it reads/writes #combat-board .combat-cell elements
// directly, i.e. battlefield, not chrome. Pre-existing dead code either way
// (nothing in the codebase calls it); see the Prompt 67 report.

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


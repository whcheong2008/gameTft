// =============================================================================
// main.js — Game state, round flow, initialization
// =============================================================================

var gameState = {
    round: 1,
    phase: 'planning',
    hp: 100,
    gold: 10,
    level: 1,
    xp: 0,
    xpToLevel: 2,
    unitCap: 1,
    board: null,
    bench: null,
    shop: [],
    enemies: [],
    activeSynergies: {},
    activeElements: {},
    // Streak tracking
    winStreak: 0,
    lossStreak: 0,
    // Combat
    combatAnimFrame: null
};

function initGame() {
    initBoard(gameState);
    rollShop(gameState);
    generateEnemies();
    initUI();
    renderAll();
    addLogEntry('Welcome! Buy units, place them on your board, then start combat.', 'info');
}

function generateEnemies() {
    if (gameState.round <= 3) {
        gameState.enemies = generateCreepWave(gameState.round);
    } else {
        gameState.enemies = generateEnemyWave(gameState.round);
    }
    placeEnemies(gameState.enemies);
}

function startCombat() {
    if (countBoardUnits(gameState) === 0) {
        addLogEntry('Place at least one unit on the board!', 'info');
        return;
    }

    gameState.phase = 'combat';
    clearLog();
    addLogEntry('⚔️ Combat begins! Round ' + gameState.round, 'info');

    initCombat(gameState);
    renderAll();

    // Start combat loop
    var lastTime = performance.now();
    function combatLoop(now) {
        var dt = (now - lastTime) / 1000;
        lastTime = now;

        combatTick(dt);
        renderCombatFrame();

        if (combatState && combatState.running) {
            gameState.combatAnimFrame = requestAnimationFrame(combatLoop);
        } else {
            onCombatEnd();
        }
    }
    gameState.combatAnimFrame = requestAnimationFrame(combatLoop);
}

function onCombatEnd() {
    if (!combatState) return;
    var result = combatState.result;

    // Update streaks
    updateStreaks(gameState, result);

    if (result === 'win') {
        addLogEntry('🎉 Victory! Round ' + gameState.round + ' cleared!', 'kill');
        gameState.round++;
    } else if (result === 'loss') {
        var surviving = getSurvivingEnemyCount();
        var damage = 2 + surviving * 2;
        gameState.hp -= damage;
        addLogEntry('💀 Defeat! Lost ' + damage + ' HP (' + surviving + ' enemies survived)', 'damage');

        if (gameState.hp <= 0) {
            gameState.hp = 0;
            gameState.phase = 'gameover';
            addLogEntry('GAME OVER at Round ' + gameState.round, 'damage');
            renderAll();
            var overlay = document.getElementById('game-over-overlay');
            if (overlay) {
                document.getElementById('final-round').textContent = gameState.round;
                overlay.style.display = 'flex';
            }
            return;
        }
    } else {
        addLogEntry('🤝 Draw! No damage taken. Retrying round ' + gameState.round, 'info');
    }

    // Transition to planning phase
    startPlanningPhase();
}

function startPlanningPhase() {
    gameState.phase = 'planning';

    // Award XP
    addXP(gameState, 2);

    // Award income
    var income = calculateIncome(gameState);
    gameState.gold += income.total;

    // Show income breakdown
    showIncomeBreakdown(income);

    // Generate enemies for next round
    generateEnemies();

    // Roll new shop
    rollShop(gameState);

    // Restore board units to pre-combat state (hp/stats)
    restoreBoardUnits();

    // Recalculate synergies and check evolutions
    updateActiveSynergies(gameState);
    checkAllEvolutions(gameState);

    renderAll();
}

function restoreBoardUnits() {
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 7; c++) {
            var u = gameState.board[r][c];
            if (!u) continue;
            // Restore HP to max based on star level
            var tmpl = u.evolved ? EVOLVED_TEMPLATES[u.key] : UNIT_TEMPLATES[u.key];
            if (tmpl) {
                var mult = getStarMultiplier(u.stars);
                u.hp = Math.floor(tmpl.hp * mult);
                u.maxHp = Math.floor(tmpl.hp * mult);
                u.attack = Math.floor(tmpl.attack * mult);
                u.attackSpd = tmpl.attackSpd;
            }
        }
    }
}

function resetGame() {
    var overlay = document.getElementById('game-over-overlay');
    if (overlay) overlay.style.display = 'none';

    gameState.round = 1;
    gameState.phase = 'planning';
    gameState.hp = 100;
    gameState.gold = 10;
    gameState.level = 1;
    gameState.xp = 0;
    gameState.xpToLevel = 2;
    gameState.unitCap = 1;
    gameState.activeSynergies = {};
    gameState.activeElements = {};
    gameState.winStreak = 0;
    gameState.lossStreak = 0;

    initBoard(gameState);
    rollShop(gameState);
    generateEnemies();
    clearLog();
    addLogEntry('New game started! Good luck!', 'info');
    renderAll();
}

// Bridge: combat.js may reference addCombatLog
function addCombatLog(msg) {
    if (typeof addLogEntry === 'function') {
        addLogEntry(msg, 'combat');
    }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', initGame);

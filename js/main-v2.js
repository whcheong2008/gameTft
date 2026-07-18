// =============================================================================
// main-v2.js — V2 game entry point and state management
// =============================================================================

var saveData = null;

function getSaveData() {
    return saveData;
}

function initGameV2() {
    // Initialize gacha pool lookup
    initGachaPool();

    // Load or create save
    saveData = loadGame();
    if (!saveData) {
        saveData = createDefaultSaveData();
        saveGame(saveData);
    }

    // Show hub screen
    showScreen('hub');
}


// =============================================================================
// Prompt 20: Balance Pass & Testing Functions (Phase F)
// =============================================================================

// ---- Element Balance Test ----

function runElementBalanceTest() {
    console.log('=== Element Balance Test ===');

    var tests = 20;

    // Mono-fire vs mono-water: water should win ~60% of times
    var fireWins = 0;
    for (var i = 0; i < tests; i++) {
        var fireTeam = generateMonoElement('fire');
        var waterTeam = generateMonoElement('water');
        var result = simulateQuickBattle(fireTeam, waterTeam);
        if (result === 'team1') fireWins++;
    }
    console.log('Fire vs Water: Fire won ' + fireWins + '/' + tests + ' (~' + Math.round(fireWins / tests * 100) + '%)');
    console.log('Expected: ~40% (Water advantage)');

    // Force vs random: should be ~50%
    var forceWins = 0;
    var randomElements = ['fire', 'water', 'earth', 'wind', 'lightning'];
    for (var j = 0; j < tests; j++) {
        var forceTeam = generateMonoElement('force');
        var randomElem = randomElements[Math.floor(Math.random() * randomElements.length)];
        var randomTeam = generateMonoElement(randomElem);
        var result2 = simulateQuickBattle(forceTeam, randomTeam);
        if (result2 === 'team1') forceWins++;
    }
    console.log('Force vs Random: Force won ' + forceWins + '/' + tests + ' (~' + Math.round(forceWins / tests * 100) + '%)');
    console.log('Expected: ~50%');
}

function generateMonoElement(element) {
    var units = SHOP_POOL_KEYS.filter(function(k) {
        return UNIT_TEMPLATES[k] && UNIT_TEMPLATES[k].element === element;
    });
    if (units.length === 0) return [];

    var team = [];
    for (var i = 0; i < 5; i++) {
        var key = units[Math.floor(Math.random() * units.length)];
        team.push(createUnit(key, 1));
    }
    return team;
}

// Quick battle simulation (simplified, no rendering)
function simulateQuickBattle(team1, team2) {
    // Simple HP-vs-ATK comparison with element matchups
    var t1Score = 0;
    var t2Score = 0;

    for (var i = 0; i < team1.length; i++) {
        if (!team1[i]) continue;
        t1Score += team1[i].hp + (team1[i].attack * 10);
    }
    for (var j = 0; j < team2.length; j++) {
        if (!team2[j]) continue;
        t2Score += team2[j].hp + (team2[j].attack * 10);
    }

    // Apply element advantage
    if (team1.length > 0 && team2.length > 0) {
        var elem1 = team1[0].element;
        var elem2 = team2[0].element;
        if (ELEMENT_MATCHUPS && ELEMENT_MATCHUPS[elem1] && ELEMENT_MATCHUPS[elem1][elem2]) {
            var advantage = ELEMENT_MATCHUPS[elem1][elem2];
            if (advantage === 'strong') t1Score *= 1.3;
            else if (advantage === 'weak') t1Score *= 0.7;
        }
    }

    return t1Score >= t2Score ? 'team1' : 'team2';
}

// ---- Initialize ----
window.addEventListener('DOMContentLoaded', function() {
    initGameV2();

    // Close unit detail panel on Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            var overlay = document.getElementById('unit-detail-overlay');
            if (overlay && overlay.style.display === 'flex') {
                closeUnitDetail();
            }
        }
    });
});

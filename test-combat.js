// =============================================================================
// test-combat.js — Combat integration test for template-based abilities
// Runs real fights through the actual game engine to verify abilities work
// Usage: node test-combat.js
// =============================================================================

var fs = require('fs');

// Load game files in correct order (simulating browser script loading)
var files = [
    'js/units-core.js',
    'js/units-templates.js',
    'js/units-abilities.js',
    'js/main-v2.js'
];

// We need to provide browser globals that the game code expects
global.window = global;
global.window.addEventListener = function(){};
global.window.removeEventListener = function(){};
global.document = {
    getElementById: function() { return { textContent: '', style: {}, classList: { add: function(){}, remove: function(){} }, innerHTML: '', appendChild: function(){}, removeChild: function(){}, children: [], parentElement: null }; },
    createElement: function() { return { style: {}, classList: { add: function(){} }, appendChild: function(){}, textContent: '' }; },
    querySelectorAll: function() { return []; },
    querySelector: function() { return null; }
};
global.localStorage = { getItem: function(){ return null; }, setItem: function(){}, removeItem: function(){} };
global.requestAnimationFrame = function(){};
global.setTimeout = setTimeout;
global.setInterval = setInterval;
global.alert = function(){};
global.console = console;

// Suppress UI functions
global.showScreen = function(){};
global.renderCombat = function(){};
global.renderHub = function(){};
global.showToast = function(){};
global.flashAbilityCells = function(){};
global.spawnDamageNumber = function(){};
global.showCombatResult = function(){};
global.updateHUD = function(){};
global.renderRoster = function(){};
global.renderTeamBuilder = function(){};
global.playSound = function(){};
global.shakeScreen = function(){};
global.addLogEntry = function(){};
global.addCombatLog = function(){};

// Load each file
for (var i = 0; i < files.length; i++) {
    try {
        var code = fs.readFileSync(files[i], 'utf8');
        eval(code);
    } catch(e) {
        console.error('ERROR loading ' + files[i] + ':', e.message);
        process.exit(1);
    }
}

console.log('All game files loaded successfully.\n');

// =============================================================================
// COMBAT SIMULATION HARNESS
// =============================================================================

function createCombatUnit(templateKey, side, row, col, stars, level) {
    var tmpl = UNIT_TEMPLATES[templateKey] || EVOLVED_TEMPLATES[templateKey];
    if (!tmpl) { console.error('Unknown template:', templateKey); return null; }

    var starMult = Math.pow(1.8, (stars || 1) - 1);
    var levelBonus = 1 + (((level || 1) - 1) * 0.02);
    var hp = Math.floor(tmpl.hp * starMult * levelBonus);
    var atk = Math.floor(tmpl.attack * starMult * levelBonus);

    return {
        id: 'test_' + templateKey + '_' + Math.random().toString(36).substr(2,4),
        key: templateKey,
        templateKey: templateKey,
        abilityTemplate: tmpl.abilityTemplate || null,
        name: tmpl.name,
        cost: tmpl.cost || tmpl.baseCost || 1,
        type: tmpl.type,
        archetype: tmpl.archetype,
        secondaryArchetype: tmpl.secondaryArchetype || null,
        element: tmpl.element,
        hp: hp,
        maxHp: hp,
        attack: atk,
        attackSpd: tmpl.attackSpd,
        range: tmpl.range || 1,
        moveSpd: tmpl.moveSpd || 1.5,
        maxMana: tmpl.maxMana || 0,
        currentMana: 0,
        mana: 0,
        stars: stars || 1,
        level: level || 1,
        evolved: !!EVOLVED_TEMPLATES[templateKey],
        side: side,
        gridRow: row,
        gridCol: col,
        shield: 0,
        damageReduction: 0,
        dodgeChance: 0,
        critChance: 0.2,
        lifesteal: 0,
        statusEffects: [],
        abilityBuffs: {},
        abilities: [],
        items: [],
        isCasting: false,
        castTimer: 0,
        attackCooldown: 0,
        moveCooldown: 0,
        ccHistory: [],
        ccImmuneUntil: 0,
        tenacity: 0,
        target: null,
        alive: true,
        deathAnimating: false,
        deathComplete: false,
        passiveState: { customData: {} },
        combatStats: {
            damageDealt: 0,
            damageTaken: 0,
            healingDone: 0,
            shieldGiven: 0,
            kills: 0,
            abilityCasts: 0
        }
    };
}

function buildGrid(playerUnits, enemyUnits) {
    var grid = [];
    for (var r = 0; r < 9; r++) {
        grid[r] = [];
        for (var c = 0; c < 7; c++) {
            grid[r][c] = null;
        }
    }
    for (var p = 0; p < playerUnits.length; p++) {
        var pu = playerUnits[p];
        if (grid[pu.gridRow]) grid[pu.gridRow][pu.gridCol] = pu;
    }
    for (var e = 0; e < enemyUnits.length; e++) {
        var eu = enemyUnits[e];
        if (grid[eu.gridRow]) grid[eu.gridRow][eu.gridCol] = eu;
    }
    return grid;
}

function runCombat(playerKeys, enemyKeys, options) {
    options = options || {};
    var stars = options.stars || 1;
    var level = options.level || 5;
    var maxTime = options.maxTime || 30;

    // Create units with spread positioning
    var playerUnits = [];
    for (var pi = 0; pi < playerKeys.length; pi++) {
        var row = 4 + Math.floor(pi / 7);
        var col = pi % 7;
        var pu = createCombatUnit(playerKeys[pi], 'player', row, col, stars, level);
        if (pu) playerUnits.push(pu);
    }

    var enemyUnits = [];
    for (var ei = 0; ei < enemyKeys.length; ei++) {
        var erow = 3 - Math.floor(ei / 7);
        var ecol = ei % 7;
        var eu = createCombatUnit(enemyKeys[ei], 'enemy', erow, ecol, stars, level);
        if (eu) enemyUnits.push(eu);
    }

    // Initialize combatState (global, as the engine expects)
    combatState = {
        running: true,
        result: null,
        autoBattle: true, // suppress visual effects
        playerUnits: playerUnits,
        enemyUnits: enemyUnits,
        allUnits: playerUnits.concat(enemyUnits),
        activeSynergies: {},
        activeElements: {},
        elapsed: 0,
        grid: buildGrid(playerUnits, enemyUnits),
        assassinsDashed: false,
        worldTreeTriggered: false,
        auraTimer: 0,
        deathMarkers: {},
        bossUnit: null
    };

    // Initialize combat stats and template assignments
    for (var si = 0; si < combatState.allUnits.length; si++) {
        var su = combatState.allUnits[si];
        if (!su.combatStats) {
            su.combatStats = { damageDealt: 0, damageTaken: 0, healingDone: 0, shieldGiven: 0, kills: 0, abilityCasts: 0 };
        }
        // Assign ability template from unit definition
        var tmpl = UNIT_TEMPLATES[su.templateKey] || EVOLVED_TEMPLATES[su.templateKey];
        if (tmpl && tmpl.abilityTemplate) {
            su.abilityTemplate = tmpl.abilityTemplate;
        }
    }

    // Run combat loop
    var dt = 0.1; // 100ms ticks
    var errors = [];
    var ticks = 0;
    var maxTicks = maxTime / dt;

    while (combatState.running && ticks < maxTicks) {
        try {
            combatTick(dt);
        } catch(e) {
            errors.push({ tick: ticks, error: e.message, stack: e.stack ? e.stack.split('\n').slice(0,3).join(' | ') : '' });
            if (errors.length > 5) break; // stop if too many errors
        }
        ticks++;
    }

    // Collect results
    var result = {
        outcome: combatState.result || 'timeout',
        duration: Math.round(combatState.elapsed * 10) / 10,
        errors: errors,
        playerStats: [],
        enemyStats: []
    };

    for (var ps = 0; ps < playerUnits.length; ps++) {
        var p = playerUnits[ps];
        result.playerStats.push({
            name: p.name,
            template: p.abilityTemplate,
            element: p.element,
            alive: p.hp > 0,
            hp: Math.max(0, p.hp),
            maxHp: p.maxHp,
            dmgDealt: p.combatStats.damageDealt,
            dmgTaken: p.combatStats.damageTaken,
            healing: p.combatStats.healingDone,
            shields: p.combatStats.shieldGiven,
            kills: p.combatStats.kills,
            casts: p.combatStats.abilityCasts
        });
    }

    for (var es = 0; es < enemyUnits.length; es++) {
        var en = enemyUnits[es];
        result.enemyStats.push({
            name: en.name,
            template: en.abilityTemplate,
            alive: en.hp > 0,
            hp: Math.max(0, en.hp),
            dmgDealt: en.combatStats.damageDealt,
            casts: en.combatStats.abilityCasts
        });
    }

    return result;
}

// =============================================================================
// TEST SUITE
// =============================================================================

var totalTests = 0;
var passedTests = 0;
var failedTests = 0;
var warnings = [];

function assert(condition, testName, details) {
    totalTests++;
    if (condition) {
        passedTests++;
    } else {
        failedTests++;
        console.log('  FAIL: ' + testName + (details ? ' — ' + details : ''));
    }
}

// ---- TEST 1: Basic combat runs without errors ----
console.log('=== TEST 1: Combat Engine Stability ===');
console.log('Running 6 element mirror matches...\n');

var elements = {
    fire: ['flame_warrior', 'ember_scout', 'cinder_archer', 'fire_acolyte'],
    water: ['tide_hunter', 'frost_archer', 'reef_stalker', 'coral_priest'],
    earth: ['stone_guard', 'bramble_knight', 'seedling_archer', 'earth_shaman'],
    wind: ['zephyr_scout', 'wind_archer', 'gale_dancer', 'wind_squire'],
    lightning: ['spark_fencer', 'volt_runner', 'thunder_archer', 'pulse_mender'],
    force: ['iron_soldier', 'shadow_blade', 'steel_archer', 'war_cleric']
};

for (var elem in elements) {
    var team = elements[elem];
    var result = runCombat(team, team, { stars: 2, level: 8, maxTime: 30 });

    var hasErrors = result.errors.length > 0;
    assert(!hasErrors, elem + ' mirror match runs without errors',
        hasErrors ? result.errors.map(function(e){ return e.error; }).join('; ') : '');

    var fightHappened = result.playerStats.some(function(s){ return s.dmgDealt > 0; });
    assert(fightHappened, elem + ' units deal damage');

    var abilitiesFired = result.playerStats.some(function(s){ return s.casts > 0; });
    assert(abilitiesFired, elem + ' abilities were cast');

    console.log('  ' + elem + ': ' + result.outcome + ' in ' + result.duration + 's, ' +
        result.errors.length + ' errors, ' +
        result.playerStats.reduce(function(s,u){ return s + u.casts; }, 0) + ' total casts');
}

// ---- TEST 2: Every template fires and deals damage/heals ----
console.log('\n=== TEST 2: Template Ability Verification ===');
console.log('Testing each of the 19 active templates...\n');

var templateToUnit = {};
for (var uk in UNIT_TEMPLATES) {
    var ut = UNIT_TEMPLATES[uk];
    if (ut.abilityTemplate && !templateToUnit[ut.abilityTemplate]) {
        templateToUnit[ut.abilityTemplate] = uk;
    }
}

// Force units as generic enemies
var genericEnemies = ['iron_soldier', 'shield_bearer', 'steel_archer', 'war_cleric'];

for (var tmplName in templateToUnit) {
    var unitKey = templateToUnit[tmplName];
    var tmplDef = UNIT_TEMPLATES[unitKey];
    var team = [unitKey, 'iron_soldier', 'shield_bearer', 'flame_warrior', 'cinder_archer']; // unit under test + 4 supports
    var result = runCombat(team, genericEnemies, { stars: 2, level: 10, maxTime: 30 });

    var unitStat = result.playerStats[0];
    var hasErrors = result.errors.length > 0;

    assert(!hasErrors, tmplName + ' (' + unitKey + ') no errors',
        hasErrors ? result.errors[0].error : '');

    // Damage dealers should deal damage
    var isDamageRole = ['warrior','archer','mage','assassin'].indexOf(tmplDef.type) >= 0;
    if (isDamageRole) {
        assert(unitStat.dmgDealt > 0, tmplName + ' deals damage', 'dmg=' + unitStat.dmgDealt);
    }

    // Healers should heal or shield
    if (tmplDef.type === 'healer') {
        var healValue = unitStat.healing + unitStat.shields;
        assert(healValue > 0 || unitStat.dmgDealt > 0, tmplName + ' provides value (heal/shield/dmg)',
            'heal=' + unitStat.healing + ' shields=' + unitStat.shields + ' dmg=' + unitStat.dmgDealt);
    }

    // Tanks should survive and absorb
    if (tmplDef.type === 'tank') {
        assert(unitStat.dmgTaken > 0 || unitStat.shields > 0, tmplName + ' absorbs/shields',
            'taken=' + unitStat.dmgTaken + ' shields=' + unitStat.shields);
    }

    // All non-T5 units should cast abilities
    if (tmplDef.maxMana > 0) {
        assert(unitStat.casts > 0, tmplName + ' casts ability', 'casts=' + unitStat.casts);
    }

    console.log('  ' + tmplName.padEnd(22) + ' (' + unitKey.padEnd(18) + '): ' +
        'dmg=' + String(unitStat.dmgDealt).padStart(5) +
        ' heal=' + String(unitStat.healing).padStart(5) +
        ' shield=' + String(unitStat.shields).padStart(5) +
        ' casts=' + unitStat.casts +
        (hasErrors ? ' ERRORS!' : ' OK'));
}

// ---- TEST 3: Cross-element fight ----
console.log('\n=== TEST 3: Cross-Element Combat ===');
var mixedPlayer = ['flame_warrior', 'frost_archer', 'stone_guard', 'zephyr_scout', 'spark_fencer'];
var mixedEnemy = ['iron_soldier', 'hydro_mage', 'bramble_knight', 'wind_duelist', 'thunder_warden'];
var mixResult = runCombat(mixedPlayer, mixedEnemy, { stars: 2, level: 10, maxTime: 30 });

assert(mixResult.errors.length === 0, 'Cross-element fight no errors',
    mixResult.errors.length > 0 ? mixResult.errors[0].error : '');
assert(mixResult.outcome !== 'timeout', 'Cross-element fight resolves', 'outcome=' + mixResult.outcome);

console.log('  Outcome: ' + mixResult.outcome + ' in ' + mixResult.duration + 's');
console.log('  Player team:');
mixResult.playerStats.forEach(function(s) {
    console.log('    ' + s.name.padEnd(16) + ' [' + s.template.padEnd(20) + '] dmg=' +
        String(s.dmgDealt).padStart(5) + ' casts=' + s.casts + (s.alive ? ' ALIVE' : ' DEAD'));
});
console.log('  Enemy team:');
mixResult.enemyStats.forEach(function(s) {
    console.log('    ' + s.name.padEnd(16) + ' [' + s.template.padEnd(20) + '] dmg=' +
        String(s.dmgDealt).padStart(5) + ' casts=' + s.casts + (s.alive ? ' ALIVE' : ' DEAD'));
});

// ---- TEST 4: Higher tier teams ----
console.log('\n=== TEST 4: Tier Scaling Verification ===');
var t1Team = ['flame_warrior', 'tide_hunter', 'stone_guard', 'zephyr_scout', 'spark_fencer', 'iron_soldier'];
var t3Team = ['pyromancer', 'riptide_blade', 'golem', 'monsoon_caller', 'ball_lightning', 'gladiator'];

var t1vt3 = runCombat(t1Team, t3Team, { stars: 1, level: 1, maxTime: 30 });
assert(t1vt3.errors.length === 0, 'T1 vs T3 fight no errors');
console.log('  T1 vs T3: ' + t1vt3.outcome + ' in ' + t1vt3.duration + 's');
console.log('  T1 total dmg: ' + t1vt3.playerStats.reduce(function(s,u){ return s + u.dmgDealt; }, 0));
console.log('  T3 total dmg: ' + t1vt3.enemyStats.reduce(function(s,u){ return s + u.dmgDealt; }, 0));

// ---- TEST 5: All 66 units in combat ----
console.log('\n=== TEST 5: Full Roster Verification (all 66 units) ===');
var allErrors = [];
var unitCount = 0;
var unitsWithDamage = 0;
var unitsWithCasts = 0;

for (var allKey in UNIT_TEMPLATES) {
    unitCount++;
    var singleResult = runCombat([allKey], ['iron_soldier', 'shield_bearer'], { stars: 2, level: 10, maxTime: 15 });

    if (singleResult.errors.length > 0) {
        allErrors.push({ unit: allKey, template: UNIT_TEMPLATES[allKey].abilityTemplate, error: singleResult.errors[0].error });
    }

    var stat = singleResult.playerStats[0];
    if (stat.dmgDealt > 0 || stat.healing > 0 || stat.shields > 0) unitsWithDamage++;
    if (stat.casts > 0 || UNIT_TEMPLATES[allKey].maxMana === 0) unitsWithCasts++;
}

assert(allErrors.length === 0, 'All 66 units fight without errors',
    allErrors.length > 0 ? allErrors.map(function(e){ return e.unit + '(' + e.template + '): ' + e.error; }).join('; ') : '');
assert(unitsWithDamage === unitCount, 'All units contribute value', unitsWithDamage + '/' + unitCount);
assert(unitsWithCasts === unitCount, 'All units cast abilities', unitsWithCasts + '/' + unitCount);

console.log('  ' + unitCount + ' units tested: ' + allErrors.length + ' with errors');
console.log('  ' + unitsWithDamage + '/' + unitCount + ' dealt damage/healed/shielded');
console.log('  ' + unitsWithCasts + '/' + unitCount + ' cast abilities (or are T5 passive)');

if (allErrors.length > 0) {
    console.log('\n  Error details:');
    allErrors.forEach(function(e) {
        console.log('    ' + e.unit + ' [' + e.template + ']: ' + e.error);
    });
}

// ---- SUMMARY ----
console.log('\n' + '='.repeat(60));
console.log('RESULTS: ' + passedTests + ' passed, ' + failedTests + ' failed out of ' + totalTests + ' assertions');
if (failedTests === 0) {
    console.log('ALL TESTS PASSED — Template abilities work in combat engine!');
} else {
    console.log('SOME TESTS FAILED — See details above.');
}
console.log('='.repeat(60));

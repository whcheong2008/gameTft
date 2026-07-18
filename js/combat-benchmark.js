// =============================================================================
// combat-benchmark.js — Developer tool for benchmarking unit performance
// NOT loaded in game-v2.html — used only via benchmark.html
// =============================================================================

function createBenchmarkUnit(unitKey, options) {
    options = options || {};
    var level = options.level || 1;
    var stars = options.stars || 1;
    var ascension = options.ascension || null;

    var tmpl = UNIT_TEMPLATES[unitKey];
    if (!tmpl) {
        tmpl = EVOLVED_TEMPLATES[unitKey];
    }
    if (!tmpl) return null;

    var isEvolved = !!EVOLVED_TEMPLATES[unitKey] && !UNIT_TEMPLATES[unitKey];

    var unit = {
        id: 'bench_' + Math.random().toString(36).substr(2, 9),
        key: unitKey,
        name: tmpl.name,
        emoji: tmpl.emoji,
        cost: tmpl.cost || tmpl.baseCost || 1,
        type: tmpl.type,
        archetype: tmpl.archetype,
        element: tmpl.element,
        attackSpd: tmpl.attackSpd,
        range: tmpl.range,
        moveSpd: tmpl.moveSpd,
        maxMana: tmpl.maxMana,
        stars: stars,
        level: level,
        evolved: isEvolved,
        ascensionTier: ascension,
        items: []
    };

    var stats = getUnitStats(unit);
    unit.hp = stats.hp;
    unit.maxHp = stats.hp;
    unit.attack = stats.attack;
    unit.mana = 0;

    return unit;
}

function createDummyEnemy(options) {
    options = options || {};
    return {
        id: 'dummy',
        name: 'Training Dummy',
        hp: options.hp || 10000,
        maxHp: options.hp || 10000,
        attack: options.attack || 50,
        attackSpd: 1.0,
        defense: options.defense || 0,
        element: 'force',
        archetype: 'guardian',
        type: 'tank'
    };
}

function runBenchmark(unitKey, options) {
    options = options || {};
    var duration = options.duration || 30;
    var scenario = options.scenario || 'single_target';
    var level = options.level || 30;
    var stars = options.stars || 3;
    var ascension = options.ascension || null;

    var unit = createBenchmarkUnit(unitKey, { level: level, stars: stars, ascension: ascension });
    if (!unit) return null;

    var results = {
        unitKey: unitKey,
        unitName: unit.name,
        level: level,
        stars: stars,
        ascension: ascension,
        hp: unit.maxHp,
        attack: unit.attack,
        attackSpd: unit.attackSpd,
        powerRating: calculatePowerRating(unit),
        dps: 0,
        totalDamage: 0,
        aoeDamage: 0,
        survivalTime: duration,
        healingDone: 0
    };

    // Simple DPS calculation (attacks per second * damage)
    var attacksPerSecond = 1 / unit.attackSpd;
    var baseDPS = unit.attack * attacksPerSecond;
    results.dps = Math.floor(baseDPS);
    results.totalDamage = Math.floor(baseDPS * duration);

    // Ability DPS estimate
    if (unit.maxMana > 0) {
        var manaPerSecond = 10; // approximate mana gain rate
        var castsPerDuration = Math.floor((duration * manaPerSecond) / unit.maxMana);
        var abilityValue = getAbilityPowerValue(unit);
        results.totalDamage += Math.floor(abilityValue * castsPerDuration);
        results.dps = Math.floor(results.totalDamage / duration);
    } else {
        // Passive T5 — add passive power estimate
        var passiveDPS = unit.attack * 0.3; // rough passive estimate
        results.totalDamage += Math.floor(passiveDPS * duration);
        results.dps = Math.floor(results.totalDamage / duration);
    }

    // AoE scenario
    if (scenario === 'aoe_5') {
        var ability = ABILITY_DATA[unitKey];
        var isAoE = ability && (ability.desc.indexOf('area') !== -1 || ability.desc.indexOf('nearby') !== -1 || ability.desc.indexOf('all') !== -1 || ability.desc.indexOf('cone') !== -1);
        results.aoeDamage = isAoE ? Math.floor(results.totalDamage * 2.5) : results.totalDamage;
    }

    // Survivability estimate
    var incomingDPS = 100; // standard enemy DPS
    results.survivalTime = Math.min(duration, Math.floor(unit.maxHp / incomingDPS));

    // Healing estimate (for healers)
    if (unit.type === 'healer') {
        var healAbility = ABILITY_DATA[unitKey];
        if (healAbility) {
            var healMatch = healAbility.desc.match(/(\d+)%\s*ATK/);
            var healMult = healMatch ? parseInt(healMatch[1]) / 100 : 1.5;
            var healCasts = unit.maxMana > 0 ? Math.floor((duration * 10) / unit.maxMana) : Math.floor(duration / 8);
            results.healingDone = Math.floor(unit.attack * healMult * healCasts);
        }
    }

    return results;
}

function runArchetypeBenchmark(archetype) {
    var results = [];
    var keys = Object.keys(UNIT_TEMPLATES);
    for (var i = 0; i < keys.length; i++) {
        if (UNIT_TEMPLATES[keys[i]].archetype === archetype) {
            var r = runBenchmark(keys[i], { level: 30, stars: 3, scenario: 'single_target' });
            if (r) results.push(r);
        }
    }
    results.sort(function(a, b) { return b.dps - a.dps; });
    return results;
}

function runFullBenchmark() {
    var results = [];
    var keys = Object.keys(UNIT_TEMPLATES);
    for (var i = 0; i < keys.length; i++) {
        var singleResult = runBenchmark(keys[i], { level: 30, stars: 3, scenario: 'single_target' });
        var aoeResult = runBenchmark(keys[i], { level: 30, stars: 3, scenario: 'aoe_5' });
        if (singleResult && aoeResult) {
            var combatRating = Math.floor(
                (singleResult.dps * 0.4) +
                (aoeResult.dps * 0.3) +
                ((singleResult.survivalTime / 30 * 1000) * 0.3)
            );
            results.push({
                unitKey: keys[i],
                unitName: singleResult.unitName,
                tier: UNIT_TEMPLATES[keys[i]].cost,
                archetype: UNIT_TEMPLATES[keys[i]].archetype,
                element: UNIT_TEMPLATES[keys[i]].element,
                singleDPS: singleResult.dps,
                aoeDPS: aoeResult.dps,
                survivalTime: singleResult.survivalTime,
                powerRating: singleResult.powerRating,
                combatRating: combatRating,
                healingDone: singleResult.healingDone
            });
        }
    }
    results.sort(function(a, b) { return b.combatRating - a.combatRating; });
    return results;
}

// Prompt 67 (combat renderer abstraction) audit: renderBenchmarkTable() used
// to live here, but it was a DOM-table renderer (getElementById + innerHTML)
// for the standalone benchmark.html dev tool -- the source-scan acceptance
// test added by this refactor (tests/test-renderer-boundary.js) requires
// zero references to the global DOM object anywhere under js/combat-*.js,
// and this file matches that glob even though it isn't part of the game's
// combat engine (it isn't loaded by game-v2.html at all -- see the file
// header comment). Moved verbatim, unchanged, into benchmark.html's own
// inline <script> block so this file stays pure data/calculation, matching
// every other combat-*.js file.

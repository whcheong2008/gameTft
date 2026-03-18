// =============================================================================
// enemies.js — Enemy wave generation
// =============================================================================

function generateCreepWave(round) {
    var enemies = [];
    if (round === 1) {
        enemies.push(makeCreep('Slime', '\u{1F7E2}', 200, 15, 1.2));
    } else if (round === 2) {
        enemies.push(makeCreep('Slime', '\u{1F7E2}', 200, 15, 1.2));
        enemies.push(makeCreep('Slime', '\u{1F7E2}', 200, 15, 1.2));
    } else if (round === 3) {
        enemies.push(makeCreep('Wolf', '\u{1F43A}', 350, 30, 0.8));
        enemies.push(makeCreep('Slime', '\u{1F7E2}', 250, 20, 1.2));
        enemies.push(makeCreep('Slime', '\u{1F7E2}', 250, 20, 1.2));
    }
    return enemies;
}

function makeCreep(name, emoji, hp, attack, attackSpd) {
    return {
        id: Math.random().toString(36).substr(2, 9),
        key: name.toLowerCase(),
        name: name,
        emoji: emoji,
        cost: 0,
        type: 'warrior',
        archetype: null,
        element: null,
        hp: hp,
        maxHp: hp,
        attack: attack,
        attackSpd: attackSpd,
        range: 1,
        moveSpd: 2.0,
        stars: 1,
        evolved: false,
        evolvedForm: null,
        items: []
    };
}

function generateEnemyWave(round) {
    var goldBudget = Math.floor(3 + round * 1.5);
    var maxUnitCost = round < 6 ? 2 : round < 10 ? 3 : round < 15 ? 4 : 5;
    var maxUnits = 7;
    var enemies = [];
    var pool = SHOP_POOL_KEYS.filter(function(k) {
        return UNIT_TEMPLATES[k].cost <= maxUnitCost;
    });
    if (pool.length === 0) return enemies;

    while (goldBudget > 0 && enemies.length < maxUnits) {
        var affordable = pool.filter(function(k) {
            return UNIT_TEMPLATES[k].cost <= goldBudget;
        });
        if (affordable.length === 0) break;
        var pick = affordable[Math.floor(Math.random() * affordable.length)];
        var tmpl = UNIT_TEMPLATES[pick];
        var unit = createUnit(pick);
        unit.id = Math.random().toString(36).substr(2, 9);

        if (round >= 8 && Math.random() < 0.3) {
            unit.stars = 2;
            unit.hp = Math.floor(tmpl.hp * 1.8);
            unit.maxHp = Math.floor(tmpl.hp * 1.8);
            unit.attack = Math.floor(tmpl.attack * 1.8);
        }

        enemies.push(unit);
        goldBudget -= tmpl.cost;
    }
    return enemies;
}

function placeEnemies(enemies) {
    var positions = [];
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 7; c++) {
            positions.push({ row: r, col: c });
        }
    }
    // Shuffle
    for (var i = positions.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = positions[i];
        positions[i] = positions[j];
        positions[j] = tmp;
    }
    // Sort to prefer back rows (higher row = front for enemy, place front first)
    positions.sort(function(a, b) { return b.row - a.row; });

    for (var i = 0; i < enemies.length && i < positions.length; i++) {
        enemies[i].boardRow = positions[i].row;
        enemies[i].boardCol = positions[i].col;
    }
    return enemies;
}

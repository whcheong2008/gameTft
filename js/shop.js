// =============================================================================
// shop.js — Shop rolling, buy/sell, pool weights
// =============================================================================

var SHOP_WEIGHTS = {
    1: [100, 0, 0, 0, 0],
    2: [100, 0, 0, 0, 0],
    3: [75, 25, 0, 0, 0],
    4: [55, 30, 15, 0, 0],
    5: [45, 33, 20, 2, 0],
    6: [30, 35, 25, 10, 0],
    7: [20, 30, 30, 15, 5],
    8: [15, 20, 30, 25, 10]
};

function getShopWeights(level) {
    if (level >= 8) return SHOP_WEIGHTS[8];
    return SHOP_WEIGHTS[level] || SHOP_WEIGHTS[1];
}

function pickCostTier(level) {
    var weights = getShopWeights(level);
    var total = 0;
    for (var i = 0; i < weights.length; i++) total += weights[i];
    var roll = Math.random() * total;
    var cumulative = 0;
    for (var i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (roll < cumulative) return i + 1; // cost tiers are 1-5
    }
    return 1;
}

function weightedRandomIndex(weights) {
    var total = 0;
    for (var i = 0; i < weights.length; i++) total += weights[i];
    var roll = Math.random() * total;
    var cumulative = 0;
    for (var i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (roll < cumulative) return i;
    }
    return weights.length - 1;
}

function getAffinityWeight(templateKey, gs) {
    var weight = 1.0;
    var tmpl = UNIT_TEMPLATES[templateKey];
    if (!tmpl) return weight;

    // Archetype affinity: +0.15 if archetype has active synergy (>=2 on board)
    if (tmpl.archetype && gs.activeSynergies && gs.activeSynergies[tmpl.archetype] >= 2) {
        weight += 0.15;
    }

    // Element affinity: +0.10 if 2+ board units share this element
    if (tmpl.element && gs.activeElements && gs.activeElements[tmpl.element] >= 2) {
        weight += 0.10;
    }

    return weight;
}

function rollShopCard(gs) {
    // 1. Pick cost tier (existing logic — unchanged)
    var costTier = pickCostTier(gs.level);
    var candidates = SHOP_POOL_KEYS.filter(function(k) {
        return UNIT_TEMPLATES[k].cost === costTier;
    });
    if (candidates.length === 0) {
        // fallback to cost 1
        candidates = SHOP_POOL_KEYS.filter(function(k) {
            return UNIT_TEMPLATES[k].cost === 1;
        });
    }

    // 2. Apply affinity weights
    var affinityWeights = candidates.map(function(key) {
        return getAffinityWeight(key, gs);
    });

    // 3. Weighted random select
    var idx = weightedRandomIndex(affinityWeights);
    var hasAffinity = affinityWeights[idx] > 1.0;
    return { key: candidates[idx], sold: false, affinity: hasAffinity };
}

function rollShop(gs) {
    gs.shop = [];
    for (var i = 0; i < 5; i++) {
        gs.shop.push(rollShopCard(gs));
    }
}

function findMatchingUnits(gs, templateKey, starLevel) {
    var matches = [];
    // Check bench
    for (var i = 0; i < gs.bench.length; i++) {
        var u = gs.bench[i];
        if (u && u.key === templateKey && u.stars === starLevel && !u.evolved) {
            matches.push({ unit: u, location: { type: 'bench', index: i } });
        }
    }
    // Check board
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 7; c++) {
            var u = gs.board[r][c];
            if (u && u.key === templateKey && u.stars === starLevel && !u.evolved) {
                matches.push({ unit: u, location: { type: 'board', row: r, col: c } });
            }
        }
    }
    return matches;
}

function tryMerge(gs, templateKey, starLevel) {
    var matches = findMatchingUnits(gs, templateKey, starLevel);
    if (matches.length < 3) return false;

    // Keep first, remove next two
    var kept = matches[0];
    for (var i = 1; i <= 2; i++) {
        var loc = matches[i].location;
        if (loc.type === 'bench') {
            gs.bench[loc.index] = null;
        } else {
            gs.board[loc.row][loc.col] = null;
        }
    }

    upgradeUnit(kept.unit);
    checkEvolution(kept.unit, gs);

    // Try cascading merge at new star level
    tryMerge(gs, templateKey, kept.unit.stars);
    return true;
}

function buyUnit(gs, shopIndex) {
    if (shopIndex < 0 || shopIndex >= gs.shop.length) return false;
    var card = gs.shop[shopIndex];
    if (!card || card.sold) return false;

    var tmpl = UNIT_TEMPLATES[card.key];
    if (!tmpl) return false;
    if (gs.gold < tmpl.cost) return false;

    gs.gold -= tmpl.cost;
    card.sold = true;

    var unit = createUnit(card.key);

    // Add to bench first
    var benchIdx = addToBench(gs, unit);
    if (benchIdx === false) {
        // Bench full - refund
        gs.gold += tmpl.cost;
        card.sold = false;
        return false;
    }

    // Try merge
    tryMerge(gs, unit.key, unit.stars);

    // Check evolution for all units of this type
    checkAllEvolutions(gs);

    return true;
}

function checkAllEvolutions(gs) {
    for (var i = 0; i < gs.bench.length; i++) {
        if (gs.bench[i]) checkEvolution(gs.bench[i], gs);
    }
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 7; c++) {
            if (gs.board[r][c]) checkEvolution(gs.board[r][c], gs);
        }
    }
}

function sellUnit(gs, unit) {
    if (!unit) return false;
    var value = getSellValue(unit);
    // Remove from bench
    for (var i = 0; i < gs.bench.length; i++) {
        if (gs.bench[i] && gs.bench[i].id === unit.id) {
            gs.bench[i] = null;
            gs.gold += value;
            return true;
        }
    }
    // Remove from board
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 7; c++) {
            if (gs.board[r][c] && gs.board[r][c].id === unit.id) {
                gs.board[r][c] = null;
                gs.gold += value;
                return true;
            }
        }
    }
    return false;
}

function refreshShop(gs) {
    if (gs.gold < 2) return false;
    gs.gold -= 2;
    rollShop(gs);
    return true;
}

// =============================================================================
// gacha.js — Gold-based unit rolling system
// =============================================================================

var ROLL_COST = 5;       // Gold per single roll
var MULTI_ROLL_COUNT = 10;
var MULTI_ROLL_COST = 45; // Slight discount for 10x

// Gold cost to buy a unit from shop, by cost tier
var UNIT_COSTS = { 1: 3, 2: 6, 3: 12, 4: 24, 5: 50 };

// Cost to refresh the shop
var SHOP_REFRESH_COST = 2;

// Tier weight table: indexed by player level bracket
// Each row = [cost1%, cost2%, cost3%, cost4%, cost5%]
var TIER_WEIGHTS = {
    1:  [70, 25, 5,  0,  0],
    2:  [70, 25, 5,  0,  0],
    3:  [70, 25, 5,  0,  0],
    4:  [50, 30, 15, 5,  0],
    5:  [50, 30, 15, 5,  0],
    6:  [30, 30, 25, 12, 3],
    7:  [30, 30, 25, 12, 3],
    8:  [15, 25, 30, 20, 10],
    9:  [15, 25, 30, 20, 10],
    10: [10, 20, 25, 25, 20],
    11: [10, 20, 25, 25, 20],
    12: [10, 20, 25, 25, 20],
    13: [10, 20, 25, 25, 20],
    14: [10, 20, 25, 25, 20],
    15: [10, 20, 25, 25, 20],
    16: [10, 20, 25, 25, 20],
    17: [10, 20, 25, 25, 20],
    18: [5,  15, 25, 30, 25],
    19: [5,  15, 25, 30, 25],
    20: [5,  15, 25, 30, 25]
};

// Pity: guaranteed cost-5 unit every 50 rolls without one
var PITY_THRESHOLD = 50;

// Group units by cost tier for fast lookups
var UNITS_BY_COST = {};

function initGachaPool() {
    UNITS_BY_COST = {};
    for (var i = 0; i < SHOP_POOL_KEYS.length; i++) {
        var key = SHOP_POOL_KEYS[i];
        var tmpl = UNIT_TEMPLATES[key];
        if (!tmpl) continue;
        var cost = tmpl.cost;
        if (!UNITS_BY_COST[cost]) UNITS_BY_COST[cost] = [];
        UNITS_BY_COST[cost].push(key);
    }
}

// ---- Rolling Logic ----

function getTierWeights(playerLevel) {
    var lvl = Math.max(1, Math.min(20, playerLevel));
    return TIER_WEIGHTS[lvl] || TIER_WEIGHTS[1];
}

function rollTier(weights) {
    // weights = [cost1%, cost2%, cost3%, cost4%, cost5%]
    var roll = Math.random() * 100;
    var cumulative = 0;
    for (var i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (roll < cumulative) return i + 1; // cost tier (1-indexed)
    }
    return 1; // fallback
}

function rollOneUnit(playerLevel, minTier) {
    var weights = getTierWeights(playerLevel);
    var tier = rollTier(weights);

    // Pity override: enforce minimum tier
    if (minTier && tier < minTier) {
        tier = minTier;
    }

    // Pick random unit from that cost tier
    var pool = UNITS_BY_COST[tier];
    if (!pool || pool.length === 0) {
        // Fallback: if no units at this tier, roll from cost 1
        pool = UNITS_BY_COST[1];
    }

    var idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
}

// ---- Pity System ----

function getPityConfig(saveData) {
    // Building-based pity (bonus from summoning circle)
    var level = getBuildingLevel(saveData, 'summoning_circle');
    if (level >= 5) return { threshold: 30, minTier: 4 };
    if (level >= 4) return { threshold: 20, minTier: 3 };
    // Base pity: every 50 rolls guarantees a cost-5 unit
    return { threshold: PITY_THRESHOLD, minTier: 5 };
}

function checkPity(saveData) {
    var pity = getPityConfig(saveData);
    if (!pity) return 0;
    if (!saveData.stats.rollsSincePity) saveData.stats.rollsSincePity = 0;
    if (saveData.stats.rollsSincePity >= pity.threshold) {
        saveData.stats.rollsSincePity = 0;
        console.log('Pity triggered! Guaranteed cost ' + pity.minTier + '.');
        return pity.minTier;
    }
    return 0;
}

// Get a random cost-5 unit from the pool
function getRandomT5() {
    var t5Units = SHOP_POOL_KEYS.filter(function(k) { return UNIT_TEMPLATES[k] && UNIT_TEMPLATES[k].cost === 5; });
    if (t5Units.length === 0) return SHOP_POOL_KEYS[0]; // extreme fallback
    return t5Units[Math.floor(Math.random() * t5Units.length)];
}

// Tier-weighted roll with pity (prompt 20 style)
function rollUnit(playerLevel) {
    var level = Math.min(Math.max(1, playerLevel), 20);
    var weights = TIER_WEIGHTS[level];
    var roll = Math.random() * 100;
    var cumulative = 0;
    var tier = 1;
    for (var i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (roll < cumulative) { tier = i + 1; break; }
    }

    var candidates = SHOP_POOL_KEYS.filter(function(key) {
        return UNIT_TEMPLATES[key] && UNIT_TEMPLATES[key].cost === tier;
    });
    if (candidates.length === 0) {
        candidates = SHOP_POOL_KEYS.filter(function(k) { return UNIT_TEMPLATES[k] && UNIT_TEMPLATES[k].cost === 1; });
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
}

// ---- Shop System ----

var currentShopUnits = [];

function refreshShopUnits(playerLevel) {
    currentShopUnits = [];
    for (var i = 0; i < 5; i++) {
        currentShopUnits.push(rollUnit(playerLevel));
    }
    return currentShopUnits;
}

function buyUnit(saveData, unitKey, slotIndex) {
    var tmpl = UNIT_TEMPLATES[unitKey];
    if (!tmpl) return { success: false, reason: 'Unknown unit' };
    var goldCost = UNIT_COSTS[tmpl.cost] || 3;
    if (!spendGold(saveData, goldCost)) {
        return { success: false, reason: 'Not enough gold' };
    }
    addUnitToCollection(saveData, unitKey);
    saveData.stats.totalRolls++;
    // Remove from shop slot
    if (typeof slotIndex === 'number' && slotIndex >= 0 && slotIndex < currentShopUnits.length) {
        currentShopUnits[slotIndex] = null;
    }
    autoSave(saveData);
    return { success: true, unitKey: unitKey, goldCost: goldCost };
}

function refreshShop(saveData) {
    if (!spendGold(saveData, SHOP_REFRESH_COST)) {
        return { success: false, reason: 'Not enough gold' };
    }
    refreshShopUnits(saveData.player.level);
    autoSave(saveData);
    return { success: true };
}

// Perform a single roll: deduct gold, add unit to collection
function doSingleRoll(saveData) {
    if (!spendGold(saveData, ROLL_COST)) {
        return { success: false, reason: 'Not enough gold' };
    }

    if (!saveData.stats.rollsSincePity) saveData.stats.rollsSincePity = 0;
    saveData.stats.rollsSincePity++;

    var minTier = checkPity(saveData);
    var key = rollOneUnit(saveData.player.level, minTier);

    // Check if player owns the evolved form — 15% chance to get evolved copy instead
    var evo = EVOLUTIONS[key];
    if (evo && saveData.collection[evo.into]) {
        if (Math.random() < 0.15) {
            key = evo.into;
        }
    }

    addUnitToCollection(saveData, key);
    saveData.stats.totalRolls++;

    autoSave(saveData);

    return {
        success: true,
        unitKey: key,
        unitTemplate: UNIT_TEMPLATES[key] || EVOLVED_TEMPLATES[key],
        pityTriggered: minTier > 0
    };
}

// Perform a 10x multi-roll
function doMultiRoll(saveData) {
    var cost = getMultiRollCost(saveData);
    if (!spendGold(saveData, cost)) {
        return { success: false, reason: 'Not enough gold (need ' + cost + ')' };
    }

    if (!saveData.stats.rollsSincePity) saveData.stats.rollsSincePity = 0;

    var results = [];
    for (var i = 0; i < MULTI_ROLL_COUNT; i++) {
        saveData.stats.rollsSincePity++;
        var minTier = checkPity(saveData);
        var key = rollOneUnit(saveData.player.level, minTier);

        // Check if player owns the evolved form — 15% chance to get evolved copy instead
        var evo = EVOLUTIONS[key];
        if (evo && saveData.collection[evo.into]) {
            if (Math.random() < 0.15) {
                key = evo.into;
            }
        }

        addUnitToCollection(saveData, key);
        saveData.stats.totalRolls++;
        results.push({
            unitKey: key,
            unitTemplate: UNIT_TEMPLATES[key] || EVOLVED_TEMPLATES[key],
            pityTriggered: minTier > 0
        });
    }

    autoSave(saveData);

    return {
        success: true,
        results: results
    };
}

// ---- Display Helpers ----

function getRollCost() {
    return ROLL_COST;
}

function getMultiRollCost(saveData) {
    if (saveData) {
        return MULTI_ROLL_COST - getMultiRollDiscount(saveData);
    }
    return MULTI_ROLL_COST;
}

function formatTierWeights(playerLevel) {
    var weights = getTierWeights(playerLevel);
    var lines = [];
    for (var i = 0; i < weights.length; i++) {
        if (weights[i] > 0) {
            lines.push('Cost ' + (i + 1) + ': ' + weights[i] + '%');
        }
    }
    return lines.join(', ');
}

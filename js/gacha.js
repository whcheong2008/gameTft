// =============================================================================
// gacha.js — Veil Essence-based unit rolling system
// =============================================================================

var ROLL_COST = 50;        // VE per single rite
var MULTI_ROLL_COUNT = 10;
var MULTI_ROLL_COST = 450;  // VE for 10-rite (10% discount)

// VE cost to buy a unit from shop, by cost tier
var UNIT_COSTS = { 1: 30, 2: 60, 3: 120, 4: 240, 5: 500 };

// Cost to refresh the shop
var SHOP_REFRESH_COST = 20;

// Tier weight table: indexed by player level
// Each row = [T1%, T2%, T3%, T4%, T5%]
// T5 enters at L15 (2%), caps at 10% at L20
var TIER_WEIGHTS = {
    1:  [75, 25, 0,  0,  0],
    2:  [75, 25, 0,  0,  0],
    3:  [60, 35, 5,  0,  0],
    4:  [60, 35, 5,  0,  0],
    5:  [45, 38, 17, 0,  0],
    6:  [45, 38, 17, 0,  0],
    7:  [35, 33, 32, 0,  0],
    8:  [35, 33, 32, 0,  0],
    9:  [28, 28, 38, 6,  0],
    10: [28, 28, 38, 6,  0],
    11: [22, 25, 40, 13, 0],
    12: [22, 25, 40, 13, 0],
    13: [18, 22, 38, 22, 0],
    14: [18, 22, 38, 22, 0],
    15: [15, 18, 35, 30, 2],
    16: [15, 18, 35, 30, 2],
    17: [12, 15, 30, 37, 6],
    18: [12, 15, 30, 37, 6],
    19: [10, 12, 25, 43, 10],
    20: [8,  10, 22, 50, 10]
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
    // Building-based pity (bonus from Attunement Rite)
    var level = getBuildingLevel(saveData, 'attunement_rite');
    if (level >= 5) return { threshold: 30, minTier: 4 };
    if (level >= 4) return { threshold: 20, minTier: 3 };
    // Base pity: every 50 rites guarantees a T5 unit
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
    var veCost = UNIT_COSTS[tmpl.cost] || 30;
    if (!spendGold(saveData, veCost)) {
        return { success: false, reason: 'Not enough VE' };
    }
    addUnitToCollection(saveData, unitKey);
    saveData.stats.totalRolls++;
    // Remove from shop slot
    if (typeof slotIndex === 'number' && slotIndex >= 0 && slotIndex < currentShopUnits.length) {
        currentShopUnits[slotIndex] = null;
    }
    autoSave(saveData);
    return { success: true, unitKey: unitKey, veCost: veCost };
}

function refreshShop(saveData) {
    if (!spendGold(saveData, SHOP_REFRESH_COST)) {
        return { success: false, reason: 'Not enough VE' };
    }
    refreshShopUnits(saveData.player.level);
    autoSave(saveData);
    return { success: true };
}

// Perform a single rite: deduct VE, add unit to collection
function doSingleRoll(saveData) {
    if (!spendGold(saveData, ROLL_COST)) {
        return { success: false, reason: 'Not enough VE' };
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
        return { success: false, reason: 'Not enough VE (need ' + cost + ')' };
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

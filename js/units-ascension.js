// =============================================================================
// units-ascension.js — Ascension tiers, requirements, and functions
// =============================================================================

var ASCENSION_TIERS = {
    awakened: {
        name: 'Awakened',
        requirements: { level: 15, stars: 3, gold: 500, essences: 5, mythicMaterials: 0 },
        statBonus: 0.10,
        description: 'Gain secondary archetype'
    },
    exalted: {
        name: 'Exalted',
        requirements: { level: 25, ascensionTier: 'awakened', gold: 2000, essences: 10, mythicMaterials: 1 },
        statBonus: 0.20,
        description: 'Ability scaling upgrade'
    },
    transcendent: {
        name: 'Transcendent',
        requirements: { level: 30, ascensionTier: 'exalted', gold: 5000, essences: 20, mythicMaterials: 3 },
        statBonus: 0.35,
        description: 'Primary archetype counts as 2, new ability effect'
    }
};

// Returns cumulative ascension stat bonus
// null=0, awakened=0.10, exalted=0.30, transcendent=0.65
function getAscensionStatBonus(tier) {
    if (!tier) return 0;
    switch (tier) {
        case 'awakened': return 0.10;
        case 'exalted': return 0.30; // 0.10 + 0.20
        case 'transcendent': return 0.65; // 0.10 + 0.20 + 0.35
        default: return 0;
    }
}

// Check if a unit meets ascension requirements
// saveData: game save state
// unitKey: the unit's template key (base key)
// tier: 'awakened', 'exalted', or 'transcendent'
function checkAscensionRequirements(saveData, unitKey, tier) {
    var tierData = ASCENSION_TIERS[tier];
    if (!tierData) return { canAscend: false, reason: 'Invalid tier' };

    var entry = saveData.collection[unitKey];
    if (!entry) return { canAscend: false, reason: 'Unit not owned' };

    var results = [];
    var allMet = true;

    // Check level
    var unitLevel = entry.level || 1;
    var levelMet = unitLevel >= tierData.requirements.level;
    results.push({ type: 'level', met: levelMet, desc: 'Level ' + tierData.requirements.level + ' required (current: ' + unitLevel + ')' });
    if (!levelMet) allMet = false;

    // Check stars (only for awakened)
    if (tierData.requirements.stars) {
        var starsMet = entry.stars >= tierData.requirements.stars;
        results.push({ type: 'stars', met: starsMet, desc: tierData.requirements.stars + '\u2605 required (current: ' + entry.stars + '\u2605)' });
        if (!starsMet) allMet = false;
    }

    // Check previous ascension tier
    if (tierData.requirements.ascensionTier) {
        var currentAscension = entry.ascensionTier || null;
        var ascMet = currentAscension === tierData.requirements.ascensionTier;
        results.push({ type: 'ascension', met: ascMet, desc: ASCENSION_TIERS[tierData.requirements.ascensionTier].name + ' tier required' });
        if (!ascMet) allMet = false;
    }

    // Check VE
    var goldMet = saveData.player.veilEssence >= tierData.requirements.gold;
    results.push({ type: 'gold', met: goldMet, desc: tierData.requirements.gold + ' VE required (have: ' + saveData.player.veilEssence + ' VE)' });
    if (!goldMet) allMet = false;

    // Check essences (region essences — use the unit's element)
    var tmpl = UNIT_TEMPLATES[unitKey] || EVOLVED_TEMPLATES[unitKey];
    var unitElement = tmpl ? tmpl.element : 'fire';
    var essenceCount = (saveData.items && saveData.items.essences && saveData.items.essences[unitElement]) || 0;
    var essenceMet = essenceCount >= tierData.requirements.essences;
    results.push({ type: 'essences', met: essenceMet, desc: tierData.requirements.essences + ' ' + unitElement + ' essences required (have: ' + essenceCount + ')' });
    if (!essenceMet) allMet = false;

    // Check mythic materials
    if (tierData.requirements.mythicMaterials > 0) {
        var totalMythic = 0;
        if (saveData.items && saveData.items.mythicMaterials) {
            var matKeys = Object.keys(saveData.items.mythicMaterials);
            for (var m = 0; m < matKeys.length; m++) {
                totalMythic += saveData.items.mythicMaterials[matKeys[m]] || 0;
            }
        }
        var mythicMet = totalMythic >= tierData.requirements.mythicMaterials;
        results.push({ type: 'mythic', met: mythicMet, desc: tierData.requirements.mythicMaterials + ' mythic material(s) required (have: ' + totalMythic + ')' });
        if (!mythicMet) allMet = false;
    }

    return { canAscend: allMet, requirements: results, tier: tier };
}

// Perform ascension: consume materials, set tier, recalc stats
function ascendUnit(saveData, unitKey, tier) {
    var check = checkAscensionRequirements(saveData, unitKey, tier);
    if (!check.canAscend) return { success: false, reason: 'Requirements not met', details: check.requirements };

    var tierData = ASCENSION_TIERS[tier];
    var entry = saveData.collection[unitKey];
    var tmpl = UNIT_TEMPLATES[unitKey] || EVOLVED_TEMPLATES[unitKey];
    var unitElement = tmpl ? tmpl.element : 'fire';

    // Consume gold
    spendGold(saveData, tierData.requirements.gold);

    // Consume essences
    if (saveData.items && saveData.items.essences) {
        saveData.items.essences[unitElement] -= tierData.requirements.essences;
    }

    // Consume mythic materials (take from first available)
    if (tierData.requirements.mythicMaterials > 0 && saveData.items && saveData.items.mythicMaterials) {
        var remaining = tierData.requirements.mythicMaterials;
        var matKeys = Object.keys(saveData.items.mythicMaterials);
        for (var m = 0; m < matKeys.length && remaining > 0; m++) {
            var available = saveData.items.mythicMaterials[matKeys[m]] || 0;
            var take = Math.min(available, remaining);
            saveData.items.mythicMaterials[matKeys[m]] -= take;
            remaining -= take;
        }
    }

    // Set ascension tier
    entry.ascensionTier = tier;

    autoSave(saveData);
    return { success: true, tier: tier, name: tierData.name };
}

// Get the next ascension tier for a unit
function getNextAscensionTier(currentTier) {
    if (!currentTier) return 'awakened';
    if (currentTier === 'awakened') return 'exalted';
    if (currentTier === 'exalted') return 'transcendent';
    return null; // already max
}

// Get archetype contribution for synergy counting
// Returns { primary: count, secondary: archetype_or_null, secondaryCount: count }
function getUnitArchetypeContribution(unit) {
    var tmpl = unit.evolved ? (EVOLVED_TEMPLATES[unit.key] || null) : (UNIT_TEMPLATES[unit.key] || null);
    if (!tmpl) tmpl = UNIT_TEMPLATES[unit.key] || EVOLVED_TEMPLATES[unit.key];
    if (!tmpl) return { primary: unit.archetype, primaryCount: 1, secondary: null, secondaryCount: 0 };

    var primaryCount = 1;
    var secondaryArchetype = null;
    var secondaryCount = 0;
    var ascTier = unit.ascensionTier || null;

    // Transcendent: primary counts as 2
    if (ascTier === 'transcendent') {
        primaryCount = 2;
    }

    // Awakened+: gains secondary archetype (counts as 1)
    if (ascTier === 'awakened' || ascTier === 'exalted' || ascTier === 'transcendent') {
        secondaryArchetype = tmpl.secondaryArchetype || null;
        secondaryCount = secondaryArchetype ? 1 : 0;
    }

    return {
        primary: tmpl.archetype,
        primaryCount: primaryCount,
        secondary: secondaryArchetype,
        secondaryCount: secondaryCount
    };
}

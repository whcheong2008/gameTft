// =============================================================================
// hub.js — Hub/base screen, building definitions, screen navigation
// =============================================================================

// ---- Screen Management ----

var SCREENS = ['hub', 'gacha', 'roster', 'team-builder', 'mission-select', 'combat'];
var currentScreen = 'hub';

function showScreen(screenId) {
    for (var i = 0; i < SCREENS.length; i++) {
        var el = document.getElementById('screen-' + SCREENS[i]);
        if (el) {
            el.style.display = (SCREENS[i] === screenId) ? 'block' : 'none';
        }
    }
    currentScreen = screenId;
    renderCurrentScreen();
}

function renderCurrentScreen() {
    // Each screen has its own render function
    switch (currentScreen) {
        case 'hub': renderHubScreen(); break;
        case 'gacha': renderGachaScreen(); break;
        case 'roster': renderRosterScreen(); break;
        case 'team-builder': renderTeamBuilderScreen(); break;
        case 'mission-select': renderMissionSelectScreen(); break;
        case 'combat': /* combat rendering handled by combat loop */ break;
    }
    // Always update top bar
    renderTopBar();
}

// ---- Building Definitions ----

var BUILDINGS = {
    barracks: {
        name: 'Barracks',
        emoji: '🏰',
        description: 'Increases team size capacity',
        maxLevel: 5,
        upgradeCosts: [0, 100, 250, 500, 1000, 2000],
        effects: [
            'Team size: base only',
            'Team size: +1 slot',
            'Team size: +1 slot',
            'Team size: +1 slot',
            'Team size: +2 slots',
            'Team size: +2 slots'
        ]
    },
    summoning_circle: {
        name: 'Summoning Circle',
        emoji: '🔮',
        description: 'Improves gacha rolling',
        maxLevel: 5,
        upgradeCosts: [0, 80, 200, 400, 800, 1500],
        effects: [
            'Standard rates',
            'Multi-roll: 10x for 45g (10% discount)',
            'Multi-roll: 10x for 42g (16% discount)',
            'Multi-roll: 10x for 40g (20% discount)',
            'Pity system: guaranteed cost 3+ every 20 rolls',
            'Pity system: guaranteed cost 4+ every 30 rolls'
        ]
    },
    training_ground: {
        name: 'Training Ground',
        emoji: '⚔️',
        description: 'Earn bonus XP from missions',
        maxLevel: 5,
        upgradeCosts: [0, 60, 150, 350, 700, 1200],
        effects: [
            'Standard XP',
            '+10% mission XP',
            '+20% mission XP',
            '+30% mission XP',
            '+40% mission XP',
            '+50% mission XP'
        ]
    },
    warehouse: {
        name: 'Warehouse',
        emoji: '📦',
        description: 'Bonus gold from missions + more item storage',
        maxLevel: 5,
        upgradeCosts: [0, 50, 120, 300, 600, 1000],
        effects: [
            'Standard gold, 10 item slots',
            '+5% gold, 12 item slots',
            '+10% gold, 14 item slots',
            '+15% gold, 16 item slots',
            '+20% gold, 18 item slots',
            '+25% gold, 20 item slots'
        ]
    },
    war_room: {
        name: 'War Room',
        emoji: '🗺️',
        description: 'Reveals enemy info before missions',
        maxLevel: 3,
        upgradeCosts: [0, 200, 500, 1000],
        effects: [
            'No intel',
            'See enemy unit count',
            'See enemy unit types and elements',
            'See full enemy composition and stats'
        ]
    },
    evolution_lab: {
        name: 'Evolution Lab',
        emoji: '🧬',
        description: 'Evolve 3-star units into powerful new forms',
        maxLevel: 3,
        upgradeCosts: [0, 300, 800, 2000],
        effects: [
            'Locked — build to unlock evolution',
            'Can evolve units (gold cost: 50 × base unit cost)',
            'Evolution cost reduced by 25%',
            'Evolution cost reduced by 50%'
        ]
    },
    forge: {
        name: 'Forge',
        emoji: '🔨',
        description: 'Reforge, disassemble, and craft powerful items',
        maxLevel: 5,
        upgradeCosts: [0, 200, 500, 1000, 2000, 4000],
        effects: [
            'Locked — build to unlock the Forge',
            'Reroll Rarity: change a component\'s rarity tier',
            'Disassemble: break combined items back into components',
            'Transmute: convert one component type into another',
            'Set Crafting: forge set items using Essences',
            'Advanced Crafting: forge ability items and evolution-gated items'
        ]
    }
};

// ---- Building Logic ----

function getBuildingLevel(saveData, buildingId) {
    return saveData.buildings[buildingId] || 0;
}

function getBuildingUpgradeCost(buildingId, currentLevel) {
    var bld = BUILDINGS[buildingId];
    if (!bld) return Infinity;
    if (currentLevel >= bld.maxLevel) return Infinity; // Already max
    return bld.upgradeCosts[currentLevel + 1] || Infinity;
}

function canUpgradeBuilding(saveData, buildingId) {
    var level = getBuildingLevel(saveData, buildingId);
    var bld = BUILDINGS[buildingId];
    if (!bld || level >= bld.maxLevel) return false;
    var cost = getBuildingUpgradeCost(buildingId, level);
    return saveData.player.gold >= cost;
}

function upgradeBuilding(saveData, buildingId) {
    if (!canUpgradeBuilding(saveData, buildingId)) return false;

    var level = getBuildingLevel(saveData, buildingId);
    var cost = getBuildingUpgradeCost(buildingId, level);

    if (!spendGold(saveData, cost)) return false;

    saveData.buildings[buildingId] = level + 1;
    autoSave(saveData);
    return true;
}

function getBuildingEffect(buildingId, level) {
    var bld = BUILDINGS[buildingId];
    if (!bld) return '';
    return bld.effects[level] || bld.effects[0];
}

// ---- Building Bonus Getters ----

function getXPMultiplier(saveData) {
    var level = getBuildingLevel(saveData, 'training_ground');
    return 1.0 + (level * 0.10);
}

function getGoldMultiplier(saveData) {
    var level = getBuildingLevel(saveData, 'warehouse');
    return 1.0 + (level * 0.05);
}

function getMultiRollDiscount(saveData) {
    var level = getBuildingLevel(saveData, 'summoning_circle');
    if (level >= 3) return 10;  // 40g instead of 50g
    if (level >= 2) return 8;   // 42g
    if (level >= 1) return 5;   // 45g
    return 0;
}

function getItemBenchSize(saveData) {
    var warehouseLevel = getBuildingLevel(saveData, 'warehouse');
    return 10 + (warehouseLevel * 2); // 10 base + 2 per level, max 20 at level 5
}

function getWarRoomIntelLevel(saveData) {
    return getBuildingLevel(saveData, 'war_room');
}

function canEvolve(saveData) {
    return getBuildingLevel(saveData, 'evolution_lab') >= 1;
}

function getEvolutionGoldCost(saveData, templateKey) {
    var tmpl = UNIT_TEMPLATES[templateKey];
    if (!tmpl) return Infinity;
    var baseCost = 50 * tmpl.cost;
    var labLevel = getBuildingLevel(saveData, 'evolution_lab');
    if (labLevel >= 3) return Math.floor(baseCost * 0.5);
    if (labLevel >= 2) return Math.floor(baseCost * 0.75);
    return baseCost;
}

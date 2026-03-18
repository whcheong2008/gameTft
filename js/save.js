// =============================================================================
// save.js — LocalStorage persistence for V2 game state
// =============================================================================

var SAVE_KEY = 'autobattler_v2_save';
var SAVE_VERSION = 6;

// ---- Default State Factory ----

function createDefaultSaveData() {
    return {
        version: SAVE_VERSION,
        player: {
            level: 1,
            xp: 0,
            gold: 500,       // Starting gold — enough for several rolls + a building
            name: 'Player'
        },
        // Unit collection: { templateKey: { count: N, stars: S } }
        // count = total copies owned (including invested in stars)
        // stars = current star level (starts at 1 when first obtained)
        // copiesForNext = copies banked toward next star-up
        collection: {},
        // Saved teams: array of team configs
        // Each team: { name: 'Team 1', slots: [ { key: 'flame_warrior', row: 0, col: 2 }, ... ] }
        teams: [
            { name: 'Team 1', slots: [] }
        ],
        activeTeamIndex: 0,
        // Buildings: { buildingId: level }
        buildings: {
            barracks: 0,
            summoning_circle: 0,
            training_ground: 0,
            warehouse: 0,
            war_room: 0,
            evolution_lab: 0,
            forge: 0,
            gem_workshop: 0,
            mana_shrine: 0,
            bond_hall: 0
        },
        // Mission progress
        // storyProgress: index of highest completed story mission (0 = none)
        // grindMissions: { missionId: bestStars }
        missions: {
            storyProgress: 0,
            storyStars: {},    // { missionId: bestStarRating }
            grindBest: {},     // { missionId: bestStarRating }
            milestonesClaimed: [],  // Array of mission IDs that gave milestone rewards
            regionProgress: {
                1: { completed: [], bossCleared: false },
                2: { completed: [], bossCleared: false },
                3: { completed: [], bossCleared: false },
                4: { completed: [], bossCleared: false },
                5: { completed: [], bossCleared: false },
                6: { completed: [], bossCleared: false },
                7: { completed: [], bossCleared: false },
                8: { completed: [], bossCleared: false }
            },
            starRatings: {},
            regionRewardsClaimed: []
        },
        // Item inventory
        items: {
            bench: [],       // Array of item instances (max 10 slots)
            benchSize: 10,
            essences: { fire: 0, water: 0, earth: 0, wind: 0, lightning: 0, force: 0, arcane: 0 },
            mythicMaterials: { dragon_scale: 0, void_crystal: 0, world_shard: 0 },
            recipeBook: {},
            milestones: {}
        },
        // Daily quests (populated on first hub visit)
        dailyQuests: null,
        // Achievements
        achievements: { earned: [], claimed: [] },
        // Stats tracking
        stats: {
            totalMissionsCompleted: 0,
            totalGoldEarned: 0,
            totalGoldSpent: 0,
            totalRolls: 0,
            totalUnitsCollected: 0,
            rollsSincePity: 0,
            missionsCompleted: 0,
            bossesDefeated: 0,
            deathlessBossClears: 0,
            maxSingleHit: 0,
            fastestWin: 999999,
            maxElementSynergy: 0,
            forgeOperations: 0,
            enhancementsPerformed: 0,
            maxEnhanceLevel: 0,
            mythicsCrafted: 0,
            gemsSocketed: 0,
            uniqueBondsUsed: 0,
            totalGachaPulls: 0
        },
        // Timestamp
        lastSaved: null
    };
}

// ---- Save / Load ----

function saveGame(state) {
    try {
        state.lastSaved = new Date().toISOString();
        var json = JSON.stringify(state);
        localStorage.setItem(SAVE_KEY, json);
        return true;
    } catch (e) {
        console.error('Failed to save game:', e);
        return false;
    }
}

function loadGame() {
    try {
        var json = localStorage.getItem(SAVE_KEY);
        if (!json) return null;

        var data = JSON.parse(json);

        // Version migration
        if (!data.version || data.version < SAVE_VERSION) {
            data = migrateSave(data);
        }

        // Validate and fill missing fields with defaults
        data = validateSaveData(data);
        return data;
    } catch (e) {
        console.error('Failed to load game:', e);
        return null;
    }
}

function deleteSave() {
    localStorage.removeItem(SAVE_KEY);
}

function hasSaveData() {
    return localStorage.getItem(SAVE_KEY) !== null;
}

// ---- Migration ----

function migrateSave(data) {
    if (!data.version || data.version < 2) {
        if (!data.buildings) data.buildings = {};
        if (typeof data.buildings.evolution_lab === 'undefined') {
            data.buildings.evolution_lab = 0;
        }
        data.version = 2;
    }
    if (data.version < 3) {
        if (!data.buildings) data.buildings = {};
        if (typeof data.buildings.forge === 'undefined') {
            data.buildings.forge = 0;
        }
        // Add essences inventory if missing
        if (!data.items) data.items = { bench: [], benchSize: 10 };
        if (!data.items.essences) {
            data.items.essences = { fire: 0, water: 0, earth: 0, wind: 0 };
        }
        // Add milestonesClaimed if missing
        if (!data.missions) data.missions = {};
        if (!data.missions.milestonesClaimed) {
            data.missions.milestonesClaimed = [];
        }
        data.version = 3;
    }
    if (data.version < 4) {
        console.log('Migrating save from v3 to v4 (60-unit roster)');

        // Preserve player progress
        if (!data.player) data.player = { level: 1, xp: 0, gold: 500 };
        data.player.level = data.player.level || 1;
        data.player.gold = data.player.gold || 500;
        data.player.xp = data.player.xp || 0;

        // Add lightning/force essences if missing
        if (data.items && data.items.essences) {
            if (typeof data.items.essences.lightning === 'undefined') data.items.essences.lightning = 0;
            if (typeof data.items.essences.force === 'undefined') data.items.essences.force = 0;
        }

        // Validate collection entries against UNIT_TEMPLATES
        if (data.collection) {
            var collKeys = Object.keys(data.collection);
            for (var ci = 0; ci < collKeys.length; ci++) {
                var ck = collKeys[ci];
                if (!UNIT_TEMPLATES[ck] && !EVOLVED_TEMPLATES[ck]) {
                    console.log('Removing invalid collection entry:', ck);
                    delete data.collection[ck];
                }
            }
        }

        // Validate team slots
        if (data.teams && Array.isArray(data.teams)) {
            for (var ti = 0; ti < data.teams.length; ti++) {
                if (data.teams[ti] && data.teams[ti].slots) {
                    data.teams[ti].slots = data.teams[ti].slots.filter(function(slot) {
                        if (!slot) return false;
                        if (!UNIT_TEMPLATES[slot.key] && !EVOLVED_TEMPLATES[slot.key]) {
                            console.log('Removing invalid team slot:', slot.key);
                            return false;
                        }
                        return true;
                    });
                }
            }
        }

        // Add missing buildings
        if (!data.buildings) data.buildings = {};
        if (typeof data.buildings.barracks === 'undefined') data.buildings.barracks = 0;
        if (typeof data.buildings.evolution_lab === 'undefined') data.buildings.evolution_lab = 0;
        if (typeof data.buildings.forge === 'undefined') data.buildings.forge = 0;

        // Add missing stats
        if (!data.stats) data.stats = {};
        if (!data.missions) data.missions = {};
        if (!data.missions.milestonesClaimed) data.missions.milestonesClaimed = [];
        if (typeof data.stats.rollsSincePity !== 'number') data.stats.rollsSincePity = 0;
        if (typeof data.stats.totalGoldSpent !== 'number') data.stats.totalGoldSpent = 0;

        data.version = 4;
        console.log('Migration v3→v4 complete. Gold:', data.player.gold, 'Level:', data.player.level);
    }
    if (data.version < 5) {
        console.log('Migrating save from v4 to v5 (Phase 3 expanded items)');

        // Add arcane essence
        if (data.items && data.items.essences) {
            if (typeof data.items.essences.arcane === 'undefined') data.items.essences.arcane = 0;
        }

        // Add mythic materials storage
        if (data.items && !data.items.mythicMaterials) {
            data.items.mythicMaterials = { dragon_scale: 0, void_crystal: 0, world_shard: 0 };
        }

        // Add recipe book and milestones
        if (data.items && !data.items.recipeBook) data.items.recipeBook = {};
        if (data.items && !data.items.milestones) data.items.milestones = {};

        // Auto-populate recipe book from existing crafted items
        if (typeof autoPopulateRecipeBook === 'function') {
            autoPopulateRecipeBook(data);
        }

        data.version = 5;
        console.log('Migration v4→v5 complete.');
    }
    if (data.version < 6) {
        console.log('Migrating save from v5 to v6 (Region system)');

        // Initialize regionProgress from old storyProgress
        if (!data.missions.regionProgress) {
            data.missions.regionProgress = {};
            for (var r = 1; r <= 8; r++) {
                data.missions.regionProgress[r] = { completed: [], bossCleared: false };
            }
        }
        // Map old storyProgress (0-14) to new region progress (best effort)
        var oldProgress = data.missions.storyProgress || 0;
        // Region 1: old missions 0-3 (4 stages)
        if (oldProgress >= 1) data.missions.regionProgress[1].completed.push('r1_s1');
        if (oldProgress >= 2) data.missions.regionProgress[1].completed.push('r1_s2');
        if (oldProgress >= 3) data.missions.regionProgress[1].completed.push('r1_s3');
        if (oldProgress >= 4) { data.missions.regionProgress[1].completed.push('r1_s4'); data.missions.regionProgress[1].completed.push('r1_boss'); data.missions.regionProgress[1].bossCleared = true; }
        // Region 2: old missions 4-6
        if (oldProgress >= 5) data.missions.regionProgress[2].completed.push('r2_s1');
        if (oldProgress >= 6) data.missions.regionProgress[2].completed.push('r2_s2');
        if (oldProgress >= 7) { data.missions.regionProgress[2].completed.push('r2_s3'); data.missions.regionProgress[2].completed.push('r2_s4'); data.missions.regionProgress[2].completed.push('r2_s5'); data.missions.regionProgress[2].completed.push('r2_boss'); data.missions.regionProgress[2].bossCleared = true; }
        // Region 3-4: old missions 7-10
        if (oldProgress >= 8) { data.missions.regionProgress[3].completed.push('r3_s1'); data.missions.regionProgress[3].completed.push('r3_s2'); }
        if (oldProgress >= 9) { data.missions.regionProgress[3].completed.push('r3_s3'); data.missions.regionProgress[3].completed.push('r3_s4'); data.missions.regionProgress[3].completed.push('r3_boss'); data.missions.regionProgress[3].bossCleared = true; }
        if (oldProgress >= 10) data.missions.regionProgress[4].completed.push('r4_s1');
        if (oldProgress >= 11) { data.missions.regionProgress[4].completed.push('r4_s2'); data.missions.regionProgress[4].completed.push('r4_s3'); data.missions.regionProgress[4].completed.push('r4_s4'); data.missions.regionProgress[4].completed.push('r4_s5'); data.missions.regionProgress[4].completed.push('r4_boss'); data.missions.regionProgress[4].bossCleared = true; }
        // Region 5-8: old missions 11-14
        if (oldProgress >= 12) { data.missions.regionProgress[5].completed.push('r5_s1'); data.missions.regionProgress[5].completed.push('r5_s2'); data.missions.regionProgress[5].completed.push('r5_s3'); data.missions.regionProgress[5].completed.push('r5_s4'); data.missions.regionProgress[5].completed.push('r5_boss'); data.missions.regionProgress[5].bossCleared = true; }
        if (oldProgress >= 13) { data.missions.regionProgress[6].completed.push('r6_s1'); data.missions.regionProgress[6].completed.push('r6_s2'); data.missions.regionProgress[6].completed.push('r6_s3'); data.missions.regionProgress[6].completed.push('r6_s4'); data.missions.regionProgress[6].completed.push('r6_s5'); data.missions.regionProgress[6].completed.push('r6_s6'); data.missions.regionProgress[6].completed.push('r6_boss'); data.missions.regionProgress[6].bossCleared = true; }
        if (oldProgress >= 14) {
            for (var rs = 1; rs <= 5; rs++) data.missions.regionProgress[7].completed.push('r7_s' + rs);
            data.missions.regionProgress[7].completed.push('r7_boss');
            data.missions.regionProgress[7].bossCleared = true;
            for (var rs2 = 1; rs2 <= 6; rs2++) data.missions.regionProgress[8].completed.push('r8_s' + rs2);
            data.missions.regionProgress[8].completed.push('r8_boss');
            data.missions.regionProgress[8].bossCleared = true;
        }

        // Initialize starRatings
        if (!data.missions.starRatings) data.missions.starRatings = {};

        // Convert chapter rewards to region rewards
        if (data.missions.chapterRewardsClaimed) {
            if (!data.missions.regionRewardsClaimed) data.missions.regionRewardsClaimed = [];
            var chapterToRegion = { 1: 1, 2: 2, 3: 3, 4: 5 };
            for (var ci = 0; ci < data.missions.chapterRewardsClaimed.length; ci++) {
                var mappedRegion = chapterToRegion[data.missions.chapterRewardsClaimed[ci]];
                if (mappedRegion && data.missions.regionRewardsClaimed.indexOf(mappedRegion) < 0) {
                    data.missions.regionRewardsClaimed.push(mappedRegion);
                }
            }
        }
        if (!data.missions.regionRewardsClaimed) data.missions.regionRewardsClaimed = [];

        data.version = 6;
        console.log('Migration v5→v6 complete.');
    }

    // Phase 5 graceful migration: add new fields if missing (version-agnostic)
    if (!data.buildings) data.buildings = {};
    if (typeof data.buildings.gem_workshop === 'undefined') data.buildings.gem_workshop = 0;
    if (typeof data.buildings.mana_shrine === 'undefined') data.buildings.mana_shrine = 0;
    if (typeof data.buildings.bond_hall === 'undefined') data.buildings.bond_hall = 0;
    if (!data.achievements) data.achievements = { earned: [], claimed: [] };
    if (!data.stats) data.stats = {};
    if (typeof data.stats.missionsCompleted === 'undefined') data.stats.missionsCompleted = 0;
    if (typeof data.stats.bossesDefeated === 'undefined') data.stats.bossesDefeated = 0;
    if (typeof data.stats.deathlessBossClears === 'undefined') data.stats.deathlessBossClears = 0;
    if (typeof data.stats.maxSingleHit === 'undefined') data.stats.maxSingleHit = 0;
    if (typeof data.stats.fastestWin === 'undefined') data.stats.fastestWin = 999999;
    if (typeof data.stats.maxElementSynergy === 'undefined') data.stats.maxElementSynergy = 0;
    if (typeof data.stats.forgeOperations === 'undefined') data.stats.forgeOperations = 0;
    if (typeof data.stats.enhancementsPerformed === 'undefined') data.stats.enhancementsPerformed = 0;
    if (typeof data.stats.maxEnhanceLevel === 'undefined') data.stats.maxEnhanceLevel = 0;
    if (typeof data.stats.mythicsCrafted === 'undefined') data.stats.mythicsCrafted = 0;
    if (typeof data.stats.gemsSocketed === 'undefined') data.stats.gemsSocketed = 0;
    if (typeof data.stats.uniqueBondsUsed === 'undefined') data.stats.uniqueBondsUsed = 0;
    if (typeof data.stats.totalGachaPulls === 'undefined') data.stats.totalGachaPulls = 0;
    if (!data.dailyQuests) data.dailyQuests = null;
    return data;
}

// ---- Validation ----
// Ensures all expected fields exist, filling gaps with defaults

function validateSaveData(data) {
    console.log('Validating save data...');
    var defaults = createDefaultSaveData();

    if (!data.player) data.player = defaults.player;
    if (typeof data.player.level !== 'number') data.player.level = 1;
    data.player.level = Math.max(1, Math.min(20, data.player.level));
    if (typeof data.player.xp !== 'number') data.player.xp = 0;
    data.player.xp = Math.max(0, data.player.xp);
    if (typeof data.player.gold !== 'number') data.player.gold = 500;
    data.player.gold = Math.max(0, data.player.gold);

    if (!data.collection) data.collection = {};

    // Validate collection entries against UNIT_TEMPLATES
    var collKeys = Object.keys(data.collection);
    for (var ci = 0; ci < collKeys.length; ci++) {
        var ck = collKeys[ci];
        if (!UNIT_TEMPLATES[ck] && !EVOLVED_TEMPLATES[ck]) {
            console.log('Removing invalid collection entry:', ck);
            delete data.collection[ck];
        }
    }

    if (!data.teams || !Array.isArray(data.teams)) data.teams = defaults.teams;

    // Validate team slots
    for (var ti = 0; ti < data.teams.length; ti++) {
        if (data.teams[ti] && data.teams[ti].slots) {
            data.teams[ti].slots = data.teams[ti].slots.filter(function(slot) {
                if (!slot) return false;
                if (!UNIT_TEMPLATES[slot.key] && !EVOLVED_TEMPLATES[slot.key]) {
                    console.log('Removing invalid team slot:', slot.key);
                    return false;
                }
                return true;
            });
        }
    }

    if (typeof data.activeTeamIndex !== 'number') data.activeTeamIndex = 0;
    if (!data.buildings) data.buildings = defaults.buildings;
    if (typeof data.buildings.evolution_lab === 'undefined') data.buildings.evolution_lab = 0;
    if (typeof data.buildings.forge === 'undefined') data.buildings.forge = 0;
    if (typeof data.buildings.gem_workshop === 'undefined') data.buildings.gem_workshop = 0;
    if (typeof data.buildings.mana_shrine === 'undefined') data.buildings.mana_shrine = 0;
    if (typeof data.buildings.bond_hall === 'undefined') data.buildings.bond_hall = 0;
    if (!data.missions) data.missions = defaults.missions;
    if (!data.missions.storyStars) data.missions.storyStars = {};
    if (!data.missions.grindBest) data.missions.grindBest = {};
    if (!data.missions.milestonesClaimed) data.missions.milestonesClaimed = [];
    if (!data.missions.regionProgress) {
        data.missions.regionProgress = {};
        for (var rr = 1; rr <= 8; rr++) {
            data.missions.regionProgress[rr] = { completed: [], bossCleared: false };
        }
    }
    if (!data.missions.starRatings) data.missions.starRatings = {};
    if (!data.missions.regionRewardsClaimed) data.missions.regionRewardsClaimed = [];
    if (!data.stats) data.stats = defaults.stats;
    if (typeof data.stats.rollsSincePity !== 'number') data.stats.rollsSincePity = 0;
    if (typeof data.stats.totalGoldSpent !== 'number') data.stats.totalGoldSpent = 0;
    if (!data.achievements) data.achievements = { earned: [], claimed: [] };
    if (!Array.isArray(data.achievements.earned)) data.achievements.earned = [];
    if (!Array.isArray(data.achievements.claimed)) data.achievements.claimed = [];

    // Items migration: add items if missing (old saves)
    if (!data.items) data.items = { bench: [], benchSize: 10, essences: { fire: 0, water: 0, earth: 0, wind: 0, lightning: 0, force: 0 } };
    if (!Array.isArray(data.items.bench)) data.items.bench = [];
    if (typeof data.items.benchSize !== 'number') data.items.benchSize = 10;
    if (!data.items.essences) data.items.essences = { fire: 0, water: 0, earth: 0, wind: 0, lightning: 0, force: 0 };
    if (typeof data.items.essences.lightning === 'undefined') data.items.essences.lightning = 0;
    if (typeof data.items.essences.force === 'undefined') data.items.essences.force = 0;

    console.log('Validation complete. Valid entries:', Object.keys(data.collection).length);
    return data;
}

// Copies per star level constant
var COPIES_PER_STAR = 10;

// Sell value: 3x unit cost
function getSellValue(templateKey, starLevel) {
    var tmpl = UNIT_TEMPLATES[templateKey] || EVOLVED_TEMPLATES[templateKey];
    if (!tmpl) return 0;
    var baseCost = UNIT_COSTS ? UNIT_COSTS[tmpl.cost || tmpl.baseCost || 1] : (tmpl.cost || 1) * 3;
    return baseCost * 3;
}

// ---- Collection Helpers ----

function addUnitToCollection(saveData, templateKey) {
    if (!saveData.collection[templateKey]) {
        saveData.collection[templateKey] = {
            stars: 1,
            copiesForNext: 0
        };
        saveData.stats.totalUnitsCollected++;
    } else {
        saveData.collection[templateKey].copiesForNext++;
    }
}

function getStarUpCost() {
    // 10 copies required per star level
    return 10;
}

function canStarUp(saveData, templateKey) {
    var entry = saveData.collection[templateKey];
    if (!entry) return false;
    return entry.copiesForNext >= getStarUpCost();
}

function starUpUnit(saveData, templateKey) {
    if (!canStarUp(saveData, templateKey)) return false;

    var entry = saveData.collection[templateKey];
    entry.copiesForNext -= getStarUpCost();
    entry.stars++;
    return true;
}

// ---- Sell Helpers ----

function getSellGoldValue(templateKey, copiesCount) {
    var tmpl = UNIT_TEMPLATES[templateKey] || EVOLVED_TEMPLATES[templateKey];
    if (!tmpl) return 0;
    var unitCost = tmpl.cost || tmpl.baseCost || 1;
    return copiesCount * unitCost * 3;
}

function sellUnitCopies(saveData, templateKey, count) {
    var entry = saveData.collection[templateKey];
    if (!entry) return false;
    if (count > entry.copiesForNext) return false;
    if (count <= 0) return false;

    var goldEarned = getSellGoldValue(templateKey, count);
    entry.copiesForNext -= count;
    earnGold(saveData, goldEarned);
    autoSave(saveData);
    return goldEarned;
}

function getCollectionCount(saveData) {
    return Object.keys(saveData.collection).length;
}

function getUnitEntry(saveData, templateKey) {
    return saveData.collection[templateKey] || null;
}

// ---- Team Helpers ----

function getActiveTeam(saveData) {
    return saveData.teams[saveData.activeTeamIndex] || saveData.teams[0];
}

function getMaxTeamSize(saveData) {
    var level = saveData.player.level;

    // Base slots: 2 + 1 per 2 levels until level 10 (cap 7)
    var baseSlots = Math.min(7, 2 + Math.floor(level / 2));

    // Barracks bonus: only available at level 10+
    var barracksBonus = 0;
    if (level >= 10) {
        var barracksLevel = saveData.buildings && saveData.buildings.barracks ? saveData.buildings.barracks : 0;
        barracksBonus = Math.min(2, Math.floor(barracksLevel / 2));
    }

    return Math.min(9, baseSlots + barracksBonus);
}

function saveTeam(saveData, teamIndex, slots) {
    if (!saveData.teams[teamIndex]) return false;
    saveData.teams[teamIndex].slots = slots;
    return true;
}

// ---- Player Level Helpers ----

var PLAYER_XP_TABLE = [
    0,      // Level 1 (no XP needed)
    100,    // Level 2
    250,    // Level 3
    500,    // Level 4
    800,    // Level 5
    1200,   // Level 6
    1700,   // Level 7
    2300,   // Level 8
    3000,   // Level 9
    3800,   // Level 10
    4800,   // Level 11
    6000,   // Level 12
    7400,   // Level 13
    9000,   // Level 14
    10800,  // Level 15
    12800,  // Level 16
    15000,  // Level 17
    17500,  // Level 18
    20300,  // Level 19
    23500   // Level 20
];

function getXPForLevel(level) {
    if (level < 1) return 0;
    if (level > 20) return Infinity;
    return PLAYER_XP_TABLE[level - 1] || Infinity;
}

function getXPToNextLevel(saveData) {
    if (saveData.player.level >= 20) return Infinity;
    return getXPForLevel(saveData.player.level + 1) - saveData.player.xp;
}

function addPlayerXP(saveData, amount) {
    saveData.player.xp += amount;
    var leveled = false;
    while (saveData.player.level < 20 && saveData.player.xp >= getXPForLevel(saveData.player.level + 1)) {
        saveData.player.level++;
        leveled = true;
    }
    return leveled;
}

// ---- Gold Helpers ----

function spendGold(saveData, amount) {
    if (saveData.player.gold < amount) return false;
    saveData.player.gold -= amount;
    return true;
}

function earnGold(saveData, amount) {
    saveData.player.gold += amount;
    saveData.stats.totalGoldEarned += amount;
}

// ---- Auto-save (call after any mutation) ----

function autoSave(saveData) {
    return saveGame(saveData);
}

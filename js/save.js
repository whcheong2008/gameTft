// =============================================================================
// save.js — LocalStorage persistence for V2 game state
// =============================================================================

var SAVE_KEY = 'autobattler_v2_save';
var SAVE_VERSION = 12;

// ---- Default State Factory ----

function createDefaultSaveData() {
    return {
        version: SAVE_VERSION,
        player: {
            level: 1,
            xp: 0,
            veilEssence: 500,  // Starting VE — enough for several rolls + a building
            name: 'Player'
        },
        // Unit collection: { templateKey: { count: N, stars: S } }
        // count = total copies owned (including invested in stars)
        // stars = current star level (starts at 1 when first obtained)
        // copiesForNext = copies banked toward next star-up
        collection: {
            // Starter set: 10 curated T1 units for a functional starting team
            flame_warrior:  { stars: 1, copiesForNext: 0 },
            stone_guard:    { stars: 1, copiesForNext: 0 },
            frost_archer:   { stars: 1, copiesForNext: 0 },
            wind_squire:    { stars: 1, copiesForNext: 0 },
            pulse_mender:   { stars: 1, copiesForNext: 0 },
            fire_acolyte:   { stars: 1, copiesForNext: 0 },
            bramble_knight: { stars: 1, copiesForNext: 0 },
            tide_hunter:    { stars: 1, copiesForNext: 0 },
            spark_fencer:   { stars: 1, copiesForNext: 0 },
            shadow_blade:   { stars: 1, copiesForNext: 0 }
        },
        // Saved teams: array of team configs
        // Each team: { name: 'Team 1', slots: [ { key: 'flame_warrior', row: 0, col: 2 }, ... ] }
        teams: [
            { name: 'Team 1', slots: [] }
        ],
        activeTeamIndex: 0,
        // Buildings: { buildingId: level }
        buildings: {
            sustained_bonds: 0,
            attunement_rite: 0,
            essence_reservoir: 0,
            deep_resonance: 0,
            echo_shaping: 0,
            prism_focus: 0,
            veil_wellspring: 0,
            kindred_circle: 0
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
            regionRewardsClaimed: [],
            stageProgress: {}
        },
        // Equipment inventory (new system replaces old items)
        equipment: {
            inventory: [],
            gems: [],
            materials: { commonScraps: 0, uncommonScraps: 0, rareScraps: 0, epicScraps: 0, oreShards: 0, refinedOre: 0, elementalDust: 0, prismaticShards: 0 },
            mythicMaterials: { dragon_scale: 0, void_crystal: 0, world_shard: 0 },
            essences: { fire: 0, water: 0, earth: 0, wind: 0, lightning: 0, force: 0, arcane: 0 },
            codex: { discovered: {} },
            slotFocus: { slot: null, remaining: 0 }
        },
        // Legacy items field kept for migration
        items: null,
        // Heroes (philosophy-based system)
        heroes: {
            data: {
                kael:  { level: 1, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false },
                lyric: { level: 1, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false },
                ren:   { level: 1, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false, _unlocked: false },
                sera:  { level: 1, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false, _unlocked: false },
                maren: { level: 1, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false, _unlocked: false },
                voss:  { level: 1, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false, _unlocked: false }
            }
        },
        // Achievements
        achievements: { earned: [], claimed: [] },
        // Stats tracking
        stats: {
            totalMissionsCompleted: 0,
            totalVeilEssenceEarned: 0,
            totalVeilEssenceSpent: 0,
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

    if (data.version < 7) {
        console.log('Migrating save from v6 to v7 (Unit progression)');

        // Add level, xp, ascensionTier to all units in collection
        if (data.collection) {
            var collKeys = Object.keys(data.collection);
            for (var ci = 0; ci < collKeys.length; ci++) {
                var entry = data.collection[collKeys[ci]];
                if (typeof entry.level === 'undefined') entry.level = 1;
                if (typeof entry.xp === 'undefined') entry.xp = 0;
                if (typeof entry.ascensionTier === 'undefined') entry.ascensionTier = null;
            }
        }

        // Add level, xp, ascensionTier to all units in team slots
        if (data.teams && Array.isArray(data.teams)) {
            for (var ti = 0; ti < data.teams.length; ti++) {
                if (data.teams[ti] && data.teams[ti].slots) {
                    for (var si = 0; si < data.teams[ti].slots.length; si++) {
                        var slot = data.teams[ti].slots[si];
                        if (slot) {
                            if (typeof slot.level === 'undefined') slot.level = 1;
                            if (typeof slot.xp === 'undefined') slot.xp = 0;
                            if (typeof slot.ascensionTier === 'undefined') slot.ascensionTier = null;
                        }
                    }
                }
            }
        }

        data.version = 7;
        console.log('Migration v6\u2192v7 complete.');
    }

    if (data.version < 8) {
        console.log('Migrating save from v7 to v8 (Hero system)');

        if (!data.heroes) {
            data.heroes = {
                unlocked: ['hero_a', 'hero_b'],
                data: {
                    hero_a: { key: 'hero_a', level: 1, xp: 0, skillPoints: 0, allocations: {}, assignedUnit: null, respecCount: 0 },
                    hero_b: { key: 'hero_b', level: 1, xp: 0, skillPoints: 0, allocations: {}, assignedUnit: null, respecCount: 0 }
                },
                bDeathSnapshot: null,
                bFragment: null
            };
        }

        // Unlock heroes based on existing region progress
        if (data.missions && data.missions.regionProgress) {
            var rp = data.missions.regionProgress;
            if (rp[1] && rp[1].bossCleared && data.heroes.unlocked.indexOf('hero_kael') < 0) {
                data.heroes.unlocked.push('hero_kael');
                data.heroes.data.hero_kael = { key: 'hero_kael', level: 1, xp: 0, skillPoints: 0, allocations: {}, assignedUnit: null, respecCount: 0 };
            }
            if (rp[2] && rp[2].bossCleared && data.heroes.unlocked.indexOf('hero_lyra') < 0) {
                data.heroes.unlocked.push('hero_lyra');
                data.heroes.data.hero_lyra = { key: 'hero_lyra', level: 1, xp: 0, skillPoints: 0, allocations: {}, assignedUnit: null, respecCount: 0 };
            }
            if (rp[3] && rp[3].bossCleared && data.heroes.unlocked.indexOf('hero_maren') < 0) {
                data.heroes.unlocked.push('hero_maren');
                data.heroes.data.hero_maren = { key: 'hero_maren', level: 1, xp: 0, skillPoints: 0, allocations: {}, assignedUnit: null, respecCount: 0 };
            }
            if (rp[4] && rp[4].completed && rp[4].completed.indexOf('r4_s3') >= 0 && data.heroes.unlocked.indexOf('hero_dax') < 0) {
                data.heroes.unlocked.push('hero_dax');
                data.heroes.data.hero_dax = { key: 'hero_dax', level: 1, xp: 0, skillPoints: 0, allocations: {}, assignedUnit: null, respecCount: 0 };
            }
            // If R4 boss cleared, B dies and Lyra/Maren leave
            if (rp[4] && rp[4].bossCleared) {
                var bIdx = data.heroes.unlocked.indexOf('hero_b');
                if (bIdx >= 0) {
                    data.heroes.bDeathSnapshot = { level: data.heroes.data.hero_b.level, xp: 0, skillPoints: 0, allocations: {}, respecCount: 0 };
                    data.heroes.unlocked.splice(bIdx, 1);
                }
                // Only remove Lyra/Maren if R5 hasn't returned them
                if (!(rp[5] && rp[5].completed && rp[5].completed.indexOf('r5_s2') >= 0)) {
                    var lyraIdx = data.heroes.unlocked.indexOf('hero_lyra');
                    if (lyraIdx >= 0) data.heroes.unlocked.splice(lyraIdx, 1);
                }
                if (!(rp[5] && rp[5].completed && rp[5].completed.indexOf('r5_s4') >= 0)) {
                    var marenIdx = data.heroes.unlocked.indexOf('hero_maren');
                    if (marenIdx >= 0) data.heroes.unlocked.splice(marenIdx, 1);
                }
            }
            if (rp[5] && rp[5].bossCleared && data.heroes.unlocked.indexOf('hero_sera') < 0) {
                data.heroes.unlocked.push('hero_sera');
                data.heroes.data.hero_sera = { key: 'hero_sera', level: 1, xp: 0, skillPoints: 0, allocations: {}, assignedUnit: null, respecCount: 0 };
            }
            if (rp[6] && rp[6].bossCleared && data.heroes.unlocked.indexOf('hero_voss') < 0) {
                data.heroes.unlocked.push('hero_voss');
                data.heroes.data.hero_voss = { key: 'hero_voss', level: 1, xp: 0, skillPoints: 0, allocations: {}, assignedUnit: null, respecCount: 0 };
            }
        }

        data.version = 8;
        console.log('Migration v7->v8 complete. Heroes unlocked:', data.heroes.unlocked.length);
    }

    if (data.version < 9) {
        console.log('Migrating save from v8 to v9 (Equipment system rework)');

        // Create new equipment structure
        if (!data.equipment) {
            data.equipment = {
                inventory: [],
                gems: [],
                materials: { commonScraps: 0, uncommonScraps: 0, rareScraps: 0, epicScraps: 0, oreShards: 0, refinedOre: 0, elementalDust: 0, prismaticShards: 0 },
                mythicMaterials: { dragon_scale: 0, void_crystal: 0, world_shard: 0 },
                essences: { fire: 0, water: 0, earth: 0, wind: 0, lightning: 0, force: 0, arcane: 0 },
                codex: { discovered: {} },
                slotFocus: { slot: null, remaining: 0 }
            };
        }

        // Migrate old items to new equipment
        if (data.items) {
            // Carry over essences
            if (data.items.essences) {
                var essKeys = Object.keys(data.items.essences);
                for (var ei = 0; ei < essKeys.length; ei++) {
                    data.equipment.essences[essKeys[ei]] = data.items.essences[essKeys[ei]] || 0;
                }
            }

            // Carry over mythic materials
            if (data.items.mythicMaterials) {
                var matKeys = Object.keys(data.items.mythicMaterials);
                for (var mi = 0; mi < matKeys.length; mi++) {
                    data.equipment.mythicMaterials[matKeys[mi]] = data.items.mythicMaterials[matKeys[mi]] || 0;
                }
            }

            // Carry over gems
            if (data.items.gems && Array.isArray(data.items.gems)) {
                data.equipment.gems = data.items.gems.slice();
            }

            // Convert old bench items to new equipment + gold refund
            if (data.items.bench && Array.isArray(data.items.bench)) {
                var goldRefund = 0;
                for (var bi = 0; bi < data.items.bench.length; bi++) {
                    var oldItem = data.items.bench[bi];
                    if (!oldItem) continue;

                    var converted = _migrateOldItem(oldItem);
                    if (converted) {
                        data.equipment.inventory.push(converted);
                    } else {
                        // Items that don't map cleanly → gold refund
                        goldRefund += 15;
                    }
                }
                if (goldRefund > 0) {
                    // gold field still exists at this migration step (renamed in v10)
                    data.player.gold = (data.player.gold || 0) + goldRefund;
                    console.log('Refunded ' + goldRefund + ' for unconvertible items');
                }
            }

            // Clear old items to save space (keep reference for any code that checks)
            data.items = null;
        }

        data.version = 9;
        console.log('Migration v8->v9 complete. Equipment items:', data.equipment.inventory.length);
    }

    // Helper: migrate a single old item to new equipment format
    function _migrateOldItem(oldItem) {
        var id = oldItem.id || (Math.random().toString(36).substr(2, 9));
        var enhanceLevel = oldItem.enhanceLevel || 0;
        var gems = oldItem.gems || [];

        if (oldItem.type === 'component') {
            // Components → Common T1 equipment
            var slotMap = { bf_sword: 'weapon', chain_vest: 'chest', giants_belt: 'chest', recurve_bow: 'weapon',
                large_rod: 'weapon', negatron_cloak: 'offhand', sparring_gloves: 'gauntlets', tear: 'offhand',
                aether_shard: 'helm', quicksilver_gem: 'boots', warding_stone: 'offhand', soul_prism: 'gauntlets' };
            var lineMap = { bf_sword: 'sword', chain_vest: 'chainmail', giants_belt: 'chainmail', recurve_bow: 'bow',
                large_rod: 'staff', negatron_cloak: 'wooden_shield', sparring_gloves: 'leather_gloves', tear: 'healing_orb',
                aether_shard: 'circlet', quicksilver_gem: 'windwalker', warding_stone: 'ward_stone', soul_prism: 'mana_gauntlets' };
            return {
                id: id, slot: slotMap[oldItem.key] || 'weapon', itemKey: lineMap[oldItem.key] || 'sword',
                tier: 1, rarity: 'common', enhanceLevel: 0, enhanceFailStreak: 0, gems: [], affixes: [], setId: null, equipped: null
            };
        } else if (oldItem.type === 'combined') {
            // Combined → Uncommon T2
            return {
                id: id, slot: 'weapon', itemKey: 'sword',
                tier: 2, rarity: 'uncommon', enhanceLevel: enhanceLevel, enhanceFailStreak: 0, gems: gems, affixes: [], setId: null, equipped: null
            };
        } else if (oldItem.type === 'set') {
            // Set items → Rare T3 with set
            var setId = oldItem.setId || null;
            return {
                id: id, slot: 'weapon', itemKey: 'sword',
                tier: 3, rarity: 'rare', enhanceLevel: enhanceLevel, enhanceFailStreak: 0, gems: gems, affixes: [], setId: setId, equipped: null
            };
        } else if (oldItem.type === 'ability') {
            // Ability items → Epic T3
            return {
                id: id, slot: 'weapon', itemKey: 'sword',
                tier: 3, rarity: 'epic', enhanceLevel: enhanceLevel, enhanceFailStreak: 0, gems: gems, affixes: [], setId: null, equipped: null
            };
        } else if (oldItem.type === 'mythic') {
            // Mythic items → direct mapping
            var mythicMap = {
                infinity_gauntlet: { slot: 'gauntlets', key: 'infinity_gauntlet' },
                aegis_of_immortality: { slot: 'offhand', key: 'aegis_of_immortality' },
                eclipse: { slot: 'weapon', key: 'eclipse' },
                staff_of_ages: { slot: 'weapon', key: 'staff_of_ages' },
                worldbreaker: { slot: 'weapon', key: 'worldbreaker' },
                crown_of_ages: { slot: 'helm', key: 'crown_of_ages' }
            };
            var mapping = mythicMap[oldItem.key];
            if (!mapping) return null;
            return {
                id: id, slot: mapping.slot, itemKey: mapping.key,
                tier: 5, rarity: 'mythic', enhanceLevel: enhanceLevel, enhanceFailStreak: 0, gems: gems.length ? gems : [null, null],
                affixes: [], setId: null, equipped: null, isMythic: true
            };
        }
        return null;
    }

    if (data.version < 10) {
        console.log('Migrating save from v9 to v10 (Progression rework — VE, Camp, tiered star-up)');

        // Rename gold → veilEssence
        if (data.player) {
            if (typeof data.player.gold !== 'undefined') {
                data.player.veilEssence = data.player.gold;
                delete data.player.gold;
            }
            if (typeof data.player.veilEssence === 'undefined') data.player.veilEssence = 500;
        }

        // Rename stats
        if (!data.stats) data.stats = {};
        if (typeof data.stats.totalGoldEarned !== 'undefined') {
            data.stats.totalVeilEssenceEarned = data.stats.totalGoldEarned;
            delete data.stats.totalGoldEarned;
        }
        if (typeof data.stats.totalGoldSpent !== 'undefined') {
            data.stats.totalVeilEssenceSpent = data.stats.totalGoldSpent;
            delete data.stats.totalGoldSpent;
        }

        // Migrate building keys
        if (!data.buildings) data.buildings = {};
        var bldMigrationMap = {
            barracks: 'sustained_bonds',
            summoning_circle: 'attunement_rite',
            warehouse: 'essence_reservoir',
            evolution_lab: 'deep_resonance',
            forge: 'echo_shaping',
            gem_workshop: 'prism_focus',
            mana_shrine: 'veil_wellspring',
            bond_hall: 'kindred_circle'
        };
        var oldBldKeys = Object.keys(bldMigrationMap);
        for (var bmi = 0; bmi < oldBldKeys.length; bmi++) {
            var oldKey = oldBldKeys[bmi];
            var newKey = bldMigrationMap[oldKey];
            if (typeof data.buildings[oldKey] !== 'undefined') {
                data.buildings[newKey] = data.buildings[oldKey];
                delete data.buildings[oldKey];
            }
            if (typeof data.buildings[newKey] === 'undefined') data.buildings[newKey] = 0;
        }
        // Sustained Bonds: cap at max 1 (was barracks up to 5)
        if (data.buildings.sustained_bonds > 1) data.buildings.sustained_bonds = 1;
        // Remove obsolete building keys
        delete data.buildings.training_ground;
        delete data.buildings.war_room;

        // Recalculate star-up progress for existing collection entries
        if (data.collection) {
            var collKeys = Object.keys(data.collection);
            for (var sci = 0; sci < collKeys.length; sci++) {
                var sck = collKeys[sci];
                var scEntry = data.collection[sck];
                // No recalc needed — copiesForNext is banked copies, not a threshold.
                // The threshold is now dynamic via getCopiesPerStar().
                // Existing copies stay as-is; they just star up faster/slower depending on tier.
            }
        }

        data.version = 10;
        console.log('Migration v9→v10 complete. VE:', data.player.veilEssence);
    }

    if (data.version < 11) {
        console.log('Migrating save from v10 to v11 (Hero system redesign — philosophy-based)');

        // Determine region progress for hero unlocks
        var rp = (data.missions && data.missions.regionProgress) || {};
        var r2Done = rp[2] && rp[2].bossCleared;
        var r3Done = rp[3] && rp[3].completed && rp[3].completed.length > 0;
        var r4Mid = rp[4] && rp[4].completed && (rp[4].completed.indexOf('r4_s3') >= 0 || rp[4].completed.indexOf('r4_mid') >= 0);
        var r4Boss = rp[4] && rp[4].bossCleared;
        var r5Early = rp[5] && rp[5].completed && (rp[5].completed.indexOf('r5_s1') >= 0 || rp[5].completed.indexOf('r5_s2') >= 0);
        var r5Late = rp[5] && rp[5].completed && (rp[5].completed.indexOf('r5_s4') >= 0 || rp[5].completed.indexOf('r5_boss') >= 0);
        var r7Done = rp[7] && rp[7].completed && rp[7].completed.length > 0;

        // Estimate hero levels from old data
        var oldAvgLevel = 1;
        if (data.heroes && data.heroes.data) {
            var totalLvl = 0;
            var cnt = 0;
            var oldKeys = Object.keys(data.heroes.data);
            for (var oli = 0; oli < oldKeys.length; oli++) {
                var oh = data.heroes.data[oldKeys[oli]];
                if (oh && oh.level) { totalLvl += oh.level; cnt++; }
            }
            if (cnt > 0) oldAvgLevel = Math.floor(totalLvl / cnt);
        }

        // Build new hero data
        var newHeroes = {
            data: {
                kael:  { level: Math.max(1, oldAvgLevel), xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false },
                lyric: { level: Math.max(1, oldAvgLevel), xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false },
                ren:   { level: Math.max(1, oldAvgLevel), xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false, _unlocked: !r2Done ? false : undefined },
                sera:  { level: Math.max(1, oldAvgLevel), xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false, _unlocked: !r3Done ? false : undefined },
                maren: { level: Math.max(1, oldAvgLevel), xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false, _unlocked: !r3Done ? false : undefined },
                voss:  { level: Math.max(1, Math.floor(oldAvgLevel * 0.8)), xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false, _unlocked: !r7Done ? false : undefined }
            }
        };

        // Handle Lyric death (R4 mid+)
        if (r4Mid || r4Boss) {
            newHeroes.data.lyric.isDead = true;
            newHeroes.data.lyric.assignedUnit = null;
        }

        // Handle Sera/Maren away during R4
        if ((r4Mid || r4Boss) && !r5Early) {
            newHeroes.data.maren._away = true;
            newHeroes.data.maren.assignedUnit = null;
        }
        if ((r4Mid || r4Boss) && !r5Late) {
            newHeroes.data.sera._away = true;
            newHeroes.data.sera.assignedUnit = null;
        }

        // Clean up undefined _unlocked flags
        for (var nhk in newHeroes.data) {
            if (newHeroes.data[nhk]._unlocked === undefined) {
                delete newHeroes.data[nhk]._unlocked;
            }
        }

        data.heroes = newHeroes;
        data.version = 11;
        console.log('Migration v10→v11 complete. New hero system.');
    }

    if (data.version < 12) {
        // v11→v12: 74-stage expansion — add stageProgress for per-stage tracking
        // and update regionProgress to include all new stage IDs
        if (!data.missions.stageProgress) {
            data.missions.stageProgress = {};
        }
        // Migrate existing completed stages into stageProgress
        if (data.missions.regionProgress) {
            for (var rp12 = 1; rp12 <= 8; rp12++) {
                var rpData = data.missions.regionProgress[rp12];
                if (rpData && rpData.completed) {
                    for (var sp12 = 0; sp12 < rpData.completed.length; sp12++) {
                        var sid = rpData.completed[sp12];
                        if (!data.missions.stageProgress[sid]) {
                            data.missions.stageProgress[sid] = {
                                completed: true,
                                bestStars: (data.missions.starRatings && data.missions.starRatings[sid]) || 1,
                                clearedAt: Date.now()
                            };
                        }
                    }
                }
            }
        }
        // Ensure all 8 regions exist in regionProgress
        for (var rp12b = 1; rp12b <= 8; rp12b++) {
            if (!data.missions.regionProgress[rp12b]) {
                data.missions.regionProgress[rp12b] = { completed: [], bossCleared: false };
            }
        }
        data.version = 12;
        console.log('Migration v11→v12 complete. 74-stage expansion.');
    }

    // Phase 5 graceful migration: add new fields if missing (version-agnostic)
    if (!data.buildings) data.buildings = {};
    if (typeof data.buildings.sustained_bonds === 'undefined') data.buildings.sustained_bonds = 0;
    if (typeof data.buildings.attunement_rite === 'undefined') data.buildings.attunement_rite = 0;
    if (typeof data.buildings.essence_reservoir === 'undefined') data.buildings.essence_reservoir = 0;
    if (typeof data.buildings.deep_resonance === 'undefined') data.buildings.deep_resonance = 0;
    if (typeof data.buildings.echo_shaping === 'undefined') data.buildings.echo_shaping = 0;
    if (typeof data.buildings.prism_focus === 'undefined') data.buildings.prism_focus = 0;
    if (typeof data.buildings.veil_wellspring === 'undefined') data.buildings.veil_wellspring = 0;
    if (typeof data.buildings.kindred_circle === 'undefined') data.buildings.kindred_circle = 0;
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
    if (typeof data.player.veilEssence !== 'number') data.player.veilEssence = 500;
    data.player.veilEssence = Math.max(0, data.player.veilEssence);

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
    if (typeof data.buildings.sustained_bonds === 'undefined') data.buildings.sustained_bonds = 0;
    if (typeof data.buildings.attunement_rite === 'undefined') data.buildings.attunement_rite = 0;
    if (typeof data.buildings.essence_reservoir === 'undefined') data.buildings.essence_reservoir = 0;
    if (typeof data.buildings.deep_resonance === 'undefined') data.buildings.deep_resonance = 0;
    if (typeof data.buildings.echo_shaping === 'undefined') data.buildings.echo_shaping = 0;
    if (typeof data.buildings.prism_focus === 'undefined') data.buildings.prism_focus = 0;
    if (typeof data.buildings.veil_wellspring === 'undefined') data.buildings.veil_wellspring = 0;
    if (typeof data.buildings.kindred_circle === 'undefined') data.buildings.kindred_circle = 0;
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
    if (typeof data.stats.totalVeilEssenceSpent !== 'number') data.stats.totalVeilEssenceSpent = 0;
    if (typeof data.stats.totalVeilEssenceEarned !== 'number') data.stats.totalVeilEssenceEarned = 0;
    if (!data.achievements) data.achievements = { earned: [], claimed: [] };
    if (!Array.isArray(data.achievements.earned)) data.achievements.earned = [];
    if (!Array.isArray(data.achievements.claimed)) data.achievements.claimed = [];

    // Heroes validation (new philosophy-based system)
    if (!data.heroes || !data.heroes.data) {
        data.heroes = {
            data: {
                kael:  { level: 1, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false },
                lyric: { level: 1, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false },
                ren:   { level: 1, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false, _unlocked: false },
                sera:  { level: 1, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false, _unlocked: false },
                maren: { level: 1, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false, _unlocked: false },
                voss:  { level: 1, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false, _unlocked: false }
            }
        };
    }
    if (!data.heroes.data) data.heroes.data = {};
    // Ensure all 6 heroes have data entries
    var heroDefaults = ['kael', 'lyric', 'ren', 'sera', 'maren', 'voss'];
    for (var hi = 0; hi < heroDefaults.length; hi++) {
        var hk = heroDefaults[hi];
        if (!data.heroes.data[hk]) {
            data.heroes.data[hk] = { level: 1, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false };
        }
        var hd = data.heroes.data[hk];
        if (typeof hd.level !== 'number') hd.level = 1;
        if (typeof hd.xp !== 'number') hd.xp = 0;
        if (!Array.isArray(hd.investedNodes)) hd.investedNodes = [];
        if (typeof hd.respecCount !== 'number') hd.respecCount = 0;
        if (typeof hd.isDead !== 'boolean') hd.isDead = false;
    }

    // Equipment validation (new system)
    if (!data.equipment) {
        data.equipment = {
            inventory: [], gems: [],
            materials: { commonScraps: 0, uncommonScraps: 0, rareScraps: 0, epicScraps: 0, oreShards: 0, refinedOre: 0, elementalDust: 0, prismaticShards: 0 },
            mythicMaterials: { dragon_scale: 0, void_crystal: 0, world_shard: 0 },
            essences: { fire: 0, water: 0, earth: 0, wind: 0, lightning: 0, force: 0, arcane: 0 },
            codex: { discovered: {} },
            slotFocus: { slot: null, remaining: 0 }
        };
    }
    if (!Array.isArray(data.equipment.inventory)) data.equipment.inventory = [];
    if (!Array.isArray(data.equipment.gems)) data.equipment.gems = [];
    if (!data.equipment.materials) data.equipment.materials = { commonScraps: 0, uncommonScraps: 0, rareScraps: 0, epicScraps: 0, oreShards: 0, refinedOre: 0, elementalDust: 0, prismaticShards: 0 };
    if (!data.equipment.mythicMaterials) data.equipment.mythicMaterials = { dragon_scale: 0, void_crystal: 0, world_shard: 0 };
    if (!data.equipment.essences) data.equipment.essences = { fire: 0, water: 0, earth: 0, wind: 0, lightning: 0, force: 0, arcane: 0 };
    if (!data.equipment.codex) data.equipment.codex = { discovered: {} };
    if (!data.equipment.slotFocus) data.equipment.slotFocus = { slot: null, remaining: 0 };

    console.log('Validation complete. Valid entries:', Object.keys(data.collection).length);
    return data;
}

// Tiered copies per star — depends on unit cost tier
function getCopiesPerStar(templateKey) {
    var tmpl = UNIT_TEMPLATES[templateKey] || EVOLVED_TEMPLATES[templateKey];
    if (!tmpl) return 10;
    var tier = tmpl.cost || tmpl.baseCost || 1;
    switch (tier) {
        case 1: return 3;
        case 2: return 4;
        case 3: return 5;
        case 4: return 8;
        case 5: return 10;
        default: return 10;
    }
}

// Echo Release (sell) value by unit tier — flat VE per copy
var ECHO_RELEASE_VALUES = { 1: 5, 2: 10, 3: 20, 4: 50, 5: 100 };

function getEchoReleaseValue(templateKey) {
    var tmpl = UNIT_TEMPLATES[templateKey] || EVOLVED_TEMPLATES[templateKey];
    if (!tmpl) return 5;
    var tier = tmpl.cost || tmpl.baseCost || 1;
    return ECHO_RELEASE_VALUES[tier] || 5;
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

function canStarUp(saveData, templateKey) {
    var entry = saveData.collection[templateKey];
    if (!entry) return false;
    return entry.copiesForNext >= getCopiesPerStar(templateKey);
}

function starUpUnit(saveData, templateKey) {
    if (!canStarUp(saveData, templateKey)) return false;

    var entry = saveData.collection[templateKey];
    entry.copiesForNext -= getCopiesPerStar(templateKey);
    entry.stars++;
    return true;
}

// ---- Sell Helpers ----

function getEchoReleaseTotal(templateKey, copiesCount) {
    return copiesCount * getEchoReleaseValue(templateKey);
}

function sellUnitCopies(saveData, templateKey, count) {
    var entry = saveData.collection[templateKey];
    if (!entry) return false;
    if (count > entry.copiesForNext) return false;
    if (count <= 0) return false;

    var veEarned = getEchoReleaseTotal(templateKey, count);
    entry.copiesForNext -= count;
    earnGold(saveData, veEarned);
    autoSave(saveData);
    return veEarned;
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

    // Base slots: start at 3, +1 at levels 4, 8, 12, 16
    var baseSlots = 3;
    if (level >= 4) baseSlots++;
    if (level >= 8) baseSlots++;
    if (level >= 12) baseSlots++;
    if (level >= 16) baseSlots++;

    // Sustained Bonds bonus: +1 at L17 with building upgrade
    var sustainedBondsBonus = 0;
    if (level >= 17) {
        var sustainedBondsLevel = saveData.buildings && saveData.buildings.sustained_bonds ? saveData.buildings.sustained_bonds : 0;
        if (sustainedBondsLevel >= 1) sustainedBondsBonus = 1;
    }

    return Math.min(8, baseSlots + sustainedBondsBonus);
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

// Hard level caps by highest region unlocked (regions gate levels, not reverse)
var REGION_LEVEL_CAPS = { 1: 4, 2: 7, 3: 10, 4: 13, 5: 16, 6: 18, 7: 20, 8: 20 };

function getPlayerLevelCap(saveData) {
    // Find highest region unlocked (R1 boss cleared = R2 unlocked, etc.)
    var highestRegion = 1;
    if (saveData.missions && saveData.missions.regionProgress) {
        for (var r = 1; r <= 8; r++) {
            var rp = saveData.missions.regionProgress[r];
            if (rp && rp.bossCleared) {
                highestRegion = Math.min(r + 1, 8); // Clearing R1 boss unlocks R2's cap
            }
        }
    }
    return REGION_LEVEL_CAPS[highestRegion] || 20;
}

function addPlayerXP(saveData, amount) {
    var levelCap = getPlayerLevelCap(saveData);
    // Don't add XP if already at cap
    if (saveData.player.level >= levelCap) return false;
    saveData.player.xp += amount;
    var leveled = false;
    while (saveData.player.level < levelCap && saveData.player.xp >= getXPForLevel(saveData.player.level + 1)) {
        saveData.player.level++;
        leveled = true;
    }
    // Clamp XP at the threshold if at cap (don't accumulate excess)
    if (saveData.player.level >= levelCap) {
        var capXP = getXPForLevel(levelCap);
        if (saveData.player.xp > capXP) saveData.player.xp = capXP;
    }
    return leveled;
}

// ---- VE (Veil Essence) Helpers ----
// Function names kept as spendGold/earnGold for backward compat across all call sites

function spendGold(saveData, amount) {
    if (saveData.player.veilEssence < amount) return false;
    saveData.player.veilEssence -= amount;
    if (!saveData.stats.totalVeilEssenceSpent) saveData.stats.totalVeilEssenceSpent = 0;
    saveData.stats.totalVeilEssenceSpent += amount;
    return true;
}

function earnGold(saveData, amount) {
    saveData.player.veilEssence += amount;
    if (!saveData.stats.totalVeilEssenceEarned) saveData.stats.totalVeilEssenceEarned = 0;
    saveData.stats.totalVeilEssenceEarned += amount;
}

// ---- Auto-save (call after any mutation) ----

function autoSave(saveData) {
    return saveGame(saveData);
}

// =============================================================================
// tests/test-save-migration.js — save migration chain (GROUND-TRUTH.md §15).
//
// Builds minimal-but-realistic fixture saves at v5, v8, v10, and v11 (each
// fixture only needs to satisfy the migrations that still apply from that
// version forward — earlier migration blocks are skipped by migrateSave()'s
// `if (data.version < N)` guards, so we don't need to fake pre-v5 shapes).
// Loads each through the real migrateSave()/validateSaveData() pipeline and
// asserts it reaches v12 without throwing, preserving collection/VE/progress
// fields across the renames (gold->veilEssence, old building keys -> new,
// old hero_a/hero_b system -> philosophy-based heroes).
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

function regionProgress(overrides) {
    const rp = {};
    for (let r = 1; r <= 8; r++) rp[r] = { completed: [], bossCleared: false };
    Object.keys(overrides || {}).forEach(function(r) { rp[r] = overrides[r]; });
    return rp;
}

function buildV5Fixture() {
    return {
        version: 5,
        player: { level: 3, xp: 120, gold: 750, name: 'Tester5' },
        collection: {
            flame_warrior: { stars: 2, copiesForNext: 1 },
            stone_guard: { stars: 1, copiesForNext: 0 }
        },
        teams: [{ name: 'Team 1', slots: [{ key: 'flame_warrior', row: 0, col: 0 }] }],
        activeTeamIndex: 0,
        buildings: {
            barracks: 1, summoning_circle: 0, warehouse: 2, evolution_lab: 0,
            forge: 1, gem_workshop: 0, mana_shrine: 0, bond_hall: 0
        },
        missions: { storyProgress: 7, milestonesClaimed: [], chapterRewardsClaimed: [1, 2] },
        items: {
            bench: [{ id: 'x1', type: 'component', key: 'bf_sword' }],
            benchSize: 10,
            essences: { fire: 3, water: 1, earth: 0, wind: 0, lightning: 0, force: 0 },
            mythicMaterials: { dragon_scale: 0, void_crystal: 0, world_shard: 0 },
            recipeBook: {}, milestones: {}
        },
        stats: { rollsSincePity: 4, totalGoldSpent: 300, totalGoldEarned: 900, totalRolls: 12, totalUnitsCollected: 12 },
        lastSaved: null
    };
}

function buildV8Fixture() {
    return {
        version: 8,
        player: { level: 6, xp: 300, gold: 1200, name: 'Tester8' },
        collection: {
            flame_warrior: { stars: 3, copiesForNext: 2, level: 5, xp: 50, ascensionTier: null },
            stone_guard: { stars: 1, copiesForNext: 0, level: 1, xp: 0, ascensionTier: null }
        },
        teams: [{ name: 'Team 1', slots: [{ key: 'flame_warrior', row: 0, col: 0, level: 5, xp: 50, ascensionTier: null }] }],
        activeTeamIndex: 0,
        buildings: {
            barracks: 2, summoning_circle: 1, warehouse: 1, evolution_lab: 0,
            forge: 2, gem_workshop: 0, mana_shrine: 0, bond_hall: 0
        },
        missions: {
            storyProgress: 10,
            milestonesClaimed: [],
            regionProgress: regionProgress({
                1: { completed: ['r1_s1', 'r1_s2', 'r1_s3', 'r1_s4', 'r1_boss'], bossCleared: true },
                2: { completed: ['r2_s1'], bossCleared: false }
            }),
            starRatings: {},
            regionRewardsClaimed: []
        },
        items: {
            bench: [], benchSize: 10,
            essences: { fire: 2, water: 0, earth: 0, wind: 0, lightning: 0, force: 0, arcane: 0 },
            mythicMaterials: { dragon_scale: 0, void_crystal: 0, world_shard: 0 },
            recipeBook: {}, milestones: {}
        },
        heroes: {
            unlocked: ['hero_a', 'hero_b', 'hero_kael'],
            data: {
                hero_a: { key: 'hero_a', level: 4, xp: 0, skillPoints: 0, allocations: {}, assignedUnit: null, respecCount: 0 },
                hero_b: { key: 'hero_b', level: 3, xp: 0, skillPoints: 0, allocations: {}, assignedUnit: null, respecCount: 0 },
                hero_kael: { key: 'hero_kael', level: 2, xp: 0, skillPoints: 0, allocations: {}, assignedUnit: null, respecCount: 0 }
            },
            bDeathSnapshot: null, bFragment: null
        },
        stats: { rollsSincePity: 10, totalGoldSpent: 800, totalGoldEarned: 2000, totalRolls: 30, totalUnitsCollected: 15 },
        lastSaved: null
    };
}

function buildV10Fixture() {
    return {
        version: 10,
        player: { level: 9, xp: 500, veilEssence: 2200, name: 'Tester10' },
        collection: {
            flame_warrior: { stars: 4, copiesForNext: 3, level: 10, xp: 200, ascensionTier: null },
            stone_guard: { stars: 2, copiesForNext: 1, level: 3, xp: 10, ascensionTier: null }
        },
        teams: [{ name: 'Team 1', slots: [{ key: 'flame_warrior', row: 0, col: 0, level: 10, xp: 200, ascensionTier: null }] }],
        activeTeamIndex: 0,
        buildings: {
            sustained_bonds: 1, attunement_rite: 2, essence_reservoir: 3, deep_resonance: 0,
            echo_shaping: 1, prism_focus: 0, veil_wellspring: 0, kindred_circle: 0
        },
        missions: {
            storyProgress: 12,
            milestonesClaimed: [],
            regionProgress: regionProgress({
                1: { completed: ['r1_s1', 'r1_s2', 'r1_s3', 'r1_s4', 'r1_boss'], bossCleared: true },
                2: { completed: ['r2_s1', 'r2_s2', 'r2_s3', 'r2_s4', 'r2_s5', 'r2_s6', 'r2_s7', 'r2_s8', 'r2_boss'], bossCleared: true }
            }),
            starRatings: {},
            regionRewardsClaimed: [1]
        },
        equipment: {
            inventory: [{ id: 'eq1', slot: 'weapon', itemKey: 'sword', tier: 1, rarity: 'common', enhanceLevel: 0, enhanceFailStreak: 0, gems: [], affixes: [], setId: null, equipped: null }],
            gems: [],
            materials: { commonScraps: 1, uncommonScraps: 0, rareScraps: 0, epicScraps: 0, oreShards: 0, refinedOre: 0, elementalDust: 0, prismaticShards: 0 },
            mythicMaterials: { dragon_scale: 0, void_crystal: 0, world_shard: 0 },
            essences: { fire: 1, water: 0, earth: 0, wind: 0, lightning: 0, force: 0, arcane: 0 },
            codex: { discovered: {} },
            slotFocus: { slot: null, remaining: 0 }
        },
        heroes: {
            unlocked: ['hero_a', 'hero_b', 'hero_kael', 'hero_lyra'],
            data: {
                hero_a: { key: 'hero_a', level: 8, xp: 0, skillPoints: 0, allocations: {}, assignedUnit: null, respecCount: 0 },
                hero_b: { key: 'hero_b', level: 7, xp: 0, skillPoints: 0, allocations: {}, assignedUnit: null, respecCount: 0 },
                hero_kael: { key: 'hero_kael', level: 5, xp: 0, skillPoints: 0, allocations: {}, assignedUnit: null, respecCount: 0 },
                hero_lyra: { key: 'hero_lyra', level: 3, xp: 0, skillPoints: 0, allocations: {}, assignedUnit: null, respecCount: 0 }
            },
            bDeathSnapshot: null, bFragment: null
        },
        stats: { rollsSincePity: 20, totalVeilEssenceSpent: 1500, totalVeilEssenceEarned: 3700, totalRolls: 60, totalUnitsCollected: 20 },
        lastSaved: null
    };
}

function buildV11Fixture() {
    return {
        version: 11,
        player: { level: 14, xp: 1000, veilEssence: 5000, name: 'Tester11' },
        collection: {
            flame_warrior: { stars: 5, copiesForNext: 0, level: 20, xp: 500, ascensionTier: 'awakened' }
        },
        teams: [{ name: 'Team 1', slots: [{ key: 'flame_warrior', row: 0, col: 0, level: 20, xp: 500, ascensionTier: 'awakened' }] }],
        activeTeamIndex: 0,
        buildings: {
            sustained_bonds: 1, attunement_rite: 3, essence_reservoir: 4, deep_resonance: 1,
            echo_shaping: 2, prism_focus: 1, veil_wellspring: 0, kindred_circle: 0
        },
        missions: {
            storyProgress: 14,
            milestonesClaimed: ['story_10'],
            regionProgress: regionProgress({
                1: { completed: ['r1_s1', 'r1_s2', 'r1_s3', 'r1_s4', 'r1_boss'], bossCleared: true },
                2: { completed: ['r2_s1', 'r2_s2', 'r2_s3', 'r2_s4', 'r2_s5', 'r2_s6', 'r2_s7', 'r2_s8', 'r2_boss'], bossCleared: true },
                3: { completed: ['r3_s1', 'r3_s2', 'r3_s3'], bossCleared: false }
            }),
            starRatings: { r1_s1: 3, r2_boss: 2 },
            regionRewardsClaimed: [1, 2]
        },
        equipment: {
            inventory: [], gems: [],
            materials: { commonScraps: 0, uncommonScraps: 0, rareScraps: 0, epicScraps: 0, oreShards: 0, refinedOre: 0, elementalDust: 0, prismaticShards: 0 },
            mythicMaterials: { dragon_scale: 0, void_crystal: 0, world_shard: 0 },
            essences: { fire: 0, water: 0, earth: 0, wind: 0, lightning: 0, force: 0, arcane: 0 },
            codex: { discovered: {} },
            slotFocus: { slot: null, remaining: 0 }
        },
        heroes: {
            data: {
                kael: { level: 12, xp: 100, assignedUnit: 'flame_warrior', investedNodes: ['k1', 'k2'], respecCount: 0, isDead: false },
                lyric: { level: 10, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false },
                ren: { level: 8, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false },
                sera: { level: 1, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false, _unlocked: false },
                maren: { level: 1, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false, _unlocked: false },
                voss: { level: 1, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false, _unlocked: false }
            }
        },
        stats: { rollsSincePity: 5, totalVeilEssenceSpent: 5000, totalVeilEssenceEarned: 9800, totalRolls: 120, totalUnitsCollected: 40 },
        lastSaved: null
    };
}

function migrateAndValidate(h, fixture) {
    let migrated;
    assert.doesNotThrow(function() {
        migrated = h.context.migrateSave(fixture);
    }, 'migrateSave should not throw for v' + fixture.version + ' fixture');
    assert.ok(migrated, 'migrateSave should return a truthy save object');
    assert.equal(migrated.version, 12, 'migrated save should reach v' + h.context.SAVE_VERSION);
    let validated;
    assert.doesNotThrow(function() {
        validated = h.context.validateSaveData(migrated);
    }, 'validateSaveData should not throw after migration');
    return validated;
}

module.exports = [
    {
        name: 'v5 fixture migrates to v12 preserving VE (renamed from gold), collection, and story progress',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const sd = migrateAndValidate(h, buildV5Fixture());
            assert.equal(sd.player.veilEssence, 750, 'gold->veilEssence rename should preserve amount');
            assert.equal(sd.collection.flame_warrior.stars, 2, 'collection stars preserved');
            assert.equal(sd.collection.flame_warrior.copiesForNext, 1, 'collection copiesForNext preserved');
            assert.equal(sd.missions.storyProgress, 7, 'storyProgress preserved');
            assert.equal(sd.stats.totalVeilEssenceSpent, 300, 'totalGoldSpent->totalVeilEssenceSpent rename');
            assert.equal(sd.stats.totalVeilEssenceEarned, 900, 'totalGoldEarned->totalVeilEssenceEarned rename');
            assert.equal(sd.equipment.inventory.length, 1, 'legacy bench item converted to new equipment inventory');
            assert.ok(sd.heroes && sd.heroes.data && sd.heroes.data.kael, 'philosophy-based heroes present after full migration');
        }
    },
    {
        name: 'v8 fixture migrates to v12 preserving region progress and capping Sustained Bonds at 1',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const sd = migrateAndValidate(h, buildV8Fixture());
            assert.equal(sd.player.veilEssence, 1200, 'gold->veilEssence rename should preserve amount');
            assert.equal(sd.collection.flame_warrior.stars, 3, 'collection stars preserved');
            assert.equal(sd.missions.regionProgress[1].bossCleared, true, 'region 1 boss-cleared progress preserved');
            assert.equal(sd.buildings.sustained_bonds, 1, 'barracks(2)->sustained_bonds should be capped at max 1');
            assert.equal(sd.buildings.echo_shaping, 2, 'forge->echo_shaping rename preserves level');
            assert.ok(sd.heroes.data.kael.level >= 1, 'new philosophy-based hero data synthesized from old hero_a/hero_b/hero_kael levels');
        }
    },
    {
        name: 'v10 fixture migrates to v12 preserving VE, equipment inventory, and region progress',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const sd = migrateAndValidate(h, buildV10Fixture());
            assert.equal(sd.player.veilEssence, 2200, 'veilEssence unchanged (already renamed at v10)');
            assert.equal(sd.equipment.inventory.length, 1, 'equipment inventory preserved across hero-system migration');
            assert.equal(sd.missions.regionProgress[2].bossCleared, true, 'region 2 boss-cleared progress preserved');
            assert.equal(sd.collection.flame_warrior.stars, 4, 'collection stars preserved');
            assert.ok(sd.heroes.data.kael.level >= 1, 'philosophy-based heroes synthesized');
        }
    },
    {
        name: 'v11 fixture migrates to v12 preserving VE, hero assignment, and building stageProgress per-stage tracking',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const sd = migrateAndValidate(h, buildV11Fixture());
            assert.equal(sd.player.veilEssence, 5000, 'veilEssence unchanged');
            assert.equal(sd.heroes.data.kael.level, 12, 'philosophy-based hero level preserved untouched');
            assert.equal(sd.heroes.data.kael.assignedUnit, 'flame_warrior', 'hero unit assignment preserved');
            assert.ok(sd.missions.stageProgress, 'v11->v12 should add per-stage tracking');
            assert.equal(sd.missions.stageProgress.r1_s1.bestStars, 3, 'stageProgress should carry over starRatings for completed stages');
            assert.equal(Object.keys(sd.missions.stageProgress).length, 17, 'stageProgress should have one entry per previously-completed stage (5+9+3)');
        }
    },
    {
        name: 'all four fixture versions converge on save version 12',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            [buildV5Fixture(), buildV8Fixture(), buildV10Fixture(), buildV11Fixture()].forEach(function(fixture) {
                const migrated = h.context.migrateSave(fixture);
                assert.equal(migrated.version, 12, 'fixture starting at v' + fixture.version);
            });
        }
    }
];

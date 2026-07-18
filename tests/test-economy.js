// =============================================================================
// tests/test-economy.js — mission reward multipliers (Warehouse/essence_reservoir,
// Training/xpMult) and VE invariants (GROUND-TRUTH.md §13).
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

module.exports = [
    {
        name: 'VE reward applies star-rating multiplier (1★=50%, 2★=75%, 3★=100%) with no building bonus',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            const mission = h.context.STAGES[0]; // r1_s1, rewards.ve = 200
            const baseVE = mission.rewards.ve;

            const r1 = h.context.calculateMissionRewards(sd, mission, 1);
            const r2 = h.context.calculateMissionRewards(sd, mission, 2);
            const r3 = h.context.calculateMissionRewards(sd, mission, 3);

            assert.equal(r1.gold, Math.floor(baseVE * 0.5), '1-star VE reward should be 50% of base');
            assert.equal(r2.gold, Math.floor(baseVE * 0.75), '2-star VE reward should be 75% of base');
            assert.equal(r3.gold, baseVE, '3-star VE reward should be 100% of base');
        }
    },
    {
        name: 'Warehouse (essence_reservoir) building multiplies VE reward by +5% per level',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            const mission = h.context.STAGES[0];
            const baseVE = mission.rewards.ve;

            [0, 1, 3, 5].forEach(function(level) {
                sd.buildings.essence_reservoir = level;
                const r = h.context.calculateMissionRewards(sd, mission, 3); // 3-star -> starMult 1.0 isolates the building multiplier
                const expectedMult = 1.0 + level * 0.05;
                assert.equal(r.gold, Math.floor(baseVE * expectedMult), 'VE reward at essence_reservoir level ' + level);
            });
        }
    },
    {
        name: 'Training (XP multiplier building) is a documented no-op: getXPMultiplier() is always 1.0x',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            // js/hub.js:204-207 — "Training Ground removed — always 1.0x". Every
            // building level should leave the XP multiplier untouched.
            [0, 1, 2, 3, 4, 5].forEach(function(level) {
                sd.buildings.essence_reservoir = level;
                sd.buildings.kindred_circle = level;
                sd.buildings.veil_wellspring = level;
                assert.equal(h.context.getXPMultiplier(sd), 1.0, 'XP multiplier should stay 1.0x regardless of building levels');
            });
        }
    },
    {
        name: 'XP reward applies overleveled diminishing returns (100/75/50/25% by level gap vs region)',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            const mission = h.context.STAGES[0]; // r1, expected level 3
            const baseXP = mission.rewards.xp;

            const cases = [
                { level: 1, expectedMult: 1.0 },  // at/below expected level
                { level: 3, expectedMult: 1.0 },
                { level: 5, expectedMult: 0.75 }, // +2 over expected (3) -> 0.75
                { level: 7, expectedMult: 0.50 }, // +4 over -> 0.50
                { level: 9, expectedMult: 0.25 }  // +6 over -> 0.25
            ];
            cases.forEach(function(c) {
                sd.player.level = c.level;
                const r = h.context.calculateMissionRewards(sd, mission, 3);
                assert.equal(r.xp, Math.floor(baseXP * c.expectedMult), 'XP for player level ' + c.level + ' vs region-1 (expected lvl 3)');
            });
        }
    },
    {
        name: 'spendGold() rejects insufficient VE and never lets veilEssence go negative',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.player.veilEssence = 100;

            assert.equal(h.context.spendGold(sd, 150), false, 'spending more than available should fail');
            assert.equal(sd.player.veilEssence, 100, 'VE should be unchanged after a rejected spend');

            assert.equal(h.context.spendGold(sd, 100), true, 'spending exactly the available amount should succeed');
            assert.equal(sd.player.veilEssence, 0, 'VE should be exactly 0');

            assert.equal(h.context.spendGold(sd, 1), false, 'spending from 0 VE should fail');
            assert.equal(sd.player.veilEssence, 0, 'VE must never go negative');
        }
    },
    {
        name: 'earnGold() accumulates VE and totalVeilEssenceEarned stat correctly',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.player.veilEssence = 0;
            sd.stats.totalVeilEssenceEarned = 0;

            h.context.earnGold(sd, 250);
            h.context.earnGold(sd, 100);

            assert.equal(sd.player.veilEssence, 350, 'VE should accumulate across multiple earnGold calls');
            assert.equal(sd.stats.totalVeilEssenceEarned, 350, 'totalVeilEssenceEarned stat should track cumulative earnings');
        }
    },
    {
        name: 'spendGold() correctly tracks totalVeilEssenceSpent across multiple spends',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.player.veilEssence = 1000;
            sd.stats.totalVeilEssenceSpent = 0;

            h.context.spendGold(sd, 300);
            h.context.spendGold(sd, 200);
            h.context.spendGold(sd, 10000); // rejected — should not count toward spent total

            assert.equal(sd.player.veilEssence, 500, 'VE should reflect only the successful spends');
            assert.equal(sd.stats.totalVeilEssenceSpent, 500, 'totalVeilEssenceSpent should only count successful spends');
        }
    },
    {
        name: 'applyMissionRewards() applies VE/XP/equipment from calculateMissionRewards() — the real production pairing used by ui-combat.js',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            const mission = h.context.STAGES[0];
            sd.player.veilEssence = 0;
            const before = sd.equipment.inventory.length;

            const rewards = h.context.calculateMissionRewards(sd, mission, 3);
            h.context.applyMissionRewards(sd, rewards);

            assert.equal(sd.player.veilEssence, rewards.gold, 'VE should be credited by the calculated reward amount');
            assert.equal(sd.equipment.inventory.length, before + rewards.equipmentDrops.length, 'reward equipment should be appended to inventory');
        }
    },
    {
        name: 'BUGS.md #5 fixed: applyMissionRewards() is now the sole global definition and correctly applies every field of the calculateMissionRewards() contract',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();

            // js/items.js:1605 used to define a second, permanently-shadowed
            // applyMissionRewards(saveData, rewards) expecting a { items, gems, essences,
            // mythicMaterials } shape (the shape generateMissionRewards() returns).
            // js/missions.js:2706 defines the real, live applyMissionRewards(saveData, rewards)
            // expecting the { gold, xp, unitCopies, equipmentDrops, gemDrops, essenceDropsNew,
            // mythicMatDrops, materialDrops } shape calculateMissionRewards() returns. Since
            // both were plain `function` declarations in shared global scope and missions.js
            // loaded after items.js in game-v2.html, the missions.js version always won —
            // the items.js copy was unreachable dead code. It has been deleted (Prompt 61);
            // this test exercises every field of the one surviving, correct contract.
            sd.player.veilEssence = 0;
            sd.player.xp = 0;
            const beforeItems = sd.equipment.inventory.length;
            const beforeGems = sd.equipment.gems.length;
            const beforeCollectionKeys = Object.keys(sd.collection).length;

            const fakeItem = {
                id: 'test-fake-item', slot: 'weapon', itemKey: 'iron_blade', tier: 1,
                rarity: 'common', enhanceLevel: 0, enhanceFailStreak: 0, gems: [], affixes: [],
                setId: null, equipped: null
            };
            const rewards = {
                gold: 123,
                xp: 45,
                starRating: 3,
                unitCopies: ['flame_warrior'],  // already in the starter collection
                equipmentDrops: [fakeItem],
                gemDrops: ['fire_uncommon'],
                essenceDropsNew: { fire: 2 },
                mythicMatDrops: { dragon_scale: 1 },
                materialDrops: { oreShards: 3 },
                missionId: null
            };

            h.context.applyMissionRewards(sd, rewards);

            assert.equal(sd.player.veilEssence, 123, 'gold reward should credit VE');
            assert.equal(sd.equipment.inventory.length, beforeItems + 1, 'equipment reward should be appended to inventory');
            assert.equal(sd.equipment.gems.length, beforeGems + 1, 'gem reward should be appended');
            assert.equal(sd.equipment.essences.fire, 2, 'essence reward should be credited');
            assert.equal(sd.equipment.mythicMaterials.dragon_scale, 1, 'mythic material reward should be credited');
            assert.equal(sd.equipment.materials.oreShards, 3, 'material reward should be credited');
            assert.equal(sd.collection.flame_warrior.copiesForNext, 1, 'unit copy reward should bank a copy on the existing collection entry');
            assert.equal(Object.keys(sd.collection).length, beforeCollectionKeys, 'an already-owned unit copy should not create a new collection entry');
        }
    }
];

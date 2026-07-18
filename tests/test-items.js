// =============================================================================
// tests/test-items.js — item generation bounds, enhancement +0->+10 cost/pity,
// and gem socketing rules (GROUND-TRUTH.md §12).
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

function makeUncommonItem(h) {
    // Deterministic fixture item rather than a random drop, so the
    // enhancement tests aren't coupled to generateEquipmentDrop's RNG.
    const equip = {
        id: 'test-item-1',
        slot: 'weapon',
        itemKey: Object.keys(h.context.ITEM_LINES).filter(function(k) {
            return h.context.ITEM_LINES[k].slot === 'weapon';
        })[0],
        tier: 1,
        rarity: 'uncommon',
        enhanceLevel: 0,
        enhanceFailStreak: 0,
        gems: [],
        affixes: [],
        setId: null,
        equipped: null
    };
    return equip;
}

module.exports = [
    {
        name: 'seeded: 2,000 equipment drops in region 1 always roll T1 (region-gated), never mythic',
        fn: function() {
            const h = createHarness({ seed: 11 });
            h.loadScripts();
            for (let i = 0; i < 2000; i++) {
                const eq = h.context.generateEquipmentDrop(1, false, false);
                assert.equal(eq.tier, 1, 'region 1 should only ever drop T1 equipment');
                assert.notEqual(eq.rarity, 'mythic', 'normal drops should never roll mythic (dropWeights.mythic = 0)');
                assert.ok(h.context.RARITY_CONFIG.tiers.indexOf(eq.rarity) >= 0, 'rarity must be a known rarity tier');
            }
        }
    },
    {
        name: 'seeded: 2,000 equipment drops in region 8 only roll tiers configured for region 8 (T4/T5)',
        fn: function() {
            const h = createHarness({ seed: 12 });
            h.loadScripts();
            const allowedTiers = Object.keys(h.context.REGION_DROP_CONFIG[8].tiers).map(Number);
            for (let i = 0; i < 2000; i++) {
                const eq = h.context.generateEquipmentDrop(8, false, false);
                assert.ok(allowedTiers.indexOf(eq.tier) >= 0, 'region 8 drop tier ' + eq.tier + ' should be in ' + JSON.stringify(allowedTiers));
            }
        }
    },
    {
        name: 'boss drops are never below Uncommon rarity',
        fn: function() {
            const h = createHarness({ seed: 13 });
            h.loadScripts();
            const rarityOrder = h.context.RARITY_CONFIG.tiers;
            for (let i = 0; i < 500; i++) {
                const eq = h.context.generateEquipmentDrop(3, true, false);
                assert.ok(rarityOrder.indexOf(eq.rarity) >= 1, 'boss drop rarity "' + eq.rarity + '" should be >= uncommon');
            }
        }
    },
    {
        name: 'socket count matches rarity (common/uncommon=0, rare/epic=1, legendary=2)',
        fn: function() {
            const h = createHarness({ seed: 14 });
            h.loadScripts();
            const seen = {};
            for (let i = 0; i < 3000 && Object.keys(seen).length < 5; i++) {
                const eq = h.context.generateEquipmentDrop(7, false, true); // R7 has a wide tier spread, 3-star boosts rare rarities
                seen[eq.rarity] = eq.gems.length;
            }
            Object.keys(seen).forEach(function(rarity) {
                assert.equal(seen[rarity], h.context.SOCKET_CONFIG.socketsPerRarity[rarity],
                    'gem socket count for ' + rarity + ' equipment');
            });
        }
    },
    {
        name: 'affix count matches rarity (common=0, uncommon=1, rare/epic=2, legendary=3)',
        fn: function() {
            const h = createHarness({ seed: 15 });
            h.loadScripts();
            for (let i = 0; i < 2000; i++) {
                const eq = h.context.generateEquipmentDrop(6, false, false);
                assert.equal(eq.affixes.length, h.context.RARITY_CONFIG.affixCount[eq.rarity],
                    'affix count for ' + eq.rarity + ' equipment');
            }
        }
    },
    {
        name: 'enhancement costs +1..+10 match the ground-truth table and deduct VE exactly (forced success)',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.equipment.inventory.push(makeUncommonItem(h));
            sd.player.veilEssence = 1000000;

            // Force every roll to succeed (0 < any positive success rate) so
            // we can walk +0 -> +10 deterministically and check costs only.
            h.context.Math.random = function() { return 0; };

            const expectedCosts = h.context.ENHANCEMENT_CONFIG.costs;
            assert.deepEqual(expectedCosts, [20, 30, 50, 80, 120, 180, 250, 350, 500, 750], 'ENHANCEMENT_CONFIG.costs sanity check against ground truth');

            for (let level = 1; level <= 10; level++) {
                const before = sd.player.veilEssence;
                const res = h.context.enhanceEquipment(sd, 'test-item-1');
                assert.ok(res.success, 'enhancement to +' + level + ' should succeed when forced');
                assert.equal(res.level, level, 'reported level should be +' + level);
                assert.equal(before - sd.player.veilEssence, expectedCosts[level - 1], 'VE cost for +' + level);
            }

            const finalItem = sd.equipment.inventory[0];
            assert.equal(finalItem.enhanceLevel, 10, 'item should be at max enhancement (+10)');

            const capped = h.context.enhanceEquipment(sd, 'test-item-1');
            assert.equal(capped.success, false, 'enhancing beyond +10 should fail');
            assert.equal(capped.reason, 'Already at max (+10)', 'max-level rejection reason');
        }
    },
    {
        name: 'enhancement pity: a fail streak >= 3 guarantees the next attempt succeeds and resets the streak',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            const item = makeUncommonItem(h);
            item.enhanceLevel = 5;
            item.enhanceFailStreak = h.context.ENHANCEMENT_CONFIG.pityThreshold; // 3
            sd.equipment.inventory.push(item);
            sd.player.veilEssence = 1000000;

            // Force the RNG to a value that would normally fail (rate at +6 is 0.70)
            // to prove the success came from pity, not luck.
            h.context.Math.random = function() { return 0.99; };

            const res = h.context.enhanceEquipment(sd, 'test-item-1');
            assert.ok(res.success, 'pitied attempt should succeed even though the roll would otherwise fail');
            assert.ok(res.pity, 'result should flag that pity was the reason for success');
            assert.equal(item.enhanceLevel, 6, 'level should advance to +6');
            assert.equal(item.enhanceFailStreak, 0, 'fail streak should reset to 0 after a success');
        }
    },
    {
        name: 'a forced failure spends VE, increments the fail streak, and never succeeds against a guaranteed-fail roll',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            const item = makeUncommonItem(h);
            item.enhanceLevel = 5; // attempting +6, success rate 70% -> a 0.99 roll always fails
            sd.equipment.inventory.push(item);
            sd.player.veilEssence = 1000000;

            h.context.Math.random = function() { return 0.99; };

            const before = sd.player.veilEssence;
            const res = h.context.enhanceEquipment(sd, 'test-item-1');
            assert.equal(res.success, false, 'a 0.99 roll against a 70% success rate should fail');
            assert.equal(before - sd.player.veilEssence, h.context.ENHANCEMENT_CONFIG.costs[5], 'VE is spent even on failure');
            assert.equal(item.enhanceFailStreak, 1, 'fail streak should increment to 1');
        }
    },
    {
        name: 'Common items cannot be enhanced',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            const item = makeUncommonItem(h);
            item.rarity = 'common';
            sd.equipment.inventory.push(item);
            sd.player.veilEssence = 1000000;

            const res = h.context.enhanceEquipment(sd, 'test-item-1');
            assert.equal(res.success, false, 'common items should reject enhancement');
            assert.equal(res.reason, 'Cannot enhance Common items');
        }
    },
    {
        name: 'gem socketing: socketGem() fills an empty socket and removes the gem from inventory',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            const item = makeUncommonItem(h);
            item.rarity = 'rare';
            item.gems = [null]; // 1 socket, per SOCKET_CONFIG.socketsPerRarity.rare
            sd.equipment.inventory.push(item);
            sd.equipment.gems.push({ id: 'gem-1', type: 'ruby', rarity: 'standard' });

            const res = h.context.socketGem(sd, 'test-item-1', 'gem-1');
            assert.ok(res.success, 'socketing into an empty socket should succeed');
            assert.equal(item.gems[0], 'ruby_standard', 'socketed gem should be stored as "type_rarity"');
            assert.equal(sd.equipment.gems.length, 0, 'gem should be removed from the loose inventory');
        }
    },
    {
        name: 'gem socketing: socketGem() fails when there are no empty sockets',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            const item = makeUncommonItem(h);
            item.rarity = 'rare';
            item.gems = ['sapphire_standard']; // socket already filled
            sd.equipment.inventory.push(item);
            sd.equipment.gems.push({ id: 'gem-1', type: 'ruby', rarity: 'standard' });

            const res = h.context.socketGem(sd, 'test-item-1', 'gem-1');
            assert.equal(res.success, false, 'socketing into a full item should fail');
            assert.equal(res.reason, 'No empty sockets');
        }
    },
    {
        name: 'gem combining: 3 same type+rarity gems combine into 1 of the next rarity',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.player.veilEssence = 1000;
            sd.equipment.gems.push('ruby_standard', 'ruby_standard', 'ruby_standard', 'sapphire_standard');

            const res = h.context.forgeGemCombine(sd, 'ruby', 'standard');
            assert.ok(res.success, 'combining 3 matching gems should succeed');
            assert.equal(sd.equipment.gems.filter(function(g) { return g === 'ruby_standard'; }).length, 0, 'all 3 source gems consumed');
            assert.equal(sd.equipment.gems.indexOf('ruby_uncommon') >= 0, true, 'should produce 1 next-rarity gem');
            assert.equal(sd.equipment.gems.indexOf('sapphire_standard') >= 0, true, 'unrelated gem should be untouched');
        }
    },
    {
        name: 'gem combining fails with fewer than 3 matching gems',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.player.veilEssence = 1000;
            sd.equipment.gems.push('ruby_standard', 'ruby_standard');

            const res = h.context.forgeGemCombine(sd, 'ruby', 'standard');
            assert.equal(res.success, false, 'combining with only 2 gems should fail');
        }
    },
    {
        name: 'forgeOperations stat (PHASE2-AUDIT item 5): echoShapingReroll/Disassemble/Transmute and craftMythic each increment it by 1 on success',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.player.veilEssence = 1000000;
            sd.stats.forgeOperations = 0;

            // Reroll — needs an item with affixes (non-common).
            const rerollItem = makeUncommonItem(h);
            rerollItem.id = 'forge-reroll';
            sd.equipment.inventory.push(rerollItem);
            const rerollRes = h.context.echoShapingReroll(sd, 'forge-reroll');
            assert.ok(rerollRes.success, 'reroll should succeed');
            assert.equal(sd.stats.forgeOperations, 1, 'forgeOperations should be 1 after a reroll');

            // Disassemble — any unequipped item.
            const disItem = makeUncommonItem(h);
            disItem.id = 'forge-dis';
            sd.equipment.inventory.push(disItem);
            const disRes = h.context.echoShapingDisassemble(sd, 'forge-dis');
            assert.ok(disRes.success, 'disassemble should succeed');
            assert.equal(sd.stats.forgeOperations, 2, 'forgeOperations should be 2 after a disassemble');

            // Transmute — move to a different slot.
            const transItem = makeUncommonItem(h);
            transItem.id = 'forge-trans';
            sd.equipment.inventory.push(transItem);
            const transRes = h.context.echoShapingTransmute(sd, 'forge-trans', 'helm');
            assert.ok(transRes.success, 'transmute should succeed');
            assert.equal(sd.stats.forgeOperations, 3, 'forgeOperations should be 3 after a transmute');

            // Craft Mythic — needs forge level 5, a legendary base item, and the material.
            sd.buildings.echo_shaping = 5;
            const legendaryItem = { id: 'forge-legendary', slot: 'weapon', itemKey: Object.keys(h.context.ITEM_LINES).filter(function(k) { return h.context.ITEM_LINES[k].slot === 'weapon'; })[0], tier: 5, rarity: 'legendary', enhanceLevel: 0, enhanceFailStreak: 0, gems: [], affixes: [], setId: null, equipped: null };
            sd.equipment.inventory.push(legendaryItem);
            sd.equipment.mythicMaterials.void_crystal = 1;
            const craftRes = h.context.craftMythic(sd, 'forge-legendary', 'eclipse');
            assert.ok(craftRes.success, 'craftMythic should succeed with the right prerequisites — got: ' + JSON.stringify(craftRes));
            assert.equal(sd.stats.forgeOperations, 4, 'forgeOperations should be 4 after crafting a mythic');
        }
    },
    {
        name: 'master_forger achievement fires once forgeOperations reaches 100',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.player.veilEssence = 1000000;
            sd.stats.forgeOperations = 99;
            assert.equal(sd.achievements.earned.indexOf('master_forger'), -1, 'achievement should not be earned yet at 99 ops');

            const item = makeUncommonItem(h);
            item.id = 'forge-final';
            sd.equipment.inventory.push(item);
            const res = h.context.echoShapingDisassemble(sd, 'forge-final');
            assert.ok(res.success, 'the 100th forge op should succeed');
            assert.equal(sd.stats.forgeOperations, 100, 'forgeOperations should reach 100');

            const newlyEarned = h.context.checkAchievements(sd);
            assert.ok(newlyEarned.indexOf('master_forger') >= 0, 'master_forger should be newly earned at 100 forge operations');
        }
    }
];

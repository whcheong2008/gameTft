// =============================================================================
// tests/test-region-rewards.js — claimRegionReward() payout coverage
// (PHASE2-AUDIT item 6 / MASTERPLAN.md 2.4). Verifies every reward type
// REGIONS defines is actually granted: gold->VE, freeMultiRoll, randomUnit,
// essenceChoice, mythicMaterialChoice, plus double-claim protection.
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

// Marks every stage in a region (including its boss stage) as completed,
// which is all isRegionComplete()/claimRegionReward() require to unlock the claim.
function completeRegion(h, sd, regionNum) {
    const region = h.context.REGIONS[regionNum];
    if (!sd.missions.regionProgress[regionNum]) {
        sd.missions.regionProgress[regionNum] = { completed: [], bossCleared: false };
    }
    sd.missions.regionProgress[regionNum].completed = region.stageIds.slice();
    sd.missions.regionProgress[regionNum].bossCleared = true;
}

module.exports = [
    {
        name: 'claimRegionReward() region 4 (gold-only reward) credits VE and marks the region claimed',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.player.veilEssence = 0;
            completeRegion(h, sd, 4);

            const result = h.context.claimRegionReward(sd, 4);

            assert.ok(result.success, 'claim should succeed once the region is complete');
            assert.equal(sd.player.veilEssence, 750, 'region 4 reward is 750 VE');
            assert.equal(result.granted.gold, 750, 'granted.gold should report the VE amount');
            assert.ok(h.context.isRegionRewardClaimed(sd, 4), 'region should now be marked claimed');
        }
    },
    {
        name: 'claimRegionReward() region 1 (freeMultiRoll reward) grants a free 10-pull',
        fn: function() {
            const h = createHarness({ seed: 2 });
            const sd = h.freshSave();
            completeRegion(h, sd, 1);

            const result = h.context.claimRegionReward(sd, 1);

            assert.ok(result.success, 'claim should succeed');
            assert.equal(sd.player.freeMultiRolls, 1, 'region 1 grants 1 free 10-pull');
            assert.equal(result.granted.freeMultiRoll, 1, 'granted.freeMultiRoll should report the amount');
        }
    },
    {
        name: 'claimRegionReward() region 2 (randomUnit) rolls a Cost-3 unit and adds a copy to the collection',
        fn: function() {
            const h = createHarness({ seed: 3 });
            const sd = h.freshSave();
            completeRegion(h, sd, 2);

            const result = h.context.claimRegionReward(sd, 2);

            assert.ok(result.success, 'claim should succeed');
            assert.ok(result.granted.unit, 'a unit key should be granted');
            const tmpl = h.context.UNIT_TEMPLATES[result.granted.unit];
            assert.ok(tmpl, 'granted unit key should resolve to a real unit template');
            assert.equal(tmpl.cost, 3, 'region 2 reward is a Cost-3 unit');
            assert.ok(sd.collection[result.granted.unit], 'granted unit should be present in the collection');
        }
    },
    {
        name: 'claimRegionReward() region 3 (essenceChoice) requires a choice, then grants the chosen essence',
        fn: function() {
            const h = createHarness({ seed: 4 });
            const sd = h.freshSave();
            completeRegion(h, sd, 3);
            sd.equipment.essences.water = 0;

            const noChoice = h.context.claimRegionReward(sd, 3);
            assert.equal(noChoice.success, false, 'claim without a choice should be rejected');
            assert.ok(noChoice.needsEssenceChoice, 'result should flag that an essence choice is needed');
            assert.equal(h.context.isRegionRewardClaimed(sd, 3), false, 'region should NOT be marked claimed while a choice is outstanding');

            const withChoice = h.context.claimRegionReward(sd, 3, { essenceElement: 'water' });
            assert.ok(withChoice.success, 'claim with a valid choice should succeed');
            assert.equal(sd.equipment.essences.water, 1, 'chosen essence should be credited by the reward amount');
            assert.equal(withChoice.granted.essenceElement, 'water', 'granted.essenceElement should report the chosen element');
        }
    },
    {
        name: 'claimRegionReward() region 7 (mythicMaterialChoice) requires a choice, then grants the chosen material',
        fn: function() {
            const h = createHarness({ seed: 5 });
            const sd = h.freshSave();
            completeRegion(h, sd, 7);
            sd.equipment.mythicMaterials.void_crystal = 0;

            const noChoice = h.context.claimRegionReward(sd, 7);
            assert.equal(noChoice.success, false, 'claim without a choice should be rejected');
            assert.ok(noChoice.needsMythicChoice, 'result should flag that a mythic material choice is needed');

            const withChoice = h.context.claimRegionReward(sd, 7, { mythicMaterial: 'void_crystal' });
            assert.ok(withChoice.success, 'claim with a valid choice should succeed');
            assert.equal(sd.equipment.mythicMaterials.void_crystal, 1, 'chosen material should be credited by the reward amount');
            assert.equal(withChoice.granted.mythicMaterial, 'void_crystal', 'granted.mythicMaterial should report the chosen material');
        }
    },
    {
        name: 'claimRegionReward() region 8 (randomUnit + gold + mythicMaterialChoice combined) grants every component in one claim',
        fn: function() {
            const h = createHarness({ seed: 6 });
            const sd = h.freshSave();
            sd.player.veilEssence = 0;
            completeRegion(h, sd, 8);

            const result = h.context.claimRegionReward(sd, 8, { mythicMaterial: 'world_shard' });

            assert.ok(result.success, 'claim should succeed with the required choice supplied');
            assert.equal(sd.player.veilEssence, 2000, 'region 8 grants 2,000 VE');
            assert.ok(result.granted.unit, 'region 8 should also grant a random unit');
            const tmpl = h.context.UNIT_TEMPLATES[result.granted.unit];
            assert.equal(tmpl.cost, 5, 'region 8 unit reward is Cost-5');
            assert.equal(sd.equipment.mythicMaterials.world_shard, 1, 'chosen mythic material should be credited');
        }
    },
    {
        name: 'claimRegionReward() blocks double-claiming a region',
        fn: function() {
            const h = createHarness({ seed: 7 });
            const sd = h.freshSave();
            completeRegion(h, sd, 4);

            const first = h.context.claimRegionReward(sd, 4);
            assert.ok(first.success, 'first claim should succeed');

            const second = h.context.claimRegionReward(sd, 4);
            assert.equal(second.success, false, 'second claim on the same region should be rejected');
            assert.equal(second.reason, 'Already claimed', 'rejection reason should say already claimed');
        }
    },
    {
        name: 'claimRegionReward() rejects claiming an incomplete region',
        fn: function() {
            const h = createHarness({ seed: 8 });
            const sd = h.freshSave();
            // Region 5 left untouched — not complete.
            const result = h.context.claimRegionReward(sd, 5);
            assert.equal(result.success, false, 'claim on an incomplete region should be rejected');
            assert.equal(result.reason, 'Region not complete', 'rejection reason should say region not complete');
        }
    }
];

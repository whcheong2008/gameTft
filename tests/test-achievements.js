// =============================================================================
// tests/test-achievements.js — non-combat achievement stat wiring (PHASE2-AUDIT
// item 5 / MASTERPLAN.md 2.5). Covers uniqueBondsUsed (wired on team deploy in
// js/teams.js) and confirms checkAchievements() picks it up via the existing
// catch-all call sites. forgeOperations coverage lives in tests/test-items.js
// alongside the forge functions it instruments.
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

// Gives a save a collection entry + puts the unit on the active team's board
// at the next free slot, mirroring what the team builder does before deploy.
function deployPair(h, sd, unitKeyA, unitKeyB, rowBase) {
    sd.collection[unitKeyA] = { stars: 1, copiesForNext: 0 };
    sd.collection[unitKeyB] = { stars: 1, copiesForNext: 0 };
    const team = h.context.getActiveTeam(sd);
    team.slots = [
        { key: unitKeyA, row: rowBase, col: 0 },
        { key: unitKeyB, row: rowBase, col: 1 }
    ];
    return h.context.deployTeam(sd);
}

module.exports = [
    {
        name: 'uniqueBondsUsed stat (PHASE2-AUDIT item 5): deployTeam() records a newly-triggered duo bond',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.stats.uniqueBondsUsed = 0;
            sd.stats.bondsUsedSeen = [];

            deployPair(h, sd, 'flame_warrior', 'pyromancer', 0); // fire_duo

            assert.equal(sd.stats.uniqueBondsUsed, 1, 'uniqueBondsUsed should be 1 after triggering fire_duo');
            assert.ok(sd.stats.bondsUsedSeen.indexOf('fire_duo') >= 0, 'fire_duo should be recorded as seen');
        }
    },
    {
        name: 'uniqueBondsUsed stat: re-deploying the SAME bond does not double-count it',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.stats.uniqueBondsUsed = 0;
            sd.stats.bondsUsedSeen = [];

            deployPair(h, sd, 'flame_warrior', 'pyromancer', 0); // fire_duo
            deployPair(h, sd, 'flame_warrior', 'pyromancer', 0); // fire_duo again

            assert.equal(sd.stats.uniqueBondsUsed, 1, 'redeploying the same bond should still count as 1 distinct bond');
        }
    },
    {
        name: 'bond_collector achievement fires once 5 distinct bonds have been triggered across deploys',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.stats.uniqueBondsUsed = 0;
            sd.stats.bondsUsedSeen = [];
            assert.equal(sd.achievements.earned.indexOf('bond_collector'), -1, 'should not be earned at 0 bonds');

            deployPair(h, sd, 'flame_warrior', 'pyromancer', 0);   // fire_duo    -> 1
            deployPair(h, sd, 'frost_archer', 'tidal_shaman', 0);  // water_duo   -> 2
            deployPair(h, sd, 'stone_guard', 'golem', 0);          // earth_duo   -> 3
            deployPair(h, sd, 'zephyr_scout', 'wind_duelist', 0);  // wind_duo    -> 4
            let newlyEarned = h.context.checkAchievements(sd);
            assert.equal(newlyEarned.indexOf('bond_collector'), -1, 'should not fire yet at 4 distinct bonds');

            deployPair(h, sd, 'spark_fencer', 'thunder_archer', 0); // lightning_duo -> 5
            assert.equal(sd.stats.uniqueBondsUsed, 5, 'uniqueBondsUsed should reach 5');

            newlyEarned = h.context.checkAchievements(sd);
            assert.ok(newlyEarned.indexOf('bond_collector') >= 0, 'bond_collector should be newly earned at 5 distinct bonds');
        }
    }
];

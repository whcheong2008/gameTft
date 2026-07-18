// =============================================================================
// tests/test-gacha.js — gacha tier distribution + pity + VE spend (GROUND-TRUTH.md §10).
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

const ROLLS = 10000;
const TOLERANCE_PCT = 2; // ±2 percentage points, per spec

function rollNTimes(h, sd, n, suppressPity) {
    const tierCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let pityTriggers = 0;
    for (let i = 0; i < n; i++) {
        // The bulk distribution tests isolate the natural TIER_WEIGHTS curve
        // from the pity mechanic (tested separately below): over 10,000 rolls
        // the base 1-in-50 pity would otherwise force ~200 extra T5 results,
        // which is itself a testable effect but would corrupt the raw
        // distribution assertion (and, at level 1 where T5's natural weight
        // is 0%, would sit right at the ±2% tolerance boundary and flake).
        if (suppressPity) sd.stats.rollsSincePity = 0;
        const res = h.context.doSingleRoll(sd);
        assert.ok(res.success, 'roll #' + i + ' should succeed while VE is available');
        assert.ok(sd.player.veilEssence >= 0, 'VE must never go negative (roll #' + i + ')');
        const tmpl = res.unitTemplate;
        assert.ok(tmpl, 'roll should return a resolvable unit template');
        // Evolved copies (from the 15% evolved-swap mechanic) resolve through
        // EVOLVED_TEMPLATES, which uses `baseCost` instead of `cost` — the
        // evolution never changes the unit's cost tier, so either field maps
        // straight onto the same [1..5] tier distribution being asserted here.
        const cost = tmpl.cost || tmpl.baseCost;
        tierCounts[cost] = (tierCounts[cost] || 0) + 1;
        if (res.pityTriggered) pityTriggers++;
    }
    return { tierCounts: tierCounts, pityTriggers: pityTriggers };
}

module.exports = [
    {
        name: 'seeded: 10,000 rolls at level 1 match TIER_WEIGHTS[1] within ±2%, no T3/T4/T5',
        fn: function() {
            const h = createHarness({ seed: 42 });
            const sd = h.freshSave();
            sd.player.level = 1;
            sd.player.veilEssence = ROLLS * h.context.ROLL_COST + 1000;

            const { tierCounts } = rollNTimes(h, sd, ROLLS, true);

            const expected = h.context.getTierWeights(1); // [75,25,0,0,0]
            for (let tier = 1; tier <= 5; tier++) {
                const actualPct = (tierCounts[tier] || 0) / ROLLS * 100;
                assert.inRange(actualPct, expected[tier - 1] - TOLERANCE_PCT, expected[tier - 1] + TOLERANCE_PCT,
                    'tier ' + tier + ' distribution at level 1 (got ' + actualPct.toFixed(2) + '%, expected ~' + expected[tier - 1] + '%)');
            }
            assert.equal(tierCounts[3], 0, 'no T3 units should drop at level 1');
            assert.equal(tierCounts[4], 0, 'no T4 units should drop at level 1');
            assert.equal(tierCounts[5], 0, 'no T5 units should drop at level 1');
        }
    },
    {
        name: 'seeded: 10,000 rolls at level 20 match TIER_WEIGHTS[20] within ±2%, T5 present',
        fn: function() {
            const h = createHarness({ seed: 43 });
            const sd = h.freshSave();
            sd.player.level = 20;
            sd.player.veilEssence = ROLLS * h.context.ROLL_COST + 1000;

            const { tierCounts } = rollNTimes(h, sd, ROLLS, true);

            const expected = h.context.getTierWeights(20); // [8,10,22,50,10]
            for (let tier = 1; tier <= 5; tier++) {
                const actualPct = (tierCounts[tier] || 0) / ROLLS * 100;
                assert.inRange(actualPct, expected[tier - 1] - TOLERANCE_PCT, expected[tier - 1] + TOLERANCE_PCT,
                    'tier ' + tier + ' distribution at level 20 (got ' + actualPct.toFixed(2) + '%, expected ~' + expected[tier - 1] + '%)');
            }
            assert.ok(tierCounts[5] > 0, 'T5 units should appear at level 20');
        }
    },
    {
        name: 'pity counter increments without triggering before threshold (49 rolls, no T5 forced)',
        fn: function() {
            const h = createHarness({ seed: 7 });
            const sd = h.freshSave();
            sd.player.level = 1; // T5 impossible to roll naturally at level 1 -> isolates pity logic
            sd.player.veilEssence = 100000;
            sd.stats.rollsSincePity = 0;

            for (let i = 0; i < 49; i++) {
                h.context.doSingleRoll(sd);
            }
            assert.equal(sd.stats.rollsSincePity, 49, 'rollsSincePity should be 49 after 49 rolls with no pity trigger');
        }
    },
    {
        name: 'base pity triggers a guaranteed T5 on the 50th roll and resets the counter',
        fn: function() {
            const h = createHarness({ seed: 7 });
            const sd = h.freshSave();
            sd.player.level = 1; // level 1 has 0% natural T5 weight -> any T5 must come from pity
            sd.player.veilEssence = 100000;
            sd.stats.rollsSincePity = 0;

            let last;
            for (let i = 0; i < 50; i++) {
                last = h.context.doSingleRoll(sd);
            }
            assert.equal(sd.stats.rollsSincePity, 0, 'rollsSincePity should reset to 0 after pity triggers');
            assert.ok(last.pityTriggered, '50th roll should be flagged as pity-triggered');
            const tmpl = last.unitTemplate;
            assert.equal(tmpl.cost, 5, '50-roll base pity should guarantee a T5 unit even at level 1 (0% natural T5 weight)');
        }
    },
    {
        name: 'VE is deducted per roll and doSingleRoll fails cleanly once VE is insufficient',
        fn: function() {
            const h = createHarness({ seed: 9 });
            const sd = h.freshSave();
            sd.player.level = 5;
            sd.player.veilEssence = h.context.ROLL_COST; // exactly one roll's worth

            const before = sd.player.veilEssence;
            const res1 = h.context.doSingleRoll(sd);
            assert.ok(res1.success, 'roll should succeed with exactly enough VE');
            assert.equal(sd.player.veilEssence, before - h.context.ROLL_COST, 'VE should be deducted by ROLL_COST');
            assert.equal(sd.player.veilEssence, 0, 'VE should be exactly 0 after spending it all');

            const res2 = h.context.doSingleRoll(sd);
            assert.equal(res2.success, false, 'roll should fail with insufficient VE');
            assert.equal(sd.player.veilEssence, 0, 'VE must never go negative on a failed roll');
        }
    }
];

// =============================================================================
// tests/test-starup.js — tiered star-up copy costs + stat scaling (GROUND-TRUTH.md §4).
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

// Ground-truth tiered copy costs per star (getCopiesPerStar() is authoritative
// per GROUND-TRUTH.md — "Some UI code still references 10 copies per star").
const EXPECTED_COPIES_PER_STAR = { 1: 3, 2: 4, 3: 5, 4: 8, 5: 10 };

// Ground-truth star multiplier table: stat = floor(baseStat * 1.8^(stars-1))
const EXPECTED_MULTIPLIERS = { 1: 1.00, 2: 1.80, 3: 3.24, 4: 5.832, 5: 10.4976 };

function firstUnitKeyOfCostTier(h, tier) {
    const keys = Object.keys(h.context.UNIT_TEMPLATES);
    for (let i = 0; i < keys.length; i++) {
        if (h.context.UNIT_TEMPLATES[keys[i]].cost === tier) return keys[i];
    }
    return null;
}

module.exports = [
    {
        name: 'getCopiesPerStar() matches the tiered table (T1=3, T2=4, T3=5, T4=8, T5=10)',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            Object.keys(EXPECTED_COPIES_PER_STAR).forEach(function(tier) {
                const key = firstUnitKeyOfCostTier(h, Number(tier));
                assert.ok(key, 'should find a unit at cost tier ' + tier);
                assert.equal(h.context.getCopiesPerStar(key), EXPECTED_COPIES_PER_STAR[tier],
                    'copies-per-star for cost tier ' + tier);
            });
        }
    },
    {
        name: 'getStarMultiplier() matches 1.8^(stars-1) for stars 1-5',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            Object.keys(EXPECTED_MULTIPLIERS).forEach(function(stars) {
                assert.close(h.context.getStarMultiplier(Number(stars)), EXPECTED_MULTIPLIERS[stars], 1e-6,
                    'star multiplier for ' + stars + '★');
            });
        }
    },
    {
        name: 'starUpUnit() consumes exactly getCopiesPerStar() copies and increments stars by 1',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            const key = 'flame_warrior'; // T1 -> 3 copies/star
            sd.collection[key] = { stars: 1, copiesForNext: 3 };

            assert.ok(h.context.canStarUp(sd, key), 'should be able to star up with exactly enough banked copies');
            const ok = h.context.starUpUnit(sd, key);
            assert.ok(ok, 'starUpUnit should succeed');
            assert.equal(sd.collection[key].stars, 2, 'stars should increment to 2');
            assert.equal(sd.collection[key].copiesForNext, 0, 'copiesForNext should be fully consumed (3 - 3 = 0)');
        }
    },
    {
        name: 'starUpUnit() fails and leaves state unchanged when short of the required copies',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            const key = 'magma_knight'; // T2 -> 4 copies/star
            sd.collection[key] = { stars: 1, copiesForNext: 3 };

            assert.equal(h.context.canStarUp(sd, key), false, 'should not be able to star up 1 copy short');
            const ok = h.context.starUpUnit(sd, key);
            assert.equal(ok, false, 'starUpUnit should fail');
            assert.equal(sd.collection[key].stars, 1, 'stars should remain unchanged on failure');
            assert.equal(sd.collection[key].copiesForNext, 3, 'copiesForNext should remain unchanged on failure');
        }
    },
    {
        name: 'starUpUnit() banks leftover copies beyond the threshold (does not floor to 0)',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            const key = 'flame_warrior'; // T1 -> 3 copies/star
            sd.collection[key] = { stars: 1, copiesForNext: 5 };

            h.context.starUpUnit(sd, key);
            assert.equal(sd.collection[key].stars, 2, 'stars should increment');
            assert.equal(sd.collection[key].copiesForNext, 2, 'leftover copies (5 - 3 = 2) should be banked toward the next star');
        }
    },
    {
        name: 'createUnit() combat stats scale only HP and ATK by the star multiplier (attackSpd/range/moveSpd untouched)',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const key = 'flame_warrior';
            const tmpl = h.context.UNIT_TEMPLATES[key];

            const u1 = h.context.createUnit(key, 1);
            const u3 = h.context.createUnit(key, 3);

            assert.equal(u1.hp, tmpl.hp, '1★ HP should equal base HP (1.0x multiplier)');
            assert.equal(u1.attack, tmpl.attack, '1★ ATK should equal base ATK');

            const mult3 = h.context.getStarMultiplier(3);
            assert.equal(u3.hp, Math.floor(tmpl.hp * mult3), '3★ HP should be floor(baseHP * 1.8^2)');
            assert.equal(u3.attack, Math.floor(tmpl.attack * mult3), '3★ ATK should be floor(baseATK * 1.8^2)');

            assert.equal(u3.attackSpd, tmpl.attackSpd, 'attackSpd must NOT scale with stars');
            assert.equal(u3.range, tmpl.range, 'range must NOT scale with stars');
            assert.equal(u3.moveSpd, tmpl.moveSpd, 'moveSpd must NOT scale with stars');
        }
    },
    {
        name: 'Echo Release (sell) VE values match the tiered table (T1=5 ... T5=100)',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const expected = { 1: 5, 2: 10, 3: 20, 4: 50, 5: 100 };
            Object.keys(expected).forEach(function(tier) {
                const key = firstUnitKeyOfCostTier(h, Number(tier));
                assert.equal(h.context.getEchoReleaseValue(key), expected[tier], 'echo release value for T' + tier);
            });
        }
    }
];

// =============================================================================
// tests/test-synergies.js — element (2/4/7/10) + archetype (2/4/6/8) synergy
// thresholds, evolved-T5-doubling, one-family-one-slot, and ascension-based
// archetype counting (GROUND-TRUTH.md §2, §3).
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

function emptyBoard() {
    const board = [];
    for (let r = 0; r < 4; r++) {
        board[r] = [null, null, null, null, null, null, null];
    }
    return board;
}

module.exports = [
    {
        name: 'Fire element synergy: tier bonuses activate at exactly 2/4/7/10 stacks (GROUND-TRUTH.md §2)',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const expectedBurnDps = { 2: 10, 4: 20, 7: 35 }; // tier4 (10-stack) replaces flat burnDps with combatStartBurn, not asserted here
            [2, 4, 7].forEach(function(count) {
                const unit = h.context.createUnit('flame_warrior', 1);
                const cs = { activeElements: { fire: count }, playerUnits: [unit], enemyUnits: [] };
                h.context.applyElementBonuses(cs);
                assert.equal(unit.burnDps, expectedBurnDps[count], 'fire burnDps at ' + count + ' stacks');
            });
        }
    },
    {
        name: 'Fire element synergy: one below each threshold does NOT activate that tier',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            [1, 3, 6, 9].forEach(function(count) {
                const unit = h.context.createUnit('flame_warrior', 1);
                const cs = { activeElements: { fire: count }, playerUnits: [unit], enemyUnits: [] };
                h.context.applyElementBonuses(cs);
                const expectedTierIndex = count >= 10 ? 3 : count >= 7 ? 2 : count >= 4 ? 1 : count >= 2 ? 0 : -1;
                if (expectedTierIndex < 0) {
                    assert.equal(unit.burnDps, undefined, count + ' stacks should not reach even tier 1 (needs 2)');
                }
            });
            // Explicitly: 3 stacks should still be tier-1 (burnDps 10), not tier-2 (20)
            const unit3 = h.context.createUnit('flame_warrior', 1);
            h.context.applyElementBonuses({ activeElements: { fire: 3 }, playerUnits: [unit3], enemyUnits: [] });
            assert.equal(unit3.burnDps, 10, '3 stacks should stay at tier 1 (10 dps), not jump to tier 2');
        }
    },
    {
        name: 'Water element synergy: tier 1 slows enemy attack speed by 15%',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const player = h.context.createUnit('tide_hunter', 1);
            const enemy = h.context.createUnit('flame_warrior', 1);
            const baseAtkSpd = enemy.attackSpd;
            const cs = { activeElements: { water: 2 }, playerUnits: [player], enemyUnits: [enemy] };
            h.context.applyElementBonuses(cs);
            assert.close(enemy.attackSpd, baseAtkSpd * 1.15, 1e-6, 'enemy attackSpd should increase by 15% (higher attackSpd number = slower cooldown recovery in this engine)');
        }
    },
    {
        name: 'Guardian archetype synergy: tier bonuses activate at exactly 2/4/6/8 stacks (GROUND-TRUTH.md §3)',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const tmpl = h.context.UNIT_TEMPLATES.stone_guard;
            const expectedHpBonus = { 2: 250, 4: 550, 6: 900, 8: 1300 };
            const expectedDR = { 2: 0.05, 4: 0.10, 6: 0.15, 8: 0.20 };
            [2, 4, 6, 8].forEach(function(count) {
                const unit = h.context.createUnit('stone_guard', 1);
                const startMaxHp = unit.maxHp;
                h.context.applySynergyBonuses([unit], { guardian: count });
                assert.equal(unit.maxHp - startMaxHp, expectedHpBonus[count], 'guardian HP bonus at ' + count + ' stacks');
                assert.close(unit.damageReduction, expectedDR[count], 1e-9, 'guardian DR bonus at ' + count + ' stacks');
            });
        }
    },
    {
        name: 'Guardian archetype synergy: 1 below each threshold does not activate that tier',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const unit = h.context.createUnit('stone_guard', 1);
            const startMaxHp = unit.maxHp;
            h.context.applySynergyBonuses([unit], { guardian: 1 });
            assert.equal(unit.maxHp, startMaxHp, '1 guardian should not reach the 2-stack threshold');
            assert.ok(!unit.damageReduction, '1 guardian should not reach the 2-stack threshold');
        }
    },
    {
        name: 'evolved T5 units count as 2 for element synergy (GROUND-TRUTH.md §2 note)',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const board = emptyBoard();
            // phoenix is a T5 fire unit; its evolved form (eternal_phoenix) should
            // count as 2 toward fire element synergy per the evolved-T5 rule.
            const evolvedT5 = h.context.createUnit('eternal_phoenix', 1);
            board[0][0] = evolvedT5;
            const gs = { board: board };
            h.context.updateActiveSynergies(gs);
            assert.equal(gs.activeElements.fire, 2, 'a single evolved T5 fire unit should count as 2 toward fire element synergy');
        }
    },
    {
        name: 'a non-evolved T5 unit counts as only 1 for element synergy (evolved-T5 rule requires BOTH cost=5 AND evolved)',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const board = emptyBoard();
            const baseT5 = h.context.createUnit('phoenix', 1); // T5, not evolved
            board[0][0] = baseT5;
            const gs = { board: board };
            h.context.updateActiveSynergies(gs);
            assert.equal(gs.activeElements.fire, 1, 'a non-evolved T5 unit should count as only 1');
        }
    },
    {
        name: 'one-family-one-slot: adding an evolved unit to the team removes its base form (and vice versa)',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.collection.fire_berserker = { stars: 1, copiesForNext: 0 }; // evolved form of flame_warrior
            const team = h.context.getActiveTeam(sd);
            team.slots = [{ key: 'flame_warrior', row: 0, col: 0 }];

            const res = h.context.addToTeam(sd, 'fire_berserker', 0, 1);
            assert.ok(res.success, 'adding the evolved form should succeed');
            assert.equal(team.slots.length, 1, 'the base form should be evicted, keeping team size at 1');
            assert.equal(team.slots[0].key, 'fire_berserker', 'only the evolved form should remain');
        }
    },
    {
        // BUGS.md #4 (fixed by Prompt 60): real in-combat archetype counting
        // must be ascension-aware, matching the UI preview paths. A
        // Transcendent unit's primary archetype counts as 2; an Awakened+
        // unit's secondary archetype also counts toward its threshold.
        name: 'real in-combat archetype counting is ascension-aware (Transcendent double-count, ascended secondary archetype)',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();

            const board = emptyBoard();
            const unit = h.context.createUnit('stone_guard', 1); // primary: guardian, secondary: vanguard
            unit.ascensionTier = 'transcendent';
            board[0][0] = unit;
            const gs = { board: board };
            h.context.updateActiveSynergies(gs);

            assert.equal(gs.activeSynergies.guardian || 0, 2,
                'a Transcendent unit\'s primary archetype (guardian) should count as 2 in real combat, ' +
                'matching getUnitArchetypeContribution() and the UI preview paths (ui-builder.js, ui-combat.js, teams.js)');
            assert.equal(gs.activeSynergies.vanguard || 0, 1,
                'an Awakened+ unit\'s secondary archetype (vanguard) should also count toward its own threshold');
        }
    }
];

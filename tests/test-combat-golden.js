// =============================================================================
// tests/test-combat-golden.js — 3 seeded combat scenarios run to completion via
// runCombat() (uiStartStoryMission -> startWaveCombat -> pump combatTick).
//
// Golden values (result, tick count, survivor count) are generated on first
// run and committed to tests/golden/*.json. Every subsequent run must match
// exactly — any drift means combat is no longer deterministic under seed, or
// something in the combat/damage/synergy pipeline changed behavior.
// =============================================================================

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('./assert');
const { createHarness } = require('./harness');

const GOLDEN_DIR = path.join(__dirname, 'golden');
if (!fs.existsSync(GOLDEN_DIR)) fs.mkdirSync(GOLDEN_DIR, { recursive: true });

function goldenPath(name) {
    return path.join(GOLDEN_DIR, name + '.json');
}

function stageIndexById(h, id) {
    const idx = h.context.STAGES.findIndex(function(s) { return s.id === id; });
    if (idx < 0) throw new Error('stage id not found: ' + id);
    return idx;
}

// Runs a scenario twice within the SAME test invocation (not just across
// separate `node tests/run.js` invocations) to catch any non-determinism
// immediately, then checks the result against the committed golden file.
function runGoldenScenario(name, seed, teamSetup, stageId) {
    const h1 = createHarness({ seed: seed });
    h1.loadScripts();
    const stageIndex = stageIndexById(h1, stageId);
    const run1 = h1.runCombat(teamSetup, stageIndex);

    const h2 = createHarness({ seed: seed });
    h2.loadScripts();
    const run2 = h2.runCombat(teamSetup, stageIndex);

    const summary1 = { result: run1.result, ticks: run1.ticks, survivors: run1.survivors };
    const summary2 = { result: run2.result, ticks: run2.ticks, survivors: run2.survivors };

    assert.deepEqual(summary1, summary2, 'scenario "' + name + '" must be deterministic: two runs with seed ' + seed + ' produced different outcomes');

    const file = goldenPath(name);
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify(summary1, null, 2) + '\n');
        // First run on this machine: golden just created, nothing to diff against yet.
        return summary1;
    }

    const golden = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.deepEqual(summary1, golden, 'scenario "' + name + '" result should exactly match the committed golden file ' + path.relative(process.cwd(), file));
    return summary1;
}

module.exports = [
    {
        name: 'golden: T1 duo vs stage 1 (r1_s1) is deterministic and matches committed golden',
        fn: function() {
            const team = [
                { key: 'flame_warrior', row: 0, col: 2 },
                { key: 'stone_guard', row: 0, col: 4 }
            ];
            const summary = runGoldenScenario('t1-duo-vs-r1-s1', 101, team, 'r1_s1');
            assert.ok(['win', 'loss', 'draw'].indexOf(summary.result) >= 0, 'result should be a valid combat outcome');
            assert.ok(summary.ticks > 0, 'combat should run for at least 1 tick');
        }
    },
    {
        name: 'golden: mixed 5-unit 3-star team vs mid-stage (r2_s5) is deterministic and matches committed golden',
        fn: function() {
            const team = [
                { key: 'flame_warrior', row: 0, col: 0, stars: 3 },
                { key: 'stone_guard', row: 0, col: 2, stars: 3 },
                { key: 'frost_archer', row: 0, col: 4, stars: 3 },
                { key: 'pulse_mender', row: 0, col: 6, stars: 3 },
                { key: 'wind_squire', row: 0, col: 3, stars: 3 }
            ];
            const summary = runGoldenScenario('mixed5-3star-vs-r2-s5', 202, team, 'r2_s5');
            assert.ok(['win', 'loss', 'draw'].indexOf(summary.result) >= 0, 'result should be a valid combat outcome');
            assert.ok(summary.ticks > 0, 'combat should run for at least 1 tick');
        }
    },
    {
        name: 'golden: 5-unit 3-star team vs boss stage (r1_boss) is deterministic and matches committed golden',
        fn: function() {
            const team = [
                { key: 'flame_warrior', row: 0, col: 0, stars: 3 },
                { key: 'stone_guard', row: 0, col: 2, stars: 3 },
                { key: 'frost_archer', row: 0, col: 4, stars: 3 },
                { key: 'pulse_mender', row: 0, col: 6, stars: 3 },
                { key: 'wind_squire', row: 0, col: 3, stars: 3 }
            ];
            const summary = runGoldenScenario('5unit-3star-vs-r1-boss', 303, team, 'r1_boss');
            assert.ok(['win', 'loss', 'draw'].indexOf(summary.result) >= 0, 'result should be a valid combat outcome');
            assert.ok(summary.ticks > 0, 'combat should run for at least 1 tick');
        }
    },
    {
        name: 'combat timeout: normal (non-boss) missions draw after the 60s time limit is exceeded',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const sd = h.freshSave();
            // Two immortal-ish stalemate units (0 attack) can never resolve a fight
            // -> should hit the 60s normal-combat timeout and draw.
            const p = h.context.createUnit('stone_guard', 1);
            p.attack = 0;
            const e = h.context.createUnit('stone_guard', 1);
            e.attack = 0;
            // Enemy units are normally positioned by placeEnemiesOnBoard() before
            // initCombat() runs; replicate that here since we're driving initCombat
            // directly rather than through the full startWaveCombat() flow.
            e.gridRow = 3;
            e.gridCol = 0;
            const gs = { board: [[p, null, null, null, null, null, null], [null, null, null, null, null, null, null], [null, null, null, null, null, null, null], [null, null, null, null, null, null, null]], enemies: [e], phase: 'combat', activeSynergies: {}, activeElements: {} };
            h.context.initCombat(gs);
            let ticks = 0;
            while (h.context.combatState.running && ticks < 5000) {
                h.context.combatTick(0.05);
                ticks++;
            }
            assert.equal(h.context.combatState.result, 'draw', 'a fight neither side can win should time out to a draw');
            assert.ok(h.context.combatState.elapsed > 60, 'elapsed time should exceed the 60s normal-combat limit');
        }
    }
];

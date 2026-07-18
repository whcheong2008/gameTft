// =============================================================================
// tests/test-builder-state.js — Prompt 71 (Phase 3.5): team builder / wave-
// reposition state mutation, headless.
//
// The Pixi builder arena and wave-transition reposition mode (js/ui-builder.js,
// js/render-pixi.js's pixiEnterRepositionMode) are pure presentation/click-
// routing on top of the SAME mutation functions this file drives directly:
//   - team builder placement/move/swap/unbench -> teams.js's
//     addToTeam/moveOnTeam/removeFromTeam (exactly what js/ui-builder.js's
//     builderOnCellClick/builderOnBenchChipClick call)
//   - wave-transition reposition -> js/ui-combat.js's onWaveRepositionClick,
//     which mutates combatBoard + unit.gridRow/gridCol directly (no Pixi/DOM
//     needed to observe the effect)
// This file never touches PIXI/canvas -- it asserts against saveData/team
// state and combatBoard/gridRow, the same data the renderer only ever reads.
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

module.exports = [
    // ---------------------------------------------------------------
    {
        name: 'builder state: addToTeam places a unit at the given slot',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.collection.flame_warrior = { stars: 1, copiesForNext: 0 };

            const result = h.context.addToTeam(sd, 'flame_warrior', 0, 2);
            assert.ok(result.success, 'placing a collected unit onto an empty slot should succeed');

            const team = h.context.getActiveTeam(sd);
            assert.equal(team.slots.length, 1, 'team should have exactly 1 slot after placement');
            assert.equal(team.slots[0].key, 'flame_warrior', 'the placed unit should be flame_warrior');
            assert.equal(team.slots[0].row, 0, 'placed at row 0');
            assert.equal(team.slots[0].col, 2, 'placed at col 2');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'builder state: moveOnTeam moves a placed unit to an empty cell',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.collection.flame_warrior = { stars: 1, copiesForNext: 0 };
            const team = h.context.getActiveTeam(sd);
            team.slots = [{ key: 'flame_warrior', row: 1, col: 3 }];

            const moved = h.context.moveOnTeam(sd, 'flame_warrior', 2, 5);
            assert.ok(moved, 'moveOnTeam should report success moving to an empty cell');
            assert.equal(team.slots[0].row, 2, 'row should update to 2');
            assert.equal(team.slots[0].col, 5, 'col should update to 5');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'builder state: moveOnTeam swaps two placed units when the target cell is occupied',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.collection.flame_warrior = { stars: 1, copiesForNext: 0 };
            sd.collection.stone_guard = { stars: 1, copiesForNext: 0 };
            const team = h.context.getActiveTeam(sd);
            team.slots = [
                { key: 'flame_warrior', row: 0, col: 0 },
                { key: 'stone_guard', row: 1, col: 1 }
            ];

            // This is exactly what js/ui-builder.js's builderOnCellClick does
            // when a held token is dropped onto another placed token: call
            // moveOnTeam(heldKey, targetRow, targetCol).
            const swapped = h.context.moveOnTeam(sd, 'flame_warrior', 1, 1);
            assert.ok(swapped, 'moveOnTeam should report success swapping into an occupied cell');

            const fw = team.slots.filter(function(s) { return s.key === 'flame_warrior'; })[0];
            const sg = team.slots.filter(function(s) { return s.key === 'stone_guard'; })[0];
            assert.equal(fw.row, 1, 'flame_warrior should take stone_guard\'s old row');
            assert.equal(fw.col, 1, 'flame_warrior should take stone_guard\'s old col');
            assert.equal(sg.row, 0, 'stone_guard should take flame_warrior\'s old row');
            assert.equal(sg.col, 0, 'stone_guard should take flame_warrior\'s old col');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'builder state: removeFromTeam unbenches a placed unit',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.collection.flame_warrior = { stars: 1, copiesForNext: 0 };
            const team = h.context.getActiveTeam(sd);
            team.slots = [{ key: 'flame_warrior', row: 0, col: 0 }];

            const removed = h.context.removeFromTeam(sd, 'flame_warrior');
            assert.ok(removed, 'removeFromTeam should report success');
            assert.equal(team.slots.length, 0, 'team should be empty after unbenching its only unit');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'builder state: addToTeam enforces the team-size cap',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave(); // fresh level-1 save -> getMaxTeamSize() === 3
            const keys = ['flame_warrior', 'stone_guard', 'frost_archer', 'tide_hunter'];
            keys.forEach(function(k) { sd.collection[k] = { stars: 1, copiesForNext: 0 }; });

            assert.equal(h.context.getMaxTeamSize(sd), 3, 'sanity check: fresh level-1 save should cap the team at 3 slots');

            for (let i = 0; i < 3; i++) {
                const r = h.context.addToTeam(sd, keys[i], 0, i);
                assert.ok(r.success, 'slot ' + i + ' should place successfully (under the cap)');
            }
            const over = h.context.addToTeam(sd, keys[3], 0, 3);
            assert.equal(over.success, false, 'a 4th placement should fail once the team is at its 3-slot cap');

            const team = h.context.getActiveTeam(sd);
            assert.equal(team.slots.length, 3, 'team should stay at exactly 3 slots after the rejected placement');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'builder state: addToTeam enforces one-family-one-slot (evolved form evicts its base form)',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.collection.flame_warrior = { stars: 1, copiesForNext: 0 };
            sd.collection.fire_berserker = { stars: 1, copiesForNext: 0 }; // evolved form of flame_warrior
            const team = h.context.getActiveTeam(sd);
            team.slots = [{ key: 'flame_warrior', row: 0, col: 0 }];

            const res = h.context.addToTeam(sd, 'fire_berserker', 0, 1);
            assert.ok(res.success, 'placing the evolved form should succeed');
            assert.equal(team.slots.length, 1, 'the base form should be evicted (family conflict), team size stays 1');
            assert.equal(team.slots[0].key, 'fire_berserker', 'only the evolved form should remain on the team');
        }
    },

    // ---------------------------------------------------------------
    // Task 2: wave-transition reposition. Exercises js/ui-combat.js's
    // onWaveRepositionClick() exactly as js/render-pixi.js's arena click
    // routing calls it (COMBAT grid coordinates 4-7, matching unit.gridRow),
    // and confirms the mutation is carried by combatBoard (not just a
    // transient gridRow) into the NEXT wave's initCombat() -- "reposition
    // mutations preserved across waves headlessly" per the spec.
    // ---------------------------------------------------------------
    {
        name: 'wave reposition: onWaveRepositionClick swaps two units via combatBoard + gridRow, headlessly',
        fn: function() {
            const h = createHarness({ seed: 21 });
            h.loadScripts();
            h.freshSave();

            const uA = h.context.createUnit('flame_warrior', 1);
            const uB = h.context.createUnit('stone_guard', 1);
            uA.gridRow = 4; uA.gridCol = 0;
            uB.gridRow = 4; uB.gridCol = 1;

            const board = [
                [uA, uB, null, null, null, null, null],
                [null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null]
            ];
            h.context.combatBoard = board;

            // Pick up uA (combat row 4, col 0)...
            h.context.onWaveRepositionClick(4, 0);
            // ...then drop it onto uB's cell (combat row 4, col 1) -- a swap.
            h.context.onWaveRepositionClick(4, 1);

            assert.equal(board[0][0], uB, 'uB should now occupy combatBoard[0][0] after the swap');
            assert.equal(board[0][1], uA, 'uA should now occupy combatBoard[0][1] after the swap');
            assert.equal(uA.gridRow, 4, 'uA.gridRow stays 4 (still combatBoard row 0)');
            assert.equal(uA.gridCol, 1, 'uA.gridCol should update to 1 after the swap');
            assert.equal(uB.gridRow, 4, 'uB.gridRow stays 4 (still combatBoard row 0)');
            assert.equal(uB.gridCol, 0, 'uB.gridCol should update to 0 after the swap');

            // The pre-Prompt-71 DOM version stored combatBoard's own 0-3 row
            // index into gridRow directly (a latent, harmless-there bug --
            // see js/ui-combat.js's header comment on waveRepositionSelected).
            // Confirm THIS version never does that: gridRow must stay in the
            // real combat range (4-7), never fall back into 0-3.
            assert.ok(uA.gridRow >= 4 && uA.gridRow <= 7, 'uA.gridRow must stay within the player rows (4-7), matching js/combat-core.js\'s initCombat() convention');

            // Next wave's initCombat() re-derives gridRow/gridCol fresh from
            // combatBoard -- confirm the swap survived into that derivation,
            // i.e. combatBoard (not a transient field) is the real source of
            // truth carried across waves.
            const gs = { board: board, enemies: [], phase: 'combat', activeSynergies: {}, activeElements: {} };
            h.context.initCombat(gs);
            assert.equal(uB.gridRow, 4, 'uB should re-derive gridRow 4 next wave (combatBoard row 0 -> 4+0)');
            assert.equal(uB.gridCol, 0, 'uB should re-derive gridCol 0 next wave');
            assert.equal(uA.gridRow, 4, 'uA should re-derive gridRow 4 next wave');
            assert.equal(uA.gridCol, 1, 'uA should re-derive gridCol 1 next wave');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'wave reposition: onWaveRepositionClick moves a unit into an empty cell',
        fn: function() {
            const h = createHarness({ seed: 22 });
            h.loadScripts();
            h.freshSave();

            const uA = h.context.createUnit('flame_warrior', 1);
            uA.gridRow = 5; uA.gridCol = 2;

            const board = [
                [null, null, null, null, null, null, null],
                [null, null, uA, null, null, null, null],
                [null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null]
            ];
            h.context.combatBoard = board;

            h.context.onWaveRepositionClick(5, 2); // pick up
            h.context.onWaveRepositionClick(7, 6); // drop on an empty cell

            assert.equal(board[1][2], null, 'the unit\'s old cell should be empty');
            assert.equal(board[3][6], uA, 'the unit should now occupy combatBoard row 3, col 6');
            assert.equal(uA.gridRow, 7, 'gridRow should update to 7 (4 + board row 3)');
            assert.equal(uA.gridCol, 6, 'gridCol should update to 6');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'wave reposition: clicking the same held unit again deselects it (no-op mutation)',
        fn: function() {
            const h = createHarness({ seed: 23 });
            h.loadScripts();
            h.freshSave();

            const uA = h.context.createUnit('flame_warrior', 1);
            uA.gridRow = 4; uA.gridCol = 0;
            const board = [
                [uA, null, null, null, null, null, null],
                [null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null]
            ];
            h.context.combatBoard = board;

            h.context.onWaveRepositionClick(4, 0); // pick up
            h.context.onWaveRepositionClick(4, 0); // click it again -- deselect

            assert.equal(board[0][0], uA, 'the unit should stay exactly where it was');
            assert.equal(uA.gridRow, 4, 'gridRow unchanged');
            assert.equal(uA.gridCol, 0, 'gridCol unchanged');
            assert.equal(h.context.waveRepositionSelected, null, 'selection should be cleared after clicking the held unit a second time');
        }
    }
];

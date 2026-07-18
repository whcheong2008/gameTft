// =============================================================================
// tests/test-renderer-boundary.js — Prompt 67 (combat renderer abstraction)
// acceptance tests. Combat logic (js/combat-*.js) must never touch the DOM
// or a renderer directly; everything visual crosses the seam via
// combatEvents (js/combat-events.js) to whatever renderer js/render-
// interface.js resolves as active (default: js/render-dom.js).
//
//   (a) source-scan: zero `document.` references anywhere under js/combat-*.js.
//   (b) a seeded combat resolves headlessly to a result with NO renderer
//       registered at all -- logic never requires one to exist.
//   (c) registering a stub renderer and driving it exactly like ui-combat.js
//       would (init() after initCombat(), then N frame() calls alongside the
//       tick pump) delivers the documented discrete combatEvents callbacks.
// =============================================================================

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('./assert');
const { createHarness } = require('./harness');

const JS_DIR = path.join(__dirname, '..', 'js');

module.exports = [
    // ---------------------------------------------------------------
    {
        name: 'renderer boundary: zero "document." references in any js/combat-*.js file',
        fn: function() {
            const files = fs.readdirSync(JS_DIR).filter(function(f) {
                return /^combat-.*\.js$/.test(f);
            });
            assert.ok(files.length > 0, 'expected to find at least one js/combat-*.js file to scan');

            const offenders = [];
            for (let i = 0; i < files.length; i++) {
                const full = path.join(JS_DIR, files[i]);
                const text = fs.readFileSync(full, 'utf8');
                const lines = text.split('\n');
                for (let li = 0; li < lines.length; li++) {
                    if (lines[li].indexOf('document.') >= 0) {
                        offenders.push(files[i] + ':' + (li + 1) + ': ' + lines[li].trim());
                    }
                }
            }

            assert.deepEqual(offenders, [], 'combat logic files must never reference `document.` directly -- found: ' + offenders.join(' | '));
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'renderer boundary: combat resolves headlessly to a result with zero renderers registered',
        fn: function() {
            const h = createHarness({ seed: 42 });
            h.loadScripts();
            h.freshSave();

            // Wipe the renderer registry entirely -- not even the 'dom' renderer
            // js/render-dom.js registered at load time. If combat logic secretly
            // depended on a renderer existing, this would throw or hang.
            h.context.RENDERERS = {};
            assert.equal(h.context.getActiveRenderer(), null, 'getActiveRenderer() should return null when the registry is empty and there is no dom fallback');

            const p = h.context.createUnit('flame_warrior', 1);
            const e = h.context.createUnit('stone_guard', 1);
            e.gridRow = 3;
            e.gridCol = 0;
            const board = [
                [p, null, null, null, null, null, null],
                [null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null]
            ];
            const gs = { board: board, enemies: [e], phase: 'combat', activeSynergies: {}, activeElements: {} };

            assert.doesNotThrow(function() {
                h.context.initCombat(gs);
                let ticks = 0;
                while (h.context.combatState.running && ticks < 5000) {
                    h.context.combatTick(0.05);
                    ticks++;
                }
            }, 'combat must run to completion with no renderer registered at all');

            assert.ok(['win', 'loss', 'draw'].indexOf(h.context.combatState.result) >= 0, 'combat should resolve to a valid result with zero renderers registered');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'renderer boundary: a registered stub renderer gets init -> frame calls -> unitDamaged/unitKilled callbacks',
        fn: function() {
            const h = createHarness({ seed: 7 });
            h.loadScripts();
            h.freshSave();

            const calls = { init: 0, frame: 0, destroy: 0 };
            const events = { unitDamaged: 0, unitKilled: 0 };

            const stub = {
                init: function(container, combatState, context) {
                    calls.init++;
                    h.context.combatEvents.on('unitDamaged', function() { events.unitDamaged++; });
                    h.context.combatEvents.on('unitKilled', function() { events.unitKilled++; });
                },
                frame: function(dtMs) { calls.frame++; },
                destroy: function() { calls.destroy++; }
            };
            h.context.registerRenderer('stub', stub);

            // getActiveRenderer() resolves '?renderer=' off window.location.search;
            // point the harness's location stub at the stub renderer the same way
            // a real browser URL would.
            h.context.location.search = '?renderer=stub';
            const active = h.context.getActiveRenderer();
            assert.equal(active, stub, 'getActiveRenderer() should resolve the stub renderer once registered and selected via ?renderer=');

            // Low HP on the enemy so at least one unitKilled fires quickly; real
            // attack values on both sides so unitDamaged fires every exchange.
            const p = h.context.createUnit('flame_warrior', 1);
            const e = h.context.createUnit('stone_guard', 1);
            e.hp = 40;
            e.maxHp = 40;
            e.gridRow = 3;
            e.gridCol = 0;
            const board = [
                [p, null, null, null, null, null, null],
                [null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null]
            ];
            const gs = { board: board, enemies: [e], phase: 'combat', activeSynergies: {}, activeElements: {} };

            // Mirrors ui-combat.js's startMissionCombat(): initCombat() first
            // (this resets combatEvents), THEN the active renderer's init() (so
            // its listeners survive the reset), THEN pump ticks while also
            // driving frame() like the render loop would.
            h.context.initCombat(gs);
            active.init(null, h.context.combatState, { missionName: 'test', waveIndex: 1, totalWaves: 1, encounterMechanic: null, isBoss: false });

            let ticks = 0;
            while (h.context.combatState.running && ticks < 5000) {
                h.context.combatTick(0.05);
                active.frame(50);
                ticks++;
            }
            active.destroy();

            assert.equal(calls.init, 1, 'renderer.init() should be called exactly once for this wave');
            assert.ok(calls.frame > 0, 'renderer.frame() should be called at least once while combat was running');
            assert.equal(calls.destroy, 1, 'renderer.destroy() should be called once when combat ends');
            assert.ok(events.unitDamaged > 0, 'the stub renderer should have observed at least one unitDamaged event');
            assert.ok(events.unitKilled > 0, 'the stub renderer should have observed at least one unitKilled event (the low-HP enemy should die)');
        }
    }
];

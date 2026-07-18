// =============================================================================
// tests/test-renderer-boundary.js — Prompt 67 (combat renderer abstraction)
// acceptance tests. Combat logic (js/combat-*.js) must never touch the DOM
// or a renderer directly; everything visual crosses the seam via
// combatEvents (js/combat-events.js) to whatever renderer js/render-
// interface.js resolves as active (default and, since Prompt 71, ONLY
// renderer: pixi -- js/render-dom.js was deleted).
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
    },

    // ---------------------------------------------------------------
    // Prompt 68 (PixiJS renderer bootstrap) acceptance tests.
    // ---------------------------------------------------------------
    {
        name: 'renderer boundary: RENDERERS.pixi registers when a fake PIXI global stub is present',
        fn: function() {
            const h = createHarness({ seed: 3 });
            // js/render-pixi.js's registration guard (`typeof PIXI !== 'undefined'`)
            // is checked once, at script-load time -- so the fake stub must be
            // set on the sandbox BEFORE loadScripts() runs js/render-pixi.js,
            // not after. tests/harness.js's getScriptLoadOrder() skips the real
            // js/vendor/pixi.min.js (browser-only blob), so PIXI is normally
            // undefined here; this stub stands in for it.
            h.context.PIXI = {};
            h.loadScripts();
            h.freshSave();

            assert.ok(h.context.RENDERERS && h.context.RENDERERS.pixi, 'RENDERERS.pixi should be registered once a PIXI global exists at script-load time');
            const pixi = h.context.RENDERERS.pixi;
            assert.equal(typeof pixi.init, 'function', 'RENDER_PIXI.init should be a function');
            assert.equal(typeof pixi.frame, 'function', 'RENDER_PIXI.frame should be a function');
            assert.equal(typeof pixi.destroy, 'function', 'RENDER_PIXI.destroy should be a function');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'renderer boundary: RENDERERS.pixi is absent when no PIXI global exists (the real vendor file is never loaded headlessly)',
        fn: function() {
            const h = createHarness({ seed: 4 });
            h.loadScripts();
            h.freshSave();

            assert.equal(typeof h.context.PIXI, 'undefined', 'PIXI should be undefined in the headless harness -- js/vendor/pixi.min.js must be skipped by getScriptLoadOrder()');
            assert.ok(!h.context.RENDERERS.pixi, 'RENDERERS.pixi should not be registered when PIXI was never defined');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'renderer boundary: js/render-pixi.js never calls a function defined in js/combat-*.js',
        fn: function() {
            const combatFiles = fs.readdirSync(JS_DIR).filter(function(f) {
                return /^combat-.*\.js$/.test(f);
            });
            assert.ok(combatFiles.length > 0, 'expected to find at least one js/combat-*.js file to scan');

            // Collect every top-level `function name(` declared anywhere under
            // js/combat-*.js.
            const combatFnNames = [];
            for (let i = 0; i < combatFiles.length; i++) {
                const text = fs.readFileSync(path.join(JS_DIR, combatFiles[i]), 'utf8');
                const re = /function\s+([A-Za-z_$][\w$]*)\s*\(/g;
                let m;
                while ((m = re.exec(text))) {
                    if (combatFnNames.indexOf(m[1]) < 0) combatFnNames.push(m[1]);
                }
            }

            const pixiPath = path.join(JS_DIR, 'render-pixi.js');
            assert.ok(fs.existsSync(pixiPath), 'expected js/render-pixi.js to exist (Prompt 68)');
            let pixiSrc = fs.readFileSync(pixiPath, 'utf8');
            // Strip comments first -- this file's own prose (explaining WHY it
            // avoids calling into combat-*.js) legitimately mentions those
            // function names by name (e.g. "moveUnit()", "initCombat()"); only
            // actual call sites in live code should fail this check.
            pixiSrc = pixiSrc.replace(/\/\*[\s\S]*?\*\//g, ' ');
            pixiSrc = pixiSrc.replace(/\/\/[^\n]*/g, ' ');

            const offenders = [];
            for (let i = 0; i < combatFnNames.length; i++) {
                const name = combatFnNames[i];
                // combatEvents/combatState/COMBAT_SPEED etc. are data/bus
                // access, not function calls into combat-*.js, and aren't
                // matched by this pattern anyway (it requires a literal `(`
                // immediately after the identifier, word-boundaried).
                const callRe = new RegExp('\\b' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\(');
                if (callRe.test(pixiSrc)) offenders.push(name);
            }

            assert.deepEqual(offenders, [], 'js/render-pixi.js must never call a function defined in js/combat-*.js (found calls to: ' + offenders.join(', ') + ') -- it may only read combatState/combatEvents per the documented renderer interface');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'renderer boundary: js/render-pixi.js registration is guarded behind typeof PIXI !== \'undefined\'',
        fn: function() {
            const pixiPath = path.join(JS_DIR, 'render-pixi.js');
            const text = fs.readFileSync(pixiPath, 'utf8');
            assert.ok(/typeof\s+PIXI\s*!==?\s*['"]undefined['"]/.test(text), 'js/render-pixi.js should guard its registerRenderer(\'pixi\', ...) call behind typeof PIXI !== \'undefined\'');
        }
    },

    // ---------------------------------------------------------------
    // Prompt 70 (Phase 3.4, Task 5) acceptance tests -- pixi becomes the
    // default renderer, with an explicit `?renderer=dom` opt-out and an
    // automatic runtime fallback when Pixi turns out to be unusable.
    // ---------------------------------------------------------------
    {
        name: 'renderer boundary (Prompt 70): default resolution is pixi when a PIXI global is present at script-load time',
        fn: function() {
            const h = createHarness({ seed: 10 });
            h.context.PIXI = {}; // stand-in stub, same convention as the Prompt 68 tests above
            h.loadScripts();
            h.freshSave();

            assert.ok(h.context.RENDERERS.pixi, 'RENDERERS.pixi should be registered with the PIXI stub present');
            // No `?renderer=` param on the harness's location stub -- default resolution should win.
            assert.equal(h.context.getActiveRenderer(), h.context.RENDERERS.pixi, 'getActiveRenderer() should default to RENDERERS.pixi (Prompt 70 flips the default from dom to pixi)');
        }
    },

    // ---------------------------------------------------------------
    // Prompt 71 (Phase 3.5, Task 3) acceptance tests -- js/render-dom.js is
    // deleted; RENDERERS only ever has 'pixi'. An explicit `?renderer=dom`
    // URL (documented since Prompt 70) must not silently break -- it falls
    // back to pixi with a one-time console.warn instead of resolving to
    // nothing. A WebGL-absent/broken machine has no renderer to run combat
    // frames through at all (js/render-pixi.js shows a DOM "requires WebGL"
    // notice directly in that case, outside this headless registry).
    // ---------------------------------------------------------------
    {
        name: 'renderer boundary (Prompt 71): explicit ?renderer=dom falls back to pixi (with a warn), not to a deleted renderer',
        fn: function() {
            const h = createHarness({ seed: 11 });
            h.context.PIXI = {};
            h.loadScripts();
            h.freshSave();

            assert.ok(!h.context.RENDERERS.dom, 'RENDERERS.dom should not exist -- js/render-dom.js was deleted (Prompt 71)');

            const warnCalls = [];
            const originalWarn = h.context.console.warn;
            h.context.console.warn = function(msg) { warnCalls.push(msg); };

            h.context.location.search = '?renderer=dom';
            assert.equal(h.context.getActiveRenderer(), h.context.RENDERERS.pixi, 'getActiveRenderer() should resolve pixi when ?renderer=dom is explicitly requested (the DOM renderer it used to name no longer exists)');
            assert.ok(warnCalls.length > 0, 'requesting the retired ?renderer=dom should emit a console.warn');

            h.context.console.warn = originalWarn;
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'renderer boundary (Prompt 71): registry resolves to null (not a dom fallback) when PIXI never loaded',
        fn: function() {
            const h = createHarness({ seed: 12 });
            h.loadScripts(); // no PIXI stub set -- js/render-pixi.js's registration guard skips it
            h.freshSave();

            assert.ok(!h.context.RENDERERS.pixi, 'RENDERERS.pixi should be absent (no PIXI global at script-load time)');
            assert.ok(!h.context.RENDERERS.dom, 'RENDERERS.dom should not exist -- js/render-dom.js was deleted (Prompt 71)');
            assert.equal(h.context.getActiveRenderer(), null, 'getActiveRenderer() should resolve to null with nothing registered -- there is no more DOM renderer to silently fall back to; js/render-pixi.js\'s pixiEnsureApp() shows a WebGL-required notice in this situation instead');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'renderer boundary (Prompt 71): forceRendererDomFallback() is a harmless no-op stub',
        fn: function() {
            const h = createHarness({ seed: 13 });
            h.context.PIXI = {};
            h.loadScripts();
            h.freshSave();

            assert.equal(h.context.getActiveRenderer(), h.context.RENDERERS.pixi, 'sanity check: pixi should be the default');
            assert.doesNotThrow(function() { h.context.forceRendererDomFallback('unit test'); }, 'forceRendererDomFallback() should never throw');
            assert.equal(h.context.getActiveRenderer(), h.context.RENDERERS.pixi, 'forceRendererDomFallback() should not change renderer resolution -- it is a no-op stub since Prompt 71 (there is nothing left to fall back to)');
        }
    }
];

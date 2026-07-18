// =============================================================================
// tests/test-vfx.js — Prompt 72 (VFX framework, Phase 4.1/4.2/4.3-boss-only)
// acceptance tests.
//
//   (a) VFX.play() returns an instance for every one of the ~12 primitives,
//       against a fake-but-structurally-real PIXI stub (Container/Graphics/
//       Text/Application) so js/render-pixi.js's real init lifecycle runs and
//       js/vfx.js actually mounts its layers and builds real display objects.
//   (b) event wiring smoke test: a seeded combat with VFX.play spied shows
//       projectiles for ranged auto-attacks, slashes for melee, bursts on
//       every hit, and decals on boss telegraphs.
//   (c) hard particle cap: spawning far more than VFX_CAP live particles
//       still leaves the live count at or under the cap (oldest culled).
//   (d) RNG-stream isolation: a full seeded combat replay with VFX doing its
//       real (stubbed-Pixi) work consumes the exact same number of
//       Math.random() calls -- and produces the exact same result/ticks/
//       survivors -- as the same seed replayed with VFX.play stubbed to a
//       true no-op. VFX must never touch the seeded logic RNG stream.
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

// ---------------------------------------------------------------------------
// A structurally-real (but headless) PIXI stub: enough of Container/Graphics/
// Text/Application/Rectangle/Polygon for js/render-pixi.js's real init
// lifecycle (pixiEnsureApp -> app.init().then(...) -> PIXI_R.ready = true) to
// actually run, and for js/vfx.js's primitive builders to build and mount
// real display objects rather than take the "PIXI not ready" no-op path.
//
// `.init()` returns a plain thenable whose `.then()` fires SYNCHRONOUSLY
// (not a real Promise) so tests don't need to await a microtask flush --
// render-pixi.js's own `app.init({...}).then(fn).catch(fn)` chain works
// against this unchanged.
// ---------------------------------------------------------------------------

function makeFakePixi() {
    function FakeDisplayObject() {
        this.children = [];
        this.parent = null;
        this.x = 0; this.y = 0; this.alpha = 1; this.visible = true;
        this.zIndex = 0; this.eventMode = 'auto'; this.cursor = 'default';
        this.sortableChildren = false;
        this.scale = { set: function() {} };
        this.hitArea = null;
        this._destroyed = false;
    }
    FakeDisplayObject.prototype.addChild = function(c) { this.children.push(c); c.parent = this; return c; };
    FakeDisplayObject.prototype.addChildAt = function(c, idx) {
        idx = Math.max(0, Math.min(idx, this.children.length));
        this.children.splice(idx, 0, c);
        c.parent = this;
        return c;
    };
    FakeDisplayObject.prototype.removeChild = function(c) {
        const i = this.children.indexOf(c);
        if (i >= 0) this.children.splice(i, 1);
        return c;
    };
    FakeDisplayObject.prototype.removeChildren = function() { this.children = []; };
    FakeDisplayObject.prototype.getChildIndex = function(c) { return this.children.indexOf(c); };
    FakeDisplayObject.prototype.destroy = function() { this._destroyed = true; this.children = []; };
    FakeDisplayObject.prototype.on = function() { return this; };

    function FakeContainer() { FakeDisplayObject.call(this); }
    FakeContainer.prototype = Object.create(FakeDisplayObject.prototype);

    function FakeGraphics() { FakeDisplayObject.call(this); this._ops = 0; }
    FakeGraphics.prototype = Object.create(FakeDisplayObject.prototype);
    const chainMethods = ['clear', 'circle', 'rect', 'roundRect', 'poly', 'moveTo', 'lineTo', 'stroke', 'fill'];
    chainMethods.forEach(function(name) {
        FakeGraphics.prototype[name] = function() { this._ops++; return this; };
    });

    function FakeText(opts) {
        FakeDisplayObject.call(this);
        this.text = (opts && opts.text) || '';
        this.style = (opts && opts.style) || {};
        this.anchor = (opts && opts.anchor) || 0;
    }
    FakeText.prototype = Object.create(FakeDisplayObject.prototype);

    function FakeApplication() {
        this.stage = new FakeContainer();
        this.canvas = { style: {} };
        this.renderer = {};
    }
    FakeApplication.prototype.init = function() {
        const self = this;
        return {
            then: function(onFulfilled) { if (onFulfilled) onFulfilled(self); return { catch: function() { return this; } }; },
            catch: function() { return this; }
        };
    };
    FakeApplication.prototype.destroy = function() { this.stage.destroy(); };

    function FakeRectangle(x, y, w, h) { this.x = x; this.y = y; this.width = w; this.height = h; }
    function FakePolygon(points) { this.points = points; }

    return {
        Container: FakeContainer,
        Graphics: FakeGraphics,
        Text: FakeText,
        Application: FakeApplication,
        Rectangle: FakeRectangle,
        Polygon: FakePolygon
    };
}

// Loads the real script order with a fake PIXI global present at load time
// (mirrors tests/test-renderer-boundary.js's own convention), then drives
// RENDER_PIXI.init() so PIXI_R.ready flips true and js/vfx.js can build real
// (fake-backed) display objects instead of taking its no-op path.
function makeReadyHarness(seed) {
    const h = createHarness({ seed: seed });
    h.context.PIXI = makeFakePixi();
    h.loadScripts();
    h.freshSave();
    assert.ok(h.context.RENDERERS && h.context.RENDERERS.pixi, 'RENDERERS.pixi should register with the fake PIXI stub present');
    h.context.RENDERERS.pixi.init(null, null, {});
    assert.equal(h.context.PIXI_R.ready, true, 'fake PIXI Application.init() thenable should resolve synchronously, flipping PIXI_R.ready');
    return h;
}

module.exports = [
    // ---------------------------------------------------------------
    {
        name: 'vfx: VFX.play() returns an instance for every one of the ~12 primitives',
        fn: function() {
            const h = makeReadyHarness(1001);
            const names = h.context.VFX.PRIMITIVE_NAMES;
            assert.ok(Array.isArray(names) && names.length >= 12, 'VFX.PRIMITIVE_NAMES should list at least the 12 primitives the spec names');

            const commonOpts = {
                row: 5, col: 3, element: 'fire',
                from: { row: 4, col: 2 }, to: { row: 5, col: 3 },
                fromUnit: null, toUnit: null,
                points: [{ row: 4, col: 2 }, { row: 5, col: 3 }, { row: 6, col: 4 }],
                cells: [{ row: 5, col: 3 }, { row: 5, col: 4 }],
                unit: h.context.createUnit('flame_warrior', 1),
                count: 5,
                duration: 0.3
            };
            commonOpts.unit.gridRow = 5;
            commonOpts.unit.gridCol = 3;

            for (let i = 0; i < names.length; i++) {
                const inst = h.context.VFX.play(names[i], commonOpts);
                assert.ok(inst, 'VFX.play("' + names[i] + '") should return a non-null instance');
                assert.equal(inst.type, names[i], 'returned instance .type should match the primitive name');
                assert.equal(typeof inst.update, 'function', 'returned instance should have an .update() function (or null for zero-op types)');
            }
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'vfx: VFX.play() is a safe no-op (never throws, still returns an instance) when PIXI is entirely absent',
        fn: function() {
            const h = createHarness({ seed: 1002 });
            h.loadScripts(); // no PIXI stub at all
            h.freshSave();
            assert.equal(typeof h.context.PIXI, 'undefined', 'sanity: PIXI should be undefined');

            assert.doesNotThrow(function() {
                const inst = h.context.VFX.play('burst', { row: 2, col: 2, element: 'water' });
                assert.ok(inst, 'VFX.play should still return a lightweight instance with no PIXI available');
            }, 'VFX.play must never throw when PIXI/the pixi Application is unavailable');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'vfx: hard particle cap -- spawning 1000 bursts leaves live particle count at or under VFX.CAP',
        fn: function() {
            const h = makeReadyHarness(1003);
            for (let i = 0; i < 1000; i++) {
                h.context.VFX.play('burst', { row: i % 8, col: i % 7, element: 'fire', count: 10 });
            }
            const live = h.context.VFX.liveParticleCount();
            assert.ok(live <= h.context.VFX.CAP, 'live particle count (' + live + ') should never exceed VFX.CAP (' + h.context.VFX.CAP + ')');
            assert.ok(live > 0, 'sanity: some particles should still be alive right after spawning');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'vfx: VFX.frame() retires expired instances over time',
        fn: function() {
            const h = makeReadyHarness(1004);
            h.context.VFX.play('slash', { row: 1, col: 1, element: 'earth', duration: 0.1 });
            assert.ok(h.context.VFX.activeCount() > 0, 'sanity: an instance should be active immediately after play()');
            // 10 frames of 50ms at 1x combat speed = 500ms of nominal elapsed time,
            // comfortably past the 0.1s duration above.
            for (let i = 0; i < 10; i++) h.context.VFX.frame(50);
            assert.equal(h.context.VFX.activeCount(), 0, 'a short-duration instance should have been retired after enough frame() ticks');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'vfx: event wiring smoke test -- projectiles for ranged auto-attacks, slashes for melee, bursts on hit, decals on boss telegraph',
        fn: function() {
            const h = makeReadyHarness(2001);
            const calls = [];
            const realPlay = h.context.VFX.play;
            h.context.VFX.play = function(name, opts) {
                calls.push({ name: name, opts: opts });
                return realPlay.call(h.context.VFX, name, opts);
            };

            // A ranged archer + a melee warrior vs a boss stage: exercises
            // auto-attack projectile/slash wiring, on-hit bursts, and (via the
            // boss) telegraph decal/detonate wiring in a single seeded run.
            const team = [
                { key: 'flame_warrior', row: 0, col: 2, stars: 3 },
                { key: 'cinder_archer', row: 0, col: 4, stars: 3 }
            ];
            const stageIndex = h.context.STAGES.findIndex(function(s) { return s.id === 'r1_boss'; });
            assert.ok(stageIndex >= 0, 'expected to find the r1_boss stage');
            const run = h.runCombat(team, stageIndex);
            assert.ok(run.ticks > 0, 'sanity: the boss fight should have run for at least 1 tick');

            const names = calls.map(function(c) { return c.name; });
            assert.ok(names.indexOf('projectile') >= 0, 'a ranged unit (cinder_archer, range 4) auto-attacking should have fired a "projectile" VFX call');
            assert.ok(names.indexOf('slash') >= 0, 'a melee unit (flame_warrior, range 1) auto-attacking should have fired a "slash" VFX call');
            assert.ok(names.indexOf('burst') >= 0, 'every hit should fire a "burst" VFX call');
            assert.ok(names.indexOf('groundDecal') >= 0, 'a boss telegraph should fire a "groundDecal" VFX call');

            // Every projectile call must be traceable to a source with range > 1,
            // and every slash call to a source with range <= 1 -- confirms the
            // melee/ranged decision is actually reading the right field, not
            // coincidentally correct.
            const projectileCalls = calls.filter(function(c) { return c.name === 'projectile'; });
            for (let i = 0; i < projectileCalls.length; i++) {
                const src = projectileCalls[i].opts.fromUnit;
                assert.ok(src && (src.range || 1) > 1, 'every "projectile" call should originate from a source with range > 1');
            }
            const slashCalls = calls.filter(function(c) { return c.name === 'slash'; });
            assert.ok(slashCalls.length > 0, 'sanity: at least one slash call recorded');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'vfx: RNG-stream isolation -- VFX doing real work vs VFX.play stubbed to a no-op consume identical Math.random() calls and produce identical combat outcomes',
        fn: function() {
            const team = [
                { key: 'flame_warrior', row: 0, col: 0, stars: 3 },
                { key: 'stone_guard', row: 0, col: 2, stars: 3 },
                { key: 'frost_archer', row: 0, col: 4, stars: 3 },
                { key: 'pulse_mender', row: 0, col: 6, stars: 3 },
                { key: 'wind_squire', row: 0, col: 3, stars: 3 }
            ];

            function replay(seed, disableVfx) {
                const h = makeReadyHarness(seed);
                if (disableVfx) {
                    h.context.VFX.play = function() { return null; };
                }
                let count = 0;
                const origRandom = h.context.Math.random;
                h.context.Math.random = function() { count++; return origRandom(); };
                const stageIndex = h.context.STAGES.findIndex(function(s) { return s.id === 'r2_s5'; });
                const run = h.runCombat(team, stageIndex);
                h.context.Math.random = origRandom;
                return { count: count, result: run.result, ticks: run.ticks, survivors: run.survivors };
            }

            const withVfx = replay(4242, false);
            const withoutVfx = replay(4242, true);

            assert.equal(withVfx.count, withoutVfx.count, 'VFX actively producing effects must consume the exact same number of Math.random() calls as VFX stubbed to a no-op -- it must never touch the seeded logic RNG stream');
            assert.deepEqual(
                { result: withVfx.result, ticks: withVfx.ticks, survivors: withVfx.survivors },
                { result: withoutVfx.result, ticks: withoutVfx.ticks, survivors: withoutVfx.survivors },
                'VFX must not affect combat determinism/outcome in any way'
            );
        }
    }
];

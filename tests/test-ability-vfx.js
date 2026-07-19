// =============================================================================
// tests/test-ability-vfx.js — Prompt 73 (Phase 4.3, ability VFX coverage)
// acceptance tests.
//
//   (a) registry completeness: every one of the 132 ABILITY_DATA keys
//       resolves to a recipe via ABILITY_VFX_RESOLVE (explicit -- and here,
//       every single one IS explicit), plus the default-recipe fallback
//       still resolves something sane for an unmapped/synthetic key.
//   (b) recipe schema validation: every step across every one of the 132
//       recipes names a real VFX primitive, and every step's `at` (when
//       present) is one of the interpreter's legal values.
//   (c) interpreter smoke via seeded fights with a VFX.play spy: a chain
//       ability (shock_mage) produces a 'chain' call with >1 points; an AoE
//       ability (magma_knight) produces cell-anchored ('cells' opt present)
//       steps; a pierce ability (wind_archer) produces path-based ('cells'
//       from hexRay) beam steps.
//   (d) RNG-stream isolation (Prompt 72's own test pattern): a full seeded
//       combat replay with the ability-VFX system doing its real (stubbed-
//       Pixi) work consumes the exact same number of Math.random() calls --
//       and produces the exact same result/ticks/survivors -- as the same
//       seed replayed with VFX.play stubbed to a true no-op.
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

// Mirrors tests/test-vfx.js's own fake PIXI stub exactly (structurally-real
// Container/Graphics/Text/Application so js/render-pixi.js's real init
// lifecycle runs and js/vfx.js/js/vfx-abilities.js build real display
// objects rather than taking the "PIXI not ready" no-op path).
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
        name: 'ability-vfx: registry completeness -- all 132 ABILITY_DATA keys resolve to a recipe with cast/travel/impact arrays',
        fn: function() {
            const h = createHarness({ seed: 3001 });
            h.loadScripts();
            h.freshSave();

            const keys = Object.keys(h.context.ABILITY_DATA);
            assert.equal(keys.length, 132, 'sanity: ABILITY_DATA should have exactly 132 entries (66 base + 66 evolved)');

            let explicitCount = 0, defaultCount = 0;
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const isExplicit = h.context.ABILITY_VFX.hasOwnProperty(key);
                if (isExplicit) explicitCount++; else defaultCount++;
                const fakeUnit = { element: 'fire', type: 'warrior', range: 1, side: 'player', target: null };
                const recipe = h.context.ABILITY_VFX_RESOLVE(key, fakeUnit);
                assert.ok(recipe, 'ABILITY_VFX_RESOLVE("' + key + '") should return a recipe');
                assert.ok(Array.isArray(recipe.cast), key + ': recipe.cast should be an array');
                assert.ok(Array.isArray(recipe.travel), key + ': recipe.travel should be an array');
                assert.ok(Array.isArray(recipe.impact), key + ': recipe.impact should be an array');
                const total = recipe.cast.length + recipe.travel.length + recipe.impact.length;
                assert.ok(total > 0, key + ': recipe should have at least one step across cast/travel/impact');
            }
            assert.equal(explicitCount, 132, 'every one of the 132 ability keys should have an explicit ABILITY_VFX entry');
            assert.equal(defaultCount, 0, 'sanity: no keys should be falling through to the default recipe');

            // The default-recipe fallback itself must still resolve something
            // sane for a key with no explicit entry (registry safety net).
            const synthetic = h.context.ABILITY_VFX_RESOLVE('__not_a_real_ability__', { element: 'water', type: 'healer', range: 3, side: 'player', target: null });
            assert.ok(synthetic, 'unmapped key should still resolve via the element/archetype default generator');
            assert.ok((synthetic.cast.length + synthetic.travel.length + synthetic.impact.length) > 0, 'default recipe should have at least one step');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'ability-vfx: recipe schema validation -- every step across all 132 recipes names a real primitive and a legal `at`',
        fn: function() {
            const h = createHarness({ seed: 3002 });
            h.loadScripts();
            h.freshSave();

            const primitiveNames = {};
            h.context.VFX.PRIMITIVE_NAMES.forEach(function(n) { primitiveNames[n] = true; });
            const legalAt = {};
            h.context.ABILITY_VFX_AT_TYPES.forEach(function(a) { legalAt[a] = true; });

            let stepCount = 0;
            const keys = Object.keys(h.context.ABILITY_VFX);
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const recipe = h.context.ABILITY_VFX[key];
                ['cast', 'travel', 'impact'].forEach(function(phase) {
                    const steps = recipe[phase] || [];
                    for (let s = 0; s < steps.length; s++) {
                        const step = steps[s];
                        if (!step) continue; // evolveRecipe() may carry forward a null travel step from a base with none
                        stepCount++;
                        assert.ok(step.p, key + '.' + phase + '[' + s + ']: step must name a primitive (`p`)');
                        assert.ok(primitiveNames.hasOwnProperty(step.p), key + '.' + phase + '[' + s + ']: "' + step.p + '" is not a registered VFX primitive');
                        if (step.at !== undefined) {
                            assert.ok(legalAt.hasOwnProperty(step.at), key + '.' + phase + '[' + s + ']: "' + step.at + '" is not a legal `at` value');
                        }
                    }
                });
            }
            assert.ok(stepCount > 300, 'sanity: 132 recipes should produce a substantial number of total steps (got ' + stepCount + ')');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'ability-vfx: interpreter smoke -- chain produces >1 chain points, AoE produces cell-anchored steps, pierce produces path-derived cells',
        fn: function() {
            const h = makeReadyHarness(4001);
            const calls = [];
            const realPlay = h.context.VFX.play;
            h.context.VFX.play = function(name, opts) {
                calls.push({ name: name, opts: opts });
                return realPlay.call(h.context.VFX, name, opts);
            };

            // A weak 3-star T1 team against a mid-late-region wave (tankier
            // than the team) so forcing mana to max every tick below produces
            // several REAL casts per unit (chain/pierce/AoE) instead of an
            // instant one-shot alpha strike -- deterministic, no reliance on
            // the natural mana-fill pace of a fight the team would stomp in
            // one tick otherwise.
            const sd = h.freshSave();
            const team = [
                { key: 'shock_mage', row: 0, col: 1, stars: 3 },   // chain
                { key: 'wind_archer', row: 0, col: 3, stars: 3 },  // pierce
                { key: 'magma_knight', row: 0, col: 5, stars: 3 }, // self-centered AoE
                { key: 'stone_guard', row: 1, col: 2, stars: 3 },
                { key: 'pulse_mender', row: 1, col: 4, stars: 3 }
            ];
            team.forEach(function(u) { sd.collection[u.key] = { stars: u.stars, copiesForNext: 0 }; });
            const activeTeam = h.context.getActiveTeam(sd);
            activeTeam.slots = team.map(function(u) { return { key: u.key, row: u.row, col: u.col }; });

            const stageIndex = h.context.STAGES.findIndex(function(s) { return s.id === 'r5_s3'; });
            assert.ok(stageIndex >= 0, 'expected to find the r5_s3 stage (tankier than a 3-star T1 team)');
            h.context.uiStartStoryMission(stageIndex);

            const dt = h.context.COMBAT_DT || 0.05;
            let ticks = 0;
            while (h.context.combatState && h.context.combatState.running && ticks < 3000) {
                const cs = h.context.combatState;
                for (let i = 0; i < cs.playerUnits.length; i++) {
                    const u = cs.playerUnits[i];
                    if (u.hp > 0 && u.maxMana > 0 && u.currentMana < u.maxMana) u.currentMana = u.maxMana;
                }
                h.context.combatTick(dt);
                // Ability VFX recipes stagger some steps (e.g. chain/AoE
                // impact) via delayed jobs that only fire once VFX.frame()
                // (the separate render-tick loop, driven by RENDER_PIXI.frame()
                // in the real browser) advances them -- pump it alongside the
                // logic tick so those deferred steps actually resolve here.
                h.context.VFX.frame(dt * 1000);
                ticks++;
            }
            assert.ok(ticks > 0, 'sanity: the fight should have run for at least 1 tick');

            const chainCalls = calls.filter(function(c) { return c.name === 'chain'; });
            assert.ok(chainCalls.length > 0, 'shock_mage casting should have produced at least one "chain" VFX call');
            const multiPointChain = chainCalls.some(function(c) { return c.opts.points && c.opts.points.length > 2; });
            assert.ok(multiPointChain, 'at least one chain call should have >2 points (caster + >1 bounce target)');

            const novaCalls = calls.filter(function(c) { return c.name === 'nova' || c.name === 'groundDecal'; });
            assert.ok(novaCalls.length > 0, 'magma_knight self-AoE casting should have produced nova/groundDecal VFX calls');
            const cellAnchored = novaCalls.some(function(c) { return c.opts.cells && c.opts.cells.length > 0; }) ||
                calls.some(function(c) { return c.name === 'groundDecal' && c.opts.cells && c.opts.cells.length > 1; });
            assert.ok(cellAnchored, 'at least one AoE-related call should carry a real multi-cell `cells` list (from cellsInRange)');

            const beamCalls = calls.filter(function(c) { return c.name === 'beam' && c.opts.cells; });
            assert.ok(beamCalls.length > 0, 'wind_archer pierce casting should have produced at least one path-anchored "beam" VFX call');
            const realPath = beamCalls.some(function(c) { return c.opts.cells.length > 1; });
            assert.ok(realPath, 'at least one pierce beam call should carry a multi-cell path (from hexRay)');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'ability-vfx: RNG-stream isolation -- the ability-VFX system doing real work vs VFX.play stubbed to a no-op consume identical Math.random() calls and produce identical combat outcomes',
        fn: function() {
            const team = [
                { key: 'shock_mage', row: 0, col: 1, stars: 3 },
                { key: 'wind_archer', row: 0, col: 3, stars: 3 },
                { key: 'magma_knight', row: 0, col: 5, stars: 3 },
                { key: 'fire_dragon', row: 0, col: 0, stars: 3 },
                { key: 'inferno_fox', row: 0, col: 6, stars: 3 },
                { key: 'stone_guard', row: 1, col: 2, stars: 3 },
                { key: 'pulse_mender', row: 1, col: 4, stars: 3 }
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

            const withVfx = replay(5252, false);
            const withoutVfx = replay(5252, true);

            assert.equal(withVfx.count, withoutVfx.count, 'the ability-VFX system actively producing effects must consume the exact same number of Math.random() calls as VFX stubbed to a no-op -- it must never touch the seeded logic RNG stream');
            assert.deepEqual(
                { result: withVfx.result, ticks: withVfx.ticks, survivors: withVfx.survivors },
                { result: withoutVfx.result, ticks: withoutVfx.ticks, survivors: withoutVfx.survivors },
                'ability VFX must not affect combat determinism/outcome in any way'
            );
        }
    }
];

// =============================================================================
// tests/test-assets.js — Prompt 83 (Phase 5.6: art integration) acceptance
// tests for js/assets.js's getPortraitUrl()/getBackgroundUrl()/PORTRAIT_KEYS,
// plus headless coverage that wiring real art into roster/detail/gacha/combat
// doesn't throw and doesn't perturb combat determinism (goldens/RNG).
//
// Does NOT re-test tests/test-combat-golden.js's own scenarios -- the last
// test case here builds its own minimal seeded fight (mirroring
// tests/test-renderer-boundary.js's convention) specifically to compare
// "pixi renderer driving frames with portrait tokens active" against
// "no renderer at all", same seed, and assert identical outcomes.
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

// ---- minimal fake PIXI stub with Sprite/Assets support (test-vfx.js's
// makeFakePixi() doesn't define either -- see js/render-pixi.js's
// pixiPortraitsSupported() comment for why that's the "portraits fully
// unsupported, total no-op" case this file intentionally does NOT want here;
// this stub exists specifically to exercise the supported code path). ----
function makeFakePixiWithPortraits() {
    function FakeDisplayObject() {
        this.children = [];
        this.parent = null;
        this.x = 0; this.y = 0; this.alpha = 1; this.visible = true;
        this.zIndex = 0; this.eventMode = 'auto'; this.cursor = 'default';
        this.sortableChildren = false;
        this.scale = { set: function() {} };
        this.hitArea = null;
        this.mask = null;
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
    const chainMethods = ['clear', 'circle', 'ellipse', 'rect', 'roundRect', 'poly', 'moveTo', 'lineTo', 'stroke', 'fill'];
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

    // The one addition over test-vfx.js's makeFakePixi(): a Sprite with a
    // real .anchor.set()/.width/.height surface, exactly what
    // pixiApplyPortraitToToken() (js/render-pixi.js) touches.
    function FakeSprite() {
        FakeDisplayObject.call(this);
        this.anchor = { x: 0, y: 0, set: function(x, y) { this.x = x; this.y = (y === undefined) ? x : y; } };
        this.texture = null;
        this._width = 0;
        this._height = 0;
    }
    FakeSprite.prototype = Object.create(FakeDisplayObject.prototype);
    Object.defineProperty(FakeSprite.prototype, 'width', {
        get: function() { return this._width; }, set: function(v) { this._width = v; }
    });
    Object.defineProperty(FakeSprite.prototype, 'height', {
        get: function() { return this._height; }, set: function(v) { this._height = v; }
    });

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

    // Synchronous thenable (same convention FakeApplication.prototype.init
    // uses above) -- resolves the instant .then() is called, so a texture is
    // already cached in js/render-pixi.js's PIXI_PORTRAIT_TEXTURES by the
    // time the NEXT frame() runs, with no real microtask/event-loop tick
    // needed (tests/run.js calls test fn()s fully synchronously).
    const loadedUrls = [];
    const Assets = {
        load: function(url) {
            loadedUrls.push(url);
            const fakeTexture = { _fakeTextureUrl: url };
            return {
                then: function(onFulfilled) { if (onFulfilled) onFulfilled(fakeTexture); return { catch: function() { return this; } }; },
                catch: function() { return this; }
            };
        },
        _loadedUrls: loadedUrls
    };

    return {
        Container: FakeContainer,
        Graphics: FakeGraphics,
        Text: FakeText,
        Sprite: FakeSprite,
        Application: FakeApplication,
        Rectangle: FakeRectangle,
        Polygon: FakePolygon,
        Assets: Assets
    };
}

// Builds a tiny 1v1 seeded fight (mirrors tests/test-renderer-boundary.js's
// own board setup) and runs it to completion, optionally driving the pixi
// renderer's init()/frame()/destroy() alongside every combatTick() exactly
// like js/ui-combat.js's real render loop would. Returns {result, ticks} --
// small enough to deepEqual across a with/without-renderer comparison.
function runSeededSkirmish(seed, withPixi) {
    const h = createHarness({ seed: seed });
    if (withPixi) h.context.PIXI = makeFakePixiWithPortraits();
    h.loadScripts();
    h.freshSave();

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
    h.context.initCombat(gs);

    let renderer = null;
    if (withPixi) {
        renderer = h.context.RENDERERS && h.context.RENDERERS.pixi;
        if (renderer) {
            renderer.init(null, h.context.combatState, { missionName: 'test', waveIndex: 1, totalWaves: 1, encounterMechanic: null, isBoss: false });
        }
    }

    let ticks = 0;
    while (h.context.combatState.running && ticks < 5000) {
        h.context.combatTick(0.05);
        if (renderer) renderer.frame(50);
        ticks++;
    }
    if (renderer) renderer.destroy();

    return { result: h.context.combatState.result, ticks: ticks, renderer: renderer };
}

module.exports = [
    // ---------------------------------------------------------------
    {
        name: 'assets: getPortraitUrl resolves base units, evolved units (via baseKey), heroes, and bosses; null for unknown',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            h.freshSave();

            assert.equal(h.context.getPortraitUrl('flame_warrior'), 'assets/portraits/flame_warrior.webp', 'a base unit key should resolve to its own file');

            const evoKeys = Object.keys(h.context.EVOLVED_TEMPLATES);
            assert.ok(evoKeys.length > 0, 'expected at least one evolved template to test against');
            const evoKey = evoKeys[0];
            const baseKey = h.context.EVOLVED_TEMPLATES[evoKey].baseKey;
            assert.equal(h.context.getPortraitUrl(evoKey), 'assets/portraits/' + baseKey + '.webp', 'an evolved unit key should resolve to its baseKey\'s file, not its own');

            assert.equal(h.context.getPortraitUrl('kael'), 'assets/portraits/hero_kael.webp', 'a hero key should resolve to hero_<key>.webp');
            assert.equal(h.context.getPortraitUrl('veil_warden'), 'assets/portraits/boss_veil_warden.webp', 'a boss key should resolve to boss_<key>.webp');

            assert.equal(h.context.getPortraitUrl('this_key_does_not_exist'), null, 'an unknown key should resolve to null');
            assert.equal(h.context.getPortraitUrl(null), null, 'a null/undefined key should resolve to null');
            assert.equal(h.context.getPortraitUrl(''), null, 'an empty-string key should resolve to null');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'assets: getBackgroundUrl resolves region 1-8 and \'camp\'; null for anything else',
        fn: function() {
            const h = createHarness({ seed: 2 });
            h.loadScripts();
            h.freshSave();

            for (let r = 1; r <= 8; r++) {
                assert.equal(h.context.getBackgroundUrl(r), 'assets/backgrounds/region' + r + '.webp', 'region ' + r + ' should resolve');
            }
            assert.equal(h.context.getBackgroundUrl('camp'), 'assets/backgrounds/camp.webp', '\'camp\' should resolve to camp.webp');
            assert.equal(h.context.getBackgroundUrl(0), null, 'region 0 (no region context) should resolve to null');
            assert.equal(h.context.getBackgroundUrl(9), null, 'an out-of-range region should resolve to null');
            assert.equal(h.context.getBackgroundUrl(null), null, 'null should resolve to null');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'assets: PORTRAIT_KEYS is a well-formed manifest -- every entry exists in the data layer, count matches 66 units + 6 heroes + 12 bosses, no duplicates',
        fn: function() {
            const h = createHarness({ seed: 3 });
            h.loadScripts();
            h.freshSave();

            const keys = h.context.PORTRAIT_KEYS;
            assert.ok(Array.isArray(keys) && keys.length > 0, 'PORTRAIT_KEYS should be a non-empty array');

            const seen = {};
            let unitCount = 0, heroCount = 0, bossCount = 0;
            const malformed = [];
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];
                if (seen[k]) malformed.push(k + ' (duplicate)');
                seen[k] = true;

                if (k.indexOf('hero_') === 0) {
                    const heroKey = k.substring(5);
                    if (h.context.HERO_DATA[heroKey]) heroCount++;
                    else malformed.push(k + ' (no matching HERO_DATA entry)');
                } else if (k.indexOf('boss_') === 0) {
                    const bossKey = k.substring(5);
                    if (h.context.BOSS_DATA[bossKey]) bossCount++;
                    else malformed.push(k + ' (no matching BOSS_DATA entry)');
                } else {
                    if (h.context.UNIT_TEMPLATES[k]) unitCount++;
                    else malformed.push(k + ' (no matching UNIT_TEMPLATES entry)');
                }
            }

            assert.deepEqual(malformed, [], 'every PORTRAIT_KEYS entry should resolve to a real data-layer entry: ' + malformed.join(', '));
            assert.equal(unitCount, Object.keys(h.context.UNIT_TEMPLATES).length, 'PORTRAIT_KEYS should list every base unit');
            assert.equal(heroCount, Object.keys(h.context.HERO_DATA).length, 'PORTRAIT_KEYS should list every hero');
            assert.equal(bossCount, Object.keys(h.context.BOSS_DATA).length, 'PORTRAIT_KEYS should list every boss');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'assets: roster/collection, unit detail, hero screen, and gacha reveal cards render headlessly with real portrait URLs and do not throw',
        fn: function() {
            const h = createHarness({ seed: 4 });
            h.freshSave();

            assert.doesNotThrow(function() { h.context.showScreen('roster'); }, 'roster/collection screen should render with getPortraitUrl() wired in');
            assert.doesNotThrow(function() { h.context.showUnitDetail('flame_warrior', 'roster'); }, 'unit detail panel should render with a portrait <img>');
            assert.doesNotThrow(function() { h.context.showScreen('heroes'); }, 'hero screen should render with hero portraits wired in');

            const tmpl = h.context.UNIT_TEMPLATES['flame_warrior'];
            let card;
            assert.doesNotThrow(function() { card = h.context.createGachaCard('flame_warrior', tmpl); }, 'createGachaCard() should not throw with a resolvable portrait');
            assert.ok(card.className.indexOf('has-portrait') >= 0, 'the card should carry has-portrait since flame_warrior has an art file');

            assert.doesNotThrow(function() { h.context.showScreen('gacha'); }, 'gacha screen should render');
            assert.doesNotThrow(function() { h.context.uiDoSingleRoll(); }, 'a single gacha roll reveal (portrait-backed card) should not throw');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'assets: a card for a key with no portrait file falls back to the plain gacha-card (no has-portrait class, no throw)',
        fn: function() {
            const h = createHarness({ seed: 5 });
            h.freshSave();

            const fakeTmpl = { name: 'Test Unlisted Unit', cost: 1, element: 'fire', archetype: 'duelist', type: 'warrior' };
            let card;
            assert.doesNotThrow(function() { card = h.context.createGachaCard('unit_key_with_no_art_file', fakeTmpl); }, 'createGachaCard() should not throw for a key getPortraitUrl() cannot resolve');
            assert.ok(card.className.indexOf('has-portrait') < 0, 'a card with no resolvable portrait should not carry has-portrait');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'assets: pixi combat token portrait rendering (fake Sprite/Assets-capable PIXI) does not throw across a full fight',
        fn: function() {
            let outcome;
            assert.doesNotThrow(function() {
                outcome = runSeededSkirmish(101, true);
            }, 'driving RENDER_PIXI.init()/frame()/destroy() with portrait tokens active across a full fight should not throw');
            assert.ok(outcome.renderer, 'RENDERERS.pixi should have registered with the fake Sprite/Assets-capable PIXI stub');
            assert.ok(['win', 'loss', 'draw'].indexOf(outcome.result) >= 0, 'the fight should still resolve to a valid result');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'assets: portrait-token rendering never perturbs combat resolution/RNG -- same seed produces the identical result/tick-count with or without the pixi renderer driving frames',
        fn: function() {
            const withoutPixi = runSeededSkirmish(202, false);
            const withPixi = runSeededSkirmish(202, true);

            assert.deepEqual(
                { result: withPixi.result, ticks: withPixi.ticks },
                { result: withoutPixi.result, ticks: withoutPixi.ticks },
                'combat outcome must be identical whether or not the pixi renderer (with portrait-texture loading/drawing) is driving frames alongside combatTick()'
            );
        }
    }
];

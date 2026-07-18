// =============================================================================
// tests/test-load.js — all game scripts load with no exception; key globals
// exist with the expected shape (GROUND-TRUTH.md §4, §11, §14, §15).
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

module.exports = [
    {
        name: 'all scripts in game-v2.html load order parse and execute without throwing',
        fn: function() {
            const h = createHarness({ seed: 1 });
            assert.doesNotThrow(function() { h.loadScripts(); }, 'script load order should execute cleanly');
        }
    },
    {
        name: 'UNIT_TEMPLATES has 66 base units',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const keys = Object.keys(h.context.UNIT_TEMPLATES);
            assert.equal(keys.length, 66, 'UNIT_TEMPLATES key count');
        }
    },
    {
        name: 'EVOLVED_TEMPLATES has 66 evolved forms',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const keys = Object.keys(h.context.EVOLVED_TEMPLATES);
            assert.equal(keys.length, 66, 'EVOLVED_TEMPLATES key count');
        }
    },
    {
        name: 'STAGES / STORY_MISSIONS has 74 entries and STORY_MISSIONS === STAGES',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            assert.equal(h.context.STAGES.length, 74, 'STAGES length');
            assert.equal(h.context.STORY_MISSIONS.length, 74, 'STORY_MISSIONS length');
        }
    },
    {
        name: 'STAGES has 9/9/9/9/10/10/10/8 stages per region (8 regions, 74 total)',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const expected = { 1: 9, 2: 9, 3: 9, 4: 9, 5: 10, 6: 10, 7: 10, 8: 8 };
            const counts = {};
            h.context.STAGES.forEach(function(s) { counts[s.region] = (counts[s.region] || 0) + 1; });
            Object.keys(expected).forEach(function(r) {
                assert.equal(counts[r], expected[r], 'region ' + r + ' stage count');
            });
        }
    },
    {
        name: 'HEROES (HERO_DATA) defines the 6-hero roster',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const heroKeys = Object.keys(h.context.HERO_DATA);
            assert.equal(heroKeys.length, 6, 'HERO_DATA key count');
            ['kael', 'lyric', 'ren', 'sera', 'maren', 'voss'].forEach(function(k) {
                assert.ok(heroKeys.indexOf(k) >= 0, 'HERO_DATA missing hero: ' + k);
            });
        }
    },
    {
        name: 'save version is 12',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            assert.equal(h.context.SAVE_VERSION, 12, 'SAVE_VERSION');
        }
    },
    {
        name: 'freshSave() boots the game to the hub screen with a valid default save',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            assert.equal(sd.version, 12, 'fresh save version');
            assert.equal(sd.player.veilEssence, 500, 'starting VE');
            assert.equal(sd.player.level, 1, 'starting level');
            assert.ok(Object.keys(sd.collection).length >= 10, 'starter collection should have at least 10 units');
        }
    },
    {
        name: 'ELEMENTS defines 6 elements (Fire/Water/Earth/Wind/Lightning/Force)',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const keys = Object.keys(h.context.ELEMENTS);
            assert.equal(keys.length, 6, 'ELEMENTS key count');
        }
    },
    {
        name: 'ARCHETYPES defines 9 archetypes',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const keys = Object.keys(h.context.ARCHETYPES);
            assert.equal(keys.length, 9, 'ARCHETYPES key count');
        }
    }
];

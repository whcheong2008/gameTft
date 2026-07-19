// =============================================================================
// tests/test-ui-gacha.js — Prompt 78 (Phase 6.3: gacha summon ceremony)
// acceptance tests. Headless coverage for the presentation-only rebuild of
// the summon screen: altar/circle/panel DOM builds once, the single- and
// multi-roll ceremonies still deduct VE and mutate the collection exactly
// like doSingleRoll()/doMultiRoll() always did, reveal elements exist
// immediately (no JS timer to pump -- see js/ui-gacha.js's header comment
// for why), and the reduced-motion path produces the identical DOM
// synchronously. Does not duplicate tests/test-gacha.js's roll-distribution/
// pity coverage -- this file only exercises the UI layer on top of it.
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

module.exports = [
    // ---------------------------------------------------------------
    {
        name: 'ui-gacha: gacha screen renders headlessly via showScreen() and builds the altar/circle/panel skeleton',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.freshSave();

            assert.doesNotThrow(function() {
                h.context.showScreen('gacha');
            }, 'showScreen(\'gacha\') should not throw');

            const screen = h.document.getElementById('screen-gacha');
            assert.ok(screen.innerHTML && screen.innerHTML.length > 0, 'ensureGachaCeremonyDom() should have populated #screen-gacha');
            assert.ok(screen.innerHTML.indexOf('gacha-altar-scene') >= 0, 'the altar scene wrapper should be present');
            assert.ok(screen.innerHTML.indexOf('gacha-summon-circle') >= 0, 'the summon circle centerpiece should be present');
            assert.ok(screen.innerHTML.indexOf('gacha-rates-panel') >= 0, 'the collapsible rates/pity sv-panel should be present');

            const backdrop = h.document.getElementById('gacha-altar-backdrop');
            assert.ok(backdrop._html && backdrop._html.length > 0, 'buildGachaAltarBackdrop() should have populated #gacha-altar-backdrop');

            // Every id the rest of the UI (renderShopUI, button state) still
            // reaches for directly must resolve, even though they're built
            // dynamically now instead of living in game-v2.html's markup.
            const ids = ['gacha-rates', 'btn-roll-1', 'btn-roll-10', 'gacha-roll-results', 'gacha-shop', 'gacha-pity-info'];
            for (let i = 0; i < ids.length; i++) {
                assert.ok(h.document.getElementById(ids[i]), '#' + ids[i] + ' should exist after rendering the gacha screen');
            }
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'ui-gacha: altar backdrop and ceremony skeleton build once and are idempotent across re-renders',
        fn: function() {
            const h = createHarness({ seed: 2 });
            h.freshSave();
            h.context.showScreen('gacha');

            const screen = h.document.getElementById('screen-gacha');
            const backdrop = h.document.getElementById('gacha-altar-backdrop');
            const firstScreenHtml = screen.innerHTML;
            const firstBackdropHtml = backdrop._html;

            assert.doesNotThrow(function() { h.context.renderGachaScreen(); }, 're-rendering the gacha screen should not throw');
            assert.doesNotThrow(function() { h.context.renderGachaScreen(); }, 'a third render should not throw either');

            assert.equal(screen.innerHTML, firstScreenHtml, 'the ceremony skeleton should not be rebuilt on later renders');
            assert.equal(backdrop._html, firstBackdropHtml, 'the altar backdrop should not be rebuilt on later renders');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'ui-gacha: rates panel toggle and ceremony skip handlers are wired and callable without throwing',
        fn: function() {
            const h = createHarness({ seed: 3 });
            h.freshSave();
            h.context.showScreen('gacha');

            const panel = h.document.getElementById('gacha-rates-panel');
            assert.ok(!panel.classList.contains('collapsed'), 'the rates/pity panel should start expanded');

            assert.doesNotThrow(function() { h.context.toggleGachaRatesPanel(); }, 'toggleGachaRatesPanel() should not throw');
            assert.ok(panel.classList.contains('collapsed'), 'toggling once should collapse the panel');
            h.context.toggleGachaRatesPanel();
            assert.ok(!panel.classList.contains('collapsed'), 'toggling twice should re-expand the panel');

            const altarContent = h.document.getElementById('gacha-altar-content');
            assert.ok(!altarContent.classList.contains('gacha-skip-anim'), 'skip-anim should not be set before any click');
            assert.doesNotThrow(function() { h.context.skipGachaCeremonyAnim(); }, 'skipGachaCeremonyAnim() should not throw');
            assert.ok(altarContent.classList.contains('gacha-skip-anim'), 'skipGachaCeremonyAnim() should mark the altar content as skipped');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'ui-gacha: single-roll ceremony spends VE, updates the collection, and the reveal card exists synchronously (no timer needed)',
        fn: function() {
            const h = createHarness({ seed: 4 });
            const sd = h.freshSave();
            sd.player.veilEssence = 1000;
            h.context.showScreen('gacha');

            const veBefore = sd.player.veilEssence;
            const rollsBefore = sd.stats.totalRolls;

            assert.doesNotThrow(function() { h.context.uiDoSingleRoll(); }, 'uiDoSingleRoll() should not throw');

            assert.equal(sd.player.veilEssence, veBefore - h.context.ROLL_COST, 'a single rite should deduct ROLL_COST VE');
            assert.equal(sd.stats.totalRolls, rollsBefore + 1, 'totalRolls should increment by 1');

            const results = h.document.getElementById('gacha-roll-results');
            assert.equal(results.children.length, 2, 'results should contain the header + one card slot');
            const slot = results.children[1];
            assert.ok(slot.className.indexOf('gacha-card-slot') >= 0, 'the second child should be the card slot');

            // The slot holds [burst, card] -- the flip card should already
            // be present and revealed (is-facedown removed) synchronously.
            assert.equal(slot.children.length, 2, 'the slot should contain a burst element and the card');
            const card = slot.children[1];
            assert.ok(card.classList.contains('gacha-flip-card'), 'the card should carry the ceremony flip class');
            assert.ok(!card.classList.contains('is-facedown'), 'the card should already be revealed (is-facedown removed) synchronously -- no setTimeout to pump');
            assert.ok(card.innerHTML.indexOf('card-unit-name') >= 0, 'the card should render unit content');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'ui-gacha: multi-roll ceremony spends the multi-roll cost, fills a 10-card grid, and appends a new/dupes/highest-tier summary',
        fn: function() {
            const h = createHarness({ seed: 5 });
            const sd = h.freshSave();
            sd.player.veilEssence = 5000;
            h.context.showScreen('gacha');

            const veBefore = sd.player.veilEssence;
            const cost = h.context.getMultiRollCost(sd);

            assert.doesNotThrow(function() { h.context.uiDoMultiRoll(); }, 'uiDoMultiRoll() should not throw');

            assert.equal(sd.player.veilEssence, veBefore - cost, 'a 10-rite should deduct getMultiRollCost() VE');

            const results = h.document.getElementById('gacha-roll-results');
            // children: [header, grid, summary]
            assert.equal(results.children.length, 3, 'results should contain header + grid + summary row');
            const grid = results.children[1];
            assert.ok(grid.className.indexOf('gacha-multi-grid') >= 0, 'the second child should be the multi-roll grid');
            assert.equal(grid.children.length, 10, 'the grid should contain exactly 10 card slots');

            for (let i = 0; i < grid.children.length; i++) {
                const slot = grid.children[i];
                assert.equal(slot.children.length, 2, 'each slot should contain a burst element and the card');
                const card = slot.children[1];
                assert.ok(card.classList.contains('gacha-flip-card'), 'every card should carry the ceremony flip class');
                assert.ok(!card.classList.contains('is-facedown'), 'every card should already be revealed synchronously');
            }

            const summary = results.children[2];
            assert.equal(summary.id, 'gacha-multi-summary', 'the summary row should be the third child');
            assert.ok(summary.innerHTML.indexOf('new') >= 0, 'the summary should report a new-unit count');
            assert.ok(summary.innerHTML.indexOf('dupe') >= 0, 'the summary should report a dupe count');
            assert.ok(summary.innerHTML.indexOf('Best:') >= 0, 'the summary should report the highest tier pulled');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'ui-gacha: reduced-motion path renders the exact same DOM synchronously -- no matchMedia branching in ui-gacha.js',
        fn: function() {
            const h = createHarness({ seed: 6 });
            const sd = h.freshSave();
            sd.player.veilEssence = 5000;
            h.context.showScreen('gacha');

            // This file never queries matchMedia() -- every reveal stage is
            // a CSS transition, and reduced-motion is handled entirely by
            // game-v2.html's `@media (prefers-reduced-motion: reduce)`
            // block collapsing those transitions to instant. Prove there's
            // nothing here for that media query to race against: the full
            // result set (single AND multi) is already present in the DOM,
            // fully revealed, the instant these calls return -- exactly
            // what "collapses to instant reveals" requires, with or
            // without a real browser's animation clock running.
            const uiGachaJs = require('fs').readFileSync(require('path').join(__dirname, '..', 'js', 'ui-gacha.js'), 'utf8');
            assert.ok(uiGachaJs.indexOf('matchMedia') < 0, 'ui-gacha.js should not need to query matchMedia() itself -- CSS alone should gate the ceremony animations');

            h.context.uiDoSingleRoll();
            const singleResults = h.document.getElementById('gacha-roll-results');
            const singleCard = singleResults.children[1].children[1];
            assert.ok(!singleCard.classList.contains('is-facedown'), 'single-roll reveal should be instantly present, no timer pump required');

            sd.player.veilEssence = 5000;
            h.context.uiDoMultiRoll();
            const multiResults = h.document.getElementById('gacha-roll-results');
            const grid = multiResults.children[1];
            assert.equal(grid.children.length, 10, 'multi-roll reveal should be instantly present, no timer pump required');
            for (let i = 0; i < grid.children.length; i++) {
                assert.ok(!grid.children[i].children[1].classList.contains('is-facedown'), 'card ' + i + ' should already be revealed');
            }
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'ui-gacha: insufficient VE leaves the ceremony untouched (doSingleRoll/doMultiRoll failure short-circuits before any DOM work)',
        fn: function() {
            const h = createHarness({ seed: 7 });
            const sd = h.freshSave();
            sd.player.veilEssence = 0;
            h.context.showScreen('gacha');

            const results = h.document.getElementById('gacha-roll-results');
            assert.equal(results.children.length, 0, 'results should start empty');

            assert.doesNotThrow(function() { h.context.uiDoSingleRoll(); }, 'uiDoSingleRoll() with 0 VE should not throw');
            assert.equal(results.children.length, 0, 'a failed single roll should not touch the results container');

            assert.doesNotThrow(function() { h.context.uiDoMultiRoll(); }, 'uiDoMultiRoll() with 0 VE should not throw');
            assert.equal(results.children.length, 0, 'a failed multi roll should not touch the results container');

            assert.equal(sd.player.veilEssence, 0, 'VE should be unchanged after failed rolls');
        }
    }
];

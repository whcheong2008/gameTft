// =============================================================================
// tests/test-ui-smoke.js — Prompt 77 (Phase 6.1/6.2: design system + hub
// redesign) acceptance tests. Headless coverage for the presentation-only
// changes this prompt made: showScreen() driving every major screen (+ the
// new screen-transition class hook) with zero exceptions, the hub camp
// scene's building-card render path, the settings drawer toggle, and the
// design-system-migrated showToast()/showConfirmDialog(). None of this
// touches combat/economy logic -- see tests/test-load.js and friends for
// that -- this file exists purely to catch a broken render/onclick wiring
// the other suites wouldn't notice (they don't drive showScreen() at all).
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

module.exports = [
    // ---------------------------------------------------------------
    {
        name: 'ui-smoke: every SCREENS entry renders via showScreen() with no exception, freshSave()',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.freshSave();

            assert.ok(Array.isArray(h.context.SCREENS) && h.context.SCREENS.length > 0, 'SCREENS should be a non-empty array');

            for (let i = 0; i < h.context.SCREENS.length; i++) {
                const screenId = h.context.SCREENS[i];
                assert.doesNotThrow(function() {
                    h.context.showScreen(screenId);
                }, 'showScreen(\'' + screenId + '\') should not throw');
                assert.equal(h.context.currentScreen, screenId, 'currentScreen should update to ' + screenId);
            }
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'ui-smoke: showScreen() toggles the .active class and re-adds .sv-screen-enter on the target screen only',
        fn: function() {
            const h = createHarness({ seed: 2 });
            h.freshSave();

            h.context.showScreen('gacha');
            const gachaEl = h.document.getElementById('screen-gacha');
            const hubEl = h.document.getElementById('screen-hub');

            assert.ok(gachaEl.classList.contains('active'), 'the target screen should carry the .active class');
            assert.ok(gachaEl.classList.contains('sv-screen-enter'), 'the target screen should carry the transition-entry class');
            assert.ok(!hubEl.classList.contains('active'), 'the previous screen should lose the .active class');

            // Switching back and forth should keep working (re-triggering the
            // same transition class twice in a row is the "reflow to restart
            // the animation" path -- must not throw headlessly).
            assert.doesNotThrow(function() {
                h.context.showScreen('hub');
                h.context.showScreen('gacha');
                h.context.showScreen('gacha');
            }, 'repeated/duplicate showScreen() calls should not throw');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'ui-smoke: hub camp backdrop builds once and is idempotent across re-renders',
        fn: function() {
            const h = createHarness({ seed: 3 });
            h.freshSave();
            h.context.showScreen('hub');

            const backdrop = h.document.getElementById('hub-camp-backdrop');
            assert.ok(backdrop._html && backdrop._html.length > 0, 'buildHubCampBackdrop() should have populated #hub-camp-backdrop');
            const firstHtml = backdrop._html;

            assert.doesNotThrow(function() { h.context.renderHubScreen(); }, 're-rendering the hub screen should not throw');
            assert.equal(backdrop._html, firstHtml, 'the backdrop should not be rebuilt on a second render (idempotent per element)');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'ui-smoke: hub building cards render with camp-scene classes, a tooltip, and correct click wiring per building',
        fn: function() {
            const h = createHarness({ seed: 4 });
            const sd = h.freshSave();
            h.context.showScreen('hub');

            const grid = h.document.getElementById('buildings-grid');
            assert.ok(grid.children.length > 0, 'buildings-grid should have rendered at least one building card');

            const bldKeys = Object.keys(h.context.BUILDINGS);
            assert.equal(grid.children.length, bldKeys.length, 'one card per BUILDINGS entry');

            for (let i = 0; i < grid.children.length; i++) {
                const card = grid.children[i];
                assert.ok(card.className.indexOf('hub-building') >= 0, 'every card should carry the hub-building class');
                assert.ok(card.className.indexOf('sv-panel') >= 0, 'every card should use the sv-panel design-system component');
                const bId = card.getAttribute('data-building');
                assert.ok(bldKeys.indexOf(bId) >= 0, 'data-building should name a real BUILDINGS key: ' + bId);

                if (card.className.indexOf('is-locked') < 0) {
                    assert.ok(card.getAttribute('data-tooltip'), 'an unlocked card should carry a data-tooltip with its current bonus/cost');
                }
            }
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'ui-smoke: clicking an upgradeable building card upgrades it (unchanged upgrade logic, new card markup)',
        fn: function() {
            const h = createHarness({ seed: 5 });
            const sd = h.freshSave();
            sd.player.veilEssence = 100000;
            h.context.saveGame(sd);
            h.context.showScreen('hub');

            // essence_reservoir has no panel and no prereq -- always clickable to upgrade.
            const before = h.context.getBuildingLevel(h.context.getSaveData(), 'essence_reservoir');
            const grid = h.document.getElementById('buildings-grid');
            let target = null;
            for (let i = 0; i < grid.children.length; i++) {
                if (grid.children[i].getAttribute('data-building') === 'essence_reservoir') { target = grid.children[i]; break; }
            }
            assert.ok(target, 'expected to find the essence_reservoir building card');
            assert.equal(typeof target.onclick, 'function', 'an upgradeable building card should have an onclick handler');

            // showConfirmDialog is used by uiUpgradeBuilding -- drive it through
            // exactly like a real click + confirm would.
            target.onclick();
            const okBtn = h.document.getElementById('confirm-ok');
            assert.ok(okBtn && typeof okBtn.onclick === 'function', 'confirming the upgrade dialog should be possible');
            okBtn.onclick();

            const after = h.context.getBuildingLevel(h.context.getSaveData(), 'essence_reservoir');
            assert.ok(after > before, 'clicking + confirming an upgradeable building card should raise its level');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'ui-smoke: settings drawer toggles the .show class on both the drawer and scrim without throwing',
        fn: function() {
            const h = createHarness({ seed: 6 });
            h.freshSave();
            h.context.showScreen('hub');

            const drawer = h.document.getElementById('hub-settings-drawer');
            const scrim = h.document.getElementById('hub-settings-scrim');

            assert.doesNotThrow(function() { h.context.toggleHubSettingsDrawer(true); }, 'opening the settings drawer should not throw');
            assert.ok(drawer.classList.contains('show'), 'drawer should carry .show when opened');
            assert.ok(scrim.classList.contains('show'), 'scrim should carry .show when opened');

            assert.doesNotThrow(function() { h.context.toggleHubSettingsDrawer(false); }, 'closing the settings drawer should not throw');
            assert.ok(!drawer.classList.contains('show'), 'drawer should lose .show when closed');
            assert.ok(!scrim.classList.contains('show'), 'scrim should lose .show when closed');

            // No-arg call toggles from current state.
            assert.doesNotThrow(function() { h.context.toggleHubSettingsDrawer(); }, 'toggling with no argument should not throw');
            assert.ok(drawer.classList.contains('show'), 'no-arg toggle should have opened the drawer (it was closed)');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'ui-smoke: showToast() creates a design-system-styled element and does not throw',
        fn: function() {
            const h = createHarness({ seed: 7 });
            h.freshSave();

            const before = h.document.body.children.length;
            assert.doesNotThrow(function() { h.context.showToast('Test message'); }, 'showToast() should not throw');
            assert.equal(h.document.body.children.length, before + 1, 'showToast() should append one element to <body>');

            const toastEl = h.document.body.children[h.document.body.children.length - 1];
            assert.ok(toastEl.style.cssText.indexOf('var(--sv-gold)') >= 0, 'the toast should be styled via design-system tokens, not a hardcoded hex');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'ui-smoke: showConfirmDialog() builds an .sv-modal-backdrop/.sv-modal-panel and invokes the right callback',
        fn: function() {
            const h = createHarness({ seed: 8 });
            h.freshSave();

            let confirmed = false;
            let cancelled = false;
            assert.doesNotThrow(function() {
                h.context.showConfirmDialog('Are you sure?', function() { confirmed = true; }, function() { cancelled = true; });
            }, 'showConfirmDialog() should not throw');

            const overlay = h.document.getElementById('confirm-overlay');
            // Note: tests/harness.js's document.getElementById() always
            // auto-vivifies a stub for any id (never returns null like a real
            // browser would for an unseen id), so showConfirmDialog()'s
            // `if (!overlay) { ...set className/append... }` "create once"
            // branch structurally never runs here -- that's a pre-existing
            // harness characteristic shared by every lazy-overlay function in
            // this codebase (achievements/stats/lore/etc.), not something new.
            // overlay.innerHTML is set unconditionally on every call, though,
            // so the markup itself is fully verifiable via the raw string.
            assert.ok(overlay.innerHTML.indexOf('sv-modal-panel') >= 0, 'the confirm dialog markup should use the sv-modal-panel component');
            assert.ok(overlay.innerHTML.indexOf('sv-btn-primary') >= 0, 'the OK button markup should use sv-btn-primary');
            assert.ok(overlay.innerHTML.indexOf('id="confirm-cancel" class="sv-btn"') >= 0, 'the Cancel button markup should use sv-btn');

            const okBtn = h.document.getElementById('confirm-ok');
            okBtn.onclick();
            assert.ok(confirmed, 'clicking OK should invoke onConfirm');
            assert.ok(!cancelled, 'clicking OK should not invoke onCancel');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'ui-smoke: the bottom nav dock routes to the same functions the pre-redesign hub-nav buttons called (source scan)',
        fn: function() {
            const fs = require('fs');
            const path = require('path');
            const html = fs.readFileSync(path.join(__dirname, '..', 'game-v2.html'), 'utf8');
            const hubBlock = html.slice(html.indexOf('id="screen-hub"'), html.indexOf('id="screen-gacha"'));

            const expectedCalls = [
                "showScreen('gacha')",
                "showScreen('roster')",
                'uiOpenTeamBuilderStandalone()',
                "showScreen('mission-select')",
                "showScreen('heroes')",
                'showLoreCodex()',
                'uiToggleItemBench()'
            ];
            for (let i = 0; i < expectedCalls.length; i++) {
                assert.ok(hubBlock.indexOf(expectedCalls[i]) >= 0, 'hub screen markup should still wire up: ' + expectedCalls[i]);
            }
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'ui-smoke: reduced-motion is handled in CSS, not by branching in showScreen()\'s source (game-v2.html)',
        fn: function() {
            const fs = require('fs');
            const path = require('path');
            const html = fs.readFileSync(path.join(__dirname, '..', 'game-v2.html'), 'utf8');
            assert.ok(/prefers-reduced-motion:\s*no-preference/.test(html), 'the screen-transition animation should be scoped to a prefers-reduced-motion: no-preference media query');

            const hubJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'hub.js'), 'utf8');
            assert.ok(hubJs.indexOf('matchMedia') < 0, 'showScreen() should not need to query matchMedia() itself -- CSS alone should gate the animation, keeping the hook safe to call headlessly');
        }
    }
];

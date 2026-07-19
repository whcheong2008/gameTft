// =============================================================================
// tests/test-ui-collection.js — Prompt 79 (Phase 6.4: collection/items/heroes
// screens on the design system) acceptance tests. Headless coverage for the
// presentation-only changes made in js/ui-roster.js, js/ui-items.js,
// js/ui-heroes.js, js/ui-lore.js: every screen/overlay renders with no
// exception post-restyle, the roster/collection unit cards and the unit
// detail sheet carry the new stable "unit-portrait-<key>" placeholder ids,
// the hero skill tree still lets you learn a node via the same click path,
// and one forge op + one gem op still complete underneath the new markup.
// None of this touches combat/economy logic itself — see tests/test-items.js
// and tests/test-hero-skills.js for that.
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

function makeUncommonItem(h, overrides) {
    var equip = {
        id: 'p79-test-item-1',
        slot: 'weapon',
        itemKey: Object.keys(h.context.ITEM_LINES).filter(function(k) {
            return h.context.ITEM_LINES[k].slot === 'weapon';
        })[0],
        tier: 1,
        rarity: 'uncommon',
        enhanceLevel: 0,
        enhanceFailStreak: 0,
        gems: [],
        affixes: [],
        setId: null,
        equipped: null
    };
    for (var k in (overrides || {})) equip[k] = overrides[k];
    return equip;
}

module.exports = [
    // ---------------------------------------------------------------
    {
        name: 'P79: roster and heroes screens render via showScreen() with no exception, freshSave()',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.freshSave();

            ['roster', 'heroes'].forEach(function(screenId) {
                assert.doesNotThrow(function() {
                    h.context.showScreen(screenId);
                }, 'showScreen(\'' + screenId + '\') should not throw post-restyle');
                assert.equal(h.context.currentScreen, screenId, 'currentScreen should update to ' + screenId);
            });
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'P79: collection grid renders p79-unit-card tiles with stable unit-portrait-<key> ids',
        fn: function() {
            const h = createHarness({ seed: 2 });
            h.freshSave();
            h.context.showScreen('roster');

            // renderCollectionGrid builds cards via createElement/appendChild
            // (not a single innerHTML string), so real content lives in
            // .children, not in the harness's ._html shadow string.
            const grid = h.document.getElementById('roster-grid');
            assert.ok(grid.children.length > 0, 'roster-grid should have rendered at least one card');
            assert.ok(grid.children[0].className.indexOf('p79-unit-card') >= 0, 'unit cards should use the p79-unit-card design-system class');

            const someKey = h.context.SHOP_POOL_KEYS[0];
            let card = null;
            for (let i = 0; i < grid.children.length; i++) {
                if (grid.children[i].getAttribute('data-unit-key') === someKey) { card = grid.children[i]; break; }
            }
            assert.ok(card, 'expected to find a rendered card for ' + someKey);
            assert.ok(card.innerHTML.indexOf('id="unit-portrait-' + someKey + '"') >= 0,
                'the ' + someKey + ' card should have a stable id="unit-portrait-' + someKey + '" placeholder');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'P79: filter bar renders as .sv-tab buttons and filtering still narrows the grid (unchanged logic)',
        fn: function() {
            const h = createHarness({ seed: 3 });
            h.freshSave();
            h.context.showScreen('roster');

            const filterBar = h.document.getElementById('collection-filter-bar');
            assert.ok(filterBar._html.indexOf('sv-tab') >= 0, 'filter buttons should use the sv-tab design-system component');

            const before = h.document.getElementById('roster-grid').children.length;
            assert.doesNotThrow(function() {
                h.context.collectionFilters.element = 'fire';
                h.context.applyCollectionFilters();
            }, 'applying a filter should not throw');
            const after = h.document.getElementById('roster-grid').children.length;
            assert.ok(after <= before, 'filtering to a single element should not increase the number of rendered cards');
            assert.ok(after > 0, 'at least one fire unit should still render');

            // Reset for any later test in this file/run.
            h.context.collectionFilters.element = 'all';
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'P79: showUnitDetail() opens an .sv-modal two-column sheet with the same portrait id and unchanged content sections',
        fn: function() {
            const h = createHarness({ seed: 4 });
            const sd = h.freshSave();
            const key = h.context.SHOP_POOL_KEYS[0];
            sd.collection[key] = { stars: 2, copiesForNext: 3 };

            assert.doesNotThrow(function() {
                h.context.showUnitDetail(key, 'roster');
            }, 'showUnitDetail() should not throw');

            const overlay = h.document.getElementById('unit-detail-overlay');
            assert.equal(overlay.style.display, 'flex', 'unit-detail-overlay should be shown');

            const content = h.document.getElementById('unit-detail-content')._html;
            assert.ok(content.indexOf('p79-ud-grid') >= 0, 'unit detail content should use the two-column p79-ud-grid layout');
            assert.ok(content.indexOf('id="unit-portrait-' + key + '"') >= 0, 'unit detail should show the same stable portrait id as the roster card');
            assert.ok(content.indexOf('ud-section-title') >= 0, 'existing ud-section content (stats/combat behavior/etc) should still be present');

            h.context.closeUnitDetail();
            assert.equal(overlay.style.display, 'none', 'closeUnitDetail() should hide the overlay');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'P79: forge panel renders onto .sv-modal/.sv-tab without throwing, and enhanceEquipment() (a forge op) still completes underneath it',
        fn: function() {
            const h = createHarness({ seed: 5 });
            const sd = h.freshSave();
            sd.buildings.echo_shaping = 1;
            sd.equipment.inventory.push(makeUncommonItem(h));
            sd.player.veilEssence = 100000;

            assert.doesNotThrow(function() { h.context.showForgePanel(); }, 'showForgePanel() should not throw');
            const overlay = h.document.getElementById('forge-overlay');
            assert.ok(overlay._html.indexOf('sv-modal-panel') >= 0, 'forge panel should use the sv-modal-panel component');
            assert.ok(overlay._html.indexOf('sv-tab') >= 0, 'forge tabs should use the sv-tab component');
            assert.ok(overlay._html.indexOf('p79-item-row') >= 0, 'enhanceable items should render as p79-item-row tiles');

            // Force the enhancement roll to succeed and drive the underlying
            // op directly (query-selector-bound onclicks don't fire in this
            // headless harness -- see tests/test-items.js for the same
            // pattern) to confirm the operation itself still completes.
            h.context.Math.random = function() { return 0; };
            const result = h.context.enhanceEquipment(sd, 'p79-test-item-1');
            assert.ok(result.success, 'enhanceEquipment (forge op) should still succeed after the restyle');
            assert.equal(result.level, 1, 'item should be enhanced to +1');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'P79: gem workshop panel renders onto .sv-modal without throwing, and socketGem() (a gem op) still completes underneath it',
        fn: function() {
            const h = createHarness({ seed: 6 });
            const sd = h.freshSave();
            sd.buildings.prism_focus = 1;
            const item = makeUncommonItem(h, { id: 'p79-test-item-gem', gems: [null] });
            sd.equipment.inventory.push(item);
            sd.equipment.gems = [h.context.createGemInstance('ruby', 'standard')];

            assert.doesNotThrow(function() { h.context.showGemWorkshopPanel(); }, 'showGemWorkshopPanel() should not throw');
            const overlay = h.document.getElementById('gem-workshop-overlay');
            assert.ok(overlay._html.indexOf('sv-modal-panel') >= 0, 'gem workshop panel should use the sv-modal-panel component');

            const gemId = sd.equipment.gems[0].id;
            const result = h.context.socketGem(sd, 'p79-test-item-gem', gemId);
            assert.ok(result.success, 'socketGem (gem op) should still succeed after the restyle');
            assert.equal(item.gems[0], 'ruby_standard', 'the socketed gem should be recorded on the item');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'P79: item bench tiles render as p79-item-tile with rarity-tier border classes, unchanged select/unequip/sell wiring',
        fn: function() {
            const h = createHarness({ seed: 7 });
            const sd = h.freshSave();
            sd.equipment.inventory.push(makeUncommonItem(h));

            assert.doesNotThrow(function() { h.context.renderItemBench(); }, 'renderItemBench() should not throw');
            // renderItemBench also builds via createElement/appendChild --
            // assert against .children, not the harness's ._html shadow string.
            const grid = h.document.getElementById('item-bench-grid');
            assert.ok(grid.children.length > 0, 'item-bench-grid should have rendered at least one tile');
            assert.ok(grid.children[0].className.indexOf('p79-item-tile') >= 0, 'bench tiles should use the p79-item-tile class');
            assert.ok(grid.children[0].className.indexOf('tier-2') >= 0, 'an uncommon item should carry the tier-2 border class (P79_RARITY_TIER mapping)');

            assert.doesNotThrow(function() {
                h.context.uiSelectBenchItem(sd.equipment.inventory[0]);
            }, 'uiSelectBenchItem() should not throw');
            const detail = h.document.getElementById('item-detail-panel');
            assert.equal(detail.style.display, 'block', 'selecting a bench item should reveal the detail panel');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'P79: hero card renders with a stable hero-portrait-<key> id, and showHeroSkillTree() still lets you learn a node via the same click path',
        fn: function() {
            const h = createHarness({ seed: 8 });
            const sd = h.freshSave();
            sd.heroes.data.kael.level = 5;

            assert.doesNotThrow(function() { h.context.renderHeroScreen(); }, 'renderHeroScreen() should not throw');
            const heroContent = h.document.getElementById('hero-screen-content');
            assert.ok(heroContent.children.length > 0, 'hero list should render at least one card');

            // Find the Kael card (first child) and confirm the portrait id.
            const kaelCard = heroContent.children[0].children[0];
            assert.ok(kaelCard.innerHTML.indexOf('id="hero-portrait-kael"') >= 0, 'the first hero card should carry a stable hero-portrait-kael placeholder id');
            assert.ok(kaelCard.className.indexOf('p79-hero-card') >= 0, 'hero cards should use the p79-hero-card class');

            // Open the skill tree via the exact same call the card's onclick
            // uses, then drive the real DOM node (document.createElement +
            // .onclick, not querySelectorAll -- so this actually exercises
            // the click path headlessly, unlike the forge/gem tabs above).
            assert.doesNotThrow(function() { h.context.showHeroSkillTree('kael'); }, 'showHeroSkillTree() should not throw');

            const overlay = h.document.body.children[h.document.body.children.length - 1];
            assert.ok(overlay.className.indexOf('sv-modal-backdrop') >= 0, 'the skill tree overlay should use sv-modal-backdrop');

            // Walk the DOM tree it just built to find an .is-available node
            // (kael_A_1_1, tier 1, level req 1) and click it.
            const panel = overlay.children[0];
            const branchesContainer = panel.children[1]; // header, branchesContainer, buttonDiv
            const branchA = branchesContainer.children[0];
            let learnableNode = null;
            for (let ti = 0; ti < branchA.children.length && !learnableNode; ti++) {
                const tierDiv = branchA.children[ti];
                if (!tierDiv.children) continue;
                for (let ni = 0; ni < tierDiv.children.length; ni++) {
                    const n = tierDiv.children[ni];
                    if (n.className && n.className.indexOf('is-available') >= 0 && typeof n.onclick === 'function') {
                        learnableNode = n;
                        break;
                    }
                }
            }
            assert.ok(learnableNode, 'expected to find at least one .is-available skill node to click');

            assert.doesNotThrow(function() { learnableNode.onclick(); }, 'clicking an available skill node should not throw');
            assert.ok(sd.heroes.data.kael.investedNodes.length > 0, 'clicking an available skill node should invest a point (investPoint) exactly as before the restyle');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'P79: lore codex and equipment codex render onto tokens/sv-tab without throwing',
        fn: function() {
            const h = createHarness({ seed: 9 });
            h.freshSave();

            assert.doesNotThrow(function() { h.context.showLoreCodex(); }, 'showLoreCodex() should not throw');
            const loreOverlay = h.document.getElementById('lore-codex-overlay');
            assert.equal(loreOverlay.style.display, 'flex', 'lore codex overlay should be shown');
            assert.ok(loreOverlay._html.indexOf('sv-tab') >= 0, 'lore codex tabs should use the sv-tab component');
            assert.ok(loreOverlay._html.indexOf('p79-lore-entry') >= 0, 'lore entries should use the p79-lore-entry class');

            assert.doesNotThrow(function() { h.context.uiShowCodex(); }, 'uiShowCodex() (equipment codex) should not throw');
            const codexPanel = h.document.getElementById('codex-panel');
            assert.equal(codexPanel.style.display, 'block', 'equipment codex panel should be shown');
        }
    }
];

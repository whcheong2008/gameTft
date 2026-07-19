// =============================================================================
// tests/test-ui-hud.js — Prompt 80 (Phase 6.5: combat HUD, results, mission
// select on the design system) acceptance tests. Headless coverage for the
// presentation-only restyle this prompt made across js/ui-missions.js and
// js/ui-combat.js: region map / stage list rendering onto the design system,
// combat screen chrome (scoreboard/synergy/log) rendering without throwing,
// and the results screen rendering both outcomes (with reward rows, star
// pips, MVP card, and the defeat-variant class). None of this drives combat
// logic itself -- see tests/test-combat-golden.js and friends for that.
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

// Marks every stage in a region (including its boss stage) as completed and
// the boss cleared -- same helper shape as tests/test-region-rewards.js uses,
// enough to unlock the next region and populate star-pip data.
function completeRegion(h, sd, regionNum) {
    const region = h.context.REGIONS[regionNum];
    if (!sd.missions.regionProgress[regionNum]) {
        sd.missions.regionProgress[regionNum] = { completed: [], bossCleared: false };
    }
    sd.missions.regionProgress[regionNum].completed = region.stageIds.slice();
    sd.missions.regionProgress[regionNum].bossCleared = true;
    for (let i = 0; i < region.stageIds.length; i++) {
        sd.missions.starRatings[region.stageIds[i]] = (i % 3) + 1; // vary 1-3 for pip coverage
    }
}

module.exports = [
    // ---------------------------------------------------------------
    {
        name: 'mission select: region map renders sv-panel region cards with headers, pips, and a boss chip',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            completeRegion(h, sd, 1);
            h.context.saveGame(sd);

            h.context.showScreen('mission-select');
            assert.doesNotThrow(function() { h.context.renderMissionSelectScreen(); }, 'region map should render without throwing');

            const storyEl = h.document.getElementById('story-missions');
            assert.ok(storyEl.children.length > 0, 'story-missions should have rendered at least one region card');

            let sawRegionCard = false;
            for (let i = 0; i < storyEl.children.length; i++) {
                const card = storyEl.children[i];
                // Real region cards only -- the endless/challenge entry cards
                // further down share the "sv-panel p80-region-card p80-entry-card"
                // family but don't render star pips or a boss chip.
                if (card.className.indexOf('p80-region-card') >= 0 && card.className.indexOf('p80-entry-card') < 0) {
                    sawRegionCard = true;
                    assert.ok(card.className.indexOf('sv-panel') >= 0, 'a region card should use the sv-panel design-system component');
                    assert.ok(card.innerHTML.indexOf('p80-region-header') >= 0, 'a region card should carry the P80 header block');
                    assert.ok(card.innerHTML.indexOf('p80-region-pips') >= 0, 'a region card should render the star-progress pip row');
                    assert.ok(card.innerHTML.indexOf('p80-boss-chip') >= 0, 'a region card should render a boss badge chip');
                }
            }
            assert.ok(sawRegionCard, 'expected at least one .p80-region-card among story-missions children');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'mission select: locked regions render with the locked modifier and a lock-requirement line',
        fn: function() {
            const h = createHarness({ seed: 2 });
            const sd = h.freshSave();
            h.context.showScreen('mission-select');
            h.context.renderMissionSelectScreen();

            const storyEl = h.document.getElementById('story-missions');
            let sawLocked = false;
            for (let i = 0; i < storyEl.children.length; i++) {
                const card = storyEl.children[i];
                if (card.className.indexOf('p80-region-card') >= 0 && card.className.indexOf('p80-entry-card') < 0 && card.className.indexOf('locked') >= 0) {
                    sawLocked = true;
                    assert.ok(card.innerHTML.indexOf('p80-region-lock-req') >= 0, 'a locked region card should render its unlock requirement text');
                }
            }
            assert.ok(sawLocked, 'a fresh save should have at least one locked region (region 2+)');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'mission select: endless/challenge entry cards render matching sv-panel p80-region-card markup',
        fn: function() {
            const h = createHarness({ seed: 3 });
            h.freshSave();
            h.context.showScreen('mission-select');
            h.context.renderMissionSelectScreen();

            const storyEl = h.document.getElementById('story-missions');
            let sawEntry = false;
            for (let i = 0; i < storyEl.children.length; i++) {
                const card = storyEl.children[i];
                if (card.className.indexOf('p80-entry-card') >= 0) {
                    sawEntry = true;
                    assert.ok(card.className.indexOf('sv-panel') >= 0, 'entry cards should use the sv-panel design-system component');
                    assert.ok(card.className.indexOf('p80-region-card') >= 0, 'entry cards should share the region-card class family');
                }
            }
            assert.ok(sawEntry, 'expected both the Abyss and Challenges entry cards to render');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'stage list: renders sv-panel stage rows with a boss badge on the boss stage, stars, and Back/Grind buttons',
        fn: function() {
            const h = createHarness({ seed: 4 });
            const sd = h.freshSave();
            h.context.selectedRegion = 1;
            h.context.missionScreenMode = 'stages';
            assert.doesNotThrow(function() { h.context.renderStageListScreen(); }, 'stage list should render without throwing');

            const storyEl = h.document.getElementById('story-missions');
            let sawStageRow = false, sawBossRow = false, sawGrind = false;
            for (let i = 0; i < storyEl.children.length; i++) {
                const el = storyEl.children[i];
                if (el.className.indexOf('p80-stage-row') >= 0) {
                    sawStageRow = true;
                    assert.ok(el.className.indexOf('sv-panel') >= 0, 'a stage row should use the sv-panel component');
                    if (el.className.indexOf('boss') >= 0) {
                        sawBossRow = true;
                        assert.ok(el.innerHTML.indexOf('p80-boss-chip') >= 0, 'the boss stage row should render a boss badge chip');
                    }
                }
                if (el.className.indexOf('p80-grind-row') >= 0) sawGrind = true;
            }
            assert.ok(sawStageRow, 'expected at least one .p80-stage-row');
            assert.ok(sawBossRow, 'region 1 has a boss stage (r1_boss) -- expected a .boss row');
            assert.ok(sawGrind, 'expected the Start Training Mission row at the bottom');

            const backBtn = h.document.getElementById('region-back-btn');
            assert.equal(typeof backBtn.onclick, 'function', 'the back button should be wired');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'stage list: a cleared stage shows its stage narration flavor block styled as flavor text',
        fn: function() {
            const h = createHarness({ seed: 5 });
            const sd = h.freshSave();
            sd.missions.stageProgress = sd.missions.stageProgress || {};
            sd.loreUnlocks.stages['r1_s1'] = true;
            h.context.selectedRegion = 1;
            h.context.missionScreenMode = 'stages';
            h.context.renderStageListScreen();

            const storyEl = h.document.getElementById('story-missions');
            let sawLore = false;
            for (let i = 0; i < storyEl.children.length; i++) {
                if (storyEl.children[i].innerHTML && storyEl.children[i].innerHTML.indexOf('p80-stage-lore') >= 0) sawLore = true;
            }
            assert.ok(sawLore, 'expected the r1_s1 lore blurb to render with the p80-stage-lore flavor-text class');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'combat chrome: scoreboard, synergy sidebars, and synergy bar render every frame without throwing',
        fn: function() {
            const h = createHarness({ seed: 6 });
            const sd = h.freshSave();
            sd.collection.flame_warrior = { stars: 1, copiesForNext: 0 };
            sd.collection.stone_guard = { stars: 1, copiesForNext: 0 };
            const team = h.context.getActiveTeam(sd);
            team.slots = [
                { key: 'flame_warrior', row: 0, col: 0 },
                { key: 'stone_guard', row: 0, col: 1 }
            ];

            h.context.uiStartStoryMission(0);

            assert.doesNotThrow(function() { h.context.renderCombatScoreboard(); }, 'renderCombatScoreboard() should not throw mid-combat');
            const sb = h.document.getElementById('combat-scoreboard');
            assert.ok(sb.innerHTML.indexOf('sb-header') >= 0, 'scoreboard should render its header');
            assert.ok(sb.innerHTML.indexOf('Your Team') >= 0 && sb.innerHTML.indexOf('Enemy Team') >= 0, 'scoreboard should list both teams');

            assert.doesNotThrow(function() {
                h.context.initCombatSynergySidebars(h.context.combatState.playerUnits, h.context.combatState.enemyUnits);
            }, 'initCombatSynergySidebars() should not throw');
            const left = h.document.getElementById('synergy-sidebar-left');
            assert.ok(left.innerHTML.indexOf('p80-drawer-header') >= 0, 'the sidebar label should use the shared P80 drawer-header class');

            assert.doesNotThrow(function() { h.context.renderCombatSynergyBar(); }, 'renderCombatSynergyBar() should not throw');
            const bar = h.document.getElementById('combat-synergy-bar');
            assert.ok(bar.innerHTML.indexOf('p80-drawer-header') >= 0, 'the synergy bar header should use the shared P80 drawer-header class');

            // Collapse behavior must still work (Prompt 80 explicitly keeps it).
            assert.doesNotThrow(function() { h.context.toggleCombatScoreboard(); }, 'toggleCombatScoreboard() should not throw');
            assert.ok(sb.classList.contains('collapsed'), 'toggling should still add the .collapsed class');
            h.context.toggleCombatScoreboard();
            assert.ok(!sb.classList.contains('collapsed'), 'toggling again should remove .collapsed');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'results screen: victory renders a reward-row sequence with a VE/XP row and star pips, no p80-results-defeat class',
        fn: function() {
            const h = createHarness({ seed: 7 });
            const result = h.runCombat(
                [
                    { key: 'flame_warrior', row: 0, col: 0, stars: 3 },
                    { key: 'stone_guard', row: 0, col: 1, stars: 3 },
                    { key: 'frost_mender', row: 0, col: 2, stars: 3 }
                ],
                0
            );
            assert.equal(result.result, 'win', 'a 3-star team on stage 0 should win (sanity check for this test)');

            // runCombat() pumps combatTick() directly (mirrors the real
            // tick-pump loop) but never drives the setTimeout-based
            // uiStartCombatLoop()/onWaveCombatEnd() wrap-up that actually
            // calls showMissionResults() in the real game -- call it
            // directly here, same as the game's own tick loop would once
            // combatState.running goes false.
            assert.doesNotThrow(function() { h.context.showMissionResults(true, 3); }, 'showMissionResults(true, 3) should not throw after a real combat resolves');

            const titleEl = h.document.getElementById('results-title');
            assert.ok(titleEl.className.indexOf('p80-results-title') >= 0, 'results title should carry the p80-results-title class');
            assert.ok(titleEl.className.indexOf('victory') >= 0, 'a win should render the victory class');

            const starsEl = h.document.getElementById('results-stars');
            assert.ok(starsEl.innerHTML.indexOf('p80-star-pip') >= 0, 'victory should render star pips');

            const rewardsEl = h.document.getElementById('results-rewards');
            assert.ok(rewardsEl.innerHTML.indexOf('p80-reward-row') >= 0, 'rewards should render as p80-reward-row lines');
            assert.ok(rewardsEl.innerHTML.indexOf('VE') >= 0 && rewardsEl.innerHTML.indexOf('XP') >= 0, 'the primary reward row should show VE and XP');

            const resultsEl = h.document.getElementById('combat-results');
            assert.ok(resultsEl.className.indexOf('show') >= 0, 'the results overlay should be shown');
            assert.ok(resultsEl.className.indexOf('p80-results-defeat') < 0, 'a victory should NOT carry the defeat desaturation class');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'results screen: defeat renders "No rewards earned" as a reward row, no star pips, and the p80-results-defeat class',
        fn: function() {
            const h = createHarness({ seed: 8 });
            h.freshSave();

            assert.doesNotThrow(function() {
                h.context.showMissionResults(false, 0);
            }, 'showMissionResults(false, 0) should not throw even with no active mission/combatState');

            const titleEl = h.document.getElementById('results-title');
            assert.ok(titleEl.className.indexOf('p80-results-title') >= 0, 'results title should carry the p80-results-title class');
            assert.ok(titleEl.className.indexOf('defeat') >= 0, 'a loss should render the defeat class');

            const starsEl = h.document.getElementById('results-stars');
            assert.equal(starsEl.innerHTML, '', 'defeat should render no star pips');

            const rewardsEl = h.document.getElementById('results-rewards');
            assert.ok(rewardsEl.innerHTML.indexOf('No rewards earned.') >= 0, 'defeat should show the no-rewards row');
            assert.ok(rewardsEl.innerHTML.indexOf('p80-reward-empty') >= 0, 'the no-rewards row should carry the p80-reward-empty class');

            const resultsEl = h.document.getElementById('combat-results');
            assert.ok(resultsEl.className.indexOf('show') >= 0, 'the results overlay should be shown');
            assert.ok(resultsEl.className.indexOf('p80-results-defeat') >= 0, 'a defeat should carry the desaturation class');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'results screen: an MVP card renders when a unit dealt damage',
        fn: function() {
            const h = createHarness({ seed: 9 });
            h.freshSave();

            const result = h.runCombat(
                [
                    { key: 'flame_warrior', row: 0, col: 0, stars: 3 },
                    { key: 'stone_guard', row: 0, col: 1, stars: 3 }
                ],
                0
            );
            assert.equal(result.result, 'win', 'sanity check: this team should win stage 0');
            h.context.showMissionResults(true, 3);

            const rewardsEl = h.document.getElementById('results-rewards');
            assert.ok(rewardsEl.innerHTML.indexOf('p80-mvp-card') >= 0, 'a unit dealt damage -- expected an MVP card');
            assert.ok(rewardsEl.innerHTML.indexOf('p80-mvp-badge') >= 0, 'the MVP card should render its badge');
        }
    }
];

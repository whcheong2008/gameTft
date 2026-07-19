// =============================================================================
// tests/test-onboarding.js — first-session onboarding flow (Prompt 82, Phase 8.2).
//
// Covers: fresh saves start active / existing (migrated) saves start already
// completed (never surfacing the tutorial to a returning player), the 5-step
// advance sequence via each real hook (onboardingOnScreenChange/
// onboardingOnGachaRoll/onboardingOnTeamBuilderRender/onboardingOnCombatStart/
// onboardingOnMissionResults), dismiss-at-any-step, and that a
// completed/dismissed tutorial never reactivates.
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

module.exports = [
    {
        name: 'onboarding: a genuinely fresh save starts active at step 0',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            assert.ok(sd.onboarding, 'fresh save should have an onboarding field');
            assert.equal(sd.onboarding.step, 0, 'fresh save starts at step 0');
            assert.equal(sd.onboarding.completed, false, 'fresh save onboarding is not completed');
            assert.equal(sd.onboarding.dismissed, false, 'fresh save onboarding is not dismissed');
        }
    },
    {
        name: 'onboarding: an existing save missing the field is backfilled as already-completed (validateSaveData)',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            // Simulates a pre-Prompt-82 save at the current SAVE_VERSION (no
            // migrateSave() pass needed -- version already matches) that has
            // never seen an onboarding field.
            const legacy = { version: h.context.SAVE_VERSION, collection: { flame_warrior: { stars: 2, copiesForNext: 0 } }, player: { level: 5, xp: 0, veilEssence: 100 } };
            const validated = h.context.validateSaveData(legacy);
            assert.ok(validated.onboarding, 'backfilled save should have an onboarding field');
            assert.equal(validated.onboarding.completed, true, 'pre-existing save should be backfilled as already-completed');
            assert.equal(validated.onboarding.dismissed, true, 'pre-existing save should be backfilled as already-dismissed');
        }
    },
    {
        name: 'onboarding: an old-version fixture migrated forward is backfilled as already-completed (migrateSave)',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const fixture = { version: 10, player: { level: 5, xp: 0, veilEssence: 100 }, collection: {}, teams: [{ name: 'Team 1', slots: [] }], activeTeamIndex: 0, buildings: {}, missions: { storyProgress: 0, milestonesClaimed: [] }, stats: {} };
            const migrated = h.context.migrateSave(fixture);
            assert.equal(migrated.version, 12, 'fixture should reach current save version');
            assert.ok(migrated.onboarding, 'migrated save should have an onboarding field');
            assert.equal(migrated.onboarding.completed, true, 'a save that needed migration is a returning player -- backfilled as already-completed');
        }
    },
    {
        name: 'onboarding: full 5-step advance sequence via the real hooks, ending in completion on return to hub',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            const ctx = h.context;

            // Step 0 -> 1: navigating to the gacha screen is the "go summon" goal.
            ctx.onboardingOnScreenChange('gacha');
            assert.equal(sd.onboarding.step, 1, 'reaching the gacha screen should advance step 0 -> 1');

            // Step 1 -> 2: a successful roll.
            ctx.onboardingOnGachaRoll();
            assert.equal(sd.onboarding.step, 2, 'a gacha roll should advance step 1 -> 2');

            // Step 2 stays put below 3 placed units, advances at 3+.
            ctx.onboardingOnTeamBuilderRender(2);
            assert.equal(sd.onboarding.step, 2, 'fewer than 3 placed units should not advance step 2');
            ctx.onboardingOnTeamBuilderRender(3);
            assert.equal(sd.onboarding.step, 3, '3 placed units should advance step 2 -> 3');

            // Step 3 -> 4: combat actually starting.
            ctx.onboardingOnCombatStart();
            assert.equal(sd.onboarding.step, 4, 'combat starting should advance step 3 -> 4');
            assert.equal(sd.onboarding.completed, false, 'should not be marked completed yet at step 4');

            // Step 4 -> completed: returning to the hub after results.
            ctx.onboardingOnMissionResults();
            assert.equal(sd.onboarding.completed, false, 'seeing the results pointer alone should not complete the tutorial');
            ctx.onboardingOnScreenChange('hub');
            assert.equal(sd.onboarding.completed, true, 'returning to hub after step 4 should complete the tutorial');
        }
    },
    {
        name: 'onboarding: Skip Tutorial dismisses immediately regardless of current step',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            const ctx = h.context;
            ctx.onboardingOnScreenChange('gacha'); // step 0 -> 1
            ctx.onboardingDismiss();
            assert.equal(sd.onboarding.dismissed, true, 'dismiss should set dismissed=true');
            assert.equal(ctx.onboardingActive(sd), false, 'onboardingActive should be false once dismissed');
        }
    },
    {
        name: 'onboarding: hooks are no-ops once completed/dismissed (never reactivates)',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            const ctx = h.context;
            ctx.onboardingDismiss();
            assert.equal(sd.onboarding.step, 0, 'dismiss alone should not change step');

            // None of these should mutate state once dismissed.
            ctx.onboardingOnScreenChange('gacha');
            ctx.onboardingOnGachaRoll();
            ctx.onboardingOnTeamBuilderRender(5);
            ctx.onboardingOnCombatStart();
            ctx.onboardingOnMissionResults();

            assert.equal(sd.onboarding.step, 0, 'step should stay at 0 -- every hook is a no-op once dismissed');
            assert.equal(sd.onboarding.completed, false, 'completed should stay false -- dismiss is a terminal state on its own, not completion');
        }
    },
    {
        name: 'onboarding: the coachmark overlay element exists and is populated when a step renders',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.freshSave();
            const ctx = h.context;
            ctx.onboardingOnScreenChange('hub'); // step 0, screen matches -> should render
            const el = h.document.getElementById('onboarding-coachmark');
            const textEl = h.document.getElementById('onboarding-coachmark-text');
            assert.equal(el.style.display, 'flex', 'coachmark should be shown for a matching step/screen');
            assert.ok(textEl.textContent && textEl.textContent.length > 0, 'coachmark text should be populated');
        }
    }
];

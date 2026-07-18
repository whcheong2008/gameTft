// =============================================================================
// tests/test-endless.js -- Prompt 64 endless mode (The Abyss). Drives
// js/endless.js's run-lifecycle functions directly against the real combat
// engine (same low-level pattern as tests/test-encounters.js): godmode a
// unit to force a deterministic win/loss each floor, then call the same
// onWaveCombatEnd()/uiEndlessContinue()/uiEndlessRetreat() functions the real
// UI buttons call.
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

function setupUnlockedEndlessSave(h, seed) {
    const sd = h.freshSave();
    sd.missions.regionProgress[8].bossCleared = true;
    sd.collection['flame_warrior'] = { stars: 5, copiesForNext: 0 };
    h.context.getActiveTeam(sd).slots = [{ key: 'flame_warrior', row: 0, col: 3 }];
    return sd;
}

function godify(h) {
    for (const u of h.context.combatState.playerUnits) {
        u.attack = 999999;
        u.hp = 999999999;
        u.maxHp = 999999999;
        u.damageReduction = 0.75;
    }
}

function pumpToEnd(h) {
    let ticks = 0;
    while (h.context.combatState && h.context.combatState.running && ticks < 20000) {
        h.context.combatTick(h.context.COMBAT_DT);
        ticks++;
    }
    return ticks;
}

module.exports = [
    // ---------------------------------------------------------------
    {
        name: 'endless mode is locked before the R8 boss is cleared, unlocked after',
        fn: function() {
            const h = createHarness({ seed: 100 });
            h.loadScripts();
            const sd = h.freshSave();
            assert.equal(h.context.isEndlessUnlocked(sd), false, 'locked with no region progress');

            const startLocked = h.context.startEndlessRun(sd);
            assert.equal(startLocked.success, false, 'startEndlessRun should reject while locked');

            sd.missions.regionProgress[8].bossCleared = true;
            assert.equal(h.context.isEndlessUnlocked(sd), true, 'unlocked once R8 boss is cleared');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'startEndlessRun requires a non-empty active team',
        fn: function() {
            const h = createHarness({ seed: 101 });
            h.loadScripts();
            const sd = h.freshSave();
            sd.missions.regionProgress[8].bossCleared = true;
            // no team slots set -- default fresh save has an empty team
            const result = h.context.startEndlessRun(sd);
            assert.equal(result.success, false, 'should reject an empty team');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'floor budget scales monotonically and compounds ~8%/floor',
        fn: function() {
            const h = createHarness({ seed: 102 });
            h.loadScripts();
            const b1 = h.context.getEndlessFloorBudget(1);
            const b2 = h.context.getEndlessFloorBudget(2);
            const b10 = h.context.getEndlessFloorBudget(10);
            const b20 = h.context.getEndlessFloorBudget(20);
            assert.ok(b2 > b1, 'floor 2 budget should exceed floor 1');
            assert.ok(b10 > b2, 'floor 10 budget should exceed floor 2');
            assert.ok(b20 > b10, 'floor 20 budget should exceed floor 10');
            // Compounding growth means the floor-20 : floor-1 ratio should be
            // noticeably larger than a linear 8%*20 = 160% would give.
            assert.ok(b20 / b1 > 4, 'compounding growth should more than 4x the budget by floor 20');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'enemy tier mix shifts upward with floor depth',
        fn: function() {
            const h = createHarness({ seed: 103 });
            h.loadScripts();
            const early = h.context.getEndlessTierWeights(1);
            const late = h.context.getEndlessTierWeights(50);
            // Sum of weight*tier gives an "average tier" proxy -- later floors
            // should weight higher-cost tiers more heavily.
            function avgTier(weights) {
                let total = 0;
                for (let i = 0; i < weights.length; i++) total += weights[i] * (i + 1);
                return total / 100;
            }
            assert.ok(avgTier(late) > avgTier(early), 'average enemy tier should increase with floor depth');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'floor modifiers are null before floor 3 and non-null from floor 3+',
        fn: function() {
            const h = createHarness({ seed: 104 });
            h.loadScripts();
            assert.equal(h.context.rollEndlessFloorModifier(1), null, 'floor 1 has no modifier');
            assert.equal(h.context.rollEndlessFloorModifier(2), null, 'floor 2 has no modifier');
            let sawModifier = false;
            for (let i = 0; i < 30; i++) {
                if (h.context.rollEndlessFloorModifier(3)) { sawModifier = true; break; }
            }
            assert.ok(sawModifier, 'floor 3 should be able to roll a modifier');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'a full endless run: floor 1 -> continue to floor 2 with HP carried over (no heal), then retreat banks VE and updates bestFloor',
        fn: function() {
            const h = createHarness({ seed: 105 });
            h.loadScripts();
            const sd = setupUnlockedEndlessSave(h);

            const startResult = h.context.startEndlessRun(sd);
            assert.equal(startResult.success, true, 'run should start');
            assert.ok(h.context.activeMission && h.context.activeMission.isEndless, 'activeMission should be tagged isEndless');
            assert.equal(h.context.endlessRunState.floor, 1, 'run starts on floor 1');

            // Let the player take real damage on floor 1 (weaken enemies so the
            // fight isn't instant, but don't zero their attack).
            const p = h.context.combatState.playerUnits[0];
            p.attack = 999999;
            p.damageReduction = 0;
            for (const e of h.context.combatState.enemyUnits) e.attack = Math.min(e.attack, 30);
            pumpToEnd(h);
            assert.equal(h.context.combatState.result, 'win', 'floor 1 should be won');
            const hpAfterFloor1 = h.context.combatState.playerUnits[0].hp;
            const maxHp = h.context.combatState.playerUnits[0].maxHp;
            assert.ok(hpAfterFloor1 < maxHp, 'the unit should have taken some damage on floor 1 (test setup sanity check)');

            h.context.onWaveCombatEnd();
            assert.equal(h.context.endlessRunState.floor, 2, 'floor should advance to 2 after a win');
            assert.equal(h.context.endlessRunState.floorsCleared, 1, 'floorsCleared should record floor 1');
            assert.ok(h.context.endlessRunState.pendingVE > 0, 'clearing a floor should accrue pending VE');

            h.context.uiEndlessContinue();
            const hpEnteringFloor2 = h.context.combatState.playerUnits[0].hp;
            assert.equal(hpEnteringFloor2, hpAfterFloor1, 'HP should carry over between floors -- no heal reset');
            assert.ok(hpEnteringFloor2 < maxHp, 'the carried-over HP should still be below max (sanity check that a heal did not silently happen)');

            // Win floor 2 as well, then retreat.
            godify(h);
            pumpToEnd(h);
            assert.equal(h.context.combatState.result, 'win', 'floor 2 should be won');
            h.context.onWaveCombatEnd();
            assert.equal(h.context.endlessRunState.floor, 3, 'floor should advance to 3');
            assert.equal(h.context.endlessRunState.floorsCleared, 2, 'floorsCleared should record floor 2');

            const pendingBeforeRetreat = h.context.endlessRunState.pendingVE;
            const veBefore = sd.player.veilEssence;
            h.context.uiEndlessRetreat();

            assert.equal(h.context.endlessRunState.active, false, 'run should be inactive after retreat');
            assert.equal(sd.player.veilEssence, veBefore + pendingBeforeRetreat, 'retreat should bank the pending VE into veilEssence');
            assert.equal(sd.endless.bestFloor, 2, 'bestFloor should reflect the 2 floors actually cleared');
            assert.equal(sd.endless.totalRuns, 1, 'totalRuns should increment');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'dead units stay dead across a floor transition',
        fn: function() {
            const h = createHarness({ seed: 106 });
            h.loadScripts();
            const sd = h.freshSave();
            sd.missions.regionProgress[8].bossCleared = true;
            sd.collection['flame_warrior'] = { stars: 5, copiesForNext: 0 };
            sd.collection['stone_guard'] = { stars: 5, copiesForNext: 0 };
            h.context.getActiveTeam(sd).slots = [
                { key: 'flame_warrior', row: 0, col: 2 },
                { key: 'stone_guard', row: 0, col: 4 }
            ];

            h.context.startEndlessRun(sd);
            const cs = h.context.combatState;
            assert.equal(cs.playerUnits.length, 2, 'both units should deploy on floor 1');

            // Kill one unit outright; the other carries the win.
            cs.playerUnits[1].attack = 999999;
            cs.playerUnits[1].hp = 999999999;
            cs.playerUnits[1].maxHp = 999999999;
            cs.playerUnits[1].damageReduction = 0.75;
            cs.playerUnits[0].hp = 0;

            pumpToEnd(h);
            assert.equal(h.context.combatState.result, 'win', 'floor 1 should still be won with one unit down');
            h.context.onWaveCombatEnd();
            h.context.uiEndlessContinue();

            assert.equal(h.context.combatState.playerUnits.length, 1, 'the dead unit should not reappear on floor 2');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'defeat ends the run and pays whatever VE was already banked from prior floors',
        fn: function() {
            const h = createHarness({ seed: 107 });
            h.loadScripts();
            const sd = setupUnlockedEndlessSave(h);
            h.context.startEndlessRun(sd);

            godify(h);
            pumpToEnd(h);
            assert.equal(h.context.combatState.result, 'win', 'floor 1 should be won');
            h.context.onWaveCombatEnd();
            h.context.uiEndlessContinue();

            const pendingAfterFloor1 = h.context.endlessRunState.pendingVE;
            assert.ok(pendingAfterFloor1 > 0, 'floor 1 clear should have accrued VE');

            // Force a defeat on floor 2 without accruing further reward.
            const cs = h.context.combatState;
            for (const u of cs.playerUnits) u.hp = 0;
            cs.running = false;
            cs.result = 'loss';

            const veBefore = sd.player.veilEssence;
            h.context.onWaveCombatEnd();

            assert.equal(h.context.endlessRunState.active, false, 'run should end on defeat');
            assert.equal(sd.player.veilEssence, veBefore + pendingAfterFloor1, 'defeat should still pay the VE banked from the floor that was already cleared');
            assert.equal(sd.endless.bestFloor, 1, 'bestFloor should be the last floor actually cleared, not the one died on');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'personal best (bestFloor) only ever increases across multiple runs, never regresses',
        fn: function() {
            const h = createHarness({ seed: 108 });
            h.loadScripts();
            const sd = setupUnlockedEndlessSave(h);

            // Run 1: clear floor 1, retreat.
            h.context.startEndlessRun(sd);
            godify(h);
            pumpToEnd(h);
            h.context.onWaveCombatEnd();
            h.context.uiEndlessRetreat();
            assert.equal(sd.endless.bestFloor, 1, 'bestFloor after run 1 should be 1');

            // Run 2: immediately defeated on floor 1 (0 floors cleared).
            h.context.startEndlessRun(sd);
            const cs = h.context.combatState;
            for (const u of cs.playerUnits) u.hp = 0;
            cs.running = false;
            cs.result = 'loss';
            h.context.onWaveCombatEnd();
            assert.equal(sd.endless.bestFloor, 1, 'a worse run should not lower bestFloor');
            assert.equal(sd.endless.totalRuns, 2, 'totalRuns should still increment on a bad run');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'pure-stat floor modifiers mutate combatState directly (enemy ATK/DR up, player heal/attack-speed down)',
        fn: function() {
            const h = createHarness({ seed: 109 });
            h.loadScripts();
            const sd = setupUnlockedEndlessSave(h);
            h.context.startEndlessRun(sd);
            const cs = h.context.combatState;

            const baseAtk = cs.enemyUnits[0].attack;
            h.context.endlessRunState.modifierThisFloor = 'enemies_atk_up';
            h.context.applyEndlessFloorModifierEffects(cs);
            assert.equal(cs.enemyUnits[0].attack, Math.floor(baseAtk * 1.25), 'enemies_atk_up should apply a +25% ATK multiplier');

            const baseDr = cs.enemyUnits[0].damageReduction || 0;
            h.context.endlessRunState.modifierThisFloor = 'enemies_dr_up';
            h.context.applyEndlessFloorModifierEffects(cs);
            assert.ok(cs.enemyUnits[0].damageReduction > baseDr, 'enemies_dr_up should raise enemy damage reduction');

            h.context.endlessRunState.modifierThisFloor = 'player_heal_down';
            h.context.applyEndlessFloorModifierEffects(cs);
            assert.ok(h.context.hasStatus(cs.playerUnits[0], 'healReduction'), 'player_heal_down should apply a healReduction status to the player team');

            h.context.endlessRunState.modifierThisFloor = 'player_atkspd_down';
            h.context.applyEndlessFloorModifierEffects(cs);
            assert.ok(h.context.getStatusValue(cs.playerUnits[0], 'spdMod') < 0, 'player_atkspd_down should apply a negative spdMod (slower attacks)');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'encounter-mechanic-kind floor modifiers pass through to the real combat-encounters.js machinery',
        fn: function() {
            const h = createHarness({ seed: 110 });
            h.loadScripts();
            const sd = setupUnlockedEndlessSave(h);
            h.context.startEndlessRun(sd);

            h.context.endlessRunState.floor = 2;
            h.context.endlessRunState.modifierThisFloor = 'vip_target';
            h.context.activeMission.waves.push(h.context.buildEndlessWaveConfig(2));
            h.context.syncEndlessMissionModifier();
            assert.equal(h.context.activeMission.encounterMechanic, 'vip_target', 'the mission-level encounterMechanic field should be set for an encounter-kind modifier');

            h.context.advanceWave();
            h.context.startWaveCombat();
            assert.deepEqual(h.context.combatState.encounterMechanics, ['vip_target'], 'combat-core.js should have picked up the modifier automatically');
            assert.ok(h.context.combatState.encounterState.vipTarget, 'combat-encounters.js should have actually run its vip_target setup');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'milestone floors (every 5) pay a bonus on top of the normal per-floor reward',
        fn: function() {
            const h = createHarness({ seed: 111 });
            h.loadScripts();
            assert.equal(h.context.isEndlessMilestoneFloor(4), false, 'floor 4 is not a milestone');
            assert.equal(h.context.isEndlessMilestoneFloor(5), true, 'floor 5 is a milestone');
            assert.equal(h.context.isEndlessMilestoneFloor(10), true, 'floor 10 is a milestone');
            assert.equal(h.context.getEndlessMilestoneBonus(4), 0, 'non-milestone floors have no bonus');
            assert.ok(h.context.getEndlessMilestoneBonus(5) > 0, 'milestone floors should pay a bonus');
            assert.ok(h.context.getEndlessMilestoneBonus(10) > h.context.getEndlessMilestoneBonus(5), 'later milestones should pay a larger bonus');
        }
    }
];

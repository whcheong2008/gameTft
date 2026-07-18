// =============================================================================
// tests/test-challenges.js -- Prompt 64 challenge modes (Time Trial, Survival,
// Restricted Roster, Element Bosses). Same low-level pattern as
// tests/test-endless.js / tests/test-encounters.js: drive js/challenges.js's
// functions directly against the real combat engine, godmoding a unit for a
// deterministic result each fight.
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

function unlockChallenges(sd) {
    sd.missions.regionProgress[4].bossCleared = true;
}

function completeStage(sd, stageId) {
    const regionMatch = /^r(\d+)_/.exec(stageId);
    const region = regionMatch ? parseInt(regionMatch[1], 10) : 1;
    if (!sd.missions.regionProgress[region].completed.includes(stageId)) {
        sd.missions.regionProgress[region].completed.push(stageId);
    }
    sd.missions.stageProgress[stageId] = { completed: true, bestStars: 3, clearedAt: Date.now() };
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

// Runs every wave of the currently-active mission to completion (win),
// godmoding the team each wave and calling the same onWaveCombatEnd() /
// startWaveCombat() sequence the real "Start Next Wave" button drives.
function runMissionToVictory(h) {
    for (;;) {
        godify(h);
        pumpToEnd(h);
        if (h.context.combatState.result !== 'win') return h.context.combatState.result;
        h.context.onWaveCombatEnd();
        const stillEndlessLike = h.context.activeMission && (h.context.activeMission.isEndless || h.context.activeMission.isChallengeSurvival);
        if (stillEndlessLike) return 'win'; // those routes manage their own continuation
        const moreWaves = h.context.currentWaveIndex < h.context.activeMission.waves.length;
        if (!moreWaves) return 'win';
        h.context.startWaveCombat();
    }
}

module.exports = [
    // =========================================================================
    // Unlock gate
    // =========================================================================
    {
        name: 'challenges are locked before the R4 boss is cleared, unlocked after',
        fn: function() {
            const h = createHarness({ seed: 200 });
            h.loadScripts();
            const sd = h.freshSave();
            assert.equal(h.context.isChallengesUnlocked(sd), false, 'locked with no region progress');

            const ttLocked = h.context.startTimeTrialChallenge(sd, 'r1_s1');
            const svLocked = h.context.startSurvivalChallenge(sd);
            const rrLocked = h.context.startRestrictedRosterChallenge(sd, 'r1_s1', 'mono_element');
            const ebLocked = h.context.startElementBossChallenge(sd, 'infernal_wyvern');
            assert.equal(ttLocked.success, false, 'Time Trial should reject while locked');
            assert.equal(svLocked.success, false, 'Survival should reject while locked');
            assert.equal(rrLocked.success, false, 'Restricted Roster should reject while locked');
            assert.equal(ebLocked.success, false, 'Element Boss should reject while locked');

            unlockChallenges(sd);
            assert.equal(h.context.isChallengesUnlocked(sd), true, 'unlocked once R4 boss is cleared');
        }
    },

    // =========================================================================
    // 1. Time Trial
    // =========================================================================
    {
        name: 'Time Trial: playable to a result headlessly, beats par and grants VE + stores best time',
        fn: function() {
            const h = createHarness({ seed: 201 });
            h.loadScripts();
            const sd = h.freshSave();
            unlockChallenges(sd);
            sd.collection['flame_warrior'] = { stars: 5, copiesForNext: 0 };
            h.context.getActiveTeam(sd).slots = [{ key: 'flame_warrior', row: 0, col: 3 }];
            completeStage(sd, 'r1_s1');

            const start = h.context.startTimeTrialChallenge(sd, 'r1_s1');
            assert.equal(start.success, true, 'Time Trial should start on a cleared stage');
            assert.ok(h.context.activeMission.isChallengeTimeTrial, 'activeMission should be tagged isChallengeTimeTrial');

            const veBefore = sd.player.veilEssence;
            const result = runMissionToVictory(h);
            assert.equal(result, 'win', 'a godmoded team should win the stage');

            assert.ok(h.context.timeTrialElapsedTotal > 0, 'elapsed combat time should have accumulated');
            assert.ok(sd.player.veilEssence > veBefore, 'beating par should grant VE');
            assert.equal(typeof sd.challenges.timeTrial.r1_s1, 'number', 'best time should be recorded for the stage');
        }
    },
    {
        name: 'Time Trial: must be an already-cleared stage',
        fn: function() {
            const h = createHarness({ seed: 202 });
            h.loadScripts();
            const sd = h.freshSave();
            unlockChallenges(sd);
            sd.collection['flame_warrior'] = { stars: 5, copiesForNext: 0 };
            h.context.getActiveTeam(sd).slots = [{ key: 'flame_warrior', row: 0, col: 3 }];
            // r1_s2 deliberately left uncleared
            const result = h.context.startTimeTrialChallenge(sd, 'r1_s2');
            assert.equal(result.success, false, 'should reject an uncleared stage');
        }
    },

    // =========================================================================
    // 2. Survival
    // =========================================================================
    {
        name: 'Survival: waves auto-continue on victory (reusing endless wave generation) and best wave count persists on defeat',
        fn: function() {
            const h = createHarness({ seed: 203 });
            h.loadScripts();
            const sd = h.freshSave();
            unlockChallenges(sd);
            sd.collection['flame_warrior'] = { stars: 5, copiesForNext: 0 };
            h.context.getActiveTeam(sd).slots = [{ key: 'flame_warrior', row: 0, col: 3 }];

            const start = h.context.startSurvivalChallenge(sd);
            assert.equal(start.success, true, 'Survival should start with a valid team');
            assert.ok(h.context.activeMission.isChallengeSurvival, 'activeMission should be tagged isChallengeSurvival');
            assert.equal(h.context.survivalRunState.wave, 1, 'starts on wave 1');

            for (let w = 1; w <= 3; w++) {
                godify(h);
                pumpToEnd(h);
                assert.equal(h.context.combatState.result, 'win', 'wave ' + w + ' should be winnable godmoded');
                h.context.onWaveCombatEnd();
            }
            assert.equal(h.context.survivalRunState.wave, 4, 'wave counter should have advanced past the 3 cleared waves');

            // Force a defeat on the current wave.
            const cs = h.context.combatState;
            for (const u of cs.playerUnits) u.hp = 0;
            cs.running = false;
            cs.result = 'loss';
            h.context.onWaveCombatEnd();

            assert.equal(h.context.survivalRunState.active, false, 'run should end on defeat');
            assert.equal(sd.challenges.survival.bestWave, 3, 'bestWave should record the 3 waves actually cleared, not the one died on');
        }
    },

    // =========================================================================
    // 3. Restricted Roster
    // =========================================================================
    {
        name: 'Restricted Roster: mono_element restriction rejects a mixed-element team deploy',
        fn: function() {
            const h = createHarness({ seed: 204 });
            h.loadScripts();
            const sd = h.freshSave();
            unlockChallenges(sd);
            sd.collection['flame_warrior'] = { stars: 5, copiesForNext: 0 };
            sd.collection['tide_hunter'] = { stars: 5, copiesForNext: 0 };
            h.context.getActiveTeam(sd).slots = [
                { key: 'flame_warrior', row: 0, col: 2 },
                { key: 'tide_hunter', row: 0, col: 4 }
            ];

            const compliance = h.context.checkRestrictedRosterCompliance(sd, 'mono_element');
            assert.equal(compliance.passed, false, 'a two-element team should fail the mono_element restriction');

            completeStage(sd, 'r1_s1');
            const start = h.context.startRestrictedRosterChallenge(sd, 'r1_s1', 'mono_element');
            assert.equal(start.success, false, 'startRestrictedRosterChallenge should also enforce the restriction and refuse to launch');
        }
    },
    {
        name: 'Restricted Roster: no_healers rejects a team containing a healer-type unit',
        fn: function() {
            const h = createHarness({ seed: 205 });
            h.loadScripts();
            const sd = h.freshSave();
            unlockChallenges(sd);
            sd.collection['pulse_mender'] = { stars: 5, copiesForNext: 0 }; // starter healer unit
            h.context.getActiveTeam(sd).slots = [{ key: 'pulse_mender', row: 0, col: 3 }];
            const compliance = h.context.checkRestrictedRosterCompliance(sd, 'no_healers');
            assert.equal(compliance.passed, false, 'a healer-type unit should fail the no_healers restriction');
        }
    },
    {
        name: 'Restricted Roster: max_team_4 rejects more than 4 deployed units',
        fn: function() {
            const h = createHarness({ seed: 206 });
            h.loadScripts();
            const sd = h.freshSave();
            unlockChallenges(sd);
            const keys = ['flame_warrior', 'stone_guard', 'frost_archer', 'wind_squire', 'pulse_mender'];
            const slots = [];
            for (let i = 0; i < keys.length; i++) {
                sd.collection[keys[i]] = { stars: 1, copiesForNext: 0 };
                slots.push({ key: keys[i], row: 0, col: i });
            }
            h.context.getActiveTeam(sd).slots = slots;
            const compliance = h.context.checkRestrictedRosterCompliance(sd, 'max_team_4');
            assert.equal(compliance.passed, false, '5 deployed units should fail the max_team_4 restriction');
        }
    },
    {
        name: 'Restricted Roster: a compliant run is playable to a result and grants a VE multiplier on the stage base reward',
        fn: function() {
            const h = createHarness({ seed: 207 });
            h.loadScripts();
            const sd = h.freshSave();
            unlockChallenges(sd);
            sd.collection['flame_warrior'] = { stars: 5, copiesForNext: 0 };
            h.context.getActiveTeam(sd).slots = [{ key: 'flame_warrior', row: 0, col: 3 }];
            completeStage(sd, 'r1_s1');

            const compliance = h.context.checkRestrictedRosterCompliance(sd, 'mono_element');
            assert.equal(compliance.passed, true, 'a single-element team should pass mono_element');

            const start = h.context.startRestrictedRosterChallenge(sd, 'r1_s1', 'mono_element');
            assert.equal(start.success, true, 'a compliant Restricted Roster run should start');
            assert.ok(h.context.activeMission.isChallengeRestricted, 'activeMission should be tagged isChallengeRestricted');

            const stage = h.context.getStageById('r1_s1');
            const baseVE = stage.rewards.ve;
            const veBefore = sd.player.veilEssence;
            const result = runMissionToVictory(h);
            assert.equal(result, 'win', 'a godmoded team should clear the stage');

            const expectedReward = Math.floor(baseVE * h.context.CHALLENGE_TUNABLES.restrictedRosterVeMult);
            assert.equal(sd.player.veilEssence, veBefore + expectedReward, 'reward should be the stage base VE times the restricted-roster multiplier');
            assert.equal(sd.challenges.restrictedRoster.r1_s1, 1, 'restricted-roster clear count should be tracked');
        }
    },

    // =========================================================================
    // 4. Element Bosses
    // =========================================================================
    {
        name: 'Element Bosses: load and fight via the existing boss framework, first clear grants VE + 1 essence of the boss element, repeat clears are smaller and repeatable',
        fn: function() {
            const h = createHarness({ seed: 208 });
            h.loadScripts();
            const sd = h.freshSave();
            unlockChallenges(sd);
            sd.collection['flame_warrior'] = { stars: 5, copiesForNext: 0 };
            h.context.getActiveTeam(sd).slots = [{ key: 'flame_warrior', row: 0, col: 3 }];

            const start = h.context.startElementBossChallenge(sd, 'tidal_leviathan');
            assert.equal(start.success, true, 'element boss challenge should start');
            assert.equal(h.context.activeMission.boss, 'tidal_leviathan', 'should route through the real boss framework (activeMission.boss)');
            assert.ok(h.context.combatState.bossUnit, 'a boss unit should have been created via BOSS_DATA');

            godify(h);
            pumpToEnd(h);
            assert.equal(h.context.combatState.result, 'win', 'a godmoded team should defeat the boss');

            const essenceBefore = sd.equipment.essences.water || 0;
            const veBeforeFirst = sd.player.veilEssence;
            h.context.onWaveCombatEnd();
            assert.equal(sd.equipment.essences.water, essenceBefore + 1, 'first clear should grant 1 water essence');
            assert.ok(sd.player.veilEssence > veBeforeFirst, 'first clear should grant VE');
            assert.equal(sd.challenges.elementBosses.tidal_leviathan.cleared, true, 'boss should be marked cleared');
            assert.equal(sd.challenges.elementBosses.tidal_leviathan.clears, 1, 'clear count should be 1');

            // Repeatable: fight it again.
            const start2 = h.context.startElementBossChallenge(sd, 'tidal_leviathan');
            assert.equal(start2.success, true, 'element boss should be repeatable after first clear');
            godify(h);
            pumpToEnd(h);
            const essenceBeforeSecond = sd.equipment.essences.water;
            const veBeforeSecond = sd.player.veilEssence;
            h.context.onWaveCombatEnd();
            assert.equal(sd.equipment.essences.water, essenceBeforeSecond, 'repeat clears should not grant additional essence');
            assert.ok(sd.player.veilEssence > veBeforeSecond, 'repeat clears should still grant some VE');
            assert.equal(sd.challenges.elementBosses.tidal_leviathan.clears, 2, 'clear count should increment on repeat clears');
        }
    },
    {
        name: 'Element Bosses: all 4 orphaned bosses (infernal_wyvern, tidal_leviathan, stone_colossus, storm_phoenix) are reachable',
        fn: function() {
            const h = createHarness({ seed: 209 });
            h.loadScripts();
            const sd = h.freshSave();
            unlockChallenges(sd);
            sd.collection['flame_warrior'] = { stars: 5, copiesForNext: 0 };
            h.context.getActiveTeam(sd).slots = [{ key: 'flame_warrior', row: 0, col: 3 }];

            const keys = ['infernal_wyvern', 'tidal_leviathan', 'stone_colossus', 'storm_phoenix'];
            for (let i = 0; i < keys.length; i++) {
                const result = h.context.startElementBossChallenge(sd, keys[i]);
                assert.equal(result.success, true, keys[i] + ' should be startable');
                assert.equal(h.context.activeMission.boss, keys[i], keys[i] + ' should route to the matching BOSS_DATA entry');
            }
        }
    },

    // =========================================================================
    // Persistence
    // =========================================================================
    {
        name: 'challenge bests persist independently per stage/boss and survive a fresh getSaveData() read',
        fn: function() {
            const h = createHarness({ seed: 210 });
            h.loadScripts();
            const sd = h.freshSave();
            unlockChallenges(sd);
            sd.collection['flame_warrior'] = { stars: 5, copiesForNext: 0 };
            h.context.getActiveTeam(sd).slots = [{ key: 'flame_warrior', row: 0, col: 3 }];
            completeStage(sd, 'r1_s1');
            completeStage(sd, 'r1_s2');

            h.context.startTimeTrialChallenge(sd, 'r1_s1');
            runMissionToVictory(h);
            h.context.startTimeTrialChallenge(sd, 'r1_s2');
            runMissionToVictory(h);

            const reloaded = h.context.getSaveData();
            assert.equal(typeof reloaded.challenges.timeTrial.r1_s1, 'number', 'r1_s1 best time should persist');
            assert.equal(typeof reloaded.challenges.timeTrial.r1_s2, 'number', 'r1_s2 best time should persist independently');
        }
    }
];

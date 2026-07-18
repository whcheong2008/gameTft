// =============================================================================
// challenges.js -- Challenge modes (Prompt 64 / MASTERPLAN 2.7, PHASE2-AUDIT P0
// "Challenge modes"). Unlocked after clearing R4's boss. Four modes:
//   1. Time Trial          -- clear a chosen already-cleared stage under a par time.
//   2. Survival             -- endless waves on a fixed board (reuses endless.js's
//                              tier-weighted wave generator, no floors/modifiers).
//   3. Restricted Roster    -- clear a chosen cleared stage under a rolled restriction.
//   4. Element Bosses       -- the 4 orphaned bosses (missions.js BOSS_DATA:
//                              infernal_wyvern/tidal_leviathan/stone_colossus/
//                              storm_phoenix) as standalone repeatable boss fights,
//                              reusing the existing boss framework unchanged.
//
// Per-challenge bests live in saveData.challenges via the save.js backfill
// convention (see js/save.js migrateSave()'s version-agnostic tail +
// validateSaveData()).
// =============================================================================

// ---- TUNABLE constants ----
var CHALLENGE_TUNABLES = {
    // Time Trial: par = totalStageBudget * secondsPerBudgetPoint, floor'd at a
    // minimum so short stages still give a fair window. Boss stages (no
    // per-wave budget) get a flat par based on the boss's enrage timer instead.
    timeTrialSecondsPerBudget: 1.8,  // TUNABLE
    timeTrialMinPar: 15,             // TUNABLE
    timeTrialBossParFraction: 0.6,   // TUNABLE -- fraction of the boss's enrageTime
    timeTrialRewardVE: 250,          // TUNABLE -- flat VE for beating par

    restrictedRosterVeMult: 2.0,     // TUNABLE -- multiplier on the stage's base VE reward

    elementBossRepeatVE: 150,        // TUNABLE -- VE for repeat clears
    elementBossFirstClearVE: 400     // TUNABLE -- additional VE on top of the repeat amount, first clear only
};

// Informational flag mirroring pendingMissionIsStory's convention -- not
// itself read by any result-routing logic (that's done by checking
// activeMission.isChallenge* directly, since activeMission is always
// current), but kept for parity/diagnostics and future UI use.
var pendingChallengeType = null;

// ---- Unlock gate ----
function isChallengesUnlocked(saveData) {
    return typeof isRegionBossCleared === 'function' && isRegionBossCleared(saveData, 4);
}

function getChallengesSaveData(saveData) {
    if (!saveData.challenges) saveData.challenges = { timeTrial: {}, survival: { bestWave: 0 }, restrictedRoster: {}, elementBosses: {} };
    return saveData.challenges;
}

// =============================================================================
// 1. Time Trial
// =============================================================================

function getStageTotalBudget(stage) {
    var total = 0;
    if (!stage || !stage.waves) return 0;
    for (var i = 0; i < stage.waves.length; i++) total += (stage.waves[i].budget || 0);
    return total;
}

function getTimeTrialPar(stageId) {
    var stage = getStageById(stageId);
    if (!stage) return CHALLENGE_TUNABLES.timeTrialMinPar;
    if (stage.boss && typeof BOSS_DATA !== 'undefined' && BOSS_DATA[stage.boss]) {
        var enrage = BOSS_DATA[stage.boss].enrageTime || 90;
        return Math.max(CHALLENGE_TUNABLES.timeTrialMinPar, Math.round(enrage * CHALLENGE_TUNABLES.timeTrialBossParFraction));
    }
    var totalBudget = getStageTotalBudget(stage);
    return Math.max(CHALLENGE_TUNABLES.timeTrialMinPar, Math.round(totalBudget * CHALLENGE_TUNABLES.timeTrialSecondsPerBudget));
}

// Accumulates combat time across every wave of a Time Trial run. Reset at
// launch, added to from the ui-combat.js seam in onWaveCombatEnd() (mirrors
// trackWaveDamage()'s existing per-wave-end hook pattern).
var timeTrialElapsedTotal = 0;

function accumulateTimeTrialElapsed() {
    if (typeof combatState !== 'undefined' && combatState) timeTrialElapsedTotal += combatState.elapsed;
}

function buildTimeTrialMission(stageId) {
    var stage = getStageById(stageId);
    if (!stage) return null;
    return {
        id: 'challenge_tt_' + stageId,
        name: '⏱️ Time Trial: ' + stage.name,
        waves: stage.waves,
        boss: stage.boss,
        encounterMechanic: null, // TUNABLE design call: strip encounter mechanics for a clean timing test
        rewards: { ve: stage.rewards.ve, xp: 0 },
        isChallengeTimeTrial: true,
        sourceStageId: stageId
    };
}

function startTimeTrialChallenge(saveData, stageId) {
    if (!isChallengesUnlocked(saveData)) return { success: false, reason: 'Challenges are locked until the Shattered Colossus falls.' };
    if (!isStageCompleted(saveData, stageId)) return { success: false, reason: 'Clear that stage in Missions first.' };
    var mission = buildTimeTrialMission(stageId);
    if (!mission) return { success: false, reason: 'Invalid stage.' };
    var team = getActiveTeam(saveData);
    if (!team || team.slots.length === 0) return { success: false, reason: 'Build a team first!' };

    timeTrialElapsedTotal = 0;
    pendingMissionIsStory = false;
    pendingMissionIndex = -1;
    pendingChallengeType = 'time_trial';

    startMission(saveData, mission);
    beginCombatScreen(saveData);
    return { success: true };
}

// =============================================================================
// 2. Survival
// =============================================================================
// Endless waves on a fixed board -- reuses endless.js's generateEndlessEnemies()
// (treating "wave number" as its "floor" input) but with no floor modifiers and
// no VE-per-floor banking; the only thing tracked is how many waves were cleared.

var survivalRunState = null; // { active, wave }

function buildSurvivalWaveConfig(wave) {
    return { wave: wave };
}

function buildSurvivalMission() {
    return {
        id: 'challenge_survival',
        name: 'Survival',
        isChallengeSurvival: true,
        waves: [buildSurvivalWaveConfig(1)],
        rewards: { ve: 0 }
    };
}

function startSurvivalChallenge(saveData) {
    if (!isChallengesUnlocked(saveData)) return { success: false, reason: 'Challenges are locked until the Shattered Colossus falls.' };
    var team = getActiveTeam(saveData);
    if (!team || team.slots.length === 0) return { success: false, reason: 'Build a team first!' };

    survivalRunState = { active: true, wave: 1 };
    pendingMissionIsStory = false;
    pendingMissionIndex = -1;
    pendingChallengeType = null; // Survival's result isn't handled via showMissionResults' challenge branch -- see onSurvivalWaveEnd()

    activeMission = buildSurvivalMission();
    currentWaveIndex = 0;

    beginCombatScreen(saveData);
    return { success: true };
}

// Called from the ui-combat.js seam in onWaveCombatEnd() when
// activeMission.isChallengeSurvival is set. Auto-continues on victory (no
// continue/retreat choice -- "how long can you last?" per CONTENT-DESIGN).
function onSurvivalWaveEnd(victory) {
    if (!victory) {
        finalizeSurvivalChallenge();
        return;
    }
    if (typeof healBoardUnits === 'function') healBoardUnits(true); // carry HP forward; dead units are dropped automatically
    survivalRunState.wave += 1;
    activeMission.waves.push(buildSurvivalWaveConfig(survivalRunState.wave));
    advanceWave();
    startWaveCombat();
}

function finalizeSurvivalChallenge() {
    var sd = getSaveData();
    var cd = getChallengesSaveData(sd);
    var wavesSurvived = Math.max(0, survivalRunState.wave - 1); // the wave they died on doesn't count as cleared
    cd.survival.bestWave = Math.max(cd.survival.bestWave || 0, wavesSurvived);
    if (typeof autoSave === 'function') autoSave(sd);
    survivalRunState.active = false;
    if (typeof showSurvivalResults === 'function') showSurvivalResults(wavesSurvived, cd.survival.bestWave);
}

// =============================================================================
// 3. Restricted Roster
// =============================================================================

var RESTRICTED_ROSTER_TYPES = ['mono_element', 'no_items', 'max_team_4', 'no_healers'];

function rollRestrictedRosterType() {
    return RESTRICTED_ROSTER_TYPES[Math.floor(Math.random() * RESTRICTED_ROSTER_TYPES.length)];
}

function getRestrictedRosterDesc(type) {
    switch (type) {
        case 'mono_element': return 'Mono-Element: every deployed unit must share the same element.';
        case 'no_items': return 'No Items: no equipment may be equipped on any deployed unit.';
        case 'max_team_4': return 'Max Team 4: deploy at most 4 units.';
        case 'no_healers': return 'No Healers: no Healer-type units may be deployed.';
        default: return '';
    }
}

// Pure, headlessly-testable compliance check -- also used as the UI gate
// before a Restricted Roster run is allowed to start.
function checkRestrictedRosterCompliance(saveData, restrictionType) {
    var team = getActiveTeam(saveData);
    var slots = (team && team.slots) || [];
    if (slots.length === 0) return { passed: false, reason: 'Build a team first!' };

    if (restrictionType === 'mono_element') {
        var elemCounts = getTeamElementCounts(saveData);
        var elemKeys = Object.keys(elemCounts);
        if (elemKeys.length > 1) return { passed: false, reason: 'Team must be a single element (found ' + elemKeys.length + ').' };
    } else if (restrictionType === 'no_items') {
        for (var i = 0; i < slots.length; i++) {
            if (typeof getEquippedItems === 'function' && getEquippedItems(saveData, slots[i].key).length > 0) {
                return { passed: false, reason: 'Unequip all items before starting (no items allowed).' };
            }
        }
    } else if (restrictionType === 'max_team_4') {
        if (slots.length > 4) return { passed: false, reason: 'Team must be 4 units or fewer (have ' + slots.length + ').' };
    } else if (restrictionType === 'no_healers') {
        for (var j = 0; j < slots.length; j++) {
            var tmpl = UNIT_TEMPLATES[slots[j].key] || EVOLVED_TEMPLATES[slots[j].key];
            if (tmpl && tmpl.type === 'healer') return { passed: false, reason: 'No Healer units allowed (found ' + tmpl.name + ').' };
        }
    }
    return { passed: true, reason: '' };
}

function buildRestrictedRosterMission(stageId, restrictionType) {
    var stage = getStageById(stageId);
    if (!stage) return null;
    return {
        id: 'challenge_rr_' + stageId,
        name: '🔒 Restricted: ' + stage.name,
        waves: stage.waves,
        boss: stage.boss,
        encounterMechanic: stage.encounterMechanic,
        rewards: { ve: stage.rewards.ve, xp: 0 },
        isChallengeRestricted: true,
        sourceStageId: stageId,
        restrictionType: restrictionType
    };
}

function startRestrictedRosterChallenge(saveData, stageId, restrictionType) {
    if (!isChallengesUnlocked(saveData)) return { success: false, reason: 'Challenges are locked until the Shattered Colossus falls.' };
    if (!isStageCompleted(saveData, stageId)) return { success: false, reason: 'Clear that stage in Missions first.' };
    var compliance = checkRestrictedRosterCompliance(saveData, restrictionType);
    if (!compliance.passed) return { success: false, reason: compliance.reason };
    var mission = buildRestrictedRosterMission(stageId, restrictionType);
    if (!mission) return { success: false, reason: 'Invalid stage.' };

    pendingMissionIsStory = false;
    pendingMissionIndex = -1;
    pendingChallengeType = 'restricted_roster';

    startMission(saveData, mission);
    beginCombatScreen(saveData);
    return { success: true };
}

// =============================================================================
// 4. Element Bosses
// =============================================================================

var ELEMENT_BOSS_KEYS = ['infernal_wyvern', 'tidal_leviathan', 'stone_colossus', 'storm_phoenix'];
var ELEMENT_BOSS_ELEMENT = { infernal_wyvern: 'fire', tidal_leviathan: 'water', stone_colossus: 'earth', storm_phoenix: 'wind' };

function startElementBossChallenge(saveData, bossKey) {
    if (!isChallengesUnlocked(saveData)) return { success: false, reason: 'Challenges are locked until the Shattered Colossus falls.' };
    if (ELEMENT_BOSS_KEYS.indexOf(bossKey) < 0) return { success: false, reason: 'Unknown boss.' };
    if (typeof BOSS_DATA === 'undefined' || !BOSS_DATA[bossKey]) return { success: false, reason: 'Boss data missing.' };
    var team = getActiveTeam(saveData);
    if (!team || team.slots.length === 0) return { success: false, reason: 'Build a team first!' };

    var mission = {
        id: 'challenge_boss_' + bossKey,
        name: BOSS_DATA[bossKey].name,
        boss: bossKey,
        waves: [],
        isChallengeElementBoss: true,
        bossKey: bossKey
    };

    pendingMissionIsStory = false;
    pendingMissionIndex = -1;
    pendingChallengeType = 'element_boss';

    startMission(saveData, mission);
    beginCombatScreen(saveData);
    return { success: true };
}

// =============================================================================
// Shared victory-reward handler -- called from the ui-combat.js seam in
// showMissionResults() for any mission tagged isChallengeTimeTrial /
// isChallengeRestricted / isChallengeElementBoss. Fully owns
// #results-rewards for these missions (bypasses calculateMissionRewards()'s
// star-based generic path, which doesn't model challenge rewards).
// =============================================================================

function renderChallengeVictoryResults(saveData, mission) {
    var cd = getChallengesSaveData(saveData);
    var html = '';

    if (mission.isChallengeTimeTrial) {
        var elapsed = timeTrialElapsedTotal;
        var par = getTimeTrialPar(mission.sourceStageId);
        var beatPar = elapsed <= par;
        var stageId = mission.sourceStageId;
        var prevBest = cd.timeTrial[stageId];
        var isNewBest = (typeof prevBest !== 'number' || elapsed < prevBest);
        if (isNewBest) cd.timeTrial[stageId] = elapsed;
        var rewardVE = beatPar ? CHALLENGE_TUNABLES.timeTrialRewardVE : 0;
        if (rewardVE > 0) saveData.player.veilEssence += rewardVE;

        html = '<div>Time: <b>' + elapsed.toFixed(1) + 's</b> (Par: ' + par + 's)</div>' +
            '<div style="color:' + (beatPar ? '#6bcb77' : '#ff8844') + ';">' + (beatPar ? 'Beat par!' : 'Missed par -- no VE reward this run') + '</div>' +
            (rewardVE > 0 ? '<div class="text-gold">+' + rewardVE + ' VE</div>' : '') +
            (isNewBest ? '<div style="color:#e2b714;">New best time!</div>' : '<div style="color:#888;">Best: ' + cd.timeTrial[stageId].toFixed(1) + 's</div>');
    } else if (mission.isChallengeRestricted) {
        var rStage = getStageById(mission.sourceStageId);
        var baseVE = (rStage && rStage.rewards.ve) || 0;
        var rewardVE2 = Math.floor(baseVE * CHALLENGE_TUNABLES.restrictedRosterVeMult);
        saveData.player.veilEssence += rewardVE2;
        cd.restrictedRoster[mission.sourceStageId] = (cd.restrictedRoster[mission.sourceStageId] || 0) + 1;

        html = '<div>Restriction: <b>' + getRestrictedRosterDesc(mission.restrictionType) + '</b></div>' +
            '<div class="text-gold">+' + rewardVE2 + ' VE (' + CHALLENGE_TUNABLES.restrictedRosterVeMult + '× base reward)</div>' +
            '<div style="color:#888;">Cleared under restriction ' + cd.restrictedRoster[mission.sourceStageId] + ' time(s)</div>';
    } else if (mission.isChallengeElementBoss) {
        var bossKey = mission.bossKey;
        var elem = ELEMENT_BOSS_ELEMENT[bossKey];
        var firstClear = !cd.elementBosses[bossKey] || !cd.elementBosses[bossKey].cleared;
        var rewardVE3 = CHALLENGE_TUNABLES.elementBossRepeatVE;
        if (firstClear) {
            rewardVE3 += CHALLENGE_TUNABLES.elementBossFirstClearVE;
            if (!saveData.equipment.essences) saveData.equipment.essences = {};
            saveData.equipment.essences[elem] = (saveData.equipment.essences[elem] || 0) + 1;
        }
        saveData.player.veilEssence += rewardVE3;
        var prevClears = (cd.elementBosses[bossKey] && cd.elementBosses[bossKey].clears) || 0;
        cd.elementBosses[bossKey] = { cleared: true, clears: prevClears + 1 };

        html = '<div class="text-gold">+' + rewardVE3 + ' VE</div>' +
            (firstClear ? '<div style="color:#e2b714;">First clear! +1 ' + elem + ' essence</div>' : '<div style="color:#888;">Repeat clear (' + cd.elementBosses[bossKey].clears + ' total)</div>');
    }

    var rewardsEl = document.getElementById('results-rewards');
    if (rewardsEl) rewardsEl.innerHTML = html;
    if (typeof autoSave === 'function') autoSave(saveData);
    if (typeof renderTopBar === 'function') renderTopBar();
}

// Survival's result screen (reuses #combat-results like showMissionResults
// and showEndlessRunResults do -- Survival has no victory state, it just
// ends when the run finally loses).
function showSurvivalResults(wavesSurvived, bestWave) {
    var titleEl = document.getElementById('results-title');
    if (titleEl) { titleEl.textContent = 'Survival Ended'; titleEl.className = 'results-title defeat'; }
    var starsEl = document.getElementById('results-stars');
    if (starsEl) starsEl.textContent = '';
    var rewardsEl = document.getElementById('results-rewards');
    if (rewardsEl) rewardsEl.innerHTML = '<div>Waves survived: <b>' + wavesSurvived + '</b> (Best: ' + bestWave + ')</div>';
    var resultsEl = document.getElementById('combat-results');
    if (resultsEl) resultsEl.className = 'combat-results show';
    if (typeof renderTopBar === 'function') renderTopBar();
}

// =============================================================================
// UI -- entry screen (overlay, same pattern as showAchievementPanel/
// showStatsPanel in ui-hub.js). Internal "view" state switches between the
// menu and each mode's picker within a single overlay.
// =============================================================================

var challengesScreenView = 'menu'; // 'menu' | 'time_trial' | 'restricted' | 'element_bosses'
var challengesSelectedRestriction = null; // rolled restriction for the current Restricted Roster picker session

function showChallengesScreen() {
    challengesScreenView = 'menu';
    challengesSelectedRestriction = null;
    renderChallengesOverlay();
}

function getCompletedStageIds(saveData) {
    var out = [];
    for (var i = 0; i < STAGES.length; i++) {
        if (isStageCompleted(saveData, STAGES[i].id)) out.push(STAGES[i].id);
    }
    return out;
}

function renderChallengesMenuHtml(saveData) {
    var cd = getChallengesSaveData(saveData);
    var html = '';
    html += '<div class="challenge-tile" data-view="time_trial" style="cursor:pointer; padding:10px 14px; margin-bottom:8px; background:#16213e; border-radius:8px; border:1px solid #333;">' +
        '<div style="font-weight:bold; color:#e2b714;">⏱️ Time Trial</div>' +
        '<div style="font-size:11px; color:#aaa;">Clear an already-cleared stage under a par time.</div></div>';
    html += '<div class="challenge-tile" data-action="start_survival" style="cursor:pointer; padding:10px 14px; margin-bottom:8px; background:#16213e; border-radius:8px; border:1px solid #333;">' +
        '<div style="font-weight:bold; color:#66ccff;">🌊 Survival</div>' +
        '<div style="font-size:11px; color:#aaa;">Endless waves on a fixed board. Best: Wave ' + (cd.survival.bestWave || 0) + '</div></div>';
    html += '<div class="challenge-tile" data-view="restricted" style="cursor:pointer; padding:10px 14px; margin-bottom:8px; background:#16213e; border-radius:8px; border:1px solid #333;">' +
        '<div style="font-weight:bold; color:#ff8844;">🔒 Restricted Roster</div>' +
        '<div style="font-size:11px; color:#aaa;">Clear a stage under a rolled restriction for bonus VE.</div></div>';
    html += '<div class="challenge-tile" data-view="element_bosses" style="cursor:pointer; padding:10px 14px; margin-bottom:8px; background:#16213e; border-radius:8px; border:1px solid #333;">' +
        '<div style="font-weight:bold; color:#cc66ff;">👑 Element Bosses</div>' +
        '<div style="font-size:11px; color:#aaa;">Fight the 4 element bosses standalone. Repeatable.</div></div>';
    return html;
}

function renderTimeTrialPickerHtml(saveData) {
    var cd = getChallengesSaveData(saveData);
    var html = '<div style="margin-bottom:10px;"><button class="challenge-back-btn btn-secondary" style="font-size:11px; padding:4px 10px;">&larr; Back</button></div>';
    html += '<div style="font-weight:bold; color:#e2b714; margin-bottom:8px;">⏱️ Time Trial — choose a cleared stage</div>';
    var stageIds = getCompletedStageIds(saveData);
    if (stageIds.length === 0) {
        html += '<div style="color:#888; font-size:12px;">Clear a story stage in Missions first.</div>';
        return html;
    }
    html += '<div id="tt-stage-list" style="max-height:320px; overflow-y:auto;">';
    for (var i = 0; i < stageIds.length; i++) {
        var sid = stageIds[i];
        var stage = getStageById(sid);
        if (!stage) continue;
        var par = getTimeTrialPar(sid);
        var best = cd.timeTrial[sid];
        html += '<div class="tt-stage-row" data-stage="' + sid + '" style="cursor:pointer; padding:6px 10px; margin-bottom:4px; background:#16213e; border-radius:6px; font-size:12px;">' +
            '<b>' + stage.name + '</b> (Region ' + stage.region + ') — Par: ' + par + 's' +
            (typeof best === 'number' ? ' — Best: ' + best.toFixed(1) + 's' : '') + '</div>';
    }
    html += '</div>';
    return html;
}

function renderRestrictedRosterPickerHtml(saveData) {
    var html = '<div style="margin-bottom:10px;"><button class="challenge-back-btn btn-secondary" style="font-size:11px; padding:4px 10px;">&larr; Back</button></div>';
    html += '<div style="font-weight:bold; color:#ff8844; margin-bottom:8px;">🔒 Restricted Roster — choose a cleared stage</div>';
    if (!challengesSelectedRestriction) challengesSelectedRestriction = rollRestrictedRosterType();
    html += '<div style="font-size:12px; color:#e2b714; margin-bottom:8px;">Rolled restriction: <b>' + getRestrictedRosterDesc(challengesSelectedRestriction) + '</b> ' +
        '<button id="rr-reroll-btn" class="btn-secondary" style="font-size:10px; padding:2px 8px; margin-left:6px;">Reroll</button></div>';
    var stageIds = getCompletedStageIds(saveData);
    if (stageIds.length === 0) {
        html += '<div style="color:#888; font-size:12px;">Clear a story stage in Missions first.</div>';
        return html;
    }
    var compliance = checkRestrictedRosterCompliance(saveData, challengesSelectedRestriction);
    if (!compliance.passed) {
        html += '<div style="color:#ff6666; font-size:12px; margin-bottom:8px;">⚠️ Your active team doesn\'t comply: ' + compliance.reason + '</div>';
    }
    html += '<div id="rr-stage-list" style="max-height:280px; overflow-y:auto;">';
    for (var i = 0; i < stageIds.length; i++) {
        var sid = stageIds[i];
        var stage = getStageById(sid);
        if (!stage) continue;
        var mult = CHALLENGE_TUNABLES.restrictedRosterVeMult;
        html += '<div class="rr-stage-row" data-stage="' + sid + '" style="cursor:' + (compliance.passed ? 'pointer' : 'not-allowed') + '; opacity:' + (compliance.passed ? '1' : '0.5') + '; padding:6px 10px; margin-bottom:4px; background:#16213e; border-radius:6px; font-size:12px;">' +
            '<b>' + stage.name + '</b> — Reward: ' + Math.floor((stage.rewards.ve || 0) * mult) + ' VE</div>';
    }
    html += '</div>';
    return html;
}

function renderElementBossesHtml(saveData) {
    var cd = getChallengesSaveData(saveData);
    var html = '<div style="margin-bottom:10px;"><button class="challenge-back-btn btn-secondary" style="font-size:11px; padding:4px 10px;">&larr; Back</button></div>';
    html += '<div style="font-weight:bold; color:#cc66ff; margin-bottom:8px;">👑 Element Bosses</div>';
    for (var i = 0; i < ELEMENT_BOSS_KEYS.length; i++) {
        var key = ELEMENT_BOSS_KEYS[i];
        var boss = BOSS_DATA[key];
        var record = cd.elementBosses[key];
        var cleared = record && record.cleared;
        html += '<div class="eb-boss-row" data-boss="' + key + '" style="cursor:pointer; padding:8px 12px; margin-bottom:6px; background:#16213e; border-radius:8px; border:1px solid ' + (cleared ? '#6bcb77' : '#333') + ';">' +
            '<div style="font-weight:bold;">' + boss.emoji + ' ' + boss.name + '</div>' +
            '<div style="font-size:11px; color:#aaa;">Element: ' + ELEMENT_BOSS_ELEMENT[key] + (cleared ? ' — Cleared ' + record.clears + 'x' : ' — Not yet cleared (first clear grants +1 essence)') + '</div></div>';
    }
    return html;
}

function renderChallengesOverlay() {
    var sd = getSaveData();
    var overlay = document.getElementById('challenges-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'challenges-overlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:1000;';
        document.body.appendChild(overlay);
    }

    var unlocked = isChallengesUnlocked(sd);
    var html = '<div style="background:#1a1a2e; border:2px solid #4488cc; border-radius:12px; max-width:560px; width:95%; max-height:85vh; overflow-y:auto; padding:20px;">';
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">' +
        '<div style="font-size:20px; font-weight:bold; color:#66aaff;">🏆 Challenges</div>' +
        '<button id="challenges-close" class="btn-secondary" style="padding:4px 12px; font-size:12px;">Close</button></div>';

    if (!unlocked) {
        html += '<div style="color:#888; font-size:13px;">🔒 Locked until the Shattered Colossus (Region 4 boss) falls.</div>';
    } else if (challengesScreenView === 'time_trial') {
        html += renderTimeTrialPickerHtml(sd);
    } else if (challengesScreenView === 'restricted') {
        html += renderRestrictedRosterPickerHtml(sd);
    } else if (challengesScreenView === 'element_bosses') {
        html += renderElementBossesHtml(sd);
    } else {
        html += renderChallengesMenuHtml(sd);
    }

    html += '</div>';
    overlay.innerHTML = html;
    overlay.style.display = 'flex';

    document.getElementById('challenges-close').onclick = function() { overlay.style.display = 'none'; };
    bindChallengesOverlayEvents(overlay);
}

function bindChallengesOverlayEvents(overlay) {
    var backBtns = overlay.querySelectorAll('.challenge-back-btn');
    for (var b = 0; b < backBtns.length; b++) {
        backBtns[b].onclick = function() { challengesScreenView = 'menu'; renderChallengesOverlay(); };
    }

    var tiles = overlay.querySelectorAll('.challenge-tile');
    for (var t = 0; t < tiles.length; t++) {
        (function(tile) {
            tile.onclick = function() {
                var action = tile.getAttribute('data-action');
                if (action === 'start_survival') {
                    var res = startSurvivalChallenge(getSaveData());
                    if (!res.success) { showToast(res.reason || 'Could not start Survival.'); return; }
                    overlay.style.display = 'none';
                    return;
                }
                var view = tile.getAttribute('data-view');
                if (view) {
                    challengesScreenView = view;
                    if (view === 'restricted') challengesSelectedRestriction = null;
                    renderChallengesOverlay();
                }
            };
        })(tiles[t]);
    }

    var ttRows = overlay.querySelectorAll('.tt-stage-row');
    for (var r = 0; r < ttRows.length; r++) {
        (function(row) {
            row.onclick = function() {
                var sid = row.getAttribute('data-stage');
                var res = startTimeTrialChallenge(getSaveData(), sid);
                if (!res.success) { showToast(res.reason || 'Could not start Time Trial.'); return; }
                overlay.style.display = 'none';
            };
        })(ttRows[r]);
    }

    var rerollBtn = document.getElementById('rr-reroll-btn');
    if (rerollBtn) {
        rerollBtn.onclick = function(e) {
            if (e && e.stopPropagation) e.stopPropagation();
            challengesSelectedRestriction = rollRestrictedRosterType();
            renderChallengesOverlay();
        };
    }

    var rrRows = overlay.querySelectorAll('.rr-stage-row');
    for (var rr = 0; rr < rrRows.length; rr++) {
        (function(row) {
            row.onclick = function() {
                var compliance = checkRestrictedRosterCompliance(getSaveData(), challengesSelectedRestriction);
                if (!compliance.passed) { showToast(compliance.reason); return; }
                var sid = row.getAttribute('data-stage');
                var res = startRestrictedRosterChallenge(getSaveData(), sid, challengesSelectedRestriction);
                if (!res.success) { showToast(res.reason || 'Could not start.'); return; }
                overlay.style.display = 'none';
            };
        })(rrRows[rr]);
    }

    var ebRows = overlay.querySelectorAll('.eb-boss-row');
    for (var eb = 0; eb < ebRows.length; eb++) {
        (function(row) {
            row.onclick = function() {
                var key = row.getAttribute('data-boss');
                var res = startElementBossChallenge(getSaveData(), key);
                if (!res.success) { showToast(res.reason || 'Could not start.'); return; }
                overlay.style.display = 'none';
            };
        })(ebRows[eb]);
    }
}

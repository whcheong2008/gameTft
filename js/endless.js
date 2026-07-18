// =============================================================================
// endless.js -- The Abyss (Prompt 64 / MASTERPLAN 2.6, PHASE2-AUDIT P0 "Endless
// mode"). Infinite-floor endgame content, unlocked after clearing the R8 boss.
//
// Design notes (see CONTENT-DESIGN.md "5. Endless Mode" for flavor -- this is a
// deliberately trimmed implementation per prompts/64-endless-and-challenges.md
// and SCOPE.md's "Endless leaderboards: TRIMMED -> personal best only, no
// server leaderboards" decision):
//   - Infinite floors, 1 wave each. Enemy budget starts around a late-R7-stage
//     budget and grows ~8%/floor compounding (// TUNABLE below).
//   - Floor modifiers from floor 3+: 6 reused encounter mechanics (via
//     combat-encounters.js, passed through as activeMission.encounterMechanic
//     exactly like a real stage) plus 4 pure stat modifiers applied directly
//     to combatState after initCombat() runs (see applyEndlessFloorModifierEffects,
//     called from the ui-combat.js seam in startMissionCombat()).
//   - No healing reset between floors -- units keep current HP, dead units
//     stay dead for the run. Implemented by treating an entire endless run as
//     ONE continuous "mission" (activeMission.isEndless) whose `waves` array
//     is grown one floor at a time, reusing the existing wave-transition
//     machinery (advanceWave/startWaveCombat) with a `skipHpReset` seam added
//     to healBoardUnits() in ui-combat.js.
//   - Between floors: continue (rolls/reveals next floor's modifier) or
//     retreat (banks accumulated VE immediately). Defeat also banks VE.
//   - Personal best: saveData.endless = { bestFloor, totalRuns } via the
//     save.js backfill convention (see js/save.js migrateSave()'s
//     version-agnostic tail + validateSaveData()).
// =============================================================================

// ---- TUNABLE constants ----
var ENDLESS_TUNABLES = {
    // Floor 1 budget anchor: R7's late stages (r7_s7/r7_s8/r7_s9) run
    // final-wave budgets of 28-32 with maxCost 5 -- 30 sits right in that band.
    baseFloorBudget: 30,          // TUNABLE
    growthPerFloor: 0.08,         // TUNABLE -- "~8%/floor compounding" per prompt
    maxCost: 5,                   // T5 units are already the endgame ceiling by R8
    baseEnemyCount: 6,            // TUNABLE
    enemyCountGrowthFloors: 10,   // +1 enemy every N floors (TUNABLE)
    maxEnemyCount: 10,            // TUNABLE cap so late floors stay renderable

    modifierStartFloor: 3,        // "from floor 3+" per prompt

    // Rewards -- TUNABLE. VE per floor scales with depth; milestone bonus
    // (every 5 floors) scales with the milestone number itself so it stays
    // meaningful deep into a run.
    baseVePerFloor: 40,           // TUNABLE
    veGrowthPerFloor: 6,          // TUNABLE (linear component)
    milestoneInterval: 5,         // "every 5 floors" per prompt
    milestoneBaseBonus: 150       // TUNABLE (multiplied by milestone index below)
};

// Tier-mix bands by floor depth. Anchored on R8's endgame drop mix
// (MISSION_TIER_WEIGHTS_BY_REGION[8] = [0,0,15,45,40]) for floor 1-5, then
// shifts further upward with depth per the prompt's "tier mix shifts upward
// with depth" instruction. All TUNABLE.
var ENDLESS_TIER_BANDS = [
    { maxFloor: 5,          weights: [0, 0, 20, 45, 35] },
    { maxFloor: 15,         weights: [0, 0, 10, 40, 50] },
    { maxFloor: 30,         weights: [0, 0, 5, 25, 70] },
    { maxFloor: Infinity,   weights: [0, 0, 0, 15, 85] }
];

function getEndlessTierWeights(floor) {
    for (var i = 0; i < ENDLESS_TIER_BANDS.length; i++) {
        if (floor <= ENDLESS_TIER_BANDS[i].maxFloor) return ENDLESS_TIER_BANDS[i].weights;
    }
    return ENDLESS_TIER_BANDS[ENDLESS_TIER_BANDS.length - 1].weights;
}

function getEndlessFloorBudget(floor) {
    var f = Math.max(1, floor);
    return Math.round(ENDLESS_TUNABLES.baseFloorBudget * Math.pow(1 + ENDLESS_TUNABLES.growthPerFloor, f - 1));
}

function getEndlessEnemyCount(floor) {
    var f = Math.max(1, floor);
    return Math.min(ENDLESS_TUNABLES.maxEnemyCount, ENDLESS_TUNABLES.baseEnemyCount + Math.floor(f / ENDLESS_TUNABLES.enemyCountGrowthFloors));
}

// Generates the enemy roster for a given floor. Tier-weighted (via the
// shared rollTier() helper from gacha.js) rather than the uniform
// "affordable pool" pick generateMissionWave() uses for story stages -- this
// is what makes the "tier mix shifts upward with depth" claim concrete and
// testable, independent of missions.js. Reused as-is by Survival
// (js/challenges.js) with `floor` standing in for "wave number".
function generateEndlessEnemies(floor) {
    var budget = getEndlessFloorBudget(floor);
    var targetCount = getEndlessEnemyCount(floor);
    var weights = getEndlessTierWeights(floor);
    var enemies = [];
    var remaining = budget;

    for (var i = 0; i < targetCount && remaining > 0; i++) {
        var tier = (typeof rollTier === 'function') ? rollTier(weights) : 1;
        while (tier > 1 && tier > remaining) tier--;
        var pool = UNITS_BY_COST[tier];
        if (!pool || pool.length === 0) pool = UNITS_BY_COST[1];
        if (!pool || pool.length === 0) break;
        var key = pool[Math.floor(Math.random() * pool.length)];
        var unit = createUnit(key, 1);
        if (!unit) continue;
        unit.isEnemy = true;
        remaining -= (UNIT_TEMPLATES[key] ? UNIT_TEMPLATES[key].cost : 1);
        enemies.push(unit);
    }
    return enemies;
}

// ---- Floor modifiers ----
// 6 reused encounter mechanics (combat-encounters.js's registry, passed
// through via activeMission.encounterMechanic -- combat-core.js's initCombat()
// already reads that field every wave, so no engine changes are needed) plus
// 4 pure stat modifiers applied directly post-initCombat.
var ENDLESS_ENCOUNTER_MODIFIER_KEYS = ['vip_target', 'countdown', 'reinforcement_pressure', 'protect_objective', 'split_formation', 'escalating_threat'];

var ENDLESS_STAT_MODIFIERS = {
    enemies_atk_up: {
        name: 'Bloodrage', icon: '💢', desc: 'Enemies deal +25% ATK this floor.',
        apply: function(cs) {
            var pct = 0.25; // TUNABLE
            for (var i = 0; i < cs.enemyUnits.length; i++) {
                cs.enemyUnits[i].attack = Math.floor(cs.enemyUnits[i].attack * (1 + pct));
            }
        }
    },
    enemies_dr_up: {
        name: 'Fortified', icon: '🛡️', desc: 'Enemies gain +15% damage reduction this floor.',
        apply: function(cs) {
            var pct = 0.15; // TUNABLE
            for (var i = 0; i < cs.enemyUnits.length; i++) {
                cs.enemyUnits[i].damageReduction = Math.min(0.75, (cs.enemyUnits[i].damageReduction || 0) + pct);
            }
        }
    },
    player_heal_down: {
        name: 'Withering Ground', icon: '💔', desc: 'Your team\'s healing received is reduced 30% this floor.',
        apply: function(cs) {
            var pct = 0.30; // TUNABLE
            for (var i = 0; i < cs.playerUnits.length; i++) {
                if (typeof addStatus === 'function') addStatus(cs.playerUnits[i], 'healReduction', 999, pct, 'endlessModifier');
            }
        }
    },
    player_atkspd_down: {
        name: 'Leaden Air', icon: '⚡', desc: 'Your team attacks 20% slower this floor.',
        apply: function(cs) {
            var pct = -0.20; // TUNABLE (negative spdMod = slower, see combat-core.js's spdMod convention)
            for (var i = 0; i < cs.playerUnits.length; i++) {
                if (typeof addStatus === 'function') addStatus(cs.playerUnits[i], 'spdMod', 999, pct, 'endlessModifier');
            }
        }
    }
};

var ENDLESS_MODIFIER_POOL = ENDLESS_ENCOUNTER_MODIFIER_KEYS.concat(Object.keys(ENDLESS_STAT_MODIFIERS));

function rollEndlessFloorModifier(floor) {
    if (floor < ENDLESS_TUNABLES.modifierStartFloor) return null;
    return ENDLESS_MODIFIER_POOL[Math.floor(Math.random() * ENDLESS_MODIFIER_POOL.length)];
}

// Returns { name, icon, desc } for display on the floor intro / combat banner,
// regardless of whether the key is an encounter mechanic (info lives in
// combat-encounters.js's COMBAT_ENCOUNTER_INFO) or a pure stat modifier
// (info lives in ENDLESS_STAT_MODIFIERS above).
function getEndlessModifierInfo(key) {
    if (!key) return null;
    if (ENDLESS_STAT_MODIFIERS[key]) return ENDLESS_STAT_MODIFIERS[key];
    if (typeof COMBAT_ENCOUNTER_INFO !== 'undefined' && COMBAT_ENCOUNTER_INFO[key]) return COMBAT_ENCOUNTER_INFO[key];
    return null;
}

// Called from the ui-combat.js seam in startMissionCombat(), right after
// initCombat() runs (so it applies to the freshly-built combatState.playerUnits
// / enemyUnits, unaffected by initCombat()'s per-unit statusEffects/mana reset).
// No-ops unless an endless run is active and the current floor rolled a
// "kind:stat" modifier (encounter-mechanic modifiers are already fully
// handled by combat-core.js's existing activeMission.encounterMechanic path).
function applyEndlessFloorModifierEffects(cs) {
    if (!endlessRunState || !endlessRunState.active) return;
    var key = endlessRunState.modifierThisFloor;
    if (!key || !ENDLESS_STAT_MODIFIERS[key]) return;
    ENDLESS_STAT_MODIFIERS[key].apply(cs);
}

// ---- Rewards ----
function getEndlessFloorReward(floor) {
    // TUNABLE: VE per floor scaling with depth (linear + mild superlinear term
    // so very deep floors still feel rewarding).
    return Math.floor(ENDLESS_TUNABLES.baseVePerFloor + floor * ENDLESS_TUNABLES.veGrowthPerFloor + Math.pow(floor, 1.15));
}

function isEndlessMilestoneFloor(floor) {
    return floor > 0 && (floor % ENDLESS_TUNABLES.milestoneInterval) === 0;
}

function getEndlessMilestoneBonus(floor) {
    if (!isEndlessMilestoneFloor(floor)) return 0;
    var milestoneIndex = floor / ENDLESS_TUNABLES.milestoneInterval;
    return Math.floor(ENDLESS_TUNABLES.milestoneBaseBonus * milestoneIndex); // TUNABLE
}

// ---- Unlock gate + personal best ----
function isEndlessUnlocked(saveData) {
    return typeof isRegionBossCleared === 'function' && isRegionBossCleared(saveData, 8);
}

function getEndlessSaveData(saveData) {
    if (!saveData.endless) saveData.endless = { bestFloor: 0, totalRuns: 0 };
    return saveData.endless;
}

// ---- Run state + mission-object plumbing ----
// The whole run is a single activeMission (isEndless:true) whose `waves`
// array grows one entry per floor -- see file header for why.
var endlessRunState = null; // { active, floor, floorsCleared, pendingVE, modifierThisFloor }

function buildEndlessWaveConfig(floor) {
    return { floor: floor, budget: getEndlessFloorBudget(floor), maxCost: ENDLESS_TUNABLES.maxCost, count: getEndlessEnemyCount(floor) };
}

function buildEndlessMission() {
    return {
        id: 'endless_abyss',
        name: 'The Abyss',
        isEndless: true,
        waves: [buildEndlessWaveConfig(1)],
        encounterMechanic: null,
        rewards: { ve: 0 } // unused -- endless grants VE via its own reward functions, not calculateMissionRewards()
    };
}

// Applies endlessRunState.modifierThisFloor to activeMission.encounterMechanic
// so combat-core.js's initCombat() picks it up automatically for
// encounter-mechanic-kind modifiers (no-op / null for stat-kind modifiers,
// which applyEndlessFloorModifierEffects() handles instead).
function syncEndlessMissionModifier() {
    if (!activeMission) return;
    var key = endlessRunState.modifierThisFloor;
    activeMission.encounterMechanic = (key && !ENDLESS_STAT_MODIFIERS[key]) ? key : null;
}

function startEndlessRun(saveData) {
    if (!isEndlessUnlocked(saveData)) return { success: false, reason: 'The Abyss is sealed until the Eternal Throne falls.' };
    var team = getActiveTeam(saveData);
    if (!team || team.slots.length === 0) return { success: false, reason: 'Build a team first!' };

    endlessRunState = { active: true, floor: 1, floorsCleared: 0, pendingVE: 0, modifierThisFloor: rollEndlessFloorModifier(1) };
    pendingMissionIsStory = false;
    pendingMissionIndex = -1;
    if (typeof pendingChallengeType !== 'undefined') pendingChallengeType = null;

    activeMission = buildEndlessMission();
    currentWaveIndex = 0;
    syncEndlessMissionModifier();

    beginCombatScreen(saveData);
    return { success: true };
}

// Called from the ui-combat.js seam in onWaveCombatEnd() when
// activeMission.isEndless is set.
function onEndlessFloorEnd(victory) {
    var floor = endlessRunState.floor;
    if (!victory) {
        finalizeEndlessRun(false);
        return;
    }

    endlessRunState.floorsCleared = floor;
    endlessRunState.pendingVE += getEndlessFloorReward(floor);
    var milestoneBonus = getEndlessMilestoneBonus(floor);
    if (milestoneBonus > 0) endlessRunState.pendingVE += milestoneBonus;

    var nextFloor = floor + 1;
    endlessRunState.floor = nextFloor;
    endlessRunState.modifierThisFloor = rollEndlessFloorModifier(nextFloor);

    if (typeof showEndlessFloorTransition === 'function') showEndlessFloorTransition(floor, milestoneBonus);
}

// Player chose "Continue" on the floor-transition screen.
function uiEndlessContinue() {
    if (!endlessRunState || !endlessRunState.active) return;
    if (typeof healBoardUnits === 'function') healBoardUnits(true); // carry HP forward; dead units are dropped automatically
    activeMission.waves.push(buildEndlessWaveConfig(endlessRunState.floor));
    syncEndlessMissionModifier();
    var transEl = document.getElementById('wave-transition');
    if (transEl) transEl.className = 'wave-transition';
    var extra = document.getElementById('endless-transition-controls');
    if (extra) extra.remove();
    advanceWave();
    startWaveCombat();
}

// Player chose "Retreat" on the floor-transition screen.
function uiEndlessRetreat() {
    if (!endlessRunState || !endlessRunState.active) return;
    var transEl = document.getElementById('wave-transition');
    if (transEl) transEl.className = 'wave-transition';
    var extra = document.getElementById('endless-transition-controls');
    if (extra) extra.remove();
    finalizeEndlessRun(true);
}

function finalizeEndlessRun(wasRetreat) {
    var sd = getSaveData();
    var endlessData = getEndlessSaveData(sd);
    var floorReached = endlessRunState.floorsCleared;
    var grantedVE = endlessRunState.pendingVE;

    sd.player.veilEssence += grantedVE;
    endlessData.bestFloor = Math.max(endlessData.bestFloor, floorReached);
    endlessData.totalRuns += 1;

    if (typeof autoSave === 'function') autoSave(sd);
    endlessRunState.active = false;

    if (typeof showEndlessRunResults === 'function') {
        showEndlessRunResults(!!wasRetreat, floorReached, grantedVE, endlessData.bestFloor);
    }
}

// =============================================================================
// UI -- entry screen (overlay, same pattern as showAchievementPanel/
// showStatsPanel in ui-hub.js) + floor-transition / run-results screens
// (reuse the existing #wave-transition and #combat-results overlays that
// already ship with game-v2.html's combat screen, per the "minimal
// ui-combat.js -- mission-flow seams only" scoping).
// =============================================================================

// ---- Entry screen ----
function showEndlessScreen() {
    var sd = getSaveData();
    var overlay = document.getElementById('endless-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'endless-overlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:1000;';
        document.body.appendChild(overlay);
    }

    var unlocked = isEndlessUnlocked(sd);
    var data = getEndlessSaveData(sd);

    var html = '<div style="background:#1a1a2e; border:2px solid #7a3ab8; border-radius:12px; max-width:480px; width:95%; max-height:85vh; overflow-y:auto; padding:20px; text-align:center;">';
    html += '<div style="font-size:22px; font-weight:bold; color:#b184e0;">🕳️ The Abyss</div>';

    if (!unlocked) {
        html += '<div style="margin-top:14px; color:#888; font-size:13px;">🔒 Sealed until the Eternal Throne (Region 8 boss) falls.</div>';
    } else {
        html += '<div id="endless-best-floor" style="margin-top:10px; font-size:14px; color:#e2b714;">Your best: Floor ' + data.bestFloor + '</div>';
        html += '<div style="margin-top:4px; font-size:11px; color:#888;">Total runs: ' + data.totalRuns + '</div>';
        html += '<div style="margin-top:14px; font-size:12px; color:#aaa; text-align:left;">Infinite floors. Enemies scale each floor; modifiers appear from Floor 3+. No healing between floors — dead units stay dead for the run. Retreat any time to bank your VE.</div>';
        html += '<div style="margin-top:16px;"><button id="endless-start-btn" class="btn-primary">Enter the Abyss</button></div>';
    }

    html += '<div style="margin-top:16px;"><button id="endless-close" class="btn-secondary" style="padding:8px 20px;">Close</button></div>';
    html += '</div>';

    overlay.innerHTML = html;
    overlay.style.display = 'flex';

    document.getElementById('endless-close').onclick = function() { overlay.style.display = 'none'; };
    var startBtn = document.getElementById('endless-start-btn');
    if (startBtn) {
        startBtn.onclick = function() {
            var result = startEndlessRun(getSaveData());
            if (!result.success) {
                showToast(result.reason || 'Could not start The Abyss.');
                return;
            }
            overlay.style.display = 'none';
        };
    }
}

// ---- Floor-transition screen (Continue / Retreat choice) ----
// Repurposes the existing #wave-transition overlay: hides its default
// single button and injects a fresh Continue/Retreat control row plus the
// next floor's modifier preview ("Show the modifier on the floor intro").
function showEndlessFloorTransition(clearedFloor, milestoneBonus) {
    var nextFloor = endlessRunState.floor;

    var textEl = document.getElementById('wave-text');
    if (textEl) textEl.textContent = '🕳️ Floor ' + clearedFloor + ' Cleared!';
    var subEl = document.getElementById('wave-subtext');
    if (subEl) {
        subEl.textContent = 'Banked so far: ' + endlessRunState.pendingVE + ' VE' +
            (milestoneBonus > 0 ? ' (includes +' + milestoneBonus + ' milestone bonus)' : '');
    }
    var transEl = document.getElementById('wave-transition');
    if (transEl) transEl.className = 'wave-transition show';

    var grid = document.getElementById('wave-reposition-grid');
    if (grid) grid.remove(); // no repositioning UI in endless -- units keep their positions

    var defaultBtn = document.querySelector('#wave-transition .btn-primary');
    if (defaultBtn) defaultBtn.style.display = 'none';

    var container = document.getElementById('endless-transition-controls');
    if (!container) {
        container = document.createElement('div');
        container.id = 'endless-transition-controls';
        container.style.cssText = 'margin-top:10px; display:flex; flex-direction:column; gap:8px; align-items:center;';
        if (defaultBtn && defaultBtn.parentNode) defaultBtn.parentNode.insertBefore(container, defaultBtn);
    }

    var modInfo = getEndlessModifierInfo(endlessRunState.modifierThisFloor);
    var modHtml = modInfo ?
        ('<div id="endless-next-modifier" style="font-size:12px; color:#e2b714; padding:6px 10px; background:rgba(226,183,20,0.1); border-radius:6px; max-width:320px;">' +
            (modInfo.icon || '⚠️') + ' <b>' + modInfo.name + '</b> — ' + modInfo.desc + '</div>') : '';

    container.innerHTML =
        '<div style="font-size:13px; color:#aaa;">Floor ' + nextFloor + ' next' + (modInfo ? ' — modifier:' : '') + '</div>' +
        modHtml +
        '<div style="display:flex; gap:10px; margin-top:4px;">' +
        '<button id="endless-continue-btn" class="btn-primary">Continue to Floor ' + nextFloor + '</button>' +
        '<button id="endless-retreat-btn" class="btn-secondary">Retreat (bank ' + endlessRunState.pendingVE + ' VE)</button>' +
        '</div>';

    document.getElementById('endless-continue-btn').onclick = uiEndlessContinue;
    document.getElementById('endless-retreat-btn').onclick = uiEndlessRetreat;
}

// ---- Run-results screen (defeat or retreat) ----
// Reuses the existing #combat-results overlay (same one showMissionResults()
// uses) rather than introducing new UI chrome.
function showEndlessRunResults(wasRetreat, floorReached, grantedVE, bestFloor) {
    var transEl = document.getElementById('wave-transition');
    if (transEl) transEl.className = 'wave-transition';
    var endlessContainer = document.getElementById('endless-transition-controls');
    if (endlessContainer) endlessContainer.remove();

    var titleEl = document.getElementById('results-title');
    if (titleEl) {
        titleEl.textContent = wasRetreat ? 'Retreated from the Abyss' : 'The Abyss Claims You';
        titleEl.className = 'results-title ' + (wasRetreat ? 'victory' : 'defeat');
    }
    var starsEl = document.getElementById('results-stars');
    if (starsEl) starsEl.textContent = '';

    var rewardsEl = document.getElementById('results-rewards');
    if (rewardsEl) {
        rewardsEl.innerHTML =
            '<div>Floor reached: <b>' + floorReached + '</b> (Best: ' + bestFloor + ')</div>' +
            '<div class="text-gold">+' + grantedVE + ' VE banked</div>';
    }

    var resultsEl = document.getElementById('combat-results');
    if (resultsEl) resultsEl.className = 'combat-results show';
    if (typeof renderTopBar === 'function') renderTopBar();
}

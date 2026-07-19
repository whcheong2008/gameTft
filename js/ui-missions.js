// ui-missions.js -- region map, stage select (split from ui-v2.js)

// ---- Mission Select Screen (Region Map) ----

var missionScreenMode = 'regions'; // 'regions' or 'stages'
var selectedRegion = null;

// Prompt 80 (Phase 6.5): region-card header tint. Reuses js/ui-combat.js's
// ARENA_BACKDROP_THEMES (already the canonical per-region accent color --
// the same hex paints that region's combat arena backdrop) instead of
// inventing a second color mapping. ui-missions.js loads before
// ui-combat.js in game-v2.html's script order, but that's fine: this is
// only read from inside render functions, called long after every script
// has finished loading. Presentation only -- no new game data.
function p80RegionAccent(regionNum) {
    if (typeof ARENA_BACKDROP_THEMES !== 'undefined' && ARENA_BACKDROP_THEMES[regionNum]) {
        return ARENA_BACKDROP_THEMES[regionNum].accent;
    }
    return '#e2b714';
}

// Prompt 80: one pip per stage in the region (not per star) -- filled to a
// tier (0-3) by that stage's sd.missions.starRatings best-of-3 rating, same
// data the stage list's own ⭐/☆ row already reads. Pure display aggregation
// over existing save data, no new fields.
function p80RegionStagePips(sd, region) {
    var html = '';
    for (var i = 0; i < region.stageIds.length; i++) {
        var sid = region.stageIds[i];
        var st = (sd.missions.starRatings && sd.missions.starRatings[sid]) || 0;
        html += '<span class="p80-region-pip p80-region-pip-' + st + '" title="' + st + '/3 stars"></span>';
    }
    return html;
}

function renderMissionSelectScreen() {
    if (missionScreenMode === 'stages' && selectedRegion) {
        renderStageListScreen();
    } else {
        renderRegionMapScreen();
    }
}

function renderRegionMapScreen() {
    missionScreenMode = 'regions';
    var sd = getSaveData();
    var storyEl = document.getElementById('story-missions');
    storyEl.innerHTML = '';

    var statuses = getRegionStatuses(sd);

    for (var i = 0; i < statuses.length; i++) {
        var rs = statuses[i];
        var regionNum = rs.region;
        var region = REGIONS[regionNum];
        var unlocked = regionNum === 1 || isRegionBossCleared(sd, regionNum - 1);
        var allDone = rs.complete;
        var canClaim = allDone && !rs.rewardClaimed;
        var accent = p80RegionAccent(regionNum);

        var div = document.createElement('div');
        div.className = 'sv-panel p80-region-card' + (!unlocked ? ' locked' : '') + (allDone ? ' completed' : '');

        var statusIcon = allDone ? (rs.rewardClaimed ? ' ✅' : ' ✓') : '';
        var lockIcon = !unlocked ? ' 🔒' : '';
        var bossChipClass = 'sv-chip p80-boss-chip' + (rs.bossCleared ? ' cleared' : '');
        var bossChipText = rs.bossCleared ? '👑 Boss cleared' : '👑 Boss';

        var html = '<div class="sv-panel-header p80-region-header" style="border-left:4px solid ' + accent + '; background:linear-gradient(90deg,' + accent + '2a,transparent);">';
        html += '<span class="p80-region-title">Region ' + regionNum + ': ' + rs.name + lockIcon + statusIcon + '</span>';
        html += '<span class="' + bossChipClass + '">' + bossChipText + '</span>';
        html += '</div>';

        html += '<div class="sv-panel-body p80-region-body">';
        html += '<div class="p80-region-subtitle">' + rs.subtitle + '</div>';
        html += '<div class="p80-region-progress-row"><span class="text-muted" style="font-size:12px;">' + rs.completedStages + '/' + rs.totalStages + ' stages</span>';
        html += '<span class="p80-region-pips">' + p80RegionStagePips(sd, region) + '</span></div>';
        html += '<div class="p80-region-reward text-gold" style="font-size:11px;">Reward: ' + rs.rewardDescription + '</div>';
        if (!unlocked) {
            html += '<div class="p80-region-lock-req">🔒 Clear Region ' + (regionNum - 1) + '\'s boss stage to unlock</div>';
        }
        if (canClaim) {
            html += '<div style="margin-top:8px;"><button class="sv-btn sv-btn-primary region-claim-btn" data-region="' + regionNum + '">Claim Reward</button></div>';
        }
        html += '</div>';

        div.innerHTML = html;

        if (unlocked) {
            div.style.cursor = 'pointer';
            div.onclick = (function(rNum) {
                return function(e) {
                    if (e.target.classList.contains('region-claim-btn')) return;
                    selectedRegion = rNum;
                    missionScreenMode = 'stages';
                    renderMissionSelectScreen();
                };
            })(regionNum);
        }

        storyEl.appendChild(div);
    }

    // Bind claim buttons
    var claimBtns = storyEl.querySelectorAll('.region-claim-btn');
    for (var cb = 0; cb < claimBtns.length; cb++) {
        claimBtns[cb].addEventListener('click', function(e) {
            e.stopPropagation();
            var rNum = parseInt(this.getAttribute('data-region'));
            uiClaimRegionReward(rNum);
        });
    }

    renderEndlessChallengesEntryCards(sd, storyEl);
}

// Prompt 64: entry cards for endless mode (The Abyss) + challenge modes,
// appended after the region list so post-story players have a natural
// endgame destination alongside the campaign. Mirrors the hub's nav-button
// entry point (ui-hub.js's renderEndlessChallengesNav) -- both call the same
// showEndlessScreen()/showChallengesScreen() overlays from js/endless.js /
// js/challenges.js.
function renderEndlessChallengesEntryCards(sd, storyEl) {
    var endlessOn = (typeof isEndlessUnlocked === 'function') && isEndlessUnlocked(sd);
    var challengesOn = (typeof isChallengesUnlocked === 'function') && isChallengesUnlocked(sd);
    var endlessBest = (typeof getEndlessSaveData === 'function') ? getEndlessSaveData(sd).bestFloor : 0;

    var endlessDiv = document.createElement('div');
    endlessDiv.className = 'sv-panel p80-region-card p80-entry-card' + (!endlessOn ? ' locked' : '');
    endlessDiv.innerHTML =
        '<div class="sv-panel-header p80-region-header" style="border-left:4px solid #7a3ab8; background:linear-gradient(90deg,#7a3ab82a,transparent);">' +
            '<span class="p80-region-title">🕳️ The Abyss (Endless)' + (!endlessOn ? ' 🔒' : '') + '</span>' +
        '</div>' +
        '<div class="sv-panel-body p80-region-body">' +
            '<div class="p80-region-subtitle">' + (endlessOn ? 'Infinite floors. Your best: Floor ' + endlessBest + '.' : 'Unlocks after clearing the Eternal Throne (Region 8 boss).') + '</div>' +
        '</div>';
    if (endlessOn) {
        endlessDiv.style.cursor = 'pointer';
        endlessDiv.onclick = function() { if (typeof showEndlessScreen === 'function') showEndlessScreen(); };
    }
    storyEl.appendChild(endlessDiv);

    var challengesDiv = document.createElement('div');
    challengesDiv.className = 'sv-panel p80-region-card p80-entry-card' + (!challengesOn ? ' locked' : '');
    challengesDiv.innerHTML =
        '<div class="sv-panel-header p80-region-header" style="border-left:4px solid #4488cc; background:linear-gradient(90deg,#4488cc2a,transparent);">' +
            '<span class="p80-region-title">🏆 Challenges' + (!challengesOn ? ' 🔒' : '') + '</span>' +
        '</div>' +
        '<div class="sv-panel-body p80-region-body">' +
            '<div class="p80-region-subtitle">' + (challengesOn ? 'Time Trial, Survival, Restricted Roster, and the 4 Element Bosses.' : 'Unlocks after clearing the Shattered Colossus (Region 4 boss).') + '</div>' +
        '</div>';
    if (challengesOn) {
        challengesDiv.style.cursor = 'pointer';
        challengesDiv.onclick = function() { if (typeof showChallengesScreen === 'function') showChallengesScreen(); };
    }
    storyEl.appendChild(challengesDiv);
}

function uiClaimRegionReward(regionNum) {
    var sd = getSaveData();
    var region = REGIONS[regionNum];
    if (!region) return;
    var reward = region.reward;

    // Rewards that require a choice show a picker first; claimRegionReward()
    // rejects the claim (without marking it claimed) until a valid choice
    // is supplied, so it's safe to just probe with no choice here.
    if (reward.essenceChoice) {
        showRegionRewardPicker(regionNum, 'essence');
        return;
    }
    if (reward.mythicMaterialChoice) {
        showRegionRewardPicker(regionNum, 'mythicMaterial');
        return;
    }

    finalizeRegionRewardClaim(regionNum, null);
}

// choiceType: 'essence' | 'mythicMaterial'
function showRegionRewardPicker(regionNum, choiceType) {
    var overlay = document.getElementById('region-reward-picker-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'region-reward-picker-overlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:2000;';
        document.body.appendChild(overlay);
    }

    var title, optionsHtml, keys;
    if (choiceType === 'essence') {
        title = 'Choose an essence';
        keys = Object.keys(ESSENCES);
        optionsHtml = keys.map(function(k) {
            var e = ESSENCES[k];
            return '<button class="reward-picker-option" data-choice="' + k + '" style="padding:10px 14px; font-size:13px;">' + e.emoji + ' ' + e.name + '</button>';
        }).join('');
    } else {
        title = 'Choose a Mythic Material';
        keys = Object.keys(MYTHIC_MATERIALS);
        optionsHtml = keys.map(function(k) {
            var m = MYTHIC_MATERIALS[k];
            return '<button class="reward-picker-option" data-choice="' + k + '" style="padding:10px 14px; font-size:13px;">' + m.emoji + ' ' + m.name + '</button>';
        }).join('');
    }

    overlay.innerHTML = '<div style="background:#1a1a2e; border:2px solid #e2b714; border-radius:10px; padding:20px; max-width:420px; text-align:center;">' +
        '<div style="font-size:15px; margin-bottom:14px;">' + title + '</div>' +
        '<div id="reward-picker-options" style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center;">' + optionsHtml + '</div>' +
        '<div style="margin-top:16px;"><button id="reward-picker-cancel" class="btn-secondary" style="padding:8px 20px;">Cancel</button></div>' +
        '</div>';
    overlay.style.display = 'flex';

    var optionBtns = overlay.querySelectorAll('.reward-picker-option');
    for (var i = 0; i < optionBtns.length; i++) {
        optionBtns[i].addEventListener('click', (function(chosenKey) {
            return function() {
                overlay.style.display = 'none';
                var choice = (choiceType === 'essence') ? { essenceElement: chosenKey } : { mythicMaterial: chosenKey };
                finalizeRegionRewardClaim(regionNum, choice);
            };
        })(optionBtns[i].getAttribute('data-choice')));
    }
    document.getElementById('reward-picker-cancel').onclick = function() { overlay.style.display = 'none'; };
}

function finalizeRegionRewardClaim(regionNum, choice) {
    var sd = getSaveData();
    var result = claimRegionReward(sd, regionNum, choice);
    if (!result.success) {
        if (!result.needsEssenceChoice && !result.needsMythicChoice) showToast(result.reason || 'Could not claim reward');
        return;
    }

    var granted = result.granted;
    var msg = 'Region ' + regionNum + ' (' + result.regionName + ') reward claimed!';
    if (granted.gold > 0) msg += '\n+' + granted.gold + ' VE';
    if (granted.freeMultiRoll) msg += '\n+' + granted.freeMultiRoll + ' free 10-pull(s)';
    if (granted.unit) {
        var uTmpl = UNIT_TEMPLATES[granted.unit];
        msg += '\nUnit: ' + (uTmpl ? uTmpl.name : granted.unit);
    }
    if (granted.essenceElement) {
        var essDef = ESSENCES[granted.essenceElement];
        msg += '\n+' + granted.essenceAmount + ' ' + (essDef ? essDef.name : granted.essenceElement);
    }
    if (granted.mythicMaterial) {
        var matDef = MYTHIC_MATERIALS[granted.mythicMaterial];
        msg += '\n+' + granted.mythicMaterialAmount + ' ' + (matDef ? matDef.name : granted.mythicMaterial);
    }

    autoSave(sd);
    showToast(msg);
    renderTopBar();
    renderMissionSelectScreen();
}

function renderStageListScreen() {
    var sd = getSaveData();
    if (typeof syncLoreUnlocks === 'function') syncLoreUnlocks(sd);
    var regionNum = selectedRegion;
    var region = REGIONS[regionNum];
    if (!region) { missionScreenMode = 'regions'; renderRegionMapScreen(); return; }

    var storyEl = document.getElementById('story-missions');
    storyEl.innerHTML = '';

    var accent = p80RegionAccent(regionNum);

    // Back button + header
    var header = document.createElement('div');
    header.className = 'p80-stage-list-header';
    header.innerHTML = '<button class="sv-btn" id="region-back-btn">&larr; Back to Regions</button>' +
        '<div class="p80-stage-list-title" style="color:' + accent + ';">Region ' + regionNum + ': ' + region.name + '</div>';
    storyEl.appendChild(header);

    document.getElementById('region-back-btn').onclick = function() {
        missionScreenMode = 'regions';
        selectedRegion = null;
        renderMissionSelectScreen();
    };

    // Render stages
    for (var si = 0; si < region.stageIds.length; si++) {
        var stageId = region.stageIds[si];
        var stageIndex = -1;
        var stage = null;
        for (var j = 0; j < STAGES.length; j++) {
            if (STAGES[j].id === stageId) { stage = STAGES[j]; stageIndex = j; break; }
        }
        if (!stage) continue;

        var unlocked = isStageUnlocked(sd, stageId);
        var completed = isStageCompleted(sd, stageId);
        var lockCheck = stage.lock ? checkLock(sd, stage.lock) : { passed: true, reason: '' };
        var isBoss = !!stage.boss;
        var bestStars = (sd.missions.starRatings && sd.missions.starRatings[stageId]) || 0;

        var div = document.createElement('div');
        div.className = 'sv-panel p80-stage-row' + (!unlocked ? ' locked' : '') + (completed ? ' completed' : '') + (isBoss ? ' boss' : '');

        var starsHtml = '';
        if (bestStars > 0) {
            for (var s = 0; s < 3; s++) starsHtml += s < bestStars ? '⭐' : '☆';
        }

        var waveText = isBoss ? '👑 Boss Fight' : stage.waves.length + ' wave' + (stage.waves.length > 1 ? 's' : '');
        var lockText = '';
        if (!lockCheck.passed && unlocked) {
            lockText = '<div class="p80-stage-lock-req">🔒 ' + lockCheck.reason + '</div>';
        }

        var veReward = stage.rewards.ve || stage.rewards.gold || 0;
        var xpReward = stage.rewards.xp || 0;
        var dropText = stage.rewards.unitDrops ? ' · ' + stage.rewards.unitDrops + ' drops' : '';
        var typeTag = stage.stageType ? '<span class="sv-chip p80-type-chip">' + stage.stageType + '</span>' : '';
        var bossBadge = isBoss ? '<span class="sv-chip p80-boss-chip' + (completed ? ' cleared' : '') + '">👑 Boss</span>' : '';

        // Stage narration flavor block: shown once the stage has been cleared (Prompt 63).
        var loreUnlocked = !!(sd.loreUnlocks && sd.loreUnlocks.stages && sd.loreUnlocks.stages[stageId]);
        var loreText = (typeof STAGE_LORE !== 'undefined' && STAGE_LORE[stageId]) ? STAGE_LORE[stageId] : '';
        var loreHtml = (loreUnlocked && loreText) ?
            '<div class="p80-stage-lore">' + loreText + '</div>' : '';

        div.innerHTML =
            '<div class="p80-stage-main">' +
                '<div class="p80-stage-name-row">' +
                    '<span class="p80-stage-name">' + stage.name + (!unlocked ? ' 🔒' : '') + '</span>' +
                    bossBadge + typeTag +
                '</div>' +
                '<div class="p80-stage-desc">' + stage.description + '</div>' +
                loreHtml +
                '<div class="p80-stage-reward text-gold">Reward: ' + veReward + ' VE · ' + xpReward + ' XP' + dropText + ' · ' + waveText + '</div>' +
                lockText +
            '</div>' +
            '<div class="p80-stage-stars">' + starsHtml + '</div>';

        if (unlocked && lockCheck.passed) {
            div.onclick = (function(idx) {
                return function() { uiSelectStoryMission(idx); };
            })(stageIndex);
        }

        storyEl.appendChild(div);
    }

    // Grind button at bottom
    var grindDiv = document.createElement('div');
    grindDiv.className = 'p80-grind-row';
    grindDiv.innerHTML = '<button class="sv-btn sv-btn-primary" id="grind-from-region">Start Training Mission</button>';
    storyEl.appendChild(grindDiv);
    document.getElementById('grind-from-region').onclick = function() { uiSelectGrindMission(); };
}

// Prompt 71 (Phase 3.5, Task 1): "team building happens ON the same angled
// hex arena the fight happens on -- the TFT deploy experience". Picking a
// stage/training mission now opens the team-builder-on-arena screen (with
// that stage's region backdrop) instead of jumping straight to combat;
// js/ui-builder.js's Deploy button (uiDeployFromBuilder) is what actually
// starts the mission, once the player has adjusted their team.
//
// uiStartStoryMission()/uiStartGrindMission() below are UNCHANGED (still
// deploy + start combat immediately, no builder detour) -- kept exactly as
// they were specifically because tests/harness.js's runCombat() helper (used
// by most of the test suite) calls uiStartStoryMission(stageIndex) directly
// and expects that exact contract; rewiring THAT function would have forced
// every combat-golden/encounter/boss test to route through a screen
// transition it has no reason to care about. New entry points below own the
// builder detour instead; only the mission-select screen's onclick handlers
// (just rewired above) call them.

function uiSelectStoryMission(index) {
    var mission = STORY_MISSIONS[index];
    teamBuilderEntryStage = { index: index, isStory: true, mission: mission };
    showScreen('team-builder');
}

function uiSelectGrindMission() {
    var sd = getSaveData();
    var mission = generateGrindMission(sd.player.level);
    teamBuilderEntryStage = { index: -1, isStory: false, mission: mission };
    showScreen('team-builder');
}

function uiStartStoryMission(index) {
    var sd = getSaveData();
    var team = getActiveTeam(sd);
    if (team.slots.length === 0) {
        showToast('Build a team first!');
        return;
    }
    var mission = STORY_MISSIONS[index];
    pendingMissionIndex = index;
    pendingMissionIsStory = true;
    startMission(sd, mission);
    beginCombatScreen(sd);
}

function uiStartGrindMission() {
    var sd = getSaveData();
    var team = getActiveTeam(sd);
    if (team.slots.length === 0) {
        showToast('Build a team first!');
        return;
    }
    var mission = generateGrindMission(sd.player.level);
    pendingMissionIndex = -1;
    pendingMissionIsStory = false;
    startMission(sd, mission);
    beginCombatScreen(sd);
}


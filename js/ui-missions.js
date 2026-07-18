// ui-missions.js -- region map, stage select (split from ui-v2.js)

// ---- Mission Select Screen (Region Map) ----

var missionScreenMode = 'regions'; // 'regions' or 'stages'
var selectedRegion = null;

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
        var unlocked = regionNum === 1 || isRegionBossCleared(sd, regionNum - 1);
        var allDone = rs.complete;
        var canClaim = allDone && !rs.rewardClaimed;

        var div = document.createElement('div');
        div.className = 'mission-card' + (!unlocked ? ' locked' : '') + (allDone ? ' completed' : '');
        div.style.flexDirection = 'column';
        div.style.alignItems = 'stretch';

        var statusIcon = allDone ? (rs.rewardClaimed ? ' ✅' : ' ✓') : '';
        var lockIcon = !unlocked ? ' 🔒' : '';

        var progressText = rs.completedStages + '/' + rs.totalStages + ' stages';
        var bossText = rs.bossCleared ? '<span style="color:#6bcb77;">Boss: Cleared</span>' : '<span style="color:#888;">Boss: Not cleared</span>';

        var html = '<div style="display:flex; justify-content:space-between; align-items:center;">';
        html += '<div>';
        html += '<div class="m-name">Region ' + regionNum + ': ' + rs.name + lockIcon + statusIcon + '</div>';
        html += '<div class="m-desc">' + rs.subtitle + '</div>';
        html += '<div style="font-size:12px; color:#aaa; margin-top:4px;">' + progressText + ' · ' + bossText + '</div>';
        html += '<div style="font-size:11px; color:#e2b714; margin-top:2px;">Reward: ' + rs.rewardDescription + '</div>';
        html += '</div>';
        html += '</div>';

        if (canClaim) {
            html += '<div style="margin-top:8px;"><button class="btn-primary region-claim-btn" data-region="' + regionNum + '" style="font-size:12px; padding:6px 14px;">Claim Reward</button></div>';
        }

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
    var regionNum = selectedRegion;
    var region = REGIONS[regionNum];
    if (!region) { missionScreenMode = 'regions'; renderRegionMapScreen(); return; }

    var storyEl = document.getElementById('story-missions');
    storyEl.innerHTML = '';

    // Back button + header
    var header = document.createElement('div');
    header.style.cssText = 'display:flex; align-items:center; gap:10px; margin-bottom:10px;';
    header.innerHTML = '<button class="btn-secondary" style="padding:6px 14px; font-size:13px;" id="region-back-btn">&larr; Back to Regions</button>' +
        '<div style="font-size:16px; font-weight:bold; color:#e2b714;">Region ' + regionNum + ': ' + region.name + '</div>';
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
        div.className = 'mission-card' + (!unlocked ? ' locked' : '') + (completed ? ' completed' : '');
        if (isBoss) {
            div.style.borderColor = completed ? '#4a8a5e' : '#884422';
            div.style.borderWidth = '2px';
        }

        var starsHtml = '';
        if (bestStars > 0) {
            for (var s = 0; s < 3; s++) starsHtml += s < bestStars ? '⭐' : '☆';
        }

        var waveText = isBoss ? '👑 Boss Fight' : stage.waves.length + ' wave' + (stage.waves.length > 1 ? 's' : '');
        var lockText = '';
        if (!lockCheck.passed && unlocked) {
            lockText = '<div style="font-size:11px; color:#ff8844; margin-top:2px;">🔒 ' + lockCheck.reason + '</div>';
        }

        var veReward = stage.rewards.ve || stage.rewards.gold || 0;
        var xpReward = stage.rewards.xp || 0;
        var dropText = stage.rewards.unitDrops ? ' · ' + stage.rewards.unitDrops + ' drops' : '';
        var typeTag = stage.stageType ? '<span style="color:#888; font-size:10px; text-transform:uppercase; margin-left:6px;">' + stage.stageType + '</span>' : '';

        div.innerHTML =
            '<div>' +
                '<div class="m-name">' + stage.name + (isBoss ? ' 👑' : '') + (!unlocked ? ' 🔒' : '') + typeTag + '</div>' +
                '<div class="m-desc">' + stage.description + '</div>' +
                '<div class="m-reward">Reward: ' + veReward + ' VE · ' + xpReward + ' XP' + dropText + ' · ' + waveText + '</div>' +
                lockText +
            '</div>' +
            '<div>' +
                '<div class="m-stars">' + starsHtml + '</div>' +
            '</div>';

        if (unlocked && lockCheck.passed) {
            div.onclick = (function(idx) {
                return function() { uiStartStoryMission(idx); };
            })(stageIndex);
        }

        storyEl.appendChild(div);
    }

    // Grind button at bottom
    var grindDiv = document.createElement('div');
    grindDiv.style.cssText = 'margin-top:16px; text-align:center;';
    grindDiv.innerHTML = '<button class="btn-primary" id="grind-from-region">Start Training Mission</button>';
    storyEl.appendChild(grindDiv);
    document.getElementById('grind-from-region').onclick = function() { uiStartGrindMission(); };
}

function uiStartStoryMission(index) {
    var sd = getSaveData();
    var team = getActiveTeam(sd);
    if (team.slots.length === 0) {
        alert('Build a team first!');
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
        alert('Build a team first!');
        return;
    }
    var mission = generateGrindMission(sd.player.level);
    pendingMissionIndex = -1;
    pendingMissionIsStory = false;
    startMission(sd, mission);
    beginCombatScreen(sd);
}


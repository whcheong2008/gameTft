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
    var result = claimRegionReward(sd, regionNum);
    if (result.success) {
        var reward = result.reward;
        var msg = 'Region ' + regionNum + ' (' + result.regionName + ') reward claimed!';
        if (reward.gold > 0) msg += '\n+' + (reward.veilEssence || 0) + ' VE';
        if (reward.freeMultiRoll) msg += '\n+' + reward.freeMultiRoll + ' free 10-pull(s)';
        if (reward.randomUnit) {
            var unitKey = rollOneUnit(reward.randomUnit.minCost);
            if (unitKey) {
                addUnitToCollection(sd, unitKey);
                var uTmpl = UNIT_TEMPLATES[unitKey];
                msg += '\nUnit: ' + (uTmpl ? uTmpl.name : unitKey);
            }
        }
        if (reward.essenceChoice) msg += '\n+' + reward.essenceChoice + ' essence(s) of choice (auto-granted as fire)';
        if (reward.essenceChoice) {
            if (sd.equipment && sd.equipment.essences) {
                sd.equipment.essences.fire = (sd.equipment.essences.fire || 0) + reward.essenceChoice;
            }
        }
        if (reward.mythicMaterialChoice) {
            if (sd.equipment && sd.equipment.mythicMaterials) {
                sd.equipment.mythicMaterials.dragon_scale = (sd.equipment.mythicMaterials.dragon_scale || 0) + reward.mythicMaterialChoice;
            }
            msg += '\n+' + reward.mythicMaterialChoice + ' Mythic Material (Dragon Scale)';
        }
        autoSave(sd);
        showToast(msg);
        renderTopBar();
        renderMissionSelectScreen();
    }
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


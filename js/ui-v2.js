// =============================================================================
// ui-v2.js — All DOM rendering for V2 screens
// =============================================================================

// ---- Status Effect Icon Map ----
var STATUS_ICONS = {
    burn:           '\uD83D\uDD25',
    poison:         '\u2620\uFE0F',
    bleed:          '\uD83E\uDE78',
    stun:           '\u2B50',
    freeze:         '\uD83E\uDDCA',
    silence:        '\uD83D\uDEAB',
    blind:          '\uD83C\uDF11',
    root:           '\uD83C\uDF3F',
    taunt:          '\uD83C\uDFAF',
    slow:           '\uD83D\uDC0C',
    dodgeBuff:      '\uD83D\uDCA8',
    atkBuff:        '\u2694\uFE0F',
    atkMod:         '\uD83D\uDCC9',
    drMod:          '\uD83D\uDEE1\uFE0F',
    spdMod:         '\u26A1',
    reflect:        '\uD83E\uDE9E',
    regen:          '\uD83D\uDC9A',
    healReduction:  '\uD83D\uDC94',
    vulnerability:  '\u26A0\uFE0F'
};

// ---- Toast Notification ----

function showToast(message) {
    var toast = document.createElement('div');
    toast.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#e2b714; color:#1a1a2e; padding:10px 20px; border-radius:8px; font-weight:bold; font-size:13px; z-index:9999; white-space:pre-line; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.5); animation:toastIn 0.3s ease-out;';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(function() { toast.remove(); }, 500);
    }, 3000);
}

// ---- Top Bar ----

function renderTopBar() {
    var sd = getSaveData();
    document.getElementById('player-level').textContent = 'Lv. ' + sd.player.level;
    document.getElementById('player-gold').textContent = '✨ ' + sd.player.veilEssence + ' VE';

    var xpNext = getXPToNextLevel(sd);
    if (sd.player.level >= 20) {
        document.getElementById('player-xp').textContent = 'XP: MAX';
    } else {
        var xpForNext = getXPForLevel(sd.player.level + 1);
        document.getElementById('player-xp').textContent = 'XP: ' + sd.player.xp + '/' + xpForNext;
    }

    // Show back button unless on hub
    var backBtn = document.getElementById('nav-back');
    backBtn.style.display = (currentScreen === 'hub') ? 'none' : 'inline-block';
}

function goBack() {
    if (currentScreen === 'combat') return; // Can't leave mid-combat
    showScreen('hub');
}

// ---- Hub Screen ----

function renderHubScreen() {
    var sd = getSaveData();
    // Achievement catch-all check
    var newAch = checkAchievements(sd);
    if (newAch.length > 0) { autoSave(sd); showAchievementToasts(newAch); }
    var grid = document.getElementById('buildings-grid');
    grid.innerHTML = '';

    var bldKeys = Object.keys(BUILDINGS);
    for (var i = 0; i < bldKeys.length; i++) {
        var id = bldKeys[i];
        var bld = BUILDINGS[id];
        var level = getBuildingLevel(sd, id);
        var canUp = canUpgradeBuilding(sd, id);
        var cost = getBuildingUpgradeCost(id, level);

        // Check prereq locks (buildings have prereq.level in BUILDINGS)
        var prereqLocked = false;
        var prereqText = '';
        if (bld.prereq && bld.prereq.level && sd.player.level < bld.prereq.level) {
            prereqLocked = true;
            prereqText = 'Unlock at Player Level ' + bld.prereq.level;
        }

        var div = document.createElement('div');
        div.className = 'hub-building';
        div.setAttribute('data-building', id);

        if (prereqLocked) {
            div.style.opacity = '0.5';
            div.innerHTML =
                '<div class="emoji">' + bld.emoji + '</div>' +
                '<div class="bld-name">' + bld.name + '</div>' +
                '<div class="bld-level" style="color:#888;">Locked</div>' +
                '<div class="bld-effect" style="color:#666;">' + prereqText + '</div>' +
                '<div class="mt-sm text-muted" style="font-size:11px;">' + bld.description + '</div>';
            grid.appendChild(div);
            continue;
        }

        var costText = level >= bld.maxLevel ? 'MAX' : (cost + ' VE to upgrade');

        div.innerHTML =
            '<div class="emoji">' + bld.emoji + '</div>' +
            '<div class="bld-name">' + bld.name + '</div>' +
            '<div class="bld-level">Level ' + level + ' / ' + bld.maxLevel + '</div>' +
            '<div class="bld-effect">' + getBuildingEffect(id, level) + '</div>' +
            '<div class="mt-sm text-muted" style="font-size:11px;">' + costText + '</div>';

        // Buildings with panels get click-to-open; all others get upgrade-on-click
        var hasPanel = (id === 'deep_resonance' && level >= 1) ||
                       (id === 'echo_shaping' && level >= 1) ||
                       (id === 'prism_focus') ||
                       (id === 'veil_wellspring') ||
                       (id === 'kindred_circle');
        if (hasPanel) {
            div.style.cursor = 'pointer';
            div.onclick = (function(bId) {
                return function() { openBuildingPanel(bId); };
            })(id);
        } else if (canUp) {
            div.onclick = (function(bId) {
                return function() { uiUpgradeBuilding(bId); };
            })(id);
        }

        grid.appendChild(div);
    }
}

function uiUpgradeBuilding(buildingId) {
    var sd = getSaveData();
    var bld = BUILDINGS[buildingId];
    var level = getBuildingLevel(sd, buildingId);
    var cost = getBuildingUpgradeCost(buildingId, level);
    if (!canUpgradeBuilding(sd, buildingId)) return;

    showConfirmDialog(
        'Upgrade ' + bld.name + ' to Level ' + (level + 1) + ' for ' + cost + ' VE?',
        function() {
            var sd2 = getSaveData();
            if (upgradeBuilding(sd2, buildingId)) {
                renderHubScreen();
                renderTopBar();
                // Check achievements after upgrade
                var newAch = checkAchievements(sd2);
                if (newAch.length > 0) showAchievementToasts(newAch);
            }
        }
    );
}

function showConfirmDialog(message, onConfirm) {
    var overlay = document.getElementById('confirm-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'confirm-overlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:2000;';
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = '<div style="background:#1a1a2e; border:2px solid #e2b714; border-radius:10px; padding:20px; max-width:400px; text-align:center;">' +
        '<div style="font-size:14px; margin-bottom:16px;">' + message + '</div>' +
        '<div style="display:flex; gap:10px; justify-content:center;">' +
        '<button id="confirm-ok" class="btn-primary" style="padding:8px 20px;">OK</button>' +
        '<button id="confirm-cancel" class="btn-secondary" style="padding:8px 20px;">Cancel</button>' +
        '</div></div>';
    overlay.style.display = 'flex';
    document.getElementById('confirm-ok').onclick = function() { overlay.style.display = 'none'; onConfirm(); };
    document.getElementById('confirm-cancel').onclick = function() { overlay.style.display = 'none'; };
}

function openBuildingPanel(buildingId) {
    switch (buildingId) {
        case 'deep_resonance': showEvolutionLabPanel(); break;
        case 'echo_shaping': showForgePanel(); break;
        case 'prism_focus': showGemWorkshopPanel(); break;
        case 'veil_wellspring': showManaShrinePanel(); break;
        case 'kindred_circle': showBondHallPanel(); break;
    }
}

// ---- Gem Workshop Panel ----

function showGemWorkshopPanel() {
    var sd = getSaveData();
    var level = getBuildingLevel(sd, 'prism_focus');
    var caps = getGemWorkshopCapabilities(sd);

    var overlay = document.getElementById('gem-workshop-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'gem-workshop-overlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:1000;';
        document.body.appendChild(overlay);
    }

    var html = '<div style="background:#1a1a2e; border:2px solid #e2b714; border-radius:12px; max-width:600px; width:95%; max-height:85vh; overflow-y:auto; padding:20px;">';
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">';
    html += '<div style="font-size:20px; font-weight:bold; color:#e2b714;">💎 Gem Workshop</div>';
    html += '<div style="font-size:12px; color:#aaa;">Level ' + level + ' / ' + BUILDINGS.prism_focus.maxLevel + '</div>';
    html += '</div>';

    // Upgrade button
    var canUp = canUpgradeBuilding(sd, 'prism_focus');
    var upCost = getBuildingUpgradeCost('prism_focus', level);
    if (level < BUILDINGS.prism_focus.maxLevel) {
        html += '<div style="margin-bottom:16px;">';
        html += '<button id="gem-ws-upgrade" style="padding:6px 14px; background:' + (canUp ? '#e2b714' : '#444') + '; color:' + (canUp ? '#000' : '#888') + '; border:none; border-radius:6px; cursor:' + (canUp ? 'pointer' : 'default') + '; font-size:12px;"' + (canUp ? '' : ' disabled') + '>';
        html += 'Upgrade to Level ' + (level + 1) + ' (' + upCost + ' VE)';
        html += '</button></div>';
    }

    // Capabilities checklist
    html += '<div style="margin-bottom:16px;">';
    html += '<div style="font-size:14px; font-weight:bold; margin-bottom:8px;">Capabilities</div>';
    var gemCaps = [
        { lvl: 1, desc: 'Socket gems onto items' },
        { lvl: 2, desc: 'Combine 3 same-type gems into next rarity + Remove socketed gems' },
        { lvl: 3, desc: 'Transmute gems (swap type, 30 VE)' },
        { lvl: 4, desc: 'Auto-socket recommendation' },
        { lvl: 5, desc: 'Prismatic Forge (craft prismatic gems)' }
    ];
    for (var i = 0; i < gemCaps.length; i++) {
        var unlocked = level >= gemCaps[i].lvl;
        html += '<div style="font-size:12px; color:' + (unlocked ? '#6bcb77' : '#666') + '; margin-bottom:4px;">' +
            (unlocked ? '✓' : '○') + ' L' + gemCaps[i].lvl + ': ' + gemCaps[i].desc + '</div>';
    }
    html += '</div>';

    // Gem socketing UI placeholder
    if (level >= 1) {
        html += '<div style="margin-bottom:16px;">';
        html += '<div style="font-size:14px; font-weight:bold; margin-bottom:8px;">Gem Socketing</div>';
        // Show items with sockets from bench
        var bench = getBenchItems(sd);
        var socketableItems = [];
        for (var bi = 0; bi < bench.length; bi++) {
            if (bench[bi].type === 'combined' || bench[bi].type === 'set' || bench[bi].type === 'ability' || bench[bi].type === 'mythic') {
                socketableItems.push(bench[bi]);
            }
        }
        if (socketableItems.length === 0) {
            html += '<div style="font-size:12px; color:#666;">No items available for socketing. Craft combined items first.</div>';
        } else {
            html += '<div style="font-size:12px; color:#aaa;">Items on bench: ' + socketableItems.length + ' (gem socketing uses item socket slots)</div>';
        }
        html += '</div>';
    }

    html += '<div style="text-align:center; margin-top:16px;">';
    html += '<button id="gem-ws-close" style="padding:8px 20px; background:#333; color:#fff; border:none; border-radius:6px; cursor:pointer;">Close</button>';
    html += '</div>';
    html += '</div>';

    overlay.innerHTML = html;
    overlay.style.display = 'flex';

    document.getElementById('gem-ws-close').onclick = function() { overlay.style.display = 'none'; };

    var upBtn = document.getElementById('gem-ws-upgrade');
    if (upBtn && canUp) {
        upBtn.onclick = function() {
            uiUpgradeBuilding('prism_focus');
            overlay.style.display = 'none';
        };
    }
}

// ---- Mana Shrine Panel ----

function showManaShrinePanel() {
    var sd = getSaveData();
    var level = getBuildingLevel(sd, 'veil_wellspring');

    var overlay = document.getElementById('mana-shrine-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'mana-shrine-overlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:1000;';
        document.body.appendChild(overlay);
    }

    var html = '<div style="background:#1a1a2e; border:2px solid #4488ff; border-radius:12px; max-width:500px; width:95%; max-height:85vh; overflow-y:auto; padding:20px;">';
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">';
    html += '<div style="font-size:20px; font-weight:bold; color:#4488ff;">🔵 Mana Shrine</div>';
    html += '<div style="font-size:12px; color:#aaa;">Level ' + level + ' / ' + BUILDINGS.veil_wellspring.maxLevel + '</div>';
    html += '</div>';

    var canUp = canUpgradeBuilding(sd, 'veil_wellspring');
    var upCost = getBuildingUpgradeCost('veil_wellspring', level);
    if (level < BUILDINGS.veil_wellspring.maxLevel) {
        html += '<div style="margin-bottom:16px;">';
        html += '<button id="mana-shrine-upgrade" style="padding:6px 14px; background:' + (canUp ? '#4488ff' : '#444') + '; color:' + (canUp ? '#fff' : '#888') + '; border:none; border-radius:6px; cursor:' + (canUp ? 'pointer' : 'default') + '; font-size:12px;"' + (canUp ? '' : ' disabled') + '>';
        html += 'Upgrade to Level ' + (level + 1) + ' (' + upCost + ' VE)';
        html += '</button></div>';
    }

    // Bonuses checklist
    html += '<div style="font-size:14px; font-weight:bold; margin-bottom:8px;">Passive Combat Bonuses</div>';
    var manaBonuses = [
        { lvl: 1, desc: '+5 starting mana for all units' },
        { lvl: 2, desc: '+10% mana generation rate' },
        { lvl: 3, desc: '+5% ability damage' },
        { lvl: 4, desc: '10% mana discount on first cast' },
        { lvl: 5, desc: '+10% ATK when mana is full' }
    ];
    for (var i = 0; i < manaBonuses.length; i++) {
        var unlocked = level >= manaBonuses[i].lvl;
        html += '<div style="font-size:12px; color:' + (unlocked ? '#6bcb77' : '#666') + '; margin-bottom:4px;">' +
            (unlocked ? '✓' : '○') + ' L' + manaBonuses[i].lvl + ': ' + manaBonuses[i].desc + '</div>';
    }
    html += '<div style="font-size:11px; color:#888; margin-top:8px; font-style:italic;">These bonuses are applied automatically in combat.</div>';

    html += '<div style="text-align:center; margin-top:16px;">';
    html += '<button id="mana-shrine-close" style="padding:8px 20px; background:#333; color:#fff; border:none; border-radius:6px; cursor:pointer;">Close</button>';
    html += '</div>';
    html += '</div>';

    overlay.innerHTML = html;
    overlay.style.display = 'flex';

    document.getElementById('mana-shrine-close').onclick = function() { overlay.style.display = 'none'; };

    var upBtn = document.getElementById('mana-shrine-upgrade');
    if (upBtn && canUp) {
        upBtn.onclick = function() {
            uiUpgradeBuilding('veil_wellspring');
            overlay.style.display = 'none';
        };
    }
}

// ---- Bond Hall Panel ----

function showBondHallPanel() {
    var sd = getSaveData();
    var level = getBuildingLevel(sd, 'kindred_circle');
    var bonuses = getBondHallBonuses(sd);

    var overlay = document.getElementById('bond-hall-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'bond-hall-overlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:1000;';
        document.body.appendChild(overlay);
    }

    var html = '<div style="background:#1a1a2e; border:2px solid #44aa88; border-radius:12px; max-width:600px; width:95%; max-height:85vh; overflow-y:auto; padding:20px;">';
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">';
    html += '<div style="font-size:20px; font-weight:bold; color:#44aa88;">🤝 Bond Hall</div>';
    html += '<div style="font-size:12px; color:#aaa;">Level ' + level + ' / ' + BUILDINGS.kindred_circle.maxLevel + '</div>';
    html += '</div>';

    var canUp = canUpgradeBuilding(sd, 'kindred_circle');
    var upCost = getBuildingUpgradeCost('kindred_circle', level);
    if (level < BUILDINGS.kindred_circle.maxLevel) {
        html += '<div style="margin-bottom:16px;">';
        html += '<button id="bond-hall-upgrade" style="padding:6px 14px; background:' + (canUp ? '#44aa88' : '#444') + '; color:' + (canUp ? '#fff' : '#888') + '; border:none; border-radius:6px; cursor:' + (canUp ? 'pointer' : 'default') + '; font-size:12px;"' + (canUp ? '' : ' disabled') + '>';
        html += 'Upgrade to Level ' + (level + 1) + ' (' + upCost + ' VE)';
        html += '</button></div>';
    }

    // Bonuses checklist
    html += '<div style="font-size:14px; font-weight:bold; margin-bottom:8px;">Bonuses</div>';
    var bondBonusList = [
        { lvl: 1, desc: 'View unit bonds' },
        { lvl: 2, desc: '+25% bond bonus' },
        { lvl: 3, desc: 'Show bond hints in team builder' },
        { lvl: 4, desc: '+50% bond bonus (replaces 25%)' },
        { lvl: 5, desc: 'Trio bonds unlocked' }
    ];
    for (var i = 0; i < bondBonusList.length; i++) {
        var unlocked = level >= bondBonusList[i].lvl;
        html += '<div style="font-size:12px; color:' + (unlocked ? '#6bcb77' : '#666') + '; margin-bottom:4px;">' +
            (unlocked ? '✓' : '○') + ' L' + bondBonusList[i].lvl + ': ' + bondBonusList[i].desc + '</div>';
    }

    // Bond viewer (if level >= 1)
    if (level >= 1) {
        html += '<div style="margin-top:16px; font-size:14px; font-weight:bold; margin-bottom:8px;">Unit Bonds</div>';
        if (typeof UNIT_BONDS !== 'undefined' && UNIT_BONDS) {
            var bondKeys = Object.keys(UNIT_BONDS);
            for (var bi = 0; bi < bondKeys.length; bi++) {
                var bond = UNIT_BONDS[bondKeys[bi]];
                var unitsOwned = 0;
                var unitNames = [];
                for (var ui = 0; ui < bond.units.length; ui++) {
                    var uKey = bond.units[ui];
                    var tmpl = UNIT_TEMPLATES[uKey] || EVOLVED_TEMPLATES[uKey];
                    var owned = !!sd.collection[uKey];
                    if (owned) unitsOwned++;
                    unitNames.push('<span style="color:' + (owned ? '#6bcb77' : '#666') + ';">' + (tmpl ? tmpl.name : uKey) + '</span>');
                }
                var active = unitsOwned >= bond.units.length;
                html += '<div style="padding:6px 8px; margin-bottom:4px; background:' + (active ? '#1a3328' : '#16213e') + '; border-radius:6px; border:1px solid ' + (active ? '#44aa88' : '#333') + ';">';
                html += '<div style="font-size:12px;">' + (bond.emoji || '🤝') + ' <strong>' + bond.name + '</strong> <span style="color:#888;">(' + unitsOwned + '/' + bond.units.length + ')</span></div>';
                html += '<div style="font-size:11px; color:#aaa;">' + unitNames.join(' + ') + '</div>';
                html += '<div style="font-size:11px; color:#e2b714;">' + bond.bonus + '</div>';
                html += '</div>';
            }
        } else {
            html += '<div style="font-size:12px; color:#888; font-style:italic;">Bond data not yet available. Coming soon!</div>';
        }
    }

    html += '<div style="text-align:center; margin-top:16px;">';
    html += '<button id="bond-hall-close" style="padding:8px 20px; background:#333; color:#fff; border:none; border-radius:6px; cursor:pointer;">Close</button>';
    html += '</div>';
    html += '</div>';

    overlay.innerHTML = html;
    overlay.style.display = 'flex';

    document.getElementById('bond-hall-close').onclick = function() { overlay.style.display = 'none'; };

    var upBtn = document.getElementById('bond-hall-upgrade');
    if (upBtn && canUp) {
        upBtn.onclick = function() {
            uiUpgradeBuilding('kindred_circle');
            overlay.style.display = 'none';
        };
    }
}

// ---- Evolution Lab Panel ----

function showEvolutionLabPanel() {
    var sd = getSaveData();
    var labLevel = getBuildingLevel(sd, 'deep_resonance');

    var overlay = document.getElementById('evolution-lab-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'evolution-lab-overlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:1000;';
        document.body.appendChild(overlay);
    }

    var html = '<div style="background:#1a1a2e; border:2px solid #e2b714; border-radius:12px; max-width:700px; width:95%; max-height:85vh; overflow-y:auto; padding:20px;">';
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">';
    html += '<div style="font-size:20px; font-weight:bold; color:#e2b714;">🧬 Evolution Lab</div>';
    html += '<div style="font-size:12px; color:#aaa;">Level ' + labLevel + ' · ' + getBuildingEffect('deep_resonance', labLevel) + '</div>';
    html += '</div>';

    // Upgrade button if not max
    var canUp = canUpgradeBuilding(sd, 'deep_resonance');
    var upCost = getBuildingUpgradeCost('deep_resonance', labLevel);
    if (labLevel < BUILDINGS.deep_resonance.maxLevel) {
        html += '<div style="margin-bottom:16px;">';
        html += '<button id="evo-lab-upgrade" style="padding:6px 14px; background:' + (canUp ? '#e2b714' : '#444') + '; color:' + (canUp ? '#000' : '#888') + '; border:none; border-radius:6px; cursor:' + (canUp ? 'pointer' : 'default') + '; font-size:12px;"' + (canUp ? '' : ' disabled') + '>';
        html += 'Upgrade to Level ' + (labLevel + 1) + ' (' + upCost + ' VE)';
        html += '</button></div>';
    }

    // Status message area
    html += '<div id="evo-lab-status" style="margin-bottom:12px; font-size:13px; min-height:20px;"></div>';

    // List all 16 evolution paths
    var evoKeys = Object.keys(EVOLUTIONS);
    for (var i = 0; i < evoKeys.length; i++) {
        var baseKey = evoKeys[i];
        var evo = EVOLUTIONS[baseKey];
        var baseTmpl = UNIT_TEMPLATES[baseKey];
        var evolvedTmpl = EVOLVED_TEMPLATES[evo.into];
        if (!baseTmpl || !evolvedTmpl) continue;

        var baseEntry = sd.collection[baseKey];
        var alreadyEvolved = !!sd.collection[evo.into];
        var owned = !!baseEntry;

        html += '<div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; margin-bottom:6px; background:' + (owned ? '#222244' : '#1a1a22') + '; border-radius:8px; border:1px solid ' + (alreadyEvolved ? '#6bcb77' : owned ? '#333' : '#222') + ';">';

        // Left: base unit info
        html += '<div style="flex:1;">';
        html += '<div style="font-size:13px;">';
        html += baseTmpl.emoji + ' <strong>' + baseTmpl.name + '</strong>';
        if (owned) {
            var baseStarsStr = '';
            for (var bs = 0; bs < baseEntry.stars; bs++) baseStarsStr += '⭐';
            html += ' ' + baseStarsStr;
        }
        html += ' <span style="color:#888;">→</span> ' + evolvedTmpl.emoji + ' <strong style="color:#e2b714;">' + evolvedTmpl.name + '</strong>';
        html += '</div>';

        // Requirements
        if (!owned) {
            html += '<div style="font-size:11px; color:#666; margin-top:2px;">Not Owned</div>';
        } else {
            var check = checkEvolutionRequirements(sd, baseKey);
            if (check.requirements) {
                var reqStrs = [];
                for (var ri3 = 0; ri3 < check.requirements.length; ri3++) {
                    var rq = check.requirements[ri3];
                    reqStrs.push((rq.met ? '✅' : '❌') + ' ' + rq.desc);
                }
                html += '<div style="font-size:11px; color:#aaa; margin-top:2px;">' + reqStrs.join(' · ') + '</div>';
            }
            if (!alreadyEvolved) {
                var goldCost = getEvolutionGoldCost(sd, baseKey);
                html += '<div style="font-size:11px; color:#e2b714; margin-top:1px;">Cost: ' + goldCost + ' VE</div>';
            }
        }
        html += '</div>';

        // Right: action button
        html += '<div style="margin-left:12px;">';
        if (alreadyEvolved) {
            html += '<span style="color:#6bcb77; font-size:12px; font-weight:bold;">✅ Evolved</span>';
        } else if (!owned) {
            html += '<span style="color:#555; font-size:11px;">—</span>';
        } else {
            var check2 = checkEvolutionRequirements(sd, baseKey);
            var goldCost2 = getEvolutionGoldCost(sd, baseKey);
            var canDoEvo = check2.canEvolve && sd.player.veilEssence >= goldCost2;
            html += '<button class="evo-btn" data-base-key="' + baseKey + '" style="padding:5px 12px; background:' + (canDoEvo ? '#e2b714' : '#333') + '; color:' + (canDoEvo ? '#000' : '#666') + '; border:none; border-radius:6px; cursor:' + (canDoEvo ? 'pointer' : 'default') + '; font-size:12px; font-weight:bold;"' + (canDoEvo ? '' : ' disabled') + '>';
            if (!check2.canEvolve) {
                html += 'Requirements Not Met';
            } else if (sd.player.veilEssence < goldCost2) {
                html += 'Need ' + goldCost2 + ' VE';
            } else {
                html += 'EVOLVE';
            }
            html += '</button>';
        }
        html += '</div>';

        html += '</div>';
    }

    html += '<div style="text-align:center; margin-top:16px;">';
    html += '<button id="evo-lab-close" style="padding:8px 20px; background:#333; color:#fff; border:none; border-radius:6px; cursor:pointer;">Close</button>';
    html += '</div>';
    html += '</div>';

    overlay.innerHTML = html;
    overlay.style.display = 'flex';

    // Bind close button
    document.getElementById('evo-lab-close').onclick = function() {
        overlay.style.display = 'none';
    };

    // Bind upgrade button
    var upBtn = document.getElementById('evo-lab-upgrade');
    if (upBtn && canUp) {
        upBtn.onclick = function() {
            var sd2 = getSaveData();
            if (upgradeBuilding(sd2, 'deep_resonance')) {
                renderTopBar();
                showEvolutionLabPanel();
            }
        };
    }

    // Bind evolve buttons
    var evoBtns = overlay.querySelectorAll('.evo-btn');
    for (var eb = 0; eb < evoBtns.length; eb++) {
        evoBtns[eb].addEventListener('click', function() {
            var bk = this.getAttribute('data-base-key');
            var sd3 = getSaveData();
            var result = evolveUnit(sd3, bk);
            if (result.success) {
                var baseName = UNIT_TEMPLATES[bk] ? UNIT_TEMPLATES[bk].name : bk;
                var evoName = EVOLVED_TEMPLATES[result.evolvedKey] ? EVOLVED_TEMPLATES[result.evolvedKey].name : result.evolvedKey;
                renderTopBar();
                showEvolutionLabPanel();
                var statusEl = document.getElementById('evo-lab-status');
                if (statusEl) {
                    statusEl.innerHTML = '<div style="color:#6bcb77; animation: fadeIn 0.3s;">🧬 ' + baseName + ' evolved into ' + evoName + '!</div>';
                }
            }
        });
    }
}

// ---- Forge Panel ----

function showForgePanel() {
    var sd = getSaveData();
    var forgeLevel = getBuildingLevel(sd, 'echo_shaping');

    var overlay = document.getElementById('forge-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'forge-overlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:1000;';
        document.body.appendChild(overlay);
    }

    var html = '<div style="background:#1a1a2e; border:2px solid #e2b714; border-radius:12px; max-width:750px; width:95%; max-height:85vh; overflow-y:auto; padding:20px;">';
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">';
    html += '<div style="font-size:20px; font-weight:bold; color:#e2b714;">🔨 Forge</div>';
    html += '<div style="font-size:12px; color:#aaa;">Level ' + forgeLevel + ' · ' + getBuildingEffect('echo_shaping', forgeLevel) + '</div>';
    html += '</div>';

    // Upgrade button
    var canUp = canUpgradeBuilding(sd, 'echo_shaping');
    var upCost = getBuildingUpgradeCost('echo_shaping', forgeLevel);
    if (forgeLevel < BUILDINGS.echo_shaping.maxLevel) {
        html += '<div style="margin-bottom:12px;">';
        html += '<button id="forge-upgrade" style="padding:6px 14px; background:' + (canUp ? '#e2b714' : '#444') + '; color:' + (canUp ? '#000' : '#888') + '; border:none; border-radius:6px; cursor:' + (canUp ? 'pointer' : 'default') + '; font-size:12px;"' + (canUp ? '' : ' disabled') + '>';
        html += 'Upgrade to Level ' + (forgeLevel + 1) + ' (' + upCost + ' VE)';
        html += '</button></div>';
    }

    // Essence + materials display
    html += '<div style="margin-bottom:12px; padding:8px; background:#111; border-radius:6px; font-size:12px;">';
    html += '<strong>Essences:</strong> ';
    var essElements = ['fire', 'water', 'earth', 'wind', 'lightning', 'force', 'arcane'];
    for (var ei = 0; ei < essElements.length; ei++) {
        var eKey = essElements[ei];
        var eCount = (sd.equipment && sd.equipment.essences && sd.equipment.essences[eKey]) || 0;
        if (eCount > 0) html += ESSENCES[eKey].emoji + '×' + eCount + '  ';
    }
    html += '<br><strong>Mythic Mats:</strong> ';
    if (sd.equipment && sd.equipment.mythicMaterials) {
        var mats = sd.equipment.mythicMaterials;
        if (mats.dragon_scale) html += '🐉×' + mats.dragon_scale + '  ';
        if (mats.void_crystal) html += '🔮×' + mats.void_crystal + '  ';
        if (mats.world_shard) html += '🌍×' + mats.world_shard + '  ';
    }
    html += '</div>';

    html += '<div id="forge-status" style="margin-bottom:10px; font-size:13px; min-height:20px;"></div>';

    // New forge tabs
    html += '<div id="forge-tabs" style="display:flex; gap:4px; margin-bottom:12px; flex-wrap:wrap;">';
    var tabNames = ['Enhance', 'Salvage', 'Reforge', 'Gems', 'Set Infuse', 'Mythic Forge'];
    var tabMinLevels = [1, 1, 3, 3, 4, 5];
    for (var ti = 0; ti < tabNames.length; ti++) {
        var unlocked = forgeLevel >= tabMinLevels[ti];
        html += '<button class="forge-tab" data-tab="' + ti + '" style="padding:5px 12px; font-size:12px; border:1px solid ' + (unlocked ? '#555' : '#333') + '; background:' + (ti === 0 && unlocked ? '#333' : '#1a1a2e') + '; color:' + (unlocked ? '#fff' : '#555') + '; border-radius:4px; cursor:' + (unlocked ? 'pointer' : 'default') + ';"' + (unlocked ? '' : ' disabled') + '>' + tabNames[ti] + (unlocked ? '' : ' 🔒') + '</button>';
    }
    html += '</div>';

    html += '<div id="forge-content">';
    html += renderForgeTabContent(sd, 0, forgeLevel);
    html += '</div>';

    html += '<div style="text-align:center; margin-top:16px;">';
    html += '<button id="forge-close" style="padding:8px 20px; background:#333; color:#fff; border:none; border-radius:6px; cursor:pointer;">Close</button>';
    html += '</div>';
    html += '</div>';

    overlay.innerHTML = html;
    overlay.style.display = 'flex';

    document.getElementById('forge-close').onclick = function() { overlay.style.display = 'none'; };

    var upBtn = document.getElementById('forge-upgrade');
    if (upBtn && canUp) {
        upBtn.onclick = function() {
            var sd2 = getSaveData();
            if (upgradeBuilding(sd2, 'echo_shaping')) { renderTopBar(); showForgePanel(); }
        };
    }

    bindForgeTabs();
    bindForgeActions();
}

function bindForgeTabs() {
    var tabs = document.querySelectorAll('.forge-tab');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].addEventListener('click', function() {
            var tabIndex = parseInt(this.getAttribute('data-tab'));
            var sd = getSaveData();
            var forgeLevel = getBuildingLevel(sd, 'echo_shaping');
            document.getElementById('forge-content').innerHTML = renderForgeTabContent(sd, tabIndex, forgeLevel);
            // Highlight active tab
            var allTabs = document.querySelectorAll('.forge-tab');
            for (var j = 0; j < allTabs.length; j++) {
                allTabs[j].style.background = '#1a1a2e';
            }
            this.style.background = '#333';
            bindForgeActions();
        });
    }
}

function renderForgeTabContent(sd, tabIndex, forgeLevel) {
    var inv = (sd.equipment && sd.equipment.inventory) ? sd.equipment.inventory : [];
    var unequipped = [];
    for (var ui = 0; ui < inv.length; ui++) { if (!inv[ui].equipped) unequipped.push(inv[ui]); }
    var html = '';

    if (tabIndex === 0 && forgeLevel >= 1) {
        // Enhance
        html += '<div style="font-size:14px; font-weight:bold; margin-bottom:8px;">Enhance Equipment (+0 to +10)</div>';
        var enhanceable = [];
        for (var i = 0; i < unequipped.length; i++) { if (unequipped[i].rarity !== 'common') enhanceable.push(unequipped[i]); }
        // Also show equipped items
        for (var ei2 = 0; ei2 < inv.length; ei2++) { if (inv[ei2].equipped && inv[ei2].rarity !== 'common') enhanceable.push(inv[ei2]); }
        if (enhanceable.length === 0) {
            html += '<div style="color:#666; font-size:12px;">No enhanceable equipment (need Uncommon+ rarity)</div>';
        }
        for (var ci = 0; ci < enhanceable.length; ci++) {
            var c = enhanceable[ci];
            var eCost = getEnhancementCost(c);
            var canAfford = eCost && sd.player.veilEssence >= eCost;
            var eqLabel = c.equipped ? ' <span style="color:#6bcb77; font-size:10px;">[Equipped]</span>' : '';
            html += '<div style="display:flex; align-items:center; justify-content:space-between; padding:6px 10px; margin-bottom:4px; background:#16213e; border-radius:6px; border:1px solid ' + getItemRarityColor(c) + ';">';
            html += '<div style="flex:1;">' + getItemEmoji(c) + ' ' + getItemName(c) + ' <span style="color:' + getItemRarityColor(c) + '; font-size:11px;">' + getItemRarityName(c) + '</span>' + eqLabel;
            html += '<div style="font-size:10px; color:#888;">' + getItemStatDescription(c) + '</div></div>';
            if (eCost) {
                html += '<button class="forge-enhance" data-item-id="' + c.id + '" style="padding:3px 10px; font-size:11px; background:' + (canAfford ? '#e2b714' : '#333') + '; color:' + (canAfford ? '#000' : '#666') + '; border:none; border-radius:4px; cursor:' + (canAfford ? 'pointer' : 'default') + ';"' + (canAfford ? '' : ' disabled') + '>+' + ((c.enhanceLevel || 0) + 1) + ' (' + eCost + ' VE)</button>';
            } else {
                html += '<span style="color:#6bcb77; font-size:11px;">MAX</span>';
            }
            html += '</div>';
        }
    } else if (tabIndex === 1 && forgeLevel >= 1) {
        // Salvage
        html += '<div style="font-size:14px; font-weight:bold; margin-bottom:8px;">Salvage Equipment → Scraps + Gems</div>';
        if (unequipped.length === 0) {
            html += '<div style="color:#666; font-size:12px;">No unequipped equipment to salvage</div>';
        }
        for (var si = 0; si < unequipped.length; si++) {
            var s = unequipped[si];
            if (s.rarity === 'mythic') continue;
            html += '<div style="display:flex; align-items:center; justify-content:space-between; padding:6px 10px; margin-bottom:4px; background:#16213e; border-radius:6px; border:1px solid ' + getItemRarityColor(s) + ';">';
            html += '<div>' + getItemEmoji(s) + ' ' + getItemName(s) + ' <span style="color:' + getItemRarityColor(s) + ';">' + getItemRarityName(s) + '</span></div>';
            html += '<button class="forge-salvage" data-item-id="' + s.id + '" style="padding:3px 10px; font-size:11px; background:#553333; color:#ff6666; border:none; border-radius:4px; cursor:pointer;">SALVAGE</button>';
            html += '</div>';
        }
    } else if (tabIndex === 2 && forgeLevel >= 3) {
        // Reforge Affixes
        html += '<div style="font-size:14px; font-weight:bold; margin-bottom:8px;">Reforge Affixes (40 VE — reroll all bonus affixes)</div>';
        var reforgeItems = [];
        for (var ri = 0; ri < inv.length; ri++) { if (inv[ri].rarity !== 'common' && inv[ri].rarity !== 'mythic') reforgeItems.push(inv[ri]); }
        if (reforgeItems.length === 0) {
            html += '<div style="color:#666; font-size:12px;">No equipment with affixes to reforge</div>';
        }
        for (var rj = 0; rj < reforgeItems.length; rj++) {
            var r = reforgeItems[rj];
            var canReforge = sd.player.veilEssence >= 40;
            var eqLabel2 = r.equipped ? ' <span style="color:#6bcb77; font-size:10px;">[Eq]</span>' : '';
            html += '<div style="display:flex; align-items:center; justify-content:space-between; padding:6px 10px; margin-bottom:4px; background:#16213e; border-radius:6px; border:1px solid ' + getItemRarityColor(r) + ';">';
            html += '<div style="flex:1;">' + getItemEmoji(r) + ' ' + getItemName(r) + eqLabel2;
            if (r.affixes && r.affixes.length > 0) {
                html += '<div style="font-size:10px; color:#aaa;">';
                for (var af = 0; af < r.affixes.length; af++) html += r.affixes[af].name + (af < r.affixes.length - 1 ? ', ' : '');
                html += '</div>';
            }
            html += '</div>';
            html += '<button class="forge-reforge" data-item-id="' + r.id + '" style="padding:3px 10px; font-size:11px; background:' + (canReforge ? '#e2b714' : '#333') + '; color:' + (canReforge ? '#000' : '#666') + '; border:none; border-radius:4px; cursor:' + (canReforge ? 'pointer' : 'default') + ';"' + (canReforge ? '' : ' disabled') + '>REFORGE 40 VE</button>';
            html += '</div>';
        }
    } else if (tabIndex === 3 && forgeLevel >= 3) {
        // Gem management
        html += '<div style="font-size:14px; font-weight:bold; margin-bottom:8px;">Gem Management</div>';
        var gems = (sd.equipment && sd.equipment.gems) || [];
        html += '<div style="font-size:12px; color:#888; margin-bottom:6px;">Gems in inventory: ' + gems.length + '</div>';
        if (gems.length > 0) {
            html += '<div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px;">';
            for (var gi = 0; gi < gems.length; gi++) {
                var gem = gems[gi];
                var gStr = typeof gem === 'string' ? gem : (gem.type + '_' + gem.rarity);
                html += '<span style="padding:2px 6px; background:#16213e; border:1px solid #555; border-radius:4px; font-size:11px;">💎 ' + gStr + '</span>';
            }
            html += '</div>';
        }
        html += '<div style="font-size:11px; color:#888;">Gem combine (3→1 higher): 15 VE. Socket/unsocket gems from equipment in the inventory screen.</div>';
    } else if (tabIndex === 4 && forgeLevel >= 4) {
        // Set Infuse
        html += '<div style="font-size:14px; font-weight:bold; margin-bottom:8px;">Set Infuse (50 VE + Essence → add set tag to Epic+)</div>';
        var setKeys = Object.keys(EQUIPMENT_SETS);
        for (var ski = 0; ski < setKeys.length; ski++) {
            var setDef = EQUIPMENT_SETS[setKeys[ski]];
            html += '<div style="margin-bottom:6px; padding:6px 10px; background:#16213e; border-radius:6px;">';
            html += '<div style="font-size:13px; font-weight:bold; color:' + (ESSENCES[setDef.element] ? ESSENCES[setDef.element].color : '#fff') + ';">' + setDef.name + ' Set (' + setDef.element + ')</div>';
            html += '<div style="font-size:10px; color:#aaa;">Slots: ' + setDef.slots.join(', ') + '</div>';
            var bKeys = Object.keys(setDef.bonuses);
            for (var bk = 0; bk < bKeys.length; bk++) {
                html += '<div style="font-size:10px; color:#8bbcff;">' + bKeys[bk] + 'pc: ' + setDef.bonuses[bKeys[bk]].desc + '</div>';
            }
            html += '</div>';
        }
        html += '<div style="font-size:11px; color:#888; margin-top:6px;">Select an Epic+ item in the inventory and use "Set Infuse" to add a set tag.</div>';
    } else if (tabIndex === 5 && forgeLevel >= 5) {
        // Mythic Forge
        html += '<div style="font-size:14px; font-weight:bold; margin-bottom:8px;">Mythic Forge (Legendary + Material + 250 VE)</div>';
        var mythicKeys = Object.keys(MYTHIC_ITEMS);
        for (var mi = 0; mi < mythicKeys.length; mi++) {
            var mk = mythicKeys[mi];
            var mDef = MYTHIC_ITEMS[mk];
            html += '<div style="padding:6px 10px; margin-bottom:4px; background:#16213e; border-radius:6px; border:1px solid #ff4500;">';
            html += '<div style="font-size:13px;">' + mDef.emoji + ' <strong style="color:#fb923c;">' + mDef.name + '</strong></div>';
            html += '<div style="font-size:10px; color:#aaa;">Slot: ' + mDef.slot + ' · Material: ' + MYTHIC_MATERIALS[mDef.craftSource.materials[0]].emoji + ' ' + MYTHIC_MATERIALS[mDef.craftSource.materials[0]].name + ' + ' + mDef.craftSource.goldCost + ' VE</div>';
            html += '<div style="font-size:10px; color:#8bbcff;">🌟 ' + mDef.majorPassive.desc + '</div>';
            html += '</div>';
        }
    } else {
        html += '<div style="color:#666; font-size:12px;">Upgrade the Forge to unlock this feature.</div>';
    }

    return html;
}

function bindForgeActions() {
    // Enhance
    var enhanceBtns = document.querySelectorAll('.forge-enhance');
    for (var i = 0; i < enhanceBtns.length; i++) {
        enhanceBtns[i].addEventListener('click', function() {
            var sd = getSaveData();
            var result = enhanceEquipment(sd, this.getAttribute('data-item-id'));
            var statusEl = document.getElementById('forge-status');
            if (result.success) {
                statusEl.innerHTML = '<span style="color:#6bcb77;">Enhanced to +' + result.level + (result.pity ? ' (pity)' : '') + '!</span>';
            } else {
                statusEl.innerHTML = '<span style="color:#ff6666;">' + result.reason + (result.level !== undefined ? ' (now +' + result.level + ')' : '') + '</span>';
            }
            renderTopBar();
            showForgePanel();
        });
    }

    // Salvage
    var salvageBtns = document.querySelectorAll('.forge-salvage');
    for (var si = 0; si < salvageBtns.length; si++) {
        salvageBtns[si].addEventListener('click', function() {
            var sd = getSaveData();
            var result = salvageEquipment(sd, this.getAttribute('data-item-id'));
            var statusEl = document.getElementById('forge-status');
            if (result.success) {
                statusEl.innerHTML = '<span style="color:#6bcb77;">Salvaged! Scraps and gems returned.</span>';
            } else {
                statusEl.innerHTML = '<span style="color:#ff6666;">' + result.reason + '</span>';
            }
            renderTopBar();
            showForgePanel();
        });
    }

    // Reforge
    var reforgeBtns = document.querySelectorAll('.forge-reforge');
    for (var ri = 0; ri < reforgeBtns.length; ri++) {
        reforgeBtns[ri].addEventListener('click', function() {
            var sd = getSaveData();
            var result = reforgeAffixes(sd, this.getAttribute('data-item-id'));
            var statusEl = document.getElementById('forge-status');
            if (result.success) {
                var affixNames = [];
                for (var a = 0; a < result.affixes.length; a++) affixNames.push(result.affixes[a].name);
                statusEl.innerHTML = '<span style="color:#6bcb77;">Reforged! New affixes: ' + affixNames.join(', ') + '</span>';
            } else {
                statusEl.innerHTML = '<span style="color:#ff6666;">' + result.reason + '</span>';
            }
            renderTopBar();
            showForgePanel();
        });
    }
}

// ---- Gacha Screen ----

function renderGachaScreen() {
    var sd = getSaveData();
    var multiCost = getMultiRollCost(sd);

    // Update rates display
    var rates = document.getElementById('gacha-rates');
    rates.textContent = 'Current rates (Lv.' + sd.player.level + '): ' + formatTierWeights(sd.player.level);

    // Update button states
    document.getElementById('btn-roll-1').disabled = sd.player.veilEssence < ROLL_COST;
    var btn10 = document.getElementById('btn-roll-10');
    btn10.disabled = sd.player.veilEssence < multiCost;

    // Show discounted cost on multi-roll button
    if (multiCost < MULTI_ROLL_COST) {
        btn10.textContent = 'Rite x10 (' + multiCost + ' VE, was ' + MULTI_ROLL_COST + ' VE)';
    } else {
        btn10.textContent = 'Rite x10 (' + MULTI_ROLL_COST + ' VE)';
    }

    // Show pity counter
    var pityEl = document.getElementById('gacha-pity-info');
    if (!pityEl) {
        pityEl = document.createElement('div');
        pityEl.id = 'gacha-pity-info';
        pityEl.style.cssText = 'font-size:12px; color:#aaa; margin-top:6px;';
        var ratesParent = rates.parentNode;
        ratesParent.insertBefore(pityEl, rates.nextSibling);
    }
    var pityConfig = getPityConfig(sd);
    if (pityConfig) {
        var rollsSince = sd.stats.rollsSincePity || 0;
        var remaining = pityConfig.threshold - rollsSince;
        pityEl.textContent = 'Pity: guaranteed cost ' + pityConfig.minTier + '+ in ' + remaining + ' rolls';
        pityEl.style.display = 'block';
    } else {
        pityEl.style.display = 'none';
    }

    // Render shop below gacha rolls
    if (typeof renderShopUI === 'function') {
        renderShopUI();
    }
}

function uiDoSingleRoll() {
    var sd = getSaveData();
    var result = doSingleRoll(sd);
    if (!result.success) return;

    var container = document.getElementById('gacha-roll-results');
    container.style.display = 'flex';
    container.innerHTML = '<div class="gacha-roll-header">Summoned 1 unit</div>';
    container.appendChild(createGachaCard(result.unitKey, result.unitTemplate));

    renderGachaScreen();
    renderTopBar();
}

function uiDoMultiRoll() {
    var sd = getSaveData();
    var result = doMultiRoll(sd);
    if (!result.success) return;

    var container = document.getElementById('gacha-roll-results');
    container.style.display = 'flex';
    container.innerHTML = '<div class="gacha-roll-header">Summoned 10 units!</div>';
    for (var i = 0; i < result.results.length; i++) {
        var r = result.results[i];
        var card = createGachaCard(r.unitKey, r.unitTemplate);
        card.style.animationDelay = (i * 0.08) + 's';
        container.appendChild(card);
    }

    renderGachaScreen();
    renderTopBar();
}

function createGachaCard(unitKey, tmpl) {
    var sd = getSaveData();
    var entry = sd.collection[unitKey];
    var isNew = entry && entry.copiesForNext === 0 && entry.stars === 1;
    var isEvolved = !!EVOLVED_TEMPLATES[unitKey];
    var unitCost = tmpl.cost || tmpl.baseCost || 1;

    var tierStars = '';
    for (var s = 0; s < unitCost; s++) tierStars += '★';

    var div = document.createElement('div');
    div.className = 'gacha-card cost-' + unitCost;
    if (isEvolved) {
        div.style.border = '2px solid #e2b714';
        div.style.boxShadow = '0 0 10px rgba(226,183,20,0.3)';
    }
    div.innerHTML =
        (isNew ? '<div class="card-new-badge">NEW</div>' : '') +
        (isEvolved ? '<div class="card-evolved-badge">✨ EVO</div>' : '') +
        '<div class="card-element-icon">' + getElementEmoji(tmpl.element) + '</div>' +
        '<div class="card-unit-name">' + tmpl.name + '</div>' +
        '<div class="card-tier-stars">' + tierStars + '</div>' +
        '<div class="card-archetype">' + ARCHETYPES[tmpl.archetype].emoji + ' ' + ARCHETYPES[tmpl.archetype].name + '</div>';
    return div;
}

// ---- Roster Screen ----

// ---- Hero Management Screen (Philosophy-Based) ----

var selectedHeroKey = null;

function renderHeroScreen() {
    var sd = getSaveData();
    var container = document.getElementById('hero-screen-content');
    if (!container) return;
    container.innerHTML = '';

    // Hero list with status
    var heroList = document.createElement('div');
    heroList.style.cssText = 'display:flex; flex-direction:column; gap:8px; margin-bottom:12px;';

    for (var hKey in sd.heroes.data) {
        var heroState = sd.heroes.data[hKey];
        var heroData = HERO_DATA[hKey];
        if (!heroData) continue;

        // Skip unlocked=false heroes (not yet acquired)
        if (heroState._unlocked === false) continue;
        // Skip away heroes
        if (heroState._away) continue;

        var heroCard = document.createElement('div');
        heroCard.style.cssText = 'background:#16213e; border:1px solid ' + (selectedHeroKey === hKey ? '#e2b714' : '#2a3a5e') + '; border-radius:8px; padding:12px; cursor:pointer;';
        heroCard.onclick = (function(hk) {
            return function() { showHeroSkillTree(hk); };
        })(hKey);

        var title = document.createElement('div');
        title.style.cssText = 'font-weight:bold; font-size:14px; margin-bottom:4px;';
        title.textContent = heroData.name + ' (Lv ' + heroState.level + ')';

        var philo = document.createElement('div');
        philo.style.cssText = 'font-size:11px; color:#e2b714; margin-bottom:2px;';
        philo.textContent = heroData.philosophy;

        var quote = document.createElement('div');
        quote.style.cssText = 'font-size:12px; color:#aaa; font-style:italic; margin-bottom:4px;';
        quote.textContent = '"' + heroData.quote + '"';

        var desc = document.createElement('div');
        desc.style.cssText = 'font-size:10px; color:#777; margin-bottom:4px;';
        desc.textContent = heroData.description;

        // XP bar
        var xpBarDiv = document.createElement('div');
        if (heroState.level < HERO_LEVEL_CAP && !heroState.isDead) {
            var xpNeeded = getHeroXPToNext(heroState.level);
            var xpPct = xpNeeded > 0 ? Math.floor((heroState.xp / xpNeeded) * 100) : 100;
            xpBarDiv.innerHTML = '<div style="background:#333; height:4px; border-radius:2px; margin-top:4px;">' +
                '<div style="background:#e2b714; height:100%; width:' + xpPct + '%; border-radius:2px;"></div></div>' +
                '<div style="font-size:9px; color:#888;">' + heroState.xp + '/' + xpNeeded + ' XP</div>';
        } else if (heroState.isDead) {
            xpBarDiv.innerHTML = '<div style="font-size:9px; color:#ff6666;">FALLEN</div>';
        } else {
            xpBarDiv.innerHTML = '<div style="font-size:9px; color:#e2b714;">MAX LEVEL</div>';
        }

        var status = document.createElement('div');
        status.style.cssText = 'font-size:11px; color:#888; margin-top:4px;';
        if (heroState.isDead) {
            status.textContent = 'Lost in R4';
            status.style.color = '#ff6666';
        } else if (heroState.assignedUnit) {
            status.textContent = 'Assigned to ' + getUnitDisplayName(heroState.assignedUnit);
            status.style.color = '#6bcb77';
        } else {
            status.textContent = 'Not assigned';
        }

        // Equipment summary on hero card
        var equipDiv = document.createElement('div');
        equipDiv.style.cssText = 'font-size:10px; color:#8bbcff; margin-top:4px;';
        if (heroState.assignedUnit && !heroState.isDead) {
            var eqItems = getEquippedItems(sd, heroState.assignedUnit);
            if (eqItems.length > 0) {
                var eqParts = [];
                for (var eq = 0; eq < eqItems.length; eq++) {
                    eqParts.push(getItemEmoji(eqItems[eq]) + getItemName(eqItems[eq]));
                }
                equipDiv.innerHTML = '\u2694 ' + eqParts.join(' · ');
            } else {
                equipDiv.innerHTML = '<span style="color:#666;">No equipment</span>';
            }
        }

        heroCard.appendChild(title);
        heroCard.appendChild(philo);
        heroCard.appendChild(quote);
        heroCard.appendChild(desc);
        heroCard.appendChild(xpBarDiv);
        heroCard.appendChild(status);
        heroCard.appendChild(equipDiv);
        heroList.appendChild(heroCard);
    }

    container.appendChild(heroList);

    // === EQUIPMENT OVERVIEW PANEL ===
    var eqOverview = document.createElement('div');
    eqOverview.style.cssText = 'margin-top:16px; padding:12px; background:#16213e; border:1px solid #2a3a5e; border-radius:8px;';
    eqOverview.innerHTML = '<div style="font-weight:bold; color:#e2b714; margin-bottom:8px; font-size:14px;">\u2694 Equipment Overview</div>';

    var roster = getRoster(sd);
    var anyEquipment = false;

    for (var ri = 0; ri < roster.length; ri++) {
        var rUnit = roster[ri];
        var unitHeroKey = typeof getHeroKeyForUnit === 'function' ? getHeroKeyForUnit(sd, rUnit.key) : null;
        var unitItems = getEquippedItems(sd, rUnit.key);

        if (!unitHeroKey && unitItems.length === 0) continue;

        anyEquipment = true;
        var unitTmpl = rUnit.template;
        var heroLabel = unitHeroKey ? (' \u2014 ' + HERO_DATA[unitHeroKey].name) : ' \u2014 No Hero';
        var canEquip = !!unitHeroKey;

        var unitRow = document.createElement('div');
        unitRow.style.cssText = 'margin-bottom:8px; padding:6px; border-bottom:1px solid #222;';

        var unitHeader = '<div style="font-size:12px; font-weight:bold; color:' + (canEquip ? '#ccc' : '#666') + ';">' +
            ELEMENTS[unitTmpl.element].emoji + ' ' + unitTmpl.name + ' ' + rUnit.stars + '\u2605' +
            '<span style="color:#e2b714; font-weight:normal;">' + heroLabel + '</span></div>';

        var slotNames = ['weapon', 'helm', 'chest', 'gauntlets', 'boots', 'offhand', 'accessory1', 'accessory2'];
        var slotLabels = { weapon: '\u2694Wpn', helm: '\u{1F3A9}Hlm', chest: '\u{1F6E1}Chest', gauntlets: '\u{1F94A}Glt', boots: '\u{1F462}Bts', offhand: '\u{1F52E}Off', accessory1: '\u{1F48D}Acc1', accessory2: '\u{1F4FF}Acc2' };
        var slotsHtml = '<div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:4px;">';

        for (var si = 0; si < slotNames.length; si++) {
            var slotItem = getEquipmentInSlot(sd, rUnit.key, slotNames[si]);
            if (slotItem) {
                var rc = getItemRarityColor(slotItem);
                slotsHtml += '<div style="padding:2px 5px; background:#1a2a4e; border:1px solid ' + rc + '; border-radius:3px; font-size:9px;">' +
                    '<span style="color:' + rc + ';">' + getItemEmoji(slotItem) + '</span> ' +
                    '<span style="color:#ccc;">' + getItemName(slotItem) + '</span>' +
                    (slotItem.enhancement > 0 ? '<span style="color:#6bcb77;">+' + slotItem.enhancement + '</span>' : '') +
                    '</div>';
            } else if (canEquip) {
                slotsHtml += '<div style="padding:2px 5px; background:#111; border:1px solid #333; border-radius:3px; font-size:9px; color:#555;">' +
                    (slotLabels[slotNames[si]] || slotNames[si]) + ' \u2014</div>';
            }
        }
        slotsHtml += '</div>';

        // Equip/unequip buttons for unequipped items
        var unequippedItems = sd.equipment && sd.equipment.inventory ? sd.equipment.inventory.filter(function(it) { return !it.equipped; }) : [];
        var equipBtnHtml = '';
        if (canEquip && unequippedItems.length > 0) {
            equipBtnHtml = '<button class="hero-equip-btn" data-unit="' + rUnit.key + '" style="margin-top:4px; font-size:10px; padding:2px 8px; background:#2a3a5e; color:#e2b714; border:1px solid #4a5a7e; border-radius:3px; cursor:pointer;">Equip Item</button>';
        }

        unitRow.innerHTML = unitHeader + slotsHtml + equipBtnHtml;
        eqOverview.appendChild(unitRow);
    }

    if (!anyEquipment) {
        eqOverview.innerHTML += '<div style="color:#666; font-size:12px;">No hero-equipped units yet. Assign heroes to units to enable equipment.</div>';
    }

    container.appendChild(eqOverview);

    // Wire up equip buttons
    var equipBtns = container.querySelectorAll('.hero-equip-btn');
    for (var eb = 0; eb < equipBtns.length; eb++) {
        equipBtns[eb].addEventListener('click', (function(unitKey) {
            return function(e) {
                e.stopPropagation();
                showQuickEquipPanel(unitKey);
            };
        })(equipBtns[eb].getAttribute('data-unit')));
    }
}

function showQuickEquipPanel(unitKey) {
    var sd = getSaveData();
    var unitTmpl = UNIT_TEMPLATES[unitKey] || EVOLVED_TEMPLATES[unitKey];
    var unitName = unitTmpl ? unitTmpl.name : unitKey;

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:1000;';

    var panel = document.createElement('div');
    panel.style.cssText = 'background:#1a1a2e; border:1px solid #444; border-radius:10px; padding:20px; max-width:500px; width:90%; max-height:80vh; overflow-y:auto;';

    panel.innerHTML = '<div style="font-weight:bold; color:#e2b714; margin-bottom:12px; font-size:14px;">\u2694 Equip Item on ' + unitName + '</div>';

    // Show currently equipped
    var equipped = getEquippedItems(sd, unitKey);
    if (equipped.length > 0) {
        panel.innerHTML += '<div style="font-size:11px; color:#888; margin-bottom:8px;">Currently Equipped:</div>';
        for (var ce = 0; ce < equipped.length; ce++) {
            var ceq = equipped[ce];
            var rc = getItemRarityColor(ceq);
            panel.innerHTML += '<div style="padding:4px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #222;">' +
                '<span style="font-size:11px; color:' + rc + ';">' + getItemEmoji(ceq) + ' ' + getItemName(ceq) + ' [' + ceq.slot + ']</span>' +
                '<button class="qe-unequip" data-item-id="' + ceq.id + '" style="font-size:10px; padding:1px 6px; background:#553333; color:#fff; border:1px solid #884444; border-radius:3px; cursor:pointer;">Unequip</button>' +
                '</div>';
        }
    }

    // Show available items
    var available = sd.equipment && sd.equipment.inventory ? sd.equipment.inventory.filter(function(it) { return !it.equipped; }) : [];
    if (available.length > 0) {
        panel.innerHTML += '<div style="font-size:11px; color:#888; margin-top:8px; margin-bottom:4px;">Available (' + available.length + '):</div>';
        for (var ai = 0; ai < available.length; ai++) {
            var avItem = available[ai];
            var arc = getItemRarityColor(avItem);
            var statDesc = typeof getItemStatDescription === 'function' ? getItemStatDescription(avItem) : '';
            panel.innerHTML += '<div class="qe-equip-item" data-item-id="' + avItem.id + '" style="padding:4px 6px; cursor:pointer; border-bottom:1px solid #222; font-size:11px;">' +
                '<span style="color:' + arc + ';">' + getItemEmoji(avItem) + ' ' + getItemName(avItem) + '</span>' +
                ' <span style="color:#888;">[' + avItem.slot + '] T' + (avItem.tier || '?') + '</span>' +
                (statDesc ? '<div style="font-size:9px; color:#666; margin-top:1px;">' + statDesc + '</div>' : '') +
                '</div>';
        }
    } else {
        panel.innerHTML += '<div style="font-size:11px; color:#666; margin-top:8px;">No unequipped items available.</div>';
    }

    var closeBtn = document.createElement('button');
    closeBtn.className = 'btn-secondary';
    closeBtn.style.cssText = 'margin-top:12px; padding:8px 16px; font-size:12px;';
    closeBtn.textContent = 'Done';
    closeBtn.onclick = function() { overlay.remove(); renderHeroScreen(); };
    panel.appendChild(closeBtn);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // Wire equip clicks
    var equipItems = panel.querySelectorAll('.qe-equip-item');
    for (var ei = 0; ei < equipItems.length; ei++) {
        equipItems[ei].addEventListener('click', (function(itemId, uk, ov) {
            return function() {
                var sdd = getSaveData();
                var result = equipItem(sdd, itemId, uk);
                if (result.success) {
                    showToast('Equipped!');
                } else {
                    showToast(result.reason);
                }
                ov.remove();
                showQuickEquipPanel(uk);
            };
        })(equipItems[ei].getAttribute('data-item-id'), unitKey, overlay));
    }

    // Wire unequip clicks
    var unequipBtns = panel.querySelectorAll('.qe-unequip');
    for (var ui = 0; ui < unequipBtns.length; ui++) {
        unequipBtns[ui].addEventListener('click', (function(itemId, uk, ov) {
            return function() {
                var sdd = getSaveData();
                unequipItem(sdd, itemId);
                showToast('Unequipped!');
                ov.remove();
                showQuickEquipPanel(uk);
            };
        })(unequipBtns[ui].getAttribute('data-item-id'), unitKey, overlay));
    }
}

function getUnitDisplayName(unitKey) {
    var tmpl = UNIT_TEMPLATES[unitKey] || EVOLVED_TEMPLATES[unitKey];
    return tmpl ? tmpl.name : unitKey;
}

function showHeroSkillTree(heroKey) {
    var sd = getSaveData();
    var heroState = sd.heroes.data[heroKey];
    var heroData = HERO_DATA[heroKey];
    var tree = HERO_SKILL_TREES[heroKey];
    if (!heroState || !heroData || !tree) return;

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:1000;';

    var panel = document.createElement('div');
    panel.style.cssText = 'background:#1a1a2e; border:1px solid #444; border-radius:10px; padding:20px; max-width:700px; width:90%; max-height:80vh; overflow-y:auto;';

    // Header
    var pointsSpent = getHeroPointsSpent(heroState);
    var header = document.createElement('div');
    header.style.cssText = 'text-align:center; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid #333;';
    header.innerHTML = '<div style="font-size:20px; font-weight:bold;">' + heroData.name + '</div>' +
        '<div style="color:#e2b714; font-size:12px;">' + heroData.philosophy + '</div>' +
        '<div style="color:#aaa; font-size:13px;">Lv ' + heroState.level + ' / 20</div>' +
        '<div style="color:#e2b714; font-size:12px; margin-top:4px;">Points Available: ' + (20 - pointsSpent) + ' / 20</div>';

    // Assigned unit
    if (heroState.assignedUnit) {
        header.innerHTML += '<div style="color:#6bcb77; font-size:11px; margin-top:4px;">Assigned to: ' + getUnitDisplayName(heroState.assignedUnit) + '</div>';
    }
    if (heroState.isDead) {
        header.innerHTML += '<div style="color:#ff6666; font-size:12px; margin-top:4px; font-weight:bold;">FALLEN - Skills preserved</div>';
    }
    panel.appendChild(header);

    // Two branches side by side
    var branchesContainer = document.createElement('div');
    branchesContainer.style.cssText = 'display:flex; gap:12px; margin-bottom:16px;';

    var branchKeys = ['A', 'B'];
    for (var bi = 0; bi < branchKeys.length; bi++) {
        var branch = branchKeys[bi];
        var branchData = heroData.branches[branch];
        if (!branchData || !tree[branch]) continue;

        var branchPanel = document.createElement('div');
        branchPanel.style.cssText = 'flex:1; background:#16213e; border:1px solid #2a3a5e; border-radius:6px; padding:10px;';

        var branchTitle = document.createElement('div');
        branchTitle.style.cssText = 'font-weight:bold; font-size:12px; color:#e2b714; margin-bottom:4px; text-align:center;';
        branchTitle.textContent = branch + ': ' + branchData.name;
        branchPanel.appendChild(branchTitle);

        var branchDesc = document.createElement('div');
        branchDesc.style.cssText = 'font-size:9px; color:#888; margin-bottom:8px; text-align:center;';
        branchDesc.textContent = branchData.description;
        branchPanel.appendChild(branchDesc);

        // Tiers 1-5
        for (var tier = 1; tier <= 5; tier++) {
            var tierNodes = tree[branch][tier];
            if (!tierNodes) continue;

            var tierDiv = document.createElement('div');
            tierDiv.style.cssText = 'margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid #2a3a5e;';

            var tierLabel = document.createElement('div');
            tierLabel.style.cssText = 'font-size:10px; color:#888; margin-bottom:4px; font-weight:bold;';
            tierLabel.textContent = 'T' + tier + ' (Cost: ' + getHeroSkillCost(tier) + ', Req: L' + getHeroTierLevelReq(tier) + ')';
            tierDiv.appendChild(tierLabel);

            var choicesDiv = document.createElement('div');
            choicesDiv.style.cssText = 'display:flex; flex-direction:column; gap:4px;';

            for (var ci = 0; ci < tierNodes.length; ci++) {
                var node = tierNodes[ci];
                var nodeDiv = document.createElement('div');
                nodeDiv.style.cssText = 'padding:6px; border-radius:4px; font-size:10px; border:1px solid #444; background:#0d0d1a;';

                var isInvested = heroState.investedNodes && heroState.investedNodes.indexOf(node.id) >= 0;
                var canInvest = !heroState.isDead && canUnlockNode(sd, heroKey, node.id);
                var levelLocked = heroState.level < node.levelReq;

                if (isInvested) {
                    nodeDiv.style.background = '#1a3a1a';
                    nodeDiv.style.borderColor = '#6bcb77';
                    nodeDiv.style.color = '#6bcb77';
                    nodeDiv.style.fontWeight = 'bold';
                    nodeDiv.innerHTML = '<div>' + node.name + '</div><div style="font-size:9px; color:#8bc78b; margin-top:2px;">' + node.effect + '</div>';
                } else if (levelLocked) {
                    nodeDiv.style.color = '#666';
                    nodeDiv.textContent = '? (Requires Lv ' + node.levelReq + ')';
                } else if (canInvest) {
                    nodeDiv.style.cursor = 'pointer';
                    nodeDiv.style.borderColor = '#4488ff';
                    nodeDiv.innerHTML = '<div style="color:#88bbff;">' + node.name + '</div><div style="font-size:9px; color:#aaa; margin-top:2px;">' + node.effect + '</div>';
                    nodeDiv.onclick = (function(hk, nId, ov) {
                        return function() {
                            var sdd = getSaveData();
                            if (investPoint(sdd, hk, nId)) {
                                ov.remove();
                                showHeroSkillTree(hk);
                            }
                        };
                    })(heroKey, node.id, overlay);
                } else {
                    nodeDiv.style.color = '#666';
                    nodeDiv.innerHTML = '<div>' + node.name + '</div><div style="font-size:9px; color:#555; margin-top:2px;">' + node.effect + '</div>';
                }

                choicesDiv.appendChild(nodeDiv);
            }

            tierDiv.appendChild(choicesDiv);
            branchPanel.appendChild(tierDiv);
        }

        branchesContainer.appendChild(branchPanel);
    }
    panel.appendChild(branchesContainer);

    // Buttons: Assign, Respec, Close
    var buttonDiv = document.createElement('div');
    buttonDiv.style.cssText = 'display:flex; gap:8px; justify-content:center; margin-top:12px; flex-wrap:wrap;';

    if (!heroState.isDead) {
        // Assign button
        var assignBtn = document.createElement('button');
        assignBtn.className = 'btn-primary';
        assignBtn.style.cssText = 'padding:8px 16px; font-size:12px;';
        assignBtn.textContent = heroState.assignedUnit ? 'Reassign' : 'Assign to Unit';
        assignBtn.onclick = (function(hk, ov) {
            return function() { ov.remove(); showHeroAssignPanel(hk); };
        })(heroKey, overlay);
        buttonDiv.appendChild(assignBtn);

        if (heroState.assignedUnit) {
            var unassignBtn = document.createElement('button');
            unassignBtn.className = 'btn-secondary';
            unassignBtn.style.cssText = 'padding:8px 16px; font-size:12px;';
            unassignBtn.textContent = 'Unassign';
            unassignBtn.onclick = (function(hk, ov) {
                return function() { heroUnassign(hk); ov.remove(); renderHeroScreen(); };
            })(heroKey, overlay);
            buttonDiv.appendChild(unassignBtn);
        }
    }

    // Respec
    if (heroState.investedNodes && heroState.investedNodes.length > 0 && !heroState.isDead) {
        var respecCost = getRespecCost(heroState);
        var respecBtn = document.createElement('button');
        respecBtn.className = 'btn-secondary';
        respecBtn.style.cssText = 'padding:8px 16px; font-size:12px;';
        respecBtn.textContent = 'Respec (' + respecCost + ' VE)';
        respecBtn.onclick = (function(hk, ov) {
            return function() {
                var sdd = getSaveData();
                if (respecHero(sdd, hk)) {
                    showToast('Hero reset!');
                    ov.remove();
                    showHeroSkillTree(hk);
                } else {
                    showToast('Not enough VE for respec');
                }
            };
        })(heroKey, overlay);
        buttonDiv.appendChild(respecBtn);
    }

    var closeBtn = document.createElement('button');
    closeBtn.className = 'btn-secondary';
    closeBtn.style.cssText = 'padding:8px 16px; font-size:12px;';
    closeBtn.textContent = 'Done';
    closeBtn.onclick = function() { overlay.remove(); renderHeroScreen(); };
    buttonDiv.appendChild(closeBtn);

    panel.appendChild(buttonDiv);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
}

function heroUnassign(heroKey) {
    var sd = getSaveData();
    unassignHero(sd, heroKey);
    autoSave(sd);
}

function showHeroAssignPanel(heroKey) {
    var sd = getSaveData();

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:1000;';

    var panel = document.createElement('div');
    panel.style.cssText = 'background:#1a1a2e; border:1px solid #444; border-radius:10px; padding:20px; max-width:400px; width:90%; max-height:70vh; overflow-y:auto;';

    panel.innerHTML = '<div style="font-weight:bold; color:#e2b714; margin-bottom:12px; font-size:14px;">Assign ' + HERO_DATA[heroKey].name + ' to Unit</div>';

    var roster = getRoster(sd);
    for (var i = 0; i < roster.length; i++) {
        var r = roster[i];
        var existingHero = getHeroKeyForUnit(sd, r.key);
        var assignedLabel = '';
        if (existingHero) {
            var existingDef = HERO_DATA[existingHero];
            assignedLabel = existingDef ? ' <span style="color:#ff8844;">(' + existingDef.name + ')</span>' : '';
        }
        var unitDiv = document.createElement('div');
        unitDiv.style.cssText = 'padding:6px; cursor:pointer; border-bottom:1px solid #222; font-size:12px;';
        unitDiv.innerHTML = ELEMENTS[r.template.element].emoji + ' ' + r.template.name + ' ' + r.stars + '\u2605' + assignedLabel;
        unitDiv.onclick = (function(hk, uk, ov) {
            return function() {
                var sdd = getSaveData();
                assignHeroToUnit(sdd, hk, uk);
                ov.remove();
                renderHeroScreen();
            };
        })(heroKey, r.key, overlay);
        panel.appendChild(unitDiv);
    }

    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-secondary';
    cancelBtn.style.cssText = 'margin-top:12px; padding:8px 16px; font-size:12px;';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = function() { overlay.remove(); renderHeroScreen(); };
    panel.appendChild(cancelBtn);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
}

function renderRosterScreen() {
    // Use collection browser with filters if available
    if (typeof buildCollectionUI === 'function') {
        buildCollectionUI();
        return;
    }

    var sd = getSaveData();
    var roster = getRoster(sd);

    var baseCount = 0;
    var evolvedCount = 0;
    for (var ri = 0; ri < roster.length; ri++) {
        if (roster[ri].isEvolved) evolvedCount++;
        else baseCount++;
    }
    document.getElementById('roster-stats').textContent =
        'Collected: ' + baseCount + ' / ' + SHOP_POOL_KEYS.length + ' units' +
        (evolvedCount > 0 ? ' · ' + evolvedCount + ' evolved' : '');

    var grid = document.getElementById('roster-grid');
    grid.innerHTML = '';

    for (var i = 0; i < roster.length; i++) {
        var r = roster[i];
        var rCost = r.template.cost || r.template.baseCost || 1;
        var div = document.createElement('div');
        div.className = 'roster-card cost-' + rCost;
        if (r.isEvolved) {
            div.style.border = '2px solid #e2b714';
            div.style.boxShadow = '0 0 8px rgba(226,183,20,0.3)';
        }

        var starsStr = '';
        for (var s = 0; s < r.stars; s++) starsStr += '⭐';

        var statMult = getStarMultiplier(r.stars);
        var scaledHP = Math.floor(r.template.hp * statMult);
        var scaledATK = Math.floor(r.template.attack * statMult);
        var typeLabel = r.template.type.charAt(0).toUpperCase() + r.template.type.slice(1);

        var html =
            (r.isEvolved ? '<div style="font-size:10px; color:#e2b714; font-weight:bold;">✨ Evolved</div>' : '') +
            '<div class="r-stars">' + starsStr + '</div>' +
            '<div>' + ELEMENTS[r.template.element].emoji + ' ' +
                ARCHETYPES[r.template.archetype].emoji + '</div>' +
            '<div class="r-name">' + r.template.name + '</div>' +
            '<div class="r-info">' + typeLabel + ' · Cost ' + rCost + '</div>' +
            '<div class="r-info" style="color:#ccc;">HP: ' + scaledHP + ' · ATK: ' + scaledATK + '</div>' +
            '<div class="r-copies">' + r.copiesForNext + ' / ' + r.copiesNeeded + ' copies</div>';

        if (r.canStarUp) {
            html += '<button class="star-up-btn" data-key="' + r.key + '">⬆ Star Up!</button>';
        }

        if (r.copiesForNext > 0) {
            html += '<button class="sell-btn" data-key="' + r.key +
                '" data-copies="' + r.copiesForNext + '">💰 Sell (' +
                r.copiesForNext + ' copies)</button>';
        }

        div.innerHTML = html;
        div.style.cursor = 'pointer';
        div.onclick = (function(key) {
            return function() { showUnitDetail(key, 'roster'); };
        })(r.key);
        grid.appendChild(div);
    }

    // Bind star-up buttons
    var btns = grid.querySelectorAll('.star-up-btn');
    for (var b = 0; b < btns.length; b++) {
        btns[b].addEventListener('click', function(e) {
            e.stopPropagation();
            var key = this.getAttribute('data-key');
            starUpUnit(getSaveData(), key);
            renderRosterScreen();
        });
    }

    // Bind sell buttons
    var sellBtns = grid.querySelectorAll('.sell-btn');
    for (var sb = 0; sb < sellBtns.length; sb++) {
        sellBtns[sb].addEventListener('click', function(e) {
            e.stopPropagation();
            var key = this.getAttribute('data-key');
            showSellPanel(key);
        });
    }
}

// ---- Sell Panel ----

function showSellPanel(unitKey) {
    var sd = getSaveData();
    var entry = sd.collection[unitKey];
    if (!entry || entry.copiesForNext <= 0) return;

    var tmpl = UNIT_TEMPLATES[unitKey] || EVOLVED_TEMPLATES[unitKey];
    var maxCopies = entry.copiesForNext;
    var sellCount = 1;

    // Create or reuse sell overlay
    var overlay = document.getElementById('sell-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sell-overlay';
        document.body.appendChild(overlay);
    }

    function updateSellPanel() {
        var goldValue = getEchoReleaseTotal(unitKey, sellCount);
        overlay.innerHTML =
            '<div class="sell-panel">' +
                '<div class="sell-title">Sell ' + tmpl.name + ' Copies</div>' +
                '<div class="sell-info">Available: ' + maxCopies + ' copies</div>' +
                '<div class="sell-amount">' +
                    '<button class="sell-amt-btn" data-amt="1">1</button>' +
                    '<button class="sell-amt-btn" data-amt="5">5</button>' +
                    '<button class="sell-amt-btn" data-amt="' + maxCopies + '">All (' + maxCopies + ')</button>' +
                '</div>' +
                '<div class="sell-preview">Selling ' + sellCount + ' → ✨ ' + goldValue + ' VE</div>' +
                '<div class="sell-actions">' +
                    '<button id="sell-confirm" class="btn-green">Confirm Sell</button>' +
                    '<button id="sell-cancel">Cancel</button>' +
                '</div>' +
            '</div>';

        // Bind amount buttons
        var amtBtns = overlay.querySelectorAll('.sell-amt-btn');
        for (var i = 0; i < amtBtns.length; i++) {
            amtBtns[i].onclick = function() {
                sellCount = Math.min(parseInt(this.getAttribute('data-amt')), maxCopies);
                updateSellPanel();
            };
        }

        document.getElementById('sell-confirm').onclick = function() {
            var earned = sellUnitCopies(sd, unitKey, sellCount);
            if (earned !== false) {
                overlay.style.display = 'none';
                renderRosterScreen();
                renderTopBar();
            }
        };

        document.getElementById('sell-cancel').onclick = function() {
            overlay.style.display = 'none';
        };
    }

    overlay.style.display = 'flex';
    updateSellPanel();
}

// ---- Team Builder Screen ----

var selectedRosterUnit = null;
var teamBuilderFilters = { element: 'all', archetype: 'all', sort: 'tier' };

function renderTeamBuilderScreen() {
    var sd = getSaveData();
    var roster = getRoster(sd);
    var team = getActiveTeam(sd);
    var maxSize = getMaxTeamSize(sd);

    document.getElementById('team-info').textContent =
        'Team: ' + team.slots.length + ' / ' + maxSize + ' units';

    // Render roster panel
    var panel = document.getElementById('team-roster-panel');
    panel.innerHTML = '';

    // Filter/sort controls
    var filterHtml = '<div style="margin-bottom:6px; font-size:11px;">';
    // Sort
    filterHtml += '<div style="margin-bottom:4px;"><span style="color:#888;">Sort:</span> ';
    var sortOpts = [['tier', 'Tier'], ['name', 'Name'], ['element', 'Element']];
    for (var so = 0; so < sortOpts.length; so++) {
        var sActive = teamBuilderFilters.sort === sortOpts[so][0];
        filterHtml += '<button class="tb-sort-btn" data-sort="' + sortOpts[so][0] + '" style="padding:1px 5px; border-radius:3px; border:1px solid #444; background:' + (sActive ? '#e2b714' : '#222') + '; color:' + (sActive ? '#000' : '#ccc') + '; cursor:pointer; font-size:10px; margin-right:2px;">' + sortOpts[so][1] + '</button>';
    }
    filterHtml += '</div>';
    // Element filter
    filterHtml += '<div style="margin-bottom:4px; display:flex; flex-wrap:wrap; gap:2px;">';
    var elActive = teamBuilderFilters.element === 'all';
    filterHtml += '<button class="tb-elem-btn" data-elem="all" style="padding:1px 4px; border-radius:3px; border:1px solid #444; background:' + (elActive ? '#e2b714' : '#222') + '; color:' + (elActive ? '#000' : '#ccc') + '; cursor:pointer; font-size:10px;">All</button>';
    var elemKeys = Object.keys(ELEMENTS);
    for (var ek = 0; ek < elemKeys.length; ek++) {
        var eAct = teamBuilderFilters.element === elemKeys[ek];
        filterHtml += '<button class="tb-elem-btn" data-elem="' + elemKeys[ek] + '" style="padding:1px 4px; border-radius:3px; border:1px solid #444; background:' + (eAct ? '#e2b714' : '#222') + '; color:' + (eAct ? '#000' : '#ccc') + '; cursor:pointer; font-size:10px;">' + ELEMENTS[elemKeys[ek]].emoji + '</button>';
    }
    filterHtml += '</div>';
    // Archetype filter
    filterHtml += '<div style="display:flex; flex-wrap:wrap; gap:2px;">';
    var archActive = teamBuilderFilters.archetype === 'all';
    filterHtml += '<button class="tb-arch-btn" data-arch="all" style="padding:1px 4px; border-radius:3px; border:1px solid #444; background:' + (archActive ? '#e2b714' : '#222') + '; color:' + (archActive ? '#000' : '#ccc') + '; cursor:pointer; font-size:10px;">All</button>';
    var archKeys2 = Object.keys(ARCHETYPES);
    for (var ak = 0; ak < archKeys2.length; ak++) {
        var aAct = teamBuilderFilters.archetype === archKeys2[ak];
        filterHtml += '<button class="tb-arch-btn" data-arch="' + archKeys2[ak] + '" style="padding:1px 4px; border-radius:3px; border:1px solid #444; background:' + (aAct ? '#e2b714' : '#222') + '; color:' + (aAct ? '#000' : '#ccc') + '; cursor:pointer; font-size:10px;">' + ARCHETYPES[archKeys2[ak]].emoji + '</button>';
    }
    filterHtml += '</div>';
    filterHtml += '</div>';
    panel.innerHTML = filterHtml + '<div class="section-title" style="margin-top:4px;">Available Units</div>';

    // Apply filters to roster
    var filteredRoster = roster.filter(function(r) {
        if (teamBuilderFilters.element !== 'all' && r.template.element !== teamBuilderFilters.element) return false;
        if (teamBuilderFilters.archetype !== 'all' && r.template.archetype !== teamBuilderFilters.archetype) return false;
        return true;
    });

    // Apply sort
    if (teamBuilderFilters.sort === 'name') {
        filteredRoster.sort(function(a, b) { return a.template.name.localeCompare(b.template.name); });
    } else if (teamBuilderFilters.sort === 'element') {
        filteredRoster.sort(function(a, b) { return a.template.element.localeCompare(b.template.element); });
    } else {
        filteredRoster.sort(function(a, b) { return (a.template.cost || 0) - (b.template.cost || 0); });
    }

    for (var i = 0; i < filteredRoster.length; i++) {
        var r = filteredRoster[i];
        var onTeam = false;
        for (var t = 0; t < team.slots.length; t++) {
            if (team.slots[t].key === r.key) { onTeam = true; break; }
        }

        var div = document.createElement('div');
        div.className = 'team-roster-item' + (onTeam ? ' on-team' : '');
        if (r.isEvolved) {
            div.style.borderLeft = '3px solid #e2b714';
        }
        div.setAttribute('data-key', r.key);

        var starsStr = '';
        for (var s = 0; s < r.stars; s++) starsStr += '⭐';

        var rMult = getStarMultiplier(r.stars);
        var rHP = Math.floor(r.template.hp * rMult);
        var rATK = Math.floor(r.template.attack * rMult);
        var rTypeLabel = r.template.type.charAt(0).toUpperCase() + r.template.type.slice(1);

        // Ability info for team builder
        var tbAbility = ABILITY_DATA ? ABILITY_DATA[r.key] : null;
        var tbAbilHtml = '';
        if (tbAbility) {
            var tbAbilDesc = tbAbility.desc || '';
            if (tbAbilDesc.length > 50) tbAbilDesc = tbAbilDesc.substring(0, 47) + '...';
            tbAbilHtml = '<div style="font-size:9px; color:#8bbcff; margin-top:1px;">⚡ ' + tbAbility.name + '</div>' +
                '<div style="font-size:8px; color:#666; line-height:1.2;">' + tbAbilDesc + '</div>';
        }
        var rosterHeroLabel = '';
        if (typeof getHeroForUnit === 'function') {
            var rHero = getHeroForUnit(sd, r.key);
            if (rHero && rHero.def) {
                rosterHeroLabel = '<span style="color:#e2b714; font-size:9px;"> 👑 ' + rHero.def.name + '</span>';
            } else {
                rosterHeroLabel = '<span style="color:#666; font-size:9px;"> No Hero</span>';
            }
        }
        div.innerHTML =
            '<span class="unit-info-btn" data-info-key="' + r.key + '" style="cursor:pointer; float:right; font-size:14px; padding:2px 4px; opacity:0.7;">ℹ️</span>' +
            (r.isEvolved ? '<span style="color:#e2b714; font-size:10px;">✨</span> ' : '') +
            ELEMENTS[r.template.element].emoji + ' ' + ARCHETYPES[r.template.archetype].emoji + ' ' +
            '<strong>' + r.template.name + '</strong> ' + starsStr +
            (onTeam ? ' <span class="text-green">✓</span>' : '') +
            rosterHeroLabel +
            '<div style="font-size:10px; color:#999; margin-top:2px;">' +
                rTypeLabel + ' · HP:' + rHP + ' · ATK:' + rATK +
            '</div>' + tbAbilHtml;

        div.title = r.template.name + '\n' +
            rTypeLabel + ' · ' + ARCHETYPES[r.template.archetype].name + ' · ' + ELEMENTS[r.template.element].name + '\n' +
            'Cost: ' + r.template.cost + ' · Stars: ' + r.stars + '\n' +
            'HP: ' + rHP + ' · ATK: ' + rATK;

        if (!onTeam) {
            div.onclick = (function(key) {
                return function() {
                    selectedRosterUnit = key;
                    highlightSelectedUnit(key);
                };
            })(r.key);
        } else {
            div.onclick = (function(key) {
                return function() {
                    removeFromTeam(sd, key);
                    renderTeamBuilderScreen();
                };
            })(r.key);
        }

        panel.appendChild(div);
    }

    // Bind info buttons on roster items
    var infoBtns = panel.querySelectorAll('.unit-info-btn');
    for (var ib = 0; ib < infoBtns.length; ib++) {
        infoBtns[ib].addEventListener('click', function(e) {
            e.stopPropagation();
            var key = this.getAttribute('data-info-key');
            showUnitDetail(key, 'team-builder');
        });
    }

    // Bind team builder filter buttons
    var sortBtns = panel.querySelectorAll('.tb-sort-btn');
    for (var sb = 0; sb < sortBtns.length; sb++) {
        sortBtns[sb].addEventListener('click', function() {
            teamBuilderFilters.sort = this.getAttribute('data-sort');
            renderTeamBuilderScreen();
        });
    }
    var elemBtns = panel.querySelectorAll('.tb-elem-btn');
    for (var eb = 0; eb < elemBtns.length; eb++) {
        elemBtns[eb].addEventListener('click', function() {
            teamBuilderFilters.element = this.getAttribute('data-elem');
            renderTeamBuilderScreen();
        });
    }
    var archBtns = panel.querySelectorAll('.tb-arch-btn');
    for (var ab = 0; ab < archBtns.length; ab++) {
        archBtns[ab].addEventListener('click', function() {
            teamBuilderFilters.archetype = this.getAttribute('data-arch');
            renderTeamBuilderScreen();
        });
    }

    // Render enemy zone preview above team board
    var enemyPreviewEl = document.getElementById('enemy-zone-preview');
    if (!enemyPreviewEl) {
        enemyPreviewEl = document.createElement('div');
        enemyPreviewEl.id = 'enemy-zone-preview';
        var boardPanel = document.querySelector('.team-board-panel');
        var boardEl2 = document.getElementById('team-board');
        boardPanel.insertBefore(enemyPreviewEl, boardEl2);
    }
    var enemyPreviewHtml = '<div class="board-grid" style="gap:2px; opacity:0.3; margin-bottom:4px;">';
    for (var er = 0; er < 4; er++) {
        for (var ec = 0; ec < 7; ec++) {
            enemyPreviewHtml += '<div class="board-cell" style="min-height:30px; background:#1a0a0a; border-color:#3a1a1a; cursor:default;"></div>';
        }
    }
    enemyPreviewHtml += '</div>';
    enemyPreviewHtml += '<div style="text-align:center; font-size:10px; color:#666; margin-bottom:2px;">\u2191 Enemy Zone \u2191 \u00b7 \u2193 Your Team \u2193</div>';
    enemyPreviewEl.innerHTML = enemyPreviewHtml;

    // Render board grid (4 rows x 7 cols, player's side)
    var boardEl = document.getElementById('team-board');
    boardEl.innerHTML = '';

    for (var row = 0; row < 4; row++) {
        for (var col = 0; col < 7; col++) {
            var cell = document.createElement('div');
            cell.className = 'board-cell';
            cell.setAttribute('data-row', row);
            cell.setAttribute('data-col', col);

            // Check if a unit is here
            var unitHere = null;
            for (var u = 0; u < team.slots.length; u++) {
                if (team.slots[u].row === row && team.slots[u].col === col) {
                    unitHere = team.slots[u];
                    break;
                }
            }

            if (unitHere) {
                cell.className += ' occupied';
                var tmpl = UNIT_TEMPLATES[unitHere.key] || EVOLVED_TEMPLATES[unitHere.key];
                var isEvolvedUnit = !!EVOLVED_TEMPLATES[unitHere.key];
                if (isEvolvedUnit) {
                    cell.style.border = '2px solid #e2b714';
                    cell.style.boxShadow = '0 0 6px rgba(226,183,20,0.3)';
                }
                var itemIcons = getUnitItemIcons(sd, unitHere.key);
                var heroIndicator = '';
                if (typeof getHeroForUnit === 'function') {
                    var unitHero = getHeroForUnit(sd, unitHere.key);
                    if (unitHero && unitHero.def) {
                        heroIndicator = '<div style="font-size:8px; color:#e2b714; line-height:1;">\u2694 ' + unitHero.def.name + '</div>';
                    } else {
                        heroIndicator = '<div style="font-size:7px; color:#666; line-height:1;">No Hero</div>';
                    }
                }
                cell.innerHTML = '<div class="cell-unit">' +
                    ELEMENTS[tmpl.element].emoji + '<br>' +
                    tmpl.name.split(' ')[0] +
                    heroIndicator +
                    itemIcons + '</div>';
            }

            cell.onclick = (function(r, c) {
                return function() { onTeamCellClick(r, c); };
            })(row, col);

            boardEl.appendChild(cell);
        }
    }

    // Synergy preview (use enhanced sidebar if available)
    if (typeof updateSynergySidebar === 'function') {
        updateSynergySidebar();
    } else {
        renderTeamSynergyPreview(sd);
    }

    // Item bar
    renderTeamBuilderItemBar();

    // Enable drag & drop
    if (typeof initTeamBoardDragDrop === 'function') {
        initTeamBoardDragDrop();
    }
}

function onTeamCellClick(row, col) {
    var sd = getSaveData();

    // Item equip mode: equip selected item to unit at this cell
    if (equipModeItemId) {
        var team = getActiveTeam(sd);
        var unitHere = null;
        for (var t = 0; t < team.slots.length; t++) {
            if (team.slots[t].row === row && team.slots[t].col === col) {
                unitHere = team.slots[t];
                break;
            }
        }
        if (unitHere) {
            var result = equipItem(sd, equipModeItemId, unitHere.key);
            if (result === 'combined') {
                addLogEntry('Items auto-combined into a recipe!', 'info');
            } else if (result === 'evolved_only') {
                addLogEntry('Only evolved units can equip this item!', 'warning');
            } else if (result === true) {
                // Equipped normally
            } else {
                // Failed — slots full or other issue
            }
            equipModeItemId = null;
            renderTeamBuilderScreen();
        }
        return;
    }

    if (selectedRosterUnit) {
        var result2 = addToTeam(sd, selectedRosterUnit, row, col);
        selectedRosterUnit = null;
        renderTeamBuilderScreen();
    }
}

function highlightSelectedUnit(key) {
    var items = document.querySelectorAll('.team-roster-item');
    for (var i = 0; i < items.length; i++) {
        items[i].style.outline = items[i].getAttribute('data-key') === key ? '2px solid #e2b714' : 'none';
    }
}

function renderTeamSynergyPreview(sd) {
    var preview = previewTeamSynergies(sd);
    var el = document.getElementById('team-synergy-preview');

    if (preview.teamSize === 0) {
        el.innerHTML = '<span class="text-muted">Select units to see synergies</span>';
        return;
    }

    var html = '';

    // --- Archetype Synergies ---
    html += '<div style="margin-bottom:6px;"><strong>Archetype Synergies</strong></div>';
    var archKeys = Object.keys(ARCHETYPES);
    var hasAnyArch = false;
    for (var i = 0; i < archKeys.length; i++) {
        var aKey = archKeys[i];
        var count = preview.archetypeCounts[aKey] || 0;
        if (count === 0) continue;
        hasAnyArch = true;

        var arch = ARCHETYPES[aKey];
        var activeSyn = preview.activeSynergies[aKey];
        var tierReached = activeSyn ? activeSyn.tier : 0;

        // Show thresholds
        var threshHtml = '';
        for (var t = 0; t < arch.thresholds.length; t++) {
            var isActive = (t + 1) <= tierReached;
            var bonusDesc = getSynergyArchBonusDesc(aKey, t);
            threshHtml += '<div style="margin-left:16px; font-size:11px; color:' +
                (isActive ? '#6bcb77' : '#666') + ';">' +
                (isActive ? '✓' : '○') + ' ' + arch.thresholds[t] + ': ' + bonusDesc + '</div>';
        }

        var nextThreshold = arch.thresholds[tierReached] || arch.thresholds[arch.thresholds.length - 1];
        html += '<div style="margin-bottom:4px; color:' + (tierReached > 0 ? '#e0e0e0' : '#888') + ';">' +
            arch.emoji + ' ' + arch.name + ' <span style="font-size:12px;">' + count + '/' + nextThreshold + '</span>' +
            '</div>' + threshHtml;
    }
    if (!hasAnyArch) {
        html += '<div class="text-muted" style="font-size:12px; margin-left:4px;">None</div>';
    }

    // --- Element Synergies ---
    html += '<div style="margin-top:8px; margin-bottom:6px;"><strong>Element Synergies</strong></div>';
    var elemAllKeys = Object.keys(ELEMENT_SYNERGIES);
    var hasAnyElem = false;
    for (var j = 0; j < elemAllKeys.length; j++) {
        var eKey = elemAllKeys[j];
        var eCount = preview.elementCounts[eKey] || 0;
        if (eCount === 0) continue;
        hasAnyElem = true;

        var elemSyn = ELEMENT_SYNERGIES[eKey];
        var activeElem = preview.activeElementSynergies[eKey];
        var eTierReached = activeElem ? activeElem.tier : 0;
        var isPrismatic = eCount >= (elemSyn.thresholds[elemSyn.thresholds.length - 1] || 10);

        var eThreshHtml = '';
        for (var et = 0; et < elemSyn.thresholds.length; et++) {
            var eIsActive = (et + 1) <= eTierReached;
            var eDesc = elemSyn.bonuses[et].desc;
            // Truncate long prismatic descriptions
            if (eDesc.length > 60) eDesc = eDesc.substring(0, 57) + '...';
            eThreshHtml += '<div style="margin-left:16px; font-size:11px; color:' +
                (eIsActive ? '#6bcb77' : '#666') + ';">' +
                (eIsActive ? '✓' : '○') + ' ' + elemSyn.thresholds[et] + ': ' + eDesc + '</div>';
        }

        var eNextThreshold = elemSyn.thresholds[eTierReached] || elemSyn.thresholds[elemSyn.thresholds.length - 1];
        var elemColor = isPrismatic ? (elemSyn.color || '#e0e0e0') : (eTierReached > 0 ? '#e0e0e0' : '#888');
        html += '<div class="' + (isPrismatic ? 'prismatic-text' : '') + '" style="margin-bottom:4px; color:' + elemColor + ';">' +
            elemSyn.emoji + ' ' + elemSyn.name + ' <span style="font-size:12px;">' + eCount + '/' + eNextThreshold + '</span>' +
            '</div>' + eThreshHtml;
    }
    if (!hasAnyElem) {
        html += '<div class="text-muted" style="font-size:12px; margin-left:4px;">None</div>';
    }

    el.innerHTML = html;
}

function getSynergyArchBonusDesc(archKey, tierIndex) {
    var arch = ARCHETYPES[archKey];
    if (!arch || !arch.bonuses[tierIndex]) return '';
    var b = arch.bonuses[tierIndex];
    // New format: bonuses have a desc field
    if (b.desc) return b.desc;
    return '';
}

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
        var levelLocked = sd.player.level < stage.requiredLevel;
        var lockCheck = stage.lock ? checkLock(sd, stage.lock) : { passed: true, reason: '' };
        var isBoss = !!stage.boss;
        var bestStars = (sd.missions.starRatings && sd.missions.starRatings[stageId]) || 0;

        var div = document.createElement('div');
        div.className = 'mission-card' + (!unlocked || levelLocked ? ' locked' : '') + (completed ? ' completed' : '');
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
        if (!lockCheck.passed && unlocked && !levelLocked) {
            lockText = '<div style="font-size:11px; color:#ff8844; margin-top:2px;">🔒 ' + lockCheck.reason + '</div>';
        }
        if (levelLocked) {
            lockText = '<div style="font-size:11px; color:#888; margin-top:2px;">Requires Lv.' + stage.requiredLevel + '</div>';
        }

        var veReward = stage.rewards.ve || stage.rewards.gold || 0;
        var xpReward = stage.rewards.xp || 0;
        var dropText = stage.rewards.unitDrops ? ' · ' + stage.rewards.unitDrops + ' drops' : '';
        var typeTag = stage.stageType ? '<span style="color:#888; font-size:10px; text-transform:uppercase; margin-left:6px;">' + stage.stageType + '</span>' : '';

        div.innerHTML =
            '<div>' +
                '<div class="m-name">' + stage.name + (isBoss ? ' 👑' : '') + (!unlocked || levelLocked ? ' 🔒' : '') + typeTag + '</div>' +
                '<div class="m-desc">' + stage.description + '</div>' +
                '<div class="m-reward">Reward: ' + veReward + ' VE · ' + xpReward + ' XP' + dropText + ' · ' + waveText + '</div>' +
                lockText +
            '</div>' +
            '<div>' +
                '<div class="m-stars">' + starsHtml + '</div>' +
            '</div>';

        if (unlocked && !levelLocked && lockCheck.passed) {
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

// ---- Combat Screen ----

var pendingMissionIndex = -1;
var pendingMissionIsStory = false;
var combatBoard = null;
var combatEnemies = [];
var currentWaveConfig = null;
var missionStarTracking = { totalDamageTaken: 0, unitsLostTotal: 0 };

function beginCombatScreen(sd) {
    showScreen('combat');
    missionStarTracking = { totalDamageTaken: 0, unitsLostTotal: 0 };

    // Reset speed button display
    var speedBtn = document.getElementById('speed-btn');
    if (speedBtn) speedBtn.textContent = COMBAT_SPEED + '\u00d7';

    // Clean up any previous unit layer
    var oldUnitLayer = document.getElementById('combat-unit-layer');
    if (oldUnitLayer) oldUnitLayer.remove();
    var dmgNums = document.getElementById('damage-numbers');
    if (dmgNums) dmgNums.innerHTML = '';

    // Deploy player team
    combatBoard = deployTeam(sd);

    // Hide overlays
    document.getElementById('combat-results').className = 'combat-results';
    document.getElementById('wave-transition').className = 'wave-transition';
    document.getElementById('combat-start-overlay').className = 'combat-start-overlay';

    // Check if mission is 3-starred → show Auto button
    var autoBtn = document.getElementById('auto-battle-btn');
    if (autoBtn) autoBtn.remove();
    if (pendingMissionIsStory && pendingMissionIndex >= 0) {
        var missionId = STORY_MISSIONS[pendingMissionIndex].id || ('story_' + pendingMissionIndex);
        if (sd.missions.storyStars[missionId] >= 3) {
            var startOverlay = document.getElementById('combat-start-overlay');
            if (startOverlay) {
                var ab = document.createElement('button');
                ab.id = 'auto-battle-btn';
                ab.className = 'btn-primary mt-md';
                ab.style.background = '#9944ff';
                ab.textContent = '\u26a1 Auto';
                ab.onclick = function() {
                    document.getElementById('combat-start-overlay').className = 'combat-start-overlay';
                    autoBattle();
                };
                startOverlay.appendChild(ab);
            }
        }
    }

    // Start first wave
    startWaveCombat();
}

function startWaveCombat() {
    var waveConfig = getCurrentWave();

    var progress = getMissionProgress();

    // Boss fight: no waves, generate boss enemy instead
    if (activeMission && activeMission.boss && BOSS_DATA && BOSS_DATA[activeMission.boss]) {
        document.getElementById('wave-info').textContent =
            progress.missionName + ' — Boss Fight!';

        var logEl = document.getElementById('combat-log');
        logEl.innerHTML = '';
        addLogEntry('👑 Boss fight begins!', 'warning');

        currentWaveConfig = null;
        combatEnemies = [];

        startMissionCombat(combatBoard, combatEnemies);
        return;
    }

    if (!waveConfig) return;

    document.getElementById('wave-info').textContent =
        progress.missionName + ' — Wave ' + progress.currentWave + ' / ' + progress.totalWaves;

    // Generate enemies
    combatEnemies = generateMissionWave(waveConfig);

    // Store wave config for combat init to read
    currentWaveConfig = waveConfig;

    // Clear log
    var logEl = document.getElementById('combat-log');
    logEl.innerHTML = '';
    addLogEntry('⚔️ Wave ' + progress.currentWave + ' begins!', 'info');

    // Start combat using V1 engine (adapted)
    startMissionCombat(combatBoard, combatEnemies);
}

function startMissionCombat(playerBoard, enemies) {
    // Build a gameState-like object for the combat engine
    var gs = {
        board: playerBoard,
        enemies: enemies,
        phase: 'combat',
        activeSynergies: {},
        activeElements: {}
    };

    // Calculate synergies from deployed board
    updateActiveSynergies(gs);

    // Boss mission: create boss unit from BOSS_DATA
    if (activeMission && activeMission.boss && BOSS_DATA && BOSS_DATA[activeMission.boss]) {
        var bossData = BOSS_DATA[activeMission.boss];
        // Calculate boss stats from player team
        var avgHp = 0, avgAtk = 0, teamPower = 0;
        var unitCount = 0;
        for (var br = 0; br < 4; br++) {
            for (var bc = 0; bc < 7; bc++) {
                var bu = playerBoard[br][bc];
                if (bu && bu.hp > 0) {
                    avgHp += bu.maxHp;
                    avgAtk += bu.attack;
                    teamPower += bu.maxHp;
                    unitCount++;
                }
            }
        }
        if (unitCount > 0) { avgHp /= unitCount; avgAtk /= unitCount; }

        var boss = {
            name: bossData.name,
            emoji: bossData.emoji,
            element: bossData.element,
            hp: bossData.baseHp + Math.floor((bossData.hpScaling > 10 ? avgHp : teamPower) * bossData.hpScaling),
            attack: bossData.baseAtk + Math.floor(avgAtk * bossData.atkScaling),
            attackSpd: bossData.attackSpd,
            range: bossData.range,
            moveSpd: 0,
            damageReduction: bossData.dr,
            dodgeChance: bossData.dodgeChance || 0,
            type: 'boss',
            side: 'enemy',
            isBoss: true,
            bossData: bossData,
            bossSize: bossData.size,
            currentPhase: 0,
            phaseTransitioning: false,
            phaseTransitionTimer: 0,
            enraged: false,
            telegraphs: [],
            abilityCooldowns: {},
            minionCooldowns: {},
            maxMana: 0,
            currentMana: 0,
            gridRow: 2,
            gridCol: 3
        };
        boss.maxHp = boss.hp;

        gs.enemies = [boss];
        enemies = [boss];
    }

    // Apply enemy synergies and evolutions if wave config says so
    var wc = currentWaveConfig;
    if (wc && (wc.enemySynergies || wc.enemyEvolutions)) {
        var enemyArchCounts = {};
        var enemyElemCounts = {};
        for (var si = 0; si < enemies.length; si++) {
            var su = enemies[si];
            if (su.archetype) enemyArchCounts[su.archetype] = (enemyArchCounts[su.archetype] || 0) + 1;
            if (su.element) enemyElemCounts[su.element] = (enemyElemCounts[su.element] || 0) + 1;
        }

        if (wc.enemyEvolutions) {
            var fakeGS = { activeSynergies: enemyArchCounts };
            for (var ev = 0; ev < enemies.length; ev++) {
                // Boost some enemies to star 2 for evolution eligibility
                if (enemies[ev].stars < 2 && Math.random() < 0.4) {
                    enemies[ev].stars = 2;
                    var evTmpl = UNIT_TEMPLATES[enemies[ev].key];
                    if (evTmpl) {
                        var evMult = getStarMultiplier(2);
                        enemies[ev].hp = Math.floor(evTmpl.hp * evMult);
                        enemies[ev].maxHp = Math.floor(evTmpl.hp * evMult);
                        enemies[ev].attack = Math.floor(evTmpl.attack * evMult);
                    }
                }
                checkEnemyEvolution(enemies[ev]);
            }
            // Recalculate counts after evolutions
            enemyArchCounts = {};
            enemyElemCounts = {};
            for (var ri = 0; ri < enemies.length; ri++) {
                if (enemies[ri].archetype) enemyArchCounts[enemies[ri].archetype] = (enemyArchCounts[enemies[ri].archetype] || 0) + 1;
                if (enemies[ri].element) enemyElemCounts[enemies[ri].element] = (enemyElemCounts[enemies[ri].element] || 0) + 1;
            }
        }

        if (wc.enemySynergies) {
            applySynergyBonuses(enemies, enemyArchCounts);
            applyEnemyElementBonuses(enemies, enemyElemCounts);
        }

        // Show enemy synergy info in combat log
        var synText = [];
        var archKeys2 = Object.keys(enemyArchCounts);
        for (var sk = 0; sk < archKeys2.length; sk++) {
            var aKey2 = archKeys2[sk];
            var aData2 = ARCHETYPES[aKey2];
            if (aData2) {
                var cnt2 = enemyArchCounts[aKey2];
                for (var tt = 0; tt < aData2.thresholds.length; tt++) {
                    if (cnt2 >= aData2.thresholds[tt]) {
                        synText.push(aData2.emoji + aData2.name + '(' + cnt2 + ')');
                    }
                }
            }
        }
        if (synText.length > 0) {
            addLogEntry('⚠️ Enemy synergies active: ' + synText.join(', '), 'warning');
        }
    }

    // Place enemies on the enemy rows (rows 0-3)
    placeEnemiesOnBoard(enemies);

    // Init combat
    initCombat(gs);

    // Clean up unit layer for fresh rendering
    var prevUnitLayer = document.getElementById('combat-unit-layer');
    if (prevUnitLayer) prevUnitLayer.remove();

    // Render synergy bar
    renderCombatSynergyBar();

    // Show start overlay instead of immediately starting combat
    document.getElementById('combat-start-overlay').className = 'combat-start-overlay show';

    // Defer initial board render until after the browser has laid out the combat screen.
    // On first load after refresh, offsetWidth/offsetHeight are 0 if we render synchronously,
    // which causes all unit overlays to stack at (0,0).
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            renderCombatBoard();
        });
    });
}

var COMBAT_TICK_MS = 50; // 20 fps
var COMBAT_DT = COMBAT_TICK_MS / 1000;
var COMBAT_SPEED = 1; // 1, 2, or 4

function toggleCombatSpeed() {
    if (COMBAT_SPEED === 1) COMBAT_SPEED = 2;
    else if (COMBAT_SPEED === 2) COMBAT_SPEED = 4;
    else COMBAT_SPEED = 1;
    var btn = document.getElementById('speed-btn');
    if (btn) btn.textContent = COMBAT_SPEED + '\u00d7';
}

function uiStartCombatLoop() {
    // Hide start overlay
    document.getElementById('combat-start-overlay').className = 'combat-start-overlay';

    // Initialize combat synergy sidebars
    if (combatState && typeof initCombatSynergySidebars === 'function') {
        initCombatSynergySidebars(combatState.playerUnits || [], combatState.enemyUnits || []);
    }

    // Re-render board with correct dimensions before combat starts
    // (sidebars may have changed the board width)
    renderCombatBoard();

    // Show FIGHT! text
    showCombatStartText();

    // Start combat loop
    function combatLoop() {
        // Run multiple physics ticks per frame at higher speeds
        for (var s = 0; s < COMBAT_SPEED; s++) {
            if (combatState && combatState.running) {
                combatTick(COMBAT_DT);
            }
        }
        renderCombatBoard();

        if (combatState && combatState.running) {
            setTimeout(combatLoop, COMBAT_TICK_MS);
        } else {
            onWaveCombatEnd();
        }
    }
    setTimeout(combatLoop, COMBAT_TICK_MS);
}

function autoBattle() {
    // Run all waves silently to completion
    var maxIterations = 100000; // safety limit
    var iterations = 0;

    function runCurrentWave() {
        if (combatState) combatState.autoBattle = true;
        while (combatState && combatState.running && iterations < maxIterations) {
            combatTick(COMBAT_DT);
            iterations++;
        }
    }

    runCurrentWave();

    if (!combatState) { onWaveCombatEnd(); return; }

    var result = combatState.result;
    if (result === 'loss' || result === 'draw') {
        showMissionResults(false, 0);
        return;
    }

    // Track damage for star rating
    trackWaveDamage();

    // Loop through remaining waves
    while (advanceWave()) {
        healBoardUnits();
        startWaveCombat();
        if (combatState) combatState.autoBattle = true;
        while (combatState && combatState.running && iterations < maxIterations) {
            combatTick(COMBAT_DT);
            iterations++;
        }
        if (!combatState || combatState.result === 'loss' || combatState.result === 'draw') {
            showMissionResults(false, 0);
            return;
        }
        trackWaveDamage();
    }

    // All waves cleared
    var stars = calculateStarRating();
    showMissionResults(true, stars);
}

function showCombatStartText() {
    var area = document.getElementById('combat-area');
    if (!area) return;
    var overlay = document.createElement('div');
    overlay.className = 'combat-start-text';
    overlay.textContent = 'FIGHT!';
    area.appendChild(overlay);
    setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 1000);
}

// ---- Floating Damage Numbers ----

var lastDmgNumberTime = 0;

function spawnDamageNumber(row, col, text, type) {
    if (combatState && combatState.autoBattle) return;

    var now = Date.now();
    // Throttle at high speeds
    if (COMBAT_SPEED >= 4 && type !== 'crit' && type !== 'ability' && type !== 'boss') {
        if (now - lastDmgNumberTime < 150) return;
    }
    if (COMBAT_SPEED >= 2 && type === 'dot') {
        if (now - lastDmgNumberTime < 100) return;
    }
    lastDmgNumberTime = now;

    var container = document.getElementById('damage-numbers');
    if (!container) return;

    var board = document.getElementById('combat-board');
    if (!board) return;

    // Calculate pixel position from grid cell
    var cellW = board.offsetWidth / 7;
    var cellH = board.offsetHeight / 8;
    var x = col * cellW + cellW / 2;
    var y = row * cellH + cellH / 2;

    // Random horizontal offset to prevent overlap
    x += (Math.random() - 0.5) * 20;

    var el = document.createElement('div');
    el.className = 'dmg-number dmg-' + type;
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    container.appendChild(el);

    // Remove after animation
    setTimeout(function() {
        if (el.parentNode) el.parentNode.removeChild(el);
    }, 800);
}

// ---- AoE Ability Cell Highlights ----

function flashAbilityCells(cells, color, duration) {
    if (combatState && combatState.autoBattle) return;

    var board = document.getElementById('combat-board');
    if (!board) return;

    for (var i = 0; i < cells.length; i++) {
        var idx = cells[i].row * 7 + cells[i].col;
        var cell = board.children[idx];
        if (cell) {
            cell.style.boxShadow = 'inset 0 0 12px ' + color;
            (function(c) {
                setTimeout(function() { c.style.boxShadow = 'none'; }, duration || 300);
            })(cell);
        }
    }
}

function placeEnemiesOnBoard(enemies) {
    // Place enemies on rows 0-3 (top of 8x7 grid)
    // Front-to-back: row 3 is enemy front, row 0 is enemy back
    var idx = 0;
    for (var row = 3; row >= 0 && idx < enemies.length; row--) {
        for (var col = 0; col < 7 && idx < enemies.length; col++) {
            // Skip boss — already positioned
            if (enemies[idx].isBoss) {
                enemies[idx].side = 'enemy';
                idx++;
                continue;
            }
            enemies[idx].gridRow = row;
            enemies[idx].gridCol = col;
            enemies[idx].side = 'enemy';
            idx++;
        }
    }
}

function onWaveCombatEnd() {
    if (!combatState) return;
    var result = combatState.result;

    if (result === 'loss' || result === 'draw') {
        // Mission failed
        showMissionResults(false, 0);
        return;
    }

    // Track damage for star rating
    trackWaveDamage();

    // Check if more waves
    var hasMore = advanceWave();
    if (hasMore) {
        // Heal units and show wave transition
        healBoardUnits();
        showWaveTransition();
    } else {
        // Mission complete - calculate stars
        var stars = calculateStarRating();
        showMissionResults(true, stars);
    }
}

function trackWaveDamage() {
    // Count damage taken and units lost from player units
    if (!combatState) return;
    for (var i = 0; i < combatState.playerUnits.length; i++) {
        var u = combatState.playerUnits[i];
        if (u && u.hp < u.maxHp && u.hp > 0) {
            missionStarTracking.totalDamageTaken += (u.maxHp - u.hp);
        }
        if (u && u.hp <= 0) {
            missionStarTracking.unitsLostTotal++;
        }
    }
}

function healBoardUnits() {
    // Reset player units back to their combatBoard positions and heal them
    // First clear the combatBoard
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 7; c++) {
            combatBoard[r][c] = null;
        }
    }
    // Restore surviving player units to board
    if (combatState) {
        for (var i = 0; i < combatState.playerUnits.length; i++) {
            var u = combatState.playerUnits[i];
            if (u && u.hp > 0) {
                u.hp = u.maxHp;
                u.shield = 0;
                u.target = null;
                u.attackCooldown = 0;
                u.moveCooldown = 0;
                u.stasisUsed = false;
                u.titanResolveActive = false;
                u.frenzyStacks = 0;
                // Mana/ability reset between waves
                u.currentMana = 0;
                u.isCasting = false;
                u.castTimer = 0;
                u.statusEffects = [];
                u.ccHistory = [];
                u.ccImmuneUntil = 0;
                u.abilityBuffs = {};
                u.phoenixReviveUsed = false;
                u.phoenixRevivePending = false;
                u.deathAnimating = false;
                u.deathComplete = false;
                u.deathTimer = 0;
                // Restore to original player-side position
                // _origRow/_origCol are in combat grid coords (rows 4-7)
                // combatBoard is 4x7 (team builder coords): teamRow = combatRow - 4
                var placed = false;
                if (u._origRow !== undefined && u._origCol !== undefined) {
                    var teamRow = u._origRow - 4;
                    var teamCol = u._origCol;
                    if (teamRow >= 0 && teamRow < 4 && !combatBoard[teamRow][teamCol]) {
                        combatBoard[teamRow][teamCol] = u;
                        u.gridRow = u._origRow;
                        u.gridCol = u._origCol;
                        placed = true;
                    }
                }
                if (!placed) {
                    // Find any free cell on player side (team builder rows 0-3)
                    for (var pr = 0; pr < 4 && !placed; pr++) {
                        for (var pc = 0; pc < 7 && !placed; pc++) {
                            if (!combatBoard[pr][pc]) {
                                combatBoard[pr][pc] = u;
                                u.gridRow = 4 + pr;
                                u.gridCol = pc;
                                placed = true;
                            }
                        }
                    }
                }
            }
        }
    }
}

function calculateStarRating() {
    if (missionStarTracking.unitsLostTotal === 0 && missionStarTracking.totalDamageTaken === 0) return 3;
    if (missionStarTracking.unitsLostTotal === 0) return 2;
    return 1;
}

var waveRepositionSelected = null; // {row, col} of selected unit for repositioning

function showWaveTransition() {
    var progress = getMissionProgress();
    document.getElementById('wave-text').textContent = 'Wave ' + progress.currentWave;
    document.getElementById('wave-transition').className = 'wave-transition show';
    waveRepositionSelected = null;
    renderWaveRepositionGrid();
}

function renderWaveRepositionGrid() {
    // Find or create the reposition grid container
    var container = document.getElementById('wave-reposition-grid');
    if (!container) {
        container = document.createElement('div');
        container.id = 'wave-reposition-grid';
        container.style.cssText = 'margin-top:10px; width:100%; max-width:400px;';
        var btn = document.querySelector('#wave-transition .btn-primary');
        btn.parentNode.insertBefore(container, btn);
    }

    var html = '<div class="board-grid" style="gap:2px;">';
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 7; c++) {
            var u = combatBoard[r][c];
            var isSelected = waveRepositionSelected && waveRepositionSelected.row === r && waveRepositionSelected.col === c;
            var cellClass = 'board-cell' + (u && u.hp > 0 ? ' occupied' : '') + (isSelected ? ' selected' : '');
            var outline = isSelected ? 'outline:2px solid #e2b714;' : '';

            if (u && u.hp > 0) {
                html += '<div class="' + cellClass + '" style="' + outline + '" data-wr="' + r + ',' + c + '">' +
                    '<div class="cell-unit">' + ELEMENTS[u.element].emoji + '<br>' + u.name.split(' ')[0] + '</div></div>';
            } else {
                html += '<div class="' + cellClass + '" style="' + outline + '" data-wr="' + r + ',' + c + '"></div>';
            }
        }
    }
    html += '</div>';
    html += '<div style="font-size:11px; color:#888; margin-top:4px; text-align:center;">Click a unit, then click an empty cell to move it</div>';
    container.innerHTML = html;

    // Bind click handlers
    var cells = container.querySelectorAll('.board-cell');
    for (var i = 0; i < cells.length; i++) {
        cells[i].addEventListener('click', function() {
            var coords = this.getAttribute('data-wr').split(',');
            var cr = parseInt(coords[0]);
            var cc = parseInt(coords[1]);
            onWaveRepositionClick(cr, cc);
        });
    }
}

function onWaveRepositionClick(row, col) {
    var unit = combatBoard[row][col];

    if (waveRepositionSelected) {
        var sr = waveRepositionSelected.row;
        var sc = waveRepositionSelected.col;
        var srcUnit = combatBoard[sr][sc];

        // Swap or move
        combatBoard[sr][sc] = combatBoard[row][col];
        combatBoard[row][col] = srcUnit;

        // Update grid positions on unit objects
        if (srcUnit) { srcUnit.gridRow = row; srcUnit.gridCol = col; }
        if (combatBoard[sr][sc]) { combatBoard[sr][sc].gridRow = sr; combatBoard[sr][sc].gridCol = sc; }

        waveRepositionSelected = null;
        renderWaveRepositionGrid();
    } else if (unit && unit.hp > 0) {
        waveRepositionSelected = { row: row, col: col };
        renderWaveRepositionGrid();
    }
}

function uiNextWave() {
    document.getElementById('wave-transition').className = 'wave-transition';
    // Clean up reposition grid
    var grid = document.getElementById('wave-reposition-grid');
    if (grid) grid.remove();
    waveRepositionSelected = null;
    startWaveCombat();
}

function showMissionResults(victory, stars) {
    // Hide wave transition overlay if still showing
    document.getElementById('wave-transition').className = 'wave-transition';
    var grid = document.getElementById('wave-reposition-grid');
    if (grid) grid.remove();

    var sd = getSaveData();

    var titleEl = document.getElementById('results-title');
    titleEl.textContent = victory ? 'Victory!' : 'Defeat';
    titleEl.className = 'results-title ' + (victory ? 'victory' : 'defeat');

    var starsHtml = '';
    if (victory) {
        for (var i = 0; i < 3; i++) {
            starsHtml += i < stars ? '⭐' : '☆';
        }
    }
    document.getElementById('results-stars').textContent = starsHtml;

    if (victory && activeMission) {
        var rewards = calculateMissionRewards(sd, activeMission, stars);

        // Calculate base rewards for bonus display
        var starMult = 1.0;
        if (stars <= 1) starMult = 0.5;
        else if (stars <= 2) starMult = 0.75;
        var baseVE = activeMission.rewards.ve || activeMission.rewards.gold || 0;
        var baseGold = Math.floor(baseVE * starMult);
        var baseXP = Math.floor((activeMission.rewards.xp || 0) * starMult);
        var goldMult = getGoldMultiplier(sd);
        var xpMult = getXPMultiplier(sd);

        var goldBonusText = '';
        if (goldMult > 1.0) {
            goldBonusText = ' (+' + Math.round((goldMult - 1) * 100) + '% from Essence Reservoir)';
        }
        var xpBonusText = '';
        if (xpMult > 1.0) {
            xpBonusText = ' (+' + Math.round((xpMult - 1) * 100) + '% from Training Ground)';
        }

        var rewardHtml =
            '<span class="text-gold">+' + rewards.gold + ' VE' + goldBonusText + '</span> · ' +
            '<span class="text-green">+' + rewards.xp + ' XP' + xpBonusText + '</span>';

        // Show unit copies earned
        if (rewards.unitCopies && rewards.unitCopies.length > 0) {
            rewardHtml += '<br><span style="font-size:13px; color:#8bbcff;">Units earned:</span> ';
            for (var ri = 0; ri < rewards.unitCopies.length; ri++) {
                var rKey = rewards.unitCopies[ri];
                var rTmpl = UNIT_TEMPLATES[rKey];
                if (rTmpl) {
                    rewardHtml += '<span style="font-size:12px;">' + ELEMENTS[rTmpl.element].emoji + ' ' + rTmpl.name + '</span>';
                    if (ri < rewards.unitCopies.length - 1) rewardHtml += ', ';
                }
            }
        }

        // Show equipment drops (new system)
        if (rewards.equipmentDrops && rewards.equipmentDrops.length > 0) {
            rewardHtml += '<br><span style="font-size:13px; color:#e2b714;">Equipment found:</span> ';
            for (var ii = 0; ii < rewards.equipmentDrops.length; ii++) {
                var drop = rewards.equipmentDrops[ii];
                var dropColor = getItemRarityColor(drop);
                rewardHtml += '<span style="font-size:12px;">' + getItemEmoji(drop) + ' ' + getItemName(drop) +
                    ' (<span style="color:' + dropColor + ';">T' + drop.tier + ' ' + getItemRarityName(drop) + '</span>)</span>';
                if (ii < rewards.equipmentDrops.length - 1) rewardHtml += ' · ';
            }
        }

        // Show essence drops
        if (rewards.essenceDropsNew) {
            var enKeys = Object.keys(rewards.essenceDropsNew);
            if (enKeys.length > 0) {
                rewardHtml += '<br><span style="font-size:13px; color:#aa44ff;">Essences:</span> ';
                for (var eid = 0; eid < enKeys.length; eid++) {
                    var essKey = enKeys[eid];
                    var essData = ESSENCES[essKey];
                    rewardHtml += '<span style="font-size:12px; color:' + (essData ? essData.color : '#fff') + ';">' + (essData ? essData.emoji : '') + ' ' + essKey + ' x' + rewards.essenceDropsNew[essKey] + '</span>';
                    if (eid < enKeys.length - 1) rewardHtml += ' · ';
                }
            }
        }

        // Show gem drops
        if (rewards.gemDrops && rewards.gemDrops.length > 0) {
            rewardHtml += '<br><span style="font-size:13px; color:#4488ff;">Gems:</span> ';
            for (var gdi = 0; gdi < rewards.gemDrops.length; gdi++) {
                rewardHtml += '<span style="font-size:12px;">💎 ' + rewards.gemDrops[gdi] + '</span>';
                if (gdi < rewards.gemDrops.length - 1) rewardHtml += ' · ';
            }
        }

        document.getElementById('results-rewards').innerHTML = rewardHtml;

        var leveled = applyMissionRewards(sd, rewards);
        if (leveled) {
            document.getElementById('results-rewards').innerHTML +=
                '<br><span class="text-green" style="font-size:20px;">LEVEL UP!</span>';
        }

        // Mark story mission complete
        if (pendingMissionIsStory && pendingMissionIndex >= 0) {
            completeStoryMission(sd, pendingMissionIndex, stars);
        }

        // Show hero level-ups
        if (rewards.heroLevelUps && rewards.heroLevelUps.length > 0) {
            var heroLvHtml = '<br><span style="font-size:13px; color:#e2b714;">Hero Level Ups:</span> ';
            for (var hli = 0; hli < rewards.heroLevelUps.length; hli++) {
                var hlvl = rewards.heroLevelUps[hli];
                heroLvHtml += '<span style="font-size:12px;">' + hlvl.name + ' Lv.' + hlvl.oldLevel + ' \u2192 Lv.' + hlvl.newLevel + '</span>';
                if (hli < rewards.heroLevelUps.length - 1) heroLvHtml += ', ';
            }
            document.getElementById('results-rewards').innerHTML += heroLvHtml;
        }

        // Show hero events (unlocks, deaths, departures)
        if (sd._pendingHeroEvents && sd._pendingHeroEvents.length > 0) {
            for (var hei = 0; hei < sd._pendingHeroEvents.length; hei++) {
                var hevt = sd._pendingHeroEvents[hei];
                var evtColor = hevt.type === 'death' ? '#ff4444' : (hevt.type === 'leave' ? '#ff8844' : '#44ff88');
                var evtIcon = hevt.type === 'unlock' ? '🆕' : (hevt.type === 'death' ? '💀' : (hevt.type === 'leave' ? '👋' : (hevt.type === 'return' ? '🔙' : '👻')));
                var evtMsg = hevt.message || (hevt.type === 'unlock' ? 'Hero ' + hevt.name + ' has joined!' : hevt.name);
                document.getElementById('results-rewards').innerHTML +=
                    '<br><span style="font-size:14px; color:' + evtColor + '; font-weight:bold;">' + evtIcon + ' ' + evtMsg + '</span>';
            }
            sd._pendingHeroEvents = [];
            autoSave(sd);
        }

        // Check achievements after mission
        var missionAch = checkAchievements(sd);
        if (missionAch.length > 0) { autoSave(sd); showAchievementToasts(missionAch); }
    } else {
        document.getElementById('results-rewards').textContent = 'No rewards earned.';
    }

    // MVP line
    if (combatState && combatState.playerUnits) {
        var mvp = null;
        for (var mv = 0; mv < combatState.playerUnits.length; mv++) {
            var mu = combatState.playerUnits[mv];
            if (mu.combatStats && (!mvp || mu.combatStats.damageDealt > mvp.combatStats.damageDealt)) {
                mvp = mu;
            }
        }
        if (mvp && mvp.combatStats && mvp.combatStats.damageDealt > 0) {
            var mvpEmoji = '';
            if (mvp.element && typeof ELEMENTS !== 'undefined' && ELEMENTS[mvp.element]) {
                mvpEmoji = ELEMENTS[mvp.element].emoji + ' ';
            }
            var mvpHtml = '<div style="margin-top:8px; font-size:13px; color:#e2b714;">MVP: ' +
                mvpEmoji + (mvp.name || 'Unit') + ' — ' +
                formatNum(mvp.combatStats.damageDealt) + ' damage' +
                (mvp.combatStats.kills > 0 ? ', ' + mvp.combatStats.kills + ' kill' + (mvp.combatStats.kills > 1 ? 's' : '') : '') +
                '</div>';
            document.getElementById('results-rewards').innerHTML += mvpHtml;
        }
    }

    document.getElementById('combat-results').className = 'combat-results show';
    renderTopBar();
}

function uiReturnFromCombat() {
    activeMission = null;
    // Clean up any lingering overlays
    document.getElementById('combat-results').className = 'combat-results';
    document.getElementById('wave-transition').className = 'wave-transition';
    var grid = document.getElementById('wave-reposition-grid');
    if (grid) grid.remove();
    // Clean up unit overlay layer and damage numbers
    var unitLayer = document.getElementById('combat-unit-layer');
    if (unitLayer) unitLayer.remove();
    var dmgNums = document.getElementById('damage-numbers');
    if (dmgNums) dmgNums.innerHTML = '';
    var enrageTimer = document.getElementById('enrage-timer');
    if (enrageTimer) enrageTimer.textContent = '';
    showScreen('hub');
}

// ---- Combat Board Rendering ----

function renderCombatUnitCell(unit, cssClass) {
    if (unit && unit.hp > 0) {
        var hpPct = Math.floor((unit.hp / unit.maxHp) * 100);
        var shieldPct = (unit.shield && unit.shield > 0) ? Math.min(100 - hpPct, Math.floor((unit.shield / unit.maxHp) * 100)) : 0;
        var shieldBar = shieldPct > 0 ?
            '<div style="height:100%; background:#4488ff; position:absolute; left:' + hpPct + '%; width:' + shieldPct + '%;"></div>' : '';
        var evolvedStyle = unit.evolved ? ' border:1px solid #e2b714; box-shadow:0 0 6px rgba(226,183,20,0.5);' : '';
        var evolvedIcon = unit.evolved ? '✨' : '';
        // Item icons for combat units
        var combatItemIcons = '';
        if (unit.combatItems && unit.combatItems.length > 0) {
            combatItemIcons = '<div style="font-size:7px; line-height:1;">';
            for (var ci = 0; ci < unit.combatItems.length; ci++) {
                combatItemIcons += unit.combatItems[ci];
            }
            combatItemIcons += '</div>';
        }
        var unitElemEmoji = (unit.element && ELEMENTS[unit.element]) ? ELEMENTS[unit.element].emoji : '';
        return '<div class="combat-cell ' + cssClass + '" style="' + evolvedStyle + '"><div class="combat-unit">' +
            unitElemEmoji + evolvedIcon +
            '<div style="font-size:8px;">' + unit.name.split(' ')[0] + '</div>' +
            combatItemIcons +
            '<div class="hp-bar" style="position:relative;"><div class="hp-fill' + (hpPct < 30 ? ' low' : '') +
            '" style="width:' + hpPct + '%"></div>' + shieldBar + '</div>' +
            '</div></div>';
    }
    return '<div class="combat-cell ' + cssClass + '"></div>';
}

function buildUnitCellHtml(unit) {
    if (unit.isBoss && unit.hp > 0) {
        var bHpPct = Math.max(0, Math.floor(unit.hp / unit.maxHp * 100));
        var bShieldBar = '';
        if (unit.shield && unit.shield > 0) {
            var bShPct = Math.min(100, Math.floor(unit.shield / unit.maxHp * 100));
            bShieldBar = '<div class="boss-shield-bar"><div class="boss-shield-fill" style="width:' + bShPct + '%"></div></div>';
        }
        var enrageHtml = unit.enraged ? '<div class="boss-enrage">ENRAGED</div>' : '';
        var phaseTransHtml = '';
        if (unit.phaseTransitioning) {
            phaseTransHtml = '<div style="font-size:8px; color:#ff9900; font-weight:bold;">INVULNERABLE</div>';
        }
        var bossEmoji = unit.emoji || '\ud83d\udc51';
        return '<div class="boss-unit">' +
            '<div class="boss-emoji">' + bossEmoji + '</div>' +
            '<div class="boss-name">' + unit.name + '</div>' +
            '<div class="boss-phase">Phase ' + (unit.currentPhase + 1) + '</div>' +
            '<div class="boss-hp-bar"><div class="boss-hp-fill" style="width:' + bHpPct + '%"></div></div>' +
            bShieldBar + enrageHtml + phaseTransHtml +
            '</div>';
    }

    var hpPct = Math.floor((unit.hp / unit.maxHp) * 100);
    var shieldPct = (unit.shield && unit.shield > 0) ? Math.min(100 - hpPct, Math.floor((unit.shield / unit.maxHp) * 100)) : 0;
    var shieldBar = shieldPct > 0 ?
        '<div style="height:100%; background:#4488ff; position:absolute; left:' + hpPct + '%; width:' + shieldPct + '%;"></div>' : '';
    var evolvedIcon = unit.evolved ? '\u2728' : '';
    var combatItemIcons = '';
    if (unit.combatItems && unit.combatItems.length > 0) {
        combatItemIcons = '<div style="font-size:7px; line-height:1;">';
        for (var ci = 0; ci < unit.combatItems.length; ci++) {
            combatItemIcons += unit.combatItems[ci];
        }
        combatItemIcons += '</div>';
    }
    var manaBar = '';
    if (unit.maxMana && unit.maxMana > 0) {
        var manaPct = Math.floor((unit.currentMana / unit.maxMana) * 100);
        manaBar = '<div class="mana-bar"><div class="mana-fill" style="width:' + manaPct + '%"></div></div>';
    }
    var statusIconsHtml = '';
    if (unit.statusEffects && unit.statusEffects.length > 0) {
        statusIconsHtml = '<div class="status-icons">';
        var shown = 0;
        var uniqueTypes = [];
        for (var si = 0; si < unit.statusEffects.length; si++) {
            var sType = unit.statusEffects[si].type;
            if (uniqueTypes.indexOf(sType) >= 0) continue;
            uniqueTypes.push(sType);
            if (shown < 3) {
                var sIcon = STATUS_ICONS[sType] || '?';
                statusIconsHtml += '<span class="status-icon" title="' + sType + '">' + sIcon + '</span>';
                shown++;
            }
        }
        if (uniqueTypes.length > 3) {
            statusIconsHtml += '<span class="status-overflow">+' + (uniqueTypes.length - 3) + '</span>';
        }
        statusIconsHtml += '</div>';
    }
    var elemEmoji = (unit.element && ELEMENTS[unit.element]) ? ELEMENTS[unit.element].emoji : '';
    return '<div class="combat-unit">' +
        elemEmoji + evolvedIcon +
        '<div style="font-size:7px;' + (unit.side === 'enemy' ? 'color:#ff6b6b;' : '') + '">' + unit.name.split(' ')[0] + '</div>' +
        combatItemIcons +
        '<div class="hp-bar" style="position:relative;"><div class="hp-fill' + (hpPct < 30 ? ' low' : '') +
        '" style="width:' + hpPct + '%"></div>' + shieldBar + '</div>' +
        manaBar +
        statusIconsHtml +
        '</div>';
}

function renderCombatBoard() {
    var boardEl = document.getElementById('combat-board');
    if (!combatState) return;

    var grid = combatState.grid;

    // Use percentage-based positioning so units are correct regardless of board size/timing
    var cellWPct = 100 / 7;
    var cellHPct = 100 / 8;

    // Collect telegraph danger cells
    var dangerCells = {};
    var bossList = combatState.enemyUnits.filter(function(u){ return u.isBoss && u.hp > 0; });
    for (var b = 0; b < bossList.length; b++) {
        var bossU = bossList[b];
        for (var t = 0; t < bossU.telegraphs.length; t++) {
            var tele = bossU.telegraphs[t];
            for (var tc = 0; tc < tele.targetCells.length; tc++) {
                dangerCells[tele.targetCells[tc].row + ',' + tele.targetCells[tc].col] = true;
            }
        }
    }

    // Rebuild background grid (always rebuild to keep danger zones and death markers current)
    var gridHtml = '';
    for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 7; c++) {
            var cls = r <= 3 ? 'enemy-row' : 'player-row';
            var borderStyle = r === 4 ? ' border-top:2px solid #555;' : '';
            var dangerClass = dangerCells[r + ',' + c] ? ' danger-zone' : '';
            var marker = '';
            if (combatState.deathMarkers && combatState.deathMarkers[r + ',' + c]) {
                marker = '<div class="death-marker">' + combatState.deathMarkers[r + ',' + c] + '</div>';
            }
            gridHtml += '<div class="combat-cell ' + cls + dangerClass + '" style="' + borderStyle + '">' + marker + '</div>';
        }
    }
    boardEl.innerHTML = gridHtml;

    // Render unit overlays inside the board (board is position:relative)
    var unitLayer = document.getElementById('combat-unit-layer');
    if (!unitLayer) {
        unitLayer = document.createElement('div');
        unitLayer.id = 'combat-unit-layer';
        unitLayer.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:4;';
        boardEl.appendChild(unitLayer);
    }

    // Create/update unit elements
    var allUnits = combatState.playerUnits.concat(combatState.enemyUnits);
    var existingEls = {};
    var children = unitLayer.children;
    for (var i = 0; i < children.length; i++) {
        existingEls[children[i].dataset.uid] = children[i];
    }

    var activeIds = {};
    for (var u = 0; u < allUnits.length; u++) {
        var unit = allUnits[u];
        if (unit.deathComplete) continue;
        if (unit.hp <= 0 && !unit.deathAnimating) continue;
        if (!unit._uid) unit._uid = 'u' + u + '_' + Math.random().toString(36).substr(2, 4);
        activeIds[unit._uid] = true;

        var el = existingEls[unit._uid];
        if (!el) {
            el = document.createElement('div');
            el.dataset.uid = unit._uid;
            el.className = 'combat-unit-overlay';
            unitLayer.appendChild(el);
        }

        // Position with percentage-based layout (immune to board resize/timing issues)
        var targetXPct = unit.gridCol * cellWPct;
        var targetYPct = unit.gridRow * cellHPct;

        // Boss: span 2x2
        if (unit.isBoss) {
            el.style.width = (cellWPct * 2) + '%';
            el.style.height = (cellHPct * 2) + '%';
        } else {
            el.style.width = cellWPct + '%';
            el.style.height = cellHPct + '%';
        }

        el.style.left = targetXPct + '%';
        el.style.top = targetYPct + '%';

        // Death animation
        if (unit.deathAnimating) {
            var deathPct = Math.max(0, unit.deathTimer / 0.5);
            el.style.opacity = deathPct.toFixed(2);
            el.style.transform = 'scale(' + (0.5 + deathPct * 0.5).toFixed(2) + ')';
        } else {
            el.style.opacity = '1';
            el.style.transform = 'scale(1)';
        }

        // Casting glow — element color
        if (unit.isCasting) {
            var elemColor = '#ffffff';
            if (unit.element && typeof ELEMENTS !== 'undefined' && ELEMENTS[unit.element]) {
                elemColor = ELEMENTS[unit.element].color || '#ffffff';
            }
            el.style.boxShadow = '0 0 8px ' + elemColor;
        } else {
            el.style.boxShadow = 'none';
        }

        // Evolved border
        if (unit.evolved) {
            el.style.border = '1px solid #e2b714';
        } else {
            el.style.border = 'none';
        }

        // Render unit content
        el.innerHTML = buildUnitCellHtml(unit);
    }

    // Remove elements for dead/gone units
    for (var uid in existingEls) {
        if (!activeIds[uid]) {
            existingEls[uid].parentNode.removeChild(existingEls[uid]);
        }
    }

    // Phase transition flash overlay
    for (var bi = 0; bi < bossList.length; bi++) {
        var bossF = bossList[bi];
        if (bossF.phaseTransitioning && bossF.phaseTransitionTimer > 1.5) {
            var phOverlay = document.createElement('div');
            phOverlay.className = 'phase-transition-overlay';
            document.getElementById('combat-area').appendChild(phOverlay);
            setTimeout(function(){ if (phOverlay.parentNode) phOverlay.parentNode.removeChild(phOverlay); }, 2000);
        }
    }

    // Enrage timer display
    if (combatState.bossUnit && combatState.bossUnit.hp > 0 && !combatState.bossUnit.enraged) {
        var bossData = combatState.bossUnit.bossData || {};
        var enrageTime = bossData.enrageTime || 120;
        var timeLeft = enrageTime - combatState.elapsed;
        var timerEl = document.getElementById('enrage-timer');
        if (timerEl) {
            if (timeLeft > 0 && timeLeft <= 30) {
                timerEl.textContent = '\u23f1\ufe0f Enrage: ' + Math.ceil(timeLeft) + 's';
            } else {
                timerEl.textContent = '';
            }
        }
    } else {
        var timerEl2 = document.getElementById('enrage-timer');
        if (timerEl2) timerEl2.textContent = '';
    }

    renderCombatScoreboard();

    // Attach unit data to cells for tooltips
    var combatCells = boardEl.querySelectorAll('.combat-cell');
    for (var tc = 0; tc < combatCells.length; tc++) {
        var cellEl = combatCells[tc];
        var cellUnit = cellEl._unitRef;
        if (cellUnit) {
            cellEl._unitData = cellUnit;
        }
    }
}

// ---- Combat Scoreboard ----

function formatNum(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return '' + n;
}

function renderCombatScoreboard() {
    var sb = document.getElementById('combat-scoreboard');
    if (!sb || !combatState) return;

    var html = '<div class="sb-header">Combat Stats</div>';

    // Player units sorted by damage dealt descending
    var pUnits = combatState.playerUnits.slice().sort(function(a, b) {
        return (b.combatStats ? b.combatStats.damageDealt : 0) - (a.combatStats ? a.combatStats.damageDealt : 0);
    });

    html += '<div style="color:#4fc3f7; font-size:10px; padding:2px 4px; font-weight:bold;">Your Team</div>';
    for (var i = 0; i < pUnits.length; i++) {
        var u = pUnits[i];
        var stats = u.combatStats || {damageDealt:0, damageTaken:0, healingDone:0};
        var deadClass = u.hp <= 0 ? ' dead' : '';
        html += '<div class="sb-unit' + deadClass + '">';
        html += '<div class="sb-name">' + (u.emoji || '') + ' ' + (u.name || 'Unit');
        if (u.maxMana && u.maxMana > 0 && u.hp > 0) {
            html += ' <span style="color:#4488ff; font-size:9px;">\u26A1' + (u.currentMana || 0) + '/' + u.maxMana + '</span>';
        }
        html += '</div>';
        html += '<div class="sb-stats">';
        html += '<span class="dmg">' + formatNum(stats.damageDealt) + ' dmg</span>';
        if (stats.healingDone > 0) {
            html += '<span class="heal">' + formatNum(stats.healingDone) + ' heal</span>';
        }
        if (stats.abilityCasts && stats.abilityCasts > 0) {
            html += '<span style="color:#aa88ff;">' + stats.abilityCasts + ' cast' + (stats.abilityCasts > 1 ? 's' : '') + '</span>';
        }
        html += '</div>';
        html += '<div class="sb-stats"><span class="taken">' + formatNum(stats.damageTaken) + ' taken</span></div>';
        html += '</div>';
    }

    // Enemy units sorted by damage dealt descending
    var eUnits = combatState.enemyUnits.slice().sort(function(a, b) {
        return (b.combatStats ? b.combatStats.damageDealt : 0) - (a.combatStats ? a.combatStats.damageDealt : 0);
    });

    html += '<div style="color:#ef5350; font-size:10px; padding:2px 4px; margin-top:4px; font-weight:bold;">Enemy Team</div>';
    for (var j = 0; j < eUnits.length; j++) {
        var e = eUnits[j];
        var eStats = e.combatStats || {damageDealt:0, damageTaken:0, healingDone:0};
        var eDeadClass = e.hp <= 0 ? ' dead' : '';

        if (e.isBoss) {
            // Boss-specific scoreboard entry
            html += '<div class="sb-unit boss-sb' + eDeadClass + '">';
            html += '<div class="sb-name enemy" style="color:#ff4444;font-size:12px;">👑 ' + e.name + '</div>';
            html += '<div class="sb-stats" style="font-size:10px;">';
            html += '<span style="color:#ff9999;">Phase ' + (e.currentPhase + 1) + '</span>';
            html += '<span class="dmg">' + formatNum(eStats.damageDealt) + ' dmg</span>';
            html += '</div>';
            if (e.hp > 0) {
                var bossHpPct = Math.floor(e.hp / e.maxHp * 100);
                html += '<div class="sb-stats"><span style="color:#ff6666;">' + formatNum(e.hp) + '/' + formatNum(e.maxHp) + ' HP (' + bossHpPct + '%)</span></div>';
            }
            html += '<div class="sb-stats"><span class="taken">' + formatNum(eStats.damageTaken) + ' taken</span></div>';
            html += '</div>';
        } else {
            html += '<div class="sb-unit' + eDeadClass + '">';
            html += '<div class="sb-name enemy">' + (e.emoji || '') + ' ' + (e.name || 'Enemy');
            if (e.maxMana && e.maxMana > 0 && e.hp > 0) {
                html += ' <span style="color:#4488ff; font-size:9px;">\u26A1' + (e.currentMana || 0) + '/' + e.maxMana + '</span>';
            }
            html += '</div>';
            html += '<div class="sb-stats">';
            html += '<span class="dmg">' + formatNum(eStats.damageDealt) + ' dmg</span>';
            if (eStats.healingDone > 0) {
                html += '<span class="heal">' + formatNum(eStats.healingDone) + ' heal</span>';
            }
            if (eStats.abilityCasts && eStats.abilityCasts > 0) {
                html += '<span style="color:#aa88ff;">' + eStats.abilityCasts + ' cast' + (eStats.abilityCasts > 1 ? 's' : '') + '</span>';
            }
            html += '</div>';
            html += '<div class="sb-stats"><span class="taken">' + formatNum(eStats.damageTaken) + ' taken</span></div>';
            html += '</div>';
        }
    }

    sb.innerHTML = html;
}

// ---- Combat Synergy Bar ----

function renderCombatSynergyBar() {
    var bar = document.getElementById('combat-synergy-bar');
    if (!bar || !combatState) { if (bar) bar.innerHTML = ''; return; }

    // Use vertical layout for readable synergy descriptions
    var html = '<div style="display:flex; flex-direction:column; gap:3px;">';

    // Active archetype synergies
    var archKeys = Object.keys(combatState.activeSynergies || {});
    for (var i = 0; i < archKeys.length; i++) {
        var aKey = archKeys[i];
        var arch = ARCHETYPES[aKey];
        if (!arch) continue;
        var count = combatState.activeSynergies[aKey];
        var tierReached = 0;
        for (var t = 0; t < arch.thresholds.length; t++) {
            if (count >= arch.thresholds[t]) tierReached = t + 1;
        }
        if (tierReached > 0) {
            var archDesc = getSynergyArchBonusDesc(aKey, tierReached - 1);
            var thresholdStr = '';
            for (var th = 0; th < arch.thresholds.length; th++) {
                thresholdStr += (th === tierReached - 1 ? '<b style="color:#e2b714;">' + arch.thresholds[th] + '</b>' : '<span style="color:#555;">' + arch.thresholds[th] + '</span>');
                if (th < arch.thresholds.length - 1) thresholdStr += '/';
            }
            html += '<div style="background:#2a3a5e; padding:3px 8px; border-radius:4px; border-left:3px solid #e2b714;">' +
                '<div style="font-size:11px;">' + arch.emoji + ' <b>' + arch.name + '</b> <span style="color:#e2b714;">' + count + '</span> (' + thresholdStr + ')</div>' +
                '<div style="font-size:10px; color:#aaa; margin-top:1px;">' + archDesc + '</div></div>';
        }
    }

    // Active element synergies
    var elemBonuses = combatState.activeElementBonuses || {};
    var elemKeys = Object.keys(elemBonuses);
    for (var j = 0; j < elemKeys.length; j++) {
        var eKey = elemKeys[j];
        var elemSyn = ELEMENT_SYNERGIES[eKey];
        if (!elemSyn) continue;
        var eCount = (combatState.activeElements || {})[eKey] || 0;
        var isPrismatic = elemBonuses[eKey] && elemBonuses[eKey].isPrismatic;
        var bgColor = isPrismatic ? '#5a4a2e' : '#1a2a4e';
        var borderColor = isPrismatic ? '#e2b714' : (elemSyn.color || '#4a6a9e');
        var eTierReached = 0;
        for (var et = 0; et < elemSyn.thresholds.length; et++) {
            if (eCount >= elemSyn.thresholds[et]) eTierReached = et + 1;
        }
        var elemDesc = (eTierReached > 0 && elemSyn.bonuses[eTierReached - 1]) ? elemSyn.bonuses[eTierReached - 1].desc : '';
        var eThresholdStr = '';
        for (var eth = 0; eth < elemSyn.thresholds.length; eth++) {
            eThresholdStr += (eth === eTierReached - 1 ? '<b style="color:' + (elemSyn.color || '#e2b714') + ';">' + elemSyn.thresholds[eth] + '</b>' : '<span style="color:#555;">' + elemSyn.thresholds[eth] + '</span>');
            if (eth < elemSyn.thresholds.length - 1) eThresholdStr += '/';
        }
        html += '<div style="background:' + bgColor + '; padding:3px 8px; border-radius:4px; border-left:3px solid ' + borderColor + ';">' +
            '<div style="font-size:11px; color:' + (elemSyn.color || '#fff') + ';">' + elemSyn.emoji + ' <b>' + elemSyn.name + '</b> <span style="color:' + (elemSyn.color || '#e2b714') + ';">' + eCount + '</span> (' + eThresholdStr + ')</div>' +
            '<div style="font-size:10px; color:#aaa; margin-top:1px;">' + elemDesc + '</div></div>';
    }

    html += '</div>';
    bar.innerHTML = html || '<span class="text-muted">No active synergies</span>';
}

// ---- Log ----

function addLogEntry(msg, type) {
    var log = document.getElementById('combat-log');
    if (!log) return;
    var entry = document.createElement('div');
    entry.className = 'log-entry log-' + (type || 'info');
    entry.textContent = msg;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

function clearLog() {
    var log = document.getElementById('combat-log');
    if (log) log.innerHTML = '';
}

// ---- Item Bench UI ----

var itemBenchVisible = false;
var selectedBenchItem = null; // item ID for equip mode

function uiToggleItemBench() {
    itemBenchVisible = !itemBenchVisible;
    var overlay = document.getElementById('item-bench-overlay');
    if (overlay) {
        overlay.style.display = itemBenchVisible ? 'block' : 'none';
        if (itemBenchVisible) renderItemBench();
    }
}

function renderItemBench() {
    var sd = getSaveData();
    var inv = (sd.equipment && sd.equipment.inventory) ? sd.equipment.inventory : [];

    var info = document.getElementById('item-bench-info');
    info.textContent = 'Equipment: ' + inv.length + ' items';

    var grid = document.getElementById('item-bench-grid');
    grid.innerHTML = '';

    // Show unequipped first, then equipped
    var unequipped = [];
    var equipped = [];
    for (var i = 0; i < inv.length; i++) {
        if (inv[i].equipped) equipped.push(inv[i]);
        else unequipped.push(inv[i]);
    }
    var sorted = unequipped.concat(equipped);

    for (var j = 0; j < sorted.length; j++) {
        var item = sorted[j];
        var rarityColor = getItemRarityColor(item);
        var emoji = getItemEmoji(item);
        var isSelected = selectedBenchItem === item.id;
        var isEquipped = !!item.equipped;

        var div = document.createElement('div');
        div.style.cssText = 'background:#16213e; border:2px solid ' + rarityColor + '; border-radius:6px; padding:6px; text-align:center; cursor:pointer; position:relative;' +
            (isSelected ? ' box-shadow:0 0 8px ' + rarityColor + ';' : '') +
            (isEquipped ? ' opacity:0.6;' : '');
        div.setAttribute('data-item-id', item.id);

        var nameStr = getItemName(item);
        if (nameStr.length > 12) nameStr = nameStr.substring(0, 11) + '..';

        var tierBadge = item.tier ? '<div style="position:absolute; top:1px; left:1px; font-size:8px; color:#888;">T' + item.tier + '</div>' : '';
        var setBadge = item.setId ? '<div style="position:absolute; top:1px; right:1px; font-size:8px;">🔗</div>' : '';

        div.innerHTML = tierBadge + setBadge +
            '<div style="font-size:16px;">' + emoji + '</div>' +
            '<div style="font-size:9px; color:' + rarityColor + ';">' + getItemRarityName(item) + '</div>' +
            '<div style="font-size:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + nameStr + '</div>' +
            (isEquipped ? '<div style="font-size:8px; color:#6bcb77;">Equipped</div>' : '');

        div.onclick = (function(itemObj) {
            return function() { uiSelectBenchItem(itemObj); };
        })(item);

        grid.appendChild(div);
    }
}

function uiSelectBenchItem(item) {
    var detailPanel = document.getElementById('item-detail-panel');

    if (selectedBenchItem === item.id) {
        // Deselect
        selectedBenchItem = null;
        detailPanel.style.display = 'none';
        renderItemBench();
        return;
    }

    selectedBenchItem = item.id;

    var rarityColor = getItemRarityColor(item);
    var html = '<div style="color:' + rarityColor + '; font-weight:bold;">' + getItemEmoji(item) + ' ' + getItemName(item) + '</div>';
    html += '<div style="font-size:11px; color:#888;">T' + (item.tier || '?') + ' ' + getItemRarityName(item) + ' · ' + (SLOT_DISPLAY[item.slot] ? SLOT_DISPLAY[item.slot].name : item.slot) + '</div>';
    html += '<div style="color:#ccc; margin-top:4px; font-size:12px;">' + getItemStatDescription(item) + '</div>';

    // Affixes
    if (item.affixes && item.affixes.length > 0) {
        html += '<div style="margin-top:4px; font-size:11px; color:#aaa;">Affixes:</div>';
        for (var ai = 0; ai < item.affixes.length; ai++) {
            html += '<div style="font-size:11px; color:#8bbcff;">  ' + item.affixes[ai].name + '</div>';
        }
    }

    // Set info
    if (item.setId && EQUIPMENT_SETS[item.setId]) {
        var setDef = EQUIPMENT_SETS[item.setId];
        html += '<div style="margin-top:4px; color:' + (ESSENCES[setDef.element] ? ESSENCES[setDef.element].color : '#fff') + '; font-size:12px;">🔗 ' + setDef.name + ' Set</div>';
    }

    // Gems
    if (item.gems && item.gems.length > 0) {
        html += '<div style="margin-top:4px; font-size:11px; color:#aaa;">Sockets: ';
        for (var gi = 0; gi < item.gems.length; gi++) {
            html += item.gems[gi] ? ('💎' + item.gems[gi]) : '◇';
            if (gi < item.gems.length - 1) html += ' ';
        }
        html += '</div>';
    }

    if (item.equipped) {
        var eqUnitName = UNIT_TEMPLATES[item.equipped.unitId] ? UNIT_TEMPLATES[item.equipped.unitId].name : (EVOLVED_TEMPLATES[item.equipped.unitId] ? EVOLVED_TEMPLATES[item.equipped.unitId].name : item.equipped.unitId);
        html += '<div style="margin-top:6px; color:#6bcb77;">Equipped on: ' + eqUnitName + '</div>';
        html += '<button onclick="uiUnequipItem(\'' + item.id + '\')" style="margin-top:4px; font-size:11px; padding:2px 8px; background:#553333; color:#fff; border:1px solid #884444; border-radius:4px; cursor:pointer;">Unequip</button>';
    } else {
        html += '<div style="margin-top:6px; font-size:11px; color:#e2b714;">Go to Team Builder to equip</div>';
    }

    if (!item.equipped && item.rarity !== 'mythic') {
        var sellValue = getItemSellValue(item);
        html += '<button onclick="uiSellItem(\'' + item.id + '\')" ' +
            'style="margin-top:6px; font-size:11px; padding:4px 12px; background:#553322; color:#e2b714; ' +
            'border:1px solid #886633; border-radius:4px; cursor:pointer;">' +
            'Sell for ' + sellValue + ' VE</button>';
    }

    detailPanel.innerHTML = html;
    detailPanel.style.display = 'block';
    renderItemBench();
}

function uiUnequipItem(itemId) {
    var sd = getSaveData();
    unequipItem(sd, itemId);
    selectedBenchItem = null;
    document.getElementById('item-detail-panel').style.display = 'none';
    renderItemBench();
}

function uiSellItem(itemId) {
    var sd = getSaveData();
    var gold = sellItem(sd, itemId);
    if (gold !== false) {
        selectedBenchItem = null;
        document.getElementById('item-detail-panel').style.display = 'none';
        renderItemBench();
        renderTopBar();
    }
}

// ---- Equipment Codex ----

function uiShowCodex() {
    var panel = document.getElementById('codex-panel');
    if (!panel) return;
    if (panel.style.display === 'block') { panel.style.display = 'none'; return; }

    var sd = getSaveData();
    var discovered = (sd.equipment && sd.equipment.codex && sd.equipment.codex.discovered) ? sd.equipment.codex.discovered : {};
    var discCount = Object.keys(discovered).length;

    var html = '<div style="font-size:16px; font-weight:bold; color:#e2b714; margin-bottom:8px;">📖 Equipment Codex</div>';
    html += '<div style="font-size:12px; color:#888; margin-bottom:10px;">Discovered: ' + discCount + ' item variants</div>';

    // Show by slot
    var slots = ['weapon', 'helm', 'chest', 'gauntlets', 'boots', 'offhand', 'accessory'];
    for (var si = 0; si < slots.length; si++) {
        var slot = slots[si];
        var lines = getItemLinesForSlot(slot);
        var slotName = SLOT_DISPLAY[slot] ? (SLOT_DISPLAY[slot].emoji + ' ' + SLOT_DISPLAY[slot].name) : slot;
        html += '<div style="margin-bottom:8px;">';
        html += '<div style="font-size:13px; font-weight:bold; color:#aac; margin-bottom:4px;">' + slotName + '</div>';
        for (var li = 0; li < lines.length; li++) {
            var lineKey = lines[li];
            var lineDef = ITEM_LINES[lineKey];
            if (!lineDef) continue;
            html += '<div style="margin-left:8px; margin-bottom:2px;">';
            for (var t = 1; t <= 5; t++) {
                var codexKey = lineKey + '_t' + t;
                var isDiscovered = !!discovered[codexKey];
                var tierName = lineDef.names[t] || '???';
                if (isDiscovered) {
                    html += '<span style="font-size:11px; color:#ccc; margin-right:6px;">T' + t + ': ' + tierName + '</span>';
                } else {
                    html += '<span style="font-size:11px; color:#444; margin-right:6px;">T' + t + ': ???</span>';
                }
            }
            html += '</div>';
        }
        html += '</div>';
    }

    // Mythics
    html += '<div style="margin-bottom:8px;">';
    html += '<div style="font-size:13px; font-weight:bold; color:#fb923c; margin-bottom:4px;">🌟 Mythic Equipment</div>';
    var mythicKeys = Object.keys(MYTHIC_ITEMS);
    for (var mi = 0; mi < mythicKeys.length; mi++) {
        var mk = mythicKeys[mi];
        var mDef = MYTHIC_ITEMS[mk];
        var mDiscovered = !!discovered[mk];
        if (mDiscovered) {
            html += '<div style="margin-left:8px; font-size:11px; color:#fb923c;">' + mDef.emoji + ' ' + mDef.name + '</div>';
        } else {
            html += '<div style="margin-left:8px; font-size:11px; color:#444;">🔒 ???</div>';
        }
    }
    html += '</div>';

    panel.innerHTML = html;
    panel.style.display = 'block';
}

// ---- Item Equip Mode in Team Builder ----

var equipModeItemId = null; // when set, clicking a unit equips this item
var itemSellMode = false;

function toggleItemSellMode() {
    itemSellMode = !itemSellMode;
    equipModeItemId = null; // exit equip mode
    renderTeamBuilderItemBar();
}

function renderTeamBuilderItemBar() {
    var sd = getSaveData();
    var bench = getBenchItems(sd);
    var unequipped = [];
    for (var i = 0; i < bench.length; i++) {
        if (!bench[i].equipped) unequipped.push(bench[i]);
    }

    // Find or create item bar in team builder
    var container = document.getElementById('team-item-bar');
    if (!container) {
        container = document.createElement('div');
        container.id = 'team-item-bar';
        container.style.cssText = 'margin-top:8px; padding:8px; background:#16213e; border-radius:6px;';
        var boardPanel = document.querySelector('.team-board-panel');
        if (boardPanel) boardPanel.appendChild(container);
    }

    var sellModeHtml = '<button id="item-sell-mode-btn" onclick="toggleItemSellMode()" ' +
        'style="font-size:10px; padding:2px 8px; margin-left:8px; background:' +
        (itemSellMode ? '#553322' : '#2a2a3e') + '; color:' +
        (itemSellMode ? '#e2b714' : '#888') + '; border:1px solid #555; border-radius:4px; cursor:pointer;">' +
        (itemSellMode ? '💰 Sell Mode ON' : '💰 Sell') + '</button>';

    var html = '<div style="font-size:12px; color:#888; margin-bottom:4px;">🎒 Equipment (' +
        unequipped.length + ' available, ' + bench.length + ' total)' + sellModeHtml + '</div>';
    html += '<div style="display:flex; flex-wrap:wrap; gap:4px;">';

    for (var j = 0; j < unequipped.length; j++) {
        var item = unequipped[j];
        var rarityColor = getItemRarityColor(item);
        var isSelected = equipModeItemId === item.id;
        html += '<div data-equip-item="' + item.id + '" style="background:#1a1a2e; border:2px solid ' + rarityColor + '; border-radius:4px; padding:3px 6px; cursor:pointer; font-size:12px;' +
            (isSelected ? ' box-shadow:0 0 8px ' + rarityColor + '; background:#2a2a4e;' : '') +
            '" title="' + getItemName(item) + ' (' + getItemRarityName(item) + ')\n' + getItemStatDescription(item) + '\nSell: ' + getItemSellValue(item) + ' VE">' +
            getItemEmoji(item) + '</div>';
    }

    if (unequipped.length === 0) {
        html += '<span style="font-size:11px; color:#555;">No items to equip</span>';
    }

    html += '</div>';

    if (equipModeItemId) {
        html += '<div style="font-size:11px; color:#e2b714; margin-top:4px;">Click a unit on the board to equip</div>';
    }

    container.innerHTML = html;

    // Bind click handlers
    var itemEls = container.querySelectorAll('[data-equip-item]');
    for (var k = 0; k < itemEls.length; k++) {
        itemEls[k].addEventListener('click', function() {
            var id = this.getAttribute('data-equip-item');

            // Sell mode: sell item instead of entering equip mode
            if (itemSellMode) {
                var sd2 = getSaveData();
                var gold = sellItem(sd2, id);
                if (gold !== false) {
                    renderTeamBuilderItemBar();
                    renderTopBar();
                }
                return;
            }

            if (equipModeItemId === id) {
                equipModeItemId = null;
            } else {
                equipModeItemId = id;
                selectedRosterUnit = null; // exit unit selection mode
            }
            renderTeamBuilderItemBar();
        });
    }
}

// ---- Item Slots on Team Builder Board Cells ----

// Override onTeamCellClick to handle equip mode
var _originalOnTeamCellClick = null;

function patchTeamCellClickForItems() {
    // We'll check equipModeItemId inside the existing onTeamCellClick
}

// ---- Render item icons on board cells in team builder ----

function getUnitItemIcons(saveData, unitKey) {
    var items = getEquippedItems(saveData, unitKey);
    if (items.length === 0) return '';
    var html = '<div style="font-size:8px; line-height:1;">';
    for (var i = 0; i < items.length; i++) {
        html += getItemEmoji(items[i]);
    }
    html += '</div>';
    return html;
}

// ---- Unit Detail Panel ----

function showUnitDetail(unitKey, context) {
    // context: 'roster' or 'team-builder'
    var sd = getSaveData();
    var entry = sd.collection[unitKey];
    if (!entry) return;

    var tmpl = UNIT_TEMPLATES[unitKey] || EVOLVED_TEMPLATES[unitKey];
    if (!tmpl) return;
    var isEvolvedUnit = !!EVOLVED_TEMPLATES[unitKey];

    var stars = entry.stars;
    var statMult = getStarMultiplier(stars);
    var scaledHP = Math.floor(tmpl.hp * statMult);
    var scaledATK = Math.floor(tmpl.attack * statMult);

    var elemData = ELEMENTS[tmpl.element];
    var archData = ARCHETYPES[tmpl.archetype];
    var typeData = UNIT_TYPE_DESCRIPTIONS[tmpl.type];

    var starsStr = '';
    for (var s = 0; s < stars; s++) starsStr += '⭐';

    var html = '';

    var displayCost = tmpl.cost || tmpl.baseCost || 1;

    // ---- Header ----
    html += '<div class="ud-header">';
    if (isEvolvedUnit) {
        html += '<div style="color:#e2b714; font-size:11px; font-weight:bold;">✨ Evolved Unit</div>';
    }
    html += '<div class="ud-name">' + elemData.emoji + ' ' + tmpl.name + ' ' + archData.emoji + '</div>';
    html += '<div class="ud-stars">' + starsStr + ' (Cost ' + displayCost + ')</div>';
    html += '<div class="ud-meta">' + elemData.name + ' ' + archData.name + ' ' + (typeData ? typeData.name : tmpl.type) + '</div>';
    html += '</div>';

    // ---- Combat Behavior ----
    if (typeData) {
        html += '<div class="ud-section">';
        html += '<div class="ud-section-title">⚔️ Combat Behavior — ' + typeData.name + '</div>';
        html += '<div class="ud-type-desc">' + typeData.desc + '</div>';
        html += '</div>';
    }

    // ---- Stats ----
    html += '<div class="ud-section">';
    html += '<div class="ud-section-title">📊 Stats</div>';

    html += '<div class="ud-stat-row"><span class="ud-stat-label">HP</span><span class="ud-stat-value">' +
        scaledHP + ' <span style="color:#666; font-size:10px;">(base ' + tmpl.hp + ' × ' + statMult.toFixed(2) + ')</span></span></div>';
    html += '<div class="ud-stat-row"><span class="ud-stat-label">Attack</span><span class="ud-stat-value">' +
        scaledATK + ' <span style="color:#666; font-size:10px;">(base ' + tmpl.attack + ')</span></span></div>';
    html += '<div class="ud-stat-row"><span class="ud-stat-label">Attack Speed</span><span class="ud-stat-value">' +
        tmpl.attackSpd + 's</span></div>';
    html += '<div class="ud-stat-row"><span class="ud-stat-label">Range</span><span class="ud-stat-value">' +
        tmpl.range + '</span></div>';
    html += '<div class="ud-stat-row"><span class="ud-stat-label">Move Speed</span><span class="ud-stat-value">' +
        tmpl.moveSpd + '</span></div>';

    // ---- Element Matchup ----
    html += '<div style="margin-top:6px; font-size:11px; color:#aaa;">';
    html += 'Strong vs ' + ELEMENTS[elemData.strong].emoji + ' ' + ELEMENTS[elemData.strong].name + ' (1.3×) · ';
    html += 'Weak vs ' + ELEMENTS[elemData.weak].emoji + ' ' + ELEMENTS[elemData.weak].name + ' (0.7×)';
    html += '</div>';
    html += '</div>';

    // ---- Equipped Items ----
    var equippedItems = getEquippedItems(sd, unitKey);
    if (equippedItems.length > 0) {
        html += '<div class="ud-section">';
        html += '<div class="ud-section-title">🎒 Equipped Items</div>';
        for (var i = 0; i < equippedItems.length; i++) {
            var item = equippedItems[i];
            var rarityColor = getItemRarityColor(item);
            html += '<div class="ud-item-row">';
            html += '<span style="font-size:16px;">' + getItemEmoji(item) + '</span>';
            html += '<span style="color:' + rarityColor + ';">' + getItemName(item) + '</span>';
            html += '<span style="color:#aaa; font-size:11px;">(' + getItemStatDescription(item) + ')</span>';
            html += '</div>';
        }
        html += '</div>';
    }

    // ---- Synergies (team builder context) ----
    if (context === 'team-builder') {
        var preview = previewTeamSynergies(sd);
        var relevantSynergies = [];

        // Archetype synergy for this unit
        var archCount = preview.archetypeCounts[tmpl.archetype] || 0;
        if (archCount > 0) {
            var activeSyn = preview.activeSynergies[tmpl.archetype];
            var tierReached = activeSyn ? activeSyn.tier : 0;
            var synStatus = tierReached > 0 ? '✓ Active (Tier ' + tierReached + ')' : archCount + '/' + archData.thresholds[0] + ' needed';
            relevantSynergies.push({
                emoji: archData.emoji,
                name: archData.name,
                count: archCount,
                status: synStatus,
                active: tierReached > 0
            });
        }

        // Element synergy for this unit
        var elemCount = preview.elementCounts[tmpl.element] || 0;
        if (elemCount > 0) {
            var elemSyn = ELEMENT_SYNERGIES[tmpl.element];
            var activeElem = preview.activeElementSynergies[tmpl.element];
            var eTierReached = activeElem ? activeElem.tier : 0;
            var eSynStatus = eTierReached > 0 ? '✓ Active (Tier ' + eTierReached + ')' : elemCount + '/' + elemSyn.thresholds[0] + ' needed';
            relevantSynergies.push({
                emoji: elemSyn.emoji,
                name: elemSyn.name,
                count: elemCount,
                status: eSynStatus,
                active: eTierReached > 0
            });
        }

        if (relevantSynergies.length > 0) {
            html += '<div class="ud-section">';
            html += '<div class="ud-section-title">🔗 Team Synergies</div>';
            for (var si = 0; si < relevantSynergies.length; si++) {
                var syn = relevantSynergies[si];
                html += '<div style="font-size:12px; color:' + (syn.active ? '#6bcb77' : '#888') + '; padding:2px 0;">';
                html += syn.emoji + ' ' + syn.name + ' (' + syn.count + ') — ' + syn.status;
                html += '</div>';
            }
            html += '</div>';
        }
    }

    // ---- Copy Progress (roster context) ----
    if (context === 'roster') {
        html += '<div class="ud-section">';
        html += '<div class="ud-section-title">📈 Progress</div>';
        var copiesNeeded = 10; // 10-copy star-up
        html += '<div class="ud-stat-row"><span class="ud-stat-label">Current Stars</span><span class="ud-stat-value">' + starsStr + '</span></div>';
        html += '<div class="ud-stat-row"><span class="ud-stat-label">Copies</span><span class="ud-stat-value">' + entry.copiesForNext + ' / ' + copiesNeeded + ' for next star</span></div>';
        if (entry.copiesForNext >= copiesNeeded) {
            html += '<div style="font-size:12px; color:#6bcb77; margin-top:4px;">Ready to star up!</div>';
        }
        html += '</div>';
    }

    // ---- Evolution Info ----
    if (isEvolvedUnit) {
        // Show "Evolved from" info and ability
        var baseTmpl = UNIT_TEMPLATES[tmpl.baseKey];
        html += '<div class="ud-section">';
        html += '<div class="ud-section-title">✨ Evolved Unit</div>';
        html += '<div class="ud-evo-box">';
        if (baseTmpl) {
            html += '<div style="font-size:12px; color:#aaa;">Evolved from: ' + baseTmpl.name + '</div>';
        }
        if (tmpl.ability) {
            html += '<div class="ud-evo-ability" style="margin-top:4px;">⚡ ' + tmpl.ability + '</div>';
        }
        html += '</div>';
        html += '</div>';
    } else {
        // Show evolution path for base units
        var evo = EVOLUTIONS[unitKey];
        if (evo) {
            var evolvedTmpl2 = EVOLVED_TEMPLATES[evo.into];
            if (evolvedTmpl2) {
                html += '<div class="ud-section">';
                html += '<div class="ud-section-title">✨ Evolution Path</div>';
                html += '<div class="ud-evo-box">';
                html += '<div style="font-size:14px; font-weight:bold;">' + tmpl.name + ' → ' + evolvedTmpl2.name + '</div>';

                // Check requirements
                var evoCheck = checkEvolutionRequirements(sd, unitKey);
                if (evoCheck.requirements) {
                    for (var ri2 = 0; ri2 < evoCheck.requirements.length; ri2++) {
                        var reqResult = evoCheck.requirements[ri2];
                        html += '<div class="' + (reqResult.met ? 'ud-evo-met' : 'ud-evo-unmet') + '" style="font-size:12px;">';
                        html += (reqResult.met ? '✓' : '○') + ' ' + reqResult.desc;
                        html += '</div>';
                    }
                }

                // Already evolved?
                if (sd.collection[evo.into]) {
                    html += '<div style="font-size:12px; color:#6bcb77; margin-top:4px;">✅ Already evolved!</div>';
                } else if (canEvolve(sd)) {
                    var evoCost = getEvolutionGoldCost(sd, unitKey);
                    html += '<div style="font-size:12px; color:#e2b714; margin-top:4px;">Evolution cost: ' + evoCost + ' VE (Deep Resonance)</div>';
                } else {
                    html += '<div style="font-size:12px; color:#888; margin-top:4px;">Build the Evolution Lab to evolve</div>';
                }

                // Evolved stats preview
                html += '<div style="margin-top:6px; font-size:11px; color:#aaa;">Evolved Stats (at 1⭐):</div>';
                html += '<div style="font-size:11px; color:#ccc;">HP: ' + evolvedTmpl2.hp +
                    ' · ATK: ' + evolvedTmpl2.attack +
                    ' · SPD: ' + evolvedTmpl2.attackSpd + 's · Range: ' + evolvedTmpl2.range + '</div>';

                if (evolvedTmpl2.ability) {
                    html += '<div class="ud-evo-ability">⚡ ' + evolvedTmpl2.ability + '</div>';
                }

                html += '</div>';
                html += '</div>';
            }
        }
    }

    // Render
    var overlay = document.getElementById('unit-detail-overlay');
    document.getElementById('unit-detail-content').innerHTML = html;
    overlay.style.display = 'flex';
}

function closeUnitDetail() {
    document.getElementById('unit-detail-overlay').style.display = 'none';
}

// ---- Reset Game ----

function uiResetGame() {
    if (!confirm('This will erase all progress and start a new game. Are you sure?')) return;
    deleteSave();
    saveData = createDefaultSaveData();
    saveGame(saveData);
    showScreen('hub');
}

// =============================================================================
// Prompt 20: Integration & Polish — Additional UI Functions
// =============================================================================

// ---- Element Emoji Helper ----

function getElementEmoji(element) {
    if (ELEMENTS && ELEMENTS[element]) return ELEMENTS[element].emoji;
    var map = { 'fire': '🔥', 'water': '💧', 'earth': '🌿', 'wind': '💨', 'lightning': '⚡', 'force': '💪' };
    return map[element] || '❓';
}

function getElementColor(element) {
    var colorMap = {
        'fire': '#FF4500',
        'water': '#1E90FF',
        'earth': '#228B22',
        'wind': '#87CEEB',
        'lightning': '#FFD700',
        'force': '#9370DB'
    };
    return colorMap[element] || '#FFF';
}

// ---- Achievement Panel ----

function showAchievementPanel() {
    var sd = getSaveData();
    // Run check to catch any newly earned
    var newAch = checkAchievements(sd);
    var statuses = getAchievementStatus(sd);

    var overlay = document.getElementById('achievement-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'achievement-overlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:1000;';
        document.body.appendChild(overlay);
    }

    var categories = { combat: [], collection: [], economy: [], progression: [] };
    for (var i = 0; i < statuses.length; i++) {
        var cat = statuses[i].category || 'combat';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(statuses[i]);
    }

    var catEmojis = { combat: '⚔️', collection: '📋', economy: '💰', progression: '📈' };

    var html = '<div style="background:#1a1a2e; border:2px solid #e2b714; border-radius:12px; max-width:700px; width:95%; max-height:85vh; overflow-y:auto; padding:20px;">';
    html += '<div style="font-size:20px; font-weight:bold; color:#e2b714; margin-bottom:16px;">🏆 Achievements</div>';

    var catKeys = ['combat', 'collection', 'economy', 'progression'];
    for (var ci = 0; ci < catKeys.length; ci++) {
        var catKey = catKeys[ci];
        var achList = categories[catKey];
        if (!achList || achList.length === 0) continue;

        html += '<div style="font-size:14px; font-weight:bold; color:#aac; margin-top:12px; margin-bottom:6px;">' +
            (catEmojis[catKey] || '') + ' ' + catKey.charAt(0).toUpperCase() + catKey.slice(1) + '</div>';

        for (var ai = 0; ai < achList.length; ai++) {
            var ach = achList[ai];
            var bgColor = ach.claimed ? '#1a3328' : (ach.earned ? '#2a2a1e' : '#16213e');
            var borderColor = ach.claimed ? '#6bcb77' : (ach.earned ? '#e2b714' : '#333');

            html += '<div style="display:flex; align-items:center; justify-content:space-between; padding:8px 10px; margin-bottom:4px; background:' + bgColor + '; border-radius:6px; border:1px solid ' + borderColor + ';">';
            html += '<div>';
            html += '<div style="font-size:13px; font-weight:bold;">' + ach.name + '</div>';
            html += '<div style="font-size:11px; color:#aaa;">' + ach.description + '</div>';
            html += '<div style="font-size:11px; color:#e2b714;">Reward: ' + (ach.reward.veilEssence || 0) + ' VE</div>';
            html += '</div>';
            html += '<div style="text-align:right;">';
            if (ach.claimed) {
                html += '<span style="color:#6bcb77; font-weight:bold; font-size:12px;">✓ Claimed</span>';
            } else if (ach.earned) {
                html += '<button class="ach-claim-btn btn-primary" data-ach-id="' + ach.id + '" style="padding:4px 12px; font-size:11px;">Claim</button>';
            } else {
                html += '<span style="color:#666; font-size:11px;">🔒 Locked</span>';
            }
            html += '</div>';
            html += '</div>';
        }
    }

    html += '<div style="text-align:center; margin-top:16px;">';
    html += '<button id="ach-close" style="padding:8px 20px; background:#333; color:#fff; border:none; border-radius:6px; cursor:pointer;">Close</button>';
    html += '</div>';
    html += '</div>';

    overlay.innerHTML = html;
    overlay.style.display = 'flex';

    document.getElementById('ach-close').onclick = function() { overlay.style.display = 'none'; };

    // Bind claim buttons
    var claimBtns = overlay.querySelectorAll('.ach-claim-btn');
    for (var cb = 0; cb < claimBtns.length; cb++) {
        claimBtns[cb].addEventListener('click', function() {
            var achId = this.getAttribute('data-ach-id');
            var sd2 = getSaveData();
            var reward = claimAchievementReward(sd2, achId);
            if (reward) {
                autoSave(sd2);
                renderTopBar();
                showAchievementPanel(); // Refresh
            }
        });
    }
}

function showAchievementToasts(newAchIds) {
    for (var i = 0; i < newAchIds.length; i++) {
        var ach = null;
        for (var j = 0; j < ACHIEVEMENTS.length; j++) {
            if (ACHIEVEMENTS[j].id === newAchIds[i]) { ach = ACHIEVEMENTS[j]; break; }
        }
        if (ach) {
            showToast('🏆 Achievement Earned: ' + ach.name + '!');
        }
    }
}

// ---- Stats Panel ----

function showStatsPanel() {
    var sd = getSaveData();
    var stats = sd.stats || {};

    var overlay = document.getElementById('stats-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'stats-overlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:1000;';
        document.body.appendChild(overlay);
    }

    function fmtNum(n) {
        if (typeof n !== 'number' || isNaN(n)) return '0';
        return n.toLocaleString();
    }

    var fastestWin = stats.fastestWin || 999999;
    var fastestStr = fastestWin >= 999999 ? 'N/A' : (fastestWin.toFixed ? fastestWin.toFixed(1) : fastestWin) + 's';

    var statLines = [
        ['Missions Completed', fmtNum(stats.totalMissionsCompleted || stats.missionsCompleted || 0)],
        ['Bosses Defeated', fmtNum(stats.bossesDefeated || 0)],
        ['Deathless Boss Clears', fmtNum(stats.deathlessBossClears || 0)],
        ['Max Single Hit', fmtNum(stats.maxSingleHit || 0)],
        ['Fastest Win', fastestStr],
        ['Total VE Earned', fmtNum(stats.totalVeilEssenceEarned || 0)],
        ['Total VE Spent', fmtNum(stats.totalVeilEssenceSpent || 0)],
        ['Total Rolls', fmtNum(stats.totalRolls || 0)],
        ['Total Units Collected', fmtNum(stats.totalUnitsCollected || 0)],
        ['Total Gacha Pulls', fmtNum(stats.totalGachaPulls || 0)],
        ['Max Element Synergy', fmtNum(stats.maxElementSynergy || 0)],
        ['Forge Operations', fmtNum(stats.forgeOperations || 0)],
        ['Enhancements Performed', fmtNum(stats.enhancementsPerformed || 0)],
        ['Max Enhance Level', '+' + (stats.maxEnhanceLevel || 0)],
        ['Mythics Crafted', fmtNum(stats.mythicsCrafted || 0)],
        ['Gems Socketed', fmtNum(stats.gemsSocketed || 0)],
        ['Unique Bonds Used', fmtNum(stats.uniqueBondsUsed || 0)]
    ];

    var html = '<div style="background:#1a1a2e; border:2px solid #8bbcff; border-radius:12px; max-width:500px; width:95%; max-height:85vh; overflow-y:auto; padding:20px;">';
    html += '<div style="font-size:20px; font-weight:bold; color:#8bbcff; margin-bottom:16px;">📊 Player Stats</div>';

    for (var i = 0; i < statLines.length; i++) {
        html += '<div style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #222; font-size:13px;">';
        html += '<span style="color:#aaa;">' + statLines[i][0] + '</span>';
        html += '<span style="color:#fff; font-weight:bold;">' + statLines[i][1] + '</span>';
        html += '</div>';
    }

    html += '<div style="text-align:center; margin-top:16px;">';
    html += '<button id="stats-close" style="padding:8px 20px; background:#333; color:#fff; border:none; border-radius:6px; cursor:pointer;">Close</button>';
    html += '</div>';
    html += '</div>';

    overlay.innerHTML = html;
    overlay.style.display = 'flex';

    document.getElementById('stats-close').onclick = function() { overlay.style.display = 'none'; };
}

// ---- Collection Browser (Prompt 20 Phase C1) ----

var collectionFilters = {
    element: 'all',
    type: 'all',
    archetype: 'all',
    tier: 'all',
    sort: 'tier',
    search: ''
};

function buildCollectionUI() {
    var container = document.getElementById('roster-grid');
    if (!container) return;

    // Build filter bar above the grid
    var filterBar = document.getElementById('collection-filter-bar');
    if (!filterBar) {
        filterBar = document.createElement('div');
        filterBar.id = 'collection-filter-bar';
        filterBar.style.cssText = 'margin-bottom:8px; display:flex; flex-wrap:wrap; gap:6px; align-items:center; font-size:12px;';
        container.parentNode.insertBefore(filterBar, container);
    }

    var allElements = Object.keys(ELEMENTS);
    var allArchetypes = Object.keys(ARCHETYPES);
    var allTypes = ['warrior', 'tank', 'archer', 'mage', 'assassin', 'healer'];

    var html = '';

    // Element filter
    html += '<div class="filter-group" style="display:flex; gap:2px; flex-wrap:wrap;">';
    html += '<span style="color:#888; margin-right:4px;">Element:</span>';
    html += '<button class="filter-btn' + (collectionFilters.element === 'all' ? ' active' : '') + '" data-filter="element" data-value="all" style="padding:2px 6px; border-radius:4px; border:1px solid #444; background:' + (collectionFilters.element === 'all' ? '#e2b714' : '#222') + '; color:' + (collectionFilters.element === 'all' ? '#000' : '#ccc') + '; cursor:pointer; font-size:11px;">All</button>';
    for (var ei = 0; ei < allElements.length; ei++) {
        var el = allElements[ei];
        var isActive = collectionFilters.element === el;
        html += '<button class="filter-btn' + (isActive ? ' active' : '') + '" data-filter="element" data-value="' + el + '" style="padding:2px 6px; border-radius:4px; border:1px solid #444; background:' + (isActive ? '#e2b714' : '#222') + '; color:' + (isActive ? '#000' : '#ccc') + '; cursor:pointer; font-size:11px;">' + getElementEmoji(el) + '</button>';
    }
    html += '</div>';

    // Type filter
    html += '<div class="filter-group" style="display:flex; gap:2px; flex-wrap:wrap;">';
    html += '<span style="color:#888; margin-right:4px;">Type:</span>';
    html += '<button class="filter-btn' + (collectionFilters.type === 'all' ? ' active' : '') + '" data-filter="type" data-value="all" style="padding:2px 6px; border-radius:4px; border:1px solid #444; background:' + (collectionFilters.type === 'all' ? '#e2b714' : '#222') + '; color:' + (collectionFilters.type === 'all' ? '#000' : '#ccc') + '; cursor:pointer; font-size:11px;">All</button>';
    for (var ti = 0; ti < allTypes.length; ti++) {
        var tp = allTypes[ti];
        var tActive = collectionFilters.type === tp;
        html += '<button class="filter-btn' + (tActive ? ' active' : '') + '" data-filter="type" data-value="' + tp + '" style="padding:2px 6px; border-radius:4px; border:1px solid #444; background:' + (tActive ? '#e2b714' : '#222') + '; color:' + (tActive ? '#000' : '#ccc') + '; cursor:pointer; font-size:11px;">' + tp.charAt(0).toUpperCase() + tp.slice(1) + '</button>';
    }
    html += '</div>';

    // Archetype filter
    html += '<div class="filter-group" style="display:flex; gap:2px; flex-wrap:wrap;">';
    html += '<span style="color:#888; margin-right:4px;">Archetype:</span>';
    html += '<button class="filter-btn' + (collectionFilters.archetype === 'all' ? ' active' : '') + '" data-filter="archetype" data-value="all" style="padding:2px 6px; border-radius:4px; border:1px solid #444; background:' + (collectionFilters.archetype === 'all' ? '#e2b714' : '#222') + '; color:' + (collectionFilters.archetype === 'all' ? '#000' : '#ccc') + '; cursor:pointer; font-size:11px;">All</button>';
    for (var ai = 0; ai < allArchetypes.length; ai++) {
        var arch = allArchetypes[ai];
        var aActive = collectionFilters.archetype === arch;
        html += '<button class="filter-btn' + (aActive ? ' active' : '') + '" data-filter="archetype" data-value="' + arch + '" style="padding:2px 6px; border-radius:4px; border:1px solid #444; background:' + (aActive ? '#e2b714' : '#222') + '; color:' + (aActive ? '#000' : '#ccc') + '; cursor:pointer; font-size:11px;">' + ARCHETYPES[arch].emoji + ' ' + ARCHETYPES[arch].name + '</button>';
    }
    html += '</div>';

    // Tier filter
    html += '<div class="filter-group" style="display:flex; gap:2px; flex-wrap:wrap;">';
    html += '<span style="color:#888; margin-right:4px;">Tier:</span>';
    html += '<button class="filter-btn' + (collectionFilters.tier === 'all' ? ' active' : '') + '" data-filter="tier" data-value="all" style="padding:2px 6px; border-radius:4px; border:1px solid #444; background:' + (collectionFilters.tier === 'all' ? '#e2b714' : '#222') + '; color:' + (collectionFilters.tier === 'all' ? '#000' : '#ccc') + '; cursor:pointer; font-size:11px;">All</button>';
    for (var ci = 1; ci <= 5; ci++) {
        var cActive = collectionFilters.tier === ci;
        var stars = '';
        for (var si = 0; si < ci; si++) stars += '★';
        html += '<button class="filter-btn' + (cActive ? ' active' : '') + '" data-filter="tier" data-value="' + ci + '" style="padding:2px 6px; border-radius:4px; border:1px solid #444; background:' + (cActive ? '#e2b714' : '#222') + '; color:' + (cActive ? '#000' : '#ccc') + '; cursor:pointer; font-size:11px;">T' + ci + ' ' + stars + '</button>';
    }
    html += '</div>';

    // Sort + Search
    html += '<div class="filter-group" style="display:flex; gap:6px; align-items:center;">';
    html += '<span style="color:#888;">Sort:</span>';
    html += '<select id="collection-sort" style="padding:2px 4px; border-radius:4px; border:1px solid #444; background:#222; color:#ccc; font-size:11px;">';
    html += '<option value="tier"' + (collectionFilters.sort === 'tier' ? ' selected' : '') + '>By Tier</option>';
    html += '<option value="name"' + (collectionFilters.sort === 'name' ? ' selected' : '') + '>By Name</option>';
    html += '<option value="element"' + (collectionFilters.sort === 'element' ? ' selected' : '') + '>By Element</option>';
    html += '</select>';
    html += '<input type="text" id="collection-search" placeholder="Search..." value="' + (collectionFilters.search || '') + '" style="padding:2px 6px; border-radius:4px; border:1px solid #444; background:#222; color:#ccc; font-size:11px; width:100px;" />';
    html += '</div>';

    filterBar.innerHTML = html;

    // Bind filter buttons
    var filterBtns = filterBar.querySelectorAll('.filter-btn');
    for (var fb = 0; fb < filterBtns.length; fb++) {
        filterBtns[fb].addEventListener('click', function() {
            var filterType = this.getAttribute('data-filter');
            var value = this.getAttribute('data-value');
            if (filterType === 'tier' && value !== 'all') {
                collectionFilters[filterType] = parseInt(value);
            } else {
                collectionFilters[filterType] = value;
            }
            applyCollectionFilters();
        });
    }

    // Bind sort
    var sortSel = document.getElementById('collection-sort');
    if (sortSel) {
        sortSel.addEventListener('change', function() {
            collectionFilters.sort = this.value;
            applyCollectionFilters();
        });
    }

    // Bind search
    var searchInput = document.getElementById('collection-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            collectionFilters.search = this.value;
            applyCollectionFilters();
        });
    }

    applyCollectionFilters();
}

function applyCollectionFilters() {
    var filtered = SHOP_POOL_KEYS.filter(function(key) {
        var unit = UNIT_TEMPLATES[key];
        if (!unit) return false;

        if (collectionFilters.element !== 'all' && unit.element !== collectionFilters.element) return false;
        if (collectionFilters.type !== 'all' && unit.type !== collectionFilters.type) return false;
        if (collectionFilters.archetype !== 'all' && unit.archetype !== collectionFilters.archetype) return false;
        if (collectionFilters.tier !== 'all' && unit.cost !== collectionFilters.tier) return false;
        if (collectionFilters.search && unit.name.toLowerCase().indexOf(collectionFilters.search.toLowerCase()) === -1) return false;

        return true;
    });

    // Sort
    if (collectionFilters.sort === 'tier') {
        filtered.sort(function(a, b) {
            return (UNIT_TEMPLATES[a].cost || 0) - (UNIT_TEMPLATES[b].cost || 0);
        });
    } else if (collectionFilters.sort === 'name') {
        filtered.sort(function(a, b) {
            return UNIT_TEMPLATES[a].name.localeCompare(UNIT_TEMPLATES[b].name);
        });
    } else if (collectionFilters.sort === 'element') {
        filtered.sort(function(a, b) {
            return UNIT_TEMPLATES[a].element.localeCompare(UNIT_TEMPLATES[b].element);
        });
    }

    renderCollectionGrid(filtered);
}

function renderCollectionGrid(unitKeys) {
    var sd = getSaveData();
    var container = document.getElementById('roster-grid');
    container.innerHTML = '';

    for (var i = 0; i < unitKeys.length; i++) {
        var key = unitKeys[i];
        var template = UNIT_TEMPLATES[key];
        if (!template) continue;
        var collectionEntry = sd.collection[key] || null;
        var owned = !!collectionEntry;
        var stars = owned ? collectionEntry.stars : 0;
        var copies = owned ? collectionEntry.copiesForNext : 0;
        var nextStarCopies = getCopiesPerStar(key);
        var copiesProgress = owned ? Math.min(100, (copies / nextStarCopies) * 100) : 0;

        var div = document.createElement('div');
        div.className = 'roster-card cost-' + template.cost;
        div.setAttribute('data-unit-key', key);
        if (!owned) {
            div.style.opacity = '0.4';
        }

        var hasEvolvedForm = !!EVOLUTIONS[key];

        var starSpan = '';
        for (var s = 0; s < stars; s++) starSpan += '⭐';
        if (stars === 0) starSpan = '<span style="color:#555;">☆</span>';

        var statMult = getStarMultiplier(Math.max(1, stars));
        var scaledHP = Math.floor(template.hp * statMult);
        var scaledATK = Math.floor(template.attack * statMult);

        // Ability description
        var abilityHtml = '';
        var abilityInfo = ABILITY_DATA ? ABILITY_DATA[key] : null;
        if (abilityInfo) {
            var abilDesc = abilityInfo.desc || '';
            if (abilDesc.length > 60) abilDesc = abilDesc.substring(0, 57) + '...';
            abilityHtml = '<div style="font-size:10px; color:#8bbcff; margin-top:2px; line-height:1.3;">⚡ ' + abilityInfo.name + '</div>' +
                '<div style="font-size:9px; color:#777; line-height:1.2;">' + abilDesc + '</div>';
        }

        var html =
            '<div class="r-stars">' + starSpan + '</div>' +
            '<div>' + getElementEmoji(template.element) + ' ' + ARCHETYPES[template.archetype].emoji + '</div>' +
            '<div class="r-name">' + template.name + '</div>' +
            '<div class="r-info">' + template.type.charAt(0).toUpperCase() + template.type.slice(1) + ' · Cost ' + template.cost + '</div>' +
            '<div class="r-info" style="color:#ccc;">HP: ' + scaledHP + ' · ATK: ' + scaledATK + '</div>' +
            abilityHtml;

        if (owned) {
            html += '<div class="r-copies" style="margin-top:2px;">' +
                '<div style="background:#333; border-radius:3px; height:4px; width:100%; overflow:hidden;">' +
                '<div style="background:#e2b714; height:100%; width:' + copiesProgress + '%;"></div>' +
                '</div>' +
                '<span style="font-size:10px; color:#888;">' + copies + ' / ' + nextStarCopies + ' copies</span>' +
                '</div>';

            if (canStarUp(sd, key)) {
                html += '<button class="star-up-btn" data-key="' + key + '" style="margin-top:2px;">⬆ Star Up!</button>';
            }
            if (copies > 0) {
                html += '<button class="sell-btn" data-key="' + key + '" data-copies="' + copies + '" style="margin-top:2px;">💰 Sell (' + copies + ')</button>';
            }
        } else {
            html += '<div style="font-size:10px; color:#555; margin-top:4px;">Not collected</div>';
        }

        if (hasEvolvedForm) {
            html += '<div style="font-size:10px; color:#e2b714; margin-top:2px;">✨ Can Evolve</div>';
        }

        div.innerHTML = html;
        div.style.cursor = 'pointer';
        div.onclick = (function(k) {
            return function() { showUnitDetail(k, 'roster'); };
        })(key);

        container.appendChild(div);
    }

    // Re-bind star-up and sell buttons
    var starBtns = container.querySelectorAll('.star-up-btn');
    for (var sb = 0; sb < starBtns.length; sb++) {
        starBtns[sb].addEventListener('click', function(e) {
            e.stopPropagation();
            var k = this.getAttribute('data-key');
            starUpUnit(getSaveData(), k);
            applyCollectionFilters();
            renderTopBar();
        });
    }

    var sellBtns = container.querySelectorAll('.sell-btn');
    for (var slb = 0; slb < sellBtns.length; slb++) {
        sellBtns[slb].addEventListener('click', function(e) {
            e.stopPropagation();
            var k = this.getAttribute('data-key');
            showSellPanel(k);
        });
    }

    // Update stats line
    var statsEl = document.getElementById('roster-stats');
    if (statsEl) {
        var ownedCount = 0;
        var evolvedCount = 0;
        var cKeys = Object.keys(sd.collection);
        for (var ci = 0; ci < cKeys.length; ci++) {
            if (EVOLVED_TEMPLATES[cKeys[ci]]) evolvedCount++;
            else ownedCount++;
        }
        statsEl.textContent = 'Collected: ' + ownedCount + ' / ' + SHOP_POOL_KEYS.length + ' units' +
            (evolvedCount > 0 ? ' · ' + evolvedCount + ' evolved' : '') +
            ' · Showing ' + unitKeys.length + ' units';
    }
}

// ---- Shop Display (Prompt 20 Phase A4) ----

function renderShopUI() {
    var sd = getSaveData();
    var container = document.getElementById('gacha-shop');
    if (!container) return;

    // Initialize shop if empty
    if (!currentShopUnits || currentShopUnits.length === 0) {
        refreshShopUnits(sd.player.level);
    }

    container.innerHTML = '';

    var shopHeader = document.createElement('div');
    shopHeader.style.cssText = 'width:100%; display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; padding-bottom:6px; border-bottom:1px solid #2a3a5e;';
    shopHeader.innerHTML =
        '<span style="color:#aaa; font-size:13px; font-weight:bold;">Shop</span>' +
        '<button id="shop-refresh-btn" style="padding:4px 12px; border-radius:6px; border:1px solid #444; background:#222; color:#ccc; cursor:pointer; font-size:11px; transition:background 0.15s;">🔄 Refresh (' + SHOP_REFRESH_COST + ' VE)</button>';
    container.appendChild(shopHeader);

    for (var i = 0; i < 5; i++) {
        var unitKey = currentShopUnits[i];

        if (!unitKey) {
            var soldCard = document.createElement('div');
            soldCard.className = 'gacha-card';
            soldCard.style.cssText += 'opacity:0.3; border-style:dashed;';
            soldCard.innerHTML = '<div style="color:#555; font-size:12px; padding:20px 0;">Sold</div>';
            container.appendChild(soldCard);
            continue;
        }

        var tmpl = UNIT_TEMPLATES[unitKey];
        if (!tmpl) continue;

        var goldCost = UNIT_COSTS[tmpl.cost] || 30;
        var tierStars = '';
        for (var ts = 0; ts < tmpl.cost; ts++) tierStars += '★';
        var canAfford = sd.player.veilEssence >= goldCost;

        var card = document.createElement('div');
        card.className = 'gacha-card cost-' + tmpl.cost;
        card.style.cursor = canAfford ? 'pointer' : 'default';
        card.innerHTML =
            '<div class="card-element-icon">' + getElementEmoji(tmpl.element) + '</div>' +
            '<div class="card-unit-name">' + tmpl.name + '</div>' +
            '<div class="card-tier-stars">' + tierStars + '</div>' +
            '<div class="card-archetype">' + ARCHETYPES[tmpl.archetype].emoji + ' ' + ARCHETYPES[tmpl.archetype].name + '</div>' +
            '<button class="shop-buy-btn" data-slot="' + i + '" data-key="' + unitKey + '" data-cost="' + goldCost + '" style="margin-top:6px; padding:3px 12px; border-radius:6px; border:none; background:' + (canAfford ? '#2e7d32' : '#333') + '; color:' + (canAfford ? '#fff' : '#666') + '; cursor:' + (canAfford ? 'pointer' : 'default') + '; font-size:11px; font-weight:bold; transition:background 0.15s;"' + (canAfford ? '' : ' disabled') + '>' +
            'Buy ' + goldCost + ' VE</button>';

        container.appendChild(card);
    }

    // Bind buy buttons
    var buyBtns = container.querySelectorAll('.shop-buy-btn');
    for (var b = 0; b < buyBtns.length; b++) {
        buyBtns[b].addEventListener('click', function(e) {
            e.stopPropagation();
            var slot = parseInt(this.getAttribute('data-slot'));
            var key = this.getAttribute('data-key');
            var result = buyUnit(sd, key, slot);
            if (result.success) {
                renderShopUI();
                renderTopBar();
            }
        });
    }

    // Bind refresh button
    var refreshBtn = document.getElementById('shop-refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            var result = refreshShop(sd);
            if (result.success) {
                renderShopUI();
                renderTopBar();
            }
        });
    }
}

// ---- Team Board Drag & Drop Enhancement (Prompt 20 Phase C3) ----

function initTeamBoardDragDrop() {
    var slots = document.querySelectorAll('#team-board .board-cell');
    for (var i = 0; i < slots.length; i++) {
        (function(slot) {
            slot.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                slot.classList.add('drag-over');
            });

            slot.addEventListener('dragleave', function() {
                slot.classList.remove('drag-over');
            });

            slot.addEventListener('drop', function(e) {
                e.preventDefault();
                slot.classList.remove('drag-over');

                var unitKey = e.dataTransfer.getData('unitKey');
                if (!unitKey) return;

                var row = parseInt(slot.getAttribute('data-row'));
                var col = parseInt(slot.getAttribute('data-col'));
                var sd = getSaveData();

                var result = addToTeam(sd, unitKey, row, col);
                if (result.success) {
                    renderTeamBuilderScreen();
                }
            });
        })(slots[i]);
    }

    // Make roster items draggable
    var rosterItems = document.querySelectorAll('.team-roster-item');
    for (var ri = 0; ri < rosterItems.length; ri++) {
        rosterItems[ri].draggable = true;
        (function(item) {
            item.addEventListener('dragstart', function(e) {
                var key = item.getAttribute('data-key');
                if (key) {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('unitKey', key);
                }
            });
        })(rosterItems[ri]);
    }
}

// ---- Synergy Sidebar Update (Prompt 20 Phase C4) ----

function updateSynergySidebar() {
    var sd = getSaveData();
    var el = document.getElementById('team-synergy-preview');
    if (!el) return;

    var team = getActiveTeam(sd);
    var elementCounts = {};
    var archetypeCounts = {};

    for (var i = 0; i < team.slots.length; i++) {
        var slot = team.slots[i];
        var unit = UNIT_TEMPLATES[slot.key] || EVOLVED_TEMPLATES[slot.key];
        if (!unit) continue;

        var isEvolved = !!EVOLVED_TEMPLATES[slot.key];

        // Element counting: evolved T5 counts as 2 (prismatic)
        var elementCount = 1;
        if (isEvolved && (unit.baseCost === 5 || unit.cost === 5)) {
            elementCount = 2;
        }
        elementCounts[unit.element] = (elementCounts[unit.element] || 0) + elementCount;

        // Archetype counting (with ascension-aware contribution)
        if (typeof getUnitArchetypeContribution === 'function') {
            var fakeUnit = { key: slot.key, evolved: isEvolved, archetype: unit.archetype, ascensionTier: slot.ascensionTier || null };
            var contrib = getUnitArchetypeContribution(fakeUnit);
            archetypeCounts[contrib.primary] = (archetypeCounts[contrib.primary] || 0) + contrib.primaryCount;
            if (contrib.secondary && contrib.secondaryCount > 0) {
                archetypeCounts[contrib.secondary] = (archetypeCounts[contrib.secondary] || 0) + contrib.secondaryCount;
            }
        } else {
            archetypeCounts[unit.archetype] = (archetypeCounts[unit.archetype] || 0) + 1;
        }
    }

    if (team.slots.length === 0) {
        el.innerHTML = '<span class="text-muted">Select units to see synergies</span>';
        return;
    }

    var html = '<div style="font-weight:bold; margin-bottom:4px;">Active Synergies</div>';

    // Elements section
    html += '<div style="margin-bottom:6px;"><div style="color:#888; font-size:11px; margin-bottom:2px;">Elements</div>';
    var allElements = Object.keys(ELEMENTS);
    for (var ei = 0; ei < allElements.length; ei++) {
        var elem = allElements[ei];
        var count = elementCounts[elem] || 0;
        if (count === 0) continue;

        var elemSyn = ELEMENT_SYNERGIES[elem];
        var activeClass = count >= 2 ? ' style="color:#e2b714;"' : '';

        html += '<div' + activeClass + '>';
        html += getElementEmoji(elem) + ' ' + ELEMENTS[elem].name + ': ' + count;

        // Show threshold markers
        if (elemSyn && elemSyn.thresholds) {
            html += ' <span style="font-size:10px; color:#666;">';
            for (var t = 0; t < elemSyn.thresholds.length; t++) {
                var threshold = elemSyn.thresholds[t];
                var lit = count >= threshold;
                html += '<span style="color:' + (lit ? '#e2b714' : '#444') + ';">[' + threshold + ']</span> ';
            }
            html += '</span>';
        }
        html += '</div>';
    }
    html += '</div>';

    // Archetypes section
    html += '<div><div style="color:#888; font-size:11px; margin-bottom:2px;">Archetypes</div>';
    var allArchetypes = Object.keys(ARCHETYPES);
    for (var ai = 0; ai < allArchetypes.length; ai++) {
        var arch = allArchetypes[ai];
        var aCount = archetypeCounts[arch] || 0;
        if (aCount === 0) continue;

        var archData = ARCHETYPES[arch];
        var aActiveClass = '';
        if (archData && archData.thresholds && archData.thresholds.length > 0 && aCount >= archData.thresholds[0]) {
            aActiveClass = ' style="color:#e2b714;"';
        }

        html += '<div' + aActiveClass + '>';
        html += archData.emoji + ' ' + archData.name + ': ' + aCount;

        if (archData && archData.thresholds) {
            html += ' <span style="font-size:10px; color:#666;">';
            for (var at = 0; at < archData.thresholds.length; at++) {
                var aThreshold = archData.thresholds[at];
                var aLit = aCount >= aThreshold;
                html += '<span style="color:' + (aLit ? '#e2b714' : '#444') + ';">[' + aThreshold + ']</span> ';
            }
            html += '</span>';
        }
        html += '</div>';
    }
    html += '</div>';

    el.innerHTML = html;
}

// ---- Unit Detail Panel Enhancement (Prompt 20 Phase C5) ----

function showUnitDetailPanel(unitKey) {
    var template = UNIT_TEMPLATES[unitKey] || EVOLVED_TEMPLATES[unitKey];
    if (!template) return;

    var sd = getSaveData();
    var collectionEntry = sd.collection[unitKey] || null;
    var owned = !!collectionEntry;
    var stars = owned ? collectionEntry.stars : 0;
    var copies = owned ? collectionEntry.copiesForNext : 0;
    var nextStarCopies = getCopiesPerStar(unitKey);
    var progress = owned ? Math.min(100, (copies / nextStarCopies) * 100) : 0;
    var isEvolved = !!EVOLVED_TEMPLATES[unitKey];

    var statMult = getStarMultiplier(Math.max(1, stars));

    var passive = null;
    if (PASSIVE_DATA && template.passive) {
        passive = PASSIVE_DATA[template.passive];
    }
    var ability = null;
    if (ABILITY_DATA && template.ability) {
        ability = ABILITY_DATA[template.ability];
    }

    var starSpan = '';
    for (var i = 0; i < stars; i++) starSpan += '★';
    if (!starSpan) starSpan = '☆';

    var html = '';
    html += '<div style="text-align:center; margin-bottom:8px;">';
    html += '<div style="font-size:24px;">' + getElementEmoji(template.element) + '</div>';
    html += '<div style="font-size:16px; font-weight:bold;">' + template.name + '</div>';
    html += '<div style="color:#e2b714;">' + starSpan + '</div>';
    html += '<div style="font-size:12px; color:#888;">' + getElementEmoji(template.element) + ' ' + ELEMENTS[template.element].name + ' · ' + ARCHETYPES[template.archetype].emoji + ' ' + ARCHETYPES[template.archetype].name + '</div>';
    if (isEvolved) html += '<div style="color:#e2b714; font-size:11px;">✨ Evolved Form</div>';
    html += '</div>';

    // Stats grid
    html += '<div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:4px; margin-bottom:8px; text-align:center; font-size:11px;">';
    html += '<div><div style="color:#888;">HP</div><div>' + Math.floor(template.hp * statMult) + '</div></div>';
    html += '<div><div style="color:#888;">ATK</div><div>' + Math.floor(template.attack * statMult) + '</div></div>';
    html += '<div><div style="color:#888;">AtkSpd</div><div>' + template.attackSpd + '</div></div>';
    html += '<div><div style="color:#888;">Range</div><div>' + template.range + '</div></div>';
    html += '<div><div style="color:#888;">MoveSpd</div><div>' + template.moveSpd + '</div></div>';
    html += '</div>';

    // Passive
    if (passive) {
        html += '<div style="margin-bottom:6px; padding:6px; background:#1a2a1a; border-radius:4px; font-size:12px;">';
        html += '<div style="font-weight:bold; color:#66bb6a;">Passive: ' + passive.name + '</div>';
        html += '<div style="color:#aaa;">' + (passive.description || passive.desc || 'No description') + '</div>';
        html += '</div>';
    }

    // Ability
    if (ability) {
        html += '<div style="margin-bottom:6px; padding:6px; background:#2a1a2a; border-radius:4px; font-size:12px;">';
        html += '<div style="font-weight:bold; color:#ce93d8;">Ability: ' + ability.name + '</div>';
        html += '<div style="color:#aaa;">' + (ability.description || ability.desc || 'No description') + '</div>';
        html += '</div>';
    }

    // Evolution section
    var evo = EVOLUTIONS[unitKey];
    if (evo) {
        var evolvedTmpl = EVOLVED_TEMPLATES[evo.evolved];
        html += '<div style="margin-bottom:6px; padding:6px; background:#2a2a1a; border-radius:4px; font-size:12px;">';
        html += '<div style="font-weight:bold; color:#e2b714;">✨ Evolved Form: ' + (evolvedTmpl ? evolvedTmpl.name : evo.evolved) + '</div>';
        html += '<div style="color:#aaa;">Requires: ' + (evo.essences || '?') + ' essences + 3★</div>';
        html += '</div>';
    }

    // Star-up progress
    if (owned) {
        html += '<div style="margin-top:6px;">';
        html += '<div style="font-size:12px; font-weight:bold;">Star Progress</div>';
        html += '<div style="background:#333; border-radius:3px; height:6px; width:100%; overflow:hidden; margin:4px 0;">';
        html += '<div style="background:#e2b714; height:100%; width:' + progress + '%;"></div>';
        html += '</div>';
        html += '<span style="font-size:11px; color:#888;">' + copies + ' / ' + nextStarCopies + ' copies</span>';
        html += '</div>';
    }

    // Use existing unit detail overlay
    var overlay = document.getElementById('unit-detail-overlay');
    document.getElementById('unit-detail-content').innerHTML = html;
    overlay.style.display = 'flex';
}

// ---- In-Combat Synergy Sidebars (Prompt 20 Phase D1) ----

function initCombatSynergySidebars(playerTeam, enemyTeam) {
    var playerSynergies = calculateTeamSynergies(playerTeam);
    var enemySynergies = calculateTeamSynergies(enemyTeam);

    renderCombatSynergySidebar('left', playerSynergies, 'Player');
    renderCombatSynergySidebar('right', enemySynergies, 'Enemy');
}

function calculateTeamSynergies(team) {
    var elementCounts = {};
    var archetypeCounts = {};

    for (var i = 0; i < team.length; i++) {
        var unit = team[i];
        if (!unit || unit.hp <= 0) continue;
        elementCounts[unit.element] = (elementCounts[unit.element] || 0) + 1;

        // Ascension-aware archetype counting
        if (typeof getUnitArchetypeContribution === 'function') {
            var contrib = getUnitArchetypeContribution(unit);
            archetypeCounts[contrib.primary] = (archetypeCounts[contrib.primary] || 0) + contrib.primaryCount;
            if (contrib.secondary && contrib.secondaryCount > 0) {
                archetypeCounts[contrib.secondary] = (archetypeCounts[contrib.secondary] || 0) + contrib.secondaryCount;
            }
        } else {
            archetypeCounts[unit.archetype] = (archetypeCounts[unit.archetype] || 0) + 1;
        }
    }

    return { elements: elementCounts, archetypes: archetypeCounts };
}

function renderCombatSynergySidebar(side, synergies, label) {
    var containerId = 'synergy-sidebar-' + side;
    var container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.cssText = 'font-size:10px; padding:4px; background:#16213e; border-radius:4px; min-width:80px;';
        var combatMain = document.getElementById('combat-main');
        if (combatMain) {
            if (side === 'left') {
                combatMain.insertBefore(container, combatMain.firstChild);
            } else {
                combatMain.appendChild(container);
            }
        }
    }

    container.innerHTML = '<div style="font-weight:bold; color:#888; margin-bottom:2px;">' + label + '</div>';

    // Elements
    var allElements = Object.keys(ELEMENTS);
    for (var ei = 0; ei < allElements.length; ei++) {
        var element = allElements[ei];
        var count = synergies.elements[element] || 0;
        if (count === 0) continue;

        var item = document.createElement('div');
        item.style.cssText = 'padding:1px 0;' + (count >= 2 ? ' color:#e2b714;' : ' color:#666;');

        var thresholdMarkers = '';
        var thresholds = [2, 4, 7, 10];
        for (var t = 0; t < thresholds.length; t++) {
            var lit = count >= thresholds[t];
            thresholdMarkers += '<span style="color:' + (lit ? '#e2b714' : '#333') + ';">●</span>';
        }

        item.innerHTML = getElementEmoji(element) + count + ' ' + thresholdMarkers;
        container.appendChild(item);
    }

    // Archetypes
    var allArchetypes = Object.keys(ARCHETYPES);
    for (var ai = 0; ai < allArchetypes.length; ai++) {
        var archetype = allArchetypes[ai];
        var aCount = synergies.archetypes[archetype] || 0;
        if (aCount === 0) continue;

        var aItem = document.createElement('div');
        var archData = ARCHETYPES[archetype];
        var isActive = archData && archData.thresholds && archData.thresholds.length > 0 && aCount >= archData.thresholds[0];
        aItem.style.cssText = 'padding:1px 0;' + (isActive ? ' color:#e2b714;' : ' color:#666;');
        aItem.textContent = archData.emoji + ' ' + aCount;
        container.appendChild(aItem);
    }
}

// ---- Combat Unit Tooltips (Prompt 20 Phase D2) ----

function initCombatUnitTooltips() {
    var unitCells = document.querySelectorAll('#combat-board .combat-cell');
    for (var i = 0; i < unitCells.length; i++) {
        (function(cell) {
            cell.addEventListener('mouseenter', function(e) {
                var unitData = cell._unitData;
                if (!unitData) return;

                var tooltip = document.createElement('div');
                tooltip.className = 'unit-combat-tooltip';
                tooltip.style.cssText = 'position:fixed; background:#16213e; border:1px solid #444; border-radius:6px; padding:8px; font-size:11px; z-index:100; pointer-events:none; max-width:200px;';

                var buffsHTML = '';
                if (unitData.buffs && unitData.buffs.length > 0) {
                    for (var b = 0; b < unitData.buffs.length; b++) {
                        buffsHTML += '<div style="color:#66bb6a;">' + unitData.buffs[b] + '</div>';
                    }
                }

                tooltip.innerHTML =
                    '<div style="font-weight:bold;">' + unitData.name + '</div>' +
                    '<div>HP: ' + Math.floor(unitData.hp) + ' / ' + unitData.maxHp + '</div>' +
                    '<div>ATK: ' + unitData.attack + '</div>' +
                    '<div>' + getElementEmoji(unitData.element) + ' ' + unitData.element + '</div>' +
                    (buffsHTML || '<div style="color:#555;">No active buffs</div>');

                document.body.appendChild(tooltip);

                var rect = cell.getBoundingClientRect();
                tooltip.style.left = (rect.right + 10) + 'px';
                tooltip.style.top = (rect.top) + 'px';

                cell._tooltip = tooltip;
            });

            cell.addEventListener('mouseleave', function() {
                if (cell._tooltip) {
                    cell._tooltip.remove();
                    cell._tooltip = null;
                }
            });
        })(unitCells[i]);
    }
}

// ---- Combat Log Enhancement (Prompt 20 Phase D3) ----

function logCombatAction(actionType, details) {
    var logContainer = document.getElementById('combat-log');
    if (!logContainer) return;

    var message = '';
    var color = '';

    if (actionType === 'passive-trigger') {
        message = details.unit + '\'s ' + details.passive + ' deals ' + details.damage + ' bonus!';
        color = getElementColor(details.element);
    } else if (actionType === 'ability-trigger') {
        message = details.unit + '\'s ' + details.ability + ' activates!';
        color = '#FFD700';
    } else if (actionType === 'attack') {
        message = details.attacker + ' attacks ' + details.defender + ' for ' + details.damage + ' damage';
        color = '#ccc';
    } else if (actionType === 'death') {
        message = details.unit + ' has been defeated!';
        color = '#ff4444';
    } else if (actionType === 'synergy') {
        message = details.name + ' synergy activated! (' + details.count + ')';
        color = '#e2b714';
    } else {
        message = details.message || actionType;
        color = '#888';
    }

    var entry = document.createElement('div');
    entry.style.cssText = 'font-size:11px; padding:1px 4px; color:' + color + ';';
    entry.textContent = message;
    logContainer.appendChild(entry);

    // Auto-scroll
    logContainer.scrollTop = logContainer.scrollHeight;

    // Limit log entries to prevent memory issues
    while (logContainer.children.length > 200) {
        logContainer.removeChild(logContainer.firstChild);
    }
}

// ---- Settings: Fresh Start Button (Prompt 20 Phase E4) ----

function addResetButton() {
    var settingsPanel = document.getElementById('settings-panel');
    if (!settingsPanel) return;

    var resetSection = document.createElement('div');
    resetSection.style.cssText = 'margin-top:16px; padding:8px; border:1px solid #663333; border-radius:6px;';
    resetSection.innerHTML =
        '<div style="font-weight:bold; color:#ff4444; margin-bottom:4px;">Danger Zone</div>' +
        '<button id="reset-to-v4-btn" style="padding:4px 12px; border-radius:4px; border:1px solid #663333; background:#3a1a1a; color:#ff6644; cursor:pointer; font-size:12px;">Reset to V4 (Delete Save)</button>';

    settingsPanel.appendChild(resetSection);

    document.getElementById('reset-to-v4-btn').addEventListener('click', function() {
        if (confirm('This will delete your current save and start fresh with the new 60-unit roster. Continue?')) {
            localStorage.removeItem(SAVE_KEY);
            location.reload();
        }
    });
}

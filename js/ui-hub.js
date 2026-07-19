// ui-hub.js -- hub/camp screen, buildings, upgrade panels (split from ui-v2.js)

// ---- Hub Screen: Camp Backdrop (Prompt 77, Phase 6.2) ----
// Reuses the arena-backdrop CSS "recipe family" js/ui-combat.js's
// buildArenaBackdrop() already established (same .arena-bd-horizon/
// .arena-bd-hexfield/.arena-bd-blob/.arena-bd-vignette layers combat and the
// team builder use) painted with a night-camp/gold theme into a dedicated
// #hub-camp-backdrop element -- combat's own ARENA_BACKDROP_THEMES table is
// untouched (this stays self-contained to ui-hub.js per the task's file
// scope). arenaBdHexPatternCss() (defined in js/ui-combat.js, which loads
// AFTER this file) is only ever called once the hub is actually rendered --
// by then every script has finished loading, so the forward reference is
// safe (same reasoning as any other cross-file function call in this
// codebase's plain-global-scope model).
var HUB_CAMP_THEME = { glow: '#1a2440', accent: '#e2b714', blobA: '#0f1730', blobB: '#141d3a', blobC: '#0a0f22' };

function buildHubCampBackdrop() {
    var el = document.getElementById('hub-camp-backdrop');
    // innerHTML starts out empty on a freshly-created element (both in a real
    // browser and in tests/harness.js's stub) -- using that as the
    // "already built" signal instead of a custom flag property avoids a trap
    // with the test harness's permissive element Proxy, where reading ANY
    // never-before-set custom property returns a (truthy) stub function
    // rather than undefined, which would make a boolean flag check always
    // look "already built" on the very first call.
    if (!el || el.innerHTML) return;
    var theme = HUB_CAMP_THEME;
    var hexCss = (typeof arenaBdHexPatternCss === 'function')
        ? arenaBdHexPatternCss(theme.accent)
        : ('repeating-linear-gradient(60deg, ' + theme.accent + '22 0px, ' + theme.accent + '22 1px, transparent 1px, transparent 42px), ' +
           'repeating-linear-gradient(-60deg, ' + theme.accent + '22 0px, ' + theme.accent + '22 1px, transparent 1px, transparent 42px)');
    el.innerHTML =
        '<div class="arena-bd-horizon" style="background:radial-gradient(ellipse 90% 60% at 50% 10%, ' + theme.glow + 'cc 0%, transparent 70%);"></div>' +
        '<div class="arena-bd-hexfield" style="background-image:' + hexCss + ';"></div>' +
        '<div class="arena-bd-blob arena-bd-blob-a" style="background:' + theme.blobA + ';"></div>' +
        '<div class="arena-bd-blob arena-bd-blob-b" style="background:' + theme.blobB + ';"></div>' +
        '<div class="arena-bd-blob arena-bd-blob-c" style="background:' + theme.blobC + ';"></div>' +
        '<div class="arena-bd-vignette"></div>';
}

// ---- Hub Screen: Settings Drawer (Prompt 77, Phase 6.2) ----
// Achievements/Stats/Reset relocated off the button grid into a slide-out
// drawer behind the top bar's gear icon (game-v2.html). No new behavior --
// each button still calls the exact same function (showAchievementPanel/
// showStatsPanel/uiResetGame) the old hub-nav buttons called.
function toggleHubSettingsDrawer(force) {
    var drawer = document.getElementById('hub-settings-drawer');
    var scrim = document.getElementById('hub-settings-scrim');
    if (!drawer || !scrim) return;
    var show = (typeof force === 'boolean') ? force : !(drawer.classList && drawer.classList.contains('show'));
    if (drawer.classList) drawer.classList.toggle('show', show);
    if (scrim.classList) scrim.classList.toggle('show', show);
}

// ---- Hub Screen: Building Cards ----
// Purely presentational size hint for the camp grid's dense/varied layout
// (game-v2.html's .hub-camp-grid uses grid-auto-flow:dense) -- does not
// affect upgrade/panel logic at all, only how large a building's card reads
// on the scene.
var HUB_CARD_SIZE = {
    attunement_rite: 'lg',
    echo_shaping: 'lg'
};

function renderHubScreen() {
    var sd = getSaveData();
    // Achievement catch-all check
    var newAch = checkAchievements(sd);
    if (newAch.length > 0) { autoSave(sd); showAchievementToasts(newAch); }

    buildHubCampBackdrop();

    var grid = document.getElementById('buildings-grid');
    grid.innerHTML = '';

    var bldKeys = Object.keys(BUILDINGS);
    for (var i = 0; i < bldKeys.length; i++) {
        var id = bldKeys[i];
        var bld = BUILDINGS[id];
        var level = getBuildingLevel(sd, id);
        var canUp = canUpgradeBuilding(sd, id);
        var cost = getBuildingUpgradeCost(id, level);
        var maxed = level >= bld.maxLevel;
        var sizeClass = 'hub-bld-' + (HUB_CARD_SIZE[id] || 'sm');

        // Check prereq locks (buildings have prereq.level in BUILDINGS)
        var prereqLocked = false;
        var prereqText = '';
        if (bld.prereq && bld.prereq.level && sd.player.level < bld.prereq.level) {
            prereqLocked = true;
            prereqText = 'Unlock at Player Level ' + bld.prereq.level;
        }

        var div = document.createElement('div');
        div.setAttribute('data-building', id);

        if (prereqLocked) {
            div.className = 'hub-building sv-panel ' + sizeClass + ' is-locked';
            div.setAttribute('data-tooltip', prereqText);
            div.innerHTML =
                '<div class="hub-bld-icon">' + bld.emoji + '</div>' +
                '<div class="hub-bld-name">' + bld.name + '</div>' +
                '<div class="hub-bld-lockline">🔒 Locked</div>';
            grid.appendChild(div);
            continue;
        }

        // Buildings with panels get click-to-open; all others get upgrade-on-click
        // (exactly the same routing as before the redesign -- only the card
        // markup/classes around it changed).
        var hasPanel = (id === 'deep_resonance' && level >= 1) ||
                       (id === 'echo_shaping' && level >= 1) ||
                       (id === 'prism_focus') ||
                       (id === 'veil_wellspring') ||
                       (id === 'kindred_circle');
        var clickable = hasPanel || canUp;

        var stateClass = maxed ? 'is-maxed' : (canUp ? 'is-upgradeable' : '');
        div.className = 'hub-building sv-panel ' + sizeClass +
            (clickable ? ' is-clickable' : '') +
            (stateClass ? ' ' + stateClass : '');

        var tooltip = getBuildingEffect(id, level) + (maxed ? ' (MAX)' : ' — ' + cost + ' VE to upgrade');
        div.setAttribute('data-tooltip', tooltip);

        var pips = '';
        for (var pi = 1; pi <= bld.maxLevel; pi++) {
            pips += '<span class="hub-bld-pip' + (pi <= level ? ' filled' : '') + '"></span>';
        }

        div.innerHTML =
            '<div class="hub-bld-icon">' + bld.emoji + '</div>' +
            '<div class="hub-bld-name">' + bld.name + '</div>' +
            '<div class="hub-bld-pips">' + pips + '</div>' +
            '<div class="hub-bld-level">Lv. ' + level + ' / ' + bld.maxLevel + '</div>';

        if (hasPanel) {
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

    renderEndlessChallengesNav(sd);
}

// Prompt 64: entry buttons for endless mode (The Abyss) + challenge modes.
// Shows lock state inline (both gated behind region boss clears) rather than
// hiding the buttons entirely, so players can see what they're working
// toward. The actual entry screens live in js/endless.js / js/challenges.js.
function renderEndlessChallengesNav(saveData) {
    var nav = document.getElementById('endless-challenges-nav');
    if (!nav) return;

    var endlessOn = (typeof isEndlessUnlocked === 'function') && isEndlessUnlocked(saveData);
    var challengesOn = (typeof isChallengesUnlocked === 'function') && isChallengesUnlocked(saveData);

    var endlessBest = (typeof getEndlessSaveData === 'function') ? getEndlessSaveData(saveData).bestFloor : 0;

    nav.innerHTML =
        '<div class="hub-beyond-btn' + (endlessOn ? '' : ' locked') + '" id="hub-endless-btn">' +
            '<span class="nav-emoji">🕳️</span> The Abyss' +
            (endlessOn ? '<div style="font-size:10px; color:var(--sv-gold);">Best: Floor ' + endlessBest + '</div>' : '<div style="font-size:10px; color:var(--sv-text-3);">🔒 Clear Region 8</div>') +
        '</div>' +
        '<div class="hub-beyond-btn' + (challengesOn ? '' : ' locked') + '" id="hub-challenges-btn">' +
            '<span class="nav-emoji">🏆</span> Challenges' +
            (challengesOn ? '' : '<div style="font-size:10px; color:var(--sv-text-3);">🔒 Clear Region 4 boss</div>') +
        '</div>';

    document.getElementById('hub-endless-btn').onclick = function() {
        if (typeof showEndlessScreen === 'function') showEndlessScreen();
    };
    document.getElementById('hub-challenges-btn').onclick = function() {
        if (typeof showChallengesScreen === 'function') showChallengesScreen();
    };
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

function openBuildingPanel(buildingId) {
    switch (buildingId) {
        case 'deep_resonance': showEvolutionLabPanel(); break;
        case 'echo_shaping': showForgePanel(); break;
        case 'prism_focus': showGemWorkshopPanel(); break;
        case 'veil_wellspring': showManaShrinePanel(); break;
        case 'kindred_circle': showBondHallPanel(); break;
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

// ---- Reset Game ----

function uiResetGame() {
    showConfirmDialog('This will erase all progress and start a new game. Are you sure?', function() {
        deleteSave();
        saveData = createDefaultSaveData();
        saveGame(saveData);
        showScreen('hub');
    });
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
        showConfirmDialog('This will delete your current save and start fresh with the new 60-unit roster. Continue?', function() {
            localStorage.removeItem(SAVE_KEY);
            location.reload();
        });
    });
}

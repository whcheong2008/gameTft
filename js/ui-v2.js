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

// ---- Top Bar ----

function renderTopBar() {
    var sd = getSaveData();
    document.getElementById('player-level').textContent = 'Lv. ' + sd.player.level;
    document.getElementById('player-gold').textContent = '💰 ' + sd.player.gold;

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
    var grid = document.getElementById('buildings-grid');
    grid.innerHTML = '';

    var bldKeys = Object.keys(BUILDINGS);
    for (var i = 0; i < bldKeys.length; i++) {
        var id = bldKeys[i];
        var bld = BUILDINGS[id];
        var level = getBuildingLevel(sd, id);
        var canUp = canUpgradeBuilding(sd, id);
        var cost = getBuildingUpgradeCost(id, level);

        // Gate barracks visibility to level 10+
        var barracksLocked = (id === 'barracks' && sd.player.level < 10);

        var div = document.createElement('div');
        div.className = 'hub-building';
        div.setAttribute('data-building', id);

        if (barracksLocked) {
            div.style.opacity = '0.5';
            div.innerHTML =
                '<div class="emoji">' + bld.emoji + '</div>' +
                '<div class="bld-name">' + bld.name + '</div>' +
                '<div class="bld-level" style="color:#888;">Locked</div>' +
                '<div class="bld-effect" style="color:#666;">Unlock at Player Level 10</div>' +
                '<div class="mt-sm text-muted" style="font-size:11px;">Increases team size beyond 7</div>';
            grid.appendChild(div);
            continue;
        }

        var costText = level >= bld.maxLevel ? 'MAX' : (cost + 'g to upgrade');

        div.innerHTML =
            '<div class="emoji">' + bld.emoji + '</div>' +
            '<div class="bld-name">' + bld.name + '</div>' +
            '<div class="bld-level">Level ' + level + ' / ' + bld.maxLevel + '</div>' +
            '<div class="bld-effect">' + getBuildingEffect(id, level) + '</div>' +
            '<div class="mt-sm text-muted" style="font-size:11px;">' + costText + '</div>';

        if (id === 'evolution_lab' && level >= 1) {
            div.onclick = (function() {
                return function() { showEvolutionLabPanel(); };
            })();
            div.style.cursor = 'pointer';
        } else if (id === 'forge' && level >= 1) {
            div.onclick = (function() {
                return function() { showForgePanel(); };
            })();
            div.style.cursor = 'pointer';
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
    if (upgradeBuilding(sd, buildingId)) {
        renderHubScreen();
        renderTopBar();
    }
}

// ---- Evolution Lab Panel ----

function showEvolutionLabPanel() {
    var sd = getSaveData();
    var labLevel = getBuildingLevel(sd, 'evolution_lab');

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
    html += '<div style="font-size:12px; color:#aaa;">Level ' + labLevel + ' · ' + getBuildingEffect('evolution_lab', labLevel) + '</div>';
    html += '</div>';

    // Upgrade button if not max
    var canUp = canUpgradeBuilding(sd, 'evolution_lab');
    var upCost = getBuildingUpgradeCost('evolution_lab', labLevel);
    if (labLevel < BUILDINGS.evolution_lab.maxLevel) {
        html += '<div style="margin-bottom:16px;">';
        html += '<button id="evo-lab-upgrade" style="padding:6px 14px; background:' + (canUp ? '#e2b714' : '#444') + '; color:' + (canUp ? '#000' : '#888') + '; border:none; border-radius:6px; cursor:' + (canUp ? 'pointer' : 'default') + '; font-size:12px;"' + (canUp ? '' : ' disabled') + '>';
        html += 'Upgrade to Level ' + (labLevel + 1) + ' (' + upCost + 'g)';
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
                html += '<div style="font-size:11px; color:#e2b714; margin-top:1px;">Cost: ' + goldCost + 'g</div>';
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
            var canDoEvo = check2.canEvolve && sd.player.gold >= goldCost2;
            html += '<button class="evo-btn" data-base-key="' + baseKey + '" style="padding:5px 12px; background:' + (canDoEvo ? '#e2b714' : '#333') + '; color:' + (canDoEvo ? '#000' : '#666') + '; border:none; border-radius:6px; cursor:' + (canDoEvo ? 'pointer' : 'default') + '; font-size:12px; font-weight:bold;"' + (canDoEvo ? '' : ' disabled') + '>';
            if (!check2.canEvolve) {
                html += 'Requirements Not Met';
            } else if (sd.player.gold < goldCost2) {
                html += 'Need ' + goldCost2 + 'g';
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
            if (upgradeBuilding(sd2, 'evolution_lab')) {
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
    var forgeLevel = getBuildingLevel(sd, 'forge');

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
    html += '<div style="font-size:12px; color:#aaa;">Level ' + forgeLevel + ' · ' + getBuildingEffect('forge', forgeLevel) + '</div>';
    html += '</div>';

    // Upgrade button if not max
    var canUp = canUpgradeBuilding(sd, 'forge');
    var upCost = getBuildingUpgradeCost('forge', forgeLevel);
    if (forgeLevel < BUILDINGS.forge.maxLevel) {
        html += '<div style="margin-bottom:12px;">';
        html += '<button id="forge-upgrade" style="padding:6px 14px; background:' + (canUp ? '#e2b714' : '#444') + '; color:' + (canUp ? '#000' : '#888') + '; border:none; border-radius:6px; cursor:' + (canUp ? 'pointer' : 'default') + '; font-size:12px;"' + (canUp ? '' : ' disabled') + '>';
        html += 'Upgrade to Level ' + (forgeLevel + 1) + ' (' + upCost + 'g)';
        html += '</button></div>';
    }

    // Essence display
    html += '<div style="margin-bottom:12px; padding:8px; background:#111; border-radius:6px; font-size:13px;">';
    html += '<strong>Essences:</strong> ';
    var essElements = ['fire', 'water', 'earth', 'wind'];
    for (var ei = 0; ei < essElements.length; ei++) {
        var eKey = essElements[ei];
        var eCount = (sd.items.essences && sd.items.essences[eKey]) || 0;
        html += ESSENCES[eKey].emoji + '×' + eCount;
        if (ei < 3) html += '  ';
    }
    html += '</div>';

    // Status message
    html += '<div id="forge-status" style="margin-bottom:10px; font-size:13px; min-height:20px;"></div>';

    // Tabs
    html += '<div id="forge-tabs" style="display:flex; gap:4px; margin-bottom:12px; flex-wrap:wrap;">';
    var tabNames = ['Reroll', 'Disassemble', 'Transmute', 'Set Craft', 'Advanced'];
    var tabMinLevels = [1, 2, 3, 4, 5];
    for (var ti = 0; ti < tabNames.length; ti++) {
        var unlocked = forgeLevel >= tabMinLevels[ti];
        html += '<button class="forge-tab" data-tab="' + ti + '" style="padding:5px 12px; font-size:12px; border:1px solid ' + (unlocked ? '#555' : '#333') + '; background:' + (ti === 0 && unlocked ? '#333' : '#1a1a2e') + '; color:' + (unlocked ? '#fff' : '#555') + '; border-radius:4px; cursor:' + (unlocked ? 'pointer' : 'default') + ';"' + (unlocked ? '' : ' disabled') + '>' + tabNames[ti] + (unlocked ? '' : ' 🔒') + '</button>';
    }
    html += '</div>';

    // Tab content
    html += '<div id="forge-content">';
    html += renderForgeTabContent(sd, 0, forgeLevel);
    html += '</div>';

    html += '<div style="text-align:center; margin-top:16px;">';
    html += '<button id="forge-close" style="padding:8px 20px; background:#333; color:#fff; border:none; border-radius:6px; cursor:pointer;">Close</button>';
    html += '</div>';
    html += '</div>';

    overlay.innerHTML = html;
    overlay.style.display = 'flex';

    // Bind close
    document.getElementById('forge-close').onclick = function() { overlay.style.display = 'none'; };

    // Bind upgrade
    var upBtn = document.getElementById('forge-upgrade');
    if (upBtn && canUp) {
        upBtn.onclick = function() {
            var sd2 = getSaveData();
            if (upgradeBuilding(sd2, 'forge')) {
                renderTopBar();
                showForgePanel();
            }
        };
    }

    // Bind tabs
    bindForgeTabs();
    bindForgeActions();
}

function bindForgeTabs() {
    var tabs = document.querySelectorAll('.forge-tab');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].addEventListener('click', function() {
            var tabIndex = parseInt(this.getAttribute('data-tab'));
            var sd = getSaveData();
            var forgeLevel = getBuildingLevel(sd, 'forge');
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
    var bench = getBenchItems(sd);
    var html = '';

    if (tabIndex === 0 && forgeLevel >= 1) {
        // Reroll Rarity
        html += '<div style="font-size:14px; font-weight:bold; margin-bottom:8px;">Reroll Component Rarity</div>';
        var components = [];
        for (var i = 0; i < bench.length; i++) {
            if (bench[i].type === 'component' && !bench[i].equipped) components.push(bench[i]);
        }
        if (components.length === 0) {
            html += '<div style="color:#666; font-size:12px;">No unequipped components on bench</div>';
        }
        for (var ci = 0; ci < components.length; ci++) {
            var c = components[ci];
            var cost = REROLL_COSTS[c.rarity] || 10;
            var canAfford = sd.player.gold >= cost;
            html += '<div style="display:flex; align-items:center; justify-content:space-between; padding:6px 10px; margin-bottom:4px; background:#16213e; border-radius:6px; border:1px solid ' + getItemRarityColor(c) + ';">';
            html += '<div>' + getItemEmoji(c) + ' ' + getItemName(c) + ' <span style="color:' + getItemRarityColor(c) + ';">' + getItemRarityName(c) + '</span></div>';
            html += '<button class="forge-reroll" data-item-id="' + c.id + '" style="padding:3px 10px; font-size:11px; background:' + (canAfford ? '#e2b714' : '#333') + '; color:' + (canAfford ? '#000' : '#666') + '; border:none; border-radius:4px; cursor:' + (canAfford ? 'pointer' : 'default') + ';"' + (canAfford ? '' : ' disabled') + '>REROLL ' + cost + 'g</button>';
            html += '</div>';
        }
    } else if (tabIndex === 1 && forgeLevel >= 2) {
        // Disassemble
        html += '<div style="font-size:14px; font-weight:bold; margin-bottom:8px;">Disassemble Combined Items</div>';
        var combined = [];
        for (var di = 0; di < bench.length; di++) {
            if (bench[di].type === 'combined' && !bench[di].equipped) combined.push(bench[di]);
        }
        if (combined.length === 0) {
            html += '<div style="color:#666; font-size:12px;">No unequipped combined items on bench</div>';
        }
        for (var dj = 0; dj < combined.length; dj++) {
            var d = combined[dj];
            var recipe = ITEM_RECIPES[d.key];
            var canDisasm = sd.player.gold >= 15 && bench.length < getItemBenchSize(sd);
            html += '<div style="display:flex; align-items:center; justify-content:space-between; padding:6px 10px; margin-bottom:4px; background:#16213e; border-radius:6px; border:1px solid ' + getItemRarityColor(d) + ';">';
            html += '<div>' + getItemEmoji(d) + ' ' + getItemName(d);
            if (recipe) html += ' <span style="color:#888; font-size:11px;">→ ' + (ITEM_COMPONENTS[recipe.components[0]] ? ITEM_COMPONENTS[recipe.components[0]].emoji : '') + ' + ' + (ITEM_COMPONENTS[recipe.components[1]] ? ITEM_COMPONENTS[recipe.components[1]].emoji : '') + '</span>';
            html += '</div>';
            html += '<button class="forge-disasm" data-item-id="' + d.id + '" style="padding:3px 10px; font-size:11px; background:' + (canDisasm ? '#e2b714' : '#333') + '; color:' + (canDisasm ? '#000' : '#666') + '; border:none; border-radius:4px; cursor:' + (canDisasm ? 'pointer' : 'default') + ';"' + (canDisasm ? '' : ' disabled') + '>DISASSEMBLE 15g</button>';
            html += '</div>';
        }
    } else if (tabIndex === 2 && forgeLevel >= 3) {
        // Transmute
        html += '<div style="font-size:14px; font-weight:bold; margin-bottom:8px;">Transmute Component Type</div>';
        var comps = [];
        for (var ti = 0; ti < bench.length; ti++) {
            if (bench[ti].type === 'component' && !bench[ti].equipped) comps.push(bench[ti]);
        }
        if (comps.length === 0) {
            html += '<div style="color:#666; font-size:12px;">No unequipped components on bench</div>';
        }
        for (var tj = 0; tj < comps.length; tj++) {
            var tc = comps[tj];
            var canTrans = sd.player.gold >= 25;
            html += '<div style="padding:6px 10px; margin-bottom:4px; background:#16213e; border-radius:6px; border:1px solid ' + getItemRarityColor(tc) + ';">';
            html += '<div style="margin-bottom:4px;">' + getItemEmoji(tc) + ' ' + getItemName(tc) + ' <span style="color:' + getItemRarityColor(tc) + ';">' + getItemRarityName(tc) + '</span></div>';
            html += '<div style="display:flex; flex-wrap:wrap; gap:3px;">';
            var compKeys = Object.keys(ITEM_COMPONENTS);
            for (var ck = 0; ck < compKeys.length; ck++) {
                if (compKeys[ck] === tc.key) continue;
                var comp = ITEM_COMPONENTS[compKeys[ck]];
                html += '<button class="forge-transmute" data-item-id="' + tc.id + '" data-target="' + compKeys[ck] + '" style="padding:2px 6px; font-size:10px; background:' + (canTrans ? '#2a2a4e' : '#222') + '; color:' + (canTrans ? '#ccc' : '#555') + '; border:1px solid #444; border-radius:3px; cursor:' + (canTrans ? 'pointer' : 'default') + ';"' + (canTrans ? '' : ' disabled') + '>' + comp.emoji + ' ' + comp.name + '</button>';
            }
            html += '</div>';
            html += '<div style="font-size:10px; color:#888; margin-top:2px;">25g each · keeps rarity</div>';
            html += '</div>';
        }
    } else if (tabIndex === 3 && forgeLevel >= 4) {
        // Set Crafting
        html += '<div style="font-size:14px; font-weight:bold; margin-bottom:8px;">Set Item Crafting (50g + Essence + Combined Item)</div>';
        var setGroups = { fire: [], water: [], earth: [], wind: [] };
        var setKeys = Object.keys(SET_ITEM_RECIPES);
        for (var sk = 0; sk < setKeys.length; sk++) {
            var sr = SET_ITEM_RECIPES[setKeys[sk]];
            setGroups[sr.essenceElement].push({ key: setKeys[sk], recipe: sr });
        }
        var elemOrder = ['fire', 'water', 'earth', 'wind'];
        for (var eg = 0; eg < elemOrder.length; eg++) {
            var elem = elemOrder[eg];
            var group = setGroups[elem];
            var setInfo = null;
            for (var sg = 0; sg < group.length; sg++) {
                if (!setInfo) setInfo = ITEM_SETS[group[sg].recipe.setId];
            }
            html += '<div style="margin-bottom:8px;">';
            html += '<div style="font-size:13px; font-weight:bold; color:' + ESSENCES[elem].color + '; margin-bottom:4px;">' + (setInfo ? setInfo.emoji + ' ' + setInfo.name : elem) + '</div>';
            for (var si = 0; si < group.length; si++) {
                var setRecipe = group[si].recipe;
                var hasBase = false;
                for (var bi = 0; bi < bench.length; bi++) {
                    if (bench[bi].type === 'combined' && bench[bi].key === setRecipe.baseCombined && !bench[bi].equipped) { hasBase = true; break; }
                }
                var hasEssence = sd.items.essences && (sd.items.essences[elem] || 0) >= 1;
                var hasGold = sd.player.gold >= 50;
                var canCraft = hasBase && hasEssence && hasGold;
                var baseName = ITEM_RECIPES[setRecipe.baseCombined] ? ITEM_RECIPES[setRecipe.baseCombined].name : setRecipe.baseCombined;
                html += '<div style="display:flex; align-items:center; justify-content:space-between; padding:5px 10px; margin-bottom:3px; background:' + (canCraft ? '#1a2a1e' : '#16213e') + '; border-radius:5px; border:1px solid #333;">';
                html += '<div style="font-size:12px;">' + setRecipe.emoji + ' <strong>' + setRecipe.name + '</strong> <span style="color:#888; font-size:10px;">(' + baseName + ' + ' + ESSENCES[elem].emoji + ')</span></div>';
                html += '<button class="forge-set-craft" data-recipe="' + group[si].key + '" style="padding:3px 10px; font-size:11px; background:' + (canCraft ? '#44aa44' : '#333') + '; color:' + (canCraft ? '#fff' : '#666') + '; border:none; border-radius:4px; cursor:' + (canCraft ? 'pointer' : 'default') + ';"' + (canCraft ? '' : ' disabled') + '>CRAFT 50g</button>';
                html += '</div>';
            }
            html += '</div>';
        }
    } else if (tabIndex === 4 && forgeLevel >= 5) {
        // Advanced Crafting (Ability Items)
        html += '<div style="font-size:14px; font-weight:bold; margin-bottom:8px;">Ability Item Crafting (100g + 2 Combined Items)</div>';
        var abilityKeys = Object.keys(ABILITY_ITEMS);
        for (var ai = 0; ai < abilityKeys.length; ai++) {
            var aKey = abilityKeys[ai];
            var aRecipe = ABILITY_ITEMS[aKey];
            if (!aRecipe.craftFrom) continue;
            var hasAll = true;
            var usedIds = {};
            for (var ac = 0; ac < aRecipe.craftFrom.length; ac++) {
                var needed = aRecipe.craftFrom[ac];
                var found = false;
                for (var abi = 0; abi < bench.length; abi++) {
                    if (bench[abi].type === 'combined' && bench[abi].key === needed && !bench[abi].equipped && !usedIds[bench[abi].id]) {
                        usedIds[bench[abi].id] = true;
                        found = true;
                        break;
                    }
                }
                if (!found) hasAll = false;
            }
            var canCraftA = hasAll && sd.player.gold >= 100;
            var ingredientNames = [];
            for (var an = 0; an < aRecipe.craftFrom.length; an++) {
                ingredientNames.push(ITEM_RECIPES[aRecipe.craftFrom[an]] ? ITEM_RECIPES[aRecipe.craftFrom[an]].name : aRecipe.craftFrom[an]);
            }
            var evolvedBadge = aRecipe.requiresEvolved ? ' <span style="color:#e2b714; font-size:10px;">⚡ Evolved Only</span>' : '';
            html += '<div style="display:flex; align-items:center; justify-content:space-between; padding:6px 10px; margin-bottom:4px; background:' + (canCraftA ? '#2a2a1e' : '#16213e') + '; border-radius:6px; border:1px solid ' + (aRecipe.requiresEvolved ? '#e2b714' : '#555') + ';">';
            html += '<div style="flex:1;">';
            html += '<div style="font-size:12px;">' + aRecipe.emoji + ' <strong>' + aRecipe.name + '</strong>' + evolvedBadge + '</div>';
            html += '<div style="font-size:10px; color:#888;">' + ingredientNames.join(' + ') + '</div>';
            if (aRecipe.ability) html += '<div style="font-size:10px; color:#8bbcff;">' + aRecipe.ability.desc + '</div>';
            html += '</div>';
            html += '<button class="forge-ability-craft" data-recipe="' + aKey + '" style="padding:3px 10px; font-size:11px; background:' + (canCraftA ? '#e2b714' : '#333') + '; color:' + (canCraftA ? '#000' : '#666') + '; border:none; border-radius:4px; cursor:' + (canCraftA ? 'pointer' : 'default') + ';"' + (canCraftA ? '' : ' disabled') + '>CRAFT 100g</button>';
            html += '</div>';
        }
    } else {
        html += '<div style="color:#666; font-size:12px;">Upgrade the Forge to unlock this feature.</div>';
    }

    return html;
}

function bindForgeActions() {
    // Reroll
    var rerollBtns = document.querySelectorAll('.forge-reroll');
    for (var i = 0; i < rerollBtns.length; i++) {
        rerollBtns[i].addEventListener('click', function() {
            var sd = getSaveData();
            var result = forgeRerollRarity(sd, this.getAttribute('data-item-id'));
            var statusEl = document.getElementById('forge-status');
            if (result.success) {
                var oldColor = ITEM_RARITIES[result.oldRarity] ? ITEM_RARITIES[result.oldRarity].color : '#aaa';
                var newColor = ITEM_RARITIES[result.newRarity] ? ITEM_RARITIES[result.newRarity].color : '#aaa';
                statusEl.innerHTML = '<span style="color:#6bcb77;">Rerolled: <span style="color:' + oldColor + ';">' + result.oldRarity + '</span> → <span style="color:' + newColor + ';">' + result.newRarity + '</span> (-' + result.cost + 'g)</span>';
            } else {
                statusEl.innerHTML = '<span style="color:#ff6666;">' + result.reason + '</span>';
            }
            renderTopBar();
            showForgePanel();
        });
    }

    // Disassemble
    var disasmBtns = document.querySelectorAll('.forge-disasm');
    for (var di = 0; di < disasmBtns.length; di++) {
        disasmBtns[di].addEventListener('click', function() {
            var sd = getSaveData();
            var result = forgeDisassemble(sd, this.getAttribute('data-item-id'));
            var statusEl = document.getElementById('forge-status');
            if (result.success) {
                statusEl.innerHTML = '<span style="color:#6bcb77;">Disassembled into ' + getItemEmoji(result.comp1) + ' + ' + getItemEmoji(result.comp2) + '</span>';
            } else {
                statusEl.innerHTML = '<span style="color:#ff6666;">' + result.reason + '</span>';
            }
            renderTopBar();
            showForgePanel();
        });
    }

    // Transmute
    var transmuteBtns = document.querySelectorAll('.forge-transmute');
    for (var ti = 0; ti < transmuteBtns.length; ti++) {
        transmuteBtns[ti].addEventListener('click', function() {
            var sd = getSaveData();
            var result = forgeTransmute(sd, this.getAttribute('data-item-id'), this.getAttribute('data-target'));
            var statusEl = document.getElementById('forge-status');
            if (result.success) {
                var oldComp = ITEM_COMPONENTS[result.oldKey];
                var newComp = ITEM_COMPONENTS[result.newKey];
                statusEl.innerHTML = '<span style="color:#6bcb77;">Transmuted: ' + (oldComp ? oldComp.emoji + ' ' + oldComp.name : result.oldKey) + ' → ' + (newComp ? newComp.emoji + ' ' + newComp.name : result.newKey) + '</span>';
            } else {
                statusEl.innerHTML = '<span style="color:#ff6666;">' + result.reason + '</span>';
            }
            renderTopBar();
            showForgePanel();
        });
    }

    // Set Craft
    var setCraftBtns = document.querySelectorAll('.forge-set-craft');
    for (var si = 0; si < setCraftBtns.length; si++) {
        setCraftBtns[si].addEventListener('click', function() {
            var sd = getSaveData();
            var result = forgeCraftSetItem(sd, this.getAttribute('data-recipe'));
            var statusEl = document.getElementById('forge-status');
            if (result.success) {
                var setRecipe = SET_ITEM_RECIPES[result.item.key];
                statusEl.innerHTML = '<span style="color:#6bcb77;">Crafted ' + (setRecipe ? setRecipe.emoji + ' ' + setRecipe.name : 'Set Item') + '!</span>';
            } else {
                statusEl.innerHTML = '<span style="color:#ff6666;">' + result.reason + '</span>';
            }
            renderTopBar();
            showForgePanel();
        });
    }

    // Ability Craft
    var abilityCraftBtns = document.querySelectorAll('.forge-ability-craft');
    for (var ai = 0; ai < abilityCraftBtns.length; ai++) {
        abilityCraftBtns[ai].addEventListener('click', function() {
            var sd = getSaveData();
            var result = forgeCraftAbilityItem(sd, this.getAttribute('data-recipe'));
            var statusEl = document.getElementById('forge-status');
            if (result.success) {
                var abilityDef = ABILITY_ITEMS[result.item.key];
                statusEl.innerHTML = '<span style="color:#6bcb77;">Crafted ' + (abilityDef ? abilityDef.emoji + ' ' + abilityDef.name : 'Ability Item') + '!</span>';
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
    document.getElementById('btn-roll-1').disabled = sd.player.gold < ROLL_COST;
    var btn10 = document.getElementById('btn-roll-10');
    btn10.disabled = sd.player.gold < multiCost;

    // Show discounted cost on multi-roll button
    if (multiCost < MULTI_ROLL_COST) {
        btn10.textContent = 'Roll x10 (' + multiCost + 'g, was ' + MULTI_ROLL_COST + 'g)';
    } else {
        btn10.textContent = 'Roll x10 (' + MULTI_ROLL_COST + 'g)';
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

    var container = document.getElementById('gacha-results');
    container.innerHTML = '';
    container.appendChild(createGachaCard(result.unitKey, result.unitTemplate));

    renderGachaScreen();
    renderTopBar();
}

function uiDoMultiRoll() {
    var sd = getSaveData();
    var result = doMultiRoll(sd);
    if (!result.success) return;

    var container = document.getElementById('gacha-results');
    container.innerHTML = '';
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

    var div = document.createElement('div');
    div.className = 'gacha-card cost-' + unitCost + (isNew ? ' new-unit' : '') + (isEvolved ? ' evolved-card' : '');
    if (isEvolved) {
        div.style.border = '2px solid #e2b714';
        div.style.boxShadow = '0 0 8px rgba(226,183,20,0.4)';
    }
    var typeLabel = tmpl.type.charAt(0).toUpperCase() + tmpl.type.slice(1);
    div.innerHTML =
        (isEvolved ? '<div style="font-size:10px; color:#e2b714; font-weight:bold;">✨ Evolved Copy!</div>' : '') +
        '<div class="unit-element">' + ELEMENTS[tmpl.element].emoji + ' ' + ARCHETYPES[tmpl.archetype].emoji + '</div>' +
        '<div class="unit-name">' + tmpl.name + '</div>' +
        '<div style="font-size:10px; color:#aaa;">' + typeLabel + '</div>' +
        '<div class="unit-cost">Cost ' + unitCost + '</div>' +
        (isNew ? '<div class="text-green" style="font-size:10px;">NEW!</div>' : '');
    return div;
}

// ---- Roster Screen ----

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
        var goldValue = getSellGoldValue(unitKey, sellCount);
        overlay.innerHTML =
            '<div class="sell-panel">' +
                '<div class="sell-title">Sell ' + tmpl.name + ' Copies</div>' +
                '<div class="sell-info">Available: ' + maxCopies + ' copies</div>' +
                '<div class="sell-amount">' +
                    '<button class="sell-amt-btn" data-amt="1">1</button>' +
                    '<button class="sell-amt-btn" data-amt="5">5</button>' +
                    '<button class="sell-amt-btn" data-amt="' + maxCopies + '">All (' + maxCopies + ')</button>' +
                '</div>' +
                '<div class="sell-preview">Selling ' + sellCount + ' → 💰 ' + goldValue + 'g</div>' +
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

function renderTeamBuilderScreen() {
    var sd = getSaveData();
    var roster = getRoster(sd);
    var team = getActiveTeam(sd);
    var maxSize = getMaxTeamSize(sd);

    document.getElementById('team-info').textContent =
        'Team: ' + team.slots.length + ' / ' + maxSize + ' units';

    // Render roster panel
    var panel = document.getElementById('team-roster-panel');
    panel.innerHTML = '<div class="section-title">Available Units</div>';

    for (var i = 0; i < roster.length; i++) {
        var r = roster[i];
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

        div.innerHTML =
            '<span class="unit-info-btn" data-info-key="' + r.key + '" style="cursor:pointer; float:right; font-size:14px; padding:2px 4px; opacity:0.7;">ℹ️</span>' +
            (r.isEvolved ? '<span style="color:#e2b714; font-size:10px;">✨</span> ' : '') +
            ELEMENTS[r.template.element].emoji + ' ' + ARCHETYPES[r.template.archetype].emoji + ' ' +
            '<strong>' + r.template.name + '</strong> ' + starsStr +
            (onTeam ? ' <span class="text-green">✓</span>' : '') +
            '<div style="font-size:10px; color:#999; margin-top:2px;">' +
                rTypeLabel + ' · HP:' + rHP + ' · ATK:' + rATK +
            '</div>';

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
            e.stopPropagation(); // Don't trigger the parent click
            var key = this.getAttribute('data-info-key');
            showUnitDetail(key, 'team-builder');
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
                cell.innerHTML = '<div class="cell-unit">' +
                    ELEMENTS[tmpl.element].emoji + '<br>' +
                    tmpl.name.split(' ')[0] +
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

// ---- Mission Select Screen ----

function renderMissionSelectScreen() {
    var sd = getSaveData();
    var available = getAvailableStoryMissions(sd);

    var storyEl = document.getElementById('story-missions');
    storyEl.innerHTML = '';

    for (var i = 0; i < STORY_MISSIONS.length; i++) {
        var m = STORY_MISSIONS[i];
        var info = null;
        for (var a = 0; a < available.length; a++) {
            if (available[a].index === i) { info = available[a]; break; }
        }

        var div = document.createElement('div');
        var locked = sd.player.level < m.requiredLevel;
        var completed = info && info.completed;

        div.className = 'mission-card' + (locked ? ' locked' : '') + (completed ? ' completed' : '');

        var starsHtml = '';
        if (info && info.bestStars > 0) {
            for (var s = 0; s < 3; s++) {
                starsHtml += s < info.bestStars ? '⭐' : '☆';
            }
        }

        // War Room intel
        var intelHtml = '';
        var intelLevel = getWarRoomIntelLevel(sd);
        if (!locked && intelLevel >= 1) {
            intelHtml = '<div class="m-intel" style="font-size:11px; color:#8bbcff; margin-top:4px;">';
            for (var wi = 0; wi < m.waves.length; wi++) {
                var wc = m.waves[wi];
                if (intelLevel === 1) {
                    intelHtml += 'Wave ' + (wi + 1) + ': ' + wc.count + ' enemies';
                } else if (intelLevel === 2) {
                    var biasInfo2 = '';
                    if (wc.elementBias) {
                        var elemData2 = ELEMENTS[wc.elementBias];
                        if (elemData2) biasInfo2 += ' ' + elemData2.emoji + ' ' + elemData2.name + '-aligned';
                    }
                    intelHtml += 'Wave ' + (wi + 1) + ': ' + wc.count + ' units (budget ' + wc.budget + ', max cost ' + wc.maxCost + ')' + biasInfo2;
                } else if (intelLevel >= 3) {
                    // Show eligible unit pool for this wave
                    var eligible = [];
                    for (var ek = 0; ek < SHOP_POOL_KEYS.length; ek++) {
                        var eKey = SHOP_POOL_KEYS[ek];
                        var eTmpl = UNIT_TEMPLATES[eKey];
                        if (eTmpl && eTmpl.cost <= wc.maxCost) {
                            eligible.push(ELEMENTS[eTmpl.element].emoji + ' ' + eTmpl.name + ' (C' + eTmpl.cost + ')');
                        }
                    }
                    var biasInfo3 = '';
                    if (wc.elementBias) {
                        var elemData3 = ELEMENTS[wc.elementBias];
                        if (elemData3) biasInfo3 += ' ' + elemData3.emoji + elemData3.name + '-aligned';
                    }
                    if (wc.synergyBias) {
                        var archData3 = ARCHETYPES[wc.synergyBias];
                        if (archData3) biasInfo3 += ' ' + archData3.emoji + archData3.name + '-focused';
                    }
                    var warnInfo = '';
                    if (wc.enemySynergies) warnInfo += ' ⚠️ Enemy synergies active';
                    if (wc.enemyEvolutions) warnInfo += ' ⚠️ Enemy evolutions possible';
                    intelHtml += 'Wave ' + (wi + 1) + ': ' + wc.count + ' units, budget ' + wc.budget + biasInfo3 + warnInfo + ', pool: ' + eligible.join(', ');
                }
                if (wi < m.waves.length - 1) intelHtml += '<br>';
            }
            intelHtml += '</div>';
        }

        div.innerHTML =
            '<div>' +
                '<div class="m-name">' + m.name + (locked ? ' 🔒' : '') + '</div>' +
                '<div class="m-desc">' + m.description + '</div>' +
                '<div class="m-reward">Reward: ' + m.rewards.gold + 'g · ' + m.rewards.xp + ' XP · ' +
                    (m.boss ? '👑 Boss Fight' : m.waves.length + ' wave' + (m.waves.length > 1 ? 's' : '')) + '</div>' +
                intelHtml +
            '</div>' +
            '<div>' +
                '<div class="m-stars">' + starsHtml + '</div>' +
                (locked ? '<div class="text-muted" style="font-size:11px;">Requires Lv.' + m.requiredLevel + '</div>' : '') +
            '</div>';

        if (!locked) {
            div.onclick = (function(idx) {
                return function() { uiStartStoryMission(idx); };
            })(i);
        }

        storyEl.appendChild(div);
    }
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

    // Place enemies on the enemy rows (rows 4-7)
    placeEnemiesOnBoard(enemies);

    // Init combat
    initCombat(gs);

    // Clean up unit layer for fresh rendering
    var prevUnitLayer = document.getElementById('combat-unit-layer');
    if (prevUnitLayer) prevUnitLayer.remove();

    // Render synergy bar
    renderCombatSynergyBar();

    // Render initial board so player can see positions
    renderCombatBoard();

    // Show start overlay instead of immediately starting combat
    document.getElementById('combat-start-overlay').className = 'combat-start-overlay show';
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
        if (stars >= 3) starMult = 2.0;
        else if (stars >= 2) starMult = 1.5;
        var baseGold = Math.floor(activeMission.rewards.gold * starMult);
        var baseXP = Math.floor(activeMission.rewards.xp * starMult);
        var goldMult = getGoldMultiplier(sd);
        var xpMult = getXPMultiplier(sd);

        var goldBonusText = '';
        if (goldMult > 1.0) {
            goldBonusText = ' (+' + Math.round((goldMult - 1) * 100) + '% from Warehouse)';
        }
        var xpBonusText = '';
        if (xpMult > 1.0) {
            xpBonusText = ' (+' + Math.round((xpMult - 1) * 100) + '% from Training Ground)';
        }

        var rewardHtml =
            '<span class="text-gold">+' + rewards.gold + ' Gold' + goldBonusText + '</span> · ' +
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

        // Show item drops
        if (rewards.itemDrops && rewards.itemDrops.length > 0) {
            rewardHtml += '<br><span style="font-size:13px; color:#e2b714;">Items found:</span> ';
            for (var ii = 0; ii < rewards.itemDrops.length; ii++) {
                var drop = rewards.itemDrops[ii];
                var dropColor = getItemRarityColor(drop);
                rewardHtml += '<span style="font-size:12px;">' + getItemEmoji(drop) + ' ' + getItemName(drop) +
                    ' (<span style="color:' + dropColor + ';">' + getItemRarityName(drop) + '</span>)</span>';
                if (ii < rewards.itemDrops.length - 1) rewardHtml += ' · ';
            }
        }

        // Show essence drops
        if (rewards.essenceDrops && rewards.essenceDrops.length > 0) {
            rewardHtml += '<br><span style="font-size:13px; color:#aa44ff;">Essences found:</span> ';
            for (var eid = 0; eid < rewards.essenceDrops.length; eid++) {
                var essKey = rewards.essenceDrops[eid];
                var essData = ESSENCES[essKey];
                rewardHtml += '<span style="font-size:12px; color:' + (essData ? essData.color : '#fff') + ';">' + (essData ? essData.emoji + ' ' + essData.name : essKey) + '</span>';
                if (eid < rewards.essenceDrops.length - 1) rewardHtml += ' · ';
            }
        }

        // Show milestone reward
        if (rewards.milestoneItem) {
            var mItemDef = ABILITY_ITEMS[rewards.milestoneItem.key];
            rewardHtml += '<br><span style="font-size:14px; color:#e2b714; font-weight:bold;">🏆 Milestone Reward: ' + (mItemDef ? mItemDef.emoji + ' ' + mItemDef.name : 'Ability Item') + '!</span>';
        }

        document.getElementById('results-rewards').innerHTML = rewardHtml;

        var leveled = applyMissionRewards(sd, rewards);
        if (leveled) {
            document.getElementById('results-rewards').innerHTML +=
                '<br><span class="text-green" style="font-size:20px;">LEVEL UP!</span>';
        }
        if (rewards.itemsBenchFull) {
            document.getElementById('results-rewards').innerHTML +=
                '<br><span style="color:#ff8844; font-size:12px;">⚠️ Item bench full! Clear space to collect more items.</span>';
        }

        // Mark story mission complete
        if (pendingMissionIsStory && pendingMissionIndex >= 0) {
            completeStoryMission(sd, pendingMissionIndex, stars);
        }
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
    var boardW = boardEl.offsetWidth;
    var boardH = boardEl.offsetHeight;
    var cellW = boardW / 7;
    var cellH = boardH / 8;

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

    // Render unit overlays in a separate container
    var unitLayer = document.getElementById('combat-unit-layer');
    if (!unitLayer) {
        unitLayer = document.createElement('div');
        unitLayer.id = 'combat-unit-layer';
        unitLayer.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;';
        boardEl.parentNode.insertBefore(unitLayer, boardEl.nextSibling);
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

        // Position with transition
        var targetX = unit.gridCol * cellW;
        var targetY = unit.gridRow * cellH;

        // Boss: span 2x2
        if (unit.isBoss) {
            el.style.width = (cellW * 2) + 'px';
            el.style.height = (cellH * 2) + 'px';
        } else {
            el.style.width = cellW + 'px';
            el.style.height = cellH + 'px';
        }

        el.style.left = targetX + 'px';
        el.style.top = targetY + 'px';

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

    var html = '';

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
            html += '<span style="background:#2a3a5e; padding:2px 6px; border-radius:4px; white-space:nowrap;">' +
                arch.emoji + ' ' + count + '</span>';
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
        var bgColor = isPrismatic ? '#5a4a2e' : '#2a3a5e';
        html += '<span style="background:' + bgColor + '; padding:2px 6px; border-radius:4px; white-space:nowrap; color:' + (elemSyn.color || '#fff') + ';">' +
            elemSyn.emoji + ' ' + eCount + '</span>';
    }

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
    var bench = getBenchItems(sd);

    var benchSize = getItemBenchSize(sd);
    var info = document.getElementById('item-bench-info');
    info.textContent = 'Items: ' + bench.length + ' / ' + benchSize;

    var grid = document.getElementById('item-bench-grid');
    grid.innerHTML = '';

    // Show unequipped items first, then equipped
    var unequipped = [];
    var equipped = [];
    for (var i = 0; i < bench.length; i++) {
        if (bench[i].equipped) equipped.push(bench[i]);
        else unequipped.push(bench[i]);
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
        if (nameStr.length > 10) nameStr = nameStr.substring(0, 9) + '..';

        // Type badges for special items
        var typeBadge = '';
        if (item.type === 'set') {
            var setRecipe = SET_ITEM_RECIPES[item.key];
            var setDef = setRecipe ? ITEM_SETS[setRecipe.setId] : null;
            typeBadge = '<div style="position:absolute; top:1px; right:1px; font-size:8px;">' + (setDef ? setDef.emoji : '') + '</div>';
            div.style.borderColor = '#e2b714';
        } else if (item.type === 'ability') {
            var abDef = ABILITY_ITEMS[item.key];
            typeBadge = '<div style="position:absolute; top:1px; right:1px; font-size:8px;">' + (abDef && abDef.requiresEvolved ? '⚡' : '⭐') + '</div>';
            div.style.borderColor = '#e2b714';
            div.style.borderWidth = '2px';
        }

        div.innerHTML = typeBadge + '<div style="font-size:16px;">' + emoji + '</div>' +
            '<div style="font-size:9px; color:' + rarityColor + ';">' + getItemRarityName(item) + '</div>' +
            '<div style="font-size:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + nameStr + '</div>' +
            (isEquipped ? '<div style="font-size:8px; color:#6bcb77;">Equipped</div>' : '');

        div.onclick = (function(itemObj) {
            return function() { uiSelectBenchItem(itemObj); };
        })(item);

        grid.appendChild(div);
    }

    // Fill empty slots using dynamic size
    var empty = benchSize - bench.length;
    for (var e = 0; e < empty; e++) {
        var emptyDiv = document.createElement('div');
        emptyDiv.style.cssText = 'background:#111; border:1px dashed #333; border-radius:6px; padding:6px; text-align:center; min-height:40px;';
        emptyDiv.innerHTML = '<div style="font-size:10px; color:#444;">Empty</div>';
        grid.appendChild(emptyDiv);
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
    html += '<div style="color:#ccc; margin-top:4px;">' + getItemStatDescription(item) + '</div>';

    if (item.type === 'component') {
        // Show possible recipes
        var recipes = getRecipesForComponent(item.key);
        if (recipes.length > 0) {
            html += '<div style="margin-top:6px; color:#888;">Recipes:</div>';
            for (var i = 0; i < recipes.length; i++) {
                var r = recipes[i].recipe;
                var otherComp = r.components[0] === item.key ? r.components[1] : r.components[0];
                var otherName = ITEM_COMPONENTS[otherComp] ? ITEM_COMPONENTS[otherComp].name : otherComp;
                html += '<div style="font-size:11px; color:#8bbcff;">' + r.emoji + ' ' + r.name + ' (+ ' + otherName + ')</div>';
            }
        }
    } else if (item.type === 'set') {
        var setRecipe = SET_ITEM_RECIPES[item.key];
        var setDef = setRecipe ? ITEM_SETS[setRecipe.setId] : null;
        if (setDef) {
            html += '<div style="margin-top:6px; color:' + ESSENCES[setDef.element].color + '; font-size:12px;">' + setDef.emoji + ' ' + setDef.name + '</div>';
            for (var sb = 0; sb < setDef.bonuses.length; sb++) {
                html += '<div style="font-size:10px; color:#aaa;">' + setDef.thresholds[sb] + '-piece: ' + setDef.bonuses[sb].desc + '</div>';
            }
        }
    } else if (item.type === 'ability') {
        var abilityDef = ABILITY_ITEMS[item.key];
        if (abilityDef) {
            if (abilityDef.requiresEvolved) {
                html += '<div style="margin-top:4px; color:#e2b714; font-size:11px;">⚡ Can only be equipped on evolved units</div>';
            }
            if (abilityDef.ability && abilityDef.ability.desc) {
                html += '<div style="margin-top:4px; color:#8bbcff; font-size:11px;">✨ ' + abilityDef.ability.desc + '</div>';
            }
        }
    }

    if (item.equipped) {
        var eqUnitName = UNIT_TEMPLATES[item.equipped.unitKey] ? UNIT_TEMPLATES[item.equipped.unitKey].name : (EVOLVED_TEMPLATES[item.equipped.unitKey] ? EVOLVED_TEMPLATES[item.equipped.unitKey].name : item.equipped.unitKey);
        html += '<div style="margin-top:6px; color:#6bcb77;">Equipped on: ' + eqUnitName + '</div>';
        if (item.type === 'component') {
            html += '<button onclick="uiUnequipItem(\'' + item.id + '\')" style="margin-top:4px; font-size:11px; padding:2px 8px; background:#553333; color:#fff; border:1px solid #884444; border-radius:4px; cursor:pointer;">Unequip</button>';
        } else {
            html += '<div style="font-size:10px; color:#888; margin-top:4px;">This item cannot be unequipped</div>';
        }
    } else {
        html += '<div style="margin-top:6px; font-size:11px; color:#e2b714;">Go to Team Builder to equip this item</div>';
    }

    // If item is NOT equipped, show sell button
    if (!item.equipped) {
        var sellValue = getItemSellValue(item);
        html += '<button onclick="uiSellItem(\'' + item.id + '\')" ' +
            'style="margin-top:6px; font-size:11px; padding:4px 12px; background:#553322; color:#e2b714; ' +
            'border:1px solid #886633; border-radius:4px; cursor:pointer;">' +
            '💰 Sell for ' + sellValue + 'g</button>';
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

    var html = '<div style="font-size:12px; color:#888; margin-bottom:4px;">🎒 Item Bench (' +
        unequipped.length + ' available, ' + bench.length + '/' + getItemBenchSize(sd) + ' total)' + sellModeHtml + '</div>';
    html += '<div style="display:flex; flex-wrap:wrap; gap:4px;">';

    for (var j = 0; j < unequipped.length; j++) {
        var item = unequipped[j];
        var rarityColor = getItemRarityColor(item);
        var isSelected = equipModeItemId === item.id;
        html += '<div data-equip-item="' + item.id + '" style="background:#1a1a2e; border:2px solid ' + rarityColor + '; border-radius:4px; padding:3px 6px; cursor:pointer; font-size:12px;' +
            (isSelected ? ' box-shadow:0 0 8px ' + rarityColor + '; background:#2a2a4e;' : '') +
            '" title="' + getItemName(item) + ' (' + getItemRarityName(item) + ')\n' + getItemStatDescription(item) + '\nSell: ' + getItemSellValue(item) + 'g">' +
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
                    html += '<div style="font-size:12px; color:#e2b714; margin-top:4px;">Evolution cost: ' + evoCost + 'g (Evolution Lab)</div>';
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
        var nextStarCopies = getStarUpCost();
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

        var html =
            '<div class="r-stars">' + starSpan + '</div>' +
            '<div>' + getElementEmoji(template.element) + ' ' + ARCHETYPES[template.archetype].emoji + '</div>' +
            '<div class="r-name">' + template.name + '</div>' +
            '<div class="r-info">' + template.type.charAt(0).toUpperCase() + template.type.slice(1) + ' · Cost ' + template.cost + '</div>' +
            '<div class="r-info" style="color:#ccc;">HP: ' + scaledHP + ' · ATK: ' + scaledATK + '</div>';

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
    var container = document.getElementById('gacha-results');
    if (!container) return;

    // Initialize shop if empty
    if (!currentShopUnits || currentShopUnits.length === 0) {
        refreshShopUnits(sd.player.level);
    }

    container.innerHTML = '';

    var shopHeader = document.createElement('div');
    shopHeader.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;';
    shopHeader.innerHTML =
        '<span style="color:#888; font-size:12px;">Shop (5 units)</span>' +
        '<button id="shop-refresh-btn" style="padding:4px 10px; border-radius:4px; border:1px solid #444; background:#222; color:#ccc; cursor:pointer; font-size:11px;">🔄 Refresh (' + SHOP_REFRESH_COST + 'g)</button>';
    container.appendChild(shopHeader);

    var grid = document.createElement('div');
    grid.style.cssText = 'display:grid; grid-template-columns:repeat(5, 1fr); gap:6px;';

    for (var i = 0; i < 5; i++) {
        var unitKey = currentShopUnits[i];
        var card = document.createElement('div');
        card.style.cssText = 'background:#16213e; border:1px solid #333; border-radius:6px; padding:8px; text-align:center; min-height:100px;';

        if (!unitKey) {
            card.innerHTML = '<div style="color:#555; font-size:12px;">Sold</div>';
            grid.appendChild(card);
            continue;
        }

        var tmpl = UNIT_TEMPLATES[unitKey];
        if (!tmpl) { grid.appendChild(card); continue; }

        var goldCost = UNIT_COSTS[tmpl.cost] || 3;
        var tierStars = '';
        for (var ts = 0; ts < tmpl.cost; ts++) tierStars += '★';

        card.className = 'shop-card cost-' + tmpl.cost;
        card.innerHTML =
            '<div style="font-size:16px;">' + getElementEmoji(tmpl.element) + '</div>' +
            '<div style="font-size:11px; font-weight:bold; margin:2px 0;">' + tmpl.name + '</div>' +
            '<div style="font-size:10px; color:#e2b714;">' + tierStars + '</div>' +
            '<div style="font-size:10px; color:#888;">' + ARCHETYPES[tmpl.archetype].emoji + ' ' + ARCHETYPES[tmpl.archetype].name + '</div>' +
            '<button class="shop-buy-btn" data-slot="' + i + '" data-key="' + unitKey + '" data-cost="' + goldCost + '" style="margin-top:4px; padding:2px 8px; border-radius:4px; border:1px solid #444; background:' + (sd.player.gold >= goldCost ? '#2a5a2a' : '#3a2a2a') + '; color:#ccc; cursor:pointer; font-size:11px;">' +
            'Buy ' + goldCost + 'g</button>';

        grid.appendChild(card);
    }

    container.appendChild(grid);

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

        // Archetype counting
        archetypeCounts[unit.archetype] = (archetypeCounts[unit.archetype] || 0) + 1;
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
    var nextStarCopies = getStarUpCost();
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
        archetypeCounts[unit.archetype] = (archetypeCounts[unit.archetype] || 0) + 1;
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

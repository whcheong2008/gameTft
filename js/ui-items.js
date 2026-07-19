// ui-items.js -- item bench, forge, gems (split from ui-v2.js)
// Prompt 79 (Phase 6.4): restyled onto the design system (game-v2.html's
// "P79 COLLECTION" CSS block) -- structure/logic unchanged, presentation only.

// ---- P79 helper: rarity -> tier-token border class -----------------------
// items.js's RARITY_CONFIG.colors gives each rarity its own hex (unchanged,
// still used for name/text coloring below); borders now key off the same
// --sv-tier-1..5 scale every other tiered card in the game uses, per the
// prompt's "rarity borders from tier tokens" instruction. mythic reuses
// tier-5 (gold) plus its own extra glow modifier so it still reads as a
// step above legendary.
var P79_RARITY_TIER = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 5 };
function p79RarityBorderClass(equipment) {
    var r = (equipment && equipment.rarity) || 'common';
    return 'tier-' + (P79_RARITY_TIER[r] || 1) + (r === 'mythic' ? ' p79-mythic' : '');
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
        overlay.className = 'sv-modal-backdrop';
        document.body.appendChild(overlay);
    }

    var html = '<div class="sv-modal-panel p79-modal-md">';
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">';
    html += '<div style="font-size:20px; font-weight:bold; color:var(--sv-gold);">💎 Gem Workshop</div>';
    html += '<div class="text-muted" style="font-size:12px;">Level ' + level + ' / ' + BUILDINGS.prism_focus.maxLevel + '</div>';
    html += '</div>';

    // Upgrade button
    var canUp = canUpgradeBuilding(sd, 'prism_focus');
    var upCost = getBuildingUpgradeCost('prism_focus', level);
    if (level < BUILDINGS.prism_focus.maxLevel) {
        html += '<div style="margin-bottom:16px;">';
        html += '<button id="gem-ws-upgrade" class="sv-btn' + (canUp ? ' sv-btn-gold' : '') + '"' + (canUp ? '' : ' disabled') + '>';
        html += 'Upgrade to Level ' + (level + 1) + ' (' + upCost + ' VE)';
        html += '</button></div>';
    }

    // Capabilities checklist
    html += '<div style="margin-bottom:16px;">';
    html += '<div style="font-size:14px; font-weight:bold; margin-bottom:8px; color:var(--sv-text-1);">Capabilities</div>';
    var gemCaps = [
        { lvl: 1, desc: 'Socket gems onto items' },
        { lvl: 2, desc: 'Combine 3 same-type gems into next rarity + Remove socketed gems' },
        { lvl: 3, desc: 'Transmute gems (swap type, 30 VE)' },
        { lvl: 4, desc: 'Auto-socket recommendation' },
        { lvl: 5, desc: 'Prismatic Forge (craft prismatic gems)' }
    ];
    for (var i = 0; i < gemCaps.length; i++) {
        var unlocked = level >= gemCaps[i].lvl;
        html += '<div class="p79-cap-line ' + (unlocked ? 'text-green' : 'text-muted') + '">' +
            (unlocked ? '✓' : '○') + ' L' + gemCaps[i].lvl + ': ' + gemCaps[i].desc + '</div>';
    }
    html += '</div>';

    // Gem socketing UI placeholder
    if (level >= 1) {
        html += '<div style="margin-bottom:16px;">';
        html += '<div style="font-size:14px; font-weight:bold; margin-bottom:8px; color:var(--sv-text-1);">Gem Socketing</div>';
        // Show items with sockets from bench
        var bench = getBenchItems(sd);
        var socketableItems = [];
        for (var bi = 0; bi < bench.length; bi++) {
            if (bench[bi].type === 'combined' || bench[bi].type === 'set' || bench[bi].type === 'ability' || bench[bi].type === 'mythic') {
                socketableItems.push(bench[bi]);
            }
        }
        if (socketableItems.length === 0) {
            html += '<div class="text-muted" style="font-size:12px;">No items available for socketing. Craft combined items first.</div>';
        } else {
            html += '<div class="text-muted" style="font-size:12px;">Items on bench: ' + socketableItems.length + ' (gem socketing uses item socket slots)</div>';
        }
        html += '</div>';
    }

    html += '<div style="text-align:center; margin-top:16px;">';
    html += '<button id="gem-ws-close" class="sv-btn">Close</button>';
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

// ---- Forge Panel ----

function showForgePanel() {
    var sd = getSaveData();
    var forgeLevel = getBuildingLevel(sd, 'echo_shaping');

    var overlay = document.getElementById('forge-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'forge-overlay';
        overlay.className = 'sv-modal-backdrop';
        document.body.appendChild(overlay);
    }

    var html = '<div class="sv-modal-panel p79-modal-lg">';
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">';
    html += '<div style="font-size:20px; font-weight:bold; color:var(--sv-gold);">🔨 Forge</div>';
    html += '<div class="text-muted" style="font-size:12px;">Level ' + forgeLevel + ' · ' + getBuildingEffect('echo_shaping', forgeLevel) + '</div>';
    html += '</div>';

    // Upgrade button
    var canUp = canUpgradeBuilding(sd, 'echo_shaping');
    var upCost = getBuildingUpgradeCost('echo_shaping', forgeLevel);
    if (forgeLevel < BUILDINGS.echo_shaping.maxLevel) {
        html += '<div style="margin-bottom:12px;">';
        html += '<button id="forge-upgrade" class="sv-btn' + (canUp ? ' sv-btn-gold' : '') + '"' + (canUp ? '' : ' disabled') + '>';
        html += 'Upgrade to Level ' + (forgeLevel + 1) + ' (' + upCost + ' VE)';
        html += '</button></div>';
    }

    // Essence + materials display
    html += '<div style="margin-bottom:12px; padding:8px; background:var(--sv-bg-0); border-radius:var(--sv-radius-sm); font-size:12px;">';
    html += '<strong style="color:var(--sv-text-1);">Essences:</strong> ';
    var essElements = ['fire', 'water', 'earth', 'wind', 'lightning', 'force', 'arcane'];
    for (var ei = 0; ei < essElements.length; ei++) {
        var eKey = essElements[ei];
        var eCount = (sd.equipment && sd.equipment.essences && sd.equipment.essences[eKey]) || 0;
        if (eCount > 0) html += ESSENCES[eKey].emoji + '×' + eCount + '  ';
    }
    html += '<br><strong style="color:var(--sv-text-1);">Mythic Mats:</strong> ';
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
        html += '<button class="sv-tab forge-tab' + (ti === 0 && unlocked ? ' active' : '') + '" data-tab="' + ti + '"' + (unlocked ? '' : ' disabled') + '>' + tabNames[ti] + (unlocked ? '' : ' 🔒') + '</button>';
    }
    html += '</div>';

    html += '<div id="forge-content">';
    html += renderForgeTabContent(sd, 0, forgeLevel);
    html += '</div>';

    html += '<div style="text-align:center; margin-top:16px;">';
    html += '<button id="forge-close" class="sv-btn">Close</button>';
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
                allTabs[j].classList.remove('active');
            }
            this.classList.add('active');
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
        html += '<div style="font-size:14px; font-weight:bold; margin-bottom:8px; color:var(--sv-text-1);">Enhance Equipment (+0 to +10)</div>';
        var enhanceable = [];
        for (var i = 0; i < unequipped.length; i++) { if (unequipped[i].rarity !== 'common') enhanceable.push(unequipped[i]); }
        // Also show equipped items
        for (var ei2 = 0; ei2 < inv.length; ei2++) { if (inv[ei2].equipped && inv[ei2].rarity !== 'common') enhanceable.push(inv[ei2]); }
        if (enhanceable.length === 0) {
            html += '<div class="text-muted" style="font-size:12px;">No enhanceable equipment (need Uncommon+ rarity)</div>';
        }
        for (var ci = 0; ci < enhanceable.length; ci++) {
            var c = enhanceable[ci];
            var eCost = getEnhancementCost(c);
            var canAfford = eCost && sd.player.veilEssence >= eCost;
            var eqLabel = c.equipped ? ' <span class="text-green" style="font-size:10px;">[Equipped]</span>' : '';
            html += '<div class="p79-item-row ' + p79RarityBorderClass(c) + '">';
            html += '<div style="flex:1;">' + getItemEmoji(c) + ' ' + getItemName(c) + ' <span style="color:' + getItemRarityColor(c) + '; font-size:11px;">' + getItemRarityName(c) + '</span>' + eqLabel;
            html += '<div class="text-muted" style="font-size:10px;">' + getItemStatDescription(c) + '</div></div>';
            if (eCost) {
                html += '<button class="sv-btn forge-enhance' + (canAfford ? ' sv-btn-primary' : '') + '" data-item-id="' + c.id + '" style="font-size:11px; padding:3px 10px;"' + (canAfford ? '' : ' disabled') + '>+' + ((c.enhanceLevel || 0) + 1) + ' (' + eCost + ' VE)</button>';
            } else {
                html += '<span class="text-green" style="font-size:11px;">MAX</span>';
            }
            html += '</div>';
        }
    } else if (tabIndex === 1 && forgeLevel >= 1) {
        // Salvage
        html += '<div style="font-size:14px; font-weight:bold; margin-bottom:8px; color:var(--sv-text-1);">Salvage Equipment → Scraps + Gems</div>';
        if (unequipped.length === 0) {
            html += '<div class="text-muted" style="font-size:12px;">No unequipped equipment to salvage</div>';
        }
        for (var si = 0; si < unequipped.length; si++) {
            var s = unequipped[si];
            if (s.rarity === 'mythic') continue;
            html += '<div class="p79-item-row ' + p79RarityBorderClass(s) + '">';
            html += '<div>' + getItemEmoji(s) + ' ' + getItemName(s) + ' <span style="color:' + getItemRarityColor(s) + ';">' + getItemRarityName(s) + '</span></div>';
            html += '<button class="sv-btn p79-btn-danger forge-salvage" data-item-id="' + s.id + '" style="font-size:11px; padding:3px 10px;">SALVAGE</button>';
            html += '</div>';
        }
    } else if (tabIndex === 2 && forgeLevel >= 3) {
        // Reforge Affixes
        html += '<div style="font-size:14px; font-weight:bold; margin-bottom:8px; color:var(--sv-text-1);">Reforge Affixes (40 VE — reroll all bonus affixes)</div>';
        var reforgeItems = [];
        for (var ri = 0; ri < inv.length; ri++) { if (inv[ri].rarity !== 'common' && inv[ri].rarity !== 'mythic') reforgeItems.push(inv[ri]); }
        if (reforgeItems.length === 0) {
            html += '<div class="text-muted" style="font-size:12px;">No equipment with affixes to reforge</div>';
        }
        for (var rj = 0; rj < reforgeItems.length; rj++) {
            var r = reforgeItems[rj];
            var canReforge = sd.player.veilEssence >= 40;
            var eqLabel2 = r.equipped ? ' <span class="text-green" style="font-size:10px;">[Eq]</span>' : '';
            html += '<div class="p79-item-row ' + p79RarityBorderClass(r) + '">';
            html += '<div style="flex:1;">' + getItemEmoji(r) + ' ' + getItemName(r) + eqLabel2;
            if (r.affixes && r.affixes.length > 0) {
                html += '<div class="p79-affix-line">';
                for (var af = 0; af < r.affixes.length; af++) html += r.affixes[af].name + (af < r.affixes.length - 1 ? ', ' : '');
                html += '</div>';
            }
            html += '</div>';
            html += '<button class="sv-btn forge-reforge' + (canReforge ? ' sv-btn-primary' : '') + '" data-item-id="' + r.id + '" style="font-size:11px; padding:3px 10px;"' + (canReforge ? '' : ' disabled') + '>REFORGE 40 VE</button>';
            html += '</div>';
        }
    } else if (tabIndex === 3 && forgeLevel >= 3) {
        // Gem management
        html += '<div style="font-size:14px; font-weight:bold; margin-bottom:8px; color:var(--sv-text-1);">Gem Management</div>';
        var gems = (sd.equipment && sd.equipment.gems) || [];
        html += '<div class="text-muted" style="font-size:12px; margin-bottom:6px;">Gems in inventory: ' + gems.length + '</div>';
        if (gems.length > 0) {
            html += '<div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px;">';
            for (var gi = 0; gi < gems.length; gi++) {
                var gem = gems[gi];
                var gStr = typeof gem === 'string' ? gem : (gem.type + '_' + gem.rarity);
                html += '<span class="sv-chip">💎 ' + gStr + '</span>';
            }
            html += '</div>';
        }
        html += '<div class="text-muted" style="font-size:11px;">Gem combine (3→1 higher): 15 VE. Socket/unsocket gems from equipment in the inventory screen.</div>';
    } else if (tabIndex === 4 && forgeLevel >= 4) {
        // Set Infuse
        html += '<div style="font-size:14px; font-weight:bold; margin-bottom:8px; color:var(--sv-text-1);">Set Infuse (50 VE + Essence → add set tag to Epic+)</div>';
        var setKeys = Object.keys(EQUIPMENT_SETS);
        for (var ski = 0; ski < setKeys.length; ski++) {
            var setDef = EQUIPMENT_SETS[setKeys[ski]];
            html += '<div style="margin-bottom:6px; padding:6px 10px; background:var(--sv-bg-2); border-radius:var(--sv-radius-sm);">';
            html += '<div style="font-size:13px; font-weight:bold; color:' + (ESSENCES[setDef.element] ? ESSENCES[setDef.element].color : 'var(--sv-text-1)') + ';">' + setDef.name + ' Set (' + setDef.element + ')</div>';
            html += '<div class="text-muted" style="font-size:10px;">Slots: ' + setDef.slots.join(', ') + '</div>';
            var bKeys = Object.keys(setDef.bonuses);
            for (var bk = 0; bk < bKeys.length; bk++) {
                html += '<div style="font-size:10px; color:var(--sv-blue);">' + bKeys[bk] + 'pc: ' + setDef.bonuses[bKeys[bk]].desc + '</div>';
            }
            html += '</div>';
        }
        html += '<div class="text-muted" style="font-size:11px; margin-top:6px;">Select an Epic+ item in the inventory and use "Set Infuse" to add a set tag.</div>';
    } else if (tabIndex === 5 && forgeLevel >= 5) {
        // Mythic Forge
        html += '<div style="font-size:14px; font-weight:bold; margin-bottom:8px; color:var(--sv-text-1);">Mythic Forge (Legendary + Material + 250 VE)</div>';
        var mythicKeys = Object.keys(MYTHIC_ITEMS);
        for (var mi = 0; mi < mythicKeys.length; mi++) {
            var mk = mythicKeys[mi];
            var mDef = MYTHIC_ITEMS[mk];
            html += '<div class="p79-item-row tier-5 p79-mythic" style="display:block;">';
            html += '<div style="font-size:13px;">' + mDef.emoji + ' <strong style="color:#fb923c;">' + mDef.name + '</strong></div>';
            html += '<div class="text-muted" style="font-size:10px;">Slot: ' + mDef.slot + ' · Material: ' + MYTHIC_MATERIALS[mDef.craftSource.materials[0]].emoji + ' ' + MYTHIC_MATERIALS[mDef.craftSource.materials[0]].name + ' + ' + mDef.craftSource.goldCost + ' VE</div>';
            html += '<div style="font-size:10px; color:var(--sv-blue);">🌟 ' + mDef.majorPassive.desc + '</div>';
            html += '</div>';
        }
    } else {
        html += '<div class="text-muted" style="font-size:12px;">Upgrade the Forge to unlock this feature.</div>';
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
                statusEl.innerHTML = '<span class="text-green">Enhanced to +' + result.level + (result.pity ? ' (pity)' : '') + '!</span>';
            } else {
                statusEl.innerHTML = '<span class="text-red">' + result.reason + (result.level !== undefined ? ' (now +' + result.level + ')' : '') + '</span>';
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
                statusEl.innerHTML = '<span class="text-green">Salvaged! Scraps and gems returned.</span>';
            } else {
                statusEl.innerHTML = '<span class="text-red">' + result.reason + '</span>';
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
                statusEl.innerHTML = '<span class="text-green">Reforged! New affixes: ' + affixNames.join(', ') + '</span>';
            } else {
                statusEl.innerHTML = '<span class="text-red">' + result.reason + '</span>';
            }
            renderTopBar();
            showForgePanel();
        });
    }
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
        var emoji = getItemEmoji(item);
        var isSelected = selectedBenchItem === item.id;
        var isEquipped = !!item.equipped;

        var div = document.createElement('div');
        div.className = 'p79-item-tile ' + p79RarityBorderClass(item) +
            (isSelected ? ' selected' : '') + (isEquipped ? ' equipped' : '');
        div.setAttribute('data-item-id', item.id);

        var nameStr = getItemName(item);
        if (nameStr.length > 12) nameStr = nameStr.substring(0, 11) + '..';

        var tierBadge = item.tier ? '<div style="position:absolute; top:1px; left:1px; font-size:8px; color:var(--sv-text-3);">T' + item.tier + '</div>' : '';
        var setBadge = item.setId ? '<div style="position:absolute; top:1px; right:1px; font-size:8px;">🔗</div>' : '';

        div.innerHTML = tierBadge + setBadge +
            '<div style="font-size:16px;">' + emoji + '</div>' +
            '<div style="font-size:9px; color:' + getItemRarityColor(item) + ';">' + getItemRarityName(item) + '</div>' +
            '<div class="text-muted" style="font-size:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + nameStr + '</div>' +
            (isEquipped ? '<div class="text-green" style="font-size:8px;">Equipped</div>' : '');

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
    html += '<div class="text-muted" style="font-size:11px;">T' + (item.tier || '?') + ' ' + getItemRarityName(item) + ' · ' + (SLOT_DISPLAY[item.slot] ? SLOT_DISPLAY[item.slot].name : item.slot) + '</div>';
    html += '<div style="color:var(--sv-text-2); margin-top:4px; font-size:12px;">' + getItemStatDescription(item) + '</div>';

    // Affixes
    if (item.affixes && item.affixes.length > 0) {
        html += '<div class="text-muted" style="margin-top:4px; font-size:11px;">Affixes:</div>';
        for (var ai = 0; ai < item.affixes.length; ai++) {
            html += '<div class="p79-affix-line">  ' + item.affixes[ai].name + '</div>';
        }
    }

    // Set info
    if (item.setId && EQUIPMENT_SETS[item.setId]) {
        var setDef = EQUIPMENT_SETS[item.setId];
        html += '<div style="margin-top:4px; color:' + (ESSENCES[setDef.element] ? ESSENCES[setDef.element].color : 'var(--sv-text-1)') + '; font-size:12px;">🔗 ' + setDef.name + ' Set</div>';
    }

    // Gems
    if (item.gems && item.gems.length > 0) {
        html += '<div class="text-muted" style="margin-top:4px; font-size:11px;">Sockets: ';
        for (var gi = 0; gi < item.gems.length; gi++) {
            html += item.gems[gi] ? ('💎' + item.gems[gi]) : '◇';
            if (gi < item.gems.length - 1) html += ' ';
        }
        html += '</div>';
    }

    if (item.equipped) {
        var eqUnitName = UNIT_TEMPLATES[item.equipped.unitId] ? UNIT_TEMPLATES[item.equipped.unitId].name : (EVOLVED_TEMPLATES[item.equipped.unitId] ? EVOLVED_TEMPLATES[item.equipped.unitId].name : item.equipped.unitId);
        html += '<div class="text-green" style="margin-top:6px;">Equipped on: ' + eqUnitName + '</div>';
        html += '<button class="sv-btn p79-btn-danger" onclick="uiUnequipItem(\'' + item.id + '\')" style="margin-top:4px; font-size:11px; padding:2px 8px;">Unequip</button>';
    } else {
        html += '<div class="text-gold" style="margin-top:6px; font-size:11px;">Go to Team Builder to equip</div>';
    }

    if (!item.equipped && item.rarity !== 'mythic') {
        var sellValue = getItemSellValue(item);
        html += '<button class="sv-btn" onclick="uiSellItem(\'' + item.id + '\')" ' +
            'style="margin-top:6px; font-size:11px; padding:4px 12px; color:var(--sv-gold);">' +
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
// Light pass (Prompt 79): tokens only -- no existing tab UI here to convert
// (unlike js/ui-lore.js's World/Regions/Units/Heroes/Bonds Codex), so this
// stays a straight hardcoded-hex -> var(--sv-*) token swap, structure as-is.

function uiShowCodex() {
    var panel = document.getElementById('codex-panel');
    if (!panel) return;
    if (panel.style.display === 'block') { panel.style.display = 'none'; return; }

    var sd = getSaveData();
    var discovered = (sd.equipment && sd.equipment.codex && sd.equipment.codex.discovered) ? sd.equipment.codex.discovered : {};
    var discCount = Object.keys(discovered).length;

    var html = '<div style="font-size:16px; font-weight:bold; color:var(--sv-gold); margin-bottom:8px;">📖 Equipment Codex</div>';
    html += '<div class="text-muted" style="font-size:12px; margin-bottom:10px;">Discovered: ' + discCount + ' item variants</div>';

    // Show by slot
    var slots = ['weapon', 'helm', 'chest', 'gauntlets', 'boots', 'offhand', 'accessory'];
    for (var si = 0; si < slots.length; si++) {
        var slot = slots[si];
        var lines = getItemLinesForSlot(slot);
        var slotName = SLOT_DISPLAY[slot] ? (SLOT_DISPLAY[slot].emoji + ' ' + SLOT_DISPLAY[slot].name) : slot;
        html += '<div style="margin-bottom:8px;">';
        html += '<div style="font-size:13px; font-weight:bold; color:var(--sv-blue); margin-bottom:4px;">' + slotName + '</div>';
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
                    html += '<span style="font-size:11px; color:var(--sv-text-2); margin-right:6px;">T' + t + ': ' + tierName + '</span>';
                } else {
                    html += '<span class="text-muted" style="font-size:11px; margin-right:6px;">T' + t + ': ???</span>';
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
            html += '<div class="text-muted" style="margin-left:8px; font-size:11px;">🔒 ???</div>';
        }
    }
    html += '</div>';

    panel.innerHTML = html;
    panel.style.display = 'block';
}

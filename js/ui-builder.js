// ui-builder.js -- team builder screen + item equip on board (split from ui-v2.js)

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


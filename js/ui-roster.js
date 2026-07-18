// ui-roster.js -- collection, unit detail (split from ui-v2.js)

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


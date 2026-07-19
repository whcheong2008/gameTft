// ui-roster.js -- collection, unit detail (split from ui-v2.js)
// Prompt 79 (Phase 6.4): restyled onto the design system (game-v2.html's
// "P79 COLLECTION" CSS block) -- structure/logic unchanged, presentation only.

// ---- P79 helpers: portrait placeholder + star pips --------------------
// Shared by the roster cards, the collection grid, and the unit detail
// sheet. Portrait divs get a stable id="unit-portrait-<unitKey>" (load-
// bearing for Phase 5 art integration -- swapping the placeholder for real
// art will just mean setting this element's background-image/content) and
// an elemental radial-gradient fallback + giant element emoji until then.

function p79PortraitHtml(unitKey, tmpl, sizeClass) {
    var element = tmpl && tmpl.element;
    var emoji = (element && ELEMENTS[element]) ? ELEMENTS[element].emoji : '❓';
    var grad = element ?
        ('radial-gradient(circle at 32% 26%, var(--sv-el-' + element + '), var(--sv-bg-0) 78%)') :
        'var(--sv-bg-0)';
    return '<div id="unit-portrait-' + unitKey + '" class="p79-portrait' + (sizeClass ? ' ' + sizeClass : '') +
        '" style="background:' + grad + ';">' + emoji + '</div>';
}

function p79StarPipsHtml(count, lg) {
    var n = count || 0;
    var cls = lg ? ' lg' : '';
    var html = '<div class="p79-star-pips">';
    if (n <= 0) {
        html += '<span class="p79-star-pip' + cls + '"></span>';
    } else {
        for (var i = 0; i < n; i++) html += '<span class="p79-star-pip filled' + cls + '"></span>';
    }
    html += '</div>';
    return html;
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
        div.className = 'p79-unit-card tier-' + rCost + (r.isEvolved ? ' p79-evolved' : '');

        var statMult = getStarMultiplier(r.stars);
        var scaledHP = Math.floor(r.template.hp * statMult);
        var scaledATK = Math.floor(r.template.attack * statMult);
        var typeLabel = r.template.type.charAt(0).toUpperCase() + r.template.type.slice(1);

        var html = '<div class="p79-card-head">' +
            p79PortraitHtml(r.key, r.template, 'p79-portrait-sm') +
            '<div class="p79-card-body">' +
                (r.isEvolved ? '<div class="p79-card-tag">✨ Evolved</div>' : '') +
                p79StarPipsHtml(r.stars) +
                '<div class="p79-card-name">' + r.template.name + '</div>' +
                '<div class="p79-card-meta">' + ARCHETYPES[r.template.archetype].emoji + ' ' + typeLabel + ' · Cost ' + rCost + '</div>' +
            '</div>' +
        '</div>' +
        '<div class="p79-card-stats">HP: ' + scaledHP + ' · ATK: ' + scaledATK + '</div>' +
        '<div class="text-green" style="font-size:11px;">' + r.copiesForNext + ' / ' + r.copiesNeeded + ' copies</div>';

        html += '<div class="p79-btn-row">';
        if (r.canStarUp) {
            html += '<button class="sv-btn p79-btn-green star-up-btn" data-key="' + r.key + '" style="font-size:11px; padding:3px 8px;">⬆ Star Up!</button>';
        }
        if (r.copiesForNext > 0) {
            html += '<button class="sv-btn sell-btn" data-key="' + r.key +
                '" data-copies="' + r.copiesForNext + '" style="font-size:11px; padding:3px 8px;">💰 Sell (' +
                r.copiesForNext + ')</button>';
        }
        html += '</div>';

        div.innerHTML = html;
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
            '<div class="sv-modal-panel" style="text-align:center; min-width:280px; max-width:340px;">' +
                '<div style="font-size:16px; font-weight:bold; color:var(--sv-text-1); margin-bottom:10px;">Sell ' + tmpl.name + ' Copies</div>' +
                '<div class="text-muted" style="font-size:13px; margin-bottom:12px;">Available: ' + maxCopies + ' copies</div>' +
                '<div class="p79-btn-row" style="justify-content:center; margin-bottom:14px;">' +
                    '<button class="sv-btn sell-amt-btn" data-amt="1">1</button>' +
                    '<button class="sv-btn sell-amt-btn" data-amt="5">5</button>' +
                    '<button class="sv-btn sell-amt-btn" data-amt="' + maxCopies + '">All (' + maxCopies + ')</button>' +
                '</div>' +
                '<div style="font-size:15px; color:var(--sv-gold); margin-bottom:14px;">Selling ' + sellCount + ' → ✨ ' + goldValue + ' VE</div>' +
                '<div class="p79-btn-row" style="justify-content:center;">' +
                    '<button id="sell-confirm" class="sv-btn sv-btn-primary">Confirm Sell</button>' +
                    '<button id="sell-cancel" class="sv-btn">Cancel</button>' +
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

    var displayCost = tmpl.cost || tmpl.baseCost || 1;

    // ---- Left column: portrait + identity ----
    var left = '<div class="p79-ud-left">';
    left += p79PortraitHtml(unitKey, tmpl, 'p79-portrait-modal');
    if (isEvolvedUnit) {
        left += '<div class="text-gold" style="font-size:11px; font-weight:bold;">✨ Evolved Unit</div>';
    }
    left += '<div class="ud-name" style="font-size:16px;">' + tmpl.name + '</div>';
    left += p79StarPipsHtml(stars, true);
    left += '<div class="ud-meta">Cost ' + displayCost + '</div>';
    left += '<div class="ud-meta">' + elemData.emoji + ' ' + elemData.name + ' · ' + archData.emoji + ' ' + archData.name + '</div>';
    left += '<div class="ud-meta">' + (typeData ? typeData.name : tmpl.type) + '</div>';
    left += '</div>';

    // ---- Right column: everything else ----
    var right = '<div class="p79-ud-right">';

    // ---- Combat Behavior ----
    if (typeData) {
        right += '<div class="ud-section">';
        right += '<div class="ud-section-title">⚔️ Combat Behavior — ' + typeData.name + '</div>';
        right += '<div class="ud-type-desc">' + typeData.desc + '</div>';
        right += '</div>';
    }

    // ---- Stats ----
    right += '<div class="ud-section">';
    right += '<div class="ud-section-title">📊 Stats</div>';

    right += '<div class="ud-stat-row"><span class="ud-stat-label">HP</span><span class="ud-stat-value">' +
        scaledHP + ' <span class="text-muted" style="font-size:10px;">(base ' + tmpl.hp + ' × ' + statMult.toFixed(2) + ')</span></span></div>';
    right += '<div class="ud-stat-row"><span class="ud-stat-label">Attack</span><span class="ud-stat-value">' +
        scaledATK + ' <span class="text-muted" style="font-size:10px;">(base ' + tmpl.attack + ')</span></span></div>';
    right += '<div class="ud-stat-row"><span class="ud-stat-label">Attack Speed</span><span class="ud-stat-value">' +
        tmpl.attackSpd + 's</span></div>';
    right += '<div class="ud-stat-row"><span class="ud-stat-label">Range</span><span class="ud-stat-value">' +
        tmpl.range + '</span></div>';
    right += '<div class="ud-stat-row"><span class="ud-stat-label">Move Speed</span><span class="ud-stat-value">' +
        tmpl.moveSpd + '</span></div>';

    // ---- Element Matchup ----
    right += '<div class="text-muted" style="margin-top:6px; font-size:11px;">';
    right += 'Strong vs ' + ELEMENTS[elemData.strong].emoji + ' ' + ELEMENTS[elemData.strong].name + ' (1.3×) · ';
    right += 'Weak vs ' + ELEMENTS[elemData.weak].emoji + ' ' + ELEMENTS[elemData.weak].name + ' (0.7×)';
    right += '</div>';
    right += '</div>';

    // ---- Equipped Items ----
    var equippedItems = getEquippedItems(sd, unitKey);
    if (equippedItems.length > 0) {
        right += '<div class="ud-section">';
        right += '<div class="ud-section-title">🎒 Equipped Items</div>';
        for (var i = 0; i < equippedItems.length; i++) {
            var item = equippedItems[i];
            var rarityColor = getItemRarityColor(item);
            right += '<div class="ud-item-row">';
            right += '<span style="font-size:16px;">' + getItemEmoji(item) + '</span>';
            right += '<span style="color:' + rarityColor + ';">' + getItemName(item) + '</span>';
            right += '<span class="text-muted" style="font-size:11px;">(' + getItemStatDescription(item) + ')</span>';
            right += '</div>';
        }
        right += '</div>';
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
            right += '<div class="ud-section">';
            right += '<div class="ud-section-title">🔗 Team Synergies</div>';
            for (var si = 0; si < relevantSynergies.length; si++) {
                var syn = relevantSynergies[si];
                right += '<div class="' + (syn.active ? 'text-green' : 'text-muted') + '" style="font-size:12px; padding:2px 0;">';
                right += syn.emoji + ' ' + syn.name + ' (' + syn.count + ') — ' + syn.status;
                right += '</div>';
            }
            right += '</div>';
        }
    }

    // ---- Copy Progress (roster context) ----
    if (context === 'roster') {
        right += '<div class="ud-section">';
        right += '<div class="ud-section-title">📈 Progress</div>';
        var copiesNeeded = 10; // 10-copy star-up
        right += '<div class="ud-stat-row"><span class="ud-stat-label">Current Stars</span><span class="ud-stat-value">' + stars + '</span></div>';
        right += '<div class="ud-stat-row"><span class="ud-stat-label">Copies</span><span class="ud-stat-value">' + entry.copiesForNext + ' / ' + copiesNeeded + ' for next star</span></div>';
        right += '<div class="sv-bar sv-bar-gold" style="margin-top:4px;"><div class="sv-bar-fill" style="width:' + Math.min(100, (entry.copiesForNext / copiesNeeded) * 100) + '%;"></div></div>';
        if (entry.copiesForNext >= copiesNeeded) {
            right += '<div class="text-green" style="font-size:12px; margin-top:4px;">Ready to star up!</div>';
        }
        right += '</div>';
    }

    // ---- Evolution Info ----
    if (isEvolvedUnit) {
        // Show "Evolved from" info and ability
        var baseTmpl = UNIT_TEMPLATES[tmpl.baseKey];
        right += '<div class="ud-section">';
        right += '<div class="ud-section-title">✨ Evolved Unit</div>';
        right += '<div class="ud-evo-box">';
        if (baseTmpl) {
            right += '<div class="text-muted" style="font-size:12px;">Evolved from: ' + baseTmpl.name + '</div>';
        }
        if (tmpl.ability) {
            right += '<div class="ud-evo-ability" style="margin-top:4px;">⚡ ' + tmpl.ability + '</div>';
        }
        right += '</div>';
        right += '</div>';
    } else {
        // Show evolution path for base units
        var evo = EVOLUTIONS[unitKey];
        if (evo) {
            var evolvedTmpl2 = EVOLVED_TEMPLATES[evo.into];
            if (evolvedTmpl2) {
                right += '<div class="ud-section">';
                right += '<div class="ud-section-title">✨ Evolution Path</div>';
                right += '<div class="ud-evo-box">';
                right += '<div style="font-size:14px; font-weight:bold; color:var(--sv-text-1);">' + tmpl.name + ' → ' + evolvedTmpl2.name + '</div>';

                // Check requirements
                var evoCheck = checkEvolutionRequirements(sd, unitKey);
                if (evoCheck.requirements) {
                    for (var ri2 = 0; ri2 < evoCheck.requirements.length; ri2++) {
                        var reqResult = evoCheck.requirements[ri2];
                        right += '<div class="' + (reqResult.met ? 'ud-evo-met' : 'ud-evo-unmet') + '" style="font-size:12px;">';
                        right += (reqResult.met ? '✓' : '○') + ' ' + reqResult.desc;
                        right += '</div>';
                    }
                }

                // Already evolved?
                if (sd.collection[evo.into]) {
                    right += '<div class="text-green" style="font-size:12px; margin-top:4px;">✅ Already evolved!</div>';
                } else if (canEvolve(sd)) {
                    var evoCost = getEvolutionGoldCost(sd, unitKey);
                    right += '<div class="text-gold" style="font-size:12px; margin-top:4px;">Evolution cost: ' + evoCost + ' VE (Deep Resonance)</div>';
                } else {
                    right += '<div class="text-muted" style="font-size:12px; margin-top:4px;">Build the Evolution Lab to evolve</div>';
                }

                // Evolved stats preview
                right += '<div class="text-muted" style="margin-top:6px; font-size:11px;">Evolved Stats (at 1⭐):</div>';
                right += '<div style="font-size:11px; color:var(--sv-text-2);">HP: ' + evolvedTmpl2.hp +
                    ' · ATK: ' + evolvedTmpl2.attack +
                    ' · SPD: ' + evolvedTmpl2.attackSpd + 's · Range: ' + evolvedTmpl2.range + '</div>';

                if (evolvedTmpl2.ability) {
                    right += '<div class="ud-evo-ability">⚡ ' + evolvedTmpl2.ability + '</div>';
                }

                right += '</div>';
                right += '</div>';
            }
        }
    }

    right += '</div>';

    var html = '<div class="p79-ud-grid">' + left + right + '</div>';

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
        filterBar.className = 'p79-filter-bar';
        container.parentNode.insertBefore(filterBar, container);
    }

    var allElements = Object.keys(ELEMENTS);
    var allArchetypes = Object.keys(ARCHETYPES);
    var allTypes = ['warrior', 'tank', 'archer', 'mage', 'assassin', 'healer'];

    function filterTabBtn(filterKey, value, label, isActive) {
        return '<button class="sv-tab' + (isActive ? ' active' : '') + '" data-filter="' + filterKey + '" data-value="' + value + '">' + label + '</button>';
    }

    var html = '';

    // Element filter
    html += '<div class="p79-filter-row">';
    html += '<span class="p79-filter-label">Element:</span>';
    html += filterTabBtn('element', 'all', 'All', collectionFilters.element === 'all');
    for (var ei = 0; ei < allElements.length; ei++) {
        var el = allElements[ei];
        html += filterTabBtn('element', el, getElementEmoji(el), collectionFilters.element === el);
    }
    html += '</div>';

    // Type filter
    html += '<div class="p79-filter-row">';
    html += '<span class="p79-filter-label">Type:</span>';
    html += filterTabBtn('type', 'all', 'All', collectionFilters.type === 'all');
    for (var ti = 0; ti < allTypes.length; ti++) {
        var tp = allTypes[ti];
        html += filterTabBtn('type', tp, tp.charAt(0).toUpperCase() + tp.slice(1), collectionFilters.type === tp);
    }
    html += '</div>';

    // Archetype filter
    html += '<div class="p79-filter-row">';
    html += '<span class="p79-filter-label">Archetype:</span>';
    html += filterTabBtn('archetype', 'all', 'All', collectionFilters.archetype === 'all');
    for (var ai = 0; ai < allArchetypes.length; ai++) {
        var arch = allArchetypes[ai];
        html += filterTabBtn('archetype', arch, ARCHETYPES[arch].emoji + ' ' + ARCHETYPES[arch].name, collectionFilters.archetype === arch);
    }
    html += '</div>';

    // Tier filter
    html += '<div class="p79-filter-row">';
    html += '<span class="p79-filter-label">Tier:</span>';
    html += filterTabBtn('tier', 'all', 'All', collectionFilters.tier === 'all');
    for (var ci = 1; ci <= 5; ci++) {
        var stars = '';
        for (var si = 0; si < ci; si++) stars += '★';
        html += filterTabBtn('tier', ci, 'T' + ci + ' ' + stars, collectionFilters.tier === ci);
    }
    html += '</div>';

    // Sort + Search
    html += '<div class="p79-filter-row">';
    html += '<span class="p79-filter-label">Sort:</span>';
    html += '<select id="collection-sort" class="p79-filter-select">';
    html += '<option value="tier"' + (collectionFilters.sort === 'tier' ? ' selected' : '') + '>By Tier</option>';
    html += '<option value="name"' + (collectionFilters.sort === 'name' ? ' selected' : '') + '>By Name</option>';
    html += '<option value="element"' + (collectionFilters.sort === 'element' ? ' selected' : '') + '>By Element</option>';
    html += '</select>';
    html += '<input type="text" id="collection-search" class="p79-filter-input" placeholder="Search..." value="' + (collectionFilters.search || '') + '" style="width:110px;" />';
    html += '</div>';

    filterBar.innerHTML = html;

    // Bind filter buttons
    var filterBtns = filterBar.querySelectorAll('.sv-tab');
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
        div.className = 'p79-unit-card tier-' + template.cost + (!owned ? ' p79-not-owned' : '');
        div.setAttribute('data-unit-key', key);

        var hasEvolvedForm = !!EVOLUTIONS[key];

        var statMult = getStarMultiplier(Math.max(1, stars));
        var scaledHP = Math.floor(template.hp * statMult);
        var scaledATK = Math.floor(template.attack * statMult);

        // Ability description
        var abilityHtml = '';
        var abilityInfo = ABILITY_DATA ? ABILITY_DATA[key] : null;
        if (abilityInfo) {
            var abilDesc = abilityInfo.desc || '';
            if (abilDesc.length > 60) abilDesc = abilDesc.substring(0, 57) + '...';
            abilityHtml = '<div class="p79-card-ability">⚡ ' + abilityInfo.name + '</div>' +
                '<div class="p79-card-ability-desc">' + abilDesc + '</div>';
        }

        var html = '<div class="p79-card-head">' +
            p79PortraitHtml(key, template, 'p79-portrait-sm') +
            '<div class="p79-card-body">' +
                p79StarPipsHtml(stars) +
                '<div class="p79-card-name">' + template.name + '</div>' +
                '<div class="p79-card-meta">' + ARCHETYPES[template.archetype].emoji + ' ' + template.type.charAt(0).toUpperCase() + template.type.slice(1) + ' · Cost ' + template.cost + '</div>' +
            '</div>' +
        '</div>' +
        '<div class="p79-card-stats">HP: ' + scaledHP + ' · ATK: ' + scaledATK + '</div>' +
        abilityHtml;

        if (owned) {
            html += '<div style="margin-top:2px;">' +
                '<div class="sv-bar sv-bar-gold"><div class="sv-bar-fill" style="width:' + copiesProgress + '%;"></div></div>' +
                '<span class="text-muted" style="font-size:10px;">' + copies + ' / ' + nextStarCopies + ' copies</span>' +
                '</div>';

            html += '<div class="p79-btn-row">';
            if (canStarUp(sd, key)) {
                html += '<button class="sv-btn p79-btn-green star-up-btn" data-key="' + key + '" style="font-size:11px; padding:3px 8px;">⬆ Star Up!</button>';
            }
            if (copies > 0) {
                html += '<button class="sv-btn sell-btn" data-key="' + key + '" data-copies="' + copies + '" style="font-size:11px; padding:3px 8px;">💰 Sell (' + copies + ')</button>';
            }
            html += '</div>';
        } else {
            html += '<div class="p79-card-tag-muted">Not collected</div>';
        }

        if (hasEvolvedForm) {
            html += '<div class="p79-card-tag">✨ Can Evolve</div>';
        }

        div.innerHTML = html;
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

    var html = '';
    html += '<div style="text-align:center; margin-bottom:8px;">';
    html += p79PortraitHtml(unitKey, template, 'p79-portrait-modal');
    html += '<div style="font-size:16px; font-weight:bold; color:var(--sv-text-1); margin-top:6px;">' + template.name + '</div>';
    html += p79StarPipsHtml(stars, true);
    html += '<div class="text-muted" style="font-size:12px;">' + getElementEmoji(template.element) + ' ' + ELEMENTS[template.element].name + ' · ' + ARCHETYPES[template.archetype].emoji + ' ' + ARCHETYPES[template.archetype].name + '</div>';
    if (isEvolved) html += '<div class="text-gold" style="font-size:11px;">✨ Evolved Form</div>';
    html += '</div>';

    // Stats grid
    html += '<div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:4px; margin-bottom:8px; text-align:center; font-size:11px;">';
    html += '<div><div class="text-muted">HP</div><div style="color:var(--sv-text-1);">' + Math.floor(template.hp * statMult) + '</div></div>';
    html += '<div><div class="text-muted">ATK</div><div style="color:var(--sv-text-1);">' + Math.floor(template.attack * statMult) + '</div></div>';
    html += '<div><div class="text-muted">AtkSpd</div><div style="color:var(--sv-text-1);">' + template.attackSpd + '</div></div>';
    html += '<div><div class="text-muted">Range</div><div style="color:var(--sv-text-1);">' + template.range + '</div></div>';
    html += '<div><div class="text-muted">MoveSpd</div><div style="color:var(--sv-text-1);">' + template.moveSpd + '</div></div>';
    html += '</div>';

    // Passive
    if (passive) {
        html += '<div style="margin-bottom:6px; padding:6px; background:var(--sv-bg-0); border-radius:var(--sv-radius-sm); font-size:12px;">';
        html += '<div class="text-green" style="font-weight:bold;">Passive: ' + passive.name + '</div>';
        html += '<div class="text-muted">' + (passive.description || passive.desc || 'No description') + '</div>';
        html += '</div>';
    }

    // Ability
    if (ability) {
        html += '<div style="margin-bottom:6px; padding:6px; background:var(--sv-bg-0); border-radius:var(--sv-radius-sm); font-size:12px;">';
        html += '<div style="font-weight:bold; color:#ce93d8;">Ability: ' + ability.name + '</div>';
        html += '<div class="text-muted">' + (ability.description || ability.desc || 'No description') + '</div>';
        html += '</div>';
    }

    // Evolution section
    var evo = EVOLUTIONS[unitKey];
    if (evo) {
        var evolvedTmpl = EVOLVED_TEMPLATES[evo.evolved];
        html += '<div style="margin-bottom:6px; padding:6px; background:var(--sv-bg-0); border-radius:var(--sv-radius-sm); font-size:12px;">';
        html += '<div class="text-gold" style="font-weight:bold;">✨ Evolved Form: ' + (evolvedTmpl ? evolvedTmpl.name : evo.evolved) + '</div>';
        html += '<div class="text-muted">Requires: ' + (evo.essences || '?') + ' essences + 3★</div>';
        html += '</div>';
    }

    // Star-up progress
    if (owned) {
        html += '<div style="margin-top:6px;">';
        html += '<div style="font-size:12px; font-weight:bold; color:var(--sv-text-1);">Star Progress</div>';
        html += '<div class="sv-bar sv-bar-gold" style="margin:4px 0;"><div class="sv-bar-fill" style="width:' + progress + '%;"></div></div>';
        html += '<span class="text-muted" style="font-size:11px;">' + copies + ' / ' + nextStarCopies + ' copies</span>';
        html += '</div>';
    }

    // Use existing unit detail overlay
    var overlay = document.getElementById('unit-detail-overlay');
    document.getElementById('unit-detail-content').innerHTML = html;
    overlay.style.display = 'flex';
}

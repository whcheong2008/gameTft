// =============================================================================
// ui-lore.js -- Lore Codex screen: World / Regions / Units / Heroes / Bonds tabs
// (Prompt 63 -- Phase 2.8 Lore Delivery)
// Prompt 79 (Phase 6.4): light pass onto the design system (game-v2.html's
// "P79 COLLECTION" CSS block) -- tokens + consistent .sv-tab tabs only,
// structure/logic unchanged. The purple accent (#b388ff) that distinguishes
// the Codex from the gold-bordered default .sv-modal-panel is kept via the
// .p79-modal-accent-purple modifier.
// =============================================================================

var loreCodexTab = 'world';

function showLoreCodex() {
    var sd = getSaveData();
    syncLoreUnlocks(sd);
    autoSave(sd);

    var overlay = document.getElementById('lore-codex-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'lore-codex-overlay';
        overlay.className = 'sv-modal-backdrop';
        document.body.appendChild(overlay);
    }

    renderLoreCodex(overlay);
    overlay.style.display = 'flex';
}

function renderLoreCodex(overlay) {
    var sd = getSaveData();
    var tabs = [
        { id: 'world', label: 'World' },
        { id: 'regions', label: 'Regions' },
        { id: 'units', label: 'Units' },
        { id: 'heroes', label: 'Heroes' },
        { id: 'bonds', label: 'Bonds' }
    ];

    var html = '<div class="sv-modal-panel p79-modal-lg p79-modal-accent-purple">';
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">';
    html += '<div style="font-size:20px; font-weight:bold; color:#b388ff;">📜 Codex</div>';
    html += '<button id="lore-codex-close" class="sv-btn">Close</button>';
    html += '</div>';

    html += '<div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px;">';
    for (var t = 0; t < tabs.length; t++) {
        var active = loreCodexTab === tabs[t].id;
        html += '<button class="sv-tab lore-tab-btn' + (active ? ' active' : '') + '" data-tab="' + tabs[t].id + '">' + tabs[t].label + '</button>';
    }
    html += '</div>';

    html += '<div id="lore-codex-body">' + renderLoreCodexTabBody(loreCodexTab, sd) + '</div>';
    html += '</div>';

    overlay.innerHTML = html;

    document.getElementById('lore-codex-close').onclick = function() { overlay.style.display = 'none'; };

    var tabBtns = overlay.querySelectorAll('.lore-tab-btn');
    for (var tb = 0; tb < tabBtns.length; tb++) {
        tabBtns[tb].addEventListener('click', function() {
            loreCodexTab = this.getAttribute('data-tab');
            renderLoreCodex(overlay);
        });
    }
}

function renderLoreCodexTabBody(tab, sd) {
    switch (tab) {
        case 'world': return renderLoreWorldTab();
        case 'regions': return renderLoreRegionsTab(sd);
        case 'units': return renderLoreUnitsTab(sd);
        case 'heroes': return renderLoreHeroesTab(sd);
        case 'bonds': return renderLoreBondsTab(sd);
        default: return '';
    }
}

function loreEntryBox(unlocked, innerHtml, lockedLabel) {
    var body = unlocked ? innerHtml : '<div style="font-size:14px; font-weight:bold; color:var(--sv-text-3);">🔒 ' + (lockedLabel || '???') + '</div>';
    return '<div class="p79-lore-entry' + (unlocked ? '' : ' locked') + '">' + body + '</div>';
}

function renderLoreWorldTab() {
    var html = '';
    for (var i = 0; i < WORLD_LORE.length; i++) {
        var w = WORLD_LORE[i];
        html += loreEntryBox(true,
            '<div style="font-size:14px; font-weight:bold; color:#b388ff; margin-bottom:4px;">' + w.title + '</div>' +
            '<div style="font-size:12px; color:var(--sv-text-2); line-height:1.5;">' + w.text + '</div>');
    }
    return html;
}

function renderLoreRegionsTab(sd) {
    var unlocks = (sd.loreUnlocks && sd.loreUnlocks.regions) || {};
    var html = '';
    for (var r = 1; r <= 8; r++) {
        var unlocked = !!unlocks[r];
        var lore = REGION_LORE[r];
        var region = (typeof REGIONS !== 'undefined' && REGIONS[r]) ? REGIONS[r] : null;
        var title = lore ? lore.title : (region ? region.name : ('Region ' + r));
        html += loreEntryBox(unlocked,
            '<div style="font-size:14px; font-weight:bold; color:var(--sv-gold); margin-bottom:4px;">Region ' + r + ': ' + title + '</div>' +
            '<div style="font-size:12px; color:var(--sv-text-2); line-height:1.5;">' + (lore ? lore.text : '') + '</div>',
            'Region ' + r + ': ???');
    }
    return html;
}

function renderLoreUnitsTab(sd) {
    var unlocks = (sd.loreUnlocks && sd.loreUnlocks.units) || {};
    var keys = Object.keys(UNIT_TEMPLATES);
    var html = '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px,1fr)); gap:8px;">';
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var tmpl = UNIT_TEMPLATES[key];
        var unlocked = !!unlocks[key];
        html += loreEntryBox(unlocked,
            '<div style="font-size:12px; font-weight:bold; color:var(--sv-text-1);">' + tmpl.emoji + ' ' + tmpl.name + '</div>' +
            '<div style="font-size:11px; color:var(--sv-text-3); margin-top:3px; line-height:1.4;">' + (UNIT_LORE[key] || '') + '</div>');
    }
    html += '</div>';
    return html;
}

function renderLoreHeroesTab(sd) {
    var unlocks = (sd.loreUnlocks && sd.loreUnlocks.heroes) || {};
    var keys = Object.keys(HERO_DATA);
    var html = '';
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var hero = HERO_DATA[key];
        var unlocked = !!unlocks[key];
        html += loreEntryBox(unlocked,
            '<div style="font-size:14px; font-weight:bold; color:var(--sv-gold);">' + hero.name + ' <span style="font-size:11px; color:var(--sv-text-3); font-weight:normal;">(' + hero.philosophy + ')</span></div>' +
            '<div style="font-size:12px; color:var(--sv-text-2); margin-top:4px; line-height:1.5;">' + (HERO_LORE[key] || '') + '</div>');
    }
    return html;
}

function renderLoreBondsTab(sd) {
    var unlocks = (sd.loreUnlocks && sd.loreUnlocks.bonds) || {};
    var keys = Object.keys(UNIT_BONDS);
    var html = '';
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var bond = UNIT_BONDS[key];
        var unlocked = !!unlocks[key];
        html += loreEntryBox(unlocked,
            '<div style="font-size:14px; font-weight:bold; color:#44aa88;">' + bond.name + ' <span style="font-size:11px; color:var(--sv-text-3); font-weight:normal;">(' + bond.type + ')</span></div>' +
            '<div style="font-size:12px; color:var(--sv-text-2); margin-top:4px; line-height:1.5;">' + (BOND_LORE[key] || '') + '</div>',
            '??? <span style="font-size:11px; color:var(--sv-text-3); font-weight:normal;">(' + bond.type + ')</span>');
    }
    return html;
}

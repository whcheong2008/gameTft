// render-dom.js -- the DOM combat renderer (Prompt 67: combat renderer abstraction)
//
// Everything in this file used to live directly in ui-combat.js and be called
// straight out of combat-*.js (spawnDamageNumber/flashAbilityCells) or out of
// ui-combat.js's own fused tick+render loop (renderCombatBoard and friends).
// It is moved here, unchanged pixel-for-pixel, behind the renderer interface
// described in js/render-interface.js: RENDER_DOM.init() subscribes to the
// 'floatingText'/'abilityFlash' combatEvents that js/combat-core.js's
// spawnDamageNumber()/flashAbilityCells() shims emit, and RENDER_DOM.frame()
// is what ui-combat.js's requestAnimationFrame render loop calls every frame.
//
// Rule of thumb this file follows (per the Prompt 67 spec): things on/over
// the battlefield live here (board DOM, unit cells, hp/mana bars, floating
// damage numbers, status icons, encounter banner/HUD, boss telegraph
// visuals, wave-start "FIGHT!" text). The panels around the battlefield
// (scoreboard sidebar, synergy bar, combat log, results/transition overlays,
// buttons) stay in ui-combat.js as screen chrome -- renderCombatBoard() below
// still calls straight into ui-combat.js's renderCombatScoreboard() every
// frame exactly as it did before this split; that's the render loop driving
// chrome, which the spec allows ("it updates from the render loop or
// events"), not combat logic calling chrome (which the spec forbids).

// ---- Floating Damage Numbers ----

var lastDmgNumberTime = 0;

// Real DOM implementation. Renamed from the pre-refactor `spawnDamageNumber`
// so the logic-layer shim of that name in combat-core.js can keep the name
// (and every combat-*.js call site can keep calling it unmodified) without a
// global function name collision once both files are loaded. The autoBattle
// short-circuit that used to live here now lives in the combat-core.js shim
// (the event never even fires during autoBattle), so it isn't repeated here.
function domSpawnDamageNumber(row, col, text, type) {
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

// Real DOM implementation -- see domSpawnDamageNumber's comment above for
// why this is renamed from the pre-refactor `flashAbilityCells`.
function domFlashAbilityCells(cells, color, duration) {
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

// ---- Wave-start "FIGHT!" text ----

function showCombatStartText() {
    var area = document.getElementById('combat-area');
    if (!area) return;
    var overlay = document.createElement('div');
    overlay.className = 'combat-start-text';
    overlay.textContent = 'FIGHT!';
    area.appendChild(overlay);
    setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 1000);
}

// ---- Prompt 62: Encounter mechanic banner + live HUD readout ----
// Reuses the wave-transition visual language (a small overlay banner) rather
// than introducing new UI chrome. No-ops when the stage has no
// encounterMechanic (banner/HUD elements are simply hidden).

function renderEncounterMechanicBanner() {
    var banner = document.getElementById('encounter-mechanic-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'encounter-mechanic-banner';
        banner.style.cssText = 'position:absolute; top:8px; left:50%; transform:translateX(-50%); ' +
            'background:rgba(20,20,30,0.9); border:1px solid #e2b714; border-radius:8px; ' +
            'padding:6px 14px; font-size:12px; color:#eee; z-index:20; text-align:center; max-width:80%;';
        var boardEl = document.getElementById('combat-board');
        if (boardEl && boardEl.appendChild) boardEl.appendChild(banner);
    }

    var mechanics = (combatState && combatState.encounterMechanics) || [];

    // Prompt 64: endless mode's pure-stat floor modifiers (enemy ATK/DR up,
    // player healing/attack-speed down) have no combatState.encounterMechanics
    // entry -- they're applied directly via applyEndlessFloorModifierEffects()
    // -- so surface them here too ("show the modifier ... on the combat
    // banner" per the endless mode spec). No-ops outside an active endless run.
    var endlessMod = null;
    if (typeof endlessRunState !== 'undefined' && endlessRunState && endlessRunState.active &&
        typeof ENDLESS_STAT_MODIFIERS !== 'undefined' && endlessRunState.modifierThisFloor) {
        endlessMod = ENDLESS_STAT_MODIFIERS[endlessRunState.modifierThisFloor] || null;
    }

    if (mechanics.length === 0 && !endlessMod) {
        banner.style.display = 'none';
        return;
    }

    var html = '';
    if (typeof COMBAT_ENCOUNTER_INFO !== 'undefined') {
        for (var i = 0; i < mechanics.length; i++) {
            var info = COMBAT_ENCOUNTER_INFO[mechanics[i]];
            if (!info) continue;
            if (html) html += '<br>';
            html += '<b>' + info.icon + ' ' + info.name + '</b> — ' + info.desc;
        }
    }
    if (endlessMod) {
        if (html) html += '<br>';
        html += '<b>' + (endlessMod.icon || '⚠️') + ' ' + endlessMod.name + '</b> — ' + endlessMod.desc;
    }
    banner.innerHTML = html;
    banner.style.display = html ? 'block' : 'none';
}

// Called every render frame from renderCombatBoard(): keeps the countdown
// timer and escalation stack count visible during the fight.
function updateEncounterMechanicHud() {
    var hud = document.getElementById('encounter-mechanic-hud');
    if (!combatState || !combatState.encounterState) {
        if (hud) hud.style.display = 'none';
        return;
    }

    var parts = [];
    var es = combatState.encounterState;
    if (es.countdown && !es.countdown.fired) {
        parts.push('⏳ ' + Math.max(0, Math.ceil(es.countdown.timer)) + 's');
    }
    if (es.escalatingThreat) {
        parts.push('📈 Stacks: ' + es.escalatingThreat.stacks);
    }
    if (es.reinforcementPressure) {
        parts.push('🌊 Reinforcements: ' + es.reinforcementPressure.totalSpawned + '/' + es.reinforcementPressure.maxTotalSpawns);
    }
    if (es.protectObjective && es.protectObjective.npc) {
        var npc = es.protectObjective.npc;
        parts.push('🛡️ Objective: ' + Math.max(0, npc.hp) + '/' + npc.maxHp);
    }

    if (parts.length === 0) {
        if (hud) hud.style.display = 'none';
        return;
    }

    if (!hud) {
        hud = document.createElement('div');
        hud.id = 'encounter-mechanic-hud';
        hud.style.cssText = 'position:absolute; top:40px; left:50%; transform:translateX(-50%); ' +
            'background:rgba(20,20,30,0.85); border-radius:6px; padding:4px 10px; ' +
            'font-size:11px; color:#e2b714; z-index:20; text-align:center;';
        var boardEl2 = document.getElementById('combat-board');
        if (boardEl2 && boardEl2.appendChild) boardEl2.appendChild(hud);
    }
    hud.style.display = 'block';
    hud.textContent = parts.join('   ');
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
        var bossEmoji = unit.emoji || '👑';
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
    var evolvedIcon = unit.evolved ? '✨' : '';
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

    // Prompt 62: encounter mechanic banner + live HUD readout. Called every
    // frame (like unitLayer above) because boardEl.innerHTML = gridHtml just
    // wiped #combat-board's children in a real browser -- these have to be
    // recreated/reappended every render, not just once at wave start.
    if (typeof renderEncounterMechanicBanner === 'function') renderEncounterMechanicBanner();
    if (typeof updateEncounterMechanicHud === 'function') updateEncounterMechanicHud();

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
                timerEl.textContent = '⏱️ Enrage: ' + Math.ceil(timeLeft) + 's';
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

// ---- Combat Unit Tooltips (Prompt 20 Phase D2) ----
// NOTE (Prompt 67 audit): unused pre-existing dead code -- nothing in the
// codebase calls initCombatUnitTooltips(). Left in place (moved verbatim,
// same as renderCombatUnitCell above) since deleting functionality that
// predates this refactor and isn't displaced by it is out of scope; flagged
// in the Prompt 67 report instead.

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

// =============================================================================
// The DOM renderer object -- registered with js/render-interface.js.
// =============================================================================

// Prompt 67: floatingText/abilityFlash are registered ONCE, at script-load
// time, via combatEvents.onPersistent() -- NOT per-wave via on() inside
// RENDER_DOM.init(). Reason: initCombat() itself can emit these mid-setup
// (e.g. a combat-start passive granting a shield via grantShield(), which
// calls spawnDamageNumber()) -- BEFORE initCombat() has even returned to the
// caller that would otherwise (re-)register a per-wave on() listener after
// combatEvents.reset(). A per-wave on() registration would silently miss
// exactly those events on every wave, which is pixel-INEQUIVALENT to the
// pre-refactor code (spawnDamageNumber/flashAbilityCells were raw functions,
// always "listening", with no registration timing to race). onPersistent()
// listeners survive reset(), so registering them once here, before any
// combat ever starts, closes that gap for every wave including the first.
if (typeof combatEvents !== 'undefined' && typeof combatEvents.onPersistent === 'function') {
    combatEvents.onPersistent('floatingText', function(p) {
        domSpawnDamageNumber(p.row, p.col, p.text, p.type);
    });
    combatEvents.onPersistent('abilityFlash', function(p) {
        domFlashAbilityCells(p.cells, p.color, p.duration);
    });
}

var RENDER_DOM = {
    init: function(container, cs, context) {
        // Clean up the previous wave's unit overlay layer so renderCombatBoard()
        // recreates it fresh (was: startMissionCombat()'s "prevUnitLayer" cleanup
        // in ui-combat.js before this refactor). This part IS per-wave.
        var prevUnitLayer = document.getElementById('combat-unit-layer');
        if (prevUnitLayer) prevUnitLayer.remove();
    },

    frame: function(dtMs) {
        renderCombatBoard();
    },

    destroy: function() {
        var unitLayer = document.getElementById('combat-unit-layer');
        if (unitLayer) unitLayer.remove();
        var dmgNums = document.getElementById('damage-numbers');
        if (dmgNums) dmgNums.innerHTML = '';
        var enrageTimer = document.getElementById('enrage-timer');
        if (enrageTimer) enrageTimer.textContent = '';
    }
};

if (typeof registerRenderer === 'function') registerRenderer('dom', RENDER_DOM);

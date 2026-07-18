// ui-builder.js -- team builder screen + item equip on board (split from ui-v2.js)
//
// Prompt 71 (Phase 3.5, Task 1): the flat DOM team-builder grid is retired --
// team building now happens ON the same angled hex arena combat uses. This
// file mounts its own PixiJS Application (PIXI_BUILDER_R, a second instance
// separate from js/render-pixi.js's combat-only PIXI_R -- the two screens are
// never visible at once, but each needs its own sized/backdropped canvas) and
// reuses render-pixi.js's projection/token code via the Prompt 71 refactor:
// boardToScreen()/pixiHexPoints()/pixiSizeBoard()/pixiMaybeRebuildGrid()/
// pixiCreateBuilderToken()/pixiRedrawBuilderToken() all now take an explicit
// render-state object instead of assuming combat's PIXI_R, so this file
// passes PIXI_BUILDER_R through every one of them rather than duplicating
// that math. All team mutations still go through teams.js's addToTeam/
// moveOnTeam/removeFromTeam -- this file never forks that validation.
//
// Click model (mouse + touch-friendly tap, no HTML5 drag API):
//   click bench chip      -> "held" (highlight eligible hexes on the arena)
//   click hex (empty)      -> place the held bench unit / move a held token
//   click placed token     -> pick up (ring highlight); click again to drop it back
//   click another token    -> swap with the held token
//   click bench (while a token is held) -> unbench it
// Task 2 (wave-transition reposition) reuses this same model against
// js/render-pixi.js's combat PIXI_R instance instead -- see
// pixiEnterRepositionMode() there.

// ---- Team Builder Screen ----

var teamBuilderFilters = { element: 'all', archetype: 'all', sort: 'tier' };

// Prompt 71: set by js/ui-missions.js's uiSelectStoryMission()/uiSelectGrindMission()
// when the team builder is entered from stage/region select instead of the
// hub's standalone "Team Builder" nav button -- {index, isStory, mission}.
// (uiStartStoryMission()/uiStartGrindMission() themselves are untouched --
// they still deploy + start combat immediately, no builder detour; kept that
// way for tests/harness.js's runCombat() helper. See the Prompt 71 report.)
// null means "entered standalone" (uiOpenTeamBuilderStandalone clears it):
// neutral backdrop, no Deploy button.
var teamBuilderEntryStage = null;

// Entry point for the hub nav button (was a bare showScreen('team-builder')
// onclick) -- clears any stale pending stage from a previous stage-select
// visit so a standalone visit never shows a leftover "Deploy" button.
function uiOpenTeamBuilderStandalone() {
    teamBuilderEntryStage = null;
    showScreen('team-builder');
}

// The "Deploy" button's handler (only rendered when teamBuilderEntryStage is
// set -- see renderTeamBuilderDeployButton). Mirrors the pre-Prompt-71
// uiStartStoryMission/uiStartGrindMission tail exactly (pendingMissionIndex/
// pendingMissionIsStory + startMission + beginCombatScreen).
function uiDeployFromBuilder() {
    var sd = getSaveData();
    var team = getActiveTeam(sd);
    if (team.slots.length === 0) {
        showToast('Build a team first!');
        return;
    }
    if (!teamBuilderEntryStage) return;
    pendingMissionIndex = teamBuilderEntryStage.index;
    pendingMissionIsStory = teamBuilderEntryStage.isStory;
    var mission = teamBuilderEntryStage.mission;
    teamBuilderEntryStage = null;
    startMission(sd, mission);
    beginCombatScreen(sd);
}

function renderTeamBuilderScreen() {
    var sd = getSaveData();
    var roster = getRoster(sd);
    var team = getActiveTeam(sd);
    var maxSize = getMaxTeamSize(sd);

    document.getElementById('team-info').textContent =
        'Team: ' + team.slots.length + ' / ' + maxSize + ' units' +
        (teamBuilderEntryStage ? ' — deploying to ' + (teamBuilderEntryStage.mission ? teamBuilderEntryStage.mission.name : 'mission') : '');

    builderRenderDeployButton();
    builderRenderBench(sd, roster, team);
    builderRefreshArena();

    // Synergy preview (use enhanced sidebar if available)
    if (typeof updateSynergySidebar === 'function') {
        updateSynergySidebar();
    } else {
        renderTeamSynergyPreview(sd);
    }

    // Item bar
    renderTeamBuilderItemBar();
}

function builderRenderDeployButton() {
    var container = document.getElementById('team-builder-deploy');
    if (!container) return;
    if (!teamBuilderEntryStage) {
        container.innerHTML = '';
        return;
    }
    var name = teamBuilderEntryStage.mission ? teamBuilderEntryStage.mission.name : 'Mission';
    container.innerHTML = '<button class="btn-primary" onclick="uiDeployFromBuilder()">🚀 Deploy to ' + name + '</button>';
}

// ---- Bench (Prompt 71: DOM strip below the arena, existing .team-roster-item
// visual language, now a horizontal scrollable row) ----

function builderRenderBench(sd, roster, team) {
    var panel = document.getElementById('team-roster-panel');
    panel.innerHTML = '';

    // Filter/sort controls (unchanged from the pre-Prompt-71 layout).
    var filterHtml = '<div style="margin-bottom:6px; font-size:11px;">';
    filterHtml += '<div style="margin-bottom:4px;"><span style="color:#888;">Sort:</span> ';
    var sortOpts = [['tier', 'Tier'], ['name', 'Name'], ['element', 'Element']];
    for (var so = 0; so < sortOpts.length; so++) {
        var sActive = teamBuilderFilters.sort === sortOpts[so][0];
        filterHtml += '<button class="tb-sort-btn" data-sort="' + sortOpts[so][0] + '" style="padding:1px 5px; border-radius:3px; border:1px solid #444; background:' + (sActive ? '#e2b714' : '#222') + '; color:' + (sActive ? '#000' : '#ccc') + '; cursor:pointer; font-size:10px; margin-right:2px;">' + sortOpts[so][1] + '</button>';
    }
    filterHtml += '</div>';
    filterHtml += '<div style="margin-bottom:4px; display:flex; flex-wrap:wrap; gap:2px;">';
    var elActive = teamBuilderFilters.element === 'all';
    filterHtml += '<button class="tb-elem-btn" data-elem="all" style="padding:1px 4px; border-radius:3px; border:1px solid #444; background:' + (elActive ? '#e2b714' : '#222') + '; color:' + (elActive ? '#000' : '#ccc') + '; cursor:pointer; font-size:10px;">All</button>';
    var elemKeys = Object.keys(ELEMENTS);
    for (var ek = 0; ek < elemKeys.length; ek++) {
        var eAct = teamBuilderFilters.element === elemKeys[ek];
        filterHtml += '<button class="tb-elem-btn" data-elem="' + elemKeys[ek] + '" style="padding:1px 4px; border-radius:3px; border:1px solid #444; background:' + (eAct ? '#e2b714' : '#222') + '; color:' + (eAct ? '#000' : '#ccc') + '; cursor:pointer; font-size:10px;">' + ELEMENTS[elemKeys[ek]].emoji + '</button>';
    }
    filterHtml += '</div>';
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
    panel.innerHTML = filterHtml + '<div class="section-title" style="margin-top:4px;">Bench' +
        (PIXI_BUILDER_R.heldBoardRC ? ' <span style="color:#e2b714; font-size:11px;">(click here to unbench held unit)</span>' : '') +
        '</div><div class="tb-bench-chips" id="tb-bench-chips"></div>';

    var chipsEl = document.getElementById('tb-bench-chips');

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
        div.className = 'team-roster-item' + (onTeam ? ' on-team' : '') + (PIXI_BUILDER_R.heldBenchKey === r.key ? ' held' : '');
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

        div.onclick = (function(key) {
            return function() { builderOnBenchChipClick(key); };
        })(r.key);

        chipsEl.appendChild(div);
    }

    // Clicking anywhere else in the bench (not on a specific chip) also
    // unbenches a held board token -- "click bench to unbench" per the spec,
    // not just "click a specific chip". Assigned (not addEventListener'd) so
    // re-rendering the bench never accumulates duplicate listeners on this
    // persistent panel node.
    panel.onclick = function(e) {
        if (e.target === panel && PIXI_BUILDER_R.heldBoardRC) {
            builderUnbenchHeld();
        }
    };

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
}

// A bench chip click means different things depending on current hold state:
//   holding a board token -> drop it (unbench), regardless of which chip
//   already on team        -> remove from team (direct unbench, no pick-up step)
//   otherwise               -> pick up / put down this bench unit for placement
function builderOnBenchChipClick(key) {
    var sd = getSaveData();

    if (PIXI_BUILDER_R.heldBoardRC) {
        builderUnbenchHeld();
        return;
    }

    var team = getActiveTeam(sd);
    var onTeam = false;
    for (var t = 0; t < team.slots.length; t++) {
        if (team.slots[t].key === key) { onTeam = true; break; }
    }
    if (onTeam) {
        removeFromTeam(sd, key);
        renderTeamBuilderScreen();
        return;
    }

    PIXI_BUILDER_R.heldBenchKey = (PIXI_BUILDER_R.heldBenchKey === key) ? null : key;
    renderTeamBuilderScreen();
}

function builderUnbenchHeld() {
    if (!PIXI_BUILDER_R.heldBoardRC) return;
    var sd = getSaveData();
    var teamRow = PIXI_BUILDER_R.heldBoardRC.row - 4;
    var col = PIXI_BUILDER_R.heldBoardRC.col;
    var team = getActiveTeam(sd);
    var slot = builderFindSlotAt(team, teamRow, col);
    PIXI_BUILDER_R.heldBoardRC = null;
    if (slot) removeFromTeam(sd, slot.key);
    renderTeamBuilderScreen();
}

function builderFindSlotAt(team, teamRow, col) {
    for (var i = 0; i < team.slots.length; i++) {
        if (team.slots[i].row === teamRow && team.slots[i].col === col) return team.slots[i];
    }
    return null;
}

// ---- Arena click routing (Task 1) ----
//
// `combatRow` is a combat grid row (4-7, matching unit.gridRow's own
// convention -- see js/combat-core.js's initCombat(), which sets
// unit.gridRow = 4 + boardRow). Called uniformly from both a placed token's
// own pointertap and an empty hex's tile-hit target (see builderBuildTileHits/
// pixiCreateBuilderToken's onTap), exactly like js/render-pixi.js's
// wave-transition reposition click routing (Task 2) does.
function builderOnCellClick(combatRow, col) {
    var teamRow = combatRow - 4;
    if (teamRow < 0 || teamRow > 3) return; // enemy-zone rows are non-interactive
    var sd = getSaveData();

    // Equip-mode passthrough -- highest priority, same as the pre-Prompt-71
    // onTeamCellClick() (patchTeamCellClickForItems's real entry point).
    if (equipModeItemId) {
        var teamE = getActiveTeam(sd);
        var unitHere = builderFindSlotAt(teamE, teamRow, col);
        if (unitHere) {
            var result = equipItem(sd, equipModeItemId, unitHere.key);
            if (result === 'combined') {
                addLogEntry('Items auto-combined into a recipe!', 'info');
            } else if (result === 'evolved_only') {
                addLogEntry('Only evolved units can equip this item!', 'warning');
            }
            equipModeItemId = null;
            renderTeamBuilderScreen();
        }
        return;
    }

    if (PIXI_BUILDER_R.heldBenchKey) {
        var addResult = addToTeam(sd, PIXI_BUILDER_R.heldBenchKey, teamRow, col);
        PIXI_BUILDER_R.heldBenchKey = null;
        if (addResult && addResult.success === false && addResult.reason && typeof showToast === 'function') {
            showToast(addResult.reason);
        }
        renderTeamBuilderScreen();
        return;
    }

    if (PIXI_BUILDER_R.heldBoardRC) {
        var fromTeamRow = PIXI_BUILDER_R.heldBoardRC.row - 4;
        var fromCol = PIXI_BUILDER_R.heldBoardRC.col;
        if (fromTeamRow === teamRow && fromCol === col) {
            // Clicked the already-held token again -- put it back down (deselect).
            PIXI_BUILDER_R.heldBoardRC = null;
            renderTeamBuilderScreen();
            return;
        }
        var teamH = getActiveTeam(sd);
        var heldSlot = builderFindSlotAt(teamH, fromTeamRow, fromCol);
        PIXI_BUILDER_R.heldBoardRC = null;
        if (heldSlot) moveOnTeam(sd, heldSlot.key, teamRow, col);
        renderTeamBuilderScreen();
        return;
    }

    // Nothing held: clicking a placed token picks it up. Clicking an empty
    // cell with nothing held is a no-op.
    var team3 = getActiveTeam(sd);
    var slotHere = builderFindSlotAt(team3, teamRow, col);
    if (slotHere) {
        PIXI_BUILDER_R.heldBoardRC = { row: combatRow, col: col };
        renderTeamBuilderScreen();
    }
}

// ---- Pixi builder arena (Task 1) ----

var PIXI_BUILDER_R = {
    app: null, ready: false, boardEl: null,
    platformLayer: null, gridLayer: null, enemyDimLayer: null, highlightLayer: null,
    tileHitLayer: null, unitLayer: null,
    cellW: 0, cellH: 0, lastGridW: -1, lastGridH: -1,
    hoveredUnit: null,
    heldBenchKey: null,  // roster key picked up from the bench, awaiting placement
    heldBoardRC: null    // {row, col} in COMBAT coords (4-7) of a placed unit picked up
};

function builderEnsureApp() {
    if (PIXI_BUILDER_R.app) return; // already created -- reused across screen visits
    if (typeof PIXI === 'undefined') return; // no vendor lib loaded (headless/test context)

    var boardEl = document.getElementById('builder-board');
    if (!boardEl) return;
    PIXI_BUILDER_R.boardEl = boardEl;

    var app = new PIXI.Application();
    PIXI_BUILDER_R.app = app;

    app.init({
        resizeTo: boardEl,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: (typeof window !== 'undefined' && window.devicePixelRatio) || 1
    }).then(function() {
        if (PIXI_BUILDER_R.app !== app) return; // torn down mid-mount

        app.canvas.style.position = 'absolute';
        app.canvas.style.top = '0';
        app.canvas.style.left = '0';
        app.canvas.style.zIndex = '1';
        boardEl.appendChild(app.canvas);

        PIXI_BUILDER_R.platformLayer = new PIXI.Container();
        PIXI_BUILDER_R.gridLayer = new PIXI.Container();
        PIXI_BUILDER_R.enemyDimLayer = new PIXI.Container();
        PIXI_BUILDER_R.highlightLayer = new PIXI.Container();
        PIXI_BUILDER_R.tileHitLayer = new PIXI.Container();
        PIXI_BUILDER_R.unitLayer = new PIXI.Container();
        PIXI_BUILDER_R.unitLayer.sortableChildren = true;

        app.stage.addChild(PIXI_BUILDER_R.platformLayer);
        app.stage.addChild(PIXI_BUILDER_R.gridLayer);
        app.stage.addChild(PIXI_BUILDER_R.enemyDimLayer);
        app.stage.addChild(PIXI_BUILDER_R.highlightLayer);
        app.stage.addChild(PIXI_BUILDER_R.tileHitLayer);
        app.stage.addChild(PIXI_BUILDER_R.unitLayer);

        // Defer the first real layout pass a couple of frames, same as
        // js/ui-combat.js's startMissionCombat() does for the combat board --
        // on first paint the screen's offsetWidth/offsetHeight can still be 0
        // if read synchronously here.
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                PIXI_BUILDER_R.ready = true;
                builderRefreshArena();
            });
        });
    }).catch(function(err) {
        if (typeof console !== 'undefined' && console.error) {
            console.error('ui-builder.js: builder PIXI.Application.init() failed', err);
        }
        if (typeof pixiShowWebGLRequiredNotice === 'function') {
            pixiShowWebGLRequiredNotice(boardEl, err);
        }
    });
}

function builderRefreshArena() {
    builderEnsureApp();
    if (!PIXI_BUILDER_R.ready) return;

    var regionNum = (teamBuilderEntryStage && teamBuilderEntryStage.mission) ? teamBuilderEntryStage.mission.region : null;
    if (typeof buildArenaBackdrop === 'function') buildArenaBackdrop(regionNum, 'builder-backdrop');

    pixiSizeBoard(PIXI_BUILDER_R);
    pixiMaybeRebuildGrid(PIXI_BUILDER_R);
    builderBuildEnemyDim();
    builderBuildTileHits();
    builderRebuildTokens();
    builderUpdateHighlights();
}

// Enemy rows (0-3): darkened -- "shown dimmed" per the spec. War Room intel
// (js/hub.js's getWarRoomIntelLevel()) is permanently 0 -- that system was
// removed -- so there is no per-unit enemy roster to render; this relocates
// the pre-Prompt-71 behavior faithfully (the old DOM version never rendered
// real enemy tokens either, only an empty dimmed zone) rather than inventing
// new intel-gated content out of scope for this prompt.
function builderBuildEnemyDim() {
    if (!PIXI_BUILDER_R.enemyDimLayer) return;
    pixiDestroyAllChildren(PIXI_BUILDER_R.enemyDimLayer);
    var g = new PIXI.Graphics();
    var hexW = PIXI_BUILDER_R.cellW * 0.92;
    var hexH = PIXI_BUILDER_R.cellH * PIXI_CAM_Y_SQUASH * 0.92;
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < PIXI_COLS; c++) {
            var center = boardToScreen(r, c, PIXI_BUILDER_R);
            g.poly(pixiHexPoints(center.x, center.y, hexW, hexH)).fill({ color: 0x000000, alpha: 0.45 });
        }
    }
    PIXI_BUILDER_R.enemyDimLayer.addChild(g);
}

// One invisible interactive hex per player-side cell (combat rows 4-7) so an
// EMPTY cell is clickable too, not just occupied ones (which get a
// pointertap from their own token -- see builderRebuildTokens).
function builderBuildTileHits() {
    if (!PIXI_BUILDER_R.tileHitLayer) return;
    pixiDestroyAllChildren(PIXI_BUILDER_R.tileHitLayer);
    var hexW = PIXI_BUILDER_R.cellW * 0.92;
    var hexH = PIXI_BUILDER_R.cellH * PIXI_CAM_Y_SQUASH * 0.92;
    for (var r = 4; r < PIXI_ROWS; r++) {
        for (var c = 0; c < PIXI_COLS; c++) {
            (function(row, col) {
                var center = boardToScreen(row, col, PIXI_BUILDER_R);
                var hit = new PIXI.Container();
                hit.x = center.x;
                hit.y = center.y;
                hit.eventMode = 'static';
                hit.cursor = 'pointer';
                hit.hitArea = new PIXI.Polygon(pixiHexPoints(0, 0, hexW, hexH));
                hit.on('pointertap', function() { builderOnCellClick(row, col); });
                PIXI_BUILDER_R.tileHitLayer.addChild(hit);
            })(r, c);
        }
    }
}

// Rebuilds every placed-unit token from scratch each call -- the team
// builder redraws on every state change (a click), not every animation
// frame, so this cost is trivial (at most getMaxTeamSize() tokens) and
// avoids having to reconcile a persistent token set against team.slots
// mutating out from under it.
function builderRebuildTokens() {
    if (!PIXI_BUILDER_R.unitLayer) return;
    pixiDestroyAllChildren(PIXI_BUILDER_R.unitLayer);
    PIXI_BUILDER_R.hoveredUnit = null;

    var sd = getSaveData();
    var team = getActiveTeam(sd);
    for (var i = 0; i < team.slots.length; i++) {
        var slot = team.slots[i];
        var combatRow = 4 + slot.row;
        var unitLike = builderUnitLikeFromSlot(sd, slot);
        if (!unitLike) continue;
        unitLike.__builderRow = slot.row;
        unitLike.__builderCol = slot.col;

        var held = !!(PIXI_BUILDER_R.heldBoardRC && PIXI_BUILDER_R.heldBoardRC.row === combatRow && PIXI_BUILDER_R.heldBoardRC.col === slot.col);
        var vis = pixiCreateBuilderToken(unitLike, PIXI_BUILDER_R.unitLayer, PIXI_BUILDER_R, function(u) {
            builderOnCellClick(4 + u.__builderRow, u.__builderCol);
        });
        pixiRedrawBuilderToken(vis, unitLike, combatRow, slot.col, PIXI_BUILDER_R, { selected: held });
    }
}

// Translucent tint over every player-side cell while a bench unit or a
// picked-up token is held -- "eligible hexes highlight" per the spec. Every
// row-4-7 cell is a valid drop target (occupied ones swap, empty ones move/
// place), so this highlights the whole zone rather than filtering by
// validity (team-size caps / one-family-one-slot are enforced by teams.js on
// drop, surfaced via showToast on failure -- see builderOnCellClick).
function builderUpdateHighlights() {
    if (!PIXI_BUILDER_R.highlightLayer) return;
    pixiDestroyAllChildren(PIXI_BUILDER_R.highlightLayer);
    if (!PIXI_BUILDER_R.heldBenchKey && !PIXI_BUILDER_R.heldBoardRC) return;

    var g = new PIXI.Graphics();
    var hexW = PIXI_BUILDER_R.cellW * 0.92;
    var hexH = PIXI_BUILDER_R.cellH * PIXI_CAM_Y_SQUASH * 0.92;
    for (var r = 4; r < PIXI_ROWS; r++) {
        for (var c = 0; c < PIXI_COLS; c++) {
            var center = boardToScreen(r, c, PIXI_BUILDER_R);
            g.poly(pixiHexPoints(center.x, center.y, hexW, hexH)).fill({ color: 0xe2b714, alpha: 0.14 });
        }
    }
    PIXI_BUILDER_R.highlightLayer.addChild(g);
}

// Builds the "unit-like" object pixiCreateBuilderToken()/pixiUnitTooltipHtml()
// (js/render-pixi.js) expect from a team.slots entry -- same derived-stats
// shape createUnit() in teams.js produces for real combat units, so the
// existing unit tooltip (reused unchanged, per the spec) renders sensibly.
function builderUnitLikeFromSlot(sd, slot) {
    var tmpl = UNIT_TEMPLATES[slot.key] || EVOLVED_TEMPLATES[slot.key];
    if (!tmpl) return null;
    var entry = sd.collection[slot.key];
    var stars = entry ? entry.stars : 1;
    var mult = getStarMultiplier(stars);
    var items = getEquippedItems(sd, slot.key);
    var itemEmojis = [];
    for (var i = 0; i < items.length; i++) itemEmojis.push(getItemEmoji(items[i]));

    return {
        key: slot.key,
        name: tmpl.name,
        element: tmpl.element,
        evolved: !!EVOLVED_TEMPLATES[slot.key],
        hp: Math.floor(tmpl.hp * mult),
        maxHp: Math.floor(tmpl.hp * mult),
        attack: Math.floor(tmpl.attack * mult),
        stars: stars,
        maxMana: 0,
        currentMana: 0,
        combatItems: itemEmojis,
        statusEffects: [],
        side: 'player'
    };
}

// Cheap safety net: a window resize while the builder screen is open doesn't
// have a per-frame loop to pick it up (unlike combat's rAF render loop), so
// nudge a refresh explicitly. No-ops instantly if the screen isn't current.
if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('resize', function() {
        if (typeof currentScreen !== 'undefined' && currentScreen === 'team-builder') {
            builderRefreshArena();
        }
    });
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
        html += '<div style="font-size:11px; color:#e2b714; margin-top:4px;">Click a unit on the arena to equip</div>';
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
                PIXI_BUILDER_R.heldBenchKey = null; // exit unit-placement mode
                PIXI_BUILDER_R.heldBoardRC = null;
            }
            renderTeamBuilderItemBar();
            builderUpdateHighlights();
        });
    }
}

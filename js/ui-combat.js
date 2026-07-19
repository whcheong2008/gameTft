// ui-combat.js -- combat screen UI: scoreboard, synergy bars, wave transitions, results (split from ui-v2.js)

// ---- Combat Screen ----

var pendingMissionIndex = -1;
var pendingMissionIsStory = false;
var combatBoard = null;
var combatEnemies = [];
var currentWaveConfig = null;
var missionStarTracking = { totalDamageTaken: 0, unitsLostTotal: 0 };

// Prompt 70 (Task 1): collapse state for the arena's overlay-drawer chrome
// panels (scoreboard, per-side synergy sidebars, the active-synergy bar).
// Plain UI state -- persists across frames but resets naturally whenever the
// combat screen is re-entered (a fresh page load / screen switch just
// re-declares this module, same as every other ui-combat.js var).
var combatDrawerCollapsed = { scoreboard: false, synergyLeft: false, synergyRight: false, synergyBar: false };

// Prompt 67: registered ONCE, at script-load time, via combatEvents.onPersistent()
// -- NOT per-wave. See the matching comment in js/render-dom.js (RENDER_DOM's
// floatingText/abilityFlash registration) for why: initCombat() can emit
// 'logMessage' (via combat-core.js's addCombatLog(), e.g. from a combat-start
// passive) before a per-wave on() listener registered after initCombat()
// returns would exist yet. addLogEntry itself is defined further down this
// file, but that's fine -- this closure doesn't call it until an event fires,
// long after the whole script has finished loading.
if (typeof combatEvents !== 'undefined' && typeof combatEvents.onPersistent === 'function') {
    combatEvents.onPersistent('logMessage', function(p) { addLogEntry(p.text, p.cls); });
}

// ---- Prompt 70 (Phase 3.4, Task 3): procedural arena backdrop per region ----
//
// Placeholder art (MASTERPLAN.md Phase 5 replaces this with real environment
// paintings): a layered CSS gradient scene painted into #arena-backdrop,
// keyed by region number. Deliberately renderer-agnostic (pure DOM/CSS, no
// Pixi/canvas involved) so it paints behind BOTH the Pixi and DOM combat
// boards -- ?renderer=dom still gets region theming, satisfying the "must
// still work in the new layout" requirement without a second implementation.
// Every color/position below is fixed per theme (no randomness anywhere in
// this function), which trivially satisfies the Prompt 67/68 PRNG rule
// (cosmetic randomness must never touch the seeded Math.random() stream) --
// there's simply no RNG call to get wrong.
var ARENA_BACKDROP_THEMES = {
    // Neutral void theme -- grind repeats with no story region context,
    // endless mode (js/endless.js), and the Survival challenge (js/challenges.js)
    // all resolve to this via getActiveMissionRegion() returning null/0.
    0: { glow: '#3a2a5e', accent: '#8a5cf0', blobA: '#1c1030', blobB: '#241640', blobC: '#150c26' },
    1: { glow: '#4a3a20', accent: '#caa15a', blobA: '#2a2010', blobB: '#332813', blobC: '#20180c' }, // R1 The Frontier -- dusty wilderness
    2: { glow: '#3a2f22', accent: '#ff8844', blobA: '#1c1816', blobB: '#26201a', blobC: '#150f0c' }, // R2 The Barracks Trials -- steel + campfire
    3: { glow: '#26305a', accent: '#66ccdd', blobA: '#12182a', blobB: '#182136', blobC: '#0c1220' }, // R3 The Synergy Trials -- arcane teal
    4: { glow: '#4a1e14', accent: '#ff5522', blobA: '#2a1008', blobB: '#33150c', blobC: '#1c0a05' }, // R4 The Shattered Lands -- apocalyptic
    5: { glow: '#16324a', accent: '#44aadd', blobA: '#0c1a2a', blobB: '#102436', blobC: '#081420' }, // R5 The Dual Convergence -- blue confluence
    6: { glow: '#3a2e4a', accent: '#e2b714', blobA: '#241a30', blobB: '#2e2240', blobC: '#180f22' }, // R6 The Elemental Crucible -- prismatic
    7: { glow: '#4a141e', accent: '#e2b714', blobA: '#2a0c14', blobB: '#33101a', blobC: '#1c060c' }, // R7 The Proving Grounds -- crimson arena
    8: { glow: '#100826', accent: '#8844ff', blobA: '#05030a', blobB: '#0a0512', blobC: '#030106' }  // R8 The Abyss Gate -- deep void
};

// Faint oversized hex-ish grid via two crossed repeating-linear-gradients --
// procedural placeholder, no image assets (per GRAPHICS-SESSION-HANDOFF.md,
// real environment art is Phase 5's job). `accent` is a 6-digit hex string;
// appending 2 hex digits of alpha ('22') is valid #RRGGBBAA CSS color syntax.
function arenaBdHexPatternCss(accent) {
    return 'repeating-linear-gradient(60deg, ' + accent + '22 0px, ' + accent + '22 1px, transparent 1px, transparent 42px), ' +
        'repeating-linear-gradient(-60deg, ' + accent + '22 0px, ' + accent + '22 1px, transparent 1px, transparent 42px)';
}

// regionNum: 1-8 for a story-region stage (activeMission.region, resolved by
// missions.js's getActiveMissionRegion()), or null/undefined/0 for
// grind/endless/challenge missions with no region context -- all fall back
// to the neutral void theme (theme 0). `elId` (Prompt 71) lets the team-
// builder-on-arena screen (js/ui-builder.js) reuse this exact theming against
// its own '#builder-backdrop' element; defaults to '#arena-backdrop' (combat)
// so every pre-existing call site is unaffected.
function buildArenaBackdrop(regionNum, elId) {
    var el = document.getElementById(elId || 'arena-backdrop');
    if (!el) return;
    var theme = ARENA_BACKDROP_THEMES[regionNum] || ARENA_BACKDROP_THEMES[0];
    if (el._backdropTheme === theme) return; // unchanged since the last wave -- skip the DOM rebuild
    el._backdropTheme = theme;

    el.innerHTML =
        '<div class="arena-bd-horizon" style="background:radial-gradient(ellipse 90% 60% at 50% 15%, ' + theme.glow + 'cc 0%, transparent 70%);"></div>' +
        '<div class="arena-bd-hexfield" style="background-image:' + arenaBdHexPatternCss(theme.accent) + ';"></div>' +
        '<div class="arena-bd-blob arena-bd-blob-a" style="background:' + theme.blobA + ';"></div>' +
        '<div class="arena-bd-blob arena-bd-blob-b" style="background:' + theme.blobB + ';"></div>' +
        '<div class="arena-bd-blob arena-bd-blob-c" style="background:' + theme.blobC + ';"></div>' +
        '<div class="arena-bd-vignette"></div>';
}

// ---- Prompt 71 (Phase 3.5, Task 3): relocated from js/render-dom.js ----
// These three used to live in the DOM renderer, but they're chrome that the
// PIXI renderer ALSO needs every frame (js/render-pixi.js's RENDER_PIXI.frame
// calls renderEncounterMechanicBanner/updateEncounterMechanicHud directly,
// and uiStartCombatLoop() below calls showCombatStartText() unconditionally,
// regardless of which renderer is active) -- deleting js/render-dom.js
// wholesale would have deleted these out from under the pixi renderer too.
// Moved verbatim (same DOM/CSS-class contract, same element IDs) rather than
// rewritten.

function showCombatStartText() {
    var area = document.getElementById('combat-area');
    if (!area) return;
    var overlay = document.createElement('div');
    overlay.className = 'combat-start-text';
    overlay.textContent = 'FIGHT!';
    area.appendChild(overlay);
    setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 1000);
}

// Prompt 76 (Phase 4.5, Task 3): "Wave N" sweep-in/out banner, alongside the
// "FIGHT!" pop above -- boss waves get a distinct heavier banner (bigger,
// slower, red-tinted). Called from uiStartCombatLoop() below, which fires
// every time the player actually starts a wave's combat (including every
// wave after the first -- see startMissionCombat()'s re-show of
// #combat-start-overlay at the end of every wave setup), so this naturally
// fires once per wave without any extra per-wave wiring. Pure chrome DOM,
// CSS-driven (game-v2.html's .wave-banner-sweep/.wave-banner-boss).
var PIXI_WAVE_BANNER_MS = 1300;       // TUNABLE: normal wave banner hold time
var PIXI_WAVE_BANNER_BOSS_MS = 1900;  // TUNABLE: boss wave banner hold time (heavier/slower)

function showWaveBanner() {
    var area = document.getElementById('combat-area');
    if (!area || !area.appendChild) return;
    var isBoss = !!(activeMission && activeMission.boss);
    var progress = (typeof getMissionProgress === 'function') ? getMissionProgress() : null;
    var text = isBoss ? '⚠️ BOSS FIGHT' : ('WAVE ' + (progress ? progress.currentWave : ''));
    var banner = document.createElement('div');
    banner.className = 'wave-banner-sweep' + (isBoss ? ' wave-banner-boss' : '');
    banner.textContent = text;
    area.appendChild(banner);
    var life = isBoss ? PIXI_WAVE_BANNER_BOSS_MS : PIXI_WAVE_BANNER_MS;
    setTimeout(function() { if (banner.parentNode) banner.parentNode.removeChild(banner); }, life);
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
            'background:rgba(20,20,30,0.9); border:1px solid var(--sv-gold); border-radius:var(--sv-radius-md); ' +
            'padding:6px 14px; font-size:12px; color:var(--sv-text-2); z-index:20; text-align:center; max-width:80%;';
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

// Called every render frame: keeps the countdown timer and escalation stack
// count visible during the fight.
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
            'background:rgba(20,20,30,0.85); border-radius:var(--sv-radius-sm); padding:4px 10px; ' +
            'font-size:11px; color:var(--sv-gold); z-index:20; text-align:center;';
        var boardEl2 = document.getElementById('combat-board');
        if (boardEl2 && boardEl2.appendChild) boardEl2.appendChild(hud);
    }
    hud.style.display = 'block';
    hud.textContent = parts.join('   ');
}

function beginCombatScreen(sd) {
    showScreen('combat');
    // Prompt 81 (Phase 7): region-tier/boss/endless-aware combat music.
    // activeMission (js/missions.js) is already set by startMission() before
    // this is called by every entry point (story/grind/endless/challenges).
    if (typeof AUDIO !== 'undefined' && AUDIO.onCombatStart) AUDIO.onCombatStart(activeMission, sd);
    missionStarTracking = { totalDamageTaken: 0, unitsLostTotal: 0 };

    // Reset speed button display
    var speedBtn = document.getElementById('speed-btn');
    if (speedBtn) speedBtn.textContent = COMBAT_SPEED + '\u00d7';

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

    // Prompt 64: endless mode / Survival challenge generate their own
    // tier-weighted enemy rosters (see js/endless.js's generateEndlessEnemies)
    // instead of the generic per-stage generateMissionWave(), and "Wave N/M"
    // doesn't make sense for either (both are open-ended).
    if (activeMission && activeMission.isEndless) {
        document.getElementById('wave-info').textContent = '🕳️ The Abyss — Floor ' + endlessRunState.floor;
        combatEnemies = generateEndlessEnemies(endlessRunState.floor);
    } else if (activeMission && activeMission.isChallengeSurvival) {
        document.getElementById('wave-info').textContent = '🌊 Survival — Wave ' + survivalRunState.wave;
        combatEnemies = generateEndlessEnemies(survivalRunState.wave);
    } else {
        document.getElementById('wave-info').textContent =
            progress.missionName + ' — Wave ' + progress.currentWave + ' / ' + progress.totalWaves;
        combatEnemies = generateMissionWave(waveConfig);
    }

    // Store wave config for combat init to read
    currentWaveConfig = waveConfig;

    // Clear log
    var logEl = document.getElementById('combat-log');
    logEl.innerHTML = '';
    if (activeMission && activeMission.isEndless) {
        addLogEntry('⚔️ Floor ' + endlessRunState.floor + ' begins!', 'info');
    } else if (activeMission && activeMission.isChallengeSurvival) {
        addLogEntry('⚔️ Wave ' + survivalRunState.wave + ' begins!', 'info');
    } else {
        addLogEntry('⚔️ Wave ' + progress.currentWave + ' begins!', 'info');
    }

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

    // Prompt 64: endless mode's pure-stat floor modifiers (enemy ATK/DR up,
    // player healing/attack-speed down) are applied directly to combatState
    // here, right after initCombat()'s per-unit resets run -- the same timing
    // synergy/hero bonuses already use. Encounter-mechanic-kind modifiers need
    // no seam: they ride activeMission.encounterMechanic, which initCombat()
    // already reads via setupCombatEncounterMechanics(). No-op outside endless.
    if (typeof applyEndlessFloorModifierEffects === 'function') applyEndlessFloorModifierEffects(combatState);

    // Prompt 70 (Task 3): paint the region backdrop for this wave. Cheap to
    // call every wave -- buildArenaBackdrop() no-ops if the theme hasn't
    // changed since the last call (same region across a multi-wave mission).
    if (typeof buildArenaBackdrop === 'function') {
        buildArenaBackdrop(typeof getActiveMissionRegion === 'function' ? getActiveMissionRegion() : null);
    }

    // Prompt 67: resolve + init the active renderer for this wave. The
    // combatEvents listeners it needs (floatingText/abilityFlash) and the
    // 'logMessage' chrome listener above are registered once at script-load
    // time (combatEvents.onPersistent(), see js/render-dom.js and the top of
    // this file) -- they survive initCombat()'s per-wave combatEvents.reset(),
    // so there's nothing per-wave to (re)register here anymore, just the
    // renderer's own per-wave init() (board DOM cleanup).
    var activeRenderer = (typeof getActiveRenderer === 'function') ? getActiveRenderer() : null;
    if (activeRenderer && typeof activeRenderer.init === 'function') {
        var rendererProgress = getMissionProgress();
        activeRenderer.init(document.getElementById('combat-area'), combatState, {
            missionName: rendererProgress ? rendererProgress.missionName : null,
            waveIndex: rendererProgress ? rendererProgress.currentWave : null,
            totalWaves: rendererProgress ? rendererProgress.totalWaves : null,
            encounterMechanic: activeMission ? activeMission.encounterMechanic : null,
            isBoss: !!(activeMission && activeMission.boss)
        });
    }

    // Render synergy bar
    renderCombatSynergyBar();

    // Show start overlay instead of immediately starting combat
    document.getElementById('combat-start-overlay').className = 'combat-start-overlay show';

    // Defer initial board render until after the browser has laid out the combat screen.
    // On first load after refresh, offsetWidth/offsetHeight are 0 if we render synchronously,
    // which causes all unit overlays to stack at (0,0).
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            renderCombatFrame(0);
        });
    });
}

var COMBAT_TICK_MS = 50; // 20 fps
var COMBAT_DT = COMBAT_TICK_MS / 1000;
var COMBAT_SPEED = 1; // 1, 2, or 4

// Prompt 67: renderer + render-loop bookkeeping. The combat tick pump
// (setTimeout, COMBAT_TICK_MS-cadenced, unchanged from before this refactor)
// and the render loop (requestAnimationFrame, browser-cadenced) are now two
// independent loops instead of one fused setTimeout callback -- see
// uiStartCombatLoop() below. combatRenderLoopActive is the render loop's own
// stop flag; a stray leftover requestAnimationFrame callback checks it and
// no-ops instead of rendering/rescheduling once combat has ended.
var combatRenderLoopActive = false;

// Renders one frame through whichever renderer is active. Prompt 71: there
// is no more DOM board renderer to fall back to (js/render-dom.js is
// deleted) -- if getActiveRenderer() resolves nothing (PIXI never loaded, or
// its Application.init() rejected), this simply renders nothing rather than
// silently drawing a deleted renderer's board; js/render-pixi.js's WebGL-
// init-failure path shows its own "requires WebGL" notice separately.
//
// Prompt 70 (Task 5): re-resolves getActiveRenderer() on every call instead
// of taking a renderer reference from the caller, so a stale captured
// reference can never keep driving a renderer that has since torn itself
// down mid-wave.
function renderCombatFrame(dtMs) {
    var renderer = (typeof getActiveRenderer === 'function') ? getActiveRenderer() : null;
    if (renderer && typeof renderer.frame === 'function') {
        renderer.frame(dtMs);
    }
}

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
    renderCombatFrame(0);

    // Show FIGHT! text + the per-wave banner sweep (Prompt 76, Task 3)
    showCombatStartText();
    showWaveBanner();

    // Prompt 67: the combat tick (logic pump) and the render loop are now
    // independent. The tick pump keeps its exact pre-refactor cadence/
    // semantics (setTimeout, COMBAT_TICK_MS, COMBAT_SPEED ticks per call).
    function tickLoop() {
        // Run multiple physics ticks per frame at higher speeds
        for (var s = 0; s < COMBAT_SPEED; s++) {
            if (combatState && combatState.running) {
                combatTick(COMBAT_DT);
            }
        }

        if (combatState && combatState.running) {
            setTimeout(tickLoop, COMBAT_TICK_MS);
        } else {
            // Render the final post-combat state once more before handing off
            // to the results/wave-transition flow -- guarantees a render always
            // happens immediately before onWaveCombatEnd(), exactly like the old
            // fused loop did, regardless of how the independent rAF render loop
            // below happens to be scheduled relative to this setTimeout.
            combatRenderLoopActive = false;
            renderCombatFrame(0);
            onWaveCombatEnd();
        }
    }

    // Render loop: requestAnimationFrame, decoupled from the tick pump above.
    combatRenderLoopActive = true;
    var lastFrameTime = null;
    function renderLoop(now) {
        if (!combatRenderLoopActive) return;
        var dtMs = lastFrameTime === null ? 0 : (now - lastFrameTime);
        lastFrameTime = now;
        renderCombatFrame(dtMs);
        if (combatRenderLoopActive) requestAnimationFrame(renderLoop);
    }
    requestAnimationFrame(renderLoop);

    setTimeout(tickLoop, COMBAT_TICK_MS);
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

// Prompt 67: spawnDamageNumber/flashAbilityCells are logic-layer
// combatEvents-emitting shims defined in combat-core.js (see the Prompt 67
// comment block there); the active renderer subscribes to the
// 'floatingText'/'abilityFlash' combatEvents they emit (js/render-pixi.js
// does today -- js/render-dom.js used to as well, before Prompt 71 deleted
// it). showCombatStartText() lives above in this file (relocated from
// render-dom.js by Prompt 71, Task 3) since it's called unconditionally by
// uiStartCombatLoop() below regardless of which renderer is active.

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

    // Prompt 64: endless mode and the Survival challenge are both
    // continuous, open-ended "missions" (see js/endless.js and
    // js/challenges.js) that manage their own floor/wave progression and
    // never use the generic star-rated results screen -- route to them
    // before any of the normal win/loss handling below.
    if (activeMission && activeMission.isEndless) {
        onEndlessFloorEnd(result === 'win');
        return;
    }
    if (activeMission && activeMission.isChallengeSurvival) {
        onSurvivalWaveEnd(result === 'win');
        return;
    }
    // Time Trial accumulates elapsed combat time across every wave of its
    // (possibly multi-wave) stage, win or lose, so a losing attempt doesn't
    // silently drop the clock -- only used at victory time in
    // renderChallengeVictoryResults().
    if (activeMission && activeMission.isChallengeTimeTrial && typeof accumulateTimeTrialElapsed === 'function') {
        accumulateTimeTrialElapsed();
    }

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

// Prompt 64: skipHpReset lets endless/survival floor transitions reuse this
// exact restore-to-board logic (position/cooldown/status reset, dead units
// dropped) while carrying HP forward instead of fully healing -- "no healing
// reset — units keep current HP; dead units stay dead for the run" per the
// endless mode spec. Regular mission wave transitions call this with no
// argument and are unaffected (skipHpReset is falsy -> full heal as before).
function healBoardUnits(skipHpReset) {
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
                if (!skipHpReset) u.hp = u.maxHp;
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

// Prompt 71 (Phase 3.5, Task 2): wave-transition repositioning moved from a
// separate flat DOM grid (renderWaveRepositionGrid, deleted) onto the same
// arena the fight just used -- js/render-pixi.js's pixiEnterRepositionMode()
// adds click affordances directly on top of the already-mounted, frozen
// combat tokens; this file keeps owning what a click MEANS (below), exactly
// like it owned onWaveRepositionClick()'s combatBoard bookkeeping before.
//
// waveRepositionSelected now holds COMBAT grid coordinates (row 4-7),
// matching unit.gridRow/gridCol directly -- the pre-Prompt-71 version stored
// combatBoard's own 0-3 "team builder row" indices instead, which meant its
// `srcUnit.gridRow = row` line was quietly wrong (it should have been `4 +
// row`; see js/combat-core.js's initCombat(), which is the actual source of
// truth for the 4+r mapping). That bug was harmless there ONLY because the
// separate DOM grid never read unit.gridRow to position anything and the
// NEXT wave's initCombat() always overwrites gridRow fresh from combatBoard
// indices anyway -- but this version reuses the arena's real token
// positions (pixiRedrawAfterReposition reads unit.gridRow directly), so it
// has to get this right.
var waveRepositionSelected = null; // {row, col} in COMBAT coords (4-7), or null

function showWaveTransition() {
    var progress = getMissionProgress();
    document.getElementById('wave-text').textContent = 'Wave ' + progress.currentWave;
    var subEl = document.getElementById('wave-subtext');
    if (subEl) subEl.textContent = 'Tap a unit to reposition it, then continue';
    document.getElementById('wave-transition').className = 'wave-transition show';
    waveRepositionSelected = null;
    // Prompt 64: endless mode's floor-transition screen (showEndlessFloorTransition
    // in js/endless.js) reuses this same #wave-transition overlay but hides the
    // default button and injects its own Continue/Retreat controls -- restore
    // both to their normal state here so a regular mission's wave transition
    // is never left showing endless-mode leftovers.
    var defaultBtn = document.querySelector('#wave-transition .btn-primary');
    if (defaultBtn) defaultBtn.style.display = '';
    var endlessContainer = document.getElementById('endless-transition-controls');
    if (endlessContainer) endlessContainer.remove();
    if (typeof pixiEnterRepositionMode === 'function') pixiEnterRepositionMode(onWaveRepositionClick);
}

// `row`/`col` are COMBAT grid coordinates (row 4-7) -- see the header comment
// above. Called either from a token's own pointertap (js/render-pixi.js's
// pixiCreateVisual wiring) or from an empty hex's tile-hit target
// (pixiBuildRepositionTileHits), uniformly, so this function never needs to
// know which one fired.
function onWaveRepositionClick(row, col) {
    var br = row - 4, bc = col; // combatBoard index (0-3)
    if (br < 0 || br > 3) return; // defensive: reposition only ever targets player rows
    var unit = combatBoard[br][bc];

    if (waveRepositionSelected) {
        var sr = waveRepositionSelected.row - 4, sc = waveRepositionSelected.col;
        var srcUnit = combatBoard[sr][sc];

        // Swap or move
        combatBoard[sr][sc] = combatBoard[br][bc];
        combatBoard[br][bc] = srcUnit;

        // Update grid positions on the unit objects themselves (4 + board
        // row -- see js/combat-core.js's initCombat(), the source of truth
        // for this mapping).
        if (srcUnit) { srcUnit.gridRow = row; srcUnit.gridCol = col; }
        if (combatBoard[sr][sc]) { combatBoard[sr][sc].gridRow = waveRepositionSelected.row; combatBoard[sr][sc].gridCol = waveRepositionSelected.col; }

        waveRepositionSelected = null;
    } else if (unit && unit.hp > 0) {
        waveRepositionSelected = { row: row, col: col };
    } else {
        return; // empty cell clicked with nothing held -- no-op
    }

    if (typeof pixiSetRepositionSelection === 'function') pixiSetRepositionSelection(waveRepositionSelected);
}

function uiNextWave() {
    document.getElementById('wave-transition').className = 'wave-transition';
    if (typeof pixiExitRepositionMode === 'function') pixiExitRepositionMode();
    waveRepositionSelected = null;
    startWaveCombat();
}

// Prompt 80: wraps a piece of results content in one ".p80-reward-row" line
// of the results sequence sheet. Pure markup helper -- every call site below
// still decides WHETHER/WHEN to add a row exactly like the old `rewardHtml +=`
// chain did, this just standardizes the wrapper.
function p80ResultsRow(innerHtml, extraClass) {
    return '<div class="p80-reward-row' + (extraClass ? ' ' + extraClass : '') + '">' + innerHtml + '</div>';
}

function showMissionResults(victory, stars) {
    // Prompt 81 (Phase 7): victory fanfare / defeat swell + results music
    // context. Single choke point for every story/grind/challenge mission's
    // true end (endless/survival use AUDIO.onEndlessEnd() instead -- see
    // js/endless.js/js/challenges.js -- since they never call this).
    if (typeof AUDIO !== 'undefined' && AUDIO.onMissionResults) AUDIO.onMissionResults(victory, stars);
    // Hide wave transition overlay if still showing
    document.getElementById('wave-transition').className = 'wave-transition';
    if (typeof pixiExitRepositionMode === 'function') pixiExitRepositionMode();

    var sd = getSaveData();

    var titleEl = document.getElementById('results-title');
    titleEl.textContent = victory ? 'Victory!' : 'Defeat';
    titleEl.className = 'results-title p80-results-title ' + (victory ? 'victory' : 'defeat');

    // Prompt 80: star pips animate in one at a time (staggered animation-delay)
    // instead of appearing as flat text -- same 0-3 `stars` value as before,
    // and defeat still renders no pips at all (starsHtml stays '').
    var starsHtml = '';
    if (victory) {
        for (var i = 0; i < 3; i++) {
            var pipFilled = i < stars;
            starsHtml += '<span class="p80-star-pip' + (pipFilled ? ' filled' : '') + '" style="animation-delay:' + (i * 0.12) + 's;">' + (pipFilled ? '⭐' : '☆') + '</span>';
        }
    }
    document.getElementById('results-stars').innerHTML = starsHtml;

    if (victory && activeMission) {
        // Prompt 64: Time Trial / Restricted Roster / Element Boss challenges
        // grant custom, non-star-scaled rewards (par-time bonus, restriction
        // VE multiplier, first-clear essence) that calculateMissionRewards()
        // doesn't model -- js/challenges.js's renderChallengeVictoryResults()
        // fully owns #results-rewards for these missions and returns early.
        if (activeMission.isChallengeTimeTrial || activeMission.isChallengeRestricted || activeMission.isChallengeElementBoss) {
            if (typeof renderChallengeVictoryResults === 'function') renderChallengeVictoryResults(sd, activeMission);
            document.getElementById('combat-results').className = 'combat-results show';
            renderTopBar();
            return;
        }
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

        // Prompt 80: rewards are now collected as an ordered array of
        // ".p80-reward-row" strings, joined once at the end, instead of the
        // old single `rewardHtml +=` chain -- every condition/order below is
        // identical to before, only the markup shape changed.
        var rewardRows = [];

        rewardRows.push(p80ResultsRow(
            '<span class="text-gold">✨ +' + rewards.gold + ' VE' + goldBonusText + '</span>' +
            '<span class="text-green">📈 +' + rewards.xp + ' XP' + xpBonusText + '</span>',
            'p80-reward-primary'
        ));

        // Show unit copies earned
        if (rewards.unitCopies && rewards.unitCopies.length > 0) {
            var unitChips = '';
            for (var ri = 0; ri < rewards.unitCopies.length; ri++) {
                var rKey = rewards.unitCopies[ri];
                var rTmpl = UNIT_TEMPLATES[rKey];
                if (rTmpl) {
                    unitChips += '<span class="sv-chip tier-' + (rTmpl.cost || 1) + '">' + ELEMENTS[rTmpl.element].emoji + ' ' + rTmpl.name + '</span>';
                }
            }
            rewardRows.push(p80ResultsRow('<span class="p80-reward-label">Units earned</span><span class="p80-reward-chips">' + unitChips + '</span>'));
        }

        // Show equipment drops (new system)
        if (rewards.equipmentDrops && rewards.equipmentDrops.length > 0) {
            var itemChips = '';
            for (var ii = 0; ii < rewards.equipmentDrops.length; ii++) {
                var drop = rewards.equipmentDrops[ii];
                var dropColor = getItemRarityColor(drop);
                itemChips += '<span class="sv-chip" style="border-color:' + dropColor + ';">' + getItemEmoji(drop) + ' ' + getItemName(drop) +
                    ' <span style="color:' + dropColor + ';">T' + drop.tier + ' ' + getItemRarityName(drop) + '</span></span>';
            }
            rewardRows.push(p80ResultsRow('<span class="p80-reward-label">Equipment found</span><span class="p80-reward-chips">' + itemChips + '</span>'));
        }

        // Show essence drops
        if (rewards.essenceDropsNew) {
            var enKeys = Object.keys(rewards.essenceDropsNew);
            if (enKeys.length > 0) {
                var essChips = '';
                for (var eid = 0; eid < enKeys.length; eid++) {
                    var essKey = enKeys[eid];
                    var essData = ESSENCES[essKey];
                    var essColor = essData ? essData.color : '#fff';
                    essChips += '<span class="sv-chip" style="border-color:' + essColor + '; color:' + essColor + ';">' + (essData ? essData.emoji : '') + ' ' + essKey + ' x' + rewards.essenceDropsNew[essKey] + '</span>';
                }
                rewardRows.push(p80ResultsRow('<span class="p80-reward-label">Essences</span><span class="p80-reward-chips">' + essChips + '</span>'));
            }
        }

        // Show gem drops
        if (rewards.gemDrops && rewards.gemDrops.length > 0) {
            var gemChips = '';
            for (var gdi = 0; gdi < rewards.gemDrops.length; gdi++) {
                gemChips += '<span class="sv-chip">💎 ' + rewards.gemDrops[gdi] + '</span>';
            }
            rewardRows.push(p80ResultsRow('<span class="p80-reward-label">Gems</span><span class="p80-reward-chips">' + gemChips + '</span>'));
        }

        document.getElementById('results-rewards').innerHTML = rewardRows.join('');

        // Mark story mission complete FIRST (so boss clear raises level cap before XP is awarded)
        if (pendingMissionIsStory && pendingMissionIndex >= 0) {
            completeStoryMission(sd, pendingMissionIndex, stars);
        }

        var leveled = applyMissionRewards(sd, rewards);
        if (leveled) {
            document.getElementById('results-rewards').innerHTML +=
                p80ResultsRow('LEVEL UP!', 'p80-reward-levelup text-green');
        }

        // Show hero level-ups
        if (rewards.heroLevelUps && rewards.heroLevelUps.length > 0) {
            var heroLvChips = '';
            for (var hli = 0; hli < rewards.heroLevelUps.length; hli++) {
                var hlvl = rewards.heroLevelUps[hli];
                heroLvChips += '<span class="sv-chip">' + hlvl.name + ' Lv.' + hlvl.oldLevel + ' \u2192 Lv.' + hlvl.newLevel + '</span>';
            }
            document.getElementById('results-rewards').innerHTML +=
                p80ResultsRow('<span class="p80-reward-label">Hero Level Ups</span><span class="p80-reward-chips">' + heroLvChips + '</span>');
        }

        // Show hero events (unlocks, deaths, departures)
        if (sd._pendingHeroEvents && sd._pendingHeroEvents.length > 0) {
            for (var hei = 0; hei < sd._pendingHeroEvents.length; hei++) {
                var hevt = sd._pendingHeroEvents[hei];
                var evtColor = hevt.type === 'death' ? 'var(--sv-red)' : (hevt.type === 'leave' ? '#ff8844' : 'var(--sv-green)');
                var evtIcon = hevt.type === 'unlock' ? '🆕' : (hevt.type === 'death' ? '💀' : (hevt.type === 'leave' ? '👋' : (hevt.type === 'return' ? '🔙' : '👻')));
                var evtMsg = hevt.message || (hevt.type === 'unlock' ? 'Hero ' + hevt.name + ' has joined!' : hevt.name);
                document.getElementById('results-rewards').innerHTML +=
                    p80ResultsRow('<span style="color:' + evtColor + '; font-weight:bold;">' + evtIcon + ' ' + evtMsg + '</span>');
            }
            sd._pendingHeroEvents = [];
            autoSave(sd);
        }

        // Check achievements after mission
        var missionAch = checkAchievements(sd);
        if (missionAch.length > 0) { autoSave(sd); showAchievementToasts(missionAch); }
    } else {
        document.getElementById('results-rewards').innerHTML = p80ResultsRow('No rewards earned.', 'p80-reward-empty text-muted');
    }

    // MVP card
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
            var mvpHtml = '<div class="p80-mvp-card"><span class="p80-mvp-badge">MVP</span>' +
                mvpEmoji + (mvp.name || 'Unit') + ' — ' +
                formatNum(mvp.combatStats.damageDealt) + ' damage' +
                (mvp.combatStats.kills > 0 ? ', ' + mvp.combatStats.kills + ' kill' + (mvp.combatStats.kills > 1 ? 's' : '') : '') +
                '</div>';
            document.getElementById('results-rewards').innerHTML += mvpHtml;
        }
    }

    // Prompt 76 (Phase 4.5, Task 3): victory/defeat sequence -- a short
    // render-only cosmetic beat (victory: slow-mo + gold burst over
    // survivors; defeat: desaturation fade) plays BEFORE the results DOM is
    // actually revealed. Every reward/save mutation above this point already
    // ran synchronously (unchanged) -- only the final reveal + top-bar
    // refresh is deferred. Falls straight through to an immediate reveal
    // when pixiPlayResultSequence isn't available (js/render-pixi.js not
    // loaded) or no-ops internally (no live renderer/PIXI app, e.g. headless
    // tests) -- see that function's own early-out for the exact conditions.
    //
    // Prompt 80: the defeat variant gets an extra ".p80-results-defeat" class
    // (desaturated sequence-sheet styling) alongside the pre-existing "show"
    // toggle -- endless.js/challenges.js reuse this same #combat-results
    // overlay for their own win/loss screens via their own direct className
    // assignments, so this extra class only ever applies on the path this
    // function itself owns.
    var revealResults = function() {
        document.getElementById('combat-results').className = 'combat-results show' + (victory ? '' : ' p80-results-defeat');
        renderTopBar();
    };
    if (typeof pixiPlayResultSequence === 'function') {
        pixiPlayResultSequence(victory, revealResults);
    } else {
        revealResults();
    }
}

function uiReturnFromCombat() {
    activeMission = null;
    // Prompt 64: defensively end any endless/survival run state so a stray
    // return-to-hub mid-run (rather than via Retreat/defeat) can't leave a
    // "phantom" active run behind.
    if (typeof endlessRunState !== 'undefined' && endlessRunState) endlessRunState.active = false;
    if (typeof survivalRunState !== 'undefined' && survivalRunState) survivalRunState.active = false;
    var endlessControls = document.getElementById('endless-transition-controls');
    if (endlessControls) endlessControls.remove();
    // Clean up any lingering overlays
    document.getElementById('combat-results').className = 'combat-results';
    document.getElementById('wave-transition').className = 'wave-transition';
    if (typeof pixiExitRepositionMode === 'function') pixiExitRepositionMode();
    // Prompt 67: stop the render loop and let the active renderer tear down
    // everything it put on the battlefield (unit overlay layer, damage
    // numbers, enrage timer -- was inline DOM cleanup here before this
    // refactor; see RENDER_DOM.destroy() in js/render-dom.js).
    combatRenderLoopActive = false;
    var endingRenderer = (typeof getActiveRenderer === 'function') ? getActiveRenderer() : null;
    if (endingRenderer && typeof endingRenderer.destroy === 'function') endingRenderer.destroy();
    showScreen('hub');
}

// Prompt 71 (Task 3): renderCombatUnitCell/buildUnitCellHtml/renderCombatBoard
// (the DOM board renderer's cell-building functions) were deleted along with
// js/render-dom.js -- Pixi draws unit tokens directly on canvas now (see
// js/render-pixi.js's pixiRedrawToken). This file keeps only chrome:
// renderCombatScoreboard() below (scoreboard sidebar), still called every
// frame from js/render-pixi.js's RENDER_PIXI.frame the same way the old DOM
// renderer's renderCombatBoard() used to call it.

// ---- Combat Scoreboard ----

function formatNum(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return '' + n;
}

// Prompt 70 (Task 1): click-to-collapse toggles for the arena's overlay
// drawers. Chrome-only (no gameplay effect) -- toggling never touches
// combatState/combatEvents, only the CSS .collapsed class defined in
// game-v2.html's "Combat Scoreboard + per-side synergy sidebars" block.
function toggleCombatScoreboard() {
    combatDrawerCollapsed.scoreboard = !combatDrawerCollapsed.scoreboard;
    var sb = document.getElementById('combat-scoreboard');
    if (sb) sb.classList.toggle('collapsed', combatDrawerCollapsed.scoreboard);
}

function toggleSynergySidebar(side) {
    var key = side === 'left' ? 'synergyLeft' : 'synergyRight';
    combatDrawerCollapsed[key] = !combatDrawerCollapsed[key];
    var container = document.getElementById('synergy-sidebar-' + side);
    if (container) container.classList.toggle('collapsed', combatDrawerCollapsed[key]);
}

function toggleCombatSynergyBar() {
    combatDrawerCollapsed.synergyBar = !combatDrawerCollapsed.synergyBar;
    var bar = document.getElementById('combat-synergy-bar');
    if (bar) bar.classList.toggle('collapsed', combatDrawerCollapsed.synergyBar);
}

function toggleCombatLogExpand() {
    var log = document.getElementById('combat-log');
    if (log) log.classList.toggle('expanded');
}

function renderCombatScoreboard() {
    var sb = document.getElementById('combat-scoreboard');
    if (!sb || !combatState) return;

    var html = '<div class="sb-header" onclick="toggleCombatScoreboard()">Combat Stats</div>';

    // Player units sorted by damage dealt descending
    var pUnits = combatState.playerUnits.slice().sort(function(a, b) {
        return (b.combatStats ? b.combatStats.damageDealt : 0) - (a.combatStats ? a.combatStats.damageDealt : 0);
    });

    html += '<div style="color:var(--sv-blue); font-size:10px; padding:2px 4px; font-weight:bold;">Your Team</div>';
    for (var i = 0; i < pUnits.length; i++) {
        var u = pUnits[i];
        var stats = u.combatStats || {damageDealt:0, damageTaken:0, healingDone:0};
        var deadClass = u.hp <= 0 ? ' dead' : '';
        html += '<div class="sb-unit' + deadClass + '">';
        html += '<div class="sb-name">' + (u.emoji || '') + ' ' + (u.name || 'Unit');
        if (u.maxMana && u.maxMana > 0 && u.hp > 0) {
            html += ' <span style="color:var(--sv-blue); font-size:9px;">\u26A1' + (u.currentMana || 0) + '/' + u.maxMana + '</span>';
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

    html += '<div style="color:var(--sv-red); font-size:10px; padding:2px 4px; margin-top:4px; font-weight:bold;">Enemy Team</div>';
    for (var j = 0; j < eUnits.length; j++) {
        var e = eUnits[j];
        var eStats = e.combatStats || {damageDealt:0, damageTaken:0, healingDone:0};
        var eDeadClass = e.hp <= 0 ? ' dead' : '';

        if (e.isBoss) {
            // Boss-specific scoreboard entry
            html += '<div class="sb-unit boss-sb' + eDeadClass + '">';
            html += '<div class="sb-name enemy" style="color:var(--sv-red);font-size:12px;">👑 ' + e.name + '</div>';
            html += '<div class="sb-stats" style="font-size:10px;">';
            html += '<span style="color:var(--sv-red);">Phase ' + (e.currentPhase + 1) + '</span>';
            html += '<span class="dmg">' + formatNum(eStats.damageDealt) + ' dmg</span>';
            html += '</div>';
            if (e.hp > 0) {
                var bossHpPct = Math.floor(e.hp / e.maxHp * 100);
                html += '<div class="sb-stats"><span style="color:var(--sv-red);">' + formatNum(e.hp) + '/' + formatNum(e.maxHp) + ' HP (' + bossHpPct + '%)</span></div>';
            }
            html += '<div class="sb-stats"><span class="taken">' + formatNum(eStats.damageTaken) + ' taken</span></div>';
            html += '</div>';
        } else {
            html += '<div class="sb-unit' + eDeadClass + '">';
            html += '<div class="sb-name enemy">' + (e.emoji || '') + ' ' + (e.name || 'Enemy');
            if (e.maxMana && e.maxMana > 0 && e.hp > 0) {
                html += ' <span style="color:var(--sv-blue); font-size:9px;">\u26A1' + (e.currentMana || 0) + '/' + e.maxMana + '</span>';
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
    bar.classList.toggle('collapsed', combatDrawerCollapsed.synergyBar);

    // Use vertical layout for readable synergy descriptions. Prompt 70: body
    // content is built separately from the (always-present) collapsible
    // header so the pre-existing "No active synergies" fallback can still
    // detect an empty body, same as before this task's drawer-header wrap.
    var bodyHtml = '';

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
                thresholdStr += (th === tierReached - 1 ? '<b style="color:var(--sv-gold);">' + arch.thresholds[th] + '</b>' : '<span style="color:var(--sv-border-strong);">' + arch.thresholds[th] + '</span>');
                if (th < arch.thresholds.length - 1) thresholdStr += '/';
            }
            bodyHtml += '<div class="p80-synergy-entry" style="background:var(--sv-bg-2); border-left-color:var(--sv-gold);">' +
                '<div style="font-size:11px;">' + arch.emoji + ' <b>' + arch.name + '</b> <span style="color:var(--sv-gold);">' + count + '</span> (' + thresholdStr + ')</div>' +
                '<div style="font-size:10px; color:var(--sv-text-3); margin-top:1px;">' + archDesc + '</div></div>';
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
        var bgColor = isPrismatic ? '#5a4a2e' : 'var(--sv-bg-2)';
        var borderColor = isPrismatic ? 'var(--sv-gold)' : (elemSyn.color || 'var(--sv-border-strong)');
        var eTierReached = 0;
        for (var et = 0; et < elemSyn.thresholds.length; et++) {
            if (eCount >= elemSyn.thresholds[et]) eTierReached = et + 1;
        }
        var elemDesc = (eTierReached > 0 && elemSyn.bonuses[eTierReached - 1]) ? elemSyn.bonuses[eTierReached - 1].desc : '';
        var eThresholdStr = '';
        for (var eth = 0; eth < elemSyn.thresholds.length; eth++) {
            eThresholdStr += (eth === eTierReached - 1 ? '<b style="color:' + (elemSyn.color || 'var(--sv-gold)') + ';">' + elemSyn.thresholds[eth] + '</b>' : '<span style="color:var(--sv-border-strong);">' + elemSyn.thresholds[eth] + '</span>');
            if (eth < elemSyn.thresholds.length - 1) eThresholdStr += '/';
        }
        bodyHtml += '<div class="p80-synergy-entry" style="background:' + bgColor + '; border-left-color:' + borderColor + ';">' +
            '<div style="font-size:11px; color:' + (elemSyn.color || 'var(--sv-text-1)') + ';">' + elemSyn.emoji + ' <b>' + elemSyn.name + '</b> <span style="color:' + (elemSyn.color || 'var(--sv-gold)') + ';">' + eCount + '</span> (' + eThresholdStr + ')</div>' +
            '<div style="font-size:10px; color:var(--sv-text-3); margin-top:1px;">' + elemDesc + '</div></div>';
    }

    var header = '<div class="arena-drawer-header p80-drawer-header" onclick="toggleCombatSynergyBar()">Synergies</div>';
    bar.innerHTML = header + '<div class="arena-drawer-body" style="display:flex; flex-direction:column; gap:3px;">' +
        (bodyHtml || '<span class="text-muted">No active synergies</span>') + '</div>';
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
        container.style.cssText = 'font-size:10px; padding:4px; background:var(--sv-bg-2); border-radius:var(--sv-radius-sm); min-width:80px;';
        var combatMain = document.getElementById('combat-main');
        if (combatMain) {
            if (side === 'left') {
                combatMain.insertBefore(container, combatMain.firstChild);
            } else {
                combatMain.appendChild(container);
            }
        }
    }

    // Prompt 70 (Task 1): the container's own CSS class (position/width/
    // collapse styling) lives in game-v2.html's ID-selector stylesheet rules
    // -- the inline cssText above only pins cosmetic fill/padding/font, so it
    // can't clobber those. The label header doubles as the collapse toggle.
    container.classList.toggle('collapsed', combatDrawerCollapsed[side === 'left' ? 'synergyLeft' : 'synergyRight']);
    container.innerHTML = '<div class="p80-drawer-header" style="margin-bottom:2px;" onclick="toggleSynergySidebar(\'' + side + '\')">' + label + '</div>';

    // Elements
    var allElements = Object.keys(ELEMENTS);
    for (var ei = 0; ei < allElements.length; ei++) {
        var element = allElements[ei];
        var count = synergies.elements[element] || 0;
        if (count === 0) continue;

        var item = document.createElement('div');
        item.style.cssText = 'padding:1px 0;' + (count >= 2 ? ' color:var(--sv-gold);' : ' color:var(--sv-text-3);');

        var thresholdMarkers = '';
        var thresholds = [2, 4, 7, 10];
        for (var t = 0; t < thresholds.length; t++) {
            var lit = count >= thresholds[t];
            thresholdMarkers += '<span style="color:' + (lit ? 'var(--sv-gold)' : 'var(--sv-border)') + ';">●</span>';
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
        aItem.style.cssText = 'padding:1px 0;' + (isActive ? ' color:var(--sv-gold);' : ' color:var(--sv-text-3);');
        aItem.textContent = archData.emoji + ' ' + aCount;
        container.appendChild(aItem);
    }
}

// Prompt 71 (Task 3): initCombatUnitTooltips() (Prompt 20 Phase D2) was
// deleted along with js/render-dom.js -- it read/wrote #combat-board
// .combat-cell DOM elements that no longer exist (Pixi draws the board on
// canvas), and it was already pre-existing dead code before this prompt
// (nothing in the codebase called it; flagged in the Prompt 67 report).

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


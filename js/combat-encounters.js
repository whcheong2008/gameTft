// combat-encounters.js -- Encounter mechanics (Prompt 62 / PHASE2-AUDIT item 8, MASTERPLAN 2.3)
//
// Wires the 6 `encounterMechanic` labels (MISSIONS-DESIGN.md "Encounter Mechanic
// Definitions", Region 4) into the real combat engine. Stages carry
// `encounterMechanic` as a string or an array of strings (see js/missions.js
// STAGES, e.g. r7_s6/r7_s8 combine 'vip_target' + 'countdown'). This file reads
// that field off the global `activeMission` at combat init (combat-core.js's
// initCombat() calls setupCombatEncounterMechanics()) and drives each
// mechanic's setup/tick/event-hook logic against the real combatState.
//
// NOTE: js/missions.js already contains an unrelated `ENCOUNTER_MECHANICS`
// object plus `setupEncounterMechanics()` / `tickEncounterMechanics()`
// (missions.js ~1151-1487). That code was written against a hypothetical
// wave-state shape (`.alive` / `.col` / `waveState.enemies`) that does not
// match the real combat engine (`combatState.enemyUnits`, `.hp`,
// `.gridRow`/`.gridCol`) and has zero callers anywhere in the codebase --
// confirmed dead/orphaned scaffolding, matching PHASE2-AUDIT's finding that
// "NOTHING consumes the field outside missions.js". It is left untouched
// (missions.js is out of this prompt's edit scope beyond "minor edits") and is
// NOT used here; this file is a fresh, independent implementation against the
// real engine. Where the scaffold's numbers matched MISSIONS-DESIGN.md text
// they're reused for consistency; new/undocumented numbers are tagged TUNABLE.

// ---- Banner registry: icon + one-line description for the wave-start UI banner ----
var COMBAT_ENCOUNTER_INFO = {
    vip_target: { icon: '⭐', name: 'VIP Target', desc: 'A marked enemy buffs and heals its allies -- kill it to break the effect.' },
    countdown: { icon: '⏳', name: 'Countdown', desc: 'An enemy structure is charging a wipe -- destroy it before the timer runs out.' },
    reinforcement_pressure: { icon: '🌊', name: 'Reinforcement Pressure', desc: 'Fixed spawn points reinforce the enemy on a timer.' },
    protect_objective: { icon: '🛡️', name: 'Protect the Objective', desc: 'A friendly NPC must survive -- it cannot fight back.' },
    split_formation: { icon: '⚔️', name: 'Split Formation', desc: 'Your team is deployed in two forced groups with a gap between them.' },
    escalating_threat: { icon: '📈', name: 'Escalating Threat', desc: 'One enemy grows stronger the longer the fight lasts.' }
};

// TUNABLE registry: numeric constants for the 6 mechanics. Values that
// MISSIONS-DESIGN.md states explicitly are cited inline; values the design
// doc leaves unspecified ("high HP", "moderate HP", "cap total spawns per
// design") are picked here and flagged // TUNABLE.
var ENCOUNTER_TUNABLES = {
    vip_target: {
        atkBuffPct: 0.25,        // MISSIONS-DESIGN.md r4_s6: "+25% ATK and regeneration"
        regenPctPerSec: 0.01     // TUNABLE -- doc says "regeneration", no number given
    },
    countdown: {
        timerSeconds: 45,        // MISSIONS-DESIGN.md r4_s7: "before 45 seconds"
        crystalHp: 3000,         // TUNABLE -- doc says "high HP", no number given
        wipeFraction: 1.0        // TUNABLE -- doc: "fires a wipe that kills all player units" -> full wipe
                                  // (the 80% figure in MISSIONS-DESIGN.md is the Colossus BOSS phase's
                                  // Cataclysm Charge, a different ability; not reused here)
    },
    reinforcement_pressure: {
        spawnIntervalSeconds: 8, // MISSIONS-DESIGN.md r4_s8: "every 8 seconds"
        spawnPointCount: 3,      // MISSIONS-DESIGN.md: "3 fixed spawn points"
        maxTotalSpawns: 12       // TUNABLE -- doc: "cap total spawns per design", no number given
    },
    protect_objective: {
        npcHp: 2000,              // TUNABLE -- doc says "moderate HP", no number given
        npcDr: 0.10                // TUNABLE
    },
    escalating_threat: {
        stackIntervalSeconds: 5,  // MISSIONS-DESIGN.md r4_s5/r7_s1: "every 5 seconds"
        atkStackPct: 0.15,        // MISSIONS-DESIGN.md: "+15% ATK"
        spdStackPct: 0.10         // MISSIONS-DESIGN.md: "+10% attack speed"
    }
};

// Per-mission persistent state -- survives across waves of the SAME stage
// attempt. Needed because initCombat() runs once per WAVE (see Prompt 60
// convention documented in combat-core.js), but "protect the objective" (an
// NPC that must survive across e.g. 3 waves) and "reinforcement spawn cap"
// are stage-level, not wave-level, concepts.
var encounterMissionState = null;

function resetEncounterMissionState() {
    encounterMissionState = null;
}

// Normalizes stageData.encounterMechanic (string | string[] | null) to an array.
function getStageEncounterMechanics(stageData) {
    if (!stageData || !stageData.encounterMechanic) return [];
    return Array.isArray(stageData.encounterMechanic) ? stageData.encounterMechanic.slice() : [stageData.encounterMechanic];
}

// ---- Setup: called once per wave from combat-core.js's initCombat(), right
// after the grid is built and before per-unit cooldown/stat init loops run
// (so any units this file injects get initialized by those loops too). ----
function setupCombatEncounterMechanics(cs, stageData) {
    var mechanics = getStageEncounterMechanics(stageData);
    cs.encounterMechanics = mechanics;
    cs.encounterState = {};
    if (mechanics.length === 0) return;

    var isFirstWave = (typeof currentWaveIndex === 'undefined' || currentWaveIndex === 0);
    if (isFirstWave || !encounterMissionState) {
        encounterMissionState = { protectObjectiveNpc: null, reinforcementTotalSpawned: 0 };
    }

    for (var i = 0; i < mechanics.length; i++) {
        var id = mechanics[i];
        if (id === 'vip_target') setupVipTarget(cs);
        else if (id === 'countdown') setupCountdown(cs);
        else if (id === 'reinforcement_pressure') setupReinforcementPressure(cs);
        else if (id === 'protect_objective') setupProtectObjective(cs);
        else if (id === 'split_formation') setupSplitFormation(cs);
        else if (id === 'escalating_threat') setupEscalatingThreat(cs);
    }

    // Register the VIP-death buff-removal hook via the Prompt 60 event bus
    // (combatEvents.reset() already ran at the top of this wave's initCombat,
    // so listeners must be re-registered fresh every wave, same convention
    // hero skill nodes use).
    if (cs.encounterState.vipTarget && typeof combatEvents !== 'undefined') {
        combatEvents.on('unitKilled', function(payload) {
            var vipState = cs.encounterState.vipTarget;
            if (!vipState || !vipState.active) return;
            if (payload.victim !== vipState.vip) return;
            vipState.active = false;
            // Remove the ATK buff from every enemy it was applied to.
            for (var i = 0; i < cs.enemyUnits.length; i++) {
                var e = cs.enemyUnits[i];
                if (e._vipAtkBuffed && e._vipBaseAttack !== undefined) {
                    e.attack = e._vipBaseAttack;
                    e._vipAtkBuffed = false;
                }
            }
        });
    }
}

// ---- Tick: called once per combatTick from combat-core.js, before the
// regular per-unit tick logic runs. ----
function tickCombatEncounterMechanics(cs, dt) {
    if (!cs.encounterMechanics || cs.encounterMechanics.length === 0) return;
    for (var i = 0; i < cs.encounterMechanics.length; i++) {
        var id = cs.encounterMechanics[i];
        if (id === 'vip_target') tickVipTarget(cs, dt);
        else if (id === 'countdown') tickCountdown(cs, dt);
        else if (id === 'reinforcement_pressure') tickReinforcementPressure(cs, dt);
        else if (id === 'protect_objective') tickProtectObjective(cs, dt);
        else if (id === 'escalating_threat') tickEscalatingThreat(cs, dt);
        // split_formation is a one-time deployment constraint applied at setup; no tick.
    }
}

// ==================== Shared helpers ====================

// Bounded BFS for an empty cell within [rowMin, rowMax] (inclusive), so
// injected units stay on the correct side of the board. Prompt 69 hex
// migration: this used to be its own 4-dir square BFS copy (identical in
// shape to combat-core.js's now-deleted findEmptyCellNear() body); both are
// now the single grid.js findEmptyCellNear(row,col,grid,rowMin,rowMax),
// which walks hexNeighbors() instead of a fixed 4-dir offset table. Kept as
// a thin same-name wrapper so every call site in this file is unchanged.
function findEmptyCellInRows(row, col, grid, rowMin, rowMax) {
    return findEmptyCellNear(row, col, grid, rowMin, rowMax);
}

// Minimal init for a synthetic (non-templated) combat entity -- structures
// (Veil Crystal, Ward NPC) and reinforcement adds don't come from
// createUnit()'s normal template path, so they need the same baseline fields
// the per-unit init loops in initCombat() would otherwise give them.
function initSyntheticUnit(u, side, row, col) {
    u.side = side;
    u.gridRow = row;
    u.gridCol = col;
    u.hp = u.maxHp;
    u.shield = 0;
    u.statusEffects = [];
    u.ccHistory = [];
    u.ccImmuneUntil = 0;
    u.tenacity = 0;
    u.moveCooldown = 0;
    u.attackCooldown = 0;
    u.currentMana = 0;
    u.abilityBuffs = {};
    u.combatStats = { damageDealt: 0, damageTaken: 0, healingDone: 0, shieldGiven: 0, kills: 0, abilityCasts: 0 };
    return u;
}

// ==================== VIP Target ====================
// "One enemy unit buffs/heals the rest. Must be killed to stop the effect."
function setupVipTarget(cs) {
    var enemies = cs.enemyUnits;
    if (!enemies || enemies.length === 0) return;
    var vip = null, maxHp = -1;
    for (var i = 0; i < enemies.length; i++) {
        if (enemies[i].hp > 0 && enemies[i].hp > maxHp) { maxHp = enemies[i].hp; vip = enemies[i]; }
    }
    if (!vip) return;
    vip.isEncounterVIP = true;
    if (vip.name && vip.name.indexOf('⭐') !== 0) vip.name = '⭐ ' + vip.name;

    var tun = ENCOUNTER_TUNABLES.vip_target;
    cs.encounterState.vipTarget = { vip: vip, atkBuffPct: tun.atkBuffPct, regenPctPerSec: tun.regenPctPerSec, active: true };

    // Apply the ATK buff once to every ally present at setup time.
    for (var j = 0; j < enemies.length; j++) {
        var e = enemies[j];
        if (e === vip || e.hp <= 0) continue;
        e._vipBaseAttack = e.attack;
        e.attack = Math.floor(e.attack * (1 + tun.atkBuffPct));
        e._vipAtkBuffed = true;
    }
}

function tickVipTarget(cs, dt) {
    var vipState = cs.encounterState.vipTarget;
    if (!vipState || !vipState.active) return;
    if (vipState.vip.hp <= 0) return; // unitKilled listener handles cleanup
    for (var i = 0; i < cs.enemyUnits.length; i++) {
        var e = cs.enemyUnits[i];
        if (e === vipState.vip || e.hp <= 0 || e.hp >= e.maxHp) continue;
        var healAmt = Math.floor(e.maxHp * vipState.regenPctPerSec * dt);
        if (healAmt > 0) dealHealing(vipState.vip, e, healAmt);
    }
}

// ==================== Countdown ====================
// "An enemy/structure charges a wipe ability on a timer. Must be destroyed before it fires."
function setupCountdown(cs) {
    var tun = ENCOUNTER_TUNABLES.countdown;
    var spot = findEmptyCellInRows(0, 3, cs.grid, 0, 3) || { row: 0, col: 3 };
    var crystal = initSyntheticUnit({
        name: 'Veil Crystal',
        templateKey: 'veil_crystal_construct',
        type: 'structure',
        element: null,
        archetype: null,
        abilities: [],
        maxHp: tun.crystalHp,
        attack: 0,
        attackSpd: 1.0,
        range: 0,
        moveSpd: 0,
        maxMana: 0,
        damageReduction: 0,
        dodgeChance: 0,
        isCountdownStructure: true
    }, 'enemy', spot.row, spot.col);

    // combat-core.js's initCombat() re-flattens combatState.allUnits from
    // playerUnits+enemyUnits right after this setup call runs, so pushing to
    // enemyUnits/playerUnits here is sufficient -- no need to touch allUnits.
    cs.enemyUnits.push(crystal);
    cs.grid[spot.row][spot.col] = crystal;

    cs.encounterState.countdown = { crystal: crystal, timer: tun.timerSeconds, fired: false, wipeFraction: tun.wipeFraction };
}

function tickCountdown(cs, dt) {
    var ms = cs.encounterState.countdown;
    if (!ms || ms.fired) return;
    if (ms.crystal.hp <= 0) { ms.fired = true; return; } // destroyed -- wipe cancelled
    ms.timer -= dt;
    if (ms.timer <= 0) {
        ms.fired = true;
        for (var i = 0; i < cs.playerUnits.length; i++) {
            var u = cs.playerUnits[i];
            if (u.hp <= 0) continue;
            var dmg = Math.max(1, Math.floor(u.hp * ms.wipeFraction));
            dealDamage(ms.crystal, u, dmg, { isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false });
        }
        if (typeof addCombatLog === 'function') addCombatLog('💀 The Veil Crystal detonates!');
    }
}

// ==================== Reinforcement Pressure ====================
// "Fixed spawn points on the grid produce new enemies at set intervals."
function setupReinforcementPressure(cs) {
    var tun = ENCOUNTER_TUNABLES.reinforcement_pressure;
    var spawnPoints = [];
    var cols = [1, 3, 5];
    for (var i = 0; i < tun.spawnPointCount && i < cols.length; i++) {
        spawnPoints.push({ row: 0, col: cols[i] });
    }
    var alreadySpawned = (encounterMissionState && encounterMissionState.reinforcementTotalSpawned) || 0;
    cs.encounterState.reinforcementPressure = {
        spawnPoints: spawnPoints,
        spawnTimer: 0,
        spawnInterval: tun.spawnIntervalSeconds,
        maxTotalSpawns: tun.maxTotalSpawns,
        totalSpawned: alreadySpawned
    };
}

function tickReinforcementPressure(cs, dt) {
    var ms = cs.encounterState.reinforcementPressure;
    if (!ms || ms.totalSpawned >= ms.maxTotalSpawns) return;
    ms.spawnTimer += dt;
    if (ms.spawnTimer < ms.spawnInterval) return;
    ms.spawnTimer -= ms.spawnInterval;

    for (var i = 0; i < ms.spawnPoints.length; i++) {
        if (ms.totalSpawned >= ms.maxTotalSpawns) break;
        var sp = ms.spawnPoints[i];
        var spot = findEmptyCellInRows(sp.row, sp.col, cs.grid, 0, 3);
        if (!spot) continue;
        var unitKey = (typeof getRandomUnitByElementAndTier === 'function') ? getRandomUnitByElementAndTier(null, [1, 2]) : null;
        var unit = (unitKey && typeof createUnit === 'function') ? createUnit(unitKey, 1) : null;
        if (!unit) continue;
        // BUGS.md #8 fix (Prompt 66): reinforcement adds are real
        // template-based units (unlike the synthetic Veil Crystal/Ward NPC
        // structures elsewhere in this file, which have no abilities/passives
        // to worry about), so they need the same full spawn-init as boss
        // minions -- initSyntheticUnit() alone never called
        // initUnitPassiveState(), leaving the same latent on-attack-passive
        // crash combat-boss.js's processBossMinions() had, just not yet
        // observed here. initSpawnedCombatUnitState() (combat-core.js) is a
        // superset of initSyntheticUnit()'s field list (same baseline fields
        // plus mana + passive state), so this is a drop-in replacement.
        initSpawnedCombatUnitState(unit, 'enemy', spot.row, spot.col);
        unit.isReinforcement = true;
        // Unlike the setup-time constructs (Veil Crystal/Ward NPC), reinforcements
        // spawn mid-wave during tick -- combat-core.js only re-flattens allUnits
        // once, right after setup, so this has to push to allUnits itself or the
        // per-tick death-animation/passive loops (which iterate allUnits) would
        // never see it.
        cs.enemyUnits.push(unit);
        cs.allUnits.push(unit);
        cs.grid[spot.row][spot.col] = unit;
        ms.totalSpawned++;
        if (encounterMissionState) encounterMissionState.reinforcementTotalSpawned = ms.totalSpawned;
    }
    if (typeof addCombatLog === 'function') addCombatLog('⚠️ Reinforcements arrive!');
}

// ==================== Protect the Objective ====================
// "Friendly NPC unit on player's grid that enemies target. Cannot attack. Must survive X waves."
function setupProtectObjective(cs) {
    var tun = ENCOUNTER_TUNABLES.protect_objective;
    var npc = encounterMissionState && encounterMissionState.protectObjectiveNpc;
    if (!npc) {
        npc = {
            name: 'Ward Crystal',
            templateKey: 'ward_npc_construct',
            type: 'structure',
            element: null,
            archetype: null,
            abilities: [],
            maxHp: tun.npcHp,
            attack: 0,
            attackSpd: 1.0,
            range: 0,
            moveSpd: 0,
            maxMana: 0,
            damageReduction: tun.npcDr,
            dodgeChance: 0,
            isObjectiveNPC: true
        };
        if (encounterMissionState) encounterMissionState.protectObjectiveNpc = npc;
    }

    var spot = findEmptyCellInRows(6, 3, cs.grid, 4, 7) || { row: 6, col: 3 };
    initSyntheticUnit(npc, 'player', spot.row, spot.col);
    npc.hp = npc.maxHp; // heal to full each wave, same as every other surviving player unit (healBoardUnits())

    cs.playerUnits.push(npc);
    cs.allUnits.push(npc);
    cs.grid[spot.row][spot.col] = npc;

    cs.encounterState.protectObjective = { npc: npc, failed: false };
}

function tickProtectObjective(cs, dt) {
    var ms = cs.encounterState.protectObjective;
    if (!ms || ms.failed) return;
    if (ms.npc.hp <= 0) {
        ms.failed = true;
        cs.running = false;
        cs.result = 'loss';
        if (typeof addCombatLog === 'function') addCombatLog('💀 The objective has fallen!');
        if (typeof combatEvents !== 'undefined') combatEvents.emit('combatEnd', { result: 'loss' });
    }
}

// ==================== Split Formation ====================
// "Player team forced into two groups on opposite sides of the grid with a gap between them."
function setupSplitFormation(cs) {
    var gapCol = 3; // TUNABLE -- MISSIONS-DESIGN.md: "a gap between them", no column specified
    var players = cs.playerUnits;
    for (var i = 0; i < players.length; i++) {
        var u = players[i];
        if (u.hp <= 0 || u.gridCol !== gapCol) continue;
        // Units caught on the gap column get pushed to whichever side has the shorter queue.
        var leftCount = 0, rightCount = 0;
        for (var j = 0; j < players.length; j++) {
            if (players[j].hp <= 0) continue;
            if (players[j].gridCol < gapCol) leftCount++;
            else if (players[j].gridCol > gapCol) rightCount++;
        }
        var preferLeft = leftCount <= rightCount;
        var spot = preferLeft ?
            findEmptyCellInRows(u.gridRow, gapCol - 1, cs.grid, 4, 7) || findEmptyCellInRows(u.gridRow, gapCol + 1, cs.grid, 4, 7) :
            findEmptyCellInRows(u.gridRow, gapCol + 1, cs.grid, 4, 7) || findEmptyCellInRows(u.gridRow, gapCol - 1, cs.grid, 4, 7);
        if (spot) moveUnitToCell(u, spot.row, spot.col, cs.grid);
    }
    cs.encounterState.splitFormation = { gapCol: gapCol };
}

// ==================== Escalating Threat ====================
// "One enemy gains stacking ATK/speed buff every X seconds. Weak early, devastating late."
function setupEscalatingThreat(cs) {
    var enemies = cs.enemyUnits;
    if (!enemies || enemies.length === 0) return;
    var esc = null, maxAtk = -1;
    for (var i = 0; i < enemies.length; i++) {
        if (enemies[i].hp > 0 && enemies[i].attack > maxAtk) { maxAtk = enemies[i].attack; esc = enemies[i]; }
    }
    if (!esc) return;
    esc.isEscalator = true;
    if (esc.name && esc.name.indexOf('📈') !== 0) esc.name = '📈 ' + esc.name;
    esc._escalatorBaseAttack = esc.attack;
    esc._escalatorBaseAtkSpd = esc.attackSpd;

    var tun = ENCOUNTER_TUNABLES.escalating_threat;
    cs.encounterState.escalatingThreat = {
        escalator: esc,
        stackTimer: 0,
        stackInterval: tun.stackIntervalSeconds,
        atkStackPct: tun.atkStackPct,
        spdStackPct: tun.spdStackPct,
        stacks: 0
    };
}

function tickEscalatingThreat(cs, dt) {
    var ms = cs.encounterState.escalatingThreat;
    if (!ms || ms.escalator.hp <= 0) return;
    ms.stackTimer += dt;
    if (ms.stackTimer < ms.stackInterval) return;
    ms.stackTimer -= ms.stackInterval;
    ms.stacks++;
    var esc = ms.escalator;
    esc.attack = Math.floor(esc._escalatorBaseAttack * (1 + ms.atkStackPct * ms.stacks));
    esc.attackSpd = Math.max(0.2, esc._escalatorBaseAtkSpd / (1 + ms.spdStackPct * ms.stacks));
}

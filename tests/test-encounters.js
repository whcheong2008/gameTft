// =============================================================================
// tests/test-encounters.js — Prompt 62 encounter mechanics (PHASE2-AUDIT item 8,
// MASTERPLAN.md 2.3). One seeded case per mechanic, driving combat-encounters.js
// directly against combat-core.js's initCombat()/combatTick() (same low-level
// pattern as the "combat timeout" case in tests/test-combat-golden.js) so each
// test controls team/enemy stats precisely instead of depending on RNG-driven
// wave generation.
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

function emptyBoard() {
    return [
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null]
    ];
}

// Places units on the 4x7 team-builder board (rows 0-3); initCombat() maps
// team-builder row r -> combat grid row 4+r.
function placePlayer(board, unit, row, col) {
    board[row][col] = unit;
}

function pumpTicks(h, dt, count) {
    for (let i = 0; i < count && h.context.combatState && h.context.combatState.running; i++) {
        h.context.combatTick(dt);
    }
}

module.exports = [
    // ---------------------------------------------------------------
    {
        name: 'encounter mechanic: vip_target buffs allies and the buff drops the instant the VIP dies',
        fn: function() {
            const h = createHarness({ seed: 10 });
            h.loadScripts();
            h.freshSave();

            const p = h.context.createUnit('stone_guard', 1);
            p.attack = 0; // no auto-resolution mid-test
            const board = emptyBoard();
            placePlayer(board, p, 0, 0);

            const vip = h.context.createUnit('stone_guard', 1);
            vip.hp = 5000; vip.maxHp = 5000; // highest HP -> picked as VIP
            vip.gridRow = 0; vip.gridCol = 2;
            const ally = h.context.createUnit('frost_archer', 1);
            const allyBaseAtk = ally.attack;
            ally.hp = 500; ally.maxHp = 500;
            ally.gridRow = 0; ally.gridCol = 4;

            h.context.activeMission = { encounterMechanic: 'vip_target' };
            h.context.currentWaveIndex = 0;
            h.context.initCombat({ board: board, enemies: [vip, ally], phase: 'combat', activeSynergies: {}, activeElements: {} });

            const cs = h.context.combatState;
            const vipState = cs.encounterState.vipTarget;
            assert.ok(vipState, 'vip_target mechanic state should be set up');
            assert.equal(vipState.vip, vip, 'the highest-HP enemy should be picked as the VIP');
            assert.ok(vip.isEncounterVIP, 'VIP unit should be flagged');
            const buffedAtk = cs.enemyUnits.filter(function(u) { return u === ally; })[0].attack;
            assert.equal(buffedAtk, Math.floor(allyBaseAtk * 1.25), 'ally should get the +25% ATK VIP buff');

            // Kill the VIP via the combat event bus (unitKilled) -> buff should be removed.
            vip.hp = 0;
            h.context.combatEvents.emit('unitKilled', { killer: p, victim: vip, amount: 5000 });
            assert.ok(!vipState.active, 'vip_target state should be deactivated once the VIP is killed');
            assert.equal(ally.attack, allyBaseAtk, 'ally ATK should revert to base once the VIP is killed');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'encounter mechanic: countdown wipes the team if the structure survives to the timer, but is avoidable by destroying it',
        fn: function() {
            const h1 = createHarness({ seed: 11 });
            h1.loadScripts();
            h1.freshSave();

            // Case A: player + enemy both inert (0 attack) -> only the countdown timer resolves the fight.
            const p1 = h1.context.createUnit('stone_guard', 1);
            p1.attack = 0;
            // stone_guard's mana ability (Stone Barrier) periodically re-shields itself
            // for 28% max HP even while idle (mana still fills from time/damage taken),
            // which would otherwise absorb the true-damage wipe. initCombat() re-derives
            // maxMana from UNIT_TEMPLATES[templateKey] every wave (clobbering a direct
            // maxMana override), so retarget templateKey/key to something with no
            // template match instead -- that zeroes maxMana AND removes any
            // templateKey-keyed passive (combat-passives.js), leaving a truly inert unit.
            p1.templateKey = 'test_dummy_inert';
            p1.key = 'test_dummy_inert';
            p1.abilities = [];
            const board1 = emptyBoard();
            placePlayer(board1, p1, 0, 0);

            h1.context.activeMission = { encounterMechanic: 'countdown' };
            h1.context.currentWaveIndex = 0;
            h1.context.initCombat({ board: board1, enemies: [], phase: 'combat', activeSynergies: {}, activeElements: {} });

            const cs1 = h1.context.combatState;
            const crystal = cs1.encounterState.countdown.crystal;
            assert.ok(crystal, 'countdown mechanic should spawn a Veil Crystal structure');
            assert.equal(crystal.attack, 0, 'the crystal itself should not attack');
            crystal.attack = 0;

            let ticks = 0;
            while (cs1.running && ticks < 3000) { h1.context.combatTick(0.05); ticks++; }
            assert.equal(cs1.result, 'loss', 'letting the countdown expire with the crystal alive should wipe the team');
            assert.ok(cs1.elapsed >= 45, 'the wipe should not happen before the documented 45s timer');

            // Case B: player has enough ATK to destroy the crystal (3000 HP) well before 45s.
            const h2 = createHarness({ seed: 11 });
            h2.loadScripts();
            h2.freshSave();
            const p2 = h2.context.createUnit('flame_warrior', 1);
            p2.attack = 2000; // one-shots the 3000 HP crystal in ~2 hits
            const board2 = emptyBoard();
            placePlayer(board2, p2, 0, 3); // adjacent column to the crystal's default spawn col 3

            h2.context.activeMission = { encounterMechanic: 'countdown' };
            h2.context.currentWaveIndex = 0;
            h2.context.initCombat({ board: board2, enemies: [], phase: 'combat', activeSynergies: {}, activeElements: {} });
            const cs2 = h2.context.combatState;

            let ticks2 = 0;
            while (cs2.running && ticks2 < 3000) { h2.context.combatTick(0.05); ticks2++; }
            assert.equal(cs2.result, 'win', 'destroying the crystal before the timer should win the fight, not wipe the team');
            assert.ok(cs2.elapsed < 45, 'the crystal should be destroyed well before the 45s countdown');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'encounter mechanic: reinforcement_pressure spawns new enemies on an interval and stops at the cap',
        fn: function() {
            const h = createHarness({ seed: 12 });
            h.loadScripts();
            h.freshSave();

            const p = h.context.createUnit('stone_guard', 1);
            p.attack = 0;
            // Reinforcements spawn as normal (non-zeroed-attack) templated units and
            // will actually attack -- give the player unit an unkillable amount of
            // HP/DR so the fight survives long enough to observe spawning hit its cap
            // instead of ending in a loss after the first wave of adds.
            p.maxHp = 10000000; p.hp = 10000000; p.damageReduction = 0.75;
            const board = emptyBoard();
            placePlayer(board, p, 0, 0);

            const e = h.context.createUnit('stone_guard', 1);
            e.attack = 0;
            e.gridRow = 3; e.gridCol = 6; // out of the way of the row-0 spawn points

            h.context.activeMission = { encounterMechanic: 'reinforcement_pressure' };
            h.context.currentWaveIndex = 0;
            h.context.initCombat({ board: board, enemies: [e], phase: 'combat', activeSynergies: {}, activeElements: {} });
            const cs = h.context.combatState;
            const initialCount = cs.enemyUnits.length;

            pumpTicks(h, 0.05, 200); // 10s -> one 8s spawn interval should have fired
            assert.ok(cs.enemyUnits.length > initialCount, 'reinforcements should have spawned after the first interval');
            assert.ok(cs.encounterState.reinforcementPressure.totalSpawned > 0, 'totalSpawned should be tracked');

            pumpTicks(h, 0.05, 6000); // 300s more -> far past enough intervals to hit the cap
            const cap = cs.encounterState.reinforcementPressure.maxTotalSpawns;
            assert.equal(cs.encounterState.reinforcementPressure.totalSpawned, cap, 'spawning should stop exactly at the cap');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'encounter mechanic: protect_objective NPC is deployed on the player side and its death ends the mission in a loss',
        fn: function() {
            const h = createHarness({ seed: 13 });
            h.loadScripts();
            h.freshSave();

            const p = h.context.createUnit('stone_guard', 1);
            p.attack = 0;
            const board = emptyBoard();
            placePlayer(board, p, 0, 0);
            const e = h.context.createUnit('stone_guard', 1);
            e.attack = 0;
            e.gridRow = 0; e.gridCol = 0;

            h.context.activeMission = { encounterMechanic: 'protect_objective' };
            h.context.currentWaveIndex = 0;
            h.context.initCombat({ board: board, enemies: [e], phase: 'combat', activeSynergies: {}, activeElements: {} });
            const cs = h.context.combatState;

            const npc = cs.encounterState.protectObjective.npc;
            assert.ok(npc, 'protect_objective should place an NPC');
            assert.ok(npc.isObjectiveNPC, 'the NPC should be flagged');
            assert.equal(npc.attack, 0, 'the objective NPC cannot attack');
            assert.ok(npc.gridRow >= 4 && npc.gridRow <= 7, 'the NPC should be deployed on the player side of the grid');
            assert.ok(cs.playerUnits.indexOf(npc) >= 0, 'the NPC should be part of playerUnits so enemies can target/damage it');

            npc.hp = 0;
            h.context.combatTick(0.05);
            assert.equal(cs.result, 'loss', 'the objective dying should end the mission in a loss even though the real unit is still alive');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'encounter mechanic: split_formation keeps the gap column clear of player units',
        fn: function() {
            const h = createHarness({ seed: 14 });
            h.loadScripts();
            h.freshSave();

            const a = h.context.createUnit('stone_guard', 1);
            const b = h.context.createUnit('flame_warrior', 1);
            const board = emptyBoard();
            placePlayer(board, a, 0, 3); // team-builder col 3 -> combat gridCol 3, the gap column
            placePlayer(board, b, 0, 1);

            const e = h.context.createUnit('stone_guard', 1);
            e.attack = 0;
            e.gridRow = 0; e.gridCol = 0;

            h.context.activeMission = { encounterMechanic: 'split_formation' };
            h.context.currentWaveIndex = 0;
            h.context.initCombat({ board: board, enemies: [e], phase: 'combat', activeSynergies: {}, activeElements: {} });
            const cs = h.context.combatState;

            const gapCol = cs.encounterState.splitFormation.gapCol;
            for (let i = 0; i < cs.playerUnits.length; i++) {
                assert.notEqual(cs.playerUnits[i].gridCol, gapCol, 'no player unit should occupy the gap column after split_formation setup');
            }
            assert.notEqual(a.gridCol, 3, 'the unit originally deployed on the gap column should have been moved off it');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'encounter mechanic: escalating_threat stacks the strongest enemy\'s ATK/speed over time',
        fn: function() {
            const h = createHarness({ seed: 15 });
            h.loadScripts();
            h.freshSave();

            const p = h.context.createUnit('stone_guard', 1);
            p.attack = 0;
            // The escalator (500 ATK) will actually attack p -- give p enough
            // HP/DR to survive the observation window instead of dying early.
            p.maxHp = 10000000; p.hp = 10000000; p.damageReduction = 0.75;
            const board = emptyBoard();
            placePlayer(board, p, 0, 0);

            const weak = h.context.createUnit('stone_guard', 1);
            weak.attack = 5;
            weak.gridRow = 0; weak.gridCol = 0;
            const strong = h.context.createUnit('flame_warrior', 1);
            strong.attack = 500; // highest ATK -> picked as the escalator
            strong.gridRow = 0; strong.gridCol = 2;
            const strongBaseAtk = strong.attack;
            const strongBaseAtkSpd = strong.attackSpd;

            h.context.activeMission = { encounterMechanic: 'escalating_threat' };
            h.context.currentWaveIndex = 0;
            h.context.initCombat({ board: board, enemies: [weak, strong], phase: 'combat', activeSynergies: {}, activeElements: {} });
            const cs = h.context.combatState;

            const ms = cs.encounterState.escalatingThreat;
            assert.equal(ms.escalator, strong, 'the highest-ATK enemy should be picked as the escalator');
            assert.equal(ms.stacks, 0, 'no stacks yet at wave start');

            pumpTicks(h, 0.05, 240); // 12s -> 2 stacks at the documented 5s interval
            assert.equal(ms.stacks, 2, 'escalator should have gained 2 stacks after 12s at a 5s interval');
            assert.equal(strong.attack, Math.floor(strongBaseAtk * (1 + 0.15 * 2)), 'escalator ATK should scale with stacks');
            assert.ok(strong.attackSpd < strongBaseAtkSpd, 'escalator should attack faster (lower cooldown) as stacks accumulate');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'plain stages (no encounterMechanic) are completely unaffected -- combatState.encounterMechanics is empty',
        fn: function() {
            const h = createHarness({ seed: 16 });
            h.loadScripts();
            h.freshSave();
            const p = h.context.createUnit('stone_guard', 1);
            const board = emptyBoard();
            placePlayer(board, p, 0, 0);
            const e = h.context.createUnit('stone_guard', 1);
            e.gridRow = 0; e.gridCol = 0;

            h.context.activeMission = { encounterMechanic: null };
            h.context.currentWaveIndex = 0;
            h.context.initCombat({ board: board, enemies: [e], phase: 'combat', activeSynergies: {}, activeElements: {} });
            const cs = h.context.combatState;

            assert.deepEqual(cs.encounterMechanics, [], 'no mechanics should be active for a plain stage');
            assert.deepEqual(cs.encounterState, {}, 'encounterState should be empty for a plain stage');
            assert.equal(cs.playerUnits.length, 1, 'no NPC/structure should be injected for a plain stage');
            assert.equal(cs.enemyUnits.length, 1, 'no structure should be injected on the enemy side for a plain stage');
        }
    }
];

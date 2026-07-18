// =============================================================================
// tests/test-boss-minions.js — BUGS.md #8 regression (Prompt 66).
//
// combat-boss.js's processBossMinions() used to spawn minions via createUnit()
// directly into combatState, hand-copying most runtime fields but never
// calling initUnitPassiveState(). Any minionSpawns entry whose template has
// an on-attack passive (e.g. flame_warrior's "every 3rd attack" passive)
// crashed combat the instant that minion landed an attack: "Cannot read
// properties of undefined (reading 'attackCount')" (combat-passives.js's
// executeOnAttackPassive reads unit.passiveState unconditionally). Found by
// tests/balance-sim.js against infernal_wyvern (spawns flame_warrior-
// templated "Fire Drake" minions) -- see BALANCE-REPORT.md "Known Issues" #3
// (Prompt 65 report) for the original discovery.
//
// The fix routes every mid-combat spawn path (boss minions here, and
// reinforcement-pressure adds in combat-encounters.js) through one shared
// helper, initSpawnedCombatUnitState() (combat-core.js), that gives the
// spawned unit the same runtime state initCombat() gives every unit present
// at combat start -- including initUnitPassiveState().
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

module.exports = [
    {
        name: 'BUGS #8 regression: infernal_wyvern spawns flame_warrior minions that attack without crashing combat',
        fn: function() {
            const h = createHarness({ seed: 500 });
            h.loadScripts();
            const sd = h.freshSave();
            sd.missions.regionProgress[4].bossCleared = true; // unlock Challenge mode

            sd.collection['flame_warrior'] = { stars: 1, copiesForNext: 0 };
            const team = h.context.getActiveTeam(sd);
            team.slots = [{ key: 'flame_warrior', row: 0, col: 3 }];

            const start = h.context.startElementBossChallenge(sd, 'infernal_wyvern');
            assert.equal(start.success, true, 'infernal_wyvern challenge should start');

            const cs = h.context.combatState;
            assert.ok(cs && cs.bossUnit, 'a boss unit should exist');
            assert.equal(cs.bossUnit.bossData.minionSpawns[0].units[0].key, 'flame_warrior', 'sanity check: infernal_wyvern minionSpawns should still be flame_warrior-templated');

            // Neither side can kill anything -- this test only cares that a
            // spawned minion survives to actually attack (the crash trigger)
            // without an exception, not about the fight's outcome.
            cs.bossUnit.attack = 0;
            for (let i = 0; i < cs.playerUnits.length; i++) {
                cs.playerUnits[i].attack = 0;
                cs.playerUnits[i].hp = 999999;
                cs.playerUnits[i].maxHp = 999999;
            }
            // infernal_wyvern's minionSpawns entry is gated on boss.currentPhase
            // (phase: 1, i.e. the boss's phase-2/"below 50% HP" phase) -- with
            // both sides doing 0 damage the boss would otherwise sit at 100%
            // HP forever and never phase-transition, so drop it under the
            // phase-2 HP threshold directly; processBossTick()'s phase-check
            // runs at the very top of the next tick and transitions it.
            cs.bossUnit.hp = Math.floor(cs.bossUnit.maxHp * 0.4);

            // minionSpawns[0].cooldown is 25s, first fire at half that (12.5s);
            // pump well past that plus travel/attack time, but stop safely
            // short of the 180s boss-fight draw timeout.
            const dt = h.context.COMBAT_DT || 0.05;
            let ticks = 0;
            let threw = null;
            try {
                while (cs.running && ticks < 3000) { // 3000 * 0.05s = 150s
                    h.context.combatTick(dt);
                    ticks++;
                }
            } catch (e) {
                threw = e;
            }
            assert.equal(threw, null, 'combat should not throw once a spawned minion attacks: ' + (threw && threw.message));

            const minions = cs.enemyUnits.filter(function(u) { return u.templateKey === 'flame_warrior' && !u.isBoss; });
            assert.ok(minions.length > 0, 'infernal_wyvern should have spawned at least one flame_warrior minion during the run');
            assert.ok(minions.every(function(u) { return !!u.passiveState; }), 'every spawned minion should have passiveState initialized (BUGS #8 fix)');

            const attacked = minions.some(function(u) { return u.passiveState.attackCount > 0; });
            assert.ok(attacked, 'at least one spawned minion should have actually landed an attack (the crash trigger) during the run');
        }
    },

    {
        name: 'shared spawn helper: initSpawnedCombatUnitState() gives a unit passiveState, mana, and status arrays in one call',
        fn: function() {
            const h = createHarness({ seed: 501 });
            h.loadScripts();
            h.freshSave();

            const unit = h.context.createUnit('flame_warrior', 2);
            assert.equal(unit.passiveState, undefined, 'sanity check: a bare createUnit() unit has no passiveState yet');

            h.context.initSpawnedCombatUnitState(unit, 'enemy', 1, 2);

            assert.equal(unit.side, 'enemy', 'side should be set');
            assert.equal(unit.gridRow, 1, 'gridRow should be set');
            assert.equal(unit.gridCol, 2, 'gridCol should be set');
            assert.ok(unit.passiveState, 'passiveState should be initialized');
            assert.equal(unit.passiveState.attackCount, 0, 'passiveState.attackCount should start at 0');
            assert.equal(unit.maxMana, 65, 'maxMana should be pulled from the unit template (flame_warrior: 65)');
            assert.equal(unit.currentMana, 0, 'currentMana should start at 0');
            assert.deepEqual(unit.statusEffects, [], 'statusEffects should be initialized empty');
            assert.deepEqual(unit.ccHistory, [], 'ccHistory should be initialized empty');
            assert.equal(unit.tenacity, 0, 'tenacity should default to 0');
            assert.equal(unit._heroKey, null, 'hero fields should be explicitly default-safe (null, not left undefined)');
        }
    }
];

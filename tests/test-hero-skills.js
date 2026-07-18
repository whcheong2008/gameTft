// =============================================================================
// tests/test-hero-skills.js — Prompt 60: combat event framework + hero skill
// node effects. For ~10 representative nodes spanning all 6 heroes (mixing
// converted dead-flag nodes and event-driven placeholder nodes), asserts the
// effect actually changes combat outcome/state when the node is learned vs.
// not learned, under the same seed.
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

function emptyBoard() {
    const board = [];
    for (let r = 0; r < 4; r++) board[r] = [null, null, null, null, null, null, null];
    return board;
}

// Sets up a fresh save with `heroKey` assigned to `unitKey` (matched by
// unit.key at combat time) with `nodeIds` invested (or none, for baseline).
function setupHero(h, heroKey, unitKey, nodeIds) {
    const sd = h.freshSave();
    sd.heroes.data[heroKey].level = 20;
    sd.heroes.data[heroKey].assignedUnit = unitKey;
    sd.heroes.data[heroKey].investedNodes = nodeIds.slice();
    return sd;
}

// A stationary dummy enemy for tests that drive combat directly via
// dealDamage()/dealHealing()/addStatus() rather than combatTick() — needs to
// exist (so combat doesn't instantly resolve as a win) but is never actually
// touched by the assertions, so it doesn't need to be invulnerable.
function dummyEnemy(h, row, col) {
    const e = h.context.createUnit('stone_guard', 1);
    e.attack = 0;
    e.gridRow = row;
    e.gridCol = col;
    return e;
}

// A truly inert enemy for tests that pump real combatTick() loops. attack:0
// alone is NOT enough — performAttack() falls back to a raw 10 damage for
// attack:0 units (`attacker.attack || 10`) — so this also sets stasis, which
// makes the enemy skip its turn entirely and become invulnerable, while
// still letting the player unit's own auto-attacks/mana-generation proceed
// normally against it (dealDamage's stasis check only zeroes the damage,
// mana-on-attack in combatTick isn't gated on the attack actually landing).
function harmlessEnemy(h, row, col) {
    const e = dummyEnemy(h, row, col);
    e.stasis = 9999;
    return e;
}

function pumpTicks(h, n, dt) {
    for (let i = 0; i < n; i++) h.context.combatTick(dt);
}

module.exports = [
    // ---- Kael: kael_A_1_1 "Shield Ally" (event-driven: unitDamaged -> grantShield) ----
    {
        name: 'kael_A_1_1 Shield Ally: adjacent ally dropping below 30% HP gets shielded only when learned',
        fn: function() {
            function run(learned) {
                const h = createHarness({ seed: 5 });
                h.loadScripts();
                setupHero(h, 'kael', 'stone_guard', learned ? ['kael_A_1_1'] : []);
                const board = emptyBoard();
                const kaelUnit = h.context.createUnit('stone_guard', 1);
                const allyUnit = h.context.createUnit('flame_warrior', 1);
                board[0][0] = kaelUnit;
                board[0][1] = allyUnit; // adjacent
                const enemy = harmlessEnemy(h, 3, 0);
                h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });
                const liveKael = h.context.combatState.playerUnits[0];
                const liveAlly = h.context.combatState.playerUnits[1];
                const dmg = Math.floor(liveAlly.maxHp * 0.75); // push ally to ~25% HP
                h.context.dealDamage(enemy, liveAlly, dmg, { isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false });
                return liveAlly.shield || 0;
            }
            assert.ok(run(true) > 0, 'ally should be shielded when kael_A_1_1 is learned');
            assert.equal(run(false), 0, 'ally should NOT be shielded when kael_A_1_1 is not learned');
        }
    },

    // ---- Kael: kael_A_1_2 "Frontline Defender" (converted dead flag -> tick-based DR) ----
    {
        name: 'kael_A_1_2 Frontline Defender: +8% DR only while an ally is positioned behind you, only when learned',
        fn: function() {
            function run(learned) {
                const h = createHarness({ seed: 6 });
                h.loadScripts();
                setupHero(h, 'kael', 'flame_warrior', learned ? ['kael_A_1_2'] : []);
                const board = emptyBoard();
                board[0][0] = h.context.createUnit('flame_warrior', 1); // front (gridRow 4)
                board[3][0] = h.context.createUnit('stone_guard', 1);   // back (gridRow 7) -> "behind"
                const enemy = harmlessEnemy(h, 3, 3);
                h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });
                pumpTicks(h, 3, 0.05);
                return h.context.combatState.playerUnits[0].damageReduction || 0;
            }
            assert.close(run(true), 0.08, 1e-9, 'front unit should gain +8% DR when kael_A_1_2 is learned and an ally is behind it');
            assert.equal(run(false), 0, 'front unit should have no DR bonus when kael_A_1_2 is not learned');
        }
    },

    // ---- Lyric: lyric_A_4_1 "Overload" (converted dead flags: dmg dealt +20%, dmg taken +15%) ----
    {
        name: 'lyric_A_4_1 Overload: +20% damage dealt and +15% damage taken only when learned',
        fn: function() {
            function dealtDamage(learned) {
                const h = createHarness({ seed: 7 });
                h.loadScripts();
                setupHero(h, 'lyric', 'flame_warrior', learned ? ['lyric_A_4_1'] : []);
                const board = emptyBoard();
                board[0][0] = h.context.createUnit('flame_warrior', 1);
                const enemy = dummyEnemy(h, 3, 0); // dealDamage() target here -> must not be stasis-invulnerable
                h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });
                const lyricUnit = h.context.combatState.playerUnits[0];
                const result = h.context.dealDamage(lyricUnit, enemy, 100, { isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false });
                return result.hpDamage;
            }
            function takenDamage(learned) {
                const h = createHarness({ seed: 7 });
                h.loadScripts();
                setupHero(h, 'lyric', 'flame_warrior', learned ? ['lyric_A_4_1'] : []);
                const board = emptyBoard();
                board[0][0] = h.context.createUnit('flame_warrior', 1);
                const enemy = harmlessEnemy(h, 3, 0);
                h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });
                const lyricUnit = h.context.combatState.playerUnits[0];
                const result = h.context.dealDamage(enemy, lyricUnit, 100, { isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false });
                return result.hpDamage;
            }
            assert.equal(dealtDamage(true), 120, 'lyric_A_4_1 should deal +20% damage (100 -> 120) when learned');
            assert.equal(dealtDamage(false), 100, 'without the node, raw 100 true damage should stay 100');
            // Math.floor(100 * 1.15) === 114 in IEEE754 (100 * 1.15 == 114.999999999999986),
            // matching this engine's existing Math.floor-based percentage math elsewhere.
            assert.equal(takenDamage(true), Math.floor(100 * 1.15), 'lyric_A_4_1 should take +15% damage when learned');
            assert.equal(takenDamage(false), 100, 'without the node, raw 100 true damage should stay 100');
        }
    },

    // ---- Sera: sera_B_2_2 "Elemental Affinity" (converted dead flag: elemDmgMultBonus) ----
    {
        name: 'sera_B_2_2 Elemental Affinity: element-advantage damage multiplier improved by +0.15 only when learned',
        fn: function() {
            function run(learned) {
                const h = createHarness({ seed: 8 });
                h.loadScripts();
                setupHero(h, 'sera', 'tide_hunter', learned ? ['sera_B_2_2'] : []);
                const board = emptyBoard();
                board[0][0] = h.context.createUnit('tide_hunter', 1); // water, strong vs fire (1.3x)
                const enemy = h.context.createUnit('flame_warrior', 1); // fire
                enemy.attack = 0;
                enemy.gridRow = 3; enemy.gridCol = 0;
                h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });
                const seraUnit = h.context.combatState.playerUnits[0];
                const result = h.context.dealDamage(seraUnit, enemy, 100, { isTrueDamage: false, canCrit: false, canDodge: false, applyElement: true, triggerOnHit: false });
                return result.hpDamage;
            }
            // Baseline: 100 * 1.3 = 130. With node: 100 * 1.45 = 145.
            assert.equal(run(false), 130, 'baseline fire-vs-water element advantage should be the normal 1.3x (100 -> 130)');
            assert.equal(run(true), 145, 'sera_B_2_2 should boost the advantage multiplier to 1.45x (100 -> 145) when learned');
        }
    },

    // ---- Sera: sera_B_1_2 "Mana Efficiency" (converted dead flag: lower effective cast threshold) ----
    {
        name: 'sera_B_1_2 Mana Efficiency: reaches the (lower) mana threshold and casts sooner only when learned',
        fn: function() {
            function ticksToFirstCast(learned) {
                const h = createHarness({ seed: 9 });
                h.loadScripts();
                setupHero(h, 'sera', 'flame_warrior', learned ? ['sera_B_1_2'] : []);
                const board = emptyBoard();
                board[0][0] = h.context.createUnit('flame_warrior', 1); // maxMana 65, range 1
                const enemy = harmlessEnemy(h, 3, 0); // adjacent (distance 1) to board[0][0] -> gridRow 4
                h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });
                const unit = h.context.combatState.playerUnits[0];
                for (let i = 0; i < 400; i++) {
                    h.context.combatTick(0.05);
                    if (unit.combatStats.abilityCasts >= 1) return i;
                }
                return -1;
            }
            const withNode = ticksToFirstCast(true);
            const without = ticksToFirstCast(false);
            assert.ok(withNode >= 0 && without >= 0, 'both runs should reach a first ability cast within the test window');
            assert.ok(withNode < without, 'sera_B_1_2 should reach its (lower) mana threshold and cast sooner (tick ' + withNode + ' vs ' + without + ')');
        }
    },

    // ---- Maren: maren_B_1_2 "Mana Flow" (converted dead flag: +2.5 mana/sec) ----
    {
        name: 'maren_B_1_2 Mana Flow: passively gains mana over time even without attacking, only when learned',
        fn: function() {
            function manaAfter(learned) {
                const h = createHarness({ seed: 10 });
                h.loadScripts();
                setupHero(h, 'maren', 'flame_warrior', learned ? ['maren_B_1_2'] : []);
                const board = emptyBoard();
                board[0][0] = h.context.createUnit('flame_warrior', 1);
                // Enemy far out of range/movement reach for the duration, so the
                // unit never attacks and generates zero auto-attack mana.
                const enemy = harmlessEnemy(h, 0, 6);
                h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });
                pumpTicks(h, 20, 0.05); // 1s, well before the unit could path into range
                return h.context.combatState.playerUnits[0].currentMana;
            }
            const withNode = manaAfter(true);
            const without = manaAfter(false);
            assert.ok(withNode > without, 'maren_B_1_2 should grant passive mana regen (' + withNode + ' vs ' + without + ' without)');
            assert.close(withNode, 2.5 * 1.0, 0.5, 'after ~1s the passive gain should be close to 2.5 mana');
        }
    },

    // ---- Maren: maren_A_1_2 "Recovery Pulse" (event-driven: periodic heal to adjacent ally) ----
    {
        name: 'maren_A_1_2 Recovery Pulse: heals adjacent allies every 5s only when learned',
        fn: function() {
            function allyHpAfter(learned) {
                const h = createHarness({ seed: 11 });
                h.loadScripts();
                setupHero(h, 'maren', 'stone_guard', learned ? ['maren_A_1_2'] : []);
                const board = emptyBoard();
                board[0][0] = h.context.createUnit('stone_guard', 1);
                board[0][1] = h.context.createUnit('flame_warrior', 1);
                const enemy = harmlessEnemy(h, 3, 0);
                h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });
                const ally = h.context.combatState.playerUnits[1];
                // Enemy is out of the ally's attack range, so without a target
                // it would otherwise path toward it over several seconds and
                // break the adjacency this test depends on. Freeze it in place.
                ally.stasis = 9999;
                ally.hp = Math.floor(ally.maxHp * 0.5);
                const startHp = ally.hp;
                pumpTicks(h, 120, 0.05); // 6s of combat, crosses the 5s pulse
                return h.context.combatState.playerUnits[1].hp - startHp;
            }
            assert.ok(allyHpAfter(true) > 0, 'adjacent ally should be healed by Recovery Pulse once learned');
            assert.equal(allyHpAfter(false), 0, 'adjacent ally should not heal on its own without the node (no other heal/regen source)');
        }
    },

    // ---- Ren: ren_A_2_1 "Endurance" (event-driven: combatStart -> regen status) ----
    {
        name: 'ren_A_2_1 Endurance: applies a 1.2%/s max HP regen status only when learned',
        fn: function() {
            function run(learned) {
                const h = createHarness({ seed: 12 });
                h.loadScripts();
                setupHero(h, 'ren', 'stone_guard', learned ? ['ren_A_2_1'] : []);
                const board = emptyBoard();
                board[0][0] = h.context.createUnit('stone_guard', 1);
                const enemy = harmlessEnemy(h, 3, 0);
                h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });
                const unit = h.context.combatState.playerUnits[0];
                return h.context.getStatusValue(unit, 'regen');
            }
            assert.close(run(true), 0.012, 1e-9, 'ren_A_2_1 should apply a 1.2%/s regen status when learned');
            assert.equal(run(false), 0, 'no regen status should be present without the node');
        }
    },

    // ---- Voss: voss_B_1_1 "First Blood" (event-driven: unitKilled -> atkBuff) ----
    {
        name: 'voss_B_1_1 First Blood: first kill grants +15% ATK for 6s only when learned',
        fn: function() {
            function run(learned) {
                const h = createHarness({ seed: 13 });
                h.loadScripts();
                setupHero(h, 'voss', 'flame_warrior', learned ? ['voss_B_1_1'] : []);
                const board = emptyBoard();
                board[0][0] = h.context.createUnit('flame_warrior', 1);
                const enemy = dummyEnemy(h, 3, 0); // dealDamage() target here -> must not be stasis-invulnerable
                enemy.hp = 1; enemy.maxHp = 1; // dies in one hit
                h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });
                const unit = h.context.combatState.playerUnits[0];
                h.context.dealDamage(unit, enemy, 50, { isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false });
                return h.context.getStatusValue(unit, 'atkBuff');
            }
            assert.close(run(true), 0.15, 1e-9, 'voss_B_1_1 should grant +15% ATK buff on the first kill when learned');
            assert.equal(run(false), 0, 'no ATK buff should be granted on kill without the node');
        }
    },

    // ---- Task 3 sanity check: lyric_B_2_2 "Synergy Amplifier" wired through updateActiveSynergies ----
    {
        name: 'lyric_B_2_2 Synergy Amplifier: unit contributes +1 extra to its primary archetype synergy count only when learned',
        fn: function() {
            function guardianCount(learned) {
                const h = createHarness({ seed: 14 });
                h.loadScripts();
                const sd = setupHero(h, 'lyric', 'stone_guard', learned ? ['lyric_B_2_2'] : []);
                const board = emptyBoard();
                board[0][0] = h.context.createUnit('stone_guard', 1); // archetype: guardian
                const gs = { board: board };
                h.context.updateActiveSynergies(gs);
                return gs.activeSynergies.guardian || 0;
            }
            assert.equal(guardianCount(true), 2, 'a single guardian unit with lyric_B_2_2 invested should count as 2 toward guardian synergy');
            assert.equal(guardianCount(false), 1, 'without the node, a single guardian unit should count as its normal 1');
        }
    }
];

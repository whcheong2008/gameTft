// =============================================================================
// tests/test-passive-triggers.js — Prompt 75 (BUGS #12) acceptance tests.
//
// BUGS #12: the 6 T4 units from BUGS #11 (ashen_watcher, abyssal_guardian,
// grove_warden, tempest_weaver, voltfang_stalker, iron_duelist) + their 6
// evolved forms have innate PASSIVE_DATA entries that never executed --
// three of them need passive-trigger types (on_heal, on_crit,
// on_ability_cast) that didn't exist anywhere in js/combat-passives.js.
// Prompt 75 adds those three trigger types (wired as combatEvents
// subscribers) and implements all 12 passives.
//
// Also exercises a pre-existing, previously-undiscovered blocking bug found
// while implementing this: js/combat-passives.js's getPassiveData() branches
// on unit.isEvolved, but nothing in the combat-unit-prep pipeline
// (combat-core.js) ever SET that flag -- so EVERY evolved unit's innate
// passive (not just this prompt's 6) silently never fired. Fixed as part of
// this prompt (blocking for 6 of the 12 passives below, which all resolve
// through EVOLVED_PASSIVE_DATA) -- see combat-core.js's `su.isEvolved = ...`
// line for the full comment.
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

function emptyBoard() {
    const board = [];
    for (let r = 0; r < 4; r++) board[r] = [null, null, null, null, null, null, null];
    return board;
}

// Harmless placeholder enemy so combat doesn't instantly resolve as a win
// (mirrors tests/test-missing-abilities.js's harmlessEnemy pattern).
function harmlessEnemy(h, templateKey, row, col) {
    const e = h.context.createUnit(templateKey || 'stone_guard', 1);
    e.attack = 0;
    e.gridRow = row;
    e.gridCol = col;
    e.stasis = 9999;
    return e;
}

module.exports = [
    // =================================================================
    // Trigger-dispatch tests: each new trigger type fires exactly when
    // specified, and not reentrantly.
    // =================================================================
    {
        name: 'on_heal trigger: fires for a heal landing on an ally of the passive owner, not for an enemy heal',
        fn: function() {
            const h = createHarness({ seed: 7501 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('ashen_watcher', 1);
            board[0][1] = h.context.createUnit('flame_warrior', 1);
            const enemy1 = h.context.createUnit('stone_guard', 1);
            enemy1.attack = 0; enemy1.gridRow = 0; enemy1.gridCol = 0; enemy1.stasis = 9999;
            const enemy2 = h.context.createUnit('flame_warrior', 1);
            enemy2.attack = 0; enemy2.gridRow = 0; enemy2.gridCol = 1; enemy2.stasis = 9999;
            h.context.initCombat({ board: board, enemies: [enemy1, enemy2], activeSynergies: {}, activeElements: {} });

            const ally = h.context.combatState.playerUnits[1];
            const liveEnemy = h.context.combatState.enemyUnits[1];
            ally.hp = 1;
            liveEnemy.hp = 1;

            h.context.dealHealing(ally, ally, 200);
            assert.equal(ally.shield, 30, 'ally heal should grant a shield of exactly 15% of the heal amount (floor(200*0.15))');

            h.context.dealHealing(liveEnemy, liveEnemy, 200);
            assert.equal(liveEnemy.shield, 0, 'healing an enemy of ashen_watcher should NOT trigger Ember Shroud');
        }
    },
    {
        name: 'on_heal trigger: registering listeners again (a second wave) does not double-fire the same heal',
        fn: function() {
            const h = createHarness({ seed: 7502 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('ashen_watcher', 1);
            const enemy = harmlessEnemy(h, 'stone_guard', 0, 0);
            h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });

            // Re-run the per-wave passive setup a second time WITHOUT an
            // intervening combatEvents.reset() -- if registerPassiveTriggerListeners()
            // were ever called without going through initCombat()'s reset(),
            // this would double-register the on_heal listener and double the
            // shield grant below.
            h.context.combatEvents.reset();
            h.context.processCombatStartPassives(h.context.combatState.allUnits);

            const watcher = h.context.combatState.playerUnits[0];
            watcher.hp = 1;
            h.context.dealHealing(watcher, watcher, 100);
            assert.equal(watcher.shield, 15, 'shield should reflect exactly ONE listener firing (15% of 100), not a doubled amount');
        }
    },
    {
        name: 'on_crit trigger: fires only when the hit is a crit, not on a normal hit',
        fn: function() {
            const h = createHarness({ seed: 7503 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('voltfang_stalker', 1);
            const enemy = h.context.createUnit('stone_guard', 3);
            enemy.attack = 0; enemy.gridRow = 0; enemy.gridCol = 0;
            h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });

            const attacker = h.context.combatState.playerUnits[0];
            const target = h.context.combatState.enemyUnits[0];

            h.context.dealDamage(attacker, target, 10, { canCrit: true, forceCrit: false, canDodge: false, applyElement: false, triggerOnHit: false });
            assert.equal(attacker.passiveState.customData.overchargeStacks || 0, 0, 'a non-crit hit must not add an Overcharge Frenzy stack');

            h.context.dealDamage(attacker, target, 10, { canCrit: true, forceCrit: true, canDodge: false, applyElement: false, triggerOnHit: false });
            assert.equal(attacker.passiveState.customData.overchargeStacks, 1, 'a forced crit must add exactly one Overcharge Frenzy stack');
        }
    },
    {
        name: 'on_ability_cast trigger: fires when the unit casts its ability',
        fn: function() {
            const h = createHarness({ seed: 7504 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('tempest_weaver', 1);
            const enemy = harmlessEnemy(h, 'stone_guard', 0, 0);
            h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });

            const caster = h.context.combatState.playerUnits[0];
            assert.equal((caster.passiveState.customData.vortices || []).length, 0, 'no Vortex should exist before any ability cast');

            h.context.combatEvents.emit('abilityCast', { caster: caster, key: 'tempest_weaver' });
            assert.equal(caster.passiveState.customData.vortices.length, 1, 'casting the ability should spawn exactly one Vortex');
            assert.equal(caster.passiveState.customData.vortices[0].row, caster.gridRow, 'Vortex should be centered on the caster');
        }
    },

    // =================================================================
    // 12 innate passives — one seeded case each.
    // =================================================================

    // ---- ashen_watcher: Ember Shroud (on_heal) ----
    {
        name: 'ashen_watcher: Ember Shroud shields a healed Burning ally and grants Burn immunity',
        fn: function() {
            const h = createHarness({ seed: 7505 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('ashen_watcher', 1);
            board[0][1] = h.context.createUnit('flame_warrior', 1);
            const enemy = harmlessEnemy(h, 'stone_guard', 0, 0);
            h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });

            const ally = h.context.combatState.playerUnits[1];
            ally.hp = 1;
            h.context.addStatus(ally, 'burn', 5, 10, enemy);

            h.context.dealHealing(ally, ally, 100);
            // Burn reduces incoming healing by 25% (combat-damage.js's dealHealing),
            // so the actual heal applied is floor(100*0.75)=75, and the shield
            // is 15% of THAT (the post-reduction amount the on_heal event carries).
            assert.equal(ally.shield, 11, 'healed ally should gain a shield equal to 15% of the actual (post-Burn-reduction) heal amount');
            assert.ok(ally.burnImmuneUntil > h.context.combatState.elapsed, 'Burning ally healed should gain a Burn-immunity window');

            const statusCountBefore = ally.statusEffects.length;
            h.context.addStatus(ally, 'burn', 5, 10, enemy);
            assert.equal(ally.statusEffects.length, statusCountBefore, 'a new Burn application during the immunity window should be blocked');
        }
    },
    // ---- phoenix_priest: Ember Shroud Enhanced (on_heal) ----
    {
        name: 'phoenix_priest: Ember Shroud Enhanced shields for 25% and grants the bonus move-speed buff',
        fn: function() {
            const h = createHarness({ seed: 7506 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('phoenix_priest', 3);
            board[0][1] = h.context.createUnit('flame_warrior', 1);
            const enemy = harmlessEnemy(h, 'stone_guard', 0, 0);
            h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });

            const ally = h.context.combatState.playerUnits[1];
            ally.hp = 1;
            h.context.dealHealing(ally, ally, 100);
            assert.equal(ally.shield, 25, 'phoenix_priest heals should shield for 25% of the heal amount');
            assert.ok(h.context.hasStatus(ally, 'moveSpeedBuff'), 'phoenix_priest Ember Shroud should also grant the areaMoveSpdBonus move-speed buff');
        }
    },

    // ---- abyssal_guardian: Pressure Depths (aura) ----
    {
        name: 'abyssal_guardian: Pressure Depths scales DR with missing HP and slows nearby attackers',
        fn: function() {
            const h = createHarness({ seed: 7507 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('abyssal_guardian', 1);
            const enemy = h.context.createUnit('stone_guard', 1);
            enemy.attack = 0; enemy.gridRow = 0; enemy.gridCol = 0; enemy.stasis = 9999;
            h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });

            const guardian = h.context.combatState.playerUnits[0];
            const liveEnemy = h.context.combatState.enemyUnits[0];
            const nb = h.context.hexNeighbors(guardian.gridRow, guardian.gridCol);
            h.context.moveUnitToCell(liveEnemy, nb[0].row, nb[0].col, h.context.combatState.grid);

            guardian.hp = Math.floor(guardian.maxHp * 0.55); // 45% missing -> 4 tiers of 10%
            h.context.processTickPassives(h.context.combatState.allUnits, 0.1);

            assert.ok(Math.abs(h.context.getStatusValue(guardian, 'drMod') - 0.12) < 0.001, 'DR should be 4 tiers * 3% = 12%');
            assert.ok(h.context.hasStatus(liveEnemy, 'slow'), 'nearby enemy should be Slowed');
        }
    },
    // ---- hadal_colossus: Pressure Depths Enhanced (aura) ----
    {
        name: 'hadal_colossus: Pressure Depths Enhanced caps DR higher and also grants scaling lifesteal',
        fn: function() {
            const h = createHarness({ seed: 7508 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('hadal_colossus', 3);
            const enemy = harmlessEnemy(h, 'stone_guard', 0, 0);
            h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });

            const guardian = h.context.combatState.playerUnits[0];
            guardian.hp = Math.floor(guardian.maxHp * 0.05); // 95% missing -> 9 tiers (capped effects)
            h.context.processTickPassives(h.context.combatState.allUnits, 0.1);

            assert.ok(Math.abs(h.context.getStatusValue(guardian, 'drMod') - 0.27) < 0.001, 'DR should be 9 tiers * 3% = 27% (below the 40% cap)');
            assert.ok(Math.abs((guardian.lifesteal || 0) - 0.18) < 0.001, 'lifesteal should be 9 tiers * 2% = 18%');
        }
    },

    // ---- grove_warden: Deep Roots (periodic) ----
    {
        name: 'grove_warden: Deep Roots grants ATK+Range while stationary 3s+ and resets when the unit moves',
        fn: function() {
            const h = createHarness({ seed: 7509 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('grove_warden', 1);
            const enemy = harmlessEnemy(h, 'stone_guard', 0, 0);
            h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });

            const warden = h.context.combatState.playerUnits[0];
            const baseRange = warden.range;

            for (let i = 0; i < 32; i++) h.context.processTickPassives(h.context.combatState.allUnits, 0.1); // 3.2s stationary
            assert.ok(h.context.hasStatus(warden, 'atkBuff'), 'stationary 3s+ should grant the ATK buff');
            assert.equal(warden.range, baseRange + 1, 'stationary 3s+ should grant +1 Range');

            const nb = h.context.hexNeighbors(warden.gridRow, warden.gridCol);
            h.context.moveUnitToCell(warden, nb[0].row, nb[0].col, h.context.combatState.grid);
            h.context.processTickPassives(h.context.combatState.allUnits, 0.1);
            assert.equal(warden.range, baseRange, 'moving should reset the Range bonus');
            assert.equal(warden.passiveState.customData.rootedActive, false, 'moving should clear rootedActive');
        }
    },
    {
        name: 'grove_warden: the Range bonus does not compound across waves (initUnitPassiveState resets it, unlike the un-reset unit.range field)',
        fn: function() {
            const h = createHarness({ seed: 7509 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('grove_warden', 1);
            const enemy = harmlessEnemy(h, 'stone_guard', 0, 0);
            h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });

            const warden = h.context.combatState.playerUnits[0];
            const baseRange = warden.range;
            for (let i = 0; i < 32; i++) h.context.processTickPassives(h.context.combatState.allUnits, 0.1);
            assert.equal(warden.range, baseRange + 1, 'sanity: wave 1 grants +1 Range while rooted');

            // The real engine calls initUnitPassiveState() + processCombatStartPassives()
            // again for surviving units at the start of every subsequent wave
            // (js/combat-core.js's initCombat()), on the SAME unit object --
            // unit.range is never independently reset by healBoardUnits().
            h.context.initUnitPassiveState(warden);
            h.context.processCombatStartPassives(h.context.combatState.allUnits);
            assert.equal(warden.range, baseRange, 'a new wave should start from the un-rooted base Range, not compound on top of the previous wave\'s bonus');

            for (let i = 0; i < 32; i++) h.context.processTickPassives(h.context.combatState.allUnits, 0.1);
            assert.equal(warden.range, baseRange + 1, 'becoming rooted again in wave 2 should grant the SAME +1, not stack to +2');
        }
    },
    // ---- worldroot_sentinel: Deep Roots Enhanced (periodic) ----
    {
        name: 'worldroot_sentinel: Deep Roots Enhanced activates after 2s (instead of 3) with bigger bonuses',
        fn: function() {
            const h = createHarness({ seed: 7510 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('worldroot_sentinel', 3);
            const enemy = harmlessEnemy(h, 'stone_guard', 0, 0);
            h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });

            const warden = h.context.combatState.playerUnits[0];
            const baseRange = warden.range;

            for (let i = 0; i < 21; i++) h.context.processTickPassives(h.context.combatState.allUnits, 0.1); // 2.1s
            assert.equal(warden.range, baseRange + 2, 'stationary 2s+ should grant +2 Range for the evolved form');
            assert.ok(Math.abs(h.context.getStatusValue(warden, 'atkBuff') - 0.25) < 0.001, 'evolved ATK bonus should be 25%');
        }
    },
    {
        name: 'grove_warden: auto-attacks from a rooted position have a chance to apply Root',
        fn: function() {
            const h = createHarness({ seed: 7511 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('grove_warden', 1);
            const enemy = h.context.createUnit('stone_guard', 1);
            enemy.attack = 0; enemy.gridRow = 0; enemy.gridCol = 0; enemy.stasis = 9999;
            h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });

            const warden = h.context.combatState.playerUnits[0];
            const target = h.context.combatState.enemyUnits[0];
            for (let i = 0; i < 32; i++) h.context.processTickPassives(h.context.combatState.allUnits, 0.1); // become rooted
            assert.equal(warden.passiveState.customData.rootedActive, true, 'warden should be rooted after standing still 3s+');

            let rootedTarget = false;
            for (let i = 0; i < 60 && !rootedTarget; i++) {
                h.context.processOnAttackPassive(warden, target, h.context.combatState.allUnits);
                if (h.context.hasStatus(target, 'root')) rootedTarget = true;
            }
            assert.ok(rootedTarget, 'over enough attacks from a rooted position, the 20% Root proc should land at least once');
        }
    },

    // ---- tempest_weaver: Lingering Gales (on_ability_cast) ----
    {
        name: 'tempest_weaver: Lingering Gales spawns a Vortex per cast (capped at 3, oldest evicted) that damages enemies and grants ally dodge',
        fn: function() {
            const h = createHarness({ seed: 7512 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('tempest_weaver', 1);
            board[0][1] = h.context.createUnit('flame_warrior', 1);
            const enemy = h.context.createUnit('stone_guard', 1);
            enemy.attack = 0; enemy.gridRow = 0; enemy.gridCol = 0;
            h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });

            const caster = h.context.combatState.playerUnits[0];
            const ally = h.context.combatState.playerUnits[1];
            const liveEnemy = h.context.combatState.enemyUnits[0];
            // Co-locate ally + enemy on the caster's cell for the tick-damage/
            // dodge assertion below (processVortexPassive only reads
            // gridRow/gridCol, not the grid[][] occupancy array).
            ally.gridRow = caster.gridRow; ally.gridCol = caster.gridCol;
            liveEnemy.gridRow = caster.gridRow; liveEnemy.gridCol = caster.gridCol;

            for (let i = 0; i < 4; i++) {
                h.context.combatEvents.emit('abilityCast', { caster: caster, key: 'tempest_weaver' });
            }
            assert.equal(caster.passiveState.customData.vortices.length, 3, 'max 3 Vortices should be active at once (oldest fades on the 4th cast)');

            const enemyHpBefore = liveEnemy.hp;
            h.context.processTickPassives(h.context.combatState.allUnits, 1.0);
            assert.ok(liveEnemy.hp < enemyHpBefore, 'an enemy standing in a Vortex should take damage');
            assert.ok(h.context.hasStatus(ally, 'dodgeBuff'), 'an ally standing in a Vortex should gain dodge');

            for (let i = 0; i < 10; i++) h.context.processTickPassives(h.context.combatState.allUnits, 1.0); // 10s > 6s duration
            assert.equal(caster.passiveState.customData.vortices.length, 0, 'Vortices should expire after their duration');
        }
    },
    // ---- stormweft_oracle: Lingering Gales Enhanced (on_ability_cast) ----
    {
        name: 'stormweft_oracle: Lingering Gales Enhanced allows up to 4 active Vortices',
        fn: function() {
            const h = createHarness({ seed: 7513 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('stormweft_oracle', 3);
            const enemy = harmlessEnemy(h, 'stone_guard', 0, 0);
            h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });

            const caster = h.context.combatState.playerUnits[0];
            for (let i = 0; i < 4; i++) {
                h.context.combatEvents.emit('abilityCast', { caster: caster, key: 'stormweft_oracle' });
            }
            assert.equal(caster.passiveState.customData.vortices.length, 4, 'evolved form should allow up to 4 active Vortices');
        }
    },

    // ---- voltfang_stalker: Overcharge Frenzy (on_crit) ----
    {
        name: 'voltfang_stalker: Overcharge Frenzy stacks ATK speed per crit and chains damage at max stacks',
        fn: function() {
            const h = createHarness({ seed: 7514 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('voltfang_stalker', 1);
            const target = h.context.createUnit('stone_guard', 5);
            target.attack = 0; target.gridRow = 0; target.gridCol = 0;
            const adjacent = h.context.createUnit('stone_guard', 1);
            adjacent.attack = 0; adjacent.gridRow = 0; adjacent.gridCol = 1;
            h.context.initCombat({ board: board, enemies: [target, adjacent], activeSynergies: {}, activeElements: {} });

            const attacker = h.context.combatState.playerUnits[0];
            const liveTarget = h.context.combatState.enemyUnits[0];
            const liveAdjacent = h.context.combatState.enemyUnits[1];
            const adjHpBefore = liveAdjacent.hp;

            for (let i = 0; i < 4; i++) {
                h.context.dealDamage(attacker, liveTarget, 10, { canCrit: true, forceCrit: true, canDodge: false, applyElement: false, triggerOnHit: false });
            }
            assert.ok(Math.abs(h.context.getStatusValue(attacker, 'spdMod') - 0.32) < 0.001, '4 stacks should grant +32% ATK speed');
            assert.equal(liveAdjacent.hp, adjHpBefore, 'no chain damage before reaching max stacks (5)');

            h.context.dealDamage(attacker, liveTarget, 10, { canCrit: true, forceCrit: true, canDodge: false, applyElement: false, triggerOnHit: false });
            assert.equal(attacker.passiveState.customData.overchargeStacks, 5, 'stacks should cap at 5');
            assert.ok(liveAdjacent.hp < adjHpBefore, 'reaching max stacks should chain 40% damage to an adjacent enemy');
        }
    },
    // ---- plasma_ravager: Overcharge Frenzy Enhanced (on_crit) ----
    {
        name: 'plasma_ravager: Overcharge Frenzy Enhanced stacks up to 7 times',
        fn: function() {
            const h = createHarness({ seed: 7515 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('plasma_ravager', 3);
            const target = h.context.createUnit('stone_guard', 5);
            target.attack = 0; target.gridRow = 0; target.gridCol = 0;
            h.context.initCombat({ board: board, enemies: [target], activeSynergies: {}, activeElements: {} });

            const attacker = h.context.combatState.playerUnits[0];
            const liveTarget = h.context.combatState.enemyUnits[0];
            for (let i = 0; i < 9; i++) {
                h.context.dealDamage(attacker, liveTarget, 5, { canCrit: true, forceCrit: true, canDodge: false, applyElement: false, triggerOnHit: false });
            }
            assert.equal(attacker.passiveState.customData.overchargeStacks, 7, 'evolved form should cap at 7 stacks, not 5');
        }
    },

    // ---- iron_duelist: Challenge Protocol (combat_start + ongoing tracking) ----
    {
        name: 'iron_duelist: Challenge Protocol marks the highest-ATK enemy as Rival and buffs ATK/DR while engaged',
        fn: function() {
            const h = createHarness({ seed: 7516 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('iron_duelist', 1);
            const weakEnemy = h.context.createUnit('stone_guard', 1);
            weakEnemy.attack = 10; weakEnemy.gridRow = 3; weakEnemy.gridCol = 0; weakEnemy.stasis = 9999;
            const strongEnemy = h.context.createUnit('flame_warrior', 1);
            strongEnemy.attack = 200; strongEnemy.gridRow = 1; strongEnemy.gridCol = 0; strongEnemy.stasis = 9999;
            h.context.initCombat({ board: board, enemies: [weakEnemy, strongEnemy], activeSynergies: {}, activeElements: {} });

            const duelist = h.context.combatState.playerUnits[0];
            const liveStrong = h.context.combatState.enemyUnits[1];
            const liveWeak = h.context.combatState.enemyUnits[0];
            assert.equal(duelist.passiveState.customData.rivalRef, liveStrong, 'the higher-ATK enemy should be marked as Rival at combat start');

            h.context.processTickPassives(h.context.combatState.allUnits, 0.1);
            assert.ok(Math.abs(h.context.getStatusValue(duelist, 'atkBuff') - 0.20) < 0.001, 'engaged with Rival should grant +20% ATK');
            assert.ok(Math.abs(h.context.getStatusValue(duelist, 'drMod') - 0.10) < 0.001, 'engaged with Rival should grant +10% DR');

            // Push Rival out of engagement range, then kill it -- Rival should
            // reassign to the next-highest-ATK living enemy.
            liveStrong.gridRow = 0; liveStrong.gridCol = 6;
            const dist = h.context.hexDistance(duelist.gridRow, duelist.gridCol, liveStrong.gridRow, liveStrong.gridCol);
            assert.ok(dist > 5, 'test setup: Rival must be pushed outside the 5-cell engagement diameter');
            h.context.processTickPassives(h.context.combatState.allUnits, 0.1);
            assert.ok(h.context.hasStatus(duelist, 'moveSpeedBuff'), 'no Rival in range should grant the move-speed buff instead');

            liveStrong.hp = 0;
            h.context.processTickPassives(h.context.combatState.allUnits, 0.1);
            assert.equal(duelist.passiveState.customData.rivalRef, liveWeak, 'Rival death should reassign to the next-highest-ATK enemy');
        }
    },
    // ---- warforged_champion: Challenge Protocol Enhanced ----
    {
        name: 'warforged_champion: Challenge Protocol Enhanced grants a permanent +10% ATK stack on each Rival death',
        fn: function() {
            const h = createHarness({ seed: 7517 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('warforged_champion', 3);
            const enemyA = h.context.createUnit('stone_guard', 1);
            enemyA.attack = 200; enemyA.gridRow = 3; enemyA.gridCol = 0; enemyA.stasis = 9999;
            const enemyB = h.context.createUnit('flame_warrior', 1);
            enemyB.attack = 10; enemyB.gridRow = 2; enemyB.gridCol = 0; enemyB.stasis = 9999;
            h.context.initCombat({ board: board, enemies: [enemyA, enemyB], activeSynergies: {}, activeElements: {} });

            const champion = h.context.combatState.playerUnits[0];
            const liveA = h.context.combatState.enemyUnits[0];
            assert.equal(champion.passiveState.customData.rivalRef, liveA, 'highest-ATK enemy should start as Rival');

            liveA.hp = 0;
            h.context.processTickPassives(h.context.combatState.allUnits, 0.1);
            assert.equal(champion.passiveState.customData.permanentAtkStacks, 1, 'Rival death should grant one permanent ATK stack');
            assert.ok(h.context.getStatusValue(champion, 'atkBuff') >= 0.10 - 0.001, 'the permanent stack alone should contribute at least +10% ATK');
        }
    }
];

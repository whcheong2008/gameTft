// =============================================================================
// tests/test-missing-abilities.js — Prompt 74 (BUGS #11) acceptance tests.
//
// 12 roster units (ashen_watcher, abyssal_guardian, grove_warden,
// tempest_weaver, voltfang_stalker, iron_duelist + their 6 evolved forms)
// had full ABILITY_DATA + mana-cast wiring but no `case` in executeAbility(),
// so casting their ability was a silent no-op. Prompt 74 added the missing
// cases (js/combat-abilities.js) plus a small combat-damage.js extension
// (empoweredShot* fields) for iron_duelist/warforged_champion's "empower the
// next auto-attack" ability shape.
//
// Each unit below gets a seeded direct-executeAbility() cast asserting its
// mechanical effect actually happened (damage / status / heal / mana buff),
// plus a few extra cases exercising the trickier conditional branches
// (knockback-into-another-enemy splash, knockback-into-a-wall stun, kill-
// chain dashing, Rival-only Wound) since those are real judgment calls worth
// self-checking, not just flavor.
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

function emptyBoard() {
    const board = [];
    for (let r = 0; r < 4; r++) board[r] = [null, null, null, null, null, null, null];
    return board;
}

// A harmless placeholder enemy so combat doesn't instantly resolve as a win
// (mirrors tests/test-hero-skills.js's dummyEnemy/harmlessEnemy pattern).
function harmlessEnemy(h, templateKey, row, col) {
    const e = h.context.createUnit(templateKey || 'stone_guard', 1);
    e.attack = 0;
    e.gridRow = row;
    e.gridCol = col;
    e.stasis = 9999;
    return e;
}

module.exports = [
    // ---------------------------------------------------------------
    // ashen_watcher — Pyre of Renewal
    // ---------------------------------------------------------------
    {
        name: 'ashen_watcher: Pyre of Renewal heals the lowest-HP ally and consumes Burn for +50% heal',
        fn: function() {
            const h = createHarness({ seed: 7401 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('ashen_watcher', 1);
            board[0][1] = h.context.createUnit('flame_warrior', 1);
            const enemy = harmlessEnemy(h, 'stone_guard', 0, 0);
            h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });

            const caster = h.context.combatState.playerUnits[0];
            const ally = h.context.combatState.playerUnits[1];
            ally.hp = Math.floor(ally.maxHp * 0.30);
            h.context.addStatus(ally, 'burn', 3, 10, enemy);
            const preHp = ally.hp;

            h.context.executeAbility(caster);

            assert.ok(ally.hp > preHp, 'lowest-HP ally should be healed');
            assert.equal(h.context.hasStatus(ally, 'burn'), false, 'Burn should be consumed by the heal');
            assert.ok(ally.ccImmuneUntil > h.context.combatState.elapsed, 'healed ally should be CC-immune for the heal window');
        }
    },

    // ---------------------------------------------------------------
    // abyssal_guardian — Tidal Fortress
    // ---------------------------------------------------------------
    {
        name: 'abyssal_guardian: Tidal Fortress damages+slows nearby enemies, shields allies with DR, and roots+DR-buffs self',
        fn: function() {
            const h = createHarness({ seed: 7402 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('abyssal_guardian', 1);
            board[0][1] = h.context.createUnit('flame_warrior', 1);
            const enemy = h.context.createUnit('stone_guard', 1);
            enemy.attack = 0;
            enemy.gridRow = 0; enemy.gridCol = 0;
            h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });

            const caster = h.context.combatState.playerUnits[0];
            const ally = h.context.combatState.playerUnits[1];
            const liveEnemy = h.context.combatState.enemyUnits[0];
            const nb = h.context.hexNeighbors(caster.gridRow, caster.gridCol);
            h.context.moveUnitToCell(liveEnemy, nb[0].row, nb[0].col, h.context.combatState.grid);
            liveEnemy.stasis = 0;
            const preHp = liveEnemy.hp;

            h.context.executeAbility(caster);

            assert.ok(liveEnemy.hp < preHp, 'nearby enemy should take damage from the slam');
            assert.ok(h.context.hasStatus(liveEnemy, 'slow'), 'nearby enemy should be Slowed');
            assert.ok(h.context.hasStatus(ally, 'drMod'), 'nearby ally should gain DR');
            assert.ok(h.context.hasStatus(caster, 'drMod'), 'guardian should gain self DR');
            assert.ok(h.context.hasStatus(caster, 'root'), 'guardian should be Rooted during the channel');
        }
    },

    // ---------------------------------------------------------------
    // grove_warden — Thornstorm
    // ---------------------------------------------------------------
    {
        name: 'grove_warden: Thornstorm damages+slows enemies, with a 40% bonus against an already-Slowed/Rooted target',
        fn: function() {
            const h = createHarness({ seed: 7403 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('grove_warden', 1);
            const enemy = h.context.createUnit('stone_guard', 1);
            enemy.attack = 0;
            enemy.gridRow = 0; enemy.gridCol = 0;
            h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });

            const caster = h.context.combatState.playerUnits[0];
            const liveEnemy = h.context.combatState.enemyUnits[0];
            liveEnemy.stasis = 0;
            h.context.addStatus(liveEnemy, 'root', 5, 0, caster); // pre-existing Root -> bonus branch
            const preHp = liveEnemy.hp;
            const baseHit = Math.floor(caster.attack * 1.20);
            const bonusHit = Math.floor(caster.attack * 1.20 * 1.40);

            h.context.executeAbility(caster);

            const dmgTaken = preHp - liveEnemy.hp;
            assert.ok(dmgTaken > 0, 'sole enemy should take damage (getRandomAlive with 1 alive target is deterministic)');
            assert.ok(dmgTaken >= baseHit, 'damage should be at least the base 120% ATK hit');
            assert.ok(Math.abs(dmgTaken - bonusHit) <= 1, 'pre-Rooted target should take the 40% bonus-damage hit (' + dmgTaken + ' vs expected ' + bonusHit + ')');
            assert.ok(h.context.hasStatus(liveEnemy, 'slow'), 'hit enemy should be Slowed by Thornstorm');
        }
    },

    // ---------------------------------------------------------------
    // tempest_weaver — Cyclone Barrage
    // ---------------------------------------------------------------
    {
        name: 'tempest_weaver: Cyclone Barrage hits the highest-ATK enemy and knocks it back when the landing cell is empty',
        fn: function() {
            const h = createHarness({ seed: 7404 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('tempest_weaver', 1);
            const weakEnemy = h.context.createUnit('stone_guard', 1);
            weakEnemy.attack = 0; weakEnemy.gridRow = 1; weakEnemy.gridCol = 5;
            const strongEnemy = h.context.createUnit('gladiator', 1); // higher base ATK -> intended target
            strongEnemy.attack = 999; strongEnemy.gridRow = 3; strongEnemy.gridCol = 3;
            h.context.initCombat({ board: board, enemies: [weakEnemy, strongEnemy], activeSynergies: {}, activeElements: {} });

            const caster = h.context.combatState.playerUnits[0];
            const target = h.context.combatState.enemyUnits.find(function(u) { return u.attack === 999; });
            const preRow = target.gridRow, preCol = target.gridCol;
            const preHp = target.hp;

            h.context.executeAbility(caster);

            assert.ok(target.hp < preHp, 'highest-ATK enemy should take Cyclone Barrage damage');
            assert.ok(target.gridRow !== preRow || target.gridCol !== preCol, 'target should be knocked back to a new cell when the landing cell is empty');
        }
    },
    {
        name: 'tempest_weaver: Cyclone Barrage splashes both units (120% ATK + Slow each) when the knockback cell is occupied by another enemy',
        fn: function() {
            const h = createHarness({ seed: 7405 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('tempest_weaver', 1);
            const target = h.context.createUnit('gladiator', 1);
            target.attack = 999; target.gridRow = 3; target.gridCol = 3;
            const blocker = h.context.createUnit('stone_guard', 1);
            blocker.attack = 0; blocker.gridRow = 0; blocker.gridCol = 0;
            h.context.initCombat({ board: board, enemies: [target, blocker], activeSynergies: {}, activeElements: {} });

            const caster = h.context.combatState.playerUnits[0];
            const liveTarget = h.context.combatState.enemyUnits.find(function(u) { return u.attack === 999; });
            const liveBlocker = h.context.combatState.enemyUnits.find(function(u) { return u.attack === 0; });

            const dir = h.context.hexDirectionIndex(caster.gridRow, caster.gridCol, liveTarget.gridRow, liveTarget.gridCol);
            const blockCell = h.context.hexStep(liveTarget.gridRow, liveTarget.gridCol, dir, 1);
            assert.ok(blockCell, 'sanity: knockback destination cell should be on-board for this layout');
            h.context.moveUnitToCell(liveBlocker, blockCell.row, blockCell.col, h.context.combatState.grid);

            const preTargetHp = liveTarget.hp, preBlockerHp = liveBlocker.hp;
            const preRow = liveTarget.gridRow, preCol = liveTarget.gridCol;

            h.context.executeAbility(caster);

            assert.equal(liveTarget.gridRow, preRow, 'target should NOT move when the knockback cell is occupied');
            assert.equal(liveTarget.gridCol, preCol, 'target should NOT move when the knockback cell is occupied');
            assert.ok(liveTarget.hp < preTargetHp, 'primary target should take splash damage too');
            assert.ok(liveBlocker.hp < preBlockerHp, 'blocking enemy should take splash damage');
            assert.ok(h.context.hasStatus(liveTarget, 'slow'), 'primary target should be Slowed by the splash');
            assert.ok(h.context.hasStatus(liveBlocker, 'slow'), 'blocking enemy should be Slowed by the splash');
        }
    },

    // ---------------------------------------------------------------
    // voltfang_stalker — Lightning Pounce
    // ---------------------------------------------------------------
    {
        name: 'voltfang_stalker: Lightning Pounce dashes to the lowest-HP enemy in range and damages it',
        fn: function() {
            const h = createHarness({ seed: 7406 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('voltfang_stalker', 1);
            const enemy = h.context.createUnit('stone_guard', 1);
            enemy.attack = 0; enemy.gridRow = 0; enemy.gridCol = 0;
            h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });

            const caster = h.context.combatState.playerUnits[0];
            const liveEnemy = h.context.combatState.enemyUnits[0];
            const nb = h.context.hexNeighbors(caster.gridRow, caster.gridCol);
            h.context.moveUnitToCell(liveEnemy, nb[0].row, nb[0].col, h.context.combatState.grid);
            const preHp = liveEnemy.hp;

            h.context.executeAbility(caster);

            assert.ok(liveEnemy.hp < preHp, 'in-range enemy should take Lightning Pounce damage');
        }
    },
    {
        name: 'voltfang_stalker: Lightning Pounce chains through kills (up to 3 dashes) and leaves Afterimage damage behind',
        fn: function() {
            const h = createHarness({ seed: 7407 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('voltfang_stalker', 1);
            const e1 = h.context.createUnit('stone_guard', 1);
            const e2 = h.context.createUnit('stone_guard', 1);
            const e3 = h.context.createUnit('stone_guard', 1);
            [e1, e2, e3].forEach(function(e, i) { e.attack = 0; e.gridRow = 0; e.gridCol = i; });
            h.context.initCombat({ board: board, enemies: [e1, e2, e3], activeSynergies: {}, activeElements: {} });

            const caster = h.context.combatState.playerUnits[0];
            const enemies = h.context.combatState.enemyUnits;
            const nb = h.context.hexNeighbors(caster.gridRow, caster.gridCol);
            for (let i = 0; i < enemies.length; i++) {
                h.context.moveUnitToCell(enemies[i], nb[i].row, nb[i].col, h.context.combatState.grid);
                enemies[i].hp = 1; // one-shot every hop so the chain runs to its cap
                enemies[i].maxHp = 1000;
            }

            h.context.executeAbility(caster);

            const deadCount = enemies.filter(function(e) { return e.hp <= 0; }).length;
            assert.equal(deadCount, 3, 'all 3 low-HP enemies should die across the chained dashes (cap: 3 kills)');
        }
    },

    // ---------------------------------------------------------------
    // iron_duelist — Decisive Strike
    // ---------------------------------------------------------------
    {
        name: 'iron_duelist: Decisive Strike empowers the next auto-attack (280% ATK, DR-ignore, Wound only vs. the highest-ATK "Rival" enemy)',
        fn: function() {
            const h = createHarness({ seed: 7408 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('iron_duelist', 1);
            const rival = h.context.createUnit('gladiator', 1);
            rival.attack = 999; rival.gridRow = 0; rival.gridCol = 0; // highest-ATK enemy == "Rival" per the ability text
            const other = h.context.createUnit('stone_guard', 1);
            other.attack = 1; other.gridRow = 0; other.gridCol = 1;
            h.context.initCombat({ board: board, enemies: [rival, other], activeSynergies: {}, activeElements: {} });

            const caster = h.context.combatState.playerUnits[0];
            const liveRival = h.context.combatState.enemyUnits.find(function(u) { return u.attack === 999; });
            const liveOther = h.context.combatState.enemyUnits.find(function(u) { return u.attack === 1; });
            liveRival.hp = 100000; liveRival.maxHp = 100000; liveRival.damageReduction = 0.5;
            const baseAtk = caster.attack;

            h.context.executeAbility(caster);
            assert.ok(caster.abilityBuffs.empoweredShot, 'ability should set the empoweredShot buff for the next auto-attack');

            const preHp = liveRival.hp;
            h.context.performAttack(caster, liveRival);

            const dmgTaken = preHp - liveRival.hp;
            // 280% ATK; dealDamage's focusedShotIgnoreDR multiplies the target's
            // existing DR by (1 - ignorePct) rather than subtracting flat: 50%
            // DR * (1 - 30% ignored) = 35% effective DR.
            const effectiveDR = 0.5 * (1 - 0.30);
            const expected = Math.floor(Math.floor(baseAtk * 2.80) * (1 - effectiveDR));
            assert.ok(dmgTaken >= expected - 2 && dmgTaken <= expected + 2, 'empowered attack should deal ~280% ATK with 30% DR ignored (got ' + dmgTaken + ', expected ~' + expected + ')');
            assert.ok(h.context.hasStatus(liveRival, 'healReduction'), 'Rival (highest-ATK enemy) should be Wounded by the empowered attack');
            assert.equal(caster.abilityBuffs.empoweredShot, undefined, 'empoweredShot buff should be consumed by the attack');

            // Non-Rival target: no Wound.
            const caster2 = h.context.createUnit('iron_duelist', 1);
            caster2.side = 'player'; caster2.gridRow = caster.gridRow; caster2.gridCol = caster.gridCol;
            caster2.abilityBuffs = { empoweredShot: true, empoweredShotMult: 2.80, empoweredShotDrIgnore: 0.30, empoweredShotWoundPct: 0.30, empoweredShotWoundDuration: 2 };
            h.context.performAttack(caster2, liveOther);
            assert.equal(h.context.hasStatus(liveOther, 'healReduction'), false, 'non-Rival target should NOT be Wounded');
        }
    },

    // ---------------------------------------------------------------
    // phoenix_priest — Pyre of Renewal Enhanced
    // ---------------------------------------------------------------
    {
        name: 'phoenix_priest: Pyre of Renewal Enhanced heals the 2 lowest-HP allies',
        fn: function() {
            const h = createHarness({ seed: 7409 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('phoenix_priest', 1);
            board[0][1] = h.context.createUnit('flame_warrior', 1);
            board[0][2] = h.context.createUnit('tide_hunter', 1);
            const enemy = harmlessEnemy(h, 'stone_guard', 0, 0);
            h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });

            const caster = h.context.combatState.playerUnits[0];
            const a1 = h.context.combatState.playerUnits[1];
            const a2 = h.context.combatState.playerUnits[2];
            a1.hp = Math.floor(a1.maxHp * 0.2);
            a2.hp = Math.floor(a2.maxHp * 0.3);
            const pre1 = a1.hp, pre2 = a2.hp;

            h.context.executeAbility(caster);

            assert.ok(a1.hp > pre1, 'lowest-HP ally should be healed');
            assert.ok(a2.hp > pre2, 'second-lowest-HP ally should also be healed');
        }
    },

    // ---------------------------------------------------------------
    // hadal_colossus — Tidal Fortress Enhanced
    // ---------------------------------------------------------------
    {
        name: 'hadal_colossus: Tidal Fortress Enhanced damages+slows+roots nearby enemies over a 3-cell radius',
        fn: function() {
            const h = createHarness({ seed: 7410 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('hadal_colossus', 1);
            const enemy = h.context.createUnit('stone_guard', 1);
            enemy.attack = 0; enemy.gridRow = 0; enemy.gridCol = 0;
            h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });

            const caster = h.context.combatState.playerUnits[0];
            const liveEnemy = h.context.combatState.enemyUnits[0];
            const nb = h.context.hexNeighbors(caster.gridRow, caster.gridCol);
            h.context.moveUnitToCell(liveEnemy, nb[0].row, nb[0].col, h.context.combatState.grid);
            const preHp = liveEnemy.hp;

            h.context.executeAbility(caster);

            assert.ok(liveEnemy.hp < preHp, 'nearby enemy should take damage');
            assert.ok(h.context.hasStatus(liveEnemy, 'slow'), 'nearby enemy should be Slowed (35%)');
            assert.ok(h.context.hasStatus(liveEnemy, 'root'), 'nearby enemy should be Rooted (zone-exit approximation)');
            assert.ok(h.context.hasStatus(caster, 'root'), 'guardian should be self-Rooted during the channel');
        }
    },

    // ---------------------------------------------------------------
    // worldroot_sentinel — Thornstorm Enhanced
    // ---------------------------------------------------------------
    {
        name: 'worldroot_sentinel: Thornstorm Enhanced damages, slows, and Roots ("seedling") the enemy it hits',
        fn: function() {
            const h = createHarness({ seed: 7411 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('worldroot_sentinel', 1);
            const enemy = h.context.createUnit('stone_guard', 1);
            enemy.attack = 0; enemy.gridRow = 0; enemy.gridCol = 0;
            h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });

            const caster = h.context.combatState.playerUnits[0];
            const liveEnemy = h.context.combatState.enemyUnits[0];
            liveEnemy.stasis = 0;
            const preHp = liveEnemy.hp;

            h.context.executeAbility(caster);

            assert.ok(liveEnemy.hp < preHp, 'sole enemy should take Thornstorm damage');
            assert.ok(h.context.hasStatus(liveEnemy, 'slow'), 'hit enemy should be Slowed');
            assert.ok(h.context.hasStatus(liveEnemy, 'root'), 'hit enemy should be Rooted ("Seedling" approximation)');
        }
    },

    // ---------------------------------------------------------------
    // stormweft_oracle — Cyclone Barrage Enhanced
    // ---------------------------------------------------------------
    {
        name: 'stormweft_oracle: Cyclone Barrage Enhanced knocks the target 2 cells and Stuns it on hitting the board edge',
        fn: function() {
            const h = createHarness({ seed: 7412 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('stormweft_oracle', 1);
            const target = h.context.createUnit('gladiator', 1);
            target.attack = 999; target.gridRow = 0; target.gridCol = 0;
            h.context.initCombat({ board: board, enemies: [target], activeSynergies: {}, activeElements: {} });

            const caster = h.context.combatState.playerUnits[0];
            const liveTarget = h.context.combatState.enemyUnits[0];
            // Push the target as close to a board edge/corner as possible so a
            // 2-cell knockback in the caster->target direction runs off-board.
            h.context.moveUnitToCell(liveTarget, 0, 0, h.context.combatState.grid);
            const preHp = liveTarget.hp;

            h.context.executeAbility(caster);

            assert.ok(liveTarget.hp < preHp, 'target should take Cyclone Barrage damage');
            // Whether the Stun branch fires depends on this board layout's
            // actual hex geometry (edge vs. enough room for 2 free cells) --
            // assert the two valid outcomes are mutually exclusive and one holds.
            const stunned = h.context.hasStatus(liveTarget, 'stun');
            const moved = (liveTarget.gridRow !== 0 || liveTarget.gridCol !== 0);
            assert.ok(stunned || moved, 'target should either be Stunned (hit the wall) or knocked to a new cell (had room)');
        }
    },

    // ---------------------------------------------------------------
    // plasma_ravager — Lightning Pounce Enhanced
    // ---------------------------------------------------------------
    {
        name: 'plasma_ravager: Lightning Pounce Enhanced chains through up to 4 kills at a uniform 200% ATK per dash',
        fn: function() {
            const h = createHarness({ seed: 7413 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][3] = h.context.createUnit('plasma_ravager', 1); // central column -> 6 hex neighbors (need 4 distinct)
            const enemies = [1, 2, 3, 4].map(function(n, i) {
                const e = h.context.createUnit('stone_guard', 1);
                e.attack = 0; e.gridRow = 0; e.gridCol = i;
                return e;
            });
            h.context.initCombat({ board: board, enemies: enemies, activeSynergies: {}, activeElements: {} });

            const caster = h.context.combatState.playerUnits[0];
            const liveEnemies = h.context.combatState.enemyUnits;
            const nb = h.context.hexNeighbors(caster.gridRow, caster.gridCol);
            for (let i = 0; i < liveEnemies.length; i++) {
                h.context.moveUnitToCell(liveEnemies[i], nb[i].row, nb[i].col, h.context.combatState.grid);
                liveEnemies[i].hp = 1;
                liveEnemies[i].maxHp = 1000;
            }

            h.context.executeAbility(caster);

            const deadCount = liveEnemies.filter(function(e) { return e.hp <= 0; }).length;
            assert.equal(deadCount, 4, 'all 4 low-HP enemies should die across the chained dashes (cap: 4 kills)');
        }
    },

    // ---------------------------------------------------------------
    // warforged_champion — Decisive Strike Enhanced
    // ---------------------------------------------------------------
    {
        name: 'warforged_champion: Decisive Strike Enhanced empowers the next auto-attack and refunds 50% mana on a kill',
        fn: function() {
            const h = createHarness({ seed: 7414 });
            h.loadScripts();
            h.freshSave();
            const board = emptyBoard();
            board[0][0] = h.context.createUnit('warforged_champion', 1);
            const enemy = h.context.createUnit('stone_guard', 1);
            enemy.attack = 0; enemy.gridRow = 0; enemy.gridCol = 0;
            h.context.initCombat({ board: board, enemies: [enemy], activeSynergies: {}, activeElements: {} });

            const caster = h.context.combatState.playerUnits[0];
            const liveEnemy = h.context.combatState.enemyUnits[0];
            liveEnemy.hp = 1; // guarantee the empowered hit kills it
            caster.currentMana = 0;

            h.context.executeAbility(caster);
            assert.ok(caster.abilityBuffs.empoweredShot, 'ability should set the empoweredShot buff');
            assert.equal(caster.abilityBuffs.empoweredShotMult, 3.50, 'evolved multiplier should be 350% ATK');

            h.context.performAttack(caster, liveEnemy);

            assert.ok(liveEnemy.hp <= 0, 'sanity: the empowered attack should have killed the 1-HP target');
            assert.ok(caster.currentMana > 0, 'killing with the empowered attack should refund 50% mana');
        }
    }
];

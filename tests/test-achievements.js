// =============================================================================
// tests/test-achievements.js — achievement stat wiring (PHASE2-AUDIT item 5 /
// MASTERPLAN.md 2.5). Covers uniqueBondsUsed (wired on team deploy in
// js/teams.js) and confirms checkAchievements() picks it up via the existing
// catch-all call sites, plus the combat-driven stats added in Prompt 62
// (bossesDefeated, deathlessBossClears, maxSingleHit, fastestWin,
// maxElementSynergy -- wired via the combatEvents bus in combat-core.js's
// initCombat()). forgeOperations coverage lives in tests/test-items.js
// alongside the forge functions it instruments.
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

// Gives a save a collection entry + puts the unit on the active team's board
// at the next free slot, mirroring what the team builder does before deploy.
function deployPair(h, sd, unitKeyA, unitKeyB, rowBase) {
    sd.collection[unitKeyA] = { stars: 1, copiesForNext: 0 };
    sd.collection[unitKeyB] = { stars: 1, copiesForNext: 0 };
    const team = h.context.getActiveTeam(sd);
    team.slots = [
        { key: unitKeyA, row: rowBase, col: 0 },
        { key: unitKeyB, row: rowBase, col: 1 }
    ];
    return h.context.deployTeam(sd);
}

function emptyBoard() {
    return [
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null]
    ];
}

// A minimal but valid boss enemy -- same shape ui-combat.js's startMissionCombat()
// builds from BOSS_DATA, trimmed to a single-phase, no-minion boss so
// processBossTick()/processBossTelegraphs()/processBossMinions() run safely
// without needing real BOSS_DATA content.
function makeTestBoss(hp, attack) {
    return {
        name: 'Test Boss', emoji: '👑', element: null,
        hp: hp, maxHp: hp, attack: attack, attackSpd: 1.2, range: 1, moveSpd: 0,
        damageReduction: 0, dodgeChance: 0,
        type: 'boss', side: 'enemy', isBoss: true, bossSize: [1, 1],
        bossData: { phases: [{ hpThreshold: 1.0, abilities: [] }], enrageTime: 99999, enrageAtkMult: 1, enrageSpdMult: 1 },
        currentPhase: 0, phaseTransitioning: false, phaseTransitionTimer: 0,
        enraged: false, telegraphs: [], abilityCooldowns: {}, minionCooldowns: {},
        maxMana: 0, currentMana: 0,
        gridRow: 0, gridCol: 3
    };
}

function pumpToEnd(h, dt, maxTicks) {
    let ticks = 0;
    while (h.context.combatState && h.context.combatState.running && ticks < maxTicks) {
        h.context.combatTick(dt);
        ticks++;
    }
    return ticks;
}

module.exports = [
    {
        name: 'uniqueBondsUsed stat (PHASE2-AUDIT item 5): deployTeam() records a newly-triggered duo bond',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.stats.uniqueBondsUsed = 0;
            sd.stats.bondsUsedSeen = [];

            deployPair(h, sd, 'flame_warrior', 'pyromancer', 0); // fire_duo

            assert.equal(sd.stats.uniqueBondsUsed, 1, 'uniqueBondsUsed should be 1 after triggering fire_duo');
            assert.ok(sd.stats.bondsUsedSeen.indexOf('fire_duo') >= 0, 'fire_duo should be recorded as seen');
        }
    },
    {
        name: 'uniqueBondsUsed stat: re-deploying the SAME bond does not double-count it',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.stats.uniqueBondsUsed = 0;
            sd.stats.bondsUsedSeen = [];

            deployPair(h, sd, 'flame_warrior', 'pyromancer', 0); // fire_duo
            deployPair(h, sd, 'flame_warrior', 'pyromancer', 0); // fire_duo again

            assert.equal(sd.stats.uniqueBondsUsed, 1, 'redeploying the same bond should still count as 1 distinct bond');
        }
    },
    {
        name: 'bond_collector achievement fires once 5 distinct bonds have been triggered across deploys',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.stats.uniqueBondsUsed = 0;
            sd.stats.bondsUsedSeen = [];
            assert.equal(sd.achievements.earned.indexOf('bond_collector'), -1, 'should not be earned at 0 bonds');

            deployPair(h, sd, 'flame_warrior', 'pyromancer', 0);   // fire_duo    -> 1
            deployPair(h, sd, 'frost_archer', 'tidal_shaman', 0);  // water_duo   -> 2
            deployPair(h, sd, 'stone_guard', 'golem', 0);          // earth_duo   -> 3
            deployPair(h, sd, 'zephyr_scout', 'wind_duelist', 0);  // wind_duo    -> 4
            let newlyEarned = h.context.checkAchievements(sd);
            assert.equal(newlyEarned.indexOf('bond_collector'), -1, 'should not fire yet at 4 distinct bonds');

            deployPair(h, sd, 'spark_fencer', 'thunder_archer', 0); // lightning_duo -> 5
            assert.equal(sd.stats.uniqueBondsUsed, 5, 'uniqueBondsUsed should reach 5');

            newlyEarned = h.context.checkAchievements(sd);
            assert.ok(newlyEarned.indexOf('bond_collector') >= 0, 'bond_collector should be newly earned at 5 distinct bonds');
        }
    },

    // ---------------------------------------------------------------
    // Prompt 62: combat-driven achievement stats (rest of PHASE2-AUDIT item 5).
    // Driven directly through initCombat()/combatTick() (same low-level pattern
    // as tests/test-encounters.js) for deterministic control over the fight.
    // ---------------------------------------------------------------
    {
        name: 'combat stats: a clean boss win with zero player deaths records bossesDefeated AND deathlessBossClears',
        fn: function() {
            const h = createHarness({ seed: 20 });
            const sd = h.freshSave();
            const p = h.context.createUnit('flame_warrior', 1);
            p.attack = 5000; // one-shots the weak test boss
            const board = emptyBoard();
            board[0][0] = p;
            const boss = makeTestBoss(100, 0); // trivial boss, deals no damage

            h.context.activeMission = { encounterMechanic: null };
            h.context.currentWaveIndex = 0;
            h.context.initCombat({ board: board, enemies: [boss], phase: 'combat', activeSynergies: {}, activeElements: {} });
            pumpToEnd(h, 0.05, 2000);

            assert.equal(h.context.combatState.result, 'win', 'the fight should resolve as a win');
            assert.equal(sd.stats.bossesDefeated, 1, 'bossesDefeated should be recorded on a boss win');
            assert.equal(sd.stats.deathlessBossClears, 1, 'deathlessBossClears should be recorded when no player unit died');
        }
    },
    {
        name: 'combat stats: a boss win where a player unit died records bossesDefeated but NOT deathlessBossClears',
        fn: function() {
            const h = createHarness({ seed: 21 });
            const sd = h.freshSave();
            const p = h.context.createUnit('flame_warrior', 1);
            p.attack = 5000;
            const board = emptyBoard();
            board[0][0] = p;
            const boss = makeTestBoss(100, 0);

            h.context.activeMission = { encounterMechanic: null };
            h.context.currentWaveIndex = 0;
            h.context.initCombat({ board: board, enemies: [boss], phase: 'combat', activeSynergies: {}, activeElements: {} });
            // Simulate a player-side death via the combat event bus (the same
            // 'unitKilled' event the real damage pipeline emits on a kill) --
            // deterministic and independent of this fight's actual HP totals.
            h.context.combatEvents.emit('unitKilled', { killer: boss, victim: p, amount: 999 });
            pumpToEnd(h, 0.05, 2000);

            assert.equal(h.context.combatState.result, 'win', 'the fight should still resolve as a win');
            assert.equal(sd.stats.bossesDefeated, 1, 'bossesDefeated should still be recorded');
            assert.equal(sd.stats.deathlessBossClears, 0, 'deathlessBossClears should NOT be recorded once a player death occurred this wave');
        }
    },
    {
        name: 'combat stats: maxSingleHit records the largest single hit dealt during the fight',
        fn: function() {
            const h = createHarness({ seed: 22 });
            const sd = h.freshSave();
            const p = h.context.createUnit('flame_warrior', 1);
            p.attack = 5000;
            const board = emptyBoard();
            board[0][0] = p;
            const boss = makeTestBoss(100, 0);

            h.context.activeMission = { encounterMechanic: null };
            h.context.currentWaveIndex = 0;
            h.context.initCombat({ board: board, enemies: [boss], phase: 'combat', activeSynergies: {}, activeElements: {} });
            pumpToEnd(h, 0.05, 2000);

            assert.ok(sd.stats.maxSingleHit > 1000, 'a 5000-ATK hit should register a large maxSingleHit (got ' + sd.stats.maxSingleHit + ')');
        }
    },
    {
        name: 'combat stats: fastestWin keeps the minimum -- a slower win does not overwrite a faster recorded time',
        fn: function() {
            const h = createHarness({ seed: 23 });
            const sd = h.freshSave();
            sd.stats.fastestWin = 0.1; // pretend an extremely fast prior win

            const p = h.context.createUnit('flame_warrior', 1);
            p.attack = 5000;
            const board = emptyBoard();
            board[0][0] = p;
            const boss = makeTestBoss(100, 0);

            h.context.activeMission = { encounterMechanic: null };
            h.context.currentWaveIndex = 0;
            h.context.initCombat({ board: board, enemies: [boss], phase: 'combat', activeSynergies: {}, activeElements: {} });
            pumpToEnd(h, 0.05, 2000);

            assert.equal(h.context.combatState.result, 'win', 'the fight should resolve as a win');
            assert.ok(h.context.combatState.elapsed > 0.1, 'this win should take longer than the preset 0.1s for the min-keeping test to be meaningful');
            assert.equal(sd.stats.fastestWin, 0.1, 'fastestWin should keep the faster previously-recorded time, not this slower win');
        }
    },
    {
        name: 'combat stats: fastestWin records the win time on a fresh save (no prior value to keep)',
        fn: function() {
            const h = createHarness({ seed: 24 });
            const sd = h.freshSave();
            assert.equal(sd.stats.fastestWin, 999999, 'fresh saves start with the fastestWin sentinel default');

            const p = h.context.createUnit('flame_warrior', 1);
            p.attack = 5000;
            const board = emptyBoard();
            board[0][0] = p;
            const boss = makeTestBoss(100, 0);

            h.context.activeMission = { encounterMechanic: null };
            h.context.currentWaveIndex = 0;
            h.context.initCombat({ board: board, enemies: [boss], phase: 'combat', activeSynergies: {}, activeElements: {} });
            pumpToEnd(h, 0.05, 2000);

            assert.equal(h.context.combatState.result, 'win', 'the fight should resolve as a win');
            assert.equal(sd.stats.fastestWin, h.context.combatState.elapsed, 'fastestWin should be set to this win\'s elapsed time');
            assert.ok(sd.stats.fastestWin < 999999, 'fastestWin should no longer be the sentinel default');
        }
    },
    {
        name: 'combat stats: maxElementSynergy records the highest active element count at combat start',
        fn: function() {
            const h = createHarness({ seed: 25 });
            const sd = h.freshSave();
            const p = h.context.createUnit('flame_warrior', 1);
            const board = emptyBoard();
            board[0][0] = p;
            const e = h.context.createUnit('stone_guard', 1);
            e.attack = 0;
            e.gridRow = 0; e.gridCol = 0;

            h.context.activeMission = { encounterMechanic: null };
            h.context.currentWaveIndex = 0;
            h.context.initCombat({
                board: board, enemies: [e], phase: 'combat',
                activeSynergies: {}, activeElements: { fire: 4, water: 2 }
            });

            assert.equal(sd.stats.maxElementSynergy, 4, 'should record the highest active element count present at combat start');
        }
    },

    // ---------------------------------------------------------------
    // Prompt 62: bond detection unification (PHASE2-AUDIT item 11) -- combat
    // now calls the canonical detectActiveBonds() (units-bonds.js) instead of
    // reimplementing detection inline.
    // ---------------------------------------------------------------
    {
        name: 'bond unification: combatState.activeBonds exactly matches detectActiveBonds() for a bonded team',
        fn: function() {
            const h = createHarness({ seed: 26 });
            const sd = h.freshSave();
            sd.buildings.kindred_circle = 2; // canViewBonds true, non-1.0x bondBonusMult (1.25x)

            const a = h.context.createUnit('flame_warrior', 1);
            const b = h.context.createUnit('pyromancer', 1); // fire_duo with flame_warrior
            const board = emptyBoard();
            board[0][0] = a;
            board[0][1] = b;
            const e = h.context.createUnit('stone_guard', 1);
            e.attack = 0;
            e.gridRow = 0; e.gridCol = 0;

            h.context.activeMission = { encounterMechanic: null };
            h.context.currentWaveIndex = 0;
            h.context.initCombat({ board: board, enemies: [e], phase: 'combat', activeSynergies: {}, activeElements: {} });

            const teamKeys = [a.templateKey, b.templateKey];
            const expected = h.context.detectActiveBonds(teamKeys, sd);

            assert.ok(expected.length > 0, 'fire_duo should be detected as active for this check to be meaningful');
            assert.deepEqual(h.context.combatState.activeBonds, expected, 'combatState.activeBonds should exactly match the canonical detectActiveBonds() output');
        }
    },
    {
        name: 'bond unification: bond bonuses are NOT applied when the Bond Hall (kindred_circle) has not been built',
        fn: function() {
            const h = createHarness({ seed: 27 });
            const sd = h.freshSave();
            sd.buildings.kindred_circle = 0; // not built -> canViewBonds false

            const a = h.context.createUnit('flame_warrior', 1);
            const b = h.context.createUnit('pyromancer', 1);
            const baseAtkA = a.attack;
            const board = emptyBoard();
            board[0][0] = a;
            board[0][1] = b;
            const e = h.context.createUnit('stone_guard', 1);
            e.attack = 0;
            e.gridRow = 0; e.gridCol = 0;

            h.context.activeMission = { encounterMechanic: null };
            h.context.currentWaveIndex = 0;
            h.context.initCombat({ board: board, enemies: [e], phase: 'combat', activeSynergies: {}, activeElements: {} });

            assert.deepEqual(h.context.combatState.activeBonds, [], 'no bonds should be marked active in combat without a built Bond Hall');
            assert.equal(a.attack, baseAtkA, 'fire_duo\'s +8% ATK should not apply without a built Bond Hall');
        }
    }
];

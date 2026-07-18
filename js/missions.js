// =============================================================================
// missions.js — Mission definitions, wave generation, rewards (v6 — Region system)
// =============================================================================

// VE reward per stage by region
var MISSION_VE_PER_STAGE = {
    1: 200,   // R1
    2: 350,   // R2
    3: 550,   // R3
    4: 750,   // R4
    5: 1000,  // R5
    6: 1300,  // R6
    7: 1600,  // R7
    8: 2000   // R8
};

// Unit drop tier weights by region (not player level)
var MISSION_TIER_WEIGHTS_BY_REGION = {
    1: [70, 30, 0,  0,  0],
    2: [50, 40, 10, 0,  0],
    3: [30, 35, 35, 0,  0],
    4: [15, 25, 45, 15, 0],
    5: [5,  15, 40, 35, 5],
    6: [5,  10, 30, 40, 15],
    7: [0,  5,  20, 45, 30],
    8: [0,  0,  15, 45, 40]
};

// ---- Stage Definitions (74 stages across 8 regions) ----
// Stage structure: 9-9-9-9-10-10-10-8
// Fields: id, region, name, stageNumber, stageType, description, requiredLevel, lock,
//         encounterMechanic, waves, boss, isBoss, canRetry, rewards {ve, xp, unitDrops}, dropWeights

var STAGES = [
    // ===== REGION 1: The Frontier (8 stages + 1 boss = 9) =====
    {
        id: 'r1_s1', region: 1, name: 'First Steps', stageNumber: 1, stageType: 'story',
        description: 'The Veil is thinnest at the frontier edge. Place your units and watch them fight.',
        requiredLevel: 1, lock: null, encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 3, maxCost: 1, count: 2 },
            { budget: 4, maxCost: 1, count: 2 }
        ],
        rewards: { ve: 200, xp: 80, unitDrops: 2 },
        dropWeights: { t1: 70, t2: 30 }
    },
    {
        id: 'r1_s2', region: 1, name: 'Border Patrol', stageNumber: 2, stageType: 'character',
        description: 'More creatures slip through, wave after wave. Reposition between waves to adapt.',
        requiredLevel: 1, lock: null, encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 4, maxCost: 1, count: 2 },
            { budget: 5, maxCost: 1, count: 3 },
            { budget: 6, maxCost: 1, count: 3 }
        ],
        rewards: { ve: 200, xp: 80, unitDrops: 2 },
        dropWeights: { t1: 70, t2: 30 }
    },
    {
        id: 'r1_s3', region: 1, name: 'The Crossing', stageNumber: 3, stageType: 'gameplay',
        description: 'Stronger creatures guard the ancient bridge. Cost-2 enemies appear for the first time.',
        requiredLevel: 2, lock: null, encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 3, maxCost: 2, count: 2 },
            { budget: 5, maxCost: 2, count: 3 },
            { budget: 5, maxCost: 2, count: 3 }
        ],
        rewards: { ve: 200, xp: 80, unitDrops: 2 },
        dropWeights: { t1: 70, t2: 30 }
    },
    {
        id: 'r1_s4', region: 1, name: 'Settling In', stageNumber: 4, stageType: 'story',
        description: 'Element-biased enemies test your positioning. First exposure to element matchups.',
        requiredLevel: 2, lock: null, encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 4, maxCost: 2, count: 2, elementBias: 'fire' },
            { budget: 5, maxCost: 2, count: 3, elementBias: 'water' },
            { budget: 5, maxCost: 2, count: 3 }
        ],
        rewards: { ve: 200, xp: 80, unitDrops: 2 },
        dropWeights: { t1: 70, t2: 30 }
    },
    {
        id: 'r1_s5', region: 1, name: 'Night Raid', stageNumber: 5, stageType: 'gameplay',
        description: 'Voidspawn attack the camp at night. Tests what the player has learned so far.',
        requiredLevel: 3, lock: null, encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 4, maxCost: 2, count: 2 },
            { budget: 5, maxCost: 2, count: 3 },
            { budget: 5, maxCost: 2, count: 3 }
        ],
        rewards: { ve: 200, xp: 80, unitDrops: 2 },
        dropWeights: { t1: 70, t2: 30 }
    },
    {
        id: 'r1_s6', region: 1, name: 'The Family', stageNumber: 6, stageType: 'character',
        description: 'A frontier family refuses to evacuate. Clear the patrol route to keep them safe.',
        requiredLevel: 3, lock: null, encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 3, maxCost: 2, count: 2 },
            { budget: 4, maxCost: 2, count: 2 },
            { budget: 4, maxCost: 2, count: 3 }
        ],
        rewards: { ve: 200, xp: 80, unitDrops: 2 },
        dropWeights: { t1: 70, t2: 30 }
    },
    {
        id: 'r1_s7', region: 1, name: 'Otho\'s Notes', stageNumber: 7, stageType: 'story',
        description: 'Voidspawn emergence near the Veilborn quarter. Clue #1 — the precision of the attacks.',
        requiredLevel: 3, lock: null, encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 5, maxCost: 2, count: 3 },
            { budget: 6, maxCost: 2, count: 3 },
            { budget: 6, maxCost: 2, count: 3 }
        ],
        rewards: { ve: 200, xp: 80, unitDrops: 2 },
        dropWeights: { t1: 70, t2: 30 }
    },
    {
        id: 'r1_s8', region: 1, name: 'Into the Wild', stageNumber: 8, stageType: 'gameplay',
        description: 'Mixed creatures with elemental affinities. Pre-boss difficulty — element matchups matter.',
        requiredLevel: 4, lock: null, encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 4, maxCost: 2, count: 2, elementBias: 'fire' },
            { budget: 5, maxCost: 2, count: 3, elementBias: 'water' },
            { budget: 5, maxCost: 2, count: 3 }
        ],
        rewards: { ve: 200, xp: 80, unitDrops: 2 },
        dropWeights: { t1: 70, t2: 30 }
    },
    {
        id: 'r1_boss', region: 1, name: 'The Veil Warden', stageNumber: 9, stageType: 'boss',
        description: 'A corrupted entity born from the Shattering guards the frontier gate. Big, telegraphed, dangerous.',
        requiredLevel: 4, lock: null, encounterMechanic: null, isBoss: true, canRetry: true,
        waves: [], boss: 'veil_warden',
        rewards: { ve: 500, xp: 200, unitDrops: 2 },
        dropWeights: { t1: 70, t2: 30 }
    },

    // ===== REGION 2: The Barracks Trials (8 stages + 1 boss = 9) =====
    {
        id: 'r2_s1', region: 2, name: 'The Road to the Barracks', stageNumber: 1, stageType: 'story',
        description: 'Mira joins the group. Guardians absorb the punishment so damage dealers survive.',
        requiredLevel: 5, lock: { type: 'archetype', value: 'guardian', count: 2 },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 5, maxCost: 2, count: 3 },
            { budget: 7, maxCost: 2, count: 3, synergyBias: 'duelist' }
        ],
        rewards: { ve: 350, xp: 130, unitDrops: 2 },
        dropWeights: { t1: 50, t2: 40, t3: 10 }
    },
    {
        id: 'r2_s2', region: 2, name: 'Hold the Line', stageNumber: 2, stageType: 'character',
        description: 'Heavy melee rushers charge your backline. Guardians hold the initial charge.',
        requiredLevel: 5, lock: { type: 'archetype', value: 'guardian', count: 2 },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 5, maxCost: 2, count: 3, synergyBias: 'duelist' },
            { budget: 6, maxCost: 2, count: 3, synergyBias: 'predator' },
            { budget: 8, maxCost: 3, count: 4, synergyBias: 'duelist' }
        ],
        rewards: { ve: 350, xp: 130, unitDrops: 2 },
        dropWeights: { t1: 50, t2: 40, t3: 10 }
    },
    {
        id: 'r2_s3', region: 2, name: 'Death from Afar', stageNumber: 3, stageType: 'gameplay',
        description: 'Tanky but slow enemies lumber forward. Ranged units chip them down.',
        requiredLevel: 6, lock: { type: 'archetype', value: 'ranger', count: 2 },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 4, maxCost: 2, count: 3, synergyBias: 'guardian' },
            { budget: 5, maxCost: 3, count: 3, synergyBias: 'guardian' },
            { budget: 6, maxCost: 3, count: 3, synergyBias: 'guardian' }
        ],
        rewards: { ve: 350, xp: 130, unitDrops: 2 },
        dropWeights: { t1: 50, t2: 40, t3: 10 }
    },
    {
        id: 'r2_s4', region: 2, name: 'The Arcane Barrage', stageNumber: 4, stageType: 'character',
        description: 'Spread enemies with a healer in the back. Bring magic to burst through the healing.',
        requiredLevel: 6, lock: { type: 'archetype_or', value: ['sorcerer', 'mystic'], count: 2 },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 5, maxCost: 2, count: 3, synergyBias: 'sage' },
            { budget: 6, maxCost: 3, count: 3 },
            { budget: 8, maxCost: 3, count: 4, synergyBias: 'sage' }
        ],
        rewards: { ve: 350, xp: 130, unitDrops: 2 },
        dropWeights: { t1: 50, t2: 40, t3: 10 }
    },
    {
        id: 'r2_s5', region: 2, name: 'The Hunt', stageNumber: 5, stageType: 'gameplay',
        description: 'A dangerous backline carry hides behind tanks. Dive archetypes bypass frontlines.',
        requiredLevel: 7, lock: { type: 'archetype_or', value: ['predator', 'duelist'], count: 2 },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 5, maxCost: 3, count: 3, synergyBias: 'guardian' },
            { budget: 6, maxCost: 3, count: 3, synergyBias: 'guardian' },
            { budget: 6, maxCost: 3, count: 3, synergyBias: 'ranger' }
        ],
        rewards: { ve: 350, xp: 130, unitDrops: 2 },
        dropWeights: { t1: 50, t2: 40, t3: 10 }
    },
    {
        id: 'r2_s6', region: 2, name: 'Second Chances', stageNumber: 6, stageType: 'character',
        description: 'Multi-wave sustain check. Damage carries between waves — healing keeps the team alive.',
        requiredLevel: 7, lock: { type: 'archetype', value: 'sage', count: 2 },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 6, maxCost: 2, count: 3 },
            { budget: 8, maxCost: 2, count: 3 },
            { budget: 8, maxCost: 3, count: 4 }
        ],
        rewards: { ve: 350, xp: 130, unitDrops: 2 },
        dropWeights: { t1: 50, t2: 40, t3: 10 }
    },
    {
        id: 'r2_s7', region: 2, name: 'The Archive', stageNumber: 7, stageType: 'story',
        description: 'Voidspawn incursion near the archive. Clue #2 — the Wellspring reference.',
        requiredLevel: 8, lock: null, encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 6, maxCost: 3, count: 3 },
            { budget: 7, maxCost: 3, count: 3 }
        ],
        rewards: { ve: 350, xp: 130, unitDrops: 2 },
        dropWeights: { t1: 50, t2: 40, t3: 10 }
    },
    {
        id: 'r2_s8', region: 2, name: 'Restoration', stageNumber: 8, stageType: 'gameplay',
        description: 'Final training exercise. Extended endurance — sustain across many waves.',
        requiredLevel: 8, lock: null, encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 5, maxCost: 2, count: 3 },
            { budget: 6, maxCost: 2, count: 3 },
            { budget: 6, maxCost: 3, count: 3 },
            { budget: 7, maxCost: 3, count: 3 }
        ],
        rewards: { ve: 350, xp: 130, unitDrops: 2 },
        dropWeights: { t1: 50, t2: 40, t3: 10 }
    },
    {
        id: 'r2_boss', region: 2, name: 'The Archon', stageNumber: 9, stageType: 'boss',
        description: 'Shifts between archetype stances — Guardian, Predator, Sorcerer. A balanced team handles all three.',
        requiredLevel: 8, lock: null, encounterMechanic: null, isBoss: true, canRetry: true,
        waves: [], boss: 'archon',
        rewards: { ve: 700, xp: 300, unitDrops: 2 },
        dropWeights: { t1: 50, t2: 40, t3: 10 }
    },

    // ===== REGION 3: The Synergy Trials (8 stages + 1 boss = 9) =====
    {
        id: 'r3_s1', region: 3, name: 'Shield and Fang', stageNumber: 1, stageType: 'gameplay',
        description: 'Balanced enemy comp with frontline and backline. Guardians hold while Predators flank.',
        requiredLevel: 9, lock: { constraints: [{ type: 'archetype', value: 'guardian', count: 2 }, { type: 'archetype', value: 'predator', count: 2 }] },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 9, maxCost: 3, count: 4 },
            { budget: 12, maxCost: 3, count: 4 },
            { budget: 15, maxCost: 3, count: 5 }
        ],
        rewards: { ve: 550, xp: 200, unitDrops: 2 },
        dropWeights: { t1: 30, t2: 35, t3: 35 }
    },
    {
        id: 'r3_s2', region: 3, name: 'The Long Watch', stageNumber: 2, stageType: 'story',
        description: 'Aggressive fast rushers. Rangers deal damage from safety, Sages sustain.',
        requiredLevel: 9, lock: { constraints: [{ type: 'archetype', value: 'ranger', count: 2 }, { type: 'archetype', value: 'sage', count: 2 }] },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 9, maxCost: 3, count: 4, synergyBias: 'predator' },
            { budget: 11, maxCost: 3, count: 5, synergyBias: 'duelist' },
            { budget: 13, maxCost: 3, count: 5, synergyBias: 'predator' }
        ],
        rewards: { ve: 550, xp: 200, unitDrops: 2 },
        dropWeights: { t1: 30, t2: 35, t3: 35 }
    },
    {
        id: 'r3_s3', region: 3, name: 'Elemental Clash', stageNumber: 3, stageType: 'gameplay',
        description: 'Mono-element enemies test your element coverage. Half your team shreds, half struggles.',
        requiredLevel: 10, lock: { type: 'element_count', count: 2 },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 10, maxCost: 3, count: 4, elementBias: 'fire' },
            { budget: 12, maxCost: 3, count: 5, elementBias: 'water' },
            { budget: 14, maxCost: 4, count: 5, elementBias: 'earth' }
        ],
        rewards: { ve: 550, xp: 200, unitDrops: 2 },
        dropWeights: { t1: 30, t2: 35, t3: 35 }
    },
    {
        id: 'r3_s4', region: 3, name: 'Cracks', stageNumber: 4, stageType: 'story',
        description: 'Stack three of one archetype and feel the synergy bonus activate. Deep stacking changes the game.',
        requiredLevel: 10, lock: { type: 'archetype_deep', count: 3 },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 10, maxCost: 3, count: 4 },
            { budget: 12, maxCost: 3, count: 5, enemySynergies: true },
            { budget: 14, maxCost: 4, count: 5, enemySynergies: true }
        ],
        rewards: { ve: 550, xp: 200, unitDrops: 2 },
        dropWeights: { t1: 30, t2: 35, t3: 35 }
    },
    {
        id: 'r3_s5', region: 3, name: 'Deep Bonds', stageNumber: 5, stageType: 'gameplay',
        description: 'A heavily fortified Voidspawn position. Deep archetype synergy needed to crack it.',
        requiredLevel: 11, lock: null, encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 11, maxCost: 3, count: 5 },
            { budget: 13, maxCost: 4, count: 5 },
            { budget: 16, maxCost: 4, count: 6 }
        ],
        rewards: { ve: 550, xp: 200, unitDrops: 2 },
        dropWeights: { t1: 30, t2: 35, t3: 35 }
    },
    {
        id: 'r3_s6', region: 3, name: 'The Veteran', stageNumber: 6, stageType: 'story',
        description: 'Clue #3 — the veteran soldier notices attacks track Veilborn headcount.',
        requiredLevel: 11, lock: { type: 'element_count', count: 2 },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 8, maxCost: 3, count: 3 },
            { budget: 9, maxCost: 4, count: 4 },
            { budget: 10, maxCost: 4, count: 4 }
        ],
        rewards: { ve: 550, xp: 200, unitDrops: 2 },
        dropWeights: { t1: 30, t2: 35, t3: 35 }
    },
    {
        id: 'r3_s7', region: 3, name: 'Convergence', stageNumber: 7, stageType: 'gameplay',
        description: 'Multiple Voidspawn forces converging on the central settlement. All hands needed.',
        requiredLevel: 12, lock: null, encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 12, maxCost: 3, count: 5 },
            { budget: 14, maxCost: 4, count: 5 },
            { budget: 16, maxCost: 4, count: 6 },
            { budget: 19, maxCost: 4, count: 6 }
        ],
        rewards: { ve: 550, xp: 200, unitDrops: 2 },
        dropWeights: { t1: 30, t2: 35, t3: 35 }
    },
    {
        id: 'r3_s8', region: 3, name: 'The Horizon', stageNumber: 8, stageType: 'character',
        description: 'Final sweep before the boss. The Sovereign is sighted for the first time.',
        requiredLevel: 12, lock: null, encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 11, maxCost: 4, count: 4 },
            { budget: 12, maxCost: 4, count: 5 },
            { budget: 13, maxCost: 4, count: 5 }
        ],
        rewards: { ve: 550, xp: 200, unitDrops: 2 },
        dropWeights: { t1: 30, t2: 35, t3: 35 }
    },
    {
        id: 'r3_boss', region: 3, name: 'The Twin Heralds', stageNumber: 9, stageType: 'boss',
        description: 'Two bosses at once. Proximity buff and kill-order puzzle — synergy thinking at its finest.',
        requiredLevel: 12, lock: null, encounterMechanic: null, isBoss: true, canRetry: true,
        waves: [], boss: 'twin_heralds',
        rewards: { ve: 1100, xp: 500, unitDrops: 2 },
        dropWeights: { t1: 30, t2: 35, t3: 35 }
    },

    // ===== REGION 4: The Shattered Lands (8 stages + 1 boss = 9) =====
    {
        id: 'r4_s1', region: 4, name: 'Thin Air', stageNumber: 1, stageType: 'story',
        description: 'Entering the Shattered Lands. The landscape shifts between worlds. Stronger enemies.',
        requiredLevel: 13, lock: null, encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 10, maxCost: 3, count: 4 },
            { budget: 13, maxCost: 4, count: 5 },
            { budget: 16, maxCost: 4, count: 5 }
        ],
        rewards: { ve: 750, xp: 280, unitDrops: 3 },
        dropWeights: { t1: 15, t2: 25, t3: 45, t4: 15 }
    },
    {
        id: 'r4_s2', region: 4, name: 'The Observatory', stageNumber: 2, stageType: 'story',
        description: 'Protect the observatory while Otho researches. Enemies assault the perimeter.',
        requiredLevel: 13, lock: null, encounterMechanic: 'protect_objective', isBoss: false, canRetry: true,
        waves: [
            { budget: 11, maxCost: 3, count: 5 },
            { budget: 14, maxCost: 4, count: 5 },
            { budget: 16, maxCost: 4, count: 6 }
        ],
        rewards: { ve: 750, xp: 280, unitDrops: 3 },
        dropWeights: { t1: 15, t2: 25, t3: 45, t4: 15 }
    },
    {
        id: 'r4_s3', region: 4, name: 'The Sovereign\'s Shadow', stageNumber: 3, stageType: 'story',
        description: 'Retreat mission — the Sovereign regenerates enemies. Fighting harder makes it stronger.',
        requiredLevel: 14, lock: null, encounterMechanic: 'reinforcement_pressure', isBoss: false, canRetry: true,
        waves: [
            { budget: 13, maxCost: 3, count: 5 },
            { budget: 16, maxCost: 4, count: 5 },
            { budget: 20, maxCost: 4, count: 6 }
        ],
        rewards: { ve: 750, xp: 280, unitDrops: 3 },
        dropWeights: { t1: 15, t2: 25, t3: 45, t4: 15 }
    },
    {
        id: 'r4_s4', region: 4, name: 'The Silence', stageNumber: 4, stageType: 'character',
        description: 'The morning after the revelation. Standard enemies, but the fight feels hollow.',
        requiredLevel: 14, lock: null, encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 13, maxCost: 4, count: 5 },
            { budget: 16, maxCost: 4, count: 5 },
            { budget: 18, maxCost: 4, count: 6 }
        ],
        rewards: { ve: 750, xp: 280, unitDrops: 3 },
        dropWeights: { t1: 15, t2: 25, t3: 45, t4: 15 }
    },
    {
        id: 'r4_s5', region: 4, name: 'Midnight', stageNumber: 5, stageType: 'story',
        description: 'Kael vs Lyric. The fracture. Protect the Veilborn or defeat Lyric.',
        requiredLevel: 15, lock: null, encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 14, maxCost: 4, count: 5 },
            { budget: 16, maxCost: 4, count: 5 },
            { budget: 20, maxCost: 4, count: 6 }
        ],
        rewards: { ve: 750, xp: 280, unitDrops: 3 },
        dropWeights: { t1: 15, t2: 25, t3: 45, t4: 15 }
    },
    {
        id: 'r4_s6', region: 4, name: 'The Priority', stageNumber: 6, stageType: 'gameplay',
        description: 'An enemy healer buffs all allies with +25% ATK and regeneration. Kill the VIP.',
        requiredLevel: 15, lock: null, encounterMechanic: 'vip_target', isBoss: false, canRetry: true,
        waves: [
            { budget: 15, maxCost: 4, count: 5 },
            { budget: 18, maxCost: 4, count: 6 },
            { budget: 20, maxCost: 4, count: 6 }
        ],
        rewards: { ve: 750, xp: 280, unitDrops: 3 },
        dropWeights: { t1: 15, t2: 25, t3: 45, t4: 15 }
    },
    {
        id: 'r4_s7', region: 4, name: 'Against the Clock', stageNumber: 7, stageType: 'gameplay',
        description: 'A Veil Crystal charges a wipe ability. Destroy it before 45 seconds.',
        requiredLevel: 16, lock: null, encounterMechanic: 'countdown', isBoss: false, canRetry: true,
        waves: [
            { budget: 16, maxCost: 4, count: 5 },
            { budget: 18, maxCost: 4, count: 6 },
            { budget: 20, maxCost: 4, count: 6 }
        ],
        rewards: { ve: 750, xp: 280, unitDrops: 3 },
        dropWeights: { t1: 15, t2: 25, t3: 45, t4: 15 }
    },
    {
        id: 'r4_s8', region: 4, name: 'Endless Tide', stageNumber: 8, stageType: 'gameplay',
        description: 'Three spawn points produce new enemies every 8 seconds. Power through the center.',
        requiredLevel: 16, lock: null, encounterMechanic: 'reinforcement_pressure', isBoss: false, canRetry: true,
        waves: [
            { budget: 16, maxCost: 4, count: 5 },
            { budget: 20, maxCost: 4, count: 6 },
            { budget: 24, maxCost: 4, count: 7 }
        ],
        rewards: { ve: 750, xp: 280, unitDrops: 3 },
        dropWeights: { t1: 15, t2: 25, t3: 45, t4: 15 }
    },
    {
        id: 'r4_boss', region: 4, name: 'The Shattered Colossus', stageNumber: 9, stageType: 'boss',
        description: 'Cycles through encounter mechanics as phase transitions. The practical exam for adaptive combat.',
        requiredLevel: 16, lock: null, encounterMechanic: null, isBoss: true, canRetry: true,
        waves: [], boss: 'shattered_colossus',
        rewards: { ve: 1500, xp: 700, unitDrops: 3 },
        dropWeights: { t1: 15, t2: 25, t3: 45, t4: 15 }
    },

    // ===== REGION 5: The Dual Convergence (9 stages + 1 boss = 10) =====
    {
        id: 'r5_s1', region: 5, name: 'The Theory', stageNumber: 1, stageType: 'story',
        description: 'Otho presents the seal theory. Mono-element enemies challenge your dual-element team.',
        requiredLevel: 17, lock: { type: 'element_dual' },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 12, maxCost: 3, count: 5, elementBias: 'fire' },
            { budget: 16, maxCost: 4, count: 5, elementBias: 'water' },
            { budget: 20, maxCost: 4, count: 6 }
        ],
        rewards: { ve: 1000, xp: 380, unitDrops: 3 },
        dropWeights: { t1: 5, t2: 15, t3: 40, t4: 35, t5: 5 }
    },
    {
        id: 'r5_s2', region: 5, name: 'Mira\'s Touch', stageNumber: 2, stageType: 'character',
        description: 'Senna teaches Mira attunement. Wave-switching enemies test element coverage.',
        requiredLevel: 17, lock: { type: 'element_dual' },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 14, maxCost: 4, count: 5, elementBias: 'earth' },
            { budget: 18, maxCost: 4, count: 6, elementBias: 'wind' },
            { budget: 22, maxCost: 5, count: 6 }
        ],
        rewards: { ve: 1000, xp: 380, unitDrops: 3 },
        dropWeights: { t1: 5, t2: 15, t3: 40, t4: 35, t5: 5 }
    },
    {
        id: 'r5_s3', region: 5, name: 'Shifting Tides', stageNumber: 3, stageType: 'gameplay',
        description: 'Each wave switches element. Both halves of your team get their moment.',
        requiredLevel: 18, lock: { type: 'element_dual' },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 16, maxCost: 4, count: 5, elementBias: 'earth' },
            { budget: 20, maxCost: 4, count: 6, elementBias: 'wind' },
            { budget: 24, maxCost: 5, count: 6, captain: 'nereus' }
        ],
        rewards: { ve: 1000, xp: 380, unitDrops: 3 },
        dropWeights: { t1: 5, t2: 15, t3: 40, t4: 35, t5: 5 }
    },
    {
        id: 'r5_s4', region: 5, name: 'The River', stageNumber: 4, stageType: 'story',
        description: 'The ferryman recognizes Senna. Mirror-match with dual-element enemies.',
        requiredLevel: 18, lock: { type: 'element_dual' },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 18, maxCost: 4, count: 5, enemySynergies: true },
            { budget: 22, maxCost: 5, count: 6, enemySynergies: true },
            { budget: 26, maxCost: 5, count: 6, enemySynergies: true }
        ],
        rewards: { ve: 1000, xp: 380, unitDrops: 3 },
        dropWeights: { t1: 5, t2: 15, t3: 40, t4: 35, t5: 5 }
    },
    {
        id: 'r5_s5', region: 5, name: 'Silent March', stageNumber: 5, stageType: 'character',
        description: 'The group pushes on. Nobody talks about the ferryman. Standard difficulty.',
        requiredLevel: 19, lock: { type: 'element_dual' },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 18, maxCost: 4, count: 5 },
            { budget: 22, maxCost: 5, count: 6 },
            { budget: 24, maxCost: 5, count: 6 }
        ],
        rewards: { ve: 1000, xp: 380, unitDrops: 3 },
        dropWeights: { t1: 5, t2: 15, t3: 40, t4: 35, t5: 5 }
    },
    {
        id: 'r5_s6', region: 5, name: 'Elemental Pressure', stageNumber: 6, stageType: 'gameplay',
        description: 'Escalating element diversity across waves. Dual-element synergy vs broader coverage.',
        requiredLevel: 19, lock: { type: 'element_dual' },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 20, maxCost: 4, count: 5, elementBias: 'lightning' },
            { budget: 24, maxCost: 5, count: 6 },
            { budget: 28, maxCost: 5, count: 7 }
        ],
        rewards: { ve: 1000, xp: 380, unitDrops: 3 },
        dropWeights: { t1: 5, t2: 15, t3: 40, t4: 35, t5: 5 }
    },
    {
        id: 'r5_s7', region: 5, name: 'The Pack', stageNumber: 7, stageType: 'gameplay',
        description: 'A pack of evolved Voidspawn blocks the path. Higher tier, more dangerous.',
        requiredLevel: 20, lock: { type: 'element_dual' },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 22, maxCost: 5, count: 5, enemyEvolutions: true },
            { budget: 26, maxCost: 5, count: 6, enemyEvolutions: true },
            { budget: 28, maxCost: 5, count: 6, enemyEvolutions: true }
        ],
        rewards: { ve: 1000, xp: 380, unitDrops: 3 },
        dropWeights: { t1: 5, t2: 15, t3: 40, t4: 35, t5: 5 }
    },
    {
        id: 'r5_s8', region: 5, name: 'Senna\'s Burden', stageNumber: 8, stageType: 'character',
        description: 'Senna can\'t sleep. Standard combat, dual-element constraint.',
        requiredLevel: 20, lock: { type: 'element_dual' },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 24, maxCost: 5, count: 6 },
            { budget: 28, maxCost: 5, count: 6 },
            { budget: 28, maxCost: 5, count: 7 }
        ],
        rewards: { ve: 1000, xp: 380, unitDrops: 3 },
        dropWeights: { t1: 5, t2: 15, t3: 40, t4: 35, t5: 5 }
    },
    {
        id: 'r5_s9', region: 5, name: 'Convergence Point', stageNumber: 9, stageType: 'gameplay',
        description: 'The path narrows toward the Chimera. Hard pre-boss stage with enemy synergies.',
        requiredLevel: 20, lock: { type: 'element_dual' },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 24, maxCost: 5, count: 5, enemySynergies: true },
            { budget: 28, maxCost: 5, count: 6, enemySynergies: true },
            { budget: 32, maxCost: 5, count: 7, enemySynergies: true }
        ],
        rewards: { ve: 1000, xp: 380, unitDrops: 3 },
        dropWeights: { t1: 5, t2: 15, t3: 40, t4: 35, t5: 5 }
    },
    {
        id: 'r5_boss', region: 5, name: 'The Elemental Chimera', stageNumber: 10, stageType: 'boss',
        description: 'Shifts between elements every 20s. Heals from damage matching its current element.',
        requiredLevel: 20, lock: null, encounterMechanic: null, isBoss: true, canRetry: true,
        waves: [], boss: 'elemental_chimera',
        rewards: { ve: 2000, xp: 900, unitDrops: 3 },
        dropWeights: { t1: 5, t2: 15, t3: 40, t4: 35, t5: 5 }
    },

    // ===== REGION 6: The Elemental Crucible (9 stages + 1 boss = 10) =====
    {
        id: 'r6_s1', region: 6, name: 'Four Winds', stageNumber: 1, stageType: 'story',
        description: 'Entering the Crucible. Ease into 4-element team building with balanced enemies.',
        requiredLevel: 21, lock: { type: 'element_min', count: 4 },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 24, maxCost: 4, count: 5 },
            { budget: 30, maxCost: 4, count: 6 },
            { budget: 37, maxCost: 5, count: 6 }
        ],
        rewards: { ve: 1300, xp: 500, unitDrops: 3 },
        dropWeights: { t1: 5, t2: 10, t3: 30, t4: 40, t5: 15 }
    },
    {
        id: 'r6_s2', region: 6, name: 'Fire and Stone', stageNumber: 2, stageType: 'story',
        description: 'The siblings at the refugee camp. Fire and Earth enemies with active synergies.',
        requiredLevel: 21, lock: { type: 'element_min', count: 4 },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 20, maxCost: 4, count: 5, elementBias: 'fire', enemySynergies: true },
            { budget: 25, maxCost: 5, count: 6, elementBias: 'earth', enemySynergies: true },
            { budget: 30, maxCost: 5, count: 6, elementBias: 'fire', enemySynergies: true, captain: 'pyra' }
        ],
        rewards: { ve: 1300, xp: 500, unitDrops: 3 },
        dropWeights: { t1: 5, t2: 10, t3: 30, t4: 40, t5: 15 }
    },
    {
        id: 'r6_s3', region: 6, name: 'Storm and Sea', stageNumber: 3, stageType: 'gameplay',
        description: 'Water and Wind enemies with active synergies. Fire and Earth units shine here.',
        requiredLevel: 22, lock: { type: 'element_min', count: 4 },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 23, maxCost: 4, count: 5, elementBias: 'water', enemySynergies: true },
            { budget: 28, maxCost: 5, count: 6, elementBias: 'wind', enemySynergies: true },
            { budget: 33, maxCost: 5, count: 7, enemySynergies: true }
        ],
        rewards: { ve: 1300, xp: 500, unitDrops: 3 },
        dropWeights: { t1: 5, t2: 10, t3: 30, t4: 40, t5: 15 }
    },
    {
        id: 'r6_s4', region: 6, name: 'Mira\'s Question', stageNumber: 4, stageType: 'story',
        description: '"Do you think Lyric was right?" Lightning and Force enemies.',
        requiredLevel: 22, lock: { type: 'element_min', count: 4 },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 25, maxCost: 4, count: 5, elementBias: 'lightning', enemySynergies: true },
            { budget: 30, maxCost: 5, count: 6, elementBias: 'force', enemySynergies: true },
            { budget: 33, maxCost: 5, count: 7, elementBias: 'lightning', enemySynergies: true }
        ],
        rewards: { ve: 1300, xp: 500, unitDrops: 3 },
        dropWeights: { t1: 5, t2: 10, t3: 30, t4: 40, t5: 15 }
    },
    {
        id: 'r6_s5', region: 6, name: 'Lightning Surge', stageNumber: 5, stageType: 'gameplay',
        description: 'Lightning and Force enemies. Earth counters Lightning — bring it.',
        requiredLevel: 23, lock: { type: 'element_min', count: 4 },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 28, maxCost: 4, count: 5, elementBias: 'lightning', enemySynergies: true },
            { budget: 33, maxCost: 5, count: 6, elementBias: 'force', enemySynergies: true },
            { budget: 38, maxCost: 5, count: 7, elementBias: 'lightning', enemySynergies: true, captain: 'gorath' }
        ],
        rewards: { ve: 1300, xp: 500, unitDrops: 3 },
        dropWeights: { t1: 5, t2: 10, t3: 30, t4: 40, t5: 15 }
    },
    {
        id: 'r6_s6', region: 6, name: 'The Weight', stageNumber: 6, stageType: 'character',
        description: 'Senna senses the Veil thinning. Multi-wave endurance check.',
        requiredLevel: 23, lock: { type: 'element_min', count: 4 },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 30, maxCost: 5, count: 6, enemySynergies: true },
            { budget: 35, maxCost: 5, count: 6, enemySynergies: true },
            { budget: 38, maxCost: 5, count: 7, enemySynergies: true }
        ],
        rewards: { ve: 1300, xp: 500, unitDrops: 3 },
        dropWeights: { t1: 5, t2: 10, t3: 30, t4: 40, t5: 15 }
    },
    {
        id: 'r6_s7', region: 6, name: 'The Full Spectrum', stageNumber: 7, stageType: 'gameplay',
        description: 'All 6 elements represented with active synergies and evolved enemies.',
        requiredLevel: 24, lock: { type: 'element_min', count: 4 },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 33, maxCost: 5, count: 6, enemySynergies: true, enemyEvolutions: true },
            { budget: 38, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
            { budget: 38, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true }
        ],
        rewards: { ve: 1300, xp: 500, unitDrops: 3 },
        dropWeights: { t1: 5, t2: 10, t3: 30, t4: 40, t5: 15 }
    },
    {
        id: 'r6_s8', region: 6, name: 'Crucible\'s Peak', stageNumber: 8, stageType: 'gameplay',
        description: 'Full synergies, high star levels, multiple waves. Hardest non-boss stage in region.',
        requiredLevel: 24, lock: { type: 'element_min', count: 4 },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 35, maxCost: 5, count: 6, enemySynergies: true, enemyEvolutions: true },
            { budget: 38, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
            { budget: 38, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true }
        ],
        rewards: { ve: 1300, xp: 500, unitDrops: 3 },
        dropWeights: { t1: 5, t2: 10, t3: 30, t4: 40, t5: 15 }
    },
    {
        id: 'r6_s9', region: 6, name: 'Looking East', stageNumber: 9, stageType: 'character',
        description: 'The Sovereign is visible constantly now. Final sweep before the Sentinel.',
        requiredLevel: 24, lock: { type: 'element_min', count: 4 },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 35, maxCost: 5, count: 6, enemySynergies: true },
            { budget: 38, maxCost: 5, count: 7, enemySynergies: true },
            { budget: 38, maxCost: 5, count: 7, enemySynergies: true }
        ],
        rewards: { ve: 1300, xp: 500, unitDrops: 3 },
        dropWeights: { t1: 5, t2: 10, t3: 30, t4: 40, t5: 15 }
    },
    {
        id: 'r6_boss', region: 6, name: 'The Prismatic Sentinel', stageNumber: 10, stageType: 'boss',
        description: 'Rotating element immunity and vulnerability. 2-3 elements must contribute at all times.',
        requiredLevel: 24, lock: null, encounterMechanic: null, isBoss: true, canRetry: true,
        waves: [], boss: 'prismatic_sentinel',
        rewards: { ve: 2600, xp: 1200, unitDrops: 3 },
        dropWeights: { t1: 5, t2: 10, t3: 30, t4: 40, t5: 15 }
    },

    // ===== REGION 7: The Proving Grounds (9 stages + 1 boss = 10) =====
    {
        id: 'r7_s1', region: 7, name: 'Reunited', stageNumber: 1, stageType: 'story',
        description: 'The splinter group returns. Escalating threat tests healing endurance.',
        requiredLevel: 25, lock: { type: 'archetype', value: 'sage', count: 3 },
        encounterMechanic: 'escalating_threat', isBoss: false, canRetry: true,
        waves: [
            { budget: 27, maxCost: 4, count: 5 },
            { budget: 34, maxCost: 5, count: 6 },
            { budget: 39, maxCost: 5, count: 6 }
        ],
        rewards: { ve: 1600, xp: 650, unitDrops: 3 },
        dropWeights: { t2: 5, t3: 20, t4: 45, t5: 30 }
    },
    {
        id: 'r7_s2', region: 7, name: 'Voss', stageNumber: 2, stageType: 'story',
        description: 'Voss confesses. No element synergies allowed. Pure archetype power vs reinforcements.',
        requiredLevel: 25, lock: { type: 'no_element_synergy' },
        encounterMechanic: 'reinforcement_pressure', isBoss: false, canRetry: true,
        waves: [
            { budget: 30, maxCost: 4, count: 5 },
            { budget: 37, maxCost: 5, count: 6 },
            { budget: 46, maxCost: 5, count: 7, captain: 'sylph' }
        ],
        rewards: { ve: 1600, xp: 650, unitDrops: 3 },
        dropWeights: { t2: 5, t3: 20, t4: 45, t5: 30 }
    },
    {
        id: 'r7_s3', region: 7, name: 'Divided Command', stageNumber: 3, stageType: 'gameplay',
        description: 'Protect a friendly NPC while hunting a dangerous enemy carry.',
        requiredLevel: 26, lock: { constraints: [{ type: 'archetype', value: 'predator', count: 2 }, { type: 'archetype', value: 'guardian', count: 2 }] },
        encounterMechanic: 'protect_objective', isBoss: false, canRetry: true,
        waves: [
            { budget: 25, maxCost: 5, count: 5 },
            { budget: 30, maxCost: 5, count: 6 },
            { budget: 35, maxCost: 5, count: 7 }
        ],
        rewards: { ve: 1600, xp: 650, unitDrops: 3 },
        dropWeights: { t2: 5, t3: 20, t4: 45, t5: 30 }
    },
    {
        id: 'r7_s4', region: 7, name: 'Nosebleed', stageNumber: 4, stageType: 'character',
        description: 'The terrain warps mid-step. Element distribution puzzle with split formation.',
        requiredLevel: 26, lock: { type: 'element_min', count: 3 },
        encounterMechanic: 'split_formation', isBoss: false, canRetry: true,
        waves: [
            { budget: 37, maxCost: 5, count: 5 },
            { budget: 44, maxCost: 5, count: 6 },
            { budget: 46, maxCost: 5, count: 7 }
        ],
        rewards: { ve: 1600, xp: 650, unitDrops: 3 },
        dropWeights: { t2: 5, t3: 20, t4: 45, t5: 30 }
    },
    {
        id: 'r7_s5', region: 7, name: 'Stripped Down', stageNumber: 5, stageType: 'gameplay',
        description: 'No element synergies allowed. Pure archetype power and raw team quality.',
        requiredLevel: 27, lock: { type: 'no_element_synergy' },
        encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 39, maxCost: 5, count: 6 },
            { budget: 46, maxCost: 5, count: 6 },
            { budget: 46, maxCost: 5, count: 7 }
        ],
        rewards: { ve: 1600, xp: 650, unitDrops: 3 },
        dropWeights: { t2: 5, t3: 20, t4: 45, t5: 30 }
    },
    {
        id: 'r7_s6', region: 7, name: 'Fractures', stageNumber: 6, stageType: 'character',
        description: 'Tension between original group and returned fighters. VIP + Countdown mechanics.',
        requiredLevel: 27, lock: null,
        encounterMechanic: ['vip_target', 'countdown'], isBoss: false, canRetry: true,
        waves: [
            { budget: 39, maxCost: 5, count: 6 },
            { budget: 46, maxCost: 5, count: 7 },
            { budget: 46, maxCost: 5, count: 7 }
        ],
        rewards: { ve: 1600, xp: 650, unitDrops: 3 },
        dropWeights: { t2: 5, t3: 20, t4: 45, t5: 30 }
    },
    {
        id: 'r7_s7', region: 7, name: 'Fractured Elements', stageNumber: 7, stageType: 'gameplay',
        description: 'Forced split deployment. Choose element distribution across two groups.',
        requiredLevel: 27, lock: { type: 'element_min', count: 3 },
        encounterMechanic: 'split_formation', isBoss: false, canRetry: true,
        waves: [
            { budget: 44, maxCost: 5, count: 5 },
            { budget: 46, maxCost: 5, count: 6 },
            { budget: 53, maxCost: 5, count: 7 }
        ],
        rewards: { ve: 1600, xp: 650, unitDrops: 3 },
        dropWeights: { t2: 5, t3: 20, t4: 45, t5: 30 }
    },
    {
        id: 'r7_s8', region: 7, name: 'Final Judgment', stageNumber: 8, stageType: 'gameplay',
        description: 'Deep archetype stacking vs a countdown AND a VIP. Capstone stage.',
        requiredLevel: 28, lock: { type: 'archetype_deep', count: 4 },
        encounterMechanic: ['countdown', 'vip_target'], isBoss: false, canRetry: true,
        waves: [
            { budget: 35, maxCost: 5, count: 6 },
            { budget: 40, maxCost: 5, count: 7 },
            { budget: 40, maxCost: 5, count: 7, captain: 'arbiter' }
        ],
        rewards: { ve: 1600, xp: 650, unitDrops: 3 },
        dropWeights: { t2: 5, t3: 20, t4: 45, t5: 30 }
    },
    {
        id: 'r7_s9', region: 7, name: 'The Address', stageNumber: 9, stageType: 'story',
        description: 'Kael presents the seal plan to both factions. Pre-boss stage.',
        requiredLevel: 28, lock: null, encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 46, maxCost: 5, count: 6 },
            { budget: 53, maxCost: 5, count: 7 },
            { budget: 53, maxCost: 5, count: 7 }
        ],
        rewards: { ve: 1600, xp: 650, unitDrops: 3 },
        dropWeights: { t2: 5, t3: 20, t4: 45, t5: 30 }
    },
    {
        id: 'r7_boss', region: 7, name: 'The Arbiter of Trials', stageNumber: 10, stageType: 'boss',
        description: 'The ultimate puzzle boss. Imposes constraints mid-fight: synergy suppression, split formation, countdown.',
        requiredLevel: 28, lock: null, encounterMechanic: null, isBoss: true, canRetry: true,
        waves: [], boss: 'arbiter_of_trials',
        rewards: { ve: 3200, xp: 1500, unitDrops: 3 },
        dropWeights: { t2: 5, t3: 20, t4: 45, t5: 30 }
    },

    // ===== REGION 8: The Abyss Gate (7 stages + 1 boss = 8) =====
    {
        id: 'r8_s1', region: 8, name: 'Dawn', stageNumber: 1, stageType: 'story',
        description: 'The last morning. Mira writes in her notebook. Maximum difficulty enemies.',
        requiredLevel: 29, lock: null, encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 30, maxCost: 5, count: 6, enemySynergies: true, enemyEvolutions: true },
            { budget: 37, maxCost: 5, count: 6, enemySynergies: true, enemyEvolutions: true },
            { budget: 44, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
            { budget: 50, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true }
        ],
        rewards: { ve: 2000, xp: 800, unitDrops: 4 },
        dropWeights: { t3: 15, t4: 45, t5: 40 }
    },
    {
        id: 'r8_s2', region: 8, name: 'The Gauntlet', stageNumber: 2, stageType: 'gameplay',
        description: 'Reinforcement spawns plus an escalating elite. Two overlapping pressure sources.',
        requiredLevel: 29, lock: null,
        encounterMechanic: ['reinforcement_pressure', 'escalating_threat'], isBoss: false, canRetry: true,
        waves: [
            { budget: 25, maxCost: 5, count: 6, enemySynergies: true, enemyEvolutions: true },
            { budget: 30, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
            { budget: 38, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
            { budget: 43, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true }
        ],
        rewards: { ve: 2000, xp: 800, unitDrops: 4 },
        dropWeights: { t3: 15, t4: 45, t5: 40 }
    },
    {
        id: 'r8_s3', region: 8, name: 'Shattered Ground', stageNumber: 3, stageType: 'gameplay',
        description: 'Team split plus a VIP on one side. Roster depth required.',
        requiredLevel: 29, lock: null,
        encounterMechanic: ['split_formation', 'vip_target'], isBoss: false, canRetry: true,
        waves: [
            { budget: 28, maxCost: 5, count: 6, enemySynergies: true, enemyEvolutions: true },
            { budget: 33, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
            { budget: 38, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
            { budget: 43, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true }
        ],
        rewards: { ve: 2000, xp: 800, unitDrops: 4 },
        dropWeights: { t3: 15, t4: 45, t5: 40 }
    },
    {
        id: 'r8_s4', region: 8, name: 'The Crucible Returns', stageNumber: 4, stageType: 'gameplay',
        description: 'Wipe timer AND a friendly NPC to protect. Balance offense and defense.',
        requiredLevel: 29, lock: null,
        encounterMechanic: ['countdown', 'protect_objective'], isBoss: false, canRetry: true,
        waves: [
            { budget: 30, maxCost: 5, count: 6, enemySynergies: true, enemyEvolutions: true },
            { budget: 35, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
            { budget: 38, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
            { budget: 43, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true }
        ],
        rewards: { ve: 2000, xp: 800, unitDrops: 4 },
        dropWeights: { t3: 15, t4: 45, t5: 40 }
    },
    {
        id: 'r8_s5', region: 8, name: 'The Threshold', stageNumber: 5, stageType: 'character',
        description: 'Maximum non-boss difficulty. Full synergies, evolved champions, 4 waves.',
        requiredLevel: 29, lock: null, encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 33, maxCost: 5, count: 6, enemySynergies: true, enemyEvolutions: true },
            { budget: 38, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
            { budget: 38, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
            { budget: 43, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true, captain: 'voidborn_champion' }
        ],
        rewards: { ve: 2000, xp: 800, unitDrops: 4 },
        dropWeights: { t3: 15, t4: 45, t5: 40 }
    },
    {
        id: 'r8_s6', region: 8, name: 'The Void\'s Edge', stageNumber: 6, stageType: 'gameplay',
        description: 'Void-element enemies negate element advantages. Win on raw team quality alone.',
        requiredLevel: 29, lock: null, encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 35, maxCost: 5, count: 6, elementBias: 'force', enemySynergies: true, enemyEvolutions: true },
            { budget: 38, maxCost: 5, count: 7, elementBias: 'force', enemySynergies: true, enemyEvolutions: true },
            { budget: 43, maxCost: 5, count: 7, elementBias: 'force', enemySynergies: true, enemyEvolutions: true },
            { budget: 43, maxCost: 5, count: 7, elementBias: 'force', enemySynergies: true, enemyEvolutions: true }
        ],
        rewards: { ve: 2000, xp: 800, unitDrops: 4 },
        dropWeights: { t3: 15, t4: 45, t5: 40 }
    },
    {
        id: 'r8_s7', region: 8, name: 'Before the End', stageNumber: 7, stageType: 'character',
        description: 'The final camp. Senna attunes everyone one last time. Hard but manageable.',
        requiredLevel: 29, lock: null, encounterMechanic: null, isBoss: false, canRetry: true,
        waves: [
            { budget: 35, maxCost: 5, count: 6, enemySynergies: true, enemyEvolutions: true },
            { budget: 38, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
            { budget: 43, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
            { budget: 43, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true }
        ],
        rewards: { ve: 2000, xp: 800, unitDrops: 4 },
        dropWeights: { t3: 15, t4: 45, t5: 40 }
    },
    {
        id: 'r8_boss', region: 8, name: 'The Eternal Throne', stageNumber: 8, stageType: 'boss',
        description: 'The Void Sovereign. Three phases: Puppeteer, Commander, Unmaker. Everything is tested.',
        requiredLevel: 29, lock: null, encounterMechanic: null, isBoss: true, canRetry: true,
        waves: [], boss: 'void_sovereign',
        rewards: { ve: 4000, xp: 2000, unitDrops: 4 },
        dropWeights: { t3: 15, t4: 45, t5: 40 }
    }
];

// Backward compatibility alias
var STORY_MISSIONS = STAGES;

// ---- Region Definitions (replaces CHAPTERS) ----

var REGIONS = {
    1: {
        name: 'The Frontier',
        subtitle: 'Basic combat, positioning',
        stageIds: ['r1_s1', 'r1_s2', 'r1_s3', 'r1_s4', 'r1_s5', 'r1_s6', 'r1_s7', 'r1_s8', 'r1_boss'],
        reward: { description: '1 free 10-pull', gold: 0, freeMultiRoll: 1 }
    },
    2: {
        name: 'The Barracks Trials',
        subtitle: 'Archetype roles',
        stageIds: ['r2_s1', 'r2_s2', 'r2_s3', 'r2_s4', 'r2_s5', 'r2_s6', 'r2_s7', 'r2_s8', 'r2_boss'],
        reward: { description: '500 VE + 1 random Cost-3 unit', gold: 500, randomUnit: { minCost: 3, maxCost: 3 } }
    },
    3: {
        name: 'The Synergy Trials',
        subtitle: 'Synergy pairing',
        stageIds: ['r3_s1', 'r3_s2', 'r3_s3', 'r3_s4', 'r3_s5', 'r3_s6', 'r3_s7', 'r3_s8', 'r3_boss'],
        reward: { description: '1 essence of your choice', gold: 0, essenceChoice: 1 }
    },
    4: {
        name: 'The Shattered Lands',
        subtitle: 'Adaptive combat',
        stageIds: ['r4_s1', 'r4_s2', 'r4_s3', 'r4_s4', 'r4_s5', 'r4_s6', 'r4_s7', 'r4_s8', 'r4_boss'],
        reward: { description: '750 VE', gold: 750 }
    },
    5: {
        name: 'The Dual Convergence',
        subtitle: 'Element coverage',
        stageIds: ['r5_s1', 'r5_s2', 'r5_s3', 'r5_s4', 'r5_s5', 'r5_s6', 'r5_s7', 'r5_s8', 'r5_s9', 'r5_boss'],
        reward: { description: '1 random Cost-4 unit', gold: 0, randomUnit: { minCost: 4, maxCost: 4 } }
    },
    6: {
        name: 'The Elemental Crucible',
        subtitle: 'Multi-element orchestration',
        stageIds: ['r6_s1', 'r6_s2', 'r6_s3', 'r6_s4', 'r6_s5', 'r6_s6', 'r6_s7', 'r6_s8', 'r6_s9', 'r6_boss'],
        reward: { description: '1,000 VE + 2 essences of your choice', gold: 1000, essenceChoice: 2 }
    },
    7: {
        name: 'The Proving Grounds',
        subtitle: 'Peak tactical challenge',
        stageIds: ['r7_s1', 'r7_s2', 'r7_s3', 'r7_s4', 'r7_s5', 'r7_s6', 'r7_s7', 'r7_s8', 'r7_s9', 'r7_boss'],
        reward: { description: '1 Mythic Material of your choice', gold: 0, mythicMaterialChoice: 1 }
    },
    8: {
        name: 'The Abyss Gate',
        subtitle: 'Endgame mastery',
        stageIds: ['r8_s1', 'r8_s2', 'r8_s3', 'r8_s4', 'r8_s5', 'r8_s6', 'r8_s7', 'r8_boss'],
        reward: { description: '1 random Cost-5 unit + 2,000 VE + 1 Mythic Material of your choice', gold: 2000, randomUnit: { minCost: 5, maxCost: 5 }, mythicMaterialChoice: 1 }
    }
};

// ---- Lock Type Definitions ----

var LOCK_TYPES = {
    archetype: 'Must have N units of specified archetype',
    archetype_pair: 'Must have N of archetype A + M of archetype B',
    archetype_or: 'Must have N of either archetype A or archetype B',
    element_count: 'Must have units from N different elements',
    element_dual: 'Must have exactly 2 different elements on team',
    element_min: 'Must have N different elements minimum',
    no_element_synergy: 'Max 1 unit of any single element',
    archetype_deep: 'Must have N units of one archetype (player choice)'
};

// ---- Lock Checking Functions ----

function getTeamArchetypeCounts(saveData) {
    var counts = {};
    var team = getActiveTeam(saveData);
    if (!team || !team.slots) return counts;
    for (var i = 0; i < team.slots.length; i++) {
        var slot = team.slots[i];
        if (!slot || !slot.key) continue;
        var tmpl = UNIT_TEMPLATES[slot.key] || EVOLVED_TEMPLATES[slot.key];
        if (!tmpl) continue;
        var arch = tmpl.archetype;
        if (arch) {
            counts[arch] = (counts[arch] || 0) + 1;
        }
    }
    return counts;
}

function getTeamElementCounts(saveData) {
    var counts = {};
    var team = getActiveTeam(saveData);
    if (!team || !team.slots) return counts;
    for (var i = 0; i < team.slots.length; i++) {
        var slot = team.slots[i];
        if (!slot || !slot.key) continue;
        var tmpl = UNIT_TEMPLATES[slot.key] || EVOLVED_TEMPLATES[slot.key];
        if (!tmpl) continue;
        var elem = tmpl.element;
        if (elem) {
            counts[elem] = (counts[elem] || 0) + 1;
        }
    }
    return counts;
}

function getUniqueElementCount(saveData) {
    var counts = getTeamElementCounts(saveData);
    return Object.keys(counts).length;
}

function checkLock(saveData, lock) {
    if (!lock) return { passed: true, reason: '' };

    // Compound lock: all constraints must pass
    if (lock.constraints) {
        var reasons = [];
        for (var ci = 0; ci < lock.constraints.length; ci++) {
            var result = checkLock(saveData, lock.constraints[ci]);
            if (!result.passed) reasons.push(result.reason);
        }
        if (reasons.length === 0) return { passed: true, reason: '' };
        return { passed: false, reason: reasons.join(' + ') };
    }

    var archCounts, elemCounts, keys, i, total;

    switch (lock.type) {
        case 'archetype':
            archCounts = getTeamArchetypeCounts(saveData);
            if ((archCounts[lock.value] || 0) >= lock.count) {
                return { passed: true, reason: '' };
            }
            return { passed: false, reason: 'Need ' + lock.count + ' ' + lock.value + ' units (have ' + (archCounts[lock.value] || 0) + ')' };

        case 'archetype_pair':
            archCounts = getTeamArchetypeCounts(saveData);
            var a1 = (archCounts[lock.value[0]] || 0) >= lock.count[0];
            var a2 = (archCounts[lock.value[1]] || 0) >= lock.count[1];
            if (a1 && a2) return { passed: true, reason: '' };
            var reasons = [];
            if (!a1) reasons.push(lock.count[0] + ' ' + lock.value[0] + ' (have ' + (archCounts[lock.value[0]] || 0) + ')');
            if (!a2) reasons.push(lock.count[1] + ' ' + lock.value[1] + ' (have ' + (archCounts[lock.value[1]] || 0) + ')');
            return { passed: false, reason: 'Need ' + reasons.join(' and ') };

        case 'archetype_or':
            archCounts = getTeamArchetypeCounts(saveData);
            total = 0;
            for (i = 0; i < lock.value.length; i++) {
                total += (archCounts[lock.value[i]] || 0);
            }
            if (total >= lock.count) return { passed: true, reason: '' };
            return { passed: false, reason: 'Need ' + lock.count + ' ' + lock.value.join('/') + ' units (have ' + total + ')' };

        case 'element_count':
            elemCounts = getTeamElementCounts(saveData);
            var uniqueCount = Object.keys(elemCounts).length;
            if (uniqueCount >= lock.count) return { passed: true, reason: '' };
            return { passed: false, reason: 'Need ' + lock.count + ' different elements (have ' + uniqueCount + ')' };

        case 'element_dual':
            elemCounts = getTeamElementCounts(saveData);
            var elemKeys = Object.keys(elemCounts);
            if (elemKeys.length === 2) return { passed: true, reason: '' };
            if (elemKeys.length < 2) return { passed: false, reason: 'Need exactly 2 elements (have ' + elemKeys.length + ')' };
            return { passed: false, reason: 'Need exactly 2 elements (have ' + elemKeys.length + ')' };

        case 'element_min':
            elemCounts = getTeamElementCounts(saveData);
            var elemCount = Object.keys(elemCounts).length;
            if (elemCount >= lock.count) return { passed: true, reason: '' };
            return { passed: false, reason: 'Need ' + lock.count + '+ different elements (have ' + elemCount + ')' };

        case 'no_element_synergy':
            elemCounts = getTeamElementCounts(saveData);
            keys = Object.keys(elemCounts);
            for (i = 0; i < keys.length; i++) {
                if (elemCounts[keys[i]] > 1) {
                    return { passed: false, reason: 'Max 1 unit per element (have ' + elemCounts[keys[i]] + ' ' + keys[i] + ')' };
                }
            }
            return { passed: true, reason: '' };

        case 'archetype_deep':
            archCounts = getTeamArchetypeCounts(saveData);
            keys = Object.keys(archCounts);
            for (i = 0; i < keys.length; i++) {
                if (archCounts[keys[i]] >= lock.count) return { passed: true, reason: '' };
            }
            return { passed: false, reason: 'Need ' + lock.count + ' of any single archetype' };

        default:
            return { passed: true, reason: '' };
    }
}

// ---- Encounter Mechanics ----
//
// The dead ENCOUNTER_MECHANICS / setupEncounterMechanics() / tickEncounterMechanics()
// scaffold that used to live here (built against a hypothetical wave-state shape --
// ".alive" / ".col" / "waveState.enemies" -- that never matched the real combat engine)
// was deleted in Prompt 64. It had zero callers anywhere in the codebase (confirmed via
// repo-wide grep before deletion) -- js/combat-encounters.js is the live implementation
// that actually wires the 6 encounterMechanic labels into combatState/dealDamage/dealHealing.
// See combat-encounters.js's file header for the full history.

// ---- Boss Data ----

var BOSS_DATA = {

    // Region 1 boss (replaces veil_guardian)
    veil_warden: {
        name: 'Veil Warden',
        emoji: '👁️',
        element: null,
        size: [2, 2],
        baseHp: 8000,
        hpScaling: 10,
        baseAtk: 40,
        atkScaling: 2.5,
        dr: 0.20,
        attackSpd: 1.2,
        range: 1,
        enrageTime: 75,
        enrageAtkMult: 1.8,
        enrageSpdMult: 1.5,
        phases: [
            {
                hpThreshold: 1.0,
                abilities: [
                    {
                        name: 'Ground Slam',
                        cooldown: 10,
                        telegraphTime: 2.0,
                        targetType: 'highest_hp',
                        aoeRadius: 2,
                        damage: 1.5,
                        statusEffect: null,
                        desc: '2-cell AoE on highest-HP unit, telegraphed'
                    },
                    {
                        name: 'Roar',
                        cooldown: 9999,
                        telegraphTime: 0,
                        targetType: 'self_buff',
                        damage: 0,
                        statusEffect: { type: 'atkBuff', duration: 9999, value: 0.20 },
                        triggerAtHpPct: 0.50,
                        desc: '+20% ATK self-buff at 50% HP (once)'
                    }
                ]
            }
        ],
        minionSpawns: [],
        loot: { gold: 500, xp: 500, firstClearGold: 500 }
    },

    // Challenge mode bosses (kept from original — no region references them)
    infernal_wyvern: {
        name: 'Infernal Wyvern',
        emoji: '🐉🔥',
        element: 'fire',
        size: [2, 2],
        baseHp: 15000,
        hpScaling: 3,
        baseAtk: 0,
        atkScaling: 2.0,
        dr: 0.20,
        attackSpd: 1.2,
        range: 2,
        enrageTime: 120,
        enrageAtkMult: 2.0,
        enrageSpdMult: 1.5,
        phases: [
            {
                hpThreshold: 1.0,
                abilities: [
                    { name: 'Flame Breath', cooldown: 8, telegraphTime: 1.5, targetType: 'cone', coneColumns: [2, 3, 4, 5], coneRows: 2, damage: 0.8, statusEffect: { type: 'burn', duration: 3, value: 20 }, desc: 'Fire cone covering columns 2-5' },
                    { name: 'Tail Swipe', cooldown: 12, telegraphTime: 1.5, targetType: 'melee_range', aoeRadius: 1, damage: 1.0, knockback: 1, statusEffect: null, desc: 'Hits all melee units, knockback 1 cell' },
                    { name: 'Ember Rain', cooldown: 25, telegraphTime: 2.0, targetType: 'random_cells', cellCount: 3, damage: 0.6, statusEffect: { type: 'burn', duration: 5, value: 15 }, desc: '3 random cells marked then explode' }
                ]
            },
            {
                hpThreshold: 0.5,
                abilities: [
                    { name: 'Flame Breath', cooldown: 6, telegraphTime: 1.5, targetType: 'cone', coneColumns: [1, 2, 3, 4, 5, 6], coneRows: 2, damage: 0.8, statusEffect: { type: 'burn', duration: 3, value: 25 }, desc: 'Wider fire cone, columns 1-6' },
                    { name: 'Tail Swipe', cooldown: 12, telegraphTime: 1.5, targetType: 'melee_range', aoeRadius: 1, damage: 1.0, knockback: 1, statusEffect: null, desc: 'Same tail swipe' },
                    { name: 'Inferno', cooldown: 15, telegraphTime: 1.0, targetType: 'all_players', damage: 0.6, statusEffect: { type: 'healReduction', duration: 5, value: 0.5 }, desc: 'All units take fire damage + grievous wounds' }
                ]
            }
        ],
        minionSpawns: [
            { phase: 1, cooldown: 25, maxAlive: 4, units: [{ key: 'flame_warrior', stars: 2, count: 2, name: 'Fire Drake' }] }
        ],
        loot: { gold: 500, xp: 800, firstClearGold: 500 }
    },

    tidal_leviathan: {
        name: 'Tidal Leviathan',
        emoji: '🐙💧',
        element: 'water',
        size: [2, 2],
        baseHp: 18000,
        hpScaling: 3,
        baseAtk: 0,
        atkScaling: 1.8,
        dr: 0.25,
        attackSpd: 1.5,
        range: 2,
        enrageTime: 120,
        enrageAtkMult: 2.0,
        enrageSpdMult: 1.5,
        regenPct: 0.01,
        phases: [
            {
                hpThreshold: 1.0,
                abilities: [
                    { name: 'Tidal Wave', cooldown: 10, telegraphTime: 2.0, targetType: 'rows', targetRows: [4, 5], damage: 0.7, statusEffect: { type: 'slow', duration: 2, value: 0.3 }, desc: 'Wave hits rows 4-5' },
                    { name: 'Whirlpool', cooldown: 15, telegraphTime: 2.0, targetType: 'aoe_pull', aoeSize: 2, damage: 0.9, pullStrength: 1, desc: '2x2 area, pulls units toward center' }
                ]
            },
            {
                hpThreshold: 0.5,
                abilities: [
                    { name: 'Tsunami', cooldown: 8, telegraphTime: 2.0, targetType: 'rows', targetRows: [4, 5, 6], damage: 0.8, statusEffect: { type: 'slow', duration: 3, value: 0.4 }, desc: 'Wider wave hits rows 4-6' },
                    { name: 'Whirlpool', cooldown: 15, telegraphTime: 2.0, targetType: 'aoe_pull', aoeSize: 3, damage: 0.9, pullStrength: 1, desc: 'Larger whirlpool 3x3' }
                ]
            }
        ],
        minionSpawns: [
            { phase: 1, cooldown: 20, maxAlive: 4, units: [{ key: 'tide_hunter', stars: 2, count: 2, name: 'Kraken Arm' }] }
        ],
        loot: { gold: 500, xp: 800, firstClearGold: 500 }
    },

    stone_colossus: {
        name: 'Stone Colossus',
        emoji: '🗿🌿',
        element: 'earth',
        size: [2, 2],
        baseHp: 22000,
        hpScaling: 3,
        baseAtk: 0,
        atkScaling: 1.5,
        dr: 0.35,
        attackSpd: 2.0,
        range: 1,
        enrageTime: 120,
        enrageAtkMult: 2.0,
        enrageSpdMult: 1.5,
        phases: [
            {
                hpThreshold: 1.0,
                abilities: [
                    { name: 'Ground Pound', cooldown: 8, telegraphTime: 1.5, targetType: 'aoe_around_self', aoeRadius: 2, damage: 1.0, statusEffect: { type: 'root', duration: 1.5, value: 0 }, desc: 'AoE around self, roots' },
                    { name: 'Stone Skin', cooldown: 20, telegraphTime: 0, targetType: 'self_shield', shieldPct: 0.10, desc: 'Gains shield = 10% maxHP' },
                    { name: 'Boulder Toss', cooldown: 12, telegraphTime: 2.0, targetType: 'highest_atk', aoeRadius: 0, damage: 1.2, knockback: 2, desc: 'Hits highest ATK unit, knockback 2' }
                ]
            },
            {
                hpThreshold: 0.5,
                abilities: [
                    { name: 'Ground Pound', cooldown: 8, telegraphTime: 1.5, targetType: 'aoe_around_self', aoeRadius: 2, damage: 1.0, statusEffect: { type: 'root', duration: 1.5, value: 0 }, desc: 'Same + slow' },
                    { name: 'Stone Skin', cooldown: 15, telegraphTime: 0, targetType: 'self_shield', shieldPct: 0.10, desc: 'Faster shield regen' },
                    { name: 'Boulder Toss', cooldown: 12, telegraphTime: 2.0, targetType: 'highest_atk', aoeRadius: 0, damage: 1.2, knockback: 2, desc: 'Same' },
                    { name: 'Tectonic Shift', cooldown: 25, telegraphTime: 1.0, targetType: 'swap_positions', swapCount: 3, desc: 'Swaps 3 random player units' }
                ]
            }
        ],
        minionSpawns: [
            { phase: 1, cooldown: 30, maxAlive: 4, units: [{ key: 'stone_guard', stars: 2, count: 2, name: 'Stone Sentinel' }] }
        ],
        loot: { gold: 500, xp: 800, firstClearGold: 500 }
    },

    storm_phoenix: {
        name: 'Storm Phoenix',
        emoji: '🦅💨',
        element: 'wind',
        size: [2, 2],
        baseHp: 14000,
        hpScaling: 3,
        baseAtk: 0,
        atkScaling: 2.2,
        dr: 0.10,
        dodgeChance: 0.25,
        attackSpd: 0.8,
        range: 3,
        enrageTime: 120,
        enrageAtkMult: 2.0,
        enrageSpdMult: 1.5,
        phases: [
            {
                hpThreshold: 1.0,
                abilities: [
                    { name: 'Gale Strike', cooldown: 5, telegraphTime: 0.5, targetType: 'highest_atk', damage: 1.3, desc: 'Fast single-target' },
                    { name: 'Wind Wall', cooldown: 15, telegraphTime: 1.0, targetType: 'column_wall', wallDuration: 5, desc: 'Blocks ranged attacks across column' },
                    { name: 'Feather Storm', cooldown: 20, telegraphTime: 1.5, targetType: 'random_cells', cellCount: 5, damage: 0.5, desc: '5 random cells take damage' }
                ]
            },
            {
                hpThreshold: 0.5,
                rebirth: true,
                abilities: [
                    { name: 'Gale Strike', cooldown: 5, telegraphTime: 0.5, targetType: 'highest_atk_x2', damage: 1.3, desc: 'Hits 2 targets' },
                    { name: 'Cyclone', cooldown: 15, telegraphTime: 1.5, targetType: 'aoe_pull', aoeSize: 3, damage: 0.3, pullStrength: 1, desc: '3x3 pull zone' },
                    { name: 'Feather Storm', cooldown: 20, telegraphTime: 1.5, targetType: 'random_cells', cellCount: 5, damage: 0.5, desc: 'Same' }
                ]
            }
        ],
        minionSpawns: [
            { phase: 1, cooldown: 20, maxAlive: 3, units: [{ key: 'zephyr_scout', stars: 1, count: 3, name: 'Wind Wisp' }] }
        ],
        loot: { gold: 500, xp: 800, firstClearGold: 500 }
    },

    // Region 2 boss
    archon: {
        name: 'The Archon',
        emoji: '⚔️👑',
        element: null,
        size: [2, 2],
        baseHp: 8000,
        hpScaling: 6,
        baseAtk: 0,
        atkScaling: 1.8,
        dr: 0.15,
        attackSpd: 1.2,
        range: 2,
        enrageTime: 100,
        enrageAtkMult: 1.8,
        enrageSpdMult: 1.4,
        phases: [
            {
                hpThreshold: 1.0,
                abilities: [
                    {
                        name: 'Guardian Stance',
                        cooldown: 45,
                        telegraphTime: 1.0,
                        targetType: 'self_buff',
                        damage: 0,
                        stanceDuration: 15,
                        stance: 'guardian',
                        drBuff: 0.40,
                        shieldPct: 0.15,
                        desc: '+40% DR + 15% HP shield for 15s'
                    },
                    {
                        name: 'Predator Stance',
                        cooldown: 45,
                        telegraphTime: 1.0,
                        targetType: 'dash_lowest_hp',
                        damage: 1.5,
                        stanceDuration: 15,
                        stance: 'predator',
                        atkBuff: 0.50,
                        desc: 'Dash to lowest-HP, +50% ATK for 15s'
                    },
                    {
                        name: 'Sorcerer Stance',
                        cooldown: 45,
                        telegraphTime: 1.5,
                        targetType: 'cluster_aoe',
                        aoeRadius: 3,
                        damage: 1.2,
                        stanceDuration: 15,
                        stance: 'sorcerer',
                        desc: '3x3 AoE on densest cluster for 15s'
                    }
                ],
                stanceRotation: true,
                stanceInterval: 15
            }
        ],
        minionSpawns: [],
        loot: { gold: 700, xp: 600, firstClearGold: 700 }
    },

    // Region 3 boss
    twin_heralds: {
        name: 'The Twin Heralds',
        emoji: '⚔️⚔️',
        element: null,
        size: [1, 2],
        twinBoss: true,
        baseHp: 6000,
        hpScaling: 5,
        baseAtk: 0,
        atkScaling: 1.6,
        dr: 0.10,
        attackSpd: 1.0,
        range: 1,
        enrageTime: 110,
        enrageAtkMult: 1.8,
        enrageSpdMult: 1.5,
        proximityBuff: { range: 2, atkBuff: 0.30 },
        phases: [
            {
                hpThreshold: 1.0,
                abilities: [
                    { name: 'Charge', cooldown: 12, telegraphTime: 0.5, targetType: 'dash_random', damage: 1.0, statusEffect: { type: 'stun', duration: 1.5, value: 0 }, desc: 'Dash to player unit + 1.5s stun' },
                    { name: 'Cleave', cooldown: 8, telegraphTime: 1.0, targetType: 'frontal_cone', aoeRadius: 2, damage: 0.8, desc: 'Frontal cone 2-cell arc' }
                ]
            },
            {
                hpThreshold: 0.0,
                isEnrage: true,
                enrageOnTwinDeath: true,
                abilities: [
                    { name: 'Charge', cooldown: 6, telegraphTime: 0.5, targetType: 'dash_random', damage: 1.5, statusEffect: { type: 'stun', duration: 1.5, value: 0 }, desc: 'Faster charge, more damage' },
                    { name: 'Cleave', cooldown: 4, telegraphTime: 1.0, targetType: 'frontal_cone', aoeRadius: 2, damage: 1.2, desc: 'Faster cleave, more damage' }
                ],
                survivorBuffs: { atkMult: 2.0, cooldownMult: 0.5, speedMult: 1.2 }
            }
        ],
        secondUnit: {
            name: 'Magic Herald',
            emoji: '🔮⚔️',
            element: null,
            baseHp: 5000,
            baseAtk: 0,
            atkScaling: 1.4,
            dr: 0.05,
            attackSpd: 1.2,
            range: 3,
            abilities: [
                { name: 'Chain Lightning', cooldown: 10, telegraphTime: 0.5, targetType: 'chain_bounce', bounces: 3, bounceDmgReduction: 0.20, bounceRange: 2, damage: 0.7, desc: 'Bounces between nearby units, -20% per bounce' },
                { name: 'Barrier', cooldown: 15, telegraphTime: 0, targetType: 'shield_ally', shieldPct: 0.10, desc: 'Shields other Herald for 10% max HP' }
            ]
        },
        minionSpawns: [],
        loot: { gold: 1100, xp: 700, firstClearGold: 1100 }
    },

    // Region 4 boss
    shattered_colossus: {
        name: 'The Shattered Colossus',
        emoji: '🗿💥',
        element: 'earth',
        size: [2, 2],
        baseHp: 20000,
        hpScaling: 4,
        baseAtk: 0,
        atkScaling: 1.8,
        dr: 0.25,
        attackSpd: 1.5,
        range: 1,
        enrageTime: 120,
        enrageAtkMult: 2.0,
        enrageSpdMult: 1.5,
        phases: [
            {
                hpThreshold: 1.0,
                phaseMechanic: 'vip_target',
                abilities: [
                    { name: 'Slam', cooldown: 8, telegraphTime: 2.0, targetType: 'highest_hp', aoeRadius: 2, damage: 1.0, desc: 'Basic 2-cell AoE, telegraphed' }
                ],
                healingCrystal: { hp: 3000, regenPct: 0.02, doubleAt: 30 }
            },
            {
                hpThreshold: 0.65,
                phaseMechanic: 'countdown',
                abilities: [
                    { name: 'Slam', cooldown: 8, telegraphTime: 2.0, targetType: 'highest_hp', aoeRadius: 2, damage: 1.0, desc: 'Same slam' }
                ],
                cataclysm: { chargeTime: 30, armHp: 5000, wipeDamage: 0.80 },
                shardSpawns: { interval: 10, count: 2, unitKey: 'stone_guard', stars: 1 }
            },
            {
                hpThreshold: 0.30,
                phaseMechanic: 'split_formation',
                abilities: [
                    { name: 'Dual Smash', cooldown: 6, telegraphTime: 1.5, targetType: 'both_sides', damage: 1.2, desc: 'Attacks both sides simultaneously' }
                ],
                riftPulse: { interval: 5, damage: 200 }
            }
        ],
        minionSpawns: [],
        loot: { gold: 1500, xp: 800, firstClearGold: 1500 }
    },

    // Region 5 boss
    elemental_chimera: {
        name: 'The Elemental Chimera',
        emoji: '🐲🌈',
        element: 'fire',
        size: [2, 2],
        baseHp: 22000,
        hpScaling: 4,
        baseAtk: 0,
        atkScaling: 2.0,
        dr: 0.15,
        attackSpd: 1.2,
        range: 2,
        enrageTime: 120,
        enrageAtkMult: 2.0,
        enrageSpdMult: 1.5,
        elementRotation: ['fire', 'water', 'earth', 'wind', 'lightning', 'force'],
        phases: [
            {
                hpThreshold: 1.0,
                abilities: [
                    { name: 'Elemental Shift', cooldown: 20, telegraphTime: 3.0, targetType: 'self_element_change', desc: 'Changes element (3s telegraph)' },
                    { name: 'Element Surge', cooldown: 8, telegraphTime: 1.0, targetType: 'aoe_around_self', aoeRadius: 2, damage: 1.0, usesCurrentElement: true, desc: 'AoE of current element, 2-cell radius' }
                ],
                passives: [
                    { name: 'Absorption', effect: 'heals_from_matching_element', desc: 'Heals from damage matching current element' }
                ]
            }
        ],
        minionSpawns: [],
        loot: { gold: 2000, xp: 900, firstClearGold: 2000 }
    },

    // Region 6 boss
    prismatic_sentinel: {
        name: 'The Prismatic Sentinel',
        emoji: '💎🌈',
        element: null,
        size: [2, 2],
        baseHp: 28000,
        hpScaling: 4,
        baseAtk: 0,
        atkScaling: 2.2,
        dr: 0.20,
        attackSpd: 1.2,
        range: 2,
        enrageTime: 130,
        enrageAtkMult: 2.0,
        enrageSpdMult: 1.5,
        phases: [
            {
                hpThreshold: 1.0,
                abilities: [
                    { name: 'Prismatic Shield', cooldown: 15, telegraphTime: 1.0, targetType: 'self_element_immunity', desc: 'Immune to one element, +50% vulnerable to another. Rotates.' },
                    { name: 'Elemental Storm', cooldown: 10, telegraphTime: 1.5, targetType: 'all_players', damage: 0.6, usesImmuneElement: true, desc: 'AoE of immune element' },
                    { name: 'Resonance Burst', cooldown: 20, telegraphTime: 1.0, targetType: 'matching_element_units', damage: 0.8, desc: 'Bonus damage to units matching immune element' }
                ],
                elementRotation: ['fire', 'water', 'earth', 'wind', 'lightning', 'force']
            }
        ],
        minionSpawns: [],
        loot: { gold: 2600, xp: 1000, firstClearGold: 2600 }
    },

    // Region 7 boss
    arbiter_of_trials: {
        name: 'The Arbiter of Trials',
        emoji: '⚖️🔥',
        element: null,
        size: [2, 2],
        baseHp: 32000,
        hpScaling: 4,
        baseAtk: 0,
        atkScaling: 2.3,
        dr: 0.20,
        attackSpd: 1.0,
        range: 2,
        enrageTime: 140,
        enrageAtkMult: 2.0,
        enrageSpdMult: 1.8,
        phases: [
            {
                hpThreshold: 1.0,
                phaseMechanic: 'synergy_suppression',
                abilities: [
                    { name: 'Judges Gavel', cooldown: 8, telegraphTime: 1.5, targetType: 'highest_atk', damage: 2.0, desc: 'Massive single-target on highest-ATK' }
                ],
                passives: [
                    { name: 'Suppression Field', effect: 'disable_element_synergies', desc: 'All element synergy bonuses disabled' }
                ]
            },
            {
                hpThreshold: 0.65,
                phaseMechanic: 'split_formation',
                abilities: [
                    { name: 'Judges Gavel', cooldown: 8, telegraphTime: 1.5, targetType: 'highest_atk', damage: 2.0, desc: 'Same gavel' },
                    { name: 'Summon Adjudicator', cooldown: 9999, telegraphTime: 0, targetType: 'spawn_vip_healer', healPct: 0.015, desc: 'VIP healer add, heals boss 1.5% HP/s' }
                ],
                reEnableSynergies: true
            },
            {
                hpThreshold: 0.30,
                phaseMechanic: 'countdown',
                abilities: [
                    { name: 'Judges Gavel', cooldown: 6, telegraphTime: 1.0, targetType: 'highest_atk', damage: 2.5, desc: 'Faster, harder gavel' }
                ],
                finalVerdict: { chargeTime: 25, interruptThreshold: 0 },
                passives: [
                    { name: 'Accelerating Judgment', effect: 'stacking_attack_speed', stackInterval: 5, stackValue: 0.10, desc: '+10% attack speed every 5s' }
                ]
            }
        ],
        minionSpawns: [],
        loot: { gold: 3200, xp: 1100, firstClearGold: 3200 }
    },

    // Region 8 boss (updated from original)
    void_sovereign: {
        name: 'The Void Sovereign',
        emoji: '👿✨',
        element: null,
        size: [2, 2],
        baseHp: 40000,
        hpScaling: 4,
        baseAtk: 0,
        atkScaling: 2.5,
        dr: 0.20,
        attackSpd: 1.0,
        range: 3,
        enrageTime: 150,
        enrageAtkMult: 2.0,
        enrageSpdMult: 2.0,
        phases: [
            {
                hpThreshold: 1.0,
                name: 'Puppeteer',
                abilities: [
                    { name: 'Void Tendrils', cooldown: 8, telegraphTime: 1.0, targetType: 'random_units', targetCount: 3, damage: 0.5, statusEffect: { type: 'root', duration: 1.5, value: 0 }, desc: '3 random units rooted + damaged' },
                    { name: 'Void Barrier', cooldown: 20, telegraphTime: 0, targetType: 'self_shield', shieldPct: 0.15, desc: 'Regenerating shield 15% max HP' }
                ],
                passives: [
                    { name: 'Elemental Mimicry', effect: 'copy_highest_damage_element', interval: 5, desc: 'Copies element of highest-damage player unit' }
                ]
            },
            {
                hpThreshold: 0.70,
                name: 'Commander',
                transitionInvuln: 3,
                abilities: [
                    { name: 'Summon Void Champions', cooldown: 9999, telegraphTime: 0, targetType: 'copy_player_units', copyCount: 4, desc: 'Spawns 4 void copies of random player units' },
                    { name: 'Void Beam', cooldown: 10, telegraphTime: 2.0, targetType: 'row_most_units', damage: 1.0, desc: 'Line attack across row with most player units' },
                    { name: 'Dimensional Rift', cooldown: 20, telegraphTime: 1.0, targetType: 'swap_units', swapCount: 2, desc: 'Swaps 2 player + 2 champion positions' }
                ]
            },
            {
                hpThreshold: 0.30,
                name: 'Unmaker',
                transitionInvuln: 3,
                killVoidChampions: true,
                abilities: [
                    { name: 'Annihilation', cooldown: 12, telegraphTime: 1.5, targetType: 'all_players', damage: 0.7, desc: 'ALL player units take 70% ATK damage' },
                    { name: 'Void Collapse', cooldown: 20, telegraphTime: 1.0, targetType: 'remove_grid_cells', cellCount: 2, desc: 'Removes 2 grid cells, pushes units' }
                ],
                passives: [
                    { name: 'Healing Suppression', effect: 'reduce_healing', value: 0.15, desc: '-15% healing to all player units' },
                    { name: 'Final Form', effect: 'low_hp_enrage', hpThreshold: 0.10, atkMult: 2.0, spdMult: 2.0, desc: 'Below 10% HP: doubled ATK and speed' }
                ]
            }
        ],
        minionSpawns: [],
        loot: { gold: 4000, xp: 1500, firstClearGold: 4000 }
    }
};

// ---- Story/Grind/Boss Enemy Generation ----

function getRandomUnitByElementAndTier(element, tierRange) {
    var candidates = SHOP_POOL_KEYS.filter(function(key) {
        var unit = UNIT_TEMPLATES[key];
        if (!unit) return false;
        if (element && unit.element !== element) return false;
        return tierRange.indexOf(unit.cost) !== -1;
    });

    if (candidates.length === 0) {
        candidates = SHOP_POOL_KEYS.filter(function(key) {
            return UNIT_TEMPLATES[key] && tierRange.indexOf(UNIT_TEMPLATES[key].cost) !== -1;
        });
    }
    if (candidates.length === 0) return SHOP_POOL_KEYS[0];
    return candidates[Math.floor(Math.random() * candidates.length)];
}

function generateStoryEnemyTeam(missionKey) {
    var mission = null;
    for (var i = 0; i < STAGES.length; i++) {
        if (STAGES[i].id === missionKey) { mission = STAGES[i]; break; }
    }
    if (!mission) return [];

    var allElements = Object.keys(ELEMENTS);
    var difficulty = mission.requiredLevel || 1;
    var tierRange = [];
    if (difficulty <= 3) tierRange = [1, 2];
    else if (difficulty <= 8) tierRange = [2, 3];
    else if (difficulty <= 14) tierRange = [3, 4];
    else tierRange = [4, 5];

    var enemyCount = 2 + Math.floor(difficulty / 3);
    if (enemyCount > 7) enemyCount = 7;

    var elementFocus = null;
    if (mission.waves && mission.waves.length > 0 && mission.waves[0].elementBias) {
        elementFocus = mission.waves[0].elementBias;
    }
    if (!elementFocus) {
        elementFocus = allElements[Math.floor(Math.random() * allElements.length)];
    }

    var team = [];
    var focusCount = Math.ceil(enemyCount * 0.6);
    var fillerCount = enemyCount - focusCount;

    for (var fi = 0; fi < focusCount; fi++) {
        var unitKey = getRandomUnitByElementAndTier(elementFocus, tierRange);
        var stars = Math.max(1, Math.min(3, Math.floor(difficulty / 4)));
        team.push({ unitKey: unitKey, stars: stars });
    }

    for (var fj = 0; fj < fillerCount; fj++) {
        var randomElement = allElements[Math.floor(Math.random() * allElements.length)];
        var unitKey2 = getRandomUnitByElementAndTier(randomElement, tierRange);
        var stars2 = Math.max(1, Math.min(3, Math.floor(difficulty / 4)));
        team.push({ unitKey: unitKey2, stars: stars2 });
    }

    return team;
}

function getTierRangeForGrindLevel(level) {
    if (level <= 5) return [1, 2];
    if (level <= 10) return [2, 3];
    if (level <= 20) return [3, 4];
    return [4, 5];
}

function generateGrindEnemyTeam(missionLevel) {
    var allElements = Object.keys(ELEMENTS);
    var focusElement = allElements[Math.floor(Math.random() * allElements.length)];
    var tierRange = getTierRangeForGrindLevel(missionLevel);
    var enemyCount = Math.min(7, 2 + Math.floor(missionLevel / 5));

    var team = [];
    var focusCount = Math.ceil(enemyCount * 0.5);
    var fillerCount = enemyCount - focusCount;

    for (var i = 0; i < focusCount; i++) {
        var unitKey = getRandomUnitByElementAndTier(focusElement, tierRange);
        var stars = Math.max(1, Math.min(3, Math.floor(missionLevel / 3)));
        team.push({ unitKey: unitKey, stars: stars });
    }

    for (var j = 0; j < fillerCount; j++) {
        var randomElement = allElements[Math.floor(Math.random() * allElements.length)];
        var unitKey2 = getRandomUnitByElementAndTier(randomElement, tierRange);
        var stars2 = Math.max(1, Math.min(3, Math.floor(missionLevel / 3)));
        team.push({ unitKey: unitKey2, stars: stars2 });
    }

    return team;
}

function generateBossEnemyTeam(bossElement) {
    var t5Units = SHOP_POOL_KEYS.filter(function(k) {
        return UNIT_TEMPLATES[k] && UNIT_TEMPLATES[k].cost === 5 && UNIT_TEMPLATES[k].element === bossElement;
    });
    if (t5Units.length === 0) {
        t5Units = SHOP_POOL_KEYS.filter(function(k) {
            return UNIT_TEMPLATES[k] && UNIT_TEMPLATES[k].cost === 5;
        });
    }
    var bossKey = t5Units[Math.floor(Math.random() * t5Units.length)];
    var team = [{ unitKey: bossKey, stars: 3 }];

    for (var i = 0; i < 2; i++) {
        var unitKey = getRandomUnitByElementAndTier(bossElement, [3, 4]);
        team.push({ unitKey: unitKey, stars: 2 });
    }

    return team;
}

function getEnemySynergies(enemyTeam) {
    var elementCounts = {};
    var archetypeCounts = {};

    for (var i = 0; i < enemyTeam.length; i++) {
        var enemySlot = enemyTeam[i];
        var unit = UNIT_TEMPLATES[enemySlot.unitKey];
        if (!unit) continue;
        elementCounts[unit.element] = (elementCounts[unit.element] || 0) + 1;
        archetypeCounts[unit.archetype] = (archetypeCounts[unit.archetype] || 0) + 1;
    }

    var activeSynergies = [];

    var elemKeys = Object.keys(elementCounts);
    for (var ei = 0; ei < elemKeys.length; ei++) {
        var element = elemKeys[ei];
        var count = elementCounts[element];
        if (count >= 2) {
            var elemSyn = ELEMENT_SYNERGIES[element];
            var tier = 0;
            if (elemSyn) {
                for (var t = 0; t < elemSyn.thresholds.length; t++) {
                    if (count >= elemSyn.thresholds[t]) tier = t + 1;
                }
            }
            activeSynergies.push({ type: 'element', name: element, count: count, tier: tier });
        }
    }

    var archKeys = Object.keys(archetypeCounts);
    for (var ai = 0; ai < archKeys.length; ai++) {
        var archetype = archKeys[ai];
        var aCount = archetypeCounts[archetype];
        if (aCount >= 2) {
            var archData = ARCHETYPES[archetype];
            var aTier = 0;
            if (archData) {
                for (var at = 0; at < archData.thresholds.length; at++) {
                    if (aCount >= archData.thresholds[at]) aTier = at + 1;
                }
            }
            activeSynergies.push({ type: 'archetype', name: archetype, count: aCount, tier: aTier });
        }
    }

    return activeSynergies;
}

function getStoryReward(difficulty) {
    var gold = 100 + (difficulty * 25);
    var xp = 50 + (difficulty * 15);
    return { gold: gold, xp: xp };
}

function checkMilestoneReward(missionNumber) {
    if (missionNumber % 5 === 0) {
        var t3t4Units = SHOP_POOL_KEYS.filter(function(k) {
            var cost = UNIT_TEMPLATES[k] ? UNIT_TEMPLATES[k].cost : 0;
            return cost === 3 || cost === 4;
        });
        if (t3t4Units.length === 0) return null;
        return t3t4Units[Math.floor(Math.random() * t3t4Units.length)];
    }
    return null;
}

// ---- Grind Mission Generator ----

function generateGrindMission(playerLevel) {
    var difficulty = Math.max(1, playerLevel);
    var waveCount = Math.min(5, 1 + Math.floor(difficulty / 4));
    var maxCost = Math.min(5, 1 + Math.floor(difficulty / 3));

    var elements = Object.keys(ELEMENTS);
    var grindElement = elements[Math.floor(Math.random() * elements.length)];

    var waves = [];
    for (var w = 0; w < waveCount; w++) {
        var budget = Math.floor(3 + difficulty * 1.5 + w * 2);
        var count = Math.min(7, 2 + Math.floor(difficulty / 3) + w);
        var waveObj = { budget: budget, maxCost: maxCost, count: count };

        if (playerLevel >= 10 && Math.random() < 0.5) {
            waveObj.elementBias = grindElement;
        }

        if (playerLevel >= 14 && w >= waveCount - 2) {
            waveObj.enemySynergies = true;
        }

        if (playerLevel >= 18 && w === waveCount - 1) {
            waveObj.enemyEvolutions = true;
        }

        waves.push(waveObj);
    }

    var baseGold = Math.floor(20 + difficulty * 8);
    var baseXP = Math.floor(30 + difficulty * 12);

    var name = playerLevel >= 10
        ? ELEMENTS[grindElement].emoji + ' Training Grounds Lv.' + difficulty
        : 'Training Grounds Lv.' + difficulty;

    return {
        id: 'grind_' + playerLevel + '_' + Date.now(),
        name: name,
        description: 'Repeatable combat encounter for gold and experience.',
        requiredLevel: 1,
        waves: waves,
        rewards: { gold: baseGold, xp: baseXP },
        isGrind: true
    };
}

// ---- Named Enemy Captains ----

var ENEMY_CAPTAINS = {
    pyra: {
        name: 'Pyra, Ember General',
        emoji: '🔥⚔️',
        element: 'fire',
        type: 'warrior',
        hp: 2500,
        attack: 120,
        attackSpd: 0.8,
        range: 1,
        moveSpd: 1.8,
        dr: 0.15,
        fixedRow: 1,
        fixedCol: 3,
        specialAbility: {
            name: 'Rallying Cry',
            effect: 'rally',
            cooldown: 15,
            desc: '+20% ATK to all fire allies for 10s',
            atkBuff: 0.20,
            duration: 10,
            targetElement: 'fire'
        },
        bonusReward: { goldMult: 1.25, guaranteedRare: true }
    },
    nereus: {
        name: 'Nereus, Tidal Oracle',
        emoji: '🌊🔮',
        element: 'water',
        type: 'healer',
        hp: 2000,
        attack: 60,
        attackSpd: 1.1,
        range: 2,
        moveSpd: 1.5,
        dr: 0.10,
        fixedRow: 0,
        fixedCol: 3,
        specialAbility: {
            name: 'Tidal Blessing',
            effect: 'massHeal',
            cooldown: 18,
            desc: 'Heal all allies for 20% max HP',
            healPct: 0.20
        },
        bonusReward: { goldMult: 1.25, guaranteedRare: true }
    },
    gorath: {
        name: 'Gorath, Stone King',
        emoji: '🪨👑',
        element: 'earth',
        type: 'tank',
        hp: 3500,
        attack: 80,
        attackSpd: 1.0,
        range: 1,
        moveSpd: 1.3,
        dr: 0.30,
        fixedRow: 2,
        fixedCol: 3,
        specialAbility: {
            name: 'Earthquake',
            effect: 'aoeStun',
            cooldown: 20,
            desc: 'Stun all player units for 1.5s',
            stunDuration: 1.5
        },
        bonusReward: { goldMult: 1.25, guaranteedRare: true }
    },
    sylph: {
        name: 'Sylph, Storm Blade',
        emoji: '🌪️⚡',
        element: 'wind',
        type: 'assassin',
        hp: 1800,
        attack: 150,
        attackSpd: 0.5,
        range: 1,
        moveSpd: 3.5,
        dr: 0.05,
        fixedRow: 1,
        fixedCol: 5,
        specialAbility: {
            name: 'Wind Walk',
            effect: 'teleportStrike',
            cooldown: 12,
            desc: 'Teleport behind weakest enemy, deal 200% ATK',
            damageMultiplier: 2.0
        },
        bonusReward: { goldMult: 1.25, guaranteedRare: true }
    },
    arbiter: {
        name: 'The Arbiter',
        emoji: '⚖️✨',
        element: 'force',
        type: 'mage',
        hp: 2800,
        attack: 100,
        attackSpd: 0.9,
        range: 3,
        moveSpd: 1.5,
        dr: 0.20,
        fixedRow: 0,
        fixedCol: 3,
        specialAbility: {
            name: 'Elemental Shift',
            effect: 'elementShift',
            cooldown: 10,
            desc: 'Change element every 10s, immune to that element',
            elements: ['fire', 'water', 'earth', 'wind']
        },
        bonusReward: { goldMult: 1.25, guaranteedRare: true }
    },
    voidborn_champion: {
        name: 'Voidborn Champion',
        emoji: '🕳️⚔️',
        element: 'force',
        type: 'warrior',
        hp: 3000,
        attack: 130,
        attackSpd: 0.8,
        range: 1,
        moveSpd: 2.0,
        dr: 0.20,
        fixedRow: 1,
        fixedCol: 3,
        specialAbility: {
            name: 'Void Drain',
            effect: 'manaDrain',
            cooldown: 8,
            desc: 'Steal 20% of target\'s current mana',
            manaDrainPct: 0.20
        },
        bonusReward: { goldMult: 1.25, guaranteedRare: true }
    }
};

function createCaptainUnit(captainKey) {
    var captainDef = ENEMY_CAPTAINS[captainKey];
    if (!captainDef) return null;

    var unit = {
        key: 'captain_' + captainKey,
        name: captainDef.name,
        emoji: captainDef.emoji,
        element: captainDef.element,
        type: captainDef.type,
        hp: captainDef.hp,
        maxHp: captainDef.hp,
        attack: captainDef.attack,
        attackSpd: captainDef.attackSpd,
        range: captainDef.range,
        moveSpd: captainDef.moveSpd,
        damageReduction: captainDef.dr || 0,
        isEnemy: true,
        isCaptain: true,
        captainKey: captainKey,
        specialAbility: captainDef.specialAbility,
        specialAbilityCooldown: 0,
        fixedRow: captainDef.fixedRow,
        fixedCol: captainDef.fixedCol,
        stars: 1,
        alive: true,
        mana: 0,
        maxMana: 100
    };

    return unit;
}

function getCaptainBonusReward(captainKey) {
    var captainDef = ENEMY_CAPTAINS[captainKey];
    if (!captainDef) return null;
    return captainDef.bonusReward;
}

// ---- Wave Enemy Generation ----

function generateMissionWave(waveConfig) {
    var enemies = [];
    var remaining = waveConfig.budget;
    var targetCount = waveConfig.count;
    var maxCost = waveConfig.maxCost;
    if (waveConfig.captain) {
        var captain = createCaptainUnit(waveConfig.captain);
        if (captain) { enemies.push(captain); remaining -= 3; targetCount--; }
    }
    var pool = [];
    var biasedPool = [];
    for (var i = 0; i < SHOP_POOL_KEYS.length; i++) {
        var key = SHOP_POOL_KEYS[i];
        var tmpl = UNIT_TEMPLATES[key];
        if (!tmpl || tmpl.cost > maxCost) continue;
        pool.push(key);
        var matchesElem = !waveConfig.elementBias || tmpl.element === waveConfig.elementBias;
        var matchesSyn = !waveConfig.synergyBias || tmpl.archetype === waveConfig.synergyBias;
        if (matchesElem && matchesSyn) { biasedPool.push(key); biasedPool.push(key); }
        else if (matchesElem || matchesSyn) { biasedPool.push(key); }
    }
    if (pool.length === 0) return enemies;
    var usePool = biasedPool.length > 0 ? biasedPool : pool;
    for (var e = 0; e < targetCount && remaining > 0; e++) {
        var affordable = [];
        for (var j = 0; j < usePool.length; j++) {
            if (UNIT_TEMPLATES[usePool[j]].cost <= remaining) affordable.push(usePool[j]);
        }
        if (affordable.length === 0) {
            for (var jj = 0; jj < pool.length; jj++) {
                if (UNIT_TEMPLATES[pool[jj]].cost <= remaining) affordable.push(pool[jj]);
            }
        }
        if (affordable.length === 0) break;
        var pick = affordable[Math.floor(Math.random() * affordable.length)];
        remaining -= UNIT_TEMPLATES[pick].cost;
        var unit = createUnit(pick, 1);
        if (unit) {
            unit.isEnemy = true;
            if (maxCost >= 4 && Math.random() < 0.3) {
                unit.stars = 2;
                var mult2 = getStarMultiplier(2);
                var tmpl2 = UNIT_TEMPLATES[pick];
                unit.hp = Math.floor(tmpl2.hp * mult2);
                unit.maxHp = Math.floor(tmpl2.hp * mult2);
                unit.attack = Math.floor(tmpl2.attack * mult2);
            }
            enemies.push(unit);
        }
    }
    return enemies;
}

// ---- Region Functions ----

function getStageRegion(stageId) {
    for (var i = 0; i < STAGES.length; i++) {
        if (STAGES[i].id === stageId) return STAGES[i].region;
    }
    return null;
}
function getStageByIndex(index) { return STAGES[index] || null; }
function getStageById(stageId) {
    for (var i = 0; i < STAGES.length; i++) {
        if (STAGES[i].id === stageId) return STAGES[i];
    }
    return null;
}
function isStageUnlocked(saveData, stageId) {
    var stage = getStageById(stageId);
    if (!stage) return false;
    var regionNum = stage.region;
    if (regionNum === 1) return true;
    var region = REGIONS[regionNum];
    if (!region) return false;
    if (region.stageIds[0] === stageId) return isRegionBossCleared(saveData, regionNum - 1);
    var stageIdx = region.stageIds.indexOf(stageId);
    if (stageIdx <= 0) return false;
    return isStageCompleted(saveData, region.stageIds[stageIdx - 1]);
}
function isStageCompleted(saveData, stageId) {
    if (!saveData.missions.regionProgress) return false;
    var regionNum = getStageRegion(stageId);
    if (!regionNum) return false;
    var rp = saveData.missions.regionProgress[regionNum];
    if (!rp) return false;
    return rp.completed.indexOf(stageId) >= 0;
}
function isRegionComplete(saveData, regionNum) {
    var region = REGIONS[regionNum];
    if (!region) return false;
    for (var i = 0; i < region.stageIds.length; i++) {
        if (!isStageCompleted(saveData, region.stageIds[i])) return false;
    }
    return true;
}
function isRegionBossCleared(saveData, regionNum) {
    if (!saveData.missions.regionProgress) return false;
    var rp = saveData.missions.regionProgress[regionNum];
    if (!rp) return false;
    return rp.bossCleared === true;
}
function isRegionRewardClaimed(saveData, regionNum) {
    if (!saveData.missions.regionRewardsClaimed) return false;
    return saveData.missions.regionRewardsClaimed.indexOf(regionNum) >= 0;
}
// Roll a random base unit key within a region reward's cost range.
// Region rewards always specify minCost === maxCost today, but a range is
// supported in case that changes — picks a random cost within [minCost, maxCost]
// that actually has units, falling back to minCost / cost-1 pool.
function rollRegionRewardUnit(costRange) {
    var minCost = (costRange && costRange.minCost) || 1;
    var maxCost = (costRange && costRange.maxCost) || minCost;
    var cost = minCost + Math.floor(Math.random() * (maxCost - minCost + 1));
    var pool = UNITS_BY_COST[cost];
    if (!pool || pool.length === 0) pool = UNITS_BY_COST[minCost];
    if (!pool || pool.length === 0) pool = UNITS_BY_COST[1];
    if (!pool || pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

// Claim a region's completion reward. Rewards that require a player choice
// (essenceChoice / mythicMaterialChoice) need `choice` supplied
// ({ essenceElement: 'fire', mythicMaterial: 'dragon_scale' }) — if it's
// missing or invalid, the claim is rejected with needsEssenceChoice /
// needsMythicChoice so the UI can show a picker and retry. The region is
// only marked claimed once every required choice is present, so retrying
// after a picker is shown is safe (no double-claim, no lost reward).
function claimRegionReward(saveData, regionNum, choice) {
    if (!isRegionComplete(saveData, regionNum)) return { success: false, reason: 'Region not complete' };
    if (isRegionRewardClaimed(saveData, regionNum)) return { success: false, reason: 'Already claimed' };
    var region = REGIONS[regionNum];
    var reward = region.reward;

    if (reward.essenceChoice) {
        if (!choice || !choice.essenceElement || !ESSENCES[choice.essenceElement]) {
            return { success: false, reason: 'Choose an essence', needsEssenceChoice: true, reward: reward, regionName: region.name };
        }
    }
    if (reward.mythicMaterialChoice) {
        if (!choice || !choice.mythicMaterial || !MYTHIC_MATERIALS[choice.mythicMaterial]) {
            return { success: false, reason: 'Choose a Mythic Material', needsMythicChoice: true, reward: reward, regionName: region.name };
        }
    }

    if (!saveData.missions.regionRewardsClaimed) saveData.missions.regionRewardsClaimed = [];
    saveData.missions.regionRewardsClaimed.push(regionNum);

    var granted = { gold: 0, freeMultiRoll: 0, unit: null, essenceElement: null, essenceAmount: 0, mythicMaterial: null, mythicMaterialAmount: 0 };

    if (reward.gold > 0) {
        saveData.player.veilEssence += reward.gold;
        granted.gold = reward.gold;
    }
    if (reward.freeMultiRoll) {
        if (!saveData.player.freeMultiRolls) saveData.player.freeMultiRolls = 0;
        saveData.player.freeMultiRolls += reward.freeMultiRoll;
        granted.freeMultiRoll = reward.freeMultiRoll;
    }
    if (reward.randomUnit) {
        var unitKey = rollRegionRewardUnit(reward.randomUnit);
        if (unitKey) {
            addUnitToCollection(saveData, unitKey);
            granted.unit = unitKey;
        }
    }
    if (reward.essenceChoice) {
        var essKey = choice.essenceElement;
        if (!saveData.equipment.essences) saveData.equipment.essences = {};
        saveData.equipment.essences[essKey] = (saveData.equipment.essences[essKey] || 0) + reward.essenceChoice;
        granted.essenceElement = essKey;
        granted.essenceAmount = reward.essenceChoice;
    }
    if (reward.mythicMaterialChoice) {
        var matKey = choice.mythicMaterial;
        if (!saveData.equipment.mythicMaterials) saveData.equipment.mythicMaterials = {};
        saveData.equipment.mythicMaterials[matKey] = (saveData.equipment.mythicMaterials[matKey] || 0) + reward.mythicMaterialChoice;
        granted.mythicMaterial = matKey;
        granted.mythicMaterialAmount = reward.mythicMaterialChoice;
    }

    return { success: true, reward: reward, regionName: region.name, granted: granted };
}
function getRegionStatuses(saveData) {
    var statuses = [];
    var regionKeys = Object.keys(REGIONS);
    for (var i = 0; i < regionKeys.length; i++) {
        var rNum = parseInt(regionKeys[i]);
        var region = REGIONS[rNum];
        var completedCount = 0;
        for (var s = 0; s < region.stageIds.length; s++) {
            if (isStageCompleted(saveData, region.stageIds[s])) completedCount++;
        }
        statuses.push({
            region: rNum, name: region.name, subtitle: region.subtitle,
            totalStages: region.stageIds.length, completedStages: completedCount,
            complete: isRegionComplete(saveData, rNum),
            bossCleared: isRegionBossCleared(saveData, rNum),
            rewardClaimed: isRegionRewardClaimed(saveData, rNum),
            rewardDescription: region.reward.description
        });
    }
    return statuses;
}

// ---- Mission Flow ----

var activeMission = null;
var currentWaveIndex = 0;
function startMission(saveData, mission) { activeMission = mission; currentWaveIndex = 0; return true; }
function getCurrentWave() {
    if (!activeMission) return null;
    if (currentWaveIndex >= activeMission.waves.length) return null;
    return activeMission.waves[currentWaveIndex];
}
function advanceWave() { currentWaveIndex++; return currentWaveIndex < activeMission.waves.length; }
function getMissionProgress() {
    if (!activeMission) return null;
    return { currentWave: currentWaveIndex + 1, totalWaves: activeMission.waves.length, missionName: activeMission.name };
}

// ---- Milestone Rewards ----
var MISSION_MILESTONES = {
    story_10: { abilityItemKey: 'zhonyas_hourglass', desc: "Zhonya's Hourglass" },
    story_13: { abilityItemKey: 'guardian_angel', desc: 'Guardian Angel' }
};

// ---- Essence Drops ----
function rollEssenceDrops(missionLevel, starRating, elementBias) {
    var drops = [];
    if (missionLevel < 8) return drops;
    var baseChance = 0.10; var doubleChance = 0.00;
    if (missionLevel >= 14) { baseChance = 0.30; doubleChance = 0.10; }
    else if (missionLevel >= 11) { baseChance = 0.20; doubleChance = 0.05; }
    if (starRating >= 3) { baseChance += 0.15; doubleChance += 0.05; }
    var count = 0;
    if (Math.random() < doubleChance) count = 2;
    else if (Math.random() < baseChance) count = 1;
    var elements = ['fire', 'water', 'earth', 'wind', 'lightning', 'force'];
    for (var i = 0; i < count; i++) {
        var elem;
        if (elementBias && Math.random() < 0.7) elem = elementBias;
        else elem = elements[Math.floor(Math.random() * elements.length)];
        drops.push(elem);
    }
    return drops;
}

// ---- Reward Calculation ----
// XP diminishing returns based on player level vs expected region level
function getXPDiminishingReturnMultiplier(playerLevel, region) {
    // Expected player level at each region's boss (from PROGRESSION-REWORK)
    var expectedLevels = { 1: 3, 2: 6, 3: 9, 4: 12, 5: 15, 6: 17, 7: 19, 8: 20 };
    var expectedLevel = expectedLevels[region] || 1;
    var levelDiff = playerLevel - expectedLevel;

    if (levelDiff <= 0) return 1.0;
    if (levelDiff <= 2) return 0.75;
    if (levelDiff <= 4) return 0.50;
    return 0.25;
}

function calculateMissionRewards(saveData, mission, starRating) {
    // Star multiplier: 1★=50%, 2★=75%, 3★=100%
    var starMult = 1.0;
    if (starRating <= 1) starMult = 0.5;
    else if (starRating <= 2) starMult = 0.75;

    // VE reward (use ve field if available, fall back to gold for backward compat)
    var baseVE = mission.rewards.ve || mission.rewards.gold || 0;
    var baseXP = mission.rewards.xp || 0;
    var goldMult = getGoldMultiplier(saveData);
    var xpMult = getXPMultiplier(saveData);
    var gold = Math.floor(baseVE * starMult * goldMult);

    // Apply XP diminishing returns
    var missionRegion = 1;
    if (mission.id) {
        var rMatch = mission.id.match(/r(\d+)/);
        if (rMatch) missionRegion = parseInt(rMatch[1]);
    }
    var xpDiminish = getXPDiminishingReturnMultiplier(saveData.player.level, missionRegion);
    var xp = Math.floor(baseXP * starMult * xpMult * xpDiminish);

    // Unit drops — use unitDrops count from rewards if available, else random 1-3
    var copyCount = mission.rewards.unitDrops || (1 + Math.floor(Math.random() * 3));
    var unitCopies = [];
    // Use region-based tier weights for unit drops
    var regionWeights = MISSION_TIER_WEIGHTS_BY_REGION[missionRegion] || MISSION_TIER_WEIGHTS_BY_REGION[1];
    for (var i = 0; i < copyCount; i++) {
        var tier = rollTier(regionWeights);
        var pool = UNITS_BY_COST[tier];
        if (!pool || pool.length === 0) pool = UNITS_BY_COST[1];
        unitCopies.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    // Equipment drops (new system)
    var missionLevel = STAGES.indexOf(mission);
    if (missionLevel < 0) missionLevel = saveData.player.level;
    var regionNum = 1;
    var isBossMission = false;
    if (mission.id) {
        var rmatch2 = mission.id.match(/r(\d+)/);
        if (rmatch2) regionNum = parseInt(rmatch2[1]);
        isBossMission = mission.id.indexOf('boss') !== -1;
    }
    var equipRewards = (typeof generateMissionRewards === 'function') ?
        generateMissionRewards(missionLevel, starRating, isBossMission, saveData) :
        { items: [], gems: [], essences: {}, mythicMaterials: {} };

    return { gold: gold, xp: xp, starRating: starRating, unitCopies: unitCopies,
        equipmentDrops: equipRewards.items, gemDrops: equipRewards.gems,
        essenceDropsNew: equipRewards.essences, mythicMatDrops: equipRewards.mythicMaterials,
        materialDrops: equipRewards.materials || {},
        missionId: mission.id || null };
}

function applyMissionRewards(saveData, rewards) {
    earnGold(saveData, rewards.gold);
    var leveled = addPlayerXP(saveData, rewards.xp);
    if (rewards.unitCopies) {
        for (var i = 0; i < rewards.unitCopies.length; i++) addUnitToCollection(saveData, rewards.unitCopies[i]);
    }
    // Apply equipment drops (new system)
    if (rewards.equipmentDrops && saveData.equipment) {
        for (var j = 0; j < rewards.equipmentDrops.length; j++) {
            saveData.equipment.inventory.push(rewards.equipmentDrops[j]);
            if (saveData.equipment.codex && rewards.equipmentDrops[j].itemKey) {
                saveData.equipment.codex.discovered[rewards.equipmentDrops[j].itemKey + '_t' + rewards.equipmentDrops[j].tier] = true;
            }
        }
    }
    if (rewards.gemDrops && saveData.equipment) {
        if (!saveData.equipment.gems) saveData.equipment.gems = [];
        for (var gj = 0; gj < rewards.gemDrops.length; gj++) saveData.equipment.gems.push(rewards.gemDrops[gj]);
    }
    if (rewards.essenceDropsNew && saveData.equipment) {
        var enKeys = Object.keys(rewards.essenceDropsNew);
        for (var ej = 0; ej < enKeys.length; ej++) {
            saveData.equipment.essences[enKeys[ej]] = (saveData.equipment.essences[enKeys[ej]] || 0) + rewards.essenceDropsNew[enKeys[ej]];
        }
    }
    if (rewards.mythicMatDrops && saveData.equipment) {
        var mmKeys = Object.keys(rewards.mythicMatDrops);
        for (var mj = 0; mj < mmKeys.length; mj++) {
            saveData.equipment.mythicMaterials[mmKeys[mj]] = (saveData.equipment.mythicMaterials[mmKeys[mj]] || 0) + rewards.mythicMatDrops[mmKeys[mj]];
        }
    }
    if (rewards.materialDrops && saveData.equipment) {
        var matDropKeys = Object.keys(rewards.materialDrops);
        for (var mdj = 0; mdj < matDropKeys.length; mdj++) {
            saveData.equipment.materials[matDropKeys[mdj]] = (saveData.equipment.materials[matDropKeys[mdj]] || 0) + rewards.materialDrops[matDropKeys[mdj]];
        }
    }
    // Grant unit XP to deployed team members
    if (typeof grantUnitXP === 'function' && typeof getMissionUnitXP === 'function') {
        var activeTeam = getActiveTeam(saveData);
        if (activeTeam && activeTeam.slots) {
            // Determine region number from mission
            var regionNum = 1;
            var isBoss = false;
            if (rewards.missionId) {
                var rmatch = rewards.missionId.match(/r(\d+)/);
                if (rmatch) regionNum = parseInt(rmatch[1]);
                isBoss = rewards.missionId.indexOf('boss') !== -1;
            }
            var unitXPAmount = getMissionUnitXP(regionNum, isBoss);
            rewards.unitLevelUps = [];
            for (var ui = 0; ui < activeTeam.slots.length; ui++) {
                var teamSlot = activeTeam.slots[ui];
                if (!teamSlot) continue;
                // Find the collection entry for this unit
                var collEntry = saveData.collection[teamSlot.key];
                if (collEntry) {
                    if (typeof collEntry.level === 'undefined') { collEntry.level = 1; collEntry.xp = 0; }
                    var oldLevel = collEntry.level;
                    // Grant XP using a temp object then sync back
                    var tempUnit = { level: collEntry.level, xp: collEntry.xp || 0, ascensionTier: collEntry.ascensionTier || null, key: teamSlot.key, evolved: !!EVOLVED_TEMPLATES[teamSlot.key], stars: collEntry.stars || 1 };
                    var gained = grantUnitXP(tempUnit, unitXPAmount);
                    collEntry.level = tempUnit.level;
                    collEntry.xp = tempUnit.xp;
                    // Sync team slot
                    teamSlot.level = tempUnit.level;
                    teamSlot.xp = tempUnit.xp;
                    if (gained > 0) {
                        var tmplName = (UNIT_TEMPLATES[teamSlot.key] || EVOLVED_TEMPLATES[teamSlot.key] || {}).name || teamSlot.key;
                        rewards.unitLevelUps.push({ key: teamSlot.key, name: tmplName, oldLevel: oldLevel, newLevel: tempUnit.level });
                    }
                }
            }
        }
    }

    // Grant hero XP to deployed heroes
    if (typeof grantHeroXPForMission === 'function' && rewards.missionId) {
        var hRegionNum = 1;
        var hIsBoss = false;
        if (rewards.missionId) {
            var hrmatch = rewards.missionId.match(/r(\d+)/);
            if (hrmatch) hRegionNum = parseInt(hrmatch[1]);
            hIsBoss = rewards.missionId.indexOf('boss') !== -1;
        }
        rewards.heroLevelUps = grantHeroXPForMission(saveData, hRegionNum, hIsBoss);
    }

    saveData.stats.totalMissionsCompleted++;
    autoSave(saveData);
    return leveled;
}

// ---- Mission Availability ----
function getAvailableStages(saveData) {
    var available = [];
    for (var i = 0; i < STAGES.length; i++) {
        var stage = STAGES[i];
        if (!isStageUnlocked(saveData, stage.id)) continue;
        if (saveData.player.level < stage.requiredLevel) continue;
        var completed = isStageCompleted(saveData, stage.id);
        var bestStars = (saveData.missions.starRatings && saveData.missions.starRatings[stage.id]) || 0;
        if (stage.lock && !checkLock(saveData, stage.lock).passed) {
            available.push({ stage: stage, index: i, locked: true, lockReason: checkLock(saveData, stage.lock).reason, completed: completed, bestStars: bestStars });
        } else {
            available.push({ stage: stage, index: i, locked: false, completed: completed, bestStars: bestStars, isNext: !completed });
        }
    }
    return available;
}
var getAvailableStoryMissions = getAvailableStages;

function completeStoryMission(saveData, missionIndex, starRating) {
    var stage = STAGES[missionIndex];
    if (!stage) return;
    if (missionIndex >= saveData.missions.storyProgress) {
        saveData.missions.storyProgress = missionIndex + 1;
    }
    var rNum = stage.region;
    if (!saveData.missions.regionProgress) saveData.missions.regionProgress = {};
    if (!saveData.missions.regionProgress[rNum]) {
        saveData.missions.regionProgress[rNum] = { completed: [], bossCleared: false };
    }
    var rp = saveData.missions.regionProgress[rNum];
    if (rp.completed.indexOf(stage.id) < 0) rp.completed.push(stage.id);
    if (stage.boss) rp.bossCleared = true;
    if (!saveData.missions.starRatings) saveData.missions.starRatings = {};
    var prevStars = saveData.missions.starRatings[stage.id] || 0;
    if (starRating > prevStars) saveData.missions.starRatings[stage.id] = starRating;

    // Check for hero unlocks/events on stage completion
    if (typeof checkHeroUnlocks === 'function') {
        var heroEvents = checkHeroUnlocks(saveData, stage.id);
        if (heroEvents.length > 0) {
            // Store events for UI display
            if (!saveData._pendingHeroEvents) saveData._pendingHeroEvents = [];
            for (var he = 0; he < heroEvents.length; he++) {
                saveData._pendingHeroEvents.push(heroEvents[he]);
            }
        }
    }

    autoSave(saveData);
}
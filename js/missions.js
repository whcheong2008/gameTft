// =============================================================================
// missions.js — Mission definitions, wave generation, rewards (v6 — Region system)
// =============================================================================

// ---- Stage Definitions (replaces STORY_MISSIONS) ----

var STAGES = [
    // ===== REGION 1: The Frontier (4 stages + boss) =====
    {
        id: 'r1_s1',
        region: 1,
        name: 'First Steps',
        description: 'The Veil is thinnest at the frontier edge. Place your units and watch them fight — the basics of command.',
        requiredLevel: 1,
        lock: null,
        encounterMechanic: null,
        waves: [
            { budget: 3, maxCost: 1, count: 2 },
            { budget: 4, maxCost: 1, count: 2 }
        ],
        rewards: { gold: 30, xp: 50 }
    },
    {
        id: 'r1_s2',
        region: 1,
        name: 'Border Patrol',
        description: 'More creatures slip through, wave after wave. Reposition between waves to adapt.',
        requiredLevel: 2,
        lock: null,
        encounterMechanic: null,
        waves: [
            { budget: 5, maxCost: 1, count: 3 },
            { budget: 6, maxCost: 1, count: 3 },
            { budget: 7, maxCost: 1, count: 3 }
        ],
        rewards: { gold: 50, xp: 80 }
    },
    {
        id: 'r1_s3',
        region: 1,
        name: 'The Crossing',
        description: 'Stronger creatures guard the ancient bridge. Cost-2 enemies appear for the first time.',
        requiredLevel: 3,
        lock: null,
        encounterMechanic: null,
        waves: [
            { budget: 7, maxCost: 2, count: 3 },
            { budget: 9, maxCost: 2, count: 4 },
            { budget: 12, maxCost: 2, count: 5 }
        ],
        rewards: { gold: 70, xp: 120 }
    },
    {
        id: 'r1_s4',
        region: 1,
        name: 'Into the Wild',
        description: 'Mixed creatures with elemental affinities roam beyond the frontier. Your first taste of element advantages.',
        requiredLevel: 4,
        lock: null,
        encounterMechanic: null,
        waves: [
            { budget: 8, maxCost: 2, count: 4, elementBias: 'fire' },
            { budget: 10, maxCost: 2, count: 4, elementBias: 'water' },
            { budget: 12, maxCost: 2, count: 5 }
        ],
        rewards: { gold: 100, xp: 180 }
    },
    {
        id: 'r1_boss',
        region: 1,
        name: 'The Veil Warden',
        description: 'A corrupted entity born from the Shattering guards the frontier gate. Big, telegraphed, dangerous.',
        requiredLevel: 4,
        lock: null,
        encounterMechanic: null,
        waves: [],
        boss: 'veil_warden',
        rewards: { gold: 250, xp: 500 }
    },

    // ===== REGION 2: The Barracks Trials (5 stages + boss) =====
    {
        id: 'r2_s1',
        region: 2,
        name: 'Hold the Line',
        description: 'Heavy melee rushers charge your backline. Guardians absorb the punishment so your damage dealers survive.',
        requiredLevel: 5,
        lock: { type: 'archetype', value: 'guardian', count: 2 },
        encounterMechanic: null,
        waves: [
            { budget: 8, maxCost: 2, count: 3, synergyBias: 'duelist' },
            { budget: 10, maxCost: 2, count: 4, synergyBias: 'predator' },
            { budget: 12, maxCost: 3, count: 4, synergyBias: 'duelist' }
        ],
        rewards: { gold: 120, xp: 200 }
    },
    {
        id: 'r2_s2',
        region: 2,
        name: 'Death from Afar',
        description: 'Tanky but slow enemies lumber forward. Ranged units chip them down before they reach your line.',
        requiredLevel: 6,
        lock: { type: 'archetype', value: 'ranger', count: 2 },
        encounterMechanic: null,
        waves: [
            { budget: 10, maxCost: 2, count: 3, synergyBias: 'guardian' },
            { budget: 12, maxCost: 3, count: 4, synergyBias: 'guardian' },
            { budget: 14, maxCost: 3, count: 5, synergyBias: 'guardian' }
        ],
        rewards: { gold: 140, xp: 240 }
    },
    {
        id: 'r2_s3',
        region: 2,
        name: 'The Arcane Barrage',
        description: 'Spread enemies with a healer in the back. Physical single-target cannot out-damage the healing — bring magic.',
        requiredLevel: 6,
        lock: { type: 'archetype_or', value: ['sorcerer', 'mystic'], count: 2 },
        encounterMechanic: null,
        waves: [
            { budget: 10, maxCost: 2, count: 4, synergyBias: 'sage' },
            { budget: 13, maxCost: 3, count: 5 },
            { budget: 16, maxCost: 3, count: 5, synergyBias: 'sage' }
        ],
        rewards: { gold: 150, xp: 260 }
    },
    {
        id: 'r2_s4',
        region: 2,
        name: 'The Hunt',
        description: 'A dangerous backline carry hides behind a wall of tanks. Dive archetypes bypass frontlines to reach priority targets.',
        requiredLevel: 7,
        lock: { type: 'archetype_or', value: ['predator', 'duelist'], count: 2 },
        encounterMechanic: null,
        waves: [
            { budget: 12, maxCost: 3, count: 4, synergyBias: 'guardian' },
            { budget: 14, maxCost: 3, count: 5, synergyBias: 'guardian' },
            { budget: 18, maxCost: 3, count: 6, synergyBias: 'ranger' }
        ],
        rewards: { gold: 160, xp: 280 }
    },
    {
        id: 'r2_s5',
        region: 2,
        name: 'Restoration',
        description: 'Many waves, each individually easy, but damage carries between waves. Sustain keeps the team alive.',
        requiredLevel: 8,
        lock: { type: 'archetype', value: 'sage', count: 2 },
        encounterMechanic: null,
        waves: [
            { budget: 8, maxCost: 2, count: 3 },
            { budget: 10, maxCost: 2, count: 4 },
            { budget: 10, maxCost: 3, count: 4 },
            { budget: 12, maxCost: 3, count: 5 }
        ],
        rewards: { gold: 170, xp: 300 }
    },
    {
        id: 'r2_boss',
        region: 2,
        name: 'The Archon',
        description: 'Shifts between archetype stances — Guardian, Predator, Sorcerer. A balanced team handles all three.',
        requiredLevel: 8,
        lock: null,
        encounterMechanic: null,
        waves: [],
        boss: 'archon',
        rewards: { gold: 350, xp: 600 }
    },

    // ===== REGION 3: The Synergy Trials (4 stages + boss) =====
    {
        id: 'r3_s1',
        region: 3,
        name: 'Shield and Fang',
        description: 'Balanced enemy comp with frontline and backline. Guardians hold while Predators flank.',
        requiredLevel: 8,
        lock: { type: 'archetype_pair', value: ['guardian', 'predator'], count: [2, 2] },
        encounterMechanic: null,
        waves: [
            { budget: 12, maxCost: 3, count: 4 },
            { budget: 15, maxCost: 3, count: 5 },
            { budget: 18, maxCost: 4, count: 5 }
        ],
        rewards: { gold: 180, xp: 350 }
    },
    {
        id: 'r3_s2',
        region: 3,
        name: 'The Long Watch',
        description: 'Aggressive fast melee rushers. Rangers deal damage from safety, Sages sustain — but positioning is critical.',
        requiredLevel: 9,
        lock: { type: 'archetype_pair', value: ['ranger', 'sage'], count: [2, 2] },
        encounterMechanic: null,
        waves: [
            { budget: 14, maxCost: 3, count: 5, synergyBias: 'predator' },
            { budget: 17, maxCost: 3, count: 5, synergyBias: 'duelist' },
            { budget: 20, maxCost: 4, count: 6, synergyBias: 'predator' }
        ],
        rewards: { gold: 200, xp: 380 }
    },
    {
        id: 'r3_s3',
        region: 3,
        name: 'Elemental Clash',
        description: 'Mono-element enemies test your element coverage. Half your team shreds, half struggles.',
        requiredLevel: 10,
        lock: { type: 'element_count', count: 2 },
        encounterMechanic: null,
        waves: [
            { budget: 15, maxCost: 3, count: 4, elementBias: 'fire' },
            { budget: 18, maxCost: 4, count: 5, elementBias: 'water' },
            { budget: 22, maxCost: 4, count: 6, elementBias: 'earth' }
        ],
        rewards: { gold: 220, xp: 400 }
    },
    {
        id: 'r3_s4',
        region: 3,
        name: 'Deep Bonds',
        description: 'Stack three of one archetype and feel the synergy bonus activate. Deeper stacking changes how the team plays.',
        requiredLevel: 11,
        lock: { type: 'archetype_deep', count: 3 },
        encounterMechanic: null,
        waves: [
            { budget: 16, maxCost: 3, count: 5 },
            { budget: 19, maxCost: 4, count: 5, enemySynergies: true },
            { budget: 22, maxCost: 4, count: 6, enemySynergies: true }
        ],
        rewards: { gold: 240, xp: 420 }
    },
    {
        id: 'r3_boss',
        region: 3,
        name: 'The Twin Heralds',
        description: 'Two bosses at once. Proximity buff and kill-order puzzle — synergy thinking at its finest.',
        requiredLevel: 11,
        lock: null,
        encounterMechanic: null,
        waves: [],
        boss: 'twin_heralds',
        rewards: { gold: 400, xp: 700 }
    },

    // ===== REGION 4: The Shattered Lands (5 stages + boss) =====
    {
        id: 'r4_s1',
        region: 4,
        name: 'The Priority',
        description: 'An enemy healer buffs all allies with +25% ATK and regeneration. Kill the VIP to stop the effect.',
        requiredLevel: 10,
        lock: null,
        encounterMechanic: 'vip_target',
        waves: [
            { budget: 15, maxCost: 3, count: 4 },
            { budget: 18, maxCost: 4, count: 5 },
            { budget: 22, maxCost: 4, count: 6 }
        ],
        rewards: { gold: 220, xp: 400 }
    },
    {
        id: 'r4_s2',
        region: 4,
        name: 'Against the Clock',
        description: 'A Veil Crystal charges a wipe ability. Destroy it before 45 seconds or face devastating damage.',
        requiredLevel: 11,
        lock: null,
        encounterMechanic: 'countdown',
        waves: [
            { budget: 17, maxCost: 3, count: 5 },
            { budget: 20, maxCost: 4, count: 5 },
            { budget: 24, maxCost: 4, count: 6 }
        ],
        rewards: { gold: 240, xp: 420 }
    },
    {
        id: 'r4_s3',
        region: 4,
        name: 'Endless Tide',
        description: 'Three spawn points produce new enemies every 8 seconds. Position to intercept or power through the center.',
        requiredLevel: 12,
        lock: null,
        encounterMechanic: 'reinforcement_pressure',
        waves: [
            { budget: 18, maxCost: 3, count: 5 },
            { budget: 22, maxCost: 4, count: 6 },
            { budget: 26, maxCost: 4, count: 7 }
        ],
        rewards: { gold: 260, xp: 450 }
    },
    {
        id: 'r4_s4',
        region: 4,
        name: 'The Ward',
        description: 'A friendly NPC must survive all waves. Enemies prioritize it. Protect or kill fast.',
        requiredLevel: 12,
        lock: null,
        encounterMechanic: 'protect_objective',
        waves: [
            { budget: 20, maxCost: 4, count: 5 },
            { budget: 24, maxCost: 4, count: 6 },
            { budget: 28, maxCost: 4, count: 7 }
        ],
        rewards: { gold: 280, xp: 480 }
    },
    {
        id: 'r4_s5',
        region: 4,
        name: 'The Growing Storm',
        description: 'One elite enemy gains +15% ATK and +10% attack speed every 5 seconds. Kill it first or face the monster.',
        requiredLevel: 13,
        lock: null,
        encounterMechanic: 'escalating_threat',
        waves: [
            { budget: 22, maxCost: 4, count: 5 },
            { budget: 25, maxCost: 4, count: 6 },
            { budget: 28, maxCost: 4, count: 7 }
        ],
        rewards: { gold: 300, xp: 500 }
    },
    {
        id: 'r4_boss',
        region: 4,
        name: 'The Shattered Colossus',
        description: 'Cycles through encounter mechanics as phase transitions. The practical exam for adaptive combat.',
        requiredLevel: 13,
        lock: null,
        encounterMechanic: null,
        waves: [],
        boss: 'shattered_colossus',
        rewards: { gold: 500, xp: 800 }
    },

    // ===== REGION 5: The Dual Convergence (4 stages + boss) =====
    {
        id: 'r5_s1',
        region: 5,
        name: 'Fire and Ice',
        description: 'Mono-element enemies challenge your dual-element team. One half dominates, the other struggles.',
        requiredLevel: 12,
        lock: { type: 'element_dual' },
        encounterMechanic: null,
        waves: [
            { budget: 18, maxCost: 3, count: 5, elementBias: 'fire' },
            { budget: 22, maxCost: 4, count: 5, elementBias: 'water' },
            { budget: 26, maxCost: 4, count: 6 }
        ],
        rewards: { gold: 280, xp: 480 }
    },
    {
        id: 'r5_s2',
        region: 5,
        name: 'Shifting Tides',
        description: 'Each wave switches element. Both halves of your team get their moment to shine.',
        requiredLevel: 13,
        lock: { type: 'element_dual' },
        encounterMechanic: null,
        waves: [
            { budget: 20, maxCost: 4, count: 5, elementBias: 'earth' },
            { budget: 24, maxCost: 4, count: 6, elementBias: 'wind' },
            { budget: 28, maxCost: 5, count: 6, captain: 'nereus' }
        ],
        rewards: { gold: 300, xp: 520 }
    },
    {
        id: 'r5_s3',
        region: 5,
        name: 'The Crucible Pair',
        description: 'Dual-element enemies mirror your constraint. Enemy synergy bonuses are active. Who built better?',
        requiredLevel: 14,
        lock: { type: 'element_dual' },
        encounterMechanic: null,
        waves: [
            { budget: 24, maxCost: 4, count: 5, enemySynergies: true },
            { budget: 28, maxCost: 5, count: 6, enemySynergies: true },
            { budget: 32, maxCost: 5, count: 7, enemySynergies: true }
        ],
        rewards: { gold: 320, xp: 560 }
    },
    {
        id: 'r5_s4',
        region: 5,
        name: 'Elemental Pressure',
        description: 'Escalating element diversity across waves. Your dual-element synergy bonuses vs broader but shallower coverage.',
        requiredLevel: 15,
        lock: { type: 'element_dual' },
        encounterMechanic: null,
        waves: [
            { budget: 26, maxCost: 4, count: 5, elementBias: 'lightning' },
            { budget: 30, maxCost: 5, count: 6 },
            { budget: 32, maxCost: 5, count: 7 }
        ],
        rewards: { gold: 340, xp: 600 }
    },
    {
        id: 'r5_boss',
        region: 5,
        name: 'The Elemental Chimera',
        description: 'Shifts between elements every 20s. Heals from damage matching its current element. Both halves of your team must carry.',
        requiredLevel: 15,
        lock: null,
        encounterMechanic: null,
        waves: [],
        boss: 'elemental_chimera',
        rewards: { gold: 550, xp: 900 }
    },

    // ===== REGION 6: The Elemental Crucible (6 stages + boss) =====
    {
        id: 'r6_s1',
        region: 6,
        name: 'Four Winds',
        description: 'Balanced enemies at moderate difficulty. Ease into 4-element team building.',
        requiredLevel: 14,
        lock: { type: 'element_min', count: 4 },
        encounterMechanic: null,
        waves: [
            { budget: 22, maxCost: 4, count: 5 },
            { budget: 26, maxCost: 4, count: 6 },
            { budget: 30, maxCost: 5, count: 6 }
        ],
        rewards: { gold: 320, xp: 560 }
    },
    {
        id: 'r6_s2',
        region: 6,
        name: 'Fire and Stone',
        description: 'Fire and Earth enemies with active synergies. Water and Wind units are most effective.',
        requiredLevel: 15,
        lock: { type: 'element_min', count: 4 },
        encounterMechanic: null,
        elementBias: ['fire', 'earth'],
        waves: [
            { budget: 24, maxCost: 4, count: 5, elementBias: 'fire', enemySynergies: true },
            { budget: 28, maxCost: 5, count: 6, elementBias: 'earth', enemySynergies: true },
            { budget: 32, maxCost: 5, count: 6, elementBias: 'fire', enemySynergies: true, captain: 'pyra' }
        ],
        rewards: { gold: 350, xp: 600 }
    },
    {
        id: 'r6_s3',
        region: 6,
        name: 'Storm and Sea',
        description: 'Water and Wind enemies with active synergies. Fire and Earth/Lightning units shine here.',
        requiredLevel: 15,
        lock: { type: 'element_min', count: 4 },
        encounterMechanic: null,
        elementBias: ['water', 'wind'],
        waves: [
            { budget: 26, maxCost: 4, count: 5, elementBias: 'water', enemySynergies: true },
            { budget: 30, maxCost: 5, count: 6, elementBias: 'wind', enemySynergies: true },
            { budget: 34, maxCost: 5, count: 7, enemySynergies: true }
        ],
        rewards: { gold: 370, xp: 640 }
    },
    {
        id: 'r6_s4',
        region: 6,
        name: 'Lightning Surge',
        description: 'Lightning and Force enemies prominently featured. Earth counters Lightning — bring it.',
        requiredLevel: 16,
        lock: { type: 'element_min', count: 4 },
        encounterMechanic: null,
        elementBias: ['lightning', 'force'],
        waves: [
            { budget: 28, maxCost: 4, count: 5, elementBias: 'lightning', enemySynergies: true },
            { budget: 32, maxCost: 5, count: 6, elementBias: 'force', enemySynergies: true },
            { budget: 36, maxCost: 5, count: 7, elementBias: 'lightning', enemySynergies: true, captain: 'gorath' }
        ],
        rewards: { gold: 400, xp: 680 }
    },
    {
        id: 'r6_s5',
        region: 6,
        name: 'The Full Spectrum',
        description: 'All 6 elements represented with active synergies and evolved enemies. Pure team quality check.',
        requiredLevel: 16,
        lock: { type: 'element_min', count: 4 },
        encounterMechanic: null,
        waves: [
            { budget: 32, maxCost: 5, count: 6, enemySynergies: true, enemyEvolutions: true },
            { budget: 36, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
            { budget: 40, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true }
        ],
        rewards: { gold: 420, xp: 720 }
    },
    {
        id: 'r6_s6',
        region: 6,
        name: 'Crucible\'s Peak',
        description: 'Full synergies, high star levels, multiple waves. The hardest non-boss stage in the region.',
        requiredLevel: 17,
        lock: { type: 'element_min', count: 4 },
        encounterMechanic: null,
        waves: [
            { budget: 34, maxCost: 5, count: 6, enemySynergies: true, enemyEvolutions: true },
            { budget: 38, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
            { budget: 40, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true }
        ],
        rewards: { gold: 450, xp: 760 }
    },
    {
        id: 'r6_boss',
        region: 6,
        name: 'The Prismatic Sentinel',
        description: 'Rotating element immunity and vulnerability. You must have 2-3 elements contributing damage at all times.',
        requiredLevel: 17,
        lock: null,
        encounterMechanic: null,
        waves: [],
        boss: 'prismatic_sentinel',
        rewards: { gold: 650, xp: 1000 }
    },

    // ===== REGION 7: The Proving Grounds (5 stages + boss) =====
    {
        id: 'r7_s1',
        region: 7,
        name: 'Endurance Under Fire',
        description: 'An escalating enemy plus a healer lock. Can your sustain outlast the growing threat?',
        requiredLevel: 16,
        lock: { type: 'archetype', value: 'sage', count: 3 },
        encounterMechanic: 'escalating_threat',
        waves: [
            { budget: 28, maxCost: 4, count: 5 },
            { budget: 32, maxCost: 5, count: 6 },
            { budget: 36, maxCost: 5, count: 6 }
        ],
        rewards: { gold: 420, xp: 720 }
    },
    {
        id: 'r7_s2',
        region: 7,
        name: 'Stripped Down',
        description: 'No element synergies allowed. Pure archetype power and unit quality vs reinforcement spawns.',
        requiredLevel: 17,
        lock: { type: 'no_element_synergy' },
        encounterMechanic: 'reinforcement_pressure',
        waves: [
            { budget: 30, maxCost: 4, count: 5 },
            { budget: 34, maxCost: 5, count: 6 },
            { budget: 38, maxCost: 5, count: 7, captain: 'sylph' }
        ],
        rewards: { gold: 440, xp: 760 }
    },
    {
        id: 'r7_s3',
        region: 7,
        name: 'Divided Command',
        description: 'Protect a friendly NPC while hunting a dangerous enemy carry. Split-focus team management.',
        requiredLevel: 18,
        lock: { type: 'archetype_pair', value: ['predator', 'guardian'], count: [2, 2] },
        encounterMechanic: 'protect_objective',
        waves: [
            { budget: 32, maxCost: 5, count: 5 },
            { budget: 36, maxCost: 5, count: 6 },
            { budget: 40, maxCost: 5, count: 7 }
        ],
        rewards: { gold: 460, xp: 800 }
    },
    {
        id: 'r7_s4',
        region: 7,
        name: 'Fractured Elements',
        description: 'Team split into two groups. Wrong element distribution means one side faces bad matchups.',
        requiredLevel: 18,
        lock: { type: 'element_min', count: 3 },
        encounterMechanic: 'split_formation',
        waves: [
            { budget: 34, maxCost: 5, count: 5 },
            { budget: 38, maxCost: 5, count: 6 },
            { budget: 42, maxCost: 5, count: 7 }
        ],
        rewards: { gold: 480, xp: 840 }
    },
    {
        id: 'r7_s5',
        region: 7,
        name: 'Final Judgment',
        description: 'Deep archetype stacking vs a countdown AND a VIP. Two priority targets. Capstone stage.',
        requiredLevel: 19,
        lock: { type: 'archetype_deep', count: 4 },
        encounterMechanic: ['countdown', 'vip_target'],
        waves: [
            { budget: 36, maxCost: 5, count: 6 },
            { budget: 40, maxCost: 5, count: 7 },
            { budget: 45, maxCost: 5, count: 7, captain: 'arbiter' }
        ],
        rewards: { gold: 500, xp: 880 }
    },
    {
        id: 'r7_boss',
        region: 7,
        name: 'The Arbiter of Trials',
        description: 'The ultimate puzzle boss. Imposes constraints mid-fight: synergy suppression, split formation, countdown.',
        requiredLevel: 19,
        lock: null,
        encounterMechanic: null,
        waves: [],
        boss: 'arbiter_of_trials',
        rewards: { gold: 750, xp: 1100 }
    },

    // ===== REGION 8: The Abyss Gate (6 stages + boss) =====
    {
        id: 'r8_s1',
        region: 8,
        name: 'Descent',
        description: 'High stats, full synergies, evolved enemies. Raw power check for the endgame.',
        requiredLevel: 18,
        lock: null,
        encounterMechanic: null,
        waves: [
            { budget: 35, maxCost: 5, count: 6, enemySynergies: true, enemyEvolutions: true },
            { budget: 40, maxCost: 5, count: 6, enemySynergies: true, enemyEvolutions: true },
            { budget: 45, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true }
        ],
        rewards: { gold: 480, xp: 840 }
    },
    {
        id: 'r8_s2',
        region: 8,
        name: 'The Gauntlet',
        description: 'Reinforcement spawns plus an escalating elite. Two overlapping pressure sources at endgame power.',
        requiredLevel: 19,
        lock: null,
        encounterMechanic: ['reinforcement_pressure', 'escalating_threat'],
        waves: [
            { budget: 38, maxCost: 5, count: 6, enemySynergies: true, enemyEvolutions: true },
            { budget: 42, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
            { budget: 48, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true }
        ],
        rewards: { gold: 520, xp: 900 }
    },
    {
        id: 'r8_s3',
        region: 8,
        name: 'Shattered Ground',
        description: 'Team split plus a VIP on one side. Roster depth and split-team viability required.',
        requiredLevel: 19,
        lock: null,
        encounterMechanic: ['split_formation', 'vip_target'],
        waves: [
            { budget: 40, maxCost: 5, count: 6, enemySynergies: true, enemyEvolutions: true },
            { budget: 45, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
            { budget: 50, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true }
        ],
        rewards: { gold: 540, xp: 940 }
    },
    {
        id: 'r8_s4',
        region: 8,
        name: 'The Crucible Returns',
        description: 'A wipe timer AND a friendly NPC to protect. Balance offense and defense or fail both.',
        requiredLevel: 19,
        lock: null,
        encounterMechanic: ['countdown', 'protect_objective'],
        waves: [
            { budget: 42, maxCost: 5, count: 6, enemySynergies: true, enemyEvolutions: true },
            { budget: 48, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
            { budget: 55, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true }
        ],
        rewards: { gold: 560, xp: 980 }
    },
    {
        id: 'r8_s5',
        region: 8,
        name: 'The Threshold',
        description: 'Maximum non-boss difficulty. Full synergies, evolved champions, 4 waves.',
        requiredLevel: 20,
        lock: null,
        encounterMechanic: null,
        waves: [
            { budget: 45, maxCost: 5, count: 6, enemySynergies: true, enemyEvolutions: true },
            { budget: 50, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
            { budget: 55, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
            { budget: 60, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true, captain: 'voidborn_champion' }
        ],
        rewards: { gold: 600, xp: 1050 }
    },
    {
        id: 'r8_s6',
        region: 8,
        name: 'The Void\'s Edge',
        description: 'Void-element enemies negate element advantages. Win on raw team quality, synergy bonuses, and items alone.',
        requiredLevel: 20,
        lock: null,
        encounterMechanic: null,
        waves: [
            { budget: 48, maxCost: 5, count: 6, elementBias: 'force', enemySynergies: true, enemyEvolutions: true },
            { budget: 52, maxCost: 5, count: 7, elementBias: 'force', enemySynergies: true, enemyEvolutions: true },
            { budget: 58, maxCost: 5, count: 7, elementBias: 'force', enemySynergies: true, enemyEvolutions: true }
        ],
        rewards: { gold: 640, xp: 1100 }
    },
    {
        id: 'r8_boss',
        region: 8,
        name: 'The Eternal Throne',
        description: 'The Void Sovereign awaits. Three phases: Puppeteer, Commander, Unmaker. Everything you have mastered is tested.',
        requiredLevel: 20,
        lock: null,
        encounterMechanic: null,
        waves: [],
        boss: 'void_sovereign',
        rewards: { gold: 1000, xp: 1500 }
    }
];

// Backward compatibility alias
var STORY_MISSIONS = STAGES;

// ---- Region Definitions (replaces CHAPTERS) ----

var REGIONS = {
    1: {
        name: 'The Frontier',
        subtitle: 'Basic combat, positioning',
        stageIds: ['r1_s1', 'r1_s2', 'r1_s3', 'r1_s4', 'r1_boss'],
        reward: { description: 'Unlock Summoning Circle upgrades + 1 free 10-pull', gold: 0, freeMultiRoll: 1 }
    },
    2: {
        name: 'The Barracks Trials',
        subtitle: 'Archetype roles',
        stageIds: ['r2_s1', 'r2_s2', 'r2_s3', 'r2_s4', 'r2_s5', 'r2_boss'],
        reward: { description: 'Unlock Evolution Lab + 500g + 1 random Cost-3 unit', gold: 500, randomUnit: { minCost: 3, maxCost: 3 } }
    },
    3: {
        name: 'The Synergy Trials',
        subtitle: 'Synergy pairing',
        stageIds: ['r3_s1', 'r3_s2', 'r3_s3', 'r3_s4', 'r3_boss'],
        reward: { description: 'Unlock Forge Level 3 (Transmute) + 1 essence of choice', gold: 0, essenceChoice: 1 }
    },
    4: {
        name: 'The Shattered Lands',
        subtitle: 'Adaptive combat',
        stageIds: ['r4_s1', 'r4_s2', 'r4_s3', 'r4_s4', 'r4_s5', 'r4_boss'],
        reward: { description: 'Unlock Forge Level 4 (Set Crafting) + 750g', gold: 750 }
    },
    5: {
        name: 'The Dual Convergence',
        subtitle: 'Element coverage',
        stageIds: ['r5_s1', 'r5_s2', 'r5_s3', 'r5_s4', 'r5_boss'],
        reward: { description: 'Unlock Gem Workshop + 1 random Cost-4 unit', gold: 0, randomUnit: { minCost: 4, maxCost: 4 } }
    },
    6: {
        name: 'The Elemental Crucible',
        subtitle: 'Multi-element orchestration',
        stageIds: ['r6_s1', 'r6_s2', 'r6_s3', 'r6_s4', 'r6_s5', 'r6_s6', 'r6_boss'],
        reward: { description: '1,000g + 2 essences of choice', gold: 1000, essenceChoice: 2 }
    },
    7: {
        name: 'The Proving Grounds',
        subtitle: 'Peak tactical challenge',
        stageIds: ['r7_s1', 'r7_s2', 'r7_s3', 'r7_s4', 'r7_s5', 'r7_boss'],
        reward: { description: 'Unlock Forge Level 5 (Ability Crafting) + Mythic Material', gold: 0, mythicMaterialChoice: 1 }
    },
    8: {
        name: 'The Abyss Gate',
        subtitle: 'Endgame mastery',
        stageIds: ['r8_s1', 'r8_s2', 'r8_s3', 'r8_s4', 'r8_s5', 'r8_s6', 'r8_boss'],
        reward: { description: 'Choice of any Cost-5 unit + 2,000g + Mythic Material', gold: 2000, randomUnit: { minCost: 5, maxCost: 5 }, mythicMaterialChoice: 1 }
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

var ENCOUNTER_MECHANICS = {
    vip_target: {
        name: 'VIP Target',
        desc: 'One enemy buffs/heals the rest. Kill it to stop the effect.',
        setup: function(waveState, stageData) {
            // Mark one enemy as VIP — gives +25% ATK buff + regen to allies
            if (!waveState.enemies || waveState.enemies.length === 0) return;
            // Pick enemy with highest HP as VIP
            var vipIdx = 0;
            var maxHp = 0;
            for (var i = 0; i < waveState.enemies.length; i++) {
                if (waveState.enemies[i].hp > maxHp) {
                    maxHp = waveState.enemies[i].hp;
                    vipIdx = i;
                }
            }
            waveState.enemies[vipIdx].isVIP = true;
            waveState.enemies[vipIdx].name = '⭐ ' + (waveState.enemies[vipIdx].name || 'VIP');
            waveState.mechanicState = {
                type: 'vip_target',
                vipIndex: vipIdx,
                atkBuff: 0.25,
                regenPerSec: 0.01, // 1% max HP regen per second to allies
                active: true
            };
        },
        tick: function(waveState, dt) {
            var ms = waveState.mechanicState;
            if (!ms || !ms.active) return;
            var vip = waveState.enemies[ms.vipIndex];
            if (!vip || !vip.alive) {
                ms.active = false;
                // Remove buff from remaining enemies
                for (var i = 0; i < waveState.enemies.length; i++) {
                    if (waveState.enemies[i].vipAtkBuff) {
                        waveState.enemies[i].attack = waveState.enemies[i]._baseAttack || waveState.enemies[i].attack;
                        waveState.enemies[i].vipAtkBuff = false;
                    }
                }
                return;
            }
            // Apply buff to alive non-VIP enemies
            for (var j = 0; j < waveState.enemies.length; j++) {
                var e = waveState.enemies[j];
                if (!e.alive || e.isVIP) continue;
                if (!e.vipAtkBuff) {
                    e._baseAttack = e.attack;
                    e.attack = Math.floor(e.attack * (1 + ms.atkBuff));
                    e.vipAtkBuff = true;
                }
                // Regen
                var healAmt = Math.floor(e.maxHp * ms.regenPerSec * dt);
                e.hp = Math.min(e.maxHp, e.hp + healAmt);
            }
        }
    },
    countdown: {
        name: 'Countdown',
        desc: 'A structure charges a wipe ability. Destroy it before it fires.',
        setup: function(waveState, stageData) {
            // Spawn a Veil Crystal entity on enemy side
            var crystal = {
                key: 'veil_crystal',
                name: '💎 Veil Crystal',
                emoji: '💎',
                hp: 3000,
                maxHp: 3000,
                attack: 0,
                attackSpd: 0,
                range: 0,
                moveSpd: 0,
                damageReduction: 0,
                isEnemy: true,
                isCrystal: true,
                alive: true,
                row: 0,
                col: 3,
                stars: 1,
                mana: 0,
                maxMana: 100,
                element: null
            };
            waveState.enemies.push(crystal);
            waveState.mechanicState = {
                type: 'countdown',
                timer: 45,
                crystalIndex: waveState.enemies.length - 1,
                fired: false,
                wipeDamagePct: 0.80 // 80% current HP damage
            };
        },
        tick: function(waveState, dt) {
            var ms = waveState.mechanicState;
            if (!ms || ms.fired) return;
            var crystal = waveState.enemies[ms.crystalIndex];
            if (!crystal || !crystal.alive) {
                ms.fired = true; // Crystal destroyed, cancel
                return;
            }
            ms.timer -= dt;
            if (ms.timer <= 0) {
                ms.fired = true;
                // Deal 80% current HP to all player units
                if (waveState.playerUnits) {
                    for (var i = 0; i < waveState.playerUnits.length; i++) {
                        var u = waveState.playerUnits[i];
                        if (u && u.alive) {
                            var dmg = Math.floor(u.hp * ms.wipeDamagePct);
                            u.hp -= dmg;
                            if (u.hp <= 0) { u.hp = 0; u.alive = false; }
                        }
                    }
                }
            }
        }
    },
    reinforcement_pressure: {
        name: 'Reinforcement Pressure',
        desc: 'Spawn points produce new enemies at set intervals.',
        setup: function(waveState, stageData) {
            waveState.mechanicState = {
                type: 'reinforcement_pressure',
                spawnPoints: [
                    { row: 0, col: 1 },
                    { row: 0, col: 3 },
                    { row: 0, col: 5 }
                ],
                spawnTimer: 0,
                spawnInterval: 8,
                totalSpawned: 0,
                maxSpawns: 12 // Cap to prevent infinite
            };
        },
        tick: function(waveState, dt) {
            var ms = waveState.mechanicState;
            if (!ms || ms.totalSpawned >= ms.maxSpawns) return;
            ms.spawnTimer += dt;
            if (ms.spawnTimer >= ms.spawnInterval) {
                ms.spawnTimer -= ms.spawnInterval;
                // Spawn low-tier enemy at each spawn point
                for (var i = 0; i < ms.spawnPoints.length; i++) {
                    if (ms.totalSpawned >= ms.maxSpawns) break;
                    var sp = ms.spawnPoints[i];
                    var unitKey = getRandomUnitByElementAndTier(null, [1, 2]);
                    if (typeof createUnit === 'function') {
                        var unit = createUnit(unitKey, 1);
                        if (unit) {
                            unit.isEnemy = true;
                            unit.row = sp.row;
                            unit.col = sp.col;
                            unit.isReinforcement = true;
                            waveState.enemies.push(unit);
                            ms.totalSpawned++;
                        }
                    }
                }
            }
        }
    },
    protect_objective: {
        name: 'Protect the Objective',
        desc: 'A friendly NPC must survive all waves.',
        setup: function(waveState, stageData) {
            var npc = {
                key: 'friendly_npc',
                name: '🛡️ Ward Crystal',
                emoji: '🛡️',
                hp: 2000,
                maxHp: 2000,
                attack: 0,
                attackSpd: 0,
                range: 0,
                moveSpd: 0,
                damageReduction: 0.1,
                isEnemy: false,
                isNPC: true,
                alive: true,
                row: 6,
                col: 3,
                stars: 1,
                mana: 0,
                maxMana: 100,
                element: null
            };
            if (waveState.playerUnits) {
                waveState.playerUnits.push(npc);
            }
            waveState.mechanicState = {
                type: 'protect_objective',
                npcIndex: waveState.playerUnits ? waveState.playerUnits.length - 1 : -1,
                failed: false
            };
        },
        tick: function(waveState, dt) {
            var ms = waveState.mechanicState;
            if (!ms || ms.failed) return;
            if (ms.npcIndex < 0) return;
            var npc = waveState.playerUnits[ms.npcIndex];
            if (!npc || !npc.alive) {
                ms.failed = true;
                waveState.objectiveFailed = true;
            }
        }
    },
    split_formation: {
        name: 'Split Formation',
        desc: 'Team forced into two groups with a gap.',
        setup: function(waveState, stageData) {
            // Create 1-column gap in middle of grid (col 3)
            // Push player units to either side based on current position
            if (waveState.playerUnits) {
                for (var i = 0; i < waveState.playerUnits.length; i++) {
                    var u = waveState.playerUnits[i];
                    if (!u || !u.alive) continue;
                    if (u.col === 3) {
                        u.col = (u.col <= 3) ? 2 : 4;
                    }
                }
            }
            waveState.mechanicState = {
                type: 'split_formation',
                gapCol: 3,
                pulseTimer: 0,
                pulseInterval: 5,
                pulseDamage: 200
            };
        },
        tick: function(waveState, dt) {
            var ms = waveState.mechanicState;
            if (!ms) return;
            ms.pulseTimer += dt;
            if (ms.pulseTimer >= ms.pulseInterval) {
                ms.pulseTimer -= ms.pulseInterval;
                // Damage units in gap column
                var allUnits = (waveState.playerUnits || []).concat(waveState.enemies || []);
                for (var i = 0; i < allUnits.length; i++) {
                    var u = allUnits[i];
                    if (u && u.alive && u.col === ms.gapCol) {
                        u.hp -= ms.pulseDamage;
                        if (u.hp <= 0) { u.hp = 0; u.alive = false; }
                    }
                }
            }
        }
    },
    escalating_threat: {
        name: 'Escalating Threat',
        desc: 'One enemy gains stacking buffs over time.',
        setup: function(waveState, stageData) {
            if (!waveState.enemies || waveState.enemies.length === 0) return;
            // Pick strongest enemy as the escalator
            var escIdx = 0;
            var maxAtk = 0;
            for (var i = 0; i < waveState.enemies.length; i++) {
                if (waveState.enemies[i].attack > maxAtk) {
                    maxAtk = waveState.enemies[i].attack;
                    escIdx = i;
                }
            }
            waveState.enemies[escIdx].isEscalator = true;
            waveState.enemies[escIdx].name = '⚡ ' + (waveState.enemies[escIdx].name || 'Elite');
            waveState.enemies[escIdx]._baseAttack = waveState.enemies[escIdx].attack;
            waveState.enemies[escIdx]._baseAtkSpd = waveState.enemies[escIdx].attackSpd;
            waveState.mechanicState = {
                type: 'escalating_threat',
                escalatorIndex: escIdx,
                buffTimer: 0,
                buffInterval: 5,
                atkStackPct: 0.15,
                spdStackPct: 0.10,
                stacks: 0
            };
        },
        tick: function(waveState, dt) {
            var ms = waveState.mechanicState;
            if (!ms) return;
            var esc = waveState.enemies[ms.escalatorIndex];
            if (!esc || !esc.alive) return;
            ms.buffTimer += dt;
            if (ms.buffTimer >= ms.buffInterval) {
                ms.buffTimer -= ms.buffInterval;
                ms.stacks++;
                esc.attack = Math.floor(esc._baseAttack * (1 + ms.atkStackPct * ms.stacks));
                esc.attackSpd = Math.max(0.3, esc._baseAtkSpd * (1 - ms.spdStackPct * ms.stacks));
            }
        }
    }
};

// Global tick function for encounter mechanics — called from combat engine
function tickEncounterMechanics(waveState, dt) {
    if (!waveState || !waveState.mechanicState) return;
    var ms = waveState.mechanicState;
    if (Array.isArray(ms)) {
        // Combined mechanics (Region 8 stages)
        for (var i = 0; i < ms.length; i++) {
            var mechanic = ENCOUNTER_MECHANICS[ms[i].type];
            if (mechanic && mechanic.tick) {
                // Temporarily set mechanicState to individual state for tick
                var savedState = waveState.mechanicState;
                waveState.mechanicState = ms[i];
                mechanic.tick(waveState, dt);
                waveState.mechanicState = savedState;
            }
        }
    } else {
        var singleMechanic = ENCOUNTER_MECHANICS[ms.type];
        if (singleMechanic && singleMechanic.tick) {
            singleMechanic.tick(waveState, dt);
        }
    }
}

// Setup encounter mechanics for a wave
function setupEncounterMechanics(waveState, stageData) {
    if (!stageData || !stageData.encounterMechanic) return;
    var mechanic = stageData.encounterMechanic;
    if (Array.isArray(mechanic)) {
        // Combined mechanics
        var states = [];
        for (var i = 0; i < mechanic.length; i++) {
            var m = ENCOUNTER_MECHANICS[mechanic[i]];
            if (m && m.setup) {
                m.setup(waveState, stageData);
                if (waveState.mechanicState) {
                    states.push(waveState.mechanicState);
                }
            }
        }
        waveState.mechanicState = states;
    } else {
        var single = ENCOUNTER_MECHANICS[mechanic];
        if (single && single.setup) {
            single.setup(waveState, stageData);
        }
    }
}

// ---- Boss Data ----

var BOSS_DATA = {

    // Region 1 boss (replaces veil_guardian)
    veil_warden: {
        name: 'Veil Warden',
        emoji: '👁️',
        element: null,
        size: [2, 2],
        baseHp: 5000,
        hpScaling: 8,
        baseAtk: 0,
        atkScaling: 1.5,
        dr: 0.15,
        attackSpd: 1.5,
        range: 1,
        enrageTime: 90,
        enrageAtkMult: 1.5,
        enrageSpdMult: 1.3,
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
        loot: { gold: 250, xp: 500, firstClearGold: 500 }
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
        loot: { gold: 350, xp: 600, firstClearGold: 500 }
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
        loot: { gold: 400, xp: 700, firstClearGold: 500 }
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
        loot: { gold: 500, xp: 800, firstClearGold: 500 }
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
        loot: { gold: 550, xp: 900, firstClearGold: 500 }
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
        loot: { gold: 650, xp: 1000, firstClearGold: 600 }
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
        loot: { gold: 750, xp: 1100, firstClearGold: 700 }
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
        loot: { gold: 1000, xp: 1500, firstClearGold: 1000 }
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
function claimRegionReward(saveData, regionNum) {
    if (!isRegionComplete(saveData, regionNum)) return { success: false, reason: 'Region not complete' };
    if (isRegionRewardClaimed(saveData, regionNum)) return { success: false, reason: 'Already claimed' };
    if (!saveData.missions.regionRewardsClaimed) saveData.missions.regionRewardsClaimed = [];
    saveData.missions.regionRewardsClaimed.push(regionNum);
    var region = REGIONS[regionNum];
    var reward = region.reward;
    if (reward.gold > 0) saveData.player.gold += reward.gold;
    if (reward.freeMultiRoll) {
        if (!saveData.player.freeMultiRolls) saveData.player.freeMultiRolls = 0;
        saveData.player.freeMultiRolls += reward.freeMultiRoll;
    }
    return { success: true, reward: reward, regionName: region.name };
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
function calculateMissionRewards(saveData, mission, starRating) {
    var multiplier = 1.0;
    if (starRating >= 3) multiplier = 2.0;
    else if (starRating >= 2) multiplier = 1.5;
    var goldMult = getGoldMultiplier(saveData);
    var xpMult = getXPMultiplier(saveData);
    var gold = Math.floor(mission.rewards.gold * multiplier * goldMult);
    var xp = Math.floor(mission.rewards.xp * multiplier * xpMult);
    var copyCount = 1 + Math.floor(Math.random() * 3);
    var unitCopies = [];
    for (var i = 0; i < copyCount; i++) { unitCopies.push(rollOneUnit(saveData.player.level)); }
    var itemDrops = [];
    var missionLevel = STAGES.indexOf(mission);
    if (missionLevel < 0) missionLevel = saveData.player.level;
    itemDrops.push(rollItemDrop(missionLevel, starRating));
    if (starRating >= 3) itemDrops.push(rollItemDrop(missionLevel, starRating));
    var elementBias = null;
    if (mission.waves && mission.waves.length > 0) {
        for (var wi = 0; wi < mission.waves.length; wi++) {
            if (mission.waves[wi].elementBias) { elementBias = mission.waves[wi].elementBias; break; }
        }
    }
    var essenceDrops = rollEssenceDrops(missionLevel, starRating, elementBias);
    var milestoneItem = null;
    if (mission.id && MISSION_MILESTONES[mission.id] && starRating >= 3) {
        if (!saveData.missions.milestonesClaimed || saveData.missions.milestonesClaimed.indexOf(mission.id) === -1) {
            var milestone = MISSION_MILESTONES[mission.id];
            milestoneItem = { id: generateItemId(), type: 'ability', key: milestone.abilityItemKey, rarity: 'rare', equipped: null };
        }
    }
    return { gold: gold, xp: xp, starRating: starRating, unitCopies: unitCopies, itemDrops: itemDrops, essenceDrops: essenceDrops, milestoneItem: milestoneItem };
}

function applyMissionRewards(saveData, rewards) {
    earnGold(saveData, rewards.gold);
    var leveled = addPlayerXP(saveData, rewards.xp);
    if (rewards.unitCopies) {
        for (var i = 0; i < rewards.unitCopies.length; i++) addUnitToCollection(saveData, rewards.unitCopies[i]);
    }
    if (rewards.itemDrops) {
        rewards.itemsBenchFull = false;
        for (var j = 0; j < rewards.itemDrops.length; j++) {
            var added = addItemToBench(saveData, rewards.itemDrops[j]);
            if (!added) rewards.itemsBenchFull = true;
        }
    }
    if (rewards.essenceDrops && rewards.essenceDrops.length > 0) {
        if (!saveData.items.essences) saveData.items.essences = { fire: 0, water: 0, earth: 0, wind: 0 };
        for (var ej = 0; ej < rewards.essenceDrops.length; ej++) saveData.items.essences[rewards.essenceDrops[ej]]++;
    }
    if (rewards.milestoneItem) {
        var milestoneAdded = addItemToBench(saveData, rewards.milestoneItem);
        if (!milestoneAdded) rewards.itemsBenchFull = true;
        if (!saveData.missions.milestonesClaimed) saveData.missions.milestonesClaimed = [];
        if (milestoneAdded) saveData.missions.milestonesClaimed.push(rewards.milestoneItem.key === 'zhonyas_hourglass' ? 'story_10' : 'story_13');
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
    autoSave(saveData);
}
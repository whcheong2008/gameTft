// =============================================================================
// missions.js — Mission definitions, wave generation, rewards
// =============================================================================

// ---- Story Mission Definitions ----

var STORY_MISSIONS = [
    {
        id: 'story_1',
        name: 'Forest Outskirts',
        description: 'Clear the creatures lurking at the forest edge.',
        requiredLevel: 1,
        waves: [
            { budget: 3, maxCost: 1, count: 2 }
        ],
        rewards: { gold: 30, xp: 50 }
    },
    {
        id: 'story_2',
        name: 'Goblin Camp',
        description: 'A small goblin camp blocks the path forward.',
        requiredLevel: 2,
        waves: [
            { budget: 5, maxCost: 1, count: 3 },
            { budget: 5, maxCost: 1, count: 3 }
        ],
        rewards: { gold: 50, xp: 80 }
    },
    {
        id: 'story_3',
        name: 'River Crossing',
        description: 'Water elementals guard the ancient bridge.',
        requiredLevel: 3,
        waves: [
            { budget: 6, maxCost: 2, count: 3 },
            { budget: 8, maxCost: 2, count: 4 }
        ],
        rewards: { gold: 70, xp: 120 }
    },
    {
        id: 'story_4',
        name: 'Abandoned Mine',
        description: 'Something stirs in the depths of the old mine.',
        requiredLevel: 4,
        waves: [
            { budget: 8, maxCost: 2, count: 4 },
            { budget: 10, maxCost: 2, count: 4 },
            { budget: 12, maxCost: 3, count: 5 }
        ],
        rewards: { gold: 100, xp: 180 }
    },
    {
        id: 'story_5',
        name: 'Dragon\'s Pass',
        description: 'The mountain pass is guarded by fierce elemental beasts.',
        requiredLevel: 6,
        waves: [
            { budget: 10, maxCost: 3, count: 4 },
            { budget: 12, maxCost: 3, count: 5 },
            { budget: 15, maxCost: 3, count: 5 }
        ],
        rewards: { gold: 140, xp: 250 }
    },
    {
        id: 'story_6',
        name: 'Elemental Nexus',
        description: 'All four elemental forces converge at this ancient site.',
        requiredLevel: 8,
        waves: [
            { budget: 12, maxCost: 3, count: 5 },
            { budget: 15, maxCost: 4, count: 5 },
            { budget: 18, maxCost: 4, count: 6 }
        ],
        rewards: { gold: 180, xp: 350 }
    },
    {
        id: 'story_7',
        name: 'The Veil Guardian',
        description: 'A powerful guardian blocks the path forward.',
        requiredLevel: 10,
        waves: [],
        boss: 'veil_guardian',
        rewards: { gold: 250, xp: 500 }
    },
    // Mission 8 — First mission with enemy synergies
    {
        id: 'story_8',
        name: 'The Ember Fortress',
        description: 'A stronghold defended by fire-aligned warriors working in concert.',
        requiredLevel: 11,
        waves: [
            { budget: 18, maxCost: 4, count: 5, elementBias: 'fire', synergyBias: 'duelist' },
            { budget: 22, maxCost: 4, count: 6, elementBias: 'fire', synergyBias: 'duelist' },
            { budget: 25, maxCost: 4, count: 6, elementBias: 'fire', synergyBias: 'guardian' }
        ],
        rewards: { gold: 280, xp: 600 }
    },
    // Mission 9
    {
        id: 'story_9',
        name: 'Tidal Depths',
        description: 'Aquatic mystics channel slowing auras from the ocean floor.',
        requiredLevel: 12,
        waves: [
            { budget: 20, maxCost: 4, count: 5, elementBias: 'water', synergyBias: 'mystic' },
            { budget: 24, maxCost: 4, count: 6, elementBias: 'water', synergyBias: 'sage' },
            { budget: 28, maxCost: 5, count: 6, elementBias: 'water' }
        ],
        rewards: { gold: 320, xp: 700 }
    },
    // Mission 10
    {
        id: 'story_10',
        name: 'The Living Mountain',
        description: 'Earth golems and guardians form an impenetrable wall.',
        requiredLevel: 13,
        waves: [
            { budget: 22, maxCost: 4, count: 5, elementBias: 'earth', synergyBias: 'guardian' },
            { budget: 26, maxCost: 4, count: 6, elementBias: 'earth', synergyBias: 'vanguard' },
            { budget: 30, maxCost: 5, count: 7, elementBias: 'earth', synergyBias: 'guardian' }
        ],
        rewards: { gold: 360, xp: 800 }
    },
    // Mission 11
    {
        id: 'story_11',
        name: 'Storm\'s Eye',
        description: 'Wind assassins and snipers strike from every direction.',
        requiredLevel: 14,
        waves: [
            { budget: 24, maxCost: 4, count: 6, elementBias: 'wind', synergyBias: 'predator' },
            { budget: 28, maxCost: 5, count: 6, elementBias: 'wind', synergyBias: 'duelist' },
            { budget: 32, maxCost: 5, count: 7, elementBias: 'wind', synergyBias: 'predator' }
        ],
        rewards: { gold: 400, xp: 900 }
    },
    // Mission 12 — Mixed elements, enemies start having synergies active
    {
        id: 'story_12',
        name: 'The Convergence',
        description: 'Forces from all four elements collide. Enemy squads fight with coordinated synergies.',
        requiredLevel: 16,
        waves: [
            { budget: 28, maxCost: 5, count: 6, synergyBias: 'duelist', enemySynergies: true },
            { budget: 32, maxCost: 5, count: 7, synergyBias: 'guardian', enemySynergies: true },
            { budget: 36, maxCost: 5, count: 7, enemySynergies: true },
            { budget: 40, maxCost: 5, count: 7, enemySynergies: true }
        ],
        rewards: { gold: 480, xp: 1100 }
    },
    // Mission 13 — Enemies can have evolved forms
    {
        id: 'story_13',
        name: 'Ascended Warfront',
        description: 'The enemy has discovered evolution. Their champions have transcended mortal limits.',
        requiredLevel: 18,
        waves: [
            { budget: 32, maxCost: 5, count: 6, enemySynergies: true, enemyEvolutions: true },
            { budget: 36, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
            { budget: 40, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
            { budget: 45, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true }
        ],
        rewards: { gold: 560, xp: 1300 }
    },
    // Mission 14 — Final boss
    {
        id: 'story_14',
        name: 'The Void Sovereign',
        description: 'The source of the corruption. End this.',
        requiredLevel: 20,
        waves: [],
        boss: 'void_sovereign',
        rewards: { gold: 1000, xp: 1500 }
    }
];

// ---- Boss Data ----

var BOSS_DATA = {

    veil_guardian: {
        name: 'Veil Guardian',
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
                        name: 'Veil Slam',
                        cooldown: 10,
                        telegraphTime: 2.0,
                        targetType: 'highest_hp',
                        aoeRadius: 2,
                        damage: 1.5,
                        statusEffect: null,
                        desc: 'Slams the area around highest-HP unit'
                    },
                    {
                        name: 'Energy Pulse',
                        cooldown: 20,
                        telegraphTime: 0,
                        targetType: 'all_players',
                        aoeRadius: 0,
                        damage: 0,
                        flatDamage: 50,
                        statusEffect: null,
                        desc: 'All player units take 50 flat damage'
                    }
                ]
            }
        ],
        minionSpawns: [],
        loot: { gold: 250, xp: 500, firstClearGold: 500 }
    },

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
                    {
                        name: 'Flame Breath',
                        cooldown: 8,
                        telegraphTime: 1.5,
                        targetType: 'cone',
                        coneColumns: [2, 3, 4, 5],
                        coneRows: 2,
                        damage: 0.8,
                        statusEffect: { type: 'burn', duration: 3, value: 20 },
                        desc: 'Fire cone covering columns 2-5'
                    },
                    {
                        name: 'Tail Swipe',
                        cooldown: 12,
                        telegraphTime: 1.5,
                        targetType: 'melee_range',
                        aoeRadius: 1,
                        damage: 1.0,
                        knockback: 1,
                        statusEffect: null,
                        desc: 'Hits all melee units, knockback 1 cell'
                    },
                    {
                        name: 'Ember Rain',
                        cooldown: 25,
                        telegraphTime: 2.0,
                        targetType: 'random_cells',
                        cellCount: 3,
                        damage: 0.6,
                        statusEffect: { type: 'burn', duration: 5, value: 15 },
                        desc: '3 random cells marked then explode'
                    }
                ]
            },
            {
                hpThreshold: 0.5,
                abilities: [
                    {
                        name: 'Flame Breath',
                        cooldown: 6,
                        telegraphTime: 1.5,
                        targetType: 'cone',
                        coneColumns: [1, 2, 3, 4, 5, 6],
                        coneRows: 2,
                        damage: 0.8,
                        statusEffect: { type: 'burn', duration: 3, value: 25 },
                        desc: 'Wider fire cone, columns 1-6'
                    },
                    {
                        name: 'Tail Swipe',
                        cooldown: 12,
                        telegraphTime: 1.5,
                        targetType: 'melee_range',
                        aoeRadius: 1,
                        damage: 1.0,
                        knockback: 1,
                        statusEffect: null,
                        desc: 'Same tail swipe'
                    },
                    {
                        name: 'Inferno',
                        cooldown: 15,
                        telegraphTime: 1.0,
                        targetType: 'all_players',
                        damage: 0.6,
                        statusEffect: { type: 'healReduction', duration: 5, value: 0.5 },
                        desc: 'All units take fire damage + grievous wounds'
                    }
                ]
            }
        ],
        minionSpawns: [
            {
                phase: 1,
                cooldown: 25,
                maxAlive: 4,
                units: [
                    { key: 'flame_warrior', stars: 2, count: 2, name: 'Fire Drake' }
                ]
            }
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
                    {
                        name: 'Tidal Wave',
                        cooldown: 10,
                        telegraphTime: 2.0,
                        targetType: 'rows',
                        targetRows: [4, 5],
                        damage: 0.7,
                        statusEffect: { type: 'slow', duration: 2, value: 0.3 },
                        desc: 'Wave hits rows 4-5'
                    },
                    {
                        name: 'Whirlpool',
                        cooldown: 15,
                        telegraphTime: 2.0,
                        targetType: 'aoe_pull',
                        aoeSize: 2,
                        damage: 0.9,
                        pullStrength: 1,
                        desc: '2x2 area, pulls units toward center'
                    }
                ]
            },
            {
                hpThreshold: 0.5,
                abilities: [
                    {
                        name: 'Tsunami',
                        cooldown: 8,
                        telegraphTime: 2.0,
                        targetType: 'rows',
                        targetRows: [4, 5, 6],
                        damage: 0.8,
                        statusEffect: { type: 'slow', duration: 3, value: 0.4 },
                        desc: 'Wider wave hits rows 4-6'
                    },
                    {
                        name: 'Whirlpool',
                        cooldown: 15,
                        telegraphTime: 2.0,
                        targetType: 'aoe_pull',
                        aoeSize: 3,
                        damage: 0.9,
                        pullStrength: 1,
                        desc: 'Larger whirlpool 3x3'
                    }
                ]
            }
        ],
        minionSpawns: [
            {
                phase: 1,
                cooldown: 20,
                maxAlive: 4,
                units: [
                    { key: 'tide_hunter', stars: 2, count: 2, name: 'Kraken Arm' }
                ]
            }
        ],
        loot: { gold: 500, xp: 800, firstClearGold: 500 }
    },

    // --- STUBS: Data defined but boss AI logic not fully implemented ---

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
                    { name: 'Wind Wall', cooldown: 15, telegraphTime: 1.0, targetType: 'column_wall', wallDuration: 5, desc: 'Blocks ranged attacks across column' }, // TODO: Wind Wall blocking not implemented
                    { name: 'Feather Storm', cooldown: 20, telegraphTime: 1.5, targetType: 'random_cells', cellCount: 5, damage: 0.5, desc: '5 random cells take damage' }
                ]
            },
            {
                hpThreshold: 0.5,
                rebirth: true,
                abilities: [
                    { name: 'Gale Strike', cooldown: 5, telegraphTime: 0.5, targetType: 'highest_atk_x2', damage: 1.3, desc: 'Hits 2 targets' },
                    { name: 'Cyclone', cooldown: 15, telegraphTime: 1.5, targetType: 'aoe_pull', aoeSize: 3, damage: 0.3, pullStrength: 1, desc: '3x3 pull zone (simplified to one-time)' }, // TODO: persistent zones not implemented
                    { name: 'Feather Storm', cooldown: 20, telegraphTime: 1.5, targetType: 'random_cells', cellCount: 5, damage: 0.5, desc: 'Same' }
                ]
            }
        ],
        minionSpawns: [
            { phase: 1, cooldown: 20, maxAlive: 3, units: [{ key: 'zephyr_scout', stars: 1, count: 3, name: 'Wind Wisp' }] }
        ],
        loot: { gold: 500, xp: 800, firstClearGold: 500 }
    },

    void_sovereign: {
        name: 'The Void Sovereign',
        emoji: '👿✨',
        element: null,
        size: [2, 2],
        baseHp: 30000,
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
                abilities: [
                    { name: 'Void Tendrils', cooldown: 8, telegraphTime: 1.0, targetType: 'random_units', targetCount: 3, damage: 0.5, statusEffect: { type: 'root', duration: 1.5, value: 0 }, desc: '3 random units rooted + damaged' },
                    { name: 'Void Barrier', cooldown: 20, telegraphTime: 0, targetType: 'self_shield', shieldPct: 0.15, desc: 'Regenerating shield' }
                ]
            },
            {
                hpThreshold: 0.5,
                abilities: [
                    { name: 'Void Beam', cooldown: 10, telegraphTime: 2.0, targetType: 'row_most_units', damage: 1.0, desc: 'Line across row with most player units' },
                    { name: 'Void Barrier', cooldown: 20, telegraphTime: 0, targetType: 'self_shield', shieldPct: 0.15, desc: 'Same shield' },
                    { name: 'Annihilation', cooldown: 15, telegraphTime: 1.5, targetType: 'all_players', damage: 0.7, desc: 'Unavoidable team-wide damage' }
                ]
            }
        ],
        minionSpawns: [
            { phase: 1, cooldown: 30, maxAlive: 4, units: [{ key: 'hydro_mage', stars: 2, count: 2, name: 'Void Spawn' }, { key: 'flame_warrior', stars: 2, count: 2, name: 'Void Spawn' }] }
        ],
        loot: { gold: 1000, xp: 1500, firstClearGold: 1000 }
    }
};

// ---- Story/Grind/Boss Enemy Generation (Prompt 20) ----

function getRandomUnitByElementAndTier(element, tierRange) {
    var candidates = SHOP_POOL_KEYS.filter(function(key) {
        var unit = UNIT_TEMPLATES[key];
        if (!unit) return false;
        return unit.element === element && tierRange.indexOf(unit.cost) !== -1;
    });

    if (candidates.length === 0) {
        // Fallback to any element in tier range
        candidates = SHOP_POOL_KEYS.filter(function(key) {
            return UNIT_TEMPLATES[key] && tierRange.indexOf(UNIT_TEMPLATES[key].cost) !== -1;
        });
    }
    if (candidates.length === 0) return SHOP_POOL_KEYS[0];
    return candidates[Math.floor(Math.random() * candidates.length)];
}

function generateStoryEnemyTeam(missionKey) {
    var mission = null;
    for (var i = 0; i < STORY_MISSIONS.length; i++) {
        if (STORY_MISSIONS[i].id === missionKey) { mission = STORY_MISSIONS[i]; break; }
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

    // Determine element focus from first wave bias if any
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

    // Add 2 support units from same element
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

    // Check element synergies
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

    // Check archetype synergies
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

// Story mission rewards that scale with difficulty
function getStoryReward(difficulty) {
    var gold = 100 + (difficulty * 25);
    var xp = 50 + (difficulty * 15);
    return { gold: gold, xp: xp };
}

// Milestone: every 5th mission grants a cost 3-4 unit
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

    // Element bias for flavor (random per grind mission)
    var elements = Object.keys(ELEMENTS);
    var grindElement = elements[Math.floor(Math.random() * elements.length)];

    var waves = [];
    for (var w = 0; w < waveCount; w++) {
        var budget = Math.floor(3 + difficulty * 1.5 + w * 2);
        var count = Math.min(7, 2 + Math.floor(difficulty / 3) + w);
        var waveObj = { budget: budget, maxCost: maxCost, count: count };

        // At level 10+: 50% chance of element bias per wave
        if (playerLevel >= 10 && Math.random() < 0.5) {
            waveObj.elementBias = grindElement;
        }

        // At level 14+: enemy synergies on later waves
        if (playerLevel >= 14 && w >= waveCount - 2) {
            waveObj.enemySynergies = true;
        }

        // At level 18+: enemy evolutions on last wave
        if (playerLevel >= 18 && w === waveCount - 1) {
            waveObj.enemyEvolutions = true;
        }

        waves.push(waveObj);
    }

    var baseGold = Math.floor(20 + difficulty * 8);
    var baseXP = Math.floor(30 + difficulty * 12);

    // Name reflects element if biased
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

// ---- Wave Enemy Generation ----
// Generates an array of enemy unit instances from a wave config

function generateMissionWave(waveConfig) {
    var enemies = [];
    var remaining = waveConfig.budget;
    var targetCount = waveConfig.count;
    var maxCost = waveConfig.maxCost;

    // Build pool — apply element and synergy biases
    var pool = [];
    var biasedPool = [];

    for (var i = 0; i < SHOP_POOL_KEYS.length; i++) {
        var key = SHOP_POOL_KEYS[i];
        var tmpl = UNIT_TEMPLATES[key];
        if (!tmpl || tmpl.cost > maxCost) continue;
        pool.push(key);

        // Check if unit matches biases
        var matchesElem = !waveConfig.elementBias || tmpl.element === waveConfig.elementBias;
        var matchesSyn = !waveConfig.synergyBias || tmpl.archetype === waveConfig.synergyBias;

        if (matchesElem && matchesSyn) {
            biasedPool.push(key);
            biasedPool.push(key); // Double weight for matching both
        } else if (matchesElem || matchesSyn) {
            biasedPool.push(key);
        }
    }

    if (pool.length === 0) return enemies;

    // Use biased pool if available, else fall back to full pool
    var usePool = biasedPool.length > 0 ? biasedPool : pool;

    // Fill enemy slots
    for (var e = 0; e < targetCount && remaining > 0; e++) {
        var affordable = [];
        for (var j = 0; j < usePool.length; j++) {
            if (UNIT_TEMPLATES[usePool[j]].cost <= remaining) {
                affordable.push(usePool[j]);
            }
        }
        // Fallback to full pool if biased pool has no affordable options
        if (affordable.length === 0) {
            for (var jj = 0; jj < pool.length; jj++) {
                if (UNIT_TEMPLATES[pool[jj]].cost <= remaining) {
                    affordable.push(pool[jj]);
                }
            }
        }
        if (affordable.length === 0) break;

        var pick = affordable[Math.floor(Math.random() * affordable.length)];
        remaining -= UNIT_TEMPLATES[pick].cost;

        var unit = createUnit(pick, 1);
        if (unit) {
            unit.isEnemy = true;
            // Later missions: boost star level slightly
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

// ---- Mission Flow ----

var activeMission = null;
var currentWaveIndex = 0;

function startMission(saveData, mission) {
    activeMission = mission;
    currentWaveIndex = 0;
    return true;
}

function getCurrentWave() {
    if (!activeMission) return null;
    if (currentWaveIndex >= activeMission.waves.length) return null;
    return activeMission.waves[currentWaveIndex];
}

function advanceWave() {
    currentWaveIndex++;
    return currentWaveIndex < activeMission.waves.length;
}

function getMissionProgress() {
    if (!activeMission) return null;
    return {
        currentWave: currentWaveIndex + 1,
        totalWaves: activeMission.waves.length,
        missionName: activeMission.name
    };
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

    var baseChance = 0.10;
    var doubleChance = 0.00;
    if (missionLevel >= 14) { baseChance = 0.30; doubleChance = 0.10; }
    else if (missionLevel >= 11) { baseChance = 0.20; doubleChance = 0.05; }

    if (starRating >= 3) {
        baseChance += 0.15;
        doubleChance += 0.05;
    }

    var count = 0;
    if (Math.random() < doubleChance) count = 2;
    else if (Math.random() < baseChance) count = 1;

    var elements = ['fire', 'water', 'earth', 'wind', 'lightning', 'force'];
    for (var i = 0; i < count; i++) {
        var elem;
        if (elementBias && Math.random() < 0.7) {
            elem = elementBias;
        } else {
            elem = elements[Math.floor(Math.random() * elements.length)];
        }
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

    // Roll 1-3 random unit copies using gacha tier weights
    var copyCount = 1 + Math.floor(Math.random() * 3); // 1-3 copies
    var unitCopies = [];
    for (var i = 0; i < copyCount; i++) {
        var key = rollOneUnit(saveData.player.level);
        unitCopies.push(key);
    }

    // Roll item drops: 1 guaranteed + 1 bonus for 3 stars
    var itemDrops = [];
    var missionLevel = STORY_MISSIONS.indexOf(mission);
    if (missionLevel < 0) missionLevel = saveData.player.level; // grind missions use player level
    itemDrops.push(rollItemDrop(missionLevel, starRating));
    if (starRating >= 3) {
        itemDrops.push(rollItemDrop(missionLevel, starRating));
    }

    // Roll essence drops
    var elementBias = null;
    if (mission.waves && mission.waves.length > 0) {
        for (var wi = 0; wi < mission.waves.length; wi++) {
            if (mission.waves[wi].elementBias) {
                elementBias = mission.waves[wi].elementBias;
                break;
            }
        }
    }
    var essenceDrops = rollEssenceDrops(missionLevel, starRating, elementBias);

    // Check milestone rewards
    var milestoneItem = null;
    if (mission.id && MISSION_MILESTONES[mission.id] && starRating >= 3) {
        if (!saveData.missions.milestonesClaimed || saveData.missions.milestonesClaimed.indexOf(mission.id) === -1) {
            var milestone = MISSION_MILESTONES[mission.id];
            milestoneItem = {
                id: generateItemId(),
                type: 'ability',
                key: milestone.abilityItemKey,
                rarity: 'rare',
                equipped: null
            };
        }
    }

    return { gold: gold, xp: xp, starRating: starRating, unitCopies: unitCopies, itemDrops: itemDrops, essenceDrops: essenceDrops, milestoneItem: milestoneItem };
}

function applyMissionRewards(saveData, rewards) {
    earnGold(saveData, rewards.gold);
    var leveled = addPlayerXP(saveData, rewards.xp);

    // Add unit copies to collection
    if (rewards.unitCopies) {
        for (var i = 0; i < rewards.unitCopies.length; i++) {
            addUnitToCollection(saveData, rewards.unitCopies[i]);
        }
    }

    // Add item drops to bench
    if (rewards.itemDrops) {
        rewards.itemsBenchFull = false;
        for (var j = 0; j < rewards.itemDrops.length; j++) {
            var added = addItemToBench(saveData, rewards.itemDrops[j]);
            if (!added) rewards.itemsBenchFull = true;
        }
    }

    // Add essence drops
    if (rewards.essenceDrops && rewards.essenceDrops.length > 0) {
        if (!saveData.items.essences) saveData.items.essences = { fire: 0, water: 0, earth: 0, wind: 0 };
        for (var ej = 0; ej < rewards.essenceDrops.length; ej++) {
            saveData.items.essences[rewards.essenceDrops[ej]]++;
        }
    }

    // Add milestone item
    if (rewards.milestoneItem) {
        var milestoneAdded = addItemToBench(saveData, rewards.milestoneItem);
        if (!milestoneAdded) rewards.itemsBenchFull = true;
        if (!saveData.missions.milestonesClaimed) saveData.missions.milestonesClaimed = [];
        // Mark milestone as claimed even if bench is full (they got it, just overflow)
        // Actually only claim if added successfully
        if (milestoneAdded) {
            saveData.missions.milestonesClaimed.push(rewards.milestoneItem.key === 'zhonyas_hourglass' ? 'story_10' : 'story_13');
        }
    }

    saveData.stats.totalMissionsCompleted++;
    autoSave(saveData);
    return leveled;
}

// ---- Mission Availability ----

function getAvailableStoryMissions(saveData) {
    var available = [];
    for (var i = 0; i < STORY_MISSIONS.length; i++) {
        var m = STORY_MISSIONS[i];
        if (saveData.player.level >= m.requiredLevel) {
            var completed = saveData.missions.storyProgress > i;
            var bestStars = saveData.missions.storyStars[m.id] || 0;
            available.push({
                mission: m,
                index: i,
                completed: completed,
                bestStars: bestStars,
                isNext: i === saveData.missions.storyProgress
            });
        }
    }
    return available;
}

function completeStoryMission(saveData, missionIndex, starRating) {
    var mission = STORY_MISSIONS[missionIndex];
    if (!mission) return;

    // Update story progress
    if (missionIndex >= saveData.missions.storyProgress) {
        saveData.missions.storyProgress = missionIndex + 1;
    }

    // Update best star rating
    var prev = saveData.missions.storyStars[mission.id] || 0;
    if (starRating > prev) {
        saveData.missions.storyStars[mission.id] = starRating;
    }

    autoSave(saveData);
}

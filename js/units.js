// =============================================================================
// units.js — Unit templates, constants, element/archetype data, creation/upgrade/evolution
// =============================================================================

var ELEMENTS = {
    fire:      { name: 'Fire',      emoji: '\u{1F525}', color: '#ff4444', strong: 'wind',  weak: 'water' },
    water:     { name: 'Water',     emoji: '\u{1F4A7}', color: '#4488ff', strong: 'fire',  weak: 'earth' },
    earth:     { name: 'Earth',     emoji: '\u{1F33F}', color: '#44aa44', strong: 'water', weak: 'wind'  },
    wind:      { name: 'Wind',      emoji: '\u{1F4A8}', color: '#aa44ff', strong: 'earth', weak: 'fire'  },
    lightning: { name: 'Lightning', emoji: '\u{26A1}', color: '#ffcc00', strong: 'water', weak: 'earth' },
    force:     { name: 'Force',     emoji: '\u{1F4AA}', color: '#cc8844', strong: null,    weak: null   }
};

var ELEMENT_MATCHUPS = {
    fire:      { strong: ['wind'],           weak: ['water'] },
    water:     { strong: ['fire'],           weak: ['earth', 'lightning'] },
    earth:     { strong: ['water', 'lightning'], weak: ['wind'] },
    wind:      { strong: ['earth'],          weak: ['fire'] },
    lightning: { strong: ['water'],          weak: ['earth'] },
    force:     { strong: [],                 weak: [] }
};

var ELEMENT_SYNERGIES = {
    fire: {
        name: 'Fire', emoji: '\u{1F525}', color: '#ff4444',
        thresholds: [2, 4, 7, 10],
        bonuses: [
            { desc: 'Attacks apply Burn (10 DPS, 3s duration)', burnDps: 10, burnDuration: 3 },
            { desc: 'Burn 20 DPS. On kill, enemy explodes for 15% max HP to adjacent', burnDps: 20, killExplosionPct: 0.15 },
            { desc: 'Burn 35 DPS, 5s duration. Fire abilities apply Burn. Fire units +20% ATK. Kill explosions chain', burnDps: 35, burnDuration: 5, abilityBurn: true, fireAtkBonus: 0.20, chainExplosions: true },
            { desc: 'Conflagration: Enemies start Burning (3% max HP/s). Fire abilities 50% mana cost. Deaths explode 200 AoE. Fire units immune to Burn', isPrismatic: true, combatStartBurn: 0.03, abilityCostReduce: 0.50, deathExplosionDamage: 200, fireImmuneBurn: true }
        ]
    },
    water: {
        name: 'Water', emoji: '\u{1F4A7}', color: '#4488ff',
        thresholds: [2, 4, 7, 10],
        bonuses: [
            { desc: 'Enemy attack speed -15%', enemyAtkSpdReduction: 0.15 },
            { desc: 'Enemy attack speed -25%. Allies heal 1.5% max HP/s', enemyAtkSpdReduction: 0.25, allyRegenPct: 0.015 },
            { desc: 'Enemy attack speed -40%. Heal 3% max HP/s. Enemies below 40% HP deal 20% less damage', enemyAtkSpdReduction: 0.40, allyRegenPct: 0.03, weakEnemyDmgReduce: 0.20, weakEnemyThreshold: 0.40 },
            { desc: 'Absolute Zero: Enemies permanently slowed 35%. Water abilities heal 20% of damage dealt. Enemies below 25% HP Frozen 2s (once)', isPrismatic: true, permanentSlow: 0.35, abilityHealConvert: 0.20, frozenThreshold: 0.25, frozenDuration: 2 }
        ]
    },
    earth: {
        name: 'Earth', emoji: '\u{1F33F}', color: '#44aa44',
        thresholds: [2, 4, 7, 10],
        bonuses: [
            { desc: 'Allies start with shield: 15% max HP', shieldPct: 0.15 },
            { desc: 'Shield 25% max HP. +8% DR', shieldPct: 0.25, damageReduction: 0.08 },
            { desc: 'Shield 40% max HP. +15% DR. Shields regen 3%/sec when not taking damage', shieldPct: 0.40, damageReduction: 0.15, shieldRegenPct: 0.03, shieldRegenOnlyWhenUnhit: true },
            { desc: 'Tectonic Fortress: Shield 60% max HP. +25% DR. Shields regen 5%/sec always. Every 8s random enemy Rooted 3s. Earth units can\'t be crit', isPrismatic: true, shieldPct: 0.60, damageReduction: 0.25, shieldRegenPct: 0.05, rootCooldown: 8, rootDuration: 3, earthNoCrit: true }
        ]
    },
    wind: {
        name: 'Wind', emoji: '\u{1F4A8}', color: '#aa44ff',
        thresholds: [2, 4, 7, 10],
        bonuses: [
            { desc: 'Allies +15% attack speed', allyAtkSpdBoost: 0.15 },
            { desc: '+25% attack speed. +12% dodge', allyAtkSpdBoost: 0.25, dodgeChance: 0.12 },
            { desc: '+40% attack speed. +25% dodge. Dodged attacks grant 10 mana and deal 40% ATK back', allyAtkSpdBoost: 0.40, dodgeChance: 0.25, dodgeCounterMana: 10, dodgeCounterDmgPct: 0.40 },
            { desc: 'Eye of the Storm: +60% attack speed. +40% dodge. Abilities 40% chance to cast twice. Dodged attacks grant 15 mana and 80% ATK back', isPrismatic: true, allyAtkSpdBoost: 0.60, dodgeChance: 0.40, abilityDoubleChance: 0.40, dodgeCounterMana: 15, dodgeCounterDmgPct: 0.80 }
        ]
    },
    lightning: {
        name: 'Lightning', emoji: '\u{26A1}', color: '#ffcc00',
        thresholds: [2, 4, 7, 10],
        bonuses: [
            { desc: '+10% crit chance. Crits chain 50 damage to 1 adjacent', critChance: 0.10, chainCount: 1, chainDamage: 50 },
            { desc: '+18% crit chance. +15% crit damage. Chains hit 2 adjacent', critChance: 0.18, critDamageBonus: 0.15, chainCount: 2 },
            { desc: '+30% crit chance. +30% crit damage. Chains hit 3. Abilities can crit (15%)', critChance: 0.30, critDamageBonus: 0.30, chainCount: 3, abilityCritChance: 0.15 },
            { desc: 'Superconductor: +50% crit chance. +60% crit damage. All abilities chain to 2 extra targets at 50%. On crit, 120 bonus lightning to all within 2 cells', isPrismatic: true, critChance: 0.50, critDamageBonus: 0.60, abilityChainCount: 2, abilityChainChance: 0.50, critAoeBonus: 120, critAoeRange: 2 }
        ]
    },
    force: {
        name: 'Force', emoji: '\u{1F4AA}', color: '#cc8844',
        thresholds: [2, 4, 7, 10],
        bonuses: [
            { desc: '+10% ATK, +10% HP', atkBonus: 0.10, hpBonus: 0.10 },
            { desc: '+18% ATK, +18% HP. Ignore 10% DR', atkBonus: 0.18, hpBonus: 0.18, drIgnore: 0.10 },
            { desc: '+30% ATK, +30% HP. Ignore 20% DR. Force units immune to first CC each combat', atkBonus: 0.30, hpBonus: 0.30, drIgnore: 0.20, forceFirstCcImmune: true },
            { desc: 'Unstoppable: +50% ATK, +50% HP. Ignore 40% DR. CC immunity first 6s. Every 5th combined Force hit stuns 1s. Force units revive once at 30% HP', isPrismatic: true, atkBonus: 0.50, hpBonus: 0.50, drIgnore: 0.40, ccImmune6s: true, stunCounter: 5, stunDuration: 1, reviveOnce: 0.30 }
        ]
    }
};

var ARCHETYPES = {
    guardian: {
        name: 'Guardian', emoji: '\u{1F6E1}\uFE0F',
        thresholds: [2, 4, 6],
        bonuses: [
            { desc: '+200 HP', hpBonus: 200 },
            { desc: '+500 HP +5% DR', hpBonus: 500, damageReduction: 0.05 },
            { desc: '+800 HP +12% DR', hpBonus: 800, damageReduction: 0.12 }
        ]
    },
    warden: {
        name: 'Warden', emoji: '\u{26D4}\uFE0F',
        thresholds: [2, 4],
        bonuses: [
            { desc: '+15% CC duration. Allies +10% tenacity', ccDurationBonus: 0.15, tenacity: 0.10 },
            { desc: '+30% CC duration. +25% tenacity. Wardens immune to first CC', ccDurationBonus: 0.30, tenacity: 0.25, wardenFirstCcImmune: true }
        ]
    },
    vanguard: {
        name: 'Vanguard', emoji: '\u{1F3F0}',
        thresholds: [2, 4],
        bonuses: [
            { desc: 'Front-row units +200 HP +15 ATK', frontHpBonus: 200, frontAtkBonus: 15 },
            { desc: '+500 HP +30 ATK +10% lifesteal', frontHpBonus: 500, frontAtkBonus: 30, lifestealPct: 0.10 }
        ]
    },
    duelist: {
        name: 'Duelist', emoji: '\u{2694}\uFE0F',
        thresholds: [2, 4, 6],
        bonuses: [
            { desc: '15% double-strike chance', doubleStrikeChance: 0.15 },
            { desc: '30% double-strike +10% lifesteal', doubleStrikeChance: 0.30, lifestealPct: 0.10 },
            { desc: '40% double-strike +15% lifesteal. Attacks can\'t miss', doubleStrikeChance: 0.40, lifestealPct: 0.15, cantMissAttacks: true }
        ]
    },
    predator: {
        name: 'Predator', emoji: '\u{1F43E}',
        thresholds: [2, 4],
        bonuses: [
            { desc: '+25% ATK speed +15% dmg to <50% HP enemies', atkSpdBoost: 0.25, executeDamageBonus: 0.15, executeThreshold: 0.50 },
            { desc: '+40% ATK speed +25% dmg <50% HP. Reset dash on kill', atkSpdBoost: 0.40, executeDamageBonus: 0.25, dashResetOnKill: true }
        ]
    },
    ranger: {
        name: 'Ranger', emoji: '\u{1F3F9}',
        thresholds: [2, 4, 6],
        bonuses: [
            { desc: '+1 range +10% dmg to furthest enemy', rangeBonus: 1, furthestDmgBonus: 0.10 },
            { desc: '+1 range +20% furthest +15% ATK speed', rangeBonus: 1, furthestDmgBonus: 0.20, atkSpdBoost: 0.15 },
            { desc: '+2 range +30% furthest. Attacks pierce (hit 1 extra)', rangeBonus: 2, furthestDmgBonus: 0.30, pierceCount: 1 }
        ]
    },
    sorcerer: {
        name: 'Sorcerer', emoji: '\u{1F9D9}',
        thresholds: [2, 4, 6],
        bonuses: [
            { desc: '+15% ability dmg +10 starting mana', abilityDmgBonus: 0.15, startingManaBonus: 10 },
            { desc: '+30% ability dmg +20 starting mana', abilityDmgBonus: 0.30, startingManaBonus: 20 },
            { desc: '+50% ability dmg +30 starting mana. Abilities refund 15% mana', abilityDmgBonus: 0.50, startingManaBonus: 30, abilityManaRefund: 0.15 }
        ]
    },
    mystic: {
        name: 'Mystic', emoji: '\u{1F52E}',
        thresholds: [2, 4],
        bonuses: [
            { desc: '+20% element dmg +15% element resist', elemDmgBonus: 0.20, elemResist: 0.15 },
            { desc: '+40% element dmg +30% resist. Enemies take 10% more element dmg', elemDmgBonus: 0.40, elemResist: 0.30, enemyElemDmgDebuff: 0.10 }
        ]
    },
    sage: {
        name: 'Sage', emoji: '\u{1F4D6}',
        thresholds: [2, 4, 6],
        bonuses: [
            { desc: '+30% healing', healBonus: 0.30 },
            { desc: '+60% healing. Allies regen 1% max HP/s', healBonus: 0.60, teamRegenPct: 0.01 },
            { desc: '+100% healing. 2% regen. Overheal converts to shield 50%', healBonus: 1.00, teamRegenPct: 0.02, overhealToShieldPct: 0.50 }
        ]
    }
};

var UNIT_TYPE_DESCRIPTIONS = {
    warrior: { name: 'Warrior', desc: 'Melee fighter. Moves toward the nearest enemy and attacks at close range. Solid all-around stats with decent HP and attack.' },
    tank: { name: 'Tank', desc: 'Frontline defender. Moves toward enemies slowly but absorbs enormous damage. Low attack speed but very high HP. Place in front row to shield your team.' },
    archer: { name: 'Archer', desc: 'Ranged attacker. Fires from a distance (range 3-5). Lower HP but fast attack speed and strong sustained damage. Keep in back rows behind tanks.' },
    mage: { name: 'Mage', desc: 'Ranged magical damage dealer. Attacks from range with moderate speed. Deals element-typed damage, making element matchups extra important. Fragile but powerful.' },
    assassin: { name: 'Assassin', desc: 'Fastest unit type. Dashes to the enemy backline to eliminate squishy targets like archers and healers. Very high move speed, fast attacks, but low HP.' },
    healer: { name: 'Healer', desc: 'Targets the lowest-HP ally instead of enemies. Heals rather than deals damage. Slow attack speed but essential for sustaining your team through multi-wave fights.' }
};

// =============================================================================
// UNIT DATA STRUCTURES (60 UNITS)
// =============================================================================

var UNIT_TEMPLATES = {
    // --- FIRE (10 units) ---
    flame_warrior:  { name: 'Flame Warrior',  cost: 1, type: 'warrior',  archetype: 'duelist',   element: 'fire', hp: 600,  attack: 50,  attackSpd: 0.85, range: 1, moveSpd: 1.9, maxMana: 65, emoji: '\u{2694}\uFE0F\u{1F525}', evolvedForm: 'fire_berserker' },
    ember_scout:    { name: 'Ember Scout',    cost: 1, type: 'assassin', archetype: 'predator',  element: 'fire', hp: 390,  attack: 46,  attackSpd: 0.5,  range: 1, moveSpd: 3.9, maxMana: 45, emoji: '\u{1F5E1}\uFE0F\u{1F525}', evolvedForm: 'flame_rogue' },
    cinder_archer:  { name: 'Cinder Archer',  cost: 1, type: 'archer',   archetype: 'ranger',    element: 'fire', hp: 360,  attack: 52,  attackSpd: 0.7,  range: 4, moveSpd: 2.0, maxMana: 55, emoji: '\u{1F3F9}\u{1F525}', evolvedForm: 'cinder_marksman' },
    fire_acolyte:   { name: 'Fire Acolyte',   cost: 1, type: 'healer',   archetype: 'sage',      element: 'fire', hp: 420,  attack: 28,  attackSpd: 1.1,  range: 2, moveSpd: 1.6, maxMana: 70, emoji: '\u{1F49A}\u{1F525}', evolvedForm: 'ember_saint' },
    magma_knight:   { name: 'Magma Knight',   cost: 2, type: 'tank',     archetype: 'guardian',  element: 'fire', hp: 880,  attack: 35,  attackSpd: 1.0,  range: 1, moveSpd: 1.5, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{1F525}', evolvedForm: 'volcano_titan' },
    blaze_lancer:   { name: 'Blaze Lancer',   cost: 2, type: 'warrior',  archetype: 'vanguard',  element: 'fire', hp: 720,  attack: 55,  attackSpd: 0.8,  range: 1, moveSpd: 2.0, maxMana: 60, emoji: '\u{2694}\uFE0F\u{1F525}', evolvedForm: 'inferno_lancer' },
    pyromancer:     { name: 'Pyromancer',     cost: 3, type: 'mage',     archetype: 'sorcerer',  element: 'fire', hp: 520,  attack: 75,  attackSpd: 0.9,  range: 3, moveSpd: 1.5, maxMana: 65, emoji: '\u{1F52E}\u{1F525}', evolvedForm: 'arcane_inferno' },
    inferno_fox:    { name: 'Inferno Fox',    cost: 3, type: 'assassin', archetype: 'mystic',    element: 'fire', hp: 480,  attack: 72,  attackSpd: 0.5,  range: 1, moveSpd: 3.8, maxMana: 50, emoji: '\u{1F5E1}\uFE0F\u{1F525}', evolvedForm: 'ninetail_blaze' },
    fire_dragon:    { name: 'Fire Dragon',    cost: 4, type: 'mage',     archetype: 'warden',    element: 'fire', hp: 1100, attack: 95,  attackSpd: 0.9,  range: 3, moveSpd: 1.5, maxMana: 80, emoji: '\u{1F52E}\u{1F525}', evolvedForm: 'elder_wyrm' },
    phoenix:        { name: 'Phoenix',        cost: 5, type: 'mage',     archetype: 'mystic',    element: 'fire', hp: 950,  attack: 110, attackSpd: 0.95, range: 3, moveSpd: 1.6, maxMana: 0,  emoji: '\u{1F52E}\u{1F525}', evolvedForm: 'eternal_phoenix' },

    // --- WATER (10 units) ---
    tide_hunter:    { name: 'Tide Hunter',    cost: 1, type: 'warrior',  archetype: 'vanguard',  element: 'water', hp: 640,  attack: 48,  attackSpd: 0.8,  range: 1, moveSpd: 1.8, maxMana: 60, emoji: '\u{2694}\uFE0F\u{1F4A7}', evolvedForm: 'tsunami_blade' },
    frost_archer:   { name: 'Frost Archer',   cost: 1, type: 'archer',   archetype: 'ranger',    element: 'water', hp: 360,  attack: 50,  attackSpd: 0.7,  range: 4, moveSpd: 1.95,maxMana: 50, emoji: '\u{1F3F9}\u{1F4A7}', evolvedForm: 'ice_sniper' },
    reef_stalker:   { name: 'Reef Stalker',   cost: 1, type: 'assassin', archetype: 'predator',  element: 'water', hp: 400,  attack: 44,  attackSpd: 0.5,  range: 1, moveSpd: 3.8, maxMana: 40, emoji: '\u{1F5E1}\uFE0F\u{1F4A7}', evolvedForm: 'tidal_phantom' },
    coral_priest:   { name: 'Coral Priest',   cost: 2, type: 'healer',   archetype: 'sage',      element: 'water', hp: 450,  attack: 30,  attackSpd: 1.1,  range: 2, moveSpd: 1.5, maxMana: 75, emoji: '\u{1F49A}\u{1F4A7}', evolvedForm: 'ocean_sage' },
    hydro_mage:     { name: 'Hydro Mage',     cost: 2, type: 'mage',     archetype: 'sorcerer',  element: 'water', hp: 400,  attack: 62,  attackSpd: 0.95, range: 3, moveSpd: 1.4, maxMana: 70, emoji: '\u{1F52E}\u{1F4A7}', evolvedForm: 'abyssal_mage' },
    shell_knight:   { name: 'Shell Knight',   cost: 2, type: 'tank',     archetype: 'guardian',  element: 'water', hp: 900,  attack: 32,  attackSpd: 1.0,  range: 1, moveSpd: 1.4, maxMana: 80, emoji: '\u{1F6E1}\uFE0F\u{1F4A7}', evolvedForm: 'armored_sentinel' },
    tidal_shaman:   { name: 'Tidal Shaman',   cost: 3, type: 'healer',   archetype: 'mystic',    element: 'water', hp: 480,  attack: 45,  attackSpd: 1.1,  range: 2.5, moveSpd: 1.6, maxMana: 80, emoji: '\u{1F49A}\u{1F4A7}', evolvedForm: 'stormtide_oracle' },
    riptide_blade:  { name: 'Riptide Blade',  cost: 3, type: 'warrior',  archetype: 'duelist',   element: 'water', hp: 620,  attack: 70,  attackSpd: 0.8,  range: 1, moveSpd: 1.8, maxMana: 65, emoji: '\u{2694}\uFE0F\u{1F4A7}', evolvedForm: 'tsunami_warlord' },
    kraken:         { name: 'Kraken',         cost: 4, type: 'mage',     archetype: 'warden',    element: 'water', hp: 920,  attack: 98,  attackSpd: 0.9,  range: 3, moveSpd: 1.3, maxMana: 85, emoji: '\u{1F52E}\u{1F4A7}', evolvedForm: 'abyssal_terror' },
    leviathan:      { name: 'Leviathan',      cost: 5, type: 'tank',     archetype: 'guardian',  element: 'water', hp: 1450, attack: 35,  attackSpd: 1.0,  range: 1, moveSpd: 1.2, maxMana: 0,  emoji: '\u{1F6E1}\uFE0F\u{1F4A7}', evolvedForm: 'primordial_leviathan' },

    // --- EARTH (10 units) ---
    stone_guard:    { name: 'Stone Guard',    cost: 1, type: 'tank',     archetype: 'guardian',  element: 'earth', hp: 750,  attack: 32,  attackSpd: 1.0,  range: 1, moveSpd: 1.4, maxMana: 80, emoji: '\u{1F6E1}\uFE0F\u{1F33F}', evolvedForm: 'mountain_lord' },
    bramble_knight: { name: 'Bramble Knight', cost: 1, type: 'warrior',  archetype: 'vanguard',  element: 'earth', hp: 640,  attack: 48,  attackSpd: 0.85, range: 1, moveSpd: 1.8, maxMana: 65, emoji: '\u{2694}\uFE0F\u{1F33F}', evolvedForm: 'ironwood_sentinel' },
    seedling_archer:{ name: 'Seedling Archer',cost: 1, type: 'archer',   archetype: 'ranger',    element: 'earth', hp: 360,  attack: 48,  attackSpd: 0.7,  range: 3, moveSpd: 2.0, maxMana: 55, emoji: '\u{1F3F9}\u{1F33F}', evolvedForm: 'thornwood_ranger' },
    earth_shaman:   { name: 'Earth Shaman',   cost: 2, type: 'healer',   archetype: 'sage',      element: 'earth', hp: 450,  attack: 32,  attackSpd: 1.1,  range: 2.5, moveSpd: 1.5, maxMana: 75, emoji: '\u{1F49A}\u{1F33F}', evolvedForm: 'gaia_priest' },
    crystal_mage:   { name: 'Crystal Mage',   cost: 2, type: 'mage',     archetype: 'guardian',  element: 'earth', hp: 500,  attack: 62,  attackSpd: 0.95, range: 3, moveSpd: 1.5, maxMana: 70, emoji: '\u{1F52E}\u{1F33F}', evolvedForm: 'geomancer' },
    mud_stalker:    { name: 'Mud Stalker',    cost: 2, type: 'assassin', archetype: 'predator',  element: 'earth', hp: 420,  attack: 48,  attackSpd: 0.5,  range: 1, moveSpd: 3.2, maxMana: 45, emoji: '\u{1F5E1}\uFE0F\u{1F33F}', evolvedForm: 'quake_reaper' },
    golem:          { name: 'Golem',          cost: 3, type: 'tank',     archetype: 'warden',    element: 'earth', hp: 1050, attack: 42,  attackSpd: 1.0,  range: 1, moveSpd: 1.2, maxMana: 90, emoji: '\u{1F6E1}\uFE0F\u{1F33F}', evolvedForm: 'iron_colossus' },
    terra_sage:     { name: 'Terra Sage',     cost: 3, type: 'mage',     archetype: 'sorcerer',  element: 'earth', hp: 440,  attack: 70,  attackSpd: 0.9,  range: 3, moveSpd: 1.5, maxMana: 75, emoji: '\u{1F52E}\u{1F33F}', evolvedForm: 'earthweaver' },
    ancient_treant: { name: 'Ancient Treant', cost: 4, type: 'warrior',  archetype: 'duelist',   element: 'earth', hp: 1200, attack: 70,  attackSpd: 0.9,  range: 1, moveSpd: 1.2, maxMana: 80, emoji: '\u{2694}\uFE0F\u{1F33F}', evolvedForm: 'world_sentinel' },
    world_tree:     { name: 'World Tree',     cost: 5, type: 'healer',   archetype: 'sage',      element: 'earth', hp: 1300, attack: 28,  attackSpd: 1.2,  range: 3, moveSpd: 1.3, maxMana: 0,  emoji: '\u{1F49A}\u{1F33F}', evolvedForm: 'yggdrasil' },

    // --- WIND (10 units) ---
    zephyr_scout:   { name: 'Zephyr Scout',   cost: 1, type: 'assassin', archetype: 'predator',  element: 'wind', hp: 395,  attack: 46,  attackSpd: 0.5,  range: 1, moveSpd: 4.0, maxMana: 45, emoji: '\u{1F5E1}\uFE0F\u{1F4A8}', evolvedForm: 'storm_assassin' },
    wind_archer:    { name: 'Wind Archer',    cost: 1, type: 'archer',   archetype: 'ranger',    element: 'wind', hp: 360,  attack: 52,  attackSpd: 0.7,  range: 4, moveSpd: 2.1, maxMana: 55, emoji: '\u{1F3F9}\u{1F4A8}', evolvedForm: 'gale_sniper' },
    gale_dancer:    { name: 'Gale Dancer',    cost: 1, type: 'healer',   archetype: 'sage',      element: 'wind', hp: 420,  attack: 30,  attackSpd: 1.1,  range: 2.5, moveSpd: 2.2, maxMana: 75, emoji: '\u{1F49A}\u{1F4A8}', evolvedForm: 'stormweaver' },
    wind_squire:    { name: 'Wind Squire',    cost: 1, type: 'warrior',  archetype: 'vanguard',  element: 'wind', hp: 600,  attack: 48,  attackSpd: 0.8,  range: 1, moveSpd: 1.95,maxMana: 60, emoji: '\u{2694}\uFE0F\u{1F4A8}', evolvedForm: 'zephyr_warrior' },
    sky_knight:     { name: 'Sky Knight',     cost: 2, type: 'warrior',  archetype: 'warden',    element: 'wind', hp: 680,  attack: 52,  attackSpd: 0.85, range: 1, moveSpd: 1.9, maxMana: 65, emoji: '\u{2694}\uFE0F\u{1F4A8}', evolvedForm: 'aegis_paladin' },
    gust_sentinel:  { name: 'Gust Sentinel',  cost: 2, type: 'tank',     archetype: 'guardian',  element: 'wind', hp: 850,  attack: 32,  attackSpd: 1.0,  range: 1, moveSpd: 1.6, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{1F4A8}', evolvedForm: 'tempest_guardian' },
    monsoon_caller: { name: 'Monsoon Caller', cost: 3, type: 'mage',     archetype: 'sorcerer',  element: 'wind', hp: 420,  attack: 78,  attackSpd: 0.9,  range: 3, moveSpd: 1.8, maxMana: 70, emoji: '\u{1F52E}\u{1F4A8}', evolvedForm: 'tempest_lord' },
    wind_duelist:   { name: 'Wind Duelist',   cost: 3, type: 'warrior',  archetype: 'duelist',   element: 'wind', hp: 620,  attack: 68,  attackSpd: 0.8,  range: 1, moveSpd: 2.0, maxMana: 60, emoji: '\u{2694}\uFE0F\u{1F4A8}', evolvedForm: 'hurricane_blade' },
    storm_sovereign:{ name: 'Storm Sovereign',cost: 4, type: 'assassin', archetype: 'predator',  element: 'wind', hp: 740,  attack: 100, attackSpd: 0.45, range: 1, moveSpd: 4.2, maxMana: 55, emoji: '\u{1F5E1}\uFE0F\u{1F4A8}', evolvedForm: 'tempest_emperor' },
    void_wyrm:      { name: 'Void Wyrm',      cost: 5, type: 'mage',     archetype: 'mystic',    element: 'wind', hp: 820,  attack: 125, attackSpd: 0.7,  range: 4, moveSpd: 2.1, maxMana: 0,  emoji: '\u{1F52E}\u{1F4A8}', evolvedForm: 'dimensional_dragon' },

    // --- LIGHTNING (10 units) ---
    spark_fencer:   { name: 'Spark Fencer',   cost: 1, type: 'warrior',  archetype: 'duelist',   element: 'lightning', hp: 620,  attack: 50,  attackSpd: 0.85, range: 1, moveSpd: 1.9, maxMana: 65, emoji: '\u{2694}\uFE0F\u{26A1}', evolvedForm: 'arc_duelist' },
    volt_runner:    { name: 'Volt Runner',    cost: 1, type: 'assassin', archetype: 'predator',  element: 'lightning', hp: 400,  attack: 45,  attackSpd: 0.5,  range: 1, moveSpd: 4.0, maxMana: 45, emoji: '\u{1F5E1}\uFE0F\u{26A1}', evolvedForm: 'lightning_phantom' },
    thunder_archer: { name: 'Thunder Archer', cost: 1, type: 'archer',   archetype: 'ranger',    element: 'lightning', hp: 360,  attack: 52,  attackSpd: 0.7,  range: 4, moveSpd: 2.0, maxMana: 55, emoji: '\u{1F3F9}\u{26A1}', evolvedForm: 'storm_archer' },
    pulse_mender:   { name: 'Pulse Mender',   cost: 1, type: 'healer',   archetype: 'sage',      element: 'lightning', hp: 430,  attack: 28,  attackSpd: 1.1,  range: 2.5, moveSpd: 1.6, maxMana: 75, emoji: '\u{1F49A}\u{26A1}', evolvedForm: 'storm_medic' },
    tesla_knight:   { name: 'Tesla Knight',   cost: 2, type: 'tank',     archetype: 'guardian',  element: 'lightning', hp: 900,  attack: 35,  attackSpd: 1.0,  range: 1, moveSpd: 1.5, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{26A1}', evolvedForm: 'storm_bastion' },
    shock_mage:     { name: 'Shock Mage',     cost: 2, type: 'mage',     archetype: 'sorcerer',  element: 'lightning', hp: 420,  attack: 65,  attackSpd: 0.95, range: 3, moveSpd: 1.5, maxMana: 75, emoji: '\u{1F52E}\u{26A1}', evolvedForm: 'tempest_mage' },
    ball_lightning:  { name: 'Ball Lightning',  cost: 3, type: 'mage',     archetype: 'mystic',    element: 'lightning', hp: 480,  attack: 75,  attackSpd: 0.9,  range: 3, moveSpd: 1.6, maxMana: 70, emoji: '\u{1F52E}\u{26A1}', evolvedForm: 'plasma_core' },
    thunder_warden: { name: 'Thunder Warden', cost: 3, type: 'tank',     archetype: 'warden',    element: 'lightning', hp: 1000, attack: 45,  attackSpd: 1.0,  range: 1, moveSpd: 1.3, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{26A1}', evolvedForm: 'storm_fortress' },
    thunderbird:    { name: 'Thunderbird',    cost: 4, type: 'warrior',  archetype: 'vanguard',  element: 'lightning', hp: 820,  attack: 88,  attackSpd: 0.8,  range: 1, moveSpd: 2.2, maxMana: 70, emoji: '\u{2694}\uFE0F\u{26A1}', evolvedForm: 'roc_of_storms' },
    storm_dragon:   { name: 'Storm Dragon',   cost: 5, type: 'mage',     archetype: 'sorcerer',  element: 'lightning', hp: 1000, attack: 130, attackSpd: 0.95, range: 3, moveSpd: 1.7, maxMana: 0,  emoji: '\u{1F52E}\u{26A1}', evolvedForm: 'thunder_god' },

    // --- FORCE (10 units) ---
    iron_soldier:   { name: 'Iron Soldier',   cost: 1, type: 'warrior',  archetype: 'vanguard',  element: 'force', hp: 630,  attack: 52,  attackSpd: 0.85, range: 1, moveSpd: 1.9, maxMana: 65, emoji: '\u{2694}\uFE0F\u{1F4AA}', evolvedForm: 'legionnaire' },
    shadow_blade:   { name: 'Shadow Blade',   cost: 1, type: 'assassin', archetype: 'predator',  element: 'force', hp: 410,  attack: 48,  attackSpd: 0.5,  range: 1, moveSpd: 3.9, maxMana: 45, emoji: '\u{1F5E1}\uFE0F\u{1F4AA}', evolvedForm: 'night_stalker' },
    steel_archer:   { name: 'Steel Archer',   cost: 1, type: 'archer',   archetype: 'ranger',    element: 'force', hp: 370,  attack: 50,  attackSpd: 0.7,  range: 4, moveSpd: 2.0, maxMana: 55, emoji: '\u{1F3F9}\u{1F4AA}', evolvedForm: 'ballista_archer' },
    war_cleric:     { name: 'War Cleric',     cost: 2, type: 'healer',   archetype: 'sage',      element: 'force', hp: 460,  attack: 32,  attackSpd: 1.1,  range: 2, moveSpd: 1.6, maxMana: 75, emoji: '\u{1F49A}\u{1F4AA}', evolvedForm: 'battle_priest' },
    battle_mage:    { name: 'Battle Mage',    cost: 2, type: 'mage',     archetype: 'sorcerer',  element: 'force', hp: 420,  attack: 68,  attackSpd: 0.95, range: 3, moveSpd: 1.5, maxMana: 75, emoji: '\u{1F52E}\u{1F4AA}', evolvedForm: 'force_archmage' },
    shield_bearer:  { name: 'Shield Bearer',  cost: 2, type: 'tank',     archetype: 'guardian',  element: 'force', hp: 920,  attack: 32,  attackSpd: 1.0,  range: 1, moveSpd: 1.5, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{1F4AA}', evolvedForm: 'bastion' },
    gladiator:      { name: 'Gladiator',      cost: 3, type: 'warrior',  archetype: 'duelist',   element: 'force', hp: 650,  attack: 80,  attackSpd: 0.8,  range: 1, moveSpd: 1.9, maxMana: 60, emoji: '\u{2694}\uFE0F\u{1F4AA}', evolvedForm: 'champion' },
    fortress:       { name: 'Fortress',       cost: 3, type: 'tank',     archetype: 'warden',    element: 'force', hp: 1100, attack: 40,  attackSpd: 1.0,  range: 1, moveSpd: 1.2, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{1F4AA}', evolvedForm: 'citadel' },
    siege_engineer: { name: 'Siege Engineer', cost: 4, type: 'mage',     archetype: 'mystic',    element: 'force', hp: 520,  attack: 92,  attackSpd: 0.9,  range: 3, moveSpd: 1.5, maxMana: 75, emoji: '\u{1F52E}\u{1F4AA}', evolvedForm: 'war_architect' },
    titan_lord:     { name: 'Titan Lord',     cost: 5, type: 'warrior',  archetype: 'duelist',   element: 'force', hp: 1350, attack: 140, attackSpd: 0.9,  range: 1, moveSpd: 1.8, maxMana: 0,  emoji: '\u{2694}\uFE0F\u{1F4AA}', evolvedForm: 'cosmic_titan' }
};

// =============================================================================
// EVOLVED TEMPLATES (60 evolved forms — all tiers evolve at 3★)
// =============================================================================

var EVOLVED_TEMPLATES = {
    // --- FIRE EVOLVED (6) ---
    fire_berserker:   { name: 'Fire Berserker',   baseCost: 1, type: 'warrior',  archetype: 'duelist',   element: 'fire', hp: 750,  attack: 68,  attackSpd: 0.65, range: 1, moveSpd: 2.2, maxMana: 65, emoji: '\u{2694}\uFE0F\u{1F525}\u{2728}', ability: 'Enhanced Blade Inferno + Scorching Blows', baseKey: 'flame_warrior' },
    flame_rogue:      { name: 'Flame Rogue',      baseCost: 1, type: 'assassin', archetype: 'predator',  element: 'fire', hp: 490,  attack: 60,  attackSpd: 0.40, range: 1, moveSpd: 4.5, maxMana: 45, emoji: '\u{1F5E1}\uFE0F\u{1F525}\u{2728}', ability: 'Phantom Blaze + First Blood Enhanced', baseKey: 'ember_scout' },
    cinder_marksman:  { name: 'Cinder Marksman',  baseCost: 1, type: 'archer',   archetype: 'ranger',    element: 'fire', hp: 430,  attack: 68,  attackSpd: 0.60, range: 5, moveSpd: 2.2, maxMana: 55, emoji: '\u{1F3F9}\u{1F525}\u{2728}', ability: 'Fire Barrage + Ignition Amplified', baseKey: 'cinder_archer' },
    ember_saint:      { name: 'Ember Saint',      baseCost: 1, type: 'healer',   archetype: 'sage',      element: 'fire', hp: 520,  attack: 36,  attackSpd: 1.0,  range: 3, moveSpd: 1.8, maxMana: 70, emoji: '\u{1F49A}\u{1F525}\u{2728}', ability: 'Holy Inferno + Cauterize Aura', baseKey: 'fire_acolyte' },
    volcano_titan:    { name: 'Volcano Titan',    baseCost: 2, type: 'tank',     archetype: 'guardian',  element: 'fire', hp: 1100, attack: 46,  attackSpd: 0.95, range: 1, moveSpd: 1.6, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{1F525}\u{2728}', ability: 'Volcanic Eruption + Molten Armor Enhanced', baseKey: 'magma_knight' },
    inferno_lancer:   { name: 'Inferno Lancer',   baseCost: 2, type: 'warrior',  archetype: 'vanguard',  element: 'fire', hp: 900,  attack: 72,  attackSpd: 0.60, range: 1, moveSpd: 2.3, maxMana: 60, emoji: '\u{2694}\uFE0F\u{1F525}\u{2728}', ability: 'Inferno Lance + Momentum Mastery', baseKey: 'blaze_lancer' },

    // --- WATER EVOLVED (6) ---
    tsunami_blade:    { name: 'Tsunami Blade',    baseCost: 1, type: 'warrior',  archetype: 'vanguard',  element: 'water', hp: 800,  attack: 64,  attackSpd: 0.60, range: 1, moveSpd: 2.1, maxMana: 60, emoji: '\u{2694}\uFE0F\u{1F4A7}\u{2728}', ability: 'Tsunami Slash + Undertow Enhanced', baseKey: 'tide_hunter' },
    ice_sniper:       { name: 'Ice Sniper',       baseCost: 1, type: 'archer',   archetype: 'ranger',    element: 'water', hp: 430,  attack: 65,  attackSpd: 0.60, range: 5, moveSpd: 2.2, maxMana: 50, emoji: '\u{1F3F9}\u{1F4A7}\u{2728}', ability: 'Frozen Barrage + Chill Amplified', baseKey: 'frost_archer' },
    tidal_phantom:    { name: 'Tidal Phantom',    baseCost: 1, type: 'assassin', archetype: 'predator',  element: 'water', hp: 500,  attack: 58,  attackSpd: 0.40, range: 1, moveSpd: 4.4, maxMana: 40, emoji: '\u{1F5E1}\uFE0F\u{1F4A7}\u{2728}', ability: 'Phantom Strike + Slippery Enhanced', baseKey: 'reef_stalker' },
    ocean_sage:       { name: 'Ocean Sage',       baseCost: 2, type: 'healer',   archetype: 'sage',      element: 'water', hp: 560,  attack: 40,  attackSpd: 1.0,  range: 3, moveSpd: 1.7, maxMana: 75, emoji: '\u{1F49A}\u{1F4A7}\u{2728}', ability: 'Ocean\'s Blessing + Soothing Mists Enhanced', baseKey: 'coral_priest' },
    abyssal_mage:     { name: 'Abyssal Mage',     baseCost: 2, type: 'mage',     archetype: 'sorcerer',  element: 'water', hp: 500,  attack: 80,  attackSpd: 0.85, range: 4, moveSpd: 1.5, maxMana: 70, emoji: '\u{1F52E}\u{1F4A7}\u{2728}', ability: 'Abyssal Bolt + Torrent Amplified', baseKey: 'hydro_mage' },
    armored_sentinel: { name: 'Armored Sentinel', baseCost: 2, type: 'tank',     archetype: 'guardian',  element: 'water', hp: 1125, attack: 42,  attackSpd: 0.95, range: 1, moveSpd: 1.5, maxMana: 80, emoji: '\u{1F6E1}\uFE0F\u{1F4A7}\u{2728}', ability: 'Fortress Stance + Shell Defense Enhanced', baseKey: 'shell_knight' },

    // --- EARTH EVOLVED (6) ---
    mountain_lord:    { name: 'Mountain Lord',    baseCost: 1, type: 'tank',     archetype: 'guardian',  element: 'earth', hp: 940,  attack: 42,  attackSpd: 0.95, range: 1, moveSpd: 1.5, maxMana: 80, emoji: '\u{1F6E1}\uFE0F\u{1F33F}\u{2728}', ability: 'Mountain Barrier + Fortify Enhanced', baseKey: 'stone_guard' },
    ironwood_sentinel:{ name: 'Ironwood Sentinel',baseCost: 1, type: 'warrior',  archetype: 'vanguard',  element: 'earth', hp: 800,  attack: 65,  attackSpd: 0.65, range: 1, moveSpd: 2.1, maxMana: 65, emoji: '\u{2694}\uFE0F\u{1F33F}\u{2728}', ability: 'Ironwood Bash + Thorns Enhanced', baseKey: 'bramble_knight' },
    thornwood_ranger: { name: 'Thornwood Ranger', baseCost: 1, type: 'archer',   archetype: 'ranger',    element: 'earth', hp: 430,  attack: 62,  attackSpd: 0.60, range: 4, moveSpd: 2.2, maxMana: 55, emoji: '\u{1F3F9}\u{1F33F}\u{2728}', ability: 'Thorn Shot + Overgrowth Enhanced', baseKey: 'seedling_archer' },
    gaia_priest:      { name: 'Gaia Priest',      baseCost: 2, type: 'healer',   archetype: 'sage',      element: 'earth', hp: 560,  attack: 42,  attackSpd: 1.0,  range: 3, moveSpd: 1.7, maxMana: 75, emoji: '\u{1F49A}\u{1F33F}\u{2728}', ability: 'Gaia\'s Blessing + Grounding Enhanced', baseKey: 'earth_shaman' },
    geomancer:        { name: 'Geomancer',        baseCost: 2, type: 'mage',     archetype: 'guardian',  element: 'earth', hp: 625,  attack: 80,  attackSpd: 0.85, range: 4, moveSpd: 1.6, maxMana: 70, emoji: '\u{1F52E}\u{1F33F}\u{2728}', ability: 'Crystal Barrage + Crystal Shell Enhanced', baseKey: 'crystal_mage' },
    quake_reaper:     { name: 'Quake Reaper',     baseCost: 2, type: 'assassin', archetype: 'predator',  element: 'earth', hp: 525,  attack: 62,  attackSpd: 0.40, range: 1, moveSpd: 3.7, maxMana: 45, emoji: '\u{1F5E1}\uFE0F\u{1F33F}\u{2728}', ability: 'Earthquake Strike + Burrow Enhanced', baseKey: 'mud_stalker' },

    // --- WIND EVOLVED (6) ---
    storm_assassin:   { name: 'Storm Assassin',   baseCost: 1, type: 'assassin', archetype: 'predator',  element: 'wind', hp: 495,  attack: 60,  attackSpd: 0.40, range: 1, moveSpd: 4.6, maxMana: 45, emoji: '\u{1F5E1}\uFE0F\u{1F4A8}\u{2728}', ability: 'Storm Slash + Windwalk Enhanced', baseKey: 'zephyr_scout' },
    gale_sniper:      { name: 'Gale Sniper',      baseCost: 1, type: 'archer',   archetype: 'ranger',    element: 'wind', hp: 430,  attack: 68,  attackSpd: 0.60, range: 5, moveSpd: 2.3, maxMana: 55, emoji: '\u{1F3F9}\u{1F4A8}\u{2728}', ability: 'Gale Barrage + Tailwind Enhanced', baseKey: 'wind_archer' },
    stormweaver:      { name: 'Stormweaver',      baseCost: 1, type: 'healer',   archetype: 'sage',      element: 'wind', hp: 520,  attack: 38,  attackSpd: 1.0,  range: 3, moveSpd: 2.5, maxMana: 75, emoji: '\u{1F49A}\u{1F4A8}\u{2728}', ability: 'Storm Breeze + Zephyr\'s Grace Enhanced', baseKey: 'gale_dancer' },
    zephyr_warrior:   { name: 'Zephyr Warrior',   baseCost: 1, type: 'warrior',  archetype: 'vanguard',  element: 'wind', hp: 750,  attack: 65,  attackSpd: 0.60, range: 1, moveSpd: 2.2, maxMana: 60, emoji: '\u{2694}\uFE0F\u{1F4A8}\u{2728}', ability: 'Zephyr Slash + Momentum Enhanced', baseKey: 'wind_squire' },
    aegis_paladin:    { name: 'Aegis Paladin',    baseCost: 2, type: 'warrior',  archetype: 'warden',    element: 'wind', hp: 850,  attack: 68,  attackSpd: 0.65, range: 1, moveSpd: 2.2, maxMana: 65, emoji: '\u{2694}\uFE0F\u{1F4A8}\u{2728}', ability: 'Divine Guard + Inspiring Presence Enhanced', baseKey: 'sky_knight' },
    tempest_guardian: { name: 'Tempest Guardian', baseCost: 2, type: 'tank',     archetype: 'guardian',  element: 'wind', hp: 1060, attack: 42,  attackSpd: 0.95, range: 1, moveSpd: 1.7, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{1F4A8}\u{2728}', ability: 'Tempest Guard + Deflection Enhanced', baseKey: 'gust_sentinel' },

    // --- LIGHTNING EVOLVED (6) ---
    arc_duelist:      { name: 'Arc Duelist',      baseCost: 1, type: 'warrior',  archetype: 'duelist',   element: 'lightning', hp: 775,  attack: 68,  attackSpd: 0.65, range: 1, moveSpd: 2.2, maxMana: 65, emoji: '\u{2694}\uFE0F\u{26A1}\u{2728}', ability: 'Arc Slash + Static Charge Enhanced', baseKey: 'spark_fencer' },
    lightning_phantom:{ name: 'Lightning Phantom',baseCost: 1, type: 'assassin', archetype: 'predator',  element: 'lightning', hp: 500,  attack: 58,  attackSpd: 0.40, range: 1, moveSpd: 4.6, maxMana: 45, emoji: '\u{1F5E1}\uFE0F\u{26A1}\u{2728}', ability: 'Lightning Dash + Dash Chain Enhanced', baseKey: 'volt_runner' },
    storm_archer:     { name: 'Storm Archer',     baseCost: 1, type: 'archer',   archetype: 'ranger',    element: 'lightning', hp: 430,  attack: 68,  attackSpd: 0.60, range: 5, moveSpd: 2.2, maxMana: 55, emoji: '\u{1F3F9}\u{26A1}\u{2728}', ability: 'Storm Arrow + Charged Shot Enhanced', baseKey: 'thunder_archer' },
    storm_medic:      { name: 'Storm Medic',      baseCost: 1, type: 'healer',   archetype: 'sage',      element: 'lightning', hp: 535,  attack: 36,  attackSpd: 1.0,  range: 3, moveSpd: 1.8, maxMana: 75, emoji: '\u{1F49A}\u{26A1}\u{2728}', ability: 'Storm Pulse + Defibrillator Enhanced', baseKey: 'pulse_mender' },
    storm_bastion:    { name: 'Storm Bastion',    baseCost: 2, type: 'tank',     archetype: 'guardian',  element: 'lightning', hp: 1125, attack: 46,  attackSpd: 0.95, range: 1, moveSpd: 1.6, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{26A1}\u{2728}', ability: 'Storm Barrier + Lightning Conductor Enhanced', baseKey: 'tesla_knight' },
    tempest_mage:     { name: 'Tempest Mage',     baseCost: 2, type: 'mage',     archetype: 'sorcerer',  element: 'lightning', hp: 525,  attack: 84,  attackSpd: 0.85, range: 4, moveSpd: 1.6, maxMana: 75, emoji: '\u{1F52E}\u{26A1}\u{2728}', ability: 'Tempest Lightning + Electrocution Enhanced', baseKey: 'shock_mage' },

    // --- FORCE EVOLVED (6) ---
    legionnaire:      { name: 'Legionnaire',      baseCost: 1, type: 'warrior',  archetype: 'vanguard',  element: 'force', hp: 790,  attack: 70,  attackSpd: 0.65, range: 1, moveSpd: 2.2, maxMana: 65, emoji: '\u{2694}\uFE0F\u{1F4AA}\u{2728}', ability: 'Legion Strike + Iron Skin Enhanced', baseKey: 'iron_soldier' },
    night_stalker:    { name: 'Night Stalker',    baseCost: 1, type: 'assassin', archetype: 'predator',  element: 'force', hp: 510,  attack: 62,  attackSpd: 0.40, range: 1, moveSpd: 4.5, maxMana: 45, emoji: '\u{1F5E1}\uFE0F\u{1F4AA}\u{2728}', ability: 'Assassination + Shadow Step Enhanced', baseKey: 'shadow_blade' },
    ballista_archer:  { name: 'Ballista Archer',  baseCost: 1, type: 'archer',   archetype: 'ranger',    element: 'force', hp: 440,  attack: 65,  attackSpd: 0.60, range: 5, moveSpd: 2.2, maxMana: 55, emoji: '\u{1F3F9}\u{1F4AA}\u{2728}', ability: 'Ballista Shot + Steady Aim Enhanced', baseKey: 'steel_archer' },
    battle_priest:    { name: 'Battle Priest',    baseCost: 2, type: 'healer',   archetype: 'sage',      element: 'force', hp: 575,  attack: 42,  attackSpd: 1.0,  range: 3, moveSpd: 1.8, maxMana: 75, emoji: '\u{1F49A}\u{1F4AA}\u{2728}', ability: 'Holy Wrath + War Prayer Enhanced', baseKey: 'war_cleric' },
    force_archmage:   { name: 'Force Archmage',   baseCost: 2, type: 'mage',     archetype: 'sorcerer',  element: 'force', hp: 525,  attack: 88,  attackSpd: 0.85, range: 4, moveSpd: 1.6, maxMana: 75, emoji: '\u{1F52E}\u{1F4AA}\u{2728}', ability: 'Force Blast + Telekinetic Force Enhanced', baseKey: 'battle_mage' },
    bastion:          { name: 'Bastion',          baseCost: 2, type: 'tank',     archetype: 'guardian',  element: 'force', hp: 1150, attack: 42,  attackSpd: 0.95, range: 1, moveSpd: 1.6, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{1F4AA}\u{2728}', ability: 'Fortress Wall + Fortified Defense Enhanced', baseKey: 'shield_bearer' },

    // --- FIRE T3-T5 EVOLVED (4) ---
    arcane_inferno:      { name: 'Arcane Inferno',      baseCost: 3, type: 'mage',     archetype: 'sorcerer',  element: 'fire', hp: 520,  attack: 75,  attackSpd: 0.9,  range: 3, moveSpd: 1.5, maxMana: 65, emoji: '\u{1F52E}\u{1F525}\u{2728}', ability: 'Infernal Storm Enhanced + Pyromaniac Enhanced', baseKey: 'pyromancer' },
    ninetail_blaze:      { name: 'Ninetail Blaze',      baseCost: 3, type: 'assassin', archetype: 'mystic',    element: 'fire', hp: 480,  attack: 72,  attackSpd: 0.5,  range: 1, moveSpd: 3.8, maxMana: 50, emoji: '\u{1F5E1}\uFE0F\u{1F525}\u{2728}', ability: 'Spirit Rush Enhanced + Foxfire Enhanced', baseKey: 'inferno_fox' },
    elder_wyrm:          { name: 'Elder Wyrm',          baseCost: 4, type: 'mage',     archetype: 'warden',    element: 'fire', hp: 1100, attack: 95,  attackSpd: 0.9,  range: 3, moveSpd: 1.5, maxMana: 80, emoji: '\u{1F52E}\u{1F525}\u{2728}', ability: 'Breath Weapon Enhanced + Dragonfire Aura Enhanced', baseKey: 'fire_dragon' },
    eternal_phoenix:     { name: 'Eternal Phoenix',     baseCost: 5, type: 'mage',     archetype: 'mystic',    element: 'fire', hp: 950,  attack: 110, attackSpd: 0.95, range: 3, moveSpd: 1.6, maxMana: 0,  emoji: '\u{1F52E}\u{1F525}\u{2728}', ability: 'Rebirth Enhanced + Eternal Flame Enhanced', baseKey: 'phoenix' },

    // --- WATER T3-T5 EVOLVED (4) ---
    stormtide_oracle:    { name: 'Stormtide Oracle',    baseCost: 3, type: 'healer',   archetype: 'mystic',    element: 'water', hp: 480,  attack: 45,  attackSpd: 1.1,  range: 2.5, moveSpd: 1.6, maxMana: 80, emoji: '\u{1F49A}\u{1F4A7}\u{2728}', ability: 'Tidal Surge + Scepter of Tides Enhanced', baseKey: 'tidal_shaman' },
    tsunami_warlord:     { name: 'Tsunami Warlord',     baseCost: 3, type: 'warrior',  archetype: 'duelist',   element: 'water', hp: 620,  attack: 70,  attackSpd: 0.8,  range: 1, moveSpd: 1.8, maxMana: 65, emoji: '\u{2694}\uFE0F\u{1F4A7}\u{2728}', ability: 'Maelstrom Spin + Current Enhanced', baseKey: 'riptide_blade' },
    abyssal_terror:      { name: 'Abyssal Terror',      baseCost: 4, type: 'mage',     archetype: 'warden',    element: 'water', hp: 920,  attack: 98,  attackSpd: 0.9,  range: 3, moveSpd: 1.3, maxMana: 85, emoji: '\u{1F52E}\u{1F4A7}\u{2728}', ability: 'Maelstrom Enhanced + Ink Cloud Enhanced', baseKey: 'kraken' },
    primordial_leviathan:{ name: 'Primordial Leviathan',baseCost: 5, type: 'tank',     archetype: 'guardian',  element: 'water', hp: 1450, attack: 35,  attackSpd: 1.0,  range: 1, moveSpd: 1.2, maxMana: 0,  emoji: '\u{1F6E1}\uFE0F\u{1F4A7}\u{2728}', ability: 'Tidal Guardian Enhanced + Abyssal Depths Enhanced', baseKey: 'leviathan' },

    // --- EARTH T3-T5 EVOLVED (4) ---
    iron_colossus:       { name: 'Iron Colossus',       baseCost: 3, type: 'tank',     archetype: 'warden',    element: 'earth', hp: 1050, attack: 42,  attackSpd: 1.0,  range: 1, moveSpd: 1.2, maxMana: 90, emoji: '\u{1F6E1}\uFE0F\u{1F33F}\u{2728}', ability: 'Ground Slam Enhanced + Immovable Enhanced', baseKey: 'golem' },
    earthweaver:         { name: 'Earthweaver',         baseCost: 3, type: 'mage',     archetype: 'sorcerer',  element: 'earth', hp: 440,  attack: 70,  attackSpd: 0.9,  range: 3, moveSpd: 1.5, maxMana: 75, emoji: '\u{1F52E}\u{1F33F}\u{2728}', ability: 'Earthen Barrage + Living Earth Enhanced', baseKey: 'terra_sage' },
    world_sentinel:      { name: 'World Sentinel',      baseCost: 4, type: 'warrior',  archetype: 'duelist',   element: 'earth', hp: 1200, attack: 70,  attackSpd: 0.9,  range: 1, moveSpd: 1.2, maxMana: 80, emoji: '\u{2694}\uFE0F\u{1F33F}\u{2728}', ability: 'Nature\'s Wrath + Deep Roots Enhanced', baseKey: 'ancient_treant' },
    yggdrasil:           { name: 'Yggdrasil',           baseCost: 5, type: 'healer',   archetype: 'sage',      element: 'earth', hp: 1300, attack: 28,  attackSpd: 1.2,  range: 3, moveSpd: 1.3, maxMana: 0,  emoji: '\u{1F49A}\u{1F33F}\u{2728}', ability: 'Bloom of Life Enhanced + Roots of Life Enhanced', baseKey: 'world_tree' },

    // --- WIND T3-T5 EVOLVED (4) ---
    tempest_lord:        { name: 'Tempest Lord',        baseCost: 3, type: 'mage',     archetype: 'sorcerer',  element: 'wind', hp: 420,  attack: 78,  attackSpd: 0.9,  range: 3, moveSpd: 1.8, maxMana: 70, emoji: '\u{1F52E}\u{1F4A8}\u{2728}', ability: 'Tornado Enhanced + Updraft Enhanced', baseKey: 'monsoon_caller' },
    hurricane_blade:     { name: 'Hurricane Blade',     baseCost: 3, type: 'warrior',  archetype: 'duelist',   element: 'wind', hp: 620,  attack: 68,  attackSpd: 0.8,  range: 1, moveSpd: 2.0, maxMana: 60, emoji: '\u{2694}\uFE0F\u{1F4A8}\u{2728}', ability: 'Cyclone Slash + Dance of Blades Enhanced', baseKey: 'wind_duelist' },
    tempest_emperor:     { name: 'Tempest Emperor',     baseCost: 4, type: 'assassin', archetype: 'predator',  element: 'wind', hp: 740,  attack: 100, attackSpd: 0.45, range: 1, moveSpd: 4.2, maxMana: 55, emoji: '\u{1F5E1}\uFE0F\u{1F4A8}\u{2728}', ability: 'Thunder Cleave + Lightning Speed Enhanced', baseKey: 'storm_sovereign' },
    dimensional_dragon:  { name: 'Dimensional Dragon',  baseCost: 5, type: 'mage',     archetype: 'mystic',    element: 'wind', hp: 820,  attack: 125, attackSpd: 0.7,  range: 4, moveSpd: 2.1, maxMana: 0,  emoji: '\u{1F52E}\u{1F4A8}\u{2728}', ability: 'Dimensional Rift Enhanced + Reality Warp Enhanced', baseKey: 'void_wyrm' },

    // --- LIGHTNING T3-T5 EVOLVED (4) ---
    plasma_core:         { name: 'Plasma Core',         baseCost: 3, type: 'mage',     archetype: 'mystic',    element: 'lightning', hp: 480,  attack: 75,  attackSpd: 0.9,  range: 3, moveSpd: 1.6, maxMana: 70, emoji: '\u{1F52E}\u{26A1}\u{2728}', ability: 'Sphere Summoning + Rolling Thunder Enhanced', baseKey: 'ball_lightning' },
    storm_fortress:      { name: 'Storm Fortress',      baseCost: 3, type: 'tank',     archetype: 'warden',    element: 'lightning', hp: 1000, attack: 45,  attackSpd: 1.0,  range: 1, moveSpd: 1.3, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{26A1}\u{2728}', ability: 'Lightning Prison Enhanced + Overcharge Enhanced', baseKey: 'thunder_warden' },
    roc_of_storms:       { name: 'Roc of Storms',       baseCost: 4, type: 'warrior',  archetype: 'vanguard',  element: 'lightning', hp: 820,  attack: 88,  attackSpd: 0.8,  range: 1, moveSpd: 2.2, maxMana: 70, emoji: '\u{2694}\uFE0F\u{26A1}\u{2728}', ability: 'Lightning Descent Enhanced + Aerial Superiority Enhanced', baseKey: 'thunderbird' },
    thunder_god:         { name: 'Thunder God',         baseCost: 5, type: 'mage',     archetype: 'sorcerer',  element: 'lightning', hp: 1000, attack: 130, attackSpd: 0.95, range: 3, moveSpd: 1.7, maxMana: 0,  emoji: '\u{1F52E}\u{26A1}\u{2728}', ability: 'Cataclysmic Storm Enhanced + Superconductor Enhanced', baseKey: 'storm_dragon' },

    // --- FORCE T3-T5 EVOLVED (4) ---
    champion:            { name: 'Champion',            baseCost: 3, type: 'warrior',  archetype: 'duelist',   element: 'force', hp: 650,  attack: 80,  attackSpd: 0.8,  range: 1, moveSpd: 1.9, maxMana: 60, emoji: '\u{2694}\uFE0F\u{1F4AA}\u{2728}', ability: 'Brutal Strike Enhanced + Arena Master Enhanced', baseKey: 'gladiator' },
    citadel:             { name: 'Citadel',             baseCost: 3, type: 'tank',     archetype: 'warden',    element: 'force', hp: 1100, attack: 40,  attackSpd: 1.0,  range: 1, moveSpd: 1.2, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{1F4AA}\u{2728}', ability: 'Defensive Stance Enhanced + Unbreakable Will Enhanced', baseKey: 'fortress' },
    war_architect:       { name: 'War Architect',       baseCost: 4, type: 'mage',     archetype: 'mystic',    element: 'force', hp: 520,  attack: 92,  attackSpd: 0.9,  range: 3, moveSpd: 1.5, maxMana: 75, emoji: '\u{1F52E}\u{1F4AA}\u{2728}', ability: 'Artillery Strike Enhanced + War Machine Enhanced', baseKey: 'siege_engineer' },
    cosmic_titan:        { name: 'Cosmic Titan',        baseCost: 5, type: 'warrior',  archetype: 'duelist',   element: 'force', hp: 1350, attack: 140, attackSpd: 0.9,  range: 1, moveSpd: 1.8, maxMana: 0,  emoji: '\u{2694}\uFE0F\u{1F4AA}\u{2728}', ability: 'Earthshaker Enhanced + Colossus Enhanced', baseKey: 'titan_lord' }
};

// =============================================================================
// EVOLUTION PATHS (60 entries — all units evolve at 3★)
// =============================================================================

var EVOLUTIONS = {
    // --- FIRE ---
    flame_warrior:   { evolved: 'fire_berserker',    requirements: [{ type: 'stars', value: 3 }] },
    ember_scout:     { evolved: 'flame_rogue',       requirements: [{ type: 'stars', value: 3 }] },
    cinder_archer:   { evolved: 'cinder_marksman',   requirements: [{ type: 'stars', value: 3 }] },
    fire_acolyte:    { evolved: 'ember_saint',       requirements: [{ type: 'stars', value: 3 }] },
    magma_knight:    { evolved: 'volcano_titan',     requirements: [{ type: 'stars', value: 3 }] },
    blaze_lancer:    { evolved: 'inferno_lancer',    requirements: [{ type: 'stars', value: 3 }] },
    pyromancer:      { evolved: 'arcane_inferno',    requirements: [{ type: 'stars', value: 3 }] },
    inferno_fox:     { evolved: 'ninetail_blaze',    requirements: [{ type: 'stars', value: 3 }] },
    fire_dragon:     { evolved: 'elder_wyrm',        requirements: [{ type: 'stars', value: 3 }] },
    phoenix:         { evolved: 'eternal_phoenix',   requirements: [{ type: 'stars', value: 3 }] },
    // --- WATER ---
    tide_hunter:     { evolved: 'tsunami_blade',     requirements: [{ type: 'stars', value: 3 }] },
    frost_archer:    { evolved: 'ice_sniper',        requirements: [{ type: 'stars', value: 3 }] },
    reef_stalker:    { evolved: 'tidal_phantom',     requirements: [{ type: 'stars', value: 3 }] },
    coral_priest:    { evolved: 'ocean_sage',        requirements: [{ type: 'stars', value: 3 }] },
    hydro_mage:      { evolved: 'abyssal_mage',     requirements: [{ type: 'stars', value: 3 }] },
    shell_knight:    { evolved: 'armored_sentinel',  requirements: [{ type: 'stars', value: 3 }] },
    tidal_shaman:    { evolved: 'stormtide_oracle',  requirements: [{ type: 'stars', value: 3 }] },
    riptide_blade:   { evolved: 'tsunami_warlord',   requirements: [{ type: 'stars', value: 3 }] },
    kraken:          { evolved: 'abyssal_terror',    requirements: [{ type: 'stars', value: 3 }] },
    leviathan:       { evolved: 'primordial_leviathan', requirements: [{ type: 'stars', value: 3 }] },
    // --- EARTH ---
    stone_guard:     { evolved: 'mountain_lord',     requirements: [{ type: 'stars', value: 3 }] },
    bramble_knight:  { evolved: 'ironwood_sentinel', requirements: [{ type: 'stars', value: 3 }] },
    seedling_archer: { evolved: 'thornwood_ranger',  requirements: [{ type: 'stars', value: 3 }] },
    earth_shaman:    { evolved: 'gaia_priest',       requirements: [{ type: 'stars', value: 3 }] },
    crystal_mage:    { evolved: 'geomancer',         requirements: [{ type: 'stars', value: 3 }] },
    mud_stalker:     { evolved: 'quake_reaper',      requirements: [{ type: 'stars', value: 3 }] },
    golem:           { evolved: 'iron_colossus',     requirements: [{ type: 'stars', value: 3 }] },
    terra_sage:      { evolved: 'earthweaver',       requirements: [{ type: 'stars', value: 3 }] },
    ancient_treant:  { evolved: 'world_sentinel',    requirements: [{ type: 'stars', value: 3 }] },
    world_tree:      { evolved: 'yggdrasil',         requirements: [{ type: 'stars', value: 3 }] },
    // --- WIND ---
    zephyr_scout:    { evolved: 'storm_assassin',    requirements: [{ type: 'stars', value: 3 }] },
    wind_archer:     { evolved: 'gale_sniper',       requirements: [{ type: 'stars', value: 3 }] },
    gale_dancer:     { evolved: 'stormweaver',       requirements: [{ type: 'stars', value: 3 }] },
    wind_squire:     { evolved: 'zephyr_warrior',    requirements: [{ type: 'stars', value: 3 }] },
    sky_knight:      { evolved: 'aegis_paladin',     requirements: [{ type: 'stars', value: 3 }] },
    gust_sentinel:   { evolved: 'tempest_guardian',  requirements: [{ type: 'stars', value: 3 }] },
    monsoon_caller:  { evolved: 'tempest_lord',      requirements: [{ type: 'stars', value: 3 }] },
    wind_duelist:    { evolved: 'hurricane_blade',   requirements: [{ type: 'stars', value: 3 }] },
    storm_sovereign: { evolved: 'tempest_emperor',   requirements: [{ type: 'stars', value: 3 }] },
    void_wyrm:       { evolved: 'dimensional_dragon', requirements: [{ type: 'stars', value: 3 }] },
    // --- LIGHTNING ---
    spark_fencer:    { evolved: 'arc_duelist',       requirements: [{ type: 'stars', value: 3 }] },
    volt_runner:     { evolved: 'lightning_phantom',  requirements: [{ type: 'stars', value: 3 }] },
    thunder_archer:  { evolved: 'storm_archer',      requirements: [{ type: 'stars', value: 3 }] },
    pulse_mender:    { evolved: 'storm_medic',       requirements: [{ type: 'stars', value: 3 }] },
    tesla_knight:    { evolved: 'storm_bastion',     requirements: [{ type: 'stars', value: 3 }] },
    shock_mage:      { evolved: 'tempest_mage',      requirements: [{ type: 'stars', value: 3 }] },
    ball_lightning:  { evolved: 'plasma_core',       requirements: [{ type: 'stars', value: 3 }] },
    thunder_warden:  { evolved: 'storm_fortress',    requirements: [{ type: 'stars', value: 3 }] },
    thunderbird:     { evolved: 'roc_of_storms',     requirements: [{ type: 'stars', value: 3 }] },
    storm_dragon:    { evolved: 'thunder_god',       requirements: [{ type: 'stars', value: 3 }] },
    // --- FORCE ---
    iron_soldier:    { evolved: 'legionnaire',       requirements: [{ type: 'stars', value: 3 }] },
    shadow_blade:    { evolved: 'night_stalker',     requirements: [{ type: 'stars', value: 3 }] },
    steel_archer:    { evolved: 'ballista_archer',   requirements: [{ type: 'stars', value: 3 }] },
    war_cleric:      { evolved: 'battle_priest',     requirements: [{ type: 'stars', value: 3 }] },
    battle_mage:     { evolved: 'force_archmage',    requirements: [{ type: 'stars', value: 3 }] },
    shield_bearer:   { evolved: 'bastion',           requirements: [{ type: 'stars', value: 3 }] },
    gladiator:       { evolved: 'champion',          requirements: [{ type: 'stars', value: 3 }] },
    fortress:        { evolved: 'citadel',           requirements: [{ type: 'stars', value: 3 }] },
    siege_engineer:  { evolved: 'war_architect',     requirements: [{ type: 'stars', value: 3 }] },
    titan_lord:      { evolved: 'cosmic_titan',      requirements: [{ type: 'stars', value: 3 }] }
};

// =============================================================================
// ABILITY DATA (120 entries: 60 base + 60 evolved)
// =============================================================================

var ABILITY_DATA = {
    // --- FIRE BASE ---
    flame_warrior:   { name: 'Blade Inferno',    desc: 'Slash forward, dealing 150% ATK in a cone. Apply Burn (15 DPS, 3s) to all hit.' },
    ember_scout:     { name: 'Ambush',           desc: 'Dash behind target, dealing 200% ATK and applying Burn (10 DPS, 3s). Refund 30 mana if it kills.' },
    cinder_archer:   { name: 'Fire Arrow',       desc: 'Next auto-attack empowered, deals 180% ATK and applies Burn (15 DPS, 3s).' },
    fire_acolyte:    { name: 'Sacred Flame',     desc: 'Heal lowest-HP ally for 140% ATK. If ally is below 35% HP, heal for 220% instead.' },
    magma_knight:    { name: 'Magma Eruption',   desc: 'Explode ground around self, dealing 160% ATK to nearby enemies and applying Burn (20 DPS, 3s). Gain Shield equal to 20% max HP.' },
    blaze_lancer:    { name: 'Lance Strike',     desc: 'Dash forward, dealing 180% ATK and applying Burn (12 DPS, 3s). Reset Momentum stacks.' },
    pyromancer:      { name: 'Infernal Storm',   desc: 'Cast storm at location, dealing 200% ATK to all enemies in area over 3s. Apply Burn (25 DPS, 4s).' },
    inferno_fox:     { name: 'Spirit Rush',      desc: 'Dash 3 times to 3 different enemies over 1.5s, dealing 100% ATK each. Final target takes 200%.' },
    fire_dragon:     { name: 'Breath Weapon',    desc: 'Breathe fire in a cone, dealing 250% ATK and applying Burn (30 DPS, 4s). Stun closest hit enemy for 1.5s.' },
    phoenix:         { name: 'Rebirth',          desc: 'PASSIVE: On death, revive after 3s at 50% HP. First revive always triggers; subsequent on kills. Explode on revive for 150% ATK in area.' },

    // --- WATER BASE ---
    tide_hunter:     { name: 'Tidal Slash',      desc: 'Slash forward, dealing 160% ATK and applying Slow (15% attack speed, 3s) to all hit.' },
    frost_archer:    { name: 'Frost Shot',       desc: 'Shoot freeze projectile, dealing 170% ATK and applying Slow (20% AS, 3s). Frozen targets take 15% more damage for 4s.' },
    reef_stalker:    { name: 'Depth Strike',     desc: 'Teleport behind target, deal 220% ATK. If target is Slowed, deal 280% instead and reset dash cooldown.' },
    coral_priest:    { name: 'Tidal Blessing',   desc: 'Heal 2 lowest-HP allies for 150% ATK each. Grant them 10% DR for 4s.' },
    hydro_mage:      { name: 'Hydro Bolt',       desc: 'Launch water blast at target, dealing 200% ATK and applying Slow (18% AS, 3s). Chain to 1 nearby slowed enemy for 120% damage.' },
    shell_knight:    { name: 'Shelled Stance',   desc: 'Gain Shield equal to 25% max HP. All Water allies gain Shield equal to 12% max HP.' },
    tidal_shaman:    { name: 'Tidal Surge',      desc: 'Heal all Water allies for 160% ATK. They gain 15% dodge for 3s.' },
    riptide_blade:   { name: 'Maelstrom Spin',   desc: 'Spin rapidly, dealing 180% ATK to nearby enemies and applying Slow (20% AS, 3s). Gain 20% lifesteal for 4s.' },
    kraken:          { name: 'Maelstrom',        desc: 'Create whirlpool at target location (2-cell radius). Over 4s, deal 280% ATK total to enemies and pull them 1 cell toward center each second.' },
    leviathan:       { name: 'Tidal Guardian',   desc: 'PASSIVE: Water allies gain 12% max HP and 8% DR. Enemies hitting Leviathan lose 8 mana. Start combat with 200 shield.' },

    // --- EARTH BASE ---
    stone_guard:     { name: 'Stone Barrier',    desc: 'Gain Shield equal to 28% max HP. Allies within 2 cells gain Shield equal to 15% max HP.' },
    bramble_knight:  { name: 'Thorn Bash',       desc: 'Deal 140% ATK and stun 1s. Gain Shield equal to 18% max HP. Nearby allies gain Shield equal to 10% max HP.' },
    seedling_archer: { name: 'Root Shot',        desc: 'Shoot projectile, dealing 160% ATK. Root target for 1.5s. Grant self +15% ATK per rooted enemy for 4s.' },
    earth_shaman:    { name: 'Earth\'s Blessing', desc: 'Heal 2 lowest-HP allies for 150% ATK. Grant them Shield equal to 12% max HP.' },
    crystal_mage:    { name: 'Stalagmite Burst', desc: 'Deal 200% ATK to target and adjacent enemies. Root them 1.5s. Grant allies in area Shield equal to 15% max HP.' },
    mud_stalker:     { name: 'Subterranean Strike', desc: 'Burrow for 1s, emerge at target dealing 220% ATK. Root target 1.5s. Gain Shield equal to 15% max HP.' },
    golem:           { name: 'Ground Slam',      desc: 'Slam ground dealing 180% ATK to nearby enemies and stunning them 1.2s. Grant self 15% DR for 4s.' },
    terra_sage:      { name: 'Earthen Barrage',  desc: 'Launch 3 earth projectiles at 3 highest-ATK enemies, each dealing 140% ATK and reducing their ATK 18% for 4s.' },
    ancient_treant:  { name: 'Nature\'s Wrath',  desc: 'Strike target dealing 220% ATK and rooting for 2s. Heal all Earth allies for 15% of damage dealt.' },
    world_tree:      { name: 'Bloom of Life',    desc: 'PASSIVE: Every 8s, nearest lowest-HP 3 allies heal for 250% ATK. Overhealing converts to Shield (60%). Earth allies +10% healing received.' },

    // --- WIND BASE ---
    zephyr_scout:    { name: 'Swift Slash',      desc: 'Dash to target, deal 210% ATK. Grant self 25% dodge for 3s.' },
    wind_archer:     { name: 'Pierce Shot',      desc: 'Shoot arrow that pierces through enemies, dealing 170% ATK to each. Grant self +18% ATK speed for 4s.' },
    gale_dancer:     { name: 'Rejuvenating Breeze', desc: 'Heal 2 lowest-HP allies for 140% ATK each. Grant them +12% ATK speed for 4s.' },
    wind_squire:     { name: 'Gust Slash',       desc: 'Slash nearby enemies, dealing 140% ATK and applying +15% move speed to self and allies for 4s.' },
    sky_knight:      { name: 'Aegis Guard',      desc: 'Block next incoming damage, redirect it as AoE around self. Grant nearby allies Shield equal to 15% max HP.' },
    gust_sentinel:   { name: 'Cyclone Guard',    desc: 'Gain Shield equal to 28% max HP. For 4s, redirect all projectiles targeting nearby allies to self.' },
    monsoon_caller:  { name: 'Tornado',          desc: 'Summon tornado at location. Deals 200% ATK over 3s to enemies in area (2-cell radius). Silence them 2s.' },
    wind_duelist:    { name: 'Cyclone Slash',    desc: 'Spin slash, dealing 190% ATK in area. Gain 30% dodge for 3s. Reset dodge stacks.' },
    storm_sovereign: { name: 'Thunder Cleave',   desc: 'Teleport to lowest-HP enemy and deal 280% ATK. Adjacent enemies take 100% ATK splash.' },
    void_wyrm:       { name: 'Dimensional Rift', desc: 'PASSIVE: When any ally casts ability, fire bolt at random enemy for 90% ATK. Fires more often with ability-heavy teams.' },

    // --- LIGHTNING BASE ---
    spark_fencer:    { name: 'Crackle Slash',    desc: 'Slash with electric arc, dealing 150% ATK to target and adjacent enemies. Apply chain bonus for 3s.' },
    volt_runner:     { name: 'Volt Dash',        desc: 'Dash through target, dealing 210% ATK and applying chain damage bonus. Reset dash cooldown if crits.' },
    thunder_archer:  { name: 'Lightning Arrow',  desc: 'Shoot arrow that chains to enemies. Deal 170% ATK to each target hit.' },
    pulse_mender:    { name: 'Shock Pulse',      desc: 'Heal lowest-HP ally for 145% ATK. Chain heal to 1 nearby ally for 80% ATK.' },
    tesla_knight:    { name: 'Tesla Barrier',    desc: 'Gain Shield equal to 25% max HP. Allies within 1 cell gain Shield equal to 12% max HP. Reflect 25% of absorbed damage.' },
    shock_mage:      { name: 'Chain Lightning',  desc: 'Cast lightning at target, chains to 2 nearby enemies. Deal 170% ATK to each. Refund 20 mana per crit.' },
    ball_lightning:  { name: 'Sphere Summoning', desc: 'Summon ball lightning at location. It rolls toward enemies, dealing 180% ATK to each it hits and chaining damage.' },
    thunder_warden:  { name: 'Lightning Prison', desc: 'Emit lightning that stuns nearby enemies 1s and applies chain damage. Grant self 8% DR per Lightning ally for 5s.' },
    thunderbird:     { name: 'Lightning Descent', desc: 'Dive at lowest-HP enemy dealing 240% ATK and applying chain damage. Stun nearby enemies 0.8s.' },
    storm_dragon:    { name: 'Cataclysmic Storm', desc: 'PASSIVE: Every 6s, strike target with lightning dealing 300% ATK and chaining to all nearby enemies. Chains crit at 50%.' },

    // --- FORCE BASE ---
    iron_soldier:    { name: 'Power Strike',     desc: 'Deliver devastating punch, dealing 160% ATK. Grant nearby allies +12% ATK for 3s.' },
    shadow_blade:    { name: 'Killing Blow',     desc: 'Dash to target, deal 220% ATK. If target below 40% HP, guaranteed crit dealing 340% instead.' },
    steel_archer:    { name: 'Piercing Shot',    desc: 'Fire arrow that pierces all enemies, dealing 170% ATK each. Apply 18% DR reduction to targets.' },
    war_cleric:      { name: 'Holy Strike',      desc: 'Heal lowest-HP ally for 150% ATK. Deal 100% ATK damage to nearest enemy.' },
    battle_mage:     { name: 'Force Bolt',       desc: 'Hurl force projectile, dealing 210% ATK and knocking back target 1 cell. Reset projectile on kill.' },
    shield_bearer:   { name: 'Impenetrable Wall', desc: 'Gain Shield equal to 30% max HP. Grant nearby allies Shield equal to 15% max HP. Block next CC effect.' },
    gladiator:       { name: 'Brutal Strike',    desc: 'Perform powerful strike, dealing 220% ATK and applying 15% DR reduction to target for 4s.' },
    fortress:        { name: 'Defensive Stance', desc: 'Gain +12% DR for 6s. Taunt nearby enemies for 2s and reduce their ATK by 20%.' },
    siege_engineer:  { name: 'Artillery Strike', desc: 'Target furthest enemy and deal 280% ATK. Create impact crater (40% slow, 3s) around target.' },
    titan_lord:      { name: 'Earthshaker',      desc: 'PASSIVE: Every 7s, slam ground dealing 320% ATK in area. Enemies rooted 2s and take 20% more damage for 5s. Force allies +15% ATK.' },

    // --- FIRE EVOLVED ---
    fire_berserker:   { name: 'Inferno Slash',     desc: 'Slash forward dealing 200% ATK to target + adjacent enemies. Apply Burn (25 DPS, 4s).' },
    flame_rogue:      { name: 'Phantom Blaze',     desc: 'Dash behind target, dealing 250% ATK and leaving fire trail (25 DPS, 3s). Refund 50 mana on kill.' },
    cinder_marksman:  { name: 'Fire Barrage',      desc: 'Fire 2 arrows (120% ATK each) and apply Burn (15 DPS, 3s). Enemies hit take +20% burn damage.' },
    ember_saint:      { name: 'Holy Inferno',      desc: 'Heal lowest-HP ally for 160% ATK. Grant +15% ATK for 4s. Apply Burn (15 DPS, 3s) to nearest enemy.' },
    volcano_titan:    { name: 'Volcanic Eruption',  desc: 'Explode ground in large AoE, dealing 200% ATK and applying Burn (25 DPS, 4s). Gain Shield equal to 30% max HP for 5s.' },
    inferno_lancer:   { name: 'Inferno Lance',     desc: 'Dash forward in a line, dealing 220% ATK to all enemies and applying Burn (18 DPS, 3s). Lifesteal based on Momentum stacks.' },

    // --- WATER EVOLVED ---
    tsunami_blade:    { name: 'Tsunami Slash',     desc: 'Slash forward dealing 200% ATK. Apply 20% Slow for 4s. Heal self for 30% of damage dealt.' },
    ice_sniper:       { name: 'Frozen Barrage',    desc: 'Shoot freeze projectile dealing 210% ATK. Apply 25% Slow for 4s. Slowed targets take 12% more damage.' },
    tidal_phantom:    { name: 'Phantom Strike',    desc: 'Teleport behind target dealing 280% ATK. Guaranteed crit against Slowed targets. Gain stealth for 2s.' },
    ocean_sage:       { name: 'Ocean\'s Blessing', desc: 'Heal 2 lowest-HP allies for 180% ATK each. Grant 12% DR for 5s. Cleanse one debuff.' },
    abyssal_mage:     { name: 'Abyssal Bolt',      desc: 'Launch water blast dealing 240% ATK. Chain to 2 nearby enemies. Apply 25% Slow for 4s.' },
    armored_sentinel: { name: 'Fortress Stance',   desc: 'Gain Shield equal to 32% max HP. All Water allies within 3 cells gain Shield equal to 18% max HP.' },

    // --- EARTH EVOLVED ---
    mountain_lord:    { name: 'Mountain Barrier',   desc: 'Gain Shield equal to 35% max HP. Allies within 2 cells gain Shield equal to 18% max HP. Transfer DR stacks.' },
    ironwood_sentinel:{ name: 'Ironwood Bash',     desc: 'Deal 170% ATK and stun 1.5s. Gain Shield equal to 22% max HP. All nearby allies gain Shield equal to 14% max HP.' },
    thornwood_ranger: { name: 'Thorn Shot',        desc: 'Shoot projectile dealing 200% ATK. Root target for 2s and apply 15% slow. Grant self +18% ATK for 4s.' },
    gaia_priest:      { name: 'Gaia\'s Blessing',  desc: 'Heal 2 lowest-HP allies for 180% ATK. Grant Shield equal to 15% max HP. Allies gain first CC immunity.' },
    geomancer:        { name: 'Crystal Barrage',   desc: 'Deal 240% ATK in wide area. Root enemies 2s. Grant allies in area Shield equal to 20% max HP.' },
    quake_reaper:     { name: 'Earthquake Strike',  desc: 'Burrow and emerge dealing 260% ATK to target and nearby enemies. Root 2s. Stun 0.5s.' },

    // --- WIND EVOLVED ---
    storm_assassin:   { name: 'Storm Slash',       desc: 'Dash to target dealing 260% ATK. Grant self 30% dodge for 3s. Resets on kill.' },
    gale_sniper:      { name: 'Gale Barrage',      desc: 'Pierce Shot penetrates all enemies dealing 210% ATK each. Grant self 15% dodge and +22% ATK speed for 4s.' },
    stormweaver:      { name: 'Storm Breeze',      desc: 'Heal 3 lowest-HP allies for 170% ATK each. Grant +18% ATK speed for 5s.' },
    zephyr_warrior:   { name: 'Zephyr Slash',      desc: 'Slash nearby enemies dealing 170% ATK. Grant self and allies +20% ATK speed and move speed for 4s.' },
    aegis_paladin:    { name: 'Divine Guard',      desc: 'Block next incoming damage. Redirect as AoE. Grant allies within 3 cells Shield equal to 20% max HP and 5% DR.' },
    tempest_guardian: { name: 'Tempest Guard',     desc: 'Gain Shield equal to 35% max HP. Redirect projectiles in 3-cell radius to self for 5s. Reflect 35% absorbed damage.' },

    // --- LIGHTNING EVOLVED ---
    arc_duelist:      { name: 'Arc Slash',          desc: 'Slash dealing 190% ATK to target and nearby enemies. Chain damage scales with Lightning synergy. Apply chain bonus for 4s.' },
    lightning_phantom:{ name: 'Lightning Dash',    desc: 'Dash through target dealing 260% ATK. Hits twice on crit. Reset dash on crit.' },
    storm_archer:     { name: 'Storm Arrow',       desc: 'Shoot piercing arrow dealing 210% ATK to each target. Chains to 2 extra enemies. Resets on crit.' },
    storm_medic:      { name: 'Storm Pulse',       desc: 'Heal lowest-HP ally for 180% ATK. Chain heal to 2 nearby allies for 100% ATK each.' },
    storm_bastion:    { name: 'Storm Barrier',     desc: 'Gain Shield equal to 32% max HP. Allies within 2 cells gain Shield equal to 15% max HP. Reflect 40% of absorbed damage.' },
    tempest_mage:     { name: 'Tempest Lightning', desc: 'Cast lightning chaining to 3 enemies. Deal 210% ATK each. Refund 40 mana per crit.' },

    // --- FORCE EVOLVED ---
    legionnaire:      { name: 'Legion Strike',     desc: 'Deal 200% ATK and apply 10% DR reduction to target for 4s. Grant nearby allies +15% ATK for 4s.' },
    night_stalker:    { name: 'Assassination',     desc: 'Dash to target dealing 270% ATK. Guaranteed crit below 40% HP. Resets on kill. Gain 15% lifesteal for 3s.' },
    ballista_archer:  { name: 'Ballista Shot',     desc: 'Fire 2 piercing arrows dealing 200% ATK each. Apply 25% DR reduction to all targets hit.' },
    battle_priest:    { name: 'Holy Wrath',        desc: 'Heal lowest-HP ally for 180% ATK. Deal 130% ATK damage to all nearby enemies.' },
    force_archmage:   { name: 'Force Blast',       desc: 'Hurl force projectile dealing 260% ATK. Knock back 2 cells. Ignore 18% DR.' },
    bastion:          { name: 'Fortress Wall',     desc: 'Gain Shield equal to 38% max HP. Grant nearby allies Shield equal to 20% max HP. Grant CC immunity for 3s.' },

    // --- FIRE T3-T5 EVOLVED ---
    arcane_inferno:      { name: 'Infernal Storm Enhanced', desc: 'Cast storm at location creating persistent fire zones. Deal 250% ATK over 4s. Apply Burn (30 DPS, 4s). Burn reapplies on zone entry.' },
    ninetail_blaze:      { name: 'Spirit Rush Enhanced', desc: 'Dash 5 times to 5 different enemies over 2s, dealing 120% ATK each. Final target takes 240%. Apply Burn to all hit.' },
    elder_wyrm:          { name: 'Breath Weapon Enhanced', desc: 'Breathe fire in extended cone dealing 280% ATK. Stun all hit for 2s. Apply Burn (30 DPS, 4s) in area.' },
    eternal_phoenix:     { name: 'Rebirth Enhanced',     desc: 'PASSIVE: On death, revive after 2s at 70% HP. Always triggers. Explode on revive for 250% ATK. Fire allies gain 20% ATK for 6s.' },

    // --- WATER T3-T5 EVOLVED ---
    stormtide_oracle:    { name: 'Tidal Surge',          desc: 'Heal lowest-HP ally for 200% ATK. Grant 25% dodge for 4s. Apply 18% Slow to 2 nearest enemies.' },
    tsunami_warlord:     { name: 'Maelstrom Spin',       desc: 'Spin dealing 230% ATK to all nearby enemies. Apply 30% Slow. Heal for 35% of damage dealt. Stun Slowed enemies 0.5s.' },
    abyssal_terror:      { name: 'Maelstrom Enhanced',    desc: 'Deal 400% ATK total over 4s, pulling enemies 2 cells per second. Apply Slow (30%, 4s) to all in area.' },
    primordial_leviathan:{ name: 'Tidal Guardian Enhanced', desc: 'PASSIVE: Water allies gain 18% max HP and 12% DR. Enemies lose 12 mana on hit. Start with 400 shield. Every 7s, pull enemies 1 cell closer.' },

    // --- EARTH T3-T5 EVOLVED ---
    iron_colossus:       { name: 'Ground Slam Enhanced', desc: 'Slam ground dealing 250% ATK. Stun for 1.8s. Grant 22% DR to nearby allies for 4s. Reduces AoE damage taken by 18%.' },
    earthweaver:         { name: 'Earthen Barrage',      desc: 'Launch 5 earth projectiles dealing 180% ATK each. Reduce enemy ATK by 25% for 4s. Grant allies 25% max HP shields.' },
    world_sentinel:      { name: 'Nature\'s Wrath',      desc: 'Deal 300% ATK to target. Root for 3s. Heal self for 25% of damage dealt. Grant immunity to slows.' },
    yggdrasil:           { name: 'Bloom of Life Enhanced', desc: 'PASSIVE: Every 6s, heal 4 allies for 350% ATK. Overhealing converts to Shield (80%). Earth allies +15% healing. Dead allies revive once at 30% HP.' },

    // --- WIND T3-T5 EVOLVED ---
    tempest_lord:        { name: 'Tornado Enhanced',     desc: 'Summon tornado in 3-cell radius dealing 300% ATK. Silence all hit for 3s. Knock back enemies 1 cell.' },
    hurricane_blade:     { name: 'Cyclone Slash',        desc: 'Spin dealing 260% ATK to nearby enemies. Grant self 45% dodge for 4s. Apply Slow to all hit.' },
    tempest_emperor:     { name: 'Thunder Cleave',       desc: 'Deal 380% ATK in 2-cell splash. Guaranteed crit. Apply 15% Slow. Resets on kill.' },
    dimensional_dragon:  { name: 'Dimensional Rift Enhanced', desc: 'PASSIVE: When ally casts ability, fire 2 bolts at 120% ATK each. Every 10s, open rift dealing 150% ATK area damage.' },

    // --- LIGHTNING T3-T5 EVOLVED ---
    plasma_core:         { name: 'Sphere Summoning',     desc: 'Summon 2 lightning balls that orbit and deal 25 DPS each. Balls chain to enemies, applying +18% damage taken for 4s.' },
    storm_fortress:      { name: 'Lightning Prison Enhanced', desc: 'Create 2-cell radius prison. Stun for 1.5s. Grant 10% DR per ally inside. Excess crits convert to 1s stuns.' },
    roc_of_storms:       { name: 'Lightning Descent Enhanced', desc: 'Dive dealing 330% ATK. Stun for 1.5s. Chain lightning to nearby enemies. First hit guarantees crit.' },
    thunder_god:         { name: 'Cataclysmic Storm Enhanced', desc: 'PASSIVE: Every 4.5s, strike dealing 450% ATK. Chain to all nearby enemies. Chains always crit. Lightning allies +25% crit damage.' },

    // --- FORCE T3-T5 EVOLVED ---
    champion:            { name: 'Brutal Strike Enhanced', desc: 'Deal 320% ATK. Apply 25% DR reduction for 4s. Stun target 0.8s on kill. Triggers every 2 attacks.' },
    citadel:             { name: 'Defensive Stance Enhanced', desc: 'Gain +18% DR for 8s. Taunt at 2-cell range for 3s. Reduce enemy ATK by 30%. Immune to all CC.' },
    war_architect:       { name: 'Artillery Strike Enhanced', desc: 'Deal 380% ATK to furthest enemy. 2-cell crater with 50% slow for 4s. Ignore 25% DR.' },
    cosmic_titan:        { name: 'Earthshaker Enhanced', desc: 'PASSIVE: Every 5.5s, slam dealing 480% ATK. Root 3s. Damage amp 25% for 6s. Force allies +20% ATK and +10% DR.' }
};

// =============================================================================
// PASSIVE DATA (60 base unit innate passives)
// =============================================================================

var PASSIVE_DATA = {
    // --- FIRE ---
    flame_warrior:   { name: 'Heated Blows',     desc: 'Every 3rd auto-attack deals 25% bonus damage.', trigger: 'on_attack', params: { interval: 3, bonusDamage: 0.25 } },
    ember_scout:     { name: 'First Blood',      desc: 'First attack after entering combat deals 50% bonus damage.', trigger: 'combat_start', params: { bonusDamage: 0.50 } },
    cinder_archer:   { name: 'Ignition',         desc: 'Auto-attacks against Burning enemies deal 20% bonus damage.', trigger: 'on_attack', params: { conditionalBonus: 0.20, condition: 'target_burning' } },
    fire_acolyte:    { name: 'Cauterize',        desc: 'Heals also apply Burn (8 DPS, 2s) to the nearest enemy.', trigger: 'on_attack', params: { burnDps: 8, burnDuration: 2 } },
    magma_knight:    { name: 'Molten Armor',     desc: 'When hit by melee attack, deals 15 fire damage back to attacker.', trigger: 'on_hit', params: { reflectDamage: 15 } },
    blaze_lancer:    { name: 'Momentum',         desc: 'Consecutive hits on the same target increase damage by 8% per stack (max 5).', trigger: 'on_attack', params: { damagePerStack: 0.08, maxStacks: 5 } },
    pyromancer:      { name: 'Pyromaniac',       desc: 'Burn effects on enemies hit by Pyromancer last 50% longer and deal 20% more DPS.', trigger: 'on_attack', params: { burnDurationMultiplier: 1.5, burnDpsMultiplier: 1.20 } },
    inferno_fox:     { name: 'Foxfire',          desc: 'Leaves fire trail when moving. Trail lasts 2.5s and deals 18 DPS to enemies on it.', trigger: 'periodic', params: { trailDps: 18, trailDuration: 2.5 } },
    fire_dragon:     { name: 'Dragonfire Aura',  desc: 'Enemies within 2 cells take 20 fire damage per second.', trigger: 'aura', params: { auraDps: 20, range: 2 } },
    phoenix:         { name: 'Eternal Flame',    desc: 'While alive, all Fire allies gain 15% ATK and 8% lifesteal. On revival, aura doubles for 6s.', trigger: 'aura', params: { atkBonus: 0.15, lifesteal: 0.08, range: 999 } },

    // --- WATER ---
    tide_hunter:     { name: 'Undertow',         desc: 'When Tide Hunter takes damage, the attacker is slowed 8% for 2.5s.', trigger: 'on_hit', params: { slowPct: 0.08, slowDuration: 2.5 } },
    frost_archer:    { name: 'Chill',            desc: 'Auto-attacks have 25% chance to slow target attack speed by 15% for 2s.', trigger: 'on_attack', params: { procChance: 0.25, slowPct: 0.15, slowDuration: 2 } },
    reef_stalker:    { name: 'Slippery',         desc: 'After dashing, gain 20% dodge for 3s.', trigger: 'on_attack', params: { dodgeBonus: 0.20, dodgeDuration: 3 } },
    coral_priest:    { name: 'Soothing Mists',   desc: 'Allies within 2.5 cells passively heal 0.8% max HP per second.', trigger: 'aura', params: { healPct: 0.008, range: 2.5 } },
    hydro_mage:      { name: 'Torrent',          desc: 'Abilities deal 18% bonus damage to Slowed targets.', trigger: 'on_attack', params: { bonusDamage: 0.18, condition: 'target_slowed' } },
    shell_knight:    { name: 'Shell Defense',    desc: 'Start combat with Shield equal to 18% max HP. On taking heavy hit, gain 8% DR for 3s.', trigger: 'combat_start', params: { shieldPct: 0.18, drThreshold: 0.15, drBonus: 0.08, drDuration: 3 } },
    tidal_shaman:    { name: 'Scepter of Tides', desc: 'Heals also apply Slow (12% AS, 2s) to nearest enemy.', trigger: 'on_attack', params: { slowPct: 0.12, slowDuration: 2 } },
    riptide_blade:   { name: 'Current',          desc: 'Attacks against Slowed enemies have 25% chance to grant +25% ATK for 3s.', trigger: 'on_attack', params: { procChance: 0.25, atkBonus: 0.25, atkDuration: 3, condition: 'target_slowed' } },
    kraken:          { name: 'Ink Cloud',        desc: 'Every 15s, release ink cloud (2-cell radius). Enemies in it have 35% miss chance for 3s.', trigger: 'periodic', params: { cooldown: 15, range: 2, missChance: 0.35, duration: 3 } },
    leviathan:       { name: 'Abyssal Depths',   desc: 'Every 10s, submerge for 1.5s (untargetable). On resurfacing, deal 120% ATK and apply Slow (25% AS, 4s).', trigger: 'periodic', params: { cooldown: 10, submergeDuration: 1.5, emergeDamage: 1.20, slowPct: 0.25, slowDuration: 4 } },

    // --- EARTH ---
    stone_guard:     { name: 'Fortify',          desc: 'Gain 4% DR for every ally within 2.5 cells (max 20%).', trigger: 'aura', params: { drPerAlly: 0.04, range: 2.5, max: 0.20 } },
    bramble_knight:  { name: 'Thorns',           desc: 'Melee attackers take 12 damage when hitting Bramble Knight.', trigger: 'on_hit', params: { reflectDamage: 12 } },
    seedling_archer: { name: 'Overgrowth',       desc: 'Every 6s in combat, gain a stack of +4% ATK (max 6 stacks, +24%).', trigger: 'periodic', params: { cooldown: 6, atkPerStack: 0.04, maxStacks: 6 } },
    earth_shaman:    { name: 'Grounding',        desc: 'Allies healed by Earth Shaman gain 12% CC resistance for 4s.', trigger: 'on_attack', params: { ccResist: 0.12, duration: 4 } },
    crystal_mage:    { name: 'Crystal Shell',    desc: 'Start combat with Shield equal to 22% max HP. Shield reforms after 8s if broken.', trigger: 'combat_start', params: { shieldPct: 0.22, reformCooldown: 8 } },
    mud_stalker:     { name: 'Burrow',           desc: 'At combat start, burrow underground for 2s (untargetable). Emerge at furthest enemy. First attack guaranteed crit.', trigger: 'combat_start', params: { burrowDuration: 2, guaranteedCrit: true } },
    golem:           { name: 'Immovable',        desc: 'Cannot be knocked back, pulled, or displaced. Takes 12% reduced damage from AoE.', trigger: 'combat_start', params: { displacementImmune: true, aoeDR: 0.12 } },
    terra_sage:      { name: 'Living Earth',     desc: 'Every time Terra Sage casts ability, nearest ally gains Shield equal to 18% max HP.', trigger: 'on_attack', params: { allyShieldPct: 0.18 } },
    ancient_treant:  { name: 'Deep Roots',       desc: 'Cannot be slowed below 75% of base move speed. Regenerate 1.2% max HP/sec while standing still.', trigger: 'combat_start', params: { minMoveSpeedPct: 0.75, regenPct: 0.012 } },
    world_tree:      { name: 'Roots of Life',    desc: 'Allies heal 1.2% max HP per second passively, even if silenced/stunned.', trigger: 'aura', params: { healPct: 0.012, range: 999 } },

    // --- WIND ---
    zephyr_scout:    { name: 'Windwalk',         desc: 'After killing target, gain 35% move speed for 2.5s.', trigger: 'on_kill', params: { moveSpdBonus: 0.35, duration: 2.5 } },
    wind_archer:     { name: 'Tailwind',         desc: 'Gain 6% attack speed for each Wind ally on team (including self).', trigger: 'aura', params: { atkSpdPerAlly: 0.06, element: 'wind' } },
    gale_dancer:     { name: 'Zephyr\'s Grace',  desc: 'After casting ability, gain 28% move speed for 3s.', trigger: 'on_attack', params: { moveSpdBonus: 0.28, duration: 3 } },
    wind_squire:     { name: 'Momentum',         desc: 'Gain +8% ATK speed after hitting. Stacks up to 4 times (32%).', trigger: 'on_attack', params: { atkSpdPerStack: 0.08, maxStacks: 4 } },
    sky_knight:      { name: 'Inspiring Presence', desc: 'Allies within 2.5 cells gain 6% damage bonus.', trigger: 'aura', params: { dmgBonus: 0.06, range: 2.5 } },
    gust_sentinel:   { name: 'Deflection',       desc: '12% chance to deflect ranged attacks (bounce to random nearby enemy for 50% damage).', trigger: 'on_hit', params: { deflectChance: 0.12, deflectDamage: 0.50 } },
    monsoon_caller:  { name: 'Updraft',          desc: 'Kills grant all Wind allies 10% ATK speed for 5s (stacks up to 4 times).', trigger: 'on_kill', params: { atkSpdBonus: 0.10, duration: 5, maxStacks: 4, element: 'wind' } },
    wind_duelist:    { name: 'Dance of Blades',  desc: 'Every attack grants +5% dodge (max 5 stacks).', trigger: 'on_attack', params: { dodgePerStack: 0.05, maxStacks: 5 } },
    storm_sovereign: { name: 'Lightning Speed',  desc: 'First auto-attack after repositioning guarantees crit.', trigger: 'on_attack', params: { guaranteedCrit: true, condition: 'after_reposition' } },
    void_wyrm:       { name: 'Reality Warp',     desc: 'Auto-attacks teleport target 1 cell in random direction (3s cooldown per target).', trigger: 'on_attack', params: { teleportDistance: 1, cooldownPerTarget: 3 } },

    // --- LIGHTNING ---
    spark_fencer:    { name: 'Static Charge',    desc: 'Attacks against enemies near another Lightning unit deal 18% bonus and chain 60 damage.', trigger: 'on_attack', params: { bonusDamage: 0.18, chainDamage: 60, range: 1 } },
    volt_runner:     { name: 'Dash Chain',       desc: 'Each dash grants +20% crit chance for 2s (stacks).', trigger: 'on_attack', params: { critPerStack: 0.20, duration: 2 } },
    thunder_archer:  { name: 'Charged Shot',     desc: 'Every 3 attacks, next attack deals 40% bonus damage and chains to 1 nearby enemy.', trigger: 'on_attack', params: { interval: 3, bonusDamage: 0.40, chainCount: 1 } },
    pulse_mender:    { name: 'Defibrillator',    desc: 'Heals grant healed ally +8% crit chance for 3s.', trigger: 'on_attack', params: { critBonus: 0.08, duration: 3 } },
    tesla_knight:    { name: 'Lightning Conductor', desc: 'Enemies hitting Tesla Knight within 1 cell gain +15% damage taken for 3s.', trigger: 'on_hit', params: { damageAmpPct: 0.15, range: 1, duration: 3 } },
    shock_mage:      { name: 'Electrocution',    desc: 'Abilities have 18% chance to crit and chain to 1 additional target.', trigger: 'on_attack', params: { abilityCritChance: 0.18, chainCount: 1 } },
    ball_lightning:  { name: 'Rolling Thunder',  desc: 'Creates persistent lightning orb (5s). Orb damages nearby enemies 15 DPS. Enemies hitting it take +12% damage.', trigger: 'periodic', params: { orbDuration: 5, orbDps: 15, damageAmp: 0.12 } },
    thunder_warden:  { name: 'Overcharge',       desc: 'Converts excess crits into stuns. Takes +8% crit damage.', trigger: 'on_hit', params: { critDamageIncrease: 0.08, critToStun: true } },
    thunderbird:     { name: 'Aerial Superiority', desc: 'Gains +20% ATK. First attack each combat guarantees crit.', trigger: 'combat_start', params: { atkBonus: 0.20, firstAttackCrit: true } },
    storm_dragon:    { name: 'Superconductor',   desc: 'All Lightning allies gain +18% crit chance. Storm Dragon crits grant nearby Lightning allies +25% ATK for 3s.', trigger: 'aura', params: { allyCritBonus: 0.18, critAtkBonus: 0.25, critAtkDuration: 3, element: 'lightning' } },

    // --- FORCE ---
    iron_soldier:    { name: 'Iron Skin',        desc: 'Gain 6% DR per Force ally (including self).', trigger: 'aura', params: { drPerAlly: 0.06, element: 'force' } },
    shadow_blade:    { name: 'Shadow Step',      desc: 'After kill, gain +25% move speed and dodge for 2s.', trigger: 'on_kill', params: { moveSpdBonus: 0.25, dodgeBonus: 0.25, duration: 2 } },
    steel_archer:    { name: 'Steady Aim',       desc: 'Gain +8% damage per second standing still (max 40%).', trigger: 'periodic', params: { damagePerSecond: 0.08, maxBonus: 0.40 } },
    war_cleric:      { name: 'War Prayer',       desc: 'Heals grant healed ally +8% ATK and +5% DR for 4s.', trigger: 'on_attack', params: { atkBonus: 0.08, drBonus: 0.05, duration: 4 } },
    battle_mage:     { name: 'Telekinetic Force', desc: 'Abilities ignore 12% of enemy DR.', trigger: 'on_attack', params: { drIgnore: 0.12 } },
    shield_bearer:   { name: 'Fortified Defense', desc: 'Nearby allies gain 5% DR and start with Shield equal to 10% max HP.', trigger: 'aura', params: { allyDR: 0.05, allyShieldPct: 0.10, range: 2 } },
    gladiator:       { name: 'Arena Master',     desc: 'Every 3 attacks, gain +40% ATK for next attack.', trigger: 'on_attack', params: { interval: 3, bonusDamage: 0.40 } },
    fortress:        { name: 'Unbreakable Will', desc: 'Cannot be Rooted, Stunned, or Slowed below base move speed.', trigger: 'combat_start', params: { ccImmune: true } },
    siege_engineer:  { name: 'War Machine',      desc: 'Attacks ignore 15% of target DR.', trigger: 'on_attack', params: { drIgnore: 0.15 } },
    titan_lord:      { name: 'Colossus',         desc: 'Gain +25% max HP. Every 5th hit stuns target 1s. First CC immunity per combat.', trigger: 'combat_start', params: { hpBonus: 0.25, stunInterval: 5, stunDuration: 1, firstCcImmune: true } }
};

// =============================================================================
// EVOLVED PASSIVE DATA (60 evolved unit passives)
// =============================================================================

var EVOLVED_PASSIVE_DATA = {
    // --- FIRE EVOLVED ---
    fire_berserker:   { name: 'Scorching Blows',       desc: 'Every 2.5 attacks deals 40% bonus damage and applies Burn (25 DPS, 4s).', trigger: 'on_attack', params: { interval: 2.5, bonusDamage: 0.40, burnDps: 25, burnDuration: 4 } },
    flame_rogue:      { name: 'First Blood Enhanced',   desc: 'First attack deals 80% bonus and ignores 50% DR.', trigger: 'combat_start', params: { bonusDamage: 0.80, drIgnore: 0.50 } },
    cinder_marksman:  { name: 'Ignition Amplified',     desc: 'Attacks vs Burning enemies deal 30% bonus. Applies 10 DPS Burn.', trigger: 'on_attack', params: { conditionalBonus: 0.30, burnDps: 10, condition: 'target_burning' } },
    ember_saint:      { name: 'Cauterize Aura',         desc: 'Heals apply Burn (8 DPS, 2s) to 2 nearest enemies.', trigger: 'on_attack', params: { burnDps: 8, burnDuration: 2, targets: 2 } },
    volcano_titan:    { name: 'Molten Armor Enhanced',   desc: 'Deals 25 damage and leaves 3s lava pool (30 DPS).', trigger: 'on_hit', params: { reflectDamage: 25, lavaPoolDps: 30, lavaPoolDuration: 3 } },
    inferno_lancer:   { name: 'Momentum Mastery',       desc: 'Stacks increase to 10% and grant 5% lifesteal per stack.', trigger: 'on_attack', params: { damagePerStack: 0.10, maxStacks: 5, lifestealPerStack: 0.05 } },

    // --- WATER EVOLVED ---
    tsunami_blade:    { name: 'Undertow Enhanced',      desc: 'Attackers slowed 12% for 3s and lose 5 mana.', trigger: 'on_hit', params: { slowPct: 0.12, slowDuration: 3, manaSteal: 5 } },
    ice_sniper:       { name: 'Chill Amplified',        desc: '35% chance to slow 20% AS. Slowed targets take 12% more damage.', trigger: 'on_attack', params: { procChance: 0.35, slowPct: 0.20, damageAmp: 0.12 } },
    tidal_phantom:    { name: 'Slippery Enhanced',      desc: 'After dash, 35% dodge and stealth for 2s.', trigger: 'on_attack', params: { dodgeBonus: 0.35, stealthDuration: 2 } },
    ocean_sage:       { name: 'Soothing Mists Enhanced', desc: 'Allies heal 1.2% max HP/s. Apply Slow to enemies hitting nearby allies.', trigger: 'aura', params: { healPct: 0.012, range: 2.5, slowOnHit: true } },
    abyssal_mage:     { name: 'Torrent Amplified',      desc: 'Abilities deal 28% bonus damage to Slowed targets.', trigger: 'on_attack', params: { bonusDamage: 0.28, condition: 'target_slowed' } },
    armored_sentinel: { name: 'Shell Defense Enhanced',  desc: 'Start with 25% shield. On heavy hit, gain 12% DR for 3s.', trigger: 'combat_start', params: { shieldPct: 0.25, drBonus: 0.12, drDuration: 3 } },

    // --- EARTH EVOLVED ---
    mountain_lord:    { name: 'Fortify Enhanced',        desc: '5% DR per ally within 2.5 cells (max 25%).', trigger: 'aura', params: { drPerAlly: 0.05, range: 2.5, max: 0.25 } },
    ironwood_sentinel:{ name: 'Thorns Enhanced',        desc: 'Thorns scale with missing HP (up to 25 damage).', trigger: 'on_hit', params: { reflectDamage: 12, maxReflect: 25, scalesWithMissingHp: true } },
    thornwood_ranger: { name: 'Overgrowth Enhanced',    desc: 'Every 6s, +5% ATK per stack (max 6 stacks, +30%).', trigger: 'periodic', params: { cooldown: 6, atkPerStack: 0.05, maxStacks: 6 } },
    gaia_priest:      { name: 'Grounding Enhanced',     desc: '20% CC resistance. First CC per combat immune.', trigger: 'on_attack', params: { ccResist: 0.20, firstCcImmune: true } },
    geomancer:        { name: 'Crystal Shell Enhanced',  desc: 'Start with 30% shield. Reforms after 6s if broken.', trigger: 'combat_start', params: { shieldPct: 0.30, reformCooldown: 6 } },
    quake_reaper:     { name: 'Burrow Enhanced',        desc: 'Emergence deals AoE damage to nearby enemies. Guaranteed crit.', trigger: 'combat_start', params: { burrowDuration: 2, guaranteedCrit: true, aoeDamage: true } },

    // --- WIND EVOLVED ---
    storm_assassin:   { name: 'Windwalk Enhanced',      desc: 'After kill, 45% move speed and 20% dodge for 3s.', trigger: 'on_kill', params: { moveSpdBonus: 0.45, dodgeBonus: 0.20, duration: 3 } },
    gale_sniper:      { name: 'Tailwind Enhanced',      desc: '8% ATK speed per Wind ally. Attacks grant dodge.', trigger: 'aura', params: { atkSpdPerAlly: 0.08, element: 'wind', grantDodge: true } },
    stormweaver:      { name: 'Zephyr\'s Grace Enhanced', desc: '35% move speed after cast for 4s.', trigger: 'on_attack', params: { moveSpdBonus: 0.35, duration: 4 } },
    zephyr_warrior:   { name: 'Momentum Enhanced',      desc: '+8% ATK speed per hit, stacks 5 times (40%).', trigger: 'on_attack', params: { atkSpdPerStack: 0.08, maxStacks: 5 } },
    aegis_paladin:    { name: 'Inspiring Enhanced',     desc: 'Allies in 2.5 cells gain 8% damage and 5% DR.', trigger: 'aura', params: { dmgBonus: 0.08, drBonus: 0.05, range: 2.5 } },
    tempest_guardian: { name: 'Deflection Enhanced',    desc: '20% deflect chance. Reflect 35% absorbed damage.', trigger: 'on_hit', params: { deflectChance: 0.20, reflectDamage: 0.35 } },

    // --- LIGHTNING EVOLVED ---
    arc_duelist:      { name: 'Static Charge Enhanced',  desc: '25% bonus damage to enemies near Lightning allies. Chains to 2 targets.', trigger: 'on_attack', params: { bonusDamage: 0.25, chainCount: 2, range: 1 } },
    lightning_phantom:{ name: 'Dash Chain Enhanced',    desc: '+25% crit and +10% move speed per dash stack.', trigger: 'on_attack', params: { critPerStack: 0.25, moveSpdPerStack: 0.10, duration: 2 } },
    storm_archer:     { name: 'Charged Shot Enhanced',   desc: 'Every 2 attacks, 40% bonus and chains to 2 enemies.', trigger: 'on_attack', params: { interval: 2, bonusDamage: 0.40, chainCount: 2 } },
    storm_medic:      { name: 'Defibrillator Enhanced',  desc: 'Heals grant +12% crit and +5% ATK speed for 3s.', trigger: 'on_attack', params: { critBonus: 0.12, atkSpdBonus: 0.05, duration: 3 } },
    storm_bastion:    { name: 'Conductor Enhanced',     desc: 'Enemies in 2-cell radius gain +15% damage taken. Scales with synergy.', trigger: 'on_hit', params: { damageAmpPct: 0.15, range: 2, scalesWithSynergy: true } },
    tempest_mage:     { name: 'Electrocution Enhanced',  desc: '25% ability crit chance. Chains to 2 targets.', trigger: 'on_attack', params: { abilityCritChance: 0.25, chainCount: 2 } },

    // --- FORCE EVOLVED ---
    legionnaire:      { name: 'Iron Skin Enhanced',     desc: '8% DR per Force ally and +5% HP.', trigger: 'aura', params: { drPerAlly: 0.08, hpBonus: 0.05, element: 'force' } },
    night_stalker:    { name: 'Shadow Step Enhanced',   desc: 'After kill, 35% move speed and 20% dodge for 3s.', trigger: 'on_kill', params: { moveSpdBonus: 0.35, dodgeBonus: 0.20, duration: 3 } },
    ballista_archer:  { name: 'Steady Aim Enhanced',    desc: '+10% damage per second standing still (max 50%).', trigger: 'periodic', params: { damagePerSecond: 0.10, maxBonus: 0.50 } },
    battle_priest:    { name: 'War Prayer Enhanced',    desc: 'Heals grant +12% ATK and +8% DR for 4s.', trigger: 'on_attack', params: { atkBonus: 0.12, drBonus: 0.08, duration: 4 } },
    force_archmage:   { name: 'Telekinetic Enhanced',   desc: 'Abilities ignore 18% DR and deal +8% damage.', trigger: 'on_attack', params: { drIgnore: 0.18, bonusDamage: 0.08 } },
    bastion:          { name: 'Fortified Enhanced',     desc: 'Allies gain 8% DR and 12% starting shield.', trigger: 'aura', params: { allyDR: 0.08, allyShieldPct: 0.12, range: 2 } },

    // --- FIRE T3-T5 EVOLVED ---
    arcane_inferno:      { name: 'Pyromaniac Enhanced',      desc: 'Burn effects last 70% longer and deal 35% more DPS. Fire zones reapply burn on entry.', trigger: 'on_attack', params: { burnDurationMultiplier: 1.7, burnDpsMultiplier: 1.35, zoneReapply: true } },
    ninetail_blaze:      { name: 'Foxfire Enhanced',         desc: 'Fire trail lasts 4s, deals 30 DPS, and applies Burn (10 DPS, 2s) to enemies on it.', trigger: 'periodic', params: { trailDps: 30, trailDuration: 4, burnDps: 10, burnDuration: 2 } },
    elder_wyrm:          { name: 'Dragonfire Aura Enhanced', desc: 'Aura damage increased to 35 DPS. Extends to 3-cell range.', trigger: 'aura', params: { auraDps: 35, range: 3 } },
    eternal_phoenix:     { name: 'Eternal Flame Enhanced',   desc: 'All Fire allies gain 20% ATK and 12% lifesteal. On revival, aura doubles for 8s.', trigger: 'aura', params: { atkBonus: 0.20, lifesteal: 0.12, range: 999, revivalDuration: 8 } },

    // --- WATER T3-T5 EVOLVED ---
    stormtide_oracle:    { name: 'Scepter of Tides Enhanced', desc: 'Apply 18% slow to enemies. Heal-Slow spreads to 2 nearest enemies.', trigger: 'on_attack', params: { slowPct: 0.18, spreadTargets: 2 } },
    tsunami_warlord:     { name: 'Current Enhanced',         desc: 'Current trigger rate increases to 35% and grants +40% ATK for next attack.', trigger: 'on_attack', params: { procChance: 0.35, atkBonus: 0.40 } },
    abyssal_terror:      { name: 'Ink Cloud Enhanced',       desc: 'Ink Cloud triggers every 10s, lasts 4s, extends to 3-cell radius.', trigger: 'periodic', params: { cooldown: 10, duration: 4, range: 3 } },
    primordial_leviathan:{ name: 'Abyssal Depths Enhanced',  desc: 'Submerge every 7s for 2.5s. Resurfacing deals 150% ATK in 2-cell radius and applies Slow.', trigger: 'periodic', params: { cooldown: 7, submergeDuration: 2.5, emergeDamage: 1.50, range: 2 } },

    // --- EARTH T3-T5 EVOLVED ---
    iron_colossus:       { name: 'Immovable Enhanced',       desc: 'Reduces AoE damage by 18%. Ground Slam grants nearby allies 22% DR for 4s.', trigger: 'on_hit', params: { aoeDR: 0.18, allyDR: 0.22, allyDrDuration: 4 } },
    earthweaver:         { name: 'Living Earth Enhanced',    desc: 'Procs on every ability cast. Grants allies 25% max HP shields.', trigger: 'on_attack', params: { shieldPct: 0.25, procOnAbility: true } },
    world_sentinel:      { name: 'Deep Roots Enhanced',     desc: 'Prevents all slows. Regen 2% HP per second. Nature\'s Wrath heals for 25% of damage.', trigger: 'combat_start', params: { slowImmune: true, hpRegen: 0.02, healPctOfDamage: 0.25 } },
    yggdrasil:           { name: 'Roots of Life Enhanced',   desc: 'All allies heal 1.8% max HP per second passively, even if silenced or stunned.', trigger: 'aura', params: { healPct: 0.018, range: 999 } },

    // --- WIND T3-T5 EVOLVED ---
    tempest_lord:        { name: 'Updraft Enhanced',         desc: 'Stacks up to 6 times (60% ATK speed). Allies keep stacks for 7s after moving.', trigger: 'on_attack', params: { atkSpdPerStack: 0.10, maxStacks: 6, allyDuration: 7 } },
    hurricane_blade:     { name: 'Dance of Blades Enhanced', desc: '8% dodge per stack (max 8 stacks, 64% dodge). Cyclone Slash grants 45% dodge.', trigger: 'on_attack', params: { dodgePerStack: 0.08, maxStacks: 8 } },
    tempest_emperor:     { name: 'Lightning Speed Enhanced', desc: 'Guarantees crit on first attack. Applies 15% slow on hit. Thunder Cleave resets on kill.', trigger: 'combat_start', params: { guaranteedCrit: true, slowPct: 0.15, resetOnKill: true } },
    dimensional_dragon:  { name: 'Reality Warp Enhanced',    desc: 'Auto-attacks teleport target 2 cells and apply Slow (15% AS, 3s). 3s cooldown per target.', trigger: 'on_attack', params: { teleportDistance: 2, slowPct: 0.15, slowDuration: 3, cooldownPerTarget: 3 } },

    // --- LIGHTNING T3-T5 EVOLVED ---
    plasma_core:         { name: 'Rolling Thunder Enhanced', desc: 'Orb lasts 8s, deals 25 DPS. Enemies in orb take +18% damage. Orb bounces between enemies.', trigger: 'periodic', params: { orbDuration: 8, orbDps: 25, damageAmp: 0.18, bounces: true } },
    storm_fortress:      { name: 'Overcharge Enhanced',      desc: 'Converts excess crits into 1s stuns. Reflects 20% of crit damage converted.', trigger: 'on_hit', params: { critToStun: true, stunDuration: 1, reflectPct: 0.20 } },
    roc_of_storms:       { name: 'Aerial Superiority Enhanced', desc: '+30% ATK. First hit guarantees crit and applies Slow.', trigger: 'combat_start', params: { atkBonus: 0.30, firstAttackCrit: true, applySlow: true } },
    thunder_god:         { name: 'Superconductor Enhanced',  desc: '+25% crit chance to all Lightning allies. Crits chain to all enemies within 3 cells for +40% ATK.', trigger: 'aura', params: { allyCritBonus: 0.25, critChainRange: 3, critAtkBonus: 0.40, element: 'lightning' } },

    // --- FORCE T3-T5 EVOLVED ---
    champion:            { name: 'Arena Master Enhanced',    desc: 'Every 2 attacks, gain +60% ATK for next attack.', trigger: 'on_attack', params: { interval: 2, bonusDamage: 0.60 } },
    citadel:             { name: 'Unbreakable Will Enhanced', desc: 'Immune to all CC effects. Grants nearby allies 5% CC resistance.', trigger: 'combat_start', params: { ccImmune: true, allyCcResist: 0.05 } },
    war_architect:       { name: 'War Machine Enhanced',     desc: 'Ignores 25% DR. Applies 20% additional damage to targets hit by Artillery.', trigger: 'on_attack', params: { drIgnore: 0.25, artilleryDamageAmp: 0.20 } },
    cosmic_titan:        { name: 'Colossus Enhanced',        desc: '+35% max HP. Every 4th hit stuns for 1.5s. CC immunity for first 8s of combat.', trigger: 'combat_start', params: { hpBonus: 0.35, stunInterval: 4, stunDuration: 1.5, ccImmuneDuration: 8 } }
};

// =============================================================================
// SHOP POOL
// =============================================================================

var SHOP_POOL_KEYS = Object.keys(UNIT_TEMPLATES);

// =============================================================================
// UNIT CREATION & UTILITIES
// =============================================================================

function createUnit(templateKey) {
    var t = UNIT_TEMPLATES[templateKey];
    if (!t) return null;
    return {
        id: Math.random().toString(36).substr(2, 9),
        key: templateKey,
        name: t.name,
        emoji: t.emoji,
        cost: t.cost,
        type: t.type,
        archetype: t.archetype,
        element: t.element,
        hp: t.hp,
        maxHp: t.hp,
        attack: t.attack,
        attackSpd: t.attackSpd,
        range: t.range,
        moveSpd: t.moveSpd,
        stars: 1,
        evolved: false,
        evolvedForm: t.evolvedForm,
        items: []
    };
}

function getStarMultiplier(stars) {
    return Math.pow(1.8, stars - 1);
}

function upgradeUnit(unit) {
    unit.stars += 1;
    var tmpl = unit.evolved ? EVOLVED_TEMPLATES[unit.key] : UNIT_TEMPLATES[unit.key];
    if (!tmpl) return;
    var mult = getStarMultiplier(unit.stars);
    unit.hp = Math.floor(tmpl.hp * mult);
    unit.maxHp = Math.floor(tmpl.hp * mult);
    unit.attack = Math.floor(tmpl.attack * mult);
}

function checkEvolutionRequirements(saveData, templateKey) {
    var evo = EVOLUTIONS[templateKey];
    if (!evo) return { canEvolve: false, reason: 'No evolution path' };

    var entry = saveData.collection[templateKey];
    if (!entry) return { canEvolve: false, reason: 'Unit not owned' };

    var results = [];
    var allMet = true;

    for (var i = 0; i < evo.requirements.length; i++) {
        var req = evo.requirements[i];
        var met = false;
        var desc = '';

        switch (req.type) {
            case 'stars':
                met = entry.stars >= req.value;
                desc = req.value + '\u2605 required (current: ' + entry.stars + '\u2605)';
                break;
            default:
                desc = 'Unknown requirement: ' + req.type;
                break;
        }

        results.push({ type: req.type, met: met, desc: desc });
        if (!met) allMet = false;
    }

    return { canEvolve: allMet, requirements: results, evolvedKey: evo.evolved };
}

function checkEnemyEvolution(unit) {
    if (unit.evolved) return false;
    var evo = EVOLUTIONS[unit.key];
    if (!evo) return false;
    var starReq = 2;
    for (var i = 0; i < evo.requirements.length; i++) {
        if (evo.requirements[i].type === 'stars') {
            starReq = evo.requirements[i].value;
            break;
        }
    }
    if (unit.stars < starReq) return false;

    var evolvedTmpl = EVOLVED_TEMPLATES[evo.evolved];
    if (!evolvedTmpl) return false;
    var mult = getStarMultiplier(unit.stars);
    unit.key = evo.evolved;
    unit.name = evolvedTmpl.name;
    unit.emoji = evolvedTmpl.emoji;
    unit.type = evolvedTmpl.type;
    unit.archetype = evolvedTmpl.archetype;
    unit.element = evolvedTmpl.element;
    unit.hp = Math.floor(evolvedTmpl.hp * mult);
    unit.maxHp = Math.floor(evolvedTmpl.hp * mult);
    unit.attack = Math.floor(evolvedTmpl.attack * mult);
    unit.attackSpd = evolvedTmpl.attackSpd;
    unit.range = evolvedTmpl.range;
    unit.moveSpd = evolvedTmpl.moveSpd;
    unit.evolved = true;
    unit.ability = evolvedTmpl.ability;
    return true;
}

function evolveUnit(saveData, baseTemplateKey) {
    if (!canEvolve(saveData)) return { success: false, reason: 'Evolution Lab not built' };

    var check = checkEvolutionRequirements(saveData, baseTemplateKey);
    if (!check.canEvolve) return { success: false, reason: 'Requirements not met' };

    var goldCost = getEvolutionGoldCost(saveData, baseTemplateKey);
    if (saveData.player.gold < goldCost) return { success: false, reason: 'Not enough gold (' + goldCost + 'g needed)' };

    var evolvedKey = check.evolvedKey;
    if (saveData.collection[evolvedKey]) return { success: false, reason: 'Already evolved' };

    spendGold(saveData, goldCost);

    saveData.collection[evolvedKey] = {
        stars: 1,
        copiesForNext: 0
    };

    autoSave(saveData);
    return { success: true, evolvedKey: evolvedKey };
}

function getElementMultiplier(attackerElem, defenderElem) {
    if (!attackerElem || !defenderElem) return 1.0;
    if (attackerElem === defenderElem) return 1.0;
    var matchup = ELEMENT_MATCHUPS[attackerElem];
    if (!matchup) return 1.0;
    if (matchup.strong.indexOf(defenderElem) !== -1) return 1.3;
    if (matchup.weak.indexOf(defenderElem) !== -1) return 0.7;
    return 1.0;
}

function getSellValue(unit) {
    var unitCost = unit.cost || 1;
    return unitCost * Math.pow(3, unit.stars - 1);
}

// =============================================================================
// ROSTER INTEGRITY VERIFICATION
// =============================================================================

function verifyRosterIntegrity() {
    var allErrors = [];
    var baseKeys = Object.keys(UNIT_TEMPLATES);
    var evolvedKeys = Object.keys(EVOLVED_TEMPLATES);
    var passiveKeys = Object.keys(PASSIVE_DATA);
    var evolvedPassiveKeys = Object.keys(EVOLVED_PASSIVE_DATA);
    var abilityKeys = Object.keys(ABILITY_DATA);
    var evolutionKeys = Object.keys(EVOLUTIONS);

    console.log('=== ROSTER INTEGRITY CHECK ===');

    // Check 1: UNIT_TEMPLATES has 60 units
    if (baseKeys.length !== 60) allErrors.push('UNIT_TEMPLATES has ' + baseKeys.length + ' units (expected 60)');
    else console.log('\u2713 UNIT_TEMPLATES: 60 base units');

    // Check 2: EVOLVED_TEMPLATES has 60 units (all tiers)
    if (evolvedKeys.length !== 60) allErrors.push('EVOLVED_TEMPLATES has ' + evolvedKeys.length + ' units (expected 60)');
    else console.log('\u2713 EVOLVED_TEMPLATES: 60 evolved units');

    // Check 3: PASSIVE_DATA has 60 entries
    if (passiveKeys.length !== 60) allErrors.push('PASSIVE_DATA has ' + passiveKeys.length + ' entries (expected 60)');
    else console.log('\u2713 PASSIVE_DATA: 60 base passives');

    // Check 4: EVOLVED_PASSIVE_DATA has 60 entries
    if (evolvedPassiveKeys.length !== 60) allErrors.push('EVOLVED_PASSIVE_DATA has ' + evolvedPassiveKeys.length + ' entries (expected 60)');
    else console.log('\u2713 EVOLVED_PASSIVE_DATA: 60 evolved passives');

    // Check 5: ABILITY_DATA has 120 entries (60 base + 60 evolved)
    if (abilityKeys.length !== 120) allErrors.push('ABILITY_DATA has ' + abilityKeys.length + ' entries (expected 120)');
    else console.log('\u2713 ABILITY_DATA: 120 ability entries');

    // Check 6: Each base unit has matching ABILITY_DATA
    for (var i = 0; i < baseKeys.length; i++) {
        if (!ABILITY_DATA[baseKeys[i]]) allErrors.push('Missing ABILITY_DATA for base unit: ' + baseKeys[i]);
    }

    // Check 7: Each evolved unit has matching ABILITY_DATA
    for (var i = 0; i < evolvedKeys.length; i++) {
        if (!ABILITY_DATA[evolvedKeys[i]]) allErrors.push('Missing ABILITY_DATA for evolved unit: ' + evolvedKeys[i]);
    }

    // Check 8: Each base unit has matching PASSIVE_DATA
    for (var i = 0; i < baseKeys.length; i++) {
        if (!PASSIVE_DATA[baseKeys[i]]) allErrors.push('Missing PASSIVE_DATA for base unit: ' + baseKeys[i]);
    }

    // Check 9: Each evolved unit has matching EVOLVED_PASSIVE_DATA
    for (var i = 0; i < evolvedKeys.length; i++) {
        if (!EVOLVED_PASSIVE_DATA[evolvedKeys[i]]) allErrors.push('Missing EVOLVED_PASSIVE_DATA for evolved unit: ' + evolvedKeys[i]);
    }

    // Check 10: Every base unit has EVOLUTIONS entry (all 60 evolve)
    for (var i = 0; i < baseKeys.length; i++) {
        if (!EVOLUTIONS[baseKeys[i]]) allErrors.push('Missing EVOLUTIONS entry for unit: ' + baseKeys[i]);
    }

    // Check 11: Each evolution resolves to existing evolved unit
    for (var i = 0; i < evolutionKeys.length; i++) {
        var evo = EVOLUTIONS[evolutionKeys[i]];
        if (!EVOLVED_TEMPLATES[evo.evolved]) allErrors.push('EVOLUTIONS[' + evolutionKeys[i] + '].evolved points to missing unit: ' + evo.evolved);
    }

    // Check 12: Element distribution (10 per element)
    var elementCounts = {};
    for (var i = 0; i < baseKeys.length; i++) {
        var el = UNIT_TEMPLATES[baseKeys[i]].element;
        elementCounts[el] = (elementCounts[el] || 0) + 1;
    }
    var elNames = ['fire', 'water', 'earth', 'wind', 'lightning', 'force'];
    for (var i = 0; i < elNames.length; i++) {
        var cnt = elementCounts[elNames[i]] || 0;
        if (cnt !== 10) allErrors.push('Element "' + elNames[i] + '" has ' + cnt + ' units (expected 10)');
        else console.log('\u2713 ' + elNames[i] + ': ' + cnt + ' units');
    }

    // Check 13: Tier distribution (21/15/12/6/6)
    var tierCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (var i = 0; i < baseKeys.length; i++) tierCounts[UNIT_TEMPLATES[baseKeys[i]].cost]++;
    var expectedTiers = { 1: 21, 2: 15, 3: 12, 4: 6, 5: 6 };
    for (var t = 1; t <= 5; t++) {
        if (tierCounts[t] === expectedTiers[t]) console.log('\u2713 Tier ' + t + ': ' + tierCounts[t] + ' units');
        else allErrors.push('Tier ' + t + ' has ' + tierCounts[t] + ' units (expected ' + expectedTiers[t] + ')');
    }

    if (allErrors.length === 0) {
        console.log('\n\u2713\u2713\u2713 ALL CHECKS PASSED \u2713\u2713\u2713\n');
        return true;
    } else {
        console.error('\n\u274C ERRORS FOUND (' + allErrors.length + '):');
        for (var i = 0; i < allErrors.length; i++) console.error('  [' + (i + 1) + '] ' + allErrors[i]);
        return false;
    }
}

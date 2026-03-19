// =============================================================================
// units-core.js — Core unit systems: elements, archetypes, creation, utilities
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
        thresholds: [2, 4, 6, 8],
        bonuses: [
            { desc: 'Guardians +250 HP +5% DR', hpBonus: 250, damageReduction: 0.05, scope: 'archetype' },
            { desc: 'Guardians +550 HP +10% DR. Start with 8% HP shield', hpBonus: 550, damageReduction: 0.10, startShieldPct: 0.08, scope: 'archetype' },
            { desc: 'Guardians +900 HP +15% DR. Shield break: +20% tenacity 4s', hpBonus: 900, damageReduction: 0.15, startShieldPct: 0.08, shieldBreakTenacity: 0.20, shieldBreakTenacityDuration: 4, scope: 'archetype' },
            { desc: 'Guardians +1300 HP +20% DR. 15% HP shield. Below 30%: 1.5s invuln + taunt', hpBonus: 1300, damageReduction: 0.20, startShieldPct: 0.15, lastStandThreshold: 0.30, lastStandInvulnDuration: 1.5, lastStandTaunt: true, scope: 'archetype' }
        ]
    },
    warden: {
        name: 'Warden', emoji: '\u{26D4}\uFE0F',
        thresholds: [2, 4, 6, 8],
        bonuses: [
            { desc: 'Wardens +20% CC duration, +15% tenacity', ccDurationBonus: 0.20, tenacity: 0.15, scope: 'archetype' },
            { desc: 'Wardens +35% CC duration, +30% tenacity. Immune to first CC', ccDurationBonus: 0.35, tenacity: 0.30, wardenFirstCcImmune: true, scope: 'archetype' },
            { desc: 'Wardens +50% CC, +45% tenacity. CC applies -20% ATK spd 3s', ccDurationBonus: 0.50, tenacity: 0.45, ccAppliesAtkSpdSlow: 0.20, ccAtkSpdSlowDuration: 3, scope: 'archetype' },
            { desc: 'Wardens +65% CC, CC immune. CC spreads: root nearby 1s', ccDurationBonus: 0.65, tenacity: 0.60, wardenCcImmune: true, ccSpreadRoot: true, ccSpreadRadius: 2, ccSpreadDuration: 1, scope: 'archetype' }
        ]
    },
    vanguard: {
        name: 'Vanguard', emoji: '\u{1F3F0}',
        thresholds: [2, 4, 6, 8],
        bonuses: [
            { desc: 'Vanguards +200 HP +20 ATK (x2 if front row)', hpBonus: 200, atkBonus: 20, frontRowMultiplier: 2, scope: 'archetype' },
            { desc: 'Vanguards +400 HP +35 ATK (x2 front). +15% dmg first 5s', hpBonus: 400, atkBonus: 35, frontRowMultiplier: 2, chargeDmgBonus: 0.15, chargeDuration: 5, scope: 'archetype' },
            { desc: 'Vanguards +650 HP +55 ATK (x2 front). Charge +25% dmg. 12% lifesteal', hpBonus: 650, atkBonus: 55, frontRowMultiplier: 2, chargeDmgBonus: 0.25, chargeDuration: 5, lifestealPct: 0.12, scope: 'archetype' },
            { desc: 'Vanguards +950 HP +80 ATK (x2 front). Charge +40% + 0.5s stun. 20% lifesteal. Slow immune', hpBonus: 950, atkBonus: 80, frontRowMultiplier: 2, chargeDmgBonus: 0.40, chargeDuration: 5, chargeStunDuration: 0.5, lifestealPct: 0.20, slowImmune: true, scope: 'archetype' }
        ]
    },
    duelist: {
        name: 'Duelist', emoji: '\u{2694}\uFE0F',
        thresholds: [2, 4, 6, 8],
        bonuses: [
            { desc: 'Duelists 15% double-strike', doubleStrikeChance: 0.15, scope: 'archetype' },
            { desc: 'Duelists 30% double-strike, 10% lifesteal', doubleStrikeChance: 0.30, lifestealPct: 0.10, scope: 'archetype' },
            { desc: 'Duelists 40% double-strike, 15% lifesteal, can\'t miss', doubleStrikeChance: 0.40, lifestealPct: 0.15, cantMissAttacks: true, scope: 'archetype' },
            { desc: 'Duelists 55% double-strike, 20% lifesteal, can\'t miss. Every 3rd: crit. +1% ATK/s (cap 40%)', doubleStrikeChance: 0.55, lifestealPct: 0.20, cantMissAttacks: true, guaranteedCritEveryN: 3, rampingAtkPctPerSec: 0.01, rampingAtkCap: 0.40, scope: 'archetype' }
        ]
    },
    predator: {
        name: 'Predator', emoji: '\u{1F43E}',
        thresholds: [2, 4, 6, 8],
        bonuses: [
            { desc: 'Predators +25% ATK spd, +15% dmg to <50% HP', atkSpdBoost: 0.25, executeDamageBonus: 0.15, executeThreshold: 0.50, scope: 'archetype' },
            { desc: 'Predators +40% ATK spd, +25% execute. Dash on kill', atkSpdBoost: 0.40, executeDamageBonus: 0.25, executeThreshold: 0.50, dashResetOnKill: true, scope: 'archetype' },
            { desc: 'Predators +55% ATK spd, +35% execute. Dash+frenzy on kill', atkSpdBoost: 0.55, executeDamageBonus: 0.35, executeThreshold: 0.50, dashResetOnKill: true, onKillAtkBuff: 0.30, onKillAtkBuffDuration: 4, scope: 'archetype' },
            { desc: 'Predators +70% ATK spd, +50% execute (<60%). Dash+frenzy+mana on kill', atkSpdBoost: 0.70, executeDamageBonus: 0.50, executeThreshold: 0.60, dashResetOnKill: true, onKillAtkBuff: 0.30, onKillAtkBuffDuration: 4, onKillManaRefundPct: 0.50, scope: 'archetype' }
        ]
    },
    ranger: {
        name: 'Ranger', emoji: '\u{1F3F9}',
        thresholds: [2, 4, 6, 8],
        bonuses: [
            { desc: 'Rangers +1 range, +15% dmg to furthest', rangeBonus: 1, furthestDmgBonus: 0.15, scope: 'archetype' },
            { desc: 'Rangers +1 range, +25% furthest, +15% ATK spd, pierce 1', rangeBonus: 1, furthestDmgBonus: 0.25, atkSpdBoost: 0.15, pierceCount: 1, scope: 'archetype' },
            { desc: 'Rangers +2 range, +35% furthest, +25% ATK spd, pierce 2. Every 5th: focused shot', rangeBonus: 2, furthestDmgBonus: 0.35, atkSpdBoost: 0.25, pierceCount: 2, focusedShotEveryN: 5, focusedShotIgnoreDR: 0.30, scope: 'archetype' },
            { desc: 'Rangers +3 range, +50% furthest, pierce all. Mark target: +15% dmg taken', rangeBonus: 3, furthestDmgBonus: 0.50, atkSpdBoost: 0.35, pierceAll: true, focusedShotEveryN: 3, focusedShotIgnoreDR: 0.30, markTargetDmgAmp: 0.15, scope: 'archetype' }
        ]
    },
    sorcerer: {
        name: 'Sorcerer', emoji: '\u{1F9D9}',
        thresholds: [2, 4, 6, 8],
        bonuses: [
            { desc: 'Sorcerers +15% ability dmg, +10 starting mana', abilityDmgBonus: 0.15, startingManaBonus: 10, scope: 'archetype' },
            { desc: 'Sorcerers +30% ability dmg, +20 mana. Refund 10% on cast', abilityDmgBonus: 0.30, startingManaBonus: 20, abilityManaRefund: 0.10, scope: 'archetype' },
            { desc: 'Sorcerers +50% ability, +30 mana, 15% refund. Spells ignore 20% DR', abilityDmgBonus: 0.50, startingManaBonus: 30, abilityManaRefund: 0.15, spellPenetration: 0.20, scope: 'archetype' },
            { desc: 'Sorcerers +75% ability, +40 mana, 20% refund. 35% spell pen. Arcane Surge. First cast: x2', abilityDmgBonus: 0.75, startingManaBonus: 40, abilityManaRefund: 0.20, spellPenetration: 0.35, postCastAtkSpdBuff: 0.30, postCastAtkSpdDuration: 3, firstCastDoubleDamage: true, scope: 'archetype' }
        ]
    },
    mystic: {
        name: 'Mystic', emoji: '\u{1F52E}',
        thresholds: [2, 4, 6, 8],
        bonuses: [
            { desc: 'Mystics +20% elem resist. Element status +20% duration', elemResist: 0.20, elemStatusDurationBonus: 0.20, scope: 'archetype' },
            { desc: 'Mystics +35% elem resist, +35% status dur. Shred 10% elem resist 4s', elemResist: 0.35, elemStatusDurationBonus: 0.35, elemResistShred: 0.10, elemResistShredDuration: 4, scope: 'archetype' },
            { desc: 'Mystics +50% elem resist, +50% status dur. 20% shred. +15% ability per unique element', elemResist: 0.50, elemStatusDurationBonus: 0.50, elemResistShred: 0.20, elemResistShredDuration: 4, abilityDmgPerElement: 0.15, scope: 'archetype' },
            { desc: 'Mystics +65% resist, +65% status. 30% shred. +20%/elem. 25% bonus element proc', elemResist: 0.65, elemStatusDurationBonus: 0.65, elemResistShred: 0.30, elemResistShredDuration: 4, abilityDmgPerElement: 0.20, randomElementProcChance: 0.25, randomElementProcDuration: 2, scope: 'archetype' }
        ]
    },
    sage: {
        name: 'Sage', emoji: '\u{1F4D6}',
        thresholds: [2, 4, 6, 8],
        bonuses: [
            { desc: 'Sages +35% healing power', healBonus: 0.35, scope: 'archetype' },
            { desc: 'Sages +70% healing. Heals grant 15% shield', healBonus: 0.70, healShieldPct: 0.15, healShieldDuration: 2, scope: 'archetype' },
            { desc: 'Sages +110% healing. 25% shield 4s. +3 mana/s', healBonus: 1.10, healShieldPct: 0.25, healShieldDuration: 4, passiveManaPerSec: 3, scope: 'archetype' },
            { desc: 'Sages +160% healing. 35% shield 6s. +5 mana/s. Overheal->shield. Save an ally from death 1x', healBonus: 1.60, healShieldPct: 0.35, healShieldDuration: 6, passiveManaPerSec: 5, overhealToShieldPct: 0.60, deathSaveOnce: true, deathSaveHealPct: 0.25, scope: 'archetype' }
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
// UNIT LEVEL CAP AND XP
// =============================================================================

var UNIT_LEVEL_CAP = 30;

function getUnitXPToNext(level) {
    if (level >= UNIT_LEVEL_CAP) return Infinity;
    return Math.floor(100 * Math.pow(1.12, level - 1));
}

// Checks if a unit has a given archetype (primary or secondary via ascension)
function unitHasArchetype(unit, archKey) {
    if (unit.archetype === archKey) return true;
    if (unit.secondaryArchetype && unit.secondaryArchetype === archKey) {
        var tier = unit.ascensionTier;
        if (tier === 'awakened' || tier === 'exalted' || tier === 'transcendent') return true;
    }
    return false;
}

// Returns effective stats for a unit factoring in stars, level, and ascension
function getUnitStats(unit) {
    var tmpl = unit.evolved ? EVOLVED_TEMPLATES[unit.key] : UNIT_TEMPLATES[unit.key];
    if (!tmpl) return { hp: unit.hp || 100, attack: unit.attack || 10 };
    var starMult = getStarMultiplier(unit.stars || 1);
    var levelBonus = 1 + ((unit.level || 1) - 1) * 0.02; // +2% per level above 1
    var ascensionBonus = getAscensionStatBonus(unit.ascensionTier);
    return {
        hp: Math.floor(tmpl.hp * starMult * levelBonus * (1 + ascensionBonus)),
        attack: Math.floor(tmpl.attack * starMult * levelBonus * (1 + ascensionBonus))
    };
}

// Grant XP to a unit. Returns number of levels gained.
function grantUnitXP(unit, amount) {
    if (!unit) return 0;
    if (typeof unit.level === 'undefined') { unit.level = 1; unit.xp = 0; }
    if (unit.level >= UNIT_LEVEL_CAP) return 0;

    unit.xp += amount;
    var levelsGained = 0;
    var xpToNext = getUnitXPToNext(unit.level);

    while (unit.xp >= xpToNext && unit.level < UNIT_LEVEL_CAP) {
        unit.xp -= xpToNext;
        unit.level++;
        levelsGained++;
        xpToNext = getUnitXPToNext(unit.level);
    }

    if (unit.level >= UNIT_LEVEL_CAP) {
        unit.xp = 0; // cap overflow
    }

    // Recalculate stats
    var stats = getUnitStats(unit);
    unit.hp = stats.hp;
    unit.maxHp = stats.hp;
    unit.attack = stats.attack;

    return levelsGained;
}

// Calculate base XP for a mission based on region
function getMissionUnitXP(regionNumber, isBoss) {
    // baseXP: 30 for region 1, scaling to 120 for region 8
    var baseXP = Math.floor(30 + (regionNumber - 1) * (90 / 7));
    var stageMultiplier = isBoss ? 1.5 : 1.0;
    return Math.floor(baseXP * stageMultiplier);
}

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
        secondaryArchetype: t.secondaryArchetype || null,
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
        items: [],
        level: 1,
        xp: 0,
        ascensionTier: null
    };
}

function getStarMultiplier(stars) {
    return Math.pow(1.8, stars - 1);
}

function upgradeUnit(unit) {
    unit.stars += 1;
    var stats = getUnitStats(unit);
    unit.hp = stats.hp;
    unit.maxHp = stats.hp;
    unit.attack = stats.attack;
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
    if (saveData.player.veilEssence < goldCost) return { success: false, reason: 'Not enough VE (' + goldCost + ' VE needed)' };

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
// POWER RATING SYSTEM
// =============================================================================

function getAbilityPowerValue(unit) {
    var abilityKey = unit.key;
    var ability = ABILITY_DATA[abilityKey];
    if (!ability) return 0;

    // Look up template for ATK
    var tmpl = unit.evolved ? EVOLVED_TEMPLATES[unit.key] : UNIT_TEMPLATES[unit.key];
    if (!tmpl) return 0;

    // Parse damage multiplier from desc (e.g., "200% ATK" = 2.0)
    var match = ability.desc.match(/(\d+)%\s*ATK/);
    var atkMultiplier = match ? parseInt(match[1]) / 100 : 1.0;

    var unitAtk = unit.attack || tmpl.attack;
    var manaCost = tmpl.maxMana || 1;

    // T5 passives (MaxMana 0) use fixed multiplier
    if (manaCost === 0) {
        return unitAtk * atkMultiplier * 0.5; // passive power estimate
    }

    return (unitAtk * atkMultiplier) / (manaCost / 50); // normalize by mana cost
}

function getItemPowerContribution(unit) {
    if (!unit.items || unit.items.length === 0) return 0;
    var power = 0;
    for (var i = 0; i < unit.items.length; i++) {
        var item = unit.items[i];
        if (!item) continue;
        // Estimate item power from stats
        if (item.stats) {
            if (item.stats.hp) power += item.stats.hp * 0.4;
            if (item.stats.attack) power += item.stats.attack * 1.5;
            if (item.stats.attackSpd) power += item.stats.attackSpd * 100;
        }
        // Flat per-item bonus for having any item equipped
        power += 20;
    }
    return power;
}

function calculatePowerRating(unit) {
    var stats = getUnitStats(unit);
    var hpWeight = 0.4;
    var dpsWeight = 1.5;
    var abilityWeight = 0.8;

    var dps = stats.attack * (1 / (unit.attackSpd || 1)); // attacks per second * damage
    var abilityValue = getAbilityPowerValue(unit);
    var itemPower = getItemPowerContribution(unit);

    var basePR = (stats.hp * hpWeight) + (dps * dpsWeight) + (abilityValue * abilityWeight) + itemPower;

    // Ascension multiplier
    var ascMult = 1 + getAscensionStatBonus(unit.ascensionTier);

    return Math.floor(basePR * ascMult);
}

function calculateTeamPowerRating(team) {
    if (!team || !team.slots) return 0;
    var total = 0;
    for (var i = 0; i < team.slots.length; i++) {
        var slot = team.slots[i];
        if (!slot) continue;
        var tmpl = UNIT_TEMPLATES[slot.key] || EVOLVED_TEMPLATES[slot.key];
        if (!tmpl) continue;
        // Create a temporary unit object for power calculation
        var tempUnit = {
            key: slot.key,
            evolved: !!EVOLVED_TEMPLATES[slot.key] && !UNIT_TEMPLATES[slot.key],
            stars: slot.stars || 1,
            level: slot.level || 1,
            ascensionTier: slot.ascensionTier || null,
            hp: tmpl.hp,
            attack: tmpl.attack,
            attackSpd: tmpl.attackSpd,
            items: slot.items || []
        };
        total += calculatePowerRating(tempUnit);
    }
    // Synergy bonus estimate (+5% per active synergy pair)
    var synergyEstimate = Math.floor(total * 0.02 * Math.min(team.slots.length, 9));
    return total + synergyEstimate;
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

    // Check 1: UNIT_TEMPLATES has 66 units
    if (baseKeys.length !== 66) allErrors.push('UNIT_TEMPLATES has ' + baseKeys.length + ' units (expected 66)');
    else console.log('\u2713 UNIT_TEMPLATES: 66 base units');

    // Check 2: EVOLVED_TEMPLATES has 66 units (all tiers)
    if (evolvedKeys.length !== 66) allErrors.push('EVOLVED_TEMPLATES has ' + evolvedKeys.length + ' units (expected 66)');
    else console.log('\u2713 EVOLVED_TEMPLATES: 66 evolved units');

    // Check 3: PASSIVE_DATA has 66 entries
    if (passiveKeys.length !== 66) allErrors.push('PASSIVE_DATA has ' + passiveKeys.length + ' entries (expected 66)');
    else console.log('\u2713 PASSIVE_DATA: 66 base passives');

    // Check 4: EVOLVED_PASSIVE_DATA has 66 entries
    if (evolvedPassiveKeys.length !== 66) allErrors.push('EVOLVED_PASSIVE_DATA has ' + evolvedPassiveKeys.length + ' entries (expected 66)');
    else console.log('\u2713 EVOLVED_PASSIVE_DATA: 66 evolved passives');

    // Check 5: ABILITY_DATA has 132 entries (66 base + 66 evolved)
    if (abilityKeys.length !== 132) allErrors.push('ABILITY_DATA has ' + abilityKeys.length + ' entries (expected 132)');
    else console.log('\u2713 ABILITY_DATA: 132 ability entries');

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
        if (cnt !== 11) allErrors.push('Element "' + elNames[i] + '" has ' + cnt + ' units (expected 11)');
        else console.log('\u2713 ' + elNames[i] + ': ' + cnt + ' units');
    }

    // Check 13: Tier distribution (21/15/12/12/6)
    var tierCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (var i = 0; i < baseKeys.length; i++) tierCounts[UNIT_TEMPLATES[baseKeys[i]].cost]++;
    var expectedTiers = { 1: 21, 2: 15, 3: 12, 4: 12, 5: 6 };
    for (var t = 1; t <= 5; t++) {
        if (tierCounts[t] === expectedTiers[t]) console.log('\u2713 Tier ' + t + ': ' + tierCounts[t] + ' units');
        else allErrors.push('Tier ' + t + ' has ' + tierCounts[t] + ' units (expected ' + expectedTiers[t] + ')');
    }

    // Check 14: Secondary archetype assignments
    var missingSecondary = 0;
    for (var i = 0; i < baseKeys.length; i++) {
        if (!UNIT_TEMPLATES[baseKeys[i]].secondaryArchetype) missingSecondary++;
    }
    if (missingSecondary > 0) allErrors.push(missingSecondary + ' base units missing secondaryArchetype');
    else console.log('\u2713 All 66 base units have secondaryArchetype');

    if (allErrors.length === 0) {
        console.log('\n\u2713\u2713\u2713 ALL CHECKS PASSED \u2713\u2713\u2713\n');
        return true;
    } else {
        console.error('\n\u274C ERRORS FOUND (' + allErrors.length + '):');
        for (var i = 0; i < allErrors.length; i++) console.error('  [' + (i + 1) + '] ' + allErrors[i]);
        return false;
    }
}

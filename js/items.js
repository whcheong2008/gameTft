// =============================================================================
// items.js — Equipment system: RPG slots, Diablo-style tier + rarity loot
// Replaces old component-based crafting. Loads AFTER heroes.js.
// =============================================================================

// ---- Tier Config (region-gated, deterministic progression) ----

var TIER_CONFIG = {
    statMultipliers: [1.0, 1.5, 2.17, 3.0, 4.0]  // T1=idx0 … T5=idx4
};

// ---- Rarity Config (RNG per drop) ----

var RARITY_CONFIG = {
    tiers: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    colors: { common: '#ffffff', uncommon: '#4ade80', rare: '#60a5fa', epic: '#c084fc', legendary: '#fb923c', mythic: '#ff4500' },
    statMultipliers: { common: 1.0, uncommon: 1.2, rare: 1.5, epic: 1.8, legendary: 2.2 },
    affixCount: { common: 0, uncommon: 1, rare: 2, epic: 2, legendary: 3 },
    hasMinorPassive: { common: false, uncommon: false, rare: false, epic: true, legendary: true },
    hasMajorPassive: { common: false, uncommon: false, rare: false, epic: false, legendary: true },
    dropWeights: { common: 50, uncommon: 30, rare: 13, epic: 5.5, legendary: 1.5 }
};

var AFFIX_RARITY_SCALING = { common: 0, uncommon: 0.6, rare: 0.8, epic: 1.0, legendary: 1.0 };

// ---- Region Drop Config ----

var REGION_DROP_CONFIG = {
    1: { tiers: { 1: 100 } },
    2: { tiers: { 1: 70, 2: 30 } },
    3: { tiers: { 1: 20, 2: 70, 3: 10 } },
    4: { tiers: { 2: 50, 3: 50 } },
    5: { tiers: { 2: 15, 3: 70, 4: 15 } },
    6: { tiers: { 3: 40, 4: 60 } },
    7: { tiers: { 3: 10, 4: 70, 5: 20 } },
    8: { tiers: { 4: 30, 5: 70 } }
};

var REGION_RARITY_BONUS = {
    1: { legendary: 0, epic: 0 },
    2: { legendary: 0, epic: 1 },
    3: { legendary: 0.5, epic: 2 },
    4: { legendary: 0.5, epic: 3 },
    5: { legendary: 1.0, epic: 4 },
    6: { legendary: 1.5, epic: 5 },
    7: { legendary: 2.0, epic: 6 },
    8: { legendary: 3.0, epic: 8 }
};

var DROP_CONFIG = {
    dropsPerMission: 1,
    bonusDropOn3Star: 1,
    bossExtraDrop: 1,
    gemDropChance: 0.15,
    materialDropChance: 0.25
};

// ---- Enhancement Config ----

var ENHANCEMENT_CONFIG = {
    maxLevel: 10,
    costs: [20, 30, 50, 80, 120, 180, 250, 350, 500, 750],
    successRates: [1.0, 1.0, 1.0, 0.9, 0.8, 0.7, 0.55, 0.4, 0.25, 0.15],
    failurePenalty: [0, 0, 0, 0, 0, -1, -1, -2, -2, -2],
    statBonusPct: [0.05, 0.10, 0.15, 0.22, 0.30, 0.40, 0.52, 0.66, 0.82, 1.00],
    pityThreshold: 3,
    mythicCostMult: 1.5
};

// ---- Socket Config ----

var SOCKET_CONFIG = {
    socketsPerRarity: { common: 0, uncommon: 0, rare: 1, epic: 1, legendary: 2, mythic: 2 },
    gemTypes: ['ruby', 'sapphire', 'emerald', 'topaz', 'diamond', 'amethyst', 'opal', 'onyx', 'prismatic'],
    gemRarities: ['standard', 'uncommon', 'rare', 'epic'],
    combineCost: 15,
    removeCost: 10
};

// ---- Affix Pools ----

var WEAPON_AFFIXES = [
    { key: 'flatAtk', name: '+{v} ATK', range: [3, 15] },
    { key: 'atkPct', name: '+{v}% ATK', range: [3, 10] },
    { key: 'critChance', name: '+{v}% Crit Chance', range: [3, 12] },
    { key: 'critDamage', name: '+{v}% Crit Damage', range: [5, 20] },
    { key: 'atkSpeed', name: '-{v}s ATK Speed', range: [0.02, 0.08] },
    { key: 'lifesteal', name: '+{v}% Lifesteal', range: [2, 8] },
    { key: 'armorPen', name: 'Ignore {v}% DR', range: [3, 10] },
    { key: 'startMana', name: '+{v} Starting Mana', range: [5, 15] }
];

var HELM_AFFIXES = [
    { key: 'flatHp', name: '+{v} HP', range: [30, 150] },
    { key: 'hpPct', name: '+{v}% HP', range: [3, 10] },
    { key: 'dr', name: '+{v}% DR', range: [2, 8] },
    { key: 'tenacity', name: '+{v}% Tenacity', range: [3, 12] },
    { key: 'elemResist', name: '+{v}% Element Resist', range: [3, 10] },
    { key: 'startMana', name: '+{v} Starting Mana', range: [5, 12] },
    { key: 'abilityDmg', name: '+{v}% Ability Damage', range: [3, 8] }
];

var CHEST_AFFIXES = [
    { key: 'flatHp', name: '+{v} HP', range: [50, 200] },
    { key: 'hpPct', name: '+{v}% HP', range: [4, 12] },
    { key: 'dr', name: '+{v}% DR', range: [3, 10] },
    { key: 'flatAtk', name: '+{v} ATK', range: [2, 8] },
    { key: 'healPower', name: '+{v}% Heal Power', range: [3, 10] },
    { key: 'regenPct', name: '+{v}% HP Regen/s', range: [0.3, 1.0] }
];

var GAUNTLET_AFFIXES = [
    { key: 'flatAtk', name: '+{v} ATK', range: [3, 12] },
    { key: 'atkPct', name: '+{v}% ATK', range: [3, 8] },
    { key: 'critChance', name: '+{v}% Crit Chance', range: [3, 10] },
    { key: 'atkSpeed', name: '-{v}s ATK Speed', range: [0.02, 0.06] },
    { key: 'lifesteal', name: '+{v}% Lifesteal', range: [2, 6] },
    { key: 'onHitDmg', name: '+{v} On-Hit Damage', range: [3, 15] },
    { key: 'manaPerHit', name: '+{v} Mana per Hit', range: [1, 5] }
];

var BOOT_AFFIXES = [
    { key: 'atkSpeed', name: '-{v}s ATK Speed', range: [0.02, 0.08] },
    { key: 'moveSpeed', name: '+{v}% Move Speed', range: [5, 15] },
    { key: 'dodge', name: '+{v}% Dodge', range: [3, 10] },
    { key: 'tenacity', name: '+{v}% Tenacity', range: [3, 10] },
    { key: 'startMana', name: '+{v} Starting Mana', range: [5, 12] },
    { key: 'flatHp', name: '+{v} HP', range: [20, 80] },
    { key: 'slowImmune', name: 'Slow Immunity', range: [1, 1], isBinary: true, minRarity: 'rare' }
];

var OFFHAND_AFFIXES = [
    { key: 'flatHp', name: '+{v} HP', range: [30, 150] },
    { key: 'dr', name: '+{v}% DR', range: [2, 8] },
    { key: 'startShield', name: '+{v} Shield at Start', range: [30, 120] },
    { key: 'healPower', name: '+{v}% Heal Power', range: [5, 15] },
    { key: 'abilityDmg', name: '+{v}% Ability Damage', range: [3, 8] },
    { key: 'startMana', name: '+{v} Starting Mana', range: [5, 12] },
    { key: 'tauntDuration', name: '+{v}s Taunt Duration', range: [0.5, 1.5] }
];

var ACCESSORY_AFFIXES = [
    { key: 'flatHp', name: '+{v} HP', range: [30, 120] },
    { key: 'flatAtk', name: '+{v} ATK', range: [3, 12] },
    { key: 'atkSpeed', name: '-{v}s ATK Speed', range: [0.02, 0.06] },
    { key: 'critChance', name: '+{v}% Crit Chance', range: [3, 8] },
    { key: 'dr', name: '+{v}% DR', range: [2, 6] },
    { key: 'startMana', name: '+{v} Starting Mana', range: [5, 12] },
    { key: 'tenacity', name: '+{v}% Tenacity', range: [3, 8] },
    { key: 'healPower', name: '+{v}% Heal Power', range: [3, 8] },
    { key: 'elemResist', name: '+{v}% Element Resist', range: [3, 8] },
    { key: 'allStatsPct', name: '+{v}% All Stats', range: [1, 4] }
];

var SLOT_AFFIXES = {
    weapon: WEAPON_AFFIXES,
    helm: HELM_AFFIXES,
    chest: CHEST_AFFIXES,
    gauntlets: GAUNTLET_AFFIXES,
    boots: BOOT_AFFIXES,
    offhand: OFFHAND_AFFIXES,
    accessory1: ACCESSORY_AFFIXES,
    accessory2: ACCESSORY_AFFIXES
};

// ---- Equipment Slots ----

var EQUIPMENT_SLOTS = ['weapon', 'helm', 'chest', 'gauntlets', 'boots', 'offhand', 'accessory1', 'accessory2'];

var SLOT_DISPLAY = {
    weapon: { name: 'Weapon', emoji: '⚔️' },
    helm: { name: 'Helm', emoji: '🪖' },
    chest: { name: 'Chest', emoji: '🛡️' },
    gauntlets: { name: 'Gauntlets', emoji: '🥊' },
    boots: { name: 'Boots', emoji: '👢' },
    offhand: { name: 'Off-hand', emoji: '🔮' },
    accessory1: { name: 'Accessory 1', emoji: '💍' },
    accessory2: { name: 'Accessory 2', emoji: '📿' }
};

// ---- Item Line Definitions (39 lines) ----

var ITEM_LINES = {
    // === Weapons (6) ===
    sword: {
        slot: 'weapon', baseStats: { atk: 12 }, identity: 'Balanced melee',
        names: { 1: 'Iron Sword', 2: 'Steel Sword', 3: 'Mithril Sword', 4: 'Adamant Sword', 5: 'Celestial Blade' },
        minorPassive: { key: 'consecutiveHitBonus', bonusPct: 0.08, maxStacks: 3, desc: '+8% damage per consecutive hit on same target (max 24%)' },
        majorPassive: { key: 'bladeStorm', everyN: 8, damagePct: 0.60, aoeRadius: 1, desc: 'Every 8th attack slashes adjacent enemies for 60% ATK' }
    },
    bow: {
        slot: 'weapon', baseStats: { atk: 12 }, identity: 'Ranged attacker',
        names: { 1: 'Hunting Bow', 2: 'Composite Bow', 3: 'Windcarver Bow', 4: 'Dragonbone Bow', 5: 'Astral Longbow' },
        minorPassive: { key: 'longRangeBonus', bonusPct: 0.10, rangeThreshold: 3, desc: '+10% damage to targets more than 3 cells away' },
        majorPassive: { key: 'sniperMark', dmgAmp: 0.12, duration: 3, desc: 'Attacks mark target; marked targets take +12% damage from all sources for 3s' }
    },
    staff: {
        slot: 'weapon', baseStats: { atk: 12 }, identity: 'Ability power',
        names: { 1: 'Arcane Staff', 2: 'Runic Staff', 3: 'Leyline Staff', 4: 'Voidtouched Staff', 5: 'Staff of Eternity' },
        minorPassive: { key: 'abilityBonus', bonusPct: 0.10, desc: 'Abilities deal +10% damage' },
        majorPassive: { key: 'echoCast', chance: 0.20, powerPct: 0.40, desc: '20% chance for abilities to fire a second time at 40% power' }
    },
    axe: {
        slot: 'weapon', baseStats: { atk: 12 }, identity: 'Crit/burst',
        names: { 1: 'War Axe', 2: 'Battle Axe', 3: "Executioner's Axe", 4: 'Doomcleaver', 5: 'World Splitter' },
        minorPassive: { key: 'critDmgBonus', bonusPct: 0.12, desc: '+12% crit damage' },
        majorPassive: { key: 'executioner', explodePct: 0.25, desc: 'Kills cause target to explode, dealing 25% of their max HP to nearby enemies' }
    },
    daggers: {
        slot: 'weapon', baseStats: { atk: 12 }, identity: 'Attack speed',
        names: { 1: 'Twin Daggers', 2: 'Shadow Blades', 3: 'Venom Fangs', 4: 'Eclipse Daggers', 5: "Oblivion's Edge" },
        minorPassive: { key: 'nthAttackBonus', everyN: 4, bonusPct: 0.25, desc: 'Every 4th attack deals +25% damage' },
        majorPassive: { key: 'shadowStrike', everyN: 6, damagePct: 0.80, ignoresDR: true, desc: 'Every 6th attack, teleport behind target and deal 80% ATK (ignores DR)' }
    },
    hammer: {
        slot: 'weapon', baseStats: { atk: 12 }, identity: 'Tank offense',
        names: { 1: 'Warhammer', 2: 'Maul of Ruin', 3: 'Seismic Hammer', 4: "Titan's Maul", 5: 'Godforge Hammer' },
        minorPassive: { key: 'drShred', drReduction: 0.04, duration: 3, maxStacks: 3, desc: 'Attacks reduce target DR by 4% for 3s (stacks to 12%)' },
        majorPassive: { key: 'shockwave', everyN: 5, damagePct: 0.40, stunDuration: 0.5, desc: 'Every 5th attack sends a shockwave dealing 40% ATK in a line and stunning 0.5s' }
    },
    // === Helms (5) ===
    leather_cap: {
        slot: 'helm', baseStats: { hp: 80 }, identity: 'Light defense',
        names: { 1: 'Leather Cap', 2: 'Hardened Cap', 3: 'Reinforced Hood', 4: 'Shadow Cowl', 5: 'Phantom Crown' },
        minorPassive: { key: 'dodgeBonus', value: 0.05, desc: '+5% dodge chance' },
        majorPassive: { key: 'phantomEvade', onDodgeStealthSec: 1.0, desc: 'After dodging, gain 1s stealth' }
    },
    iron_helm: {
        slot: 'helm', baseStats: { hp: 80 }, identity: 'Heavy defense',
        names: { 1: 'Iron Helm', 2: 'Steel Helm', 3: 'Mithril Helm', 4: 'Adamant Helm', 5: 'Celestial Helm' },
        minorPassive: { key: 'abilityDR', value: 0.08, desc: 'Take 8% less damage from abilities' },
        majorPassive: { key: 'unbreakableWill', ccDurationReduce: 0.40, desc: 'All CC durations reduced by 40%' }
    },
    circlet: {
        slot: 'helm', baseStats: { hp: 80 }, identity: 'Mana utility',
        names: { 1: "Mage's Circlet", 2: 'Runic Circlet', 3: 'Leyline Circlet', 4: 'Void Circlet', 5: 'Crown of Stars' },
        minorPassive: { key: 'abilityDmgBonus', value: 0.08, desc: '+8% ability damage' },
        majorPassive: { key: 'manaFountain', manaPerSec: 3, desc: 'Gain 3 mana per second' }
    },
    visor: {
        slot: 'helm', baseStats: { hp: 80 }, identity: 'CC resistance',
        names: { 1: "Warden's Visor", 2: 'Guardian Visor', 3: 'Bastion Visor', 4: 'Fortress Visor', 5: 'Eternal Visor' },
        minorPassive: { key: 'firstCCReduce', value: 0.50, desc: 'First CC received per combat: -50% duration' },
        majorPassive: { key: 'ccImmunityPulse', cooldown: 12, immuneDuration: 2, desc: 'Every 12s: gain 2s CC immunity' }
    },
    thorn_crown: {
        slot: 'helm', baseStats: { hp: 80 }, identity: 'Retaliation',
        names: { 1: 'Crown of Thorns', 2: 'Crown of Barbs', 3: 'Crown of Spikes', 4: 'Crown of Agony', 5: 'Crown of Vengeance' },
        minorPassive: { key: 'reflectDmg', value: 0.04, desc: 'Reflect 4% of damage taken' },
        majorPassive: { key: 'vengeance', triggerBelowHp: 0.30, burstPctMaxHp: 0.15, desc: 'When below 30% HP: burst dealing 15% max HP to nearby enemies' }
    },
    // === Chest Armor (5) ===
    leather_vest: {
        slot: 'chest', baseStats: { hp: 120 }, identity: 'Light armor',
        names: { 1: 'Leather Vest', 2: 'Studded Vest', 3: 'Reinforced Vest', 4: 'Shadow Vest', 5: 'Phantom Weave' },
        minorPassive: { key: 'dodgeBonus', value: 0.04, desc: '+4% dodge chance' },
        majorPassive: { key: 'phantomWeave', onDodgeHealPct: 0.03, desc: 'Dodging heals 3% max HP' }
    },
    chainmail: {
        slot: 'chest', baseStats: { hp: 120 }, identity: 'Heavy armor',
        names: { 1: 'Chain Mail', 2: 'Heavy Mail', 3: 'Mithril Mail', 4: 'Adamant Mail', 5: 'Celestial Aegis' },
        minorPassive: { key: 'flatDR', value: 0.05, desc: '+5% DR' },
        majorPassive: { key: 'aegisStance', drBelowHalf: 0.12, desc: '+12% DR when below 50% HP' }
    },
    robe: {
        slot: 'chest', baseStats: { hp: 120 }, identity: 'Ability support',
        names: { 1: "Mage's Robe", 2: 'Enchanted Robe', 3: 'Arcane Robe', 4: 'Void Robe', 5: 'Robe of Eternity' },
        minorPassive: { key: 'abilityDmgBonus', value: 0.06, desc: '+6% ability damage' },
        majorPassive: { key: 'arcaneBarrier', shieldOnCastPct: 0.08, desc: 'Casting grants shield equal to 8% max HP' }
    },
    harness: {
        slot: 'chest', baseStats: { hp: 120 }, identity: 'Aggressive',
        names: { 1: 'Battle Harness', 2: 'War Harness', 3: "Commander's Harness", 4: "Champion's Harness", 5: "Warlord's Harness" },
        minorPassive: { key: 'atkAboveHp', atkPct: 0.08, hpThreshold: 0.70, desc: '+8% ATK when above 70% HP' },
        majorPassive: { key: 'battleFury', onKillAtkPct: 0.10, duration: 5, desc: 'On kill: +10% ATK for 5s' }
    },
    vestment: {
        slot: 'chest', baseStats: { hp: 120 }, identity: 'Healing boost',
        names: { 1: "Healer's Vestment", 2: 'Blessed Vestment', 3: 'Sacred Vestment', 4: 'Divine Vestment', 5: 'Celestial Vestment' },
        minorPassive: { key: 'healPowerBonus', value: 0.10, desc: '+10% heal power' },
        majorPassive: { key: 'sanctuary', auraHealPct: 0.01, auraRange: 2, desc: 'Nearby allies within 2 cells regen 1% max HP/s' }
    },
    // === Gauntlets (5) ===
    leather_gloves: {
        slot: 'gauntlets', baseStats: { atk: 8 }, identity: 'Balanced',
        names: { 1: 'Leather Gloves', 2: 'Studded Gloves', 3: 'Reinforced Gloves', 4: 'Shadow Gloves', 5: 'Phantom Grips' },
        minorPassive: { key: 'atkSpdBonus', value: 0.05, desc: '+5% ATK speed' },
        majorPassive: { key: 'swiftStrikes', everyN: 5, doubleStrike: true, desc: 'Every 5th attack is a double-strike' }
    },
    spiked: {
        slot: 'gauntlets', baseStats: { atk: 8 }, identity: 'On-hit',
        names: { 1: 'Spiked Gauntlets', 2: 'Razored Gauntlets', 3: 'Serrated Gauntlets', 4: 'Cruel Gauntlets', 5: 'Devastator Grips' },
        minorPassive: { key: 'onHitFlatDmg', value: 5, desc: '+5 on-hit damage' },
        majorPassive: { key: 'devastatingBlow', everyN: 4, bonusDmgPct: 0.60, desc: 'Every 4th attack deals +60% bonus damage' }
    },
    mana_gauntlets: {
        slot: 'gauntlets', baseStats: { atk: 8 }, identity: 'Mana gen',
        names: { 1: 'Mana Gauntlets', 2: 'Channeling Gauntlets', 3: 'Leyline Gauntlets', 4: 'Void Gauntlets', 5: 'Eternity Gauntlets' },
        minorPassive: { key: 'manaPerHitBonus', value: 2, desc: '+2 mana per hit' },
        majorPassive: { key: 'manaOverflow', onFullManaAtkPct: 0.15, desc: 'While at max mana, +15% ATK' }
    },
    bloodstained: {
        slot: 'gauntlets', baseStats: { atk: 8 }, identity: 'Lifesteal',
        names: { 1: 'Bloodstained Claws', 2: 'Crimson Claws', 3: 'Gore Claws', 4: 'Abyssal Claws', 5: 'Soulreaver Claws' },
        minorPassive: { key: 'lifestealBonus', value: 0.05, desc: '+5% lifesteal' },
        majorPassive: { key: 'soulreave', lifesteal: 0.12, overhealShieldPct: 0.20, desc: '12% lifesteal, excess heals become shield (max 20% HP)' }
    },
    swift_bracers: {
        slot: 'gauntlets', baseStats: { atk: 8 }, identity: 'Speed',
        names: { 1: 'Swift Bracers', 2: 'Haste Bracers', 3: 'Windweave Bracers', 4: 'Stormweave Bracers', 5: 'Lightspeed Bracers' },
        minorPassive: { key: 'atkSpdBonus', value: 0.06, desc: '+6% ATK speed' },
        majorPassive: { key: 'lightspeed', rampAtkSpdPerSec: 0.005, maxBonus: 0.15, desc: 'Gain +0.5% ATK speed per second (max +15%)' }
    },
    // === Boots (5) ===
    leather_boots: {
        slot: 'boots', baseStats: { atkSpd: -0.05 }, identity: 'Basic speed',
        names: { 1: 'Leather Boots', 2: 'Sturdy Boots', 3: 'Reinforced Boots', 4: 'Shadow Boots', 5: 'Phantom Striders' },
        minorPassive: { key: 'moveSpdBonus', value: 0.08, desc: '+8% move speed' },
        majorPassive: { key: 'phantomStride', combatStartAtkSpdPct: 0.15, duration: 5, desc: '+15% ATK speed for first 5s of combat' }
    },
    windwalker: {
        slot: 'boots', baseStats: { atkSpd: -0.05 }, identity: 'Dodge/speed',
        names: { 1: 'Windwalker Boots', 2: 'Galeforce Boots', 3: 'Stormstride Boots', 4: 'Cyclone Boots', 5: 'Voidwalker Boots' },
        minorPassive: { key: 'dodgeBonus', value: 0.05, desc: '+5% dodge' },
        majorPassive: { key: 'windDash', afterDodgeAtkSpdPct: 0.20, duration: 2, desc: 'After dodging, +20% ATK speed for 2s' }
    },
    ironclad: {
        slot: 'boots', baseStats: { atkSpd: -0.05 }, identity: 'Tank speed',
        names: { 1: 'Ironclad Treads', 2: 'Fortified Treads', 3: 'Adamant Treads', 4: 'Titan Treads', 5: 'Immovable Treads' },
        minorPassive: { key: 'flatDR', value: 0.03, desc: '+3% DR' },
        majorPassive: { key: 'immovable', slowImmune: true, knockbackImmune: true, desc: 'Immune to slows and knockbacks' }
    },
    arcane_slippers: {
        slot: 'boots', baseStats: { atkSpd: -0.05 }, identity: 'Mana speed',
        names: { 1: 'Arcane Slippers', 2: 'Runic Slippers', 3: 'Leyline Slippers', 4: 'Void Slippers', 5: 'Eternity Steps' },
        minorPassive: { key: 'startManaBonus', value: 8, desc: '+8 starting mana' },
        majorPassive: { key: 'manaSurge', postCastAtkSpdPct: 0.20, postCastDuration: 3, desc: 'After casting, +20% ATK speed for 3s' }
    },
    stalker_steps: {
        slot: 'boots', baseStats: { atkSpd: -0.05 }, identity: 'Assassin',
        names: { 1: "Stalker's Steps", 2: 'Shadow Steps', 3: 'Phantom Steps', 4: 'Eclipse Steps', 5: 'Oblivion Steps' },
        minorPassive: { key: 'moveSpdBonus', value: 0.10, desc: '+10% move speed' },
        majorPassive: { key: 'shadowApproach', combatStartStealthSec: 2, desc: '2s stealth at combat start' }
    },
    // === Off-hand (5) ===
    wooden_shield: {
        slot: 'offhand', baseStats: { hp: 100 }, identity: 'Basic tank',
        names: { 1: 'Wooden Shield', 2: 'Iron Shield', 3: 'Mithril Shield', 4: 'Adamant Shield', 5: 'Celestial Ward' },
        minorPassive: { key: 'flatDR', value: 0.04, desc: '+4% DR' },
        majorPassive: { key: 'wardBlock', blockChance: 0.15, blockPct: 0.30, desc: '15% chance to block 30% of incoming damage' }
    },
    tower_shield: {
        slot: 'offhand', baseStats: { hp: 100 }, identity: 'Heavy defense',
        names: { 1: 'Tower Shield', 2: 'Fortress Shield', 3: 'Bastion Shield', 4: 'Citadel Shield', 5: 'Eternal Bulwark' },
        minorPassive: { key: 'flatDR', value: 0.06, desc: '+6% DR' },
        majorPassive: { key: 'bulwark', tauntAdjacent: true, drWhileTaunting: 0.10, desc: 'Taunt adjacent enemies; +10% DR while taunting' }
    },
    spell_tome: {
        slot: 'offhand', baseStats: { hp: 100 }, identity: 'Support caster',
        names: { 1: 'Spell Tome', 2: 'Runic Tome', 3: 'Arcane Grimoire', 4: 'Void Grimoire', 5: 'Tome of Ages' },
        minorPassive: { key: 'abilityDmgBonus', value: 0.06, desc: '+6% ability damage' },
        majorPassive: { key: 'spellEcho', echoChance: 0.15, echoPowerPct: 0.30, desc: '15% chance abilities echo at 30% power' }
    },
    ward_stone: {
        slot: 'offhand', baseStats: { hp: 100 }, identity: 'Starting shield',
        names: { 1: 'Ward Stone', 2: 'Barrier Stone', 3: 'Aegis Stone', 4: 'Nullifier Stone', 5: 'Infinity Stone' },
        minorPassive: { key: 'startShieldBonus', shieldPct: 0.08, desc: 'Start with shield equal to 8% max HP' },
        majorPassive: { key: 'nullField', shieldPct: 0.15, nearbyDmgReduction: 0.08, desc: 'Start with 15% max HP shield; while shielded, nearby allies take 8% less damage' }
    },
    healing_orb: {
        slot: 'offhand', baseStats: { hp: 100 }, identity: 'Healer focus',
        names: { 1: 'Healing Orb', 2: 'Blessed Orb', 3: 'Sacred Orb', 4: 'Divine Orb', 5: 'Orb of Life' },
        minorPassive: { key: 'healPowerBonus', value: 0.08, desc: '+8% heal power' },
        majorPassive: { key: 'healingAura', auraHealPct: 0.005, auraRange: 2, desc: 'Nearby allies regen 0.5% max HP/s' }
    },
    // === Accessories (8) ===
    ruby_ring: {
        slot: 'accessory', baseStats: { hp: 60 }, identity: 'HP stacking',
        names: { 1: 'Ruby Ring', 2: 'Ruby Band', 3: 'Ruby Signet', 4: 'Ruby Crown Ring', 5: 'Heart of Fire' },
        minorPassive: { key: 'hpPctBonus', value: 0.06, desc: '+6% max HP' },
        majorPassive: { key: 'heartOfFire', hpPct: 0.12, belowHpHealTrigger: 0.25, healPct: 0.10, desc: '+12% HP. Below 25%: heal 10% max HP once' }
    },
    sapphire_pendant: {
        slot: 'accessory', baseStats: { atk: 5 }, identity: 'ATK stacking',
        names: { 1: 'Sapphire Pendant', 2: 'Sapphire Chain', 3: 'Sapphire Amulet', 4: 'Sapphire Choker', 5: 'Soul of Ice' },
        minorPassive: { key: 'atkPctBonus', value: 0.06, desc: '+6% ATK' },
        majorPassive: { key: 'soulOfIce', atkPct: 0.12, onKillAtkPct: 0.05, desc: '+12% ATK. On kill: permanent +5% ATK' }
    },
    emerald_brooch: {
        slot: 'accessory', baseStats: { dr: 0.03 }, identity: 'DR stacking',
        names: { 1: 'Emerald Brooch', 2: 'Emerald Clasp', 3: 'Emerald Medallion', 4: 'Emerald Crest', 5: 'Shield of Earth' },
        minorPassive: { key: 'flatDR', value: 0.03, desc: '+3% DR' },
        majorPassive: { key: 'shieldOfEarth', dr: 0.06, reflectPct: 0.05, desc: '+6% DR. Reflect 5% damage taken' }
    },
    topaz_band: {
        slot: 'accessory', baseStats: { atkSpd: -0.03 }, identity: 'Speed',
        names: { 1: 'Topaz Band', 2: 'Topaz Ring', 3: 'Topaz Circlet', 4: 'Topaz Crown', 5: "Storm's Eye" },
        minorPassive: { key: 'atkSpdBonus', value: 0.04, desc: '+4% ATK speed' },
        majorPassive: { key: 'stormsEye', atkSpdPct: 0.10, dodgePct: 0.05, desc: '+10% ATK speed, +5% dodge' }
    },
    diamond_pin: {
        slot: 'accessory', baseStats: { critChance: 0.03 }, identity: 'Crit',
        names: { 1: 'Diamond Pin', 2: 'Diamond Brooch', 3: 'Diamond Pendant', 4: 'Diamond Star', 5: 'Star of Destiny' },
        minorPassive: { key: 'critChanceBonus', value: 0.05, desc: '+5% crit chance' },
        majorPassive: { key: 'starOfDestiny', critChance: 0.10, critDmg: 0.15, desc: '+10% crit chance, +15% crit damage' }
    },
    amethyst_charm: {
        slot: 'accessory', baseStats: { startMana: 5 }, identity: 'Mana',
        names: { 1: 'Amethyst Charm', 2: 'Amethyst Focus', 3: 'Amethyst Orb', 4: 'Amethyst Core', 5: 'Void Heart' },
        minorPassive: { key: 'startManaBonus', value: 8, desc: '+8 starting mana' },
        majorPassive: { key: 'voidHeart', startMana: 15, manaCostReduce: 0.10, desc: '+15 start mana, abilities cost 10% less' }
    },
    onyx_sigil: {
        slot: 'accessory', baseStats: { tenacity: 0.03 }, identity: 'Tenacity',
        names: { 1: 'Onyx Sigil', 2: 'Onyx Ward', 3: 'Onyx Aegis', 4: 'Onyx Bulwark', 5: 'Unyielding Will' },
        minorPassive: { key: 'tenacityBonus', value: 0.05, desc: '+5% tenacity' },
        majorPassive: { key: 'unyieldingWill', tenacity: 0.12, ccImmuneSec: 1.5, cooldownSec: 10, desc: '+12% tenacity. First CC per 10s: immune 1.5s' }
    },
    prismatic_locket: {
        slot: 'accessory', baseStats: { hp: 40, atk: 3 }, identity: 'Hybrid',
        names: { 1: 'Prismatic Locket', 2: 'Prismatic Chain', 3: 'Prismatic Amulet', 4: 'Prismatic Crown', 5: 'Infinity Locket' },
        minorPassive: { key: 'allStatsPctBonus', value: 0.03, desc: '+3% all stats' },
        majorPassive: { key: 'infinityLocket', allStatsPct: 0.06, elemDmgBonus: 0.10, desc: '+6% all stats, +10% element damage' }
    }
};

// ---- Build slot-to-item-lines lookup ----

var _slotToLines = null;
function getItemLinesForSlot(slot) {
    if (!_slotToLines) {
        _slotToLines = {};
        var keys = Object.keys(ITEM_LINES);
        for (var i = 0; i < keys.length; i++) {
            var line = ITEM_LINES[keys[i]];
            var s = line.slot;
            // Accessories use generic 'accessory' slot but fit accessory1/accessory2
            if (!_slotToLines[s]) _slotToLines[s] = [];
            _slotToLines[s].push(keys[i]);
        }
    }
    var lookupSlot = (slot === 'accessory1' || slot === 'accessory2') ? 'accessory' : slot;
    return _slotToLines[lookupSlot] || [];
}

// ---- Equipment Sets ----

var EQUIPMENT_SETS = {
    inferno: {
        name: 'Inferno', element: 'fire', slots: ['weapon', 'helm', 'chest'],
        bonuses: {
            2: { atkPct: 0.15, allyElementAtkPct: 0.08, desc: '+15% ATK, fire allies +8% ATK' },
            3: { atkPct: 0.25, allyElementAtkPct: 0.15, burnDPS: 10, desc: '+25% ATK, fire allies +15% ATK, attacks burn' }
        }
    },
    tidal: {
        name: 'Tidal', element: 'water', slots: ['weapon', 'offhand', 'boots'],
        bonuses: {
            2: { hpPct: 0.10, allyElementHpPct: 0.08, desc: '+10% HP, water allies +8% HP' },
            3: { hpPct: 0.20, allyElementHpPct: 0.15, regenPct: 0.01, desc: '+20% HP, water allies +15% HP, 1% regen' }
        }
    },
    gaia: {
        name: 'Gaia', element: 'earth', slots: ['gauntlets', 'offhand', 'chest'],
        bonuses: {
            2: { drPct: 0.10, allyElementDRPct: 0.08, desc: '+10% DR, earth allies +8% DR' },
            3: { drPct: 0.18, allyElementDRPct: 0.15, shield: 150, desc: '+18% DR, earth allies +15% DR, +150 shield' }
        }
    },
    tempest: {
        name: 'Tempest', element: 'wind', slots: ['weapon', 'boots', 'accessory'],
        bonuses: {
            2: { atkSpdPct: 0.15, allyElementAtkSpdPct: 0.10, desc: '+15% ATK Spd, wind allies +10% ATK Spd' },
            3: { atkSpdPct: 0.25, allyElementAtkSpdPct: 0.20, dodgePct: 0.10, desc: '+25% ATK Spd, wind allies +20% ATK Spd, +10% dodge' }
        }
    }
};

// ---- Mythic Equipment ----

var MYTHIC_EQUIPMENT = {
    infinity_gauntlet: {
        slot: 'gauntlets', name: 'Infinity Gauntlet', emoji: '🧤✨',
        stats: { atk: 50 },
        passive: { key: 'infinityNova', bonusAbilityDmg: 0.50, novaEveryN: 3, desc: 'Abilities deal 50% bonus damage. Every 3rd cast hits ALL enemies.' },
        recipe: { sourceSlot: 'gauntlets', material: 'dragon_scale', gold: 250 }
    },
    aegis_of_immortality: {
        slot: 'offhand', name: 'Aegis of Immortality', emoji: '🛡️👼',
        stats: { hp: 600, dr: 0.15 },
        passive: { key: 'aegisRevive', revivePct: 0.60, invulnDuration: 3, taunt: true, desc: 'Revive at 60% HP, invulnerable 3s + taunt. Once per combat.' },
        recipe: { sourceSlot: 'offhand', material: 'dragon_scale', gold: 250 }
    },
    eclipse: {
        slot: 'weapon', name: 'Eclipse', emoji: '🌑✨',
        stats: { atk: 35 },
        passive: { key: 'eclipseLifesteal', lifesteal: 0.20, overhealShieldPct: 0.30, shieldBonusDmg: 0.15, desc: '20% lifesteal. Excess heals → shield (max 30% HP). While shielded, +15% dmg.' },
        recipe: { sourceSlot: 'weapon', material: 'void_crystal', gold: 250 }
    },
    staff_of_ages: {
        slot: 'weapon', name: 'Staff of Ages', emoji: '🪄🌟',
        stats: { atk: 45, startMana: 20 },
        passive: { key: 'infiniteScaling', dmgPerCast: 0.03, desc: 'Ability damage permanently +3% per cast (no cap).' },
        recipe: { sourceSlot: 'weapon', material: 'void_crystal', gold: 250 }
    },
    worldbreaker: {
        slot: 'weapon', name: 'Worldbreaker', emoji: '⚔️🌍',
        stats: { atk: 30, atkSpd: -0.15 },
        passive: { key: 'worldbreakerRampage', atkBonus: 0.15, asBonus: 0.15, duration: 8, maxStacks: 5, splashAtMax: true, desc: 'On kill: +15% ATK/AS for 8s (5x max). At 5 stacks, splash.' },
        recipe: { sourceSlot: 'weapon', material: 'world_shard', gold: 250 }
    },
    crown_of_ages: {
        slot: 'helm', name: 'Crown of Ages', emoji: '👑🌟',
        stats: { startMana: 40 },
        passive: { key: 'crownFreeCast', cooldown: 12, drWhileOnCD: 0.15, desc: 'After casting, next ability costs 0 mana (12s CD). While on CD, +15% DR.' },
        recipe: { sourceSlot: 'helm', material: 'world_shard', gold: 250 }
    }
};

// ---- Mythic Materials ----

var MYTHIC_MATERIALS = {
    dragon_scale: { name: 'Dragon Scale', emoji: '🐉', desc: 'Drops from boss fights' },
    void_crystal: { name: 'Void Crystal', emoji: '🔮', desc: 'Drops from 3-starring late missions' },
    world_shard: { name: 'World Shard', emoji: '🌍', desc: 'Obtained from high achievements' }
};

// ---- Essences ----

var ESSENCES = {
    fire: { name: 'Fire Essence', emoji: '🔥💎', color: '#ff4444' },
    water: { name: 'Water Essence', emoji: '💧💎', color: '#4488ff' },
    earth: { name: 'Earth Essence', emoji: '🌿💎', color: '#44aa44' },
    wind: { name: 'Wind Essence', emoji: '💨💎', color: '#aa44ff' },
    lightning: { name: 'Lightning Essence', emoji: '⚡💎', color: '#ffcc00' },
    force: { name: 'Force Essence', emoji: '💥💎', color: '#ff6644' },
    arcane: { name: 'Arcane Essence', emoji: '✨💎', color: '#dd88ff' }
};

// ---- ID Generator ----

function generateItemId() {
    return Math.random().toString(36).substr(2, 9);
}

// ---- Core: Generate Equipment Drop ----

function generateEquipmentDrop(regionId, isBoss, is3Star) {
    var region = parseInt(regionId, 10) || 1;

    // 1. Roll tier
    var tierWeights = REGION_DROP_CONFIG[region] ? REGION_DROP_CONFIG[region].tiers : { 1: 100 };
    var tier = _weightedRoll(tierWeights);

    // 2. Roll rarity
    var rBonus = REGION_RARITY_BONUS[region] || { legendary: 0, epic: 0 };
    var weights = {
        common: RARITY_CONFIG.dropWeights.common,
        uncommon: RARITY_CONFIG.dropWeights.uncommon,
        rare: RARITY_CONFIG.dropWeights.rare,
        epic: RARITY_CONFIG.dropWeights.epic + rBonus.epic,
        legendary: RARITY_CONFIG.dropWeights.legendary + rBonus.legendary
    };
    var rarity = _weightedRoll(weights);

    // Boss bonus: minimum uncommon
    if (isBoss) {
        var rarityOrder = RARITY_CONFIG.tiers;
        var idx = rarityOrder.indexOf(rarity);
        if (idx < 1) rarity = 'uncommon';
    }

    // 3. Pick random slot and random item line
    var slot = EQUIPMENT_SLOTS[Math.floor(Math.random() * EQUIPMENT_SLOTS.length)];
    var lines = getItemLinesForSlot(slot);
    if (lines.length === 0) { slot = 'weapon'; lines = getItemLinesForSlot('weapon'); }
    var itemKey = lines[Math.floor(Math.random() * lines.length)];
    var lineDef = ITEM_LINES[itemKey];

    // 4. Roll affixes
    var affixCount = RARITY_CONFIG.affixCount[rarity] || 0;
    var affixPool = SLOT_AFFIXES[slot] || SLOT_AFFIXES.weapon;
    var affixes = _rollAffixes(affixPool, affixCount, rarity);

    // 5. Build equipment object
    var equipment = {
        id: generateItemId(),
        slot: slot,
        itemKey: itemKey,
        tier: parseInt(tier, 10),
        rarity: rarity,
        enhanceLevel: 0,
        enhanceFailStreak: 0,
        gems: [],
        affixes: affixes,
        setId: null,
        equipped: null
    };

    // Initialize gem socket array
    var sockets = SOCKET_CONFIG.socketsPerRarity[rarity] || 0;
    for (var g = 0; g < sockets; g++) equipment.gems.push(null);

    return equipment;
}

// ---- Core: Calculate Equipment Stats ----

var _equipStatsCache = {};

function invalidateEquipCache(equipmentId) {
    if (equipmentId) delete _equipStatsCache[equipmentId];
    else _equipStatsCache = {};
}

function calculateEquipmentStats(equipment) {
    if (!equipment) return {};
    var cacheKey = equipment.id + '_' + equipment.enhanceLevel + '_' + (equipment.setId || '') + '_' + equipment.affixes.length;
    if (_equipStatsCache[cacheKey]) return _equipStatsCache[cacheKey];

    var lineDef = ITEM_LINES[equipment.itemKey];
    if (!lineDef) return {};

    var tierMult = TIER_CONFIG.statMultipliers[equipment.tier - 1] || 1.0;
    var rarityMult = RARITY_CONFIG.statMultipliers[equipment.rarity] || 1.0;
    var enhanceBonus = equipment.enhanceLevel > 0 ? ENHANCEMENT_CONFIG.statBonusPct[equipment.enhanceLevel - 1] : 0;

    var stats = {};
    var baseKeys = Object.keys(lineDef.baseStats);
    for (var i = 0; i < baseKeys.length; i++) {
        var baseStat = lineDef.baseStats[baseKeys[i]];
        stats[baseKeys[i]] = baseStat * tierMult * rarityMult * (1 + enhanceBonus);
    }

    // Add affix bonuses
    for (var a = 0; a < equipment.affixes.length; a++) {
        var affix = equipment.affixes[a];
        if (!stats[affix.key]) stats[affix.key] = 0;
        stats[affix.key] += affix.value;
    }

    // Add gem bonuses
    for (var g = 0; g < equipment.gems.length; g++) {
        if (equipment.gems[g]) {
            var gemStats = getGemStatValue(equipment.gems[g]);
            if (gemStats) {
                if (!stats[gemStats.stat]) stats[gemStats.stat] = 0;
                stats[gemStats.stat] += gemStats.value;
            }
        }
    }

    _equipStatsCache[cacheKey] = stats;
    return stats;
}

// ---- Core: Salvage ----

function salvageEquipment(saveData, equipmentId) {
    var equip = _findEquipment(saveData, equipmentId);
    if (!equip) return { success: false, reason: 'Item not found' };
    if (equip.equipped) return { success: false, reason: 'Unequip first' };
    if (equip.rarity === 'mythic') return { success: false, reason: 'Cannot salvage mythic items' };

    // Return gems
    for (var g = 0; g < equip.gems.length; g++) {
        if (equip.gems[g]) {
            if (!saveData.equipment.gems) saveData.equipment.gems = [];
            saveData.equipment.gems.push(equip.gems[g]);
        }
    }

    // Return scraps based on rarity
    var scrapMap = { common: 'commonScraps', uncommon: 'uncommonScraps', rare: 'rareScraps', epic: 'epicScraps', legendary: 'epicScraps' };
    var scrapKey = scrapMap[equip.rarity] || 'commonScraps';
    saveData.equipment.materials[scrapKey] = (saveData.equipment.materials[scrapKey] || 0) + 1;

    // Return 50% of enhancement gold
    if (equip.enhanceLevel > 0) {
        var goldBack = 0;
        for (var e = 0; e < equip.enhanceLevel; e++) {
            goldBack += ENHANCEMENT_CONFIG.costs[e];
        }
        earnGold(saveData, Math.floor(goldBack * 0.5));
    }

    // Remove from inventory
    _removeEquipment(saveData, equipmentId);
    autoSave(saveData);
    return { success: true };
}

// ---- Core: Enhance ----

function enhanceEquipment(saveData, equipmentId) {
    var equip = _findEquipment(saveData, equipmentId);
    if (!equip) return { success: false, reason: 'Item not found' };
    if (equip.rarity === 'common') return { success: false, reason: 'Cannot enhance Common items' };

    var targetLevel = (equip.enhanceLevel || 0) + 1;
    if (targetLevel > ENHANCEMENT_CONFIG.maxLevel) return { success: false, reason: 'Already at max (+10)' };

    var cost = ENHANCEMENT_CONFIG.costs[targetLevel - 1];
    if (equip.rarity === 'mythic') cost = Math.floor(cost * ENHANCEMENT_CONFIG.mythicCostMult);
    if (saveData.player.veilEssence < cost) return { success: false, reason: 'Not enough VE (' + cost + ' VE)' };

    spendGold(saveData, cost);
    saveData.stats.enhancementsPerformed = (saveData.stats.enhancementsPerformed || 0) + 1;

    // Pity check
    var pity = equip.enhanceFailStreak || 0;
    var rate = ENHANCEMENT_CONFIG.successRates[targetLevel - 1];
    var guaranteed = pity >= ENHANCEMENT_CONFIG.pityThreshold;

    if (guaranteed || Math.random() < rate) {
        equip.enhanceLevel = targetLevel;
        equip.enhanceFailStreak = 0;
        invalidateEquipCache(equipmentId);
        if (targetLevel > (saveData.stats.maxEnhanceLevel || 0)) saveData.stats.maxEnhanceLevel = targetLevel;
        autoSave(saveData);
        return { success: true, level: targetLevel, pity: guaranteed };
    } else {
        var penalty = ENHANCEMENT_CONFIG.failurePenalty[targetLevel - 1] || 0;
        if (penalty < 0) equip.enhanceLevel = Math.max(0, equip.enhanceLevel + penalty);
        equip.enhanceFailStreak = (equip.enhanceFailStreak || 0) + 1;
        invalidateEquipCache(equipmentId);
        autoSave(saveData);
        return { success: false, reason: 'Enhancement failed', level: equip.enhanceLevel, streak: equip.enhanceFailStreak };
    }
}

// ---- Core: Reforge Affixes ----

function reforgeAffixes(saveData, equipmentId) {
    var equip = _findEquipment(saveData, equipmentId);
    if (!equip) return { success: false, reason: 'Item not found' };
    if (equip.rarity === 'common') return { success: false, reason: 'Common items have no affixes' };

    var forgeLevel = getBuildingLevel(saveData, 'echo_shaping');
    if (forgeLevel < 3) return { success: false, reason: 'Forge level 3 required' };

    var cost = 40;
    if (saveData.player.veilEssence < cost) return { success: false, reason: 'Not enough VE (40 VE)' };

    spendGold(saveData, cost);

    var affixCount = RARITY_CONFIG.affixCount[equip.rarity] || 0;
    var affixPool = SLOT_AFFIXES[equip.slot] || SLOT_AFFIXES.weapon;
    equip.affixes = _rollAffixes(affixPool, affixCount, equip.rarity);

    invalidateEquipCache(equipmentId);
    autoSave(saveData);
    return { success: true, affixes: equip.affixes };
}

// ---- Core: Set Infuse ----

function infuseSet(saveData, equipmentId, setKey) {
    var equip = _findEquipment(saveData, equipmentId);
    if (!equip) return { success: false, reason: 'Item not found' };

    var forgeLevel = getBuildingLevel(saveData, 'echo_shaping');
    if (forgeLevel < 4) return { success: false, reason: 'Forge level 4 required' };

    var rarityIdx = RARITY_CONFIG.tiers.indexOf(equip.rarity);
    if (rarityIdx < 3) return { success: false, reason: 'Requires Epic+ rarity' };

    var setDef = EQUIPMENT_SETS[setKey];
    if (!setDef) return { success: false, reason: 'Unknown set' };

    // Check if slot is valid for this set
    var normalSlot = (equip.slot === 'accessory1' || equip.slot === 'accessory2') ? 'accessory' : equip.slot;
    if (setDef.slots.indexOf(normalSlot) < 0) return { success: false, reason: 'This slot is not part of the ' + setDef.name + ' set' };

    var cost = 50;
    if (saveData.player.veilEssence < cost) return { success: false, reason: 'Not enough VE (50 VE)' };

    // Need 1 essence of the set's element
    var essenceKey = setDef.element;
    if (!saveData.equipment.essences[essenceKey] || saveData.equipment.essences[essenceKey] < 1) {
        return { success: false, reason: 'Need 1 ' + ESSENCES[essenceKey].name };
    }

    spendGold(saveData, cost);
    saveData.equipment.essences[essenceKey]--;
    equip.setId = setKey;

    invalidateEquipCache(equipmentId);
    autoSave(saveData);
    return { success: true };
}

// ---- Core: Cleanse Set ----

function cleanseSet(saveData, equipmentId) {
    var equip = _findEquipment(saveData, equipmentId);
    if (!equip) return { success: false, reason: 'Item not found' };
    if (!equip.setId) return { success: false, reason: 'No set to cleanse' };

    var forgeLevel = getBuildingLevel(saveData, 'echo_shaping');
    if (forgeLevel < 4) return { success: false, reason: 'Forge level 4 required' };

    var cost = 25;
    if (saveData.player.veilEssence < cost) return { success: false, reason: 'Not enough VE (25 VE)' };

    spendGold(saveData, cost);
    equip.setId = null;
    invalidateEquipCache(equipmentId);
    autoSave(saveData);
    return { success: true };
}

// ---- Core: Craft Mythic ----

function craftMythic(saveData, legendaryEquipmentId, mythicKey) {
    var forgeLevel = getBuildingLevel(saveData, 'echo_shaping');
    if (forgeLevel < 5) return { success: false, reason: 'Forge level 5 required' };

    var equip = _findEquipment(saveData, legendaryEquipmentId);
    if (!equip) return { success: false, reason: 'Item not found' };
    if (equip.rarity !== 'legendary') return { success: false, reason: 'Requires Legendary equipment' };
    if (equip.equipped) return { success: false, reason: 'Unequip first' };

    var mythicDef = MYTHIC_EQUIPMENT[mythicKey];
    if (!mythicDef) return { success: false, reason: 'Unknown mythic' };

    // Check slot match
    var normalSlot = (equip.slot === 'accessory1' || equip.slot === 'accessory2') ? 'accessory' : equip.slot;
    if (normalSlot !== mythicDef.recipe.sourceSlot) return { success: false, reason: 'Wrong slot type' };

    var cost = mythicDef.recipe.gold;
    if (saveData.player.veilEssence < cost) return { success: false, reason: 'Not enough VE (' + cost + ' VE)' };

    var matKey = mythicDef.recipe.material;
    if (!saveData.equipment.mythicMaterials[matKey] || saveData.equipment.mythicMaterials[matKey] < 1) {
        return { success: false, reason: 'Need 1 ' + MYTHIC_MATERIALS[matKey].name };
    }

    spendGold(saveData, cost);
    saveData.equipment.mythicMaterials[matKey]--;
    _removeEquipment(saveData, legendaryEquipmentId);

    // Create mythic equipment
    var mythicEquip = {
        id: generateItemId(),
        slot: mythicDef.slot,
        itemKey: mythicKey,
        tier: 5,
        rarity: 'mythic',
        enhanceLevel: 0,
        enhanceFailStreak: 0,
        gems: [null, null],
        affixes: [],
        setId: null,
        equipped: null,
        isMythic: true
    };

    saveData.equipment.inventory.push(mythicEquip);
    saveData.stats.mythicsCrafted = (saveData.stats.mythicsCrafted || 0) + 1;

    // Discover in codex
    saveData.equipment.codex.discovered[mythicKey] = true;

    autoSave(saveData);
    return { success: true, item: mythicEquip };
}

// ---- Equip / Unequip ----

function equipItem(saveData, equipmentId, unitId) {
    var equip = _findEquipment(saveData, equipmentId);
    if (!equip) return { success: false, reason: 'Item not found' };

    // Check hero gating
    var heroInfo = typeof getHeroForUnit === 'function' ? getHeroForUnit(saveData, unitId) : null;
    if (!heroInfo) return { success: false, reason: 'Assign a hero to equip items' };

    // Check correct slot: if already equipped somewhere, unequip first
    if (equip.equipped) {
        equip.equipped = null;
    }

    // Check mythic limit (1 per unit)
    if (equip.isMythic || equip.rarity === 'mythic') {
        var unitEquips = getEquippedItems(saveData, unitId);
        for (var m = 0; m < unitEquips.length; m++) {
            if (unitEquips[m].isMythic || unitEquips[m].rarity === 'mythic') {
                return { success: false, reason: 'Only 1 mythic per unit' };
            }
        }
    }

    // Check slot: unequip current item in that slot
    var currentInSlot = getEquipmentInSlot(saveData, unitId, equip.slot);
    if (currentInSlot) {
        currentInSlot.equipped = null;
    }

    equip.equipped = { unitId: unitId, heroId: heroInfo.key };
    invalidateEquipCache(equipmentId);
    autoSave(saveData);
    return { success: true };
}

function unequipItem(saveData, equipmentId) {
    var equip = _findEquipment(saveData, equipmentId);
    if (!equip) return false;
    equip.equipped = null;
    invalidateEquipCache(equipmentId);
    autoSave(saveData);
    return true;
}

function unequipAllItemsFromUnit(saveData, unitId) {
    if (!saveData.equipment) return;
    for (var i = 0; i < saveData.equipment.inventory.length; i++) {
        var eq = saveData.equipment.inventory[i];
        if (eq.equipped && eq.equipped.unitId === unitId) {
            eq.equipped = null;
            invalidateEquipCache(eq.id);
        }
    }
}

function getEquippedItems(saveData, unitId) {
    if (!saveData.equipment) return [];
    var result = [];
    for (var i = 0; i < saveData.equipment.inventory.length; i++) {
        var eq = saveData.equipment.inventory[i];
        if (eq.equipped && eq.equipped.unitId === unitId) {
            result.push(eq);
        }
    }
    return result;
}

function getEquipmentInSlot(saveData, unitId, slot) {
    var items = getEquippedItems(saveData, unitId);
    for (var i = 0; i < items.length; i++) {
        if (items[i].slot === slot) return items[i];
    }
    return null;
}

function getEquippedItemCount(saveData, unitId) {
    return getEquippedItems(saveData, unitId).length;
}

// ---- Combat: Apply Equipment Stats ----

function applyItemStats(unit, saveData) {
    if (!saveData.equipment) return;
    var equipped = getEquippedItems(saveData, unit.key);
    if (equipped.length === 0) return;

    // Get hero info for affinity bonus
    var heroInfo = typeof getHeroForUnit === 'function' ? getHeroForUnit(saveData, unit.key) : null;
    var preferredSlots = (heroInfo && heroInfo.def && heroInfo.def.preferredSlots) ? heroInfo.def.preferredSlots : [];

    for (var i = 0; i < equipped.length; i++) {
        var eq = equipped[i];
        var stats;

        if (eq.isMythic || eq.rarity === 'mythic') {
            // Mythic stats
            var mythicDef = MYTHIC_EQUIPMENT[eq.itemKey];
            if (!mythicDef) continue;
            var enhBonus = eq.enhanceLevel > 0 ? ENHANCEMENT_CONFIG.statBonusPct[eq.enhanceLevel - 1] : 0;
            stats = {};
            var mKeys = Object.keys(mythicDef.stats);
            for (var mk = 0; mk < mKeys.length; mk++) {
                stats[mKeys[mk]] = mythicDef.stats[mKeys[mk]] * (1 + enhBonus);
            }
            // Store mythic passive
            if (mythicDef.passive) {
                if (!unit.mythicAbilities) unit.mythicAbilities = [];
                unit.mythicAbilities.push(mythicDef.passive);
            }
        } else {
            stats = calculateEquipmentStats(eq);
        }

        // Hero affinity: +15% stats on preferred slots
        var normalSlot = (eq.slot === 'accessory1' || eq.slot === 'accessory2') ? 'accessory' : eq.slot;
        var isPreferred = preferredSlots.indexOf(normalSlot) >= 0;
        var affinityMult = isPreferred ? 1.15 : 1.0;

        // Apply stats to unit
        var statKeys = Object.keys(stats);
        for (var s = 0; s < statKeys.length; s++) {
            _applyEquipStat(unit, statKeys[s], stats[statKeys[s]] * affinityMult);
        }

        // Apply passives
        var lineDef = ITEM_LINES[eq.itemKey];
        if (lineDef) {
            if (RARITY_CONFIG.hasMinorPassive[eq.rarity] && lineDef.minorPassive) {
                if (!unit.equipPassives) unit.equipPassives = [];
                unit.equipPassives.push(lineDef.minorPassive);
            }
            if (RARITY_CONFIG.hasMajorPassive[eq.rarity] && lineDef.majorPassive) {
                if (!unit.equipPassives) unit.equipPassives = [];
                unit.equipPassives.push(lineDef.majorPassive);
            }
        }

        // Apply gem stats
        for (var gIdx = 0; gIdx < eq.gems.length; gIdx++) {
            if (eq.gems[gIdx]) {
                var gemStat = getGemStatValue(eq.gems[gIdx]);
                if (gemStat) _applyEquipStat(unit, gemStat.stat, gemStat.value);
            }
        }
    }

    // Apply set bonuses
    _applyEquipmentSetBonuses(unit, equipped, saveData);
}

function _applyEquipStat(unit, stat, value) {
    if (stat === 'atk' || stat === 'attack' || stat === 'flatAtk') { unit.attack += Math.floor(value); }
    else if (stat === 'hp' || stat === 'flatHp') { unit.hp += Math.floor(value); unit.maxHp += Math.floor(value); }
    else if (stat === 'atkSpd' || stat === 'atkSpeed' || stat === 'attackSpd') { unit.attackSpd += value; }
    else if (stat === 'dr' || stat === 'damageReduction') { unit.damageReduction = (unit.damageReduction || 0) + value; }
    else if (stat === 'critChance') { unit.critChance = (unit.critChance || 0) + value / 100; }
    else if (stat === 'critDamage') { unit.bonusCritDamage = (unit.bonusCritDamage || 0) + value / 100; }
    else if (stat === 'healPower') { unit.healBonus = (unit.healBonus || 0) + value / 100; }
    else if (stat === 'startMana') { unit.startMana = (unit.startMana || 0) + Math.floor(value); }
    else if (stat === 'tenacity') { unit.tenacity = (unit.tenacity || 0) + value / 100; }
    else if (stat === 'startShield') { unit.startShield = (unit.startShield || 0) + Math.floor(value); }
    else if (stat === 'manaPerHit') { unit.manaPerHit = (unit.manaPerHit || 0) + Math.floor(value); }
    else if (stat === 'lifesteal') { unit.lifesteal = (unit.lifesteal || 0) + value / 100; }
    else if (stat === 'armorPen') { unit.armorPen = (unit.armorPen || 0) + value / 100; }
    else if (stat === 'onHitDmg') { unit.onHitDmg = (unit.onHitDmg || 0) + Math.floor(value); }
    else if (stat === 'dodge') { unit.dodgeChance = (unit.dodgeChance || 0) + value / 100; }
    else if (stat === 'moveSpeed') { unit.moveSpeedBonus = (unit.moveSpeedBonus || 0) + value / 100; }
    else if (stat === 'elemResist') { unit.elemResist = (unit.elemResist || 0) + value / 100; }
    else if (stat === 'abilityDmg') { unit.abilityDmgBonus = (unit.abilityDmgBonus || 0) + value / 100; }
    else if (stat === 'regenPct') { unit.regenPct = (unit.regenPct || 0) + value; }
    else if (stat === 'atkPct') { unit.attack = Math.floor(unit.attack * (1 + value / 100)); }
    else if (stat === 'hpPct') { var hpAdd = Math.floor(unit.maxHp * value / 100); unit.hp += hpAdd; unit.maxHp += hpAdd; }
    else if (stat === 'allStatsPct') { var mult = value / 100; unit.attack = Math.floor(unit.attack * (1 + mult)); var hpBonus = Math.floor(unit.maxHp * mult); unit.hp += hpBonus; unit.maxHp += hpBonus; }
}

function _applyEquipmentSetBonuses(unit, equipped, saveData) {
    // Count set pieces on this unit
    var setCounts = {};
    for (var i = 0; i < equipped.length; i++) {
        if (equipped[i].setId) {
            if (!setCounts[equipped[i].setId]) setCounts[equipped[i].setId] = 0;
            setCounts[equipped[i].setId]++;
        }
    }

    var setKeys = Object.keys(setCounts);
    for (var s = 0; s < setKeys.length; s++) {
        var sk = setKeys[s];
        var setDef = EQUIPMENT_SETS[sk];
        if (!setDef) continue;
        var count = setCounts[sk];

        // Apply highest qualifying bonus
        var bonusLevels = Object.keys(setDef.bonuses).sort(function(a, b) { return parseInt(b) - parseInt(a); });
        for (var b = 0; b < bonusLevels.length; b++) {
            if (count >= parseInt(bonusLevels[b])) {
                var bonus = setDef.bonuses[bonusLevels[b]];
                if (bonus.atkPct) unit.attack = Math.floor(unit.attack * (1 + bonus.atkPct));
                if (bonus.hpPct) { var hpAdd = Math.floor(unit.maxHp * bonus.hpPct); unit.hp += hpAdd; unit.maxHp += hpAdd; }
                if (bonus.drPct) unit.damageReduction = (unit.damageReduction || 0) + bonus.drPct;
                if (bonus.atkSpdPct) unit.attackSpd += unit.attackSpd * bonus.atkSpdPct;
                if (bonus.dodgePct) unit.dodgeChance = (unit.dodgeChance || 0) + bonus.dodgePct;
                if (bonus.regenPct) unit.regenPct = (unit.regenPct || 0) + bonus.regenPct;
                if (bonus.shield) unit.startShield = (unit.startShield || 0) + bonus.shield;
                if (bonus.burnDPS) {
                    if (!unit.itemSpecials) unit.itemSpecials = [];
                    unit.itemSpecials.push({ type: 'tick', effect: 'setBurn', burnDPS: bonus.burnDPS });
                }
                break; // Only apply highest tier
            }
        }
    }
}

// For backward-compat: old code called calculateActiveSetBonuses
function calculateActiveSetBonuses(playerUnits, saveData) { return {}; }
function applySetBonuses(playerUnits, setCounts) { }

// ---- Display Helpers ----

function getItemName(equipment) {
    if (!equipment) return 'Unknown';
    if (equipment.isMythic || equipment.rarity === 'mythic') {
        var mythicDef = MYTHIC_EQUIPMENT[equipment.itemKey];
        var name = mythicDef ? mythicDef.name : equipment.itemKey;
        if (equipment.enhanceLevel > 0) name += ' +' + equipment.enhanceLevel;
        return name;
    }
    var lineDef = ITEM_LINES[equipment.itemKey];
    if (!lineDef) return equipment.itemKey;
    var name = lineDef.names[equipment.tier] || lineDef.names[1] || equipment.itemKey;
    if (equipment.enhanceLevel > 0) name += ' +' + equipment.enhanceLevel;
    return name;
}

function getItemEmoji(equipment) {
    if (!equipment) return '?';
    if (equipment.isMythic || equipment.rarity === 'mythic') {
        var mythicDef = MYTHIC_EQUIPMENT[equipment.itemKey];
        return mythicDef ? mythicDef.emoji : '✨';
    }
    var slotInfo = SLOT_DISPLAY[equipment.slot];
    return slotInfo ? slotInfo.emoji : '📦';
}

function getItemRarityColor(equipment) {
    if (!equipment) return '#aaa';
    return RARITY_CONFIG.colors[equipment.rarity] || '#aaa';
}

function getItemRarityName(equipment) {
    if (!equipment) return 'Unknown';
    if (equipment.rarity === 'mythic') return '🌟 Mythic';
    return (equipment.rarity || 'common').charAt(0).toUpperCase() + (equipment.rarity || 'common').slice(1);
}

function getItemStatDescription(equipment) {
    if (!equipment) return '';
    var lines = [];

    if (equipment.isMythic || equipment.rarity === 'mythic') {
        var mythicDef = MYTHIC_EQUIPMENT[equipment.itemKey];
        if (!mythicDef) return '';
        var mKeys = Object.keys(mythicDef.stats);
        for (var mk = 0; mk < mKeys.length; mk++) {
            lines.push(_formatEquipStat(mKeys[mk], mythicDef.stats[mKeys[mk]]));
        }
        if (mythicDef.passive) lines.push('🌟 ' + mythicDef.passive.desc);
        return lines.join(', ');
    }

    var stats = calculateEquipmentStats(equipment);
    var sk = Object.keys(stats);
    for (var i = 0; i < sk.length; i++) {
        lines.push(_formatEquipStat(sk[i], stats[sk[i]]));
    }

    // Passive descriptions
    var lineDef = ITEM_LINES[equipment.itemKey];
    if (lineDef) {
        if (RARITY_CONFIG.hasMinorPassive[equipment.rarity] && lineDef.minorPassive) {
            lines.push('✦ ' + lineDef.minorPassive.desc);
        }
        if (RARITY_CONFIG.hasMajorPassive[equipment.rarity] && lineDef.majorPassive) {
            lines.push('★ ' + lineDef.majorPassive.desc);
        }
    }

    // Set tag
    if (equipment.setId) {
        var setDef = EQUIPMENT_SETS[equipment.setId];
        if (setDef) lines.push('[' + setDef.name + ' Set]');
    }

    return lines.join(', ');
}

function _formatEquipStat(stat, value) {
    if (stat === 'atk' || stat === 'flatAtk' || stat === 'attack') return '+' + Math.floor(value) + ' ATK';
    if (stat === 'hp' || stat === 'flatHp') return '+' + Math.floor(value) + ' HP';
    if (stat === 'atkSpd' || stat === 'atkSpeed' || stat === 'attackSpd') return (value < 0 ? '' : '+') + value.toFixed(2) + 's ATK SPD';
    if (stat === 'dr' || stat === 'damageReduction') return '+' + (typeof value === 'number' && value < 1 ? Math.round(value * 100) : value) + '% DR';
    if (stat === 'critChance') return '+' + (typeof value === 'number' && value < 1 ? Math.round(value * 100) : value) + '% Crit';
    if (stat === 'critDamage') return '+' + (typeof value === 'number' && value < 1 ? Math.round(value * 100) : value) + '% Crit DMG';
    if (stat === 'healPower') return '+' + (typeof value === 'number' && value < 1 ? Math.round(value * 100) : value) + '% Heal Power';
    if (stat === 'startMana') return '+' + Math.floor(value) + ' Start Mana';
    if (stat === 'tenacity') return '+' + (typeof value === 'number' && value < 1 ? Math.round(value * 100) : value) + '% Tenacity';
    if (stat === 'startShield') return '+' + Math.floor(value) + ' Shield';
    if (stat === 'manaPerHit') return '+' + Math.floor(value) + ' Mana/Hit';
    if (stat === 'lifesteal') return '+' + value + '% Lifesteal';
    if (stat === 'armorPen') return 'Ignore ' + value + '% DR';
    if (stat === 'onHitDmg') return '+' + Math.floor(value) + ' On-Hit';
    if (stat === 'dodge') return '+' + value + '% Dodge';
    if (stat === 'moveSpeed') return '+' + value + '% Move Spd';
    if (stat === 'elemResist') return '+' + value + '% Elem Resist';
    if (stat === 'abilityDmg') return '+' + value + '% Ability DMG';
    if (stat === 'atkPct') return '+' + value + '% ATK';
    if (stat === 'hpPct') return '+' + value + '% HP';
    if (stat === 'regenPct') return '+' + value + '% HP Regen/s';
    if (stat === 'allStatsPct') return '+' + value + '% All Stats';
    return '+' + value + ' ' + stat;
}

// ---- Sell Equipment ----

function getItemSellValue(equipment) {
    if (!equipment) return 0;
    if (equipment.rarity === 'mythic') return 0;
    var rarityValues = { common: 5, uncommon: 10, rare: 25, epic: 50, legendary: 100 };
    var tierMult = equipment.tier || 1;
    return (rarityValues[equipment.rarity] || 5) * tierMult;
}

function sellItem(saveData, equipmentId) {
    var equip = _findEquipment(saveData, equipmentId);
    if (!equip) return false;
    if (equip.equipped) return false;
    if (equip.rarity === 'mythic') return false;
    var value = getItemSellValue(equip);
    _removeEquipment(saveData, equipmentId);
    earnGold(saveData, value);
    autoSave(saveData);
    return value;
}

// ---- Gem System (mostly preserved from old system) ----

var GEM_STATS = {
    ruby:      { stat: 'flatHp',     values: { standard: 30, uncommon: 60, rare: 100, epic: 150 } },
    sapphire:  { stat: 'flatAtk',    values: { standard: 3,  uncommon: 6,  rare: 10,  epic: 15  } },
    emerald:   { stat: 'dr',         values: { standard: 1,  uncommon: 2,  rare: 3,   epic: 5   } },
    topaz:     { stat: 'atkSpeed',   values: { standard: -0.01, uncommon: -0.02, rare: -0.03, epic: -0.05 } },
    diamond:   { stat: 'critChance', values: { standard: 1.5, uncommon: 3,  rare: 5,   epic: 8   } },
    amethyst:  { stat: 'startMana',  values: { standard: 3,  uncommon: 6,  rare: 10,  epic: 15  } },
    opal:      { stat: 'healPower',  values: { standard: 2,  uncommon: 4,  rare: 6,   epic: 10  } },
    onyx:      { stat: 'tenacity',   values: { standard: 2,  uncommon: 4,  rare: 6,   epic: 10  } },
    prismatic: { stat: 'allStatsPct', values: { standard: 0.5, uncommon: 1, rare: 1.5, epic: 2.5 } }
};

function getGemStatValue(gem) {
    if (!gem) return null;
    // gem is either a string like "ruby_rare" or an object { type, rarity }
    var gemType, gemRarity;
    if (typeof gem === 'string') {
        var parts = gem.split('_');
        gemType = parts[0];
        gemRarity = parts.length > 1 ? parts[1] : 'standard';
    } else {
        gemType = gem.type;
        gemRarity = gem.rarity || 'standard';
    }
    var gemDef = GEM_STATS[gemType];
    if (!gemDef) return null;
    return { stat: gemDef.stat, value: gemDef.values[gemRarity] || gemDef.values.standard };
}

function createGemInstance(gemType, rarity) {
    return { id: generateItemId(), type: gemType, rarity: rarity || 'standard' };
}

function socketGem(saveData, equipmentId, gemId) {
    var equip = _findEquipment(saveData, equipmentId);
    if (!equip) return { success: false, reason: 'Item not found' };
    var emptySlot = -1;
    for (var i = 0; i < equip.gems.length; i++) {
        if (!equip.gems[i]) { emptySlot = i; break; }
    }
    if (emptySlot < 0) return { success: false, reason: 'No empty sockets' };

    // Find gem in inventory
    if (!saveData.equipment.gems) return { success: false, reason: 'No gems' };
    var gemIdx = -1;
    for (var g = 0; g < saveData.equipment.gems.length; g++) {
        var gem = saveData.equipment.gems[g];
        var gId = typeof gem === 'object' ? gem.id : gem;
        if (gId === gemId || gem === gemId) { gemIdx = g; break; }
    }
    if (gemIdx < 0) return { success: false, reason: 'Gem not found' };

    var gem = saveData.equipment.gems.splice(gemIdx, 1)[0];
    equip.gems[emptySlot] = typeof gem === 'object' ? (gem.type + '_' + gem.rarity) : gem;
    invalidateEquipCache(equipmentId);
    saveData.stats.gemsSocketed = (saveData.stats.gemsSocketed || 0) + 1;
    autoSave(saveData);
    return { success: true };
}

function unsocketGem(saveData, equipmentId, socketIndex) {
    var equip = _findEquipment(saveData, equipmentId);
    if (!equip) return { success: false, reason: 'Item not found' };
    if (!equip.gems[socketIndex]) return { success: false, reason: 'Socket empty' };

    var cost = SOCKET_CONFIG.removeCost;
    if (saveData.player.veilEssence < cost) return { success: false, reason: 'Not enough VE (' + cost + ' VE)' };

    spendGold(saveData, cost);

    var gemStr = equip.gems[socketIndex];
    equip.gems[socketIndex] = null;
    if (!saveData.equipment.gems) saveData.equipment.gems = [];
    saveData.equipment.gems.push(gemStr);

    invalidateEquipCache(equipmentId);
    autoSave(saveData);
    return { success: true };
}

function forgeGemCombine(saveData, gemType, gemRarity) {
    if (!saveData.equipment.gems) return { success: false, reason: 'No gems' };
    var cost = SOCKET_CONFIG.combineCost;
    if (saveData.player.veilEssence < cost) return { success: false, reason: 'Not enough VE (' + cost + ' VE)' };

    var rarityOrder = SOCKET_CONFIG.gemRarities;
    var rIdx = rarityOrder.indexOf(gemRarity);
    if (rIdx < 0 || rIdx >= rarityOrder.length - 1) return { success: false, reason: 'Cannot combine this rarity' };

    // Find 3 gems of this type and rarity
    var found = [];
    for (var i = 0; i < saveData.equipment.gems.length; i++) {
        var g = saveData.equipment.gems[i];
        var gType, gRarity;
        if (typeof g === 'string') { var p = g.split('_'); gType = p[0]; gRarity = p[1] || 'standard'; }
        else { gType = g.type; gRarity = g.rarity || 'standard'; }
        if (gType === gemType && gRarity === gemRarity) found.push(i);
        if (found.length >= 3) break;
    }
    if (found.length < 3) return { success: false, reason: 'Need 3 ' + gemRarity + ' ' + gemType + ' gems' };

    spendGold(saveData, cost);

    // Remove 3 gems (reverse order to preserve indices)
    found.sort(function(a, b) { return b - a; });
    for (var r = 0; r < 3; r++) saveData.equipment.gems.splice(found[r], 1);

    // Add 1 higher rarity gem
    var newRarity = rarityOrder[rIdx + 1];
    saveData.equipment.gems.push(gemType + '_' + newRarity);

    autoSave(saveData);
    return { success: true, newGem: gemType + '_' + newRarity };
}

// ---- Gem Drop Rolling ----

function rollGemDrop(missionLevel) {
    var types = SOCKET_CONFIG.gemTypes;
    var type = types[Math.floor(Math.random() * (types.length - 1))]; // Exclude prismatic from normal drops
    var rarity = 'standard';
    var roll = Math.random();
    if (missionLevel >= 12 && roll < 0.05) rarity = 'epic';
    else if (missionLevel >= 8 && roll < 0.15) rarity = 'rare';
    else if (missionLevel >= 4 && roll < 0.35) rarity = 'uncommon';
    return type + '_' + rarity;
}

function rollBossGemDrop() {
    var roll = Math.random();
    if (roll < 0.5) return 'prismatic_' + (Math.random() < 0.3 ? 'rare' : 'uncommon');
    var types = SOCKET_CONFIG.gemTypes;
    var type = types[Math.floor(Math.random() * (types.length - 1))];
    return type + '_' + (Math.random() < 0.4 ? 'rare' : 'uncommon');
}

// ---- Mission Reward Generation ----

function generateMissionRewards(missionLevel, starRating, isBoss, saveData) {
    var rewards = {
        items: [],
        gems: [],
        essences: {},
        mythicMaterials: {}
    };

    // Determine region from mission level
    var region = Math.min(8, Math.ceil(missionLevel / 2));

    // Equipment drops
    rewards.items.push(generateEquipmentDrop(region, isBoss, starRating >= 3));
    if (starRating >= 3) rewards.items.push(generateEquipmentDrop(region, false, true));
    if (isBoss) rewards.items.push(generateEquipmentDrop(region, true, false));

    // Gem drops
    if (missionLevel >= 5 && Math.random() < DROP_CONFIG.gemDropChance) {
        rewards.gems.push(rollGemDrop(missionLevel));
    }
    if (isBoss) rewards.gems.push(rollBossGemDrop());

    // Material drops
    if (Math.random() < DROP_CONFIG.materialDropChance) {
        var matTypes = ['oreShards', 'refinedOre', 'elementalDust'];
        rewards.materials = {};
        var mat = matTypes[Math.floor(Math.random() * matTypes.length)];
        rewards.materials[mat] = 1;
    }

    // Essence drops
    var elements = ['fire', 'water', 'earth', 'wind', 'lightning', 'force'];
    if (missionLevel >= 8 && Math.random() < 0.15) {
        var elem = elements[Math.floor(Math.random() * elements.length)];
        rewards.essences[elem] = (rewards.essences[elem] || 0) + 1;
    }
    if (isBoss) rewards.essences.arcane = (rewards.essences.arcane || 0) + 1;

    // Mythic material drops
    if (isBoss && Math.random() < 0.10) {
        rewards.mythicMaterials.dragon_scale = (rewards.mythicMaterials.dragon_scale || 0) + 1;
    }
    if (missionLevel >= 14 && starRating >= 3 && Math.random() < 0.05) {
        rewards.mythicMaterials.void_crystal = (rewards.mythicMaterials.void_crystal || 0) + 1;
    }

    return rewards;
}

function applyMissionRewards(saveData, rewards) {
    if (!saveData.equipment) return;

    // Add equipment to inventory
    for (var i = 0; i < rewards.items.length; i++) {
        saveData.equipment.inventory.push(rewards.items[i]);
        // Codex discovery
        saveData.equipment.codex.discovered[rewards.items[i].itemKey + '_t' + rewards.items[i].tier] = true;
    }

    // Add gems
    if (!saveData.equipment.gems) saveData.equipment.gems = [];
    for (var g = 0; g < rewards.gems.length; g++) {
        saveData.equipment.gems.push(rewards.gems[g]);
    }

    // Add essences
    var essKeys = Object.keys(rewards.essences);
    for (var e = 0; e < essKeys.length; e++) {
        saveData.equipment.essences[essKeys[e]] = (saveData.equipment.essences[essKeys[e]] || 0) + rewards.essences[essKeys[e]];
    }

    // Add materials
    if (rewards.materials) {
        var matKeys = Object.keys(rewards.materials);
        for (var m = 0; m < matKeys.length; m++) {
            saveData.equipment.materials[matKeys[m]] = (saveData.equipment.materials[matKeys[m]] || 0) + rewards.materials[matKeys[m]];
        }
    }

    // Add mythic materials
    var mythMatKeys = Object.keys(rewards.mythicMaterials);
    for (var mm = 0; mm < mythMatKeys.length; mm++) {
        saveData.equipment.mythicMaterials[mythMatKeys[mm]] = (saveData.equipment.mythicMaterials[mythMatKeys[mm]] || 0) + rewards.mythicMaterials[mythMatKeys[mm]];
    }
}

// ---- Inventory Helpers (backward-compat wrappers) ----

function addItemToBench(saveData, item) {
    if (!saveData.equipment) return false;
    saveData.equipment.inventory.push(item);
    return true;
}

function removeItemFromBench(saveData, itemId) {
    return _removeEquipment(saveData, itemId);
}

function getBenchItems(saveData) {
    if (!saveData.equipment) return [];
    return saveData.equipment.inventory;
}

function isBenchFull(saveData) {
    return false; // No bench limit in new system
}

function findBenchItem(saveData, itemId) {
    return _findEquipment(saveData, itemId);
}

// ---- Collection Bonuses (stub for backward compat) ----

function getActiveCollectionBonuses(saveData) {
    return { dropRarityBonus: 0, gemDropRateBonus: 0, forgeCostReduction: 0, pityThreshold: 3, autoEnhanceUnlocked: false };
}

function autoPopulateRecipeBook(saveData) { /* no-op in new system */ }

// Codex helpers
function getDiscoveredCount(saveData) {
    if (!saveData.equipment || !saveData.equipment.codex) return 0;
    return Object.keys(saveData.equipment.codex.discovered).length;
}

function isRecipeDiscovered(saveData, type, key) {
    if (!saveData.equipment || !saveData.equipment.codex) return false;
    return !!saveData.equipment.codex.discovered[key];
}

// ---- Internal Helpers ----

function _findEquipment(saveData, equipmentId) {
    if (!saveData.equipment) return null;
    for (var i = 0; i < saveData.equipment.inventory.length; i++) {
        if (saveData.equipment.inventory[i].id === equipmentId) return saveData.equipment.inventory[i];
    }
    return null;
}

function _removeEquipment(saveData, equipmentId) {
    if (!saveData.equipment) return null;
    for (var i = 0; i < saveData.equipment.inventory.length; i++) {
        if (saveData.equipment.inventory[i].id === equipmentId) {
            return saveData.equipment.inventory.splice(i, 1)[0];
        }
    }
    return null;
}

function _weightedRoll(weights) {
    var keys = Object.keys(weights);
    var total = 0;
    for (var i = 0; i < keys.length; i++) total += weights[keys[i]];
    var roll = Math.random() * total;
    for (var j = 0; j < keys.length; j++) {
        roll -= weights[keys[j]];
        if (roll <= 0) return keys[j];
    }
    return keys[keys.length - 1];
}

function _rollAffixes(pool, count, rarity) {
    if (count <= 0 || !pool || pool.length === 0) return [];
    var available = [];
    var rarityIdx = RARITY_CONFIG.tiers.indexOf(rarity);
    for (var p = 0; p < pool.length; p++) {
        var affix = pool[p];
        if (affix.minRarity) {
            var minIdx = RARITY_CONFIG.tiers.indexOf(affix.minRarity);
            if (rarityIdx < minIdx) continue;
        }
        available.push(affix);
    }

    var scaling = AFFIX_RARITY_SCALING[rarity] || 1.0;
    var selected = [];
    var usedKeys = {};

    for (var i = 0; i < count && available.length > 0; i++) {
        var idx = Math.floor(Math.random() * available.length);
        var pick = available[idx];
        if (usedKeys[pick.key]) { available.splice(idx, 1); i--; continue; }
        usedKeys[pick.key] = true;

        var value;
        if (pick.isBinary) {
            value = pick.range[0];
        } else {
            var range = pick.range[1] - pick.range[0];
            value = pick.range[0] + Math.random() * range * scaling;
            // Round appropriately
            if (Math.abs(value) >= 1) value = Math.round(value * 10) / 10;
            else value = Math.round(value * 1000) / 1000;
        }

        selected.push({ key: pick.key, value: value, name: pick.name.replace('{v}', value) });
        available.splice(idx, 1);
    }

    return selected;
}

// ---- Backward Compat: old item system stubs ----
// These prevent errors from old code that may still reference them

var ITEM_COMPONENTS = {};
var ITEM_RECIPES = {};
var SET_ITEM_RECIPES = {};
var ABILITY_ITEMS = {};
var MYTHIC_ITEMS = {};
var ITEM_SETS = {};
var ITEM_RARITIES = { standard: { name: 'Standard', color: '#aaa', bonus: 0 }, uncommon: { name: 'Uncommon', color: '#4ade80', bonus: 0.12 }, rare: { name: 'Rare', color: '#60a5fa', bonus: 0.25 }, epic: { name: 'Epic', color: '#c084fc', bonus: 0.50 } };
var ITEM_AFFINITIES = {};
var MAX_ITEM_SLOTS = 8;

function checkItemAffinity() { return null; }
function getAffinityDescription() { return null; }
function getEnhancementLevel(item) { return item ? (item.enhanceLevel || 0) : 0; }
function getEnhancementBonus(item) { var l = getEnhancementLevel(item); return l > 0 ? (ENHANCEMENT_CONFIG.statBonusPct[l - 1] || 0) : 0; }
function getEnhancedStatMultiplier(item) { return 1 + getEnhancementBonus(item); }
function getEnhancementCost(item) { var t = getEnhancementLevel(item) + 1; if (t > 10) return null; return ENHANCEMENT_CONFIG.costs[t - 1]; }
function getCombinedItemStatMultiplier() { return 1; }
function rollItemDrop(ml, sr, sd) { var region = Math.min(8, Math.ceil(ml / 2)); return generateEquipmentDrop(region, false, sr >= 3); }
function rollItemRarity() { return 'common'; }
function createItemInstance(type, key, rarity) { return generateEquipmentDrop(1, false, false); }
function applyGemStatsToUnit() { }
function getItemBenchSizeCompat() { return 999; }
function discoverRecipe() { }
function checkCollectionMilestones() { return []; }
function isMilestoneEarned() { return false; }
function getRecipeBookEntries() { return []; }
function getTotalRecipeCount() { return 0; }
function forgeCraftMythic(saveData, mythicKey) { return { success: false, reason: 'Use craftMythic() instead' }; }
function forgeRerollRarity() { return { success: false, reason: 'Removed in new system' }; }
function forgeDisassemble() { return { success: false, reason: 'Removed in new system' }; }
function forgeTransmute() { return { success: false, reason: 'Removed in new system' }; }
function forgeCraftSetItem() { return { success: false, reason: 'Use infuseSet() instead' }; }
function forgeCraftAbilityItem() { return { success: false, reason: 'Removed in new system' }; }
function forgeEnhance(saveData, itemId) { return enhanceEquipment(saveData, itemId); }
function applyStatToUnit(unit, stat, value) { _applyEquipStat(unit, stat, value); }

// ---- COLLECTION_MILESTONES (stub) ----
var COLLECTION_MILESTONES = {};

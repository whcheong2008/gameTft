// =============================================================================
// items.js — Item system: components, recipes, rarities, inventory helpers
// =============================================================================

// ---- Rarity System ----

var ITEM_RARITIES = {
    standard:  { name: 'Standard',  color: '#aaaaaa', bonus: 0.00 },
    uncommon:  { name: 'Uncommon',  color: '#44bb44', bonus: 0.12 },
    rare:      { name: 'Rare',      color: '#4488ff', bonus: 0.25 },
    epic:      { name: 'Epic',      color: '#aa44ff', bonus: 0.50 }
};

var BASE_RARITY_WEIGHTS = { standard: 60, uncommon: 25, rare: 12, epic: 3 };

// ---- Base Components (12) ----

var ITEM_COMPONENTS = {
    // Original 8
    bf_sword:        { name: 'BF Sword',            emoji: '🗡️', stat: 'attack',          value: 15 },
    chain_vest:      { name: 'Chain Vest',           emoji: '🛡️', stat: 'hp',              value: 200 },
    giants_belt:     { name: "Giant's Belt",         emoji: '💪', stat: 'hp',              value: 300 },
    recurve_bow:     { name: 'Recurve Bow',          emoji: '🏹', stat: 'attackSpd',       value: -0.1 },
    large_rod:       { name: 'Needlessly Large Rod', emoji: '🪄', stat: 'attack',          value: 20 },
    negatron_cloak:  { name: 'Negatron Cloak',       emoji: '🧥', stat: 'damageReduction', value: 0.10 },
    sparring_gloves: { name: 'Sparring Gloves',      emoji: '🥊', stat: 'critChance',      value: 0.10 },
    tear:            { name: 'Tear of the Goddess',  emoji: '💧', stat: 'healPower',       value: 0.20 },
    // New 4 — drop from missions level 10+
    aether_shard:    { name: 'Aether Shard',         emoji: '🔮', stat: 'startMana',       value: 15, minMissionLevel: 10 },
    quicksilver_gem: { name: 'Quicksilver Gem',      emoji: '💎', stat: 'tenacity',        value: 0.15, minMissionLevel: 10 },
    warding_stone:   { name: 'Warding Stone',        emoji: '🪨', stat: 'startShield',     value: 150, minMissionLevel: 10 },
    soul_prism:      { name: 'Soul Prism',           emoji: '🌈', stat: 'manaPerHit',      value: 5, minMissionLevel: 10 }
};

// Keys for original component drop pool (missions 1-9)
var BASE_COMPONENT_KEYS = ['bf_sword', 'chain_vest', 'giants_belt', 'recurve_bow', 'large_rod', 'negatron_cloak', 'sparring_gloves', 'tear'];
// Keys for expanded drop pool (missions 10+)
var ALL_COMPONENT_KEYS = BASE_COMPONENT_KEYS.concat(['aether_shard', 'quicksilver_gem', 'warding_stone', 'soul_prism']);

// ---- Combined Item Recipes (8) ----

var ITEM_RECIPES = {
    infinity_edge: {
        name: 'Infinity Edge', emoji: '⚔️✨',
        components: ['bf_sword', 'bf_sword'],
        stats: { attack: 30, critChance: 0.25 },
        special: null,
        passive: null, ability: null, setId: null
    },
    blade_ruined_king: {
        name: 'Blade of the Ruined King', emoji: '🗡️👑',
        components: ['bf_sword', 'recurve_bow'],
        stats: { attack: 15 },
        special: { type: 'onHit', effect: 'bork', pctMaxHp: 0.03 },
        passive: null, ability: null, setId: null
    },
    titans_resolve: {
        name: "Titan's Resolve", emoji: '🛡️💎',
        components: ['chain_vest', 'negatron_cloak'],
        stats: { hp: 200, damageReduction: 0.15 },
        special: null,
        passive: null, ability: null, setId: null
    },
    warmogs_armor: {
        name: "Warmog's Armor", emoji: '💪❤️',
        components: ['giants_belt', 'giants_belt'],
        stats: { hp: 600 },
        special: { type: 'tick', effect: 'warmogRegen', regenPct: 0.02 },
        passive: null, ability: null, setId: null
    },
    rapid_firecannon: {
        name: 'Rapid Firecannon', emoji: '🏹⚡',
        components: ['recurve_bow', 'recurve_bow'],
        stats: { attackSpd: -0.2, range: 1 },
        special: null,
        passive: null, ability: null, setId: null
    },
    archangels_staff: {
        name: "Archangel's Staff", emoji: '🪄💧',
        components: ['large_rod', 'tear'],
        stats: { attack: 20, healPower: 0.30 },
        special: { type: 'onHeal', effect: 'archangelDmg', damagePct: 0.20 },
        passive: null, ability: null, setId: null
    },
    hand_of_justice: {
        name: 'Hand of Justice', emoji: '🥊🗡️',
        components: ['sparring_gloves', 'bf_sword'],
        stats: { attack: 15, critChance: 0.10 },
        special: { type: 'onKill', effect: 'hojHeal', healPct: 0.10 },
        passive: null, ability: null, setId: null
    },
    dragons_claw: {
        name: "Dragon's Claw", emoji: '🧥🐉',
        components: ['negatron_cloak', 'negatron_cloak'],
        stats: { damageReduction: 0.25, elemResist: 0.20 },
        special: null,
        passive: null, ability: null, setId: null
    },

    // ---- New Combined Recipes (13) ----

    // Offensive
    deathblade: {
        name: 'Deathblade', emoji: '🪄🗡️',
        components: ['large_rod', 'bf_sword'],
        stats: { attack: 35 },
        special: { type: 'onKill', effect: 'deathbladeStack', atkBonus: 0.08, duration: 6, maxStacks: 3 },
        passive: null, ability: null, setId: null
    },
    guinsoos_rageblade: {
        name: "Guinsoo's Rageblade", emoji: '🏹🪄',
        components: ['recurve_bow', 'large_rod'],
        stats: { attack: 15, attackSpd: -0.1 },
        special: { type: 'onAttack', effect: 'ragePermanentAS', asPerStack: 0.03, maxStacks: 10 },
        passive: null, ability: null, setId: null
    },
    statikk_shiv: {
        name: 'Statikk Shiv', emoji: '🏹🥊',
        components: ['recurve_bow', 'sparring_gloves'],
        stats: { attackSpd: -0.1, critChance: 0.10 },
        special: { type: 'onAttackCount', effect: 'chainLightning', every: 3, targets: 2, damage: 50 },
        passive: null, ability: null, setId: null
    },
    last_whisper: {
        name: 'Last Whisper', emoji: '🥊🧥',
        components: ['sparring_gloves', 'negatron_cloak'],
        stats: { critChance: 0.10, damageReduction: 0.10 },
        special: { type: 'onCrit', effect: 'drShred', drReduction: 0.50, duration: 3 },
        passive: null, ability: null, setId: null
    },

    // Defensive
    sunfire_cape: {
        name: 'Sunfire Cape', emoji: '💪🛡️',
        components: ['giants_belt', 'chain_vest'],
        stats: { hp: 500 },
        special: { type: 'aura', effect: 'sunfireDPS', dps: 15, range: 1 },
        passive: null, ability: null, setId: null
    },
    bramble_vest: {
        name: 'Bramble Vest', emoji: '🛡️🛡️',
        components: ['chain_vest', 'chain_vest'],
        stats: { hp: 400 },
        special: { type: 'onHit', effect: 'thornsGrievous', reflectDmg: 80, grievousPct: 0.40, grievousDur: 3 },
        passive: null, ability: null, setId: null
    },
    gargoyle_stoneplate: {
        name: 'Gargoyle Stoneplate', emoji: '🛡️💪',
        components: ['chain_vest', 'giants_belt'],
        stats: { hp: 500 },
        special: { type: 'passive', effect: 'gargoyleDR', drPerAttacker: 0.05, maxDR: 0.25 },
        passive: null, ability: null, setId: null
    },
    redemption: {
        name: 'Redemption', emoji: '💪💧',
        components: ['giants_belt', 'tear'],
        stats: { hp: 300, healPower: 0.20 },
        special: { type: 'onLowHP', effect: 'redemptionHeal', threshold: 0.25, healPct: 0.15, range: 2, once: true },
        passive: null, ability: null, setId: null
    },

    // Mana/Utility
    spear_of_shojin: {
        name: 'Spear of Shojin', emoji: '🗡️🔮',
        components: ['bf_sword', 'aether_shard'],
        stats: { attack: 15, startMana: 15 },
        special: { type: 'onAttack', effect: 'bonusManaPerHit', bonusMana: 5 },
        passive: null, ability: null, setId: null
    },
    blue_buff: {
        name: 'Blue Buff', emoji: '🔮🔮',
        components: ['aether_shard', 'aether_shard'],
        stats: { startMana: 30 },
        special: { type: 'onCast', effect: 'postCastMana', manaRefund: 20 },
        passive: null, ability: null, setId: null
    },
    quicksilver_sash: {
        name: 'Quicksilver Sash', emoji: '💎🧥',
        components: ['quicksilver_gem', 'negatron_cloak'],
        stats: { tenacity: 0.15, damageReduction: 0.10 },
        special: { type: 'onCC', effect: 'qssCleanse', immunitySec: 1.5, cooldownSec: 10 },
        passive: null, ability: null, setId: null
    },
    hextech_gunblade: {
        name: 'Hextech Gunblade', emoji: '🪄🌈',
        components: ['large_rod', 'soul_prism'],
        stats: { attack: 20, manaPerHit: 5 },
        special: { type: 'onAbilityDmg', effect: 'abilityHeal', healPct: 0.25 },
        passive: null, ability: null, setId: null
    },
    aegis_plate: {
        name: 'Aegis Plate', emoji: '🪨🛡️',
        components: ['warding_stone', 'chain_vest'],
        stats: { startShield: 150, hp: 200 },
        special: { type: 'timedCheck', effect: 'shieldRefresh', checkTimeSec: 5 },
        passive: null, ability: null, setId: null
    }
};

// ---- Essence System ----

var ESSENCES = {
    fire:      { name: 'Fire Essence',      emoji: '🔥💎', color: '#ff4444' },
    water:     { name: 'Water Essence',     emoji: '💧💎', color: '#4488ff' },
    earth:     { name: 'Earth Essence',     emoji: '🌿💎', color: '#44aa44' },
    wind:      { name: 'Wind Essence',      emoji: '💨💎', color: '#aa44ff' },
    lightning: { name: 'Lightning Essence', emoji: '⚡💎', color: '#ffcc00' },
    force:     { name: 'Force Essence',     emoji: '💥💎', color: '#ff6644' },
    arcane:    { name: 'Arcane Essence',    emoji: '✨💎', color: '#dd88ff' }
};

// ---- Set Items ----

var ITEM_SETS = {
    inferno: {
        name: 'Inferno Set',
        emoji: '🔥',
        element: 'fire',
        thresholds: [2, 3],
        bonuses: [
            { desc: 'All fire allies: +20% attack', stat: 'elemAttackBoost', element: 'fire', value: 0.20 },
            { desc: 'All fire allies: +20% attack, enemies take 10 burn/s', stat: 'elemAttackBoost', element: 'fire', value: 0.20, burnDPS: 10 }
        ]
    },
    tidal: {
        name: 'Tidal Set',
        emoji: '💧',
        element: 'water',
        thresholds: [2, 3],
        bonuses: [
            { desc: 'All water allies: +15% max HP', stat: 'elemHPBoost', element: 'water', value: 0.15 },
            { desc: 'All water allies: +15% max HP, heal 1% HP/s', stat: 'elemHPBoost', element: 'water', value: 0.15, regenPct: 0.01 }
        ]
    },
    gaia: {
        name: 'Gaia Set',
        emoji: '🌿',
        element: 'earth',
        thresholds: [2, 3],
        bonuses: [
            { desc: 'All earth allies: +15% damage reduction', stat: 'elemDRBoost', element: 'earth', value: 0.15 },
            { desc: 'All earth allies: +15% DR, +150 shield at start', stat: 'elemDRBoost', element: 'earth', value: 0.15, shield: 150 }
        ]
    },
    tempest: {
        name: 'Tempest Set',
        emoji: '💨',
        element: 'wind',
        thresholds: [2, 3],
        bonuses: [
            { desc: 'All wind allies: +20% attack speed', stat: 'elemSpdBoost', element: 'wind', value: 0.20 },
            { desc: 'All wind allies: +20% AS, 10% dodge', stat: 'elemSpdBoost', element: 'wind', value: 0.20, dodge: 0.10 }
        ]
    },
    arcane: {
        name: 'Arcane Set',
        emoji: '✨',
        element: 'any',
        thresholds: [2, 3, 4],
        bonuses: [
            { desc: 'All allies: +8% ATK, +8% max HP', stat: 'arcaneTeamBuff', atkPct: 0.08, hpPct: 0.08 },
            { desc: 'All allies: +8% ATK, +8% HP, +10 start mana', stat: 'arcaneTeamBuff', atkPct: 0.08, hpPct: 0.08, startMana: 10 },
            { desc: 'All allies: +15% ATK, +15% HP, +20 start mana, 5% lifesteal', stat: 'arcaneTeamBuff', atkPct: 0.15, hpPct: 0.15, startMana: 20, lifesteal: 0.05 }
        ]
    }
};

var SET_ITEM_RECIPES = {
    // Fire Set — 3 items
    inferno_edge: {
        name: 'Inferno Edge', emoji: '⚔️🔥',
        baseCombined: 'infinity_edge',
        essenceElement: 'fire',
        setId: 'inferno',
        stats: { attack: 35, critChance: 0.25 },
        special: null
    },
    inferno_blade: {
        name: 'Inferno Blade', emoji: '🗡️🔥',
        baseCombined: 'blade_ruined_king',
        essenceElement: 'fire',
        setId: 'inferno',
        stats: { attack: 20 },
        special: { type: 'onHit', effect: 'bork', pctMaxHp: 0.03 }
    },
    inferno_cannon: {
        name: 'Inferno Cannon', emoji: '🏹🔥',
        baseCombined: 'rapid_firecannon',
        essenceElement: 'fire',
        setId: 'inferno',
        stats: { attackSpd: -0.2, range: 1 },
        special: null
    },
    // Water Set — 3 items
    tidal_armor: {
        name: 'Tidal Armor', emoji: '🛡️💧',
        baseCombined: 'titans_resolve',
        essenceElement: 'water',
        setId: 'tidal',
        stats: { hp: 250, damageReduction: 0.15 },
        special: null
    },
    tidal_warmog: {
        name: 'Tidal Warmog', emoji: '💪💧',
        baseCombined: 'warmogs_armor',
        essenceElement: 'water',
        setId: 'tidal',
        stats: { hp: 700 },
        special: { type: 'tick', effect: 'warmogRegen', regenPct: 0.025 }
    },
    tidal_staff: {
        name: 'Tidal Staff', emoji: '🪄💧',
        baseCombined: 'archangels_staff',
        essenceElement: 'water',
        setId: 'tidal',
        stats: { attack: 25, healPower: 0.35 },
        special: { type: 'onHeal', effect: 'archangelDmg', damagePct: 0.25 }
    },
    // Earth Set — 3 items
    gaia_claw: {
        name: 'Gaia Claw', emoji: '🧥🌿',
        baseCombined: 'dragons_claw',
        essenceElement: 'earth',
        setId: 'gaia',
        stats: { damageReduction: 0.30, elemResist: 0.25 },
        special: null
    },
    gaia_resolve: {
        name: 'Gaia Resolve', emoji: '🛡️🌿',
        baseCombined: 'titans_resolve',
        essenceElement: 'earth',
        setId: 'gaia',
        stats: { hp: 300, damageReduction: 0.18 },
        special: null
    },
    gaia_warmog: {
        name: 'Gaia Warmog', emoji: '💪🌿',
        baseCombined: 'warmogs_armor',
        essenceElement: 'earth',
        setId: 'gaia',
        stats: { hp: 750 },
        special: { type: 'tick', effect: 'warmogRegen', regenPct: 0.025 }
    },
    // Wind Set — 3 items
    tempest_edge: {
        name: 'Tempest Edge', emoji: '⚔️💨',
        baseCombined: 'hand_of_justice',
        essenceElement: 'wind',
        setId: 'tempest',
        stats: { attack: 20, critChance: 0.15 },
        special: { type: 'onKill', effect: 'hojHeal', healPct: 0.12 }
    },
    tempest_bow: {
        name: 'Tempest Bow', emoji: '🏹💨',
        baseCombined: 'rapid_firecannon',
        essenceElement: 'wind',
        setId: 'tempest',
        stats: { attackSpd: -0.25, range: 1 },
        special: null
    },
    tempest_cannon: {
        name: 'Tempest Cannon', emoji: '🏹⚡💨',
        baseCombined: 'blade_ruined_king',
        essenceElement: 'wind',
        setId: 'tempest',
        stats: { attack: 18 },
        special: { type: 'onHit', effect: 'bork', pctMaxHp: 0.04 }
    },
    // Arcane Set — 4 items (works with ANY element, requires Arcane Essence from bosses)
    arcane_edge: {
        name: 'Arcane Edge', emoji: '⚔️✨',
        baseCombined: 'infinity_edge',
        essenceElement: 'arcane',
        setId: 'arcane',
        stats: { attack: 35, critChance: 0.25 },
        special: null
    },
    arcane_bulwark: {
        name: 'Arcane Bulwark', emoji: '🛡️✨',
        baseCombined: 'titans_resolve',
        essenceElement: 'arcane',
        setId: 'arcane',
        stats: { hp: 250, damageReduction: 0.18 },
        special: null
    },
    arcane_catalyst: {
        name: 'Arcane Catalyst', emoji: '🪄✨',
        baseCombined: 'archangels_staff',
        essenceElement: 'arcane',
        setId: 'arcane',
        stats: { attack: 25, healPower: 0.35 },
        special: { type: 'onHeal', effect: 'archangelDmg', damagePct: 0.25 }
    },
    arcane_accelerator: {
        name: 'Arcane Accelerator', emoji: '🏹✨',
        baseCombined: 'rapid_firecannon',
        essenceElement: 'arcane',
        setId: 'arcane',
        stats: { attackSpd: -0.25, range: 1 },
        special: null
    }
};

// ---- Ability Items ----

var ABILITY_ITEMS = {
    zhonyas_hourglass: {
        name: "Zhonya's Hourglass", emoji: '⏳✨',
        craftFrom: ['titans_resolve', 'warmogs_armor'],
        missionReward: null,
        stats: { hp: 300, damageReduction: 0.10 },
        ability: { type: 'onLowHP', trigger: 0.25, effect: 'stasis', duration: 2.0, cooldown: 15.0,
                   desc: 'When HP drops below 25%: become invulnerable for 2s (once per fight)' },
        requiresEvolved: false
    },
    guardian_angel: {
        name: 'Guardian Angel', emoji: '👼✨',
        craftFrom: ['warmogs_armor', 'dragons_claw'],
        missionReward: null,
        stats: { hp: 400 },
        ability: { type: 'onDeath', effect: 'revive', revivePct: 0.30, cooldown: 999,
                   desc: 'On death: revive with 30% HP (once per combat)' },
        requiresEvolved: false
    },
    rabadons_deathcap: {
        name: "Rabadon's Deathcap", emoji: '🎩✨',
        craftFrom: ['archangels_staff', 'infinity_edge'],
        missionReward: null,
        stats: { attack: 40 },
        ability: { type: 'passive', effect: 'spellAmp', value: 0.35,
                   desc: '+35% total attack damage' },
        requiresEvolved: false
    },
    bloodthirster: {
        name: 'Bloodthirster', emoji: '🩸✨',
        craftFrom: ['blade_ruined_king', 'hand_of_justice'],
        missionReward: null,
        stats: { attack: 25 },
        ability: { type: 'onHit', effect: 'lifesteal', pct: 0.15,
                   desc: 'Heal for 15% of damage dealt' },
        requiresEvolved: false
    },
    // Evolution-gated items
    primal_fury: {
        name: 'Primal Fury', emoji: '🐾⚡',
        craftFrom: ['infinity_edge', 'rapid_firecannon'],
        missionReward: null,
        stats: { attack: 20, attackSpd: -0.15 },
        ability: { type: 'onKill', effect: 'frenzy', atkSpdBonus: -0.10, stackMax: 3,
                   desc: 'On kill: +10% attack speed, stacks 3 times' },
        requiresEvolved: true
    },
    elemental_core: {
        name: 'Elemental Core', emoji: '💠⚡',
        craftFrom: ['archangels_staff', 'dragons_claw'],
        missionReward: null,
        stats: { attack: 15, hp: 200, elemResist: 0.15 },
        ability: { type: 'passive', effect: 'elemMastery', elemDmgBoost: 0.25,
                   desc: '+25% element advantage damage (1.3x → 1.55x)' },
        requiresEvolved: true
    },
    titan_heart: {
        name: "Titan's Heart", emoji: '❤️‍🔥⚡',
        craftFrom: ['warmogs_armor', 'titans_resolve'],
        missionReward: null,
        stats: { hp: 600, damageReduction: 0.10 },
        ability: { type: 'passive', effect: 'titanResolve', hpThreshold: 0.5, bonusDR: 0.20,
                   desc: 'Below 50% HP: +20% damage reduction' },
        requiresEvolved: true
    },

    // ---- New Ability Items (Phase 3) ----

    // Standard (any unit)
    morellonomicon: {
        name: 'Morellonomicon', emoji: '📖🔥',
        craftFrom: ['sunfire_cape', 'archangels_staff'],
        missionReward: null,
        stats: { attack: 15, hp: 300 },
        ability: { type: 'onAbilityHit', effect: 'grievousWounds', healReduction: 0.40, duration: 5,
                   desc: 'Abilities apply Grievous Wounds (40% heal reduction) for 5s' },
        requiresEvolved: false
    },
    ionic_spark: {
        name: 'Ionic Spark', emoji: '⚡🔮',
        craftFrom: ['statikk_shiv', 'blue_buff'],
        missionReward: null,
        stats: { attackSpd: -0.15, startMana: 20 },
        ability: { type: 'aura', effect: 'ionicDisrupt', range: 2, damage: 100, manaBurn: 15,
                   desc: 'When nearby enemy casts: deal 100 dmg and burn 15 mana' },
        requiresEvolved: false
    },
    frozen_heart: {
        name: 'Frozen Heart', emoji: '❄️🛡️',
        craftFrom: ['bramble_vest', 'titans_resolve'],
        missionReward: null,
        stats: { hp: 500, damageReduction: 0.20 },
        ability: { type: 'aura', effect: 'frozenAura', range: 2, asSlow: 0.20,
                   desc: 'Enemies within 2 cells: -20% attack speed' },
        requiresEvolved: false
    },

    // Evolved-gated (evolved units only)
    void_staff: {
        name: 'Void Staff', emoji: '🌑⚡',
        craftFrom: ['deathblade', 'hextech_gunblade'],
        missionReward: null,
        stats: { attack: 40, manaPerHit: 5 },
        ability: { type: 'passive', effect: 'voidPenetration', drBypass: 0.40, abilityHeal: 0.15,
                   desc: 'Abilities ignore 40% DR. Ability damage heals 15%.' },
        requiresEvolved: true
    },
    transcendence: {
        name: 'Transcendence', emoji: '🌟⚡',
        craftFrom: ['blue_buff', 'spear_of_shojin'],
        missionReward: null,
        stats: { startMana: 30 },
        ability: { type: 'onCast', effect: 'manaCostReduction', reductionPct: 0.10, minPct: 0.50,
                   desc: 'Each ability cast reduces max mana by 10% (min 50% of base)' },
        requiresEvolved: true
    }
};

// ---- Mythic Items (Tier 4) ----

var MYTHIC_MATERIALS = {
    dragon_scale: { name: 'Dragon Scale', emoji: '🐉', desc: 'Drops from boss fights' },
    void_crystal:  { name: 'Void Crystal',  emoji: '🔮', desc: 'Drops from 3-starring mission 14 or endless mode' },
    world_shard:   { name: 'World Shard',   emoji: '🌍', desc: 'Obtained when a unit reaches Transcendent (Ascension T3)' }
};

var MYTHIC_ITEMS = {
    infinity_gauntlet: {
        name: 'Infinity Gauntlet', emoji: '🧤✨',
        craftFrom: 'rabadons_deathcap',
        material: 'dragon_scale',
        goldCost: 250,
        stats: { attack: 50 },
        mythicAbility: {
            effect: 'infinityNova',
            bonusAbilityDmg: 0.50,
            novaEveryN: 3,
            desc: 'Abilities deal 50% bonus damage. Every 3rd cast hits ALL enemies.'
        }
    },
    aegis_of_immortality: {
        name: 'Aegis of Immortality', emoji: '🛡️👼',
        craftFrom: 'guardian_angel',
        material: 'dragon_scale',
        goldCost: 250,
        stats: { hp: 600, damageReduction: 0.15 },
        mythicAbility: {
            effect: 'aegisRevive',
            revivePct: 0.60,
            invulnDuration: 3,
            taunt: true,
            desc: 'Revive at 60% HP, become invulnerable 3s and taunt all enemies. Once per combat.'
        }
    },
    eclipse: {
        name: 'Eclipse', emoji: '🌑✨',
        craftFrom: 'bloodthirster',
        material: 'void_crystal',
        goldCost: 250,
        stats: { attack: 35 },
        mythicAbility: {
            effect: 'eclipseLifesteal',
            lifesteal: 0.20,
            overhealShieldPct: 0.30,
            shieldBonusDmg: 0.15,
            desc: '20% lifesteal. Excess heals become shield (max 30% HP). While shielded, +15% dmg.'
        }
    },
    staff_of_ages: {
        name: 'Staff of Ages', emoji: '🪄🌟',
        craftFrom: 'void_staff',
        material: 'void_crystal',
        goldCost: 250,
        stats: { attack: 45, startMana: 20 },
        mythicAbility: {
            effect: 'infiniteScaling',
            dmgPerCast: 0.03,
            desc: 'Ability damage permanently increases by 3% each cast (no cap).'
        }
    },
    worldbreaker: {
        name: 'Worldbreaker', emoji: '⚔️🌍',
        craftFrom: 'primal_fury',
        material: 'world_shard',
        goldCost: 250,
        stats: { attack: 30, attackSpd: -0.15 },
        mythicAbility: {
            effect: 'worldbreakerRampage',
            atkBonus: 0.15,
            asBonus: 0.15,
            duration: 8,
            maxStacks: 5,
            splashAtMax: true,
            desc: 'On kill: +15% ATK and AS for 8s (5x max). At 5 stacks, attacks splash.'
        }
    },
    crown_of_ages: {
        name: 'Crown of Ages', emoji: '👑🌟',
        craftFrom: 'transcendence',
        material: 'world_shard',
        goldCost: 250,
        stats: { startMana: 40 },
        mythicAbility: {
            effect: 'crownFreeCast',
            cooldown: 12,
            drWhileOnCD: 0.15,
            desc: 'After casting, next ability costs 0 mana (12s CD). While on CD, +15% DR.'
        }
    }
};

// ---- Item Affinity System ----
// Affinities match items to unit types/archetypes/elements for bonus effects
// matchType: 'type', 'archetype', or 'element' — what to check on the unit
// matchValue: the value to match (e.g. 'assassin', 'guardian', 'earth')
// bonus: describes the mechanical bonus applied in combat
var ITEM_AFFINITIES = {
    // Combined items (from Section 9 + Extended Examples)
    infinity_edge:         { matchType: 'type',      matchValue: 'assassin',  bonus: { effect: 'bonusCritDamage', value: 0.15, desc: '+15% bonus crit damage' } },
    warmogs_armor:         { matchType: 'type',      matchValue: 'tank',      bonus: { effect: 'warmogRegenUp', value: 0.03, desc: 'Regen increased to 3% max HP/s' } },
    rapid_firecannon:      { matchType: 'type',      matchValue: 'archer',    bonus: { effect: 'bonusRange', value: 1, desc: '+1 additional range (total +2)' } },
    archangels_staff:      { matchType: 'type',      matchValue: 'healer',    bonus: { effect: 'archangelDmgUp', value: 0.35, desc: 'Heal-to-damage conversion increased to 35%' } },
    dragons_claw:          { matchType: 'archetype',  matchValue: 'guardian', bonus: { effect: 'bonusDR', value: 0.05, desc: '+5% additional damage reduction' } },
    bloodthirster:         { matchType: 'type',      matchValue: 'assassin',  bonus: { effect: 'lifestealUp', value: 0.22, desc: 'Lifesteal increased to 22%' } },
    deathblade:            { matchType: 'type',      matchValue: 'assassin',  bonus: { effect: 'deathbladeStackUp', value: 0.12, desc: 'Kill stack bonus increased to +12%' } },
    guinsoos_rageblade:    { matchType: 'type',      matchValue: 'archer',    bonus: { effect: 'rageStackUp', value: 0.05, desc: 'AS per-stack increased to +5%' } },
    statikk_shiv:          { matchType: 'type',      matchValue: 'mage',      bonus: { effect: 'chainLightningUp', value: 3, desc: 'Chain lightning hits 3 enemies instead of 2' } },
    last_whisper:          { matchType: 'archetype',  matchValue: 'predator', bonus: { effect: 'drShredDurUp', value: 5, desc: 'DR shred duration increased to 5s' } },
    sunfire_cape:          { matchType: 'type',      matchValue: 'tank',      bonus: { effect: 'sunfireDPSUp', value: 25, desc: 'AoE DPS increased to 25' } },
    bramble_vest:          { matchType: 'element',    matchValue: 'earth',    bonus: { effect: 'brambleRootUp', value: 120, desc: 'Reflect damage 120 + 0.5s Root' } },
    gargoyle_stoneplate:   { matchType: 'archetype',  matchValue: 'guardian', bonus: { effect: 'gargoyleDRUp', value: 0.07, desc: 'DR per attacker increased to +7%' } },
    redemption:            { matchType: 'type',      matchValue: 'healer',    bonus: { effect: 'redemptionRangeUp', value: 3, desc: 'AoE heal range increased to 3 cells' } },
    spear_of_shojin:       { matchType: 'type',      matchValue: 'warrior',   bonus: { effect: 'shojinManaUp', value: 8, desc: 'Bonus mana per hit increased to +8' } },
    blue_buff:             { matchType: 'type',      matchValue: 'mage',      bonus: { effect: 'blueManaUp', value: 35, desc: 'Post-cast mana refund increased to 35' } },
    quicksilver_sash:      { matchType: 'type',      matchValue: 'assassin',  bonus: { effect: 'qssCDDown', value: 7, desc: 'QSS cooldown reduced to 7s' } },
    aegis_plate:           { matchType: 'type',      matchValue: 'tank',      bonus: { effect: 'aegisShieldUp', value: 250, desc: 'Starting shield increased to 250' } },
    // Ability items
    frozen_heart:          { matchType: 'archetype',  matchValue: 'vanguard', bonus: { effect: 'frozenASRedUp', value: 0.30, desc: 'AS reduction aura increased to -30%' } },
    morellonomicon:        { matchType: 'archetype',  matchValue: 'mystic',   bonus: { effect: 'morelloDurUp', value: 7, desc: 'Grievous duration increased to 7s' } }
};

// Check if a unit matches an item's affinity
function checkItemAffinity(itemKey, unitKey) {
    var affinity = ITEM_AFFINITIES[itemKey];
    if (!affinity) return null;

    var template = typeof UNIT_TEMPLATES !== 'undefined' ? UNIT_TEMPLATES[unitKey] : null;
    if (!template) return null;

    var matched = false;
    if (affinity.matchType === 'type' && template.type === affinity.matchValue) matched = true;
    else if (affinity.matchType === 'archetype' && template.archetype === affinity.matchValue) matched = true;
    else if (affinity.matchType === 'element' && template.element === affinity.matchValue) matched = true;

    return matched ? affinity.bonus : null;
}

// Get affinity description for tooltip display
function getAffinityDescription(itemKey) {
    var affinity = ITEM_AFFINITIES[itemKey];
    if (!affinity) return null;
    var typeLabel = affinity.matchType === 'type' ? affinity.matchValue :
                    affinity.matchType === 'archetype' ? affinity.matchValue :
                    affinity.matchType === 'element' ? affinity.matchValue + ' element' :
                    affinity.matchValue;
    typeLabel = typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1);
    return 'Affinity: ' + typeLabel + ' — ' + affinity.bonus.desc;
}

// Forge operation: craft mythic item
function forgeCraftMythic(saveData, mythicKey) {
    var forgeLevel = getBuildingLevel(saveData, 'forge');
    if (forgeLevel < 5) return { success: false, reason: 'Forge level 5 required' };

    var mythicDef = MYTHIC_ITEMS[mythicKey];
    if (!mythicDef) return { success: false, reason: 'Unknown mythic item' };

    var cost = mythicDef.goldCost;
    if (saveData.player.gold < cost) return { success: false, reason: 'Not enough gold (' + cost + 'g)' };

    // Find the source ability item on bench
    var sourceItem = null;
    for (var i = 0; i < saveData.items.bench.length; i++) {
        var bi = saveData.items.bench[i];
        if (bi.type === 'ability' && bi.key === mythicDef.craftFrom && !bi.equipped) {
            sourceItem = bi;
            break;
        }
    }
    if (!sourceItem) return { success: false, reason: 'Need unequipped ' + (ABILITY_ITEMS[mythicDef.craftFrom] ? ABILITY_ITEMS[mythicDef.craftFrom].name : mythicDef.craftFrom) };

    // Check mythic material
    if (!saveData.items.mythicMaterials) saveData.items.mythicMaterials = {};
    var matCount = saveData.items.mythicMaterials[mythicDef.material] || 0;
    if (matCount < 1) return { success: false, reason: 'Need 1 ' + (MYTHIC_MATERIALS[mythicDef.material] ? MYTHIC_MATERIALS[mythicDef.material].name : mythicDef.material) };

    // Consume resources
    spendGold(saveData, cost);
    saveData.items.mythicMaterials[mythicDef.material]--;
    removeItemFromBench(saveData, sourceItem.id);

    // Create mythic item
    var mythicItem = {
        id: generateItemId(),
        type: 'mythic',
        key: mythicKey,
        name: mythicDef.name,
        rarity: sourceItem.rarity || 'epic',
        enhanceLevel: 0,
        gems: [],
        equipped: null
    };
    saveData.items.bench.push(mythicItem);
    autoSave(saveData);
    return { success: true, item: mythicItem };
}

// ---- Item Instance Factory ----

function generateItemId() {
    return Math.random().toString(36).substr(2, 9);
}

function createItemInstance(type, key, rarity, comp1Rarity, comp2Rarity) {
    if (type === 'component') {
        return {
            id: generateItemId(),
            type: 'component',
            key: key,
            rarity: rarity || 'standard',
            equipped: null
        };
    } else if (type === 'combined') {
        return {
            id: generateItemId(),
            type: 'combined',
            key: key,
            comp1Rarity: comp1Rarity || 'standard',
            comp2Rarity: comp2Rarity || 'standard',
            equipped: null
        };
    }
    return null;
}

// ---- Rarity Scaling ----

function getCombinedItemStatMultiplier(comp1Rarity, comp2Rarity) {
    var b1 = ITEM_RARITIES[comp1Rarity] ? ITEM_RARITIES[comp1Rarity].bonus : 0;
    var b2 = ITEM_RARITIES[comp2Rarity] ? ITEM_RARITIES[comp2Rarity].bonus : 0;
    return 1 + b1 + b2;
}

// ---- Bench Helpers ----

function addItemToBench(saveData, item) {
    if (!saveData.items) return false;
    if (saveData.items.bench.length >= getItemBenchSize(saveData)) return false;
    saveData.items.bench.push(item);
    return true;
}

function removeItemFromBench(saveData, itemId) {
    if (!saveData.items) return null;
    for (var i = 0; i < saveData.items.bench.length; i++) {
        if (saveData.items.bench[i].id === itemId) {
            return saveData.items.bench.splice(i, 1)[0];
        }
    }
    return null;
}

function getBenchItems(saveData) {
    if (!saveData.items) return [];
    return saveData.items.bench;
}

function isBenchFull(saveData) {
    if (!saveData.items) return true;
    return saveData.items.bench.length >= getItemBenchSize(saveData);
}

// ---- Equip / Unequip ----

function getEquippedItems(saveData, unitKey) {
    if (!saveData.items) return [];
    var equipped = [];
    for (var i = 0; i < saveData.items.bench.length; i++) {
        var item = saveData.items.bench[i];
        if (item.equipped && item.equipped.unitKey === unitKey) {
            equipped.push(item);
        }
    }
    return equipped;
}

function getEquippedItemCount(saveData, unitKey) {
    return getEquippedItems(saveData, unitKey).length;
}

var MAX_ITEM_SLOTS = 3;

function equipItem(saveData, itemId, unitKey) {
    if (!saveData.items) return false;
    var currentCount = getEquippedItemCount(saveData, unitKey);
    if (currentCount >= MAX_ITEM_SLOTS) return false;

    var item = null;
    for (var i = 0; i < saveData.items.bench.length; i++) {
        if (saveData.items.bench[i].id === itemId) {
            item = saveData.items.bench[i];
            break;
        }
    }
    if (!item || item.equipped) return false;

    // Check evolution-gated ability items
    if (item.type === 'ability') {
        var abilityData = ABILITY_ITEMS[item.key];
        if (abilityData && abilityData.requiresEvolved) {
            if (!EVOLVED_TEMPLATES[unitKey]) {
                return 'evolved_only';
            }
        }
    }

    // Check for auto-combine: if this is a component and the unit has a matching component
    if (item.type === 'component') {
        var unitItems = getEquippedItems(saveData, unitKey);
        for (var j = 0; j < unitItems.length; j++) {
            var other = unitItems[j];
            if (other.type !== 'component') continue;

            // Check if these two components form a recipe
            var recipeKey = findRecipe(item.key, other.key);
            if (recipeKey) {
                // Auto-combine: create combined item, remove both components
                var combined = createItemInstance('combined', recipeKey, null, other.rarity, item.rarity);
                combined.equipped = { unitKey: unitKey, slot: other.equipped.slot };

                // Remove the old component from bench
                removeItemFromBench(saveData, other.id);
                // Remove the new component from bench
                removeItemFromBench(saveData, item.id);
                // Add combined item to bench (equipped)
                saveData.items.bench.push(combined);

                autoSave(saveData);
                return 'combined';
            }
        }
    }

    // Normal equip
    item.equipped = { unitKey: unitKey, slot: currentCount };
    autoSave(saveData);
    return true;
}

function unequipItem(saveData, itemId) {
    if (!saveData.items) return false;
    for (var i = 0; i < saveData.items.bench.length; i++) {
        var item = saveData.items.bench[i];
        if (item.id === itemId) {
            item.equipped = null;
            autoSave(saveData);
            return true;
        }
    }
    return false;
}

// Unequip all items from a specific unit, returning them to the bench
function unequipAllItemsFromUnit(saveData, unitKey) {
    if (!saveData.items) return;
    for (var i = 0; i < saveData.items.bench.length; i++) {
        var item = saveData.items.bench[i];
        if (item.equipped && item.equipped.unitKey === unitKey) {
            item.equipped = null;
        }
    }
}

// ---- Recipe Lookup ----

function findRecipe(comp1Key, comp2Key) {
    var recipeKeys = Object.keys(ITEM_RECIPES);
    for (var i = 0; i < recipeKeys.length; i++) {
        var recipe = ITEM_RECIPES[recipeKeys[i]];
        var c = recipe.components;
        if ((c[0] === comp1Key && c[1] === comp2Key) ||
            (c[0] === comp2Key && c[1] === comp1Key)) {
            return recipeKeys[i];
        }
    }
    return null;
}

function getRecipesForComponent(compKey) {
    var recipes = [];
    var recipeKeys = Object.keys(ITEM_RECIPES);
    for (var i = 0; i < recipeKeys.length; i++) {
        var recipe = ITEM_RECIPES[recipeKeys[i]];
        if (recipe.components[0] === compKey || recipe.components[1] === compKey) {
            recipes.push({ key: recipeKeys[i], recipe: recipe });
        }
    }
    return recipes;
}

// ---- Forge Helper ----

function findBenchItem(saveData, itemId) {
    if (!saveData.items) return null;
    for (var i = 0; i < saveData.items.bench.length; i++) {
        if (saveData.items.bench[i].id === itemId) {
            return saveData.items.bench[i];
        }
    }
    return null;
}

// ---- Forge Operations ----

var REROLL_COSTS = { standard: 10, uncommon: 20, rare: 40, epic: 80 };

function forgeRerollRarity(saveData, itemId) {
    if (getBuildingLevel(saveData, 'forge') < 1) return { success: false, reason: 'Forge not built' };

    var item = findBenchItem(saveData, itemId);
    if (!item) return { success: false, reason: 'Item not found' };
    if (item.type !== 'component') return { success: false, reason: 'Can only reroll components' };
    if (item.equipped) return { success: false, reason: 'Unequip first' };

    var cost = REROLL_COSTS[item.rarity] || 10;
    if (saveData.player.gold < cost) return { success: false, reason: 'Not enough gold (' + cost + 'g)' };

    spendGold(saveData, cost);

    // Roll new rarity (weighted, can be same or different)
    var newRarity = rollItemRarity(10, 2); // Use moderate weights
    var oldRarity = item.rarity;
    item.rarity = newRarity;

    autoSave(saveData);
    return { success: true, oldRarity: oldRarity, newRarity: newRarity, cost: cost };
}

function forgeDisassemble(saveData, itemId) {
    if (getBuildingLevel(saveData, 'forge') < 2) return { success: false, reason: 'Forge level 2 required' };

    var item = findBenchItem(saveData, itemId);
    if (!item) return { success: false, reason: 'Item not found' };
    if (item.type !== 'combined') return { success: false, reason: 'Can only disassemble combined items' };
    if (item.equipped) return { success: false, reason: 'Unequip first' };

    var recipe = ITEM_RECIPES[item.key];
    if (!recipe) return { success: false, reason: 'Unknown recipe' };

    // Check bench space: removing 1 combined, adding 2 components = net +1
    if (saveData.items.bench.length >= getItemBenchSize(saveData)) {
        return { success: false, reason: 'Need 1 free bench slot' };
    }

    var cost = 15;
    if (saveData.player.gold < cost) return { success: false, reason: 'Not enough gold (15g)' };

    spendGold(saveData, cost);

    // Remove combined item
    removeItemFromBench(saveData, itemId);

    // Create two components with original rarities
    var comp1 = createItemInstance('component', recipe.components[0], item.comp1Rarity);
    var comp2 = createItemInstance('component', recipe.components[1], item.comp2Rarity);

    saveData.items.bench.push(comp1);
    saveData.items.bench.push(comp2);

    autoSave(saveData);
    return { success: true, comp1: comp1, comp2: comp2 };
}

function forgeTransmute(saveData, itemId, targetComponentKey) {
    if (getBuildingLevel(saveData, 'forge') < 3) return { success: false, reason: 'Forge level 3 required' };

    var item = findBenchItem(saveData, itemId);
    if (!item) return { success: false, reason: 'Item not found' };
    if (item.type !== 'component') return { success: false, reason: 'Can only transmute components' };
    if (item.equipped) return { success: false, reason: 'Unequip first' };
    if (!ITEM_COMPONENTS[targetComponentKey]) return { success: false, reason: 'Invalid target component' };
    if (item.key === targetComponentKey) return { success: false, reason: 'Already this type' };

    var cost = 25;
    if (saveData.player.gold < cost) return { success: false, reason: 'Not enough gold (25g)' };

    spendGold(saveData, cost);

    var oldKey = item.key;
    item.key = targetComponentKey;

    autoSave(saveData);
    return { success: true, oldKey: oldKey, newKey: targetComponentKey };
}

function forgeCraftSetItem(saveData, setRecipeKey) {
    if (getBuildingLevel(saveData, 'forge') < 4) return { success: false, reason: 'Forge level 4 required' };

    var recipe = SET_ITEM_RECIPES[setRecipeKey];
    if (!recipe) return { success: false, reason: 'Unknown set recipe' };

    // Find an unequipped combined item of the right type on bench
    var sourceItem = null;
    for (var i = 0; i < saveData.items.bench.length; i++) {
        var bi = saveData.items.bench[i];
        if (bi.type === 'combined' && bi.key === recipe.baseCombined && !bi.equipped) {
            sourceItem = bi;
            break;
        }
    }
    if (!sourceItem) return { success: false, reason: 'Need unequipped ' + ITEM_RECIPES[recipe.baseCombined].name };

    // Check essence
    var essElem = recipe.essenceElement;
    if (!saveData.items.essences || (saveData.items.essences[essElem] || 0) < 1) {
        return { success: false, reason: 'Need 1 ' + ESSENCES[essElem].name };
    }

    // Gold cost: 50g
    var cost = 50;
    if (saveData.player.gold < cost) return { success: false, reason: 'Not enough gold (50g)' };

    // Execute crafting
    spendGold(saveData, cost);
    saveData.items.essences[essElem]--;

    // Replace the combined item with the set item
    var setItem = {
        id: generateItemId(),
        type: 'set',
        key: setRecipeKey,
        setId: recipe.setId,
        comp1Rarity: sourceItem.comp1Rarity,
        comp2Rarity: sourceItem.comp2Rarity,
        equipped: null
    };

    removeItemFromBench(saveData, sourceItem.id);
    saveData.items.bench.push(setItem);

    autoSave(saveData);
    return { success: true, item: setItem };
}

function forgeCraftAbilityItem(saveData, abilityItemKey) {
    if (getBuildingLevel(saveData, 'forge') < 5) return { success: false, reason: 'Forge level 5 required' };

    var recipe = ABILITY_ITEMS[abilityItemKey];
    if (!recipe) return { success: false, reason: 'Unknown ability item' };
    if (!recipe.craftFrom) return { success: false, reason: 'This item cannot be crafted' };

    // Find two unequipped combined items matching craftFrom
    var found = [];
    var usedIds = {};
    for (var c = 0; c < recipe.craftFrom.length; c++) {
        var needed = recipe.craftFrom[c];
        var foundItem = null;
        for (var i = 0; i < saveData.items.bench.length; i++) {
            var bi = saveData.items.bench[i];
            if (bi.type === 'combined' && bi.key === needed && !bi.equipped && !usedIds[bi.id]) {
                foundItem = bi;
                break;
            }
        }
        if (!foundItem) {
            return { success: false, reason: 'Need unequipped ' + ITEM_RECIPES[needed].name };
        }
        found.push(foundItem);
        usedIds[foundItem.id] = true;
    }

    // Gold cost: 100g
    var cost = 100;
    if (saveData.player.gold < cost) return { success: false, reason: 'Not enough gold (100g)' };

    // Execute
    spendGold(saveData, cost);

    // Average the component rarities from both source items
    var rarityOrder = ['standard', 'uncommon', 'rare', 'epic'];
    var allRarities = [];
    for (var f = 0; f < found.length; f++) {
        allRarities.push(rarityOrder.indexOf(found[f].comp1Rarity));
        allRarities.push(rarityOrder.indexOf(found[f].comp2Rarity));
    }
    var avgRarity = Math.round(allRarities.reduce(function(a, b) { return a + b; }, 0) / allRarities.length);
    var bestRarity = rarityOrder[Math.min(avgRarity + 1, 3)]; // Bump up 1 tier from average

    // Remove source items
    for (var r = 0; r < found.length; r++) {
        removeItemFromBench(saveData, found[r].id);
    }

    // Create ability item
    var abilityItem = {
        id: generateItemId(),
        type: 'ability',
        key: abilityItemKey,
        rarity: bestRarity,
        equipped: null
    };

    saveData.items.bench.push(abilityItem);
    autoSave(saveData);
    return { success: true, item: abilityItem };
}

// ---- Enhancement System ----

var ENHANCEMENT_TABLE = [
    // { level, statBonus, goldCost, successRate, onFailDrop }
    { level: 1,  statBonus: 0.05, goldCost: 20,   successRate: 1.00, onFailDrop: 0 },
    { level: 2,  statBonus: 0.10, goldCost: 30,   successRate: 1.00, onFailDrop: 0 },
    { level: 3,  statBonus: 0.15, goldCost: 50,   successRate: 1.00, onFailDrop: 0 },
    { level: 4,  statBonus: 0.22, goldCost: 80,   successRate: 0.90, onFailDrop: 4 },  // stay
    { level: 5,  statBonus: 0.30, goldCost: 120,  successRate: 0.80, onFailDrop: 5 },  // stay
    { level: 6,  statBonus: 0.40, goldCost: 180,  successRate: 0.70, onFailDrop: 5 },
    { level: 7,  statBonus: 0.52, goldCost: 250,  successRate: 0.55, onFailDrop: 5 },
    { level: 8,  statBonus: 0.66, goldCost: 350,  successRate: 0.40, onFailDrop: 6 },
    { level: 9,  statBonus: 0.82, goldCost: 500,  successRate: 0.25, onFailDrop: 7 },
    { level: 10, statBonus: 1.00, goldCost: 750,  successRate: 0.15, onFailDrop: 8 }
];

// Forge level required per enhancement tier
var ENHANCEMENT_FORGE_REQS = {
    1: 1, 2: 1, 3: 1,     // Forge 1+
    4: 2, 5: 2, 6: 2,     // Forge 2+
    7: 4, 8: 4,            // Forge 4+
    9: 5, 10: 5            // Forge 5+
};

// Pity: after N consecutive failures at the same target level, next is guaranteed
var ENHANCEMENT_PITY_THRESHOLD = 3;

function getEnhancementLevel(item) {
    return item.enhanceLevel || 0;
}

function getEnhancementBonus(item) {
    var level = getEnhancementLevel(item);
    if (level <= 0 || level > ENHANCEMENT_TABLE.length) return 0;
    return ENHANCEMENT_TABLE[level - 1].statBonus;
}

function getEnhancementCost(item) {
    var targetLevel = getEnhancementLevel(item) + 1;
    if (targetLevel > 10) return null;
    var entry = ENHANCEMENT_TABLE[targetLevel - 1];
    var cost = entry.goldCost;
    // Mythic items cost 1.5x
    if (item.type === 'mythic') cost = Math.floor(cost * 1.5);
    return cost;
}

function forgeEnhance(saveData, itemId) {
    var item = findBenchItem(saveData, itemId);
    if (!item) return { success: false, reason: 'Item not found' };

    // Can enhance combined, set, ability, mythic — not components
    if (item.type === 'component') return { success: false, reason: 'Cannot enhance components' };

    var currentLevel = getEnhancementLevel(item);
    var targetLevel = currentLevel + 1;
    if (targetLevel > 10) return { success: false, reason: 'Already at max enhancement (+10)' };

    // Check forge level requirement
    var forgeLevel = getBuildingLevel(saveData, 'forge');
    var reqForge = ENHANCEMENT_FORGE_REQS[targetLevel] || 1;
    if (forgeLevel < reqForge) return { success: false, reason: 'Forge level ' + reqForge + ' required for +' + targetLevel };

    var entry = ENHANCEMENT_TABLE[targetLevel - 1];
    var cost = entry.goldCost;
    if (item.type === 'mythic') cost = Math.floor(cost * 1.5);
    if (saveData.player.gold < cost) return { success: false, reason: 'Not enough gold (' + cost + 'g)' };

    spendGold(saveData, cost);

    // Initialize pity tracking
    if (!item.enhancePity) item.enhancePity = { targetLevel: targetLevel, failures: 0 };
    if (item.enhancePity.targetLevel !== targetLevel) {
        item.enhancePity = { targetLevel: targetLevel, failures: 0 };
    }

    // Check collection bonus: Grand Artificer reduces pity threshold
    var pityThreshold = ENHANCEMENT_PITY_THRESHOLD;
    if (saveData.items && saveData.items.collectionBonuses && saveData.items.collectionBonuses.grandArtificer) {
        pityThreshold = 2;
    }

    // Roll for success
    var isPityGuaranteed = item.enhancePity.failures >= pityThreshold;
    var roll = Math.random();
    var succeeded = isPityGuaranteed || roll < entry.successRate;

    if (succeeded) {
        item.enhanceLevel = targetLevel;
        item.enhancePity = { targetLevel: targetLevel + 1, failures: 0 };
        autoSave(saveData);
        return { success: true, enhanced: true, newLevel: targetLevel, cost: cost, pityUsed: isPityGuaranteed };
    } else {
        // Failure
        item.enhancePity.failures++;
        var dropTo = entry.onFailDrop;
        var droppedFrom = currentLevel;
        // onFailDrop equal to targetLevel means "stay at current level"
        if (dropTo >= currentLevel) {
            // Stay at current level — no drop
            autoSave(saveData);
            return { success: true, enhanced: false, stayed: true, level: currentLevel, cost: cost,
                     pityCount: item.enhancePity.failures, pityThreshold: pityThreshold };
        } else {
            // Drop to lower level
            item.enhanceLevel = dropTo;
            // Reset pity for the failed level since we dropped
            item.enhancePity = { targetLevel: dropTo + 1, failures: 0 };
            autoSave(saveData);
            return { success: true, enhanced: false, dropped: true, from: droppedFrom, to: dropTo, cost: cost };
        }
    }
}

// Get enhanced stat multiplier: base × (1 + rarityBonus) × (1 + enhancementBonus)
function getEnhancedStatMultiplier(item) {
    var enhanceBonus = getEnhancementBonus(item);
    return 1 + enhanceBonus;
}

// ---- Gem Socket System ----

var GEM_TYPES = {
    ruby:      { name: 'Ruby',      emoji: '❤️',  stat: 'hp',              value: 100, minMissionLevel: 5 },
    sapphire:  { name: 'Sapphire',  emoji: '💙', stat: 'attack',          value: 8,   minMissionLevel: 5 },
    emerald:   { name: 'Emerald',   emoji: '💚', stat: 'damageReduction', value: 0.05, minMissionLevel: 8 },
    topaz:     { name: 'Topaz',     emoji: '💛', stat: 'attackSpd',       value: -0.05, minMissionLevel: 8 },
    diamond:   { name: 'Diamond',   emoji: '💎', stat: 'critChance',      value: 0.08, minMissionLevel: 10 },
    amethyst:  { name: 'Amethyst',  emoji: '💜', stat: 'startMana',       value: 10,  minMissionLevel: 10 },
    opal:      { name: 'Opal',      emoji: '🤍', stat: 'healPower',       value: 0.10, minMissionLevel: 12 },
    onyx:      { name: 'Onyx',      emoji: '🖤', stat: 'tenacity',        value: 0.10, minMissionLevel: 12 },
    prismatic: { name: 'Prismatic', emoji: '🌈', stat: 'multi',           value: null, minMissionLevel: 99, bossOnly: true,
                 multiStats: { hp: 50, attack: 5, critChance: 0.03 } }
};

// Socket count by item type
var SOCKET_COUNTS = {
    component: 0,
    combined: 1,
    set: 1,
    ability: 2,
    mythic: 2
};

// Gem rarity multipliers (same tiers as items)
var GEM_RARITY_MULTIPLIERS = { standard: 1, uncommon: 1.25, rare: 1.50, epic: 2.00 };

function getGemSocketCount(item) {
    return SOCKET_COUNTS[item.type] || 0;
}

function getGemSockets(item) {
    if (!item.gems) item.gems = [];
    return item.gems;
}

function socketGem(saveData, itemId, gemId) {
    var item = findBenchItem(saveData, itemId);
    if (!item) return { success: false, reason: 'Item not found' };

    var maxSockets = getGemSocketCount(item);
    if (maxSockets === 0) return { success: false, reason: 'Item has no sockets' };

    if (!item.gems) item.gems = [];
    if (item.gems.length >= maxSockets) return { success: false, reason: 'All sockets full' };

    // Find and remove gem from gem inventory
    if (!saveData.items.gemInventory) return { success: false, reason: 'No gems available' };
    var gemIdx = -1;
    for (var i = 0; i < saveData.items.gemInventory.length; i++) {
        if (saveData.items.gemInventory[i].id === gemId) { gemIdx = i; break; }
    }
    if (gemIdx < 0) return { success: false, reason: 'Gem not found in inventory' };

    var gem = saveData.items.gemInventory.splice(gemIdx, 1)[0];
    item.gems.push(gem);
    autoSave(saveData);
    return { success: true, gem: gem };
}

function unsocketGem(saveData, itemId, socketIndex) {
    var item = findBenchItem(saveData, itemId);
    if (!item) return { success: false, reason: 'Item not found' };
    if (!item.gems || socketIndex >= item.gems.length) return { success: false, reason: 'No gem in that socket' };

    var cost = 10;
    if (saveData.player.gold < cost) return { success: false, reason: 'Not enough gold (10g)' };
    spendGold(saveData, cost);

    var gem = item.gems.splice(socketIndex, 1)[0];
    if (!saveData.items.gemInventory) saveData.items.gemInventory = [];
    saveData.items.gemInventory.push(gem);
    autoSave(saveData);
    return { success: true, gem: gem, cost: cost };
}

// Combine 3 gems of same type and rarity → 1 gem of next rarity
function forgeGemCombine(saveData, gemType, gemRarity) {
    var forgeLevel = getBuildingLevel(saveData, 'forge');
    if (forgeLevel < 3) return { success: false, reason: 'Forge level 3 required' };

    if (gemRarity === 'epic') return { success: false, reason: 'Max rarity reached' };

    var cost = 15;
    if (saveData.player.gold < cost) return { success: false, reason: 'Not enough gold (15g)' };

    if (!saveData.items.gemInventory) return { success: false, reason: 'No gems' };

    // Find 3 matching gems
    var matches = [];
    for (var i = 0; i < saveData.items.gemInventory.length; i++) {
        var g = saveData.items.gemInventory[i];
        if (g.gemType === gemType && g.rarity === gemRarity) {
            matches.push(i);
        }
        if (matches.length >= 3) break;
    }
    if (matches.length < 3) return { success: false, reason: 'Need 3 ' + gemRarity + ' ' + gemType + ' gems' };

    spendGold(saveData, cost);

    // Remove 3 gems (remove from end to avoid index shifting)
    matches.sort(function(a, b) { return b - a; });
    for (var r = 0; r < matches.length; r++) {
        saveData.items.gemInventory.splice(matches[r], 1);
    }

    // Create upgraded gem
    var rarityOrder = ['standard', 'uncommon', 'rare', 'epic'];
    var nextRarity = rarityOrder[rarityOrder.indexOf(gemRarity) + 1];
    var newGem = createGemInstance(gemType, nextRarity);
    saveData.items.gemInventory.push(newGem);

    autoSave(saveData);
    return { success: true, gem: newGem, cost: cost };
}

function createGemInstance(gemType, rarity) {
    return {
        id: 'gem_' + generateItemId(),
        gemType: gemType,
        rarity: rarity || 'standard'
    };
}

function getGemStatValue(gem) {
    var gemDef = GEM_TYPES[gem.gemType];
    if (!gemDef) return {};
    var rarityMult = GEM_RARITY_MULTIPLIERS[gem.rarity] || 1;

    if (gemDef.stat === 'multi') {
        // Prismatic: multiple stats
        var result = {};
        var mKeys = Object.keys(gemDef.multiStats);
        for (var i = 0; i < mKeys.length; i++) {
            result[mKeys[i]] = gemDef.multiStats[mKeys[i]] * rarityMult;
        }
        return result;
    }
    var r = {};
    r[gemDef.stat] = gemDef.value * rarityMult;
    return r;
}

function rollGemDrop(missionLevel, starRating) {
    // Determine eligible gem types by mission level
    var eligible = [];
    var gemKeys = Object.keys(GEM_TYPES);
    for (var i = 0; i < gemKeys.length; i++) {
        var gDef = GEM_TYPES[gemKeys[i]];
        if (gDef.bossOnly) continue; // Prismatic only from bosses
        if (missionLevel >= gDef.minMissionLevel) {
            eligible.push(gemKeys[i]);
        }
    }
    if (eligible.length === 0) return null;

    var gemType = eligible[Math.floor(Math.random() * eligible.length)];
    var rarity = rollItemRarity(missionLevel, starRating);
    return createGemInstance(gemType, rarity);
}

function rollBossGemDrop() {
    // 5% chance for Prismatic, otherwise random standard gem at rare+ rarity
    if (Math.random() < 0.05) {
        var rarity = Math.random() < 0.5 ? 'rare' : 'epic';
        return createGemInstance('prismatic', rarity);
    }
    // Normal gem at higher quality
    var gemKeys = Object.keys(GEM_TYPES);
    var nonBoss = [];
    for (var i = 0; i < gemKeys.length; i++) {
        if (!GEM_TYPES[gemKeys[i]].bossOnly) nonBoss.push(gemKeys[i]);
    }
    var type = nonBoss[Math.floor(Math.random() * nonBoss.length)];
    var rarityRoll = Math.random();
    var rarity2 = rarityRoll < 0.3 ? 'epic' : (rarityRoll < 0.65 ? 'rare' : 'uncommon');
    return createGemInstance(type, rarity2);
}

// Apply gem stats to unit during combat
function applyGemStatsToUnit(unit, item) {
    var gems = getGemSockets(item);
    for (var g = 0; g < gems.length; g++) {
        var stats = getGemStatValue(gems[g]);
        var sKeys = Object.keys(stats);
        for (var s = 0; s < sKeys.length; s++) {
            applyStatToUnit(unit, sKeys[s], stats[sKeys[s]]);
        }
    }
}

// ---- Set Bonus Calculation ----

function calculateActiveSetBonuses(playerUnits, saveData) {
    var setCounts = {};

    for (var u = 0; u < playerUnits.length; u++) {
        var unit = playerUnits[u];
        var equipped = getEquippedItems(saveData, unit.key);
        for (var i = 0; i < equipped.length; i++) {
            var item = equipped[i];
            if (item.type === 'set' && item.setId) {
                setCounts[item.setId] = (setCounts[item.setId] || 0) + 1;
            }
        }
    }

    return setCounts;
}

function applySetBonuses(playerUnits, setCounts) {
    var setKeys = Object.keys(setCounts);
    for (var s = 0; s < setKeys.length; s++) {
        var setId = setKeys[s];
        var setData = ITEM_SETS[setId];
        if (!setData) continue;

        var count = setCounts[setId];
        var activeTier = -1;
        for (var t = 0; t < setData.thresholds.length; t++) {
            if (count >= setData.thresholds[t]) activeTier = t;
        }
        if (activeTier < 0) continue;

        var bonus = setData.bonuses[activeTier];

        // Apply bonus to matching element units
        for (var u = 0; u < playerUnits.length; u++) {
            var unit = playerUnits[u];
            if (unit.element !== bonus.element) continue;

            if (bonus.stat === 'elemAttackBoost') {
                unit.attack = Math.floor(unit.attack * (1 + bonus.value));
            } else if (bonus.stat === 'elemHPBoost') {
                var hpAdd = Math.floor(unit.maxHp * bonus.value);
                unit.hp += hpAdd;
                unit.maxHp += hpAdd;
            } else if (bonus.stat === 'elemDRBoost') {
                unit.damageReduction = (unit.damageReduction || 0) + bonus.value;
            } else if (bonus.stat === 'elemSpdBoost') {
                unit.attackSpd = Math.max(0.2, unit.attackSpd * (1 - bonus.value));
            }

            // Tier 2 extras
            if (bonus.shield) unit.shield = (unit.shield || 0) + bonus.shield;
            if (bonus.regenPct) {
                if (!unit.itemSpecials) unit.itemSpecials = [];
                unit.itemSpecials.push({ type: 'tick', effect: 'setRegen', regenPct: bonus.regenPct });
            }
            if (bonus.dodge) unit.dodgeChance = (unit.dodgeChance || 0) + bonus.dodge;
            if (bonus.burnDPS) {
                if (!unit.itemSpecials) unit.itemSpecials = [];
                unit.itemSpecials.push({ type: 'tick', effect: 'setBurn', burnDPS: bonus.burnDPS });
            }
        }
    }
}

// ---- Item Drop Rolling ----

function rollItemRarity(missionLevel, starRating) {
    var weights = {
        standard: BASE_RARITY_WEIGHTS.standard,
        uncommon: BASE_RARITY_WEIGHTS.uncommon,
        rare: BASE_RARITY_WEIGHTS.rare,
        epic: BASE_RARITY_WEIGHTS.epic
    };

    // Mission difficulty bonus: per 2 levels, shift weights
    var diffBonus = Math.floor(missionLevel / 2);
    weights.standard = Math.max(10, weights.standard - diffBonus * 5);
    weights.uncommon += diffBonus * 3;
    weights.rare += diffBonus * 1.5;
    weights.epic += diffBonus * 0.5;

    // Star rating bonus
    if (starRating >= 3) {
        weights.standard = Math.max(5, weights.standard - 15);
        weights.uncommon += 5;
        weights.rare += 7;
        weights.epic += 3;
    } else if (starRating >= 2) {
        weights.standard = Math.max(10, weights.standard - 8);
        weights.uncommon += 4;
        weights.rare += 3;
        weights.epic += 1;
    }

    // Weighted random selection
    var total = weights.standard + weights.uncommon + weights.rare + weights.epic;
    var roll = Math.random() * total;

    if (roll < weights.standard) return 'standard';
    roll -= weights.standard;
    if (roll < weights.uncommon) return 'uncommon';
    roll -= weights.uncommon;
    if (roll < weights.rare) return 'rare';
    return 'epic';
}

function rollItemDrop(missionLevel, starRating) {
    var rarity = rollItemRarity(missionLevel, starRating);
    // Use expanded pool for missions 10+, base pool otherwise
    var compKeys = missionLevel >= 10 ? ALL_COMPONENT_KEYS : BASE_COMPONENT_KEYS;
    var key = compKeys[Math.floor(Math.random() * compKeys.length)];
    return createItemInstance('component', key, rarity);
}

// ---- Item Display Helpers ----

function getItemName(item) {
    var name = 'Unknown';
    if (item.type === 'component') {
        var comp = ITEM_COMPONENTS[item.key];
        name = comp ? comp.name : item.key;
    } else if (item.type === 'combined') {
        var recipe = ITEM_RECIPES[item.key];
        name = recipe ? recipe.name : item.key;
    } else if (item.type === 'set') {
        var setRecipe = SET_ITEM_RECIPES[item.key];
        name = setRecipe ? setRecipe.name : item.key;
    } else if (item.type === 'ability') {
        var abilityDef = ABILITY_ITEMS[item.key];
        name = abilityDef ? abilityDef.name : item.key;
    } else if (item.type === 'mythic') {
        name = item.name || item.key;
    }
    // Append enhancement level if enhanced
    var eLevel = getEnhancementLevel(item);
    if (eLevel > 0) name += ' +' + eLevel;
    return name;
}

function getItemEmoji(item) {
    if (item.type === 'component') {
        var comp = ITEM_COMPONENTS[item.key];
        return comp ? comp.emoji : '?';
    } else if (item.type === 'combined') {
        var recipe = ITEM_RECIPES[item.key];
        return recipe ? recipe.emoji : '?';
    } else if (item.type === 'set') {
        var setRecipe = SET_ITEM_RECIPES[item.key];
        return setRecipe ? setRecipe.emoji : '?';
    } else if (item.type === 'ability') {
        var abilityDef = ABILITY_ITEMS[item.key];
        return abilityDef ? abilityDef.emoji : '?';
    } else if (item.type === 'mythic') {
        var mythicDef = MYTHIC_ITEMS[item.key];
        return mythicDef ? mythicDef.emoji : '?';
    }
    return '?';
}

function getItemRarityColor(item) {
    if (item.type === 'component') {
        return ITEM_RARITIES[item.rarity] ? ITEM_RARITIES[item.rarity].color : '#aaa';
    } else if (item.type === 'combined') {
        var rarityOrder = ['standard', 'uncommon', 'rare', 'epic'];
        var r1 = rarityOrder.indexOf(item.comp1Rarity);
        var r2 = rarityOrder.indexOf(item.comp2Rarity);
        var best = rarityOrder[Math.max(r1, r2)];
        return ITEM_RARITIES[best] ? ITEM_RARITIES[best].color : '#aaa';
    } else if (item.type === 'set') {
        var rarityOrder2 = ['standard', 'uncommon', 'rare', 'epic'];
        var sr1 = rarityOrder2.indexOf(item.comp1Rarity);
        var sr2 = rarityOrder2.indexOf(item.comp2Rarity);
        var sBest = rarityOrder2[Math.max(sr1, sr2)];
        return ITEM_RARITIES[sBest] ? ITEM_RARITIES[sBest].color : '#e2b714';
    } else if (item.type === 'ability') {
        return ITEM_RARITIES[item.rarity] ? ITEM_RARITIES[item.rarity].color : '#e2b714';
    } else if (item.type === 'mythic') {
        return '#ff4500'; // Mythic: distinctive orange-red
    }
    return '#aaa';
}

function getItemRarityName(item) {
    if (item.type === 'component') {
        return ITEM_RARITIES[item.rarity] ? ITEM_RARITIES[item.rarity].name : 'Standard';
    } else if (item.type === 'combined') {
        var rarityOrder = ['standard', 'uncommon', 'rare', 'epic'];
        var r1 = rarityOrder.indexOf(item.comp1Rarity);
        var r2 = rarityOrder.indexOf(item.comp2Rarity);
        var best = rarityOrder[Math.max(r1, r2)];
        return ITEM_RARITIES[best] ? ITEM_RARITIES[best].name : 'Standard';
    } else if (item.type === 'set') {
        var setRecipe = SET_ITEM_RECIPES[item.key];
        var setInfo = setRecipe ? ITEM_SETS[setRecipe.setId] : null;
        return setInfo ? setInfo.name : 'Set';
    } else if (item.type === 'ability') {
        var abilityDef = ABILITY_ITEMS[item.key];
        return abilityDef && abilityDef.requiresEvolved ? '⚡ Evolved Only' : 'Ability';
    } else if (item.type === 'mythic') {
        return '🌟 Mythic';
    }
    return 'Standard';
}

function getItemStatDescription(item) {
    var lines = [];
    if (item.type === 'component') {
        var comp = ITEM_COMPONENTS[item.key];
        if (!comp) return '';
        var rarityBonus = ITEM_RARITIES[item.rarity] ? ITEM_RARITIES[item.rarity].bonus : 0;
        var mult = 1 + rarityBonus;
        var val = comp.value * mult;
        lines.push(formatStatLine(comp.stat, val));
    } else if (item.type === 'combined') {
        var recipe = ITEM_RECIPES[item.key];
        if (!recipe) return '';
        var cMult = getCombinedItemStatMultiplier(item.comp1Rarity, item.comp2Rarity);
        var statKeys = Object.keys(recipe.stats);
        for (var i = 0; i < statKeys.length; i++) {
            var sVal = recipe.stats[statKeys[i]] * cMult;
            lines.push(formatStatLine(statKeys[i], sVal));
        }
        if (recipe.special) {
            lines.push(getSpecialDescription(recipe.special));
        }
    } else if (item.type === 'set') {
        var setRecipe = SET_ITEM_RECIPES[item.key];
        if (!setRecipe) return '';
        var sMult = getCombinedItemStatMultiplier(item.comp1Rarity, item.comp2Rarity);
        var sKeys = Object.keys(setRecipe.stats);
        for (var si = 0; si < sKeys.length; si++) {
            lines.push(formatStatLine(sKeys[si], setRecipe.stats[sKeys[si]] * sMult));
        }
        if (setRecipe.special) {
            lines.push(getSpecialDescription(setRecipe.special));
        }
        var setInfo = ITEM_SETS[setRecipe.setId];
        if (setInfo) {
            lines.push('[' + setInfo.name + ']');
        }
    } else if (item.type === 'ability') {
        var abilityDef = ABILITY_ITEMS[item.key];
        if (!abilityDef) return '';
        var aMult = 1 + (ITEM_RARITIES[item.rarity] ? ITEM_RARITIES[item.rarity].bonus : 0);
        var aKeys = Object.keys(abilityDef.stats);
        for (var ai = 0; ai < aKeys.length; ai++) {
            lines.push(formatStatLine(aKeys[ai], abilityDef.stats[aKeys[ai]] * aMult));
        }
        if (abilityDef.ability && abilityDef.ability.desc) {
            lines.push(abilityDef.ability.desc);
        }
    } else if (item.type === 'mythic') {
        var mythicDef = MYTHIC_ITEMS[item.key];
        if (!mythicDef) return '';
        var mEnhanceMult = getEnhancedStatMultiplier(item);
        var mKeys = Object.keys(mythicDef.stats);
        for (var mi = 0; mi < mKeys.length; mi++) {
            lines.push(formatStatLine(mKeys[mi], mythicDef.stats[mKeys[mi]] * mEnhanceMult));
        }
        if (mythicDef.mythicAbility && mythicDef.mythicAbility.desc) {
            lines.push('🌟 ' + mythicDef.mythicAbility.desc);
        }
    }
    // Add affinity info if present
    var affinityDesc = getAffinityDescription(item.key);
    if (affinityDesc) {
        lines.push(affinityDesc);
    }
    return lines.join(', ');
}

function formatStatLine(stat, value) {
    if (stat === 'attack') return '+' + Math.floor(value) + ' ATK';
    if (stat === 'hp') return '+' + Math.floor(value) + ' HP';
    if (stat === 'attackSpd') return (value < 0 ? '' : '+') + value.toFixed(2) + 's ATK SPD';
    if (stat === 'damageReduction') return '+' + Math.round(value * 100) + '% DMG Reduction';
    if (stat === 'critChance') return '+' + Math.round(value * 100) + '% Crit';
    if (stat === 'healPower') return '+' + Math.round(value * 100) + '% Heal Power';
    if (stat === 'range') return '+' + Math.floor(value) + ' Range';
    if (stat === 'elemResist') return '+' + Math.round(value * 100) + '% Elem Resist';
    if (stat === 'startMana') return '+' + Math.floor(value) + ' Start Mana';
    if (stat === 'tenacity') return '+' + Math.round(value * 100) + '% Tenacity';
    if (stat === 'startShield') return '+' + Math.floor(value) + ' Start Shield';
    if (stat === 'manaPerHit') return '+' + Math.floor(value) + ' Mana/Hit';
    return '+' + value + ' ' + stat;
}

function getSpecialDescription(special) {
    if (!special) return '';
    if (special.effect === 'bork') return '3% max HP on-hit';
    if (special.effect === 'warmogRegen') return '2% HP regen/s';
    if (special.effect === 'archangelDmg') return 'Heals deal 20% as damage';
    if (special.effect === 'hojHeal') return 'Heal 10% max HP on kill';
    // New Phase 3 specials
    if (special.effect === 'deathbladeStack') return 'On kill: +8% ATK for 6s (3x max)';
    if (special.effect === 'ragePermanentAS') return 'Each attack: +3% AS permanently (max 30%)';
    if (special.effect === 'chainLightning') return 'Every 3rd attack: chain lightning to 2 enemies for 50 dmg';
    if (special.effect === 'drShred') return 'Crits reduce target DR by 50% for 3s';
    if (special.effect === 'sunfireDPS') return '15 DPS to enemies within 1 cell';
    if (special.effect === 'thornsGrievous') return 'Reflect 80 dmg + Grievous Wounds 3s';
    if (special.effect === 'gargoyleDR') return '+5% DR per attacker (max 25%)';
    if (special.effect === 'redemptionHeal') return 'At 25% HP: heal nearby allies 15% max HP';
    if (special.effect === 'bonusManaPerHit') return '+5 bonus mana per attack';
    if (special.effect === 'postCastMana') return 'After ability: gain 20 mana instantly';
    if (special.effect === 'qssCleanse') return 'Cleanse first CC, 1.5s immunity (10s CD)';
    if (special.effect === 'abilityHeal') return 'Heal 25% of ability damage dealt';
    if (special.effect === 'shieldRefresh') return 'If shield survives 5s, refresh to full';
    return '';
}

// ---- Item Selling ----

function getItemSellValue(item) {
    if (item.type === 'component') {
        // Component sell value: base 5g, scaled by rarity
        // standard: 5g, uncommon: 10g, rare: 20g, epic: 40g
        var rarityMultipliers = { standard: 1, uncommon: 2, rare: 4, epic: 8 };
        var mult = rarityMultipliers[item.rarity] || 1;
        return 5 * mult;
    } else if (item.type === 'combined') {
        // Combined item: sum of what both components would be worth, +50% bonus
        var rarityMultipliers2 = { standard: 1, uncommon: 2, rare: 4, epic: 8 };
        var v1 = 5 * (rarityMultipliers2[item.comp1Rarity] || 1);
        var v2 = 5 * (rarityMultipliers2[item.comp2Rarity] || 1);
        return Math.floor((v1 + v2) * 1.5);
    } else if (item.type === 'set') {
        // Set items: combined item value × 2
        var rarityMultipliers3 = { standard: 1, uncommon: 2, rare: 4, epic: 8 };
        var sv1 = 5 * (rarityMultipliers3[item.comp1Rarity] || 1);
        var sv2 = 5 * (rarityMultipliers3[item.comp2Rarity] || 1);
        return Math.floor((sv1 + sv2) * 1.5 * 2);
    } else if (item.type === 'ability') {
        // Ability items: 100g flat
        return 100;
    } else if (item.type === 'mythic') {
        // Mythics cannot be sold, but return value for display
        return 0;
    }
    return 5;
}

function sellItem(saveData, itemId) {
    // Can't sell equipped items or mythics
    var item = null;
    for (var i = 0; i < saveData.items.bench.length; i++) {
        if (saveData.items.bench[i].id === itemId) {
            item = saveData.items.bench[i];
            break;
        }
    }
    if (!item) return false;
    if (item.equipped) return false; // Must unequip first
    if (item.type === 'mythic') return false; // Mythics cannot be sold

    var goldValue = getItemSellValue(item);
    removeItemFromBench(saveData, itemId);
    earnGold(saveData, goldValue);
    autoSave(saveData);
    return goldValue;
}

// ---- Combat: Apply Item Stats ----

function applyItemStats(unit, saveData) {
    var equippedItems = getEquippedItems(saveData, unit.key);

    for (var i = 0; i < equippedItems.length; i++) {
        var item = equippedItems[i];
        var stats, multiplier;

        if (item.type === 'component') {
            var comp = ITEM_COMPONENTS[item.key];
            if (!comp) continue;
            var rarityBonus = ITEM_RARITIES[item.rarity] ? ITEM_RARITIES[item.rarity].bonus : 0;
            multiplier = 1 + rarityBonus;
            applyStatToUnit(unit, comp.stat, comp.value * multiplier);
        } else if (item.type === 'combined') {
            var recipe = ITEM_RECIPES[item.key];
            if (!recipe) continue;
            multiplier = getCombinedItemStatMultiplier(item.comp1Rarity, item.comp2Rarity);
            var enhanceMult = getEnhancedStatMultiplier(item);
            var statKeys = Object.keys(recipe.stats);
            for (var s = 0; s < statKeys.length; s++) {
                applyStatToUnit(unit, statKeys[s], recipe.stats[statKeys[s]] * multiplier * enhanceMult);
            }
            // Mark special effects on unit for combat processing
            if (recipe.special) {
                if (!unit.itemSpecials) unit.itemSpecials = [];
                unit.itemSpecials.push(recipe.special);
            }
        } else if (item.type === 'ability') {
            var abilityData = ABILITY_ITEMS[item.key];
            if (!abilityData) continue;
            var abilityMult = 1 + (ITEM_RARITIES[item.rarity] ? ITEM_RARITIES[item.rarity].bonus : 0);
            var abilityEnhanceMult = getEnhancedStatMultiplier(item);
            var aStatKeys = Object.keys(abilityData.stats);
            for (var as = 0; as < aStatKeys.length; as++) {
                applyStatToUnit(unit, aStatKeys[as], abilityData.stats[aStatKeys[as]] * abilityMult * abilityEnhanceMult);
            }
            // Store ability on unit for combat processing
            if (abilityData.ability) {
                if (!unit.abilities) unit.abilities = [];
                unit.abilities.push(abilityData.ability);
            }
        } else if (item.type === 'set') {
            var setRecipe = SET_ITEM_RECIPES[item.key];
            if (!setRecipe) continue;
            var setMult = getCombinedItemStatMultiplier(item.comp1Rarity, item.comp2Rarity);
            var setEnhanceMult = getEnhancedStatMultiplier(item);
            var sStatKeys = Object.keys(setRecipe.stats);
            for (var ss = 0; ss < sStatKeys.length; ss++) {
                applyStatToUnit(unit, sStatKeys[ss], setRecipe.stats[sStatKeys[ss]] * setMult * setEnhanceMult);
            }
            if (setRecipe.special) {
                if (!unit.itemSpecials) unit.itemSpecials = [];
                unit.itemSpecials.push(setRecipe.special);
            }
        } else if (item.type === 'mythic') {
            var mythicDef = MYTHIC_ITEMS[item.key];
            if (!mythicDef) continue;
            var mythicEnhanceMult = getEnhancedStatMultiplier(item);
            var mStatKeys = Object.keys(mythicDef.stats);
            for (var ms = 0; ms < mStatKeys.length; ms++) {
                applyStatToUnit(unit, mStatKeys[ms], mythicDef.stats[mStatKeys[ms]] * mythicEnhanceMult);
            }
            // Store mythic ability on unit for combat processing
            if (mythicDef.mythicAbility) {
                if (!unit.mythicAbilities) unit.mythicAbilities = [];
                unit.mythicAbilities.push(mythicDef.mythicAbility);
            }
        }

        // Check and apply item affinity bonus
        var affinityBonus = checkItemAffinity(item.key, unit.key);
        if (affinityBonus) {
            if (!unit.affinityBonuses) unit.affinityBonuses = [];
            unit.affinityBonuses.push(affinityBonus);
            // Apply stat-based affinity bonuses directly
            if (affinityBonus.effect === 'bonusCritDamage') {
                unit.bonusCritDamage = (unit.bonusCritDamage || 0) + affinityBonus.value;
            } else if (affinityBonus.effect === 'bonusDR') {
                applyStatToUnit(unit, 'damageReduction', affinityBonus.value);
            } else if (affinityBonus.effect === 'bonusRange') {
                applyStatToUnit(unit, 'range', affinityBonus.value);
            } else if (affinityBonus.effect === 'aegisShieldUp') {
                // Replace base startShield with affinity-boosted value
                unit.startShield = (unit.startShield || 0) + (affinityBonus.value - 150);
            }
            // Other affinity bonuses (combat specials) are read from unit.affinityBonuses during combat
        }

        // Apply gem stats for socketed items
        applyGemStatsToUnit(unit, item);
    }

    // Post-processing: apply spellAmp (Rabadon's) after all stats
    if (unit.abilities) {
        for (var sa = 0; sa < unit.abilities.length; sa++) {
            if (unit.abilities[sa].effect === 'spellAmp') {
                unit.attack = Math.floor(unit.attack * (1 + unit.abilities[sa].value));
            }
        }
    }
}

function applyStatToUnit(unit, stat, value) {
    if (stat === 'attack') unit.attack += Math.floor(value);
    else if (stat === 'hp') { unit.hp += Math.floor(value); unit.maxHp += Math.floor(value); }
    else if (stat === 'attackSpd') unit.attackSpd += value; // negative = faster
    else if (stat === 'damageReduction') unit.damageReduction = (unit.damageReduction || 0) + value;
    else if (stat === 'critChance') unit.critChance = (unit.critChance || 0) + value;
    else if (stat === 'healPower') unit.healBonus = (unit.healBonus || 0) + value;
    else if (stat === 'range') unit.range += Math.floor(value);
    else if (stat === 'elemResist') unit.elemResist = (unit.elemResist || 0) + value;
    // New Phase 3 stats
    else if (stat === 'startMana') unit.startMana = (unit.startMana || 0) + Math.floor(value);
    else if (stat === 'tenacity') unit.tenacity = (unit.tenacity || 0) + value;
    else if (stat === 'startShield') unit.startShield = (unit.startShield || 0) + Math.floor(value);
    else if (stat === 'manaPerHit') unit.manaPerHit = (unit.manaPerHit || 0) + Math.floor(value);
}

// ---- Recipe Book & Collection Bonuses ----

// Collection milestone definitions
var COLLECTION_MILESTONES = {
    apprentice_smith:  { name: 'Apprentice Smith',  requirement: 'combined', count: 5,   bonus: { type: 'dropRarity',      value: 0.05, desc: '+5% item drop rarity' } },
    journeyman_smith:  { name: 'Journeyman Smith',  requirement: 'combined', count: 10,  bonus: { type: 'gemDropRate',     value: 0.10, desc: '+10% gem drop rate' } },
    master_smith:      { name: 'Master Smith',       requirement: 'combined', count: 21,  bonus: { type: 'forgeCostReduce', value: 0.10, desc: 'Forge costs -10% gold' } },
    artificer:         { name: 'Artificer',          requirement: 'ability',  count: 3,   bonus: { type: 'benchSlot',       value: 1,    desc: '+1 item bench slot' } },
    grand_artificer:   { name: 'Grand Artificer',    requirement: 'ability',  count: 12,  bonus: { type: 'pityReduce',      value: 2,    desc: 'Enhancement pity after 2 failures' } },
    mythic_forger:     { name: 'Mythic Forger',      requirement: 'mythic',   count: 1,   bonus: { type: 'autoEnhance',     value: true, desc: 'Unlock auto-enhance option' } }
};

// Record a recipe discovery in save data
function discoverRecipe(saveData, itemType, itemKey) {
    if (!saveData.items.recipeBook) saveData.items.recipeBook = {};
    var bookKey = itemType + ':' + itemKey;
    if (!saveData.items.recipeBook[bookKey]) {
        saveData.items.recipeBook[bookKey] = {
            discovered: true,
            discoveredAt: new Date().toISOString()
        };
        // Check for newly earned milestones
        checkCollectionMilestones(saveData);
        return true; // new discovery
    }
    return false; // already known
}

// Check if a recipe is discovered
function isRecipeDiscovered(saveData, itemType, itemKey) {
    if (!saveData.items.recipeBook) return false;
    var bookKey = itemType + ':' + itemKey;
    return !!(saveData.items.recipeBook[bookKey] && saveData.items.recipeBook[bookKey].discovered);
}

// Get count of discovered recipes by type
function getDiscoveredCount(saveData, itemType) {
    if (!saveData.items.recipeBook) return 0;
    var count = 0;
    var keys = Object.keys(saveData.items.recipeBook);
    for (var i = 0; i < keys.length; i++) {
        if (keys[i].indexOf(itemType + ':') === 0 && saveData.items.recipeBook[keys[i]].discovered) {
            count++;
        }
    }
    return count;
}

// Get total recipe counts for each type (for progress display)
function getTotalRecipeCount(itemType) {
    if (itemType === 'combined') return Object.keys(ITEM_RECIPES).length;
    if (itemType === 'set') return Object.keys(SET_ITEM_RECIPES).length;
    if (itemType === 'ability') return Object.keys(ABILITY_ITEMS).length;
    if (itemType === 'mythic') return Object.keys(MYTHIC_ITEMS).length;
    return 0;
}

// Check and award collection milestones
function checkCollectionMilestones(saveData) {
    if (!saveData.items.milestones) saveData.items.milestones = {};
    var milestoneKeys = Object.keys(COLLECTION_MILESTONES);
    var newlyEarned = [];

    for (var i = 0; i < milestoneKeys.length; i++) {
        var mKey = milestoneKeys[i];
        if (saveData.items.milestones[mKey]) continue; // already earned

        var milestone = COLLECTION_MILESTONES[mKey];
        var discovered = getDiscoveredCount(saveData, milestone.requirement);

        if (discovered >= milestone.count) {
            saveData.items.milestones[mKey] = {
                earned: true,
                earnedAt: new Date().toISOString()
            };
            newlyEarned.push(milestone);

            // Apply immediate bonuses
            if (milestone.bonus.type === 'benchSlot') {
                saveData.items.benchSize = (saveData.items.benchSize || 10) + milestone.bonus.value;
            }
        }
    }

    return newlyEarned;
}

// Check if a specific milestone is earned
function isMilestoneEarned(saveData, milestoneKey) {
    return !!(saveData.items.milestones && saveData.items.milestones[milestoneKey] && saveData.items.milestones[milestoneKey].earned);
}

// Get active collection bonuses (for use by other systems)
function getActiveCollectionBonuses(saveData) {
    var bonuses = {
        dropRarityBonus: 0,
        gemDropRateBonus: 0,
        forgeCostReduction: 0,
        pityThreshold: 3, // default
        autoEnhanceUnlocked: false
    };

    if (!saveData.items.milestones) return bonuses;

    var milestoneKeys = Object.keys(COLLECTION_MILESTONES);
    for (var i = 0; i < milestoneKeys.length; i++) {
        var mKey = milestoneKeys[i];
        if (!saveData.items.milestones[mKey] || !saveData.items.milestones[mKey].earned) continue;

        var milestone = COLLECTION_MILESTONES[mKey];
        if (milestone.bonus.type === 'dropRarity') bonuses.dropRarityBonus += milestone.bonus.value;
        else if (milestone.bonus.type === 'gemDropRate') bonuses.gemDropRateBonus += milestone.bonus.value;
        else if (milestone.bonus.type === 'forgeCostReduce') bonuses.forgeCostReduction += milestone.bonus.value;
        else if (milestone.bonus.type === 'pityReduce') bonuses.pityThreshold = milestone.bonus.value;
        else if (milestone.bonus.type === 'autoEnhance') bonuses.autoEnhanceUnlocked = true;
    }

    return bonuses;
}

// Get all recipes for recipe book display
function getRecipeBookEntries(saveData) {
    var entries = [];

    // Combined items
    var combinedKeys = Object.keys(ITEM_RECIPES);
    for (var c = 0; c < combinedKeys.length; c++) {
        var cKey = combinedKeys[c];
        var cRecipe = ITEM_RECIPES[cKey];
        entries.push({
            key: cKey,
            type: 'combined',
            name: cRecipe.name,
            emoji: cRecipe.emoji,
            discovered: isRecipeDiscovered(saveData, 'combined', cKey),
            components: [cRecipe.comp1, cRecipe.comp2]
        });
    }

    // Set items
    var setKeys = Object.keys(SET_ITEM_RECIPES);
    for (var s = 0; s < setKeys.length; s++) {
        var sKey = setKeys[s];
        var sRecipe = SET_ITEM_RECIPES[sKey];
        entries.push({
            key: sKey,
            type: 'set',
            name: sRecipe.name,
            emoji: sRecipe.emoji,
            discovered: isRecipeDiscovered(saveData, 'set', sKey),
            components: [sRecipe.comp1, sRecipe.comp2],
            setId: sRecipe.setId
        });
    }

    // Ability items
    var abilityKeys = Object.keys(ABILITY_ITEMS);
    for (var a = 0; a < abilityKeys.length; a++) {
        var aKey = abilityKeys[a];
        var abilityDef = ABILITY_ITEMS[aKey];
        entries.push({
            key: aKey,
            type: 'ability',
            name: abilityDef.name,
            emoji: abilityDef.emoji,
            discovered: isRecipeDiscovered(saveData, 'ability', aKey),
            craftFrom: abilityDef.craftFrom || null
        });
    }

    // Mythic items
    var mythicKeys = Object.keys(MYTHIC_ITEMS);
    for (var m = 0; m < mythicKeys.length; m++) {
        var mKey = mythicKeys[m];
        var mythicDef = MYTHIC_ITEMS[mKey];
        entries.push({
            key: mKey,
            type: 'mythic',
            name: mythicDef.name,
            emoji: mythicDef.emoji,
            discovered: isRecipeDiscovered(saveData, 'mythic', mKey),
            craftFrom: mythicDef.craftFrom,
            material: mythicDef.material
        });
    }

    return entries;
}

// Auto-populate recipe book from existing items on save migration
function autoPopulateRecipeBook(saveData) {
    if (!saveData.items || !saveData.items.bench) return;
    if (!saveData.items.recipeBook) saveData.items.recipeBook = {};

    for (var i = 0; i < saveData.items.bench.length; i++) {
        var item = saveData.items.bench[i];
        if (item.type === 'combined' || item.type === 'set' || item.type === 'ability' || item.type === 'mythic') {
            discoverRecipe(saveData, item.type, item.key);
        }
    }
}

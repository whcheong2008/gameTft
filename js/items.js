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
    }
};

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
            // Combined items cannot be unequipped
            if (item.type === 'combined') return false;
            item.equipped = null;
            autoSave(saveData);
            return true;
        }
    }
    return false;
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
    if (item.type === 'component') {
        var comp = ITEM_COMPONENTS[item.key];
        return comp ? comp.name : item.key;
    } else if (item.type === 'combined') {
        var recipe = ITEM_RECIPES[item.key];
        return recipe ? recipe.name : item.key;
    } else if (item.type === 'set') {
        var setRecipe = SET_ITEM_RECIPES[item.key];
        return setRecipe ? setRecipe.name : item.key;
    } else if (item.type === 'ability') {
        var abilityDef = ABILITY_ITEMS[item.key];
        return abilityDef ? abilityDef.name : item.key;
    }
    return 'Unknown';
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
    }
    return 5;
}

function sellItem(saveData, itemId) {
    // Can't sell equipped items
    var item = null;
    for (var i = 0; i < saveData.items.bench.length; i++) {
        if (saveData.items.bench[i].id === itemId) {
            item = saveData.items.bench[i];
            break;
        }
    }
    if (!item) return false;
    if (item.equipped) return false; // Must unequip first

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
            var statKeys = Object.keys(recipe.stats);
            for (var s = 0; s < statKeys.length; s++) {
                applyStatToUnit(unit, statKeys[s], recipe.stats[statKeys[s]] * multiplier);
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
            var aStatKeys = Object.keys(abilityData.stats);
            for (var as = 0; as < aStatKeys.length; as++) {
                applyStatToUnit(unit, aStatKeys[as], abilityData.stats[aStatKeys[as]] * abilityMult);
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
            var sStatKeys = Object.keys(setRecipe.stats);
            for (var ss = 0; ss < sStatKeys.length; ss++) {
                applyStatToUnit(unit, sStatKeys[ss], setRecipe.stats[sStatKeys[ss]] * setMult);
            }
            if (setRecipe.special) {
                if (!unit.itemSpecials) unit.itemSpecials = [];
                unit.itemSpecials.push(setRecipe.special);
            }
        }
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

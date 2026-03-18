// =============================================================================
// units-templates.js — Unit templates, evolved templates, evolution paths
// =============================================================================

var UNIT_TEMPLATES = {
    // --- FIRE (10 units) ---
    flame_warrior:  { name: 'Flame Warrior',  cost: 1, type: 'warrior',  archetype: 'duelist',   secondaryArchetype: 'vanguard',  element: 'fire', hp: 600,  attack: 50,  attackSpd: 0.85, range: 1, moveSpd: 1.9, maxMana: 65, emoji: '\u{2694}\uFE0F\u{1F525}', evolvedForm: 'fire_berserker' },
    ember_scout:    { name: 'Ember Scout',    cost: 1, type: 'assassin', archetype: 'predator',  secondaryArchetype: 'duelist',   element: 'fire', hp: 390,  attack: 46,  attackSpd: 0.5,  range: 1, moveSpd: 3.9, maxMana: 45, emoji: '\u{1F5E1}\uFE0F\u{1F525}', evolvedForm: 'flame_rogue' },
    cinder_archer:  { name: 'Cinder Archer',  cost: 1, type: 'archer',   archetype: 'ranger',    secondaryArchetype: 'sorcerer',  element: 'fire', hp: 360,  attack: 52,  attackSpd: 0.7,  range: 4, moveSpd: 2.0, maxMana: 55, emoji: '\u{1F3F9}\u{1F525}', evolvedForm: 'cinder_marksman' },
    fire_acolyte:   { name: 'Fire Acolyte',   cost: 1, type: 'healer',   archetype: 'sage',      secondaryArchetype: 'guardian',  element: 'fire', hp: 420,  attack: 28,  attackSpd: 1.1,  range: 2, moveSpd: 1.6, maxMana: 70, emoji: '\u{1F49A}\u{1F525}', evolvedForm: 'ember_saint' },
    magma_knight:   { name: 'Magma Knight',   cost: 2, type: 'tank',     archetype: 'guardian',  secondaryArchetype: 'warden',    element: 'fire', hp: 880,  attack: 35,  attackSpd: 1.0,  range: 1, moveSpd: 1.5, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{1F525}', evolvedForm: 'volcano_titan' },
    blaze_lancer:   { name: 'Blaze Lancer',   cost: 2, type: 'warrior',  archetype: 'vanguard',  secondaryArchetype: 'predator',  element: 'fire', hp: 720,  attack: 55,  attackSpd: 0.8,  range: 1, moveSpd: 2.0, maxMana: 60, emoji: '\u{2694}\uFE0F\u{1F525}', evolvedForm: 'inferno_lancer' },
    pyromancer:     { name: 'Pyromancer',     cost: 3, type: 'mage',     archetype: 'sorcerer',  secondaryArchetype: 'mystic',    element: 'fire', hp: 520,  attack: 75,  attackSpd: 0.9,  range: 3, moveSpd: 1.5, maxMana: 65, emoji: '\u{1F52E}\u{1F525}', evolvedForm: 'arcane_inferno' },
    inferno_fox:    { name: 'Inferno Fox',    cost: 3, type: 'assassin', archetype: 'mystic',    secondaryArchetype: 'predator',  element: 'fire', hp: 480,  attack: 72,  attackSpd: 0.5,  range: 1, moveSpd: 3.8, maxMana: 50, emoji: '\u{1F5E1}\uFE0F\u{1F525}', evolvedForm: 'ninetail_blaze' },
    fire_dragon:    { name: 'Fire Dragon',    cost: 4, type: 'mage',     archetype: 'warden',    secondaryArchetype: 'sorcerer',  element: 'fire', hp: 1100, attack: 95,  attackSpd: 0.9,  range: 3, moveSpd: 1.5, maxMana: 80, emoji: '\u{1F52E}\u{1F525}', evolvedForm: 'elder_wyrm' },
    phoenix:        { name: 'Phoenix',        cost: 5, type: 'mage',     archetype: 'mystic',    secondaryArchetype: 'sage',      element: 'fire', hp: 950,  attack: 110, attackSpd: 0.95, range: 3, moveSpd: 1.6, maxMana: 0,  emoji: '\u{1F52E}\u{1F525}', evolvedForm: 'eternal_phoenix' },

    // --- WATER (10 units) ---
    tide_hunter:    { name: 'Tide Hunter',    cost: 1, type: 'warrior',  archetype: 'vanguard',  secondaryArchetype: 'warden',    element: 'water', hp: 640,  attack: 48,  attackSpd: 0.8,  range: 1, moveSpd: 1.8, maxMana: 60, emoji: '\u{2694}\uFE0F\u{1F4A7}', evolvedForm: 'tsunami_blade' },
    frost_archer:   { name: 'Frost Archer',   cost: 1, type: 'archer',   archetype: 'ranger',    secondaryArchetype: 'mystic',    element: 'water', hp: 360,  attack: 50,  attackSpd: 0.7,  range: 4, moveSpd: 1.95,maxMana: 50, emoji: '\u{1F3F9}\u{1F4A7}', evolvedForm: 'ice_sniper' },
    reef_stalker:   { name: 'Reef Stalker',   cost: 1, type: 'assassin', archetype: 'predator',  secondaryArchetype: 'duelist',   element: 'water', hp: 400,  attack: 44,  attackSpd: 0.5,  range: 1, moveSpd: 3.8, maxMana: 40, emoji: '\u{1F5E1}\uFE0F\u{1F4A7}', evolvedForm: 'tidal_phantom' },
    coral_priest:   { name: 'Coral Priest',   cost: 2, type: 'healer',   archetype: 'sage',      secondaryArchetype: 'ranger',    element: 'water', hp: 450,  attack: 30,  attackSpd: 1.1,  range: 2, moveSpd: 1.5, maxMana: 75, emoji: '\u{1F49A}\u{1F4A7}', evolvedForm: 'ocean_sage' },
    hydro_mage:     { name: 'Hydro Mage',     cost: 2, type: 'mage',     archetype: 'sorcerer',  secondaryArchetype: 'ranger',    element: 'water', hp: 400,  attack: 62,  attackSpd: 0.95, range: 3, moveSpd: 1.4, maxMana: 70, emoji: '\u{1F52E}\u{1F4A7}', evolvedForm: 'abyssal_mage' },
    shell_knight:   { name: 'Shell Knight',   cost: 2, type: 'tank',     archetype: 'guardian',  secondaryArchetype: 'sage',      element: 'water', hp: 900,  attack: 32,  attackSpd: 1.0,  range: 1, moveSpd: 1.4, maxMana: 80, emoji: '\u{1F6E1}\uFE0F\u{1F4A7}', evolvedForm: 'armored_sentinel' },
    tidal_shaman:   { name: 'Tidal Shaman',   cost: 3, type: 'healer',   archetype: 'mystic',    secondaryArchetype: 'sage',      element: 'water', hp: 480,  attack: 45,  attackSpd: 1.1,  range: 2.5, moveSpd: 1.6, maxMana: 80, emoji: '\u{1F49A}\u{1F4A7}', evolvedForm: 'stormtide_oracle' },
    riptide_blade:  { name: 'Riptide Blade',  cost: 3, type: 'warrior',  archetype: 'duelist',   secondaryArchetype: 'vanguard',  element: 'water', hp: 620,  attack: 70,  attackSpd: 0.8,  range: 1, moveSpd: 1.8, maxMana: 65, emoji: '\u{2694}\uFE0F\u{1F4A7}', evolvedForm: 'tsunami_warlord' },
    kraken:         { name: 'Kraken',         cost: 4, type: 'mage',     archetype: 'warden',    secondaryArchetype: 'sorcerer',  element: 'water', hp: 920,  attack: 98,  attackSpd: 0.9,  range: 3, moveSpd: 1.3, maxMana: 85, emoji: '\u{1F52E}\u{1F4A7}', evolvedForm: 'abyssal_terror' },
    leviathan:      { name: 'Leviathan',      cost: 5, type: 'tank',     archetype: 'guardian',  secondaryArchetype: 'warden',    element: 'water', hp: 1450, attack: 35,  attackSpd: 1.0,  range: 1, moveSpd: 1.2, maxMana: 0,  emoji: '\u{1F6E1}\uFE0F\u{1F4A7}', evolvedForm: 'primordial_leviathan' },

    // --- EARTH (10 units) ---
    stone_guard:    { name: 'Stone Guard',    cost: 1, type: 'tank',     archetype: 'guardian',  secondaryArchetype: 'vanguard',  element: 'earth', hp: 750,  attack: 32,  attackSpd: 1.0,  range: 1, moveSpd: 1.4, maxMana: 80, emoji: '\u{1F6E1}\uFE0F\u{1F33F}', evolvedForm: 'mountain_lord' },
    bramble_knight: { name: 'Bramble Knight', cost: 1, type: 'warrior',  archetype: 'vanguard',  secondaryArchetype: 'guardian',  element: 'earth', hp: 640,  attack: 48,  attackSpd: 0.85, range: 1, moveSpd: 1.8, maxMana: 65, emoji: '\u{2694}\uFE0F\u{1F33F}', evolvedForm: 'ironwood_sentinel' },
    seedling_archer:{ name: 'Seedling Archer',cost: 1, type: 'archer',   archetype: 'ranger',    secondaryArchetype: 'warden',    element: 'earth', hp: 360,  attack: 48,  attackSpd: 0.7,  range: 3, moveSpd: 2.0, maxMana: 55, emoji: '\u{1F3F9}\u{1F33F}', evolvedForm: 'thornwood_ranger' },
    earth_shaman:   { name: 'Earth Shaman',   cost: 2, type: 'healer',   archetype: 'sage',      secondaryArchetype: 'mystic',    element: 'earth', hp: 450,  attack: 32,  attackSpd: 1.1,  range: 2.5, moveSpd: 1.5, maxMana: 75, emoji: '\u{1F49A}\u{1F33F}', evolvedForm: 'gaia_priest' },
    crystal_mage:   { name: 'Crystal Mage',   cost: 2, type: 'mage',     archetype: 'guardian',  secondaryArchetype: 'sorcerer',  element: 'earth', hp: 500,  attack: 62,  attackSpd: 0.95, range: 3, moveSpd: 1.5, maxMana: 70, emoji: '\u{1F52E}\u{1F33F}', evolvedForm: 'geomancer' },
    mud_stalker:    { name: 'Mud Stalker',    cost: 2, type: 'assassin', archetype: 'predator',  secondaryArchetype: 'duelist',   element: 'earth', hp: 420,  attack: 48,  attackSpd: 0.5,  range: 1, moveSpd: 3.2, maxMana: 45, emoji: '\u{1F5E1}\uFE0F\u{1F33F}', evolvedForm: 'quake_reaper' },
    golem:          { name: 'Golem',          cost: 3, type: 'tank',     archetype: 'warden',    secondaryArchetype: 'guardian',   element: 'earth', hp: 1050, attack: 42,  attackSpd: 1.0,  range: 1, moveSpd: 1.2, maxMana: 90, emoji: '\u{1F6E1}\uFE0F\u{1F33F}', evolvedForm: 'iron_colossus' },
    terra_sage:     { name: 'Terra Sage',     cost: 3, type: 'mage',     archetype: 'sorcerer',  secondaryArchetype: 'ranger',    element: 'earth', hp: 440,  attack: 70,  attackSpd: 0.9,  range: 3, moveSpd: 1.5, maxMana: 75, emoji: '\u{1F52E}\u{1F33F}', evolvedForm: 'earthweaver' },
    ancient_treant: { name: 'Ancient Treant', cost: 4, type: 'warrior',  archetype: 'duelist',   secondaryArchetype: 'warden',    element: 'earth', hp: 1200, attack: 70,  attackSpd: 0.9,  range: 1, moveSpd: 1.2, maxMana: 80, emoji: '\u{2694}\uFE0F\u{1F33F}', evolvedForm: 'world_sentinel' },
    world_tree:     { name: 'World Tree',     cost: 5, type: 'healer',   archetype: 'sage',      secondaryArchetype: 'guardian',  element: 'earth', hp: 1300, attack: 28,  attackSpd: 1.2,  range: 3, moveSpd: 1.3, maxMana: 0,  emoji: '\u{1F49A}\u{1F33F}', evolvedForm: 'yggdrasil' },

    // --- WIND (10 units) ---
    zephyr_scout:   { name: 'Zephyr Scout',   cost: 1, type: 'assassin', archetype: 'predator',  secondaryArchetype: 'duelist',   element: 'wind', hp: 395,  attack: 46,  attackSpd: 0.5,  range: 1, moveSpd: 4.0, maxMana: 45, emoji: '\u{1F5E1}\uFE0F\u{1F4A8}', evolvedForm: 'storm_assassin' },
    wind_archer:    { name: 'Wind Archer',    cost: 1, type: 'archer',   archetype: 'ranger',    secondaryArchetype: 'predator',  element: 'wind', hp: 360,  attack: 52,  attackSpd: 0.7,  range: 4, moveSpd: 2.1, maxMana: 55, emoji: '\u{1F3F9}\u{1F4A8}', evolvedForm: 'gale_sniper' },
    gale_dancer:    { name: 'Gale Dancer',    cost: 1, type: 'healer',   archetype: 'sage',      secondaryArchetype: 'ranger',    element: 'wind', hp: 420,  attack: 30,  attackSpd: 1.1,  range: 2.5, moveSpd: 2.2, maxMana: 75, emoji: '\u{1F49A}\u{1F4A8}', evolvedForm: 'stormweaver' },
    wind_squire:    { name: 'Wind Squire',    cost: 1, type: 'warrior',  archetype: 'vanguard',  secondaryArchetype: 'duelist',   element: 'wind', hp: 600,  attack: 48,  attackSpd: 0.8,  range: 1, moveSpd: 1.95,maxMana: 60, emoji: '\u{2694}\uFE0F\u{1F4A8}', evolvedForm: 'zephyr_warrior' },
    sky_knight:     { name: 'Sky Knight',     cost: 2, type: 'warrior',  archetype: 'warden',    secondaryArchetype: 'guardian',  element: 'wind', hp: 680,  attack: 52,  attackSpd: 0.85, range: 1, moveSpd: 1.9, maxMana: 65, emoji: '\u{2694}\uFE0F\u{1F4A8}', evolvedForm: 'aegis_paladin' },
    gust_sentinel:  { name: 'Gust Sentinel',  cost: 2, type: 'tank',     archetype: 'guardian',  secondaryArchetype: 'warden',    element: 'wind', hp: 850,  attack: 32,  attackSpd: 1.0,  range: 1, moveSpd: 1.6, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{1F4A8}', evolvedForm: 'tempest_guardian' },
    monsoon_caller: { name: 'Monsoon Caller', cost: 3, type: 'mage',     archetype: 'sorcerer',  secondaryArchetype: 'mystic',    element: 'wind', hp: 420,  attack: 78,  attackSpd: 0.9,  range: 3, moveSpd: 1.8, maxMana: 70, emoji: '\u{1F52E}\u{1F4A8}', evolvedForm: 'tempest_lord' },
    wind_duelist:   { name: 'Wind Duelist',   cost: 3, type: 'warrior',  archetype: 'duelist',   secondaryArchetype: 'predator',  element: 'wind', hp: 620,  attack: 68,  attackSpd: 0.8,  range: 1, moveSpd: 2.0, maxMana: 60, emoji: '\u{2694}\uFE0F\u{1F4A8}', evolvedForm: 'hurricane_blade' },
    storm_sovereign:{ name: 'Storm Sovereign',cost: 4, type: 'assassin', archetype: 'predator',  secondaryArchetype: 'vanguard',  element: 'wind', hp: 740,  attack: 100, attackSpd: 0.45, range: 1, moveSpd: 4.2, maxMana: 55, emoji: '\u{1F5E1}\uFE0F\u{1F4A8}', evolvedForm: 'tempest_emperor' },
    void_wyrm:      { name: 'Void Wyrm',      cost: 5, type: 'mage',     archetype: 'mystic',    secondaryArchetype: 'sorcerer',  element: 'wind', hp: 820,  attack: 125, attackSpd: 0.7,  range: 4, moveSpd: 2.1, maxMana: 0,  emoji: '\u{1F52E}\u{1F4A8}', evolvedForm: 'dimensional_dragon' },

    // --- LIGHTNING (10 units) ---
    spark_fencer:   { name: 'Spark Fencer',   cost: 1, type: 'warrior',  archetype: 'duelist',   secondaryArchetype: 'sorcerer',  element: 'lightning', hp: 620,  attack: 50,  attackSpd: 0.85, range: 1, moveSpd: 1.9, maxMana: 65, emoji: '\u{2694}\uFE0F\u{26A1}', evolvedForm: 'arc_duelist' },
    volt_runner:    { name: 'Volt Runner',    cost: 1, type: 'assassin', archetype: 'predator',  secondaryArchetype: 'vanguard',  element: 'lightning', hp: 400,  attack: 45,  attackSpd: 0.5,  range: 1, moveSpd: 4.0, maxMana: 45, emoji: '\u{1F5E1}\uFE0F\u{26A1}', evolvedForm: 'lightning_phantom' },
    thunder_archer: { name: 'Thunder Archer', cost: 1, type: 'archer',   archetype: 'ranger',    secondaryArchetype: 'mystic',    element: 'lightning', hp: 360,  attack: 52,  attackSpd: 0.7,  range: 4, moveSpd: 2.0, maxMana: 55, emoji: '\u{1F3F9}\u{26A1}', evolvedForm: 'storm_archer' },
    pulse_mender:   { name: 'Pulse Mender',   cost: 1, type: 'healer',   archetype: 'sage',      secondaryArchetype: 'ranger',    element: 'lightning', hp: 430,  attack: 28,  attackSpd: 1.1,  range: 2.5, moveSpd: 1.6, maxMana: 75, emoji: '\u{1F49A}\u{26A1}', evolvedForm: 'storm_medic' },
    tesla_knight:   { name: 'Tesla Knight',   cost: 2, type: 'tank',     archetype: 'guardian',  secondaryArchetype: 'warden',    element: 'lightning', hp: 900,  attack: 35,  attackSpd: 1.0,  range: 1, moveSpd: 1.5, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{26A1}', evolvedForm: 'storm_bastion' },
    shock_mage:     { name: 'Shock Mage',     cost: 2, type: 'mage',     archetype: 'sorcerer',  secondaryArchetype: 'ranger',    element: 'lightning', hp: 420,  attack: 65,  attackSpd: 0.95, range: 3, moveSpd: 1.5, maxMana: 75, emoji: '\u{1F52E}\u{26A1}', evolvedForm: 'tempest_mage' },
    ball_lightning:  { name: 'Ball Lightning',  cost: 3, type: 'mage',     archetype: 'mystic',    secondaryArchetype: 'sorcerer',  element: 'lightning', hp: 480,  attack: 75,  attackSpd: 0.9,  range: 3, moveSpd: 1.6, maxMana: 70, emoji: '\u{1F52E}\u{26A1}', evolvedForm: 'plasma_core' },
    thunder_warden: { name: 'Thunder Warden', cost: 3, type: 'tank',     archetype: 'warden',    secondaryArchetype: 'guardian',  element: 'lightning', hp: 1000, attack: 45,  attackSpd: 1.0,  range: 1, moveSpd: 1.3, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{26A1}', evolvedForm: 'storm_fortress' },
    thunderbird:    { name: 'Thunderbird',    cost: 4, type: 'warrior',  archetype: 'vanguard',  secondaryArchetype: 'predator',  element: 'lightning', hp: 820,  attack: 88,  attackSpd: 0.8,  range: 1, moveSpd: 2.2, maxMana: 70, emoji: '\u{2694}\uFE0F\u{26A1}', evolvedForm: 'roc_of_storms' },
    storm_dragon:   { name: 'Storm Dragon',   cost: 5, type: 'mage',     archetype: 'sorcerer',  secondaryArchetype: 'mystic',    element: 'lightning', hp: 1000, attack: 130, attackSpd: 0.95, range: 3, moveSpd: 1.7, maxMana: 0,  emoji: '\u{1F52E}\u{26A1}', evolvedForm: 'thunder_god' },

    // --- FORCE (10 units) ---
    iron_soldier:   { name: 'Iron Soldier',   cost: 1, type: 'warrior',  archetype: 'vanguard',  secondaryArchetype: 'sage',      element: 'force', hp: 630,  attack: 52,  attackSpd: 0.85, range: 1, moveSpd: 1.9, maxMana: 65, emoji: '\u{2694}\uFE0F\u{1F4AA}', evolvedForm: 'legionnaire' },
    shadow_blade:   { name: 'Shadow Blade',   cost: 1, type: 'assassin', archetype: 'predator',  secondaryArchetype: 'duelist',   element: 'force', hp: 410,  attack: 48,  attackSpd: 0.5,  range: 1, moveSpd: 3.9, maxMana: 45, emoji: '\u{1F5E1}\uFE0F\u{1F4AA}', evolvedForm: 'night_stalker' },
    steel_archer:   { name: 'Steel Archer',   cost: 1, type: 'archer',   archetype: 'ranger',    secondaryArchetype: 'predator',  element: 'force', hp: 370,  attack: 50,  attackSpd: 0.7,  range: 4, moveSpd: 2.0, maxMana: 55, emoji: '\u{1F3F9}\u{1F4AA}', evolvedForm: 'ballista_archer' },
    war_cleric:     { name: 'War Cleric',     cost: 2, type: 'healer',   archetype: 'sage',      secondaryArchetype: 'vanguard',  element: 'force', hp: 460,  attack: 32,  attackSpd: 1.1,  range: 2, moveSpd: 1.6, maxMana: 75, emoji: '\u{1F49A}\u{1F4AA}', evolvedForm: 'battle_priest' },
    battle_mage:    { name: 'Battle Mage',    cost: 2, type: 'mage',     archetype: 'sorcerer',  secondaryArchetype: 'warden',    element: 'force', hp: 420,  attack: 68,  attackSpd: 0.95, range: 3, moveSpd: 1.5, maxMana: 75, emoji: '\u{1F52E}\u{1F4AA}', evolvedForm: 'force_archmage' },
    shield_bearer:  { name: 'Shield Bearer',  cost: 2, type: 'tank',     archetype: 'guardian',  secondaryArchetype: 'sage',      element: 'force', hp: 920,  attack: 32,  attackSpd: 1.0,  range: 1, moveSpd: 1.5, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{1F4AA}', evolvedForm: 'bastion' },
    gladiator:      { name: 'Gladiator',      cost: 3, type: 'warrior',  archetype: 'duelist',   secondaryArchetype: 'vanguard',  element: 'force', hp: 650,  attack: 80,  attackSpd: 0.8,  range: 1, moveSpd: 1.9, maxMana: 60, emoji: '\u{2694}\uFE0F\u{1F4AA}', evolvedForm: 'champion' },
    fortress:       { name: 'Fortress',       cost: 3, type: 'tank',     archetype: 'warden',    secondaryArchetype: 'guardian',  element: 'force', hp: 1100, attack: 40,  attackSpd: 1.0,  range: 1, moveSpd: 1.2, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{1F4AA}', evolvedForm: 'citadel' },
    siege_engineer: { name: 'Siege Engineer', cost: 4, type: 'mage',     archetype: 'mystic',    secondaryArchetype: 'ranger',    element: 'force', hp: 520,  attack: 92,  attackSpd: 0.9,  range: 3, moveSpd: 1.5, maxMana: 75, emoji: '\u{1F52E}\u{1F4AA}', evolvedForm: 'war_architect' },
    titan_lord:     { name: 'Titan Lord',     cost: 5, type: 'warrior',  archetype: 'duelist',   secondaryArchetype: 'vanguard',  element: 'force', hp: 1350, attack: 140, attackSpd: 0.9,  range: 1, moveSpd: 1.8, maxMana: 0,  emoji: '\u{2694}\uFE0F\u{1F4AA}', evolvedForm: 'cosmic_titan' }
};

// =============================================================================
// EVOLVED TEMPLATES (60 evolved forms — all tiers evolve at 3★)
// Evolved forms inherit the same secondaryArchetype as their base form.
// =============================================================================

var EVOLVED_TEMPLATES = {
    // --- FIRE EVOLVED (6) ---
    fire_berserker:   { name: 'Fire Berserker',   baseCost: 1, type: 'warrior',  archetype: 'duelist',   secondaryArchetype: 'vanguard',  element: 'fire', hp: 750,  attack: 68,  attackSpd: 0.65, range: 1, moveSpd: 2.2, maxMana: 65, emoji: '\u{2694}\uFE0F\u{1F525}\u{2728}', ability: 'Enhanced Blade Inferno + Scorching Blows', baseKey: 'flame_warrior' },
    flame_rogue:      { name: 'Flame Rogue',      baseCost: 1, type: 'assassin', archetype: 'predator',  secondaryArchetype: 'duelist',   element: 'fire', hp: 490,  attack: 60,  attackSpd: 0.40, range: 1, moveSpd: 4.5, maxMana: 45, emoji: '\u{1F5E1}\uFE0F\u{1F525}\u{2728}', ability: 'Phantom Blaze + First Blood Enhanced', baseKey: 'ember_scout' },
    cinder_marksman:  { name: 'Cinder Marksman',  baseCost: 1, type: 'archer',   archetype: 'ranger',    secondaryArchetype: 'sorcerer',  element: 'fire', hp: 430,  attack: 68,  attackSpd: 0.60, range: 5, moveSpd: 2.2, maxMana: 55, emoji: '\u{1F3F9}\u{1F525}\u{2728}', ability: 'Fire Barrage + Ignition Amplified', baseKey: 'cinder_archer' },
    ember_saint:      { name: 'Ember Saint',      baseCost: 1, type: 'healer',   archetype: 'sage',      secondaryArchetype: 'guardian',  element: 'fire', hp: 520,  attack: 36,  attackSpd: 1.0,  range: 3, moveSpd: 1.8, maxMana: 70, emoji: '\u{1F49A}\u{1F525}\u{2728}', ability: 'Holy Inferno + Cauterize Aura', baseKey: 'fire_acolyte' },
    volcano_titan:    { name: 'Volcano Titan',    baseCost: 2, type: 'tank',     archetype: 'guardian',  secondaryArchetype: 'warden',    element: 'fire', hp: 1100, attack: 46,  attackSpd: 0.95, range: 1, moveSpd: 1.6, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{1F525}\u{2728}', ability: 'Volcanic Eruption + Molten Armor Enhanced', baseKey: 'magma_knight' },
    inferno_lancer:   { name: 'Inferno Lancer',   baseCost: 2, type: 'warrior',  archetype: 'vanguard',  secondaryArchetype: 'predator',  element: 'fire', hp: 900,  attack: 72,  attackSpd: 0.60, range: 1, moveSpd: 2.3, maxMana: 60, emoji: '\u{2694}\uFE0F\u{1F525}\u{2728}', ability: 'Inferno Lance + Momentum Mastery', baseKey: 'blaze_lancer' },

    // --- WATER EVOLVED (6) ---
    tsunami_blade:    { name: 'Tsunami Blade',    baseCost: 1, type: 'warrior',  archetype: 'vanguard',  secondaryArchetype: 'warden',    element: 'water', hp: 800,  attack: 64,  attackSpd: 0.60, range: 1, moveSpd: 2.1, maxMana: 60, emoji: '\u{2694}\uFE0F\u{1F4A7}\u{2728}', ability: 'Tsunami Slash + Undertow Enhanced', baseKey: 'tide_hunter' },
    ice_sniper:       { name: 'Ice Sniper',       baseCost: 1, type: 'archer',   archetype: 'ranger',    secondaryArchetype: 'mystic',    element: 'water', hp: 430,  attack: 65,  attackSpd: 0.60, range: 5, moveSpd: 2.2, maxMana: 50, emoji: '\u{1F3F9}\u{1F4A7}\u{2728}', ability: 'Frozen Barrage + Chill Amplified', baseKey: 'frost_archer' },
    tidal_phantom:    { name: 'Tidal Phantom',    baseCost: 1, type: 'assassin', archetype: 'predator',  secondaryArchetype: 'duelist',   element: 'water', hp: 500,  attack: 58,  attackSpd: 0.40, range: 1, moveSpd: 4.4, maxMana: 40, emoji: '\u{1F5E1}\uFE0F\u{1F4A7}\u{2728}', ability: 'Phantom Strike + Slippery Enhanced', baseKey: 'reef_stalker' },
    ocean_sage:       { name: 'Ocean Sage',       baseCost: 2, type: 'healer',   archetype: 'sage',      secondaryArchetype: 'ranger',    element: 'water', hp: 560,  attack: 40,  attackSpd: 1.0,  range: 3, moveSpd: 1.7, maxMana: 75, emoji: '\u{1F49A}\u{1F4A7}\u{2728}', ability: 'Ocean\'s Blessing + Soothing Mists Enhanced', baseKey: 'coral_priest' },
    abyssal_mage:     { name: 'Abyssal Mage',     baseCost: 2, type: 'mage',     archetype: 'sorcerer',  secondaryArchetype: 'ranger',    element: 'water', hp: 500,  attack: 80,  attackSpd: 0.85, range: 4, moveSpd: 1.5, maxMana: 70, emoji: '\u{1F52E}\u{1F4A7}\u{2728}', ability: 'Abyssal Bolt + Torrent Amplified', baseKey: 'hydro_mage' },
    armored_sentinel: { name: 'Armored Sentinel', baseCost: 2, type: 'tank',     archetype: 'guardian',  secondaryArchetype: 'sage',      element: 'water', hp: 1125, attack: 42,  attackSpd: 0.95, range: 1, moveSpd: 1.5, maxMana: 80, emoji: '\u{1F6E1}\uFE0F\u{1F4A7}\u{2728}', ability: 'Fortress Stance + Shell Defense Enhanced', baseKey: 'shell_knight' },

    // --- EARTH EVOLVED (6) ---
    mountain_lord:    { name: 'Mountain Lord',    baseCost: 1, type: 'tank',     archetype: 'guardian',  secondaryArchetype: 'vanguard',  element: 'earth', hp: 940,  attack: 42,  attackSpd: 0.95, range: 1, moveSpd: 1.5, maxMana: 80, emoji: '\u{1F6E1}\uFE0F\u{1F33F}\u{2728}', ability: 'Mountain Barrier + Fortify Enhanced', baseKey: 'stone_guard' },
    ironwood_sentinel:{ name: 'Ironwood Sentinel',baseCost: 1, type: 'warrior',  archetype: 'vanguard',  secondaryArchetype: 'guardian',  element: 'earth', hp: 800,  attack: 65,  attackSpd: 0.65, range: 1, moveSpd: 2.1, maxMana: 65, emoji: '\u{2694}\uFE0F\u{1F33F}\u{2728}', ability: 'Ironwood Bash + Thorns Enhanced', baseKey: 'bramble_knight' },
    thornwood_ranger: { name: 'Thornwood Ranger', baseCost: 1, type: 'archer',   archetype: 'ranger',    secondaryArchetype: 'warden',    element: 'earth', hp: 430,  attack: 62,  attackSpd: 0.60, range: 4, moveSpd: 2.2, maxMana: 55, emoji: '\u{1F3F9}\u{1F33F}\u{2728}', ability: 'Thorn Shot + Overgrowth Enhanced', baseKey: 'seedling_archer' },
    gaia_priest:      { name: 'Gaia Priest',      baseCost: 2, type: 'healer',   archetype: 'sage',      secondaryArchetype: 'mystic',    element: 'earth', hp: 560,  attack: 42,  attackSpd: 1.0,  range: 3, moveSpd: 1.7, maxMana: 75, emoji: '\u{1F49A}\u{1F33F}\u{2728}', ability: 'Gaia\'s Blessing + Grounding Enhanced', baseKey: 'earth_shaman' },
    geomancer:        { name: 'Geomancer',        baseCost: 2, type: 'mage',     archetype: 'guardian',  secondaryArchetype: 'sorcerer',  element: 'earth', hp: 625,  attack: 80,  attackSpd: 0.85, range: 4, moveSpd: 1.6, maxMana: 70, emoji: '\u{1F52E}\u{1F33F}\u{2728}', ability: 'Crystal Barrage + Crystal Shell Enhanced', baseKey: 'crystal_mage' },
    quake_reaper:     { name: 'Quake Reaper',     baseCost: 2, type: 'assassin', archetype: 'predator',  secondaryArchetype: 'duelist',   element: 'earth', hp: 525,  attack: 62,  attackSpd: 0.40, range: 1, moveSpd: 3.7, maxMana: 45, emoji: '\u{1F5E1}\uFE0F\u{1F33F}\u{2728}', ability: 'Earthquake Strike + Burrow Enhanced', baseKey: 'mud_stalker' },

    // --- WIND EVOLVED (6) ---
    storm_assassin:   { name: 'Storm Assassin',   baseCost: 1, type: 'assassin', archetype: 'predator',  secondaryArchetype: 'duelist',   element: 'wind', hp: 495,  attack: 60,  attackSpd: 0.40, range: 1, moveSpd: 4.6, maxMana: 45, emoji: '\u{1F5E1}\uFE0F\u{1F4A8}\u{2728}', ability: 'Storm Slash + Windwalk Enhanced', baseKey: 'zephyr_scout' },
    gale_sniper:      { name: 'Gale Sniper',      baseCost: 1, type: 'archer',   archetype: 'ranger',    secondaryArchetype: 'predator',  element: 'wind', hp: 430,  attack: 68,  attackSpd: 0.60, range: 5, moveSpd: 2.3, maxMana: 55, emoji: '\u{1F3F9}\u{1F4A8}\u{2728}', ability: 'Gale Barrage + Tailwind Enhanced', baseKey: 'wind_archer' },
    stormweaver:      { name: 'Stormweaver',      baseCost: 1, type: 'healer',   archetype: 'sage',      secondaryArchetype: 'ranger',    element: 'wind', hp: 520,  attack: 38,  attackSpd: 1.0,  range: 3, moveSpd: 2.5, maxMana: 75, emoji: '\u{1F49A}\u{1F4A8}\u{2728}', ability: 'Storm Breeze + Zephyr\'s Grace Enhanced', baseKey: 'gale_dancer' },
    zephyr_warrior:   { name: 'Zephyr Warrior',   baseCost: 1, type: 'warrior',  archetype: 'vanguard',  secondaryArchetype: 'duelist',   element: 'wind', hp: 750,  attack: 65,  attackSpd: 0.60, range: 1, moveSpd: 2.2, maxMana: 60, emoji: '\u{2694}\uFE0F\u{1F4A8}\u{2728}', ability: 'Zephyr Slash + Momentum Enhanced', baseKey: 'wind_squire' },
    aegis_paladin:    { name: 'Aegis Paladin',    baseCost: 2, type: 'warrior',  archetype: 'warden',    secondaryArchetype: 'guardian',  element: 'wind', hp: 850,  attack: 68,  attackSpd: 0.65, range: 1, moveSpd: 2.2, maxMana: 65, emoji: '\u{2694}\uFE0F\u{1F4A8}\u{2728}', ability: 'Divine Guard + Inspiring Presence Enhanced', baseKey: 'sky_knight' },
    tempest_guardian: { name: 'Tempest Guardian', baseCost: 2, type: 'tank',     archetype: 'guardian',  secondaryArchetype: 'warden',    element: 'wind', hp: 1060, attack: 42,  attackSpd: 0.95, range: 1, moveSpd: 1.7, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{1F4A8}\u{2728}', ability: 'Tempest Guard + Deflection Enhanced', baseKey: 'gust_sentinel' },

    // --- LIGHTNING EVOLVED (6) ---
    arc_duelist:      { name: 'Arc Duelist',      baseCost: 1, type: 'warrior',  archetype: 'duelist',   secondaryArchetype: 'sorcerer',  element: 'lightning', hp: 775,  attack: 68,  attackSpd: 0.65, range: 1, moveSpd: 2.2, maxMana: 65, emoji: '\u{2694}\uFE0F\u{26A1}\u{2728}', ability: 'Arc Slash + Static Charge Enhanced', baseKey: 'spark_fencer' },
    lightning_phantom:{ name: 'Lightning Phantom',baseCost: 1, type: 'assassin', archetype: 'predator',  secondaryArchetype: 'vanguard',  element: 'lightning', hp: 500,  attack: 58,  attackSpd: 0.40, range: 1, moveSpd: 4.6, maxMana: 45, emoji: '\u{1F5E1}\uFE0F\u{26A1}\u{2728}', ability: 'Lightning Dash + Dash Chain Enhanced', baseKey: 'volt_runner' },
    storm_archer:     { name: 'Storm Archer',     baseCost: 1, type: 'archer',   archetype: 'ranger',    secondaryArchetype: 'mystic',    element: 'lightning', hp: 430,  attack: 68,  attackSpd: 0.60, range: 5, moveSpd: 2.2, maxMana: 55, emoji: '\u{1F3F9}\u{26A1}\u{2728}', ability: 'Storm Arrow + Charged Shot Enhanced', baseKey: 'thunder_archer' },
    storm_medic:      { name: 'Storm Medic',      baseCost: 1, type: 'healer',   archetype: 'sage',      secondaryArchetype: 'ranger',    element: 'lightning', hp: 535,  attack: 36,  attackSpd: 1.0,  range: 3, moveSpd: 1.8, maxMana: 75, emoji: '\u{1F49A}\u{26A1}\u{2728}', ability: 'Storm Pulse + Defibrillator Enhanced', baseKey: 'pulse_mender' },
    storm_bastion:    { name: 'Storm Bastion',    baseCost: 2, type: 'tank',     archetype: 'guardian',  secondaryArchetype: 'warden',    element: 'lightning', hp: 1125, attack: 46,  attackSpd: 0.95, range: 1, moveSpd: 1.6, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{26A1}\u{2728}', ability: 'Storm Barrier + Lightning Conductor Enhanced', baseKey: 'tesla_knight' },
    tempest_mage:     { name: 'Tempest Mage',     baseCost: 2, type: 'mage',     archetype: 'sorcerer',  secondaryArchetype: 'ranger',    element: 'lightning', hp: 525,  attack: 84,  attackSpd: 0.85, range: 4, moveSpd: 1.6, maxMana: 75, emoji: '\u{1F52E}\u{26A1}\u{2728}', ability: 'Tempest Lightning + Electrocution Enhanced', baseKey: 'shock_mage' },

    // --- FORCE EVOLVED (6) ---
    legionnaire:      { name: 'Legionnaire',      baseCost: 1, type: 'warrior',  archetype: 'vanguard',  secondaryArchetype: 'sage',      element: 'force', hp: 790,  attack: 70,  attackSpd: 0.65, range: 1, moveSpd: 2.2, maxMana: 65, emoji: '\u{2694}\uFE0F\u{1F4AA}\u{2728}', ability: 'Legion Strike + Iron Skin Enhanced', baseKey: 'iron_soldier' },
    night_stalker:    { name: 'Night Stalker',    baseCost: 1, type: 'assassin', archetype: 'predator',  secondaryArchetype: 'duelist',   element: 'force', hp: 510,  attack: 62,  attackSpd: 0.40, range: 1, moveSpd: 4.5, maxMana: 45, emoji: '\u{1F5E1}\uFE0F\u{1F4AA}\u{2728}', ability: 'Assassination + Shadow Step Enhanced', baseKey: 'shadow_blade' },
    ballista_archer:  { name: 'Ballista Archer',  baseCost: 1, type: 'archer',   archetype: 'ranger',    secondaryArchetype: 'predator',  element: 'force', hp: 440,  attack: 65,  attackSpd: 0.60, range: 5, moveSpd: 2.2, maxMana: 55, emoji: '\u{1F3F9}\u{1F4AA}\u{2728}', ability: 'Ballista Shot + Steady Aim Enhanced', baseKey: 'steel_archer' },
    battle_priest:    { name: 'Battle Priest',    baseCost: 2, type: 'healer',   archetype: 'sage',      secondaryArchetype: 'vanguard',  element: 'force', hp: 575,  attack: 42,  attackSpd: 1.0,  range: 3, moveSpd: 1.8, maxMana: 75, emoji: '\u{1F49A}\u{1F4AA}\u{2728}', ability: 'Holy Wrath + War Prayer Enhanced', baseKey: 'war_cleric' },
    force_archmage:   { name: 'Force Archmage',   baseCost: 2, type: 'mage',     archetype: 'sorcerer',  secondaryArchetype: 'warden',    element: 'force', hp: 525,  attack: 88,  attackSpd: 0.85, range: 4, moveSpd: 1.6, maxMana: 75, emoji: '\u{1F52E}\u{1F4AA}\u{2728}', ability: 'Force Blast + Telekinetic Force Enhanced', baseKey: 'battle_mage' },
    bastion:          { name: 'Bastion',          baseCost: 2, type: 'tank',     archetype: 'guardian',  secondaryArchetype: 'sage',      element: 'force', hp: 1150, attack: 42,  attackSpd: 0.95, range: 1, moveSpd: 1.6, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{1F4AA}\u{2728}', ability: 'Fortress Wall + Fortified Defense Enhanced', baseKey: 'shield_bearer' },

    // --- FIRE T3-T5 EVOLVED (4) ---
    arcane_inferno:      { name: 'Arcane Inferno',      baseCost: 3, type: 'mage',     archetype: 'sorcerer',  secondaryArchetype: 'mystic',    element: 'fire', hp: 520,  attack: 75,  attackSpd: 0.9,  range: 3, moveSpd: 1.5, maxMana: 65, emoji: '\u{1F52E}\u{1F525}\u{2728}', ability: 'Infernal Storm Enhanced + Pyromaniac Enhanced', baseKey: 'pyromancer' },
    ninetail_blaze:      { name: 'Ninetail Blaze',      baseCost: 3, type: 'assassin', archetype: 'mystic',    secondaryArchetype: 'predator',  element: 'fire', hp: 480,  attack: 72,  attackSpd: 0.5,  range: 1, moveSpd: 3.8, maxMana: 50, emoji: '\u{1F5E1}\uFE0F\u{1F525}\u{2728}', ability: 'Spirit Rush Enhanced + Foxfire Enhanced', baseKey: 'inferno_fox' },
    elder_wyrm:          { name: 'Elder Wyrm',          baseCost: 4, type: 'mage',     archetype: 'warden',    secondaryArchetype: 'sorcerer',  element: 'fire', hp: 1100, attack: 95,  attackSpd: 0.9,  range: 3, moveSpd: 1.5, maxMana: 80, emoji: '\u{1F52E}\u{1F525}\u{2728}', ability: 'Breath Weapon Enhanced + Dragonfire Aura Enhanced', baseKey: 'fire_dragon' },
    eternal_phoenix:     { name: 'Eternal Phoenix',     baseCost: 5, type: 'mage',     archetype: 'mystic',    secondaryArchetype: 'sage',      element: 'fire', hp: 950,  attack: 110, attackSpd: 0.95, range: 3, moveSpd: 1.6, maxMana: 0,  emoji: '\u{1F52E}\u{1F525}\u{2728}', ability: 'Rebirth Enhanced + Eternal Flame Enhanced', baseKey: 'phoenix' },

    // --- WATER T3-T5 EVOLVED (4) ---
    stormtide_oracle:    { name: 'Stormtide Oracle',    baseCost: 3, type: 'healer',   archetype: 'mystic',    secondaryArchetype: 'sage',      element: 'water', hp: 480,  attack: 45,  attackSpd: 1.1,  range: 2.5, moveSpd: 1.6, maxMana: 80, emoji: '\u{1F49A}\u{1F4A7}\u{2728}', ability: 'Tidal Surge + Scepter of Tides Enhanced', baseKey: 'tidal_shaman' },
    tsunami_warlord:     { name: 'Tsunami Warlord',     baseCost: 3, type: 'warrior',  archetype: 'duelist',   secondaryArchetype: 'vanguard',  element: 'water', hp: 620,  attack: 70,  attackSpd: 0.8,  range: 1, moveSpd: 1.8, maxMana: 65, emoji: '\u{2694}\uFE0F\u{1F4A7}\u{2728}', ability: 'Maelstrom Spin + Current Enhanced', baseKey: 'riptide_blade' },
    abyssal_terror:      { name: 'Abyssal Terror',      baseCost: 4, type: 'mage',     archetype: 'warden',    secondaryArchetype: 'sorcerer',  element: 'water', hp: 920,  attack: 98,  attackSpd: 0.9,  range: 3, moveSpd: 1.3, maxMana: 85, emoji: '\u{1F52E}\u{1F4A7}\u{2728}', ability: 'Maelstrom Enhanced + Ink Cloud Enhanced', baseKey: 'kraken' },
    primordial_leviathan:{ name: 'Primordial Leviathan',baseCost: 5, type: 'tank',     archetype: 'guardian',  secondaryArchetype: 'warden',    element: 'water', hp: 1450, attack: 35,  attackSpd: 1.0,  range: 1, moveSpd: 1.2, maxMana: 0,  emoji: '\u{1F6E1}\uFE0F\u{1F4A7}\u{2728}', ability: 'Tidal Guardian Enhanced + Abyssal Depths Enhanced', baseKey: 'leviathan' },

    // --- EARTH T3-T5 EVOLVED (4) ---
    iron_colossus:       { name: 'Iron Colossus',       baseCost: 3, type: 'tank',     archetype: 'warden',    secondaryArchetype: 'guardian',   element: 'earth', hp: 1050, attack: 42,  attackSpd: 1.0,  range: 1, moveSpd: 1.2, maxMana: 90, emoji: '\u{1F6E1}\uFE0F\u{1F33F}\u{2728}', ability: 'Ground Slam Enhanced + Immovable Enhanced', baseKey: 'golem' },
    earthweaver:         { name: 'Earthweaver',         baseCost: 3, type: 'mage',     archetype: 'sorcerer',  secondaryArchetype: 'ranger',    element: 'earth', hp: 440,  attack: 70,  attackSpd: 0.9,  range: 3, moveSpd: 1.5, maxMana: 75, emoji: '\u{1F52E}\u{1F33F}\u{2728}', ability: 'Earthen Barrage + Living Earth Enhanced', baseKey: 'terra_sage' },
    world_sentinel:      { name: 'World Sentinel',      baseCost: 4, type: 'warrior',  archetype: 'duelist',   secondaryArchetype: 'warden',    element: 'earth', hp: 1200, attack: 70,  attackSpd: 0.9,  range: 1, moveSpd: 1.2, maxMana: 80, emoji: '\u{2694}\uFE0F\u{1F33F}\u{2728}', ability: 'Nature\'s Wrath + Deep Roots Enhanced', baseKey: 'ancient_treant' },
    yggdrasil:           { name: 'Yggdrasil',           baseCost: 5, type: 'healer',   archetype: 'sage',      secondaryArchetype: 'guardian',  element: 'earth', hp: 1300, attack: 28,  attackSpd: 1.2,  range: 3, moveSpd: 1.3, maxMana: 0,  emoji: '\u{1F49A}\u{1F33F}\u{2728}', ability: 'Bloom of Life Enhanced + Roots of Life Enhanced', baseKey: 'world_tree' },

    // --- WIND T3-T5 EVOLVED (4) ---
    tempest_lord:        { name: 'Tempest Lord',        baseCost: 3, type: 'mage',     archetype: 'sorcerer',  secondaryArchetype: 'mystic',    element: 'wind', hp: 420,  attack: 78,  attackSpd: 0.9,  range: 3, moveSpd: 1.8, maxMana: 70, emoji: '\u{1F52E}\u{1F4A8}\u{2728}', ability: 'Tornado Enhanced + Updraft Enhanced', baseKey: 'monsoon_caller' },
    hurricane_blade:     { name: 'Hurricane Blade',     baseCost: 3, type: 'warrior',  archetype: 'duelist',   secondaryArchetype: 'predator',  element: 'wind', hp: 620,  attack: 68,  attackSpd: 0.8,  range: 1, moveSpd: 2.0, maxMana: 60, emoji: '\u{2694}\uFE0F\u{1F4A8}\u{2728}', ability: 'Cyclone Slash + Dance of Blades Enhanced', baseKey: 'wind_duelist' },
    tempest_emperor:     { name: 'Tempest Emperor',     baseCost: 4, type: 'assassin', archetype: 'predator',  secondaryArchetype: 'vanguard',  element: 'wind', hp: 740,  attack: 100, attackSpd: 0.45, range: 1, moveSpd: 4.2, maxMana: 55, emoji: '\u{1F5E1}\uFE0F\u{1F4A8}\u{2728}', ability: 'Thunder Cleave + Lightning Speed Enhanced', baseKey: 'storm_sovereign' },
    dimensional_dragon:  { name: 'Dimensional Dragon',  baseCost: 5, type: 'mage',     archetype: 'mystic',    secondaryArchetype: 'sorcerer',  element: 'wind', hp: 820,  attack: 125, attackSpd: 0.7,  range: 4, moveSpd: 2.1, maxMana: 0,  emoji: '\u{1F52E}\u{1F4A8}\u{2728}', ability: 'Dimensional Rift Enhanced + Reality Warp Enhanced', baseKey: 'void_wyrm' },

    // --- LIGHTNING T3-T5 EVOLVED (4) ---
    plasma_core:         { name: 'Plasma Core',         baseCost: 3, type: 'mage',     archetype: 'mystic',    secondaryArchetype: 'sorcerer',  element: 'lightning', hp: 480,  attack: 75,  attackSpd: 0.9,  range: 3, moveSpd: 1.6, maxMana: 70, emoji: '\u{1F52E}\u{26A1}\u{2728}', ability: 'Sphere Summoning + Rolling Thunder Enhanced', baseKey: 'ball_lightning' },
    storm_fortress:      { name: 'Storm Fortress',      baseCost: 3, type: 'tank',     archetype: 'warden',    secondaryArchetype: 'guardian',  element: 'lightning', hp: 1000, attack: 45,  attackSpd: 1.0,  range: 1, moveSpd: 1.3, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{26A1}\u{2728}', ability: 'Lightning Prison Enhanced + Overcharge Enhanced', baseKey: 'thunder_warden' },
    roc_of_storms:       { name: 'Roc of Storms',       baseCost: 4, type: 'warrior',  archetype: 'vanguard',  secondaryArchetype: 'predator',  element: 'lightning', hp: 820,  attack: 88,  attackSpd: 0.8,  range: 1, moveSpd: 2.2, maxMana: 70, emoji: '\u{2694}\uFE0F\u{26A1}\u{2728}', ability: 'Lightning Descent Enhanced + Aerial Superiority Enhanced', baseKey: 'thunderbird' },
    thunder_god:         { name: 'Thunder God',         baseCost: 5, type: 'mage',     archetype: 'sorcerer',  secondaryArchetype: 'mystic',    element: 'lightning', hp: 1000, attack: 130, attackSpd: 0.95, range: 3, moveSpd: 1.7, maxMana: 0,  emoji: '\u{1F52E}\u{26A1}\u{2728}', ability: 'Cataclysmic Storm Enhanced + Superconductor Enhanced', baseKey: 'storm_dragon' },

    // --- FORCE T3-T5 EVOLVED (4) ---
    champion:            { name: 'Champion',            baseCost: 3, type: 'warrior',  archetype: 'duelist',   secondaryArchetype: 'vanguard',  element: 'force', hp: 650,  attack: 80,  attackSpd: 0.8,  range: 1, moveSpd: 1.9, maxMana: 60, emoji: '\u{2694}\uFE0F\u{1F4AA}\u{2728}', ability: 'Brutal Strike Enhanced + Arena Master Enhanced', baseKey: 'gladiator' },
    citadel:             { name: 'Citadel',             baseCost: 3, type: 'tank',     archetype: 'warden',    secondaryArchetype: 'guardian',  element: 'force', hp: 1100, attack: 40,  attackSpd: 1.0,  range: 1, moveSpd: 1.2, maxMana: 85, emoji: '\u{1F6E1}\uFE0F\u{1F4AA}\u{2728}', ability: 'Defensive Stance Enhanced + Unbreakable Will Enhanced', baseKey: 'fortress' },
    war_architect:       { name: 'War Architect',       baseCost: 4, type: 'mage',     archetype: 'mystic',    secondaryArchetype: 'ranger',    element: 'force', hp: 520,  attack: 92,  attackSpd: 0.9,  range: 3, moveSpd: 1.5, maxMana: 75, emoji: '\u{1F52E}\u{1F4AA}\u{2728}', ability: 'Artillery Strike Enhanced + War Machine Enhanced', baseKey: 'siege_engineer' },
    cosmic_titan:        { name: 'Cosmic Titan',        baseCost: 5, type: 'warrior',  archetype: 'duelist',   secondaryArchetype: 'vanguard',  element: 'force', hp: 1350, attack: 140, attackSpd: 0.9,  range: 1, moveSpd: 1.8, maxMana: 0,  emoji: '\u{2694}\uFE0F\u{1F4AA}\u{2728}', ability: 'Earthshaker Enhanced + Colossus Enhanced', baseKey: 'titan_lord' }
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

// SHOP_POOL_KEYS — defined after UNIT_TEMPLATES exists
var SHOP_POOL_KEYS = Object.keys(UNIT_TEMPLATES);

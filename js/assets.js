// =============================================================================
// assets.js -- Phase 5.6 (Prompt 83): art asset URL helpers.
//
// getPortraitUrl(key) resolves a unit/hero/boss key to its portrait image
// path; getBackgroundUrl(regionNumOrCamp) resolves a story region number (or
// the literal 'camp') to its background image path. Both are pure string
// builders -- neither one touches the filesystem or the network, and neither
// one guarantees the file actually exists on disk. Every call site (UI HTML
// strings via <img onerror>, CSS background-image, js/render-pixi.js's
// PIXI.Assets.load()) is responsible for its own graceful fallback to the
// pre-existing placeholder when the returned URL 404s -- that is the "iron
// rule" this prompt's spec calls out, and it is enforced at each render call
// site, not here.
//
// getPortraitUrl() resolves structurally off the data layer (UNIT_TEMPLATES/
// EVOLVED_TEMPLATES/HERO_DATA/BOSS_DATA), never off PORTRAIT_KEYS below --
// that keeps it correct even if a future unit/hero/boss is added before its
// art lands (it simply resolves to a URL that 404s, which every caller
// already tolerates). PORTRAIT_KEYS exists purely as a hand-maintained
// manifest of the 84 files actually committed under assets/portraits/ as of
// Prompt 83 (66 base units, unprefixed; 6 hero_<key>; 12 boss_<key>), for
// tests/test-assets.js's "manifest entries are well-formed keys that exist
// in the data layer" checks. No fs access at runtime (browser script, no
// build step) -- this list is a snapshot, not a scan.
// =============================================================================

var PORTRAIT_KEYS = [
    'abyssal_guardian', 'ancient_treant', 'ashen_watcher', 'ball_lightning', 'battle_mage',
    'blaze_lancer', 'bramble_knight', 'cinder_archer', 'coral_priest', 'crystal_mage',
    'earth_shaman', 'ember_scout', 'fire_acolyte', 'fire_dragon', 'flame_warrior',
    'fortress', 'frost_archer', 'gale_dancer', 'gladiator', 'golem',
    'grove_warden', 'gust_sentinel', 'hydro_mage', 'inferno_fox', 'iron_duelist',
    'iron_soldier', 'kraken', 'leviathan', 'magma_knight', 'monsoon_caller',
    'mud_stalker', 'phoenix', 'pulse_mender', 'pyromancer', 'reef_stalker',
    'riptide_blade', 'seedling_archer', 'shadow_blade', 'shell_knight', 'shield_bearer',
    'shock_mage', 'siege_engineer', 'sky_knight', 'spark_fencer', 'steel_archer',
    'stone_guard', 'storm_dragon', 'storm_sovereign', 'tempest_weaver', 'terra_sage',
    'tesla_knight', 'thunderbird', 'thunder_archer', 'thunder_warden', 'tidal_shaman',
    'tide_hunter', 'titan_lord', 'void_wyrm', 'voltfang_stalker', 'volt_runner',
    'war_cleric', 'wind_archer', 'wind_duelist', 'wind_squire', 'world_tree', 'zephyr_scout',
    'hero_kael', 'hero_lyric', 'hero_maren', 'hero_ren', 'hero_sera', 'hero_voss',
    'boss_arbiter_of_trials', 'boss_archon', 'boss_elemental_chimera', 'boss_infernal_wyvern',
    'boss_prismatic_sentinel', 'boss_shattered_colossus', 'boss_stone_colossus',
    'boss_storm_phoenix', 'boss_tidal_leviathan', 'boss_twin_heralds', 'boss_veil_warden',
    'boss_void_sovereign'
];

// Resolves any unit template key (base or evolved), hero key, or boss key to
// its portrait URL. Evolved units have no art of their own -- they reuse the
// base unit's file via EVOLVED_TEMPLATES[key].baseKey (the existing gold-ring
// treatment on top of that shared portrait is presentation the call sites
// already own, e.g. js/ui-roster.js's p79-evolved card border). Returns null
// for anything unresolvable (unknown key, or an evolved entry missing its
// baseKey back-reference) -- callers must treat null exactly like a 404.
function getPortraitUrl(key) {
    if (!key) return null;
    if (typeof UNIT_TEMPLATES !== 'undefined' && UNIT_TEMPLATES[key]) {
        return 'assets/portraits/' + key + '.webp';
    }
    if (typeof EVOLVED_TEMPLATES !== 'undefined' && EVOLVED_TEMPLATES[key]) {
        var baseKey = EVOLVED_TEMPLATES[key].baseKey;
        return baseKey ? 'assets/portraits/' + baseKey + '.webp' : null;
    }
    if (typeof HERO_DATA !== 'undefined' && HERO_DATA[key]) {
        return 'assets/portraits/hero_' + key + '.webp';
    }
    if (typeof BOSS_DATA !== 'undefined' && BOSS_DATA[key]) {
        return 'assets/portraits/boss_' + key + '.webp';
    }
    return null;
}

// regionNumOrCamp: 1-8 (story region number, matches ARENA_BACKDROP_THEMES'
// keys) or the literal string 'camp'. Anything else (0/null/undefined --
// endless/challenge/grind's "no region context" per js/ui-combat.js's
// buildArenaBackdrop) returns null; callers that want region8's art as the
// neutral-theme fallback (per the Prompt 83 spec) pass 8 explicitly rather
// than relying on this function to guess.
function getBackgroundUrl(regionNumOrCamp) {
    if (regionNumOrCamp === 'camp') return 'assets/backgrounds/camp.webp';
    var n = parseInt(regionNumOrCamp, 10);
    if (n >= 1 && n <= 8) return 'assets/backgrounds/region' + n + '.webp';
    return null;
}

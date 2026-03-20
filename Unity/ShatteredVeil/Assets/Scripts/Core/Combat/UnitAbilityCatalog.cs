using System.Collections.Generic;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Registry of all 132 unit ability functions. In v2, abilities dispatch
    /// by unit ID directly (not by template name). Each unit has a unique ability.
    /// Stub implementation — full ability logic will be added in future prompts.
    /// </summary>
    public static class UnitAbilityCatalog
    {
        /// <summary>
        /// Returns a non-null ability entry if the unit ID is registered.
        /// Full implementation will return delegates/data for ability execution.
        /// </summary>
        public static object Get(string unitId)
        {
            if (string.IsNullOrEmpty(unitId)) return null;
            return RegisteredUnits.Contains(unitId) ? s_stub : null;
        }

        private static readonly object s_stub = new object();

        private static readonly HashSet<string> RegisteredUnits = new HashSet<string>
        {
            // --- FIRE BASE (11) ---
            "flame_warrior", "ember_scout", "cinder_archer", "fire_acolyte",
            "magma_knight", "blaze_lancer", "pyromancer", "inferno_fox",
            "fire_dragon", "ashen_watcher", "phoenix",
            // --- FIRE EVOLVED (11) ---
            "fire_berserker", "flame_rogue", "cinder_marksman", "ember_saint",
            "volcano_titan", "inferno_lancer", "arcane_inferno", "ninetail_blaze",
            "elder_wyrm", "phoenix_priest", "eternal_phoenix",

            // --- WATER BASE (11) ---
            "tide_hunter", "frost_archer", "reef_stalker", "coral_priest",
            "hydro_mage", "shell_knight", "tidal_shaman", "riptide_blade",
            "kraken", "abyssal_guardian", "leviathan",
            // --- WATER EVOLVED (11) ---
            "tsunami_blade", "ice_sniper", "tidal_phantom", "ocean_sage",
            "abyssal_mage", "armored_sentinel", "stormtide_oracle", "tsunami_warlord",
            "abyssal_terror", "hadal_colossus", "primordial_leviathan",

            // --- EARTH BASE (11) ---
            "stone_guard", "bramble_knight", "seedling_archer", "earth_shaman",
            "crystal_mage", "mud_stalker", "golem", "terra_sage",
            "ancient_treant", "grove_warden", "world_tree",
            // --- EARTH EVOLVED (11) ---
            "mountain_lord", "ironwood_sentinel", "thornwood_ranger", "gaia_priest",
            "geomancer", "quake_reaper", "iron_colossus", "earthweaver",
            "world_sentinel", "worldroot_sentinel", "yggdrasil",

            // --- WIND BASE (11) ---
            "zephyr_scout", "wind_archer", "gale_dancer", "wind_squire",
            "sky_knight", "gust_sentinel", "monsoon_caller", "wind_duelist",
            "storm_sovereign", "tempest_weaver", "void_wyrm",
            // --- WIND EVOLVED (11) ---
            "storm_assassin", "gale_sniper", "stormweaver", "zephyr_warrior",
            "aegis_paladin", "tempest_guardian", "tempest_lord", "hurricane_blade",
            "tempest_emperor", "stormweft_oracle", "dimensional_dragon",

            // --- LIGHTNING BASE (11) ---
            "spark_fencer", "volt_runner", "thunder_archer", "pulse_mender",
            "tesla_knight", "shock_mage", "ball_lightning", "thunder_warden",
            "thunderbird", "voltfang_stalker", "storm_dragon",
            // --- LIGHTNING EVOLVED (11) ---
            "arc_duelist", "lightning_phantom", "storm_archer", "storm_medic",
            "storm_bastion", "tempest_mage", "plasma_core", "storm_fortress",
            "roc_of_storms", "plasma_ravager", "thunder_god",

            // --- FORCE BASE (11) ---
            "iron_soldier", "shadow_blade", "steel_archer", "war_cleric",
            "battle_mage", "shield_bearer", "gladiator", "fortress",
            "siege_engineer", "iron_duelist", "titan_lord",
            // --- FORCE EVOLVED (11) ---
            "legionnaire", "night_stalker", "ballista_archer", "battle_priest",
            "force_archmage", "bastion", "champion", "citadel",
            "war_architect", "warforged_champion", "cosmic_titan",
        };
    }
}

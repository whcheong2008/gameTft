using System.Collections.Generic;

namespace ShatteredVeil.Core
{
    public enum AssetCategory
    {
        UnitPortrait,
        CharacterPortrait,
        Icon,
        Background,
        BossSprite,
        VFX
    }

    public class AssetEntry
    {
        public string Id;
        public string Path;
        public AssetCategory Category;
        public int TargetSize;
        public bool HasRealAsset;

        public AssetEntry(string id, string path, AssetCategory category, int targetSize)
        {
            Id = id;
            Path = path;
            Category = category;
            TargetSize = targetSize;
            HasRealAsset = false;
        }
    }

    public static class AssetManifest
    {
        public static readonly AssetEntry[] AllAssets;

        private static Dictionary<string, AssetEntry> _byId;
        private static Dictionary<AssetCategory, AssetEntry[]> _byCategory;

        static AssetManifest()
        {
            var list = new List<AssetEntry>();
            AddUnitPortraits(list);
            AddCharacterPortraits(list);
            AddIcons(list);
            AddBackgrounds(list);
            AddBosses(list);
            AllAssets = list.ToArray();

            _byId = new Dictionary<string, AssetEntry>(AllAssets.Length);
            foreach (var entry in AllAssets)
                _byId[entry.Id] = entry;

            var catLists = new Dictionary<AssetCategory, List<AssetEntry>>();
            foreach (var entry in AllAssets)
            {
                if (!catLists.ContainsKey(entry.Category))
                    catLists[entry.Category] = new List<AssetEntry>();
                catLists[entry.Category].Add(entry);
            }
            _byCategory = new Dictionary<AssetCategory, AssetEntry[]>();
            foreach (var kvp in catLists)
                _byCategory[kvp.Key] = kvp.Value.ToArray();
        }

        // ----------------------------------------------------------------
        //  Query helpers
        // ----------------------------------------------------------------

        public static AssetEntry[] GetByCategory(AssetCategory cat)
        {
            return _byCategory.TryGetValue(cat, out var arr) ? arr : new AssetEntry[0];
        }

        public static AssetEntry GetById(string id)
        {
            return _byId.TryGetValue(id, out var entry) ? entry : null;
        }

        public static int UnitPortraitCount => GetByCategory(AssetCategory.UnitPortrait).Length;
        public static int CharacterPortraitCount => GetByCategory(AssetCategory.CharacterPortrait).Length;
        public static int IconCount => GetByCategory(AssetCategory.Icon).Length;
        public static int BackgroundCount => GetByCategory(AssetCategory.Background).Length;
        public static int BossCount => GetByCategory(AssetCategory.BossSprite).Length;

        // ----------------------------------------------------------------
        //  Unit Portraits (132 units = 22 per element x 6 elements)
        // ----------------------------------------------------------------

        private static void AddUnitPortraits(List<AssetEntry> list)
        {
            // --- Fire (22) ---
            AddUnit(list, "arcane_inferno", "Fire");
            AddUnit(list, "ashen_watcher", "Fire");
            AddUnit(list, "blaze_lancer", "Fire");
            AddUnit(list, "cinder_archer", "Fire");
            AddUnit(list, "cinder_marksman", "Fire");
            AddUnit(list, "elder_wyrm", "Fire");
            AddUnit(list, "ember_saint", "Fire");
            AddUnit(list, "ember_scout", "Fire");
            AddUnit(list, "eternal_phoenix", "Fire");
            AddUnit(list, "fire_acolyte", "Fire");
            AddUnit(list, "fire_berserker", "Fire");
            AddUnit(list, "fire_dragon", "Fire");
            AddUnit(list, "flame_rogue", "Fire");
            AddUnit(list, "flame_warrior", "Fire");
            AddUnit(list, "inferno_fox", "Fire");
            AddUnit(list, "inferno_lancer", "Fire");
            AddUnit(list, "magma_knight", "Fire");
            AddUnit(list, "ninetail_blaze", "Fire");
            AddUnit(list, "phoenix", "Fire");
            AddUnit(list, "phoenix_priest", "Fire");
            AddUnit(list, "pyromancer", "Fire");
            AddUnit(list, "volcano_titan", "Fire");

            // --- Water (22) ---
            AddUnit(list, "abyssal_guardian", "Water");
            AddUnit(list, "abyssal_mage", "Water");
            AddUnit(list, "abyssal_terror", "Water");
            AddUnit(list, "armored_sentinel", "Water");
            AddUnit(list, "coral_priest", "Water");
            AddUnit(list, "frost_archer", "Water");
            AddUnit(list, "hadal_colossus", "Water");
            AddUnit(list, "hydro_mage", "Water");
            AddUnit(list, "ice_sniper", "Water");
            AddUnit(list, "kraken", "Water");
            AddUnit(list, "leviathan", "Water");
            AddUnit(list, "ocean_sage", "Water");
            AddUnit(list, "primordial_leviathan", "Water");
            AddUnit(list, "reef_stalker", "Water");
            AddUnit(list, "riptide_blade", "Water");
            AddUnit(list, "shell_knight", "Water");
            AddUnit(list, "stormtide_oracle", "Water");
            AddUnit(list, "tidal_phantom", "Water");
            AddUnit(list, "tidal_shaman", "Water");
            AddUnit(list, "tide_hunter", "Water");
            AddUnit(list, "tsunami_blade", "Water");
            AddUnit(list, "tsunami_warlord", "Water");

            // --- Earth (22) ---
            AddUnit(list, "ancient_treant", "Earth");
            AddUnit(list, "bramble_knight", "Earth");
            AddUnit(list, "crystal_mage", "Earth");
            AddUnit(list, "earthweaver", "Earth");
            AddUnit(list, "earth_shaman", "Earth");
            AddUnit(list, "gaia_priest", "Earth");
            AddUnit(list, "geomancer", "Earth");
            AddUnit(list, "golem", "Earth");
            AddUnit(list, "grove_warden", "Earth");
            AddUnit(list, "ironwood_sentinel", "Earth");
            AddUnit(list, "iron_colossus", "Earth");
            AddUnit(list, "mountain_lord", "Earth");
            AddUnit(list, "mud_stalker", "Earth");
            AddUnit(list, "quake_reaper", "Earth");
            AddUnit(list, "seedling_archer", "Earth");
            AddUnit(list, "stone_guard", "Earth");
            AddUnit(list, "terra_sage", "Earth");
            AddUnit(list, "thornwood_ranger", "Earth");
            AddUnit(list, "worldroot_sentinel", "Earth");
            AddUnit(list, "world_sentinel", "Earth");
            AddUnit(list, "world_tree", "Earth");
            AddUnit(list, "yggdrasil", "Earth");

            // --- Wind (22) ---
            AddUnit(list, "aegis_paladin", "Wind");
            AddUnit(list, "dimensional_dragon", "Wind");
            AddUnit(list, "gale_dancer", "Wind");
            AddUnit(list, "gale_sniper", "Wind");
            AddUnit(list, "gust_sentinel", "Wind");
            AddUnit(list, "hurricane_blade", "Wind");
            AddUnit(list, "monsoon_caller", "Wind");
            AddUnit(list, "sky_knight", "Wind");
            AddUnit(list, "stormweaver", "Wind");
            AddUnit(list, "stormweft_oracle", "Wind");
            AddUnit(list, "storm_assassin", "Wind");
            AddUnit(list, "storm_sovereign", "Wind");
            AddUnit(list, "tempest_emperor", "Wind");
            AddUnit(list, "tempest_guardian", "Wind");
            AddUnit(list, "tempest_lord", "Wind");
            AddUnit(list, "tempest_weaver", "Wind");
            AddUnit(list, "void_wyrm", "Wind");
            AddUnit(list, "wind_archer", "Wind");
            AddUnit(list, "wind_duelist", "Wind");
            AddUnit(list, "wind_squire", "Wind");
            AddUnit(list, "zephyr_scout", "Wind");
            AddUnit(list, "zephyr_warrior", "Wind");

            // --- Lightning (22) ---
            AddUnit(list, "arc_duelist", "Lightning");
            AddUnit(list, "ball_lightning", "Lightning");
            AddUnit(list, "lightning_phantom", "Lightning");
            AddUnit(list, "plasma_core", "Lightning");
            AddUnit(list, "plasma_ravager", "Lightning");
            AddUnit(list, "pulse_mender", "Lightning");
            AddUnit(list, "roc_of_storms", "Lightning");
            AddUnit(list, "shock_mage", "Lightning");
            AddUnit(list, "spark_fencer", "Lightning");
            AddUnit(list, "storm_archer", "Lightning");
            AddUnit(list, "storm_bastion", "Lightning");
            AddUnit(list, "storm_dragon", "Lightning");
            AddUnit(list, "storm_fortress", "Lightning");
            AddUnit(list, "storm_medic", "Lightning");
            AddUnit(list, "tempest_mage", "Lightning");
            AddUnit(list, "tesla_knight", "Lightning");
            AddUnit(list, "thunderbird", "Lightning");
            AddUnit(list, "thunder_archer", "Lightning");
            AddUnit(list, "thunder_god", "Lightning");
            AddUnit(list, "thunder_warden", "Lightning");
            AddUnit(list, "voltfang_stalker", "Lightning");
            AddUnit(list, "volt_runner", "Lightning");

            // --- Force (22) ---
            AddUnit(list, "ballista_archer", "Force");
            AddUnit(list, "bastion", "Force");
            AddUnit(list, "battle_mage", "Force");
            AddUnit(list, "battle_priest", "Force");
            AddUnit(list, "champion", "Force");
            AddUnit(list, "citadel", "Force");
            AddUnit(list, "cosmic_titan", "Force");
            AddUnit(list, "force_archmage", "Force");
            AddUnit(list, "fortress", "Force");
            AddUnit(list, "gladiator", "Force");
            AddUnit(list, "iron_duelist", "Force");
            AddUnit(list, "iron_soldier", "Force");
            AddUnit(list, "legionnaire", "Force");
            AddUnit(list, "night_stalker", "Force");
            AddUnit(list, "shadow_blade", "Force");
            AddUnit(list, "shield_bearer", "Force");
            AddUnit(list, "siege_engineer", "Force");
            AddUnit(list, "steel_archer", "Force");
            AddUnit(list, "titan_lord", "Force");
            AddUnit(list, "warforged_champion", "Force");
            AddUnit(list, "war_architect", "Force");
            AddUnit(list, "war_cleric", "Force");
        }

        private static void AddUnit(List<AssetEntry> list, string unitId, string element)
        {
            list.Add(new AssetEntry(
                "unit_" + unitId,
                "Art/Units/Base/" + element + "/" + unitId,
                AssetCategory.UnitPortrait,
                256));
        }

        // ----------------------------------------------------------------
        //  Character Portraits (8 characters x 6 expressions = 48)
        // ----------------------------------------------------------------

        private static void AddCharacterPortraits(List<AssetEntry> list)
        {
            string[] characters = { "kael", "lyric", "senna", "otho", "maren", "mira", "torren", "dren" };
            string[] expressions = { "neutral", "angry", "sad", "happy", "shocked", "determined" };

            foreach (var character in characters)
            {
                foreach (var expression in expressions)
                {
                    list.Add(new AssetEntry(
                        "char_" + character + "_" + expression,
                        "Art/Characters/" + character + "/" + expression,
                        AssetCategory.CharacterPortrait,
                        512));
                }
            }
        }

        // ----------------------------------------------------------------
        //  Icons (6 element + 9 archetype + 5 rarity + 6 UI + 8 building = 34)
        // ----------------------------------------------------------------

        private static void AddIcons(List<AssetEntry> list)
        {
            // Element icons (6)
            string[] elements = { "fire", "water", "earth", "wind", "lightning", "force" };
            foreach (var el in elements)
            {
                list.Add(new AssetEntry(
                    "icon_element_" + el,
                    "Art/Icons/Elements/" + el,
                    AssetCategory.Icon,
                    64));
            }

            // Archetype icons (9)
            string[] archetypes = { "guardian", "warden", "vanguard", "duelist", "predator", "ranger", "sorcerer", "mystic", "sage" };
            foreach (var arch in archetypes)
            {
                list.Add(new AssetEntry(
                    "icon_archetype_" + arch,
                    "Art/Icons/Archetypes/" + arch,
                    AssetCategory.Icon,
                    64));
            }

            // Rarity icons (5)
            string[] rarities = { "common", "uncommon", "rare", "epic", "legendary" };
            foreach (var rarity in rarities)
            {
                list.Add(new AssetEntry(
                    "icon_rarity_" + rarity,
                    "Art/Icons/Items/rarity_" + rarity,
                    AssetCategory.Icon,
                    64));
            }

            // UI icons (6)
            string[] uiIcons = { "star_filled", "star_empty", "ve_currency", "xp_icon", "lock_icon", "back_arrow" };
            foreach (var name in uiIcons)
            {
                list.Add(new AssetEntry(
                    "icon_ui_" + name,
                    "Art/Icons/UI/" + name,
                    AssetCategory.Icon,
                    64));
            }

            // Building icons (8)
            string[] buildings =
            {
                "sustained_bonds", "attunement_rite", "essence_reservoir", "deep_resonance",
                "echo_shaping", "prism_focus", "veil_wellspring", "kindred_circle"
            };
            foreach (var bld in buildings)
            {
                list.Add(new AssetEntry(
                    "icon_building_" + bld,
                    "Art/Icons/Buildings/" + bld,
                    AssetCategory.Icon,
                    128));
            }
        }

        // ----------------------------------------------------------------
        //  Backgrounds (8 region + 1 combat + 3 UI = 12)
        // ----------------------------------------------------------------

        private static void AddBackgrounds(List<AssetEntry> list)
        {
            // Region backgrounds (8)
            string[] regionNames =
            {
                "the_frontier",
                "the_barracks_trials",
                "the_synergy_trials",
                "the_shattered_lands",
                "the_dual_convergence",
                "the_elemental_crucible",
                "the_proving_grounds",
                "the_abyss_gate"
            };
            for (int i = 0; i < regionNames.Length; i++)
            {
                int regionNum = i + 1;
                list.Add(new AssetEntry(
                    "bg_region_" + regionNum,
                    "Art/Backgrounds/Regions/region_" + regionNum + "_" + regionNames[i],
                    AssetCategory.Background,
                    1920));
            }

            // Combat grid background (1)
            list.Add(new AssetEntry(
                "bg_combat_grid",
                "Art/Backgrounds/Combat/default_grid",
                AssetCategory.Background,
                1920));

            // UI backgrounds (3)
            string[] uiBgs = { "main_menu", "hub_screen", "collection_screen" };
            foreach (var name in uiBgs)
            {
                list.Add(new AssetEntry(
                    "bg_ui_" + name,
                    "Art/Backgrounds/UI/" + name,
                    AssetCategory.Background,
                    1920));
            }
        }

        // ----------------------------------------------------------------
        //  Boss Sprites (8)
        // ----------------------------------------------------------------

        private static void AddBosses(List<AssetEntry> list)
        {
            for (int i = 1; i <= 8; i++)
            {
                list.Add(new AssetEntry(
                    "boss_" + i,
                    "Art/Bosses/boss_" + i,
                    AssetCategory.BossSprite,
                    512));
            }
        }
    }
}

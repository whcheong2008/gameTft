using UnityEngine;
using UnityEditor;
using ShatteredVeil.Core.Units;
using ShatteredVeil.Data;

namespace ShatteredVeil.Editor
{
    /// <summary>
    /// Editor utility to generate all 132 UnitTemplate and 15 SynergyDefinition
    /// ScriptableObject assets from hardcoded data (sourced from units-templates.js
    /// and GROUND-TRUTH.md). Run from Unity menu: ShatteredVeil > Import Unit Data.
    /// </summary>
    public static class UnitDataImporter
    {
        [MenuItem("ShatteredVeil/Import Unit Data")]
        public static void ImportAll()
        {
            ImportUnits();
            ImportSynergies();
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("[UnitDataImporter] Import complete. 132 units + 15 synergies.");
        }

        [MenuItem("ShatteredVeil/Import Unit Data (Units Only)")]
        public static void ImportUnits()
        {
            const string folder = "Assets/Resources/Units";
            EnsureFolder(folder);
            int count = 0;

            foreach (var entry in UnitDataEntries.All)
            {
                var path = $"{folder}/{entry.unitId}.asset";
                var existing = AssetDatabase.LoadAssetAtPath<UnitTemplate>(path);
                var so = existing != null ? existing : ScriptableObject.CreateInstance<UnitTemplate>();

                so.unitId = entry.unitId;
                so.displayName = entry.displayName;
                so.element = entry.element;
                so.unitType = entry.unitType;
                so.archetype = entry.archetype;
                so.secondaryArchetype = entry.secondaryArchetype;
                so.abilityTemplate = entry.abilityTemplate;
                so.tier = entry.tier;
                so.baseHP = entry.baseHP;
                so.baseATK = entry.baseATK;
                so.attackSpeed = entry.attackSpeed;
                so.attackRange = entry.attackRange;
                so.moveSpeed = entry.moveSpeed;
                so.maxMana = entry.maxMana;
                so.evolvedFormId = entry.evolvedFormId;
                so.isEvolved = entry.isEvolved;
                so.baseFormId = entry.baseFormId;

                if (existing == null)
                    AssetDatabase.CreateAsset(so, path);
                else
                    EditorUtility.SetDirty(so);

                count++;
            }

            Debug.Log($"[UnitDataImporter] Imported {count} unit templates.");
        }

        [MenuItem("ShatteredVeil/Import Unit Data (Synergies Only)")]
        public static void ImportSynergies()
        {
            const string folder = "Assets/Resources/Synergies";
            EnsureFolder(folder);
            int count = 0;

            foreach (var entry in SynergyDataEntries.All)
            {
                var path = $"{folder}/{entry.synergyType}_{entry.synergyName}.asset";
                var existing = AssetDatabase.LoadAssetAtPath<SynergyDefinition>(path);
                var so = existing != null ? existing : ScriptableObject.CreateInstance<SynergyDefinition>();

                so.type = entry.synergyType == "element" ? SynergyType.Element : SynergyType.Archetype;
                so.synergyId = entry.synergyName;
                so.tiers = ConvertTiers(entry.tiers);

                if (existing == null)
                    AssetDatabase.CreateAsset(so, path);
                else
                    EditorUtility.SetDirty(so);

                count++;
            }

            Debug.Log($"[UnitDataImporter] Imported {count} synergy definitions.");
        }

        private static SynergyTierData[] ConvertTiers(SynergyTier[] tiers)
        {
            var result = new SynergyTierData[tiers.Length];
            for (int i = 0; i < tiers.Length; i++)
            {
                result[i] = new SynergyTierData
                {
                    requiredCount = tiers[i].threshold,
                    description = tiers[i].description
                };
            }
            return result;
        }

        private static void EnsureFolder(string path)
        {
            var parts = path.Split('/');
            var current = parts[0];
            for (int i = 1; i < parts.Length; i++)
            {
                var next = current + "/" + parts[i];
                if (!AssetDatabase.IsValidFolder(next))
                    AssetDatabase.CreateFolder(current, parts[i]);
                current = next;
            }
        }
    }

    /// <summary>
    /// Raw unit data entries sourced from js/units-templates.js.
    /// </summary>
    public static class UnitDataEntries
    {
        public struct Entry
        {
            public string unitId, displayName, element, unitType, archetype,
                          secondaryArchetype, abilityTemplate, evolvedFormId, baseFormId;
            public int tier, baseHP, baseATK, maxMana;
            public float attackSpeed, attackRange, moveSpeed;
            public bool isEvolved;
        }

        public static Entry U(string id, string name, int tier, string type, string arch,
            string secArch, string elem, int hp, int atk, float aspd, float range,
            float mspd, int mana, string evolvedId = "", bool isEvo = false, string baseId = "",
            string template = "")
        {
            return new Entry
            {
                unitId = id, displayName = name, tier = tier, unitType = type,
                archetype = arch, secondaryArchetype = secArch, element = elem,
                baseHP = hp, baseATK = atk, attackSpeed = aspd, attackRange = range,
                moveSpeed = mspd, maxMana = mana, evolvedFormId = evolvedId,
                isEvolved = isEvo, baseFormId = baseId, abilityTemplate = template
            };
        }

        public static readonly Entry[] All = new Entry[]
        {
            // ===================== FIRE BASE (11) =====================
            U("flame_warrior","Flame Warrior",1,"warrior","duelist","vanguard","fire",600,50,0.85f,1f,1.9f,65,evolvedId:"fire_berserker",template:"execute_striker"),
            U("ember_scout","Ember Scout",1,"assassin","predator","duelist","fire",390,46,0.5f,1f,3.9f,45,evolvedId:"flame_rogue",template:"dot_detonator"),
            U("cinder_archer","Cinder Archer",1,"archer","ranger","sorcerer","fire",360,52,0.7f,4f,2.0f,55,evolvedId:"cinder_marksman",template:"dot_spreader"),
            U("fire_acolyte","Fire Acolyte",1,"healer","sage","guardian","fire",420,39,1.1f,2f,1.6f,55,evolvedId:"ember_saint",template:"heal_and_harm"),
            U("magma_knight","Magma Knight",2,"tank","guardian","warden","fire",1012,40,1.0f,1f,1.5f,85,evolvedId:"volcano_titan",template:"revenge_tank"),
            U("blaze_lancer","Blaze Lancer",2,"warrior","vanguard","predator","fire",828,63,0.8f,1f,2.0f,60,evolvedId:"inferno_lancer",template:"dot_spreader"),
            U("pyromancer","Pyromancer",3,"mage","sorcerer","mystic","fire",650,103,0.9f,3f,1.5f,65,evolvedId:"arcane_inferno",template:"dot_detonator"),
            U("inferno_fox","Inferno Fox",3,"assassin","mystic","predator","fire",600,90,0.5f,1f,3.8f,50,evolvedId:"ninetail_blaze",template:"execute_striker"),
            U("fire_dragon","Fire Dragon",4,"mage","warden","sorcerer","fire",1485,128,0.9f,3f,1.5f,80,evolvedId:"elder_wyrm",template:"dot_spreader"),
            U("ashen_watcher","Ashen Watcher",4,"healer","sage","mystic","fire",1053,136,0.8f,3f,1.6f,60,evolvedId:"phoenix_priest",template:"heal_and_harm"),
            U("phoenix","Phoenix",5,"mage","mystic","sage","fire",1425,206,0.95f,3f,1.6f,0,evolvedId:"eternal_phoenix",template:"transformer"),

            // ===================== WATER BASE (11) =====================
            U("tide_hunter","Tide Hunter",1,"warrior","vanguard","warden","water",640,48,0.8f,1f,1.8f,60,evolvedId:"tsunami_blade",template:"crowd_puller"),
            U("frost_archer","Frost Archer",1,"archer","ranger","mystic","water",360,50,0.7f,4f,1.95f,50,evolvedId:"ice_sniper",template:"cc_chainer"),
            U("reef_stalker","Reef Stalker",1,"assassin","predator","duelist","water",400,44,0.5f,1f,3.8f,40,evolvedId:"tidal_phantom",template:"drain_fighter"),
            U("coral_priest","Coral Priest",2,"healer","sage","ranger","water",518,49,1.1f,2f,1.5f,60,evolvedId:"ocean_sage",template:"heal_and_harm"),
            U("hydro_mage","Hydro Mage",2,"mage","sorcerer","ranger","water",460,64,0.95f,3f,1.4f,70,evolvedId:"abyssal_mage",template:"crowd_puller"),
            U("shell_knight","Shell Knight",2,"tank","guardian","sage","water",1035,37,1.0f,1f,1.4f,80,evolvedId:"armored_sentinel",template:"shield_stacker"),
            U("tidal_shaman","Tidal Shaman",3,"healer","mystic","sage","water",600,78,1.1f,2.5f,1.6f,65,evolvedId:"stormtide_oracle",template:"heal_and_harm"),
            U("riptide_blade","Riptide Blade",3,"warrior","duelist","vanguard","water",775,88,0.8f,1f,1.8f,65,evolvedId:"tsunami_warlord",template:"drain_fighter"),
            U("kraken","Kraken",4,"mage","warden","sorcerer","water",1242,132,0.9f,3f,1.3f,85,evolvedId:"abyssal_terror",template:"crowd_puller"),
            U("abyssal_guardian","Abyssal Guardian",4,"tank","guardian","warden","water",1823,74,0.6f,1f,1.2f,90,evolvedId:"hadal_colossus",template:"shield_stacker"),
            U("leviathan","Leviathan",5,"tank","guardian","warden","water",2610,69,1.0f,1f,1.2f,0,evolvedId:"primordial_leviathan",template:"unkillable_wall_premium"),

            // ===================== EARTH BASE (11) =====================
            U("stone_guard","Stone Guard",1,"tank","guardian","vanguard","earth",750,32,1.0f,1f,1.4f,80,evolvedId:"mountain_lord",template:"shield_stacker"),
            U("bramble_knight","Bramble Knight",1,"warrior","vanguard","guardian","earth",640,48,0.85f,1f,1.8f,65,evolvedId:"ironwood_sentinel",template:"revenge_tank"),
            U("seedling_archer","Seedling Archer",1,"archer","ranger","warden","earth",360,48,0.7f,3f,2.0f,55,evolvedId:"thornwood_ranger",template:"lockdown_specialist"),
            U("earth_shaman","Earth Shaman",2,"healer","sage","mystic","earth",518,52,1.1f,2.5f,1.5f,60,evolvedId:"gaia_priest",template:"shield_stacker"),
            U("crystal_mage","Crystal Mage",2,"mage","guardian","sorcerer","earth",575,71,0.95f,3f,1.5f,70,evolvedId:"geomancer",template:"lockdown_specialist"),
            U("mud_stalker","Mud Stalker",2,"assassin","predator","duelist","earth",483,55,0.5f,1f,3.2f,45,evolvedId:"quake_reaper",template:"lockdown_specialist"),
            U("golem","Golem",3,"tank","warden","guardian","earth",1313,53,1.0f,1f,1.2f,75,evolvedId:"iron_colossus",template:"unkillable_wall"),
            U("terra_sage","Terra Sage",3,"mage","sorcerer","ranger","earth",550,77,0.9f,3f,1.5f,75,evolvedId:"earthweaver",template:"terrain_shaper"),
            U("ancient_treant","Ancient Treant",4,"warrior","duelist","warden","earth",1620,109,0.9f,1f,1.2f,80,evolvedId:"world_sentinel",template:"revenge_tank"),
            U("grove_warden","Grove Warden",4,"archer","ranger","guardian","earth",918,119,0.75f,5f,1.0f,70,evolvedId:"worldroot_sentinel",template:"lockdown_specialist"),
            U("world_tree","World Tree",5,"healer","sage","guardian","earth",1950,89,1.2f,3f,1.3f,0,evolvedId:"yggdrasil",template:"summoner"),

            // ===================== WIND BASE (11) =====================
            U("zephyr_scout","Zephyr Scout",1,"assassin","predator","duelist","wind",395,46,0.5f,1f,4.0f,45,evolvedId:"storm_assassin",template:"chain_killer"),
            U("wind_archer","Wind Archer",1,"archer","ranger","predator","wind",360,43,0.7f,4f,2.1f,55,evolvedId:"gale_sniper",template:"multi_striker"),
            U("gale_dancer","Gale Dancer",1,"healer","sage","ranger","wind",420,42,1.1f,2.5f,2.2f,60,evolvedId:"stormweaver",template:"drain_fighter"),
            U("wind_squire","Wind Squire",1,"warrior","vanguard","duelist","wind",600,48,0.8f,1f,1.95f,60,evolvedId:"zephyr_warrior",template:"dodge_tank"),
            U("sky_knight","Sky Knight",2,"warrior","warden","guardian","wind",782,60,0.85f,1f,1.9f,65,evolvedId:"aegis_paladin",template:"dodge_tank"),
            U("gust_sentinel","Gust Sentinel",2,"tank","guardian","warden","wind",1124,37,1.0f,1f,1.6f,70,evolvedId:"tempest_guardian",template:"blink_striker"),
            U("monsoon_caller","Monsoon Caller",3,"mage","sorcerer","mystic","wind",525,108,0.9f,3f,1.8f,70,evolvedId:"tempest_lord",template:"chain_killer"),
            U("wind_duelist","Wind Duelist",3,"warrior","duelist","predator","wind",775,85,0.8f,1f,2.0f,60,evolvedId:"hurricane_blade",template:"multi_striker"),
            U("storm_sovereign","Storm Sovereign",4,"assassin","predator","vanguard","wind",999,122,0.45f,1f,4.2f,55,evolvedId:"tempest_emperor",template:"chain_killer"),
            U("tempest_weaver","Tempest Weaver",4,"mage","sorcerer","ranger","wind",878,136,0.85f,3f,2.0f,65,evolvedId:"stormweft_oracle",template:"blink_striker"),
            U("void_wyrm","Void Wyrm",5,"mage","mystic","sorcerer","wind",1230,188,0.7f,4f,2.1f,0,evolvedId:"dimensional_dragon",template:"disruptor"),

            // ===================== LIGHTNING BASE (11) =====================
            U("spark_fencer","Spark Fencer",1,"warrior","duelist","sorcerer","lightning",620,50,0.85f,1f,1.9f,65,evolvedId:"arc_duelist",template:"dot_detonator"),
            U("volt_runner","Volt Runner",1,"assassin","predator","vanguard","lightning",400,45,0.5f,1f,4.0f,45,evolvedId:"lightning_phantom",template:"chain_killer"),
            U("thunder_archer","Thunder Archer",1,"archer","ranger","mystic","lightning",360,52,0.7f,4f,2.0f,55,evolvedId:"storm_archer",template:"frontload_nuker"),
            U("pulse_mender","Pulse Mender",1,"healer","sage","ranger","lightning",430,39,1.1f,2.5f,1.6f,60,evolvedId:"storm_medic",template:"cc_chainer"),
            U("tesla_knight","Tesla Knight",2,"tank","guardian","warden","lightning",1035,40,1.0f,1f,1.5f,85,evolvedId:"storm_bastion",template:"lockdown_specialist"),
            U("shock_mage","Shock Mage",2,"mage","sorcerer","ranger","lightning",483,64,0.95f,3f,1.5f,90,evolvedId:"tempest_mage",template:"frontload_nuker"),
            U("ball_lightning","Ball Lightning",3,"mage","mystic","sorcerer","lightning",600,103,0.9f,3f,1.6f,70,evolvedId:"plasma_core",template:"dot_detonator"),
            U("thunder_warden","Thunder Warden",3,"tank","warden","guardian","lightning",1250,56,1.0f,1f,1.3f,85,evolvedId:"storm_fortress",template:"lockdown_specialist"),
            U("thunderbird","Thunderbird",4,"warrior","vanguard","predator","lightning",1107,119,0.8f,1f,2.2f,70,evolvedId:"roc_of_storms",template:"chain_killer"),
            U("voltfang_stalker","Voltfang Stalker",4,"assassin","predator","duelist","lightning",945,128,0.5f,1f,3.8f,50,evolvedId:"plasma_ravager",template:"chain_killer"),
            U("storm_dragon","Storm Dragon",5,"mage","sorcerer","mystic","lightning",1500,195,0.95f,3f,1.7f,0,evolvedId:"thunder_god",template:"aura_burner"),

            // ===================== FORCE BASE (11) =====================
            U("iron_soldier","Iron Soldier",1,"warrior","vanguard","sage","force",630,44,0.85f,1f,1.9f,65,evolvedId:"legionnaire",template:"ramping_attacker"),
            U("shadow_blade","Shadow Blade",1,"assassin","predator","duelist","force",410,48,0.5f,1f,3.9f,45,evolvedId:"night_stalker",template:"execute_striker"),
            U("steel_archer","Steel Archer",1,"archer","ranger","predator","force",370,44,0.7f,4f,2.0f,55,evolvedId:"ballista_archer",template:"ramping_attacker"),
            U("war_cleric","War Cleric",2,"healer","sage","vanguard","force",529,52,1.1f,2f,1.6f,60,evolvedId:"battle_priest",template:"bodyguard"),
            U("battle_mage","Battle Mage",2,"mage","sorcerer","warden","force",483,86,0.95f,3f,1.5f,75,evolvedId:"force_archmage",template:"blink_striker"),
            U("shield_bearer","Shield Bearer",2,"tank","guardian","sage","force",1058,37,1.0f,1f,1.5f,85,evolvedId:"bastion",template:"bodyguard"),
            U("gladiator","Gladiator",3,"warrior","duelist","vanguard","force",813,88,0.8f,1f,1.9f,60,evolvedId:"champion",template:"ramping_attacker"),
            U("fortress","Fortress",3,"tank","warden","guardian","force",1375,50,1.0f,1f,1.2f,70,evolvedId:"citadel",template:"unkillable_wall"),
            U("siege_engineer","Siege Engineer",4,"mage","mystic","ranger","force",702,136,0.9f,3f,1.5f,75,evolvedId:"war_architect",template:"blink_striker"),
            U("iron_duelist","Iron Duelist",4,"warrior","duelist","vanguard","force",1283,142,0.85f,1f,1.8f,60,evolvedId:"warforged_champion",template:"execute_striker"),
            U("titan_lord","Titan Lord",5,"warrior","duelist","vanguard","force",2025,210,0.9f,1f,1.8f,0,evolvedId:"cosmic_titan",template:"transformer"),

            // ===================== FIRE EVOLVED (11) =====================
            U("fire_berserker","Fire Berserker",1,"warrior","duelist","vanguard","fire",750,68,0.65f,1f,2.2f,65,isEvo:true,baseId:"flame_warrior",template:"execute_striker"),
            U("flame_rogue","Flame Rogue",1,"assassin","predator","duelist","fire",490,60,0.40f,1f,4.5f,45,isEvo:true,baseId:"ember_scout",template:"dot_detonator"),
            U("cinder_marksman","Cinder Marksman",1,"archer","ranger","sorcerer","fire",430,68,0.60f,5f,2.2f,55,isEvo:true,baseId:"cinder_archer",template:"dot_spreader"),
            U("ember_saint","Ember Saint",1,"healer","sage","guardian","fire",520,36,1.0f,3f,1.8f,70,isEvo:true,baseId:"fire_acolyte",template:"heal_and_harm"),
            U("volcano_titan","Volcano Titan",2,"tank","guardian","warden","fire",1100,46,0.95f,1f,1.6f,85,isEvo:true,baseId:"magma_knight",template:"revenge_tank"),
            U("inferno_lancer","Inferno Lancer",2,"warrior","vanguard","predator","fire",900,72,0.60f,1f,2.3f,60,isEvo:true,baseId:"blaze_lancer",template:"dot_spreader"),
            U("arcane_inferno","Arcane Inferno",3,"mage","sorcerer","mystic","fire",520,75,0.9f,3f,1.5f,65,isEvo:true,baseId:"pyromancer",template:"dot_detonator"),
            U("ninetail_blaze","Ninetail Blaze",3,"assassin","mystic","predator","fire",480,72,0.5f,1f,3.8f,50,isEvo:true,baseId:"inferno_fox",template:"execute_striker"),
            U("elder_wyrm","Elder Wyrm",4,"mage","warden","sorcerer","fire",1100,95,0.9f,3f,1.5f,80,isEvo:true,baseId:"fire_dragon",template:"dot_spreader"),
            U("phoenix_priest","Phoenix Priest",4,"healer","sage","mystic","fire",780,72,0.8f,3f,1.6f,75,isEvo:true,baseId:"ashen_watcher",template:"heal_and_harm"),
            U("eternal_phoenix","Eternal Phoenix",5,"mage","mystic","sage","fire",950,110,0.95f,3f,1.6f,0,isEvo:true,baseId:"phoenix",template:"transformer"),

            // ===================== WATER EVOLVED (11) =====================
            U("tsunami_blade","Tsunami Blade",1,"warrior","vanguard","warden","water",800,64,0.60f,1f,2.1f,60,isEvo:true,baseId:"tide_hunter",template:"crowd_puller"),
            U("ice_sniper","Ice Sniper",1,"archer","ranger","mystic","water",430,65,0.60f,5f,2.2f,50,isEvo:true,baseId:"frost_archer",template:"cc_chainer"),
            U("tidal_phantom","Tidal Phantom",1,"assassin","predator","duelist","water",500,58,0.40f,1f,4.4f,40,isEvo:true,baseId:"reef_stalker",template:"drain_fighter"),
            U("ocean_sage","Ocean Sage",2,"healer","sage","ranger","water",560,40,1.0f,3f,1.7f,75,isEvo:true,baseId:"coral_priest",template:"heal_and_harm"),
            U("abyssal_mage","Abyssal Mage",2,"mage","sorcerer","ranger","water",500,80,0.85f,4f,1.5f,70,isEvo:true,baseId:"hydro_mage",template:"crowd_puller"),
            U("armored_sentinel","Armored Sentinel",2,"tank","guardian","sage","water",1125,42,0.95f,1f,1.5f,80,isEvo:true,baseId:"shell_knight",template:"shield_stacker"),
            U("stormtide_oracle","Stormtide Oracle",3,"healer","mystic","sage","water",480,45,1.1f,2.5f,1.6f,80,isEvo:true,baseId:"tidal_shaman",template:"heal_and_harm"),
            U("tsunami_warlord","Tsunami Warlord",3,"warrior","duelist","vanguard","water",620,70,0.8f,1f,1.8f,65,isEvo:true,baseId:"riptide_blade",template:"drain_fighter"),
            U("abyssal_terror","Abyssal Terror",4,"mage","warden","sorcerer","water",920,98,0.9f,3f,1.3f,85,isEvo:true,baseId:"kraken",template:"crowd_puller"),
            U("hadal_colossus","Hadal Colossus",4,"tank","guardian","warden","water",1350,55,0.6f,1f,1.2f,90,isEvo:true,baseId:"abyssal_guardian",template:"shield_stacker"),
            U("primordial_leviathan","Primordial Leviathan",5,"tank","guardian","warden","water",1450,35,1.0f,1f,1.2f,0,isEvo:true,baseId:"leviathan",template:"unkillable_wall_premium"),

            // ===================== EARTH EVOLVED (11) =====================
            U("mountain_lord","Mountain Lord",1,"tank","guardian","vanguard","earth",940,42,0.95f,1f,1.5f,80,isEvo:true,baseId:"stone_guard",template:"shield_stacker"),
            U("ironwood_sentinel","Ironwood Sentinel",1,"warrior","vanguard","guardian","earth",800,65,0.65f,1f,2.1f,65,isEvo:true,baseId:"bramble_knight",template:"revenge_tank"),
            U("thornwood_ranger","Thornwood Ranger",1,"archer","ranger","warden","earth",430,62,0.60f,4f,2.2f,55,isEvo:true,baseId:"seedling_archer",template:"lockdown_specialist"),
            U("gaia_priest","Gaia Priest",2,"healer","sage","mystic","earth",560,42,1.0f,3f,1.7f,75,isEvo:true,baseId:"earth_shaman",template:"shield_stacker"),
            U("geomancer","Geomancer",2,"mage","guardian","sorcerer","earth",625,80,0.85f,4f,1.6f,70,isEvo:true,baseId:"crystal_mage",template:"lockdown_specialist"),
            U("quake_reaper","Quake Reaper",2,"assassin","predator","duelist","earth",525,62,0.40f,1f,3.7f,45,isEvo:true,baseId:"mud_stalker",template:"lockdown_specialist"),
            U("iron_colossus","Iron Colossus",3,"tank","warden","guardian","earth",1050,42,1.0f,1f,1.2f,90,isEvo:true,baseId:"golem",template:"unkillable_wall"),
            U("earthweaver","Earthweaver",3,"mage","sorcerer","ranger","earth",440,70,0.9f,3f,1.5f,75,isEvo:true,baseId:"terra_sage",template:"terrain_shaper"),
            U("world_sentinel","World Sentinel",4,"warrior","duelist","warden","earth",1200,70,0.9f,1f,1.2f,80,isEvo:true,baseId:"ancient_treant",template:"revenge_tank"),
            U("worldroot_sentinel","Worldroot Sentinel",4,"archer","ranger","guardian","earth",680,88,0.75f,5f,1.0f,70,isEvo:true,baseId:"grove_warden",template:"lockdown_specialist"),
            U("yggdrasil","Yggdrasil",5,"healer","sage","guardian","earth",1300,28,1.2f,3f,1.3f,0,isEvo:true,baseId:"world_tree",template:"summoner"),

            // ===================== WIND EVOLVED (11) =====================
            U("storm_assassin","Storm Assassin",1,"assassin","predator","duelist","wind",495,60,0.40f,1f,4.6f,45,isEvo:true,baseId:"zephyr_scout",template:"chain_killer"),
            U("gale_sniper","Gale Sniper",1,"archer","ranger","predator","wind",430,68,0.60f,5f,2.3f,55,isEvo:true,baseId:"wind_archer",template:"multi_striker"),
            U("stormweaver","Stormweaver",1,"healer","sage","ranger","wind",520,38,1.0f,3f,2.5f,75,isEvo:true,baseId:"gale_dancer",template:"drain_fighter"),
            U("zephyr_warrior","Zephyr Warrior",1,"warrior","vanguard","duelist","wind",750,65,0.60f,1f,2.2f,60,isEvo:true,baseId:"wind_squire",template:"dodge_tank"),
            U("aegis_paladin","Aegis Paladin",2,"warrior","warden","guardian","wind",850,68,0.65f,1f,2.2f,65,isEvo:true,baseId:"sky_knight",template:"dodge_tank"),
            U("tempest_guardian","Tempest Guardian",2,"tank","guardian","warden","wind",1060,42,0.95f,1f,1.7f,85,isEvo:true,baseId:"gust_sentinel",template:"blink_striker"),
            U("tempest_lord","Tempest Lord",3,"mage","sorcerer","mystic","wind",420,78,0.9f,3f,1.8f,70,isEvo:true,baseId:"monsoon_caller",template:"chain_killer"),
            U("hurricane_blade","Hurricane Blade",3,"warrior","duelist","predator","wind",620,68,0.8f,1f,2.0f,60,isEvo:true,baseId:"wind_duelist",template:"multi_striker"),
            U("tempest_emperor","Tempest Emperor",4,"assassin","predator","vanguard","wind",740,100,0.45f,1f,4.2f,55,isEvo:true,baseId:"storm_sovereign",template:"chain_killer"),
            U("stormweft_oracle","Stormweft Oracle",4,"mage","sorcerer","ranger","wind",650,92,0.85f,3f,2.0f,65,isEvo:true,baseId:"tempest_weaver",template:"blink_striker"),
            U("dimensional_dragon","Dimensional Dragon",5,"mage","mystic","sorcerer","wind",820,125,0.7f,4f,2.1f,0,isEvo:true,baseId:"void_wyrm",template:"disruptor"),

            // ===================== LIGHTNING EVOLVED (11) =====================
            U("arc_duelist","Arc Duelist",1,"warrior","duelist","sorcerer","lightning",775,68,0.65f,1f,2.2f,65,isEvo:true,baseId:"spark_fencer",template:"dot_detonator"),
            U("lightning_phantom","Lightning Phantom",1,"assassin","predator","vanguard","lightning",500,58,0.40f,1f,4.6f,45,isEvo:true,baseId:"volt_runner",template:"chain_killer"),
            U("storm_archer","Storm Archer",1,"archer","ranger","mystic","lightning",430,68,0.60f,5f,2.2f,55,isEvo:true,baseId:"thunder_archer",template:"frontload_nuker"),
            U("storm_medic","Storm Medic",1,"healer","sage","ranger","lightning",535,36,1.0f,3f,1.8f,75,isEvo:true,baseId:"pulse_mender",template:"cc_chainer"),
            U("storm_bastion","Storm Bastion",2,"tank","guardian","warden","lightning",1125,46,0.95f,1f,1.6f,85,isEvo:true,baseId:"tesla_knight",template:"lockdown_specialist"),
            U("tempest_mage","Tempest Mage",2,"mage","sorcerer","ranger","lightning",525,84,0.85f,4f,1.6f,75,isEvo:true,baseId:"shock_mage",template:"frontload_nuker"),
            U("plasma_core","Plasma Core",3,"mage","mystic","sorcerer","lightning",480,75,0.9f,3f,1.6f,70,isEvo:true,baseId:"ball_lightning",template:"dot_detonator"),
            U("storm_fortress","Storm Fortress",3,"tank","warden","guardian","lightning",1000,45,1.0f,1f,1.3f,85,isEvo:true,baseId:"thunder_warden",template:"lockdown_specialist"),
            U("roc_of_storms","Roc of Storms",4,"warrior","vanguard","predator","lightning",820,88,0.8f,1f,2.2f,70,isEvo:true,baseId:"thunderbird",template:"chain_killer"),
            U("plasma_ravager","Plasma Ravager",4,"assassin","predator","duelist","lightning",700,95,0.5f,1f,3.8f,50,isEvo:true,baseId:"voltfang_stalker",template:"chain_killer"),
            U("thunder_god","Thunder God",5,"mage","sorcerer","mystic","lightning",1000,130,0.95f,3f,1.7f,0,isEvo:true,baseId:"storm_dragon",template:"aura_burner"),

            // ===================== FORCE EVOLVED (11) =====================
            U("legionnaire","Legionnaire",1,"warrior","vanguard","sage","force",790,70,0.65f,1f,2.2f,65,isEvo:true,baseId:"iron_soldier",template:"ramping_attacker"),
            U("night_stalker","Night Stalker",1,"assassin","predator","duelist","force",510,62,0.40f,1f,4.5f,45,isEvo:true,baseId:"shadow_blade",template:"execute_striker"),
            U("ballista_archer","Ballista Archer",1,"archer","ranger","predator","force",440,65,0.60f,5f,2.2f,55,isEvo:true,baseId:"steel_archer",template:"ramping_attacker"),
            U("battle_priest","Battle Priest",2,"healer","sage","vanguard","force",575,42,1.0f,3f,1.8f,75,isEvo:true,baseId:"war_cleric",template:"bodyguard"),
            U("force_archmage","Force Archmage",2,"mage","sorcerer","warden","force",525,88,0.85f,4f,1.6f,75,isEvo:true,baseId:"battle_mage",template:"blink_striker"),
            U("bastion","Bastion",2,"tank","guardian","sage","force",1150,42,0.95f,1f,1.6f,85,isEvo:true,baseId:"shield_bearer",template:"bodyguard"),
            U("champion","Champion",3,"warrior","duelist","vanguard","force",650,80,0.8f,1f,1.9f,60,isEvo:true,baseId:"gladiator",template:"ramping_attacker"),
            U("citadel","Citadel",3,"tank","warden","guardian","force",1100,40,1.0f,1f,1.2f,85,isEvo:true,baseId:"fortress",template:"unkillable_wall"),
            U("war_architect","War Architect",4,"mage","mystic","ranger","force",520,92,0.9f,3f,1.5f,75,isEvo:true,baseId:"siege_engineer",template:"blink_striker"),
            U("warforged_champion","Warforged Champion",4,"warrior","duelist","vanguard","force",950,105,0.85f,1f,1.8f,60,isEvo:true,baseId:"iron_duelist",template:"execute_striker"),
            U("cosmic_titan","Cosmic Titan",5,"warrior","duelist","vanguard","force",1350,140,0.9f,1f,1.8f,0,isEvo:true,baseId:"titan_lord",template:"transformer"),
        };
    }

    public struct SynergyTier
    {
        public int threshold;
        public string description;
    }

    /// <summary>
    /// Synergy data entries sourced from GROUND-TRUTH.md sections 2-3.
    /// </summary>
    public static class SynergyDataEntries
    {
        public struct Entry
        {
            public string synergyType, synergyName;
            public SynergyTier[] tiers;
        }

        public static readonly Entry[] All = new Entry[]
        {
            // ===================== ELEMENT SYNERGIES (6) =====================
            new Entry { synergyType = "element", synergyName = "fire", tiers = new[]
            {
                new SynergyTier { threshold = 2, description = "Attacks apply Burn (10 DPS, 3s)" },
                new SynergyTier { threshold = 4, description = "Burn 20 DPS. On kill, enemy explodes for 15% max HP to adjacent" },
                new SynergyTier { threshold = 7, description = "Burn 35 DPS, 5s. Fire abilities apply Burn. Fire units +20% ATK. Kill explosions chain" },
                new SynergyTier { threshold = 10, description = "Prismatic: Enemies start burning (3% maxHP/s). Ability mana cost -50%. Death explosions 200 AoE. Fire immune to Burn" },
            }},
            new Entry { synergyType = "element", synergyName = "water", tiers = new[]
            {
                new SynergyTier { threshold = 2, description = "Enemy attack speed -15%" },
                new SynergyTier { threshold = 4, description = "Enemy ATK speed -25%. Allies heal 1.5% max HP/s" },
                new SynergyTier { threshold = 7, description = "Enemy ATK speed -40%. Heal 3%/s. Enemies below 40% HP deal -20% damage" },
                new SynergyTier { threshold = 10, description = "Prismatic: Permanent 35% slow. Water abilities heal 20% of damage dealt. Enemies below 25% HP frozen 2s (once)" },
            }},
            new Entry { synergyType = "element", synergyName = "earth", tiers = new[]
            {
                new SynergyTier { threshold = 2, description = "Shield: 15% max HP at combat start" },
                new SynergyTier { threshold = 4, description = "Shield 25% max HP. +8% DR" },
                new SynergyTier { threshold = 7, description = "Shield 40% max HP. +15% DR. Shields regen 3%/s when not hit" },
                new SynergyTier { threshold = 10, description = "Prismatic: Shield 60% max HP. +25% DR. Shield regen 5%/s always. Root random enemy every 8s for 3s. Earth units can't be crit" },
            }},
            new Entry { synergyType = "element", synergyName = "wind", tiers = new[]
            {
                new SynergyTier { threshold = 2, description = "+15% attack speed" },
                new SynergyTier { threshold = 4, description = "+25% ATK speed. +12% dodge" },
                new SynergyTier { threshold = 7, description = "+40% ATK speed. +25% dodge. Dodge grants 10 mana + 40% ATK counter" },
                new SynergyTier { threshold = 10, description = "Prismatic: +60% ATK speed. +40% dodge. 40% chance abilities cast twice. Dodge counter grants 15 mana + 80% ATK" },
            }},
            new Entry { synergyType = "element", synergyName = "lightning", tiers = new[]
            {
                new SynergyTier { threshold = 2, description = "+10% crit chance. Crits chain 50 damage to 1 adjacent" },
                new SynergyTier { threshold = 4, description = "+18% crit. +15% crit damage. Chains hit 2" },
                new SynergyTier { threshold = 7, description = "+30% crit. +30% crit damage. Chains hit 3. Abilities can crit (15%)" },
                new SynergyTier { threshold = 10, description = "Prismatic: +50% crit. +60% crit damage. Abilities chain to 2 at 50%. On crit, 120 lightning AoE within 2 cells" },
            }},
            new Entry { synergyType = "element", synergyName = "force", tiers = new[]
            {
                new SynergyTier { threshold = 2, description = "+10% ATK, +10% HP" },
                new SynergyTier { threshold = 4, description = "+18% ATK, +18% HP. Ignore 10% DR" },
                new SynergyTier { threshold = 7, description = "+30% ATK, +30% HP. Ignore 20% DR. First CC immune per combat" },
                new SynergyTier { threshold = 10, description = "Prismatic: +50% ATK, +50% HP. Ignore 40% DR. CC immune 6s. Revive once at 30% HP" },
            }},

            // ===================== ARCHETYPE SYNERGIES (9) =====================
            new Entry { synergyType = "archetype", synergyName = "guardian", tiers = new[]
            {
                new SynergyTier { threshold = 2, description = "+250 HP, +5% DR, shield" },
                new SynergyTier { threshold = 4, description = "+550 HP, +10% DR" },
                new SynergyTier { threshold = 6, description = "+900 HP, +15% DR, shield-break tenacity" },
                new SynergyTier { threshold = 8, description = "+1300 HP, +20% DR, last-stand invulnerability" },
            }},
            new Entry { synergyType = "archetype", synergyName = "warden", tiers = new[]
            {
                new SynergyTier { threshold = 2, description = "CC duration +20%, tenacity +15%" },
                new SynergyTier { threshold = 4, description = "CC duration +35%, tenacity +30%" },
                new SynergyTier { threshold = 6, description = "CC duration +50%, tenacity +45%, first CC immune" },
                new SynergyTier { threshold = 8, description = "CC duration +65%, tenacity +60%, full CC immune" },
            }},
            new Entry { synergyType = "archetype", synergyName = "vanguard", tiers = new[]
            {
                new SynergyTier { threshold = 2, description = "+200 HP, +20 ATK (x2 front row), charge stun" },
                new SynergyTier { threshold = 4, description = "+400 HP, +35 ATK (x2 front row)" },
                new SynergyTier { threshold = 6, description = "+650 HP, +55 ATK (x2 front row), lifesteal" },
                new SynergyTier { threshold = 8, description = "+950 HP, +80 ATK (x2 front row), slow immune" },
            }},
            new Entry { synergyType = "archetype", synergyName = "duelist", tiers = new[]
            {
                new SynergyTier { threshold = 2, description = "Double-strike 15% chance" },
                new SynergyTier { threshold = 4, description = "Double-strike 30%, lifesteal" },
                new SynergyTier { threshold = 6, description = "Double-strike 40%, can't miss" },
                new SynergyTier { threshold = 8, description = "Double-strike 55%, guaranteed crit every 3rd attack" },
            }},
            new Entry { synergyType = "archetype", synergyName = "predator", tiers = new[]
            {
                new SynergyTier { threshold = 2, description = "ATK speed +25%, execute +15% to targets below 50% HP" },
                new SynergyTier { threshold = 4, description = "ATK speed +40%, execute +25%, dash reset on kill" },
                new SynergyTier { threshold = 6, description = "ATK speed +55%, execute +35%, on-kill ATK buff" },
                new SynergyTier { threshold = 8, description = "ATK speed +70%, execute +50% to targets below 60% HP" },
            }},
            new Entry { synergyType = "archetype", synergyName = "ranger", tiers = new[]
            {
                new SynergyTier { threshold = 2, description = "+1 range, furthest target damage +15%" },
                new SynergyTier { threshold = 4, description = "+1 range, furthest +25%, pierce" },
                new SynergyTier { threshold = 6, description = "+2 range, furthest +35%, focused shot" },
                new SynergyTier { threshold = 8, description = "+3 range, furthest +50%, target mark amp" },
            }},
            new Entry { synergyType = "archetype", synergyName = "sorcerer", tiers = new[]
            {
                new SynergyTier { threshold = 2, description = "Ability damage +15%, starting mana +10" },
                new SynergyTier { threshold = 4, description = "Ability damage +30%, starting mana +20, mana refund" },
                new SynergyTier { threshold = 6, description = "Ability damage +50%, starting mana +30, spell penetration" },
                new SynergyTier { threshold = 8, description = "Ability damage +75%, starting mana +40, first cast double damage" },
            }},
            new Entry { synergyType = "archetype", synergyName = "mystic", tiers = new[]
            {
                new SynergyTier { threshold = 2, description = "Element resist +20%, status duration +20%" },
                new SynergyTier { threshold = 4, description = "Element resist +35%, status duration +35%, resist shred" },
                new SynergyTier { threshold = 6, description = "Element resist +50%, status duration +50%, ability damage per unique element" },
                new SynergyTier { threshold = 8, description = "Element resist +65%, status duration +65%" },
            }},
            new Entry { synergyType = "archetype", synergyName = "sage", tiers = new[]
            {
                new SynergyTier { threshold = 2, description = "Heal bonus +35%" },
                new SynergyTier { threshold = 4, description = "Heal bonus +70%, heal-shield" },
                new SynergyTier { threshold = 6, description = "Heal bonus +110%, passive mana, overheal-to-shield" },
                new SynergyTier { threshold = 8, description = "Heal bonus +160%, death-save once per combat" },
            }},
        };
    }
}

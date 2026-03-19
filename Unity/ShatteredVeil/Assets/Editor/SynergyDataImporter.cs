using UnityEngine;
using UnityEditor;
using System.IO;
using ShatteredVeil.Core.Units;
using ShatteredVeil.Data;

namespace ShatteredVeil.Editor
{
    public static class SynergyDataImporter
    {
        [System.Serializable]
        private class BonusEntry
        {
            public int stat;
            public int modType;
            public float value;
        }

        [System.Serializable]
        private class TierEntry
        {
            public int requiredCount;
            public string description;
            public BonusEntry[] bonuses;
        }

        [System.Serializable]
        private class SynergyEntry
        {
            public string synergyId;
            public int type;
            public TierEntry[] tiers;
        }

        [System.Serializable]
        private class SynergyList
        {
            public SynergyEntry[] items;
        }

        [MenuItem("ShatteredVeil/Import Synergy Data from JSON")]
        public static void ImportSynergyData()
        {
            string fullPath = Path.Combine(Application.dataPath, "Editor/synergy_data.json");

            if (!File.Exists(fullPath))
            {
                Debug.LogError("synergy_data.json not found at " + fullPath);
                return;
            }

            string json = File.ReadAllText(fullPath);
            json = "{\"items\":" + json + "}";
            var list = JsonUtility.FromJson<SynergyList>(json);

            if (list == null || list.items == null)
            {
                Debug.LogError("Failed to parse synergy_data.json");
                return;
            }

            // Ensure folder exists
            if (!AssetDatabase.IsValidFolder("Assets/Data"))
                AssetDatabase.CreateFolder("Assets", "Data");
            if (!AssetDatabase.IsValidFolder("Assets/Data/Synergies"))
                AssetDatabase.CreateFolder("Assets/Data", "Synergies");

            int created = 0;
            foreach (var entry in list.items)
            {
                string assetPath = "Assets/Data/Synergies/" + entry.synergyId + ".asset";

                var existing = AssetDatabase.LoadAssetAtPath<SynergyDefinition>(assetPath);
                SynergyDefinition def;
                if (existing != null)
                {
                    def = existing;
                }
                else
                {
                    def = ScriptableObject.CreateInstance<SynergyDefinition>();
                }

                def.synergyId = entry.synergyId;
                def.type = (SynergyType)entry.type;

                var tierDataArr = new SynergyTierData[entry.tiers.Length];
                for (int i = 0; i < entry.tiers.Length; i++)
                {
                    var src = entry.tiers[i];
                    var tier = new SynergyTierData
                    {
                        requiredCount = src.requiredCount,
                        description = src.description
                    };

                    if (src.bonuses != null && src.bonuses.Length > 0)
                    {
                        tier.bonuses = new StatModifierData[src.bonuses.Length];
                        for (int j = 0; j < src.bonuses.Length; j++)
                        {
                            tier.bonuses[j] = new StatModifierData
                            {
                                stat = (StatType)src.bonuses[j].stat,
                                modType = (ModifierType)src.bonuses[j].modType,
                                value = src.bonuses[j].value
                            };
                        }
                    }
                    else
                    {
                        tier.bonuses = new StatModifierData[0];
                    }

                    tierDataArr[i] = tier;
                }
                def.tiers = tierDataArr;

                if (existing == null)
                {
                    AssetDatabase.CreateAsset(def, assetPath);
                }
                else
                {
                    EditorUtility.SetDirty(def);
                }
                created++;
            }

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("Imported " + created + " synergy definitions successfully.");
        }
    }
}

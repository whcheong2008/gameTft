using UnityEngine;
using UnityEditor;
using System.IO;
using ShatteredVeil.Core.Combat;
using ShatteredVeil.Data;

namespace ShatteredVeil.Editor
{
    public static class UnitDataImporter
    {
        [System.Serializable]
        private class UnitEntry
        {
            public string unitId;
            public string displayName;
            public int element;
            public int archetype;
            public int secondaryArchetype;
            public bool hasSecondaryArchetype;
            public int tier;
            public string evolvedFromId;
            public string evolvesIntoId;
            public bool isEvolved;
            public int baseHP;
            public int baseATK;
            public int baseDEF;
            public int baseSPD;
            public float baseAttackSpeed;
            public float baseCritChance;
            public float baseCritDamage;
            public int maxMana;
            public int attackRange;
            public float moveSpeed;
            public int defaultTargeting;
            public string abilityId;
            public string passiveId;
            public string folder;
        }

        [System.Serializable]
        private class UnitList
        {
            public UnitEntry[] items;
        }

        [MenuItem("ShatteredVeil/Import Unit Data from JSON")]
        public static void ImportUnitData()
        {
            string jsonPath = "Assets/Editor/unit_data.json";
            string fullPath = Path.Combine(Application.dataPath, "Editor/unit_data.json");

            if (!File.Exists(fullPath))
            {
                Debug.LogError("unit_data.json not found at " + fullPath);
                return;
            }

            string json = File.ReadAllText(fullPath);
            // Wrap in object for JsonUtility
            json = "{\"items\":" + json + "}";
            var list = JsonUtility.FromJson<UnitList>(json);

            if (list == null || list.items == null)
            {
                Debug.LogError("Failed to parse unit_data.json");
                return;
            }

            int created = 0;
            foreach (var entry in list.items)
            {
                string folderPath = "Assets/Data/Units/" + entry.folder;
                if (!AssetDatabase.IsValidFolder(folderPath))
                {
                    // Create parent folders as needed
                    string parent = "Assets/Data/Units";
                    if (!AssetDatabase.IsValidFolder("Assets/Data"))
                        AssetDatabase.CreateFolder("Assets", "Data");
                    if (!AssetDatabase.IsValidFolder("Assets/Data/Units"))
                        AssetDatabase.CreateFolder("Assets/Data", "Units");
                    AssetDatabase.CreateFolder("Assets/Data/Units", entry.folder);
                }

                string assetPath = folderPath + "/" + entry.unitId + ".asset";

                var existing = AssetDatabase.LoadAssetAtPath<UnitTemplate>(assetPath);
                UnitTemplate template;
                if (existing != null)
                {
                    template = existing;
                }
                else
                {
                    template = ScriptableObject.CreateInstance<UnitTemplate>();
                }

                template.unitId = entry.unitId;
                template.displayName = entry.displayName;
                template.element = (Element)entry.element;
                template.archetype = (Archetype)entry.archetype;
                template.secondaryArchetype = (Archetype)entry.secondaryArchetype;
                template.hasSecondaryArchetype = entry.hasSecondaryArchetype;
                template.tier = entry.tier;
                template.evolvedFromId = entry.evolvedFromId;
                template.evolvesIntoId = entry.evolvesIntoId;
                template.isEvolved = entry.isEvolved;
                template.baseHP = entry.baseHP;
                template.baseATK = entry.baseATK;
                template.baseDEF = entry.baseDEF;
                template.baseSPD = entry.baseSPD;
                template.baseAttackSpeed = entry.baseAttackSpeed;
                template.baseCritChance = entry.baseCritChance;
                template.baseCritDamage = entry.baseCritDamage;
                template.maxMana = entry.maxMana;
                template.attackRange = entry.attackRange;
                template.moveSpeed = entry.moveSpeed;
                template.defaultTargeting = (TargetingRule)entry.defaultTargeting;
                template.abilityId = entry.abilityId;
                template.passiveId = entry.passiveId;

                if (existing == null)
                {
                    AssetDatabase.CreateAsset(template, assetPath);
                }
                else
                {
                    EditorUtility.SetDirty(template);
                }
                created++;
            }

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("Imported " + created + " unit templates successfully.");
        }
    }
}

using UnityEngine;
using ShatteredVeil.Core.Units;

namespace ShatteredVeil.Data
{
    [CreateAssetMenu(fileName = "NewSynergy", menuName = "ShatteredVeil/Synergy")]
    public class SynergyDefinition : ScriptableObject, ISynergyDefinition
    {
        public SynergyType type;
        public string synergyId;
        public SynergyTierData[] tiers;

        // ISynergyDefinition implementation
        string ISynergyDefinition.SynergyId => synergyId;
        SynergyType ISynergyDefinition.Type => type;

        int[] ISynergyDefinition.Thresholds
        {
            get
            {
                if (tiers == null) return new int[0];
                var result = new int[tiers.Length];
                for (int i = 0; i < tiers.Length; i++)
                    result[i] = tiers[i].requiredCount;
                return result;
            }
        }

        string[] ISynergyDefinition.TierDescriptions
        {
            get
            {
                if (tiers == null) return new string[0];
                var result = new string[tiers.Length];
                for (int i = 0; i < tiers.Length; i++)
                    result[i] = tiers[i].description;
                return result;
            }
        }
    }

    [System.Serializable]
    public class SynergyTierData
    {
        public int requiredCount;
        public string description;
        public StatModifierData[] bonuses;
    }

    [System.Serializable]
    public class StatModifierData
    {
        public StatType stat;
        public ModifierType modType;
        public float value;
    }
}

using UnityEngine;
using ShatteredVeil.Core.Gacha;

namespace ShatteredVeil.Data
{
    [CreateAssetMenu(fileName = "GachaConfig", menuName = "ShatteredVeil/Gacha Config")]
    public class GachaConfig : ScriptableObject, IGachaConfig
    {
        [Header("Pull Costs")]
        [Tooltip("VE cost for a single roll")]
        public int singleRollCost = 50;

        [Tooltip("Number of rolls in a multi-roll")]
        public int multiRollCount = 10;

        [Tooltip("Total VE cost for a multi-roll (discounted)")]
        public int multiRollCost = 450;

        [Header("Pity")]
        [Tooltip("Guaranteed high-tier after this many rolls")]
        public int pityThreshold = 50;

        [Header("Rate Tables (by Player Level)")]
        public GachaRateTable[] rateTables;

        // IGachaConfig implementation
        int IGachaConfig.SingleRollCost => singleRollCost;
        int IGachaConfig.MultiRollCount => multiRollCount;
        int IGachaConfig.MultiRollCost => multiRollCost;
        int IGachaConfig.PityThreshold => pityThreshold;

        int[] IGachaConfig.GetTierWeights(int playerLevel)
        {
            if (rateTables == null || rateTables.Length == 0)
                return new[] { 100, 0, 0, 0, 0 };

            // Find the highest rate table that applies to this player level
            GachaRateTable bestMatch = rateTables[0];
            for (int i = 0; i < rateTables.Length; i++)
            {
                if (rateTables[i].minPlayerLevel <= playerLevel)
                    bestMatch = rateTables[i];
            }

            return new[]
            {
                bestMatch.t1Rate,
                bestMatch.t2Rate,
                bestMatch.t3Rate,
                bestMatch.t4Rate,
                bestMatch.t5Rate
            };
        }
    }

    [System.Serializable]
    public class GachaRateTable
    {
        public int minPlayerLevel;
        public int t1Rate;
        public int t2Rate;
        public int t3Rate;
        public int t4Rate;
        public int t5Rate;
    }
}

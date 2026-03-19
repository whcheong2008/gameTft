using UnityEngine;
using ShatteredVeil.Core.Gacha;

namespace ShatteredVeil.Data
{
    [CreateAssetMenu(fileName = "GachaConfig", menuName = "ShatteredVeil/Gacha Config")]
    public class GachaConfig : ScriptableObject, IGachaConfig
    {
        [Header("Pull Costs")]
        public int pullCostVE = 50;
        public int multiPullCount = 10;
        public int multiPullDiscount = 50;

        [Header("Pity")]
        public int hardPityThreshold = 50;
        public float softPityStartPull = 40;
        public float softPityRateIncrease = 1.0f;

        [Header("Evolved Copy")]
        public float evolvedCopyChance = 0.15f;

        [Header("Rate Tables (by Player Level)")]
        public GachaRateTable[] rateTables;

        // IGachaConfig implementation
        int IGachaConfig.PullCostVE => pullCostVE;
        int IGachaConfig.MultiPullCount => multiPullCount;
        int IGachaConfig.MultiPullDiscount => multiPullDiscount;
        int IGachaConfig.HardPityThreshold => hardPityThreshold;
        float IGachaConfig.SoftPityStartPull => softPityStartPull;
        float IGachaConfig.SoftPityRateIncrease => softPityRateIncrease;
        int IGachaConfig.RateTableCount => rateTables != null ? rateTables.Length : 0;
        float IGachaConfig.EvolvedCopyChance => evolvedCopyChance;

        float IGachaConfig.GetTierRate(int playerLevel, int tier)
        {
            if (rateTables == null || rateTables.Length == 0) return 0f;

            // Find the highest rate table that applies to this player level
            GachaRateTable bestMatch = rateTables[0];
            for (int i = 0; i < rateTables.Length; i++)
            {
                if (rateTables[i].minPlayerLevel <= playerLevel)
                    bestMatch = rateTables[i];
            }

            switch (tier)
            {
                case 1: return bestMatch.t1Rate;
                case 2: return bestMatch.t2Rate;
                case 3: return bestMatch.t3Rate;
                case 4: return bestMatch.t4Rate;
                case 5: return bestMatch.t5Rate;
                default: return 0f;
            }
        }
    }

    [System.Serializable]
    public class GachaRateTable
    {
        public int minPlayerLevel;
        public float t1Rate;
        public float t2Rate;
        public float t3Rate;
        public float t4Rate;
        public float t5Rate;
    }
}

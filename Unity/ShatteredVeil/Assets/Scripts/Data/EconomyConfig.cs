using UnityEngine;
using ShatteredVeil.Core.Economy;

namespace ShatteredVeil.Data
{
    [CreateAssetMenu(fileName = "EconomyConfig", menuName = "ShatteredVeil/Economy Config")]
    public class EconomyConfig : ScriptableObject, IEconomyConfig
    {
        [Header("Gacha")]
        public int pullCostVE = 50;

        [Header("XP Curve (XP needed for each level, index 0 = level 2)")]
        public int[] xpPerLevel;

        [Header("Level Caps (index = region 1-based, value = max level)")]
        public int[] levelCapPerRegion;

        [Header("Team Size Breakpoints")]
        public TeamSizeEntry[] teamSizeBreakpoints;

        [Header("Star-Up Copy Costs (index = tier 1-5, 0-indexed)")]
        public int[] starUpCopyCost;

        [Header("Star-Up VE Costs (index = current star level)")]
        public int[] starUpVECost;

        [Header("Evolution VE Costs (index = tier 1-5, 0-indexed)")]
        public int[] evolutionVECost;

        [Header("Camp Practices")]
        public CampPracticeConfig[] practices;

        // IEconomyConfig implementation
        int IEconomyConfig.PullCostVE => pullCostVE;

        int IEconomyConfig.GetXPForLevel(int level)
        {
            if (xpPerLevel == null) return 0;
            // level 2 is index 0, level 3 is index 1, etc.
            int index = level - 2;
            if (index < 0 || index >= xpPerLevel.Length) return 0;
            return xpPerLevel[index];
        }

        int IEconomyConfig.GetLevelCap(int region)
        {
            if (levelCapPerRegion == null) return 20;
            // region is 1-based
            if (region < 1) return 4;
            if (region >= levelCapPerRegion.Length) return 20;
            return levelCapPerRegion[region];
        }

        int IEconomyConfig.GetTeamSize(int level)
        {
            if (teamSizeBreakpoints == null || teamSizeBreakpoints.Length == 0) return 3;
            int size = 3;
            for (int i = 0; i < teamSizeBreakpoints.Length; i++)
            {
                if (level >= teamSizeBreakpoints[i].minLevel)
                    size = teamSizeBreakpoints[i].teamSize;
            }
            return size;
        }

        int IEconomyConfig.GetStarUpCopyCost(int tier)
        {
            if (starUpCopyCost == null) return 3;
            int index = tier - 1;
            if (index < 0 || index >= starUpCopyCost.Length) return 3;
            return starUpCopyCost[index];
        }

        int IEconomyConfig.GetStarUpVECost(int currentStar, int tier)
        {
            if (starUpVECost == null) return 0;
            if (currentStar < 0 || currentStar >= starUpVECost.Length) return 0;
            return starUpVECost[currentStar];
        }

        int IEconomyConfig.GetEvolutionVECost(int tier)
        {
            if (evolutionVECost == null) return 500;
            int index = tier - 1;
            if (index < 0 || index >= evolutionVECost.Length) return 500;
            return evolutionVECost[index];
        }

        int IEconomyConfig.GetPracticeMaxLevel(string practiceId)
        {
            var practice = FindPractice(practiceId);
            return practice != null ? practice.maxLevel : 0;
        }

        int IEconomyConfig.GetPracticeUpgradeCost(string practiceId, int currentLevel)
        {
            var practice = FindPractice(practiceId);
            if (practice == null) return 0;
            if (currentLevel >= practice.maxLevel) return 0;
            int nextLevel = currentLevel + 1;
            if (practice.upgradeCostVE == null || nextLevel >= practice.upgradeCostVE.Length) return 0;
            return practice.upgradeCostVE[nextLevel];
        }

        private CampPracticeConfig FindPractice(string practiceId)
        {
            if (practices == null) return null;
            for (int i = 0; i < practices.Length; i++)
            {
                if (practices[i].practiceId == practiceId)
                    return practices[i];
            }
            return null;
        }
    }

    [System.Serializable]
    public class TeamSizeEntry
    {
        public int minLevel;
        public int teamSize;
    }

    [System.Serializable]
    public class CampPracticeConfig
    {
        public string practiceId;
        public string displayName;
        public int maxLevel;
        public int[] upgradeCostVE;
    }
}

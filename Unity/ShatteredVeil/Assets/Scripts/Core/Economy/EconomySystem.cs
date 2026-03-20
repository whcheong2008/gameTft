using System;

namespace ShatteredVeil.Core.Economy
{
    public class EconomySystem
    {
        private readonly IEconomyConfig _config;

        public EconomySystem(IEconomyConfig config)
        {
            _config = config ?? throw new ArgumentNullException(nameof(config));
        }

        // --- Resources ---

        public bool CanAfford(int currentVE, int cost)
        {
            return currentVE >= cost;
        }

        public bool SpendVE(ref int currentVE, int cost)
        {
            if (currentVE < cost) return false;
            currentVE -= cost;
            return true;
        }

        public void GrantVE(ref int currentVE, int amount)
        {
            currentVE += amount;
        }

        // --- Leveling ---

        public int GetXPForLevel(int level)
        {
            return _config.GetXPForLevel(level);
        }

        public LevelUpResult AddXP(ref int currentXP, ref int currentLevel, int xpGained, int regionCap)
        {
            int startLevel = currentLevel;
            int startTeamSize = GetTeamSize(currentLevel);

            currentXP += xpGained;

            int levelsGained = 0;
            while (true)
            {
                int nextLevel = currentLevel + 1;
                if (nextLevel > 20) break;

                // Respect hard cap per region
                int cap = _config.GetLevelCap(regionCap);
                if (currentLevel >= cap) break;

                int xpNeeded = _config.GetXPForLevel(nextLevel);
                if (xpNeeded <= 0) break;
                if (currentXP < xpNeeded) break;

                currentXP -= xpNeeded;
                currentLevel = nextLevel;
                levelsGained++;
            }

            int newTeamSize = GetTeamSize(currentLevel);

            return new LevelUpResult
            {
                NewLevel = currentLevel,
                LevelsGained = levelsGained,
                TeamSizeChanged = newTeamSize != startTeamSize,
                NewTeamSize = newTeamSize,
                RemainingXP = currentXP
            };
        }

        public int GetTeamSize(int level)
        {
            return _config.GetTeamSize(level);
        }

        public int GetLevelCap(int currentRegion)
        {
            return _config.GetLevelCap(currentRegion);
        }

        // --- Star-Up ---

        public int GetStarUpCopyCost(int tier)
        {
            return _config.GetStarUpCopyCost(tier);
        }

        public int GetStarUpVECost(int currentStar, int tier)
        {
            return _config.GetStarUpVECost(currentStar, tier);
        }

        public bool CanStarUp(int currentStar, int copiesOwned, int tier, int currentVE)
        {
            if (currentStar >= 5) return false;
            int copyCost = _config.GetStarUpCopyCost(tier);
            int veCost = _config.GetStarUpVECost(currentStar, tier);
            return copiesOwned >= copyCost && currentVE >= veCost;
        }

        public StarUpResult StarUp(int currentStar, ref int copiesOwned, int tier, ref int currentVE)
        {
            if (!CanStarUp(currentStar, copiesOwned, tier, currentVE))
            {
                return new StarUpResult { Success = false };
            }

            int copyCost = _config.GetStarUpCopyCost(tier);
            int veCost = _config.GetStarUpVECost(currentStar, tier);

            copiesOwned -= copyCost;
            currentVE -= veCost;

            return new StarUpResult
            {
                Success = true,
                NewStar = currentStar + 1,
                CopiesSpent = copyCost,
                VESpent = veCost
            };
        }

        // --- Camp Practices ---

        public int GetPracticeCost(string practiceId, int currentLevel)
        {
            return _config.GetPracticeUpgradeCost(practiceId, currentLevel);
        }

        public bool UpgradePractice(string practiceId, ref int currentLevel, ref int currentVE)
        {
            int maxLevel = _config.GetPracticeMaxLevel(practiceId);
            if (currentLevel >= maxLevel) return false;

            int cost = _config.GetPracticeUpgradeCost(practiceId, currentLevel);
            if (cost <= 0) return false;

            if (currentVE < cost) return false;

            currentVE -= cost;
            currentLevel++;
            return true;
        }
    }
}

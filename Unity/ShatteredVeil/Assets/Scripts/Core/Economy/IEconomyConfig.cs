namespace ShatteredVeil.Core.Economy
{
    public interface IEconomyConfig
    {
        int PullCostVE { get; }
        int GetXPForLevel(int level);
        int GetLevelCap(int region);
        int GetTeamSize(int level);
        int GetStarUpCopyCost(int tier);
        int GetStarUpVECost(int currentStar, int tier);
        int GetEvolutionVECost(int tier);

        // Camp practices
        int GetPracticeMaxLevel(string practiceId);
        int GetPracticeUpgradeCost(string practiceId, int currentLevel);
    }
}

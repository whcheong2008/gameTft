namespace ShatteredVeil.Core.Gacha
{
    public interface IGachaConfig
    {
        int PullCostVE { get; }
        int MultiPullCount { get; }
        int MultiPullDiscount { get; }
        int HardPityThreshold { get; }
        float SoftPityStartPull { get; }
        float SoftPityRateIncrease { get; }
        float GetTierRate(int playerLevel, int tier);
        int RateTableCount { get; }
        float EvolvedCopyChance { get; }
    }
}

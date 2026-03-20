namespace ShatteredVeil.Core.Gacha
{
    /// <summary>
    /// Interface for gacha configuration — allows test doubles.
    /// Mirrors js/gacha.js constants: ROLL_COST, MULTI_ROLL_COST, TIER_WEIGHTS, PITY_THRESHOLD.
    /// </summary>
    public interface IGachaConfig
    {
        int SingleRollCost { get; }
        int MultiRollCount { get; }
        int MultiRollCost { get; }
        int PityThreshold { get; }

        /// <summary>
        /// Returns tier weights [T1%, T2%, T3%, T4%, T5%] for a given player level (1-20).
        /// </summary>
        int[] GetTierWeights(int playerLevel);
    }
}

namespace ShatteredVeil.Core.Items
{
    public static class EnhancementSystem
    {
        // Costs per level (+1 through +10)
        private static readonly int[] Costs = { 20, 30, 50, 80, 120, 180, 250, 350, 500, 750 };

        // Success rates per level (+1 through +10)
        private static readonly float[] SuccessRates = { 1.0f, 1.0f, 1.0f, 0.9f, 0.8f, 0.7f, 0.55f, 0.4f, 0.25f, 0.15f };

        // On failure: drop levels. Index = target level - 1.
        // +1 to +5: stay (0 drop). +6: drop to +5 (-1). +7: drop to +5 (-2).
        // +8: drop to +6 (-2). +9: drop to +7 (-2). +10: drop to +8 (-2).
        private static readonly int[] FailureDropLevels = { 0, 0, 0, 0, 0, 5, 5, 6, 7, 8 };

        // Stat bonus percentages per enhancement level (+1 through +10)
        private static readonly float[] StatBonusPct = { 0.05f, 0.10f, 0.15f, 0.22f, 0.30f, 0.40f, 0.52f, 0.66f, 0.82f, 1.00f };

        public const int MaxLevel = 10;
        public const int PityThreshold = 3;

        public static int GetEnhanceCost(int currentLevel)
        {
            if (currentLevel < 0 || currentLevel >= MaxLevel) return 0;
            return Costs[currentLevel];
        }

        public static float GetSuccessRate(int currentLevel)
        {
            if (currentLevel < 0 || currentLevel >= MaxLevel) return 0f;
            return SuccessRates[currentLevel];
        }

        public static int GetFailureDropLevel(int currentLevel)
        {
            // currentLevel is the current +N, targeting +N+1
            // On failure at targeting level (currentLevel+1), drop to FailureDropLevels[currentLevel]
            if (currentLevel < 0 || currentLevel >= MaxLevel) return currentLevel;
            return FailureDropLevels[currentLevel];
        }

        public static float GetStatBonusPct(int enhanceLevel)
        {
            if (enhanceLevel <= 0 || enhanceLevel > MaxLevel) return 0f;
            return StatBonusPct[enhanceLevel - 1];
        }

        public static EnhanceResult Enhance(Equipment item, System.Random rng, ref int consecutiveFailures)
        {
            if (item == null) return new EnhanceResult(false, 0);
            if (item.EnhanceLevel >= MaxLevel)
                return new EnhanceResult(false, item.EnhanceLevel);

            int targetLevel = item.EnhanceLevel + 1;
            float rate = SuccessRates[targetLevel - 1];

            // Pity: 3 consecutive failures at same level → guaranteed success
            bool pity = consecutiveFailures >= PityThreshold;

            if (pity || (float)rng.NextDouble() < rate)
            {
                // Success
                item.EnhanceLevel = targetLevel;
                consecutiveFailures = 0;
                return new EnhanceResult(true, targetLevel, pity);
            }
            else
            {
                // Failure
                int dropTo = FailureDropLevels[targetLevel - 1];
                if (dropTo < item.EnhanceLevel)
                    item.EnhanceLevel = dropTo;
                // else stay at current level
                consecutiveFailures++;
                return new EnhanceResult(false, item.EnhanceLevel);
            }
        }
    }
}

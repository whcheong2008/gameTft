using System.Collections.Generic;

namespace ShatteredVeil.Core.Gacha
{
    /// <summary>
    /// Default gacha configuration from GROUND-TRUTH.md section 10.
    /// Pure C# — no Unity dependencies.
    /// </summary>
    public class GachaConfig : IGachaConfig
    {
        public int SingleRollCost => 50;
        public int MultiRollCount => 10;
        public int MultiRollCost => 450;
        public int PityThreshold => 50;

        // Tier weight table indexed by player level (1-20).
        // Each row = [T1%, T2%, T3%, T4%, T5%].
        // From GROUND-TRUTH.md: T5 enters at L15 (2%), caps at 10% at L19-20.
        private static readonly Dictionary<int, int[]> TierWeights = new Dictionary<int, int[]>
        {
            { 1,  new[] { 75, 25, 0,  0,  0 } },
            { 2,  new[] { 75, 25, 0,  0,  0 } },
            { 3,  new[] { 60, 35, 5,  0,  0 } },
            { 4,  new[] { 60, 35, 5,  0,  0 } },
            { 5,  new[] { 45, 38, 17, 0,  0 } },
            { 6,  new[] { 45, 38, 17, 0,  0 } },
            { 7,  new[] { 35, 33, 32, 0,  0 } },
            { 8,  new[] { 35, 33, 32, 0,  0 } },
            { 9,  new[] { 28, 28, 38, 6,  0 } },
            { 10, new[] { 28, 28, 38, 6,  0 } },
            { 11, new[] { 22, 25, 40, 13, 0 } },
            { 12, new[] { 22, 25, 40, 13, 0 } },
            { 13, new[] { 18, 22, 38, 22, 0 } },
            { 14, new[] { 18, 22, 38, 22, 0 } },
            { 15, new[] { 15, 18, 35, 30, 2 } },
            { 16, new[] { 15, 18, 35, 30, 2 } },
            { 17, new[] { 12, 15, 30, 37, 6 } },
            { 18, new[] { 12, 15, 30, 37, 6 } },
            { 19, new[] { 10, 12, 25, 43, 10 } },
            { 20, new[] { 8,  10, 22, 50, 10 } },
        };

        public int[] GetTierWeights(int playerLevel)
        {
            int lvl = System.Math.Max(1, System.Math.Min(20, playerLevel));
            return TierWeights.TryGetValue(lvl, out var weights) ? weights : TierWeights[1];
        }
    }
}

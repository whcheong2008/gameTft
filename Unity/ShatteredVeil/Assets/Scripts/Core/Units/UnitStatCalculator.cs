using System;

namespace ShatteredVeil.Core.Units
{
    /// <summary>
    /// Calculates unit stats at different star levels.
    /// Star multipliers from GROUND-TRUTH.md section 4.
    /// Pure C# — no Unity dependencies.
    /// </summary>
    public static class UnitStatCalculator
    {
        // Star level multipliers (1-star = 1.0, 2-star = 1.4, 3-star = 1.8, etc.)
        // From TierScaling: T1 base 1.0, evolved 1.34×
        private static readonly double[] StarMultipliers = { 1.0, 1.4, 1.8, 2.3, 2.8, 3.2 };

        /// <summary>
        /// Get stat multiplier for a given star level (1-6).
        /// Stars 1-5 are normal, star 6 is max evolved.
        /// </summary>
        public static double GetStarMultiplier(int starLevel)
        {
            int idx = Math.Max(0, Math.Min(StarMultipliers.Length - 1, starLevel - 1));
            return StarMultipliers[idx];
        }

        public static int CalculateHP(IUnitData data, int starLevel)
        {
            return (int)Math.Floor(data.BaseHP * GetStarMultiplier(starLevel));
        }

        public static int CalculateATK(IUnitData data, int starLevel)
        {
            return (int)Math.Floor(data.BaseATK * GetStarMultiplier(starLevel));
        }

        public static int CalculateDEF(IUnitData data, int starLevel)
        {
            return (int)Math.Floor(data.BaseDEF * GetStarMultiplier(starLevel));
        }

        public static int CalculateSPD(IUnitData data, int starLevel)
        {
            return (int)Math.Floor(data.BaseSPD * GetStarMultiplier(starLevel));
        }
    }
}

using System;
using System.Collections.Generic;

namespace ShatteredVeil.Core.Units
{
    /// <summary>
    /// Handles star-up (merging copies), evolution, and sell values.
    /// Mirrors GROUND-TRUTH.md: star-up copies T1=3, T2=4, T3=5, T4=8, T5=10.
    /// Pure C# — no Unity dependencies.
    /// </summary>
    public static class EvolutionSystem
    {
        // Copies needed to star up, indexed by current star level (star 1->2, 2->3, etc.)
        // From GROUND-TRUTH.md: T1=3, T2=4, T3=5, T4=8, T5=10
        // These are per-tier copies needed, not per-star.
        // Actually from the architecture doc: Star-up copies: T1=3, T2=4, T3=5, T4=8, T5=10
        // This means cost-tier determines copies needed per star-up.
        private static readonly Dictionary<int, int> CopiesPerTier = new Dictionary<int, int>
        {
            { 1, 3 },
            { 2, 4 },
            { 3, 5 },
            { 4, 8 },
            { 5, 10 }
        };

        /// <summary>
        /// How many copies are needed to go from current star to next star.
        /// Based on the unit's cost tier.
        /// </summary>
        public static int GetCopiesNeeded(int costTier)
        {
            return CopiesPerTier.TryGetValue(costTier, out int copies) ? copies : 3;
        }

        /// <summary>
        /// Can the unit star up? Requires enough spare copies.
        /// </summary>
        public static bool CanStarUp(int costTier, int currentStars, int totalCopies, int maxStars = 5)
        {
            if (currentStars >= maxStars) return false;
            int needed = GetCopiesNeeded(costTier);
            int spareCopies = totalCopies - 1; // -1 for the unit itself
            return spareCopies >= needed;
        }

        /// <summary>
        /// Get spare copies available for star-up (total - 1 for the unit itself).
        /// </summary>
        public static int GetSpareCopies(int totalCopies)
        {
            return Math.Max(0, totalCopies - 1);
        }

        /// <summary>
        /// Perform star-up. Consumes copies and increments star level.
        /// Returns true if successful.
        /// </summary>
        public static bool TryStarUp(int costTier, ref int currentStars, ref int totalCopies, int maxStars = 5)
        {
            if (!CanStarUp(costTier, currentStars, totalCopies, maxStars))
                return false;

            int needed = GetCopiesNeeded(costTier);
            totalCopies -= needed;
            currentStars++;
            return true;
        }

        // --- Sell System (Echo Release) ---

        // VE earned per copy sold, by cost tier
        private static readonly Dictionary<int, int> SellValuePerTier = new Dictionary<int, int>
        {
            { 1, 5 },
            { 2, 10 },
            { 3, 20 },
            { 4, 40 },
            { 5, 80 }
        };

        /// <summary>
        /// Get VE earned from selling one copy of a unit at the given cost tier.
        /// </summary>
        public static int GetSellValue(int costTier)
        {
            return SellValuePerTier.TryGetValue(costTier, out int val) ? val : 5;
        }

        /// <summary>
        /// Get total VE from selling N copies.
        /// </summary>
        public static int GetSellTotal(int costTier, int count)
        {
            return GetSellValue(costTier) * count;
        }

        /// <summary>
        /// Sell N copies of a unit. Returns VE earned, or -1 if not enough copies.
        /// </summary>
        public static int SellCopies(int costTier, int count, ref int totalCopies)
        {
            int spareCopies = GetSpareCopies(totalCopies);
            if (count <= 0 || count > spareCopies)
                return -1;

            totalCopies -= count;
            return GetSellTotal(costTier, count);
        }

        // --- Evolution (Deep Resonance) ---

        // Evolution pairs: base unit -> evolved unit
        // Cost in VE by tier: T3=500, T4=1000, T5=2000
        private static readonly Dictionary<int, int> EvolutionCostByTier = new Dictionary<int, int>
        {
            { 3, 500 },
            { 4, 1000 },
            { 5, 2000 }
        };

        /// <summary>
        /// Get VE cost to evolve a unit of the given tier.
        /// Only T3+ can evolve.
        /// </summary>
        public static int GetEvolutionCost(int costTier, double costMultiplier = 1.0)
        {
            if (!EvolutionCostByTier.TryGetValue(costTier, out int baseCost))
                return -1; // Cannot evolve this tier
            return (int)Math.Floor(baseCost * costMultiplier);
        }

        /// <summary>
        /// Can a unit be evolved?
        /// Requires: T3+, max stars, evolution exists, building unlocked.
        /// </summary>
        public static bool CanEvolve(int costTier, int currentStars, int maxStars, bool hasEvolution, bool buildingUnlocked)
        {
            if (costTier < 3) return false;
            if (currentStars < maxStars) return false;
            if (!hasEvolution) return false;
            if (!buildingUnlocked) return false;
            return true;
        }
    }
}

using System;
using System.Collections.Generic;

namespace ShatteredVeil.Core.Gacha
{
    /// <summary>
    /// Pure C# gacha rolling system. Mirrors js/gacha.js.
    /// Handles: tier-weighted rolls, pity counter, evolved copy chance.
    /// No Unity dependencies — fully unit-testable.
    /// </summary>
    public class GachaSystem
    {
        private readonly IGachaConfig config;
        private readonly Random rng;

        // Pool of unit IDs grouped by cost tier (1-5)
        private readonly Dictionary<int, List<string>> unitsByTier;

        // Evolution map: baseUnitId -> evolvedUnitId
        private readonly Dictionary<string, string> evolutionMap;

        // Player state
        private int playerLevel;
        private int veilEssence;
        private int rollsSincePity;
        private int totalRolls;

        // Collection: unitId -> owned copies info
        private readonly Dictionary<string, OwnedUnit> collection;

        // Pity override from buildings (Attunement Rite)
        private int pityThresholdOverride;
        private int pityMinTierOverride;

        // Multi-roll discount from buildings
        private int multiRollDiscount;

        public event Action<int> OnVeilEssenceChanged;
        public event Action<string, int> OnUnitAdded; // unitId, newCopyCount

        public GachaSystem(
            IGachaConfig config,
            Dictionary<int, List<string>> unitsByTier,
            Dictionary<string, string> evolutionMap,
            int playerLevel,
            int veilEssence,
            int rollsSincePity,
            int totalRolls,
            Dictionary<string, OwnedUnit> collection,
            Random rng = null)
        {
            this.config = config ?? throw new ArgumentNullException(nameof(config));
            this.unitsByTier = unitsByTier ?? new Dictionary<int, List<string>>();
            this.evolutionMap = evolutionMap ?? new Dictionary<string, string>();
            this.playerLevel = Math.Max(1, Math.Min(20, playerLevel));
            this.veilEssence = veilEssence;
            this.rollsSincePity = rollsSincePity;
            this.totalRolls = totalRolls;
            this.collection = collection ?? new Dictionary<string, OwnedUnit>();
            this.rng = rng ?? new Random();
        }

        // --- Getters ---

        public int PlayerLevel => playerLevel;
        public int VeilEssence => veilEssence;
        public int RollsSincePity => rollsSincePity;
        public int TotalRolls => totalRolls;
        public int SingleRollCost => config.SingleRollCost;
        public int MultiRollCost => Math.Max(0, config.MultiRollCost - multiRollDiscount);
        public int PityThreshold => pityThresholdOverride > 0 ? pityThresholdOverride : config.PityThreshold;
        public int PityMinTier => pityMinTierOverride > 0 ? pityMinTierOverride : 5;
        public int RollsUntilPity => Math.Max(0, PityThreshold - rollsSincePity);

        public void SetPlayerLevel(int level) => playerLevel = Math.Max(1, Math.Min(20, level));
        public void SetVeilEssence(int ve)
        {
            veilEssence = ve;
            OnVeilEssenceChanged?.Invoke(ve);
        }

        public void SetMultiRollDiscount(int discount) => multiRollDiscount = discount;

        /// <summary>
        /// Set pity override from Attunement Rite building.
        /// Base pity: 50 rolls -> T5. Rite L4: 20 rolls -> T3+. Rite L5: 30 rolls -> T4+.
        /// </summary>
        public void SetPityOverride(int threshold, int minTier)
        {
            pityThresholdOverride = threshold;
            pityMinTierOverride = minTier;
        }

        public void ClearPityOverride()
        {
            pityThresholdOverride = 0;
            pityMinTierOverride = 0;
        }

        /// <summary>
        /// Get tier weights for current player level as percentages [T1%, T2%, T3%, T4%, T5%].
        /// </summary>
        public int[] GetCurrentTierWeights()
        {
            return config.GetTierWeights(playerLevel);
        }

        /// <summary>
        /// Format tier weights as a display string.
        /// </summary>
        public string FormatTierWeights()
        {
            var weights = GetCurrentTierWeights();
            var parts = new List<string>();
            for (int i = 0; i < weights.Length; i++)
            {
                if (weights[i] > 0)
                    parts.Add($"T{i + 1}: {weights[i]}%");
            }
            return string.Join(", ", parts);
        }

        // --- Rolling ---

        /// <summary>
        /// Roll a random tier based on weights for the current player level.
        /// Returns tier 1-5.
        /// </summary>
        public int RollTier()
        {
            var weights = config.GetTierWeights(playerLevel);
            double roll = rng.NextDouble() * 100.0;
            double cumulative = 0;
            for (int i = 0; i < weights.Length; i++)
            {
                cumulative += weights[i];
                if (roll < cumulative)
                    return i + 1;
            }
            return 1; // fallback
        }

        /// <summary>
        /// Pick a random unit from the given tier.
        /// Falls back to T1 if the tier has no units.
        /// </summary>
        public string PickRandomUnit(int tier)
        {
            if (unitsByTier.TryGetValue(tier, out var pool) && pool.Count > 0)
            {
                return pool[rng.Next(pool.Count)];
            }
            // Fallback to T1
            if (unitsByTier.TryGetValue(1, out var fallback) && fallback.Count > 0)
            {
                return fallback[rng.Next(fallback.Count)];
            }
            return null;
        }

        /// <summary>
        /// Check and trigger pity. Returns minimum tier override (0 = no pity).
        /// </summary>
        private int CheckPity()
        {
            int threshold = PityThreshold;
            int minTier = PityMinTier;

            if (rollsSincePity >= threshold)
            {
                rollsSincePity = 0;
                return minTier;
            }
            return 0;
        }

        /// <summary>
        /// Perform a single roll. Deducts VE, applies pity, adds to collection.
        /// </summary>
        public GachaPullResult DoSingleRoll()
        {
            if (veilEssence < config.SingleRollCost)
                return new GachaPullResult { Success = false, Reason = "Not enough VE" };

            veilEssence -= config.SingleRollCost;
            OnVeilEssenceChanged?.Invoke(veilEssence);

            rollsSincePity++;
            totalRolls++;

            int pityMinTier = CheckPity();
            int tier = RollTier();

            if (pityMinTier > 0 && tier < pityMinTier)
                tier = pityMinTier;

            string unitId = PickRandomUnit(tier);
            if (unitId == null)
                return new GachaPullResult { Success = false, Reason = "No units in pool" };

            bool isEvolvedCopy = false;
            // 15% chance to get evolved copy if player owns the evolved form
            if (evolutionMap.TryGetValue(unitId, out string evolvedId) && collection.ContainsKey(evolvedId))
            {
                if (rng.NextDouble() < 0.15)
                {
                    unitId = evolvedId;
                    isEvolvedCopy = true;
                }
            }

            bool isNew = !collection.ContainsKey(unitId);
            AddToCollection(unitId);

            return new GachaPullResult
            {
                Success = true,
                UnitId = unitId,
                Tier = tier,
                PityTriggered = pityMinTier > 0,
                IsNew = isNew,
                IsEvolvedCopy = isEvolvedCopy
            };
        }

        /// <summary>
        /// Perform a 10x multi-roll.
        /// </summary>
        public GachaMultiPullResult DoMultiRoll()
        {
            int cost = MultiRollCost;
            if (veilEssence < cost)
                return new GachaMultiPullResult { Success = false, Reason = $"Not enough VE (need {cost})" };

            veilEssence -= cost;
            OnVeilEssenceChanged?.Invoke(veilEssence);

            var results = new GachaPullResult[config.MultiRollCount];
            for (int i = 0; i < config.MultiRollCount; i++)
            {
                rollsSincePity++;
                totalRolls++;

                int pityMinTier = CheckPity();
                int tier = RollTier();

                if (pityMinTier > 0 && tier < pityMinTier)
                    tier = pityMinTier;

                string unitId = PickRandomUnit(tier);

                bool isEvolvedCopy = false;
                if (unitId != null && evolutionMap.TryGetValue(unitId, out string evolvedId) && collection.ContainsKey(evolvedId))
                {
                    if (rng.NextDouble() < 0.15)
                    {
                        unitId = evolvedId;
                        isEvolvedCopy = true;
                    }
                }

                bool isNew = unitId != null && !collection.ContainsKey(unitId);
                if (unitId != null)
                    AddToCollection(unitId);

                results[i] = new GachaPullResult
                {
                    Success = unitId != null,
                    UnitId = unitId,
                    Tier = tier,
                    PityTriggered = pityMinTier > 0,
                    IsNew = isNew,
                    IsEvolvedCopy = isEvolvedCopy
                };
            }

            return new GachaMultiPullResult
            {
                Success = true,
                Results = results,
                TotalCost = cost
            };
        }

        // --- Collection ---

        private void AddToCollection(string unitId)
        {
            if (!collection.ContainsKey(unitId))
            {
                collection[unitId] = new OwnedUnit { UnitId = unitId, Stars = 1, Copies = 1 };
            }
            else
            {
                collection[unitId].Copies++;
            }
            OnUnitAdded?.Invoke(unitId, collection[unitId].Copies);
        }

        public bool OwnsUnit(string unitId) => collection.ContainsKey(unitId);

        public OwnedUnit GetOwnedUnit(string unitId)
        {
            return collection.TryGetValue(unitId, out var unit) ? unit : null;
        }

        public Dictionary<string, OwnedUnit> GetCollection() => collection;

        public bool CanAffordSingleRoll() => veilEssence >= config.SingleRollCost;
        public bool CanAffordMultiRoll() => veilEssence >= MultiRollCost;
    }

    /// <summary>
    /// Represents an owned unit in the player's collection.
    /// </summary>
    public class OwnedUnit
    {
        public string UnitId { get; set; }
        public int Stars { get; set; } = 1;
        public int Copies { get; set; } = 1;
    }
}

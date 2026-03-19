using System;
using System.Collections.Generic;

namespace ShatteredVeil.Core.Gacha
{
    public class GachaSystem
    {
        private readonly IGachaConfig _config;
        private readonly Random _rng;

        public GachaSystem(IGachaConfig config, Random rng)
        {
            _config = config ?? throw new ArgumentNullException(nameof(config));
            _rng = rng ?? throw new ArgumentNullException(nameof(rng));
        }

        public GachaPullResult Pull(
            int playerLevel,
            int currentPityCount,
            IReadOnlyList<string> unitsByTier1,
            IReadOnlyList<string> unitsByTier2,
            IReadOnlyList<string> unitsByTier3,
            IReadOnlyList<string> unitsByTier4,
            IReadOnlyList<string> unitsByTier5,
            Func<string, string> getEvolvedForm = null,
            Func<string, bool> ownsEvolvedForm = null)
        {
            int newPity = currentPityCount + 1;

            // Get rates for this player level
            float[] rates = GetRatesArray(playerLevel);

            // Check hard pity
            bool isPity = false;
            int rolledTier;

            if (newPity >= _config.HardPityThreshold)
            {
                // Hard pity: force highest available tier
                rolledTier = GetHighestAvailableTier(rates);
                isPity = true;
                newPity = 0;
            }
            else
            {
                // Apply soft pity adjustment
                float[] adjustedRates = ApplySoftPity(rates, newPity);

                // Roll tier
                rolledTier = RollTier(adjustedRates);
            }

            // Get unit pool for rolled tier
            var pool = GetPoolForTier(rolledTier, unitsByTier1, unitsByTier2, unitsByTier3, unitsByTier4, unitsByTier5);

            // Fallback to T1 if pool is empty
            if (pool == null || pool.Count == 0)
                pool = unitsByTier1;

            // Pick random unit
            string unitId = pool[_rng.Next(pool.Count)];

            // Evolved copy mechanic: 15% chance if player owns evolved form
            bool isEvolvedCopy = false;
            if (getEvolvedForm != null && ownsEvolvedForm != null)
            {
                string evolved = getEvolvedForm(unitId);
                if (evolved != null && ownsEvolvedForm(evolved))
                {
                    if (_rng.NextDouble() < _config.EvolvedCopyChance)
                    {
                        unitId = evolved;
                        isEvolvedCopy = true;
                    }
                }
            }

            // Reset pity if we got a high-tier (T5 for base pity)
            if (rolledTier >= 5 && !isPity)
            {
                newPity = 0;
            }

            return new GachaPullResult
            {
                UnitId = unitId,
                Tier = rolledTier,
                IsPity = isPity,
                NewPityCount = newPity,
                IsEvolvedCopy = isEvolvedCopy
            };
        }

        public List<GachaPullResult> MultiPull(
            int playerLevel,
            int currentPityCount,
            int count,
            IReadOnlyList<string> unitsByTier1,
            IReadOnlyList<string> unitsByTier2,
            IReadOnlyList<string> unitsByTier3,
            IReadOnlyList<string> unitsByTier4,
            IReadOnlyList<string> unitsByTier5,
            Func<string, string> getEvolvedForm = null,
            Func<string, bool> ownsEvolvedForm = null)
        {
            var results = new List<GachaPullResult>(count);
            int pity = currentPityCount;

            for (int i = 0; i < count; i++)
            {
                var result = Pull(playerLevel, pity, unitsByTier1, unitsByTier2,
                    unitsByTier3, unitsByTier4, unitsByTier5,
                    getEvolvedForm, ownsEvolvedForm);
                pity = result.NewPityCount;
                results.Add(result);
            }

            return results;
        }

        public RateDisplay GetCurrentRates(int playerLevel, int currentPityCount)
        {
            float[] rates = GetRatesArray(playerLevel);
            float[] adjusted = ApplySoftPity(rates, currentPityCount);

            return new RateDisplay
            {
                T1Rate = adjusted[0],
                T2Rate = adjusted[1],
                T3Rate = adjusted[2],
                T4Rate = adjusted[3],
                T5Rate = adjusted[4]
            };
        }

        private float[] GetRatesArray(int playerLevel)
        {
            var rates = new float[5];
            for (int t = 1; t <= 5; t++)
                rates[t - 1] = _config.GetTierRate(playerLevel, t);
            return rates;
        }

        private float[] ApplySoftPity(float[] baseRates, int currentPityCount)
        {
            if (_config.SoftPityStartPull <= 0 || currentPityCount < _config.SoftPityStartPull)
                return (float[])baseRates.Clone();

            float[] adjusted = (float[])baseRates.Clone();

            // Soft pity: increase highest available tier rate
            int highestTier = GetHighestAvailableTier(baseRates) - 1; // 0-indexed
            if (highestTier < 0) return adjusted;

            float pullsPastSoftPity = currentPityCount - _config.SoftPityStartPull;
            float bonusRate = pullsPastSoftPity * _config.SoftPityRateIncrease;

            adjusted[highestTier] += bonusRate;

            // Redistribute: steal proportionally from lower tiers
            float totalLower = 0f;
            for (int i = 0; i < highestTier; i++)
                totalLower += adjusted[i];

            if (totalLower > 0 && bonusRate > 0)
            {
                float reduction = System.Math.Min(bonusRate, totalLower);
                for (int i = 0; i < highestTier; i++)
                {
                    float proportion = adjusted[i] / totalLower;
                    adjusted[i] -= reduction * proportion;
                    if (adjusted[i] < 0) adjusted[i] = 0;
                }
            }

            return adjusted;
        }

        private int RollTier(float[] rates)
        {
            double roll = _rng.NextDouble() * 100.0;
            double cumulative = 0;

            for (int i = 0; i < rates.Length; i++)
            {
                cumulative += rates[i];
                if (roll < cumulative) return i + 1;
            }

            return 1; // fallback
        }

        private int GetHighestAvailableTier(float[] rates)
        {
            for (int i = rates.Length - 1; i >= 0; i--)
            {
                if (rates[i] > 0) return i + 1;
            }
            return 1;
        }

        private IReadOnlyList<string> GetPoolForTier(
            int tier,
            IReadOnlyList<string> t1,
            IReadOnlyList<string> t2,
            IReadOnlyList<string> t3,
            IReadOnlyList<string> t4,
            IReadOnlyList<string> t5)
        {
            switch (tier)
            {
                case 1: return t1;
                case 2: return t2;
                case 3: return t3;
                case 4: return t4;
                case 5: return t5;
                default: return t1;
            }
        }
    }
}

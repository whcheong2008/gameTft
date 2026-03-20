namespace ShatteredVeil.Core.Items
{
    public static class EchoShapingSystem
    {
        public const int BaseRerollCost = 100;

        /// <summary>
        /// Reroll affixes on an item. Locked affixes are preserved, others rerolled.
        /// Only works on Rare+ items.
        /// Cost increases per reroll (baseRerollCost * (1 + rerollCount * 0.5)).
        /// </summary>
        /// <param name="item">The equipment to reroll</param>
        /// <param name="lockedAffixes">Which affixes to keep (index-aligned with item.Affixes)</param>
        /// <param name="rng">RNG source</param>
        /// <param name="currentVE">Player's VE, will be reduced on success</param>
        /// <param name="rerollCount">Number of previous rerolls (for cost scaling)</param>
        /// <returns>True if reroll succeeded, false if invalid or insufficient VE</returns>
        public static bool RerollAffixes(Equipment item, bool[] lockedAffixes, System.Random rng,
            ref int currentVE, int rerollCount = 0)
        {
            if (item == null) return false;

            // Only Rare+ items can be rerolled
            if (item.Rarity < ItemRarity.Rare) return false;

            // Calculate cost
            int cost = (int)(BaseRerollCost * (1.0f + rerollCount * 0.5f));
            if (currentVE < cost) return false;

            currentVE -= cost;

            int affixCount = ItemGenerator.GetAffixCount(item.Rarity);
            var pool = ItemAffixPool.GetAffixesForSlot(item.Slot);
            if (pool.Length == 0) return false;

            // Collect locked keys to exclude from pool
            var lockedKeys = new System.Collections.Generic.HashSet<string>();
            if (lockedAffixes != null)
            {
                for (int i = 0; i < lockedAffixes.Length && i < item.Affixes.Count; i++)
                {
                    if (lockedAffixes[i])
                        lockedKeys.Add(item.Affixes[i].StatKey);
                }
            }

            // Build available pool (exclude locked keys)
            var available = new System.Collections.Generic.List<AffixDefinition>();
            for (int i = 0; i < pool.Length; i++)
            {
                if (!lockedKeys.Contains(pool[i].Key))
                    available.Add(pool[i]);
            }

            // Reroll unlocked affixes
            int rerolled = 0;
            for (int i = 0; i < item.Affixes.Count; i++)
            {
                bool isLocked = lockedAffixes != null && i < lockedAffixes.Length && lockedAffixes[i];
                if (isLocked) continue;

                if (available.Count == 0) break;
                int pick = rng.Next(available.Count);
                var def = available[pick];
                available.RemoveAt(pick);

                float value = def.RangeMin + (float)(rng.NextDouble() * (def.RangeMax - def.RangeMin));
                value = (float)System.Math.Round(value, 2);
                item.Affixes[i] = new Affix(def.Key, value, def.RangeMin, def.RangeMax);
                rerolled++;
            }

            return rerolled > 0;
        }
    }
}

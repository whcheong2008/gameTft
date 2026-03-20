namespace ShatteredVeil.Core.Items
{
    public static class ItemGenerator
    {
        // Tier stat multipliers: T1=1.0, T2=1.5, T3=2.17, T4=3.0, T5=4.0
        private static readonly float[] TierMultipliers = { 1.0f, 1.5f, 2.17f, 3.0f, 4.0f };

        // Rarity stat multipliers: Common=1.0, Uncommon=1.2, Rare=1.5, Epic=1.8, Legendary=2.2
        private static readonly float[] RarityMultipliers = { 1.0f, 1.2f, 1.5f, 1.8f, 2.2f };

        // Rarity drop weights: Common 50, Uncommon 30, Rare 13, Epic 5.5, Legendary 1.5
        private static readonly float[] RarityWeights = { 50f, 30f, 13f, 5.5f, 1.5f };

        // Affix count per rarity: Common=0, Uncommon=1, Rare=2, Epic=2, Legendary=3
        private static readonly int[] AffixCounts = { 0, 1, 2, 2, 3 };

        // Socket count per rarity: Common=0, Uncommon=0, Rare=1, Epic=1, Legendary=2
        private static readonly int[] SocketCounts = { 0, 0, 1, 1, 2 };

        // Base stat value used for base stat calculation (reference: weapon ATK 12)
        private const int BaseStat = 12;

        public static float GetTierMultiplier(ItemTier tier)
        {
            int idx = (int)tier - 1;
            if (idx < 0 || idx >= TierMultipliers.Length) return 1.0f;
            return TierMultipliers[idx];
        }

        public static float GetRarityMultiplier(ItemRarity rarity)
        {
            int idx = (int)rarity;
            if (idx < 0 || idx >= RarityMultipliers.Length) return 1.0f;
            return RarityMultipliers[idx];
        }

        public static int GetAffixCount(ItemRarity rarity)
        {
            int idx = (int)rarity;
            if (idx < 0 || idx >= AffixCounts.Length) return 0;
            return AffixCounts[idx];
        }

        public static int GetSocketCount(ItemRarity rarity)
        {
            int idx = (int)rarity;
            if (idx < 0 || idx >= SocketCounts.Length) return 0;
            return SocketCounts[idx];
        }

        public static ItemRarity RollRarity(System.Random rng)
        {
            float total = 0f;
            for (int i = 0; i < RarityWeights.Length; i++) total += RarityWeights[i];

            float roll = (float)(rng.NextDouble() * total);
            float cumulative = 0f;
            for (int i = 0; i < RarityWeights.Length; i++)
            {
                cumulative += RarityWeights[i];
                if (roll < cumulative)
                    return (ItemRarity)i;
            }
            return ItemRarity.Common;
        }

        public static Equipment GenerateItem(ItemSlot slot, ItemTier tier, System.Random rng)
        {
            var rarity = RollRarity(rng);
            return GenerateItem(slot, tier, rarity, rng);
        }

        public static Equipment GenerateItem(ItemSlot slot, ItemTier tier, ItemRarity rarity, System.Random rng)
        {
            var item = new Equipment
            {
                Slot = slot,
                Tier = tier,
                Rarity = rarity,
                EnhanceLevel = 0
            };

            // Calculate base stat: baseStat * tierMult * rarityMult
            float tierMult = GetTierMultiplier(tier);
            float rarityMult = GetRarityMultiplier(rarity);
            item.BaseStatValue = (int)System.Math.Floor(BaseStat * tierMult * rarityMult);

            // Roll affixes
            int affixCount = GetAffixCount(rarity);
            item.Affixes = ItemAffixPool.RollAffixes(slot, affixCount, rng);

            // Set socket count
            int socketCount = GetSocketCount(rarity);
            item.Sockets = new Gem[socketCount];

            return item;
        }
    }
}

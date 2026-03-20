using NUnit.Framework;
using ShatteredVeil.Core.Items;

namespace ShatteredVeil.Tests.EditMode.Items
{
    [TestFixture]
    public class ItemGeneratorTests
    {
        [Test]
        public void GeneratedItem_HasCorrectTierAndSlot()
        {
            var rng = new System.Random(42);
            var item = ItemGenerator.GenerateItem(ItemSlot.Weapon, ItemTier.T3, rng);

            Assert.AreEqual(ItemSlot.Weapon, item.Slot);
            Assert.AreEqual(ItemTier.T3, item.Tier);
        }

        [Test]
        public void GeneratedItem_HasValidId()
        {
            var rng = new System.Random(42);
            var item = ItemGenerator.GenerateItem(ItemSlot.Helm, ItemTier.T1, rng);

            Assert.IsFalse(string.IsNullOrEmpty(item.Id));
        }

        [Test]
        public void RarityDistribution_Within2Percent()
        {
            var rng = new System.Random(12345);
            int total = 10000;
            int[] counts = new int[5]; // Common, Uncommon, Rare, Epic, Legendary

            for (int i = 0; i < total; i++)
            {
                var rarity = ItemGenerator.RollRarity(rng);
                counts[(int)rarity]++;
            }

            // Expected: Common 50%, Uncommon 30%, Rare 13%, Epic 5.5%, Legendary 1.5%
            float[] expected = { 0.50f, 0.30f, 0.13f, 0.055f, 0.015f };
            float tolerance = 0.02f;

            for (int i = 0; i < 5; i++)
            {
                float actual = counts[i] / (float)total;
                Assert.AreEqual(expected[i], actual, tolerance,
                    $"Rarity {(ItemRarity)i}: expected {expected[i]:P1}, got {actual:P1}");
            }
        }

        [Test]
        public void BaseStat_MatchesTierRarityFormula()
        {
            var rng = new System.Random(42);

            // T1 Common: 12 * 1.0 * 1.0 = 12
            var item = ItemGenerator.GenerateItem(ItemSlot.Weapon, ItemTier.T1, ItemRarity.Common, rng);
            Assert.AreEqual(12, item.BaseStatValue);

            // T3 Common: 12 * 2.17 * 1.0 = 26.04 -> floor = 26
            item = ItemGenerator.GenerateItem(ItemSlot.Weapon, ItemTier.T3, ItemRarity.Common, rng);
            Assert.AreEqual(26, item.BaseStatValue);

            // T1 Legendary: 12 * 1.0 * 2.2 = 26.4 -> floor = 26
            item = ItemGenerator.GenerateItem(ItemSlot.Weapon, ItemTier.T1, ItemRarity.Legendary, rng);
            Assert.AreEqual(26, item.BaseStatValue);

            // T5 Legendary: 12 * 4.0 * 2.2 = 105.6 -> floor = 105
            item = ItemGenerator.GenerateItem(ItemSlot.Weapon, ItemTier.T5, ItemRarity.Legendary, rng);
            Assert.AreEqual(105, item.BaseStatValue);

            // T2 Uncommon: 12 * 1.5 * 1.2 = 21.6 -> floor = 21
            item = ItemGenerator.GenerateItem(ItemSlot.Weapon, ItemTier.T2, ItemRarity.Uncommon, rng);
            Assert.AreEqual(21, item.BaseStatValue);
        }

        [Test]
        public void AffixCount_MatchesRarity()
        {
            var rng = new System.Random(42);

            // Common: 0 affixes
            var item = ItemGenerator.GenerateItem(ItemSlot.Weapon, ItemTier.T1, ItemRarity.Common, rng);
            Assert.AreEqual(0, item.Affixes.Count);

            // Uncommon: 1 affix
            item = ItemGenerator.GenerateItem(ItemSlot.Weapon, ItemTier.T1, ItemRarity.Uncommon, rng);
            Assert.AreEqual(1, item.Affixes.Count);

            // Rare: 2 affixes
            item = ItemGenerator.GenerateItem(ItemSlot.Weapon, ItemTier.T1, ItemRarity.Rare, rng);
            Assert.AreEqual(2, item.Affixes.Count);

            // Epic: 2 affixes
            item = ItemGenerator.GenerateItem(ItemSlot.Weapon, ItemTier.T1, ItemRarity.Epic, rng);
            Assert.AreEqual(2, item.Affixes.Count);

            // Legendary: 3 affixes
            item = ItemGenerator.GenerateItem(ItemSlot.Weapon, ItemTier.T1, ItemRarity.Legendary, rng);
            Assert.AreEqual(3, item.Affixes.Count);
        }

        [Test]
        public void SocketCount_MatchesRarity()
        {
            var rng = new System.Random(42);

            // Common: 0 sockets
            var item = ItemGenerator.GenerateItem(ItemSlot.Weapon, ItemTier.T1, ItemRarity.Common, rng);
            Assert.AreEqual(0, item.Sockets.Length);

            // Uncommon: 0 sockets
            item = ItemGenerator.GenerateItem(ItemSlot.Weapon, ItemTier.T1, ItemRarity.Uncommon, rng);
            Assert.AreEqual(0, item.Sockets.Length);

            // Rare: 1 socket
            item = ItemGenerator.GenerateItem(ItemSlot.Weapon, ItemTier.T1, ItemRarity.Rare, rng);
            Assert.AreEqual(1, item.Sockets.Length);

            // Epic: 1 socket
            item = ItemGenerator.GenerateItem(ItemSlot.Weapon, ItemTier.T1, ItemRarity.Epic, rng);
            Assert.AreEqual(1, item.Sockets.Length);

            // Legendary: 2 sockets
            item = ItemGenerator.GenerateItem(ItemSlot.Weapon, ItemTier.T1, ItemRarity.Legendary, rng);
            Assert.AreEqual(2, item.Sockets.Length);
        }

        [Test]
        public void Affixes_NoDuplicates()
        {
            var rng = new System.Random(42);
            // Legendary has 3 affixes — check no duplicate keys
            var item = ItemGenerator.GenerateItem(ItemSlot.Weapon, ItemTier.T1, ItemRarity.Legendary, rng);
            var keys = new System.Collections.Generic.HashSet<string>();
            foreach (var affix in item.Affixes)
            {
                Assert.IsTrue(keys.Add(affix.StatKey),
                    $"Duplicate affix key: {affix.StatKey}");
            }
        }

        [Test]
        public void Affixes_ValuesWithinRange()
        {
            var rng = new System.Random(42);
            for (int i = 0; i < 100; i++)
            {
                var item = ItemGenerator.GenerateItem(ItemSlot.Weapon, ItemTier.T3, ItemRarity.Legendary, rng);
                foreach (var affix in item.Affixes)
                {
                    Assert.GreaterOrEqual(affix.Value, affix.RollMin,
                        $"Affix {affix.StatKey} value {affix.Value} below min {affix.RollMin}");
                    Assert.LessOrEqual(affix.Value, affix.RollMax,
                        $"Affix {affix.StatKey} value {affix.Value} above max {affix.RollMax}");
                }
            }
        }

        [Test]
        public void TierMultipliers_MatchGroundTruth()
        {
            Assert.AreEqual(1.0f, ItemGenerator.GetTierMultiplier(ItemTier.T1), 0.001f);
            Assert.AreEqual(1.5f, ItemGenerator.GetTierMultiplier(ItemTier.T2), 0.001f);
            Assert.AreEqual(2.17f, ItemGenerator.GetTierMultiplier(ItemTier.T3), 0.001f);
            Assert.AreEqual(3.0f, ItemGenerator.GetTierMultiplier(ItemTier.T4), 0.001f);
            Assert.AreEqual(4.0f, ItemGenerator.GetTierMultiplier(ItemTier.T5), 0.001f);
        }

        [Test]
        public void RarityMultipliers_MatchGroundTruth()
        {
            Assert.AreEqual(1.0f, ItemGenerator.GetRarityMultiplier(ItemRarity.Common), 0.001f);
            Assert.AreEqual(1.2f, ItemGenerator.GetRarityMultiplier(ItemRarity.Uncommon), 0.001f);
            Assert.AreEqual(1.5f, ItemGenerator.GetRarityMultiplier(ItemRarity.Rare), 0.001f);
            Assert.AreEqual(1.8f, ItemGenerator.GetRarityMultiplier(ItemRarity.Epic), 0.001f);
            Assert.AreEqual(2.2f, ItemGenerator.GetRarityMultiplier(ItemRarity.Legendary), 0.001f);
        }
    }
}

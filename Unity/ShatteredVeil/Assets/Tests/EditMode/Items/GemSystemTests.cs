using NUnit.Framework;
using ShatteredVeil.Core.Items;

namespace ShatteredVeil.Tests.EditMode.Items
{
    [TestFixture]
    public class GemSystemTests
    {
        private Equipment MakeSocketedItem(int socketCount)
        {
            return new Equipment
            {
                Slot = ItemSlot.Weapon,
                Tier = ItemTier.T3,
                Rarity = socketCount >= 2 ? ItemRarity.Legendary : ItemRarity.Rare,
                BaseStatValue = 26,
                Sockets = new Gem[socketCount]
            };
        }

        [Test]
        public void SocketGem_EmptySocket_Succeeds()
        {
            var item = MakeSocketedItem(1);
            var gem = new Gem(GemType.Ruby, GemRarity.Standard);

            bool result = GemSystem.SocketGem(item, gem, 0);

            Assert.IsTrue(result);
            Assert.AreEqual(gem, item.Sockets[0]);
        }

        [Test]
        public void SocketGem_FullSocket_Fails()
        {
            var item = MakeSocketedItem(1);
            var gem1 = new Gem(GemType.Ruby, GemRarity.Standard);
            var gem2 = new Gem(GemType.Sapphire, GemRarity.Standard);

            GemSystem.SocketGem(item, gem1, 0);
            bool result = GemSystem.SocketGem(item, gem2, 0);

            Assert.IsFalse(result);
            Assert.AreEqual(gem1, item.Sockets[0]);
        }

        [Test]
        public void SocketGem_InvalidIndex_Fails()
        {
            var item = MakeSocketedItem(1);
            var gem = new Gem(GemType.Ruby, GemRarity.Standard);

            Assert.IsFalse(GemSystem.SocketGem(item, gem, -1));
            Assert.IsFalse(GemSystem.SocketGem(item, gem, 1));
        }

        [Test]
        public void RemoveGem_ReturnsGem()
        {
            var item = MakeSocketedItem(1);
            var gem = new Gem(GemType.Ruby, GemRarity.Standard);
            GemSystem.SocketGem(item, gem, 0);

            var removed = GemSystem.RemoveGem(item, 0);

            Assert.AreEqual(gem, removed);
            Assert.IsNull(item.Sockets[0]);
        }

        [Test]
        public void CombineGems_3Same_ReturnsNextRarity()
        {
            var a = new Gem(GemType.Ruby, GemRarity.Standard);
            var b = new Gem(GemType.Ruby, GemRarity.Standard);
            var c = new Gem(GemType.Ruby, GemRarity.Standard);

            var result = GemSystem.CombineGems(a, b, c);

            Assert.IsNotNull(result);
            Assert.AreEqual(GemType.Ruby, result.Type);
            Assert.AreEqual(GemRarity.Uncommon, result.Rarity);
        }

        [Test]
        public void CombineGems_DifferentTypes_ReturnsNull()
        {
            var a = new Gem(GemType.Ruby, GemRarity.Standard);
            var b = new Gem(GemType.Sapphire, GemRarity.Standard);
            var c = new Gem(GemType.Ruby, GemRarity.Standard);

            Assert.IsNull(GemSystem.CombineGems(a, b, c));
        }

        [Test]
        public void CombineGems_DifferentRarities_ReturnsNull()
        {
            var a = new Gem(GemType.Ruby, GemRarity.Standard);
            var b = new Gem(GemType.Ruby, GemRarity.Uncommon);
            var c = new Gem(GemType.Ruby, GemRarity.Standard);

            Assert.IsNull(GemSystem.CombineGems(a, b, c));
        }

        [Test]
        public void CombineGems_EpicCannotCombine()
        {
            var a = new Gem(GemType.Ruby, GemRarity.Epic);
            var b = new Gem(GemType.Ruby, GemRarity.Epic);
            var c = new Gem(GemType.Ruby, GemRarity.Epic);

            Assert.IsNull(GemSystem.CombineGems(a, b, c));
        }

        [Test]
        public void CombineGems_RareToEpic()
        {
            var a = new Gem(GemType.Diamond, GemRarity.Rare);
            var b = new Gem(GemType.Diamond, GemRarity.Rare);
            var c = new Gem(GemType.Diamond, GemRarity.Rare);

            var result = GemSystem.CombineGems(a, b, c);
            Assert.IsNotNull(result);
            Assert.AreEqual(GemRarity.Epic, result.Rarity);
        }

        [Test]
        public void GemStats_MatchGroundTruth()
        {
            // Ruby +100 HP
            var rubyStats = GemSystem.GetBaseGemStats(GemType.Ruby);
            Assert.AreEqual(1, rubyStats.Length);
            Assert.AreEqual("flatHp", rubyStats[0].StatKey);
            Assert.AreEqual(100f, rubyStats[0].Value, 0.01f);

            // Sapphire +8 ATK
            var sapphireStats = GemSystem.GetBaseGemStats(GemType.Sapphire);
            Assert.AreEqual("flatAtk", sapphireStats[0].StatKey);
            Assert.AreEqual(8f, sapphireStats[0].Value, 0.01f);

            // Emerald +5% DR
            var emeraldStats = GemSystem.GetBaseGemStats(GemType.Emerald);
            Assert.AreEqual("dr", emeraldStats[0].StatKey);
            Assert.AreEqual(5f, emeraldStats[0].Value, 0.01f);

            // Topaz -0.05s AtkSpd
            var topazStats = GemSystem.GetBaseGemStats(GemType.Topaz);
            Assert.AreEqual("atkSpeed", topazStats[0].StatKey);
            Assert.AreEqual(0.05f, topazStats[0].Value, 0.001f);

            // Diamond +8% Crit
            var diamondStats = GemSystem.GetBaseGemStats(GemType.Diamond);
            Assert.AreEqual("critChance", diamondStats[0].StatKey);
            Assert.AreEqual(8f, diamondStats[0].Value, 0.01f);

            // Amethyst +10 Start Mana
            var amethystStats = GemSystem.GetBaseGemStats(GemType.Amethyst);
            Assert.AreEqual("startMana", amethystStats[0].StatKey);
            Assert.AreEqual(10f, amethystStats[0].Value, 0.01f);

            // Opal +10% Heal Power
            var opalStats = GemSystem.GetBaseGemStats(GemType.Opal);
            Assert.AreEqual("healPower", opalStats[0].StatKey);
            Assert.AreEqual(10f, opalStats[0].Value, 0.01f);

            // Onyx +10% Tenacity
            var onyxStats = GemSystem.GetBaseGemStats(GemType.Onyx);
            Assert.AreEqual("tenacity", onyxStats[0].StatKey);
            Assert.AreEqual(10f, onyxStats[0].Value, 0.01f);

            // Prismatic +50 HP, +5 ATK, +3% Crit
            var prismaticStats = GemSystem.GetBaseGemStats(GemType.Prismatic);
            Assert.AreEqual(3, prismaticStats.Length);
            Assert.AreEqual("flatHp", prismaticStats[0].StatKey);
            Assert.AreEqual(50f, prismaticStats[0].Value, 0.01f);
            Assert.AreEqual("flatAtk", prismaticStats[1].StatKey);
            Assert.AreEqual(5f, prismaticStats[1].Value, 0.01f);
            Assert.AreEqual("critChance", prismaticStats[2].StatKey);
            Assert.AreEqual(3f, prismaticStats[2].Value, 0.01f);
        }

        [Test]
        public void RarityScaling_MatchesGroundTruth()
        {
            // Standard 1.0x, Uncommon 1.25x, Rare 1.5x, Epic 2.0x
            Assert.AreEqual(1.0f, GemSystem.GetRarityScaling(GemRarity.Standard), 0.001f);
            Assert.AreEqual(1.25f, GemSystem.GetRarityScaling(GemRarity.Uncommon), 0.001f);
            Assert.AreEqual(1.5f, GemSystem.GetRarityScaling(GemRarity.Rare), 0.001f);
            Assert.AreEqual(2.0f, GemSystem.GetRarityScaling(GemRarity.Epic), 0.001f);
        }

        [Test]
        public void GemStatBonuses_ScaleWithRarity()
        {
            // Ruby Standard: 100 HP * 1.0 = 100
            var standardGem = new Gem(GemType.Ruby, GemRarity.Standard);
            var standardBonuses = GemSystem.GetGemStatBonuses(standardGem);
            Assert.AreEqual(100f, standardBonuses[0].Value, 0.01f);

            // Ruby Uncommon: 100 * 1.25 = 125
            var uncommonGem = new Gem(GemType.Ruby, GemRarity.Uncommon);
            var uncommonBonuses = GemSystem.GetGemStatBonuses(uncommonGem);
            Assert.AreEqual(125f, uncommonBonuses[0].Value, 0.01f);

            // Ruby Rare: 100 * 1.5 = 150
            var rareGem = new Gem(GemType.Ruby, GemRarity.Rare);
            var rareBonuses = GemSystem.GetGemStatBonuses(rareGem);
            Assert.AreEqual(150f, rareBonuses[0].Value, 0.01f);

            // Ruby Epic: 100 * 2.0 = 200
            var epicGem = new Gem(GemType.Ruby, GemRarity.Epic);
            var epicBonuses = GemSystem.GetGemStatBonuses(epicGem);
            Assert.AreEqual(200f, epicBonuses[0].Value, 0.01f);
        }
    }
}

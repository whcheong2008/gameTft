using NUnit.Framework;
using ShatteredVeil.Core.Items;
using System.Collections.Generic;

namespace ShatteredVeil.Tests.EditMode.Items
{
    [TestFixture]
    public class EquipmentStatCalculatorTests
    {
        [Test]
        public void SingleWeapon_CorrectAtkBonus()
        {
            var weapon = new Equipment
            {
                Slot = ItemSlot.Weapon,
                Tier = ItemTier.T3,
                Rarity = ItemRarity.Common,
                BaseStatValue = 26, // 12 * 2.17 * 1.0 = 26
                EnhanceLevel = 0,
                Affixes = new List<Affix>(),
                Sockets = new Gem[0]
            };

            var bonuses = EquipmentStatCalculator.CalculateEquipmentBonuses(new[] { weapon });
            var atkBonus = FindStat(bonuses, "flatAtk");

            Assert.IsNotNull(atkBonus, "Should have flatAtk bonus from weapon");
            Assert.AreEqual(26f, atkBonus.Value, 0.01f);
        }

        [Test]
        public void WeaponWithEnhancement_AppliesBonus()
        {
            var weapon = new Equipment
            {
                Slot = ItemSlot.Weapon,
                Tier = ItemTier.T3,
                Rarity = ItemRarity.Common,
                BaseStatValue = 26,
                EnhanceLevel = 5, // +30% bonus
                Affixes = new List<Affix>(),
                Sockets = new Gem[0]
            };

            var bonuses = EquipmentStatCalculator.CalculateEquipmentBonuses(new[] { weapon });
            var atkBonus = FindStat(bonuses, "flatAtk");

            // 26 * (1 + 0.30) = 33.8
            Assert.IsNotNull(atkBonus);
            Assert.AreEqual(33.8f, atkBonus.Value, 0.1f);
        }

        [Test]
        public void FullLoadout_AllBonusesSummed()
        {
            var items = new Equipment[]
            {
                MakeItem(ItemSlot.Weapon, 20, 0),
                MakeItem(ItemSlot.Helm, 80, 0),
                MakeItem(ItemSlot.ChestArmor, 120, 0),
                MakeItem(ItemSlot.Gauntlets, 15, 0),
                MakeItem(ItemSlot.Boots, 5, 0),
                MakeItem(ItemSlot.OffHand, 100, 0),
                MakeItem(ItemSlot.Accessory1, 60, 0),
                MakeItem(ItemSlot.Accessory2, 40, 0)
            };

            var bonuses = EquipmentStatCalculator.CalculateEquipmentBonuses(items);

            // flatAtk from Weapon (20) + Gauntlets (15) = 35
            var atk = FindStat(bonuses, "flatAtk");
            Assert.IsNotNull(atk);
            Assert.AreEqual(35f, atk.Value, 0.01f);

            // flatHp from Helm (80) + Chest (120) + OffHand (100) + Acc1 (60) + Acc2 (40) = 400
            var hp = FindStat(bonuses, "flatHp");
            Assert.IsNotNull(hp);
            Assert.AreEqual(400f, hp.Value, 0.01f);

            // atkSpeed from Boots (5)
            var spd = FindStat(bonuses, "atkSpeed");
            Assert.IsNotNull(spd);
            Assert.AreEqual(5f, spd.Value, 0.01f);
        }

        [Test]
        public void AffixBonuses_IncludedInTotal()
        {
            var weapon = new Equipment
            {
                Slot = ItemSlot.Weapon,
                Tier = ItemTier.T1,
                Rarity = ItemRarity.Uncommon,
                BaseStatValue = 14, // 12 * 1.0 * 1.2 = 14
                EnhanceLevel = 0,
                Affixes = new List<Affix>
                {
                    new Affix("critChance", 5f, 3f, 12f)
                },
                Sockets = new Gem[0]
            };

            var bonuses = EquipmentStatCalculator.CalculateEquipmentBonuses(new[] { weapon });

            var crit = FindStat(bonuses, "critChance");
            Assert.IsNotNull(crit);
            Assert.AreEqual(5f, crit.Value, 0.01f);
        }

        [Test]
        public void GemBonuses_IncludedInTotal()
        {
            var weapon = new Equipment
            {
                Slot = ItemSlot.Weapon,
                Tier = ItemTier.T1,
                Rarity = ItemRarity.Rare,
                BaseStatValue = 18,
                EnhanceLevel = 0,
                Affixes = new List<Affix>(),
                Sockets = new Gem[] { new Gem(GemType.Sapphire, GemRarity.Standard) }
            };

            var bonuses = EquipmentStatCalculator.CalculateEquipmentBonuses(new[] { weapon });

            // Sapphire Standard: +8 ATK
            // Total flatAtk = 18 (base) + 8 (gem) = 26
            var atk = FindStat(bonuses, "flatAtk");
            Assert.IsNotNull(atk);
            Assert.AreEqual(26f, atk.Value, 0.01f);
        }

        [Test]
        public void EnhancementBonus_AppliedOnTopOfBase()
        {
            // Weapon with base 26 at +10 (100% bonus)
            var weapon = new Equipment
            {
                Slot = ItemSlot.Weapon,
                Tier = ItemTier.T3,
                Rarity = ItemRarity.Common,
                BaseStatValue = 26,
                EnhanceLevel = 10, // +100%
                Affixes = new List<Affix>(),
                Sockets = new Gem[0]
            };

            var bonuses = EquipmentStatCalculator.CalculateEquipmentBonuses(new[] { weapon });
            var atk = FindStat(bonuses, "flatAtk");

            // 26 * (1 + 1.0) = 52
            Assert.IsNotNull(atk);
            Assert.AreEqual(52f, atk.Value, 0.01f);
        }

        [Test]
        public void EmptyArray_ReturnsEmpty()
        {
            var bonuses = EquipmentStatCalculator.CalculateEquipmentBonuses(new Equipment[0]);
            Assert.AreEqual(0, bonuses.Length);
        }

        [Test]
        public void NullSlots_Skipped()
        {
            var items = new Equipment[] { null, MakeItem(ItemSlot.Weapon, 20, 0), null };
            var bonuses = EquipmentStatCalculator.CalculateEquipmentBonuses(items);

            var atk = FindStat(bonuses, "flatAtk");
            Assert.IsNotNull(atk);
            Assert.AreEqual(20f, atk.Value, 0.01f);
        }

        private Equipment MakeItem(ItemSlot slot, int baseStat, int enhanceLevel)
        {
            return new Equipment
            {
                Slot = slot,
                Tier = ItemTier.T1,
                Rarity = ItemRarity.Common,
                BaseStatValue = baseStat,
                EnhanceLevel = enhanceLevel,
                Affixes = new List<Affix>(),
                Sockets = new Gem[0]
            };
        }

        private StatModifier FindStat(StatModifier[] mods, string key)
        {
            if (mods == null) return null;
            for (int i = 0; i < mods.Length; i++)
            {
                if (mods[i].StatKey == key) return mods[i];
            }
            return null;
        }
    }
}

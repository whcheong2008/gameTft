using NUnit.Framework;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Tests.EditMode.Combat
{
    [TestFixture]
    public class ManaSystemTests
    {
        private CombatUnit MakeUnit(int maxMana = 100)
        {
            var unit = CombatUnit.Create("u1", "Test", Element.Fire, 1000, 100, 0, 10, Team.Player);
            unit.MaxMana = maxMana;
            unit.Mana = 0;
            return unit;
        }

        [Test]
        public void ManaStartsAtZero()
        {
            var unit = MakeUnit();
            Assert.AreEqual(0, unit.Mana);
        }

        [Test]
        public void GainManaOnAttack_Gains10()
        {
            var unit = MakeUnit();
            ManaSystem.GainManaOnAttack(unit);
            Assert.AreEqual(10, unit.Mana);
        }

        [Test]
        public void GainManaOnAttack_WithMultiplier()
        {
            var unit = MakeUnit();
            ManaSystem.GainManaOnAttack(unit, 1.5f);
            Assert.AreEqual(15, unit.Mana);
        }

        [Test]
        public void GainManaOnAttack_CappedAtMaxMana()
        {
            var unit = MakeUnit(100);
            unit.Mana = 95;
            ManaSystem.GainManaOnAttack(unit);
            Assert.AreEqual(100, unit.Mana);
        }

        [Test]
        public void GainManaOnHit_ScalesWithDamage()
        {
            // Formula: max(1, floor((damage / maxHP) * 50))
            // 200 damage, 1000 maxHP => floor(200/1000 * 50) = floor(10) = 10
            var unit = MakeUnit();
            ManaSystem.GainManaOnHit(unit, 200);
            Assert.AreEqual(10, unit.Mana);
        }

        [Test]
        public void GainManaOnHit_MinimumOne()
        {
            // 1 damage, 1000 maxHP => floor(1/1000 * 50) = 0 => max(1,0) = 1
            var unit = MakeUnit();
            ManaSystem.GainManaOnHit(unit, 1);
            Assert.AreEqual(1, unit.Mana);
        }

        [Test]
        public void GainManaOnHit_CappedAtMaxMana()
        {
            var unit = MakeUnit(100);
            unit.Mana = 99;
            ManaSystem.GainManaOnHit(unit, 500);
            Assert.AreEqual(100, unit.Mana);
        }

        [Test]
        public void GainManaOnHit_ZeroDamage_NoGain()
        {
            var unit = MakeUnit();
            ManaSystem.GainManaOnHit(unit, 0);
            Assert.AreEqual(0, unit.Mana);
        }

        [Test]
        public void GainManaPassive_PerSecond()
        {
            var unit = MakeUnit();
            ManaSystem.GainManaPassive(unit, 20f, 0.5f);
            // floor(20 * 0.5) = 10
            Assert.AreEqual(10, unit.Mana);
        }

        [Test]
        public void CanCastAbility_TrueWhenFull()
        {
            var unit = MakeUnit(100);
            unit.Mana = 100;
            Assert.IsTrue(ManaSystem.CanCastAbility(unit));
        }

        [Test]
        public void CanCastAbility_FalseWhenNotFull()
        {
            var unit = MakeUnit(100);
            unit.Mana = 99;
            Assert.IsFalse(ManaSystem.CanCastAbility(unit));
        }

        [Test]
        public void CanCastAbility_FalseWhenSilenced()
        {
            var unit = MakeUnit(100);
            unit.Mana = 100;
            unit.IsSilenced = true;
            Assert.IsFalse(ManaSystem.CanCastAbility(unit));
        }

        [Test]
        public void CanCastAbility_FalseForT5_MaxManaZero()
        {
            var unit = MakeUnit(0);
            unit.Mana = 0;
            Assert.IsFalse(ManaSystem.CanCastAbility(unit));
        }

        [Test]
        public void ConsumeMana_ResetsToZero()
        {
            var unit = MakeUnit(100);
            unit.Mana = 100;
            ManaSystem.ConsumeMana(unit);
            Assert.AreEqual(0, unit.Mana);
        }

        [Test]
        public void ConsumeMana_WithRefund()
        {
            var unit = MakeUnit(100);
            unit.Mana = 100;
            ManaSystem.ConsumeMana(unit, 30);
            Assert.AreEqual(30, unit.Mana);
        }

        [Test]
        public void RefundMana_OnKill()
        {
            var unit = MakeUnit(100);
            unit.Mana = 0;
            ManaSystem.RefundMana(unit, 30);
            Assert.AreEqual(30, unit.Mana);
        }

        [Test]
        public void RefundMana_CappedAtMax()
        {
            var unit = MakeUnit(100);
            unit.Mana = 80;
            ManaSystem.RefundMana(unit, 30);
            Assert.AreEqual(100, unit.Mana);
        }

        [Test]
        public void T5Unit_NoManaGainOnAttack()
        {
            var unit = MakeUnit(0);
            ManaSystem.GainManaOnAttack(unit);
            Assert.AreEqual(0, unit.Mana);
        }

        [Test]
        public void T5Unit_NoManaGainOnHit()
        {
            var unit = MakeUnit(0);
            ManaSystem.GainManaOnHit(unit, 500);
            Assert.AreEqual(0, unit.Mana);
        }
    }
}

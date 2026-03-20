using System;
using NUnit.Framework;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Tests.EditMode.Combat
{
    [TestFixture]
    public class DamageCalculatorTests
    {
        // --- GROUND-TRUTH.md Test Cases ---

        [Test]
        public void StandardHit_NoCrit_NeutralElement()
        {
            // ATK=100, multiplier=1.0, DR=0, neutral element → 100
            int result = DamageCalculator.CalculateRaw(100, 1.0f, 1.0f, 0f, false);
            Assert.AreEqual(100, result);
        }

        [Test]
        public void StrongElementHit_FireVsWind()
        {
            // ATK=100, fire attacker vs wind target → floor(100 * 1.3) = 130
            int result = DamageCalculator.CalculateRaw(100, 1.0f, 1.3f, 0f, false);
            Assert.AreEqual(130, result);
        }

        [Test]
        public void WeakElementHit_FireVsWater()
        {
            // ATK=100, fire attacker vs water target → floor(100 * 0.7) = 70
            int result = DamageCalculator.CalculateRaw(100, 1.0f, 0.7f, 0f, false);
            Assert.AreEqual(70, result);
        }

        [Test]
        public void CriticalHit_NeutralElement()
        {
            // ATK=100, neutral element, crit → floor(100 * 1.5) = 150
            int result = DamageCalculator.CalculateRaw(100, 1.0f, 1.0f, 0f, true);
            Assert.AreEqual(150, result);
        }

        [Test]
        public void ZeroDR_FullDamage()
        {
            // ATK=100, DR=0 → 100
            int result = DamageCalculator.CalculateRaw(100, 1.0f, 1.0f, 0f, false);
            Assert.AreEqual(100, result);
        }

        [Test]
        public void HighDR_CappedAt75Percent()
        {
            // ATK=100, DR=0.80 → capped to 0.75 → floor(100 * 0.25) = 25
            int result = DamageCalculator.CalculateRaw(100, 1.0f, 1.0f, 0.80f, false);
            Assert.AreEqual(25, result);
        }

        [Test]
        public void MinimumDamageFloor()
        {
            // ATK=1, DR=0.75, weak element (0.7) → max(1, floor(1 * 0.7 * 0.25)) = 1
            int result = DamageCalculator.CalculateRaw(1, 1.0f, 0.7f, 0.75f, false);
            Assert.AreEqual(1, result);
        }

        // --- Edge Cases ---

        [Test]
        public void AbilityMultiplier_Scales()
        {
            // ATK=100, ability 1.5x, neutral → 150
            int result = DamageCalculator.CalculateRaw(100, 1.5f, 1.0f, 0f, false);
            Assert.AreEqual(150, result);
        }

        [Test]
        public void CritWithBonusCritDamage()
        {
            // ATK=100, crit with +0.3 bonus → floor(100 * 1.8) = 180
            int result = DamageCalculator.CalculateRaw(100, 1.0f, 1.0f, 0f, true, 0.3f);
            Assert.AreEqual(180, result);
        }

        [Test]
        public void DR_ExactlyCap()
        {
            // ATK=100, DR=0.75 → floor(100 * 0.25) = 25
            int result = DamageCalculator.CalculateRaw(100, 1.0f, 1.0f, 0.75f, false);
            Assert.AreEqual(25, result);
        }

        [Test]
        public void StrongElement_WithCrit()
        {
            // ATK=100, 1.3x element, crit → floor(100 * 1.3 * 1.5) = 195
            int result = DamageCalculator.CalculateRaw(100, 1.0f, 1.3f, 0f, true);
            Assert.AreEqual(195, result);
        }

        // --- Full Pipeline Tests ---

        [Test]
        public void FullPipeline_Stasis_Returns0()
        {
            var attacker = CombatUnit.Create("a1", "Attacker", Element.Fire, 500, 100, 0, 10, Team.Player);
            var target = CombatUnit.Create("d1", "Defender", Element.Wind, 500, 50, 0, 5, Team.Enemy);
            target.Stasis = 1;

            var result = DamageCalculator.Calculate(attacker, target, new DamageContext(), new Random(42));
            Assert.AreEqual(0, result.Damage);
            Assert.AreEqual(500, target.CurrentHP); // HP unchanged
        }

        [Test]
        public void FullPipeline_ShieldAbsorption()
        {
            var attacker = CombatUnit.Create("a1", "Attacker", Element.Force, 500, 100, 0, 10, Team.Player);
            var target = CombatUnit.Create("d1", "Defender", Element.Force, 500, 50, 0, 5, Team.Enemy);
            target.Shield = 40;

            var result = DamageCalculator.Calculate(attacker, target, new DamageContext(), new Random(42));
            // 100 dmg, 40 absorbed by shield, 60 hits HP
            Assert.AreEqual(100, result.Damage); // total damage dealt
            Assert.AreEqual(40, result.ShieldAbsorbed);
            Assert.AreEqual(0, target.Shield);
            Assert.AreEqual(440, target.CurrentHP); // 500 - 60
        }

        [Test]
        public void FullPipeline_Dodge_NoDamage()
        {
            var attacker = CombatUnit.Create("a1", "Attacker", Element.Force, 500, 100, 0, 10, Team.Player);
            var target = CombatUnit.Create("d1", "Defender", Element.Force, 500, 50, 0, 5, Team.Enemy);
            target.DodgeChance = 1.0f; // guaranteed dodge

            var result = DamageCalculator.Calculate(attacker, target, new DamageContext(), new Random(42));
            Assert.IsTrue(result.IsDodged);
            Assert.AreEqual(0, result.Damage);
            Assert.AreEqual(500, target.CurrentHP);
        }

        [Test]
        public void FullPipeline_KillTarget()
        {
            var attacker = CombatUnit.Create("a1", "Attacker", Element.Fire, 500, 200, 0, 10, Team.Player);
            var target = CombatUnit.Create("d1", "Defender", Element.Wind, 100, 50, 0, 5, Team.Enemy);
            // Fire vs Wind = 1.3x, so 200 * 1.3 = 260 > 100 HP

            var result = DamageCalculator.Calculate(attacker, target, new DamageContext(), new Random(42));
            Assert.AreEqual(0, target.CurrentHP);
            Assert.IsFalse(target.IsAlive);
        }

        [Test]
        public void FullPipeline_ForceCrit()
        {
            var attacker = CombatUnit.Create("a1", "Attacker", Element.Force, 500, 100, 0, 10, Team.Player);
            var target = CombatUnit.Create("d1", "Defender", Element.Force, 500, 50, 0, 5, Team.Enemy);

            var ctx = new DamageContext { ForceCrit = true };
            var result = DamageCalculator.Calculate(attacker, target, ctx, new Random(42));
            Assert.IsTrue(result.IsCrit);
            Assert.AreEqual(150, result.Damage); // 100 * 1.5
        }

        [Test]
        public void FullPipeline_SpellPenetration_ReducesDR()
        {
            var attacker = CombatUnit.Create("a1", "Attacker", Element.Force, 500, 100, 0, 10, Team.Player);
            var target = CombatUnit.Create("d1", "Defender", Element.Force, 500, 50, 0, 5, Team.Enemy);
            target.DamageReduction = 0.5f;

            // Without spell pen: floor(100 * 0.5) = 50
            var resultNoPen = DamageCalculator.Calculate(attacker, target, new DamageContext(), new Random(42));
            // Reset target HP
            target.CurrentHP = 500;
            target.IsAlive = true;

            // With 50% spell pen: DR = 0.5 * (1 - 0.5) = 0.25, floor(100 * 0.75) = 75
            var ctx = new DamageContext { SpellPenetration = 0.5f };
            var resultPen = DamageCalculator.Calculate(attacker, target, ctx, new Random(42));

            Assert.Greater(resultPen.Damage, resultNoPen.Damage);
        }

        [Test]
        public void FullPipeline_ElemResist_ReducesBonus()
        {
            var attacker = CombatUnit.Create("a1", "Attacker", Element.Fire, 500, 100, 0, 10, Team.Player);
            var target = CombatUnit.Create("d1", "Defender", Element.Wind, 500, 50, 0, 5, Team.Enemy);
            target.ElemResist = 0.5f;
            // Fire vs Wind = 1.3x, but with 50% elem resist:
            // elemMult = 1.0 + (1.3 - 1.0) * (1 - 0.5) = 1.0 + 0.15 = 1.15
            // damage = floor(100 * 1.15) = 115

            var result = DamageCalculator.Calculate(attacker, target, new DamageContext(), new Random(42));
            Assert.AreEqual(1.15f, result.ElementMultiplier, 0.01f);
            Assert.AreEqual(115, result.Damage);
        }
    }
}

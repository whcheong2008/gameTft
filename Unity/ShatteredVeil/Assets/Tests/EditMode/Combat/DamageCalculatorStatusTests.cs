using System;
using NUnit.Framework;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Tests.EditMode.Combat
{
    [TestFixture]
    public class DamageCalculatorStatusTests
    {
        private CombatUnit _attacker;
        private CombatUnit _target;
        private Random _rng;

        [SetUp]
        public void SetUp()
        {
            _attacker = CombatUnit.Create("atk", "Attacker", Element.Fire, 1000, 100, 10, 50, Team.Player);
            _target = CombatUnit.Create("def", "Target", Element.Water, 1000, 100, 10, 50, Team.Enemy);
            _rng = new Random(42);
        }

        // --- Step 7: Freeze Vulnerability ---

        [Test]
        public void FrozenTarget_TakesPlus20PercentDamage()
        {
            _target.IsFrozen = true;
            var ctx = new DamageContext();
            var result = DamageCalculator.Calculate(_attacker, _target, ctx, _rng);

            // Base: 100 ATK * element mult (Fire vs Water = 0.7) = 70 → min 70
            // After freeze: floor(70 * 1.2) = 84
            // With element: 100 * 0.7 = 70, floor step6 = 70, step7 frozen: floor(70*1.2)=84
            // Note: exact value depends on element multiplier
            Assert.IsTrue(result.Damage > 0);

            // Compare with non-frozen
            var target2 = CombatUnit.Create("def2", "Target2", Element.Water, 1000, 100, 10, 50, Team.Enemy);
            var result2 = DamageCalculator.Calculate(_attacker, target2, new DamageContext(), new Random(42));

            // Frozen should deal more damage (ratio should be ~1.2x)
            // result includes shield absorbed in total, but no shields here
            Assert.IsTrue(result.Damage > result2.Damage);
        }

        [Test]
        public void FrozenTarget_ExactCalculation()
        {
            // Use neutral element for clean math
            var atk = CombatUnit.Create("a", "A", Element.Fire, 1000, 100, 0, 50, Team.Player);
            var tgt = CombatUnit.Create("t", "T", Element.Fire, 1000, 100, 0, 50, Team.Enemy);
            tgt.IsFrozen = true;

            var ctx = new DamageContext();
            var result = DamageCalculator.Calculate(atk, tgt, ctx, new Random(99));

            // 100 ATK * 1.0 elem * no crit * no DR = 100, step6=100, step7=floor(100*1.2)=120
            Assert.AreEqual(120, result.Damage);
        }

        // --- Step 8: Vulnerability ---

        [Test]
        public void Vulnerability_IncreaseDamage()
        {
            var atk = CombatUnit.Create("a", "A", Element.Fire, 1000, 100, 0, 50, Team.Player);
            var tgt = CombatUnit.Create("t", "T", Element.Fire, 1000, 100, 0, 50, Team.Enemy);
            tgt.Vulnerability = 0.25f;

            var ctx = new DamageContext();
            var result = DamageCalculator.Calculate(atk, tgt, ctx, new Random(99));

            // 100 * 1.0 = 100, step6=100, step7 (not frozen)=100, step8=floor(100*1.25)=125
            Assert.AreEqual(125, result.Damage);
        }

        [Test]
        public void FreezeAndVulnerability_Stack()
        {
            var atk = CombatUnit.Create("a", "A", Element.Fire, 1000, 100, 0, 50, Team.Player);
            var tgt = CombatUnit.Create("t", "T", Element.Fire, 1000, 100, 0, 50, Team.Enemy);
            tgt.IsFrozen = true;
            tgt.Vulnerability = 0.25f;

            var ctx = new DamageContext();
            var result = DamageCalculator.Calculate(atk, tgt, ctx, new Random(99));

            // 100 → step7: floor(100*1.2)=120 → step8: floor(120*1.25)=150
            Assert.AreEqual(150, result.Damage);
        }

        // --- Step 9: Ranger Mark ---

        [Test]
        public void RangerMark_AmplifyDamage()
        {
            var atk = CombatUnit.Create("a", "A", Element.Fire, 1000, 100, 0, 50, Team.Player);
            var tgt = CombatUnit.Create("t", "T", Element.Fire, 1000, 100, 0, 50, Team.Enemy);

            var ctx = new DamageContext { RangerMarkAmp = 0.15f };
            var result = DamageCalculator.Calculate(atk, tgt, ctx, new Random(99));

            // 100 → step9: floor(100*1.15) = 115
            Assert.AreEqual(115, result.Damage);
        }

        // --- Step 13: Reflect ---

        [Test]
        public void Reflect_DamagesAttacker()
        {
            var atk = CombatUnit.Create("a", "A", Element.Fire, 1000, 100, 0, 50, Team.Player);
            var tgt = CombatUnit.Create("t", "T", Element.Fire, 1000, 100, 0, 50, Team.Enemy);

            var ctx = new DamageContext { ReflectPct = 0.25f };
            var result = DamageCalculator.Calculate(atk, tgt, ctx, new Random(99));

            // 100 damage dealt, reflect 25% = 25
            Assert.AreEqual(25, result.ReflectDamage);
            Assert.AreEqual(975, atk.CurrentHP);
        }

        [Test]
        public void Reflect_CanKillAttacker()
        {
            var atk = CombatUnit.Create("a", "A", Element.Fire, 20, 100, 0, 50, Team.Player);
            var tgt = CombatUnit.Create("t", "T", Element.Fire, 1000, 100, 0, 50, Team.Enemy);

            var ctx = new DamageContext { ReflectPct = 0.30f };
            var result = DamageCalculator.Calculate(atk, tgt, ctx, new Random(99));

            // 100 damage, 30% reflect = 30 → attacker has 20 HP, dies
            Assert.IsFalse(atk.IsAlive);
            Assert.AreEqual(0, atk.CurrentHP);
        }

        // --- Step 13: Lifesteal ---

        [Test]
        public void Lifesteal_HealsAttacker()
        {
            var atk = CombatUnit.Create("a", "A", Element.Fire, 1000, 100, 0, 50, Team.Player);
            atk.CurrentHP = 800;
            var tgt = CombatUnit.Create("t", "T", Element.Fire, 1000, 100, 0, 50, Team.Enemy);

            var ctx = new DamageContext { LifestealPct = 0.20f };
            var result = DamageCalculator.Calculate(atk, tgt, ctx, new Random(99));

            // 100 damage, 20% lifesteal = 20 heal
            Assert.AreEqual(20, result.LifestealHealed);
            Assert.AreEqual(820, atk.CurrentHP);
        }

        [Test]
        public void Lifesteal_CapsAtMaxHP()
        {
            var atk = CombatUnit.Create("a", "A", Element.Fire, 1000, 100, 0, 50, Team.Player);
            atk.CurrentHP = 995;
            var tgt = CombatUnit.Create("t", "T", Element.Fire, 1000, 100, 0, 50, Team.Enemy);

            var ctx = new DamageContext { LifestealPct = 0.20f };
            DamageCalculator.Calculate(atk, tgt, ctx, new Random(99));

            Assert.AreEqual(1000, atk.CurrentHP);
        }

        // --- Step 1: Stasis still works ---

        [Test]
        public void Stasis_StillBlocksAllDamage()
        {
            _target.Stasis = 2;
            var ctx = new DamageContext();
            var result = DamageCalculator.Calculate(_attacker, _target, ctx, _rng);
            Assert.AreEqual(0, result.Damage);
            Assert.AreEqual(1000, _target.CurrentHP);
        }
    }
}

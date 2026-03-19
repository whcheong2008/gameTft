using NUnit.Framework;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Tests.EditMode.Combat
{
    [TestFixture]
    public class TierScalingTests
    {
        [Test]
        public void T1_AbilityMult_Is1Point8()
        {
            var s = TierScaling.Get(1);
            Assert.AreEqual(1.8f, s.AbilityMult, 0.01f);
        }

        [Test]
        public void T2_AbilityMult_Is1Point9()
        {
            var s = TierScaling.Get(2);
            Assert.AreEqual(1.9f, s.AbilityMult, 0.01f);
        }

        [Test]
        public void T3_AbilityMult_Is2Point1()
        {
            var s = TierScaling.Get(3);
            Assert.AreEqual(2.1f, s.AbilityMult, 0.01f);
        }

        [Test]
        public void T4_AbilityMult_Is2Point6()
        {
            var s = TierScaling.Get(4);
            Assert.AreEqual(2.6f, s.AbilityMult, 0.01f);
        }

        [Test]
        public void T5_AbilityMult_Is3Point2()
        {
            var s = TierScaling.Get(5);
            Assert.AreEqual(3.2f, s.AbilityMult, 0.01f);
        }

        [Test]
        public void T1_DotDps_Is10()
        {
            var s = TierScaling.Get(1);
            Assert.AreEqual(10f, s.DotDps, 0.01f);
        }

        [Test]
        public void T5_DotDps_Is37()
        {
            var s = TierScaling.Get(5);
            Assert.AreEqual(37f, s.DotDps, 0.01f);
        }

        [Test]
        public void T1_CCDur_Is1Point2()
        {
            var s = TierScaling.Get(1);
            Assert.AreEqual(1.2f, s.CCDur, 0.01f);
        }

        [Test]
        public void T5_CCDur_Is2Point5()
        {
            var s = TierScaling.Get(5);
            Assert.AreEqual(2.5f, s.CCDur, 0.01f);
        }

        [Test]
        public void T1_ShieldPct_Is0Point15()
        {
            var s = TierScaling.Get(1);
            Assert.AreEqual(0.15f, s.ShieldPct, 0.01f);
        }

        [Test]
        public void T5_ShieldPct_Is0Point37()
        {
            var s = TierScaling.Get(5);
            Assert.AreEqual(0.37f, s.ShieldPct, 0.01f);
        }

        // ── Evolved scaling ───────────────────────────────────────────────

        [Test]
        public void T1_Evolved_AbilityMult_IncludesBonus()
        {
            var s = TierScaling.Get(1, true);
            // 1.8 * 1.3 = 2.34
            Assert.AreEqual(2.34f, s.AbilityMult, 0.01f);
        }

        [Test]
        public void T5_Evolved_AbilityMult_IncludesBonus()
        {
            var s = TierScaling.Get(5, true);
            // 3.2 * 1.5 = 4.8
            Assert.AreEqual(4.8f, s.AbilityMult, 0.01f);
        }

        [Test]
        public void T3_Evolved_DotDps_IncludesBonus()
        {
            var s = TierScaling.Get(3, true);
            // 21 * 1.4 = 29.4
            Assert.AreEqual(29.4f, s.DotDps, 0.1f);
        }

        [Test]
        public void T1_EvolvedBonus_Is1Point3()
        {
            Assert.AreEqual(1.3f, TierScaling.GetEvolvedBonus(1), 0.01f);
        }

        [Test]
        public void T5_EvolvedBonus_Is1Point5()
        {
            Assert.AreEqual(1.5f, TierScaling.GetEvolvedBonus(5), 0.01f);
        }

        // ── Edge cases ────────────────────────────────────────────────────

        [Test]
        public void TierBelow1_ClampedTo1()
        {
            var s = TierScaling.Get(0);
            Assert.AreEqual(1.8f, s.AbilityMult, 0.01f);
        }

        [Test]
        public void TierAbove5_ClampedTo5()
        {
            var s = TierScaling.Get(10);
            Assert.AreEqual(3.2f, s.AbilityMult, 0.01f);
        }

        [Test]
        public void PassiveStr_ScalesByTier()
        {
            Assert.AreEqual(1.0f, TierScaling.Get(1).PassiveStr, 0.01f);
            Assert.AreEqual(1.1f, TierScaling.Get(2).PassiveStr, 0.01f);
            Assert.AreEqual(1.2f, TierScaling.Get(3).PassiveStr, 0.01f);
            Assert.AreEqual(1.3f, TierScaling.Get(4).PassiveStr, 0.01f);
            Assert.AreEqual(1.5f, TierScaling.Get(5).PassiveStr, 0.01f);
        }
    }
}

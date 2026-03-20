using NUnit.Framework;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Tests.EditMode.Combat
{
    [TestFixture]
    public class DiminishingReturnsTests
    {
        private DiminishingReturns _dr;
        private CombatUnit _unit;

        [SetUp]
        public void SetUp()
        {
            _dr = new DiminishingReturns();
            _unit = CombatUnit.Create("target", "Target", Element.Fire, 1000, 100, 10, 50, Team.Player);
        }

        [Test]
        public void FirstStun_FullDuration()
        {
            float result = _dr.CalculateEffectiveDuration(_unit, StatusEffectType.Stun, 2.0f, 0f, 0f);
            Assert.AreEqual(2.0f, result, 0.001f);
        }

        [Test]
        public void SecondStun_WithinWindow_HalfDuration()
        {
            // First stun at t=0
            _dr.CalculateEffectiveDuration(_unit, StatusEffectType.Stun, 2.0f, 0f, 0f);

            // Second stun at t=3 (within 8s window), but immune until t=0+2+1=3
            // so try at t=3.1
            float result = _dr.CalculateEffectiveDuration(_unit, StatusEffectType.Stun, 2.0f, 0f, 3.1f);
            Assert.AreEqual(1.0f, result, 0.001f); // 2.0 * 0.5
        }

        [Test]
        public void ThirdStun_WithinWindow_QuarterDuration()
        {
            // First stun at t=0 (duration 2s)
            _dr.CalculateEffectiveDuration(_unit, StatusEffectType.Stun, 2.0f, 0f, 0f);

            // Second stun at t=3.1 (after immunity t=3.0)
            _dr.CalculateEffectiveDuration(_unit, StatusEffectType.Stun, 2.0f, 0f, 3.1f);

            // Third stun at t=4.2 (after second immunity expires: 3.1+1.0+1.0=5.1)
            // Actually immunity from 2nd stun: 3.1 + 1.0 + 1.0 = 5.1
            float result = _dr.CalculateEffectiveDuration(_unit, StatusEffectType.Stun, 2.0f, 0f, 5.2f);
            Assert.AreEqual(0.5f, result, 0.001f); // 2.0 * 0.25
        }

        [Test]
        public void Stun_AfterWindowExpires_FullDurationAgain()
        {
            // First stun at t=0
            _dr.CalculateEffectiveDuration(_unit, StatusEffectType.Stun, 2.0f, 0f, 0f);

            // Second stun at t=9 (beyond 8s window, and beyond immunity)
            float result = _dr.CalculateEffectiveDuration(_unit, StatusEffectType.Stun, 2.0f, 0f, 9f);
            Assert.AreEqual(2.0f, result, 0.001f);
        }

        // --- Tenacity Tests ---

        [Test]
        public void Tenacity_ReducesCCDuration()
        {
            // 2s stun, 30% tenacity → 2.0 * (1 - 0.30) = 1.4s
            float result = _dr.CalculateEffectiveDuration(_unit, StatusEffectType.Stun, 2.0f, 0.3f, 0f);
            Assert.AreEqual(1.4f, result, 0.001f);
        }

        [Test]
        public void Tenacity_CappedAt60Percent()
        {
            // 2s stun, 80% tenacity → capped to 60% → 2.0 * (1 - 0.60) = 0.8s
            float result = _dr.CalculateEffectiveDuration(_unit, StatusEffectType.Stun, 2.0f, 0.8f, 0f);
            Assert.AreEqual(0.8f, result, 0.001f);
        }

        [Test]
        public void Tenacity_PlusDR_BothApplied()
        {
            // First stun at t=0 with 30% tenacity
            _dr.CalculateEffectiveDuration(_unit, StatusEffectType.Stun, 2.0f, 0.3f, 0f);
            // duration = 2.0 * 0.7 = 1.4, immunity until 1.4 + 1.0 = 2.4

            // Second stun at t=2.5 with 30% tenacity
            float result = _dr.CalculateEffectiveDuration(_unit, StatusEffectType.Stun, 2.0f, 0.3f, 2.5f);
            // tenacity first: 2.0 * 0.7 = 1.4, then DR 50%: 1.4 * 0.5 = 0.7
            Assert.AreEqual(0.7f, result, 0.001f);
        }

        // --- Immunity Window Tests ---

        [Test]
        public void StunImmunity_BlocksSecondStun_DuringWindow()
        {
            // First stun: duration 2s at t=0 → immune until 2.0+1.0=3.0
            _dr.CalculateEffectiveDuration(_unit, StatusEffectType.Stun, 2.0f, 0f, 0f);

            // Try stun at t=1.0 (during immunity)
            float result = _dr.CalculateEffectiveDuration(_unit, StatusEffectType.Stun, 2.0f, 0f, 1.0f);
            Assert.AreEqual(0f, result); // immune
        }

        [Test]
        public void FreezeImmunity_BlocksDuringWindow()
        {
            // Freeze at t=0, duration 1.5 → immune until 1.5+1.0=2.5
            _dr.CalculateEffectiveDuration(_unit, StatusEffectType.Freeze, 1.5f, 0f, 0f);

            float result = _dr.CalculateEffectiveDuration(_unit, StatusEffectType.Freeze, 1.5f, 0f, 2.0f);
            Assert.AreEqual(0f, result); // still immune
        }

        [Test]
        public void Root_NoImmunityWindow()
        {
            // Root at t=0
            _dr.CalculateEffectiveDuration(_unit, StatusEffectType.Root, 2.0f, 0f, 0f);

            // Root at t=0.5 — root has DR but no immunity window
            float result = _dr.CalculateEffectiveDuration(_unit, StatusEffectType.Root, 2.0f, 0f, 0.5f);
            Assert.AreEqual(1.0f, result, 0.001f); // 2nd CC = 50%
        }

        // --- Minimum Duration ---

        [Test]
        public void BelowMinimumDuration_ReturnsZero()
        {
            // With heavy tenacity + DR, if result < 0.25 → 0
            // 0.3s stun with 60% tenacity = 0.3 * 0.4 = 0.12 → below min
            float result = _dr.CalculateEffectiveDuration(_unit, StatusEffectType.Stun, 0.3f, 0.6f, 0f);
            Assert.AreEqual(0f, result);
        }

        // --- Reset ---

        [Test]
        public void Reset_ClearsHistory()
        {
            _dr.CalculateEffectiveDuration(_unit, StatusEffectType.Stun, 2.0f, 0f, 0f);
            _dr.Reset();

            // After reset, should get full duration again at same time
            float result = _dr.CalculateEffectiveDuration(_unit, StatusEffectType.Stun, 2.0f, 0f, 0f);
            Assert.AreEqual(2.0f, result, 0.001f);
        }
    }
}

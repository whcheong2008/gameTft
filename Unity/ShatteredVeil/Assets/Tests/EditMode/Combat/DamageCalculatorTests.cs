using NUnit.Framework;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Tests.EditMode.Combat
{
    [TestFixture]
    public class DamageCalculatorTests
    {
        [Test]
        public void BasicDamage_MatchesFormula()
        {
            // ATK=100, DEF=50, skill=1.5, element=1.0
            // Expected: 100 * 1.5 * 1.0 * (1 - 50/150) = 150 * 0.6667 = 100
            float result = DamageCalculator.CalculateDamage(100f, 50f, 1.5f, 1.0f);
            Assert.AreEqual(100f, result, 0.5f);
        }

        [Test]
        public void ZeroDefense_FullDamage()
        {
            float result = DamageCalculator.CalculateDamage(100f, 0f, 1.0f, 1.0f);
            Assert.AreEqual(100f, result, 0.01f);
        }

        [Test]
        public void ElementMultiplier_AppliesCorrectly()
        {
            float neutral = DamageCalculator.CalculateDamage(100f, 50f, 1.0f, 1.0f);
            float strong = DamageCalculator.CalculateDamage(100f, 50f, 1.0f, 1.5f);
            Assert.Greater(strong, neutral);
        }
    }
}

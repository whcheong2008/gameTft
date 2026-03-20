using NUnit.Framework;
using ShatteredVeil.Core.Items;

namespace ShatteredVeil.Tests.EditMode.Items
{
    [TestFixture]
    public class EnhancementSystemTests
    {
        private Equipment MakeTestItem(int enhanceLevel = 0)
        {
            return new Equipment
            {
                Slot = ItemSlot.Weapon,
                Tier = ItemTier.T3,
                Rarity = ItemRarity.Rare,
                EnhanceLevel = enhanceLevel,
                BaseStatValue = 26
            };
        }

        [Test]
        public void Plus1Through3_AlwaysSucceed()
        {
            var rng = new System.Random(42);
            for (int startLevel = 0; startLevel < 3; startLevel++)
            {
                var item = MakeTestItem(startLevel);
                int failures = 0;
                var result = EnhancementSystem.Enhance(item, rng, ref failures);
                Assert.IsTrue(result.Success, $"Enhancement from +{startLevel} to +{startLevel + 1} should always succeed");
                Assert.AreEqual(startLevel + 1, result.NewLevel);
            }
        }

        [Test]
        public void Plus10_Has15PercentSuccessRate()
        {
            // Use seeded RNG to verify rate is approximately 15%
            var rng = new System.Random(12345);
            int successes = 0;
            int trials = 10000;

            for (int i = 0; i < trials; i++)
            {
                var item = MakeTestItem(9); // currently at +9, targeting +10
                int failures = 0;
                var result = EnhancementSystem.Enhance(item, rng, ref failures);
                if (result.Success) successes++;
            }

            float rate = successes / (float)trials;
            Assert.AreEqual(0.15f, rate, 0.02f,
                $"Expected ~15% success rate for +10, got {rate:P1}");
        }

        [Test]
        public void FailureAt6_DropsTo5()
        {
            // We need a guaranteed failure: use pity counter = 0 and find an RNG seed that fails
            // +6 has 70% success, so we'll just look at the failure behavior directly
            var item = MakeTestItem(5); // at +5, targeting +6

            // Make RNG that will fail (need double >= 0.7)
            // Use a fake approach: run many and find one that fails
            for (int seed = 0; seed < 1000; seed++)
            {
                var testItem = MakeTestItem(5);
                int failures = 0;
                var rng = new System.Random(seed);
                var result = EnhancementSystem.Enhance(testItem, rng, ref failures);
                if (!result.Success)
                {
                    Assert.AreEqual(5, testItem.EnhanceLevel,
                        "Failure at +6 should drop to +5");
                    return;
                }
            }
            Assert.Fail("Could not find a seed that produces failure at +6");
        }

        [Test]
        public void FailureAt8_DropsTo6()
        {
            for (int seed = 0; seed < 1000; seed++)
            {
                var testItem = MakeTestItem(7); // at +7, targeting +8
                int failures = 0;
                var rng = new System.Random(seed);
                var result = EnhancementSystem.Enhance(testItem, rng, ref failures);
                if (!result.Success)
                {
                    Assert.AreEqual(6, testItem.EnhanceLevel,
                        "Failure at +8 should drop to +6");
                    return;
                }
            }
            Assert.Fail("Could not find a seed that produces failure at +8");
        }

        [Test]
        public void Pity_3ConsecutiveFails_NextSucceeds()
        {
            var item = MakeTestItem(5); // at +5, targeting +6
            int failures = 3; // Already have 3 consecutive failures
            var rng = new System.Random(42);

            var result = EnhancementSystem.Enhance(item, rng, ref failures);
            Assert.IsTrue(result.Success, "After 3 consecutive failures, next enhancement should be guaranteed");
            Assert.IsTrue(result.WasPity, "Should be marked as pity success");
            Assert.AreEqual(6, result.NewLevel);
            Assert.AreEqual(0, failures, "Failures should reset after pity success");
        }

        [Test]
        public void StatBonus_MatchesGroundTruthTable()
        {
            // +1=5%, +2=10%, +3=15%, +4=22%, +5=30%, +6=40%, +7=52%, +8=66%, +9=82%, +10=100%
            float[] expected = { 0.05f, 0.10f, 0.15f, 0.22f, 0.30f, 0.40f, 0.52f, 0.66f, 0.82f, 1.00f };

            for (int level = 1; level <= 10; level++)
            {
                float bonus = EnhancementSystem.GetStatBonusPct(level);
                Assert.AreEqual(expected[level - 1], bonus, 0.001f,
                    $"Stat bonus at +{level} should be {expected[level - 1]:P0}");
            }

            // +0 returns 0
            Assert.AreEqual(0f, EnhancementSystem.GetStatBonusPct(0));
        }

        [Test]
        public void SuccessRates_MatchGroundTruth()
        {
            float[] expected = { 1.0f, 1.0f, 1.0f, 0.9f, 0.8f, 0.7f, 0.55f, 0.4f, 0.25f, 0.15f };

            for (int level = 0; level < 10; level++)
            {
                float rate = EnhancementSystem.GetSuccessRate(level);
                Assert.AreEqual(expected[level], rate, 0.001f,
                    $"Success rate at +{level + 1} should be {expected[level]:P0}");
            }
        }

        [Test]
        public void EnhanceCosts_MatchGroundTruth()
        {
            int[] expected = { 20, 30, 50, 80, 120, 180, 250, 350, 500, 750 };

            for (int level = 0; level < 10; level++)
            {
                int cost = EnhancementSystem.GetEnhanceCost(level);
                Assert.AreEqual(expected[level], cost,
                    $"Cost for +{level + 1} should be {expected[level]}");
            }
        }

        [Test]
        public void MaxLevel_CannotExceed10()
        {
            var item = MakeTestItem(10);
            int failures = 0;
            var rng = new System.Random(42);
            var result = EnhancementSystem.Enhance(item, rng, ref failures);
            Assert.IsFalse(result.Success, "Cannot enhance beyond +10");
        }
    }
}

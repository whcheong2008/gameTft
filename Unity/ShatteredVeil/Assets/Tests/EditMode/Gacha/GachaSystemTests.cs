using System;
using System.Collections.Generic;
using NUnit.Framework;
using ShatteredVeil.Core.Gacha;

namespace ShatteredVeil.Tests.EditMode.Gacha
{
    [TestFixture]
    public class GachaSystemTests
    {
        private class MockGachaConfig : IGachaConfig
        {
            public int PullCostVE => 50;
            public int MultiPullCount => 10;
            public int MultiPullDiscount => 50;
            public int HardPityThreshold => 50;
            public float SoftPityStartPull => 40;
            public float SoftPityRateIncrease => 1.0f;
            public int RateTableCount => 11;
            public float EvolvedCopyChance => 0.15f;

            // Ground truth tier weights from GROUND-TRUTH.md section 10
            private static readonly Dictionary<int, float[]> _rates = new Dictionary<int, float[]>
            {
                { 1, new float[] { 75, 25, 0, 0, 0 } },
                { 3, new float[] { 60, 35, 5, 0, 0 } },
                { 5, new float[] { 45, 38, 17, 0, 0 } },
                { 7, new float[] { 35, 33, 32, 0, 0 } },
                { 9, new float[] { 28, 28, 38, 6, 0 } },
                { 11, new float[] { 22, 25, 40, 13, 0 } },
                { 13, new float[] { 18, 22, 38, 22, 0 } },
                { 15, new float[] { 15, 18, 35, 30, 2 } },
                { 17, new float[] { 12, 15, 30, 37, 6 } },
                { 19, new float[] { 10, 12, 25, 43, 10 } },
                { 20, new float[] { 8, 10, 22, 50, 10 } }
            };

            public float GetTierRate(int playerLevel, int tier)
            {
                float[] best = _rates[1];
                foreach (var kv in _rates)
                {
                    if (kv.Key <= playerLevel)
                        best = kv.Value;
                }
                return best[tier - 1];
            }
        }

        private MockGachaConfig _config;
        private List<string> _t1Pool;
        private List<string> _t2Pool;
        private List<string> _t3Pool;
        private List<string> _t4Pool;
        private List<string> _t5Pool;

        [SetUp]
        public void Setup()
        {
            _config = new MockGachaConfig();
            _t1Pool = new List<string> { "unit_t1_a", "unit_t1_b", "unit_t1_c" };
            _t2Pool = new List<string> { "unit_t2_a", "unit_t2_b" };
            _t3Pool = new List<string> { "unit_t3_a", "unit_t3_b" };
            _t4Pool = new List<string> { "unit_t4_a", "unit_t4_b" };
            _t5Pool = new List<string> { "unit_t5_a", "unit_t5_b" };
        }

        [Test]
        public void SinglePull_ReturnsValidUnit()
        {
            var system = new GachaSystem(_config, new Random(42));
            var result = system.Pull(1, 0, _t1Pool, _t2Pool, _t3Pool, _t4Pool, _t5Pool);

            Assert.IsNotNull(result.UnitId);
            Assert.IsTrue(result.Tier >= 1 && result.Tier <= 5);
        }

        [Test]
        public void Pull_Level1_OnlyT1AndT2()
        {
            var system = new GachaSystem(_config, new Random(42));
            for (int i = 0; i < 100; i++)
            {
                var result = system.Pull(1, 0, _t1Pool, _t2Pool, _t3Pool, _t4Pool, _t5Pool);
                Assert.IsTrue(result.Tier == 1 || result.Tier == 2,
                    $"Level 1 should only produce T1 or T2, got T{result.Tier}");
            }
        }

        [Test]
        public void Distribution_Level1_10000Pulls_MatchesRates()
        {
            var system = new GachaSystem(_config, new Random(12345));
            int[] tierCounts = new int[6]; // index 1-5

            for (int i = 0; i < 10000; i++)
            {
                var result = system.Pull(1, 0, _t1Pool, _t2Pool, _t3Pool, _t4Pool, _t5Pool);
                tierCounts[result.Tier]++;
            }

            // Level 1: T1=75%, T2=25%, T3-T5=0%
            float t1Pct = tierCounts[1] / 100f;
            float t2Pct = tierCounts[2] / 100f;

            Assert.AreEqual(75f, t1Pct, 2f, $"T1 expected ~75%, got {t1Pct}%");
            Assert.AreEqual(25f, t2Pct, 2f, $"T2 expected ~25%, got {t2Pct}%");
            Assert.AreEqual(0, tierCounts[3], "T3 should be 0 at level 1");
            Assert.AreEqual(0, tierCounts[4], "T4 should be 0 at level 1");
            Assert.AreEqual(0, tierCounts[5], "T5 should be 0 at level 1");
        }

        [Test]
        public void T5_NeverAppears_BelowLevel15()
        {
            var system = new GachaSystem(_config, new Random(42));

            for (int level = 1; level <= 14; level++)
            {
                for (int i = 0; i < 500; i++)
                {
                    var result = system.Pull(level, 0, _t1Pool, _t2Pool, _t3Pool, _t4Pool, _t5Pool);
                    Assert.AreNotEqual(5, result.Tier,
                        $"T5 appeared at level {level}, pull {i}");
                }
            }
        }

        [Test]
        public void T5_AppearsAtLevel15()
        {
            var system = new GachaSystem(_config, new Random(42));
            bool foundT5 = false;

            // With 2% rate, in 5000 pulls we should see at least one T5
            for (int i = 0; i < 5000; i++)
            {
                var result = system.Pull(15, 0, _t1Pool, _t2Pool, _t3Pool, _t4Pool, _t5Pool);
                if (result.Tier == 5)
                {
                    foundT5 = true;
                    break;
                }
            }

            Assert.IsTrue(foundT5, "T5 should appear at level 15 (2% rate)");
        }

        [Test]
        public void PityCounter_Increments()
        {
            var system = new GachaSystem(_config, new Random(42));
            var result = system.Pull(1, 0, _t1Pool, _t2Pool, _t3Pool, _t4Pool, _t5Pool);

            Assert.AreEqual(1, result.NewPityCount, "Pity count should be 1 after first pull");
        }

        [Test]
        public void HardPity_ForcesHighestAvailableTier()
        {
            var system = new GachaSystem(_config, new Random(42));
            // At level 1, highest tier is T2 (25% rate)
            // Set pity to threshold - 1, next pull should trigger
            var result = system.Pull(1, 49, _t1Pool, _t2Pool, _t3Pool, _t4Pool, _t5Pool);

            Assert.IsTrue(result.IsPity, "Pity should trigger at threshold");
            Assert.AreEqual(2, result.Tier, "At level 1, highest available tier is T2");
        }

        [Test]
        public void HardPity_AtLevel15_ForcesT5()
        {
            var system = new GachaSystem(_config, new Random(42));
            var result = system.Pull(15, 49, _t1Pool, _t2Pool, _t3Pool, _t4Pool, _t5Pool);

            Assert.IsTrue(result.IsPity, "Pity should trigger at threshold");
            Assert.AreEqual(5, result.Tier, "At level 15, highest available tier is T5");
        }

        [Test]
        public void PityResets_AfterTrigger()
        {
            var system = new GachaSystem(_config, new Random(42));
            var result = system.Pull(15, 49, _t1Pool, _t2Pool, _t3Pool, _t4Pool, _t5Pool);

            Assert.IsTrue(result.IsPity);
            Assert.AreEqual(0, result.NewPityCount, "Pity count should reset to 0 after trigger");
        }

        [Test]
        public void SoftPity_IncreasesHighTierRate()
        {
            // Get rates at soft pity start vs well past it
            var system = new GachaSystem(_config, new Random(42));

            var ratesBefore = system.GetCurrentRates(15, 0);
            var ratesAfter = system.GetCurrentRates(15, 45); // 5 pulls past soft pity start

            Assert.Greater(ratesAfter.T5Rate, ratesBefore.T5Rate,
                "Soft pity should increase highest tier rate");
        }

        [Test]
        public void MultiPull_TracksCorrectPityCount()
        {
            var system = new GachaSystem(_config, new Random(42));
            var results = system.MultiPull(1, 0, 10, _t1Pool, _t2Pool, _t3Pool, _t4Pool, _t5Pool);

            Assert.AreEqual(10, results.Count);

            // Each pull's pity should be one more than the previous (unless pity triggered)
            int expectedPity = 0;
            for (int i = 0; i < results.Count; i++)
            {
                expectedPity++;
                if (results[i].IsPity || results[i].Tier >= 5)
                    expectedPity = 0;
                Assert.AreEqual(expectedPity, results[i].NewPityCount,
                    $"Pity tracking wrong at pull {i}");
            }
        }

        [Test]
        public void MultiPull_PityCanTriggerMidBatch()
        {
            var system = new GachaSystem(_config, new Random(42));
            // Start with pity at 45, so pull 5 of 10 should trigger hard pity
            var results = system.MultiPull(15, 45, 10, _t1Pool, _t2Pool, _t3Pool, _t4Pool, _t5Pool);

            Assert.AreEqual(10, results.Count);

            bool pityTriggered = false;
            for (int i = 0; i < results.Count; i++)
            {
                if (results[i].IsPity)
                {
                    pityTriggered = true;
                    Assert.AreEqual(5, results[i].Tier, "Pity at L15 should force T5");
                }
            }

            Assert.IsTrue(pityTriggered, "Pity should trigger within 10-pull starting at 45");
        }

        [Test]
        public void EvolvedCopy_MechanicWorks()
        {
            // Use a seeded RNG that will hit the 15% evolved copy chance
            // Run many pulls to statistically verify
            var system = new GachaSystem(_config, new Random(42));

            int evolvedCount = 0;
            int totalPulls = 10000;

            Func<string, string> getEvolved = (id) => id == "unit_t1_a" ? "unit_t1_a_evo" : null;
            Func<string, bool> ownsEvolved = (id) => id == "unit_t1_a_evo";

            for (int i = 0; i < totalPulls; i++)
            {
                var result = system.Pull(1, 0, _t1Pool, _t2Pool, _t3Pool, _t4Pool, _t5Pool,
                    getEvolved, ownsEvolved);
                if (result.IsEvolvedCopy)
                    evolvedCount++;
            }

            // unit_t1_a has 1/3 chance of being picked from T1 pool,
            // then 15% chance of evolving. So ~5% of T1 pulls should be evolved.
            // With 75% T1 rate, that's ~3.75% of all pulls.
            float evolvedPct = evolvedCount / (float)totalPulls * 100f;
            Assert.Greater(evolvedCount, 0, "Should have some evolved copies");
            Assert.Less(evolvedPct, 10f, "Evolved copy rate should be reasonable");
        }

        [Test]
        public void GetCurrentRates_Level1_MatchesConfig()
        {
            var system = new GachaSystem(_config, new Random(42));
            var rates = system.GetCurrentRates(1, 0);

            Assert.AreEqual(75f, rates.T1Rate, 0.01f);
            Assert.AreEqual(25f, rates.T2Rate, 0.01f);
            Assert.AreEqual(0f, rates.T3Rate, 0.01f);
            Assert.AreEqual(0f, rates.T4Rate, 0.01f);
            Assert.AreEqual(0f, rates.T5Rate, 0.01f);
        }

        [Test]
        public void GetCurrentRates_Level20_MatchesConfig()
        {
            var system = new GachaSystem(_config, new Random(42));
            var rates = system.GetCurrentRates(20, 0);

            Assert.AreEqual(8f, rates.T1Rate, 0.01f);
            Assert.AreEqual(10f, rates.T2Rate, 0.01f);
            Assert.AreEqual(22f, rates.T3Rate, 0.01f);
            Assert.AreEqual(50f, rates.T4Rate, 0.01f);
            Assert.AreEqual(10f, rates.T5Rate, 0.01f);
        }
    }
}

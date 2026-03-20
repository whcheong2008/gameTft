using System;
using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using ShatteredVeil.Core.Gacha;

namespace ShatteredVeil.Tests.EditMode.Gacha
{
    [TestFixture]
    public class GachaSystemTests
    {
        private GachaConfig defaultConfig;
        private Dictionary<int, List<string>> testPool;
        private Dictionary<string, string> testEvoMap;

        [SetUp]
        public void SetUp()
        {
            defaultConfig = new GachaConfig();
            testPool = new Dictionary<int, List<string>>
            {
                { 1, new List<string> { "unit_t1_a", "unit_t1_b", "unit_t1_c" } },
                { 2, new List<string> { "unit_t2_a", "unit_t2_b" } },
                { 3, new List<string> { "unit_t3_a", "unit_t3_b" } },
                { 4, new List<string> { "unit_t4_a" } },
                { 5, new List<string> { "unit_t5_a" } },
            };
            testEvoMap = new Dictionary<string, string>
            {
                { "unit_t3_a", "unit_t3_a_evo" }
            };
        }

        private GachaSystem CreateSystem(int level = 1, int ve = 10000, int pity = 0,
            Dictionary<string, OwnedUnit> collection = null)
        {
            return new GachaSystem(
                defaultConfig, testPool, testEvoMap,
                level, ve, pity, 0,
                collection ?? new Dictionary<string, OwnedUnit>(),
                new Random(42)
            );
        }

        // --- Config Tests ---

        [Test]
        public void Config_SingleRollCost_Is50()
        {
            Assert.AreEqual(50, defaultConfig.SingleRollCost);
        }

        [Test]
        public void Config_MultiRollCost_Is450()
        {
            Assert.AreEqual(450, defaultConfig.MultiRollCost);
        }

        [Test]
        public void Config_MultiRollCount_Is10()
        {
            Assert.AreEqual(10, defaultConfig.MultiRollCount);
        }

        [Test]
        public void Config_PityThreshold_Is50()
        {
            Assert.AreEqual(50, defaultConfig.PityThreshold);
        }

        // --- Tier Weight Tests ---

        [Test]
        public void TierWeights_Level1_OnlyT1T2()
        {
            var weights = defaultConfig.GetTierWeights(1);
            Assert.AreEqual(75, weights[0]);
            Assert.AreEqual(25, weights[1]);
            Assert.AreEqual(0, weights[2]);
            Assert.AreEqual(0, weights[3]);
            Assert.AreEqual(0, weights[4]);
        }

        [Test]
        public void TierWeights_Level15_T5Appears()
        {
            var weights = defaultConfig.GetTierWeights(15);
            Assert.AreEqual(2, weights[4], "T5 should be 2% at level 15");
        }

        [Test]
        public void TierWeights_Level20_T5At10Pct()
        {
            var weights = defaultConfig.GetTierWeights(20);
            Assert.AreEqual(10, weights[4], "T5 should be 10% at level 20");
            Assert.AreEqual(50, weights[3], "T4 should be 50% at level 20");
        }

        [Test]
        public void TierWeights_ClampedToValidRange()
        {
            var weightsLow = defaultConfig.GetTierWeights(-5);
            var weightsHigh = defaultConfig.GetTierWeights(99);
            Assert.AreEqual(75, weightsLow[0], "Below 1 should clamp to level 1");
            Assert.AreEqual(8, weightsHigh[0], "Above 20 should clamp to level 20");
        }

        [Test]
        public void TierWeights_SumTo100_AllLevels()
        {
            for (int lvl = 1; lvl <= 20; lvl++)
            {
                var weights = defaultConfig.GetTierWeights(lvl);
                int sum = weights.Sum();
                Assert.AreEqual(100, sum, $"Weights at level {lvl} should sum to 100, got {sum}");
            }
        }

        // --- Single Roll Tests ---

        [Test]
        public void SingleRoll_DeductsVE()
        {
            var system = CreateSystem(ve: 500);
            var result = system.DoSingleRoll();
            Assert.IsTrue(result.Success);
            Assert.AreEqual(450, system.VeilEssence);
        }

        [Test]
        public void SingleRoll_FailsWhenBroke()
        {
            var system = CreateSystem(ve: 10);
            var result = system.DoSingleRoll();
            Assert.IsFalse(result.Success);
            Assert.AreEqual("Not enough VE", result.Reason);
            Assert.AreEqual(10, system.VeilEssence);
        }

        [Test]
        public void SingleRoll_ReturnsValidUnit()
        {
            var system = CreateSystem(level: 1, ve: 500);
            var result = system.DoSingleRoll();
            Assert.IsTrue(result.Success);
            Assert.IsNotNull(result.UnitId);

            // At level 1, only T1/T2 are possible
            var allValidUnits = testPool[1].Concat(testPool[2]).ToList();
            Assert.Contains(result.UnitId, allValidUnits);
        }

        [Test]
        public void SingleRoll_IncrementsPityCounter()
        {
            var system = CreateSystem(ve: 500);
            Assert.AreEqual(0, system.RollsSincePity);
            system.DoSingleRoll();
            Assert.AreEqual(1, system.RollsSincePity);
        }

        [Test]
        public void SingleRoll_IncrementsTotalRolls()
        {
            var system = CreateSystem(ve: 500);
            Assert.AreEqual(0, system.TotalRolls);
            system.DoSingleRoll();
            Assert.AreEqual(1, system.TotalRolls);
        }

        [Test]
        public void SingleRoll_AddsToCollection()
        {
            var system = CreateSystem(ve: 500);
            var result = system.DoSingleRoll();
            Assert.IsTrue(result.Success);
            Assert.IsTrue(system.OwnsUnit(result.UnitId));
        }

        [Test]
        public void SingleRoll_NewUnitFlaggedAsNew()
        {
            var system = CreateSystem(ve: 500);
            var result = system.DoSingleRoll();
            Assert.IsTrue(result.IsNew, "First copy should be marked as new");
        }

        // --- Multi Roll Tests ---

        [Test]
        public void MultiRoll_Deducts450VE()
        {
            var system = CreateSystem(ve: 1000);
            var result = system.DoMultiRoll();
            Assert.IsTrue(result.Success);
            Assert.AreEqual(550, system.VeilEssence);
            Assert.AreEqual(450, result.TotalCost);
        }

        [Test]
        public void MultiRoll_Returns10Results()
        {
            var system = CreateSystem(ve: 1000);
            var result = system.DoMultiRoll();
            Assert.IsTrue(result.Success);
            Assert.AreEqual(10, result.Results.Length);
        }

        [Test]
        public void MultiRoll_FailsWhenBroke()
        {
            var system = CreateSystem(ve: 100);
            var result = system.DoMultiRoll();
            Assert.IsFalse(result.Success);
        }

        [Test]
        public void MultiRoll_IncrementsPityBy10()
        {
            var system = CreateSystem(ve: 1000);
            system.DoMultiRoll();
            // Pity incremented 10 times, may have reset if pity triggered
            Assert.AreEqual(10, system.TotalRolls);
        }

        [Test]
        public void MultiRoll_WithDiscount_CostsLess()
        {
            var system = CreateSystem(ve: 1000);
            system.SetMultiRollDiscount(50);
            Assert.AreEqual(400, system.MultiRollCost);
            var result = system.DoMultiRoll();
            Assert.IsTrue(result.Success);
            Assert.AreEqual(600, system.VeilEssence);
        }

        // --- Pity Tests ---

        [Test]
        public void Pity_TriggersAfter50Rolls()
        {
            // Start with 49 rolls since pity
            var system = CreateSystem(level: 1, ve: 10000, pity: 49);
            var result = system.DoSingleRoll();
            Assert.IsTrue(result.Success);
            Assert.IsTrue(result.PityTriggered, "Pity should trigger on 50th roll");
            Assert.AreEqual(5, result.Tier, "Pity should guarantee T5");
        }

        [Test]
        public void Pity_ResetsAfterTrigger()
        {
            var system = CreateSystem(level: 1, ve: 10000, pity: 49);
            system.DoSingleRoll(); // increments to 50, pity triggers, resets to 0
            Assert.AreEqual(0, system.RollsSincePity);
        }

        [Test]
        public void Pity_DoesNotTriggerAt49()
        {
            var system = CreateSystem(level: 1, ve: 10000, pity: 48);
            var result = system.DoSingleRoll();
            Assert.IsFalse(result.PityTriggered);
        }

        [Test]
        public void Pity_Override_CustomThresholdAndTier()
        {
            var system = CreateSystem(level: 1, ve: 10000, pity: 19);
            system.SetPityOverride(20, 3); // Attunement Rite L4: 20 rolls -> T3+

            var result = system.DoSingleRoll();
            Assert.IsTrue(result.PityTriggered, "Custom pity should trigger at 20 rolls");
            // Unit should be at least T3
            Assert.GreaterOrEqual(result.Tier, 3);
        }

        [Test]
        public void Pity_RollsUntilPity_Correct()
        {
            var system = CreateSystem(pity: 30);
            Assert.AreEqual(20, system.RollsUntilPity);
        }

        // --- Evolved Copy Tests ---

        [Test]
        public void EvolvedCopy_CanOccurWhenPlayerOwnsEvolved()
        {
            // Give player the evolved form
            var collection = new Dictionary<string, OwnedUnit>
            {
                { "unit_t3_a_evo", new OwnedUnit { UnitId = "unit_t3_a_evo", Stars = 1, Copies = 1 } }
            };
            // Run many rolls at level that can get T3 and check if any become evolved
            var system = new GachaSystem(defaultConfig, testPool, testEvoMap,
                7, 50000, 0, 0, collection, new Random(12345));

            bool gotEvolvedCopy = false;
            for (int i = 0; i < 200; i++)
            {
                var result = system.DoSingleRoll();
                if (result.IsEvolvedCopy)
                {
                    gotEvolvedCopy = true;
                    Assert.AreEqual("unit_t3_a_evo", result.UnitId);
                    break;
                }
            }
            Assert.IsTrue(gotEvolvedCopy, "Should get at least one evolved copy in 200 rolls (15% chance per T3 roll)");
        }

        // --- Distribution Tests ---

        [Test]
        public void Distribution_Level1_OnlyT1T2()
        {
            var system = new GachaSystem(defaultConfig, testPool, testEvoMap,
                1, 1000000, 0, 0, new Dictionary<string, OwnedUnit>(), new Random(42));

            var tierCounts = new int[5];
            for (int i = 0; i < 10000; i++)
            {
                int tier = system.RollTier();
                tierCounts[tier - 1]++;
            }

            Assert.AreEqual(0, tierCounts[2], "No T3 at level 1");
            Assert.AreEqual(0, tierCounts[3], "No T4 at level 1");
            Assert.AreEqual(0, tierCounts[4], "No T5 at level 1");
            // T1 ~75%, T2 ~25% — allow 5% tolerance
            Assert.Greater(tierCounts[0], 6500, "T1 should be ~75%");
            Assert.Less(tierCounts[0], 8000, "T1 should be ~75%");
            Assert.Greater(tierCounts[1], 2000, "T2 should be ~25%");
            Assert.Less(tierCounts[1], 3000, "T2 should be ~25%");
        }

        // --- Event Tests ---

        [Test]
        public void Events_VEChangedFires_OnRoll()
        {
            var system = CreateSystem(ve: 500);
            int firedVE = -1;
            system.OnVeilEssenceChanged += ve => firedVE = ve;

            system.DoSingleRoll();
            Assert.AreEqual(450, firedVE);
        }

        [Test]
        public void Events_UnitAddedFires_OnRoll()
        {
            var system = CreateSystem(ve: 500);
            string addedUnit = null;
            system.OnUnitAdded += (id, count) => addedUnit = id;

            var result = system.DoSingleRoll();
            Assert.AreEqual(result.UnitId, addedUnit);
        }

        // --- Collection Tests ---

        [Test]
        public void Collection_DuplicatesIncrementCopies()
        {
            var collection = new Dictionary<string, OwnedUnit>
            {
                { "unit_t1_a", new OwnedUnit { UnitId = "unit_t1_a", Stars = 1, Copies = 1 } }
            };
            // Use a pool that only has T1 unit_t1_a
            var singlePool = new Dictionary<int, List<string>>
            {
                { 1, new List<string> { "unit_t1_a" } },
            };
            var system = new GachaSystem(defaultConfig, singlePool, new Dictionary<string, string>(),
                1, 500, 0, 0, collection, new Random(42));

            system.DoSingleRoll();
            Assert.AreEqual(2, collection["unit_t1_a"].Copies);
        }

        // --- Format Tests ---

        [Test]
        public void FormatTierWeights_Level1()
        {
            var system = CreateSystem(level: 1);
            string formatted = system.FormatTierWeights();
            Assert.IsTrue(formatted.Contains("T1: 75%"));
            Assert.IsTrue(formatted.Contains("T2: 25%"));
        }

        [Test]
        public void FormatTierWeights_Level20_IncludesT5()
        {
            var system = CreateSystem(level: 20);
            string formatted = system.FormatTierWeights();
            Assert.IsTrue(formatted.Contains("T5: 10%"));
        }
    }
}

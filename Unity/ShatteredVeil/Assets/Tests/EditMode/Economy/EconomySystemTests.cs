using NUnit.Framework;
using ShatteredVeil.Core.Economy;

namespace ShatteredVeil.Tests.EditMode.Economy
{
    [TestFixture]
    public class EconomySystemTests
    {
        private class MockEconomyConfig : IEconomyConfig
        {
            public int PullCostVE => 50;

            // XP per level from GROUND-TRUTH.md section 13
            private static readonly int[] _xpPerLevel = {
                360, 360, 390, 390, 390,    // L2-6
                600, 600, 600,              // L7-9
                840, 840, 840,              // L10-12
                1266, 1267, 1267,           // L13-15
                2500, 2500,                 // L16-17
                3250, 3250,                 // L18-19
                6400                        // L20
            };

            public int GetXPForLevel(int level)
            {
                int index = level - 2;
                if (index < 0 || index >= _xpPerLevel.Length) return 0;
                return _xpPerLevel[index];
            }

            // Level caps: R1=4, R2=7, R3=10, R4=13, R5=16, R6=18, R7+=20
            private static readonly int[] _caps = { 4, 4, 7, 10, 13, 16, 18, 20, 20 };

            public int GetLevelCap(int region)
            {
                if (region < 0) return 4;
                if (region >= _caps.Length) return 20;
                return _caps[region];
            }

            public int GetTeamSize(int level)
            {
                if (level >= 17) return 8;
                if (level >= 16) return 7;
                if (level >= 12) return 6;
                if (level >= 8) return 5;
                if (level >= 4) return 4;
                return 3;
            }

            public int GetStarUpCopyCost(int tier)
            {
                switch (tier)
                {
                    case 1: return 3;
                    case 2: return 4;
                    case 3: return 5;
                    case 4: return 8;
                    case 5: return 10;
                    default: return 3;
                }
            }

            // VE costs per star: 0->1=100, 1->2=200, 2->3=400, 3->4=800, 4->5=1500
            public int GetStarUpVECost(int currentStar, int tier)
            {
                switch (currentStar)
                {
                    case 0: return 100;
                    case 1: return 200;
                    case 2: return 400;
                    case 3: return 800;
                    case 4: return 1500;
                    default: return 0;
                }
            }

            public int GetEvolutionVECost(int tier)
            {
                switch (tier)
                {
                    case 1: return 500;
                    case 2: return 750;
                    case 3: return 1000;
                    case 4: return 1500;
                    case 5: return 2000;
                    default: return 500;
                }
            }

            // Practice configs
            public int GetPracticeMaxLevel(string practiceId)
            {
                switch (practiceId)
                {
                    case "attunement_rite": return 5;
                    case "essence_reservoir": return 5;
                    case "sustained_bonds": return 1;
                    case "deep_resonance": return 3;
                    default: return 0;
                }
            }

            public int GetPracticeUpgradeCost(string practiceId, int currentLevel)
            {
                if (practiceId == "attunement_rite")
                {
                    int[] costs = { 0, 80, 200, 400, 800, 1500 };
                    int next = currentLevel + 1;
                    return next < costs.Length ? costs[next] : 0;
                }
                if (practiceId == "essence_reservoir")
                {
                    int[] costs = { 0, 50, 120, 300, 600, 1000 };
                    int next = currentLevel + 1;
                    return next < costs.Length ? costs[next] : 0;
                }
                if (practiceId == "sustained_bonds")
                {
                    int[] costs = { 0, 500 };
                    int next = currentLevel + 1;
                    return next < costs.Length ? costs[next] : 0;
                }
                return 0;
            }
        }

        private MockEconomyConfig _config;
        private EconomySystem _system;

        [SetUp]
        public void Setup()
        {
            _config = new MockEconomyConfig();
            _system = new EconomySystem(_config);
        }

        // --- VE Resource Tests ---

        [Test]
        public void SpendVE_DeductsCorrectly()
        {
            int ve = 500;
            bool result = _system.SpendVE(ref ve, 200);
            Assert.IsTrue(result);
            Assert.AreEqual(300, ve);
        }

        [Test]
        public void SpendVE_FailsWhenInsufficient()
        {
            int ve = 100;
            bool result = _system.SpendVE(ref ve, 200);
            Assert.IsFalse(result);
            Assert.AreEqual(100, ve, "VE should not change on failure");
        }

        [Test]
        public void CanAfford_ReturnsCorrectly()
        {
            Assert.IsTrue(_system.CanAfford(500, 500));
            Assert.IsTrue(_system.CanAfford(500, 100));
            Assert.IsFalse(_system.CanAfford(100, 500));
        }

        [Test]
        public void GrantVE_AddsCorrectly()
        {
            int ve = 100;
            _system.GrantVE(ref ve, 350);
            Assert.AreEqual(450, ve);
        }

        // --- XP / Level-Up Tests ---

        [Test]
        public void XPLevelUp_AtCorrectThreshold()
        {
            int xp = 0;
            int level = 1;
            // L2 requires 360 XP
            var result = _system.AddXP(ref xp, ref level, 360, 8); // R8 cap = 20
            Assert.AreEqual(2, level);
            Assert.AreEqual(1, result.LevelsGained);
            Assert.AreEqual(0, xp, "No remainder XP");
        }

        [Test]
        public void MultiLevelUp_Works()
        {
            int xp = 0;
            int level = 1;
            // L2 needs 360, L3 needs 360, L4 needs 390 = 1110 total
            var result = _system.AddXP(ref xp, ref level, 1110, 8);
            Assert.AreEqual(4, level);
            Assert.AreEqual(3, result.LevelsGained);
        }

        [Test]
        public void LevelCap_EnforcedPerRegion()
        {
            int xp = 0;
            int level = 3;
            // R1 cap = 4, so should only level up to 4 max
            var result = _system.AddXP(ref xp, ref level, 99999, 1); // Region 1
            Assert.AreEqual(4, level, "Should cap at level 4 for R1");
        }

        [Test]
        public void LevelCap_R2_Is7()
        {
            int xp = 0;
            int level = 1;
            var result = _system.AddXP(ref xp, ref level, 99999, 2); // Region 2
            Assert.AreEqual(7, level, "Should cap at level 7 for R2");
        }

        [Test]
        public void XPLevelUp_TeamSizeChanges()
        {
            int xp = 0;
            int level = 3;
            // Level 4 grants team size 4 (from 3)
            var result = _system.AddXP(ref xp, ref level, 390, 8);
            Assert.AreEqual(4, level);
            Assert.IsTrue(result.TeamSizeChanged);
            Assert.AreEqual(4, result.NewTeamSize);
        }

        // --- Team Size Progression ---

        [Test]
        public void TeamSize_Level1_Is3()
        {
            Assert.AreEqual(3, _system.GetTeamSize(1));
        }

        [Test]
        public void TeamSize_Level4_Is4()
        {
            Assert.AreEqual(4, _system.GetTeamSize(4));
        }

        [Test]
        public void TeamSize_Level8_Is5()
        {
            Assert.AreEqual(5, _system.GetTeamSize(8));
        }

        [Test]
        public void TeamSize_Level12_Is6()
        {
            Assert.AreEqual(6, _system.GetTeamSize(12));
        }

        [Test]
        public void TeamSize_Level16_Is7()
        {
            Assert.AreEqual(7, _system.GetTeamSize(16));
        }

        [Test]
        public void TeamSize_Level17_Is8()
        {
            Assert.AreEqual(8, _system.GetTeamSize(17));
        }

        [Test]
        public void TeamSize_BetweenBreakpoints_RetainsPrevious()
        {
            Assert.AreEqual(3, _system.GetTeamSize(2));
            Assert.AreEqual(3, _system.GetTeamSize(3));
            Assert.AreEqual(4, _system.GetTeamSize(5));
            Assert.AreEqual(4, _system.GetTeamSize(7));
            Assert.AreEqual(5, _system.GetTeamSize(9));
            Assert.AreEqual(5, _system.GetTeamSize(11));
            Assert.AreEqual(6, _system.GetTeamSize(15));
        }

        // --- Star-Up Copy Costs ---

        [Test]
        public void StarUpCopyCost_T1_Is3()
        {
            Assert.AreEqual(3, _system.GetStarUpCopyCost(1));
        }

        [Test]
        public void StarUpCopyCost_T2_Is4()
        {
            Assert.AreEqual(4, _system.GetStarUpCopyCost(2));
        }

        [Test]
        public void StarUpCopyCost_T3_Is5()
        {
            Assert.AreEqual(5, _system.GetStarUpCopyCost(3));
        }

        [Test]
        public void StarUpCopyCost_T4_Is8()
        {
            Assert.AreEqual(8, _system.GetStarUpCopyCost(4));
        }

        [Test]
        public void StarUpCopyCost_T5_Is10()
        {
            Assert.AreEqual(10, _system.GetStarUpCopyCost(5));
        }

        // --- Star-Up VE Costs ---

        [Test]
        public void StarUpVECost_MatchesGroundTruth()
        {
            Assert.AreEqual(100, _system.GetStarUpVECost(0, 1));
            Assert.AreEqual(200, _system.GetStarUpVECost(1, 1));
            Assert.AreEqual(400, _system.GetStarUpVECost(2, 1));
            Assert.AreEqual(800, _system.GetStarUpVECost(3, 1));
            Assert.AreEqual(1500, _system.GetStarUpVECost(4, 1));
        }

        // --- Star-Up Full Flow ---

        [Test]
        public void StarUp_DeductsCopiesAndVE()
        {
            int copies = 10;
            int ve = 1000;
            var result = _system.StarUp(0, ref copies, 1, ref ve);

            Assert.IsTrue(result.Success);
            Assert.AreEqual(1, result.NewStar);
            Assert.AreEqual(3, result.CopiesSpent); // T1 = 3 copies
            Assert.AreEqual(100, result.VESpent);    // Star 0->1 = 100 VE
            Assert.AreEqual(7, copies);
            Assert.AreEqual(900, ve);
        }

        [Test]
        public void StarUp_FailsWhenInsufficientCopies()
        {
            int copies = 2;
            int ve = 1000;
            var result = _system.StarUp(0, ref copies, 1, ref ve);

            Assert.IsFalse(result.Success);
            Assert.AreEqual(2, copies, "Copies unchanged on failure");
            Assert.AreEqual(1000, ve, "VE unchanged on failure");
        }

        [Test]
        public void StarUp_FailsWhenInsufficientVE()
        {
            int copies = 10;
            int ve = 50; // Not enough for 100 VE cost
            var result = _system.StarUp(0, ref copies, 1, ref ve);

            Assert.IsFalse(result.Success);
        }

        [Test]
        public void StarUp_FailsAtMaxStar()
        {
            int copies = 100;
            int ve = 10000;
            Assert.IsFalse(_system.CanStarUp(5, copies, 1, ve));
        }

        // --- Camp Practice Tests ---

        [Test]
        public void PracticeUpgrade_DeductsVE()
        {
            int level = 0;
            int ve = 500;
            bool result = _system.UpgradePractice("attunement_rite", ref level, ref ve);

            Assert.IsTrue(result);
            Assert.AreEqual(1, level);
            Assert.AreEqual(420, ve); // 500 - 80
        }

        [Test]
        public void PracticeUpgrade_Level1To2_CorrectCost()
        {
            int level = 1;
            int ve = 500;
            bool result = _system.UpgradePractice("attunement_rite", ref level, ref ve);

            Assert.IsTrue(result);
            Assert.AreEqual(2, level);
            Assert.AreEqual(300, ve); // 500 - 200
        }

        [Test]
        public void PracticeUpgrade_FailsPastMaxLevel()
        {
            int level = 5;
            int ve = 10000;
            bool result = _system.UpgradePractice("attunement_rite", ref level, ref ve);

            Assert.IsFalse(result);
            Assert.AreEqual(5, level, "Level unchanged");
            Assert.AreEqual(10000, ve, "VE unchanged");
        }

        [Test]
        public void PracticeUpgrade_FailsWhenInsufficientVE()
        {
            int level = 0;
            int ve = 10; // Not enough for 80 VE cost
            bool result = _system.UpgradePractice("attunement_rite", ref level, ref ve);

            Assert.IsFalse(result);
            Assert.AreEqual(0, level);
        }

        [Test]
        public void PracticeUpgrade_SustainedBonds_MaxLevel1()
        {
            int level = 0;
            int ve = 1000;
            bool result = _system.UpgradePractice("sustained_bonds", ref level, ref ve);

            Assert.IsTrue(result);
            Assert.AreEqual(1, level);
            Assert.AreEqual(500, ve); // 1000 - 500

            // Can't upgrade further
            bool result2 = _system.UpgradePractice("sustained_bonds", ref level, ref ve);
            Assert.IsFalse(result2);
        }

        // --- XP Curve Validation ---

        [Test]
        public void XPCurve_Level2_Requires360()
        {
            Assert.AreEqual(360, _system.GetXPForLevel(2));
        }

        [Test]
        public void XPCurve_Level10_Requires840()
        {
            Assert.AreEqual(840, _system.GetXPForLevel(10));
        }

        [Test]
        public void XPCurve_Level20_Requires6400()
        {
            Assert.AreEqual(6400, _system.GetXPForLevel(20));
        }

        [Test]
        public void XPCurve_FullPlaythrough_HitsLevel20()
        {
            // Total XP from a straight playthrough = 27,910
            int xp = 0;
            int level = 1;
            var result = _system.AddXP(ref xp, ref level, 27910, 8); // R8 = no cap
            Assert.AreEqual(20, level, "Full playthrough XP should reach level 20");
        }
    }
}

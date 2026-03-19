using NUnit.Framework;
using ShatteredVeil.Core.Heroes;

namespace ShatteredVeil.Tests.EditMode.Heroes
{
    [TestFixture]
    public class HeroCatalogTests
    {
        [Test]
        public void AllSixHeroesPresent()
        {
            Assert.AreEqual(6, HeroCatalog.Count);
        }

        [Test]
        public void TotalNodes_108()
        {
            // T5 capstones have 1 node (not 2), so 9 per branch x 2 x 6 = 108
            Assert.AreEqual(108, HeroCatalog.TotalNodes,
                "Expected 108 skill nodes (6 heroes x 2 branches x 9 nodes)");
        }

        [Test]
        public void EachHero_HasExactlyTwoBranches()
        {
            var all = HeroCatalog.GetAll();
            foreach (var kvp in all)
            {
                Assert.AreEqual(2, kvp.Value.Branches.Length,
                    kvp.Value.Name + " should have exactly 2 branches");
            }
        }

        [Test]
        public void EachBranch_HasNodesAtAllFiveTiers()
        {
            var all = HeroCatalog.GetAll();
            foreach (var kvp in all)
            {
                for (int b = 0; b < 2; b++)
                {
                    var branch = kvp.Value.Branches[b];
                    for (int tier = 1; tier <= 5; tier++)
                    {
                        bool found = false;
                        foreach (var node in branch.Nodes)
                        {
                            if (node.Tier == tier)
                            {
                                found = true;
                                break;
                            }
                        }
                        Assert.IsTrue(found,
                            kvp.Value.Name + " branch " + branch.Name + " missing tier " + tier);
                    }
                }
            }
        }

        [Test]
        public void EachTier1Through4_HasExactlyTwoChoices()
        {
            var all = HeroCatalog.GetAll();
            foreach (var kvp in all)
            {
                for (int b = 0; b < 2; b++)
                {
                    var branch = kvp.Value.Branches[b];
                    for (int tier = 1; tier <= 4; tier++)
                    {
                        int count = 0;
                        foreach (var node in branch.Nodes)
                        {
                            if (node.Tier == tier) count++;
                        }
                        Assert.AreEqual(2, count,
                            kvp.Value.Name + " " + branch.Name + " tier " + tier + " should have 2 choices");
                    }
                }
            }
        }

        [Test]
        public void Tier5_HasExactlyOneNode_IsCapstone()
        {
            var all = HeroCatalog.GetAll();
            foreach (var kvp in all)
            {
                for (int b = 0; b < 2; b++)
                {
                    var branch = kvp.Value.Branches[b];
                    int count = 0;
                    foreach (var node in branch.Nodes)
                    {
                        if (node.Tier == 5)
                        {
                            count++;
                            Assert.IsTrue(node.IsCapstone,
                                kvp.Value.Name + " " + branch.Name + " T5 should be capstone");
                        }
                    }
                    Assert.AreEqual(1, count,
                        kvp.Value.Name + " " + branch.Name + " should have 1 capstone");
                }
            }
        }

        [Test]
        public void EachBranch_HasExactlyNineNodes()
        {
            // T1=2 + T2=2 + T3=2 + T4=2 + T5=1 = 9
            var all = HeroCatalog.GetAll();
            foreach (var kvp in all)
            {
                for (int b = 0; b < 2; b++)
                {
                    var branch = kvp.Value.Branches[b];
                    Assert.AreEqual(9, branch.Nodes.Length,
                        kvp.Value.Name + " " + branch.Name + " should have 9 nodes");
                }
            }
        }

        [Test]
        public void PerHero_Has18Nodes()
        {
            // T5 has 1 capstone per branch (not 2), so 2+2+2+2+1 = 9 per branch, 18 per hero
            // Total: 6 heroes x 18 = 108 nodes (JS reference confirms T5 = 1 node)
            Assert.AreEqual(108, HeroCatalog.TotalNodes,
                "Expected 108 nodes (6 heroes x 2 branches x 9 nodes per branch)");
        }

        [TestCase(HeroId.Kael, "Kael", "Protection")]
        [TestCase(HeroId.Lyric, "Lyric", "Efficiency")]
        [TestCase(HeroId.Ren, "Ren", "Steadfast")]
        [TestCase(HeroId.Sera, "Sera", "Precision")]
        [TestCase(HeroId.Maren, "Maren", "Sustain")]
        [TestCase(HeroId.Voss, "Voss", "Momentum")]
        public void Hero_HasCorrectNameAndPhilosophy(HeroId id, string name, string philosophy)
        {
            var def = HeroCatalog.Get(id);
            Assert.IsNotNull(def);
            Assert.AreEqual(name, def.Name);
            Assert.AreEqual(philosophy, def.Philosophy);
        }

        [Test]
        public void Kael_BranchNames()
        {
            var def = HeroCatalog.Get(HeroId.Kael);
            Assert.AreEqual("Guardian's Oath", def.Branches[0].Name);
            Assert.AreEqual("Commander's Presence", def.Branches[1].Name);
        }

        [Test]
        public void Lyric_CanDie()
        {
            var def = HeroCatalog.Get(HeroId.Lyric);
            Assert.IsTrue(def.CanDie);
            Assert.AreEqual(4, def.DeathRegion);
        }

        [Test]
        public void Sera_LeavesAndReturns()
        {
            var def = HeroCatalog.Get(HeroId.Sera);
            Assert.AreEqual(4, def.LeaveRegion);
            Assert.AreEqual(5, def.ReturnRegion);
        }

        [Test]
        public void Maren_LeavesAndReturnsEarly()
        {
            var def = HeroCatalog.Get(HeroId.Maren);
            Assert.AreEqual(4, def.LeaveRegion);
            Assert.AreEqual(5, def.ReturnRegion);
            // Maren returns earlier than Sera
            var sera = HeroCatalog.Get(HeroId.Sera);
            Assert.Less(def.ReturnStage.Value, sera.ReturnStage.Value,
                "Maren should return earlier than Sera in R5");
        }

        [Test]
        public void TierCosts_MatchSpec()
        {
            var def = HeroCatalog.Get(HeroId.Kael);
            var branch = def.Branches[0];
            foreach (var node in branch.Nodes)
            {
                switch (node.Tier)
                {
                    case 1: Assert.AreEqual(1, node.Cost); break;
                    case 2: Assert.AreEqual(1, node.Cost); break;
                    case 3: Assert.AreEqual(2, node.Cost); break;
                    case 4: Assert.AreEqual(4, node.Cost); break;
                    case 5: Assert.AreEqual(5, node.Cost); break;
                }
            }
        }

        [Test]
        public void TierLevelReqs_MatchSpec()
        {
            var def = HeroCatalog.Get(HeroId.Kael);
            var branch = def.Branches[0];
            foreach (var node in branch.Nodes)
            {
                switch (node.Tier)
                {
                    case 1: Assert.AreEqual(1, node.LevelReq); break;
                    case 2: Assert.AreEqual(5, node.LevelReq); break;
                    case 3: Assert.AreEqual(9, node.LevelReq); break;
                    case 4: Assert.AreEqual(13, node.LevelReq); break;
                    case 5: Assert.AreEqual(17, node.LevelReq); break;
                }
            }
        }

        [Test]
        public void Voss_AcquiredInR7()
        {
            var def = HeroCatalog.Get(HeroId.Voss);
            Assert.AreEqual(7, def.AcquiredRegion);
        }

        [Test]
        public void FullBranchCost_Is13Points()
        {
            // T1(1) + T2(1) + T3(2) + T4(4) + T5(5) = 13
            var def = HeroCatalog.Get(HeroId.Kael);
            int cost = 0;
            foreach (var node in def.Branches[0].Nodes)
            {
                if (node.Choice == 0)
                    cost += node.Cost;
            }
            Assert.AreEqual(13, cost, "Full branch (single pick per tier) should cost 13 points");
        }
    }
}

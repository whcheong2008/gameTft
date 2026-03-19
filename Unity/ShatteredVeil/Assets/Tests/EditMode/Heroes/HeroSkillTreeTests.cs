using NUnit.Framework;
using ShatteredVeil.Core.Heroes;

namespace ShatteredVeil.Tests.EditMode.Heroes
{
    [TestFixture]
    public class HeroSkillTreeTests
    {
        private HeroState _hero;
        private HeroDefinition _def;

        [SetUp]
        public void SetUp()
        {
            _hero = new HeroState(HeroId.Kael) { Level = 20, SkillPoints = 20 };
            _def = HeroCatalog.Get(HeroId.Kael);
        }

        [Test]
        public void CanInvestT1_AtLevel1()
        {
            var hero = new HeroState(HeroId.Kael) { Level = 1, SkillPoints = 1 };
            Assert.IsTrue(HeroSkillTreeSystem.CanInvestNode(hero, _def, 0, 0));
        }

        [Test]
        public void CannotInvestT2_BelowLevel5()
        {
            var hero = new HeroState(HeroId.Kael) { Level = 4, SkillPoints = 20 };
            // Invest T1 first
            HeroSkillTreeSystem.InvestNode(hero, _def, 0, 0);
            // Try T2 (index 2)
            Assert.IsFalse(HeroSkillTreeSystem.CanInvestNode(hero, _def, 0, 2));
        }

        [Test]
        public void CanInvestT2_AtLevel5_WithPrevTier()
        {
            var hero = new HeroState(HeroId.Kael) { Level = 5, SkillPoints = 20 };
            HeroSkillTreeSystem.InvestNode(hero, _def, 0, 0); // T1 choice 0
            Assert.IsTrue(HeroSkillTreeSystem.CanInvestNode(hero, _def, 0, 2)); // T2 choice 0
        }

        [Test]
        public void CannotInvestT2_WithoutPrevTier()
        {
            var hero = new HeroState(HeroId.Kael) { Level = 5, SkillPoints = 20 };
            // Don't invest T1
            Assert.IsFalse(HeroSkillTreeSystem.CanInvestNode(hero, _def, 0, 2));
        }

        [Test]
        public void CannotPickBothChoices_SameTier()
        {
            HeroSkillTreeSystem.InvestNode(_hero, _def, 0, 0); // T1 choice 0
            Assert.IsFalse(HeroSkillTreeSystem.CanInvestNode(_hero, _def, 0, 1)); // T1 choice 1
        }

        [Test]
        public void CanPickDifferentBranches_SameTier()
        {
            HeroSkillTreeSystem.InvestNode(_hero, _def, 0, 0); // Branch 0, T1 choice 0
            Assert.IsTrue(HeroSkillTreeSystem.CanInvestNode(_hero, _def, 1, 0)); // Branch 1, T1 choice 0
        }

        [Test]
        public void Budget_FullBranch_Costs13()
        {
            // Invest full branch 0: T1c0, T2c0, T3c0, T4c0, T5c0
            HeroSkillTreeSystem.InvestNode(_hero, _def, 0, 0); // T1 = 1pt
            HeroSkillTreeSystem.InvestNode(_hero, _def, 0, 2); // T2 = 1pt
            HeroSkillTreeSystem.InvestNode(_hero, _def, 0, 4); // T3 = 2pt
            HeroSkillTreeSystem.InvestNode(_hero, _def, 0, 6); // T4 = 4pt
            HeroSkillTreeSystem.InvestNode(_hero, _def, 0, 8); // T5 = 5pt

            Assert.AreEqual(13, HeroSkillTreeSystem.GetPointsSpent(_hero, _def));
        }

        [Test]
        public void Budget_CannotFillBothCapstones()
        {
            // Full branch 0 = 13 pts
            HeroSkillTreeSystem.InvestNode(_hero, _def, 0, 0);
            HeroSkillTreeSystem.InvestNode(_hero, _def, 0, 2);
            HeroSkillTreeSystem.InvestNode(_hero, _def, 0, 4);
            HeroSkillTreeSystem.InvestNode(_hero, _def, 0, 6);
            HeroSkillTreeSystem.InvestNode(_hero, _def, 0, 8);

            // 7 points left, need 13 for full second branch
            // Even through T4 costs 8 (1+1+2+4)
            HeroSkillTreeSystem.InvestNode(_hero, _def, 1, 0); // T1 = 1pt (6 left)
            HeroSkillTreeSystem.InvestNode(_hero, _def, 1, 2); // T2 = 1pt (5 left)
            HeroSkillTreeSystem.InvestNode(_hero, _def, 1, 4); // T3 = 2pt (3 left)

            // T4 costs 4, only 3 left
            Assert.IsFalse(HeroSkillTreeSystem.CanInvestNode(_hero, _def, 1, 6),
                "Should not have enough points for second branch T4 after full first branch");
        }

        [Test]
        public void Respec_RefundsAllPoints()
        {
            HeroSkillTreeSystem.InvestNode(_hero, _def, 0, 0);
            HeroSkillTreeSystem.InvestNode(_hero, _def, 0, 2);
            Assert.AreEqual(2, _hero.InvestedNodes.Count);

            int ve = 1000;
            bool result = HeroSkillTreeSystem.Respec(_hero, ref ve);
            Assert.IsTrue(result);
            Assert.AreEqual(0, _hero.InvestedNodes.Count);
            Assert.AreEqual(500, ve); // 1000 - 500
        }

        [Test]
        public void Respec_CostIncreases()
        {
            int ve = 10000;

            Assert.AreEqual(500, HeroSkillTreeSystem.GetRespecCost(_hero));
            HeroSkillTreeSystem.Respec(_hero, ref ve);
            Assert.AreEqual(1000, HeroSkillTreeSystem.GetRespecCost(_hero));
            HeroSkillTreeSystem.Respec(_hero, ref ve);
            Assert.AreEqual(1500, HeroSkillTreeSystem.GetRespecCost(_hero));
        }

        [Test]
        public void Respec_FailsIfNotEnoughVE()
        {
            int ve = 499;
            Assert.IsFalse(HeroSkillTreeSystem.Respec(_hero, ref ve));
            Assert.AreEqual(499, ve);
        }

        [Test]
        public void CannotInvest_WhenDead()
        {
            _hero.IsDead = true;
            Assert.IsFalse(HeroSkillTreeSystem.CanInvestNode(_hero, _def, 0, 0));
        }

        [Test]
        public void InvestNode_ReturnsFalse_WhenCannotInvest()
        {
            var hero = new HeroState(HeroId.Kael) { Level = 1, SkillPoints = 0 };
            Assert.IsFalse(HeroSkillTreeSystem.InvestNode(hero, _def, 0, 0));
        }

        [Test]
        public void CannotInvestSameNodeTwice()
        {
            HeroSkillTreeSystem.InvestNode(_hero, _def, 0, 0);
            Assert.IsFalse(HeroSkillTreeSystem.CanInvestNode(_hero, _def, 0, 0));
        }

        [Test]
        public void GetInvestedNodes_ReturnsCorrectNodes()
        {
            HeroSkillTreeSystem.InvestNode(_hero, _def, 0, 0);
            HeroSkillTreeSystem.InvestNode(_hero, _def, 1, 0);

            var nodes = HeroSkillTreeSystem.GetInvestedSkillNodes(_hero, _def);
            Assert.AreEqual(2, nodes.Count);
            Assert.AreEqual("Shield Ally", nodes[0].Name);
            Assert.AreEqual("Rallying Presence", nodes[1].Name);
        }
    }
}

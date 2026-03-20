using NUnit.Framework;
using ShatteredVeil.Core.Units;

namespace ShatteredVeil.Tests.EditMode.Units
{
    [TestFixture]
    public class EvolutionSystemTests
    {
        [SetUp]
        public void Setup()
        {
            EvolutionSystem.ClearAll();
            // Register a few evolution pairs for testing
            EvolutionSystem.RegisterEvolution("flame_warrior", "fire_berserker");
            EvolutionSystem.RegisterEvolution("ember_scout", "flame_rogue");
            EvolutionSystem.RegisterEvolution("tide_hunter", "tsunami_blade");
            EvolutionSystem.RegisterEvolution("stone_guard", "iron_sentinel");
        }

        [TearDown]
        public void TearDown()
        {
            EvolutionSystem.ClearAll();
        }

        // --- CanEvolve ---

        [Test]
        public void FlameWarrior_CanEvolve_ReturnsTrue()
        {
            Assert.IsTrue(EvolutionSystem.CanEvolve("flame_warrior"));
        }

        [Test]
        public void FireBerserker_CanEvolve_ReturnsFalse()
        {
            // Evolved units can't evolve further
            Assert.IsFalse(EvolutionSystem.CanEvolve("fire_berserker"));
        }

        [Test]
        public void UnknownUnit_CanEvolve_ReturnsFalse()
        {
            Assert.IsFalse(EvolutionSystem.CanEvolve("nonexistent_unit"));
        }

        // --- GetEvolvedForm ---

        [Test]
        public void FlameWarrior_EvolvesInto_FireBerserker()
        {
            Assert.AreEqual("fire_berserker", EvolutionSystem.GetEvolvedForm("flame_warrior"));
        }

        [Test]
        public void FireBerserker_EvolvesInto_Null()
        {
            Assert.IsNull(EvolutionSystem.GetEvolvedForm("fire_berserker"));
        }

        // --- GetBaseForm ---

        [Test]
        public void FireBerserker_BaseForm_IsFlameWarrior()
        {
            Assert.AreEqual("flame_warrior", EvolutionSystem.GetBaseForm("fire_berserker"));
        }

        // --- IsEvolvedUnit ---

        [Test]
        public void FireBerserker_IsEvolved_True()
        {
            Assert.IsTrue(EvolutionSystem.IsEvolvedUnit("fire_berserker"));
        }

        [Test]
        public void FlameWarrior_IsEvolved_False()
        {
            Assert.IsFalse(EvolutionSystem.IsEvolvedUnit("flame_warrior"));
        }

        // --- Star-up costs ---

        [Test]
        public void StarUpCost_T1_Returns3()
        {
            Assert.AreEqual(3, EvolutionSystem.GetStarUpCost(1));
        }

        [Test]
        public void StarUpCost_T2_Returns4()
        {
            Assert.AreEqual(4, EvolutionSystem.GetStarUpCost(2));
        }

        [Test]
        public void StarUpCost_T3_Returns5()
        {
            Assert.AreEqual(5, EvolutionSystem.GetStarUpCost(3));
        }

        [Test]
        public void StarUpCost_T4_Returns8()
        {
            Assert.AreEqual(8, EvolutionSystem.GetStarUpCost(4));
        }

        [Test]
        public void StarUpCost_T5_Returns10()
        {
            Assert.AreEqual(10, EvolutionSystem.GetStarUpCost(5));
        }

        // --- CanStarUp ---

        [Test]
        public void CanStarUp_T1_3Copies_ReturnsTrue()
        {
            Assert.IsTrue(EvolutionSystem.CanStarUp(1, 1, 3));
        }

        [Test]
        public void CanStarUp_T1_2Copies_ReturnsFalse()
        {
            Assert.IsFalse(EvolutionSystem.CanStarUp(1, 1, 2));
        }

        [Test]
        public void CanStarUp_T4_8Copies_ReturnsTrue()
        {
            Assert.IsTrue(EvolutionSystem.CanStarUp(4, 1, 8));
        }

        [Test]
        public void CanStarUp_T4_7Copies_ReturnsFalse()
        {
            Assert.IsFalse(EvolutionSystem.CanStarUp(4, 1, 7));
        }

        // --- Evolution star requirement ---

        [Test]
        public void MeetsEvolutionReq_Star3_ReturnsTrue()
        {
            Assert.IsTrue(EvolutionSystem.MeetsEvolutionStarRequirement(3));
        }

        [Test]
        public void MeetsEvolutionReq_Star2_ReturnsFalse()
        {
            Assert.IsFalse(EvolutionSystem.MeetsEvolutionStarRequirement(2));
        }

        [Test]
        public void MeetsEvolutionReq_Star5_ReturnsTrue()
        {
            Assert.IsTrue(EvolutionSystem.MeetsEvolutionStarRequirement(5));
        }
    }
}

using NUnit.Framework;
using ShatteredVeil.Core.Units;

namespace ShatteredVeil.Tests.EditMode.Units
{
    [TestFixture]
    public class EvolutionSystemTests
    {
        // --- Copies Needed ---

        [Test]
        public void CopiesNeeded_T1_Is3()
        {
            Assert.AreEqual(3, EvolutionSystem.GetCopiesNeeded(1));
        }

        [Test]
        public void CopiesNeeded_T2_Is4()
        {
            Assert.AreEqual(4, EvolutionSystem.GetCopiesNeeded(2));
        }

        [Test]
        public void CopiesNeeded_T3_Is5()
        {
            Assert.AreEqual(5, EvolutionSystem.GetCopiesNeeded(3));
        }

        [Test]
        public void CopiesNeeded_T4_Is8()
        {
            Assert.AreEqual(8, EvolutionSystem.GetCopiesNeeded(4));
        }

        [Test]
        public void CopiesNeeded_T5_Is10()
        {
            Assert.AreEqual(10, EvolutionSystem.GetCopiesNeeded(5));
        }

        // --- Star-Up ---

        [Test]
        public void CanStarUp_Enough_Copies_Returns_True()
        {
            // T1 needs 3 copies, total=4 (1 base + 3 spares)
            Assert.IsTrue(EvolutionSystem.CanStarUp(1, 1, 4));
        }

        [Test]
        public void CanStarUp_NotEnough_Copies_Returns_False()
        {
            // T1 needs 3 copies, total=3 (only 2 spares)
            Assert.IsFalse(EvolutionSystem.CanStarUp(1, 1, 3));
        }

        [Test]
        public void CanStarUp_AtMaxStars_Returns_False()
        {
            Assert.IsFalse(EvolutionSystem.CanStarUp(1, 5, 100));
        }

        [Test]
        public void TryStarUp_Success_ConsumesCopies()
        {
            int stars = 1;
            int copies = 5; // T1 needs 3
            bool result = EvolutionSystem.TryStarUp(1, ref stars, ref copies);
            Assert.IsTrue(result);
            Assert.AreEqual(2, stars);
            Assert.AreEqual(2, copies); // 5 - 3 = 2
        }

        [Test]
        public void TryStarUp_Fails_NoCopiesConsumed()
        {
            int stars = 1;
            int copies = 2; // not enough
            bool result = EvolutionSystem.TryStarUp(1, ref stars, ref copies);
            Assert.IsFalse(result);
            Assert.AreEqual(1, stars);
            Assert.AreEqual(2, copies);
        }

        [Test]
        public void TryStarUp_MultipleTimesT1()
        {
            int stars = 1;
            int copies = 10; // T1 needs 3 per star-up
            // Star 1->2: costs 3, copies=7
            Assert.IsTrue(EvolutionSystem.TryStarUp(1, ref stars, ref copies));
            Assert.AreEqual(2, stars);
            Assert.AreEqual(7, copies);
            // Star 2->3: costs 3, copies=4
            Assert.IsTrue(EvolutionSystem.TryStarUp(1, ref stars, ref copies));
            Assert.AreEqual(3, stars);
            Assert.AreEqual(4, copies);
            // Star 3->4: costs 3, copies=1
            Assert.IsTrue(EvolutionSystem.TryStarUp(1, ref stars, ref copies));
            Assert.AreEqual(4, stars);
            Assert.AreEqual(1, copies);
            // Star 4->5: needs 3, only 0 spare - fail
            Assert.IsFalse(EvolutionSystem.TryStarUp(1, ref stars, ref copies));
        }

        [Test]
        public void TryStarUp_T5_RequiresManyCopies()
        {
            int stars = 1;
            int copies = 11; // T5 needs 10 per star-up, plus 1 base
            Assert.IsTrue(EvolutionSystem.TryStarUp(5, ref stars, ref copies));
            Assert.AreEqual(2, stars);
            Assert.AreEqual(1, copies);
        }

        // --- Spare Copies ---

        [Test]
        public void SpareCopies_CorrectCalculation()
        {
            Assert.AreEqual(0, EvolutionSystem.GetSpareCopies(1)); // base only
            Assert.AreEqual(4, EvolutionSystem.GetSpareCopies(5)); // 5 - 1
            Assert.AreEqual(0, EvolutionSystem.GetSpareCopies(0)); // edge case
        }

        // --- Sell Values ---

        [Test]
        public void SellValue_T1_Is5VE()
        {
            Assert.AreEqual(5, EvolutionSystem.GetSellValue(1));
        }

        [Test]
        public void SellValue_T5_Is80VE()
        {
            Assert.AreEqual(80, EvolutionSystem.GetSellValue(5));
        }

        [Test]
        public void SellTotal_MultipleUnits()
        {
            Assert.AreEqual(15, EvolutionSystem.GetSellTotal(1, 3)); // 5 * 3
            Assert.AreEqual(160, EvolutionSystem.GetSellTotal(5, 2)); // 80 * 2
        }

        [Test]
        public void SellCopies_Success_ReturnsVE()
        {
            int copies = 5;
            int earned = EvolutionSystem.SellCopies(1, 2, ref copies);
            Assert.AreEqual(10, earned); // 5 VE * 2
            Assert.AreEqual(3, copies);
        }

        [Test]
        public void SellCopies_CantSellLastUnit()
        {
            int copies = 1; // only base unit, 0 spare
            int earned = EvolutionSystem.SellCopies(1, 1, ref copies);
            Assert.AreEqual(-1, earned);
            Assert.AreEqual(1, copies);
        }

        [Test]
        public void SellCopies_CantSellMoreThanSpare()
        {
            int copies = 3; // 2 spare
            int earned = EvolutionSystem.SellCopies(1, 3, ref copies);
            Assert.AreEqual(-1, earned);
            Assert.AreEqual(3, copies);
        }

        [Test]
        public void SellCopies_ZeroCount_Fails()
        {
            int copies = 5;
            int earned = EvolutionSystem.SellCopies(1, 0, ref copies);
            Assert.AreEqual(-1, earned);
        }

        // --- Evolution ---

        [Test]
        public void EvolutionCost_T3_Is500()
        {
            Assert.AreEqual(500, EvolutionSystem.GetEvolutionCost(3));
        }

        [Test]
        public void EvolutionCost_T4_Is1000()
        {
            Assert.AreEqual(1000, EvolutionSystem.GetEvolutionCost(4));
        }

        [Test]
        public void EvolutionCost_T5_Is2000()
        {
            Assert.AreEqual(2000, EvolutionSystem.GetEvolutionCost(5));
        }

        [Test]
        public void EvolutionCost_T1_ReturnsNegative()
        {
            Assert.AreEqual(-1, EvolutionSystem.GetEvolutionCost(1));
        }

        [Test]
        public void EvolutionCost_WithMultiplier()
        {
            Assert.AreEqual(400, EvolutionSystem.GetEvolutionCost(3, 0.8)); // 500 * 0.8
        }

        [Test]
        public void CanEvolve_AllConditionsMet()
        {
            Assert.IsTrue(EvolutionSystem.CanEvolve(3, 5, 5, true, true));
        }

        [Test]
        public void CanEvolve_NotMaxStars_False()
        {
            Assert.IsFalse(EvolutionSystem.CanEvolve(3, 4, 5, true, true));
        }

        [Test]
        public void CanEvolve_T1T2_False()
        {
            Assert.IsFalse(EvolutionSystem.CanEvolve(1, 5, 5, true, true));
            Assert.IsFalse(EvolutionSystem.CanEvolve(2, 5, 5, true, true));
        }

        [Test]
        public void CanEvolve_NoEvolution_False()
        {
            Assert.IsFalse(EvolutionSystem.CanEvolve(3, 5, 5, false, true));
        }

        [Test]
        public void CanEvolve_BuildingLocked_False()
        {
            Assert.IsFalse(EvolutionSystem.CanEvolve(3, 5, 5, true, false));
        }
    }
}

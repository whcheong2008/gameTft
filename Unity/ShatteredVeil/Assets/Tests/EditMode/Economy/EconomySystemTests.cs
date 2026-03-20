using NUnit.Framework;
using ShatteredVeil.Core.Economy;

namespace ShatteredVeil.Tests.EditMode.Economy
{
    [TestFixture]
    public class EconomySystemTests
    {
        private EconomySystem CreateSystem(int ve = 500, int level = 1, int xp = 0)
        {
            return new EconomySystem(ve, level, xp);
        }

        // --- Init ---

        [Test]
        public void StartingVE_Is500()
        {
            Assert.AreEqual(500, EconomySystem.StartingVE);
        }

        [Test]
        public void Init_CorrectValues()
        {
            var sys = CreateSystem(1000, 5, 100);
            Assert.AreEqual(1000, sys.VeilEssence);
            Assert.AreEqual(5, sys.PlayerLevel);
            Assert.AreEqual(100, sys.CurrentXP);
        }

        // --- Spending ---

        [Test]
        public void CanSpend_WithEnoughVE_ReturnsTrue()
        {
            var sys = CreateSystem(500);
            Assert.IsTrue(sys.CanSpend(100));
        }

        [Test]
        public void CanSpend_WithNotEnoughVE_ReturnsFalse()
        {
            var sys = CreateSystem(50);
            Assert.IsFalse(sys.CanSpend(100));
        }

        [Test]
        public void CanSpend_ZeroAmount_ReturnsFalse()
        {
            var sys = CreateSystem(500);
            Assert.IsFalse(sys.CanSpend(0));
        }

        [Test]
        public void TrySpend_Success_DeductsVE()
        {
            var sys = CreateSystem(500);
            Assert.IsTrue(sys.TrySpend(200));
            Assert.AreEqual(300, sys.VeilEssence);
        }

        [Test]
        public void TrySpend_Failure_NoDeduction()
        {
            var sys = CreateSystem(100);
            Assert.IsFalse(sys.TrySpend(200));
            Assert.AreEqual(100, sys.VeilEssence);
        }

        [Test]
        public void GrantVE_IncreasesBalance()
        {
            var sys = CreateSystem(100);
            sys.GrantVE(250);
            Assert.AreEqual(350, sys.VeilEssence);
        }

        [Test]
        public void GrantVE_Zero_NoChange()
        {
            var sys = CreateSystem(100);
            sys.GrantVE(0);
            Assert.AreEqual(100, sys.VeilEssence);
        }

        // --- XP and Leveling ---

        [Test]
        public void XPToNext_Level1_Is360()
        {
            var sys = CreateSystem(level: 1);
            Assert.AreEqual(360, sys.GetXPToNextLevel());
        }

        [Test]
        public void XPToNext_Level20_Is0()
        {
            var sys = CreateSystem(level: 20);
            Assert.AreEqual(0, sys.GetXPToNextLevel());
        }

        [Test]
        public void AddXP_DoesNotLevelUp_BelowThreshold()
        {
            var sys = CreateSystem(level: 1);
            sys.AddXP(100);
            Assert.AreEqual(1, sys.PlayerLevel);
            Assert.AreEqual(100, sys.CurrentXP);
        }

        [Test]
        public void AddXP_LevelsUp_AtThreshold()
        {
            var sys = CreateSystem(level: 1, xp: 0);
            sys.AddXP(360); // exactly L2 threshold
            Assert.AreEqual(2, sys.PlayerLevel);
            Assert.AreEqual(0, sys.CurrentXP);
        }

        [Test]
        public void AddXP_LevelsUp_MultipleLevel()
        {
            var sys = CreateSystem(level: 1, xp: 0);
            sys.AddXP(800); // 360 for L2 + 360 for L3 = 720 needed, leaves 80
            Assert.AreEqual(3, sys.PlayerLevel);
            Assert.AreEqual(80, sys.CurrentXP);
        }

        [Test]
        public void AddXP_CapsAtLevel20()
        {
            var sys = CreateSystem(level: 20, xp: 0);
            sys.AddXP(99999);
            Assert.AreEqual(20, sys.PlayerLevel);
        }

        [Test]
        public void AddXP_Negative_Ignored()
        {
            var sys = CreateSystem(level: 1, xp: 50);
            sys.AddXP(-100);
            Assert.AreEqual(50, sys.CurrentXP);
        }

        // --- Team Size ---

        [Test]
        public void TeamSize_Level1_Is3()
        {
            var sys = CreateSystem(level: 1);
            Assert.AreEqual(3, sys.GetTeamSize());
        }

        [Test]
        public void TeamSize_Level4_Is4()
        {
            var sys = CreateSystem(level: 4);
            Assert.AreEqual(4, sys.GetTeamSize());
        }

        [Test]
        public void TeamSize_Level8_Is5()
        {
            var sys = CreateSystem(level: 8);
            Assert.AreEqual(5, sys.GetTeamSize());
        }

        [Test]
        public void TeamSize_Level12_Is6()
        {
            var sys = CreateSystem(level: 12);
            Assert.AreEqual(6, sys.GetTeamSize());
        }

        [Test]
        public void TeamSize_Level16_Is7()
        {
            var sys = CreateSystem(level: 16);
            Assert.AreEqual(7, sys.GetTeamSize());
        }

        // --- Events ---

        [Test]
        public void Events_VEChanged_FiresOnSpend()
        {
            var sys = CreateSystem(500);
            int firedVE = -1;
            sys.OnVeilEssenceChanged += ve => firedVE = ve;
            sys.TrySpend(100);
            Assert.AreEqual(400, firedVE);
        }

        [Test]
        public void Events_VEChanged_FiresOnGrant()
        {
            var sys = CreateSystem(100);
            int firedVE = -1;
            sys.OnVeilEssenceChanged += ve => firedVE = ve;
            sys.GrantVE(200);
            Assert.AreEqual(300, firedVE);
        }

        [Test]
        public void Events_LevelUp_Fires()
        {
            var sys = CreateSystem(level: 1);
            int firedLevel = -1;
            sys.OnLevelUp += lvl => firedLevel = lvl;
            sys.AddXP(360);
            Assert.AreEqual(2, firedLevel);
        }

        [Test]
        public void Events_XPChanged_Fires()
        {
            var sys = CreateSystem(level: 1);
            int firedXP = -1;
            sys.OnXPChanged += (xp, toNext) => firedXP = xp;
            sys.AddXP(100);
            Assert.AreEqual(100, firedXP);
        }
    }
}

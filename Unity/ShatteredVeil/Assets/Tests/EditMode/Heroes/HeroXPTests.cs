using NUnit.Framework;
using ShatteredVeil.Core.Heroes;

namespace ShatteredVeil.Tests.EditMode.Heroes
{
    [TestFixture]
    public class HeroXPTests
    {
        private HeroState _hero;

        [SetUp]
        public void SetUp()
        {
            _hero = new HeroState(HeroId.Kael);
        }

        [Test]
        public void NewHero_StartsAtLevel1()
        {
            Assert.AreEqual(1, _hero.Level);
            Assert.AreEqual(1, _hero.SkillPoints);
        }

        [Test]
        public void AddXP_LevelsUp()
        {
            var result = HeroXPSystem.AddXP(_hero, 100);
            Assert.AreEqual(1, result.LevelsGained);
            Assert.AreEqual(2, result.NewLevel);
            Assert.AreEqual(1, result.SkillPointsAwarded);
        }

        [Test]
        public void AddXP_MultipleLevel()
        {
            // L1->L2 = 100, L2->L3 = 175, total = 275
            var result = HeroXPSystem.AddXP(_hero, 275);
            Assert.AreEqual(2, result.LevelsGained);
            Assert.AreEqual(3, result.NewLevel);
            Assert.AreEqual(2, result.SkillPointsAwarded);
        }

        [Test]
        public void AddXP_ExcessCarriesOver()
        {
            var result = HeroXPSystem.AddXP(_hero, 110);
            Assert.AreEqual(2, _hero.Level);
            Assert.AreEqual(10, _hero.XP); // 110 - 100 = 10 leftover
        }

        [Test]
        public void LevelCap_At20()
        {
            _hero.Level = 19;
            _hero.XP = 0;
            var xpNeeded = HeroXPSystem.GetXPToNextLevel(19);
            HeroXPSystem.AddXP(_hero, xpNeeded);
            Assert.AreEqual(20, _hero.Level);
            Assert.AreEqual(0, _hero.XP);

            // Further XP does nothing
            var result = HeroXPSystem.AddXP(_hero, 999999);
            Assert.AreEqual(0, result.LevelsGained);
            Assert.AreEqual(20, _hero.Level);
        }

        [Test]
        public void SkillPoint_AwardedEachLevel()
        {
            _hero.Level = 1;
            _hero.SkillPoints = 1;
            HeroXPSystem.AddXP(_hero, 100); // -> L2
            Assert.AreEqual(2, _hero.SkillPoints);
        }

        [Test]
        public void DeadHero_CannotGainXP()
        {
            _hero.IsDead = true;
            var result = HeroXPSystem.AddXP(_hero, 100);
            Assert.AreEqual(0, result.LevelsGained);
            Assert.AreEqual(1, _hero.Level);
        }

        [Test]
        public void GetXPForLevel_ReturnsCorrectValues()
        {
            Assert.AreEqual(0, HeroXPSystem.GetXPForLevel(1));
            Assert.AreEqual(100, HeroXPSystem.GetXPForLevel(2));
            Assert.AreEqual(876135, HeroXPSystem.GetXPForLevel(20));
        }

        [Test]
        public void GetXPToNextLevel_AtCap_ReturnsMax()
        {
            Assert.AreEqual(int.MaxValue, HeroXPSystem.GetXPToNextLevel(20));
        }

        [Test]
        public void MassiveXP_LevelsToCapCorrectly()
        {
            var result = HeroXPSystem.AddXP(_hero, 99999999);
            Assert.AreEqual(20, _hero.Level);
            Assert.AreEqual(0, _hero.XP);
            Assert.AreEqual(19, result.LevelsGained);
            Assert.AreEqual(20, _hero.SkillPoints); // 1 initial + 19 gained
        }
    }
}

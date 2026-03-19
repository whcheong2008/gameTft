using System.Collections.Generic;
using NUnit.Framework;
using ShatteredVeil.Core.Heroes;

namespace ShatteredVeil.Tests.EditMode.Heroes
{
    [TestFixture]
    public class HeroAvailabilityTests
    {
        [Test]
        public void R1_Start_OnlyKaelAndLyric()
        {
            var heroes = HeroAvailabilitySystem.GetAvailableHeroes(1, 1);
            Assert.AreEqual(2, heroes.Count);
            Assert.Contains(HeroId.Kael, heroes);
            Assert.Contains(HeroId.Lyric, heroes);
        }

        [Test]
        public void R2_PlusRen()
        {
            var heroes = HeroAvailabilitySystem.GetAvailableHeroes(2, 1);
            Assert.AreEqual(3, heroes.Count);
            Assert.Contains(HeroId.Kael, heroes);
            Assert.Contains(HeroId.Lyric, heroes);
            Assert.Contains(HeroId.Ren, heroes);
        }

        [Test]
        public void R3_PlusSeraAndMaren()
        {
            var heroes = HeroAvailabilitySystem.GetAvailableHeroes(3, 1);
            Assert.AreEqual(5, heroes.Count);
            Assert.Contains(HeroId.Sera, heroes);
            Assert.Contains(HeroId.Maren, heroes);
        }

        [Test]
        public void R4Early_AllFive()
        {
            var heroes = HeroAvailabilitySystem.GetAvailableHeroes(4, 1);
            Assert.AreEqual(5, heroes.Count);
        }

        [Test]
        public void R4Mid_LyricDies_SeraMarenLeave_OnlyKaelRen()
        {
            // After Lyric death stage (4, 3)
            var heroes = HeroAvailabilitySystem.GetAvailableHeroes(4, 3);
            Assert.AreEqual(2, heroes.Count);
            Assert.Contains(HeroId.Kael, heroes);
            Assert.Contains(HeroId.Ren, heroes);
            Assert.IsFalse(heroes.Contains(HeroId.Lyric));
            Assert.IsFalse(heroes.Contains(HeroId.Sera));
            Assert.IsFalse(heroes.Contains(HeroId.Maren));
        }

        [Test]
        public void R5Early_MarenReturns()
        {
            var heroes = HeroAvailabilitySystem.GetAvailableHeroes(5, 2);
            Assert.AreEqual(3, heroes.Count);
            Assert.Contains(HeroId.Kael, heroes);
            Assert.Contains(HeroId.Ren, heroes);
            Assert.Contains(HeroId.Maren, heroes);
        }

        [Test]
        public void R5Late_SeraReturns()
        {
            var heroes = HeroAvailabilitySystem.GetAvailableHeroes(5, 8);
            Assert.AreEqual(4, heroes.Count);
            Assert.Contains(HeroId.Kael, heroes);
            Assert.Contains(HeroId.Ren, heroes);
            Assert.Contains(HeroId.Maren, heroes);
            Assert.Contains(HeroId.Sera, heroes);
        }

        [Test]
        public void R7_PlusVoss()
        {
            var heroes = HeroAvailabilitySystem.GetAvailableHeroes(7, 1);
            Assert.AreEqual(5, heroes.Count);
            Assert.Contains(HeroId.Kael, heroes);
            Assert.Contains(HeroId.Ren, heroes);
            Assert.Contains(HeroId.Sera, heroes);
            Assert.Contains(HeroId.Maren, heroes);
            Assert.Contains(HeroId.Voss, heroes);
        }

        [Test]
        public void OnLyricDeath_SetsDeadAndUnassigns()
        {
            var lyric = new HeroState(HeroId.Lyric);
            lyric.AssignedUnitId = "unit_001";

            HeroAvailabilitySystem.OnLyricDeath(lyric);
            Assert.IsTrue(lyric.IsDead);
            Assert.IsNull(lyric.AssignedUnitId);
        }

        [Test]
        public void OnLyricDeath_PreservesSkillInvestment()
        {
            var lyric = new HeroState(HeroId.Lyric);
            lyric.InvestedNodes.Add(0);
            lyric.InvestedNodes.Add(2);

            HeroAvailabilitySystem.OnLyricDeath(lyric);
            Assert.AreEqual(2, lyric.InvestedNodes.Count);
        }

        [Test]
        public void OnHeroLeave_SetsAbsentAndUnassigns()
        {
            var sera = new HeroState(HeroId.Sera);
            sera.AssignedUnitId = "unit_002";

            HeroAvailabilitySystem.OnHeroLeave(sera);
            Assert.IsTrue(sera.IsAbsent);
            Assert.IsNull(sera.AssignedUnitId);
        }

        [Test]
        public void OnHeroReturn_ClearsAbsent()
        {
            var maren = new HeroState(HeroId.Maren) { IsAbsent = true };
            HeroAvailabilitySystem.OnHeroReturn(maren);
            Assert.IsFalse(maren.IsAbsent);
        }

        [Test]
        public void OnLyricDeath_IgnoresNonLyric()
        {
            var kael = new HeroState(HeroId.Kael);
            HeroAvailabilitySystem.OnLyricDeath(kael);
            Assert.IsFalse(kael.IsDead);
        }

        [Test]
        public void R6_FourHeroes()
        {
            var heroes = HeroAvailabilitySystem.GetAvailableHeroes(6, 1);
            Assert.AreEqual(4, heroes.Count);
            Assert.IsFalse(heroes.Contains(HeroId.Lyric));
            Assert.IsFalse(heroes.Contains(HeroId.Voss));
        }

        [Test]
        public void R8_FiveHeroes()
        {
            var heroes = HeroAvailabilitySystem.GetAvailableHeroes(8, 1);
            Assert.AreEqual(5, heroes.Count);
            Assert.IsFalse(heroes.Contains(HeroId.Lyric));
        }
    }
}

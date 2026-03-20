using System.Collections.Generic;
using NUnit.Framework;
using ShatteredVeil.Core.Heroes;

namespace ShatteredVeil.Tests.EditMode.Heroes
{
    [TestFixture]
    public class HeroAssignmentTests
    {
        private List<HeroState> _heroes;
        private HeroState _kael;
        private HeroState _lyric;

        [SetUp]
        public void SetUp()
        {
            _kael = new HeroState(HeroId.Kael);
            _lyric = new HeroState(HeroId.Lyric);
            _heroes = new List<HeroState> { _kael, _lyric };
        }

        [Test]
        public void AssignHero_SetsLink()
        {
            bool result = HeroAssignmentSystem.AssignHero(_kael, "unit_001", _heroes);
            Assert.IsTrue(result);
            Assert.AreEqual("unit_001", _kael.AssignedUnitId);
        }

        [Test]
        public void CannotAssign_DeadHero()
        {
            _lyric.IsDead = true;
            bool result = HeroAssignmentSystem.AssignHero(_lyric, "unit_001", _heroes);
            Assert.IsFalse(result);
            Assert.IsNull(_lyric.AssignedUnitId);
        }

        [Test]
        public void CannotAssign_AbsentHero()
        {
            var sera = new HeroState(HeroId.Sera) { IsAbsent = true };
            _heroes.Add(sera);
            bool result = HeroAssignmentSystem.AssignHero(sera, "unit_001", _heroes);
            Assert.IsFalse(result);
        }

        [Test]
        public void OneHeroPerUnit()
        {
            HeroAssignmentSystem.AssignHero(_kael, "unit_001", _heroes);
            HeroAssignmentSystem.AssignHero(_lyric, "unit_001", _heroes);
            // Kael should be unassigned
            Assert.IsNull(_kael.AssignedUnitId);
            Assert.AreEqual("unit_001", _lyric.AssignedUnitId);
        }

        [Test]
        public void OneUnitPerHero()
        {
            HeroAssignmentSystem.AssignHero(_kael, "unit_001", _heroes);
            HeroAssignmentSystem.AssignHero(_kael, "unit_002", _heroes);
            Assert.AreEqual("unit_002", _kael.AssignedUnitId);
        }

        [Test]
        public void Unassign_ClearsLink()
        {
            HeroAssignmentSystem.AssignHero(_kael, "unit_001", _heroes);
            HeroAssignmentSystem.UnassignHero(_kael);
            Assert.IsNull(_kael.AssignedUnitId);
        }

        [Test]
        public void GetHeroForUnit_FindsAssigned()
        {
            HeroAssignmentSystem.AssignHero(_kael, "unit_001", _heroes);
            var found = HeroAssignmentSystem.GetHeroForUnit("unit_001", _heroes);
            Assert.IsNotNull(found);
            Assert.AreEqual(HeroId.Kael, found.Id);
        }

        [Test]
        public void GetHeroForUnit_ReturnsNull_WhenNoAssignment()
        {
            var found = HeroAssignmentSystem.GetHeroForUnit("unit_001", _heroes);
            Assert.IsNull(found);
        }

        [Test]
        public void IsUnitHeroEquipped_ReturnsTrueWhenAssigned()
        {
            HeroAssignmentSystem.AssignHero(_kael, "unit_001", _heroes);
            Assert.IsTrue(HeroAssignmentSystem.IsUnitHeroEquipped("unit_001", _heroes));
            Assert.IsFalse(HeroAssignmentSystem.IsUnitHeroEquipped("unit_002", _heroes));
        }

        [Test]
        public void GetHeroBonuses_ReturnsEmpty_WhenDead()
        {
            _lyric.IsDead = true;
            var def = HeroCatalog.Get(HeroId.Lyric);
            var bonuses = HeroAssignmentSystem.GetHeroBonuses(_lyric, def);
            Assert.AreEqual(0, bonuses.Count);
        }

        [Test]
        public void GetHeroBonuses_ReturnsEmpty_WhenAbsent()
        {
            var sera = new HeroState(HeroId.Sera) { IsAbsent = true };
            var def = HeroCatalog.Get(HeroId.Sera);
            var bonuses = HeroAssignmentSystem.GetHeroBonuses(sera, def);
            Assert.AreEqual(0, bonuses.Count);
        }

        [Test]
        public void GetHeroBonuses_ReturnsEmpty_WhenNotAssigned()
        {
            var def = HeroCatalog.Get(HeroId.Kael);
            var bonuses = HeroAssignmentSystem.GetHeroBonuses(_kael, def);
            Assert.AreEqual(0, bonuses.Count);
        }

        [Test]
        public void DeadHero_ExcludedFromGetHeroForUnit()
        {
            HeroAssignmentSystem.AssignHero(_lyric, "unit_001", _heroes);
            _lyric.IsDead = true;
            var found = HeroAssignmentSystem.GetHeroForUnit("unit_001", _heroes);
            Assert.IsNull(found);
        }
    }
}

using System.Collections.Generic;
using NUnit.Framework;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Tests.EditMode.Combat
{
    [TestFixture]
    public class TurnOrderSystemTests
    {
        [Test]
        public void FasterUnit_GoesFirst()
        {
            var slow = CombatUnit.Create("u1", "Slow", Element.Fire, 500, 100, 0, 5, Team.Player);
            var fast = CombatUnit.Create("u2", "Fast", Element.Fire, 500, 100, 0, 20, Team.Player);

            var queue = TurnOrderSystem.BuildTurnOrder(new List<CombatUnit> { slow, fast });

            Assert.AreEqual("u2", queue.Dequeue().UnitId);
            Assert.AreEqual("u1", queue.Dequeue().UnitId);
        }

        [Test]
        public void TieBreak_PlayerFirst()
        {
            var enemy = CombatUnit.Create("e1", "Enemy", Element.Fire, 500, 100, 0, 10, Team.Enemy);
            var player = CombatUnit.Create("p1", "Player", Element.Fire, 500, 100, 0, 10, Team.Player);

            var queue = TurnOrderSystem.BuildTurnOrder(new List<CombatUnit> { enemy, player });

            Assert.AreEqual(Team.Player, queue.Dequeue().Team);
            Assert.AreEqual(Team.Enemy, queue.Dequeue().Team);
        }

        [Test]
        public void TieBreak_SameTeam_ByUnitId()
        {
            var u2 = CombatUnit.Create("u2", "Unit2", Element.Fire, 500, 100, 0, 10, Team.Player);
            var u1 = CombatUnit.Create("u1", "Unit1", Element.Fire, 500, 100, 0, 10, Team.Player);

            var queue = TurnOrderSystem.BuildTurnOrder(new List<CombatUnit> { u2, u1 });

            Assert.AreEqual("u1", queue.Dequeue().UnitId);
            Assert.AreEqual("u2", queue.Dequeue().UnitId);
        }

        [Test]
        public void DeadUnits_Excluded()
        {
            var alive = CombatUnit.Create("u1", "Alive", Element.Fire, 500, 100, 0, 10, Team.Player);
            var dead = CombatUnit.Create("u2", "Dead", Element.Fire, 0, 100, 0, 20, Team.Player);
            dead.IsAlive = false;

            var queue = TurnOrderSystem.BuildTurnOrder(new List<CombatUnit> { dead, alive });

            Assert.AreEqual(1, queue.Count);
            Assert.AreEqual("u1", queue.Dequeue().UnitId);
        }

        [Test]
        public void StunnedUnit_ShouldSkip()
        {
            var unit = CombatUnit.Create("u1", "Stunned", Element.Fire, 500, 100, 0, 10, Team.Player);
            unit.IsStunned = true;

            Assert.IsTrue(TurnOrderSystem.ShouldSkipTurn(unit));
        }

        [Test]
        public void FrozenUnit_ShouldSkip()
        {
            var unit = CombatUnit.Create("u1", "Frozen", Element.Fire, 500, 100, 0, 10, Team.Player);
            unit.IsFrozen = true;

            Assert.IsTrue(TurnOrderSystem.ShouldSkipTurn(unit));
        }

        [Test]
        public void HealthyUnit_ShouldNotSkip()
        {
            var unit = CombatUnit.Create("u1", "Healthy", Element.Fire, 500, 100, 0, 10, Team.Player);

            Assert.IsFalse(TurnOrderSystem.ShouldSkipTurn(unit));
        }

        [Test]
        public void MultipleUnits_CorrectOrder()
        {
            var units = new List<CombatUnit>
            {
                CombatUnit.Create("u3", "U3", Element.Fire, 500, 100, 0, 5, Team.Player),
                CombatUnit.Create("u1", "U1", Element.Fire, 500, 100, 0, 20, Team.Enemy),
                CombatUnit.Create("u2", "U2", Element.Fire, 500, 100, 0, 15, Team.Player),
                CombatUnit.Create("u4", "U4", Element.Fire, 500, 100, 0, 20, Team.Player),
            };

            var queue = TurnOrderSystem.BuildTurnOrder(units);

            // SPD 20: u4 (player) before u1 (enemy), then u2 (15), then u3 (5)
            Assert.AreEqual("u4", queue.Dequeue().UnitId);
            Assert.AreEqual("u1", queue.Dequeue().UnitId);
            Assert.AreEqual("u2", queue.Dequeue().UnitId);
            Assert.AreEqual("u3", queue.Dequeue().UnitId);
        }
    }
}

using System;
using System.Collections.Generic;
using NUnit.Framework;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Tests.EditMode.Combat
{
    [TestFixture]
    public class TargetingSystemTests
    {
        [Test]
        public void Nearest_SelectsClosestUnit()
        {
            var attacker = CombatUnit.Create("a1", "Attacker", Element.Fire, 500, 100, 0, 10, Team.Player);
            attacker.Position = new GridPosition(0, 0);

            var far = CombatUnit.Create("e1", "Far", Element.Water, 500, 50, 0, 5, Team.Enemy);
            far.Position = new GridPosition(3, 3); // distance 6

            var close = CombatUnit.Create("e2", "Close", Element.Water, 500, 50, 0, 5, Team.Enemy);
            close.Position = new GridPosition(1, 0); // distance 1

            var enemies = new List<CombatUnit> { far, close };
            var target = TargetingSystem.GetTarget(attacker, enemies, TargetingRule.Nearest);

            Assert.AreEqual("e2", target.UnitId);
        }

        [Test]
        public void LowestHP_SelectsLowestHPUnit()
        {
            var attacker = CombatUnit.Create("a1", "Attacker", Element.Fire, 500, 100, 0, 10, Team.Player);

            var high = CombatUnit.Create("e1", "HighHP", Element.Water, 500, 50, 0, 5, Team.Enemy);
            var low = CombatUnit.Create("e2", "LowHP", Element.Water, 100, 50, 0, 5, Team.Enemy);

            var enemies = new List<CombatUnit> { high, low };
            var target = TargetingSystem.GetTarget(attacker, enemies, TargetingRule.LowestHP);

            Assert.AreEqual("e2", target.UnitId);
        }

        [Test]
        public void HighestATK_SelectsStrongestUnit()
        {
            var attacker = CombatUnit.Create("a1", "Attacker", Element.Fire, 500, 100, 0, 10, Team.Player);

            var weak = CombatUnit.Create("e1", "Weak", Element.Water, 500, 30, 0, 5, Team.Enemy);
            var strong = CombatUnit.Create("e2", "Strong", Element.Water, 500, 150, 0, 5, Team.Enemy);

            var enemies = new List<CombatUnit> { weak, strong };
            var target = TargetingSystem.GetTarget(attacker, enemies, TargetingRule.HighestATK);

            Assert.AreEqual("e2", target.UnitId);
        }

        [Test]
        public void TauntOverride_ForcesTarget()
        {
            var attacker = CombatUnit.Create("a1", "Attacker", Element.Fire, 500, 100, 0, 10, Team.Player);
            attacker.Position = new GridPosition(0, 0);

            var close = CombatUnit.Create("e1", "Close", Element.Water, 500, 50, 0, 5, Team.Enemy);
            close.Position = new GridPosition(0, 1); // closer

            var taunter = CombatUnit.Create("e2", "Taunter", Element.Water, 500, 50, 0, 5, Team.Enemy);
            taunter.Position = new GridPosition(3, 3); // farther
            taunter.IsTaunting = true;

            var enemies = new List<CombatUnit> { close, taunter };
            // Even with Nearest rule, taunt overrides
            var target = TargetingSystem.GetTarget(attacker, enemies, TargetingRule.Nearest);

            Assert.AreEqual("e2", target.UnitId);
        }

        [Test]
        public void DeadUnits_Excluded()
        {
            var attacker = CombatUnit.Create("a1", "Attacker", Element.Fire, 500, 100, 0, 10, Team.Player);

            var dead = CombatUnit.Create("e1", "Dead", Element.Water, 0, 50, 0, 5, Team.Enemy);
            dead.IsAlive = false;

            var alive = CombatUnit.Create("e2", "Alive", Element.Water, 300, 50, 0, 5, Team.Enemy);

            var enemies = new List<CombatUnit> { dead, alive };
            var target = TargetingSystem.GetTarget(attacker, enemies, TargetingRule.Nearest);

            Assert.AreEqual("e2", target.UnitId);
        }

        [Test]
        public void AllDead_ReturnsNull()
        {
            var attacker = CombatUnit.Create("a1", "Attacker", Element.Fire, 500, 100, 0, 10, Team.Player);

            var dead1 = CombatUnit.Create("e1", "Dead1", Element.Water, 0, 50, 0, 5, Team.Enemy);
            dead1.IsAlive = false;
            var dead2 = CombatUnit.Create("e2", "Dead2", Element.Water, 0, 50, 0, 5, Team.Enemy);
            dead2.IsAlive = false;

            var enemies = new List<CombatUnit> { dead1, dead2 };
            var target = TargetingSystem.GetTarget(attacker, enemies, TargetingRule.Nearest);

            Assert.IsNull(target);
        }

        [Test]
        public void Random_ReturnsAliveUnit()
        {
            var attacker = CombatUnit.Create("a1", "Attacker", Element.Fire, 500, 100, 0, 10, Team.Player);

            var e1 = CombatUnit.Create("e1", "E1", Element.Water, 500, 50, 0, 5, Team.Enemy);
            var e2 = CombatUnit.Create("e2", "E2", Element.Water, 500, 50, 0, 5, Team.Enemy);

            var enemies = new List<CombatUnit> { e1, e2 };
            var rng = new Random(42);
            var target = TargetingSystem.GetTarget(attacker, enemies, TargetingRule.Random, rng);

            Assert.IsNotNull(target);
            Assert.IsTrue(target.IsAlive);
        }
    }
}

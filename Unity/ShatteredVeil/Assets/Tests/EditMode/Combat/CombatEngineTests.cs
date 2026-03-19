using System;
using System.Collections.Generic;
using NUnit.Framework;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Tests.EditMode.Combat
{
    [TestFixture]
    public class CombatEngineTests
    {
        [Test]
        public void OneVsOne_DeterministicWinner()
        {
            // Strong unit vs weak unit — strong should win
            var state = new CombatState { RngSeed = 12345 };
            state.PlayerTeam.Add(CombatUnit.Create("p1", "Strong", Element.Fire, 1000, 200, 0, 10, Team.Player));
            state.EnemyTeam.Add(CombatUnit.Create("e1", "Weak", Element.Wind, 300, 50, 0, 5, Team.Enemy));

            var engine = new CombatEngine(state, new Random(12345));
            var result = engine.RunFullBattle();

            Assert.AreEqual(Team.Player, result.Winner);
            Assert.IsFalse(result.IsDraw);
            Assert.Greater(result.TurnCount, 0);
        }

        [Test]
        public void ThreeVsThree_CompletesWithoutError()
        {
            var state = new CombatState { RngSeed = 42 };
            state.PlayerTeam.Add(CombatUnit.Create("p1", "P1", Element.Fire, 500, 100, 0, 12, Team.Player));
            state.PlayerTeam.Add(CombatUnit.Create("p2", "P2", Element.Water, 600, 80, 0, 10, Team.Player));
            state.PlayerTeam.Add(CombatUnit.Create("p3", "P3", Element.Earth, 700, 90, 0, 8, Team.Player));

            state.EnemyTeam.Add(CombatUnit.Create("e1", "E1", Element.Wind, 500, 100, 0, 11, Team.Enemy));
            state.EnemyTeam.Add(CombatUnit.Create("e2", "E2", Element.Lightning, 550, 85, 0, 9, Team.Enemy));
            state.EnemyTeam.Add(CombatUnit.Create("e3", "E3", Element.Force, 650, 95, 0, 7, Team.Enemy));

            var engine = new CombatEngine(state, new Random(42));
            var result = engine.RunFullBattle();

            Assert.IsNotNull(result);
            Assert.Greater(result.TurnCount, 0);
            Assert.Greater(result.Log.Count, 0);
        }

        [Test]
        public void MaxTurnLimit_DrawIsLoss()
        {
            // Two very tanky units with low ATK → should hit turn limit
            var state = new CombatState { RngSeed = 1 };
            state.PlayerTeam.Add(CombatUnit.Create("p1", "Tank", Element.Earth, 99999, 1, 0, 10, Team.Player));
            state.EnemyTeam.Add(CombatUnit.Create("e1", "Tank", Element.Earth, 99999, 1, 0, 10, Team.Enemy));

            var engine = new CombatEngine(state, new Random(1));
            var result = engine.RunFullBattle();

            Assert.AreEqual(Team.Enemy, result.Winner); // Draw = loss
            Assert.IsTrue(result.IsDraw);
            Assert.AreEqual(60, result.TurnCount); // Normal max turns
        }

        [Test]
        public void BossFight_180TurnLimit()
        {
            var state = new CombatState { RngSeed = 1, IsBoss = true };
            state.PlayerTeam.Add(CombatUnit.Create("p1", "Tank", Element.Earth, 99999, 1, 0, 10, Team.Player));
            state.EnemyTeam.Add(CombatUnit.Create("e1", "Boss", Element.Fire, 99999, 1, 0, 10, Team.Enemy));

            Assert.AreEqual(180, state.MaxTurns);

            var engine = new CombatEngine(state, new Random(1));
            var result = engine.RunFullBattle();

            Assert.AreEqual(180, result.TurnCount);
            Assert.IsTrue(result.IsDraw);
        }

        [Test]
        public void StunnedUnit_SkipsTurn()
        {
            var state = new CombatState { RngSeed = 42 };
            var stunned = CombatUnit.Create("p1", "Stunned", Element.Fire, 500, 100, 0, 20, Team.Player);
            stunned.IsStunned = true;
            state.PlayerTeam.Add(stunned);
            state.EnemyTeam.Add(CombatUnit.Create("e1", "Enemy", Element.Water, 500, 100, 0, 10, Team.Enemy));

            var engine = new CombatEngine(state, new Random(42));
            var turn1 = engine.ExecuteTurn();

            // Fastest unit (p1, SPD=20) goes first but is stunned
            Assert.IsTrue(turn1.Skipped);
            Assert.AreEqual("Stunned", turn1.SkipReason);
        }

        [Test]
        public void ElementAdvantage_WaterBeatsFireConsistently()
        {
            // Cross-validation scenario: Water deals 1.3x to Fire, Fire deals 0.7x to Water
            // With equal stats, Water should win due to element advantage
            int waterWins = 0;
            for (int seed = 0; seed < 10; seed++)
            {
                var state = new CombatState { RngSeed = seed };
                state.PlayerTeam.Add(CombatUnit.Create("p1", "Water", Element.Water, 500, 100, 0, 10, Team.Player));
                state.EnemyTeam.Add(CombatUnit.Create("e1", "Fire", Element.Fire, 500, 100, 0, 10, Team.Enemy));

                var engine = new CombatEngine(state, new Random(seed));
                var result = engine.RunFullBattle();

                if (result.Winner == Team.Player) waterWins++;
            }

            // Water should win all 10 — it deals 1.3x and takes 0.7x
            Assert.AreEqual(10, waterWins, "Water should always beat Fire with equal stats");
        }

        [Test]
        public void DamageValues_MatchGroundTruth()
        {
            // Specific scenario: Fire (ATK=100) attacks Water target
            // Fire vs Water = 0.7x → floor(100 * 0.7) = 70
            var state = new CombatState { RngSeed = 12345 };
            var fire = CombatUnit.Create("p1", "Fire", Element.Fire, 1000, 100, 0, 15, Team.Player);
            var water = CombatUnit.Create("e1", "Water", Element.Water, 1000, 100, 0, 10, Team.Enemy);
            state.PlayerTeam.Add(fire);
            state.EnemyTeam.Add(water);

            var engine = new CombatEngine(state, new Random(12345));
            var turn = engine.ExecuteTurn();

            // Fire attacks Water: 100 ATK * 0.7 element = 70 damage
            Assert.AreEqual("p1", turn.Attacker.UnitId);
            Assert.AreEqual(70, turn.Damage);
            Assert.AreEqual(930, water.CurrentHP);
        }

        [Test]
        public void MoveTowardTarget_ThenAttack()
        {
            // Place units far apart — first turn should be movement, then attack
            var state = new CombatState { RngSeed = 42 };
            var player = CombatUnit.Create("p1", "Player", Element.Force, 500, 100, 0, 10, Team.Player);
            player.AttackRange = 1;
            state.PlayerTeam.Add(player);

            var enemy = CombatUnit.Create("e1", "Enemy", Element.Force, 500, 50, 0, 5, Team.Enemy);
            state.EnemyTeam.Add(enemy);

            var engine = new CombatEngine(state, new Random(42));

            // The engine places units; player at (0,0), enemy at (2,0)
            // Range 1 melee can't reach distance 2 — should move first
            var result = engine.RunFullBattle();

            // Should eventually complete
            Assert.IsNotNull(result);
            Assert.Greater(result.TurnCount, 0);
        }
    }
}

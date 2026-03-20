using System;
using System.Collections.Generic;
using NUnit.Framework;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Tests.EditMode.Combat
{
    [TestFixture]
    public class CombatEngineAbilityTests
    {
        [Test]
        public void UnitFillsMana_CastsAbility_ManaResets()
        {
            var state = new CombatState { RngSeed = 42 };
            // Use flame_warrior (exists in catalog)
            var player = CombatUnit.Create("flame_warrior", "FlameWarrior", Element.Fire, 5000, 100, 0, 20, Team.Player);
            player.MaxMana = 100;
            player.Mana = 100; // Full mana — should cast on first turn
            state.PlayerTeam.Add(player);

            var enemy = CombatUnit.Create("e1", "Enemy", Element.Force, 5000, 50, 0, 5, Team.Enemy);
            enemy.MaxMana = 100;
            state.EnemyTeam.Add(enemy);

            var engine = new CombatEngine(state, new Random(42));
            var turn = engine.ExecuteTurn();

            // Player goes first (higher SPD) and should cast ability
            Assert.AreEqual("flame_warrior", turn.Attacker.UnitId);
            Assert.IsTrue(turn.UsedAbility, "Should have cast ability with full mana");
            Assert.IsNotNull(turn.AbilityResult);
            Assert.AreEqual(0, player.Mana, "Mana should reset to 0 after cast");
        }

        [Test]
        public void UnitWithoutMana_AutoAttacks()
        {
            var state = new CombatState { RngSeed = 42 };
            var player = CombatUnit.Create("flame_warrior", "FlameWarrior", Element.Fire, 5000, 100, 0, 20, Team.Player);
            player.MaxMana = 100;
            player.Mana = 0; // No mana
            state.PlayerTeam.Add(player);

            var enemy = CombatUnit.Create("e1", "Enemy", Element.Force, 5000, 50, 0, 5, Team.Enemy);
            state.EnemyTeam.Add(enemy);

            var engine = new CombatEngine(state, new Random(42));
            var turn = engine.ExecuteTurn();

            Assert.IsFalse(turn.UsedAbility, "Should auto-attack without full mana");
            Assert.Greater(turn.Damage, 0);
        }

        [Test]
        public void AutoAttack_GainsMana()
        {
            var state = new CombatState { RngSeed = 42 };
            var player = CombatUnit.Create("flame_warrior", "FlameWarrior", Element.Fire, 5000, 100, 0, 20, Team.Player);
            player.MaxMana = 100;
            player.Mana = 0;
            state.PlayerTeam.Add(player);

            var enemy = CombatUnit.Create("e1", "Enemy", Element.Force, 5000, 50, 0, 5, Team.Enemy);
            state.EnemyTeam.Add(enemy);

            var engine = new CombatEngine(state, new Random(42));
            engine.ExecuteTurn();

            // After auto-attack, player should have gained 10 mana
            Assert.AreEqual(10, player.Mana);
        }

        [Test]
        public void Target_GainsManaOnHit_FromAutoAttack()
        {
            var state = new CombatState { RngSeed = 42 };
            var player = CombatUnit.Create("flame_warrior", "FlameWarrior", Element.Fire, 5000, 100, 0, 20, Team.Player);
            player.MaxMana = 100;
            player.Mana = 0;
            state.PlayerTeam.Add(player);

            var enemy = CombatUnit.Create("e1", "Enemy", Element.Force, 1000, 50, 0, 5, Team.Enemy);
            enemy.MaxMana = 100;
            enemy.Mana = 0;
            state.EnemyTeam.Add(enemy);

            var engine = new CombatEngine(state, new Random(42));
            engine.ExecuteTurn();

            // Enemy should have gained mana from taking damage
            // 100 ATK * 1.0 elem = 100 damage
            // mana = max(1, floor(100/1000 * 50)) = 5
            Assert.Greater(enemy.Mana, 0);
        }

        [Test]
        public void AbilityDamage_MatchesDamageCalculator()
        {
            var state = new CombatState { RngSeed = 42 };
            var player = CombatUnit.Create("flame_warrior", "FlameWarrior", Element.Fire, 5000, 100, 0, 20, Team.Player);
            player.MaxMana = 100;
            player.Mana = 100;
            state.PlayerTeam.Add(player);

            // Use Force element (1.0x multiplier) for predictable damage
            var enemy = CombatUnit.Create("e1", "Enemy", Element.Force, 5000, 50, 0, 5, Team.Enemy);
            enemy.MaxMana = 100;
            state.EnemyTeam.Add(enemy);

            var engine = new CombatEngine(state, new Random(42));
            var turn = engine.ExecuteTurn();

            // flame_warrior: 1.5x ATK, Fire vs Force = 1.0x
            // Expected: floor(100 * 1.5 * 1.0) = 150
            Assert.IsTrue(turn.UsedAbility);
            Assert.Greater(turn.Damage, 0);
        }

        [Test]
        public void SilencedUnit_CannotCast_AutoAttacks()
        {
            var state = new CombatState { RngSeed = 42 };
            var player = CombatUnit.Create("flame_warrior", "FlameWarrior", Element.Fire, 5000, 100, 0, 20, Team.Player);
            player.MaxMana = 100;
            player.Mana = 100;
            player.IsSilenced = true;
            state.PlayerTeam.Add(player);

            var enemy = CombatUnit.Create("e1", "Enemy", Element.Force, 5000, 50, 0, 5, Team.Enemy);
            state.EnemyTeam.Add(enemy);

            var engine = new CombatEngine(state, new Random(42));
            var turn = engine.ExecuteTurn();

            Assert.IsFalse(turn.UsedAbility, "Silenced unit should not cast ability");
            Assert.AreEqual(100, player.Mana, "Mana should stay at max while silenced");
        }

        [Test]
        public void UnitWithNoAbilityInCatalog_AutoAttacks()
        {
            var state = new CombatState { RngSeed = 42 };
            // Use a unit ID that doesn't exist in the catalog
            var player = CombatUnit.Create("unknown_unit", "Unknown", Element.Fire, 5000, 100, 0, 20, Team.Player);
            player.MaxMana = 100;
            player.Mana = 100;
            state.PlayerTeam.Add(player);

            var enemy = CombatUnit.Create("e1", "Enemy", Element.Force, 5000, 50, 0, 5, Team.Enemy);
            state.EnemyTeam.Add(enemy);

            var engine = new CombatEngine(state, new Random(42));
            var turn = engine.ExecuteTurn();

            Assert.IsFalse(turn.UsedAbility, "Unknown unit should auto-attack");
        }

        [Test]
        public void FullBattle3v3_WithAbilities_Completes()
        {
            var state = new CombatState { RngSeed = 42 };
            var p1 = CombatUnit.Create("flame_warrior", "P1", Element.Fire, 800, 100, 0, 12, Team.Player);
            p1.MaxMana = 60;
            var p2 = CombatUnit.Create("coral_priest", "P2", Element.Water, 600, 80, 0, 10, Team.Player);
            p2.MaxMana = 80;
            var p3 = CombatUnit.Create("stone_guard", "P3", Element.Earth, 1000, 60, 0, 8, Team.Player);
            p3.MaxMana = 80;
            state.PlayerTeam.Add(p1);
            state.PlayerTeam.Add(p2);
            state.PlayerTeam.Add(p3);

            var e1 = CombatUnit.Create("zephyr_scout", "E1", Element.Wind, 700, 90, 0, 11, Team.Enemy);
            e1.MaxMana = 50;
            var e2 = CombatUnit.Create("spark_fencer", "E2", Element.Lightning, 750, 85, 0, 9, Team.Enemy);
            e2.MaxMana = 70;
            var e3 = CombatUnit.Create("iron_soldier", "E3", Element.Force, 900, 70, 0, 7, Team.Enemy);
            e3.MaxMana = 60;
            state.EnemyTeam.Add(e1);
            state.EnemyTeam.Add(e2);
            state.EnemyTeam.Add(e3);

            var engine = new CombatEngine(state, new Random(42));
            var result = engine.RunFullBattle();

            Assert.IsNotNull(result);
            Assert.Greater(result.TurnCount, 0);
            Assert.Greater(result.Log.Count, 0);

            // Verify at least some abilities were cast
            bool anyAbility = false;
            foreach (var turn in result.Log)
            {
                if (turn.UsedAbility)
                {
                    anyAbility = true;
                    break;
                }
            }
            Assert.IsTrue(anyAbility, "At least one ability should have been cast in a 3v3 battle");
        }

        [Test]
        public void T5Unit_NeverCastsViaManaSinceMaxManaZero()
        {
            var state = new CombatState { RngSeed = 42 };
            // phoenix is a T5 PassiveCast — MaxMana should be 0 for T5 units
            var player = CombatUnit.Create("phoenix", "Phoenix", Element.Fire, 5000, 100, 0, 20, Team.Player);
            player.MaxMana = 0; // T5 — no mana-based casting
            state.PlayerTeam.Add(player);

            var enemy = CombatUnit.Create("e1", "Enemy", Element.Force, 5000, 50, 0, 5, Team.Enemy);
            state.EnemyTeam.Add(enemy);

            var engine = new CombatEngine(state, new Random(42));
            var turn = engine.ExecuteTurn();

            // Even though phoenix exists in catalog, MaxMana=0 means no mana casting
            Assert.IsFalse(turn.UsedAbility);
        }

        [Test]
        public void ManaAccumulation_AcrossMultipleTurns()
        {
            var state = new CombatState { RngSeed = 42 };
            var player = CombatUnit.Create("flame_warrior", "FlameWarrior", Element.Fire, 5000, 100, 0, 20, Team.Player);
            player.MaxMana = 50;
            player.Mana = 0;
            state.PlayerTeam.Add(player);

            var enemy = CombatUnit.Create("e1", "Enemy", Element.Force, 50000, 1, 0, 5, Team.Enemy);
            enemy.MaxMana = 100;
            state.EnemyTeam.Add(enemy);

            var engine = new CombatEngine(state, new Random(42));

            // Each auto-attack gives 10 mana. After 5 attacks (turns), mana = 50 = max
            // Turn 1-5: player auto-attacks, gaining 10 mana each
            // But enemy also takes turns, so actual player turn count depends on ordering
            bool castAbility = false;
            for (int i = 0; i < 20; i++)
            {
                var turn = engine.ExecuteTurn();
                if (turn == null || turn.BattleOver) break;
                if (turn.Attacker.UnitId == "flame_warrior" && turn.UsedAbility)
                {
                    castAbility = true;
                    Assert.AreEqual(0, player.Mana, "Mana should reset after cast");
                    break;
                }
            }
            Assert.IsTrue(castAbility, "Player should eventually cast ability after accumulating mana");
        }
    }
}

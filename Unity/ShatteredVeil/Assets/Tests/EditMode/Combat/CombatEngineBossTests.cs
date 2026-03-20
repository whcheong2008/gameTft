using System;
using System.Collections.Generic;
using NUnit.Framework;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Tests.EditMode.Combat
{
    [TestFixture]
    public class CombatEngineBossTests
    {
        private CombatUnit MakePlayerUnit(string id, Element element, int hp, int atk, int spd)
        {
            var unit = CombatUnit.Create(id, id, element, hp, atk, 5, spd, Team.Player);
            unit.MaxMana = 100;
            unit.Mana = 0;
            unit.AttackRange = 1;
            return unit;
        }

        private CombatUnit MakeBoss(string bossId, int hp, int atk, int spd)
        {
            var unit = CombatUnit.Create(bossId, bossId, Element.Force, hp, atk, 20, spd, Team.Enemy);
            unit.MaxMana = 999;
            unit.Mana = 0;
            unit.AttackRange = 1;
            return unit;
        }

        // ── Full boss fight runs to completion ───────────────────────────
        [Test]
        public void FullBossFight_RunsToCompletion()
        {
            var boss = MakeBoss("veil_warden", 500, 20, 8);
            var player1 = MakePlayerUnit("flame_warrior", Element.Fire, 300, 30, 12);
            var player2 = MakePlayerUnit("frost_archer", Element.Water, 250, 25, 10);

            var state = new CombatState
            {
                PlayerTeam = new List<CombatUnit> { player1, player2 },
                EnemyTeam = new List<CombatUnit> { boss },
                IsBoss = true
            };

            var engine = new CombatEngine(state, new Random(42));
            var result = engine.RunFullBattle();

            Assert.IsTrue(result.TurnCount > 0, "Battle should have at least 1 turn");
            Assert.IsTrue(
                result.Winner == Team.Player || result.Winner == Team.Enemy,
                "Battle should have a winner");
        }

        // ── Player team can win boss fight ───────────────────────────────
        [Test]
        public void PlayerTeam_CanWinBossFight()
        {
            // Strong player team vs weak boss
            var boss = MakeBoss("veil_warden", 200, 10, 5);
            var player1 = MakePlayerUnit("flame_warrior", Element.Fire, 500, 80, 15);
            var player2 = MakePlayerUnit("frost_archer", Element.Water, 400, 60, 12);

            var state = new CombatState
            {
                PlayerTeam = new List<CombatUnit> { player1, player2 },
                EnemyTeam = new List<CombatUnit> { boss },
                IsBoss = true
            };

            var engine = new CombatEngine(state, new Random(42));
            var result = engine.RunFullBattle();

            Assert.AreEqual(Team.Player, result.Winner, "Strong player team should beat weak boss");
        }

        // ── Passives fire during boss combat ─────────────────────────────
        [Test]
        public void PassivesFire_DuringBossCombat()
        {
            // Use aegis_paladin to verify combat_start passive fires
            var boss = MakeBoss("veil_warden", 1000, 15, 5);
            var paladin = MakePlayerUnit("aegis_paladin", Element.Wind, 300, 20, 10);
            var ally = MakePlayerUnit("dummy", Element.Fire, 200, 15, 8);

            var state = new CombatState
            {
                PlayerTeam = new List<CombatUnit> { paladin, ally },
                EnemyTeam = new List<CombatUnit> { boss },
                IsBoss = true
            };

            var engine = new CombatEngine(state, new Random(42));

            // CombatStart should have fired — check shields
            Assert.AreEqual(100, paladin.Shield, "Aegis Paladin combat start should grant shields");
            Assert.AreEqual(100, ally.Shield, "Ally should have shield from Aegis Paladin");
        }

        // ── Boss enrage makes fight increasingly lethal ──────────────────
        [Test]
        public void BossEnrage_IncreasesATK()
        {
            var boss = MakeBoss("veil_warden", 10000, 50, 8);
            var player = MakePlayerUnit("flame_warrior", Element.Fire, 500, 20, 10);

            var state = new CombatState
            {
                PlayerTeam = new List<CombatUnit> { player },
                EnemyTeam = new List<CombatUnit> { boss },
                IsBoss = true
            };

            var engine = new CombatEngine(state, new Random(42));
            var bossSystem = engine.BossSystem;
            var bossData = BossCatalog.Get("veil_warden");

            int atkBefore = boss.ATK;

            // Simulate enrage
            bossSystem.CheckEnrage(boss, bossData, 180f);

            Assert.IsTrue(bossSystem.IsEnraged(boss));
            Assert.AreEqual(atkBefore * 2, boss.ATK, "Boss ATK should double on enrage");
        }

        // ── Phase transitions happen in correct order ────────────────────
        [Test]
        public void PhaseTransitions_HappenInOrder_Colossus()
        {
            var boss = MakeBoss("shattered_colossus", 15000, 50, 8);
            boss.MaxHP = 15000;

            var state = new CombatState
            {
                PlayerTeam = new List<CombatUnit>
                {
                    MakePlayerUnit("p1", Element.Fire, 500, 30, 10)
                },
                EnemyTeam = new List<CombatUnit> { boss },
                IsBoss = true
            };

            var engine = new CombatEngine(state, new Random(42));
            var bossSystem = engine.BossSystem;
            var bossData = BossCatalog.Get("shattered_colossus");

            Assert.AreEqual(0, bossSystem.GetCurrentPhase(boss));

            // Simulate HP drops
            boss.CurrentHP = 9000; // 60% — below 65% threshold
            Assert.IsTrue(bossSystem.CheckPhaseTransition(boss, bossData));
            bossSystem.TransitionPhase(boss, bossData);
            Assert.AreEqual(1, bossSystem.GetCurrentPhase(boss));

            boss.CurrentHP = 4000; // ~27% — below 30% threshold
            Assert.IsTrue(bossSystem.CheckPhaseTransition(boss, bossData));
            bossSystem.TransitionPhase(boss, bossData);
            Assert.AreEqual(2, bossSystem.GetCurrentPhase(boss));

            // No more transitions
            boss.CurrentHP = 1000;
            Assert.IsFalse(bossSystem.CheckPhaseTransition(boss, bossData));
        }
    }
}

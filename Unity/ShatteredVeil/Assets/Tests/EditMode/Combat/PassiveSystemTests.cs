using System;
using System.Collections.Generic;
using NUnit.Framework;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Tests.EditMode.Combat
{
    [TestFixture]
    public class PassiveSystemTests
    {
        private CombatState MakeState(List<CombatUnit> playerTeam, List<CombatUnit> enemyTeam)
        {
            return new CombatState
            {
                PlayerTeam = playerTeam,
                EnemyTeam = enemyTeam,
                Phase = BattlePhase.InProgress
            };
        }

        private CombatUnit MakeUnit(string id, Element element, int hp, int atk, Team team)
        {
            var unit = CombatUnit.Create(id, id, element, hp, atk, 5, 10, team);
            unit.Position = new GridPosition(team == Team.Player ? 0 : 2, 0);
            return unit;
        }

        // ── OnAttack: Heated Blows (every 3rd attack) ────────────────────
        [Test]
        public void OnAttack_HeatedBlows_Every3rdAttack_DealsBonusDamage()
        {
            var system = new PassiveSystem();
            var attacker = MakeUnit("flame_warrior", Element.Fire, 100, 20, Team.Player);
            var target = MakeUnit("dummy", Element.Water, 500, 10, Team.Enemy);
            var state = MakeState(
                new List<CombatUnit> { attacker },
                new List<CombatUnit> { target });
            var dmg = new DamageResult { Damage = 20 };

            system.OnCombatStart(state);

            // Attacks 1, 2 — no bonus
            var events1 = system.OnAttack(attacker, target, dmg, state);
            var events2 = system.OnAttack(attacker, target, dmg, state);

            int hpAfter2 = target.CurrentHP;

            // Attack 3 — should fire interval bonus (25% of 20 ATK = 5)
            var events3 = system.OnAttack(attacker, target, dmg, state);

            bool foundBonus = false;
            foreach (var ev in events3)
                if (ev.DamageDealt > 0 && ev.Description.Contains("bonus"))
                    foundBonus = true;

            Assert.IsTrue(foundBonus, "3rd attack should trigger Heated Blows bonus damage");
            Assert.Less(target.CurrentHP, hpAfter2, "Target should have taken bonus damage on 3rd attack");
        }

        // ── OnHit: Molten Armor (reflect 20%) ────────────────────────────
        [Test]
        public void OnHit_MoltenArmor_ReflectsDamage()
        {
            var system = new PassiveSystem();
            var attacker = MakeUnit("dummy", Element.Water, 100, 20, Team.Player);
            var defender = MakeUnit("magma_knight", Element.Fire, 500, 15, Team.Enemy);
            var state = MakeState(
                new List<CombatUnit> { attacker },
                new List<CombatUnit> { defender });

            system.OnCombatStart(state);

            int attackerHpBefore = attacker.CurrentHP;
            var events = system.OnHit(defender, attacker, 50f, state);

            bool foundReflect = false;
            foreach (var ev in events)
                if (ev.DamageDealt > 0 && ev.Description.Contains("reflect"))
                    foundReflect = true;

            Assert.IsTrue(foundReflect, "OnHit should fire reflect passive");
            Assert.Less(attacker.CurrentHP, attackerHpBefore, "Attacker should take reflect damage");
            // Reflect 20% of 50 = 10
            Assert.AreEqual(attackerHpBefore - 10, attacker.CurrentHP);
        }

        // ── CombatStart: Aegis Paladin (shield all allies) ───────────────
        [Test]
        public void CombatStart_AegisPaladin_ShieldsAllAllies()
        {
            var system = new PassiveSystem();
            var paladin = MakeUnit("aegis_paladin", Element.Wind, 200, 15, Team.Player);
            var ally1 = MakeUnit("dummy1", Element.Fire, 100, 10, Team.Player);
            var ally2 = MakeUnit("dummy2", Element.Water, 100, 10, Team.Player);
            var enemy = MakeUnit("enemy", Element.Earth, 200, 10, Team.Enemy);

            var state = MakeState(
                new List<CombatUnit> { paladin, ally1, ally2 },
                new List<CombatUnit> { enemy });

            system.OnCombatStart(state);

            Assert.AreEqual(100, paladin.Shield, "Paladin should have 100 shield");
            Assert.AreEqual(100, ally1.Shield, "Ally1 should have 100 shield");
            Assert.AreEqual(100, ally2.Shield, "Ally2 should have 100 shield");
            Assert.AreEqual(0, enemy.Shield, "Enemy should not get shield");
        }

        // ── Aura: Dragonfire Aura tick ───────────────────────────────────
        [Test]
        public void TickAuras_StormDragon_PeriodicStrikeDamage()
        {
            var system = new PassiveSystem();
            var dragon = MakeUnit("storm_dragon", Element.Lightning, 500, 100, Team.Player);
            var enemy = MakeUnit("enemy", Element.Water, 1000, 10, Team.Enemy);
            var state = MakeState(
                new List<CombatUnit> { dragon },
                new List<CombatUnit> { enemy });

            system.OnCombatStart(state);

            int hpBefore = enemy.CurrentHP;

            // Tick 5 times (5 seconds) — strike interval is 6s, should not fire yet
            for (int i = 0; i < 5; i++)
                system.TickAuras(state, 1.0f);

            Assert.AreEqual(hpBefore, enemy.CurrentHP, "No strike before 6s");

            // Tick once more (total 6s) — should fire strike
            var events = system.TickAuras(state, 1.0f);
            Assert.Less(enemy.CurrentHP, hpBefore, "Enemy should take strike damage after 6s");
        }

        // ── Periodic: Shell Knight shield grant ──────────────────────────
        [Test]
        public void TickPeriodic_ShellKnight_ShieldGrant()
        {
            var system = new PassiveSystem();
            var knight = MakeUnit("shell_knight", Element.Water, 400, 15, Team.Player);
            var ally = MakeUnit("ally", Element.Fire, 200, 10, Team.Player);
            var enemy = MakeUnit("enemy", Element.Earth, 200, 10, Team.Enemy);

            var state = MakeState(
                new List<CombatUnit> { knight, ally },
                new List<CombatUnit> { enemy });

            system.OnCombatStart(state);

            // Tick 5 times (not yet at interval=6)
            for (int i = 0; i < 5; i++)
                system.TickPeriodic(state, 1.0f);

            Assert.AreEqual(0, knight.Shield, "No shield before interval");

            // Tick once more (total 6s = interval)
            system.TickPeriodic(state, 1.0f);

            // Shield = 25% of 400 max HP = 100
            Assert.AreEqual(100, knight.Shield, "Knight should have shield after periodic fires");
            Assert.AreEqual(100, ally.Shield, "Ally should get shield (allyCount=1)");
        }

        // ── Reentry guard: passive → triggers passive → stops ────────────
        [Test]
        public void ReentryGuard_PreventsInfiniteLoop()
        {
            var system = new PassiveSystem();
            // Two units with OnHit reflect passives attacking each other
            var unit1 = MakeUnit("magma_knight", Element.Fire, 500, 20, Team.Player);
            var unit2 = MakeUnit("bramble_knight", Element.Earth, 500, 20, Team.Enemy);
            unit2.Position = new GridPosition(2, 0);

            var state = MakeState(
                new List<CombatUnit> { unit1 },
                new List<CombatUnit> { unit2 });

            system.OnCombatStart(state);

            int unit1HpBefore = unit1.CurrentHP;
            int unit2HpBefore = unit2.CurrentHP;

            // unit2 hits unit1 → unit1 reflect fires → depth 1 reached
            // If unit1 reflect hits unit2, unit2 reflect should NOT fire (depth limit)
            var events = system.OnHit(unit1, unit2, 100f, state);

            // Only unit1's reflect should fire, dealing 20% of 100 = 20 to unit2
            Assert.Less(unit2.CurrentHP, unit2HpBefore, "unit2 should take reflect damage");
            // unit1 should NOT take additional reflect damage from unit2 (depth limit)
            Assert.AreEqual(unit1HpBefore, unit1.CurrentHP,
                "unit1 should not take recursive reflect (reentry guard)");
        }

        // ── Dead unit passives don't fire ────────────────────────────────
        [Test]
        public void PassiveDoesNotFire_ForDeadUnits()
        {
            var system = new PassiveSystem();
            var attacker = MakeUnit("flame_warrior", Element.Fire, 0, 20, Team.Player);
            attacker.IsAlive = false;
            var target = MakeUnit("dummy", Element.Water, 500, 10, Team.Enemy);
            var state = MakeState(
                new List<CombatUnit> { attacker },
                new List<CombatUnit> { target });

            system.OnCombatStart(state);

            var events = system.OnAttack(attacker, target, new DamageResult { Damage = 20 }, state);
            Assert.AreEqual(0, events.Count, "Dead unit's passive should not fire");
        }

        // ── OnHeal: Ocean Sage bonus shield ──────────────────────────────
        [Test]
        public void OnHeal_OceanSage_GrantsBonusShield()
        {
            var system = new PassiveSystem();
            var healer = MakeUnit("ocean_sage", Element.Water, 200, 15, Team.Player);
            var target = MakeUnit("ally", Element.Fire, 200, 10, Team.Player);
            target.CurrentHP = 100; // Wounded
            var enemy = MakeUnit("enemy", Element.Earth, 200, 10, Team.Enemy);

            var state = MakeState(
                new List<CombatUnit> { healer, target },
                new List<CombatUnit> { enemy });

            system.OnCombatStart(state);

            var events = system.OnHeal(healer, target, 50f, state);

            bool foundShield = false;
            foreach (var ev in events)
                if (ev.ShieldGranted > 0) foundShield = true;

            Assert.IsTrue(foundShield, "Ocean Sage should grant bonus shield on heal");
            Assert.AreEqual(50, target.Shield, "Target should have 50 shield from heal passive");
        }

        // ── Execute bonus (Shadow Blade) ─────────────────────────────────
        [Test]
        public void OnAttack_Executioner_BonusDamageBelow40Percent()
        {
            var system = new PassiveSystem();
            var attacker = MakeUnit("shadow_blade", Element.Force, 200, 50, Team.Player);
            var target = MakeUnit("dummy", Element.Water, 100, 10, Team.Enemy);
            target.CurrentHP = 30; // 30% HP — below 40% threshold

            var state = MakeState(
                new List<CombatUnit> { attacker },
                new List<CombatUnit> { target });

            system.OnCombatStart(state);

            int hpBefore = target.CurrentHP;
            var events = system.OnAttack(attacker, target, new DamageResult { Damage = 20 }, state);

            bool foundExecute = false;
            foreach (var ev in events)
                if (ev.Description != null && ev.Description.Contains("execute"))
                    foundExecute = true;

            Assert.IsTrue(foundExecute, "Should trigger execute bonus below 40% HP");
            Assert.Less(target.CurrentHP, hpBefore, "Target should take execute bonus damage");
        }

        // ── Lifesteal passive ────────────────────────────────────────────
        [Test]
        public void OnAttack_Lifesteal_HealsAttacker()
        {
            var system = new PassiveSystem();
            var attacker = MakeUnit("reef_stalker", Element.Water, 200, 20, Team.Player);
            attacker.CurrentHP = 100; // Wounded
            var target = MakeUnit("dummy", Element.Earth, 500, 10, Team.Enemy);

            var state = MakeState(
                new List<CombatUnit> { attacker },
                new List<CombatUnit> { target });

            system.OnCombatStart(state);

            var events = system.OnAttack(attacker, target, new DamageResult { Damage = 40 }, state);

            // 25% of 40 = 10 heal
            Assert.AreEqual(110, attacker.CurrentHP, "Attacker should heal 25% of damage dealt");
        }
    }
}

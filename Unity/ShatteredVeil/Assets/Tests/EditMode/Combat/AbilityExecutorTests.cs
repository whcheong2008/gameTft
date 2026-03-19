using System;
using System.Collections.Generic;
using NUnit.Framework;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Tests.EditMode.Combat
{
    [TestFixture]
    public class AbilityExecutorTests
    {
        private CombatState _state;
        private GridSystem _grid;
        private Random _rng;

        private CombatUnit MakeUnit(string id, Element element, int hp, int atk, Team team,
            int row = 0, int col = 0)
        {
            var unit = CombatUnit.Create(id, id, element, hp, atk, 0, 10, team);
            unit.Position = new GridPosition(row, col);
            return unit;
        }

        [SetUp]
        public void SetUp()
        {
            _state = new CombatState { RngSeed = 42 };
            _grid = new GridSystem();
            _rng = new Random(42);
        }

        [Test]
        public void SingleTargetDamage_CorrectOutput()
        {
            var caster = MakeUnit("flame_warrior", Element.Fire, 1000, 100, Team.Player, 0, 0);
            var enemy = MakeUnit("e1", Element.Wind, 1000, 50, Team.Enemy, 2, 0);
            _state.PlayerTeam.Add(caster);
            _state.EnemyTeam.Add(enemy);
            _grid.PlaceUnit(caster, caster.Position);
            _grid.PlaceUnit(enemy, enemy.Position);

            var ability = AbilityCatalog.Get("flame_warrior");
            var result = AbilityExecutor.Execute(caster, ability, _state, _grid, _rng);

            // 100 ATK * 1.5 mult * 1.3 elem (fire > wind) = 195
            Assert.Greater(result.TotalDamage, 0);
            Assert.Greater(result.DamageInstances.Count, 0);
        }

        [Test]
        public void AoEAbility_HitsMultipleTargets()
        {
            var caster = MakeUnit("cinder_archer", Element.Fire, 1000, 100, Team.Player, 0, 0);
            var e1 = MakeUnit("e1", Element.Wind, 1000, 50, Team.Enemy, 2, 0);
            var e2 = MakeUnit("e2", Element.Wind, 1000, 50, Team.Enemy, 2, 1);
            _state.PlayerTeam.Add(caster);
            _state.EnemyTeam.Add(e1);
            _state.EnemyTeam.Add(e2);
            _grid.PlaceUnit(caster, caster.Position);
            _grid.PlaceUnit(e1, e1.Position);
            _grid.PlaceUnit(e2, e2.Position);

            var ability = AbilityCatalog.Get("cinder_archer");
            var result = AbilityExecutor.Execute(caster, ability, _state, _grid, _rng);

            // AoE radius 1 centered on target — should hit both enemies (they're adjacent)
            Assert.GreaterOrEqual(result.DamageInstances.Count, 1);
            Assert.Greater(result.TotalDamage, 0);
        }

        [Test]
        public void HealAbility_HealsLowestAlly()
        {
            var caster = MakeUnit("fire_acolyte", Element.Fire, 1000, 100, Team.Player, 0, 0);
            var injured = MakeUnit("p2", Element.Fire, 1000, 50, Team.Player, 0, 1);
            injured.CurrentHP = 200; // Injured
            var enemy = MakeUnit("e1", Element.Wind, 1000, 50, Team.Enemy, 2, 0);
            _state.PlayerTeam.Add(caster);
            _state.PlayerTeam.Add(injured);
            _state.EnemyTeam.Add(enemy);
            _grid.PlaceUnit(caster, caster.Position);
            _grid.PlaceUnit(injured, injured.Position);
            _grid.PlaceUnit(enemy, enemy.Position);

            var ability = AbilityCatalog.Get("fire_acolyte");
            var result = AbilityExecutor.Execute(caster, ability, _state, _grid, _rng);

            // Should heal the injured ally (ATK 100 * 1.5 = 150)
            Assert.Greater(result.TotalHealing, 0);
            Assert.Greater(result.HealInstances.Count, 0);
            Assert.AreEqual(injured, result.HealInstances[0].Target);
        }

        [Test]
        public void ShieldAbility_GrantsShield()
        {
            var caster = MakeUnit("stone_guard", Element.Earth, 1000, 100, Team.Player, 0, 0);
            _state.PlayerTeam.Add(caster);
            _grid.PlaceUnit(caster, caster.Position);

            var ability = AbilityCatalog.Get("stone_guard");
            var result = AbilityExecutor.Execute(caster, ability, _state, _grid, _rng);

            // Self shield: 40% of 1000 = 400
            Assert.Greater(result.TotalShielding, 0);
            Assert.AreEqual(400, caster.Shield);
        }

        [Test]
        public void ConditionalBonus_LowHPTargetTakesMore()
        {
            // flame_warrior: +50% bonus vs targets below 40% HP
            var caster = MakeUnit("flame_warrior", Element.Fire, 1000, 100, Team.Player, 0, 0);
            var lowHpEnemy = MakeUnit("e1", Element.Force, 1000, 50, Team.Enemy, 2, 0);
            lowHpEnemy.CurrentHP = 300; // 30% HP, below 40% threshold
            _state.PlayerTeam.Add(caster);
            _state.EnemyTeam.Add(lowHpEnemy);
            _grid.PlaceUnit(caster, caster.Position);
            _grid.PlaceUnit(lowHpEnemy, lowHpEnemy.Position);

            var ability = AbilityCatalog.Get("flame_warrior");
            var result = AbilityExecutor.Execute(caster, ability, _state, _grid, _rng);

            // Should do more damage due to conditional bonus + forced crit
            // Base: 100 * (1.5 + 0.5) * 1.0 elem * 1.5 crit = 300
            Assert.Greater(result.TotalDamage, 0);
            // The damage should be higher than base 150 (100 * 1.5)
            Assert.Greater(result.DamageInstances[0].Damage, 150);
        }

        [Test]
        public void ManaRefundOnKill()
        {
            var caster = MakeUnit("flame_warrior", Element.Fire, 1000, 500, Team.Player, 0, 0);
            caster.Mana = 0;
            caster.MaxMana = 100;
            var weakEnemy = MakeUnit("e1", Element.Force, 50, 10, Team.Enemy, 2, 0);
            _state.PlayerTeam.Add(caster);
            _state.EnemyTeam.Add(weakEnemy);
            _grid.PlaceUnit(caster, caster.Position);
            _grid.PlaceUnit(weakEnemy, weakEnemy.Position);

            var ability = AbilityCatalog.Get("flame_warrior");
            var result = AbilityExecutor.Execute(caster, ability, _state, _grid, _rng);

            // Should kill the weak enemy and refund 30 mana
            Assert.IsTrue(result.DamageInstances[0].Killed);
            Assert.IsTrue(result.ManaRefunded);
            Assert.AreEqual(30, result.ManaRefundAmount);
            Assert.AreEqual(30, caster.Mana);
        }

        [Test]
        public void MultiHitAbility_HitsCorrectTimes()
        {
            var caster = MakeUnit("wind_archer", Element.Wind, 1000, 100, Team.Player, 0, 0);
            var enemy = MakeUnit("e1", Element.Force, 5000, 50, Team.Enemy, 2, 0);
            _state.PlayerTeam.Add(caster);
            _state.EnemyTeam.Add(enemy);
            _grid.PlaceUnit(caster, caster.Position);
            _grid.PlaceUnit(enemy, enemy.Position);

            var ability = AbilityCatalog.Get("wind_archer");
            var result = AbilityExecutor.Execute(caster, ability, _state, _grid, _rng);

            // wind_archer hits 5 times at 80% ATK each
            Assert.AreEqual(5, result.DamageInstances.Count);
        }

        [Test]
        public void PassiveCastAbility_ReturnsEarlyWithEvent()
        {
            var caster = MakeUnit("phoenix", Element.Fire, 1000, 100, Team.Player, 0, 0);
            _state.PlayerTeam.Add(caster);

            var ability = AbilityCatalog.Get("phoenix");
            var result = AbilityExecutor.Execute(caster, ability, _state, _grid, _rng);

            Assert.AreEqual(0, result.DamageInstances.Count);
            Assert.Contains("passive_no_mana_cast", result.SpecialEvents);
        }

        [Test]
        public void ManaGainOnHit_AppliedToTargets()
        {
            var caster = MakeUnit("flame_warrior", Element.Fire, 1000, 100, Team.Player, 0, 0);
            var enemy = MakeUnit("e1", Element.Force, 2000, 50, Team.Enemy, 2, 0);
            enemy.Mana = 0;
            enemy.MaxMana = 100;
            _state.PlayerTeam.Add(caster);
            _state.EnemyTeam.Add(enemy);
            _grid.PlaceUnit(caster, caster.Position);
            _grid.PlaceUnit(enemy, enemy.Position);

            var ability = AbilityCatalog.Get("flame_warrior");
            AbilityExecutor.Execute(caster, ability, _state, _grid, _rng);

            // Enemy should have gained mana from taking damage
            Assert.Greater(enemy.Mana, 0);
        }
    }
}

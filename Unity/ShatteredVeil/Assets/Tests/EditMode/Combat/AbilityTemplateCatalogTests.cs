using System;
using System.Collections.Generic;
using NUnit.Framework;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Tests.EditMode.Combat
{
    [TestFixture]
    public class AbilityTemplateCatalogTests
    {
        [Test]
        public void Catalog_Contains_All25Templates()
        {
            Assert.AreEqual(25, AbilityTemplateCatalog.Count);
        }

        [Test]
        public void Catalog_Contains_All19ActiveTemplates()
        {
            var activeIds = new[]
            {
                "dot_spreader", "dot_detonator", "revenge_tank", "heal_and_harm",
                "execute_striker", "crowd_puller", "shield_stacker", "cc_chainer",
                "drain_fighter", "terrain_shaper", "lockdown_specialist", "unkillable_wall",
                "dodge_tank", "chain_killer", "blink_striker", "multi_striker",
                "frontload_nuker", "ramping_attacker", "bodyguard"
            };
            foreach (var id in activeIds)
            {
                Assert.IsTrue(AbilityTemplateCatalog.Contains(id),
                    "Missing active template: " + id);
                var t = AbilityTemplateCatalog.Get(id);
                Assert.IsFalse(t.IsLegendary, id + " should not be legendary");
            }
        }

        [Test]
        public void Catalog_Contains_All6LegendaryTemplates()
        {
            var legendaryIds = new[]
            {
                "transformer", "unkillable_wall_premium", "summoner",
                "disruptor", "aura_burner", "zone_creator"
            };
            foreach (var id in legendaryIds)
            {
                Assert.IsTrue(AbilityTemplateCatalog.Contains(id),
                    "Missing legendary template: " + id);
                var t = AbilityTemplateCatalog.Get(id);
                Assert.IsTrue(t.IsLegendary, id + " should be legendary");
            }
        }

        [Test]
        public void Get_InvalidId_ReturnsNull()
        {
            Assert.IsNull(AbilityTemplateCatalog.Get("nonexistent"));
            Assert.IsNull(AbilityTemplateCatalog.Get(null));
            Assert.IsNull(AbilityTemplateCatalog.Get(""));
        }

        // ── Template execution tests ──────────────────────────────────────

        private CombatUnit MakeUnit(string id, Element element, int hp, int atk, Team team,
            string templateId = null, int tier = 1)
        {
            var unit = CombatUnit.Create(id, id, element, hp, atk, 5, 10, team);
            unit.Position = new GridPosition(team == Team.Player ? 0 : 2, 0);
            unit.AbilityTemplateId = templateId;
            unit.Tier = tier;
            return unit;
        }

        [Test]
        public void DotSpreader_DealsAoeDamage()
        {
            var caster = MakeUnit("cinder_archer", Element.Fire, 500, 50, Team.Player,
                "dot_spreader");
            var enemy1 = MakeUnit("e1", Element.Water, 500, 10, Team.Enemy);
            var enemy2 = MakeUnit("e2", Element.Water, 500, 10, Team.Enemy);
            enemy1.Position = new GridPosition(2, 0);
            enemy2.Position = new GridPosition(2, 1);

            var template = AbilityTemplateCatalog.Get("dot_spreader");
            var result = template.ExecuteAbility(caster, enemy1,
                new List<CombatUnit> { enemy1, enemy2 },
                new List<CombatUnit> { caster },
                new GridSystem(), new Random(42));

            Assert.IsTrue(result.TotalDamage > 0);
            Assert.IsTrue(result.DamageInstances.Count >= 1);
        }

        [Test]
        public void HealAndHarm_HealsAllyAndDamagesEnemies()
        {
            var caster = MakeUnit("fire_acolyte", Element.Fire, 500, 50, Team.Player,
                "heal_and_harm");
            caster.UnitType = "healer";
            var ally = MakeUnit("ally1", Element.Fire, 300, 20, Team.Player);
            ally.CurrentHP = 100; // damaged
            var enemy = MakeUnit("e1", Element.Water, 500, 10, Team.Enemy);
            enemy.Position = new GridPosition(2, 0);

            var template = AbilityTemplateCatalog.Get("heal_and_harm");
            var result = template.ExecuteAbility(caster, enemy,
                new List<CombatUnit> { enemy },
                new List<CombatUnit> { caster, ally },
                new GridSystem(), new Random(42));

            Assert.IsTrue(result.TotalHealing > 0, "Should heal ally");
            Assert.IsTrue(result.TotalDamage > 0, "Should damage enemies");
            Assert.IsTrue(ally.CurrentHP > 100, "Ally HP should increase");
        }

        [Test]
        public void ExecuteStriker_GuaranteedCrit_Below40Percent()
        {
            var caster = MakeUnit("flame_warrior", Element.Fire, 500, 50, Team.Player,
                "execute_striker");
            var target = MakeUnit("e1", Element.Water, 1000, 10, Team.Enemy);
            target.CurrentHP = 300; // 30% HP — below 40%
            target.Position = new GridPosition(2, 0);
            int hpBefore = target.CurrentHP;

            var template = AbilityTemplateCatalog.Get("execute_striker");
            var result = template.ExecuteAbility(caster, target,
                new List<CombatUnit> { target },
                new List<CombatUnit> { caster },
                new GridSystem(), new Random(42));

            Assert.IsTrue(result.TotalDamage > 0);
            // Should do extra damage due to forced crit
            Assert.IsTrue(result.DamageInstances[0].IsCrit,
                "Should be a guaranteed crit on low HP target");
        }

        [Test]
        public void ExecuteStriker_RefundsManaOnKill()
        {
            var caster = MakeUnit("flame_warrior", Element.Fire, 500, 200, Team.Player,
                "execute_striker");
            caster.Mana = 0;
            caster.MaxMana = 100;
            var target = MakeUnit("e1", Element.Water, 50, 10, Team.Enemy);
            target.CurrentHP = 10; // will die
            target.Position = new GridPosition(2, 0);

            var template = AbilityTemplateCatalog.Get("execute_striker");
            var result = template.ExecuteAbility(caster, target,
                new List<CombatUnit> { target },
                new List<CombatUnit> { caster },
                new GridSystem(), new Random(42));

            Assert.IsFalse(target.IsAlive, "Target should be dead");
            Assert.IsTrue(result.ManaRefunded, "Should refund mana on kill");
            Assert.AreEqual(30, result.ManaRefundAmount);
        }

        [Test]
        public void ShieldStacker_GrantsShieldToSelfAndAllies()
        {
            var caster = MakeUnit("shell_knight", Element.Earth, 1000, 30, Team.Player,
                "shield_stacker");
            var ally = MakeUnit("ally1", Element.Earth, 500, 20, Team.Player);
            ally.Position = new GridPosition(0, 1);

            var template = AbilityTemplateCatalog.Get("shield_stacker");
            var result = template.ExecuteAbility(caster, null,
                new List<CombatUnit>(),
                new List<CombatUnit> { caster, ally },
                new GridSystem(), new Random(42));

            Assert.IsTrue(result.TotalShielding > 0, "Should grant shields");
            Assert.IsTrue(caster.Shield > 0, "Caster should have shield");
            Assert.IsTrue(ally.Shield > 0, "Ally should have shield");
        }

        [Test]
        public void MultiStriker_Hits5Times()
        {
            var caster = MakeUnit("wind_duelist", Element.Wind, 500, 40, Team.Player,
                "multi_striker");
            var target = MakeUnit("e1", Element.Earth, 5000, 10, Team.Enemy);
            target.Position = new GridPosition(2, 0);

            var template = AbilityTemplateCatalog.Get("multi_striker");
            var result = template.ExecuteAbility(caster, target,
                new List<CombatUnit> { target },
                new List<CombatUnit> { caster },
                new GridSystem(), new Random(42));

            Assert.AreEqual(5, result.DamageInstances.Count,
                "Multi Striker should hit 5 times");
        }

        [Test]
        public void Bodyguard_ShieldsLowestAllyAndTaunts()
        {
            var caster = MakeUnit("guardian", Element.Force, 1000, 30, Team.Player,
                "bodyguard");
            var ally = MakeUnit("squishy", Element.Wind, 300, 50, Team.Player);
            ally.CurrentHP = 100;
            ally.Position = new GridPosition(0, 1);

            var template = AbilityTemplateCatalog.Get("bodyguard");
            var result = template.ExecuteAbility(caster, null,
                new List<CombatUnit>(),
                new List<CombatUnit> { caster, ally },
                new GridSystem(), new Random(42));

            Assert.IsTrue(ally.Shield > 0, "Should shield lowest ally");
            Assert.IsTrue(caster.IsTaunting, "Should taunt");
        }

        // ── Element skinning test ─────────────────────────────────────────

        [Test]
        public void ElementStatusMap_FireHasBurn()
        {
            var dot = ElementStatusMap.GetDotType(Element.Fire);
            Assert.AreEqual(StatusEffectType.Burn, dot);
        }

        [Test]
        public void ElementStatusMap_WaterHasFreeze()
        {
            var cc = ElementStatusMap.GetCCType(Element.Water);
            Assert.AreEqual(StatusEffectType.Freeze, cc);
        }

        [Test]
        public void ElementStatusMap_EarthHasRoot()
        {
            var cc = ElementStatusMap.GetCCType(Element.Earth);
            Assert.AreEqual(StatusEffectType.Root, cc);
        }

        [Test]
        public void ElementStatusMap_ForceHasVulnerability()
        {
            var debuff = ElementStatusMap.GetDebuffType(Element.Force);
            Assert.AreEqual(StatusEffectType.Vulnerability, debuff);
        }

        [Test]
        public void ElementStatusMap_WindHasSilence()
        {
            var cc = ElementStatusMap.GetCCType(Element.Wind);
            Assert.AreEqual(StatusEffectType.Silence, cc);
        }

        [Test]
        public void ElementStatusMap_LightningHasStun()
        {
            var cc = ElementStatusMap.GetCCType(Element.Lightning);
            Assert.AreEqual(StatusEffectType.Stun, cc);
        }
    }
}

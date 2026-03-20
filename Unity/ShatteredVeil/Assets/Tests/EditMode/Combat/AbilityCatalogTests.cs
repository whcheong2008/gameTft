using NUnit.Framework;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Tests.EditMode.Combat
{
    [TestFixture]
    public class AbilityCatalogTests
    {
        [Test]
        public void CatalogContains132Abilities()
        {
            Assert.AreEqual(132, AbilityCatalog.Count);
        }

        [Test]
        public void AllAbilitiesHaveId()
        {
            var all = AbilityCatalog.GetAll();
            foreach (var kvp in all)
            {
                Assert.IsNotNull(kvp.Value.Id, $"Ability at key '{kvp.Key}' has null Id");
                Assert.IsNotEmpty(kvp.Value.Id, $"Ability at key '{kvp.Key}' has empty Id");
                Assert.AreEqual(kvp.Key, kvp.Value.Id, $"Key '{kvp.Key}' doesn't match Id '{kvp.Value.Id}'");
            }
        }

        [Test]
        public void AllAbilitiesHaveName()
        {
            var all = AbilityCatalog.GetAll();
            foreach (var kvp in all)
            {
                Assert.IsNotNull(kvp.Value.Name, $"Ability '{kvp.Key}' has null Name");
                Assert.IsNotEmpty(kvp.Value.Name, $"Ability '{kvp.Key}' has empty Name");
            }
        }

        [Test]
        public void AllAbilitiesHaveDescription()
        {
            var all = AbilityCatalog.GetAll();
            foreach (var kvp in all)
            {
                Assert.IsNotNull(kvp.Value.Description, $"Ability '{kvp.Key}' has null Description");
                Assert.IsNotEmpty(kvp.Value.Description, $"Ability '{kvp.Key}' has empty Description");
            }
        }

        [Test]
        public void AllAbilitiesHaveSpecialParams()
        {
            var all = AbilityCatalog.GetAll();
            foreach (var kvp in all)
            {
                Assert.IsNotNull(kvp.Value.SpecialParams, $"Ability '{kvp.Key}' has null SpecialParams");
            }
        }

        // --- Spot checks: 2 per element (12 total) ---

        [Test]
        public void SpotCheck_FlameWarrior()
        {
            var a = AbilityCatalog.Get("flame_warrior");
            Assert.IsNotNull(a);
            Assert.AreEqual("Blade Inferno", a.Name);
            Assert.AreEqual(1.5f, a.DamageMultiplier, 0.01f);
            Assert.AreEqual(TargetingRule.Nearest, a.Targeting);
            Assert.IsTrue(a.HasFlag(AbilityFlag.ConditionBonus));
            Assert.IsTrue(a.HasFlag(AbilityFlag.ManaRefund));
            Assert.AreEqual(AbilityType.Active, a.Type);
        }

        [Test]
        public void SpotCheck_Phoenix()
        {
            var a = AbilityCatalog.Get("phoenix");
            Assert.IsNotNull(a);
            Assert.AreEqual("Rebirth Flame", a.Name);
            Assert.AreEqual(AbilityType.PassiveCast, a.Type);
            Assert.AreEqual(TargetingRule.Self, a.Targeting);
            Assert.IsTrue(a.HasFlag(AbilityFlag.Revive));
            Assert.IsTrue(a.SpecialParams.ContainsKey("toggleInterval"));
            Assert.AreEqual(7f, a.SpecialParams["toggleInterval"], 0.01f);
        }

        [Test]
        public void SpotCheck_TideHunter()
        {
            var a = AbilityCatalog.Get("tide_hunter");
            Assert.IsNotNull(a);
            Assert.AreEqual("Tidal Pull", a.Name);
            Assert.AreEqual(1.0f, a.DamageMultiplier, 0.01f);
            Assert.AreEqual(2, a.AreaRadius);
            Assert.IsTrue(a.HasFlag(AbilityFlag.Slow));
            Assert.IsTrue(a.HasFlag(AbilityFlag.AreaDamage));
        }

        [Test]
        public void SpotCheck_ShellKnight()
        {
            var a = AbilityCatalog.Get("shell_knight");
            Assert.IsNotNull(a);
            Assert.AreEqual("Shelled Stance", a.Name);
            Assert.AreEqual(TargetingRule.Self, a.Targeting);
            Assert.IsTrue(a.HasFlag(AbilityFlag.Shield));
            Assert.AreEqual(0.4f, a.SpecialParams["selfShieldPct"], 0.01f);
        }

        [Test]
        public void SpotCheck_StoneGuard()
        {
            var a = AbilityCatalog.Get("stone_guard");
            Assert.IsNotNull(a);
            Assert.AreEqual("Stone Barrier", a.Name);
            Assert.IsTrue(a.HasFlag(AbilityFlag.Shield));
            Assert.AreEqual(0.4f, a.SpecialParams["selfShieldPct"], 0.01f);
            Assert.AreEqual(0.2f, a.SpecialParams["allyShieldPct"], 0.01f);
        }

        [Test]
        public void SpotCheck_WorldTree()
        {
            var a = AbilityCatalog.Get("world_tree");
            Assert.IsNotNull(a);
            Assert.AreEqual("Bloom of Life", a.Name);
            Assert.AreEqual(AbilityType.PassiveCast, a.Type);
            Assert.IsTrue(a.HasFlag(AbilityFlag.Summon));
            Assert.IsTrue(a.HasFlag(AbilityFlag.Heal));
        }

        [Test]
        public void SpotCheck_ZephyrScout()
        {
            var a = AbilityCatalog.Get("zephyr_scout");
            Assert.IsNotNull(a);
            Assert.AreEqual("Swift Slash", a.Name);
            Assert.AreEqual(1.8f, a.DamageMultiplier, 0.01f);
            Assert.IsTrue(a.HasFlag(AbilityFlag.Dash));
            Assert.AreEqual(1f, a.SpecialParams["resetOnKill"], 0.01f);
        }

        [Test]
        public void SpotCheck_VoidWyrm()
        {
            var a = AbilityCatalog.Get("void_wyrm");
            Assert.IsNotNull(a);
            Assert.AreEqual("Dimensional Rift", a.Name);
            Assert.AreEqual(AbilityType.PassiveCast, a.Type);
            Assert.AreEqual(15f, a.SpecialParams["manaDrain"], 0.01f);
        }

        [Test]
        public void SpotCheck_ThunderArcher()
        {
            var a = AbilityCatalog.Get("thunder_archer");
            Assert.IsNotNull(a);
            Assert.AreEqual("Lightning Arrow", a.Name);
            Assert.AreEqual(2.2f, a.DamageMultiplier, 0.01f);
            Assert.AreEqual(2, a.AreaRadius);
            Assert.IsTrue(a.HasFlag(AbilityFlag.Stun));
            Assert.AreEqual(0.5f, a.SpecialParams["firstCastBonus"], 0.01f);
        }

        [Test]
        public void SpotCheck_StormDragon()
        {
            var a = AbilityCatalog.Get("storm_dragon");
            Assert.IsNotNull(a);
            Assert.AreEqual("Cataclysmic Storm", a.Name);
            Assert.AreEqual(AbilityType.PassiveCast, a.Type);
            Assert.AreEqual(0.35f, a.SpecialParams["auraCritBonus"], 0.01f);
        }

        [Test]
        public void SpotCheck_IronSoldier()
        {
            var a = AbilityCatalog.Get("iron_soldier");
            Assert.IsNotNull(a);
            Assert.AreEqual("Power Strike", a.Name);
            Assert.AreEqual(TargetingRule.Self, a.Targeting);
            Assert.IsTrue(a.HasFlag(AbilityFlag.SelfBuff));
            Assert.AreEqual(0.5f, a.SpecialParams["atkSpdBuff"], 0.01f);
        }

        [Test]
        public void SpotCheck_ShadowBlade()
        {
            var a = AbilityCatalog.Get("shadow_blade");
            Assert.IsNotNull(a);
            Assert.AreEqual("Killing Blow", a.Name);
            Assert.AreEqual(1.5f, a.DamageMultiplier, 0.01f);
            Assert.IsTrue(a.HasFlag(AbilityFlag.ConditionBonus));
            Assert.IsTrue(a.HasFlag(AbilityFlag.ManaRefund));
            Assert.AreEqual(0.4f, a.SpecialParams["lowHpThreshold"], 0.01f);
        }

        [Test]
        public void GetNonexistentAbility_ReturnsNull()
        {
            Assert.IsNull(AbilityCatalog.Get("nonexistent_ability"));
        }

        [Test]
        public void Contains_ReturnsTrueForExisting()
        {
            Assert.IsTrue(AbilityCatalog.Contains("flame_warrior"));
            Assert.IsTrue(AbilityCatalog.Contains("cosmic_titan"));
        }

        [Test]
        public void Contains_ReturnsFalseForNonexistent()
        {
            Assert.IsFalse(AbilityCatalog.Contains("fake_unit"));
        }

        [Test]
        public void AllT5Legendaries_ArePassiveCast()
        {
            var legendaries = new[]
            {
                "phoenix", "leviathan", "world_tree", "void_wyrm", "storm_dragon", "titan_lord",
                "eternal_phoenix", "primordial_leviathan", "yggdrasil", "dimensional_dragon", "thunder_god", "cosmic_titan"
            };
            foreach (var id in legendaries)
            {
                var a = AbilityCatalog.Get(id);
                Assert.IsNotNull(a, $"Legendary '{id}' not found");
                Assert.AreEqual(AbilityType.PassiveCast, a.Type, $"Legendary '{id}' should be PassiveCast");
            }
        }
    }
}

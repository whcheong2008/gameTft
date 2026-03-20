using System.Reflection;
using NUnit.Framework;
using UnityEngine;
using ShatteredVeil.Core.Combat;
using ShatteredVeil.Data;

namespace ShatteredVeil.Tests.EditMode.Units
{
    /// <summary>
    /// Verifies UnitTemplate ScriptableObjects are aligned with the v2 ability
    /// architecture (Prompt 45). No abilityId/passiveId fields, all units have
    /// unitType and abilityTemplate, and UnitAbilityCatalog covers every unit.
    /// </summary>
    public class UnitTemplateV2AlignmentTests
    {
        private static readonly string[] ValidElements =
            { "fire", "water", "earth", "wind", "lightning", "force" };

        private static readonly string[] ValidUnitTypes =
            { "warrior", "healer", "tank", "assassin", "mage", "archer" };

        private static readonly string[] ValidArchetypes =
            { "guardian", "warden", "vanguard", "duelist", "predator",
              "ranger", "sorcerer", "mystic", "sage" };

        // ----------------------------------------------------------------
        // 1. UnitTemplate does NOT have abilityId or passiveId fields
        // ----------------------------------------------------------------
        [Test]
        public void UnitTemplate_DoesNotHave_AbilityIdField()
        {
            var field = typeof(UnitTemplate).GetField("abilityId",
                BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
            Assert.IsNull(field,
                "UnitTemplate should NOT have an 'abilityId' field — abilities dispatch via UnitAbilityCatalog.Get(unitId)");
        }

        [Test]
        public void UnitTemplate_DoesNotHave_PassiveIdField()
        {
            var field = typeof(UnitTemplate).GetField("passiveId",
                BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
            Assert.IsNull(field,
                "UnitTemplate should NOT have a 'passiveId' field — passives are element synergy effects or embedded in unit abilities");
        }

        // ----------------------------------------------------------------
        // 2. UnitTemplate HAS the required v2 fields
        // ----------------------------------------------------------------
        [Test]
        public void UnitTemplate_Has_UnitTypeField()
        {
            var field = typeof(UnitTemplate).GetField("unitType",
                BindingFlags.Public | BindingFlags.Instance);
            Assert.IsNotNull(field,
                "UnitTemplate must have a public 'unitType' field for healer detection in combat");
            Assert.AreEqual(typeof(string), field.FieldType);
        }

        [Test]
        public void UnitTemplate_Has_AbilityTemplateField()
        {
            var field = typeof(UnitTemplate).GetField("abilityTemplate",
                BindingFlags.Public | BindingFlags.Instance);
            Assert.IsNotNull(field,
                "UnitTemplate must have a public 'abilityTemplate' field for UI classification");
            Assert.AreEqual(typeof(string), field.FieldType);
        }

        [Test]
        public void UnitTemplate_Has_UnitIdField()
        {
            var field = typeof(UnitTemplate).GetField("unitId",
                BindingFlags.Public | BindingFlags.Instance);
            Assert.IsNotNull(field,
                "UnitTemplate must have a public 'unitId' field for ability catalog lookup");
            Assert.AreEqual(typeof(string), field.FieldType);
        }

        // ----------------------------------------------------------------
        // 3. All loaded UnitTemplate assets have valid data
        // ----------------------------------------------------------------
        [Test]
        public void AllUnitTemplates_Have_NonEmpty_UnitType()
        {
            var templates = Resources.LoadAll<UnitTemplate>("Units");
            Assert.IsTrue(templates.Length > 0,
                "No UnitTemplate assets found in Resources/Units/. Run ShatteredVeil > Import Unit Data from Unity Editor.");

            foreach (var t in templates)
            {
                Assert.IsFalse(string.IsNullOrEmpty(t.unitType),
                    $"UnitTemplate '{t.unitId}' has empty unitType");
                Assert.Contains(t.unitType, ValidUnitTypes,
                    $"UnitTemplate '{t.unitId}' has invalid unitType '{t.unitType}'");
            }
        }

        [Test]
        public void AllUnitTemplates_Have_NonEmpty_AbilityTemplate()
        {
            var templates = Resources.LoadAll<UnitTemplate>("Units");
            Assert.IsTrue(templates.Length > 0,
                "No UnitTemplate assets found in Resources/Units/. Run ShatteredVeil > Import Unit Data from Unity Editor.");

            foreach (var t in templates)
            {
                Assert.IsFalse(string.IsNullOrEmpty(t.abilityTemplate),
                    $"UnitTemplate '{t.unitId}' has empty abilityTemplate");
            }
        }

        [Test]
        public void AllUnitTemplates_Have_ValidElement()
        {
            var templates = Resources.LoadAll<UnitTemplate>("Units");
            Assert.IsTrue(templates.Length > 0,
                "No UnitTemplate assets found in Resources/Units/.");

            foreach (var t in templates)
            {
                Assert.Contains(t.element, ValidElements,
                    $"UnitTemplate '{t.unitId}' has invalid element '{t.element}'");
            }
        }

        [Test]
        public void AllUnitTemplates_Have_ValidArchetype()
        {
            var templates = Resources.LoadAll<UnitTemplate>("Units");
            Assert.IsTrue(templates.Length > 0,
                "No UnitTemplate assets found in Resources/Units/.");

            foreach (var t in templates)
            {
                Assert.Contains(t.archetype, ValidArchetypes,
                    $"UnitTemplate '{t.unitId}' has invalid archetype '{t.archetype}'");
            }
        }

        // ----------------------------------------------------------------
        // 4. UnitAbilityCatalog covers every unit in the SO database
        // ----------------------------------------------------------------
        [Test]
        public void UnitAbilityCatalog_Covers_AllUnitTemplates()
        {
            var templates = Resources.LoadAll<UnitTemplate>("Units");
            Assert.IsTrue(templates.Length > 0,
                "No UnitTemplate assets found in Resources/Units/.");

            foreach (var t in templates)
            {
                var ability = UnitAbilityCatalog.Get(t.unitId);
                Assert.IsNotNull(ability,
                    $"UnitAbilityCatalog.Get(\"{t.unitId}\") returned null — unit not registered in catalog");
            }
        }

        // ----------------------------------------------------------------
        // 5. Expected unit count
        // ----------------------------------------------------------------
        [Test]
        public void UnitTemplates_Total_132()
        {
            var templates = Resources.LoadAll<UnitTemplate>("Units");
            Assert.AreEqual(132, templates.Length,
                $"Expected 132 UnitTemplate assets (66 base + 66 evolved), found {templates.Length}");
        }

        // ----------------------------------------------------------------
        // 6. Stat sanity checks (sample units)
        // ----------------------------------------------------------------
        [Test]
        public void SampleUnit_FlameWarrior_StatsMatch()
        {
            var t = LoadUnit("flame_warrior");
            if (t == null) return;
            Assert.AreEqual(600, t.baseHP, "Flame Warrior HP mismatch");
            Assert.AreEqual(50, t.baseATK, "Flame Warrior ATK mismatch");
            Assert.AreEqual(0.85f, t.attackSpeed, 0.01f, "Flame Warrior attack speed mismatch");
            Assert.AreEqual(1f, t.attackRange, 0.01f, "Flame Warrior range mismatch");
            Assert.AreEqual(65, t.maxMana, "Flame Warrior maxMana mismatch");
            Assert.AreEqual(1, t.tier, "Flame Warrior tier mismatch");
            Assert.AreEqual("fire", t.element);
            Assert.AreEqual("warrior", t.unitType);
            Assert.AreEqual("execute_striker", t.abilityTemplate);
        }

        [Test]
        public void SampleUnit_Phoenix_StatsMatch()
        {
            var t = LoadUnit("phoenix");
            if (t == null) return;
            Assert.AreEqual(1425, t.baseHP, "Phoenix HP mismatch");
            Assert.AreEqual(206, t.baseATK, "Phoenix ATK mismatch");
            Assert.AreEqual(0, t.maxMana, "Phoenix maxMana should be 0 (T5 passive)");
            Assert.AreEqual(5, t.tier, "Phoenix tier mismatch");
            Assert.AreEqual("transformer", t.abilityTemplate);
        }

        [Test]
        public void SampleUnit_Leviathan_StatsMatch()
        {
            var t = LoadUnit("leviathan");
            if (t == null) return;
            Assert.AreEqual(2610, t.baseHP, "Leviathan HP mismatch");
            Assert.AreEqual(69, t.baseATK, "Leviathan ATK mismatch");
            Assert.AreEqual(0, t.maxMana, "Leviathan maxMana should be 0 (T5 passive)");
            Assert.AreEqual("tank", t.unitType);
        }

        [Test]
        public void SampleUnit_StoneGuard_StatsMatch()
        {
            var t = LoadUnit("stone_guard");
            if (t == null) return;
            Assert.AreEqual(750, t.baseHP, "Stone Guard HP mismatch");
            Assert.AreEqual(32, t.baseATK, "Stone Guard ATK mismatch");
            Assert.AreEqual("shield_stacker", t.abilityTemplate);
        }

        [Test]
        public void SampleUnit_ZephyrScout_StatsMatch()
        {
            var t = LoadUnit("zephyr_scout");
            if (t == null) return;
            Assert.AreEqual(395, t.baseHP, "Zephyr Scout HP mismatch");
            Assert.AreEqual(46, t.baseATK, "Zephyr Scout ATK mismatch");
            Assert.AreEqual("chain_killer", t.abilityTemplate);
        }

        [Test]
        public void SampleUnit_SparkFencer_StatsMatch()
        {
            var t = LoadUnit("spark_fencer");
            if (t == null) return;
            Assert.AreEqual(620, t.baseHP, "Spark Fencer HP mismatch");
            Assert.AreEqual(50, t.baseATK, "Spark Fencer ATK mismatch");
            Assert.AreEqual("dot_detonator", t.abilityTemplate);
        }

        [Test]
        public void SampleUnit_IronSoldier_StatsMatch()
        {
            var t = LoadUnit("iron_soldier");
            if (t == null) return;
            Assert.AreEqual(630, t.baseHP, "Iron Soldier HP mismatch");
            Assert.AreEqual(44, t.baseATK, "Iron Soldier ATK mismatch");
            Assert.AreEqual("ramping_attacker", t.abilityTemplate);
        }

        // ----------------------------------------------------------------
        // Helpers
        // ----------------------------------------------------------------
        private UnitTemplate LoadUnit(string unitId)
        {
            var templates = Resources.LoadAll<UnitTemplate>("Units");
            foreach (var t in templates)
            {
                if (t.unitId == unitId) return t;
            }
            Assert.Inconclusive($"Unit '{unitId}' not found in Resources/Units/ — run asset importer first");
            return null;
        }
    }
}

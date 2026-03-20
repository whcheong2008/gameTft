using NUnit.Framework;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Tests.EditMode.Combat
{
    [TestFixture]
    public class PassiveCatalogTests
    {
        [Test]
        public void AllPassivesPresent_Count132()
        {
            // 66 base + 66 evolved = 132 passives
            Assert.AreEqual(132, PassiveCatalog.Count,
                "Expected 132 passives (66 base + 66 evolved)");
        }

        [Test]
        public void FirePassive_FlameWarrior_OnAttack()
        {
            var passive = PassiveCatalog.Get("flame_warrior");
            Assert.IsNotNull(passive);
            Assert.AreEqual(PassiveTrigger.OnAttack, passive.Trigger);
            Assert.AreEqual(3f, passive.GetParam("interval"));
            Assert.AreEqual(0.25f, passive.GetParam("bonusDamagePct"), 0.001f);
        }

        [Test]
        public void WaterPassive_Leviathan_OnHit()
        {
            var passive = PassiveCatalog.Get("leviathan");
            Assert.IsNotNull(passive);
            Assert.AreEqual(PassiveTrigger.OnHit, passive.Trigger);
            Assert.AreEqual(0.30f, passive.GetParam("drBoost"), 0.001f);
            Assert.AreEqual(0.50f, passive.GetParam("drBoostThreshold"), 0.001f);
        }

        [Test]
        public void EarthPassive_WorldTree_Periodic()
        {
            var passive = PassiveCatalog.Get("world_tree");
            Assert.IsNotNull(passive);
            Assert.AreEqual(PassiveTrigger.Periodic, passive.Trigger);
            Assert.AreEqual(10f, passive.GetParam("interval"));
            Assert.AreEqual(0.20f, passive.GetParam("healPct"), 0.001f);
        }

        [Test]
        public void WindPassive_AegisPaladin_CombatStart()
        {
            var passive = PassiveCatalog.Get("aegis_paladin");
            Assert.IsNotNull(passive);
            Assert.AreEqual(PassiveTrigger.CombatStart, passive.Trigger);
            Assert.AreEqual(100f, passive.GetParam("allyShield"));
        }

        [Test]
        public void LightningPassive_StormDragon_Aura()
        {
            var passive = PassiveCatalog.Get("storm_dragon");
            Assert.IsNotNull(passive);
            Assert.AreEqual(PassiveTrigger.Aura, passive.Trigger);
            Assert.AreEqual(0.35f, passive.GetParam("critAuraBonus"), 0.001f);
            Assert.AreEqual(6f, passive.GetParam("strikeInterval"));
        }

        [Test]
        public void ForcePassive_ShadowBlade_OnAttack_Execute()
        {
            var passive = PassiveCatalog.Get("shadow_blade");
            Assert.IsNotNull(passive);
            Assert.AreEqual(PassiveTrigger.OnAttack, passive.Trigger);
            Assert.AreEqual(0.40f, passive.GetParam("executeThreshold"), 0.001f);
            Assert.AreEqual(0.50f, passive.GetParam("executeBonusDmg"), 0.001f);
        }

        [Test]
        public void EvolvedPassive_OceanSage_OnHeal()
        {
            var passive = PassiveCatalog.Get("ocean_sage");
            Assert.IsNotNull(passive);
            Assert.AreEqual(PassiveTrigger.OnHeal, passive.Trigger);
            Assert.AreEqual(50f, passive.GetParam("bonusShield"));
        }

        [Test]
        public void EvolvedPassive_VolcanoTitan_DeathAoE()
        {
            var passive = PassiveCatalog.Get("volcano_titan");
            Assert.IsNotNull(passive);
            Assert.AreEqual(PassiveTrigger.OnHit, passive.Trigger);
            Assert.AreEqual(200f, passive.GetParam("deathAoeDamage"));
            Assert.AreEqual(2f, passive.GetParam("deathAoeRange"));
        }

        [Test]
        public void EvolvedPassive_ThunderGod_Aura()
        {
            var passive = PassiveCatalog.Get("thunder_god");
            Assert.IsNotNull(passive);
            Assert.AreEqual(PassiveTrigger.Aura, passive.Trigger);
            Assert.AreEqual(0.50f, passive.GetParam("critAuraBonus"), 0.001f);
        }

        [Test]
        public void AllPassivesHaveValidTrigger()
        {
            var all = PassiveCatalog.GetAll();
            foreach (var kvp in all)
            {
                Assert.IsNotNull(kvp.Value.Id, "Passive has null Id");
                Assert.IsNotNull(kvp.Value.Name, "Passive " + kvp.Key + " has null Name");
                Assert.IsNotNull(kvp.Value.Params, "Passive " + kvp.Key + " has null Params");
                Assert.IsTrue(
                    kvp.Value.Trigger == PassiveTrigger.OnAttack ||
                    kvp.Value.Trigger == PassiveTrigger.OnHit ||
                    kvp.Value.Trigger == PassiveTrigger.CombatStart ||
                    kvp.Value.Trigger == PassiveTrigger.Aura ||
                    kvp.Value.Trigger == PassiveTrigger.Periodic ||
                    kvp.Value.Trigger == PassiveTrigger.OnHeal,
                    "Passive " + kvp.Key + " has invalid trigger"
                );
            }
        }
    }
}

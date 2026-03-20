using NUnit.Framework;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Tests.EditMode.Combat
{
    [TestFixture]
    public class StatusEffectSystemTests
    {
        private StatusEffectSystem _system;
        private CombatUnit _unit;
        private CombatUnit _source;

        [SetUp]
        public void SetUp()
        {
            _system = new StatusEffectSystem();
            _unit = CombatUnit.Create("test1", "Target", Element.Fire, 1000, 100, 10, 50, Team.Player);
            _source = CombatUnit.Create("test2", "Source", Element.Water, 1000, 100, 10, 50, Team.Enemy);
        }

        // --- DoT Tests ---

        [Test]
        public void Burn_TicksCorrectDPS()
        {
            var burn = new StatusEffect(StatusEffectType.Burn, 3.0f, 20f);
            _system.ApplyEffect(_unit, burn);

            // Tick 1 second — should deal 20 damage
            var results = _system.TickEffects(_unit, 1.0f);
            Assert.AreEqual(980, _unit.CurrentHP);
            Assert.IsTrue(results.Exists(r => r.Type == StatusEffectType.Burn && r.DamageDealt == 20f));
        }

        [Test]
        public void Burn_DoesNotTickBeforeInterval()
        {
            var burn = new StatusEffect(StatusEffectType.Burn, 3.0f, 20f);
            _system.ApplyEffect(_unit, burn);

            // Tick 0.5s — should NOT deal damage yet
            _system.TickEffects(_unit, 0.5f);
            Assert.AreEqual(1000, _unit.CurrentHP);
        }

        [Test]
        public void DoT_StacksUpToThree()
        {
            _system.ApplyEffect(_unit, new StatusEffect(StatusEffectType.Burn, 3.0f, 10f));
            _system.ApplyEffect(_unit, new StatusEffect(StatusEffectType.Burn, 3.0f, 15f));
            _system.ApplyEffect(_unit, new StatusEffect(StatusEffectType.Burn, 3.0f, 20f));

            // All three should be active
            Assert.AreEqual(45f, _system.GetEffectValue(_unit, StatusEffectType.Burn));

            // 4th should refresh duration, not add
            _system.ApplyEffect(_unit, new StatusEffect(StatusEffectType.Burn, 5.0f, 25f));
            Assert.AreEqual(45f, _system.GetEffectValue(_unit, StatusEffectType.Burn));
        }

        [Test]
        public void DoT_KillsUnit()
        {
            _unit.CurrentHP = 15;
            var burn = new StatusEffect(StatusEffectType.Burn, 3.0f, 20f);
            _system.ApplyEffect(_unit, burn);

            _system.TickEffects(_unit, 1.0f);
            Assert.AreEqual(0, _unit.CurrentHP);
            Assert.IsFalse(_unit.IsAlive);
        }

        // --- CC Tests ---

        [Test]
        public void Stun_SetsIsStunnedFlag()
        {
            var stun = new StatusEffect(StatusEffectType.Stun, 2.0f, 0f);
            _system.ApplyEffect(_unit, stun);
            Assert.IsTrue(_unit.IsStunned);
        }

        [Test]
        public void Freeze_SetsIsFrozenFlag()
        {
            var freeze = new StatusEffect(StatusEffectType.Freeze, 2.0f, 0f);
            _system.ApplyEffect(_unit, freeze);
            Assert.IsTrue(_unit.IsFrozen);
        }

        [Test]
        public void Silence_SetsIsSilencedFlag()
        {
            var silence = new StatusEffect(StatusEffectType.Silence, 2.0f, 0f);
            _system.ApplyEffect(_unit, silence);
            Assert.IsTrue(_unit.IsSilenced);
        }

        [Test]
        public void Stun_ExpiresAfterDuration()
        {
            var stun = new StatusEffect(StatusEffectType.Stun, 1.0f, 0f);
            _system.ApplyEffect(_unit, stun);
            Assert.IsTrue(_unit.IsStunned);

            _system.TickEffects(_unit, 1.1f);
            Assert.IsFalse(_unit.IsStunned);
        }

        [Test]
        public void Root_DoesNotSetStunOrFreeze()
        {
            var root = new StatusEffect(StatusEffectType.Root, 2.0f, 0f);
            _system.ApplyEffect(_unit, root);
            Assert.IsFalse(_unit.IsStunned);
            Assert.IsFalse(_unit.IsFrozen);
            Assert.IsTrue(_system.HasEffect(_unit, StatusEffectType.Root));
        }

        [Test]
        public void Slow_IsTrackedAsEffect()
        {
            var slow = new StatusEffect(StatusEffectType.Slow, 2.0f, 0.15f);
            _system.ApplyEffect(_unit, slow);
            Assert.AreEqual(0.15f, _system.GetEffectValue(_unit, StatusEffectType.Slow), 0.001f);
        }

        // --- Buff Tests ---

        [Test]
        public void Shield_AbsorbsAllDamage()
        {
            var shield = new StatusEffect(StatusEffectType.Shield, 10f, 100f);
            _system.ApplyEffect(_unit, shield);

            // 100 shield absorbs all 60 damage, 0 goes through
            float remaining = _system.AbsorbDamage(_unit, 60f);
            Assert.AreEqual(0f, remaining, 0.001f);
        }

        [Test]
        public void Shield_PartialAbsorption()
        {
            // 50 shield, 80 damage → 30 goes through
            var shield = new StatusEffect(StatusEffectType.Shield, 10f, 50f);
            _system.ApplyEffect(_unit, shield);

            float remaining = _system.AbsorbDamage(_unit, 80f);
            Assert.AreEqual(30f, remaining, 0.001f);
        }

        [Test]
        public void Shield_FullyDepleted_IsRemoved()
        {
            var shield = new StatusEffect(StatusEffectType.Shield, 10f, 50f);
            _system.ApplyEffect(_unit, shield);

            _system.AbsorbDamage(_unit, 50f);
            Assert.IsFalse(_system.HasEffect(_unit, StatusEffectType.Shield));
        }

        [Test]
        public void Shield_MultipleStacksAdditive()
        {
            _system.ApplyEffect(_unit, new StatusEffect(StatusEffectType.Shield, 10f, 50f));
            _system.ApplyEffect(_unit, new StatusEffect(StatusEffectType.Shield, 10f, 30f));

            float remaining = _system.AbsorbDamage(_unit, 70f);
            Assert.AreEqual(0f, remaining, 0.001f);
        }

        [Test]
        public void Regen_HealsOverTime()
        {
            _unit.CurrentHP = 800;
            var regen = new StatusEffect(StatusEffectType.Regen, 5.0f, 50f);
            _system.ApplyEffect(_unit, regen);

            _system.TickEffects(_unit, 1.0f);
            Assert.AreEqual(850, _unit.CurrentHP);
        }

        [Test]
        public void Regen_DoesNotExceedMaxHP()
        {
            _unit.CurrentHP = 990;
            var regen = new StatusEffect(StatusEffectType.Regen, 5.0f, 50f);
            _system.ApplyEffect(_unit, regen);

            _system.TickEffects(_unit, 1.0f);
            Assert.AreEqual(1000, _unit.CurrentHP);
        }

        [Test]
        public void Dodge_HighestValueWins()
        {
            _system.ApplyEffect(_unit, new StatusEffect(StatusEffectType.Dodge, 3f, 0.15f));
            _system.ApplyEffect(_unit, new StatusEffect(StatusEffectType.Dodge, 3f, 0.25f));

            // Should have the higher value
            Assert.AreEqual(0.25f, _system.GetEffectValue(_unit, StatusEffectType.Dodge), 0.001f);
        }

        [Test]
        public void Dodge_LowerValueDoesNotReplace()
        {
            _system.ApplyEffect(_unit, new StatusEffect(StatusEffectType.Dodge, 3f, 0.25f));
            _system.ApplyEffect(_unit, new StatusEffect(StatusEffectType.Dodge, 3f, 0.10f));

            Assert.AreEqual(0.25f, _system.GetEffectValue(_unit, StatusEffectType.Dodge), 0.001f);
        }

        // --- Immunity Tests ---

        [Test]
        public void Immunity_BlocksCC()
        {
            _system.ApplyEffect(_unit, new StatusEffect(StatusEffectType.Immunity, 5f, 0f));

            bool applied = _system.ApplyEffect(_unit, new StatusEffect(StatusEffectType.Stun, 2f, 0f));
            Assert.IsFalse(applied);
            Assert.IsFalse(_unit.IsStunned);
        }

        [Test]
        public void Immunity_DoesNotBlockDoT()
        {
            _system.ApplyEffect(_unit, new StatusEffect(StatusEffectType.Immunity, 5f, 0f));

            bool applied = _system.ApplyEffect(_unit, new StatusEffect(StatusEffectType.Burn, 3f, 20f));
            Assert.IsTrue(applied);
        }

        // --- Duration / Expiry ---

        [Test]
        public void EffectExpires_RemovedFromActiveList()
        {
            _system.ApplyEffect(_unit, new StatusEffect(StatusEffectType.AtkBoost, 2f, 0.2f));
            Assert.IsTrue(_system.HasEffect(_unit, StatusEffectType.AtkBoost));

            _system.TickEffects(_unit, 2.1f);
            Assert.IsFalse(_system.HasEffect(_unit, StatusEffectType.AtkBoost));
        }

        // --- Cleanse ---

        [Test]
        public void RemoveAllDebuffs_ClearsDebuffsKeepsBuffs()
        {
            _system.ApplyEffect(_unit, new StatusEffect(StatusEffectType.Burn, 3f, 10f));
            _system.ApplyEffect(_unit, new StatusEffect(StatusEffectType.Stun, 2f, 0f));
            _system.ApplyEffect(_unit, new StatusEffect(StatusEffectType.AtkBoost, 5f, 0.2f));

            _system.RemoveAllDebuffs(_unit);

            Assert.IsFalse(_system.HasEffect(_unit, StatusEffectType.Burn));
            Assert.IsFalse(_system.HasEffect(_unit, StatusEffectType.Stun));
            Assert.IsTrue(_system.HasEffect(_unit, StatusEffectType.AtkBoost));
        }

        // --- Helper Tests ---

        [Test]
        public void IsCC_ReturnsCorrectly()
        {
            Assert.IsTrue(StatusEffectSystem.IsCC(StatusEffectType.Stun));
            Assert.IsTrue(StatusEffectSystem.IsCC(StatusEffectType.Freeze));
            Assert.IsTrue(StatusEffectSystem.IsCC(StatusEffectType.Root));
            Assert.IsTrue(StatusEffectSystem.IsCC(StatusEffectType.Silence));
            Assert.IsTrue(StatusEffectSystem.IsCC(StatusEffectType.Slow));
            Assert.IsTrue(StatusEffectSystem.IsCC(StatusEffectType.Taunt));
            Assert.IsFalse(StatusEffectSystem.IsCC(StatusEffectType.Burn));
            Assert.IsFalse(StatusEffectSystem.IsCC(StatusEffectType.Shield));
        }

        [Test]
        public void IsHardCC_ReturnsCorrectly()
        {
            Assert.IsTrue(StatusEffectSystem.IsHardCC(StatusEffectType.Stun));
            Assert.IsTrue(StatusEffectSystem.IsHardCC(StatusEffectType.Freeze));
            Assert.IsTrue(StatusEffectSystem.IsHardCC(StatusEffectType.Root));
            Assert.IsFalse(StatusEffectSystem.IsHardCC(StatusEffectType.Silence));
            Assert.IsFalse(StatusEffectSystem.IsHardCC(StatusEffectType.Slow));
        }

        [Test]
        public void GetCategory_ReturnsCorrectCategories()
        {
            Assert.AreEqual(StatusEffectCategory.DoT, StatusEffect.GetCategory(StatusEffectType.Burn));
            Assert.AreEqual(StatusEffectCategory.CrowdControl, StatusEffect.GetCategory(StatusEffectType.Stun));
            Assert.AreEqual(StatusEffectCategory.Buff, StatusEffect.GetCategory(StatusEffectType.Shield));
            Assert.AreEqual(StatusEffectCategory.Debuff, StatusEffect.GetCategory(StatusEffectType.Vulnerability));
            Assert.AreEqual(StatusEffectCategory.Special, StatusEffect.GetCategory(StatusEffectType.Stasis));
        }

        // --- Vulnerability ---

        [Test]
        public void Vulnerability_TrackedAsEffect()
        {
            _system.ApplyEffect(_unit, new StatusEffect(StatusEffectType.Vulnerability, 4f, 0.25f));
            Assert.AreEqual(0.25f, _system.GetEffectValue(_unit, StatusEffectType.Vulnerability), 0.001f);
        }

        // --- Stasis ---

        [Test]
        public void Stasis_SetsUnitStasisField()
        {
            _system.ApplyEffect(_unit, new StatusEffect(StatusEffectType.Stasis, 2f, 0f));
            Assert.IsTrue(_unit.Stasis > 0);
        }

        [Test]
        public void Stasis_ClearsWhenExpired()
        {
            _system.ApplyEffect(_unit, new StatusEffect(StatusEffectType.Stasis, 1f, 0f));
            _system.TickEffects(_unit, 1.1f);
            Assert.AreEqual(0, _unit.Stasis);
        }

        // --- NonStacking replacement ---

        [Test]
        public void NonStackingEffect_ReplacesExisting()
        {
            _system.ApplyEffect(_unit, new StatusEffect(StatusEffectType.Vulnerability, 3f, 0.15f));
            _system.ApplyEffect(_unit, new StatusEffect(StatusEffectType.Vulnerability, 4f, 0.25f));

            // Should have the newer value, not summed
            Assert.AreEqual(0.25f, _system.GetEffectValue(_unit, StatusEffectType.Vulnerability), 0.001f);
        }
    }
}

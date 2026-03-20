using System;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Mana gain, consumption, and ability-readiness checks.
    /// Ground truth: GROUND-TRUTH.md section 5.
    /// </summary>
    public static class ManaSystem
    {
        public const int BASE_MANA_PER_AUTO = 10;
        public const float MANA_ON_HIT_COEFFICIENT = 50f;

        /// <summary>
        /// Gain mana when landing an auto-attack.
        /// Base: 10, modified by manaGenMultiplier (e.g., Mana Shrine).
        /// </summary>
        public static void GainManaOnAttack(CombatUnit unit, float manaGenMultiplier = 1f)
        {
            if (unit.MaxMana <= 0) return;
            int gain = (int)Math.Floor(BASE_MANA_PER_AUTO * manaGenMultiplier);
            unit.Mana = Math.Min(unit.Mana + gain, unit.MaxMana);
        }

        /// <summary>
        /// Gain mana proportional to damage taken (as % of max HP).
        /// Formula: max(1, floor((damage / maxHP) * 50))
        /// </summary>
        public static void GainManaOnHit(CombatUnit unit, int damageTaken)
        {
            if (unit.MaxMana <= 0 || damageTaken <= 0 || unit.MaxHP <= 0) return;
            int gain = Math.Max(1, (int)Math.Floor((float)damageTaken / unit.MaxHP * MANA_ON_HIT_COEFFICIENT));
            unit.Mana = Math.Min(unit.Mana + gain, unit.MaxMana);
        }

        /// <summary>
        /// Passive mana regeneration per tick.
        /// </summary>
        public static void GainManaPassive(CombatUnit unit, float passiveManaPerSec, float deltaTime)
        {
            if (unit.MaxMana <= 0 || passiveManaPerSec <= 0f) return;
            float gain = passiveManaPerSec * deltaTime;
            unit.Mana = Math.Min(unit.Mana + (int)Math.Floor(gain), unit.MaxMana);
        }

        /// <summary>
        /// Check if unit can cast its ability.
        /// Requires: mana >= maxMana, maxMana > 0, not silenced.
        /// </summary>
        public static bool CanCastAbility(CombatUnit unit)
        {
            if (unit.MaxMana <= 0) return false;
            if (unit.Mana < unit.MaxMana) return false;
            if (unit.IsSilenced) return false;
            return true;
        }

        /// <summary>
        /// Consume mana after casting. Resets to 0 (or partial refund amount).
        /// </summary>
        public static void ConsumeMana(CombatUnit unit, int refundAmount = 0)
        {
            unit.Mana = Math.Min(refundAmount, unit.MaxMana);
        }

        /// <summary>
        /// Refund mana (e.g., on kill). Capped at maxMana.
        /// </summary>
        public static void RefundMana(CombatUnit unit, int amount)
        {
            if (unit.MaxMana <= 0) return;
            unit.Mana = Math.Min(unit.Mana + amount, unit.MaxMana);
        }
    }
}

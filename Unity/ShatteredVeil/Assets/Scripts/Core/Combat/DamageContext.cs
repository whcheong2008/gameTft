namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Additional context for the damage pipeline.
    /// </summary>
    public class DamageContext
    {
        /// <summary>Ability multiplier. 0 or negative means auto-attack (use 1.0).</summary>
        public float AbilityMultiplier;

        /// <summary>Force a critical hit regardless of RNG.</summary>
        public bool ForceCrit;

        /// <summary>True damage ignores damage reduction.</summary>
        public bool IsTrueDamage;

        /// <summary>Sorcerer spell penetration (0-1). Reduces target DR.</summary>
        public float SpellPenetration;

        /// <summary>Bonus crit damage from synergies (added to base 1.5x).</summary>
        public float BonusCritDamage;

        public DamageContext()
        {
            AbilityMultiplier = 0f;
            ForceCrit = false;
            IsTrueDamage = false;
            SpellPenetration = 0f;
            BonusCritDamage = 0f;
        }
    }

    /// <summary>
    /// Result of a damage calculation.
    /// </summary>
    public class DamageResult
    {
        public int Damage;
        public bool IsCrit;
        public bool IsDodged;
        public float ElementMultiplier;
        public int ShieldAbsorbed;

        public override string ToString()
        {
            return $"Damage={Damage} Crit={IsCrit} Dodged={IsDodged} Elem={ElementMultiplier:F1} Shield={ShieldAbsorbed}";
        }
    }
}

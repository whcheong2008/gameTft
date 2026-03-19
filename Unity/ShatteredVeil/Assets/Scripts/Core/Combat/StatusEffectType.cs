namespace ShatteredVeil.Core.Combat
{
    public enum StatusEffectType
    {
        // DoT
        Burn,
        Poison,
        Bleed,

        // Crowd Control
        Stun,
        Freeze,
        Root,
        Silence,
        Slow,
        Knockback,
        Taunt,

        // Buffs
        Shield,
        Regen,
        DamageReduction,
        AtkBoost,
        SpeedBoost,
        Dodge,
        Lifesteal,
        Immunity,

        // Debuffs / Special
        Vulnerability,
        Stasis,
        Stealth,
        RangerMark
    }
}

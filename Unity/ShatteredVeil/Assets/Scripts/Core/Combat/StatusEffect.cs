namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Runtime instance of an active status effect on a CombatUnit.
    /// </summary>
    public class StatusEffect
    {
        public StatusEffectType Type;
        public StatusEffectCategory Category;
        public float Duration;
        public float MaxDuration;
        public float TickInterval;
        public float TimeSinceLastTick;
        public float Value;
        public float ShieldRemaining;
        public int SourceUnitId;
        public int Stacks;

        public bool IsExpired
        {
            get
            {
                if (Type == StatusEffectType.Shield)
                    return ShieldRemaining <= 0 && Duration <= 0;
                return Duration <= 0;
            }
        }

        public StatusEffect(StatusEffectType type, float duration, float value, int sourceId = 0)
        {
            Type = type;
            Category = GetCategory(type);
            Duration = duration;
            MaxDuration = duration;
            Value = value;
            SourceUnitId = sourceId;
            Stacks = 1;
            TimeSinceLastTick = 0f;

            // DoTs tick once per second
            if (Category == StatusEffectCategory.DoT)
                TickInterval = 1.0f;

            // Regen ticks once per second
            if (type == StatusEffectType.Regen)
                TickInterval = 1.0f;

            // Shield uses ShieldRemaining
            if (type == StatusEffectType.Shield)
                ShieldRemaining = value;
        }

        public static StatusEffectCategory GetCategory(StatusEffectType type)
        {
            switch (type)
            {
                case StatusEffectType.Burn:
                case StatusEffectType.Poison:
                case StatusEffectType.Bleed:
                    return StatusEffectCategory.DoT;

                case StatusEffectType.Stun:
                case StatusEffectType.Freeze:
                case StatusEffectType.Root:
                case StatusEffectType.Silence:
                case StatusEffectType.Slow:
                case StatusEffectType.Knockback:
                case StatusEffectType.Taunt:
                    return StatusEffectCategory.CrowdControl;

                case StatusEffectType.Shield:
                case StatusEffectType.Regen:
                case StatusEffectType.DamageReduction:
                case StatusEffectType.AtkBoost:
                case StatusEffectType.SpeedBoost:
                case StatusEffectType.Dodge:
                case StatusEffectType.Lifesteal:
                case StatusEffectType.Immunity:
                    return StatusEffectCategory.Buff;

                case StatusEffectType.Vulnerability:
                case StatusEffectType.RangerMark:
                    return StatusEffectCategory.Debuff;

                case StatusEffectType.Stasis:
                case StatusEffectType.Stealth:
                    return StatusEffectCategory.Special;

                default:
                    return StatusEffectCategory.Debuff;
            }
        }

        public StatusEffect Clone()
        {
            return new StatusEffect(Type, Duration, Value, SourceUnitId)
            {
                MaxDuration = MaxDuration,
                TickInterval = TickInterval,
                TimeSinceLastTick = TimeSinceLastTick,
                ShieldRemaining = ShieldRemaining,
                Stacks = Stacks
            };
        }
    }
}

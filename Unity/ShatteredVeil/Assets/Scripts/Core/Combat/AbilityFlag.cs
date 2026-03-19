using System;

namespace ShatteredVeil.Core.Combat
{
    [Flags]
    public enum AbilityFlag
    {
        None         = 0,
        Dash         = 1 << 0,
        Shield       = 1 << 1,
        Heal         = 1 << 2,
        SelfBuff     = 1 << 3,
        AreaDamage   = 1 << 4,
        ConditionBonus = 1 << 5,
        ManaRefund   = 1 << 6,
        Pierce       = 1 << 7,
        Chain        = 1 << 8,
        Knockback    = 1 << 9,
        Root         = 1 << 10,
        Stun         = 1 << 11,
        Silence      = 1 << 12,
        Burn         = 1 << 13,
        Slow         = 1 << 14,
        Lifesteal    = 1 << 15,
        Redirect     = 1 << 16,
        Revive       = 1 << 17,
        Summon       = 1 << 18,
        Taunt        = 1 << 19,
        MarkConsume  = 1 << 20,
        Teleport     = 1 << 21,
        DodgeBuff    = 1 << 22,
        Freeze       = 1 << 23,
        Vulnerability = 1 << 24
    }
}

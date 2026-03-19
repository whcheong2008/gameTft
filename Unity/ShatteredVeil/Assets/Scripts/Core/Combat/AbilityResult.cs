using System.Collections.Generic;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Result of an ability execution.
    /// </summary>
    public class AbilityResult
    {
        public string AbilityId;
        public CombatUnit Caster;
        public List<DamageInstance> DamageInstances;
        public List<HealInstance> HealInstances;
        public List<ShieldGrant> ShieldGrants;
        public int TotalDamage;
        public int TotalHealing;
        public int TotalShielding;
        public bool ManaRefunded;
        public int ManaRefundAmount;
        public List<string> SpecialEvents;

        public AbilityResult()
        {
            DamageInstances = new List<DamageInstance>();
            HealInstances = new List<HealInstance>();
            ShieldGrants = new List<ShieldGrant>();
            SpecialEvents = new List<string>();
        }
    }

    public class DamageInstance
    {
        public CombatUnit Target;
        public int Damage;
        public bool IsCrit;
        public bool Killed;
    }

    public class HealInstance
    {
        public CombatUnit Target;
        public int Amount;
    }

    public class ShieldGrant
    {
        public CombatUnit Target;
        public int Amount;
    }
}

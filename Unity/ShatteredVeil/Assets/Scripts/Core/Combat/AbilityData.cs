using System.Collections.Generic;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Static definition of what an ability does.
    /// Instantiated once per ability in AbilityCatalog.
    /// </summary>
    public class AbilityData
    {
        public string Id;
        public string Name;
        public string Description;
        public AbilityType Type;
        public TargetingRule Targeting;
        public float DamageMultiplier;
        public float HealMultiplier;
        public int Range;
        public int AreaRadius;
        public AbilityFlag Flags;
        public Dictionary<string, float> SpecialParams;

        public AbilityData()
        {
            SpecialParams = new Dictionary<string, float>();
            Targeting = TargetingRule.Nearest;
            Type = AbilityType.Active;
            Range = 99; // abilities typically not range-limited by default
        }

        public bool HasFlag(AbilityFlag flag)
        {
            return (Flags & flag) != 0;
        }
    }
}

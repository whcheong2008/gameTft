namespace ShatteredVeil.Core.Combat
{
    public class PassiveEvent
    {
        public string PassiveId;
        public string Description;
        public CombatUnit Source;
        public CombatUnit Target;
        public float DamageDealt;
        public float HealingDone;
        public float ShieldGranted;
        public bool AppliedStatusEffect;
        public StatusEffectType StatusType;
    }
}

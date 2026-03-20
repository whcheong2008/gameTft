namespace ShatteredVeil.Core.Combat
{
    public class BossPhase
    {
        public int PhaseNumber;
        public float HpThreshold;
        public string[] AbilityIds;
        public float AttackSpeedMultiplier;
        public float DamageMultiplier;
        public string SpecialMechanic;

        public BossPhase()
        {
            AbilityIds = new string[0];
            AttackSpeedMultiplier = 1.0f;
            DamageMultiplier = 1.0f;
        }
    }
}

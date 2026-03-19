namespace ShatteredVeil.Core.Combat
{
    public class BossAbility
    {
        public string Id;
        public string Name;
        public float DamageMultiplier;
        public float Cooldown;
        public float TelegraphTime;
        public int AoeRadius;
        public string TargetType;
        public string Description;

        public BossAbility()
        {
            DamageMultiplier = 1.0f;
            Cooldown = 8.0f;
            TelegraphTime = 2.0f;
            AoeRadius = 1;
            TargetType = "highest_hp";
        }
    }
}

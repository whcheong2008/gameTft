namespace ShatteredVeil.Core.Combat
{
    public class BossData
    {
        public string Id;
        public string Name;
        public int GridWidth;
        public int GridHeight;
        public float[] PhaseThresholds;
        public BossPhase[] Phases;
        public float EnrageTimer;
        public float EnrageAtkMultiplier;
        public float EnrageSpdMultiplier;
        public BossAbility[] Abilities;
        public int BaseHP;
        public int BaseATK;
        public int BaseDEF;
        public int BaseSPD;
        public float RegenPct;

        public BossData()
        {
            GridWidth = 2;
            GridHeight = 2;
            EnrageTimer = 180f;
            EnrageAtkMultiplier = 2.0f;
            EnrageSpdMultiplier = 2.0f;
            Phases = new BossPhase[0];
            Abilities = new BossAbility[0];
            PhaseThresholds = new float[0];
        }
    }
}

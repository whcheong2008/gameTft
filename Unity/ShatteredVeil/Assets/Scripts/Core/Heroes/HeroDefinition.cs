namespace ShatteredVeil.Core.Heroes
{
    public class HeroDefinition
    {
        public HeroId Id;
        public string Name;
        public string Philosophy;
        public int AcquiredRegion;
        public int AcquiredStage;
        public bool CanDie;
        public int DeathRegion;
        public int DeathStage;
        public int? LeaveRegion;
        public int? LeaveStage;
        public int? ReturnRegion;
        public int? ReturnStage;
        public SkillBranch[] Branches;

        public HeroDefinition()
        {
            Branches = new SkillBranch[2];
        }
    }
}

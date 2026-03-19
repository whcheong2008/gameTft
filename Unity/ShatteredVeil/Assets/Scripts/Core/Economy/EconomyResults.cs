namespace ShatteredVeil.Core.Economy
{
    public struct LevelUpResult
    {
        public int NewLevel;
        public int LevelsGained;
        public bool TeamSizeChanged;
        public int NewTeamSize;
        public int RemainingXP;
    }

    public struct StarUpResult
    {
        public bool Success;
        public int NewStar;
        public int CopiesSpent;
        public int VESpent;
    }
}

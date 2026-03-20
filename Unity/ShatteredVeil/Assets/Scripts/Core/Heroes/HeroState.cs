using System.Collections.Generic;

namespace ShatteredVeil.Core.Heroes
{
    public class HeroState
    {
        public HeroId Id;
        public int Level;
        public int XP;
        public int SkillPoints;
        public List<int> InvestedNodes;
        public string AssignedUnitId;
        public bool IsDead;
        public bool IsAbsent;
        public int RespecCount;

        public HeroState()
        {
            Level = 1;
            SkillPoints = 1;
            InvestedNodes = new List<int>();
        }

        public HeroState(HeroId id) : this()
        {
            Id = id;
        }
    }
}

using System.Collections.Generic;

namespace ShatteredVeil.Core.Heroes
{
    public class SkillNode
    {
        public int Tier;
        public int Choice;
        public int LevelReq;
        public int Cost;
        public string Name;
        public string Description;
        public Dictionary<string, float> Bonuses;
        public bool IsCapstone;

        public SkillNode()
        {
            Bonuses = new Dictionary<string, float>();
        }

        public SkillNode(int tier, int choice, string name, string description)
        {
            Tier = tier;
            Choice = choice;
            Name = name;
            Description = description;
            Bonuses = new Dictionary<string, float>();
            IsCapstone = tier == 5;

            switch (tier)
            {
                case 1: LevelReq = 1; Cost = 1; break;
                case 2: LevelReq = 5; Cost = 1; break;
                case 3: LevelReq = 9; Cost = 2; break;
                case 4: LevelReq = 13; Cost = 4; break;
                case 5: LevelReq = 17; Cost = 5; break;
                default: LevelReq = 1; Cost = 1; break;
            }
        }
    }
}

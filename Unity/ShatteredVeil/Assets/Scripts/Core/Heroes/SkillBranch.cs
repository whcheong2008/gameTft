namespace ShatteredVeil.Core.Heroes
{
    public class SkillBranch
    {
        public string Name;
        public string Description;
        public SkillNode[] Nodes;

        public SkillBranch()
        {
            Nodes = new SkillNode[0];
        }

        public SkillBranch(string name, string description, SkillNode[] nodes)
        {
            Name = name;
            Description = description;
            Nodes = nodes;
        }
    }
}

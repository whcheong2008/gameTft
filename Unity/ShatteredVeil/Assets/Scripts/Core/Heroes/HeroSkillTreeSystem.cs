using System.Collections.Generic;

namespace ShatteredVeil.Core.Heroes
{
    public static class HeroSkillTreeSystem
    {
        public static bool CanInvestNode(HeroState hero, HeroDefinition def, int branchIndex, int nodeIndex)
        {
            if (hero == null || def == null) return false;
            if (hero.IsDead) return false;
            if (branchIndex < 0 || branchIndex >= def.Branches.Length) return false;

            var branch = def.Branches[branchIndex];
            if (nodeIndex < 0 || nodeIndex >= branch.Nodes.Length) return false;

            var node = branch.Nodes[nodeIndex];

            // Already invested?
            int globalIndex = GetGlobalNodeIndex(def, branchIndex, nodeIndex);
            if (hero.InvestedNodes.Contains(globalIndex)) return false;

            // Level requirement
            if (hero.Level < node.LevelReq) return false;

            // Skill points available
            int pointsSpent = GetPointsSpent(hero, def);
            if (hero.SkillPoints - pointsSpent < node.Cost) return false;

            // Cannot pick both choices at same tier in same branch
            int otherChoice = node.Choice == 0 ? 1 : 0;
            int otherIndex = FindNodeInBranch(branch, node.Tier, otherChoice);
            if (otherIndex >= 0)
            {
                int otherGlobal = GetGlobalNodeIndex(def, branchIndex, otherIndex);
                if (hero.InvestedNodes.Contains(otherGlobal)) return false;
            }

            // Tier progression: must have at least 1 node from previous tier in same branch
            if (node.Tier > 1)
            {
                bool hasPrevTier = false;
                for (int i = 0; i < branch.Nodes.Length; i++)
                {
                    if (branch.Nodes[i].Tier == node.Tier - 1)
                    {
                        int prevGlobal = GetGlobalNodeIndex(def, branchIndex, i);
                        if (hero.InvestedNodes.Contains(prevGlobal))
                        {
                            hasPrevTier = true;
                            break;
                        }
                    }
                }
                if (!hasPrevTier) return false;
            }

            return true;
        }

        public static bool InvestNode(HeroState hero, HeroDefinition def, int branchIndex, int nodeIndex)
        {
            if (!CanInvestNode(hero, def, branchIndex, nodeIndex)) return false;

            int globalIndex = GetGlobalNodeIndex(def, branchIndex, nodeIndex);
            hero.InvestedNodes.Add(globalIndex);
            return true;
        }

        public static List<SkillNode> GetInvestedSkillNodes(HeroState hero, HeroDefinition def)
        {
            var result = new List<SkillNode>();
            if (hero == null || def == null) return result;

            foreach (int globalIndex in hero.InvestedNodes)
            {
                var node = GetNodeByGlobalIndex(def, globalIndex);
                if (node != null) result.Add(node);
            }
            return result;
        }

        public static Dictionary<string, float> GetTotalBonuses(HeroState hero, HeroDefinition def)
        {
            var totals = new Dictionary<string, float>();
            var nodes = GetInvestedSkillNodes(hero, def);
            foreach (var node in nodes)
            {
                if (node.Bonuses == null) continue;
                foreach (var kvp in node.Bonuses)
                {
                    if (totals.ContainsKey(kvp.Key))
                        totals[kvp.Key] += kvp.Value;
                    else
                        totals[kvp.Key] = kvp.Value;
                }
            }
            return totals;
        }

        public static bool Respec(HeroState hero, ref int currentVE)
        {
            if (hero == null) return false;

            int cost = 500 + hero.RespecCount * 500;
            if (currentVE < cost) return false;

            currentVE -= cost;
            hero.InvestedNodes.Clear();
            hero.RespecCount++;
            return true;
        }

        public static int GetRespecCost(HeroState hero)
        {
            if (hero == null) return 500;
            return 500 + hero.RespecCount * 500;
        }

        public static int GetPointsSpent(HeroState hero, HeroDefinition def)
        {
            int spent = 0;
            foreach (int globalIndex in hero.InvestedNodes)
            {
                var node = GetNodeByGlobalIndex(def, globalIndex);
                if (node != null) spent += node.Cost;
            }
            return spent;
        }

        public static int GetGlobalNodeIndex(HeroDefinition def, int branchIndex, int nodeIndex)
        {
            int offset = 0;
            for (int b = 0; b < branchIndex; b++)
                offset += def.Branches[b].Nodes.Length;
            return offset + nodeIndex;
        }

        public static SkillNode GetNodeByGlobalIndex(HeroDefinition def, int globalIndex)
        {
            int offset = 0;
            for (int b = 0; b < def.Branches.Length; b++)
            {
                if (globalIndex < offset + def.Branches[b].Nodes.Length)
                    return def.Branches[b].Nodes[globalIndex - offset];
                offset += def.Branches[b].Nodes.Length;
            }
            return null;
        }

        private static int FindNodeInBranch(SkillBranch branch, int tier, int choice)
        {
            for (int i = 0; i < branch.Nodes.Length; i++)
            {
                if (branch.Nodes[i].Tier == tier && branch.Nodes[i].Choice == choice)
                    return i;
            }
            return -1;
        }
    }
}

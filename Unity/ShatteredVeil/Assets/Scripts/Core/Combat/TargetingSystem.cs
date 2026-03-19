using System;
using System.Collections.Generic;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Target selection logic for combat.
    /// </summary>
    public static class TargetingSystem
    {
        public static CombatUnit GetTarget(CombatUnit attacker, List<CombatUnit> enemies,
            TargetingRule rule, Random rng = null)
        {
            var alive = FilterAlive(enemies);
            if (alive.Count == 0) return null;

            // Taunt override: if any enemy is taunting, must target them
            var taunter = FindTaunter(alive);
            if (taunter != null) return taunter;

            switch (rule)
            {
                case TargetingRule.Nearest:
                    return FindNearest(attacker, alive);
                case TargetingRule.LowestHP:
                    return FindLowestHP(alive);
                case TargetingRule.HighestATK:
                    return FindHighestATK(alive);
                case TargetingRule.Random:
                    return alive[rng != null ? rng.Next(alive.Count) : 0];
                case TargetingRule.Taunt:
                    return taunter ?? FindNearest(attacker, alive);
                default:
                    return FindNearest(attacker, alive);
            }
        }

        private static List<CombatUnit> FilterAlive(List<CombatUnit> units)
        {
            var alive = new List<CombatUnit>();
            foreach (var u in units)
            {
                if (u.IsAlive)
                    alive.Add(u);
            }
            return alive;
        }

        private static CombatUnit FindTaunter(List<CombatUnit> alive)
        {
            foreach (var u in alive)
            {
                if (u.IsTaunting) return u;
            }
            return null;
        }

        private static CombatUnit FindNearest(CombatUnit attacker, List<CombatUnit> alive)
        {
            CombatUnit best = null;
            int bestDist = int.MaxValue;
            foreach (var u in alive)
            {
                int dist = attacker.Position.ManhattanDistance(u.Position);
                if (dist < bestDist ||
                    (dist == bestDist && best != null && CompareForTiebreak(u, best) < 0))
                {
                    bestDist = dist;
                    best = u;
                }
            }
            return best;
        }

        private static CombatUnit FindLowestHP(List<CombatUnit> alive)
        {
            CombatUnit best = null;
            foreach (var u in alive)
            {
                if (best == null || u.CurrentHP < best.CurrentHP ||
                    (u.CurrentHP == best.CurrentHP && CompareForTiebreak(u, best) < 0))
                {
                    best = u;
                }
            }
            return best;
        }

        private static CombatUnit FindHighestATK(List<CombatUnit> alive)
        {
            CombatUnit best = null;
            foreach (var u in alive)
            {
                if (best == null || u.ATK > best.ATK ||
                    (u.ATK == best.ATK && CompareForTiebreak(u, best) < 0))
                {
                    best = u;
                }
            }
            return best;
        }

        private static int CompareForTiebreak(CombatUnit a, CombatUnit b)
        {
            return string.Compare(a.UnitId, b.UnitId, StringComparison.Ordinal);
        }
    }
}

using System;
using System.Collections.Generic;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// SPD-based turn queue. Faster units go first.
    /// Tie-breaking: player units first, then by UnitId.
    /// Stunned units skip. Dead units removed.
    /// </summary>
    public static class TurnOrderSystem
    {
        public static Queue<CombatUnit> BuildTurnOrder(List<CombatUnit> allUnits)
        {
            var sorted = new List<CombatUnit>(allUnits);
            sorted.Sort((a, b) =>
            {
                // Higher SPD goes first
                int cmp = b.SPD.CompareTo(a.SPD);
                if (cmp != 0) return cmp;

                // Tie-break: player units go first
                if (a.Team != b.Team)
                    return a.Team == Team.Player ? -1 : 1;

                // Tie-break: by UnitId
                return string.Compare(a.UnitId, b.UnitId, StringComparison.Ordinal);
            });

            var queue = new Queue<CombatUnit>();
            foreach (var unit in sorted)
            {
                if (unit.IsAlive)
                    queue.Enqueue(unit);
            }
            return queue;
        }

        /// <summary>
        /// Check if a unit should skip its turn.
        /// Returns true if the unit is stunned or dead.
        /// </summary>
        public static bool ShouldSkipTurn(CombatUnit unit)
        {
            if (!unit.IsAlive) return true;
            if (unit.IsStunned) return true;
            if (unit.IsFrozen) return true;
            return false;
        }
    }
}

using System.Collections.Generic;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Full snapshot of a combat encounter.
    /// </summary>
    public class CombatState
    {
        public List<CombatUnit> PlayerTeam;
        public List<CombatUnit> EnemyTeam;
        public int TurnNumber;
        public int RngSeed;
        public BattlePhase Phase;
        public bool IsBoss;

        /// <summary>
        /// Max combat duration in seconds. 60 for normal, 180 for boss.
        /// Used as a turn limit: assumes ~1 turn/sec, so 60 turns normal, 180 boss.
        /// </summary>
        public int MaxTurns => IsBoss ? 180 : 60;

        public CombatState()
        {
            PlayerTeam = new List<CombatUnit>();
            EnemyTeam = new List<CombatUnit>();
            TurnNumber = 0;
            Phase = BattlePhase.Preparing;
        }

        public List<CombatUnit> GetAllUnits()
        {
            var all = new List<CombatUnit>(PlayerTeam.Count + EnemyTeam.Count);
            all.AddRange(PlayerTeam);
            all.AddRange(EnemyTeam);
            return all;
        }

        public List<CombatUnit> GetAliveUnits(Team team)
        {
            var source = team == Team.Player ? PlayerTeam : EnemyTeam;
            var alive = new List<CombatUnit>();
            foreach (var unit in source)
            {
                if (unit.IsAlive)
                    alive.Add(unit);
            }
            return alive;
        }
    }
}

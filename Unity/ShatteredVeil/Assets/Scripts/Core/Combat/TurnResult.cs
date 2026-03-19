namespace ShatteredVeil.Core.Combat
{
    public class TurnResult
    {
        public CombatUnit Attacker;
        public CombatUnit Target;
        public int Damage;
        public bool IsCrit;
        public bool IsDodged;
        public bool TargetDied;
        public bool AttackerMoved;
        public GridPosition MovedFrom;
        public GridPosition MovedTo;
        public bool Skipped;
        public string SkipReason;
        public bool BattleOver;
        public BattlePhase EndPhase;
        public bool UsedAbility;
        public AbilityResult AbilityResult;
    }

    public class BattleResult
    {
        public Team Winner;
        public bool IsDraw;
        public int TurnCount;
        public System.Collections.Generic.List<TurnResult> Log;

        public BattleResult()
        {
            Log = new System.Collections.Generic.List<TurnResult>();
        }
    }
}

using System.Collections.Generic;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Types of events that occur during combat playback.
    /// </summary>
    public enum CombatEventType
    {
        BattleStart,
        TurnStart,
        Move,
        AutoAttack,
        AbilityCast,
        Heal,
        Damage,
        CriticalHit,
        Dodge,
        ShieldAbsorb,
        StatusApplied,
        StatusExpired,
        ManaGained,
        UnitDeath,
        WaveComplete,
        WaveStart,
        Repositioning,
        BattleEnd,
        BossPhaseChange,
        BossTelegraph
    }

    /// <summary>
    /// A single event in the combat timeline. Pure data — no Unity dependencies.
    /// Events are produced by CombatEngine and consumed by CombatSceneController for playback.
    /// </summary>
    public class CombatEvent
    {
        public CombatEventType Type { get; set; }

        /// <summary>Simulation time (seconds) when this event occurred.</summary>
        public float Timestamp { get; set; }

        /// <summary>Which wave this event belongs to (0-indexed).</summary>
        public int WaveIndex { get; set; }

        /// <summary>Turn number within the wave.</summary>
        public int TurnNumber { get; set; }

        // --- Actor / Target ---

        /// <summary>Unit that initiated the action (attacker, caster, healer).</summary>
        public string SourceUnitId { get; set; }
        public string SourceUnitName { get; set; }
        public string SourceSide { get; set; } // "player" or "enemy"

        /// <summary>Unit that received the action (target of attack/heal/status).</summary>
        public string TargetUnitId { get; set; }
        public string TargetUnitName { get; set; }
        public string TargetSide { get; set; }

        // --- Position ---
        public int SourceRow { get; set; }
        public int SourceCol { get; set; }
        public int TargetRow { get; set; }
        public int TargetCol { get; set; }

        // --- Values ---
        public float Value { get; set; } // damage, healing, shield, mana amount
        public bool IsCrit { get; set; }
        public bool IsDodge { get; set; }
        public string Element { get; set; }
        public string AbilityName { get; set; }
        public string StatusEffectType { get; set; }
        public float StatusDuration { get; set; }

        // --- Unit snapshot at event time ---
        public float SourceHPPercent { get; set; }
        public float TargetHPPercent { get; set; }
        public float SourceManaPercent { get; set; }
        public float TargetManaPercent { get; set; }

        // --- Battle result (for BattleEnd) ---
        public bool Victory { get; set; }
        public int Stars { get; set; }

        // --- Boss (for BossPhaseChange/BossTelegraph) ---
        public int BossPhase { get; set; }
        public string TelegraphPattern { get; set; }

        /// <summary>Human-readable log line.</summary>
        public string LogMessage { get; set; }
    }

    /// <summary>
    /// Snapshot of a unit's state at a point in time. Used for grid rendering.
    /// </summary>
    public class UnitSnapshot
    {
        public string UnitId { get; set; }
        public string UnitName { get; set; }
        public string Side { get; set; }
        public string Element { get; set; }
        public int Tier { get; set; }
        public int Stars { get; set; }
        public bool IsEvolved { get; set; }
        public bool IsAlive { get; set; }
        public int Row { get; set; }
        public int Col { get; set; }
        public float HP { get; set; }
        public float MaxHP { get; set; }
        public float Mana { get; set; }
        public float MaxMana { get; set; }
        public float Shield { get; set; }
        public bool IsCasting { get; set; }
        public bool IsBoss { get; set; }
        public int BossPhase { get; set; }
        public List<string> ActiveStatuses { get; set; } = new List<string>();

        public float HPPercent => MaxHP > 0 ? HP / MaxHP : 0f;
        public float ManaPercent => MaxMana > 0 ? Mana / MaxMana : 0f;
    }

    /// <summary>
    /// Full snapshot of a combat frame (all units + active synergies).
    /// </summary>
    public class CombatFrameSnapshot
    {
        public float Timestamp { get; set; }
        public int WaveIndex { get; set; }
        public int TurnNumber { get; set; }
        public List<UnitSnapshot> PlayerUnits { get; set; } = new List<UnitSnapshot>();
        public List<UnitSnapshot> EnemyUnits { get; set; } = new List<UnitSnapshot>();
        public Dictionary<string, int> ActiveArchetypes { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, int> ActiveElements { get; set; } = new Dictionary<string, int>();
    }

    /// <summary>
    /// Stats tracked per unit during combat (for scoreboard).
    /// </summary>
    public class UnitCombatStats
    {
        public string UnitId { get; set; }
        public string UnitName { get; set; }
        public string Element { get; set; }
        public string Side { get; set; }
        public bool IsAlive { get; set; } = true;
        public float DamageDealt { get; set; }
        public float DamageTaken { get; set; }
        public float HealingDone { get; set; }
        public int AbilityCasts { get; set; }
        public int Kills { get; set; }
    }
}

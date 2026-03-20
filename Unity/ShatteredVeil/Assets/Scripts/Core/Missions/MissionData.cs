using System.Collections.Generic;

namespace ShatteredVeil.Core.Missions
{
    // ---- Enums ----

    public enum StageType
    {
        Story,
        Character,
        Gameplay,
        Boss
    }

    public enum LockType
    {
        None,
        Archetype,
        ArchetypePair,
        ArchetypeOr,
        ElementCount,
        ElementDual,
        ElementMin,
        NoElementSynergy,
        ArchetypeDeep,
        Compound
    }

    public enum EncounterMechanic
    {
        None,
        VipTarget,
        Countdown,
        ReinforcementPressure,
        ProtectObjective,
        EscalatingThreat,
        SplitFormation
    }

    // ---- Data Structures ----

    public class StageLock
    {
        public LockType Type { get; set; }
        public string ArchetypeValue { get; set; }
        public string[] ArchetypeValues { get; set; }
        public int Count { get; set; }
        public int[] Counts { get; set; }
        public List<StageLock> Constraints { get; set; }

        public static StageLock None() => new StageLock { Type = LockType.None };

        public static StageLock Archetype(string archetype, int count) =>
            new StageLock { Type = LockType.Archetype, ArchetypeValue = archetype, Count = count };

        public static StageLock ArchetypeOr(string[] archetypes, int count) =>
            new StageLock { Type = LockType.ArchetypeOr, ArchetypeValues = archetypes, Count = count };

        public static StageLock ElementCount(int count) =>
            new StageLock { Type = LockType.ElementCount, Count = count };

        public static StageLock ElementDual() =>
            new StageLock { Type = LockType.ElementDual };

        public static StageLock ElementMin(int count) =>
            new StageLock { Type = LockType.ElementMin, Count = count };

        public static StageLock NoElementSynergy() =>
            new StageLock { Type = LockType.NoElementSynergy };

        public static StageLock ArchetypeDeep(int count) =>
            new StageLock { Type = LockType.ArchetypeDeep, Count = count };

        public static StageLock CompoundLock(List<StageLock> constraints) =>
            new StageLock { Type = LockType.Compound, Constraints = constraints };
    }

    public class WaveConfig
    {
        public int Budget { get; set; }
        public int MaxCost { get; set; }
        public int Count { get; set; }
        public string ElementBias { get; set; }
        public string SynergyBias { get; set; }
        public bool EnemySynergies { get; set; }
        public bool EnemyEvolutions { get; set; }
        public string Captain { get; set; }
    }

    public class StageRewards
    {
        public int VE { get; set; }
        public int XP { get; set; }
        public int UnitDrops { get; set; }
    }

    public class DropWeights
    {
        public int T1 { get; set; }
        public int T2 { get; set; }
        public int T3 { get; set; }
        public int T4 { get; set; }
        public int T5 { get; set; }
    }

    public class StageData
    {
        public string Id { get; set; }
        public int Region { get; set; }
        public string Name { get; set; }
        public int StageNumber { get; set; }
        public StageType Type { get; set; }
        public string Description { get; set; }
        public int RequiredLevel { get; set; }
        public StageLock Lock { get; set; }
        public EncounterMechanic[] EncounterMechanics { get; set; }
        public bool IsBoss { get; set; }
        public bool CanRetry { get; set; }
        public string BossKey { get; set; }
        public List<WaveConfig> Waves { get; set; }
        public StageRewards Rewards { get; set; }
        public DropWeights DropWeights { get; set; }
    }

    public class RegionReward
    {
        public string Description { get; set; }
        public int VE { get; set; }
        public int FreeMultiRoll { get; set; }
        public int RandomUnitMinCost { get; set; }
        public int RandomUnitMaxCost { get; set; }
        public int EssenceChoice { get; set; }
        public int MythicMaterialChoice { get; set; }
    }

    public class RegionData
    {
        public int RegionNumber { get; set; }
        public string Name { get; set; }
        public string Subtitle { get; set; }
        public string[] StageIds { get; set; }
        public RegionReward Reward { get; set; }
    }

    public class RegionStatus
    {
        public int RegionNumber { get; set; }
        public string Name { get; set; }
        public string Subtitle { get; set; }
        public int CompletedStages { get; set; }
        public int TotalStages { get; set; }
        public bool BossCleared { get; set; }
        public bool Complete { get; set; }
        public bool RewardClaimed { get; set; }
        public string RewardDescription { get; set; }
    }

    public class LockCheckResult
    {
        public bool Passed { get; set; }
        public string Reason { get; set; }

        public static LockCheckResult Pass() =>
            new LockCheckResult { Passed = true, Reason = string.Empty };

        public static LockCheckResult Fail(string reason) =>
            new LockCheckResult { Passed = false, Reason = reason };
    }

    /// <summary>
    /// Minimal interface for mission progress state.
    /// Implemented by the save system to decouple from Unity.
    /// </summary>
    public interface IMissionProgress
    {
        int PlayerLevel { get; }
        HashSet<string> CompletedStageIds { get; }
        Dictionary<string, int> StarRatings { get; }
        HashSet<string> ClaimedRegionRewards { get; }

        /// <summary>Returns archetype counts for the active team (e.g., {"guardian": 2, "ranger": 1}).</summary>
        Dictionary<string, int> GetTeamArchetypeCounts();

        /// <summary>Returns element counts for the active team (e.g., {"fire": 2, "water": 1}).</summary>
        Dictionary<string, int> GetTeamElementCounts();
    }
}

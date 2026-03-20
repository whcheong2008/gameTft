using System.Collections.Generic;

namespace ShatteredVeil.Core.Missions
{
    /// <summary>
    /// Checks team composition locks for stages.
    /// Mirrors checkLock() from js/missions.js.
    /// Pure C# — no Unity dependencies.
    /// </summary>
    public static class LockSystem
    {
        /// <summary>
        /// Check if a team composition meets a stage's lock requirements.
        /// Returns pass/fail with a human-readable reason on failure.
        /// </summary>
        public static LockCheckResult CheckLock(StageLock stageLock, Dictionary<string, int> archetypeCounts, Dictionary<string, int> elementCounts)
        {
            if (stageLock == null || stageLock.Type == LockType.None)
                return LockCheckResult.Pass();

            switch (stageLock.Type)
            {
                case LockType.Archetype:
                    return CheckArchetype(stageLock, archetypeCounts);

                case LockType.ArchetypeOr:
                    return CheckArchetypeOr(stageLock, archetypeCounts);

                case LockType.ElementCount:
                    return CheckElementCount(stageLock, elementCounts);

                case LockType.ElementDual:
                    return CheckElementDual(elementCounts);

                case LockType.ElementMin:
                    return CheckElementMin(stageLock, elementCounts);

                case LockType.NoElementSynergy:
                    return CheckNoElementSynergy(elementCounts);

                case LockType.ArchetypeDeep:
                    return CheckArchetypeDeep(stageLock, archetypeCounts);

                case LockType.Compound:
                    return CheckCompound(stageLock, archetypeCounts, elementCounts);

                default:
                    return LockCheckResult.Pass();
            }
        }

        /// <summary>Convenience overload using IMissionProgress.</summary>
        public static LockCheckResult CheckLock(StageLock stageLock, IMissionProgress progress)
        {
            return CheckLock(stageLock, progress.GetTeamArchetypeCounts(), progress.GetTeamElementCounts());
        }

        private static LockCheckResult CheckArchetype(StageLock lock_, Dictionary<string, int> archetypeCounts)
        {
            int have = archetypeCounts.TryGetValue(lock_.ArchetypeValue, out int c) ? c : 0;
            if (have >= lock_.Count)
                return LockCheckResult.Pass();
            return LockCheckResult.Fail($"Need {lock_.Count} {lock_.ArchetypeValue} units (have {have})");
        }

        private static LockCheckResult CheckArchetypeOr(StageLock lock_, Dictionary<string, int> archetypeCounts)
        {
            int total = 0;
            foreach (var arch in lock_.ArchetypeValues)
            {
                if (archetypeCounts.TryGetValue(arch, out int c))
                    total += c;
            }
            if (total >= lock_.Count)
                return LockCheckResult.Pass();
            return LockCheckResult.Fail($"Need {lock_.Count} {string.Join("/", lock_.ArchetypeValues)} units (have {total})");
        }

        private static LockCheckResult CheckElementCount(StageLock lock_, Dictionary<string, int> elementCounts)
        {
            int unique = elementCounts.Count;
            if (unique >= lock_.Count)
                return LockCheckResult.Pass();
            return LockCheckResult.Fail($"Need {lock_.Count} different elements (have {unique})");
        }

        private static LockCheckResult CheckElementDual(Dictionary<string, int> elementCounts)
        {
            int unique = elementCounts.Count;
            if (unique == 2)
                return LockCheckResult.Pass();
            return LockCheckResult.Fail($"Need exactly 2 elements (have {unique})");
        }

        private static LockCheckResult CheckElementMin(StageLock lock_, Dictionary<string, int> elementCounts)
        {
            int unique = elementCounts.Count;
            if (unique >= lock_.Count)
                return LockCheckResult.Pass();
            return LockCheckResult.Fail($"Need {lock_.Count}+ different elements (have {unique})");
        }

        private static LockCheckResult CheckNoElementSynergy(Dictionary<string, int> elementCounts)
        {
            foreach (var kvp in elementCounts)
            {
                if (kvp.Value > 1)
                    return LockCheckResult.Fail($"Max 1 unit per element (have {kvp.Value} {kvp.Key})");
            }
            return LockCheckResult.Pass();
        }

        private static LockCheckResult CheckArchetypeDeep(StageLock lock_, Dictionary<string, int> archetypeCounts)
        {
            foreach (var kvp in archetypeCounts)
            {
                if (kvp.Value >= lock_.Count)
                    return LockCheckResult.Pass();
            }
            return LockCheckResult.Fail($"Need {lock_.Count} of any single archetype");
        }

        private static LockCheckResult CheckCompound(StageLock lock_, Dictionary<string, int> archetypeCounts, Dictionary<string, int> elementCounts)
        {
            if (lock_.Constraints == null || lock_.Constraints.Count == 0)
                return LockCheckResult.Pass();

            var reasons = new List<string>();
            foreach (var constraint in lock_.Constraints)
            {
                var result = CheckLock(constraint, archetypeCounts, elementCounts);
                if (!result.Passed)
                    reasons.Add(result.Reason);
            }

            if (reasons.Count == 0)
                return LockCheckResult.Pass();

            return LockCheckResult.Fail(string.Join(" + ", reasons));
        }
    }
}

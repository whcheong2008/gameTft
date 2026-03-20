using System.Collections.Generic;
using System.Linq;

namespace ShatteredVeil.Core.Missions
{
    /// <summary>
    /// Handles mission progression: stage unlocking, star ratings, region completion.
    /// Pure C# — no Unity dependencies. Reads state via IMissionProgress interface.
    /// </summary>
    public static class MissionProgressSystem
    {
        /// <summary>
        /// A stage is unlocked if:
        /// 1. Player level >= stage.RequiredLevel
        /// 2. All previous stages in the same region are completed (sequential unlock)
        /// 3. Region is unlocked (R1 always; R2+ requires previous region boss cleared)
        /// </summary>
        public static bool IsStageUnlocked(IMissionProgress progress, string stageId)
        {
            var stage = MissionCatalog.GetStage(stageId);
            if (stage == null) return false;

            // Level check
            if (progress.PlayerLevel < stage.RequiredLevel) return false;

            // Region unlock check
            if (!IsRegionUnlocked(progress, stage.Region)) return false;

            // Sequential unlock: all prior stages in this region must be completed
            var region = MissionCatalog.GetRegion(stage.Region);
            if (region == null) return false;

            foreach (var sid in region.StageIds)
            {
                if (sid == stageId) break; // reached our stage — all prior are completed
                if (!progress.CompletedStageIds.Contains(sid)) return false;
            }

            return true;
        }

        /// <summary>
        /// Region 1 is always unlocked. Region N requires boss of region N-1 cleared.
        /// </summary>
        public static bool IsRegionUnlocked(IMissionProgress progress, int regionNumber)
        {
            if (regionNumber <= 1) return true;

            // Previous region boss must be cleared
            var prevRegion = MissionCatalog.GetRegion(regionNumber - 1);
            if (prevRegion == null) return false;

            var bossId = prevRegion.StageIds[prevRegion.StageIds.Length - 1];
            return progress.CompletedStageIds.Contains(bossId);
        }

        /// <summary>Check if a stage has been completed (exists in completed set).</summary>
        public static bool IsStageCompleted(IMissionProgress progress, string stageId)
        {
            return progress.CompletedStageIds.Contains(stageId);
        }

        /// <summary>Get best star rating for a stage (0 if not completed).</summary>
        public static int GetStarRating(IMissionProgress progress, string stageId)
        {
            return progress.StarRatings.TryGetValue(stageId, out int stars) ? stars : 0;
        }

        /// <summary>Get total stars earned across all stages.</summary>
        public static int GetTotalStars(IMissionProgress progress)
        {
            int total = 0;
            foreach (var kvp in progress.StarRatings)
                total += kvp.Value;
            return total;
        }

        /// <summary>Get maximum possible stars (3 per stage).</summary>
        public static int GetMaxPossibleStars()
        {
            return MissionCatalog.TotalStageCount * 3;
        }

        /// <summary>Get status of all 8 regions.</summary>
        public static List<RegionStatus> GetRegionStatuses(IMissionProgress progress)
        {
            var statuses = new List<RegionStatus>();

            for (int r = 1; r <= MissionCatalog.RegionCount; r++)
            {
                var region = MissionCatalog.GetRegion(r);
                if (region == null) continue;

                int completed = 0;
                bool bossCleared = false;

                foreach (var sid in region.StageIds)
                {
                    if (progress.CompletedStageIds.Contains(sid))
                    {
                        completed++;
                        var stage = MissionCatalog.GetStage(sid);
                        if (stage != null && stage.IsBoss)
                            bossCleared = true;
                    }
                }

                statuses.Add(new RegionStatus
                {
                    RegionNumber = r,
                    Name = region.Name,
                    Subtitle = region.Subtitle,
                    CompletedStages = completed,
                    TotalStages = region.StageIds.Length,
                    BossCleared = bossCleared,
                    Complete = completed == region.StageIds.Length,
                    RewardClaimed = progress.ClaimedRegionRewards.Contains(r.ToString()),
                    RewardDescription = region.Reward.Description
                });
            }

            return statuses;
        }

        /// <summary>
        /// Calculate star rating for a battle result.
        /// 3 stars: no units lost, low damage taken
        /// 2 stars: 1 unit lost or moderate damage
        /// 1 star: completed but with heavy losses
        /// </summary>
        public static int CalculateStarRating(int unitsLost, float damagePercent)
        {
            if (unitsLost == 0 && damagePercent < 0.3f) return 3;
            if (unitsLost <= 1 && damagePercent < 0.6f) return 2;
            return 1;
        }

        /// <summary>Get total stars earned in a specific region.</summary>
        public static int GetRegionStars(IMissionProgress progress, int regionNumber)
        {
            var region = MissionCatalog.GetRegion(regionNumber);
            if (region == null) return 0;

            int total = 0;
            foreach (var sid in region.StageIds)
            {
                if (progress.StarRatings.TryGetValue(sid, out int stars))
                    total += stars;
            }
            return total;
        }

        /// <summary>Get max possible stars for a region (3 per stage).</summary>
        public static int GetRegionMaxStars(int regionNumber)
        {
            var region = MissionCatalog.GetRegion(regionNumber);
            return region != null ? region.StageIds.Length * 3 : 0;
        }

        /// <summary>Check if a region reward can be claimed (all stages complete, not yet claimed).</summary>
        public static bool CanClaimRegionReward(IMissionProgress progress, int regionNumber)
        {
            var region = MissionCatalog.GetRegion(regionNumber);
            if (region == null) return false;

            // All stages must be completed
            foreach (var sid in region.StageIds)
            {
                if (!progress.CompletedStageIds.Contains(sid)) return false;
            }

            // Not already claimed
            return !progress.ClaimedRegionRewards.Contains(regionNumber.ToString());
        }

        /// <summary>Get the next uncompleted stage in a region (for "continue" button).</summary>
        public static string GetNextStageInRegion(IMissionProgress progress, int regionNumber)
        {
            var region = MissionCatalog.GetRegion(regionNumber);
            if (region == null) return null;

            foreach (var sid in region.StageIds)
            {
                if (!progress.CompletedStageIds.Contains(sid)) return sid;
            }

            return null; // all complete
        }

        /// <summary>Get overall campaign progress as a percentage (0-100).</summary>
        public static float GetCampaignProgress(IMissionProgress progress)
        {
            if (MissionCatalog.TotalStageCount == 0) return 0f;
            int completed = 0;
            foreach (var stage in MissionCatalog.AllStages)
            {
                if (progress.CompletedStageIds.Contains(stage.Id))
                    completed++;
            }
            return (completed * 100f) / MissionCatalog.TotalStageCount;
        }
    }
}

using System.Collections.Generic;
using NUnit.Framework;
using ShatteredVeil.Core.Missions;

namespace ShatteredVeil.Tests.EditMode.Missions
{
    /// <summary>
    /// Test helper: mock implementation of IMissionProgress for testing.
    /// </summary>
    public class MockMissionProgress : IMissionProgress
    {
        public int PlayerLevel { get; set; } = 1;
        public HashSet<string> CompletedStageIds { get; set; } = new HashSet<string>();
        public Dictionary<string, int> StarRatings { get; set; } = new Dictionary<string, int>();
        public HashSet<string> ClaimedRegionRewards { get; set; } = new HashSet<string>();

        private Dictionary<string, int> _archetypeCounts = new Dictionary<string, int>();
        private Dictionary<string, int> _elementCounts = new Dictionary<string, int>();

        public Dictionary<string, int> GetTeamArchetypeCounts() => _archetypeCounts;
        public Dictionary<string, int> GetTeamElementCounts() => _elementCounts;

        public void SetArchetypes(Dictionary<string, int> counts) => _archetypeCounts = counts;
        public void SetElements(Dictionary<string, int> counts) => _elementCounts = counts;
    }

    [TestFixture]
    public class MissionCatalogTests
    {
        [Test]
        public void Catalog_Has74Stages()
        {
            Assert.AreEqual(74, MissionCatalog.TotalStageCount);
        }

        [Test]
        public void Catalog_Has8Regions()
        {
            Assert.AreEqual(8, MissionCatalog.RegionCount);
            for (int r = 1; r <= 8; r++)
            {
                var region = MissionCatalog.GetRegion(r);
                Assert.IsNotNull(region, $"Region {r} should exist");
            }
        }

        [Test]
        public void Region_StageCountsMatchExpected()
        {
            // Structure: 9-9-9-9-10-10-10-8
            int[] expected = { 9, 9, 9, 9, 10, 10, 10, 8 };
            for (int r = 1; r <= 8; r++)
            {
                var region = MissionCatalog.GetRegion(r);
                Assert.AreEqual(expected[r - 1], region.StageIds.Length,
                    $"Region {r} should have {expected[r - 1]} stages");
            }
        }

        [Test]
        public void EachRegion_EndsWithBossStage()
        {
            for (int r = 1; r <= 8; r++)
            {
                var region = MissionCatalog.GetRegion(r);
                var lastId = region.StageIds[region.StageIds.Length - 1];
                var lastStage = MissionCatalog.GetStage(lastId);
                Assert.IsTrue(lastStage.IsBoss, $"Region {r} last stage should be boss");
                Assert.IsTrue(lastId.Contains("boss"), $"Region {r} boss ID should contain 'boss'");
            }
        }

        [Test]
        public void AllStages_HaveUniqueIds()
        {
            var ids = new HashSet<string>();
            foreach (var stage in MissionCatalog.AllStages)
            {
                Assert.IsTrue(ids.Add(stage.Id), $"Duplicate stage ID: {stage.Id}");
            }
        }

        [Test]
        public void GetStage_ReturnsCorrectStage()
        {
            var stage = MissionCatalog.GetStage("r1_s1");
            Assert.IsNotNull(stage);
            Assert.AreEqual("First Steps", stage.Name);
            Assert.AreEqual(1, stage.Region);
        }

        [Test]
        public void GetStage_ReturnsNullForInvalidId()
        {
            Assert.IsNull(MissionCatalog.GetStage("nonexistent"));
        }

        [Test]
        public void BossStages_HaveBossKeys()
        {
            foreach (var stage in MissionCatalog.AllStages)
            {
                if (stage.IsBoss)
                {
                    Assert.IsNotNull(stage.BossKey, $"Boss stage {stage.Id} should have a boss key");
                    Assert.IsNotEmpty(stage.BossKey);
                }
            }
        }

        [Test]
        public void VERewards_MatchGroundTruth()
        {
            // From GROUND-TRUTH.md section 13
            Assert.AreEqual(200, MissionCatalog.VEPerStage[1]);
            Assert.AreEqual(350, MissionCatalog.VEPerStage[2]);
            Assert.AreEqual(550, MissionCatalog.VEPerStage[3]);
            Assert.AreEqual(750, MissionCatalog.VEPerStage[4]);
            Assert.AreEqual(1000, MissionCatalog.VEPerStage[5]);
            Assert.AreEqual(1300, MissionCatalog.VEPerStage[6]);
            Assert.AreEqual(1600, MissionCatalog.VEPerStage[7]);
            Assert.AreEqual(2000, MissionCatalog.VEPerStage[8]);
        }

        [Test]
        public void BossVE_MatchGroundTruth()
        {
            Assert.AreEqual(500, MissionCatalog.BossVEPerRegion[1]);
            Assert.AreEqual(700, MissionCatalog.BossVEPerRegion[2]);
            Assert.AreEqual(1100, MissionCatalog.BossVEPerRegion[3]);
            Assert.AreEqual(1500, MissionCatalog.BossVEPerRegion[4]);
            Assert.AreEqual(2000, MissionCatalog.BossVEPerRegion[5]);
            Assert.AreEqual(2600, MissionCatalog.BossVEPerRegion[6]);
            Assert.AreEqual(3200, MissionCatalog.BossVEPerRegion[7]);
            Assert.AreEqual(4000, MissionCatalog.BossVEPerRegion[8]);
        }

        [Test]
        public void Region1_AllStages_RequireLowLevels()
        {
            var region = MissionCatalog.GetRegion(1);
            foreach (var sid in region.StageIds)
            {
                var stage = MissionCatalog.GetStage(sid);
                Assert.LessOrEqual(stage.RequiredLevel, 4,
                    $"R1 stage {stage.Name} required level should be <= 4");
            }
        }

        [Test]
        public void AllStages_HaveRewards()
        {
            foreach (var stage in MissionCatalog.AllStages)
            {
                Assert.IsNotNull(stage.Rewards, $"Stage {stage.Id} should have rewards");
                Assert.Greater(stage.Rewards.VE, 0, $"Stage {stage.Id} should give VE");
                Assert.Greater(stage.Rewards.XP, 0, $"Stage {stage.Id} should give XP");
            }
        }

        [Test]
        public void AllRegions_HaveRewards()
        {
            for (int r = 1; r <= 8; r++)
            {
                var region = MissionCatalog.GetRegion(r);
                Assert.IsNotNull(region.Reward, $"Region {r} should have reward");
                Assert.IsNotEmpty(region.Reward.Description, $"Region {r} reward should have description");
            }
        }
    }

    [TestFixture]
    public class MissionProgressTests
    {
        [Test]
        public void Region1_AlwaysUnlocked()
        {
            var progress = new MockMissionProgress { PlayerLevel = 1 };
            Assert.IsTrue(MissionProgressSystem.IsRegionUnlocked(progress, 1));
        }

        [Test]
        public void Region2_LockedUntilR1BossCleared()
        {
            var progress = new MockMissionProgress { PlayerLevel = 30 };
            Assert.IsFalse(MissionProgressSystem.IsRegionUnlocked(progress, 2));

            progress.CompletedStageIds.Add("r1_boss");
            Assert.IsTrue(MissionProgressSystem.IsRegionUnlocked(progress, 2));
        }

        [Test]
        public void FirstStage_UnlockedAtLevel1()
        {
            var progress = new MockMissionProgress { PlayerLevel = 1 };
            Assert.IsTrue(MissionProgressSystem.IsStageUnlocked(progress, "r1_s1"));
        }

        [Test]
        public void SecondStage_RequiresFirstCompleted()
        {
            var progress = new MockMissionProgress { PlayerLevel = 5 };
            Assert.IsFalse(MissionProgressSystem.IsStageUnlocked(progress, "r1_s2"));

            progress.CompletedStageIds.Add("r1_s1");
            Assert.IsTrue(MissionProgressSystem.IsStageUnlocked(progress, "r1_s2"));
        }

        [Test]
        public void Stage_LockedByLevel()
        {
            var progress = new MockMissionProgress { PlayerLevel = 1 };
            // r1_s3 requires level 2
            progress.CompletedStageIds.Add("r1_s1");
            progress.CompletedStageIds.Add("r1_s2");
            Assert.IsFalse(MissionProgressSystem.IsStageUnlocked(progress, "r1_s3"));

            progress.PlayerLevel = 2;
            Assert.IsTrue(MissionProgressSystem.IsStageUnlocked(progress, "r1_s3"));
        }

        [Test]
        public void R2Stage_RequiresR1BossAndSequential()
        {
            var progress = new MockMissionProgress { PlayerLevel = 10 };
            // R2 S1 requires R1 boss cleared + level 5
            Assert.IsFalse(MissionProgressSystem.IsStageUnlocked(progress, "r2_s1"));

            // Clear all R1 stages
            progress.CompletedStageIds.Add("r1_boss");
            Assert.IsTrue(MissionProgressSystem.IsStageUnlocked(progress, "r2_s1"));
        }

        [Test]
        public void StarRating_3Stars_NoUnitsLost_LowDamage()
        {
            Assert.AreEqual(3, MissionProgressSystem.CalculateStarRating(0, 0.1f));
            Assert.AreEqual(3, MissionProgressSystem.CalculateStarRating(0, 0.29f));
        }

        [Test]
        public void StarRating_2Stars_OneUnitLost()
        {
            Assert.AreEqual(2, MissionProgressSystem.CalculateStarRating(1, 0.4f));
            Assert.AreEqual(2, MissionProgressSystem.CalculateStarRating(0, 0.5f));
        }

        [Test]
        public void StarRating_1Star_HeavyLosses()
        {
            Assert.AreEqual(1, MissionProgressSystem.CalculateStarRating(3, 0.8f));
            Assert.AreEqual(1, MissionProgressSystem.CalculateStarRating(2, 0.7f));
        }

        [Test]
        public void GetTotalStars_SumsAllRatings()
        {
            var progress = new MockMissionProgress();
            progress.StarRatings["r1_s1"] = 3;
            progress.StarRatings["r1_s2"] = 2;
            progress.StarRatings["r1_s3"] = 1;

            Assert.AreEqual(6, MissionProgressSystem.GetTotalStars(progress));
        }

        [Test]
        public void MaxPossibleStars_Is222()
        {
            // 74 stages * 3 stars = 222
            Assert.AreEqual(222, MissionProgressSystem.GetMaxPossibleStars());
        }

        [Test]
        public void RegionStatus_ShowsProgress()
        {
            var progress = new MockMissionProgress { PlayerLevel = 5 };
            progress.CompletedStageIds.Add("r1_s1");
            progress.CompletedStageIds.Add("r1_s2");

            var statuses = MissionProgressSystem.GetRegionStatuses(progress);
            Assert.AreEqual(8, statuses.Count);

            var r1 = statuses[0];
            Assert.AreEqual(1, r1.RegionNumber);
            Assert.AreEqual("The Frontier", r1.Name);
            Assert.AreEqual(2, r1.CompletedStages);
            Assert.AreEqual(9, r1.TotalStages);
            Assert.IsFalse(r1.Complete);
            Assert.IsFalse(r1.BossCleared);
        }

        [Test]
        public void CanClaimRegionReward_WhenAllComplete()
        {
            var progress = new MockMissionProgress { PlayerLevel = 10 };
            Assert.IsFalse(MissionProgressSystem.CanClaimRegionReward(progress, 1));

            // Complete all R1 stages
            var r1 = MissionCatalog.GetRegion(1);
            foreach (var sid in r1.StageIds)
                progress.CompletedStageIds.Add(sid);

            Assert.IsTrue(MissionProgressSystem.CanClaimRegionReward(progress, 1));

            // Claim it
            progress.ClaimedRegionRewards.Add("1");
            Assert.IsFalse(MissionProgressSystem.CanClaimRegionReward(progress, 1));
        }

        [Test]
        public void GetNextStage_ReturnsFirstIncomplete()
        {
            var progress = new MockMissionProgress { PlayerLevel = 5 };
            Assert.AreEqual("r1_s1", MissionProgressSystem.GetNextStageInRegion(progress, 1));

            progress.CompletedStageIds.Add("r1_s1");
            Assert.AreEqual("r1_s2", MissionProgressSystem.GetNextStageInRegion(progress, 1));
        }

        [Test]
        public void GetNextStage_ReturnsNull_WhenAllComplete()
        {
            var progress = new MockMissionProgress { PlayerLevel = 10 };
            var r1 = MissionCatalog.GetRegion(1);
            foreach (var sid in r1.StageIds)
                progress.CompletedStageIds.Add(sid);

            Assert.IsNull(MissionProgressSystem.GetNextStageInRegion(progress, 1));
        }

        [Test]
        public void CampaignProgress_CalculatesCorrectly()
        {
            var progress = new MockMissionProgress();
            Assert.AreEqual(0f, MissionProgressSystem.GetCampaignProgress(progress), 0.01f);

            // Complete 1 of 74 stages
            progress.CompletedStageIds.Add("r1_s1");
            float expected = 100f / 74f;
            Assert.AreEqual(expected, MissionProgressSystem.GetCampaignProgress(progress), 0.1f);
        }

        [Test]
        public void GetRegionStars_SumsCorrectly()
        {
            var progress = new MockMissionProgress();
            progress.StarRatings["r1_s1"] = 3;
            progress.StarRatings["r1_s2"] = 2;
            progress.StarRatings["r2_s1"] = 1;

            Assert.AreEqual(5, MissionProgressSystem.GetRegionStars(progress, 1));
            Assert.AreEqual(1, MissionProgressSystem.GetRegionStars(progress, 2));
            Assert.AreEqual(0, MissionProgressSystem.GetRegionStars(progress, 3));
        }

        [Test]
        public void RegionMaxStars_Is3PerStage()
        {
            Assert.AreEqual(27, MissionProgressSystem.GetRegionMaxStars(1)); // 9 * 3
            Assert.AreEqual(30, MissionProgressSystem.GetRegionMaxStars(5)); // 10 * 3
            Assert.AreEqual(24, MissionProgressSystem.GetRegionMaxStars(8)); // 8 * 3
        }
    }

    [TestFixture]
    public class LockSystemTests
    {
        [Test]
        public void NoLock_AlwaysPasses()
        {
            var result = LockSystem.CheckLock(StageLock.None(),
                new Dictionary<string, int>(), new Dictionary<string, int>());
            Assert.IsTrue(result.Passed);
        }

        [Test]
        public void NullLock_AlwaysPasses()
        {
            var result = LockSystem.CheckLock(null,
                new Dictionary<string, int>(), new Dictionary<string, int>());
            Assert.IsTrue(result.Passed);
        }

        [Test]
        public void ArchetypeLock_PassesWhenMet()
        {
            var archetypes = new Dictionary<string, int> { { "guardian", 2 }, { "ranger", 1 } };
            var result = LockSystem.CheckLock(StageLock.Archetype("guardian", 2),
                archetypes, new Dictionary<string, int>());
            Assert.IsTrue(result.Passed);
        }

        [Test]
        public void ArchetypeLock_FailsWhenNotMet()
        {
            var archetypes = new Dictionary<string, int> { { "guardian", 1 }, { "ranger", 1 } };
            var result = LockSystem.CheckLock(StageLock.Archetype("guardian", 2),
                archetypes, new Dictionary<string, int>());
            Assert.IsFalse(result.Passed);
            Assert.IsTrue(result.Reason.Contains("guardian"));
        }

        [Test]
        public void ArchetypeOrLock_PassesWithEither()
        {
            var archetypes = new Dictionary<string, int> { { "sorcerer", 1 }, { "mystic", 1 } };
            var result = LockSystem.CheckLock(
                StageLock.ArchetypeOr(new[] { "sorcerer", "mystic" }, 2),
                archetypes, new Dictionary<string, int>());
            Assert.IsTrue(result.Passed);
        }

        [Test]
        public void ArchetypeOrLock_FailsWhenInsufficient()
        {
            var archetypes = new Dictionary<string, int> { { "sorcerer", 1 } };
            var result = LockSystem.CheckLock(
                StageLock.ArchetypeOr(new[] { "sorcerer", "mystic" }, 2),
                archetypes, new Dictionary<string, int>());
            Assert.IsFalse(result.Passed);
        }

        [Test]
        public void ElementCountLock_PassesWithEnoughElements()
        {
            var elements = new Dictionary<string, int> { { "fire", 2 }, { "water", 1 } };
            var result = LockSystem.CheckLock(StageLock.ElementCount(2),
                new Dictionary<string, int>(), elements);
            Assert.IsTrue(result.Passed);
        }

        [Test]
        public void ElementCountLock_FailsWithTooFew()
        {
            var elements = new Dictionary<string, int> { { "fire", 3 } };
            var result = LockSystem.CheckLock(StageLock.ElementCount(2),
                new Dictionary<string, int>(), elements);
            Assert.IsFalse(result.Passed);
        }

        [Test]
        public void ElementDualLock_PassesWithExactly2()
        {
            var elements = new Dictionary<string, int> { { "fire", 2 }, { "water", 2 } };
            var result = LockSystem.CheckLock(StageLock.ElementDual(),
                new Dictionary<string, int>(), elements);
            Assert.IsTrue(result.Passed);
        }

        [Test]
        public void ElementDualLock_FailsWith1Or3Elements()
        {
            var one = new Dictionary<string, int> { { "fire", 4 } };
            var three = new Dictionary<string, int> { { "fire", 1 }, { "water", 1 }, { "earth", 1 } };

            Assert.IsFalse(LockSystem.CheckLock(StageLock.ElementDual(),
                new Dictionary<string, int>(), one).Passed);
            Assert.IsFalse(LockSystem.CheckLock(StageLock.ElementDual(),
                new Dictionary<string, int>(), three).Passed);
        }

        [Test]
        public void ElementMinLock_PassesWithEnough()
        {
            var elements = new Dictionary<string, int> { { "fire", 1 }, { "water", 1 }, { "earth", 1 }, { "wind", 1 } };
            var result = LockSystem.CheckLock(StageLock.ElementMin(4),
                new Dictionary<string, int>(), elements);
            Assert.IsTrue(result.Passed);
        }

        [Test]
        public void NoElementSynergyLock_PassesWithAllUnique()
        {
            var elements = new Dictionary<string, int> { { "fire", 1 }, { "water", 1 }, { "earth", 1 } };
            var result = LockSystem.CheckLock(StageLock.NoElementSynergy(),
                new Dictionary<string, int>(), elements);
            Assert.IsTrue(result.Passed);
        }

        [Test]
        public void NoElementSynergyLock_FailsWithDuplicates()
        {
            var elements = new Dictionary<string, int> { { "fire", 2 }, { "water", 1 } };
            var result = LockSystem.CheckLock(StageLock.NoElementSynergy(),
                new Dictionary<string, int>(), elements);
            Assert.IsFalse(result.Passed);
            Assert.IsTrue(result.Reason.Contains("fire"));
        }

        [Test]
        public void ArchetypeDeepLock_PassesWithDeepStack()
        {
            var archetypes = new Dictionary<string, int> { { "guardian", 3 }, { "ranger", 1 } };
            var result = LockSystem.CheckLock(StageLock.ArchetypeDeep(3),
                archetypes, new Dictionary<string, int>());
            Assert.IsTrue(result.Passed);
        }

        [Test]
        public void ArchetypeDeepLock_FailsWithShallowStacks()
        {
            var archetypes = new Dictionary<string, int> { { "guardian", 2 }, { "ranger", 2 } };
            var result = LockSystem.CheckLock(StageLock.ArchetypeDeep(3),
                archetypes, new Dictionary<string, int>());
            Assert.IsFalse(result.Passed);
        }

        [Test]
        public void CompoundLock_PassesWhenAllMet()
        {
            var archetypes = new Dictionary<string, int> { { "guardian", 2 }, { "predator", 2 } };
            var lock_ = StageLock.CompoundLock(new List<StageLock>
            {
                StageLock.Archetype("guardian", 2),
                StageLock.Archetype("predator", 2)
            });
            var result = LockSystem.CheckLock(lock_, archetypes, new Dictionary<string, int>());
            Assert.IsTrue(result.Passed);
        }

        [Test]
        public void CompoundLock_FailsWhenPartiallyMet()
        {
            var archetypes = new Dictionary<string, int> { { "guardian", 2 }, { "predator", 1 } };
            var lock_ = StageLock.CompoundLock(new List<StageLock>
            {
                StageLock.Archetype("guardian", 2),
                StageLock.Archetype("predator", 2)
            });
            var result = LockSystem.CheckLock(lock_, archetypes, new Dictionary<string, int>());
            Assert.IsFalse(result.Passed);
            Assert.IsTrue(result.Reason.Contains("predator"));
        }

        [Test]
        public void R2S1_Lock_MatchesJSDefinition()
        {
            // r2_s1 requires 2 guardians
            var stage = MissionCatalog.GetStage("r2_s1");
            Assert.AreEqual(LockType.Archetype, stage.Lock.Type);
            Assert.AreEqual("guardian", stage.Lock.ArchetypeValue);
            Assert.AreEqual(2, stage.Lock.Count);
        }

        [Test]
        public void R5S1_Lock_IsElementDual()
        {
            var stage = MissionCatalog.GetStage("r5_s1");
            Assert.AreEqual(LockType.ElementDual, stage.Lock.Type);
        }

        [Test]
        public void R7S2_Lock_IsNoElementSynergy()
        {
            var stage = MissionCatalog.GetStage("r7_s2");
            Assert.AreEqual(LockType.NoElementSynergy, stage.Lock.Type);
        }

        [Test]
        public void LockCheckResult_HasMeaningfulReasons()
        {
            var archetypes = new Dictionary<string, int> { { "guardian", 0 } };
            var result = LockSystem.CheckLock(StageLock.Archetype("guardian", 2),
                archetypes, new Dictionary<string, int>());
            Assert.IsFalse(result.Passed);
            Assert.IsTrue(result.Reason.Contains("2"));
            Assert.IsTrue(result.Reason.Contains("guardian"));
        }
    }
}

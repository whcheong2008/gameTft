using System.Collections.Generic;
using NUnit.Framework;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Tests.EditMode.Combat
{
    [TestFixture]
    public class CombatResultCalculatorTests
    {
        // ===== Star Rating Tests =====

        [Test]
        public void StarRating_3Stars_NoLosses_LowDamage()
        {
            Assert.AreEqual(3, CombatResultCalculator.CalculateStarRating(0, 0.0f));
            Assert.AreEqual(3, CombatResultCalculator.CalculateStarRating(0, 0.1f));
            Assert.AreEqual(3, CombatResultCalculator.CalculateStarRating(0, 0.29f));
        }

        [Test]
        public void StarRating_2Stars_OneLost_ModerateDamage()
        {
            Assert.AreEqual(2, CombatResultCalculator.CalculateStarRating(0, 0.3f));
            Assert.AreEqual(2, CombatResultCalculator.CalculateStarRating(0, 0.5f));
            Assert.AreEqual(2, CombatResultCalculator.CalculateStarRating(1, 0.2f));
            Assert.AreEqual(2, CombatResultCalculator.CalculateStarRating(1, 0.59f));
        }

        [Test]
        public void StarRating_1Star_HeavyLosses()
        {
            Assert.AreEqual(1, CombatResultCalculator.CalculateStarRating(2, 0.0f));
            Assert.AreEqual(1, CombatResultCalculator.CalculateStarRating(1, 0.6f));
            Assert.AreEqual(1, CombatResultCalculator.CalculateStarRating(3, 0.9f));
            Assert.AreEqual(1, CombatResultCalculator.CalculateStarRating(5, 1.0f));
        }

        [Test]
        public void StarRating_Boundary_30Percent()
        {
            // Exactly 30% damage: should be 2 stars (not 3)
            Assert.AreEqual(2, CombatResultCalculator.CalculateStarRating(0, 0.3f));
        }

        [Test]
        public void StarRating_Boundary_60Percent()
        {
            // Exactly 60% damage with 1 unit lost: should be 1 star
            Assert.AreEqual(1, CombatResultCalculator.CalculateStarRating(1, 0.6f));
        }

        // ===== MVP Tests =====

        [Test]
        public void GetMVP_ReturnsHighestScorePlayer()
        {
            var stats = new Dictionary<string, UnitCombatStats>
            {
                ["p1"] = new UnitCombatStats { UnitId = "p1", UnitName = "A", Side = "player", DamageDealt = 100, Kills = 0 },
                ["p2"] = new UnitCombatStats { UnitId = "p2", UnitName = "B", Side = "player", DamageDealt = 50, Kills = 2 },
                ["e1"] = new UnitCombatStats { UnitId = "e1", UnitName = "C", Side = "enemy", DamageDealt = 500, Kills = 5 }
            };

            var mvp = CombatResultCalculator.GetMVP(stats);

            // p2: 50 + 2*100 = 250, p1: 100 + 0 = 100
            Assert.AreEqual("p2", mvp.UnitId);
        }

        [Test]
        public void GetMVP_IgnoresEnemyUnits()
        {
            var stats = new Dictionary<string, UnitCombatStats>
            {
                ["p1"] = new UnitCombatStats { UnitId = "p1", UnitName = "A", Side = "player", DamageDealt = 10, Kills = 0 },
                ["e1"] = new UnitCombatStats { UnitId = "e1", UnitName = "B", Side = "enemy", DamageDealt = 999, Kills = 99 }
            };

            var mvp = CombatResultCalculator.GetMVP(stats);
            Assert.AreEqual("p1", mvp.UnitId);
        }

        [Test]
        public void GetMVP_EmptyStats_ReturnsNull()
        {
            var stats = new Dictionary<string, UnitCombatStats>();
            Assert.IsNull(CombatResultCalculator.GetMVP(stats));
        }

        [Test]
        public void GetMVP_OnlyEnemies_ReturnsNull()
        {
            var stats = new Dictionary<string, UnitCombatStats>
            {
                ["e1"] = new UnitCombatStats { UnitId = "e1", Side = "enemy", DamageDealt = 100 }
            };
            Assert.IsNull(CombatResultCalculator.GetMVP(stats));
        }

        // ===== Rewards Tests =====

        [Test]
        public void CalculateRewards_Victory_3Stars_BonusDrops()
        {
            var stats = new Dictionary<string, UnitCombatStats>
            {
                ["p1"] = new UnitCombatStats { UnitId = "p1", UnitName = "Hero", Side = "player", DamageDealt = 100, Kills = 3 }
            };

            var rewards = CombatResultCalculator.CalculateRewards(true, 3, 500, 200, 2, stats);

            Assert.AreEqual(750, rewards.VE); // 500 * 1.5 (3 stars = 1.5x)
            Assert.AreEqual(300, rewards.XP); // 200 * 1.5
            Assert.AreEqual(3, rewards.UnitDropCount); // 2 + 1 bonus for 3 stars
            Assert.AreEqual("Hero", rewards.MVPUnitName);
        }

        [Test]
        public void CalculateRewards_Victory_2Stars_StandardDrops()
        {
            var stats = new Dictionary<string, UnitCombatStats>
            {
                ["p1"] = new UnitCombatStats { UnitId = "p1", UnitName = "A", Side = "player" }
            };

            var rewards = CombatResultCalculator.CalculateRewards(true, 2, 500, 200, 2, stats);

            Assert.AreEqual(625, rewards.VE); // 500 * 1.25
            Assert.AreEqual(250, rewards.XP); // 200 * 1.25
            Assert.AreEqual(2, rewards.UnitDropCount); // no bonus for < 3 stars
        }

        [Test]
        public void CalculateRewards_Victory_1Star_BaseDrops()
        {
            var stats = new Dictionary<string, UnitCombatStats>
            {
                ["p1"] = new UnitCombatStats { UnitId = "p1", UnitName = "A", Side = "player" }
            };

            var rewards = CombatResultCalculator.CalculateRewards(true, 1, 500, 200, 2, stats);

            Assert.AreEqual(500, rewards.VE); // 500 * 1.0
            Assert.AreEqual(200, rewards.XP); // 200 * 1.0
            Assert.AreEqual(2, rewards.UnitDropCount);
        }

        [Test]
        public void CalculateRewards_Defeat_PartialRewards()
        {
            var stats = new Dictionary<string, UnitCombatStats>
            {
                ["p1"] = new UnitCombatStats { UnitId = "p1", UnitName = "A", Side = "player" }
            };

            var rewards = CombatResultCalculator.CalculateRewards(false, 0, 500, 200, 2, stats);

            Assert.AreEqual(125, rewards.VE); // 500 / 4
            Assert.AreEqual(50, rewards.XP); // 200 / 4
            Assert.AreEqual(0, rewards.UnitDropCount);
        }

        // ===== Summary Generation Tests =====

        [Test]
        public void GenerateResultSummary_IncludesKeyInfo()
        {
            var stats = new Dictionary<string, UnitCombatStats>
            {
                ["p1"] = new UnitCombatStats
                {
                    UnitId = "p1", UnitName = "Flame Warrior", Side = "player",
                    DamageDealt = 500, HealingDone = 0, Kills = 3, IsAlive = true
                },
                ["p2"] = new UnitCombatStats
                {
                    UnitId = "p2", UnitName = "Ocean Sage", Side = "player",
                    DamageDealt = 100, HealingDone = 200, Kills = 0, IsAlive = true
                }
            };

            var rewards = new CombatRewards
            {
                VE = 750,
                XP = 300,
                UnitDropCount = 3,
                MVPUnitName = "Flame Warrior",
                MVPDamage = 500,
                MVPKills = 3
            };

            var summary = CombatResultCalculator.GenerateResultSummary(true, 3, rewards, stats);

            Assert.IsTrue(summary[0].Contains("VICTORY"));
            Assert.IsTrue(summary.Exists(s => s.Contains("750 VE")));
            Assert.IsTrue(summary.Exists(s => s.Contains("MVP")));
            Assert.IsTrue(summary.Exists(s => s.Contains("Flame Warrior")));
            Assert.IsTrue(summary.Exists(s => s.Contains("Ocean Sage")));
        }

        [Test]
        public void GenerateResultSummary_Defeat()
        {
            var stats = new Dictionary<string, UnitCombatStats>();
            var rewards = new CombatRewards { VE = 125, XP = 50 };

            var summary = CombatResultCalculator.GenerateResultSummary(false, 0, rewards, stats);

            Assert.IsTrue(summary[0].Contains("DEFEAT"));
        }

        [Test]
        public void GenerateResultSummary_MarksDeadUnits()
        {
            var stats = new Dictionary<string, UnitCombatStats>
            {
                ["p1"] = new UnitCombatStats
                {
                    UnitId = "p1", UnitName = "FallenHero", Side = "player",
                    IsAlive = false, DamageDealt = 50, Kills = 0
                }
            };

            var rewards = new CombatRewards { VE = 500, XP = 200 };

            var summary = CombatResultCalculator.GenerateResultSummary(true, 1, rewards, stats);

            Assert.IsTrue(summary.Exists(s => s.Contains("[DEAD]")));
        }
    }

    [TestFixture]
    public class UnitSnapshotTests
    {
        [Test]
        public void HPPercent_CalculatesCorrectly()
        {
            var snap = new UnitSnapshot { HP = 50, MaxHP = 200 };
            Assert.AreEqual(0.25f, snap.HPPercent, 0.001f);
        }

        [Test]
        public void HPPercent_ZeroMaxHP_ReturnsZero()
        {
            var snap = new UnitSnapshot { HP = 0, MaxHP = 0 };
            Assert.AreEqual(0f, snap.HPPercent, 0.001f);
        }

        [Test]
        public void ManaPercent_CalculatesCorrectly()
        {
            var snap = new UnitSnapshot { Mana = 30, MaxMana = 60 };
            Assert.AreEqual(0.5f, snap.ManaPercent, 0.001f);
        }

        [Test]
        public void ManaPercent_ZeroMaxMana_ReturnsZero()
        {
            var snap = new UnitSnapshot { Mana = 0, MaxMana = 0 };
            Assert.AreEqual(0f, snap.ManaPercent, 0.001f);
        }
    }

    [TestFixture]
    public class CombatEventTests
    {
        [Test]
        public void CombatEvent_AllProperties_Settable()
        {
            var evt = new CombatEvent
            {
                Type = CombatEventType.CriticalHit,
                Timestamp = 1.5f,
                WaveIndex = 0,
                TurnNumber = 10,
                SourceUnitId = "p1",
                SourceUnitName = "Flame Warrior",
                SourceSide = "player",
                TargetUnitId = "e1",
                TargetUnitName = "Void Spawn",
                TargetSide = "enemy",
                Value = 150f,
                IsCrit = true,
                Element = "fire",
                LogMessage = "Flame Warrior crits for 150!"
            };

            Assert.AreEqual(CombatEventType.CriticalHit, evt.Type);
            Assert.AreEqual(1.5f, evt.Timestamp, 0.001f);
            Assert.AreEqual("p1", evt.SourceUnitId);
            Assert.AreEqual(150f, evt.Value, 0.001f);
            Assert.IsTrue(evt.IsCrit);
        }
    }
}

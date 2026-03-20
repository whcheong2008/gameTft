using NUnit.Framework;
using ShatteredVeil.Core.Save;

namespace ShatteredVeil.Tests.EditMode.Save
{
    [TestFixture]
    public class SaveDataValidationTests
    {
        [Test]
        public void CreateNewSave_ProducesValidDefaults()
        {
            var data = SaveDefaults.CreateNewSave();

            Assert.IsNotNull(data);
            Assert.AreEqual(SaveMigrator.CURRENT_VERSION, data.Version);
            Assert.IsNotNull(data.Player);
            Assert.IsNotNull(data.Roster);
            Assert.IsNotNull(data.Teams);
            Assert.IsNotNull(data.Heroes);
            Assert.IsNotNull(data.Equipment);
            Assert.IsNotNull(data.Buildings);
            Assert.IsNotNull(data.Missions);
            Assert.IsNotNull(data.Achievements);
            Assert.IsNotNull(data.GachaStats);
        }

        [Test]
        public void Player_StartsAtLevel1_With500VE()
        {
            var data = SaveDefaults.CreateNewSave();

            Assert.AreEqual(1, data.Player.Level);
            Assert.AreEqual(0, data.Player.XP);
            Assert.AreEqual(500, data.Player.VeilEssence);
            Assert.AreEqual("Player", data.Player.Name);
        }

        [Test]
        public void Heroes_KaelAndLyricAvailable()
        {
            var data = SaveDefaults.CreateNewSave();

            Assert.AreEqual(6, data.Heroes.Length);

            // Kael: available (IsAbsent = false)
            var kael = FindHero(data, "kael");
            Assert.IsNotNull(kael, "Kael should exist in heroes");
            Assert.IsFalse(kael.IsAbsent, "Kael should be available");
            Assert.IsFalse(kael.IsDead);
            Assert.AreEqual(1, kael.Level);

            // Lyric: available (IsAbsent = false)
            var lyric = FindHero(data, "lyric");
            Assert.IsNotNull(lyric, "Lyric should exist in heroes");
            Assert.IsFalse(lyric.IsAbsent, "Lyric should be available");
            Assert.IsFalse(lyric.IsDead);
            Assert.AreEqual(1, lyric.Level);
        }

        [Test]
        public void Heroes_RenSeraMarenVoss_NotAvailable()
        {
            var data = SaveDefaults.CreateNewSave();

            Assert.IsTrue(FindHero(data, "ren").IsAbsent, "Ren should be absent");
            Assert.IsTrue(FindHero(data, "sera").IsAbsent, "Sera should be absent");
            Assert.IsTrue(FindHero(data, "maren").IsAbsent, "Maren should be absent");
            Assert.IsTrue(FindHero(data, "voss").IsAbsent, "Voss should be absent");
        }

        [Test]
        public void Roster_StarterSetOf10Units()
        {
            var data = SaveDefaults.CreateNewSave();

            Assert.AreEqual(10, data.Roster.Units.Length);

            var expectedUnits = new[]
            {
                "flame_warrior", "stone_guard", "frost_archer", "wind_squire",
                "pulse_mender", "fire_acolyte", "bramble_knight", "tide_hunter",
                "spark_fencer", "shadow_blade"
            };

            foreach (var expected in expectedUnits)
            {
                bool found = false;
                foreach (var unit in data.Roster.Units)
                {
                    if (unit.TemplateKey == expected)
                    {
                        found = true;
                        Assert.AreEqual(1, unit.Stars, $"{expected} should be 1 star");
                        Assert.AreEqual(0, unit.CopiesForNext, $"{expected} should have 0 copies for next");
                        break;
                    }
                }
                Assert.IsTrue(found, $"Starter unit {expected} not found in roster");
            }
        }

        [Test]
        public void Teams_EmptyByDefault()
        {
            var data = SaveDefaults.CreateNewSave();

            Assert.AreEqual(1, data.Teams.Length);
            Assert.AreEqual("Team 1", data.Teams[0].TeamName);
            Assert.AreEqual(0, data.Teams[0].Slots.Length);
            Assert.AreEqual(0, data.ActiveTeamIndex);
        }

        [Test]
        public void Buildings_AllAt0()
        {
            var data = SaveDefaults.CreateNewSave();

            Assert.AreEqual(8, data.Buildings.Length);

            foreach (var building in data.Buildings)
            {
                Assert.AreEqual(0, building.Level, $"Building {building.BuildingId} should start at level 0");
            }
        }

        [Test]
        public void Buildings_AllExpectedIdsPresent()
        {
            var data = SaveDefaults.CreateNewSave();

            var expectedIds = new[]
            {
                "sustained_bonds", "attunement_rite", "essence_reservoir",
                "deep_resonance", "echo_shaping", "prism_focus",
                "veil_wellspring", "kindred_circle"
            };

            foreach (var id in expectedIds)
            {
                bool found = false;
                foreach (var b in data.Buildings)
                {
                    if (b.BuildingId == id) { found = true; break; }
                }
                Assert.IsTrue(found, $"Building {id} not found");
            }
        }

        [Test]
        public void Missions_StartsAtRegion1Stage0()
        {
            var data = SaveDefaults.CreateNewSave();

            Assert.AreEqual(1, data.Missions.CurrentRegion);
            Assert.AreEqual(0, data.Missions.HighestCompletedStage);
            Assert.AreEqual(0, data.Missions.StarRatings.Count);
        }

        [Test]
        public void Equipment_EmptyByDefault()
        {
            var data = SaveDefaults.CreateNewSave();

            Assert.AreEqual(0, data.Equipment.Items.Length);
            Assert.AreEqual(0, data.Equipment.LooseGems.Length);
        }

        [Test]
        public void Achievements_EmptyByDefault()
        {
            var data = SaveDefaults.CreateNewSave();

            Assert.AreEqual(0, data.Achievements.Earned.Length);
            Assert.AreEqual(0, data.Achievements.Claimed.Length);
        }

        [Test]
        public void GachaStats_ZeroByDefault()
        {
            var data = SaveDefaults.CreateNewSave();

            Assert.AreEqual(0, data.GachaStats.TotalRolls);
            Assert.AreEqual(0, data.GachaStats.RollsSincePity);
            Assert.AreEqual(0, data.GachaStats.PityResets);
        }

        private HeroSaveData FindHero(SaveData data, string heroId)
        {
            foreach (var h in data.Heroes)
            {
                if (h.HeroId == heroId) return h;
            }
            return null;
        }
    }
}

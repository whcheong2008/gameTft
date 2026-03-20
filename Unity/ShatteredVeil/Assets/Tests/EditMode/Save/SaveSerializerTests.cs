using System;
using System.Collections.Generic;
using NUnit.Framework;
using ShatteredVeil.Core.Save;

namespace ShatteredVeil.Tests.EditMode.Save
{
    [TestFixture]
    public class SaveSerializerTests
    {
        [Test]
        public void Roundtrip_AllFieldsPreserved()
        {
            var original = CreateFullSaveData();

            string json = SaveSerializer.Serialize(original);
            var restored = SaveSerializer.Deserialize(json);

            Assert.AreEqual(original.Version, restored.Version);
            Assert.AreEqual(original.LastSavedTimestamp, restored.LastSavedTimestamp);
            Assert.AreEqual(original.Player.Name, restored.Player.Name);
            Assert.AreEqual(original.Player.Level, restored.Player.Level);
            Assert.AreEqual(original.Player.XP, restored.Player.XP);
            Assert.AreEqual(original.Player.VeilEssence, restored.Player.VeilEssence);
            Assert.AreEqual(original.ActiveTeamIndex, restored.ActiveTeamIndex);
            Assert.AreEqual(original.GachaStats.TotalRolls, restored.GachaStats.TotalRolls);
            Assert.AreEqual(original.GachaStats.RollsSincePity, restored.GachaStats.RollsSincePity);
            Assert.AreEqual(original.GachaStats.PityResets, restored.GachaStats.PityResets);
        }

        [Test]
        public void Roundtrip_RosterWith10Units_DataIntact()
        {
            var original = SaveDefaults.CreateNewSave();
            Assert.AreEqual(10, original.Roster.Units.Length);

            string json = SaveSerializer.Serialize(original);
            var restored = SaveSerializer.Deserialize(json);

            Assert.AreEqual(10, restored.Roster.Units.Length);
            for (int i = 0; i < 10; i++)
            {
                Assert.AreEqual(original.Roster.Units[i].TemplateKey, restored.Roster.Units[i].TemplateKey);
                Assert.AreEqual(original.Roster.Units[i].Stars, restored.Roster.Units[i].Stars);
                Assert.AreEqual(original.Roster.Units[i].CopiesForNext, restored.Roster.Units[i].CopiesForNext);
            }
        }

        [Test]
        public void Roundtrip_TeamWithPositionedUnits_RowColPreserved()
        {
            var original = SaveDefaults.CreateNewSave();
            original.Teams = new[]
            {
                new TeamData
                {
                    TeamName = "Alpha",
                    Slots = new[]
                    {
                        new TeamSlot { UnitKey = "flame_warrior", Row = 0, Col = 2 },
                        new TeamSlot { UnitKey = "stone_guard", Row = 1, Col = 3 }
                    }
                }
            };

            string json = SaveSerializer.Serialize(original);
            var restored = SaveSerializer.Deserialize(json);

            Assert.AreEqual(1, restored.Teams.Length);
            Assert.AreEqual("Alpha", restored.Teams[0].TeamName);
            Assert.AreEqual(2, restored.Teams[0].Slots.Length);
            Assert.AreEqual("flame_warrior", restored.Teams[0].Slots[0].UnitKey);
            Assert.AreEqual(0, restored.Teams[0].Slots[0].Row);
            Assert.AreEqual(2, restored.Teams[0].Slots[0].Col);
            Assert.AreEqual("stone_guard", restored.Teams[0].Slots[1].UnitKey);
            Assert.AreEqual(1, restored.Teams[0].Slots[1].Row);
            Assert.AreEqual(3, restored.Teams[0].Slots[1].Col);
        }

        [Test]
        public void Roundtrip_HeroWithInvestedNodes_IndicesPreserved()
        {
            var original = SaveDefaults.CreateNewSave();
            original.Heroes[0].InvestedNodeIndices = new[] { 0, 3, 7, 12 };
            original.Heroes[0].Level = 5;
            original.Heroes[0].RespecCount = 2;

            string json = SaveSerializer.Serialize(original);
            var restored = SaveSerializer.Deserialize(json);

            Assert.AreEqual(4, restored.Heroes[0].InvestedNodeIndices.Length);
            Assert.AreEqual(0, restored.Heroes[0].InvestedNodeIndices[0]);
            Assert.AreEqual(3, restored.Heroes[0].InvestedNodeIndices[1]);
            Assert.AreEqual(7, restored.Heroes[0].InvestedNodeIndices[2]);
            Assert.AreEqual(12, restored.Heroes[0].InvestedNodeIndices[3]);
            Assert.AreEqual(5, restored.Heroes[0].Level);
            Assert.AreEqual(2, restored.Heroes[0].RespecCount);
        }

        [Test]
        public void Roundtrip_EquipmentWithAffixesAndGems_AllDataPreserved()
        {
            var original = SaveDefaults.CreateNewSave();
            original.Equipment = new EquipmentInventory
            {
                Items = new[]
                {
                    new EquipmentSaveData
                    {
                        Id = "item-001",
                        Slot = "weapon",
                        Tier = 3,
                        Rarity = 2,
                        EnhanceLevel = 5,
                        Affixes = new[]
                        {
                            new AffixSaveData { AffixId = "attack_flat", Value = 15.5f },
                            new AffixSaveData { AffixId = "crit_chance", Value = 0.08f }
                        },
                        Gems = new[]
                        {
                            new GemSaveData { GemId = "gem-fire-1", Element = "fire", Tier = 2 }
                        },
                        EquippedOnUnit = "flame_warrior"
                    }
                },
                LooseGems = new[]
                {
                    new GemSaveData { GemId = "gem-water-1", Element = "water", Tier = 1 }
                }
            };

            string json = SaveSerializer.Serialize(original);
            var restored = SaveSerializer.Deserialize(json);

            Assert.AreEqual(1, restored.Equipment.Items.Length);
            var item = restored.Equipment.Items[0];
            Assert.AreEqual("item-001", item.Id);
            Assert.AreEqual("weapon", item.Slot);
            Assert.AreEqual(3, item.Tier);
            Assert.AreEqual(2, item.Rarity);
            Assert.AreEqual(5, item.EnhanceLevel);
            Assert.AreEqual(2, item.Affixes.Length);
            Assert.AreEqual("attack_flat", item.Affixes[0].AffixId);
            Assert.AreEqual(15.5f, item.Affixes[0].Value, 0.01f);
            Assert.AreEqual(1, item.Gems.Length);
            Assert.AreEqual("gem-fire-1", item.Gems[0].GemId);
            Assert.AreEqual("flame_warrior", item.EquippedOnUnit);

            Assert.AreEqual(1, restored.Equipment.LooseGems.Length);
            Assert.AreEqual("gem-water-1", restored.Equipment.LooseGems[0].GemId);
        }

        [Test]
        public void Roundtrip_EmptySave_DeserializesWithoutError()
        {
            var original = new SaveData
            {
                Version = 1,
                LastSavedTimestamp = 0,
                Player = new PlayerData { Name = "", Level = 1, XP = 0, VeilEssence = 0 },
                Roster = new RosterData { Units = Array.Empty<RosterEntry>() },
                Teams = Array.Empty<TeamData>(),
                ActiveTeamIndex = 0,
                Heroes = Array.Empty<HeroSaveData>(),
                Equipment = new EquipmentInventory
                {
                    Items = Array.Empty<EquipmentSaveData>(),
                    LooseGems = Array.Empty<GemSaveData>()
                },
                Buildings = Array.Empty<BuildingData>(),
                Missions = new MissionProgressData
                {
                    CurrentRegion = 1,
                    HighestCompletedStage = 0,
                    StarRatings = new Dictionary<string, int>()
                },
                Achievements = new AchievementData
                {
                    Earned = Array.Empty<string>(),
                    Claimed = Array.Empty<string>()
                },
                GachaStats = new GachaStatsData()
            };

            string json = SaveSerializer.Serialize(original);
            var restored = SaveSerializer.Deserialize(json);

            Assert.IsNotNull(restored);
            Assert.AreEqual(1, restored.Version);
            Assert.AreEqual(0, restored.Roster.Units.Length);
            Assert.AreEqual(0, restored.Teams.Length);
        }

        [Test]
        public void Roundtrip_MissionStarRatings_DictionaryPreserved()
        {
            var original = SaveDefaults.CreateNewSave();
            original.Missions.StarRatings["stage_1_1"] = 3;
            original.Missions.StarRatings["stage_1_2"] = 2;
            original.Missions.StarRatings["stage_2_1"] = 1;
            original.Missions.HighestCompletedStage = 5;

            string json = SaveSerializer.Serialize(original);
            var restored = SaveSerializer.Deserialize(json);

            Assert.AreEqual(3, restored.Missions.StarRatings.Count);
            Assert.AreEqual(3, restored.Missions.StarRatings["stage_1_1"]);
            Assert.AreEqual(2, restored.Missions.StarRatings["stage_1_2"]);
            Assert.AreEqual(1, restored.Missions.StarRatings["stage_2_1"]);
            Assert.AreEqual(5, restored.Missions.HighestCompletedStage);
        }

        [Test]
        public void Roundtrip_Achievements_PreservedCorrectly()
        {
            var original = SaveDefaults.CreateNewSave();
            original.Achievements.Earned = new[] { "first_win", "ten_rolls", "boss_slayer" };
            original.Achievements.Claimed = new[] { "first_win", "ten_rolls" };

            string json = SaveSerializer.Serialize(original);
            var restored = SaveSerializer.Deserialize(json);

            Assert.AreEqual(3, restored.Achievements.Earned.Length);
            Assert.AreEqual(2, restored.Achievements.Claimed.Length);
            Assert.AreEqual("first_win", restored.Achievements.Earned[0]);
            Assert.AreEqual("boss_slayer", restored.Achievements.Earned[2]);
        }

        [Test]
        public void Roundtrip_Buildings_PreservedCorrectly()
        {
            var original = SaveDefaults.CreateNewSave();
            original.Buildings[0].Level = 3; // sustained_bonds
            original.Buildings[1].Level = 5; // attunement_rite

            string json = SaveSerializer.Serialize(original);
            var restored = SaveSerializer.Deserialize(json);

            Assert.AreEqual(8, restored.Buildings.Length);
            Assert.AreEqual("sustained_bonds", restored.Buildings[0].BuildingId);
            Assert.AreEqual(3, restored.Buildings[0].Level);
            Assert.AreEqual("attunement_rite", restored.Buildings[1].BuildingId);
            Assert.AreEqual(5, restored.Buildings[1].Level);
        }

        private SaveData CreateFullSaveData()
        {
            var data = SaveDefaults.CreateNewSave();
            data.Player.Level = 15;
            data.Player.XP = 3200;
            data.Player.VeilEssence = 12000;
            data.ActiveTeamIndex = 1;
            data.GachaStats.TotalRolls = 50;
            data.GachaStats.RollsSincePity = 12;
            data.GachaStats.PityResets = 1;
            return data;
        }
    }
}

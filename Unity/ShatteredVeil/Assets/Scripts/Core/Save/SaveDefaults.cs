using System;
using System.Collections.Generic;

namespace ShatteredVeil.Core.Save
{
    public static class SaveDefaults
    {
        private static readonly string[] StarterUnits = new[]
        {
            "flame_warrior", "stone_guard", "frost_archer", "wind_squire",
            "pulse_mender", "fire_acolyte", "bramble_knight", "tide_hunter",
            "spark_fencer", "shadow_blade"
        };

        private static readonly string[] BuildingIds = new[]
        {
            "sustained_bonds", "attunement_rite", "essence_reservoir",
            "deep_resonance", "echo_shaping", "prism_focus",
            "veil_wellspring", "kindred_circle"
        };

        public static SaveData CreateNewSave()
        {
            var data = new SaveData
            {
                Version = SaveMigrator.CURRENT_VERSION,
                LastSavedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                Player = new PlayerData
                {
                    Name = "Player",
                    Level = 1,
                    XP = 0,
                    VeilEssence = 500
                },
                Roster = CreateStarterRoster(),
                Teams = new[]
                {
                    new TeamData { TeamName = "Team 1", Slots = Array.Empty<TeamSlot>() }
                },
                ActiveTeamIndex = 0,
                Heroes = CreateStarterHeroes(),
                Equipment = new EquipmentInventory
                {
                    Items = Array.Empty<EquipmentSaveData>(),
                    LooseGems = Array.Empty<GemSaveData>()
                },
                Buildings = CreateDefaultBuildings(),
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
                GachaStats = new GachaStatsData
                {
                    TotalRolls = 0,
                    RollsSincePity = 0,
                    PityResets = 0
                }
            };

            return data;
        }

        private static RosterData CreateStarterRoster()
        {
            var entries = new RosterEntry[StarterUnits.Length];
            for (int i = 0; i < StarterUnits.Length; i++)
            {
                entries[i] = new RosterEntry
                {
                    TemplateKey = StarterUnits[i],
                    Count = 1,
                    Stars = 1,
                    CopiesForNext = 0
                };
            }
            return new RosterData { Units = entries };
        }

        private static HeroSaveData[] CreateStarterHeroes()
        {
            return new[]
            {
                CreateHero("kael", available: true),
                CreateHero("lyric", available: true),
                CreateHero("ren", available: false),
                CreateHero("sera", available: false),
                CreateHero("maren", available: false),
                CreateHero("voss", available: false)
            };
        }

        private static HeroSaveData CreateHero(string id, bool available)
        {
            return new HeroSaveData
            {
                HeroId = id,
                Level = 1,
                XP = 0,
                AssignedUnitId = null,
                InvestedNodeIndices = Array.Empty<int>(),
                IsDead = false,
                IsAbsent = !available,
                RespecCount = 0
            };
        }

        private static BuildingData[] CreateDefaultBuildings()
        {
            var buildings = new BuildingData[BuildingIds.Length];
            for (int i = 0; i < BuildingIds.Length; i++)
            {
                buildings[i] = new BuildingData
                {
                    BuildingId = BuildingIds[i],
                    Level = 0
                };
            }
            return buildings;
        }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using ShatteredVeil.Core.Teams;
using ShatteredVeil.Core.Units;
using ShatteredVeil.Core.Gacha;

namespace ShatteredVeil.Tests.EditMode.Teams
{
    [TestFixture]
    public class TeamBuilderSystemTests
    {
        private Dictionary<string, IUnitData> catalog;
        private Dictionary<string, OwnedUnit> collection;
        private Dictionary<string, string> evoMap;
        private Dictionary<string, string> heroAssignments;

        [SetUp]
        public void SetUp()
        {
            catalog = new Dictionary<string, IUnitData>
            {
                { "fire_warrior_1", new UnitData { UnitId = "fire_warrior_1", Name = "Flame Knight", Tier = 1, Element = "Fire", Archetype = "Vanguard", BaseHP = 800, BaseATK = 100 } },
                { "fire_warrior_2", new UnitData { UnitId = "fire_warrior_2", Name = "Blaze Guard", Tier = 2, Element = "Fire", Archetype = "Guardian", BaseHP = 1000, BaseATK = 80 } },
                { "water_mage_1", new UnitData { UnitId = "water_mage_1", Name = "Tide Mage", Tier = 1, Element = "Water", Archetype = "Sorcerer", BaseHP = 600, BaseATK = 120 } },
                { "earth_tank_1", new UnitData { UnitId = "earth_tank_1", Name = "Stone Wall", Tier = 1, Element = "Earth", Archetype = "Guardian", BaseHP = 1200, BaseATK = 60 } },
                { "wind_assassin_1", new UnitData { UnitId = "wind_assassin_1", Name = "Gale Blade", Tier = 3, Element = "Wind", Archetype = "Predator", BaseHP = 700, BaseATK = 150 } },
                { "fire_warrior_1_evo", new UnitData { UnitId = "fire_warrior_1_evo", Name = "Inferno Knight", Tier = 1, Element = "Fire", Archetype = "Vanguard", BaseHP = 1000, BaseATK = 130 } },
                { "lightning_ranger_1", new UnitData { UnitId = "lightning_ranger_1", Name = "Bolt Archer", Tier = 2, Element = "Lightning", Archetype = "Ranger", BaseHP = 650, BaseATK = 110 } },
                { "force_duelist_1", new UnitData { UnitId = "force_duelist_1", Name = "Steel Fist", Tier = 3, Element = "Force", Archetype = "Duelist", BaseHP = 900, BaseATK = 140 } },
                { "water_healer_1", new UnitData { UnitId = "water_healer_1", Name = "Tide Healer", Tier = 2, Element = "Water", Archetype = "Sage", BaseHP = 750, BaseATK = 50 } },
                { "fire_sage_t5", new UnitData { UnitId = "fire_sage_t5", Name = "Phoenix Sage", Tier = 5, Element = "Fire", Archetype = "Sage", BaseHP = 1500, BaseATK = 200 } },
                { "fire_sage_t5_evo", new UnitData { UnitId = "fire_sage_t5_evo", Name = "Phoenix Ascended", Tier = 5, Element = "Fire", Archetype = "Sage", BaseHP = 2000, BaseATK = 260 } },
            };

            collection = new Dictionary<string, OwnedUnit>();
            foreach (var kvp in catalog)
                collection[kvp.Key] = new OwnedUnit { UnitId = kvp.Key, Stars = 1, Copies = 3 };

            evoMap = new Dictionary<string, string>
            {
                { "fire_warrior_1", "fire_warrior_1_evo" },
                { "fire_sage_t5", "fire_sage_t5_evo" },
            };

            heroAssignments = new Dictionary<string, string>();
        }

        private TeamBuilderSystem CreateSystem(int maxTeamSize = 8)
        {
            return new TeamBuilderSystem(catalog, collection, evoMap, heroAssignments, maxTeamSize);
        }

        // ---- Grid Constants ----

        [Test]
        public void GridSize_Is4x2()
        {
            Assert.AreEqual(4, TeamBuilderSystem.GridCols);
            Assert.AreEqual(2, TeamBuilderSystem.GridRows);
            Assert.AreEqual(8, TeamBuilderSystem.MaxGridSlots);
        }

        // ---- Placement ----

        [Test]
        public void AddUnit_Success_PlacesUnitAtPosition()
        {
            var sys = CreateSystem();
            var result = sys.AddUnit("fire_warrior_1", 0, 0);

            Assert.IsTrue(result.Success);
            Assert.AreEqual(1, sys.CurrentTeamSize);
            Assert.IsNotNull(sys.GetUnitAt(0, 0));
            Assert.AreEqual("fire_warrior_1", sys.GetUnitAt(0, 0).UnitId);
        }

        [Test]
        public void AddUnit_NotInCollection_Fails()
        {
            var sys = CreateSystem();
            var result = sys.AddUnit("nonexistent_unit", 0, 0);

            Assert.IsFalse(result.Success);
            Assert.AreEqual("Unit not in collection", result.Message);
        }

        [Test]
        public void AddUnit_AlreadyOnTeam_Fails()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1", 0, 0);
            var result = sys.AddUnit("fire_warrior_1", 1, 0);

            Assert.IsFalse(result.Success);
            Assert.AreEqual("Unit already on team", result.Message);
        }

        [Test]
        public void AddUnit_PositionOccupied_Fails()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1", 0, 0);
            var result = sys.AddUnit("water_mage_1", 0, 0);

            Assert.IsFalse(result.Success);
            Assert.AreEqual("Position occupied", result.Message);
        }

        [Test]
        public void AddUnit_OutOfBounds_Fails()
        {
            var sys = CreateSystem();
            Assert.IsFalse(sys.AddUnit("fire_warrior_1", -1, 0).Success);
            Assert.IsFalse(sys.AddUnit("fire_warrior_1", 4, 0).Success);
            Assert.IsFalse(sys.AddUnit("fire_warrior_1", 0, -1).Success);
            Assert.IsFalse(sys.AddUnit("fire_warrior_1", 0, 2).Success);
        }

        [Test]
        public void AddUnit_TeamFull_Fails()
        {
            var sys = CreateSystem(maxTeamSize: 3);
            sys.AddUnit("fire_warrior_1", 0, 0);
            sys.AddUnit("water_mage_1", 1, 0);
            sys.AddUnit("earth_tank_1", 2, 0);

            var result = sys.AddUnit("wind_assassin_1", 3, 0);
            Assert.IsFalse(result.Success);
            Assert.IsTrue(result.Message.Contains("full"));
        }

        // ---- Family Conflict ----

        [Test]
        public void AddUnit_FamilyConflict_AutoRemovesBase()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1", 0, 0);
            var result = sys.AddUnit("fire_warrior_1_evo", 1, 0);

            Assert.IsTrue(result.Success);
            Assert.AreEqual("Replaced family member", result.Message);
            Assert.AreEqual(1, sys.CurrentTeamSize);
            Assert.IsNull(sys.GetUnitAt(0, 0)); // base removed
            Assert.IsNotNull(sys.GetUnitAt(1, 0)); // evolved placed
        }

        [Test]
        public void AddUnit_FamilyConflict_AutoRemovesEvolved()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1_evo", 1, 0);
            var result = sys.AddUnit("fire_warrior_1", 0, 0);

            Assert.IsTrue(result.Success);
            Assert.AreEqual(1, sys.CurrentTeamSize);
            Assert.IsNull(sys.GetUnitAt(1, 0)); // evolved removed
            Assert.IsNotNull(sys.GetUnitAt(0, 0)); // base placed
        }

        [Test]
        public void FindFamilyConflict_DetectsBaseVsEvolved()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1", 0, 0);

            Assert.AreEqual("fire_warrior_1", sys.FindFamilyConflict("fire_warrior_1_evo"));
        }

        [Test]
        public void FindFamilyConflict_NoConflict_ReturnsNull()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1", 0, 0);

            Assert.IsNull(sys.FindFamilyConflict("water_mage_1"));
        }

        // ---- Remove ----

        [Test]
        public void RemoveUnit_Success()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1", 0, 0);
            var result = sys.RemoveUnit("fire_warrior_1");

            Assert.IsTrue(result.Success);
            Assert.AreEqual(0, sys.CurrentTeamSize);
            Assert.IsNull(sys.GetUnitAt(0, 0));
        }

        [Test]
        public void RemoveUnit_NotOnTeam_Fails()
        {
            var sys = CreateSystem();
            var result = sys.RemoveUnit("fire_warrior_1");
            Assert.IsFalse(result.Success);
        }

        [Test]
        public void RemoveUnit_AlsoRemovesHeroAssignment()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1", 0, 0);
            sys.AssignHero("fire_warrior_1", "kael");

            sys.RemoveUnit("fire_warrior_1");
            Assert.IsNull(sys.GetHeroForUnit("fire_warrior_1"));
        }

        // ---- Move / Swap ----

        [Test]
        public void MoveUnit_ToEmptyCell_Success()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1", 0, 0);
            var result = sys.MoveUnit("fire_warrior_1", 2, 1);

            Assert.IsTrue(result.Success);
            Assert.IsNull(sys.GetUnitAt(0, 0));
            Assert.AreEqual("fire_warrior_1", sys.GetUnitAt(2, 1).UnitId);
        }

        [Test]
        public void MoveUnit_ToOccupiedCell_Swaps()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1", 0, 0);
            sys.AddUnit("water_mage_1", 1, 0);

            var result = sys.MoveUnit("fire_warrior_1", 1, 0);

            Assert.IsTrue(result.Success);
            Assert.AreEqual("water_mage_1", sys.GetUnitAt(0, 0).UnitId);
            Assert.AreEqual("fire_warrior_1", sys.GetUnitAt(1, 0).UnitId);
        }

        [Test]
        public void MoveUnit_SamePosition_Success()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1", 0, 0);
            var result = sys.MoveUnit("fire_warrior_1", 0, 0);
            Assert.IsTrue(result.Success);
        }

        [Test]
        public void MoveUnit_OutOfBounds_Fails()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1", 0, 0);
            var result = sys.MoveUnit("fire_warrior_1", 5, 0);
            Assert.IsFalse(result.Success);
        }

        // ---- Clear ----

        [Test]
        public void ClearTeam_RemovesAll()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1", 0, 0);
            sys.AddUnit("water_mage_1", 1, 0);
            sys.AddUnit("earth_tank_1", 2, 0);

            sys.ClearTeam();
            Assert.AreEqual(0, sys.CurrentTeamSize);
        }

        // ---- Load Slots ----

        [Test]
        public void LoadSlots_RestoresTeam()
        {
            var sys = CreateSystem();
            var savedSlots = new List<TeamSlot>
            {
                new TeamSlot("fire_warrior_1", 0, 0),
                new TeamSlot("water_mage_1", 1, 1),
            };

            sys.LoadSlots(savedSlots);
            Assert.AreEqual(2, sys.CurrentTeamSize);
            Assert.AreEqual("fire_warrior_1", sys.GetUnitAt(0, 0).UnitId);
            Assert.AreEqual("water_mage_1", sys.GetUnitAt(1, 1).UnitId);
        }

        // ---- Synergy Preview ----

        [Test]
        public void Synergy_EmptyTeam_NoSynergies()
        {
            var sys = CreateSystem();
            var preview = sys.GetSynergyPreview();

            Assert.AreEqual(0, preview.TeamSize);
            Assert.AreEqual(0, preview.ElementCounts.Count);
            Assert.AreEqual(0, preview.ArchetypeCounts.Count);
        }

        [Test]
        public void Synergy_TwoFireUnits_FireSynergyTier1()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1", 0, 0);
            sys.AddUnit("fire_warrior_2", 1, 0);

            var preview = sys.GetSynergyPreview();

            Assert.AreEqual(2, preview.ElementCounts["Fire"]);
            Assert.IsTrue(preview.ActiveElementSynergies.ContainsKey("Fire"));
            Assert.AreEqual(1, preview.ActiveElementSynergies["Fire"]); // Tier 1 at 2 units
        }

        [Test]
        public void Synergy_OneUnit_BelowThreshold_NoActiveSynergy()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1", 0, 0);

            var preview = sys.GetSynergyPreview();
            Assert.AreEqual(1, preview.ElementCounts["Fire"]);
            Assert.IsFalse(preview.ActiveElementSynergies.ContainsKey("Fire"));
        }

        [Test]
        public void Synergy_ArchetypeCounted()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_2", 0, 0);   // Guardian
            sys.AddUnit("earth_tank_1", 1, 0);      // Guardian

            var preview = sys.GetSynergyPreview();
            Assert.AreEqual(2, preview.ArchetypeCounts["Guardian"]);
            Assert.IsTrue(preview.ActiveArchetypeSynergies.ContainsKey("Guardian"));
            Assert.AreEqual(1, preview.ActiveArchetypeSynergies["Guardian"]); // Tier 1 at 2
        }

        [Test]
        public void Synergy_EvolvedT5_CountsAsTwo_ForElement()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_sage_t5_evo", 0, 0);  // evolved T5 Fire

            var preview = sys.GetSynergyPreview();
            Assert.AreEqual(2, preview.ElementCounts["Fire"]); // counts as 2
            Assert.IsTrue(preview.ActiveElementSynergies.ContainsKey("Fire"));
        }

        [Test]
        public void Synergy_ElementThresholds_Are_2_4_7_10()
        {
            CollectionAssert.AreEqual(new[] { 2, 4, 7, 10 }, TeamBuilderSystem.ElementThresholds);
        }

        [Test]
        public void Synergy_ArchetypeThresholds_Are_2_4_6_8()
        {
            CollectionAssert.AreEqual(new[] { 2, 4, 6, 8 }, TeamBuilderSystem.ArchetypeThresholds);
        }

        // ---- Hero Assignment ----

        [Test]
        public void AssignHero_Success()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1", 0, 0);
            var result = sys.AssignHero("fire_warrior_1", "kael");

            Assert.IsTrue(result.Success);
            Assert.AreEqual("kael", sys.GetHeroForUnit("fire_warrior_1"));
        }

        [Test]
        public void AssignHero_UnitNotOnTeam_Fails()
        {
            var sys = CreateSystem();
            var result = sys.AssignHero("fire_warrior_1", "kael");
            Assert.IsFalse(result.Success);
        }

        [Test]
        public void AssignHero_MovesToNewUnit()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1", 0, 0);
            sys.AddUnit("water_mage_1", 1, 0);

            sys.AssignHero("fire_warrior_1", "kael");
            sys.AssignHero("water_mage_1", "kael");

            Assert.IsNull(sys.GetHeroForUnit("fire_warrior_1"));
            Assert.AreEqual("kael", sys.GetHeroForUnit("water_mage_1"));
        }

        [Test]
        public void UnassignHero_Success()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1", 0, 0);
            sys.AssignHero("fire_warrior_1", "kael");

            var result = sys.UnassignHero("fire_warrior_1");
            Assert.IsTrue(result.Success);
            Assert.IsNull(sys.GetHeroForUnit("fire_warrior_1"));
        }

        [Test]
        public void UnassignHero_NoHero_Fails()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1", 0, 0);
            var result = sys.UnassignHero("fire_warrior_1");
            Assert.IsFalse(result.Success);
        }

        // ---- Roster Display ----

        [Test]
        public void GetRosterForDisplay_ReturnsAllOwnedUnits()
        {
            var sys = CreateSystem();
            var roster = sys.GetRosterForDisplay();
            Assert.AreEqual(collection.Count, roster.Count);
        }

        [Test]
        public void GetRosterForDisplay_MarksOnTeamUnits()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1", 0, 0);

            var roster = sys.GetRosterForDisplay();
            var fireWarrior = roster.First(r => r.UnitId == "fire_warrior_1");
            var waterMage = roster.First(r => r.UnitId == "water_mage_1");

            Assert.IsTrue(fireWarrior.IsOnTeam);
            Assert.IsFalse(waterMage.IsOnTeam);
        }

        [Test]
        public void GetRosterForDisplay_MarksEvolvedUnits()
        {
            var sys = CreateSystem();
            var roster = sys.GetRosterForDisplay();
            var evolved = roster.First(r => r.UnitId == "fire_warrior_1_evo");
            var normal = roster.First(r => r.UnitId == "water_mage_1");

            Assert.IsTrue(evolved.IsEvolved);
            Assert.IsFalse(normal.IsEvolved);
        }

        // ---- Filtering ----

        [Test]
        public void FilterRoster_ByElement()
        {
            var sys = CreateSystem();
            var roster = sys.GetRosterForDisplay();
            var filtered = sys.FilterRoster(roster, "Fire");

            Assert.IsTrue(filtered.All(r => r.Data.Element == "Fire"));
            Assert.IsTrue(filtered.Count > 0);
        }

        [Test]
        public void FilterRoster_ByArchetype()
        {
            var sys = CreateSystem();
            var roster = sys.GetRosterForDisplay();
            var filtered = sys.FilterRoster(roster, archetypeFilter: "Guardian");

            Assert.IsTrue(filtered.All(r => r.Data.Archetype == "Guardian"));
        }

        [Test]
        public void FilterRoster_AllFilter_NoFiltering()
        {
            var sys = CreateSystem();
            var roster = sys.GetRosterForDisplay();
            var filtered = sys.FilterRoster(roster, "All", "All");

            Assert.AreEqual(roster.Count, filtered.Count);
        }

        // ---- Sorting ----

        [Test]
        public void SortRoster_ByName()
        {
            var sys = CreateSystem();
            var roster = sys.GetRosterForDisplay();
            sys.SortRoster(roster, "Name");

            for (int i = 1; i < roster.Count; i++)
            {
                Assert.LessOrEqual(
                    string.Compare(roster[i - 1].Data.Name, roster[i].Data.Name, StringComparison.Ordinal),
                    0, "Roster not sorted by name");
            }
        }

        [Test]
        public void SortRoster_ByTier_DescendingFirst()
        {
            var sys = CreateSystem();
            var roster = sys.GetRosterForDisplay();
            sys.SortRoster(roster, "Tier");

            // Higher tier should come first
            Assert.GreaterOrEqual(roster[0].Data.Tier, roster[roster.Count - 1].Data.Tier);
        }

        // ---- Team Size ----

        [Test]
        public void MaxTeamSize_CappedAt8()
        {
            var sys = CreateSystem(maxTeamSize: 100);
            Assert.AreEqual(8, sys.MaxTeamSize);
        }

        [Test]
        public void MaxTeamSize_MinIs1()
        {
            var sys = CreateSystem(maxTeamSize: 0);
            Assert.AreEqual(1, sys.MaxTeamSize);
        }

        [Test]
        public void SetMaxTeamSize_UpdatesLimit()
        {
            var sys = CreateSystem(maxTeamSize: 3);
            Assert.AreEqual(3, sys.MaxTeamSize);

            sys.SetMaxTeamSize(5);
            Assert.AreEqual(5, sys.MaxTeamSize);
        }

        // ---- Events ----

        [Test]
        public void OnTeamChanged_FiresOnAdd()
        {
            var sys = CreateSystem();
            int fired = 0;
            sys.OnTeamChanged += () => fired++;

            sys.AddUnit("fire_warrior_1", 0, 0);
            Assert.AreEqual(1, fired);
        }

        [Test]
        public void OnTeamChanged_FiresOnRemove()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1", 0, 0);

            int fired = 0;
            sys.OnTeamChanged += () => fired++;
            sys.RemoveUnit("fire_warrior_1");
            Assert.AreEqual(1, fired);
        }

        [Test]
        public void OnTeamChanged_FiresOnMove()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1", 0, 0);

            int fired = 0;
            sys.OnTeamChanged += () => fired++;
            sys.MoveUnit("fire_warrior_1", 1, 1);
            Assert.AreEqual(1, fired);
        }

        [Test]
        public void OnTeamChanged_FiresOnClear()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1", 0, 0);

            int fired = 0;
            sys.OnTeamChanged += () => fired++;
            sys.ClearTeam();
            Assert.AreEqual(1, fired);
        }

        [Test]
        public void OnTeamChanged_FiresOnHeroAssign()
        {
            var sys = CreateSystem();
            sys.AddUnit("fire_warrior_1", 0, 0);

            int fired = 0;
            sys.OnTeamChanged += () => fired++;
            sys.AssignHero("fire_warrior_1", "kael");
            Assert.AreEqual(1, fired);
        }
    }
}

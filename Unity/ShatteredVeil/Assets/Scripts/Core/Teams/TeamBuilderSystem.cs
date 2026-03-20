using System;
using System.Collections.Generic;
using System.Linq;
using ShatteredVeil.Core.Units;
using ShatteredVeil.Core.Gacha;

namespace ShatteredVeil.Core.Teams
{
    /// <summary>
    /// Pure C# team builder system. Manages team composition on a 4×2 grid.
    /// Handles: unit placement, removal, movement/swap, synergy preview, hero assignment.
    /// No Unity dependencies — fully unit-testable.
    ///
    /// Grid is 4 columns × 2 rows (cols 0-3, rows 0-1).
    /// Row 0 = front row (closest to enemy), Row 1 = back row.
    /// </summary>
    public class TeamBuilderSystem
    {
        public const int GridCols = 4;
        public const int GridRows = 2;
        public const int MaxGridSlots = GridCols * GridRows; // 8

        private readonly List<TeamSlot> slots;
        private readonly Dictionary<string, IUnitData> unitCatalog;
        private readonly Dictionary<string, OwnedUnit> collection;
        private readonly Dictionary<string, string> evolutionMap; // baseId -> evolvedId
        private readonly Dictionary<string, string> heroAssignments; // unitId -> heroId
        private int maxTeamSize;

        public event Action OnTeamChanged;

        public TeamBuilderSystem(
            Dictionary<string, IUnitData> unitCatalog,
            Dictionary<string, OwnedUnit> collection,
            Dictionary<string, string> evolutionMap,
            Dictionary<string, string> heroAssignments,
            int maxTeamSize)
        {
            this.unitCatalog = unitCatalog ?? new Dictionary<string, IUnitData>();
            this.collection = collection ?? new Dictionary<string, OwnedUnit>();
            this.evolutionMap = evolutionMap ?? new Dictionary<string, string>();
            this.heroAssignments = heroAssignments ?? new Dictionary<string, string>();
            this.maxTeamSize = Math.Max(1, Math.Min(MaxGridSlots, maxTeamSize));
            slots = new List<TeamSlot>();
        }

        public IReadOnlyList<TeamSlot> Slots => slots.AsReadOnly();
        public int MaxTeamSize => maxTeamSize;
        public int CurrentTeamSize => slots.Count;

        public void SetMaxTeamSize(int size)
        {
            maxTeamSize = Math.Max(1, Math.Min(MaxGridSlots, size));
        }

        // --- Placement ---

        /// <summary>
        /// Add a unit to the team at (col, row). Returns result with success/reason.
        /// Enforces: collection ownership, team size, one-family-one-slot, grid bounds, position occupancy.
        /// </summary>
        public TeamActionResult AddUnit(string unitId, int col, int row)
        {
            if (string.IsNullOrEmpty(unitId))
                return TeamActionResult.Fail("No unit specified");

            if (!collection.ContainsKey(unitId))
                return TeamActionResult.Fail("Unit not in collection");

            if (col < 0 || col >= GridCols || row < 0 || row >= GridRows)
                return TeamActionResult.Fail("Position out of bounds");

            // Already on team?
            if (slots.Any(s => s.UnitId == unitId))
                return TeamActionResult.Fail("Unit already on team");

            // One-family-one-slot check
            string conflictId = FindFamilyConflict(unitId);
            if (conflictId != null)
            {
                // Auto-remove the conflicting family member
                slots.RemoveAll(s => s.UnitId == conflictId);
            }

            // Team full (after potential removal)?
            if (slots.Count >= maxTeamSize)
                return TeamActionResult.Fail("Team is full (" + maxTeamSize + " slots)");

            // Position occupied?
            if (slots.Any(s => s.Col == col && s.Row == row))
                return TeamActionResult.Fail("Position occupied");

            slots.Add(new TeamSlot(unitId, col, row));
            OnTeamChanged?.Invoke();

            if (conflictId != null)
                return TeamActionResult.Ok("Replaced family member");

            return TeamActionResult.Ok();
        }

        /// <summary>
        /// Remove a unit from the team.
        /// </summary>
        public TeamActionResult RemoveUnit(string unitId)
        {
            int removed = slots.RemoveAll(s => s.UnitId == unitId);
            if (removed == 0)
                return TeamActionResult.Fail("Unit not on team");

            // Also remove hero assignment
            if (heroAssignments.ContainsKey(unitId))
                heroAssignments.Remove(unitId);

            OnTeamChanged?.Invoke();
            return TeamActionResult.Ok();
        }

        /// <summary>
        /// Move a unit to a new position. If occupied, swap with the other unit.
        /// </summary>
        public TeamActionResult MoveUnit(string unitId, int newCol, int newRow)
        {
            if (newCol < 0 || newCol >= GridCols || newRow < 0 || newRow >= GridRows)
                return TeamActionResult.Fail("Position out of bounds");

            var source = slots.FirstOrDefault(s => s.UnitId == unitId);
            if (source == null)
                return TeamActionResult.Fail("Unit not on team");

            // Same position?
            if (source.Col == newCol && source.Row == newRow)
                return TeamActionResult.Ok();

            // Check if target position is occupied
            var target = slots.FirstOrDefault(s => s.Col == newCol && s.Row == newRow);
            if (target != null)
            {
                // Swap
                int tmpCol = source.Col;
                int tmpRow = source.Row;
                source.Col = newCol;
                source.Row = newRow;
                target.Col = tmpCol;
                target.Row = tmpRow;
            }
            else
            {
                source.Col = newCol;
                source.Row = newRow;
            }

            OnTeamChanged?.Invoke();
            return TeamActionResult.Ok();
        }

        /// <summary>
        /// Clear all units from the team.
        /// </summary>
        public void ClearTeam()
        {
            slots.Clear();
            OnTeamChanged?.Invoke();
        }

        /// <summary>
        /// Load team slots from saved data.
        /// </summary>
        public void LoadSlots(IEnumerable<TeamSlot> savedSlots)
        {
            slots.Clear();
            if (savedSlots != null)
            {
                foreach (var slot in savedSlots)
                {
                    if (slot != null && !string.IsNullOrEmpty(slot.UnitId))
                        slots.Add(new TeamSlot(slot.UnitId, slot.Col, slot.Row));
                }
            }
        }

        /// <summary>
        /// Get the unit at a specific grid position, or null.
        /// </summary>
        public TeamSlot GetUnitAt(int col, int row)
        {
            return slots.FirstOrDefault(s => s.Col == col && s.Row == row);
        }

        // --- Family Conflict ---

        /// <summary>
        /// Check if adding unitId would conflict with an existing team member
        /// (base + evolved form can't both be on team).
        /// Returns the conflicting unitId, or null if no conflict.
        /// </summary>
        public string FindFamilyConflict(string unitId)
        {
            foreach (var slot in slots)
            {
                // Is unitId the evolved form of slot.UnitId?
                if (evolutionMap.TryGetValue(slot.UnitId, out string evolved) && evolved == unitId)
                    return slot.UnitId;

                // Is slot.UnitId the evolved form of unitId?
                if (evolutionMap.TryGetValue(unitId, out string evolved2) && evolved2 == slot.UnitId)
                    return slot.UnitId;
            }
            return null;
        }

        // --- Synergy Preview ---

        /// <summary>
        /// Calculate synergy counts for the current team.
        /// Returns element counts and archetype counts.
        /// </summary>
        public SynergyPreview GetSynergyPreview()
        {
            var preview = new SynergyPreview();

            foreach (var slot in slots)
            {
                if (!unitCatalog.TryGetValue(slot.UnitId, out IUnitData data))
                    continue;

                // Element count
                string elem = data.Element;
                if (!string.IsNullOrEmpty(elem))
                {
                    if (!preview.ElementCounts.ContainsKey(elem))
                        preview.ElementCounts[elem] = 0;
                    preview.ElementCounts[elem]++;

                    // Evolved T5 counts as 2 for element synergy
                    bool isEvolved = evolutionMap.Values.Contains(slot.UnitId);
                    if (isEvolved && data.Tier == 5)
                        preview.ElementCounts[elem]++;
                }

                // Archetype count
                string arch = data.Archetype;
                if (!string.IsNullOrEmpty(arch))
                {
                    if (!preview.ArchetypeCounts.ContainsKey(arch))
                        preview.ArchetypeCounts[arch] = 0;
                    preview.ArchetypeCounts[arch]++;
                }
            }

            // Calculate active synergy tiers
            preview.ActiveElementSynergies = CalculateElementSynergyTiers(preview.ElementCounts);
            preview.ActiveArchetypeSynergies = CalculateArchetypeSynergyTiers(preview.ArchetypeCounts);

            return preview;
        }

        /// <summary>
        /// Get roster entries for display: all owned units with team status.
        /// </summary>
        public List<RosterDisplayEntry> GetRosterForDisplay()
        {
            var entries = new List<RosterDisplayEntry>();

            foreach (var kvp in collection)
            {
                string unitId = kvp.Key;
                OwnedUnit owned = kvp.Value;

                if (!unitCatalog.TryGetValue(unitId, out IUnitData data))
                    continue;

                bool isOnTeam = slots.Any(s => s.UnitId == unitId);
                bool isEvolved = evolutionMap.Values.Contains(unitId);

                string heroId = null;
                heroAssignments.TryGetValue(unitId, out heroId);

                entries.Add(new RosterDisplayEntry
                {
                    UnitId = unitId,
                    Data = data,
                    Stars = owned.Stars,
                    Copies = owned.Copies,
                    IsOnTeam = isOnTeam,
                    IsEvolved = isEvolved,
                    HeroId = heroId
                });
            }

            // Sort: evolved first, then by tier desc, then stars desc, then name
            entries.Sort((a, b) =>
            {
                if (a.IsEvolved != b.IsEvolved) return a.IsEvolved ? -1 : 1;
                if (b.Data.Tier != a.Data.Tier) return b.Data.Tier - a.Data.Tier;
                if (b.Stars != a.Stars) return b.Stars - a.Stars;
                return string.Compare(a.Data.Name, b.Data.Name, StringComparison.Ordinal);
            });

            return entries;
        }

        // --- Hero Assignment ---

        /// <summary>
        /// Assign a hero to a unit on the team.
        /// A hero can only be assigned to one unit at a time.
        /// </summary>
        public TeamActionResult AssignHero(string unitId, string heroId)
        {
            if (!slots.Any(s => s.UnitId == unitId))
                return TeamActionResult.Fail("Unit not on team");

            // Remove hero from any other unit first
            var existingUnit = heroAssignments.FirstOrDefault(kvp => kvp.Value == heroId).Key;
            if (existingUnit != null)
                heroAssignments.Remove(existingUnit);

            heroAssignments[unitId] = heroId;
            OnTeamChanged?.Invoke();
            return TeamActionResult.Ok();
        }

        /// <summary>
        /// Remove hero assignment from a unit.
        /// </summary>
        public TeamActionResult UnassignHero(string unitId)
        {
            if (!heroAssignments.ContainsKey(unitId))
                return TeamActionResult.Fail("No hero assigned");

            heroAssignments.Remove(unitId);
            OnTeamChanged?.Invoke();
            return TeamActionResult.Ok();
        }

        /// <summary>
        /// Get the hero assigned to a unit, or null.
        /// </summary>
        public string GetHeroForUnit(string unitId)
        {
            heroAssignments.TryGetValue(unitId, out string heroId);
            return heroId;
        }

        /// <summary>
        /// Get all hero assignments.
        /// </summary>
        public IReadOnlyDictionary<string, string> GetHeroAssignments()
        {
            return heroAssignments;
        }

        // --- Filtering ---

        /// <summary>
        /// Filter roster entries by element and/or archetype.
        /// </summary>
        public List<RosterDisplayEntry> FilterRoster(
            List<RosterDisplayEntry> roster,
            string elementFilter = null,
            string archetypeFilter = null)
        {
            return roster.Where(e =>
            {
                if (!string.IsNullOrEmpty(elementFilter) && elementFilter != "All"
                    && e.Data.Element != elementFilter)
                    return false;
                if (!string.IsNullOrEmpty(archetypeFilter) && archetypeFilter != "All"
                    && e.Data.Archetype != archetypeFilter)
                    return false;
                return true;
            }).ToList();
        }

        /// <summary>
        /// Sort roster entries.
        /// </summary>
        public void SortRoster(List<RosterDisplayEntry> roster, string sortBy)
        {
            switch (sortBy)
            {
                case "Name":
                    roster.Sort((a, b) => string.Compare(a.Data.Name, b.Data.Name, StringComparison.Ordinal));
                    break;
                case "Element":
                    roster.Sort((a, b) => string.Compare(a.Data.Element, b.Data.Element, StringComparison.Ordinal));
                    break;
                case "Tier":
                default:
                    roster.Sort((a, b) =>
                    {
                        if (b.Data.Tier != a.Data.Tier) return b.Data.Tier - a.Data.Tier;
                        return string.Compare(a.Data.Name, b.Data.Name, StringComparison.Ordinal);
                    });
                    break;
            }
        }

        // --- Synergy Calculation Helpers ---

        /// <summary>
        /// Element synergy thresholds: [2, 4, 7, 10].
        /// </summary>
        public static readonly int[] ElementThresholds = { 2, 4, 7, 10 };

        /// <summary>
        /// Archetype synergy thresholds: [2, 4, 6, 8].
        /// </summary>
        public static readonly int[] ArchetypeThresholds = { 2, 4, 6, 8 };

        private static Dictionary<string, int> CalculateElementSynergyTiers(Dictionary<string, int> counts)
        {
            var tiers = new Dictionary<string, int>();
            foreach (var kvp in counts)
            {
                int tier = 0;
                for (int i = 0; i < ElementThresholds.Length; i++)
                {
                    if (kvp.Value >= ElementThresholds[i])
                        tier = i + 1;
                }
                if (tier > 0)
                    tiers[kvp.Key] = tier;
            }
            return tiers;
        }

        private static Dictionary<string, int> CalculateArchetypeSynergyTiers(Dictionary<string, int> counts)
        {
            var tiers = new Dictionary<string, int>();
            foreach (var kvp in counts)
            {
                int tier = 0;
                for (int i = 0; i < ArchetypeThresholds.Length; i++)
                {
                    if (kvp.Value >= ArchetypeThresholds[i])
                        tier = i + 1;
                }
                if (tier > 0)
                    tiers[kvp.Key] = tier;
            }
            return tiers;
        }
    }

    // --- Data Classes ---

    /// <summary>
    /// A unit placed on the team grid.
    /// </summary>
    public class TeamSlot
    {
        public string UnitId { get; set; }
        public int Col { get; set; } // 0-3
        public int Row { get; set; } // 0-1 (0=front, 1=back)

        public TeamSlot() { }

        public TeamSlot(string unitId, int col, int row)
        {
            UnitId = unitId;
            Col = col;
            Row = row;
        }
    }

    /// <summary>
    /// Result of a team action.
    /// </summary>
    public class TeamActionResult
    {
        public bool Success { get; set; }
        public string Message { get; set; }

        public static TeamActionResult Ok(string message = null) =>
            new TeamActionResult { Success = true, Message = message };

        public static TeamActionResult Fail(string reason) =>
            new TeamActionResult { Success = false, Message = reason };
    }

    /// <summary>
    /// Synergy preview for the current team composition.
    /// </summary>
    public class SynergyPreview
    {
        public Dictionary<string, int> ElementCounts { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, int> ArchetypeCounts { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, int> ActiveElementSynergies { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, int> ActiveArchetypeSynergies { get; set; } = new Dictionary<string, int>();
        public int TeamSize => ElementCounts.Values.Sum();
    }

    /// <summary>
    /// A roster entry for display in the team builder UI.
    /// </summary>
    public class RosterDisplayEntry
    {
        public string UnitId { get; set; }
        public IUnitData Data { get; set; }
        public int Stars { get; set; }
        public int Copies { get; set; }
        public bool IsOnTeam { get; set; }
        public bool IsEvolved { get; set; }
        public string HeroId { get; set; }
    }
}

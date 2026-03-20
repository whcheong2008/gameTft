# Prompt 50: Team Builder Scene

> **Purpose**: Build the team composition screen where players assign units to their team grid, manage equipment, and preview synergies. This is the core strategic planning screen. All graphics use placeholders.
>
> **Branch**: `feature/unity-team-builder`
> **Depends on**: Prompt 47 (UI foundation), Prompt 42 (items), Prompt 43 (heroes)
> **Session type**: Claude Code with Unity MCP

---

## Read First

1. `js/ui-v2.js` lines 1631–2030 — `renderTeamBuilderScreen()`, `renderTeamSynergyPreview()`
2. `js/teams.js` — Team management, grid positions, synergy calculation
3. `GROUND-TRUTH.md` section 3 (Archetypes) and section 2 (Elements) — synergy thresholds
4. `js/ui-v2.js` lines 1149–1240 — `showQuickEquipPanel()` (equipment management)
5. `js/ui-v2.js` lines 977–1148 — `renderHeroScreen()` (hero assignment)

---

## Scene: `TeamBuilder.unity`

### Main Layout

```
┌──────────────────────────┐
│       [Top Bar]          │
├──────────────────────────┤
│  Team 1 ▼  [Hero: None▼]│  ← Team selector + hero assignment
├──────────────────────────┤
│ ┌──┬──┬──┬──┐            │
│ │  │  │  │  │  Row 1     │  ← 4×2 team grid (drag units here)
│ ├──┼──┼──┼──┤            │     Back row
│ │  │  │  │  │  Row 0     │     Front row
│ └──┴──┴──┴──┘            │
├──────────────────────────┤
│  Synergies:              │
│  🔥 Fire (2) ★★         │  ← Active synergy list
│  ⚔️ Duelist (3) ★★★     │
│  ...                     │
├──────────────────────────┤
│  ── Available Units ──   │
│  Sort: [Tier▼] [Elem▼]  │  ← Filter/sort controls
│  ┌────┐ ┌────┐ ┌────┐   │
│  │Unit│ │Unit│ │Unit│   │  ← Scrollable roster (tap to add)
│  └────┘ └────┘ └────┘   │
│  ... (ScrollView)        │
├──────────────────────────┤
│ [Gacha] [Team] [Mission] │
└──────────────────────────┘
```

---

## Files to Create

### `Scripts/MonoBehaviours/UI/TeamBuilder/TeamBuilderSceneController.cs`

Main controller.

```
- Load save data, populate grid and roster
- Team selector dropdown (up to 3 teams)
- Hero assignment dropdown per team
- Manage drag-and-drop between roster and grid
```

### `Scripts/MonoBehaviours/UI/TeamBuilder/TeamGridController.cs`

The 4×2 placement grid.

```
- 8 grid cells (4 columns × 2 rows)
- Each cell: empty slot or occupied UnitCard
- Tap empty cell → prompt to select unit from roster
- Tap occupied cell → show unit options popup (reposition, unequip, remove, equip items)
- Team size limit based on player level + Sustained Bonds building:
  - Level 1-4: 3 units
  - Level 5-8: 4 units
  - Level 9-11: 5 units
  - Level 12-14: 6 units
  - Level 15-19: 7 units
  - Level 20 + Sustained Bonds: 8 units
- Visually dim cells beyond current team size limit
- Front row (row 0) = melee range, Back row (row 1) = ranged
```

### `Scripts/MonoBehaviours/UI/TeamBuilder/UnitOptionsPopup.cs`

Popup when tapping a placed unit.

```
- "Move" → Enter reposition mode (tap target cell to swap/move)
- "Equipment" → Open equipment panel for this unit
- "Remove" → Remove from grid, return to roster
- Unit stats summary
```

### `Scripts/MonoBehaviours/UI/TeamBuilder/EquipmentPanelController.cs`

Equipment management overlay.

```
- 8 equipment slots displayed around unit card:
  Weapon, Helm, ChestArmor, Gauntlets, Boots, OffHand, Accessory1, Accessory2
- Each slot: shows equipped item (colored by rarity) or empty placeholder
- Tap slot → show available items from inventory for that slot
- Item card shows: name, tier badge, rarity color, stats, gem sockets, enhance level
- "Equip" button per item
- "Unequip" button on equipped items
- Stat preview: show stat change before confirming equip
```

### `Scripts/MonoBehaviours/UI/TeamBuilder/SynergyPanelController.cs`

Synergy preview sidebar/section.

```
- List all active synergies for current team composition
- Element synergies: show current count / next threshold (e.g., "Fire 2/4")
- Archetype synergies: show current count / next threshold
- Active threshold bonuses highlighted in gold
- Inactive thresholds shown in gray
- Updates in real-time as units are added/removed
- Reference: renderTeamSynergyPreview() in ui-v2.js
```

### `Scripts/MonoBehaviours/UI/TeamBuilder/RosterPanelController.cs`

Available units panel (bottom section).

```
- Shows all owned units NOT currently on a team
- Scrollable horizontal or grid view
- Sort: by tier, element, stars, name
- Filter: by element, by archetype
- Tap unit → add to first empty grid cell (or show grid to choose position)
- Units on other teams shown with team indicator badge
- Gray out units already on current team
```

### `Scripts/MonoBehaviours/UI/TeamBuilder/HeroAssignmentController.cs`

Hero selection for the team.

```
- Dropdown or popup showing available heroes (from Prompt 43 hero system)
- Each hero shows: name, level, primary skill branch, secondary skill branch
- "Assign" / "Unassign" buttons
- Only available heroes shown (based on story progression / availability timeline)
- Hero stat bonuses summarized
```

---

## Tests — `Tests/EditMode/UI/`

**`TeamBuilderUITests.cs`**:
- Adding unit to grid updates synergy display
- Cannot exceed team size limit
- Removing unit updates synergy display
- Same unit cannot be placed twice on same team
- Equipment equip/unequip updates unit stats

---

## Commit

```
git add Assets/Scenes/TeamBuilder.unity Assets/Scripts/MonoBehaviours/UI/TeamBuilder/ Assets/Tests/EditMode/UI/
git commit -m "Prompt 50: Team Builder — 4x2 grid, unit placement, equipment panel, synergy preview, hero assignment"
```

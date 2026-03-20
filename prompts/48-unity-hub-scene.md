# Prompt 48: Hub / Camp Scene

> **Purpose**: Build the main hub screen where players access buildings, see their resources, and navigate to other game screens (Gacha, Team Builder, Missions). All graphics use placeholders — colored shapes with text labels.
>
> **Branch**: `feature/unity-hub-scene`
> **Depends on**: Prompt 47 (UI foundation)
> **Session type**: Claude Code with Unity MCP

---

## Read First

1. `UNITY-ARCHITECTURE.md` — Folder map, Core/ ↔ UI boundary
2. `js/hub.js` — BUILDINGS object (7 buildings with levels, costs, effects, prereqs)
3. `js/ui-v2.js` lines 71–160 — `renderHubScreen()`, `uiUpgradeBuilding()`
4. `GROUND-TRUTH.md` section 11 (Buildings) — building costs and effects
5. `js/ui-v2.js` lines 194–690 — Building panel functions (Gem Workshop, Mana Shrine, Bond Hall, Evolution Lab, Forge)

---

## Scene: `Hub.unity`

### Layout (portrait 1080×1920)

```
┌──────────────────────────┐
│       [Top Bar]          │  ← From Prompt 47
├──────────────────────────┤
│                          │
│    THE SHATTERED VEIL    │  ← Title text
│       ══ Camp ══         │
│                          │
│  ┌─────┐  ┌─────┐       │
│  │Bldg1│  │Bldg2│       │  ← Building grid (2 columns)
│  └─────┘  └─────┘       │
│  ┌─────┐  ┌─────┐       │
│  │Bldg3│  │Bldg4│       │
│  └─────┘  └─────┘       │
│  ┌─────┐  ┌─────┐       │
│  │Bldg5│  │Bldg6│       │
│  └─────┘  └─────┘       │
│  ┌─────┐                │
│  │Bldg7│                │
│  └─────┘                │
│                          │
├──────────────────────────┤
│ [Gacha] [Team] [Mission] │  ← Bottom nav bar
└──────────────────────────┘
```

### `Scripts/MonoBehaviours/UI/Hub/HubSceneController.cs`

Main controller for the hub scene.

```
- On scene load: read SaveData, populate building grid, set up nav buttons
- Subscribe to GameEventBus.OnGoldChanged to refresh costs
- Bottom nav: 3 buttons → SceneRouter.LoadScene("Gacha"/"TeamBuilder"/"MissionSelect")
```

### `Scripts/MonoBehaviours/UI/Hub/BuildingCardController.cs`

Component on each building card in the grid.

```
- SetBuilding(string buildingId, int level, int maxLevel, string name, string description, string effect, int upgradeCost, bool canUpgrade, bool locked, string lockReason)
- Placeholder icon: colored square with emoji text (or first letter)
- Display: name, level (e.g., "Lv.3/5"), current effect text, upgrade cost
- Locked state: gray out, show lock reason
- Tap behavior:
  - If building has a panel (Deep Resonance, Echo Shaping, Prism Focus, Veil Wellspring, Kindred Circle) → open panel
  - Else if can upgrade → show ConfirmDialog, on confirm call upgrade logic
- Visual: element-colored border based on building type
```

### `Scripts/MonoBehaviours/UI/Hub/BuildingPanelController.cs`

Overlay panel for buildings with complex UI (Forge, Gem Workshop, Evolution Lab, etc.).

```
- Generic panel with title, close button, scrollable content area
- Specific sub-controllers for each building panel:

EvolutionPanelContent:
  - List of units eligible for evolution
  - Each shows: unit card, evolution arrow, evolved unit card, cost
  - "Evolve" button per unit

ForgePanelContent:
  - Tab bar (5 tabs matching forge levels): Reroll, Disassemble, Transmute, Set Craft, Advanced
  - Each tab: list of eligible items, action button, cost display

GemPanelContent:
  - Gem inventory grid
  - Socket panel: select equipment → select socket → select gem
  - Combine panel: select 3 matching gems → combine button → result preview

For now these panels can show placeholder content with "Coming Soon" for complex interactions.
The important thing is the STRUCTURE exists — panel opens, tabs work, close button works.
```

### `Scripts/MonoBehaviours/UI/Hub/BottomNavController.cs`

Bottom navigation bar.

```
- 3 buttons: Gacha (purple), Team Builder (blue), Missions (orange)
- Each button: icon placeholder + label text
- Tap → SceneRouter.LoadScene(sceneName)
- Highlight active button
```

---

## Building Data Bridge

### `Scripts/MonoBehaviours/UI/Hub/BuildingDataBridge.cs`

Reads Core/ save data and provides building info to UI.

```
- GetAllBuildings() → List<BuildingViewModel>
- GetBuildingLevel(string buildingId) → int
- CanUpgrade(string buildingId) → bool
- GetUpgradeCost(string buildingId) → int
- TryUpgrade(string buildingId) → bool (deducts VE, increments level, auto-saves)

BuildingViewModel:
  - string Id, Name, Description, EffectText
  - int Level, MaxLevel, UpgradeCost
  - bool CanUpgrade, IsLocked
  - string LockReason
```

Building definitions (7 buildings with costs/effects) should be stored in a static data class or ScriptableObjects. Reference `js/hub.js` BUILDINGS object for exact values.

---

## Tests — `Tests/EditMode/UI/`

**`BuildingDataBridgeTests.cs`**:
- Initial building levels are 0
- Upgrade deducts correct VE amount
- Cannot upgrade when VE insufficient
- Cannot upgrade past max level
- Locked buildings cannot be upgraded
- Upgrade increments level by 1

---

## Commit

```
git add Assets/Scenes/Hub.unity Assets/Scripts/MonoBehaviours/UI/Hub/ Assets/Prefabs/UI/ Assets/Tests/EditMode/UI/
git commit -m "Prompt 48: Hub scene — building grid, upgrade flow, building panels, bottom nav, placeholder graphics"
```

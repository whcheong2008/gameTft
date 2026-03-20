# Prompt 51: Mission Select — Region Map + Stage List

> **Purpose**: Build the mission selection screens — a region map showing 8 unlockable regions, and within each region a stage list with star ratings, rewards, and boss indicators. All graphics use placeholders.
>
> **Branch**: `feature/unity-mission-select`
> **Depends on**: Prompt 47 (UI foundation)
> **Session type**: Claude Code with Unity MCP

---

## Read First

1. `js/ui-v2.js` lines 2030–2600 — `renderRegionMapScreen()`, `renderStageListScreen()`
2. `GROUND-TRUTH.md` section 9 (Missions/Stages) — 74 stages, 8 regions, boss encounters, star requirements
3. `STORY-STAGES-V2.md` — Stage names, region themes, story beats per stage
4. `js/missions.js` — Stage data, enemy generation, reward calculation, unlock logic

---

## Scene: `MissionSelect.unity`

Two views: Region Map and Stage List (within selected region).

### Region Map Layout

```
┌──────────────────────────┐
│       [Top Bar]          │
├──────────────────────────┤
│                          │
│    ══ The Shattered      │
│       Veil ══            │
│                          │
│  ┌─────────┐             │
│  │Region 1 │ ★★★/★★★    │  ← Scrollable vertical list
│  │Verdant  │ 10/10 stages│     of region cards
│  │Threshold│ COMPLETE    │
│  └─────────┘             │
│  ┌─────────┐             │
│  │Region 2 │ ★★/★★★     │
│  │Ashen    │ 7/10 stages │
│  │Wastes   │ IN PROGRESS │
│  └─────────┘             │
│  ┌─────────┐             │
│  │Region 3 │ 🔒         │
│  │Frozen   │ LOCKED     │
│  │Depths   │ Need 25★   │
│  └─────────┘             │
│  ... (8 regions total)   │
│                          │
├──────────────────────────┤
│ [Gacha] [Team] [Mission] │
└──────────────────────────┘
```

### Stage List Layout (after selecting a region)

```
┌──────────────────────────┐
│       [Top Bar]          │
├──────────────────────────┤
│  [← Back] Region 2:     │
│  Ashen Wastes            │
├──────────────────────────┤
│  ┌─────────────────────┐ │
│  │ Stage 2-1: The Gate  │ │  ← Stage card
│  │ ★★★  Best: 3 stars  │ │
│  │ Enemies: Lv.12-14   │ │
│  │ Reward: 80-120 VE   │ │
│  │ [PLAY]               │ │
│  └─────────────────────┘ │
│  ┌─────────────────────┐ │
│  │ Stage 2-2: Ember Path│ │
│  │ ★★☆  Best: 2 stars  │ │
│  │ [PLAY]               │ │
│  └─────────────────────┘ │
│  ┌─────────────────────┐ │
│  │ Stage 2-5: BOSS 🔥  │ │  ← Boss stage (different styling)
│  │ 🔒 Clear 2-4 first  │ │
│  └─────────────────────┘ │
│  ... (ScrollView)        │
│                          │
├──────────────────────────┤
│ [Gacha] [Team] [Mission] │
└──────────────────────────┘
```

---

## Files to Create

### `Scripts/MonoBehaviours/UI/Mission/MissionSceneController.cs`

Main controller — manages switching between Region Map and Stage List views.

```
- On load: show Region Map
- On region selected: transition to Stage List for that region
- Back button: return to Region Map
```

### `Scripts/MonoBehaviours/UI/Mission/RegionMapController.cs`

Region map view.

```
- Display 8 region cards in a vertical scroll list
- Each card shows:
  - Region name and number
  - Theme color (unique per region — use placeholder colors)
  - Star progress: earned stars / total available stars
  - Stage progress: cleared stages / total stages
  - Status: COMPLETE, IN PROGRESS, or LOCKED
- Locked regions show lock icon + unlock requirement (total star count)
- Tap unlocked region → transition to Stage List
- Region unlock thresholds from GROUND-TRUTH.md
```

### `Scripts/MonoBehaviours/UI/Mission/RegionCardController.cs`

Component on each region card.

```
- SetRegion(RegionViewModel data)
- Visual states: unlocked (colored), locked (gray, lock icon), complete (gold border)
- Star progress bar
- Tap handler
```

### `Scripts/MonoBehaviours/UI/Mission/StageListController.cs`

Stage list for a selected region.

```
- Display all stages for the region in vertical scroll
- Each stage card shows:
  - Stage number and name (from STORY-STAGES-V2.md)
  - Best star rating (0-3 stars, shown as filled/empty star icons)
  - Enemy level range
  - Reward range (VE amount)
  - Boss indicator for boss stages (every 5th stage, special styling)
  - Lock status (must clear previous stage)
- "PLAY" button on each unlocked stage → confirm dialog → SceneRouter.LoadScene("Combat") with stage data
- First-clear bonus indicator (if stage never beaten)
```

### `Scripts/MonoBehaviours/UI/Mission/StageCardController.cs`

Component on each stage card.

```
- SetStage(StageViewModel data)
- Visual states: cleared (show stars), available (highlight), locked (gray)
- Boss stages: red/orange border, boss icon, "BOSS" label
- PLAY button only on available stages
```

### `Scripts/MonoBehaviours/UI/Mission/MissionDataBridge.cs`

Reads Core/ data and provides to UI.

```
- GetAllRegions() → List<RegionViewModel>
- GetStagesForRegion(int regionIndex) → List<StageViewModel>
- IsRegionUnlocked(int regionIndex) → bool
- IsStageUnlocked(int regionIndex, int stageIndex) → bool
- GetBestStars(int regionIndex, int stageIndex) → int
- GetTotalStars() → int

RegionViewModel: name, themeColor, totalStages, clearedStages, totalStars, earnedStars, isUnlocked, unlockRequirement
StageViewModel: name, regionIndex, stageIndex, isBoss, enemyLevelRange, rewardRange, bestStars, isUnlocked, isCleared
```

---

## Stage Data

Stage data for all 74 stages across 8 regions. Reference `STORY-STAGES-V2.md` for stage names and `missions.js` for enemy levels and rewards. Store as a static data class or ScriptableObjects.

Key structure:
- Region 1: stages 1-10 (levels 1-10)
- Region 2: stages 11-20 (levels 10-15)
- Region 3: stages 21-28 (levels 15-20)
- ... through Region 8
- Every 5th stage within a region is a boss stage
- Boss stages have specific boss from BossCatalog (Prompt 39)

---

## Tests — `Tests/EditMode/UI/`

**`MissionDataBridgeTests.cs`**:
- Region 1 always unlocked
- Region 2+ locked until star threshold met
- Stages unlock sequentially within a region
- Boss stages correctly identified
- Star counts aggregate correctly

---

## Commit

```
git add Assets/Scenes/MissionSelect.unity Assets/Scripts/MonoBehaviours/UI/Mission/ Assets/Tests/EditMode/UI/
git commit -m "Prompt 51: Mission Select — region map (8 regions), stage list (74 stages), lock system, star progress, boss indicators"
```

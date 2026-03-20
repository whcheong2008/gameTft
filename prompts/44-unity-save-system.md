# Prompt 44: Save System Port

> **Purpose**: Create a fresh Unity save system. NOT a port of the HTML localStorage format — a clean C# serialization system using JSON files in `Application.persistentDataPath`. Must serialize all player state: roster, teams, heroes, items, economy, missions, buildings, achievements.
>
> **Branch**: `feature/unity-save-system`
> **Depends on**: Prompts 40 (unit data), 41 (gacha/economy), 42 (items), 43 (heroes)
> **Session type**: Claude Code with Unity MCP

---

## Read First

- `GROUND-TRUTH.md` section 15 (Save System) — for what data needs saving
- `js/save.js` — reference for what fields exist and auto-save triggers

---

## IMPORTANT: This Uses UnityEngine

The save system needs `Application.persistentDataPath` and `JsonUtility` or Newtonsoft JSON. This goes in `Scripts/MonoBehaviours/` or a new `Scripts/Save/` folder, NOT in `Scripts/Core/`.

However, the **save data models** (what gets serialized) should be plain C# classes in `Scripts/Core/Save/` so they can be tested without Unity.

---

## Save Data Models — `Scripts/Core/Save/`

Pure C#, no UnityEngine. These are the serializable data classes.

**`SaveData.cs`** — Top-level save:
```csharp
[System.Serializable]
public class SaveData
{
    public int Version;              // Schema version for migrations
    public long LastSavedTimestamp;   // Unix timestamp
    public PlayerData Player;
    public RosterData Roster;
    public TeamData[] Teams;
    public int ActiveTeamIndex;
    public HeroSaveData[] Heroes;
    public EquipmentInventory Equipment;
    public BuildingData[] Buildings;
    public MissionProgressData Missions;
    public AchievementData Achievements;
    public GachaStatsData GachaStats;
}
```

**`PlayerData.cs`**:
```
- string Name
- int Level
- int XP
- int VeilEssence
```

**`RosterData.cs`**:
```
- RosterEntry[] Units
  - string TemplateKey
  - int Count (copies owned)
  - int Stars (current star level)
  - int CopiesForNext (copies invested toward next star)
```

**`TeamData.cs`**:
```
- string TeamName
- TeamSlot[] Slots
  - string UnitKey
  - int Row, Col (grid position)
```

**`HeroSaveData.cs`**:
```
- string HeroId (maps to HeroId enum)
- int Level
- int XP
- string AssignedUnitId (or null)
- int[] InvestedNodeIndices
- bool IsDead
- bool IsAbsent
- int RespecCount (for escalating respec cost)
```

**`EquipmentInventory.cs`**:
```
- EquipmentSaveData[] Items
  - string Id (GUID)
  - string Slot
  - int Tier, int Rarity
  - int EnhanceLevel
  - AffixSaveData[] Affixes
  - GemSaveData[] Gems
  - string EquippedOnUnit (or null)
- GemSaveData[] LooseGems (unslotted gems)
```

**`BuildingData.cs`**:
```
- string BuildingId
- int Level
```

**`MissionProgressData.cs`**:
```
- int CurrentRegion
- int HighestCompletedStage
- Dictionary<string, int> StarRatings (stageId → 1-3 stars)
```

**`AchievementData.cs`**:
```
- string[] Earned (achievement IDs)
- string[] Claimed (rewards collected)
```

**`GachaStatsData.cs`**:
```
- int TotalRolls
- int RollsSincePity
- int PityResets
```

### Save Versioning

**`SaveMigrator.cs`** — Handle schema evolution:
```
- const int CURRENT_VERSION = 1;  // Fresh start for Unity
- Migrate(SaveData data) → SaveData
  - If data.Version < CURRENT_VERSION, apply migrations in sequence
  - v1: Initial Unity schema (no migration needed yet, but the framework is ready)
- Future migrations add fields with defaults, restructure data, etc.
```

### Save/Load Logic

**`SaveSerializer.cs`** — Pure C# serialization (no Unity dependency):
```
- string Serialize(SaveData data) → JSON string
- SaveData Deserialize(string json) → SaveData
- Use System.Text.Json or Newtonsoft.Json (check what's available)
- Validate: check Version field, run migration if needed
```

---

## Unity Integration — `Scripts/MonoBehaviours/` or `Scripts/Save/`

**`SaveManager.cs`** (MonoBehaviour — uses UnityEngine):
```
- Uses Application.persistentDataPath for file location
- Save(SaveData data): serialize → write to file
- SaveData Load(): read file → deserialize → migrate if needed
- AutoSave(): called after state changes (list from GROUND-TRUTH):
  - Unit rolled/purchased
  - Star-up performed
  - Team composition changed
  - Building upgraded
  - Mission completed
  - Item equipped/unequipped
  - Hero assigned/respecced
  - Equipment enhanced/crafted
- CreateNewSave() → SaveData with defaults:
  - Version = CURRENT_VERSION
  - Player: Level 1, XP 0, VE 500
  - Empty roster, empty teams, Kael + Lyric heroes available
  - All buildings at level 0
  - Mission progress at R1 stage 1
```

---

## Tests — `Tests/EditMode/Save/`

These test the pure C# parts (data models, serialization, migration). NOT the MonoBehaviour file I/O.

**`SaveSerializerTests.cs`**:
- Serialize → Deserialize roundtrip: all fields preserved
- Roster with 10 units: data intact after roundtrip
- Team with positioned units: row/col preserved
- Hero with invested nodes: node indices preserved
- Equipment with affixes and gems: all data preserved
- Empty save (fresh start): deserializes without error

**`SaveMigratorTests.cs`**:
- v1 save passes through unchanged
- Future: when v2 is added, v1 data migrates correctly (test framework ready)
- Missing version field defaults to 1

**`SaveDataValidationTests.cs`**:
- CreateNewSave produces valid defaults
- Player starts at L1, 500 VE
- Kael and Lyric are available heroes
- Empty roster and teams

---

## Validation Checklist

- [ ] Core/Save/ data models have no `using UnityEngine`
- [ ] SaveManager.cs (MonoBehaviour) is in the correct folder with UnityEngine access
- [ ] Serialize/Deserialize roundtrip preserves all data
- [ ] Fresh save defaults match GROUND-TRUTH (L1, 500 VE, Kael + Lyric)
- [ ] Migration framework ready for future schema changes
- [ ] Auto-save triggers documented and stubbed
- [ ] All tests pass

## Commit

```
git add Unity/ShatteredVeil/Assets/Scripts/Core/Save/ Unity/ShatteredVeil/Assets/Scripts/MonoBehaviours/ Unity/ShatteredVeil/Assets/Tests/EditMode/Save/
git commit -m "Prompt 44: Save system — serializable data models, JSON serialization, migration framework, auto-save triggers, fresh Unity schema"
```

## Note

After Prompt 44, Track A (core logic port) is COMPLETE:
- Combat: 36-39 (grid, damage, abilities, status, passives, bosses)
- Data: 40 (132 units, synergies)
- Progression: 41 (gacha, economy)
- Equipment: 42 (items, enhancement, gems)
- Heroes: 43 (6 heroes, skill trees, availability)
- Persistence: 44 (save system)

Track B (scenes and UI) can now begin.

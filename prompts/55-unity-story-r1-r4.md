# Prompt 55: Story Content — Regions 1-4

> **Purpose**: Populate the StoryCatalog with story scripts for Regions 1-4 (stages 1-1 through 4-9, ~36 stages). Converts the narrative from `STORY-STAGES-V2.md` into structured StoryBeat data. No new engine code — just data.
>
> **Branch**: `feature/unity-story-r1-r4`
> **Depends on**: Prompt 54 (dialogue engine — StoryBeat data model)
> **Session type**: Claude Code with Unity MCP

---

## Read First

1. `STORY-STAGES-V2.md` — THE SOURCE OF TRUTH. Read ALL of Regions 1-4. Every stage has pre-mission, post-mission, combat dialogue, and environment descriptions. Port them faithfully.
2. `Scripts/Core/Story/StoryBeat.cs` — The data format to use
3. `Scripts/Core/Story/CharacterData.cs` — Character IDs to reference

---

## What to Create

### `Scripts/Core/Story/Content/Region1Stories.cs`

Static class that registers all Region 1 story scripts into StoryCatalog.

```csharp
public static class Region1Stories
{
    public static void RegisterAll()
    {
        StoryCatalog.Register("1-1", CreateStage1_1());
        StoryCatalog.Register("1-2", CreateStage1_2());
        // ... through 1-9
    }

    private static StoryScript CreateStage1_1()
    {
        return new StoryScript
        {
            StageId = "1-1",
            StageName = "The Arrival",
            StageType = "story",
            EnvironmentDescription = "Rolling grasslands broken by wooden palisade walls...",
            PreMission = new List<StoryBeat>
            {
                new StoryBeat { Type = BeatType.Dialogue, CharacterId = "lyric", Text = "They're not going to like us.", Expression = "neutral" },
                new StoryBeat { Type = BeatType.Dialogue, CharacterId = "kael", Text = "We're not here to be liked.", Expression = "determined" },
                // ... all dialogue from STORY-STAGES-V2.md pre-mission section
            },
            PostMission = new List<StoryBeat> { ... },
            CombatDialogue = new List<StoryBeat> { ... },
        };
    }
}
```

### Similarly create:
- `Scripts/Core/Story/Content/Region2Stories.cs` — Region 2 (9 stages)
- `Scripts/Core/Story/Content/Region3Stories.cs` — Region 3 (9 stages)
- `Scripts/Core/Story/Content/Region4Stories.cs` — Region 4 (9 stages)

### `Scripts/Core/Story/Content/StoryContentRegistrar.cs`

Master registration class:
```csharp
public static class StoryContentRegistrar
{
    public static void RegisterAll()
    {
        Region1Stories.RegisterAll();
        Region2Stories.RegisterAll();
        Region3Stories.RegisterAll();
        Region4Stories.RegisterAll();
        // Regions 5-8 added by Prompt 56
    }
}
```

---

## Conversion Rules

When converting `STORY-STAGES-V2.md` prose into StoryBeats:

1. **Quoted speech** → `BeatType.Dialogue` with the speaking character's ID
2. **Narrative prose between quotes** → `BeatType.Narration`
3. **"Pre-mission:"** section → `PreMission` beats list
4. **"Post-mission:"** section → `PostMission` beats list
5. **"Combat dialogue:"** section → `CombatDialogue` beats with appropriate triggers:
   - First line → `TriggerCondition = "turn_1"`
   - Subsequent lines → `"turn_3"`, `"turn_5"`, etc. (space them out)
   - Lines about enemies dying → `"enemy_killed"`
   - Lines about completion → `"victory"`
6. **"Brief card:"** text → `BeatType.BriefCard`
7. **Environment descriptions** → `EnvironmentDescription` field on StoryScript
8. **Stage type** (STORY STAGE, CHARACTER STAGE, etc.) → `StageType` field
9. **Boss stages** → add `HasCutscene = true` flag (for future cutscene replacement)
10. **Expression hints**: Derive from context:
    - Orders/commands → "determined"
    - Jokes/warmth → "happy"
    - Concern/worry → "sad"
    - Surprise/revelation → "shocked"
    - Anger/frustration → "angry"
    - Default → "neutral"

---

## Quality Rules

- **Do NOT summarize or shorten the dialogue.** Port it faithfully from STORY-STAGES-V2.md.
- Keep the exact wording where possible.
- Break long monologues into multiple Dialogue beats (one per sentence or natural pause).
- Every stage in STORY-STAGES-V2.md Regions 1-4 must have a corresponding StoryScript registered.
- Gameplay stages with only "Brief card" pre-missions still get a StoryScript with a BriefCard beat.

---

## Tests — `Tests/EditMode/Story/`

**`StoryContentR1R4Tests.cs`**:
- Region1Stories.RegisterAll() registers exactly 9 scripts
- Region2Stories.RegisterAll() registers exactly 9 scripts
- Region3Stories.RegisterAll() registers exactly 9 scripts
- Region4Stories.RegisterAll() registers exactly 9 scripts
- Every registered script has non-empty StageName
- Story and Boss stages have non-empty PreMission
- Every script has EnvironmentDescription
- All character IDs used in beats exist in CharacterData
- No null Text fields in any dialogue beats

---

## Commit

```
git add Assets/Scripts/Core/Story/Content/ Assets/Tests/EditMode/Story/
git commit -m "Prompt 55: Story content R1-R4 — 36 stage scripts with dialogue, narration, combat lines, environment descriptions"
```

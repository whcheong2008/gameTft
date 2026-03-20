# Prompt 56: Story Content — Regions 5-8

> **Purpose**: Populate the StoryCatalog with story scripts for Regions 5-8 (stages 5-1 through 8-8, ~38 stages). Completes all story content. Same approach as Prompt 55.
>
> **Branch**: `feature/unity-story-r5-r8`
> **Depends on**: Prompt 54 (dialogue engine), Prompt 55 (R1-R4 content — for pattern reference)
> **Session type**: Claude Code with Unity MCP

---

## Read First

1. `STORY-STAGES-V2.md` — Read ALL of Regions 5-8. Port faithfully.
2. `Scripts/Core/Story/Content/Region1Stories.cs` — Reference for the data format (created by Prompt 55)
3. `Scripts/Core/Story/StoryBeat.cs` — BeatType enum and data structure
4. `Scripts/Core/Story/CharacterData.cs` — Character IDs

---

## IMPORTANT STORY NOTES FOR REGIONS 5-8

These regions contain the most dramatic story beats:
- **Region 5**: Mira joins the party (Water element oracle, quiet and knowing)
- **Region 6**: **Lyric dies.** This is the emotional peak of the game. The death scene should be marked `HasCutscene = true` and have extensive dialogue.
- **Region 7**: The party processes Lyric's loss. Tone shifts to grimmer. Kael becomes more withdrawn.
- **Region 8**: The Abyss Gate — final confrontation. Climax and resolution. Multiple `HasCutscene = true` stages.

**NOTE**: Region 7 may be missing or incomplete in STORY-STAGES-V2.md. If so, create placeholder story scripts with:
- Stage names following the pattern of other regions
- Brief narration beats that establish the tone (grief, determination, pressing forward)
- BriefCard beats for gameplay stages
- Mark story and boss stages as `HasCutscene = true`
- Add a comment `// TODO: Full dialogue pending — Region 7 not in STORY-STAGES-V2.md`

---

## What to Create

### Story content files:
- `Scripts/Core/Story/Content/Region5Stories.cs` — Region 5 (10 stages)
- `Scripts/Core/Story/Content/Region6Stories.cs` — Region 6 (10 stages)
- `Scripts/Core/Story/Content/Region7Stories.cs` — Region 7 (10 stages)
- `Scripts/Core/Story/Content/Region8Stories.cs` — Region 8 (8 stages)

### Update:
- `Scripts/Core/Story/Content/StoryContentRegistrar.cs` — Add Regions 5-8 registration

---

## Conversion Rules

Same as Prompt 55. Additionally for R5-R8:

1. **Lyric's death scene** (Region 6): Use multiple expression changes, pauses, and ScreenEffect beats:
   ```csharp
   new StoryBeat { Type = BeatType.ScreenEffect, EffectType = "shake", Duration = 0.5f },
   new StoryBeat { Type = BeatType.Dialogue, CharacterId = "lyric", Text = "...", Expression = "sad" },
   new StoryBeat { Type = BeatType.Pause, Duration = 2.0f },
   new StoryBeat { Type = BeatType.ScreenEffect, EffectType = "fade_black", Duration = 1.0f },
   ```

2. **Post-Lyric stages**: Dialogue should reflect the tonal shift. Kael becomes terse. Senna becomes the emotional anchor.

3. **Region 8 climax**: Use `CutsceneMarker` beats for the most dramatic moments. Mark all boss stages and the final stage as `HasCutscene = true`.

4. **Mira's introduction** (Region 5): She speaks sparingly. Short sentences. Knows things she shouldn't.

---

## Quality Rules

Same as Prompt 55:
- Do NOT summarize or shorten dialogue
- Port faithfully from STORY-STAGES-V2.md
- Every stage gets a StoryScript
- Region 7 can use placeholders if source material is missing

---

## Tests — `Tests/EditMode/Story/`

**`StoryContentR5R8Tests.cs`**:
- Region5Stories.RegisterAll() registers exactly 10 scripts
- Region6Stories.RegisterAll() registers exactly 10 scripts
- Region7Stories.RegisterAll() registers exactly 10 scripts
- Region8Stories.RegisterAll() registers exactly 8 scripts
- StoryContentRegistrar.RegisterAll() registers 74 total scripts (all regions)
- Lyric death scene (R6 boss) has HasCutscene = true
- Region 8 final stage has HasCutscene = true
- Mira character appears first in Region 5 scripts
- All character IDs used in beats exist in CharacterData

---

## Commit

```
git add Assets/Scripts/Core/Story/Content/ Assets/Tests/EditMode/Story/
git commit -m "Prompt 56: Story content R5-R8 — 38 stage scripts, Lyric's death, Mira intro, Abyss Gate climax, 74 total stages complete"
```

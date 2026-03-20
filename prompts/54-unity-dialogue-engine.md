# Prompt 54: Dialogue & Story Engine

> **Purpose**: Build the narrative system — a dialogue engine with character portraits, text boxes with typewriter effect, brief cards, combat dialogue overlays, and cutscene-ready hooks. No actual story content yet (that's Prompts 55-56). This is the engine that PLAYS the story.
>
> **Branch**: `feature/unity-dialogue-engine`
> **Depends on**: Prompt 47 (UI foundation), Prompt 52 (combat scene — for combat dialogue hooks)
> **Session type**: Claude Code with Unity MCP

---

## Read First

1. `STORY-STAGES-V2.md` — first 50 lines (the storytelling tools table and stage types)
2. `UNITY-ARCHITECTURE.md` — folder map, Core/ ↔ UI boundary
3. `js/ui-v2.js` — for general UI patterns used so far

---

## Architecture

The story system has two parts:
1. **Data layer** (Core/) — story scripts as structured data, no Unity deps
2. **Presentation layer** (MonoBehaviours/) — renders dialogue, portraits, cards

### Story Data Format

All story content is stored as **StoryScript** objects — plain C# data classes. A StoryScript is a sequence of **StoryBeats** that play in order.

---

## Core Data — `Scripts/Core/Story/`

Pure C#, no UnityEngine.

### `StoryBeat.cs`

Base class for all story beats. Each beat is one "thing that happens" in a narrative sequence.

```csharp
public enum BeatType
{
    Dialogue,           // Character speaks — shows portrait + name + text
    Narration,          // No character — narrator text, different styling
    BriefCard,          // Full-screen card with 1-3 lines of text
    EnvironmentDesc,    // Sets the environment description (shown briefly at stage start)
    CombatDialogue,     // Text that appears during combat at specific triggers
    Choice,             // Player choice (future — stub for now)
    CutsceneMarker,     // Marks where a video/animation cutscene would play (placeholder for now)
    SetExpression,      // Change character portrait expression
    Pause,              // Timed pause between beats
    ScreenEffect        // Fade, flash, shake (for dramatic moments)
}

public class StoryBeat
{
    public BeatType Type;
    public string CharacterId;       // null for narration/cards
    public string Text;              // the actual dialogue/narration text
    public string Expression;        // "neutral", "angry", "sad", "happy", "shocked", "determined"
    public float Duration;           // for pauses and effects (seconds)
    public string EffectType;        // for ScreenEffect: "fade_black", "flash_white", "shake"
    public string TriggerCondition;  // for CombatDialogue: "turn_1", "ally_death", "boss_phase_2", etc.
    public string[] Choices;         // for Choice type (future)
}
```

### `StoryScript.cs`

A complete narrative for one stage.

```csharp
public class StoryScript
{
    public string StageId;                    // e.g., "1-1", "3-5"
    public string StageName;                  // e.g., "The Arrival"
    public string StageType;                  // "story", "character", "gameplay", "boss"
    public string EnvironmentDescription;     // Shown briefly at stage start
    public List<StoryBeat> PreMission;        // Plays before combat
    public List<StoryBeat> PostMission;       // Plays after combat (victory only)
    public List<StoryBeat> CombatDialogue;    // Triggered during combat
    public List<StoryBeat> DefeatDialogue;    // Plays on defeat (optional, short)
    public bool HasCutscene;                  // Flag for future cutscene replacement
}
```

### `CharacterData.cs`

Character definitions for the story.

```csharp
public static class CharacterData
{
    public static readonly Dictionary<string, CharacterInfo> Characters;

    // Main cast:
    // "kael"   — Commander. Pragmatic, precise, Earth element. Leader.
    // "lyric"  — Diplomat. Warm, empathetic, Wind element. Dies in R6.
    // "senna"  — Bondseer. Perceptive, protective, Lightning element. Bonds expert.
    // "otho"   — Scholar. Curious, absent-minded, Force element. Veil researcher.
    // "maren"  — Survivor. Fierce, independent, Fire element. Joins R3.
    // "mira"   — Oracle. Quiet, knowing, Water element. Joins R5.

    // Supporting:
    // "torren" — Captain of the frontier militia
    // "dren"   — Young militia recruit
    // "narrator" — No portrait, used for narration beats
}

public class CharacterInfo
{
    public string Id;
    public string DisplayName;
    public string Element;                    // for portrait tinting
    public string DefaultExpression;
    public string[] AvailableExpressions;     // which expressions have portraits
    public int JoinsAtRegion;                 // 1 for main cast, 3 for Maren, 5 for Mira
}
```

### `StoryCatalog.cs`

Registry of all story scripts. Initially empty — Prompts 55-56 populate it.

```csharp
public static class StoryCatalog
{
    private static Dictionary<string, StoryScript> _scripts = new Dictionary<string, StoryScript>();

    public static StoryScript GetScript(string stageId) =>
        _scripts.TryGetValue(stageId, out var s) ? s : null;

    public static void Register(string stageId, StoryScript script) =>
        _scripts[stageId] = script;

    public static bool HasStory(string stageId) => _scripts.ContainsKey(stageId);
}
```

---

## Presentation Layer — `Scripts/MonoBehaviours/UI/Story/`

### `DialogueBoxController.cs`

The main dialogue display — character portrait + name + text with typewriter effect.

```
Layout (bottom third of screen):
┌──────────────────────────────┐
│ ┌────────┐                   │
│ │Portrait│  Character Name   │
│ │  img   │  ─────────────    │
│ │        │  "Dialogue text   │
│ └────────┘   appears here    │
│              with typewriter  │
│              effect..."  [▼]  │
└──────────────────────────────┘

- Portrait: 256×256 placeholder (element-colored square with character initial)
- Name: bold, element-colored
- Text: typewriter effect (characters appear one by one, ~30 chars/sec)
- Tap anywhere or [▼] button to:
  - If typing: instantly show full text
  - If fully shown: advance to next beat
- Expression changes swap the portrait placeholder color shade
```

### `NarrationBoxController.cs`

For narrator text — no portrait, centered text, italic styling.

```
Layout (center of screen):
┌──────────────────────────────┐
│                              │
│    "The silence hung heavy   │
│     as they approached the   │
│     eastern breach..."       │
│                         [▼]  │
└──────────────────────────────┘

- Semi-transparent dark background
- Centered, italic text
- Same typewriter effect and tap-to-advance
```

### `BriefCardController.cs`

Full-screen card for light story beats.

```
Layout (full screen):
┌──────────────────────────────┐
│                              │
│                              │
│    ── Region 1: Stage 3 ──  │
│                              │
│    "Scouts report movement   │
│     near the eastern breach. │
│     Investigate and clear    │
│     the approach."           │
│                              │
│         [Continue]           │
│                              │
└──────────────────────────────┘

- Dark background with vignette
- 1-3 lines of text, centered
- Continue button (or tap anywhere)
- Auto-advance after 5 seconds if no input
```

### `CombatDialogueController.cs`

Text overlay during combat — triggered by combat events.

```
Layout (top of combat screen, over gameplay):
┌──────────────────────────────┐
│ [Kael]: "Hold formation."    │  ← Compact bar, no portrait
└──────────────────────────────┘

- Small text bar at top of combat scene
- Shows character name + short dialogue
- Displays for 3 seconds then fades
- Queues if multiple triggers fire close together
- Does NOT pause combat
- Triggers: turn_1, turn_5, ally_death, enemy_half_hp, boss_phase_2, victory, etc.
```

### `StoryDirector.cs`

Orchestrates playback of a StoryScript.

```
- PlayPreMission(StoryScript script, Action onComplete)
  1. Show environment description briefly (2 seconds)
  2. Play each PreMission beat in sequence
  3. Wait for player to advance each dialogue beat
  4. Call onComplete when done

- PlayPostMission(StoryScript script, Action onComplete)
  1. Play each PostMission beat in sequence
  2. Call onComplete when done

- RegisterCombatDialogue(StoryScript script, CombatDialogueController controller)
  1. Gives combat dialogue beats to the combat controller
  2. Combat controller triggers them based on TriggerCondition

- PlayDefeatDialogue(StoryScript script, Action onComplete)
  1. Short defeat dialogue (1-2 beats max)
  2. Call onComplete when done

- HandleBeat(StoryBeat beat):
  - Dialogue → DialogueBoxController
  - Narration → NarrationBoxController
  - BriefCard → BriefCardController
  - CombatDialogue → queued for combat
  - CutsceneMarker → show "Cutscene placeholder" card (future replacement)
  - SetExpression → update portrait
  - Pause → wait Duration seconds
  - ScreenEffect → trigger fade/flash/shake
```

### `ScreenEffectController.cs`

Simple screen effects for dramatic moments.

```
- FadeToBlack(float duration)
- FadeFromBlack(float duration)
- FlashWhite(float duration)
- ScreenShake(float duration, float intensity)
- All use a fullscreen overlay image + camera manipulation
```

---

## Integration with Existing Scenes

### Combat Scene (Prompt 52)

Add hooks to `CombatSceneController`:
- Before combat starts: `StoryDirector.PlayPreMission(script, () => StartCombat())`
- After victory: `StoryDirector.PlayPostMission(script, () => ShowResults())`
- On defeat: `StoryDirector.PlayDefeatDialogue(script, () => ShowResults())`
- During combat: `CombatDialogueController` receives triggers from playback

### Mission Select (Prompt 51)

When player taps "PLAY" on a stage:
1. Load Combat scene
2. Check if `StoryCatalog.HasStory(stageId)`
3. If yes: StoryDirector plays pre-mission → combat → post-mission
4. If no: skip straight to combat (gameplay-only stages)

---

## Tests — `Tests/EditMode/Story/`

**`StoryBeatTests.cs`**:
- All BeatType values create valid StoryBeat objects
- StoryScript with empty beat lists is valid
- CharacterData contains all main cast members
- StoryCatalog register and retrieve works
- StoryCatalog returns null for unregistered stages

**`StoryDirectorTests.cs`**:
- PreMission with 0 beats completes immediately
- PreMission with dialogue beats produces correct sequence
- CombatDialogue beats are filtered by trigger condition
- CutsceneMarker beats are handled without error

---

## Commit

```
git add Assets/Scripts/Core/Story/ Assets/Scripts/MonoBehaviours/UI/Story/ Assets/Tests/EditMode/Story/
git commit -m "Prompt 54: Dialogue engine — StoryBeat data model, DialogueBox, NarrationBox, BriefCard, CombatDialogue, StoryDirector, screen effects"
```

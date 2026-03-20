# Unity Migration Plan — Auto Battler Port

> Comprehensive plan for migrating the HTML/JS prototype to Unity. Covers architecture, tooling (Unity MCP), testing strategy, git SOP, repo structure, and all major work tracks.

---

## Current State Summary

**Prototype**: Fully playable HTML/JS auto-battler (`game-v2.html` + 24 JS files, ~1.1MB total)
**Repository**: https://github.com/whcheong2008/gameTft — `main` at `e935f73`, tagged `v0.5.0-session11-complete`
**Systems implemented**: Combat engine (grid/movement/mana/abilities/status/bosses), 132 units (66 base + 66 evolved), 6 heroes with skill trees, Diablo-style item system, VE economy, 74 stages across 8 regions, gacha with pity
**Not implemented**: Story content, hard mode, endless/challenge modes, visual/audio polish, many hero skill node effects

---

## 1. Repository Structure Decision

**Recommendation: Same repo, `unity/` folder.**

Reasons:
- Design docs (COMBAT-DESIGN.md, UNITS-DESIGN.md, etc.) are shared between HTML prototype and Unity — keeping them in one repo avoids duplication and drift
- The HTML prototype serves as the "ground truth" reference during porting (per testing-architecture-strategy.md) — having both side-by-side makes comparison easy
- Prompts folder is the orchestration layer for BOTH the HTML and Unity work
- The codebase isn't large enough to justify separate repos (1.1MB JS + Unity project)
- Git handles mixed-language repos fine with a proper `.gitignore`

**Proposed structure:**
```
gameTft/
├── game-v2.html              ← HTML prototype (keep as reference)
├── js/                        ← JS source (keep as reference)
├── unity/                     ← Unity project root
│   ├── Assets/
│   │   ├── Scripts/
│   │   │   ├── Core/          ← Pure C# game logic (no MonoBehaviour)
│   │   │   │   ├── Combat/    ← Damage pipeline, targeting, movement, abilities
│   │   │   │   ├── Units/     ← Unit templates, stats, passives, evolution
│   │   │   │   ├── Items/     ← Equipment, affixes, Echo Shaping, gems
│   │   │   │   ├── Heroes/    ← Hero definitions, skill trees, bonuses
│   │   │   │   ├── Gacha/     ← Pull mechanics, pity, tier weights
│   │   │   │   ├── Economy/   ← VE, costs, progression math
│   │   │   │   └── Save/      ← Serialization, migration
│   │   │   ├── MonoBehaviours/ ← Unity-specific wrappers
│   │   │   ├── UI/            ← UI controllers
│   │   │   └── Story/         ← Narrative, cutscenes, dialogue
│   │   ├── Data/              ← ScriptableObjects (all balance data)
│   │   │   ├── Units/
│   │   │   ├── Items/
│   │   │   ├── Heroes/
│   │   │   ├── Stages/
│   │   │   └── Economy/
│   │   ├── Prefabs/
│   │   ├── Scenes/
│   │   ├── Art/               ← Sprites, VFX, UI assets
│   │   ├── Audio/
│   │   └── Tests/
│   │       ├── EditMode/      ← Unit tests (NUnit, no Unity lifecycle)
│   │       └── PlayMode/      ← Integration tests (need Unity scenes)
│   ├── Packages/
│   └── ProjectSettings/
├── prompts/                   ← Orchestrator prompts (shared)
├── testing/                   ← Testing strategy docs
├── orchestrators/             ← Domain orchestrator docs
├── keys/                      ← Gitignored secrets
├── Story V2/                  ← Chapter prose
├── *.md                       ← Design docs (shared reference)
└── .gitignore                 ← Updated for Unity
```

**`.gitignore` additions for Unity:**
```
# Unity
unity/Library/
unity/Temp/
unity/Logs/
unity/UserSettings/
unity/Builds/
unity/obj/
unity/Assets/Plugins/Editor/JetBrains*
*.csproj
*.sln
*.pidb
*.pdb
*.userprefs
*.booproj
*.svd
*.unityproj
*.suo
*.tmp
*.user
*.pidb.meta
*.pdb.meta
```

---

## 2. Unity MCP Integration (CoplayDev/unity-mcp)

### What It Does
Unity MCP bridges AI assistants (Claude Code, Claude Desktop, Cursor) with the Unity Editor via Model Context Protocol. It provides **37 tools** for:
- **Asset management**: Create/delete scripts, manage textures, shaders, prefabs, ScriptableObjects
- **Scene control**: Create/modify GameObjects, manage scenes, find objects
- **Component/material**: Add components, manage materials, animations, VFX, ProBuilder
- **Editor automation**: Run tests, read console, execute menu items, manage packages
- **Code validation**: Validate scripts via Roslyn, apply edits, reflection-based API inspection
- **Batch operations**: `batch_execute` for 10-100x faster multi-operation workflows

### Setup Requirements
- Unity 2021.3 LTS or later (recommend 2022.3 LTS for stability)
- Python 3.10+ with `uv` package manager
- Install via Package Manager: `https://github.com/CoplayDev/unity-mcp.git?path=/MCPForUnity#main`
- Window > MCP for Unity > Start Server (localhost:8080) > Configure for Claude Code

### How It Fits Our Workflow
The existing **orchestrator pattern** (Cowork designs prompts → Claude Code executes) extends naturally:

1. **Cowork** writes Unity migration prompts in `prompts/` (e.g., `34-unity-combat-core.md`)
2. **Claude Code** reads the prompt and uses Unity MCP tools to:
   - Create C# scripts (`create_script`)
   - Generate ScriptableObjects (`manage_scriptable_object`)
   - Set up scenes and prefabs (`manage_scene`, `manage_prefabs`)
   - Validate scripts before committing (`validate_script`)
   - Run tests after implementation (`run_tests`)
3. Claude Code commits to a feature branch, Cowork verifies and merges

### Key Unity MCP Tools by Migration Phase

| Phase | Primary Tools |
|-------|--------------|
| Project setup | `manage_packages`, `manage_editor`, `manage_scene` |
| Core logic port | `create_script`, `validate_script`, `apply_text_edits` |
| Data layer | `manage_scriptable_object`, `batch_execute` |
| Scene building | `manage_gameobject`, `manage_components`, `manage_prefabs` |
| UI | `manage_ui`, `manage_camera` |
| VFX/Graphics | `manage_vfx`, `manage_material`, `manage_shader`, `manage_graphics` |
| Testing | `run_tests`, `get_test_job`, `read_console` |

### Limitation: Graphics Track
Unity MCP can handle scene setup, materials, and basic VFX via tools — but **sprite art, animation design, and audio production** require human creative direction and external tools (Aseprite, Spine, FMOD). The MCP can wire up existing assets but can't create art from scratch.

---

## 3. Migration Phases

### Phase 0: Pre-Port Preparation (1-2 sessions)

**Goal**: Set up Unity project, extract ground truth, establish testing baseline.

1. **Create Unity project** inside `unity/` folder
   - Unity 2022.3 LTS, 2D URP template
   - Install packages: TextMeshPro, Unity Test Framework, Input System, Addressables
   - Install Unity MCP package
2. **Extract ground truth document** — consolidate all intended behaviors from design docs into a single testable spec:
   - Damage formula: `ATK * skillMultiplier * elementMultiplier * (1 - DEF/(DEF + 100))`
   - Gacha rates per player level (exact tables from PROGRESSION-REWORK.md)
   - Star-up copy costs (T1=3, T2=4, T3=5, T4=8, T5=10)
   - Team size progression (3→4→5→6→7→8 at L1/4/8/12/16/17)
   - All 132 unit stat tables
   - All hero skill tree effects
   - XP curve and level caps per region
3. **Set up Unity `.gitignore`** (see section 1 above)
4. **Create folder structure** (Scripts/Core, Data, Tests, etc.)

### Phase 1: Core Logic Port (3-5 sessions)

**Goal**: Port all pure game logic to C# classes that run independently of Unity lifecycle. This is the most critical phase — every system must be testable without MonoBehaviours.

**Priority order (dependencies flow downward):**

| Order | System | JS Source | C# Target | Unit Test Focus |
|-------|--------|-----------|------------|-----------------|
| 1a | Element/archetype data | `units-core.js` | `Core/Units/ElementSystem.cs`, `Core/Units/ArchetypeSystem.cs` | Matchup multipliers, synergy thresholds |
| 1b | Unit stat model | `units-templates.js` | ScriptableObjects in `Data/Units/` | Stat calculations at each star level |
| 2 | Damage pipeline | `main-v2.js` (combat section) | `Core/Combat/DamageCalculator.cs` | 7-step pipeline, edge cases from COMBAT-DESIGN.md Appendix B |
| 3 | Status effects | `main-v2.js` | `Core/Combat/StatusEffectSystem.cs` | DR on CC, tenacity, DoT ticks, immunity |
| 4 | Grid + movement | `main-v2.js` | `Core/Combat/GridSystem.cs`, `Core/Combat/Pathfinding.cs` | BFS paths, assassin dash, attack ranges |
| 5 | Mana + abilities | `units-abilities.js` | `Core/Combat/AbilitySystem.cs` | Mana gain, cast conditions, all 132 abilities |
| 6 | Passive system | `units-abilities.js` | `Core/Combat/PassiveSystem.cs` | 6 trigger types, reentry guards |
| 7 | Boss framework | `main-v2.js` | `Core/Combat/BossSystem.cs` | Phase transitions, telegraphs, enrage |
| 8 | Gacha system | `gacha.js` | `Core/Gacha/GachaSystem.cs` | Pity counter, tier weights, evolved copies |
| 9 | Item system | `items.js` | `Core/Items/ItemSystem.cs` | Tier×rarity generation, affixes, Echo Shaping |
| 10 | Hero system | `heroes.js` | `Core/Heroes/HeroSystem.cs` | Skill tree costs, node effects, hero XP |
| 11 | Economy/progression | `save.js`, `hub.js` | `Core/Economy/EconomySystem.cs` | VE income/spend, camp practice levels |
| 12 | Save system | `save.js` | `Core/Save/SaveSystem.cs` | Serialization roundtrip, migration |

**Key architectural principle**: Every system in `Core/` takes data in, returns results out. No MonoBehaviour references. No Unity API calls. This makes them unit-testable with NUnit in EditMode.

**Data-driven architecture** (per testing strategy):
- All balance numbers in ScriptableObjects, never hardcoded in logic
- Unit stats, gacha rates, item tables, XP curves, VE costs → `Data/` folder
- Code changes = new mechanics. Data changes = balance tuning.

### Phase 2: Unity Integration Layer (2-3 sessions)

**Goal**: Wire pure logic to Unity lifecycle, create the presentation layer.

1. **Combat scene**: Grid renderer (Tilemap or custom), unit placement, movement visualization
2. **Hub/Camp scene**: Building/practice panels, navigation
3. **Team builder scene**: Drag-to-position grid, synergy sidebar
4. **Gacha scene**: Pull animation, reveal, roster add
5. **Mission select scene**: Region map, stage list, lock display
6. **Save integration**: Wire `SaveSystem` to Unity's persistent data path (not localStorage)

### Phase 3: Story Integration (3-5 sessions) — MAJOR TRACK

**Goal**: Implement the full narrative layer. This is NOT a small addition — STORY-STAGES-V2.md is a 97KB production bible with complete scripts for all 74 stages. The story was intentionally deferred from the HTML prototype and is a first-class feature of the Unity version.

**Source material:**
- `Story V2/` — 8 chapters of novelized prose (the canonical narrative)
- `STORY-STAGES-V2.md` — Production bible mapping every stage to narrative content (environment, pre/post-mission dialogue, combat dialogue, Unity production notes)
- `STORY-BEATS-CATALOG-V2.md` — Beat-by-beat catalog for cross-referencing
- `STORY-DRAFT-V1.md` — Story bible with worldbuilding/lore-mechanics bridge

**Storytelling tools defined in STORY-STAGES-V2.md:**

| Tool | Usage | Count |
|------|-------|-------|
| Full cutscene | Major moments (revelation, deaths, ending) | 6-8 total |
| Dialogue scene | Pre/post mission character conversations | 2-4 per region |
| Combat dialogue | Characters speak during fights — callouts, reactions | Every stage |
| Environmental storytelling | Background elements, terrain, weather, sky | Every stage |
| Brief card | 1-3 line text cards between stages | As needed |
| Flashback overlay | Brief image flashes during gameplay | 1-2 total |

**Stage narrative rhythm (per region):**
- 2-3 Story stages (heavy — cutscene or extended dialogue)
- 2-3 Character stages (medium — brief dialogue + combat dialogue)
- 2-3 Gameplay stages (light — brief card + combat dialogue)
- 1 Boss stage (heavy — pre-fight scene + combat events + post-fight scene)

**Implementation sub-phases:**

**3a. Dialogue system setup:**
- Choose engine: Ink (branching, mature Unity integration, handles mechanical triggers like Lyric's death), Yarn Spinner (visual node editor, lighter), or custom
- Build dialogue UI: character portraits, text boxes, name plates, choice prompts
- Build cutscene framework: camera control, character positioning, transitions
- Build combat dialogue overlay: text boxes during gameplay, trigger system

**3b. Region 1-4 narrative (the arc through Lyric's death):**
- R1 (9 stages): Group forms, false worldview, first clue (Voidspawn targeting precision)
- R2 (10 stages): Mira joins, Ren joins, second clue (ancient texts, Wellspring)
- R3 (10 stages): Sera/Maren join, Hallen disagreement, Sovereign first sighted
- R4 (10 stages): **Core chapter** — Veil eruption, Otho's revelation, Kael vs Lyric, Lyric's sacrifice, group splits
- This is the emotional spine of the game. Get this right first.

**3c. Region 5-8 narrative (resolution):**
- R5 (9 stages): Seal theory, Maren/Sera return, Mira learns attunement
- R6 (8 stages): Otho warns about burning, refugee camp, Mira's question
- R7 (8 stages): Voss joins, seal plan presented
- R8 (10 stages): **Climax** — Sovereign fight (3 phases), the seal, Senna burns, Otho burns, Kael forces Mira

**3d. Environmental storytelling pass:**
- Stage backgrounds reflecting STORY-STAGES-V2.md environment descriptions
- Veil shimmer increasing across regions
- Weather/sky changes tracking narrative intensity
- This ties into the Graphics Track (D) — needs art direction first

**Key narrative-mechanical triggers to implement:**
- Lyric becomes unavailable after R4 Stage 10 (death)
- Group splits at end of R4 (Sera/Maren leave)
- Maren returns R5, Sera returns R5
- Voss joins R7
- Hero unlock/lock must sync with story progression
- Combat difficulty scales with narrative tension

**Writing rules** (from Story V2 README — must be enforced in all dialogue):
- No telegraphing ("this was the last time")
- No narrator explaining traits ("that was Lyric's gift")
- No counting patterns ("the second disagreement")
- Trust the reader — if a clue is well-placed, don't linger
- The seal scene uses visual descriptions, not percentages

### Phase 4: Content Completion (1-2 sessions)

**Goal**: Implement remaining deferred content.

- Endless mode (The Abyss) with floor modifiers
- Challenge modes (Time Trial, Survival, Restricted Roster, Puzzle)
- Hard mode stages
- Remaining hero skill node effects (many are placeholder `function(unit, hero) {}`)

### Phase 5: Visual & Audio Polish (separate track — see section 7)

**Goal**: Replace emoji with real art, add VFX, sound, music.

This is the **graphics track** you mentioned handling separately. The Unity project structure is ready for it — `Art/`, `Audio/`, `Prefabs/` folders exist. The MCP can wire up assets once they're created.

---

## 4. Testing Strategy (Aligned with testing-architecture-strategy.md)

Your existing testing doc is excellent and already tailored for a Unity port. Here's how it maps:

### Layer 1: Unit Tests (EditMode, NUnit)

**When**: Written alongside each Core/ class during Phase 1. Tests and logic travel together in the same branch.

```
Tests/EditMode/
├── Combat/
│   ├── DamageCalculatorTests.cs
│   ├── StatusEffectTests.cs
│   ├── GridSystemTests.cs
│   ├── AbilitySystemTests.cs
│   └── BossSystemTests.cs
├── Gacha/
│   └── GachaPullTests.cs
├── Items/
│   └── ItemGenerationTests.cs
├── Heroes/
│   └── HeroSkillTreeTests.cs
├── Economy/
│   └── ProgressionTests.cs
└── Save/
    └── SaveMigrationTests.cs
```

**Validation approach**: Run same scenarios in HTML prototype + C# tests. If results match, port is correct. Specific checks:
- Same battle scenario → same outcome (seeded RNG)
- 10,000 gacha pulls → same rarity distribution (within tolerance)
- Full session flow → same progression milestones

### Layer 2: Balance Simulation (On-Demand)

**When**: After core systems are ported and unit-tested.

- Economy simulator: 30/60/90 day player models
- Battle balance: Every unit vs every unit, 1,000 battles each
- Gacha fairness: 100,000 simulated players pulling to target

### Layer 3: Integration / Smoke Tests (PlayMode + Manual)

**When**: As soon as Unity version is playable end-to-end.

**Critical path smoke test** (manual, 5-10 min after every merge to main):
1. Launch → camp loads
2. Gacha → pull unit → appears in roster
3. Roster → assign hero → equip item
4. Team builder → position units → synergies display
5. Mission select → choose stage → enter combat
6. Combat resolves → results → rewards granted
7. Return to camp → VE/items reflected
8. Pull again → pity counter correct

**Automated PlayMode tests** where possible:
- Instantiate combat → run to completion → assert outcome
- Simulate pull sequence → assert roster state
- Simulate upgrade → assert stat changes + VE deduction

### Layer 4: Visual / UX / Feel (Manual Only)

**When**: After art and animation are in place.

Checklists from testing-architecture-strategy.md apply directly.

### Cross-Version Validation (HTML ↔ Unity)

**Keep the HTML prototype running** throughout the port. When Unity behavior looks wrong:
- Check HTML version: same behavior? → design issue
- Different behavior? → port bug
- Use `combat-benchmark.js` as reference for combat validation

---

## 5. Git SOP for Prompts

### The Problem
Prompts are the orchestration layer — they define what each Claude Code session implements. Currently 33 prompts exist with no formal versioning discipline beyond sequential numbering.

### The SOP

**Branch naming for prompts:**
```
prompt/XX-short-name       (new prompt)
prompt/XX-short-name-rev   (revision of existing prompt)
```

**Workflow:**

```
1. BRANCH    git checkout -b prompt/34-unity-combat-core
2. WRITE     Create/edit prompts/34-unity-combat-core.md
3. COMMIT    git add prompts/34-unity-combat-core.md
             git commit -m "Prompt 34: Unity combat core port — grid, damage, targeting"
4. PUSH      git push -u origin prompt/34-unity-combat-core
5. EXECUTE   Hand off to Claude Code: "Read prompts/34-unity-combat-core.md and implement"
             Claude Code works on a SEPARATE feature branch (e.g., feature/unity-combat-core)
6. VERIFY    Review Claude Code's implementation
7. MERGE     Merge BOTH branches to main:
             - prompt branch (the prompt itself)
             - feature branch (the implementation)
8. TAG       Tag if milestone (e.g., v0.7.0-unity-combat)
```

**Rules:**
- One prompt per branch. No multi-prompt branches.
- Prompt branch merges BEFORE or WITH the feature branch (prompt is the spec, implementation is the result).
- If a prompt needs revision after execution (e.g., Claude Code hit an issue), create `prompt/XX-short-name-rev` branch, update the prompt, re-execute.
- Prompt commit messages start with "Prompt XX:" for easy filtering in git log.
- Design doc changes that inform a prompt go in the SAME prompt branch (e.g., updating COMBAT-DESIGN.md as part of writing prompt 34).

**Naming convention for Unity prompts:**
```
34-unity-project-setup.md
35-unity-combat-core.md
36-unity-combat-abilities.md
37-unity-unit-data.md
38-unity-gacha-economy.md
39-unity-items.md
40-unity-heroes.md
41-unity-save-system.md
42-unity-hub-scene.md
43-unity-combat-scene.md
44-unity-team-builder.md
45-unity-mission-ui.md
46-unity-story-integration.md
...
```

---

## 6. Prompt Execution Tracks

Multiple Claude Code sessions can work in parallel on independent feature branches, just like Sessions 9-10 did with phase4-regions and phase5-progression.

### Track A: Core Logic (sequential — dependencies)
```
34 → 35 → 36 → 37 → 38 → 39 → 40 → 41
(setup → combat → abilities → units → gacha → items → heroes → save)
```

### Track B: Scenes & UI (after Track A reaches prompt 35)
```
42 → 43 → 44 → 45
(hub → combat scene → team builder → mission UI)
```

### Track C: Story (after basic scenes exist — THIS IS A BIG TRACK)
```
46 → 47 → 48 → 49 → 50 → 51
(dialogue system → combat dialogue overlay → R1-R4 narrative → R5-R8 narrative → environmental storytelling → lore codex)
```
Note: Track C is 3-5 sessions of work. STORY-STAGES-V2.md contains complete scripts for all 74 stages — this is not a light integration pass. The story was the major piece intentionally deferred from the HTML prototype.

### Track D: Graphics (separate session/LLM — your plan)
```
Art direction → Sprite creation → VFX → Audio → UI skin
```

### Track E: Mobile (future — after PC is playable)
```
Input system abstraction → Touch UI pass → Screen scaling → Performance profiling → Platform builds
```
Mobile build modules (iOS + Android) are installed in Unity but not targeted yet. The pure C# core and ScriptableObject-driven data make the logic portable as-is. The real mobile work is in UI (touch targets, screen layouts, aspect ratios 16:9 through 21:9) and performance (draw calls, memory, battery). This is a separate track after the PC version is feature-complete.

### Parallelism opportunities:
- Track A (prompts 34-37) and Track D (art direction) can start simultaneously
- Track B can start once Track A has combat core done
- Track C can start once Track B has basic scene scaffolding

---

## 7. Graphics Track (Separate Session)

As you noted, graphics is a major track on its own. Here's what the graphics session needs to know:

**What exists**: The Unity project will have all game logic and placeholder visuals by the time graphics starts.

**What's needed**:
- **Unit sprites**: 132 units (66 base + 66 evolved). Currently emoji in HTML. Need at minimum idle + attack + ability cast + death animations.
- **Boss sprites**: 8 bosses (2×2 grid size), multi-phase visual changes
- **UI skin**: Camp screen, gacha reveal, team builder grid, combat HUD, mission select map
- **Combat VFX**: Damage numbers, ability effects (132 unique), status effect icons, AoE indicators, telegraphs, boss phase transitions
- **Environment art**: 8 region backgrounds for combat and mission select
- **Audio**: BGM (camp, combat, boss), SFX (attacks, abilities, UI), gacha pull sounds

**Art style decision needed**: This should be decided before any art production begins. Options include pixel art (fastest, Aseprite), hand-drawn 2D (Spine for animation), or stylized 3D (most expensive).

**Integration point**: Graphics session produces assets → placed in `unity/Assets/Art/` and `unity/Assets/Audio/` → Unity MCP can help wire prefabs, materials, and animations.

---

## 8. Recommendations & Feedback

### Architecture Recommendations

1. **ScriptableObjects for EVERYTHING data-driven.** Your testing doc nails this — separate data from logic. Every unit stat table, gacha rate, item affix pool, hero skill tree, stage definition should be a ScriptableObject. This is the single biggest thing that makes the Unity port maintainable.

2. **Pure C# core, thin Unity wrapper.** The `Core/` folder should have zero `using UnityEngine;` statements (except maybe `Mathf`). This means all combat, gacha, items, heroes, economy can be unit-tested without loading Unity scenes. The MonoBehaviour layer is just input/output plumbing.

3. **Event-driven communication.** Use C# events or ScriptableObject-based event channels between systems. Don't have the combat system directly call UI code. This keeps the separation clean and makes it easy to swap out the presentation layer.

4. **Addressables for assets.** With 132 units, 8 bosses, and all associated art, you don't want everything loaded at once. Addressables let you load region-specific assets on demand.

5. **Ink for dialogue.** Your story is branching and includes mechanical triggers (Lyric's death, hero availability changes). Ink handles this well and has a mature Unity integration. Yarn Spinner is the alternative.

### Process Recommendations

6. **Keep the HTML prototype alive through Phase 1-2.** It's your regression oracle. When the Unity port produces different results, check the HTML version. Same? Design issue. Different? Port bug. Don't delete `game-v2.html` until Unity passes all validation.

7. **Port one system, test it, commit it.** Don't try to port everything then test. The testing strategy doc's "tests and logic travel together" principle is exactly right. Each prompt should include "write unit tests for this system" as part of the spec.

8. **Seeded RNG from day one.** Both combat and gacha use randomness. If you seed the RNG in both JS and C#, you can run identical scenarios and compare results deterministically. Add a debug seed input to both versions.

9. **Don't gold-plate the HTML prototype.** It's ready for Unity. Resist the temptation to add more features to the JS version. Every hour spent on HTML is an hour not spent on the real product.

### Scope Recommendations

10. **Vertical slice first.** Before porting ALL 132 units, port 6 (one per element) with full combat, gacha, items, and heroes working. This proves the architecture. Then batch-port the remaining data.

11. **Story integration is the differentiator — and it's bigger than you think.** STORY-STAGES-V2.md is 97KB of production-ready scripts for all 74 stages. This is 3-5 sessions of implementation work, not a quick pass. The HTML prototype proves the mechanics work. What the Unity version adds is the narrative that makes those mechanics matter — Lyric's death at R4, the group splitting, Kael's final betrayal of his own principles at R8. Prioritize R1-R4 narrative (the emotional spine through Lyric's death) before extending to R5-R8. And prioritize story over additional content modes (endless, challenge). A player who cries when Lyric dies will tell 10 friends. A player with 132 units and no narrative will tell zero.

12. **Consider lobby/camp as the first playable scene**, not combat. Getting the hub loop working (pull → assign hero → equip → deploy) proves more systems than combat alone and gives you a testable session flow immediately.

### Technical Warnings

13. **Save system migration.** The HTML prototype uses localStorage (JSON). Unity needs a different approach (JSON files in `Application.persistentDataPath`, or a binary format). Design the save schema fresh for Unity — don't try to maintain backwards compatibility with the HTML saves. The HTML prototype is the reference, not the data source.

14. **Combat benchmark parity.** `combat-benchmark.js` is a headless combat runner. Recreate this as an EditMode test in Unity. It's the fastest way to validate that combat math is identical.

15. **Main-v2.js is 300KB.** This monolith needs to be split into focused C# classes during porting. Don't try to translate it 1:1 — use the design docs as the spec and rewrite to clean C# architecture.

### On the Unity MCP Specifically

16. **It's most useful for boilerplate and scene setup**, not for complex logic. Use it to create ScriptableObjects, set up scenes, add components, and run tests. Write the actual C# game logic in prompts that Claude Code implements via normal file editing.

17. **`batch_execute` is your friend.** When creating 66 unit ScriptableObjects, batch them. Don't create one at a time.

18. **`validate_script` before committing.** Every prompt should end with "validate all new scripts" to catch compilation errors before they hit the branch.

19. **`run_tests` after implementation.** The merge ritual (from testing strategy) should include running tests via MCP before the merge.

---

## 9. Open Questions for You

1. **Unity version**: 2022.3 LTS recommended. Do you have a preference?
2. **Art style**: Pixel, 2D hand-drawn, or 3D? This affects the graphics track scope enormously.
3. **Dialogue system**: Ink (branching narrative, mature), Yarn Spinner (node-based, visual editor), or custom?
4. **Target platforms**: PC only? Mobile later? This affects UI architecture (mouse vs touch).
5. **Timeline**: Any target dates? This affects how aggressively we parallelize tracks.

---

## Appendix: Prompt Template for Unity Migration

```markdown
# Prompt XX: [Name]

## Context
- Read: [list of design docs and prior prompts to read first]
- Branch: feature/unity-[name]
- Depends on: Prompt XX (must be merged first)

## Goal
[One sentence: what this prompt accomplishes]

## Implementation Spec
[Detailed spec, referencing design doc sections]

## Files to Create/Modify
[Explicit file list with paths]

## Data to Extract
[What balance data should become ScriptableObjects]

## Tests Required
[What unit tests to write, what scenarios to validate]

## Validation
- [ ] All new scripts compile (use validate_script)
- [ ] All unit tests pass (use run_tests)
- [ ] [System-specific checks]

## Commit
Branch: feature/unity-[name]
Message: "Prompt XX: [description]"
```

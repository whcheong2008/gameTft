# Prompt 52: Combat Scene

> **Purpose**: Build the combat scene — the real-time auto-battler visualization. This wires the existing Core/Combat engine to a Unity scene with animated placeholder units, health bars, damage numbers, ability effects, and speed controls. The combat logic is ALREADY DONE in Core/ — this prompt is purely the visual layer.
>
> **Branch**: `feature/unity-combat-scene`
> **Depends on**: Prompt 47 (UI foundation), Prompts 36-39 + 45 (combat engine)
> **Session type**: Claude Code with Unity MCP

---

## Read First

1. `UNITY-ARCHITECTURE.md` — Core/ ↔ UI boundary
2. `js/ui-v2.js` lines 2602–3500 — `showCombatStartText()`, `renderCombatBoard()`, `renderCombatScoreboard()`, `renderCombatSynergyBar()`, combat animation system
3. `GROUND-TRUTH.md` section 1 (Combat) — turn flow, damage pipeline, timing
4. `js/combat-v2.js` — Combat loop, wave system, repositioning between waves
5. `COMBAT-DESIGN.md` — Design intent for combat feel

---

## Scene: `Combat.unity`

### Layout

```
┌──────────────────────────┐
│  Wave 1/3  Turn 5        │  ← Combat HUD (wave, turn, timer)
│  [1x] [2x] [4x] [Skip]  │  ← Speed controls
├──────────────────────────┤
│                          │
│  ┌──┬──┬──┬──┐           │
│  │E1│E2│E3│E4│ Enemy     │  ← Enemy grid (4×2)
│  ├──┼──┼──┼──┤ Back      │
│  │E5│E6│E7│  │ Front     │
│  └──┴──┴──┴──┘           │
│                          │
│  ─── VS ───              │  ← Center divider
│                          │
│  ┌──┬──┬──┬──┐           │
│  │P1│P2│P3│  │ Player    │  ← Player grid (4×2)
│  ├──┼──┼──┼──┤ Front     │
│  │P4│P5│P6│P7│ Back      │
│  └──┴──┴──┴──┘           │
│                          │
├──────────────────────────┤
│  Synergy Bar             │  ← Active synergies for player team
├──────────────────────────┤
│  Combat Log (collapsed)  │  ← Expandable combat log
│  "Flame Warrior hits..." │
└──────────────────────────┘
```

---

## Key Design: Step-by-Step Playback

The combat engine (`CombatEngine.ExecuteTurn()`) already runs the full battle as pure logic. The combat scene plays it back visually:

1. **Pre-combat**: Run `CombatEngine.RunFullBattle()` to get the complete `BattleLog` (list of every turn's actions and results)
2. **Playback**: Step through the log, animating each action with configurable speed
3. **Speed controls**: 1x (real-time), 2x (fast), 4x (very fast), Skip (instant result)

This means the UI is a **replay system**, not a real-time simulation.

---

## Files to Create

### `Scripts/MonoBehaviours/UI/Combat/CombatSceneController.cs`

Main controller — orchestrates the entire combat flow.

```
- OnSceneLoad:
  1. Receive stage data (enemies, waves) from SceneRouter context
  2. Build player CombatUnits from save data (team + equipment + synergy bonuses)
  3. Build enemy CombatUnits for wave 1
  4. Run CombatEngine.RunFullBattle() for wave 1
  5. Begin playback

- Wave flow:
  1. Show "Wave X/Y" intro text (1s)
  2. Play back battle log turn by turn
  3. On wave end: show wave result
  4. If more waves: optional reposition phase, then run next wave
  5. On final wave end: show mission results

- Handles speed control state
- Handles pause/resume
```

### `Scripts/MonoBehaviours/UI/Combat/CombatGridRenderer.cs`

Renders the two 4×2 grids with units.

```
- Two grids: player (bottom) and enemy (top)
- Each cell: empty or contains a CombatUnitView
- Grid cells are fixed positions in screen space
- Unit placement matches grid coordinates
- Highlight active unit (whose turn it is) with yellow border
- Dead units: fade out and show X marker
```

### `Scripts/MonoBehaviours/UI/Combat/CombatUnitView.cs`

Visual representation of one unit in combat.

```
- Placeholder sprite (element-colored rectangle from PlaceholderFactory)
- Unit name label (small, above sprite)
- Health bar (green → yellow → red as HP decreases)
- Mana bar (blue, below health bar)
- Star indicator
- Status effect icons (small icons above unit, from StatusEffectIconMap)
- Shield overlay (translucent blue when shielded)

Animations (simple tweens, no external packages):
- Attack: quick lunge toward target (0.15s forward, 0.15s back)
- Take damage: brief red flash + shake
- Heal: brief green flash
- Cast ability: brief glow in element color
- Death: fade to 0 alpha over 0.3s
- Dodge: quick sidestep
```

### `Scripts/MonoBehaviours/UI/Combat/BattlePlaybackController.cs`

Steps through the battle log and triggers animations.

```
- PlayTurn(TurnResult turn):
  1. Highlight active unit
  2. If auto-attack: play attack animation, show damage number on target
  3. If ability cast: play ability animation, show ability name text, apply effects
  4. If heal: play heal animation on target, show green heal number
  5. If status applied: show status icon appear on target
  6. If unit dies: play death animation
  7. Update all health/mana bars
  8. Wait for animation completion before next turn

- Speed multiplier affects animation durations and wait times
- Skip mode: instantly apply all results, no animations
```

### `Scripts/MonoBehaviours/UI/Combat/DamageNumberController.cs`

Floating damage/heal numbers.

```
- SpawnDamageNumber(Vector3 position, int amount, DamageNumberType type)
- Types: Normal (white), Critical (yellow, larger, "CRIT!" prefix), Heal (green, "+"), Dodge ("DODGE" gray), Shield ("BLOCKED" blue)
- Float upward + fade out over 0.8s
- Pool/reuse for performance
```

### `Scripts/MonoBehaviours/UI/Combat/CombatHUDController.cs`

Top HUD showing combat state.

```
- Wave indicator: "Wave 1/3"
- Turn counter: "Turn 5"
- Speed buttons: [1x] [2x] [4x] [Skip]
  - Highlight active speed
  - Skip button shows confirm dialog first
- Timer (optional, for display)
```

### `Scripts/MonoBehaviours/UI/Combat/CombatSynergyBarController.cs`

Bottom synergy display during combat.

```
- Horizontal list of active synergies for player team
- Each: element/archetype icon + count + tier dots
- Compact display (icons only, tap to expand)
- Reference: renderCombatSynergyBar() in ui-v2.js
```

### `Scripts/MonoBehaviours/UI/Combat/CombatLogController.cs`

Expandable combat log at bottom.

```
- Collapsed: shows last action text (one line)
- Expanded: scrollable log of all actions this battle
- Each entry: "[Turn X] Unit → Action → Target: Result"
- Color-coded: damage=red, heal=green, status=yellow, death=gray
- Toggle expand/collapse on tap
```

### `Scripts/MonoBehaviours/UI/Combat/WaveTransitionController.cs`

Between-wave screens.

```
- "Wave X Complete!" text (1.5s display)
- Optional reposition phase:
  - Show player grid, allow tapping units to swap positions
  - "Ready" button to proceed
  - Timer (15s countdown, auto-proceed)
- "Wave X+1 Starting..." text
```

### `Scripts/MonoBehaviours/UI/Combat/MissionResultController.cs`

Post-combat results screen.

```
- Victory or Defeat banner
- Star rating (1-3 stars with animation)
- Rewards earned: VE, XP, items
- "Continue" button → return to Hub
- First-clear bonus highlight
- Reference: showMissionResults() in ui-v2.js
```

---

## Battle Log Data Structure

The existing `CombatEngine` may need a small extension to output a structured log. Create in Core/:

### `Scripts/Core/Combat/BattleLog.cs`

```
BattleLog:
  - List<WaveLog> Waves

WaveLog:
  - int WaveNumber
  - List<TurnLog> Turns
  - bool PlayerWon

TurnLog:
  - string ActorUnitId
  - TurnActionType Action (AutoAttack, AbilityCast, HealerHeal)
  - string TargetUnitId
  - int DamageDealt
  - int HealAmount
  - bool WasCrit
  - bool WasDodged
  - bool WasShieldBlocked
  - int ShieldAbsorbed
  - List<StatusApplied> StatusEffects
  - List<string> UnitsKilled
  - int ActorManaAfter
  - int TargetHPAfter
```

If `CombatEngine` doesn't already produce this log format, add a logging mode that records every action. The log is generated during `RunFullBattle()` and consumed by the playback controller.

---

## Tests — `Tests/EditMode/UI/`

**`BattlePlaybackTests.cs`**:
- Empty battle log produces no playback actions
- Single turn log produces correct animation sequence
- Speed multiplier affects playback timing
- Skip mode completes instantly

**`DamageNumberTests.cs`**:
- Correct text for damage types (normal, crit, heal, dodge)
- Numbers spawn at correct positions

---

## Commit

```
git add Assets/Scenes/Combat.unity Assets/Scripts/MonoBehaviours/UI/Combat/ Assets/Scripts/Core/Combat/BattleLog.cs Assets/Tests/EditMode/UI/
git commit -m "Prompt 52: Combat scene — grid renderer, unit animations, damage numbers, battle playback, speed controls, wave transitions, results screen"
```

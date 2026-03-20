# Prompt 47: UI Foundation — Scene Manager, Event Bus, Placeholder System

> **Purpose**: Set up the UI architecture before building individual screens. This creates the scene management system, a lightweight event bus for Core↔UI communication, a placeholder sprite/asset system for development, and shared UI components (top bar, toasts, dialogs).
>
> **Branch**: `feature/unity-ui-foundation`
> **Depends on**: Prompt 34 (project setup), all Track A prompts
> **Session type**: Claude Code with Unity MCP

---

## Read First

1. `UNITY-ARCHITECTURE.md` — Folder map, golden rule (Core/ has no Unity deps)
2. `js/ui-v2.js` lines 1–170 — Top bar, toast, hub screen (for reference on UI patterns)
3. `js/hub.js` — Screen management (`showScreen()` function)

---

## Architecture Principles

1. **Core/ stays pure C#** — All Unity UI code goes in `Scripts/MonoBehaviours/UI/` or `Scripts/UI/`
2. **Event-driven** — Core systems fire events, UI subscribes. No Core→UI references.
3. **Placeholder everything** — Colored rectangles with text labels for units, icons, buttons. No real art assets yet.
4. **Mobile-first layout** — 9:16 portrait aspect ratio (1080×1920 reference resolution). All UI uses Canvas Scaler with "Scale with Screen Size".

---

## Scene Structure

Create these scenes in `Assets/Scenes/`:

| Scene | Purpose | Load Mode |
|-------|---------|-----------|
| `Boot.unity` | Already exists. Init, load save, transition to Hub | Entry point |
| `Hub.unity` | Camp/hub with building buttons | Additive after boot |
| `Gacha.unity` | Summoning + roster management | Additive, replaces Hub |
| `TeamBuilder.unity` | Team composition + equipment | Additive, replaces Hub |
| `MissionSelect.unity` | Region map + stage list | Additive, replaces Hub |
| `Combat.unity` | Battle scene | Additive, replaces all |

---

## Files to Create

### `Scripts/MonoBehaviours/UI/SceneRouter.cs`

Manages scene transitions. Singleton MonoBehaviour on a persistent GameObject.

```
- LoadScene(string sceneName) — async load with transition fade
- ReturnToHub() — unload current, load Hub
- Current scene tracking
- Simple fade-to-black transition (0.3s fade out, load, 0.3s fade in)
- Use a black Canvas overlay for the fade
```

### `Scripts/MonoBehaviours/UI/GameEventBus.cs`

Lightweight pub/sub for Core↔UI communication. Static class, no MonoBehaviour needed.

```
Events to define (C# events or Action delegates):
- OnGoldChanged(int newAmount)
- OnXPChanged(int newXP, int xpToNext)
- OnLevelUp(int newLevel)
- OnUnitRolled(string unitId)
- OnUnitStarredUp(string unitId, int newStars)
- OnTeamChanged(int teamIndex)
- OnItemEquipped(string unitId, string itemId)
- OnCombatStarted()
- OnCombatTurnCompleted(int turnNumber)
- OnCombatEnded(bool victory, int stars)
- OnSaveCompleted()
- OnToastRequested(string message)
```

### `Scripts/MonoBehaviours/UI/PlaceholderFactory.cs`

Generates colored placeholder sprites at runtime. Static utility.

```
- CreateUnitSprite(string element, int tier) → Sprite
  - Color by element: Fire=red, Water=blue, Earth=green, Wind=cyan, Lightning=yellow, Force=purple
  - Size scaled by tier (T1 small → T5 large)
  - Text label with unit name overlaid

- CreateIconSprite(Color color, string label) → Sprite
  - Generic colored square with text

- CreateSlotSprite() → Sprite
  - Gray dotted outline for empty equipment/grid slots

All generated at runtime using Texture2D — NO external asset files needed.
```

### `Scripts/MonoBehaviours/UI/TopBarController.cs`

Persistent top bar across all non-combat scenes.

```
- Player level display
- VE (Veil Essence) currency display
- XP bar (fill amount)
- Back button (hidden on Hub)
- Subscribes to OnGoldChanged, OnXPChanged, OnLevelUp from EventBus
- Reference: renderTopBar() in ui-v2.js
```

### `Scripts/MonoBehaviours/UI/ToastController.cs`

Toast notification system.

```
- ShowToast(string message, float duration = 3f)
- Queue system (max 3 visible at once, stack vertically)
- Fade in/out animation
- Gold background, dark text (matching prototype style)
```

### `Scripts/MonoBehaviours/UI/ConfirmDialogController.cs`

Modal confirmation dialog.

```
- Show(string message, Action onConfirm, Action onCancel = null)
- Dark overlay blocking input behind it
- Message text, Confirm button, Cancel button
- Reference: showConfirmDialog() in ui-v2.js
```

### `Scripts/MonoBehaviours/UI/GameBootstrap.cs`

Update existing Boot.unity to:

```
1. Initialize SaveManager (load or create save)
2. Initialize GameEventBus
3. Transition to Hub scene
```

---

## Prefabs to Create — `Assets/Prefabs/UI/`

Create these as prefabs for reuse across scenes:

- `TopBar.prefab` — The persistent top bar
- `Toast.prefab` — Single toast notification
- `ConfirmDialog.prefab` — Modal dialog
- `FadeOverlay.prefab` — Black fullscreen overlay for transitions
- `UnitCard.prefab` — Reusable unit display card (placeholder sprite + name + stars + tier badge)

### `UnitCard` layout:
```
- Background (element-colored border)
- Unit sprite area (placeholder colored rect)
- Name label (bottom)
- Star icons (below name)
- Tier badge (top-right corner, T1-T5)
- Element icon (top-left, colored circle with letter: F/W/E/Wi/L/Fo)
```

---

## Canvas Setup

Every scene's Canvas should use:
```
- Canvas Scaler: Scale with Screen Size
- Reference Resolution: 1080 × 1920
- Match: 0.5 (width/height balance)
- Render Mode: Screen Space - Overlay
```

---

## Tests — `Tests/EditMode/UI/`

**`GameEventBusTests.cs`**:
- Subscribe to event → fire event → handler called with correct data
- Unsubscribe → fire event → handler NOT called
- Multiple subscribers all receive event
- No exceptions when firing event with zero subscribers

**`PlaceholderFactoryTests.cs`**:
- CreateUnitSprite returns non-null Sprite for each element
- CreateIconSprite returns sprite with correct dimensions
- CreateSlotSprite returns non-null

---

## Commit

```
git add Assets/Scripts/MonoBehaviours/UI/ Assets/Prefabs/ Assets/Scenes/ Assets/Tests/EditMode/UI/
git commit -m "Prompt 47: UI foundation — SceneRouter, EventBus, PlaceholderFactory, TopBar, Toast, ConfirmDialog, UnitCard prefab"
```

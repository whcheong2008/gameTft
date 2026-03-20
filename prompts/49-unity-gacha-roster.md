# Prompt 49: Gacha + Roster Screen

> **Purpose**: Build the summoning (gacha) screen and roster management screen. Players roll for units, view their collection, star up units, and sell duplicates. All graphics use placeholders.
>
> **Branch**: `feature/unity-gacha-roster`
> **Depends on**: Prompt 47 (UI foundation), Prompt 41 (gacha/economy core logic)
> **Session type**: Claude Code with Unity MCP

---

## Read First

1. `js/ui-v2.js` lines 867–976 — `renderGachaScreen()` (rolling UI, rates display, pity info)
2. `js/ui-v2.js` lines 1471–1630 — `renderRosterScreen()`, `showSellPanel()` (unit collection, star-up, selling)
3. `js/gacha.js` — `rollUnit()`, tier weights, pity system, multi-roll
4. `GROUND-TRUTH.md` section 7 (Gacha) — rates, pity thresholds, level-gated tiers
5. `GROUND-TRUTH.md` section 8 (Economy) — VE costs for rolling

---

## Scene: `Gacha.unity`

Two screens in one scene, toggled via tab buttons at top.

### Gacha Tab Layout

```
┌──────────────────────────┐
│       [Top Bar]          │
├──────────────────────────┤
│  [Gacha Tab] [Roster Tab]│  ← Tab buttons
├──────────────────────────┤
│                          │
│   ✨ Attunement Rite ✨   │  ← Title
│                          │
│   Current Rates:         │
│   T1: 50%  T2: 30%      │  ← Rate display (changes by player level)
│   T3: 15%  T4: 4%       │
│   T5: 1%                 │
│                          │
│   Pity: 14/20 to T3+    │  ← Pity counter
│                          │
│  ┌────────────────────┐  │
│  │  [Roll 1x — 50 VE] │  │  ← Single roll button
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ [Roll 10x — 450 VE]│  │  ← Multi-roll button (discount from building)
│  └────────────────────┘  │
│                          │
│  ── Last Roll Result ──  │
│  ┌──────┐                │  ← Unit card(s) from last roll
│  │ Unit │                │
│  └──────┘                │
│                          │
├──────────────────────────┤
│ [Gacha] [Team] [Mission] │  ← Bottom nav
└──────────────────────────┘
```

### Roll Animation

Simple placeholder animation:
1. Button press → buttons disabled, "Rolling..." text
2. Cards fly in from top (0.5s tween per card)
3. Each card flashes its element color on arrival
4. New/rare units get a brief gold border flash
5. For 10x: cards appear in a 2×5 grid with stagger

### Roster Tab Layout

```
┌──────────────────────────┐
│       [Top Bar]          │
├──────────────────────────┤
│  [Gacha Tab] [Roster Tab]│
├──────────────────────────┤
│  Sort: [Element▼] [Tier▼]│  ← Sort/filter controls
│  Filter: [All▼]          │
├──────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐   │
│  │Unit│ │Unit│ │Unit│   │  ← Scrollable grid (4 columns)
│  │ ★★ │ │ ★  │ │★★★│   │
│  └────┘ └────┘ └────┘   │
│  ┌────┐ ┌────┐ ┌────┐   │
│  │Unit│ │Unit│ │Unit│   │
│  └────┘ └────┘ └────┘   │
│  ... (ScrollView)        │
├──────────────────────────┤
│ [Gacha] [Team] [Mission] │
└──────────────────────────┘
```

### Unit Detail Popup (tap a unit in roster)

```
┌──────────────────────────┐
│         [X Close]        │
│  ┌──────────────┐        │
│  │  Unit Sprite  │       │  ← Large placeholder
│  │  (element bg) │       │
│  └──────────────┘        │
│  Flame Warrior ★★        │
│  T1 | Fire | Duelist     │
│  HP: 600  ATK: 50        │
│  DEF: 30  SPD: 85        │
│  Mana: 0/65              │
│                          │
│  Copies: 4/10 to next ★  │
│  ┌────────────────────┐  │
│  │  [Star Up — 100 VE] │ │  ← If enough copies
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │    [Sell — 25 VE]   │ │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │   [Evolve — 500 VE] │ │  ← If eligible and lab built
│  └────────────────────┘  │
└──────────────────────────┘
```

---

## Files to Create

### `Scripts/MonoBehaviours/UI/Gacha/GachaSceneController.cs`
- Manages tab switching between Gacha and Roster views
- Initializes both sub-controllers

### `Scripts/MonoBehaviours/UI/Gacha/GachaTabController.cs`
- Displays current rates (read from Core/Gacha logic based on player level)
- Pity counter display
- Roll 1x / Roll 10x buttons
- Calls Core gacha logic, receives rolled unit(s)
- Triggers roll animation
- Shows rolled unit cards in result area
- Disables buttons during animation and when insufficient VE

### `Scripts/MonoBehaviours/UI/Gacha/RollAnimationController.cs`
- Animates unit cards appearing after a roll
- Single roll: one card drops in with bounce
- Multi roll: 10 cards in 2×5 grid with staggered reveal
- Element-colored flash per card
- Uses DOTween-style manual animation (or Unity Animation) — no external packages required

### `Scripts/MonoBehaviours/UI/Gacha/RosterTabController.cs`
- Loads all owned units from save data
- Displays in scrollable grid (4 columns) using UnitCard prefab from Prompt 47
- Sort options: by element, tier, stars, name
- Filter: by element, by tier, "Evolvable" filter
- Tap card → open unit detail popup

### `Scripts/MonoBehaviours/UI/Gacha/UnitDetailPopupController.cs`
- Full unit stat display
- Star-up button (shows copy count, cost, enabled if enough copies + VE)
- Sell button (with confirm dialog, shows VE return value)
- Evolve button (if Deep Resonance building is built and unit is eligible)
- All actions call Core systems, then refresh UI

---

## Tests — `Tests/EditMode/UI/`

**`GachaUITests.cs`**:
- Roll button disabled when VE < cost
- Multi-roll discount applied correctly based on building level
- Rate display matches player level (T5 only shows at level 15+)
- Pity counter increments correctly

---

## Commit

```
git add Assets/Scenes/Gacha.unity Assets/Scripts/MonoBehaviours/UI/Gacha/ Assets/Tests/EditMode/UI/
git commit -m "Prompt 49: Gacha + Roster — rolling UI, rate display, pity, roster grid, unit detail, star-up, sell, evolve"
```

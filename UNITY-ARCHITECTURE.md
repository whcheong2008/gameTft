# Unity Architecture — The Shattered Veil

> Quick reference for any session working on the Unity project. Read this before making changes. Updated after each major prompt.

---

## Project Location

```
Game TFT/Unity/ShatteredVeil/
```

Unity 6 LTS, 2D URP template. MCP: CoplayDev/unity-mcp on localhost:8080.

---

## The Golden Rule

**`Scripts/Core/` has NO Unity dependencies.** The assembly definition `GameCore.asmdef` enforces `noEngineReferences: true`. If you need `UnityEngine`, put it in `Scripts/MonoBehaviours/` or `Scripts/Data/`. This is what makes the entire game logic unit-testable without loading Unity.

---

## Folder Map

```
Unity/ShatteredVeil/Assets/
│
├── Scripts/
│   ├── Core/                          ← PURE C# (no UnityEngine)
│   │   ├── Combat/                    ← Combat engine (biggest system)
│   │   │   ├── Element.cs             ← Enum: Fire, Water, Earth, Wind, Lightning, Force
│   │   │   ├── Archetype.cs           ← Enum: 9 archetypes
│   │   │   ├── ElementSystem.cs       ← 6×6 matchup table (1.3/0.7/1.0)
│   │   │   ├── GridPosition.cs        ← 2D int struct, Manhattan distance
│   │   │   ├── GridSystem.cs          ← 4×2 grid per side, BFS pathfinding
│   │   │   ├── CombatUnit.cs          ← Runtime unit (stats, position, state, IsHealer)
│   │   │   ├── CombatState.cs         ← Battle snapshot (teams, turn, phase)
│   │   │   ├── CombatEngine.cs        ← Main loop: ExecuteTurn(), RunFullBattle()
│   │   │   ├── DamageCalculator.cs    ← 13-step pipeline from GROUND-TRUTH.md
│   │   │   ├── DamageContext.cs       ← Pipeline context (force crit, spell pen, etc.)
│   │   │   ├── DamageResult.cs        ← Output (damage, crit, dodge, shield absorbed)
│   │   │   ├── TargetingSystem.cs     ← Nearest/LowestHP/HighestATK/Random/Taunt
│   │   │   ├── TurnOrderSystem.cs     ← SPD-based queue
│   │   │   ├── ManaSystem.cs          ← Mana gain/cast/consume (+10 per auto/heal)
│   │   │   ├── UnitAbilityCatalog.cs  ← 132 per-unit unique ability functions (v2)
│   │   │   ├── TierScaling.cs         ← T1-T5 scaling (1.8×–3.2× base, 2.34×–4.80× evolved)
│   │   │   ├── ElementStatusMap.cs    ← Element → status effect mapping
│   │   │   ├── AbilityExecutor.cs     ← Resolves ability results
│   │   │   ├── AbilityData/Result.cs  ← Ability data structures
│   │   │   ├── StatusEffect*.cs       ← Status types, system, categories
│   │   │   ├── DiminishingReturns.cs  ← CC DR (8s window, 50%/25% reduction)
│   │   │   ├── PassiveSystem.cs       ← Trigger hooks (onHit, onHeal, onKill, etc.)
│   │   │   ├── Boss*.cs              ← Boss data, catalog (8 bosses), system, phases
│   │   │   └── Telegraph*.cs         ← Boss telegraph types and data
│   │   │
│   │   ├── Units/                     ← Unit data interfaces
│   │   │   ├── IUnitData.cs           ← Interface (no Unity dependency)
│   │   │   ├── UnitStatCalculator.cs  ← Stat formula per star level
│   │   │   ├── EvolutionSystem.cs     ← Star-up costs, evolution pairs
│   │   │   └── SynergyCalculator.cs   ← Element + archetype synergy bonuses
│   │   │
│   │   ├── Gacha/                     ← Pull mechanics
│   │   │   ├── GachaSystem.cs         ← Pull, pity, tier weights, level-gating
│   │   │   ├── IGachaConfig.cs        ← Interface for testing
│   │   │   └── GachaPullResult.cs
│   │   │
│   │   ├── Economy/                   ← VE, XP, progression
│   │   │   ├── EconomySystem.cs       ← Spend/grant VE, level up, star-up, practices
│   │   │   ├── IEconomyConfig.cs      ← Interface for testing
│   │   │   └── EconomyResults.cs
│   │   │
│   │   ├── Items/                     ← Equipment system (Prompt 42 — pending)
│   │   ├── Heroes/                    ← Hero system
│   │   │   ├── HeroId.cs             ← Enum: Kael, Lyric, Ren, Sera, Maren, Voss
│   │   │   ├── HeroCatalog.cs        ← 6 heroes, 120 skill nodes
│   │   │   ├── HeroSkillTreeSystem.cs ← Invest/respec, budget math (can't get both capstones)
│   │   │   ├── HeroAvailabilitySystem.cs ← Story-gated: Lyric dies R4, Sera/Maren leave R4
│   │   │   ├── HeroAssignmentSystem.cs ← One hero per unit, dead heroes can't assign
│   │   │   └── HeroXPSystem.cs       ← Level 1-20, 1 skill point per level
│   │   │
│   │   ├── Save/                      ← Save data models (Prompt 44 — pending)
│   │   └── Story/                     ← Story/narrative logic (Track C — future)
│   │
│   ├── Data/                          ← ScriptableObject definitions (USES UnityEngine)
│   │   ├── UnitTemplate.cs            ← ScriptableObject for unit stat definitions
│   │   ├── SynergyDefinition.cs       ← ScriptableObject for synergy bonuses
│   │   ├── GachaConfig.cs             ← ScriptableObject for gacha rates
│   │   └── EconomyConfig.cs           ← ScriptableObject for economy values
│   │
│   ├── MonoBehaviours/                ← Unity lifecycle wrappers (USES UnityEngine)
│   │   └── (SaveManager.cs — Prompt 44)
│   │
│   └── UI/                            ← UI controllers (Track B — future)
│
├── Data/                              ← ScriptableObject instances (assets)
│   ├── Units/                         ← 132 unit assets (Fire/, Water/, Earth/, Wind/, Lightning/, Force/)
│   ├── Synergies/                     ← 15 synergy assets (6 element + 9 archetype)
│   └── Economy/                       ← Gacha config, economy config
│
├── Tests/
│   ├── EditMode/                      ← Unit tests (NUnit, no Unity lifecycle)
│   │   ├── Combat/                    ← ~15 test files covering all combat systems
│   │   ├── Units/                     ← 3 test files (stats, evolution, synergies)
│   │   ├── Gacha/                     ← 1 test file
│   │   ├── Economy/                   ← 1 test file
│   │   ├── Heroes/                    ← 5 test files
│   │   ├── Items/                     ← (Prompt 42 — pending)
│   │   └── Save/                      ← (Prompt 44 — pending)
│   └── PlayMode/                      ← Integration tests (Track B — future)
│
├── Scenes/                            ← (Track B — future)
├── Prefabs/                           ← (Track B — future)
├── Art/                               ← (Track D — separate graphics session)
└── Audio/                             ← (Track D — separate graphics session)
```

---

## System Dependency Graph

```
                    ┌─────────────┐
                    │ CombatEngine│ ← orchestrates everything
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌─────────────┐ ┌──────────────┐ ┌───────────────┐
   │DamageCalc   │ │UnitAbility   │ │PassiveSystem  │
   │(13 steps)   │ │Catalog (132) │ │(triggers)     │
   └──────┬──────┘ └──────┬───────┘ └───────┬───────┘
          │               │                 │
   ┌──────▼──────┐ ┌──────▼───────┐ ┌───────▼───────┐
   │ElementSystem│ │TierScaling   │ │StatusEffect   │
   │(6×6 table)  │ │(T1-T5)       │ │System (DR,CC) │
   └─────────────┘ └──────────────┘ └───────────────┘
          │
   ┌──────▼──────┐
   │GridSystem   │
   │(BFS, 4×2)   │
   └─────────────┘
```

Non-combat systems are independent:

```
GachaSystem ──→ IGachaConfig (ScriptableObject)
EconomySystem ──→ IEconomyConfig (ScriptableObject)
HeroSystem ──→ HeroCatalog (6 heroes, 120 nodes)
ItemSystem ──→ (Prompt 42 — pending)
SaveSystem ──→ All of the above (serializes everything)
```

---

## The 3-Layer Ability Architecture (v2)

This is the most important architectural decision. Understand these three layers:

| Layer | What | Where | Example |
|-------|------|-------|---------|
| **Element** | Auto-attack passive effects | Synergy system (SynergyCalculator) | Fire(2): attacks apply Burn 10 DPS 3s |
| **Template** | Classification tag for UI/balance | `CombatUnit.AbilityTemplateId` | "execute_striker" — displayed as a tag |
| **Unit** | Unique ability function | `UnitAbilityCatalog.Get(unitId)` | Flame Warrior: slash + crit <40% + mana refund |

**Ability dispatch**: `UnitAbilityCatalog.Get(unit.UnitId)` — by UNIT key, not template.
**Passive dispatch**: Element synergy handles auto-attack effects. Template passives are minimal.
**Healer exception**: Healers auto-heal lowest-HP ally instead of attacking. Fires `onHeal` not `onHit`.

---

## Combat Flow (CombatEngine.ExecuteTurn)

```
1. Dequeue next alive unit from SPD-sorted queue
2. If boss: check phase transition, enrage, cooldowns
3. If stunned/frozen: skip turn
4. IF HEALER:
   a. Find lowest-HP% ally (not full HP)
   b. If mana full → cast ability (heal_and_harm etc.)
   c. Else → auto-heal (ATK → healing, +10 mana, fire onHeal)
   d. If all allies full → fall through to enemy attack
5. Select enemy target (nearest by default)
6. If not in range → move toward target (BFS)
7. If mana full → cast ability via UnitAbilityCatalog
8. Else → auto-attack via DamageCalculator (13-step pipeline)
9. Fire passive triggers (OnAttack, OnHit, OnKill)
10. Tick auras and periodic passives
11. Check win/loss condition
```

---

## Data Flow: How Stats Reach Combat

```
ScriptableObject (UnitTemplate.asset)
    ↓ base stats
UnitStatCalculator.CalculateHP(data, starLevel)
    ↓ star-scaled stats
+ HeroSkillTreeSystem.GetTotalBonuses(hero)
    ↓ hero bonuses
+ EquipmentStatCalculator.CalculateEquipmentBonuses(equipped)
    ↓ item bonuses
+ SynergyCalculator.CalculateSynergies(team)
    ↓ synergy bonuses
= CombatUnit (final stats for battle)
```

---

## Key Constants (from GROUND-TRUTH.md)

| Constant | Value | Location |
|----------|-------|----------|
| Element strong multiplier | 1.3× | ElementSystem.cs |
| Element weak multiplier | 0.7× | ElementSystem.cs |
| DR cap | 0.75 (75%) | DamageCalculator.cs |
| Base crit multiplier | 1.5× | DamageCalculator.cs |
| Freeze vulnerability | +20% | DamageCalculator.cs |
| Mana per auto-attack/heal | 10 | ManaSystem.cs |
| Mana on hit formula | max(1, floor(dmg/maxHP × 50)) | ManaSystem.cs |
| CC DR window | 8 seconds | DiminishingReturns.cs |
| Tenacity cap | 60% | DiminishingReturns.cs |
| Combat timeout (normal) | 60s | CombatState.MaxTurns |
| Combat timeout (boss) | 180s | CombatState.MaxTurns |
| Star-up copies | T1=3, T2=4, T3=5, T4=8, T5=10 | EvolutionSystem.cs |
| Team size | L1→3, L4→4, L8→5, L12→6, L16→7, L17→8 | EconomySystem.cs |
| Hero level cap | 20 | HeroXPSystem.cs |
| Hero skill points | 1 per level = 20 total | HeroSkillTreeSystem.cs |
| Gacha hard pity | 50 pulls | GachaSystem.cs |
| Starting VE | 500 | EconomySystem.cs |

---

## How to Add/Fix Things

### Fix a combat bug
1. Identify the step in the 13-step pipeline (DamageCalculator) or the turn flow (CombatEngine)
2. Write a failing test first in `Tests/EditMode/Combat/`
3. Fix the code in `Scripts/Core/Combat/`
4. Run all tests — nothing else should break

### Add a new unit
1. Create a UnitTemplate ScriptableObject in `Data/Units/{Element}/`
2. Add the unit's ability function to `UnitAbilityCatalog.cs`
3. Add stat entry to `units-templates.js` (HTML reference)
4. Add flavor text to `units-abilities.js` (HTML reference)
5. Write a test for the ability

### Balance a unit
1. Change the ScriptableObject in `Data/Units/` (stats)
2. OR change the ability function in `UnitAbilityCatalog.cs` (mechanics)
3. Never hardcode balance numbers in CombatEngine — they belong in data or the ability function

### Add a new status effect
1. Add to `StatusEffectType.cs` enum
2. Add handling in `StatusEffectSystem.cs`
3. If it affects damage: add a step in `DamageCalculator.cs` (between existing steps)
4. Add to `DiminishingReturns.cs` if it's CC
5. Write tests

### Add a new hero
1. Add to `HeroId.cs` enum
2. Add definition to `HeroCatalog.cs` (2 branches × 5 tiers × 2 choices = 20 nodes)
3. Add availability rule to `HeroAvailabilitySystem.cs`
4. Write tests

### Wire a new Unity scene (Track B)
1. Create a MonoBehaviour in `Scripts/MonoBehaviours/` that references Core/ systems
2. Core/ stays pure C# — the MonoBehaviour is just input/output plumbing
3. Use events or callbacks to communicate between Core/ and Unity UI

---

## Authoritative Documents

| Document | What It Covers | When to Read |
|----------|---------------|-------------|
| `GROUND-TRUTH.md` | Every testable value and formula | Before implementing anything |
| `TEMPLATE-V2-HANDOFF.md` | Ability system v2 architecture | Before touching abilities |
| `HEALER-FIX-HANDOFF.md` | Healer auto-heal rules | Before touching combat flow |
| `COMBAT-DESIGN.md` | Combat design intent | For context, not implementation |
| `PROGRESSION-REWORK.md` | Economy/progression design | Before touching gacha/economy |
| `testing/testing-architecture-strategy.md` | Testing approach | Before writing tests |
| `CONTINUITY.md` | Current project state | Start of every session |
| `UNITY-MIGRATION-PLAN.md` | Full migration plan | For roadmap context |

---

## What's Done vs Pending

| System | Status | Prompts |
|--------|--------|---------|
| Combat engine (grid, damage, targeting, turns) | Done | 36 |
| Abilities + mana (old per-unit catalog) | Done → Being replaced by v2 | 37 → 45 |
| Status effects (DoT, CC, DR, shields) | Done | 38 |
| Passives + bosses | Done → Passives being simplified in v2 | 39 → 45 |
| Unit data (132 ScriptableObjects, synergies) | Done (may need stat refresh) | 40 |
| Gacha + economy | Done | 41 |
| Items (equipment, enhancement, gems) | **PENDING** | 42 |
| Heroes (6 heroes, skill trees) | Done | 43 |
| Save system | **PENDING** (after items) | 44 |
| Ability v2 (per-unit unique, healer fix) | **IN PROGRESS** | 45 |
| Scenes + UI | **FUTURE** (Track B) | TBD |
| Story integration | **FUTURE** (Track C) | TBD |
| Graphics + audio | **FUTURE** (Track D, separate session) | TBD |
| Mobile | **FUTURE** (Track E) | TBD |

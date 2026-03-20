# Prompt 39: Passives System & Boss Framework Port

> **Purpose**: Port the passive system (132 unit passives with 6 trigger types) and the boss combat framework (8 bosses, multi-phase, telegraphs, enrage) to pure C#. These are the last two combat subsystems — after this prompt, the combat engine is feature-complete.
>
> **Branch**: `feature/unity-passives-bosses`
> **Depends on**: Prompt 36 (combat core), Prompt 37 (abilities), Prompt 38 (status effects)
> **Session type**: Claude Code with Unity MCP

---

## Key Principle

All code in `Scripts/Core/Combat/`. No `using UnityEngine;`. Pure C# only.

---

## Read First

- `GROUND-TRUTH.md` — section 6 (Passives), section 9 (Boss Framework)
- `COMBAT-DESIGN.md` — passive system, boss framework sections
- `js/units-abilities.js` — PASSIVE_DATA and EVOLVED_PASSIVE_DATA (full passive catalog with trigger types and params)
- `js/main-v2.js` — search for boss phase logic, enrage, telegraphs

---

## Part A: Passive System

### Passive Trigger Types (from units-abilities.js)

Each passive has a `trigger` field that determines when it fires:

| Trigger | When It Fires | Example |
|---------|--------------|---------|
| `on_attack` | When this unit lands an auto-attack or ability hit | "Every 3rd attack deals 25% bonus damage" |
| `on_hit` | When this unit takes damage | "Melee attackers take 15 fire damage back" |
| `combat_start` | Once at the start of combat | "First attack deals 50% bonus damage" |
| `aura` | Continuous effect while alive | "Enemies within 2 cells take 20 DPS" |
| `periodic` | Every X seconds | "Leaves fire trail when moving" |
| `on_heal` | When this unit heals an ally | "Healed allies gain shield equal to 15% of heal" |

### Passive Data Model

**`Core/Combat/PassiveData.cs`**:
```
- string Id (matches unit key)
- string Name
- string Description
- PassiveTrigger Trigger (enum: OnAttack, OnHit, CombatStart, Aura, Periodic, OnHeal)
- Dictionary<string, float> Params (parsed from JS params objects)
  - e.g., { "interval": 3, "bonusDamage": 0.25 }
  - e.g., { "auraDps": 20, "range": 2 }
  - e.g., { "procChance": 0.25, "slowPct": 0.15, "slowDuration": 2 }
```

### Passive Catalog

**`Core/Combat/PassiveCatalog.cs`** — Static catalog of all 132 passives (66 base + 66 evolved).

Parse from `js/units-abilities.js` PASSIVE_DATA and EVOLVED_PASSIVE_DATA. Preserve all `params` values exactly.

### Passive System

**`Core/Combat/PassiveSystem.cs`**:
```
Core methods:

- OnCombatStart(CombatState state)
  → Fire all combat_start passives. Apply first-hit bonuses, starting shields, etc.

- OnAttack(CombatUnit attacker, CombatUnit target, DamageResult result, CombatState state) → List<PassiveEvent>
  → Fire all on_attack passives for the attacker
  → Handle: interval counters (every Nth attack), conditional bonuses (if target burning), stacking mechanics

- OnHit(CombatUnit defender, CombatUnit attacker, float damageTaken, CombatState state) → List<PassiveEvent>
  → Fire all on_hit passives for the defender
  → Handle: reflect damage, slow on hit, mana drain

- OnHeal(CombatUnit healer, CombatUnit target, float healAmount, CombatState state) → List<PassiveEvent>
  → Fire all on_heal passives for the healer
  → Handle: shield from heal, burn application

- TickAuras(CombatState state, float deltaTime) → List<PassiveEvent>
  → Fire all aura passives for all living units
  → Handle: damage auras, healing auras, stat buff auras

- TickPeriodic(CombatState state, float deltaTime) → List<PassiveEvent>
  → Fire all periodic passives
  → Handle: fire trails, periodic heals, periodic damage

CRITICAL: Reentry guard
  → Passive effects can trigger other passives (e.g., reflect damage triggers on_hit on the original attacker)
  → Use a reentrancy flag to prevent infinite loops
  → Max recursion depth: 1 (a passive can trigger another passive, but that second passive cannot trigger a third)
```

### Integration with CombatEngine

Update `CombatEngine`:
- `StartBattle()`: call `PassiveSystem.OnCombatStart()`
- After auto-attack: call `PassiveSystem.OnAttack()` and `PassiveSystem.OnHit()`
- After ability heal: call `PassiveSystem.OnHeal()`
- Each tick: call `PassiveSystem.TickAuras()` and `PassiveSystem.TickPeriodic()`

---

## Part B: Boss Framework

### Boss Mechanics (from COMBAT-DESIGN.md)

Bosses are special enemy units that:
- Occupy a 2×2 grid space (4 cells)
- Have multiple HP-threshold phases (typically 3)
- Use telegraphs before big attacks
- Have an enrage timer
- Have unique per-boss mechanics

### Boss Data Model

**`Core/Combat/BossData.cs`**:
```
- string Id (e.g., "void_sovereign", "colossus")
- string Name
- int GridWidth, GridHeight (typically 2×2)
- float[] PhaseThresholds (e.g., [0.75f, 0.50f, 0.25f] — phases trigger at 75%, 50%, 25% HP)
- BossPhase[] Phases (each phase has different abilities/behavior)
- float EnrageTimer (seconds until enrage — typically 120-180s)
- BossAbility[] Abilities (per-phase abilities)
- TelegraphData[] Telegraphs (visual warning before big attacks)
```

**`Core/Combat/BossPhase.cs`**:
```
- int PhaseNumber
- float HpThreshold (0.0-1.0)
- string[] AbilityIds (abilities available in this phase)
- float AttackSpeedMultiplier (bosses get faster in later phases)
- float DamageMultiplier
- string SpecialMechanic (e.g., "summon_adds", "shield_phase", "enrage_preview")
```

**`Core/Combat/TelegraphData.cs`**:
```
- string AbilityId (which ability is being telegraphed)
- float WarningDuration (how long the warning shows before the attack)
- List<GridPosition> AffectedCells (which cells will be hit)
- TelegraphType Type (AoE, Line, Cone, Targeted)
```

### Boss Catalog

**`Core/Combat/BossCatalog.cs`** — All 8 region bosses:

| Region | Boss | Key Mechanic |
|--------|------|-------------|
| R1 | Frontier Guardian | Basic 3-phase, teaches telegraphs |
| R2 | Depths Keeper | Summons adds, underwater phase |
| R3 | Sovereign (first encounter) | Retreat mission — fighting makes it stronger |
| R4 | Colossus | Multi-phase, AoE heavy, story-critical |
| R5 | Nexus Warden | Shield phases, requires element coordination |
| R6 | Crucible Beast | Environmental hazards, terrain changes |
| R7 | Proving Champion | Mirror-match mechanics |
| R8 | The Sovereign (final) | 3 full phases, all mechanics combined |

Get exact mechanics from GROUND-TRUTH.md section 9 and MISSIONS-DESIGN.md.

### Boss System

**`Core/Combat/BossSystem.cs`**:
```
- InitBoss(BossData data, CombatState state) → place boss on grid (2×2), set phase 0
- CheckPhaseTransition(CombatUnit boss, BossData data) → bool (HP crossed threshold?)
- TransitionPhase(CombatUnit boss, BossData data, int newPhase) → PhaseTransitionEvent
  - Update abilities, stats, special mechanics
  - May heal boss partially, summon adds, apply buffs
- SelectBossAbility(CombatUnit boss, BossData data, CombatState state, System.Random rng) → AbilityData
  - AI: choose from current phase's ability pool
  - Respect cooldowns, prioritize telegraphed attacks
- CreateTelegraph(BossAbility ability, CombatState state) → TelegraphData
  - Mark cells that will be hit
  - Player has warningDuration to move units out
- CheckEnrage(CombatUnit boss, BossData data, float elapsedTime) → bool
  - If timer expires: massive stat boost, remove phase restrictions
- GetOccupiedCells(CombatUnit boss) → List<GridPosition> (2×2 from anchor position)
```

### Integration with CombatEngine

Update `CombatEngine`:
- At battle start: if enemy has a boss, call `BossSystem.InitBoss()`
- Before boss turn: check `BossSystem.CheckPhaseTransition()`
- Boss turn: `BossSystem.SelectBossAbility()` instead of normal targeting
- Telegraph: create telegraph → wait duration → execute ability
- Each tick: `BossSystem.CheckEnrage()`
- Grid collision: boss occupies 2×2, pathfinding routes around occupied cells

---

## Tests

### Passive Tests

**`Tests/EditMode/Combat/PassiveCatalogTests.cs`**:
- All 132 passives present (count check)
- Spot-check 6 passives (one per element): correct trigger type, correct params

**`Tests/EditMode/Combat/PassiveSystemTests.cs`**:
- on_attack passive fires on attack (Heated Blows: every 3rd attack)
- on_hit passive fires when hit (Molten Armor: reflect 15 damage)
- combat_start passive fires once at start (First Blood: 50% bonus first attack)
- aura passive ticks correctly (Dragonfire Aura: 20 DPS in range)
- Reentry guard: passive → triggers passive → stops (no infinite loop)
- Passive doesn't fire for dead units

### Boss Tests

**`Tests/EditMode/Combat/BossSystemTests.cs`**:
- Boss occupies 2×2 grid (4 cells blocked)
- Phase transition triggers at correct HP threshold
- Phase transition changes available abilities
- Enrage triggers after timer expires
- Telegraph marks correct cells
- Boss abilities deal correct damage

**`Tests/EditMode/Combat/CombatEngineBossTests.cs`**:
- Full boss fight with seeded RNG: runs to completion
- Phase transitions happen in correct order
- Player team can win boss fight (with strong enough stats)
- Enrage is survivable for a few turns but increasingly lethal

---

## Validation Checklist

- [ ] All files in `Core/Combat/` — no `using UnityEngine;`
- [ ] All 132 passives present in PassiveCatalog
- [ ] All 6 trigger types implemented
- [ ] Reentry guard prevents infinite loops
- [ ] All 8 bosses defined in BossCatalog (at least stubs for unique mechanics)
- [ ] Boss 2×2 grid occupancy works with pathfinding
- [ ] Phase transitions, telegraphs, enrage all functional
- [ ] All tests pass

## Commit

```
git add Unity/ShatteredVeil/Assets/Scripts/Core/Combat/ Unity/ShatteredVeil/Assets/Tests/EditMode/Combat/
git commit -m "Prompt 39: Passives (132 passives, 6 triggers, reentry guard) and boss framework (8 bosses, phases, telegraphs, enrage)"
```

## Note

After this prompt, the combat engine is feature-complete:
- Prompt 36: Grid, damage, targeting, turns
- Prompt 37: Abilities, mana
- Prompt 38: Status effects, DR, shields
- Prompt 39: Passives, bosses

The next prompts shift to non-combat systems (units data, gacha, items, heroes, economy, save).

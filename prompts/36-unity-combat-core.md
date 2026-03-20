# Prompt 36: Unity Combat Core — Grid, Damage, Targeting, Turn Resolution

> **Purpose**: Port the core combat engine to pure C#. This is the largest and most critical system — it covers the grid, movement, damage pipeline, targeting, turn resolution, and basic attack flow. Abilities, status effects, passives, and bosses are in follow-up prompts.
>
> **Branch**: `feature/unity-combat-core`
> **Depends on**: Prompt 34 (project setup — folder structure and assembly definitions must exist), Prompt 35 (ground truth — damage formulas and test cases to validate against)
> **Session type**: Claude Code with Unity MCP

---

## Key Principle

**Everything in this prompt goes in `Scripts/Core/Combat/`.** The assembly definition (`GameCore.asmdef`) has `noEngineReferences: true`. You CANNOT use `UnityEngine`, `MonoBehaviour`, `Vector3`, `Mathf`, etc. Use `System.Math` or `System.Numerics` instead. If you need a 2D point, create a simple struct. This is enforced at compile time.

This is intentional — pure C# means every class is unit-testable without loading Unity.

---

## Read First

- `GROUND-TRUTH.md` — sections 1 (Damage Pipeline), 2 (Elements), 3 (Archetypes), 8 (Grid and Movement)
- `COMBAT-DESIGN.md` — full combat design spec
- `js/main-v2.js` — reference implementation (the combat engine starts around the `runCombat` function; search for `executeTurn`, `calculateDamage`, `resolveAttack`)

---

## Files to Create

### Data Structures

**`Core/Combat/GridPosition.cs`** — Simple 2D integer position struct
```
- Fields: int Row, int Col
- BFS-compatible (no diagonal adjacency)
- Grid bounds: 4 columns × 2 rows per side (player grid + enemy grid)
- Distance calculation: Manhattan distance
```

**`Core/Combat/CombatUnit.cs`** — Runtime representation of a unit in combat
```
- Stats: CurrentHP, MaxHP, ATK, DEF, SPD, CritChance, CritDamage, Mana, MaxMana
- Identity: UnitId, Name, Element, Archetype, Tier, Star
- Position: GridPosition
- State: IsAlive, IsStunned, Team (Player/Enemy)
- Equipment bonuses (flat stat modifiers from items — applied at combat start)
- Hero bonuses (flat stat modifiers from hero skills — applied at combat start)
- Synergy bonuses (applied at combat start based on team composition)
```

**`Core/Combat/CombatState.cs`** — Full snapshot of a combat encounter
```
- List<CombatUnit> PlayerTeam, EnemyTeam
- int TurnNumber
- RNG seed (for deterministic replay)
- BattlePhase: Preparing, InProgress, Victory, Defeat
- TurnOrder queue
```

### Core Systems

**`Core/Combat/ElementSystem.cs`** — Element matchup calculations
```
- 6 elements: Fire, Water, Earth, Wind, Lightning, Force
- GetMultiplier(Element attacker, Element defender) → float (1.3, 0.7, or 1.0)
- Full 6×6 matchup table from GROUND-TRUTH.md section 2
- Key: Water is weak to BOTH Earth AND Lightning. Earth is strong vs BOTH Water AND Lightning. Force is neutral to everything.
- Must be data-driven (not a giant if/else — use a lookup table)
```

**`Core/Combat/DamageCalculator.cs`** — Replace the stub from Prompt 34 with the full 13-step pipeline from GROUND-TRUTH.md section 1
```
Step 1:  Stasis check → if target has stasis, return 0
Step 2:  Base damage: ATK (auto) or ATK * abilityMultiplier (ability)
Step 3:  Element multiplier: 1.3× strong, 0.7× weak, 1.0× neutral (see GROUND-TRUTH 6×6 table)
         Note: elemResist can reduce the bonus portion
Step 4:  Critical strike: if forceCrit OR rng < critChance → damage *= 1.5 (+ bonus crit damage from synergies)
Step 5:  Damage reduction: totalDR = target.DR + statusDR. DR cap = 0.75. Sorcerer spell pen reduces DR.
Step 6:  Minimum floor: max(1, damage)
Step 7:  Freeze vulnerability: frozen targets take +20% → damage *= 1.2
Step 8:  Vulnerability status: damage *= (1 + vulnPct)
Step 9:  Ranger mark amplification (stub for now)
Step 10: Dodge check: if rng < totalDodge → damage = 0
Step 11: Shield absorption: absorb min(shield, damage) from shield, remainder hits HP
Step 12: Apply to HP: target.hp -= remaining
Step 13: Post-damage triggers: mana gen, reflect, on-hit items, lifesteal, death check

For Prompt 36: implement steps 1-6 and 10-12 fully. Steps 7-9 and 13 as stubs (filled in by Prompt 38).

Input: CombatUnit attacker, CombatUnit defender, float skillMultiplier, System.Random rng, DamageContext context
Output: DamageResult { int damage, bool isCrit, bool isDodged, float elementMultiplier, int shieldAbsorbed }
```

**`Core/Combat/TargetingSystem.cs`** — Target selection logic
```
- GetTarget(CombatUnit attacker, List<CombatUnit> enemies, TargetingRule rule) → CombatUnit
- Targeting rules from COMBAT-DESIGN.md:
  - Nearest (default for melee)
  - LowestHP (for assassins)
  - HighestATK (for some abilities)
  - Random
  - Taunt override (taunting unit forces targeting)
- Considers grid position for "nearest" — uses Manhattan distance from attacker position
- Filters dead units automatically
```

**`Core/Combat/GridSystem.cs`** — Grid management and pathfinding
```
- Grid dimensions: 4 cols × 2 rows per side
- PlaceUnit(CombatUnit unit, GridPosition pos) — with collision checks
- GetValidMoves(CombatUnit unit) → List<GridPosition>
- FindPath(GridPosition from, GridPosition to) → List<GridPosition> (BFS, no diagonals)
- GetUnitsInRange(GridPosition center, int range) → List<CombatUnit>
- IsAdjacent(GridPosition a, GridPosition b) → bool
- Attack ranges: melee=1 (adjacent), ranged=2-3 (Manhattan distance)
```

**`Core/Combat/TurnOrderSystem.cs`** — Speed-based turn queue
```
- BuildTurnOrder(List<CombatUnit> allUnits) → Queue<CombatUnit>
- Sorted by SPD descending
- Tie-breaking: player units go first, then by unit ID
- Stun check: stunned units skip their turn
- Dead units removed from queue
```

**`Core/Combat/CombatEngine.cs`** — The main combat loop (orchestrator)
```
- Constructor: CombatEngine(CombatState state, System.Random rng)
- ExecuteTurn() → TurnResult
  1. Dequeue next unit from turn order
  2. Check if stunned → skip if yes
  3. Select target via TargetingSystem
  4. Check if in range → if not, move toward target via GridSystem
  5. If in range → attack: calculate damage via DamageCalculator, apply to target
  6. Check if target dies → remove from field
  7. Check win/loss condition
  8. Return TurnResult { attacker, target, damage, isCrit, movement, targetDied, battleOver }
- RunFullBattle() → BattleResult { winner, turnCount, List<TurnResult> log }
  - Calls ExecuteTurn() in loop until victory or defeat
  - Max time: 60s normal, 180s boss (from GROUND-TRUTH.md discrepancies table). Draw = loss.
- This is the headless combat runner — equivalent to `combat-benchmark.js`
```

### Test Files

**`Tests/EditMode/Combat/ElementSystemTests.cs`**:
- Test all strong matchups → 1.3× (Fire>Wind, Water>Fire, Earth>Water, Earth>Lightning, Wind>Earth, Lightning>Water)
- Test all weak matchups → 0.7× (Fire<Water, Water<Earth, Water<Lightning, Earth<Wind, Wind<Fire, Lightning<Earth)
- Test neutral → 1.0× (e.g., Fire vs Earth)
- Test same-element → 1.0×
- Test Force → always 1.0× (both attacking and defending)

**`Tests/EditMode/Combat/DamageCalculatorTests.cs`** (expand the stub):
- All 7 test cases from GROUND-TRUTH.md section 1
- Seeded RNG for crit and variance testing
- Edge cases: zero DEF, huge DEF, minimum damage floor

**`Tests/EditMode/Combat/TargetingSystemTests.cs`**:
- Nearest targeting with known grid positions
- LowestHP targeting
- Taunt override
- Dead units excluded

**`Tests/EditMode/Combat/GridSystemTests.cs`**:
- BFS pathfinding: known start → known end → expected path length
- Collision: can't place two units on same cell
- Range check: melee vs ranged
- Movement: valid moves respect grid bounds

**`Tests/EditMode/Combat/TurnOrderSystemTests.cs`**:
- Faster unit goes first
- Tie-breaking rules
- Stunned units skip

**`Tests/EditMode/Combat/CombatEngineTests.cs`**:
- 1v1 battle with known stats and seeded RNG → deterministic winner
- 3v3 battle → completes without error
- Max turn limit → draw = loss
- Damage values match GROUND-TRUTH.md calculations (cross-validate with JS `combat-benchmark.js`)

---

## Cross-Validation with HTML Prototype

After implementation, run this specific scenario in BOTH the HTML prototype and the C# tests:

**Scenario**: 2 Fire units (ATK=100, DEF=50, SPD=10) vs 2 Water units (same stats). Seed=12345. No items, no heroes, no synergies.

- The Fire units should deal 0.7× element damage to Water (Fire is WEAK vs Water)
- The Water units should deal 1.3× element damage to Fire (Water is STRONG vs Fire)
- With seed=12345, the exact turn sequence and damage values should be recordable in both versions
- If they match → port is correct. If not → investigate.

Document the results in the commit message or a comment in `CombatEngineTests.cs`.

---

## Validation Checklist

- [ ] All files in `Core/Combat/` — NO `using UnityEngine;` statements
- [ ] All scripts compile (`validate_script` via MCP)
- [ ] All unit tests pass (`run_tests` via MCP)
- [ ] No console errors (`read_console` via MCP)
- [ ] Cross-validation scenario documented
- [ ] `DamageCalculator` matches GROUND-TRUTH.md test cases exactly

## Commit

```
git add Unity/ShatteredVeil/Assets/Scripts/Core/Combat/ Unity/ShatteredVeil/Assets/Tests/EditMode/Combat/
git commit -m "Prompt 36: Combat core port — grid, damage pipeline, targeting, turn resolution, 30+ unit tests"
```

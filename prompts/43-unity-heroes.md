# Prompt 43: Hero System Port

> **Purpose**: Port the 6-hero system — hero definitions, dual-branch skill trees, hero XP, shard acquisition, hero-unit assignment, and the narrative availability timeline (Lyric's death, group splits).
>
> **Branch**: `feature/unity-heroes`
> **Depends on**: Prompt 36 (CombatUnit — stat modifiers), Prompt 40 (IUnitData)
> **Can run in parallel with**: Prompt 42 (items)
> **Session type**: Claude Code with Unity MCP

---

## Read First

- `GROUND-TRUTH.md` section 11 (Hero System) — the authoritative spec
- `HERO-SYSTEM-DESIGN.md` + `HERO-REWORK.md` — full design docs
- `js/heroes.js` — reference implementation (hero data, skill trees, XP, assignment)

---

## Pure C# Logic — `Scripts/Core/Heroes/`

NO `using UnityEngine`. Namespace `ShatteredVeil.Core.Heroes`.

### Data Models

**`HeroId.cs`** (enum): Kael, Lyric, Ren, Sera, Maren, Voss

**`HeroDefinition.cs`** — Static hero data:
```
- HeroId Id
- string Name
- string Philosophy (e.g., "Protection", "Efficiency")
- int AcquiredRegion (R1=1, R2=2, etc.)
- int AcquiredStage (which stage in that region)
- bool CanDie (only Lyric = true)
- int DeathRegion, DeathStage (R4, mid — only Lyric)
- int? LeaveRegion, ReturnRegion (Sera: leave R4, return R5 late. Maren: leave R4, return R5 early)
- SkillBranch[] Branches (2 per hero)
```

**`SkillBranch.cs`**:
```
- string Name (e.g., "Aegis" and "Warden" for Kael)
- SkillNode[] Nodes (5 tiers, 2 choices per tier = 10 nodes per branch)
```

**`SkillNode.cs`**:
```
- int Tier (1-5)
- int Choice (0 or 1 — pick one per tier)
- int LevelReq (T1=1, T2=5, T3=9, T4=13, T5=17)
- int Cost (T1=1, T2=1, T3=2, T4=4, T5=5)
- string Name
- string Description
- StatModifier[] Bonuses (what stats this node grants)
- bool IsCapstone (tier 5 only)
```

**`HeroState.cs`** — Runtime/save state of a hero:
```
- HeroId Id
- int Level (1-20)
- int XP
- int SkillPoints (1 per level, 20 max)
- List<int> InvestedNodes (which nodes are bought)
- string AssignedUnitId (which unit this hero is assigned to, or null)
- bool IsDead (for Lyric)
- bool IsAbsent (for Sera/Maren during R4-R5 split)
```

### Core Systems

**`HeroCatalog.cs`** — All 6 hero definitions with complete skill trees:
```
Parse from js/heroes.js HERO_DATA. Each hero has:
- 2 branches × 5 tiers × 2 choices = 20 skill nodes
- Total: 6 heroes × 20 nodes = 120 skill nodes

Heroes:
1. Kael — Protection. Branches: Aegis (defensive), Warden (team shield).
2. Lyric — Efficiency. Branches: Precision (crit/damage), Tempo (attack speed/mana).
3. Ren — Steadfast. Branches: Bulwark (DR/HP), Anchor (CC resist/taunt).
4. Sera — Precision. Branches: Marksman (ranged damage), Spotter (team crit).
5. Maren — Sustain. Branches: Restoration (healing), Renewal (regen/shields).
6. Voss — Momentum. Branches: Blitz (burst damage), Cascade (chain kills).
```

**`HeroXPSystem.cs`** — XP and leveling:
```
- GetXPForLevel(int level) → int
- AddXP(HeroState hero, int xp) → LevelUpResult
- XP rate: ~1.5× unit XP rate
- Level cap: 20
- Skill points: 1 per level
```

**`HeroSkillTreeSystem.cs`** — Skill tree investment:
```
- CanInvestNode(HeroState hero, HeroDefinition def, int branchIndex, int nodeIndex) → bool
  - Check: level req met, skill points available, prerequisite (previous tier in same branch invested)
  - Cannot pick both choices at the same tier
- InvestNode(HeroState hero, HeroDefinition def, int branchIndex, int nodeIndex) → bool
- GetTotalBonuses(HeroState hero, HeroDefinition def) → StatModifier[]
  - Sum all invested node bonuses
- Respec(HeroState hero, ref int currentVE) → bool
  - Cost: 500 VE first time, +500 each subsequent (500, 1000, 1500...)
  - Refunds all skill points, clears invested nodes
- Budget math: 20 points total. Full branch = 1+1+2+4+5 = 13. Both capstones = 26 > 20 → impossible.
```

**`HeroAssignmentSystem.cs`** — Assign heroes to units:
```
- AssignHero(HeroState hero, string unitId) → bool
  - One hero per unit, one unit per hero
  - Dead heroes can't be assigned
  - Absent heroes can't be assigned
- UnassignHero(HeroState hero) → void
- GetHeroBonuses(HeroState hero, HeroDefinition def) → StatModifier[]
  - Applied to the assigned unit at combat start
- Rule: Only hero-equipped units can equip items (from GROUND-TRUTH)
```

**`HeroAvailabilitySystem.cs`** — Track which heroes are available based on story progress:
```
- GetAvailableHeroes(int currentRegion, int currentStage) → List<HeroId>
  - R1: Kael, Lyric
  - R2: + Ren
  - R3: + Sera, Maren
  - R4 early: all 5
  - R4 mid (after specific stage): Lyric dies, Sera & Maren leave → only Kael, Ren
  - R5 early: + Maren
  - R5 late: + Sera
  - R7: + Voss
- OnLyricDeath(HeroState lyric)
  - Set IsDead = true
  - Unassign from unit
  - Preserve skill investment in save (but bonuses no longer apply)
  - Assigned unit loses ALL hero bonuses AND can't equip items
- OnHeroLeave(HeroState hero) → set IsAbsent = true, unassign
- OnHeroReturn(HeroState hero) → set IsAbsent = false
```

---

## Tests — `Tests/EditMode/Heroes/`

**`HeroCatalogTests.cs`**:
- All 6 heroes present
- Each hero has exactly 2 branches
- Each branch has nodes at all 5 tiers
- Each tier has exactly 2 choices
- Total: 120 skill nodes across all heroes

**`HeroSkillTreeTests.cs`**:
- Can invest T1 node at level 1
- Cannot invest T2 node below level 5
- Cannot pick both choices at same tier
- Budget: 20 points can fill one full branch (13) + partial second
- Cannot fill both capstones (26 > 20)
- Respec refunds all points, costs VE
- Respec cost increases: 500, 1000, 1500...

**`HeroXPTests.cs`**:
- XP gain levels up hero
- Level cap at 20
- Skill point awarded each level

**`HeroAssignmentTests.cs`**:
- Assign hero to unit → hero linked
- Can't assign dead hero (Lyric after R4)
- Can't assign absent hero (Sera in R4-R5)
- One hero per unit, one unit per hero
- Unassign clears the link

**`HeroAvailabilityTests.cs`**:
- R1 start: only Kael, Lyric available
- R3: 5 heroes available
- After Lyric death: only 2 remain (Kael, Ren)
- After Maren return (R5 early): 3 available
- R7: 5 available (Kael, Ren, Sera, Maren, Voss)

---

## Validation Checklist

- [ ] No `using UnityEngine` in Core/Heroes/
- [ ] All 6 heroes with complete skill trees (120 nodes total)
- [ ] Skill tree budget math correct (can't get both capstones)
- [ ] Hero availability timeline matches GROUND-TRUTH exactly
- [ ] Lyric's death removes bonuses and item equip capability
- [ ] Respec costs escalate correctly
- [ ] All tests pass

## Commit

```
git add Unity/ShatteredVeil/Assets/Scripts/Core/Heroes/ Unity/ShatteredVeil/Assets/Tests/EditMode/Heroes/
git commit -m "Prompt 43: Hero system — 6 heroes, dual-branch skill trees (120 nodes), XP, assignment, availability timeline, Lyric death handling"
```

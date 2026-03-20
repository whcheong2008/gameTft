# Prompt 41: Gacha System & Economy Port

> **Purpose**: Port the gacha pull system (tier weights, pity, level-gated rates) and the VE economy (income, costs, progression math) to pure C#. These are the core monetization/progression loops.
>
> **Branch**: `feature/unity-gacha-economy`
> **Depends on**: Prompt 40 (unit data — gacha needs to know which units exist at which tiers)
> **Session type**: Claude Code with Unity MCP

---

## Read First

- `GROUND-TRUTH.md` — section 10 (Gacha), section 13 (Economy/Progression)
- `PROGRESSION-REWORK.md` — full economy spec
- `js/gacha.js` — pull mechanics, pity, tier weights, level-gated rates
- `js/hub.js` — camp practices, resource flows
- `js/save.js` — resource tracking, income/spend

---

## Part A: Gacha System

### Gacha Data

**`Scripts/Data/GachaConfig.cs`** (ScriptableObject — lives outside Core/):
```csharp
[CreateAssetMenu(fileName = "GachaConfig", menuName = "ShatteredVeil/Gacha Config")]
public class GachaConfig : ScriptableObject
{
    public int pullCostVE;                      // VE per pull
    public int multiPullCount;                  // 10-pull
    public int multiPullDiscount;               // VE saved on multi-pull (if any)
    public GachaRateTable[] rateTables;          // rates indexed by player level
    public int hardPityThreshold;               // pulls until guaranteed high-tier
    public float softPityStartPull;             // when soft pity ramp begins
    public float softPityRateIncrease;          // % increase per pull past soft pity
}

[System.Serializable]
public class GachaRateTable
{
    public int minPlayerLevel;                  // these rates apply from this level
    public float t1Rate;
    public float t2Rate;
    public float t3Rate;
    public float t4Rate;
    public float t5Rate;                        // 0 until player level unlocks T5
}
```

### Gacha Core Logic

**`Core/Gacha/GachaSystem.cs`** (pure C# — no UnityEngine):
```
Constructor: GachaSystem(IGachaConfig config, System.Random rng)

- Pull(int playerLevel, int currentPityCount) → GachaPullResult
  1. Get rate table for playerLevel
  2. Apply soft pity adjustment if currentPityCount >= softPityStart
  3. Roll random 0-1 against cumulative tier weights
  4. If currentPityCount >= hardPityThreshold → force highest available tier
  5. Select random unit from the rolled tier (filtered by playerLevel availability)
  6. Return: { unitId, tier, isPity, newPityCount }

- MultiPull(int playerLevel, int currentPityCount, int count) → List<GachaPullResult>
  - Calls Pull() count times, tracking pity across pulls

- GetCurrentRates(int playerLevel, int currentPityCount) → RateDisplay
  - Returns the effective rates (after pity adjustment) for UI display

Key rules from PROGRESSION-REWORK.md:
  - T5 only enters the pool at player level 15
  - T4 enters at player level 10 (approximate — check exact values)
  - Pity counter persists across sessions (saved)
  - Hard pity guarantees the highest available tier
  - Evolved copies can appear for T3+ at high player levels
```

**`Core/Gacha/IGachaConfig.cs`** (interface for testing):
```
- int PullCostVE { get; }
- float GetTierRate(int playerLevel, int tier) { get; }
- int HardPityThreshold { get; }
- float SoftPityStart { get; }
- float SoftPityRateIncrease { get; }
```

---

## Part B: Economy System

### Economy Data

**`Scripts/Data/EconomyConfig.cs`** (ScriptableObject):
```csharp
[CreateAssetMenu(fileName = "EconomyConfig", menuName = "ShatteredVeil/Economy Config")]
public class EconomyConfig : ScriptableObject
{
    [Header("Gacha")]
    public int pullCostVE;

    [Header("Star-Up Costs (VE)")]
    public int[] starUpVECost;               // indexed by star level (1→2, 2→3, etc.)

    [Header("XP and Leveling")]
    public int[] xpPerLevel;                 // XP required for each level
    public int[] levelCapPerRegion;          // max level per region (hard caps)
    public int[] teamSizeByLevel;            // team size at each level (3→4→5→6→7→8)

    [Header("Stage Rewards")]
    public StageRewardConfig[] stageRewards; // VE and XP per stage

    [Header("Camp Practices")]
    public CampPracticeConfig[] practices;   // practice definitions, levels, costs
}

[System.Serializable]
public class StageRewardConfig
{
    public string stageId;
    public int veReward;
    public int xpReward;
    public float[] itemDropRates;            // by tier
}

[System.Serializable]
public class CampPracticeConfig
{
    public string practiceId;
    public string displayName;
    public int maxLevel;
    public int[] upgradeCostVE;              // cost per level
    public StatModifier[] bonusPerLevel;     // what bonus each level gives
}
```

### Economy Core Logic

**`Core/Economy/EconomySystem.cs`** (pure C# — no UnityEngine):
```
Constructor: EconomySystem(IEconomyConfig config)

Resources:
- CanAfford(int currentVE, int cost) → bool
- SpendVE(ref int currentVE, int cost) → bool (deducts if affordable)
- GrantVE(ref int currentVE, int amount)

Leveling:
- GetXPForLevel(int level) → int (XP required)
- AddXP(ref int currentXP, ref int currentLevel, int xpGained, int regionCap) → LevelUpResult
  - Handles multi-level-ups if enough XP
  - Respects hard level cap per region
  - Returns: { newLevel, levelsGained, teamSizeChanged, newTeamSize }
- GetTeamSize(int level) → int (3 at L1, 4 at L4, 5 at L8, 6 at L12, 7 at L16, 8 at L17)
- GetLevelCap(int currentRegion) → int

Star-Up:
- GetStarUpCopyCost(int tier) → int (T1=3, T2=4, T3=5, T4=8, T5=10)
- GetStarUpVECost(int currentStar, int tier) → int
- CanStarUp(int currentStar, int copiesOwned, int tier, int currentVE) → bool
- StarUp(ref unit, ref int copiesOwned, ref int currentVE) → StarUpResult

Camp Practices:
- GetPracticeCost(string practiceId, int currentLevel) → int VE
- UpgradePractice(string practiceId, ref int currentLevel, ref int currentVE) → bool
- GetPracticeBonus(string practiceId, int level) → StatModifier[]
```

**`Core/Economy/IEconomyConfig.cs`** (interface for testing):
```
- int PullCostVE { get; }
- int GetXPForLevel(int level) { get; }
- int GetLevelCap(int region) { get; }
- int GetTeamSize(int level) { get; }
- int GetStarUpCopyCost(int tier) { get; }
```

---

## Part C: Create ScriptableObject Instances

Use Unity MCP to create:

**`Data/Economy/GachaConfig.asset`** — single instance with all gacha rates from GROUND-TRUTH.md section 10

**`Data/Economy/EconomyConfig.asset`** — single instance with all economy values from GROUND-TRUTH.md section 13

**`Data/Economy/Practices/`** — one asset per camp practice (from hub.js)

---

## Tests

### Gacha Tests

**`Tests/EditMode/Gacha/GachaSystemTests.cs`**:
- Single pull returns valid unit from correct tier pool
- 10,000 pulls at level 1: T1/T2/T3 distribution within ±2% of configured rates
- T5 never appears below level 15
- Pity counter increments correctly
- Hard pity fires at threshold
- Pity resets after trigger
- Soft pity increases rates gradually
- Multi-pull tracks pity correctly across all 10 pulls

### Economy Tests

**`Tests/EditMode/Economy/EconomySystemTests.cs`**:
- SpendVE deducts correctly, fails when insufficient
- XP level-up at correct thresholds
- Multi-level-up works (gain 1000 XP when next 3 levels need 200 each)
- Level cap enforced per region
- Team size progression: L1→3, L4→4, L8→5, L12→6, L16→7, L17→8
- Star-up copy costs: T1=3, T2=4, T3=5, T4=8, T5=10
- Star-up VE costs match GROUND-TRUTH
- Camp practice upgrade deducts VE, increases level, grants correct bonus
- Can't upgrade practice past max level

---

## Validation Checklist

- [ ] Core/Gacha/ and Core/Economy/ have no `using UnityEngine;`
- [ ] ScriptableObjects created with correct values from GROUND-TRUTH
- [ ] Gacha rates match exactly (10,000-pull simulation within tolerance)
- [ ] Pity system works (hard + soft)
- [ ] Level-gating works (T5 locked below L15)
- [ ] Economy math matches GROUND-TRUTH
- [ ] Team size progression correct
- [ ] Star-up costs correct
- [ ] All tests pass

## Commit

```
git add Unity/ShatteredVeil/Assets/Scripts/Core/Gacha/ Unity/ShatteredVeil/Assets/Scripts/Core/Economy/ Unity/ShatteredVeil/Assets/Scripts/Data/ Unity/ShatteredVeil/Assets/Data/Economy/ Unity/ShatteredVeil/Assets/Tests/EditMode/Gacha/ Unity/ShatteredVeil/Assets/Tests/EditMode/Economy/
git commit -m "Prompt 41: Gacha system (rates, pity, level-gating) and economy (VE, XP, star-up, camp practices)"
```

## What's Next

After Prompt 41, the core logic port is nearly complete:
- Combat: Prompts 36-39 (grid, damage, abilities, status, passives, bosses)
- Data: Prompt 40 (132 units, synergies, evolution)
- Progression: Prompt 41 (gacha, economy)
- **Remaining**: Prompt 42 (items), Prompt 43 (heroes), Prompt 44 (save system)

Then Track B begins: scenes, UI, and wiring it all together in Unity.

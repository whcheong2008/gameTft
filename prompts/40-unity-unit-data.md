# Prompt 40: Unit Data Layer — Templates, Stats, Synergies as ScriptableObjects

> **Purpose**: Port all 132 unit stat templates, the element/archetype synergy system, and the star-up/evolution system to C# with ScriptableObjects for data. This is the data foundation — combat, gacha, and team building all reference unit data.
>
> **Branch**: `feature/unity-unit-data`
> **Depends on**: Prompt 34 (project setup), Prompt 36 (ElementSystem, ArchetypeSystem exist as enums/stubs)
> **NOTE**: This prompt can run IN PARALLEL with Prompts 37-39 (combat subsystems). It doesn't modify combat code — it creates the data layer that combat reads from.
> **Session type**: Claude Code with Unity MCP

---

## Read First

- `GROUND-TRUTH.md` — section 2 (Elements), section 3 (Archetypes), section 4 (Unit Stats)
- `js/units-templates.js` — all 132 unit stat definitions
- `js/units-core.js` — element/archetype enums, star-up logic, evolution mapping
- `js/units-ascension.js` — evolution/ascension mechanics
- `js/synergies.js` — synergy thresholds and bonuses

---

## Part A: ScriptableObject Definitions

These files use `using UnityEngine;` — they live in `Scripts/MonoBehaviours/` or a new `Scripts/Data/` folder (NOT in Core/, since ScriptableObjects need UnityEngine).

**`Scripts/Data/UnitTemplate.cs`** — ScriptableObject for one unit:
```csharp
[CreateAssetMenu(fileName = "NewUnit", menuName = "ShatteredVeil/Unit Template")]
public class UnitTemplate : ScriptableObject
{
    [Header("Identity")]
    public string unitId;           // e.g., "flame_warrior"
    public string displayName;      // e.g., "Flame Warrior"
    public Element element;         // Flame, Aqua, Terra, Zephyr, Lux, Shadow
    public Archetype archetype;     // Vanguard, Striker, Caster, Support, Assassin, Guardian
    public int tier;                // 1-5
    public string evolvedFromId;    // null for base units, e.g., "flame_warrior" for "fire_berserker"
    public string evolvesIntoId;    // null for evolved units

    [Header("Base Stats (Star 1)")]
    public int baseHP;
    public int baseATK;
    public int baseDEF;
    public int baseSPD;
    public float baseCritChance;
    public float baseCritDamage;    // default 1.5
    public int maxMana;             // 0 for T5 legendaries

    [Header("Growth Per Star")]
    public float hpGrowth;          // multiplier per star level
    public float atkGrowth;
    public float defGrowth;

    [Header("Combat")]
    public int attackRange;         // 1 = melee, 2-3 = ranged
    public TargetingRule defaultTargeting;

    [Header("References")]
    public string abilityId;        // key into AbilityCatalog
    public string passiveId;        // key into PassiveCatalog
}
```

**`Scripts/Data/SynergyDefinition.cs`** — ScriptableObject for synergy bonuses:
```csharp
[CreateAssetMenu(fileName = "NewSynergy", menuName = "ShatteredVeil/Synergy")]
public class SynergyDefinition : ScriptableObject
{
    public SynergyType type;        // Element or Archetype
    public string synergyId;        // e.g., "flame", "vanguard"
    public SynergyTier[] tiers;     // thresholds and bonuses
}

[System.Serializable]
public class SynergyTier
{
    public int requiredCount;       // e.g., 2, 3, 4, 6
    public string description;      // e.g., "+15% ATK for Flame units"
    public StatModifier[] bonuses;  // the actual stat changes
}

[System.Serializable]
public class StatModifier
{
    public StatType stat;           // HP, ATK, DEF, SPD, CritChance, CritDamage, etc.
    public ModifierType modType;    // Flat or Percent
    public float value;
}
```

---

## Part B: Pure C# Data Interfaces

These go in `Scripts/Core/Units/` (no UnityEngine) so the combat engine can reference unit data without depending on ScriptableObjects at runtime.

**`Core/Units/IUnitData.cs`** — Interface that both ScriptableObject and test mocks can implement:
```csharp
public interface IUnitData
{
    string UnitId { get; }
    string DisplayName { get; }
    Element Element { get; }
    Archetype Archetype { get; }
    int Tier { get; }
    int BaseHP { get; }
    int BaseATK { get; }
    int BaseDEF { get; }
    int BaseSPD { get; }
    float BaseCritChance { get; }
    float BaseCritDamage { get; }
    int MaxMana { get; }
    int AttackRange { get; }
    string AbilityId { get; }
    string PassiveId { get; }
}
```

**`Core/Units/UnitStatCalculator.cs`** — Compute stats at any star level:
```
- CalculateHP(IUnitData data, int starLevel) → int
- CalculateATK(IUnitData data, int starLevel) → int
- CalculateDEF(IUnitData data, int starLevel) → int
- Formula from GROUND-TRUTH.md section 4:
  stat = baseStat * (1 + growthRate * (starLevel - 1))
  OR whatever the actual formula is in units-templates.js
```

**`Core/Units/EvolutionSystem.cs`** — Evolution/star-up logic:
```
- CanEvolve(string unitId) → bool
- GetEvolvedForm(string unitId) → string
- GetStarUpCost(int tier) → int copies needed (T1=3, T2=4, T3=5, T4=8, T5=10)
- CanStarUp(string unitId, int currentStar, int copiesOwned) → bool
```

**`Core/Units/SynergyCalculator.cs`** — Calculate active synergies from team composition:
```
- CalculateSynergies(List<IUnitData> team) → List<ActiveSynergy>
- ActiveSynergy: { synergyId, currentCount, activeTier, bonuses }
- Handles both element AND archetype synergies
- Returns all bonuses that should be applied to matching units
```

---

## Part C: Create All 132 Unit ScriptableObjects

Use Unity MCP `batch_execute` with `manage_scriptable_object` to create all 132 unit assets in `Data/Units/`.

**Organization:**
```
Data/Units/
├── Fire/
│   ├── flame_warrior.asset
│   ├── ember_scout.asset
│   ├── ... (11 base)
│   ├── fire_berserker.asset
│   ├── flame_rogue.asset
│   └── ... (11 evolved)
├── Water/
├── Earth/
├── Wind/
├── Lightning/
└── Force/
```

Extract all stat values from `js/units-templates.js`. Every field must match exactly.

Also create synergy definition assets in `Data/Synergies/`:
- 6 element synergies (Flame, Aqua, Terra, Zephyr, Lux, Shadow)
- 6 archetype synergies (Vanguard, Striker, Caster, Support, Assassin, Guardian)

Extract thresholds and bonus values from `js/synergies.js`.

---

## Tests

**`Tests/EditMode/Units/UnitStatCalculatorTests.cs`**:
- Flame Warrior at star 1: matches exact HP/ATK/DEF from GROUND-TRUTH
- Flame Warrior at star 5: matches growth formula
- All 6 sample units (one per element) at star 1 and 3: correct stats

**`Tests/EditMode/Units/EvolutionSystemTests.cs`**:
- flame_warrior can evolve into fire_berserker
- fire_berserker cannot evolve (already evolved)
- Star-up costs: T1=3, T2=4, T3=5, T4=8, T5=10
- Can't star-up without enough copies

**`Tests/EditMode/Units/SynergyCalculatorTests.cs`**:
- Team with 2 Flame units: Flame synergy tier 1 active
- Team with 4 Flame units: Flame synergy tier 2 active
- Team with 2 Vanguard + 3 Striker: both synergies active
- Empty team: no synergies
- Bonus values match GROUND-TRUTH exactly

---

## Validation Checklist

- [ ] 132 UnitTemplate ScriptableObjects created in Data/Units/
- [ ] 12 SynergyDefinition ScriptableObjects created in Data/Synergies/
- [ ] Core/Units/ has no `using UnityEngine;`
- [ ] Stat calculator matches GROUND-TRUTH test cases
- [ ] Evolution pairs correct (all 66 base → evolved mappings)
- [ ] Synergy thresholds and bonuses match GROUND-TRUTH
- [ ] All tests pass

## Commit

```
git add Unity/ShatteredVeil/Assets/Scripts/Core/Units/ Unity/ShatteredVeil/Assets/Scripts/Data/ Unity/ShatteredVeil/Assets/Data/Units/ Unity/ShatteredVeil/Assets/Data/Synergies/ Unity/ShatteredVeil/Assets/Tests/EditMode/Units/
git commit -m "Prompt 40: Unit data layer — 132 unit ScriptableObjects, stat calculator, evolution, synergy system"
```

# Prompt 37: Abilities & Mana System Port

> **Purpose**: Port the ability system (132 active abilities) and mana system to pure C#. This builds on top of the combat core (Prompt 36) by adding the ability execution layer — mana gain, ability casting, ability resolution, and the full ability data catalog.
>
> **Branch**: `feature/unity-abilities-mana`
> **Depends on**: Prompt 36 (combat core — CombatUnit, DamageCalculator, GridSystem, CombatEngine must exist)
> **Session type**: Claude Code with Unity MCP

---

## Key Principle

All code goes in `Scripts/Core/Combat/`. No `using UnityEngine;`. Pure C# only.

---

## Read First

- `GROUND-TRUTH.md` — section 5 (Abilities) and any mana-related entries
- `COMBAT-DESIGN.md` — ability system section
- `js/units-abilities.js` — all 132 ability definitions (ABILITY_DATA + evolved abilities)
- `js/main-v2.js` — search for `executeAbility`, `castAbility`, mana gain logic (lines ~5318, ~5540, ~5871)

---

## Mana System

### Mana Mechanics (extract from main-v2.js)

Each unit has `currentMana` and `maxMana`. Mana = 0 at combat start (unless Mana Shrine bonus).

**Mana gain sources:**
1. **Passive mana regen**: `passiveManaPerSec * dt` — ticked every update frame
2. **Mana on attack**: Gain 10 mana when landing an auto-attack (modified by Mana Shrine `manaGenMult`)
3. **Mana on hit (taking damage)**: `manaFromDmg` — gain mana proportional to damage taken
4. **On-kill refund**: Some abilities refund mana on kill (e.g., Ember Scout: 30 mana on kill)
5. **Archetype bonuses**: Sorcerer archetype gives starting mana, mana refund, etc.

**Ability cast trigger**: When `currentMana >= maxMana`, the unit casts its ability. Mana resets to 0 after cast.

**T5 Legendary units**: `maxMana === 0` — these use a different system (`legendaryState`) with periodic or conditional triggers instead of mana-based casting.

### Files to Create

**`Core/Combat/ManaSystem.cs`**:
```
- GainManaOnAttack(CombatUnit unit, float manaGenMultiplier) → gains 10 * mult, capped at maxMana
- GainManaOnHit(CombatUnit unit, float damageTaken) → formula from main-v2.js
- GainManaPassive(CombatUnit unit, float deltaTime) → passiveManaPerSec * dt
- CanCastAbility(CombatUnit unit) → bool (currentMana >= maxMana AND maxMana > 0 AND not silenced)
- ConsumeMana(CombatUnit unit) → resets to 0 (or partial refund for some archetypes)
```

---

## Ability System

### Ability Data Model

**`Core/Combat/AbilityData.cs`** — Definition of what an ability does:
```csharp
public class AbilityData
{
    public string Id;                    // e.g., "flame_warrior"
    public string Name;                  // e.g., "Blade Inferno"
    public string Description;
    public AbilityType Type;             // Active, PassiveCast (T5 legendaries)
    public TargetingRule Targeting;       // Nearest, LowestHP, HighestATK, Self, AllEnemies, AllAllies, Area
    public float DamageMultiplier;       // e.g., 1.5 for 150% ATK
    public float HealMultiplier;         // for healing abilities (e.g., 1.4 for 140% ATK heal)
    public int Range;                    // grid cells
    public int AreaRadius;               // for AoE abilities (0 = single target)
    public StatusEffectApplication[] AppliedEffects;  // e.g., Burn 15 DPS 3s
    public AbilityFlag[] Flags;          // Dash, Shield, Heal, SelfBuff, ConditionBonus, ManaRefund
    public Dictionary<string, float> SpecialParams;  // catch-all for unique mechanics
}
```

**`Core/Combat/AbilityType.cs`** (enum):
```
Active,         // Standard mana-based casting
PassiveCast,    // T5 legendary periodic/conditional
Summon,         // Creates minions
Transform       // Self-modification (Phoenix revive, etc.)
```

**`Core/Combat/AbilityFlag.cs`** (enum/flags):
```
None, Dash, Shield, Heal, SelfBuff, AreaDamage, ConditionBonus, ManaRefund,
Pierce, Chain, Knockback, Root, Stun, Silence, Burn, Slow, Lifesteal,
Redirect, Revive, Summon
```

### Ability Catalog

**`Core/Combat/AbilityCatalog.cs`** — Static catalog of all 132 abilities.

Parse from `js/units-abilities.js` ABILITY_DATA. Each entry needs:
- The description text (copy directly)
- Parsed numeric values: damage multiplier, heal multiplier, status effect params, area radius, special conditions
- Targeting rule derived from the description

**Important**: Many abilities have unique mechanics that don't fit a generic template (e.g., Inferno Fox dashes 3 times, Phoenix revives on death, Kraken pulls enemies toward center). These should be flagged with `AbilityFlag` and have their special params in `SpecialParams`. The actual execution of special mechanics happens in `AbilityExecutor`.

Port ALL 132 abilities. Group by element for readability:
- Fire base (11) + Fire evolved (11)
- Water base (11) + Water evolved (11)
- Earth base (11) + Earth evolved (11)
- Wind base (11) + Wind evolved (11)
- Lightning base (11) + Lightning evolved (11)
- Force base (11) + Force evolved (11)

### Ability Execution

**`Core/Combat/AbilityExecutor.cs`** — Resolves what happens when an ability is cast:
```
- Execute(CombatUnit caster, AbilityData ability, CombatState state, System.Random rng) → AbilityResult
- AbilityResult contains: List<DamageInstance>, List<HealInstance>, List<StatusApplied>,
  List<MovementEvent>, List<ShieldGrant>, specialEvents (kill refund, summon, revive, etc.)

Generic resolution:
1. Select target(s) based on ability.Targeting
2. For damage abilities: calculate damage via DamageCalculator for each target
   - ATK * ability.DamageMultiplier * element * defense
3. For healing abilities: calculate heal amount (ATK * HealMultiplier)
4. Apply status effects (delegate to StatusEffectSystem — stub for now, full in Prompt 38)
5. Apply shields (flat or % max HP)
6. Handle special flags: Dash (move caster), Knockback (move target), Chain, Pierce, etc.
7. Handle conditional bonuses (e.g., "if target is Slowed, deal 280% instead of 220%")
8. Handle mana refund on kill
9. Return AbilityResult

For complex unique abilities (Phoenix revive, Kraken pull, Void Wyrm bolt-on-ally-cast):
- Use a switch on ability.Id for truly unique mechanics
- Keep the number of special cases minimal — try to express most abilities through the generic system
```

### Integration with CombatEngine

Update `CombatEngine.ExecuteTurn()` (from Prompt 36) to:
1. After turn starts, check `ManaSystem.CanCastAbility(unit)`
2. If true: execute ability via `AbilityExecutor.Execute()`, then `ManaSystem.ConsumeMana()`
3. If false: perform auto-attack (existing logic from Prompt 36), then `ManaSystem.GainManaOnAttack()`
4. After any damage dealt: `ManaSystem.GainManaOnHit()` for the target

---

## Tests

**`Tests/EditMode/Combat/ManaSystemTests.cs`**:
- Mana starts at 0
- Gain 10 on attack (with and without multiplier)
- Mana capped at maxMana
- CanCastAbility true when full, false when not
- T5 units (maxMana=0) can never cast via mana
- Mana refund on kill works correctly

**`Tests/EditMode/Combat/AbilityCatalogTests.cs`**:
- All 132 abilities are in the catalog (count check)
- Spot-check 12 abilities (2 per element): verify damage multiplier, targeting rule, flags
- No null entries or missing fields

**`Tests/EditMode/Combat/AbilityExecutorTests.cs`**:
- Single-target damage ability: correct damage output
- AoE ability: hits correct number of targets
- Healing ability: heals correct amount
- Conditional bonus: "if target is Burning, deal extra" works
- Mana refund on kill: mana restored after killing blow
- Shield grant: correct shield amount applied

**`Tests/EditMode/Combat/CombatEngineAbilityTests.cs`**:
- Unit fills mana → casts ability → mana resets
- Ability damage matches DamageCalculator output with ability multiplier
- Unit without enough mana auto-attacks instead
- Full 3v3 battle with abilities: completes without error

---

## Validation Checklist

- [ ] All files in `Core/Combat/` — no `using UnityEngine;`
- [ ] All 132 abilities present in AbilityCatalog
- [ ] Mana gain/cast/reset cycle works
- [ ] AbilityExecutor handles generic abilities correctly
- [ ] Special-case abilities (Phoenix, Kraken, Void Wyrm) at least stubbed
- [ ] All tests pass
- [ ] No console errors

## Commit

```
git add Unity/ShatteredVeil/Assets/Scripts/Core/Combat/ Unity/ShatteredVeil/Assets/Tests/EditMode/Combat/
git commit -m "Prompt 37: Abilities and mana system — 132 ability catalog, mana cycle, ability execution, 40+ tests"
```

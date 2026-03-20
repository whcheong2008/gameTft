# Prompt 38: Status Effects System Port

> **Purpose**: Port the complete status effect system to pure C#. Covers all status effects (buffs, debuffs, CC), duration tracking, stacking rules, diminishing returns on CC, tenacity, and immunity windows.
>
> **Branch**: `feature/unity-status-effects`
> **Depends on**: Prompt 36 (CombatUnit), Prompt 37 (AbilityExecutor stubs StatusEffect application)
> **Session type**: Claude Code with Unity MCP

---

## Key Principle

All code in `Scripts/Core/Combat/`. No `using UnityEngine;`. Pure C# only.

---

## Read First

- `GROUND-TRUTH.md` — section 7 (Status Effects)
- `COMBAT-DESIGN.md` — status effects section, DR on CC, tenacity
- `js/main-v2.js` — search for `applyStatusEffect`, `tickStatusEffects`, `processStatusEffects`, stasis/stun/freeze logic

---

## Status Effect Types

### Damage Over Time (DoT)
- **Burn**: X DPS for Y seconds. Ticks every 0.5s or 1s.
- **Poison**: X DPS for Y seconds. Often stacks.
- **Bleed**: X DPS for Y seconds. Usually from physical attacks.

### Crowd Control (CC)
- **Stun**: Cannot attack, move, or cast. Duration affected by tenacity and DR.
- **Freeze**: Same as stun but ice-themed (may have element interaction).
- **Root**: Cannot move but CAN attack and cast. Duration affected by tenacity.
- **Silence**: Cannot cast abilities but CAN auto-attack and move.
- **Slow**: Reduced attack speed by X%. Stackable to a cap.
- **Knockback**: Forced movement 1-2 cells. Instant, no duration.
- **Taunt**: Forces target to attack the taunter. Duration-based.

### Buffs
- **Shield**: Absorbs X damage before HP is affected. Duration or until depleted.
- **Regen/HoT**: Heal X HP per second for Y seconds.
- **DR (Damage Reduction)**: Take X% less damage for Y seconds.
- **ATK Boost**: +X% ATK for Y seconds.
- **Speed Boost**: +X% attack speed for Y seconds.
- **Dodge**: X% chance to avoid attacks for Y seconds.
- **Lifesteal**: Heal for X% of damage dealt for Y seconds.
- **Immunity**: Cannot be affected by CC for Y seconds.

### Special
- **Vulnerability**: Take X% more damage (default 25%).
- **Stasis/Burrow**: Unit is untargetable and cannot act. Duration-based.
- **Stealth**: Cannot be targeted (but can still take AoE damage).

---

## Files to Create

**`Core/Combat/StatusEffectType.cs`** (enum):
```
Burn, Poison, Bleed,
Stun, Freeze, Root, Silence, Slow, Knockback, Taunt,
Shield, Regen, DamageReduction, AtkBoost, SpeedBoost, Dodge, Lifesteal, Immunity,
Vulnerability, Stasis, Stealth
```

**`Core/Combat/StatusEffectCategory.cs`** (enum):
```
DoT, CrowdControl, Buff, Debuff, Special
```

**`Core/Combat/StatusEffect.cs`** — Runtime instance of a status effect:
```
- StatusEffectType Type
- StatusEffectCategory Category
- float Duration (remaining)
- float MaxDuration (original)
- float TickInterval (for DoTs)
- float TimeSinceLastTick
- float Value (DPS for DoTs, % for buffs/debuffs, flat amount for shields)
- float ShieldRemaining (for Shield type only)
- int SourceUnitId (who applied it)
- int Stacks (for stackable effects)
- bool IsExpired → Duration <= 0 (or ShieldRemaining <= 0 for shields)
```

**`Core/Combat/StatusEffectSystem.cs`** — Central manager for all status effects:
```
Core methods:
- ApplyEffect(CombatUnit target, StatusEffect effect, CombatUnit source) → bool (success)
  - Check immunity
  - Apply tenacity reduction to CC duration
  - Apply DR (diminishing returns) to repeated CC
  - Handle stacking rules
  - Add to target's active effects list

- TickEffects(CombatUnit unit, float deltaTime) → List<StatusTickResult>
  - Iterate all active effects
  - Decrement durations
  - Tick DoTs (deal damage at tick interval)
  - Tick regens (heal at tick interval)
  - Remove expired effects
  - Return events (damage dealt, heals applied, effects expired)

- RemoveEffect(CombatUnit unit, StatusEffectType type) → remove specific effect
- RemoveAllDebuffs(CombatUnit unit) → cleanse
- HasEffect(CombatUnit unit, StatusEffectType type) → bool
- GetEffectValue(CombatUnit unit, StatusEffectType type) → float (total value, summing stacks)
- IsCC(StatusEffectType type) → bool (stun, freeze, root, silence, slow, taunt)
- AbsorbDamage(CombatUnit unit, float incomingDamage) → float (remaining after shields)
```

**`Core/Combat/DiminishingReturns.cs`** — CC diminishing returns:
```
From COMBAT-DESIGN.md:
- Track how many times a unit has been hit by CC recently
- Each subsequent CC of the same type within a window has reduced duration
- Formula: effectiveDuration = baseDuration * (1 / (1 + ccCount * drFactor))
- After X applications, unit becomes temporarily immune

Tenacity:
- Some units/buffs grant tenacity (flat % CC duration reduction)
- effectiveDuration = baseDuration * (1 - tenacity) * drMultiplier
- Tenacity is checked BEFORE DR

Immunity windows:
- After a stun/freeze ends, brief immunity window (e.g., 1s)
- Prevents perma-stun chains
```

### Integration Points

**Update `DamageCalculator.cs`** (from Prompt 36):
- Step 6 now checks StatusEffectSystem for:
  - Vulnerability on target → +25% damage
  - DamageReduction on target → reduce by DR%
  - Shield absorption → reduce final damage, deplete shield

**Update `AbilityExecutor.cs`** (from Prompt 37):
- Abilities that apply status effects now call `StatusEffectSystem.ApplyEffect()` with real StatusEffect objects instead of stubs

**Update `CombatEngine.ExecuteTurn()`**:
- Before turn: check if unit is Stunned/Frozen → skip turn
- After each attack: tick DoTs and regens for all units
- Check stasis: stasis units are untargetable AND don't act (fix the bug from HTML prototype — BUGS.md #3)

---

## Tests

**`Tests/EditMode/Combat/StatusEffectSystemTests.cs`**:
- Apply Burn → ticks correct DPS at correct interval
- Apply Stun → unit skips turn
- Apply Shield → absorbs damage, depletes correctly
- Apply Root → unit can't move but can attack
- Apply Silence → unit can't cast but can auto-attack
- Apply Slow → attack speed reduced by correct %
- Stacking: apply 2 Slows → values combine (to cap)
- Duration expires → effect removed
- Immunity: unit with Immunity resists CC
- Shield absorbs partial damage: 50 shield, 80 damage → 30 damage goes through

**`Tests/EditMode/Combat/DiminishingReturnsTests.cs`**:
- First stun: full duration
- Second stun within window: reduced duration
- Third stun: further reduced
- After threshold: unit immune
- Tenacity: 20% tenacity → stun 80% of base duration
- Tenacity + DR: both applied correctly

**`Tests/EditMode/Combat/CombatEngineStatusTests.cs`**:
- Unit with Burn takes DoT damage each turn
- Stunned unit skips their turn
- Battle with status effects: completes without error
- Stasis units are untargetable (regression test for BUGS.md #3)

---

## Validation Checklist

- [ ] All files in `Core/Combat/` — no `using UnityEngine;`
- [ ] All status effect types implemented
- [ ] DR on CC works with correct formula
- [ ] Tenacity reduces CC duration
- [ ] Immunity windows prevent perma-stun
- [ ] Shield absorption integrated with DamageCalculator
- [ ] Stasis bug (BUGS.md #3) prevented by design (stasis ticks for ALL units)
- [ ] All tests pass
- [ ] No console errors

## Commit

```
git add Unity/ShatteredVeil/Assets/Scripts/Core/Combat/ Unity/ShatteredVeil/Assets/Tests/EditMode/Combat/
git commit -m "Prompt 38: Status effects — DoTs, CC, buffs, shields, DR, tenacity, immunity windows, 25+ tests"
```

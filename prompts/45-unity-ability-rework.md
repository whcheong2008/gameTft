# Prompt 45: Ability System v2 — Per-Unit Unique Abilities + Healer Fix

> **Purpose**: The ability system has been reworked TWICE since Prompt 37. The current system (v2) gives every unit a unique ability function. Templates are now just classification tags, NOT ability dispatchers. This prompt replaces the old AbilityCatalog with 132 per-unit ability functions, integrates the healer auto-heal fix, and updates scaling/passives.
>
> **Branch**: `feature/unity-ability-v2`
> **Depends on**: Prompts 36-39 (combat engine)
> **CRITICAL**: Read `TEMPLATE-V2-HANDOFF.md` first — it is the authoritative handoff doc.
> **Session type**: Claude Code with Unity MCP

---

## Read First (IN THIS ORDER)

1. `TEMPLATE-V2-HANDOFF.md` — **THE AUTHORITATIVE HANDOFF.** Explains the 3-layer architecture, all 132 unit→ability mappings, scaling tables, healer rules, test results.
2. `HEALER-FIX-HANDOFF.md` — Healer auto-heal mechanic details.
3. `js/ability-templates.js` — The current JS source with `UNIT_ABILITIES` (132 per-unit functions), `ELEMENT_STATUS_MAP`, `TIER_SCALE`, `getScale()`, `executeTemplateAbility()`, `processTemplatePassive()`.
4. `js/units-templates.js` — Every unit's `abilityTemplate` field (classification, NOT dispatch).
5. `js/units-abilities.js` — Flavor text descriptions (names/descriptions matching the per-unit abilities).
6. `GROUND-TRUTH.md` sections 5-6 — Updated template reference.

---

## The v2 Architecture (3 Independent Layers)

| Layer | What It Defines | Source |
|-------|----------------|--------|
| **Element** | Auto-attack passive (burn, slow, shield, dodge, crit, DR reduction) — from element synergy (2) threshold | Synergy system (already ported in Prompt 40) |
| **Template** | Playstyle classification tag (e.g., "execute_striker", "heal_and_harm") — for UI display and balance analysis ONLY | `abilityTemplate` field on unit in units-templates.js |
| **Unit** | Unique active ability — specific mechanics, multipliers, effects per unit | `UNIT_ABILITIES[unitKey]` function in ability-templates.js |

**Key rule**: The template does NOT dispatch abilities. `UNIT_ABILITIES[caster.templateKey]` dispatches by unit key. Two units on the same template (e.g., War Cleric and Shield Bearer, both `bodyguard`) have completely different ability mechanics.

---

## Tier Scaling (from ability-templates.js)

All abilities call `getScale(cost, isEvolved)` for tier-appropriate numbers:

| Tier | Base Mult | Evolved Mult | DoT DPS | CC Duration | Shield % |
|------|-----------|-------------|---------|-------------|----------|
| T1 | 1.8× | 2.34× | 10 | 1.2s | 15% |
| T2 | 1.9× | 2.57× | 15 | 1.5s | 20% |
| T3 | 2.1× | 2.94× | 21 | 1.75s | 24% |
| T4 | 2.6× | 3.77× | 26 | 2.0s | 28% |
| T5 | 3.2× | 4.80× | 37 | 2.5s | 37% |

T5 units (maxMana=0) use passive abilities and never "cast."

---

## Files to Create/Replace

### Replace: `Core/Combat/AbilityCatalog.cs` and `AbilityTemplateCatalog.cs` (if it exists)

Delete both. Create:

**`Core/Combat/UnitAbilityCatalog.cs`** — 132 per-unit ability functions:
```
- Dictionary<string, Func<AbilityContext, AbilityResult>> mapping unit keys to ability functions
- Each function takes: AbilityContext { caster, target, enemies, allies, grid, rng, scale }
- Each function returns: AbilityResult { damageInstances, healInstances, statusApplied, movements, shields }

Implement ALL 132 abilities from UNIT_ABILITIES in ability-templates.js.
Each unit has its own unique function — no shared logic between units.

Port by element group:
- Fire (11 base + 11 evolved = 22)
- Water (22)
- Earth (22)
- Wind (22)
- Lightning (22)
- Force (22)

For each ability, use getScale() equivalent with the unit's tier and evolved status.
```

**`Core/Combat/TierScaling.cs`** — Scale factors:
```
- static ScaleData GetScale(int tier, bool isEvolved)
- ScaleData: { float AbilityMult, int DotDps, float CcDuration, float ShieldPct }
- Values from TEMPLATE-V2-HANDOFF.md table above
```

**`Core/Combat/ElementStatusMap.cs`** — Element → status mapping:
```
- Fire → Burn (DoT)
- Water → Freeze/Slow (CC)
- Earth → Root/Shield
- Wind → Silence/Dodge
- Lightning → Stun/Crit
- Force → Vulnerability
```

### Update: `Core/Combat/CombatUnit.cs`

Verify these fields exist (should already be added):
```csharp
public string AbilityTemplateId;  // Classification tag, NOT dispatch key
public string UnitType;            // "warrior", "healer", "tank", "assassin", "mage", "archer"
public bool IsHealer => UnitType == "healer";
```

The ability dispatches via `UnitAbilityCatalog.Get(unit.UnitId)` — using the UNIT ID, not the template ID.

### Update: `Core/Combat/CombatEngine.cs`

The healer branch should already exist. Verify it:
1. Healer auto-heal targets lowest-HP% ally
2. Heals using ATK stat
3. Generates +10 mana per heal
4. Fires `OnHeal` passive (NOT `OnHit`)
5. Falls through to enemy attack if all allies full HP

Update the ability cast section to use `UnitAbilityCatalog`:
```csharp
// Replace old template/catalog lookup with:
var unitAbility = UnitAbilityCatalog.Get(actor.UnitId);
if (unitAbility != null && ManaSystem.CanCastAbility(actor))
{
    var scale = TierScaling.GetScale(actor.Tier, actor.IsEvolved);
    var ctx = new AbilityContext(actor, target, enemies, allies, _grid, _rng, scale);
    var abilityResult = unitAbility(ctx);
    ManaSystem.ConsumeMana(actor);
    // ... process results ...
}
```

### Update: `Core/Combat/PassiveSystem.cs`

Passives are now minimal — element synergies handle auto-attack effects. The template `processTemplatePassive` is nearly empty in v2. The passive triggers still exist but fire less:

| Trigger | Used By |
|---------|---------|
| `onHit` | Mostly unused (element handles it) |
| `onHeal` | Heal-and-harm passive |
| `onTakeDamage` | Revenge tank reflect |
| `onKill` | Chain killer stacking |
| `onTick` | Shield refresh timers, T5 periodic |

### Remove: `Core/Combat/PassiveCatalog.cs`

The old 132-entry passive catalog is obsolete. Passives are either:
- In the element synergy system (already ported)
- Part of the unit's ability function (self-contained)
- T5 legendary periodic effects (handled in tick)

---

## Full Unit→Ability Reference

Port ALL 132 abilities from `UNIT_ABILITIES` in `ability-templates.js`. Use the `TEMPLATE-V2-HANDOFF.md` mapping tables (sections "Fire (11 units)" through "Force (11 units)") for the ability summary of each unit. The exact mechanics are in the JS functions.

**Example — Flame Warrior (execute_striker type):**
```
Slash target. If target below 40% HP: guaranteed crit + 50% bonus damage.
Refund 30 mana on kill.
Scale: damage = ATK * scale.abilityMult
```

**Example — Fire Acolyte (heal_and_harm type):**
```
Heal lowest-HP ally for 150% ATK.
Damage 3 nearest enemies for 80% ATK each.
Heals deal 50% of heal amount as damage to nearest enemy.
```

**Example — Shell Knight (shield_stacker type):**
```
Grant self shield 40% max HP.
Grant nearby allies shield 20% max HP.
Every 6s, auto-grant shield 25% max HP to self + 1 ally.
```

Each evolved form is an enhanced version of the base — higher multipliers, additional effects. Port both.

---

## Stat Adjustments Already Baked In

The tester session applied 131 stat changes to `units-templates.js`. These are already in the file:
- Tier scaling multipliers (T2 ×1.15, T3 ×1.25, T4 ×1.35, T5 ×1.50)
- Healer systemic buff: All 9 healers ATK ×1.4, MaxMana −15
- Various nerfs/buffs per TEMPLATE-V2-HANDOFF.md section "Stat Adjustments"

**The ScriptableObjects from Prompt 40 may need updating** if they were created before these stat changes. Verify 3-4 sample units (Flame Warrior, Shell Knight, Phoenix, Leviathan) match the current `units-templates.js` values. If not, regenerate affected assets.

---

## Tests

**`Tests/EditMode/Combat/UnitAbilityCatalogTests.cs`**:
- All 132 unit abilities exist in catalog (count check)
- flame_warrior: deals damage, crits if target <40% HP
- fire_acolyte: heals ally AND damages enemies
- shell_knight: grants shield to self and allies
- phoenix (T5): no mana-based cast (maxMana=0)
- No two units return identical AbilityResult for the same input

**`Tests/EditMode/Combat/TierScalingTests.cs`**:
- T1 base mult = 1.8
- T5 evolved mult = 4.80
- All 5 tiers return expected values

**`Tests/EditMode/Combat/HealerCombatTests.cs`**:
- Healer auto-attacks heal lowest-HP ally
- Healer generates +10 mana per heal
- Healer fires onHeal, NOT onHit
- All allies full → healer attacks enemy (fallback)
- heal_and_harm ability: heals + damages simultaneously

**`Tests/EditMode/Combat/CombatEngineV2Tests.cs`**:
- 3v3 battle with mixed types (warrior, healer, tank) completes
- Healer keeps allies alive longer than no-healer team
- T3 team beats T1 team (per test results: 4243 vs 1893 damage)
- All 6 element mirror matches run without error

---

## Known Design Issues (NOT bugs — defer to balance pass)

From TEMPLATE-V2-HANDOFF.md:
1. Gale Dancer (Wind healer) — drain_fighter template, self-sustain only
2. Pulse Mender (Lightning healer) — cc_chainer template, pure CC
3. Gust Sentinel (Wind tank) — blink_striker template, offensive
4. Fortress/Golem — unkillable_wall, self-only
5. Leviathan (T5 tank) — no team impact
6. Phoenix (T5 mage) — 7s toggle too slow

These should be fixed via the process in `processes/UNIT-ABILITY-REWORK.md`, not in this prompt.

---

## Validation Checklist

- [ ] All 132 unit abilities in UnitAbilityCatalog (count == 132)
- [ ] Old AbilityCatalog.cs removed or deprecated
- [ ] Old PassiveCatalog.cs removed or deprecated
- [ ] TierScaling matches TEMPLATE-V2-HANDOFF.md table exactly
- [ ] Healer auto-heal path works in CombatEngine
- [ ] Ability dispatches by UNIT ID, not template ID
- [ ] No `using UnityEngine` in Core/Combat/
- [ ] All tests pass (target: 90+ like JS)

## Commit

```
git add Unity/ShatteredVeil/Assets/Scripts/Core/Combat/ Unity/ShatteredVeil/Assets/Tests/EditMode/Combat/
git commit -m "Prompt 45: Ability system v2 — 132 per-unit unique abilities, tier scaling, healer auto-heal, element-passive separation"
```

# Prompt 46: ScriptableObject Verification & Post-v2 Alignment

> **Purpose**: Prompt 40 created 132 UnitTemplate ScriptableObjects and synergy assets before the ability v2 rework (Prompt 45). This prompt verifies and fixes any misalignments between the SO data and the current v2 architecture.
>
> **Branch**: `feature/unity-so-verification`
> **Depends on**: Prompts 40 (unit data), 45 (ability v2)
> **Session type**: Claude Code with Unity MCP

---

## Read First

1. `TEMPLATE-V2-HANDOFF.md` — The v2 ability architecture (3 layers: element, template, unit)
2. `GROUND-TRUTH.md` sections 2-4 — Elements, archetypes, unit stats
3. `js/units-templates.js` — Current JS unit definitions (source of truth for stat values)
4. `js/ability-templates.js` — `UNIT_ABILITIES` mapping (132 per-unit ability functions)

---

## What to Check & Fix

### 1. UnitTemplate.cs field alignment

Prompt 40 created `UnitTemplate` with:
- `abilityId` — was a key into old `AbilityCatalog` (now deleted by Prompt 45)
- `passiveId` — was a key into old `PassiveCatalog` (now deleted by Prompt 45)

Prompt 45 replaced these with `UnitAbilityCatalog` which dispatches by **unit ID** directly. Check if these fields are still referenced anywhere. If not, they should be removed or repurposed:

- `abilityId` → **remove** (abilities dispatch via `UnitAbilityCatalog.Get(unitId)`, no separate key needed)
- `passiveId` → **remove** (passives are now either element synergy effects, embedded in the unit ability function, or T5 periodic effects)

Add if missing:
- `string abilityTemplate` — the classification tag (e.g., "execute_striker", "heal_and_harm") from `units-templates.js`. For UI display and balance analysis ONLY, does NOT dispatch abilities.
- `string unitType` — "warrior", "healer", "tank", "assassin", "mage", "archer" (needed for healer auto-heal detection in combat)

### 2. Stat value audit

Verify a sample of ScriptableObject `.asset` files against `js/units-templates.js` to catch any drift:
- Pick 2 units per element (12 total) across different tiers
- Compare: baseHP, baseATK, baseDEF, baseSPD, maxMana, tier, attackRange
- Report any mismatches

### 3. Synergy definitions

Verify synergy ScriptableObjects match `GROUND-TRUTH.md` section 3 (Archetype thresholds and bonuses) and section 2 (Element synergy thresholds). Specifically:
- Element synergies: check (2) and (4) thresholds
- Archetype synergies: check (2), (4), (6) thresholds
- Bonus values match GROUND-TRUTH exactly

### 4. Compile check

After any changes:
- Ensure no broken references to deleted `AbilityCatalog` or `PassiveCatalog`
- Ensure `CombatUnit` creation from `UnitTemplate` still works
- Run all existing tests — nothing should regress

---

## Tests

**`Tests/EditMode/Units/UnitTemplateV2AlignmentTests.cs`**:
- UnitTemplate does NOT have `abilityId` or `passiveId` fields (or they are obsolete/unused)
- All UnitTemplates have a non-empty `unitType` field
- All UnitTemplates have a non-empty `abilityTemplate` field
- `UnitAbilityCatalog.Get(unitId)` returns non-null for every unit in the SO database
- No compile errors referencing old catalog classes

---

## Commit

```
git add Unity/ShatteredVeil/Assets/Scripts/ Unity/ShatteredVeil/Assets/Tests/ Unity/ShatteredVeil/Assets/Resources/
git commit -m "Prompt 46: SO verification — align UnitTemplate fields with ability v2, stat audit, remove dead refs"
```

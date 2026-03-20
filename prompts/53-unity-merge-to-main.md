# Prompt 53: Merge All Feature Branches to Main

> **Purpose**: Merge all Track A (34-46) and Track B (47-52) feature branches into `main`. Resolve all conflicts. Verify the project compiles and tests pass. This is a housekeeping prompt — no new features.
>
> **Branch**: Work directly on `main`
> **Session type**: Claude Code with Unity MCP

---

## IMPORTANT: Read Before Starting

This is NOT a normal feature prompt. You are merging 19 feature branches that were all branched from `main` independently. There WILL be conflicts, especially in:
- `EditModeTests.asmdef` (assembly references added by multiple branches)
- `GameEventBus.cs` (events added by multiple branches)
- `CONTINUITY.md` (updated by multiple branches — take the latest version)
- `.meta` files (Unity GUIDs)

---

## Merge Order

Merge in dependency order. After EACH merge, verify no compile errors before proceeding.

### Phase 1: Track A — Core Logic (merge in this exact order)

```
1.  feature/unity-project-setup       (Prompt 34 — foundation)
2.  feature/ground-truth               (Prompt 35 — spec extraction)
3.  feature/unity-combat-core          (Prompt 36 — combat engine)
4.  feature/unity-abilities-mana       (Prompt 37 — abilities, replaced by 45 but has base code)
5.  feature/unity-status-effects       (Prompt 38 — status effects)
6.  feature/unity-passives-bosses      (Prompt 39 — passives + bosses)
7.  feature/unity-unit-data            (Prompt 40 — 132 ScriptableObjects)
8.  feature/unity-gacha-economy        (Prompt 41 — gacha + economy core)
9.  feature/unity-heroes               (Prompt 43 — hero system)
10. feature/unity-ability-rework       (Prompt 45 — replaces old ability system)
11. feature/unity-items                (Prompt 42 — item system)
12. feature/unity-save-system          (Prompt 44 — save system)
13. feature/unity-so-verification      (Prompt 46 — SO alignment)
```

### Phase 2: Track B — UI + Scenes (merge in this exact order)

```
14. feature/unity-ui-foundation        (Prompt 47 — UI architecture)
15. feature/unity-hub-scene            (Prompt 48 — hub)
16. feature/unity-gacha-roster         (Prompt 49 — gacha + roster)
17. feature/unity-team-builder         (Prompt 50 — team builder)
18. feature/unity-mission-select       (Prompt 51 — mission select)
19. feature/unity-combat-scene         (Prompt 52 — combat scene)
```

---

## Merge Strategy

For each branch:

```bash
git checkout main
git merge feature/<branch-name> --no-ff -m "Merge <branch-name> into main"
```

### Conflict Resolution Rules

1. **`EditModeTests.asmdef`**: Combine all assembly references from all branches. The final file should reference all test assemblies.

2. **`GameEventBus.cs`**: Keep ALL events from ALL branches. Combine them into one file. Remove duplicates.

3. **`PlaceholderFactory.cs`**: If multiple branches define this, take the most complete version (likely from Prompt 47 or later).

4. **`CONTINUITY.md`**: Take the version from the LAST merged branch (feature/unity-combat-scene). It has the most up-to-date status.

5. **`.meta` files**: Keep the version from the branch being merged (theirs). If both sides added new .meta files, keep both.

6. **`SaveData.cs` / data models**: If multiple branches define fields, combine all fields.

7. **Any file where both branches ADD content** (not modify): Keep both additions.

8. **Any file where the newer branch REPLACES an older version** (e.g., Prompt 45 replacing Prompt 37's ability system): Take the newer version.

---

## Post-Merge Verification

After ALL branches are merged:

1. **Check for compile errors**:
   ```bash
   # Look for any obvious issues
   grep -r "using.*AbilityCatalog" Unity/ShatteredVeil/Assets/Scripts/ --include="*.cs"
   # Should find 0 references to the old AbilityCatalog (replaced by Prompt 45)
   ```

2. **Verify file counts**:
   - `Scripts/Core/Combat/` should have ~20+ files
   - `Scripts/Core/Items/` should have ~17 files
   - `Scripts/Core/Save/` should have ~14 files
   - `Scripts/Core/Economy/` should have files
   - `Scripts/Core/Units/` should have files
   - `Scripts/Core/Gacha/` should have files
   - `Scripts/Core/Heroes/` should have files
   - `Scripts/Core/Teams/` should have files
   - `Scripts/Core/Missions/` should have files
   - `Scripts/MonoBehaviours/UI/` should have ~15+ files
   - `Scripts/Data/` should have UnitTemplate, SynergyDefinition, GameData.asmdef
   - `Resources/Units/` should have 132 .asset files
   - `Resources/Synergies/` should have 15 .asset files
   - `Tests/EditMode/` should have test files in Combat, Items, Save, Economy, Units, Gacha, Heroes, Teams, Missions, UI subdirectories

3. **Verify no Unity dependency leaks**:
   ```bash
   grep -r "using UnityEngine" Unity/ShatteredVeil/Assets/Scripts/Core/ --include="*.cs"
   # Should find 0 results
   ```

4. **Tag the merge**:
   ```bash
   git tag v1.0.0-tracks-ab-complete -m "Track A (core logic) + Track B (UI scenes) merged to main"
   ```

---

## Push

```bash
TOKEN=$(cat keys/github.txt | tr -d '[:space:]')
git remote set-url origin "https://whcheong2008:${TOKEN}@github.com/whcheong2008/gameTft.git"
git push origin main --tags
git remote set-url origin "https://github.com/whcheong2008/gameTft.git"
```

---

## Commit

No separate commit — each merge creates its own merge commit. The tag marks completion.

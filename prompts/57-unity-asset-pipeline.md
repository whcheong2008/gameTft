# Prompt 57: Asset Pipeline — Manifest, Folder Structure, Swap System

> **Purpose**: Set up the graphics asset pipeline — organized folder structure, a manifest mapping every placeholder to its final asset, and a swap system so assets can be replaced one-by-one as they're created. No actual art — just the infrastructure for Track D.
>
> **Branch**: `feature/unity-asset-pipeline`
> **Depends on**: Prompt 47 (PlaceholderFactory), Prompt 46 (UnitTemplate SOs)
> **Session type**: Claude Code with Unity MCP

---

## Read First

1. `UNITY-ARCHITECTURE.md` — Folder map
2. `Scripts/MonoBehaviours/UI/PlaceholderFactory.cs` — Current placeholder generation
3. `Scripts/Data/UnitTemplate.cs` — Unit data fields (element, tier, unitType)

---

## Asset Folder Structure

Create this hierarchy under `Assets/Art/`:

```
Assets/Art/
├── Units/
│   ├── Base/                    ← 66 base unit portraits (256×256 PNG)
│   │   ├── fire/                ← Grouped by element
│   │   │   ├── flame_warrior.png
│   │   │   ├── cinder_archer.png
│   │   │   └── ...
│   │   ├── water/
│   │   ├── earth/
│   │   ├── wind/
│   │   ├── lightning/
│   │   └── force/
│   └── Evolved/                 ← 66 evolved unit portraits
│       ├── fire/
│       │   ├── fire_berserker.png
│       │   └── ...
│       └── ... (same structure)
│
├── Characters/                  ← Story character portraits (512×512 PNG)
│   ├── kael/
│   │   ├── neutral.png
│   │   ├── determined.png
│   │   ├── angry.png
│   │   ├── sad.png
│   │   ├── shocked.png
│   │   └── happy.png
│   ├── lyric/
│   │   └── ... (same expressions)
│   ├── senna/
│   ├── otho/
│   ├── maren/
│   ├── mira/
│   ├── torren/
│   └── dren/
│
├── Icons/
│   ├── Elements/               ← 6 element icons (64×64)
│   │   ├── fire.png
│   │   ├── water.png
│   │   ├── earth.png
│   │   ├── wind.png
│   │   ├── lightning.png
│   │   └── force.png
│   ├── Archetypes/             ← 9 archetype icons (64×64)
│   │   ├── guardian.png
│   │   └── ...
│   ├── Items/                  ← Item rarity borders, gem icons
│   │   ├── rarity_common.png
│   │   ├── rarity_uncommon.png
│   │   ├── rarity_rare.png
│   │   ├── rarity_epic.png
│   │   ├── rarity_legendary.png
│   │   └── gems/
│   │       ├── ruby_standard.png
│   │       └── ... (9 types × 4 rarities = 36)
│   ├── UI/                     ← General UI icons
│   │   ├── star_filled.png
│   │   ├── star_empty.png
│   │   ├── ve_currency.png
│   │   ├── xp_icon.png
│   │   ├── lock_icon.png
│   │   └── back_arrow.png
│   └── Buildings/              ← 8 building icons (128×128)
│       ├── sustained_bonds.png
│       ├── attunement_rite.png
│       └── ...
│
├── Backgrounds/
│   ├── Regions/                ← 8 region backgrounds (1080×1920)
│   │   ├── region_1_frontier.png
│   │   └── ...
│   ├── Combat/                 ← Combat grid backgrounds
│   │   └── default_grid.png
│   └── UI/                     ← UI backgrounds
│       ├── hub_bg.png
│       ├── gacha_bg.png
│       └── dialogue_bg.png
│
├── Bosses/                     ← 8 boss sprites (512×512)
│   ├── boss_1.png
│   └── ...
│
└── VFX/                        ← Ability/element VFX sprite sheets (future)
    ├── fire_burst.png
    └── ...
```

---

## Asset Manifest — `Scripts/Core/AssetManifest.cs`

Pure C# data class listing every required asset.

```csharp
public static class AssetManifest
{
    // Every asset the game needs, with its path and status
    public static readonly AssetEntry[] AllAssets = new AssetEntry[]
    {
        // Units (132)
        new AssetEntry("unit_flame_warrior", "Art/Units/Base/fire/flame_warrior", AssetCategory.UnitPortrait, 256),
        new AssetEntry("unit_fire_berserker", "Art/Units/Evolved/fire/fire_berserker", AssetCategory.UnitPortrait, 256),
        // ... all 132 units

        // Characters (8 characters × 6 expressions = 48)
        new AssetEntry("char_kael_neutral", "Art/Characters/kael/neutral", AssetCategory.CharacterPortrait, 512),
        // ... all expressions for all characters

        // Icons
        new AssetEntry("icon_element_fire", "Art/Icons/Elements/fire", AssetCategory.Icon, 64),
        // ... all element + archetype + item + UI icons

        // Backgrounds (8 regions + combat + UI)
        new AssetEntry("bg_region_1", "Art/Backgrounds/Regions/region_1_frontier", AssetCategory.Background, 1920),

        // Bosses (8)
        new AssetEntry("boss_1", "Art/Bosses/boss_1", AssetCategory.BossSprite, 512),
    };
}

public class AssetEntry
{
    public string Id;
    public string Path;              // Relative to Assets/ (no extension)
    public AssetCategory Category;
    public int TargetSize;           // Pixel size (width for square, height for portrait)
    public bool HasRealAsset;        // false = using placeholder, true = real art loaded
}

public enum AssetCategory
{
    UnitPortrait,
    CharacterPortrait,
    Icon,
    Background,
    BossSprite,
    VFX
}
```

---

## Asset Loader — `Scripts/MonoBehaviours/UI/AssetLoader.cs`

Runtime asset loading with placeholder fallback.

```csharp
public static class AssetLoader
{
    /// Try to load a real asset from Resources. If not found, generate placeholder.
    public static Sprite LoadUnitPortrait(string unitId, string element, int tier)
    {
        // Try real asset first
        var sprite = Resources.Load<Sprite>("Art/Units/Base/" + element + "/" + unitId);
        if (sprite == null)
            sprite = Resources.Load<Sprite>("Art/Units/Evolved/" + element + "/" + unitId);
        if (sprite != null)
            return sprite;

        // Fallback to placeholder
        return PlaceholderFactory.CreateUnitSprite(element, tier);
    }

    public static Sprite LoadCharacterPortrait(string characterId, string expression)
    {
        var sprite = Resources.Load<Sprite>("Art/Characters/" + characterId + "/" + expression);
        if (sprite != null)
            return sprite;

        // Fallback: element-colored square with initial
        return PlaceholderFactory.CreateIconSprite(
            PlaceholderFactory.GetElementColor(CharacterData.Characters[characterId].Element),
            characterId.Substring(0, 1).ToUpper()
        );
    }

    public static Sprite LoadIcon(string iconPath)
    {
        var sprite = Resources.Load<Sprite>(iconPath);
        if (sprite != null) return sprite;
        return PlaceholderFactory.CreateIconSprite(Color.gray, "?");
    }

    // etc. for backgrounds, bosses
}
```

---

## Update Existing UI Controllers

Update these files to use `AssetLoader` instead of calling `PlaceholderFactory` directly:
- `UnitCardController.cs` — use `AssetLoader.LoadUnitPortrait()`
- `CombatUnitView.cs` (if exists) — use `AssetLoader.LoadUnitPortrait()`
- Future: `DialogueBoxController.cs` — use `AssetLoader.LoadCharacterPortrait()`

This means: drop a real PNG into the right folder → it automatically appears in-game, no code changes needed.

---

## Asset Progress Tracker — `Scripts/Editor/AssetProgressWindow.cs`

Unity Editor window showing how many assets have been replaced.

```
┌─ Asset Progress ─────────────────────┐
│                                      │
│  Unit Portraits:    12 / 132  (9%)   │
│  Character Ports:    0 / 48   (0%)   │
│  Icons:              3 / 59   (5%)   │
│  Backgrounds:        0 / 11   (0%)   │
│  Boss Sprites:       0 / 8    (0%)   │
│  VFX:                0 / ?    (0%)   │
│  ──────────────────────────          │
│  Total:             15 / 258  (6%)   │
│                                      │
│  [Refresh]  [Export Missing List]    │
└──────────────────────────────────────┘

- Scans Art/ folders for actual files
- Compares against AssetManifest
- "Export Missing List" outputs a CSV of all missing assets with size requirements
```

---

## Tests — `Tests/EditMode/Assets/`

**`AssetManifestTests.cs`**:
- Manifest contains exactly 132 unit portrait entries
- Manifest contains entries for all 8 characters with 6 expressions each
- All manifest paths are unique (no duplicates)
- All unit IDs in manifest match unit IDs in UnitTemplate SOs
- AssetLoader falls back to placeholder when no real asset exists
- AssetLoader returns real sprite when asset file is present

---

## Commit

```
git add Assets/Art/ Assets/Scripts/Core/AssetManifest.cs Assets/Scripts/MonoBehaviours/UI/AssetLoader.cs Assets/Scripts/Editor/AssetProgressWindow.cs Assets/Tests/EditMode/Assets/
git commit -m "Prompt 57: Asset pipeline — manifest (258 assets), folder structure, AssetLoader with placeholder fallback, editor progress tracker"
```

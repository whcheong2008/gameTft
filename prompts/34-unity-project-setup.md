# Prompt 34: Unity Project Setup + MCP Installation

> **Purpose**: Create the Unity project structure, install required packages, configure Unity MCP for AI-assisted development, and set up the `.gitignore` for the unity folder. This is the foundation prompt — everything else depends on it.
>
> **Branch**: `feature/unity-project-setup`
> **Depends on**: Nothing. This is the first Unity prompt.
> **Session type**: Claude Code with Unity MCP configured

---

## Prerequisites (Human Steps — Do These Before Running This Prompt)

These steps require the Unity Editor GUI and cannot be done by Claude Code:

1. **Install Unity Hub** if not already installed
2. **Install Unity 2022.3 LTS** (latest patch) via Unity Hub
3. **Install Python 3.10+** and the `uv` package manager (`pip install uv` or `pipx install uv`)
4. **Create a new Unity project**:
   - Open Unity Hub → New Project
   - Template: **2D (URP)** — Universal Render Pipeline, 2D configuration
   - Project name: Leave default or name it (doesn't matter, it goes in the `unity/` folder)
   - Location: Set to `{repo_root}/unity/` — so the Unity project lives at `gameTft/unity/`
   - Click Create
5. **Install Unity MCP package**:
   - In Unity Editor: Window → Package Manager → `+` → Add package from git URL
   - Enter: `https://github.com/CoplayDev/unity-mcp.git?path=/MCPForUnity#main`
   - Wait for import
6. **Start MCP server**:
   - Window → MCP for Unity
   - Click "Start Server" (defaults to localhost:8080)
   - Select your MCP client (Claude Code or Claude Desktop) and click Configure
   - Verify connection shows green/confirmed
7. **Verify MCP works**: In Claude Code, try `manage_editor` or `editor_state` to confirm the bridge is live

Once these are done, hand this prompt to Claude Code.

---

## What Claude Code Does

### 1. Update `.gitignore`

Add Unity-specific ignores to the repo root `.gitignore`:

```
# Unity
unity/Library/
unity/Temp/
unity/Logs/
unity/UserSettings/
unity/Builds/
unity/obj/
unity/Assets/Plugins/Editor/JetBrains*
*.csproj
*.sln
*.pidb
*.pdb
*.userprefs
*.booproj
*.svd
*.unityproj
*.suo
*.tmp
*.user
*.pidb.meta
*.pdb.meta

# Unity MCP telemetry
DISABLE_TELEMETRY=true
```

### 2. Install Required Packages

Use Unity MCP's `manage_packages` tool to install:

```
- com.unity.textmeshpro (should be included by default)
- com.unity.test-framework (should be included by default)
- com.unity.inputsystem
- com.unity.addressables
- com.unity.2d.tilemap
- com.unity.2d.tilemap.extras
```

Verify each is installed by checking `project_info` resource.

### 3. Create Folder Structure

Use `manage_asset` or file system to create:

```
unity/Assets/
├── Scripts/
│   ├── Core/
│   │   ├── Combat/
│   │   ├── Units/
│   │   ├── Items/
│   │   ├── Heroes/
│   │   ├── Gacha/
│   │   ├── Economy/
│   │   ├── Save/
│   │   └── Story/
│   ├── MonoBehaviours/
│   ├── UI/
│   └── Utilities/
├── Data/
│   ├── Units/
│   ├── Items/
│   ├── Heroes/
│   ├── Stages/
│   ├── Economy/
│   └── Story/
├── Prefabs/
│   ├── Units/
│   ├── UI/
│   ├── VFX/
│   └── Combat/
├── Scenes/
│   ├── Boot.unity
│   ├── Camp.unity
│   ├── Combat.unity
│   ├── TeamBuilder.unity
│   ├── Gacha.unity
│   └── MissionSelect.unity
├── Art/
│   ├── Sprites/
│   ├── UI/
│   └── Backgrounds/
├── Audio/
│   ├── BGM/
│   ├── SFX/
│   └── Voice/
├── Resources/
└── Tests/
    ├── EditMode/
    │   ├── Combat/
    │   ├── Gacha/
    │   ├── Items/
    │   ├── Heroes/
    │   ├── Economy/
    │   └── Save/
    └── PlayMode/
```

### 4. Create Assembly Definitions

Create these `.asmdef` files so tests can reference game code:

**`unity/Assets/Scripts/Core/GameCore.asmdef`**:
```json
{
    "name": "GameCore",
    "rootNamespace": "ShatteredVeil.Core",
    "references": [],
    "includePlatforms": [],
    "excludePlatforms": [],
    "allowUnsafeCode": false,
    "overrideReferences": false,
    "precompiledReferences": [],
    "autoReferenced": true,
    "defineConstraints": [],
    "versionDefines": [],
    "noEngineReferences": true
}
```

Note: `"noEngineReferences": true` — this enforces that Core/ has NO Unity dependencies. If any script tries to use `UnityEngine`, it won't compile. This is the architectural guardrail.

**`unity/Assets/Scripts/MonoBehaviours/GameMono.asmdef`**:
```json
{
    "name": "GameMono",
    "rootNamespace": "ShatteredVeil.Mono",
    "references": ["GameCore"],
    "includePlatforms": [],
    "excludePlatforms": [],
    "allowUnsafeCode": false,
    "overrideReferences": false,
    "precompiledReferences": [],
    "autoReferenced": true,
    "defineConstraints": [],
    "versionDefines": [],
    "noEngineReferences": false
}
```

**`unity/Assets/Tests/EditMode/EditModeTests.asmdef`**:
```json
{
    "name": "EditModeTests",
    "rootNamespace": "ShatteredVeil.Tests.EditMode",
    "references": ["GameCore", "UnityEngine.TestRunner", "UnityEditor.TestRunner"],
    "includePlatforms": ["Editor"],
    "excludePlatforms": [],
    "allowUnsafeCode": false,
    "overrideReferences": true,
    "precompiledReferences": ["nunit.framework.dll"],
    "autoReferenced": false,
    "defineConstraints": ["UNITY_INCLUDE_TESTS"],
    "versionDefines": [],
    "noEngineReferences": false
}
```

**`unity/Assets/Tests/PlayMode/PlayModeTests.asmdef`**:
```json
{
    "name": "PlayModeTests",
    "rootNamespace": "ShatteredVeil.Tests.PlayMode",
    "references": ["GameCore", "GameMono", "UnityEngine.TestRunner", "UnityEditor.TestRunner"],
    "includePlatforms": [],
    "excludePlatforms": [],
    "allowUnsafeCode": false,
    "overrideReferences": true,
    "precompiledReferences": ["nunit.framework.dll"],
    "autoReferenced": false,
    "defineConstraints": ["UNITY_INCLUDE_TESTS"],
    "versionDefines": [],
    "noEngineReferences": false
}
```

### 5. Create Stub Scripts

Create minimal stubs to verify the project compiles:

**`unity/Assets/Scripts/Core/Combat/DamageCalculator.cs`**:
```csharp
namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Pure C# damage calculation — no Unity dependencies.
    /// Implements the 7-step damage pipeline from COMBAT-DESIGN.md.
    /// Placeholder — full implementation in Prompt 36.
    /// </summary>
    public static class DamageCalculator
    {
        public static float CalculateDamage(float atk, float def, float skillMultiplier, float elementMultiplier)
        {
            return atk * skillMultiplier * elementMultiplier * (1f - def / (def + 100f));
        }
    }
}
```

**`unity/Assets/Tests/EditMode/Combat/DamageCalculatorTests.cs`**:
```csharp
using NUnit.Framework;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Tests.EditMode.Combat
{
    [TestFixture]
    public class DamageCalculatorTests
    {
        [Test]
        public void BasicDamage_MatchesFormula()
        {
            // ATK=100, DEF=50, skill=1.5, element=1.0
            // Expected: 100 * 1.5 * 1.0 * (1 - 50/150) = 150 * 0.6667 = 100
            float result = DamageCalculator.CalculateDamage(100f, 50f, 1.5f, 1.0f);
            Assert.AreEqual(100f, result, 0.5f);
        }

        [Test]
        public void ZeroDefense_FullDamage()
        {
            float result = DamageCalculator.CalculateDamage(100f, 0f, 1.0f, 1.0f);
            Assert.AreEqual(100f, result, 0.01f);
        }

        [Test]
        public void ElementMultiplier_AppliesCorrectly()
        {
            float neutral = DamageCalculator.CalculateDamage(100f, 50f, 1.0f, 1.0f);
            float strong = DamageCalculator.CalculateDamage(100f, 50f, 1.0f, 1.5f);
            Assert.Greater(strong, neutral);
        }
    }
}
```

### 6. Validate and Test

1. Use `validate_script` on both `.cs` files
2. Use `run_tests` to execute EditMode tests
3. Use `read_console` to check for errors
4. Verify all tests pass

### 7. Create Boot Scene

Set up `Scenes/Boot.unity` as the default scene that loads on play:
- Empty scene with a single GameObject "GameManager"
- No scripts attached yet (MonoBehaviours come in later prompts)
- Set as Scene 0 in Build Settings

---

## Validation Checklist

- [ ] Unity project exists at `unity/` and opens without errors
- [ ] Unity MCP is connected (verify via `editor_state` resource)
- [ ] All packages installed (TextMeshPro, Input System, Addressables, Tilemap)
- [ ] Folder structure created (Scripts/Core/*, Data/*, Tests/*, etc.)
- [ ] Assembly definitions created (GameCore with `noEngineReferences: true`)
- [ ] Stub `DamageCalculator.cs` compiles
- [ ] Stub `DamageCalculatorTests.cs` passes (3 tests green)
- [ ] `.gitignore` updated for Unity
- [ ] No console errors

## Commit

```
git add -A
git commit -m "Prompt 34: Unity project setup — folder structure, packages, assembly definitions, MCP integration, stub test"
```

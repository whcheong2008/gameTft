# Prompt 09 — Evolution Rework: Evolution Lab Building

> **One-liner for Claude Code:** `Read the file prompts/09-evolution-rework.md and implement everything it describes.`

## Context

Read `CONTINUITY.md` for full project context. The game is a browser-based gacha auto-battler. Currently, evolution happens automatically at combat start when a unit meets star/synergy criteria — the base unit transforms in-place for that fight. We're replacing this with a deliberate player action via a new **Evolution Lab** hub building. Evolved units become **separate collection entries** that the player owns permanently.

**Script load order:** `units.js → save.js → gacha.js → teams.js → hub.js → items.js → missions.js → ui-v2.js → main-v2.js`

**Rules:** All files use `var`, global scope, NO ES modules, NO import/export. Match existing code style.

---

## 1. New Building: Evolution Lab (`hub.js`)

Add to `BUILDINGS`:

```js
evolution_lab: {
    name: 'Evolution Lab',
    emoji: '🧬',
    description: 'Evolve 3-star units into powerful new forms',
    maxLevel: 3,
    upgradeCosts: [0, 300, 800, 2000],
    effects: [
        'Locked — build to unlock evolution',
        'Can evolve units (gold cost: 50 × base unit cost)',
        'Evolution cost reduced by 25%',
        'Evolution cost reduced by 50%'
    ]
}
```

Add to the default buildings in `save.js`'s `createDefaultSaveData()` and `validateSaveData()`:
```
evolution_lab: 0
```

**Building logic helpers** (add to `hub.js`):

```js
function canEvolve(saveData) {
    return getBuildingLevel(saveData, 'evolution_lab') >= 1;
}

function getEvolutionGoldCost(saveData, templateKey) {
    var tmpl = UNIT_TEMPLATES[templateKey];
    if (!tmpl) return Infinity;
    var baseCost = 50 * tmpl.cost;
    var labLevel = getBuildingLevel(saveData, 'evolution_lab');
    if (labLevel >= 3) return Math.floor(baseCost * 0.5);
    if (labLevel >= 2) return Math.floor(baseCost * 0.75);
    return baseCost;
}
```

---

## 2. Evolution Data Restructure (`units.js`)

### 2a. Replace `EVOLUTIONS` criteria format

Replace the current `EVOLUTIONS` object with a new format that uses a `requirements` array for extensibility:

```js
var EVOLUTIONS = {
    flame_warrior:  { into: 'fire_berserker',  requirements: [{ type: 'stars', min: 3 }] },
    ember_scout:    { into: 'flame_rogue',     requirements: [{ type: 'stars', min: 3 }] },
    magma_knight:   { into: 'volcano_titan',   requirements: [{ type: 'stars', min: 3 }] },
    pyromancer:     { into: 'inferno_mage',    requirements: [{ type: 'stars', min: 3 }] },
    tide_hunter:    { into: 'tsunami_blade',   requirements: [{ type: 'stars', min: 3 }] },
    frost_archer:   { into: 'ice_sniper',      requirements: [{ type: 'stars', min: 3 }] },
    coral_priest:   { into: 'ocean_sage',      requirements: [{ type: 'stars', min: 3 }] },
    hydro_mage:     { into: 'abyssal_mage',    requirements: [{ type: 'stars', min: 3 }] },
    stone_guard:    { into: 'mountain_lord',   requirements: [{ type: 'stars', min: 3 }] },
    vine_archer:    { into: 'thorn_ranger',    requirements: [{ type: 'stars', min: 3 }] },
    earth_shaman:   { into: 'gaia_priest',     requirements: [{ type: 'stars', min: 3 }] },
    golem:          { into: 'titan',           requirements: [{ type: 'stars', min: 3 }] },
    zephyr_scout:   { into: 'storm_assassin',  requirements: [{ type: 'stars', min: 3 }] },
    wind_archer:    { into: 'gale_sniper',     requirements: [{ type: 'stars', min: 3 }] },
    storm_mage:     { into: 'tempest_wizard',  requirements: [{ type: 'stars', min: 3 }] },
    sky_knight:     { into: 'aegis_paladin',   requirements: [{ type: 'stars', min: 3 }] }
};
```

> **Design note:** For now, ALL evolutions require 3 stars only. The `requirements` array is extensible — future prompts may add `{ type: 'synergy', archetype: 'guardian', count: 4 }`, `{ type: 'item', itemKey: 'evolution_stone' }`, `{ type: 'mission', missionId: 'story_7' }`, etc. The checker function should be written to handle any `{type, ...params}` object.

### 2b. Add `evolvedBaseKey` to `EVOLVED_TEMPLATES`

Each evolved template needs to know which base unit it came from (for reverse lookups):

```js
// Add to each entry in EVOLVED_TEMPLATES:
fire_berserker:  { ..., baseKey: 'flame_warrior' },
flame_rogue:     { ..., baseKey: 'ember_scout' },
volcano_titan:   { ..., baseKey: 'magma_knight' },
// ... etc for all 16 evolved templates
```

### 2c. Replace `checkEvolution()` with requirement checking

Remove the old `checkEvolution()` function entirely. Replace with:

```js
function checkEvolutionRequirements(saveData, templateKey) {
    var evo = EVOLUTIONS[templateKey];
    if (!evo) return { canEvolve: false, reason: 'No evolution path' };

    var entry = saveData.collection[templateKey];
    if (!entry) return { canEvolve: false, reason: 'Unit not owned' };

    var results = [];
    var allMet = true;

    for (var i = 0; i < evo.requirements.length; i++) {
        var req = evo.requirements[i];
        var met = false;
        var desc = '';

        switch (req.type) {
            case 'stars':
                met = entry.stars >= req.min;
                desc = req.min + '★ required (current: ' + entry.stars + '★)';
                break;
            // Future requirement types go here:
            // case 'synergy': ...
            // case 'item': ...
            // case 'mission': ...
            default:
                desc = 'Unknown requirement: ' + req.type;
                break;
        }

        results.push({ type: req.type, met: met, desc: desc });
        if (!met) allMet = false;
    }

    return { canEvolve: allMet, requirements: results, evolvedKey: evo.into };
}
```

### 2d. Add `evolveUnit()` function (`units.js` or `save.js` — whichever fits better)

```js
function evolveUnit(saveData, baseTemplateKey) {
    // Check building
    if (!canEvolve(saveData)) return { success: false, reason: 'Evolution Lab not built' };

    // Check requirements
    var check = checkEvolutionRequirements(saveData, baseTemplateKey);
    if (!check.canEvolve) return { success: false, reason: 'Requirements not met' };

    // Check gold
    var goldCost = getEvolutionGoldCost(saveData, baseTemplateKey);
    if (saveData.player.gold < goldCost) return { success: false, reason: 'Not enough gold (' + goldCost + 'g needed)' };

    // Check not already evolved this unit
    var evolvedKey = check.evolvedKey;
    if (saveData.collection[evolvedKey]) return { success: false, reason: 'Already evolved' };

    // Execute evolution:
    // 1. Spend gold
    spendGold(saveData, goldCost);

    // 2. Base unit stays in collection at current stars (NOT consumed)
    //    (no change needed — we just don't remove it)

    // 3. Add evolved unit as new collection entry at star 1, 0 copies
    saveData.collection[evolvedKey] = {
        stars: 1,
        copiesForNext: 0
    };

    autoSave(saveData);
    return { success: true, evolvedKey: evolvedKey };
}
```

---

## 3. Evolved Units in Collection & Roster (`save.js`, `teams.js`)

### 3a. `getRoster()` in `teams.js` — include evolved units

Currently `getRoster()` only looks up `UNIT_TEMPLATES`. It needs to also handle evolved keys that exist in the collection:

```js
function getRoster(saveData) {
    var roster = [];
    var keys = Object.keys(saveData.collection);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var entry = saveData.collection[key];

        // Try base templates first, then evolved templates
        var tmpl = UNIT_TEMPLATES[key] || EVOLVED_TEMPLATES[key];
        if (!tmpl) continue;

        var isEvolved = !!EVOLVED_TEMPLATES[key];

        roster.push({
            key: key,
            template: tmpl,
            stars: entry.stars,
            copiesForNext: entry.copiesForNext,
            copiesNeeded: getStarUpCost(),
            canStarUp: canStarUp(saveData, key),
            isEvolved: isEvolved
        });
    }

    // Sort: evolved first, then by cost (desc), then stars (desc), then name
    roster.sort(function(a, b) {
        if (a.isEvolved !== b.isEvolved) return a.isEvolved ? -1 : 1;
        var costA = a.template.cost || a.template.baseCost || 0;
        var costB = b.template.cost || b.template.baseCost || 0;
        if (costB !== costA) return costB - costA;
        if (b.stars !== a.stars) return b.stars - a.stars;
        return a.template.name.localeCompare(b.template.name);
    });

    return roster;
}
```

### 3b. `createUnit()` in `teams.js` — handle evolved template keys

The `createUnit(templateKey, stars)` function needs to work for both base and evolved keys:

```js
function createUnit(templateKey, stars) {
    var tmpl = UNIT_TEMPLATES[templateKey] || EVOLVED_TEMPLATES[templateKey];
    if (!tmpl) return null;

    var isEvolved = !!EVOLVED_TEMPLATES[templateKey];
    var mult = getStarMultiplier(stars);

    return {
        key: templateKey,
        name: tmpl.name,
        type: tmpl.type,
        archetype: tmpl.archetype,
        element: tmpl.element,
        cost: tmpl.cost || tmpl.baseCost || 1,
        stars: stars,
        hp: Math.floor(tmpl.hp * mult),
        maxHp: Math.floor(tmpl.hp * mult),
        attack: Math.floor(tmpl.attack * mult),
        attackSpd: tmpl.attackSpd,
        range: tmpl.range,
        moveSpd: tmpl.moveSpd,
        evolved: isEvolved,
        ability: isEvolved ? tmpl.ability : null,
        x: 0, y: 0,
        attackCooldown: 0,
        target: null,
        shield: 0
    };
}
```

### 3c. `canStarUp()` and `starUpUnit()` in `save.js`

These already work on any key in `saveData.collection`, so they should work for evolved keys automatically. However, ensure `getSellGoldValue()` and `getSellValue()` can also look up evolved templates:

In `save.js`, update `getSellGoldValue`:
```js
function getSellGoldValue(templateKey, copiesCount) {
    var tmpl = UNIT_TEMPLATES[templateKey] || EVOLVED_TEMPLATES[templateKey];
    if (!tmpl) return 0;
    var unitCost = tmpl.cost || tmpl.baseCost || 1;
    return copiesCount * unitCost * 3;
}
```

In `units.js`, update `getSellValue`:
```js
function getSellValue(unit) {
    var unitCost = unit.cost || 1;
    return unitCost * Math.pow(3, unit.stars - 1);
}
```

### 3d. How players get evolved copies for star-up

Evolved units appear in the **gacha pool** once the player has evolved that unit. This is key — you can't roll evolved copies until you've done the initial evolution.

In `gacha.js`, update the gacha rolling logic. After determining the cost tier and picking a random unit, add a small chance to get an evolved copy instead IF the player owns that evolved unit:

```js
// After picking a base unit key from the pool:
// Check if the player owns the evolved form of this unit
var evo = EVOLUTIONS[pickedKey];
if (evo && saveData.collection[evo.into]) {
    // 15% chance to get an evolved copy instead
    if (Math.random() < 0.15) {
        pickedKey = evo.into;
    }
}
```

This means evolved units are rare but farmable through gacha once unlocked. The 15% rate means roughly 1 in 7 rolls of the base unit's cost tier could yield an evolved copy.

**Also** update `addUnitToCollection` in `save.js` to work for evolved keys — it should already work since it's just keying into `saveData.collection`, but double-check that `totalUnitsCollected` increments correctly.

---

## 4. Remove Old Combat-Start Evolution

### 4a. In `ui-v2.js` → `startMissionCombat()`

Remove the evolution-checking loop (lines ~795–806 that iterate the board calling `checkEvolution()`). Evolved units are now deployed directly from the collection — they don't transform mid-mission.

Also remove the post-evolution synergy recalculation (`updateActiveSynergies(gs)` after the evolution loop on ~line 806).

Keep the enemy evolution code intact (`wc.enemyEvolutions` block) since enemies still use the old system. But update it to work with the new data format — the enemy evolution check needs a compatibility shim since we removed `checkEvolution()`:

```js
// For enemies only — simple star-based evolution check
function checkEnemyEvolution(unit) {
    if (unit.evolved) return false;
    var evo = EVOLUTIONS[unit.key];
    if (!evo) return false;
    // Enemies evolve if they meet star requirement (ignore other requirements)
    var starReq = 2; // default
    for (var i = 0; i < evo.requirements.length; i++) {
        if (evo.requirements[i].type === 'stars') {
            starReq = evo.requirements[i].min;
            break;
        }
    }
    if (unit.stars < starReq) return false;

    var evolvedTmpl = EVOLVED_TEMPLATES[evo.into];
    if (!evolvedTmpl) return false;
    var mult = getStarMultiplier(unit.stars);
    unit.key = evo.into;
    unit.name = evolvedTmpl.name;
    unit.emoji = evolvedTmpl.emoji;
    unit.type = evolvedTmpl.type;
    unit.archetype = evolvedTmpl.archetype;
    unit.element = evolvedTmpl.element;
    unit.hp = Math.floor(evolvedTmpl.hp * mult);
    unit.maxHp = Math.floor(evolvedTmpl.hp * mult);
    unit.attack = Math.floor(evolvedTmpl.attack * mult);
    unit.attackSpd = evolvedTmpl.attackSpd;
    unit.range = evolvedTmpl.range;
    unit.moveSpd = evolvedTmpl.moveSpd;
    unit.evolved = true;
    unit.ability = evolvedTmpl.ability;
    return true;
}
```

Put `checkEnemyEvolution` in `units.js` and update the enemy evolution code in `startMissionCombat()` to call `checkEnemyEvolution()` instead of `checkEvolution()`.

---

## 5. Evolution Lab UI (`ui-v2.js`)

### 5a. Evolution Lab button on Hub screen

In `renderHubScreen()`, the Evolution Lab building card should render like other buildings. When clicked and level ≥ 1, instead of just showing upgrade info, it opens the **Evolution Lab panel**.

### 5b. Evolution Lab Panel

When the player clicks the Evolution Lab building (level ≥ 1), show a panel listing all units that have an evolution path. For each:

```
[emoji] Unit Name (★★★)          → [evolved emoji] Evolved Name
Requirements: ✅ 3★ reached
Cost: 150g                        [EVOLVE] button (or "Already Evolved" / "Requirements Not Met")
```

Layout:
- Show all 16 evolution paths
- Green checkmark for met requirements, red X for unmet
- Gold cost shown (affected by lab level discount)
- "EVOLVE" button only enabled when all requirements met + enough gold
- If already evolved (evolved key exists in collection), show "✅ Evolved" badge
- If base unit not owned, show greyed out with "Not Owned" text

### 5c. Evolution success feedback

When player clicks EVOLVE and it succeeds:
- Brief flash/highlight effect (CSS animation)
- Status message: "🧬 [Base Name] evolved into [Evolved Name]!"
- Re-render the panel to show updated state
- The evolved unit now appears in the Roster and can be added to teams

### 5d. Update Unit Detail Panel

The existing `showUnitDetail()` function should:
- For base units with an evolution path: show "Evolution: [Evolved Name]" with requirement status and a link/button to jump to the Evolution Lab
- For evolved units: show "Evolved from: [Base Name]" and the ability description
- Show the `isEvolved` badge (✨ golden styling) on evolved units in roster cards

### 5e. Update Roster Rendering

In `renderRosterScreen()`:
- Evolved units should render with a golden border/glow (like they do in combat currently)
- Show the ✨ sparkle on evolved unit cards
- The roster sort already handles this via the updated `getRoster()`

### 5f. Update Team Builder

In the team builder:
- Evolved units should be selectable from the roster sidebar just like base units
- They show with the evolved emoji and golden border
- The synergy preview should work correctly (evolved units keep same archetype/element)
- The evolution preview section in the team builder sidebar should be **removed** (it showed old combat-start evolution criteria — no longer relevant)

---

## 6. Save Migration (`save.js`)

Bump `SAVE_VERSION` to 2. In `migrateSave()`:

```js
function migrateSave(data) {
    if (!data.version || data.version < 2) {
        // Add evolution_lab to buildings if missing
        if (!data.buildings) data.buildings = {};
        if (typeof data.buildings.evolution_lab === 'undefined') {
            data.buildings.evolution_lab = 0;
        }

        // No need to migrate evolved units — old saves didn't have them in collection
        // The old system transformed units in combat only, never saved evolved state

        data.version = 2;
    }
    return data;
}
```

Also update `validateSaveData()` to ensure `buildings.evolution_lab` exists.

---

## 7. Gacha Display Update (`gacha.js` / `ui-v2.js`)

When rolling gacha and getting an evolved copy, the result should show with special styling:
- Golden border on the roll result
- "✨ Evolved Copy!" label
- The evolved unit's emoji and name

In the gacha rendering (the roll result display in `ui-v2.js`), check if the rolled key is in `EVOLVED_TEMPLATES` and style accordingly.

---

## 8. Summary of File Changes

| File | Changes |
|------|---------|
| `units.js` | Replace `EVOLUTIONS` criteria format (requirements array), add `baseKey` to all `EVOLVED_TEMPLATES` entries, remove old `checkEvolution()`, add `checkEvolutionRequirements()`, add `checkEnemyEvolution()`, add `evolveUnit()` |
| `save.js` | Bump SAVE_VERSION to 2, update `migrateSave()`, update `validateSaveData()` for evolution_lab, update `getSellGoldValue()` for evolved templates |
| `hub.js` | Add `evolution_lab` building definition, add `canEvolve()`, add `getEvolutionGoldCost()` |
| `teams.js` | Update `getRoster()` to include evolved units, update `createUnit()` to handle evolved keys |
| `gacha.js` | Add evolved copy chance (15%) when player owns evolved form |
| `ui-v2.js` | Add Evolution Lab panel UI, remove combat-start evolution loop from `startMissionCombat()`, use `checkEnemyEvolution()` for enemies, update roster/team builder for evolved units, update unit detail panel, remove old evolution preview from team builder sidebar |
| `game-v2.html` | No changes needed (no new JS files) |

---

## 9. Testing Checklist

After implementation, verify:
1. Evolution Lab building appears in hub, can be built and upgraded
2. Clicking Evolution Lab (level ≥ 1) shows the evolution panel with all 16 paths
3. Requirements show correctly (green check / red X)
4. Gold cost displayed correctly, reduced at lab levels 2 and 3
5. Evolving a unit: gold deducted, evolved unit appears in collection at 1★
6. Base unit STILL exists in collection at same star level after evolution
7. Evolved unit appears in roster with golden styling
8. Evolved unit can be added to team in team builder
9. Evolved unit deploys to combat with correct stats and ability
10. Enemy evolution still works (using `checkEnemyEvolution()`)
11. Combat no longer auto-evolves player units
12. Gacha can roll evolved copies (at 15% chance) once player owns evolved form
13. Save/load works correctly with evolved units in collection
14. Old saves migrate cleanly (evolution_lab defaults to 0)
15. Unit detail panel shows evolution info for both base and evolved units
16. Selling evolved copies works correctly

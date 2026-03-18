# Prompt 29 — Hero System Implementation

> **Purpose**: Implement the hero overlay system where story characters (heroes) equip onto units, enabling item usage and providing skill tree bonuses. Heroes are the bridge between units and items.
>
> **Source of truth**: `HERO-SYSTEM-DESIGN.md` (complete hero roster, skill trees, availability timeline, fragment mechanic).
>
> **Pattern**: All `var`, global scope, NO ES modules, NO import/export. Match existing code style.
>
> **Read before starting**: `HERO-SYSTEM-DESIGN.md`, `js/units-core.js`, `js/save.js`, `js/hub.js`, `js/ui-v2.js`, `js/main-v2.js`.

---

## Part A: Hero Data Layer

Create `js/heroes.js` — all hero definitions, skill trees, and functions.

### Hero Definitions
```javascript
var HEROES = {
    hero_a: {
        name: 'A',   // Protagonist — placeholder name until story names are finalized
        title: 'The Commander',
        emoji: '⚔️👑',
        acquiredAt: 'start',  // 'start', 'r1_boss', 'r2_boss', etc.
        description: 'Lead by example. Your presence strengthens everyone.',
        preferredSlots: ['weapon', 'gauntlets'],  // +15% equipment stats in these slots
        branches: {
            a: { name: 'Vanguard Tactics', nodes: [ /* see HERO-SYSTEM-DESIGN.md */ ] },
            b: { name: 'Strategic Mind', nodes: [ /* see HERO-SYSTEM-DESIGN.md */ ] }
        }
    },
    // ... all 8 heroes from HERO-SYSTEM-DESIGN.md
};
```

### Node Data Structure
Each skill tree node:
```javascript
{
    key: 'rally_cry',
    name: 'Rally Cry',
    level: 1,           // hero level required to see/unlock this node
    cost: 1,            // skill points to invest (capstones cost 2)
    branch: 'a',
    effects: { atkPct: 0.05, adjacentAllyAtkPct: 0.03 },
    description: 'Equipped unit gains +5% ATK. Adjacent allies gain +3% ATK'
}
```

Copy ALL node data from `HERO-SYSTEM-DESIGN.md` for all 8 heroes. Every node, every branch, every effect.

### B's Fragment
Define as a special hero entry:
```javascript
var B_FRAGMENT = {
    name: "B's Fragment",
    title: 'Echo of the Lost',
    isFragment: true,
    maxSelectedNodes: 5,    // player picks 5 from B's unlocked nodes
    bonusReduction: 0.40,   // all bonuses reduced by 40%
    passiveEffect: {
        key: 'echo_of_b',
        description: 'Once per combat: delay death by 2s and deal 200% ATK to nearby enemies',
        deathDelaySec: 2,
        deathAoeDamagePct: 2.0
    }
};
```

### Hero Functions
```javascript
function createHero(heroKey) { /* returns hero object with level 1, 0 xp, empty skill allocations */ }
function getHeroXPToNext(level) { /* XP curve for hero levels 1-20 */ }
function grantHeroXP(hero, amount) { /* add XP, handle level-ups, return levels gained */ }
function allocateSkillPoint(hero, nodeKey) { /* invest a point, validate requirements */ }
function deallocateAllSkillPoints(hero) { /* respec — return all points */ }
function getHeroSkillEffects(hero) { /* sum all invested node effects into a single bonus object */ }
function getRespecCost(hero) { /* gold cost, increases each time: 50 * (respecCount + 1) */ }
function assignHeroToUnit(saveData, heroKey, unitId) { /* assign hero, update save */ }
function unassignHero(saveData, heroKey) { /* remove hero from unit, return equipment to inventory */ }
function getHeroForUnit(saveData, unitId) { /* lookup: does this unit have a hero? return hero or null */ }
function getAvailableHeroes(saveData) { /* which heroes are unlocked based on region progress */ }
```

### Hero XP Curve
- Level cap: 20
- XP per level: `Math.floor(80 * Math.pow(1.15, level - 1))`
- Heroes gain XP when their equipped unit participates in combat
- XP rate: roughly 1.5x unit XP rate per mission

---

## Part B: Save Data

Add hero data to save structure:

```javascript
// In createDefaultSaveData(), add:
heroes: {
    unlocked: ['hero_a', 'hero_b'],  // available heroes
    data: {
        hero_a: { level: 1, xp: 0, skillPoints: 0, allocations: {}, assignedUnit: null, respecCount: 0 },
        hero_b: { level: 1, xp: 0, skillPoints: 0, allocations: {}, assignedUnit: null, respecCount: 0 }
    },
    bFragment: null  // becomes { selectedNodes: [...], assignedUnit: null } after R7
}
```

### Save Migration
Bump save version. Migration adds:
- `heroes` object with A and B unlocked at start
- All existing units keep working without heroes (no items currently equipped under new system — existing items migrated separately in prompt 30)

---

## Part C: Hero Availability by Region

Wire hero unlocking to region boss clear rewards. In the mission victory handler (or region reward claiming):

| Event | Hero Unlocked |
|-------|--------------|
| Game start | hero_a, hero_b |
| R1 boss cleared | hero_kael |
| R2 boss cleared | hero_lyra |
| R3 boss cleared | hero_maren |
| R4 stage (specific, before boss) | hero_dax |
| R4 boss cleared | **B dies** — remove hero_b from active roster. Unassign from unit. Save B's current level/allocations for fragment. |
| R4 post-boss | hero_lyra and hero_maren temporarily unavailable |
| R5 stages (progressive) | hero_lyra returns (R5 stage 2), hero_maren returns (R5 stage 4), hero_sera unlocked (R5 boss) |
| R6 boss cleared | hero_voss |
| R7 specific stage | B's Fragment becomes available |

### B's Death Implementation
When B dies:
1. Store B's current level and allocated skill nodes in `saveData.heroes.bDeathSnapshot`
2. Remove `hero_b` from `unlocked` list
3. Unassign B from their unit
4. Any equipment on B's unit is returned to inventory
5. Show a narrative moment (simple text overlay)

### B's Fragment Activation (R7)
When fragment is acquired:
1. Create `saveData.heroes.bFragment` from `bDeathSnapshot`
2. Present UI: player selects 5 nodes from B's unlocked skill tree
3. Fragment is treated as a hero for assignment purposes (can equip to a unit)
4. Fragment cannot gain XP or level up
5. All selected node bonuses are reduced by 40%

---

## Part D: Combat Integration

### Apply Hero Skill Effects
At combat start, for each player unit:
1. Check if unit has a hero assigned
2. If yes, call `getHeroSkillEffects(hero)` to get the combined bonus object
3. Apply bonuses to the unit's combat stats (ATK, HP, crit, lifesteal, DR, etc.)
4. Handle special effects (adjacency bonuses, conditional bonuses, once-per-combat effects)

### Combat-Triggered Hero Effects
Some hero nodes trigger during combat:
- "On kill" effects (Lyra's Adrenaline, Voss's Warlord's Fury)
- "Below HP threshold" effects (A's Unyielding Will, Kael's Reactive Armor, Dax's Vanish)
- "On ability cast" effects (A's Coordinated Strike, Sera's Echo Cast)
- "Once per combat" effects (A's Commander's Resolve, Kael's Immortal Guard, Maren's Miracle, Dax's Phantom Strike)
- "Timed" effects (Vanguard charge bonuses, ramping ATK)

Implement these as checks within the existing combat loop (same pattern as synergy effects).

### Hero XP Grant
After combat victory:
- Each hero whose unit participated gains XP
- XP amount = `heroBaseXP * stageMultiplier * 1.5` (same base as unit XP, but 1.5x rate)
- Dead units' heroes still gain XP (they were deployed)

---

## Part E: Hub UI — Hero Management

### Hero Screen
Add a "Heroes" button to the hub that opens the hero management screen:

1. **Hero List**: Show all unlocked heroes with: name, title, level, XP bar, assigned unit (or "Unassigned"), emoji
2. **Click a hero** → Hero Detail Panel:
   - Hero name, title, description, level, XP progress
   - Assigned unit (with reassign button)
   - Preferred equipment slots highlighted
   - Skill tree (see below)
   - Respec button (shows gold cost)

### Skill Tree UI
Show the hero's 2 branches side by side:
- Each node is a box showing: name, cost, effect description
- Nodes below the hero's current level show as "?" (locked/hidden)
- Nodes at or above current level show full info
- Invested nodes are highlighted (green border or filled)
- Available nodes (can invest) have a "+" button
- Grayed-out nodes don't meet prerequisites (need prior node or insufficient points)
- Show remaining skill points prominently

### Hero Assignment
When clicking "Assign" on a hero:
- Show list of all units in roster
- Units already assigned to another hero are marked
- Clicking a unit assigns the hero
- If the unit already had a different hero, swap them (or unassign the old one)
- When assigning, equipment slots on the unit unlock
- When unassigning, equipment on that unit returns to inventory

---

## Part F: Team Builder Integration

In the team builder:
- Show which units have heroes equipped (hero emoji/indicator on unit card)
- Show hero name and level on deployed unit info panel
- When hovering/clicking a deployed unit, show active hero skill bonuses
- Units without heroes show "No Hero" indicator

---

## Implementation Notes

- Add `<script src="js/heroes.js"></script>` to `game-v2.html` AFTER `units-ascension.js` and BEFORE `save.js`
- The hero system is independent of the item system — this prompt does NOT modify items. Items will be reworked in prompt 30.
- For now, heroes simply add stat bonuses and enable item equipping (the item equip check is: `if (getHeroForUnit(saveData, unitId))`)
- B's death and the group split are triggered by specific stage completions. Use stage IDs from `STAGES` in `missions.js` to identify the triggers.
- Heroes are story characters — their names in this prompt are placeholders (A, B, Kael, etc.). They'll be renamed when the story is finalized.
- Commit when done and the game loads without console errors.

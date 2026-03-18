# V2 Session 2: Element Synergies + Team Builder UI Improvements

## Context
This is a browser-based gacha auto-battler game (V2). Plain JavaScript, global scope, NO ES modules. All files load via `<script>` tags in `game-v2.html`.

**Read these files first:**
- `DESIGN-V2.md` — Full game design
- `game-v2.html` — HTML shell, CSS, script tags
- All JS files loaded by game-v2.html (check the `<script>` tags at the bottom for load order)
- `js/units.js` — Pay special attention to ELEMENTS and ARCHETYPES definitions

**Current load order:**
```
js/units.js → js/save.js → js/gacha.js → js/teams.js → js/hub.js → js/missions.js → js/ui-v2.js → js/main-v2.js
```

Note: `synergies.js` and `combat.js` (V1) are NOT loaded. V2 has its own combat and synergy logic in `main-v2.js` + `teams.js`.

---

## TASK 1: Implement Element Synergy System

### Problem
Currently elements only affect the rock-paper-scissors damage multiplier (1.3x strong, 0.7x weak). There are NO element threshold bonuses like archetypes have. If a player fields 3 Water units, they see "Water: 3" in the synergy preview but get nothing for it. This feels broken.

### Design: Unique bonuses per element at thresholds of 2 and 4

Define element synergies in `js/units.js` (add to the ELEMENTS object or create a new ELEMENT_SYNERGIES object nearby):

| Element | Threshold | Bonus |
|---------|-----------|-------|
| Fire 🔥 | 2 | All allies deal 15 burn damage per attack (flat, on top of normal damage) |
| Fire 🔥 | 4 | Burn damage increases to 40. On kill, deal 50 AoE damage to all enemies |
| Water 💧 | 2 | Enemy attack speed reduced by 15% (slow debuff applied at combat start) |
| Water 💧 | 4 | Enemy attack speed reduced by 30%. Allies heal 2% max HP per second |
| Earth 🌿 | 2 | All allies gain a shield equal to 15% of their max HP at combat start |
| Earth 🌿 | 4 | Shield increases to 30% max HP. Allies gain +10% damage reduction |
| Wind 💨 | 2 | All allies gain +15% attack speed |
| Wind 💨 | 4 | Attack speed bonus increases to 30%. Allies dodge 15% of attacks |

### Implementation Details

1. **Define the data** in `js/units.js` — add an `ELEMENT_SYNERGIES` object with thresholds and bonus descriptions, similar to how `ARCHETYPES` works.

2. **Apply bonuses in combat** in `js/main-v2.js` — in the `applySynergyBonuses` function (or a new `applyElementBonuses` function called from `initCombat`), check element counts and apply the bonuses:
   - Fire burn: Add a `burnDamage` property to player units. In `performAttack`, add burn damage on top of normal damage. For the 4-tier kill AoE, check if target died and apply AoE.
   - Water slow: Multiply enemy `attackSpd` by 1.15 or 1.30 (higher = slower) at combat start. For heal, add `regenPerSec` to allies and process in `combatTick`.
   - Earth shield: Set `shield` on all allies at combat start. For damage reduction, add `damageReduction` property and apply in `performAttack`.
   - Wind speed: Divide ally `attackSpd` by 1.15 or 1.30 (lower = faster). For dodge, add `dodgeChance` and check in `performAttack`.

3. **Display in synergy preview** — update `previewTeamSynergies` in `js/teams.js` and `renderTeamSynergyPreview` in `js/ui-v2.js` to show element synergy bonuses alongside archetype synergies.

---

## TASK 2: Team Builder — Show Unit Stats in Roster Panel

### Problem
The team builder roster panel on the left only shows unit name and element emoji. Players can't see HP, ATK, type, or archetype without hovering (tooltip). This makes team building feel blind.

### Solution
Expand each roster panel item to show more info inline. Each item should display:
- Element emoji + Archetype emoji + Name + Stars
- Below: Type label (e.g. "Tank") · HP: X · ATK: Y
- Stats should be scaled by the unit's current star level

Keep items compact (2 lines max) since the panel is only 200px wide. The existing tooltip on hover is fine to keep as a bonus.

---

## TASK 3: Synergy Sidebar in Team Builder

### Problem
The synergy preview at the bottom of the team builder is too minimal. It just lists active synergies by name and count. Players don't know what the bonuses actually do.

### Solution
Replace the small `team-synergy-preview` div with a proper sidebar or expanded panel that shows:

**Archetype Synergies:**
For each archetype the player has units for, show:
- Archetype emoji + name + count/threshold (e.g. "🛡️ Guardian 2/4")
- Current tier bonus description (e.g. "+150 HP to all units")
- Visual indicator: highlight active thresholds, grey out unmet ones
- Show inactive archetypes (count > 0 but below threshold) in grey

**Element Synergies:**
Same format as archetypes:
- Element emoji + name + count/threshold (e.g. "💧 Water 3/4")
- Current tier bonus description (e.g. "Enemy attack speed -15%")
- Active/inactive visual distinction

Layout suggestion: Put the synergy panel below the board grid (where it currently is) but make it taller and more detailed. Or put it to the right of the board if there's room. The key is that players can read what each synergy actually DOES without guessing.

---

## TASK 4: Synergy Display During Combat

### Problem
During combat, there's no indication of which synergies are active. The player can't tell if their element/archetype bonuses are working.

### Solution
Add a compact synergy bar above or below the combat board (similar to TFT's synergy bar on the left side). Show:
- Active archetype synergies with emoji + count (only active ones)
- Active element synergies with emoji + count (only active ones)
- Keep it compact — single row, horizontal layout

---

## Code Quality Notes

- All JS uses `var` (not let/const)
- All functions global scope, no modules
- State is in global `saveData`, accessed via `getSaveData()`
- Call `autoSave(saveData)` after mutations
- Unit data comes from `units.js`: `UNIT_TEMPLATES`, `ELEMENTS`, `ARCHETYPES`, `SHOP_POOL_KEYS`, `getStarMultiplier()`, `getElementMultiplier()`
- The combat engine is in `main-v2.js` (NOT in combat.js which is a V1 file not loaded)

---

## Testing Checklist
1. [ ] Reset game, roll some units, build a team with 2+ of the same element
2. [ ] Team builder synergy panel shows both archetype AND element synergies with bonus descriptions
3. [ ] Roster panel items show type, HP, ATK inline
4. [ ] Start a mission — combat synergy bar shows active bonuses
5. [ ] Fire synergy: verify burn damage appears in combat (units should deal extra flat damage)
6. [ ] Water synergy: verify enemies attack slower
7. [ ] Earth synergy: verify allies start with shields (visible on HP bars)
8. [ ] Wind synergy: verify allies attack faster
9. [ ] All existing functionality still works (gacha, missions, save/load, star-up)

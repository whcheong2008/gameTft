# Prompt 05 — Wire Up Building Bonuses + Evolution System

## Context

You're working on a browser-based gacha auto-battler game (V2). The codebase uses **modular JS via global scope** — NO ES modules, NO import/export. All files are loaded via `<script>` tags in `game-v2.html`.

**Load order**: `units.js → save.js → gacha.js → teams.js → hub.js → missions.js → ui-v2.js → main-v2.js`

The game has 5 upgradable buildings defined in `hub.js` with helper functions (`getMultiRollDiscount`, `getXPMultiplier`, `getGoldMultiplier`, `getWarRoomIntelLevel`). Some are already wired, some aren't. The game also has 16 evolution paths defined in `units.js` (`EVOLUTIONS` object, `checkEvolution` function, `EVOLVED_TEMPLATES`) that are NOT connected to V2 at all.

---

## Task 1: Wire Up Summoning Circle Discount

**File**: `js/gacha.js`

The `doMultiRoll()` function uses a hardcoded `MULTI_ROLL_COST = 45`. It should apply the Summoning Circle discount from `hub.js`.

**Fix**:
- In `doMultiRoll(saveData)`, calculate actual cost as `MULTI_ROLL_COST - getMultiRollDiscount(saveData)` (the function returns 0/5/8/10 based on building level)
- Also update `getMultiRollCost()` to accept saveData and return the discounted cost
- Update `renderGachaScreen()` in `ui-v2.js` to show the discounted cost on the multi-roll button and disable check

**Summoning Circle levels 4–5** also define a pity system:
- Level 4: Guaranteed cost 3+ unit every 20 rolls
- Level 5: Guaranteed cost 4+ unit every 30 rolls

To implement pity:
- Add `rollsSincePity` counter to saveData (in `createDefaultSaveData` add `stats.rollsSincePity: 0`)
- Increment in `doSingleRoll` and `doMultiRoll`
- When pity threshold is reached, override the next roll's minimum tier
- Reset counter after pity triggers

---

## Task 2: Wire Up War Room Intel

**File**: `js/ui-v2.js` → `renderMissionSelectScreen()`

The War Room building reveals enemy info before deploying. `getWarRoomIntelLevel(saveData)` returns 0–3.

**What to show on mission cards based on intel level**:
- **Level 0**: No extra info (current behavior)
- **Level 1**: Show enemy unit count per wave (e.g., "Wave 1: 3 enemies, Wave 2: 4 enemies")
- **Level 2**: Show enemy unit types and elements (generate enemies via `generateMissionWave` to peek, or show the wave config's maxCost/count)
- **Level 3**: Show full enemy preview (names, elements, types)

**Important**: For levels 2–3, you'll need to generate the enemy waves to show a preview. Since `generateMissionWave` is random, seed it or just show the wave config parameters (budget/maxCost/count) as a simpler approach. Recommended: show wave config info (budget, max cost, unit count) rather than pre-generating enemies, since the actual enemies are random.

---

## Task 3: Wire Up Evolution System

**Files**: `js/teams.js`, `js/main-v2.js`, `js/ui-v2.js`

The `EVOLUTIONS` object in `units.js` maps base units to evolved forms with criteria like `{ stars: 3 }` or `{ stars: 2, synergy: 'sage', count: 2 }`. The `checkEvolution(unit, gs)` function transforms a unit in-place if criteria are met. **This is not called anywhere in V2.**

### Where to check evolution:

**A) At combat start** — in `startMissionCombat()` in `ui-v2.js` (after `updateActiveSynergies(gs)` and before `initCombat(gs)`):
1. After synergies are calculated from the deployed board, iterate over all player units on the board
2. For each unit, call `checkEvolution(unit, gs)` — this checks star level and synergy counts
3. If a unit evolves, it transforms in-place (stats, name, emoji, abilities all change)
4. This means evolutions happen per-mission based on the team composition (same as V1 checking on round start)

**B) Show evolution potential in team builder** — in `renderTeamBuilderScreen()`:
1. When rendering roster cards in the team-roster-panel, check if a unit has an evolution path (`EVOLUTIONS[key]`)
2. Show the evolution criteria and whether they'd be met with the current team
3. Use `previewTeamSynergies()` to get current synergy counts
4. Example: "→ Fire Berserker (need ⭐3, have ⭐1)" or "→ Volcano Titan (need 4 Guardian, have 2)"
5. If criteria ARE met, highlight it: "→ Fire Berserker ✓ WILL EVOLVE"

**C) Show evolved status during combat** — in `renderCombatUnitCell()`:
1. If `unit.evolved === true`, add a visual indicator (glow border, ✨ icon, or different cell background)

### Evolution criteria reference:
- Stars-only: flame_warrior(3), ember_scout(3), tide_hunter(3), frost_archer(3), stone_guard(3), zephyr_scout(3), wind_archer(3)
- Synergy-only: magma_knight(guardian 4), coral_priest(sage 4), vine_archer(predator 4), sky_knight(guardian 4)
- Stars + synergy: pyromancer(2★ + sage 2), hydro_mage(2★ + mystic 2), earth_shaman(2★ + sage 2), storm_mage(2★ + mystic 2), golem(2★ + guardian 4)

---

## Task 4: Show Building Bonus Feedback

**File**: `js/ui-v2.js`

Currently buildings show their effect text but the player doesn't see the bonuses in action. Add feedback:

1. **Gacha screen**: Show "Multi-Roll: Xg (was 50g)" if Summoning Circle discount is active. Show pity counter if pity system is active (e.g., "Pity in X rolls").

2. **Mission results screen** (`showMissionResults`): Show bonus breakdown if Training Ground or Warehouse give bonuses.
   - e.g., "Gold: 100 (+15% from Warehouse)" and "XP: 180 (+20% from Training Ground)"
   - `getGoldMultiplier` and `getXPMultiplier` already return the multiplier, so compare base vs boosted

3. **Team builder**: Show "Team Size: X / Y" where Y includes barracks bonus (this already works via `getMaxTeamSize`, just verify it's correct)

---

## Code Quality Notes

- Keep all functions in global scope (no ES modules)
- Use `var` not `let`/`const`
- All new saveData fields need migration support in `save.js` — add them to `createDefaultSaveData()` and add a migration check in `loadGame()` for saves that lack the new field
- Test that existing saves don't break when new fields are added
- `checkEvolution` modifies the unit in-place and returns true/false — don't create a new unit

---

## Testing Checklist

- [ ] Build Summoning Circle to level 1+ → multi-roll cost decreases
- [ ] Build Summoning Circle to level 4+ → pity system triggers after 20 rolls
- [ ] Build War Room to level 1 → mission cards show enemy count
- [ ] Build War Room to level 3 → mission cards show full enemy details
- [ ] Get a unit to 3 stars → deploy to mission → unit evolves if criteria met
- [ ] In team builder, evolution criteria shown on eligible units
- [ ] Evolved units show visual indicator in combat
- [ ] Mission results show building bonus breakdown
- [ ] Old saves still load correctly after changes (no crash on missing fields)
- [ ] Reset game → fresh save has all new default fields

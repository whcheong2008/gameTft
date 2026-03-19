# Prompt 31: Progression Rework — Single-Player Economy & Naming

## Overview

This prompt implements the complete progression economy rework described in `PROGRESSION-REWORK.md`. The changes are extensive but orthogonal — they do not affect combat mechanics, abilities, or the item system (which has its own rework in progress). All variables follow the **global scope, no ES6 pattern**: `var`, no `import`/`export`.

The key changes:
1. **Currency rename**: "gold" → "Veil Essence" (VE) in all user-facing strings. Internal variable names stay `gold` for backward compatibility.
2. **Roll costs**: 50 VE per single, 450 VE per 10-rite (from ~5g and 45g).
3. **Tiered star-up costs**: T1=3, T2=4, T3=5, T4=8, T5=10 copies per star (from flat 10).
4. **Team size progression**: Start 3, +1 at levels 4/8/12/16, Sustained Bonds upgrade at L17 → max 8 (was start 2, +1 every 2 levels, max 9).
5. **Hub → Camp**: All "Hub" text becomes "Camp". Buildings renamed to camp practices.
6. **Gacha rate tables**: Level-based T5 entry at L15 (2%), cap 10% at L20.
7. **Mission rewards**: Scale VE per stage by region (R1: 200 VE/stage through R8: 2000 VE/stage).
8. **Unit drop tier weights**: By region, not player level.
9. **Removed systems**: Stamina, gems/premium currency, daily quests, weekly quests.
10. **Save migration**: v9 → v10. Rename gold → veilEssence in display, recalculate star-up costs.
11. **Echo release (unit selling)**: T1=5, T2=10, T3=20, T4=50, T5=100 VE.
12. **Various cost updates**: Enhancement (50-500 VE), evolution (500-2000 VE), forge (100-2000 VE), ascension (1000/2500/5000 VE).

---

## File-by-File Changes

### 1. `/sessions/epic-inspiring-thompson/mnt/Game TFT/js/save.js`

**Changes:**

1. **Bump SAVE_VERSION to 10.**

2. **Rename gold → veilEssence in createDefaultSaveData():**
   - Change `player.gold: 500` to `player.veilEssence: 500`
   - Keep internal display variable naming for backward compat in helpers.

3. **Add stats fields for VE tracking:**
   - `stats.totalVeilEssenceEarned` (was totalGoldEarned)
   - `stats.totalVeilEssenceSpent` (was totalGoldSpent)

4. **Update helper functions:**
   - `spendGold(saveData, amount)` → Check `player.veilEssence` and deduct.
   - `earnGold(saveData, amount)` → Add to `player.veilEssence` and `stats.totalVeilEssenceEarned`.
   - Update comments and console.log messages to reference "Veil Essence" or "VE" instead of "gold".

5. **Add save migration v9 → v10:**
   - If save is v9, rename `player.gold` to `player.veilEssence`.
   - Rename `stats.totalGoldEarned` to `stats.totalVeilEssenceEarned`.
   - Rename `stats.totalGoldSpent` to `stats.totalVeilEssenceSpent`.
   - Update all references to `buildings.barracks` etc. in team size getter to use new system.

6. **Update getMaxTeamSize():**
   - New formula: Start at 3 (not 2).
   - +1 at levels 4, 8, 12, 16 = 7 at L16.
   - Sustained Bonds upgrade (replaces Barracks, renamed): requires L17 and building level.
   - Max team size = 8 (not 9).
   - Calculate as:
     ```javascript
     var baseSlots = 3; // start
     if (saveData.player.level >= 4) baseSlots++;
     if (saveData.player.level >= 8) baseSlots++;
     if (saveData.player.level >= 12) baseSlots++;
     if (saveData.player.level >= 16) baseSlots++;
     // Sustained Bonds (replaces Barracks at L17+)
     var sustainedBondsBonus = 0;
     if (saveData.player.level >= 17) {
         var sustainedBondsLevel = saveData.buildings && saveData.buildings.sustained_bonds ? saveData.buildings.sustained_bonds : 0;
         if (sustainedBondsLevel >= 1) sustainedBondsBonus = 1;
     }
     return Math.min(8, baseSlots + sustainedBondsBonus);
     ```

7. **Update SellValue/Echo Release prices:**
   - Create new constant or function `function getEchoReleaseValue(templateKey)` that returns tier-based VE:
     - T1 units: 5 VE per copy
     - T2 units: 10 VE per copy
     - T3 units: 20 VE per copy
     - T4 units: 50 VE per copy
     - T5 units: 100 VE per copy
   - Update `sellUnitCopies()` to use this.

8. **Update star-up cost system:**
   - Replace `COPIES_PER_STAR = 10` with a tiered function:
     ```javascript
     function getCopiesPerStar(templateKey) {
         var tmpl = UNIT_TEMPLATES[templateKey] || EVOLVED_TEMPLATES[templateKey];
         if (!tmpl) return 10;
         var tier = tmpl.cost;
         switch(tier) {
             case 1: return 3;
             case 2: return 4;
             case 3: return 5;
             case 4: return 8;
             case 5: return 10;
             default: return 10;
         }
     }
     ```
   - Update `canStarUp()` and `starUpUnit()` to use `getCopiesPerStar(templateKey)` instead of `getStarUpCost()`.

9. **Update migration to recalculate existing collection entries:**
   - In the v9→v10 migration, loop through all collection entries and recalculate `copiesForNext` based on their tier's new cost. This ensures a unit at 10 copies under the old system doesn't auto-star up under the new tiered system if 10 is below the new tier cost.
   - Example: T1 unit at 10 copies (1 star, 7 left for next) becomes 1 star, 7 copies toward next (need only 3 total, so 1 level closer to the new 2★).

---

### 2. `/sessions/epic-inspiring-thompson/mnt/Game TFT/js/gacha.js`

**Changes:**

1. **Update roll costs:**
   - Change `ROLL_COST = 5` to `ROLL_COST = 50`.
   - Change `MULTI_ROLL_COST = 45` to `MULTI_ROLL_COST = 450`.

2. **Update gacha rate tables (TIER_WEIGHTS):**
   - Replace the current table with the level-based rates from PROGRESSION-REWORK.md:
     ```javascript
     var TIER_WEIGHTS = {
         1:  [75, 25, 0,  0,  0],  // T1/T2 only
         3:  [60, 35, 5,  0,  0],  // T1/T2/T3
         5:  [45, 38, 17, 0,  0],  // T1-T3
         7:  [35, 33, 32, 0,  0],  // T1-T3
         9:  [28, 28, 38, 6,  0],  // T1-T4
         11: [22, 25, 40, 13, 0],  // T1-T4
         13: [18, 22, 38, 22, 0],  // T1-T4
         15: [15, 18, 35, 30, 2],  // T1-T5 enters at 2%
         17: [12, 15, 30, 37, 6],  // T1-T5
         19: [10, 12, 25, 43, 10], // T1-T5
         20: [8,  10, 22, 50, 10]  // T1-T5, T5 caps at 10%
     };
     ```
   - For levels 2, 4, 6, 8, 10, 12, 14, 16, 18: interpolate or use the closest lower level's rates.

3. **Ensure getTierWeights() handles all levels 1-20:**
   - Keep the function as-is (it already clamps to 1-20). It will pick the exact level or the nearest lower level.

4. **Update any gold-related text in comments/console to reference VE.**

---

### 3. `/sessions/epic-inspiring-thompson/mnt/Game TFT/js/hub.js`

**Changes:**

1. **Rename all "Hub" references to "Camp":**
   - Building descriptions, UI labels, screen titles.
   - Update BUILDINGS object keys:
     - `barracks` → `sustained_bonds` (team size upgrade, replaces Barracks)
     - `summoning_circle` → `attunement_rite`
     - `warehouse` → `essence_reservoir`
     - `evolution_lab` → `deep_resonance`
     - `forge` → `echo_shaping`
     - `gem_workshop` → `prism_focus`
     - `mana_shrine` → `veil_wellspring`
     - `bond_hall` → `kindred_circle`

2. **Update building names and descriptions:**
   ```javascript
   var BUILDINGS = {
       sustained_bonds: {
           name: 'Sustained Bonds',
           emoji: '🤝', // or similar
           description: 'Increases team size capacity',
           maxLevel: 1, // Only upgrade once at L17
           upgradeCosts: [0, 500], // costs indexed by level
           effects: ['Locked — unlocked at level 17', 'Team size +1 (max 8)'],
           prereq: { level: 17 }
       },
       attunement_rite: {
           name: 'Attunement Rite',
           emoji: '🔮',
           description: 'Summon Echoes from the Veil',
           maxLevel: 5,
           upgradeCosts: [0, 80, 200, 400, 800, 1500],
           effects: [
               'Standard rite rates',
               'Multi-rite: 10x for 450 VE (10% discount)',
               'Multi-rite: 10x for 420 VE (16% discount)',
               'Multi-rite: 10x for 400 VE (20% discount)',
               'Pity: guaranteed T3+ every 20 rites',
               'Pity: guaranteed T4+ every 30 rites'
           ]
       },
       essence_reservoir: {
           name: 'Essence Reservoir',
           emoji: '💧',
           description: 'Store and manage harvested Veil Essence',
           maxLevel: 5,
           upgradeCosts: [0, 50, 120, 300, 600, 1000],
           effects: [
               'Standard VE rewards',
               '+5% VE from missions, 12 item slots',
               '+10% VE, 14 item slots',
               '+15% VE, 16 item slots',
               '+20% VE, 18 item slots',
               '+25% VE, 20 item slots'
           ]
       },
       deep_resonance: {
           name: 'Deep Resonance',
           emoji: '🧬',
           description: 'Evolve Echoes into powerful new forms',
           maxLevel: 3,
           upgradeCosts: [0, 300, 800, 2000],
           effects: [
               'Locked — build to unlock evolution',
               'Can evolve units (500-2000 VE by tier)',
               'Evolution cost reduced by 25%',
               'Evolution cost reduced by 50%'
           ]
       },
       echo_shaping: {
           name: 'Echo Shaping',
           emoji: '🔨',
           description: 'Reshape Veil energy within items',
           maxLevel: 5,
           upgradeCosts: [0, 200, 500, 1000, 2000, 4000],
           effects: [
               'Locked — build to unlock forging',
               'Reroll: change item rarity (100 VE)',
               'Disassemble: break combined items (50 VE)',
               'Transmute: convert components (200 VE)',
               'Set Crafting: forge set items (500-1000 VE)',
               'Advanced Crafting: ability items + evolved gates (1000-2000 VE)'
           ]
       },
       prism_focus: {
           name: 'Prism Focus',
           emoji: '💎',
           description: 'Craft and socket crystallized Veil gems',
           maxLevel: 5,
           upgradeCosts: [0, 500, 1200, 2500, 5000, 10000],
           effects: [
               'Locked — unlocks gem operations',
               'Gem inventory + gem socketing',
               'Gem combining (3→1) + removal',
               'Gem transmute (change type, keep rarity)',
               'Auto-socket suggestion',
               'Prismatic Forge: combine 3 Epic gems → Prismatic'
           ],
           prereq: { level: 12 }
       },
       veil_wellspring: {
           name: 'Veil Wellspring',
           emoji: '🔵',
           description: 'Channel ambient Veil power for mana and ability',
           maxLevel: 5,
           upgradeCosts: [0, 800, 2000, 4000, 8000, 15000],
           effects: [
               'Locked — unlocks mana bonuses',
               '+5 starting mana for all units',
               'Mana generation from attacks +10%',
               'Ability damage +5% (global)',
               'First ability cast costs 10% less mana',
               'Full mana bar grants +10% ATK until cast'
           ],
           prereq: { level: 15 }
       },
       kindred_circle: {
           name: 'Kindred Circle',
           emoji: '👥',
           description: 'Where bonded Echoes train together',
           maxLevel: 5,
           upgradeCosts: [0, 600, 1500, 3500, 7000, 12000],
           effects: [
               'Locked — unlocks bond viewer',
               'View active bonds and bonuses',
               'Bond bonuses increased by 25%',
               'Unlock bond quests (extra VE)',
               'Bond bonuses increased by 50% total',
               'Unlock trio bonds (3-unit bonds active)'
           ],
           prereq: { level: 10 }
       }
   };
   ```

3. **Update function names and references:**
   - `getGoldMultiplier()` → `getVeilEssenceMultiplier()` or rename to `getEssenceReservoirBonus()`.
   - Update internal references: any `getBuildingLevel(saveData, 'barracks')` → `getBuildingLevel(saveData, 'sustained_bonds')`, etc.
   - All gold references in bonus functions → VE.

4. **Update Sustained Bonds bonus getter:**
   - Replace Barracks bonus logic with:
     ```javascript
     function getSustainedBondsBonus(saveData) {
         if (saveData.player.level < 17) return 0;
         var level = getBuildingLevel(saveData, 'sustained_bonds');
         return level >= 1 ? 1 : 0;
     }
     ```

5. **Remove daily quest system references:**
   - Delete any dailyQuests data or functions.
   - Update achievement checks to not reference daily quests.

6. **Update achievement rewards:**
   - Change reward.gold → reward.veilEssence in ACHIEVEMENTS array.
   - Update achievement descriptions to match new systems (e.g., "Spend 10,000 VE").

---

### 4. `/sessions/epic-inspiring-thompson/mnt/Game TFT/js/units-core.js`

**Changes:**

1. **Update getMaxTeamSize() call sites:**
   - In this file, if there are any references to team size calculation, ensure they use the new system from save.js.

2. **Update cost references in comments:**
   - Change "gold" → "VE" in comments related to gold costs.

3. **No changes to star multiplier or unit creation logic** — those remain the same. The tiered star-up cost is handled in save.js.

---

### 5. `/sessions/epic-inspiring-thompson/mnt/Game TFT/js/missions.js`

**Changes:**

1. **Update mission reward structure:**
   - Each mission now returns VE based on region and stage, not a percentage multiplier.
   - Base VE per stage by region (from PROGRESSION-REWORK.md):
     ```javascript
     var MISSION_VE_PER_STAGE = {
         1: 200,   // R1
         2: 350,   // R2
         3: 550,   // R3
         4: 750,   // R4
         5: 1000,  // R5
         6: 1300,  // R6
         7: 1600,  // R7
         8: 2000   // R8
     };
     ```
   - For mission generation, look up the region from mission ID and return the base VE (no scaling by Warehouse multiplier — that's applied at reward time).

2. **Update mission unit drop tier weights by region (not player level):**
   - Create a new table:
     ```javascript
     var MISSION_TIER_WEIGHTS_BY_REGION = {
         1: [70, 30, 0,  0,  0],   // R1: T1/T2
         2: [50, 40, 10, 0,  0],   // R2: T1-T3
         3: [30, 35, 35, 0,  0],   // R3: T1-T3
         4: [15, 25, 45, 15, 0],   // R4: T1-T4
         5: [5,  15, 40, 35, 5],   // R5: T1-T5
         6: [5,  10, 30, 40, 15],  // R6: T1-T5
         7: [0,  5,  20, 45, 30],  // R7: T2-T5
         8: [0,  0,  15, 45, 40]   // R8: T3-T5
     };
     ```
   - When generating mission rewards, extract the region from the mission ID and use the region-specific weights, not player level.

3. **Update reward calculation:**
   - Calculate mission VE reward as: `baseVE = MISSION_VE_PER_STAGE[region]`
   - Apply Warehouse bonus: `final VE = baseVE * getVeilEssenceMultiplier(saveData)` (or similar).
   - Update unit drop tiers to use region-based weights.

4. **Update any gold references in mission names/descriptions to VE.**

---

### 6. `/sessions/epic-inspiring-thompson/mnt/Game TFT/js/items.js`

**Changes:**

1. **Update cost descriptions in item/forge operations:**
   - Change any "gold" text → "VE".
   - Costs already use numeric values; update helper text.

2. **Update essence/material drops:**
   - If essence drops are tied to mission rewards, ensure they're calculated off the VE reward, not gold.

---

### 7. `/sessions/epic-inspiring-thompson/mnt/Game TFT/game-v2.html`

**Changes:**

1. **Update all UI text:**
   - "Hub" → "Camp"
   - "Gold" → "Veil Essence" or "VE"
   - Replace any coin emoji (💰) with a more appropriate symbol if desired (e.g., ✨ or custom icon).

2. **Update building names in all screens:**
   - Team builder, roster, hub screen, etc.

3. **Update mission reward displays:**
   - Show VE earned per mission.

4. **Update gacha display:**
   - Show "Rite cost: 50 VE" or "10-rite: 450 VE".

---

### 8. `/sessions/epic-inspiring-thompson/mnt/Game TFT/js/ui-v2.js` (or equivalent UI file)

**Changes:**

1. **Update renderHubScreen():**
   - Change title from "Hub" to "Camp".
   - Update building panel titles and descriptions.
   - Update gold display → VE display.
   - Update building upgrade buttons to show VE costs.

2. **Update renderGachaScreen():**
   - Change "Single Roll" cost display: "50 VE".
   - Change "10x Roll" cost display: "450 VE" (before discount).
   - Apply multi-roll discount from Attunement Rite level.

3. **Update renderMissionSelectScreen():**
   - Display mission VE rewards.
   - Show region-based drops (not level-based).

4. **Update renderRosterScreen():**
   - Display unit selling values in VE (based on tier).
   - Update copy counts to reference tiered star-up costs.

5. **Update renderTeamBuilderScreen():**
   - Update any team size UI to reflect new progression.
   - Show max team size based on player level + Sustained Bonds upgrade.

6. **Update all currency displays** to use "VE" or "Veil Essence" instead of "Gold".

---

## Verification Checklist

After implementing all changes, verify:

1. **Save System:**
   - [ ] New saves start with 500 VE.
   - [ ] Existing saves (v9) migrate: gold → veilEssence, stats renamed.
   - [ ] Star-up costs recalculated for existing collection (no accidental free-ups or locks).

2. **Currency:**
   - [ ] All UI shows "VE" or "Veil Essence" instead of "Gold".
   - [ ] spendGold/earnGold still work (renamed internally to veilEssence).
   - [ ] VE totals display correctly in hub.

3. **Team Size:**
   - [ ] Start with 3 units at L1.
   - [ ] +1 at L4, L8, L12, L16 (7 at L16).
   - [ ] Sustained Bonds upgrade adds +1 at L17 (max 8).
   - [ ] Old Barracks building is gone; Sustained Bonds replaces it.

4. **Gacha:**
   - [ ] Single roll costs 50 VE.
   - [ ] 10-rite costs 450 VE (before Attunement Rite discount).
   - [ ] T5 first appears at L15 with 2% rate.
   - [ ] T5 caps at 10% at L20.
   - [ ] Tier weights interpolate correctly for levels 2, 4, 6, etc.

5. **Star-up Costs:**
   - [ ] T1 units cost 3 copies/star.
   - [ ] T2 units cost 4 copies/star.
   - [ ] T3 units cost 5 copies/star.
   - [ ] T4 units cost 8 copies/star.
   - [ ] T5 units cost 10 copies/star.

6. **Missions:**
   - [ ] R1 missions give 200 VE/stage.
   - [ ] R8 missions give 2000 VE/stage.
   - [ ] Unit drops use region-based tier weights (not player level).

7. **Buildings:**
   - [ ] Attunement Rite (summoning) works as before, shows VE costs.
   - [ ] Essence Reservoir (warehouse) shows VE bonuses.
   - [ ] Deep Resonance (evolution) shows VE costs.
   - [ ] Echo Shaping (forge) shows VE costs.
   - [ ] Prism Focus, Veil Wellspring, Kindred Circle renamed and functional.
   - [ ] Sustained Bonds unlocks at L17, costs 500 VE, grants +1 team size.

8. **Unit Selling (Echo Release):**
   - [ ] T1 units sell for 5 VE per copy.
   - [ ] T5 units sell for 100 VE per copy.

9. **Combat:**
   - [ ] No changes to combat logic or abilities.
   - [ ] Stats, damage, synergies work as before.

10. **Performance & Stability:**
    - [ ] No console errors on save migration.
    - [ ] No UI broken elements.
    - [ ] Game plays through a mission without crashes.

---

## Notes

- **Backward Compatibility:** All internal variable names (`player.veilEssence` read by `gold` variable in helpers) should be transparent to existing code. The `spendGold`/`earnGold` functions work the same way, just operate on a renamed field.
- **No Combat Changes:** This prompt does NOT touch combat.js, mana, abilities, or status effects. Those are handled separately.
- **No Item Rework:** This prompt does NOT change the item system structure (that's prompt 30).
- **No Stage Expansion:** The 47 → 74 stage count is handled by a separate prompt. This prompt assumes missions.js is already returning correct region info.
- **Pattern:** All code uses global scope, no ES6 modules. No `import`/`export`.

---

## Implementation Order

1. Start with save.js (version bump, migration, helpers).
2. Update gacha.js (roll costs, tier weights).
3. Update hub.js (building rename, bonus getters).
4. Update units-core.js (getMaxTeamSize references, if any).
5. Update missions.js (VE rewards, tier-weighted drops).
6. Update items.js (cost descriptions).
7. Update game-v2.html and ui-v2.js (UI text, displays).
8. Test a fresh game and a migrated save.
9. Verify all checklist items pass.

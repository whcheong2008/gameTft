# Prompt 24 — UI Wiring & Quality-of-Life Fixes

> **Purpose**: Wire all orphaned Phase 4/5 backend systems into the UI, and apply several QoL improvements. After this prompt, every implemented system should be accessible and usable by the player.
>
> **Branch**: Work on `main` directly (or create `feature/ui-wiring` if you prefer).
>
> **Pattern**: All `var`, global scope, NO ES modules, NO import/export. Match existing code style.
>
> **Files you'll primarily modify**: `ui-v2.js`, `game-v2.html`, `hub.js`, `main-v2.js`
>
> **Read before starting**: Skim `ui-v2.js` to understand the existing rendering patterns (renderHubScreen, renderMissionSelectScreen, renderTeamBuilderScreen, etc). The game uses inline styles and direct DOM manipulation — follow that pattern.

---

## Part A: Region Map UI

**Current state**: `renderMissionSelectScreen()` in `ui-v2.js` shows all 47 stages as a flat scrollable list. `REGIONS` in `missions.js` defines 8 regions with names, subtitles, stage lists, and rewards — but nothing in the UI uses it.

**Target**: Replace the flat mission list with a two-level UI: Region selector → Stage list.

### Region Selector Screen
When the player clicks "Missions" from the hub, show a **region map** (list of 8 regions):
- Each region is a card/row showing: region number, name, subtitle, completion progress (e.g., "4/6 stages"), boss status (cleared/not), and lock status
- Regions are unlocked sequentially: Region N+1 unlocks when Region N boss is cleared (check `saveData.missions.regionProgress[N].bossCleared`)
- Region 1 is always unlocked
- Locked regions are visually grayed out and not clickable
- Cleared regions show a ✓ or green indicator
- Each region card shows the **region reward** description (from `REGIONS[n].reward.description`)
- A "Claim Reward" button appears on regions where all stages are complete AND reward not yet claimed (check `saveData.missions.regionRewardsClaimed`)

### Stage List Screen
When the player clicks a region, show stages for that region:
- Back button to return to region selector
- Region name as header
- Each stage card shows: stage name, level requirement, lock requirements (if any), wave count, star rating (if completed), and rewards preview
- Stages with unmet locks are grayed out with lock requirement shown (e.g., "Requires: 2 Guardians")
- Boss stages are visually distinct (border, label, or color)
- Clicking a stage opens the existing mission deployment flow (pre-combat team select → combat)
- **Grind missions**: Add a "Grind" button/tab at the bottom of the region screen that opens the existing grind mission flow

### Region Reward Claiming
When the player claims a region reward:
- Call a function to grant the reward (gold, free rolls, random units, essences, mythic materials — based on `REGIONS[n].reward`)
- Add region number to `saveData.missions.regionRewardsClaimed`
- Show a simple reward summary
- Auto-save

---

## Part B: New Building Panels

**Current state**: `gem_workshop`, `mana_shrine`, and `bond_hall` are defined in `BUILDINGS` in `hub.js` with bonus getter functions, but the hub screen renders them as plain static cards with no click interaction. The existing buildings `evolution_lab` and `forge` have dedicated panels — use those as the pattern.

### Gem Workshop Panel
When clicking the Gem Workshop card in the hub:
- Show current level and upgrade option (like other buildings)
- Show capabilities unlocked at current level:
  - L1: Socket gems onto items
  - L2: Combine 3 same-type gems → next rarity, Remove socketed gems
  - L3: Transmute gems (swap type)
  - L4: Auto-socket recommendation
  - L5: Prismatic forge (craft prismatic gems)
- **Gem socketing UI**: Show the item bench. Clicking an item with a socket shows available gems. Clicking a gem sockets it. Use `getGemWorkshopCapabilities()` to gate operations.
- For gem combine/remove/transmute, use simple button-based flows

### Mana Shrine Panel
When clicking the Mana Shrine card:
- Show current level and upgrade option
- Show bonuses at current level (from `getManaShrineBonuses()`):
  - L1: +5 starting mana for all units
  - L2: +10% mana generation rate
  - L3: +5% ability damage
  - L4: 10% mana discount on first cast
  - L5: +10% ATK when mana is full
- Display these as a checklist (green ✓ for unlocked, gray ○ for locked)
- **No interactive panel needed beyond upgrade** — bonuses are passive and applied in combat

### Bond Hall Panel
When clicking the Bond Hall card:
- Show current level and upgrade option
- Show bonuses at current level (from `getBondHallBonuses()`):
  - L1: View unit bonds
  - L2: +25% bond bonus
  - L3: Show bond hints in team builder (highlight units that form bonds with your current team)
  - L4: +50% bond bonus (replaces 25%)
  - L5: Trio bonds unlocked
- **Update `getBondHallBonuses()` in hub.js**: Replace `bondQuestsUnlocked` (L3) with `bondHintsUnlocked: level >= 3` (show bond hints in team builder)
- **Bond viewer**: If level >= 1, show a list of all bond pairs/trios from `UNIT_BONDS` in `units.js` (if it exists — if not, show a placeholder). For each bond, show the units involved, whether the player owns them, and the bond bonus.

### Building Upgrade Confirmation
For ALL buildings (not just the new ones), add a confirmation dialog before spending gold:
- When the player clicks upgrade, show: "Upgrade [Building Name] to Level [N+1] for [cost] gold?"
- OK / Cancel buttons
- Only proceed with `upgradeBuilding()` on OK

---

## Part C: Remove Daily Quest System

**The daily quest system doesn't fit the single-player design.** Remove it entirely:
- Delete `DAILY_QUEST_POOL`, `generateDailyQuests()`, `getDailyQuestStatus()`, `updateDailyQuestProgress()`, `claimDailyQuestReward()`, `claimDailyCompletionBonus()` from `hub.js`
- Remove `dailyQuests` from `createDefaultSaveData()` in `save.js`
- Remove the Phase 5 graceful migration line for `dailyQuests` in `migrateSave()` in `save.js`
- Do NOT change save version — old saves with dailyQuests are harmless dead data

---

## Part D: Achievement Screen

**Current state**: `hub.js` has `ACHIEVEMENTS` (19 achievements), `checkAchievements()`, `claimAchievementReward()`, `getAchievementStatus()`. Zero UI.

### Achievement Panel
Add an "Achievements" button/tab accessible from the hub:
- Group achievements by category: Combat, Collection, Economy, Progression
- Each achievement shows: icon/emoji, name, description, progress (if applicable), reward, and status (locked/earned/claimed)
- Earned but unclaimed achievements have a Claim button
- Claimed achievements show ✓

### Achievement Check Hooks
Call `checkAchievements()` at key moments:
- After mission completion (combat, collection, economy achievements may trigger)
- After building upgrades
- After evolution
- After forge operations
- On hub screen render (catch-all)

Store newly earned achievements and show a notification/toast when earned (simple div that fades out).

---

## Part E: Stats Dashboard

**Current state**: `saveData.stats` tracks 17 statistics. No display.

### Stats Screen
Add a "Stats" button accessible from the hub:
- Show all tracked stats in a clean list:
  - Missions Completed, Bosses Defeated, Deathless Boss Clears
  - Max Single Hit, Fastest Win
  - Total Gold Earned, Total Gold Spent
  - Total Rolls, Total Units Collected, Total Gacha Pulls
  - Max Element Synergy
  - Forge Operations, Enhancements Performed, Max Enhance Level
  - Mythics Crafted, Gems Socketed, Unique Bonds Used
- Format numbers nicely (e.g., 1,234 not 1234)
- Fastest Win should show as seconds (e.g., "42.3s") or "N/A" if 999999

---

## Part F: Wire Combat Bonuses

### Mana Shrine → Combat
In `main-v2.js` (or wherever combat initialization happens):
- At combat start, call `getManaShrineBonuses()` and apply:
  - `startingMana`: Add to each player unit's mana at combat start
  - `manaGenMult`: Multiply mana gained per attack
  - `abilityDamageMult`: Multiply ability damage dealt
  - `firstCastDiscount`: Reduce mana cost of first ability cast by this percentage
  - `fullManaAtkBonus`: Multiply ATK by `(1 + bonus)` when unit has full mana

### Bond Hall → Combat
- At combat start, if Bond Hall level >= 1:
  - Detect active bonds on the player's team (pairs/trios from `UNIT_BONDS`)
  - Apply bond bonuses multiplied by `bondBonusMult` from `getBondHallBonuses()`
  - Only include trio bonds if `trioBondsUnlocked` is true

---

## Part G: QoL Fixes

### G1: Team Builder Sorting
The roster/collection screen has sort/filter (by Tier, Name, Element) and element/type/archetype filters. The team builder's unit selection panel has none.

**Add the same sort and filter controls** to the unit selection panel in `renderTeamBuilderScreen()`:
- Sort by: Tier, Name, Element (same as collection)
- Filter by: Element, Type, Archetype (dropdown or button row)
- Use the same `collectionFilters` pattern or a separate `teamBuilderFilters` state object
- Persist filter state while the team builder is open (reset on screen exit)

### G2: Remove War Room and Training Ground
These buildings don't provide enough value. Remove them:
- Delete `war_room` and `training_ground` from the `BUILDINGS` object in `hub.js`
- Delete their bonus getter functions (`getWarRoomIntelLevel`, `getXPMultiplier`)
- In `ui-v2.js`, remove any War Room intel display on mission cards (the region lock system replaces intel)
- In `missions.js` or `main-v2.js`, remove any references to `getWarRoomIntelLevel()` and `getXPMultiplier()`
- In save migration: do NOT delete existing save data for these buildings (just stop using them). Old saves with war_room/training_ground levels are harmless dead data.
- **Do NOT change save version** for this removal — it's purely a feature deletion

### G3: Synergy Descriptions in Team Builder and Combat
The synergy sidebar in team builder may already show descriptions — verify it's working and visible. If descriptions are truncated or hidden, fix them.

For **combat**: The synergy display during combat should also show effect descriptions, not just archetype/element names and counts. When the player hovers or clicks a synergy in the combat synergy bar, show the full bonus description. If hover isn't practical, show descriptions inline (below each synergy name).

### G4: Ability Descriptions on Unit Cards
Currently unit cards (in roster, team builder, and team view) show the ability name (`⚡ Fireball`) but not the description.

**Add ability descriptions** below the ability name on unit cards:
- Pull from `ABILITY_DATA[template.ability]` — use the `.description` or `.desc` field
- Show in smaller/muted text below the ability name
- Keep it to 1-2 lines; truncate with "..." if too long
- This should appear on cards in: roster view, team builder unit selection, and team builder deployed unit info

---

## Implementation Notes

- Test each part as you go. The game loads in a browser via `game-v2.html`.
- When adding new screens/panels, add corresponding `<div>` containers in `game-v2.html` if needed, with `display:none` default.
- For the region map, you can reuse the existing `mission-screen` div or create a new one.
- The hub screen currently renders all buildings in a grid. The new building panels should follow the evolution_lab/forge pattern (click building card → show dedicated panel with back button).
- For notifications/toasts (achievement earned, quest complete), a simple absolutely-positioned div that auto-hides after 3 seconds is fine.
- Commit when all parts are done and the game loads without console errors.

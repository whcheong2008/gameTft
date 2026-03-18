# Auto Battler — Continuity Document
> Tracks current development state for cross-session continuity.

## Current Status: V2 — Combat Engine Rebuild Complete (6/6 chunks), Roster Expansion Design + Prompts Complete (5/5 ready)

### What's Working (V2 Game — game-v2.html)
The game is **fully playable** with this core loop:
Hub → Gacha Rolling → Roster Management → Team Building → Mission Deployment → Multi-Wave Combat → Rewards → Back to Hub

**Core Systems (Phase 1 — DONE)**:
- Hub screen with 7 upgradable buildings (Barracks, Summoning Circle, Training Ground, Warehouse, War Room, Evolution Lab, Forge)
- Gold-based gacha rolling (single + 10x multi-roll) with tier weights by player level 1–20
- Summoning Circle discount on multi-rolls (wired up in prompt 05)
- Pity system: guaranteed cost 3+/4+ unit after N rolls (Summoning Circle levels 4–5)
- Persistent unit roster with 10-copy star-up system
- Team builder with 4×7 grid, drag-to-position, synergy preview sidebar
- Archetype synergies (Guardian, Striker, Predator, Mystic, Vanguard, Sage) at 2/4/6 thresholds
- Element synergies (Fire/Water/Earth/Wind) with unique bonuses at 2/4 thresholds
- 7 story missions + procedural grind missions with multi-wave combat
- Between-wave unit repositioning
- Star rating system (1–3 stars based on damage taken/units lost)
- Mission rewards: gold (scaled by Warehouse), XP (scaled by Training Ground), 1–3 random unit copies
- War Room intel showing enemy info on mission cards (3 intel levels)
- Evolution Lab building: evolve 3-star units into separate collection entries (prompt 09 — DONE)
- Evolved units as separate roster/team entries with own star-up track
- Evolved copies obtainable via gacha (15% chance once evolution unlocked)
- Evolved units show golden glow in combat
- Save/load via localStorage with migration support
- Reset game function

**Unit Taxonomy (REDESIGNED — see UNITS-DESIGN.md)**:
- **All 60 units evolve → 60 base + 60 evolved = 120 total** across 6 elements, 9 archetypes, 6 unit types
- 6 elements: Fire, Water, Earth, Wind, **Lightning** (NEW), **Force/Physical** (NEW)
- 9 archetypes: Guardian, Warden, Vanguard, Duelist, Predator, Ranger, Sorcerer, Mystic, Sage (Striker retired)
- 6 unit types: Warrior, Tank, Archer, Mage, Assassin, Healer
- Element matchups: Fire>Wind>Earth>Water>Fire (1.3x/0.7x), Lightning>Water weak-to Earth, Force neutral (1.0x all)
- Element synergy thresholds: **2/4/7/10** (10 = game-warping "Prismatic" bonus)
- **Prismatic rule**: Evolved T5 units count as 2 toward element synergy. 9 mono-element + evolved T5 = 10
- **One family one slot**: Base + evolved form can't both be on team
- Tier distribution: 21 T1 / 15 T2 / 12 T3 / 6 T4 / 6 T5 = 60 (10 per element)
- All 60 units evolve (T1-T2 get named evolutions, T3-T4 get stat+ability upgrades, T5 get enhanced passive)
- Team size: Start 2 slots, +1 every 2 levels → 7 at lvl 10, Barracks unlocks at lvl 10 (+2 max = 9 total)
- **Only T5 units have passive abilities (MaxMana 0). All others use mana.**

### What's Done (Phase 2 — COMPLETE)
- **Item System** — Fully implemented (prompt 06):
  - `items.js`: 8 base components + 8 combined recipes with rarity system
  - Rarity tiers: Standard (white), Uncommon (green), Rare (blue), Epic (purple)
  - Combined items scale with both component rarities independently: `base × (1 + comp1Bonus + comp2Bonus)`
  - Mission drops: 1 guaranteed + 1 bonus for 3-star, rarity scales with mission difficulty + star rating
  - Item bench with equip/unequip UI, Warehouse-linked bench expansion (10 base + 2 per level)
  - Auto-combine: equipping matching components on same unit triggers recipe crafting
  - Combat integration: item stats applied at combat start, 4 special effects (BotRK %maxHP, Warmog's regen, Archangel's heal→damage, HoJ heal on kill)
  - Crit chance and element resist processing in combat
  - Item icons shown on units in team builder and combat
  - Item selling: components + combined items for gold
  - Future hooks in data structure: `passive`, `ability`, `setId` fields (null for now)
- **14 Story Missions** — Implemented (prompt 07): missions 8–14 with element bias, enemy synergies/evolutions
- **Unit Selling** — Implemented (prompt 07): sell duplicate copies for gold
- **Unit Detail Panel** — Implemented (prompt 08): stats, skills, items, evolution, combat behavior
- **Item Selling & Bench Expansion** — Implemented (prompt 08)
- **Evolution Rework** — Implemented (prompt 09):
  - Evolution Lab building (3 levels: unlock, 25% discount, 50% discount)
  - Evolved units as separate collection entries (not combat-start transforms)
  - Base unit preserved at current stars after evolution
  - Data-driven `requirements` array for extensibility (currently all 3-star)
  - `checkEnemyEvolution()` for enemy-side evolution (old system preserved for enemies)
  - Evolved copies in gacha at 15% chance once player owns evolved form
  - `EVOLVED_TEMPLATES` updated with `baseKey` back-references
  - `EVOLUTIONS` restructured from `criteria` to `requirements` array
  - Save version bumped to 2 (then 3 for Forge)
- **Forge Building** — DONE (prompt 10):
  - Forge building definition (5 levels) added to hub.js
  - All item data defined in items.js: ESSENCES, ITEM_SETS (4 sets), SET_ITEM_RECIPES (12 items), ABILITY_ITEMS (4 + 3 evolved-gated)
  - Forge operations: reroll, disassemble, transmute, set craft, ability craft
  - Forge UI (5-tab panel in hub), essence drop integration in mission rewards
  - All 7 ability item combat effects implemented (stasis, revive, spellAmp, lifesteal, frenzy, elemMastery, titanResolve)
  - Set bonus combat processing (setRegen, setBurn)
  - Set bonus calculation: `calculateActiveSetBonuses()`, `applySetBonuses()`
  - Evolution-gated equip restriction on ability items
  - Save version 3 with essences + milestonesClaimed migration

### What's Still Needed

**Deep Design Phase — Publishable Game Design** (COMPLETE):
Five major systems designed to publishable depth. Hub & Social doc not needed per SCOPE.md.
- [x] Combat system → COMBAT-DESIGN.md (mana, abilities, status effects, movement, boss fights)
- [x] Unit system → UNITS-DESIGN.md (38 base units, 24 evolutions, innate passives, ascension, bonds)
- [x] Item system → ITEMS-DESIGN.md (21 combined, 12 ability, 6 mythic, enhancement, gems, affinity)
- [x] Progression & Economy → PROGRESSION-DESIGN.md (currencies, stamina, gold model, gacha, daily/weekly loop, buildings, power curve, achievements, events, prestige)
- [x] Content & Meta → CONTENT-DESIGN.md (campaign narrative, boss encounters, endless mode, arena, challenge modes, lore, content pipeline)
- [x] Scope separation → SCOPE.md (prototype-core vs future expansion, 6-phase implementation priority)
- **SCOPE PIVOT**: Single-player marketing prototype, not full live-service. Arena, seasonal events, IAP, content pipeline are "future expansion". See SCOPE.md for full breakdown.

**Phase 1 — Combat Engine Rebuild** (COMPLETE — 6/6 chunks done, prompt 16 ready for final polish):
The combat engine is being rebuilt from scratch per COMBAT-DESIGN.md. Implementation is broken into 6 sequential chunks, each as a separate Claude Code prompt. See SCOPE.md § Implementation Priority Order for the full roadmap.

| Chunk | Name | Scope | Prompt | Status |
|-------|------|-------|--------|--------|
| 1 | Grid & Movement Foundation | 8×7 vertical grid (rows 0-3 enemy, 4-7 player), BFS pathfinding, type-specific move speeds, attack ranges (Manhattan distance), assassin dash, grid-aware targeting | `11` (original) + `11b` (orientation fix) | **DONE** |
| 2 | Damage Pipeline | Unified `dealDamage()` pipeline (element→crit→DR→dodge→shield→HP→on-hit→on-kill), `dealHealing()`, per-unit combat stat tracking, **live combat scoreboard sidebar** (dmg dealt/taken/healed per unit in real time), MVP display on results screen | `12` | **DONE** |
| 3 | Mana & Abilities | Mana system (10 mana/attack + damage-taken mana), ability casting framework, all 20 base + 16 evolved abilities implemented, basic status effects (burn/slow/stun/freeze/root/taunt/dodge/reflect/atkMod/drMod/regen/vulnerability), passive abilities (Phoenix/World Tree/Volcano Titan), mana bar rendering | `13` | **DONE** |
| 4 | Status Effects | Diminishing returns on CC (2nd=50%, 3rd=25% within 8s), CC immunity (1s after stun/freeze), tenacity stat, new types (Silence/Blind/Poison/Bleed), DoT tick normalization (1/sec), atkBuff/atkMod split, spdMod, dodge highest-wins, visual status icons on units (emoji, max 3 + overflow) | `14` | **DONE** |
| 5 | Boss Framework | 2×2 boss grid occupation, multi-phase boss fights, telegraph system (red danger zones 1.5-2s before damage), minion spawning, phase transitions with invulnerability, enrage timers, 6 boss data definitions (3 fully implemented: Veil Guardian, Infernal Wyvern, Tidal Leviathan; 3 data stubs: Stone Colossus, Storm Phoenix, Void Sovereign), boss missions on story_7 and story_14 | `15` | **DONE** |
| 6 | Speed Controls & Visual Polish | 1×/2×/4× speed toggle, auto-battle for cleared content, floating damage numbers, smooth movement via CSS transitions on absolute-positioned overlays, death animations, ability cast glow, AoE cell flashes, combat start/end polish | `16` | **READY** |

**Key technical notes for chunks 2-6:**
- All changes are combat-engine-only — save format doesn't change (combat state is ephemeral)
- Each chunk builds on the previous — do NOT skip or reorder
- Pattern: all `var`, global scope, NO ES modules, NO import/export
- Grid is 8 rows × 7 cols after chunk 1 fix: rows 0-3 enemy, rows 4-7 player
- Team builder row `r` → combat row `7 - r` (row 0 back → row 7, row 3 front → row 4)
- Source of truth for ability/status/damage specs: COMBAT-DESIGN.md sections 3-7
- Source of truth for boss encounter details: CONTENT-DESIGN.md section 4

**Phase 2 — Expanded Roster** (REDESIGNED — see UNITS-DESIGN.md, implementation prompts COMPLETE):
- **Full roster redesign**: 60 base units (up from 20), all evolve → 120 total
- **2 new elements**: Lightning (crits/chain), Force (physical/neutral) — requires new ELEMENT_SYNERGIES, ARCHETYPES data
- **9 archetypes** (was 6): +Ranger, +Sorcerer, +Duelist, +Warden, -Striker
- **Element synergy overhaul**: 2/4/7/10 thresholds (was 2/4), prismatic 10-bonus
- **Team size overhaul**: Start 2, +1/2 levels → 7 at lvl 10, Barracks at lvl 10 (+2 = 9 max)
- **One family one slot rule**: Base+evolved can't coexist on team
- Innate passives for all 60 units, abilities for all 60
- Unit bonds system (6 elemental duos, 4 cross-element duos, 6 trios)
- Ascension system (Awakened → Exalted → Transcendent)

| Chunk | Name | Scope | Prompt | Status |
|-------|------|-------|--------|--------|
| 1 | Systems Foundation | 6 elements+matchups, ELEMENT_SYNERGIES 2/4/7/10, 9 ARCHETYPES, prismatic detection, team size rework, one-family-one-slot, synergy sidebar UI, save migration | `17` | **READY** |
| 2 | Unit Data Layer | 60 UNIT_TEMPLATES, 60 EVOLVED_TEMPLATES, 60 EVOLUTIONS, 100 ABILITY_DATA, 60 PASSIVE_DATA, 60 EVOLVED_PASSIVE_DATA, gacha verification | `18` | **READY** |
| 3a | Passive System + T1-T2 Abilities | Passive framework (6 trigger types), processPassives(), 72 abilities (21 T1 base + 21 T1 evolved + 15 T2 base + 15 T2 evolved), 72 passives, reentry guards | `19a` | **READY** |
| 3b | T3-T5 Abilities + Legendaries | 12 T3 + 6 T4 abilities, 24 T3-T5 passives, T5 legendary ability system (MaxMana 0), Phoenix revive, Leviathan submerge, Void Wyrm trigger | `19b` | **READY** |
| 4 | Integration & Polish | Gacha pool update, mission enemy generation, team builder UI overhaul, synergy sidebar, save migration v3→v4, balance pass | `20` | **READY** |

**Phase 3 — Expanded Items** (from SCOPE.md):
- 4 new components + 13 new recipes
- Enhancement system (+0 to +10), gem sockets, item affinity
- 3 mythic items (trimmed from 6), Arcane set, 5 new ability items

**Phase 4 — Content & Bosses** (from SCOPE.md):
- Chapter UI overlay, named enemy captains
- Endless mode (The Abyss) with floor modifiers
- Challenge modes (4 types), lore system (codex, unit cards, bond stories)

**Phase 5 — Progression Polish** (from SCOPE.md):
- 3 new buildings (Gem Workshop, Mana Shrine, Bond Hall)
- Daily quests, achievement system, collection bonuses

**Phase 6 — Visual & Audio Polish**:
- [ ] Sprite system (replace emoji with art)
- [ ] Combat visual effects (covered partially by chunk 6)
- [ ] Sound effects and music
- [ ] Screen transitions

**Mission & Region System** (DESIGNED — see MISSIONS-DESIGN.md):
- 8 regions, ~45-50 stages total (37-42 regular + 8 boss stages)
- **Lock system**: Minimum count requirements on team composition (e.g., "2 Guardians", "4 elements"). Grayed-out deploy if unmet. Locks are the tutorial — force the player to use systems instead of popup tutorials.
- **6 reusable encounter mechanics** (first appear Region 4, reused in R7, R8, bosses):
  - VIP Target (kill priority enemy to remove buff/heal), Countdown (destroy structure before wipe timer), Reinforcement Pressure (fixed spawn points produce enemies on interval), Protect the Objective (keep friendly NPC alive), Split Formation (team forced into two groups), Escalating Threat (enemy ramps stats over time)
- **8 boss encounters** (all 2×2): Veil Warden (R1, basic), Archon (R2, stance-shift), Twin Heralds (R3, two 1×2 bosses, kill-order puzzle), Shattered Colossus (R4, 3 phases cycling encounter mechanics), Elemental Chimera (R5, element-shift+absorption), Prismatic Sentinel (R6, rotating immunity/vulnerability), Arbiter of Trials (R7, mid-fight constraint imposition), Void Sovereign (R8, unit copying+board shrink+DPS race, 150s enrage)
  - **NOTE**: Prompt 15 implemented 6 bosses (3 full + 3 stubs). MISSIONS-DESIGN.md defines 8 bosses with different names/mechanics. Reconciliation needed — mission bosses supersede content-design bosses where they conflict.
- **Difficulty calibration** (Region 8): Intended clear at 4-threshold dual-element + strong archetypes. Prismatic (10-element) = comfortable clear, NOT required. Multiple viable strategies.
- **Design philosophy**: "Story navigates missions, not reverse." "Prismatic is a reward, not a requirement."

### Known Issues / Tech Debt
1. ~~**Combat grid orientation (BLOCKING)**~~: FIXED by prompt 11b
2. ~~Some evolved abilities are stat-based approximations~~: FIXED in Chunk 3
3. ~~No smooth pixel interpolation~~: Addressed in Chunk 6
4. ~~Mountain Lord taunt not implemented~~: Addressed in Chunk 4
5. **Current code has 20 base units + 16 evolved**: Needs massive expansion to 60+60 for Phase 2
6. **Element system is 4 elements**: Needs expansion to 6 (Lightning, Force)
7. **Archetype system is 6 archetypes**: Needs expansion to 9 (+Ranger, Sorcerer, Duelist, Warden, -Striker)
8. **Team size starts at ~5-7**: Needs rework to start at 2, scale with level, Barracks at lvl 10

### Key Design Decisions (V2)
- **Persistent progression**: Units, buildings, progress all persist via localStorage
- **10-copy star-up**: `1.8^(stars-1)` scaling, uncapped stars
- **Modular JS (global scope)**: All files loaded via `<script>` tags, NO ES modules
- **Pre-set teams**: Team is locked when mission starts, only repositioning between waves
- **Building bonuses wired**: Training Ground→XP mult, Warehouse→gold mult, Summoning Circle→roll discount+pity, War Room→mission intel, Barracks→team size
- **Evolution via Evolution Lab**: Deliberate player action via building. Evolved units are separate collection entries. Base unit preserved. 3-star base required. (Rework from combat-start system — prompt 09)
- **Item rarity**: Both component rarities contribute independently to combined item power
- **Orchestrator pattern**: Cowork session designs features + writes prompts in `prompts/`. To hand off, provide a single paste-ready line for the Claude Code chatbox: `Read the file prompts/XX-name.md and implement everything it describes.` — no CLI commands, no piping.

### File Structure (Current)
```
Game TFT/
├── game-v2.html          ← V2 HTML shell + CSS (376+ lines)
├── game.html             ← V1 HTML shell (historical, still playable)
├── js/
│   ├── units.js          ← Unit templates, elements, archetypes, evolutions (data-driven requirements), ELEMENT_SYNERGIES
│   ├── save.js           ← localStorage persistence, migration v3, collection helpers, sell helpers
│   ├── gacha.js          ← Gold rolling, tier weights, pity system, Summoning Circle discount, evolved copies
│   ├── teams.js          ← Roster management (base+evolved), team builder, board deployment
│   ├── hub.js            ← Screen management, 7 building definitions, upgrade logic, bonus getters
│   ├── items.js          ← Item system: components, recipes, rarity, forge ops, set/ability items, essences, selling
│   ├── missions.js       ← 14 story missions, grind generator, wave generation, rewards, essence drops
│   ├── ui-v2.js          ← All V2 screen renderers (hub, gacha, roster, team builder, missions, combat)
│   ├── main-v2.js        ← V2 entry point, simplified combat engine, synergy/element bonus application
│   ├── synergies.js      ← V1 synergy calculation (NOT loaded by V2)
│   ├── combat.js         ← V1 combat engine (NOT loaded by V2)
│   ├── enemies.js        ← V1 enemy generation (NOT loaded by V2)
│   ├── economy.js        ← V1 economy (NOT loaded by V2)
│   ├── shop.js           ← V1 shop (NOT loaded by V2)
│   ├── board.js          ← V1 board (NOT loaded by V2)
│   ├── ui.js             ← V1 UI (NOT loaded by V2)
│   └── main.js           ← V1 main (NOT loaded by V2)
├── prompts/
│   ├── 01-item-system.md                ← V1 item prompt (historical)
│   ├── 03-v2-bugfix-and-polish.md       ← Claude Code session 1 (DONE)
│   ├── 04-element-synergies-and-ui.md   ← Claude Code session 2 (DONE)
│   ├── 05-buildings-and-evolution.md     ← Claude Code session 3 (DONE)
│   ├── 06-item-system.md                ← Claude Code session 4 (DONE)
│   ├── 07-phase2-completion.md          ← Claude Code session 5 (DONE)
│   ├── 08-items-and-unit-detail.md      ← Claude Code session 6 (DONE)
│   ├── 09-evolution-rework.md           ← Claude Code session 7 (DONE)
│   ├── 10-forge-and-special-items.md    ← Claude Code session 8 (DONE)
│   ├── 11-combat-grid-movement.md       ← Combat Chunk 1: Grid & Movement (IMPLEMENTED, has bug)
│   ├── 11b-fix-grid-orientation.md      ← Chunk 1 fix: 4×14 horizontal → 8×7 vertical
│   ├── 12-damage-pipeline.md           ← Chunk 2: Damage pipeline + live combat scoreboard (DONE)
│   ├── 13-mana-and-abilities.md       ← Chunk 3: Mana system + all 36 abilities + basic status effects (DONE)
│   ├── 14-status-effects.md          ← Chunk 4: Full status effect framework + visual icons (DONE)
│   ├── 15-boss-framework.md          ← Chunk 5: Boss framework + 6 bosses + telegraph system (DONE)
│   ├── 16-speed-and-visual-polish.md ← Chunk 6: Speed controls + visual polish (READY)
│   ├── 17-systems-foundation.md      ← Phase 2 Chunk 1: Elements/archetypes/team size overhaul (READY)
│   ├── 18-unit-data-layer.md         ← Phase 2 Chunk 2: All 120 unit definitions + data tables (READY)
│   ├── 19a-passives-and-t1t2-abilities.md ← Phase 2 Chunk 3a: Passive framework + T1-T2 abilities (READY)
│   ├── 19b-t3t5-abilities-and-legendaries.md ← Phase 2 Chunk 3b: T3-T5 abilities + T5 legendaries (READY)
│   └── 20-integration-and-polish.md  ← Phase 2 Chunk 4: Gacha/UI/save migration/balance (READY)
├── orchestrators/        ← V1 domain orchestrator docs (historical)
├── DESIGN-V2.md          ← V2 game design document (authoritative)
├── COMBAT-DESIGN.md      ← Deep combat system design (mana, abilities, status effects, movement)
├── UNITS-DESIGN.md       ← Deep unit system design (38 base, 24 evolved, passives, ascension, bonds)
├── ITEMS-DESIGN.md       ← Deep item system design (21 combined, 12 ability, 6 mythic, enhancement, gems)
├── PROGRESSION-DESIGN.md ← Deep progression/economy design (currencies, stamina, daily loop, prestige)
├── CONTENT-DESIGN.md     ← Deep content/meta design (campaign narrative, bosses, endless, arena, lore, pipeline)
├── MISSIONS-DESIGN.md    ← Deep mission/region design (8 regions, locks, encounter mechanics, 8 bosses)
├── SCOPE.md              ← Prototype scope: core vs future expansion, 6-phase implementation priority
├── DESIGN.md             ← V1 game design (historical reference)
├── MECHANICS.md          ← Engine-agnostic mechanics reference (V1)
└── CONTINUITY.md         ← This file
```

**V2 Script Load Order**: `units.js → save.js → gacha.js → teams.js → hub.js → items.js → missions.js → ui-v2.js → main-v2.js`

### Project Management
Fibery workspace: `whtrading.fibery.io` → **Game Dev** space
- **Epic** database (6): Hub & Base System, Mission System, Unit Collection & Gacha, Combat Engine Reuse, UI & Polish, Item System
- **Task** database (28 tasks): linked to epics via Epic→Task relation
- **Status field**: Single-select enum (Not Started / In Progress / Done) — added via API
- **Enum IDs**: Not Started=`019cf795-f19c-7392-b90b-444a078c0151`, In Progress=`019cf795-f1ee-719a-97c4-6706aeb1397e`, Done=`019cf795-f220-7098-b0f7-428270b949cf`
- **Current progress**: 26/28 tasks done. Remaining: combat animations, smooth unit movement (Phase 3)

### Open Design Questions
1. **Boss reconciliation**: Prompt 15 implemented 6 bosses from CONTENT-DESIGN.md (Veil Guardian, Infernal Wyvern, Tidal Leviathan, Stone Colossus, Storm Phoenix, Void Sovereign). MISSIONS-DESIGN.md defines 8 different bosses (Veil Warden, Archon, Twin Heralds, Shattered Colossus, Elemental Chimera, Prismatic Sentinel, Arbiter of Trials, Void Sovereign). Only Void Sovereign overlaps. Need to decide: replace prompt 15 bosses with mission bosses, or keep both sets for different contexts?
2. **Boss feature gating**: Which game features unlock at which boss clears? (e.g., does clearing Region 2 boss unlock Evolution Lab?)
3. **War Room building**: Current intel mechanic (show enemy info on mission cards) may need rethinking given the region/lock system. Locks already tell the player what to expect.
4. **Grind missions vs regions**: How do repeatable grind missions fit alongside the 8-region structure? Separate system (current implementation: procedural grind missions) or integrated into regions as repeatable stages?
5. **Stage wave counts**: Specific wave counts per stage TBD — depends on pacing feel during implementation.
6. **Enemy composition specifics**: Exact unit budgets, star levels, and synergy configurations per stage need detailed tuning pass.
7. **Prismatic threshold tuning**: 10-element requires significant investment. Math: 9 team slots, 9 unique mono-element families + 1 evolved T5 counting as 2 = 10. Verify grind timeline is acceptable.
8. **Encounter mechanics in Endless Mode**: Should The Abyss (endless mode) use Region 4's encounter mechanics as floor modifiers?
9. **Story/narrative**: Region names, mission dialogue, lore context all TBD (separate session with wife?)

### Session Log
- **Session 1 (2026-03-16)**: Built Phase 1 prototype. 10 units, basic combat, economy, shop.
- **Session 2 (2026-03-16)**: Phase 2a — expanded to 22+16 units with full taxonomy, synergies, evolutions.
- **Session 3 (2026-03-16)**: Created MECHANICS.md — comprehensive mechanics reference.
- **Session 4 (2026-03-16)**: Modular restructure into 9 JS files. Win/loss streaks, shop affinity.
- **Session 5 (2026-03-16)**: V2 design pivot (gacha/progression). Created DESIGN-V2.md. Fibery setup.
- **Session 6 (2026-03-17)**: V2 implementation sprint.
  - Bootstrapped V2 codebase: save.js, gacha.js, teams.js, hub.js, missions.js, ui-v2.js, main-v2.js, game-v2.html
  - **Claude Code Session 1** (prompt 03): Fixed combat grid (4×7 both sides), wave repositioning, gacha info, roster stats, team builder tooltips, mission unit copy rewards
  - **Claude Code Session 2** (prompt 04): Element synergies (Fire/Water/Earth/Wind with unique bonuses), team builder unit stats, synergy sidebar with descriptions, combat synergy bar
  - **Claude Code Session 3** (prompt 05): Wired building bonuses (Summoning Circle discount + pity, War Room intel, Training Ground/Warehouse in rewards), evolution system (check at combat start, preview in team builder, golden glow in combat), building bonus feedback in mission results
  - Designed V2 item system with rarity tiers, independent component rarity scaling, mission-based drops, future hooks for ability items and set items
  - Created prompt 06 for item system implementation
  - **Claude Code Session 4** (prompt 06): Full item system — items.js with rarity data, save migration, mission drops with rarity scaling, item bench + equip/unequip UI, auto-combine recipes, combat stat application + 4 special effects (BotRK, Warmog's, Archangel's, HoJ), crit/elemResist processing, item icons in team builder + combat
  - Updated DESIGN-V2.md with full item system specs
  - Added Status field to Fibery Task database (enum: Not Started/In Progress/Done) via API
  - Updated all 28 Fibery tasks with correct status (26 Done, 2 Not Started)
  - Designed Phase 2 completion: 7 new story missions (8–14) with element bias, enemy synergies/evolutions, unit selling
  - Created prompt 07 for all three Phase 2 remaining features in one Claude Code session
  - Designed item selling, Warehouse bench expansion (10+2/level), unit detail panel for team builder + roster
  - Created prompt 08 for item/UI improvements
  - **Claude Code Session 5** (prompt 07): 14 story missions with element bias + enemy synergies/evolutions, unit selling
  - **Claude Code Session 6** (prompt 08): Item selling, Warehouse bench expansion, unit detail panel
  - Designed evolution rework: Evolution Lab building, evolved units as separate collection entries, data-driven requirements
  - Created prompt 09 for evolution rework
  - Designed Forge building (5 tiers: reroll, disassemble, transmute, set craft, advanced craft)
  - Designed special items: 12 set items (4 element sets), 4 ability items, 3 evolution-gated ability items
  - Designed Essence drop system (fire/water/earth/wind catalysts for set crafting)
  - Created prompt 10 for Forge + special items
  - **Claude Code Session 7** (prompt 09): Evolution Lab building, evolved units as separate collection entries, data-driven requirements, checkEnemyEvolution, evolveUnit, gacha evolved copies, save migration v2
  - **Claude Code Session 8** (prompt 10): DONE — Forge building, essences, set items, ability items, combat abilities
- **Session 7 (2026-03-17)**: Deep design phase — publishable game design.
  - Decided strategy: flesh out game design to publishable depth BEFORE engine/porting
  - Created COMBAT-DESIGN.md: comprehensive combat system with mana, 38 abilities, status effects, movement/pathfinding, boss fights, damage pipeline, visual effects, balance framework + Appendix B edge cases
  - Created UNITS-DESIGN.md: expanded roster from 22→38 base units, 16→24 evolved forms, innate passives, ascension system (3 tiers), unit bonds (6 elemental duos, 3 cross-element duos, 4 trios), 8 team compositions
  - Created ITEMS-DESIGN.md: expanded to 21 combined recipes, 12 ability items, 6 mythic items, enhancement system (+0 to +10), gem socket system (9 types × 4 rarities), item affinity, recipe book/collection bonuses
  - All three docs verified and edge cases addressed
  - Created PROGRESSION-DESIGN.md: unified economy model with gold income/spend at every game phase, stamina system, gem premium currency, daily/weekly quest loops, 3 new buildings (Gem Workshop, Mana Shrine, Bond Hall), extended level cap (20→40), prestige system, achievement framework, event cadence, power curve model (1× to 140× over 12 months)
  - Created CONTENT-DESIGN.md: world lore (The Shattered Veil), 4-chapter campaign structure, enemy design philosophy, 6 detailed boss encounters (Veil Guardian, Infernal Wyvern, Tidal Leviathan, Stone Colossus, Storm Phoenix, Void Sovereign), endless mode (The Abyss), arena PvP, 4 challenge mode types, lore delivery system, meta balance philosophy, content pipeline
  - **SCOPE PIVOT**: User decided to focus on single-player marketing prototype rather than full live-service. Arena, seasonal events, IAP, content pipeline are future expansion. Core single-player loop is priority.
  - Created SCOPE.md: separates prototype-core from future expansion, 6-phase implementation priority
  - Created prompt 11 (combat-grid-movement): Chunk 1 of combat engine rebuild — grid & movement foundation
  - **Claude Code implemented prompt 11**: grid, BFS pathfinding, movement, assassin dash, range checking
  - **BUG**: Grid orientation was wrong — implemented as 4×14 horizontal (left-to-right) instead of vertical (top-to-bottom). Enemy units not appearing on their side.
  - Created prompt 11b (fix-grid-orientation): Corrective prompt to change grid from 4×14 horizontal to 8×7 vertical (rows 0-3 enemy, rows 4-7 player). Maps team builder row→combat row via `7-teamRow`. Adds enemy zone preview to team builder.
  - Remaining: hub/social

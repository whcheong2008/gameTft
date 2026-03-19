# Auto Battler — Continuity Document
> Tracks current development state for cross-session continuity.

## Git Branch Conventions

**Branch naming:**
- `feature/` — new functionality (e.g., `feature/new-character-kai`)
- `fix/` — bug fixes (e.g., `fix/battle-crash-on-empty-team`)
- `balance/` — balance/tuning changes (e.g., `balance/reduce-3star-pull-rate`)
- `polish/` — visual/UX improvements (e.g., `polish/summon-reveal-animation`)

**Workflow:**
1. Branch from `main` for every change
2. Test on branch
3. Merge to `main` only when verified working
4. Tag meaningful milestones (e.g., `v0.3.0-phase2-roster`)

---

## Current Status: V2 — Phases 1-5 Complete, Hero + Item Rework + Progression Rework In Progress

**Repository**: https://github.com/whcheong2008/gameTft
**Current tag**: `v0.5.0-session11-complete`
**Previous tags**: `v0.4.0-session11` (mid-session), `v0.2.0-phase1-complete` (initial)
**Next tag**: `v0.6.0-playtested` (after smoke test + bug fixes)

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

**Unit Taxonomy (REDESIGNED — see UNITS-DESIGN.md + PROGRESSION-REWORK.md)**:
- **66 base units evolve → 66 base + 66 evolved = 132 total** across 6 elements, 9 archetypes, 6 unit types (6 new T4 needed)
- 6 elements: Fire, Water, Earth, Wind, **Lightning** (NEW), **Force/Physical** (NEW)
- 9 archetypes: Guardian, Warden, Vanguard, Duelist, Predator, Ranger, Sorcerer, Mystic, Sage (Striker retired)
- 6 unit types: Warrior, Tank, Archer, Mage, Assassin, Healer
- Element matchups: Fire>Wind>Earth>Water>Fire (1.3x/0.7x), Lightning>Water weak-to Earth, Force neutral (1.0x all)
- Element synergy thresholds: **2/4/7/10** (10 = game-warping "Prismatic" bonus)
- **Prismatic rule**: Evolved T5 units count as 2 toward element synergy. 9 mono-element + evolved T5 = 10
- **One family one slot**: Base + evolved form can't both be on team
- Tier distribution: 21 T1 / 15 T2 / 12 T3 / **12 T4** (was 6) / 6 T5 = **66**
- All 66 units evolve (T1-T2 get named evolutions, T3-T4 get stat+ability upgrades, T5 get enhanced passive)
- **Team size**: Start **3** slots, +1 at levels 4/8/12/16, Sustained Bonds upgrade at L17 → **max 8**
- **Tiered star-up**: T1=3, T2=4, T3=5, T4=8, T5=10 copies per star. 3 stars to evolve.
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

### What's Done (Phase 3 — COMPLETE)
- **Enhancement system** (+0 to +10 with pity counter, save v4→v5)
- **Gem socket system** (9 types × 4 rarities)
- **Arcane set** + 5 new ability items
- **4 new components** + 13 new recipes
- **Mythic items** (all 6 defined + materials + forge crafting)
- **Item affinity system** (22 affinities matching by type/archetype/element)
- **Recipe book + collection milestones** (6 milestones with permanent bonuses)
- **Drop tables** (level-gated mission rewards, forge integration, recipe discovery hooks)

### Phase 4 — COMPLETE (Region Expansion)
**Design conflict resolved**: MISSIONS-DESIGN.md's 8-region structure supersedes CONTENT-DESIGN.md's 14-mission structure.

**Resolution decisions**:
1. **STORY_MISSIONS → STAGES**: 14 missions replaced by ~47 stages in 8 regions. `STORY_MISSIONS = STAGES` alias for backward compat.
2. **CHAPTERS → REGIONS**: 4 chapters replaced by 8 regions with per-region rewards.
3. **Boss reconciliation**:
   - `veil_guardian` → replaced by `veil_warden` (MISSIONS-DESIGN R1 boss)
   - `infernal_wyvern`, `tidal_leviathan`, `stone_colossus`, `storm_phoenix` → kept as challenge mode bosses
   - `void_sovereign` → rewritten to MISSIONS-DESIGN spec (Puppeteer→Commander→Unmaker)
   - 6 new bosses added: `archon`, `twin_heralds`, `shattered_colossus`, `elemental_chimera`, `prismatic_sentinel`, `arbiter_of_trials`
4. **Captains reassigned**: pyra→R6S2, nereus→R5S2, gorath→R6S4, sylph→R7S2, arbiter→R7S5, voidborn_champion→R8S5
5. **Save migration**: v5→v6 adds regionProgress, starRatings, regionRewardsClaimed

**Parallel worker tracks**:
- `feature/phase4-regions` — Region expansion (prompt 22): STAGES, REGIONS, locks, encounter mechanics, 8 bosses, save migration
- `feature/phase5-progression` — Buildings/quests/achievements (prompt 23): 3 new buildings, daily quests, achievement system, stats tracking

**Blocked until regions merge**: Endless mode, challenge modes, lore system (depend on new stage/boss structures)

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

**Phase 1 — Combat Engine Rebuild** (COMPLETE — 6/6 chunks done, all implemented):
The combat engine is being rebuilt from scratch per COMBAT-DESIGN.md. Implementation is broken into 6 sequential chunks, each as a separate Claude Code prompt. See SCOPE.md § Implementation Priority Order for the full roadmap.

| Chunk | Name | Scope | Prompt | Status |
|-------|------|-------|--------|--------|
| 1 | Grid & Movement Foundation | 8×7 vertical grid (rows 0-3 enemy, 4-7 player), BFS pathfinding, type-specific move speeds, attack ranges (Manhattan distance), assassin dash, grid-aware targeting | `11` (original) + `11b` (orientation fix) | **DONE** |
| 2 | Damage Pipeline | Unified `dealDamage()` pipeline (element→crit→DR→dodge→shield→HP→on-hit→on-kill), `dealHealing()`, per-unit combat stat tracking, **live combat scoreboard sidebar** (dmg dealt/taken/healed per unit in real time), MVP display on results screen | `12` | **DONE** |
| 3 | Mana & Abilities | Mana system (10 mana/attack + damage-taken mana), ability casting framework, all 20 base + 16 evolved abilities implemented, basic status effects (burn/slow/stun/freeze/root/taunt/dodge/reflect/atkMod/drMod/regen/vulnerability), passive abilities (Phoenix/World Tree/Volcano Titan), mana bar rendering | `13` | **DONE** |
| 4 | Status Effects | Diminishing returns on CC (2nd=50%, 3rd=25% within 8s), CC immunity (1s after stun/freeze), tenacity stat, new types (Silence/Blind/Poison/Bleed), DoT tick normalization (1/sec), atkBuff/atkMod split, spdMod, dodge highest-wins, visual status icons on units (emoji, max 3 + overflow) | `14` | **DONE** |
| 5 | Boss Framework | 2×2 boss grid occupation, multi-phase boss fights, telegraph system (red danger zones 1.5-2s before damage), minion spawning, phase transitions with invulnerability, enrage timers, 6 boss data definitions (3 fully implemented: Veil Guardian, Infernal Wyvern, Tidal Leviathan; 3 data stubs: Stone Colossus, Storm Phoenix, Void Sovereign), boss missions on story_7 and story_14 | `15` | **DONE** |
| 6 | Speed Controls & Visual Polish | 1×/2×/4× speed toggle, auto-battle for cleared content, floating damage numbers, smooth movement via CSS transitions on absolute-positioned overlays, death animations, ability cast glow, AoE cell flashes, combat start/end polish | `16` | **DONE** |

**Key technical notes for chunks 2-6:**
- All changes are combat-engine-only — save format doesn't change (combat state is ephemeral)
- Each chunk builds on the previous — do NOT skip or reorder
- Pattern: all `var`, global scope, NO ES modules, NO import/export
- Grid is 8 rows × 7 cols after chunk 1 fix: rows 0-3 enemy, rows 4-7 player
- Team builder row `r` → combat row `7 - r` (row 0 back → row 7, row 3 front → row 4)
- Source of truth for ability/status/damage specs: COMBAT-DESIGN.md sections 3-7
- Source of truth for boss encounter details: CONTENT-DESIGN.md section 4

**Phase 2 — Expanded Roster** (IMPLEMENTED — all 5 prompts done, see UNITS-DESIGN.md):
- **Full roster redesign**: 66 base units (up from 20), all evolve → 132 total
- **2 new elements**: Lightning (crits/chain), Force (physical/neutral) — requires new ELEMENT_SYNERGIES, ARCHETYPES data
- **9 archetypes** (was 6): +Ranger, +Sorcerer, +Duelist, +Warden, -Striker
- **Element synergy overhaul**: 2/4/7/10 thresholds (was 2/4), prismatic 10-bonus
- **Team size overhaul**: Start 2, +1/2 levels → 7 at lvl 10, Barracks at lvl 10 (+2 = 9 max)
- **One family one slot rule**: Base+evolved can't coexist on team
- Innate passives for all 66 units, abilities for all 66
- Unit bonds system (6 elemental duos, 4 cross-element duos, 6 trios)
- Ascension system (Awakened → Exalted → Transcendent)

| Chunk | Name | Scope | Prompt | Status |
|-------|------|-------|--------|--------|
| 1 | Systems Foundation | 6 elements+matchups, ELEMENT_SYNERGIES 2/4/7/10, 9 ARCHETYPES, prismatic detection, team size rework, one-family-one-slot, synergy sidebar UI, save migration | `17` | **DONE** |
| 2 | Unit Data Layer | 60 UNIT_TEMPLATES, 60 EVOLVED_TEMPLATES, 60 EVOLUTIONS, 120 ABILITY_DATA, 60 PASSIVE_DATA, 60 EVOLVED_PASSIVE_DATA, gacha verification | `18` | **DONE** |
| 3a | Passive System + T1-T2 Abilities | Passive framework (6 trigger types), processPassives(), 72 abilities (21 T1 base + 21 T1 evolved + 15 T2 base + 15 T2 evolved), 72 passives, reentry guards | `19a` | **DONE** |
| 3b | T3-T5 Abilities + Legendaries | 12 T3 + 6 T4 abilities, 24 T3-T5 passives, T5 legendary ability system (MaxMana 0), Phoenix revive, Leviathan submerge, Void Wyrm trigger | `19b` | **DONE** |
| 4 | Integration & Polish | Gacha pool update, mission enemy generation, team builder UI overhaul, synergy sidebar, save migration v3→v4, balance pass | `20` | **DONE** |

**Phase 3 — Expanded Items** (COMPLETE — all 8 chunks done):
- Enhancement system, gem sockets, Arcane set, 5 new ability items
- 6 mythic items + materials, item affinity, recipe book, drop tables
- Save version 5

**Phase 4 — Content & Bosses** (REGIONS COMPLETE, remaining deferred):
- [x] Chapter system + expanded descriptions (prompt 22 chunks 1-2 — will be replaced by regions)
- [x] Named enemy captains (prompt 22 chunk 2 — will be reassigned to regions)
- [x] **Region expansion** (prompt 22 — feature/phase4-regions branch) — DONE: 8 regions, 47 stages, 12 bosses, save v6
- [ ] Endless mode (The Abyss) — unblocked
- [ ] Challenge modes — unblocked
- [ ] Lore system — unblocked

**Phase 5 — COMPLETE (Progression Polish)**:
- [x] **3 new buildings + daily quests + achievements** (prompt 23 — feature/phase5-progression branch) — DONE: Gem Workshop, Mana Shrine, Bond Hall, daily quests, 20+ achievements, stats tracking

**Phase 6 — Hero + Item + Progression Rework** (COMPLETE):
- [x] Unit XP/levels + ascension + secondary archetypes (prompt 26)
- [x] Archetype synergy rework to 2/4/6/8, archetype-scoped (prompts 25+27)
- [x] **Hero system** (prompt 29 — IMPLEMENTED + VERIFIED): 6 philosophy-based heroes, skill trees match HERO-REWORK.md. Tier costs 1/1/2/4/5.
- [x] **Item system rework** (prompt 30 — IMPLEMENTED): RPG equipment (8 slots), Tier×Rarity loot, random affixes, Echo Shaping, hero-gated equipping
- [x] **Progression/economy rework** (prompt 31 — IMPLEMENTED): Gold→Veil Essence, 50 VE/roll, tiered star-up, team size 3→8, hard level caps per region
- [x] **T4 expansion** (prompt 32 — IMPLEMENTED): 6 new T4 units (66 total roster, 132 with evolved), all 9 archetypes at T4
- [x] **Stage expansion** (prompt 33 — IMPLEMENTED): 74 stages (9-9-9-9-10-10-10-8), XP curve validated, hard level caps
- [x] **XP curve validated**: Every region hits target level exactly. Monotonically increasing. Hard caps prevent overleveling.

**Phase 7 — Visual & Audio Polish** (deferred, considering Unity port):
- [ ] Sprite system (replace emoji with art)
- [ ] Combat visual effects (covered partially by chunk 6)
- [ ] Sound effects and music
- [ ] Screen transitions

**Mission & Region System** (DESIGNED — see MISSIONS-DESIGN.md):
- 8 regions, **74 stages total** (9-9-9-9-10-10-10-8 per region, see PROGRESSION-REWORK.md)
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
5. ~~**Current code has 20 base units + 16 evolved**~~: DONE — expanded to 60+60=120 (prompts 17-20)
6. ~~**Element system is 4 elements**~~: DONE — expanded to 6 (Lightning, Force) (prompt 17)
7. ~~**Archetype system is 6 archetypes**~~: DONE — expanded to 9 (prompt 17)
8. ~~**Team size starts at ~5-7**~~: DONE — reworked to start at 2, +1/2 levels, Barracks at lvl 10 (prompt 17)
9. **Phase 2 needs playtesting**: All code landed but no smoke test or balance verification yet
10. **Boss reconciliation pending**: Prompt 15 bosses vs MISSIONS-DESIGN.md bosses — see Open Design Questions

### Key Design Decisions (V2)
- **Persistent progression**: Units, buildings, progress all persist via localStorage
- **Tiered star-up**: T1=3, T2=4, T3=5, T4=8, T5=10 copies/star. `1.8^(stars-1)` scaling. 3 stars to evolve. See PROGRESSION-REWORK.md.
- **Unit XP/Levels**: Per-unit, 1-30, +2% stats/level, XP from combat (deployed units only)
- **Ascension**: Awakened (L15, +10%, secondary archetype) → Exalted (L25, +30%, ability scaling) → Transcendent (L30, +65%, primary counts as 2 + new ability effect)
- **Hero system (REWORKED)**: 6 philosophy-based heroes (Kael/Protection, Lyric/Efficiency, Ren/Steadfast, Sera/Precision, Maren/Sustain, Voss/Momentum). Heroes modify playstyle of any unit regardless of archetype. Enable item equipping. Own XP + skill trees (2 branches, 20 levels). Lyric dies R4 permanently (no fragment). 5 heroes for 8 team slots = 3 unhero'd units. See HERO-REWORK.md.
- **Item system (rework)**: RPG equipment (8 slots). Two-axis loot: Tier (region-gated) × Rarity (RNG). Random affixes, passives at Epic/Legendary. Diablo 4 style.
- **Single-player pivot**: No daily quests, no stamina, no premium currency. 30-40 hour one-session experience. **Veil Essence** (harvested from Voidspawn) is the only currency — replaces gold. See STORY-DRAFT-V1.md § Lore-Mechanics Bridge.
- **Modular JS (global scope)**: All files loaded via `<script>` tags, NO ES modules
- **Pre-set teams**: Team is locked when mission starts, only repositioning between waves
- **Camp practices replace buildings**: Attunement Rite (summoning), Sustained Bonds (team size), Essence Reservoir (storage), Echo Shaping (crafting), Deep Resonance (evolution), Prism Focus (gems), Veil Wellspring (ambient power), Kindred Circle (bonds). See PROGRESSION-REWORK.md and STORY-DRAFT-V1.md § Lore-Mechanics Bridge.
- **Evolution via Evolution Lab**: Deliberate player action via building. Evolved units are separate collection entries. Base unit preserved. 3-star base required. (Rework from combat-start system — prompt 09)
- **Item rarity**: Both component rarities contribute independently to combined item power
- **Orchestrator pattern**: Cowork session designs features + writes prompts in `prompts/`. To hand off, provide a single paste-ready line for the Claude Code chatbox: `Read the file prompts/XX-name.md and implement everything it describes.` — no CLI commands, no piping.
- **Git push from Cowork**: GitHub PAT stored in `keys/github.txt`. To push, temporarily set remote URL with token, push, then reset URL. The keys/ folder is gitignored.

### File Structure (Current)
```
Game TFT/
├── game-v2.html          ← V2 HTML shell + CSS (376+ lines)
├── game.html             ← V1 HTML shell (historical, still playable)
├── js/
│   ├── units-core.js     ← Elements, archetypes (2/4/6/8), synergies, unit functions
│   ├── units-templates.js ← 66 base + 66 evolved unit templates with secondaryArchetype
│   ├── units-abilities.js ← 132 ability + 132 passive definitions
│   ├── units-bonds.js    ← 16 unit bonds (6 elemental, 4 cross-element, 6 trios)
│   ├── units-ascension.js ← Ascension tiers, XP/leveling, power rating functions
│   ├── heroes.js         ← Hero definitions, skill trees, hero functions (prompt 29 — in progress)
│   ├── combat-benchmark.js ← Dev tool: headless combat benchmarks (not loaded in game)
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
│   ├── 20-integration-and-polish.md  ← Phase 2 Chunk 4: Gacha/UI/save migration/balance (DONE)
│   ├── 21-git-init.md              ← Git initialization, .gitignore, remote setup (DONE)
│   ├── 22-phase4-region-expansion.md ← Phase 4: 8-region structure, locks, encounter mechanics, 8 bosses (READY)
│   └── 23-phase5-buildings-quests-achievements.md ← Phase 5: 3 buildings, daily quests, achievements (READY)
├── keys/
│   ├── github.txt        ← GitHub PAT for pushing from sandboxed environments (Cowork VM, etc.)
│   └── .gitignore        ← Ignores everything in keys/ except .gitignore itself
├── .gitignore            ← Excludes .claude/, fibery api.txt, OS/editor files
├── orchestrators/        ← V1 domain orchestrator docs (historical)
├── DESIGN-V2.md          ← V2 game design document (authoritative)
├── COMBAT-DESIGN.md      ← Deep combat system design (mana, abilities, status effects, movement)
├── UNITS-DESIGN.md       ← Deep unit system design (38 base, 24 evolved, passives, ascension, bonds)
├── ITEMS-DESIGN.md       ← Deep item system design (21 combined, 12 ability, 6 mythic, enhancement, gems)
├── PROGRESSION-DESIGN.md ← Deep progression/economy design (currencies, stamina, daily loop, prestige)
├── CONTENT-DESIGN.md     ← Deep content/meta design (campaign narrative, bosses, endless, arena, lore, pipeline)
├── MISSIONS-DESIGN.md    ← Deep mission/region design (8 regions, locks, encounter mechanics, 8 bosses)
├── PROGRESSION-REWORK.md ← Single-player economy: VE currency, tiered star-up, gacha rates, playtime model
├── HERO-REWORK.md        ← 6 philosophy-based heroes matched to story cast (replaces HERO-SYSTEM-DESIGN.md)
├── T4-EXPANSION.md       ← 6 new T4 units (66 total roster), element/archetype coverage
├── SCOPE.md              ← Prototype scope: core vs future expansion, 6-phase implementation priority
├── BUGS.md               ← Bug tracker for playtesting (critical/high/medium/low + deferred to Unity)
├── STORY-DRAFT-V1.md     ← Story bible: world, characters, 8-region narrative, lore-mechanics bridge
├── STORY-STAGES.md       ← 74-stage story mapping with Unity storytelling tools
├── STORY-BEATS-CATALOG-V2.md ← Story beats catalog V2
├── STORY-STAGES-V2.md    ← Story stages V2
├── Story V2/             ← Chapter-by-chapter prose (8 chapters)
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
1. ~~**Boss reconciliation**~~: RESOLVED — see "Phase 4 — In Progress" section above. Mission bosses supersede content-design bosses. 4 element bosses kept for challenge mode.
2. **Boss feature gating**: Region rewards in prompt 22 gate some features (e.g., R3 reward unlocks Forge L3, R5 unlocks Gem Workshop). Need to verify these are wired into building prereqs.
3. **War Room building**: Current intel mechanic may need rethinking given the region/lock system. Locks already tell the player what to expect.
4. **Grind missions vs regions**: Kept as separate system (procedural grind missions independent of regions).
5. **Stage wave counts**: Defined in prompt 22 with budget scaling guidelines. Exact tuning during implementation.
6. **Enemy composition specifics**: Budget scaling guidelines in prompt 22. Exact tuning during implementation.
7. **Prismatic threshold tuning**: 10-element requires significant investment. Verify grind timeline is acceptable.
8. **Encounter mechanics in Endless Mode**: Should The Abyss use encounter mechanics as floor modifiers? (Deferred until regions merge)
9. **Story/narrative**: Region names defined, mission dialogue TBD (separate session)

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
- **Session 8 (2026-03-17 → 2026-03-18)**: Roster expansion design + Phase 2 implementation prompts + Git init.
  - Expanded roster: 66 base → 132 total (all tiers evolve, fixing T3+ inconsistency)
  - Created prompts 17-20 (5 chunks: systems foundation, unit data, passives+abilities, legendaries, integration)
  - MISSIONS-DESIGN.md created in separate session — reviewed, non-mission info extracted to CONTINUITY.md
  - 9 open design questions captured (boss reconciliation, feature gating, war room, grind missions, etc.)
  - **Claude Code implemented ALL Phase 2 prompts (17, 18, 19a, 19b, 20)**: 6 elements, 9 archetypes, 66+66 units, passive system, legendary abilities, gacha/UI overhaul, save migration v4
  - Git initialized: repo at https://github.com/whcheong2008/gameTft, tagged `v0.2.0-phase1-complete`
  - Created prompt 21 (git-init) for Claude Code handoff
  - Project folder moving out of Dropbox to local directory (GitHub is now the backup)
- **Session 9 (2026-03-18)**: Phase 3 completion + Phase 4 architecture + orchestrator pattern.
  - Completed Phase 3 chunks 5-8: mythic items, item affinity, recipe book, drop tables. Save version v5.
  - Started Phase 4: chapters + captains (chunks 1-2) based on CONTENT-DESIGN.md's 14 missions
  - **Major design conflict discovered**: MISSIONS-DESIGN.md (8 regions, ~47 stages) vs CONTENT-DESIGN.md (14 missions). Resolved: MISSIONS-DESIGN supersedes.
  - Established orchestrator >> workers architecture: Cowork session designs + writes prompts, Claude Code sessions execute in feature branches
  - Boss reconciliation resolved: veil_guardian→veil_warden, 4 element bosses→challenge mode, void_sovereign→rewritten, 6 new bosses added
  - Created prompt 22 (region expansion) and prompt 23 (Phase 5 buildings/quests/achievements)
  - Created feature branches: `feature/phase4-regions`, `feature/phase5-progression` (both at main HEAD `3d5b493`)
  - Updated CONTINUITY.md with all resolution decisions
- **Session 10 (2026-03-18)**: Integration session — orchestrator in Cowork mode.
  - Fixed git push from Cowork VM using GitHub PAT in `keys/github.txt`
  - Added `keys/.gitignore` to prevent token from being committed
  - Rebased (fast-forward merged) both feature branches onto current main
  - Pushed both branches + main to origin
  - **Worker 1** (prompt 22 — regions): Completed on this PC via Claude Code. 1 commit: region-based mission expansion (8 regions, 47 stages, 12 bosses, missions.js rewrite, save v5→v6 migration)
  - **Worker 2** (prompt 23 — progression): Completed and pushed to remote. 1 commit: 3 new buildings (Gem Workshop, Mana Shrine, Bond Hall), daily quests, achievement system, expanded stats tracking
  - Merged both branches into main. Only conflict: save.js (both workers added migration code). Resolved by keeping both — v5→v6 region migration + version-agnostic Phase 5 field additions
  - All syntax checks pass. Main at `d7c9c61`
  - Phase 4 regions + Phase 5 progression both COMPLETE. Endless mode, challenge modes, lore system now unblocked
  - **Prompt 24** (UI wiring + QoL): Region map UI, new building panels, achievements, stats dashboard, combat bonuses wired, team builder sorting, building confirmations, ability/synergy descriptions, removed daily quests + War Room + Training Ground
  - **Prompt 25** (design-only): Synergy rework proposal → SYNERGY-REWORK.md. All 9 archetypes reworked to archetype-scoped buffs at 2/4/6/8 thresholds. Duelist ramping ATK capped at 40%.
  - **Prompt 26** (unit progression): Split units.js → 5 files (core, templates, abilities, bonds, ascension). Added unit XP/levels (1-30), ascension system (Awakened/Exalted/Transcendent), secondary archetypes for all 66 units, unit bonds (19 total), power rating formula, combat benchmark system. Save v6→v7.
  - **Prompt 27** (synergy implementation): All 9 archetype synergies replaced with reworked versions. New combat effects (last-stand, CC spread, death-save, focused shot, spell penetration, etc.) implemented.
  - **Prompt 28** (design-only): Item system redesign → ITEMS-REDESIGN.md. Diablo-style tier × rarity loot with 39 item lines, random affixes, passives at Epic/Legendary.
  - Designed hero system → HERO-SYSTEM-DESIGN.md: 8 heroes with skill trees, B dies R4, fragment R7, availability timeline per region.
  - **Prompt 29** (hero system): LAUNCHED, awaiting completion. Implements heroes.js, hero data, skill trees, combat integration, hero management UI.
  - **Prompt 30** (item rework): WRITTEN, not yet launched. Depends on prompt 29. Replaces items.js with RPG equipment + Diablo loot.
  - **Still to discuss**: ~~Progression/balance~~ (DONE — see Session 11), hero system alignment to story
  - Main at `bc06c9b`. Story being developed in separate session (STORY PLAN.md, STORY-DRAFT-V1.md)
- **Session 11 (2026-03-19)**: Progression rework + story integration.
  - **Progression economy rework** → PROGRESSION-REWORK.md:
    - Gold renamed to **Veil Essence** (harvested from Voidspawn). Currency has narrative justification.
    - Hub renamed to **Camp** with **practices** (not buildings). Practices mapped to lore: Attunement Rite (summoning), Sustained Bonds (team size), Essence Reservoir (storage), Echo Shaping (crafting), Deep Resonance (evolution), Prism Focus (gems), Veil Wellspring (ambient power), Kindred Circle (bonds).
    - Roll cost: 50 VE single, 450 VE 10-rite (was ~5g)
    - **Tiered star-up**: T1=3, T2=4, T3=5, T4=8, T5=10 copies/star (was flat 10). 3 stars to evolve.
    - **T4 expanded to 12 units** (was 6). 6 new T4 units needed (suggest 2 Lightning + 2 Force + 1 Fire + 1 Water).
    - Total units: 66 (was 60). Total with evolved: 132.
    - **Team size**: Start 3, +1 at L4/L8/L12/L16, Sustained Bonds upgrade at L17 → max 8 (was start 2, +1/2 levels, max 9).
    - **Stages per region**: 9-9-9-9-10-10-10-8 = 74 total (was ~47).
    - Gacha rates gated by player level (not region). T5 enters at L15 (~2%), caps at 10% at L20.
    - XP diminishing returns for overleveled content. No hard region locks.
    - Campaign total: ~71,650 VE, ~637 rites, ~10 hr first clear, ~30-35 hr total with post-game.
    - Removed: stamina, gems, daily quests, weekly quests (all live-service artifacts).
  - **Story updates** (STORY-DRAFT-V1.md):
    - Added Lore-Mechanics Bridge section mapping all game systems to story world
    - Added Veil Crystal (roster = dormant Echoes), Veil Essence (currency), Attunement Rite (summoning) terminology
    - False cosmology reworked: Luminous Plane vs Void (two separate dimensions) is the false understanding. Truth: one Otherside, one opening.
    - Clue 2 (R2) redesigned: Triple-buried among genuine ancient mistakes. Wellspring discovery (future Nexus) is the scene's focus, hiding the "Veilcrossers" clue in plain sight.
    - R5 opening updated: Otho connects Wellspring from R2 to seal theory — feels earned, not contrived.
    - Design notes section expanded with false cosmology analysis and clue escalation breakdown.
  - **Hero system deferred**: 8 placeholder heroes don't match story cast (Kael, Lyric, Senna, Otho, Mira, Voss). Will redesign after story is finalized. Prompt 29 (hero implementation) may need revision.
  - **Open design items**: 6 new T4 unit designs, hard mode details, hero system alignment to story, exact XP curve tuning
  - **T4 Expansion** → T4-EXPANSION.md:
    - 6 new T4 units designed (one per element, covering all 4 missing archetypes at T4):
      - Ashen Watcher (Fire/Sage/Healer), Abyssal Guardian (Water/Guardian/Tank), Grove Warden (Earth/Ranger/Archer)
      - Tempest Weaver (Wind/Sorcerer/Mage), Voltfang Stalker (Lightning/Predator/Assassin), Iron Duelist (Force/Duelist/Warrior)
    - All 9 archetypes now represented at T4. Every element has exactly 2 T4 units.
    - Full specs: stats, innate passives, abilities, evolved forms, secondary archetypes, 3 new bonds.
    - Total roster: 66 base → 132 with evolved.
  - **Hero Rework** → HERO-REWORK.md:
    - 6 heroes (down from 8), matched to story Resonants: Kael, Lyric, Ren, Sera, Maren, Voss.
    - Philosophy-based design: heroes are playstyle modifiers, not role amplifiers. Kael on a Mage = protector-mage.
    - Kael (Protection), Lyric (Efficiency), Ren (Steadfast), Sera (Precision), Maren (Sustain), Voss (Momentum).
    - Lyric's death is permanent — no fragment system. Voss in R7 is a different philosophy, not a replacement.
    - 5 heroes for 8 team slots = 3 units without heroes/items. Meaningful team-building constraint.
    - R4 power dip: 5→2 heroes (Kael + Ren only). Mechanically devastating, matches story.
    - Full skill trees (2 branches × 5 tiers × 2 choices per tier, 20 levels). Tier costs: 1/1/2/4/5. Capstone (5pt) + other branch T4 (4pt) = impossible at 20pt budget — forces real build choices.
  - **Prompts 31-33 executed**: All implemented successfully on main. Prompt 30 (items) also executed.
  - **Prompt 29 VERIFIED**: heroes.js matches HERO-REWORK.md — 6 heroes, correct names, tier costs 1/1/2/4/5, 48×T1 + 24×T3 + 24×T4 + 12×T5 nodes. Vestigial `getFragmentSkillEffects()` stub (returns {}) — harmless.
  - **XP curve VALIDATED**: Simulated 74-stage playthrough. All 8 regions hit target levels exactly. Monotonically increasing. Hard level caps added (R1→L4, R2→L7, ..., R7-R8→L20). Diminishing returns verified (20 extra R3 stages → still only L12).
  - **Bug tracker created**: BUGS.md for playtesting. Critical = fix now, else defer to Unity.
  - **Git committed and pushed**: Main at `e935f73`, tagged `v0.5.0-session11-complete`. 42 files, +14,766/-3,504 lines.
  - **Prototype is PLAYABLE**: All core systems implemented (progression, heroes, T4 units, stages, items). Ready for smoke testing.

### Prototype Status — Ready for Testing

**All core systems implemented:**
- [x] Combat engine (grid, movement, mana, abilities, status effects, bosses, speed controls)
- [x] Unit system (66 base + 66 evolved = 132 units, 6 elements, 9 archetypes)
- [x] Hero system (6 philosophy heroes, skill trees, item gating)
- [x] Item system (Tier×Rarity loot, 8 equipment slots, Echo Shaping, enhancement, gems)
- [x] Progression (VE economy, tiered star-up, team size 3→8, XP curve, hard level caps)
- [x] Stages (74 stages across 8 regions, boss encounters, lock system)
- [x] Gacha (level-gated rates, T5 at L15, pity system)
- [x] Buildings/Camp (practices replacing buildings, lore-appropriate names)

**Not implemented (deferred to Unity):**
- Story content (cutscenes, dialogue, environmental storytelling)
- Hard mode stages
- Endless mode / challenge modes
- Visual/audio polish (sprites, VFX, music)
- Many hero skill node combat effects (placeholder `function(unit, hero) {}`)

**Known issues before testing:**
- Some UI may still reference "gold" instead of "Veil Essence"
- Fragment stub in heroes.js (harmless)
- Phase 2 never smoke-tested
- Boss reconciliation between prompt 15 and MISSIONS-DESIGN.md may cause issues

### Next Steps

1. **Playtest the HTML prototype** — smoke test all systems, log bugs in BUGS.md
2. **Fix game-breaking bugs** — anything that prevents progression or crashes
3. **Unity planning session** — engine decisions, porting strategy, story integration architecture
4. **Hard mode design** (KIV — keep in view, not blocking)
5. **Balance pass** — after playtesting reveals feel issues

# Auto Battler V2 — Gacha Progression Game Design

## Vision
A single-player gacha auto-battler with persistent progression, built in JavaScript for the browser. Players build a permanent collection of units through gold-based rolling, upgrade them by collecting copies, and deploy pre-set teams into story and grind missions. Features a hub/base with upgradable buildings, deep 4-layer unit taxonomy, and the same synergy-driven combat engine from V1.

**Key pivot from V1**: No longer an ephemeral single-run roguelike. Units, upgrades, and progress persist across sessions. The game loop shifts from "survive rounds" to "collect, upgrade, progress through missions."

---

## Core Gameplay Loop
```
Hub → Roll for Units → Build Teams → Deploy to Mission → Combat (multi-wave) → Rewards → Upgrade/Repeat
```
1. **Hub**: Navigate buildings, manage resources, select missions
2. **Roll**: Spend gold to roll for new units (gacha), collect copies to star-up
3. **Team Build**: Assemble a team from your roster, place on board, optimize synergies
4. **Mission**: Deploy pre-set team into multi-wave auto-combat encounter
5. **Rewards**: Earn gold, XP, and possibly items based on performance (star rating)
6. **Progression**: Level up, unlock stronger unit tiers, upgrade buildings, push harder content

---

## Player Progression

### Player Level (1–20)
- Tied to mission completion (story missions grant level XP)
- Higher level unlocks higher-tier units in the gacha pool
- Team size scales: 1 unit per 2 player levels (max 5 at level 10), plus building bonuses

### Team Size
| Player Level | Base Slots | Max with Buildings |
|-------------|------------|-------------------|
| 1–2         | 1          | 3                 |
| 3–4         | 2          | 4                 |
| 5–6         | 3          | 5                 |
| 7–8         | 4          | 6                 |
| 9–10        | 5          | 7                 |
| 11–20       | 5          | 7                 |

Buildings can add up to +2 team slots at maximum upgrade level.

---

## Unit Collection & Gacha

### Rolling
- Simple gold-based rolls (spend gold → get a random unit)
- No affinity system in the gacha — pure tier-weighted randomness
- Tier weights determined entirely by player level (1–20)

### Tier Weight Table
| Player Level | Cost 1 | Cost 2 | Cost 3 | Cost 4 | Cost 5 |
|-------------|--------|--------|--------|--------|--------|
| 1–3         | 80%    | 20%    | 0%     | 0%     | 0%     |
| 4–6         | 55%    | 30%    | 15%    | 0%     | 0%     |
| 7–9         | 35%    | 30%    | 25%    | 10%    | 0%     |
| 10–13       | 20%    | 25%    | 30%    | 20%    | 5%     |
| 14–17       | 10%    | 20%    | 30%    | 25%    | 15%    |
| 18–20       | 5%     | 15%    | 25%    | 30%    | 25%    |

### Star-Up System (Persistent)
- Requires **10 copies** of a unit to increase its star level by 1
- Star levels are uncapped (practically limited by copy availability)
- Stat scaling: `base_stat × 1.8^(stars-1)` (same formula as V1)
- Copies are consumed on star-up (not merged like V1's 3-copy auto-merge)
- Duplicate units go into a copy counter per unit type

### Unit Roster
Reuses the full V1 roster:
- **22 base units** across 4 elements (Fire, Water, Earth, Wind) and 6 archetypes
- **16 evolved forms** with unique combat abilities
- Evolution criteria still apply (star thresholds, synergy counts, etc.)
- Evolved forms are unlocked by meeting criteria, not rolled directly

---

## Unit Taxonomy (4 Layers) — Unchanged from V1

### 1. Type (Combat Behavior)
Tank, Warrior, Assassin, Archer, Mage, Healer — same targeting and stat profiles.

### 2. Archetype (Synergy Group)
Guardian, Striker, Predator, Mystic, Vanguard, Sage — same tiered bonuses at 2/4/6.

### 3. Element (Damage Type)
Fire > Wind > Earth > Water > Fire — same 1.3x/0.7x multipliers.

### 4. Class (Evolution)
16 evolution paths via the **Evolution Lab** building. Evolution is a deliberate player action — not automatic at combat start. Evolved units become separate collection entries. See "Evolution Lab" section below.

---

## Hub & Base System

### Buildings
The hub is the player's persistent base with upgradable buildings.

| Building | Function | Max Level | Upgrade Effect |
|----------|----------|-----------|---------------|
| Barracks | Team slot capacity | 5 | +1 team slot at level 2, +2 at level 5 |
| Summoning Circle | Unit rolling | 5 | Multi-roll discount, pity system at levels 4-5 |
| Training Ground | Mission XP bonus | 5 | +10% XP per level (up to +50%) |
| Warehouse | Gold bonus + item slots | 5 | +5% gold per level, +2 item slots per level (10→20) |
| War Room | Mission intel | 3 | Enemy unit count → types/elements → full stats |
| Evolution Lab | Unit evolution | 3 | Unlock evolution, then 25%/50% cost reduction |
| Forge | Item crafting | 5 | Reroll → Disassemble → Transmute → Set Craft → Advanced Craft |

Buildings are upgraded with gold.

### Hub Navigation
- Central hub screen showing all buildings
- Click a building to enter its interface
- Visual upgrades as buildings level up (cosmetic progression)

---

## Mission System

### Mission Types
1. **Story Missions**: Linear progression, grant player XP, unlock new content. Each has a unique enemy composition and difficulty. Cannot be repeated for rewards once completed (but can be replayed for practice).

2. **Grind Missions**: Repeatable missions with randomized enemy waves. Primary source of gold, items, and unit copies. Difficulty scales with player level.

### Mission Structure
- Each mission consists of **multiple waves** (2–5 waves per mission)
- Player deploys a **pre-set team** at the start
- Between waves: player can **swap unit positions** (but not change which units are deployed)
- All units heal to full HP between waves
- Star rating (1–3 stars) based on: units surviving, total damage taken, speed of completion

### Enemy Composition
- Story missions 1–7: procedurally generated from budget/maxCost/count constraints
- Story missions 8–11: element-biased enemies (70% from biased element) with archetype preferences
- Story missions 12–14: enemies get archetype synergy bonuses AND element synergy bonuses, some enemies evolve
- Grind missions: procedurally generated, with element bias at level 10+, enemy synergies at 14+, enemy evolutions at 18+

### Enemy Synergies & Evolutions (Missions 12+)
- Enemy teams have their archetype/element counts calculated just like the player's
- `applySynergyBonuses` is called on enemy units with their own archetype counts
- `applyEnemyElementBonuses` applies Fire burn, Earth shields/DR, Wind speed/dodge to enemies
- Enemy evolution: eligible enemies get star-boosted to 2 and run through `checkEvolution` with a fake game-state containing enemy synergy counts
- Evolved enemies display golden glow in combat grid (same visual as player evolutions)

### Rewards
| Star Rating | Reward Multiplier |
|-------------|------------------|
| 1 star      | 1.0x base reward |
| 2 stars     | 1.5x base reward |
| 3 stars     | 2.0x base reward |

Rewards include: gold, player XP, random unit copies, and occasional items.

---

## Combat System — Adapted from V1

### What Stays the Same
- Real-time auto-combat with requestAnimationFrame
- Type-based targeting (assassins → furthest, healers → lowest-HP ally, others → nearest)
- Sticky targeting with chase timeout and retarget logic
- Element damage multipliers (1.3x/0.7x rock-paper-scissors)
- Archetype synergy bonuses (calculated from the deployed team)
- All 16 evolved abilities
- Shield mechanics, crit chance, damage reduction
- Damage formula: `base_attack × element_multiplier × synergy_bonuses × (1 - damage_reduction)`

### What Changes
- **No shop between rounds** — team is pre-set before the mission starts
- **Multi-wave**: After clearing a wave, the next wave spawns. Units reset HP between waves.
- **Position swapping**: Between waves, player can rearrange unit positions (drag-and-drop)
- **No economy during combat** — no gold income, no buying mid-mission
- **No leveling during combat** — team size is fixed for the duration

### Pre-Set Team Deployment
1. Player selects units from their roster in the Team Builder
2. Places them on the 4×7 grid (same board as V1)
3. Synergies are calculated from the placed team
4. Team is locked once the mission starts (only positions can change between waves)

---

## Economy

### Gold Sources
- Mission completion rewards (primary)
- Star rating bonuses
- Selling duplicate unit copies: `copiesCount × unitCost × 3` gold per copy
- Daily login bonuses (future)

### Gold Sinks
- Gacha rolls (primary sink)
- Building upgrades
- Star-up costs (potential — may require gold in addition to copies)

### Balance Target
- A typical grind mission should yield enough gold for 2–3 rolls
- Building upgrades should feel like meaningful investments (save up over multiple missions)
- Star-up should feel rewarding but not trivial — getting 10 copies of a specific unit takes time

---

## Item System — Phase 2

### Overview
8 base components and 8 combined recipes. Every component has a **rarity** (Standard, Uncommon, Rare, Epic) that affects stat values. Combined items track both component rarities — each contributes its bonus independently.

### Rarity Tiers
| Rarity | Color | Stat Bonus | Base Drop Weight |
|--------|-------|-----------|-----------------|
| Standard | #aaa (white) | +0% | 60% |
| Uncommon | #44bb44 (green) | +12% | 25% |
| Rare | #4488ff (blue) | +25% | 12% |
| Epic | #aa44ff (purple) | +50% | 3% |

Combined item stat formula: `baseStats × (1 + comp1Bonus + comp2Bonus)`
- Standard+Standard = 1.0x, Rare+Standard = 1.25x, Epic+Epic = 2.0x

### Components (8)
BF Sword (+15 ATK), Chain Vest (+200 HP), Giant's Belt (+300 HP), Recurve Bow (-0.1 atkSpd), Needlessly Large Rod (+20 ATK), Negatron Cloak (+10% DR), Sparring Gloves (+10% crit), Tear of the Goddess (+20% heal power)

### Combined Recipes (8)
- **Infinity Edge** (BF+BF): +30 ATK, +25% crit
- **Blade of the Ruined King** (BF+Bow): +15 ATK, 3% target max HP on-hit
- **Titan's Resolve** (Vest+Cloak): +200 HP, +15% DR
- **Warmog's Armor** (Belt+Belt): +600 HP, 2% max HP regen/s
- **Rapid Firecannon** (Bow+Bow): -0.2 atkSpd, +1 range
- **Archangel's Staff** (Rod+Tear): +20 ATK, +30% heal power, heals deal 20% as damage
- **Hand of Justice** (Gloves+BF): +15 ATK, +10% crit, heal 10% max HP on kill
- **Dragon's Claw** (Cloak+Cloak): +25% DR, +20% element resist

### Equipment Rules
- 3 item slots per unit
- Components can be unequipped (return to bench). Combined items are permanent.
- Auto-combine: equipping a 2nd matching component onto a unit triggers recipe crafting
- Item bench: 10 slots for unequipped items

### Item Drops
- 1 guaranteed component drop per mission completion
- 3-star rating grants +1 bonus drop
- Rarity distribution shifts with mission difficulty (higher = better) and star rating (3-star = better)

### Item Selling
- Components: 5g × rarity multiplier (standard ×1, uncommon ×2, rare ×4, epic ×8)
- Combined items: sum of component values × 1.5
- Set items: combined value × 2
- Ability items: 100g flat

---

## Evolution Lab — Phase 2.5

### Overview
The Evolution Lab is a hub building that lets players evolve 3-star base units into powerful new forms. Evolved units become **separate collection entries** — the base unit is preserved.

### How It Works
1. Build the Evolution Lab (300g)
2. Select a base unit that meets all requirements (currently: 3-star)
3. Pay gold cost: `50 × base unit cost` (reduced at lab levels 2-3)
4. The evolved unit appears as a new entry in the collection at 1-star
5. Base unit remains in collection at its current star level (not consumed)

### Evolved Unit Star-Up
- Evolved units need copies to star up, just like base units (10 copies per star)
- Evolved copies appear in gacha rolls at **15% chance** when rolling the base unit's cost tier, but ONLY if the player already owns the evolved form
- This makes evolved units harder to max — they require the initial evolution investment plus ongoing gacha luck

### Evolution Requirements
Data-driven `requirements` array on each evolution path. Currently all use `{ type: 'stars', min: 3 }`. Extensible for future requirement types (synergy counts, specific items, mission completions, etc.).

### Evolution Lab Levels
| Level | Cost | Effect |
|-------|------|--------|
| 1 | 300g | Unlock evolution (base cost: 50g × unit cost) |
| 2 | 800g | Evolution cost reduced by 25% |
| 3 | 2000g | Evolution cost reduced by 50% |

### Enemy Evolution
Enemies still use the old in-combat evolution system via `checkEnemyEvolution()`. Enemy evolution ignores player building requirements — enemies evolve based on star level alone during mission generation.

---

## Forge & Special Items — Phase 2.5

### Forge Building (5 Levels)
| Level | Cost | Unlocks |
|-------|------|---------|
| 1 | 200g | Reroll Rarity: change a component's rarity tier |
| 2 | 500g | Disassemble: break combined items into components |
| 3 | 1000g | Transmute: convert one component type into another |
| 4 | 2000g | Set Crafting: forge set items using Essences |
| 5 | 4000g | Advanced Crafting: forge ability items and evolution-gated items |

### Forge Operations
- **Reroll** (Level 1+): Pay gold (10/20/40/80g by current rarity), reroll component to new random rarity
- **Disassemble** (Level 2+): Pay 15g, break combined item into 2 components with original rarities. Needs 1 free bench slot.
- **Transmute** (Level 3+): Pay 25g, convert component type to any other. Keeps rarity.
- **Set Craft** (Level 4+): Pay 50g + 1 Essence + 1 combined item → set item
- **Advanced Craft** (Level 5+): Pay 100g + 2 combined items → ability item

### Essence System
Elemental essences (Fire, Water, Earth, Wind) are rare mission drops used as catalysts for set crafting.

**Drop Rates:**
| Mission Level | Base Chance | Double Chance |
|--------------|-------------|---------------|
| 8-10 | 10% | 0% |
| 11-13 | 20% | 5% |
| 14+ | 30% | 10% |

3-star rating adds +15% to base chance and +5% to double chance. Element is biased toward mission's elementBias (70% match).

### Set Items (12 total, 4 element sets)
Each set has 3 items. Equipping 2+ from the same set on your team activates set bonuses for matching-element allies.

**Inferno Set** (Fire): +20% ATK to fire allies | 3-piece: +burn DPS
**Tidal Set** (Water): +15% max HP to water allies | 3-piece: +HP regen
**Gaia Set** (Earth): +15% DR to earth allies | 3-piece: +150 shield
**Tempest Set** (Wind): +20% attack speed to wind allies | 3-piece: +10% dodge

Set items are crafted from a specific combined item + matching elemental essence at Forge Level 4+.

### Ability Items (7 total)
Powerful items with unique combat abilities, crafted from 2 combined items at Forge Level 5+.

**Standard Ability Items (any unit):**
- Zhonya's Hourglass: Invulnerable for 2s when HP drops below 25% (once per fight)
- Guardian Angel: Revive with 30% HP on death (once per combat)
- Rabadon's Deathcap: +35% total attack damage
- Bloodthirster: Heal for 15% of damage dealt

**Evolution-Gated Ability Items (evolved units only):**
- Primal Fury: On kill: +10% attack speed, stacks 3 times
- Elemental Core: +25% element advantage damage (1.3x → 1.55x)
- Titan's Heart: Below 50% HP: +20% damage reduction

### Story Milestone Rewards
- Mission 10 (first 3-star): Zhonya's Hourglass
- Mission 13 (first 3-star): Guardian Angel

---

## Technical Architecture

### File Structure (Current)
```
Game TFT/
├── game-v2.html           ← V2 HTML shell + CSS + script tags (active)
├── game.html              ← V1 HTML shell (historical, still playable)
├── js/
│   ├── units.js           ← Unit templates, elements, archetypes, evolutions, ELEMENT_SYNERGIES
│   ├── save.js            ← localStorage persistence, migration, collection/gold/XP helpers
│   ├── gacha.js           ← Gold rolling, tier weights, pity system, Summoning Circle discount
│   ├── teams.js           ← Roster management, team builder, board deployment
│   ├── hub.js             ← Screen management, building definitions, upgrade logic, bonus getters
│   ├── items.js           ← Item system: components, recipes, rarity, forge, set/ability items, essences
│   ├── missions.js        ← 14 story missions, grind generator, wave generation, rewards, essence drops
│   ├── ui-v2.js           ← All V2 screen renderers
│   └── main-v2.js         ← V2 entry point, combat engine, synergy/element application
├── prompts/               ← Coding prompts for Claude Code sessions
├── DESIGN-V2.md           ← This document (authoritative V2 design)
├── CONTINUITY.md          ← Session-to-session dev state
├── DESIGN.md              ← V1 design (historical reference)
└── MECHANICS.md           ← Engine-agnostic mechanics reference (V1)
```

**V2 Script Load Order**: `units.js → save.js → gacha.js → teams.js → hub.js → items.js → missions.js → ui-v2.js → main-v2.js`

### Key Technical Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Persistence | localStorage | Simple, no server needed, works offline |
| Architecture | Modular JS (global scope) | Same as V1, no build step, `<script>` tags |
| Combat | Reuse V1 combat.js | Proven engine, just needs multi-wave wrapper |
| Hub navigation | DOM-based screens | Show/hide different `<div>` sections |
| Gacha | Client-side RNG | Single-player, no need for server-side fairness |

### What Gets Reused from V1
- `units.js` — All unit definitions (unchanged)
- `synergies.js` — Synergy calculation (unchanged)
- `combat.js` — Combat engine (add multi-wave support)
- Element system, star scaling formula, targeting AI

### What Gets Replaced
- `shop.js` → `gacha.js` (no shop during combat, just standalone rolling)
- `economy.js` → Merged into `missions.js` (rewards) and `hub.js` (buildings)
- `enemies.js` → Merged into `missions.js` (mission-specific enemy waves)
- `board.js` → `teams.js` (pre-set teams instead of live board management)

### What's New
- `missions.js` — Mission definitions, wave spawning, reward calculation
- `hub.js` — Building state, upgrade logic, passive bonuses
- `gacha.js` — Gold rolling, tier weights, collection tracking
- `teams.js` — Roster management, team builder, save/load teams
- `save.js` — LocalStorage persistence for all game state

---

## Development Phases

### Phase 1 — Core Persistent Loop ✅ COMPLETE
- [x] Hub screen with 5 upgradable buildings
- [x] Gacha rolling system with tier weights by player level
- [x] Summoning Circle discount + pity system
- [x] Persistent unit roster with star-up (10 copies)
- [x] Team builder (select units, place on 4×7 grid, synergy preview)
- [x] Adapt combat for pre-set team deployment
- [x] Element synergies (Fire/Water/Earth/Wind with unique bonuses)
- [x] Archetype synergies with tiered bonuses
- [x] 7 story missions + procedural grind missions
- [x] Multi-wave combat with position swapping between waves
- [x] Star rating system for missions
- [x] Mission rewards: gold, XP, unit copies
- [x] Building bonuses wired (all 5 buildings functional)
- [x] War Room intel on mission cards
- [x] Evolution system (16 paths, checked at combat start)
- [x] Save/load via localStorage with migration

### Phase 2 — Content & Depth ✅ COMPLETE
- [x] Full building upgrade system
- [x] Grind mission procedural generation
- [x] Item system with rarity tiers (8 components, 8 recipes, 4 rarities, drops, equip UI, combat integration)
- [x] 14 story missions with element-biased compositions, enemy synergies, enemy evolutions (prompt 07)
- [x] Enemy synergies and evolved forms in missions 12+ and high-level grind (prompt 07)
- [x] Sell duplicate units for gold from roster screen (prompt 07)
- [x] Item selling (components + combined items for gold) (prompt 08)
- [x] Warehouse-linked bench expansion (10 base + 2 per level) (prompt 08)
- [x] Unit detail panel (stats, skills, items, evolution, combat behavior) (prompt 08)

### Phase 2.5 — Evolution Rework & Forge (IN PROGRESS)
- [x] Evolution Lab building — evolve 3-star units into separate collection entries (prompt 09)
- [x] Evolved units in roster, team builder, gacha (15% evolved copy chance) (prompt 09)
- [x] Data-driven evolution requirements with extensible format (prompt 09)
- [ ] Forge building (5 levels: reroll, disassemble, transmute, set craft, advanced craft) (prompt 10 — IN PROGRESS)
- [ ] Essence drop system (4 elemental essences from missions 8+) (prompt 10)
- [ ] Set items (4 element sets × 3 items, 2/3 piece combat bonuses) (prompt 10)
- [ ] Ability items (4 standard + 3 evolution-gated, unique combat abilities) (prompt 10)
- [ ] Story milestone rewards (missions 10, 13) (prompt 10)

### Phase 3 — Polish & Balance
- [ ] Combat animations (damage numbers, smooth movement, death effects)
- [ ] Hub visual upgrades (building cosmetics by level)
- [ ] Balance pass on gacha rates, mission rewards, star-up curve
- [ ] Power rating system implementation
- [ ] Mountain Lord taunt ability

### Phase 4 — Graphics & Sound
- [ ] Sprite system (replace emoji with art)
- [ ] Combat visual effects
- [ ] Hub environment art
- [ ] Sound effects and music
- [ ] Screen transitions and juice

---

## Migration Notes (V1 → V2)
- V1's per-round economy (interest, streaks, XP buying) is **removed** — no longer relevant
- V1's shop system is **replaced** by the gacha
- V1's 3-copy merge is **replaced** by 10-copy star-up
- V1's round-based progression is **replaced** by mission-based progression
- V1's player HP / game over is **replaced** by mission success/failure (can retry)
- V1's combat engine is **reused** with a multi-wave wrapper
- V1's unit taxonomy, synergies, elements, evolutions are **fully preserved**

# Auto Battler — Game Design Document

## Vision
A single-player auto-battler loosely inspired by TFT, built in JavaScript for the browser. Features a deep 4-layer unit taxonomy (Type/Archetype/Element/Class), strategic board placement, real-time combat, and criteria-based unit evolution. Designed to eventually support graphics, multiplayer, and publishing.

---

## Core Gameplay Loop
```
Planning Phase → Combat Phase → Results → Next Round
     ↑                                        |
     └────────────────────────────────────────┘
```
1. **Planning**: Buy units from the shop, place/reposition on your board, manage economy, build synergies
2. **Combat**: Units auto-fight the enemy wave in real time — elements, synergies, and evolved abilities all factor in
3. **Results**: Win = safe. Lose = take HP damage based on surviving enemies
4. **Repeat**: Earn income (base + interest), get new shop, prepare for next round

---

## Architecture Overview
```
game.html (single file, no server needed)
├── Element System (Fire/Water/Earth/Wind + damage multipliers)
├── Archetype Synergies (6 archetypes, tiered bonuses at 2/4/6)
├── Class Evolutions (16 criteria-based transformation paths)
├── Unit Definitions (22 base + 16 evolved forms)
├── Star/Upgrade System (uncapped, formula-based, cascading)
├── Board System (4×7 grid per side, 9-slot bench)
├── Shop System (5 cards, refresh, buy XP)
├── Combat Engine (real-time, requestAnimationFrame, element-aware)
├── Enemy Wave Generator (PvE creeps → scaling teams)
├── Synergy Bar UI (active archetype + element display)
└── Game State Manager (HP, gold, level, rounds, synergies)
```

---

## Unit Taxonomy (4 Layers)

Every unit is defined by four independent dimensions:

### 1. Type (Combat Behavior / Role)
Determines how the unit behaves in combat, its stat profile, and its AI targeting.

| Type     | Role                  | Targeting        | Stat Profile              |
|----------|-----------------------|------------------|---------------------------|
| Tank     | Frontline absorber    | Nearest enemy    | Very high HP, low ATK     |
| Warrior  | Balanced melee        | Nearest enemy    | Good HP and ATK           |
| Assassin | Backline diver        | Furthest enemy   | Low HP, fast ATK speed    |
| Archer   | Ranged damage         | Nearest enemy    | Moderate HP, ranged       |
| Mage     | Ranged burst          | Nearest enemy    | Low HP, high ATK, ranged  |
| Healer   | Ally restoration      | Lowest-HP ally   | Low ATK, heals instead    |

### 2. Archetype (Synergy Group)
Field multiple units of the same archetype to activate tiered bonuses. Bonuses apply to ALL your units.

| Archetype | Icon | Thresholds | Bonuses |
|-----------|------|------------|---------|
| Guardian  | 🛡️  | 2 / 4 / 6 | +150/350/600 HP. Gold tier adds 10% damage reduction |
| Striker   | ⚔️  | 2 / 4 / 6 | +15/30/50% ATK. Gold tier adds 10% crit chance |
| Predator  | 🐾  | 2 / 4    | +20/40% attack speed |
| Mystic    | 🔮  | 2 / 4    | +20/40% elemental damage. Silver adds 15% element resist |
| Vanguard  | 🏰  | 2 / 4    | Front 2 rows: +200/450 HP, +10/25 ATK |
| Sage      | 📖  | 2 / 4 / 6 | +30/60/100% heal power. Silver adds HP regen. Gold adds ally revive |

### 3. Element (Damage Type + Resistance)
Determines the elemental flavor of attacks. Follows a rock-paper-scissors cycle.

| Element | Icon | Strong vs | Weak vs | Multiplier |
|---------|------|-----------|---------|------------|
| Fire 🔥 | 🔥  | Wind      | Water   | 1.3x / 0.7x |
| Water 💧| 💧  | Fire      | Earth   | 1.3x / 0.7x |
| Earth 🌿| 🌿  | Water     | Wind    | 1.3x / 0.7x |
| Wind 💨 | 💨  | Earth     | Fire    | 1.3x / 0.7x |

Units display a colored border glow matching their element. Element count is shown in the synergy bar. Future: element synergy bonuses at thresholds, mixed/dual elements.

### 4. Class (Evolution / Promotion)
Units can evolve into a stronger form when specific criteria are met. Evolution is checked on buy, merge, place, and round start.

**Criteria types**:
- Star threshold (e.g., reach 3-star)
- Synergy count (e.g., have 4+ Guardians active on board)
- Combinations (e.g., reach 2-star AND have 2+ Sages)

**On evolution**: Unit transforms in-place, keeping its star level and board position. Gets new name, new base stats (re-scaled by current stars), and a unique combat ability.

---

## Unit Roster

### Base Units (22 — appear in shop)

| Unit | Cost | Type | Archetype | Element | Evolves Into |
|------|------|------|-----------|---------|--------------|
| Flame Warrior | 1 | Warrior | Striker | Fire | Fire Berserker |
| Ember Scout | 1 | Assassin | Predator | Fire | Flame Rogue |
| Magma Knight | 2 | Tank | Guardian | Fire | Volcano Titan |
| Pyromancer | 3 | Mage | Sage | Fire | Inferno Mage |
| Tide Hunter | 1 | Warrior | Vanguard | Water | Tsunami Blade |
| Frost Archer | 1 | Archer | Striker | Water | Ice Sniper |
| Coral Priest | 2 | Healer | Sage | Water | Ocean Sage |
| Hydro Mage | 2 | Mage | Mystic | Water | Abyssal Mage |
| Stone Guard | 1 | Tank | Guardian | Earth | Mountain Lord |
| Vine Archer | 2 | Archer | Predator | Earth | Thorn Ranger |
| Earth Shaman | 2 | Healer | Sage | Earth | Gaia Priest |
| Golem | 3 | Tank | Vanguard | Earth | Titan |
| Zephyr Scout | 1 | Assassin | Predator | Wind | Storm Assassin |
| Wind Archer | 1 | Archer | Striker | Wind | Gale Sniper |
| Storm Mage | 2 | Mage | Mystic | Wind | Tempest Wizard |
| Sky Knight | 2 | Warrior | Guardian | Wind | Aegis Paladin |
| Fire Dragon | 4 | Mage | Striker | Fire | — |
| Leviathan | 4 | Tank | Guardian | Water | — |
| Phoenix | 5 | Mage | Sage | Fire | — (revives at 50% HP) |
| World Tree | 5 | Healer | Sage | Earth | — (heals ALL allies) |

### Evolved Forms (16 — not in shop, obtained via evolution)

| Evolved Unit | Ability |
|-------------|---------|
| Fire Berserker | Higher base stats (burn approximation) |
| Flame Rogue | Targets backline (assassin type) |
| Volcano Titan | 200 AoE fire damage on death |
| Inferno Mage | Splash damage to adjacent enemies |
| Tsunami Blade | Stacking move speed slow on targets |
| Ice Sniper | Stun every 3rd attack |
| Ocean Sage | Heals also grant 50 shield |
| Abyssal Mage | +25% damage vs tanks |
| Mountain Lord | Taunt (planned — adjacent enemies forced to target) |
| Thorn Ranger | 15 reflect damage to attackers |
| Gaia Priest | Heals 2 lowest-HP allies at once |
| Titan | Every 4th attack stuns all adjacent enemies |
| Storm Assassin | 50 chain damage to nearest enemy on kill |
| Gale Sniper | Ignores 20% of target's damage reduction |
| Tempest Wizard | Attacks bounce to 1 extra target |
| Aegis Paladin | Combat start: +100 shield to all allies |

---

## Other Systems

### Star Upgrade System (Uncapped)
- 3 copies of the same unit at star level N → 1 unit at star level N+1
- Stat scaling: `base_stat × 1.8^(stars-1)` per level
- Sell value: `cost × 3^(stars-1)` to reflect invested units
- Cascading: merges chain upward automatically
- No cap — practically limited by economy and shop RNG

### Economy
- **Base income**: 5 gold/round
- **Interest**: +1 gold per 10 saved (max +5)
- **Refresh**: 2 gold for new shop
- **Buy XP**: 4 gold for 4 XP
- **Free XP**: 2 per round

### Leveling
- Level determines **unit cap** (units allowed on board = level)
- XP thresholds: 2, 4, 8, 12, 20, 32, 48, 68
- Max level: 9
- Higher level unlocks higher-cost units in the shop

### Shop
- 5 unit cards per roll, showing element icon, archetype icon, and type
- Unit pool weighted by player level (higher level = higher cost units appear)
- Buying a unit that would create 3 copies auto-merges into star upgrade
- Evolved forms never appear in shop

### Combat (Real-Time)
- Units find targets based on Type (assassins → furthest, others → nearest)
- Move toward target if out of range
- Attack when in range (cooldown-based)
- Damage formula: `base_attack × element_multiplier × synergy_bonuses × (1 - damage_reduction)`
- Shield absorbs damage before HP
- Crit chance from Striker synergy (1.5x damage)
- Healers heal instead of dealing damage (target lowest-HP ally)
- HP regen from Sage synergy
- Evolved abilities trigger during combat (splash, chain, stun, reflect, etc.)

### Enemy Waves
- Rounds 1-3: Fixed PvE creeps (Slimes, Wolves) — no element/archetype
- Round 4+: Randomly generated teams from SHOP_POOL_KEYS with scaling gold budget
- Round 8+: Enemies can have 2-star units (30% chance each)
- Max enemy cost scales with round: R4-5 = cost 2, R6-9 = cost 3, R10-14 = cost 4, R15+ = cost 5

### Damage on Loss
- `2 + (surviving_enemies × 2)` HP damage to player
- Player starts with 100 HP
- HP reaches 0 = Game Over

---

## Development Phases

### Phase 1 — Minimal Core ✅ COMPLETE
- [x] HTML/CSS game board with grid layout
- [x] Basic unit types with shop, bench, board placement
- [x] Uncapped star upgrades with cascading merges
- [x] Real-time combat simulation
- [x] Gold economy with interest, XP/leveling
- [x] PvE enemy waves with scaling difficulty
- [x] Game over + restart, tooltips, combat log

### Phase 2 — Depth & Identity (IN PROGRESS)
- [x] **4-Layer Unit Taxonomy**: Type, Archetype, Element, Class
- [x] **22 Base Units + 16 Evolved Forms** across all 4 elements
- [x] **Archetype Synergy System**: 6 archetypes with tiered bonuses (2/4/6)
- [x] **Element Damage System**: Rock-paper-scissors with 1.3x/0.7x multipliers
- [x] **Class Evolution System**: 16 criteria-based evolution paths
- [x] **16 Evolved Combat Abilities**: Splash, chain, stun, shield, reflect, etc.
- [x] **Type-Based AI**: Assassins dive backline, healers target lowest-HP ally
- [x] **Synergy Bar UI**: Shows active archetypes and element counts
- [x] **Enhanced Tooltips**: Show all 4 tags, evolution progress, ability descriptions
- [ ] **Item System**: Items drop from PvE rounds, equippable, combinable
- [ ] **Mixed Element Units**: Combine units of different elements to create hybrids
- [ ] **Mountain Lord Taunt**: Targeting override for adjacent enemies
- [ ] **Win/Loss Streak**: Bonus gold for consecutive results
- [ ] **Balance Pass**: Playtesting and number tuning

### Phase 3 — Progression & Meta
- [ ] **Player Profile**: Persistent stats across runs
- [ ] **Unlock System**: Start small, unlock new units/traits through achievements
- [ ] **Rare/Legendary Items**: Only found in later PvE rounds
- [ ] **Difficulty Modes**: Easy / Normal / Hard
- [ ] **Challenges**: Special rule modifiers

### Phase 4 — Graphics & Polish
- [ ] **Sprite System**: Replace emoji with pixel art or drawn sprites
- [ ] **Combat Animations**: Projectiles, hit effects, death animations
- [ ] **UI Overhaul**: Drag-and-drop, animated transitions, particles
- [ ] **Sound Effects & Music**
- [ ] **Screen Shake & Juice**

### Phase 5 — Multiplayer & Publishing
- [ ] **Lobby System**: Match 2-8 players
- [ ] **Shared Unit Pool**: Contested drafting
- [ ] **PvP Combat**: Fight other players' boards
- [ ] **Leaderboards**: Ranked play, seasonal resets
- [ ] **Deployment**: Web hosting, Electron/Tauri for desktop

---

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Language | JavaScript | Browser-native, no build step, easy to iterate |
| Structure | Single HTML file | No server needed, open directly, easy to share |
| Combat | requestAnimationFrame | Smooth real-time sim at 60fps |
| State | In-memory objects | Simple, sufficient for single-player |
| Future: Multiplayer | WebSockets | Natural fit for JS, real-time |
| Future: Graphics | HTML Canvas or PixiJS | 2D rendering, sprite support |

---

## File Structure
```
Game TFT/
├── game.html          ← Main playable game (single file, source of truth)
├── DESIGN.md          ← This document
├── CONTINUITY.md      ← Session-to-session dev state
├── js/                ← Original modular source (STALE — not maintained)
└── css/               ← Original CSS (STALE — not maintained)
```

---

## Open Questions
- What theme/identity should the game have? (Currently generic fantasy with emoji)
- How should the item system work? (Equippable slots? Auto-combine components?)
- How should mixed/dual element units be created? (Combine on bench? Special recipe?)
- Should element synergies have their own threshold bonuses (e.g., 3 Fire = burn AoE)?
- Should enemies eventually use synergies and evolutions too?
- What does the win condition look like for a full run? (Survive N rounds? Beat a boss?)

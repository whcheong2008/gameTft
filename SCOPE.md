# Scope — Single-Player Marketing Prototype

> This document defines what goes into the prototype vs. what's future expansion. The five design docs (COMBAT, UNITS, ITEMS, PROGRESSION, CONTENT) contain the full vision for a publishable game. This document filters that vision into an achievable single-player prototype that proves the core loop.

## Prototype Identity

A **single-player gacha auto-battler** with enough depth to be a complete, satisfying game. Built in a gacha-style architecture so it can be expanded into a live-service game later if the prototype proves the concept. No servers, no multiplayer, no IAP — just a polished single-player experience.

**Target experience**: 20–40 hours of meaningful gameplay before a player "completes" the core content. Ongoing engagement via endless mode and collection goals.

---

## COMBAT-DESIGN.md — Almost Entirely Core

| System | Status | Notes |
|---|---|---|
| 4×7 grid, movement, pathfinding (BFS) | **CORE** | Heart of the game |
| Mana system, ability casting | **CORE** | Defines combat depth |
| 38 base unit abilities + 24 evolved abilities | **CORE** | What makes units feel unique |
| Status effects (stun, burn, poison, etc.) | **CORE** | Creates counterplay |
| Damage pipeline (7-step) | **CORE** | Ensures consistent math |
| Element/archetype synergy integration | **CORE** | Existing system, expand |
| Boss fight framework (2×2 grid, phases, telegraphs) | **CORE** | Endgame content |
| Speed controls (1×, 2×, 4×) | **CORE** | QoL |
| Visual effects (damage numbers, ability VFX) | **CORE** | Polish |
| Combat pacing (engage → abilities → cleanup) | **CORE** | Defines game feel |
| Diminishing returns on CC | **CORE** | Balance |
| Appendix B edge cases | **CORE** | Implementation spec |

**Nothing deferred.** The combat system is the game. Implement it fully.

---

## UNITS-DESIGN.md — Mostly Core

| System | Status | Notes |
|---|---|---|
| 38 base units (22 existing + 16 new) | **CORE** | Full roster for launch |
| 24 evolved forms (16 existing + 8 new) | **CORE** | Depth for engaged players |
| Innate passives (all 62 units) | **CORE** | Makes each unit feel unique |
| Star-up system (10 copies, 1.8× scaling) | **CORE** | Existing system |
| Evolution Lab (deliberate player action) | **CORE** | Existing system |
| Element×archetype coverage grid | **CORE** | Design tool |
| Unit bonds (6 duos, 3 cross-element, 4 trios) | **CORE** | Adds team-building depth cheaply |
| 8 designed team compositions | **CORE** | Player guidance |
| Ascension system (Awakened/Exalted/Transcendent) | **FUTURE** | Too grindy for prototype scope — implies 200+ copies per unit. Add post-launch if retention justifies it. |
| Ascension Shards currency | **FUTURE** | Tied to ascension |
| Ascension visual changes | **FUTURE** | Tied to ascension |

**Key decision**: Cap unit progression at 5★ + evolution for the prototype. Ascension is a live-service retention mechanic — valuable later, but not needed to prove the game is fun.

---

## ITEMS-DESIGN.md — Mostly Core, Trim Endgame Chase

| System | Status | Notes |
|---|---|---|
| 12 components (8 existing + 4 new mana/utility) | **CORE** | Foundation |
| 21 combined recipes | **CORE** | Crafting variety |
| 4 element sets + Arcane set (16 set items total) | **CORE** | Existing system + 1 new set |
| 12 ability items (7 existing + 5 new) | **CORE** | Endgame crafting goals |
| Forge operations (reroll, disassemble, transmute, set/ability craft) | **CORE** | Existing system extended |
| Enhancement system (+0 to +10) | **CORE** | Primary gold sink, satisfying progression |
| Enhancement pity system | **CORE** | Prevents frustration |
| Gem socket system (9 types × 4 rarities) | **CORE** | Customization layer |
| Item affinity system | **CORE** | Guides new players, rewards knowledge |
| Recipe book + collection bonuses | **CORE** | Discovery and completionism |
| Mythic items (6) | **TRIMMED** | Keep 3 mythics (Infinity Gauntlet, Aegis of Immortality, Eclipse). Defer the other 3 + World Shard material. Mythics should feel achievable in a single-player game, not a multi-month grind. |
| Mythic materials (Dragon Scale, Void Crystal) | **TRIMMED** | Keep 2 materials, drop World Shard (tied to ascension). Make Dragon Scale a guaranteed boss first-clear reward and Void Crystal a mission 14 3-star reward (100% instead of 15%). |
| Appendix B edge cases | **CORE** | Implementation spec |

**Key decision**: Make mythic items achievable within 20–40 hours of play. Reduce material scarcity — this is single-player, not a live-service grind.

---

## PROGRESSION-DESIGN.md — Heavy Trimming

| System | Status | Notes |
|---|---|---|
| Gold currency (primary) | **CORE** | Existing system |
| Gold income/spend model | **CORE** | Use the numbers but simplify — no need for monthly income projections |
| Player level (XP, level-up rewards) | **CORE** | Keep levels 1–20 (existing). Defer 21–40 extension. |
| Gacha system (pulls, pity, tier weights) | **CORE** | Existing system |
| Duplicate handling (star-up pipeline) | **CORE** | Existing system |
| 7 existing buildings + upgrades | **CORE** | Existing system |
| Gem Workshop (NEW building) | **CORE** | Needed for gem socket system |
| Mana Shrine (NEW building) | **CORE** | Passive bonuses add depth cheaply |
| Bond Hall (NEW building) | **CORE** | Needed for bond system |
| Daily quests (4/day) | **CORE** | Gives structure to sessions |
| Achievements | **CORE** | One-time rewards drive completionism |
| Collection bonuses (recipe book) | **CORE** | Already in ITEMS-DESIGN |
| Power curve model | **CORE** | Reference for difficulty tuning |
| Stamina system | **FUTURE** | Only needed to gate content in a live-service model. Single-player doesn't need artificial gating — let players play as much as they want. |
| Gem (premium) currency | **FUTURE** | No IAP = no premium currency. Fold gem rewards into gold or item rewards instead. |
| Weekly quests | **FUTURE** | Real-time gating doesn't make sense in single-player |
| Weekly boss rotation | **FUTURE** | All bosses available anytime instead |
| Weekly shop | **FUTURE** | Replace with a permanent shop or vendor building |
| Focused pulling (rate-up banners) | **FUTURE** | Live-service mechanic |
| Events (Element Festival, Boss Rush, etc.) | **FUTURE** | Live-service content |
| Prestige system | **FUTURE** | Retention mechanic for 12+ month players |
| Seasonal content / season pass | **FUTURE** | Live-service only |

**Key decisions**:
1. **No stamina**: Players can play unlimited missions. Pacing comes from difficulty, not artificial gates.
2. **No premium currency**: Gold is the only currency. Simplifies everything.
3. **No time-gated content**: All bosses available once unlocked. No weekly rotation. No daily limits on anything except daily quests (which are optional bonus rewards, not gates).
4. **Keep daily quests**: They give players structure ("what should I do today?") even in single-player. They're optional — you can ignore them and just play missions.

---

## CONTENT-DESIGN.md — Core Campaign + Endless, Defer PvP

| System | Status | Notes |
|---|---|---|
| World lore (The Shattered Veil) | **CORE** | Gives the game identity |
| 4-chapter campaign structure | **CORE** | Groups existing 14 missions into narrative arcs |
| Expanded mission descriptions | **CORE** | Low effort, high flavor |
| Named enemy captains (missions 8–14) | **CORE** | Makes mid/late missions memorable |
| Enemy design philosophy (themed compositions) | **CORE** | Already partially implemented |
| Boss: Veil Guardian (Mission 7) | **CORE** | Intro boss, teaches mechanics |
| Boss: Infernal Wyvern (Fire) | **CORE** | First real boss challenge |
| Boss: Tidal Leviathan (Water) | **CORE** | Unique mechanic (regen, whirlpool) |
| Boss: Stone Colossus (Earth) | **CORE** | Tankiest boss, DR puzzle |
| Boss: Storm Phoenix (Wind) | **CORE** | Fastest boss, rebirth mechanic |
| Boss: Void Sovereign (Mission 14) | **CORE** | Final boss, 3-phase epic fight |
| Endless mode (The Abyss) | **CORE** | Post-story endgame. Infinite replayability. |
| Floor modifiers | **CORE** | Variety in endless mode |
| Endless leaderboards | **TRIMMED** | Keep as personal best tracking (no global/server leaderboards). Show "Your best: Floor 47" |
| Challenge modes (Time Trial, Survival, Restricted Roster) | **CORE** | Cheap content that reuses existing missions with new rules |
| Unit lore cards | **CORE** | Collection flavor |
| Bond stories | **CORE** | Reward for using bond pairs |
| Boss dialogue (pre/post fight) | **CORE** | Narrative polish |
| World Codex | **CORE** | Completionist hook |
| Arena (PvP) | **FUTURE** | Requires multiplayer infrastructure |
| Content pipeline (new units every 6 weeks, etc.) | **FUTURE** | Post-launch planning |
| Seasonal events / season pass | **FUTURE** | Live-service only |
| Meta balance philosophy (data-driven) | **FUTURE** | Needs player data — single-player can be balance-tested internally |
| Post-launch story chapters | **FUTURE** | Expansion content |

**Key decision**: All bosses are available as standalone challenge fights once unlocked (no weekly rotation). Endless mode is the primary post-story hook.

---

## Hub & Social (6th Design Doc — NOT NEEDED)

The hub building system already exists in code. The three new buildings (Gem Workshop, Mana Shrine, Bond Hall) are defined in PROGRESSION-DESIGN. Social features are multiplayer-only. **No separate Hub & Social design doc needed for the prototype.**

---

## Prototype Feature Summary

### What the player does

```
Start → Tutorial missions (Ch.1) → Build team, roll gacha, upgrade buildings →
Mid-game missions (Ch.2-3) → Unlock forge, evolve units, craft items →
Late-game missions (Ch.4) → Boss fights, ability items, enhancement grinding →
Post-story → Endless mode (infinite), challenges, mythic crafting, collection completion
```

### By the numbers

| Category | Prototype Scope |
|---|---|
| Story missions | 14 (4 chapters) |
| Boss encounters | 6 (1 story intro, 4 element, 1 final) |
| Base units | 38 |
| Evolved units | 24 |
| Combined items | 21 |
| Ability items | 12 |
| Mythic items | 3 (trimmed from 6) |
| Buildings | 10 (7 existing + 3 new) |
| Gem types | 9 × 4 rarities |
| Endless mode floors | Infinite |
| Challenge modes | 4 types |
| Player level cap | 20 |
| Achievements | ~30 |
| Lore entries | ~80 |

### What's explicitly NOT in prototype

| Feature | Why Deferred |
|---|---|
| Stamina system | Anti-fun in single-player |
| Premium currency (gems) | No IAP, no need |
| Arena / PvP | Requires multiplayer |
| Seasonal events | Requires live service |
| Prestige system | Requires 12+ month retention model |
| Weekly rotation / time-gated content | Artificial scarcity doesn't serve single-player |
| Ascension system (Awakened/Exalted/Transcendent) | Too grindy for prototype; revisit for expansion |
| Rate-up banners | Live-service monetization mechanic |
| Content pipeline cadence | Post-launch planning |
| 3 deferred mythic items | Reduce endgame scope to achievable targets |

---

## Implementation Priority Order

If implementing from the current JS codebase:

### Phase 1: Combat Engine Rebuild
**Source**: COMBAT-DESIGN.md (entire doc)
- Grid-based movement with BFS pathfinding
- Mana system + ability casting for all 62 units
- Status effect framework
- Damage pipeline (7-step)
- Speed controls

This is the biggest single piece of work and the most impactful. Everything else builds on top of a working combat engine.

### Phase 2: Expanded Roster
**Source**: UNITS-DESIGN.md (Sections 1–4, 6–7)
- 16 new base units + 8 new evolutions
- Innate passives for all 62 units
- Unit bonds (data + combat bonus)

### Phase 3: Expanded Items
**Source**: ITEMS-DESIGN.md (all sections, trimmed mythics)
- 4 new components + 13 new recipes
- Arcane set
- 5 new ability items
- Enhancement system (+0 to +10)
- Gem socket system
- 3 mythic items (trimmed)
- Item affinity

### Phase 4: Content & Bosses
**Source**: CONTENT-DESIGN.md (Sections 1–5, 7, 9)
- Chapter UI overlay on existing missions
- 6 boss encounters
- Named enemy captains
- Endless mode (The Abyss)
- Challenge modes
- Lore system (codex, unit cards, bond stories)

### Phase 5: Progression Polish
**Source**: PROGRESSION-DESIGN.md (core sections only)
- 3 new buildings (Gem Workshop, Mana Shrine, Bond Hall)
- Daily quests
- Achievement system
- Collection bonuses (recipe book)

### Phase 6: Visual & Audio Polish
- Sprite system (replace emoji)
- Combat VFX
- Sound effects + music
- UI polish, transitions, animations

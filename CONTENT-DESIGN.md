# Content & Meta — Deep Design Document

> Comprehensive content design for a publishable auto-battler. Covers campaign narrative, enemy design, boss mechanics, endless mode, arena/PvP, content pipeline, lore framework, and meta-game balance philosophy. This document answers the question: "What does the player actually *do* once all the systems exist?"

## Design Goals

1. **Every mission tells a story**: Even grind missions should feel like they belong in the world. The campaign should have a narrative arc that gives context to why the player is fighting.
2. **Difficulty is a design choice, not a number**: Each mission should feel different — not just "more stats." Enemy compositions, boss mechanics, and environmental effects create variety.
3. **Endgame content is infinite**: Players who complete the story need something to do forever. Endless mode, arena, and rotating content keep the game alive.
4. **New content fits the framework**: Adding new units, missions, or events should follow established patterns so the game grows without losing coherence.
5. **Lore enriches, never blocks**: Players who skip lore should have a complete gameplay experience. Players who read lore should find a world worth caring about.

---

## 1. World & Lore Framework

### The World: The Shattered Veil

The world exists in the aftermath of a cataclysm called the **Shattering** — an event that fractured the barrier between the elemental planes and the mortal realm. Raw elemental energy now bleeds through tears in the Veil, warping creatures and empowering those who learn to channel it.

### The Four Elemental Planes

| Plane | Element | Theme | Terrain | Inhabitants |
|---|---|---|---|---|
| **Pyrheim** | Fire | Rage, ambition, transformation | Volcanic wastes, magma rivers, ember forests | Fire warriors driven by conquest |
| **Abyssia** | Water | Patience, depth, inevitability | Deep ocean trenches, coral citadels, tidal caves | Aquatic mystics who manipulate time and tide |
| **Terramund** | Earth | Endurance, stubbornness, growth | Living mountains, crystal caverns, ancient forests | Earth golems and treants that have stood for millennia |
| **Zephyria** | Wind | Freedom, speed, unpredictability | Floating islands, storm currents, sky temples | Wind dancers and assassins who strike unseen |

### The Player's Role
The player is a **Veilwalker** — a rare individual who can bond with creatures from all four planes simultaneously. Most people can only channel one element; Veilwalkers can command mixed-element teams, which is why they're humanity's best hope against the Shattered forces.

This explains core mechanics:
- **Why you command a team**: Veilwalkers bond with elemental creatures
- **Why mixed elements work**: You're one of the few who can bridge planes
- **Why synergies exist**: Creatures from the same plane resonate naturally
- **Why gacha exists (narratively)**: Summoning through the Veil is unpredictable — you call, but you can't control who answers
- **Why duplicates matter**: Each summoning strengthens the bond (star-ups)
- **Why evolution exists**: Deep bonds allow creatures to transcend their base form

### Faction Lore

Each element has an internal conflict that drives the campaign:

**Pyrheim** — The Ember Legion (organized military) vs. Wildfire Beasts (chaotic predators). Missions 8 and The Ember Fortress represent the Legion.

**Abyssia** — The Tidal Court (ancient rulers) vs. The Deep Ones (corrupted by Veil energy). Missions 9 and Tidal Depths represent the Court's outer defenses.

**Terramund** — The Stone Conclave (protectors of ancient sites) vs. The Overgrowth (nature run wild). Mission 10 and The Living Mountain is a Conclave stronghold.

**Zephyria** — The Sky Order (disciplined warriors) vs. Storm Reavers (anarchist raiders). Mission 11 and Storm's Eye is a Reaver ambush.

**The Convergence** (Missions 12–14) — An entity called the **Void Sovereign** has been manipulating all four factions, drawing them toward a single point where the Veil is thinnest. The final missions reveal this threat and culminate in confronting the Sovereign's champions at The Eternal Throne.

---

## 2. Campaign Structure — Expanded

### Chapter System
The 14 story missions are grouped into 4 chapters with distinct narrative arcs and mechanical themes:

#### Chapter 1: The Frontier (Missions 1–4)
**Theme**: Learn the basics. The world is dangerous but manageable.

| Mission | Name | Narrative | Mechanical Focus |
|---|---|---|---|
| 1 | Forest Outskirts | Creatures prowl the border between planes | Tutorial: basic combat, positioning |
| 2 | Goblin Camp | Organized enemies — first sign of coordinated threats | Multi-wave introduction |
| 3 | River Crossing | Water elementals guard an ancient bridge | Element advantage/disadvantage |
| 4 | Abandoned Mine | Something stirs in the depths | 3 waves, first real difficulty check |

**Chapter Reward** (clear all 4): Unlock Summoning Circle upgrades, 1 free 10-pull

#### Chapter 2: The Elemental Frontier (Missions 5–7)
**Theme**: The elements are organized. Each faction has power and purpose.

| Mission | Name | Narrative | Mechanical Focus |
|---|---|---|---|
| 5 | Dragon's Pass | Mountain beasts, first high-cost enemies | Cost 3+ enemies, team comp matters |
| 6 | Elemental Nexus | All four forces converge at a ley line | Mixed-element enemies, synergy preview |
| 7 | The Dark Citadel | A fortress built on a Veil tear | 4 waves, first boss encounter |

**Chapter Reward**: Unlock Evolution Lab, 500g, 1 random Cost-3 unit

**Boss: Veil Guardian** (Mission 7, wave 4)
The first boss encounter. A corrupted guardian of the Veil tear — introduces boss mechanics gently (telegraphed AoE, no phase transitions, short enrage timer).

#### Chapter 3: The Elemental Wars (Missions 8–11)
**Theme**: Each element's faction is fully realized. The player must master countering specific strategies.

| Mission | Name | Narrative | Mechanical Focus |
|---|---|---|---|
| 8 | The Ember Fortress | Ember Legion stronghold | Fire-biased, Striker/Guardian synergy |
| 9 | Tidal Depths | Tidal Court's mystic sanctum | Water-biased, Mystic/Sage synergy |
| 10 | The Living Mountain | Stone Conclave fortress | Earth-biased, Guardian/Vanguard synergy |
| 11 | Storm's Eye | Sky Reaver ambush | Wind-biased, Predator/Striker synergy |

**Chapter Reward**: Unlock Forge Level 4 (Set Crafting), 1 element essence of choice

**Design Intent**: Each mission teaches the player to counter a specific archetype pairing. Mission 8 demands anti-frontline (Assassins, armor-shredding); Mission 9 demands anti-sustain (Grievous Wounds, burst damage); Mission 10 demands raw damage (Break through high DR); Mission 11 demands survivability (enemies are fast and evasive).

#### Chapter 4: The Convergence (Missions 12–14)
**Theme**: All elements unite under the Void Sovereign's influence. Full mechanical complexity.

| Mission | Name | Narrative | Mechanical Focus |
|---|---|---|---|
| 12 | The Convergence | Four factions, one battlefield | Enemy synergies active, mixed elements |
| 13 | Ascended Warfront | Enemies have evolved | Enemy evolutions, full synergy, 4 waves |
| 14 | The Eternal Throne | The Void Sovereign's champions | All systems active, 5 waves, final boss |

**Chapter Reward**: Choice of any Cost-4 unit, 1,000g, Mythic Material Fragment

---

## 3. Enemy Design Philosophy

### Enemy Composition Rules

Enemies are not random stat blocks — they should feel like coherent teams with identifiable strategies.

#### Early Game (Missions 1–7): Budget-Based
Current implementation: enemies are randomly selected up to a budget cap with a maximum unit cost. This is fine for early missions where variety matters more than coherence.

| Mission | Budget | Max Cost | Avg Enemies | Star Level |
|---|---|---|---|---|
| 1 | 3 | 1 | 3 | 1★ |
| 2 | 5/5 | 1 | 4/5 | 1★ |
| 3 | 6/8 | 2 | 4/5 | 1★ |
| 4 | 8/10/12 | 2 | 4/5/5 | 1★ |
| 5 | 10/12/15 | 3 | 5/5/6 | 1★ |
| 6 | 12/15/18 | 3 | 5/6/6 | 1–2★ |
| 7 | 15/18/20/25 | 4 | 5/6/6/7 | 1–2★ |

#### Mid Game (Missions 8–11): Themed Compositions
Each mission has an element bias (2× weight for matching units) and archetype bias. This creates recognizable team archetypes the player must counter.

**Mission 8 (Fire/Striker-Guardian)**: Frontline tanks absorb while fire strikers deal massive DPS. Counter: armor shred + backline dive.

**Mission 9 (Water/Mystic-Sage)**: Healing + slowing auras create a sustain wall. Counter: burst damage + Grievous Wounds.

**Mission 10 (Earth/Guardian-Vanguard)**: Pure tankiness — massive HP, DR, shields. Counter: %HP damage (BotRK), DR shred (Last Whisper), sustained DPS.

**Mission 11 (Wind/Predator-Striker)**: Glass cannons that kill your carries before you can react. Counter: CC, taunt tanks, positioning backline out of reach.

#### Late Game (Missions 12–14): Full Synergy Teams
Enemies have active element and archetype synergies, evolved forms, and 2★+ star levels. These feel like fighting a real player's team.

**Mission 12**: 4 waves, each featuring a different element with active synergy bonuses. Tests adaptability.

**Mission 13**: Evolved enemies appear. The first time the player faces evolved abilities (enhanced passives, stronger stats). 4 waves with escalating difficulty.

**Mission 14**: The gauntlet. 5 waves with full synergies, evolved champions, and the Void Sovereign boss on wave 5. Budget escalates from 35 to 60.

### Named Enemy Captains (NEW)
Mid-to-late story missions feature **named enemy units** — special enemies with unique abilities not found on normal units. These serve as mini-bosses within waves.

| Captain | Mission | Element | Special Ability |
|---|---|---|---|
| **Pyra, Ember General** | 8 (wave 3) | Fire | Rallying Cry: +20% ATK to all fire allies for 10s |
| **Nereus, Tidal Oracle** | 9 (wave 3) | Water | Tidal Blessing: heal all allies for 20% max HP |
| **Gorath, Stone King** | 10 (wave 3) | Earth | Earthquake: stun all player units for 1.5s |
| **Sylph, Storm Blade** | 11 (wave 3) | Wind | Wind Walk: teleport behind weakest enemy, deal 200% ATK |
| **The Arbiter** | 12 (wave 4) | Mixed | Elemental Shift: change element every 10s, immune to that element |
| **Voidborn Champion** | 13 (wave 4) | Void | Void Drain: steal 20% of target's current mana |
| **Void Sovereign** | 14 (wave 5) | Void | Full boss encounter (see Section 4) |

Captains are visually distinct (larger model, unique color, name plate above head). They always spawn in a fixed position on the enemy grid. Defeating a captain grants bonus rewards (25% more gold, guaranteed Rare+ item drop).

---

## 4. Boss Design — Detailed Encounters

### Boss Design Principles
1. **Bosses test strategy, not just stats**: A well-built team at appropriate power can beat any boss. An overleveled team with bad positioning will still lose.
2. **Telegraphed attacks**: Every dangerous ability shows a warning 1.5–2s before it lands. Red zones on the grid, screen shake, audio cue.
3. **Phase transitions are moments**: Brief invulnerability, visual transformation, music shift. The player knows the fight just changed.
4. **Minion management**: Bosses that summon adds force the player to balance single-target and AoE.
5. **Enrage prevents stalling**: After 120s, bosses become overwhelming. The fight has a time limit.

### Boss Encounter: Veil Guardian (Mission 7)
**Intro Boss** — teaches boss mechanics with lower stakes.

| Property | Value |
|---|---|
| Grid Size | 2×2 |
| HP | 5,000 + (player avg unit HP × 8) |
| ATK | Player avg ATK × 1.5 |
| DR | 15% |
| Enrage | 90s (+50% ATK, +30% AS) |

**Phase 1 (100–0% HP):** Single phase, no transition.
- *Veil Slam* (every 10s): Telegraphed 2-cell AoE centered on highest-HP player unit. 150% ATK damage. Warning: 2s red zone.
- *Energy Pulse* (every 20s): All player units take 50 flat magic damage. Tests healing/sustain.
- *No minions, no phase shift* — a clean introduction to the concept.

**Loot**: 1 guaranteed Rare component, 250g, 500 XP. First clear: +500g bonus.

### Boss Encounter: Infernal Wyvern (Challenge Mode — Fire)
The fire element boss for weekly rotation.

| Property | Value |
|---|---|
| Grid Size | 2×2 |
| HP | 15,000 + (team power × 3) |
| ATK | Team avg ATK × 2.0 |
| DR | 20% |
| Element | Fire |
| Enrage | 120s (+100% ATK, +50% AS) |

**Phase 1 (100–50% HP):**
- *Flame Breath* (every 8s): Cone covering columns 2–5. 80% ATK fire damage. Burns for 3s. Warning: 1.5s orange cone overlay.
- *Tail Swipe* (every 12s): 100% ATK to all units in melee range (row 1). Knockback 1 cell. Warning: 1.5s tail wind-up animation.
- *Ember Rain* (every 25s): 3 random cells marked. After 2s, each deals 60% ATK. Applies 5s Burn.

**Phase Transition (50% HP):**
2s invulnerability. Screen turns orange. Wyvern roars, wings spread. Music shifts to aggressive percussion.

**Phase 2 (50–0% HP):**
- Flame Breath widens to columns 1–6 (full board width) and fire rate increases to every 6s
- *Inferno* (replaces Ember Rain, every 15s): ALL player units take 60% ATK fire damage. Applies Grievous Wounds 3s.
- *Summon Drakes* (every 25s): Spawns 2 Fire Drake minions (Cost-2 equivalent stats, fire element). Max 4 drakes alive.
- Tail Swipe unchanged

**Strategy Guide**: Position carry units in columns 1 or 6 (outside Phase 1 breath). Use Water units for element advantage. Bring Grievous Wounds to counter Drake healing. Save CC for Phase 2 when DPS windows are smaller.

**Loot**: 500g, 1 guaranteed Rare+ component, 10% Dragon Scale, 1 guaranteed Arcane Essence. First clear: Infernal Wyvern title + 50 gems.

### Boss Encounter: Tidal Leviathan (Challenge Mode — Water)

| Property | Value |
|---|---|
| Grid Size | 2×2 (extends to 2×3 in Phase 2) |
| HP | 18,000 + (team power × 3) |
| ATK | Team avg ATK × 1.8 |
| DR | 25% |
| Element | Water |
| Enrage | 120s |

**Phase 1 (100–50% HP):**
- *Tidal Wave* (every 10s): Row-wide attack hitting all units in rows 1–2. 70% ATK water damage + Slow 2s. Warning: 2s water rising animation.
- *Whirlpool* (every 15s): Marks a 2×2 area. After 2s, pulls all nearby units toward center and deals 90% ATK. Repositions your team.
- *Regeneration Aura*: Passive — heals 1% max HP per second. Must out-DPS the regen.

**Phase 2 (50–0% HP):**
Boss grows, occupying 2×3 grid cells. Pushes adjacent player units back 1 cell.
- *Tsunami* (replaces Tidal Wave, every 8s): Hits rows 1–3. 80% ATK + Slow 3s.
- *Summon Kraken Arms* (every 20s): 2 tentacles spawn on random cells. Each tentacle has 2,000 HP and attacks the nearest unit for 50% boss ATK. Max 4 tentacles.
- Whirlpool area increases to 3×3
- Regeneration Aura doubles to 2% max HP/s

**Strategy**: Burn damage counters regen aura. Wind units dodge Whirlpool pulls. Prioritize tentacles to reduce incoming damage. Position deep (rows 3–4) to avoid Phase 1 Tidal Wave.

**Loot**: 500g, 1 guaranteed Rare+ component, 10% Dragon Scale, 1 guaranteed Arcane Essence. First clear: Leviathan's Bane title + 50 gems.

### Boss Encounter: Stone Colossus (Challenge Mode — Earth)

| Property | Value |
|---|---|
| Grid Size | 2×2 |
| HP | 22,000 + (team power × 3) |
| ATK | Team avg ATK × 1.5 |
| DR | 35% (highest DR of all bosses) |
| Element | Earth |
| Enrage | 120s |

**Phase 1 (100–50% HP):**
- *Ground Pound* (every 8s): All units within 2 cells of boss take 100% ATK earth damage + Root 1.5s. Warning: 1.5s arm raise.
- *Stone Skin* (passive): Every 20s, gains a shield equal to 10% max HP. Shield must be broken before damage resumes.
- *Boulder Toss* (every 12s): Targets highest-ATK player unit. 120% ATK damage + knockback 2 cells. Warning: 2s wind-up.

**Phase 2 (50–0% HP):**
- *Tectonic Shift* (every 25s): Rearranges the battlefield — randomly swaps positions of 3 player units. Disrupts formations.
- *Summon Stone Sentinels* (every 30s): 2 sentinels with 3,000 HP each, 25% DR, taunt (force nearby units to attack them). Max 4.
- Stone Skin shield now generates every 15s
- Ground Pound now also applies a 2s Slow

**Strategy**: %HP damage (BotRK, abilities) bypasses high DR. Last Whisper's DR shred is critical. Break Stone Skin shields quickly with multi-hit abilities. Assassins can bypass sentinels by targeting backline.

**Loot**: 500g, 1 guaranteed Rare+ component, 10% Dragon Scale, 1 guaranteed Arcane Essence. First clear: Mountain Breaker title + 50 gems.

### Boss Encounter: Storm Phoenix (Challenge Mode — Wind)

| Property | Value |
|---|---|
| Grid Size | 2×2 (flies — ignores unit collision) |
| HP | 14,000 + (team power × 3) |
| ATK | Team avg ATK × 2.2 (highest ATK of all bosses) |
| DR | 10% (lowest DR) + 25% Dodge |
| Element | Wind |
| Enrage | 120s |

**Phase 1 (100–50% HP):**
- *Gale Strike* (every 5s): Single-target, highest-ATK player unit. 130% ATK wind damage. Fastest attack cycle of all bosses.
- *Wind Wall* (every 15s): Creates a 1-cell-wide barrier across a random column for 5s. Units behind the wall take 0 damage from ranged attacks originating from the other side.
- *Feather Storm* (every 20s): 5 random cells each take 50% ATK damage. Spread, unpredictable.

**Phase 2 (50–0% HP):**
- *Rebirth* (once, at 50%): Storm Phoenix dies, then revives at 50% HP with a 3s invulnerability burst. All player units take 80% ATK damage on revival explosion.
- *Cyclone* (replaces Feather Storm, every 15s): Creates a 3×3 spinning zone that persists for 5s. Units inside take 30% ATK per second and are pulled toward center.
- Gale Strike now hits 2 targets
- *Summon Wind Wisps* (every 20s): 3 wisps with 800 HP each, very fast (0.5s attack speed), low damage (20% boss ATK). Swarming distraction.

**Strategy**: Highest ATK but lowest bulk. Burst damage is king — kill it fast before Gale Strike whittles your team. Spread units to minimize Cyclone damage. Anti-dodge effects (if any) counter the 25% dodge. Phase 2 Rebirth punishes clumped teams.

**Loot**: 500g, 1 guaranteed Rare+ component, 10% Dragon Scale, 1 guaranteed Arcane Essence. First clear: Storm Rider title + 50 gems.

### Boss Encounter: The Void Sovereign (Mission 14 — Final Boss)

| Property | Value |
|---|---|
| Grid Size | 2×2 |
| HP | 30,000 + (team power × 4) |
| ATK | Team avg ATK × 2.5 |
| DR | 20% |
| Element | Void (no element advantage/disadvantage) |
| Enrage | 150s (longer — this is the final fight) |

**Phase 1 (100–70% HP): "The Puppeteer"**
- *Void Tendrils* (every 8s): 3 random player units are rooted for 1.5s and take 50% ATK damage.
- *Elemental Mimicry* (passive): Copies the element of whatever player unit dealt the most damage last 5s. Gains that element's advantages.
- *Void Barrier* (passive): Shield equal to 15% max HP regenerates every 20s.

**Phase 2 (70–30% HP): "The Commander"**
Transition: 3s invulnerability. Purple shockwave pushes all player units to row 4. Music deepens.
- *Summon Void Champions* (once): Spawns 4 Void-element copies of random player units (same stats, same abilities, but hostile). These copies persist until killed.
- *Void Beam* (every 10s): Straight line across entire row targeting row with most player units. 100% ATK void damage. Warning: 2s purple line.
- *Dimensional Rift* (every 20s): Swaps positions of 2 random player units with 2 Void Champions. Chaos mechanic.

**Phase 3 (30–0% HP): "The Unmaker"**
Transition: 3s invulnerability. All remaining Void Champions are instantly killed. Screen turns dark purple. Boss gains permanent aura: -15% healing received by all player units.
- *Annihilation* (every 12s): ALL player units take 70% ATK damage. Unavoidable. The DPS check.
- *Void Collapse* (every 20s): Removes 2 random grid cells from the battlefield (units on them are pushed to adjacent cells). Board shrinks over time.
- *Final Form* (below 10% HP): ATK doubled, attack speed doubled. 15s to kill or wipe.

**Strategy**: Phase 1 tests sustained DPS (break barriers, out-damage regen). Phase 2 tests team building (your own units turned against you — bring diverse teams to minimize copycat danger). Phase 3 is a pure DPS race against Annihilation's unavoidable damage.

**Loot**: 1,000g, 1 guaranteed Epic component, 15% Dragon Scale, 15% Void Crystal, 1 guaranteed Arcane Essence, 1 guaranteed Cost-4 unit copy. First clear: Veilwalker title + 200 gems + choice of any mythic material.

---

## 5. Endless Mode

### Overview
Endless mode is the primary endgame content sink. It's an infinite series of increasingly difficult encounters that test the full depth of a player's roster, items, and strategic knowledge. Unlocked at player level 25.

### Structure: The Abyss
Thematically, The Abyss is a tear in the Veil that goes infinitely deep. Each floor represents a deeper layer where elemental forces are more unstable and powerful.

### Floor Design

| Floor Range | Theme | Enemies | Special Rules |
|---|---|---|---|
| 1–10 | Familiar Threats | Story mission enemies, 2–3★ | Standard combat rules |
| 11–20 | Elemental Surge | Element-biased floors, 3–4★ | Random element buff: all enemies of floor's element gain +20% stats |
| 21–30 | Evolved Depths | Evolved enemies, active synergies | Enemy teams have 4-piece element synergy bonuses |
| 31–40 | The Crucible | Named captains appear, 4–5★ | 2 captains per floor, enrage timer 90s |
| 41–50 | Abyssal Core | Mini-boss every 5 floors, max synergies | Enemy 6-piece synergy active, evolved captains |
| 50+ | The Void | Infinite scaling, +5% enemy stats per floor | Void-element enemies begin appearing |

### Floor Mechanics

**Scaling Formula**: `enemyStatMultiplier = 1.0 + (floor × 0.08) + (floor^1.3 × 0.01)`
- Floor 10: ~1.8× base stats
- Floor 25: ~3.5× base stats
- Floor 50: ~8× base stats
- Floor 100: ~22× base stats (extreme endgame)

**Between Floors**: After each floor, the player can:
- Reposition units on the grid
- Swap team members from full roster (no stamina cost — roster switching is part of the strategy)
- View the next floor's enemy composition (if War Room level 2+)
- Units retain HP damage between floors (no full heal). Healers matter.

**HP Carry-Over**: Units enter each floor at their current HP from the previous floor. Dead units stay dead until a revival effect (Guardian Angel) or until the run ends. This creates attrition — even strong teams will eventually fall.

**Revival Mechanics**:
- Guardian Angel / Aegis of Immortality revive effects reset every 5 floors
- Between floors: 20% max HP passive healing for all living units
- Every 10 floors: full team heal (checkpoint)

### Floor Modifiers (Random, 1 per floor starting at Floor 11)
Each floor above 10 has a random modifier that changes the rules:

| Modifier | Effect |
|---|---|
| **Burning Ground** | All units take 2% max HP fire damage per second |
| **Mana Drought** | Mana generation reduced by 50% |
| **Giant Slayer** | Highest-cost unit on each side takes 2× damage |
| **Swiftness** | All units have -30% attack speed cooldown |
| **Fortified** | All enemies gain +15% DR |
| **Arcane Storm** | Random unit hit by 200 magic damage every 5s |
| **Bloodlust** | All units lifesteal 10% but take 5% more damage |
| **Silence Zone** | No abilities can be cast for first 10s of combat |
| **Mirror Match** | Enemy team is a copy of your team (same units, items) |
| **Void Touched** | All damage dealt is Void element (no advantages or disadvantages) |

### Rewards

| Floor | Reward |
|---|---|
| Every floor | Gold: 50 + floor×10 |
| Every 5 floors | 1 random gem (rarity scales with floor) |
| Every 10 floors | 1 random essence + 1 component (Rare+) |
| Floor 25 | 1 guaranteed Epic component + 100g bonus |
| Floor 50 | 1 Void Crystal (guaranteed) + 500g |
| Floor 75 | 1 Dragon Scale (guaranteed) + 1,000g |
| Floor 100 | Choice of any Mythic Material + 2,000g + title: "Abyssal Conqueror" |

### Leaderboards
- **Global**: Highest floor reached (ever)
- **Weekly**: Highest floor reached this week (resets Monday)
- **Element Challenge**: Highest floor using only units of one element
- **Budget Challenge**: Highest floor using only Cost 1–2 units

Top 100 weekly leaderboard players receive bonus gems (1st: 500, 2nd–10th: 200, 11th–100th: 50).

---

## 6. Arena (PvP)

### Overview
Asynchronous PvP where players attack AI-controlled versions of other players' teams. Unlocked at player level 30.

### Arena Structure

#### Defense Team
- Players set a **defense team** of up to 7 units (same as max team size)
- Defense team uses the player's actual units, items, and grid positioning
- Defense team is AI-controlled (same AI as mission enemies) when attacked
- Players can update their defense team at any time

#### Attack
- Players choose from 3 opponents (matched by arena rank)
- Can scout enemy defense team before attacking (shows units and items, but NOT grid positions unless War Room L3)
- Standard combat rules apply — the attacker controls positioning, the defender's team is AI-controlled
- 5 stamina per arena attempt

#### Arena Rank System

| Rank | Range | Weekly Reward |
|---|---|---|
| Bronze | 0–999 | 100g + 10 gems |
| Silver | 1,000–1,999 | 300g + 25 gems |
| Gold | 2,000–2,999 | 500g + 50 gems |
| Platinum | 3,000–3,999 | 800g + 75 gems |
| Diamond | 4,000–4,999 | 1,200g + 100 gems |
| Master | 5,000+ | 2,000g + 150 gems |

**Rating Calculation**: Win = +30 to +50 (based on opponent rank delta). Loss = -15 to -25. Floor at 0.

#### Arena Seasons
- Seasons last 4 weeks
- End-of-season rewards based on peak rank achieved
- Season reset: all players drop 500 rating (minimum 0)
- Season rewards: gems, exclusive cosmetics, titles

### Arena-Specific Rules
- **No stamina gating on defense**: your team defends unlimited times
- **Attack limit**: 5 attacks per day (10 stamina total). Gem refill adds +3 attacks (50 gems)
- **Same-player cooldown**: Can't attack the same player twice in 24 hours
- **Tie-breaking**: If both teams wipe simultaneously, attacker wins (advantage to aggression)

### Meta Balance Considerations
Arena creates a metagame where defense and offense can diverge:
- **Defense meta**: Favors tanky, sustain-heavy teams (AI doesn't reposition, so frontline durability matters)
- **Offense meta**: Favors burst and assassination (player controls positioning to exploit AI weaknesses)
- This asymmetry is intentional — it means the "best" team isn't the same for both roles, encouraging players to build diverse rosters

---

## 7. Challenge Modes

### Overview
Challenge modes are rotating special missions with unique rules. They test specific skills and reward players who think outside their comfort zone. Available after completing story mission 10.

### Challenge Types

#### Time Trial
Clear a preset enemy team as fast as possible.

| Difficulty | Target Time | Enemy | Reward |
|---|---|---|---|
| Bronze | 45s | Mission 7 enemies | 100g |
| Silver | 30s | Mission 10 enemies | 200g + 1 gem |
| Gold | 15s | Mission 12 enemies | 500g + 3 gems |

Leaderboard: fastest clear time (global). Weekly rotation of enemy compositions.

#### Survival
Endless waves of enemies. How long can you last?

- Waves spawn every 20s
- Each wave adds +1 enemy and +10% enemy stats
- No between-wave repositioning
- Dead units stay dead
- Score = total enemies killed

**Rewards**:
- 50 enemies: 200g
- 100 enemies: 500g + 10 gems
- 200 enemies: 1,000g + 1 random essence
- 500 enemies: 2,000g + 1 Epic component

#### Restricted Roster
Complete a mission using only a subset of your roster.

| Restriction | Mission | Reward |
|---|---|---|
| Cost 1–2 only | Mission 10 | 300g + 20 gems |
| Single element only | Mission 11 | 500g + 1 essence of that element |
| No items equipped | Mission 8 | 200g + 2 random components |
| 3 units max | Mission 7 | 400g + 1 Rare gem |
| All same archetype | Mission 9 | 300g + 10 Bond Tokens |

Rotates weekly. New restriction + mission pairing each week.

#### Boss Rush
All 4 element bosses back-to-back with no healing between fights. HP carries over. The ultimate skill check.

- **Available**: Bi-weekly event (3 days)
- **Rewards**: Leaderboard for fastest total clear time
  - 1st: 500 gems + exclusive title
  - 2nd–10th: 200 gems
  - 11th–100th: 50 gems
- **Participation reward**: 200g + 1 random gem per boss defeated

---

## 8. Content Pipeline — Post-Launch

### New Unit Releases

**Cadence**: 2 new base units every 6 weeks (1 new evolution every 6 weeks, offset by 3 weeks).

**Unit Release Structure**:
1. **Teaser** (1 week before): Lore snippet + silhouette in game news
2. **Release day**: New unit added to gacha pool at 2× rate for 1 week (rate-up banner)
3. **Post-release** (2 weeks after): Unit spotlight event with quests that reward unit copies

**Design Rules for New Units**:
- Must fill a gap in the element×archetype coverage grid (reference UNITS-DESIGN coverage table)
- Must not directly power-creep an existing unit of the same role. New units should offer lateral options, not strictly better versions.
- If a new unit introduces a new keyword or mechanic, it must be documented in COMBAT-DESIGN before release.

### New Mission Content

**Cadence**: 1 new story chapter (3–4 missions) every 3 months.

**Post-Story Content (after Mission 14)**:
- **Chapter 5: The Void Incursion** — Void-element enemies as a permanent new threat. Introduces void element with unique interaction (no advantage/disadvantage, but abilities bypass 10% of DR).
- **Chapter 6: The Elemental Trials** — One mission per element, each requiring mono-element teams to complete.
- **Chapter 7+**: Community-voted themes (poll players quarterly).

### New Item Releases

**Cadence**: 1 new combined recipe every 2 months. 1 new ability item every 3 months. 1 new mythic item every 6 months.

**Design Rules**:
- New recipes must use existing components (no new components unless a major system expansion)
- New ability items must fill a niche not covered by existing 12
- Mythic items are the rarest additions — each one should redefine a playstyle

### Seasonal Events

**Quarterly Seasons** with unique themes:

| Season | Theme | Duration | Unique Content |
|---|---|---|---|
| Q1 | Frostfire Festival | 4 weeks | Ice-themed missions, frozen modifier in endless, seasonal cosmetics |
| Q2 | Tide of Ages | 4 weeks | Water-themed, underwater arena variant, historical lore missions |
| Q3 | Harvest of Power | 4 weeks | Earth-themed, gathering event (collect materials for bonus rewards) |
| Q4 | Storm's End | 4 weeks | Wind-themed, tournament bracket event, year-in-review rewards |

Each season includes:
- **Season Pass** (free track + premium track): 30 tiers of rewards earned by playing
- **Seasonal cosmetics**: Unit borders, UI themes (earned, never gameplay-affecting)
- **Seasonal challenge**: Unique modifier in endless mode themed to the season
- **Limited-time unit skin**: Cosmetic variant of an existing unit (no stat changes)

---

## 9. Lore Delivery System

### How Lore Is Presented
Lore should be discoverable but never mandatory. Players who care can find a rich world; players who skip everything should never feel lost.

#### Mission Briefings
Each story mission has a 2–3 sentence briefing shown before deployment. Current descriptions (from missions.js) serve this purpose but should be expanded:

**Current**: "Clear the creatures lurking at the forest edge."
**Expanded**: "The Veil is thinnest at the forest's edge. Creatures from Pyrheim and Terramund slip through, drawn by the warmth of nearby settlements. Clear them before they establish a foothold."

#### Unit Lore Cards
Each unit has a lore card accessible from the collection screen. Contains:
- **Origin**: Where the creature comes from (which plane)
- **Personality**: 1–2 sentences of character
- **Bond Stories**: If the unit has bonds, a short story about their relationship

Example: **Flame Knight** — "A warrior of the Ember Legion who defected after witnessing the Shattering's true cause. Now fights alongside Veilwalkers, channeling rage into protection rather than conquest."

#### Bond Stories
Each bond pair/trio has a short story (100–200 words) that unlocks when the bond is first activated. These explain WHY these units have synergy.

Example: **Blazing Vanguard** (Flame Warrior + Magma Knight) — "Before the Shattering, they served in the same unit of the Ember Legion. When the world broke, they found themselves on opposite sides of a Veil tear. Reunited through a Veilwalker's summoning, their old partnership reignites — literally."

#### Boss Lore
Each boss has pre-fight dialogue (2–3 lines) and defeat dialogue (1–2 lines). These are shown in text boxes, no voice acting needed.

Example: **Infernal Wyvern**
- Pre-fight: "You dare enter Pyrheim's domain? The flames will consume everything you've built."
- Defeat: "The fire... it obeys you now. Perhaps the Veil chose wisely after all."

#### World Codex
An in-game encyclopedia that fills as the player progresses. Categories:
- **Planes**: Pyrheim, Abyssia, Terramund, Zephyria, The Void
- **Factions**: Ember Legion, Tidal Court, Stone Conclave, Sky Order, Void Sovereign's forces
- **History**: The Shattering, Veilwalkers, the Eternal Throne
- **Creatures**: Entry for each unit (auto-filled when unit is first obtained)

---

## 10. Meta Balance Philosophy

### What "Meta" Means for This Game
In a single-player auto-battler, "meta" refers to which team compositions, items, and strategies are strongest. Unlike competitive games, we don't need perfect balance — but we do need variety.

### Balance Targets

| Principle | Target |
|---|---|
| No unit should be useless | Every unit should be BiS (best-in-slot) for at least 1 viable team comp |
| No team comp should dominate | The strongest comp should be ≤15% more effective than the 5th strongest |
| Items should create builds, not requirements | No single item should be mandatory for any role |
| Content should have multiple solutions | Every mission should be clearable by at least 3 different team strategies |

### Balance Levers (How We Tune)

| Lever | Scope | Frequency |
|---|---|---|
| Unit stat adjustments | Individual units | Monthly |
| Ability number tuning | Individual abilities | Monthly |
| Synergy bonus adjustments | Archetype/element bonuses | Quarterly |
| Item stat/effect tuning | Individual items | Quarterly |
| New unit releases | Global meta shift | Every 6 weeks |
| Content difficulty tuning | Mission/boss stats | As needed |

### Anti-Power-Creep Commitment
New content should never invalidate old content. Specific rules:
- **New units must be sidegrades**: A new Fire Warrior shouldn't be strictly better than the existing Fire Warrior. It should offer a different playstyle (e.g., more burst vs. more sustain).
- **Stat caps exist**: No unit stat (after all multipliers) should exceed 5× its base value from any single source.
- **Difficulty scales with power**: Endless mode inherently absorbs power creep. Arena matchmaking groups similar-power players.
- **Nerfs are communicated**: If a unit/item is adjusted downward, players are notified in patch notes with explanation. Compensation (gold/gems) for significant nerfs to units/items players invested in.

### Data-Driven Balance
Post-launch, balance should be informed by data:
- **Win rate by team comp**: If any comp exceeds 80% win rate in arena, investigate
- **Unit usage rate**: If any unit appears in >50% of all teams, it's likely overtuned
- **Endless mode floor distribution**: If players cluster at a specific floor, that floor's modifier may be too punishing
- **Item equip rate**: If any item appears on >40% of all equipped units, it's likely too universally good

---

## 11. Content Checklist — Full Game

### Launch Content Requirements

| Category | Count | Status |
|---|---|---|
| Story missions | 14 | Implemented |
| Grind mission generator | 1 system | Implemented |
| Boss encounters | 5 (1 story + 4 challenge) | Designed (this doc) |
| Endless mode | 100+ floors | Designed (this doc) |
| Arena | Full system | Designed (this doc) |
| Challenge modes | 4 types | Designed (this doc) |
| Unit roster | 38 base + 24 evolved | Designed (UNITS-DESIGN) |
| Item recipes | 21 combined + 12 ability + 6 mythic | Designed (ITEMS-DESIGN) |
| Buildings | 10 total (7 existing + 3 new) | 7 implemented, 3 designed |
| Daily quests | 10 quest types | Designed (PROGRESSION-DESIGN) |
| Weekly quests | 5 quest types | Designed (PROGRESSION-DESIGN) |
| Events | 5 types | Designed (PROGRESSION-DESIGN) |
| Achievements | ~30 | Designed (PROGRESSION-DESIGN) |
| Lore entries | ~80 (units + factions + history) | Framework (this doc) |

### Post-Launch Content Cadence

| Content | Frequency | Lead Time |
|---|---|---|
| Balance patch | Monthly | 1 week |
| New unit (base) | Every 6 weeks | 4 weeks |
| New unit (evolution) | Every 6 weeks (offset) | 4 weeks |
| New item recipe | Every 2 months | 2 weeks |
| New story chapter | Every 3 months | 8 weeks |
| New ability item | Every 3 months | 3 weeks |
| Seasonal event | Quarterly | 6 weeks |
| New mythic item | Every 6 months | 4 weeks |
| New boss encounter | Every 6 months | 6 weeks |

---

## 12. Migration from Current System

### What Stays
- All 14 story missions with current structure, descriptions, and rewards
- Grind mission generator logic
- Enemy composition system (budget-based + element/synergy bias)
- Mission wave structure and reward multipliers

### What's Added
- Chapter system overlaying existing 14 missions (UI grouping, chapter rewards)
- Named enemy captains in missions 8–14
- Expanded mission descriptions with lore context
- 5 boss encounters (Veil Guardian, Infernal Wyvern, Tidal Leviathan, Stone Colossus, Storm Phoenix, Void Sovereign)
- Endless mode (The Abyss) — full system
- Arena (PvP) — full system
- 4 challenge mode types
- World Codex (lore encyclopedia)
- Unit lore cards, bond stories, boss dialogue
- Content pipeline framework for post-launch updates

### Save Migration
- New save version required
- Existing mission progress preserved
- Chapter rewards retroactively granted for already-cleared missions
- Arena rating starts at 0 for all players
- Endless mode high score starts at 0
- World Codex auto-populates entries for owned units and cleared missions

---

## Appendix A: Enemy Stat Scaling Reference

### Enemy Star Level by Mission

| Mission | Wave 1 | Wave 2 | Wave 3 | Wave 4 | Wave 5 |
|---|---|---|---|---|---|
| 1–4 | 1★ | 1★ | 1★ | — | — |
| 5–7 | 1★ | 1–2★ | 2★ | 2★ | — |
| 8–11 | 2★ | 2★ | 2–3★ | — | — |
| 12 | 2★ | 2–3★ | 3★ | 3★ | — |
| 13 | 2–3★ | 3★ | 3★ | 3–4★ | — |
| 14 | 3★ | 3★ | 3–4★ | 4★ | 4–5★ + Boss |

### Enemy Power Scaling (Relative to Player Team)

| Content | Enemy Power vs Player |
|---|---|
| Story (on-level) | 70–90% of player team power |
| Story (under-leveled) | 50–70% (easy farm) |
| Boss challenge | 100–120% (requires strategy) |
| Endless floor 1–10 | 60–100% |
| Endless floor 11–30 | 100–150% |
| Endless floor 31–50 | 150–250% |
| Endless floor 50+ | 250%+ (infinite scaling) |
| Arena (equal rank) | ~100% (mirror) |

## Appendix B: Boss Quick Reference

| Boss | Element | HP Multiplier | Key Mechanic | Danger Level |
|---|---|---|---|---|
| Veil Guardian | Neutral | 8× avg HP | Telegraphed AoE | Intro |
| Infernal Wyvern | Fire | 3× team power | Cone breath, drake summons | Medium |
| Tidal Leviathan | Water | 3× team power | Regen aura, whirlpool repositioning | Medium-Hard |
| Stone Colossus | Earth | 3× team power | 35% DR, shield cycling, formation disruption | Hard |
| Storm Phoenix | Wind | 3× team power | Fastest attacks, rebirth, dodge | Hard |
| Void Sovereign | Void | 4× team power | 3 phases, unit copying, board shrink | Extreme |

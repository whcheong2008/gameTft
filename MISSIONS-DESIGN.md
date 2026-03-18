# Missions & Regions — Deep Design Document

> Campaign structure redesign. Region-based progression with lock mechanics that teach game systems incrementally. Story is TBD (separate session) — this doc covers structure, mechanics, locks, encounter types, and boss encounters.

## Design Philosophy

1. **Story navigates the missions, not the other way around**: The campaign structure exists first as a mechanical teaching tool. Narrative wraps around it, not the reverse.
2. **Locks are the tutorial**: Instead of tutorial popups, the game teaches through restrictions. Force the player to use a system and they'll understand it.
3. **Every region has an identity**: Each region teaches one core concept. The player should be able to say "that's the archetype region" or "that's the encounter mechanics region."
4. **Boss as exam**: Every region ends with a boss that tests what the region taught. Bosses gate progression to the next region.
5. **Prismatic is a reward, not a requirement**: The final region is beatable without 10-element prismatic synergy. Players who grind to prismatic earn the right to stomp it.

---

## Lock System

Locks are **minimum count requirements** — the player must have at least N units matching the lock condition on their team to deploy. They can fill remaining slots freely.

Examples:
- "2 Guardians" = at least 2 Guardian-archetype units, rest is open
- "4 elements" = units from at least 4 different elements on the team
- "No element synergies" = maximum 1 unit of any single element (disables element thresholds)

Locks are displayed on the mission select screen. If the player's current team doesn't meet the lock, the deploy button is grayed out with a tooltip explaining the requirement.

---

## Region Overview

| Region | Name | Stages | Lock Type | Boss | Core Lesson |
|--------|------|--------|-----------|------|-------------|
| 1 | The Frontier | 3–4 + boss | None | The Veil Warden (2×2) | Basic combat, positioning |
| 2 | The Barracks Trials | 5 + boss | Single archetype (min count) | The Archon (2×2) | Archetype roles |
| 3 | The Synergy Trials | 4 + boss | Archetype pairs / element intro | The Twin Heralds (two 1×2) | Synergy pairing |
| 4 | The Shattered Lands | 5 + boss | None (encounter mechanics) | The Shattered Colossus (2×2) | Adaptive combat |
| 5 | The Dual Convergence | 4 + boss | Dual-element | The Elemental Chimera (2×2) | Element coverage |
| 6 | The Elemental Crucible | 6 + boss | 4-element minimum | The Prismatic Sentinel (2×2) | Multi-element orchestration |
| 7 | The Proving Grounds | 5 + boss | Locks + encounter mechanics | The Arbiter of Trials (2×2) | Peak tactical challenge |
| 8 | The Abyss Gate | 5–6 + boss | None | The Void Sovereign (2×2) | Endgame mastery |

**Total stages: ~37–42 + 8 boss stages = ~45–50 stages**

---

## Region 1 — The Frontier

### Overview
No locks. Simple enemies, low budgets. The player uses whatever they've pulled from gacha. Teaches basic combat flow: deploy units, watch them fight, reposition between waves.

### Stages (3–4)

**Stage 1: "First Steps"**
- Waves: 2
- Enemies: Low-tier, mixed, no synergies
- Purpose: The absolute basics — place units, start fight, see what happens

**Stage 2: "Border Patrol"**
- Waves: 2–3
- Enemies: Slightly more, still low-tier
- Purpose: Multi-wave introduction, between-wave repositioning

**Stage 3: "The Crossing"**
- Waves: 3
- Enemies: First cost-2 enemies appear
- Purpose: Difficulty uptick — the player might lose a unit for the first time

**Stage 4 (optional): "Into the Wild"**
- Waves: 3
- Enemies: Mixed with some element bias
- Purpose: Pre-boss warm-up, first exposure to element advantages (enemies deal more/less damage based on matchup, but no player action required)

### Boss: The Veil Warden (2×2)

A straightforward boss that teaches what a boss IS — big unit, occupies multiple cells, telegraphed attacks, higher stakes.

| Property | Value |
|----------|-------|
| Grid Size | 2×2 |
| Phases | 1 (single phase) |
| Key Mechanic | Telegraphed AoE |

**Abilities:**
- **Ground Slam** (every 10s): 2-cell AoE centered on highest-HP player unit. Telegraphed with 2s red zone warning. Moderate damage.
- **Roar** (triggered at 50% HP, once): Self-buff — +20% ATK for remainder of fight. Visual/audio cue to signal the fight just got harder.

**Design intent:** No gimmicks, no phases, no adds. The player just needs a functional team. This boss teaches: bosses are big, bosses telegraph, bosses hit hard, pay attention to red zones.

---

## Region 2 — The Barracks Trials

### Overview
Single archetype locks. Each stage requires a minimum count of a specific archetype. Enemy compositions are designed to showcase WHY that archetype matters. Covers a curated subset of the 9 archetypes — grouped by role family rather than one-per-archetype.

### Stages (5)

**Stage 1: "Hold the Line" — Lock: 2 Guardians**
- Enemies: Heavy melee rushers (Duelists, Predators). Fast, aggressive, fragile.
- Purpose: Guardians absorb hits so damage dealers survive. Without tanks, squishies get overrun.
- Lesson: Frontline protection is a role, not just "more units in front."

**Stage 2: "Death from Afar" — Lock: 2 Rangers**
- Enemies: Tanky but slow (Guardians, Wardens). High HP, high DR, lumber forward.
- Purpose: Ranged units chip them down before they reach your line. Melee-only works but takes forever with attrition damage.
- Lesson: Ranged sustained damage solves the "wall of meat" problem.

**Stage 3: "The Arcane Barrage" — Lock: 2 Sorcerers or Mystics**
- Enemies: Spread across grid, moderate stats, enemy healer in the back.
- Purpose: Magic damage and AoE. Physical single-target can't out-damage the healer. Sorcerers/Mystics bring burst or AoE to nuke the healer or overwhelm healing.
- Lesson: Magic isn't "different colored damage" — it solves problems physical can't.

**Stage 4: "The Hunt" — Lock: 2 Predators or Duelists**
- Enemies: Dangerous backline carry protected by a wall of tanks. Carry ramps damage over time.
- Purpose: Dive/assassin archetypes bypass frontlines to reach priority targets.
- Lesson: Positioning and target access matter. Some threats must be reached, not waited out.

**Stage 5: "Restoration" — Lock: 2 Sages**
- Enemies: Many waves, each individually easy, but units carry HP damage between waves. No full heal.
- Purpose: Sustain keeps the team alive across extended fights. Without healing, even strong teams get ground down.
- Lesson: Sages/healers aren't just defensive — they're the difference between clearing a long fight and failing on wave 4.

### Boss: The Archon (2×2)

Shifts between archetype "stances" on a cycle, testing whether the player learned what each archetype does.

| Property | Value |
|----------|-------|
| Grid Size | 2×2 |
| Phases | 1 (continuous stance rotation) |
| Key Mechanic | Stance shifting every 15–20s |

**Stances (rotate in order):**

1. **Guardian Stance — Stone Wall**: Gains massive DR (+40%) and a shield equal to 15% max HP. Reduced movement. Best time to burst it down before shield regenerates, but it's tanky.
2. **Predator Stance — Shadow Leap**: Dashes to lowest-HP player unit, attacks with +50% ATK for duration. Player needs tanks forward to intercept or healers to sustain the target.
3. **Sorcerer Stance — Arcane Barrage**: Casts AoE magic damage to a 3×3 area centered on the cluster of most player units. Player needs to spread formation.

**Design intent:** Each stance punishes a different failure mode. If the player only brought one archetype type, at least one stance will crush them. A balanced team handles all three.

---

## Region 3 — The Synergy Trials

### Overview
Paired locks — two archetypes, archetype + element, or two elements. Enemies have their own synergies active so the player sees the system working on both sides. The 2-threshold synergy bonuses start clicking here.

### Stages (4)

**Stage 1: "Shield and Fang" — Lock: 2 Guardians + 2 Predators**
- Enemies: Balanced comp with frontline and backline
- Purpose: The classic frontline/dive split. Guardians hold while Predators flank.
- Lesson: First time composing a team with two distinct roles working in concert.

**Stage 2: "The Long Watch" — Lock: 2 Rangers + 2 Sages**
- Enemies: Aggressive rushers, fast melee units
- Purpose: Backline composition. Rangers deal damage from safety, Sages sustain. But light on frontline — positioning is critical.
- Lesson: Backline-heavy teams work but need smart positioning. Can't just stack backline without someone absorbing hits.

**Stage 3: "Elemental Clash" — Lock: 2 of one element + 2 of another element**
- Enemies: Mono-element, strong against one of the player's elements and weak against the other
- Purpose: First element lock. Half the team shreds, half struggles.
- Lesson: Element coverage matters. Dual-element teams have built-in insurance against bad matchups.

**Stage 4: "Deep Bonds" — Lock: 3 of one archetype**
- Enemies: Designed to be specifically countered by that archetype's synergy bonus
- Purpose: Deeper archetype stacking — hitting the synergy threshold and feeling the bonus activate.
- Lesson: Stacking an archetype isn't just "more of the same" — the synergy bonus changes how the team plays.

### Boss: The Twin Heralds (two 1×2 units = 4 cells)

Two bosses at once. Tests synergy thinking — the player's paired composition needs to handle both threats simultaneously.

| Property | Value |
|----------|-------|
| Grid Size | Two 1×2 units (4 cells total) |
| Phases | 2 (normal → enrage on first death) |
| Key Mechanic | Proximity buff, kill-order puzzle |

**Core mechanic:** When within 2 cells of each other, both Heralds gain +30% ATK. If one dies, the survivor enrages (doubled ATK, halved attack cooldowns).

**Melee Herald abilities:**
- **Charge**: Dash to a player unit + 1.5s stun. 12s cooldown.
- **Cleave**: Frontal cone damage hitting all units in a 2-cell arc. 8s cooldown.

**Magic Herald abilities:**
- **Chain Lightning**: Bounces between player units within 2 cells of each other. 3 bounces, damage reduces 20% per bounce. 10s cooldown.
- **Barrier**: Shields the other Herald for 10% of its max HP. 15s cooldown.

**Kill-order puzzle:** Kill them close together (within ~5s) for a clean fight. Kill one early and face enraged survivor. Optimal play: whittle both to low HP, then burst.

**Survivor enrage — Vengeance:** +100% ATK, -50% attack cooldowns, +20% movement speed. Lasts until dead.

---

## Region 4 — The Shattered Lands

### Overview
No team locks. Instead, encounter mechanics make each stage a unique tactical puzzle. The player applies everything they learned about team building freely, but the FIGHTS demand adaptive thinking. Every mechanic requires tactical decisions, not RNG.

### Encounter Mechanic Definitions

These mechanics are reused in Region 7 and boss fights. Defined here as the player's first exposure.

| Mechanic | Description | Tactical Decision |
|----------|-------------|-------------------|
| **VIP Target** | One enemy unit buffs/heals the rest. Must be killed to stop the effect. | Build dive to reach backline VIP, or brute-force through front? |
| **Countdown** | An enemy/structure charges a wipe ability on a timer. Must be destroyed before it fires. | Build offensive to beat the clock, or sustain through partial damage? |
| **Reinforcement Pressure** | Fixed spawn points on the grid produce new enemies at set intervals. | Position to intercept spawns, or rush the main force and ignore adds? |
| **Protect the Objective** | Friendly NPC unit on player's grid that enemies target. Cannot attack. Must survive X waves. | Dedicate tanks/healers to NPC, or kill enemies fast enough they never reach it? |
| **Split Formation** | Player team forced into two groups on opposite sides of the grid with a gap between them. | How to split the roster so both halves are self-sufficient? |
| **Escalating Threat** | One enemy gains stacking ATK/speed buff every X seconds. Weak early, devastating late. | Kill it first while it's weak, or clear other enemies first and face the monster? |

### Stages (5)

**Stage 1: "The Priority" — Mechanic: VIP Target**
- Setup: Enemy team has a healer in the back corner buffing all allies with +25% ATK and regeneration. Standard enemies in front.
- Decision: Dive the VIP immediately (risky, your divers might die to the frontline) or clear the frontline first (slower, the buff makes each wave harder).

**Stage 2: "Against the Clock" — Mechanic: Countdown**
- Setup: A Veil Crystal in the enemy backline is charging. After 45 seconds, it fires a wipe that kills all player units. The crystal has high HP but doesn't attack. Enemies in front protect it.
- Decision: All-in offensive to burn the crystal (ignoring enemies, taking damage) or balance clearing enemies while chipping the crystal.

**Stage 3: "Endless Tide" — Mechanic: Reinforcement Pressure**
- Setup: 3 fixed spawn points on the enemy side of the grid. New enemies appear every 8 seconds. Main enemy force is moderate.
- Decision: Position units near spawn points to intercept (spreading thin) or clump up and power through the center, accepting flanking pressure.

**Stage 4: "The Ward" — Mechanic: Protect the Objective**
- Setup: Friendly NPC on row 6 (player backline). Enemies prioritize the NPC. 3 waves, NPC must survive all 3. NPC has moderate HP, no abilities, cannot be moved.
- Decision: Park Guardians around the NPC (safe but reduces offensive power) or position aggressively to kill enemies before they reach the NPC (risky but faster).

**Stage 5: "The Growing Storm" — Mechanic: Escalating Threat**
- Setup: One elite enemy starts with low stats but gains +15% ATK and +10% attack speed every 5 seconds. Other enemies are moderate.
- Decision: Focus fire the escalator immediately (but other enemies damage your team freely) or clear the small threats first (but the escalator becomes terrifying).

### Boss: The Shattered Colossus (2×2)

Cycles through encounter mechanics as phase transitions. The practical exam for Region 4.

| Property | Value |
|----------|-------|
| Grid Size | 2×2 |
| Phases | 3 |
| Key Mechanic | Each phase uses a different encounter mechanic |

**Phase 1 — "The Crystal" (100–65% HP): VIP Target**
- A Healing Crystal spawns behind the Colossus, regenerating 2% of boss max HP per second.
- Boss ability: **Slam** — basic 2-cell AoE, 8s cooldown, telegraphed.
- Player must destroy the crystal (separate HP pool: ~3,000 HP) while dealing with the boss. If crystal isn't killed within 30s, its healing doubles.

**Phase 2 — "The Charge" (65–30% HP): Countdown + Reinforcements**
- Transition: 2s invulnerability. Colossus raises one arm, which begins glowing (the countdown element).
- **Cataclysm Charge**: Boss arm charges for 30s. If not interrupted (deal 5,000 damage to the arm specifically), it fires a massive AoE dealing 80% of all player units' current HP.
- **Summon Shards**: Every 10s, 2 Stone Shard minions spawn from fixed grid points. Low HP, moderate damage. Distraction from the arm.
- Player must balance killing shards and damaging the arm before the countdown.

**Phase 3 — "The Rift" (30–0% HP): Split Formation**
- Transition: 2s invulnerability. The grid splits — a 1-column gap appears in the middle. Player units are pushed to either side.
- **Dual Smash**: Boss attacks both sides simultaneously with alternating arm slams. Each side must survive independently.
- **Rift Pulse**: The gap column pulses with damage every 5s — units can't cross through it.
- Player's team is split based on current positions. Both halves need enough damage and sustain to contribute.

---

## Region 5 — The Dual Convergence

### Overview
Dual-element lock — must bring units from exactly 2 different elements. Enemy teams are mono-element, strong against one of the player's elements. The player always fights with one "effective" half and one "disadvantaged" half. Teaches element coverage thinking.

### Stages (4)

**Stage 1: "Fire and Ice"**
- Lock: 2 elements (player choice)
- Enemies: Mono-element (randomized or fixed per playthrough)
- Purpose: Introduction to dual-element dynamics. One half of your team dominates, the other struggles.

**Stage 2: "Shifting Tides"**
- Lock: 2 elements
- Enemies: Wave 1 is one element, Wave 2 switches to another. Both are relevant to the player's chosen elements.
- Purpose: Both halves of the team get their moment. Teaches that element coverage means different units shine at different times.

**Stage 3: "The Crucible Pair"**
- Lock: 2 elements
- Enemies: Dual-element themselves — they mirror the player's constraint. Enemy synergy bonuses are active.
- Purpose: The player fights a team built like theirs. Synergy mirror match — who built better?

**Stage 4: "Elemental Pressure"**
- Lock: 2 elements
- Enemies: Multi-wave with escalating element diversity. Wave 1 mono, Wave 2 dual, Wave 3 triple-element.
- Purpose: The player's dual-element team is increasingly outmatched in coverage. Tests whether their 2-element synergy bonuses can overpower broader but shallower enemy coverage.

### Boss: The Elemental Chimera (2×2)

Shifts between two elements, forcing both halves of the player's dual-element team to carry at different moments.

| Property | Value |
|----------|-------|
| Grid Size | 2×2 |
| Phases | 1 (continuous element rotation) |
| Key Mechanic | Element shifting every 20s with absorption |

**Abilities:**
- **Elemental Shift** (every 20s): Changes element. 3s telegraph — boss glows with the incoming element's color. Player can anticipate and reposition.
- **Element Surge**: AoE damage of current element. 2-cell radius around boss. 8s cooldown.
- **Absorption** (passive): Heals from damage matching its current element. If the boss is in Fire mode and hit with Fire damage, it heals instead of taking damage.

**Design intent:** The player can't just use one element and ignore the other. When the boss is Fire, Water units carry. When it shifts to Water, Fire units carry. Both halves of the team must be viable. Absorption punishes players who don't switch focus.

---

## Region 6 — The Elemental Crucible

### Overview
4-element minimum lock. The player must bring units from at least 4 different elements. 6 stages with escalating difficulty. Enemies have active synergies. Each stage favors a different element combination, forcing the player to rotate their team composition rather than finding one team and repeating it.

### Stages (6)

**Stage 1: "Four Winds"**
- Lock: 4 elements minimum
- Enemies: Balanced, moderate difficulty. No specific counter required.
- Purpose: Ease into 4-element team building. Get comfortable with the constraint.

**Stage 2: "Fire and Stone"**
- Lock: 4 elements
- Enemies: Fire + Earth biased. Fire/Earth synergy bonuses active.
- Purpose: Water and Wind units are most effective here. Player needs those represented in their 4-element team.

**Stage 3: "Storm and Sea"**
- Lock: 4 elements
- Enemies: Water + Wind biased. Water/Wind synergy bonuses active.
- Purpose: Fire and Earth/Lightning units effective. Different element pair than Stage 2 — can't reuse the same team without adjusting.

**Stage 4: "Lightning Surge"**
- Lock: 4 elements
- Enemies: Lightning + Force biased. New elements prominently featured.
- Purpose: Forces engagement with the newer elements. Earth (strong vs Lightning) is critical.

**Stage 5: "The Full Spectrum"**
- Lock: 4 elements
- Enemies: All 6 elements represented, active synergies, evolved units appear.
- Purpose: Pure team quality check. Everything the player has learned about element coverage is tested.

**Stage 6: "Crucible's Peak"**
- Lock: 4 elements
- Enemies: Full synergies, high star levels, multiple waves with escalating element diversity.
- Purpose: Pre-boss gauntlet. The hardest non-boss stage in the region.

### Boss: The Prismatic Sentinel (2×2)

The element mastery boss. Rotating immunity and vulnerability forces the player to use all 4+ elements on their team actively.

| Property | Value |
|----------|-------|
| Grid Size | 2×2 |
| Phases | 1 (continuous rotation) |
| Key Mechanic | Rotating element immunity + vulnerability |

**Abilities:**
- **Prismatic Shield** (every 15s): Becomes immune to one element and vulnerable (+50% damage) to another. Displayed as a color aura — immune element shown as a barrier, vulnerable element shown as cracks. Rotates through a fixed sequence so the player can predict.
- **Elemental Storm** (every 10s): AoE damage of the element it's currently IMMUNE to. Punishes stacking that element (they take super-effective damage AND can't hurt the boss).
- **Resonance Burst** (every 20s): Bonus damage to all player units whose element matches the boss's current immunity. Further punishes wrong-element units being active.

**Design intent:** The player must have at least 2–3 elements contributing damage at any given time. Mono or dual-element strategies fail hard. The rotating sequence is predictable — tactical play is about anticipating the next shift and having the right units positioned to capitalize.

---

## Region 7 — The Proving Grounds

### Overview
The intersection of two constraint types: team locks AND encounter mechanics. Every stage has both. The player solves "what do I bring" and "how do I fight" simultaneously. Peak tactical content.

### Stages (5)

**Stage 1: "Endurance Under Fire" — Lock: 3 Sages + Mechanic: Escalating Threat**
- Setup: An enemy unit gains +15% ATK every 5s. Player is forced to bring 3 healers (lower DPS).
- Puzzle: Can the team sustain long enough while focusing down the escalator before it overwhelms healing? Prioritize burst on the threat vs. distributed healing.

**Stage 2: "Stripped Down" — Lock: No element synergies (max 1 of any element) + Mechanic: Reinforcement Pressure**
- Setup: Fixed spawn points produce reinforcements every 8s. Player has zero element synergy bonuses — pure archetype power and unit quality.
- Puzzle: Without element bonuses, raw stats and archetype synergies must carry. Positioning to intercept spawns while managing a weaker-than-usual team.

**Stage 3: "Divided Command" — Lock: 2 Predators + 2 Guardians + Mechanic: Protect the Objective**
- Setup: Friendly NPC to protect, but also a dangerous backline enemy carry that must be reached.
- Puzzle: Guardians protect the NPC. Predators hunt the carry. But committing too hard to either role means the other fails. Split-focus team management.

**Stage 4: "Fractured Elements" — Lock: 3 elements minimum + Mechanic: Split Formation**
- Setup: Team starts split into two groups. With the 3-element lock, the player decides which elements go where at the formation screen.
- Puzzle: Pre-fight planning matters most. Wrong element distribution = one side faces bad matchups. The formation screen is where this stage is won or lost.

**Stage 5: "Final Judgment" — Lock: 4 of one archetype + Mechanic: Countdown + VIP Target**
- Setup: Deep archetype stacking (strong synergy threshold). A countdown enemy charging a wipe AND a VIP buffing the rest. Two priority targets.
- Puzzle: The archetype stack gives power in one dimension — can the player apply it to two problems at once? Capstone stage.

### Boss: The Arbiter of Trials (2×2)

The ultimate puzzle boss. Imposes encounter mechanics AND locks during the fight itself via phase abilities.

| Property | Value |
|----------|-------|
| Grid Size | 2×2 |
| Phases | 3 |
| Key Mechanic | Mid-fight constraint imposition |

**Phase 1 — "Judgment of Elements" (100–65% HP): Synergy Suppression**
- **Suppression Field** (passive): All element synergy bonuses are disabled for the duration of Phase 1. The player fights on archetype power alone.
- **Judge's Gavel** (every 8s): Single-target massive damage on highest-ATK player unit. Telegraphed with 1.5s glow.
- Player must have strong archetype composition to survive without element bonuses.

**Phase 2 — "Judgment of Tactics" (65–30% HP): Split Formation + VIP**
- Transition: 2s invulnerability. Element synergies re-enabled.
- **Rift Judgment**: Grid splits into two halves. Player team divided by current position.
- **Summon Adjudicator**: A VIP healer add spawns on one side, healing the boss for 1.5% max HP/s. Must be killed.
- Player must have damage on the Adjudicator's side to kill it, AND sustain on both sides to survive the boss.

**Phase 3 — "Final Judgment" (30–0% HP): Countdown**
- Grid remains split.
- **Final Verdict**: 25s countdown to a full wipe. Player must deal a damage threshold to the boss to interrupt it.
- **Accelerating Judgment** (passive): Boss attack speed increases by 10% every 5s during this phase.
- Pure DPS race. The team needs to burn the boss before the wipe, while split, while taking increasing damage.

---

## Region 8 — The Abyss Gate

### Overview
No locks. The final region. Extremely difficult. Tuned so that strong synergy teams at 4/7 element thresholds can clear it with excellent play. Prismatic (10-element) is NOT required but would make it comfortable. The difficulty comes from enemy power, complex encounters, and encounter mechanics from earlier regions reappearing at higher stakes.

### Difficulty Calibration
- **Intended clear line**: Two elements at 4-threshold each with strong archetype synergies, good items, and optimized positioning. OR one element at 7-threshold with a strong carry and good support.
- **Comfortable clear**: Prismatic (10-element) teams with good items. The grind reward is feeling powerful here.
- **Multiple viable strategies**: No single "correct" team. Different synergy investments should all have paths to victory.

### Stages (5–6)

**Stage 1: "Descent"**
- Enemies: High stats, full synergies, evolved units. Standard combat but overtuned.
- Purpose: Raw power check. If the player's team can't handle this, they need to grind more. The baseline for Region 8.

**Stage 2: "The Gauntlet" — Mechanic: Reinforcement Pressure + Escalating Threat**
- Combined mechanics from Region 4, now at endgame power levels. Spawns + an escalating elite.
- Purpose: Can the player handle two overlapping pressure sources with a fully built team?

**Stage 3: "Shattered Ground" — Mechanic: Split Formation + VIP Target**
- Team split + a VIP on one side. Both mechanics at endgame stats.
- Purpose: Roster depth and split-team viability. Both halves need to function.

**Stage 4: "The Crucible Returns" — Mechanic: Countdown + Protect the Objective**
- A wipe timer AND a friendly NPC to keep alive. Offensive and defensive demands simultaneously.
- Purpose: The player can't go full offense (NPC dies) or full defense (countdown wipes). Balance is key.

**Stage 5: "The Threshold"**
- Enemies: Maximum difficulty regular encounters. Full synergies, evolved champions, 4–5 waves.
- Purpose: Final warm-up before the boss. Everything at maximum non-boss difficulty.

**Stage 6 (optional): "The Void's Edge"**
- Enemies: Void-element enemies (no element advantage/disadvantage). Negates element matchup advantages.
- Purpose: Strips away element advantage — the player must win on raw team quality, synergy bonuses, and items alone.

### Boss: The Void Sovereign (2×2)

The final boss. Three phases testing different aspects of mastery. Tuned so 7-threshold teams can beat it with excellent play. Prismatic teams can enjoy the power fantasy.

| Property | Value |
|----------|-------|
| Grid Size | 2×2 |
| Phases | 3 |
| Element | Void (no advantage/disadvantage) |
| Enrage | 150s |
| Key Mechanic | Unit copying, board shrink, DPS check |

**Phase 1 — "The Puppeteer" (100–70% HP):**
- **Void Tendrils** (every 8s): 3 random player units rooted for 1.5s, take 50% ATK damage.
- **Elemental Mimicry** (passive): Copies the element of whichever player unit dealt the most damage in the last 5s. Gains that element's advantages.
- **Void Barrier** (passive): Shield equal to 15% max HP regenerates every 20s.
- Strategy: Sustained DPS to break barriers. Diverse element damage so Mimicry doesn't hard-counter one element too long.

**Phase 2 — "The Commander" (70–30% HP):**
- Transition: 3s invulnerability. Purple shockwave pushes all player units to back row.
- **Summon Void Champions** (once): Spawns 4 Void-element copies of random player units. Same stats, same abilities, hostile. Persist until killed.
- **Void Beam** (every 10s): Line attack across entire row with most player units. 100% ATK void damage. 2s purple line telegraph.
- **Dimensional Rift** (every 20s): Swaps positions of 2 random player units with 2 Void Champions.
- Strategy: Diverse teams minimize copycat danger (copies of healers are less threatening than copies of carries). Must kill champions while dodging beam.

**Phase 3 — "The Unmaker" (30–0% HP):**
- Transition: 3s invulnerability. All remaining Void Champions instantly die. Screen turns dark purple.
- **Healing Suppression** (passive aura): -15% healing received by all player units.
- **Annihilation** (every 12s): ALL player units take 70% ATK damage. Unavoidable. The DPS check.
- **Void Collapse** (every 20s): Removes 2 random grid cells from the battlefield. Units on them pushed to adjacent cells. Board shrinks over time.
- **Final Form** (below 10% HP): ATK doubled, attack speed doubled. 15s to finish or wipe.
- Strategy: Pure DPS race. Annihilation sets a hard clock — if healing can't keep up (and it's suppressed), the team will die. Board shrink punishes slow play.

---

## Encounter Mechanics — Master Reference

For reuse across regions, boss fights, and future content.

| Mechanic | First Appears | Reused In |
|----------|---------------|-----------|
| VIP Target | Region 4 Stage 1 | Region 7 Stage 3, Region 8 Stage 3, Colossus Phase 1 |
| Countdown | Region 4 Stage 2 | Region 7 Stage 5, Region 8 Stage 4, Colossus Phase 2, Arbiter Phase 3 |
| Reinforcement Pressure | Region 4 Stage 3 | Region 7 Stage 2, Region 8 Stage 2, Colossus Phase 2 |
| Protect the Objective | Region 4 Stage 4 | Region 7 Stage 3, Region 8 Stage 4 |
| Split Formation | Region 4 Stage 5 | Region 7 Stage 4, Region 8 Stage 3, Colossus Phase 3, Arbiter Phase 2 |
| Escalating Threat | Region 4 (implicit via boss) | Region 7 Stage 1, Region 8 Stage 2 |

---

## Boss Quick Reference

| Boss | Region | Grid | Phases | Key Mechanic | Tests |
|------|--------|------|--------|--------------|-------|
| Veil Warden | 1 | 2×2 | 1 | Telegraphed AoE | Basic combat awareness |
| The Archon | 2 | 2×2 | 1 (stances) | Stance shifting | Archetype understanding |
| Twin Heralds | 3 | 2×1×2 | 2 | Kill-order puzzle, proximity buff | Synergy and split damage |
| Shattered Colossus | 4 | 2×2 | 3 | Encounter mechanic phases | Adaptive tactics |
| Elemental Chimera | 5 | 2×2 | 1 (rotation) | Element shifting + absorption | Dual-element mastery |
| Prismatic Sentinel | 6 | 2×2 | 1 (rotation) | Rotating immunity/vulnerability | Multi-element orchestration |
| Arbiter of Trials | 7 | 2×2 | 3 | Mid-fight lock imposition | Combined mastery |
| Void Sovereign | 8 | 2×2 | 3 | Unit copying, board shrink, DPS race | Everything |

---

## Open Design Questions

1. **Boss feature gating**: Which features unlock at which boss clears? (Deferred to progression session)
2. **Story and narrative**: Region names, mission dialogue, lore context (Deferred to story session)
3. **War Room building**: Current intel mechanic may need rethinking (Flagged for separate discussion)
4. **Stage wave counts**: Specific wave counts per stage TBD — depends on pacing feel during implementation
5. **Enemy composition specifics**: Exact unit budgets, star levels, and synergy configurations per stage need detailed tuning pass
6. **Grind missions**: How do repeatable grind missions fit alongside the region structure? Separate system or integrated?
7. **Prismatic threshold tuning**: 10-element requires significant grinding — need to verify the math on how many units/team slots are needed and how long the grind takes
8. **Region 4 encounter mechanics in other content**: Should Endless Mode (The Abyss) also use these encounter mechanics as floor modifiers?

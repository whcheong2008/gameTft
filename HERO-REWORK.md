# Hero System Rework — Philosophy-Based Overlays

> Replaces HERO-SYSTEM-DESIGN.md. 6 heroes (down from 8), matched to story cast. Heroes are playstyle philosophies, not roles — they modify any unit regardless of archetype. Kael on a Mage makes a protector-mage. Lyric on a Tank makes a kill-seeking bruiser.

---

## Core Design

### What Heroes Do

- **Enable item equipping** on the assigned unit (units without heroes can't use equipment)
- **Provide passive bonuses** from invested skill nodes
- **Define a playstyle** through their philosophy — the same unit plays differently depending on which hero overlays it
- **Gain XP independently** (hero level 1-20, ~1.5× unit XP rate)
- **Carry between units** — reassign a hero to a different unit anytime at camp. The hero keeps its level and skill investment.

### What Heroes Don't Do

- Don't add stats directly (no "+8% ATK just for having a hero"). Every bonus is conditional on playing the hero's philosophy.
- Don't lock to archetypes or elements. Any hero works on any unit.
- Don't replace the unit's identity. The unit still has its own passive, ability, and archetype. The hero *layers* on top.

### Skill Tree Structure

Each hero has **2 branches with 5 tiers each (10 nodes per branch, 20 total)**. Hero level cap: 20. One skill point per level = 20 points total.

**At each tier, players choose 1 or both options**, paying full cost for each. **Must complete at least 1 node at each prior tier to unlock the next tier.**

**Tier costs and level requirements:**

| Tier | Level Req | Cost per choice | Tier identity |
|------|-----------|----------------|---------------|
| T1 | L1 | 1pt | Foundation |
| T2 | L5 | 1pt | Early specialization |
| T3 | L9 | 2pt | Mid-game power |
| T4 | L13 | 4pt | IMPACTFUL — the meaningful penultimate |
| T5 | L17 | 5pt | Capstone — ultimate power |

**Budget math (20 points total):**
- Min full branch (1 pick per tier): 1+1+2+4+5 = **13pts**
- Through T4 (1 pick per tier, no capstone): 1+1+2+4 = **8pts**
- Both capstones minimum: 26pts > 20 → **impossible**
- **One capstone + other branch T4: 13+8 = 21 > 20 → also impossible!**

This creates hard tension: **you cannot have a capstone AND reach T4 in the other branch.** Every build requires a real sacrifice.

**Three core build archetypes:**
1. **Capstone + T3** (13+7): One capstone branch + other through T3 with extra double-picks. Deep mastery of one philosophy, moderate access to the other.
2. **Dual T4** (8+8+4 doubles): Both branches through T4 (single picks) + extra double-picks at T1-T3. Two impactful T4 powers, no capstone. Broad and flexible.
3. **Deep T4** (14+6): One branch through T4 with doubled T3+T4 (1+1+4+8=14) + other through T3 (1+1+2+2=6). Master one branch's T4 choices + moderate secondary.

**Nodes are hidden (shown as ?) until the level requirement is met.** Player discovers the tree as they play.

**Respec**: Available at camp. Costs 500 VE first time, +500 each subsequent respec. Allows full redistribution.

---

## Hero Roster

| # | Name | Acquired | Lost | Philosophy | One-Line |
|---|------|----------|------|------------|----------|
| 1 | **Kael** | Start | Never | Protection | "No one falls while I stand." |
| 2 | **Lyric** | Start | Dies R4 mid | Efficiency | "Maximum output, whatever the cost." |
| 3 | **Ren** | R2 | Never | Steadfast | "I'm here. That's enough." |
| 4 | **Sera** | R3 | Leaves R4, returns late R5 | Precision | "Hit the right target at the right time." |
| 5 | **Maren** | R3 | Leaves R4, returns early R5 | Sustain | "Everyone comes home." |
| 6 | **Voss** | R7 | Never | Momentum | "Results. Now." |

### Availability Timeline

| Region | Heroes | Count | Notes |
|--------|--------|-------|-------|
| R1 | Kael, Lyric | 2 | Tutorial pair. Only 2 of 3 team slots get heroes. |
| R2 | + Ren | 3 | All 3 slots covered. First full-hero team. |
| R3 | + Sera, Maren | 5 | More heroes than team slots (size 5 at L8). Player chooses which units get heroes. |
| R4 early | All 5 | 5 | Full strength. |
| R4 mid | Lyric dies. Sera & Maren leave. | **2** | Kael + Ren only. Devastating power dip. |
| R5 early | + Maren returns | 3 | Slow rebuild. |
| R5 late | + Sera returns | 4 | Getting stronger. |
| R6 | Kael, Ren, Sera, Maren | 4 | Stable. Lyric's absence permanent. |
| R7 | + Voss | 5 | Full strength (different composition). |
| R8 | Same | 5 | Final push. Max team size 8, 5 heroes = 3 unhero'd units. |

**Design note**: At max team size (8), you have 5 heroes for 8 slots. The 3 unhero'd units can't equip items and don't get hero bonuses. This creates a meaningful choice: which units deserve the hero overlay? Your strongest units? Your squishiest? Your carries? The answer changes depending on your team comp and the heroes' philosophies.

---

## Hero 1: Kael — The Protector

*"No one falls while I stand."*

**Philosophy**: Kael rewards keeping your team alive. His bonuses trigger when allies survive, when the equipped unit protects others, and when the team is at full strength. He penalizes ally deaths — losing teammates weakens his bonuses. Put Kael on any unit and it becomes a protector, regardless of its archetype.

**Why this fits the story**: Kael's entire arc is about refusing to sacrifice people. His principles — protect everyone, trade no one — are his strength and his tragedy. Mechanically, his hero overlay IS those principles.

### Branch A: Guardian's Oath (personal protection of others)

| Tier | Choice 1 | Choice 2 |
|------|----------|----------|
| T1 (1pt, L1) | **Shield Ally**: When an adjacent ally drops below 30% HP, grant them a shield equal to 8% of your max HP (once per ally per combat) | **Frontline Defender**: You gain +8% DR when at least 1 ally is behind you (further from enemy spawn) |
| T2 (1pt, L5) | **Retribution**: When an adjacent ally takes damage, your next attack deals +15% bonus damage | **Hold the Line**: You gain +12% HP. Adjacent allies gain +6% HP |
| T3 (2pt, L9) | **Reactive Shielding**: When an ally is CC'd, they instantly gain a shield equal to 10% of your max HP | **Protective Stance**: You gain +8% DR. This increases to +15% DR when any adjacent ally is below 50% HP |
| T4 (4pt, L13) | **Last Defender**: When you are the last surviving hero-equipped unit, gain +25% ATK and +18% DR for 8s | **Coordinated Defense**: When you cast an ability, all adjacent allies gain +12% DR for 3s |
| T5 (5pt, L17) | **Unbreakable Oath** (capstone only): Once per combat, when any hero-equipped ally would die, you absorb the killing blow instead (you take the damage, ally survives at 1 HP). You gain 50% DR for 3s after triggering |

### Branch B: Commander's Presence (team-wide aura based on ally survival)

| Tier | Choice 1 | Choice 2 |
|------|----------|----------|
| T1 (1pt, L1) | **Rallying Presence**: All hero-equipped allies gain +4% ATK and +4% HP | **Strength in Numbers**: All allies gain +2% ATK per surviving hero-equipped unit on the board (max +10% at 5 heroes) |
| T2 (1pt, L5) | **Unified Defense**: All hero-equipped allies gain +5% CC resistance | **Shared Resolve**: When any ally dies, all surviving hero-equipped allies gain +6% ATK for 8s (stacks). Kael grieves, but fights harder. |
| T3 (2pt, L9) | **Tactical Positioning**: You gain +12% ATK if in front row, +12% DR if in back row. Adjacent allies gain half this bonus | **Coordinated Strike**: When you attack a target, nearest hero-equipped ally targeting the same enemy gains +8% ATK |
| T4 (4pt, L13) | **Stalwart Bond**: All allies within 2 cells gain +6% DR. When you take damage, this aura radius expands to 3 cells for 2s | **Inspiring Leader**: When you cast an ability, all hero-equipped allies gain +8% ATK and +6% ability damage for 4s |
| T5 (5pt, L17) | **Supreme Command** (capstone only): Once per combat, activate to give all allies +18% ATK, +12% DR, and CC immunity for 4s. Cooldown: entire combat |

---

## Hero 2: Lyric — The Optimizer

*"Maximum output, whatever the cost."*

**Philosophy**: Lyric rewards aggressive efficiency — kills, speed, damage output. But his strongest bonuses come at a cost: self-damage, HP sacrifice, risk. He's the hero who makes any unit into a glass cannon or a reckless berserker. The question is always: how much are you willing to pay?

**Why this fits the story**: Lyric's utilitarianism isn't cold — it's an expression of love so fierce it calculates. He'll sacrifice himself to save more people. His hero overlay captures that: enormous power, willingly purchased with pain.

**Note**: Lyric dies in R4. His skill tree is locked at whatever level he reached. No further investment. The player carries his invested power for 3 regions of early game, then loses it. This makes his death mechanically devastating — the strongest hero in your roster, gone.

### Branch A: Overcharge (power at a cost)

| Tier | Choice 1 | Choice 2 |
|------|----------|----------|
| T1 (1pt, L1) | **Power Surge**: You gain +10% ATK but take 2% max HP as self-damage every 5s | **Mana Overflow**: You start combat with +30 mana |
| T2 (1pt, L5) | **Reckless Force**: You gain +18% ability damage. Abilities cost 5% max HP in addition to mana | **Sacrifice Engine**: When you drop below 50% HP, gain +22% ATK for the rest of combat |
| T3 (2pt, L9) | **Critical Mass**: You gain +12% crit chance. Crits deal self-damage equal to 3% max HP | **Accelerated Casting**: You gain +15% attack speed. Your ability cooldown is 12% shorter |
| T4 (4pt, L13) | **Overload**: You gain +20% damage dealt. You also take +15% damage from all sources. The risk is real. | **Endgame Engine**: When you score a kill, instantly restore 25% HP and 40% mana |
| T5 (5pt, L17) | **Unleashed Potential** (capstone only): You gain +28% ATK permanently. On death, explode for 350% ATK to all enemies within 2 cells. Lyric's final lesson: even dying should be efficient. |

### Branch B: Calculated Efficiency (rewards for fast kills)

| Tier | Choice 1 | Choice 2 |
|------|----------|----------|
| T1 (1pt, L1) | **Quick Kill**: On kill, you gain +12% ATK speed for 4s | **Resource Extraction**: On kill, restore 18% max mana |
| T2 (1pt, L5) | **Exploit Weakness**: You deal +15% damage to targets below 40% HP | **Synergy Amplifier**: You count as +1 toward your primary archetype synergy |
| T3 (2pt, L9) | **Chain Efficiency**: On kill, nearest ally gains +10% ATK for 3s. Kills benefit the team, not just the killer | **Momentum**: On kill, you gain +8% ATK speed for 4s (stacks up to 5 times) |
| T4 (4pt, L13) | **Execution Bonus**: Your first 3 kills each combat restore 100% mana and grant +15% ATK for 5s | **Hunting Bonus**: You gain +1% ATK per kill this combat, stacking infinitely (resets each new combat) |
| T5 (5pt, L17) | **Utilitarian's Gift** (capstone only): All hero-equipped allies gain +10% ATK and +10% ability damage. On your death, these bonuses double for 8s. Your sacrifice multiplied. |

---

## Hero 3: Ren — The Steadfast

*"I'm here. That's enough."*

**Philosophy**: Ren rewards endurance — staying alive, taking hits, not moving, being reliable. His bonuses scale with time alive and damage absorbed. No flashy mechanics. No kill bonuses. Just: be there, keep standing, and the longer you stand, the stronger you get. Put Ren on a squishy Mage and suddenly that Mage is remarkably hard to kill.

**Why this fits the story**: Ren is the simplest character. He stays because Kael is his friend. He doesn't debate morality. He checks his equipment and stands watch. His hero overlay is that reliability made manifest.

### Branch A: Iron Endurance (personal tankiness that scales with time)

| Tier | Choice 1 | Choice 2 |
|------|----------|----------|
| T1 (1pt, L1) | **Tough Skin**: You gain +12% HP | **Rooted Stance**: While you have not moved for 4+ seconds, gain +10% DR |
| T2 (1pt, L5) | **Endurance**: You gain +1.2% max HP regen per second (stacks with other regen) | **Absorption**: After taking 5 hits, you gain a shield equal to 14% max HP (refreshes after shield breaks + 5 more hits) |
| T3 (2pt, L9) | **Stone Patience**: You gain +1% DR per 10 seconds of combat survived (caps at +10% at 100s) | **Thick Hide**: You gain +8% DR. This increases by +1% for every 10% HP you're missing |
| T4 (4pt, L13) | **Unmovable Force**: You gain +15% damage reduction and cannot be slowed below 50% of normal movement speed | **Last Stand**: When you drop below 20% HP, you gain a shield equal to 25% of the damage you absorbed this combat, up to 30% of your max HP |
| T5 (5pt, L17) | **Immovable** (capstone only): Once per combat, when you drop below 15% HP, become immune to damage for 3s and heal 25% max HP. Then gain +18% DR for the rest of combat. Ren doesn't fall. |

### Branch B: Silent Anchor (nearby allies benefit from Ren's presence)

| Tier | Choice 1 | Choice 2 |
|------|----------|----------|
| T1 (1pt, L1) | **Steady Presence**: Adjacent allies gain +6% HP | **Damage Magnet**: You absorb 10% of damage dealt to adjacent allies |
| T2 (1pt, L5) | **Calming Aura**: Adjacent allies gain +6% CC resistance | **Stubborn Guard**: When an adjacent ally is CC'd, you gain +12% ATK for 5s (Ren gets angry when friends are hurt) |
| T3 (2pt, L9) | **Loyal Shield**: When your shield (from any source) breaks, adjacent allies gain a shield equal to 8% of their max HP | **Protective Presence**: Adjacent allies gain +8% DR. This increases to +12% DR when you are below 40% HP |
| T4 (4pt, L13) | **Guardian Pulse**: Every 6s, you heal the lowest-HP adjacent ally for 12% of your max HP. Nearby enemies lose 3% ATK for 4s | **Anchor Chain**: When an adjacent ally takes damage, they gain +8% DR for 4s and you gain +6% lifesteal for 4s |
| T5 (5pt, L17) | **Unshakeable Bond** (capstone only): All allies within 2 cells gain +10% DR. When you take damage, reduce it by 15% and grant nearby allies +5% DR for 3s. Even protecting, Ren protects. |

---

## Hero 4: Sera — The Precision Striker

*"Hit the right target at the right time."*

**Philosophy**: Sera rewards smart targeting — damage against priority targets, burst windows, finishing blows. Her bonuses trigger on hitting low-HP enemies, on ability crits, on targeting the "right" enemy. Put Sera on a Healer and that Healer starts weaving damage into its rotation, picking off wounded enemies between heals.

**Why this fits the story**: Sera is competitive and precise. She respects efficiency — not Lyric's self-destructive kind, but the clean kind. Hit hard, hit smart, don't waste effort. Her overlay is that precision applied to any unit.

### Branch A: Execution (burst damage on priority targets)

| Tier | Choice 1 | Choice 2 |
|------|----------|----------|
| T1 (1pt, L1) | **Sharp Focus**: You gain +8% ATK | **Armor Pierce**: Your attacks ignore 10% of target's DR |
| T2 (1pt, L5) | **Finishing Blow**: You deal +18% damage to targets below 35% HP | **Critical Precision**: You gain +12% crit chance. Crits apply a mark: marked targets take +10% damage from all sources for 3s |
| T3 (2pt, L9) | **Exploit Opening**: When target is CC'd (stun/root/freeze), your next attack deals +28% damage | **Weak Point**: You deal +6% damage for every 5% missing HP your target has, up to +30% |
| T4 (4pt, L13) | **Burst Window**: Your first 2 ability casts each combat are guaranteed crits and ignore 20% DR | **Priority Strike**: Your attacks against enemies below 50% HP deal +25% damage and apply a debuff that increases their damage taken by +8% for 4s |
| T5 (5pt, L17) | **Death Sentence** (capstone only): Your first ability cast each combat is a guaranteed crit, ignores 30% DR, and if it kills the target, refund 60% mana and grant +15% ATK for 5s. |

### Branch B: Tactical Awareness (team benefits from Sera's precision)

| Tier | Choice 1 | Choice 2 |
|------|----------|----------|
| T1 (1pt, L1) | **Target Caller**: When you attack a target, nearest ally targeting the same enemy gains +10% ATK | **Mana Efficiency**: Your abilities cost 12% less mana |
| T2 (1pt, L5) | **Coordinated Burst**: When you cast ability, nearest hero-equipped ally gains +15% ability damage for their next cast | **Elemental Affinity**: Your element damage multiplier is improved by +0.15 (1.3× advantage → 1.45×) |
| T3 (2pt, L9) | **Focus Fire**: You mark your target. All hero-equipped allies targeting the same marked enemy gain +8% ATK | **Weakpoint Exposure**: When you crit, nearby allies gain +8% crit chance for 3s |
| T4 (4pt, L13) | **Battle Coordination**: All hero-equipped allies within 2 cells gain +6% ATK. When you crit, they gain +10% ATK speed for 2s | **Killsteal Synergy**: When any hero-equipped ally scores a kill, you gain +8% ATK for 4s and your next ability deals +15% damage |
| T5 (5pt, L17) | **Perfect Execution** (capstone only): All hero-equipped allies gain +7% crit chance. When any hero-equipped ally scores a kill, all other hero-equipped allies gain +12% ATK speed for 3s. Sera's competitiveness made collective. |

---

## Hero 5: Maren — The Lifeline

*"Everyone comes home."*

**Philosophy**: Maren rewards sustain — healing, shielding, keeping the team healthy. Her bonuses amplify any healing or shielding, add emergency saves, and convert survival into power. Put Maren on an Assassin and that Assassin heals nearby allies on kills, turns lifesteal into shields, and becomes a sustain-damage hybrid.

**Why this fits the story**: Maren is empathy as action. She left because watching people die while standing on principle broke her. She came back because walking away was worse. Her overlay is that compassion — amplified healing, emergency saves, the desperate desire to bring everyone home.

### Branch A: Restoration (raw healing amplification)

| Tier | Choice 1 | Choice 2 |
|------|----------|----------|
| T1 (1pt, L1) | **Healing Touch**: All healing you receive is +14% stronger | **Recovery Pulse**: You heal adjacent allies for 2.5% of their max HP every 5s |
| T2 (1pt, L5) | **Emergency Care**: Heals on targets below 30% HP are +28% stronger (applies to all heal sources on you and your targets) | **Lifesteal Amplifier**: You gain +8% lifesteal. If you already have lifesteal, it's +8% stronger |
| T3 (2pt, L9) | **Purify**: When you heal an ally (from any source), remove 1 debuff from the target | **Vital Bond**: When you heal an adjacent ally, they gain +8% DR for 4s. You gain +6% ATK for 4s |
| T4 (4pt, L13) | **Shared Vitality**: When you heal, the lowest-HP nearby ally gains 50% of the heal you receive, and you heal 30% of damage absorbed by adjacent shields | **Desperate Measures**: When any ally drops below 25% HP, instantly heal them for 20% of their max HP. Cooldown: 4s per target |
| T5 (5pt, L17) | **Miracle** (capstone only): Once per combat, when any hero-equipped ally drops below 10% HP, instantly heal them to 45% and grant 3s invulnerability. Maren's refusal to let anyone die. |

### Branch B: Protective Warmth (overheal and shield mechanics)

| Tier | Choice 1 | Choice 2 |
|------|----------|----------|
| T1 (1pt, L1) | **Shield Weave**: Your heals (from any source) also grant a shield equal to 12% of the heal amount (5s) | **Mana Flow**: You gain +2.5 mana per second |
| T2 (1pt, L5) | **Overheal Mastery**: 30% of overhealing (healing above max HP) converts to a permanent shield | **Kindred Spirit**: When you are healed, the lowest-HP adjacent ally is healed for 35% of the same amount |
| T3 (2pt, L9) | **Absorb Pain**: You absorb 14% of damage dealt to the lowest-HP ally within 2 cells | **Guardian Shell**: When adjacent allies heal, they gain an additional shield equal to 8% of the heal amount. You gain +8% DR when shields are active on nearby allies |
| T4 (4pt, L13) | **Fortified Presence**: All hero-equipped allies within 2 cells gain +8% shields received and healing received. When shields break on nearby allies, you gain +12% ATK for 3s | **Emergency Sanctuary**: When you cast an ability, create a protective zone for 4s that reduces all incoming damage to allies by 18% and doubles all healing in the zone |
| T5 (5pt, L17) | **Sanctuary** (capstone only): Once per combat, create a 2-cell radius zone around you that reduces all incoming damage to allies by 28% for 5s. During Sanctuary, all healing in the zone is tripled. Maren's answer to the world: "Not here. Not while I'm here." |

---

## Hero 6: Voss — The Momentum Engine

*"Results. Now."*

**Philosophy**: Voss rewards momentum — bonuses that ramp over time, snowball on kills, and punish passivity. Early combat, Voss's unit is ordinary. As the fight drags on or kills accumulate, it becomes terrifying. Put Voss on a support unit and that support transforms into a carry as combat progresses.

**Why this fits the story**: Voss is late-game power personified. He joins in R7 — battle-hardened, efficient, no philosophy beyond "win." His overlay is that relentless forward pressure. He doesn't care about protection or precision or sustain. He cares about results, and results compound.

### Branch A: Ramping Power (bonuses that grow over time)

| Tier | Choice 1 | Choice 2 |
|------|----------|----------|
| T1 (1pt, L1) | **War Cry**: You gain +3.5% ATK every 8s of combat (caps at +28% at ~64s) | **Battle Rhythm**: You gain +2.2% ATK speed every 10s of combat (caps at +18%) |
| T2 (1pt, L5) | **Bloodlust**: You gain +8% lifesteal. Lifesteal increases by +1.2% per 10s of combat | **Combat Readiness**: You gain +1% DR per 10s of combat (caps at +10%) and +2% mana regen per 10s (caps at +20% mana/s) |
| T3 (2pt, L9) | **Berserker Rage**: You gain +1.8% ATK per 10% HP missing (max +18% at low HP) | **Unstoppable Advance**: You become immune to Slow effects after 25s of combat. Your movement speed increases +3% per 10s of combat |
| T4 (4pt, L13) | **Escalation**: Every 15s of combat, you permanently gain +8% ATK and +4% damage dealt. This stacks infinitely | **Veteran's Strength**: After 40s of combat, you gain +20% ATK, +15% ATK speed, and +5% lifesteal. This bonus increases by +5% ATK every 10s of additional combat |
| T5 (5pt, L17) | **Warlord's Fury** (capstone only): After 45s of combat, you enter Fury: +24% ATK, +24% ATK speed, +12% lifesteal. Kills during Fury extend it by 6s and grant +6% ATK permanently. Voss doesn't start strong. He finishes strong. |

### Branch B: Kill Cascade (snowball on kills)

| Tier | Choice 1 | Choice 2 |
|------|----------|----------|
| T1 (1pt, L1) | **First Blood**: Your first kill each combat grants +15% ATK for 6s | **Momentum**: On kill, you gain +10% ATK speed for 4s (stacks up to 5 times) |
| T2 (1pt, L5) | **Intimidate**: On kill, nearby enemies (within 2 cells) lose 6% ATK for 5s | **War Banner**: On kill, all hero-equipped allies gain +6% ATK for 4s |
| T3 (2pt, L9) | **Dominate**: On kill, you gain +4% permanent ATK for the rest of combat (stacks infinitely) | **Killing Spree**: Every kill refreshes your ability cooldown by 20% and grants +8% movement speed for 4s |
| T4 (4pt, L13) | **Execution Cascade**: Every 2nd kill triggers a shockwave: 180% ATK damage to all enemies within 2 cells, and you gain +12% permanent ATK | **Conqueror's Aura**: On kill, gain +8% ATK, and all allies within 2 cells gain +5% ATK for 5s. After 3 kills, your next ability refunds 50% mana |
| T5 (5pt, L17) | **Conqueror** (capstone only): Every 3rd kill triggers a shockwave: 200% ATK damage to all enemies within 2 cells, and all allies gain +12% ATK for 4s. Additional kills grant you +3% permanent ATK. Voss turns kills into team-wide power surges. |

---

## Lyric's Death — Mechanical Impact

When Lyric dies in R4:
- His hero object is removed from the active roster
- His skill investment is preserved in save data (for the ending)
- The unit that was carrying Lyric's overlay loses all hero bonuses AND can no longer equip items
- **The player goes from 5 heroes to 2** (Kael + Ren). With team size 5, that's 3 units without heroes or items.
- This is intentionally devastating. The player has been relying on Lyric's Overcharge or Efficiency bonuses. Losing them mid-campaign forces a complete team rebuild.

**No fragment system.** Lyric is gone. The old HERO-SYSTEM-DESIGN.md had "B's Fragment" recoverable in R7 — this is cut. Lyric's death should be permanent and irreversible, matching the story. Voss in R7 is the replacement, but he's a completely different philosophy (Momentum vs Efficiency). You don't get Lyric back. You learn to play differently.

---

## Hero XP & Leveling

- Heroes gain XP when their equipped unit participates in combat (separate from unit XP)
- Hero XP rate: ~1.5× unit XP rate (heroes level faster since they're the transferable investment)
- Hero level cap: 20
- XP per stage: `heroBaseXP × stageMultiplier` (scales with region like unit XP)
- Heroes NOT in combat do not gain XP (Sera and Maren fall behind during R4-R5 absence)
- Returned heroes (Maren R5 early, Sera R5 late) are behind by ~2-4 levels. This is intentional — they left, they missed the XP. The player must grind them back up or accept the gap.
- Voss joins at R7 at a level matched to the player's average hero level minus 2. He's strong but not fully caught up.

---

## Interaction with Items

**Only hero-equipped units can equip items.** This is the hero system's primary mechanical gate. With 5 heroes and 8 team slots, 3 units cannot use equipment at all. This creates layered decision-making:

1. Which units get heroes? (strongest? most in need of items?)
2. Which hero goes on which unit? (Kael on your tank? Or Kael on your carry to protect it?)
3. How do you itemize hero'd units vs accepting raw units without items?

**The R4 power dip amplifies this.** Going from 5 heroes to 2 means going from 5 itemized units to 2. The item system's power suddenly concentrates on just Kael and Ren's units.

---

## Summary of Changes from HERO-SYSTEM-DESIGN.md

| System | Old | New |
|--------|-----|-----|
| Hero count | 8 | 6 (matching story cast) |
| Hero names | A, B, Kael, Lyra, Maren, Dax, Sera, Voss | Kael, Lyric, Ren, Sera, Maren, Voss |
| Design approach | Role-based (Shieldbearer, Striker, etc.) | Philosophy-based (Protection, Efficiency, etc.) |
| B's Fragment | Recoverable in R7, reduced bonuses | Cut. Lyric's death is permanent. |
| Availability | R1: 2, R2: 3, R3: 4, R4 early: 6, R4 late: 3 | R1: 2, R2: 3, R3: 5, R4 early: 5, R4 late: 2 |
| Max heroes at R8 | 7 + fragment | 5 |
| Team slots vs heroes | ~equal | 8 slots, 5 heroes = 3 unhero'd units |
| Philosophy | Heroes as role amplifiers | Heroes as playstyle modifiers (any unit, any role) |
| Skill tree | 6 nodes per branch, linear progression | 5 tiers per branch, 2 choices per tier, selective progression |
| Capstone cost | 2 pts | 5 pts |
| Total budget | 20 pts | 20 pts (capstone + other T4 impossible — forces real choices) |

---

## Open Questions

1. **Should hero assignment have a cooldown?** If not, players can swap heroes between every stage for free, which reduces the "commitment" feel. Maybe: first swap per stage is free, additional swaps cost VE.
2. **Hero-specific quest lines?** Each hero could have 2-3 optional stages per region that develop their character and grant bonus XP. Not required for story progression, but reward engagement with the hero's personality.
3. **Visual indicator**: How does the player see which unit has which hero? Colored border? Small portrait icon? Aura effect?
4. **Sera and Maren's return levels**: Should they return at a fixed level (e.g., player level - 3) or at whatever level they were when they left? The latter punishes early investment less but feels more realistic.

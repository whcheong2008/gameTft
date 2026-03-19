# Progression Rework — Single-Player Economy & Pacing

> Replaces the live-service economy model in PROGRESSION-DESIGN.md. All numbers tuned for a 30-40 hour single-player experience with no stamina, no premium currency, and Veil Essence as the only currency. See STORY-DRAFT-V1.md § Lore-Mechanics Bridge for narrative justification of all systems.

---

## Design Principles

1. **Something new every region (R1-R7).** R8 is the mastery test — no new systems, just execution.
2. **Veil Essence is the only currency.** Harvested from defeated Voidspawn. No stamina, no gems, no daily gates. Play as much as you want.
3. **Tiered star-up costs.** Common units are cheap to max, rare units are a chase. Matches the gacha dilution math.
4. **Level-gated, not region-gated.** Everything keys off player level. Overfarming a region naturally pushes the player's level up, which unlocks things regardless of story progress.
5. **Post-game is optional but rewarding.** Campaign clearable without grinding. Evolving T5 and achieving prismatic are post-game goals.

---

## Unit Pool — Revised

| Tier | Count | Role | Star-up Cost | To Evolve (3★) |
|------|-------|------|-------------|-----------------|
| T1 | 21 | Common starters, synergy filler | 3 copies/star | 9 total |
| T2 | 15 | Early-mid workhorses | 4 copies/star | 12 total |
| T3 | 12 | Mid-game core units | 5 copies/star | 15 total |
| T4 | **12** (was 6) | Late-game powerhouses | **8 copies/star** | **24 total** |
| T5 | 6 | Legendary chase units | 10 copies/star | 30 total |
| **Total** | **66** | | | |

**Why 12 T4?** With only 6 T4 units and late-game gacha rates favoring T4, each specific T4 accumulated ~29 copies by campaign end — trivially evolve-ready. At 12 units with 8/star (24 to evolve), copies per specific T4 reach ~19.2 by campaign end — 2★ with ~5 copies left to grind. This creates a satisfying "almost there" that motivates post-game play without feeling punishing (~5 R8 stages to push one over the line).

**Roster change required:** 6 new T4 units need designing. Suggest 2 Lightning + 2 Force + 1 Fire + 1 Water to fill element gaps and balance the roster. See UNITS-DESIGN.md for integration.

---

## Team Size Progression

Team size is gated by player level (Veilborn sustaining capacity), with one camp practice upgrade for the final slot.

| Level | Team Size | Expected Region | What Opens Up |
|-------|-----------|-----------------|---------------|
| 1 | 3 | R1 | Front + back row basics |
| 4 | 4 | R2 | First 2-threshold archetype synergy |
| 8 | 5 | R3 | First 4-threshold archetype, dual-element teams |
| 12 | 6 | R5 | 6-threshold archetype possible, triple-element |
| 16 | 7 | R6 | 7-element threshold, deep synergy stacking |
| Sustained Bonds upgrade (req. L17) | 8 | R7 | Full build. Optimization phase. |

**Start at 3, not 2.** Two units on a board is barely a game. Three gives front/back positioning from stage 1.

**No team size increase during R4.** The crisis region. You lose allies in the story; the game compensates with vertical power (ascension, enhancement) rather than more slots. Matches the narrative of a diminished, scrappier group.

---

## Player Level & XP

### XP Per Stage

| Region | Base XP per stage | At-level range |
|--------|-------------------|----------------|
| R1 | 80 | L1-3 |
| R2 | 130 | L3-6 |
| R3 | 200 | L6-9 |
| R4 | 280 | L9-12 |
| R5 | 380 | L12-15 |
| R6 | 500 | L15-17 |
| R7 | 650 | L17-19 |
| R8 | 800 | L19-20 |

### Level Caps — Hard + Soft

**Hard cap per region.** Stages stop giving XP once the player hits the region's max level. The XP bar grays out with "Max level for this region." Advancing to the next region lifts the cap. This prevents any amount of grinding from breaking the progression curve.

| Region | Hard Level Cap | Notes |
|--------|---------------|-------|
| R1 | 4 | Can't outlevel R2's content |
| R2 | 7 | Can't skip R3's team size unlock |
| R3 | 10 | Can't trivialize R4's crisis |
| R4 | 13 | Can't skip R5's rebuild |
| R5 | 16 | Can't access T5 gacha early |
| R6 | 18 | Can't skip R7's optimization phase |
| R7-R8 | 20 | **No cap.** Grind freely. |

**Soft diminishing returns** (in addition to hard cap). Stages give reduced XP when the player is overleveled relative to the stage's intended range. This makes grinding within a region feel progressively less rewarding even before hitting the hard cap.

| Player level vs. stage range | XP multiplier |
|------------------------------|---------------|
| At-level or below | 100% |
| 1-2 levels above | 75% |
| 3-4 levels above | 50% |
| 5+ levels above | 25% |

The hard cap is the real gate. The soft diminishing returns shape the feel — grinding R3 at level 9 gives less XP per stage, nudging the player forward before they even hit the cap at 10.

### XP Curve (Cumulative XP to Level) — VALIDATED

Simulated across a full 74-stage playthrough. Every region hits its target level exactly. Curve is monotonically increasing with no weird jumps. Diminishing returns cap overleveling (20 extra R3 stages → still only level 12).

| Level | Cumulative XP | XP for this level | Expected Region |
|-------|---------------|-------------------|-----------------|
| 1 | 0 | — | R1 start |
| 2 | 360 | 360 | R1 mid |
| 3 | 720 | 360 | R1 end |
| 4 | 1,110 | 390 | R2 early |
| 5 | 1,500 | 390 | R2 mid |
| 6 | 1,890 | 390 | R2 end |
| 7 | 2,490 | 600 | R3 early |
| 8 | 3,090 | 600 | R3 mid |
| 9 | 3,690 | 600 | R3 end |
| 10 | 4,530 | 840 | R4 early |
| 11 | 5,370 | 840 | R4 mid |
| 12 | 6,210 | 840 | R4 end |
| 13 | 7,476 | 1,266 | R5 early |
| 14 | 8,743 | 1,267 | R5 mid |
| 15 | 10,010 | 1,267 | R5 end |
| 16 | 12,510 | 2,500 | R6 mid |
| 17 | 15,010 | 2,500 | R6 end |
| 18 | 18,260 | 3,250 | R7 mid |
| 19 | 21,510 | 3,250 | R7 end |
| 20 | 27,910 | 6,400 | R8 end |

Total raw XP from a straight playthrough: 27,910. Level 20 requires exactly 27,910 — hitting max at the final stage of R8.

---

## Region Unlock Map — "Something New Every Region"

| Region | Level Range | New System | Why It Matters |
|--------|-------------|------------|----------------|
| R1 | 1-3 | **Team size 3**, T1-T2 Attunement Rite, Camp basics | Learn the game. Summon Echoes, build team, fight. |
| R2 | 3-6 | **Team size 4** (L4), Echo Shaping unlocks (L5), T3 trickles in (L5) | 4th slot enables real synergies. Echo Shaping gives purpose to junk items. |
| R3 | 6-9 | **Team size 5** (L8), Deep Resonance (L7), Prism Focus / gem sockets (L6) | First 4-threshold archetype. Evolution gives T1-T2 a second life. |
| R4 | 9-12 | T4 trickles in (L9), **Awakened ascension** (unit L15, player L10), enhancement to +5 (L10) | Vertical power compensates for story losses. Secondary archetypes add comp flexibility. |
| R5 | 12-15 | **Team size 6** (L12), set crafting (L13), **Exalted ascension** (unit L25, player L14) | Rebuild with better tools. 6th slot + T4 units = clearly stronger than pre-R4. |
| R6 | 15-17 | **Team size 7** (L16), **T5 enters Attunement Rite** (L15, ~2%), mythic crafting (L16), enhancement to +10 (L16) | Peak new systems. T5 legendaries are the chase. Transcendent at unit L30. |
| R7 | 17-19 | **Team size 8** (Sustained Bonds upgrade, req. L17), T5 rate climbing, all systems open | Full build. Experiment with final composition. No XP diminishing returns. |
| R8 | 19-20 | **Nothing new.** | Mastery test. Prove you learned. |

---

## Veil Essence Economy

All costs are in **Veil Essence** (VE), harvested from defeated Voidspawn. See STORY-DRAFT-V1.md § Lore-Mechanics Bridge for narrative context.

### Costs

| Action | Cost (VE) | Notes |
|--------|-----------|-------|
| Single Attunement Rite (summon) | 50 | |
| 10-pull Rite | 450 | 10% discount via Attunement Rite practice level |
| Camp practice upgrades | 200-5,000 | Scales with practice level |
| Enhancement per level | 50-500 | Scales with enhancement level |
| Deep Resonance (evolution) | 500-2,000 | Scales with Echo tier |
| Echo Shaping: reroll | 100 | |
| Echo Shaping: disassemble | 50 | |
| Echo Shaping: transmute | 200 | |
| Echo Shaping: set craft | 500-1,000 | + element essences |
| Echo Shaping: ability craft | 1,000-2,000 | |
| Ascension (Awakened) | 1,000 | |
| Ascension (Exalted) | 2,500 | |
| Ascension (Transcendent) | 5,000 | |
| Hero respec | 500 first, +500 each time | Escalating cost |

### Veil Essence Income Per Region (First Playthrough)

| Region | Stages | VE/Stage (avg 3★) | Region Total | Cumulative |
|--------|--------|---------------------|-------------|------------|
| R1 | 9 | 200 | 1,800 | 1,800 |
| R2 | 9 | 350 | 3,150 | 4,950 |
| R3 | 9 | 550 | 4,950 | 9,900 |
| R4 | 9 | 750 | 6,750 | 16,650 |
| R5 | 10 | 1,000 | 10,000 | 26,650 |
| R6 | 10 | 1,300 | 13,000 | 39,650 |
| R7 | 10 | 1,600 | 16,000 | 55,650 |
| R8 | 8 | 2,000 | 16,000 | 71,650 |
| **Total** | **74** | | | **71,650 VE** |

### Essence Allocation (Expected Player Behavior)

| Sink | % of VE | Total (campaign) | What It Buys |
|------|---------|-----------------|-------------|
| Attunement Rites (summoning) | 40% | ~28,600 VE | ~637 rites over entire game |
| Camp practice upgrades | 20% | ~14,300 VE | All practices to mid-high level |
| Enhancement | 18% | ~12,900 VE | Core team items to +5/+6, a few to +8 |
| Echo Shaping (crafting) | 12% | ~8,600 VE | Set items, ability items, rerolls |
| Deep Resonance / ascension | 10% | ~7,200 VE | Evolve 3-5 key Echoes, a few ascensions |

---

## Gacha Rates by Player Level

Rates shift with every level. T5 first appears at level 15 (~2%) and caps at 10% at level 20.

| Level | T1 | T2 | T3 | T4 | T5 | Expected Region |
|-------|-----|-----|-----|-----|-----|-----------------|
| 1 | 75% | 25% | — | — | — | R1 |
| 3 | 60% | 35% | 5% | — | — | R1 end |
| 5 | 45% | 38% | 17% | — | — | R2 |
| 7 | 35% | 33% | 32% | — | — | R3 |
| 9 | 28% | 28% | 38% | 6% | — | R4 |
| 11 | 22% | 25% | 40% | 13% | — | R4 end |
| 13 | 18% | 22% | 38% | 22% | — | R5 |
| 15 | 15% | 18% | 35% | 30% | 2% | R6 |
| 17 | 12% | 15% | 30% | 37% | 6% | R7 |
| 19 | 10% | 12% | 25% | 43% | 10% | R8 |
| 20 | 8% | 10% | 22% | 50% | 10% | R8 end |

### Mission Unit Drops (Tier-Weighted by Region)

Stages drop 2-4 unit copies per clear (in addition to gacha rolls). Drops are tier-weighted by region, not player level, so they always feel relevant to where you are in the story.

| Region | Drops/Stage | T1 | T2 | T3 | T4 | T5 |
|--------|------------|-----|-----|-----|-----|-----|
| R1 | 2 | 70% | 30% | — | — | — |
| R2 | 2 | 50% | 40% | 10% | — | — |
| R3 | 2 | 30% | 35% | 35% | — | — |
| R4 | 3 | 15% | 25% | 45% | 15% | — |
| R5 | 3 | 5% | 15% | 40% | 35% | 5% |
| R6 | 3 | 5% | 10% | 30% | 40% | 15% |
| R7 | 3 | — | 5% | 20% | 45% | 30% |
| R8 | 4 | — | — | 15% | 45% | 40% |

---

## Expected Unit Copies — Campaign Total (No Replays)

Based on ~637 Attunement Rites + ~200 mission Echo drops across 74 stages:

| Tier | Units | Copies/Specific Unit | Star Level | Evolve Status |
|------|-------|---------------------|------------|---------------|
| T1 | 21 | ~7.2 | 2★ | Need ~1.8 more (light grind) |
| T2 | 15 | ~10.5 | 2★ | Need ~1.5 more (light grind) |
| T3 | 12 | ~20.6 | **4★ EVOLVE-READY** | Natural by R7, surplus copies |
| T4 | 12 | ~19.2 | 2★ | Need ~4.8 more (moderate grind) |
| T5 | 6 | ~8.8 | 0★ | Need ~21.2 more (serious post-game) |

### Milestone Timeline

| Tier | First 1★ | Evolve-ready | Notes |
|------|----------|-------------|-------|
| T1 | R3 | Post-game (~26 R8 stages) | Diluted by 21-unit pool, but cheap per star |
| T2 | R4 | Post-game (~13 R8 stages) | Quick grind once you focus |
| T3 | R4 | **R7** (natural) | Your mid-game workhorses evolve during the story |
| T4 | R7 | Post-game (~5 R8 stages) | Almost there by campaign end — satisfying push |
| T5 | Never (during campaign) | Post-game (~38 R8 stages) | The chase. Prismatic is aspirational. |

### Progression Feel

- **T1**: Your starter units. Cheap to star (3/star) but heavily diluted (21 units). You'll have favorites at 2★ by campaign end, tantalizingly close to evolve. Grinding early regions for the last 2 copies is quick and satisfying.
- **T2**: Mid-early workhorses. Naturally reach 2★ by R7. Just 1.5 copies short of evolving — a few R8 clears or some early-region farming gets you there.
- **T3**: The sweet spot. These are your mid-game core — naturally evolve-ready by R7 from regular play. The first tier where evolution feels earned through the campaign itself. By R8 you have surplus copies to star evolved forms.
- **T4**: Late-game power spikes. 12 units dilute the pool enough that they're not free. At 19.2 copies by campaign end, you're 2★ with ~5 copies to go — a satisfying "almost there" that motivates ~5 R8 clears. The 8/star cost means each star-up feels weighty.
- **T5**: The chase. 8.8 copies = not even 1★ yet. Evolving a T5 (30 copies) requires ~38 R8 stages post-campaign (~26 min at auto-battle speed). This is the aspirational endgame goal. **Prismatic (10-element via evolved T5) is explicitly a post-game achievement.**

---

## Post-Game Grind Estimates

Farming R8 stages at 2,000 VE/stage with auto-battle at 4× speed (~40s per stage including menus):

| Goal | Extra Copies Needed | R8 Stages | Time (4× auto) | VE Cost |
|------|--------------------|-----------|--------------------|---------|
| Evolve a specific T1 | ~1.8 | ~26 | ~18 min | ~52,000 |
| Evolve a specific T2 | ~1.5 | ~13 | ~9 min | ~26,000 |
| **Evolve a specific T4** | **~4.8** | **~5** | **~4 min** | **~10,000** |
| 1★ a specific T5 | ~1.2 | ~2 | ~1 min | ~4,000 |
| **Evolve a specific T5** | **~21.2** | **~38** | **~26 min** | **~76,000** |
| Evolve ALL 6 T5 units | ~127 | ~226 | ~2.6 hr | ~452,000 |
| Prismatic achievement | Evolved T5 + 7 same-element | ~50+ | ~35 min+ | ~100,000+ |

**Note:** T1 evolving takes longer than T4 despite being a "lower" tier because T1 units are heavily diluted across a 21-unit pool. This is intentional — common units are individually cheap to star but hard to target. T4 units are expensive per star but concentrated in the pool.

---

## Playtime Analysis

### Stage Count

| Region | Stages | Notes |
|--------|--------|-------|
| R1 | 9 | Tutorial + establishment |
| R2 | 9 | Growth + Mira joins |
| R3 | 9 | First cracks, Sovereign sighting |
| R4 | 9 | Crisis: revelation, fight, death, split |
| R5 | 10 | Rebuild, seal theory, personal costs |
| R6 | 10 | Weight accumulates, doubt |
| R7 | 10 | Reunion, Voss, proving grounds |
| R8 | 8 | Final push, Sovereign, seal |
| **Total** | **74** | |

R5-R7 get 10 stages each because these are the regions where the player is experimenting with expanded rosters and new systems. R8 is shorter — the final push should feel urgent, not padded.

### Time Budget (First Playthrough)

| Activity | Time Per Stage | Total (74 stages) |
|----------|---------------|-------------------|
| Combat (1× speed) | ~2.5 min | 3.1 hr |
| Team building / repositioning / thinking | ~2.0 min | 2.5 hr |
| Story dialogue and scenes | ~2.0 min (avg, key beats are 3-5 min) | 2.5 hr |
| Camp management (rolling, building, equipping) | ~8 min per region × 8 | 1.1 hr |
| Between-stage menus | ~0.5 min | 0.6 hr |
| **Subtotal: First Clear** | | **~9.7 hr** |

| Additional Activity | Estimate |
|---------------------|----------|
| Retrying difficult stages (~20% of stages, full time) | 0.9 hr |
| Replay grinding (~60% of stages at 4×) | 0.9 hr |
| Camp management during replays | 0.4 hr |
| **Subtotal: Campaign with grinding** | **~11.9 hr** |

| Post-Game | Estimate |
|-----------|----------|
| Hard mode replays (unlocked after first clear) | 3-5 hr |
| Evolving T4/T5 chase (~80 stages at 4× auto) | 1.0 hr |
| Camp optimization, reforging, team experiments | 1.0 hr |
| Endless mode / challenge modes | 5-10 hr |
| **Total potential playtime** | **~25-30 hr** |

### Closing the Gap to 30-40 Hours

The current model lands at 25-30 hours for a thorough player. The remaining gap is covered by:

1. **Richer story scenes** — R4 alone (revelation, midnight conversation, fight, Lyric's death, cost, split) could be 30+ min of story. Key story regions (R4, R7, R8) likely average 3-5 min/stage, not the 2 min baseline. Realistic story estimate: +2-3 hr for an engaged reader.
2. **Hard mode per stage** — after first clear, each stage unlocks a harder variant with better rewards and different enemy comps. 74 hard-mode stages at 4× = 3-5 hr.
3. **Endless mode (The Abyss)** — wave-based survival. Major time sink for completionists.
4. **Challenge modes** — timed clears, restricted teams, element-locked runs. Each is ~5-10 min but there are many of them.

**Expected total**: ~30-35 hr for a thorough player who does hard mode + some post-game grinding. 40+ hr for completionists chasing all T5 evolutions and prismatic.

---

## Narrative Integration

### Camp Practices (Replacing Buildings)

The "hub" is a **field camp** that travels with the group. Old "buildings" are now **camp practices** — techniques the Veilborn and Resonants refine between stages. All costs are in Veil Essence. Full narrative mapping is in STORY-DRAFT-V1.md § Lore-Mechanics Bridge.

| Old Building | Camp Practice | What It Is |
|-------------|--------------|-----------|
| Summoning Circle | Attunement Rite | Ritual for calling Echoes through the Veil |
| Barracks | Sustained Bonds | How many Echoes the Veilborn can hold at once (team size) |
| Warehouse | Essence Reservoir | Storage for harvested Veil Essence |
| Forge | Echo Shaping | Reshaping Veil energy within items/equipment |
| Evolution Lab | Deep Resonance | Pushing an Echo past its natural form |
| Gem Workshop | Prism Focus | Cutting crystallized Veil energy into gems |
| Mana Shrine | Veil Wellspring | Ambient Veil energy channel for the camp |
| Bond Hall | Kindred Circle | Where bonded Echoes train together |

### Currency: Veil Essence

**Veil Essence replaces gold.** Harvested from defeated Voidspawn — their residual Veil energy lingers after they fall. The thematic loop: fight Voidspawn → harvest essence → summon and strengthen Echoes → fight more Voidspawn. Post-R4, this carries an uncomfortable subtext: the essence that corrupted the Voidspawn is the same energy that powers your Echoes.

### R4 Power Dip — Mechanical Mirror of Story

When Lyric dies and the group splits (mid-R4):
- **No new team slot** in R4 (next one is R5 at level 12)
- **No new gacha tier** (T4 trickles in at L9, but slowly)
- **Vertical power compensates**: Awakened ascension + enhancement to +5
- The player is forced to invest deeper in fewer units — exactly what Kael does in the story

### T5 and Prismatic as Post-Game

T5 units first appearing at level 15 (~R6) with 2% rate means:
- You might see 1-2 T5 units during R6-R7. They're exciting but can't be starred yet.
- By R8 end you have ~7 copies total across 6 T5 units. Not even 1★ for any specific one.
- Evolving a T5 (30 copies) requires dedicated post-game farming.
- Prismatic (10-element synergy via evolved T5 counting as 2) is the ultimate achievement — requires a fully evolved T5 + 7 same-element teammates on a size-8 team.

**Prismatic is a reward, not a requirement.** R8 is clearable with mixed-tier teams running 4 or 7-element threshold + good archetypes.

---

## Star-Up System — Tiered Costs

### Rationale

With 66 units in the Attunement Rite pool, copies of any specific unit are scarce. A flat 10-copies-per-star means T1 Echoes (21 in pool, heavily diluted) are harder to star than T4 (12 in pool, high late-game rates). Tiered costs fix this inversion:

| Tier | Copies/Star | Stars to Evolve | Total Copies | Design Intent |
|------|-------------|-----------------|--------------|---------------|
| T1 | 3 | 3 | 9 | Common units should be easy to max. Your starters reward loyalty. |
| T2 | 4 | 3 | 12 | Slightly harder. These are your reliable mid-game core. |
| T3 | 5 | 3 | 15 | The natural evolution tier — you'll evolve these during R7-R8 without grinding. |
| T4 | 8 | 3 | 24 | Late-game investment. 2★ by campaign end — moderate grind to evolve. |
| T5 | 10 | 3 | 30 | Chase tier. Starring one T5 is a mini-project. Evolving is a post-game goal. |

### Stat Scaling Per Star

Kept from current system: **1.8^(stars-1)** multiplier to base stats.

| Stars | Multiplier | Effective Power |
|-------|-----------|-----------------|
| 0★ (base) | 1.0× | Baseline |
| 1★ | 1.0× | +copies invested, minor stat bump |
| 2★ | 1.8× | Meaningful upgrade |
| 3★ | 3.24× | Evolution threshold — unlocks evolved form |
| 4★ | 5.83× | Post-evolution starring |
| 5★ | 10.5× | Near-max power |

---

## Open Questions

1. **T4 unit designs**: 6 new T4 units needed (12 total, up from 6). Suggest 2 Lightning + 2 Force + 1 Fire + 1 Water to balance element coverage. Needs roster integration with UNITS-DESIGN.md.
2. **Hard mode details**: How should hard-mode stages differ? Higher enemy levels? New mechanics? Both?
3. **Stage content for 9-10 per region**: Story draft currently maps to ~5-6 key beats per region. 9-10 stages means ~3-5 "gameplay" stages per region alongside story beats. Encounter mechanics, mini-boss variants, and environmental hazards fill these — they don't need story scenes, just good fights.
4. **Exact XP curve**: The numbers above are estimates. Need to simulate a full playthrough to verify a no-grind player hits expected levels.
5. **Essence scaling for replays**: Should replayed stages give less VE (like XP diminishing returns)? Or full VE to encourage farming? Current model assumes full VE on replay.
6. **Echo release values**: Players will accumulate excess low-tier copies. Release value (selling) needs to be meaningful enough to feel good but not so high that it distorts the essence economy. Suggest: T1=5, T2=10, T3=20, T4=50, T5=100 VE per copy.
7. **Hero system alignment**: Deferred until story is finalized. Hero count, names, and skill trees will be redesigned to match the story cast. See CONTINUITY.md for status.

---

## Summary of Changes from Current System

| System | Old | New |
|--------|-----|-----|
| Currency | Gold | Veil Essence (harvested from Voidspawn) |
| Rite cost | ~5 gold | 50 VE (10-rite: 450 VE) |
| Star-up cost | 10 copies/star (all tiers) | Tiered: T1=3, T2=4, T3=5, T4=8, T5=10 |
| T4 unit count | 6 | 12 |
| Total units | 60 | 66 |
| Team size start | 2 | 3 |
| Team size progression | +1 every 2 levels | +1 at levels 4, 8, 12, 16 + Barracks |
| Team size max | 9 (Barracks +2) | 8 (Sustained Bonds +1) |
| Summoning gating | By player level 1-20 | By player level (unchanged, but T5 caps at 10%) |
| Hub | Static hub with buildings | Mobile camp with practices |
| Stamina | 120 max, time-gated | Removed |
| Premium currency (gems) | Gem shop, IAP | Removed |
| Daily quests | 4/day | Removed (single-player) |
| Weekly quests | Weekly reset | Removed |
| Stages per region | ~6 | 9-10 (74 total) |
| Campaign essence total | ~20,000 gold (old model) | ~71,650 VE |
| Target playtime | Daily sessions, 12+ months | 30-40 hours, one continuous experience |

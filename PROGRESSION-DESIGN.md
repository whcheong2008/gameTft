# Progression & Economy — Deep Design Document

> Comprehensive progression, economy, and retention design for a publishable auto-battler. Unifies all existing economy numbers, defines the daily/weekly player loop, models the power curve over time, and ensures all gold sinks and sources are balanced for a 12+ month player lifecycle.

## Design Goals

1. **Predictable income, meaningful choices**: Players should always know roughly how much gold/XP they'll earn per session. The choices are in how they spend it — rolling vs. enhancing vs. building vs. evolving.
2. **Multiple progression axes**: No single bottleneck. Players progress through unit power (star-ups, evolution, ascension), item power (enhancement, gems, mythics), hub power (buildings), and account power (player level, collection bonuses).
3. **Session-friendly pacing**: Each play session (15–30 min) should yield visible progress on at least one axis. No session should feel wasted.
4. **Long tail without paywall**: F2P players reach endgame content within 3–4 months. Maxing everything takes 12+ months. Premium currency accelerates but never gates.
5. **Sink/source equilibrium**: At every stage of the game, gold income ≈ gold spending. No stage should have massive gold surplus or crippling deficit.

---

## 1. Currency Overview

### Primary Currencies

| Currency | Icon | Source | Primary Sink | Cap |
|---|---|---|---|---|
| **Gold** | 🪙 | Missions, selling, dailies | Rolling, buildings, forge, enhancement | No cap |
| **Gems** (premium) | 💎 | Achievements, weekly, events, IAP | Premium gacha banner, cosmetics, stamina refill | No cap |
| **Stamina** | ⚡ | Time regen, level-up refill, gems | Mission attempts | 120 max |

### Secondary Currencies (earned, not purchased)

| Currency | Source | Sink |
|---|---|---|
| **Element Essences** (4 types) | Mission drops (level 8+), boss kills | Set item crafting at Forge |
| **Arcane Essence** | Boss kills (guaranteed) | Arcane set crafting |
| **Mythic Materials** (3 types) | Bosses, mission 14, ascension | Mythic item crafting |
| **Ascension Shards** | Duplicate unit overflow, weekly shop | Ascension tier upgrades |
| **Bond Tokens** | Deploying bonded units together (1 token per bonded pair per mission, 2 for trio) | Bond ability upgrades |

### Currency Conversion (one-way only)
- Gems → Gold: 1 gem = 10 gold (via shop, no reverse)
- Gems → Stamina: 50 gems = full stamina refill (max 3/day)
- Excess unit copies (beyond Transcendent) → Ascension Shards: 1 copy = 2 shards × unit cost

---

## 2. Stamina System

### Overview
Stamina gates how many missions a player can attempt per day. This is the primary pacing lever — it prevents players from exhausting content in a week while ensuring every play session is productive.

### Stamina Rules

| Parameter | Value |
|---|---|
| Max stamina | 120 |
| Regen rate | 1 per 5 minutes (12/hour, 288/day) |
| Full recharge | 10 hours (0 → 120) |
| Level-up refill | Full stamina restored on player level-up |
| Gem refill | 50 gems for full refill (max 3 per day) |

### Stamina Costs

| Activity | Cost | Notes |
|---|---|---|
| Story mission (first clear) | 0 | Free — encourages campaign progression |
| Story mission (replay) | 8 | Standard farm cost |
| Grind mission | 6 | Slightly cheaper, encourages grinding |
| Boss challenge | 15 | High cost, high reward |
| Event mission | 10 | Time-limited content |
| Arena (PvP, future) | 5 | Low barrier to PvP engagement |

### Daily Stamina Budget
A player who logs in twice (morning + evening) gets ~240 natural stamina + any refills.

| Activity | Stamina | Count | Total |
|---|---|---|---|
| Story replays | 8 | 6 | 48 |
| Grind missions | 6 | 10 | 60 |
| Boss challenge | 15 | 2 | 30 |
| Remaining for events/PvP | — | — | ~102 |

This yields roughly 18 missions per day as a comfortable baseline, with room to push harder using gem refills.

---

## 3. Gold Economy — Unified Model

### Gold Income Sources

#### Mission Rewards (Primary)
Using existing mission reward data, with star rating and Warehouse bonuses:

| Mission Tier | Base Gold | 3-Star Gold | With Warehouse L5 (+25%) |
|---|---|---|---|
| Early (1–4) | 30–100 | 60–200 | 75–250 |
| Mid (5–9) | 140–320 | 280–640 | 350–800 |
| Late (10–14) | 360–700 | 720–1,400 | 900–1,750 |
| Grind (level-scaled) | 20 + lvl×8 | 40 + lvl×16 | 50 + lvl×20 |
| Boss challenge | 500 | 1,000 | 1,250 |

#### Daily Gold Income Model (Level 15 Player, Mid-Game)

| Source | Per Instance | Daily Count | Daily Gold |
|---|---|---|---|
| Grind missions | ~140g (3-star avg) | 10 | 1,400 |
| Story replays | ~600g (3-star avg) | 4 | 2,400 |
| Boss challenge | ~1,000g (3-star) | 1 | 1,000 |
| Daily quests | 300g total | 1 set | 300 |
| Selling excess copies | ~5g avg | 15 drops | 75 |
| Selling items | ~15g avg | 3 | 45 |
| **Daily Total** | | | **~5,200g** |

#### Daily Gold Income Model (Level 20 Player, Endgame)

| Source | Per Instance | Daily Count | Daily Gold |
|---|---|---|---|
| Grind missions | ~200g (3-star avg) | 8 | 1,600 |
| Story replays (late) | ~1,200g (3-star avg) | 4 | 4,800 |
| Boss challenges | ~1,250g | 2 | 2,500 |
| Daily quests | 500g total | 1 set | 500 |
| Weekly quest (÷7) | ~200g/day | — | 200 |
| Selling excess copies | ~8g avg | 20 drops | 160 |
| Selling items | ~20g avg | 4 | 80 |
| **Daily Total** | | | **~9,800g** |

### Gold Sinks — By Game Phase

#### Early Game (Level 1–7, Month 1)

| Sink | Avg Cost | Daily Frequency | Daily Spend |
|---|---|---|---|
| Gacha rolling (10-pulls) | 45g | 3 | 135 |
| Building upgrades (spread) | ~100g | 1 | 100 |
| Evolution | 50–150g | 0.5 | 75 |
| **Daily Total** | | | **~310g** |

**Balance**: Large gold surplus early. Intentional — new players should feel flush, encouraging experimentation. Surplus goes to buildings.

#### Mid Game (Level 8–15, Months 2–4)

| Sink | Avg Cost | Daily Frequency | Daily Spend |
|---|---|---|---|
| Gacha rolling (10-pulls) | 42g | 5 | 210 |
| Enhancement (+1 to +6) | ~80g avg | 8 | 640 |
| Forge operations | ~30g avg | 5 | 150 |
| Gem combining | 15g | 3 | 45 |
| Building upgrades (spread) | ~300g | 0.5 | 150 |
| Evolution | 100–250g | 0.3 | 60 |
| **Daily Total** | | | **~1,255g** |

**Balance**: Still surplus, but enhancement starts absorbing gold. Buildings become expensive enough to compete with enhancement for gold.

#### Late Game (Level 16–20, Months 4–8)

| Sink | Avg Cost | Daily Frequency | Daily Spend |
|---|---|---|---|
| Gacha rolling (10-pulls) | 40g | 8 | 320 |
| Enhancement (+7 to +10) | ~450g avg | 6 | 2,700 |
| Gem socketing/combining | ~20g avg | 4 | 80 |
| Forge operations | ~50g avg | 3 | 150 |
| Mythic crafting (amortized) | 250g | 0.03 | 8 |
| Set/Ability crafting | 75g avg | 0.5 | 38 |
| **Daily Total** | | | **~3,300g** |

#### Endgame (Level 20, Months 8+)

| Sink | Avg Cost | Daily Frequency | Daily Spend |
|---|---|---|---|
| Enhancement (+8 to +10) | ~600g avg | 10 | 6,000 |
| Gacha (for ascension copies) | 40g | 10 | 400 |
| Gem combining (Epic tier) | 15g | 5 | 75 |
| Forge operations | ~50g avg | 3 | 150 |
| Mythic enhancement | ~800g avg | 2 | 1,600 |
| **Daily Total** | | | **~8,200g** |

**Balance**: Endgame income (~9,800g) slightly exceeds spending (~8,200g). The surplus is intentional — it lets players feel like they're always making progress, just slowly. Enhancement RNG absorbs the rest.

---

## 4. Gacha Economy

### Pull Costs & Rates (existing, unchanged)
- Single pull: 5g
- 10-pull: 45g base → 42g at SC L2 → 40g at SC L3 (per hub.js discount tiers)
- Tier weights: see gacha.js tier table (unchanged)
- Pity: Cost 3+ guaranteed every 20 rolls (SC L4), Cost 4+ every 30 rolls (SC L5)

### Duplicate Handling — The Star-Up Pipeline
Every pulled unit either fills a new collection slot or feeds into an existing unit's star progression.

| Star Level | Copies Needed | Cumulative Copies | Stat Multiplier |
|---|---|---|---|
| 1★ | 1 (initial pull) | 1 | 1.0× |
| 2★ | 10 | 11 | 1.8× |
| 3★ | 10 | 21 | 3.24× |
| 4★ | 10 | 31 | 5.83× |
| 5★ | 10 | 41 | 10.50× |

### Ascension Pipeline (from UNITS-DESIGN Section 5)
After 5★, duplicate copies feed ascension:

| Tier | Additional Copies | Cumulative Total | Bonus |
|---|---|---|---|
| Awakened | 50 | 91 | +10% all stats, unlock passive upgrade |
| Exalted | 100 | 191 | +20% all stats, second passive upgrade, visual change |
| Transcendent | 200 + 5 essences | 391 | +35% all stats, ultimate passive, unique border |

### Time-to-Star Modeling
How long does it take to max a specific unit?

**Assumptions**: Level 15 player, 8 ten-pulls/day = 80 rolls/day. Cost distribution per TIER_WEIGHTS at level 15:

| Unit Cost | % of Pulls | Avg Pulls/Copy | Days to 5★ (41 copies) | Days to Transcendent (391 copies) |
|---|---|---|---|---|
| Cost 1 | 10% | 10 | ~51 days | ~489 days |
| Cost 2 | 20% | 5 | ~26 days | ~245 days |
| Cost 3 | 30% | ~8 (shared pool) | ~41 days | ~391 days |
| Cost 4 | 25% | ~15 | ~77 days | ~733 days |
| Cost 5 | 15% | ~30 | ~154 days | ~1,466 days |

**Implication**: Transcendent cost-5 units are multi-year investments. This is intentional — they're the "whale chase" for long-term players. Most players will Transcend cost 1–3 units first.

### Focused Pulling (Future Feature)
To make high-cost unit progression less painful, add rate-up banners:

| Banner Type | Duration | Effect | Cost |
|---|---|---|---|
| **Element Focus** | 3 days | +50% chance for units of chosen element | Normal pull cost |
| **Unit Spotlight** | 1 day | Featured unit appears at 3× normal rate | 60g per 10-pull (+50% premium) |
| **Guaranteed** | Always | Spend 300g for 1 guaranteed copy of any owned unit | 300g flat |

---

## 5. Player Level & Account Progression

### XP System (existing, expanded)
Player level currently caps at 20 with XP from missions. For publishable depth:

**Extended Level Cap: 40**

| Level Range | XP per Level | Cumulative XP | Key Unlock |
|---|---|---|---|
| 1–5 | 100–800 | 1,650 | Basic missions, team building |
| 6–10 | 1,200–3,800 | 12,650 | Mid missions, evolution, forge |
| 11–15 | 4,800–10,800 | 47,450 | Late missions, set/ability items |
| 16–20 | 12,800–23,500 | 118,550 | Endgame missions, mythics |
| 21–25 | 28,000–45,000 | 300,550 | Challenge modes, prestige |
| 26–30 | 50,000–80,000 | 625,550 | Endless mode, leaderboards |
| 31–35 | 90,000–130,000 | 1,175,550 | Mastery bonuses |
| 36–40 | 140,000–200,000 | 2,025,550 | Title unlocks, max prestige |

### Level-Up Rewards
Each level-up grants stamina refill + scaling rewards:

| Level Range | Gold | Gems | Bonus |
|---|---|---|---|
| 1–10 | 50–200 | 10–30 | — |
| 11–20 | 200–500 | 30–50 | 1 random essence at 15, 20 |
| 21–30 | 500–1,000 | 50–100 | 1 element essence choice at 25, 30 |
| 31–40 | 1,000–2,500 | 100–200 | Mythic material at 35, 40 |

### Account Power Milestones

| Level | Unlock |
|---|---|
| 1 | Hub, basic missions, single rolls |
| 3 | 10-pulls, first building upgrade |
| 5 | Grind missions, item bench |
| 8 | Forge (level 1), essence drops begin |
| 10 | Evolution Lab, War Room, boss challenges |
| 12 | Forge level 3 (transmute, gems) |
| 14 | Forge level 4 (set crafting) |
| 16 | Forge level 5 (ability + mythic crafting) |
| 18 | Daily quest tier 2, weekly quests |
| 20 | Full story completion, challenge mode |
| 25 | Endless mode unlock |
| 30 | Arena (PvP) unlock |
| 35 | Prestige system unlock |
| 40 | Max prestige, all titles available |

---

## 6. Building Progression — Expanded

### Existing Buildings (costs unchanged)
All 7 buildings retain their current upgrade costs and bonuses as defined in hub.js.

### New Buildings

#### Gem Workshop (NEW)
Dedicated to gem-related operations. Separates gem work from the Forge to reduce UI clutter.

| Level | Cost | Unlock |
|---|---|---|
| 1 | 500g | Gem inventory, gem socketing |
| 2 | 1,200g | Gem combining (3→1), gem removal |
| 3 | 2,500g | Gem transmute (change type, keep rarity, 30g) |
| 4 | 5,000g | Auto-socket (suggest optimal gems for team) |
| 5 | 10,000g | Prismatic Forge: combine 3 different Epic gems → 1 Prismatic gem |

**Prereq**: Player level 12, Forge level 3

#### Mana Shrine (NEW)
Passive bonus building that enhances mana-related combat mechanics.

| Level | Cost | Bonus |
|---|---|---|
| 1 | 800g | All units start combat with +5 base mana |
| 2 | 2,000g | Mana generation from auto-attacks +10% (10 → 11 per hit) |
| 3 | 4,000g | Ability damage +5% (global, stacks with items) |
| 4 | 8,000g | First ability cast each combat costs 10% less mana |
| 5 | 15,000g | Units with full mana bar gain +10% ATK until they cast |

**Prereq**: Player level 15, completed mission 10

#### Bond Hall (NEW)
Enhances the unit bond system from UNITS-DESIGN.

| Level | Cost | Bonus |
|---|---|---|
| 1 | 600g | View active bonds and bonuses |
| 2 | 1,500g | Bond bonuses increased by 25% |
| 3 | 3,500g | Unlock bond quests (earn Bond Tokens) |
| 4 | 7,000g | Bond bonuses increased by 50% total |
| 5 | 12,000g | Unlock trio bonds (3-unit bonds active) |

**Prereq**: Player level 10, own at least 2 units from a bond pair

### Building Upgrade Order Recommendation (for new players)
This is a soft guide, not enforced — but the intended upgrade priority is:

```
Barracks L2 (team slot) → Summoning Circle L2 (cheaper pulls) →
Training Ground L2 (+20% XP) → Warehouse L2 (+10% gold, +12 bench) →
War Room L1 (enemy intel) → Forge L1 (reroll, enhance) →
Evolution Lab L1 (evolve units) → [continue scaling all buildings]
```

### Total Building Investment

| Building | Max Level | Total Cost |
|---|---|---|
| Barracks | 5 | 3,850g |
| Summoning Circle | 5 | 2,980g |
| Training Ground | 5 | 2,480g |
| Warehouse | 5 | 2,070g |
| War Room | 3 | 1,700g |
| Evolution Lab | 3 | 3,100g |
| Forge | 5 | 7,700g |
| Gem Workshop (NEW) | 5 | 19,200g |
| Mana Shrine (NEW) | 5 | 29,800g |
| Bond Hall (NEW) | 5 | 24,600g |
| **Grand Total** | | **97,580g** |

At ~5,000g/day mid-game income, maxing all buildings takes ~20 days if you spend ALL gold on buildings (unrealistic). Realistically 2–3 months to max everything, which is the intended pace.

---

## 7. Daily & Weekly Loop

### Daily Activities

#### Daily Quests (4 per day, reset at midnight local)
Players receive 4 random quests from a pool. Completing all 4 grants a bonus reward.

**Quest Pool:**

| Quest | Requirement | Reward |
|---|---|---|
| Win 3 missions | Complete any 3 missions | 80g |
| Deploy [element] units | Use 3+ of one element in a mission | 60g |
| Enhance an item | Perform any enhancement | 50g |
| Roll 20 units | Perform 20 gacha pulls | 70g |
| 3-star a mission | Get 3 stars on any mission | 100g |
| Evolve a unit | Evolve any unit | 80g |
| Equip 3 items | Equip items on 3 different units | 40g |
| Sell 5 items | Sell any 5 items | 40g |
| Defeat a boss | Clear any boss challenge | 120g |
| Use a bond pair | Deploy 2+ bonded units in a mission | 60g |

**Daily Completion Bonus**: Finish all 4 quests → +100g, +20 gems, +1 random gem (Rare+)

**Total daily quest income**: ~300g base + 100g bonus = ~400g (mid-game), ~500g (late-game with harder quests)

#### Daily Login Reward
7-day rotating calendar. Resets weekly.

| Day | Reward |
|---|---|
| 1 | 100g |
| 2 | 5 gems |
| 3 | 1 random component (Rare+) |
| 4 | 200g |
| 5 | 10 gems |
| 6 | 1 random essence |
| 7 | 20 gems + 1 random gem (Epic) |

**Monthly Login Milestone** (cumulative days logged in per month):
- 7 days: 500g
- 14 days: 1 random ability item component
- 21 days: 50 gems
- 28 days: 1 guaranteed element essence of choice + 100 gems

### Weekly Activities

#### Weekly Quests (3 per week, reset Monday)

| Quest | Requirement | Reward |
|---|---|---|
| Complete 30 missions | Any 30 missions | 500g + 30 gems |
| Enhance items 10 times | Perform 10 enhancements | 300g + 2 random gems |
| Craft 2 combined items | Create 2 new combined items | 400g + 1 random essence |
| Deploy 5 different bond pairs | Use 5 unique bond pairs in missions | 200g + 5 Bond Tokens |
| 3-star 5 different missions | Get 3 stars on 5 unique missions | 600g + 50 gems |

#### Weekly Boss Rotation
Each week, a different element's boss is "featured" with boosted drop rates:

| Week | Featured Boss | Bonus |
|---|---|---|
| 1 | Fire Dragon | +5% Dragon Scale drop, +50% fire essence |
| 2 | Tidal Leviathan | +5% Dragon Scale drop, +50% water essence |
| 3 | Earth Golem | +5% Dragon Scale drop, +50% earth essence |
| 4 | Storm Phoenix | +5% Dragon Scale drop, +50% wind essence |

#### Weekly Shop
A rotating shop that offers items purchasable with gold or gems. Refreshes Monday.

| Slot | Contents | Price |
|---|---|---|
| 1 | Random Rare component | 200g |
| 2 | Random element essence | 500g |
| 3 | 5 Ascension Shards | 1,000g |
| 4 | Random gem (Rare) | 300g |
| 5 | Featured unit copy (rotates) | 50 gems |
| 6 | Mythic material fragment (3 fragments = 1 material) | 100 gems |

---

## 8. Power Curve Model

### Unit Power Formula
A unit's total combat power comes from these multiplicative layers:

```
TotalPower = BaseStat
  × StarMultiplier        (1.0 to 10.5×)
  × AscensionMultiplier   (1.0 to 1.35×)
  × (1 + ItemContribution)(1.0 to ~2.0×)
  × (1 + SynergyBonus)    (1.0 to ~1.4×)
  × (1 + BuildingBonus)   (1.0 to ~1.3×)
```

### Power By Player Month (cost-3 carry unit)

| Month | Stars | Ascension | Items | Synergy | Buildings | Relative Power |
|---|---|---|---|---|---|---|
| 0 (start) | 1★ | — | Components | None | L1 | 1.0× |
| 1 | 2★ | — | Combined +3 | 2-piece | L2 avg | 3.2× |
| 2 | 3★ | — | Combined +6, 1 gem | 4-piece | L3 avg | 8.5× |
| 3 | 4★ | — | Set/Ability +5, 2 gems | 4-piece | L4 avg | 18× |
| 4 | 5★ | — | Ability +7, Epic gems | 6-piece | L4 avg | 32× |
| 6 | 5★ | Awakened | Ability +9, full gems | 6-piece | L5 avg | 52× |
| 9 | 5★ | Exalted | Mythic +5, full gems | 6-piece | All max | 85× |
| 12+ | 5★ | Transcendent | Mythic +10, Epic gems | 6-piece | All max | 140× |

### Content Difficulty Scaling
Mission difficulty must track this power curve so content stays relevant:

| Mission Range | Expected Player Power | Design Target |
|---|---|---|
| 1–4 | 1–3× | Tutorial, learn mechanics |
| 5–7 | 3–8× | Learn synergies, first forge |
| 8–10 | 8–18× | Evolution, set items |
| 11–13 | 18–40× | Team optimization, ability items |
| 14 | 40–60× | Final story, requires real strategy |
| Boss challenges | 30–80× | Skill-check, not just stats |
| Endless mode (floor 1–50) | 50–140× | Scaling difficulty, leaderboard |
| Endless mode (50+) | 140×+ | Whale territory, prestige |

### Anti-Power-Creep Rules
To prevent inflation from spiraling:
- **Stat caps**: No unit stat can exceed 5× its base value from any single source (prevents one-shotting)
- **Diminishing returns on stacking**: Enhancement beyond +7 gives smaller marginal gains per gold spent (by design)
- **Content scales with power**: Endless mode difficulty scales infinitely, absorbing any power growth
- **No stat resets**: Power is never taken away — players only ever move forward

---

## 9. Achievements & Milestones

### Achievement Categories

#### Combat Achievements

| Achievement | Requirement | Reward |
|---|---|---|
| First Blood | Win your first mission | 50g |
| Unscathed | 3-star any mission | 100g + 5 gems |
| Elemental Mastery | Win with a 6-piece element synergy | 200g + 10 gems |
| Boss Slayer | Defeat your first boss | 300g + 20 gems |
| Deathless | Complete mission 14 with no unit deaths | 500g + 50 gems |
| Overkill | Deal 10,000 damage in a single hit | 200g |
| Speed Demon | Win a mission in under 30 seconds | 150g |

#### Collection Achievements

| Achievement | Requirement | Reward |
|---|---|---|
| Collector I | Own 10 unique units | 200g |
| Collector II | Own 25 unique units | 500g + 20 gems |
| Collector III | Own all base units (38) | 1,000g + 100 gems |
| Evolution Pioneer | Evolve your first unit | 200g + 10 gems |
| Evolution Master | Evolve 10 different units | 1,000g + 50 gems |
| Ascended | Reach Awakened with any unit | 500g + 30 gems |
| Transcendent | Reach Transcendent with any unit | 2,000g + 200 gems |
| Bond Collector | Activate 5 different bonds | 300g + 15 gems |

#### Economy Achievements

| Achievement | Requirement | Reward |
|---|---|---|
| Big Spender | Spend 10,000g total | 500g back |
| Master Forger | Perform 100 forge operations | 300g |
| Enhancement Addict | Enhance items 50 times | 200g + 10 gems |
| +10 Club | Reach +10 on any item | 1,000g + 100 gems |
| Mythic Wielder | Craft any mythic item | 500g + 50 gems |
| Full House | Fill all 3 item slots on 5 units | 200g |
| Gem Master | Socket 20 gems into items | 300g + 3 random gems |

#### Progression Achievements

| Achievement | Requirement | Reward |
|---|---|---|
| Level 10 | Reach player level 10 | 300g + 20 gems |
| Level 20 | Reach player level 20 | 1,000g + 50 gems |
| Level 30 | Reach player level 30 | 2,000g + 100 gems |
| Level 40 | Reach player level 40 | 5,000g + 500 gems |
| Builder | Max any building | 500g |
| Architect | Max all buildings | 2,000g + 200 gems |
| 7-Day Streak | Log in 7 consecutive days | 200g + 20 gems |
| 30-Day Streak | Log in 30 consecutive days | 1,000g + 100 gems |

### Milestone Rewards (Story)
Expanding existing milestone system:

| Trigger | Reward |
|---|---|
| 3-star mission 5 | 1 free 10-pull |
| 3-star mission 7 | Zhonya's Hourglass (unchanged) |
| 3-star mission 10 | Guardian Angel (moved from 13) |
| 3-star mission 13 | 1 random element essence + 500g |
| 3-star mission 14 | Choice of any Cost-4 unit copy |

---

## 10. Premium Currency (Gems) Economy

### Gem Income (F2P)

| Source | Gems/Week |
|---|---|
| Daily quest completion bonus (20/day × 7) | 140 |
| Weekly quest rewards | ~80 |
| Login calendar (5 + 10 + 20 per week) | 35 |
| Monthly login milestone (÷4) | ~38 |
| Achievements (amortized early months) | ~50 |
| **Weekly Total** | **~343** |

### Gem Sinks

| Item | Gem Cost | Frequency |
|---|---|---|
| Stamina refill (50 gems, max 3/day) | 50–150/day | Power players only |
| Premium 10-pull (rate-up banner) | 60 | When desirable |
| Weekly shop featured unit | 50 | Weekly |
| Mythic material fragment | 100 | Weekly |
| Cosmetic unit skins (future) | 200–500 | One-time |

### Gem-to-Progress Conversion
A F2P player earning ~343 gems/week can afford:
- ~6 stamina refills OR
- ~5 premium 10-pulls OR
- ~3 weekly shop units + some refills

This gives meaningful choice without making gems feel mandatory. No content is gems-only — everything can be earned through gold and time.

**Important**: F2P players cannot sustain ALL gem sinks simultaneously. At ~343 gems/week, a F2P player must choose between stamina refills (350/week if doing 1/day) OR premium pulls (60/week) OR shop purchases (150/week). Max-spend players hitting all sinks would need ~1,100+ gems/week, which requires IAP. This gap is intentional — it's the monetization lever without paywalling content.

---

## 11. Event System Framework

### Event Cadence

| Event Type | Frequency | Duration | Description |
|---|---|---|---|
| **Element Festival** | Monthly | 7 days | Featured element gets +100% essence drops, unique missions, themed rewards |
| **Boss Rush** | Bi-weekly | 3 days | All bosses available simultaneously, leaderboard for fastest clears |
| **Forge Fair** | Monthly | 5 days | Enhancement costs -30%, double gem drops from missions |
| **Bond Trials** | Monthly | 4 days | Special missions requiring specific bond pairs, earn bonus Bond Tokens |
| **Gacha Festival** | Quarterly | 3 days | All pull rates boosted, guaranteed cost-4+ every 15 pulls |

### Event Reward Structure
Each event has a points-based reward track:

| Points | Reward (example: Element Festival) |
|---|---|
| 500 | 200g |
| 1,500 | 10 gems + 1 element essence |
| 3,000 | Random Rare+ component |
| 5,000 | Featured unit copy (cost 3, event element) |
| 8,000 | 50 gems + 1 Rare gem |
| 12,000 | Choice of Epic component |
| 18,000 | Exclusive cosmetic (event-only) |
| 25,000 | Featured unit copy (cost 4, event element) + 100 gems |

Points are earned by completing event missions (10 stamina each, ~100 points per mission). A dedicated player can hit 25,000 points over 7 days.

---

## 12. Prestige System (Level 35+)

### Overview
Once a player reaches level 35 and has completed all story content, they unlock the Prestige system — a soft reset mechanic that provides long-term goals.

### How It Works
- **Prestige** resets player level to 20, keeps all units/items/buildings
- Grants a permanent **Prestige Level** (1, 2, 3... up to 10)
- Each Prestige Level grants a permanent global bonus

### Prestige Bonuses (cumulative)

| Prestige | Bonus | Title |
|---|---|---|
| 1 | +5% all gold earned | Veteran |
| 2 | +5% all XP earned | Champion |
| 3 | +1 daily quest slot (5 total) | Warlord |
| 4 | +10% enhancement success rate (additive) | Master Forger |
| 5 | +1 item bench slot | Artificer |
| 6 | +5% all stats for all units | Commander |
| 7 | +1 weekly shop slot | Strategist |
| 8 | +10% gem earning rate | Tycoon |
| 9 | +2 team slots | Grand Marshal |
| 10 | All buildings cost -20% to upgrade | Sovereign |

### Prestige Cost
Each prestige requires:
- Player level 35+ (the primary gate — re-leveling from 20→35 takes ~6–8 weeks per prestige cycle)
- 50,000g (scales: +25,000g per prestige level)
- 500 gems
- All story missions 3-starred

### Prestige Reset Details
When you prestige:
- **Reset**: Player level drops to 20. Mission star ratings reset (must re-3-star for milestones). Daily/weekly quest progress resets.
- **Kept**: All units, items, buildings, gems, gold, essences, ascension progress, bond tokens, recipe book, achievements, collection bonuses, cosmetics.
- **Why re-level matters**: Levels 21–35 require significant XP (28,000–130,000 per level). Even with Training Ground L5 (+50% XP), re-leveling is the real time gate — not the gold cost.

### Time to Prestige
- First prestige: ~4–5 months (initial climb from 1→35)
- Each subsequent prestige: ~6–8 weeks (re-level 20→35 with maxed buildings and endgame XP income)
- Prestige 10: ~18–24 months total

---

## 13. Progression Pacing Summary

### Month-by-Month Roadmap (Active F2P Player)

| Month | Player Level | Key Milestones | Team Power |
|---|---|---|---|
| 1 | 1→10 | Clear missions 1-7, first evolutions, first combined items | 1–5× |
| 2 | 10→15 | Forge unlocked, set items, boss challenges begin | 5–15× |
| 3 | 15→18 | Ability items, gem socketing, all buildings L3+ | 15–30× |
| 4 | 18→20 | Story complete, first mythic material, challenge mode | 30–45× |
| 5–6 | 20→25 | Endless mode, first mythic item, first Awakened unit | 45–65× |
| 7–9 | 25→30 | Arena unlock, multiple mythics, Exalted units | 65–90× |
| 10–12 | 30→35 | Prestige unlock, first Transcendent, +10 items | 90–140× |
| 12+ | 35→40 | Prestige climbing, leaderboards, completionist goals | 140×+ |

### Session Length Targets

| Session Type | Duration | Activities | Reward Feel |
|---|---|---|---|
| Quick check-in | 5 min | Collect dailies, do 2 quests | "Got my rewards" |
| Standard session | 15–20 min | Clear dailies, some grinding, 1 enhancement | "Made progress" |
| Extended session | 30–45 min | Full daily clear, boss, event missions, team optimization | "Great session" |
| Weekend deep dive | 60+ min | Theory-craft teams, optimize items, push content | "Major breakthrough" |

---

## 14. Cross-Document Integration

### References to Other Design Docs

| System | Document | Key Interaction |
|---|---|---|
| Combat rewards | COMBAT-DESIGN.md Section 10 | Boss drop rates for mythic materials, gold/XP from combat |
| Unit copies for star-up | UNITS-DESIGN.md Section 4 | 10 copies per star, 1.8× scaling, ascension thresholds |
| Unit bonds | UNITS-DESIGN.md Section 7 | Bond Tokens from deploying bonded pairs |
| Item enhancement costs | ITEMS-DESIGN.md Section 7 | 20g–750g per attempt, gold sink modeling |
| Gem system | ITEMS-DESIGN.md Section 8 | Gem Workshop building, gem drops per mission |
| Forge operations | ITEMS-DESIGN.md Section 11 | Forge level costs, operation fees |
| Mythic materials | ITEMS-DESIGN.md Section 6 | Dragon Scale, Void Crystal, World Shard drop rates |

### Economy Numbers This Doc Establishes (source of truth)

| Parameter | Value | Other Docs Should Reference |
|---|---|---|
| Daily gold income (mid) | ~5,200g | ITEMS-DESIGN enhancement balance |
| Daily gold income (endgame) | ~9,800g | ITEMS-DESIGN mythic pacing |
| Stamina per mission | 6–15 | COMBAT-DESIGN boss fight frequency |
| Gems per week (F2P) | ~343 | Gacha pull pacing |
| Time to 5★ (cost 3) | ~41 days | UNITS-DESIGN balance |
| Time to Transcendent (cost 3) | ~391 days | UNITS-DESIGN ascension design |
| Building total investment | ~97,580g | Hub system pacing |
| First mythic item | ~Month 5 | ITEMS-DESIGN mythic availability |
| Level cap | 40 | All docs referencing player level |

---

## 15. Migration from Current System

### What Stays
- Gold as primary currency (unchanged)
- XP from missions (levels 1–20 unchanged)
- All building costs and bonuses (unchanged)
- Gacha pull rates and pity (unchanged)
- Mission gold/XP rewards (unchanged)
- 10-copy star-up system (unchanged)
- Starting gold 500g (unchanged)

### What's Added
- **Stamina system** (new resource gating mission attempts)
- **Gem currency** (premium, earned through achievements/dailies)
- **Daily quests** (4 per day with bonus)
- **Weekly quests** (3 per week)
- **Daily login calendar** (7-day rotating)
- **Weekly boss rotation** (featured element bosses)
- **Weekly shop** (rotating purchases)
- **Achievement system** (one-time rewards for milestones)
- **Event framework** (monthly/biweekly events with reward tracks)
- **3 new buildings** (Gem Workshop, Mana Shrine, Bond Hall)
- **Extended level cap** (20 → 40)
- **Prestige system** (soft reset at level 35+)
- **Ascension Shards** (currency from excess unit copies)
- **Bond Tokens** (currency from deploying bonded units)
- **Focused pulling** (rate-up banners)

### Save Migration
- New save version required
- Existing gold, XP, levels preserved
- Stamina initializes at max (120)
- Gems set to 0 (earned going forward)
- Daily/weekly quest progress starts fresh
- Achievement progress retroactively checked (e.g., if player already owns 25 units, grant Collector II immediately)
- Buildings preserved; new buildings locked until prereqs met
- Level 21–40 XP table added; existing level 20 players start earning toward 21

### Stamina Transition
Since current game has no stamina, transitioning requires care:
- **First 7 days after migration**: Unlimited stamina (grace period)
- **Days 8–14**: Double stamina regen (1 per 2.5 min instead of 5)
- **Day 15+**: Normal stamina regen
- Players receive 500 gems as migration compensation (enough for 10 stamina refills)

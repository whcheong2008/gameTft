# T4 Unit Expansion — 6 New Units

> Expands T4 from 6 to 12 units (66 total roster, 132 with evolved forms). Each new unit fills a missing archetype at T4 and gives every element exactly 2 T4 units. Designed to integrate with UNITS-DESIGN.md and PROGRESSION-REWORK.md.

---

## Design Rationale

**The problem:** With only 6 T4 units (one per element), the late-game gacha heavily concentrates copies on a tiny pool. At 12 T4 units, copies per specific T4 drop to ~19 by campaign end — 2★ with tiered 8/star cost, requiring moderate post-game grind to evolve. See PROGRESSION-REWORK.md for the math.

**Archetype coverage:** Four archetypes had zero T4 representation: Guardian, Ranger, Sorcerer, Sage. The 6 new units fill all four gaps plus add a second Predator and Duelist at T4, ensuring every archetype has at least some presence in the late-game pool.

**Element balance:** One new T4 per element, giving each element exactly 2 T4 units.

---

## Coverage After Expansion

### T4 Grid (12 units)

| Element | T4 Unit 1 (Existing) | Archetype | T4 Unit 2 (New) | Archetype |
|---------|----------------------|-----------|------------------|-----------|
| Fire | Fire Dragon | Warden | **Ashen Watcher** | **Sage** |
| Water | Kraken | Warden | **Abyssal Guardian** | **Guardian** |
| Earth | Ancient Treant | Duelist | **Grove Warden** | **Ranger** |
| Wind | Storm Sovereign | Predator | **Tempest Weaver** | **Sorcerer** |
| Lightning | Thunderbird | Vanguard | **Voltfang Stalker** | **Predator** |
| Force | Siege Engineer | Mystic | **Iron Duelist** | **Duelist** |

### Archetype T4 Count (After)

| Archetype | T4 Before | T4 After | Notes |
|-----------|-----------|----------|-------|
| Guardian | 0 | **1** | Abyssal Guardian (Water) |
| Warden | 2 | 2 | Fire Dragon, Kraken |
| Vanguard | 1 | 1 | Thunderbird |
| Duelist | 1 | **2** | Ancient Treant + Iron Duelist |
| Predator | 1 | **2** | Storm Sovereign + Voltfang Stalker |
| Ranger | 0 | **1** | Grove Warden (Earth) |
| Sorcerer | 0 | **1** | Tempest Weaver (Wind) |
| Mystic | 1 | 1 | Siege Engineer |
| Sage | 0 | **1** | Ashen Watcher (Fire) |

---

## New Unit Specifications

---

### 1. Ashen Watcher — Fire, Tier 4, Healer, Sage

*A phoenix-ash priest who channels the residual heat of fallen Echoes into restorative flames. Where healers typically draw from cool, calm energy, the Ashen Watcher works with embers — volatile, warm, alive.*

**Stats**: HP 780, ATK 72, AtkSpd 0.8, Range 3, MoveSpd 1.6, MaxMana 75

**Innate Passive — Ember Shroud**: Heals on allied units linger as a warm afterglow — healed allies gain a Shield equal to 15% of the heal amount for 4s. This includes heals from all sources (abilities, lifesteal, regen), not just the Watcher's own heals. Synergizes heavily with Water sustain teams and other healers.

**Ability — Pyre of Renewal** (75 mana): Target the lowest-HP ally. A column of flame erupts beneath them, healing for 300% ATK over 3 seconds. During the heal, the target is immune to CC. If the target is Burning (from Fire synergy), the Burn is consumed and the heal amount increases by 50%.

**Design Intent**: Fire's first real healer at high tier. Fire synergy applies Burn to everything, including allies in some splash scenarios. The Watcher turns Burn into a resource — consume it for bigger heals. Sage archetype feeds into the sustain identity (Sage 2/4/6/8 buffs healing and shields). Also gives Fire teams the option to run Fire (7) + Sage (2) for a sustain-aggro hybrid.

**Evolved Form — Phoenix Priest**: Ember Shroud shield increases to 25% of heal amount and applies a 2s Burn immunity to the shielded ally. Pyre of Renewal heals 2 targets (lowest and second-lowest HP) simultaneously and leaves a healing zone on the ground (50% ATK/s, 3s, 2-cell radius).

---

### 2. Abyssal Guardian — Water, Tier 4, Tank, Guardian

*A deep-sea sentinel encased in living coral armor. Moves slowly, hits rarely, but absorbs punishment that would shatter anything else. Where the Leviathan (T5) is a legendary wall, the Abyssal Guardian is its more accessible predecessor — less raw power, more tactical utility.*

**Stats**: HP 1350, ATK 55, AtkSpd 0.6, Range 1, MoveSpd 1.2, MaxMana 90

**Innate Passive — Pressure Depths**: For every 10% max HP lost, the Abyssal Guardian gains +3% DR (stacks up to +30% DR at 1 HP). Additionally, attacks against the Guardian are slowed by 10% (attacker's speed debuffed, not the Guardian's). The deeper the health drops, the harder it is to finish the kill.

**Ability — Tidal Fortress** (90 mana): Slam the ground, creating a 2-cell radius zone of churning water for 5s. Enemies in the zone are Slowed 25% and take 80% ATK water damage per second. Allies in the zone gain +10% DR. The Guardian is Rooted during the channel but gains +20% DR.

**Design Intent**: The tank that Water teams were missing at T4. Leviathan is T5 and extremely rare during the campaign. Abyssal Guardian gives Water comps a proper frontline from R5 onward. Guardian archetype stacking (+HP, +DR) makes it a wall. Water synergy's attack speed slow stacks with the innate slow, creating a glacial-pace frontline that enemies can barely damage.

**Evolved Form — Hadal Colossus**: Pressure Depths caps at +40% DR and also grants +2% lifesteal per 10% HP lost. Tidal Fortress zone expands to 3-cell radius, Slow increases to 35%, and enemies leaving the zone are Rooted for 1s.

---

### 3. Grove Warden — Earth, Tier 4, Archer, Ranger

*A sentinel who never moves from their chosen patch of ground, firing living-wood arrows that sprout roots on impact. Part sniper, part terrain controller. The only Archer in the game who actively wants to stay still.*

**Stats**: HP 680, ATK 88, AtkSpd 0.75, Range 5, MoveSpd 1.0, MaxMana 70

**Innate Passive — Deep Roots**: While the Grove Warden has not moved for 3+ seconds, it gains +15% ATK and +1 Range (total 6). Auto-attacks from rooted position have 20% chance to apply Root (1s) to the target. Moving resets the timer. This creates interesting positioning decisions — place perfectly or lose the bonus.

**Ability — Thornstorm** (70 mana): Fire a volley of 5 thorn projectiles at random enemies within range. Each projectile deals 120% ATK and applies a 2s Slow (15%). If any target is already Rooted or Slowed, they take 40% bonus damage. Synergizes with Earth's shield-and-control identity.

**Design Intent**: Ranger archetype was all T1 archers — no high-tier Ranger existed. Grove Warden brings Ranger into the late game as a positional sniper. Earth synergy's shields keep it alive; its long range and root chance create zone control. Pairs naturally with other Earth units (Stone Guard tanks the front, Grove Warden locks down from the back). The "stationary bonus" is unique in the roster and creates a distinct playstyle.

**Evolved Form — Worldroot Sentinel**: Deep Roots bonus activates after 2s (instead of 3), grants +25% ATK and +2 Range (total 7). Thornstorm fires 7 projectiles and each hit plants a Seedling on the cell — Seedlings last 4s and Root any enemy that steps on them for 1.5s.

---

### 4. Tempest Weaver — Wind, Tier 4, Mage, Sorcerer

*A storm-caller who doesn't just cast wind spells — they weave the battlefield's air currents into persistent hazards. Every ability leaves behind a vortex. Over the course of a fight, the battlefield becomes a minefield of spinning air.*

**Stats**: HP 650, ATK 92, AtkSpd 0.85, Range 3, MoveSpd 2.0, MaxMana 65

**Innate Passive — Lingering Gales**: Whenever the Tempest Weaver casts an ability, a Vortex remains on the target cell for 6s. Vortices deal 20% ATK/s to enemies standing in them and grant +15% dodge to allies standing in them. Max 3 vortices active at once (oldest fades when 4th is created). Vortices stack with Wind synergy's dodge bonuses.

**Ability — Cyclone Barrage** (65 mana): Launch a twisting projectile at the highest-ATK enemy. On impact, deals 220% ATK and knocks the target 1 cell backward. If the target is knocked into another enemy, both take 120% ATK and are Slowed 20% for 2s. Low mana cost = frequent casts = more vortices.

**Design Intent**: Sorcerer archetype's first T4 unit. Sorcerer stacking (ability damage amp, mana regen) synergizes perfectly with the low-mana, high-frequency casting pattern. Wind synergy's attack speed further reduces time between casts. The vortex mechanic creates emergent battlefield control — the player positions carefully to have allies fighting inside vortex zones while enemies get pushed into them. Wind teams lacked a dedicated mage carry; this fills the gap.

**Evolved Form — Stormweft Oracle**: Lingering Gales vortices last 8s, deal 30% ATK/s, and grant +25% dodge. Cyclone Barrage knocks target 2 cells back, and if the target hits a wall or board edge, they're Stunned for 1.5s. Max 4 vortices.

---

### 5. Voltfang Stalker — Lightning, Tier 4, Assassin, Predator

*A beast-type Echo that hunts in bursts of electrical fury — sprinting between targets, leaving crackling afterimages. Where Storm Sovereign (Wind/Predator) is a patient assassin who picks the perfect moment, Voltfang is a chainsaw — brutal, fast, indiscriminate.*

**Stats**: HP 700, ATK 95, AtkSpd 0.5, Range 1, MoveSpd 3.8, MaxMana 50

**Innate Passive — Overcharge Frenzy**: Every critical hit grants +8% ATK speed for 4s (stacks up to 5 times = +40%). At max stacks, auto-attacks chain to 1 adjacent enemy for 40% damage (like mini Lightning synergy chains). Lightning's crit bonus naturally fuels this passive, creating an accelerating damage curve.

**Ability — Lightning Pounce** (50 mana): Dash to the lowest-HP enemy within 4 cells, dealing 200% ATK. If this kills the target, immediately dash to the next lowest-HP enemy and deal 150% ATK. Can chain up to 3 kills total. Each dash leaves an Afterimage on the departure cell (lasts 2s, deals 50% ATK to enemies who step through it). Low mana cost for a Predator = frequent resets.

**Design Intent**: Lightning's assassin. Lightning synergy gives crit chance; the Voltfang converts crits into attack speed into chain damage. Predator stacking (chain kill bonuses, execute threshold) amplifies the snowball. The kill-chain dash echoes Predator's "momentum on kill" identity. Pairs with Thunderbird (Vanguard frontline) for a Lightning duo that controls the front while Voltfang shreds the back.

**Evolved Form — Plasma Ravager**: Overcharge Frenzy stacks to 7 (max +56% ATK speed) and chain damage increases to 60%. Lightning Pounce can chain up to 4 kills, each dash deals 200% ATK, and Afterimages explode after 2s for 100% ATK in a 1-cell radius.

---

### 6. Iron Duelist — Force, Tier 4, Warrior, Duelist

*A masterwork automaton built for single combat — a walking suit of enchanted plate that challenges the strongest enemy to a duel. Force element's "raw power, no tricks" identity taken to its logical extreme. No CC, no fancy effects. Just hits harder than anything else on the board.*

**Stats**: HP 950, ATK 105, AtkSpd 0.85, Range 1, MoveSpd 1.8, MaxMana 60

**Innate Passive — Challenge Protocol**: At combat start, the Iron Duelist marks the highest-ATK enemy as its Rival. While fighting the Rival, the Duelist gains +20% ATK and +10% DR. If the Rival dies, the next highest-ATK enemy becomes the new Rival. If no Rival is in attack range, the Duelist gains +15% move speed toward the Rival. Creates a persistent threat against enemy carries.

**Ability — Decisive Strike** (60 mana): The next auto-attack deals 280% ATK and ignores 30% of target's DR. If the target is the Rival, also apply a 2s Wound (target receives 30% less healing). Low cooldown, high single-target burst. Designed to cut through tanks to reach the carry behind.

**Design Intent**: Force's melee carry. Gladiator (T3) and Titan Lord (T5) both exist, but Force lacked a T4 bridge between them. Iron Duelist fills that gap with a simple, powerful kit — the Rival mechanic ensures it always threatens the enemy's strongest unit. Duelist archetype stacking (double-strike chance, lifesteal) turns it into a self-sustaining carry. Force's neutral element means it's splashable into any team that needs a reliable melee DPS.

**Evolved Form — Warforged Champion**: Challenge Protocol grants +30% ATK and +15% DR vs Rival. When Rival dies, the Duelist gains +10% permanent ATK for the rest of combat (stacks). Decisive Strike deals 350% ATK, ignores 50% DR, and if it kills the target, immediately refund 50% mana.

---

## Secondary Archetypes (for Ascension System)

Each unit gains a secondary archetype at Awakened ascension (unit level 15). These should complement the primary archetype without duplicating it:

| Unit | Primary | Secondary | Rationale |
|------|---------|-----------|-----------|
| Ashen Watcher | Sage | Mystic | Fire specialist healer — Mystic amplifies element damage, Sage handles sustain |
| Abyssal Guardian | Guardian | Warden | Defensive synergy — Guardian wall + Warden CC creates impenetrable frontline |
| Grove Warden | Ranger | Guardian | Positional sniper with survivability — Guardian shields help it survive while stationary |
| Tempest Weaver | Sorcerer | Ranger | Ranged mage carry — Ranger's distance scaling synergizes with backline casting |
| Voltfang Stalker | Predator | Duelist | Kill chain + single-target power — Predator resets + Duelist burst |
| Iron Duelist | Duelist | Vanguard | Aggressive melee — Duelist carry power + Vanguard front-row aggression |

---

## New Bonds

These units can participate in bonds with existing units:

| Bond Name | Units | Bonus |
|-----------|-------|-------|
| *Deep & Shallow* | Abyssal Guardian + Tide Hunter (both Water) | Both gain +12% HP. When Abyssal Guardian's Tidal Fortress activates, Tide Hunter gains +20% ATK for the duration. |
| *Fire and Ash* | Fire Dragon + Ashen Watcher (both Fire) | Fire Dragon's Dragonfire Aura heals allies for 5% of aura damage dealt. Ashen Watcher's heals on Burning allies are +20% stronger. |
| *Eye of the Storm* (trio) | Tempest Weaver + Monsoon Caller + Storm Sovereign (all Wind) | Vortices and Monsoon zones merge: shared zones deal combined damage and grant combined buffs. All Wind allies gain +8% ability damage. |

---

## Integration Notes

1. **UNITS-DESIGN.md**: Add these 6 units to their respective element sections as unit #11 (each element goes from 10 to 11 units... except the existing distribution is 10/element × 6 = 60. With 6 new units at 1/element, it becomes 11/element × 6 = 66).
2. **units-templates.js**: Add 6 new entries to UNIT_TEMPLATES + 6 to EVOLVED_TEMPLATES.
3. **units-abilities.js**: Add 12 ability entries (6 base + 6 evolved) + 12 passive entries (6 base + 6 evolved).
4. **Gacha pool**: These units enter the pool when T4 becomes available (player level 9+).
5. **Enemy generation**: These units can appear as T4 enemies in R4+ stages.
6. **Tier count update**: All references to "60 units" become "66 units", "6 T4" becomes "12 T4".

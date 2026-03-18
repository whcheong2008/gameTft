# Combat System — Deep Design Document

> Comprehensive combat design for a publishable auto-battler. Replaces the current stat-check combat engine with a system that has depth, readability, and spectator appeal.

## Design Goals

1. **Watchable**: Every fight tells a story. Players should feel tension, read the flow, and understand why they won or lost.
2. **Positional depth**: Where you place units matters as much as which units you field.
3. **Ability-driven**: Auto-attacks are the baseline; abilities are the moments that swing fights.
4. **Buildcraftable**: Synergies, items, and unit composition create meaningful team-building decisions.
5. **Readable at a glance**: Status effects, targeting, and damage should be visually clear even at fast speed.

---

## 1. Grid & Positioning

### Grid Layout
- **Player board**: 4 rows × 7 columns (28 cells) — unchanged from current
- **Enemy board**: 4 rows × 7 columns, mirrored across a gap
- **Battlefield**: The two boards face each other with a 1-cell gap between them. Total combat area is 9 rows × 7 columns (rows 0–3 = player, row 4 = gap, rows 5–8 = enemy).

### Distance Calculation
**Chebyshev distance** (diagonal movement = 1 cell): `dist = max(|r1-r2|, |c1-c2|)`. This gives melee units a clear adjacent zone and makes diagonal positioning meaningful.

### Positional Roles
| Row | Role | Why It Matters |
|-----|------|---------------|
| 0 (back) | Backline — healers, archers, mages | Protected from melee, but vulnerable to assassin dive |
| 1 | Mid-back — ranged damage, support | Can reach most enemies, some protection |
| 2 | Mid-front — bruisers, short-range mages | Flexible, can peel for backline or push front |
| 3 (front) | Frontline — tanks, warriors | First contact, absorbs damage, controls space |

### Formation Bonuses (New)
If 3+ units share the same row, they gain a small formation bonus:
- **Front row (row 3)**: +5% max HP (holding the line)
- **Back row (row 0)**: +5% attack speed (coordinated fire)
- These are subtle — they reward intentional positioning without punishing spread formations.

---

## 2. Movement System

### Overview
Units physically move on the grid toward their targets. Movement creates the visual drama of combat — tanks advancing to meet enemies, assassins dashing past the frontline, healers repositioning.

### Movement Rules
- **Move speed**: Cells per second (current `moveSpd` stat). Range: 0.5 (World Tree) to 4.5 (Storm Assassin).
- **Collision**: Units cannot share cells. If a unit's path is blocked, it routes around (simple BFS pathfinding).
- **Melee units**: Move toward target until adjacent (distance ≤ 1), then stop and attack.
- **Ranged units**: Move toward target until within attack range, then **hold position**. If an enemy enters melee range, ranged units attempt to **kite** (move 1 cell away while on attack cooldown) if they have moveSpd > enemy moveSpd.
- **Assassins**: At combat start, assassins **dash** to the enemy backline (row 0/row 8) ignoring collision for the initial dash. After reaching backline, they follow normal movement rules.

### Movement Abilities
Some abilities interact with movement:
- **Teleport**: Instantly move to a target cell (e.g., assassin abilities).
- **Dash**: Move rapidly in a direction, dealing damage to units passed through.
- **Root**: Prevents movement but not attacks.
- **Slow**: Reduces moveSpd by a percentage.

---

## 3. Mana System

### Overview
Every unit has a mana bar. When full, the unit casts their ability. Mana generation creates pacing — early combat is auto-attack trading, mid-combat abilities start firing, and late-combat is chaos.

### Mana Stats
| Stat | Description | Default |
|------|-------------|---------|
| `maxMana` | Mana required to cast ability | Varies per unit (40–120) |
| `startMana` | Mana at combat start | 0 (some units/items modify this) |

### Mana Generation
| Source | Amount | Notes |
|--------|--------|-------|
| Auto-attack (dealing) | +10 mana | Flat per attack, regardless of damage |
| Taking damage | +mana equal to `(damage / maxHp) × 50` | Getting hit fills mana faster for tanks |
| Per second (passive) | +0 by default | Some units, items, or synergies grant passive mana gen |

### Mana Interactions
- **Silence**: Mana still generates, but ability cannot fire. Mana caps at max (doesn't overflow).
- **Mana burn** (future item/ability): Removes X mana from target on hit.
- **Mana start** items/synergies: Begin combat with bonus starting mana.
- **Mana refund**: Some abilities refund partial mana on kill.

### Ability Casting
When mana reaches `maxMana`:
1. Unit pauses auto-attack briefly (0.3s cast time, some abilities are instant)
2. Ability resolves
3. Mana resets to 0
4. Auto-attack cooldown resets

---

## 4. Ability Design

### Philosophy
Every unit has **one ability**. Evolved forms get an **enhanced version** of the same ability (not a different ability — this maintains unit identity). Abilities should be visually distinct, tactically meaningful, and complement the unit's role.

### Ability Properties
```
{
    name: 'Flame Slash',
    description: 'Deal 150% ATK to target, apply Burn for 3s',
    maxMana: 60,
    castTime: 0.3,        // seconds of pause before resolution
    targetType: 'current', // current, lowest_hp, highest_atk, self, all_allies, all_enemies, aoe_around_self, aoe_around_target, row, cone
    range: 1,              // 0 = self, 1 = adjacent, etc.
    effects: [
        { type: 'damage', value: 1.5, scaling: 'atk' },
        { type: 'status', status: 'burn', duration: 3, dps: 20 }
    ]
}
```

### Unit Abilities — Full Roster

#### Cost 1 Units

**Flame Warrior** — *Flame Slash* (60 mana)
Deal 150% ATK to current target. Apply Burn (20 DPS) for 3s.
→ **Fire Berserker** — *Inferno Slash* (60 mana)
Deal 200% ATK to current target AND all adjacent enemies. Apply Burn (30 DPS) for 5s.

**Ember Scout** — *Shadow Strike* (50 mana)
Teleport to the furthest enemy. Deal 200% ATK. Gain 50% dodge for 1.5s after landing.
→ **Flame Rogue** — *Phantom Blaze* (50 mana)
Teleport to furthest enemy. Deal 250% ATK. Leave a fire trail on previous position (3s, 25 DPS to enemies who cross it).

**Tide Hunter** — *Crashing Wave* (70 mana)
Deal 100% ATK to all enemies in the same row as current target. Apply 20% Slow for 3s.
→ **Tsunami Blade** — *Tidal Surge* (70 mana)
Deal 150% ATK in a 2-cell line from self toward target. Apply 40% Slow for 4s. Pull hit enemies 1 cell toward self.

**Frost Archer** — *Frost Shot* (50 mana)
Next 3 auto-attacks apply 20% Slow for 2s each. These attacks deal +30% damage.
→ **Ice Sniper** — *Frozen Volley* (50 mana)
Fire 3 arrows at random enemies. Each deals 80% ATK and applies Freeze (stun) for 1s.

**Stone Guard** — *Stone Wall* (80 mana)
Gain Shield equal to 30% max HP. Taunt all enemies within 2 cells for 3s.
→ **Mountain Lord** — *Earthquake* (80 mana)
Taunt ALL enemies within 3 cells for 4s. Gain Shield equal to 40% max HP. Taunted enemies deal 15% less damage.

**Zephyr Scout** — *Wind Step* (40 mana)
Gain 100% dodge for 2s. Next auto-attack after Wind Step deals 250% ATK.
→ **Storm Assassin** — *Lightning Execution* (40 mana)
Dash to the lowest-HP enemy. Deal 300% ATK. If this kills the target, refund 50% max mana.

**Wind Archer** — *Gale Shot* (60 mana)
Fire a piercing arrow in a line. Deals 120% ATK to ALL enemies in the row.
→ **Gale Sniper** — *Tempest Barrage* (60 mana)
Fire 5 rapid shots at current target, each dealing 60% ATK and ignoring 50% of target's damage reduction.

#### Cost 2 Units

**Magma Knight** — *Magma Shield* (90 mana)
Gain Shield equal to 25% max HP. For 4s, reflect 30% of melee damage received back to attacker.
→ **Volcano Titan** — *Eruption* (PASSIVE — no mana)
On death: deal 300% ATK as fire damage to all enemies within 2 cells. Apply Burn (40 DPS) for 3s to survivors.

**Coral Priest** — *Healing Wave* (70 mana)
Heal the 2 lowest-HP allies for 150% of Coral Priest's ATK each.
→ **Ocean Sage** — *Tidal Blessing* (70 mana)
Heal ALL allies for 100% ATK. Each healed ally gains a 100 Shield.

**Hydro Mage** — *Water Bolt* (60 mana)
Deal 200% ATK to current target. Reduce target's ATK by 20% for 4s.
→ **Abyssal Mage** — *Depth Charge* (60 mana)
Deal 250% ATK to target. Splash 50% damage to all enemies within 1 cell of target. Reduce all hit enemies' ATK by 30% for 5s.

**Vine Archer** — *Entangle* (60 mana)
Root current target for 2s. Deal 150% ATK to rooted target.
→ **Thorn Ranger** — *Thorn Prison* (60 mana)
Root target AND all enemies within 1 cell for 2.5s. Deal 120% ATK to all rooted enemies. Rooted enemies take 15% more damage from all sources.

**Earth Shaman** — *Nature's Touch* (80 mana)
Heal lowest-HP ally for 200% ATK. Cleanse 1 debuff from the healed ally.
→ **Gaia Priest** — *Life Bloom* (80 mana)
Heal 3 lowest-HP allies for 150% ATK each. Apply Regen (2% max HP/s) for 4s to each. Cleanse all debuffs.

**Storm Mage** — *Chain Lightning* (60 mana)
Deal 180% ATK to current target. Lightning bounces to 2 nearby enemies, dealing 60% damage each bounce.
→ **Tempest Wizard** — *Thunder Storm* (60 mana)
Deal 150% ATK to 3 random enemies. Each hit has 30% chance to Stun for 1.5s. Bounces an additional time if target is wet (Water element enemy or affected by slow).

**Sky Knight** — *Battle Cry* (80 mana)
Grant all allies +15% ATK and a 100-point Shield for 5s.
→ **Aegis Paladin** — *Divine Aegis* (80 mana)
Grant all allies +20% ATK, 200-point Shield, and 15% damage reduction for 5s.

#### Cost 3 Units

**Pyromancer** — *Meteor* (100 mana)
Deal 250% ATK in a 2-cell radius around target. Apply Burn (25 DPS) for 4s to all hit enemies.
→ **Inferno Mage** — *Inferno* (100 mana)
Deal 300% ATK in a 3-cell radius. Apply Burn (40 DPS) for 5s. Hit enemies receive 50% reduced healing for the burn duration.

**Golem** — *Seismic Slam* (90 mana)
Stun all enemies within 1 cell for 1.5s. Deal 150% ATK to all stunned enemies.
→ **Titan** — *Colossal Impact* (90 mana)
Stun all enemies within 2 cells for 2s. Deal 200% ATK. Gain Shield equal to 20% max HP per enemy stunned.

#### Cost 4 Units

**Fire Dragon** — *Dragon Breath* (80 mana)
Deal 200% ATK in a cone (3 cells deep, widening). Apply Burn (30 DPS) for 5s. Enemies already burning take 25% bonus damage.

**Leviathan** — *Tidal Crush* (100 mana)
Deal 180% ATK to ALL enemies. Apply 30% Slow for 3s. Leviathan heals for 10% of total damage dealt.

#### Cost 5 Units (Legendary — Unique Passives)

**Phoenix** — *Rebirth* (PASSIVE — no mana)
On death: revive with 50% HP after 2s invulnerability. Deal 250% ATK to all enemies on revival. Once per combat. While alive, allies within 2 cells gain 10% ATK.

**World Tree** — *Bloom of Life* (PASSIVE — triggers once)
When any ally first drops below 20% HP: heal ALL allies for 30% of their max HP and cleanse all debuffs. Once per combat. Passive aura: allies within range heal 1% max HP per second.

---

## 5. Status Effect System

### Overview
A unified status effect framework that handles buffs, debuffs, crowd control, and damage over time. Every status has a visual indicator, duration, and clear rules for stacking.

### Status Effect Categories

#### Crowd Control (CC)
| Status | Effect | Can Attack? | Can Move? | Can Cast? | Visual |
|--------|--------|-------------|-----------|-----------|--------|
| **Stun** | Full disable | No | No | No | Stars circling above head |
| **Silence** | Ability lockout | Yes | Yes | No | Purple X over mana bar |
| **Root** | Movement lockout | Yes | No | Yes | Green vines at feet |
| **Blind** | 50% miss chance on autos | Yes (misses) | Yes | Yes | Dark cloud over eyes |
| **Taunt** | Forced targeting | Forced target | Toward taunter | Yes | Red arrow pointing to taunter |
| **Freeze** | Full disable + takes 20% more damage | No | No | No | Blue ice crystal encasing unit |

#### Damage Over Time (DoT)
| Status | Effect | Stacking | Visual |
|--------|--------|----------|--------|
| **Burn** | X damage per second, reduces healing by 25% | Up to 3 stacks (DPS stacks, duration refreshes) | Orange flame particles |
| **Poison** | X damage per second, reduces healing by 50% | Up to 3 stacks (DPS stacks, duration refreshes) | Green bubble particles |
| **Bleed** | X damage per second, movement causes bonus damage tick | Up to 3 stacks | Red drip particles |

#### Buffs
| Status | Effect | Stacking | Visual |
|--------|--------|----------|--------|
| **Shield** | Absorbs damage before HP | Additive (multiple shields stack HP) | Blue border glow |
| **Regen** | Heals X HP per second | Additive | Green plus particles |
| **ATK Up/Down** | +/-X% attack damage | Multiplicative with each other, additive within same tier | Red up/down arrow |
| **DEF Up/Down** | +/-X% damage reduction | Same | Blue up/down arrow |
| **SPD Up/Down** | +/-X% attack speed | Same | Yellow up/down arrow |
| **Dodge** | X% chance to avoid auto-attacks entirely | Highest value wins (doesn't stack) | White afterimage |

### CC Rules
- **Diminishing returns**: If a unit is CC'd (stun/freeze/root) twice within 8 seconds, the second CC duration is halved. Third within 8s = 25%. Prevents perma-stun.
- **Tenacity**: Some units/items grant tenacity (reduce CC duration by X%). Caps at 60%.
- **CC immunity**: After being stunned/frozen, a unit is immune to stun/freeze for 1s.
- **Cleanse**: Some abilities remove debuffs. Cleanses always remove the longest-remaining debuff first.

### DoT Rules
- DoTs tick once per second (not per combat tick — this prevents framerate-dependent damage).
- Each stack has independent DPS but shares duration. Refreshing a DoT extends all stacks to the new duration.
- Healing reduction from Burn/Poison applies to ALL healing received, including Regen, Lifesteal, and ability heals.

---

## 6. Targeting System

### Overview
Targeting determines which enemy a unit attacks. The current system is too simple (nearest = first in array). The new system uses actual grid distance and role-appropriate priority.

### Default Targeting by Type
| Type | Primary Target | Tiebreaker | Behavior |
|------|---------------|------------|----------|
| **Tank** | Nearest enemy | Lowest HP | Advances to frontline, body-blocks |
| **Warrior** | Nearest enemy | Highest ATK (focus threats) | Advances aggressively |
| **Assassin** | Furthest enemy (backline) | Lowest HP | Dashes to backline at combat start |
| **Archer** | Nearest enemy within range | Lowest HP | Maintains distance, kites melee |
| **Mage** | Highest-ATK enemy in range | Nearest if tied | Focuses damage dealers |
| **Healer** | Lowest % HP ally | Nearest if tied | Heals instead of damages |

### Targeting Overrides (Priority Order)
1. **Taunt**: If taunted, MUST target the taunting unit (if in range). Overrides everything.
2. **Ability targeting**: When casting ability, use the ability's `targetType` instead of default.
3. **Aggro shift**: If current target dies, immediately retarget using default rules.
4. **Sticky targeting**: Units keep their current target for 2s even if a "better" target becomes available. Prevents constant target-switching visual noise.

### Range Mechanics
- **Melee range**: 1 cell (adjacent). Must move to reach target.
- **Ranged**: 2–5 cells depending on unit. Can attack from distance.
- **Range advantage**: Ranged units prioritize attacking without moving. They only move if no enemies are in range.
- **Minimum range**: None (all ranged units can attack adjacent targets, but prefer to keep distance).

---

## 7. Damage Pipeline

### Overview
All damage flows through a single pipeline. This ensures consistent interactions between elements, items, abilities, synergies, and status effects.

### Damage Calculation
```
Step 1: Raw Damage
  rawDamage = attack × abilityMultiplier (1.0 for auto-attacks)

Step 2: Element Multiplier
  elementMult = getElementMultiplier(attacker, target)
    Strong → 1.3x | Neutral → 1.0x | Weak → 0.7x
  + Element Mastery item bonus (if applicable)
  - Element Resist (from items/synergies, reduces bonus element damage)

Step 3: Critical Strike
  if (random < critChance): damage × critMultiplier (default 1.5x)
  critChance from: items, synergies, abilities
  critMultiplier modifiable by items

Step 4: Damage Modifiers (multiplicative)
  × (1 + attacker ATK Up%) × (1 - attacker ATK Down%)
  × (1 + target's vulnerability%) (e.g., Freeze = +20%)
  × (1 + bonus damage vs type%) (e.g., Abyssal Mage vs tanks)

Step 5: Damage Reduction (target's defense)
  × (1 - target's damageReduction%)
  DR from: Earth synergy, Guardian archetype, items, abilities

Step 6: Flat Additions
  + burnDamage (from Fire synergy)
  + on-hit effects (BotRK %maxHP, setBurn, etc.)

Step 7: Dodge Check
  if (random < target.dodgeChance): damage = 0, trigger "DODGE" visual

Step 8: Shield Absorption
  if target has shield: absorb min(shield, damage), reduce shield

Step 9: Apply to HP
  target.hp -= remaining damage
  if target.hp <= 0: trigger death effects

Step 10: On-Hit Triggers
  Attacker: lifesteal, mana generation, on-hit item effects
  Target: mana generation from damage taken, thorns/reflect damage
```

### Damage Types
Currently all damage is a single type. For the publishable version, introduce two damage types:
- **Physical**: Modified by armor/DR. Dealt by warriors, tanks, assassins, archers.
- **Magical**: Modified by magic resist. Dealt by mages and healer damage.
- **True damage**: Ignores all mitigation. Rare — only from specific abilities or items.

> Note: This is a significant expansion. Can be deferred to a later design pass if two damage types add too much complexity for the current scope.

---

## 8. Synergy Combat Integration

### Archetype Synergies (Existing — Enhanced)
Current system applies flat stat bonuses. Enhanced version adds combat-relevant effects at tier 3 (6-piece).

| Archetype | 2-piece | 4-piece | 6-piece (NEW) |
|-----------|---------|---------|---------------|
| **Guardian** | +150 HP | +350 HP | +600 HP, +10% DR, +20% CC resist |
| **Striker** | +15% ATK | +30% ATK | +50% ATK, +10% crit, crits deal +25% |
| **Predator** | +20% attack speed | +40% attack speed | +60% attack speed, attacks have 15% chance to hit twice |
| **Mystic** | +20% element damage | +40% element damage, +15% element resist | +60% element damage, +30% resist, abilities cost 15% less mana |
| **Vanguard** | Front row: +200 HP, +10 ATK | Front row: +450 HP, +25 ATK | Front 2 rows: +600 HP, +40 ATK, +10% DR |
| **Sage** | +30% heal power | +60% heal power, +100 HP/s regen | +100% heal power, +200 HP/s regen, heals grant 5% max HP shield |

### Element Synergies (Existing — Enhanced)
Add tier 3 at 6-piece for each element (requires dedicated element teams).

| Element | 2-piece | 4-piece | 6-piece (NEW) |
|---------|---------|---------|---------------|
| **Fire** | 15 burn DPS on attack | 40 burn DPS, 50 AoE on kill | 60 burn DPS, 100 AoE on kill, enemies start combat with Burn (3s) |
| **Water** | Enemy speed -15% | Enemy speed -30%, allies 2% HP/s regen | Enemy speed -40%, allies 3% regen, allies cleanse 1 debuff every 8s |
| **Earth** | 15% max HP shield | 30% shield, +10% DR | 40% shield, +15% DR, shields regenerate 5% per second when not hit for 3s |
| **Wind** | +15% ally speed | +30% speed, 15% dodge | +40% speed, 25% dodge, dodging an attack grants +20% ATK for 2s |

---

## 9. Combat Pacing & Flow

### Fight Duration Targets
| Content | Target Duration | Waves |
|---------|----------------|-------|
| Early grind mission | 20–30s per wave | 2 waves |
| Mid-game story mission | 30–45s per wave | 3 waves |
| Late-game story mission | 40–60s per wave | 4–5 waves |
| Boss fight | 60–90s total | 1 wave (with phases) |

### Pacing Beats
A well-paced fight should have these beats:
1. **Engage (0–5s)**: Units advance, frontlines meet. Assassins dash to backline. First auto-attacks land.
2. **First abilities (5–15s)**: Fast mana units (assassins, 40 mana) cast first. Stuns, burst damage, first kills.
3. **Turning point (15–30s)**: Healers cast. Tanks pop shields. The tide either holds or breaks.
4. **Cleanup (30s+)**: One side has clear advantage. Remaining units chase down survivors.

### Timeout
- 90-second hard timeout (up from 60s). Result: draw. No star rating, partial rewards.
- 60-second soft enrage: all units gain +20% ATK and +20% attack speed to prevent stalemates.

### Between Waves
- All surviving units heal to full HP
- Mana resets to `startMana` (usually 0)
- All status effects cleared
- Player can reposition units (drag-and-drop, same as current)
- Dead units stay dead for the mission (not revived between waves)

> Design decision: dead units staying dead between waves is critical for star rating. It incentivizes clean play and makes healing/tanking valuable. If this feels too punishing, could add a "field medic" mechanic where 1 random dead unit revives at 50% HP between waves.

---

## 10. Boss Fight Design

### Overview
Boss fights are special single-wave encounters with unique mechanics. The boss is one large unit that takes up a 2×2 space on the grid, has massive HP, and multiple abilities on independent cooldown timers (not mana-based).

### Boss Properties
```
{
    name: 'Infernal Wyvern',
    hp: calculated from player power,
    attack: ...,
    size: [2, 2],        // occupies 4 cells
    phases: [
        { hpThreshold: 1.0, abilities: [...], attackPattern: 'normal' },
        { hpThreshold: 0.5, abilities: [...], attackPattern: 'enraged' }
    ],
    enrageTimer: 120,    // seconds until hard enrage
    minionWaves: [...]   // timed minion spawns
}
```

### Boss Mechanics
- **Phase transitions**: At HP thresholds (e.g., 50%), boss changes behavior. Brief invulnerability window during transition (2s). Visual: screen shake, color shift.
- **Telegraphed AoE**: Boss marks cells on the grid 2s before dealing heavy damage there. Visual: red danger zones. Players can't reposition mid-combat, but this rewards good initial placement that avoids predictable danger zones.
- **Minion spawns**: Every 20–30s, boss summons 2–4 minions. Minions must be dealt with or they'll overwhelm the team.
- **Enrage**: After 120s, boss gains +100% ATK and +50% attack speed. Soft check that you have enough DPS.

### Example Boss: Infernal Wyvern (Mission 10 Boss)
- **Phase 1 (100–50% HP)**:
  - *Flame Breath*: Every 8s, deals 150% ATK in a cone covering columns 2–5 of the player board. Players should position units on the edges.
  - *Tail Swipe*: Every 12s, deals 100% ATK to all melee-range units and knocks them back 1 cell.
- **Phase 2 (50–0% HP)**:
  - *Inferno*: Every 15s, deals 80% ATK to ALL player units and applies 5s Burn. Healing is critical.
  - *Summon Drakes*: Every 25s, spawns 2 Fire Drake minions (cost-2 equivalent stats).
  - Flame Breath cone widens to columns 1–6.

### Boss Reward Structure
Bosses drop premium rewards: guaranteed rare+ item component, bonus essences, and a unique cosmetic on first clear.

---

## 11. Combat Visuals & Feedback

### Priority Visual Features (for publishable quality)
These are the minimum visual features needed to make combat readable and satisfying:

#### Damage Numbers
- Float up from damaged unit, fade out over 0.5s
- Color coded: white (normal), yellow (crit), red (burn/DoT), green (heal), blue (shield)
- Size scales slightly with damage magnitude
- Stagger multiple numbers so they don't overlap

#### Health Bars
- Thin bar above each unit, color: green → yellow → red as HP decreases
- Shield shown as blue extension of the health bar
- Mana bar below health bar (thin, blue fill)

#### Status Effect Icons
- Small icons displayed to the right of the unit (max 3 visible, "+N" for overflow)
- Stun: ⭐ | Silence: 🚫 | Root: 🌿 | Burn: 🔥 | Poison: ☠️ | Shield: 🛡️
- Duration bar beneath each icon (depletes left to right)

#### Ability Casting
- Brief cast animation: unit glows with element color
- Projectile/effect travels to target(s)
- Screen-wide abilities: brief screen flash in element color
- AoE: circle/cone indicator appears on grid for 0.2s before damage resolves

#### Death
- Unit plays a dissolve/fade animation (0.5s)
- On-death effects trigger visually (Volcano Titan explosion, Phoenix rebirth glow)
- Dead units leave a faint ghost on their cell (shows where they were)

#### Movement
- Smooth interpolation between cells (not grid-snapped teleportation)
- Assassin dash: fast blur trail in element color
- Kiting: ranged units visually hop backward

---

## 12. Combat Speed Controls

### Speed Settings
- **1x**: Default. Good for learning, watching boss mechanics.
- **2x**: Recommended for grind missions. All timers halved.
- **4x**: Fast-forward. For farming content you've already cleared.
- **Auto**: Automatically plays at 4x for grind, 1x for new story content.

### Skip Option
For missions the player has already 3-starred, offer an "Auto-Battle" option that instantly calculates the result (win/loss/stars) without animation. Uses the same combat engine but skips rendering.

---

## 13. Migration Path from Current Combat

### What Changes
| Current | New | Migration Effort |
|---------|-----|-----------------|
| `findTarget` returns first alive in array | Returns nearest by grid distance + type priority | Moderate — rewrite function |
| No movement (units are stationary) | Real grid movement with pathfinding | Major — new system |
| No mana system | Full mana bars with ability casting | Major — new system |
| Evolved abilities are stat approximations | Real abilities with effects | Major — redefine all abilities |
| No status effects | Full status framework | Major — new system |
| `performAttack` is flat damage calc | Multi-step damage pipeline | Moderate — refactor existing |
| Element synergies applied at combat start | Same, but add tier 3 | Minor — add data |
| Item effects hardcoded in combat tick | Unified on-hit / on-cast / on-death hook system | Moderate — refactor |
| 60s timeout | 90s timeout + soft enrage at 60s | Minor |

### Recommended Implementation Order
1. **Grid distance & real targeting** — Foundation for everything else
2. **Movement system** — Units physically walk, ranged stay at distance
3. **Mana system** — Add mana bars, generation, and basic ability casting
4. **Status effect framework** — The engine that abilities plug into
5. **Ability implementation** — Wire up all 38 unit abilities (22 base + 16 evolved)
6. **Damage pipeline refactor** — Unify all damage through one path
7. **Boss fight system** — Phases, telegraphs, minion spawns
8. **Visual layer** — Damage numbers, health bars, status icons, ability VFX
9. **Speed controls** — 1x/2x/4x, auto-battle for cleared content
10. **Balance pass** — Tune mana costs, ability values, stat curves

### Backward Compatibility
The current save format doesn't need changes for combat — combat state is ephemeral (not saved). Unit stats, items, and synergies all feed into combat the same way. The changes are entirely within the combat engine and rendering.

---

## 14. Balance Framework

### Power Budget Per Unit
Each unit has a "power budget" based on cost tier. Higher-cost units get more total stats AND better ability ratios.

| Cost | Total Stat Budget | Ability Power | MaxMana |
|------|------------------|---------------|---------|
| 1 | Low | Moderate, single-target | 40–60 |
| 2 | Medium | Moderate, may hit 2–3 targets | 60–80 |
| 3 | High | Strong AoE or powerful single-target | 80–100 |
| 4 | Very High | Wide AoE or fight-changing effect | 80–100 |
| 5 | Legendary | Passive game-changers | N/A (passive) |

### Star Scaling with Abilities
Star-up currently scales HP and ATK by `1.8^(stars-1)`. Abilities scale with ATK, so they naturally get stronger with stars. Ability-specific values (DoT DPS, CC duration, shield amounts) do NOT scale with stars — only the ATK-based portions do. This prevents high-star units from having 10-second stuns.

### TTK Targets (Time to Kill)
| Matchup | Target TTK |
|---------|-----------|
| DPS vs DPS (no healer) | 4–8 seconds |
| DPS vs Tank (no healer) | 10–18 seconds |
| DPS vs Tank + Healer | 15–25 seconds (healer must die first) |
| Full team vs full team | 25–50 seconds |

If TTK is too fast, increase base HP across the board. If too slow, increase base ATK. The ratio determines the pacing feel.

---

## 15. Future Expansion Hooks

### Designed For But Not Yet Specified
- **PvP (Async)**: Player attacks another player's defense team. Same combat engine, just player-built enemies. Requires a leaderboard and matchmaking system.
- **Challenge Modes**: Time attack (clear in X seconds), survival (endless waves), limited roster (only cost 1–2 units).
- **Equipment Abilities**: Items could grant units a second ability (activated at specific triggers).
- **Combo System**: Certain ability sequences within 2s grant bonus effects (e.g., Stun → Shatter = bonus damage).
- **Weather/Terrain**: Mission-specific modifiers that affect the grid (lava tiles deal DoT, water tiles slow movement, etc.).
- **Spectator Mode**: Watch replays of PvP fights with ability to slow-mo and zoom.

---

## Appendix: Quick Reference Tables

### All Unit MaxMana Values
| Unit | Base Mana | Evolved Mana |
|------|-----------|-------------|
| Flame Warrior | 60 | 60 |
| Ember Scout | 50 | 50 |
| Tide Hunter | 70 | 70 |
| Frost Archer | 50 | 50 |
| Stone Guard | 80 | 80 |
| Zephyr Scout | 40 | 40 |
| Wind Archer | 60 | 60 |
| Magma Knight | 90 | PASSIVE |
| Coral Priest | 70 | 70 |
| Hydro Mage | 60 | 60 |
| Vine Archer | 60 | 60 |
| Earth Shaman | 80 | 80 |
| Storm Mage | 60 | 60 |
| Sky Knight | 80 | 80 |
| Pyromancer | 100 | 100 |
| Golem | 90 | 90 |
| Fire Dragon | 80 | — |
| Leviathan | 100 | — |
| Phoenix | PASSIVE | — |
| World Tree | PASSIVE | — |

### Status Effect Duration Ranges
| Status | Min Duration | Max Duration | Typical |
|--------|-------------|-------------|---------|
| Stun | 1.0s | 2.5s | 1.5s |
| Freeze | 1.0s | 2.0s | 1.0s |
| Silence | 2.0s | 4.0s | 3.0s |
| Root | 1.5s | 3.0s | 2.0s |
| Blind | 2.0s | 4.0s | 3.0s |
| Taunt | 2.0s | 4.0s | 3.0s |
| Burn | 3.0s | 5.0s | 3.0s |
| Poison | 3.0s | 6.0s | 4.0s |
| Slow | 2.0s | 5.0s | 3.0s |
| Regen | 3.0s | 6.0s | 4.0s |
| Buffs (ATK/DEF/SPD) | 3.0s | 6.0s | 5.0s |
| Dodge | 1.0s | 3.0s | 2.0s |

---

## Appendix B: Edge Cases & Clarifications

### Passive Ability Execution Model
Three units have passive abilities (no mana): Volcano Titan, Phoenix, World Tree. These work differently from active abilities:

- **On-death passives (Volcano Titan, Phoenix)**: Trigger the instant HP reaches 0, BEFORE the unit is removed from the combat state. Other units cannot target a dying unit, but the death effect resolves fully (damage, revive) before the next combat tick processes. If Volcano Titan's explosion kills another unit, that kill is credited immediately (triggering any on-kill effects for the original attacker, not Volcano Titan).
- **Conditional passives (World Tree)**: Checked at the end of each combat tick, after all attacks resolve. When the trigger condition is met (any ally below 20% HP), the effect fires once and is marked as used. The effect resolves before the next tick's attacks.
- **Phoenix revival**: When Phoenix dies, it enters a 2s invulnerability state. During this window, Phoenix is untargetable and cannot be selected as a target. It remains on its cell. After 2s, it revives with 50% HP, deals AoE damage, and becomes targetable again. Mana resets to 0 on revival. Any status effects on Phoenix are cleared on death (before revival).

### Collision & Pathfinding
- **Algorithm**: BFS (breadth-first search) from unit's current cell to the nearest cell within attack range of the target. Units treat occupied cells as impassable.
- **Conflict resolution**: If two units try to move into the same cell on the same tick, the unit with higher moveSpd wins. The slower unit recalculates its path on the next tick.
- **Stuck detection**: If a unit cannot find a path to any valid attack position for 3 consecutive seconds, it retargets to the nearest reachable enemy.
- **Assassin dash**: At combat start only, assassins ignore collision for their initial dash to the backline. They land on the nearest unoccupied cell in the enemy's back row (row 0 or row 8). If all back row cells are occupied, they land in the nearest available cell to a backline unit.

### Kiting Behavior
- Ranged units kite only when ALL of these are true: (1) an enemy is within melee range (distance ≤ 1), (2) the ranged unit's auto-attack is on cooldown, (3) there's an unoccupied cell further from the enemy and still within attack range of ANY enemy.
- Kiting moves 1 cell per attempt. The unit picks the cell that maximizes distance from the nearest melee enemy while staying within attack range.
- Kiting does NOT interrupt ability casting. If a ranged unit is at full mana and a melee enemy closes in, the unit casts its ability first, then kites.

### Ability Bounce/Chain Logic
- **Chain Lightning (Storm Mage)**: Bounces to the nearest enemy within 2 cells of the previous target that hasn't been hit yet by this cast. If no valid target exists, the chain stops.
- **Tempest Wizard**: Same bounce logic, but each target is independently rolled for stun chance. Bounce range increased to 3 cells.
- **Frost Archer enhanced attacks**: The 3 buffed attacks are tracked as a counter on the unit. If the unit dies and is revived (Phoenix ability, Guardian Angel item), the counter resets.

### Mana During Silence
- Mana generation continues normally during silence (from attacks dealt and damage taken).
- Mana caps at maxMana and does not overflow. When silence expires, if mana is at max, the ability casts immediately on the unit's next action.
- Mana burn effects can reduce mana below max during silence, effectively delaying the unit's ability even after silence ends.

### Status Effect Interactions
- **Burn + Poison**: Both can be active simultaneously. Healing reduction stacks additively (Burn 25% + Poison 50% = 75% reduced healing).
- **Stun + Freeze**: Cannot stack (Freeze is a stronger version of Stun). Applying Freeze to a stunned unit replaces the stun if the freeze has longer remaining duration.
- **Multiple Slows**: Multiplicative stacking. Two 20% slows = 0.8 × 0.8 = 0.64x speed (36% total slow). Prevents 100% slow from two sources.
- **Shield + Damage Reduction**: DR is applied BEFORE shield absorption. A 100-damage hit with 20% DR = 80 damage absorbed by shield.
- **Taunt + Assassin targeting**: Taunt overrides assassin backline preference. A taunted assassin attacks the taunter instead of diving. When taunt expires, the assassin resumes backline targeting.
- **Root + Kiting**: Rooted ranged units cannot kite but can still attack from their current position. If their current target moves out of range while rooted, they retarget to the nearest enemy in range.

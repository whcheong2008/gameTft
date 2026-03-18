# Auto Battler — Game Mechanics Reference
> Authoritative rules specification. Engine-agnostic — use this as the source of truth when porting to any platform.

---

## 1. Game Flow

### 1.1 Round Structure
```
Planning Phase → Combat Phase → Result → (if win) Next Round / (if lose/draw) Retry Same Round
```

### 1.2 Round Progression
- The game starts at **Round 1**.
- **Win**: Round number advances by 1.
- **Lose or Draw**: Round number stays the same. Player retries the same round.
- Gold income is awarded regardless of outcome.

### 1.3 Game Over
- Player starts with **100 HP**.
- HP reaches 0 → Game Over. Display final round reached.

---

## 2. Board Layout

### 2.1 Grid
- Each side has a **4 rows × 7 columns** grid.
- Player board (bottom), Enemy board (top).

### 2.2 Bench
- **9 slots** for holding purchased units not yet placed on the board.
- Units on the bench do NOT count toward synergies.
- Units on the bench do NOT participate in combat.

### 2.3 Unit Cap
- Maximum number of units the player can place on the board = **player level**.
- Bench has no cap beyond its 9 slots.

---

## 3. Economy

### 3.1 Gold Income (per round)
```
income = base + interest
base = 5
interest = min(5, floor(current_gold / 10))
```
Income is awarded at the start of each planning phase (including retries after a loss).

### 3.2 Shop
- Displays **5 unit cards** per roll.
- **Refresh cost**: 2 gold (rerolls all 5 cards).
- Only **base units** appear in the shop (never evolved forms).
- Sold-out slots are greyed out and cannot be purchased again until the next roll.

### 3.3 Selling Units
```
sell_value = unit_cost × 3^(stars - 1)
```
| Stars | Cost-1 Sell | Cost-2 Sell | Cost-3 Sell |
|-------|------------|------------|------------|
| 1     | 1          | 2          | 3          |
| 2     | 3          | 6          | 9          |
| 3     | 9          | 18         | 27         |
| 4     | 27         | 54         | 81         |

### 3.4 Buy XP
- Cost: **4 gold** for **4 XP**.

---

## 4. Leveling / XP

### 4.1 XP Thresholds
| Level | XP to Next | Unit Cap |
|-------|-----------|----------|
| 1     | 2         | 1        |
| 2     | 4         | 2        |
| 3     | 8         | 3        |
| 4     | 12        | 4        |
| 5     | 20        | 5        |
| 6     | 32        | 6        |
| 7     | 48        | 7        |
| 8     | 68        | 8        |
| 9     | —         | 9 (max)  |

### 4.2 Free XP
- **2 XP** awarded per round (including retries).

### 4.3 Level Effects
- **Unit cap** = level.
- **Shop pool** changes: higher levels unlock higher-cost units.

---

## 5. Shop Roll Weights

Percentage weight for each unit cost tier at each player level:

| Cost | Lv1 | Lv2 | Lv3 | Lv4 | Lv5 | Lv6 | Lv7 | Lv8+ |
|------|-----|-----|-----|-----|-----|-----|-----|------|
| 1    | 100 | 100 | 75  | 55  | 45  | 30  | 20  | 15   |
| 2    | 0   | 0   | 25  | 30  | 33  | 35  | 30  | 20   |
| 3    | 0   | 0   | 0   | 15  | 20  | 25  | 30  | 30   |
| 4    | 0   | 0   | 0   | 0   | 2   | 10  | 15  | 25   |
| 5    | 0   | 0   | 0   | 0   | 0   | 0   | 5   | 10   |

These are relative weights, not percentages. Each shop slot rolls independently from the weighted pool.

---

## 6. Star Upgrade System

### 6.1 Merge Rule
- **3 copies** of the same unit at the same star level → **1 copy at star level + 1**.
- When buying a unit: if 2 copies already exist at star 1, the bought copy triggers a merge to star 2.
- **Cascading**: If a merge creates a 3rd copy at the new star level, another merge triggers automatically.

### 6.2 Stat Scaling (Uncapped)
```
hp   = floor(base_hp   × 1.8^(stars - 1))
atk  = floor(base_atk  × 1.8^(stars - 1))
```
Other stats (attack speed, range, move speed) are **NOT** affected by star level.

| Stars | Multiplier |
|-------|-----------|
| 1     | 1.00×     |
| 2     | 1.80×     |
| 3     | 3.24×     |
| 4     | 5.83×     |
| 5     | 10.50×    |

### 6.3 No Star Cap
Stars can go beyond 3. Practically limited by economy and shop RNG.

---

## 7. Unit Taxonomy (4 Layers)

Every unit is defined by four independent dimensions:

### 7.1 Type (Combat Behavior)
Determines AI targeting priority and stat profile.

| Type     | Targeting           | Role                                    |
|----------|--------------------|-----------------------------------------|
| Tank     | Nearest enemy      | Very high HP, low ATK, melee            |
| Warrior  | Nearest enemy      | Balanced HP/ATK, melee                  |
| Assassin | **Furthest** enemy | Low HP, very fast attack speed, melee   |
| Archer   | Nearest enemy      | Moderate HP, ranged (3-5 range)         |
| Mage     | Nearest enemy      | Low HP, high ATK, ranged                |
| Healer   | **Lowest-HP ally** | Low ATK, heals allies instead of dealing damage |

### 7.2 Archetype (Synergy Group)
Field multiple units sharing an archetype to activate tiered bonuses. Only **board units** count (not bench). Bonuses apply to **all** allied units in combat.

| Archetype | Thresholds | Tier 1 | Tier 2 | Tier 3 |
|-----------|-----------|--------|--------|--------|
| Guardian 🛡️ | 2 / 4 / 6 | +150 HP | +350 HP | +600 HP, +10% damage reduction |
| Striker ⚔️  | 2 / 4 / 6 | +15% ATK | +30% ATK | +50% ATK, +10% crit chance |
| Predator 🐾 | 2 / 4     | +20% attack speed | +40% attack speed | — |
| Mystic 🔮   | 2 / 4     | +20% elemental dmg | +40% elemental dmg, +15% elem resist | — |
| Vanguard 🏰 | 2 / 4     | Front rows: +200 HP, +10 ATK | Front rows: +450 HP, +25 ATK | — |
| Sage 📖     | 2 / 4 / 6 | +30% heal power | +60% heal, +100 HP regen/5s | +100% heal, +200 HP regen/5s |

**Application rules**:
- Only the **highest active tier** applies (they do NOT stack across tiers).
- HP bonuses are **flat** and added to max HP and current HP at combat start.
- ATK% bonuses **multiply** the unit's attack stat.
- Attack speed bonus **reduces** attackSpd (lower = faster): `attackSpd = base × (1 - bonus)`.
- Vanguard "front rows" applies to units with combat y-coordinate ≥ 5 (bottom 2 rows of player side).
- Heal power multiplies the heal amount: `heal = base_heal × (1 + healBonus)`.
- Regen is per second: stored as `regenPerSec = specialVal / 5`, heals 1 HP per accumulated point.
- Crit chance: on each attack, roll `random() < critChance`. If crit, damage × 1.5.
- Damage reduction: `final_damage = damage × (1 - damageReduction)`.
- Element resist: adds to damage reduction for elemental attacks.

### 7.3 Element (Damage Type)
Determines the elemental nature of attacks. Follows a rock-paper-scissors cycle.

```
Fire → beats Wind → beats Earth → beats Water → beats Fire
```

**Damage multiplier**:
| Attacker vs Defender | Multiplier |
|---------------------|-----------|
| Strong against      | 1.3× (30% bonus) |
| Weak against        | 0.7× (30% penalty) |
| Neutral / same      | 1.0× |
| Either has no element | 1.0× |

**Element Synergies (V2)** — fielding multiple units of the same element activates bonuses:

| Element | 2-piece | 4-piece |
|---------|---------|---------|
| Fire 🔥 | All allies deal 15 burn/attack | Burn 40, on kill 50 AoE |
| Water 💧 | Enemy ATK speed -15% | -30% speed, allies heal 2% HP/s |
| Earth 🌿 | All allies gain 15% max HP shield | 30% shield, +10% DR |
| Wind 💨 | All allies +15% ATK speed | +30% speed, 15% dodge |

### 7.4 Class (Evolution / Promotion)
Units can evolve into a stronger form when criteria are met.

**When evolution is checked**: On unit buy, star merge, board placement, bench swap, and round start.

**On evolution**:
- Unit transforms **in-place** (keeps board/bench position).
- Keeps current **star level**.
- Gets the evolved form's **base stats**, recalculated with current star multiplier.
- Gets the evolved form's **attack speed, range, and move speed** (overwritten, not scaled).
- Gets a **unique combat ability**.
- `evolved` flag set to `true`.
- Evolved units **never appear in the shop**.
- Evolution is **one-way** (cannot revert).

---

## 8. Combat System

### 8.1 Overview
- Combat is **real-time**, running at display refresh rate (typically 60fps).
- Delta time is capped at **0.05 seconds** per tick to prevent physics explosions.
- Combat ends when all units on one side (or both) are dead.

### 8.2 Targeting (Sticky)
1. When a unit has no target or its target dies, it acquires a new target:
   - **Assassins**: Pick the **furthest** alive enemy.
   - **All others**: Pick the **nearest** alive enemy.
2. A unit **keeps its target** until the target dies. It does NOT retarget every frame.
3. **Chase timeout**: If a unit chases a target for `attackSpd × 3` seconds without landing an attack:
   - It looks for the nearest enemy **excluding** its current target.
   - It only switches if the alternative is **at least 30% closer** (`altDist < currentDist × 0.7`).
   - If no better option exists, it keeps chasing the original target.

### 8.3 Movement
- Units move toward their target at `moveSpd` cells per second.
- Movement is continuous (sub-cell positions) but rendered by snapping to the nearest grid cell.
- Direction: `(target.cx - unit.cx, target.cy - unit.cy)`, normalized.

### 8.4 Attack Cycle
1. Check if target is within range: `distance ≤ range + 0.3` (small buffer).
2. If in range: decrement `attackCooldown` by delta time.
3. When `attackCooldown ≤ 0`: perform attack, reset `attackCooldown = attackSpd`.
4. Initial cooldown on combat start: `attackSpd × 0.5` (so units don't all fire simultaneously).

### 8.5 Damage Formula
```
1. base_damage = attacker.attack
2. element_mult = getElementMultiplier(attacker.element, target.element)   // 0.7, 1.0, or 1.3
3. damage = floor(base_damage × element_mult)
4. if attacker.elemDmgBonus > 0 AND attacker has element:
       damage = floor(damage × (1 + elemDmgBonus))
5. if attacker.critChance > 0 AND random() < critChance:
       damage = floor(damage × 1.5)
6. damage_reduction = target.damageReduction
   if attacker is Gale Sniper (evolved): damage_reduction × 0.8
   if target.elemResist AND attacker has element: damage_reduction += elemResist
   damage = floor(damage × (1 - damage_reduction))
7. damage = max(1, damage)                                                // minimum 1 damage
8. if target.shield > 0: absorb from shield first, remainder hits HP
9. target.hp -= damage
```

### 8.6 Healer Behavior
- Healers still "attack" their target enemy (dealing damage), but **also** heal.
- Heal target: lowest HP% ally (excluding self) with HP < 95%.
- Base heal amount: `floor(attacker.attack × 1.5 × (1 + healBonus))`.
- **World Tree** (special): Heals **all** alive allies each attack.
- **Gaia Priest** (evolved): Heals **2** lowest-HP allies.
- **Ocean Sage** (evolved): Heals also grant **50 shield** to the heal target.

### 8.7 HP Regen (from Sage synergy)
- Applied per tick: `regenAccum += regenPerSec × dt`.
- When `regenAccum ≥ 1`: heal `floor(regenAccum)` HP, subtract from accumulator.
- Cannot exceed maxHp.

### 8.8 Shield
- Absorbs damage before HP.
- If `shield ≥ damage`: shield absorbs all, HP untouched.
- If `shield < damage`: shield is consumed, remaining damage hits HP.
- Shields do not decay over time (persist until consumed or combat ends).

---

## 9. Evolved Unit Abilities

Each evolved form has a unique passive combat ability:

| Evolved Unit | Ability | Implementation |
|-------------|---------|---------------|
| Fire Berserker | Burn on hit | Higher base stats (stat-based approximation) |
| Flame Rogue | Backline dive | Assassin type → targets furthest enemy |
| Volcano Titan | AoE on death | On death: deal **200 damage** to all enemies within distance 2 |
| Inferno Mage | Splash damage | Each attack deals **30% damage** to enemies within distance 1.5 of the target |
| Tsunami Blade | Slow | Each attack reduces target's moveSpd by **5%** (multiplicative, stacking) |
| Ice Sniper | Freeze | Every **3rd attack** adds **+0.5s** to target's attack cooldown |
| Ocean Sage | Heal + Shield | Heals also grant **50 shield** to the heal target |
| Abyssal Mage | Tank buster | +**25%** damage vs units with type `tank` |
| Mountain Lord | Taunt | (Planned — not yet fully implemented) Adjacent enemies should target this unit |
| Thorn Ranger | Reflect | Attackers who hit this unit take **15 damage** |
| Gaia Priest | AoE heal | Heals the **2** lowest-HP allies each attack (instead of 1) |
| Titan | Earthquake stun | Every **4th attack** adds **+0.5s** cooldown to all enemies within distance 1.5 |
| Storm Assassin | Chain lightning | On **kill**: deal **50 damage** to the nearest alive enemy |
| Gale Sniper | Armor pierce | Target's damage reduction is multiplied by **0.8** (ignores 20%) |
| Tempest Wizard | Bounce | Each attack also deals **50% damage** to one additional alive enemy |
| Aegis Paladin | Shield aura | At **combat start**: grant **+100 shield** to all allies |

### 9.1 Special Legendaries
| Unit | Ability | Trigger |
|------|---------|---------|
| Phoenix | Revive | On first death: restore to **50% maxHp**, set `hasRevived = true`. Only once per combat. |
| World Tree | Mass heal | Each attack heals **ALL** alive allies (instead of just the lowest-HP one) |

---

## 10. Enemy Wave Generation

### 10.1 Creep Rounds (1-3)
Fixed compositions with no element or archetype:

| Round | Enemies |
|-------|---------|
| 1     | 1× Slime (200 HP, 15 ATK, 1.2s speed) |
| 2     | 2× Slime (200 HP, 15 ATK, 1.2s speed) |
| 3     | 1× Wolf (350 HP, 30 ATK, 0.8s speed), 2× Slime (250 HP, 20 ATK, 1.2s speed) |

Creeps have: type `warrior`, no archetype, no element.

### 10.2 Scaling Rounds (4+)
```
gold_budget = floor(3 + round × 1.5)
max_unit_cost = round < 6 ? 2 : round < 10 ? 3 : round < 15 ? 4 : 5
max_units = 7
```
Units are randomly selected from the base shop pool, filtered by max cost. Budget is spent until exhausted or 7 units placed.

### 10.3 Enemy Star Upgrades
- Round 8+: each enemy unit has a **30% chance** to be 2-star.
- 2-star enemies get: `hp × 1.8`, `attack × 1.8`.

### 10.4 Enemy Placement
- Positions are shuffled randomly.
- Sorted to prefer **back rows** (higher row index = front for enemy, placed first).

### 10.5 Enemy Capabilities (V2)
- **Story missions 12+** and **grind missions level 14+**: enemies gain archetype and element synergy bonuses.
- **Story missions 12+** and **grind missions level 18+**: some enemies evolve via `checkEnemyEvolution()` (40% chance to star-boost + evolve).
- Evolved enemies display golden glow in combat.
- Enemy targeting follows the same rules as player units.

---

## 11. Damage on Loss
```
damage_to_player = 2 + (surviving_enemy_count × 2)
```
- Applied after a lost combat round.
- **Draw**: No damage taken.
- **Win**: No damage taken.

---

## 12. Unit Stats Reference

### 12.1 Base Stats (All Base Units)

| Unit | Cost | Type | Archetype | Element | HP | ATK | AtkSpd | Range | MoveSpd |
|------|------|------|-----------|---------|-----|-----|--------|-------|---------|
| Flame Warrior | 1 | Warrior | Striker | Fire | 600 | 50 | 0.8 | 1 | 2.0 |
| Ember Scout | 1 | Assassin | Predator | Fire | 420 | 40 | 0.5 | 1 | 3.5 |
| Tide Hunter | 1 | Warrior | Vanguard | Water | 580 | 48 | 0.8 | 1 | 2.0 |
| Frost Archer | 1 | Archer | Striker | Water | 380 | 52 | 0.7 | 3 | 2.0 |
| Stone Guard | 1 | Tank | Guardian | Earth | 750 | 30 | 1.0 | 1 | 1.5 |
| Zephyr Scout | 1 | Assassin | Predator | Wind | 400 | 42 | 0.45 | 1 | 4.0 |
| Wind Archer | 1 | Archer | Striker | Wind | 370 | 50 | 0.65 | 4 | 2.2 |
| Magma Knight | 2 | Tank | Guardian | Fire | 900 | 35 | 1.0 | 1 | 1.3 |
| Coral Priest | 2 | Healer | Sage | Water | 450 | 25 | 1.2 | 2 | 1.5 |
| Hydro Mage | 2 | Mage | Mystic | Water | 400 | 65 | 1.0 | 3 | 1.5 |
| Vine Archer | 2 | Archer | Predator | Earth | 400 | 55 | 0.7 | 3 | 1.8 |
| Earth Shaman | 2 | Healer | Sage | Earth | 480 | 28 | 1.2 | 2 | 1.5 |
| Storm Mage | 2 | Mage | Mystic | Wind | 420 | 60 | 0.9 | 3 | 1.5 |
| Sky Knight | 2 | Warrior | Guardian | Wind | 700 | 42 | 0.9 | 1 | 2.0 |
| Pyromancer | 3 | Mage | Sage | Fire | 380 | 80 | 1.0 | 3 | 1.5 |
| Golem | 3 | Tank | Vanguard | Earth | 1100 | 45 | 1.2 | 1 | 1.0 |
| Fire Dragon | 4 | Mage | Striker | Fire | 1100 | 85 | 0.9 | 2 | 1.8 |
| Leviathan | 4 | Tank | Guardian | Water | 1300 | 60 | 1.0 | 1 | 1.5 |
| Phoenix | 5 | Mage | Sage | Fire | 900 | 110 | 0.8 | 3 | 2.5 |
| World Tree | 5 | Healer | Sage | Earth | 1200 | 20 | 1.5 | 4 | 0.5 |

### 12.2 Evolved Form Stats

| Unit | Base Cost | Type | Archetype | Element | HP | ATK | AtkSpd | Range | MoveSpd |
|------|-----------|------|-----------|---------|-----|-----|--------|-------|---------|
| Fire Berserker | 1 | Warrior | Striker | Fire | 750 | 70 | 0.6 | 1 | 2.5 |
| Flame Rogue | 1 | Assassin | Predator | Fire | 500 | 55 | 0.4 | 1 | 4.0 |
| Volcano Titan | 2 | Tank | Guardian | Fire | 1200 | 50 | 1.0 | 1 | 1.2 |
| Inferno Mage | 3 | Mage | Sage | Fire | 450 | 110 | 1.0 | 4 | 1.5 |
| Tsunami Blade | 1 | Warrior | Vanguard | Water | 700 | 65 | 0.75 | 1 | 2.2 |
| Ice Sniper | 1 | Archer | Striker | Water | 420 | 75 | 0.65 | 5 | 2.0 |
| Ocean Sage | 2 | Healer | Sage | Water | 550 | 35 | 1.0 | 3 | 1.5 |
| Abyssal Mage | 2 | Mage | Mystic | Water | 480 | 85 | 0.9 | 4 | 1.5 |
| Mountain Lord | 1 | Tank | Guardian | Earth | 950 | 45 | 1.0 | 1 | 1.5 |
| Thorn Ranger | 2 | Archer | Predator | Earth | 480 | 70 | 0.6 | 4 | 2.0 |
| Gaia Priest | 2 | Healer | Sage | Earth | 580 | 40 | 1.0 | 3 | 1.5 |
| Titan | 3 | Tank | Vanguard | Earth | 1500 | 60 | 1.3 | 1 | 0.8 |
| Storm Assassin | 1 | Assassin | Predator | Wind | 470 | 55 | 0.35 | 1 | 4.5 |
| Gale Sniper | 1 | Archer | Striker | Wind | 420 | 70 | 0.6 | 5 | 2.2 |
| Tempest Wizard | 2 | Mage | Mystic | Wind | 500 | 80 | 0.8 | 4 | 1.5 |
| Aegis Paladin | 2 | Warrior | Guardian | Wind | 900 | 55 | 0.85 | 1 | 2.0 |

---

## 13. Evolution Criteria

> **V2 Update**: In V2, evolution is performed via the **Evolution Lab** building, not automatically at combat start. All evolutions now require 3-star base unit + gold cost. Evolved units become separate collection entries. See V2 notes below.

### V1 Criteria (historical — used in V1 combat-start auto-evolution)
| Base Unit | Evolved Form | V1 Criteria |
|-----------|-------------|-------------|
| Flame Warrior | Fire Berserker | Reach **3-star** |
| Ember Scout | Flame Rogue | Reach **3-star** |
| Magma Knight | Volcano Titan | Have **4+ Guardians** active on board |
| Pyromancer | Inferno Mage | Reach **2-star** AND have **2+ Sages** active |
| Tide Hunter | Tsunami Blade | Reach **3-star** |
| Frost Archer | Ice Sniper | Reach **3-star** |
| Coral Priest | Ocean Sage | Have **4+ Sages** active on board |
| Hydro Mage | Abyssal Mage | Reach **2-star** AND have **2+ Mystics** active |
| Stone Guard | Mountain Lord | Reach **3-star** |
| Vine Archer | Thorn Ranger | Have **4+ Predators** active on board |
| Earth Shaman | Gaia Priest | Reach **2-star** AND have **2+ Sages** active |
| Golem | Titan | Reach **2-star** AND have **4+ Guardians** active |
| Zephyr Scout | Storm Assassin | Reach **3-star** |
| Wind Archer | Gale Sniper | Reach **3-star** |
| Storm Mage | Tempest Wizard | Reach **2-star** AND have **2+ Mystics** active |
| Sky Knight | Aegis Paladin | Have **4+ Guardians** active on board |

### V2 Criteria (current)
All 16 evolutions require: **3-star base unit** + Evolution Lab built + gold cost (`50 × base unit cost`, reduced at higher lab levels).

The `requirements` array format is extensible for future criteria types (synergy counts, items, mission completions, etc.).

**V1 Notes**:
- Cost 4 and Cost 5 units have no evolution path.
- Synergy-based criteria count board units only (not bench).
- Evolution is checked on: buy, merge, place/swap on board, and round start.

**V2 Notes**:
- Evolution is a deliberate player action via the Evolution Lab building.
- Evolved units are separate collection entries (not in-place transforms).
- Base unit is preserved at current stars (not consumed).
- Evolved units need 10 copies to star up (same as base units).
- Evolved copies appear in gacha at 15% chance once player owns the evolved form.
- Enemies still use auto-evolution via `checkEnemyEvolution()` during mission generation.

---

## 14. Combat Coordinate System

### 14.1 Grid-to-Combat Mapping
- Player units: `combatY = boardRow + 4`, `combatX = boardCol`
- Enemy units: `combatY = 3 - boardRow`, `combatX = boardCol`
- This places enemies at y=0..3 and players at y=4..7.
- Distance: Euclidean `sqrt((ax-bx)² + (ay-by)²)`.

### 14.2 Rendering
- Combat positions are continuous (floating point).
- Rendered by snapping to the nearest grid cell: `round(cy - 4)` for player, `round(3 - cy)` for enemy.
- Clamped to grid bounds `[0..3, 0..6]`.

---

## 15. Item System (V2)

### 15.1 Item Types
| Type | Description | Slots |
|------|------------|-------|
| Component | Base items with a single stat, dropped from missions | 3 per unit |
| Combined | Two components auto-combined on the same unit | 3 per unit |
| Set | Crafted from combined item + essence at Forge | 3 per unit |
| Ability | Crafted from 2 combined items at Forge, or milestone reward | 3 per unit |

### 15.2 Rarity System
| Rarity | Color | Stat Bonus | Component Sell | Base Drop Weight |
|--------|-------|-----------|----------------|-----------------|
| Standard | #aaa | +0% | 5g | 60% |
| Uncommon | #44bb44 | +12% | 10g | 25% |
| Rare | #4488ff | +25% | 20g | 12% |
| Epic | #aa44ff | +50% | 40g | 3% |

Combined item stat formula: `baseStats × (1 + comp1Bonus + comp2Bonus)`

### 15.3 Components (8)
BF Sword (+15 ATK), Chain Vest (+200 HP), Giant's Belt (+300 HP), Recurve Bow (-0.1s atkSpd), Needlessly Large Rod (+20 ATK), Negatron Cloak (+10% DR), Sparring Gloves (+10% crit), Tear of the Goddess (+20% heal power)

### 15.4 Combined Recipes (8)
Infinity Edge (BF+BF), Blade of the Ruined King (BF+Bow), Titan's Resolve (Vest+Cloak), Warmog's Armor (Belt+Belt), Rapid Firecannon (Bow+Bow), Archangel's Staff (Rod+Tear), Hand of Justice (Gloves+BF), Dragon's Claw (Cloak+Cloak)

### 15.5 Set Items (12 items, 4 element sets)
Crafted at Forge Level 4+ from combined item + elemental essence + 50g.

| Set | Element | 2-piece Bonus | 3-piece Bonus |
|-----|---------|--------------|---------------|
| Inferno | Fire | +20% ATK to fire allies | +burn DPS |
| Tidal | Water | +15% max HP to water allies | +1% HP/s regen |
| Gaia | Earth | +15% DR to earth allies | +150 shield |
| Tempest | Wind | +20% attack speed to wind allies | +10% dodge |

### 15.6 Ability Items (7)
Crafted at Forge Level 5+ from 2 combined items + 100g.

| Item | Craft From | Ability | Evolved Only? |
|------|-----------|---------|--------------|
| Zhonya's Hourglass | Titan's Resolve + Warmog's | Invulnerable 2s at 25% HP (once) | No |
| Guardian Angel | Warmog's + Dragon's Claw | Revive at 30% HP on death (once) | No |
| Rabadon's Deathcap | Archangel's + Infinity Edge | +35% total ATK | No |
| Bloodthirster | BotRK + Hand of Justice | 15% lifesteal | No |
| Primal Fury | Infinity Edge + Rapid Firecannon | On kill: +10% AS (stacks 3×) | Yes |
| Elemental Core | Archangel's + Dragon's Claw | +25% element advantage dmg | Yes |
| Titan's Heart | Warmog's + Titan's Resolve | +20% DR below 50% HP | Yes |

### 15.7 Essence System
4 elemental essences (Fire, Water, Earth, Wind) drop from missions level 8+. Used as catalysts for set item crafting.

Drop rates: 10% at level 8-10, 20% at 11-13, 30% at 14+. 3-star adds +15%. Element biased 70% toward mission's elementBias.

### 15.8 Forge Operations
| Level | Operation | Cost | Input → Output |
|-------|-----------|------|---------------|
| 1 | Reroll Rarity | 10-80g | Component → same component, new rarity |
| 2 | Disassemble | 15g | Combined item → 2 components (original rarities) |
| 3 | Transmute | 25g | Component → different component type (keeps rarity) |
| 4 | Set Craft | 50g | Combined item + Essence → Set item |
| 5 | Advanced Craft | 100g | 2 Combined items → Ability item |

---

## 16. Planned / Unimplemented

These rules are designed but not yet in the game:

- **Mountain Lord Taunt**: Adjacent enemies should be forced to target this unit (targeting override).
- **Mixed Element Units**: Combine units of different elements to create hybrids.
- **Sage Tier 3 Revive**: Ally revive mechanic at 6 Sages (not yet implemented in combat).

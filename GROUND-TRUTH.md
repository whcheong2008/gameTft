# Ground Truth — Consolidated Testable Spec

> **Source of truth for the Unity port.** Every section contains concrete values that a unit test can assert against. If it's not in this document, it doesn't get tested. If the Unity version disagrees with this document, the Unity version has a bug.
>
> **Authority hierarchy**: JS implementation (actual behavior) > Design docs (intent). Where they differ, both are noted and JS is marked as authoritative.

---

## 1. Damage Pipeline

The damage pipeline processes in strict order. All damage flows through `dealDamage()` in `main-v2.js`.

### Step-by-Step Pipeline

**Step 1 — Stasis Check**
- If target has `stasis > 0`, return 0 damage immediately

**Step 2 — Base Damage**
- Auto-attacks: `rawDamage = attacker.attack`
- Abilities: `rawDamage = attacker.attack * abilityMultiplier`

**Step 3 — Element Multiplier**
- `elemMult = getElementMultiplier(attacker.element, target.element)`
- Strong → 1.3×, Weak → 0.7×, Neutral → 1.0×
- If target has `elemResist` and mult > 1.0: `elemMult = 1.0 + (elemMult - 1.0) * (1 - effectiveElemResist)`
- Mystic elemResistShred status reduces effective element resist

**Step 4 — Critical Strike**
- If `forceCrit` flag OR `Math.random() < source.critChance`: `damage *= 1.5`
- Base crit multiplier: 1.5×
- Lightning synergy can add bonus crit damage: `damage *= (1.5 + critDamageBonus)`

**Step 5 — Damage Reduction**
- `totalDR = target.damageReduction + drMod (from status effects)`
- Sorcerer spell penetration: `totalDR *= (1 - spellPenetration)`
- Ranger focused shot: additional DR reduction
- **DR cap: 0.75 (75% maximum)**
- If not true damage and DR > 0: `dmg = floor(dmg * (1 - totalDR))`

**Step 6 — Minimum Damage Floor**
- `damage = max(1, damage)` — always at least 1 damage

**Step 7 — Freeze Vulnerability**
- Frozen targets take +20% damage: `dmg = floor(dmg * 1.2)`

**Step 8 — Vulnerability Status**
- `dmg = floor(dmg * (1 + vulnPct))`

**Step 9 — Ranger Mark Amplification**
- Marked targets take `+markAmp%` damage from all sources

**Step 10 — Dodge Check**
- `totalDodge = max(target.dodgeChance, dodgeBuff from status)`
- If `Math.random() < totalDodge`: damage = 0, trigger "DODGE" visual

**Step 11 — Shield Absorption**
- If target has shield: absorb `min(shield, damage)` from shield
- Shield fully consumed → remainder hits HP
- Guardian shield-break tenacity triggers when shield fully breaks

**Step 12 — Apply to HP**
- `target.hp -= remaining damage`

**Step 13 — Post-Damage Triggers**
- Mana generation on damage taken: `manaFromDmg = max(1, floor((totalDmg / maxHp) * 50))`
- Reflect status: melee attackers take reflect damage back
- On-hit item effects (BotRK %maxHP, fire synergy burn)
- Lifesteal healing
- World Tree trigger check (any ally below 20% HP)
- Death check → Phoenix revive, Guardian Angel, Sage death-save, on-kill effects

### Test Cases

**Standard hit (no crit, neutral element)**:
- Input: ATK=100, multiplier=1.0, target DEF(DR)=0, neutral element
- Expected: `floor(100 * 1.0 * 1.0) = 100` damage

**Strong element hit**:
- Input: ATK=100, fire attacker vs wind target
- Expected: `floor(100 * 1.3) = 130` damage

**Weak element hit**:
- Input: ATK=100, fire attacker vs water target
- Expected: `floor(100 * 0.7) = 70` damage

**Critical hit**:
- Input: ATK=100, neutral element, crit triggers
- Expected: `floor(100 * 1.5) = 150` damage

**Zero DR target**:
- Input: ATK=100, DR=0
- Expected: 100 damage (no reduction)

**High DR target (capped)**:
- Input: ATK=100, DR=0.80 → capped to 0.75
- Expected: `floor(100 * (1 - 0.75)) = 25` damage

**Minimum damage floor**:
- Input: ATK=1, DR=0.75, weak element (0.7×)
- Expected: `max(1, floor(1 * 0.7 * 0.25)) = max(1, 0) = 1` damage

**Frozen target**:
- Input: ATK=100, target frozen
- Expected: `floor(100 * 1.2) = 120` damage

---

## 2. Element System

### Elements (6 total)

| Element | Emoji | Strong Against | Weak Against |
|---------|-------|---------------|-------------|
| Fire 🔥 | 🔥 | Wind | Water |
| Water 💧 | 💧 | Fire | Earth, Lightning |
| Earth 🌿 | 🌿 | Water, Lightning | Wind |
| Wind 💨 | 💨 | Earth | Fire |
| Lightning ⚡ | ⚡ | Water | Earth |
| Force 💪 | 💪 | None | None |

### Element Matchup Table

| Attacker \ Defender | Fire | Water | Earth | Wind | Lightning | Force |
|---------------------|------|-------|-------|------|-----------|-------|
| **Fire** | 1.0 | 0.7 | 1.0 | 1.3 | 1.0 | 1.0 |
| **Water** | 1.3 | 1.0 | 0.7 | 1.0 | 0.7 | 1.0 |
| **Earth** | 1.0 | 1.3 | 1.0 | 0.7 | 1.3 | 1.0 |
| **Wind** | 0.7 | 1.0 | 1.3 | 1.0 | 1.0 | 1.0 |
| **Lightning** | 1.0 | 1.3 | 0.7 | 1.0 | 1.0 | 1.0 |
| **Force** | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 |

**Rule**: Force has no strengths or weaknesses. Water is weak to BOTH Earth and Lightning. Earth is strong against BOTH Water and Lightning.

### Element Synergy Thresholds and Bonuses

All elements use thresholds: **[2, 4, 7, 10]**. Tier 4 (10-piece) is the "Prismatic" tier.

**Fire Synergy**:
| Threshold | Bonus |
|-----------|-------|
| 2 | Attacks apply Burn (10 DPS, 3s) |
| 4 | Burn 20 DPS. On kill, enemy explodes for 15% max HP to adjacent |
| 7 | Burn 35 DPS, 5s. Fire abilities apply Burn. Fire units +20% ATK. Kill explosions chain |
| 10 | Prismatic: Enemies start burning (3% maxHP/s). Ability mana cost -50%. Death explosions 200 AoE. Fire immune to Burn |

**Water Synergy**:
| Threshold | Bonus |
|-----------|-------|
| 2 | Enemy attack speed -15% |
| 4 | Enemy ATK speed -25%. Allies heal 1.5% max HP/s |
| 7 | Enemy ATK speed -40%. Heal 3%/s. Enemies below 40% HP deal -20% damage |
| 10 | Prismatic: Permanent 35% slow. Water abilities heal 20% of damage dealt. Enemies below 25% HP frozen 2s (once) |

**Earth Synergy**:
| Threshold | Bonus |
|-----------|-------|
| 2 | Shield: 15% max HP at combat start |
| 4 | Shield 25% max HP. +8% DR |
| 7 | Shield 40% max HP. +15% DR. Shields regen 3%/s when not hit |
| 10 | Prismatic: Shield 60% max HP. +25% DR. Shield regen 5%/s always. Root random enemy every 8s for 3s. Earth units can't be crit |

**Wind Synergy**:
| Threshold | Bonus |
|-----------|-------|
| 2 | +15% attack speed |
| 4 | +25% ATK speed. +12% dodge |
| 7 | +40% ATK speed. +25% dodge. Dodge grants 10 mana + 40% ATK counter |
| 10 | Prismatic: +60% ATK speed. +40% dodge. 40% chance abilities cast twice. Dodge counter grants 15 mana + 80% ATK |

**Lightning Synergy**:
| Threshold | Bonus |
|-----------|-------|
| 2 | +10% crit chance. Crits chain 50 damage to 1 adjacent |
| 4 | +18% crit. +15% crit damage. Chains hit 2 |
| 7 | +30% crit. +30% crit damage. Chains hit 3. Abilities can crit (15%) |
| 10 | Prismatic: +50% crit. +60% crit damage. Abilities chain to 2 at 50%. On crit, 120 lightning AoE within 2 cells |

**Force Synergy**:
| Threshold | Bonus |
|-----------|-------|
| 2 | +10% ATK, +10% HP |
| 4 | +18% ATK, +18% HP. Ignore 10% DR |
| 7 | +30% ATK, +30% HP. Ignore 20% DR. First CC immune per combat |
| 10 | Prismatic: +50% ATK, +50% HP. Ignore 40% DR. CC immune 6s. Revive once at 30% HP |

**Note**: Evolved T5 units count as 2 for element synergy purposes.

---

## 3. Archetype System

### Archetypes (9 total)

All archetypes use thresholds: **[2, 4, 6, 8]**.

| Archetype | Role | Thresholds |
|-----------|------|------------|
| Guardian | Tank/protection | 2/4/6/8 |
| Warden | CC control | 2/4/6/8 |
| Vanguard | Front-row fighter | 2/4/6/8 |
| Duelist | Sustained melee DPS | 2/4/6/8 |
| Predator | Assassin/execute | 2/4/6/8 |
| Ranger | Ranged DPS | 2/4/6/8 |
| Sorcerer | Ability damage | 2/4/6/8 |
| Mystic | Elemental specialist | 2/4/6/8 |
| Sage | Healing/support | 2/4/6/8 |

### Archetype Synergy Bonuses

**Guardian**: +250/550/900/1300 HP, +5/10/15/20% DR, shield at T2+, shield-break tenacity at T3, last-stand invulnerability at T4

**Warden**: CC duration +20/35/50/65%, tenacity +15/30/45/60%, first CC immune (T3), full CC immune (T4)

**Vanguard**: +200/400/650/950 HP, +20/35/55/80 ATK (×2 in front row), charge stun (T2+), lifesteal (T3+), slow immune (T4)

**Duelist**: Double-strike 15/30/40/55% chance, lifesteal (T2+), can't miss (T3), guaranteed crit every 3rd attack (T4)

**Predator**: ATK speed +25/40/55/70%, execute +15/25/35/50% to targets below 50/50/50/60% HP, dash reset on kill (T2+), on-kill ATK buff (T3+)

**Ranger**: +1/1/2/3 range, furthest target damage +15/25/35/50%, pierce (T2+), focused shot (T3+), target mark amp (T4)

**Sorcerer**: Ability damage +15/30/50/75%, starting mana +10/20/30/40, mana refund (T2+), spell penetration (T3+), first cast double damage (T4)

**Mystic**: Element resist +20/35/50/65%, status duration +20/35/50/65%, resist shred (T2+), ability damage per unique element (T3+)

**Sage**: Heal bonus +35/70/110/160%, heal-shield (T2+), passive mana (T3+), overheal-to-shield (T3+), death-save once per combat (T4)

### Archetype Counting Rules
- **Primary archetype**: Always counts (1 unit = 1 count)
- **Secondary archetype**: Only counts if unit is ascended (Awakened/Exalted/Transcendent)
- **Transcendent units**: Primary archetype counts as 2
- **Only board units count** — bench units do not contribute

---

## 4. Unit Stats

### Star-Up System

**Formula**: `stat = floor(baseStat * pow(1.8, stars - 1))`

| Stars | Multiplier |
|-------|-----------|
| 1★ | 1.00× |
| 2★ | 1.80× |
| 3★ | 3.24× |
| 4★ | 5.83× |
| 5★ | 10.50× |

**Only HP and ATK scale with stars.** Attack speed, range, and move speed are NOT affected.

### Tiered Star-Up Copy Costs (JS source of truth)

| Unit Cost Tier | Copies per Star | Total to 3★ (Evolve) |
|---------------|----------------|---------------------|
| T1 (Cost 1) | 3 | 9 (3+3+3) |
| T2 (Cost 2) | 4 | 12 |
| T3 (Cost 3) | 5 | 15 |
| T4 (Cost 4) | 8 | 24 |
| T5 (Cost 5) | 10 | 30 |

> **Discrepancy note**: Some UI code still references 10 copies per star for all tiers. The `getCopiesPerStar()` function is authoritative.

### Unit Level System

- **Level cap**: 30
- **Level bonus**: `1 + (level - 1) * 0.02` — +2% per level above 1
- **XP to next level**: `floor(100 * pow(1.12, level - 1))`
- **Final stat formula**: `floor(baseHP * starMult * levelBonus * (1 + ascensionBonus))`

### Ascension Tiers

| Tier | Unit Level Req | Stars Req | VE Cost | Essences | Stat Bonus (cumulative) |
|------|---------------|-----------|---------|----------|------------------------|
| Awakened | 15 | 3★ | 500 | 5 | +10% all stats |
| Exalted | 25 | — | 2,000 | 10 | +30% all stats |
| Transcendent | 30 | — | 5,000 | 20 | +65% all stats |

**Awakened**: Unlocks secondary archetype counting.
**Transcendent**: Primary archetype counts as 2.

### Sample Unit Stats (Base, 1★)

**Fire units**:
| Unit | Cost | Type | Archetype | Secondary | HP | ATK | AtkSpd | Range | MoveSpd | MaxMana |
|------|------|------|-----------|-----------|-----|-----|--------|-------|---------|---------|
| Flame Warrior | 1 | Warrior | Duelist | Vanguard | 600 | 50 | 0.85 | 1 | 1.9 | 65 |
| Ember Scout | 1 | Assassin | Predator | Duelist | 390 | 46 | 0.50 | 1 | 3.9 | 45 |
| Magma Knight | 2 | Tank | Guardian | Warden | 880 | 35 | 1.0 | 1 | 1.5 | 85 |

**Water units**:
| Unit | Cost | Type | Archetype | Secondary | HP | ATK | AtkSpd | Range | MoveSpd | MaxMana |
|------|------|------|-----------|-----------|-----|-----|--------|-------|---------|---------|
| Tide Hunter | 1 | Warrior | Vanguard | — | 580 | 48 | 0.8 | 1 | 2.0 | — |
| Frost Archer | 1 | Archer | Ranger | — | 380 | 52 | 0.7 | 3 | 2.0 | — |

**Earth units**:
| Unit | Cost | Type | Archetype | Secondary | HP | ATK | AtkSpd | Range | MoveSpd | MaxMana |
|------|------|------|-----------|-----------|-----|-----|--------|-------|---------|---------|
| Stone Guard | 1 | Tank | Guardian | — | 750 | 30 | 1.0 | 1 | 1.5 | — |

**Wind units**:
| Unit | Cost | Type | Archetype | Secondary | HP | ATK | AtkSpd | Range | MoveSpd | MaxMana |
|------|------|------|-----------|-----------|-----|-----|--------|-------|---------|---------|
| Zephyr Scout | 1 | Assassin | Predator | — | 400 | 42 | 0.45 | 1 | 4.0 | — |

### Unit Count: 66 base units + 66 evolved forms = 132 total

11 base units per element × 6 elements = 66 base units. Each has an evolved form.

### Echo Release (Sell) Values

| Unit Tier | VE per Copy |
|-----------|------------|
| T1 | 5 |
| T2 | 10 |
| T3 | 20 |
| T4 | 50 |
| T5 | 100 |

---

## 5. Abilities

### Mana System

| Stat | Default | Notes |
|------|---------|-------|
| Starting mana | 0 | Modified by items, synergies, Mana Shrine |
| Max mana | Per-unit (40–120) | Defined in template |
| Mana gain per auto-attack | 10 | Flat, modified by Mana Shrine (+10% at L2) |
| Mana gain on damage taken | `max(1, floor((dmg / maxHP) * 50))` | Scales with %HP lost |
| Cast time | 0.3s | Brief pause before ability resolves |
| Mana after cast | Reset to 0 | Then auto-attack cooldown resets |

### Ability Casting Flow

1. Mana reaches `maxMana`
2. Unit pauses auto-attack for 0.3s (cast time)
3. Ability resolves (targeting based on ability's `targetType`)
4. Mana resets to 0
5. Auto-attack cooldown resets

### Mana During Silence

- Mana generation continues normally
- Mana caps at maxMana (doesn't overflow)
- When silence expires, if mana is at max, ability casts immediately on next action

### T5 Units (Legendary Passives)

T5 units have `maxMana = 0` and use the `legendaryState` passive system instead. Their passives trigger on specific conditions (death, ally HP threshold) rather than mana accumulation.

### Sample Abilities

**Flame Warrior — Flame Slash (65 mana)**:
- Deal 150% ATK to current target
- Apply Burn (20 DPS) for 3s

**Ember Scout — Shadow Strike (45 mana)**:
- Teleport to furthest enemy
- Deal 200% ATK
- Gain 50% dodge for 1.5s

**Stone Guard — Stone Wall (80 mana)**:
- Gain shield equal to 30% max HP
- Taunt enemies within 2 cells for 3s

---

## 6. Passive System

### Evolved Unit Passives (from MECHANICS.md — JS authoritative)

| Evolved Unit | Ability | Trigger |
|-------------|---------|---------|
| Volcano Titan | AoE on death | On death: 200 damage to all enemies within distance 2 |
| Inferno Mage | Splash damage | Each attack deals 30% damage to enemies within 1.5 of target |
| Tsunami Blade | Slow | Each attack reduces target moveSpd by 5% (stacking) |
| Ice Sniper | Freeze | Every 3rd attack adds +0.5s to target attack cooldown |
| Ocean Sage | Heal + Shield | Heals also grant 50 shield |
| Abyssal Mage | Tank buster | +25% damage vs Tank-type units |
| Thorn Ranger | Reflect | Attackers who hit take 15 damage |
| Gaia Priest | AoE heal | Heals 2 lowest-HP allies per attack |
| Titan | Earthquake | Every 4th attack adds +0.5s cooldown to all enemies within 1.5 |
| Storm Assassin | Chain lightning | On kill: deal 50 damage to nearest alive enemy |
| Gale Sniper | Armor pierce | Target DR multiplied by 0.8 (ignores 20%) |
| Tempest Wizard | Bounce | Each attack deals 50% damage to one additional enemy |
| Aegis Paladin | Shield aura | Combat start: +100 shield to ALL allies |

### Legendary Passives

| Unit | Ability | Implementation |
|------|---------|---------------|
| Phoenix | Revive | On first death: restore 50% maxHP after 2s stasis. Once per combat. |
| World Tree | Mass heal | When any ally drops below 20% HP: heal ALL allies for 30% max HP + cleanse. Once per combat. |

### Passive Reentry Guard

The combat system prevents infinite loops by tracking passive triggers. On-death effects resolve fully before next combat tick. Conditional passives (World Tree) are marked as "used" after firing once.

---

## 7. Status Effects

### Crowd Control (CC)

| Status | Attack? | Move? | Cast? | Notes |
|--------|---------|-------|-------|-------|
| Stun | No | No | No | Full disable |
| Freeze | No | No | No | +20% damage taken |
| Root | Yes | No | Yes | Movement lockout only |
| Silence | Yes | Yes | No | Mana still generates |
| Blind | Yes (50% miss) | Yes | Yes | 50% miss chance on autos |
| Taunt | Forced target | Toward taunter | Yes | Override targeting |

### Damage Over Time (DoT)

| Status | Stacking | Tick Rate | Healing Reduction |
|--------|----------|-----------|-------------------|
| Burn | Up to 3 (DPS stacks, duration refreshes) | Once per second | -25% |
| Poison | Up to 3 (DPS stacks, duration refreshes) | Once per second | -50% |
| Bleed | Up to 3 | Once per second | None |

**DoT is true damage** (not reduced by DR).
**Healing reduction** from multiple sources is **additive**, capped at **90%** total.
**Burn + Poison** stacks: 25% + 50% = 75% healing reduction.

### Buffs

| Status | Stacking |
|--------|----------|
| Shield | Additive (multiple shields stack) |
| ATK Up/Down | Additive within tier, multiplicative between tiers |
| DR Up/Down | Same |
| Dodge | Highest value wins (doesn't stack) |

### CC Diminishing Returns

- **Window**: 8 seconds
- **1st CC**: Full duration
- **2nd CC within 8s**: 50% duration
- **3rd+ CC within 8s**: 25% duration
- **Minimum CC duration**: 0.25s

### Tenacity

- Reduces CC duration: `duration *= (1 - min(tenacity, 0.6))`
- **Tenacity cap**: 60%

### CC Immunity

- After being stunned/frozen: immune to stun/freeze for `duration + 1.0s`
- Warden synergy can grant broader CC immunity

### Test Cases

**CC diminishing returns**:
- Input: Unit stunned for 2s, then stunned again 3s later (within 8s window)
- Expected: Second stun = 2s × 0.5 = 1.0s

**Tenacity reduction**:
- Input: 2s stun, target has 30% tenacity
- Expected: `2.0 * (1 - 0.30) = 1.4s`

**Tenacity cap**:
- Input: 2s stun, target has 80% tenacity
- Expected: `2.0 * (1 - 0.60) = 0.8s` (capped at 60%)

---

## 8. Grid and Movement

### Grid Dimensions

- **Total combat grid**: 8 rows × 7 columns
- **Player board**: Rows 4–7 (mapped from deployment grid rows 0–3)
- **Enemy board**: Rows 0–3
- **Deployment grid**: 4 rows × 7 columns per side

### Coordinate Mapping

- Player units: `combatY = boardRow + 4`, `combatX = boardCol`
- Enemy units: `combatY = 3 - boardRow`, `combatX = boardCol`

### Distance Calculation

**Manhattan distance**: `|r1-r2| + |c1-c2|`

> **Discrepancy**: COMBAT-DESIGN.md specifies Chebyshev distance. JS implementation uses Manhattan distance. **JS is authoritative.**

### Movement Rules

- Units move toward targets at `moveSpd` cells per second
- Movement is continuous (sub-cell positions)
- `moveCooldown = 1.0 / effectiveMoveSpd`
- Slow status reduces effective move speed
- **Root**: Cannot move, CAN attack if target is in range
- **Stun/Freeze**: Skip entire turn (no movement or attacks)

### Pathfinding

- **Algorithm**: BFS on 4-directional grid (no diagonal movement)
- Occupied cells are impassable

### Attack Ranges by Type

Melee units: range 1 (must be adjacent)
Ranged units: range 2–5 depending on unit template
Attack range check: `distance <= range + 0.3` (small buffer)

### Assassin Dash

At combat start, assassin-type units dash to enemy backline (rows 0–1 for attacking player-side enemies). Implementation in `initCombat()` marks assassins for initial repositioning.

---

## 9. Boss Framework

### Boss Properties

- **Grid size**: Variable `bossSize = [rows, cols]`, typically 2×2
- **Enrage timer**: 180s for boss fights (vs 60s for normal fights)
- **Phase transitions**: HP threshold-based
- **Invulnerability windows**: Brief during transitions

### Boss Detection

Combat state checks `isBoss` flag on enemy units. Boss unit stored in `combatState.bossUnit`.

### Region Bosses (8 total)

| Boss | Region | Key Mechanic |
|------|--------|-------------|
| Veil Warden | R1 | Telegraphed AoE, single phase |
| The Archon | R2 | Stance shifting (Guardian/Predator/Sorcerer) |
| Twin Heralds | R3 | Two 1×2 bosses, proximity buff, kill-order puzzle |
| Shattered Colossus | R4 | 3 phases with encounter mechanics |
| Elemental Chimera | R5 | Element shifting + absorption |
| Prismatic Sentinel | R6 | Rotating element immunity/vulnerability |
| Arbiter of Trials | R7 | Mid-fight constraint imposition |
| Void Sovereign | R8 | Unit copying, board shrink, DPS race |

### Combat Time Limits

| Fight Type | Time Limit | On Timeout |
|-----------|-----------|-----------|
| Normal combat | 60s | Draw |
| Boss fight | 180s | Draw |

---

## 10. Gacha System

### Roll Costs

| Action | Cost (VE) |
|--------|-----------|
| Single roll | 50 VE |
| 10-pull | 450 VE (10% discount base) |
| Shop refresh | 20 VE |
| Buy from shop (T1) | 30 VE |
| Buy from shop (T2) | 60 VE |
| Buy from shop (T3) | 120 VE |
| Buy from shop (T4) | 240 VE |
| Buy from shop (T5) | 500 VE |

### Tier Weight Table (by Player Level)

| Level | T1% | T2% | T3% | T4% | T5% |
|-------|-----|-----|-----|-----|-----|
| 1–2 | 75 | 25 | 0 | 0 | 0 |
| 3–4 | 60 | 35 | 5 | 0 | 0 |
| 5–6 | 45 | 38 | 17 | 0 | 0 |
| 7–8 | 35 | 33 | 32 | 0 | 0 |
| 9–10 | 28 | 28 | 38 | 6 | 0 |
| 11–12 | 22 | 25 | 40 | 13 | 0 |
| 13–14 | 18 | 22 | 38 | 22 | 0 |
| 15–16 | 15 | 18 | 35 | 30 | 2 |
| 17–18 | 12 | 15 | 30 | 37 | 6 |
| 19 | 10 | 12 | 25 | 43 | 10 |
| 20 | 8 | 10 | 22 | 50 | 10 |

**T5 first appears at level 15 (2%), caps at 10% at level 19–20.**

### Pity System

- **Base pity**: Every 50 rolls without a T5 → guaranteed T5 unit
- **Attunement Rite L4**: Every 20 rolls → guaranteed T3+
- **Attunement Rite L5**: Every 30 rolls → guaranteed T4+
- **Pity counter** (`rollsSincePity`) increments on every roll, resets on pity trigger

### Evolved Copy Mechanic

When rolling, if the base unit has an evolution AND the player owns the evolved form:
- 15% chance the rolled copy becomes an evolved copy instead

### Test Cases

**10,000 pulls at level 1**:
- Expected T1: ~75% (7,500 ± tolerance)
- Expected T2: ~25% (2,500 ± tolerance)
- Expected T3/T4/T5: 0

**Pity counter increments**:
- Input: Roll 49 units, none T5
- Expected: `rollsSincePity = 49`, no pity triggered

**Pity resets after trigger**:
- Input: Roll 50 units without T5 (base pity)
- Expected: 50th roll guaranteed T5, `rollsSincePity` resets to 0

**Level 15 T5 appearance**:
- Input: Roll at level 15
- Expected: T5 units appear in pool at 2% weight

---

## 11. Hero System

### Hero Roster (6 heroes)

| # | Name | Philosophy | Acquired | Lost |
|---|------|-----------|----------|------|
| 1 | Kael | Protection | R1 (Start) | Never |
| 2 | Lyric | Efficiency | R1 (Start) | Dies R4 mid |
| 3 | Ren | Steadfast | R2 | Never |
| 4 | Sera | Precision | R3 | Leaves R4, returns R5 late |
| 5 | Maren | Sustain | R3 | Leaves R4, returns R5 early |
| 6 | Voss | Momentum | R7 | Never |

### Hero Mechanics

- **Level cap**: 20
- **Skill points**: 1 per level = 20 total
- **Skill tree**: 2 branches per hero, 5 tiers per branch, 2 choices per tier
- **XP rate**: ~1.5× unit XP rate
- **Respec cost**: 500 VE first time, +500 each subsequent
- **Only hero-equipped units can equip items**

### Skill Tree Tier Costs

| Tier | Level Req | Cost per Node |
|------|-----------|--------------|
| T1 | L1 | 1 pt |
| T2 | L5 | 1 pt |
| T3 | L9 | 2 pt |
| T4 | L13 | 4 pt |
| T5 | L17 | 5 pt (capstone) |

**Budget math**: Min full branch = 1+1+2+4+5 = 13 pts. Both capstones = 26 pts > 20 → impossible. Forces meaningful choices.

### Hero Availability Timeline

| Region | Available Heroes | Count |
|--------|-----------------|-------|
| R1 | Kael, Lyric | 2 |
| R2 | + Ren | 3 |
| R3 | + Sera, Maren | 5 |
| R4 early | All 5 | 5 |
| R4 mid | Lyric dies, Sera & Maren leave | 2 (Kael + Ren) |
| R5 early | + Maren | 3 |
| R5 late | + Sera | 4 |
| R7 | + Voss | 5 |
| R8 | 5 heroes for 8 team slots | 5 |

### Lyric's Death

- Hero object removed from active roster
- Skill investment preserved in save data
- Unit loses ALL hero bonuses AND cannot equip items
- **No fragment system** — Lyric's death is permanent

---

## 12. Item System

### Equipment Slots (8 per hero-equipped unit)

| Slot | Primary Stats |
|------|--------------|
| Weapon | ATK, Crit, ATK Speed |
| Helm | HP, DR |
| Chest Armor | HP, DR |
| Gauntlets | ATK, Crit, ATK Speed |
| Boots | ATK Speed, Tenacity, Start Mana |
| Shield / Off-hand | HP, DR, Shield, Heal Power |
| Accessory 1 | Any stat |
| Accessory 2 | Any stat |

### Two-Axis Loot System

**Axis 1 — Tier** (region-gated):
| Tier | Stat Multiplier |
|------|----------------|
| T1 | 1.0× |
| T2 | 1.5× |
| T3 | 2.17× |
| T4 | 3.0× |
| T5 | 4.0× |

**Axis 2 — Rarity** (RNG per drop):
| Rarity | Stat Mult | Bonus Affixes | Passive |
|--------|----------|---------------|---------|
| Common | 1.0× | 0 | None |
| Uncommon | 1.2× | 1 | None |
| Rare | 1.5× | 2 | None |
| Epic | 1.8× | 2 | Minor |
| Legendary | 2.2× | 3 | Major |

**Combined formula**: `baseStat × tierMult × rarityMult`

**Rarity drop weights** (base): Common 50%, Uncommon 30%, Rare 13%, Epic 5.5%, Legendary 1.5%

### Enhancement System

| Level | Stat Bonus | Gold Cost | Success Rate | On Failure |
|-------|-----------|-----------|-------------|-----------|
| +1 | +5% | 20 | 100% | — |
| +2 | +10% | 30 | 100% | — |
| +3 | +15% | 50 | 100% | — |
| +4 | +22% | 80 | 90% | Stay |
| +5 | +30% | 120 | 80% | Stay |
| +6 | +40% | 180 | 70% | Drop to +5 |
| +7 | +52% | 250 | 55% | Drop to +5 |
| +8 | +66% | 350 | 40% | Drop to +6 |
| +9 | +82% | 500 | 25% | Drop to +7 |
| +10 | +100% | 750 | 15% | Drop to +8 |

**Pity**: 3 consecutive failures at same level → guaranteed success. Resets on success.

### Gem System (9 gem types)

| Gem | Stat | Drop Level |
|-----|------|-----------|
| Ruby | +100 HP | 5+ |
| Sapphire | +8 ATK | 5+ |
| Emerald | +5% DR | 8+ |
| Topaz | -0.05s AtkSpd | 8+ |
| Diamond | +8% Crit | 10+ |
| Amethyst | +10 Start Mana | 10+ |
| Opal | +10% Heal Power | 12+ |
| Onyx | +10% Tenacity | 12+ |
| Prismatic | +50 HP, +5 ATK, +3% Crit | Boss only (5%) |

**Socket count**: Common/Uncommon 0, Rare/Epic 1, Legendary/Mythic 2
**Gem combining**: 3 same type+rarity → 1 next rarity (15g)
**Gem rarity scaling**: Standard 1.0×, Uncommon 1.25×, Rare 1.5×, Epic 2.0×

---

## 13. Economy / Progression

### Currency: Veil Essence (VE)

- **Starting VE**: 500
- **No premium currency** — single-player, play at your own pace
- **No stamina system** — play as much as you want

### VE Income Per Stage (by Region)

| Region | VE per Stage | Boss VE |
|--------|-------------|---------|
| R1 | 200 | 500 |
| R2 | 350 | 700 |
| R3 | 550 | 1,100 |
| R4 | 750 | 1,500 |
| R5 | 1,000 | 2,000 |
| R6 | 1,300 | 2,600 |
| R7 | 1,600 | 3,200 |
| R8 | 2,000 | 4,000 |

**Total VE from full campaign (74 stages)**: ~71,650 VE

### XP Per Stage (by Region)

| Region | Base XP | At-level Range |
|--------|---------|---------------|
| R1 | 80 | L1-3 |
| R2 | 130 | L3-6 |
| R3 | 200 | L6-9 |
| R4 | 280 | L9-12 |
| R5 | 380 | L12-15 |
| R6 | 500 | L15-17 |
| R7 | 650 | L17-19 |
| R8 | 800 | L19-20 |

### Player Level XP Curve

| Level | Cumulative XP | XP for This Level |
|-------|---------------|-------------------|
| 1 | 0 | — |
| 2 | 360 | 360 |
| 3 | 720 | 360 |
| 4 | 1,110 | 390 |
| 5 | 1,500 | 390 |
| 6 | 1,890 | 390 |
| 7 | 2,490 | 600 |
| 8 | 3,090 | 600 |
| 9 | 3,690 | 600 |
| 10 | 4,530 | 840 |
| 11 | 5,370 | 840 |
| 12 | 6,210 | 840 |
| 13 | 7,476 | 1,266 |
| 14 | 8,743 | 1,267 |
| 15 | 10,010 | 1,267 |
| 16 | 12,510 | 2,500 |
| 17 | 15,010 | 2,500 |
| 18 | 18,260 | 3,250 |
| 19 | 21,510 | 3,250 |
| 20 | 27,910 | 6,400 |

**Total raw XP from straight playthrough**: 27,910 (hits L20 at R8 end)

### Hard Level Caps per Region

| Region | Hard Cap |
|--------|---------|
| R1 | 4 |
| R2 | 7 |
| R3 | 10 |
| R4 | 13 |
| R5 | 16 |
| R6 | 18 |
| R7-R8 | 20 (no cap) |

### XP Diminishing Returns (Overleveled)

| Player Level vs Stage Range | XP Multiplier |
|----------------------------|---------------|
| At-level or below | 100% |
| 1-2 levels above | 75% |
| 3-4 levels above | 50% |
| 5+ levels above | 25% |

### Team Size Progression

| Level | Team Size | Expected Region |
|-------|-----------|----------------|
| 1 | 3 | R1 |
| 4 | 4 | R2 |
| 8 | 5 | R3 |
| 12 | 6 | R5 |
| 16 | 7 | R6 |
| 17 + Sustained Bonds upgrade | 8 | R7 |

### VE Costs Summary

| Action | Cost (VE) |
|--------|-----------|
| Single roll | 50 |
| 10-pull | 450 |
| Camp practice upgrades | 200–15,000 |
| Enhancement | 50–500 per level |
| Deep Resonance (evolution) | 500–2,000 |
| Echo Shaping: reroll | 100 |
| Echo Shaping: disassemble | 50 |
| Echo Shaping: transmute | 200 |
| Echo Shaping: set craft | 500–1,000 |
| Echo Shaping: ability craft | 1,000–2,000 |
| Ascension (Awakened) | 500 |
| Ascension (Exalted) | 2,000 |
| Ascension (Transcendent) | 5,000 |
| Hero respec | 500 first, +500 each |

---

## 14. Stage / Mission Data

### Stage Count: 74 total across 8 regions

| Region | Stages | Structure |
|--------|--------|-----------|
| R1 | 9 | 8 + 1 boss |
| R2 | 9 | 8 + 1 boss |
| R3 | 9 | 8 + 1 boss |
| R4 | 9 | 8 + 1 boss |
| R5 | 10 | 9 + 1 boss |
| R6 | 10 | 9 + 1 boss |
| R7 | 10 | 9 + 1 boss |
| R8 | 8 | 7 + 1 boss |

### Mission Unit Drop Tier Weights (by Region)

| Region | T1 | T2 | T3 | T4 | T5 |
|--------|-----|-----|-----|-----|-----|
| R1 | 70% | 30% | — | — | — |
| R2 | 50% | 40% | 10% | — | — |
| R3 | 30% | 35% | 35% | — | — |
| R4 | 15% | 25% | 45% | 15% | — |
| R5 | 5% | 15% | 40% | 35% | 5% |
| R6 | 5% | 10% | 30% | 40% | 15% |
| R7 | — | 5% | 20% | 45% | 30% |
| R8 | — | — | 15% | 45% | 40% |

### Unit Drops Per Stage

| Region | Drops/Stage |
|--------|-----------|
| R1–R3 | 2 |
| R4–R7 | 3 |
| R8 | 4 |

### Wave Generation

Each wave specifies:
- `budget`: Total unit cost the wave can spend
- `maxCost`: Maximum cost tier of any single enemy
- `count`: Number of enemies
- Optional: `elementBias`, `synergyBias`, `enemySynergies`, `enemyEvolutions`

### Lock System

Locks are minimum count requirements on the player's team:
- `{ type: 'archetype', value: 'guardian', count: 2 }` — at least 2 Guardian units
- `{ type: 'archetype_or', value: ['sorcerer', 'mystic'], count: 2 }` — 2 of either
- `{ type: 'element_count', count: 4 }` — units from at least 4 different elements

---

## 15. Save System

### Save Format

- **Storage**: `localStorage` with key `autobattler_v2_save`
- **Current version**: 12 (`SAVE_VERSION = 12`)
- **Auto-save**: Triggers after every state change (rolls, purchases, mission complete)

### Top-Level Save Structure

```
{
    version: 12,
    player: { level, xp, veilEssence, name },
    collection: { [templateKey]: { count, stars, copiesForNext } },
    teams: [{ name, slots: [{ key, row, col }] }],
    activeTeamIndex: 0,
    buildings: { [buildingId]: level },
    missions: { storyProgress, storyStars, regionProgress, starRatings },
    equipment: { inventory, gems, materials, mythicMaterials, essences, codex },
    heroes: { data: { [heroKey]: { level, xp, assignedUnit, investedNodes, isDead } } },
    achievements: { earned, claimed },
    stats: { totalRolls, rollsSincePity, ... },
    lastSaved: ISO timestamp
}
```

### Migration Chain

Save migration runs automatically when `data.version < SAVE_VERSION`. Each version adds:
- v1→v2: Basic structure
- v3: Building system
- v4: 60-unit roster support
- v5: 66-unit roster (12 T4 units)
- v6: Region-based missions (74 stages)
- v7: Hero system
- v8: Equipment system (replaces old items)
- v9–12: Incremental fixes, achievement system, stat tracking

### Buildings (8 camp practices)

| Building ID | Max Level | Upgrade Costs (VE, by level) |
|------------|-----------|------------------------------|
| sustained_bonds | 1 | [0, 500] (req: L17) |
| attunement_rite | 5 | [0, 80, 200, 400, 800, 1500] |
| essence_reservoir | 5 | [0, 50, 120, 300, 600, 1000] |
| deep_resonance | 3 | [0, 300, 800, 2000] |
| echo_shaping | 5 | [0, 200, 500, 1000, 2000, 4000] |
| prism_focus | 5 | [0, 500, 1200, 2500, 5000, 10000] (req: L12) |
| veil_wellspring | 5 | [0, 800, 2000, 4000, 8000, 15000] (req: L15) |
| kindred_circle | 5 | [0, 600, 1500, 3500, 7000, 12000] (req: L10) |

### What Triggers Auto-Save

- Unit rolled/purchased
- Star-up performed
- Team composition changed
- Building upgraded
- Mission completed
- Item equipped/unequipped
- Hero assigned/respecced
- Equipment enhanced/crafted

### What Is Stored vs Computed

**Stored**: Unit copies, stars, hero assignments, building levels, mission progress, equipment inventory, achievements
**Computed at runtime**: Synergy bonuses, combat stats, element matchups, unit power ratings, team synergy display

---

## Discrepancies: Design Docs vs JS Implementation

| System | Design Doc Says | JS Implementation (Authoritative) |
|--------|----------------|----------------------------------|
| Elements | 4 elements (Fire/Water/Earth/Wind) | **6 elements** (Fire/Water/Earth/Wind/Lightning/Force) |
| Grid distance | Chebyshev (COMBAT-DESIGN.md) | **Manhattan** distance |
| Archetypes | 6 (Guardian/Striker/Predator/Mystic/Vanguard/Sage) | **9** (Guardian/Warden/Vanguard/Duelist/Predator/Ranger/Sorcerer/Mystic/Sage) |
| Element matchup | Fire>Wind>Earth>Water>Fire simple cycle | **Expanded**: Earth & Lightning strong vs Water; Water weak to Earth & Lightning |
| Unit count | 22 base + 16 evolved = 38 | **66 base + 66 evolved = 132** |
| Star-up cost | 10 copies per star (all tiers) | **Tiered**: T1=3, T2=4, T3=5, T4=8, T5=10 |
| Heroes | 8 heroes (A, B, Kael, Lyra, Maren, Dax, Sera, Voss) | **6 heroes** (Kael, Lyric, Ren, Sera, Maren, Voss) |
| Currency | Gold / Gems / Stamina | **Veil Essence only** (single-player, no stamina) |
| Element synergy thresholds | 2/4/6 | **2/4/7/10** |
| Archetype synergy thresholds | 2/4/6 | **2/4/6/8** |
| Element damage mult | Strong 1.3× / Weak 0.7× | Same (**confirmed in JS**) |
| Crit multiplier | 1.5× | Same (**confirmed in JS**) |
| DR cap | Not specified in docs | **0.75 (75%)** in JS |
| Combat timeout | 90s (COMBAT-DESIGN) | **60s normal, 180s boss** in JS |

> **Rule**: When porting to Unity, always use the JS implementation values. Design docs represent earlier design intent that was superseded by implementation.

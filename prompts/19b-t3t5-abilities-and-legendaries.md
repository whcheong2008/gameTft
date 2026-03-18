# Phase 2, Chunk 3b: T3-T5 Abilities & Legendaries
**TFT Auto-Battler Game Implementation Prompt**

## Overview
This chunk implements the complete ability and passive system for Tier 3 through Tier 5 units, including evolved forms. It follows immediately after prompt 19a (T1-T2 units) and uses the same architecture. Total scope: 48 base + evolved abilities (T3-T5: 24 base + 24 evolved) + 48 passives (T3-T5: 24 base + 24 evolved) + 6 T5 legendary ability system.

**Key architectural difference**: T5 units have `maxMana = 0` and do NOT use the mana-based ability system. Instead, they execute "legendary abilities" as secondary passives via periodic or conditional triggers.

All changes go into `main-v2.js`. Code uses `var`, global scope, NO ES modules, NO `let`/`const`/arrow functions.

---

## Part 1: T3 Base Units (12 Abilities + 12 Passives)

### Unit 1: Pyromancer (T3 Mage, Fire, Sorcerer)
**Stats**: HP 80, ATK 12, AS 0.7, Range 4, Mana 80

**Passive "Pyromaniac"** (trigger: `on_attack`)
- Effect: Burn effects on targets hit by Pyromancer last 50% longer and deal 20% more DPS
- Implementation:
  - Track `unit.hasPassive.Pyromaniac = true`
  - In the `on_attack` passive processing:
    - Get all burn status effects on the target unit
    - For each burn: multiply remaining duration by 1.5, multiply DPS by 1.2
    - Only apply if Pyromancer is the attacker
  - No stack limit, but duration multiplier applies once per attack

**Ability "Infernal Storm"** (Mana 80)
- Effect: Cast storm at location dealing 200% ATK over 3 seconds to all enemies in area (2-cell radius). Apply Burn (25 DPS, 4s)
- Implementation:
  - Requires target cell selection (use `findRandomEnemyCell()` or highest enemy density)
  - Flash ability effect at target cell (orange AoE indicator)
  - Iterate over all units in 2-cell radius
  - Deal 200% ATK to each over 3s (damage per tick = total / ticks)
  - Apply Burn status with DPS 25 and duration 4s
  - Duration: 3 seconds of continuous damage
  - If Pyromancer has Pyromaniac passive, burnable units affected take 20% more DPS and burn lasts longer (applied retroactively if possible, or let next burn stack apply the bonus)

---

### Unit 2: Inferno Fox (T3 Assassin, Fire, Mystic)
**Stats**: HP 65, ATK 15, AS 1.0, Range 2, Mana 60

**Passive "Foxfire"** (trigger: `periodic` every 0.3s while moving)
- Effect: Leave fire trail when moving. Trail lasts 2.5s, deals 18 DPS to enemies on it
- Implementation:
  - Track `unit.legendaryState.foxfireTrail = []` (array of trail tiles)
  - Every 0.3s of movement, add current cell to trail (if not already at that cell)
  - Each trail tile: countdown timer, deal 18 DPS/sec to enemies on that cell
  - Remove trail tiles after 2.5s
  - If Inferno Fox stands still, stop adding to trail (but existing trail persists)
  - Cap trail length at 12 tiles to prevent memory issues

**Ability "Spirit Rush"** (Mana 60)
- Effect: Dash 3 times to 3 different enemies over 1.5s, dealing 100% ATK each. Final target takes 200% ATK
- Implementation:
  - Select 3 unique alive enemies (random or weighted by proximity)
  - Divide 1.5s into 3 segments (0.5s each)
  - At each segment: teleport Inferno Fox to enemy cell, play dash animation, deal 100% ATK
  - On 3rd dash: deal 200% ATK instead
  - During dash, Inferno Fox cannot be damaged or CC'd
  - Refresh Foxfire trail on each dash position (adds new trail tiles)
  - If fewer than 3 enemies alive, hit available enemies repeatedly

---

### Unit 3: Tidal Shaman (T3 Healer, Water, Mystic)
**Stats**: HP 90, ATK 8, AS 0.6, Range 3, Mana 85

**Passive "Scepter of Tides"** (trigger: `on_attack`)
- Effect: Heals also apply Slow (12% AS, 2s) to nearest enemy
- Implementation:
  - Track `unit.hasPassive.ScepterOfTides = true`
  - When Tidal Shaman performs healing (via ability or other source):
    - Find nearest enemy to Tidal Shaman
    - Apply Slow status: `addStatus(nearestEnemy, 'slow', 2, 12, unit)`
    - Slow reduces attack speed by 12% for 2s
  - This applies to all heals (ability heals, aura heals, triggered heals)

**Ability "Tidal Surge"** (Mana 85)
- Effect: Heal all Water allies for 160% ATK. Grant 15% dodge 3s
- Implementation:
  - Find all Water-element allies (including self)
  - Heal each for 160% of Tidal Shaman's ATK: `dealHealing(unit, ally, unit.atk * 1.6)`
  - Grant each ally Dodge buff: `addStatus(ally, 'dodgeBuff', 3, 15, unit)`
  - "Scepter of Tides" passive triggers: find nearest enemy to Tidal Shaman, apply Slow
  - Flash blue aura at Tidal Shaman location

---

### Unit 4: Riptide Blade (T3 Warrior, Water, Duelist)
**Stats**: HP 85, ATK 13, AS 0.8, Range 1, Mana 65

**Passive "Current"** (trigger: `on_attack`)
- Effect: Attacks against Slowed enemies have 25% chance to grant +25% ATK 3s
- Implementation:
  - Track `unit.hasPassive.Current = true`
  - On each attack:
    - Check if target has Slow status
    - If yes, 25% chance to apply ATK buff to Riptide Blade: `addStatus(unit, 'atkBuff', 3, 25, unit)`
    - ATK buff stacks with multiple procs
  - No cooldown; chance applies per attack

**Ability "Maelstrom Spin"** (Mana 65)
- Effect: Spin dealing 180% ATK to nearby enemies (2-cell radius), apply Slow (20% AS, 3s). Gain 20% lifesteal 4s
- Implementation:
  - Find all enemies in 2-cell radius
  - Deal 180% ATK to each
  - Apply Slow status: `addStatus(enemy, 'slow', 3, 20, unit)`
  - Grant Riptide Blade lifesteal buff: `addStatus(unit, 'lifestealBuff', 4, 20, unit)`
    - (Lifesteal implementation: next 4s, on damage dealt, heal for 20% of damage)
  - If Slow present before cast, trigger "Current" passive (25% chance per hit for ATK buff)
  - Flash spin animation at unit location

---

### Unit 5: Golem (T3 Tank, Earth, Warden)
**Stats**: HP 140, ATK 6, AS 0.4, Range 1, Mana 90

**Passive "Immovable"** (trigger: `combat_start`)
- Effect: Cannot be knocked back/pulled/displaced. Takes 12% reduced AoE damage
- Implementation:
  - Track `unit.hasPassive.Immovable = true`
  - At combat start: set flag `unit.cannotBeKnockedBack = true`
  - Whenever any CC attempts to move/displace/pull Golem: check flag, cancel movement
  - For AoE damage calculation: if damage source is AoE, apply 12% reduction
    - Modify damage formula: `aoe_damage * 0.88`
  - Root, Stun, and other non-movement CC still apply normally

**Ability "Ground Slam"** (Mana 90)
- Effect: Deal 180% ATK nearby enemies (2-cell radius), stun 1.2s. Gain 15% DR 4s
- Implementation:
  - Find all enemies in 2-cell radius
  - Deal 180% ATK to each
  - Apply Stun status: `addStatus(enemy, 'stun', 1.2, 0, unit)`
  - Grant Golem DR buff: `addStatus(unit, 'drBuff', 4, 15, unit)`
    - (DR buff increases damage reduction percentage by 15%)
  - Flash impact effect at unit location, shake nearby area

---

### Unit 6: Terra Sage (T3 Mage, Earth, Sorcerer)
**Stats**: HP 75, ATK 11, AS 0.7, Range 4, Mana 80

**Passive "Living Earth"** (trigger: `on_ability_cast`)
- Effect: Every time Terra Sage casts ability, nearest ally gains Shield 18% max HP
- Implementation:
  - Track `unit.hasPassive.LivingEarth = true`
  - After Terra Sage executes ability (in executeAbility, at end):
    - Find nearest ally (excluding self)
    - Grant shield: `grantShield(unit, nearestAlly, nearestAlly.maxHp * 0.18)`
  - Shield persists until broken or replaced
  - Triggers only on ability cast, not on passive heals or buffs

**Ability "Earthen Barrage"** (Mana 80)
- Effect: Launch 3 projectiles at 3 highest-ATK enemies, each 140% ATK, reduce their ATK 18% for 4s
- Implementation:
  - Select 3 highest-ATK alive enemies
  - Fire projectile animation from Terra Sage to each target
  - Deal 140% ATK to each
  - Apply ATK reduction: `addStatus(enemy, 'atkMod', 4, -18, unit)`
    - (ATK mod with negative value reduces ATK by that percentage)
  - If fewer than 3 enemies, fire at available targets repeatedly
  - "Living Earth" triggers: nearest ally gains 18% max HP shield

---

### Unit 7: Monsoon Caller (T3 Mage, Wind, Sorcerer)
**Stats**: HP 78, ATK 10, AS 0.65, Range 4, Mana 85

**Passive "Updraft"** (trigger: `on_kill`)
- Effect: Kills grant all Wind allies 10% ATK speed 5s (stacks up to 4)
- Implementation:
  - Track `unit.hasPassive.Updraft = true`
  - When Monsoon Caller kills an enemy:
    - Find all Wind-element allies (including self)
    - Grant ATK speed buff: `addStatus(ally, 'asBuffStack', 5, 10, unit)`
      - Stack limit 4; each kill adds a stack that lasts 5s
      - Stacks do not refresh; new kill = new stack
    - Visual: wind particles around Wind allies

**Ability "Tornado"** (Mana 85)
- Effect: Summon tornado at location, 200% ATK over 3s in 2-cell radius. Silence 2s
- Implementation:
  - Select random enemy cell or highest enemy density cell
  - Create tornado object: `{x, y, health: unit.atk * 2, duration: 3, radius: 2}`
  - Over 3s, tornado deals 200% ATK total to all enemies in radius
    - Damage per tick = (200% ATK) / (3s / tickRate)
  - Apply Silence: `addStatus(enemy, 'silence', 2, 0, unit)`
    - Silenced enemies cannot cast abilities (mana doesn't fill)
  - Tornado can be damaged and destroyed (HP = 200% ATK)
  - On death/expiration: dismiss tornado, no additional effect

---

### Unit 8: Wind Duelist (T3 Warrior, Wind, Duelist)
**Stats**: HP 82, ATK 14, AS 0.9, Range 1, Mana 65

**Passive "Dance of Blades"** (trigger: `on_attack`)
- Effect: Every attack grants +5% dodge (max 5 stacks)
- Implementation:
  - Track `unit.hasPassive.DanceOfBlades = true` and `unit.dodgeStacks = 0`
  - On each attack:
    - If dodge stacks < 5, increment by 1
    - Apply cumulative dodge buff: `addStatus(unit, 'dodgeBuff', 999, dodgeStacks * 5, unit)`
      - (Buff persists for entire combat; timestamp = 999s or until reset)
    - Visual: wind particles increase with stack count

**Ability "Cyclone Slash"** (Mana 65)
- Effect: Spin slash 190% ATK in area (2-cell radius). Gain 30% dodge 3s. Reset stacks
- Implementation:
  - Find all enemies in 2-cell radius
  - Deal 190% ATK to each
  - Grant Wind Duelist 30% dodge for 3s: `addStatus(unit, 'dodgeBuff', 3, 30, unit)`
  - Reset Dance of Blades stacks: `unit.dodgeStacks = 0`
    - Remove old dodge buff, reapply at 0%
  - After 3s, if stacks are rebuilt, new buff applies on top
  - Flash spin animation at unit location

---

### Unit 9: Ball Lightning (T3 Mage, Lightning, Mystic)
**Stats**: HP 70, ATK 10, AS 0.6, Range 4, Mana 80

**Passive "Rolling Thunder"** (trigger: `periodic` every 1.5s)
- Effect: Create persistent lightning orb lasting 5s. Orb deals 15 DPS nearby (2-cell radius), enemies hitting it take +12% damage
- Implementation:
  - Track `unit.legendaryState.orbs = []` (array of active orbs)
  - Every 1.5s:
    - Create orb object: `{x: unit.x, y: unit.y, timer: 5, radius: 2, dps: 15}`
    - Spawn at Ball Lightning location
    - Limit to 3 active orbs max
  - Each orb per tick:
    - Deal 15 DPS to all enemies in radius
    - Any enemy in orb's radius: apply vulnerability (enemies deal +12% damage TO that enemy)
      - Could track as passive status: `addStatus(enemy, 'vulnerabilityDebuff', 1.5, 12, unit)` (refresh each tick)
  - Orbs expire after 5s

**Ability "Sphere Summoning"** (Mana 80)
- Effect: Summon ball at location. Rolls toward enemies dealing 180% ATK to each hit, chaining damage
- Implementation:
  - Select random enemy cell or nearest enemy
  - Create projectile: `{x: unit.x, y: unit.y, target: enemy, speed: 3, damage: unit.atk * 1.8}`
  - Projectile rolls toward target, bouncing to adjacent enemies
  - On hit: deal 180% ATK, mark target as hit this projectile
  - Chain to nearest unhit enemy in 2-cell radius, continue rolling
  - Stop after hitting 6 enemies or 4s elapsed, whichever first
  - Each hit triggers Rolling Thunder vulnerability if applicable

---

### Unit 10: Thunder Warden (T3 Tank, Lightning, Warden)
**Stats**: HP 130, ATK 7, AS 0.5, Range 2, Mana 85

**Passive "Overcharge"** (trigger: `on_hit`)
- Effect: Takes +8% crit chance damage (converts excess crits into stuns)
- Implementation:
  - Track `unit.hasPassive.Overcharge = true`
  - When Thunder Warden is hit:
    - Check if damage was a crit
    - If yes: convert 25% of that crit into a stun (chance or guaranteed per turn?)
      - Alternative: take +8% crit damage multiplier, and every 3rd crit against Thunder Warden stuns the attacker 0.5s
    - Interpretation: Thunder Warden's crit resistance causes crits against it to partially convert to CC
    - Implementation: `if (isCrit) { applyStun(attacker, 0.5); damageReduction = 0.08; }`

**Ability "Lightning Prison"** (Mana 85)
- Effect: Stun nearby enemies 1s, apply chain damage. Grant self 8% DR per Lightning ally 5s
- Implementation:
  - Find all enemies in 2-cell radius
  - Apply Stun: `addStatus(enemy, 'stun', 1, 0, unit)`
  - Chain damage: each stunned enemy takes 50% ATK chained from Thunder Warden to nearest other stunned enemy
    - Creates a chain effect in grid space
  - Count Lightning allies: `lightningAllies = countAlliesOfElement('lightning')`
  - Grant DR buff: `addStatus(unit, 'drBuff', 5, lightningAllies * 8, unit)`
  - Visual: lightning cage around stunned enemies

---

### Unit 11: Gladiator (T3 Warrior, Force, Duelist)
**Stats**: HP 88, ATK 16, AS 0.85, Range 1, Mana 65

**Passive "Arena Master"** (trigger: `on_attack`)
- Effect: Every 3 attacks gain +40% ATK for next attack
- Implementation:
  - Track `unit.hasPassive.ArenaMaster = true` and `unit.attackCounter = 0`
  - On each attack:
    - Increment attack counter
    - If counter % 3 == 0: mark next attack for +40% damage
    - Apply ATK buff to next hit only: `unit.nextAttackBonusAtk = 0.4`
    - Reset counter to 0 after buff applied
  - Visual: red aura on 3rd attack

**Ability "Brutal Strike"** (Mana 65)
- Effect: 220% ATK, apply 15% DR reduction to target 4s
- Implementation:
  - Select target (auto-attack target or nearest)
  - Deal 220% ATK
  - Apply DR reduction: `addStatus(target, 'drReduction', 4, -15, unit)`
    - (Negative DR mod = reduction in their DR)
  - If Arena Master passive is up (next attack bonus), multiply damage by 1.4
  - Flash ability impact at target

---

### Unit 12: Fortress (T3 Tank, Force, Warden)
**Stats**: HP 145, ATK 5, AS 0.4, Range 1, Mana 85

**Passive "Unbreakable Will"** (trigger: `combat_start`)
- Effect: Cannot be Rooted, Stunned, or Slowed below base move speed
- Implementation:
  - Track `unit.hasPassive.UnbreakableWill = true`
  - At combat start: store `unit.baseMovespeed`
  - When Root, Stun, or Slow applied to Fortress:
    - Root: check if can be rooted; if passive active, reduce duration to 50%
    - Stun: reduce duration to 50%
    - Slow: apply slow only if final move speed > base; cap at base move speed
  - Alternative stricter reading: no Root/Stun/Slow applied at all, but this is too strong
  - Best interpretation: immunities only apply when it would reduce below base move speed; otherwise apply at reduced effectiveness
  - "Cannot be... Slowed below base move speed" = slow effect caps at base

**Ability "Defensive Stance"** (Mana 85)
- Effect: Gain +12% DR 6s. Taunt nearby enemies 2s, reduce their ATK 20%
- Implementation:
  - Grant Fortress DR buff: `addStatus(unit, 'drBuff', 6, 12, unit)`
  - Find all enemies in 2-cell radius
  - Apply Taunt: `addStatus(enemy, 'taunt', 2, 0, unit)`
    - Taunted enemies attack only Fortress (if possible) for 2s
  - Apply ATK reduction: `addStatus(enemy, 'atkMod', 6, -20, unit)`
  - Flash shield effect at Fortress location

---

## Part 2: T4 Base Units (6 Abilities + 6 Passives)

### Unit 1: Fire Dragon (T4 Mage, Fire, Warden)
**Stats**: HP 120, ATK 14, AS 0.6, Range 4, Mana 80

**Passive "Dragonfire Aura"** (trigger: `aura`)
- Effect: Enemies within 2 cells take 20 fire DPS
- Implementation:
  - Passive aura (no timer needed; applies while Fire Dragon alive)
  - Every tick, find all enemies in 2-cell radius
  - Deal 20 DPS to each (20 * tickRate damage per tick)
  - Visual: fire aura around Fire Dragon

**Ability "Breath Weapon"** (Mana 80)
- Effect: Cone fire 250% ATK, Burn (30 DPS, 4s). Stun closest hit 1.5s
- Implementation:
  - Define cone: 3 cells forward from Fire Dragon, 1 cell width per distance
  - Deal 250% ATK to all enemies in cone
  - Apply Burn: `addStatus(enemy, 'burn', 4, 30, unit)`
  - Find closest enemy in cone, apply Stun: `addStatus(closestEnemy, 'stun', 1.5, 0, unit)`
  - Dragonfire Aura applies immediately post-cast (aura is always on)
  - Flash cone effect

---

### Unit 2: Kraken (T4 Mage, Water, Warden)
**Stats**: HP 110, ATK 12, AS 0.5, Range 3, Mana 85

**Passive "Ink Cloud"** (trigger: `periodic` every 15s)
- Effect: Release ink cloud (2-cell radius). Enemies 35% miss chance 3s
- Implementation:
  - Track `unit.legendaryState.inkCloudTimer = 0`
  - Every 15s:
    - Find all enemies in 2-cell radius of Kraken
    - Apply miss chance: `addStatus(enemy, 'misschanceBuff', 3, 35, unit)`
      - (Passive: reduce enemy hit chance by 35% for 3s)
    - Visual: blue ink cloud

**Ability "Maelstrom"** (Mana 85)
- Effect: Whirlpool at target (2-cell radius). Over 4s deal 280% ATK total, pull enemies 1 cell toward center/sec
- Implementation:
  - Select target cell (nearest enemy or center of enemy group)
  - Create whirlpool: `{x, y, duration: 4, damageTotal: unit.atk * 2.8, radius: 2}`
  - Every tick for 4s:
    - Deal (280% ATK / 4s) to all enemies in radius
    - Pull each enemy 1 cell toward whirlpool center (pathfinding or Manhattan distance reduction)
    - Enemies cannot escape (movement attempts fail/are pulled back)
  - After 4s, whirlpool disappears
  - Ink Cloud passive applies during whirlpool if 15s timer ready

---

### Unit 3: Ancient Treant (T4 Warrior, Earth, Duelist)
**Stats**: HP 125, ATK 13, AS 0.7, Range 1, Mana 80

**Passive "Deep Roots"** (trigger: `combat_start` + `periodic`)
- Effect: Cannot be slowed below 75% base move speed. Regen 1.2% max HP/sec while standing still
- Implementation:
  - At combat start: store `unit.baseMovespeed`
  - Slow application: cap at 75% base move speed (reduce slow % if needed)
  - Every tick while Ancient Treant is not moving:
    - Heal: `dealHealing(unit, unit, unit.maxHp * 0.012 * tickRate)`
    - Track `unit.lastMovementTick`; if > 0.2s ago, consider "standing still"

**Ability "Nature's Wrath"** (Mana 80)
- Effect: Strike 220% ATK, root 2s. Heal all Earth allies 15% of damage dealt
- Implementation:
  - Select target (auto-attack target or nearest)
  - Deal 220% ATK damage
  - Apply Root: `addStatus(target, 'root', 2, 0, unit)`
  - Calculate healing: `healAmount = damageDealt * 0.15`
  - Find all Earth allies
  - Heal each: `dealHealing(unit, ally, healAmount)`
  - Visual: nature vines wrapping around target and allies

---

### Unit 4: Storm Sovereign (T4 Assassin, Lightning, Predator)
**Stats**: HP 75, ATK 17, AS 1.0, Range 2, Mana 55

**Passive "Lightning Speed"** (trigger: `on_attack`)
- Effect: First auto after repositioning guarantees crit
- Implementation:
  - Track `unit.hasPassive.LightningSpeed = true` and `unit.repositioned = false`
  - When Storm Sovereign moves to a new cell: set `unit.repositioned = true`
  - Next attack: check if repositioned flag is true
    - If yes: guarantee crit on that attack (`unit.nextAttackCrit = true`), reset flag to false
    - If no: normal crit chance

**Ability "Thunder Cleave"** (Mana 55)
- Effect: Teleport to lowest-HP enemy, 280% ATK. Adjacent take 100% ATK splash
- Implementation:
  - Find lowest-HP alive enemy
  - Teleport Storm Sovereign to adjacent cell of that enemy
  - Deal 280% ATK to target
  - Find all enemies adjacent (8-way or 4-way) to target
  - Deal 100% ATK splash to each
  - Lightning Speed passive applies (teleport = reposition, next attack guaranteed crit)
  - Visual: lightning flash and repositioning animation

---

### Unit 5: Thunderbird (T4 Warrior, Lightning, Vanguard)
**Stats**: HP 95, ATK 15, AS 0.8, Range 2, Mana 70

**Passive "Aerial Superiority"** (trigger: `combat_start`)
- Effect: +20% ATK, first attack guarantees crit
- Implementation:
  - At combat start: grant ATK buff `addStatus(unit, 'atkBuff', 999, 20, unit)` (persistent)
  - Mark first attack: `unit.firstAttack = true`
  - On first attack: guarantee crit (`unit.nextAttackCrit = true`), reset flag

**Ability "Lightning Descent"** (Mana 70)
- Effect: Dive to lowest-HP enemy 240% ATK, chain damage. Stun nearby 0.8s
- Implementation:
  - Find lowest-HP alive enemy
  - Teleport Thunderbird to adjacent cell
  - Deal 240% ATK to target
  - Chain damage: 60% ATK to nearest other enemy in 2-cell radius, then 40% to next nearest
  - Find all enemies in 2-cell radius of impact
  - Apply Stun: `addStatus(enemy, 'stun', 0.8, 0, unit)`
  - Aerial Superiority applies (+20% ATK on this hit)
  - Visual: lightning dive and impact shockwave

---

### Unit 6: Siege Engineer (T4 Mage, Force, Mystic)
**Stats**: HP 85, ATK 11, AS 0.65, Range 4, Mana 75

**Passive "War Machine"** (trigger: `on_attack`)
- Effect: Attacks ignore 15% target DR
- Implementation:
  - Track `unit.hasPassive.WarMachine = true`
  - On each attack:
    - Calculate target's effective DR
    - Reduce by 15%: `effectiveDr = Math.max(0, targetDr - 15)`
    - Apply damage with modified DR

**Ability "Artillery Strike"** (Mana 75)
- Effect: Target furthest enemy 280% ATK. Create impact crater (40% slow, 3s)
- Implementation:
  - Find furthest alive enemy from Siege Engineer
  - Deal 280% ATK to target
  - Create crater at target location: 2-cell radius
  - All enemies in crater apply Slow: `addStatus(enemy, 'slow', 3, 40, unit)`
  - Crater persists for 3s; enemies cannot exit without being slowed
  - War Machine passive applies (ignores 15% target DR)
  - Visual: artillery explosion and crater

---

## Part 3: T5 Legendary Units (6 Units, Passive-Only Ability System)

### Critical Architecture: T5 Legendary Ability System

**Initialization** (in `initCombat` or `setupUnit`):
```javascript
// For all T5 units, set maxMana = 0
// Initialize legendary state tracking:
if (unit.maxMana === 0) {
    unit.legendaryState = {
        revivePending: false,
        reviveTimer: 0,
        reviveCount: 0,
        lastKillTime: 0,
        submerged: false,
        submergeTimer: 0,
        periodicTimer: 0,
        customData: {}
    };
}
```

**Processing** (in `combatTick` after normal passive processing):
```javascript
// After processTickPassives():
function processLegendaryAbilities(allUnits, dt) {
    for (var i = 0; i < allUnits.length; i++) {
        var unit = allUnits[i];
        if (unit.hp <= 0) continue;
        if (unit.maxMana !== 0) continue; // Only T5 units

        var abilityData = ABILITY_DATA[unit.templateKey];
        if (!abilityData) continue;

        // Route to specific legendary handler
        executeLegendaryAbility(unit, abilityData, dt);
    }
}

function executeLegendaryAbility(unit, abilityData, dt) {
    // Dispatch by unit templateKey
    switch (unit.templateKey) {
        case 'phoenix':
            executeLegendaryPhoenix(unit, dt);
            break;
        case 'leviathan':
            executeLegendaryLeviathan(unit, dt);
            break;
        case 'worldTree':
            executeLegendaryWorldTree(unit, dt);
            break;
        case 'voidWyrm':
            executeLegendaryVoidWyrm(unit, dt);
            break;
        case 'stormDragon':
            executeLegendaryStormDragon(unit, dt);
            break;
        case 'titanLord':
            executeLegendaryTitanLord(unit, dt);
            break;
    }
}
```

**Key Rule**: T5 units NEVER call `executeAbility()`. Mana never fills. Passives + legendary abilities = complete toolkit.

---

### Unit 1: Phoenix (T5 Mage, Fire, Mystic)
**Stats**: HP 115, ATK 13, AS 0.65, Range 4, Mana 0

**Innate Passive "Eternal Flame"** (trigger: `aura`)
- Effect: While alive, all Fire allies gain 15% ATK and 8% lifesteal. On revival, aura doubles 6s (30% ATK, 16% lifesteal)
- Implementation:
  - Passive aura (always active while Phoenix alive)
  - Find all Fire element allies
  - Base: grant `addStatus(ally, 'atkBuff', 999, 15, unit)` and `addStatus(ally, 'lifestealBuff', 999, 8, unit)`
  - Track `unit.legendaryState.revivedRecently = false`
  - After Phoenix revives: set to true, set `unit.legendaryState.doubleAuraTimer = 6`
  - While doubleAuraTimer > 0: aura is doubled (30% ATK, 16% lifesteal)
  - After timer expires: revert to base aura

**Legendary Ability "Rebirth"** (trigger: on death, conditional)
- Effect: On death, revive after 3s at 50% HP. First revive always triggers; subsequent on kills (once per 4s). Explode on revive 150% ATK in area
- Implementation:
  - When Phoenix reaches HP = 0:
    - Set `unit.hp = 1` (keep alive temporarily)
    - Set `unit.legendaryState.revivePending = true`
    - Set `unit.legendaryState.reviveTimer = 3`
    - Set `unit.legendaryState.revivedRecently = true`
    - Set `unit.legendaryState.doubleAuraTimer = 6`
    - Set `unit.legendaryState.nextReviveAllowedAt = 0` (first revive)
  - In processLegendaryPhoenix:
    - If revivePending and reviveTimer > 0: count down
    - On reviveTimer <= 0:
      - Revive: `unit.hp = Math.floor(unit.maxHp * 0.5)`
      - Find cell near last death location or center of board
      - Place Phoenix back on grid (if not already visible)
      - Deal 150% ATK in 2-cell radius around Phoenix: `dealDamage(unit, enemy, unit.atk * 1.5)` for all enemies in radius
      - Set `unit.legendaryState.reviveCount++`
      - Set `unit.legendaryState.lastReviveTime = currentTime`
      - Set `unit.legendaryState.nextReviveAllowedAt = currentTime + 4`
  - Condition for next revive:
    - After first revive, require: `(currentTime - lastKillTime) < nextReviveAllowedAt`
    - Or check: if last kill time is recent enough
  - Visual: explosion effect and rising from ashes

---

### Unit 2: Leviathan (T5 Tank, Water, Guardian)
**Stats**: HP 200, ATK 8, AS 0.45, Range 3, Mana 0

**Innate Passive "Abyssal Depths"** (trigger: `periodic` every 10s)
- Effect: Every 10s, submerge 1.5s (untargetable). On resurface, 120% ATK adjacent, Slow (25% AS, 4s)
- Implementation:
  - Track `unit.legendaryState.submergeTimer = 0`
  - Track `unit.legendaryState.submergeActive = false`
  - Every 10s:
    - Set `unit.legendaryState.submergeActive = true`
    - Set `unit.legendaryState.submergeTimer = 1.5`
  - While submergeActive and submergeTimer > 0:
    - Count down timer
    - Leviathan is untargetable (skip in target selection)
    - Leviathan cannot attack (even if target in range)
    - Visual: submerge animation (unit sinks)
  - When submergeTimer <= 0 and submergeActive:
    - Resurface
    - Set `unit.legendaryState.submergeActive = false`
    - Find all adjacent enemies (8-way)
    - Deal 120% ATK to each
    - Apply Slow: `addStatus(enemy, 'slow', 4, 25, unit)`
    - Visual: resurface animation with shockwave

**Legendary Ability "Tidal Guardian"** (trigger: `aura` + `on_hit`)
- Effect: Water allies gain 12% max HP and 8% DR. Enemies hitting Leviathan lose 8 mana. Start with 200 shield
- Implementation:
  - At unit spawn/init: `grantShield(unit, unit, 200)`
  - Aura: find all Water allies, apply buffs
    - `addStatus(ally, 'maxHpBuff', 999, 12, unit)` (recalculate ally max HP)
    - `addStatus(ally, 'drBuff', 999, 8, unit)`
  - On-hit: when any enemy attacks Leviathan and hits
    - Drain enemy mana: `enemy.mana = Math.max(0, enemy.mana - 8)`
  - Aura applies continuously; on-hit applies per damage instance

---

### Unit 3: World Tree (T5 Healer, Earth, Sage)
**Stats**: HP 125, ATK 9, AS 0.5, Range 3, Mana 0

**Innate Passive "Roots of Life"** (trigger: `aura` continuous)
- Effect: Allies heal 1.2% max HP/sec passively, even if silenced/stunned
- Implementation:
  - Passive aura (always active)
  - Find all allies (including self)
  - Every tick: heal each ally `ally.maxHp * 0.012 * tickRate`
  - This applies even if World Tree is silenced/stunned (independent of normal passive processing)
  - Visual: green aura extending to allies

**Legendary Ability "Bloom of Life"** (trigger: `periodic` every 8s)
- Effect: Heal 3 lowest-HP nearby allies for 250% ATK. Overhealing → Shield (60% of overheal). Earth allies gain +10% healing received
- Implementation:
  - Track `unit.legendaryState.bloomTimer = 0`
  - Every 8s:
    - Find 3 lowest-HP alive allies
    - For each: calculate healing = `unit.atk * 2.5`
    - Apply healing: `dealHealing(unit, ally, healing)`
    - Calculate overheal: `overheal = healing - (ally.maxHp - ally.hp)`
    - If overheal > 0: `grantShield(unit, ally, overheal * 0.6)`
  - Earth allies bonus: find all Earth allies, track modifier
    - Whenever healing applied to Earth ally: multiply by 1.1 (10% bonus)
    - Or: `addStatus(earthAlly, 'healingReceivedBuff', 999, 10, unit)`
  - Visual: bloom particles spreading to allies

---

### Unit 4: Void Wyrm (T5 Mage, Wind, Mystic)
**Stats**: HP 90, ATK 12, AS 0.7, Range 4, Mana 0

**Innate Passive "Reality Warp"** (trigger: `on_attack`)
- Effect: Auto-attacks teleport target 1 cell random direction (3s cooldown per target)
- Implementation:
  - Track `unit.hasPassive.RealityWarp = true`
  - Track `unit.legendaryState.teleportCooldowns = {}` (map of target unit ID → cooldown timer)
  - On each auto-attack hit:
    - Check if target has cooldown active
    - If no cooldown:
      - Pick random adjacent cell (8-way)
      - Teleport target to that cell (find empty or swap if occupied)
      - Set cooldown: `cooldowns[targetId] = 3`
      - Each tick, decrement all cooldowns
  - Visual: target flickers and repositions

**Legendary Ability "Dimensional Rift"** (trigger: event-driven, on any ally ability cast)
- Effect: When any ally casts ability, fire bolt at random enemy for 90% ATK
- Implementation:
  - Add hook in `executeAbility()`: after any ally executes ability:
    ```javascript
    // In executeAbility, at end:
    if (casterTeam === 'team1' || casterTeam === 'team2') {
        // Check if Void Wyrm on same team is alive
        var voidWyrm = findUnitByTemplate('voidWyrm', casterTeam);
        if (voidWyrm && voidWyrm.hp > 0) {
            var randomEnemy = getRandomAlive(getEnemies(casterTeam));
            if (randomEnemy) {
                dealDamage(voidWyrm, randomEnemy, voidWyrm.atk * 0.9);
                // Visual: bolt from Void Wyrm to enemy
            }
        }
    }
    ```
  - This applies to all abilities on the same team, not just Void Wyrm
  - Multiple allies casting in same turn = multiple bolts (no global cooldown)
  - Visual: bolt fires from Void Wyrm location to enemy

---

### Unit 5: Storm Dragon (T5 Mage, Lightning, Sorcerer)
**Stats**: HP 110, ATK 15, AS 0.6, Range 4, Mana 0

**Innate Passive "Superconductor"** (trigger: `aura` + `on_attack`)
- Effect: All Lightning allies gain +18% crit chance. On Storm Dragon crit, all nearby Lightning allies gain +25% ATK 3s
- Implementation:
  - Aura: find all Lightning allies
    - Apply crit chance buff: `addStatus(ally, 'critChanceBuff', 999, 18, unit)`
  - On Storm Dragon attack hit:
    - Check if it was a crit
    - If yes:
      - Find all Lightning allies in 3-cell radius
      - Apply ATK buff: `addStatus(ally, 'atkBuff', 3, 25, unit)`
      - Visual: crit proc animation triggers buff for nearby allies

**Legendary Ability "Cataclysmic Storm"** (trigger: `periodic` every 6s)
- Effect: Strike target with lightning 300% ATK, chain to all nearby enemies. Chains crit at 50% chance
- Implementation:
  - Track `unit.legendaryState.stormTimer = 0`
  - Every 6s:
    - Select target: highest-ATK enemy or random enemy
    - Strike: deal 300% ATK
    - Check if strike was crit (determine based on Storm Dragon crit chance or guarantee some % for this ability)
    - Chain: find all enemies in 2-cell radius of target
    - For each chained enemy:
      - Deal 150% ATK (half of primary)
      - 50% chance to crit on each chain hit (independent of Storm Dragon's crit stat)
    - Visual: lightning cascading from primary to chains

---

### Unit 6: Titan Lord (T5 Warrior, Force, Duelist)
**Stats**: HP 180, ATK 14, AS 0.6, Range 1, Mana 0

**Innate Passive "Colossus"** (trigger: `combat_start` + `on_attack`)
- Effect: +25% max HP. Every 5th hit stuns 1s. First CC immunity
- Implementation:
  - At combat start:
    - Increase max HP: `unit.maxHp *= 1.25`
    - Restore HP proportionally: `unit.hp = (unit.hp / oldMaxHp) * unit.maxHp`
    - Set `unit.legendaryState.firstCcImmunity = true`
  - Track `unit.hitCounter = 0`
  - On each attack:
    - Increment counter
    - If counter % 5 == 0:
      - Stun target: `addStatus(target, 'stun', 1, 0, unit)`
      - Reset counter
  - When CC applied to Titan Lord:
    - If firstCcImmunity: cancel CC, set `unit.legendaryState.firstCcImmunity = false`
    - Otherwise: apply normally

**Legendary Ability "Earthshaker"** (trigger: `periodic` every 7s)
- Effect: Slam ground 320% ATK in area (2-cell radius). Root enemies 2s, +20% damage taken 5s. Force allies gain +15% ATK
- Implementation:
  - Track `unit.legendaryState.shakeTim = 0`
  - Every 7s:
    - Slam at Titan Lord location (or nearest enemy group center)
    - Find all enemies in 2-cell radius
    - Deal 320% ATK to each
    - Apply Root: `addStatus(enemy, 'root', 2, 0, unit)`
    - Apply vulnerability: `addStatus(enemy, 'vulnerabilityDebuff', 5, 20, unit)` (take 20% more damage)
    - Find all Force allies
    - Apply ATK buff: `addStatus(ally, 'atkBuff', 5, 15, unit)`
    - Visual: earthquake shockwave, rooted vines, allies glow

---

## Part 3b: Evolved T3 Units (12 Evolved Abilities + 12 Evolved Passives)

Evolved T3 units enhance both the innate passive AND the ability of their base form. Follow the same format and architecture as T1-T2 evolved units in prompt 19a.

### Evolved Unit 1: Arcane Inferno (from Pyromancer, T3 Mage, Fire, Sorcerer)

**Evolved Passive "Pyromaniac (Enhanced)"** (trigger: `on_attack`)
- Effect: Burn effects on targets hit last 70% longer and deal 35% more DPS (vs base 50% longer, 20% more DPS)
- Implementation:
  - Same as base Pyromaniac but with enhanced multipliers
  - Track `unit.hasPassive.Pyromaniac = true`
  - On attack, find burn effects on target
  - Multiply duration by 1.7 (vs base 1.5)
  - Multiply DPS by 1.35 (vs base 1.2)

**Evolved Ability "Infernal Storm (Enhanced)"** (Mana 80)
- Effect: Creates persistent fire zones that reapply Burn on entry (enhanced from base which only deals one-time burn)
- Implementation:
  - Cast at target location (2-cell radius as base)
  - Deal 200% ATK over 3s
  - Create persistent fire zone lasting 5s
  - Any enemy entering or standing in zone: apply Burn (25 DPS, 4s)
  - Reapply Burn if zone is still active when enemy re-enters after duration expires
  - Zone scales with ability upgrades

---

### Evolved Unit 2: Ninetail Blaze (from Inferno Fox, T3 Assassin, Fire, Mystic)

**Evolved Passive "Foxfire (Enhanced)"** (trigger: `periodic` every 0.3s while moving)
- Effect: Fire trail lasts 4s (vs base 2.5s), deals 30 DPS (vs base 18), and applies Burn (10 DPS, 2s)
- Implementation:
  - Same as base but extended duration and damage
  - Every 0.3s of movement: add trail tile
  - Trail lasts 4s (vs base 2.5s)
  - Deal 30 DPS per second (vs base 18)
  - Also apply Burn: 10 DPS for 2s to enemies on trail
  - Cap trail length at 15 tiles (vs base 12)

**Evolved Ability "Spirit Rush (Enhanced)"** (Mana 60)
- Effect: Dashes 5 times (vs base 3 times) to different enemies and applies Burn to all hit
- Implementation:
  - Select 5 unique alive enemies (vs base 3)
  - Divide 1.5s into 5 segments (0.3s each)
  - At each segment: teleport Inferno Fox, deal 100% ATK
  - On final dash: deal 200% ATK
  - Apply Burn to all hit: 15 DPS, 3s
  - Refresh Foxfire trail at each position
  - If fewer than 5 enemies, cycle through available targets

---

### Evolved Unit 3: Stormtide Oracle (from Tidal Shaman, T3 Healer, Water, Mystic)

**Evolved Passive "Scepter of Tides (Enhanced)"** (trigger: `on_attack`)
- Effect: Heals apply 18% Slow to 2 nearest enemies (vs base 12% Slow to nearest only)
- Implementation:
  - Track `unit.hasPassive.ScepterOfTides = true`
  - When Tidal Shaman heals:
    - Find 2 nearest enemies
    - Apply Slow: `addStatus(enemy, 'slow', 2, 18, unit)` to each
    - (Base version only hits nearest 1 enemy with 12% slow)

**Evolved Ability "Tidal Surge (Enhanced)"** (Mana 85)
- Effect: Heals all Water allies for 200% ATK (vs base 160%), grants 25% dodge (vs base 15%)
- Implementation:
  - Find all Water-element allies
  - Heal each: `dealHealing(unit, ally, unit.atk * 2.0)` (vs base 1.6)
  - Grant dodge buff: `addStatus(ally, 'dodgeBuff', 3, 25, unit)` (vs base 15)
  - Passive triggers: apply 18% Slow to 2 nearest enemies

---

### Evolved Unit 4: Tsunami Warlord (from Riptide Blade, T3 Warrior, Water, Duelist)

**Evolved Passive "Current (Enhanced)"** (trigger: `on_attack`)
- Effect: Attacks against Slowed enemies have 35% chance to grant +40% ATK (vs base 25% chance, +25% ATK)
- Implementation:
  - Track `unit.hasPassive.Current = true`
  - On attack against Slowed target:
    - 35% chance (vs base 25%)
    - Grant +40% ATK buff (vs base +25%)
    - `addStatus(unit, 'atkBuff', 3, 40, unit)`

**Evolved Ability "Maelstrom Spin (Enhanced)"** (Mana 65)
- Effect: Spin dealing 180% ATK (2-cell radius), apply 30% Slow (vs base 20%), gain 35% lifesteal (vs base 20%), stun Slowed enemies 0.5s
- Implementation:
  - Find all enemies in 2-cell radius
  - Deal 180% ATK to each
  - Apply Slow: `addStatus(enemy, 'slow', 3, 30, unit)` (vs base 20)
  - Grant lifesteal: `addStatus(unit, 'lifestealBuff', 4, 35, unit)` (vs base 20)
  - Find Slowed enemies in radius: `addStatus(enemy, 'stun', 0.5, 0, unit)` (new effect)
  - Enhanced: heals for 35% of damage dealt (vs base 20%)

---

### Evolved Unit 5: Iron Colossus (from Golem, T3 Tank, Earth, Warden)

**Evolved Passive "Immovable (Enhanced)"** (trigger: `combat_start`)
- Effect: Cannot be knocked back/pulled. Takes 18% reduced AoE damage (vs base 12%)
- Implementation:
  - Same as base but stronger AoE reduction
  - `unit.cannotBeKnockedBack = true`
  - For AoE damage: `aoe_damage * 0.82` (vs base 0.88)

**Evolved Ability "Ground Slam (Enhanced)"** (Mana 90)
- Effect: Deal 250% ATK (vs base 180%), stun 1.8s (vs base 1.2s), grant 22% DR to nearby allies
- Implementation:
  - Find all enemies in 2-cell radius
  - Deal 250% ATK to each (vs base 180)
  - Apply Stun: `addStatus(enemy, 'stun', 1.8, 0, unit)` (vs base 1.2)
  - Find all allies in 2-cell radius
  - Apply DR buff to allies: `addStatus(ally, 'drBuff', 4, 22, unit)` (new feature)
  - Grant Golem DR buff: `addStatus(unit, 'drBuff', 4, 15, unit)`

---

### Evolved Unit 6: Earthweaver (from Terra Sage, T3 Mage, Earth, Sorcerer)

**Evolved Passive "Living Earth (Enhanced)"** (trigger: `on_ability_cast`)
- Effect: Every ability cast, nearest ally gains 25% max HP shield (vs base 18%), triggers on every ability
- Implementation:
  - Track `unit.hasPassive.LivingEarth = true`
  - After ability execution:
    - Find nearest ally
    - Grant shield: `grantShield(unit, nearestAlly, nearestAlly.maxHp * 0.25)` (vs base 0.18)
    - Triggers on every cast (same as base but stronger shield)

**Evolved Ability "Earthen Barrage (Enhanced)"** (Mana 80)
- Effect: Launch 5 projectiles (vs base 3) at 5 highest-ATK enemies, each 140% ATK, reduce ATK by 25% (vs base 18%)
- Implementation:
  - Select 5 highest-ATK enemies (vs base 3)
  - Fire projectile to each
  - Deal 140% ATK (same as base)
  - Apply ATK reduction: `addStatus(enemy, 'atkMod', 4, -25, unit)` (vs base -18)
  - If fewer than 5 enemies, fire repeatedly
  - Passive triggers: nearest ally gains 25% shield

---

### Evolved Unit 7: Tempest Lord (from Monsoon Caller, T3 Mage, Wind, Sorcerer)

**Evolved Passive "Updraft (Enhanced)"** (trigger: `on_kill`)
- Effect: Kills grant Wind allies 10% ATK speed (stacks up to 6, lasts 7s) vs base 4 stacks, 5s
- Implementation:
  - Track `unit.hasPassive.Updraft = true`
  - On kill:
    - Find all Wind allies
    - Grant ATK speed buff: `addStatus(ally, 'asBuffStack', 7, 10, unit)`
    - Stack limit 6 (vs base 4)
    - Lasts 7s (vs base 5s)

**Evolved Ability "Tornado (Enhanced)"** (Mana 85)
- Effect: Larger tornado (3-cell radius vs base 2-cell), deals 300% ATK (vs base 200%), silences 3s (vs base 2s)
- Implementation:
  - Select target cell
  - Create tornado: `{x, y, health: unit.atk * 3, duration: 3, radius: 3}` (vs base radius 2)
  - Over 3s, tornado deals 300% ATK total (vs base 200)
  - Apply Silence: `addStatus(enemy, 'silence', 3, 0, unit)` (vs base 2s)
  - Tornado can be damaged and destroyed

---

### Evolved Unit 8: Hurricane Blade (from Wind Duelist, T3 Warrior, Wind, Duelist)

**Evolved Passive "Dance of Blades (Enhanced)"** (trigger: `on_attack`)
- Effect: Every attack grants +8% dodge (max 8 stacks, 64% dodge) vs base 5% dodge, 5 stacks (25% dodge)
- Implementation:
  - Track `unit.hasPassive.DanceOfBlades = true` and `unit.dodgeStacks = 0`
  - On each attack:
    - If dodgeStacks < 8, increment by 1 (vs base 5)
    - Apply cumulative dodge: `addStatus(unit, 'dodgeBuff', 999, dodgeStacks * 8, unit)` (vs base * 5)

**Evolved Ability "Cyclone Slash (Enhanced)"** (Mana 65)
- Effect: Spin slash 260% ATK (vs base 190%), gain 45% dodge (vs base 30%), apply Slow to hit enemies
- Implementation:
  - Find all enemies in 2-cell radius
  - Deal 260% ATK to each (vs base 190)
  - Grant Wind Duelist 45% dodge for 3s (vs base 30)
  - Apply Slow to all hit enemies: `addStatus(enemy, 'slow', 2, 15, unit)` (new feature)
  - Reset Dance of Blades stacks

---

### Evolved Unit 9: Plasma Core (from Ball Lightning, T3 Mage, Lightning, Mystic)

**Evolved Passive "Rolling Thunder (Enhanced)"** (trigger: `periodic` every 1.5s)
- Effect: Orbs last 8s (vs base 5s), deal 25 DPS (vs base 15), enemies take +18% damage (vs base 12%), orbs bounce between enemies
- Implementation:
  - Track `unit.legendaryState.orbs = []`
  - Every 1.5s: create orb `{x, y, timer: 8, radius: 2, dps: 25, bounces: true}`
  - Limit 3 active orbs max (same as base)
  - Each tick: orbs deal 25 DPS (vs base 15)
  - Apply vulnerability: `addStatus(enemy, 'vulnerabilityDebuff', 1.5, 18, unit)` (vs base 12)
  - Orbs bounce toward nearest enemy in radius

**Evolved Ability "Sphere Summoning (Enhanced)"** (Mana 80)
- Effect: Summon 2 balls (vs base 1) at location, roll toward enemies applying stronger chain
- Implementation:
  - Select 2 target cells/enemies (vs base 1)
  - Create 2 projectiles: `{x, y, target: enemy, speed: 3, damage: unit.atk * 1.8}`
  - Each projectile rolls independently
  - On hit: deal 180% ATK, chain applies vulnerability (18% vs base 12%)
  - Chain to nearest unhit in 2-cell radius
  - Stop after hitting 8 enemies or 5s (vs base 6 enemies, 4s)

---

### Evolved Unit 10: Storm Fortress (from Thunder Warden, T3 Tank, Lightning, Warden)

**Evolved Passive "Overcharge (Enhanced)"** (trigger: `on_hit`)
- Effect: Converts excess crits into 1s stuns and reflects 20% of converted damage back to attacker
- Implementation:
  - When Thunder Warden is hit with crit:
    - Apply stun to attacker: `addStatus(attacker, 'stun', 1, 0, unit)` (vs base 0.5s)
    - Calculate damage conversion: `reflectedDamage = critDamage * 0.2`
    - Deal reflected damage to attacker: `dealDamage(unit, attacker, reflectedDamage)`

**Evolved Ability "Lightning Prison (Enhanced)"** (Mana 85)
- Effect: Stun nearby enemies 1.5s (vs base 1s) at 2-cell radius, apply chain damage, grant self 10% DR per Lightning ally (vs base 8%)
- Implementation:
  - Find all enemies in 2-cell radius
  - Apply Stun: `addStatus(enemy, 'stun', 1.5, 0, unit)` (vs base 1s)
  - Chain damage: 50% ATK between stunned enemies
  - Count Lightning allies
  - Grant DR buff: `addStatus(unit, 'drBuff', 5, lightningAllies * 10, unit)` (vs base * 8)

---

### Evolved Unit 11: Champion (from Gladiator, T3 Warrior, Force, Duelist)

**Evolved Passive "Arena Master (Enhanced)"** (trigger: `on_attack`)
- Effect: Every 2 attacks (vs base 3) grants +60% ATK (vs base 40%) for next attack
- Implementation:
  - Track `unit.hasPassive.ArenaMaster = true` and `unit.attackCounter = 0`
  - On each attack:
    - Increment counter
    - If counter % 2 == 0 (vs base % 3):
      - Mark next attack: `unit.nextAttackBonusAtk = 0.6` (vs base 0.4)
      - Reset counter to 0

**Evolved Ability "Brutal Strike (Enhanced)"** (Mana 65)
- Effect: Deal 320% ATK (vs base 220%), apply 25% DR reduction to target (vs base 15%), stun on kill 0.8s
- Implementation:
  - Select target
  - Deal 320% ATK (vs base 220)
  - Apply DR reduction: `addStatus(target, 'drReduction', 4, -25, unit)` (vs base -15)
  - If target dies: no additional stun (target is dead)
  - Alternative: apply stun to ANOTHER nearby enemy on kill: `addStatus(nearbyEnemy, 'stun', 0.8, 0, unit)` (new feature)
  - If Arena Master passive active: multiply damage by 1.6 (vs base 1.4)

---

### Evolved Unit 12: Citadel (from Fortress, T3 Tank, Force, Warden)

**Evolved Passive "Unbreakable Will (Enhanced)"** (trigger: `combat_start`)
- Effect: Immunity to all CC effects (vs base 50% reduced duration cap at base move speed)
- Implementation:
  - At combat start: `unit.hasPassive.UnbreakableWill = true`
  - When Root, Stun, or Slow applied:
    - Root: cannot be rooted (immunity)
    - Stun: cannot be stunned (immunity)
    - Slow: cannot be slowed (immunity)

**Evolved Ability "Defensive Stance (Enhanced)"** (Mana 85)
- Effect: Gain +18% DR (vs base 12%) for 8s (vs base 6s), taunt at 2-cell range (vs base 2-cell) for 3s, reduce enemy ATK 30% (vs base 20%)
- Implementation:
  - Grant Fortress DR buff: `addStatus(unit, 'drBuff', 8, 18, unit)` (vs base 6s, 12)
  - Find all enemies in 2-cell radius
  - Apply Taunt: `addStatus(enemy, 'taunt', 3, 0, unit)` (vs base 2s)
  - Apply ATK reduction: `addStatus(enemy, 'atkMod', 6, -30, unit)` (vs base 20)

---

## Part 3c: Evolved T4 Units (6 Evolved Abilities + 6 Evolved Passives)

Evolved T4 units follow the same architecture as T3. Enhanced passive and ability.

### Evolved Unit 1: Elder Wyrm (from Fire Dragon, T4 Mage, Fire, Warden)

**Evolved Passive "Dragonfire Aura (Enhanced)"** (trigger: `aura`)
- Effect: Enemies within 3-cell radius take 35 DPS (vs base 2-cell radius, 20 DPS)
- Implementation:
  - Passive aura (always on)
  - Every tick, find all enemies in 3-cell radius (vs base 2)
  - Deal 35 DPS to each (vs base 20)

**Evolved Ability "Breath Weapon (Enhanced)"** (Mana 80)
- Effect: Cone fire 250% ATK, Burn (30 DPS, 4s), cones extend further and stun all hit for 2s (vs base stuns closest only for 1.5s)
- Implementation:
  - Define cone: 4 cells forward (vs base 3), 1.5 cell width
  - Deal 250% ATK to all in cone
  - Apply Burn: `addStatus(enemy, 'burn', 4, 30, unit)`
  - Apply Stun to ALL hit: `addStatus(enemy, 'stun', 2, 0, unit)` (vs base stuns 1 closest for 1.5s)

---

### Evolved Unit 2: Abyssal Terror (from Kraken, T4 Mage, Water, Warden)

**Evolved Passive "Ink Cloud (Enhanced)"** (trigger: `periodic` every 10s)
- Effect: Release ink cloud (3-cell radius vs base 2-cell), enemies 35% miss chance (unchanged), triggers every 10s vs base 15s
- Implementation:
  - Track `unit.legendaryState.inkCloudTimer = 0`
  - Every 10s (vs base 15s):
    - Find enemies in 3-cell radius (vs base 2)
    - Apply miss chance: `addStatus(enemy, 'misschanceBuff', 3, 35, unit)`

**Evolved Ability "Maelstrom (Enhanced)"** (Mana 85)
- Effect: Whirlpool at target (2-cell radius), deals 400% ATK total (vs base 280%), pull enemies 2 cells/sec (vs base 1 cell)
- Implementation:
  - Select target cell
  - Create whirlpool: `{x, y, duration: 4, damageTotal: unit.atk * 4, radius: 2}`
  - Every tick for 4s:
    - Deal (400% ATK / 4s) (vs base 280% / 4s)
    - Pull each enemy 2 cells toward center per second (vs base 1)

---

### Evolved Unit 3: World Sentinel (from Ancient Treant, T4 Warrior, Earth, Duelist)

**Evolved Passive "Deep Roots (Enhanced)"** (trigger: `combat_start` + `periodic`)
- Effect: Cannot be slowed at all (vs base 75% base move speed cap). Regen 2% max HP/sec while standing still (vs base 1.2%)
- Implementation:
  - At combat start: store `unit.baseMovespeed`
  - Slow application: CANNOT be slowed (immunity vs base cap at 75%)
  - Every tick standing still: `dealHealing(unit, unit, unit.maxHp * 0.02 * tickRate)` (vs base 0.012)

**Evolved Ability "Nature's Wrath (Enhanced)"** (Mana 80)
- Effect: Deal 300% ATK (vs base 220%), root 3s (vs base 2s), heal all Earth allies 25% of damage (vs base 15%)
- Implementation:
  - Select target
  - Deal 300% ATK (vs base 220)
  - Apply Root: `addStatus(target, 'root', 3, 0, unit)` (vs base 2s)
  - Calculate healing: `healAmount = damageDealt * 0.25` (vs base 0.15)
  - Find all Earth allies
  - Heal each

---

### Evolved Unit 4: Tempest Emperor (from Storm Sovereign, T4 Assassin, Lightning, Predator)

**Evolved Passive "Lightning Speed (Enhanced)"** (trigger: `on_attack`)
- Effect: First auto after repositioning guarantees crit AND applies 15% Slow for 3s
- Implementation:
  - Track `unit.repositioned = false`
  - On movement: set `unit.repositioned = true`
  - Next attack:
    - If repositioned: `unit.nextAttackCrit = true`, apply Slow: `addStatus(target, 'slow', 3, 15, unit)`, reset flag

**Evolved Ability "Thunder Cleave (Enhanced)"** (Mana 55)
- Effect: Teleport to lowest-HP enemy, deal 380% ATK (vs base 280%), splash extends to 2 cells (vs base adjacent), resets on kill
- Implementation:
  - Find lowest-HP alive enemy
  - Teleport to adjacent cell
  - Deal 380% ATK (vs base 280)
  - Find all enemies in 2-cell radius (vs base adjacent/4-8 way)
  - Deal 100% ATK splash to each
  - If target dies: reset ability cooldown (next cast ready)

---

### Evolved Unit 5: Roc of Storms (from Thunderbird, T4 Warrior, Lightning, Vanguard)

**Evolved Passive "Aerial Superiority (Enhanced)"** (trigger: `combat_start`)
- Effect: +30% ATK (vs base 20%), first attack guarantees crit and applies Slow 15% AS for 2s
- Implementation:
  - At combat start: grant ATK buff `addStatus(unit, 'atkBuff', 999, 30, unit)` (vs base 20)
  - Mark first attack: `unit.firstAttack = true`
  - On first attack: `unit.nextAttackCrit = true`, apply Slow: `addStatus(target, 'slow', 2, 15, unit)`

**Evolved Ability "Lightning Descent (Enhanced)"** (Mana 70)
- Effect: Dive to lowest-HP enemy 330% ATK (vs base 240%), chain damage extends to nearby, stun 1.5s (vs base 0.8s)
- Implementation:
  - Find lowest-HP alive enemy
  - Teleport to adjacent cell
  - Deal 330% ATK (vs base 240)
  - Chain: 60% ATK to nearest, 40% to next nearest in 2-cell radius
  - Find all enemies in 2-cell radius
  - Apply Stun: `addStatus(enemy, 'stun', 1.5, 0, unit)` (vs base 0.8s)

---

### Evolved Unit 6: War Architect (from Siege Engineer, T4 Mage, Force, Mystic)

**Evolved Passive "War Machine (Enhanced)"** (trigger: `on_attack`)
- Effect: Attacks ignore 25% target DR (vs base 15%) and apply 20% additional damage to targets hit
- Implementation:
  - On each attack:
    - Calculate target effective DR
    - Reduce by 25% (vs base 15%): `effectiveDr = Math.max(0, targetDr - 25)`
    - Also apply 20% additional damage multiplier: `totalDamage *= 1.2`

**Evolved Ability "Artillery Strike (Enhanced)"** (Mana 75)
- Effect: Target furthest enemy 380% ATK (vs base 280%), crater extends to 2-cell radius with 50% slow
- Implementation:
  - Find furthest alive enemy
  - Deal 380% ATK (vs base 280)
  - Create crater: 2-cell radius (expanded from base)
  - All enemies in crater apply Slow: `addStatus(enemy, 'slow', 3, 50, unit)` (vs base 40% slow)
  - Crater persists 3s

---

## Part 3d: Evolved T5 Legendary Units (6 Evolved Legendary Abilities + 6 Evolved Passives)

T5 evolved units keep `maxMana = 0` and still use the legendary ability system. Their evolved forms enhance both the innate passive AND the legendary ability.

### Evolved Unit 1: Eternal Phoenix (from Phoenix, T5 Mage, Fire, Mystic)

**Evolved Innate Passive "Eternal Flame (Enhanced)"** (trigger: `aura`)
- Effect: While alive, all Fire allies gain +20% ATK and +12% lifesteal (vs base 15% ATK, 8% lifesteal). On revival, aura extends to 3-cell range (vs base 2-cell) and grants +30% ATK, +16% lifesteal for 6s (doubled aura)
- Implementation:
  - Passive aura (always on while alive)
  - Find all Fire allies in 3-cell radius (vs base 2)
  - Base aura: grant `addStatus(ally, 'atkBuff', 999, 20, unit)` and `addStatus(ally, 'lifestealBuff', 999, 12, unit)` (vs base 15%, 8%)
  - After revival: set `unit.legendaryState.doubleAuraTimer = 6`
  - While doubleAuraTimer > 0: extend aura to 3-cell, grant 30% ATK + 16% lifesteal (doubled)
  - After timer expires: revert to base 20% ATK + 12% lifesteal

**Evolved Legendary Ability "Rebirth (Enhanced)"**
- Effect: On death, revive after 3s at 70% HP (vs base 50%). Explosion on revive deals 250% ATK (vs base 150%) in area. First revive always triggers; subsequent on kills (once per 4s)
- Implementation:
  - When Phoenix reaches HP = 0:
    - Set `unit.hp = 1`
    - Set `unit.legendaryState.revivePending = true`
    - Set `unit.legendaryState.reviveTimer = 3`
  - In processLegendaryPhoenix:
    - On reviveTimer <= 0:
      - Revive: `unit.hp = Math.floor(unit.maxHp * 0.7)` (vs base 0.5)
      - Find all enemies in 2-cell radius
      - Deal 250% ATK (vs base 150%)
      - Set next revive allowance: once per 4s after first

---

### Evolved Unit 2: Primordial Leviathan (from Leviathan, T5 Tank, Water, Guardian)

**Evolved Innate Passive "Abyssal Depths (Enhanced)"** (trigger: `periodic` every 7s)
- Effect: Every 7s (vs base 10s), submerge 2.5s (vs base 1.5s). On resurface, extend range to 2 cells, deal 120% ATK, apply 25% Slow
- Implementation:
  - Track `unit.legendaryState.submergeTimer = 0`
  - Every 7s (vs base 10s):
    - Set `unit.legendaryState.submergeActive = true`
    - Set `unit.legendaryState.submergeTimer = 2.5` (vs base 1.5)
  - While submerged: untargetable, cannot attack
  - On resurface:
    - Find all enemies in 2-cell radius (vs base adjacent/8-way)
    - Deal 120% ATK
    - Apply Slow: `addStatus(enemy, 'slow', 4, 25, unit)`

**Evolved Legendary Ability "Tidal Guardian (Enhanced)"**
- Effect: Water allies gain +15% max HP and +12% DR (vs base 12% max HP, 8% DR). Enemies hitting lose 8 mana. Start with 400 shield (vs base 200)
- Implementation:
  - At unit spawn: `grantShield(unit, unit, 400)` (vs base 200)
  - Aura: find all Water allies
    - `addStatus(ally, 'maxHpBuff', 999, 15, unit)` (vs base 12)
    - `addStatus(ally, 'drBuff', 999, 12, unit)` (same as base)
  - On-hit: when enemy hits Leviathan
    - Drain enemy mana: `enemy.mana = Math.max(0, enemy.mana - 8)` (unchanged)

---

### Evolved Unit 3: Yggdrasil (from World Tree, T5 Healer, Earth, Sage)

**Evolved Innate Passive "Roots of Life (Enhanced)"** (trigger: `aura` continuous)
- Effect: Allies heal 1.8% max HP/sec passively (vs base 1.2%), even if silenced/stunned. Passive heals apply at all times, even during combat disable
- Implementation:
  - Passive aura (always on)
  - Find all allies
  - Every tick: heal each `ally.maxHp * 0.018 * tickRate` (vs base 0.012)
  - Applies even during silence/stun (independent of passive processing)

**Evolved Legendary Ability "Bloom of Life (Enhanced)"** (trigger: `periodic` every 6s)
- Effect: Heal 4 lowest-HP nearby allies (vs base 3) for 350% ATK (vs base 250%). Overhealing converts to shield at 80% (vs base 60%). Earth allies gain +10% healing received
- Implementation:
  - Track `unit.legendaryState.bloomTimer = 0`
  - Every 6s (vs base 8s):
    - Find 4 lowest-HP allies (vs base 3)
    - Calculate healing: `unit.atk * 3.5` (vs base 2.5)
    - Apply healing: `dealHealing(unit, ally, healing)`
    - Calculate overheal: `overheal = healing - (ally.maxHp - ally.hp)`
    - If overheal > 0: `grantShield(unit, ally, overheal * 0.8)` (vs base 0.6)
  - Earth allies bonus:
    - `addStatus(earthAlly, 'healingReceivedBuff', 999, 10, unit)` (multiply all healing by 1.1)

---

### Evolved Unit 4: Dimensional Dragon (from Void Wyrm, T5 Mage, Wind, Mystic)

**Evolved Innate Passive "Reality Warp (Enhanced)"** (trigger: `on_attack`)
- Effect: Auto-attacks teleport target 2 cells (vs base 1) random direction and apply 15% Slow for 3s. Cooldown 3s per target (unchanged)
- Implementation:
  - Track `unit.legendaryState.teleportCooldowns = {}`
  - On each auto-attack hit:
    - Check cooldown
    - If no cooldown:
      - Pick random direction (8-way)
      - Teleport target 2 cells (vs base 1)
      - Apply Slow: `addStatus(target, 'slow', 3, 15, unit)` (new effect)
      - Set cooldown: 3s per target

**Evolved Legendary Ability "Dimensional Rift (Enhanced)"** (trigger: event-driven, on any ally ability cast)
- Effect: When any ally casts ability, fire 2 bolts (vs base 1) at random enemies for 120% ATK (vs base 90%)
- Implementation:
  - In executeAbility() at end:
    - Check if Void Wyrm alive on same team
    - Fire 2 bolts (vs base 1):
      - Select 2 random enemies
      - Deal 120% ATK to each (vs base 90)
    - Applies to all ally ability casts

---

### Evolved Unit 5: Thunder God (from Storm Dragon, T5 Mage, Lightning, Sorcerer)

**Evolved Innate Passive "Superconductor (Enhanced)"** (trigger: `aura` + `on_attack`)
- Effect: All Lightning allies gain +25% crit chance (vs base 18%). When Storm Dragon crits, all nearby Lightning allies gain +40% ATK (vs base 25%) for 3s and chain strike all enemies within 3 cells for 30% ATK
- Implementation:
  - Aura: find all Lightning allies
    - `addStatus(ally, 'critChanceBuff', 999, 25, unit)` (vs base 18)
  - On Storm Dragon crit:
    - Find all Lightning allies in 3-cell radius
    - Apply ATK buff: `addStatus(ally, 'atkBuff', 3, 40, unit)` (vs base 25)
    - Find all ENEMIES within 3-cell radius
    - Deal 30% ATK to each (new chain effect)

**Evolved Legendary Ability "Cataclysmic Storm (Enhanced)"** (trigger: `periodic` every 4.5s)
- Effect: Strike target with lightning 450% ATK (vs base 300%), chain to all nearby enemies. Chains crit at 50% chance
- Implementation:
  - Track `unit.legendaryState.stormTimer = 0`
  - Every 4.5s (vs base 6s):
    - Select target: highest-ATK enemy
    - Strike: deal 450% ATK (vs base 300)
    - Chain: find all enemies in 2-cell radius
    - For each chained: deal 150% ATK (proportional scaling)
    - 50% chance crit on chains

---

### Evolved Unit 6: Cosmic Titan (from Titan Lord, T5 Warrior, Force, Duelist)

**Evolved Innate Passive "Colossus (Enhanced)"** (trigger: `combat_start` + `on_attack`)
- Effect: +35% max HP (vs base 25%). Every 4th hit (vs base 5th) stuns target 1.5s (vs base 1s). First CC immunity extends through first 8s of combat (vs base single-use)
- Implementation:
  - At combat start:
    - Increase max HP: `unit.maxHp *= 1.35` (vs base 1.25)
    - Restore HP proportionally
    - Set `unit.legendaryState.firstCcImmunityTimer = 8` (vs base single-use)
  - Track `unit.hitCounter = 0`
  - On each attack:
    - Increment counter
    - If counter % 4 == 0 (vs base % 5):
      - Stun target: `addStatus(target, 'stun', 1.5, 0, unit)` (vs base 1s)
      - Reset counter
  - When CC applied:
    - If firstCcImmunityTimer > 0: cancel CC, decrement timer
    - Otherwise: apply normally

**Evolved Legendary Ability "Earthshaker (Enhanced)"** (trigger: `periodic` every 5.5s)
- Effect: Slam ground 480% ATK (vs base 320%) in area (2-cell radius). Root enemies 3s (vs base 2s), apply +20% damage taken (vs base unchanged). Force allies gain +15% ATK for 6s (vs base 5s)
- Implementation:
  - Track `unit.legendaryState.shakeTimer = 0`
  - Every 5.5s (vs base 7s):
    - Slam at Titan location
    - Find all enemies in 2-cell radius
    - Deal 480% ATK (vs base 320)
    - Apply Root: `addStatus(enemy, 'root', 3, 0, unit)` (vs base 2s)
    - Apply vulnerability: `addStatus(enemy, 'vulnerabilityDebuff', 6, 20, unit)` (duration 6s vs base 5s)
    - Find all Force allies
    - Apply ATK buff: `addStatus(ally, 'atkBuff', 6, 15, unit)` (vs base 5s duration)

---

## Part 4: Integration & Helper Functions

### Passive Reentry Guard
Add to all passive execution:
```javascript
if (unit._processingPassive) return; // Already processing this unit
unit._processingPassive = true;
// ... passive logic
unit._processingPassive = false;
```

This prevents infinite loops from damage → on_hit passive → more damage → on_hit, etc.

### T5 Initialization Hook
In `setupUnit()` or `initCombat()`:
```javascript
if (unit.maxMana === 0) {
    unit.legendaryState = {
        revivePending: false,
        reviveTimer: 0,
        reviveCount: 0,
        lastKillTime: 0,
        submerged: false,
        submergeTimer: 0,
        periodicTimer: 0,
        customData: {}
    };
}
```

### Death & Revive Hook (Phoenix)
In `dealDamage()`, before marking unit as dead:
```javascript
if (unit.hp <= 0 && unit.templateKey === 'phoenix' && unit.legendaryState.reviveCount === 0) {
    unit.hp = 1; // Keep alive for revive logic
    unit.legendaryState.revivePending = true;
    unit.legendaryState.reviveTimer = 3;
    return; // Don't process death yet
}
```

### Ability Cast Hook (Void Wyrm)
At end of `executeAbility()`:
```javascript
// After ability execution and effects resolve
if (casterTeam) {
    var voidWyrm = findUnitByTemplate('voidWyrm', casterTeam);
    if (voidWyrm && voidWyrm.hp > 0) {
        var randomEnemy = getRandomAlive(getEnemies(casterTeam));
        if (randomEnemy) {
            dealDamage(voidWyrm, randomEnemy, voidWyrm.atk * 0.9);
        }
    }
}
```

### Target Selection Helpers
Ensure these exist in codebase:
- `getLowestHpUnits(units, count)` — returns N lowest-HP units
- `getHighestAtkUnits(units, count)` — returns N highest-ATK units
- `getFurthestEnemy(unit, enemies)` — returns enemy furthest from unit
- `getRandomAlive(units)` — returns random alive unit
- `getUnitsInRadius(centerUnit, radius, team)` — returns units in cell radius
- `findEmptyCellNear(x, y)` — returns empty adjacent cell or null

### Status Effect Standardization
Ensure all status effects used are in PASSIVE_DATA or ABILITY_DATA:
- `burn` (DPS periodic)
- `slow` (AS reduction)
- `root` (movement disable)
- `stun` (action disable)
- `silence` (ability disable)
- `taunt` (forced target)
- `dodge` (miss chance)
- `atkBuff` (ATK increase)
- `atkMod` (ATK reduction)
- `drBuff` (DR increase)
- `drReduction` (DR decrease)
- `lifesteal` (heal on damage)
- `shield` (damage absorption)
- `misschance` (hit miss)
- `vulnerabilityDebuff` (damage taken increase)
- `reflect` (damage return)

---

## Part 5: Testing Checklist

**Unit Execution**
- [ ] All 12 T3 base abilities execute without errors
- [ ] All 12 T3 evolved abilities execute without errors
- [ ] All 6 T4 base abilities execute without errors
- [ ] All 6 T4 evolved abilities execute without errors
- [ ] All 6 T5 base legendary abilities trigger on correct timers/events
- [ ] All 6 T5 evolved legendary abilities trigger correctly with enhancements
- [ ] No console errors during execution

**Passive Functionality — Base T3-T5**
- [ ] Pyromancer: Burn duration extends by 50%, DPS increases 20%
- [ ] Inferno Fox: Fire trail spawns and deals damage correctly
- [ ] Tidal Shaman: Heals apply slow to nearest enemy
- [ ] Riptide Blade: 25% proc grants ATK buff to self
- [ ] Golem: Cannot be knocked back, takes 12% less AoE damage
- [ ] Terra Sage: Nearest ally gains shield after ability cast
- [ ] Monsoon Caller: Kills grant wind allies ATK speed (max 4 stacks)
- [ ] Wind Duelist: Dodge stacks increase per attack (max 5), reset on ability
- [ ] Ball Lightning: Orbs spawn periodically, deal DPS, apply vulnerability
- [ ] Thunder Warden: Crits against it trigger stun or are converted
- [ ] Gladiator: Every 3rd attack grants 40% ATK bonus
- [ ] Fortress: Cannot be rooted/stunned/slowed below base move speed
- [ ] Fire Dragon: Aura applies 20 DPS to nearby enemies continuously
- [ ] Kraken: Ink cloud periodic, reduces enemy hit chance
- [ ] Ancient Treant: Cannot be slowed below 75% speed, heals while standing still
- [ ] Storm Sovereign: First attack after move guarantees crit
- [ ] Thunderbird: Gains 20% ATK, first attack guaranteed crit
- [ ] Siege Engineer: Attacks ignore 15% target DR

**Passive Functionality — Evolved T3**
- [ ] Arcane Inferno: Burn duration extends by 70%, DPS increases 35%
- [ ] Ninetail Blaze: Fire trail lasts 4s, deals 30 DPS, applies Burn
- [ ] Stormtide Oracle: Heals apply 18% Slow to 2 nearest enemies
- [ ] Tsunami Warlord: 35% proc grants +40% ATK to self
- [ ] Iron Colossus: Cannot be knocked back, takes 18% less AoE damage
- [ ] Earthweaver: Nearest ally gains 25% max HP shield after ability cast
- [ ] Tempest Lord: Kills grant Wind allies ATK speed (max 6 stacks, 7s duration)
- [ ] Hurricane Blade: Dodge stacks grant 8% per stack (max 8, 64% dodge)
- [ ] Plasma Core: Orbs last 8s, deal 25 DPS, bounce between enemies, +18% damage taken
- [ ] Storm Fortress: Crits converted to 1s stuns with 20% damage reflection
- [ ] Champion: Every 2 attacks grants +60% ATK bonus
- [ ] Citadel: Immunity to all CC effects

**Passive Functionality — Evolved T4**
- [ ] Elder Wyrm: Aura applies 35 DPS at 3-cell range
- [ ] Abyssal Terror: Ink cloud at 3-cell radius triggers every 10s
- [ ] World Sentinel: Cannot be slowed, heals 2% max HP/sec while standing still
- [ ] Tempest Emperor: First attack after move guarantees crit and applies Slow
- [ ] Roc of Storms: Gains 30% ATK, first attack guarantees crit and applies Slow
- [ ] War Architect: Attacks ignore 25% DR and apply 20% bonus damage

**T5 Legendary Abilities — Base**
- [ ] Phoenix: Revives after 3s at 50% HP, deals 150% AoE on revive
- [ ] Phoenix: Eternal Flame aura applies 15% ATK + 8% lifesteal to Fire allies
- [ ] Phoenix: Double aura (30% ATK, 16% lifesteal) for 6s after revive
- [ ] Leviathan: Submerges every 10s, untargetable for 1.5s
- [ ] Leviathan: Resurface deals 120% ATK + slow to adjacent enemies
- [ ] Leviathan: Tidal Guardian aura gives Water allies 12% HP, 8% DR
- [ ] Leviathan: Enemies hitting lose 8 mana
- [ ] World Tree: Aura heals all allies 1.2% max HP/sec (even when silenced)
- [ ] World Tree: Bloom periodic heals 3 lowest-HP allies, converts overheal to shield
- [ ] World Tree: Earth allies gain 10% healing received bonus
- [ ] Void Wyrm: Attacks teleport target 1 cell random direction (3s cooldown per target)
- [ ] Void Wyrm: Dimensional Rift fires bolt when any ally casts ability
- [ ] Storm Dragon: Superconductor aura gives Lightning allies 18% crit chance
- [ ] Storm Dragon: Crit grants nearby Lightning allies 25% ATK for 3s
- [ ] Storm Dragon: Cataclysmic Storm periodic mega-strike chains to nearby enemies
- [ ] Titan Lord: Colossus increases max HP 25%, starts with immunity to first CC
- [ ] Titan Lord: Every 5th hit stuns target 1s
- [ ] Titan Lord: Earthshaker periodic slam roots enemies, applies vulnerability
- [ ] Titan Lord: Force allies gain ATK buff from slam

**T5 Evolved Legendary Abilities**
- [ ] Eternal Phoenix: Revives at 70% HP, deals 250% AoE on revive
- [ ] Eternal Phoenix: Aura extends to 3-cell range, grants 20% ATK + 12% lifesteal
- [ ] Eternal Phoenix: Enhanced double aura (30% ATK, 16% lifesteal) for 6s after revive
- [ ] Primordial Leviathan: Submerges every 7s, untargetable for 2.5s
- [ ] Primordial Leviathan: Resurface at 2-cell range deals 120% ATK + 25% Slow
- [ ] Primordial Leviathan: Enhanced aura gives Water allies 15% max HP, 12% DR, starts with 400 shield
- [ ] Yggdrasil: Aura heals all allies 1.8% max HP/sec, applies at all times
- [ ] Yggdrasil: Bloom heals 4 lowest-HP allies for 350% ATK, overhealing shields at 80%
- [ ] Yggdrasil: Enhanced blooms trigger every 6s
- [ ] Dimensional Dragon: Attacks teleport target 2 cells and apply 15% Slow
- [ ] Dimensional Dragon: Dimensional Rift fires 2 bolts at 120% ATK when allies cast
- [ ] Thunder God: Enhanced Superconductor aura gives Lightning allies 25% crit chance
- [ ] Thunder God: Crit grants nearby Lightning allies 40% ATK and chain strikes enemies
- [ ] Thunder God: Cataclysmic Storm triggers every 4.5s, deals 450% ATK
- [ ] Cosmic Titan: Colossus increases max HP 35%, first CC immunity for first 8s
- [ ] Cosmic Titan: Every 4th hit stuns target 1.5s
- [ ] Cosmic Titan: Earthshaker triggers every 5.5s, deals 480% ATK, roots 3s
- [ ] Cosmic Titan: Enhanced Force ally ATK buff lasts 6s

**Integration & Edge Cases**
- [ ] No infinite loops from passive chains (reentry guard works)
- [ ] T5 units never gain mana or call executeAbility()
- [ ] Phoenix death/revive doesn't cause game state errors
- [ ] Leviathan untargetable state properly blocks targeting system
- [ ] Void Wyrm bolt fires for all ally ability casts, not just T5s
- [ ] Status effects stack and refresh correctly
- [ ] Shield values calculated correctly (overheal conversion, grant amounts)
- [ ] Aura effects apply to correct team/element
- [ ] All timers decrement properly in combatTick
- [ ] Grid movement/teleport works with occupied cells

**Performance**
- [ ] Full combat with 3 T3 + 1 T4 + 1 T5 per side runs smoothly
- [ ] No lag spikes from passive periodic execution
- [ ] Console reports no memory leaks from tracked state

---

## Code Modification Checklist

**In `ABILITY_DATA` object**:
1. Add entries for all 12 T3 base units
2. Add entries for all 12 T3 evolved units (enhanced abilities)
3. Add entries for all 6 T4 base units
4. Add entries for all 6 T4 evolved units (enhanced abilities)
5. Add entries for all 6 T5 base units (note: maxMana = 0, dummy ability entry)
6. Add entries for all 6 T5 evolved units (note: maxMana = 0, dummy ability entry)

**In `PASSIVE_DATA` object**:
1. Add entries for all 12 T3 base passives
2. Add entries for all 12 T3 evolved passives (enhanced)
3. Add entries for all 6 T4 base passives
4. Add entries for all 6 T4 evolved passives (enhanced)
5. Add entries for all 6 T5 base innate passives
6. Add entries for all 6 T5 evolved innate passives (enhanced)

**In `executeAbility()` function**:
1. Add switch cases for all 12 T3 abilities
2. Add switch cases for all 6 T4 abilities
3. DO NOT add T5 cases (they don't use mana-based abilities)
4. Add Void Wyrm hook at end: fire bolt when ally casts

**In `processTickPassives()` function**:
1. Route to appropriate passive handlers (on_attack, on_hit, periodic, etc.)
2. Ensure reentry guard is in place

**In `combatTick()` function**:
1. After `processTickPassives()`, add call to `processLegendaryAbilities()`

**In `setupUnit()` or `initCombat()` function**:
1. Initialize T5 legendary state for all maxMana = 0 units

**In `dealDamage()` function**:
1. Add hook for Phoenix revive logic before marking dead

**New Functions to Add**:
- `processLegendaryAbilities(allUnits, dt)`
- `executeLegendaryAbility(unit, abilityData, dt)`
- `executeLegendaryPhoenix(unit, dt)`
- `executeLegendaryLeviathan(unit, dt)`
- `executeLegendaryWorldTree(unit, dt)`
- `executeLegendaryVoidWyrm(unit, dt)`
- `executeLegendaryStormDragon(unit, dt)`
- `executeLegendaryTitanLord(unit, dt)`

---

## Success Criteria

1. **Completeness**: All 48 T3-T5 abilities (24 base + 24 evolved) exist in codebase and execute without errors
2. **Passive Integration**: All 48 T3-T5 passives (24 base + 24 evolved) correctly wired into passive framework
3. **Evolved Forms**: All 24 evolved T3-T5 units properly enhance both passive and ability from base form
4. **T5 Legendary System**: T5 units (base and evolved) never call executeAbility(), only process legendary abilities
5. **T5 Enhanced Legends**: All 6 evolved T5 legendary passives and abilities execute with proper stat enhancements
6. **Specific Mechanics**: Phoenix revive (50%→70%), Leviathan submerge (10s→7s), Void Wyrm trigger (1 bolt→2 bolts) all work with evolved enhancements
7. **Code Standards**: All changes in var/global scope, no let/const/arrow functions, no imports
8. **Testing**: Full combat scenario with mixed base + evolved T3-T5 units runs without console errors or infinite loops
9. **Performance**: Combat remains responsive with all passives (base + evolved) + legendary abilities active

---

**End of Prompt 19b**

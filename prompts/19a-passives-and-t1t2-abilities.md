# Phase 2, Chunk 3a: Innate Passive Framework & T1-T2 Ability Implementations

**Phase**: 2 (Core Systems)
**Status**: Ready for Implementation
**Scope**: Passive trigger system + T1 base/evolved + T2 base/evolved abilities
**Dependencies**: Prompt 17 (basic unit structure), Prompt 18 (units.js with PASSIVE_DATA & EVOLVED_PASSIVE_DATA)
**File**: `main-v2.js`
**Code Standard**: `var` only, NO `let`/`const`/arrow functions, NO ES modules

---

## Implementation Overview

This phase introduces two major systems:

1. **Innate Passive Framework** (`processPassives()`) — Data-driven dispatch system for 6 trigger types
2. **Refactored Ability System** — Organized switch/case for 72 total abilities (21 T1 base + 21 T1 evolved + 15 T2 base + 15 T2 evolved)

All passive and ability execution hooks into the combat loop without breaking existing functionality.

---

## System 1: Innate Passive Framework

### Architecture

The passive system reads PASSIVE_DATA and EVOLVED_PASSIVE_DATA (defined in units.js by prompt 18) and dispatches based on trigger type. Each unit gets a `passiveState` object at combat init for tracking per-unit state (stacks, cooldowns, etc.).

**Trigger Types**:
- `combat_start` — fires once at start of combat (in `initCombat()` after units placed)
- `on_attack` — fires each time unit auto-attacks (hook into attack resolution)
- `on_hit` — fires when unit takes damage (hook into `dealDamage()`)
- `on_kill` — fires when unit gets a kill (hook into kill detection)
- `periodic` — fires every N seconds (tracked via `unit.passiveTimers`)
- `aura` — fires each combat tick (0.1s), checking nearby units

### Core Functions

#### Helper: Get Passive Data (Evolved vs Base)

```javascript
function getPassiveData(unit) {
    // Evolved units check EVOLVED_PASSIVE_DATA first
    if (unit.isEvolved && EVOLVED_PASSIVE_DATA[unit.templateKey]) {
        return EVOLVED_PASSIVE_DATA[unit.templateKey];
    }
    // Fall back to base passive data
    return PASSIVE_DATA[unit.templateKey] || null;
}
```

#### Initialize Unit Passive State

Called once per unit at combat start (in `initCombat()` after unit placement):

```javascript
function initUnitPassiveState(unit) {
    unit.passiveState = {
        attackCount: 0,        // for on_attack interval tracking
        stacks: 0,             // for stack-based passives
        lastTarget: null,      // for consecutive-hit tracking
        cooldownTimer: 0,      // for periodic cooldown management
        triggered: false,      // for one-shot passives
        customData: {}         // extensible object for special data
    };
    unit.passiveTimers = unit.passiveTimers || {};  // periodic timers by key
}
```

#### Process Combat Start Passives

Called once in `initCombat()` after all units placed:

```javascript
function processCombatStartPassives(allUnits) {
    for (var i = 0; i < allUnits.length; i++) {
        var unit = allUnits[i];
        if (unit.hp <= 0) continue;
        var passiveData = getPassiveData(unit);
        if (!passiveData || passiveData.trigger !== 'combat_start') continue;

        executeCombatStartPassive(unit, passiveData, allUnits);
    }
}
```

#### Process Tick Passives (Periodic & Aura)

Called each `combatTick()` (every 0.1s):

```javascript
function processTickPassives(allUnits, dt) {
    for (var i = 0; i < allUnits.length; i++) {
        var unit = allUnits[i];
        if (unit.hp <= 0) continue;
        var passiveData = getPassiveData(unit);
        if (!passiveData) continue;

        if (passiveData.trigger === 'periodic') {
            processPeriodicPassive(unit, passiveData, dt);
        } else if (passiveData.trigger === 'aura') {
            processAuraPassive(unit, passiveData, allUnits);
        }
    }
}
```

#### Process On-Attack Passive

Called when unit auto-attacks (hook into attack resolution code):

```javascript
function processOnAttackPassive(attacker, target, allUnits) {
    // Guard against reentry
    if (attacker._processingPassive) return;

    var passiveData = getPassiveData(attacker);
    if (!passiveData || passiveData.trigger !== 'on_attack') return;

    attacker._processingPassive = true;
    executeOnAttackPassive(attacker, target, passiveData, allUnits);
    attacker._processingPassive = false;
}
```

#### Process On-Hit Passive

Called when unit takes damage (hook into `dealDamage()`):

```javascript
function processOnHitPassive(defender, attacker, damage, allUnits) {
    // Guard against reentry
    if (defender._processingPassive) return;

    var passiveData = getPassiveData(defender);
    if (!passiveData || passiveData.trigger !== 'on_hit') return;

    defender._processingPassive = true;
    executeOnHitPassive(defender, attacker, damage, passiveData, allUnits);
    defender._processingPassive = false;
}
```

#### Process On-Kill Passive

Called when unit gets a kill (hook into kill detection):

```javascript
function processOnKillPassive(killer, victim, allUnits) {
    // Guard against reentry
    if (killer._processingPassive) return;

    var passiveData = getPassiveData(killer);
    if (!passiveData || passiveData.trigger !== 'on_kill') return;

    killer._processingPassive = true;
    executeOnKillPassive(killer, victim, passiveData, allUnits);
    killer._processingPassive = false;
}
```

### Hook Points in Existing Code

1. **In `initCombat()`** after unit placement loop:
   ```javascript
   // After all units placed and positioned
   for (var i = 0; i < combatState.allUnits.length; i++) {
       initUnitPassiveState(combatState.allUnits[i]);
   }
   processCombatStartPassives(combatState.allUnits);
   ```

2. **In `combatTick()`** after existing state updates:
   ```javascript
   processTickPassives(combatState.allUnits, TICK_INTERVAL);
   ```

3. **In attack resolution code** (where auto-attack damage is applied):
   ```javascript
   // After determining damage but before dealing it
   processOnAttackPassive(attacker, target, combatState.allUnits);
   // Then deal damage
   var result = dealDamage(attacker, target, damageAmount, opts);
   ```

4. **In `dealDamage()`** right before the damage is subtracted:
   ```javascript
   // Guard reentry
   if (!attacker || attacker._processingPassive) {
       target.hp -= damage;
   } else {
       // Call passive handler
       processOnHitPassive(target, attacker, damage, combatState.allUnits);
       target.hp -= damage;
   }
   ```

5. **In kill detection code** (where `target.hp <= 0` is detected):
   ```javascript
   if (target.hp <= 0 && !target._dead) {
       target._dead = true;
       processOnKillPassive(attacker, target, combatState.allUnits);
       // Continue with existing death logic
   }
   ```

---

## System 2: Ability Implementations (T1 + T2 Base & Evolved)

### Overview

All 72 abilities are implemented in the existing `executeAbility()` switch statement. Keep the structure but:
- **Replace** any old T1-T2 cases entirely (do not append)
- Organize by element and tier for clarity
- Use existing combat helpers: `dealDamage`, `addStatus`, `grantShield`, `dealHealing`, `getUnitsInRadius`, `getLowestHpUnits`, `getFurthestEnemy`, `findEmptyCellNear`, `moveUnitToCell`, `getUnitsInRow`, `getRandomAlive`, `getManhattanDist`, `flashAbilityCells`, `addCombatLog`

### Key Implementation Notes

**ATK Calculation with Buffs**:
```javascript
var atk = caster.attack;
var atkBuffVal = getStatusValue(caster, 'atkBuff');
var atkModVal = getStatusValue(caster, 'atkMod');
if (atkBuffVal !== 0 || atkModVal !== 0) {
    atk = Math.floor(atk * (1 + atkBuffVal) * (1 + atkModVal));
}
```

**Kill Detection Pattern**:
```javascript
var result = dealDamage(caster, target, amount, opts);
if (result.killed) {
    // Trigger on_kill passive here
    processOnKillPassive(caster, target, combatState.allUnits);
    // Handle kill logic
}
```

**Ability Buffs Tracking** (per-unit state):
```javascript
// At ability execution, set flags on unit.abilityBuffs for per-ability enhancements
caster.abilityBuffs = caster.abilityBuffs || {};
caster.abilityBuffs.empoweredShot = true;  // Next auto-attack deals bonus damage
```

**Flash Cells for Visual Feedback**:
```javascript
flashAbilityCells([{row: targetRow, col: targetCol}], '#FF6B00', 300);
```

**Status Application**:
- Burn: `addStatus(target, 'burn', durationSec, dpsValue, caster)`
- Slow: `addStatus(target, 'slow', durationSec, percentageValue, caster)`
- Root: `addStatus(target, 'root', durationSec, 0, caster)`
- Stun: `addStatus(target, 'stun', durationSec, 0, caster)`
- ATK Buff: `addStatus(target, 'atkBuff', durationSec, percentageValue, caster)`
- Dodge Buff: `addStatus(target, 'dodgeBuff', durationSec, percentageValue, caster)`

---

## T1 Base Units (21 Abilities)

### FIRE T1

**flame_warrior** (`flame_warrior` ability)
- Slash forward in cone: damage target + adjacent cells (3-cell radius)
- Damage: 150% ATK to each
- Apply Burn (15 DPS, 3s duration)
- Visual: Flash target + adjacent in orange

**ember_scout** (`ember_scout` ability)
- Dash to position behind target using `getFurthestEnemy()`
- Damage: 200% ATK to target
- Apply Burn (10 DPS, 3s)
- On kill: refund 30 mana (add to caster.mana)
- Visual: Dash animation + fire flash

**cinder_archer** (`cinder_archer` ability)
- Empower next auto-attack with 180% ATK bonus
- Set `caster.abilityBuffs.empoweredShot = true`
- On next auto-attack hit: apply Burn (15 DPS, 3s)
- Clear flag after use
- Visual: Charge-up effect on caster

**fire_acolyte** (`fire_acolyte` ability)
- Heal lowest-HP ally for 140% ATK
- If healed ally below 35% HP, heal 220% ATK instead
- Apply Burn (8 DPS, 2s) to nearest enemy to healed unit
- Visual: Green heal + fire flash on nearest enemy

### WATER T1

**tide_hunter** (`tide_hunter` ability)
- Slash in cone: damage target + adjacent
- Damage: 160% ATK each
- Apply Slow (15% AS slow, 3s) to all hit
- Visual: Blue slash effect

**frost_archer** (`frost_archer` ability)
- Shoot freeze projectile at target
- Damage: 170% ATK
- Apply Slow (20% AS slow, 3s)
- Grant slowed targets 15% increased damage taken for 4s (use `addStatus(target, 'dmgTakenBuff', 4s, 0.15)`)
- Visual: Blue projectile + chill effect

**reef_stalker** (`reef_stalker` ability)
- Teleport behind target using `getFurthestEnemy()`
- Damage: 220% ATK
- If target is Slowed: deal 280% ATK instead and reset dash cooldown (set `caster.dashResetCounter = 0`)
- Visual: Teleport shimmer + water splash

### EARTH T1

**stone_guard** (`stone_guard` ability)
- Gain Shield 28% max HP for self
- Grant all allies within 2 cells radius Shield 15% max HP each
- Visual: Stone shield graphic on all affected

**bramble_knight** (`bramble_knight` ability)
- Slash nearby enemies dealing 140% ATK
- Stun hit targets for 1s
- Gain Shield 18% max HP for self
- Grant nearby allies (2 cells) Shield 10% max HP
- Visual: Brown/green slash + stun markers

**seedling_archer** (`seedling_archer` ability)
- Shoot dealing 160% ATK
- Root target for 1.5s
- Gain +15% ATK per rooted enemy on field for 4s (search allUnits for 'root' status, count, apply atkBuff)
- Visual: Green root vines + ATK buff aura

### WIND T1

**zephyr_scout** (`zephyr_scout` ability)
- Dash to target dealing 210% ATK
- Grant self 25% dodge for 3s (use `addStatus(caster, 'dodgeBuff', 3s, 0.25)`)
- Visual: Swift dash + wind shimmer

**wind_archer** (`wind_archer` ability)
- Shoot arrow piercing through enemies
- Damage: 170% ATK to each enemy in line
- Grant self +18% ATK speed for 4s (use `addStatus(caster, 'atkSpeedBuff', 4s, 0.18)`)
- Visual: Piercing arrow + wind effect

**gale_dancer** (`gale_dancer` ability)
- Heal 2 lowest-HP allies for 140% ATK each
- Grant all affected +12% ATK speed for 4s
- Visual: Green heals + speed aura

**wind_squire** (`wind_squire` ability)
- Slash nearby enemies for 140% ATK
- Grant self + all nearby allies (2.5 cells) +15% move speed for 4s
- Visual: Wind slash + speed buff indicators

### LIGHTNING T1

**spark_fencer** (`spark_fencer` ability)
- Slash with arc: damage target + adjacent
- Damage: 150% ATK each
- If striking near another Lightning unit on team (within 3 cells), add 18% damage bonus and chain 60 flat damage to 1 nearby enemy
- Apply chain bonus status 3s for damage tracking
- Visual: Electric slash + chain arcs

**volt_runner** (`volt_runner` ability)
- Dash through target dealing 210% ATK
- Add chain damage bonus (apply status for tracking)
- If attack crits, reset dash cooldown
- Grant self +20% crit chance for 2s (stacks per dash)
- Visual: Electric dash + crackle effects

**thunder_archer** (`thunder_archer` ability)
- Lightning arrow chains to enemies
- Damage: 170% ATK to each enemy hit
- Chains automatically to nearby enemies (within 3 cells) for 4s
- Visual: Lightning projectile + chain arcs

**pulse_mender** (`pulse_mender` ability)
- Heal lowest-HP ally for 145% ATK
- Chain heal to 1 nearby ally for 80% ATK
- Grant both healed allies +8% crit chance for 3s
- Visual: Yellow heal waves + crit markers

### FORCE T1

**iron_soldier** (`iron_soldier` ability)
- Punch dealing 160% ATK
- Grant all nearby allies (2 cells) +12% ATK for 3s
- Visual: Heavy punch + buff aura

**shadow_blade** (`shadow_blade` ability)
- Dash to target dealing 220% ATK
- If caster below 40% HP: guaranteed crit (deal 340% ATK instead)
- Visual: Dark dash + crit spark

**steel_archer** (`steel_archer` ability)
- Pierce all enemies in line dealing 170% ATK each
- Apply 18% DR reduction to hit enemies for 4s (use `addStatus(target, 'drReduction', 4s, 0.18)`)
- Visual: Heavy pierce + armor break effect

---

## T1 Evolved Units (21 Abilities)

### FIRE EVOLVED

**fire_berserker** (`fire_berserker` ability)
- Enhanced `flame_warrior`: Slash target + adjacent
- Damage: 200% ATK (vs 150% base)
- Apply Burn (25 DPS, 4s) (vs 15 DPS, 3s base)
- Visual: Larger orange slash

**flame_rogue** (`flame_rogue` ability)
- Enhanced `ember_scout`: Dash behind target
- Damage: 250% ATK (vs 200% base)
- Leave fire trail at start position (25 DPS, 3s area effect)
- On kill: refund 40 mana (vs 30 base)
- Visual: Swift orange dash + fire trail

**cinder_marksman** (`cinder_marksman` ability)
- Enhanced `cinder_archer`: Fire 2 arrows instead of empowering next
- Each arrow: 120% ATK
- Apply Burn (15 DPS, 3s) to each target
- Grant passive 20% bonus damage to burning targets for 4s
- Visual: Double arrow fire

**ember_saint** (`ember_saint` ability)
- Enhanced `fire_acolyte`: Heal lowest-HP ally 160% ATK (vs 140% base)
- Grant healed ally +15% ATK for 4s
- Burn nearest enemy (15 DPS, 3s)
- Visual: Healing aura + burn spread

### WATER EVOLVED

**tsunami_blade** (`tsunami_blade` ability)
- Enhanced `tide_hunter`: Slash forward in line
- Damage to all targets in line
- Apply 20% Slow (vs 15% base)
- Heal self for 30% of damage dealt
- Visual: Large blue tsunami wave

**ice_sniper** (`ice_sniper` ability)
- Enhanced `frost_archer`: Chill chance (35% vs 25% base)
- Frost Shot applies 25% Slow (vs 20% base)
- Slowed targets take 12% more damage (vs 15% base vulnerability but different mechanic)
- Visual: Icy projectile + chill crystals

**tidal_phantom** (`tidal_phantom` ability)
- Enhanced `reef_stalker`: After dash gain 35% dodge for 2s (vs no dodge base)
- Gain stealth for 2s (untargetable)
- Guaranteed crit vs Slowed enemies (120% crit multiplier)
- Visual: Watery shimmer + stealth effect

### EARTH EVOLVED

**mountain_lord** (`mountain_lord` ability)
- Enhanced `stone_guard`: Fortify stacks +5% DR per ally (max 25%)
- Shield self 35% max HP (vs 28% base)
- Shield allies 18% max HP (vs 15% base)
- DR stacks transfer to allies in radius
- Visual: Massive stone barriers

**ironwood_sentinel** (`ironwood_sentinel` ability)
- Enhanced `bramble_knight`: Thorns scale with missing HP (up to 25 damage per hit)
- Stun 1.5s (vs 1s base)
- Shield all nearby allies
- Visual: Jagged thorns + stun effect

**thornwood_ranger** (`thornwood_ranger` ability)
- Enhanced `seedling_archer`: Overgrowth stacks +5% ATK per stack
- Root 2s (vs 1.5s base)
- Apply 15% Slow to rooted enemies
- Visual: Thick root vines + growth effect

### WIND EVOLVED

**storm_assassin** (`storm_assassin` ability)
- Enhanced `zephyr_scout`: Windwalk grants 45% move speed + 20% dodge (vs 25% dodge base)
- Swift Slash resets on kill
- Visual: Swift purple dash + wind tornado

**gale_sniper** (`gale_sniper` ability)
- Enhanced `wind_archer`: Tailwind grants +8% ATK speed per Wind ally
- Pierce all enemies in line
- Grant all hit enemies -20% move speed for 3s
- Grant self dodge buff 20% for 3s
- Visual: Piercing arrow + wind gust

**stormweaver** (`stormweaver` ability)
- Enhanced `gale_dancer`: Zephyr's Grace grants 35% move speed
- Heal 3 lowest-HP allies 150% ATK each
- Grant +18% ATK speed for 4s
- Visual: Multi-target heals + speed auras

**zephyr_warrior** (`zephyr_warrior` ability)
- Enhanced `wind_squire`: Momentum stacks (5 max, 40% ATK speed per stack vs none base)
- Gust Slash grants 20% ATK speed to self + allies
- Slash nearby enemies for increased range (3 cells)
- Visual: Spiraling wind attack + momentum counter

### LIGHTNING EVOLVED

**arc_duelist** (`arc_duelist` ability)
- Enhanced `spark_fencer`: Static Charge grants 25% bonus damage to 2 targets
- Crackle chains scale with synergy (add 5% per other Lightning ally)
- Damage: 180% ATK base (vs 150%)
- Visual: Double arc + synergy counter

**lightning_phantom** (`lightning_phantom` ability)
- Enhanced `volt_runner`: Dash Chain grants +25% crit +10% move speed per stack
- Volt Dash hits twice on crit
- Reset dash if kills
- Visual: Double dash + crit sparks

**storm_archer** (`storm_archer` ability)
- Enhanced `thunder_archer`: Charged Shot every 2 attacks
- Chains to 2 enemies instead of 1
- Lightning Arrow pierces + resets on crit
- Damage: 200% ATK (vs 170%)
- Visual: Heavy lightning projectile + chain arcs

**storm_medic** (`storm_medic` ability)
- Enhanced `pulse_mender`: Defibrillator grants +12% crit +5% ATK speed
- Heal lowest-HP ally 160% ATK
- Chain heals to 2 allies (vs 1 base)
- Grant all healed +10% crit for 4s
- Visual: Electric healing waves

### FORCE EVOLVED

**legionnaire** (`legionnaire` ability)
- Enhanced `iron_soldier`: Iron Skin grants 8% DR per ally +5% HP
- Power Strike applies 15% DR reduction to enemies
- Punch dealing 200% ATK (vs 160%)
- Grant nearby allies +15% ATK (vs 12%)
- Visual: Armored punch + buff aura

**night_stalker** (`night_stalker` ability)
- Enhanced `shadow_blade`: Shadow Step grants 35% move speed +20% dodge
- Killing Blow resets on kill, grants 12% lifesteal
- Dash dealing 280% ATK (vs 220%)
- Below 40% HP = guaranteed crit (360% vs 340%)
- Visual: Dark swift dash + lifesteal aura

**ballista_archer** (`ballista_archer` ability)
- Enhanced `steel_archer`: Steady Aim grants +10% damage per second standing still (max 50%)
- Pierce 2 arrows (vs 1)
- Apply 25% DR reduction (vs 18%)
- Damage: 200% ATK each (vs 170%)
- Visual: Heavy multi-piercing + aim-up effect

---

## T2 Base Units (15 Abilities)

### FIRE T2

**magma_knight** (`magma_knight` ability)
- Explode dealing 160% ATK to nearby enemies (2.5-cell radius)
- Apply Burn (20 DPS, 3s)
- Gain Shield 20% max HP for self
- Visual: Magma explosion + fire effects

**blaze_lancer** (`blaze_lancer` ability)
- Dash forward dealing 180% ATK
- Apply Burn (12 DPS, 3s)
- Reset Momentum stacks (set `caster.momentumStacks = 0`)
- Consecutive hits same target: +8% damage per stack (max 5 stacks, 40% bonus)
- Visual: Flaming dash + momentum counter

### WATER T2

**coral_priest** (`coral_priest` ability)
- Heal 2 lowest-HP allies 150% ATK each
- Grant affected allies 10% DR for 4s
- Visual: Blue healing waves

**hydro_mage** (`hydro_mage` ability)
- Water blast at target 200% ATK
- Apply Slow (18% AS, 3s)
- Chain to 1 nearby slowed enemy for 120% ATK
- Abilities deal 18% bonus to slowed targets (passive tracking)
- Visual: Water projectile + chain

**shell_knight** (`shell_knight` ability)
- Start with Shield 18% max HP (applied at ability exec)
- On damage above 15% max HP in single hit: gain 8% DR for 3s
- Grant all Water allies Shield 12% max HP
- Visual: Shell barriers on all affected

### EARTH T2

**earth_shaman** (`earth_shaman` ability)
- Heal 2 lowest-HP allies 150% ATK
- Grant Shield 12% max HP to healed allies
- Grant healed allies 12% CC resistance for 4s
- Visual: Green earth heals + shields

**crystal_mage** (`crystal_mage` ability)
- Deal 200% ATK to target + adjacent (cone)
- Root targets 1.5s
- Grant all allies in affected area Shield 15% max HP
- Start with Shield 22% max HP (applied at ability exec)
- Visual: Crystal spikes + root vines

**mud_stalker** (`mud_stalker` ability)
- Burrow underground 1s (untargetable, apply 'root' status to self to disable)
- Emerge at furthest enemy dealing 220% ATK
- First attack after emerge guaranteed crit
- Gain Shield 15% max HP
- Visual: Mud burrow + emergence surge

### WIND T2

**sky_knight** (`sky_knight` ability)
- Block next incoming damage, redirect as AoE to nearby enemies (50% of blocked damage)
- Grant nearby allies (2.5 cells) Shield 15% max HP
- Visual: Sky barrier + redirect arcs

**gust_sentinel** (`gust_sentinel` ability)
- Gain Shield 28% max HP
- For 4s: redirect projectiles targeting nearby allies to self (50% damage reduction on redirect)
- Grant nearby allies 6% damage bonus for 4s
- Visual: Protective wind shield

### LIGHTNING T2

**tesla_knight** (`tesla_knight` ability)
- Gain Shield 25% max HP
- Allies within 1 cell gain Shield 12% max HP
- Reflect 25% of absorbed shield damage to attackers
- Visual: Electric shield barriers

**shock_mage** (`shock_mage` ability)
- Chain Lightning at target, chains to 2 nearby enemies
- Damage: 170% ATK each
- 18% chance for abilities to crit and chain to 1 additional target
- Refund 20 mana per crit
- Visual: Lightning chains + crit sparks

### FORCE T2

**war_cleric** (`war_cleric` ability)
- Heal lowest-HP ally 150% ATK
- Deal 100% ATK to nearest enemy
- Grant healed ally +8% ATK +5% DR for 4s
- Visual: Healing + enemy damage combo

**battle_mage** (`battle_mage` ability)
- Force projectile 210% ATK with knockback 1 cell
- Reset projectile cooldown on kill
- Abilities ignore 12% enemy DR
- Visual: Telekinetic projectile + knockback

**shield_bearer** (`shield_bearer` ability)
- Gain Shield 30% max HP
- Nearby allies (2.5 cells) gain Shield 15% max HP
- Block next CC effect on self
- Grant nearby allies 5% DR for 4s
- Visual: Protective barriers + CC immunity marker

---

## T2 Evolved Units (15 Abilities)

### FIRE T2 EVOLVED

**volcano_titan** (`volcano_titan` ability)
- Enhanced `magma_knight`: Molten Armor grants 25 reflect damage + lava pool (30 DPS, 3s area)
- Eruption larger AoE (3 cells), shield 5s duration
- Deal 200% ATK (vs 160%)
- Visual: Massive magma explosion

**inferno_lancer** (`inferno_lancer` ability)
- Enhanced `blaze_lancer`: Momentum grants 10% damage + 5% lifesteal per stack
- Lance Strike hits in line (vs cone)
- Dash dealing 220% ATK (vs 180%)
- Burn (15 DPS, 4s)
- Visual: Flaming lance strike + lifesteal aura

### WATER T2 EVOLVED

**ocean_sage** (`ocean_sage` ability)
- Enhanced `coral_priest`: Soothing Mists heal 1.2% max HP/s + slow enemies hitting allies 15%
- Tidal Blessing cleanses 1 debuff from healed allies
- Heal 3 allies (vs 2) 160% ATK each
- Visual: Calming water waves

**abyssal_mage** (`abyssal_mage` ability)
- Enhanced `hydro_mage`: Torrent grants 28% damage bonus (vs 18% base)
- Hydro Bolt chains to 2 enemies (vs 1)
- Apply 25% Slow (vs 18%)
- Damage: 240% ATK (vs 200%)
- Visual: Deep water projectile + strong chains

**armored_sentinel** (`armored_sentinel` ability)
- Enhanced `shell_knight`: Shell Defense grants 25% shield + 12% DR
- Shelled Stance shields at range 3 (vs local)
- Start with Shield 22% max HP (vs 18%)
- Grant Water allies Shield 18% max HP (vs 12%)
- Visual: Heavy water armor

### EARTH T2 EVOLVED

**gaia_priest** (`gaia_priest` ability)
- Enhanced `earth_shaman`: Grounding grants 20% CC resist + first CC immunity
- Heal 3 allies (vs 2) 170% ATK each
- Grant Shield 15% max HP + 8% DR (vs 12% shield only)
- Visual: Grounded earth auras

**geomancer** (`geomancer` ability)
- Enhanced `crystal_mage`: Crystal Shell grants 30% shield
- Stalagmite wider area (3 cells), higher shields (18% vs 15%)
- Deal 240% ATK to area (vs 200%)
- Root 2s (vs 1.5s)
- Visual: Large crystal formations

**quake_reaper** (`quake_reaper` ability)
- Enhanced `mud_stalker`: Burrow emergence AoE deals 180% ATK
- Strike roots 2s + stuns 0.5s to all in area
- Gain Shield 20% max HP (vs 15%)
- Emerge attack guaranteed crit
- Visual: Quake emergence + stun markers

### WIND T2 EVOLVED

**aegis_paladin** (`aegis_paladin` ability)
- Enhanced `sky_knight`: Inspiring Presence grants 8% damage +5% DR to nearby allies
- Aegis Guard larger area (3 cells)
- Redirect 60% of blocked damage (vs 50%)
- Shield allies 18% max HP (vs 15%)
- Visual: Golden protective auras

**tempest_guardian** (`tempest_guardian` ability)
- Enhanced `gust_sentinel`: Deflection grants 20% dodge, reflects 35% damage (vs 25%)
- Cyclone Guard 3-cell radius (vs local)
- Shield self 35% max HP (vs 28%)
- Allies gain 8% damage bonus (vs 6%)
- Visual: Spiraling wind shield

### LIGHTNING T2 EVOLVED

**storm_bastion** (`storm_bastion` ability)
- Enhanced `tesla_knight`: Conductor grants 2-cell radius (vs 1)
- Tesla Barrier reflects 40% damage (vs 25%)
- Shield self 30% (vs 25%), allies 15% (vs 12%)
- Visual: Strong electric barriers

**tempest_mage** (`tempest_mage` ability)
- Enhanced `shock_mage`: Electrocution grants 25% crit chance, chains to 2 enemies
- Chain Lightning refunds 40 mana per crit (vs 20)
- Damage: 200% ATK each (vs 170%)
- Chains to 3 targets (vs 2)
- Visual: Heavy lightning chains

### FORCE T2 EVOLVED

**battle_priest** (`battle_priest` ability)
- Enhanced `war_cleric`: War Prayer grants +12% ATK +8% DR
- Holy Strike damages all nearby enemies 120% ATK
- Heal 2 allies (vs 1) 170% ATK each
- Buff healed allies +10% ATK (vs 8%)
- Visual: Holy combat auras

**force_archmage** (`force_archmage` ability)
- Enhanced `battle_mage`: Telekinetic grants 18% DR ignore +8% damage (vs 12% DR ignore)
- Force Bolt knockback 2 cells (vs 1)
- Projectile 250% ATK (vs 210%)
- Reset on kill
- Visual: Strong telekinetic force

**bastion** (`bastion` ability)
- Enhanced `shield_bearer`: Fortified grants 8% DR + 12% starting shield
- Impenetrable Wall larger shields (18% vs 15% allies) + CC immunity
- Self Shield 35% (vs 30%)
- Nearby allies 5% DR (unchanged)
- Visual: Massive impenetrable barriers

---

## Passive Implementations (All 72)

All passive functions go in `main-v2.js`. Each execution function follows this pattern:

```javascript
function executeCombatStartPassive(unit, passiveData, allUnits) {
    // Logic for combat_start trigger
}

function executeOnAttackPassive(unit, target, passiveData, allUnits) {
    // Logic for on_attack trigger
}

function executeOnHitPassive(unit, attacker, damage, passiveData, allUnits) {
    // Logic for on_hit trigger
}

function executeOnKillPassive(unit, victim, passiveData, allUnits) {
    // Logic for on_kill trigger
}

function processPeriodicPassive(unit, passiveData, dt) {
    // Logic for periodic trigger (uses unit.passiveTimers)
}

function processAuraPassive(unit, passiveData, allUnits) {
    // Logic for aura trigger (checks nearby units each tick)
}
```

### T1 Base Passives (21)

**flame_warrior** (on_attack)
- Every 3rd attack deals 25% bonus damage
- Track via `unit.passiveState.attackCount`
- Increment on attack, check % 3, apply damage bonus

**ember_scout** (combat_start)
- First attack deals 50% bonus damage
- Set flag `unit.passiveState.triggered = false` initially
- On first attack, apply 50% bonus, set flag to true

**cinder_archer** (on_attack)
- Attacks vs Burning enemies deal 20% bonus damage
- Check target for 'burn' status, if found add 20% bonus

**fire_acolyte** (on_attack)
- Heals apply Burn (8 DPS, 2s) to nearest enemy
- On heal ability cast (hook into ability), find nearest enemy and apply Burn

**tide_hunter** (on_hit)
- Attacker slowed 8% for 2.5s
- When unit is hit, apply Slow to attacker (reverse direction)
- addStatus(attacker, 'slow', 2.5, 0.08, unit)

**frost_archer** (on_attack)
- 25% chance to slow target 15% AS for 2s
- Random roll, if success apply Slow(target, 2s, 0.15)

**reef_stalker** (combat_start)
- After dashing gain 20% dodge 3s
- Set flag for dash tracking, on dash completion apply Dodge buff

**stone_guard** (aura)
- Gain 4% DR per ally within 2.5 cells (max 20%)
- Count allies within 2.5 Manhattan distance, apply DR buff (min 0, max 0.20)

**bramble_knight** (on_hit)
- Melee attackers take 12 damage
- When unit hit by melee, reflect 12 flat damage to attacker
- dealDamage(unit, attacker, 12, {noStatusApply: true})

**seedling_archer** (periodic)
- Every 6s gain +4% ATK stack (max 6)
- Timer ticks in `unit.passiveTimers['seedling_archer']`
- At 6s mark, increment `unit.passiveState.stacks`, cap at 6
- Apply atkBuff based on stacks

**zephyr_scout** (on_kill)
- Gain 35% move speed 2.5s after kill
- On kill, apply move speed buff for 2.5s

**wind_archer** (aura)
- Gain 6% ATK speed per Wind ally on team
- Count Wind element allies, apply atkSpeedBuff = count * 0.06

**gale_dancer** (combat_start)
- After casting ability, gain 28% move speed 3s
- Hook into ability execution, after cast apply move speed buff

**wind_squire** (on_attack)
- Gain +8% ATK speed per hit, max 4 stacks (32%)
- Increment `unit.passiveState.stacks` on attack, cap at 4
- Apply atkSpeedBuff = stacks * 0.08

**spark_fencer** (on_attack)
- Attacks near another Lightning unit deal 18% bonus + chain 60 damage
- Check for Lightning ally within 3 cells, if found apply damage bonus and chain damage

**volt_runner** (on_attack)
- Each dash grants +20% crit chance 2s (stacks)
- On dash, apply crit buff, can stack up to 3-4 times
- addStatus(unit, 'critBuff', 2s, 0.20, unit)

**thunder_archer** (on_attack)
- Every 3 attacks, next charged for 40% bonus + chain to 1 enemy
- Track attack count, every 3rd attack apply 40% bonus and mark for chain damage

**pulse_mender** (on_attack)
- Heals grant target +8% crit chance 3s
- When healing applied, grant crit buff to healed target

**iron_soldier** (aura)
- Gain 6% DR per Force ally
- Count Force element allies, apply DR buff = count * 0.06

**shadow_blade** (on_kill)
- Gain +25% move speed and dodge 2s after kill
- On kill, apply move speed buff + dodge buff for 2s

**steel_archer** (periodic)
- Gain +8% damage per second standing still (max 40%)
- If unit hasn't moved, increment standing timer
- Apply damage buff = standing seconds * 0.08 (cap at 0.40)
- Reset on movement

### T2 Base Passives (15)

**magma_knight** (on_hit)
- When hit by melee, deal 15 fire damage back
- Check if attacker is melee (distance 1), reflect 15 damage

**blaze_lancer** (on_attack)
- Consecutive hits same target +8%/stack (max 5)
- If target = lastTarget, increment stacks, else reset to 0
- Damage bonus = stacks * 0.08, cap at 0.40

**coral_priest** (aura)
- Allies within 2.5 cells heal 0.8% max HP/s
- Find allies in range, apply healing buff = ally.maxHp * 0.008 per tick

**hydro_mage** (on_attack)
- Abilities deal 18% bonus to Slowed targets
- Check target for 'slow' status, if found apply damage bonus

**shell_knight** (combat_start)
- Start with Shield 18% max HP, on damage above 15% max HP gain 8% DR 3s
- At combat init, grant shield
- Hook into damage detection: if single hit > 15% max HP, apply DR buff

**earth_shaman** (on_attack)
- Allies healed gain 12% CC resistance 4s
- On heal, grant healed target CC resist buff
- addStatus(target, 'ccResist', 4s, 0.12, unit)

**crystal_mage** (combat_start)
- Start with Shield 22% max HP, reforms after 8s if broken
- At init, grant shield
- If shield breaks, reset timer, reapply shield at 8s

**mud_stalker** (combat_start)
- Burrow underground 2s (untargetable), emerge at furthest enemy, first attack crit
- At init, apply root status to self for 2s (visually burrow)
- At 2s, move to furthest enemy, set `unit.passiveState.nextAttackCrit = true`

**sky_knight** (aura)
- Allies within 2.5 cells gain 6% damage bonus
- Find allies in range, apply damage buff

**gust_sentinel** (on_hit)
- 12% chance deflect ranged attacks (bounce to random enemy 50% dmg)
- On hit from ranged attacker, 12% roll, if success redirect damage

**tesla_knight** (on_hit)
- Enemies hitting within 1 cell gain +15% damage taken 3s
- When unit hit, apply vulnerability to attacker

**shock_mage** (on_attack)
- Abilities have 18% chance to crit and chain to 1 target
- On ability hit, 18% crit roll, if success chain to nearby enemy

**war_cleric** (on_attack)
- Heals grant target +8% ATK +5% DR 4s
- On heal, grant both buffs to healed target

**battle_mage** (on_attack)
- Abilities ignore 12% enemy DR
- When executing ability damage, apply 12% DR ignore (reduce target effective DR)

**shield_bearer** (aura)
- Nearby allies gain 5% DR and start with Shield 10% max HP
- Find allies in range, grant DR buff + shield

### T1 Evolved Passives (21)

Implement evolved versions with increased values and/or extra effects:

**fire_berserker** (on_attack)
- Every 2.5 attacks deals 40% bonus damage + Burn 25 DPS 4s
- Enhanced flame_warrior

**flame_rogue** (combat_start)
- First attack deals 50% bonus damage, leaves fire trail
- Enhanced ember_scout

**cinder_marksman** (on_attack)
- Attacks vs Burning enemies deal 35% bonus (vs 20% base)
- Enhanced cinder_archer

**ember_saint** (on_attack)
- Heals apply Burn (15 DPS, 2.5s) + grant healed +15% ATK
- Enhanced fire_acolyte

**tsunami_blade** (on_hit)
- Attacker slowed 12% for 3s + self heals 20% of damage taken
- Enhanced tide_hunter

**ice_sniper** (on_attack)
- 35% chance to slow target 20% AS for 2.5s (vs 25% chance, 15% slow base)
- Enhanced frost_archer

**tidal_phantom** (combat_start)
- After dashing gain 35% dodge 3s + stealth 2s
- Enhanced reef_stalker

**mountain_lord** (aura)
- Gain 5% DR per ally (max 25%), shield transfers to nearby allies
- Enhanced stone_guard

**ironwood_sentinel** (on_hit)
- Melee attackers take 12-25 damage based on missing HP
- Enhanced bramble_knight

**thornwood_ranger** (periodic)
- Every 5s gain +5% ATK stack (max 6), apply 15% slow to rooted
- Enhanced seedling_archer

**storm_assassin** (on_kill)
- Gain 45% move speed + 20% dodge 2.5s, reset dash on kill
- Enhanced zephyr_scout

**gale_sniper** (aura)
- Gain 8% ATK speed per Wind ally + pierce grants dodge
- Enhanced wind_archer

**stormweaver** (combat_start)
- After ability cast gain 35% move speed + 18% ATK speed
- Enhanced gale_dancer

**zephyr_warrior** (on_attack)
- Gain +10% ATK speed per hit (max 5 stacks = 50%)
- Enhanced wind_squire

**arc_duelist** (on_attack)
- Attacks near Lightning unit deal 35% bonus (vs 18% base) + add 5% per other Lightning ally
- Enhanced spark_fencer

**lightning_phantom** (on_attack)
- Each dash grants +35% crit chance 2s (vs 20%), hits twice on crit
- Enhanced volt_runner

**storm_archer** (on_attack)
- Every 2 attacks, next charged for 60% bonus (vs 40%) + chains to 2 (vs 1)
- Enhanced thunder_archer

**storm_medic** (on_attack)
- Heals grant target +12% crit chance 3s (vs 8%)
- Enhanced pulse_mender

**legionnaire** (aura)
- Gain 8% DR per Force ally (vs 6% base)
- Enhanced iron_soldier

**night_stalker** (on_kill)
- Gain +35% move speed + 20% dodge 2.5s, 12% lifesteal on kills
- Enhanced shadow_blade

**ballista_archer** (periodic)
- Gain +10% damage per second standing still (max 50% vs 40%)
- Enhanced steel_archer

### T2 Evolved Passives (15)

Implement evolved versions with enhanced mechanics:

**volcano_titan** (on_hit)
- Melee attackers take 25 damage + lava pool (30 DPS, 3s area)
- Enhanced magma_knight

**inferno_lancer** (on_attack)
- Consecutive hits +10% damage + 5% lifesteal per stack (max 5)
- Enhanced blaze_lancer

**ocean_sage** (aura)
- Allies within 2.5 cells heal 1.2% max HP/s (vs 0.8%), enemies slowed 15%
- Enhanced coral_priest

**abyssal_mage** (on_attack)
- Abilities deal 28% bonus to Slowed (vs 18%), chains to 2 (vs 1)
- Enhanced hydro_mage

**armored_sentinel** (combat_start)
- Start with Shield 22% max HP (vs 18%), grant 12% DR
- Enhanced shell_knight

**gaia_priest** (on_attack)
- Allies healed gain 20% CC resist + CC immunity first time (vs 12% resist)
- Enhanced earth_shaman

**geomancer** (combat_start)
- Start with Shield 28% max HP (vs 22%), wider area effects
- Enhanced crystal_mage

**quake_reaper** (combat_start)
- Burrow 2s, emerge AoE 180% ATK, root + stun all hit
- Enhanced mud_stalker

**aegis_paladin** (aura)
- Allies within 3 cells gain 8% damage + 5% DR (vs 6% damage base)
- Enhanced sky_knight

**tempest_guardian** (on_hit)
- 20% chance deflect ranged attacks (vs 12%), reflect 35% damage (vs none on sky_knight)
- Enhanced gust_sentinel

**storm_bastion** (on_hit)
- Enemies within 2 cells gain +15% damage taken 3s, reflect 40%
- Enhanced tesla_knight

**tempest_mage** (on_attack)
- Abilities have 25% crit chance + chain to 2 (vs 18% chance, 1 chain base)
- Enhanced shock_mage

**battle_priest** (on_attack)
- Heals grant +12% ATK + 8% DR (vs 8% ATK, 5% DR base)
- Enhanced war_cleric

**force_archmage** (on_attack)
- Abilities ignore 18% DR (vs 12%), knockback 2 cells
- Enhanced battle_mage

**bastion** (aura)
- Nearby allies gain 5% DR + 12% starting shield (vs 10% shield base)
- Enhanced shield_bearer

---

## Critical Implementation Notes

1. **Code Standard**:
   - Use `var` for all variable declarations
   - NO `let`, `const`, or arrow functions
   - NO ES modules or import/export
   - All code goes in `main-v2.js`

2. **Reentry Guard for Passive Chains**:
   - `dealDamage` → `processOnHitPassive` → could call `dealDamage` again
   - Use `unit._processingPassive = true` flag to prevent infinite recursion
   - Always reset flag after passive execution

3. **Available Helper Functions** (from existing codebase):
   - `dealDamage(source, target, damage, opts)` — returns `{killed: boolean, actualDamage: number}`
   - `addStatus(target, statusType, duration, value, source)` — apply status
   - `grantShield(source, target, amount)` — apply shield
   - `dealHealing(source, target, amount)` — apply healing
   - `getUnitsInRadius(unit, radius, allUnits, includeSelf)` — get nearby units
   - `getLowestHpUnits(units, count)` — get lowest HP targets
   - `getFurthestEnemy(unit, allUnits)` — get furthest enemy
   - `getUnitsInRow(row, allUnits)` — get all units in row
   - `getRandomAlive(allUnits, excludeUnit)` — random living unit
   - `getManhattanDist(pos1, pos2)` — distance between positions
   - `flashAbilityCells(cellArray, color, durationMs)` — visual feedback
   - `addCombatLog(message)` — combat log entry
   - `getStatusValue(unit, statusType)` — get current status value
   - `findEmptyCellNear(row, col, allUnits)` — find empty adjacent cell
   - `moveUnitToCell(unit, newRow, newCol, allUnits)` — move unit

4. **Status Application Format**:
   - Burn: `addStatus(target, 'burn', durationSec, dpsValue, caster)`
   - Slow: `addStatus(target, 'slow', durationSec, percentageValue, caster)`
   - Root: `addStatus(target, 'root', durationSec, 0, caster)`
   - Stun: `addStatus(target, 'stun', durationSec, 0, caster)`
   - ATK Buff: `addStatus(target, 'atkBuff', durationSec, percentageValue, caster)`
   - ATK Speed Buff: `addStatus(target, 'atkSpeedBuff', durationSec, percentageValue, caster)`
   - Dodge Buff: `addStatus(target, 'dodgeBuff', durationSec, percentageValue, caster)`
   - DR Buff: `addStatus(target, 'drBuff', durationSec, percentageValue, caster)`
   - Move Speed Buff: `addStatus(target, 'moveSpeedBuff', durationSec, percentageValue, caster)`

5. **Unit Position & Grid**:
   - Grid: 8×7 (8 columns, 7 rows)
   - Rows 0-3: enemy zone
   - Rows 4-7: player zone
   - Use Manhattan distance for all range checks
   - Movement via `moveUnitToCell(unit, newRow, newCol, allUnits)`

6. **Passive Data Structure** (from units.js):
   ```javascript
   PASSIVE_DATA[unitKey] = {
       name: "Passive Name",
       trigger: "combat_start|on_attack|on_hit|on_kill|periodic|aura",
       baseValue: 0.25,    // for numeric passives
       duration: 3,        // for timed effects
       description: "..."
   };
   ```

7. **Ability Data Structure** (from executeAbility):
   - Switch on `unit.ability`
   - Use case labels like `'flame_warrior'`, `'fire_berserker'`, etc.
   - Extract ability key from unit template

8. **Old Code Replacement**:
   - Find existing `case 'flame_warrior':` blocks in `executeAbility()`
   - Replace entirely with new implementations
   - Do NOT append; do NOT leave old code

9. **Kill Detection Hook**:
   - In kill processing: `if (target.hp <= 0 && !target._dead)`
   - Call `processOnKillPassive(attacker, target, combatState.allUnits)` before marking `target._dead = true`

10. **ATK Calculation with Buffs**:
    ```javascript
    var atk = caster.attack;
    var atkBuffVal = getStatusValue(caster, 'atkBuff');
    var atkModVal = getStatusValue(caster, 'atkMod');
    if (atkBuffVal !== 0 || atkModVal !== 0) {
        atk = Math.floor(atk * (1 + atkBuffVal) * (1 + atkModVal));
    }
    ```

---

## Implementation Phases

### Phase 1: Passive Framework Foundation
1. Implement `getPassiveData()`, `initUnitPassiveState()`, `processCombatStartPassives()`
2. Add hook in `initCombat()` to call `initUnitPassiveState()` and `processCombatStartPassives()`
3. Implement tick passive processors: `processTickPassives()`, `processPeriodicPassive()`, `processAuraPassive()`
4. Add hook in `combatTick()` to call `processTickPassives()`

### Phase 2: Event Passive Dispatchers
1. Implement `processOnAttackPassive()`, `processOnHitPassive()`, `processOnKillPassive()`
2. Add reentry guards (`_processingPassive` flag) to all three
3. Add hooks in attack resolution, `dealDamage()`, kill detection code
4. Test that passive chain calls don't infinite-loop

### Phase 3: T1 Base Ability Implementations
1. Organize by element (Fire, Water, Earth, Wind, Lightning, Force)
2. Implement all 21 T1 base ability cases in `executeAbility()` switch
3. Test each ability fires without errors
4. Verify existing game mechanics not broken

### Phase 4: T1 Evolved & T2 Base Ability Implementations
1. Implement all 21 T1 evolved cases
2. Implement all 15 T2 base cases
3. Test fire/water/earth/wind/lightning/force abilities per element
4. Verify ability damage and status applications

### Phase 5: T2 Evolved & Passive Implementations
1. Implement all 15 T2 evolved cases
2. Implement ALL 72 passive execution functions
3. Hook passives into ability executions where relevant
4. Full integration test

### Phase 6: Testing & Polish
1. Run all test cases in Testing Checklist
2. Fix any console errors
3. Verify combat log entries for all abilities
4. Performance check (no lag from 72 passives)

---

## Testing Checklist

- [ ] Passive framework initializes without errors
- [ ] All 72 passives load from PASSIVE_DATA and EVOLVED_PASSIVE_DATA
- [ ] `combat_start` passives fire exactly once per combat
- [ ] `periodic` passives fire on correct intervals (check timers)
- [ ] `aura` passives update each tick without lag
- [ ] `on_attack` passives modify damage correctly and don't double-apply
- [ ] `on_hit` passives trigger when unit takes damage
- [ ] `on_kill` passives trigger when unit gets kill (not when killed)
- [ ] Reentry guard prevents infinite passive loops
- [ ] All 21 T1 base abilities execute correctly
- [ ] All 21 T1 evolved abilities execute correctly
- [ ] All 15 T2 base abilities execute correctly
- [ ] All 15 T2 evolved abilities execute correctly
- [ ] Ability damage calculations respect ATK buffs
- [ ] Status applications (Burn, Slow, Root, Stun, etc.) apply correctly
- [ ] Shield grants work as intended
- [ ] Healing applications trigger healer passive effects
- [ ] Area-of-effect abilities hit correct targets
- [ ] Dash/teleport abilities move units correctly
- [ ] Chain abilities chain to correct nearby targets
- [ ] Existing game functionality not broken by hook points
- [ ] No duplicate switch cases in `executeAbility()`
- [ ] Combat log shows all ability casts and passive triggers
- [ ] Console has zero errors during full combat
- [ ] Performance acceptable (combat runs at 60 FPS)

---

## Success Criteria

1. **Passive System**: All 72 passives load, initialize, and execute without console errors. No infinite loops from passive chains.

2. **Ability System**: All 72 abilities (21 T1 base + 21 T1 evolved + 15 T2 base + 15 T2 evolved) execute in `executeAbility()` with correct damage, status applications, and targeting.

3. **Integration**: Passives fire at correct trigger times. Abilities trigger relevant passives (e.g., healing ability triggers `on_attack` healer passives).

4. **Game Integrity**: Existing combat systems (auto-attack, unit movement, turn order, death) unaffected. Game can run a full combat scenario with 8 units total without errors.

5. **Code Quality**: All code uses `var`, NO `let`/`const`/arrow functions. Code is readable and maintainable. Comments explain non-obvious logic (e.g., reentry guards, timer management).

6. **Performance**: Combat runs smoothly at 60 FPS with 72 passives processing each tick. No visible lag or stutter.

---

## Notes

- PASSIVE_DATA and EVOLVED_PASSIVE_DATA are defined in `units.js` (prompt 18) and available globally.
- Old T1-T2 ability code in `executeAbility()` must be REPLACED, not appended to.
- Reentry guards are CRITICAL for on_hit → dealDamage → on_hit recursion prevention.
- All ability descriptions emphasize targeting logic (nearest enemy, furthest, cone radius, etc.) — ensure these are precise.
- Status durations are in seconds; apply via `addStatus(target, type, durationSec, value, source)`.
- Test passives in isolation first, then with abilities, then full combat.

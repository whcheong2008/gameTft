# Prompt 13: Combat Engine Rebuild — Mana System & Abilities

## Goal
Add a mana system where every unit has a mana bar that fills from attacking and taking damage. When full, the unit casts its ability. Implement all 20 base + 16 evolved = 36 unit abilities. Add a minimal status effect system (enough for abilities to work — chunk 4 replaces it with the full framework). Render mana bars on units in combat.

## Context
- **Chunk 1 (done)**: 8×7 vertical grid, BFS pathfinding, movement, assassin dash, grid-aware targeting
- **Chunk 2 (done)**: Unified `dealDamage()` pipeline, `dealHealing()`, `grantShield()`, per-unit combatStats tracking, live combat scoreboard sidebar
- **Current state**: Units auto-attack only. No mana, no abilities. The `dealDamage()` and `dealHealing()` functions handle all HP changes with stat tracking.
- **Script order**: `units.js → save.js → gacha.js → teams.js → hub.js → items.js → missions.js → ui-v2.js → main-v2.js`
- **Pattern**: All `var`, global scope, NO ES modules, NO import/export
- **Grid**: 8 rows × 7 cols. Rows 0-3 enemy, rows 4-7 player. Manhattan distance.

## ⚠️ Implementation Order — READ FIRST

This is a large prompt. Implement it in this exact order to avoid cascading issues. **Test each phase before moving to the next.**

### Phase A: Data & Infrastructure (units.js + main-v2.js)
1. Add `maxMana` to all UNIT_TEMPLATES and EVOLVED_TEMPLATES entries in `units.js`
2. Add `ABILITY_DATA` lookup table in `units.js`
3. Add `templateKey` tracking in `initCombat()` so every unit knows its template key
4. Add `currentMana`, `statusEffects`, `isCasting`, `castTimer`, `abilityBuffs`, `combatStats.abilityCasts` initialization in `initCombat()`

### Phase B: Status Effect System (main-v2.js)
5. Add status effect helpers: `addStatus()`, `hasStatus()`, `getStatusValue()`, `clearDebuffs()`
6. Add `processStatusEffects()` — tick durations, burn damage, regen healing
7. Wire status checks into `combatTick()`: stun/freeze skip turn, root blocks movement, taunt overrides target, slow reduces move speed
8. Wire into `dealDamage()`: freeze vulnerability (+20%), drMod, reflect, dodge buff integration
9. Wire into `dealHealing()`: burn/healReduction reduces healing

### Phase C: Mana System (main-v2.js)
10. Add mana generation: +10 on auto-attack (in `performAttack()`), +mana on damage taken (in `dealDamage()`)
11. Add casting flow in `combatTick()`: mana check → `isCasting` → cast timer → `executeAbility()` → mana reset
12. Add between-wave reset: mana to 0, clear statusEffects, clear abilityBuffs

### Phase D: Grid Helpers (main-v2.js)
13. Add all grid helper functions: `getUnitsInRadius()`, `getUnitsInRow()`, `getLowestHpUnits()`, `getRandomAlive()`, `getFurthestEnemy()`, `getLowestHpEnemy()`, `moveUnitToCell()`, `findEmptyCellNear()`

### Phase E: Abilities — Cost 1 (main-v2.js)
14. Add `executeAbility()` skeleton with switch statement
15. Implement all 7 cost-1 base abilities (flame_warrior through wind_archer)
16. Implement all 7 cost-1 evolved abilities (fire_berserker through gale_sniper)
17. Implement Frost Shot special buff handling in `performAttack()`
18. **TEST**: Run a mission with cost-1 units. Verify mana fills, abilities fire, damage/healing/CC works.

### Phase F: Abilities — Cost 2+ (main-v2.js)
19. Implement all 7 cost-2 base abilities (magma_knight through sky_knight)
20. Implement all 7 cost-2 evolved abilities (volcano_titan through aegis_paladin)
21. Implement cost-3 base + evolved (pyromancer, golem, inferno_mage, titan)
22. Implement cost-4 (fire_dragon, leviathan)
23. Wire Volcano Titan on-death into `dealDamage()` death processing

### Phase G: Passive Abilities (main-v2.js)
24. Implement Phoenix revive (on-death → stasis → revive with AoE)
25. Implement World Tree trigger (ally below 20% HP → heal all + cleanse)
26. Implement Phoenix and World Tree passive auras (periodic ATK boost / regen to nearby allies)

### Phase H: Rendering (ui-v2.js + game-v2.html)
27. Add mana bar CSS to `game-v2.html`
28. Add mana bar rendering in `renderCombatBoard()` below HP bar
29. Add mana indicator + ability cast count to `renderCombatScoreboard()`
30. **FINAL TEST**: Full mission playthrough. All abilities fire, scoreboard updates, no errors.

---

## Part 1: Mana Stats on Unit Templates

### Add `maxMana` to every unit template in `units.js`

Add a `maxMana` field to every entry in UNIT_TEMPLATES and EVOLVED_TEMPLATES. Cost 5 units (Phoenix, World Tree) have passive abilities so set `maxMana: 0`. Volcano Titan (evolved Magma Knight) also has a passive (on-death), so `maxMana: 0`.

**UNIT_TEMPLATES maxMana values:**
| Key | maxMana |
|-----|---------|
| flame_warrior | 60 |
| ember_scout | 50 |
| tide_hunter | 70 |
| frost_archer | 50 |
| stone_guard | 80 |
| zephyr_scout | 40 |
| wind_archer | 60 |
| magma_knight | 90 |
| coral_priest | 70 |
| hydro_mage | 60 |
| vine_archer | 60 |
| earth_shaman | 80 |
| storm_mage | 60 |
| sky_knight | 80 |
| pyromancer | 100 |
| golem | 90 |
| fire_dragon | 80 |
| leviathan | 100 |
| phoenix | 0 |
| world_tree | 0 |

**EVOLVED_TEMPLATES maxMana values:**
| Key | maxMana |
|-----|---------|
| fire_berserker | 60 |
| flame_rogue | 50 |
| volcano_titan | 0 |
| inferno_mage | 100 |
| tsunami_blade | 70 |
| ice_sniper | 50 |
| ocean_sage | 70 |
| abyssal_mage | 60 |
| mountain_lord | 80 |
| thorn_ranger | 60 |
| gaia_priest | 80 |
| titan | 90 |
| storm_assassin | 40 |
| gale_sniper | 60 |
| tempest_wizard | 60 |
| aegis_paladin | 80 |

---

## Part 2: Ability Data Table

Add a new global `ABILITY_DATA` object in `units.js` (after EVOLVED_TEMPLATES). This is a lookup table keyed by unit template key (base or evolved). Each entry describes the ability's metadata for the UI; the actual execution logic lives in `executeAbility()` in `main-v2.js`.

```js
var ABILITY_DATA = {
    // --- Cost 1 Base ---
    flame_warrior: { name: 'Flame Slash', desc: 'Deal 150% ATK to target. Apply Burn (20 DPS, 3s).' },
    ember_scout: { name: 'Shadow Strike', desc: 'Teleport to furthest enemy. Deal 200% ATK. Gain 50% dodge for 1.5s.' },
    tide_hunter: { name: 'Crashing Wave', desc: 'Deal 100% ATK to all enemies in target\'s row. Apply 20% Slow for 3s.' },
    frost_archer: { name: 'Frost Shot', desc: 'Next 3 attacks deal +30% damage and apply 20% Slow for 2s.' },
    stone_guard: { name: 'Stone Wall', desc: 'Gain Shield (30% max HP). Taunt enemies within 2 cells for 3s.' },
    zephyr_scout: { name: 'Wind Step', desc: 'Gain 100% dodge for 2s. Next attack deals 250% ATK.' },
    wind_archer: { name: 'Gale Shot', desc: 'Deal 120% ATK to all enemies in target\'s row.' },

    // --- Cost 1 Evolved ---
    fire_berserker: { name: 'Inferno Slash', desc: 'Deal 200% ATK to target + adjacent enemies. Apply Burn (30 DPS, 5s).' },
    flame_rogue: { name: 'Phantom Blaze', desc: 'Teleport to furthest enemy. Deal 250% ATK. Leave fire trail (25 DPS, 3s).' },
    tsunami_blade: { name: 'Tidal Surge', desc: 'Deal 150% ATK in 2-cell line toward target. Apply 40% Slow for 4s. Pull enemies 1 cell.' },
    ice_sniper: { name: 'Frozen Volley', desc: 'Fire 3 arrows at random enemies. 80% ATK each. Freeze (stun) for 1s.' },
    mountain_lord: { name: 'Earthquake', desc: 'Taunt enemies within 3 cells for 4s. Shield (40% max HP). Taunted enemies -15% ATK.' },
    storm_assassin: { name: 'Lightning Execution', desc: 'Dash to lowest-HP enemy. Deal 300% ATK. Kill refunds 50% mana.' },
    gale_sniper: { name: 'Tempest Barrage', desc: '5 rapid shots at target: 60% ATK each, ignore 50% DR.' },

    // --- Cost 2 Base ---
    magma_knight: { name: 'Magma Shield', desc: 'Shield (25% max HP). Reflect 30% melee damage for 4s.' },
    coral_priest: { name: 'Healing Wave', desc: 'Heal 2 lowest-HP allies for 150% ATK each.' },
    hydro_mage: { name: 'Water Bolt', desc: 'Deal 200% ATK to target. Reduce target ATK by 20% for 4s.' },
    vine_archer: { name: 'Entangle', desc: 'Root target for 2s. Deal 150% ATK.' },
    earth_shaman: { name: 'Nature\'s Touch', desc: 'Heal lowest-HP ally for 200% ATK. Cleanse 1 debuff.' },
    storm_mage: { name: 'Chain Lightning', desc: 'Deal 180% ATK to target. Bounces to 2 nearby enemies at 60% damage.' },
    sky_knight: { name: 'Battle Cry', desc: 'All allies: +15% ATK and 100 Shield for 5s.' },

    // --- Cost 2 Evolved ---
    volcano_titan: { name: 'Eruption', desc: 'PASSIVE: On death, deal 300% ATK to enemies within 2 cells. Burn (40 DPS, 3s).' },
    ocean_sage: { name: 'Tidal Blessing', desc: 'Heal ALL allies for 100% ATK. Each gains 100 Shield.' },
    abyssal_mage: { name: 'Depth Charge', desc: 'Deal 250% ATK to target. 50% splash to enemies within 1 cell. -30% ATK for 5s.' },
    thorn_ranger: { name: 'Thorn Prison', desc: 'Root target + enemies within 1 cell for 2.5s. Deal 120% ATK. Rooted take +15% damage.' },
    gaia_priest: { name: 'Life Bloom', desc: 'Heal 3 lowest-HP allies for 150% ATK. Regen (2% maxHP/s, 4s). Cleanse all debuffs.' },
    tempest_wizard: { name: 'Thunder Storm', desc: 'Deal 150% ATK to 3 random enemies. 30% chance to Stun 1.5s each.' },
    aegis_paladin: { name: 'Divine Aegis', desc: 'All allies: +20% ATK, 200 Shield, +15% DR for 5s.' },

    // --- Cost 3 Base ---
    pyromancer: { name: 'Meteor', desc: 'Deal 250% ATK in 2-cell radius around target. Burn (25 DPS, 4s).' },
    golem: { name: 'Seismic Slam', desc: 'Stun enemies within 1 cell for 1.5s. Deal 150% ATK.' },

    // --- Cost 3 Evolved ---
    inferno_mage: { name: 'Inferno', desc: 'Deal 300% ATK in 3-cell radius. Burn (40 DPS, 5s). -50% healing on hit.' },
    titan: { name: 'Colossal Impact', desc: 'Stun enemies within 2 cells for 2s. Deal 200% ATK. Shield (20% maxHP per stunned).' },

    // --- Cost 4 ---
    fire_dragon: { name: 'Dragon Breath', desc: 'Deal 200% ATK in cone (3 deep). Burn (30 DPS, 5s). +25% vs already burning.' },
    leviathan: { name: 'Tidal Crush', desc: 'Deal 180% ATK to ALL enemies. 30% Slow for 3s. Heal self 10% of total damage.' },

    // --- Cost 5 (Passive — no mana) ---
    phoenix: { name: 'Rebirth', desc: 'PASSIVE: On death, revive at 50% HP after 2s. Deal 250% ATK AoE. Once per combat.' },
    world_tree: { name: 'Bloom of Life', desc: 'PASSIVE: When any ally drops below 20% HP, heal ALL allies for 30% maxHP. Once per combat.' }
};
```

---

## Part 3: Minimal Status Effect System

Chunk 4 will implement the full status effect framework with diminishing returns, CC immunity, stacking rules, visual icons, and cleanse mechanics. For chunk 3, implement a SIMPLE system that is just enough for abilities to work.

### Data Structure
In `main-v2.js`, add to each unit during `initCombat()`:
```js
unit.statusEffects = [];  // array of active status effects
unit.currentMana = 0;     // current mana (starts at 0)
unit.isCasting = false;   // true during cast time
unit.castTimer = 0;       // seconds remaining in cast animation
unit.abilityBuffs = {};   // temporary ability-granted buffs (frostShot charges, etc.)
```

### Status Effect Object Shape
```js
{
    type: 'burn',       // burn, slow, stun, freeze, root, taunt, dodgeBuff, atkMod, drMod, regen, reflect, healReduction, vulnerability
    duration: 3.0,      // seconds remaining
    value: 20,          // DPS for burn, % for slow, etc.
    sourceId: 'abc',    // unique ID of the unit that applied it (for taunt targeting)
    source: unitRef     // reference to source unit (for taunt, reflect)
}
```

### Status Processing in `combatTick()`
Add a new function `processStatusEffects(unit, dt)` called for every alive unit each tick, BEFORE the unit's movement/attack logic. It handles:

```js
function processStatusEffects(unit, dt) {
    if (!unit.statusEffects || unit.statusEffects.length === 0) return;

    // Process each effect
    for (var i = unit.statusEffects.length - 1; i >= 0; i--) {
        var eff = unit.statusEffects[i];
        eff.duration -= dt;

        if (eff.type === 'burn') {
            // Tick damage (value = DPS)
            var burnDmg = Math.floor(eff.value * dt);
            if (burnDmg > 0 && unit.hp > 0) {
                dealDamage(eff.source, unit, burnDmg, {isTrueDamage:true, canCrit:false, canDodge:false, applyElement:false, triggerOnHit:false});
            }
        }

        if (eff.type === 'regen') {
            // Tick healing (value = % maxHP per second)
            var regenAmt = Math.floor(unit.maxHp * eff.value * dt);
            if (regenAmt > 0 && unit.hp > 0 && unit.hp < unit.maxHp) {
                dealHealing(unit, unit, regenAmt);
            }
        }

        // Remove expired effects
        if (eff.duration <= 0) {
            unit.statusEffects.splice(i, 1);
        }
    }
}
```

### Status Query Helpers
```js
function hasStatus(unit, type) {
    if (!unit.statusEffects) return false;
    for (var i = 0; i < unit.statusEffects.length; i++) {
        if (unit.statusEffects[i].type === type) return true;
    }
    return false;
}

function getStatusValue(unit, type) {
    // Returns the highest value for a given status type
    var best = 0;
    if (!unit.statusEffects) return 0;
    for (var i = 0; i < unit.statusEffects.length; i++) {
        if (unit.statusEffects[i].type === type && unit.statusEffects[i].value > best) {
            best = unit.statusEffects[i].value;
        }
    }
    return best;
}

function addStatus(unit, type, duration, value, source) {
    if (!unit.statusEffects) unit.statusEffects = [];
    // Simple stacking: for burn, add new stack. For CC (stun/freeze/root), refresh if longer. For buffs, refresh.
    if (type === 'burn') {
        // Burn stacks up to 3
        var burnCount = 0;
        for (var i = 0; i < unit.statusEffects.length; i++) {
            if (unit.statusEffects[i].type === 'burn') burnCount++;
        }
        if (burnCount < 3) {
            unit.statusEffects.push({type: type, duration: duration, value: value, source: source});
        } else {
            // Refresh duration on all burn stacks
            for (var j = 0; j < unit.statusEffects.length; j++) {
                if (unit.statusEffects[j].type === 'burn') unit.statusEffects[j].duration = duration;
            }
        }
    } else {
        // For everything else: replace existing of same type (refresh)
        for (var k = unit.statusEffects.length - 1; k >= 0; k--) {
            if (unit.statusEffects[k].type === type) {
                unit.statusEffects.splice(k, 1);
            }
        }
        unit.statusEffects.push({type: type, duration: duration, value: value, source: source});
    }
}

function clearDebuffs(unit, count) {
    // Remove 'count' debuffs (longest duration first). 0 = clear all.
    var debuffTypes = ['burn', 'slow', 'stun', 'freeze', 'root', 'atkMod', 'healReduction', 'vulnerability'];
    var debuffs = [];
    for (var i = 0; i < unit.statusEffects.length; i++) {
        if (debuffTypes.indexOf(unit.statusEffects[i].type) >= 0) {
            debuffs.push({idx: i, dur: unit.statusEffects[i].duration});
        }
    }
    debuffs.sort(function(a,b){ return b.dur - a.dur; }); // longest first
    var toRemove = count === 0 ? debuffs.length : Math.min(count, debuffs.length);
    var indices = [];
    for (var j = 0; j < toRemove; j++) indices.push(debuffs[j].idx);
    indices.sort(function(a,b){ return b - a; }); // remove from end
    for (var k = 0; k < indices.length; k++) {
        unit.statusEffects.splice(indices[k], 1);
    }
}
```

### Status Effects on Movement & Attacking
In `combatTick()`, before a unit moves or attacks, check:
```js
// Stun/Freeze: cannot move, cannot attack
if (hasStatus(unit, 'stun') || hasStatus(unit, 'freeze')) {
    continue; // skip this unit's turn entirely
}

// Root: cannot move, CAN attack
var isRooted = hasStatus(unit, 'root');
// Skip movement if rooted, but allow attack if in range

// Taunt: override target
var tauntEffect = null;
for (var te = 0; te < unit.statusEffects.length; te++) {
    if (unit.statusEffects[te].type === 'taunt' && unit.statusEffects[te].source && unit.statusEffects[te].source.hp > 0) {
        tauntEffect = unit.statusEffects[te];
        break;
    }
}
if (tauntEffect) {
    unit.target = tauntEffect.source; // forced target
}

// Slow: reduce effective move speed
var slowPct = getStatusValue(unit, 'slow');
var effectiveMoveSpd = getMoveSpeed(unit) * (1 - slowPct);
```

### Dodge Buff Integration
In `dealDamage()`, the existing dodge check should also consider `dodgeBuff` status:
```js
// In dealDamage, step 5 (dodge check):
var totalDodge = target.dodgeChance || 0;
var dodgeBuff = getStatusValue(target, 'dodgeBuff');
if (dodgeBuff > 0) totalDodge += dodgeBuff;
if (options.canDodge && totalDodge > 0 && Math.random() < totalDodge) { ... }
```

### Freeze Vulnerability
In `dealDamage()`, if target has `freeze` status, apply +20% damage:
```js
// After DR step, before dodge:
if (hasStatus(target, 'freeze')) {
    dmg = Math.floor(dmg * 1.2);
}
// Also check for 'vulnerability' status
var vulnPct = getStatusValue(target, 'vulnerability');
if (vulnPct > 0) dmg = Math.floor(dmg * (1 + vulnPct));
```

### Healing Reduction
In `dealHealing()`, check for burn/healReduction:
```js
function dealHealing(source, target, amount) {
    var reduction = 0;
    if (hasStatus(target, 'burn')) reduction += 0.25;  // burn = 25% reduced healing
    if (hasStatus(target, 'healReduction')) {
        reduction += getStatusValue(target, 'healReduction');
    }
    if (reduction > 0) amount = Math.floor(amount * (1 - Math.min(reduction, 0.9)));
    // ... rest unchanged
}
```

### ATK Mod Status
In `performAttack()` (or wherever `attacker.attack` is read for damage), apply ATK mod:
```js
var effectiveAtk = unit.attack;
var atkMod = getStatusValue(unit, 'atkMod');
if (atkMod !== 0) effectiveAtk = Math.floor(effectiveAtk * (1 + atkMod));
// Note: atkMod can be negative (e.g., -0.2 for Hydro Mage debuff)
```
For ATK debuffs, store the value as negative (e.g., -0.2 for -20% ATK).
For ATK buffs, store as positive (e.g., 0.15 for +15% ATK).

### Reflect Status
When a unit with `reflect` status takes melee damage (distance ≤ 1), deal reflect damage back:
```js
// In dealDamage(), after HP is applied, if source is in melee range:
if (hasStatus(target, 'reflect') && !options.isReflect) {
    var reflectPct = getStatusValue(target, 'reflect');
    var reflectDmg = Math.floor(result.totalDamage * reflectPct);
    if (reflectDmg > 0 && getManhattanDist(source.gridRow, source.gridCol, target.gridRow, target.gridCol) <= 1) {
        dealDamage(target, source, reflectDmg, {isTrueDamage:true, canCrit:false, canDodge:false, applyElement:false, triggerOnHit:false, isReflect:true});
    }
}
```
Add `isReflect` to options to prevent infinite loops.

---

## Part 4: Mana System

### Mana Initialization
In `initCombat()`, for each unit (player and enemy):
```js
// Look up maxMana from template
var templateKey = unit.templateKey || unit.key;  // whatever field stores the unit's template key
var template = UNIT_TEMPLATES[templateKey] || EVOLVED_TEMPLATES[templateKey];
unit.maxMana = template ? (template.maxMana || 0) : 0;
unit.currentMana = 0;
unit.isCasting = false;
unit.castTimer = 0;
unit.abilityBuffs = {};
```

### Mana Generation
Two sources of mana generation, both in `main-v2.js`:

**On auto-attack (in `performAttack()`, after calling dealDamage for an auto-attack):**
```js
if (attacker.maxMana > 0) {
    attacker.currentMana = Math.min(attacker.maxMana, attacker.currentMana + 10);
}
```

**On taking damage (in `dealDamage()`, step 7, after HP is applied):**
```js
if (target.maxMana > 0 && result.totalDamage > 0) {
    var manaFromDmg = Math.floor((result.totalDamage / target.maxHp) * 50);
    manaFromDmg = Math.max(1, manaFromDmg); // minimum 1 mana from any hit
    target.currentMana = Math.min(target.maxMana, target.currentMana + manaFromDmg);
}
```

### Ability Casting Flow
In `combatTick()`, after a unit finishes its auto-attack (right after `performAttack()` is called), check mana:

```js
// After auto-attack resolves:
if (unit.maxMana > 0 && unit.currentMana >= unit.maxMana && !unit.isCasting) {
    unit.isCasting = true;
    unit.castTimer = 0.3; // 0.3s cast time
}

// At the START of each unit's tick processing, check if casting:
if (unit.isCasting) {
    unit.castTimer -= dt;
    if (unit.castTimer <= 0) {
        // Cast ability
        executeAbility(unit);
        unit.currentMana = 0;
        unit.isCasting = false;
        unit.attackCooldown = unit.attackSpd || 1.0; // reset attack cooldown
    }
    continue; // skip movement and attacking while casting
}
```

### Mana Reset Between Waves
Between waves, mana resets to 0. Status effects are cleared. In the between-wave logic:
```js
unit.currentMana = 0;
unit.isCasting = false;
unit.castTimer = 0;
unit.statusEffects = [];
unit.abilityBuffs = {};
```

---

## Part 5: Ability Execution — `executeAbility()`

Add `executeAbility(caster)` in `main-v2.js`. This is the central dispatch function for all 36 abilities. It reads the caster's template key and executes the corresponding ability logic.

**IMPORTANT**: Use `dealDamage()` for all damage, `dealHealing()` for all heals, `grantShield()` for all shields, `addStatus()` for all status effects. This ensures combat stats tracking works.

### Grid Helper Functions Needed
Add these helper functions (some may already exist — reuse if so):

```js
function getUnitsInRadius(centerRow, centerCol, radius, pool) {
    // Returns all alive units from pool within Manhattan distance <= radius of center
    var result = [];
    for (var i = 0; i < pool.length; i++) {
        if (pool[i].hp > 0 && getManhattanDist(centerRow, centerCol, pool[i].gridRow, pool[i].gridCol) <= radius) {
            result.push(pool[i]);
        }
    }
    return result;
}

function getUnitsInRow(row, pool) {
    // Returns all alive units from pool in the specified row
    var result = [];
    for (var i = 0; i < pool.length; i++) {
        if (pool[i].hp > 0 && pool[i].gridRow === row) {
            result.push(pool[i]);
        }
    }
    return result;
}

function getLowestHpUnits(pool, count) {
    // Returns the N alive units with lowest HP% from pool
    var alive = [];
    for (var i = 0; i < pool.length; i++) {
        if (pool[i].hp > 0) alive.push(pool[i]);
    }
    alive.sort(function(a, b) { return (a.hp / a.maxHp) - (b.hp / b.maxHp); });
    return alive.slice(0, count);
}

function getRandomAlive(pool, count) {
    // Returns N random alive units from pool (no duplicates)
    var alive = [];
    for (var i = 0; i < pool.length; i++) {
        if (pool[i].hp > 0) alive.push(pool[i]);
    }
    // Fisher-Yates shuffle
    for (var j = alive.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var temp = alive[j]; alive[j] = alive[k]; alive[k] = temp;
    }
    return alive.slice(0, count);
}

function getFurthestEnemy(caster, pool) {
    // Returns the alive enemy with greatest Manhattan distance
    var best = null, bestDist = -1;
    for (var i = 0; i < pool.length; i++) {
        if (pool[i].hp > 0) {
            var d = getManhattanDist(caster.gridRow, caster.gridCol, pool[i].gridRow, pool[i].gridCol);
            if (d > bestDist) { bestDist = d; best = pool[i]; }
        }
    }
    return best;
}

function getLowestHpEnemy(pool) {
    var best = null;
    for (var i = 0; i < pool.length; i++) {
        if (pool[i].hp > 0 && (!best || pool[i].hp < best.hp)) best = pool[i];
    }
    return best;
}

function moveUnitToCell(unit, row, col, grid) {
    // Instantly move unit to target cell (for teleport/dash abilities)
    if (grid[unit.gridRow] && grid[unit.gridRow][unit.gridCol] === unit) {
        grid[unit.gridRow][unit.gridCol] = null;
    }
    unit.gridRow = row;
    unit.gridCol = col;
    if (grid[row]) grid[row][col] = unit;
}

function findEmptyCellNear(row, col, grid) {
    // BFS outward from (row,col) to find nearest empty cell
    var visited = {};
    var queue = [{r: row, c: col}];
    visited[row + ',' + col] = true;
    while (queue.length > 0) {
        var cell = queue.shift();
        if (cell.r >= 0 && cell.r < 8 && cell.c >= 0 && cell.c < 7) {
            if (!grid[cell.r][cell.c]) return {row: cell.r, col: cell.c};
        }
        var dirs = [[0,1],[0,-1],[1,0],[-1,0]];
        for (var d = 0; d < dirs.length; d++) {
            var nr = cell.r + dirs[d][0], nc = cell.c + dirs[d][1];
            var key = nr + ',' + nc;
            if (!visited[key] && nr >= 0 && nr < 8 && nc >= 0 && nc < 7) {
                visited[key] = true;
                queue.push({r: nr, c: nc});
            }
        }
    }
    return null;
}
```

### The `executeAbility()` Function

```js
function executeAbility(caster) {
    if (!caster || caster.hp <= 0 || !combatState) return;

    var key = caster.templateKey;  // the template key (e.g., 'flame_warrior', 'fire_berserker')
    var enemies = caster.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
    var allies = caster.side === 'player' ? combatState.playerUnits : combatState.enemyUnits;
    var grid = combatState.grid;
    var target = caster.target;
    var atk = caster.attack;

    // Apply ATK mod status for ability damage scaling
    var atkMod = getStatusValue(caster, 'atkMod');
    if (atkMod !== 0) atk = Math.floor(atk * (1 + atkMod));
    // Also apply abilityBuffs.nextAtkMult if set (Zephyr Scout)
    if (caster.abilityBuffs && caster.abilityBuffs.nextAtkMult) {
        atk = Math.floor(atk * caster.abilityBuffs.nextAtkMult);
        delete caster.abilityBuffs.nextAtkMult;
    }

    switch (key) {

    // ===== COST 1 BASE =====

    case 'flame_warrior':
        // Flame Slash: 150% ATK to target, Burn 20 DPS 3s
        if (target && target.hp > 0) {
            dealDamage(caster, target, Math.floor(atk * 1.5), {isAbility:true, triggerOnHit:false});
            addStatus(target, 'burn', 3, 20, caster);
        }
        break;

    case 'ember_scout':
        // Shadow Strike: teleport to furthest enemy, 200% ATK, 50% dodge 1.5s
        var far = getFurthestEnemy(caster, enemies);
        if (far) {
            var emptyNear = findEmptyCellNear(far.gridRow, far.gridCol, grid);
            if (emptyNear) moveUnitToCell(caster, emptyNear.row, emptyNear.col, grid);
            dealDamage(caster, far, Math.floor(atk * 2.0), {isAbility:true, triggerOnHit:false});
            addStatus(caster, 'dodgeBuff', 1.5, 0.5, caster);
        }
        break;

    case 'tide_hunter':
        // Crashing Wave: 100% ATK to all enemies in target's row, 20% slow 3s
        if (target && target.hp > 0) {
            var rowEnemies = getUnitsInRow(target.gridRow, enemies);
            for (var i = 0; i < rowEnemies.length; i++) {
                dealDamage(caster, rowEnemies[i], Math.floor(atk * 1.0), {isAbility:true, triggerOnHit:false});
                addStatus(rowEnemies[i], 'slow', 3, 0.2, caster);
            }
        }
        break;

    case 'frost_archer':
        // Frost Shot: next 3 attacks +30% damage, apply 20% slow 2s
        caster.abilityBuffs.frostShot = 3;
        break;

    case 'stone_guard':
        // Stone Wall: shield 30% maxHP, taunt enemies within 2 cells for 3s
        grantShield(caster, caster, Math.floor(caster.maxHp * 0.3));
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
        for (var i = 0; i < nearby.length; i++) {
            addStatus(nearby[i], 'taunt', 3, 0, caster);
        }
        break;

    case 'zephyr_scout':
        // Wind Step: 100% dodge 2s, next attack 250% ATK
        addStatus(caster, 'dodgeBuff', 2, 1.0, caster);
        caster.abilityBuffs.nextAtkMult = 2.5;
        break;

    case 'wind_archer':
        // Gale Shot: 120% ATK to all enemies in target's row
        if (target && target.hp > 0) {
            var rowEn = getUnitsInRow(target.gridRow, enemies);
            for (var i = 0; i < rowEn.length; i++) {
                dealDamage(caster, rowEn[i], Math.floor(atk * 1.2), {isAbility:true, triggerOnHit:false});
            }
        }
        break;

    // ===== COST 1 EVOLVED =====

    case 'fire_berserker':
        // Inferno Slash: 200% ATK to target + adjacent, Burn 30 DPS 5s
        if (target && target.hp > 0) {
            dealDamage(caster, target, Math.floor(atk * 2.0), {isAbility:true, triggerOnHit:false});
            addStatus(target, 'burn', 5, 30, caster);
            var adj = getUnitsInRadius(target.gridRow, target.gridCol, 1, enemies);
            for (var i = 0; i < adj.length; i++) {
                if (adj[i] !== target) {
                    dealDamage(caster, adj[i], Math.floor(atk * 2.0), {isAbility:true, triggerOnHit:false});
                    addStatus(adj[i], 'burn', 5, 30, caster);
                }
            }
        }
        break;

    case 'flame_rogue':
        // Phantom Blaze: teleport to furthest, 250% ATK, leave fire trail (tracked as burn zone — simplified: just burn on previous cell occupants)
        var far2 = getFurthestEnemy(caster, enemies);
        if (far2) {
            // Remember old position for fire trail
            var oldRow = caster.gridRow, oldCol = caster.gridCol;
            var emptyNear2 = findEmptyCellNear(far2.gridRow, far2.gridCol, grid);
            if (emptyNear2) moveUnitToCell(caster, emptyNear2.row, emptyNear2.col, grid);
            dealDamage(caster, far2, Math.floor(atk * 2.5), {isAbility:true, triggerOnHit:false});
            // Fire trail: apply burn to enemies near old position
            var trailTargets = getUnitsInRadius(oldRow, oldCol, 1, enemies);
            for (var i = 0; i < trailTargets.length; i++) {
                addStatus(trailTargets[i], 'burn', 3, 25, caster);
            }
        }
        break;

    case 'tsunami_blade':
        // Tidal Surge: 150% ATK in 2-cell line toward target, 40% slow 4s, pull 1 cell
        if (target && target.hp > 0) {
            // Get direction from caster toward target
            var dr = target.gridRow > caster.gridRow ? 1 : (target.gridRow < caster.gridRow ? -1 : 0);
            var dc = target.gridCol > caster.gridCol ? 1 : (target.gridCol < caster.gridCol ? -1 : 0);
            // Hit enemies on the 2 cells in the line
            for (var step = 1; step <= 2; step++) {
                var checkR = caster.gridRow + dr * step;
                var checkC = caster.gridCol + dc * step;
                if (checkR >= 0 && checkR < 8 && checkC >= 0 && checkC < 7 && grid[checkR] && grid[checkR][checkC]) {
                    var lineTarget = grid[checkR][checkC];
                    if (lineTarget.hp > 0 && lineTarget.side !== caster.side) {
                        dealDamage(caster, lineTarget, Math.floor(atk * 1.5), {isAbility:true, triggerOnHit:false});
                        addStatus(lineTarget, 'slow', 4, 0.4, caster);
                        // Pull 1 cell toward caster (simplified: just move 1 cell closer)
                        var pullR = lineTarget.gridRow - dr;
                        var pullC = lineTarget.gridCol - dc;
                        if (pullR >= 0 && pullR < 8 && pullC >= 0 && pullC < 7 && !grid[pullR][pullC]) {
                            moveUnitToCell(lineTarget, pullR, pullC, grid);
                        }
                    }
                }
            }
        }
        break;

    case 'ice_sniper':
        // Frozen Volley: 3 arrows at random enemies, 80% ATK each, freeze (stun) 1s
        var iceTargets = getRandomAlive(enemies, 3);
        for (var i = 0; i < iceTargets.length; i++) {
            dealDamage(caster, iceTargets[i], Math.floor(atk * 0.8), {isAbility:true, triggerOnHit:false});
            addStatus(iceTargets[i], 'freeze', 1, 0, caster);
        }
        break;

    case 'mountain_lord':
        // Earthquake: taunt within 3 cells, shield 40% maxHP, taunted -15% ATK
        grantShield(caster, caster, Math.floor(caster.maxHp * 0.4));
        var tauntTargets = getUnitsInRadius(caster.gridRow, caster.gridCol, 3, enemies);
        for (var i = 0; i < tauntTargets.length; i++) {
            addStatus(tauntTargets[i], 'taunt', 4, 0, caster);
            addStatus(tauntTargets[i], 'atkMod', 4, -0.15, caster);
        }
        break;

    case 'storm_assassin':
        // Lightning Execution: dash to lowest HP enemy, 300% ATK, kill refunds 50% mana
        var lowestEnemy = getLowestHpEnemy(enemies);
        if (lowestEnemy) {
            var emptyNear3 = findEmptyCellNear(lowestEnemy.gridRow, lowestEnemy.gridCol, grid);
            if (emptyNear3) moveUnitToCell(caster, emptyNear3.row, emptyNear3.col, grid);
            var result = dealDamage(caster, lowestEnemy, Math.floor(atk * 3.0), {isAbility:true, triggerOnHit:false});
            if (result.killed) {
                caster.currentMana = Math.floor(caster.maxMana * 0.5);
            }
        }
        break;

    case 'gale_sniper':
        // Tempest Barrage: 5 shots at target, 60% ATK each, ignore 50% DR
        if (target && target.hp > 0) {
            for (var i = 0; i < 5; i++) {
                if (target.hp > 0) {
                    // Temporarily halve target's DR
                    var savedDR = target.damageReduction || 0;
                    target.damageReduction = savedDR * 0.5;
                    dealDamage(caster, target, Math.floor(atk * 0.6), {isAbility:true, triggerOnHit:false});
                    target.damageReduction = savedDR;
                }
            }
        }
        break;

    // ===== COST 2 BASE =====

    case 'magma_knight':
        // Magma Shield: shield 25% maxHP, reflect 30% melee damage 4s
        grantShield(caster, caster, Math.floor(caster.maxHp * 0.25));
        addStatus(caster, 'reflect', 4, 0.3, caster);
        break;

    case 'coral_priest':
        // Healing Wave: heal 2 lowest HP allies for 150% ATK each
        var healTargets = getLowestHpUnits(allies, 2);
        for (var i = 0; i < healTargets.length; i++) {
            dealHealing(caster, healTargets[i], Math.floor(atk * 1.5));
        }
        break;

    case 'hydro_mage':
        // Water Bolt: 200% ATK to target, -20% ATK for 4s
        if (target && target.hp > 0) {
            dealDamage(caster, target, Math.floor(atk * 2.0), {isAbility:true, triggerOnHit:false});
            addStatus(target, 'atkMod', 4, -0.2, caster);
        }
        break;

    case 'vine_archer':
        // Entangle: root target 2s, 150% ATK
        if (target && target.hp > 0) {
            addStatus(target, 'root', 2, 0, caster);
            dealDamage(caster, target, Math.floor(atk * 1.5), {isAbility:true, triggerOnHit:false});
        }
        break;

    case 'earth_shaman':
        // Nature's Touch: heal lowest HP ally for 200% ATK, cleanse 1 debuff
        var healTarget = getLowestHpUnits(allies, 1);
        if (healTarget.length > 0) {
            dealHealing(caster, healTarget[0], Math.floor(atk * 2.0));
            clearDebuffs(healTarget[0], 1);
        }
        break;

    case 'storm_mage':
        // Chain Lightning: 180% ATK to target, bounces to 2 nearby at 60% per bounce
        if (target && target.hp > 0) {
            dealDamage(caster, target, Math.floor(atk * 1.8), {isAbility:true, triggerOnHit:false});
            // Bounce to 2 nearby enemies within 2 cells of previous target
            var lastHit = target;
            var alreadyHit = [target];
            for (var bounce = 0; bounce < 2; bounce++) {
                var bestBounce = null, bestBounceDist = 999;
                for (var j = 0; j < enemies.length; j++) {
                    if (enemies[j].hp > 0 && alreadyHit.indexOf(enemies[j]) < 0) {
                        var bd = getManhattanDist(lastHit.gridRow, lastHit.gridCol, enemies[j].gridRow, enemies[j].gridCol);
                        if (bd <= 2 && bd < bestBounceDist) {
                            bestBounceDist = bd;
                            bestBounce = enemies[j];
                        }
                    }
                }
                if (bestBounce) {
                    dealDamage(caster, bestBounce, Math.floor(atk * 1.8 * 0.6), {isAbility:true, triggerOnHit:false});
                    alreadyHit.push(bestBounce);
                    lastHit = bestBounce;
                }
            }
        }
        break;

    case 'sky_knight':
        // Battle Cry: all allies +15% ATK, 100 shield for 5s
        for (var i = 0; i < allies.length; i++) {
            if (allies[i].hp > 0) {
                addStatus(allies[i], 'atkMod', 5, 0.15, caster);
                grantShield(caster, allies[i], 100);
            }
        }
        break;

    // ===== COST 2 EVOLVED =====

    case 'volcano_titan':
        // PASSIVE — handled in death processing, not here
        break;

    case 'ocean_sage':
        // Tidal Blessing: heal ALL allies 100% ATK, each gets 100 shield
        for (var i = 0; i < allies.length; i++) {
            if (allies[i].hp > 0) {
                dealHealing(caster, allies[i], Math.floor(atk * 1.0));
                grantShield(caster, allies[i], 100);
            }
        }
        break;

    case 'abyssal_mage':
        // Depth Charge: 250% ATK to target, 50% splash within 1 cell, -30% ATK 5s
        if (target && target.hp > 0) {
            dealDamage(caster, target, Math.floor(atk * 2.5), {isAbility:true, triggerOnHit:false});
            addStatus(target, 'atkMod', 5, -0.3, caster);
            var splash = getUnitsInRadius(target.gridRow, target.gridCol, 1, enemies);
            for (var i = 0; i < splash.length; i++) {
                if (splash[i] !== target && splash[i].hp > 0) {
                    dealDamage(caster, splash[i], Math.floor(atk * 2.5 * 0.5), {isAbility:true, triggerOnHit:false});
                    addStatus(splash[i], 'atkMod', 5, -0.3, caster);
                }
            }
        }
        break;

    case 'thorn_ranger':
        // Thorn Prison: root target + within 1 cell 2.5s, 120% ATK, rooted +15% damage
        if (target && target.hp > 0) {
            var thornTargets = getUnitsInRadius(target.gridRow, target.gridCol, 1, enemies);
            for (var i = 0; i < thornTargets.length; i++) {
                addStatus(thornTargets[i], 'root', 2.5, 0, caster);
                addStatus(thornTargets[i], 'vulnerability', 2.5, 0.15, caster);
                dealDamage(caster, thornTargets[i], Math.floor(atk * 1.2), {isAbility:true, triggerOnHit:false});
            }
        }
        break;

    case 'gaia_priest':
        // Life Bloom: heal 3 lowest allies 150% ATK, regen 2% maxHP/s 4s, cleanse all debuffs
        var bloomTargets = getLowestHpUnits(allies, 3);
        for (var i = 0; i < bloomTargets.length; i++) {
            dealHealing(caster, bloomTargets[i], Math.floor(atk * 1.5));
            addStatus(bloomTargets[i], 'regen', 4, 0.02, caster);
            clearDebuffs(bloomTargets[i], 0); // clear all
        }
        break;

    case 'tempest_wizard':
        // Thunder Storm: 150% ATK to 3 random enemies, 30% stun 1.5s each
        var stormTargets = getRandomAlive(enemies, 3);
        for (var i = 0; i < stormTargets.length; i++) {
            dealDamage(caster, stormTargets[i], Math.floor(atk * 1.5), {isAbility:true, triggerOnHit:false});
            if (Math.random() < 0.3) {
                addStatus(stormTargets[i], 'stun', 1.5, 0, caster);
            }
        }
        break;

    case 'aegis_paladin':
        // Divine Aegis: all allies +20% ATK, 200 shield, +15% DR 5s
        for (var i = 0; i < allies.length; i++) {
            if (allies[i].hp > 0) {
                addStatus(allies[i], 'atkMod', 5, 0.2, caster);
                grantShield(caster, allies[i], 200);
                addStatus(allies[i], 'drMod', 5, 0.15, caster);
            }
        }
        break;

    // ===== COST 3 BASE =====

    case 'pyromancer':
        // Meteor: 250% ATK in 2-cell radius, burn 25 DPS 4s
        if (target && target.hp > 0) {
            var meteorTargets = getUnitsInRadius(target.gridRow, target.gridCol, 2, enemies);
            for (var i = 0; i < meteorTargets.length; i++) {
                dealDamage(caster, meteorTargets[i], Math.floor(atk * 2.5), {isAbility:true, triggerOnHit:false});
                addStatus(meteorTargets[i], 'burn', 4, 25, caster);
            }
        }
        break;

    case 'golem':
        // Seismic Slam: stun within 1 cell 1.5s, 150% ATK
        var slamTargets = getUnitsInRadius(caster.gridRow, caster.gridCol, 1, enemies);
        for (var i = 0; i < slamTargets.length; i++) {
            addStatus(slamTargets[i], 'stun', 1.5, 0, caster);
            dealDamage(caster, slamTargets[i], Math.floor(atk * 1.5), {isAbility:true, triggerOnHit:false});
        }
        break;

    // ===== COST 3 EVOLVED =====

    case 'inferno_mage':
        // Inferno: 300% ATK in 3-cell radius, burn 40 DPS 5s, -50% healing
        if (target && target.hp > 0) {
            var infernoTargets = getUnitsInRadius(target.gridRow, target.gridCol, 3, enemies);
            for (var i = 0; i < infernoTargets.length; i++) {
                dealDamage(caster, infernoTargets[i], Math.floor(atk * 3.0), {isAbility:true, triggerOnHit:false});
                addStatus(infernoTargets[i], 'burn', 5, 40, caster);
                addStatus(infernoTargets[i], 'healReduction', 5, 0.5, caster);
            }
        }
        break;

    case 'titan':
        // Colossal Impact: stun within 2 cells 2s, 200% ATK, shield 20% maxHP per stunned
        var impactTargets = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
        var stunCount = 0;
        for (var i = 0; i < impactTargets.length; i++) {
            addStatus(impactTargets[i], 'stun', 2, 0, caster);
            dealDamage(caster, impactTargets[i], Math.floor(atk * 2.0), {isAbility:true, triggerOnHit:false});
            stunCount++;
        }
        if (stunCount > 0) {
            grantShield(caster, caster, Math.floor(caster.maxHp * 0.2 * stunCount));
        }
        break;

    // ===== COST 4 =====

    case 'fire_dragon':
        // Dragon Breath: 200% ATK in cone (3 deep, widening), burn 30 DPS 5s, +25% vs already burning
        if (target && target.hp > 0) {
            var dr4 = target.gridRow > caster.gridRow ? 1 : (target.gridRow < caster.gridRow ? -1 : 0);
            var dc4 = target.gridCol > caster.gridCol ? 1 : (target.gridCol < caster.gridCol ? -1 : 0);
            // Cone: row 1 = 1 cell, row 2 = 3 cells, row 3 = 5 cells (widening)
            var coneTargets = [];
            for (var step = 1; step <= 3; step++) {
                var baseR = caster.gridRow + dr4 * step;
                var baseC = caster.gridCol + dc4 * step;
                var spread = step - 1; // 0, 1, 2
                for (var sc = -spread; sc <= spread; sc++) {
                    var cr = baseR + (dc4 === 0 ? 0 : sc * (dr4 === 0 ? 1 : 0));
                    var cc = baseC + (dr4 === 0 ? 0 : sc * (dc4 === 0 ? 1 : 0));
                    // Simplified: check spread perpendicular to direction
                    if (dr4 !== 0) { cr = baseR; cc = baseC + sc; }
                    else { cr = baseR + sc; cc = baseC; }
                    if (cr >= 0 && cr < 8 && cc >= 0 && cc < 7 && grid[cr] && grid[cr][cc]) {
                        var coneUnit = grid[cr][cc];
                        if (coneUnit.hp > 0 && coneUnit.side !== caster.side && coneTargets.indexOf(coneUnit) < 0) {
                            coneTargets.push(coneUnit);
                        }
                    }
                }
            }
            for (var i = 0; i < coneTargets.length; i++) {
                var bonusMult = hasStatus(coneTargets[i], 'burn') ? 1.25 : 1.0;
                dealDamage(caster, coneTargets[i], Math.floor(atk * 2.0 * bonusMult), {isAbility:true, triggerOnHit:false});
                addStatus(coneTargets[i], 'burn', 5, 30, caster);
            }
        }
        break;

    case 'leviathan':
        // Tidal Crush: 180% ATK to ALL enemies, 30% slow 3s, self-heal 10% total damage
        var totalDmg = 0;
        for (var i = 0; i < enemies.length; i++) {
            if (enemies[i].hp > 0) {
                var r = dealDamage(caster, enemies[i], Math.floor(atk * 1.8), {isAbility:true, triggerOnHit:false});
                totalDmg += r.totalDamage;
                addStatus(enemies[i], 'slow', 3, 0.3, caster);
            }
        }
        if (totalDmg > 0) {
            dealHealing(caster, caster, Math.floor(totalDmg * 0.1));
        }
        break;

    // ===== COST 5 (Passives — handled elsewhere, not via mana) =====
    case 'phoenix':
    case 'world_tree':
        // These are passive abilities — see Part 6 below
        break;

    default:
        // Unknown ability — log warning
        addCombatLog('Unknown ability for: ' + (caster.name || key));
        break;
    }

    // Log ability cast
    var abilityInfo = ABILITY_DATA[key];
    if (abilityInfo && key !== 'phoenix' && key !== 'world_tree' && key !== 'volcano_titan') {
        addCombatLog(caster.name + ' casts ' + abilityInfo.name + '!');
    }
}
```

---

## Part 6: Passive Abilities (Cost 5 + Volcano Titan)

These 3 units have passive abilities that don't use mana. Wire them into combat differently:

### Phoenix — Rebirth (On Death)
In the death-check section of `dealDamage()` (or wherever a unit dies), BEFORE removing the unit:
```js
// Check Phoenix revive
if (target.templateKey === 'phoenix' && !target.phoenixReviveUsed) {
    target.phoenixReviveUsed = true;
    target.hp = 1; // keep alive temporarily
    target.stasis = 2.0; // 2s invulnerability (use existing stasis system)
    target.phoenixRevivePending = true;
    // Don't process normal death
}
```

In `combatTick()`, when stasis expires on a Phoenix with `phoenixRevivePending`:
```js
if (unit.phoenixRevivePending && unit.stasis <= 0) {
    unit.phoenixRevivePending = false;
    unit.hp = Math.floor(unit.maxHp * 0.5);
    // AoE damage on revival
    var reviveEnemies = caster.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
    for (var i = 0; i < reviveEnemies.length; i++) {
        if (reviveEnemies[i].hp > 0) {
            dealDamage(unit, reviveEnemies[i], Math.floor(unit.attack * 2.5), {isAbility:true, isTrueDamage:true, triggerOnHit:false});
        }
    }
    addCombatLog(unit.name + ' rises from the ashes!');
}
```

Also: while Phoenix is alive, allies within 2 cells gain +10% ATK. Apply this as a passive aura check each tick (or at combat start with periodic refresh). Simplest: in `combatTick()`, every second (use a timer), apply/refresh a short `atkMod` to nearby allies.

### World Tree — Bloom of Life (Threshold Trigger)
In `combatTick()` or in `dealDamage()` after HP is applied, check:
```js
// After any ally takes damage, check World Tree trigger
if (!combatState.worldTreeTriggered) {
    // Find if any alive ally is below 20% HP
    var wtAllies = target.side === 'player' ? combatState.playerUnits : combatState.enemyUnits;
    var worldTree = null;
    for (var i = 0; i < wtAllies.length; i++) {
        if (wtAllies[i].hp > 0 && wtAllies[i].templateKey === 'world_tree') {
            worldTree = wtAllies[i]; break;
        }
    }
    if (worldTree && target.side === worldTree.side && target.hp > 0 && target.hp < target.maxHp * 0.2) {
        combatState.worldTreeTriggered = true;
        // Heal ALL allies for 30% maxHP, cleanse all debuffs
        for (var j = 0; j < wtAllies.length; j++) {
            if (wtAllies[j].hp > 0) {
                dealHealing(worldTree, wtAllies[j], Math.floor(wtAllies[j].maxHp * 0.3));
                clearDebuffs(wtAllies[j], 0);
            }
        }
        addCombatLog(worldTree.name + ' triggers Bloom of Life!');
    }
}
```

World Tree passive aura: allies within range heal 1% max HP per second. Implement same as Phoenix aura — periodic check in `combatTick()`.

### Volcano Titan — Eruption (On Death)
In the death-check of `dealDamage()`:
```js
if (target.templateKey === 'volcano_titan' && target.hp <= 0) {
    // Deal 300% ATK to enemies within 2 cells
    var vtEnemies = target.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
    var eruTargets = getUnitsInRadius(target.gridRow, target.gridCol, 2, vtEnemies);
    for (var i = 0; i < eruTargets.length; i++) {
        dealDamage(target, eruTargets[i], Math.floor(target.attack * 3.0), {isAbility:true, isTrueDamage:true, triggerOnHit:false});
        addStatus(eruTargets[i], 'burn', 3, 40, target);
    }
    addCombatLog(target.name + ' erupts on death!');
}
```

---

## Part 7: Frost Shot Buff (Special Case)

Frost Archer's `frostShot` buff modifies the next 3 auto-attacks. In `performAttack()`, check:
```js
if (attacker.abilityBuffs && attacker.abilityBuffs.frostShot && attacker.abilityBuffs.frostShot > 0) {
    // +30% damage on this auto-attack
    var boostedDmg = Math.floor(rawDmg * 1.3);
    var result = dealDamage(attacker, target, boostedDmg, {isAutoAttack:true});
    // Apply slow
    addStatus(target, 'slow', 2, 0.2, attacker);
    attacker.abilityBuffs.frostShot--;
} else {
    // Normal auto-attack
    dealDamage(attacker, target, rawDmg, {isAutoAttack:true});
}
```

---

## Part 8: DR Mod Status Integration

The `drMod` status (from Aegis Paladin, etc.) needs to be factored into `dealDamage()`:
```js
// In dealDamage step 4 (damage reduction):
var totalDR = target.damageReduction || 0;
var drMod = getStatusValue(target, 'drMod');
if (drMod > 0) totalDR += drMod;
totalDR = Math.min(totalDR, 0.75); // cap at 75% DR
if (!options.isTrueDamage && totalDR > 0) {
    dmg = Math.floor(dmg * (1 - totalDR));
}
```

---

## Part 9: Template Key Tracking

In `initCombat()`, make sure every unit has a `templateKey` field so `executeAbility()` can look up the right ability:
```js
// For player units created from roster:
unit.templateKey = unit.key || unit.templateKey;  // preserve whatever key was set during unit creation

// For enemy units generated by missions.js:
// Enemy units are created from UNIT_TEMPLATES/EVOLVED_TEMPLATES, so they should have a key.
// If not, derive it from the template lookup. Add this in enemy generation or in initCombat:
if (!unit.templateKey) {
    // Try to find by name match
    for (var tKey in UNIT_TEMPLATES) {
        if (UNIT_TEMPLATES[tKey].name === unit.name) { unit.templateKey = tKey; break; }
    }
    if (!unit.templateKey) {
        for (var eKey in EVOLVED_TEMPLATES) {
            if (EVOLVED_TEMPLATES[eKey].name === unit.name) { unit.templateKey = eKey; break; }
        }
    }
}
```

---

## Part 10: Mana Bar Rendering

### In `ui-v2.js` — `renderCombatBoard()`
Below each unit's HP bar, add a mana bar. Only show for units with maxMana > 0.

```html
<!-- Inside each combat cell that has a unit -->
<div class="unit-hp-bar">
    <div class="unit-hp-fill" style="width:{hpPct}%"></div>
    <div class="unit-shield-fill" style="width:{shieldPct}%"></div>
</div>
<!-- NEW: Mana bar (only if maxMana > 0) -->
<div class="unit-mana-bar" style="display:{maxMana > 0 ? 'block' : 'none'}">
    <div class="unit-mana-fill" style="width:{manaPct}%"></div>
</div>
```

### CSS (`game-v2.html`)
```css
.unit-mana-bar {
    width: 100%;
    height: 3px;
    background: #1a1a3a;
    border-radius: 1px;
    overflow: hidden;
    margin-top: 1px;
}
.unit-mana-fill {
    height: 100%;
    background: #4488ff;
    border-radius: 1px;
    transition: width 0.05s linear;
}
```

### Ability Name on Cast
When a unit casts, briefly show the ability name. Simplest: add the ability name to the combat log (already done in `executeAbility()`). Optionally, show a brief text flash over the unit cell — but this is low priority and can be deferred to chunk 6 (visual polish).

### Scoreboard Enhancement
In the combat scoreboard (`renderCombatScoreboard()`), add mana bar info for each unit. Show a small mana indicator like "⚡ 45/60" next to the unit name when mana is not 0 or full.

---

## Part 11: Ability Stat Tracking for Scoreboard

Add to `combatStats`:
```js
unit.combatStats.abilityCasts = 0;  // number of times ability was cast
```

Increment in `executeAbility()`:
```js
caster.combatStats.abilityCasts++;
```

Show in scoreboard if > 0: e.g., "2 casts" next to the unit.

---

## Files to Modify

### `units.js`
- Add `maxMana` field to every entry in UNIT_TEMPLATES and EVOLVED_TEMPLATES
- Add `ABILITY_DATA` lookup table (name + desc for each unit)

### `main-v2.js`
- Add status effect functions: `processStatusEffects()`, `hasStatus()`, `getStatusValue()`, `addStatus()`, `clearDebuffs()`
- Add grid helpers: `getUnitsInRadius()`, `getUnitsInRow()`, `getLowestHpUnits()`, `getRandomAlive()`, `getFurthestEnemy()`, `getLowestHpEnemy()`, `moveUnitToCell()`, `findEmptyCellNear()`
- Add `executeAbility()` with all 36 ability implementations
- In `initCombat()`: add `currentMana`, `statusEffects`, `isCasting`, `castTimer`, `abilityBuffs`, `templateKey`, `combatStats.abilityCasts`
- In `combatTick()`: call `processStatusEffects()`, check stun/freeze/root before move/attack, handle taunt targeting, handle slow on move speed, handle casting state, mana check after attack
- In `dealDamage()`: add mana generation on target taking damage, add freeze vulnerability, add drMod integration, add reflect processing, add Volcano Titan on-death, add Phoenix revive
- In `dealHealing()`: add healing reduction from burn/healReduction status
- In `performAttack()`: add mana generation on attacker (+10), add frostShot buff check, use effective ATK with atkMod
- Between waves: reset mana, clear status effects, clear abilityBuffs

### `ui-v2.js`
- In `renderCombatBoard()`: add mana bar below HP bar for units with maxMana > 0
- In `renderCombatScoreboard()`: add mana indicator and ability cast count

### `game-v2.html`
- Add mana bar CSS (`.unit-mana-bar`, `.unit-mana-fill`)

## What NOT to Do
- Do NOT implement diminishing returns on CC — that's chunk 4
- Do NOT implement CC immunity windows — that's chunk 4
- Do NOT implement visual status effect icons on units — that's chunk 4/6
- Do NOT add damage numbers (floating text) — that's chunk 6
- Do NOT change the grid, movement, pathfinding basics — that's chunk 1 (done)
- Do NOT change the save format — combat state is ephemeral
- Do NOT use ES modules, import/export, `let`, `const`, or arrow functions

## Testing Checklist
1. Units generate mana from auto-attacks (+10 per attack)
2. Units generate mana from taking damage (proportional to %HP)
3. When mana bar fills, unit pauses briefly then casts ability
4. Mana bars render below HP bars on the combat grid
5. Flame Warrior casts Flame Slash — target takes damage and burns
6. Stone Guard casts Stone Wall — gets shield, nearby enemies taunted
7. Coral Priest casts Healing Wave — 2 lowest HP allies healed
8. Golem casts Seismic Slam — nearby enemies stunned (can't act)
9. Phoenix dies → enters stasis → revives with AoE damage
10. World Tree triggers when ally drops below 20% HP
11. Volcano Titan explodes on death dealing AoE + burn
12. Storm Mage chain lightning bounces correctly
13. Leviathan damages all enemies and self-heals
14. Status effects tick down and expire
15. Stunned/frozen units skip their turn
16. Rooted units can attack but not move
17. Taunted units attack the taunter
18. Mana resets to 0 between waves
19. Status effects clear between waves
20. Combat scoreboard shows ability cast counts
21. No console errors

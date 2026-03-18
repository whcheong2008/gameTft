# Prompt 14: Combat Engine Rebuild — Full Status Effect Framework

## Goal
Upgrade the basic status effect system (from chunk 3) into a full framework with diminishing returns on CC, CC immunity windows, tenacity, new status types (Silence, Blind, Poison, Bleed), proper DoT tick normalization, and visual status effect icons rendered on units during combat.

## ⚠️ Implementation Order — READ FIRST

This prompt upgrades an EXISTING system. Do not rewrite from scratch — modify what's there.

### Phase A: Upgrade Core Framework (main-v2.js)
1. Add CC tracking fields to units (`ccHistory`, `ccImmune` timers)
2. Upgrade `addStatus()` with diminishing returns + CC immunity logic
3. Normalize DoT ticking to once per second (not per frame)
4. Add tenacity stat support

### Phase B: New Status Types (main-v2.js)
5. Add Silence: blocks ability casting, allows attacks + movement
6. Add Blind: 50% auto-attack miss chance
7. Add Poison: DoT + 50% heal reduction (stacks to 3 like burn)
8. Add Bleed: DoT + bonus tick on movement (stacks to 3)

### Phase C: Stacking Rule Fixes (main-v2.js)
9. Fix dodge to use highest-value-wins (not additive)
10. Fix atkMod stacking (separate buff/debuff, multiplicative between them)
11. Add attack speed modifier status (spdMod)

### Phase D: Visual Status Icons (ui-v2.js + game-v2.html)
12. Add status icon rendering on combat grid units
13. Add CSS for status icons
14. **TEST**: Full mission playthrough — CC fires, icons show, DR works, no console errors

---

## Context
- **Chunks 1-3 (done)**: Grid, movement, damage pipeline, mana, 36 abilities, basic status effects
- **Current status system**: 13 types (burn, slow, stun, freeze, root, taunt, dodgeBuff, atkMod, drMod, regen, reflect, healReduction, vulnerability). Simple stacking: burn max 3, others replace. No DR, no CC immunity, no visual icons.
- **Script order**: `units.js → save.js → gacha.js → teams.js → hub.js → items.js → missions.js → ui-v2.js → main-v2.js`
- **Pattern**: All `var`, global scope, NO ES modules, NO import/export
- **Source of truth**: COMBAT-DESIGN.md § 5 (Status Effect System)

---

## Part 1: Diminishing Returns on CC

### Design (from COMBAT-DESIGN.md)
If a unit is CC'd (stun/freeze/root) twice within 8 seconds, the second CC duration is halved. Third within 8s = 25%. Prevents perma-stun.

### Implementation
Add to each unit in `initCombat()`:
```js
unit.ccHistory = [];  // array of timestamps when CC was applied: [{time: combatState.elapsed, type: 'stun'}, ...]
```

Modify `addStatus()` — when applying a hard CC (stun, freeze, root), check history:
```js
function addStatus(unit, type, duration, value, source) {
    // --- Diminishing Returns for hard CC ---
    var hardCC = ['stun', 'freeze', 'root'];
    if (hardCC.indexOf(type) >= 0) {
        // Check CC immunity
        if (unit.ccImmuneUntil && combatState.elapsed < unit.ccImmuneUntil) {
            return; // immune, skip
        }

        // Apply tenacity
        var tenacity = unit.tenacity || 0;
        if (tenacity > 0) {
            duration = duration * (1 - Math.min(tenacity, 0.6)); // cap 60%
        }

        // Count recent CC applications within last 8 seconds
        var now = combatState.elapsed;
        var recentCount = 0;
        for (var i = 0; i < unit.ccHistory.length; i++) {
            if (now - unit.ccHistory[i].time < 8) recentCount++;
        }

        // Diminishing returns
        if (recentCount === 1) duration = duration * 0.5;       // 2nd CC = half
        else if (recentCount >= 2) duration = duration * 0.25;  // 3rd+ = quarter

        // Record this CC
        unit.ccHistory.push({time: now, type: type});

        // Clean old entries (older than 8s)
        for (var j = unit.ccHistory.length - 1; j >= 0; j--) {
            if (now - unit.ccHistory[j].time >= 8) unit.ccHistory.splice(j, 1);
        }

        // CC immunity: after stun/freeze, immune to stun/freeze for 1s
        if (type === 'stun' || type === 'freeze') {
            unit.ccImmuneUntil = now + duration + 1.0; // immune starts AFTER this CC ends
        }

        // Minimum CC duration of 0.25s (don't apply if DR reduces below this)
        if (duration < 0.25) return;
    }

    // --- Rest of existing addStatus logic below (burn stacking, replace for others, etc.) ---
    // ... keep existing code ...
}
```

### Between Waves
Reset CC tracking:
```js
unit.ccHistory = [];
unit.ccImmuneUntil = 0;
```

---

## Part 2: Tenacity

A unit stat that reduces CC duration. Currently no units have innate tenacity, but it's granted by:
- Guardian 6-piece synergy: +20% CC resist → `tenacity: 0.2`
- Future items/abilities

### Implementation
In `initCombat()`:
```js
unit.tenacity = 0; // default, modified by synergies/items
```

In synergy application (wherever Guardian 6-piece is applied):
```js
// Guardian 6-piece: +10% DR, +20% CC resist
if (guardianCount >= 6) {
    unit.damageReduction = (unit.damageReduction || 0) + 0.10;
    unit.tenacity = (unit.tenacity || 0) + 0.20;
}
```

Tenacity is consumed inside `addStatus()` (shown above in Part 1).

---

## Part 3: New Status Types

### Silence
Blocks ability casting but allows auto-attacks and movement. Mana still generates (per COMBAT-DESIGN.md Appendix B).

**Add to `combatTick()`**, in the casting check:
```js
// Where mana check triggers casting:
if (unit.maxMana > 0 && unit.currentMana >= unit.maxMana && !unit.isCasting) {
    // NEW: check silence
    if (!hasStatus(unit, 'silence')) {
        unit.isCasting = true;
        unit.castTimer = 0.3;
    }
    // If silenced, mana stays capped at maxMana (doesn't overflow), ability waits
}
```

Silence is NOT hard CC — no diminishing returns apply. It's a soft CC like slow.

### Blind
50% miss chance on auto-attacks. Does NOT affect abilities.

**Add to `performAttack()`**, before calling `dealDamage()` for an auto-attack:
```js
// Blind check (only auto-attacks, not abilities)
if (hasStatus(attacker, 'blind') && Math.random() < 0.5) {
    addCombatLog(attacker.name + ' misses! (Blind)');
    // Still generate mana for attacking
    if (attacker.maxMana > 0) {
        attacker.currentMana = Math.min(attacker.maxMana, attacker.currentMana + 10);
    }
    return; // miss, no damage
}
```

No current abilities apply Blind — this is infrastructure for future units/items. Add the type to the system so it's ready.

### Poison
DoT that stacks to 3, reduces healing by 50% per stack instance (not 50% total — additive with burn).

**Add to `processStatusEffects()`** (same pattern as burn):
```js
if (eff.type === 'poison') {
    // Tick damage once per second
    eff.tickTimer = (eff.tickTimer || 0) + dt;
    if (eff.tickTimer >= 1.0) {
        eff.tickTimer -= 1.0;
        if (unit.hp > 0) {
            dealDamage(eff.source, unit, eff.value, {isTrueDamage:true, canCrit:false, canDodge:false, applyElement:false, triggerOnHit:false});
        }
    }
}
```

**Add to `dealHealing()` heal reduction**:
```js
if (hasStatus(target, 'poison')) reduction += 0.50;
```

**Stacking in `addStatus()`**: Same logic as burn — max 3 stacks, refresh duration on all stacks if at cap.

### Bleed
DoT that stacks to 3. Moving while bleeding triggers a bonus damage tick.

**Add to `processStatusEffects()`**:
```js
if (eff.type === 'bleed') {
    eff.tickTimer = (eff.tickTimer || 0) + dt;
    if (eff.tickTimer >= 1.0) {
        eff.tickTimer -= 1.0;
        if (unit.hp > 0) {
            dealDamage(eff.source, unit, eff.value, {isTrueDamage:true, canCrit:false, canDodge:false, applyElement:false, triggerOnHit:false});
        }
    }
}
```

**Add movement bleed trigger in `combatTick()`**, when a unit successfully moves:
```js
// After unit moves to a new cell:
if (hasStatus(unit, 'bleed')) {
    // Bonus bleed tick on movement
    for (var bi = 0; bi < unit.statusEffects.length; bi++) {
        if (unit.statusEffects[bi].type === 'bleed' && unit.statusEffects[bi].source) {
            dealDamage(unit.statusEffects[bi].source, unit, unit.statusEffects[bi].value,
                {isTrueDamage:true, canCrit:false, canDodge:false, applyElement:false, triggerOnHit:false});
        }
    }
}
```

**Stacking in `addStatus()`**: Same as burn/poison — max 3 stacks, refresh duration at cap.

---

## Part 4: DoT Tick Normalization

COMBAT-DESIGN.md specifies DoTs tick once per second, not per combat tick. The current system ticks burn every frame (`burnDmg = floor(value * dt)` per 50ms tick) which can cause framerate-dependent damage.

**Fix**: Add a `tickTimer` to each DoT status effect. Increment by `dt` each frame; when it reaches 1.0, deal one full tick of damage and reset.

Update `processStatusEffects()` for burn:
```js
if (eff.type === 'burn') {
    eff.tickTimer = (eff.tickTimer || 0) + dt;
    if (eff.tickTimer >= 1.0) {
        eff.tickTimer -= 1.0;
        var burnDmg = eff.value; // full DPS for 1 second
        if (burnDmg > 0 && unit.hp > 0) {
            dealDamage(eff.source, unit, burnDmg, {isTrueDamage:true, canCrit:false, canDodge:false, applyElement:false, triggerOnHit:false});
        }
    }
}
```

Same pattern for regen:
```js
if (eff.type === 'regen') {
    eff.tickTimer = (eff.tickTimer || 0) + dt;
    if (eff.tickTimer >= 1.0) {
        eff.tickTimer -= 1.0;
        var regenAmt = Math.floor(unit.maxHp * eff.value); // full 1s of regen
        if (regenAmt > 0 && unit.hp > 0 && unit.hp < unit.maxHp) {
            dealHealing(unit, unit, regenAmt);
        }
    }
}
```

---

## Part 5: Stacking Rule Fixes

### Dodge: Highest Value Wins
Current system adds dodgeBuff to base dodgeChance (additive). Per design, dodge should use highest value wins.

In `dealDamage()`, change:
```js
// OLD: var totalDodge = (target.dodgeChance || 0) + getStatusValue(target, 'dodgeBuff');
// NEW:
var totalDodge = Math.max(target.dodgeChance || 0, getStatusValue(target, 'dodgeBuff'));
```

### ATK Mod: Separate Buff/Debuff
Currently atkMod replaces on reapply (only one instance). Per design, ATK Up and ATK Down should stack multiplicatively with each other.

**Change**: Store ATK buffs and debuffs as separate status types:
- Keep `atkMod` for debuffs (negative values)
- Add `atkBuff` for buffs (positive values)
- Each type: only one instance (refresh/replace on reapply, keep the stronger one)

In `executeAbility()`, update all ability calls:
- Sky Knight / Aegis Paladin `atkMod` with positive value → change to `atkBuff`
- Hydro Mage / Abyssal Mage / Mountain Lord `atkMod` with negative value → keep as `atkMod`

When reading effective ATK:
```js
var effectiveAtk = unit.attack;
var atkBuff = getStatusValue(unit, 'atkBuff');   // positive, e.g. 0.15
var atkDebuff = getStatusValue(unit, 'atkMod');   // negative, e.g. -0.2
effectiveAtk = Math.floor(effectiveAtk * (1 + atkBuff) * (1 + atkDebuff));
```

### Attack Speed Modifier (spdMod)
Per COMBAT-DESIGN.md, SPD Up/Down is a status type. Add `spdMod` status:
- Positive = faster (lower attackSpd value)
- Negative = slower

Apply in `combatTick()` when calculating attack cooldown:
```js
var spdMod = getStatusValue(unit, 'spdMod');
var effectiveAtkSpd = (unit.attackSpd || 1.0) * (1 - spdMod); // spdMod 0.2 = 20% faster
effectiveAtkSpd = Math.max(effectiveAtkSpd, 0.2); // minimum 0.2s between attacks
unit.attackCooldown = effectiveAtkSpd;
```

No current abilities use spdMod — this is infrastructure.

---

## Part 6: Visual Status Effect Icons

### Design
Small emoji icons displayed next to each unit on the combat grid. Max 3 visible, "+N" for overflow. Each icon has a color-coded border matching its category.

### Status Icon Map
```js
var STATUS_ICONS = {
    burn:           '🔥',
    poison:         '☠️',
    bleed:          '🩸',
    stun:           '⭐',
    freeze:         '🧊',
    silence:        '🚫',
    blind:          '🌑',
    root:           '🌿',
    taunt:          '🎯',
    slow:           '🐌',
    dodgeBuff:      '💨',
    atkBuff:        '⚔️',
    atkMod:         '📉',
    drMod:          '🛡️',
    spdMod:         '⚡',
    reflect:        '🪞',
    regen:          '💚',
    healReduction:  '💔',
    vulnerability:  '⚠️'
};
```

### Rendering in `renderCombatBoard()`
After the mana bar, add a status icon row for each unit:

```js
// Inside the unit cell rendering, after mana bar:
if (unit.statusEffects && unit.statusEffects.length > 0) {
    var iconHtml = '<div class="status-icons">';
    var shown = 0;
    var uniqueTypes = []; // avoid duplicate icons for same type
    for (var si = 0; si < unit.statusEffects.length; si++) {
        var sType = unit.statusEffects[si].type;
        if (uniqueTypes.indexOf(sType) >= 0) continue; // already showing this type
        uniqueTypes.push(sType);
        if (shown < 3) {
            var icon = STATUS_ICONS[sType] || '?';
            iconHtml += '<span class="status-icon" title="' + sType + '">' + icon + '</span>';
            shown++;
        }
    }
    if (uniqueTypes.length > 3) {
        iconHtml += '<span class="status-overflow">+' + (uniqueTypes.length - 3) + '</span>';
    }
    iconHtml += '</div>';
    // Append to cell HTML
}
```

### CSS (`game-v2.html`)
```css
.status-icons {
    display: flex;
    justify-content: center;
    gap: 1px;
    font-size: 8px;
    line-height: 1;
    margin-top: 1px;
    height: 12px;
    overflow: hidden;
}
.status-icon {
    display: inline-block;
    width: 12px;
    height: 12px;
    text-align: center;
    font-size: 9px;
    line-height: 12px;
}
.status-overflow {
    font-size: 7px;
    color: #888;
    line-height: 12px;
}
```

---

## Part 7: Silence Interaction with Mana (Appendix B Spec)

Per COMBAT-DESIGN.md Appendix B:
- Mana still generates during silence (from attacks and damage taken)
- Mana caps at maxMana (doesn't overflow)
- When silence expires, if mana is at max, ability casts immediately on next action

This is already handled by the casting check in `combatTick()` — if silenced, the cast just doesn't trigger. When silence expires, the next tick will see mana >= maxMana and start casting. No additional code needed unless the current implementation blocks mana generation during silence (it shouldn't — verify).

---

## Part 8: Update clearDebuffs()

Add new debuff types to the debuff list:
```js
var debuffTypes = ['burn', 'poison', 'bleed', 'slow', 'stun', 'freeze', 'root', 'silence', 'blind', 'atkMod', 'healReduction', 'vulnerability'];
```

Note: `atkBuff`, `drMod`, `spdMod` (positive), `dodgeBuff`, `regen`, `reflect` are BUFFS and should NOT be cleansed by `clearDebuffs()`.

---

## Part 9: Combat Log Enhancement

When status effects are applied, log them:
```js
// In addStatus(), after successfully adding:
if (type === 'stun') addCombatLog(unit.name + ' is Stunned!');
if (type === 'freeze') addCombatLog(unit.name + ' is Frozen!');
if (type === 'root') addCombatLog(unit.name + ' is Rooted!');
if (type === 'silence') addCombatLog(unit.name + ' is Silenced!');
if (type === 'burn') addCombatLog(unit.name + ' is Burning!');
if (type === 'taunt') addCombatLog(unit.name + ' is Taunted!');
```

Keep it selective — don't log every slow or atkMod (too noisy).

---

## Files to Modify

### `main-v2.js`
- Upgrade `addStatus()`: diminishing returns, CC immunity, tenacity, proper stacking for poison/bleed
- Upgrade `processStatusEffects()`: tickTimer normalization for burn/regen, add poison/bleed ticking, bleed movement trigger
- Add silence check in casting logic
- Add blind check in `performAttack()`
- Add `atkBuff` type, separate from `atkMod`
- Add `spdMod` type
- Fix dodge to highest-value-wins in `dealDamage()`
- Add poison heal reduction in `dealHealing()`
- Update `clearDebuffs()` debuff type list
- Add combat log entries for CC application
- In `initCombat()`: add `ccHistory`, `ccImmuneUntil`, `tenacity`
- In between-wave reset: clear `ccHistory`, `ccImmuneUntil`
- Update `executeAbility()`: change positive atkMod to atkBuff for Sky Knight, Aegis Paladin

### `ui-v2.js`
- Add `STATUS_ICONS` map
- Add status icon rendering in `renderCombatBoard()` after mana bar

### `game-v2.html`
- Add status icon CSS (`.status-icons`, `.status-icon`, `.status-overflow`)

### `units.js`
- No changes needed (all status types are runtime, not template data)

## What NOT to Do
- Do NOT rewrite the status effect system from scratch — upgrade the existing code
- Do NOT change abilities — they already call `addStatus()` correctly (just update positive atkMod → atkBuff)
- Do NOT add boss mechanics — that's chunk 5
- Do NOT add damage number floating text — that's chunk 6
- Do NOT change the save format
- Do NOT use ES modules, import/export, `let`, `const`, or arrow functions

## Testing Checklist
1. Golem stuns enemy → enemy can't act for 1.5s → icon shows ⭐
2. Golem stuns same enemy again within 8s → duration is halved (~0.75s)
3. After stun ends, enemy is immune to stun for 1s
4. Burn ticks once per second (not per frame) — damage numbers should appear ~1/sec
5. Frost Archer slow + Vine Archer root → both icons show on enemy
6. More than 3 status effects → shows "+N" overflow
7. Silence prevents ability casting but unit still auto-attacks
8. Blind causes 50% miss rate on auto-attacks
9. Sky Knight Battle Cry shows ⚔️ buff icon on allies
10. Healing with burn active → healing reduced by 25%
11. Status icons disappear when effects expire
12. Between waves: all status effects + CC history cleared
13. No console errors

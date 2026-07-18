// combat-status.js -- status effect framework (split from main-v2.js)

// ---- Status Effect System ----

function hasStatus(unit, type) {
    if (!unit.statusEffects) return false;
    for (var i = 0; i < unit.statusEffects.length; i++) {
        if (unit.statusEffects[i].type === type) return true;
    }
    return false;
}

function getStatusValue(unit, type) {
    var best = 0;
    if (!unit.statusEffects) return 0;
    for (var i = 0; i < unit.statusEffects.length; i++) {
        if (unit.statusEffects[i].type === type) {
            if (unit.statusEffects[i].value > best) {
                best = unit.statusEffects[i].value;
            } else if (unit.statusEffects[i].value < 0 && (best === 0 || unit.statusEffects[i].value < best)) {
                best = unit.statusEffects[i].value;
            }
        }
    }
    return best;
}

function addStatus(unit, type, duration, value, source) {
    if (!unit.statusEffects) unit.statusEffects = [];

    // --- Diminishing Returns for hard CC ---
    var hardCC = ['stun', 'freeze', 'root'];
    if (hardCC.indexOf(type) >= 0) {
        // Check CC immunity
        if (unit.ccImmuneUntil && combatState && combatState.elapsed < unit.ccImmuneUntil) {
            return; // immune, skip
        }

        // Fortress passive: immune to root, stun, slow
        if (unit.passiveState && unit.passiveState.customData && unit.passiveState.customData.ccReductionActive) {
            return; // fortress immune to hard CC
        }

        // Titan Lord firstCcImmunity: blocks first CC then consumed
        if (unit.passiveState && unit.passiveState.customData && unit.passiveState.customData.firstCcImmunity) {
            unit.passiveState.customData.firstCcImmunity = false;
            return;
        }

        // Warden full CC immunity (8-threshold)
        if (unit.wardenCcImmune) {
            return;
        }

        // Warden first CC immunity (4-threshold)
        if (unit.wardenFirstCcImmune && !unit._wardenFirstCcUsed) {
            unit._wardenFirstCcUsed = true;
            return;
        }

        // Apply tenacity
        var tenacity = unit.tenacity || 0;
        if (tenacity > 0) {
            duration = duration * (1 - Math.min(tenacity, 0.6)); // cap 60%
        }

        // Count recent CC applications within last 8 seconds
        var now = combatState ? combatState.elapsed : 0;
        var recentCount = 0;
        if (unit.ccHistory) {
            for (var ci = 0; ci < unit.ccHistory.length; ci++) {
                if (now - unit.ccHistory[ci].time < 8) recentCount++;
            }
        }

        // Diminishing returns
        if (recentCount === 1) duration = duration * 0.5;       // 2nd CC = half
        else if (recentCount >= 2) duration = duration * 0.25;  // 3rd+ = quarter

        // Record this CC
        if (!unit.ccHistory) unit.ccHistory = [];
        unit.ccHistory.push({time: now, type: type});

        // Clean old entries (older than 8s)
        for (var cj = unit.ccHistory.length - 1; cj >= 0; cj--) {
            if (now - unit.ccHistory[cj].time >= 8) unit.ccHistory.splice(cj, 1);
        }

        // CC immunity: after stun/freeze, immune to stun/freeze for 1s
        if (type === 'stun' || type === 'freeze') {
            unit.ccImmuneUntil = now + duration + 1.0; // immune starts AFTER this CC ends
        }

        // Minimum CC duration of 0.25s
        if (duration < 0.25) return;
    }

    // --- Fortress/Citadel slow immunity ---
    if (type === 'slow' && unit.passiveState && unit.passiveState.customData && unit.passiveState.customData.ccReductionActive) {
        return; // fortress immune to slow
    }

    // --- Slow immunity for units with slowImmune flag (world_sentinel, Vanguard synergy) ---
    if (type === 'slow' && unit.slowImmune) {
        return;
    }
    if (type === 'slow' && unit.passiveState && unit.passiveState.customData && unit.passiveState.customData.slowImmune) {
        return;
    }

    // --- Stacking types: burn, poison, bleed (max 3 stacks each) ---
    var stackingTypes = ['burn', 'poison', 'bleed'];
    var stackCount = 0;
    if (stackingTypes.indexOf(type) >= 0) {
        for (var i = 0; i < unit.statusEffects.length; i++) {
            if (unit.statusEffects[i].type === type) stackCount++;
        }
        if (stackCount < 3) {
            unit.statusEffects.push({type: type, duration: duration, value: value, source: source});
        } else {
            // At cap: refresh duration on all stacks
            for (var j = 0; j < unit.statusEffects.length; j++) {
                if (unit.statusEffects[j].type === type) unit.statusEffects[j].duration = duration;
            }
        }
    } else {
        // Non-stacking: replace existing
        for (var k = unit.statusEffects.length - 1; k >= 0; k--) {
            if (unit.statusEffects[k].type === type) {
                unit.statusEffects.splice(k, 1);
            }
        }
        unit.statusEffects.push({type: type, duration: duration, value: value, source: source});
    }

    // Prompt 60: combat event hook for hero skill listeners. Fires only for
    // hard CC (stun/freeze/root) that actually landed (immunity/diminishing
    // returns above already returned early when the CC was blocked or
    // reduced under the 0.25s floor).
    if (hardCC.indexOf(type) >= 0 && typeof combatEvents !== 'undefined') {
        combatEvents.emit('ccApplied', { source: source, target: unit, type: type });
    }

    // Prompt 72 (VFX framework): a broader status-application event for
    // COSMETIC listeners only -- fires for every status type (not just the
    // hardCC subset ccApplied above is deliberately restricted to), so
    // js/vfx.js can play a small per-type effect (stun/freeze/burn/root/
    // silence). Nothing pre-existing listens to this event name, so adding
    // it cannot change hero-skill/balance behavior -- it is pure event DATA.
    if (typeof combatEvents !== 'undefined') {
        combatEvents.emit('statusApplied', { source: source, target: unit, type: type, duration: duration, value: value });
    }

    // --- Combat Log for notable status effects ---
    if (type === 'stun') addCombatLog(unit.name + ' is Stunned!');
    if (type === 'freeze') addCombatLog(unit.name + ' is Frozen!');
    if (type === 'root') addCombatLog(unit.name + ' is Rooted!');
    if (type === 'silence') addCombatLog(unit.name + ' is Silenced!');
    if (type === 'burn' && stackCount === 0) addCombatLog(unit.name + ' is Burning!');
    if (type === 'taunt') addCombatLog(unit.name + ' is Taunted!');

    // --- Warden CC-triggered effects ---
    if (hardCC.indexOf(type) >= 0 && source && combatState && !source._wardenCcProcessing) {
        source._wardenCcProcessing = true;
        // Warden 6: CC applies ATK speed slow to target
        if (source.ccAppliesAtkSpdSlow && source.ccAtkSpdSlowDuration) {
            addStatus(unit, 'spdMod', source.ccAtkSpdSlowDuration, -source.ccAppliesAtkSpdSlow, source);
        }
        // Warden 8: CC spreads root to nearby enemies
        if (source.ccSpreadRoot && typeof getUnitsInRadius === 'function') {
            var ccEnemyPool = source.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
            var ccNearby = getUnitsInRadius(unit.gridRow, unit.gridCol, source.ccSpreadRadius, ccEnemyPool);
            for (var ccn = 0; ccn < ccNearby.length; ccn++) {
                if (ccNearby[ccn] !== unit && ccNearby[ccn].hp > 0) {
                    addStatus(ccNearby[ccn], 'root', source.ccSpreadDuration, 0, source);
                }
            }
        }
        source._wardenCcProcessing = false;
    }
}

function clearDebuffs(unit, count) {
    var debuffTypes = ['burn', 'poison', 'bleed', 'slow', 'stun', 'freeze', 'root', 'silence', 'blind', 'atkMod', 'healReduction', 'vulnerability'];
    var debuffs = [];
    for (var i = 0; i < unit.statusEffects.length; i++) {
        // Only clear negative atkMod (debuffs)
        if (unit.statusEffects[i].type === 'atkMod' && unit.statusEffects[i].value >= 0) continue;
        if (debuffTypes.indexOf(unit.statusEffects[i].type) >= 0) {
            debuffs.push({idx: i, dur: unit.statusEffects[i].duration});
        }
    }
    debuffs.sort(function(a,b){ return b.dur - a.dur; });
    var toRemove = count === 0 ? debuffs.length : Math.min(count, debuffs.length);
    var indices = [];
    for (var j = 0; j < toRemove; j++) indices.push(debuffs[j].idx);
    indices.sort(function(a,b){ return b - a; });
    for (var k = 0; k < indices.length; k++) {
        unit.statusEffects.splice(indices[k], 1);
    }
}

function processStatusEffects(unit, dt) {
    if (!unit.statusEffects || unit.statusEffects.length === 0) return;

    for (var i = unit.statusEffects.length - 1; i >= 0; i--) {
        var eff = unit.statusEffects[i];
        eff.duration -= dt;

        // Burn: DoT tick once per second
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

        // Poison: DoT tick once per second
        if (eff.type === 'poison') {
            eff.tickTimer = (eff.tickTimer || 0) + dt;
            if (eff.tickTimer >= 1.0) {
                eff.tickTimer -= 1.0;
                if (unit.hp > 0) {
                    dealDamage(eff.source, unit, eff.value, {isTrueDamage:true, canCrit:false, canDodge:false, applyElement:false, triggerOnHit:false});
                }
            }
        }

        // Bleed: DoT tick once per second
        if (eff.type === 'bleed') {
            eff.tickTimer = (eff.tickTimer || 0) + dt;
            if (eff.tickTimer >= 1.0) {
                eff.tickTimer -= 1.0;
                if (unit.hp > 0) {
                    dealDamage(eff.source, unit, eff.value, {isTrueDamage:true, canCrit:false, canDodge:false, applyElement:false, triggerOnHit:false});
                }
            }
        }

        // Regen: tick once per second
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

        if (eff.duration <= 0) {
            unit.statusEffects.splice(i, 1);
        }
    }
}


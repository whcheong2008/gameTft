// =============================================================================
// main-v2.js — V2 game entry point and state management
// =============================================================================

var saveData = null;

function getSaveData() {
    return saveData;
}

function initGameV2() {
    // Initialize gacha pool lookup
    initGachaPool();

    // Load or create save
    saveData = loadGame();
    if (!saveData) {
        saveData = createDefaultSaveData();
        saveGame(saveData);
    }

    // Show hub screen
    showScreen('hub');
}

// ---- Bridge functions for combat.js compatibility ----
// The V1 combat engine expects certain functions/globals. We bridge them here.

// Combat state (used by combat.js)
var combatState = null;

function initCombat(gs) {
    // Build flat arrays of player and enemy units for combat
    var playerUnits = [];
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 7; c++) {
            var u = gs.board[r][c];
            if (u && u.hp > 0) {
                u.side = 'player';
                u.gridRow = 4 + r;
                u.gridCol = c;
                playerUnits.push(u);
            }
        }
    }

    var enemyUnits = [];
    if (gs.enemies) {
        for (var i = 0; i < gs.enemies.length; i++) {
            var e = gs.enemies[i];
            if (e && e.hp > 0) {
                e.side = 'enemy';
                enemyUnits.push(e);
            }
        }
    }

    combatState = {
        running: true,
        result: null,
        autoBattle: false,
        playerUnits: playerUnits,
        enemyUnits: enemyUnits,
        allUnits: playerUnits.concat(enemyUnits),
        activeSynergies: gs.activeSynergies || {},
        activeElements: gs.activeElements || {},
        elapsed: 0,
        grid: null,
        assassinsDashed: false,
        worldTreeTriggered: false,
        auraTimer: 0,
        deathMarkers: {},
        bossUnit: null
    };

    // Detect boss unit
    for (var bi = 0; bi < enemyUnits.length; bi++) {
        if (enemyUnits[bi].isBoss) {
            combatState.bossUnit = enemyUnits[bi];
            break;
        }
    }

    // Store original player positions for wave repositioning
    for (var oi = 0; oi < playerUnits.length; oi++) {
        playerUnits[oi]._origRow = playerUnits[oi].gridRow;
        playerUnits[oi]._origCol = playerUnits[oi].gridCol;
    }

    // Build the unified 8x7 combat grid
    combatState.grid = buildCombatGrid(playerUnits, enemyUnits);

    // Initialize movement cooldowns, attack cooldowns, and CC tracking
    for (var mi = 0; mi < combatState.allUnits.length; mi++) {
        combatState.allUnits[mi].moveCooldown = 0;
        if (!combatState.allUnits[mi].attackCooldown) {
            combatState.allUnits[mi].attackCooldown = 0;
        }
        combatState.allUnits[mi].ccHistory = [];
        combatState.allUnits[mi].ccImmuneUntil = 0;
        combatState.allUnits[mi].tenacity = 0;
    }

    // Apply synergy bonuses to player units
    if (typeof applySynergyBonuses === 'function') {
        applySynergyBonuses(combatState.playerUnits, combatState.activeSynergies, combatState);
    }

    // Initialize combatStats on every unit (only if not already present, to persist across waves)
    for (var si = 0; si < combatState.allUnits.length; si++) {
        var su = combatState.allUnits[si];
        if (!su.combatStats) {
            su.combatStats = {
                damageDealt: 0,
                damageTaken: 0,
                healingDone: 0,
                shieldGiven: 0,
                kills: 0,
                abilityCasts: 0
            };
        }

        // Template key tracking
        if (!su.templateKey) {
            if (su.key) {
                su.templateKey = su.key;
            } else {
                // Try to find by name match
                for (var tKey in UNIT_TEMPLATES) {
                    if (UNIT_TEMPLATES[tKey].name === su.name) { su.templateKey = tKey; break; }
                }
                if (!su.templateKey) {
                    for (var eKey in EVOLVED_TEMPLATES) {
                        if (EVOLVED_TEMPLATES[eKey].name === su.name) { su.templateKey = eKey; break; }
                    }
                }
            }
        }

        // Mana initialization
        var tmpl = UNIT_TEMPLATES[su.templateKey] || EVOLVED_TEMPLATES[su.templateKey];
        su.maxMana = tmpl ? (tmpl.maxMana || 0) : 0;
        su.currentMana = 0;
        su.isCasting = false;
        su.castTimer = 0;
        su.abilityBuffs = {};
        su.statusEffects = [];

        // Initialize legendaryState for T5 units (maxMana === 0)
        if (su.maxMana === 0) {
            su.legendaryState = {
                revivePending: false, reviveTimer: 0, reviveCount: 0,
                lastKillTime: 0, submerged: false, submergeTimer: 0,
                periodicTimer: 0, customData: {}
            };
        }
    }

    // Apply element synergy bonuses
    applyElementBonuses(combatState);

    // Apply item stats to player units
    var sd = getSaveData();
    if (sd && typeof applyItemStats === 'function') {
        for (var ii = 0; ii < combatState.playerUnits.length; ii++) {
            var pu = combatState.playerUnits[ii];
            applyItemStats(pu, sd);
            // Store item emojis for combat display
            var eqItems = getEquippedItems(sd, pu.key);
            if (eqItems.length > 0) {
                pu.combatItems = [];
                for (var ei = 0; ei < eqItems.length; ei++) {
                    pu.combatItems.push(getItemEmoji(eqItems[ei]));
                }
            }
        }

        // Apply set bonuses after all item stats
        if (typeof calculateActiveSetBonuses === 'function') {
            var setCounts = calculateActiveSetBonuses(combatState.playerUnits, sd);
            applySetBonuses(combatState.playerUnits, setCounts);
        }
    }

    // Initialize passive states and fire combat_start passives
    for (var pi = 0; pi < combatState.allUnits.length; pi++) {
        initUnitPassiveState(combatState.allUnits[pi]);
    }
    processCombatStartPassives(combatState.allUnits);
}

function applyElementBonuses(cs) {
    var elemCounts = cs.activeElements || {};
    var elemKeys = Object.keys(elemCounts);

    // Determine active element bonuses (find highest threshold met per element)
    cs.activeElementBonuses = {};
    for (var i = 0; i < elemKeys.length; i++) {
        var ek = elemKeys[i];
        var syn = ELEMENT_SYNERGIES[ek];
        if (!syn) continue;
        var count = elemCounts[ek];
        var tierReached = -1;
        for (var t = 0; t < syn.thresholds.length; t++) {
            if (count >= syn.thresholds[t]) tierReached = t;
        }
        if (tierReached >= 0) {
            cs.activeElementBonuses[ek] = syn.bonuses[tierReached];
            cs.activeElementBonuses[ek]._tier = tierReached;
        }
    }

    // Apply element bonuses to each player unit based on its element
    for (var p = 0; p < cs.playerUnits.length; p++) {
        var unit = cs.playerUnits[p];
        var unitElem = unit.element;
        if (!unitElem || !ELEMENT_SYNERGIES[unitElem]) continue;

        var synergy = ELEMENT_SYNERGIES[unitElem];
        var activeThreshold = -1;
        for (var at = synergy.thresholds.length - 1; at >= 0; at--) {
            if ((elemCounts[unitElem] || 0) >= synergy.thresholds[at]) {
                activeThreshold = at;
                break;
            }
        }
        if (activeThreshold < 0) continue;

        var bonus = synergy.bonuses[activeThreshold];

        // Basic stat bonuses (all tiers)
        if (bonus.burnDps) unit.burnDps = (unit.burnDps || 0) + bonus.burnDps;
        if (bonus.burnDuration) unit.burnDuration = bonus.burnDuration;
        if (bonus.killExplosionPct) unit.killExplosionPct = bonus.killExplosionPct;
        if (bonus.shieldPct) {
            var shieldAmt = Math.floor(unit.maxHp * bonus.shieldPct);
            if (shieldAmt > 0) grantShield(null, unit, shieldAmt);
        }
        if (bonus.damageReduction) unit.damageReduction = (unit.damageReduction || 0) + bonus.damageReduction;
        if (bonus.allyAtkSpdBoost) unit.attackSpd = unit.attackSpd / (1 + bonus.allyAtkSpdBoost);
        if (bonus.dodgeChance) unit.dodgeChance = (unit.dodgeChance || 0) + bonus.dodgeChance;
        if (bonus.critChance) unit.critChance = (unit.critChance || 0) + bonus.critChance;
        if (bonus.critDamageBonus) unit.critDamageBonus = (unit.critDamageBonus || 0) + bonus.critDamageBonus;
        if (bonus.chainCount) unit.chainCount = bonus.chainCount;
        if (bonus.chainDamage) unit.chainDamage = bonus.chainDamage;
        if (bonus.atkBonus) unit.attack = Math.floor(unit.attack * (1 + bonus.atkBonus));
        if (bonus.hpBonus) {
            var hpIncrease = Math.floor(unit.maxHp * bonus.hpBonus);
            unit.maxHp += hpIncrease;
            unit.hp += hpIncrease;
        }
        if (bonus.drIgnore) unit.drIgnore = (unit.drIgnore || 0) + bonus.drIgnore;

        // Tier 7+ effects (store flags for combat to check)
        if (activeThreshold >= 2) {
            if (bonus.abilityBurn) unit.abilityBurn = true;
            if (bonus.fireAtkBonus) unit.attack = Math.floor(unit.attack * (1 + bonus.fireAtkBonus));
            if (bonus.chainExplosions) cs.chainExplosions = true;
            if (bonus.dodgeCounterMana) unit.dodgeCounterMana = bonus.dodgeCounterMana;
            if (bonus.dodgeCounterDmgPct) unit.dodgeCounterDmgPct = bonus.dodgeCounterDmgPct;
            if (bonus.abilityCritChance) unit.abilityCritChance = bonus.abilityCritChance;
            // TODO: shieldRegenOnlyWhenUnhit, shieldRegenPct, weakEnemyDmgReduce/Threshold in combat loop
        }

        // Tier 10 (Prismatic) effects
        if (activeThreshold >= 3 && bonus.isPrismatic) {
            cs.prismaticElement = unitElem;
            if (bonus.abilityCostReduce) unit.abilityCostReduce = bonus.abilityCostReduce;
            if (bonus.fireImmuneBurn) unit.fireImmuneBurn = true;
            if (bonus.abilityHealConvert) unit.abilityHealConvert = bonus.abilityHealConvert;
            if (bonus.earthNoCrit) unit.earthNoCrit = true;
            if (bonus.abilityDoubleChance) unit.abilityDoubleChance = bonus.abilityDoubleChance;
            if (bonus.abilityChainCount) unit.abilityChainCount = bonus.abilityChainCount;
            if (bonus.abilityChainChance) unit.abilityChainChance = bonus.abilityChainChance;
            if (bonus.critAoeBonus) unit.critAoeBonus = bonus.critAoeBonus;
            if (bonus.critAoeRange) unit.critAoeRange = bonus.critAoeRange;
            if (bonus.ccImmune6s) unit.ccImmune6s = true;
            if (bonus.stunCounter) unit.stunCounter = bonus.stunCounter;
            if (bonus.stunDuration) unit.stunDuration = bonus.stunDuration;
            if (bonus.reviveOnce) unit.reviveOnce = bonus.reviveOnce;
            // TODO: combatStartBurn, deathExplosionDamage, permanentSlow, frozenThreshold/Duration, rootCooldown/Duration in combat loop
        }
    }

    // Global effects: Water enemy slow, Water ally regen
    var waterBonus = cs.activeElementBonuses.water;
    if (waterBonus) {
        if (waterBonus.enemyAtkSpdReduction) {
            var slowFactor = 1 + waterBonus.enemyAtkSpdReduction;
            for (var w = 0; w < cs.enemyUnits.length; w++) {
                cs.enemyUnits[w].attackSpd = cs.enemyUnits[w].attackSpd * slowFactor;
            }
        }
        if (waterBonus.allyRegenPct) {
            for (var wr = 0; wr < cs.playerUnits.length; wr++) {
                cs.playerUnits[wr].regenPct = waterBonus.allyRegenPct;
            }
        }
    }

    // Global effects: Water prismatic permanent slow
    if (waterBonus && waterBonus.permanentSlow) {
        cs.permanentSlow = waterBonus.permanentSlow;
    }

    // Store weak enemy damage reduce on combatState for combat loop
    if (waterBonus && waterBonus.weakEnemyDmgReduce) {
        cs.weakEnemyDmgReduce = waterBonus.weakEnemyDmgReduce;
        cs.weakEnemyThreshold = waterBonus.weakEnemyThreshold;
    }

    // Store shield regen on combatState
    var earthBonus = cs.activeElementBonuses.earth;
    if (earthBonus && earthBonus.shieldRegenPct) {
        cs.shieldRegenPct = earthBonus.shieldRegenPct;
        cs.shieldRegenOnlyWhenUnhit = earthBonus.shieldRegenOnlyWhenUnhit || false;
    }
}

function applyEnemyElementBonuses(enemies, elemCounts) {
    var elemKeys = Object.keys(elemCounts);

    for (var i = 0; i < elemKeys.length; i++) {
        var ek = elemKeys[i];
        var syn = ELEMENT_SYNERGIES[ek];
        if (!syn) continue;
        var count = elemCounts[ek];
        var tierReached = -1;
        for (var t = 0; t < syn.thresholds.length; t++) {
            if (count >= syn.thresholds[t]) tierReached = t;
        }
        if (tierReached < 0) continue;
        var bonus = syn.bonuses[tierReached];

        // Fire: add burn DPS to enemies
        if (ek === 'fire' && bonus.burnDps) {
            for (var f = 0; f < enemies.length; f++) {
                enemies[f].burnDps = bonus.burnDps;
                if (bonus.burnDuration) enemies[f].burnDuration = bonus.burnDuration;
                if (bonus.killExplosionPct) enemies[f].killExplosionPct = bonus.killExplosionPct;
            }
        }

        // Earth: shield + DR for enemies
        if (ek === 'earth') {
            for (var e = 0; e < enemies.length; e++) {
                if (bonus.shieldPct) {
                    enemies[e].shield = (enemies[e].shield || 0) + Math.floor(enemies[e].maxHp * bonus.shieldPct);
                }
                if (bonus.damageReduction) {
                    enemies[e].damageReduction = (enemies[e].damageReduction || 0) + bonus.damageReduction;
                }
            }
        }

        // Wind: speed boost + dodge for enemies
        if (ek === 'wind') {
            var spdFactor = 1 + (bonus.allyAtkSpdBoost || 0);
            for (var v = 0; v < enemies.length; v++) {
                enemies[v].attackSpd = enemies[v].attackSpd / spdFactor;
                if (bonus.dodgeChance) enemies[v].dodgeChance = bonus.dodgeChance;
            }
        }

        // Lightning: crit chance for enemies
        if (ek === 'lightning') {
            for (var l = 0; l < enemies.length; l++) {
                if (bonus.critChance) enemies[l].critChance = (enemies[l].critChance || 0) + bonus.critChance;
                if (bonus.critDamageBonus) enemies[l].critDamageBonus = (enemies[l].critDamageBonus || 0) + bonus.critDamageBonus;
            }
        }

        // Force: ATK + HP for enemies
        if (ek === 'force') {
            for (var fo = 0; fo < enemies.length; fo++) {
                if (bonus.atkBonus) enemies[fo].attack = Math.floor(enemies[fo].attack * (1 + bonus.atkBonus));
                if (bonus.hpBonus) {
                    var hpInc = Math.floor(enemies[fo].maxHp * bonus.hpBonus);
                    enemies[fo].maxHp += hpInc;
                    enemies[fo].hp += hpInc;
                }
            }
        }

        // Water enemy synergy: would slow player units — handled in combat init
    }
}

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

    // --- Slow immunity for units with slowImmune flag (world_sentinel) ---
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

    // --- Combat Log for notable status effects ---
    if (type === 'stun') addCombatLog(unit.name + ' is Stunned!');
    if (type === 'freeze') addCombatLog(unit.name + ' is Frozen!');
    if (type === 'root') addCombatLog(unit.name + ' is Rooted!');
    if (type === 'silence') addCombatLog(unit.name + ' is Silenced!');
    if (type === 'burn' && stackCount === 0) addCombatLog(unit.name + ' is Burning!');
    if (type === 'taunt') addCombatLog(unit.name + ' is Taunted!');
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

// ---- Grid Helper Functions ----

function getUnitsInRadius(centerRow, centerCol, radius, pool) {
    var result = [];
    for (var i = 0; i < pool.length; i++) {
        if (pool[i].hp > 0 && getManhattanDist(centerRow, centerCol, pool[i].gridRow, pool[i].gridCol) <= radius) {
            result.push(pool[i]);
        }
    }
    return result;
}

function getUnitsInRow(row, pool) {
    var result = [];
    for (var i = 0; i < pool.length; i++) {
        if (pool[i].hp > 0 && pool[i].gridRow === row) {
            result.push(pool[i]);
        }
    }
    return result;
}

function getLowestHpUnits(pool, count) {
    var alive = [];
    for (var i = 0; i < pool.length; i++) {
        if (pool[i].hp > 0) alive.push(pool[i]);
    }
    alive.sort(function(a, b) { return (a.hp / a.maxHp) - (b.hp / b.maxHp); });
    return alive.slice(0, count);
}

function getRandomAlive(pool, count) {
    var alive = [];
    for (var i = 0; i < pool.length; i++) {
        if (pool[i].hp > 0) alive.push(pool[i]);
    }
    for (var j = alive.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var temp = alive[j]; alive[j] = alive[k]; alive[k] = temp;
    }
    return alive.slice(0, count);
}

function getFurthestEnemy(caster, pool) {
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
    // Clear old position(s)
    if (unit.isBoss && unit.bossSize) {
        for (var br = 0; br < unit.bossSize[0]; br++) {
            for (var bc = 0; bc < unit.bossSize[1]; bc++) {
                var or = unit.gridRow + br, oc = unit.gridCol + bc;
                if (grid[or] && grid[or][oc] === unit) grid[or][oc] = null;
            }
        }
    } else {
        if (grid[unit.gridRow] && grid[unit.gridRow][unit.gridCol] === unit) {
            grid[unit.gridRow][unit.gridCol] = null;
        }
    }
    unit.gridRow = row;
    unit.gridCol = col;
    if (unit.isBoss && unit.bossSize) {
        for (var br = 0; br < unit.bossSize[0]; br++) {
            for (var bc = 0; bc < unit.bossSize[1]; bc++) {
                if (grid[row + br]) grid[row + br][col + bc] = unit;
            }
        }
    } else {
        if (grid[row]) grid[row][col] = unit;
    }
}

function findEmptyCellNear(row, col, grid) {
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

// ---- Boss Combat AI ----

function getCellsInRadius(centerRow, centerCol, radius) {
    var cells = [];
    for (var r = centerRow - radius; r <= centerRow + radius; r++) {
        for (var c = centerCol - radius; c <= centerCol + radius; c++) {
            if (r >= 0 && r < 8 && c >= 0 && c < 7 && getManhattanDist(centerRow, centerCol, r, c) <= radius) {
                cells.push({row: r, col: c});
            }
        }
    }
    return cells;
}

function getHighestAtkUnits(pool, count) {
    var alive = [];
    for (var i = 0; i < pool.length; i++) {
        if (pool[i].hp > 0) alive.push(pool[i]);
    }
    alive.sort(function(a, b) { return b.attack - a.attack; });
    return alive.slice(0, count);
}

function findUnitByTemplate(templateKey, side) {
    if (!combatState) return null;
    var pool = side === 'player' ? combatState.playerUnits : combatState.enemyUnits;
    for (var i = 0; i < pool.length; i++) {
        if (pool[i].hp > 0 && pool[i].templateKey === templateKey) return pool[i];
    }
    return null;
}

function countAlliesOfElement(unit, element) {
    if (!combatState) return 0;
    var pool = unit.side === 'player' ? combatState.playerUnits : combatState.enemyUnits;
    var count = 0;
    for (var i = 0; i < pool.length; i++) {
        if (pool[i].hp > 0 && pool[i].element === element) count++;
    }
    return count;
}

function getAlliesOfElement(unit, element) {
    if (!combatState) return [];
    var pool = unit.side === 'player' ? combatState.playerUnits : combatState.enemyUnits;
    var result = [];
    for (var i = 0; i < pool.length; i++) {
        if (pool[i].hp > 0 && pool[i].element === element) result.push(pool[i]);
    }
    return result;
}

function findNearestAlly(unit, allies) {
    var best = null, bestDist = 999;
    for (var i = 0; i < allies.length; i++) {
        if (allies[i] !== unit && allies[i].hp > 0) {
            var d = getManhattanDist(unit.gridRow, unit.gridCol, allies[i].gridRow, allies[i].gridCol);
            if (d < bestDist) { bestDist = d; best = allies[i]; }
        }
    }
    return best;
}

function getDistToBoss(unit, boss) {
    var minDist = 999;
    for (var br = 0; br < boss.bossSize[0]; br++) {
        for (var bc = 0; bc < boss.bossSize[1]; bc++) {
            var d = getManhattanDist(unit.gridRow, unit.gridCol, boss.gridRow + br, boss.gridCol + bc);
            if (d < minDist) minDist = d;
        }
    }
    return minDist;
}

function processBossTick(boss, dt) {
    if (!boss || boss.hp <= 0 || !boss.isBoss) return;

    var bossData = boss.bossData;
    var phase = boss.currentPhase;

    // --- Phase transition check ---
    if (phase < bossData.phases.length - 1) {
        var nextPhaseData = bossData.phases[phase + 1];
        if (boss.hp / boss.maxHp <= nextPhaseData.hpThreshold) {
            boss.currentPhase++;
            boss.phaseTransitioning = true;
            boss.phaseTransitionTimer = 2.0;
            boss.stasis = 2.0;
            boss.abilityCooldowns = {};
            for (var a = 0; a < bossData.phases[boss.currentPhase].abilities.length; a++) {
                boss.abilityCooldowns[a] = 3.0;
            }
            addCombatLog('⚠️ ' + boss.name + ' enters Phase ' + (boss.currentPhase + 1) + '!');
            return;
        }
    }

    // --- Phase transition timer ---
    if (boss.phaseTransitioning) {
        boss.phaseTransitionTimer -= dt;
        if (boss.phaseTransitionTimer <= 0) {
            boss.phaseTransitioning = false;
        }
        return;
    }

    // --- Enrage check ---
    if (!boss.enraged && combatState.elapsed >= bossData.enrageTime) {
        boss.enraged = true;
        boss.attack = Math.floor(boss.attack * bossData.enrageAtkMult);
        boss.attackSpd = boss.attackSpd / bossData.enrageSpdMult;
        addCombatLog('🔴 ' + boss.name + ' ENRAGES!');
    }

    // --- Passive regen (Tidal Leviathan) ---
    if (bossData.regenPct && boss.hp > 0) {
        var bossRegen = Math.floor(boss.maxHp * bossData.regenPct * dt);
        if (bossRegen > 0) dealHealing(boss, boss, bossRegen);
    }

    // --- Ability cooldowns ---
    var phaseData = bossData.phases[boss.currentPhase];
    if (!boss.abilityCooldowns) boss.abilityCooldowns = {};

    for (var i = 0; i < phaseData.abilities.length; i++) {
        if (boss.abilityCooldowns[i] === undefined) {
            boss.abilityCooldowns[i] = phaseData.abilities[i].cooldown * 0.5;
        }
        boss.abilityCooldowns[i] -= dt;

        if (boss.abilityCooldowns[i] <= 0) {
            var ability = phaseData.abilities[i];
            if (ability.telegraphTime > 0) {
                startBossTelegraph(boss, ability, i);
            } else {
                executeBossAbility(boss, ability);
            }
            boss.abilityCooldowns[i] = ability.cooldown;
        }
    }

    // --- Process active telegraphs ---
    processBossTelegraphs(boss, dt);

    // --- Minion spawning ---
    processBossMinions(boss, dt);
}

function startBossTelegraph(boss, ability, abilityIndex) {
    var cells = [];
    var targets = [];
    var players = combatState.playerUnits;

    switch (ability.targetType) {
    case 'highest_hp':
        var bestTarget = null;
        for (var i = 0; i < players.length; i++) {
            if (players[i].hp > 0 && (!bestTarget || players[i].hp > bestTarget.hp)) bestTarget = players[i];
        }
        if (bestTarget) {
            cells = getCellsInRadius(bestTarget.gridRow, bestTarget.gridCol, ability.aoeRadius || 1);
            targets = [bestTarget];
        }
        break;

    case 'highest_atk':
    case 'highest_atk_x2':
        var sorted = players.filter(function(u){ return u.hp > 0; }).sort(function(a,b){ return b.attack - a.attack; });
        var count = ability.targetType === 'highest_atk_x2' ? 2 : 1;
        for (var i = 0; i < Math.min(count, sorted.length); i++) {
            targets.push(sorted[i]);
            cells = cells.concat(getCellsInRadius(sorted[i].gridRow, sorted[i].gridCol, ability.aoeRadius || 0));
        }
        break;

    case 'cone':
        var startRow = boss.gridRow + boss.bossSize[0];
        for (var r = startRow; r < startRow + (ability.coneRows || 2) && r < 8; r++) {
            for (var ci = 0; ci < ability.coneColumns.length; ci++) {
                var col = ability.coneColumns[ci];
                if (col >= 0 && col < 7) cells.push({row: r, col: col});
            }
        }
        break;

    case 'melee_range':
        for (var br = 0; br < boss.bossSize[0]; br++) {
            for (var bc = 0; bc < boss.bossSize[1]; bc++) {
                var adjCells = getCellsInRadius(boss.gridRow + br, boss.gridCol + bc, ability.aoeRadius || 1);
                for (var ac = 0; ac < adjCells.length; ac++) {
                    if (adjCells[ac].row >= 4) {
                        var exists = false;
                        for (var ec = 0; ec < cells.length; ec++) {
                            if (cells[ec].row === adjCells[ac].row && cells[ec].col === adjCells[ac].col) { exists = true; break; }
                        }
                        if (!exists) cells.push(adjCells[ac]);
                    }
                }
            }
        }
        break;

    case 'aoe_around_self':
        for (var br = 0; br < boss.bossSize[0]; br++) {
            for (var bc = 0; bc < boss.bossSize[1]; bc++) {
                var selfCells = getCellsInRadius(boss.gridRow + br, boss.gridCol + bc, ability.aoeRadius || 2);
                for (var sc = 0; sc < selfCells.length; sc++) {
                    var dup = false;
                    for (var dc = 0; dc < cells.length; dc++) {
                        if (cells[dc].row === selfCells[sc].row && cells[dc].col === selfCells[sc].col) { dup = true; break; }
                    }
                    if (!dup) cells.push(selfCells[sc]);
                }
            }
        }
        break;

    case 'random_cells':
        var candidates = [];
        for (var r = 4; r < 8; r++) {
            for (var c = 0; c < 7; c++) candidates.push({row: r, col: c});
        }
        for (var j = candidates.length - 1; j > 0; j--) {
            var k = Math.floor(Math.random() * (j + 1));
            var tmp = candidates[j]; candidates[j] = candidates[k]; candidates[k] = tmp;
        }
        cells = candidates.slice(0, ability.cellCount || 3);
        break;

    case 'rows':
        for (var ri = 0; ri < ability.targetRows.length; ri++) {
            for (var c = 0; c < 7; c++) {
                cells.push({row: ability.targetRows[ri], col: c});
            }
        }
        break;

    case 'aoe_pull':
        var centerR = 5 + Math.floor(Math.random() * 2);
        var centerC = 1 + Math.floor(Math.random() * 5);
        var halfSize = Math.floor((ability.aoeSize || 2) / 2);
        for (var r = centerR - halfSize; r <= centerR + halfSize; r++) {
            for (var c = centerC - halfSize; c <= centerC + halfSize; c++) {
                if (r >= 4 && r < 8 && c >= 0 && c < 7) cells.push({row: r, col: c});
            }
        }
        ability._pullCenter = {row: centerR, col: centerC};
        break;

    case 'random_units':
        var alive = players.filter(function(u){ return u.hp > 0; });
        var shuffled = alive.slice();
        for (var j = shuffled.length - 1; j > 0; j--) {
            var k = Math.floor(Math.random() * (j + 1));
            var tmp = shuffled[j]; shuffled[j] = shuffled[k]; shuffled[k] = tmp;
        }
        targets = shuffled.slice(0, ability.targetCount || 3);
        for (var t = 0; t < targets.length; t++) {
            cells.push({row: targets[t].gridRow, col: targets[t].gridCol});
        }
        break;

    case 'row_most_units':
        var rowCounts = [0, 0, 0, 0];
        for (var i = 0; i < players.length; i++) {
            if (players[i].hp > 0 && players[i].gridRow >= 4) rowCounts[players[i].gridRow - 4]++;
        }
        var bestRow = 4;
        for (var r = 0; r < 4; r++) {
            if (rowCounts[r] > rowCounts[bestRow - 4]) bestRow = r + 4;
        }
        for (var c = 0; c < 7; c++) cells.push({row: bestRow, col: c});
        break;

    case 'all_players':
        break;

    case 'self_shield':
    case 'column_wall':
        executeBossAbility(boss, ability);
        return;
    }

    if (cells.length > 0 || targets.length > 0) {
        boss.telegraphs.push({
            ability: ability,
            abilityIndex: abilityIndex,
            timer: ability.telegraphTime,
            targetCells: cells,
            targetUnits: targets
        });
        addCombatLog('⚠️ ' + boss.name + ' telegraphs ' + ability.name + '!');
    } else if (ability.targetType === 'all_players') {
        boss.telegraphs.push({
            ability: ability,
            timer: ability.telegraphTime || 1.0,
            targetCells: [],
            targetUnits: [],
            isTeamWide: true
        });
        addCombatLog('⚠️ ' + boss.name + ' charges ' + ability.name + '!');
    }
}

function processBossTelegraphs(boss, dt) {
    for (var i = boss.telegraphs.length - 1; i >= 0; i--) {
        boss.telegraphs[i].timer -= dt;
        if (boss.telegraphs[i].timer <= 0) {
            executeBossAbility(boss, boss.telegraphs[i].ability, boss.telegraphs[i]);
            boss.telegraphs.splice(i, 1);
        }
    }
}

function executeBossAbility(boss, ability, telegraph) {
    var players = combatState.playerUnits;
    var grid = combatState.grid;
    var bossAtk = boss.attack;

    var hitUnits = [];

    if (telegraph && telegraph.targetCells && telegraph.targetCells.length > 0) {
        for (var i = 0; i < players.length; i++) {
            if (players[i].hp <= 0) continue;
            for (var j = 0; j < telegraph.targetCells.length; j++) {
                if (players[i].gridRow === telegraph.targetCells[j].row && players[i].gridCol === telegraph.targetCells[j].col) {
                    hitUnits.push(players[i]);
                    break;
                }
            }
        }
    } else if (telegraph && telegraph.targetUnits) {
        hitUnits = telegraph.targetUnits.filter(function(u){ return u.hp > 0; });
    } else if (ability.targetType === 'all_players') {
        hitUnits = players.filter(function(u){ return u.hp > 0; });
    }

    // Apply damage
    var dmgValue = ability.damage ? Math.floor(bossAtk * ability.damage) : 0;
    if (ability.flatDamage) dmgValue = ability.flatDamage;

    for (var h = 0; h < hitUnits.length; h++) {
        if (dmgValue > 0) {
            dealDamage(boss, hitUnits[h], dmgValue, {isAbility: true, triggerOnHit: false, applyElement: !!boss.element});
        }
        if (ability.statusEffect) {
            addStatus(hitUnits[h], ability.statusEffect.type, ability.statusEffect.duration, ability.statusEffect.value, boss);
        }
    }

    // Knockback
    if (ability.knockback && ability.knockback > 0) {
        for (var h = 0; h < hitUnits.length; h++) {
            var unit = hitUnits[h];
            if (unit.hp <= 0) continue;
            var bossCenter = { row: boss.gridRow + 0.5, col: boss.gridCol + 0.5 };
            var dr = unit.gridRow > bossCenter.row ? 1 : -1;
            var dc = unit.gridCol > bossCenter.col ? 1 : (unit.gridCol < bossCenter.col ? -1 : 0);
            for (var kb = 0; kb < ability.knockback; kb++) {
                var newR = unit.gridRow + dr;
                var newC = unit.gridCol + dc;
                if (newR >= 4 && newR < 8 && newC >= 0 && newC < 7 && !grid[newR][newC]) {
                    moveUnitToCell(unit, newR, newC, grid);
                }
            }
        }
    }

    // Pull toward center (Whirlpool)
    if (ability.pullStrength && ability._pullCenter) {
        for (var h = 0; h < hitUnits.length; h++) {
            var unit = hitUnits[h];
            if (unit.hp <= 0) continue;
            var pullDr = ability._pullCenter.row > unit.gridRow ? 1 : (ability._pullCenter.row < unit.gridRow ? -1 : 0);
            var pullDc = ability._pullCenter.col > unit.gridCol ? 1 : (ability._pullCenter.col < unit.gridCol ? -1 : 0);
            var newR = unit.gridRow + pullDr;
            var newC = unit.gridCol + pullDc;
            if (newR >= 4 && newR < 8 && newC >= 0 && newC < 7 && (!grid[newR][newC] || grid[newR][newC] === unit)) {
                moveUnitToCell(unit, newR, newC, grid);
            }
        }
    }

    // Self Shield
    if (ability.targetType === 'self_shield') {
        grantShield(boss, boss, Math.floor(boss.maxHp * ability.shieldPct));
        addCombatLog(boss.name + ' gains a barrier!');
    }

    // Swap positions (Tectonic Shift)
    if (ability.targetType === 'swap_positions') {
        var alive = players.filter(function(u){ return u.hp > 0; });
        for (var j = alive.length - 1; j > 0; j--) {
            var k = Math.floor(Math.random() * (j + 1));
            var tmp = alive[j]; alive[j] = alive[k]; alive[k] = tmp;
        }
        var swapCount = Math.min(ability.swapCount || 2, Math.floor(alive.length / 2));
        for (var s = 0; s < swapCount * 2; s += 2) {
            if (s + 1 < alive.length) {
                var u1 = alive[s], u2 = alive[s + 1];
                var tmpR = u1.gridRow, tmpC = u1.gridCol;
                moveUnitToCell(u1, u2.gridRow, u2.gridCol, grid);
                moveUnitToCell(u2, tmpR, tmpC, grid);
            }
        }
        addCombatLog(boss.name + ' uses Tectonic Shift! Positions scrambled!');
    }

    if (ability.name && ability.targetType !== 'self_shield' && ability.targetType !== 'swap_positions') {
        addCombatLog(boss.name + ' uses ' + ability.name + '!');
    }
}

function processBossMinions(boss, dt) {
    if (!boss.bossData.minionSpawns || boss.bossData.minionSpawns.length === 0) return;

    for (var i = 0; i < boss.bossData.minionSpawns.length; i++) {
        var spawn = boss.bossData.minionSpawns[i];
        if (boss.currentPhase < spawn.phase) continue;

        if (!boss.minionCooldowns) boss.minionCooldowns = {};
        if (boss.minionCooldowns[i] === undefined) boss.minionCooldowns[i] = spawn.cooldown * 0.5;
        boss.minionCooldowns[i] -= dt;

        if (boss.minionCooldowns[i] <= 0) {
            boss.minionCooldowns[i] = spawn.cooldown;

            var aliveMinions = 0;
            for (var m = 0; m < combatState.enemyUnits.length; m++) {
                if (!combatState.enemyUnits[m].isBoss && combatState.enemyUnits[m].hp > 0) aliveMinions++;
            }

            if (aliveMinions >= spawn.maxAlive) continue;

            for (var u = 0; u < spawn.units.length; u++) {
                var minionDef = spawn.units[u];
                for (var c = 0; c < minionDef.count; c++) {
                    if (aliveMinions >= spawn.maxAlive) break;
                    var minion = createUnit(minionDef.key, minionDef.stars || 1);
                    if (!minion) continue;
                    minion.name = minionDef.name || minion.name;
                    minion.side = 'enemy';
                    minion.templateKey = minionDef.key;
                    minion.currentMana = 0;
                    minion.maxMana = (UNIT_TEMPLATES[minionDef.key] || {}).maxMana || 0;
                    minion.statusEffects = [];
                    minion.combatStats = { damageDealt: 0, damageTaken: 0, healingDone: 0, shieldGiven: 0, kills: 0, abilityCasts: 0 };
                    minion.ccHistory = [];
                    minion.ccImmuneUntil = 0;
                    minion.tenacity = 0;
                    minion.abilityBuffs = {};
                    minion.moveCooldown = 0;
                    minion.attackCooldown = 0;
                    minion.isCasting = false;
                    minion.castTimer = 0;

                    var placed = false;
                    for (var row = 0; row < 4 && !placed; row++) {
                        for (var col = 0; col < 7 && !placed; col++) {
                            if (!combatState.grid[row][col]) {
                                minion.gridRow = row;
                                minion.gridCol = col;
                                combatState.grid[row][col] = minion;
                                placed = true;
                            }
                        }
                    }

                    if (placed) {
                        combatState.enemyUnits.push(minion);
                        combatState.allUnits.push(minion);
                        aliveMinions++;
                        addCombatLog(boss.name + ' summons ' + minion.name + '!');
                    }
                }
            }
        }
    }
}

// ---- Innate Passive Framework ----

function getPassiveData(unit) {
    // Evolved units check EVOLVED_PASSIVE_DATA first
    if (unit.isEvolved && typeof EVOLVED_PASSIVE_DATA !== 'undefined' && EVOLVED_PASSIVE_DATA[unit.templateKey]) {
        return EVOLVED_PASSIVE_DATA[unit.templateKey];
    }
    // Fall back to base passive data
    if (typeof PASSIVE_DATA !== 'undefined') {
        return PASSIVE_DATA[unit.templateKey] || null;
    }
    return null;
}

function initUnitPassiveState(unit) {
    unit.passiveState = {
        attackCount: 0,
        stacks: 0,
        lastTarget: null,
        cooldownTimer: 0,
        triggered: false,
        customData: {}
    };
    unit.passiveTimers = unit.passiveTimers || {};
}

function processCombatStartPassives(allUnits) {
    for (var i = 0; i < allUnits.length; i++) {
        var unit = allUnits[i];
        if (unit.hp <= 0) continue;
        var passiveData = getPassiveData(unit);
        if (!passiveData || passiveData.trigger !== 'combat_start') continue;
        executeCombatStartPassive(unit, passiveData, allUnits);
    }
}

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

function processOnAttackPassive(attacker, target, allUnits) {
    if (attacker._processingPassive) return;
    var passiveData = getPassiveData(attacker);
    if (!passiveData || passiveData.trigger !== 'on_attack') return;
    attacker._processingPassive = true;
    executeOnAttackPassive(attacker, target, passiveData, allUnits);
    attacker._processingPassive = false;
}

function processOnHitPassive(defender, attacker, damage, allUnits) {
    if (defender._processingPassive) return;
    var passiveData = getPassiveData(defender);
    if (!passiveData || passiveData.trigger !== 'on_hit') return;
    defender._processingPassive = true;
    executeOnHitPassive(defender, attacker, damage, passiveData, allUnits);
    defender._processingPassive = false;
}

function processOnKillPassive(killer, victim, allUnits) {
    if (killer._processingPassive) return;
    var passiveData = getPassiveData(killer);
    if (!passiveData || passiveData.trigger !== 'on_kill') return;
    killer._processingPassive = true;
    executeOnKillPassive(killer, victim, passiveData, allUnits);
    killer._processingPassive = false;
}

// ---- Passive Execution Functions ----

function executeCombatStartPassive(unit, passiveData, allUnits) {
    var key = unit.templateKey;
    var allies = [];
    var enemies = [];
    for (var i = 0; i < allUnits.length; i++) {
        if (allUnits[i].side === unit.side) allies.push(allUnits[i]);
        else enemies.push(allUnits[i]);
    }

    switch (key) {
    // T1 base
    case 'ember_scout':
        // First attack deals 50% bonus damage
        unit.passiveState.triggered = false;
        unit.abilityBuffs = unit.abilityBuffs || {};
        unit.abilityBuffs.firstStrikeBonusDmg = 0.50;
        break;

    case 'reef_stalker':
        // After dashing gain 20% dodge 3s — set flag for dash tracking
        unit.passiveState.customData.dashDodge = 0.20;
        unit.passiveState.customData.dashDodgeDuration = 3;
        break;

    case 'gale_dancer':
        // After casting ability, gain 28% move speed 3s — tracked via abilityBuffs
        unit.passiveState.customData.postCastMoveSpeed = 0.28;
        unit.passiveState.customData.postCastDuration = 3;
        break;

    // T1 evolved
    case 'flame_rogue':
        // First attack deals 50% bonus damage + leaves fire trail
        unit.passiveState.triggered = false;
        unit.abilityBuffs = unit.abilityBuffs || {};
        unit.abilityBuffs.firstStrikeBonusDmg = 0.50;
        unit.passiveState.customData.fireTrail = true;
        break;

    case 'tidal_phantom':
        // After dashing gain 35% dodge 3s + stealth 2s
        unit.passiveState.customData.dashDodge = 0.35;
        unit.passiveState.customData.dashDodgeDuration = 3;
        unit.passiveState.customData.dashStealth = 2;
        break;

    case 'stormweaver':
        // After ability cast gain 35% move speed + 18% ATK speed
        unit.passiveState.customData.postCastMoveSpeed = 0.35;
        unit.passiveState.customData.postCastAtkSpeed = 0.18;
        unit.passiveState.customData.postCastDuration = 3;
        break;

    // T2 base
    case 'shell_knight':
        // Start with Shield 18% max HP
        grantShield(unit, unit, Math.floor(unit.maxHp * 0.18));
        unit.passiveState.customData.bigHitThreshold = 0.15;
        unit.passiveState.customData.bigHitDR = 0.08;
        break;

    case 'crystal_mage':
        // Start with Shield 22% max HP, reforms after 8s if broken
        grantShield(unit, unit, Math.floor(unit.maxHp * 0.22));
        unit.passiveState.customData.shieldReformTimer = 0;
        unit.passiveState.customData.shieldBroken = false;
        unit.passiveState.customData.shieldReformDelay = 8;
        unit.passiveState.customData.shieldAmount = 0.22;
        break;

    case 'mud_stalker':
        // Burrow underground 2s (untargetable), emerge at furthest enemy, first attack crit
        addStatus(unit, 'root', 2, 0, unit);
        unit.stasis = 2.0;
        unit.passiveState.customData.burrowTimer = 2;
        unit.passiveState.customData.nextAttackCrit = false;
        break;

    // T2 evolved
    case 'armored_sentinel':
        // Start with Shield 22% max HP, grant 12% DR
        grantShield(unit, unit, Math.floor(unit.maxHp * 0.22));
        unit.passiveState.customData.bigHitThreshold = 0.15;
        unit.passiveState.customData.bigHitDR = 0.12;
        break;

    case 'geomancer':
        // Start with Shield 28% max HP, wider area effects
        grantShield(unit, unit, Math.floor(unit.maxHp * 0.28));
        unit.passiveState.customData.shieldReformTimer = 0;
        unit.passiveState.customData.shieldBroken = false;
        unit.passiveState.customData.shieldReformDelay = 8;
        unit.passiveState.customData.shieldAmount = 0.28;
        break;

    case 'quake_reaper':
        // Burrow 2s, emerge AoE 180% ATK, root + stun all hit
        addStatus(unit, 'root', 2, 0, unit);
        unit.stasis = 2.0;
        unit.passiveState.customData.burrowTimer = 2;
        unit.passiveState.customData.nextAttackCrit = false;
        unit.passiveState.customData.emergeAoE = true;
        break;

    // ===== T3 BASE combat_start =====
    case 'golem':
        // Cannot be knocked back/pulled/displaced. Takes 12% reduced AoE damage
        unit.cannotBeKnockedBack = true;
        unit.passiveState.customData.aoeDR = 0.12;
        break;

    case 'fortress':
        // Cannot be Rooted, Stunned, or Slowed below base move speed
        unit.passiveState.customData.ccReductionActive = true;
        unit.passiveState.customData.baseMovespeed = unit.moveSpd || 1;
        break;

    // ===== T3 EVOLVED combat_start =====
    case 'iron_colossus':
        // Cannot be knocked back, 18% AoE DR
        unit.cannotBeKnockedBack = true;
        unit.passiveState.customData.aoeDR = 0.18;
        break;

    case 'citadel':
        // Immune to all CC effects
        unit.passiveState.customData.ccImmune = true;
        if (combatState) unit.ccImmuneUntil = combatState.elapsed + 999;
        break;

    // ===== T4 BASE combat_start =====
    case 'ancient_treant':
        // Cannot be slowed below 75% base move speed. Regen 1.2% HP/s standing still
        unit.passiveState.customData.minMoveSpeedPct = 0.75;
        unit.passiveState.customData.baseMovespeed = unit.moveSpd || 1;
        unit.passiveState.customData.standingStillRegen = 0.012;
        unit.passiveState.customData.lastMoveRow = unit.gridRow;
        unit.passiveState.customData.lastMoveCol = unit.gridCol;
        break;

    case 'thunderbird':
        // +20% ATK, first attack guarantees crit
        addStatus(unit, 'atkBuff', 999, 0.20, unit);
        unit.passiveState.customData.firstAttackCrit = true;
        break;

    // ===== T4 EVOLVED combat_start =====
    case 'world_sentinel':
        // Cannot be slowed at all. Regen 2% HP/s standing still
        unit.passiveState.customData.slowImmune = true;
        unit.passiveState.customData.standingStillRegen = 0.02;
        unit.passiveState.customData.lastMoveRow = unit.gridRow;
        unit.passiveState.customData.lastMoveCol = unit.gridCol;
        break;

    case 'roc_of_storms':
        // +30% ATK, first attack crit + slow
        addStatus(unit, 'atkBuff', 999, 0.30, unit);
        unit.passiveState.customData.firstAttackCrit = true;
        unit.passiveState.customData.firstAttackSlow = true;
        break;

    case 'tempest_emperor':
        // First attack after reposition guarantees crit + slow
        unit.passiveState.customData.repositionCrit = true;
        unit.passiveState.customData.repositionSlow = true;
        unit.passiveState.customData.repositioned = true; // start true for first attack
        break;

    // ===== T5 BASE combat_start =====
    case 'titan_lord':
        // +25% max HP, every 5th hit stuns 1s, first CC immunity
        var oldMaxHp = unit.maxHp;
        unit.maxHp = Math.floor(unit.maxHp * 1.25);
        unit.hp = Math.floor((unit.hp / oldMaxHp) * unit.maxHp);
        unit.passiveState.customData.hitCounter = 0;
        unit.passiveState.customData.stunInterval = 5;
        unit.passiveState.customData.stunDuration = 1;
        unit.passiveState.customData.firstCcImmunity = true;
        break;

    // ===== T5 EVOLVED combat_start =====
    case 'cosmic_titan':
        // +35% max HP, every 4th hit stuns 1.5s, CC immunity for 8s
        var oldMaxHp2 = unit.maxHp;
        unit.maxHp = Math.floor(unit.maxHp * 1.35);
        unit.hp = Math.floor((unit.hp / oldMaxHp2) * unit.maxHp);
        unit.passiveState.customData.hitCounter = 0;
        unit.passiveState.customData.stunInterval = 4;
        unit.passiveState.customData.stunDuration = 1.5;
        unit.passiveState.customData.ccImmunityTimer = 8;
        if (combatState) unit.ccImmuneUntil = combatState.elapsed + 8;
        break;
    }
}

function executeOnAttackPassive(attacker, target, passiveData, allUnits) {
    var key = attacker.templateKey;
    var params = passiveData.params || {};
    var allies = [];
    var enemies = [];
    for (var i = 0; i < allUnits.length; i++) {
        if (allUnits[i].side === attacker.side) allies.push(allUnits[i]);
        else enemies.push(allUnits[i]);
    }

    switch (key) {
    // T1 base
    case 'flame_warrior':
        // Every 3rd attack deals 25% bonus damage
        attacker.passiveState.attackCount++;
        if (attacker.passiveState.attackCount % 3 === 0) {
            var bonusDmg = Math.floor(attacker.attack * 0.25);
            if (target && target.hp > 0) {
                dealDamage(attacker, target, bonusDmg, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
            }
        }
        break;

    case 'cinder_archer':
        // Attacks vs Burning enemies deal 20% bonus damage
        if (target && target.hp > 0 && hasStatus(target, 'burn')) {
            var burnBonus = Math.floor(attacker.attack * 0.20);
            dealDamage(attacker, target, burnBonus, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
        }
        break;

    case 'fire_acolyte':
        // Heals apply Burn (8 DPS, 2s) to nearest enemy
        if (attacker.type === 'healer') {
            var nearestEnemy = null;
            var nearestDist = 999;
            for (var j = 0; j < enemies.length; j++) {
                if (enemies[j].hp > 0) {
                    var d = getManhattanDist(attacker.gridRow, attacker.gridCol, enemies[j].gridRow, enemies[j].gridCol);
                    if (d < nearestDist) { nearestDist = d; nearestEnemy = enemies[j]; }
                }
            }
            if (nearestEnemy) {
                addStatus(nearestEnemy, 'burn', 2, 8, attacker);
            }
        }
        break;

    case 'frost_archer':
        // 25% chance to slow target 15% AS for 2s
        if (target && target.hp > 0 && Math.random() < 0.25) {
            addStatus(target, 'slow', 2, 0.15, attacker);
        }
        break;

    case 'wind_squire':
        // Gain +8% ATK speed per hit, max 4 stacks (32%)
        if (attacker.passiveState.stacks < 4) {
            attacker.passiveState.stacks++;
        }
        addStatus(attacker, 'spdMod', 3, attacker.passiveState.stacks * 0.08, attacker);
        break;

    case 'spark_fencer':
        // Attacks near another Lightning unit deal 18% bonus + chain 60 damage
        var hasLightningAlly = false;
        for (var j = 0; j < allies.length; j++) {
            if (allies[j] !== attacker && allies[j].hp > 0 && allies[j].element === 'lightning') {
                var dist = getManhattanDist(attacker.gridRow, attacker.gridCol, allies[j].gridRow, allies[j].gridCol);
                if (dist <= 3) { hasLightningAlly = true; break; }
            }
        }
        if (hasLightningAlly && target && target.hp > 0) {
            var sparkBonus = Math.floor(attacker.attack * 0.18);
            dealDamage(attacker, target, sparkBonus, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
            // Chain 60 flat damage to 1 nearby enemy
            for (var j = 0; j < enemies.length; j++) {
                if (enemies[j] !== target && enemies[j].hp > 0) {
                    var cd = getManhattanDist(target.gridRow, target.gridCol, enemies[j].gridRow, enemies[j].gridCol);
                    if (cd <= 2) {
                        dealDamage(attacker, enemies[j], 60, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
                        break;
                    }
                }
            }
        }
        break;

    case 'volt_runner':
        // Each dash grants +20% crit chance 2s (stacks)
        addStatus(attacker, 'critBuff', 2, 0.20, attacker);
        break;

    case 'thunder_archer':
        // Every 3 attacks, next charged for 40% bonus + chain to 1 enemy
        attacker.passiveState.attackCount++;
        if (attacker.passiveState.attackCount % 3 === 0 && target && target.hp > 0) {
            var chargedBonus = Math.floor(attacker.attack * 0.40);
            dealDamage(attacker, target, chargedBonus, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
            // Chain to 1 nearby enemy
            for (var j = 0; j < enemies.length; j++) {
                if (enemies[j] !== target && enemies[j].hp > 0) {
                    var cd2 = getManhattanDist(target.gridRow, target.gridCol, enemies[j].gridRow, enemies[j].gridCol);
                    if (cd2 <= 3) {
                        dealDamage(attacker, enemies[j], Math.floor(attacker.attack * 0.40), {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
                        break;
                    }
                }
            }
        }
        break;

    case 'pulse_mender':
        // Heals grant target +8% crit chance 3s
        if (attacker.type === 'healer' && target && target.hp > 0) {
            addStatus(target, 'critBuff', 3, 0.08, attacker);
        }
        break;

    // T1 evolved
    case 'fire_berserker':
        // Every 2.5 attacks deals 40% bonus damage + Burn 25 DPS 4s
        attacker.passiveState.attackCount++;
        if (attacker.passiveState.attackCount % 3 === 0 || (attacker.passiveState.attackCount > 0 && attacker.passiveState.attackCount % 5 === 0)) {
            if (target && target.hp > 0) {
                var fbBonus = Math.floor(attacker.attack * 0.40);
                dealDamage(attacker, target, fbBonus, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
                addStatus(target, 'burn', 4, 25, attacker);
            }
        }
        break;

    case 'cinder_marksman':
        // Attacks vs Burning enemies deal 35% bonus (vs 20% base)
        if (target && target.hp > 0 && hasStatus(target, 'burn')) {
            var cmBonus = Math.floor(attacker.attack * 0.35);
            dealDamage(attacker, target, cmBonus, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
        }
        break;

    case 'ember_saint':
        // Heals apply Burn (15 DPS, 2.5s) + grant healed +15% ATK
        if (attacker.type === 'healer') {
            var nearestEnemy2 = null;
            var nearestDist2 = 999;
            for (var j = 0; j < enemies.length; j++) {
                if (enemies[j].hp > 0) {
                    var d2 = getManhattanDist(attacker.gridRow, attacker.gridCol, enemies[j].gridRow, enemies[j].gridCol);
                    if (d2 < nearestDist2) { nearestDist2 = d2; nearestEnemy2 = enemies[j]; }
                }
            }
            if (nearestEnemy2) {
                addStatus(nearestEnemy2, 'burn', 2.5, 15, attacker);
            }
            if (target && target.hp > 0 && target.side === attacker.side) {
                addStatus(target, 'atkBuff', 4, 0.15, attacker);
            }
        }
        break;

    case 'ice_sniper':
        // 35% chance to slow target 20% AS for 2.5s
        if (target && target.hp > 0 && Math.random() < 0.35) {
            addStatus(target, 'slow', 2.5, 0.20, attacker);
        }
        break;

    case 'zephyr_warrior':
        // Gain +10% ATK speed per hit (max 5 stacks = 50%)
        if (attacker.passiveState.stacks < 5) {
            attacker.passiveState.stacks++;
        }
        addStatus(attacker, 'spdMod', 3, attacker.passiveState.stacks * 0.10, attacker);
        break;

    case 'arc_duelist':
        // Attacks near Lightning unit deal 35% bonus + 5% per other Lightning ally
        var lightningAllyCount = 0;
        var hasNearbyLightning = false;
        for (var j = 0; j < allies.length; j++) {
            if (allies[j] !== attacker && allies[j].hp > 0 && allies[j].element === 'lightning') {
                lightningAllyCount++;
                var dist2 = getManhattanDist(attacker.gridRow, attacker.gridCol, allies[j].gridRow, allies[j].gridCol);
                if (dist2 <= 3) hasNearbyLightning = true;
            }
        }
        if (hasNearbyLightning && target && target.hp > 0) {
            var arcBonus = 0.35 + (lightningAllyCount * 0.05);
            dealDamage(attacker, target, Math.floor(attacker.attack * arcBonus), {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
        }
        break;

    case 'lightning_phantom':
        // Each dash grants +35% crit chance 2s, hits twice on crit
        addStatus(attacker, 'critBuff', 2, 0.35, attacker);
        break;

    case 'storm_archer':
        // Every 2 attacks, charged for 60% bonus + chains to 2
        attacker.passiveState.attackCount++;
        if (attacker.passiveState.attackCount % 2 === 0 && target && target.hp > 0) {
            var saBonus = Math.floor(attacker.attack * 0.60);
            dealDamage(attacker, target, saBonus, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
            var chainCount = 0;
            for (var j = 0; j < enemies.length; j++) {
                if (enemies[j] !== target && enemies[j].hp > 0 && chainCount < 2) {
                    var cd3 = getManhattanDist(target.gridRow, target.gridCol, enemies[j].gridRow, enemies[j].gridCol);
                    if (cd3 <= 3) {
                        dealDamage(attacker, enemies[j], Math.floor(attacker.attack * 0.60), {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
                        chainCount++;
                    }
                }
            }
        }
        break;

    case 'storm_medic':
        // Heals grant target +12% crit chance 3s
        if (attacker.type === 'healer' && target && target.hp > 0) {
            addStatus(target, 'critBuff', 3, 0.12, attacker);
        }
        break;

    // T2 base
    case 'blaze_lancer':
        // Consecutive hits same target +8%/stack (max 5)
        if (target === attacker.passiveState.lastTarget) {
            if (attacker.passiveState.stacks < 5) attacker.passiveState.stacks++;
        } else {
            attacker.passiveState.stacks = 0;
        }
        attacker.passiveState.lastTarget = target;
        if (attacker.passiveState.stacks > 0 && target && target.hp > 0) {
            var blazeBonus = Math.floor(attacker.attack * attacker.passiveState.stacks * 0.08);
            dealDamage(attacker, target, blazeBonus, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
        }
        break;

    case 'hydro_mage':
        // Abilities deal 18% bonus to Slowed targets
        if (target && target.hp > 0 && hasStatus(target, 'slow')) {
            var hmBonus = Math.floor(attacker.attack * 0.18);
            dealDamage(attacker, target, hmBonus, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
        }
        break;

    case 'earth_shaman':
        // Allies healed gain 12% CC resistance 4s
        if (attacker.type === 'healer' && target && target.hp > 0 && target.side === attacker.side) {
            addStatus(target, 'ccResist', 4, 0.12, attacker);
        }
        break;

    case 'shock_mage':
        // Abilities have 18% chance to crit and chain to 1 target
        if (Math.random() < 0.18 && target && target.hp > 0) {
            for (var j = 0; j < enemies.length; j++) {
                if (enemies[j] !== target && enemies[j].hp > 0) {
                    var cd4 = getManhattanDist(target.gridRow, target.gridCol, enemies[j].gridRow, enemies[j].gridCol);
                    if (cd4 <= 3) {
                        dealDamage(attacker, enemies[j], Math.floor(attacker.attack * 0.50), {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
                        break;
                    }
                }
            }
        }
        break;

    case 'war_cleric':
        // Heals grant target +8% ATK +5% DR 4s
        if (attacker.type === 'healer' && target && target.hp > 0 && target.side === attacker.side) {
            addStatus(target, 'atkBuff', 4, 0.08, attacker);
            addStatus(target, 'drMod', 4, 0.05, attacker);
        }
        break;

    case 'battle_mage':
        // Abilities ignore 12% enemy DR — applied via customData flag
        attacker.passiveState.customData.drIgnore = 0.12;
        break;

    // T2 evolved
    case 'inferno_lancer':
        // Consecutive hits +10% damage + 5% lifesteal per stack (max 5)
        if (target === attacker.passiveState.lastTarget) {
            if (attacker.passiveState.stacks < 5) attacker.passiveState.stacks++;
        } else {
            attacker.passiveState.stacks = 0;
        }
        attacker.passiveState.lastTarget = target;
        if (attacker.passiveState.stacks > 0 && target && target.hp > 0) {
            var ilBonus = Math.floor(attacker.attack * attacker.passiveState.stacks * 0.10);
            dealDamage(attacker, target, ilBonus, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
        }
        break;

    case 'abyssal_mage':
        // Abilities deal 28% bonus to Slowed (vs 18%), chains to 2
        if (target && target.hp > 0 && hasStatus(target, 'slow')) {
            var amBonus = Math.floor(attacker.attack * 0.28);
            dealDamage(attacker, target, amBonus, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
        }
        break;

    case 'gaia_priest':
        // Allies healed gain 20% CC resist + CC immunity first time
        if (attacker.type === 'healer' && target && target.hp > 0 && target.side === attacker.side) {
            addStatus(target, 'ccResist', 4, 0.20, attacker);
            if (!target.passiveState || !target.passiveState.customData || !target.passiveState.customData.ccImmunityUsed) {
                if (target.passiveState && target.passiveState.customData) {
                    target.passiveState.customData.ccImmunityUsed = true;
                }
                if (combatState) target.ccImmuneUntil = combatState.elapsed + 4;
            }
        }
        break;

    case 'tempest_mage':
        // Abilities have 25% crit chance + chain to 2
        if (Math.random() < 0.25 && target && target.hp > 0) {
            var tmChainCount = 0;
            for (var j = 0; j < enemies.length; j++) {
                if (enemies[j] !== target && enemies[j].hp > 0 && tmChainCount < 2) {
                    var cd5 = getManhattanDist(target.gridRow, target.gridCol, enemies[j].gridRow, enemies[j].gridCol);
                    if (cd5 <= 3) {
                        dealDamage(attacker, enemies[j], Math.floor(attacker.attack * 0.60), {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
                        tmChainCount++;
                    }
                }
            }
        }
        break;

    case 'battle_priest':
        // Heals grant +12% ATK + 8% DR
        if (attacker.type === 'healer' && target && target.hp > 0 && target.side === attacker.side) {
            addStatus(target, 'atkBuff', 4, 0.12, attacker);
            addStatus(target, 'drMod', 4, 0.08, attacker);
        }
        break;

    case 'force_archmage':
        // Abilities ignore 18% DR
        attacker.passiveState.customData.drIgnore = 0.18;
        break;

    // ===== T3 BASE on_attack =====
    case 'pyromancer':
        // Burn effects on targets last 50% longer and deal 20% more DPS
        if (target && target.hp > 0 && target.statusEffects) {
            for (var si = 0; si < target.statusEffects.length; si++) {
                if (target.statusEffects[si].type === 'burn') {
                    target.statusEffects[si].duration *= 1.5;
                    target.statusEffects[si].value = Math.floor(target.statusEffects[si].value * 1.2);
                }
            }
        }
        break;

    case 'tidal_shaman':
        // Heals apply Slow (12% AS, 2s) to nearest enemy
        if (attacker.type === 'healer') {
            var tsNearestEnemy = null;
            var tsNearestDist = 999;
            for (var j = 0; j < enemies.length; j++) {
                if (enemies[j].hp > 0) {
                    var tsd = getManhattanDist(attacker.gridRow, attacker.gridCol, enemies[j].gridRow, enemies[j].gridCol);
                    if (tsd < tsNearestDist) { tsNearestDist = tsd; tsNearestEnemy = enemies[j]; }
                }
            }
            if (tsNearestEnemy) {
                addStatus(tsNearestEnemy, 'slow', 2, 0.12, attacker);
            }
        }
        break;

    case 'riptide_blade':
        // Attacks against Slowed enemies have 25% chance to grant +25% ATK 3s
        if (target && target.hp > 0 && hasStatus(target, 'slow') && Math.random() < 0.25) {
            addStatus(attacker, 'atkBuff', 3, 0.25, attacker);
        }
        break;

    case 'terra_sage':
        // On ability cast, nearest ally gains Shield 18% max HP (tracked via on_attack trigger for simplicity)
        // This is actually on_ability_cast but uses on_attack trigger
        break;

    case 'wind_duelist':
        // Every attack grants +5% dodge (max 5 stacks)
        if (!attacker.passiveState.customData.dodgeStacks) attacker.passiveState.customData.dodgeStacks = 0;
        if (attacker.passiveState.customData.dodgeStacks < 5) {
            attacker.passiveState.customData.dodgeStacks++;
        }
        addStatus(attacker, 'dodgeBuff', 999, attacker.passiveState.customData.dodgeStacks * 0.05, attacker);
        break;

    case 'storm_sovereign':
        // First auto after repositioning guarantees crit
        if (attacker.passiveState.customData.repositioned) {
            attacker.passiveState.customData.repositioned = false;
            if (target && target.hp > 0) {
                var critDmg = Math.floor(attacker.attack * 0.5);
                dealDamage(attacker, target, critDmg, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
            }
        }
        break;

    case 'void_wyrm':
        // Auto-attacks teleport target 1 cell random direction (3s cooldown per target)
        if (target && target.hp > 0 && combatState) {
            if (!attacker.passiveState.customData.teleportCooldowns) attacker.passiveState.customData.teleportCooldowns = {};
            var targetId = target.id || (target.gridRow + '_' + target.gridCol);
            if (!attacker.passiveState.customData.teleportCooldowns[targetId] || attacker.passiveState.customData.teleportCooldowns[targetId] <= 0) {
                var dirs8 = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
                var randDir = dirs8[Math.floor(Math.random() * dirs8.length)];
                var newRow = target.gridRow + randDir[0];
                var newCol = target.gridCol + randDir[1];
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 7 && !combatState.grid[newRow][newCol]) {
                    moveUnitToCell(target, newRow, newCol, combatState.grid);
                }
                attacker.passiveState.customData.teleportCooldowns[targetId] = 3;
            }
        }
        break;

    case 'gladiator':
        // Every 3 attacks gain +40% ATK for next attack
        attacker.passiveState.attackCount++;
        if (attacker.passiveState.attackCount % 3 === 0) {
            attacker.abilityBuffs = attacker.abilityBuffs || {};
            attacker.abilityBuffs.nextAtkMult = 1.4;
        }
        break;

    case 'siege_engineer':
        // Attacks ignore 15% target DR
        attacker.passiveState.customData.drIgnore = 0.15;
        break;

    // ===== T3 EVOLVED on_attack =====
    case 'arcane_inferno':
        // Burn effects on targets last 70% longer and deal 35% more DPS
        if (target && target.hp > 0 && target.statusEffects) {
            for (var si2 = 0; si2 < target.statusEffects.length; si2++) {
                if (target.statusEffects[si2].type === 'burn') {
                    target.statusEffects[si2].duration *= 1.7;
                    target.statusEffects[si2].value = Math.floor(target.statusEffects[si2].value * 1.35);
                }
            }
        }
        break;

    case 'stormtide_oracle':
        // Heals apply 18% Slow to 2 nearest enemies
        if (attacker.type === 'healer') {
            var stoSorted = [];
            for (var j = 0; j < enemies.length; j++) {
                if (enemies[j].hp > 0) {
                    stoSorted.push({unit: enemies[j], dist: getManhattanDist(attacker.gridRow, attacker.gridCol, enemies[j].gridRow, enemies[j].gridCol)});
                }
            }
            stoSorted.sort(function(a, b) { return a.dist - b.dist; });
            for (var j = 0; j < Math.min(2, stoSorted.length); j++) {
                addStatus(stoSorted[j].unit, 'slow', 2, 0.18, attacker);
            }
        }
        break;

    case 'tsunami_warlord':
        // 35% chance to grant +40% ATK when hitting Slowed targets
        if (target && target.hp > 0 && hasStatus(target, 'slow') && Math.random() < 0.35) {
            addStatus(attacker, 'atkBuff', 3, 0.40, attacker);
        }
        break;

    case 'earthweaver':
        // On ability cast, nearest ally gains 25% max HP shield
        break;

    case 'hurricane_blade':
        // Every attack grants +8% dodge (max 8 stacks)
        if (!attacker.passiveState.customData.dodgeStacks) attacker.passiveState.customData.dodgeStacks = 0;
        if (attacker.passiveState.customData.dodgeStacks < 8) {
            attacker.passiveState.customData.dodgeStacks++;
        }
        addStatus(attacker, 'dodgeBuff', 999, attacker.passiveState.customData.dodgeStacks * 0.08, attacker);
        break;

    case 'champion':
        // Every 2 attacks gain +60% ATK for next attack
        attacker.passiveState.attackCount++;
        if (attacker.passiveState.attackCount % 2 === 0) {
            attacker.abilityBuffs = attacker.abilityBuffs || {};
            attacker.abilityBuffs.nextAtkMult = 1.6;
        }
        break;

    case 'war_architect':
        // Attacks ignore 25% DR and apply 20% additional damage
        attacker.passiveState.customData.drIgnore = 0.25;
        if (target && target.hp > 0) {
            var warArchBonus = Math.floor(attacker.attack * 0.20);
            dealDamage(attacker, target, warArchBonus, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
        }
        break;

    // ===== T4 BASE on_attack =====
    case 'storm_sovereign':
        // Already handled above (same key)
        break;

    // ===== T4 EVOLVED on_attack =====
    case 'tempest_emperor':
        // First auto after repositioning guarantees crit + applies 15% Slow
        if (attacker.passiveState.customData.repositioned) {
            attacker.passiveState.customData.repositioned = false;
            if (target && target.hp > 0) {
                var teCritDmg = Math.floor(attacker.attack * 0.5);
                dealDamage(attacker, target, teCritDmg, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
                addStatus(target, 'slow', 3, 0.15, attacker);
            }
        }
        break;

    // ===== T5 BASE on_attack (for passives that trigger on attack) =====
    case 'titan_lord':
        // Every 5th hit stuns target 1s
        if (!attacker.passiveState.customData.hitCounter) attacker.passiveState.customData.hitCounter = 0;
        attacker.passiveState.customData.hitCounter++;
        if (attacker.passiveState.customData.hitCounter % (attacker.passiveState.customData.stunInterval || 5) === 0) {
            if (target && target.hp > 0) {
                addStatus(target, 'stun', attacker.passiveState.customData.stunDuration || 1, 0, attacker);
            }
        }
        break;

    // ===== T5 EVOLVED on_attack =====
    case 'cosmic_titan':
        // Every 4th hit stuns target 1.5s
        if (!attacker.passiveState.customData.hitCounter) attacker.passiveState.customData.hitCounter = 0;
        attacker.passiveState.customData.hitCounter++;
        if (attacker.passiveState.customData.hitCounter % (attacker.passiveState.customData.stunInterval || 4) === 0) {
            if (target && target.hp > 0) {
                addStatus(target, 'stun', attacker.passiveState.customData.stunDuration || 1.5, 0, attacker);
            }
        }
        break;

    case 'dimensional_dragon':
        // Auto-attacks teleport target 2 cells + 15% Slow
        if (target && target.hp > 0 && combatState) {
            if (!attacker.passiveState.customData.teleportCooldowns) attacker.passiveState.customData.teleportCooldowns = {};
            var ddTargetId = target.id || (target.gridRow + '_' + target.gridCol);
            if (!attacker.passiveState.customData.teleportCooldowns[ddTargetId] || attacker.passiveState.customData.teleportCooldowns[ddTargetId] <= 0) {
                var ddDirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
                var ddDir = ddDirs[Math.floor(Math.random() * ddDirs.length)];
                for (var ddStep = 2; ddStep >= 1; ddStep--) {
                    var ddRow = target.gridRow + ddDir[0] * ddStep;
                    var ddCol = target.gridCol + ddDir[1] * ddStep;
                    if (ddRow >= 0 && ddRow < 8 && ddCol >= 0 && ddCol < 7 && !combatState.grid[ddRow][ddCol]) {
                        moveUnitToCell(target, ddRow, ddCol, combatState.grid);
                        break;
                    }
                }
                addStatus(target, 'slow', 3, 0.15, attacker);
                attacker.passiveState.customData.teleportCooldowns[ddTargetId] = 3;
            }
        }
        break;

    // Thunderbird/Roc: first attack crit (handled via customData flag)
    case 'thunderbird':
    case 'roc_of_storms':
        if (attacker.passiveState.customData.firstAttackCrit) {
            attacker.passiveState.customData.firstAttackCrit = false;
            if (target && target.hp > 0) {
                var firstAtkBonus = Math.floor(attacker.attack * 0.5);
                dealDamage(attacker, target, firstAtkBonus, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
                if (attacker.passiveState.customData.firstAttackSlow && target.hp > 0) {
                    addStatus(target, 'slow', 2, 0.15, attacker);
                }
            }
        }
        break;
    }
}

function executeOnHitPassive(defender, attacker, damage, passiveData, allUnits) {
    var key = defender.templateKey;
    var params = passiveData.params || {};

    switch (key) {
    // T1 base
    case 'tide_hunter':
        // Attacker slowed 8% for 2.5s
        if (attacker && attacker.hp > 0) {
            addStatus(attacker, 'slow', 2.5, 0.08, defender);
        }
        break;

    case 'bramble_knight':
        // Melee attackers take 12 damage
        if (attacker && attacker.hp > 0) {
            var dist = getManhattanDist(defender.gridRow, defender.gridCol, attacker.gridRow, attacker.gridCol);
            if (dist <= 1) {
                dealDamage(defender, attacker, 12, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
            }
        }
        break;

    // T1 evolved
    case 'tsunami_blade':
        // Attacker slowed 12% for 3s + self heals 20% of damage taken
        if (attacker && attacker.hp > 0) {
            addStatus(attacker, 'slow', 3, 0.12, defender);
        }
        var healAmt = Math.floor(damage * 0.20);
        if (healAmt > 0) dealHealing(defender, defender, healAmt);
        break;

    case 'ironwood_sentinel':
        // Melee attackers take 12-25 damage based on missing HP
        if (attacker && attacker.hp > 0) {
            var dist2 = getManhattanDist(defender.gridRow, defender.gridCol, attacker.gridRow, attacker.gridCol);
            if (dist2 <= 1) {
                var missingHpPct = 1 - (defender.hp / defender.maxHp);
                var thornDmg = Math.floor(12 + (13 * missingHpPct)); // 12-25
                dealDamage(defender, attacker, thornDmg, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
            }
        }
        break;

    // T2 base
    case 'magma_knight':
        // When hit by melee, deal 15 fire damage back
        if (attacker && attacker.hp > 0) {
            var dist3 = getManhattanDist(defender.gridRow, defender.gridCol, attacker.gridRow, attacker.gridCol);
            if (dist3 <= 1) {
                dealDamage(defender, attacker, 15, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
            }
        }
        break;

    case 'shell_knight':
        // On damage above 15% max HP in single hit: gain 8% DR for 3s
        if (damage > defender.maxHp * 0.15) {
            addStatus(defender, 'drMod', 3, 0.08, defender);
        }
        break;

    case 'gust_sentinel':
        // 12% chance deflect ranged attacks (bounce to random enemy 50% dmg)
        if (attacker && attacker.hp > 0 && attacker.range > 1 && Math.random() < 0.12) {
            var enemies = [];
            for (var i = 0; i < allUnits.length; i++) {
                if (allUnits[i].side !== defender.side && allUnits[i].hp > 0 && allUnits[i] !== attacker) {
                    enemies.push(allUnits[i]);
                }
            }
            if (enemies.length > 0) {
                var randEnemy = enemies[Math.floor(Math.random() * enemies.length)];
                dealDamage(defender, randEnemy, Math.floor(damage * 0.50), {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
            }
        }
        break;

    case 'tesla_knight':
        // Enemies hitting within 1 cell gain +15% damage taken 3s
        if (attacker && attacker.hp > 0) {
            var dist4 = getManhattanDist(defender.gridRow, defender.gridCol, attacker.gridRow, attacker.gridCol);
            if (dist4 <= 1) {
                addStatus(attacker, 'vulnerability', 3, 0.15, defender);
            }
        }
        break;

    // T2 evolved
    case 'volcano_titan':
        // Melee attackers take 25 damage + lava pool (30 DPS, 3s)
        if (attacker && attacker.hp > 0) {
            var dist5 = getManhattanDist(defender.gridRow, defender.gridCol, attacker.gridRow, attacker.gridCol);
            if (dist5 <= 1) {
                dealDamage(defender, attacker, 25, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
                addStatus(attacker, 'burn', 3, 30, defender);
            }
        }
        break;

    case 'armored_sentinel':
        // On damage above 15% max HP: gain 12% DR for 3s
        if (damage > defender.maxHp * 0.15) {
            addStatus(defender, 'drMod', 3, 0.12, defender);
        }
        break;

    case 'tempest_guardian':
        // 20% chance deflect ranged attacks, reflect 35% damage
        if (attacker && attacker.hp > 0 && attacker.range > 1 && Math.random() < 0.20) {
            var enemies2 = [];
            for (var i = 0; i < allUnits.length; i++) {
                if (allUnits[i].side !== defender.side && allUnits[i].hp > 0 && allUnits[i] !== attacker) {
                    enemies2.push(allUnits[i]);
                }
            }
            if (enemies2.length > 0) {
                var randEnemy2 = enemies2[Math.floor(Math.random() * enemies2.length)];
                dealDamage(defender, randEnemy2, Math.floor(damage * 0.35), {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
            }
        }
        break;

    case 'storm_bastion':
        // Enemies within 2 cells gain +15% damage taken 3s, reflect 40%
        if (attacker && attacker.hp > 0) {
            var dist6 = getManhattanDist(defender.gridRow, defender.gridCol, attacker.gridRow, attacker.gridCol);
            if (dist6 <= 2) {
                addStatus(attacker, 'vulnerability', 3, 0.15, defender);
                var reflDmg = Math.floor(damage * 0.40);
                if (reflDmg > 0) {
                    dealDamage(defender, attacker, reflDmg, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
                }
            }
        }
        break;

    // ===== T3 BASE on_hit =====
    case 'thunder_warden':
        // Converts crits into stuns. Every 3rd crit stuns attacker 0.5s
        if (attacker && attacker.hp > 0) {
            if (!defender.passiveState.customData.critHitCount) defender.passiveState.customData.critHitCount = 0;
            defender.passiveState.customData.critHitCount++;
            if (defender.passiveState.customData.critHitCount % 3 === 0) {
                addStatus(attacker, 'stun', 0.5, 0, defender);
            }
        }
        break;

    // ===== T3 EVOLVED on_hit =====
    case 'iron_colossus':
        // 18% AoE damage reduction (handled via customData flag in damage calc)
        break;

    case 'storm_fortress':
        // Crits against it stun attacker 1s + reflect 20% crit damage
        if (attacker && attacker.hp > 0) {
            addStatus(attacker, 'stun', 1, 0, defender);
            var sfReflect = Math.floor(damage * 0.20);
            if (sfReflect > 0) {
                dealDamage(defender, attacker, sfReflect, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
            }
        }
        break;

    // ===== T5 BASE on_hit (Leviathan mana drain) =====
    case 'leviathan':
        // Enemies hitting Leviathan lose 8 mana
        if (attacker && attacker.hp > 0 && attacker.maxMana > 0) {
            attacker.currentMana = Math.max(0, (attacker.currentMana || 0) - 8);
        }
        break;

    case 'primordial_leviathan':
        // Enemies hitting lose 8 mana (same as base)
        if (attacker && attacker.hp > 0 && attacker.maxMana > 0) {
            attacker.currentMana = Math.max(0, (attacker.currentMana || 0) - 8);
        }
        break;
    }
}

function executeOnKillPassive(killer, victim, passiveData, allUnits) {
    var key = killer.templateKey;

    switch (key) {
    // T1 base
    case 'zephyr_scout':
        // Gain 35% move speed 2.5s after kill
        addStatus(killer, 'moveSpeedBuff', 2.5, 0.35, killer);
        break;

    case 'shadow_blade':
        // Gain +25% move speed and dodge 2s after kill
        addStatus(killer, 'moveSpeedBuff', 2, 0.25, killer);
        addStatus(killer, 'dodgeBuff', 2, 0.25, killer);
        break;

    // T1 evolved
    case 'storm_assassin':
        // Gain 45% move speed + 20% dodge 2.5s, reset dash on kill
        addStatus(killer, 'moveSpeedBuff', 2.5, 0.45, killer);
        addStatus(killer, 'dodgeBuff', 2.5, 0.20, killer);
        killer.attackCooldown = 0;
        break;

    case 'night_stalker':
        // Gain +35% move speed + 20% dodge 2.5s, 12% lifesteal on kills
        addStatus(killer, 'moveSpeedBuff', 2.5, 0.35, killer);
        addStatus(killer, 'dodgeBuff', 2.5, 0.20, killer);
        var lsHeal = Math.floor(victim.maxHp * 0.12);
        if (lsHeal > 0) dealHealing(killer, killer, lsHeal);
        break;

    // ===== T3 BASE on_kill =====
    case 'monsoon_caller':
        // Kills grant all Wind allies 10% ATK speed 5s (max 4 stacks)
        var mcWindAllies = getAlliesOfElement(killer, 'wind');
        for (var j = 0; j < mcWindAllies.length; j++) {
            if (!mcWindAllies[j].passiveState) continue;
            if (!mcWindAllies[j].passiveState.customData.updraftStacks) mcWindAllies[j].passiveState.customData.updraftStacks = 0;
            if (mcWindAllies[j].passiveState.customData.updraftStacks < 4) {
                mcWindAllies[j].passiveState.customData.updraftStacks++;
                addStatus(mcWindAllies[j], 'spdMod', 5, mcWindAllies[j].passiveState.customData.updraftStacks * 0.10, killer);
            }
        }
        break;

    // ===== T3 EVOLVED on_kill =====
    case 'tempest_lord':
        // Kills grant Wind allies 10% ATK speed (max 6 stacks, 7s)
        var tlWindAllies = getAlliesOfElement(killer, 'wind');
        for (var j = 0; j < tlWindAllies.length; j++) {
            if (!tlWindAllies[j].passiveState) continue;
            if (!tlWindAllies[j].passiveState.customData.updraftStacks) tlWindAllies[j].passiveState.customData.updraftStacks = 0;
            if (tlWindAllies[j].passiveState.customData.updraftStacks < 6) {
                tlWindAllies[j].passiveState.customData.updraftStacks++;
                addStatus(tlWindAllies[j], 'spdMod', 7, tlWindAllies[j].passiveState.customData.updraftStacks * 0.10, killer);
            }
        }
        break;
    }
}

function processPeriodicPassive(unit, passiveData, dt) {
    var key = unit.templateKey;
    if (!unit.passiveTimers[key]) unit.passiveTimers[key] = 0;
    unit.passiveTimers[key] += dt;

    switch (key) {
    // T1 base
    case 'seedling_archer':
        // Every 6s gain +4% ATK stack (max 6)
        if (unit.passiveTimers[key] >= 6) {
            unit.passiveTimers[key] -= 6;
            if (unit.passiveState.stacks < 6) {
                unit.passiveState.stacks++;
                addStatus(unit, 'atkBuff', 999, unit.passiveState.stacks * 0.04, unit);
            }
        }
        break;

    case 'steel_archer':
        // Gain +8% damage per second standing still (max 40%)
        // Simplified: increment each second
        if (unit.passiveTimers[key] >= 1) {
            unit.passiveTimers[key] -= 1;
            if (unit.passiveState.stacks < 5) {
                unit.passiveState.stacks++;
                addStatus(unit, 'atkBuff', 999, unit.passiveState.stacks * 0.08, unit);
            }
        }
        break;

    // T1 evolved
    case 'thornwood_ranger':
        // Every 5s gain +5% ATK stack (max 6), apply 15% slow to rooted
        if (unit.passiveTimers[key] >= 5) {
            unit.passiveTimers[key] -= 5;
            if (unit.passiveState.stacks < 6) {
                unit.passiveState.stacks++;
                addStatus(unit, 'atkBuff', 999, unit.passiveState.stacks * 0.05, unit);
            }
        }
        break;

    case 'ballista_archer':
        // Gain +10% damage per second standing still (max 50%)
        if (unit.passiveTimers[key] >= 1) {
            unit.passiveTimers[key] -= 1;
            if (unit.passiveState.stacks < 5) {
                unit.passiveState.stacks++;
                addStatus(unit, 'atkBuff', 999, unit.passiveState.stacks * 0.10, unit);
            }
        }
        break;

    // Crystal mage shield reform timer
    case 'crystal_mage':
        if (unit.passiveState.customData.shieldBroken) {
            if (unit.passiveTimers[key] >= unit.passiveState.customData.shieldReformDelay) {
                unit.passiveTimers[key] = 0;
                unit.passiveState.customData.shieldBroken = false;
                grantShield(unit, unit, Math.floor(unit.maxHp * unit.passiveState.customData.shieldAmount));
            }
        }
        break;

    case 'geomancer':
        if (unit.passiveState.customData.shieldBroken) {
            if (unit.passiveTimers[key] >= unit.passiveState.customData.shieldReformDelay) {
                unit.passiveTimers[key] = 0;
                unit.passiveState.customData.shieldBroken = false;
                grantShield(unit, unit, Math.floor(unit.maxHp * unit.passiveState.customData.shieldAmount));
            }
        }
        break;

    // Mud stalker / quake reaper burrow emerge
    case 'mud_stalker':
        if (unit.passiveState.customData.burrowTimer > 0) {
            unit.passiveState.customData.burrowTimer -= dt;
            if (unit.passiveState.customData.burrowTimer <= 0) {
                unit.stasis = 0;
                unit.passiveState.customData.nextAttackCrit = true;
                // Emerge at furthest enemy
                var enemies = [];
                for (var i = 0; i < (combatState ? combatState.allUnits.length : 0); i++) {
                    if (combatState.allUnits[i].side !== unit.side && combatState.allUnits[i].hp > 0) {
                        enemies.push(combatState.allUnits[i]);
                    }
                }
                var furthest = getFurthestEnemy(unit, enemies);
                if (furthest && combatState) {
                    var emptyCell = findEmptyCellNear(furthest.gridRow, furthest.gridCol, combatState.grid);
                    if (emptyCell) moveUnitToCell(unit, emptyCell.row, emptyCell.col, combatState.grid);
                }
                grantShield(unit, unit, Math.floor(unit.maxHp * 0.15));
            }
        }
        break;

    case 'quake_reaper':
        if (unit.passiveState.customData.burrowTimer > 0) {
            unit.passiveState.customData.burrowTimer -= dt;
            if (unit.passiveState.customData.burrowTimer <= 0) {
                unit.stasis = 0;
                unit.passiveState.customData.nextAttackCrit = true;
                var enemies2 = [];
                for (var i = 0; i < (combatState ? combatState.allUnits.length : 0); i++) {
                    if (combatState.allUnits[i].side !== unit.side && combatState.allUnits[i].hp > 0) {
                        enemies2.push(combatState.allUnits[i]);
                    }
                }
                var furthest2 = getFurthestEnemy(unit, enemies2);
                if (furthest2 && combatState) {
                    var emptyCell2 = findEmptyCellNear(furthest2.gridRow, furthest2.gridCol, combatState.grid);
                    if (emptyCell2) moveUnitToCell(unit, emptyCell2.row, emptyCell2.col, combatState.grid);
                    // AoE damage on emerge
                    var emergeTargets = getUnitsInRadius(unit.gridRow, unit.gridCol, 2, enemies2);
                    for (var j = 0; j < emergeTargets.length; j++) {
                        dealDamage(unit, emergeTargets[j], Math.floor(unit.attack * 1.80), {isAbility: true, triggerOnHit: false});
                        addStatus(emergeTargets[j], 'root', 2, 0, unit);
                        addStatus(emergeTargets[j], 'stun', 0.5, 0, unit);
                    }
                }
                grantShield(unit, unit, Math.floor(unit.maxHp * 0.20));
            }
        }
        break;

    // ===== T3 BASE periodic =====
    case 'inferno_fox':
        // Leave fire trail when moving. Trail lasts 2.5s, deals 18 DPS
        if (!unit.passiveState.customData.foxfireTrail) unit.passiveState.customData.foxfireTrail = [];
        if (!unit.passiveState.customData.foxfireTimer) unit.passiveState.customData.foxfireTimer = 0;
        unit.passiveState.customData.foxfireTimer += dt;
        // Add trail tile every 0.3s if unit has moved
        if (unit.passiveState.customData.foxfireTimer >= 0.3) {
            unit.passiveState.customData.foxfireTimer -= 0.3;
            var trail = unit.passiveState.customData.foxfireTrail;
            var lastTrail = trail.length > 0 ? trail[trail.length - 1] : null;
            if (!lastTrail || lastTrail.row !== unit.gridRow || lastTrail.col !== unit.gridCol) {
                if (trail.length >= 12) trail.shift();
                trail.push({row: unit.gridRow, col: unit.gridCol, timer: 2.5});
            }
        }
        // Process trail damage
        if (combatState) {
            var foxEnemies = unit.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
            var fTrail = unit.passiveState.customData.foxfireTrail;
            for (var ti = fTrail.length - 1; ti >= 0; ti--) {
                fTrail[ti].timer -= dt;
                if (fTrail[ti].timer <= 0) { fTrail.splice(ti, 1); continue; }
                for (var ei = 0; ei < foxEnemies.length; ei++) {
                    if (foxEnemies[ei].hp > 0 && foxEnemies[ei].gridRow === fTrail[ti].row && foxEnemies[ei].gridCol === fTrail[ti].col) {
                        dealDamage(unit, foxEnemies[ei], Math.floor(18 * dt), {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
                    }
                }
            }
        }
        break;

    case 'ball_lightning':
        // Create persistent lightning orb every 1.5s (max 3). Orb deals 15 DPS, +12% vulnerability
        if (!unit.passiveState.customData.orbs) unit.passiveState.customData.orbs = [];
        if (!unit.passiveState.customData.orbSpawnTimer) unit.passiveState.customData.orbSpawnTimer = 0;
        unit.passiveState.customData.orbSpawnTimer += dt;
        if (unit.passiveState.customData.orbSpawnTimer >= 1.5 && unit.passiveState.customData.orbs.length < 3) {
            unit.passiveState.customData.orbSpawnTimer -= 1.5;
            unit.passiveState.customData.orbs.push({row: unit.gridRow, col: unit.gridCol, timer: 5, radius: 2, dps: 15});
        }
        if (combatState) {
            var blEnemies = unit.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
            var orbs = unit.passiveState.customData.orbs;
            for (var oi = orbs.length - 1; oi >= 0; oi--) {
                orbs[oi].timer -= dt;
                if (orbs[oi].timer <= 0) { orbs.splice(oi, 1); continue; }
                var orbTargets = getUnitsInRadius(orbs[oi].row, orbs[oi].col, orbs[oi].radius, blEnemies);
                for (var ej = 0; ej < orbTargets.length; ej++) {
                    dealDamage(unit, orbTargets[ej], Math.floor(orbs[oi].dps * dt), {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
                    addStatus(orbTargets[ej], 'vulnerability', 1.5, 0.12, unit);
                }
            }
        }
        break;

    case 'kraken':
        // Every 15s, release ink cloud (2-cell radius), enemies 35% miss chance 3s
        if (!unit.passiveTimers['kraken_ink']) unit.passiveTimers['kraken_ink'] = 0;
        unit.passiveTimers['kraken_ink'] += dt;
        if (unit.passiveTimers['kraken_ink'] >= 15 && combatState) {
            unit.passiveTimers['kraken_ink'] -= 15;
            var inkEnemies = unit.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
            var inkTargets = getUnitsInRadius(unit.gridRow, unit.gridCol, 2, inkEnemies);
            for (var j = 0; j < inkTargets.length; j++) {
                addStatus(inkTargets[j], 'dodgeBuff', 3, -0.35, unit); // miss chance as negative dodge on attacker
                addStatus(inkTargets[j], 'slow', 3, 0.10, unit);
            }
        }
        break;

    case 'leviathan':
        // Every 10s, submerge 1.5s (untargetable), resurface deals 120% ATK + Slow
        if (!unit.passiveTimers['leviathan_sub']) unit.passiveTimers['leviathan_sub'] = 0;
        if (!unit.passiveState.customData.submergeActive) {
            unit.passiveTimers['leviathan_sub'] += dt;
            if (unit.passiveTimers['leviathan_sub'] >= 10) {
                unit.passiveTimers['leviathan_sub'] = 0;
                unit.passiveState.customData.submergeActive = true;
                unit.passiveState.customData.submergeTimer = 1.5;
                unit.stasis = 1.5;
            }
        } else {
            unit.passiveState.customData.submergeTimer -= dt;
            if (unit.passiveState.customData.submergeTimer <= 0 && combatState) {
                unit.passiveState.customData.submergeActive = false;
                unit.stasis = 0;
                var levEnemies = unit.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
                var adjTargets = getUnitsInRadius(unit.gridRow, unit.gridCol, 1, levEnemies);
                for (var j = 0; j < adjTargets.length; j++) {
                    dealDamage(unit, adjTargets[j], Math.floor(unit.attack * 1.20), {isAbility: true, triggerOnHit: false});
                    addStatus(adjTargets[j], 'slow', 4, 0.25, unit);
                }
            }
        }
        break;

    // Standing still regen for Ancient Treant
    case 'ancient_treant':
        if (unit.passiveState.customData.standingStillRegen) {
            var isStill = (unit.gridRow === unit.passiveState.customData.lastMoveRow && unit.gridCol === unit.passiveState.customData.lastMoveCol);
            if (isStill && unit.hp < unit.maxHp) {
                var regenAmt = Math.floor(unit.maxHp * unit.passiveState.customData.standingStillRegen * dt);
                if (regenAmt > 0) dealHealing(unit, unit, regenAmt);
            }
            unit.passiveState.customData.lastMoveRow = unit.gridRow;
            unit.passiveState.customData.lastMoveCol = unit.gridCol;
        }
        break;

    // ===== T3 EVOLVED periodic =====
    case 'ninetail_blaze':
        // Fire trail lasts 4s, deals 30 DPS, applies Burn
        if (!unit.passiveState.customData.foxfireTrail) unit.passiveState.customData.foxfireTrail = [];
        if (!unit.passiveState.customData.foxfireTimer) unit.passiveState.customData.foxfireTimer = 0;
        unit.passiveState.customData.foxfireTimer += dt;
        if (unit.passiveState.customData.foxfireTimer >= 0.3) {
            unit.passiveState.customData.foxfireTimer -= 0.3;
            var nbTrail = unit.passiveState.customData.foxfireTrail;
            var nbLast = nbTrail.length > 0 ? nbTrail[nbTrail.length - 1] : null;
            if (!nbLast || nbLast.row !== unit.gridRow || nbLast.col !== unit.gridCol) {
                if (nbTrail.length >= 15) nbTrail.shift();
                nbTrail.push({row: unit.gridRow, col: unit.gridCol, timer: 4});
            }
        }
        if (combatState) {
            var nbEnemies = unit.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
            var nbFTrail = unit.passiveState.customData.foxfireTrail;
            for (var ti = nbFTrail.length - 1; ti >= 0; ti--) {
                nbFTrail[ti].timer -= dt;
                if (nbFTrail[ti].timer <= 0) { nbFTrail.splice(ti, 1); continue; }
                for (var ei = 0; ei < nbEnemies.length; ei++) {
                    if (nbEnemies[ei].hp > 0 && nbEnemies[ei].gridRow === nbFTrail[ti].row && nbEnemies[ei].gridCol === nbFTrail[ti].col) {
                        dealDamage(unit, nbEnemies[ei], Math.floor(30 * dt), {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
                        addStatus(nbEnemies[ei], 'burn', 2, 10, unit);
                    }
                }
            }
        }
        break;

    case 'plasma_core':
        // Orbs last 8s, deal 25 DPS, +18% vulnerability
        if (!unit.passiveState.customData.orbs) unit.passiveState.customData.orbs = [];
        if (!unit.passiveState.customData.orbSpawnTimer) unit.passiveState.customData.orbSpawnTimer = 0;
        unit.passiveState.customData.orbSpawnTimer += dt;
        if (unit.passiveState.customData.orbSpawnTimer >= 1.5 && unit.passiveState.customData.orbs.length < 3) {
            unit.passiveState.customData.orbSpawnTimer -= 1.5;
            unit.passiveState.customData.orbs.push({row: unit.gridRow, col: unit.gridCol, timer: 8, radius: 2, dps: 25});
        }
        if (combatState) {
            var pcEnemies = unit.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
            var pcOrbs = unit.passiveState.customData.orbs;
            for (var oi = pcOrbs.length - 1; oi >= 0; oi--) {
                pcOrbs[oi].timer -= dt;
                if (pcOrbs[oi].timer <= 0) { pcOrbs.splice(oi, 1); continue; }
                var pcOrbTargets = getUnitsInRadius(pcOrbs[oi].row, pcOrbs[oi].col, pcOrbs[oi].radius, pcEnemies);
                for (var ej = 0; ej < pcOrbTargets.length; ej++) {
                    dealDamage(unit, pcOrbTargets[ej], Math.floor(pcOrbs[oi].dps * dt), {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
                    addStatus(pcOrbTargets[ej], 'vulnerability', 1.5, 0.18, unit);
                }
            }
        }
        break;

    case 'abyssal_terror':
        // Ink cloud every 10s, 3-cell radius, 35% miss chance 3s
        if (!unit.passiveTimers['abyssal_ink']) unit.passiveTimers['abyssal_ink'] = 0;
        unit.passiveTimers['abyssal_ink'] += dt;
        if (unit.passiveTimers['abyssal_ink'] >= 10 && combatState) {
            unit.passiveTimers['abyssal_ink'] -= 10;
            var atEnemies = unit.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
            var atTargets = getUnitsInRadius(unit.gridRow, unit.gridCol, 3, atEnemies);
            for (var j = 0; j < atTargets.length; j++) {
                addStatus(atTargets[j], 'slow', 3, 0.10, unit);
            }
        }
        break;

    case 'primordial_leviathan':
        // Submerge every 7s for 2.5s
        if (!unit.passiveTimers['plev_sub']) unit.passiveTimers['plev_sub'] = 0;
        if (!unit.passiveState.customData.submergeActive) {
            unit.passiveTimers['plev_sub'] += dt;
            if (unit.passiveTimers['plev_sub'] >= 7) {
                unit.passiveTimers['plev_sub'] = 0;
                unit.passiveState.customData.submergeActive = true;
                unit.passiveState.customData.submergeTimer = 2.5;
                unit.stasis = 2.5;
            }
        } else {
            unit.passiveState.customData.submergeTimer -= dt;
            if (unit.passiveState.customData.submergeTimer <= 0 && combatState) {
                unit.passiveState.customData.submergeActive = false;
                unit.stasis = 0;
                var plevEnemies = unit.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
                var plevTargets = getUnitsInRadius(unit.gridRow, unit.gridCol, 2, plevEnemies);
                for (var j = 0; j < plevTargets.length; j++) {
                    dealDamage(unit, plevTargets[j], Math.floor(unit.attack * 1.20), {isAbility: true, triggerOnHit: false});
                    addStatus(plevTargets[j], 'slow', 4, 0.25, unit);
                }
            }
        }
        break;

    // World Sentinel standing still regen
    case 'world_sentinel':
        if (unit.passiveState.customData.standingStillRegen) {
            var wsStill = (unit.gridRow === unit.passiveState.customData.lastMoveRow && unit.gridCol === unit.passiveState.customData.lastMoveCol);
            if (wsStill && unit.hp < unit.maxHp) {
                var wsRegen = Math.floor(unit.maxHp * unit.passiveState.customData.standingStillRegen * dt);
                if (wsRegen > 0) dealHealing(unit, unit, wsRegen);
            }
            unit.passiveState.customData.lastMoveRow = unit.gridRow;
            unit.passiveState.customData.lastMoveCol = unit.gridCol;
        }
        break;

    // Teleport cooldown decrements for Void Wyrm / Dimensional Dragon
    case 'void_wyrm':
    case 'dimensional_dragon':
        if (unit.passiveState.customData.teleportCooldowns) {
            var cdKeys = Object.keys(unit.passiveState.customData.teleportCooldowns);
            for (var ci = 0; ci < cdKeys.length; ci++) {
                unit.passiveState.customData.teleportCooldowns[cdKeys[ci]] -= dt;
            }
        }
        break;
    }
}

function processAuraPassive(unit, passiveData, allUnits) {
    var key = unit.templateKey;
    var allies = [];
    var enemies = [];
    for (var i = 0; i < allUnits.length; i++) {
        if (allUnits[i].side === unit.side && allUnits[i].hp > 0) allies.push(allUnits[i]);
        else if (allUnits[i].hp > 0) enemies.push(allUnits[i]);
    }

    switch (key) {
    // T1 base
    case 'stone_guard':
        // Gain 4% DR per ally within 2.5 cells (max 20%)
        var nearbyAllies = getUnitsInRadius(unit.gridRow, unit.gridCol, 2.5, allies);
        var drBonus = Math.min((nearbyAllies.length - 1) * 0.04, 0.20); // exclude self
        if (drBonus < 0) drBonus = 0;
        addStatus(unit, 'drMod', 0.2, drBonus, unit);
        break;

    case 'wind_archer':
        // Gain 6% ATK speed per Wind ally on team
        var windCount = 0;
        for (var j = 0; j < allies.length; j++) {
            if (allies[j] !== unit && allies[j].element === 'wind') windCount++;
        }
        if (windCount > 0) {
            addStatus(unit, 'spdMod', 0.2, windCount * 0.06, unit);
        }
        break;

    case 'iron_soldier':
        // Gain 6% DR per Force ally
        var forceCount = 0;
        for (var j = 0; j < allies.length; j++) {
            if (allies[j] !== unit && allies[j].element === 'force') forceCount++;
        }
        if (forceCount > 0) {
            addStatus(unit, 'drMod', 0.2, forceCount * 0.06, unit);
        }
        break;

    // T1 evolved
    case 'mountain_lord':
        // Gain 5% DR per ally (max 25%)
        var nearbyAllies2 = getUnitsInRadius(unit.gridRow, unit.gridCol, 2.5, allies);
        var drBonus2 = Math.min((nearbyAllies2.length - 1) * 0.05, 0.25);
        if (drBonus2 < 0) drBonus2 = 0;
        addStatus(unit, 'drMod', 0.2, drBonus2, unit);
        break;

    case 'gale_sniper':
        // Gain 8% ATK speed per Wind ally + pierce grants dodge
        var windCount2 = 0;
        for (var j = 0; j < allies.length; j++) {
            if (allies[j] !== unit && allies[j].element === 'wind') windCount2++;
        }
        if (windCount2 > 0) {
            addStatus(unit, 'spdMod', 0.2, windCount2 * 0.08, unit);
        }
        addStatus(unit, 'dodgeBuff', 0.2, 0.20, unit);
        break;

    case 'legionnaire':
        // Gain 8% DR per Force ally
        var forceCount2 = 0;
        for (var j = 0; j < allies.length; j++) {
            if (allies[j] !== unit && allies[j].element === 'force') forceCount2++;
        }
        if (forceCount2 > 0) {
            addStatus(unit, 'drMod', 0.2, forceCount2 * 0.08, unit);
        }
        break;

    // T2 base
    case 'coral_priest':
        // Allies within 2.5 cells heal 0.8% max HP/s (applies per tick)
        var nearbyForHeal = getUnitsInRadius(unit.gridRow, unit.gridCol, 2.5, allies);
        for (var j = 0; j < nearbyForHeal.length; j++) {
            if (nearbyForHeal[j] !== unit && nearbyForHeal[j].hp < nearbyForHeal[j].maxHp) {
                var tickHeal = Math.floor(nearbyForHeal[j].maxHp * 0.008 * 0.1); // 0.1s tick
                if (tickHeal > 0) dealHealing(unit, nearbyForHeal[j], tickHeal);
            }
        }
        break;

    case 'sky_knight':
        // Allies within 2.5 cells gain 6% damage bonus
        var nearbyForDmg = getUnitsInRadius(unit.gridRow, unit.gridCol, 2.5, allies);
        for (var j = 0; j < nearbyForDmg.length; j++) {
            if (nearbyForDmg[j] !== unit) {
                addStatus(nearbyForDmg[j], 'atkBuff', 0.2, 0.06, unit);
            }
        }
        break;

    case 'shield_bearer':
        // Nearby allies gain 5% DR and start with Shield 10% max HP
        var nearbyForShield = getUnitsInRadius(unit.gridRow, unit.gridCol, 2.5, allies);
        for (var j = 0; j < nearbyForShield.length; j++) {
            if (nearbyForShield[j] !== unit) {
                addStatus(nearbyForShield[j], 'drMod', 0.2, 0.05, unit);
            }
        }
        break;

    // T2 evolved
    case 'ocean_sage':
        // Allies within 2.5 cells heal 1.2% max HP/s, enemies slowed 15%
        var nearbyForHeal2 = getUnitsInRadius(unit.gridRow, unit.gridCol, 2.5, allies);
        for (var j = 0; j < nearbyForHeal2.length; j++) {
            if (nearbyForHeal2[j] !== unit && nearbyForHeal2[j].hp < nearbyForHeal2[j].maxHp) {
                var tickHeal2 = Math.floor(nearbyForHeal2[j].maxHp * 0.012 * 0.1);
                if (tickHeal2 > 0) dealHealing(unit, nearbyForHeal2[j], tickHeal2);
            }
        }
        var nearbyEnemies = getUnitsInRadius(unit.gridRow, unit.gridCol, 2.5, enemies);
        for (var j = 0; j < nearbyEnemies.length; j++) {
            addStatus(nearbyEnemies[j], 'slow', 0.2, 0.15, unit);
        }
        break;

    case 'aegis_paladin':
        // Allies within 3 cells gain 8% damage + 5% DR
        var nearbyForBuff = getUnitsInRadius(unit.gridRow, unit.gridCol, 3, allies);
        for (var j = 0; j < nearbyForBuff.length; j++) {
            if (nearbyForBuff[j] !== unit) {
                addStatus(nearbyForBuff[j], 'atkBuff', 0.2, 0.08, unit);
                addStatus(nearbyForBuff[j], 'drMod', 0.2, 0.05, unit);
            }
        }
        break;

    case 'bastion':
        // Nearby allies gain 5% DR + 12% starting shield
        var nearbyForShield2 = getUnitsInRadius(unit.gridRow, unit.gridCol, 2.5, allies);
        for (var j = 0; j < nearbyForShield2.length; j++) {
            if (nearbyForShield2[j] !== unit) {
                addStatus(nearbyForShield2[j], 'drMod', 0.2, 0.05, unit);
            }
        }
        break;

    // ===== T3 BASE aura =====
    case 'fire_dragon':
        // Enemies within 2 cells take 20 fire DPS
        var fdEnemies = getUnitsInRadius(unit.gridRow, unit.gridCol, 2, enemies);
        for (var j = 0; j < fdEnemies.length; j++) {
            dealDamage(unit, fdEnemies[j], Math.floor(20 * 0.1), {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
        }
        break;

    // ===== T3 EVOLVED aura =====
    case 'elder_wyrm':
        // Enemies within 3 cells take 35 DPS
        var ewEnemies = getUnitsInRadius(unit.gridRow, unit.gridCol, 3, enemies);
        for (var j = 0; j < ewEnemies.length; j++) {
            dealDamage(unit, ewEnemies[j], Math.floor(35 * 0.1), {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
        }
        break;

    // ===== T5 BASE aura =====
    case 'phoenix':
        // Fire allies gain 15% ATK and 8% lifesteal
        var phFireAllies = getAlliesOfElement(unit, 'fire');
        var phAtkBonus = 0.15;
        var phLifesteal = 0.08;
        if (unit.passiveState.customData.doubleAuraTimer && unit.passiveState.customData.doubleAuraTimer > 0) {
            phAtkBonus = 0.30;
            phLifesteal = 0.16;
        }
        for (var j = 0; j < phFireAllies.length; j++) {
            addStatus(phFireAllies[j], 'atkBuff', 0.2, phAtkBonus, unit);
        }
        break;

    case 'world_tree':
        // All allies heal 1.2% max HP/sec passively
        for (var j = 0; j < allies.length; j++) {
            if (allies[j].hp > 0 && allies[j].hp < allies[j].maxHp) {
                var wtHeal = Math.floor(allies[j].maxHp * 0.012 * 0.1);
                if (wtHeal > 0) dealHealing(unit, allies[j], wtHeal);
            }
        }
        break;

    case 'storm_dragon':
        // All Lightning allies gain +18% crit chance
        var sdLightningAllies = getAlliesOfElement(unit, 'lightning');
        for (var j = 0; j < sdLightningAllies.length; j++) {
            addStatus(sdLightningAllies[j], 'critBuff', 0.2, 0.18, unit);
        }
        break;

    // ===== T5 EVOLVED aura =====
    case 'eternal_phoenix':
        // Fire allies gain 20% ATK and 12% lifesteal, doubled on revival
        var epFireAllies = getAlliesOfElement(unit, 'fire');
        var epAtkBonus = 0.20;
        var epLifesteal = 0.12;
        if (unit.passiveState.customData.doubleAuraTimer && unit.passiveState.customData.doubleAuraTimer > 0) {
            epAtkBonus = 0.30;
            epLifesteal = 0.16;
        }
        for (var j = 0; j < epFireAllies.length; j++) {
            addStatus(epFireAllies[j], 'atkBuff', 0.2, epAtkBonus, unit);
        }
        break;

    case 'yggdrasil':
        // All allies heal 1.8% max HP/sec
        for (var j = 0; j < allies.length; j++) {
            if (allies[j].hp > 0 && allies[j].hp < allies[j].maxHp) {
                var yggHeal = Math.floor(allies[j].maxHp * 0.018 * 0.1);
                if (yggHeal > 0) dealHealing(unit, allies[j], yggHeal);
            }
        }
        break;

    case 'thunder_god':
        // All Lightning allies gain +25% crit chance
        var tgLightningAllies = getAlliesOfElement(unit, 'lightning');
        for (var j = 0; j < tgLightningAllies.length; j++) {
            addStatus(tgLightningAllies[j], 'critBuff', 0.2, 0.25, unit);
        }
        break;
    }
}

// ---- Ability Execution ----

function executeAbility(caster) {
    if (!caster || caster.hp <= 0 || !combatState) return;

    var key = caster.templateKey;
    var enemies = caster.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
    var allies = caster.side === 'player' ? combatState.playerUnits : combatState.enemyUnits;
    var grid = combatState.grid;
    var target = caster.target;
    var atk = caster.attack;

    // Apply ATK buff and debuff for ability damage scaling (multiplicative)
    var atkBuffVal = getStatusValue(caster, 'atkBuff');
    var atkModVal = getStatusValue(caster, 'atkMod');
    if (atkBuffVal !== 0 || atkModVal !== 0) atk = Math.floor(atk * (1 + atkBuffVal) * (1 + atkModVal));
    // Apply nextAtkMult if set (Zephyr Scout)
    if (caster.abilityBuffs && caster.abilityBuffs.nextAtkMult) {
        atk = Math.floor(atk * caster.abilityBuffs.nextAtkMult);
        delete caster.abilityBuffs.nextAtkMult;
    }

    // Track cast
    if (caster.combatStats) caster.combatStats.abilityCasts++;

    switch (key) {

    // ===== FIRE T1 =====

    case 'flame_warrior':
        // Slash forward in cone: damage target + adjacent cells
        if (target && target.hp > 0) {
            var fwTargets = getUnitsInRadius(target.gridRow, target.gridCol, 1, enemies);
            if (typeof flashAbilityCells === 'function') {
                var fwCells = [];
                for (var fwi = 0; fwi < fwTargets.length; fwi++) {
                    fwCells.push({row: fwTargets[fwi].gridRow, col: fwTargets[fwi].gridCol});
                }
                flashAbilityCells(fwCells, '#FF6B00', 300);
            }
            for (var i = 0; i < fwTargets.length; i++) {
                dealDamage(caster, fwTargets[i], Math.floor(atk * 1.5), {isAbility:true, triggerOnHit:false});
                addStatus(fwTargets[i], 'burn', 3, 15, caster);
            }
        }
        break;

    case 'ember_scout':
        // Dash behind target, damage, burn, on kill refund 30 mana
        var esTarget = getFurthestEnemy(caster, enemies);
        if (esTarget) {
            var esEmpty = findEmptyCellNear(esTarget.gridRow, esTarget.gridCol, grid);
            if (esEmpty) moveUnitToCell(caster, esEmpty.row, esEmpty.col, grid);
            var esResult = dealDamage(caster, esTarget, Math.floor(atk * 2.0), {isAbility:true, triggerOnHit:false});
            addStatus(esTarget, 'burn', 3, 10, caster);
            if (esResult.killed) {
                caster.currentMana = Math.min(caster.maxMana, caster.currentMana + 30);
                processOnKillPassive(caster, esTarget, combatState.allUnits);
            }
        }
        break;

    case 'cinder_archer':
        // Empower next auto-attack with 180% ATK bonus + burn
        caster.abilityBuffs = caster.abilityBuffs || {};
        caster.abilityBuffs.empoweredShot = true;
        caster.abilityBuffs.empoweredShotMult = 1.80;
        caster.abilityBuffs.empoweredShotBurn = {dps: 15, duration: 3};
        break;

    case 'fire_acolyte':
        // Heal lowest-HP ally, if below 35% HP heal more, burn nearest enemy
        var faAllies = getLowestHpUnits(allies, 1);
        if (faAllies.length > 0) {
            var faTarget = faAllies[0];
            var faHealMult = (faTarget.hp / faTarget.maxHp < 0.35) ? 2.20 : 1.40;
            dealHealing(caster, faTarget, Math.floor(atk * faHealMult));
            if (typeof flashAbilityCells === 'function') {
                flashAbilityCells([{row: faTarget.gridRow, col: faTarget.gridCol}], '#44ee44', 300);
            }
            // Burn nearest enemy to healed unit
            var faNearestEnemy = null;
            var faNearestDist = 999;
            for (var j = 0; j < enemies.length; j++) {
                if (enemies[j].hp > 0) {
                    var fd = getManhattanDist(faTarget.gridRow, faTarget.gridCol, enemies[j].gridRow, enemies[j].gridCol);
                    if (fd < faNearestDist) { faNearestDist = fd; faNearestEnemy = enemies[j]; }
                }
            }
            if (faNearestEnemy) {
                addStatus(faNearestEnemy, 'burn', 2, 8, caster);
                if (typeof flashAbilityCells === 'function') {
                    flashAbilityCells([{row: faNearestEnemy.gridRow, col: faNearestEnemy.gridCol}], '#FF6B00', 300);
                }
            }
        }
        break;

    // ===== WATER T1 =====

    case 'tide_hunter':
        // Slash in cone: damage target + adjacent, apply slow
        if (target && target.hp > 0) {
            var thTargets = getUnitsInRadius(target.gridRow, target.gridCol, 1, enemies);
            if (typeof flashAbilityCells === 'function') {
                var thCells = [];
                for (var thi = 0; thi < thTargets.length; thi++) {
                    thCells.push({row: thTargets[thi].gridRow, col: thTargets[thi].gridCol});
                }
                flashAbilityCells(thCells, '#4488ff', 300);
            }
            for (var i = 0; i < thTargets.length; i++) {
                dealDamage(caster, thTargets[i], Math.floor(atk * 1.60), {isAbility:true, triggerOnHit:false});
                addStatus(thTargets[i], 'slow', 3, 0.15, caster);
            }
        }
        break;

    case 'frost_archer':
        // Shoot freeze projectile at target
        if (target && target.hp > 0) {
            dealDamage(caster, target, Math.floor(atk * 1.70), {isAbility:true, triggerOnHit:false});
            addStatus(target, 'slow', 3, 0.20, caster);
            addStatus(target, 'vulnerability', 4, 0.15, caster);
            if (typeof flashAbilityCells === 'function') {
                flashAbilityCells([{row: target.gridRow, col: target.gridCol}], '#4488ff', 300);
            }
        }
        break;

    case 'reef_stalker':
        // Teleport behind target, bonus damage if target is slowed
        var rsTarget = getFurthestEnemy(caster, enemies);
        if (rsTarget) {
            var rsEmpty = findEmptyCellNear(rsTarget.gridRow, rsTarget.gridCol, grid);
            if (rsEmpty) moveUnitToCell(caster, rsEmpty.row, rsEmpty.col, grid);
            var rsMult = hasStatus(rsTarget, 'slow') ? 2.80 : 2.20;
            dealDamage(caster, rsTarget, Math.floor(atk * rsMult), {isAbility:true, triggerOnHit:false});
            if (hasStatus(rsTarget, 'slow')) {
                caster.attackCooldown = 0; // reset dash cooldown
            }
        }
        break;

    // ===== EARTH T1 =====

    case 'stone_guard':
        // Shield self 28% max HP, shield nearby allies 15% max HP
        grantShield(caster, caster, Math.floor(caster.maxHp * 0.28));
        var sgAllies = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, allies);
        for (var i = 0; i < sgAllies.length; i++) {
            if (sgAllies[i] !== caster && sgAllies[i].hp > 0) {
                grantShield(caster, sgAllies[i], Math.floor(sgAllies[i].maxHp * 0.15));
            }
        }
        break;

    case 'bramble_knight':
        // Slash nearby enemies, stun 1s, shield self + nearby allies
        var bkEnemies = getUnitsInRadius(caster.gridRow, caster.gridCol, 1, enemies);
        for (var i = 0; i < bkEnemies.length; i++) {
            dealDamage(caster, bkEnemies[i], Math.floor(atk * 1.40), {isAbility:true, triggerOnHit:false});
            addStatus(bkEnemies[i], 'stun', 1, 0, caster);
        }
        grantShield(caster, caster, Math.floor(caster.maxHp * 0.18));
        var bkAllies = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, allies);
        for (var i = 0; i < bkAllies.length; i++) {
            if (bkAllies[i] !== caster && bkAllies[i].hp > 0) {
                grantShield(caster, bkAllies[i], Math.floor(bkAllies[i].maxHp * 0.10));
            }
        }
        break;

    case 'seedling_archer':
        // Shoot dealing 160% ATK, root target 1.5s, gain ATK per rooted enemy
        if (target && target.hp > 0) {
            dealDamage(caster, target, Math.floor(atk * 1.60), {isAbility:true, triggerOnHit:false});
            addStatus(target, 'root', 1.5, 0, caster);
            // Count rooted enemies for ATK buff
            var rootedCount = 0;
            for (var j = 0; j < enemies.length; j++) {
                if (enemies[j].hp > 0 && hasStatus(enemies[j], 'root')) rootedCount++;
            }
            if (rootedCount > 0) {
                addStatus(caster, 'atkBuff', 4, rootedCount * 0.15, caster);
            }
        }
        break;

    // ===== WIND T1 =====

    case 'zephyr_scout':
        // Dash to target dealing 210% ATK, grant self 25% dodge 3s
        if (target && target.hp > 0) {
            var zsEmpty = findEmptyCellNear(target.gridRow, target.gridCol, grid);
            if (zsEmpty) moveUnitToCell(caster, zsEmpty.row, zsEmpty.col, grid);
            dealDamage(caster, target, Math.floor(atk * 2.10), {isAbility:true, triggerOnHit:false});
            addStatus(caster, 'dodgeBuff', 3, 0.25, caster);
        }
        break;

    case 'wind_archer':
        // Pierce through enemies in line, grant ATK speed
        if (target && target.hp > 0) {
            var waDir = {
                dr: target.gridRow > caster.gridRow ? 1 : (target.gridRow < caster.gridRow ? -1 : 0),
                dc: target.gridCol > caster.gridCol ? 1 : (target.gridCol < caster.gridCol ? -1 : 0)
            };
            var waHitTargets = [];
            for (var step = 1; step <= 7; step++) {
                var wr = caster.gridRow + waDir.dr * step;
                var wc = caster.gridCol + waDir.dc * step;
                if (wr >= 0 && wr < 8 && wc >= 0 && wc < 7 && grid[wr] && grid[wr][wc]) {
                    var wUnit = grid[wr][wc];
                    if (wUnit.hp > 0 && wUnit.side !== caster.side && waHitTargets.indexOf(wUnit) < 0) {
                        waHitTargets.push(wUnit);
                    }
                }
            }
            for (var i = 0; i < waHitTargets.length; i++) {
                dealDamage(caster, waHitTargets[i], Math.floor(atk * 1.70), {isAbility:true, triggerOnHit:false});
            }
            addStatus(caster, 'spdMod', 4, 0.18, caster);
        }
        break;

    case 'gale_dancer':
        // Heal 2 lowest-HP allies 140% ATK, grant ATK speed
        var gdAllies = getLowestHpUnits(allies, 2);
        if (typeof flashAbilityCells === 'function') {
            var gdCells = [];
            for (var gdi = 0; gdi < gdAllies.length; gdi++) {
                gdCells.push({row: gdAllies[gdi].gridRow, col: gdAllies[gdi].gridCol});
            }
            flashAbilityCells(gdCells, '#44ee44', 300);
        }
        for (var i = 0; i < gdAllies.length; i++) {
            dealHealing(caster, gdAllies[i], Math.floor(atk * 1.40));
            addStatus(gdAllies[i], 'spdMod', 4, 0.12, caster);
        }
        break;

    case 'wind_squire':
        // Slash nearby enemies, grant self + allies move speed
        var wsEnemies = getUnitsInRadius(caster.gridRow, caster.gridCol, 1, enemies);
        for (var i = 0; i < wsEnemies.length; i++) {
            dealDamage(caster, wsEnemies[i], Math.floor(atk * 1.40), {isAbility:true, triggerOnHit:false});
        }
        var wsAllies = getUnitsInRadius(caster.gridRow, caster.gridCol, 2.5, allies);
        for (var i = 0; i < wsAllies.length; i++) {
            addStatus(wsAllies[i], 'moveSpeedBuff', 4, 0.15, caster);
        }
        break;

    // ===== LIGHTNING T1 =====

    case 'spark_fencer':
        // Slash with arc: target + adjacent, chain bonus near Lightning units
        if (target && target.hp > 0) {
            var sfTargets = getUnitsInRadius(target.gridRow, target.gridCol, 1, enemies);
            var sfHasLightning = false;
            for (var j = 0; j < allies.length; j++) {
                if (allies[j] !== caster && allies[j].hp > 0 && allies[j].element === 'lightning') {
                    var sfDist = getManhattanDist(caster.gridRow, caster.gridCol, allies[j].gridRow, allies[j].gridCol);
                    if (sfDist <= 3) { sfHasLightning = true; break; }
                }
            }
            var sfMult = sfHasLightning ? 1.50 * 1.18 : 1.50;
            for (var i = 0; i < sfTargets.length; i++) {
                dealDamage(caster, sfTargets[i], Math.floor(atk * sfMult), {isAbility:true, triggerOnHit:false});
            }
            if (sfHasLightning) {
                // Chain 60 flat damage to 1 nearby enemy
                for (var j = 0; j < enemies.length; j++) {
                    if (enemies[j].hp > 0 && sfTargets.indexOf(enemies[j]) < 0) {
                        var sfcd = getManhattanDist(target.gridRow, target.gridCol, enemies[j].gridRow, enemies[j].gridCol);
                        if (sfcd <= 2) {
                            dealDamage(caster, enemies[j], 60, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
                            break;
                        }
                    }
                }
            }
            if (typeof flashAbilityCells === 'function') {
                var sfCells = [];
                for (var sfi = 0; sfi < sfTargets.length; sfi++) {
                    sfCells.push({row: sfTargets[sfi].gridRow, col: sfTargets[sfi].gridCol});
                }
                flashAbilityCells(sfCells, '#FFFF00', 300);
            }
        }
        break;

    case 'volt_runner':
        // Dash through target dealing 210% ATK, crit buff
        if (target && target.hp > 0) {
            var vrEmpty = findEmptyCellNear(target.gridRow, target.gridCol, grid);
            if (vrEmpty) moveUnitToCell(caster, vrEmpty.row, vrEmpty.col, grid);
            var vrResult = dealDamage(caster, target, Math.floor(atk * 2.10), {isAbility:true, canCrit:true, triggerOnHit:false});
            if (vrResult.wasCrit) {
                caster.attackCooldown = 0; // reset dash cooldown on crit
            }
            addStatus(caster, 'critBuff', 2, 0.20, caster);
        }
        break;

    case 'thunder_archer':
        // Lightning arrow chains to enemies
        if (target && target.hp > 0) {
            dealDamage(caster, target, Math.floor(atk * 1.70), {isAbility:true, triggerOnHit:false});
            // Chain to nearby enemies within 3 cells
            var taChained = [target];
            var taLast = target;
            for (var bounce = 0; bounce < 2; bounce++) {
                var taBest = null, taBestDist = 999;
                for (var j = 0; j < enemies.length; j++) {
                    if (enemies[j].hp > 0 && taChained.indexOf(enemies[j]) < 0) {
                        var tad = getManhattanDist(taLast.gridRow, taLast.gridCol, enemies[j].gridRow, enemies[j].gridCol);
                        if (tad <= 3 && tad < taBestDist) { taBestDist = tad; taBest = enemies[j]; }
                    }
                }
                if (taBest) {
                    dealDamage(caster, taBest, Math.floor(atk * 1.70 * 0.6), {isAbility:true, triggerOnHit:false});
                    taChained.push(taBest);
                    taLast = taBest;
                }
            }
            if (typeof flashAbilityCells === 'function') {
                var taCells = [];
                for (var tai = 0; tai < taChained.length; tai++) {
                    taCells.push({row: taChained[tai].gridRow, col: taChained[tai].gridCol});
                }
                flashAbilityCells(taCells, '#FFFF00', 300);
            }
        }
        break;

    case 'pulse_mender':
        // Heal lowest-HP ally + chain heal + crit buff
        var pmAllies = getLowestHpUnits(allies, 1);
        if (pmAllies.length > 0) {
            dealHealing(caster, pmAllies[0], Math.floor(atk * 1.45));
            addStatus(pmAllies[0], 'critBuff', 3, 0.08, caster);
            // Chain heal to 1 nearby ally
            var pmNearby = getUnitsInRadius(pmAllies[0].gridRow, pmAllies[0].gridCol, 2, allies);
            for (var j = 0; j < pmNearby.length; j++) {
                if (pmNearby[j] !== pmAllies[0] && pmNearby[j].hp > 0 && pmNearby[j].hp < pmNearby[j].maxHp) {
                    dealHealing(caster, pmNearby[j], Math.floor(atk * 0.80));
                    addStatus(pmNearby[j], 'critBuff', 3, 0.08, caster);
                    break;
                }
            }
        }
        break;

    // ===== FORCE T1 =====

    case 'iron_soldier':
        // Punch dealing 160% ATK, grant nearby allies ATK buff
        if (target && target.hp > 0) {
            dealDamage(caster, target, Math.floor(atk * 1.60), {isAbility:true, triggerOnHit:false});
        }
        var isAllies = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, allies);
        for (var i = 0; i < isAllies.length; i++) {
            if (isAllies[i] !== caster && isAllies[i].hp > 0) {
                addStatus(isAllies[i], 'atkBuff', 3, 0.12, caster);
            }
        }
        break;

    case 'shadow_blade':
        // Dash to target, guaranteed crit below 40% HP
        if (target && target.hp > 0) {
            var sbEmpty = findEmptyCellNear(target.gridRow, target.gridCol, grid);
            if (sbEmpty) moveUnitToCell(caster, sbEmpty.row, sbEmpty.col, grid);
            var sbMult = (caster.hp / caster.maxHp < 0.40) ? 3.40 : 2.20;
            dealDamage(caster, target, Math.floor(atk * sbMult), {isAbility:true, triggerOnHit:false});
        }
        break;

    case 'steel_archer':
        // Pierce all enemies in line dealing 170% ATK, apply DR reduction
        if (target && target.hp > 0) {
            var stDir = {
                dr: target.gridRow > caster.gridRow ? 1 : (target.gridRow < caster.gridRow ? -1 : 0),
                dc: target.gridCol > caster.gridCol ? 1 : (target.gridCol < caster.gridCol ? -1 : 0)
            };
            var stHitTargets = [];
            for (var step = 1; step <= 7; step++) {
                var sr = caster.gridRow + stDir.dr * step;
                var sc = caster.gridCol + stDir.dc * step;
                if (sr >= 0 && sr < 8 && sc >= 0 && sc < 7 && grid[sr] && grid[sr][sc]) {
                    var sUnit = grid[sr][sc];
                    if (sUnit.hp > 0 && sUnit.side !== caster.side && stHitTargets.indexOf(sUnit) < 0) {
                        stHitTargets.push(sUnit);
                    }
                }
            }
            for (var i = 0; i < stHitTargets.length; i++) {
                dealDamage(caster, stHitTargets[i], Math.floor(atk * 1.70), {isAbility:true, triggerOnHit:false});
                addStatus(stHitTargets[i], 'vulnerability', 4, 0.18, caster);
            }
        }
        break;

    // ===== FIRE T1 EVOLVED =====

    case 'fire_berserker':
        // Enhanced flame_warrior: 200% ATK, Burn 25 DPS 4s
        if (target && target.hp > 0) {
            var fbTargets = getUnitsInRadius(target.gridRow, target.gridCol, 1, enemies);
            if (typeof flashAbilityCells === 'function') {
                var fbCells = [];
                for (var fbi = 0; fbi < fbTargets.length; fbi++) {
                    fbCells.push({row: fbTargets[fbi].gridRow, col: fbTargets[fbi].gridCol});
                }
                flashAbilityCells(fbCells, '#FF6B00', 400);
            }
            for (var i = 0; i < fbTargets.length; i++) {
                dealDamage(caster, fbTargets[i], Math.floor(atk * 2.00), {isAbility:true, triggerOnHit:false});
                addStatus(fbTargets[i], 'burn', 4, 25, caster);
            }
        }
        break;

    case 'flame_rogue':
        // Enhanced ember_scout: 250% ATK, fire trail, 40 mana refund on kill
        var frTarget = getFurthestEnemy(caster, enemies);
        if (frTarget) {
            var frOldRow = caster.gridRow, frOldCol = caster.gridCol;
            var frEmpty = findEmptyCellNear(frTarget.gridRow, frTarget.gridCol, grid);
            if (frEmpty) moveUnitToCell(caster, frEmpty.row, frEmpty.col, grid);
            var frResult = dealDamage(caster, frTarget, Math.floor(atk * 2.50), {isAbility:true, triggerOnHit:false});
            // Fire trail at start position
            var frTrailTargets = getUnitsInRadius(frOldRow, frOldCol, 1, enemies);
            for (var i = 0; i < frTrailTargets.length; i++) {
                addStatus(frTrailTargets[i], 'burn', 3, 25, caster);
            }
            if (frResult.killed) {
                caster.currentMana = Math.min(caster.maxMana, caster.currentMana + 40);
                processOnKillPassive(caster, frTarget, combatState.allUnits);
            }
        }
        break;

    case 'cinder_marksman':
        // Enhanced cinder_archer: Fire 2 arrows 120% ATK each, burn, bonus to burning
        var cmTargets = [];
        if (target && target.hp > 0) cmTargets.push(target);
        // Find second target
        for (var j = 0; j < enemies.length; j++) {
            if (enemies[j].hp > 0 && enemies[j] !== target && cmTargets.length < 2) {
                cmTargets.push(enemies[j]);
            }
        }
        for (var i = 0; i < cmTargets.length; i++) {
            dealDamage(caster, cmTargets[i], Math.floor(atk * 1.20), {isAbility:true, triggerOnHit:false});
            addStatus(cmTargets[i], 'burn', 3, 15, caster);
        }
        // Grant passive 20% bonus damage to burning targets for 4s
        caster.abilityBuffs = caster.abilityBuffs || {};
        caster.abilityBuffs.burningBonusDmg = 0.20;
        caster.abilityBuffs.burningBonusDuration = 4;
        break;

    case 'ember_saint':
        // Enhanced fire_acolyte: Heal 160% ATK, grant +15% ATK, burn enemy
        var esaAllies = getLowestHpUnits(allies, 1);
        if (esaAllies.length > 0) {
            var esaTarget = esaAllies[0];
            dealHealing(caster, esaTarget, Math.floor(atk * 1.60));
            addStatus(esaTarget, 'atkBuff', 4, 0.15, caster);
            var esaNearestEnemy = null;
            var esaNearestDist = 999;
            for (var j = 0; j < enemies.length; j++) {
                if (enemies[j].hp > 0) {
                    var esad = getManhattanDist(esaTarget.gridRow, esaTarget.gridCol, enemies[j].gridRow, enemies[j].gridCol);
                    if (esad < esaNearestDist) { esaNearestDist = esad; esaNearestEnemy = enemies[j]; }
                }
            }
            if (esaNearestEnemy) {
                addStatus(esaNearestEnemy, 'burn', 3, 15, caster);
            }
        }
        break;

    // ===== WATER T1 EVOLVED =====

    case 'tsunami_blade':
        // Enhanced tide_hunter: Slash in line, apply 20% slow, self heal 30% of damage dealt
        if (target && target.hp > 0) {
            var tbDir = {
                dr: target.gridRow > caster.gridRow ? 1 : (target.gridRow < caster.gridRow ? -1 : 0),
                dc: target.gridCol > caster.gridCol ? 1 : (target.gridCol < caster.gridCol ? -1 : 0)
            };
            var tbTotalDmg = 0;
            for (var step = 1; step <= 3; step++) {
                var tbr = caster.gridRow + tbDir.dr * step;
                var tbc = caster.gridCol + tbDir.dc * step;
                if (tbr >= 0 && tbr < 8 && tbc >= 0 && tbc < 7 && grid[tbr] && grid[tbr][tbc]) {
                    var tbUnit = grid[tbr][tbc];
                    if (tbUnit.hp > 0 && tbUnit.side !== caster.side) {
                        var tbResult = dealDamage(caster, tbUnit, Math.floor(atk * 1.60), {isAbility:true, triggerOnHit:false});
                        addStatus(tbUnit, 'slow', 3, 0.20, caster);
                        tbTotalDmg += tbResult.totalDamage;
                    }
                }
            }
            if (tbTotalDmg > 0) {
                dealHealing(caster, caster, Math.floor(tbTotalDmg * 0.30));
            }
        }
        break;

    case 'ice_sniper':
        // Enhanced frost_archer: 25% slow, slowed take 12% more damage
        if (target && target.hp > 0) {
            dealDamage(caster, target, Math.floor(atk * 1.70), {isAbility:true, triggerOnHit:false});
            addStatus(target, 'slow', 3, 0.25, caster);
            addStatus(target, 'vulnerability', 4, 0.12, caster);
        }
        break;

    case 'tidal_phantom':
        // Enhanced reef_stalker: After dash gain 35% dodge, stealth, guaranteed crit vs slowed
        var tpTarget = getFurthestEnemy(caster, enemies);
        if (tpTarget) {
            var tpEmpty = findEmptyCellNear(tpTarget.gridRow, tpTarget.gridCol, grid);
            if (tpEmpty) moveUnitToCell(caster, tpEmpty.row, tpEmpty.col, grid);
            var tpMult = hasStatus(tpTarget, 'slow') ? 2.20 * 1.20 : 2.20;
            dealDamage(caster, tpTarget, Math.floor(atk * tpMult), {isAbility:true, triggerOnHit:false});
            addStatus(caster, 'dodgeBuff', 2, 0.35, caster);
            caster.stasis = 2.0; // stealth (untargetable)
        }
        break;

    // ===== EARTH T1 EVOLVED =====

    case 'mountain_lord':
        // Enhanced stone_guard: Shield self 35%, allies 18%, DR stacks
        grantShield(caster, caster, Math.floor(caster.maxHp * 0.35));
        var mlAllies = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, allies);
        var mlAllyCount = 0;
        for (var i = 0; i < mlAllies.length; i++) {
            if (mlAllies[i] !== caster && mlAllies[i].hp > 0) {
                grantShield(caster, mlAllies[i], Math.floor(mlAllies[i].maxHp * 0.18));
                mlAllyCount++;
            }
        }
        // +5% DR per ally (max 25%)
        var mlDR = Math.min(mlAllyCount * 0.05, 0.25);
        if (mlDR > 0) {
            addStatus(caster, 'drMod', 5, mlDR, caster);
            // Transfer DR to allies
            for (var i = 0; i < mlAllies.length; i++) {
                if (mlAllies[i] !== caster && mlAllies[i].hp > 0) {
                    addStatus(mlAllies[i], 'drMod', 5, mlDR, caster);
                }
            }
        }
        break;

    case 'ironwood_sentinel':
        // Enhanced bramble_knight: Stun 1.5s, shield all nearby allies
        var iwEnemies = getUnitsInRadius(caster.gridRow, caster.gridCol, 1, enemies);
        for (var i = 0; i < iwEnemies.length; i++) {
            dealDamage(caster, iwEnemies[i], Math.floor(atk * 1.40), {isAbility:true, triggerOnHit:false});
            addStatus(iwEnemies[i], 'stun', 1.5, 0, caster);
        }
        grantShield(caster, caster, Math.floor(caster.maxHp * 0.20));
        var iwAllies = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, allies);
        for (var i = 0; i < iwAllies.length; i++) {
            if (iwAllies[i] !== caster && iwAllies[i].hp > 0) {
                grantShield(caster, iwAllies[i], Math.floor(iwAllies[i].maxHp * 0.12));
            }
        }
        break;

    case 'thornwood_ranger':
        // Enhanced seedling_archer: Root 2s, apply slow to rooted, +5% ATK per stack
        if (target && target.hp > 0) {
            dealDamage(caster, target, Math.floor(atk * 1.60), {isAbility:true, triggerOnHit:false});
            addStatus(target, 'root', 2, 0, caster);
            addStatus(target, 'slow', 2, 0.15, caster);
            var twrRootedCount = 0;
            for (var j = 0; j < enemies.length; j++) {
                if (enemies[j].hp > 0 && hasStatus(enemies[j], 'root')) twrRootedCount++;
            }
            if (twrRootedCount > 0) {
                addStatus(caster, 'atkBuff', 4, twrRootedCount * 0.05, caster);
            }
        }
        break;

    // ===== WIND T1 EVOLVED =====

    case 'storm_assassin':
        // Enhanced zephyr_scout: 45% move speed + 20% dodge, reset on kill
        if (target && target.hp > 0) {
            var saEmpty = findEmptyCellNear(target.gridRow, target.gridCol, grid);
            if (saEmpty) moveUnitToCell(caster, saEmpty.row, saEmpty.col, grid);
            var saResult2 = dealDamage(caster, target, Math.floor(atk * 2.10), {isAbility:true, triggerOnHit:false});
            addStatus(caster, 'dodgeBuff', 3, 0.20, caster);
            addStatus(caster, 'moveSpeedBuff', 3, 0.45, caster);
            if (saResult2.killed) {
                caster.currentMana = Math.floor(caster.maxMana * 0.5);
                processOnKillPassive(caster, target, combatState.allUnits);
            }
        }
        break;

    case 'gale_sniper':
        // Enhanced wind_archer: +8% ATK speed per Wind ally, pierce, slow hit enemies
        if (target && target.hp > 0) {
            var gsDir = {
                dr: target.gridRow > caster.gridRow ? 1 : (target.gridRow < caster.gridRow ? -1 : 0),
                dc: target.gridCol > caster.gridCol ? 1 : (target.gridCol < caster.gridCol ? -1 : 0)
            };
            var gsHitTargets = [];
            for (var step = 1; step <= 7; step++) {
                var gr = caster.gridRow + gsDir.dr * step;
                var gc = caster.gridCol + gsDir.dc * step;
                if (gr >= 0 && gr < 8 && gc >= 0 && gc < 7 && grid[gr] && grid[gr][gc]) {
                    var gUnit = grid[gr][gc];
                    if (gUnit.hp > 0 && gUnit.side !== caster.side && gsHitTargets.indexOf(gUnit) < 0) {
                        gsHitTargets.push(gUnit);
                    }
                }
            }
            for (var i = 0; i < gsHitTargets.length; i++) {
                dealDamage(caster, gsHitTargets[i], Math.floor(atk * 1.70), {isAbility:true, triggerOnHit:false});
                addStatus(gsHitTargets[i], 'slow', 3, 0.20, caster);
            }
            // ATK speed per Wind ally
            var gsWindCount = 0;
            for (var j = 0; j < allies.length; j++) {
                if (allies[j] !== caster && allies[j].hp > 0 && allies[j].element === 'wind') gsWindCount++;
            }
            addStatus(caster, 'spdMod', 4, gsWindCount * 0.08, caster);
            addStatus(caster, 'dodgeBuff', 3, 0.20, caster);
        }
        break;

    case 'stormweaver':
        // Enhanced gale_dancer: Heal 3 lowest-HP allies 150% ATK, +18% ATK speed
        var swAllies = getLowestHpUnits(allies, 3);
        if (typeof flashAbilityCells === 'function') {
            var swCells = [];
            for (var swi = 0; swi < swAllies.length; swi++) {
                swCells.push({row: swAllies[swi].gridRow, col: swAllies[swi].gridCol});
            }
            flashAbilityCells(swCells, '#44ee44', 300);
        }
        for (var i = 0; i < swAllies.length; i++) {
            dealHealing(caster, swAllies[i], Math.floor(atk * 1.50));
            addStatus(swAllies[i], 'spdMod', 4, 0.18, caster);
        }
        addStatus(caster, 'moveSpeedBuff', 3, 0.35, caster);
        break;

    case 'zephyr_warrior':
        // Enhanced wind_squire: Slash nearby enemies (3 cells), +20% ATK speed
        var zwEnemies = getUnitsInRadius(caster.gridRow, caster.gridCol, 3, enemies);
        for (var i = 0; i < zwEnemies.length; i++) {
            dealDamage(caster, zwEnemies[i], Math.floor(atk * 1.40), {isAbility:true, triggerOnHit:false});
        }
        var zwAllies = getUnitsInRadius(caster.gridRow, caster.gridCol, 2.5, allies);
        for (var i = 0; i < zwAllies.length; i++) {
            addStatus(zwAllies[i], 'spdMod', 4, 0.20, caster);
        }
        break;

    // ===== LIGHTNING T1 EVOLVED =====

    case 'arc_duelist':
        // Enhanced spark_fencer: 180% ATK, 25% bonus to 2 targets, synergy scaling
        if (target && target.hp > 0) {
            var adTargets = getUnitsInRadius(target.gridRow, target.gridCol, 1, enemies);
            var adLightningCount = 0;
            for (var j = 0; j < allies.length; j++) {
                if (allies[j] !== caster && allies[j].hp > 0 && allies[j].element === 'lightning') adLightningCount++;
            }
            var adBonus = 1 + (adLightningCount * 0.05);
            for (var i = 0; i < Math.min(adTargets.length, 2); i++) {
                dealDamage(caster, adTargets[i], Math.floor(atk * 1.80 * adBonus), {isAbility:true, triggerOnHit:false});
            }
            if (typeof flashAbilityCells === 'function') {
                var adCells = [];
                for (var adi = 0; adi < adTargets.length; adi++) {
                    adCells.push({row: adTargets[adi].gridRow, col: adTargets[adi].gridCol});
                }
                flashAbilityCells(adCells, '#FFFF00', 300);
            }
        }
        break;

    case 'lightning_phantom':
        // Enhanced volt_runner: +25% crit, hits twice on crit
        if (target && target.hp > 0) {
            var lpEmpty = findEmptyCellNear(target.gridRow, target.gridCol, grid);
            if (lpEmpty) moveUnitToCell(caster, lpEmpty.row, lpEmpty.col, grid);
            var lpResult = dealDamage(caster, target, Math.floor(atk * 2.10), {isAbility:true, canCrit:true, triggerOnHit:false});
            addStatus(caster, 'critBuff', 2, 0.25, caster);
            addStatus(caster, 'moveSpeedBuff', 2, 0.10, caster);
            // Hits twice on crit
            if (lpResult.wasCrit && target.hp > 0) {
                dealDamage(caster, target, Math.floor(atk * 2.10), {isAbility:true, triggerOnHit:false});
            }
            if (lpResult.killed) {
                caster.attackCooldown = 0;
                processOnKillPassive(caster, target, combatState.allUnits);
            }
        }
        break;

    case 'storm_archer':
        // Enhanced thunder_archer: 200% ATK, chains to 2
        if (target && target.hp > 0) {
            var sarResult = dealDamage(caster, target, Math.floor(atk * 2.00), {isAbility:true, canCrit:true, triggerOnHit:false});
            var sarChained = [target];
            var sarLast = target;
            for (var bounce = 0; bounce < 2; bounce++) {
                var sarBest = null, sarBestDist = 999;
                for (var j = 0; j < enemies.length; j++) {
                    if (enemies[j].hp > 0 && sarChained.indexOf(enemies[j]) < 0) {
                        var sard = getManhattanDist(sarLast.gridRow, sarLast.gridCol, enemies[j].gridRow, enemies[j].gridCol);
                        if (sard <= 3 && sard < sarBestDist) { sarBestDist = sard; sarBest = enemies[j]; }
                    }
                }
                if (sarBest) {
                    dealDamage(caster, sarBest, Math.floor(atk * 2.00 * 0.6), {isAbility:true, triggerOnHit:false});
                    sarChained.push(sarBest);
                    sarLast = sarBest;
                }
            }
            // Reset on crit
            if (sarResult.wasCrit) {
                caster.currentMana = Math.floor(caster.maxMana * 0.5);
            }
        }
        break;

    case 'storm_medic':
        // Enhanced pulse_mender: Heal 160% ATK, chain to 2 allies, +10% crit
        var smAllies = getLowestHpUnits(allies, 1);
        if (smAllies.length > 0) {
            dealHealing(caster, smAllies[0], Math.floor(atk * 1.60));
            addStatus(smAllies[0], 'critBuff', 4, 0.10, caster);
            addStatus(smAllies[0], 'spdMod', 4, 0.05, caster);
            // Chain heals to 2 nearby allies
            var smNearby = getUnitsInRadius(smAllies[0].gridRow, smAllies[0].gridCol, 2, allies);
            var smChainCount = 0;
            for (var j = 0; j < smNearby.length; j++) {
                if (smNearby[j] !== smAllies[0] && smNearby[j].hp > 0 && smNearby[j].hp < smNearby[j].maxHp && smChainCount < 2) {
                    dealHealing(caster, smNearby[j], Math.floor(atk * 0.80));
                    addStatus(smNearby[j], 'critBuff', 4, 0.10, caster);
                    smChainCount++;
                }
            }
        }
        break;

    // ===== FORCE T1 EVOLVED =====

    case 'legionnaire':
        // Enhanced iron_soldier: 200% ATK, +15% ATK to allies, 15% DR reduction
        if (target && target.hp > 0) {
            dealDamage(caster, target, Math.floor(atk * 2.00), {isAbility:true, triggerOnHit:false});
            addStatus(target, 'vulnerability', 4, 0.15, caster);
        }
        var lgAllies = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, allies);
        for (var i = 0; i < lgAllies.length; i++) {
            if (lgAllies[i] !== caster && lgAllies[i].hp > 0) {
                addStatus(lgAllies[i], 'atkBuff', 3, 0.15, caster);
            }
        }
        break;

    case 'night_stalker':
        // Enhanced shadow_blade: 280% ATK, below 40% = 360% crit, lifesteal on kill
        if (target && target.hp > 0) {
            var nsEmpty = findEmptyCellNear(target.gridRow, target.gridCol, grid);
            if (nsEmpty) moveUnitToCell(caster, nsEmpty.row, nsEmpty.col, grid);
            var nsMult = (caster.hp / caster.maxHp < 0.40) ? 3.60 : 2.80;
            var nsResult = dealDamage(caster, target, Math.floor(atk * nsMult), {isAbility:true, triggerOnHit:false});
            addStatus(caster, 'moveSpeedBuff', 2, 0.35, caster);
            addStatus(caster, 'dodgeBuff', 2, 0.20, caster);
            if (nsResult.killed) {
                dealHealing(caster, caster, Math.floor(target.maxHp * 0.12));
                processOnKillPassive(caster, target, combatState.allUnits);
            }
        }
        break;

    case 'ballista_archer':
        // Enhanced steel_archer: Pierce 2 arrows, 200% ATK, 25% DR reduction
        if (target && target.hp > 0) {
            var baDir = {
                dr: target.gridRow > caster.gridRow ? 1 : (target.gridRow < caster.gridRow ? -1 : 0),
                dc: target.gridCol > caster.gridCol ? 1 : (target.gridCol < caster.gridCol ? -1 : 0)
            };
            var baHitTargets = [];
            for (var step = 1; step <= 7; step++) {
                var bar = caster.gridRow + baDir.dr * step;
                var bac = caster.gridCol + baDir.dc * step;
                if (bar >= 0 && bar < 8 && bac >= 0 && bac < 7 && grid[bar] && grid[bar][bac]) {
                    var baUnit = grid[bar][bac];
                    if (baUnit.hp > 0 && baUnit.side !== caster.side && baHitTargets.indexOf(baUnit) < 0) {
                        baHitTargets.push(baUnit);
                    }
                }
            }
            for (var i = 0; i < baHitTargets.length; i++) {
                dealDamage(caster, baHitTargets[i], Math.floor(atk * 2.00), {isAbility:true, triggerOnHit:false});
                addStatus(baHitTargets[i], 'vulnerability', 4, 0.25, caster);
            }
        }
        break;

    // ===== FIRE T2 BASE =====

    case 'magma_knight':
        // Explode dealing 160% ATK to nearby, burn, self shield
        var mkEnemies = getUnitsInRadius(caster.gridRow, caster.gridCol, 2.5, enemies);
        if (typeof flashAbilityCells === 'function') {
            flashAbilityCells(getCellsInRadius(caster.gridRow, caster.gridCol, 2), '#FF6B00', 300);
        }
        for (var i = 0; i < mkEnemies.length; i++) {
            dealDamage(caster, mkEnemies[i], Math.floor(atk * 1.60), {isAbility:true, triggerOnHit:false});
            addStatus(mkEnemies[i], 'burn', 3, 20, caster);
        }
        grantShield(caster, caster, Math.floor(caster.maxHp * 0.20));
        break;

    case 'blaze_lancer':
        // Dash forward dealing 180% ATK, burn, consecutive hit tracking
        if (target && target.hp > 0) {
            var blEmpty = findEmptyCellNear(target.gridRow, target.gridCol, grid);
            if (blEmpty) moveUnitToCell(caster, blEmpty.row, blEmpty.col, grid);
            dealDamage(caster, target, Math.floor(atk * 1.80), {isAbility:true, triggerOnHit:false});
            addStatus(target, 'burn', 3, 12, caster);
        }
        break;

    // ===== WATER T2 BASE =====

    case 'coral_priest':
        // Heal 2 lowest-HP allies 150% ATK, grant DR
        var cpAllies = getLowestHpUnits(allies, 2);
        if (typeof flashAbilityCells === 'function') {
            var cpCells = [];
            for (var cpi = 0; cpi < cpAllies.length; cpi++) {
                cpCells.push({row: cpAllies[cpi].gridRow, col: cpAllies[cpi].gridCol});
            }
            flashAbilityCells(cpCells, '#4488ff', 300);
        }
        for (var i = 0; i < cpAllies.length; i++) {
            dealHealing(caster, cpAllies[i], Math.floor(atk * 1.50));
            addStatus(cpAllies[i], 'drMod', 4, 0.10, caster);
        }
        break;

    case 'hydro_mage':
        // Water blast 200% ATK, slow, chain to 1 slowed enemy
        if (target && target.hp > 0) {
            dealDamage(caster, target, Math.floor(atk * 2.00), {isAbility:true, triggerOnHit:false});
            addStatus(target, 'slow', 3, 0.18, caster);
            // Chain to 1 nearby slowed enemy
            for (var j = 0; j < enemies.length; j++) {
                if (enemies[j] !== target && enemies[j].hp > 0 && hasStatus(enemies[j], 'slow')) {
                    var hmDist = getManhattanDist(target.gridRow, target.gridCol, enemies[j].gridRow, enemies[j].gridCol);
                    if (hmDist <= 3) {
                        dealDamage(caster, enemies[j], Math.floor(atk * 1.20), {isAbility:true, triggerOnHit:false});
                        break;
                    }
                }
            }
        }
        break;

    case 'shell_knight':
        // Shield self 18% max HP, shield all Water allies 12% max HP
        grantShield(caster, caster, Math.floor(caster.maxHp * 0.18));
        for (var i = 0; i < allies.length; i++) {
            if (allies[i] !== caster && allies[i].hp > 0 && allies[i].element === 'water') {
                grantShield(caster, allies[i], Math.floor(allies[i].maxHp * 0.12));
            }
        }
        break;

    // ===== EARTH T2 BASE =====

    case 'earth_shaman':
        // Heal 2 lowest-HP allies 150% ATK, shield + CC resist
        var eshAllies = getLowestHpUnits(allies, 2);
        if (typeof flashAbilityCells === 'function') {
            var eshCells = [];
            for (var eshi = 0; eshi < eshAllies.length; eshi++) {
                eshCells.push({row: eshAllies[eshi].gridRow, col: eshAllies[eshi].gridCol});
            }
            flashAbilityCells(eshCells, '#44ee44', 300);
        }
        for (var i = 0; i < eshAllies.length; i++) {
            dealHealing(caster, eshAllies[i], Math.floor(atk * 1.50));
            grantShield(caster, eshAllies[i], Math.floor(eshAllies[i].maxHp * 0.12));
            addStatus(eshAllies[i], 'ccResist', 4, 0.12, caster);
        }
        break;

    case 'crystal_mage':
        // Deal 200% ATK to target + adjacent, root 1.5s, shield allies
        if (target && target.hp > 0) {
            var cmgTargets = getUnitsInRadius(target.gridRow, target.gridCol, 1, enemies);
            for (var i = 0; i < cmgTargets.length; i++) {
                dealDamage(caster, cmgTargets[i], Math.floor(atk * 2.00), {isAbility:true, triggerOnHit:false});
                addStatus(cmgTargets[i], 'root', 1.5, 0, caster);
            }
            var cmgAllies = getUnitsInRadius(target.gridRow, target.gridCol, 2, allies);
            for (var i = 0; i < cmgAllies.length; i++) {
                if (cmgAllies[i].hp > 0) {
                    grantShield(caster, cmgAllies[i], Math.floor(cmgAllies[i].maxHp * 0.15));
                }
            }
        }
        break;

    case 'mud_stalker':
        // Burrow underground 1s, emerge at furthest enemy, guaranteed crit
        if (target && target.hp > 0) {
            var msTarget = getFurthestEnemy(caster, enemies);
            if (msTarget) {
                var msEmpty = findEmptyCellNear(msTarget.gridRow, msTarget.gridCol, grid);
                if (msEmpty) moveUnitToCell(caster, msEmpty.row, msEmpty.col, grid);
                dealDamage(caster, msTarget, Math.floor(atk * 2.20), {isAbility:true, canCrit:true, triggerOnHit:false});
                grantShield(caster, caster, Math.floor(caster.maxHp * 0.15));
            }
        }
        break;

    // ===== WIND T2 BASE =====

    case 'sky_knight':
        // Block next damage, redirect as AoE, shield allies
        caster.abilityBuffs = caster.abilityBuffs || {};
        caster.abilityBuffs.blockRedirect = true;
        caster.abilityBuffs.blockRedirectPct = 0.50;
        var skAllies = getUnitsInRadius(caster.gridRow, caster.gridCol, 2.5, allies);
        if (typeof flashAbilityCells === 'function') {
            var skCells = [];
            for (var ski = 0; ski < skAllies.length; ski++) {
                if (skAllies[ski].hp > 0) skCells.push({row: skAllies[ski].gridRow, col: skAllies[ski].gridCol});
            }
            flashAbilityCells(skCells, '#ffd700', 400);
        }
        for (var i = 0; i < skAllies.length; i++) {
            if (skAllies[i] !== caster && skAllies[i].hp > 0) {
                grantShield(caster, skAllies[i], Math.floor(skAllies[i].maxHp * 0.15));
            }
        }
        break;

    case 'gust_sentinel':
        // Gain Shield 28% max HP, redirect projectiles, grant damage bonus
        grantShield(caster, caster, Math.floor(caster.maxHp * 0.28));
        var gsAllies2 = getUnitsInRadius(caster.gridRow, caster.gridCol, 2.5, allies);
        for (var i = 0; i < gsAllies2.length; i++) {
            if (gsAllies2[i] !== caster && gsAllies2[i].hp > 0) {
                addStatus(gsAllies2[i], 'atkBuff', 4, 0.06, caster);
            }
        }
        break;

    // ===== LIGHTNING T2 BASE =====

    case 'tesla_knight':
        // Gain Shield 25%, allies within 1 cell gain shield 12%, reflect 25%
        grantShield(caster, caster, Math.floor(caster.maxHp * 0.25));
        var tkAllies = getUnitsInRadius(caster.gridRow, caster.gridCol, 1, allies);
        for (var i = 0; i < tkAllies.length; i++) {
            if (tkAllies[i] !== caster && tkAllies[i].hp > 0) {
                grantShield(caster, tkAllies[i], Math.floor(tkAllies[i].maxHp * 0.12));
            }
        }
        addStatus(caster, 'reflect', 5, 0.25, caster);
        break;

    case 'shock_mage':
        // Chain Lightning, chains to 2 enemies, 18% crit chance
        if (target && target.hp > 0) {
            var shResult = dealDamage(caster, target, Math.floor(atk * 1.70), {isAbility:true, canCrit:true, triggerOnHit:false});
            var shChained = [target];
            var shLast = target;
            for (var bounce = 0; bounce < 2; bounce++) {
                var shBest = null, shBestDist = 999;
                for (var j = 0; j < enemies.length; j++) {
                    if (enemies[j].hp > 0 && shChained.indexOf(enemies[j]) < 0) {
                        var shd = getManhattanDist(shLast.gridRow, shLast.gridCol, enemies[j].gridRow, enemies[j].gridCol);
                        if (shd <= 3 && shd < shBestDist) { shBestDist = shd; shBest = enemies[j]; }
                    }
                }
                if (shBest) {
                    dealDamage(caster, shBest, Math.floor(atk * 1.70 * 0.6), {isAbility:true, triggerOnHit:false});
                    shChained.push(shBest);
                    shLast = shBest;
                }
            }
            if (shResult.wasCrit) {
                caster.currentMana = Math.min(caster.maxMana, caster.currentMana + 20);
            }
            if (typeof flashAbilityCells === 'function') {
                var shCells = [];
                for (var shi = 0; shi < shChained.length; shi++) {
                    shCells.push({row: shChained[shi].gridRow, col: shChained[shi].gridCol});
                }
                flashAbilityCells(shCells, '#FFFF00', 300);
            }
        }
        break;

    // ===== FORCE T2 BASE =====

    case 'war_cleric':
        // Heal lowest-HP ally 150% ATK, deal 100% ATK to nearest enemy, buff ally
        var wcAllies = getLowestHpUnits(allies, 1);
        if (wcAllies.length > 0) {
            dealHealing(caster, wcAllies[0], Math.floor(atk * 1.50));
            addStatus(wcAllies[0], 'atkBuff', 4, 0.08, caster);
            addStatus(wcAllies[0], 'drMod', 4, 0.05, caster);
        }
        // Deal 100% ATK to nearest enemy
        var wcNearestEnemy = null;
        var wcNearestDist = 999;
        for (var j = 0; j < enemies.length; j++) {
            if (enemies[j].hp > 0) {
                var wcd = getManhattanDist(caster.gridRow, caster.gridCol, enemies[j].gridRow, enemies[j].gridCol);
                if (wcd < wcNearestDist) { wcNearestDist = wcd; wcNearestEnemy = enemies[j]; }
            }
        }
        if (wcNearestEnemy) {
            dealDamage(caster, wcNearestEnemy, Math.floor(atk * 1.00), {isAbility:true, triggerOnHit:false});
        }
        break;

    case 'battle_mage':
        // Force projectile 210% ATK with knockback 1 cell
        if (target && target.hp > 0) {
            var bmResult = dealDamage(caster, target, Math.floor(atk * 2.10), {isAbility:true, triggerOnHit:false});
            // Knockback 1 cell
            var bmDir = {
                dr: target.gridRow > caster.gridRow ? 1 : (target.gridRow < caster.gridRow ? -1 : 0),
                dc: target.gridCol > caster.gridCol ? 1 : (target.gridCol < caster.gridCol ? -1 : 0)
            };
            var bmNewR = target.gridRow + bmDir.dr;
            var bmNewC = target.gridCol + bmDir.dc;
            if (bmNewR >= 0 && bmNewR < 8 && bmNewC >= 0 && bmNewC < 7 && (!grid[bmNewR] || !grid[bmNewR][bmNewC])) {
                moveUnitToCell(target, bmNewR, bmNewC, grid);
            }
            if (bmResult.killed) {
                caster.currentMana = Math.floor(caster.maxMana * 0.5);
                processOnKillPassive(caster, target, combatState.allUnits);
            }
        }
        break;

    case 'shield_bearer':
        // Gain Shield 30% max HP, allies 15%, block next CC, grant DR
        grantShield(caster, caster, Math.floor(caster.maxHp * 0.30));
        var sbAllies = getUnitsInRadius(caster.gridRow, caster.gridCol, 2.5, allies);
        for (var i = 0; i < sbAllies.length; i++) {
            if (sbAllies[i] !== caster && sbAllies[i].hp > 0) {
                grantShield(caster, sbAllies[i], Math.floor(sbAllies[i].maxHp * 0.15));
                addStatus(sbAllies[i], 'drMod', 4, 0.05, caster);
            }
        }
        // Block next CC on self
        if (combatState) caster.ccImmuneUntil = combatState.elapsed + 4;
        break;

    // ===== FIRE T2 EVOLVED =====

    case 'volcano_titan':
        // Enhanced magma_knight: Larger AoE (3 cells), 200% ATK, lava pool
        var vtEnemies2 = getUnitsInRadius(caster.gridRow, caster.gridCol, 3, enemies);
        if (typeof flashAbilityCells === 'function') {
            flashAbilityCells(getCellsInRadius(caster.gridRow, caster.gridCol, 3), '#FF6B00', 400);
        }
        for (var i = 0; i < vtEnemies2.length; i++) {
            dealDamage(caster, vtEnemies2[i], Math.floor(atk * 2.00), {isAbility:true, triggerOnHit:false});
            addStatus(vtEnemies2[i], 'burn', 3, 30, caster);
        }
        grantShield(caster, caster, Math.floor(caster.maxHp * 0.25));
        addStatus(caster, 'reflect', 5, 0.25, caster);
        break;

    case 'inferno_lancer':
        // Enhanced blaze_lancer: 220% ATK, burn 15 DPS 4s, lifesteal per stack
        if (target && target.hp > 0) {
            var ilEmpty = findEmptyCellNear(target.gridRow, target.gridCol, grid);
            if (ilEmpty) moveUnitToCell(caster, ilEmpty.row, ilEmpty.col, grid);
            var ilDmg = dealDamage(caster, target, Math.floor(atk * 2.20), {isAbility:true, triggerOnHit:false});
            addStatus(target, 'burn', 4, 15, caster);
            // Lifesteal based on stacks
            if (caster.passiveState && caster.passiveState.stacks > 0) {
                var ilLifesteal = ilDmg.totalDamage * (caster.passiveState.stacks * 0.05);
                if (ilLifesteal > 0) dealHealing(caster, caster, Math.floor(ilLifesteal));
            }
        }
        break;

    // ===== WATER T2 EVOLVED =====

    case 'ocean_sage':
        // Enhanced coral_priest: Heal 3 allies 160% ATK, cleanse 1 debuff
        var osAllies = getLowestHpUnits(allies, 3);
        if (typeof flashAbilityCells === 'function') {
            var osCells = [];
            for (var osi = 0; osi < osAllies.length; osi++) {
                osCells.push({row: osAllies[osi].gridRow, col: osAllies[osi].gridCol});
            }
            flashAbilityCells(osCells, '#4488ff', 300);
        }
        for (var i = 0; i < osAllies.length; i++) {
            dealHealing(caster, osAllies[i], Math.floor(atk * 1.60));
            clearDebuffs(osAllies[i], 1);
        }
        break;

    case 'abyssal_mage':
        // Enhanced hydro_mage: 240% ATK, 25% slow, chains to 2
        if (target && target.hp > 0) {
            dealDamage(caster, target, Math.floor(atk * 2.40), {isAbility:true, triggerOnHit:false});
            addStatus(target, 'slow', 3, 0.25, caster);
            var amChainCount = 0;
            for (var j = 0; j < enemies.length; j++) {
                if (enemies[j] !== target && enemies[j].hp > 0 && amChainCount < 2) {
                    var amd = getManhattanDist(target.gridRow, target.gridCol, enemies[j].gridRow, enemies[j].gridCol);
                    if (amd <= 3) {
                        dealDamage(caster, enemies[j], Math.floor(atk * 1.40), {isAbility:true, triggerOnHit:false});
                        addStatus(enemies[j], 'slow', 3, 0.25, caster);
                        amChainCount++;
                    }
                }
            }
        }
        break;

    case 'armored_sentinel':
        // Enhanced shell_knight: Shield 22% + 12% DR, Water allies shield 18%
        grantShield(caster, caster, Math.floor(caster.maxHp * 0.22));
        addStatus(caster, 'drMod', 5, 0.12, caster);
        for (var i = 0; i < allies.length; i++) {
            if (allies[i] !== caster && allies[i].hp > 0 && allies[i].element === 'water') {
                grantShield(caster, allies[i], Math.floor(allies[i].maxHp * 0.18));
            }
        }
        break;

    // ===== EARTH T2 EVOLVED =====

    case 'gaia_priest':
        // Enhanced earth_shaman: Heal 3 allies 170% ATK, shield + DR
        var gpAllies = getLowestHpUnits(allies, 3);
        if (typeof flashAbilityCells === 'function') {
            var gpCells = [];
            for (var gpi = 0; gpi < gpAllies.length; gpi++) {
                gpCells.push({row: gpAllies[gpi].gridRow, col: gpAllies[gpi].gridCol});
            }
            flashAbilityCells(gpCells, '#44ee44', 300);
        }
        for (var i = 0; i < gpAllies.length; i++) {
            dealHealing(caster, gpAllies[i], Math.floor(atk * 1.70));
            grantShield(caster, gpAllies[i], Math.floor(gpAllies[i].maxHp * 0.15));
            addStatus(gpAllies[i], 'drMod', 4, 0.08, caster);
        }
        break;

    case 'geomancer':
        // Enhanced crystal_mage: 240% ATK, 3-cell area, root 2s, 18% shields
        if (target && target.hp > 0) {
            var geoTargets = getUnitsInRadius(target.gridRow, target.gridCol, 3, enemies);
            for (var i = 0; i < geoTargets.length; i++) {
                dealDamage(caster, geoTargets[i], Math.floor(atk * 2.40), {isAbility:true, triggerOnHit:false});
                addStatus(geoTargets[i], 'root', 2, 0, caster);
            }
            var geoAllies = getUnitsInRadius(target.gridRow, target.gridCol, 3, allies);
            for (var i = 0; i < geoAllies.length; i++) {
                if (geoAllies[i].hp > 0) {
                    grantShield(caster, geoAllies[i], Math.floor(geoAllies[i].maxHp * 0.18));
                }
            }
        }
        break;

    case 'quake_reaper':
        // Enhanced mud_stalker: Emerge AoE 180% ATK, root + stun, guaranteed crit
        if (target && target.hp > 0) {
            var qrTarget = getFurthestEnemy(caster, enemies);
            if (qrTarget) {
                var qrEmpty = findEmptyCellNear(qrTarget.gridRow, qrTarget.gridCol, grid);
                if (qrEmpty) moveUnitToCell(caster, qrEmpty.row, qrEmpty.col, grid);
                var qrEnemies = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
                for (var i = 0; i < qrEnemies.length; i++) {
                    dealDamage(caster, qrEnemies[i], Math.floor(atk * 1.80), {isAbility:true, triggerOnHit:false});
                    addStatus(qrEnemies[i], 'root', 2, 0, caster);
                    addStatus(qrEnemies[i], 'stun', 0.5, 0, caster);
                }
                grantShield(caster, caster, Math.floor(caster.maxHp * 0.20));
            }
        }
        break;

    // ===== WIND T2 EVOLVED =====

    case 'aegis_paladin':
        // Enhanced sky_knight: 8% damage + 5% DR to nearby, larger area, 60% redirect
        caster.abilityBuffs = caster.abilityBuffs || {};
        caster.abilityBuffs.blockRedirect = true;
        caster.abilityBuffs.blockRedirectPct = 0.60;
        var apAllies = getUnitsInRadius(caster.gridRow, caster.gridCol, 3, allies);
        if (typeof flashAbilityCells === 'function') {
            var apCells = [];
            for (var api = 0; api < apAllies.length; api++) {
                if (apAllies[api].hp > 0) apCells.push({row: apAllies[api].gridRow, col: apAllies[api].gridCol});
            }
            flashAbilityCells(apCells, '#ffd700', 400);
        }
        for (var i = 0; i < apAllies.length; i++) {
            if (apAllies[i] !== caster && apAllies[i].hp > 0) {
                grantShield(caster, apAllies[i], Math.floor(apAllies[i].maxHp * 0.18));
                addStatus(apAllies[i], 'atkBuff', 4, 0.08, caster);
                addStatus(apAllies[i], 'drMod', 4, 0.05, caster);
            }
        }
        break;

    case 'tempest_guardian':
        // Enhanced gust_sentinel: 35% shield, 20% dodge, 3-cell radius, 8% damage bonus
        grantShield(caster, caster, Math.floor(caster.maxHp * 0.35));
        addStatus(caster, 'dodgeBuff', 4, 0.20, caster);
        var tgAllies = getUnitsInRadius(caster.gridRow, caster.gridCol, 3, allies);
        for (var i = 0; i < tgAllies.length; i++) {
            if (tgAllies[i] !== caster && tgAllies[i].hp > 0) {
                addStatus(tgAllies[i], 'atkBuff', 4, 0.08, caster);
            }
        }
        break;

    // ===== LIGHTNING T2 EVOLVED =====

    case 'storm_bastion':
        // Enhanced tesla_knight: 2-cell radius, 40% reflect, 30% self shield, 15% ally
        grantShield(caster, caster, Math.floor(caster.maxHp * 0.30));
        var sbsAllies = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, allies);
        for (var i = 0; i < sbsAllies.length; i++) {
            if (sbsAllies[i] !== caster && sbsAllies[i].hp > 0) {
                grantShield(caster, sbsAllies[i], Math.floor(sbsAllies[i].maxHp * 0.15));
            }
        }
        addStatus(caster, 'reflect', 5, 0.40, caster);
        break;

    case 'tempest_mage':
        // Enhanced shock_mage: 200% ATK, chains to 3, 40 mana per crit
        if (target && target.hp > 0) {
            var tmResult = dealDamage(caster, target, Math.floor(atk * 2.00), {isAbility:true, canCrit:true, triggerOnHit:false});
            var tmChained2 = [target];
            var tmLast = target;
            for (var bounce = 0; bounce < 3; bounce++) {
                var tmBest = null, tmBestDist = 999;
                for (var j = 0; j < enemies.length; j++) {
                    if (enemies[j].hp > 0 && tmChained2.indexOf(enemies[j]) < 0) {
                        var tmd = getManhattanDist(tmLast.gridRow, tmLast.gridCol, enemies[j].gridRow, enemies[j].gridCol);
                        if (tmd <= 3 && tmd < tmBestDist) { tmBestDist = tmd; tmBest = enemies[j]; }
                    }
                }
                if (tmBest) {
                    dealDamage(caster, tmBest, Math.floor(atk * 2.00 * 0.6), {isAbility:true, triggerOnHit:false});
                    tmChained2.push(tmBest);
                    tmLast = tmBest;
                }
            }
            if (tmResult.wasCrit) {
                caster.currentMana = Math.min(caster.maxMana, caster.currentMana + 40);
            }
            if (typeof flashAbilityCells === 'function') {
                var tmcCells = [];
                for (var tmi = 0; tmi < tmChained2.length; tmi++) {
                    tmcCells.push({row: tmChained2[tmi].gridRow, col: tmChained2[tmi].gridCol});
                }
                flashAbilityCells(tmcCells, '#FFFF00', 400);
            }
        }
        break;

    // ===== FORCE T2 EVOLVED =====

    case 'battle_priest':
        // Enhanced war_cleric: Heal 2 allies 170% ATK, damage all nearby enemies 120% ATK
        var bpAllies = getLowestHpUnits(allies, 2);
        for (var i = 0; i < bpAllies.length; i++) {
            dealHealing(caster, bpAllies[i], Math.floor(atk * 1.70));
            addStatus(bpAllies[i], 'atkBuff', 4, 0.10, caster);
            addStatus(bpAllies[i], 'drMod', 4, 0.08, caster);
        }
        var bpEnemies = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
        for (var i = 0; i < bpEnemies.length; i++) {
            dealDamage(caster, bpEnemies[i], Math.floor(atk * 1.20), {isAbility:true, triggerOnHit:false});
        }
        break;

    case 'force_archmage':
        // Enhanced battle_mage: 250% ATK, knockback 2 cells, 18% DR ignore, reset on kill
        if (target && target.hp > 0) {
            var faResult = dealDamage(caster, target, Math.floor(atk * 2.50), {isAbility:true, triggerOnHit:false});
            // Knockback 2 cells
            var faDir = {
                dr: target.gridRow > caster.gridRow ? 1 : (target.gridRow < caster.gridRow ? -1 : 0),
                dc: target.gridCol > caster.gridCol ? 1 : (target.gridCol < caster.gridCol ? -1 : 0)
            };
            for (var step = 0; step < 2; step++) {
                var faNewR = target.gridRow + faDir.dr;
                var faNewC = target.gridCol + faDir.dc;
                if (faNewR >= 0 && faNewR < 8 && faNewC >= 0 && faNewC < 7 && (!grid[faNewR] || !grid[faNewR][faNewC])) {
                    moveUnitToCell(target, faNewR, faNewC, grid);
                }
            }
            if (faResult.killed) {
                caster.currentMana = Math.floor(caster.maxMana * 0.5);
                processOnKillPassive(caster, target, combatState.allUnits);
            }
        }
        break;

    case 'bastion':
        // Enhanced shield_bearer: 35% self shield, 18% ally, CC immunity, 5% DR
        grantShield(caster, caster, Math.floor(caster.maxHp * 0.35));
        var basAllies = getUnitsInRadius(caster.gridRow, caster.gridCol, 2.5, allies);
        for (var i = 0; i < basAllies.length; i++) {
            if (basAllies[i] !== caster && basAllies[i].hp > 0) {
                grantShield(caster, basAllies[i], Math.floor(basAllies[i].maxHp * 0.18));
                addStatus(basAllies[i], 'drMod', 4, 0.05, caster);
            }
        }
        if (combatState) caster.ccImmuneUntil = combatState.elapsed + 5;
        break;

    // ===== COST 3 BASE =====

    case 'pyromancer':
        // Infernal Storm: 200% ATK in 2-cell radius, apply Burn 25 DPS 4s
        if (target && target.hp > 0) {
            var pyroTargets = getUnitsInRadius(target.gridRow, target.gridCol, 2, enemies);
            if (typeof flashAbilityCells === 'function') flashAbilityCells(getCellsInRadius(target.gridRow, target.gridCol, 2), '#ff4444', 400);
            for (var i = 0; i < pyroTargets.length; i++) {
                dealDamage(caster, pyroTargets[i], Math.floor(atk * 2.0), {isAbility:true, triggerOnHit:false});
                addStatus(pyroTargets[i], 'burn', 4, 25, caster);
            }
        }
        break;

    case 'inferno_fox':
        // Spirit Rush: Dash 3 times, 100% ATK each, final 200%
        var foxTargets = getRandomAlive(enemies, 3);
        if (foxTargets.length > 0) {
            for (var i = 0; i < foxTargets.length; i++) {
                var foxDmgMult = (i === foxTargets.length - 1) ? 2.0 : 1.0;
                dealDamage(caster, foxTargets[i], Math.floor(atk * foxDmgMult), {isAbility:true, triggerOnHit:false});
                if (combatState) {
                    var foxCell = findEmptyCellNear(foxTargets[i].gridRow, foxTargets[i].gridCol, grid);
                    if (foxCell) moveUnitToCell(caster, foxCell.row, foxCell.col, grid);
                }
            }
        }
        break;

    case 'tidal_shaman':
        // Tidal Surge: Heal all Water allies 160% ATK, grant 15% dodge 3s
        var tsWaterAllies = getAlliesOfElement(caster, 'water');
        if (typeof flashAbilityCells === 'function') flashAbilityCells([{row: caster.gridRow, col: caster.gridCol}], '#4488ff', 400);
        for (var i = 0; i < tsWaterAllies.length; i++) {
            dealHealing(caster, tsWaterAllies[i], Math.floor(atk * 1.6));
            addStatus(tsWaterAllies[i], 'dodgeBuff', 3, 0.15, caster);
        }
        break;

    case 'riptide_blade':
        // Maelstrom Spin: 180% ATK 2-cell radius, Slow 20% 3s, lifesteal 20% 4s
        var rbTargets = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
        if (typeof flashAbilityCells === 'function') flashAbilityCells(getCellsInRadius(caster.gridRow, caster.gridCol, 2), '#4488ff', 400);
        for (var i = 0; i < rbTargets.length; i++) {
            dealDamage(caster, rbTargets[i], Math.floor(atk * 1.8), {isAbility:true, triggerOnHit:false});
            addStatus(rbTargets[i], 'slow', 3, 0.20, caster);
        }
        addStatus(caster, 'atkBuff', 4, 0.20, caster); // lifesteal represented as buff
        break;

    case 'golem':
        // Ground Slam: 180% ATK 2-cell radius, stun 1.2s, DR 15% 4s
        var golemTargets = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
        if (typeof flashAbilityCells === 'function') flashAbilityCells(getCellsInRadius(caster.gridRow, caster.gridCol, 2), '#44cc44', 400);
        for (var i = 0; i < golemTargets.length; i++) {
            dealDamage(caster, golemTargets[i], Math.floor(atk * 1.8), {isAbility:true, triggerOnHit:false});
            addStatus(golemTargets[i], 'stun', 1.2, 0, caster);
        }
        addStatus(caster, 'drMod', 4, 0.15, caster);
        break;

    case 'terra_sage':
        // Earthen Barrage: 3 projectiles at 3 highest-ATK enemies, 140% ATK, reduce ATK 18% 4s
        var tsHighAtk = getHighestAtkUnits(enemies, 3);
        for (var i = 0; i < tsHighAtk.length; i++) {
            dealDamage(caster, tsHighAtk[i], Math.floor(atk * 1.4), {isAbility:true, triggerOnHit:false});
            addStatus(tsHighAtk[i], 'atkBuff', 4, -0.18, caster);
        }
        // Living Earth passive: nearest ally gains 18% max HP shield
        var tsNearAlly = findNearestAlly(caster, allies);
        if (tsNearAlly) grantShield(caster, tsNearAlly, Math.floor(tsNearAlly.maxHp * 0.18));
        break;

    case 'monsoon_caller':
        // Tornado: 200% ATK over 3s in 2-cell radius, silence 2s
        if (target && target.hp > 0) {
            var mcTargets = getUnitsInRadius(target.gridRow, target.gridCol, 2, enemies);
            if (typeof flashAbilityCells === 'function') flashAbilityCells(getCellsInRadius(target.gridRow, target.gridCol, 2), '#88ccff', 400);
            for (var i = 0; i < mcTargets.length; i++) {
                dealDamage(caster, mcTargets[i], Math.floor(atk * 2.0), {isAbility:true, triggerOnHit:false});
                addStatus(mcTargets[i], 'silence', 2, 0, caster);
            }
        }
        break;

    case 'wind_duelist':
        // Cyclone Slash: 190% ATK 2-cell radius, 30% dodge 3s, reset stacks
        var wdTargets = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
        if (typeof flashAbilityCells === 'function') flashAbilityCells(getCellsInRadius(caster.gridRow, caster.gridCol, 2), '#88ccff', 400);
        for (var i = 0; i < wdTargets.length; i++) {
            dealDamage(caster, wdTargets[i], Math.floor(atk * 1.9), {isAbility:true, triggerOnHit:false});
        }
        addStatus(caster, 'dodgeBuff', 3, 0.30, caster);
        if (caster.passiveState && caster.passiveState.customData) caster.passiveState.customData.dodgeStacks = 0;
        break;

    case 'ball_lightning':
        // Sphere Summoning: Rolling ball 180% ATK, chains to 6 enemies
        var blTarget = target || getRandomAlive(enemies, 1)[0];
        if (blTarget && blTarget.hp > 0) {
            var blHit = [blTarget];
            dealDamage(caster, blTarget, Math.floor(atk * 1.8), {isAbility:true, triggerOnHit:false});
            var blCurrent = blTarget;
            for (var chain = 0; chain < 5; chain++) {
                var blNext = null, blBestDist = 999;
                for (var j = 0; j < enemies.length; j++) {
                    if (enemies[j].hp > 0 && blHit.indexOf(enemies[j]) < 0) {
                        var blD = getManhattanDist(blCurrent.gridRow, blCurrent.gridCol, enemies[j].gridRow, enemies[j].gridCol);
                        if (blD <= 2 && blD < blBestDist) { blBestDist = blD; blNext = enemies[j]; }
                    }
                }
                if (!blNext) break;
                blHit.push(blNext);
                dealDamage(caster, blNext, Math.floor(atk * 1.8), {isAbility:true, triggerOnHit:false});
                blCurrent = blNext;
            }
        }
        break;

    case 'thunder_warden':
        // Lightning Prison: Stun nearby 1s, chain damage, DR per Lightning ally 5s
        var twTargets = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
        if (typeof flashAbilityCells === 'function') flashAbilityCells(getCellsInRadius(caster.gridRow, caster.gridCol, 2), '#ffcc00', 400);
        for (var i = 0; i < twTargets.length; i++) {
            addStatus(twTargets[i], 'stun', 1, 0, caster);
            dealDamage(caster, twTargets[i], Math.floor(atk * 0.5), {isAbility:true, triggerOnHit:false});
        }
        var twLightningCount = countAlliesOfElement(caster, 'lightning');
        addStatus(caster, 'drMod', 5, twLightningCount * 0.08, caster);
        break;

    case 'gladiator':
        // Brutal Strike: 220% ATK, 15% DR reduction 4s
        if (target && target.hp > 0) {
            var gladDmg = Math.floor(atk * 2.2);
            if (caster.abilityBuffs && caster.abilityBuffs.nextAtkMult) {
                gladDmg = Math.floor(gladDmg * caster.abilityBuffs.nextAtkMult);
                delete caster.abilityBuffs.nextAtkMult;
            }
            dealDamage(caster, target, gladDmg, {isAbility:true, triggerOnHit:false});
            addStatus(target, 'drMod', 4, -0.15, caster);
        }
        break;

    case 'fortress':
        // Defensive Stance: +12% DR 6s, taunt nearby 2s, reduce ATK 20%
        addStatus(caster, 'drMod', 6, 0.12, caster);
        var fortTargets = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
        if (typeof flashAbilityCells === 'function') flashAbilityCells(getCellsInRadius(caster.gridRow, caster.gridCol, 2), '#ffaa00', 400);
        for (var i = 0; i < fortTargets.length; i++) {
            addStatus(fortTargets[i], 'stun', 0.5, 0, caster); // taunt approximated as short stun
            addStatus(fortTargets[i], 'atkBuff', 6, -0.20, caster);
        }
        break;

    // ===== COST 3 EVOLVED =====

    case 'arcane_inferno':
        // Enhanced Infernal Storm: 250% ATK, persistent fire zone, Burn 30 DPS 4s
        if (target && target.hp > 0) {
            var aiTargets = getUnitsInRadius(target.gridRow, target.gridCol, 2, enemies);
            if (typeof flashAbilityCells === 'function') flashAbilityCells(getCellsInRadius(target.gridRow, target.gridCol, 2), '#ff2222', 400);
            for (var i = 0; i < aiTargets.length; i++) {
                dealDamage(caster, aiTargets[i], Math.floor(atk * 2.5), {isAbility:true, triggerOnHit:false});
                addStatus(aiTargets[i], 'burn', 4, 25, caster);
            }
        }
        break;

    case 'ninetail_blaze':
        // Spirit Rush Enhanced: 5 dashes, 100% ATK, final 200%, apply Burn
        var nbTargets = getRandomAlive(enemies, 5);
        if (nbTargets.length > 0) {
            for (var i = 0; i < nbTargets.length; i++) {
                var nbMult = (i === nbTargets.length - 1) ? 2.0 : 1.0;
                dealDamage(caster, nbTargets[i], Math.floor(atk * nbMult), {isAbility:true, triggerOnHit:false});
                addStatus(nbTargets[i], 'burn', 3, 15, caster);
                if (combatState) {
                    var nbCell = findEmptyCellNear(nbTargets[i].gridRow, nbTargets[i].gridCol, grid);
                    if (nbCell) moveUnitToCell(caster, nbCell.row, nbCell.col, grid);
                }
            }
        }
        break;

    case 'stormtide_oracle':
        // Tidal Surge Enhanced: Heal all Water allies 200% ATK, 25% dodge 3s
        var stoWater = getAlliesOfElement(caster, 'water');
        for (var i = 0; i < stoWater.length; i++) {
            dealHealing(caster, stoWater[i], Math.floor(atk * 2.0));
            addStatus(stoWater[i], 'dodgeBuff', 3, 0.25, caster);
        }
        break;

    case 'tsunami_warlord':
        // Maelstrom Spin Enhanced: 180% ATK, 30% Slow, 35% lifesteal, stun Slowed 0.5s
        var twlTargets = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
        if (typeof flashAbilityCells === 'function') flashAbilityCells(getCellsInRadius(caster.gridRow, caster.gridCol, 2), '#4488ff', 400);
        for (var i = 0; i < twlTargets.length; i++) {
            if (hasStatus(twlTargets[i], 'slow')) addStatus(twlTargets[i], 'stun', 0.5, 0, caster);
            dealDamage(caster, twlTargets[i], Math.floor(atk * 1.8), {isAbility:true, triggerOnHit:false});
            addStatus(twlTargets[i], 'slow', 3, 0.30, caster);
        }
        break;

    case 'iron_colossus':
        // Ground Slam Enhanced: 250% ATK, stun 1.8s, 22% DR to nearby allies
        var icTargets = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
        if (typeof flashAbilityCells === 'function') flashAbilityCells(getCellsInRadius(caster.gridRow, caster.gridCol, 2), '#44cc44', 400);
        for (var i = 0; i < icTargets.length; i++) {
            dealDamage(caster, icTargets[i], Math.floor(atk * 2.5), {isAbility:true, triggerOnHit:false});
            addStatus(icTargets[i], 'stun', 1.8, 0, caster);
        }
        var icAllies = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, allies);
        for (var i = 0; i < icAllies.length; i++) {
            addStatus(icAllies[i], 'drMod', 4, 0.22, caster);
        }
        addStatus(caster, 'drMod', 4, 0.15, caster);
        break;

    case 'earthweaver':
        // Earthen Barrage Enhanced: 5 projectiles, 140% ATK, reduce ATK 25%
        var ewHighAtk = getHighestAtkUnits(enemies, 5);
        for (var i = 0; i < ewHighAtk.length; i++) {
            dealDamage(caster, ewHighAtk[i], Math.floor(atk * 1.4), {isAbility:true, triggerOnHit:false});
            addStatus(ewHighAtk[i], 'atkBuff', 4, -0.25, caster);
        }
        var ewNearAlly = findNearestAlly(caster, allies);
        if (ewNearAlly) grantShield(caster, ewNearAlly, Math.floor(ewNearAlly.maxHp * 0.25));
        break;

    case 'tempest_lord':
        // Tornado Enhanced: 3-cell radius, 300% ATK, silence 3s
        if (target && target.hp > 0) {
            var tlTargets = getUnitsInRadius(target.gridRow, target.gridCol, 3, enemies);
            if (typeof flashAbilityCells === 'function') flashAbilityCells(getCellsInRadius(target.gridRow, target.gridCol, 3), '#88ccff', 400);
            for (var i = 0; i < tlTargets.length; i++) {
                dealDamage(caster, tlTargets[i], Math.floor(atk * 3.0), {isAbility:true, triggerOnHit:false});
                addStatus(tlTargets[i], 'silence', 3, 0, caster);
            }
        }
        break;

    case 'hurricane_blade':
        // Cyclone Slash Enhanced: 260% ATK, 45% dodge 3s, Slow all hit, reset stacks
        var hbTargets = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
        if (typeof flashAbilityCells === 'function') flashAbilityCells(getCellsInRadius(caster.gridRow, caster.gridCol, 2), '#88ccff', 400);
        for (var i = 0; i < hbTargets.length; i++) {
            dealDamage(caster, hbTargets[i], Math.floor(atk * 2.6), {isAbility:true, triggerOnHit:false});
            addStatus(hbTargets[i], 'slow', 2, 0.15, caster);
        }
        addStatus(caster, 'dodgeBuff', 3, 0.45, caster);
        if (caster.passiveState && caster.passiveState.customData) caster.passiveState.customData.dodgeStacks = 0;
        break;

    case 'plasma_core':
        // Sphere Summoning Enhanced: 2 balls, 180% ATK, chain to 8 enemies
        var pcTargets = getRandomAlive(enemies, 2);
        for (var pi = 0; pi < pcTargets.length; pi++) {
            var pcHit = [pcTargets[pi]];
            dealDamage(caster, pcTargets[pi], Math.floor(atk * 1.8), {isAbility:true, triggerOnHit:false});
            addStatus(pcTargets[pi], 'vulnerability', 4, 0.18, caster);
            var pcCurr = pcTargets[pi];
            for (var chain = 0; chain < 3; chain++) {
                var pcNext = null, pcBest = 999;
                for (var j = 0; j < enemies.length; j++) {
                    if (enemies[j].hp > 0 && pcHit.indexOf(enemies[j]) < 0) {
                        var pcD = getManhattanDist(pcCurr.gridRow, pcCurr.gridCol, enemies[j].gridRow, enemies[j].gridCol);
                        if (pcD <= 2 && pcD < pcBest) { pcBest = pcD; pcNext = enemies[j]; }
                    }
                }
                if (!pcNext) break;
                pcHit.push(pcNext);
                dealDamage(caster, pcNext, Math.floor(atk * 1.8), {isAbility:true, triggerOnHit:false});
                addStatus(pcNext, 'vulnerability', 4, 0.18, caster);
                pcCurr = pcNext;
            }
        }
        break;

    case 'storm_fortress':
        // Lightning Prison Enhanced: Stun 1.5s, chain damage, 10% DR per Lightning ally
        var sfTargets = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
        if (typeof flashAbilityCells === 'function') flashAbilityCells(getCellsInRadius(caster.gridRow, caster.gridCol, 2), '#ffcc00', 400);
        for (var i = 0; i < sfTargets.length; i++) {
            addStatus(sfTargets[i], 'stun', 1.5, 0, caster);
            dealDamage(caster, sfTargets[i], Math.floor(atk * 0.5), {isAbility:true, triggerOnHit:false});
        }
        var sfLightning = countAlliesOfElement(caster, 'lightning');
        addStatus(caster, 'drMod', 5, sfLightning * 0.10, caster);
        break;

    case 'champion':
        // Brutal Strike Enhanced: 320% ATK, 25% DR reduction, stun nearby on kill
        if (target && target.hp > 0) {
            var champDmg = Math.floor(atk * 3.2);
            if (caster.abilityBuffs && caster.abilityBuffs.nextAtkMult) {
                champDmg = Math.floor(champDmg * caster.abilityBuffs.nextAtkMult);
                delete caster.abilityBuffs.nextAtkMult;
            }
            var champResult = dealDamage(caster, target, champDmg, {isAbility:true, triggerOnHit:false});
            addStatus(target, 'drMod', 4, -0.25, caster);
            if (champResult.killed) {
                var champNearby = getUnitsInRadius(target.gridRow, target.gridCol, 2, enemies);
                for (var i = 0; i < champNearby.length; i++) {
                    if (champNearby[i] !== target && champNearby[i].hp > 0) {
                        addStatus(champNearby[i], 'stun', 0.8, 0, caster);
                        break;
                    }
                }
            }
        }
        break;

    case 'citadel':
        // Defensive Stance Enhanced: +18% DR 8s, taunt 3s, ATK reduction 30%
        addStatus(caster, 'drMod', 8, 0.18, caster);
        var citTargets = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
        if (typeof flashAbilityCells === 'function') flashAbilityCells(getCellsInRadius(caster.gridRow, caster.gridCol, 2), '#ffaa00', 400);
        for (var i = 0; i < citTargets.length; i++) {
            addStatus(citTargets[i], 'stun', 0.5, 0, caster);
            addStatus(citTargets[i], 'atkBuff', 6, -0.30, caster);
        }
        break;

    // ===== COST 4 BASE =====

    case 'fire_dragon':
        // Breath Weapon: Cone fire 250% ATK, Burn 30 DPS 4s, stun closest 1.5s
        if (target && target.hp > 0) {
            var dr4 = target.gridRow > caster.gridRow ? 1 : (target.gridRow < caster.gridRow ? -1 : 0);
            var dc4 = target.gridCol > caster.gridCol ? 1 : (target.gridCol < caster.gridCol ? -1 : 0);
            var fdConeTargets = [];
            var fdConeCells = [];
            for (var step = 1; step <= 3; step++) {
                var fdBaseR = caster.gridRow + dr4 * step;
                var fdBaseC = caster.gridCol + dc4 * step;
                var fdSpread = step - 1;
                for (var sc = -fdSpread; sc <= fdSpread; sc++) {
                    var fdCr, fdCc;
                    if (dr4 !== 0) { fdCr = fdBaseR; fdCc = fdBaseC + sc; }
                    else { fdCr = fdBaseR + sc; fdCc = fdBaseC; }
                    if (fdCr >= 0 && fdCr < 8 && fdCc >= 0 && fdCc < 7) {
                        fdConeCells.push({row: fdCr, col: fdCc});
                        if (grid[fdCr] && grid[fdCr][fdCc]) {
                            var fdConeUnit = grid[fdCr][fdCc];
                            if (fdConeUnit.hp > 0 && fdConeUnit.side !== caster.side && fdConeTargets.indexOf(fdConeUnit) < 0) {
                                fdConeTargets.push(fdConeUnit);
                            }
                        }
                    }
                }
            }
            if (typeof flashAbilityCells === 'function') flashAbilityCells(fdConeCells, '#ff8800', 400);
            var fdClosest = null, fdClosestDist = 999;
            for (var i = 0; i < fdConeTargets.length; i++) {
                dealDamage(caster, fdConeTargets[i], Math.floor(atk * 2.5), {isAbility:true, triggerOnHit:false});
                addStatus(fdConeTargets[i], 'burn', 4, 30, caster);
                var fdD = getManhattanDist(caster.gridRow, caster.gridCol, fdConeTargets[i].gridRow, fdConeTargets[i].gridCol);
                if (fdD < fdClosestDist) { fdClosestDist = fdD; fdClosest = fdConeTargets[i]; }
            }
            if (fdClosest && fdClosest.hp > 0) addStatus(fdClosest, 'stun', 1.5, 0, caster);
        }
        break;

    case 'kraken':
        // Maelstrom: Whirlpool 2-cell radius, 280% ATK over 4s, pull enemies
        if (target && target.hp > 0) {
            var krTargets = getUnitsInRadius(target.gridRow, target.gridCol, 2, enemies);
            if (typeof flashAbilityCells === 'function') flashAbilityCells(getCellsInRadius(target.gridRow, target.gridCol, 2), '#4488ff', 400);
            for (var i = 0; i < krTargets.length; i++) {
                dealDamage(caster, krTargets[i], Math.floor(atk * 2.8), {isAbility:true, triggerOnHit:false});
                addStatus(krTargets[i], 'slow', 4, 0.30, caster);
                addStatus(krTargets[i], 'root', 2, 0, caster);
            }
        }
        break;

    case 'ancient_treant':
        // Nature's Wrath: 220% ATK, root 2s, heal Earth allies 15% of damage
        if (target && target.hp > 0) {
            var atResult = dealDamage(caster, target, Math.floor(atk * 2.2), {isAbility:true, triggerOnHit:false});
            addStatus(target, 'root', 2, 0, caster);
            var atHealAmt = Math.floor(atResult.totalDamage * 0.15);
            var atEarthAllies = getAlliesOfElement(caster, 'earth');
            for (var i = 0; i < atEarthAllies.length; i++) {
                dealHealing(caster, atEarthAllies[i], atHealAmt);
            }
        }
        break;

    case 'storm_sovereign':
        // Thunder Cleave: Teleport to lowest-HP enemy, 280% ATK, adjacent 100% splash
        var ssTarget = getLowestHpEnemy(enemies);
        if (ssTarget && ssTarget.hp > 0 && combatState) {
            var ssCell = findEmptyCellNear(ssTarget.gridRow, ssTarget.gridCol, grid);
            if (ssCell) moveUnitToCell(caster, ssCell.row, ssCell.col, grid);
            caster.passiveState.customData.repositioned = true;
            dealDamage(caster, ssTarget, Math.floor(atk * 2.8), {isAbility:true, triggerOnHit:false});
            var ssSplash = getUnitsInRadius(ssTarget.gridRow, ssTarget.gridCol, 1, enemies);
            for (var i = 0; i < ssSplash.length; i++) {
                if (ssSplash[i] !== ssTarget) {
                    dealDamage(caster, ssSplash[i], Math.floor(atk * 1.0), {isAbility:true, triggerOnHit:false});
                }
            }
        }
        break;

    case 'thunderbird':
        // Lightning Descent: Dive to lowest-HP enemy 240% ATK, chain, stun 0.8s
        var tbTarget = getLowestHpEnemy(enemies);
        if (tbTarget && tbTarget.hp > 0 && combatState) {
            var tbCell = findEmptyCellNear(tbTarget.gridRow, tbTarget.gridCol, grid);
            if (tbCell) moveUnitToCell(caster, tbCell.row, tbCell.col, grid);
            dealDamage(caster, tbTarget, Math.floor(atk * 2.4), {isAbility:true, triggerOnHit:false});
            var tbNearby = getUnitsInRadius(tbTarget.gridRow, tbTarget.gridCol, 2, enemies);
            var tbChainCount = 0;
            for (var i = 0; i < tbNearby.length; i++) {
                if (tbNearby[i] !== tbTarget && tbNearby[i].hp > 0) {
                    var tbChainMult = tbChainCount === 0 ? 0.6 : 0.4;
                    dealDamage(caster, tbNearby[i], Math.floor(atk * tbChainMult), {isAbility:true, triggerOnHit:false});
                    addStatus(tbNearby[i], 'stun', 0.8, 0, caster);
                    tbChainCount++;
                    if (tbChainCount >= 2) break;
                }
            }
        }
        break;

    case 'siege_engineer':
        // Artillery Strike: Furthest enemy, 280% ATK, crater 40% slow 3s
        var seTarget = getFurthestEnemy(caster, enemies);
        if (seTarget && seTarget.hp > 0) {
            dealDamage(caster, seTarget, Math.floor(atk * 2.8), {isAbility:true, triggerOnHit:false});
            var seCrater = getUnitsInRadius(seTarget.gridRow, seTarget.gridCol, 2, enemies);
            if (typeof flashAbilityCells === 'function') flashAbilityCells(getCellsInRadius(seTarget.gridRow, seTarget.gridCol, 2), '#ffaa00', 400);
            for (var i = 0; i < seCrater.length; i++) {
                addStatus(seCrater[i], 'slow', 3, 0.40, caster);
            }
        }
        break;

    // ===== COST 4 EVOLVED =====

    case 'elder_wyrm':
        // Breath Weapon Enhanced: 4-cell cone, 250% ATK, stun ALL 2s, Burn 30 DPS 4s
        if (target && target.hp > 0) {
            var ewDr = target.gridRow > caster.gridRow ? 1 : (target.gridRow < caster.gridRow ? -1 : 0);
            var ewDc = target.gridCol > caster.gridCol ? 1 : (target.gridCol < caster.gridCol ? -1 : 0);
            var ewConeTargets = [];
            var ewConeCells = [];
            for (var step = 1; step <= 4; step++) {
                var ewBR = caster.gridRow + ewDr * step;
                var ewBC = caster.gridCol + ewDc * step;
                var ewSpread = step - 1;
                for (var sc = -ewSpread; sc <= ewSpread; sc++) {
                    var ewCr2, ewCc2;
                    if (ewDr !== 0) { ewCr2 = ewBR; ewCc2 = ewBC + sc; }
                    else { ewCr2 = ewBR + sc; ewCc2 = ewBC; }
                    if (ewCr2 >= 0 && ewCr2 < 8 && ewCc2 >= 0 && ewCc2 < 7) {
                        ewConeCells.push({row: ewCr2, col: ewCc2});
                        if (grid[ewCr2] && grid[ewCr2][ewCc2]) {
                            var ewCU = grid[ewCr2][ewCc2];
                            if (ewCU.hp > 0 && ewCU.side !== caster.side && ewConeTargets.indexOf(ewCU) < 0) {
                                ewConeTargets.push(ewCU);
                            }
                        }
                    }
                }
            }
            if (typeof flashAbilityCells === 'function') flashAbilityCells(ewConeCells, '#ff6600', 400);
            for (var i = 0; i < ewConeTargets.length; i++) {
                dealDamage(caster, ewConeTargets[i], Math.floor(atk * 2.5), {isAbility:true, triggerOnHit:false});
                addStatus(ewConeTargets[i], 'burn', 4, 30, caster);
                addStatus(ewConeTargets[i], 'stun', 2, 0, caster);
            }
        }
        break;

    case 'abyssal_terror':
        // Maelstrom Enhanced: 400% ATK, pull 2 cells/sec
        if (target && target.hp > 0) {
            var abTargets = getUnitsInRadius(target.gridRow, target.gridCol, 2, enemies);
            if (typeof flashAbilityCells === 'function') flashAbilityCells(getCellsInRadius(target.gridRow, target.gridCol, 2), '#2266ff', 400);
            for (var i = 0; i < abTargets.length; i++) {
                dealDamage(caster, abTargets[i], Math.floor(atk * 4.0), {isAbility:true, triggerOnHit:false});
                addStatus(abTargets[i], 'slow', 4, 0.30, caster);
                addStatus(abTargets[i], 'root', 2, 0, caster);
            }
        }
        break;

    case 'world_sentinel':
        // Nature's Wrath Enhanced: 300% ATK, root 3s, heal Earth allies 25%
        if (target && target.hp > 0) {
            var wsResult = dealDamage(caster, target, Math.floor(atk * 3.0), {isAbility:true, triggerOnHit:false});
            addStatus(target, 'root', 3, 0, caster);
            var wsHeal = Math.floor(wsResult.totalDamage * 0.25);
            var wsEarth = getAlliesOfElement(caster, 'earth');
            for (var i = 0; i < wsEarth.length; i++) {
                dealHealing(caster, wsEarth[i], wsHeal);
            }
        }
        break;

    case 'tempest_emperor':
        // Thunder Cleave Enhanced: 380% ATK, 2-cell splash, resets on kill
        var teTarget = getLowestHpEnemy(enemies);
        if (teTarget && teTarget.hp > 0 && combatState) {
            var teCell = findEmptyCellNear(teTarget.gridRow, teTarget.gridCol, grid);
            if (teCell) moveUnitToCell(caster, teCell.row, teCell.col, grid);
            if (caster.passiveState && caster.passiveState.customData) caster.passiveState.customData.repositioned = true;
            var teResult = dealDamage(caster, teTarget, Math.floor(atk * 3.8), {isAbility:true, triggerOnHit:false});
            var teSplash = getUnitsInRadius(teTarget.gridRow, teTarget.gridCol, 2, enemies);
            for (var i = 0; i < teSplash.length; i++) {
                if (teSplash[i] !== teTarget) {
                    dealDamage(caster, teSplash[i], Math.floor(atk * 1.0), {isAbility:true, triggerOnHit:false});
                }
            }
            if (teResult.killed) caster.currentMana = caster.maxMana; // reset cooldown
        }
        break;

    case 'roc_of_storms':
        // Lightning Descent Enhanced: 330% ATK, stun 1.5s, chain
        var rocTarget = getLowestHpEnemy(enemies);
        if (rocTarget && rocTarget.hp > 0 && combatState) {
            var rocCell = findEmptyCellNear(rocTarget.gridRow, rocTarget.gridCol, grid);
            if (rocCell) moveUnitToCell(caster, rocCell.row, rocCell.col, grid);
            dealDamage(caster, rocTarget, Math.floor(atk * 3.3), {isAbility:true, triggerOnHit:false});
            var rocNearby = getUnitsInRadius(rocTarget.gridRow, rocTarget.gridCol, 2, enemies);
            for (var i = 0; i < rocNearby.length; i++) {
                if (rocNearby[i] !== rocTarget && rocNearby[i].hp > 0) {
                    addStatus(rocNearby[i], 'stun', 1.5, 0, caster);
                    var rocChain = (i === 0) ? 0.6 : 0.4;
                    dealDamage(caster, rocNearby[i], Math.floor(atk * rocChain), {isAbility:true, triggerOnHit:false});
                }
            }
        }
        break;

    case 'war_architect':
        // Artillery Strike Enhanced: 380% ATK, 50% slow crater
        var waTarget = getFurthestEnemy(caster, enemies);
        if (waTarget && waTarget.hp > 0) {
            dealDamage(caster, waTarget, Math.floor(atk * 3.8), {isAbility:true, triggerOnHit:false});
            var waCrater = getUnitsInRadius(waTarget.gridRow, waTarget.gridCol, 2, enemies);
            if (typeof flashAbilityCells === 'function') flashAbilityCells(getCellsInRadius(waTarget.gridRow, waTarget.gridCol, 2), '#ffaa00', 400);
            for (var i = 0; i < waCrater.length; i++) {
                addStatus(waCrater[i], 'slow', 3, 0.50, caster);
            }
        }
        break;

    // ===== COST 5 (Passives — handled via legendary system) =====
    case 'phoenix':
    case 'eternal_phoenix':
    case 'world_tree':
    case 'yggdrasil':
    case 'leviathan':
    case 'primordial_leviathan':
    case 'void_wyrm':
    case 'dimensional_dragon':
    case 'storm_dragon':
    case 'thunder_god':
    case 'titan_lord':
    case 'cosmic_titan':
        break;

    default:
        // Don't log for known passive-only units
        break;
    }

    // Terra Sage / Earthweaver: on ability cast, nearest ally gets shield
    if (key === 'terra_sage' || key === 'earthweaver') {
        var shieldPct = (key === 'earthweaver') ? 0.25 : 0.18;
        var castNearAlly = findNearestAlly(caster, allies);
        if (castNearAlly) grantShield(caster, castNearAlly, Math.floor(castNearAlly.maxHp * shieldPct));
    }

    // Void Wyrm hook: when any ally casts ability, Void Wyrm fires bolt(s)
    if (combatState && key !== 'void_wyrm' && key !== 'dimensional_dragon') {
        var casterTeam = caster.side;
        var vwPool = casterTeam === 'player' ? combatState.playerUnits : combatState.enemyUnits;
        var vwEnemyPool = casterTeam === 'player' ? combatState.enemyUnits : combatState.playerUnits;
        for (var vwi = 0; vwi < vwPool.length; vwi++) {
            var vwUnit = vwPool[vwi];
            if (vwUnit.hp > 0 && (vwUnit.templateKey === 'void_wyrm' || vwUnit.templateKey === 'dimensional_dragon')) {
                var vwBolts = vwUnit.templateKey === 'dimensional_dragon' ? 2 : 1;
                var vwDmgMult = vwUnit.templateKey === 'dimensional_dragon' ? 1.2 : 0.9;
                var vwTargets = getRandomAlive(vwEnemyPool, vwBolts);
                for (var vwj = 0; vwj < vwTargets.length; vwj++) {
                    dealDamage(vwUnit, vwTargets[vwj], Math.floor(vwUnit.attack * vwDmgMult), {isAbility:true, triggerOnHit:false});
                }
            }
        }
    }

    // Log ability cast
    var abilityInfo = ABILITY_DATA[key];
    var legendaryKeys = ['phoenix','eternal_phoenix','world_tree','yggdrasil','leviathan','primordial_leviathan','void_wyrm','dimensional_dragon','storm_dragon','thunder_god','titan_lord','cosmic_titan'];
    if (abilityInfo && legendaryKeys.indexOf(key) < 0 && key !== 'volcano_titan') {
        addCombatLog(caster.name + ' casts ' + abilityInfo.name + '!');
    }
}

// ---- T5 Legendary Ability System ----

function processLegendaryAbilities(allUnits, dt) {
    for (var i = 0; i < allUnits.length; i++) {
        var unit = allUnits[i];
        if (unit.hp <= 0) continue;
        if (unit.maxMana !== 0) continue; // Only T5 units
        if (unit.stasis && unit.stasis > 0) continue;

        if (!unit.legendaryState) {
            unit.legendaryState = {
                revivePending: false, reviveTimer: 0, reviveCount: 0,
                lastKillTime: 0, submerged: false, submergeTimer: 0,
                periodicTimer: 0, customData: {}
            };
        }

        executeLegendaryAbility(unit, dt);
    }
}

function executeLegendaryAbility(unit, dt) {
    switch (unit.templateKey) {
    case 'phoenix':
    case 'eternal_phoenix':
        executeLegendaryPhoenix(unit, dt);
        break;
    case 'leviathan':
    case 'primordial_leviathan':
        executeLegendaryLeviathan(unit, dt);
        break;
    case 'world_tree':
    case 'yggdrasil':
        executeLegendaryWorldTree(unit, dt);
        break;
    case 'void_wyrm':
    case 'dimensional_dragon':
        executeLegendaryVoidWyrm(unit, dt);
        break;
    case 'storm_dragon':
    case 'thunder_god':
        executeLegendaryStormDragon(unit, dt);
        break;
    case 'titan_lord':
    case 'cosmic_titan':
        executeLegendaryTitanLord(unit, dt);
        break;
    }
}

function executeLegendaryPhoenix(unit, dt) {
    if (!unit.legendaryState) return;
    var isEvolved = (unit.templateKey === 'eternal_phoenix');

    // Phoenix revive pending
    if (unit.legendaryState.revivePending) {
        unit.legendaryState.reviveTimer -= dt;
        if (unit.legendaryState.reviveTimer <= 0) {
            var reviveHpPct = isEvolved ? 0.70 : 0.50;
            unit.hp = Math.floor(unit.maxHp * reviveHpPct);
            unit.stasis = 0;
            unit.legendaryState.revivePending = false;
            unit.legendaryState.reviveCount++;
            unit.phoenixReviveUsed = true; // prevent dealDamage from re-triggering

            // Double aura timer
            if (unit.passiveState && unit.passiveState.customData) {
                unit.passiveState.customData.doubleAuraTimer = 6;
            }

            // Explosion on revive
            if (combatState) {
                var reviveEnemies = unit.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
                var reviveTargets = getUnitsInRadius(unit.gridRow, unit.gridCol, 2, reviveEnemies);
                var reviveDmgMult = isEvolved ? 2.5 : 1.5;
                for (var i = 0; i < reviveTargets.length; i++) {
                    dealDamage(unit, reviveTargets[i], Math.floor(unit.attack * reviveDmgMult), {isAbility:true, triggerOnHit:false});
                }
                addCombatLog(unit.name + ' rises from the ashes!');
            }
        }
    }

    // Decrement double aura timer
    if (unit.passiveState && unit.passiveState.customData && unit.passiveState.customData.doubleAuraTimer) {
        unit.passiveState.customData.doubleAuraTimer -= dt;
        if (unit.passiveState.customData.doubleAuraTimer <= 0) {
            unit.passiveState.customData.doubleAuraTimer = 0;
        }
    }
}

function executeLegendaryLeviathan(unit, dt) {
    if (!unit.legendaryState || !combatState) return;
    var isEvolved = (unit.templateKey === 'primordial_leviathan');

    // Tidal Guardian: Water allies aura buff (applied in aura passives, but shield at init)
    if (!unit.legendaryState.customData.shieldGranted) {
        var shieldAmt = isEvolved ? 400 : 200;
        grantShield(unit, unit, shieldAmt);
        unit.legendaryState.customData.shieldGranted = true;

        // Apply Water ally buffs
        var levWaterAllies = getAlliesOfElement(unit, 'water');
        var maxHpBuff = isEvolved ? 0.15 : 0.12;
        var drBuff = isEvolved ? 0.12 : 0.08;
        for (var i = 0; i < levWaterAllies.length; i++) {
            var ally = levWaterAllies[i];
            var bonusHp = Math.floor(ally.maxHp * maxHpBuff);
            ally.maxHp += bonusHp;
            ally.hp += bonusHp;
            addStatus(ally, 'drMod', 999, drBuff, unit);
        }
    }
}

function executeLegendaryWorldTree(unit, dt) {
    if (!unit.legendaryState || !combatState) return;
    var isEvolved = (unit.templateKey === 'yggdrasil');

    // Bloom of Life periodic
    if (!unit.legendaryState.customData.bloomTimer) unit.legendaryState.customData.bloomTimer = 0;
    unit.legendaryState.customData.bloomTimer += dt;
    var bloomInterval = isEvolved ? 6 : 8;
    var bloomTargetCount = isEvolved ? 4 : 3;
    var bloomAtkMult = isEvolved ? 3.5 : 2.5;
    var overhealShieldPct = isEvolved ? 0.8 : 0.6;

    if (unit.legendaryState.customData.bloomTimer >= bloomInterval) {
        unit.legendaryState.customData.bloomTimer -= bloomInterval;
        var wtAllies = unit.side === 'player' ? combatState.playerUnits : combatState.enemyUnits;
        var lowestHpAllies = getLowestHpUnits(wtAllies, bloomTargetCount);
        for (var i = 0; i < lowestHpAllies.length; i++) {
            var ally = lowestHpAllies[i];
            var healAmt = Math.floor(unit.attack * bloomAtkMult);
            // Earth ally bonus: +10% healing
            if (ally.element === 'earth') healAmt = Math.floor(healAmt * 1.1);
            var hpBefore = ally.hp;
            dealHealing(unit, ally, healAmt);
            var actualHeal = ally.hp - hpBefore;
            var overheal = healAmt - actualHeal;
            if (overheal > 0) {
                grantShield(unit, ally, Math.floor(overheal * overhealShieldPct));
            }
        }
        addCombatLog(unit.name + ' triggers Bloom of Life!');
    }
}

function executeLegendaryVoidWyrm(unit, dt) {
    // Dimensional Rift is event-driven (fires on ally ability cast)
    // Handled in executeAbility() via the Void Wyrm hook
    // Nothing to do here in periodic processing
}

function executeLegendaryStormDragon(unit, dt) {
    if (!unit.legendaryState || !combatState) return;
    var isEvolved = (unit.templateKey === 'thunder_god');

    // Cataclysmic Storm periodic
    if (!unit.legendaryState.customData.stormTimer) unit.legendaryState.customData.stormTimer = 0;
    unit.legendaryState.customData.stormTimer += dt;
    var stormInterval = isEvolved ? 4.5 : 6;
    var stormDmgMult = isEvolved ? 4.5 : 3.0;

    if (unit.legendaryState.customData.stormTimer >= stormInterval) {
        unit.legendaryState.customData.stormTimer -= stormInterval;
        var sdEnemies = unit.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
        var sdTarget = getHighestAtkUnits(sdEnemies, 1)[0];
        if (sdTarget && sdTarget.hp > 0) {
            dealDamage(unit, sdTarget, Math.floor(unit.attack * stormDmgMult), {isAbility:true, triggerOnHit:false});
            // Chain to nearby enemies
            var sdChain = getUnitsInRadius(sdTarget.gridRow, sdTarget.gridCol, 2, sdEnemies);
            for (var i = 0; i < sdChain.length; i++) {
                if (sdChain[i] !== sdTarget && sdChain[i].hp > 0) {
                    var chainDmg = Math.floor(unit.attack * 1.5);
                    // 50% crit chance on chains
                    if (Math.random() < 0.5) chainDmg = Math.floor(chainDmg * 1.5);
                    dealDamage(unit, sdChain[i], chainDmg, {isAbility:true, triggerOnHit:false});
                }
            }
            addCombatLog(unit.name + ' triggers Cataclysmic Storm!');

            // On crit, buff Lightning allies (Superconductor on_attack part)
            var sdAllies = unit.side === 'player' ? combatState.playerUnits : combatState.enemyUnits;
            var critAtkBonus = isEvolved ? 0.40 : 0.25;
            if (Math.random() < (unit.critChance || 0.25)) {
                var sdLightning = getAlliesOfElement(unit, 'lightning');
                var sdNearby = getUnitsInRadius(unit.gridRow, unit.gridCol, 3, sdLightning);
                for (var j = 0; j < sdNearby.length; j++) {
                    addStatus(sdNearby[j], 'atkBuff', 3, critAtkBonus, unit);
                }
                // Thunder God evolved: chain strike enemies within 3 cells for 30% ATK
                if (isEvolved) {
                    var tgChainEnemies = getUnitsInRadius(unit.gridRow, unit.gridCol, 3, sdEnemies);
                    for (var j = 0; j < tgChainEnemies.length; j++) {
                        dealDamage(unit, tgChainEnemies[j], Math.floor(unit.attack * 0.30), {isTrueDamage:true, canCrit:false, canDodge:false, applyElement:false, triggerOnHit:false});
                    }
                }
            }
        }
    }
}

function executeLegendaryTitanLord(unit, dt) {
    if (!unit.legendaryState || !combatState) return;
    var isEvolved = (unit.templateKey === 'cosmic_titan');

    // Earthshaker periodic
    if (!unit.legendaryState.customData.shakeTimer) unit.legendaryState.customData.shakeTimer = 0;
    unit.legendaryState.customData.shakeTimer += dt;
    var shakeInterval = isEvolved ? 5.5 : 7;
    var shakeDmgMult = isEvolved ? 4.8 : 3.2;
    var rootDuration = isEvolved ? 3 : 2;
    var vulnDuration = isEvolved ? 6 : 5;
    var allyAtkDuration = isEvolved ? 6 : 5;

    if (unit.legendaryState.customData.shakeTimer >= shakeInterval) {
        unit.legendaryState.customData.shakeTimer -= shakeInterval;
        var ttEnemies = unit.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
        var ttTargets = getUnitsInRadius(unit.gridRow, unit.gridCol, 2, ttEnemies);
        if (typeof flashAbilityCells === 'function') flashAbilityCells(getCellsInRadius(unit.gridRow, unit.gridCol, 2), '#ffaa00', 400);
        for (var i = 0; i < ttTargets.length; i++) {
            dealDamage(unit, ttTargets[i], Math.floor(unit.attack * shakeDmgMult), {isAbility:true, triggerOnHit:false});
            addStatus(ttTargets[i], 'root', rootDuration, 0, unit);
            addStatus(ttTargets[i], 'vulnerability', vulnDuration, 0.20, unit);
        }
        // Force allies gain ATK buff
        var ttForceAllies = getAlliesOfElement(unit, 'force');
        for (var i = 0; i < ttForceAllies.length; i++) {
            addStatus(ttForceAllies[i], 'atkBuff', allyAtkDuration, 0.15, unit);
        }
        addCombatLog(unit.name + ' triggers Earthshaker!');
    }

    // CC immunity timer (Cosmic Titan)
    if (isEvolved && unit.passiveState && unit.passiveState.customData && unit.passiveState.customData.ccImmunityTimer) {
        unit.passiveState.customData.ccImmunityTimer -= dt;
        if (unit.passiveState.customData.ccImmunityTimer > 0 && combatState) {
            unit.ccImmuneUntil = combatState.elapsed + 0.2;
        }
    }
}

function combatTick(dt) {
    if (!combatState || !combatState.running) return;

    combatState.elapsed += dt;

    // Timeout: 180s for boss fights, 60s for normal
    var timeLimit = combatState.bossUnit ? 180 : 60;
    if (combatState.elapsed > timeLimit) {
        combatState.running = false;
        combatState.result = 'draw';
        return;
    }

    var players = combatState.playerUnits;
    var enemies = combatState.enemyUnits;

    // Tick death animations
    var allForDeath = combatState.allUnits;
    for (var di = 0; di < allForDeath.length; di++) {
        var du = allForDeath[di];
        if (du.deathAnimating && !du.deathComplete) {
            du.deathTimer -= dt;
            if (du.deathTimer <= 0) {
                du.deathComplete = true;
                // Add death marker
                if (!combatState.deathMarkers) combatState.deathMarkers = {};
                combatState.deathMarkers[du.gridRow + ',' + du.gridCol] = '\ud83d\udc80';
                // Remove from grid
                if (du.isBoss && du.bossSize) {
                    for (var dbr = 0; dbr < du.bossSize[0]; dbr++) {
                        for (var dbc = 0; dbc < du.bossSize[1]; dbc++) {
                            var ddr = du.gridRow + dbr, ddc = du.gridCol + dbc;
                            if (combatState.grid[ddr] && combatState.grid[ddr][ddc] === du) {
                                combatState.grid[ddr][ddc] = null;
                            }
                        }
                    }
                } else if (combatState.grid[du.gridRow] && combatState.grid[du.gridRow][du.gridCol] === du) {
                    combatState.grid[du.gridRow][du.gridCol] = null;
                }
            }
        }
    }

    // Check win/loss (don't count dying units as alive)
    var playersAlive = 0;
    var enemiesAlive = 0;
    for (var i = 0; i < players.length; i++) { if (players[i].hp > 0 && !players[i].deathAnimating) playersAlive++; }
    for (var j = 0; j < enemies.length; j++) { if (enemies[j].hp > 0 && !enemies[j].deathAnimating) enemiesAlive++; }

    if (enemiesAlive === 0) {
        combatState.running = false;
        combatState.result = 'win';
        return;
    }
    // Boss win condition: boss dead = win even if minions alive
    if (combatState.bossUnit && combatState.bossUnit.hp <= 0) {
        combatState.running = false;
        combatState.result = 'win';
        return;
    }
    if (playersAlive === 0) {
        combatState.running = false;
        combatState.result = 'loss';
        return;
    }

    // Regen: heal allies by regenPct of maxHp per second (Water synergy, Warmog's, set regen)
    for (var rg = 0; rg < players.length; rg++) {
        var ru = players[rg];
        if (ru.hp > 0 && ru.regenPct && ru.hp < ru.maxHp) {
            var regenAmt = Math.floor(ru.maxHp * ru.regenPct * dt);
            if (regenAmt > 0) dealHealing(ru, ru, regenAmt);
        }
        // Item special ticks (warmog, setRegen, etc.)
        if (ru.hp > 0 && ru.itemSpecials) {
            for (var ws = 0; ws < ru.itemSpecials.length; ws++) {
                var spec = ru.itemSpecials[ws];
                if ((spec.effect === 'warmogRegen' || spec.effect === 'setRegen') && ru.hp < ru.maxHp) {
                    var itemRegenAmt = Math.floor(ru.maxHp * spec.regenPct * dt);
                    if (itemRegenAmt > 0) dealHealing(ru, ru, itemRegenAmt);
                }
            }
        }
        // Stasis (Zhonya's): decrement timer
        if (ru.stasis && ru.stasis > 0) {
            ru.stasis -= dt;
            if (ru.stasis <= 0) ru.stasis = 0;
        }
        // Stasis trigger check (onLowHP abilities)
        if (ru.hp > 0 && ru.abilities && !ru.stasisUsed) {
            for (var ab = 0; ab < ru.abilities.length; ab++) {
                var ability = ru.abilities[ab];
                if (ability.effect === 'stasis' && ru.hp / ru.maxHp <= ability.trigger) {
                    ru.stasis = ability.duration;
                    ru.stasisUsed = true;
                }
            }
        }
        // Titan's Heart: bonus DR below threshold
        if (ru.hp > 0 && ru.abilities) {
            for (var th = 0; th < ru.abilities.length; th++) {
                var tAbility = ru.abilities[th];
                if (tAbility.effect === 'titanResolve') {
                    if (ru.hp / ru.maxHp < tAbility.hpThreshold) {
                        if (!ru.titanResolveActive) {
                            ru.damageReduction = (ru.damageReduction || 0) + tAbility.bonusDR;
                            ru.titanResolveActive = true;
                        }
                    } else {
                        if (ru.titanResolveActive) {
                            ru.damageReduction = (ru.damageReduction || 0) - tAbility.bonusDR;
                            ru.titanResolveActive = false;
                        }
                    }
                }
            }
        }
    }

    // Assassin dash on first tick
    if (!combatState.assassinsDashed) {
        combatState.assassinsDashed = true;
        var allForDash = combatState.allUnits;
        for (var ad = 0; ad < allForDash.length; ad++) {
            var au = allForDash[ad];
            if (au.hp > 0 && au.type === 'assassin') {
                var dashPool = au.side === 'player' ? enemies : players;
                performAssassinDash(au, combatState.grid, dashPool);
            }
        }
    }

    // Phoenix/World Tree passive aura timer
    if (!combatState.auraTimer) combatState.auraTimer = 0;
    combatState.auraTimer += dt;
    if (combatState.auraTimer >= 1.0) {
        combatState.auraTimer -= 1.0;
        var allForAura = combatState.allUnits;
        for (var au = 0; au < allForAura.length; au++) {
            var aUnit = allForAura[au];
            if (aUnit.hp <= 0) continue;
            if (aUnit.templateKey === 'phoenix') {
                // Allies within 2 cells gain +10% ATK for 1.5s
                var pAllies = aUnit.side === 'player' ? players : enemies;
                var pNearby = getUnitsInRadius(aUnit.gridRow, aUnit.gridCol, 2, pAllies);
                for (var pa = 0; pa < pNearby.length; pa++) {
                    if (pNearby[pa] !== aUnit && pNearby[pa].hp > 0) {
                        addStatus(pNearby[pa], 'atkBuff', 1.5, 0.1, aUnit);
                    }
                }
            }
            if (aUnit.templateKey === 'world_tree') {
                // Allies within range heal 1% max HP per second
                var wtAllies = aUnit.side === 'player' ? players : enemies;
                for (var wa = 0; wa < wtAllies.length; wa++) {
                    if (wtAllies[wa].hp > 0 && wtAllies[wa].hp < wtAllies[wa].maxHp && wtAllies[wa] !== aUnit) {
                        dealHealing(aUnit, wtAllies[wa], Math.floor(wtAllies[wa].maxHp * 0.01));
                    }
                }
            }
        }
    }

    // Process tick passives (periodic & aura)
    processTickPassives(combatState.allUnits, dt);

    // Process T5 legendary abilities
    processLegendaryAbilities(combatState.allUnits, dt);

    // Process each unit
    var allUnits = combatState.allUnits;
    for (var k = 0; k < allUnits.length; k++) {
        var unit = allUnits[k];
        if (unit.hp <= 0) continue;

        // Process status effects (tick burn, regen, decrement durations)
        processStatusEffects(unit, dt);
        if (unit.hp <= 0) continue; // may have died from burn

        // Boss units: run boss AI instead of normal unit logic
        if (unit.isBoss) {
            // Decrement stasis timer for boss (used during phase transitions)
            if (unit.stasis && unit.stasis > 0) {
                unit.stasis -= dt;
                if (unit.stasis <= 0) unit.stasis = 0;
            }
            processBossTick(unit, dt);
            // Boss auto-attack: find nearest player in range
            if (unit.hp > 0 && !unit.phaseTransitioning && !(unit.stasis && unit.stasis > 0)) {
                unit.attackCooldown = (unit.attackCooldown || 0) - dt;
                if (unit.attackCooldown <= 0) {
                    var bossTargetPool = combatState.playerUnits;
                    var bossTarget = null;
                    var bestBossDist = 999;
                    for (var bt = 0; bt < bossTargetPool.length; bt++) {
                        if (bossTargetPool[bt].hp > 0) {
                            var bd = getDistToBoss(bossTargetPool[bt], unit);
                            if (bd < bestBossDist) { bestBossDist = bd; bossTarget = bossTargetPool[bt]; }
                        }
                    }
                    if (bossTarget && bestBossDist <= (unit.range || 1)) {
                        performAttack(unit, bossTarget);
                        unit.attackCooldown = unit.attackSpd || 1.0;
                    }
                }
            }
            continue; // skip normal movement/attack logic for bosses
        }

        // Phoenix revive check
        if (unit.phoenixRevivePending && unit.stasis <= 0) {
            unit.phoenixRevivePending = false;
            unit.deathAnimating = false;
            unit.deathComplete = false;
            unit.deathTimer = 0;
            unit.hp = Math.floor(unit.maxHp * 0.5);
            // Visual: golden rebirth text
            if (typeof spawnDamageNumber === 'function' && (!combatState || !combatState.autoBattle)) {
                spawnDamageNumber(unit.gridRow, unit.gridCol, '\ud83d\udd25 REBIRTH!', 'crit');
            }
            // AoE damage on revival
            var reviveEnemies = unit.side === 'player' ? enemies : players;
            for (var ri = 0; ri < reviveEnemies.length; ri++) {
                if (reviveEnemies[ri].hp > 0) {
                    dealDamage(unit, reviveEnemies[ri], Math.floor(unit.attack * 2.5), {isAbility:true, isTrueDamage:true, triggerOnHit:false});
                }
            }
            addCombatLog(unit.name + ' rises from the ashes!');
        }

        // Skip action if in stasis
        if (unit.stasis && unit.stasis > 0) continue;

        // Stun/Freeze: skip turn entirely
        if (hasStatus(unit, 'stun') || hasStatus(unit, 'freeze')) continue;

        // Casting check: if currently casting, count down timer
        if (unit.isCasting) {
            unit.castTimer -= dt;
            if (unit.castTimer <= 0) {
                executeAbility(unit);
                unit.currentMana = 0;
                unit.isCasting = false;
                unit.attackCooldown = unit.attackSpd || 1.0;
                // Post-cast passive effects (gale_dancer, stormweaver)
                if (unit.passiveState && unit.passiveState.customData.postCastMoveSpeed) {
                    addStatus(unit, 'moveSpeedBuff', unit.passiveState.customData.postCastDuration || 3, unit.passiveState.customData.postCastMoveSpeed, unit);
                }
                if (unit.passiveState && unit.passiveState.customData.postCastAtkSpeed) {
                    addStatus(unit, 'spdMod', unit.passiveState.customData.postCastDuration || 3, unit.passiveState.customData.postCastAtkSpeed, unit);
                }
            }
            continue; // skip movement and attacking while casting
        }

        // Taunt: override target
        var tauntEffect = null;
        for (var te = 0; te < (unit.statusEffects ? unit.statusEffects.length : 0); te++) {
            if (unit.statusEffects[te].type === 'taunt' && unit.statusEffects[te].source && unit.statusEffects[te].source.hp > 0) {
                tauntEffect = unit.statusEffects[te];
                break;
            }
        }

        // Find target
        var targetPool = unit.side === 'player' ? enemies : players;
        if (tauntEffect) {
            unit.target = tauntEffect.source;
        } else if (!unit.target || unit.target.hp <= 0) {
            unit.target = findTarget(unit, targetPool);
        }
        if (!unit.target) continue;

        // Root: cannot move, CAN attack if in range
        var isRooted = hasStatus(unit, 'root');

        // Movement: if not in range, try to move toward target
        if (!isInRange(unit, unit.target)) {
            if (!isRooted) {
                unit.moveCooldown = (unit.moveCooldown || 0) - dt;
                if (unit.moveCooldown <= 0) {
                    moveUnit(unit, combatState.grid);
                    // Bleed: bonus damage tick on movement
                    if (hasStatus(unit, 'bleed')) {
                        for (var bi = 0; bi < unit.statusEffects.length; bi++) {
                            if (unit.statusEffects[bi].type === 'bleed' && unit.statusEffects[bi].source) {
                                dealDamage(unit.statusEffects[bi].source, unit, unit.statusEffects[bi].value,
                                    {isTrueDamage:true, canCrit:false, canDodge:false, applyElement:false, triggerOnHit:false});
                            }
                        }
                    }
                    var speed = getMoveSpeed(unit);
                    var slowPct = getStatusValue(unit, 'slow');
                    var effectiveMoveSpd = speed * (1 - slowPct);
                    unit.moveCooldown = (effectiveMoveSpd > 0) ? (1.0 / effectiveMoveSpd) : 0.5;
                }
            }
            continue; // Can't attack while moving (or rooted out of range)
        }

        // Attack cooldown
        unit.attackCooldown -= dt;
        if (unit.attackCooldown <= 0) {
            performAttack(unit, unit.target);
            // Apply speed modifier status
            var spdMod = getStatusValue(unit, 'spdMod');
            var effectiveAtkSpd = (unit.attackSpd || 1.0) * (1 - spdMod); // spdMod 0.2 = 20% faster
            effectiveAtkSpd = Math.max(effectiveAtkSpd, 0.2); // minimum 0.2s between attacks
            unit.attackCooldown = effectiveAtkSpd;

            // Mana generation on auto-attack
            if (unit.maxMana > 0) {
                unit.currentMana = Math.min(unit.maxMana, unit.currentMana + 10);
            }

            // Check if mana is full → start casting (blocked by silence)
            if (unit.maxMana > 0 && unit.currentMana >= unit.maxMana && !unit.isCasting) {
                if (!hasStatus(unit, 'silence')) {
                    unit.isCasting = true;
                    unit.castTimer = 0.3;
                }
                // If silenced, mana stays capped at maxMana, ability waits
            }
        }
    }

    // Clean up dead units from grid (only those that finished death animation or have no animation)
    for (var ck = 0; ck < allUnits.length; ck++) {
        var cu = allUnits[ck];
        if (cu.hp <= 0 && cu.deathComplete) {
            if (cu.isBoss && cu.bossSize) {
                for (var br = 0; br < cu.bossSize[0]; br++) {
                    for (var bc = 0; bc < cu.bossSize[1]; bc++) {
                        var ddr2 = cu.gridRow + br, ddc2 = cu.gridCol + bc;
                        if (combatState.grid[ddr2] && combatState.grid[ddr2][ddc2] === cu) {
                            combatState.grid[ddr2][ddc2] = null;
                        }
                    }
                }
            } else if (combatState.grid[cu.gridRow] && combatState.grid[cu.gridRow][cu.gridCol] === cu) {
                combatState.grid[cu.gridRow][cu.gridCol] = null;
            }
        }
    }
}

function findTarget(unit, enemies) {
    var alive = [];
    for (var i = 0; i < enemies.length; i++) {
        if (enemies[i].hp > 0) alive.push(enemies[i]);
    }
    if (alive.length === 0) return null;

    if (unit.type === 'healer') {
        // Target lowest HP% ally that is not at full HP
        var allies = unit.side === 'player' ? combatState.playerUnits : combatState.enemyUnits;
        var lowestHPAlly = null;
        var lowestHPPct = 1.0;
        for (var a = 0; a < allies.length; a++) {
            if (allies[a].hp > 0 && allies[a].hp < allies[a].maxHp) {
                var pct = allies[a].hp / allies[a].maxHp;
                if (pct < lowestHPPct || (pct === lowestHPPct && (!lowestHPAlly || allies[a].gridRow < lowestHPAlly.gridRow || (allies[a].gridRow === lowestHPAlly.gridRow && allies[a].gridCol < lowestHPAlly.gridCol)))) {
                    lowestHPPct = pct;
                    lowestHPAlly = allies[a];
                }
            }
        }
        if (lowestHPAlly) return lowestHPAlly;
        // Fallback: closest enemy
        return findClosestByGrid(unit, alive);
    }

    if (unit.type === 'assassin') {
        // Target lowest HP enemy in back rows
        var backRowMin, backRowMax;
        if (unit.side === 'player') {
            backRowMin = 0; backRowMax = 1; // enemy back rows
        } else {
            backRowMin = 6; backRowMax = 7; // player back rows
        }
        var backlineTarget = null;
        for (var b = 0; b < alive.length; b++) {
            if (alive[b].gridRow >= backRowMin && alive[b].gridRow <= backRowMax) {
                if (!backlineTarget || alive[b].hp < backlineTarget.hp) {
                    backlineTarget = alive[b];
                }
            }
        }
        if (backlineTarget) return backlineTarget;
        // Fallback: closest enemy
        return findClosestByGrid(unit, alive);
    }

    // Default: closest enemy by Manhattan distance
    return findClosestByGrid(unit, alive);
}

function findClosestByGrid(unit, targets) {
    var best = null;
    var bestDist = 999;
    for (var i = 0; i < targets.length; i++) {
        var t = targets[i];
        var dist = (t.isBoss && t.bossSize) ? getDistToBoss(unit, t) : getManhattanDist(unit.gridRow, unit.gridCol, t.gridRow, t.gridCol);
        if (dist < bestDist || (dist === bestDist && best && (t.gridRow < best.gridRow || (t.gridRow === best.gridRow && t.gridCol < best.gridCol)))) {
            bestDist = dist;
            best = t;
        }
    }
    return best;
}

// ---- Unified Damage Pipeline ----

function findNearestAlive(source, pool) {
    var best = null;
    var bestDist = 999;
    for (var i = 0; i < pool.length; i++) {
        if (pool[i].hp <= 0) continue;
        var dist = getManhattanDist(source.gridRow, source.gridCol, pool[i].gridRow, pool[i].gridCol);
        if (dist < bestDist) {
            bestDist = dist;
            best = pool[i];
        }
    }
    return best;
}

function grantShield(source, target, amount) {
    target.shield = (target.shield || 0) + amount;
    if (source && source.combatStats) source.combatStats.shieldGiven += amount;
    if (typeof spawnDamageNumber === 'function' && (!combatState || !combatState.autoBattle) && amount > 0) {
        spawnDamageNumber(target.gridRow, target.gridCol, '+' + amount + ' \ud83d\udee1\ufe0f', 'shield');
    }
}

function dealHealing(source, target, amount) {
    // Healing reduction from burn, poison, and healReduction status
    var reduction = 0;
    if (hasStatus(target, 'burn')) reduction += 0.25;
    if (hasStatus(target, 'poison')) reduction += 0.50;
    if (hasStatus(target, 'healReduction')) {
        reduction += getStatusValue(target, 'healReduction');
    }
    if (reduction > 0) amount = Math.floor(amount * (1 - Math.min(reduction, 0.9)));

    var actualHeal = Math.min(amount, target.maxHp - target.hp);
    target.hp += actualHeal;
    if (source && source.combatStats) {
        source.combatStats.healingDone += actualHeal;
    }
    if (typeof spawnDamageNumber === 'function' && (!combatState || !combatState.autoBattle) && actualHeal > 0) {
        spawnDamageNumber(target.gridRow, target.gridCol, '+' + actualHeal, 'heal');
    }
    return { healed: actualHeal };
}

function dealDamage(source, target, rawDamage, options) {
    // Invulnerable during stasis
    if (target.stasis && target.stasis > 0) return { totalDamage: 0, hpDamage: 0, shieldDamage: 0, wasCrit: false, wasDodged: false, killed: false };
    if (!options) options = {};
    var isAutoAttack = options.isAutoAttack || false;
    var isTrueDamage = options.isTrueDamage || false;
    var canCrit = options.canCrit !== undefined ? options.canCrit : true;
    var canDodge = options.canDodge !== undefined ? options.canDodge : true;
    var applyElement = options.applyElement !== undefined ? options.applyElement : true;
    var triggerOnHit = options.triggerOnHit !== undefined ? options.triggerOnHit : true;

    var dmg = rawDamage;
    var wasCrit = false;
    var wasDodged = false;
    var shieldAbsorbed = 0;

    // Step 2: Element Multiplier
    if (applyElement && typeof getElementMultiplier === 'function' && source.element && target.element) {
        var elemMult = getElementMultiplier(source.element, target.element);
        if (source.abilities && elemMult > 1.0) {
            for (var em = 0; em < source.abilities.length; em++) {
                if (source.abilities[em].effect === 'elemMastery') {
                    elemMult += source.abilities[em].elemDmgBoost;
                }
            }
        }
        if (target.elemResist && elemMult > 1.0) {
            elemMult = 1.0 + (elemMult - 1.0) * (1 - target.elemResist);
        }
        dmg = Math.floor(dmg * elemMult);
    }

    // Step 3: Critical Strike
    if (canCrit && source.critChance && Math.random() < source.critChance) {
        dmg = Math.floor(dmg * 1.5);
        wasCrit = true;
    }

    // Step 4: Damage Reduction (including drMod status)
    var totalDR = target.damageReduction || 0;
    var drModVal = getStatusValue(target, 'drMod');
    if (drModVal > 0) totalDR += drModVal;
    // AoE DR for golem/iron_colossus
    if (options && options.isAbility && target.passiveState && target.passiveState.customData && target.passiveState.customData.aoeDR) {
        totalDR += target.passiveState.customData.aoeDR;
    }
    totalDR = Math.min(totalDR, 0.75);
    if (!isTrueDamage && totalDR > 0) {
        dmg = Math.floor(dmg * (1 - totalDR));
    }
    if (dmg < 1) dmg = 1;

    // Freeze vulnerability: +20% damage
    if (hasStatus(target, 'freeze')) {
        dmg = Math.floor(dmg * 1.2);
    }
    // Vulnerability status
    var vulnPct = getStatusValue(target, 'vulnerability');
    if (vulnPct > 0) dmg = Math.floor(dmg * (1 + vulnPct));

    // Step 5: Dodge Check (highest value wins between base and buff)
    var totalDodge = Math.max(target.dodgeChance || 0, getStatusValue(target, 'dodgeBuff'));
    if (canDodge && totalDodge > 0 && Math.random() < totalDodge) {
        wasDodged = true;
        if (typeof spawnDamageNumber === 'function' && (!combatState || !combatState.autoBattle)) {
            spawnDamageNumber(target.gridRow, target.gridCol, 'DODGE', 'dodge');
        }
        return {
            totalDamage: 0,
            hpDamage: 0,
            shieldDamage: 0,
            wasCrit: false,
            wasDodged: true,
            killed: false
        };
    }

    // Step 6: Shield Absorption
    if (target.shield && target.shield > 0) {
        shieldAbsorbed = Math.min(target.shield, dmg);
        target.shield -= shieldAbsorbed;
        dmg -= shieldAbsorbed;
    }

    // Process on-hit passive (with reentry guard)
    if (combatState && source && !source._processingPassive) {
        processOnHitPassive(target, source, dmg + shieldAbsorbed, combatState.allUnits);
    }

    // Step 7: Apply to HP
    target.hp -= dmg;
    if (target.hp < 0) target.hp = 0;
    if (target.combatStats) target.combatStats.damageTaken += (dmg + shieldAbsorbed);
    if (source.combatStats) source.combatStats.damageDealt += (dmg + shieldAbsorbed);

    // Spawn floating damage number
    if (typeof spawnDamageNumber === 'function' && (!combatState || !combatState.autoBattle) && (dmg + shieldAbsorbed) > 0) {
        var numType = 'normal';
        if (wasCrit) numType = 'crit';
        else if (options.isTrueDamage && !options.isAutoAttack) numType = 'dot';
        else if (options.isAbility) numType = 'ability';
        else if (source && source.isBoss) numType = 'boss';
        var numText = '' + (dmg + shieldAbsorbed);
        if (wasCrit) numText += '!';
        spawnDamageNumber(target.gridRow, target.gridCol, numText, numType);
    }

    // Mana generation on taking damage
    if (target.maxMana > 0 && (dmg + shieldAbsorbed) > 0) {
        var manaFromDmg = Math.floor(((dmg + shieldAbsorbed) / target.maxHp) * 50);
        manaFromDmg = Math.max(1, manaFromDmg);
        target.currentMana = Math.min(target.maxMana, target.currentMana + manaFromDmg);
    }

    // Reflect status: melee attacker takes reflect damage back
    if (hasStatus(target, 'reflect') && !options.isReflect && source) {
        var reflectPct = getStatusValue(target, 'reflect');
        var reflectDmg = Math.floor((dmg + shieldAbsorbed) * reflectPct);
        if (reflectDmg > 0 && getManhattanDist(source.gridRow, source.gridCol, target.gridRow, target.gridCol) <= 1) {
            dealDamage(target, source, reflectDmg, {isTrueDamage:true, canCrit:false, canDodge:false, applyElement:false, triggerOnHit:false, isReflect:true});
        }
    }

    // Step 8: On-Hit Triggers
    if (triggerOnHit && isAutoAttack && source.itemSpecials) {
        var onHitOpts = {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false};

        for (var sp = 0; sp < source.itemSpecials.length; sp++) {
            var spec = source.itemSpecials[sp];
            if (spec.effect === 'bork' && target.hp > 0) {
                dealDamage(source, target, Math.floor(target.maxHp * spec.pctMaxHp), onHitOpts);
            }
            if (spec.effect === 'setBurn' && target.hp > 0) {
                dealDamage(source, target, spec.burnDPS, onHitOpts);
            }
        }
    }

    // Burn damage (Fire synergy) on auto-attack — uses burnDps (new) or burnDamage (legacy)
    var burnDmg = source.burnDps || source.burnDamage || 0;
    if (triggerOnHit && isAutoAttack && burnDmg > 0 && target.hp > 0) {
        dealDamage(source, target, burnDmg, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
    }

    // Lifesteal on auto-attack
    if (triggerOnHit && isAutoAttack && source.abilities) {
        var totalDmgDealt = dmg + shieldAbsorbed;
        for (var ls = 0; ls < source.abilities.length; ls++) {
            if (source.abilities[ls].effect === 'lifesteal' && totalDmgDealt > 0) {
                dealHealing(source, source, Math.floor(totalDmgDealt * source.abilities[ls].pct));
            }
        }
    }

    // World Tree trigger: check if any ally dropped below 20% HP
    if (target.hp > 0 && target.hp < target.maxHp * 0.2 && combatState && !combatState.worldTreeTriggered) {
        var wtAllies = target.side === 'player' ? combatState.playerUnits : combatState.enemyUnits;
        var worldTree = null;
        for (var wti = 0; wti < wtAllies.length; wti++) {
            if (wtAllies[wti].hp > 0 && wtAllies[wti].templateKey === 'world_tree') {
                worldTree = wtAllies[wti]; break;
            }
        }
        if (worldTree) {
            combatState.worldTreeTriggered = true;
            for (var wtj = 0; wtj < wtAllies.length; wtj++) {
                if (wtAllies[wtj].hp > 0) {
                    dealHealing(worldTree, wtAllies[wtj], Math.floor(wtAllies[wtj].maxHp * 0.3));
                    clearDebuffs(wtAllies[wtj], 0);
                }
            }
            addCombatLog(worldTree.name + ' triggers Bloom of Life!');
        }
    }

    // Step 9: Death Check & On-Kill Effects
    if (target.hp <= 0) {
        // Check Phoenix revive
        if ((target.templateKey === 'phoenix' || target.templateKey === 'eternal_phoenix') && !target.phoenixReviveUsed) {
            target.phoenixReviveUsed = true;
            target.hp = 1;
            target.stasis = 2.0;
            target.phoenixRevivePending = true;
            // Don't process normal death
        }

        // Check Guardian Angel revive
        if (target.hp <= 0 && target.abilities && !target.reviveUsed) {
            for (var rv = 0; rv < target.abilities.length; rv++) {
                if (target.abilities[rv].effect === 'revive') {
                    target.hp = Math.floor(target.maxHp * target.abilities[rv].revivePct);
                    target.reviveUsed = true;
                    break;
                }
            }
        }

        if (target.hp <= 0) {
            target.hp = 0;

            // Start death animation (or instant in auto-battle)
            if (!target.deathAnimating) {
                target.deathAnimating = true;
                if (combatState && combatState.autoBattle) {
                    target.deathTimer = 0;
                    target.deathComplete = true;
                } else {
                    target.deathTimer = 0.5;
                }
            }

            // Volcano Titan on-death explosion
            if (target.templateKey === 'volcano_titan' && combatState) {
                var vtEnemies = target.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
                var eruTargets = getUnitsInRadius(target.gridRow, target.gridCol, 2, vtEnemies);
                for (var vti = 0; vti < eruTargets.length; vti++) {
                    dealDamage(target, eruTargets[vti], Math.floor(target.attack * 3.0), {isAbility:true, isTrueDamage:true, triggerOnHit:false});
                    addStatus(eruTargets[vti], 'burn', 3, 40, target);
                }
                addCombatLog(target.name + ' erupts on death!');
            }
            if (source.combatStats) source.combatStats.kills++;

            // Process on-kill passive
            if (combatState) {
                processOnKillPassive(source, target, combatState.allUnits);
            }

            // Hand of Justice heal on kill
            if (source.itemSpecials) {
                for (var spk = 0; spk < source.itemSpecials.length; spk++) {
                    var specK = source.itemSpecials[spk];
                    if (specK.effect === 'hojHeal') {
                        dealHealing(source, source, Math.floor(source.maxHp * specK.healPct));
                    }
                }
            }

            // Frenzy stacks on kill
            if (source.abilities) {
                for (var fz = 0; fz < source.abilities.length; fz++) {
                    if (source.abilities[fz].effect === 'frenzy') {
                        var frenzyAbility = source.abilities[fz];
                        if (!source.frenzyStacks) source.frenzyStacks = 0;
                        if (source.frenzyStacks < frenzyAbility.stackMax) {
                            source.attackSpd += frenzyAbility.atkSpdBonus;
                            source.frenzyStacks++;
                        }
                    }
                }
            }

            // Fire kill explosion — killExplosionPct (% of target maxHP) or legacy killAoE (flat damage)
            var killExplosion = 0;
            if (source.killExplosionPct) {
                killExplosion = Math.floor(target.maxHp * source.killExplosionPct);
            } else if (source.killAoE) {
                killExplosion = source.killAoE;
            }
            if (killExplosion > 0 && combatState) {
                var enemyPool = source.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
                for (var a = 0; a < enemyPool.length; a++) {
                    if (enemyPool[a].hp > 0 && enemyPool[a] !== target) {
                        dealDamage(source, enemyPool[a], killExplosion, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
                    }
                }
            }
        }
    }

    return {
        totalDamage: dmg + shieldAbsorbed,
        hpDamage: dmg,
        shieldDamage: shieldAbsorbed,
        wasCrit: wasCrit,
        wasDodged: wasDodged,
        killed: target.hp <= 0
    };
}

function performAttack(attacker, target) {
    if (!attacker || !target || target.hp <= 0) return;

    // Target in stasis: cannot take damage
    if (target.stasis && target.stasis > 0) return;

    // Healer heals ally instead of attacking
    if (attacker.type === 'healer' && target.side === attacker.side) {
        var healAmt = attacker.attack || 10;
        if (attacker.healBonus) healAmt = Math.floor(healAmt * (1 + attacker.healBonus));
        dealHealing(attacker, target, healAmt);

        // Archangel's Staff: healer deals damage to nearest enemy when healing
        if (attacker.itemSpecials) {
            for (var as = 0; as < attacker.itemSpecials.length; as++) {
                if (attacker.itemSpecials[as].effect === 'archangelDmg' && combatState) {
                    var arcDmg = Math.floor(healAmt * attacker.itemSpecials[as].damagePct);
                    var enemyPool = attacker.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
                    var arcTarget = findNearestAlive(attacker, enemyPool);
                    if (arcTarget) {
                        dealDamage(attacker, arcTarget, arcDmg, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
                    }
                }
            }
        }
        return;
    }

    // Blind check (only auto-attacks, not abilities)
    if (hasStatus(attacker, 'blind') && Math.random() < 0.5) {
        addCombatLog(attacker.name + ' misses! (Blind)');
        // Still generate mana for attacking
        if (attacker.maxMana > 0) {
            attacker.currentMana = Math.min(attacker.maxMana, attacker.currentMana + 10);
        }
        return; // miss, no damage
    }

    // Process on-attack passive before damage
    if (combatState) {
        processOnAttackPassive(attacker, target, combatState.allUnits);
    }

    // Normal attack: go through the damage pipeline
    var rawDmg = attacker.attack || 10;

    // Apply ATK buff and debuff separately (multiplicative between them)
    var atkBuffPa = getStatusValue(attacker, 'atkBuff');
    var atkDebuffPa = getStatusValue(attacker, 'atkMod');
    if (atkBuffPa !== 0 || atkDebuffPa !== 0) rawDmg = Math.floor(rawDmg * (1 + atkBuffPa) * (1 + atkDebuffPa));

    // Apply Zephyr Scout's nextAtkMult buff
    if (attacker.abilityBuffs && attacker.abilityBuffs.nextAtkMult) {
        rawDmg = Math.floor(rawDmg * attacker.abilityBuffs.nextAtkMult);
        delete attacker.abilityBuffs.nextAtkMult;
    }

    // Empowered Shot (cinder_archer ability)
    if (attacker.abilityBuffs && attacker.abilityBuffs.empoweredShot) {
        rawDmg = Math.floor(rawDmg * (attacker.abilityBuffs.empoweredShotMult || 1.80));
        if (attacker.abilityBuffs.empoweredShotBurn && target && target.hp > 0) {
            addStatus(target, 'burn', attacker.abilityBuffs.empoweredShotBurn.duration, attacker.abilityBuffs.empoweredShotBurn.dps, attacker);
        }
        delete attacker.abilityBuffs.empoweredShot;
        delete attacker.abilityBuffs.empoweredShotMult;
        delete attacker.abilityBuffs.empoweredShotBurn;
    }

    // First strike bonus damage (ember_scout / flame_rogue passive)
    if (attacker.abilityBuffs && attacker.abilityBuffs.firstStrikeBonusDmg && attacker.passiveState && !attacker.passiveState.triggered) {
        rawDmg = Math.floor(rawDmg * (1 + attacker.abilityBuffs.firstStrikeBonusDmg));
        attacker.passiveState.triggered = true;
        delete attacker.abilityBuffs.firstStrikeBonusDmg;
    }

    // Frost Shot buff check
    if (attacker.abilityBuffs && attacker.abilityBuffs.frostShot && attacker.abilityBuffs.frostShot > 0) {
        var boostedDmg = Math.floor(rawDmg * 1.3);
        dealDamage(attacker, target, boostedDmg, {isAutoAttack: true, canCrit: true, canDodge: true, applyElement: true, triggerOnHit: true});
        addStatus(target, 'slow', 2, 0.2, attacker);
        attacker.abilityBuffs.frostShot--;
    } else {
        dealDamage(attacker, target, rawDmg, {isAutoAttack: true, canCrit: true, canDodge: true, applyElement: true, triggerOnHit: true});
    }
}

// ---- Grid Movement & Pathfinding ----

function getAttackRange(unit) {
    // Use unit's template range if available, otherwise default by type
    if (unit.range !== undefined) return unit.range;
    if (unit.type === 'mage') return 4;
    if (unit.type === 'archer') return 3;
    if (unit.type === 'healer') return 3;
    return 1; // warrior, tank, assassin
}

function getMoveSpeed(unit) {
    // moveSpd is cells per second from template
    if (unit.moveSpd !== undefined) return unit.moveSpd;
    if (unit.type === 'assassin') return 3.3;
    if (unit.type === 'tank') return 1.7;
    return 2.0;
}

function getManhattanDist(r1, c1, r2, c2) {
    return Math.abs(r1 - r2) + Math.abs(c1 - c2);
}

function isInRange(attacker, target) {
    var range = getAttackRange(attacker);
    if (target.isBoss && target.bossSize) {
        return getDistToBoss(attacker, target) <= range;
    }
    var dist = getManhattanDist(attacker.gridRow, attacker.gridCol, target.gridRow, target.gridCol);
    return dist <= range;
}

function findPathNextStep(grid, fromRow, fromCol, toRow, toCol) {
    // BFS on 8x7 grid, returns {row, col} of next step or null
    if (fromRow === toRow && fromCol === toCol) return null;

    var rows = 8, cols = 7;
    var visited = [];
    for (var r = 0; r < rows; r++) {
        visited[r] = [];
        for (var c = 0; c < cols; c++) {
            visited[r][c] = false;
        }
    }

    // parent[r][c] = {row, col} of the cell we came from
    var parent = [];
    for (var r2 = 0; r2 < rows; r2++) {
        parent[r2] = [];
        for (var c2 = 0; c2 < cols; c2++) {
            parent[r2][c2] = null;
        }
    }

    var queue = [{row: fromRow, col: fromCol}];
    visited[fromRow][fromCol] = true;

    var dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]]; // right, left, down, up

    while (queue.length > 0) {
        var cur = queue.shift();

        for (var d = 0; d < dirs.length; d++) {
            var nr = cur.row + dirs[d][0];
            var nc = cur.col + dirs[d][1];

            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            if (visited[nr][nc]) continue;

            // Destination cell is allowed even if occupied (by the target)
            if (nr === toRow && nc === toCol) {
                // Trace back to find first step
                var path = {row: nr, col: nc};
                var prev = cur;
                while (prev.row !== fromRow || prev.col !== fromCol) {
                    path = {row: prev.row, col: prev.col};
                    prev = parent[prev.row][prev.col];
                }
                // path is now the first step from start
                if (path.row === toRow && path.col === toCol) {
                    // Target cell is adjacent — only move there if it's not occupied by someone else
                    if (grid[nr][nc] && grid[nr][nc].hp > 0) {
                        // Can't move into an occupied destination; return the step before
                        return null; // already adjacent, no move needed
                    }
                }
                return path;
            }

            // Cell must be empty to pass through
            if (grid[nr][nc] && grid[nr][nc].hp > 0) continue;

            visited[nr][nc] = true;
            parent[nr][nc] = cur;
            queue.push({row: nr, col: nc});
        }
    }

    return null; // No path found
}

function moveUnit(unit, grid) {
    if (!unit.target || unit.target.hp <= 0) return;
    if (isInRange(unit, unit.target)) return; // Already in range

    var nextStep = findPathNextStep(grid, unit.gridRow, unit.gridCol, unit.target.gridRow, unit.target.gridCol);
    if (!nextStep) return; // Blocked or no path

    // Don't move into an occupied cell
    if (grid[nextStep.row][nextStep.col] && grid[nextStep.row][nextStep.col].hp > 0) return;

    // Update grid
    grid[unit.gridRow][unit.gridCol] = null;
    unit.gridRow = nextStep.row;
    unit.gridCol = nextStep.col;
    grid[nextStep.row][nextStep.col] = unit;
}

function performAssassinDash(unit, grid, enemyPool) {
    // Find lowest HP enemy in back rows
    var backRowMin, backRowMax;
    if (unit.side === 'player') {
        backRowMin = 0; backRowMax = 1; // enemy back rows
    } else {
        backRowMin = 6; backRowMax = 7; // player back rows
    }

    var target = null;
    for (var i = 0; i < enemyPool.length; i++) {
        var e = enemyPool[i];
        if (e.hp <= 0) continue;
        if (e.gridRow >= backRowMin && e.gridRow <= backRowMax) {
            if (!target || e.hp < target.hp) target = e;
        }
    }

    if (!target) {
        // Fallback: closest enemy
        var bestDist = 999;
        for (var j = 0; j < enemyPool.length; j++) {
            if (enemyPool[j].hp <= 0) continue;
            var d = getManhattanDist(unit.gridRow, unit.gridCol, enemyPool[j].gridRow, enemyPool[j].gridCol);
            if (d < bestDist) { bestDist = d; target = enemyPool[j]; }
        }
    }

    if (!target) return;

    // Find empty cell adjacent to target, prefer closest to unit's starting position
    var dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    var bestCell = null;
    var bestCellDist = 999;

    for (var d = 0; d < dirs.length; d++) {
        var ar = target.gridRow + dirs[d][0];
        var ac = target.gridCol + dirs[d][1];
        if (ar < 0 || ar >= 8 || ac < 0 || ac >= 7) continue;
        if (grid[ar][ac] && grid[ar][ac].hp > 0) continue; // occupied
        var distFromStart = getManhattanDist(unit.gridRow, unit.gridCol, ar, ac);
        if (distFromStart < bestCellDist) {
            bestCellDist = distFromStart;
            bestCell = {row: ar, col: ac};
        }
    }

    if (bestCell) {
        // Teleport — spawn trail at old position
        var oldDashRow = unit.gridRow;
        var oldDashCol = unit.gridCol;
        grid[unit.gridRow][unit.gridCol] = null;
        unit.gridRow = bestCell.row;
        unit.gridCol = bestCell.col;
        grid[unit.gridRow][unit.gridCol] = unit;
        unit.target = target;
        if (typeof spawnDamageNumber === 'function' && (!combatState || !combatState.autoBattle)) {
            spawnDamageNumber(oldDashRow, oldDashCol, '\ud83d\udca8', 'dodge');
        }
    }
}

function buildCombatGrid(playerUnits, enemyUnits) {
    var grid = [];
    for (var r = 0; r < 8; r++) {
        grid[r] = [];
        for (var c = 0; c < 7; c++) {
            grid[r][c] = null;
        }
    }

    for (var p = 0; p < playerUnits.length; p++) {
        var pu = playerUnits[p];
        if (pu.hp > 0) {
            grid[pu.gridRow][pu.gridCol] = pu;
        }
    }

    for (var e = 0; e < enemyUnits.length; e++) {
        var eu = enemyUnits[e];
        if (eu.hp > 0) {
            if (eu.isBoss && eu.bossSize) {
                // Place 2x2 boss across all occupied cells
                for (var br = 0; br < eu.bossSize[0]; br++) {
                    for (var bc = 0; bc < eu.bossSize[1]; bc++) {
                        var bRow = eu.gridRow + br;
                        var bCol = eu.gridCol + bc;
                        if (bRow >= 0 && bRow < 8 && bCol >= 0 && bCol < 7) {
                            grid[bRow][bCol] = eu;
                        }
                    }
                }
            } else {
                grid[eu.gridRow][eu.gridCol] = eu;
            }
        }
    }

    return grid;
}

function getSurvivingEnemyCount() {
    if (!combatState) return 0;
    var count = 0;
    for (var i = 0; i < combatState.enemyUnits.length; i++) {
        if (combatState.enemyUnits[i].hp > 0) count++;
    }
    return count;
}

// ---- Synergy bridge ----
// updateActiveSynergies expects board array

function updateActiveSynergies(gs) {
    if (!gs.board) { gs.activeSynergies = {}; gs.activeElements = {}; return; }

    var archCounts = {};
    var elemCounts = {};

    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 7; c++) {
            var u = gs.board[r][c];
            if (!u || u.hp <= 0) continue;
            // Evolved T5 units count as 2 for element synergies
            var isEvolvedT5 = u.cost === 5 && u.evolved;
            var elementCount = isEvolvedT5 ? 2 : 1;
            if (u.archetype) {
                archCounts[u.archetype] = (archCounts[u.archetype] || 0) + 1;
            }
            if (u.element) {
                elemCounts[u.element] = (elemCounts[u.element] || 0) + elementCount;
            }
        }
    }

    gs.activeSynergies = archCounts;
    gs.activeElements = elemCounts;
}

function applySynergyBonuses(units, synergies, combatState) {
    // Apply archetype bonuses to all player units based on their archetype
    var archKeys = Object.keys(synergies);
    for (var i = 0; i < archKeys.length; i++) {
        var archKey = archKeys[i];
        var arch = ARCHETYPES[archKey];
        if (!arch) continue;

        var count = synergies[archKey];
        var tierReached = -1;
        for (var t = 0; t < arch.thresholds.length; t++) {
            if (count >= arch.thresholds[t]) tierReached = t;
        }

        if (tierReached < 0) continue;
        var bonus = arch.bonuses[tierReached];
        if (!bonus) continue;

        for (var u = 0; u < units.length; u++) {
            var unit = units[u];

            // Guardian: HP + DR (applies to all)
            if (archKey === 'guardian') {
                if (bonus.hpBonus) { unit.hp += bonus.hpBonus; unit.maxHp += bonus.hpBonus; }
                if (bonus.damageReduction) unit.damageReduction = (unit.damageReduction || 0) + bonus.damageReduction;
            }

            // Warden: CC duration + tenacity + first CC immune
            if (archKey === 'warden') {
                if (bonus.ccDurationBonus) unit.ccDurationBonus = (unit.ccDurationBonus || 0) + bonus.ccDurationBonus;
                if (bonus.tenacity) unit.tenacity = (unit.tenacity || 0) + bonus.tenacity;
                if (bonus.wardenFirstCcImmune && unit.archetype === 'warden') unit.wardenFirstCcImmune = true;
            }

            // Vanguard: Front-row only (cy >= 5 for player side front row)
            if (archKey === 'vanguard') {
                if (unit.cy >= 5) {
                    if (bonus.frontHpBonus) { unit.maxHp += bonus.frontHpBonus; unit.hp += bonus.frontHpBonus; }
                    if (bonus.frontAtkBonus) unit.attack += bonus.frontAtkBonus;
                    if (bonus.lifestealPct) unit.lifesteal = (unit.lifesteal || 0) + bonus.lifestealPct;
                }
            }

            // Duelist: Double-strike + lifesteal + can't miss (applies to duelists only)
            if (archKey === 'duelist' && unit.archetype === 'duelist') {
                if (bonus.doubleStrikeChance) unit.doubleStrikeChance = bonus.doubleStrikeChance;
                if (bonus.lifestealPct) unit.lifesteal = (unit.lifesteal || 0) + bonus.lifestealPct;
                if (bonus.cantMissAttacks) unit.cantMissAttacks = true;
            }

            // Predator: ATK speed + execute damage (applies to predators only)
            if (archKey === 'predator' && unit.archetype === 'predator') {
                if (bonus.atkSpdBoost) unit.attackSpd = unit.attackSpd / (1 + bonus.atkSpdBoost);
                if (bonus.executeDamageBonus) unit.executeDamageBonus = bonus.executeDamageBonus;
                if (bonus.executeThreshold) unit.executeThreshold = bonus.executeThreshold;
                if (bonus.dashResetOnKill) unit.dashResetOnKill = true;
            }

            // Ranger: Range + furthest damage + pierce (applies to rangers only)
            if (archKey === 'ranger' && unit.archetype === 'ranger') {
                if (bonus.rangeBonus) unit.range += bonus.rangeBonus;
                if (bonus.furthestDmgBonus) unit.furthestDmgBonus = bonus.furthestDmgBonus;
                if (bonus.atkSpdBoost) unit.attackSpd = unit.attackSpd / (1 + bonus.atkSpdBoost);
                if (bonus.pierceCount) unit.pierceCount = bonus.pierceCount;
            }

            // Sorcerer: Ability damage + starting mana + mana refund (applies to sorcerers only)
            if (archKey === 'sorcerer' && unit.archetype === 'sorcerer') {
                if (bonus.abilityDmgBonus) unit.abilityDmgBonus = (unit.abilityDmgBonus || 0) + bonus.abilityDmgBonus;
                if (bonus.startingManaBonus) unit.mana = (unit.mana || 0) + bonus.startingManaBonus;
                if (bonus.abilityManaRefund) unit.abilityManaRefund = bonus.abilityManaRefund;
            }

            // Mystic: Element damage + element resist (applies to all)
            if (archKey === 'mystic') {
                if (bonus.elemDmgBonus) unit.elemDmgBonus = (unit.elemDmgBonus || 0) + bonus.elemDmgBonus;
                if (bonus.elemResist) unit.elemResist = (unit.elemResist || 0) + bonus.elemResist;
                if (bonus.enemyElemDmgDebuff && combatState) combatState.enemyElemDmgDebuff = bonus.enemyElemDmgDebuff;
            }

            // Sage: Healing bonus + team regen + overheal→shield (applies to all)
            if (archKey === 'sage') {
                if (bonus.healBonus) unit.healBonus = (unit.healBonus || 0) + bonus.healBonus;
                if (bonus.teamRegenPct) unit.regenPct = (unit.regenPct || 0) + bonus.teamRegenPct;
                if (bonus.overhealToShieldPct) unit.overhealToShieldPct = bonus.overhealToShieldPct;
            }
        }
    }
}

// Bridge for combat.js log
function addCombatLog(msg) {
    addLogEntry(msg, 'combat');
}

// =============================================================================
// Prompt 20: Balance Pass & Testing Functions (Phase F)
// =============================================================================

// ---- Element Balance Test ----

function runElementBalanceTest() {
    console.log('=== Element Balance Test ===');

    var tests = 20;

    // Mono-fire vs mono-water: water should win ~60% of times
    var fireWins = 0;
    for (var i = 0; i < tests; i++) {
        var fireTeam = generateMonoElement('fire');
        var waterTeam = generateMonoElement('water');
        var result = simulateQuickBattle(fireTeam, waterTeam);
        if (result === 'team1') fireWins++;
    }
    console.log('Fire vs Water: Fire won ' + fireWins + '/' + tests + ' (~' + Math.round(fireWins / tests * 100) + '%)');
    console.log('Expected: ~40% (Water advantage)');

    // Force vs random: should be ~50%
    var forceWins = 0;
    var randomElements = ['fire', 'water', 'earth', 'wind', 'lightning'];
    for (var j = 0; j < tests; j++) {
        var forceTeam = generateMonoElement('force');
        var randomElem = randomElements[Math.floor(Math.random() * randomElements.length)];
        var randomTeam = generateMonoElement(randomElem);
        var result2 = simulateQuickBattle(forceTeam, randomTeam);
        if (result2 === 'team1') forceWins++;
    }
    console.log('Force vs Random: Force won ' + forceWins + '/' + tests + ' (~' + Math.round(forceWins / tests * 100) + '%)');
    console.log('Expected: ~50%');
}

function generateMonoElement(element) {
    var units = SHOP_POOL_KEYS.filter(function(k) {
        return UNIT_TEMPLATES[k] && UNIT_TEMPLATES[k].element === element;
    });
    if (units.length === 0) return [];

    var team = [];
    for (var i = 0; i < 5; i++) {
        var key = units[Math.floor(Math.random() * units.length)];
        team.push(createUnit(key, 1));
    }
    return team;
}

// Quick battle simulation (simplified, no rendering)
function simulateQuickBattle(team1, team2) {
    // Simple HP-vs-ATK comparison with element matchups
    var t1Score = 0;
    var t2Score = 0;

    for (var i = 0; i < team1.length; i++) {
        if (!team1[i]) continue;
        t1Score += team1[i].hp + (team1[i].attack * 10);
    }
    for (var j = 0; j < team2.length; j++) {
        if (!team2[j]) continue;
        t2Score += team2[j].hp + (team2[j].attack * 10);
    }

    // Apply element advantage
    if (team1.length > 0 && team2.length > 0) {
        var elem1 = team1[0].element;
        var elem2 = team2[0].element;
        if (ELEMENT_MATCHUPS && ELEMENT_MATCHUPS[elem1] && ELEMENT_MATCHUPS[elem1][elem2]) {
            var advantage = ELEMENT_MATCHUPS[elem1][elem2];
            if (advantage === 'strong') t1Score *= 1.3;
            else if (advantage === 'weak') t1Score *= 0.7;
        }
    }

    return t1Score >= t2Score ? 'team1' : 'team2';
}

// ---- Initialize ----
window.addEventListener('DOMContentLoaded', function() {
    initGameV2();

    // Close unit detail panel on Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            var overlay = document.getElementById('unit-detail-overlay');
            if (overlay && overlay.style.display === 'flex') {
                closeUnitDetail();
            }
        }
    });
});

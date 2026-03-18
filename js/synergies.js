// =============================================================================
// synergies.js — Synergy calculation and bonus application
// =============================================================================

// Check if a combat unit has the given archetype (primary OR secondary)
// Secondary archetype only counts if unit is ascended (awakened/exalted/transcendent)
function unitHasArchetype(unit, archKey) {
    if (unit.archetype === archKey) return true;
    if (unit.secondaryArchetype && unit.secondaryArchetype === archKey) {
        var tier = unit.ascensionTier;
        if (tier === 'awakened' || tier === 'exalted' || tier === 'transcendent') return true;
    }
    return false;
}

function updateActiveSynergies(gs) {
    var archetypeCounts = {};
    var elementCounts = {};
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 7; c++) {
            var u = gs.board[r][c];
            if (!u) continue;

            // Use ascension-aware archetype contribution if available
            if (typeof getUnitArchetypeContribution === 'function') {
                var contrib = getUnitArchetypeContribution(u);
                archetypeCounts[contrib.primary] = (archetypeCounts[contrib.primary] || 0) + contrib.primaryCount;
                if (contrib.secondary && contrib.secondaryCount > 0) {
                    archetypeCounts[contrib.secondary] = (archetypeCounts[contrib.secondary] || 0) + contrib.secondaryCount;
                }
            } else {
                archetypeCounts[u.archetype] = (archetypeCounts[u.archetype] || 0) + 1;
            }

            // Evolved T5 units count as 2 for element synergies
            var isEvolvedT5 = u.cost === 5 && u.evolved;
            var elementCount = isEvolvedT5 ? 2 : 1;
            elementCounts[u.element] = (elementCounts[u.element] || 0) + elementCount;
        }
    }
    gs.activeSynergies = archetypeCounts;
    gs.activeElements = elementCounts;
}

function getActiveSynergyBonus(gs, archetypeKey) {
    var arch = ARCHETYPES[archetypeKey];
    if (!arch) return null;
    var count = gs.activeSynergies[archetypeKey] || 0;
    var bestTier = -1;
    for (var i = arch.thresholds.length - 1; i >= 0; i--) {
        if (count >= arch.thresholds[i]) {
            bestTier = i;
            break;
        }
    }
    if (bestTier < 0) return null;
    return arch.bonuses[bestTier];
}

function applySynergyBonuses(gs, combatUnits, side) {
    if (side === 'enemy') return;
    var keys = Object.keys(ARCHETYPES);
    for (var k = 0; k < keys.length; k++) {
        var archKey = keys[k];
        var bonus = getActiveSynergyBonus(gs, archKey);
        if (!bonus) continue;

        for (var i = 0; i < combatUnits.length; i++) {
            var u = combatUnits[i];
            if (u.side !== 'player') continue;
            if (!unitHasArchetype(u, archKey)) continue;

            // Guardian: HP + DR + start shield + last stand
            if (archKey === 'guardian') {
                if (bonus.hpBonus) { u.maxHp += bonus.hpBonus; u.hp += bonus.hpBonus; }
                if (bonus.damageReduction) u.damageReduction = (u.damageReduction || 0) + bonus.damageReduction;
                if (bonus.startShieldPct) u.shield = (u.shield || 0) + Math.floor(u.maxHp * bonus.startShieldPct);
                if (bonus.shieldBreakTenacity) { u.shieldBreakTenacity = bonus.shieldBreakTenacity; u.shieldBreakTenacityDuration = bonus.shieldBreakTenacityDuration; }
                if (bonus.lastStandThreshold) { u.lastStandThreshold = bonus.lastStandThreshold; u.lastStandInvulnDuration = bonus.lastStandInvulnDuration; u.lastStandTaunt = bonus.lastStandTaunt; }
            }

            // Warden: CC duration + tenacity + CC immunity + CC effects
            if (archKey === 'warden') {
                if (bonus.ccDurationBonus) u.ccDurationBonus = (u.ccDurationBonus || 0) + bonus.ccDurationBonus;
                if (bonus.tenacity) u.tenacity = (u.tenacity || 0) + bonus.tenacity;
                if (bonus.wardenFirstCcImmune) u.wardenFirstCcImmune = true;
                if (bonus.wardenCcImmune) u.wardenCcImmune = true;
                if (bonus.ccAppliesAtkSpdSlow) { u.ccAppliesAtkSpdSlow = bonus.ccAppliesAtkSpdSlow; u.ccAtkSpdSlowDuration = bonus.ccAtkSpdSlowDuration; }
                if (bonus.ccSpreadRoot) { u.ccSpreadRoot = true; u.ccSpreadRadius = bonus.ccSpreadRadius; u.ccSpreadDuration = bonus.ccSpreadDuration; }
            }

            // Vanguard: HP + ATK (with front-row multiplier) + charge + lifesteal + slow immune
            if (archKey === 'vanguard') {
                var isFrontRow = (u.gridRow !== undefined ? u.gridRow >= 6 : u.cy >= 6);
                var mult = (isFrontRow && bonus.frontRowMultiplier) ? bonus.frontRowMultiplier : 1;
                if (bonus.hpBonus) { var hpAdd = bonus.hpBonus * mult; u.maxHp += hpAdd; u.hp += hpAdd; }
                if (bonus.atkBonus) u.attack += bonus.atkBonus * mult;
                if (bonus.lifestealPct) u.lifesteal = (u.lifesteal || 0) + bonus.lifestealPct;
                if (bonus.chargeDmgBonus) { u.chargeDmgBonus = bonus.chargeDmgBonus; u.chargeDuration = bonus.chargeDuration; }
                if (bonus.chargeStunDuration) u.chargeStunDuration = bonus.chargeStunDuration;
                if (bonus.slowImmune) u.slowImmune = true;
            }

            // Duelist: Double-strike + lifesteal + can't miss + crit every N + ramping ATK
            if (archKey === 'duelist') {
                if (bonus.doubleStrikeChance) u.doubleStrikeChance = bonus.doubleStrikeChance;
                if (bonus.lifestealPct) u.lifesteal = (u.lifesteal || 0) + bonus.lifestealPct;
                if (bonus.cantMissAttacks) u.cantMissAttacks = true;
                if (bonus.guaranteedCritEveryN) { u.guaranteedCritEveryN = bonus.guaranteedCritEveryN; u.attackCounter = 0; }
                if (bonus.rampingAtkPctPerSec) { u.rampingAtkPctPerSec = bonus.rampingAtkPctPerSec; u.rampingAtkCap = bonus.rampingAtkCap; u.rampingAtkAccumulated = 0; }
            }

            // Predator: ATK speed + execute damage + on-kill effects
            if (archKey === 'predator') {
                if (bonus.atkSpdBoost) u.attackSpd = u.attackSpd / (1 + bonus.atkSpdBoost);
                if (bonus.executeDamageBonus) u.executeDamageBonus = bonus.executeDamageBonus;
                if (bonus.executeThreshold) u.executeThreshold = bonus.executeThreshold;
                if (bonus.dashResetOnKill) u.dashResetOnKill = true;
                if (bonus.onKillAtkBuff) { u.onKillAtkBuff = bonus.onKillAtkBuff; u.onKillAtkBuffDuration = bonus.onKillAtkBuffDuration; }
                if (bonus.onKillManaRefundPct) u.onKillManaRefundPct = bonus.onKillManaRefundPct;
            }

            // Ranger: Range + furthest damage + pierce + focused shot + mark
            if (archKey === 'ranger') {
                if (bonus.rangeBonus) u.range += bonus.rangeBonus;
                if (bonus.furthestDmgBonus) u.furthestDmgBonus = bonus.furthestDmgBonus;
                if (bonus.atkSpdBoost) u.attackSpd = u.attackSpd / (1 + bonus.atkSpdBoost);
                if (bonus.pierceCount) u.pierceCount = bonus.pierceCount;
                if (bonus.pierceAll) u.pierceAll = true;
                if (bonus.focusedShotEveryN) { u.focusedShotEveryN = bonus.focusedShotEveryN; u.focusedShotIgnoreDR = bonus.focusedShotIgnoreDR; u.attackCounter = u.attackCounter || 0; }
                if (bonus.markTargetDmgAmp) u.markTargetDmgAmp = bonus.markTargetDmgAmp;
            }

            // Sorcerer: Ability damage + starting mana + mana refund + spell pen + post-cast + first cast x2
            if (archKey === 'sorcerer') {
                if (bonus.abilityDmgBonus) u.abilityDmgBonus = (u.abilityDmgBonus || 0) + bonus.abilityDmgBonus;
                if (bonus.startingManaBonus) u.currentMana = (u.currentMana || 0) + bonus.startingManaBonus;
                if (bonus.abilityManaRefund) u.abilityManaRefund = bonus.abilityManaRefund;
                if (bonus.spellPenetration) u.spellPenetration = bonus.spellPenetration;
                if (bonus.postCastAtkSpdBuff) { u.postCastAtkSpdBuff = bonus.postCastAtkSpdBuff; u.postCastAtkSpdDuration = bonus.postCastAtkSpdDuration; }
                if (bonus.firstCastDoubleDamage) u.firstCastDoubleDamage = true;
            }

            // Mystic: Element resist + status duration + resist shred + ability per element + random proc
            if (archKey === 'mystic') {
                if (bonus.elemResist) u.elemResist = (u.elemResist || 0) + bonus.elemResist;
                if (bonus.elemStatusDurationBonus) u.elemStatusDurationBonus = (u.elemStatusDurationBonus || 0) + bonus.elemStatusDurationBonus;
                if (bonus.elemResistShred) { u.elemResistShred = bonus.elemResistShred; u.elemResistShredDuration = bonus.elemResistShredDuration; }
                if (bonus.abilityDmgPerElement) u.abilityDmgPerElement = bonus.abilityDmgPerElement;
                if (bonus.randomElementProcChance) { u.randomElementProcChance = bonus.randomElementProcChance; u.randomElementProcDuration = bonus.randomElementProcDuration; }
            }

            // Sage: Healing bonus + heal shield + passive mana + overheal + death save
            if (archKey === 'sage') {
                if (bonus.healBonus) u.healBonus = (u.healBonus || 0) + bonus.healBonus;
                if (bonus.healShieldPct) { u.healShieldPct = bonus.healShieldPct; u.healShieldDuration = bonus.healShieldDuration; }
                if (bonus.passiveManaPerSec) u.passiveManaPerSec = bonus.passiveManaPerSec;
                if (bonus.overhealToShieldPct) u.overhealToShieldPct = bonus.overhealToShieldPct;
                if (bonus.deathSaveOnce) u.deathSaveOnce = true;
            }
        }
    }

    // Mystic abilityDmgPerElement: count unique elements on team and apply bonus
    var uniqueElements = {};
    for (var ei = 0; ei < combatUnits.length; ei++) {
        if (combatUnits[ei].side === 'player' && combatUnits[ei].element) {
            uniqueElements[combatUnits[ei].element] = true;
        }
    }
    var uniqueElemCount = Object.keys(uniqueElements).length;
    for (var mi = 0; mi < combatUnits.length; mi++) {
        var mu = combatUnits[mi];
        if (mu.side === 'player' && mu.abilityDmgPerElement && uniqueElemCount > 0) {
            mu.abilityDmgBonus = (mu.abilityDmgBonus || 0) + mu.abilityDmgPerElement * uniqueElemCount;
        }
    }

    // Sage deathSaveOnce: find the strongest Sage and mark them as the death saver
    var strongestSage = null;
    var strongestSageAtk = -1;
    for (var si = 0; si < combatUnits.length; si++) {
        var su = combatUnits[si];
        if (su.side === 'player' && su.deathSaveOnce && su.attack > strongestSageAtk) {
            strongestSageAtk = su.attack;
            strongestSage = su;
        }
    }
    if (strongestSage) {
        strongestSage.isDeathSaver = true;
        strongestSage.deathSaveHealPct = 0.25;
    }

    // Aegis Paladin: combat start +100 shield to all allies
    for (var i = 0; i < combatUnits.length; i++) {
        var u = combatUnits[i];
        if (u.side === 'player' && u.evolved && u.key === 'aegis_paladin') {
            for (var j = 0; j < combatUnits.length; j++) {
                if (combatUnits[j].side === 'player') {
                    combatUnits[j].shield = (combatUnits[j].shield || 0) + 100;
                }
            }
            break;
        }
    }
}

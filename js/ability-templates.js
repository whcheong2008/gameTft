// =============================================================================
// ability-templates.js — Complete unit ability system for auto-battler
// =============================================================================
// 66 base units + 66 evolved units = 132 total unit-specific abilities
// Organized by element: Fire, Water, Earth, Wind, Lightning, Force
// =============================================================================

// Element -> Status Mapping
var ELEMENT_STATUS_MAP = {
    fire: {
        dot: true,
        dotType: 'burn',
        dotDps: null,  // scaled by tier
        cc: null,
        ccType: null,
        buff: null,
        buffType: null,
        debuff: null,
        debuffType: null
    },
    water: {
        dot: false,
        dotType: null,
        cc: true,
        ccType: 'freeze',
        buff: null,
        buffType: null,
        debuff: true,
        debuffType: 'slow'
    },
    earth: {
        dot: false,
        dotType: null,
        cc: true,
        ccType: 'root',
        buff: true,
        buffType: 'shield',
        debuff: null,
        debuffType: null
    },
    wind: {
        dot: false,
        dotType: null,
        cc: true,
        ccType: 'silence',
        buff: true,
        buffType: 'dodgeBuff',
        debuff: null,
        debuffType: null
    },
    lightning: {
        dot: false,
        dotType: null,
        cc: true,
        ccType: 'stun',
        buff: true,
        buffType: 'critBuff',
        debuff: null,
        debuffType: null
    },
    force: {
        dot: false,
        dotType: null,
        cc: null,
        ccType: null,
        buff: null,
        buffType: null,
        debuff: true,
        debuffType: 'vulnerability'
    }
};

// Tier scaling factors
var TIER_SCALE = {
    1: {
        abilityMult: 1.8,
        dotDps: 10,
        ccDur: 1.2,
        shieldPct: 0.15,
        passiveStr: 1.0,
        evolvedBonus: 1.3
    },
    2: {
        abilityMult: 1.9,
        dotDps: 15,
        ccDur: 1.5,
        shieldPct: 0.20,
        passiveStr: 1.1,
        evolvedBonus: 1.35
    },
    3: {
        abilityMult: 2.1,
        dotDps: 21,
        ccDur: 1.75,
        shieldPct: 0.24,
        passiveStr: 1.2,
        evolvedBonus: 1.4
    },
    4: {
        abilityMult: 2.6,
        dotDps: 26,
        ccDur: 2.0,
        shieldPct: 0.28,
        passiveStr: 1.3,
        evolvedBonus: 1.45
    },
    5: {
        abilityMult: 3.2,
        dotDps: 37,
        ccDur: 2.5,
        shieldPct: 0.37,
        passiveStr: 1.5,
        evolvedBonus: 1.5
    }
};

// Helper: Get scaling for unit tier
function getScale(cost, isEvolved) {
    var base = TIER_SCALE[cost] || TIER_SCALE[1];
    if (isEvolved) {
        return {
            abilityMult: base.abilityMult * base.evolvedBonus,
            dotDps: base.dotDps * base.evolvedBonus,
            ccDur: base.ccDur * base.evolvedBonus,
            shieldPct: base.shieldPct * base.evolvedBonus,
            passiveStr: base.passiveStr * base.evolvedBonus
        };
    }
    return {
        abilityMult: base.abilityMult,
        dotDps: base.dotDps,
        ccDur: base.ccDur,
        shieldPct: base.shieldPct,
        passiveStr: base.passiveStr
    };
}

// Helper: Apply element DoT
function applyElementDot(source, target, duration, scale) {
    var elemMap = ELEMENT_STATUS_MAP[source.element];
    if (!elemMap || !elemMap.dotType) return;

    var dps = Math.floor(scale.dotDps);
    if (target) {
        addStatus(target, elemMap.dotType, duration, dps, source);
    }
}

// Helper: Apply element CC
function applyElementCC(source, target, scale) {
    var elemMap = ELEMENT_STATUS_MAP[source.element];
    if (!elemMap || !elemMap.ccType) return;

    if (target) {
        addStatus(target, elemMap.ccType, scale.ccDur, 1, source);
    }
}

// Helper: Apply element debuff
function applyElementDebuff(source, target, scale) {
    var elemMap = ELEMENT_STATUS_MAP[source.element];
    if (!elemMap || !elemMap.debuffType) return;

    var value = 0.15;  // Default 15% reduction/multiplier
    if (elemMap.debuffType === 'vulnerability') value = 0.15;
    else if (elemMap.debuffType === 'slow') value = 0.2;

    if (target) {
        addStatus(target, elemMap.debuffType, scale.ccDur, value, source);
    }
}

// Helper: Apply element buff
function applyElementBuff(source, scale) {
    var elemMap = ELEMENT_STATUS_MAP[source.element];
    if (!elemMap || !elemMap.buffType) return;

    var value = 0.15;  // Default 15% boost
    addStatus(source, elemMap.buffType, scale.ccDur, value, source);
}

// =============================================================================
// UNIT_ABILITIES: All 132 unit-specific ability functions
// =============================================================================

var UNIT_ABILITIES = {
    // FIRE UNITS (33 base + evolved)
    flame_warrior: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, isEvolved);
        var damage = atk * (isEvolved ? 2.3 : 1.8);
        var lowHp = target.hp < target.maxHp * 0.4;
        var res = dealDamage(caster, target, damage, {
            isAbility: true,
            forceCrit: lowHp,
            canCrit: true,
            canDodge: true
        });
        if (res.killed && !isEvolved) {
            caster.currentMana = Math.min(caster.maxMana, caster.currentMana + caster.maxMana * 0.5);
        }
        return res;
    },

    fire_berserker: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var damage = atk * 2.3;
        var lowHp = target.hp < target.maxHp * 0.35;
        var res = dealDamage(caster, target, damage, {
            isAbility: true,
            forceCrit: lowHp,
            canCrit: true,
            canDodge: true
        });
        if (res.killed) {
            caster.currentMana = Math.min(caster.maxMana, caster.currentMana + caster.maxMana * 0.6);
            addStatus(caster, 'atkBuff', 4, 0.15, caster);
        }
        return res;
    },

    ember_scout: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, isEvolved);
        var marks = getStatusValue(target, 'burn') || 0;
        var bonusDmg = marks * atk * 0.3;
        var totalDmg = atk * (isEvolved ? 2.0 : 1.6) + bonusDmg;
        dealDamage(caster, target, totalDmg, {isAbility: true, canCrit: true, canDodge: true});
        applyElementDot(caster, target, 3, scale);
    },

    flame_rogue: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, true);
        var marks = getStatusValue(target, 'burn') || 0;
        var bonusDmg = marks * atk * 0.4;
        var totalDmg = atk * 2.0 + bonusDmg;
        dealDamage(caster, target, totalDmg, {isAbility: true, canCrit: true, canDodge: true});
        applyElementDot(caster, target, 3, scale);
        addStatus(target, 'vulnerability', 2, 0.2, caster);
    },

    cinder_archer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, isEvolved);
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 2, enemies);
        nearby.forEach(function(enemy) {
            var hasDot = hasStatus(enemy, 'burn');
            var bonusDmg = hasDot ? atk * 0.4 : 0;
            dealDamage(caster, enemy, atk * (isEvolved ? 2.1 : 1.7) + bonusDmg, {
                isAbility: true,
                canCrit: true,
                canDodge: true
            });
            applyElementDot(caster, enemy, 4, scale);
        });
    },

    cinder_marksman: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, true);
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            var hasDot = hasStatus(enemy, 'burn');
            var bonusDmg = hasDot ? atk * 0.5 : 0;
            dealDamage(caster, enemy, atk * 2.1 + bonusDmg, {
                isAbility: true,
                canCrit: true,
                canDodge: true
            });
            applyElementDot(caster, enemy, 4, scale);
        });
    },

    fire_acolyte: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, isEvolved);
        var lowest = getLowestHpUnit(allies);
        if (lowest) {
            var healMult = lowest.hp < lowest.maxHp * 0.35 ? 1.5 : 1.0;
            dealHealing(caster, lowest, atk * (isEvolved ? 2.0 : 1.7) * healMult);
        }
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
        nearby.forEach(function(enemy) {
            dealDamage(caster, enemy, atk * (isEvolved ? 1.3 : 1.0), {isAbility: true, canCrit: false});
            applyElementDot(caster, enemy, 3, scale);
        });
    },

    ember_saint: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, true);
        var lowest = getLowestHpUnit(allies);
        if (lowest) {
            var healMult = lowest.hp < lowest.maxHp * 0.35 ? 1.6 : 1.1;
            dealHealing(caster, lowest, atk * 2.0 * healMult);
        }
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            dealDamage(caster, enemy, atk * 1.4, {isAbility: true, canCrit: false});
            applyElementDot(caster, enemy, 3, scale);
            addStatus(enemy, 'burn', 3, 15, caster);
        });
    },

    magma_knight: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, isEvolved);
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
        nearby.forEach(function(enemy) {
            addStatus(enemy, 'taunt', 2, caster, caster);
        });
        caster.taunting = true;
        caster.reflectMultiplier = (isEvolved ? 0.5 : 0.35);
    },

    volcano_titan: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, true);
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            addStatus(enemy, 'taunt', 2.5, caster, caster);
        });
        caster.taunting = true;
        caster.reflectMultiplier = 0.6;
    },

    blaze_lancer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, isEvolved);
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 2, enemies);
        nearby.forEach(function(enemy) {
            var hasDot = hasStatus(enemy, 'burn');
            var bonusDmg = hasDot ? atk * 0.5 : 0;
            dealDamage(caster, enemy, atk * (isEvolved ? 2.4 : 1.9) + bonusDmg, {
                isAbility: true,
                canCrit: true,
                canDodge: true
            });
            applyElementDot(caster, enemy, 4, scale);
        });
    },

    inferno_lancer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, true);
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            var hasDot = hasStatus(enemy, 'burn');
            var bonusDmg = hasDot ? atk * 0.6 : 0;
            dealDamage(caster, enemy, atk * 2.4 + bonusDmg, {
                isAbility: true,
                canCrit: true,
                canDodge: true
            });
            applyElementDot(caster, enemy, 4, scale);
        });
    },

    pyromancer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(3, isEvolved);
        var marks = getStatusValue(target, 'burn') || 0;
        var bonusDmg = marks * atk * 0.35;
        var totalDmg = atk * (isEvolved ? 2.4 : 2.1) + bonusDmg;
        dealDamage(caster, target, totalDmg, {isAbility: true, canCrit: true, canDodge: true});
        applyElementDot(caster, target, 4, scale);
        addStatus(target, 'vulnerability', 3, 0.25, caster);
    },

    arcane_inferno: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(3, true);
        var marks = getStatusValue(target, 'burn') || 0;
        var bonusDmg = marks * atk * 0.45;
        var totalDmg = atk * 2.4 + bonusDmg;
        dealDamage(caster, target, totalDmg, {isAbility: true, canCrit: true, canDodge: true});
        applyElementDot(caster, target, 4, scale);
        addStatus(target, 'vulnerability', 3, 0.35, caster);
    },

    inferno_fox: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(3, isEvolved);
        moveUnitToCell(caster, target.gridRow, target.gridCol, grid);
        var lowHp = target.hp < target.maxHp * 0.4;
        var damage = atk * (isEvolved ? 2.5 : 2.2);
        var res = dealDamage(caster, target, damage, {
            isAbility: true,
            forceCrit: lowHp,
            canCrit: true,
            canDodge: true
        });
        if (res.killed) {
            var escape = findEmptyCellNear(caster.gridRow, caster.gridCol, grid);
            if (escape) moveUnitToCell(caster, escape.gridRow, escape.gridCol, grid);
            if (!isEvolved) caster.currentMana = Math.min(caster.maxMana, caster.currentMana + caster.maxMana * 0.5);
        }
        return res;
    },

    ninetail_blaze: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(3, true);
        moveUnitToCell(caster, target.gridRow, target.gridCol, grid);
        var lowHp = target.hp < target.maxHp * 0.35;
        var damage = atk * 2.5;
        var res = dealDamage(caster, target, damage, {
            isAbility: true,
            forceCrit: lowHp,
            canCrit: true,
            canDodge: true
        });
        if (res.killed) {
            var escape = findEmptyCellNear(caster.gridRow, caster.gridCol, grid);
            if (escape) moveUnitToCell(caster, escape.gridRow, escape.gridCol, grid);
            caster.currentMana = Math.min(caster.maxMana, caster.currentMana + caster.maxMana * 0.6);
            addStatus(caster, 'dodgeBuff', 3, 0.2, caster);
        }
        return res;
    },

    fire_dragon: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(4, isEvolved);
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            var hasDot = hasStatus(enemy, 'burn');
            var bonusDmg = hasDot ? atk * 0.6 : 0;
            dealDamage(caster, enemy, atk * (isEvolved ? 2.8 : 2.6) + bonusDmg, {
                isAbility: true,
                canCrit: true,
                canDodge: true
            });
            applyElementDot(caster, enemy, 5, scale);
        });
    },

    elder_wyrm: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(4, true);
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 4, enemies);
        nearby.forEach(function(enemy) {
            var hasDot = hasStatus(enemy, 'burn');
            var bonusDmg = hasDot ? atk * 0.7 : 0;
            dealDamage(caster, enemy, atk * 2.8 + bonusDmg, {
                isAbility: true,
                canCrit: true,
                canDodge: true
            });
            applyElementDot(caster, enemy, 5, scale);
        });
    },

    ashen_watcher: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(4, isEvolved);
        var lowest = getLowestHpUnit(allies);
        if (lowest) {
            var healMult = lowest.hp < lowest.maxHp * 0.35 ? 1.5 : 1.0;
            dealHealing(caster, lowest, atk * (isEvolved ? 2.4 : 2.2) * healMult);
        }
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            dealDamage(caster, enemy, atk * (isEvolved ? 1.6 : 1.4), {isAbility: true, canCrit: false});
            applyElementDot(caster, enemy, 4, scale);
        });
    },

    phoenix_priest: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(4, true);
        var lowest = getLowestHpUnit(allies);
        if (lowest) {
            var healMult = lowest.hp < lowest.maxHp * 0.35 ? 1.6 : 1.1;
            dealHealing(caster, lowest, atk * 2.4 * healMult);
        }
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 4, enemies);
        nearby.forEach(function(enemy) {
            dealDamage(caster, enemy, atk * 1.6, {isAbility: true, canCrit: false});
            applyElementDot(caster, enemy, 4, scale);
        });
    },

    phoenix: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },

    eternal_phoenix: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },

    // WATER UNITS (33 base + evolved)
    tide_hunter: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, isEvolved);
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 2, enemies);
        nearby.forEach(function(enemy) {
            moveUnitToCell(enemy, target.gridRow, target.gridCol, grid);
            dealDamage(caster, enemy, atk * (isEvolved ? 1.9 : 1.6), {
                isAbility: true,
                canCrit: true,
                canDodge: true
            });
            addStatus(enemy, 'slow', 2, 0.3, caster);
        });
    },

    tsunami_blade: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, true);
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            moveUnitToCell(enemy, target.gridRow, target.gridCol, grid);
            dealDamage(caster, enemy, atk * 1.9, {
                isAbility: true,
                canCrit: true,
                canDodge: true
            });
            addStatus(enemy, 'slow', 2.5, 0.4, caster);
            addStatus(enemy, 'freeze', 1, null, caster);
        });
    },

    frost_archer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, isEvolved);
        var ccTypes = ['freeze', 'slow', 'root'];
        var ccIdx = 0;
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 2, enemies);
        nearby.forEach(function(enemy) {
            var ccType = ccTypes[ccIdx % ccTypes.length];
            addStatus(enemy, ccType, scale.ccDur * (isEvolved ? 1.3 : 1.0), 0.3, caster);
            dealDamage(caster, enemy, atk * (isEvolved ? 1.8 : 1.5), {
                isAbility: true,
                canCrit: true,
                canDodge: true
            });
            ccIdx++;
        });
    },

    ice_sniper: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, true);
        var ccTypes = ['freeze', 'slow', 'root'];
        var ccIdx = 0;
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            var ccType = ccTypes[ccIdx % ccTypes.length];
            addStatus(enemy, ccType, scale.ccDur * 1.3, 0.4, caster);
            dealDamage(caster, enemy, atk * 1.8, {
                isAbility: true,
                canCrit: true,
                canDodge: true
            });
            ccIdx++;
        });
    },

    reef_stalker: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var damage = atk * (isEvolved ? 2.0 : 1.7);
        var res = dealDamage(caster, target, damage, {
            isAbility: true,
            canCrit: true,
            canDodge: true
        });
        dealHealing(caster, caster, res.totalDamage * (isEvolved ? 0.6 : 0.5));
        addStatus(target, 'atkMod', 4, -0.1, caster);
        addStatus(caster, 'atkBuff', 4, 0.1, caster);
    },

    tidal_phantom: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var damage = atk * 2.0;
        var res = dealDamage(caster, target, damage, {
            isAbility: true,
            canCrit: true,
            canDodge: true
        });
        dealHealing(caster, caster, res.totalDamage * 0.6);
        addStatus(target, 'atkMod', 4, -0.15, caster);
        addStatus(caster, 'atkBuff', 4, 0.15, caster);
        addStatus(target, 'slow', 3, 0.3, caster);
    },

    coral_priest: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var lowest = getLowestHpUnit(allies);
        if (lowest) {
            var healMult = lowest.hp < lowest.maxHp * 0.35 ? 1.5 : 1.0;
            dealHealing(caster, lowest, atk * (isEvolved ? 2.1 : 1.8) * healMult);
        }
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
        nearby.forEach(function(enemy) {
            dealDamage(caster, enemy, atk * (isEvolved ? 1.2 : 1.0), {isAbility: true, canCrit: false});
            addStatus(enemy, 'slow', 3, 0.35, caster);
        });
    },

    ocean_sage: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var lowest = getLowestHpUnit(allies);
        if (lowest) {
            var healMult = lowest.hp < lowest.maxHp * 0.35 ? 1.6 : 1.1;
            dealHealing(caster, lowest, atk * 2.1 * healMult);
        }
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            dealDamage(caster, enemy, atk * 1.2, {isAbility: true, canCrit: false});
            addStatus(enemy, 'slow', 3, 0.45, caster);
            addStatus(enemy, 'freeze', 1.5, null, caster);
        });
    },

    hydro_mage: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 2, enemies);
        nearby.forEach(function(enemy) {
            moveUnitToCell(enemy, target.gridRow, target.gridCol, grid);
            dealDamage(caster, enemy, atk * (isEvolved ? 2.0 : 1.7), {
                isAbility: true,
                canCrit: true,
                canDodge: true
            });
            addStatus(enemy, 'slow', 2.5, 0.4, caster);
        });
    },

    abyssal_mage: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            moveUnitToCell(enemy, target.gridRow, target.gridCol, grid);
            dealDamage(caster, enemy, atk * 2.0, {
                isAbility: true,
                canCrit: true,
                canDodge: true
            });
            addStatus(enemy, 'slow', 2.5, 0.5, caster);
            addStatus(enemy, 'freeze', 1, null, caster);
        });
    },

    shell_knight: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, isEvolved);
        var shieldAmt = caster.maxHp * scale.shieldPct * (isEvolved ? 1.3 : 1.0);
        grantShield(caster, caster, shieldAmt);
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, allies);
        nearby.forEach(function(ally) {
            if (ally !== caster) grantShield(caster, ally, shieldAmt * 0.7);
        });
    },

    armored_sentinel: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, true);
        var shieldAmt = caster.maxHp * scale.shieldPct * 1.3;
        grantShield(caster, caster, shieldAmt);
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 3, allies);
        nearby.forEach(function(ally) {
            if (ally !== caster) grantShield(caster, ally, shieldAmt * 0.8);
        });
        addStatus(caster, 'drMod', 5, 0.1, caster);
    },

    tidal_shaman: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(3, isEvolved);
        var lowest = getLowestHpUnit(allies);
        if (lowest) {
            var healMult = lowest.hp < lowest.maxHp * 0.35 ? 1.5 : 1.0;
            dealHealing(caster, lowest, atk * (isEvolved ? 2.3 : 2.0) * healMult);
        }
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            dealDamage(caster, enemy, atk * (isEvolved ? 1.3 : 1.1), {isAbility: true, canCrit: false});
            addStatus(enemy, 'slow', 3, 0.4, caster);
        });
    },

    stormtide_oracle: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(3, true);
        var lowest = getLowestHpUnit(allies);
        if (lowest) {
            var healMult = lowest.hp < lowest.maxHp * 0.35 ? 1.6 : 1.1;
            dealHealing(caster, lowest, atk * 2.3 * healMult);
        }
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 4, enemies);
        nearby.forEach(function(enemy) {
            dealDamage(caster, enemy, atk * 1.3, {isAbility: true, canCrit: false});
            addStatus(enemy, 'slow', 3, 0.5, caster);
            addStatus(enemy, 'freeze', 1.5, null, caster);
        });
    },

    riptide_blade: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
        var totalHealing = 0;
        nearby.forEach(function(enemy) {
            var damage = atk * (isEvolved ? 2.2 : 1.9);
            var res = dealDamage(caster, enemy, damage, {
                isAbility: true,
                canCrit: true,
                canDodge: true
            });
            totalHealing += res.totalDamage * (isEvolved ? 0.55 : 0.5);
        });
        dealHealing(caster, caster, totalHealing);
    },

    tsunami_warlord: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 3, enemies);
        var totalHealing = 0;
        nearby.forEach(function(enemy) {
            var damage = atk * 2.2;
            var res = dealDamage(caster, enemy, damage, {
                isAbility: true,
                canCrit: true,
                canDodge: true
            });
            totalHealing += res.totalDamage * 0.55;
            addStatus(enemy, 'slow', 3, 0.3, caster);
        });
        dealHealing(caster, caster, totalHealing);
    },

    kraken: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            moveUnitToCell(enemy, target.gridRow, target.gridCol, grid);
            dealDamage(caster, enemy, atk * (isEvolved ? 2.4 : 2.2), {
                isAbility: true,
                canCrit: true,
                canDodge: true
            });
            addStatus(enemy, 'slow', 3, 0.5, caster);
            if (isEvolved) addStatus(enemy, 'freeze', 1.5, null, caster);
        });
    },

    abyssal_terror: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 4, enemies);
        nearby.forEach(function(enemy) {
            moveUnitToCell(enemy, target.gridRow, target.gridCol, grid);
            dealDamage(caster, enemy, atk * 2.4, {
                isAbility: true,
                canCrit: true,
                canDodge: true
            });
            addStatus(enemy, 'slow', 3, 0.6, caster);
            addStatus(enemy, 'freeze', 1.5, null, caster);
        });
    },

    abyssal_guardian: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(4, isEvolved);
        var shieldAmt = caster.maxHp * scale.shieldPct * (isEvolved ? 1.35 : 1.0);
        grantShield(caster, caster, shieldAmt);
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 3, allies);
        nearby.forEach(function(ally) {
            if (ally !== caster) grantShield(caster, ally, shieldAmt * 0.8);
        });
    },

    hadal_colossus: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(4, true);
        var shieldAmt = caster.maxHp * scale.shieldPct * 1.35;
        grantShield(caster, caster, shieldAmt);
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 4, allies);
        nearby.forEach(function(ally) {
            if (ally !== caster) grantShield(caster, ally, shieldAmt * 0.85);
        });
        addStatus(caster, 'drMod', 5, 0.15, caster);
    },

    leviathan: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },

    primordial_leviathan: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },

    // EARTH UNITS (33 base + evolved)
    stone_guard: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, isEvolved);
        var shieldAmt = caster.maxHp * scale.shieldPct * (isEvolved ? 1.25 : 1.0);
        grantShield(caster, caster, shieldAmt);
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, allies);
        nearby.forEach(function(ally) {
            if (ally !== caster) grantShield(caster, ally, shieldAmt * 0.6);
        });
    },

    mountain_lord: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, true);
        var shieldAmt = caster.maxHp * scale.shieldPct * 1.25;
        grantShield(caster, caster, shieldAmt);
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 3, allies);
        nearby.forEach(function(ally) {
            if (ally !== caster) grantShield(caster, ally, shieldAmt * 0.75);
        });
    },

    bramble_knight: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
        nearby.forEach(function(enemy) {
            addStatus(enemy, 'taunt', 2, caster, caster);
        });
        caster.taunting = true;
        caster.reflectMultiplier = (isEvolved ? 0.45 : 0.3);
    },

    ironwood_sentinel: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            addStatus(enemy, 'taunt', 2.5, caster, caster);
        });
        caster.taunting = true;
        caster.reflectMultiplier = 0.5;
    },

    seedling_archer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, isEvolved);
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 2, enemies);
        nearby.forEach(function(enemy) {
            addStatus(enemy, 'root', scale.ccDur * (isEvolved ? 1.25 : 1.0), null, caster);
            addStatus(enemy, 'vulnerability', 3, 0.15, caster);
            dealDamage(caster, enemy, atk * (isEvolved ? 1.8 : 1.5), {
                isAbility: true,
                canCrit: true,
                canDodge: true
            });
        });
    },

    thornwood_ranger: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, true);
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            addStatus(enemy, 'root', scale.ccDur * 1.25, null, caster);
            addStatus(enemy, 'vulnerability', 3, 0.2, caster);
            dealDamage(caster, enemy, atk * 1.8, {
                isAbility: true,
                canCrit: true,
                canDodge: true
            });
        });
    },

    earth_shaman: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, isEvolved);
        var shieldAmt = caster.maxHp * scale.shieldPct * (isEvolved ? 1.3 : 1.0);
        var lowest = getLowestHpUnit(allies);
        if (lowest) {
            grantShield(caster, lowest, shieldAmt);
        }
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, allies);
        nearby.forEach(function(ally) {
            if (ally !== caster) grantShield(caster, ally, shieldAmt * 0.7);
        });
    },

    gaia_priest: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, true);
        var shieldAmt = caster.maxHp * scale.shieldPct * 1.3;
        var lowest = getLowestHpUnit(allies);
        if (lowest) {
            grantShield(caster, lowest, shieldAmt);
        }
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 3, allies);
        nearby.forEach(function(ally) {
            if (ally !== caster) grantShield(caster, ally, shieldAmt * 0.8);
        });
        addStatus(caster, 'drMod', 5, 0.1, caster);
    },

    crystal_mage: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, isEvolved);
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 2, enemies);
        nearby.forEach(function(enemy) {
            addStatus(enemy, 'root', scale.ccDur * (isEvolved ? 1.3 : 1.0), null, caster);
            addStatus(enemy, 'vulnerability', 3, 0.2, caster);
            dealDamage(caster, enemy, atk * (isEvolved ? 2.0 : 1.7), {
                isAbility: true,
                canCrit: true,
                canDodge: true
            });
        });
    },

    geomancer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, true);
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            addStatus(enemy, 'root', scale.ccDur * 1.3, null, caster);
            addStatus(enemy, 'vulnerability', 3, 0.25, caster);
            dealDamage(caster, enemy, atk * 2.0, {
                isAbility: true,
                canCrit: true,
                canDodge: true
            });
        });
    },

    mud_stalker: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, isEvolved);
        addStatus(target, 'root', scale.ccDur * (isEvolved ? 1.3 : 1.0), null, caster);
        addStatus(target, 'vulnerability', 3, 0.2, caster);
        var lowHp = target.hp < target.maxHp * 0.4;
        dealDamage(caster, target, atk * (isEvolved ? 2.1 : 1.8), {
            isAbility: true,
            forceCrit: lowHp,
            canCrit: true,
            canDodge: true
        });
    },

    quake_reaper: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, true);
        addStatus(target, 'root', scale.ccDur * 1.3, null, caster);
        addStatus(target, 'vulnerability', 3, 0.25, caster);
        var lowHp = target.hp < target.maxHp * 0.35;
        dealDamage(caster, target, atk * 2.1, {
            isAbility: true,
            forceCrit: lowHp,
            canCrit: true,
            canDodge: true
        });
    },

    golem: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(3, isEvolved);
        var shieldAmt = caster.maxHp * scale.shieldPct * (isEvolved ? 1.35 : 1.0);
        grantShield(caster, caster, shieldAmt);
        addStatus(caster, 'drMod', 4, (isEvolved ? 0.2 : 0.15), caster);
        addStatus(caster, 'root', 3, null, caster);
    },

    iron_colossus: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(3, true);
        var shieldAmt = caster.maxHp * scale.shieldPct * 1.35;
        grantShield(caster, caster, shieldAmt);
        addStatus(caster, 'drMod', 4, 0.25, caster);
        addStatus(caster, 'root', 3, null, caster);
    },

    terra_sage: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(3, isEvolved);
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, allies);
        nearby.forEach(function(ally) {
            addStatus(ally, 'drMod', 5, (isEvolved ? 0.12 : 0.08), caster);
            addStatus(ally, 'regen', 5, 0.01, caster);
        });
    },

    earthweaver: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(3, true);
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 3, allies);
        nearby.forEach(function(ally) {
            addStatus(ally, 'drMod', 5, 0.15, caster);
            addStatus(ally, 'regen', 5, 0.015, caster);
        });
    },

    ancient_treant: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            addStatus(enemy, 'taunt', 2.5, caster, caster);
        });
        caster.taunting = true;
        caster.reflectMultiplier = (isEvolved ? 0.55 : 0.4);
    },

    world_sentinel: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 4, enemies);
        nearby.forEach(function(enemy) {
            addStatus(enemy, 'taunt', 3, caster, caster);
        });
        caster.taunting = true;
        caster.reflectMultiplier = 0.6;
    },

    grove_warden: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(4, isEvolved);
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            addStatus(enemy, 'root', scale.ccDur * (isEvolved ? 1.35 : 1.0), null, caster);
            addStatus(enemy, 'vulnerability', 3, 0.25, caster);
            dealDamage(caster, enemy, atk * (isEvolved ? 2.3 : 2.0), {
                isAbility: true,
                canCrit: true,
                canDodge: true
            });
        });
    },

    worldroot_sentinel: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(4, true);
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 4, enemies);
        nearby.forEach(function(enemy) {
            addStatus(enemy, 'root', scale.ccDur * 1.35, null, caster);
            addStatus(enemy, 'vulnerability', 4, 0.3, caster);
            dealDamage(caster, enemy, atk * 2.3, {
                isAbility: true,
                canCrit: true,
                canDodge: true
            });
        });
    },

    world_tree: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },

    yggdrasil: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },

    // WIND UNITS (8 base + 8 evolved = 16)
    gale_dancer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, isEvolved);
        var lowest = getLowestHpUnit(allies);
        if (lowest) {
            dealHealing(caster, lowest, atk * (isEvolved ? 1.9 : 1.6));
        }
        var enemyAtkMult = isEvolved ? 0.2 : 0.15;
        addStatus(target, 'atkMod', 3, -enemyAtkMult, caster);
    },

    stormweaver: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var lowest = getLowestHpUnit(allies);
        if (lowest) {
            dealHealing(caster, lowest, atk * 1.9);
        }
        addStatus(target, 'atkMod', 3, -0.25, caster);
    },

    wind_squire: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, isEvolved);
        addStatus(caster, 'dodgeBuff', 4, isEvolved ? 0.25 : 0.2, caster);
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
        nearby.forEach(function(enemy) {
            var counterDmg = Math.floor(atk * (isEvolved ? 1.2 : 1.0));
            dealDamage(caster, enemy, counterDmg, {isAbility: true, canCrit: true, canDodge: false});
        });
    },

    zephyr_warrior: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        addStatus(caster, 'dodgeBuff', 4, 0.3, caster);
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            var counterDmg = Math.floor(atk * 1.4);
            dealDamage(caster, enemy, counterDmg, {isAbility: true, canCrit: true, canDodge: false});
        });
    },

    sky_knight: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, isEvolved);
        addStatus(caster, 'dodgeBuff', 4, isEvolved ? 0.25 : 0.2, caster);
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, allies);
        nearby.forEach(function(ally) {
            var shieldAmt = caster.maxHp * 0.15;
            grantShield(ally, caster, shieldAmt);
        });
    },

    aegis_paladin: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, true);
        addStatus(caster, 'dodgeBuff', 4, 0.3, caster);
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 3, allies);
        nearby.forEach(function(ally) {
            var shieldAmt = caster.maxHp * 0.2;
            grantShield(ally, caster, shieldAmt);
        });
    },

    monsoon_caller: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(3, isEvolved);
        dealDamage(caster, target, atk * (isEvolved ? 2.2 : 1.9), {isAbility: true, canCrit: true, canDodge: true});
        var res = {killed: target.hp <= 0};
        if (res.killed) {
            var chain = getUnitsInRadius(target.gridRow, target.gridCol, 2, enemies).filter(function(e) { return e !== target; })[0];
            if (chain) {
                dealDamage(caster, chain, atk * (isEvolved ? 1.8 : 1.5), {isAbility: true, canCrit: true, canDodge: true});
                applyElementCC(caster, chain, scale);
            }
        }
        return res;
    },

    tempest_lord: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(3, true);
        dealDamage(caster, target, atk * 2.2, {isAbility: true, canCrit: true, canDodge: true});
        var res = {killed: target.hp <= 0};
        if (res.killed) {
            var chain = getUnitsInRadius(target.gridRow, target.gridCol, 3, enemies).filter(function(e) { return e !== target; })[0];
            if (chain) {
                dealDamage(caster, chain, atk * 1.8, {isAbility: true, canCrit: true, canDodge: true});
                applyElementCC(caster, chain, scale);
            }
        }
        return res;
    },

    wind_duelist: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(3, isEvolved);
        var hits = isEvolved ? 5 : 4;
        for (var i = 0; i < hits; i++) {
            var hitDmg = Math.floor(atk * (isEvolved ? 1.5 : 1.3));
            dealDamage(caster, target, hitDmg, {isAbility: true, canCrit: true, canDodge: true});
        }
        addStatus(caster, 'dodgeBuff', 3, isEvolved ? 0.2 : 0.15, caster);
    },

    hurricane_blade: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var hits = 5;
        for (var i = 0; i < hits; i++) {
            var hitDmg = Math.floor(atk * 1.6);
            dealDamage(caster, target, hitDmg, {isAbility: true, canCrit: true, canDodge: true});
        }
        addStatus(caster, 'dodgeBuff', 3, 0.25, caster);
    },

    storm_sovereign: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(4, isEvolved);
        moveUnitToCell(caster, target.gridRow, target.gridCol, grid);
        var damage = atk * (isEvolved ? 2.6 : 2.3);
        var res = dealDamage(caster, target, damage, {isAbility: true, canCrit: true, canDodge: true});
        if (res.killed) {
            for (var i = 0; i < (isEvolved ? 3 : 2); i++) {
                var nextEnemy = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies).filter(function(e) { return e.hp > 0; })[0];
                if (!nextEnemy) break;
                moveUnitToCell(caster, nextEnemy.gridRow, nextEnemy.gridCol, grid);
                dealDamage(caster, nextEnemy, atk * 2.0, {isAbility: true, canCrit: true, canDodge: true});
                if (nextEnemy.hp <= 0) res.killed = true;
            }
        }
        return res;
    },

    tempest_emperor: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(4, true);
        moveUnitToCell(caster, target.gridRow, target.gridCol, grid);
        var damage = atk * 2.6;
        var res = dealDamage(caster, target, damage, {isAbility: true, canCrit: true, canDodge: true});
        if (res.killed) {
            for (var i = 0; i < 3; i++) {
                var nextEnemy = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies).filter(function(e) { return e.hp > 0; })[0];
                if (!nextEnemy) break;
                moveUnitToCell(caster, nextEnemy.gridRow, nextEnemy.gridCol, grid);
                dealDamage(caster, nextEnemy, atk * 2.2, {isAbility: true, canCrit: true, canDodge: true});
                if (nextEnemy.hp <= 0) res.killed = true;
            }
        }
        return res;
    },

    tempest_weaver: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var damage = Math.floor(atk * (isEvolved ? 2.4 : 2.1));
        dealDamage(caster, target, damage, {isAbility: true, canCrit: true, canDodge: true});
        var escape = findEmptyCellNear(caster.gridRow, caster.gridCol, grid);
        if (escape) moveUnitToCell(caster, escape.row, escape.col, grid);
        grantShield(caster, caster, Math.floor(caster.maxHp * (isEvolved ? 0.25 : 0.2)));
    },

    stormweft_oracle: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var damage = Math.floor(atk * 2.6);
        dealDamage(caster, target, damage, {isAbility: true, canCrit: true, canDodge: true});
        var escape = findEmptyCellNear(caster.gridRow, caster.gridCol, grid);
        if (escape) moveUnitToCell(caster, escape.row, escape.col, grid);
        grantShield(caster, caster, Math.floor(caster.maxHp * 0.3));
    },

    void_wyrm: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },

    dimensional_dragon: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },

    // Missing Wind evolved forms
    storm_assassin: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(caster.cost, true);
        var dmg = Math.floor(atk * scale.abilityMult * 1.35);
        var result = dealDamage(caster, target, dmg, {isAbility: true, canCrit: true, forceCrit: true});
        if (result.killed) {
            addStatus(caster, 'atkBuff', 4, 0.22, caster);
            var remaining = enemies.filter(function(e){ return e !== target && e.hp > 0; });
            var next = getLowestHpUnit(remaining);
            if (next) {
                var cell = findEmptyCellNear(next.gridRow, next.gridCol, grid);
                if (cell) moveUnitToCell(caster, cell.row, cell.col, grid);
                dealDamage(caster, next, Math.floor(dmg * 0.85), {isAbility: true, canCrit: true});
            }
        }
    },
    gale_sniper: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(caster.cost, true);
        var dmgPerHit = Math.floor(atk * scale.abilityMult * 0.42);
        for (var i = 0; i < 6; i++) {
            if (target.hp > 0) dealDamage(caster, target, dmgPerHit, {isAbility: true, canCrit: true});
        }
        addStatus(caster, 'dodgeBuff', 3, 0.15, caster);
        addStatus(caster, 'atkBuff', 3, 0.18, caster);
    },
    tempest_guardian: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(caster.cost, true);
        var lowestAlly = getLowestHpUnit(allies);
        if (lowestAlly) {
            var cell = findEmptyCellNear(lowestAlly.gridRow, lowestAlly.gridCol, grid);
            if (cell) moveUnitToCell(caster, cell.row, cell.col, grid);
            grantShield(caster, lowestAlly, Math.floor(caster.maxHp * 0.28));
        }
        grantShield(caster, caster, Math.floor(caster.maxHp * 0.32));
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
        for (var i = 0; i < nearby.length; i++) {
            addStatus(nearby[i], 'taunt', 2.5, 1, caster);
        }
        addStatus(caster, 'dodgeBuff', 3, 0.3, caster);
    },

    // LIGHTNING UNITS (11 base + 11 evolved = 22)
    spark_fencer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, isEvolved);
        var marks = getStatusValue(target, 'stun') || 0;
        var bonusDmg = marks * atk * 0.25;
        dealDamage(caster, target, atk * (isEvolved ? 2.0 : 1.7) + bonusDmg, {isAbility: true, canCrit: true, canDodge: true});
        addStatus(target, 'stun', 1, null, caster);
        addStatus(caster, 'critBuff', 3, 0.2, caster);
    },

    arc_duelist: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, true);
        var marks = getStatusValue(target, 'stun') || 0;
        var bonusDmg = marks * atk * 0.35;
        dealDamage(caster, target, atk * 2.0 + bonusDmg, {isAbility: true, canCrit: true, canDodge: true});
        addStatus(target, 'stun', 1, null, caster);
        addStatus(caster, 'critBuff', 3, 0.3, caster);
    },

    volt_runner: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, isEvolved);
        moveUnitToCell(caster, target.gridRow, target.gridCol, grid);
        var res = dealDamage(caster, target, atk * (isEvolved ? 2.2 : 1.9), {isAbility: true, canCrit: true, canDodge: true});
        if (res.killed) {
            addStatus(caster, 'critBuff', 4, 0.25, caster);
            var nextEnemy = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies).filter(function(e) { return e.hp > 0; })[0];
            if (nextEnemy) {
                moveUnitToCell(caster, nextEnemy.gridRow, nextEnemy.gridCol, grid);
                dealDamage(caster, nextEnemy, atk * 1.5, {isAbility: true, canCrit: true, canDodge: true});
            }
        }
        return res;
    },

    lightning_phantom: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, true);
        moveUnitToCell(caster, target.gridRow, target.gridCol, grid);
        var res = dealDamage(caster, target, atk * 2.2, {isAbility: true, canCrit: true, canDodge: true});
        if (res.killed) {
            addStatus(caster, 'critBuff', 4, 0.35, caster);
            var nextEnemy = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies).filter(function(e) { return e.hp > 0; })[0];
            if (nextEnemy) {
                moveUnitToCell(caster, nextEnemy.gridRow, nextEnemy.gridCol, grid);
                dealDamage(caster, nextEnemy, atk * 1.7, {isAbility: true, canCrit: true, canDodge: true});
            }
        }
        return res;
    },

    thunder_archer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, isEvolved);
        var damage = atk * (isEvolved ? 2.8 : 2.5);
        dealDamage(caster, target, damage, {isAbility: true, canCrit: true, canDodge: true});
        applyElementCC(caster, target, scale);
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 2, enemies);
        nearby.forEach(function(enemy) {
            if (enemy !== target) dealDamage(caster, enemy, damage * 0.5, {isAbility: true, canCrit: true, canDodge: true});
        });
    },

    storm_archer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, true);
        var damage = atk * 2.8;
        dealDamage(caster, target, damage, {isAbility: true, canCrit: true, canDodge: true});
        applyElementCC(caster, target, scale);
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            if (enemy !== target) dealDamage(caster, enemy, damage * 0.6, {isAbility: true, canCrit: true, canDodge: true});
        });
    },

    pulse_mender: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, isEvolved);
        var lowest = getLowestHpUnit(allies);
        if (lowest) {
            dealHealing(caster, lowest, atk * (isEvolved ? 1.8 : 1.5));
        }
        applyElementCC(caster, target, scale);
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 2, enemies);
        nearby.forEach(function(enemy) {
            applyElementCC(caster, enemy, scale);
        });
    },

    storm_medic: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, true);
        var lowest = getLowestHpUnit(allies);
        if (lowest) {
            dealHealing(caster, lowest, atk * 1.8);
        }
        applyElementCC(caster, target, scale);
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            applyElementCC(caster, enemy, scale);
        });
    },

    tesla_knight: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, isEvolved);
        applyElementCC(caster, target, scale);
        applyElementDebuff(caster, target, scale);
        var shieldAmt = caster.maxHp * (isEvolved ? 0.25 : 0.2);
        grantShield(caster, caster, shieldAmt);
    },

    storm_bastion: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, true);
        applyElementCC(caster, target, scale);
        applyElementDebuff(caster, target, scale);
        var shieldAmt = caster.maxHp * 0.3;
        grantShield(caster, caster, shieldAmt);
    },

    shock_mage: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, isEvolved);
        var damage = atk * (isEvolved ? 2.4 : 2.1);
        dealDamage(caster, target, damage, {isAbility: true, canCrit: true, canDodge: true});
        applyElementCC(caster, target, scale);
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 2, enemies);
        nearby.forEach(function(enemy) {
            if (enemy !== target) {
                dealDamage(caster, enemy, damage * 0.4, {isAbility: true, canCrit: true, canDodge: true});
                applyElementCC(caster, enemy, scale);
            }
        });
    },

    tempest_mage: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, true);
        var damage = atk * 2.4;
        dealDamage(caster, target, damage, {isAbility: true, canCrit: true, canDodge: true});
        applyElementCC(caster, target, scale);
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            if (enemy !== target) {
                dealDamage(caster, enemy, damage * 0.5, {isAbility: true, canCrit: true, canDodge: true});
                applyElementCC(caster, enemy, scale);
            }
        });
    },

    ball_lightning: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(3, isEvolved);
        var stuns = getStatusValue(target, 'stun') || 0;
        var bonusDmg = stuns * atk * 0.3;
        dealDamage(caster, target, atk * (isEvolved ? 2.3 : 2.0) + bonusDmg, {isAbility: true, canCrit: true, canDodge: true});
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 2, enemies);
        nearby.forEach(function(enemy) {
            dealDamage(caster, enemy, atk * 1.0, {isAbility: true, canCrit: true, canDodge: true});
        });
    },

    plasma_core: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(3, true);
        var stuns = getStatusValue(target, 'stun') || 0;
        var bonusDmg = stuns * atk * 0.4;
        dealDamage(caster, target, atk * 2.3 + bonusDmg, {isAbility: true, canCrit: true, canDodge: true});
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            dealDamage(caster, enemy, atk * 1.2, {isAbility: true, canCrit: true, canDodge: true});
        });
    },

    thunder_warden: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(3, isEvolved);
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
        nearby.forEach(function(enemy) {
            applyElementCC(caster, enemy, scale);
            applyElementDebuff(caster, enemy, scale);
        });
        var shieldAmt = caster.maxHp * (isEvolved ? 0.3 : 0.25);
        grantShield(caster, caster, shieldAmt);
    },

    storm_fortress: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(3, true);
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            applyElementCC(caster, enemy, scale);
            applyElementDebuff(caster, enemy, scale);
        });
        var shieldAmt = caster.maxHp * 0.35;
        grantShield(caster, caster, shieldAmt);
    },

    thunderbird: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(4, isEvolved);
        moveUnitToCell(caster, target.gridRow, target.gridCol, grid);
        var res = dealDamage(caster, target, atk * (isEvolved ? 2.5 : 2.2), {isAbility: true, canCrit: true, canDodge: true});
        if (res.killed) {
            addStatus(caster, 'critBuff', 4, 0.25, caster);
            var nextEnemy = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies).filter(function(e) { return e.hp > 0; })[0];
            if (nextEnemy) {
                moveUnitToCell(caster, nextEnemy.gridRow, nextEnemy.gridCol, grid);
                dealDamage(caster, nextEnemy, atk * 1.7, {isAbility: true, canCrit: true, canDodge: true});
            }
        }
        return res;
    },

    roc_of_storms: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(4, true);
        moveUnitToCell(caster, target.gridRow, target.gridCol, grid);
        var res = dealDamage(caster, target, atk * 2.5, {isAbility: true, canCrit: true, canDodge: true});
        if (res.killed) {
            addStatus(caster, 'critBuff', 4, 0.35, caster);
            var nextEnemy = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies).filter(function(e) { return e.hp > 0; })[0];
            if (nextEnemy) {
                moveUnitToCell(caster, nextEnemy.gridRow, nextEnemy.gridCol, grid);
                dealDamage(caster, nextEnemy, atk * 1.9, {isAbility: true, canCrit: true, canDodge: true});
            }
        }
        return res;
    },

    voltfang_stalker: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(4, isEvolved);
        moveUnitToCell(caster, target.gridRow, target.gridCol, grid);
        var damage = atk * (isEvolved ? 2.5 : 2.2);
        var res = dealDamage(caster, target, damage, {isAbility: true, canCrit: true, canDodge: true});
        if (res.killed) {
            addStatus(caster, 'critBuff', 4, 0.25, caster);
            addStatus(caster, 'stealth', 2, null, caster);
        }
        return res;
    },

    plasma_ravager: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(4, true);
        moveUnitToCell(caster, target.gridRow, target.gridCol, grid);
        var res = dealDamage(caster, target, atk * 2.5, {isAbility: true, canCrit: true, canDodge: true});
        if (res.killed) {
            addStatus(caster, 'critBuff', 4, 0.35, caster);
            addStatus(caster, 'stealth', 2, null, caster);
        }
        return res;
    },

    storm_dragon: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },

    thunder_god: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },

    // FORCE UNITS (11 base + 11 evolved = 22)
    iron_soldier: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, isEvolved);
        addStatus(caster, 'atkBuff', 5, isEvolved ? 0.15 : 0.12, caster);
        dealDamage(caster, target, atk * (isEvolved ? 1.9 : 1.6), {isAbility: true, canCrit: true, canDodge: true});
    },

    legionnaire: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, true);
        addStatus(caster, 'atkBuff', 5, 0.2, caster);
        dealDamage(caster, target, atk * 1.9, {isAbility: true, canCrit: true, canDodge: true});
    },

    shadow_blade: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, isEvolved);
        moveUnitToCell(caster, target.gridRow, target.gridCol, grid);
        var lowHp = target.hp < target.maxHp * 0.35;
        var damage = atk * (isEvolved ? 2.3 : 2.0);
        var res = dealDamage(caster, target, damage, {
            isAbility: true,
            forceCrit: lowHp,
            canCrit: true,
            canDodge: true
        });
        if (res.killed) {
            addStatus(caster, 'stealth', 2, null, caster);
        }
        return res;
    },

    night_stalker: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, true);
        moveUnitToCell(caster, target.gridRow, target.gridCol, grid);
        var lowHp = target.hp < target.maxHp * 0.35;
        var damage = atk * 2.3;
        var res = dealDamage(caster, target, damage, {
            isAbility: true,
            forceCrit: lowHp,
            canCrit: true,
            canDodge: true
        });
        if (res.killed) {
            addStatus(caster, 'stealth', 2, null, caster);
        }
        return res;
    },

    steel_archer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, isEvolved);
        var stacks = caster.stacks || 0;
        var stackMult = 1 + (stacks * 0.1);
        addStatus(caster, 'atkBuff', 5, isEvolved ? 0.15 : 0.12, caster);
        dealDamage(caster, target, atk * (isEvolved ? 1.9 : 1.6) * stackMult, {isAbility: true, canCrit: true, canDodge: true});
        caster.stacks = (caster.stacks || 0) + 1;
    },

    ballista_archer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(1, true);
        var stacks = caster.stacks || 0;
        var stackMult = 1 + (stacks * 0.12);
        addStatus(caster, 'atkBuff', 5, 0.2, caster);
        dealDamage(caster, target, atk * 1.9 * stackMult, {isAbility: true, canCrit: true, canDodge: true});
        caster.stacks = (caster.stacks || 0) + 1;
    },

    war_cleric: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, isEvolved);
        var lowest = getLowestHpUnit(allies);
        if (lowest) {
            dealHealing(caster, lowest, atk * (isEvolved ? 1.8 : 1.5));
        }
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
        nearby.forEach(function(enemy) {
            dealDamage(caster, enemy, atk * (isEvolved ? 1.2 : 1.0), {isAbility: true, canCrit: false});
        });
    },

    battle_priest: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, true);
        var lowest = getLowestHpUnit(allies);
        if (lowest) {
            dealHealing(caster, lowest, atk * 1.8);
            var shieldAmt = caster.maxHp * 0.1;
            grantShield(lowest, caster, shieldAmt);
        }
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            dealDamage(caster, enemy, atk * 1.3, {isAbility: true, canCrit: false});
        });
    },

    battle_mage: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, isEvolved);
        var damage = Math.floor(atk * (isEvolved ? 2.1 : 1.8));
        dealDamage(caster, target, damage, {isAbility: true, canCrit: true, canDodge: true});
        var escape = findEmptyCellNear(caster.gridRow, caster.gridCol, grid);
        if (escape) moveUnitToCell(caster, escape.row, escape.col, grid);
    },

    force_archmage: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, true);
        var damage = Math.floor(atk * 2.4);
        dealDamage(caster, target, damage, {isAbility: true, canCrit: true, canDodge: true});
        grantShield(caster, caster, Math.floor(caster.maxHp * 0.15));
        var escape = findEmptyCellNear(caster.gridRow, caster.gridCol, grid);
        if (escape) moveUnitToCell(caster, escape.row, escape.col, grid);
    },

    shield_bearer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, isEvolved);
        var lowestAlly = getLowestHpUnit(allies);
        if (lowestAlly && lowestAlly !== caster) {
            moveUnitToCell(caster, lowestAlly.gridRow, lowestAlly.gridCol, grid);
            var shieldAmt = caster.maxHp * (isEvolved ? 0.4 : 0.35);
            grantShield(lowestAlly, caster, shieldAmt);
            addStatus(lowestAlly, 'taunt', 2, caster, caster);
        }
        addStatus(caster, 'ccBlock', 2, null, caster);
    },

    bastion: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(2, true);
        var lowestAlly = getLowestHpUnit(allies);
        if (lowestAlly && lowestAlly !== caster) {
            moveUnitToCell(caster, lowestAlly.gridRow, lowestAlly.gridCol, grid);
            var shieldAmt = caster.maxHp * 0.45;
            grantShield(lowestAlly, caster, shieldAmt);
            addStatus(lowestAlly, 'taunt', 2.5, caster, caster);
        }
        addStatus(caster, 'ccBlock', 2, null, caster);
    },

    gladiator: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(3, isEvolved);
        var stacks = caster.stacks || 0;
        var stackMult = 1 + (stacks * 0.15);
        var damage = atk * (isEvolved ? 2.3 : 2.0) * stackMult;
        dealDamage(caster, target, damage, {isAbility: true, canCrit: true, canDodge: true});
        addStatus(caster, 'atkSpd', 4, isEvolved ? 0.2 : 0.15, caster);
        caster.stacks = (caster.stacks || 0) + 1;
    },

    champion: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(3, true);
        var stacks = caster.stacks || 0;
        var stackMult = 1 + (stacks * 0.2);
        var damage = atk * 2.3 * stackMult;
        dealDamage(caster, target, damage, {isAbility: true, canCrit: true, canDodge: true});
        addStatus(caster, 'atkSpd', 4, 0.25, caster);
        caster.stacks = (caster.stacks || 0) + 1;
    },

    fortress: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(3, isEvolved);
        var shieldAmt = caster.maxHp * (isEvolved ? 0.35 : 0.3);
        grantShield(caster, caster, shieldAmt);
        addStatus(caster, 'drMod', 4, (isEvolved ? 0.2 : 0.15), caster);
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 2, enemies);
        nearby.forEach(function(enemy) {
            addStatus(enemy, 'taunt', 2, caster, caster);
            addStatus(enemy, 'atkMod', 3, -0.15, caster);
        });
    },

    citadel: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(3, true);
        var shieldAmt = caster.maxHp * 0.4;
        grantShield(caster, caster, shieldAmt);
        addStatus(caster, 'drMod', 4, 0.25, caster);
        var nearby = getUnitsInRadius(caster.gridRow, caster.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            addStatus(enemy, 'taunt', 2.5, caster, caster);
            addStatus(enemy, 'atkMod', 3, -0.2, caster);
        });
    },

    siege_engineer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(4, isEvolved);
        moveUnitToCell(caster, target.gridRow, target.gridCol, grid);
        var damage = atk * (isEvolved ? 2.2 : 1.9);
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 2, enemies);
        nearby.forEach(function(enemy) {
            dealDamage(caster, enemy, damage, {isAbility: true, canCrit: true, canDodge: true});
            addStatus(enemy, 'slow', 3, 0.25, caster);
        });
        var escape = findEmptyCellNear(caster.gridRow, caster.gridCol, grid);
        if (escape) moveUnitToCell(caster, escape.gridRow, escape.gridCol, grid);
    },

    war_architect: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(4, true);
        moveUnitToCell(caster, target.gridRow, target.gridCol, grid);
        var damage = atk * 2.2;
        var nearby = getUnitsInRadius(target.gridRow, target.gridCol, 3, enemies);
        nearby.forEach(function(enemy) {
            dealDamage(caster, enemy, damage, {isAbility: true, canCrit: true, canDodge: true});
            addStatus(enemy, 'slow', 3, 0.3, caster);
        });
        var escape = findEmptyCellNear(caster.gridRow, caster.gridCol, grid);
        if (escape) moveUnitToCell(caster, escape.gridRow, escape.gridCol, grid);
    },

    iron_duelist: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(4, isEvolved);
        var lowHp = target.hp < target.maxHp * 0.4;
        var damage = atk * (isEvolved ? 2.4 : 2.1);
        var res = dealDamage(caster, target, damage, {
            isAbility: true,
            forceCrit: lowHp,
            canCrit: true,
            canDodge: true
        });
        if (res.killed) {
            addStatus(caster, 'atkBuff', 4, 0.25, caster);
        }
        return res;
    },

    warforged_champion: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        var scale = getScale(4, true);
        var lowHp = target.hp < target.maxHp * 0.4;
        var damage = atk * 2.4;
        var res = dealDamage(caster, target, damage, {
            isAbility: true,
            forceCrit: lowHp,
            canCrit: true,
            canDodge: true
        });
        if (res.killed) {
            addStatus(caster, 'atkBuff', 4, 0.35, caster);
        }
        return res;
    },

    titan_lord: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },

    cosmic_titan: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },

    // WIND, LIGHTNING, FORCE UNITS: Placeholder stubs (remaining unused)
    wind_archer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    sky_dancer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    gust_sentinel: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    whirlwind_duelist: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    zephyr_scout: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
        },
    tempest_rogue: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    breeze_shaman: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    gale_priest: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    wind_guardian: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    storm_sentinel: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    draft_lancer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    cyclone_lance: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    wind_dancer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    breeze_dancer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    sky_warden: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    cloud_walker: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    gust_dragon: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    typhoon_drake: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    wind_elemental: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    sky_spirit: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    sky_titan: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    eternal_sky: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    bolt_warrior: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    shock_dancer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    static_sentinel: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    voltage_duelist: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    spark_scout: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    thunder_rogue: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    surge_shaman: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    voltage_priest: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    lightning_guardian: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    volt_sentinel: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    thunder_lancer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    storm_lance: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    lightning_dancer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    volt_dancer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    lightning_warden: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    spark_walker: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    lightning_dragon: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    thunder_drake: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    lightning_elemental: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    storm_spirit: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    lightning_titan: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    eternal_storm: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    force_warrior: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    void_dancer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    rift_sentinel: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    void_duelist: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    rupture_scout: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    vortex_rogue: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    chaos_shaman: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    void_priest: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    force_guardian: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    rift_sentinel_v2: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    void_lancer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    rupture_lance: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    void_dancer_v2: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    rift_dancer: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    force_warden: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    void_walker: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    void_dragon: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    rupture_drake: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    force_elemental: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    chaos_spirit: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    force_titan: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    },
    eternal_void: function(caster, target, enemies, allies, grid, atk, isEvolved) {
        return;
    }
};

// =============================================================================
// TEMPLATE_PASSIVES: Passive behaviors shared by template type
// =============================================================================

var TEMPLATE_PASSIVES = {
    // Passive handlers organized by trigger type (onHit, onTakeDamage, onKill, onTick, onHeal)
    // Passives will be called with (caster, trigger, data) format
};

// =============================================================================
// MAIN ENTRY POINTS
// =============================================================================

function executeTemplateAbility(caster) {
    if (!caster.templateKey || !UNIT_ABILITIES[caster.templateKey]) {
        return;
    }

    // Find enemies and allies (matching main-v2.js conventions)
    var enemies = caster.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
    var allies = caster.side === 'player' ? combatState.playerUnits : combatState.enemyUnits;

    // Filter to alive units
    var aliveEnemies = [];
    for (var i = 0; i < enemies.length; i++) {
        if (enemies[i].hp > 0) aliveEnemies.push(enemies[i]);
    }
    var aliveAllies = [];
    for (var j = 0; j < allies.length; j++) {
        if (allies[j].hp > 0) aliveAllies.push(allies[j]);
    }

    if (aliveEnemies.length === 0) return;

    // Calculate effective ATK with buffs/debuffs (matching main-v2.js pre-switch logic)
    var atk = caster.attack;
    var atkBuffVal = typeof getStatusValue === 'function' ? getStatusValue(caster, 'atkBuff') : 0;
    var atkModVal = typeof getStatusValue === 'function' ? getStatusValue(caster, 'atkMod') : 0;
    if (atkBuffVal !== 0 || atkModVal !== 0) atk = Math.floor(atk * (1 + atkBuffVal) * (1 + atkModVal));
    if (caster.abilityBuffs && caster.abilityBuffs.nextAtkMult) {
        atk = Math.floor(atk * caster.abilityBuffs.nextAtkMult);
        delete caster.abilityBuffs.nextAtkMult;
    }
    if (caster.manaShrine && caster.manaShrine.abilityDamageMult > 1) {
        atk = Math.floor(atk * caster.manaShrine.abilityDamageMult);
    }

    // Use caster's current combat target if valid, otherwise find one
    var target = caster.target;
    if (!target || target.hp <= 0) {
        target = aliveEnemies[0];
    }

    // Execute the unit's specific ability
    var ability = UNIT_ABILITIES[caster.templateKey];
    ability(caster, target, aliveEnemies, aliveAllies, combatState.grid, atk, caster.evolved);
}

function processTemplatePassive(caster, trigger, data) {
    if (!caster.templateKey || !TEMPLATE_PASSIVES[caster.templateKey]) {
        return;
    }

    var passive = TEMPLATE_PASSIVES[caster.templateKey];
    passive(caster, trigger, data);
}

// Helper: distance function
function distance(a, b) {
    var dx = a.gridRow - b.gridRow;
    var dy = a.gridCol - b.gridCol;
    return Math.sqrt(dx * dx + dy * dy);
}

// =============================================================================
// synergies.js — Synergy calculation and bonus application
// =============================================================================

function updateActiveSynergies(gs) {
    var archetypeCounts = {};
    var elementCounts = {};
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 7; c++) {
            var u = gs.board[r][c];
            if (!u) continue;
            archetypeCounts[u.archetype] = (archetypeCounts[u.archetype] || 0) + 1;
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

            // Guardian: HP + DR (applies to all)
            if (archKey === 'guardian') {
                if (bonus.hpBonus) { u.maxHp += bonus.hpBonus; u.hp += bonus.hpBonus; }
                if (bonus.damageReduction) u.damageReduction = (u.damageReduction || 0) + bonus.damageReduction;
            }

            // Warden: CC duration + tenacity
            if (archKey === 'warden') {
                if (bonus.ccDurationBonus) u.ccDurationBonus = (u.ccDurationBonus || 0) + bonus.ccDurationBonus;
                if (bonus.tenacity) u.tenacity = (u.tenacity || 0) + bonus.tenacity;
                if (bonus.wardenFirstCcImmune && u.archetype === 'warden') u.wardenFirstCcImmune = true;
            }

            // Vanguard: Front-row only
            if (archKey === 'vanguard') {
                if (u.cy >= 5) {
                    if (bonus.frontHpBonus) { u.maxHp += bonus.frontHpBonus; u.hp += bonus.frontHpBonus; }
                    if (bonus.frontAtkBonus) u.attack += bonus.frontAtkBonus;
                    if (bonus.lifestealPct) u.lifesteal = (u.lifesteal || 0) + bonus.lifestealPct;
                }
            }

            // Duelist: Double-strike + lifesteal (duelists only)
            if (archKey === 'duelist' && u.archetype === 'duelist') {
                if (bonus.doubleStrikeChance) u.doubleStrikeChance = bonus.doubleStrikeChance;
                if (bonus.lifestealPct) u.lifesteal = (u.lifesteal || 0) + bonus.lifestealPct;
                if (bonus.cantMissAttacks) u.cantMissAttacks = true;
            }

            // Predator: ATK speed + execute damage (predators only)
            if (archKey === 'predator' && u.archetype === 'predator') {
                if (bonus.atkSpdBoost) u.attackSpd = u.attackSpd / (1 + bonus.atkSpdBoost);
                if (bonus.executeDamageBonus) u.executeDamageBonus = bonus.executeDamageBonus;
                if (bonus.executeThreshold) u.executeThreshold = bonus.executeThreshold;
                if (bonus.dashResetOnKill) u.dashResetOnKill = true;
            }

            // Ranger: Range + furthest damage + pierce (rangers only)
            if (archKey === 'ranger' && u.archetype === 'ranger') {
                if (bonus.rangeBonus) u.range += bonus.rangeBonus;
                if (bonus.furthestDmgBonus) u.furthestDmgBonus = bonus.furthestDmgBonus;
                if (bonus.atkSpdBoost) u.attackSpd = u.attackSpd / (1 + bonus.atkSpdBoost);
                if (bonus.pierceCount) u.pierceCount = bonus.pierceCount;
            }

            // Sorcerer: Ability damage + starting mana (sorcerers only)
            if (archKey === 'sorcerer' && u.archetype === 'sorcerer') {
                if (bonus.abilityDmgBonus) u.abilityDmgBonus = (u.abilityDmgBonus || 0) + bonus.abilityDmgBonus;
                if (bonus.startingManaBonus) u.mana = (u.mana || 0) + bonus.startingManaBonus;
                if (bonus.abilityManaRefund) u.abilityManaRefund = bonus.abilityManaRefund;
            }

            // Mystic: Element damage + element resist (applies to all)
            if (archKey === 'mystic') {
                if (bonus.elemDmgBonus) u.elemDmgBonus = (u.elemDmgBonus || 0) + bonus.elemDmgBonus;
                if (bonus.elemResist) u.elemResist = (u.elemResist || 0) + bonus.elemResist;
            }

            // Sage: Healing bonus + regen (applies to all)
            if (archKey === 'sage') {
                if (bonus.healBonus) u.healBonus = (u.healBonus || 0) + bonus.healBonus;
                if (bonus.teamRegenPct) u.regenPct = (u.regenPct || 0) + bonus.teamRegenPct;
                if (bonus.overhealToShieldPct) u.overhealToShieldPct = bonus.overhealToShieldPct;
            }
        }
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

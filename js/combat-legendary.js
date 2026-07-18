// combat-legendary.js -- T5 legendary ability system (split from main-v2.js)

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


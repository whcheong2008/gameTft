// combat-damage.js -- unified damage pipeline (split from main-v2.js)

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
    var overheal = amount - actualHeal;
    target.hp += actualHeal;
    if (source && source.combatStats) {
        source.combatStats.healingDone += actualHeal;
    }
    if (typeof spawnDamageNumber === 'function' && (!combatState || !combatState.autoBattle) && actualHeal > 0) {
        spawnDamageNumber(target.gridRow, target.gridCol, '+' + actualHeal, 'heal');
    }

    // Sage heal-shield: when a Sage heals, target gains shield equal to % of heal
    if (source && source.healShieldPct && actualHeal > 0) {
        var healShield = Math.floor(actualHeal * source.healShieldPct);
        if (healShield > 0) {
            target.shield = (target.shield || 0) + healShield;
            // Shield decays after duration (tracked as status)
            // For simplicity, shield persists until broken (no decay tracking)
        }
    }

    // Sage overheal-to-shield: excess healing converts to permanent shield
    if (source && source.overhealToShieldPct && overheal > 0) {
        var overhealShield = Math.floor(overheal * source.overhealToShieldPct);
        if (overhealShield > 0) {
            target.shield = (target.shield || 0) + overhealShield;
        }
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
            var effectiveElemResist = target.elemResist;
            // Mystic shred reduces element resist
            var shredVal = getStatusValue(target, 'elemResistShred');
            if (shredVal > 0) effectiveElemResist = Math.max(0, effectiveElemResist - shredVal);
            elemMult = 1.0 + (elemMult - 1.0) * (1 - effectiveElemResist);
        }
        dmg = Math.floor(dmg * elemMult);
    }

    // Step 3: Critical Strike
    if (options.forceCrit || (canCrit && source.critChance && Math.random() < source.critChance)) {
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
    // Sorcerer spell penetration: ability damage ignores % of DR
    if (options && options.isAbility && source.spellPenetration && totalDR > 0) {
        totalDR = totalDR * (1 - source.spellPenetration);
    }
    // Ranger focused shot: ignores % of DR
    if (options && options.focusedShotIgnoreDR && totalDR > 0) {
        totalDR = totalDR * (1 - options.focusedShotIgnoreDR);
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

    // Ranger mark: marked target takes more damage from all sources
    if (target._rangerMarked && target._rangerMarkAmp) {
        dmg = Math.floor(dmg * (1 + target._rangerMarkAmp));
    }

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
    var hadShield = target.shield && target.shield > 0;
    if (hadShield) {
        shieldAbsorbed = Math.min(target.shield, dmg);
        target.shield -= shieldAbsorbed;
        dmg -= shieldAbsorbed;
    }
    // Guardian shield-break tenacity: when shield fully breaks, grant tenacity boost
    if (hadShield && target.shield <= 0 && target.shieldBreakTenacity && !target._shieldBreakTriggered) {
        target._shieldBreakTriggered = true;
        target.tenacity = (target.tenacity || 0) + target.shieldBreakTenacity;
    }

    // Process on-hit passive (with reentry guard)
    if (combatState && source && !source._processingPassive) {
        processOnHitPassive(target, source, dmg + shieldAbsorbed, combatState.allUnits);
    }

    // Step 7: Apply to HP
    target.hp -= dmg;

    // Guardian Last Stand: first time dropping below threshold, become invulnerable + taunt
    if (target.hp > 0 && target.lastStandThreshold && !target._lastStandUsed) {
        if (target.hp / target.maxHp < target.lastStandThreshold) {
            target._lastStandUsed = true;
            target.stasis = target.lastStandInvulnDuration;
            if (target.lastStandTaunt && combatState) {
                var lastStandEnemies = target.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
                var nearbyForTaunt = typeof getUnitsInRadius === 'function' ? getUnitsInRadius(target.gridRow, target.gridCol, 2, lastStandEnemies) : [];
                for (var lst = 0; lst < nearbyForTaunt.length; lst++) {
                    if (nearbyForTaunt[lst].hp > 0) {
                        addStatus(nearbyForTaunt[lst], 'taunt', target.lastStandInvulnDuration, 0, target);
                    }
                }
            }
            if (typeof spawnDamageNumber === 'function' && (!combatState || !combatState.autoBattle)) {
                spawnDamageNumber(target.gridRow, target.gridCol, 'LAST STAND!', 'crit');
            }
        }
    }

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

    // Mystic ability-triggered effects (on ability damage)
    if (triggerOnHit && options.isAbility && target.hp > 0 && source) {
        // Mystic element resist shred: reduce target's element resist
        if (source.elemResistShred && source.elemResistShredDuration) {
            addStatus(target, 'elemResistShred', source.elemResistShredDuration, source.elemResistShred, source);
        }
        // Mystic random element proc: chance to apply additional element effect
        if (source.randomElementProcChance && Math.random() < source.randomElementProcChance) {
            var elemEffects = ['burn', 'freeze', 'root'];
            var randEffect = elemEffects[Math.floor(Math.random() * elemEffects.length)];
            var procDur = source.randomElementProcDuration || 2;
            if (randEffect === 'burn') {
                addStatus(target, 'burn', procDur, Math.floor(source.attack * 0.15), source);
            } else {
                addStatus(target, randEffect, procDur, 0, source);
            }
        }
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

        // Sage death-save: strongest Sage prevents one lethal hit per combat
        if (target.hp <= 0 && combatState && !combatState._deathSaveUsed) {
            var allies = target.side === 'player' ? combatState.playerUnits : combatState.enemyUnits;
            for (var ds = 0; ds < allies.length; ds++) {
                if (allies[ds].isDeathSaver && allies[ds].hp > 0 && allies[ds].deathSaveHealPct) {
                    combatState._deathSaveUsed = true;
                    target.hp = Math.floor(target.maxHp * allies[ds].deathSaveHealPct);
                    if (typeof spawnDamageNumber === 'function' && (!combatState || !combatState.autoBattle)) {
                        spawnDamageNumber(target.gridRow, target.gridCol, 'SAVED!', 'heal');
                    }
                    addCombatLog(allies[ds].name + ' saves ' + target.name + ' from death!');
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

            // Predator on-kill ATK buff (stacking)
            if (source.onKillAtkBuff && source.onKillAtkBuffDuration) {
                addStatus(source, 'atkBuff', source.onKillAtkBuffDuration, source.onKillAtkBuff, source);
            }
            // Predator on-kill mana refund
            if (source.onKillManaRefundPct && source.maxMana > 0) {
                source.currentMana = Math.min(source.maxMana, source.currentMana + Math.floor(source.maxMana * source.onKillManaRefundPct));
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
        // Still generate mana for attacking (with Mana Shrine bonus)
        if (attacker.maxMana > 0) {
            var blindManaGain = 10;
            if (attacker.manaShrine && attacker.manaShrine.manaGenMult) blindManaGain = Math.floor(blindManaGain * attacker.manaShrine.manaGenMult);
            attacker.currentMana = Math.min(attacker.maxMana, attacker.currentMana + blindManaGain);
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

    // Vanguard charge bonus: extra damage during first N seconds of combat
    if (attacker.chargeDmgBonus && combatState && combatState.elapsed <= (attacker.chargeDuration || 5)) {
        rawDmg = Math.floor(rawDmg * (1 + attacker.chargeDmgBonus));
    }

    // Execute damage (Predator): bonus damage to low-HP targets
    if (attacker.executeDamageBonus && attacker.executeThreshold && target.hp / target.maxHp < attacker.executeThreshold) {
        rawDmg = Math.floor(rawDmg * (1 + attacker.executeDamageBonus));
    }

    // Track attack counter for Duelist guaranteed crit and Ranger focused shot
    if (attacker.guaranteedCritEveryN || attacker.focusedShotEveryN) {
        attacker.attackCounter = (attacker.attackCounter || 0) + 1;
    }

    // Ranger mark: apply mark to current target (takes more damage from all sources)
    if (attacker.markTargetDmgAmp && target) {
        target._rangerMarked = true;
        target._rangerMarkAmp = attacker.markTargetDmgAmp;
    }

    // Build attack options
    var atkOpts = {isAutoAttack: true, canCrit: true, canDodge: true, applyElement: true, triggerOnHit: true};

    // Duelist guaranteed crit every N attacks
    if (attacker.guaranteedCritEveryN && attacker.attackCounter % attacker.guaranteedCritEveryN === 0) {
        atkOpts.forceCrit = true;
    }

    // Ranger focused shot every N attacks
    var isFocusedShot = false;
    if (attacker.focusedShotEveryN && attacker.attackCounter % attacker.focusedShotEveryN === 0) {
        atkOpts.forceCrit = true;
        atkOpts.focusedShotIgnoreDR = attacker.focusedShotIgnoreDR || 0.30;
        isFocusedShot = true;
    }

    // Vanguard charge stun: during charge window, attacks stun
    var chargeStun = false;
    if (attacker.chargeStunDuration && combatState && combatState.elapsed <= (attacker.chargeDuration || 5)) {
        chargeStun = true;
    }

    // Frost Shot buff check
    if (attacker.abilityBuffs && attacker.abilityBuffs.frostShot && attacker.abilityBuffs.frostShot > 0) {
        var boostedDmg = Math.floor(rawDmg * 1.3);
        dealDamage(attacker, target, boostedDmg, atkOpts);
        addStatus(target, 'slow', 2, 0.2, attacker);
        attacker.abilityBuffs.frostShot--;
    } else {
        dealDamage(attacker, target, rawDmg, atkOpts);
    }

    // Vanguard charge stun after attack
    if (chargeStun && target.hp > 0) {
        addStatus(target, 'stun', attacker.chargeStunDuration, 0, attacker);
    }

    // Double-strike check
    if (attacker.doubleStrikeChance && Math.random() < attacker.doubleStrikeChance && target.hp > 0) {
        dealDamage(attacker, target, rawDmg, {isAutoAttack: true, canCrit: true, canDodge: true, applyElement: true, triggerOnHit: true});
    }

    // Lifesteal from synergy
    if (attacker.lifesteal && attacker.lifesteal > 0) {
        var lsDmg = rawDmg;
        var lsHeal = Math.floor(lsDmg * attacker.lifesteal);
        if (lsHeal > 0) dealHealing(attacker, attacker, lsHeal);
    }
}


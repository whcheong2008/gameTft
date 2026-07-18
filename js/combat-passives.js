// combat-passives.js -- innate passive framework + execution (split from main-v2.js)

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


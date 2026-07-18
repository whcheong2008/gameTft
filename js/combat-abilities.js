// combat-abilities.js -- ability execution (mana/casting) (split from main-v2.js)

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
    // Mana Shrine: ability damage multiplier
    if (caster.manaShrine && caster.manaShrine.abilityDamageMult > 1) {
        atk = Math.floor(atk * caster.manaShrine.abilityDamageMult);
    }
    // Prompt 62: bond ability damage bonus (arcane_circle, eye_of_the_storm -- abilityDmgPct)
    if (caster.bondAbilityDmgMult && caster.bondAbilityDmgMult > 1) {
        atk = Math.floor(atk * caster.bondAbilityDmgMult);
    }

    // Track cast
    if (caster.combatStats) caster.combatStats.abilityCasts++;

    // Prompt 60: combat event hook for hero skill listeners. Fired before the
    // switch below so listeners (e.g. forced-crit/DR-ignore flags) can affect
    // this same cast's damage synchronously.
    if (typeof combatEvents !== 'undefined') {
        combatEvents.emit('abilityCast', { caster: caster, key: key });
    }

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


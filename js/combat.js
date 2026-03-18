// =============================================================================
// combat.js — Real-time combat engine
// =============================================================================

var combatState = null;

function initCombat(gs) {
    var playerUnits = [];
    var enemyUnits = [];

    // Collect player units from board
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 7; c++) {
            var u = gs.board[r][c];
            if (!u) continue;
            var cu = makeCombatUnit(u, 'player', r, c);
            playerUnits.push(cu);
        }
    }

    // Collect enemy units
    for (var i = 0; i < gs.enemies.length; i++) {
        var e = gs.enemies[i];
        var cu = makeCombatUnit(e, 'enemy', e.boardRow, e.boardCol);
        enemyUnits.push(cu);
    }

    var allUnits = playerUnits.concat(enemyUnits);

    // Apply synergy bonuses to player units
    applySynergyBonuses(gs, allUnits, 'player');

    // Initial attack cooldown
    for (var i = 0; i < allUnits.length; i++) {
        allUnits[i].attackCooldown = allUnits[i].attackSpd * 0.5;
    }

    combatState = {
        units: allUnits,
        running: true,
        result: null,
        log: []
    };

    return combatState;
}

function makeCombatUnit(unit, side, row, col) {
    var cx, cy;
    if (side === 'player') {
        cx = col;
        cy = row + 4;
    } else {
        cx = col;
        cy = 3 - row;
    }

    return {
        id: unit.id,
        key: unit.key,
        name: unit.name,
        emoji: unit.emoji,
        side: side,
        type: unit.type,
        archetype: unit.archetype,
        element: unit.element,
        cost: unit.cost,
        stars: unit.stars,
        evolved: unit.evolved || false,
        ability: unit.ability || null,
        hp: unit.hp,
        maxHp: unit.maxHp,
        attack: unit.attack,
        attackSpd: unit.attackSpd,
        range: unit.range,
        moveSpd: unit.moveSpd,
        cx: cx,
        cy: cy,
        target: null,
        attackCooldown: 0,
        alive: true,
        // Synergy stats
        damageReduction: 0,
        critChance: 0,
        elemDmgBonus: 0,
        elemResist: 0,
        healBonus: 0,
        regenPerSec: 0,
        regenAccum: 0,
        shield: 0,
        // Evolved ability tracking
        hitCount: 0,
        hasRevived: false,
        chaseTimer: 0
    };
}

function combatTick(dt) {
    if (!combatState || !combatState.running) return;
    dt = Math.min(dt, 0.05);

    var units = combatState.units;

    for (var i = 0; i < units.length; i++) {
        var u = units[i];
        if (!u.alive) continue;

        // HP regen
        if (u.regenPerSec > 0) {
            u.regenAccum += u.regenPerSec * dt;
            if (u.regenAccum >= 1) {
                var heal = Math.floor(u.regenAccum);
                u.regenAccum -= heal;
                u.hp = Math.min(u.maxHp, u.hp + heal);
            }
        }

        // Acquire target
        if (!u.target || !u.target.alive) {
            u.target = findTarget(u, units);
            u.chaseTimer = 0;
        }

        if (!u.target) continue;

        var dist = distance(u, u.target);
        var inRange = dist <= u.range + 0.3;

        if (inRange) {
            u.chaseTimer = 0;
            u.attackCooldown -= dt;
            if (u.attackCooldown <= 0) {
                performAttack(u, u.target, units);
                u.attackCooldown = u.attackSpd;
            }
        } else {
            // Move toward target
            var dx = u.target.cx - u.cx;
            var dy = u.target.cy - u.cy;
            var d = Math.sqrt(dx * dx + dy * dy);
            if (d > 0) {
                u.cx += (dx / d) * u.moveSpd * dt;
                u.cy += (dy / d) * u.moveSpd * dt;
            }

            // Chase timeout
            u.chaseTimer += dt;
            if (u.chaseTimer > u.attackSpd * 3) {
                var alt = findNearestExcluding(u, units, u.target);
                if (alt) {
                    var altDist = distance(u, alt);
                    var curDist = distance(u, u.target);
                    if (altDist < curDist * 0.7) {
                        u.target = alt;
                        u.chaseTimer = 0;
                    }
                }
            }
        }
    }

    // Check combat end
    var playersAlive = false;
    var enemiesAlive = false;
    for (var i = 0; i < units.length; i++) {
        if (!units[i].alive) continue;
        if (units[i].side === 'player') playersAlive = true;
        else enemiesAlive = true;
    }

    if (!playersAlive && !enemiesAlive) {
        combatState.result = 'draw';
        combatState.running = false;
    } else if (!playersAlive) {
        combatState.result = 'loss';
        combatState.running = false;
    } else if (!enemiesAlive) {
        combatState.result = 'win';
        combatState.running = false;
    }
}

function findTarget(unit, allUnits) {
    var best = null;
    var bestDist = Infinity;
    var isAssassin = unit.type === 'assassin';

    for (var i = 0; i < allUnits.length; i++) {
        var other = allUnits[i];
        if (!other.alive || other.side === unit.side) continue;
        var d = distance(unit, other);
        if (isAssassin) {
            if (d > bestDist || best === null) {
                best = other;
                bestDist = d;
            }
        } else {
            if (d < bestDist) {
                best = other;
                bestDist = d;
            }
        }
    }
    return best;
}

function findNearestExcluding(unit, allUnits, exclude) {
    var best = null;
    var bestDist = Infinity;
    for (var i = 0; i < allUnits.length; i++) {
        var other = allUnits[i];
        if (!other.alive || other.side === unit.side || other === exclude) continue;
        var d = distance(unit, other);
        if (d < bestDist) {
            best = other;
            bestDist = d;
        }
    }
    return best;
}

function performAttack(attacker, target, allUnits) {
    // Healer: heal lowest HP ally
    if (attacker.type === 'healer') {
        performHeal(attacker, allUnits);
    }

    // Calculate damage
    var dmg = attacker.attack;

    // Element multiplier
    var elemMult = getElementMultiplier(attacker.element, target.element);
    dmg = Math.floor(dmg * elemMult);

    // Elemental damage bonus (Mystic synergy)
    if (attacker.elemDmgBonus > 0 && attacker.element) {
        dmg = Math.floor(dmg * (1 + attacker.elemDmgBonus));
    }

    // Crit
    if (attacker.critChance > 0 && Math.random() < attacker.critChance) {
        dmg = Math.floor(dmg * 1.5);
    }

    // Target damage reduction
    var dr = target.damageReduction || 0;
    // Gale Sniper: reduce target DR by 20%
    if (attacker.evolved && attacker.key === 'gale_sniper') {
        dr = dr * 0.8;
    }
    // Element resist
    if (target.elemResist && attacker.element) {
        dr += target.elemResist;
    }
    if (dr > 0) {
        dmg = Math.floor(dmg * (1 - dr));
    }
    dmg = Math.max(1, dmg);

    // Abyssal Mage: +25% vs tanks
    if (attacker.evolved && attacker.key === 'abyssal_mage' && target.type === 'tank') {
        dmg = Math.floor(dmg * 1.25);
    }

    applyDamage(target, dmg, allUnits, attacker);

    // Track hits for evolved abilities
    attacker.hitCount = (attacker.hitCount || 0) + 1;

    // Tsunami Blade: slow
    if (attacker.evolved && attacker.key === 'tsunami_blade') {
        target.moveSpd = target.moveSpd * 0.95;
    }

    // Ice Sniper: every 3rd attack stuns
    if (attacker.evolved && attacker.key === 'ice_sniper' && attacker.hitCount % 3 === 0) {
        target.attackCooldown += 0.5;
    }

    // Titan: every 4th attack stuns adjacent
    if (attacker.evolved && attacker.key === 'titan' && attacker.hitCount % 4 === 0) {
        for (var i = 0; i < allUnits.length; i++) {
            var adj = allUnits[i];
            if (!adj.alive || adj.side === attacker.side) continue;
            if (distance(attacker, adj) <= 1.5) {
                adj.attackCooldown += 0.5;
            }
        }
    }

    // Inferno Mage: splash
    if (attacker.evolved && attacker.key === 'inferno_mage') {
        var splashDmg = Math.floor(dmg * 0.3);
        for (var i = 0; i < allUnits.length; i++) {
            var adj = allUnits[i];
            if (!adj.alive || adj.side === attacker.side || adj === target) continue;
            if (distance(target, adj) <= 1.5) {
                applyDamage(adj, splashDmg, allUnits, attacker);
            }
        }
    }

    // Tempest Wizard: bounce
    if (attacker.evolved && attacker.key === 'tempest_wizard') {
        var bounceDmg = Math.floor(dmg * 0.5);
        var bounceTarget = null;
        var bounceDist = Infinity;
        for (var i = 0; i < allUnits.length; i++) {
            var b = allUnits[i];
            if (!b.alive || b.side === attacker.side || b === target) continue;
            var bd = distance(target, b);
            if (bd < bounceDist) {
                bounceTarget = b;
                bounceDist = bd;
            }
        }
        if (bounceTarget) {
            applyDamage(bounceTarget, bounceDmg, allUnits, attacker);
        }
    }

    // Thorn Ranger: reflect
    if (target.evolved && target.key === 'thorn_ranger' && target.alive) {
        applyDamage(attacker, 15, allUnits, target);
    }
}

function performHeal(healer, allUnits) {
    var candidates = [];
    for (var i = 0; i < allUnits.length; i++) {
        var u = allUnits[i];
        if (!u.alive || u.side !== healer.side || u === healer) continue;
        if (u.hp / u.maxHp >= 0.95) continue;
        candidates.push(u);
    }
    if (candidates.length === 0) return;

    candidates.sort(function(a, b) { return (a.hp / a.maxHp) - (b.hp / b.maxHp); });

    var healAmount = Math.floor(healer.attack * 1.5 * (1 + (healer.healBonus || 0)));

    // World Tree: heal ALL allies
    if (healer.key === 'world_tree') {
        for (var i = 0; i < allUnits.length; i++) {
            var u = allUnits[i];
            if (u.alive && u.side === healer.side && u !== healer) {
                u.hp = Math.min(u.maxHp, u.hp + healAmount);
                if (healer.evolved && healer.key === 'ocean_sage') {
                    u.shield = (u.shield || 0) + 50;
                }
            }
        }
        return;
    }

    // Gaia Priest: heal 2 allies
    var healCount = (healer.evolved && healer.key === 'gaia_priest') ? 2 : 1;
    for (var i = 0; i < Math.min(healCount, candidates.length); i++) {
        candidates[i].hp = Math.min(candidates[i].maxHp, candidates[i].hp + healAmount);
        // Ocean Sage: shield on heal
        if (healer.evolved && healer.key === 'ocean_sage') {
            candidates[i].shield = (candidates[i].shield || 0) + 50;
        }
    }
}

function applyDamage(target, dmg, allUnits, attacker) {
    if (!target.alive) return;

    // Shield absorption
    if (target.shield > 0) {
        if (target.shield >= dmg) {
            target.shield -= dmg;
            return;
        } else {
            dmg -= target.shield;
            target.shield = 0;
        }
    }

    target.hp -= dmg;

    if (target.hp <= 0) {
        // Phoenix revive
        if (target.key === 'phoenix' && !target.hasRevived) {
            target.hp = Math.floor(target.maxHp * 0.5);
            target.hasRevived = true;
            return;
        }

        target.hp = 0;
        target.alive = false;

        // Volcano Titan: AoE on death
        if (target.evolved && target.key === 'volcano_titan') {
            for (var i = 0; i < allUnits.length; i++) {
                var u = allUnits[i];
                if (!u.alive || u.side === target.side) continue;
                if (distance(target, u) <= 2) {
                    u.hp -= 200;
                    if (u.hp <= 0) {
                        u.hp = 0;
                        u.alive = false;
                    }
                }
            }
        }

        // Storm Assassin: chain damage on kill
        if (attacker && attacker.evolved && attacker.key === 'storm_assassin') {
            var nearest = null;
            var nearDist = Infinity;
            for (var i = 0; i < allUnits.length; i++) {
                var u = allUnits[i];
                if (!u.alive || u.side === attacker.side) continue;
                var d = distance(attacker, u);
                if (d < nearDist) {
                    nearest = u;
                    nearDist = d;
                }
            }
            if (nearest) {
                nearest.hp -= 50;
                if (nearest.hp <= 0) {
                    nearest.hp = 0;
                    nearest.alive = false;
                }
            }
        }
    }
}

function distance(a, b) {
    var dx = a.cx - b.cx;
    var dy = a.cy - b.cy;
    return Math.sqrt(dx * dx + dy * dy);
}

function getSurvivingEnemyCount() {
    if (!combatState) return 0;
    var count = 0;
    for (var i = 0; i < combatState.units.length; i++) {
        if (combatState.units[i].alive && combatState.units[i].side === 'enemy') count++;
    }
    return count;
}

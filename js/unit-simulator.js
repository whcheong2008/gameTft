// =============================================================================
// unit-simulator.js — Role-specific unit simulation & combat/power rating
// =============================================================================
// Each unit type (Warrior, Tank, Archer, Mage, Assassin, Healer) gets a
// tailored simulation scenario that measures what that role ACTUALLY does.
// Power Rating = static budget estimate (what you bring to a fight)
// Combat Rating = simulated performance in a role-appropriate scenario
// =============================================================================

var SIM_CONFIG = {
    duration: 30,               // seconds per simulation
    tickRate: 0.1,              // simulation tick (100ms)
    incomingDPS: {              // standard enemy damage dealt to unit
        melee: 40,              // melee units take more (tuned so T1 survives ~28s+)
        ranged: 20,             // ranged units take minimal (positioned safely)
        assassin: 30            // assassin takes moderate (diving backline)
    },
    standardEnemyHP: 2500,      // HP of a standard enemy for kill-time tests
    standardAllyHP: 800,        // ally HP for healer scenarios
    standardAllyCount: 4,       // number of allies for healer/team scenarios
    aoeTargetCount: 4,          // how many enemies in AoE scenario
    starScaling: [1, 1.8, 3.24], // 1★/2★/3★ multiplier (1.8^(s-1))
    critChance: 0.20,           // base crit chance (lightning synergy can boost)
    critMultiplier: 1.5,        // crit damage multiplier
    dodgeChance: 0,             // base dodge (wind units get more)
    elementAdvantage: 1.3,      // element advantage multiplier
    elementDisadvantage: 0.7    // element disadvantage multiplier
};

// =============================================================================
// ABILITY PARSER — Extract mechanical values from ability descriptions
// =============================================================================

function parseAbilityMechanics(unitKey, isEvolved) {
    var ability = ABILITY_DATA[unitKey];
    if (!ability) return null;

    var desc = ability.desc;
    var mechanics = {
        name: ability.name,
        desc: desc,
        isPassive: desc.indexOf('PASSIVE:') !== -1,
        // Damage
        atkMultiplier: 0,
        hits: 1,
        isAoE: false,
        aoeTargets: 1,
        // CC
        hasStun: false,
        stunDuration: 0,
        hasRoot: false,
        rootDuration: 0,
        hasSlow: false,
        hasTaunt: false,
        tauntDuration: 0,
        hasFreeze: false,
        // Defense
        shieldPercent: 0,      // % of max HP as shield
        allyShieldPercent: 0,
        drPercent: 0,          // damage reduction %
        dodgeBoost: 0,
        reflectPercent: 0,
        // Sustain
        healMultiplier: 0,     // heal amount as % ATK
        lifestealPercent: 0,
        selfHealPercent: 0,
        // Buff
        atkSpeedBuff: 0,
        atkBuff: 0,
        // Special
        hasExecute: false,
        executeThreshold: 0,
        hasDash: false,
        hasResetOnKill: false,
        hasBurn: false,
        hasMarkStacking: false,
        markBonusDamage: 0,
        manaRefundOnKill: 0,
        atkStealPercent: 0,
        hasMinions: false,
        hasManaToggle: false,   // T5 toggle passive
        damageRedirectPercent: 0,
        // Raw template for edge cases
        template: ''
    };

    // --- Parse ATK multiplier ---
    var atkMatch = desc.match(/(\d+)%\s*ATK/);
    if (atkMatch) mechanics.atkMultiplier = parseInt(atkMatch[1]) / 100;

    // If no ATK match but has mark mechanics, estimate damage from marks
    if (!atkMatch && /marks?\s*for\s*\+?\d+%/i.test(desc)) {
        // Mark-consuming abilities deal ~150% ATK equivalent on average
        mechanics.atkMultiplier = 1.5;
        mechanics.hasMarkStacking = true;
        var markBonusMatch = desc.match(/\+(\d+)%\s*bonus damage per mark/i);
        if (markBonusMatch) mechanics.markBonusDamage = parseInt(markBonusMatch[1]) / 100;
    }

    // If still no ATK match but has dash + damage (assassin pattern)
    if (!atkMatch && /dash.*deal/i.test(desc)) {
        mechanics.atkMultiplier = 1.8; // default dash damage
    }

    // Multiple hits
    var hitMatch = desc.match(/(\d+)\s*times/);
    if (hitMatch) mechanics.hits = parseInt(hitMatch[1]);

    // --- AoE detection ---
    if (/\bAoE\b|nearby|area|all\s+(allies|enemies)|cone|radius|splash|chain/i.test(desc)) {
        mechanics.isAoE = true;
        mechanics.aoeTargets = SIM_CONFIG.aoeTargetCount;
    }
    if (/2-cell radius/.test(desc)) mechanics.aoeTargets = 4;
    if (/Large AoE/.test(desc)) mechanics.aoeTargets = 5;

    // --- CC-focused abilities still deal some damage ---
    // If ability has CC but no ATK multiplier, give it a base damage estimate
    if (!atkMatch && !mechanics.atkMultiplier && (/stun|root|freeze|slow|pull|taunt/i.test(desc))) {
        // CC abilities typically deal some damage alongside their CC
        if (/pull.*deal/i.test(desc)) mechanics.atkMultiplier = 1.0; // pull + damage
        else if (/vulnerability/i.test(desc)) mechanics.atkMultiplier = 0.5; // lockdown + vulnerability
        else mechanics.atkMultiplier = 0.3; // minimal damage CC
    }

    // --- CC ---
    var stunDurMatch = desc.match(/stun[^.]*?(\d+\.?\d*)s/i);
    if (stunDurMatch) { mechanics.hasStun = true; mechanics.stunDuration = parseFloat(stunDurMatch[1]); }
    else if (/stun/i.test(desc)) { mechanics.hasStun = true; mechanics.stunDuration = 1.5; }

    var rootDurMatch = desc.match(/root[^.]*?(\d+\.?\d*)s/i);
    if (rootDurMatch) { mechanics.hasRoot = true; mechanics.rootDuration = parseFloat(rootDurMatch[1]); }
    else if (/root/i.test(desc)) { mechanics.hasRoot = true; mechanics.rootDuration = 2; }

    if (/slow/i.test(desc)) mechanics.hasSlow = true;
    if (/freeze/i.test(desc)) mechanics.hasFreeze = true;

    var tauntMatch = desc.match(/taunt[^.]*?(\d+\.?\d*)s/i);
    if (tauntMatch) { mechanics.hasTaunt = true; mechanics.tauntDuration = parseFloat(tauntMatch[1]); }
    else if (/taunt/i.test(desc)) { mechanics.hasTaunt = true; mechanics.tauntDuration = 2; }

    // --- Shields ---
    var shieldMatch = desc.match(/Shield\s*\((\d+)%\s*max HP\)/);
    if (shieldMatch) mechanics.shieldPercent = parseInt(shieldMatch[1]) / 100;
    var allyShieldMatch = desc.match(/allies\s*(?:smaller\s*)?Shield\s*\((\d+)%\s*max HP\)/);
    if (allyShieldMatch) mechanics.allyShieldPercent = parseInt(allyShieldMatch[1]) / 100;

    // --- DR ---
    var drMatch = desc.match(/(\d+)%\s*DR/);
    if (drMatch) mechanics.drPercent = parseInt(drMatch[1]) / 100;
    if (/70% reduced damage/.test(desc)) mechanics.drPercent = 0.7;

    // --- Dodge ---
    var dodgeMatch = desc.match(/(\d+)%\s*dodge/i);
    if (dodgeMatch) mechanics.dodgeBoost = parseInt(dodgeMatch[1]) / 100;

    // --- Reflect ---
    var reflectMatch = desc.match(/Reflect\s*(\d+)%/);
    if (reflectMatch) mechanics.reflectPercent = parseInt(reflectMatch[1]) / 100;

    // --- Healing ---
    var healMatch = desc.match(/Heal[^.]*?(\d+)%\s*ATK/i);
    if (healMatch) mechanics.healMultiplier = parseInt(healMatch[1]) / 100;
    var healAllMatch = desc.match(/Heal all allies\s*(\d+)%\s*max HP/i);
    if (healAllMatch) mechanics.healMultiplier = parseInt(healAllMatch[1]) / 100;

    var lifestealMatch = desc.match(/(\d+)%\s*of\s*damage\s*dealt\s*heals/i);
    if (lifestealMatch) mechanics.lifestealPercent = parseInt(lifestealMatch[1]) / 100;
    if (/heal self for\s*(\d+)%\s*of damage/i.test(desc)) {
        var selfHealMatch = desc.match(/heal self for\s*(\d+)%\s*of damage/i);
        if (selfHealMatch) mechanics.selfHealPercent = parseInt(selfHealMatch[1]) / 100;
    }

    // --- Buffs ---
    var atkSpdMatch = desc.match(/\+?(\d+)%\s*ATK speed/);
    if (atkSpdMatch) mechanics.atkSpeedBuff = parseInt(atkSpdMatch[1]) / 100;
    var atkBuffMatch = desc.match(/\+(\d+)%\s*(?:damage buff|ATK\b)/);
    if (atkBuffMatch) mechanics.atkBuff = parseInt(atkBuffMatch[1]) / 100;

    // --- Execute ---
    if (/below\s*(\d+)%\s*HP/i.test(desc)) {
        mechanics.hasExecute = true;
        var execMatch = desc.match(/below\s*(\d+)%\s*HP/i);
        mechanics.executeThreshold = parseInt(execMatch[1]) / 100;
    }
    var execBonusMatch = desc.match(/\+(\d+)%\s*bonus damage to enemies below/i);
    if (execBonusMatch) mechanics.atkMultiplier += parseInt(execBonusMatch[1]) / 100 * 0.3; // weighted by time below threshold

    // --- Dash/Reset ---
    if (/dash/i.test(desc)) mechanics.hasDash = true;
    if (/reset/i.test(desc)) mechanics.hasResetOnKill = true;

    // --- Burn ---
    if (/burn/i.test(desc)) mechanics.hasBurn = true;

    // --- Marks ---
    var markMatch = desc.match(/\+(\d+)%\s*bonus damage per mark/i);
    if (markMatch) { mechanics.hasMarkStacking = true; mechanics.markBonusDamage = parseInt(markMatch[1]) / 100; }

    // --- Mana refund ---
    var manaRefMatch = desc.match(/Refund\s*(\d+)\s*mana/i);
    if (manaRefMatch) mechanics.manaRefundOnKill = parseInt(manaRefMatch[1]);

    // --- ATK steal ---
    var stealMatch = desc.match(/Steal\s*(\d+)%\s*of target ATK/i);
    if (stealMatch) mechanics.atkStealPercent = parseInt(stealMatch[1]) / 100;

    // --- Vulnerability ---
    var vulnMatch = desc.match(/(\d+)%\s*vulnerability/i);
    if (vulnMatch) mechanics.vulnerabilityPercent = parseInt(vulnMatch[1]) / 100;

    // --- Minions ---
    if (/summon/i.test(desc)) mechanics.hasMinions = true;

    // --- T5 Toggle ---
    if (/toggle between/i.test(desc)) mechanics.hasManaToggle = true;

    // --- Damage redirect ---
    var redirectMatch = desc.match(/Redirect\s*(\d+)%\s*of ally damage/i);
    if (redirectMatch) mechanics.damageRedirectPercent = parseInt(redirectMatch[1]) / 100;

    // --- Ability template classification ---
    var tmpl = (UNIT_TEMPLATES[unitKey] || EVOLVED_TEMPLATES[unitKey] || {}).abilityTemplate || '';
    mechanics.template = tmpl;

    return mechanics;
}

// =============================================================================
// ROLE-SPECIFIC SIMULATION SCENARIOS
// =============================================================================

// Creates a simulation unit with full stats at given level/stars/ascension
function createSimUnit(unitKey, options) {
    options = options || {};
    var level = options.level || 1;
    var stars = options.stars || 1;
    var ascension = options.ascension || null;

    var tmpl = UNIT_TEMPLATES[unitKey];
    var isEvolved = false;
    if (!tmpl) {
        tmpl = EVOLVED_TEMPLATES[unitKey];
        isEvolved = true;
    }
    if (!tmpl) return null;

    var unit = {
        id: 'sim_' + unitKey,
        key: unitKey,
        name: tmpl.name,
        cost: tmpl.cost || tmpl.baseCost || 1,
        type: tmpl.type,
        archetype: tmpl.archetype,
        element: tmpl.element,
        attackSpd: tmpl.attackSpd,
        range: tmpl.range || 1,
        moveSpd: tmpl.moveSpd || 1.5,
        maxMana: tmpl.maxMana,
        stars: stars,
        level: level,
        evolved: isEvolved,
        ascensionTier: ascension,
        items: []
    };

    var stats = getUnitStats(unit);
    unit.hp = stats.hp;
    unit.maxHp = stats.hp;
    unit.attack = stats.attack;
    unit.mana = 0;

    return unit;
}

// ---- WARRIOR SIMULATION ----
// Warriors are sustained melee DPS. Measured on:
// - Sustained DPS over fight duration (auto-attacks + abilities)
// - Effective damage (total damage dealt before dying)
// - Self-sustain (lifesteal, self-heals extend effective damage)
function simulateWarrior(unit, mechanics) {
    var duration = SIM_CONFIG.duration;
    var tick = SIM_CONFIG.tickRate;
    var incomingDPS = SIM_CONFIG.incomingDPS.melee;

    var currentHP = unit.maxHp;
    var mana = 0;
    var atk = unit.attack;
    var atkSpd = unit.attackSpd;
    var totalDamage = 0;
    var totalSelfHeal = 0;
    var abilityCasts = 0;
    var killsEstimated = 0;
    var timeAlive = 0;

    // Buff tracking
    var atkBuffExpiry = 0;
    var atkSpdBuffExpiry = 0;
    var currentAtkBuff = 0;
    var currentAtkSpdBuff = 0;
    var markStacks = 0;

    for (var t = 0; t < duration; t += tick) {
        if (currentHP <= 0) break;
        timeAlive = t;

        // Take damage (reduced by DR if applicable)
        var dr = 0;
        var dmgTaken = incomingDPS * tick * (1 - dr);
        currentHP -= dmgTaken;

        // Mana gain from damage taken (10 mana per 100 damage taken)
        if (unit.maxMana > 0) {
            mana += dmgTaken * 0.1;
        }

        // Auto-attack
        var effectiveAtkSpd = atkSpd;
        if (t < atkSpdBuffExpiry) effectiveAtkSpd *= (1 - currentAtkSpdBuff); // faster = lower interval
        var attacksThisTick = tick / effectiveAtkSpd;
        var effectiveAtk = atk * (1 + (t < atkBuffExpiry ? currentAtkBuff : 0));

        // Crit
        var avgCritMult = 1 + (SIM_CONFIG.critChance * (SIM_CONFIG.critMultiplier - 1));
        var autoDamage = effectiveAtk * attacksThisTick * avgCritMult;

        // Mark stacking on autos
        if (mechanics.hasMarkStacking) {
            markStacks = Math.min(5, markStacks + attacksThisTick);
        }

        totalDamage += autoDamage;

        // Mana from auto-attacks (10 mana per attack)
        if (unit.maxMana > 0) {
            mana += 10 * attacksThisTick;
        }

        // Ability cast
        if (unit.maxMana > 0 && mana >= unit.maxMana) {
            mana -= unit.maxMana;
            abilityCasts++;

            var abilityDmg = 0;
            if (mechanics.atkMultiplier > 0) {
                abilityDmg = effectiveAtk * mechanics.atkMultiplier * mechanics.hits * avgCritMult;
            }

            // Mark consumption
            if (mechanics.hasMarkStacking && markStacks > 0) {
                abilityDmg *= (1 + mechanics.markBonusDamage * markStacks);
                markStacks = 0;
            }

            // Execute bonus
            if (mechanics.hasExecute) {
                abilityDmg *= 1.15; // average bonus accounting for % time target is low
            }

            totalDamage += abilityDmg;

            // Self-healing
            if (mechanics.selfHealPercent > 0) {
                var healAmt = abilityDmg * mechanics.selfHealPercent;
                currentHP = Math.min(unit.maxHp, currentHP + healAmt);
                totalSelfHeal += healAmt;
            }

            if (mechanics.lifestealPercent > 0) {
                var lsHeal = abilityDmg * mechanics.lifestealPercent;
                currentHP = Math.min(unit.maxHp, currentHP + lsHeal);
                totalSelfHeal += lsHeal;
            }

            // ATK steal
            if (mechanics.atkStealPercent > 0) {
                atk += unit.attack * mechanics.atkStealPercent;
            }

            // Buffs from ability
            if (mechanics.atkSpeedBuff > 0) {
                atkSpdBuffExpiry = t + 5;
                currentAtkSpdBuff = mechanics.atkSpeedBuff;
            }
            if (mechanics.atkBuff > 0) {
                atkBuffExpiry = t + 5;
                currentAtkBuff = mechanics.atkBuff;
            }

            // Reset on kill check (estimate 1 kill per cast for assassin-type warriors)
            if (mechanics.hasResetOnKill && mechanics.hasDash) {
                mana += unit.maxMana * 0.3; // partial refund estimate
            }
            if (mechanics.manaRefundOnKill > 0) {
                mana += mechanics.manaRefundOnKill * 0.4; // 40% chance to get kill
            }
        }

        // Track kills
        killsEstimated = Math.floor(totalDamage / SIM_CONFIG.standardEnemyHP);
    }

    timeAlive = Math.min(timeAlive + tick, duration);

    return {
        totalDamage: Math.floor(totalDamage),
        dps: Math.floor(totalDamage / timeAlive),
        effectiveDamage: Math.floor(totalDamage), // damage dealt before death
        timeAlive: Math.round(timeAlive * 10) / 10,
        abilityCasts: abilityCasts,
        selfHealing: Math.floor(totalSelfHeal),
        killsEstimated: killsEstimated
    };
}

// ---- TANK SIMULATION ----
// Tanks protect the team. Measured on:
// - Effective HP (HP + shields + DR + dodge)
// - Time alive under sustained fire
// - CC uptime (stun/taunt/root seconds generated)
// - Team protection value (ally shields, damage redirect, taunt)
function simulateTank(unit, mechanics) {
    var duration = SIM_CONFIG.duration;
    var tick = SIM_CONFIG.tickRate;
    var incomingDPS = SIM_CONFIG.incomingDPS.melee * 1.5; // tanks draw aggro, take more

    var currentHP = unit.maxHp;
    var shield = 0;
    var mana = 0;
    var totalDamageTaken = 0;
    var totalShieldGenerated = 0;
    var totalAllyShieldGenerated = 0;
    var totalCCSeconds = 0;
    var totalReflectDamage = 0;
    var abilityCasts = 0;
    var timeAlive = 0;

    var drActive = 0;
    var drExpiry = 0;
    var reflectExpiry = 0;
    var shieldCooldown = 0;

    for (var t = 0; t < duration; t += tick) {
        if (currentHP <= 0) break;
        timeAlive = t;

        // Calculate effective DR
        var effectiveDR = 0;
        if (t < drExpiry) effectiveDR += drActive;
        // Passive DR from abilities (e.g., Leviathan at 50%+ HP)
        if (mechanics.drPercent > 0 && mechanics.isPassive) {
            if (currentHP > unit.maxHp * 0.5) effectiveDR += mechanics.drPercent * 0.5; // partial DR
            else effectiveDR += mechanics.drPercent; // full DR when low
        }
        effectiveDR = Math.min(effectiveDR, 0.8); // cap at 80% DR

        var rawDmg = incomingDPS * tick;
        var mitigatedDmg = rawDmg * (1 - effectiveDR);

        // Shield absorbs first
        if (shield > 0) {
            if (shield >= mitigatedDmg) {
                shield -= mitigatedDmg;
                mitigatedDmg = 0;
            } else {
                mitigatedDmg -= shield;
                shield = 0;
            }
        }

        // Dodge
        var dodgeChance = SIM_CONFIG.dodgeChance + mechanics.dodgeBoost;
        mitigatedDmg *= (1 - dodgeChance);

        currentHP -= mitigatedDmg;
        totalDamageTaken += mitigatedDmg;

        // Reflect damage
        if (t < reflectExpiry && mechanics.reflectPercent > 0) {
            totalReflectDamage += rawDmg * mechanics.reflectPercent;
        }

        // Mana gain
        if (unit.maxMana > 0) {
            mana += rawDmg * 0.1; // mana from damage taken
            mana += 10 * (tick / unit.attackSpd); // mana from auto-attacks
        }

        // Passive shield refresh (e.g., Stone Guard "every 6s")
        if (mechanics.shieldPercent > 0 && mechanics.isPassive) {
            if (t > 0 && Math.floor(t / 6) > Math.floor((t - tick) / 6)) {
                var passiveShield = unit.maxHp * mechanics.shieldPercent * 0.6;
                shield += passiveShield;
                totalShieldGenerated += passiveShield;
            }
        }

        // Ability cast
        if (unit.maxMana > 0 && mana >= unit.maxMana) {
            mana -= unit.maxMana;
            abilityCasts++;

            // Shields
            if (mechanics.shieldPercent > 0) {
                var selfShield = unit.maxHp * mechanics.shieldPercent;
                shield += selfShield;
                totalShieldGenerated += selfShield;
            }
            if (mechanics.allyShieldPercent > 0) {
                totalAllyShieldGenerated += unit.maxHp * mechanics.allyShieldPercent * SIM_CONFIG.standardAllyCount;
            }

            // DR buff
            if (mechanics.drPercent > 0 && !mechanics.isPassive) {
                drActive = mechanics.drPercent;
                drExpiry = t + 5;
            }

            // Taunt (CC generation)
            if (mechanics.hasTaunt) {
                totalCCSeconds += mechanics.tauntDuration * 2; // taunts ~2 enemies
            }

            // Reflect
            if (mechanics.reflectPercent > 0) {
                reflectExpiry = t + 4;
            }

            // Stun/Root
            if (mechanics.hasStun) totalCCSeconds += mechanics.stunDuration;
            if (mechanics.hasRoot) totalCCSeconds += mechanics.rootDuration;
        }

        // T5 passive processing
        if (unit.maxMana === 0 && mechanics.isPassive) {
            // Submerge at low HP (Leviathan)
            if (currentHP < unit.maxHp * 0.5 && currentHP > 0) {
                effectiveDR = Math.max(effectiveDR, 0.4); // additional passive DR
            }
        }
    }

    timeAlive = Math.min(timeAlive + tick, duration);
    var effectiveHP = totalDamageTaken + (currentHP > 0 ? currentHP : 0) + totalShieldGenerated;

    return {
        timeAlive: Math.round(timeAlive * 10) / 10,
        effectiveHP: Math.floor(effectiveHP),
        totalShieldSelf: Math.floor(totalShieldGenerated),
        totalShieldAllies: Math.floor(totalAllyShieldGenerated),
        ccSeconds: Math.round(totalCCSeconds * 10) / 10,
        reflectDamage: Math.floor(totalReflectDamage),
        abilityCasts: abilityCasts,
        teamProtection: Math.floor(totalAllyShieldGenerated + totalCCSeconds * 100 + totalReflectDamage)
    };
}

// ---- ARCHER SIMULATION ----
// Archers are safe ranged DPS. Measured on:
// - Sustained DPS from range (higher uptime because less damage taken)
// - Total damage over fight
// - Mana efficiency (DPS per mana spent)
function simulateArcher(unit, mechanics) {
    var duration = SIM_CONFIG.duration;
    var tick = SIM_CONFIG.tickRate;
    var incomingDPS = SIM_CONFIG.incomingDPS.ranged; // lower due to range

    var currentHP = unit.maxHp;
    var mana = 0;
    var atk = unit.attack;
    var totalDamage = 0;
    var totalAbilityDamage = 0;
    var abilityCasts = 0;
    var timeAlive = 0;

    var atkSpdBuffExpiry = 0;
    var atkBuffExpiry = 0;
    var currentAtkBuff = 0;
    var currentAtkSpdBuff = 0;

    for (var t = 0; t < duration; t += tick) {
        if (currentHP <= 0) break;
        timeAlive = t;

        // Take damage
        currentHP -= incomingDPS * tick;

        // Auto-attacks
        var effectiveAtkSpd = unit.attackSpd;
        if (t < atkSpdBuffExpiry) effectiveAtkSpd *= (1 - currentAtkSpdBuff);
        var attacksThisTick = tick / effectiveAtkSpd;
        var effectiveAtk = atk * (1 + (t < atkBuffExpiry ? currentAtkBuff : 0));

        var avgCritMult = 1 + (SIM_CONFIG.critChance * (SIM_CONFIG.critMultiplier - 1));
        var autoDamage = effectiveAtk * attacksThisTick * avgCritMult;
        totalDamage += autoDamage;

        // Mana gain
        if (unit.maxMana > 0) {
            mana += 10 * attacksThisTick;
            mana += incomingDPS * tick * 0.05; // less mana from damage taken (takes less damage)
        }

        // Ability cast
        if (unit.maxMana > 0 && mana >= unit.maxMana) {
            mana -= unit.maxMana;
            abilityCasts++;

            var abilityDmg = 0;
            if (mechanics.atkMultiplier > 0) {
                abilityDmg = effectiveAtk * mechanics.atkMultiplier * mechanics.hits * avgCritMult;
                // AoE bonus for archers
                if (mechanics.isAoE) {
                    abilityDmg *= mechanics.aoeTargets * 0.7; // diminished per target
                }
            }

            // First cast bonus (lightning arrow)
            if (abilityCasts === 1 && /first cast/i.test(mechanics.desc)) {
                abilityDmg *= 1.5;
            }

            totalAbilityDamage += abilityDmg;
            totalDamage += abilityDmg;

            // Buffs
            if (mechanics.atkSpeedBuff > 0) {
                atkSpdBuffExpiry = t + 5;
                currentAtkSpdBuff = mechanics.atkSpeedBuff;
            }
            if (mechanics.atkBuff > 0) {
                atkBuffExpiry = t + 5;
                currentAtkBuff = mechanics.atkBuff;
            }
        }
    }

    timeAlive = Math.min(timeAlive + tick, duration);

    return {
        totalDamage: Math.floor(totalDamage),
        dps: Math.floor(totalDamage / timeAlive),
        abilityDamage: Math.floor(totalAbilityDamage),
        autoAttackDamage: Math.floor(totalDamage - totalAbilityDamage),
        abilityDamagePercent: Math.round(totalAbilityDamage / Math.max(1, totalDamage) * 100),
        timeAlive: Math.round(timeAlive * 10) / 10,
        abilityCasts: abilityCasts,
        rangeSafety: unit.range >= 3 ? 'Safe' : 'Moderate'
    };
}

// ---- MAGE SIMULATION ----
// Mages deal ability-based damage. Measured on:
// - Ability DPS (damage from abilities specifically)
// - AoE efficiency (total targets × damage per cast)
// - Mana efficiency (damage per mana point)
// - CC contribution
function simulateMage(unit, mechanics) {
    var duration = SIM_CONFIG.duration;
    var tick = SIM_CONFIG.tickRate;
    var incomingDPS = unit.range >= 3 ? SIM_CONFIG.incomingDPS.ranged : SIM_CONFIG.incomingDPS.melee;

    var currentHP = unit.maxHp;
    var mana = 0;
    var atk = unit.attack;
    var totalDamage = 0;
    var totalAbilityDamage = 0;
    var totalAutoDamage = 0;
    var abilityCasts = 0;
    var totalCCSeconds = 0;
    var timeAlive = 0;

    for (var t = 0; t < duration; t += tick) {
        if (currentHP <= 0) break;
        timeAlive = t;

        currentHP -= incomingDPS * tick;

        // Auto-attacks (mages auto-attack too)
        var attacksThisTick = tick / unit.attackSpd;
        var avgCritMult = 1 + (SIM_CONFIG.critChance * (SIM_CONFIG.critMultiplier - 1));
        var autoDmg = atk * attacksThisTick * avgCritMult;
        totalAutoDamage += autoDmg;
        totalDamage += autoDmg;

        // Mana gain
        if (unit.maxMana > 0) {
            mana += 10 * attacksThisTick;
            mana += incomingDPS * tick * 0.1;
        }

        // T5 passive (no mana, periodic effects)
        if (unit.maxMana === 0) {
            // Toggle passive (Phoenix, Titan Lord) — average of offensive and defensive phases
            if (mechanics.hasManaToggle || /toggle between/i.test(mechanics.desc)) {
                // Offensive phase: +40% ATK and +ATK speed for half the time
                var toggleOffensiveDPS = atk * 0.4 * 0.5; // 50% uptime on offensive mode
                totalDamage += toggleOffensiveDPS * tick;
                totalAbilityDamage += toggleOffensiveDPS * tick;
                // Reflect damage during defensive phase
                if (mechanics.reflectPercent > 0) {
                    totalDamage += incomingDPS * tick * mechanics.reflectPercent * 0.5; // 50% uptime
                }
            }

            // Aura effects (Storm Dragon: +35% crit to all allies)
            if (/aura|grants? all allies/i.test(mechanics.desc)) {
                // Team-wide crit buff value — estimate DPS boost to team
                var critMatch = mechanics.desc.match(/\+(\d+)%\s*crit/i);
                if (critMatch) {
                    var extraCrit = parseInt(critMatch[1]) / 100;
                    var teamDPSBoost = SIM_CONFIG.standardAllyCount * atk * extraCrit * (SIM_CONFIG.critMultiplier - 1);
                    totalAbilityDamage += teamDPSBoost * tick;
                    totalDamage += teamDPSBoost * tick;
                }
            }

            // Periodic strike (Storm Dragon: every 6s, 300% ATK chain to 3)
            if (mechanics.atkMultiplier > 0 && Math.floor(t / 6) > Math.floor((t - tick) / 6)) {
                var periodicDmg = atk * mechanics.atkMultiplier;
                if (mechanics.isAoE || /chain/i.test(mechanics.desc)) periodicDmg *= 3;
                totalAbilityDamage += periodicDmg;
                totalDamage += periodicDmg;
            }

            // Mana drain passive (Void Wyrm: drain 15 mana, bolt on ally ability)
            if (/drain.*mana/i.test(mechanics.desc)) {
                // Bolt fires on each ally ability cast — estimate 1 bolt per 3s from team
                var boltDmg = atk * 1.0; // estimated bolt damage
                totalDamage += boltDmg * tick / 3 * SIM_CONFIG.standardAllyCount;
                totalAbilityDamage += boltDmg * tick / 3 * SIM_CONFIG.standardAllyCount;
                // Mana drain utility value
                totalCCSeconds += tick * 0.05; // small CC-equivalent for mana drain
            }
        }

        // Ability cast
        if (unit.maxMana > 0 && mana >= unit.maxMana) {
            mana -= unit.maxMana;
            abilityCasts++;

            var abilityDmg = 0;
            if (mechanics.atkMultiplier > 0) {
                abilityDmg = atk * mechanics.atkMultiplier * mechanics.hits * avgCritMult;
            }

            // AoE multiplier
            if (mechanics.isAoE) {
                abilityDmg *= mechanics.aoeTargets * 0.8; // mages get better AoE scaling
            }

            // Burn DoT extra (estimate 3s burn at 30% ATK/s)
            if (mechanics.hasBurn) {
                var burnTargets = mechanics.isAoE ? mechanics.aoeTargets : 1;
                abilityDmg += atk * 0.3 * 3 * burnTargets;
            }

            // Hazard zone (Terra Sage)
            if (/hazard zone/i.test(mechanics.desc)) {
                abilityDmg += atk * 0.6 * 5 * 2; // 60% ATK/s, 5s, ~2 targets
            }

            totalAbilityDamage += abilityDmg;
            totalDamage += abilityDmg;

            // CC from abilities
            if (mechanics.hasStun) totalCCSeconds += mechanics.stunDuration * (mechanics.isAoE ? 2 : 1);
            if (mechanics.hasSlow) totalCCSeconds += 2 * (mechanics.isAoE ? 2 : 1);
            if (mechanics.hasRoot) totalCCSeconds += mechanics.rootDuration * (mechanics.isAoE ? 2 : 1);
        }
    }

    timeAlive = Math.min(timeAlive + tick, duration);
    var manaSpent = abilityCasts * (unit.maxMana || 1);

    return {
        totalDamage: Math.floor(totalDamage),
        dps: Math.floor(totalDamage / timeAlive),
        abilityDPS: Math.floor(totalAbilityDamage / timeAlive),
        abilityDamage: Math.floor(totalAbilityDamage),
        autoDamage: Math.floor(totalAutoDamage),
        abilityPercent: Math.round(totalAbilityDamage / Math.max(1, totalDamage) * 100),
        manaEfficiency: manaSpent > 0 ? Math.floor(totalAbilityDamage / manaSpent * 100) : 0,
        ccSeconds: Math.round(totalCCSeconds * 10) / 10,
        timeAlive: Math.round(timeAlive * 10) / 10,
        abilityCasts: abilityCasts,
        isAoE: mechanics.isAoE
    };
}

// ---- ASSASSIN SIMULATION ----
// Assassins burst down priority targets. Measured on:
// - Burst window damage (first 3 seconds)
// - Time to kill a standard target
// - Kill potential (damage within first ability cycle)
// - Effective damage before death (they're squishy)
function simulateAssassin(unit, mechanics) {
    var duration = SIM_CONFIG.duration;
    var tick = SIM_CONFIG.tickRate;
    var incomingDPS = SIM_CONFIG.incomingDPS.assassin;

    var currentHP = unit.maxHp;
    var mana = 0;
    var atk = unit.attack;
    var totalDamage = 0;
    var burstDamage = 0; // first 3 seconds
    var abilityCasts = 0;
    var timeAlive = 0;
    var timeToKill = duration; // time to kill standard enemy
    var killsDuringFight = 0;

    var atkBuffExpiry = 0;
    var currentAtkBuff = 0;
    var killStreakStacks = 0;

    for (var t = 0; t < duration; t += tick) {
        if (currentHP <= 0) break;
        timeAlive = t;

        currentHP -= incomingDPS * tick;

        // Fast attacks (assassins have low attackSpd = fast)
        var attacksThisTick = tick / unit.attackSpd;
        var effectiveAtk = atk * (1 + (t < atkBuffExpiry ? currentAtkBuff : 0));
        effectiveAtk *= (1 + killStreakStacks * 0.08); // kill streak bonus

        var avgCritMult = 1 + (SIM_CONFIG.critChance * (SIM_CONFIG.critMultiplier - 1));
        var autoDamage = effectiveAtk * attacksThisTick * avgCritMult;
        totalDamage += autoDamage;
        if (t < 3) burstDamage += autoDamage;

        // Mana (assassins gain fast due to fast attacks)
        if (unit.maxMana > 0) {
            mana += 10 * attacksThisTick;
            mana += incomingDPS * tick * 0.1;
        }

        // Ability cast
        if (unit.maxMana > 0 && mana >= unit.maxMana) {
            mana -= unit.maxMana;
            abilityCasts++;

            var abilityDmg = 0;
            if (mechanics.atkMultiplier > 0) {
                abilityDmg = effectiveAtk * mechanics.atkMultiplier * mechanics.hits * avgCritMult;
            }

            // Mark consumption
            if (mechanics.hasMarkStacking) {
                abilityDmg *= (1 + mechanics.markBonusDamage * 3); // average 3 stacks
            }

            // Execute bonus
            if (mechanics.hasExecute) {
                abilityDmg *= 1.2; // higher for assassins (they target low-HP)
            }

            totalDamage += abilityDmg;
            if (t < 3) burstDamage += abilityDmg;

            // Self healing from drain
            if (mechanics.selfHealPercent > 0) {
                currentHP = Math.min(unit.maxHp, currentHP + abilityDmg * mechanics.selfHealPercent);
            }
            if (mechanics.lifestealPercent > 0) {
                currentHP = Math.min(unit.maxHp, currentHP + abilityDmg * mechanics.lifestealPercent);
            }

            // Reset on kill
            if (mechanics.hasResetOnKill) {
                killsDuringFight++;
                killStreakStacks = Math.min(5, killStreakStacks + 1);
                if (totalDamage > SIM_CONFIG.standardEnemyHP * killsDuringFight) {
                    mana += unit.maxMana * 0.5; // partial reset
                }
            }

            if (mechanics.manaRefundOnKill > 0) {
                mana += mechanics.manaRefundOnKill * 0.5;
            }
        }

        // Track time to first kill
        if (totalDamage >= SIM_CONFIG.standardEnemyHP && timeToKill >= duration) {
            timeToKill = t;
        }
    }

    timeAlive = Math.min(timeAlive + tick, duration);

    return {
        totalDamage: Math.floor(totalDamage),
        dps: Math.floor(totalDamage / timeAlive),
        burstDamage: Math.floor(burstDamage),
        burstDPS: Math.floor(burstDamage / 3),
        timeToKill: Math.round(timeToKill * 10) / 10,
        effectiveDamage: Math.floor(totalDamage),
        timeAlive: Math.round(timeAlive * 10) / 10,
        abilityCasts: abilityCasts,
        killPotential: Math.floor(totalDamage / SIM_CONFIG.standardEnemyHP * 10) / 10
    };
}

// ---- HEALER SIMULATION ----
// Healers TARGET THE LOWEST HP ALLY — they do NOT auto-attack enemies.
// Their ATK stat feeds healing, not damage. They only deal damage via:
//   - Secondary ability effects (Fire Acolyte burns nearest enemy, War Cleric deals 100% ATK)
//   - Fallback when all allies are full HP (rare in real combat)
// Measured on:
// - HPS (healing per second from abilities)
// - Passive healing (auras, per-tick heals like Coral Priest)
// - Shield generation
// - Buff value (ATK/DR/crit buffs applied to allies)
// - Secondary damage (burn, splash — minor contribution)

// Hardcoded healer ability data from actual combat engine (main-v2.js)
var HEALER_ABILITY_DATA = {
    fire_acolyte:   { healMult: 1.40, healTargets: 1, lowHPBonus: 2.20, lowHPThreshold: 0.35, secondaryDmg: 0, burn: { dps: 8, dur: 2 }, buffs: [] },
    gale_dancer:    { healMult: 1.40, healTargets: 2, lowHPBonus: 0, lowHPThreshold: 0, secondaryDmg: 0, burn: null, buffs: [{ type: 'spdMod', value: 0.12, dur: 4 }] },
    pulse_mender:   { healMult: 1.45, healTargets: 1, chainHealMult: 0.80, chainTargets: 1, lowHPBonus: 0, lowHPThreshold: 0, secondaryDmg: 0, burn: null, buffs: [{ type: 'critBuff', value: 0.08, dur: 3 }] },
    coral_priest:   { healMult: 1.50, healTargets: 2, lowHPBonus: 0, lowHPThreshold: 0, secondaryDmg: 0, burn: null, buffs: [{ type: 'drMod', value: 0.10, dur: 4 }], passiveAura: { hpPctPerSec: 0.008, radius: 2.5 } },
    earth_shaman:   { healMult: 1.50, healTargets: 2, lowHPBonus: 0, lowHPThreshold: 0, secondaryDmg: 0, burn: null, shieldPct: 0.12, buffs: [{ type: 'ccResist', value: 0.12, dur: 4 }] },
    tidal_shaman:   { healMult: 1.60, healTargets: 0, healAllWater: true, lowHPBonus: 0, lowHPThreshold: 0, secondaryDmg: 0, burn: null, buffs: [{ type: 'dodgeBuff', value: 0.15, dur: 3 }], passiveSlow: { value: 0.12, dur: 2 } },
    war_cleric:     { healMult: 1.50, healTargets: 1, lowHPBonus: 0, lowHPThreshold: 0, secondaryDmg: 1.00, burn: null, buffs: [{ type: 'atkBuff', value: 0.08, dur: 4 }, { type: 'drMod', value: 0.05, dur: 4 }] },
    ashen_watcher:  { healMult: 1.50, healTargets: 2, lowHPBonus: 0, lowHPThreshold: 0, secondaryDmg: 0, burn: { dps: 15, dur: 3 }, buffs: [{ type: 'atkBuff', value: 0.12, dur: 4 }] },
    world_tree:     { healMult: 0, healTargets: 0, lowHPBonus: 0, lowHPThreshold: 0, secondaryDmg: 0, burn: null, buffs: [], passiveAura: { hpPctPerSec: 0.012, radius: 99 }, summons: { count: 2, hpPct: 0.30, atkPct: 0.30, interval: 10 } }
};

function simulateHealer(unit, mechanics) {
    var duration = SIM_CONFIG.duration;
    var tick = SIM_CONFIG.tickRate;
    var incomingDPS = SIM_CONFIG.incomingDPS.ranged; // healers are backline

    var currentHP = unit.maxHp;
    var mana = 0;
    var atk = unit.attack;
    var totalHealing = 0;
    var totalAllyShields = 0;
    var totalBuffValue = 0;
    var totalSecondaryDmg = 0;
    var abilityCasts = 0;
    var timeAlive = 0;

    var healerData = HEALER_ABILITY_DATA[unit.key] || null;
    var allyCount = SIM_CONFIG.standardAllyCount;
    var allyHP = SIM_CONFIG.standardAllyHP;

    // Simulate allies taking damage (they need healing)
    var allyDamageTaken = SIM_CONFIG.incomingDPS.melee; // allies take melee DPS

    for (var t = 0; t < duration; t += tick) {
        if (currentHP <= 0) break;
        timeAlive = t;

        // Healer takes backline damage
        currentHP -= incomingDPS * tick;

        // Healers auto-attack ALLIES (healing), not enemies
        // In real combat, healers heal lowest HP ally with their auto-attacks
        // Mana gain comes from the healing "attacks"
        var attacksThisTick = tick / unit.attackSpd;
        var autoHeal = atk * attacksThisTick * 0.3; // auto-heal is weaker than abilities
        totalHealing += autoHeal;

        // Mana from auto-attacks + damage taken
        if (unit.maxMana > 0) {
            mana += 10 * attacksThisTick;
            mana += incomingDPS * tick * 0.1;
        }

        // Passive auras (Coral Priest: 0.8% max HP/s to nearby allies, World Tree: 1.2% to all)
        if (healerData && healerData.passiveAura) {
            var auraTargets = healerData.passiveAura.radius >= 99 ? allyCount : Math.min(allyCount, 3);
            var auraHealPerTick = allyHP * healerData.passiveAura.hpPctPerSec * tick * auraTargets;
            totalHealing += auraHealPerTick;
        }

        // Summons (World Tree: every 10s, summon 2 minions)
        if (healerData && healerData.summons && unit.maxMana === 0) {
            if (t > 0 && Math.floor(t / healerData.summons.interval) > Math.floor((t - tick) / healerData.summons.interval)) {
                // Minions deal damage
                var minionDPS = atk * healerData.summons.atkPct * healerData.summons.count;
                var minionLifetime = 8; // seconds
                totalSecondaryDmg += minionDPS * minionLifetime;
                // Also heal all allies (World Tree passive ability fires on summon)
                totalHealing += allyHP * 0.20 * allyCount; // 20% max HP heal to all
            }
        }

        // Ability cast
        if (unit.maxMana > 0 && mana >= unit.maxMana && healerData) {
            mana -= unit.maxMana;
            abilityCasts++;

            // --- Primary heal ---
            var healAmount = 0;
            var healTargets = healerData.healTargets;

            if (healerData.healAllWater) {
                // Tidal Shaman heals all Water allies
                healTargets = Math.max(2, Math.floor(allyCount * 0.5)); // estimate ~half are water
            }

            if (healerData.healMult > 0 && healTargets > 0) {
                var baseHeal = atk * healerData.healMult;
                // Low HP bonus (Fire Acolyte heals 220% instead of 140% if target <35% HP)
                if (healerData.lowHPBonus > 0) {
                    // Estimate ~30% of the time target is below threshold
                    var avgHealMult = healerData.healMult * 0.7 + healerData.lowHPBonus * 0.3;
                    baseHeal = atk * avgHealMult;
                }
                healAmount = baseHeal * healTargets;
                totalHealing += healAmount;
            }

            // Chain heal (Pulse Mender: 80% ATK to 1 nearby ally)
            if (healerData.chainHealMult) {
                var chainHeal = atk * healerData.chainHealMult * (healerData.chainTargets || 1);
                totalHealing += chainHeal;
            }

            // --- Shields ---
            if (healerData.shieldPct) {
                var shieldAmt = allyHP * healerData.shieldPct * healTargets;
                totalAllyShields += shieldAmt;
            }

            // --- Buffs applied to healed allies ---
            for (var b = 0; b < healerData.buffs.length; b++) {
                var buff = healerData.buffs[b];
                // Estimate buff value: ATK buff multiplied by ally DPS, DR multiplied by damage prevented
                var buffTargets = healTargets || 1;
                switch (buff.type) {
                    case 'atkBuff':
                        // +X% ATK for Y seconds to Z allies = team DPS increase
                        totalBuffValue += 100 * buff.value * buff.dur * buffTargets; // weighted value
                        break;
                    case 'drMod':
                        // +X% DR for Y seconds = damage prevented
                        totalBuffValue += allyDamageTaken * buff.value * buff.dur * buffTargets * 0.5;
                        break;
                    case 'critBuff':
                        totalBuffValue += 80 * buff.value * buff.dur * buffTargets;
                        break;
                    case 'dodgeBuff':
                        totalBuffValue += allyDamageTaken * buff.value * buff.dur * buffTargets * 0.3;
                        break;
                    case 'spdMod':
                        totalBuffValue += 50 * buff.value * buff.dur * buffTargets;
                        break;
                    case 'ccResist':
                        totalBuffValue += 60 * buff.value * buff.dur * buffTargets;
                        break;
                }
            }

            // --- Secondary damage ---
            if (healerData.secondaryDmg > 0) {
                totalSecondaryDmg += atk * healerData.secondaryDmg;
            }
            if (healerData.burn) {
                totalSecondaryDmg += healerData.burn.dps * healerData.burn.dur;
            }

            // --- Passive slow (Tidal Shaman slows nearest enemy on each heal) ---
            if (healerData.passiveSlow) {
                totalBuffValue += 40 * healerData.passiveSlow.dur; // CC utility
            }
        }
    }

    timeAlive = Math.min(timeAlive + tick, duration);
    var effectiveHealing = totalHealing + totalAllyShields;

    return {
        totalHealing: Math.floor(totalHealing),
        hps: Math.floor(totalHealing / timeAlive),
        allyShields: Math.floor(totalAllyShields),
        buffValue: Math.floor(totalBuffValue),
        secondaryDmg: Math.floor(totalSecondaryDmg),
        effectiveHealing: Math.floor(effectiveHealing + totalBuffValue),
        allyLivesSaved: Math.round(effectiveHealing / SIM_CONFIG.standardAllyHP * 10) / 10,
        timeAlive: Math.round(timeAlive * 10) / 10,
        abilityCasts: abilityCasts
    };
}

// =============================================================================
// UNIFIED COMBAT RATING — Role-weighted score
// =============================================================================

function calculateCombatRating(unit, simResult, mechanics) {
    var type = unit.type;
    var tier = unit.cost;

    switch (type) {
        case 'warrior':
            // Warriors: 50% DPS + 20% survivability + 15% self-sustain + 15% effective damage
            return Math.floor(
                (simResult.dps * 0.50) +
                ((simResult.timeAlive / SIM_CONFIG.duration) * 500 * 0.20) +
                (Math.min(simResult.selfHealing, unit.maxHp) / unit.maxHp * 300 * 0.15) +
                (simResult.effectiveDamage / 100 * 0.15)
            );

        case 'tank':
            // Tanks: 35% effective HP + 25% time alive + 20% CC + 20% team protection
            return Math.floor(
                (simResult.effectiveHP / 50 * 0.35) +
                ((simResult.timeAlive / SIM_CONFIG.duration) * 500 * 0.25) +
                (simResult.ccSeconds * 30 * 0.20) +
                (simResult.teamProtection / 20 * 0.20)
            );

        case 'archer':
            // Archers: 55% DPS + 20% time alive (range safety) + 15% ability damage + 10% total damage
            return Math.floor(
                (simResult.dps * 0.55) +
                ((simResult.timeAlive / SIM_CONFIG.duration) * 500 * 0.20) +
                (simResult.abilityDamage / 100 * 0.15) +
                (simResult.totalDamage / 100 * 0.10)
            );

        case 'mage':
            // Mages: 40% ability DPS + 20% total DPS + 15% CC + 15% AoE/mana + 10% survivability
            var aoeMult = mechanics.isAoE ? 1.3 : 1.0;
            var manaOrPassive = unit.maxMana > 0 ? simResult.manaEfficiency : (simResult.abilityDPS * 0.5);
            return Math.floor(
                (simResult.abilityDPS * 0.40 * aoeMult) +
                (simResult.dps * 0.20) +
                (simResult.ccSeconds * 30 * 0.15) +
                (manaOrPassive * 0.15) +
                ((simResult.timeAlive / SIM_CONFIG.duration) * 500 * 0.10)
            );

        case 'assassin':
            // Assassins: 35% burst DPS + 25% time to kill + 20% kill potential + 20% effective damage
            var ttkScore = Math.max(0, 500 - (simResult.timeToKill * 50)); // faster kill = higher score
            return Math.floor(
                (simResult.burstDPS * 0.35) +
                (ttkScore * 0.25) +
                (simResult.killPotential * 50 * 0.20) +
                (simResult.effectiveDamage / 100 * 0.20)
            );

        case 'healer':
            // Healers: 35% HPS + 25% effective healing (heal+shield+buffs) + 25% buff utility + 15% time alive
            var effectiveHPS = simResult.hps + (simResult.allyShields / Math.max(1, simResult.timeAlive) * 0.8);
            return Math.floor(
                (effectiveHPS * 2 * 0.35) +
                (simResult.effectiveHealing / 30 * 0.25) +
                (simResult.buffValue / 10 * 0.25) +
                ((simResult.timeAlive / SIM_CONFIG.duration) * 500 * 0.15)
            );

        default:
            return 0;
    }
}

// =============================================================================
// POWER RATING V2 — Role-aware static estimate
// =============================================================================

function calculatePowerRatingV2(unit, mechanics) {
    var stats = getUnitStats(unit);
    var type = unit.type;
    var tier = unit.cost;

    var hpValue = stats.hp;
    var atkValue = stats.attack;
    var dps = atkValue / (unit.attackSpd || 1);
    var abilityValue = getAbilityPowerValue(unit);
    var ascMult = 1 + getAscensionStatBonus(unit.ascensionTier);

    var pr = 0;

    switch (type) {
        case 'warrior':
            // Warriors: balanced DPS and durability
            pr = (hpValue * 0.35) + (dps * 1.4) + (abilityValue * 0.9);
            // Self-sustain bonus
            if (mechanics.selfHealPercent > 0 || mechanics.lifestealPercent > 0) pr *= 1.08;
            if (mechanics.hasResetOnKill) pr *= 1.06;
            break;

        case 'tank':
            // Tanks: HP-heavy with CC and protection value
            pr = (hpValue * 0.7) + (dps * 0.3);
            // Shield value
            if (mechanics.shieldPercent > 0) pr += hpValue * mechanics.shieldPercent * 0.5;
            // DR value
            if (mechanics.drPercent > 0) pr *= (1 + mechanics.drPercent * 0.4);
            // CC value
            if (mechanics.hasTaunt) pr += 150 * mechanics.tauntDuration;
            if (mechanics.hasStun) pr += 120 * mechanics.stunDuration;
            if (mechanics.hasRoot) pr += 100 * mechanics.rootDuration;
            // Ally shields
            if (mechanics.allyShieldPercent > 0) pr += hpValue * mechanics.allyShieldPercent * 0.4 * SIM_CONFIG.standardAllyCount;
            // Reflect
            if (mechanics.reflectPercent > 0) pr += dps * mechanics.reflectPercent * 3;
            // Dodge
            if (mechanics.dodgeBoost > 0) pr *= (1 + mechanics.dodgeBoost * 0.3);
            break;

        case 'archer':
            // Archers: DPS-focused with range safety premium
            pr = (hpValue * 0.15) + (dps * 1.6) + (abilityValue * 0.8);
            // Range safety multiplier
            if (unit.range >= 4) pr *= 1.10;
            else if (unit.range >= 3) pr *= 1.05;
            // Multi-hit abilities
            if (mechanics.hits > 1) pr *= 1.05;
            // CC from archers is highly valued (unexpected)
            if (mechanics.hasStun || mechanics.hasRoot || mechanics.hasFreeze) pr *= 1.08;
            break;

        case 'mage':
            // Mages: ability damage dominant
            pr = (hpValue * 0.15) + (dps * 0.5) + (abilityValue * 1.8);
            // AoE premium
            if (mechanics.isAoE) pr *= 1.25;
            // Burn/DoT
            if (mechanics.hasBurn) pr += atkValue * 0.9; // 3s burn DoT value
            // CC value
            if (mechanics.hasStun) pr += 100 * mechanics.stunDuration;
            if (mechanics.hasSlow) pr += 60;
            if (mechanics.hasRoot) pr += 80 * mechanics.rootDuration;
            // Terrain control
            if (/hazard|zone/i.test(mechanics.desc)) pr *= 1.12;
            break;

        case 'assassin':
            // Assassins: burst + kill potential
            pr = (hpValue * 0.10) + (dps * 1.3) + (abilityValue * 1.2);
            // Fast attack speed premium
            if (unit.attackSpd <= 0.5) pr *= 1.12;
            // Kill mechanics
            if (mechanics.hasExecute) pr *= 1.10;
            if (mechanics.hasResetOnKill) pr *= 1.15;
            if (mechanics.hasDash) pr *= 1.05;
            // Mark stacking
            if (mechanics.hasMarkStacking) pr += atkValue * mechanics.markBonusDamage * 3;
            // Self-sustain helps assassins disproportionately
            if (mechanics.selfHealPercent > 0) pr *= 1.10;
            break;

        case 'healer':
            // Healers: healing throughput (ATK-based) + survivability + buff utility
            // Healers don't deal damage — ATK feeds healing, not DPS
            var hData = HEALER_ABILITY_DATA[unit.key];
            var castRate = unit.maxMana > 0 ? (50 / unit.maxMana) : 0;
            var healPerCast = hData && hData.healMult > 0 ? (atkValue * hData.healMult * Math.max(1, hData.healTargets)) : (atkValue * 1.5);
            var estHPS = healPerCast * castRate;

            pr = (hpValue * 0.20) + (estHPS * 4.0); // healing throughput is primary value

            // Passive aura (Coral Priest, World Tree)
            if (hData && hData.passiveAura) {
                var auraTargets = hData.passiveAura.radius >= 99 ? SIM_CONFIG.standardAllyCount : 3;
                pr += SIM_CONFIG.standardAllyHP * hData.passiveAura.hpPctPerSec * auraTargets * 10;
            }
            // Shield value
            if (hData && hData.shieldPct) pr += SIM_CONFIG.standardAllyHP * hData.shieldPct * Math.max(1, hData.healTargets) * 2;
            // Buff utility
            if (hData && hData.buffs) {
                for (var bi = 0; bi < hData.buffs.length; bi++) {
                    pr += 100 * hData.buffs[bi].value * hData.buffs[bi].dur;
                }
            }
            // Summons (World Tree)
            if (hData && hData.summons) pr += atkValue * hData.summons.atkPct * hData.summons.count * 5;
            break;
    }

    return Math.floor(pr * ascMult);
}

// =============================================================================
// MAIN SIMULATION RUNNER
// =============================================================================

function simulateUnit(unitKey, options) {
    options = options || {};
    var unit = createSimUnit(unitKey, options);
    if (!unit) return null;

    var mechanics = parseAbilityMechanics(unitKey, unit.evolved);
    if (!mechanics) mechanics = { atkMultiplier: 1, hits: 1, isAoE: false, isPassive: false,
        hasStun: false, stunDuration: 0, hasRoot: false, rootDuration: 0, hasSlow: false,
        hasTaunt: false, tauntDuration: 0, hasFreeze: false, shieldPercent: 0, allyShieldPercent: 0,
        drPercent: 0, dodgeBoost: 0, reflectPercent: 0, healMultiplier: 0, lifestealPercent: 0,
        selfHealPercent: 0, atkSpeedBuff: 0, atkBuff: 0, hasExecute: false, hasResetOnKill: false,
        hasBurn: false, hasMarkStacking: false, markBonusDamage: 0, manaRefundOnKill: 0,
        atkStealPercent: 0, hasMinions: false, hasManaToggle: false, damageRedirectPercent: 0,
        desc: '', template: ''
    };

    var simResult;
    switch (unit.type) {
        case 'warrior':  simResult = simulateWarrior(unit, mechanics); break;
        case 'tank':     simResult = simulateTank(unit, mechanics); break;
        case 'archer':   simResult = simulateArcher(unit, mechanics); break;
        case 'mage':     simResult = simulateMage(unit, mechanics); break;
        case 'assassin': simResult = simulateAssassin(unit, mechanics); break;
        case 'healer':   simResult = simulateHealer(unit, mechanics); break;
        default:         simResult = simulateWarrior(unit, mechanics); break;
    }

    var combatRating = calculateCombatRating(unit, simResult, mechanics);
    var powerRating = calculatePowerRatingV2(unit, mechanics);

    return {
        unitKey: unitKey,
        unitName: unit.name,
        tier: unit.cost,
        type: unit.type,
        archetype: unit.archetype,
        element: unit.element,
        evolved: unit.evolved,
        stars: unit.stars,
        level: unit.level,
        ascension: unit.ascensionTier,
        hp: unit.maxHp,
        attack: unit.attack,
        attackSpd: unit.attackSpd,
        range: unit.range,
        maxMana: unit.maxMana,
        powerRating: powerRating,
        combatRating: combatRating,
        simulation: simResult,
        mechanics: {
            isPassive: mechanics.isPassive,
            isAoE: mechanics.isAoE,
            hasCC: mechanics.hasStun || mechanics.hasRoot || mechanics.hasTaunt || mechanics.hasSlow || mechanics.hasFreeze,
            hasSelfSustain: mechanics.selfHealPercent > 0 || mechanics.lifestealPercent > 0,
            hasShield: mechanics.shieldPercent > 0,
            hasExecute: mechanics.hasExecute,
            hasResetOnKill: mechanics.hasResetOnKill
        }
    };
}

// Run simulation for ALL base units
function simulateAllUnits(options) {
    options = options || { level: 1, stars: 1 };
    var results = [];
    var keys = Object.keys(UNIT_TEMPLATES);
    for (var i = 0; i < keys.length; i++) {
        var r = simulateUnit(keys[i], options);
        if (r) results.push(r);
    }
    results.sort(function(a, b) { return b.combatRating - a.combatRating; });
    return results;
}

// Run simulation for ALL evolved units
function simulateAllEvolvedUnits(options) {
    options = options || { level: 1, stars: 1 };
    var results = [];
    var keys = Object.keys(EVOLVED_TEMPLATES);
    for (var i = 0; i < keys.length; i++) {
        // Skip keys that also exist in UNIT_TEMPLATES (base units)
        if (UNIT_TEMPLATES[keys[i]]) continue;
        var r = simulateUnit(keys[i], options);
        if (r) results.push(r);
    }
    results.sort(function(a, b) { return b.combatRating - a.combatRating; });
    return results;
}

// Run simulation grouped by role
function simulateByRole(options) {
    var all = simulateAllUnits(options);
    var byRole = { warrior: [], tank: [], archer: [], mage: [], assassin: [], healer: [] };
    for (var i = 0; i < all.length; i++) {
        var type = all[i].type;
        if (byRole[type]) byRole[type].push(all[i]);
    }
    // Sort each role by combat rating
    for (var role in byRole) {
        byRole[role].sort(function(a, b) { return b.combatRating - a.combatRating; });
    }
    return byRole;
}

// Run simulation grouped by tier
function simulateByTier(options) {
    var all = simulateAllUnits(options);
    var byTier = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    for (var i = 0; i < all.length; i++) {
        var t = all[i].tier;
        if (byTier[t]) byTier[t].push(all[i]);
    }
    for (var tier in byTier) {
        byTier[tier].sort(function(a, b) { return b.combatRating - a.combatRating; });
    }
    return byTier;
}

// =============================================================================
// BALANCE ANALYSIS
// =============================================================================

function analyzeBalance(results) {
    if (!results || results.length === 0) return null;

    // Stats by tier
    var tierStats = {};
    var roleStats = {};
    var elementStats = {};

    for (var i = 0; i < results.length; i++) {
        var r = results[i];

        // Tier stats
        if (!tierStats[r.tier]) tierStats[r.tier] = { units: [], totalPR: 0, totalCR: 0, count: 0 };
        tierStats[r.tier].units.push(r);
        tierStats[r.tier].totalPR += r.powerRating;
        tierStats[r.tier].totalCR += r.combatRating;
        tierStats[r.tier].count++;

        // Role stats
        if (!roleStats[r.type]) roleStats[r.type] = { units: [], totalPR: 0, totalCR: 0, count: 0 };
        roleStats[r.type].units.push(r);
        roleStats[r.type].totalPR += r.powerRating;
        roleStats[r.type].totalCR += r.combatRating;
        roleStats[r.type].count++;

        // Element stats
        if (!elementStats[r.element]) elementStats[r.element] = { units: [], totalPR: 0, totalCR: 0, count: 0 };
        elementStats[r.element].units.push(r);
        elementStats[r.element].totalPR += r.powerRating;
        elementStats[r.element].totalCR += r.combatRating;
        elementStats[r.element].count++;
    }

    // Compute averages and find outliers
    var analysis = {
        tierBreakdown: {},
        roleBreakdown: {},
        elementBreakdown: {},
        outliers: { overpowered: [], underpowered: [] },
        tierScaling: []
    };

    // Tier breakdown
    for (var tier in tierStats) {
        var ts = tierStats[tier];
        var avgPR = Math.floor(ts.totalPR / ts.count);
        var avgCR = Math.floor(ts.totalCR / ts.count);
        var prs = ts.units.map(function(u) { return u.powerRating; });
        var crs = ts.units.map(function(u) { return u.combatRating; });
        analysis.tierBreakdown[tier] = {
            count: ts.count,
            avgPowerRating: avgPR,
            avgCombatRating: avgCR,
            minPR: Math.min.apply(null, prs),
            maxPR: Math.max.apply(null, prs),
            minCR: Math.min.apply(null, crs),
            maxCR: Math.max.apply(null, crs),
            spreadPR: Math.max.apply(null, prs) - Math.min.apply(null, prs),
            spreadCR: Math.max.apply(null, crs) - Math.min.apply(null, crs)
        };
    }

    // Role breakdown
    for (var role in roleStats) {
        var rs = roleStats[role];
        analysis.roleBreakdown[role] = {
            count: rs.count,
            avgPowerRating: Math.floor(rs.totalPR / rs.count),
            avgCombatRating: Math.floor(rs.totalCR / rs.count)
        };
    }

    // Element breakdown
    for (var elem in elementStats) {
        var es = elementStats[elem];
        analysis.elementBreakdown[elem] = {
            count: es.count,
            avgPowerRating: Math.floor(es.totalPR / es.count),
            avgCombatRating: Math.floor(es.totalCR / es.count)
        };
    }

    // Find outliers (units >30% above or below tier average)
    for (var j = 0; j < results.length; j++) {
        var unit = results[j];
        var tierAvg = analysis.tierBreakdown[unit.tier].avgCombatRating;
        var deviation = (unit.combatRating - tierAvg) / tierAvg;

        if (deviation > 0.30) {
            analysis.outliers.overpowered.push({
                name: unit.unitName,
                key: unit.unitKey,
                tier: unit.tier,
                type: unit.type,
                element: unit.element,
                combatRating: unit.combatRating,
                tierAvg: tierAvg,
                deviationPercent: Math.round(deviation * 100)
            });
        } else if (deviation < -0.30) {
            analysis.outliers.underpowered.push({
                name: unit.unitName,
                key: unit.unitKey,
                tier: unit.tier,
                type: unit.type,
                element: unit.element,
                combatRating: unit.combatRating,
                tierAvg: tierAvg,
                deviationPercent: Math.round(deviation * 100)
            });
        }
    }

    // Tier scaling (is T2 ~1.5-2× T1, T3 ~2-3× T1, etc.?)
    var t1Avg = analysis.tierBreakdown[1] ? analysis.tierBreakdown[1].avgCombatRating : 1;
    for (var t = 1; t <= 5; t++) {
        if (analysis.tierBreakdown[t]) {
            analysis.tierScaling.push({
                tier: t,
                avgCR: analysis.tierBreakdown[t].avgCombatRating,
                ratioToT1: Math.round(analysis.tierBreakdown[t].avgCombatRating / t1Avg * 100) / 100
            });
        }
    }

    return analysis;
}

// =============================================================================
// TTK ANALYSIS — Verify against design targets
// =============================================================================

function analyzeTTK(options) {
    options = options || { level: 10, stars: 2 };
    var results = simulateAllUnits(options);

    // Find representative units per role
    var dpsUnits = results.filter(function(u) { return u.type === 'warrior' || u.type === 'assassin' || u.type === 'archer'; });
    var tankUnits = results.filter(function(u) { return u.type === 'tank'; });
    var healerUnits = results.filter(function(u) { return u.type === 'healer'; });

    // Average DPS by DPS units
    var avgDPS = 0;
    for (var i = 0; i < dpsUnits.length; i++) {
        avgDPS += dpsUnits[i].simulation.dps || 0;
    }
    avgDPS = dpsUnits.length > 0 ? avgDPS / dpsUnits.length : 100;

    // Average tank HP
    var avgTankHP = 0;
    for (var j = 0; j < tankUnits.length; j++) {
        var tank = tankUnits[j];
        avgTankHP += tank.simulation.effectiveHP || tank.hp;
    }
    avgTankHP = tankUnits.length > 0 ? avgTankHP / tankUnits.length : 2000;

    // Average DPS HP
    var avgDPSHP = 0;
    for (var k = 0; k < dpsUnits.length; k++) {
        avgDPSHP += dpsUnits[k].hp;
    }
    avgDPSHP = dpsUnits.length > 0 ? avgDPSHP / dpsUnits.length : 600;

    // Average healer HPS
    var avgHPS = 0;
    for (var h = 0; h < healerUnits.length; h++) {
        avgHPS += healerUnits[h].simulation.hps || 0;
    }
    avgHPS = healerUnits.length > 0 ? avgHPS / healerUnits.length : 50;

    return {
        dpsVsDps: Math.round(avgDPSHP / avgDPS * 10) / 10,          // target: 4-8s
        dpsVsTank: Math.round(avgTankHP / avgDPS * 10) / 10,         // target: 10-18s
        dpsVsTankHealer: Math.round(avgTankHP / Math.max(1, avgDPS - avgHPS) * 10) / 10,  // target: 15-25s
        targets: { dpsVsDps: '4-8s', dpsVsTank: '10-18s', dpsVsTankHealer: '15-25s' },
        avgDPS: Math.floor(avgDPS),
        avgTankEffHP: Math.floor(avgTankHP),
        avgDPSHP: Math.floor(avgDPSHP),
        avgHPS: Math.floor(avgHPS),
        unitCount: results.length
    };
}

// combat-core.js -- grid init, targeting helpers, tick loop, movement/pathfinding, synergy bridge (split from main-v2.js)

// ---- Bridge functions for combat.js compatibility ----
// The V1 combat engine expects certain functions/globals. We bridge them here.

// Combat state (used by combat.js)
var combatState = null;

function initCombat(gs) {
    // Prompt 60: reset the combat event bus. In this engine initCombat() runs
    // once per wave (not once per whole mission) — see startWaveCombat() in
    // ui-combat.js — so "combat" for once-per-combat hero effects means
    // "once per wave" here, matching the engine's existing per-wave reset
    // convention (phoenixReviveUsed, frenzyStacks, etc. are also reset by
    // healBoardUnits() between waves). Listeners are re-registered fresh
    // below for every wave.
    if (typeof combatEvents !== 'undefined') combatEvents.reset();

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

    // Prompt 62: encounter mechanics (VIP/countdown/reinforcement/objective/
    // split/escalation) driven off stageData.encounterMechanic. Runs before the
    // per-unit init loops below so any units this injects (Veil Crystal, Ward
    // NPC, reinforcement adds) get the same cooldown/combatStats/mana init as
    // every other unit. No-ops when the stage has no encounterMechanic set --
    // existing golden scenarios (which use plain stages) are unaffected.
    if (typeof setupCombatEncounterMechanics === 'function') {
        setupCombatEncounterMechanics(combatState, (typeof activeMission !== 'undefined' ? activeMission : null));
        // Re-flatten allUnits/enemyUnits/playerUnits references in case the
        // mechanic setup pushed new units (allUnits was captured by value above).
        combatState.allUnits = combatState.playerUnits.concat(combatState.enemyUnits);
    }

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

    // Apply hero skill effects to player units (philosophy-based system)
    if (typeof getHeroForUnit === 'function' && typeof applyHeroStatBonuses === 'function') {
        var sd = getSaveData();
        for (var hi = 0; hi < combatState.playerUnits.length; hi++) {
            var hu = combatState.playerUnits[hi];
            var unitKey = hu.key || hu.templateKey;
            if (!unitKey) continue;

            var heroInfo = getHeroForUnit(sd, unitKey);
            if (!heroInfo || heroInfo.data.isDead) continue;

            hu._heroKey = heroInfo.key;
            hu._heroData = heroInfo.data;

            // Apply static stat bonuses from invested skill nodes
            applyHeroStatBonuses(hu, heroInfo.key, heroInfo.data);

            // Track hero on unit for combat-triggered effects
            hu.heroOncePerCombatUsed = {};

            // Register event-driven skill node listeners (Prompt 60)
            if (typeof registerHeroSkillEvents === 'function') {
                registerHeroSkillEvents(hu, heroInfo.key, heroInfo.data);
            }
        }
    }

    // Initialize combatStats on every unit (only if not already present, to persist across waves)
    for (var si = 0; si < combatState.allUnits.length; si++) {
        var su = combatState.allUnits[si];

        // Prompt 60: hero skill dynamic-modifier caches are per-wave (see
        // registerHeroSkillEvents / heroSet*Mod in heroes.js). Reset every
        // wave so stale contributions from a previous wave's listeners
        // never leak forward, and so the lazily-captured "base" value is
        // re-snapshotted fresh (after this wave's synergy/item/hero-apply
        // bonuses are in place) the next time a listener fires.
        su._heroAtkMods = null;
        su._heroDrMods = null;
        su._heroAtkSpdMods = null;
        su._heroLifestealMods = null;
        su._heroDmgDealtMods = null;
        su._heroAbilityDmgMods = null;
        su._heroBaseAtk = undefined;
        su._heroBaseDr = undefined;
        su._heroBaseAtkSpd = undefined;
        su._heroBaseLifesteal = undefined;
        su._heroMoveSpeedBonus = 0;
        su._heroExecuteThreshold = undefined;
        su._heroExecuteBonus = undefined;
        su._heroWeakPointMax = undefined;
        su._heroEmergencyCareBonus = undefined;
        su._heroExploitOpeningBonus = undefined;
        su._heroForceCritAbility = false;
        su._heroDrIgnoreAbility = 0;
        su._heroHealReceivedBonus = 0;
        su._heroShieldReceivedBonus = 0;
        su._heroSanctuaryUntil = 0;
        su._heroSanctuaryCapstoneUntil = 0;
        su._retributionBuff = false;
        su._heroNextAbilityManaRefund = 0;
        su._heroPendingManaRefund = 0;

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

    // Apply Mana Shrine bonuses
    if (sd && typeof getManaShrineBonuses === 'function') {
        var manaBonuses = getManaShrineBonuses(sd);
        for (var mi2 = 0; mi2 < combatState.playerUnits.length; mi2++) {
            var mu = combatState.playerUnits[mi2];
            // Starting mana
            if (manaBonuses.startingMana > 0 && mu.maxMana > 0) {
                mu.currentMana = Math.min(mu.maxMana, mu.currentMana + manaBonuses.startingMana);
            }
            // Store shrine bonuses on unit for combat-time use
            mu.manaShrine = manaBonuses;
        }
    }

    // Apply Bond Hall bonuses (Prompt 62: unified on the canonical
    // detectActiveBonds() (units-bonds.js) instead of reimplementing bond
    // detection inline -- PHASE2-AUDIT item 11. The old inline copy checked
    // `bond.effect`, a field UNIT_BONDS entries have never had (they use
    // `bonus`), so it was dead code that silently applied nothing; combat
    // bonds now actually take effect. Bond Hall gating (must be built to
    // level 1+ to activate bonds at all, trio unlock at level 5, the
    // 25%/50% bonus-mult tiers) is preserved by gating on
    // getBondHallBonuses(sd).canViewBonds before calling detectActiveBonds(),
    // exactly as the old inline code gated on it.
    combatState.activeBonds = [];
    if (sd && typeof getBondHallBonuses === 'function' && typeof detectActiveBonds === 'function') {
        var bondHallInfo = getBondHallBonuses(sd);
        if (bondHallInfo.canViewBonds) {
            var teamKeys = [];
            for (var bk = 0; bk < combatState.playerUnits.length; bk++) {
                if (combatState.playerUnits[bk].templateKey) teamKeys.push(combatState.playerUnits[bk].templateKey);
            }
            combatState.activeBonds = detectActiveBonds(teamKeys, sd);
            for (var bdi = 0; bdi < combatState.activeBonds.length; bdi++) {
                var activeBond = combatState.activeBonds[bdi];
                var bb = activeBond.bonus;
                for (var bm = 0; bm < combatState.playerUnits.length; bm++) {
                    var pUnit = combatState.playerUnits[bm];
                    if (activeBond.units.indexOf(pUnit.templateKey) < 0) continue;
                    if (bb.atkPct) pUnit.attack = Math.floor(pUnit.attack * (1 + bb.atkPct));
                    if (bb.hpPct) { var bondHpAdd = Math.floor(pUnit.maxHp * bb.hpPct); pUnit.hp += bondHpAdd; pUnit.maxHp += bondHpAdd; }
                    if (bb.atkSpdPct) pUnit.attackSpd = pUnit.attackSpd / (1 + bb.atkSpdPct);
                    if (bb.critChance) pUnit.critChance = (pUnit.critChance || 0) + bb.critChance;
                    if (bb.drPct) pUnit.damageReduction = (pUnit.damageReduction || 0) + bb.drPct;
                    if (bb.allStatsPct) {
                        pUnit.attack = Math.floor(pUnit.attack * (1 + bb.allStatsPct));
                        var bondAllStatsHpAdd = Math.floor(pUnit.maxHp * bb.allStatsPct);
                        pUnit.hp += bondAllStatsHpAdd; pUnit.maxHp += bondAllStatsHpAdd;
                    }
                    if (bb.moveSpdPct) pUnit.moveSpd = (pUnit.moveSpd || 0) * (1 + bb.moveSpdPct);
                    // manaGenPct/abilityDmgPct/healPowerPct: accumulator fields consumed at
                    // their existing per-hit/per-attack sites (combat-core.js mana-gain,
                    // combat-abilities.js ability damage, combat-damage.js dealHealing).
                    if (bb.manaGenPct) pUnit.bondManaGenMult = (pUnit.bondManaGenMult || 1) + bb.manaGenPct;
                    if (bb.abilityDmgPct) pUnit.bondAbilityDmgMult = (pUnit.bondAbilityDmgMult || 1) + bb.abilityDmgPct;
                    if (bb.healPowerPct) pUnit._bondHealPowerBonus = (pUnit._bondHealPowerBonus || 0) + bb.healPowerPct;
                    // archetypeCountBonus (legendary_convergence trio only): no combat
                    // synergy consumer exists for this -- true both before and after this
                    // unification (the old bond.effect path never read it either). Not
                    // wired here; flagged in the Prompt 62 report as a pre-existing gap.
                }
            }
        }
    }

    // Prompt 62: combat-driven achievement stat wiring (rest of PHASE2-AUDIT
    // item 5) -- bossesDefeated, deathlessBossClears, maxSingleHit, fastestWin
    // (kept as a minimum via trackStat's 'min' mode), maxElementSynergy.
    // Listeners are registered here (fresh every wave, since combatEvents.reset()
    // ran at the top of this function) and write back to saveData on combatEnd.
    // "Combat" = "this wave" throughout, matching the Prompt 60 convention
    // documented above initCombat(): boss stages have exactly one wave, so
    // bossesDefeated/deathlessBossClears/fastestWin are mission-equivalent for
    // the case that actually matters (boss clears); for multi-wave non-boss
    // stages fastestWin/maxSingleHit reflect the fastest/hardest single wave.
    if (sd && typeof combatEvents !== 'undefined' && typeof trackStat === 'function') {
        var achWaveDeaths = 0;
        var achPeakHit = 0;
        combatEvents.on('unitDamaged', function(dmgPayload) {
            if (dmgPayload.amount > achPeakHit) achPeakHit = dmgPayload.amount;
        });
        combatEvents.on('unitKilled', function(killPayload) {
            if (killPayload.victim && killPayload.victim.side === 'player') achWaveDeaths++;
        });
        combatEvents.on('combatStart', function() {
            if (!combatState || !combatState.activeElements) return;
            var synKeys = Object.keys(combatState.activeElements);
            var maxSynCount = 0;
            for (var sk2 = 0; sk2 < synKeys.length; sk2++) {
                if (combatState.activeElements[synKeys[sk2]] > maxSynCount) maxSynCount = combatState.activeElements[synKeys[sk2]];
            }
            if (maxSynCount > 0) trackStat(sd, 'maxElementSynergy', maxSynCount, 'max');
        });
        combatEvents.on('combatEnd', function(endPayload) {
            if (achPeakHit > 0) trackStat(sd, 'maxSingleHit', achPeakHit, 'max');
            if (endPayload.result === 'win') {
                trackStat(sd, 'fastestWin', combatState.elapsed, 'min');
                if (combatState.bossUnit) {
                    trackStat(sd, 'bossesDefeated', 1, 'add');
                    if (achWaveDeaths === 0) trackStat(sd, 'deathlessBossClears', 1, 'add');
                }
            }
        });
    }

    // Initialize passive states and fire combat_start passives
    for (var pi = 0; pi < combatState.allUnits.length; pi++) {
        initUnitPassiveState(combatState.allUnits[pi]);
    }
    processCombatStartPassives(combatState.allUnits);

    // Prompt 60: fire combatStart/waveStart for hero skill listeners now that
    // every unit/hero/item/synergy bonus for this wave is fully applied.
    if (typeof combatEvents !== 'undefined') {
        var evtPayload = { playerUnits: combatState.playerUnits, enemyUnits: combatState.enemyUnits };
        combatEvents.emit('combatStart', evtPayload);
        combatEvents.emit('waveStart', {
            playerUnits: combatState.playerUnits,
            enemyUnits: combatState.enemyUnits,
            waveIndex: (typeof currentWaveIndex !== 'undefined' ? currentWaveIndex : 0)
        });
    }
}

// =============================================================================
// BUGS.md #8 fix (Prompt 66): shared init for any unit spawned MID-COMBAT --
// i.e. AFTER initCombat()'s own two allUnits loops above have already run
// once for everyone present at combat start. Those loops give every starting
// unit its runtime combat state: mana ("Mana initialization"), status/CC
// arrays and combatStats ("Initialize combatStats" / "Initialize movement
// cooldowns..."), and -- via the separate loop right before combatStart
// fires -- initUnitPassiveState(). A unit created after that point (boss
// minions in combat-boss.js's processBossMinions(), reinforcement-pressure
// adds in combat-encounters.js's tickReinforcementPressure(), or any future
// spawner) never goes through either loop unless the spawner replicates it
// by hand -- which is exactly how BUGS #8 happened: processBossMinions()
// hand-copied the mana/status/combatStats fields but not
// initUnitPassiveState(), so a spawned flame_warrior minion's on-attack
// passive threw "Cannot read properties of undefined (reading
// 'attackCount')" (combat-passives.js's executeOnAttackPassive reads
// unit.passiveState unconditionally) the instant it landed an attack.
// Routing every spawn path through this one function means that class of
// bug can't recur piecemeal per-spawner again.
function initSpawnedCombatUnitState(unit, side, row, col) {
    unit.side = side;
    if (row !== undefined) unit.gridRow = row;
    if (col !== undefined) unit.gridCol = col;
    if (unit.hp === undefined || unit.hp === null) unit.hp = unit.maxHp;
    unit.shield = unit.shield || 0;

    // Mana (mirrors initCombat()'s "Mana initialization" allUnits loop).
    var spawnTmpl = (typeof UNIT_TEMPLATES !== 'undefined' && UNIT_TEMPLATES[unit.templateKey || unit.key]) ||
        (typeof EVOLVED_TEMPLATES !== 'undefined' && EVOLVED_TEMPLATES[unit.templateKey || unit.key]);
    unit.maxMana = spawnTmpl ? (spawnTmpl.maxMana || 0) : 0;
    unit.currentMana = 0;
    unit.isCasting = false;
    unit.castTimer = 0;
    unit.abilityBuffs = {};
    unit.statusEffects = [];

    // Combat stat tracking + CC/movement bookkeeping (mirrors initCombat()'s
    // "Initialize combatStats" / "Initialize movement cooldowns..." loops).
    unit.combatStats = { damageDealt: 0, damageTaken: 0, healingDone: 0, shieldGiven: 0, kills: 0, abilityCasts: 0 };
    unit.ccHistory = [];
    unit.ccImmuneUntil = 0;
    unit.tenacity = 0;
    unit.moveCooldown = 0;
    unit.attackCooldown = 0;

    // Hero fields default-safe: every read site checks unit._heroKey
    // truthiness before touching _heroData (see heroes.js), so a spawned
    // unit that never gets a hero assigned is already safe left unset --
    // explicit null here so that contract doesn't rely on omission.
    unit._heroKey = null;
    unit._heroData = null;

    // The actual BUGS #8 fix: give the spawned unit a passive framework
    // state so on-attack/on-hit/on-kill/periodic/aura passives on its
    // template don't throw the instant they fire.
    if (typeof initUnitPassiveState === 'function') initUnitPassiveState(unit);

    return unit;
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

function combatTick(dt) {
    if (!combatState || !combatState.running) return;

    combatState.elapsed += dt;

    // Prompt 60: per-tick hook for hero skill nodes (ramping/decaying bonuses).
    if (typeof combatEvents !== 'undefined') combatEvents.emit('tick', { dt: dt });

    // Timeout: 180s for boss fights, 60s for normal
    var timeLimit = combatState.bossUnit ? 180 : 60;
    if (combatState.elapsed > timeLimit) {
        combatState.running = false;
        combatState.result = 'draw';
        if (typeof combatEvents !== 'undefined') combatEvents.emit('combatEnd', { result: 'draw' });
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
        if (typeof combatEvents !== 'undefined') combatEvents.emit('combatEnd', { result: 'win' });
        return;
    }
    // Boss win condition: boss dead = win even if minions alive
    if (combatState.bossUnit && combatState.bossUnit.hp <= 0) {
        combatState.running = false;
        combatState.result = 'win';
        if (typeof combatEvents !== 'undefined') combatEvents.emit('combatEnd', { result: 'win' });
        return;
    }
    if (playersAlive === 0) {
        combatState.running = false;
        combatState.result = 'loss';
        if (typeof combatEvents !== 'undefined') combatEvents.emit('combatEnd', { result: 'loss' });
        return;
    }

    // Prompt 62: encounter mechanics (countdown timer/wipe, reinforcement
    // spawns, protect-objective failure check, escalating stacks, VIP regen).
    // No-op when the stage has no encounterMechanic set.
    if (typeof tickCombatEncounterMechanics === 'function') {
        tickCombatEncounterMechanics(combatState, dt);
        if (!combatState.running) return; // a mechanic (countdown wipe / objective death) ended combat this tick
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

    // --- Synergy per-second effects (Duelist ramping ATK, Sage passive mana) ---
    for (var syn = 0; syn < players.length; syn++) {
        var su = players[syn];
        if (su.hp <= 0) continue;
        // Duelist ramping ATK per second
        if (su.rampingAtkPctPerSec && su.rampingAtkCap !== undefined) {
            if (!su._baseAttack) su._baseAttack = su.attack;
            var newAccum = Math.min(su.rampingAtkAccumulated + su.rampingAtkPctPerSec * dt, su.rampingAtkCap);
            su.rampingAtkAccumulated = newAccum;
            su.attack = Math.floor(su._baseAttack * (1 + newAccum));
        }
        // Sage passive mana per second
        if (su.passiveManaPerSec && su.maxMana > 0) {
            su.currentMana = Math.min(su.maxMana, su.currentMana + su.passiveManaPerSec * dt);
        }
        // Prompt 60 hero node maren_B_1_2 "Mana Flow" (converted dead flag)
        if (su.heroSkillBonuses && su.heroSkillBonuses.manaPerSec && su.maxMana > 0) {
            su.currentMana = Math.min(su.maxMana, su.currentMana + su.heroSkillBonuses.manaPerSec * dt);
        }
        // Prompt 60: pending mana refund from hero nodes that can't apply
        // mana precisely at cast-completion (see voss_B_4_2 in heroes.js)
        if (su._heroPendingManaRefund && !su.isCasting && su.maxMana > 0) {
            su.currentMana = Math.min(su.maxMana, su.currentMana + Math.floor(su.maxMana * su._heroPendingManaRefund));
            su._heroPendingManaRefund = 0;
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

        // Decrement stasis timer for ALL units (burrow, stealth, etc.)
        if (unit.stasis && unit.stasis > 0 && !unit.isBoss) {
            unit.stasis -= dt;
            if (unit.stasis <= 0) unit.stasis = 0;
        }

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
                // Sorcerer first-cast double damage: temporarily double abilityDmgBonus
                var origAbilityDmg = unit.abilityDmgBonus || 0;
                if (unit.firstCastDoubleDamage && !unit._firstCastDone) {
                    unit.abilityDmgBonus = (unit.abilityDmgBonus || 0) + 1.0; // +100% = double
                }
                executeAbility(unit);
                // Restore abilityDmgBonus after first-cast double
                if (unit.firstCastDoubleDamage && !unit._firstCastDone) {
                    unit.abilityDmgBonus = origAbilityDmg;
                }
                // Sorcerer mana refund
                var manaRefund = 0;
                if (unit.abilityManaRefund) {
                    manaRefund = Math.floor(unit.maxMana * unit.abilityManaRefund);
                }
                unit.currentMana = manaRefund;
                unit.isCasting = false;
                unit._firstCastDone = true;
                unit.attackCooldown = unit.attackSpd || 1.0;
                // Post-cast passive effects (gale_dancer, stormweaver)
                if (unit.passiveState && unit.passiveState.customData.postCastMoveSpeed) {
                    addStatus(unit, 'moveSpeedBuff', unit.passiveState.customData.postCastDuration || 3, unit.passiveState.customData.postCastMoveSpeed, unit);
                }
                if (unit.passiveState && unit.passiveState.customData.postCastAtkSpeed) {
                    addStatus(unit, 'spdMod', unit.passiveState.customData.postCastDuration || 3, unit.passiveState.customData.postCastAtkSpeed, unit);
                }
                // Sorcerer post-cast ATK speed buff (Arcane Surge)
                if (unit.postCastAtkSpdBuff) {
                    addStatus(unit, 'spdMod', unit.postCastAtkSpdDuration || 3, unit.postCastAtkSpdBuff, unit);
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

            // Mana generation on auto-attack (with Mana Shrine bonus)
            if (unit.maxMana > 0) {
                var manaGain = 10;
                if (unit.manaShrine && unit.manaShrine.manaGenMult) manaGain = Math.floor(manaGain * unit.manaShrine.manaGenMult);
                // Prompt 62: bond mana generation bonus (conductor -- manaGenPct)
                if (unit.bondManaGenMult && unit.bondManaGenMult > 1) manaGain = Math.floor(manaGain * unit.bondManaGenMult);
                unit.currentMana = Math.min(unit.maxMana, unit.currentMana + manaGain);
            }

            // Mana Shrine: first cast discount (reduce effective max mana for first cast)
            var effectiveMaxMana = unit.maxMana;
            if (unit.manaShrine && unit.manaShrine.firstCastDiscount > 0 && !unit._firstCastDone) {
                effectiveMaxMana = Math.floor(unit.maxMana * (1 - unit.manaShrine.firstCastDiscount));
            }
            // Prompt 60 hero node sera_B_1_2 "Mana Efficiency" (converted dead flag):
            // abilities cost X% less mana -> lower the effective mana threshold to cast.
            if (unit.heroSkillBonuses && unit.heroSkillBonuses.manaCostReduction) {
                effectiveMaxMana = Math.floor(effectiveMaxMana * (1 - unit.heroSkillBonuses.manaCostReduction));
            }
            // Mana Shrine: full mana ATK bonus
            if (unit.manaShrine && unit.manaShrine.fullManaAtkBonus > 0 && unit.currentMana >= effectiveMaxMana && !unit._fullManaAtkApplied) {
                unit.attack = Math.floor(unit.attack * (1 + unit.manaShrine.fullManaAtkBonus));
                unit._fullManaAtkApplied = true;
            }
            // Check if mana is full → start casting (blocked by silence)
            if (unit.maxMana > 0 && unit.currentMana >= effectiveMaxMana && !unit.isCasting) {
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
    var base;
    if (unit.moveSpd !== undefined) base = unit.moveSpd;
    else if (unit.type === 'assassin') base = 3.3;
    else if (unit.type === 'tank') base = 1.7;
    else base = 2.0;
    // Prompt 60 hero nodes (Voss Unstoppable Advance / Killing Spree): flat
    // move speed % bonus, undefined/0 for all non-hero units.
    if (unit._heroMoveSpeedBonus) base = base * (1 + unit._heroMoveSpeedBonus);
    return base;
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

    // BUGS.md #4 fix: real in-combat archetype counting must be ascension-aware,
    // matching the UI preview paths (ui-builder.js:590-592, ui-combat.js:1288-1289,
    // teams.js:261-264) that already call getUnitArchetypeContribution()
    // (units-ascension.js:150). A Transcendent unit's primary archetype counts
    // as 2; an Awakened+ unit also contributes its secondary archetype.
    var sd = typeof getSaveData === 'function' ? getSaveData() : null;

    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 7; c++) {
            var u = gs.board[r][c];
            if (!u || u.hp <= 0) continue;
            // Evolved T5 units count as 2 for element synergies
            var isEvolvedT5 = u.cost === 5 && u.evolved;
            var elementCount = isEvolvedT5 ? 2 : 1;

            if (typeof getUnitArchetypeContribution === 'function') {
                var contrib = getUnitArchetypeContribution(u);
                if (contrib.primary) {
                    archCounts[contrib.primary] = (archCounts[contrib.primary] || 0) + contrib.primaryCount;
                }
                if (contrib.secondary) {
                    archCounts[contrib.secondary] = (archCounts[contrib.secondary] || 0) + contrib.secondaryCount;
                }
            } else if (u.archetype) {
                archCounts[u.archetype] = (archCounts[u.archetype] || 0) + 1;
            }

            // Prompt 60 hero node lyric_B_2_2 "Synergy Amplifier": the unit
            // counts as +1 extra toward its own primary archetype synergy.
            // Must be resolved here (not via unit.heroSkillBonuses, which is
            // only populated later in initCombat) since real-combat synergy
            // counting runs before hero bonuses are applied.
            if (sd && u.key && u.archetype && typeof getHeroForUnit === 'function') {
                var heroInfo = getHeroForUnit(sd, u.key);
                if (heroInfo && !heroInfo.data.isDead && heroInfo.data.investedNodes &&
                    heroInfo.data.investedNodes.indexOf('lyric_B_2_2') >= 0) {
                    archCounts[u.archetype] = (archCounts[u.archetype] || 0) + 1;
                }
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
    // Apply archetype bonuses to units that have the archetype (primary or secondary)
    var archKeys = Object.keys(ARCHETYPES);
    for (var i = 0; i < archKeys.length; i++) {
        var archKey = archKeys[i];
        var arch = ARCHETYPES[archKey];
        if (!arch) continue;

        var count = synergies[archKey] || 0;
        var tierReached = -1;
        for (var t = 0; t < arch.thresholds.length; t++) {
            if (count >= arch.thresholds[t]) tierReached = t;
        }
        if (tierReached < 0) continue;
        var bonus = arch.bonuses[tierReached];
        if (!bonus) continue;

        for (var u = 0; u < units.length; u++) {
            var unit = units[u];
            if (!unitHasArchetype(unit, archKey)) continue;

            // Guardian: HP + DR + start shield + last stand
            if (archKey === 'guardian') {
                if (bonus.hpBonus) { unit.maxHp += bonus.hpBonus; unit.hp += bonus.hpBonus; }
                if (bonus.damageReduction) unit.damageReduction = (unit.damageReduction || 0) + bonus.damageReduction;
                if (bonus.startShieldPct) unit.shield = (unit.shield || 0) + Math.floor(unit.maxHp * bonus.startShieldPct);
                if (bonus.shieldBreakTenacity) { unit.shieldBreakTenacity = bonus.shieldBreakTenacity; unit.shieldBreakTenacityDuration = bonus.shieldBreakTenacityDuration; }
                if (bonus.lastStandThreshold) { unit.lastStandThreshold = bonus.lastStandThreshold; unit.lastStandInvulnDuration = bonus.lastStandInvulnDuration; unit.lastStandTaunt = bonus.lastStandTaunt; }
            }

            // Warden: CC duration + tenacity + CC immunity + CC effects
            if (archKey === 'warden') {
                if (bonus.ccDurationBonus) unit.ccDurationBonus = (unit.ccDurationBonus || 0) + bonus.ccDurationBonus;
                if (bonus.tenacity) unit.tenacity = (unit.tenacity || 0) + bonus.tenacity;
                if (bonus.wardenFirstCcImmune) unit.wardenFirstCcImmune = true;
                if (bonus.wardenCcImmune) unit.wardenCcImmune = true;
                if (bonus.ccAppliesAtkSpdSlow) { unit.ccAppliesAtkSpdSlow = bonus.ccAppliesAtkSpdSlow; unit.ccAtkSpdSlowDuration = bonus.ccAtkSpdSlowDuration; }
                if (bonus.ccSpreadRoot) { unit.ccSpreadRoot = true; unit.ccSpreadRadius = bonus.ccSpreadRadius; unit.ccSpreadDuration = bonus.ccSpreadDuration; }
            }

            // Vanguard: HP + ATK (with front-row multiplier) + charge + lifesteal + slow immune
            if (archKey === 'vanguard') {
                var isFrontRow = unit.gridRow >= 6;
                var mult = (isFrontRow && bonus.frontRowMultiplier) ? bonus.frontRowMultiplier : 1;
                if (bonus.hpBonus) { var hpAdd = bonus.hpBonus * mult; unit.maxHp += hpAdd; unit.hp += hpAdd; }
                if (bonus.atkBonus) unit.attack += bonus.atkBonus * mult;
                if (bonus.lifestealPct) unit.lifesteal = (unit.lifesteal || 0) + bonus.lifestealPct;
                if (bonus.chargeDmgBonus) { unit.chargeDmgBonus = bonus.chargeDmgBonus; unit.chargeDuration = bonus.chargeDuration; }
                if (bonus.chargeStunDuration) unit.chargeStunDuration = bonus.chargeStunDuration;
                if (bonus.slowImmune) unit.slowImmune = true;
            }

            // Duelist: Double-strike + lifesteal + can't miss + crit every N + ramping ATK
            if (archKey === 'duelist') {
                if (bonus.doubleStrikeChance) unit.doubleStrikeChance = bonus.doubleStrikeChance;
                if (bonus.lifestealPct) unit.lifesteal = (unit.lifesteal || 0) + bonus.lifestealPct;
                if (bonus.cantMissAttacks) unit.cantMissAttacks = true;
                if (bonus.guaranteedCritEveryN) { unit.guaranteedCritEveryN = bonus.guaranteedCritEveryN; unit.attackCounter = 0; }
                if (bonus.rampingAtkPctPerSec) { unit.rampingAtkPctPerSec = bonus.rampingAtkPctPerSec; unit.rampingAtkCap = bonus.rampingAtkCap; unit.rampingAtkAccumulated = 0; }
            }

            // Predator: ATK speed + execute damage + on-kill effects
            if (archKey === 'predator') {
                if (bonus.atkSpdBoost) unit.attackSpd = unit.attackSpd / (1 + bonus.atkSpdBoost);
                if (bonus.executeDamageBonus) unit.executeDamageBonus = bonus.executeDamageBonus;
                if (bonus.executeThreshold) unit.executeThreshold = bonus.executeThreshold;
                if (bonus.dashResetOnKill) unit.dashResetOnKill = true;
                if (bonus.onKillAtkBuff) { unit.onKillAtkBuff = bonus.onKillAtkBuff; unit.onKillAtkBuffDuration = bonus.onKillAtkBuffDuration; }
                if (bonus.onKillManaRefundPct) unit.onKillManaRefundPct = bonus.onKillManaRefundPct;
            }

            // Ranger: Range + furthest damage + pierce + focused shot + mark
            if (archKey === 'ranger') {
                if (bonus.rangeBonus) unit.range += bonus.rangeBonus;
                if (bonus.furthestDmgBonus) unit.furthestDmgBonus = bonus.furthestDmgBonus;
                if (bonus.atkSpdBoost) unit.attackSpd = unit.attackSpd / (1 + bonus.atkSpdBoost);
                if (bonus.pierceCount) unit.pierceCount = bonus.pierceCount;
                if (bonus.pierceAll) unit.pierceAll = true;
                if (bonus.focusedShotEveryN) { unit.focusedShotEveryN = bonus.focusedShotEveryN; unit.focusedShotIgnoreDR = bonus.focusedShotIgnoreDR; unit.attackCounter = unit.attackCounter || 0; }
                if (bonus.markTargetDmgAmp) unit.markTargetDmgAmp = bonus.markTargetDmgAmp;
            }

            // Sorcerer: Ability damage + starting mana + mana refund + spell pen + post-cast + first cast x2
            if (archKey === 'sorcerer') {
                if (bonus.abilityDmgBonus) unit.abilityDmgBonus = (unit.abilityDmgBonus || 0) + bonus.abilityDmgBonus;
                if (bonus.startingManaBonus) unit.currentMana = (unit.currentMana || 0) + bonus.startingManaBonus;
                if (bonus.abilityManaRefund) unit.abilityManaRefund = bonus.abilityManaRefund;
                if (bonus.spellPenetration) unit.spellPenetration = bonus.spellPenetration;
                if (bonus.postCastAtkSpdBuff) { unit.postCastAtkSpdBuff = bonus.postCastAtkSpdBuff; unit.postCastAtkSpdDuration = bonus.postCastAtkSpdDuration; }
                if (bonus.firstCastDoubleDamage) unit.firstCastDoubleDamage = true;
            }

            // Mystic: Element resist + status duration + resist shred + ability per element + random proc
            if (archKey === 'mystic') {
                if (bonus.elemResist) unit.elemResist = (unit.elemResist || 0) + bonus.elemResist;
                if (bonus.elemStatusDurationBonus) unit.elemStatusDurationBonus = (unit.elemStatusDurationBonus || 0) + bonus.elemStatusDurationBonus;
                if (bonus.elemResistShred) { unit.elemResistShred = bonus.elemResistShred; unit.elemResistShredDuration = bonus.elemResistShredDuration; }
                if (bonus.abilityDmgPerElement) unit.abilityDmgPerElement = bonus.abilityDmgPerElement;
                if (bonus.randomElementProcChance) { unit.randomElementProcChance = bonus.randomElementProcChance; unit.randomElementProcDuration = bonus.randomElementProcDuration; }
            }

            // Sage: Healing bonus + heal shield + passive mana + overheal + death save
            if (archKey === 'sage') {
                if (bonus.healBonus) unit.healBonus = (unit.healBonus || 0) + bonus.healBonus;
                if (bonus.healShieldPct) { unit.healShieldPct = bonus.healShieldPct; unit.healShieldDuration = bonus.healShieldDuration; }
                if (bonus.passiveManaPerSec) unit.passiveManaPerSec = bonus.passiveManaPerSec;
                if (bonus.overhealToShieldPct) unit.overhealToShieldPct = bonus.overhealToShieldPct;
                if (bonus.deathSaveOnce) unit.deathSaveOnce = true;
            }
        }
    }

    // Mystic abilityDmgPerElement: count unique elements on team and apply bonus
    var uniqueElements = {};
    for (var ei = 0; ei < units.length; ei++) {
        if (units[ei].element) uniqueElements[units[ei].element] = true;
    }
    var uniqueElemCount = Object.keys(uniqueElements).length;
    for (var mi = 0; mi < units.length; mi++) {
        if (units[mi].abilityDmgPerElement && uniqueElemCount > 0) {
            units[mi].abilityDmgBonus = (units[mi].abilityDmgBonus || 0) + units[mi].abilityDmgPerElement * uniqueElemCount;
        }
    }

    // Sage deathSaveOnce: find the strongest Sage and mark them as the death saver
    var strongestSage = null;
    var strongestSageAtk = -1;
    for (var si = 0; si < units.length; si++) {
        if (units[si].deathSaveOnce && units[si].attack > strongestSageAtk) {
            strongestSageAtk = units[si].attack;
            strongestSage = units[si];
        }
    }
    if (strongestSage) {
        strongestSage.isDeathSaver = true;
        strongestSage.deathSaveHealPct = 0.25;
    }
}

// =============================================================================
// Prompt 67: renderer event-emitting shims.
//
// Before this refactor these three functions WERE the DOM-drawing code
// (defined in ui-combat.js) and every combat-*.js call site invoked them
// directly -- logic reaching straight into the DOM. They now live here in
// the logic layer as thin combatEvents emitters with the exact same names
// and call signatures, so every existing call site throughout combat-
// abilities.js / combat-legendary.js / combat-damage.js / combat-status.js /
// combat-boss.js / combat-encounters.js needed ZERO changes. The real DOM
// implementations moved to js/render-dom.js under different internal names
// (domSpawnDamageNumber / domFlashAbilityCells) and are wired up as
// combatEvents listeners by the DOM renderer's init() -- see RENDER_DOM in
// render-dom.js. addLogEntry (the #combat-log DOM writer) stays in
// ui-combat.js as screen chrome; it now runs off a 'logMessage' listener
// instead of being called directly from here.
//
// combatEvents.emit() is a no-op when nothing is listening (see
// combat-events.js), so this is exactly as headless-safe as the old
// `typeof spawnDamageNumber === 'function'` guards the call sites used to
// carry -- no renderer needs to be registered for combat to run.
// =============================================================================

function spawnDamageNumber(row, col, text, type) {
    if (combatState && combatState.autoBattle) return;
    if (typeof combatEvents !== 'undefined') {
        combatEvents.emit('floatingText', { row: row, col: col, text: text, type: type });
    }
}

function flashAbilityCells(cells, color, duration) {
    if (combatState && combatState.autoBattle) return;
    if (typeof combatEvents !== 'undefined') {
        combatEvents.emit('abilityFlash', { cells: cells, color: color, duration: duration });
    }
}

// Bridge for combat.js log
function addCombatLog(msg) {
    if (typeof combatEvents !== 'undefined') {
        combatEvents.emit('logMessage', { text: msg, cls: 'combat' });
    }
}

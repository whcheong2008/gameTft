// =============================================================================
// heroes.js — Hero system: 6 philosophy-based heroes with skill trees
// =============================================================================

var HERO_LEVEL_CAP = 20;

// ---- Hero Definitions ----

var HERO_DATA = {
    kael: {
        name: 'Kael',
        quote: 'No one falls while I stand.',
        philosophy: 'Protection',
        description: 'Rewards keeping your team alive. Bonuses trigger on ally survival, protecting others, team at full strength. Penalizes ally deaths.',
        availability: {
            acquiredRegion: 1,
            lostRegion: null,
            lostStage: null
        },
        branches: {
            A: {
                name: "Guardian's Oath",
                description: 'Personal protection of others'
            },
            B: {
                name: "Commander's Presence",
                description: 'Team-wide aura based on ally survival'
            }
        }
    },
    lyric: {
        name: 'Lyric',
        quote: 'Maximum output, whatever the cost.',
        philosophy: 'Efficiency',
        description: 'Rewards aggressive efficiency — kills, speed, damage output. Strongest bonuses come at a cost: self-damage, HP sacrifice, risk.',
        availability: {
            acquiredRegion: 1,
            lostRegion: 4,
            lostStage: 'mid'
        },
        branches: {
            A: {
                name: 'Overcharge',
                description: 'Power at a cost'
            },
            B: {
                name: 'Calculated Efficiency',
                description: 'Rewards for fast kills'
            }
        }
    },
    ren: {
        name: 'Ren',
        quote: "I'm here. That's enough.",
        philosophy: 'Steadfast',
        description: 'Rewards endurance — staying alive, taking hits, not moving, being reliable. Bonuses scale with time alive and damage absorbed.',
        availability: {
            acquiredRegion: 2,
            lostRegion: null,
            lostStage: null
        },
        branches: {
            A: {
                name: 'Iron Endurance',
                description: 'Personal tankiness that scales with time'
            },
            B: {
                name: 'Silent Anchor',
                description: "Nearby allies benefit from Ren's presence"
            }
        }
    },
    sera: {
        name: 'Sera',
        quote: 'Hit the right target at the right time.',
        philosophy: 'Precision',
        description: 'Rewards smart targeting — damage against priority targets, burst windows, finishing blows. Bonuses trigger on hitting low-HP, ability crits, targeting "right" enemy.',
        availability: {
            acquiredRegion: 3,
            lostRegion: 4,
            lostStage: 'early',
            returnsRegion: 5,
            returnsStage: 'late'
        },
        branches: {
            A: {
                name: 'Execution',
                description: 'Burst damage on priority targets'
            },
            B: {
                name: 'Tactical Awareness',
                description: "Team benefits from Sera's precision"
            }
        }
    },
    maren: {
        name: 'Maren',
        quote: 'Everyone comes home.',
        philosophy: 'Sustain',
        description: 'Rewards sustain — healing, shielding, keeping team healthy. Amplifies healing/shielding, adds emergency saves, converts survival into power.',
        availability: {
            acquiredRegion: 3,
            lostRegion: 4,
            lostStage: 'early',
            returnsRegion: 5,
            returnsStage: 'early'
        },
        branches: {
            A: {
                name: 'Restoration',
                description: 'Raw healing amplification'
            },
            B: {
                name: 'Protective Warmth',
                description: 'Overheal and shield mechanics'
            }
        }
    },
    voss: {
        name: 'Voss',
        quote: 'Results. Now.',
        philosophy: 'Momentum',
        description: 'Rewards momentum — bonuses that ramp over time, snowball on kills, punish passivity. Early combat is ordinary; as fight drags on, becomes terrifying.',
        availability: {
            acquiredRegion: 7,
            lostRegion: null,
            lostStage: null
        },
        branches: {
            A: {
                name: 'Ramping Power',
                description: 'Bonuses that grow over time'
            },
            B: {
                name: 'Kill Cascade',
                description: 'Snowball on kills'
            }
        }
    }
};

// ---- Skill Tree Data ----
// Structure: HERO_SKILL_TREES[heroKey][branch][tier] = [ node1, node2 ]
// T5 (capstone) has only 1 node per branch

var HERO_SKILL_TREES = {
    // ========== KAEL ==========
    kael: {
        A: {
            1: [
                { id: 'kael_A_1_1', name: 'Shield Ally', tier: 1, branch: 'A', cost: 1, levelReq: 1,
                  effect: 'When an adjacent ally drops below 30% HP, grant them a shield equal to 8% of your max HP (once per ally per combat)',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var shielded = [];
                      combatEvents.on('unitDamaged', function(p) {
                          if (unit.hp <= 0 || !p.target || p.target === unit || p.target.side !== unit.side) return;
                          if (p.target.hp <= 0 || shielded.indexOf(p.target) >= 0) return;
                          if (!heroIsAdjacent(unit, p.target)) return;
                          if (p.target.hp / p.target.maxHp >= 0.30) return;
                          shielded.push(p.target);
                          grantShield(unit, p.target, Math.floor(unit.maxHp * 0.08));
                      });
                  } },
                { id: 'kael_A_1_2', name: 'Frontline Defender', tier: 1, branch: 'A', cost: 1, levelReq: 1,
                  effect: 'You gain +8% DR when at least 1 ally is behind you (further from enemy spawn)',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('tick', function() {
                          if (unit.hp <= 0) return;
                          var allies = heroSideAllies(unit);
                          var behind = false;
                          for (var i = 0; i < allies.length; i++) {
                              if (allies[i] !== unit && allies[i].hp > 0 && allies[i].gridRow > unit.gridRow) { behind = true; break; }
                          }
                          heroSetDrMod(unit, 'kael_A_1_2', behind ? 0.08 : 0);
                      });
                  } }
            ],
            2: [
                { id: 'kael_A_2_1', name: 'Retribution', tier: 2, branch: 'A', cost: 1, levelReq: 5,
                  effect: 'When an adjacent ally takes damage, your next attack deals +15% bonus damage',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('unitDamaged', function(p) {
                          if (unit.hp <= 0 || !p.target || p.target === unit || p.target.side !== unit.side) return;
                          if (p.target.hp <= 0 || !heroIsAdjacent(unit, p.target)) return;
                          unit._retributionBuff = true;
                      });
                  } },
                { id: 'kael_A_2_2', name: 'Hold the Line', tier: 2, branch: 'A', cost: 1, levelReq: 5,
                  effect: 'You gain +12% HP. Adjacent allies gain +6% HP',
                  apply: function(unit, hero) {
                      unit.maxHp = Math.floor(unit.maxHp * 1.12);
                      unit.hp = unit.maxHp;
                  } }
            ],
            3: [
                { id: 'kael_A_3_1', name: 'Reactive Shielding', tier: 3, branch: 'A', cost: 2, levelReq: 9,
                  effect: "When an ally is CC'd, they instantly gain a shield equal to 10% of your max HP",
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('ccApplied', function(p) {
                          if (unit.hp <= 0 || !p.target || p.target.side !== unit.side || p.target.hp <= 0) return;
                          grantShield(unit, p.target, Math.floor(unit.maxHp * 0.10));
                      });
                  } },
                { id: 'kael_A_3_2', name: 'Protective Stance', tier: 3, branch: 'A', cost: 2, levelReq: 9,
                  effect: 'You gain +8% DR. This increases to +15% DR when any adjacent ally is below 50% HP',
                  apply: function(unit, hero) {
                      unit.damageReduction = (unit.damageReduction || 0) + 0.08;
                  } }
            ],
            4: [
                { id: 'kael_A_4_1', name: 'Last Defender', tier: 4, branch: 'A', cost: 4, levelReq: 13,
                  effect: 'When you are the last surviving hero-equipped unit, gain +25% ATK and +18% DR for 8s',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('unitKilled', function(p) {
                          if (unit.hp <= 0 || !p.victim || p.victim.side !== unit.side) return;
                          var equipped = heroEquippedAllies(unit);
                          if (equipped.length === 1 && equipped[0] === unit) {
                              addStatus(unit, 'atkBuff', 8, 0.25, unit);
                              addStatus(unit, 'drMod', 8, 0.18, unit);
                          }
                      });
                  } },
                { id: 'kael_A_4_2', name: 'Coordinated Defense', tier: 4, branch: 'A', cost: 4, levelReq: 13,
                  effect: 'When you cast an ability, all adjacent allies gain +12% DR for 3s',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('abilityCast', function(p) {
                          if (unit.hp <= 0 || p.caster !== unit) return;
                          var adj = heroAdjacentAllies(unit);
                          for (var i = 0; i < adj.length; i++) addStatus(adj[i], 'drMod', 3, 0.12, unit);
                      });
                  } }
            ],
            5: [
                { id: 'kael_A_5_1', name: 'Unbreakable Oath', tier: 5, branch: 'A', cost: 5, levelReq: 17,
                  effect: 'Once per combat, when any hero-equipped ally would die, you absorb the killing blow instead (you take the damage, ally survives at 1 HP). You gain 50% DR for 3s after triggering',
                  apply: function(unit, hero) {},
                  // APPROXIMATED: the engine has no pre-death interception point,
                  // so this reimplements as a post-death revive + damage-redirect
                  // on unitKilled, matching the existing Phoenix/Guardian-Angel
                  // revive precedent already in js/combat-damage.js.
                  register: function(unit, hero) {
                      var used = false;
                      combatEvents.on('unitKilled', function(p) {
                          if (used || unit.hp <= 0) return;
                          if (!p.victim || p.victim === unit || p.victim.side !== unit.side || !p.victim._heroKey) return;
                          used = true;
                          p.victim.hp = 1;
                          p.victim.deathAnimating = false;
                          p.victim.deathComplete = false;
                          p.victim.deathTimer = 0;
                          p.victim.stasis = 0;
                          addCombatLog(unit.name + ' absorbs the killing blow for ' + p.victim.name + '!');
                          addStatus(unit, 'drMod', 3, 0.50, unit);
                          if (p.amount > 0) {
                              dealDamage(p.killer || unit, unit, p.amount, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
                          }
                      });
                  } }
            ]
        },
        B: {
            1: [
                { id: 'kael_B_1_1', name: 'Rallying Presence', tier: 1, branch: 'B', cost: 1, levelReq: 1,
                  effect: 'All hero-equipped allies gain +4% ATK and +4% HP',
                  apply: function(unit, hero) {
                      unit.attack = Math.floor(unit.attack * 1.04);
                      unit.maxHp = Math.floor(unit.maxHp * 1.04);
                      unit.hp = unit.maxHp;
                  } },
                { id: 'kael_B_1_2', name: 'Strength in Numbers', tier: 1, branch: 'B', cost: 1, levelReq: 1,
                  effect: 'All allies gain +2% ATK per surviving hero-equipped unit on the board (max +10% at 5 heroes)',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('combatStart', function(p) {
                          var count = 0;
                          for (var i = 0; i < p.playerUnits.length; i++) {
                              if (p.playerUnits[i].hp > 0 && p.playerUnits[i]._heroKey) count++;
                          }
                          var bonus = Math.min(0.02 * count, 0.10);
                          if (bonus <= 0) return;
                          for (var j = 0; j < p.playerUnits.length; j++) {
                              var u = p.playerUnits[j];
                              if (u.hp > 0) heroSetAtkMod(u, 'kael_B_1_2', bonus);
                          }
                      });
                  } }
            ],
            2: [
                { id: 'kael_B_2_1', name: 'Unified Defense', tier: 2, branch: 'B', cost: 1, levelReq: 5,
                  effect: 'All hero-equipped allies gain +5% CC resistance',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('combatStart', function() {
                          var equipped = heroEquippedAllies(unit);
                          for (var i = 0; i < equipped.length; i++) {
                              equipped[i].tenacity = (equipped[i].tenacity || 0) + 0.05;
                          }
                      });
                  } },
                { id: 'kael_B_2_2', name: 'Shared Resolve', tier: 2, branch: 'B', cost: 1, levelReq: 5,
                  effect: 'When any ally dies, all surviving hero-equipped allies gain +6% ATK for 8s (stacks)',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var expirations = [];
                      combatEvents.on('unitKilled', function(p) {
                          if (unit.hp <= 0 || !unit._heroKey || !p.victim || p.victim.side !== unit.side) return;
                          if (p.victim === unit) return;
                          expirations.push(combatState.elapsed + 8);
                      });
                      combatEvents.on('tick', function() {
                          if (expirations.length === 0) return;
                          var now = combatState.elapsed;
                          for (var i = expirations.length - 1; i >= 0; i--) {
                              if (expirations[i] <= now) expirations.splice(i, 1);
                          }
                          heroSetAtkMod(unit, 'kael_B_2_2', expirations.length * 0.06);
                      });
                  } }
            ],
            3: [
                { id: 'kael_B_3_1', name: 'Tactical Positioning', tier: 3, branch: 'B', cost: 2, levelReq: 9,
                  effect: 'You gain +12% ATK if in front row, +12% DR if in back row. Adjacent allies gain half this bonus',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('tick', function() {
                          if (unit.hp <= 0) return;
                          var front = unit.gridRow === 4;
                          var back = unit.gridRow === 7;
                          heroSetAtkMod(unit, 'kael_B_3_1', front ? 0.12 : 0);
                          heroSetDrMod(unit, 'kael_B_3_1', back ? 0.12 : 0);
                          var adj = heroAdjacentAllies(unit);
                          for (var i = 0; i < adj.length; i++) {
                              heroSetAtkMod(adj[i], 'kael_B_3_1_adj', front ? 0.06 : 0);
                              heroSetDrMod(adj[i], 'kael_B_3_1_adj', back ? 0.06 : 0);
                          }
                      });
                  } },
                { id: 'kael_B_3_2', name: 'Coordinated Strike', tier: 3, branch: 'B', cost: 2, levelReq: 9,
                  effect: 'When you attack a target, nearest hero-equipped ally targeting the same enemy gains +8% ATK',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('unitDamaged', function(p) {
                          if (unit.hp <= 0 || p.source !== unit || !p.target) return;
                          var candidates = heroEquippedAllies(unit).filter(function(u) { return u !== unit && u.target === p.target; });
                          var nearest = findNearestAlly(unit, candidates);
                          if (nearest) addStatus(nearest, 'atkBuff', 3, 0.08, unit);
                      });
                  } }
            ],
            4: [
                { id: 'kael_B_4_1', name: 'Stalwart Bond', tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'All allies within 2 cells gain +6% DR. When you take damage, this aura radius expands to 3 cells for 2s',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var expandUntil = 0;
                      combatEvents.on('unitDamaged', function(p) {
                          if (unit.hp <= 0 || p.target !== unit) return;
                          expandUntil = combatState.elapsed + 2;
                      });
                      combatEvents.on('tick', function() {
                          var radius = combatState.elapsed < expandUntil ? 3 : 2;
                          var inRange = heroAlliesInRadius(unit, radius, false);
                          var allies = heroSideAllies(unit).filter(function(u) { return u !== unit && u.hp > 0; });
                          for (var i = 0; i < allies.length; i++) {
                              heroSetDrMod(allies[i], 'kael_B_4_1', inRange.indexOf(allies[i]) >= 0 ? 0.06 : 0);
                          }
                      });
                  } },
                { id: 'kael_B_4_2', name: 'Inspiring Leader', tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'When you cast an ability, all hero-equipped allies gain +8% ATK and +6% ability damage for 4s',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('abilityCast', function(p) {
                          if (unit.hp <= 0 || p.caster !== unit) return;
                          var equipped = heroEquippedAllies(unit);
                          for (var i = 0; i < equipped.length; i++) {
                              addStatus(equipped[i], 'atkBuff', 4, 0.08, unit);
                              addStatus(equipped[i], 'heroAbilityDmgBuff', 4, 0.06, unit);
                          }
                      });
                  } }
            ],
            5: [
                { id: 'kael_B_5_1', name: 'Supreme Command', tier: 5, branch: 'B', cost: 5, levelReq: 17,
                  effect: 'Once per combat, activate to give all allies +18% ATK, +12% DR, and CC immunity for 4s',
                  apply: function(unit, hero) {},
                  // APPROXIMATED: no manual-activation UI exists yet, so this
                  // auto-triggers on the "ally below 30% HP" emergency
                  // condition (one of the derived conditions the prompt asks
                  // combat events to support), consistent with Kael's protector
                  // philosophy.
                  register: function(unit, hero) {
                      var used = false;
                      combatEvents.on('unitDamaged', function(p) {
                          if (used || unit.hp <= 0 || !p.target || p.target.side !== unit.side) return;
                          if (p.target.hp <= 0 || p.target.hp / p.target.maxHp >= 0.30) return;
                          used = true;
                          var allies = heroSideAllies(unit);
                          for (var i = 0; i < allies.length; i++) {
                              if (allies[i].hp <= 0) continue;
                              addStatus(allies[i], 'atkBuff', 4, 0.18, unit);
                              addStatus(allies[i], 'drMod', 4, 0.12, unit);
                              allies[i].ccImmuneUntil = Math.max(allies[i].ccImmuneUntil || 0, combatState.elapsed + 4);
                          }
                          addCombatLog(unit.name + ' activates Supreme Command!');
                      });
                  } }
            ]
        }
    },

    // ========== LYRIC ==========
    lyric: {
        A: {
            1: [
                { id: 'lyric_A_1_1', name: 'Power Surge', tier: 1, branch: 'A', cost: 1, levelReq: 1,
                  effect: 'You gain +10% ATK but take 2% max HP as self-damage every 5s',
                  apply: function(unit, hero) {
                      unit.attack = Math.floor(unit.attack * 1.10);
                  } },
                { id: 'lyric_A_1_2', name: 'Mana Overflow', tier: 1, branch: 'A', cost: 1, levelReq: 1,
                  effect: 'You start combat with +30 mana',
                  apply: function(unit, hero) {
                      unit.currentMana = (unit.currentMana || 0) + 30;
                  } }
            ],
            2: [
                { id: 'lyric_A_2_1', name: 'Reckless Force', tier: 2, branch: 'A', cost: 1, levelReq: 5,
                  effect: 'You gain +18% ability damage. Abilities cost 5% max HP in addition to mana',
                  apply: function(unit, hero) {
                      unit.abilityDmgBonus = (unit.abilityDmgBonus || 0) + 0.18;
                  } },
                { id: 'lyric_A_2_2', name: 'Sacrifice Engine', tier: 2, branch: 'A', cost: 1, levelReq: 5,
                  effect: 'When you drop below 50% HP, gain +22% ATK for the rest of combat',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var used = false;
                      combatEvents.on('unitDamaged', function(p) {
                          if (used || unit.hp <= 0 || p.target !== unit) return;
                          if (unit.hp / unit.maxHp >= 0.50) return;
                          used = true;
                          heroSetAtkMod(unit, 'lyric_A_2_2', 0.22);
                      });
                  } }
            ],
            3: [
                { id: 'lyric_A_3_1', name: 'Critical Mass', tier: 3, branch: 'A', cost: 2, levelReq: 9,
                  effect: 'You gain +12% crit chance. Crits deal self-damage equal to 3% max HP',
                  apply: function(unit, hero) {
                      unit.critChance = (unit.critChance || 0) + 0.12;
                  } },
                { id: 'lyric_A_3_2', name: 'Accelerated Casting', tier: 3, branch: 'A', cost: 2, levelReq: 9,
                  effect: 'You gain +15% attack speed. Your ability cooldown is 12% shorter',
                  apply: function(unit, hero) {
                      unit.attackSpd = unit.attackSpd * (1 - 0.15);
                  } }
            ],
            4: [
                { id: 'lyric_A_4_1', name: 'Overload', tier: 4, branch: 'A', cost: 4, levelReq: 13,
                  effect: 'You gain +20% damage dealt. You also take +15% damage from all sources',
                  apply: function(unit, hero) {
                      if (!unit.heroSkillBonuses) unit.heroSkillBonuses = {};
                      unit.heroSkillBonuses.overloadDmgBonus = 0.20;
                      unit.heroSkillBonuses.overloadDmgTaken = 0.15;
                  } },
                { id: 'lyric_A_4_2', name: 'Endgame Engine', tier: 4, branch: 'A', cost: 4, levelReq: 13,
                  effect: 'When you score a kill, instantly restore 25% HP and 40% mana',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('unitKilled', function(p) {
                          if (unit.hp <= 0 || p.killer !== unit) return;
                          dealHealing(unit, unit, Math.floor(unit.maxHp * 0.25));
                          if (unit.maxMana > 0) unit.currentMana = Math.min(unit.maxMana, unit.currentMana + Math.floor(unit.maxMana * 0.40));
                      });
                  } }
            ],
            5: [
                { id: 'lyric_A_5_1', name: 'Unleashed Potential', tier: 5, branch: 'A', cost: 5, levelReq: 17,
                  effect: 'You gain +28% ATK permanently. On death, explode for 350% ATK to all enemies within 2 cells',
                  apply: function(unit, hero) {
                      unit.attack = Math.floor(unit.attack * 1.28);
                  } }
            ]
        },
        B: {
            1: [
                { id: 'lyric_B_1_1', name: 'Quick Kill', tier: 1, branch: 'B', cost: 1, levelReq: 1,
                  effect: 'On kill, you gain +12% ATK speed for 4s',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var expire = 0;
                      combatEvents.on('unitKilled', function(p) {
                          if (unit.hp <= 0 || p.killer !== unit) return;
                          expire = combatState.elapsed + 4;
                      });
                      combatEvents.on('tick', function() {
                          heroSetAtkSpdMod(unit, 'lyric_B_1_1', combatState.elapsed < expire ? 0.12 : 0);
                      });
                  } },
                { id: 'lyric_B_1_2', name: 'Resource Extraction', tier: 1, branch: 'B', cost: 1, levelReq: 1,
                  effect: 'On kill, restore 18% max mana',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('unitKilled', function(p) {
                          if (unit.hp <= 0 || p.killer !== unit || unit.maxMana <= 0) return;
                          unit.currentMana = Math.min(unit.maxMana, unit.currentMana + Math.floor(unit.maxMana * 0.18));
                      });
                  } }
            ],
            2: [
                { id: 'lyric_B_2_1', name: 'Exploit Weakness', tier: 2, branch: 'B', cost: 1, levelReq: 5,
                  effect: 'You deal +15% damage to targets below 40% HP',
                  // Reuses the existing Predator executeDamageBonus/executeThreshold
                  // mechanism already read in js/combat-damage.js performAttack().
                  apply: function(unit, hero) {
                      unit.executeDamageBonus = (unit.executeDamageBonus || 0) + 0.15;
                      unit.executeThreshold = Math.max(unit.executeThreshold || 0, 0.40);
                  } },
                { id: 'lyric_B_2_2', name: 'Synergy Amplifier', tier: 2, branch: 'B', cost: 1, levelReq: 5,
                  effect: 'You count as +1 toward your primary archetype synergy',
                  // Implemented directly in updateActiveSynergies() (combat-core.js),
                  // which resolves investedNodes before combatState/heroSkillBonuses
                  // exist for the wave — see the Prompt 60 comment there.
                  apply: function(unit, hero) {} }
            ],
            3: [
                { id: 'lyric_B_3_1', name: 'Chain Efficiency', tier: 3, branch: 'B', cost: 2, levelReq: 9,
                  effect: 'On kill, nearest ally gains +10% ATK for 3s',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('unitKilled', function(p) {
                          if (unit.hp <= 0 || p.killer !== unit) return;
                          var pool = heroSideAllies(unit).filter(function(u) { return u !== unit && u.hp > 0; });
                          var nearest = findNearestAlly(unit, pool);
                          if (nearest) addStatus(nearest, 'atkBuff', 3, 0.10, unit);
                      });
                  } },
                { id: 'lyric_B_3_2', name: 'Momentum', tier: 3, branch: 'B', cost: 2, levelReq: 9,
                  effect: 'On kill, you gain +8% ATK speed for 4s (stacks up to 5 times)',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var stacks = [];
                      combatEvents.on('unitKilled', function(p) {
                          if (unit.hp <= 0 || p.killer !== unit) return;
                          if (stacks.length < 5) stacks.push(combatState.elapsed + 4);
                          else stacks[stacks.length - 1] = combatState.elapsed + 4;
                      });
                      combatEvents.on('tick', function() {
                          var now = combatState.elapsed;
                          for (var i = stacks.length - 1; i >= 0; i--) { if (stacks[i] <= now) stacks.splice(i, 1); }
                          heroSetAtkSpdMod(unit, 'lyric_B_3_2', stacks.length * 0.08);
                      });
                  } }
            ],
            4: [
                { id: 'lyric_B_4_1', name: 'Execution Bonus', tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'Your first 3 kills each combat restore 100% mana and grant +15% ATK for 5s',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var remaining = 3;
                      combatEvents.on('unitKilled', function(p) {
                          if (unit.hp <= 0 || p.killer !== unit || remaining <= 0) return;
                          remaining--;
                          if (unit.maxMana > 0) unit.currentMana = unit.maxMana;
                          addStatus(unit, 'atkBuff', 5, 0.15, unit);
                      });
                  } },
                { id: 'lyric_B_4_2', name: 'Hunting Bonus', tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'You gain +1% ATK per kill this combat, stacking infinitely (resets each new combat)',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var kills = 0;
                      combatEvents.on('unitKilled', function(p) {
                          if (unit.hp <= 0 || p.killer !== unit) return;
                          kills++;
                          heroSetAtkMod(unit, 'lyric_B_4_2', kills * 0.01);
                      });
                  } }
            ],
            5: [
                { id: 'lyric_B_5_1', name: "Utilitarian's Gift", tier: 5, branch: 'B', cost: 5, levelReq: 17,
                  effect: 'All hero-equipped allies gain +10% ATK and +10% ability damage. On your death, these bonuses double for 8s',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var deathAt = -9999;
                      combatEvents.on('unitKilled', function(p) {
                          if (p.victim === unit) deathAt = combatState.elapsed;
                      });
                      combatEvents.on('tick', function() {
                          var doubled = combatState.elapsed < deathAt + 8;
                          var pct = doubled ? 0.20 : 0.10;
                          var equipped = heroEquippedAllies(unit);
                          // Unit may already be dead (deathAt set); still buff the rest of the roster.
                          var pool = unit.hp > 0 ? equipped : heroSideAllies(unit).filter(function(u) { return u.hp > 0 && u._heroKey; });
                          for (var i = 0; i < pool.length; i++) {
                              heroSetAtkMod(pool[i], 'lyric_B_5_1', pct);
                              heroSetAbilityDmgMod(pool[i], 'lyric_B_5_1', pct);
                          }
                      });
                  } }
            ]
        }
    },

    // ========== REN ==========
    ren: {
        A: {
            1: [
                { id: 'ren_A_1_1', name: 'Tough Skin', tier: 1, branch: 'A', cost: 1, levelReq: 1,
                  effect: 'You gain +12% HP',
                  apply: function(unit, hero) {
                      unit.maxHp = Math.floor(unit.maxHp * 1.12);
                      unit.hp = unit.maxHp;
                  } },
                { id: 'ren_A_1_2', name: 'Rooted Stance', tier: 1, branch: 'A', cost: 1, levelReq: 1,
                  effect: 'While you have not moved for 4+ seconds, gain +10% DR',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var lastRow = unit.gridRow, lastCol = unit.gridCol, stillSince = 0;
                      combatEvents.on('tick', function(p) {
                          if (unit.hp <= 0) return;
                          if (unit.gridRow !== lastRow || unit.gridCol !== lastCol) {
                              lastRow = unit.gridRow; lastCol = unit.gridCol; stillSince = 0;
                          } else {
                              stillSince += p.dt;
                          }
                          heroSetDrMod(unit, 'ren_A_1_2', stillSince >= 4 ? 0.10 : 0);
                      });
                  } }
            ],
            2: [
                { id: 'ren_A_2_1', name: 'Endurance', tier: 2, branch: 'A', cost: 1, levelReq: 5,
                  effect: 'You gain +1.2% max HP regen per second (stacks with other regen)',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('combatStart', function() {
                          addStatus(unit, 'regen', 999, 0.012, unit);
                      });
                  } },
                { id: 'ren_A_2_2', name: 'Absorption', tier: 2, branch: 'A', cost: 1, levelReq: 5,
                  effect: 'After taking 5 hits, you gain a shield equal to 14% max HP (refreshes after shield breaks + 5 more hits)',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var hits = 0;
                      combatEvents.on('unitDamaged', function(p) {
                          if (unit.hp <= 0 || p.target !== unit) return;
                          hits++;
                          if (hits >= 5) {
                              hits = 0;
                              grantShield(unit, unit, Math.floor(unit.maxHp * 0.14));
                          }
                      });
                  } }
            ],
            3: [
                { id: 'ren_A_3_1', name: 'Stone Patience', tier: 3, branch: 'A', cost: 2, levelReq: 9,
                  effect: 'You gain +1% DR per 10 seconds of combat survived (caps at +10% at 100s)',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('tick', function() {
                          if (unit.hp <= 0) return;
                          var pct = Math.min(0.10, Math.floor(combatState.elapsed / 10) * 0.01);
                          heroSetDrMod(unit, 'ren_A_3_1', pct);
                      });
                  } },
                { id: 'ren_A_3_2', name: 'Thick Hide', tier: 3, branch: 'A', cost: 2, levelReq: 9,
                  effect: 'You gain +8% DR. This increases by +1% for every 10% HP you are missing',
                  apply: function(unit, hero) {
                      unit.damageReduction = (unit.damageReduction || 0) + 0.08;
                  },
                  register: function(unit, hero) {
                      combatEvents.on('tick', function() {
                          if (unit.hp <= 0 || unit.maxHp <= 0) return;
                          var missingPct = 1 - (unit.hp / unit.maxHp);
                          heroSetDrMod(unit, 'ren_A_3_2_scale', Math.floor(missingPct / 0.10) * 0.01);
                      });
                  } }
            ],
            4: [
                { id: 'ren_A_4_1', name: 'Unmovable Force', tier: 4, branch: 'A', cost: 4, levelReq: 13,
                  effect: 'You gain +15% damage reduction and cannot be slowed below 50% of normal movement speed',
                  apply: function(unit, hero) {
                      unit.damageReduction = (unit.damageReduction || 0) + 0.15;
                      unit.slowImmune = true; // APPROXIMATED: full slow immunity rather than a 50% floor (engine has no slow-floor primitive)
                  } },
                { id: 'ren_A_4_2', name: 'Last Stand', tier: 4, branch: 'A', cost: 4, levelReq: 13,
                  effect: 'When you drop below 20% HP, you gain a shield equal to 25% of the damage you absorbed this combat, up to 30% of your max HP',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var used = false;
                      combatEvents.on('unitDamaged', function(p) {
                          if (used || unit.hp <= 0 || p.target !== unit) return;
                          if (unit.hp / unit.maxHp >= 0.20) return;
                          used = true;
                          var absorbed = (unit.combatStats && unit.combatStats.damageTaken) || 0;
                          var amt = Math.min(Math.floor(absorbed * 0.25), Math.floor(unit.maxHp * 0.30));
                          if (amt > 0) grantShield(unit, unit, amt);
                      });
                  } }
            ],
            5: [
                { id: 'ren_A_5_1', name: 'Immovable', tier: 5, branch: 'A', cost: 5, levelReq: 17,
                  effect: 'Once per combat, when you drop below 15% HP, become immune to damage for 3s and heal 25% max HP. Then gain +18% DR for the rest of combat',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var used = false;
                      combatEvents.on('unitDamaged', function(p) {
                          if (used || unit.hp <= 0 || p.target !== unit) return;
                          if (unit.hp / unit.maxHp >= 0.15) return;
                          used = true;
                          unit.stasis = Math.max(unit.stasis || 0, 3);
                          dealHealing(unit, unit, Math.floor(unit.maxHp * 0.25));
                          heroSetDrMod(unit, 'ren_A_5_1', 0.18);
                          addCombatLog(unit.name + ' becomes Immovable!');
                      });
                  } }
            ]
        },
        B: {
            1: [
                { id: 'ren_B_1_1', name: 'Steady Presence', tier: 1, branch: 'B', cost: 1, levelReq: 1,
                  effect: 'Adjacent allies gain +6% HP',
                  apply: function(unit, hero) {},
                  // Evaluated once at combat start (deployment positions), like other adjacency auras.
                  register: function(unit, hero) {
                      combatEvents.on('combatStart', function() {
                          var adj = heroAdjacentAllies(unit);
                          for (var i = 0; i < adj.length; i++) {
                              var delta = Math.floor(adj[i].maxHp * 0.06);
                              adj[i].maxHp += delta;
                              adj[i].hp += delta;
                          }
                      });
                  } },
                { id: 'ren_B_1_2', name: 'Damage Magnet', tier: 1, branch: 'B', cost: 1, levelReq: 1,
                  effect: 'You absorb 10% of damage dealt to adjacent allies',
                  // APPROXIMATED redirect: heal the ally back 10% and take that
                  // amount as true damage yourself (the engine has no pre-hit
                  // damage-redirection pipeline).
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('unitDamaged', function(p) {
                          if (unit.hp <= 0 || !p.target || p.target === unit || p.target.side !== unit.side) return;
                          if (p.target.hp <= 0 || !heroIsAdjacent(unit, p.target) || p.amount <= 0) return;
                          var portion = Math.floor(p.amount * 0.10);
                          if (portion <= 0) return;
                          dealHealing(unit, p.target, portion);
                          dealDamage(p.source || unit, unit, portion, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
                      });
                  } }
            ],
            2: [
                { id: 'ren_B_2_1', name: 'Calming Aura', tier: 2, branch: 'B', cost: 1, levelReq: 5,
                  effect: 'Adjacent allies gain +6% CC resistance',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('combatStart', function() {
                          var adj = heroAdjacentAllies(unit);
                          for (var i = 0; i < adj.length; i++) adj[i].tenacity = (adj[i].tenacity || 0) + 0.06;
                      });
                  } },
                { id: 'ren_B_2_2', name: 'Stubborn Guard', tier: 2, branch: 'B', cost: 1, levelReq: 5,
                  effect: "When an adjacent ally is CC'd, you gain +12% ATK for 5s",
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('ccApplied', function(p) {
                          if (unit.hp <= 0 || !p.target || p.target.side !== unit.side || p.target === unit) return;
                          if (!heroIsAdjacent(unit, p.target)) return;
                          addStatus(unit, 'atkBuff', 5, 0.12, unit);
                      });
                  } }
            ],
            3: [
                { id: 'ren_B_3_1', name: 'Loyal Shield', tier: 3, branch: 'B', cost: 2, levelReq: 9,
                  effect: 'When your shield (from any source) breaks, adjacent allies gain a shield equal to 8% of their max HP',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('unitDamaged', function(p) {
                          if (unit.hp <= 0 || p.target !== unit || !p.shieldBroke) return;
                          var adj = heroAdjacentAllies(unit);
                          for (var i = 0; i < adj.length; i++) grantShield(unit, adj[i], Math.floor(adj[i].maxHp * 0.08));
                      });
                  } },
                { id: 'ren_B_3_2', name: 'Protective Presence', tier: 3, branch: 'B', cost: 2, levelReq: 9,
                  effect: 'Adjacent allies gain +8% DR. This increases to +12% DR when you are below 40% HP',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('tick', function() {
                          var pct = (unit.hp > 0 && unit.hp / unit.maxHp < 0.40) ? 0.12 : 0.08;
                          var adj = unit.hp > 0 ? heroAdjacentAllies(unit) : [];
                          var allies = heroSideAllies(unit).filter(function(u) { return u !== unit && u.hp > 0; });
                          for (var i = 0; i < allies.length; i++) {
                              heroSetDrMod(allies[i], 'ren_B_3_2', adj.indexOf(allies[i]) >= 0 ? pct : 0);
                          }
                      });
                  } }
            ],
            4: [
                { id: 'ren_B_4_1', name: 'Guardian Pulse', tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'Every 6s, you heal the lowest-HP adjacent ally for 12% of your max HP. Nearby enemies lose 3% ATK for 4s',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var timer = 0;
                      combatEvents.on('tick', function(p) {
                          if (unit.hp <= 0) return;
                          timer += p.dt;
                          if (timer < 6) return;
                          timer -= 6;
                          var adj = heroAdjacentAllies(unit);
                          var lowest = getLowestHpUnits(adj, 1);
                          if (lowest.length > 0) dealHealing(unit, lowest[0], Math.floor(unit.maxHp * 0.12));
                          var nearbyEnemies = getUnitsInRadius(unit.gridRow, unit.gridCol, 2, heroSideEnemies(unit).filter(function(u) { return u.hp > 0; }));
                          for (var i = 0; i < nearbyEnemies.length; i++) addStatus(nearbyEnemies[i], 'atkMod', 4, -0.03, unit);
                      });
                  } },
                { id: 'ren_B_4_2', name: 'Anchor Chain', tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'When an adjacent ally takes damage, they gain +8% DR for 4s and you gain +6% lifesteal for 4s',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var expire = 0;
                      combatEvents.on('unitDamaged', function(p) {
                          if (unit.hp <= 0 || !p.target || p.target === unit || p.target.side !== unit.side) return;
                          if (p.target.hp <= 0 || !heroIsAdjacent(unit, p.target)) return;
                          addStatus(p.target, 'drMod', 4, 0.08, unit);
                          expire = combatState.elapsed + 4;
                      });
                      combatEvents.on('tick', function() {
                          heroSetLifestealMod(unit, 'ren_B_4_2', combatState.elapsed < expire ? 0.06 : 0);
                      });
                  } }
            ],
            5: [
                { id: 'ren_B_5_1', name: 'Unshakeable Bond', tier: 5, branch: 'B', cost: 5, levelReq: 17,
                  effect: 'All allies within 2 cells gain +10% DR. When you take damage, reduce it by 15% and grant nearby allies +5% DR for 3s',
                  // APPROXIMATED "reduce it by 15%": folded into your own
                  // baseline DR share of the aura rather than a true pre-hit
                  // intercept (no such hook exists in dealDamage()).
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var burstUntil = 0;
                      combatEvents.on('unitDamaged', function(p) {
                          if (unit.hp <= 0 || p.target !== unit) return;
                          burstUntil = combatState.elapsed + 3;
                      });
                      combatEvents.on('tick', function() {
                          var inRange = heroAlliesInRadius(unit, 2, true);
                          var allies = heroSideAllies(unit).filter(function(u) { return u.hp > 0; });
                          var burst = combatState.elapsed < burstUntil;
                          for (var i = 0; i < allies.length; i++) {
                              var isUnit = allies[i] === unit;
                              var qualifies = inRange.indexOf(allies[i]) >= 0;
                              var pct = 0;
                              if (isUnit) pct = 0.15; // self dmg-reduction approximation
                              else if (qualifies) pct = burst ? 0.15 : 0.10;
                              heroSetDrMod(allies[i], 'ren_B_5_1', pct);
                          }
                      });
                  } }
            ]
        }
    },

    // ========== SERA ==========
    sera: {
        A: {
            1: [
                { id: 'sera_A_1_1', name: 'Sharp Focus', tier: 1, branch: 'A', cost: 1, levelReq: 1,
                  effect: 'You gain +8% ATK',
                  apply: function(unit, hero) {
                      unit.attack = Math.floor(unit.attack * 1.08);
                  } },
                { id: 'sera_A_1_2', name: 'Armor Pierce', tier: 1, branch: 'A', cost: 1, levelReq: 1,
                  effect: "Your attacks ignore 10% of target's DR",
                  apply: function(unit, hero) {
                      unit.drIgnore = (unit.drIgnore || 0) + 0.10;
                  } }
            ],
            2: [
                { id: 'sera_A_2_1', name: 'Finishing Blow', tier: 2, branch: 'A', cost: 1, levelReq: 5,
                  effect: 'You deal +18% damage to targets below 35% HP',
                  // Reuses the existing Predator executeDamageBonus/executeThreshold
                  // mechanism already read in js/combat-damage.js performAttack().
                  apply: function(unit, hero) {
                      unit.executeDamageBonus = (unit.executeDamageBonus || 0) + 0.18;
                      unit.executeThreshold = Math.max(unit.executeThreshold || 0, 0.35);
                  } },
                { id: 'sera_A_2_2', name: 'Critical Precision', tier: 2, branch: 'A', cost: 1, levelReq: 5,
                  effect: 'You gain +12% crit chance. Crits apply a mark: marked targets take +10% damage from all sources for 3s',
                  apply: function(unit, hero) {
                      unit.critChance = (unit.critChance || 0) + 0.12;
                  },
                  register: function(unit, hero) {
                      combatEvents.on('unitDamaged', function(p) {
                          if (unit.hp <= 0 || p.source !== unit || !p.isCrit || !p.target || p.target.hp <= 0) return;
                          addStatus(p.target, 'vulnerability', 3, 0.10, unit);
                      });
                  } }
            ],
            3: [
                { id: 'sera_A_3_1', name: 'Exploit Opening', tier: 3, branch: 'A', cost: 2, levelReq: 9,
                  effect: "When target is CC'd (stun/root/freeze), your next attack deals +28% damage",
                  apply: function(unit, hero) { unit._heroExploitOpeningBonus = 0.28; } },
                { id: 'sera_A_3_2', name: 'Weak Point', tier: 3, branch: 'A', cost: 2, levelReq: 9,
                  effect: 'You deal +6% damage for every 5% missing HP your target has, up to +30%',
                  apply: function(unit, hero) { unit._heroWeakPointMax = 0.30; } }
            ],
            4: [
                { id: 'sera_A_4_1', name: 'Burst Window', tier: 4, branch: 'A', cost: 4, levelReq: 13,
                  effect: 'Your first 2 ability casts each combat are guaranteed crits and ignore 20% DR',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var remaining = 2;
                      combatEvents.on('abilityCast', function(p) {
                          if (p.caster !== unit) return;
                          if (remaining > 0) {
                              remaining--;
                              unit._heroForceCritAbility = true;
                              unit._heroDrIgnoreAbility = 0.20;
                          } else {
                              unit._heroForceCritAbility = false;
                              unit._heroDrIgnoreAbility = 0;
                          }
                      });
                  } },
                { id: 'sera_A_4_2', name: 'Priority Strike', tier: 4, branch: 'A', cost: 4, levelReq: 13,
                  effect: 'Your attacks against enemies below 50% HP deal +25% damage and apply a debuff that increases their damage taken by +8% for 4s',
                  apply: function(unit, hero) {
                      unit.executeDamageBonus = (unit.executeDamageBonus || 0) + 0.25;
                      unit.executeThreshold = Math.max(unit.executeThreshold || 0, 0.50);
                  },
                  register: function(unit, hero) {
                      combatEvents.on('unitDamaged', function(p) {
                          if (unit.hp <= 0 || p.source !== unit || !p.target || p.target.hp <= 0) return;
                          if (p.target.hp / p.target.maxHp >= 0.50) return;
                          addStatus(p.target, 'vulnerability', 4, 0.08, unit);
                      });
                  } }
            ],
            5: [
                { id: 'sera_A_5_1', name: 'Death Sentence', tier: 5, branch: 'A', cost: 5, levelReq: 17,
                  effect: 'Your first ability cast each combat is a guaranteed crit, ignores 30% DR, and if it kills the target, refund 60% mana and grant +15% ATK for 5s',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var used = false, pending = false;
                      combatEvents.on('abilityCast', function(p) {
                          if (p.caster !== unit) return;
                          if (!used) {
                              used = true;
                              pending = true;
                              unit._heroForceCritAbility = true;
                              unit._heroDrIgnoreAbility = 0.30;
                          } else {
                              unit._heroForceCritAbility = false;
                              unit._heroDrIgnoreAbility = 0;
                          }
                      });
                      combatEvents.on('unitKilled', function(p) {
                          if (!pending || p.killer !== unit) return;
                          pending = false;
                          if (unit.maxMana > 0) unit.currentMana = Math.min(unit.maxMana, unit.currentMana + Math.floor(unit.maxMana * 0.60));
                          addStatus(unit, 'atkBuff', 5, 0.15, unit);
                      });
                  } }
            ]
        },
        B: {
            1: [
                { id: 'sera_B_1_1', name: 'Target Caller', tier: 1, branch: 'B', cost: 1, levelReq: 1,
                  effect: 'When you attack a target, nearest ally targeting the same enemy gains +10% ATK',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('unitDamaged', function(p) {
                          if (unit.hp <= 0 || p.source !== unit || !p.target) return;
                          var candidates = heroSideAllies(unit).filter(function(u) { return u !== unit && u.hp > 0 && u.target === p.target; });
                          var nearest = findNearestAlly(unit, candidates);
                          if (nearest) addStatus(nearest, 'atkBuff', 3, 0.10, unit);
                      });
                  } },
                { id: 'sera_B_1_2', name: 'Mana Efficiency', tier: 1, branch: 'B', cost: 1, levelReq: 1,
                  effect: 'Your abilities cost 12% less mana',
                  apply: function(unit, hero) {
                      if (!unit.heroSkillBonuses) unit.heroSkillBonuses = {};
                      unit.heroSkillBonuses.manaCostReduction = 0.12;
                  } }
            ],
            2: [
                { id: 'sera_B_2_1', name: 'Coordinated Burst', tier: 2, branch: 'B', cost: 1, levelReq: 5,
                  effect: 'When you cast ability, nearest hero-equipped ally gains +15% ability damage for their next cast',
                  // APPROXIMATED "next cast" as a 6s window rather than a
                  // precise single-cast consumption token.
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('abilityCast', function(p) {
                          if (unit.hp <= 0 || p.caster !== unit) return;
                          var candidates = heroEquippedAllies(unit).filter(function(u) { return u !== unit; });
                          var nearest = findNearestAlly(unit, candidates);
                          if (nearest) addStatus(nearest, 'heroAbilityDmgBuff', 6, 0.15, unit);
                      });
                  } },
                { id: 'sera_B_2_2', name: 'Elemental Affinity', tier: 2, branch: 'B', cost: 1, levelReq: 5,
                  effect: 'Your element damage multiplier is improved by +0.15 (1.3x advantage becomes 1.45x)',
                  apply: function(unit, hero) {
                      if (!unit.heroSkillBonuses) unit.heroSkillBonuses = {};
                      unit.heroSkillBonuses.elemDmgMultBonus = 0.15;
                  } }
            ],
            3: [
                { id: 'sera_B_3_1', name: 'Focus Fire', tier: 3, branch: 'B', cost: 2, levelReq: 9,
                  effect: 'You mark your target. All hero-equipped allies targeting the same marked enemy gain +8% ATK',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('unitDamaged', function(p) {
                          if (unit.hp <= 0 || p.source !== unit || !p.target) return;
                          var equipped = heroEquippedAllies(unit).filter(function(u) { return u.target === p.target; });
                          for (var i = 0; i < equipped.length; i++) addStatus(equipped[i], 'atkBuff', 3, 0.08, unit);
                      });
                  } },
                { id: 'sera_B_3_2', name: 'Weakpoint Exposure', tier: 3, branch: 'B', cost: 2, levelReq: 9,
                  effect: 'When you crit, nearby allies gain +8% crit chance for 3s',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('unitDamaged', function(p) {
                          if (unit.hp <= 0 || p.source !== unit || !p.isCrit) return;
                          var nearby = heroAlliesInRadius(unit, 2, false);
                          for (var i = 0; i < nearby.length; i++) addStatus(nearby[i], 'critChanceBuff', 3, 0.08, unit);
                      });
                  } }
            ],
            4: [
                { id: 'sera_B_4_1', name: 'Battle Coordination', tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'All hero-equipped allies within 2 cells gain +6% ATK. When you crit, they gain +10% ATK speed for 2s',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('tick', function() {
                          var equipped = heroEquippedAllies(unit).filter(function(u) { return u !== unit; });
                          var nearby = unit.hp > 0 ? heroAlliesInRadius(unit, 2, false).filter(function(u) { return u._heroKey; }) : [];
                          for (var i = 0; i < equipped.length; i++) {
                              heroSetAtkMod(equipped[i], 'sera_B_4_1', nearby.indexOf(equipped[i]) >= 0 ? 0.06 : 0);
                          }
                      });
                      combatEvents.on('unitDamaged', function(p) {
                          if (unit.hp <= 0 || p.source !== unit || !p.isCrit) return;
                          var nearby = heroAlliesInRadius(unit, 2, false).filter(function(u) { return u._heroKey; });
                          for (var i = 0; i < nearby.length; i++) addStatus(nearby[i], 'spdMod', 2, 0.10, unit);
                      });
                  } },
                { id: 'sera_B_4_2', name: 'Killsteal Synergy', tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'When any hero-equipped ally scores a kill, you gain +8% ATK for 4s and your next ability deals +15% damage',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('unitKilled', function(p) {
                          if (unit.hp <= 0 || !p.killer || !p.killer._heroKey || p.killer.side !== unit.side) return;
                          addStatus(unit, 'atkBuff', 4, 0.08, unit);
                          addStatus(unit, 'heroAbilityDmgBuff', 10, 0.15, unit);
                      });
                  } }
            ],
            5: [
                { id: 'sera_B_5_1', name: 'Perfect Execution', tier: 5, branch: 'B', cost: 5, levelReq: 17,
                  effect: 'All hero-equipped allies gain +7% crit chance. When any hero-equipped ally scores a kill, all other hero-equipped allies gain +12% ATK speed for 3s',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('combatStart', function() {
                          var equipped = heroEquippedAllies(unit);
                          for (var i = 0; i < equipped.length; i++) addStatus(equipped[i], 'critChanceBuff', 999, 0.07, unit);
                      });
                      combatEvents.on('unitKilled', function(p) {
                          if (unit.hp <= 0 || !p.killer || !p.killer._heroKey || p.killer.side !== unit.side) return;
                          var others = heroEquippedAllies(unit).filter(function(u) { return u !== p.killer; });
                          for (var i = 0; i < others.length; i++) addStatus(others[i], 'spdMod', 3, 0.12, unit);
                      });
                  } }
            ]
        }
    },

    // ========== MAREN ==========
    maren: {
        A: {
            1: [
                { id: 'maren_A_1_1', name: 'Healing Touch', tier: 1, branch: 'A', cost: 1, levelReq: 1,
                  effect: 'All healing you receive is +14% stronger',
                  apply: function(unit, hero) {
                      unit.healPowerBonus = (unit.healPowerBonus || 0) + 0.14;
                  } },
                { id: 'maren_A_1_2', name: 'Recovery Pulse', tier: 1, branch: 'A', cost: 1, levelReq: 1,
                  effect: 'You heal adjacent allies for 2.5% of their max HP every 5s',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var timer = 0;
                      combatEvents.on('tick', function(p) {
                          if (unit.hp <= 0) return;
                          timer += p.dt;
                          if (timer < 5) return;
                          timer -= 5;
                          var adj = heroAdjacentAllies(unit);
                          for (var i = 0; i < adj.length; i++) dealHealing(unit, adj[i], Math.floor(adj[i].maxHp * 0.025));
                      });
                  } }
            ],
            2: [
                { id: 'maren_A_2_1', name: 'Emergency Care', tier: 2, branch: 'A', cost: 1, levelReq: 5,
                  effect: 'Heals on targets below 30% HP are +28% stronger (applies to all heal sources on you and your targets)',
                  // APPROXIMATED to "heals from you" (source === this unit)
                  // rather than every heal source targeting your targets.
                  apply: function(unit, hero) { unit._heroEmergencyCareBonus = 0.28; } },
                { id: 'maren_A_2_2', name: 'Lifesteal Amplifier', tier: 2, branch: 'A', cost: 1, levelReq: 5,
                  effect: "You gain +8% lifesteal. If you already have lifesteal, it's +8% stronger",
                  apply: function(unit, hero) {
                      unit.lifesteal = (unit.lifesteal || 0) + 0.08;
                  } }
            ],
            3: [
                { id: 'maren_A_3_1', name: 'Purify', tier: 3, branch: 'A', cost: 2, levelReq: 9,
                  effect: 'When you heal an ally (from any source), remove 1 debuff from the target',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('unitHealed', function(p) {
                          if (unit.hp <= 0 || p.source !== unit || !p.target || p.target.hp <= 0) return;
                          clearDebuffs(p.target, 1);
                      });
                  } },
                { id: 'maren_A_3_2', name: 'Vital Bond', tier: 3, branch: 'A', cost: 2, levelReq: 9,
                  effect: 'When you heal an adjacent ally, they gain +8% DR for 4s. You gain +6% ATK for 4s',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('unitHealed', function(p) {
                          if (unit.hp <= 0 || p.source !== unit || !p.target || p.target === unit) return;
                          if (p.target.hp <= 0 || !heroIsAdjacent(unit, p.target)) return;
                          addStatus(p.target, 'drMod', 4, 0.08, unit);
                          addStatus(unit, 'atkBuff', 4, 0.06, unit);
                      });
                  } }
            ],
            4: [
                { id: 'maren_A_4_1', name: 'Shared Vitality', tier: 4, branch: 'A', cost: 4, levelReq: 13,
                  effect: 'When you heal, the lowest-HP nearby ally gains 50% of the heal you receive, and you heal 30% of damage absorbed by adjacent shields',
                  // APPROXIMATED: only the first clause (heal-sharing) is
                  // implemented; the shield-absorption-siphon clause would
                  // need per-hit shield-absorption tracking on allies that
                  // the engine doesn't expose and is skipped.
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('unitHealed', function(p) {
                          if (unit.hp <= 0 || p.source !== unit || !p.target) return;
                          var nearby = heroAlliesInRadius(unit, 2, false).filter(function(u) { return u !== p.target; });
                          var lowest = getLowestHpUnits(nearby, 1);
                          if (lowest.length > 0) dealHealing(unit, lowest[0], Math.floor(p.amount * 0.50));
                      });
                  } },
                { id: 'maren_A_4_2', name: 'Desperate Measures', tier: 4, branch: 'A', cost: 4, levelReq: 13,
                  effect: 'When any ally drops below 25% HP, instantly heal them for 20% of their max HP. Cooldown: 4s per target',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var cooldowns = [];
                      combatEvents.on('unitDamaged', function(p) {
                          if (unit.hp <= 0 || !p.target || p.target.side !== unit.side || p.target.hp <= 0) return;
                          if (p.target.hp / p.target.maxHp >= 0.25) return;
                          for (var i = 0; i < cooldowns.length; i++) {
                              if (cooldowns[i].unit === p.target) {
                                  if (combatState.elapsed < cooldowns[i].readyAt) return;
                                  cooldowns[i].readyAt = combatState.elapsed + 4;
                                  dealHealing(unit, p.target, Math.floor(p.target.maxHp * 0.20));
                                  return;
                              }
                          }
                          cooldowns.push({ unit: p.target, readyAt: combatState.elapsed + 4 });
                          dealHealing(unit, p.target, Math.floor(p.target.maxHp * 0.20));
                      });
                  } }
            ],
            5: [
                { id: 'maren_A_5_1', name: 'Miracle', tier: 5, branch: 'A', cost: 5, levelReq: 17,
                  effect: 'Once per combat, when any hero-equipped ally drops below 10% HP, instantly heal them to 45% and grant 3s invulnerability',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var used = false;
                      combatEvents.on('unitDamaged', function(p) {
                          if (used || unit.hp <= 0 || !p.target || p.target.side !== unit.side || !p.target._heroKey) return;
                          if (p.target.hp <= 0 || p.target.hp / p.target.maxHp >= 0.10) return;
                          used = true;
                          var healAmt = Math.floor(p.target.maxHp * 0.45) - p.target.hp;
                          if (healAmt > 0) dealHealing(unit, p.target, healAmt);
                          p.target.stasis = Math.max(p.target.stasis || 0, 3);
                          addCombatLog(unit.name + ' performs a Miracle on ' + p.target.name + '!');
                      });
                  } }
            ]
        },
        B: {
            1: [
                { id: 'maren_B_1_1', name: 'Shield Weave', tier: 1, branch: 'B', cost: 1, levelReq: 1,
                  effect: 'Your heals (from any source) also grant a shield equal to 12% of the heal amount (5s)',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('unitHealed', function(p) {
                          if (unit.hp <= 0 || p.source !== unit || !p.target || p.target.hp <= 0) return;
                          grantShield(unit, p.target, Math.floor(p.amount * 0.12));
                      });
                  } },
                { id: 'maren_B_1_2', name: 'Mana Flow', tier: 1, branch: 'B', cost: 1, levelReq: 1,
                  effect: 'You gain +2.5 mana per second',
                  apply: function(unit, hero) {
                      if (!unit.heroSkillBonuses) unit.heroSkillBonuses = {};
                      unit.heroSkillBonuses.manaPerSec = 2.5;
                  } }
            ],
            2: [
                { id: 'maren_B_2_1', name: 'Overheal Mastery', tier: 2, branch: 'B', cost: 1, levelReq: 5,
                  effect: '30% of overhealing (healing above max HP) converts to a permanent shield',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('unitHealed', function(p) {
                          if (unit.hp <= 0 || p.source !== unit || !p.target || !p.overheal) return;
                          grantShield(unit, p.target, Math.floor(p.overheal * 0.30));
                      });
                  } },
                { id: 'maren_B_2_2', name: 'Kindred Spirit', tier: 2, branch: 'B', cost: 1, levelReq: 5,
                  effect: 'When you are healed, the lowest-HP adjacent ally is healed for 35% of the same amount',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('unitHealed', function(p) {
                          if (unit.hp <= 0 || p.target !== unit) return;
                          var adj = heroAdjacentAllies(unit);
                          var lowest = getLowestHpUnits(adj, 1);
                          if (lowest.length > 0) dealHealing(unit, lowest[0], Math.floor(p.amount * 0.35));
                      });
                  } }
            ],
            3: [
                { id: 'maren_B_3_1', name: 'Absorb Pain', tier: 3, branch: 'B', cost: 2, levelReq: 9,
                  effect: 'You absorb 14% of damage dealt to the lowest-HP ally within 2 cells',
                  // APPROXIMATED redirect (see ren_B_1_2 "Damage Magnet" note).
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('unitDamaged', function(p) {
                          if (unit.hp <= 0 || !p.target || p.target === unit || p.target.side !== unit.side || p.amount <= 0) return;
                          var nearby = heroAlliesInRadius(unit, 2, false);
                          var lowest = getLowestHpUnits(nearby, 1);
                          if (lowest.length === 0 || lowest[0] !== p.target) return;
                          var portion = Math.floor(p.amount * 0.14);
                          if (portion <= 0) return;
                          dealHealing(unit, p.target, portion);
                          dealDamage(p.source || unit, unit, portion, {isTrueDamage: true, canCrit: false, canDodge: false, applyElement: false, triggerOnHit: false});
                      });
                  } },
                { id: 'maren_B_3_2', name: 'Guardian Shell', tier: 3, branch: 'B', cost: 2, levelReq: 9,
                  effect: 'When adjacent allies heal, they gain an additional shield equal to 8% of the heal amount. You gain +8% DR when shields are active on nearby allies',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('unitHealed', function(p) {
                          if (unit.hp <= 0 || !p.target || p.target === unit || p.target.side !== unit.side) return;
                          if (p.target.hp <= 0 || !heroIsAdjacent(unit, p.target)) return;
                          grantShield(unit, p.target, Math.floor(p.amount * 0.08));
                      });
                      combatEvents.on('tick', function() {
                          if (unit.hp <= 0) return;
                          var nearby = heroAlliesInRadius(unit, 2, false);
                          var anyShielded = false;
                          for (var i = 0; i < nearby.length; i++) { if (nearby[i].shield > 0) { anyShielded = true; break; } }
                          heroSetDrMod(unit, 'maren_B_3_2', anyShielded ? 0.08 : 0);
                      });
                  } }
            ],
            4: [
                { id: 'maren_B_4_1', name: 'Fortified Presence', tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'All hero-equipped allies within 2 cells gain +8% shields received and healing received. When shields break on nearby allies, you gain +12% ATK for 3s',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('tick', function() {
                          var equipped = heroEquippedAllies(unit).filter(function(u) { return u !== unit; });
                          var nearby = unit.hp > 0 ? heroAlliesInRadius(unit, 2, false) : [];
                          for (var i = 0; i < equipped.length; i++) {
                              var bonus = nearby.indexOf(equipped[i]) >= 0 ? 0.08 : 0;
                              equipped[i]._heroHealReceivedBonus = bonus;
                              equipped[i]._heroShieldReceivedBonus = bonus;
                          }
                      });
                      combatEvents.on('unitDamaged', function(p) {
                          if (unit.hp <= 0 || !p.target || p.target === unit || p.target.side !== unit.side || !p.shieldBroke) return;
                          var nearby = heroAlliesInRadius(unit, 2, false);
                          if (nearby.indexOf(p.target) < 0) return;
                          addStatus(unit, 'atkBuff', 3, 0.12, unit);
                      });
                  } },
                { id: 'maren_B_4_2', name: 'Emergency Sanctuary', tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'When you cast an ability, create a protective zone for 4s that reduces all incoming damage to allies by 18% and doubles all healing in the zone',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('abilityCast', function(p) {
                          if (unit.hp <= 0 || p.caster !== unit) return;
                          unit._heroSanctuaryUntil = combatState.elapsed + 4;
                      });
                  } }
            ],
            5: [
                { id: 'maren_B_5_1', name: 'Sanctuary', tier: 5, branch: 'B', cost: 5, levelReq: 17,
                  effect: 'Once per combat, create a 2-cell radius zone around you that reduces all incoming damage to allies by 28% for 5s. During Sanctuary, all healing in the zone is tripled',
                  apply: function(unit, hero) {},
                  // APPROXIMATED: no manual-activation UI exists, so this
                  // auto-triggers on the "ally below 30% HP" emergency
                  // condition (see kael_B_5_1 for the same approximation).
                  register: function(unit, hero) {
                      var used = false;
                      combatEvents.on('unitDamaged', function(p) {
                          if (used || unit.hp <= 0 || !p.target || p.target.side !== unit.side) return;
                          if (p.target.hp <= 0 || p.target.hp / p.target.maxHp >= 0.30) return;
                          used = true;
                          unit._heroSanctuaryCapstoneUntil = combatState.elapsed + 5;
                          addCombatLog(unit.name + ' creates a Sanctuary!');
                      });
                  } }
            ]
        }
    },

    // ========== VOSS ==========
    voss: {
        A: {
            1: [
                { id: 'voss_A_1_1', name: 'War Cry', tier: 1, branch: 'A', cost: 1, levelReq: 1,
                  effect: 'You gain +3.5% ATK every 8s of combat (caps at +28% at ~64s)',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('tick', function() {
                          if (unit.hp <= 0) return;
                          heroSetAtkMod(unit, 'voss_A_1_1', Math.min(0.28, Math.floor(combatState.elapsed / 8) * 0.035));
                      });
                  } },
                { id: 'voss_A_1_2', name: 'Battle Rhythm', tier: 1, branch: 'A', cost: 1, levelReq: 1,
                  effect: 'You gain +2.2% ATK speed every 10s of combat (caps at +18%)',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('tick', function() {
                          if (unit.hp <= 0) return;
                          heroSetAtkSpdMod(unit, 'voss_A_1_2', Math.min(0.18, Math.floor(combatState.elapsed / 10) * 0.022));
                      });
                  } }
            ],
            2: [
                { id: 'voss_A_2_1', name: 'Bloodlust', tier: 2, branch: 'A', cost: 1, levelReq: 5,
                  effect: 'You gain +8% lifesteal. Lifesteal increases by +1.2% per 10s of combat',
                  apply: function(unit, hero) {
                      unit.lifesteal = (unit.lifesteal || 0) + 0.08;
                  },
                  register: function(unit, hero) {
                      combatEvents.on('tick', function() {
                          if (unit.hp <= 0) return;
                          heroSetLifestealMod(unit, 'voss_A_2_1_ramp', Math.floor(combatState.elapsed / 10) * 0.012);
                      });
                  } },
                { id: 'voss_A_2_2', name: 'Combat Readiness', tier: 2, branch: 'A', cost: 1, levelReq: 5,
                  effect: 'You gain +1% DR per 10s of combat (caps at +10%) and +2% mana regen per 10s (caps at +20% mana/s)',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('tick', function(p) {
                          if (unit.hp <= 0) return;
                          heroSetDrMod(unit, 'voss_A_2_2', Math.min(0.10, Math.floor(combatState.elapsed / 10) * 0.01));
                          if (unit.maxMana > 0) {
                              var regenPct = Math.min(0.20, Math.floor(combatState.elapsed / 10) * 0.02);
                              if (regenPct > 0) unit.currentMana = Math.min(unit.maxMana, unit.currentMana + unit.maxMana * regenPct * p.dt);
                          }
                      });
                  } }
            ],
            3: [
                { id: 'voss_A_3_1', name: 'Berserker Rage', tier: 3, branch: 'A', cost: 2, levelReq: 9,
                  effect: 'You gain +1.8% ATK per 10% HP missing (max +18% at low HP)',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('tick', function() {
                          if (unit.hp <= 0 || unit.maxHp <= 0) return;
                          var missingPct = 1 - (unit.hp / unit.maxHp);
                          heroSetAtkMod(unit, 'voss_A_3_1', Math.min(0.18, Math.floor(missingPct / 0.10) * 0.018));
                      });
                  } },
                { id: 'voss_A_3_2', name: 'Unstoppable Advance', tier: 3, branch: 'A', cost: 2, levelReq: 9,
                  effect: 'You become immune to Slow effects after 25s of combat. Your movement speed increases +3% per 10s of combat',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('tick', function() {
                          if (unit.hp <= 0) return;
                          if (combatState.elapsed >= 25) unit.slowImmune = true;
                          heroSetMoveSpeedMod(unit, 'voss_A_3_2', Math.floor(combatState.elapsed / 10) * 0.03);
                      });
                  } }
            ],
            4: [
                { id: 'voss_A_4_1', name: 'Escalation', tier: 4, branch: 'A', cost: 4, levelReq: 13,
                  effect: 'Every 15s of combat, you permanently gain +8% ATK and +4% damage dealt. This stacks infinitely',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var nextAt = 15, stacks = 0;
                      combatEvents.on('tick', function() {
                          if (unit.hp <= 0) return;
                          while (combatState.elapsed >= nextAt) {
                              nextAt += 15;
                              stacks++;
                          }
                          heroSetAtkMod(unit, 'voss_A_4_1', stacks * 0.08);
                          heroSetDmgDealtMod(unit, 'voss_A_4_1', stacks * 0.04);
                      });
                  } },
                { id: 'voss_A_4_2', name: "Veteran's Strength", tier: 4, branch: 'A', cost: 4, levelReq: 13,
                  effect: 'After 40s of combat, you gain +20% ATK, +15% ATK speed, and +5% lifesteal. This bonus increases by +5% ATK every 10s of additional combat',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('tick', function() {
                          if (unit.hp <= 0) return;
                          if (combatState.elapsed < 40) {
                              heroSetAtkMod(unit, 'voss_A_4_2', 0);
                              heroSetAtkSpdMod(unit, 'voss_A_4_2', 0);
                              heroSetLifestealMod(unit, 'voss_A_4_2', 0);
                              return;
                          }
                          var extra = Math.floor((combatState.elapsed - 40) / 10) * 0.05;
                          heroSetAtkMod(unit, 'voss_A_4_2', 0.20 + extra);
                          heroSetAtkSpdMod(unit, 'voss_A_4_2', 0.15);
                          heroSetLifestealMod(unit, 'voss_A_4_2', 0.05);
                      });
                  } }
            ],
            5: [
                { id: 'voss_A_5_1', name: "Warlord's Fury", tier: 5, branch: 'A', cost: 5, levelReq: 17,
                  effect: 'After 45s of combat, you enter Fury: +24% ATK, +24% ATK speed, +12% lifesteal. Kills during Fury extend it by 6s and grant +6% ATK permanently',
                  // APPROXIMATED: Fury activates at 45s and, since nothing in
                  // the text describes it lapsing on its own, is treated as
                  // staying active for the rest of combat; kills grant a
                  // permanent stacking +6% ATK on top of it rather than a
                  // literal "extend the timer" mechanic.
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var killStacks = 0;
                      combatEvents.on('tick', function() {
                          if (unit.hp <= 0) return;
                          var inFury = combatState.elapsed >= 45;
                          heroSetAtkMod(unit, 'voss_A_5_1', (inFury ? 0.24 : 0) + killStacks * 0.06);
                          heroSetAtkSpdMod(unit, 'voss_A_5_1', inFury ? 0.24 : 0);
                          heroSetLifestealMod(unit, 'voss_A_5_1', inFury ? 0.12 : 0);
                      });
                      combatEvents.on('unitKilled', function(p) {
                          if (unit.hp <= 0 || p.killer !== unit || combatState.elapsed < 45) return;
                          killStacks++;
                      });
                  } }
            ]
        },
        B: {
            1: [
                { id: 'voss_B_1_1', name: 'First Blood', tier: 1, branch: 'B', cost: 1, levelReq: 1,
                  effect: 'Your first kill each combat grants +15% ATK for 6s',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var used = false;
                      combatEvents.on('unitKilled', function(p) {
                          if (used || unit.hp <= 0 || p.killer !== unit) return;
                          used = true;
                          addStatus(unit, 'atkBuff', 6, 0.15, unit);
                      });
                  } },
                { id: 'voss_B_1_2', name: 'Momentum', tier: 1, branch: 'B', cost: 1, levelReq: 1,
                  effect: 'On kill, you gain +10% ATK speed for 4s (stacks up to 5 times)',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var stacks = [];
                      combatEvents.on('unitKilled', function(p) {
                          if (unit.hp <= 0 || p.killer !== unit) return;
                          if (stacks.length < 5) stacks.push(combatState.elapsed + 4);
                          else stacks[stacks.length - 1] = combatState.elapsed + 4;
                      });
                      combatEvents.on('tick', function() {
                          var now = combatState.elapsed;
                          for (var i = stacks.length - 1; i >= 0; i--) { if (stacks[i] <= now) stacks.splice(i, 1); }
                          heroSetAtkSpdMod(unit, 'voss_B_1_2', stacks.length * 0.10);
                      });
                  } }
            ],
            2: [
                { id: 'voss_B_2_1', name: 'Intimidate', tier: 2, branch: 'B', cost: 1, levelReq: 5,
                  effect: 'On kill, nearby enemies (within 2 cells) lose 6% ATK for 5s',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('unitKilled', function(p) {
                          if (unit.hp <= 0 || p.killer !== unit || !p.victim) return;
                          var enemyPool = heroSideEnemies(unit).filter(function(u) { return u.hp > 0; });
                          var nearby = getUnitsInRadius(p.victim.gridRow, p.victim.gridCol, 2, enemyPool);
                          for (var i = 0; i < nearby.length; i++) addStatus(nearby[i], 'atkMod', 5, -0.06, unit);
                      });
                  } },
                { id: 'voss_B_2_2', name: 'War Banner', tier: 2, branch: 'B', cost: 1, levelReq: 5,
                  effect: 'On kill, all hero-equipped allies gain +6% ATK for 4s',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      combatEvents.on('unitKilled', function(p) {
                          if (unit.hp <= 0 || p.killer !== unit) return;
                          var equipped = heroEquippedAllies(unit);
                          for (var i = 0; i < equipped.length; i++) addStatus(equipped[i], 'atkBuff', 4, 0.06, unit);
                      });
                  } }
            ],
            3: [
                { id: 'voss_B_3_1', name: 'Dominate', tier: 3, branch: 'B', cost: 2, levelReq: 9,
                  effect: 'On kill, you gain +4% permanent ATK for the rest of combat (stacks infinitely)',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var stacks = 0;
                      combatEvents.on('unitKilled', function(p) {
                          if (unit.hp <= 0 || p.killer !== unit) return;
                          stacks++;
                          heroSetAtkMod(unit, 'voss_B_3_1', stacks * 0.04);
                      });
                  } },
                { id: 'voss_B_3_2', name: 'Killing Spree', tier: 3, branch: 'B', cost: 2, levelReq: 9,
                  effect: 'Every kill refreshes your ability cooldown by 20% and grants +8% movement speed for 4s',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var expire = 0;
                      combatEvents.on('unitKilled', function(p) {
                          if (unit.hp <= 0 || p.killer !== unit) return;
                          if (unit.maxMana > 0) unit.currentMana = Math.min(unit.maxMana, unit.currentMana + Math.floor(unit.maxMana * 0.20));
                          expire = combatState.elapsed + 4;
                      });
                      combatEvents.on('tick', function() {
                          heroSetMoveSpeedMod(unit, 'voss_B_3_2', combatState.elapsed < expire ? 0.08 : 0);
                      });
                  } }
            ],
            4: [
                { id: 'voss_B_4_1', name: 'Execution Cascade', tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'Every 2nd kill triggers a shockwave: 180% ATK damage to all enemies within 2 cells, and you gain +12% permanent ATK',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var killCount = 0, stacks = 0;
                      combatEvents.on('unitKilled', function(p) {
                          if (unit.hp <= 0 || p.killer !== unit || !p.victim) return;
                          killCount++;
                          if (killCount % 2 !== 0) return;
                          stacks++;
                          heroSetAtkMod(unit, 'voss_B_4_1', stacks * 0.12);
                          var enemyPool = heroSideEnemies(unit).filter(function(u) { return u.hp > 0; });
                          var nearby = getUnitsInRadius(p.victim.gridRow, p.victim.gridCol, 2, enemyPool);
                          for (var i = 0; i < nearby.length; i++) {
                              dealDamage(unit, nearby[i], Math.floor(unit.attack * 1.80), {isTrueDamage: true, triggerOnHit: false});
                          }
                      });
                  } },
                { id: 'voss_B_4_2', name: "Conqueror's Aura", tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'On kill, gain +8% ATK, and all allies within 2 cells gain +5% ATK for 5s. After 3 kills, your next ability refunds 50% mana',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var killCount = 0, refundArmed = false;
                      combatEvents.on('unitKilled', function(p) {
                          if (unit.hp <= 0 || p.killer !== unit) return;
                          addStatus(unit, 'atkBuff', 5, 0.08, unit);
                          var nearby = heroAlliesInRadius(unit, 2, false);
                          for (var i = 0; i < nearby.length; i++) addStatus(nearby[i], 'atkBuff', 5, 0.05, unit);
                          killCount++;
                          if (killCount >= 3) { killCount = 0; refundArmed = true; }
                      });
                      combatEvents.on('abilityCast', function(p) {
                          if (p.caster !== unit || !refundArmed) return;
                          refundArmed = false;
                          unit._heroPendingManaRefund = 0.50;
                      });
                  } }
            ],
            5: [
                { id: 'voss_B_5_1', name: 'Conqueror', tier: 5, branch: 'B', cost: 5, levelReq: 17,
                  effect: 'Every 3rd kill triggers a shockwave: 200% ATK damage to all enemies within 2 cells, and all allies gain +12% ATK for 4s. Additional kills grant you +3% permanent ATK',
                  apply: function(unit, hero) {},
                  register: function(unit, hero) {
                      var killCount = 0, stacks = 0;
                      combatEvents.on('unitKilled', function(p) {
                          if (unit.hp <= 0 || p.killer !== unit) return;
                          killCount++;
                          stacks++;
                          heroSetAtkMod(unit, 'voss_B_5_1', stacks * 0.03);
                          if (killCount % 3 !== 0 || !p.victim) return;
                          var enemyPool = heroSideEnemies(unit).filter(function(u) { return u.hp > 0; });
                          var nearby = getUnitsInRadius(p.victim.gridRow, p.victim.gridCol, 2, enemyPool);
                          for (var i = 0; i < nearby.length; i++) {
                              dealDamage(unit, nearby[i], Math.floor(unit.attack * 2.00), {isTrueDamage: true, triggerOnHit: false});
                          }
                          var allies = heroSideAllies(unit).filter(function(u) { return u.hp > 0; });
                          for (var j = 0; j < allies.length; j++) addStatus(allies[j], 'atkBuff', 4, 0.12, unit);
                      });
                  } }
            ]
        }
    }
};

// ---- XP Table: 20 levels ----

var HERO_XP_TABLE = [
    0,       // L1
    100,     // L2
    175,     // L3
    289,     // L4
    478,     // L5
    790,     // L6
    1303,    // L7
    2154,    // L8
    3556,    // L9
    5868,    // L10
    9679,    // L11
    15971,   // L12
    26353,   // L13
    43482,   // L14
    71745,   // L15
    118379,  // L16
    195226,  // L17
    322123,  // L18
    531203,  // L19
    876135   // L20
];

function getHeroXPForLevel(level) {
    return HERO_XP_TABLE[Math.max(0, Math.min(19, level - 1))] || 0;
}

function getHeroXPToNext(level) {
    if (level >= HERO_LEVEL_CAP) return Infinity;
    return getHeroXPForLevel(level + 1);
}

// ---- Tier Cost & Level Requirement Helpers ----

function getHeroSkillCost(tier) {
    var costs = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 5 };
    return costs[tier] || 0;
}

function getHeroTierLevelReq(tier) {
    var reqs = { 1: 1, 2: 5, 3: 9, 4: 13, 5: 17 };
    return reqs[tier] || 1;
}

// ---- Node Lookup ----

var _heroNodeCache = null;

function findNodeById(nodeId) {
    // Build cache on first use
    if (!_heroNodeCache) {
        _heroNodeCache = {};
        for (var hKey in HERO_SKILL_TREES) {
            for (var branch in HERO_SKILL_TREES[hKey]) {
                for (var tier in HERO_SKILL_TREES[hKey][branch]) {
                    var tierNodes = HERO_SKILL_TREES[hKey][branch][tier];
                    for (var ni = 0; ni < tierNodes.length; ni++) {
                        _heroNodeCache[tierNodes[ni].id] = tierNodes[ni];
                    }
                }
            }
        }
    }
    return _heroNodeCache[nodeId] || null;
}

// ---- Hero State Accessors ----

function getHeroState(sd, heroKey) {
    if (!sd.heroes || !sd.heroes.data || !sd.heroes.data[heroKey]) {
        return null;
    }
    return sd.heroes.data[heroKey];
}

function getHeroLevel(sd, heroKey) {
    var state = getHeroState(sd, heroKey);
    return state ? state.level : 1;
}

function getHeroPointsSpent(heroState) {
    if (!heroState || !heroState.investedNodes) return 0;
    var spent = 0;
    for (var i = 0; i < heroState.investedNodes.length; i++) {
        var node = findNodeById(heroState.investedNodes[i]);
        if (node) spent += node.cost;
    }
    return spent;
}

// ---- Hero Availability ----

function getHeroAvailability(region) {
    var avail = { available: [], unavailable: [], returning: [] };
    for (var hKey in HERO_DATA) {
        var hero = HERO_DATA[hKey];
        var avl = hero.availability;

        if (avl.acquiredRegion <= region) {
            if (avl.lostRegion && avl.lostRegion <= region) {
                if (avl.returnsRegion && avl.returnsRegion <= region) {
                    avail.available.push(hKey);
                    avail.returning.push(hKey);
                } else {
                    avail.unavailable.push(hKey);
                }
            } else {
                avail.available.push(hKey);
            }
        } else {
            avail.unavailable.push(hKey);
        }
    }
    return avail;
}

function isHeroAvailable(sd, heroKey) {
    var heroState = getHeroState(sd, heroKey);
    if (!heroState) return false;
    if (heroState.isDead) return false;

    var heroData = HERO_DATA[heroKey];
    if (!heroData) return false;

    // Determine current region from save
    var currentRegion = getCurrentRegion(sd);

    var avl = heroData.availability;
    if (avl.acquiredRegion > currentRegion) return false;
    if (avl.lostRegion && avl.lostRegion <= currentRegion) {
        if (avl.returnsRegion && avl.returnsRegion <= currentRegion) {
            return true;
        }
        return false;
    }
    return true;
}

function getCurrentRegion(sd) {
    // Determine highest region with any progress
    if (!sd.missions || !sd.missions.regionProgress) return 1;
    var highest = 1;
    for (var r = 8; r >= 1; r--) {
        var rp = sd.missions.regionProgress[r];
        if (rp && rp.completed && rp.completed.length > 0) {
            highest = r;
            break;
        }
    }
    return highest;
}

// ---- Hero Assignment ----

function getHeroForUnit(saveData, unitId) {
    if (!saveData.heroes || !saveData.heroes.data) return null;
    var heroKeys = Object.keys(saveData.heroes.data);
    for (var i = 0; i < heroKeys.length; i++) {
        var h = saveData.heroes.data[heroKeys[i]];
        if (h.assignedUnit === unitId) {
            return { key: heroKeys[i], data: h, def: HERO_DATA[heroKeys[i]] };
        }
    }
    return null;
}

function getHeroKeyForUnit(saveData, unitId) {
    var hero = getHeroForUnit(saveData, unitId);
    return hero ? hero.key : null;
}

function assignHeroToUnit(saveData, heroKey, unitKey) {
    if (!saveData.heroes || !saveData.heroes.data || !saveData.heroes.data[heroKey]) return false;
    var hero = saveData.heroes.data[heroKey];

    // Unassign from previous unit — auto-unequip items
    if (hero.assignedUnit && hero.assignedUnit !== unitKey) {
        if (typeof getEquippedItems === 'function' && typeof unequipItem === 'function') {
            var prevItems = getEquippedItems(saveData, hero.assignedUnit);
            for (var pi = 0; pi < prevItems.length; pi++) {
                unequipItem(saveData, prevItems[pi].id);
            }
        }
    }

    // Unassign any hero from target unit
    var existingKey = getHeroKeyForUnit(saveData, unitKey);
    if (existingKey && existingKey !== heroKey) {
        unassignHero(saveData, existingKey);
    }

    hero.assignedUnit = unitKey;
    autoSave(saveData);
    return true;
}

function unassignHero(saveData, heroKey) {
    if (!saveData.heroes || !saveData.heroes.data || !saveData.heroes.data[heroKey]) return false;
    var hero = saveData.heroes.data[heroKey];
    if (!hero.assignedUnit) return false;

    // Auto-unequip items
    if (typeof getEquippedItems === 'function' && typeof unequipItem === 'function') {
        var items = getEquippedItems(saveData, hero.assignedUnit);
        for (var i = 0; i < items.length; i++) {
            unequipItem(saveData, items[i].id);
        }
    }

    hero.assignedUnit = null;
    autoSave(saveData);
    return true;
}

// ---- Skill Point Investment ----

function canUnlockNode(sd, heroKey, nodeId) {
    var state = getHeroState(sd, heroKey);
    if (!state) return false;
    if (state.isDead) return false;

    var node = findNodeById(nodeId);
    if (!node) return false;

    // Already invested
    if (state.investedNodes && state.investedNodes.indexOf(nodeId) >= 0) return false;

    // Check level requirement
    if (state.level < node.levelReq) return false;

    // Check point budget
    var pointsSpent = getHeroPointsSpent(state);
    var pointsAvailable = 20 - pointsSpent;
    if (pointsAvailable < node.cost) return false;

    // Check tier progression: must have at least 1 node from previous tier in same branch
    if (node.tier > 1) {
        var prevTierNodes = HERO_SKILL_TREES[heroKey][node.branch][node.tier - 1];
        if (!prevTierNodes) return false;
        var hasPrevTier = false;
        for (var pt = 0; pt < prevTierNodes.length; pt++) {
            if (state.investedNodes && state.investedNodes.indexOf(prevTierNodes[pt].id) >= 0) {
                hasPrevTier = true;
                break;
            }
        }
        if (!hasPrevTier) return false;
    }

    return true;
}

function investPoint(sd, heroKey, nodeId) {
    var state = getHeroState(sd, heroKey);
    if (!state || !canUnlockNode(sd, heroKey, nodeId)) return false;

    if (!state.investedNodes) state.investedNodes = [];
    if (state.investedNodes.indexOf(nodeId) < 0) {
        state.investedNodes.push(nodeId);
    }

    saveGame(sd);
    return true;
}

function respecHero(sd, heroKey) {
    var state = getHeroState(sd, heroKey);
    if (!state) return false;

    var cost = 500 + (state.respecCount || 0) * 500;
    if (sd.player.veilEssence < cost) return false;

    sd.player.veilEssence -= cost;
    if (!sd.stats) sd.stats = {};
    if (!sd.stats.totalVeilEssenceSpent) sd.stats.totalVeilEssenceSpent = 0;
    sd.stats.totalVeilEssenceSpent += cost;

    state.investedNodes = [];
    state.respecCount = (state.respecCount || 0) + 1;

    saveGame(sd);
    return true;
}

// ---- Hero XP ----

function heroGainXP(sd, heroKey, amount) {
    var state = getHeroState(sd, heroKey);
    if (!state || state.isDead) return 0;
    if (state.level >= HERO_LEVEL_CAP) return 0;

    state.xp = (state.xp || 0) + amount;
    var levelsGained = 0;

    while (state.level < HERO_LEVEL_CAP && state.xp >= getHeroXPForLevel(state.level + 1)) {
        state.xp -= getHeroXPForLevel(state.level + 1);
        state.level += 1;
        levelsGained++;
    }

    if (state.level >= HERO_LEVEL_CAP) {
        state.xp = 0;
    }

    return levelsGained;
}

function getMissionHeroXP(regionNumber, isBoss) {
    if (typeof getMissionUnitXP === 'function') {
        var baseXP = getMissionUnitXP(regionNumber, isBoss);
        return Math.floor(baseXP * 1.5);
    }
    return Math.floor(regionNumber * 15 * 1.5);
}

function grantHeroXPForMission(saveData, regionNumber, isBoss) {
    if (!saveData.heroes || !saveData.heroes.data) return [];
    var heroXP = getMissionHeroXP(regionNumber, isBoss);
    var levelUps = [];
    var activeTeam = getActiveTeam(saveData);
    if (!activeTeam || !activeTeam.slots) return levelUps;

    for (var i = 0; i < activeTeam.slots.length; i++) {
        var slot = activeTeam.slots[i];
        if (!slot) continue;
        var heroInfo = getHeroForUnit(saveData, slot.key);
        if (!heroInfo) continue;
        var hero = heroInfo.data;
        if (hero.isDead) continue;
        var oldLevel = hero.level;
        var gained = heroGainXP(saveData, heroInfo.key, heroXP);
        if (gained > 0) {
            levelUps.push({ heroKey: heroInfo.key, name: heroInfo.def.name, oldLevel: oldLevel, newLevel: hero.level });
        }
    }
    return levelUps;
}

// ---- Lyric Death ----

function triggerLyricDeath(sd) {
    if (!sd.heroes || !sd.heroes.data || !sd.heroes.data.lyric) return;

    var lyricState = sd.heroes.data.lyric;
    lyricState.isDead = true;

    // Unassign from unit and remove items
    if (lyricState.assignedUnit) {
        if (typeof getEquippedItems === 'function' && typeof unequipItem === 'function') {
            var items = getEquippedItems(sd, lyricState.assignedUnit);
            for (var i = 0; i < items.length; i++) {
                unequipItem(sd, items[i].id);
            }
        }
        lyricState.assignedUnit = null;
    }

    // Invested nodes preserved for ending reference

    saveGame(sd);
}

// ---- Hero Unlock Checks ----

function checkHeroUnlocks(saveData, completedStageId) {
    if (!saveData.heroes || !saveData.heroes.data) return [];
    var unlocked = [];

    // R2 boss: unlock Ren
    if (completedStageId === 'r2_boss') {
        if (!saveData.heroes.data.ren || saveData.heroes.data.ren._unlocked === false) {
            // Ren data should already exist in save, just mark as unlocked
            if (saveData.heroes.data.ren) {
                delete saveData.heroes.data.ren._unlocked;
                unlocked.push({ type: 'unlock', heroKey: 'ren', name: 'Ren' });
            }
        }
    }

    // R3 early: unlock Sera and Maren
    if (completedStageId === 'r3_s1' || completedStageId === 'r3_s2') {
        if (saveData.heroes.data.sera && saveData.heroes.data.sera._unlocked === false) {
            delete saveData.heroes.data.sera._unlocked;
            unlocked.push({ type: 'unlock', heroKey: 'sera', name: 'Sera' });
        }
        if (saveData.heroes.data.maren && saveData.heroes.data.maren._unlocked === false) {
            delete saveData.heroes.data.maren._unlocked;
            unlocked.push({ type: 'unlock', heroKey: 'maren', name: 'Maren' });
        }
    }

    // R4 mid: Lyric dies, Sera and Maren leave
    if (completedStageId === 'r4_s3' || completedStageId === 'r4_mid') {
        if (saveData.heroes.data.lyric && !saveData.heroes.data.lyric.isDead) {
            triggerLyricDeath(saveData);
            unlocked.push({ type: 'death', heroKey: 'lyric', name: 'Lyric', message: 'Lyric has fallen...' });
        }
        // Sera and Maren leave
        if (saveData.heroes.data.sera && saveData.heroes.data.sera.assignedUnit) {
            if (typeof getEquippedItems === 'function' && typeof unequipItem === 'function') {
                var seraItems = getEquippedItems(saveData, saveData.heroes.data.sera.assignedUnit);
                for (var si = 0; si < seraItems.length; si++) unequipItem(saveData, seraItems[si].id);
            }
            saveData.heroes.data.sera.assignedUnit = null;
            saveData.heroes.data.sera._away = true;
            unlocked.push({ type: 'leave', heroKey: 'sera', name: 'Sera', message: 'Sera has left the party.' });
        }
        if (saveData.heroes.data.maren && saveData.heroes.data.maren.assignedUnit) {
            if (typeof getEquippedItems === 'function' && typeof unequipItem === 'function') {
                var marenItems = getEquippedItems(saveData, saveData.heroes.data.maren.assignedUnit);
                for (var mi = 0; mi < marenItems.length; mi++) unequipItem(saveData, marenItems[mi].id);
            }
            saveData.heroes.data.maren.assignedUnit = null;
            saveData.heroes.data.maren._away = true;
            unlocked.push({ type: 'leave', heroKey: 'maren', name: 'Maren', message: 'Maren has left the party.' });
        }
    }

    // R5 early: Maren returns
    if (completedStageId === 'r5_s1' || completedStageId === 'r5_s2') {
        if (saveData.heroes.data.maren && saveData.heroes.data.maren._away) {
            delete saveData.heroes.data.maren._away;
            unlocked.push({ type: 'return', heroKey: 'maren', name: 'Maren', message: 'Maren has returned!' });
        }
    }

    // R5 late: Sera returns
    if (completedStageId === 'r5_s4' || completedStageId === 'r5_boss') {
        if (saveData.heroes.data.sera && saveData.heroes.data.sera._away) {
            delete saveData.heroes.data.sera._away;
            unlocked.push({ type: 'return', heroKey: 'sera', name: 'Sera', message: 'Sera has returned!' });
        }
    }

    // R7 early: unlock Voss
    if (completedStageId === 'r7_s1' || completedStageId === 'r7_s2') {
        if (saveData.heroes.data.voss && saveData.heroes.data.voss._unlocked === false) {
            delete saveData.heroes.data.voss._unlocked;
            // Set Voss level to average hero level - 2
            var totalLevel = 0;
            var heroCount = 0;
            for (var hk in saveData.heroes.data) {
                var hs = saveData.heroes.data[hk];
                if (!hs.isDead && hs._unlocked !== false && hk !== 'voss') {
                    totalLevel += hs.level;
                    heroCount++;
                }
            }
            if (heroCount > 0) {
                saveData.heroes.data.voss.level = Math.max(1, Math.floor(totalLevel / heroCount) - 2);
            }
            unlocked.push({ type: 'unlock', heroKey: 'voss', name: 'Voss' });
        }
    }

    return unlocked;
}

// ---- Available Heroes (for UI) ----

function getAvailableHeroes(saveData) {
    if (!saveData.heroes || !saveData.heroes.data) return [];
    var available = [];
    for (var hk in saveData.heroes.data) {
        var hState = saveData.heroes.data[hk];
        var hDef = HERO_DATA[hk];
        if (!hDef) continue;
        if (hState._unlocked === false) continue;
        if (hState._away) continue;
        available.push({ key: hk, hero: hState, def: hDef, isDead: !!hState.isDead });
    }
    return available;
}

// ---- Combat Integration: Apply Hero Stat Bonuses ----

function applyHeroStatBonuses(unit, heroKey, heroData) {
    if (!heroData || !heroData.investedNodes || !HERO_SKILL_TREES[heroKey]) return;

    for (var i = 0; i < heroData.investedNodes.length; i++) {
        var nodeId = heroData.investedNodes[i];
        var node = findNodeById(nodeId);
        if (node && typeof node.apply === 'function') {
            node.apply(unit, heroData);
        }
    }
}

// ---- Combat Integration: Register Event-Driven Hero Skill Nodes (Prompt 60) ----
//
// Called once per unit per wave (from initCombat, js/combat-core.js) right
// after applyHeroStatBonuses(). Every invested node with a `register`
// function gets to attach listeners to the shared `combatEvents` bus (reset
// fresh each wave — see initCombat). Nodes with only `apply` (flat instant
// stat bonuses) are skipped here; nodes with only `register` are skipped by
// applyHeroStatBonuses's `apply` check above (their `apply` is a no-op).

function registerHeroSkillEvents(unit, heroKey, heroData) {
    if (!heroData || !heroData.investedNodes || !HERO_SKILL_TREES[heroKey]) return;
    if (typeof combatEvents === 'undefined') return;

    for (var i = 0; i < heroData.investedNodes.length; i++) {
        var nodeId = heroData.investedNodes[i];
        var node = findNodeById(nodeId);
        if (node && typeof node.register === 'function') {
            node.register(unit, heroData, heroKey);
        }
    }
}

// ---- Hero Skill Combat Helpers (Prompt 60) ----
//
// Small, reusable primitives that node `register()` functions build on. Kept
// side-effect-free except the heroSet*Mod family, which centralizes dynamic
// (event/tick-driven) percentage modifiers into a single per-unit, per-stat
// accumulator so that multiple hero nodes affecting the same stat on the
// same unit sum correctly instead of stomping/compounding each other. Each
// accumulator's "base" value is captured lazily on first use within a wave
// and reset every wave in initCombat (js/combat-core.js) — see the reset
// block there for why that ordering is safe.

function heroSideAllies(unit) {
    if (!combatState) return [];
    return unit.side === 'player' ? combatState.playerUnits : combatState.enemyUnits;
}

function heroSideEnemies(unit) {
    if (!combatState) return [];
    return unit.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
}

function heroIsAdjacent(a, b) {
    if (!a || !b || a.gridRow === undefined || b.gridRow === undefined) return false;
    return getManhattanDist(a.gridRow, a.gridCol, b.gridRow, b.gridCol) === 1;
}

function heroAdjacentAllies(unit) {
    if (!combatState || typeof getUnitsInRadius !== 'function') return [];
    var pool = heroSideAllies(unit).filter(function(u) { return u !== unit && u.hp > 0; });
    return getUnitsInRadius(unit.gridRow, unit.gridCol, 1, pool);
}

// includeSelf: whether `unit` itself may appear in the result if in range.
function heroAlliesInRadius(unit, radius, includeSelf) {
    if (!combatState || typeof getUnitsInRadius !== 'function') return [];
    var pool = heroSideAllies(unit).filter(function(u) { return (includeSelf || u !== unit) && u.hp > 0; });
    return getUnitsInRadius(unit.gridRow, unit.gridCol, radius, pool);
}

function heroEquippedAllies(unit) {
    return heroSideAllies(unit).filter(function(u) { return u.hp > 0 && u._heroKey; });
}

function heroSetAtkMod(unit, key, pct) {
    if (!unit._heroBaseAtk) unit._heroBaseAtk = unit.attack;
    if (!unit._heroAtkMods) unit._heroAtkMods = {};
    unit._heroAtkMods[key] = pct;
    var total = 0;
    for (var k in unit._heroAtkMods) total += unit._heroAtkMods[k];
    unit.attack = Math.floor(unit._heroBaseAtk * (1 + total));
}

function heroSetDrMod(unit, key, pct) {
    if (unit._heroBaseDr === undefined) unit._heroBaseDr = unit.damageReduction || 0;
    if (!unit._heroDrMods) unit._heroDrMods = {};
    unit._heroDrMods[key] = pct;
    var total = 0;
    for (var k in unit._heroDrMods) total += unit._heroDrMods[k];
    unit.damageReduction = unit._heroBaseDr + total;
}

// attackSpd: lower = faster in this engine. pct positive = faster attacks.
function heroSetAtkSpdMod(unit, key, pct) {
    if (!unit._heroBaseAtkSpd) unit._heroBaseAtkSpd = unit.attackSpd;
    if (!unit._heroAtkSpdMods) unit._heroAtkSpdMods = {};
    unit._heroAtkSpdMods[key] = pct;
    var total = 0;
    for (var k in unit._heroAtkSpdMods) total += unit._heroAtkSpdMods[k];
    total = Math.min(total, 0.85);
    unit.attackSpd = Math.max(0.2, unit._heroBaseAtkSpd * (1 - total));
}

function heroSetLifestealMod(unit, key, pct) {
    if (unit._heroBaseLifesteal === undefined) unit._heroBaseLifesteal = unit.lifesteal || 0;
    if (!unit._heroLifestealMods) unit._heroLifestealMods = {};
    unit._heroLifestealMods[key] = pct;
    var total = unit._heroBaseLifesteal;
    for (var k in unit._heroLifestealMods) total += unit._heroLifestealMods[k];
    unit.lifesteal = total;
}

// Generic "% damage dealt" accumulator, consumed in js/combat-damage.js dealDamage().
function heroSetDmgDealtMod(unit, key, pct) {
    if (!unit._heroDmgDealtMods) unit._heroDmgDealtMods = {};
    unit._heroDmgDealtMods[key] = pct;
    var total = 0;
    for (var k in unit._heroDmgDealtMods) total += unit._heroDmgDealtMods[k];
    unit._heroDmgDealtTotal = total;
}

// Generic "% ability damage dealt" accumulator, consumed in js/combat-damage.js dealDamage().
function heroSetAbilityDmgMod(unit, key, pct) {
    if (!unit._heroAbilityDmgMods) unit._heroAbilityDmgMods = {};
    unit._heroAbilityDmgMods[key] = pct;
    var total = 0;
    for (var k in unit._heroAbilityDmgMods) total += unit._heroAbilityDmgMods[k];
    unit._heroAbilityDmgTotal = total;
}

// Move speed % accumulator, consumed in js/combat-core.js getMoveSpeed().
function heroSetMoveSpeedMod(unit, key, pct) {
    if (!unit._heroMoveSpeedMods) unit._heroMoveSpeedMods = {};
    unit._heroMoveSpeedMods[key] = pct;
    var total = 0;
    for (var k in unit._heroMoveSpeedMods) total += unit._heroMoveSpeedMods[k];
    unit._heroMoveSpeedBonus = total;
}

// Resolves the strongest active Maren Sanctuary zone (maren_B_4_2 / maren_B_5_1)
// covering `target`, if any. Only ever non-null for player-side units, and
// only when a hero has invested one of those two nodes — undefined/no-op for
// every golden (hero-less) scenario.
function heroSanctuaryStateFor(target) {
    if (!combatState || target.side !== 'player') return null;
    var now = combatState.elapsed;
    var best = null;
    var sources = combatState.playerUnits;
    for (var i = 0; i < sources.length; i++) {
        var src = sources[i];
        if (src.hp <= 0) continue;
        var active = null;
        if (src._heroSanctuaryCapstoneUntil && now < src._heroSanctuaryCapstoneUntil &&
            heroAlliesInRadius(src, 2, true).indexOf(target) >= 0) {
            active = { dmgReduction: 0.28, healMult: 3 };
        } else if (src._heroSanctuaryUntil && now < src._heroSanctuaryUntil &&
            heroAlliesInRadius(src, 2, true).indexOf(target) >= 0) {
            active = { dmgReduction: 0.18, healMult: 2 };
        }
        if (active && (!best || active.dmgReduction > best.dmgReduction)) best = active;
    }
    return best;
}

// ---- Respec Cost Helper ----

function getRespecCost(heroOrState) {
    var respecCount = 0;
    if (heroOrState && typeof heroOrState.respecCount === 'number') {
        respecCount = heroOrState.respecCount;
    }
    return 500 + respecCount * 500;
}

// ---- Legacy Compat Stubs (old functions still called from other files) ----
// These maintain backward compatibility during transition

function getHeroSkillEffects(hero) {
    // New system uses investedNodes + node.apply() instead of aggregated effects
    // Return empty object for compat
    return {};
}

function getFragmentSkillEffects() {
    return {};
}

function createHero(heroKey) {
    return {
        key: heroKey,
        level: 1,
        xp: 0,
        assignedUnit: null,
        investedNodes: [],
        respecCount: 0,
        isDead: false
    };
}

function grantHeroXP(hero, amount) {
    // Legacy compat — use heroGainXP instead
    return 0;
}

function allocateSkillPoint() { return false; }
function deallocateAllSkillPoints(hero) {
    if (hero) {
        hero.investedNodes = [];
    }
}
function getHeroNodeMap() { return {}; }

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
                  apply: function(unit, hero) {} },
                { id: 'kael_A_1_2', name: 'Frontline Defender', tier: 1, branch: 'A', cost: 1, levelReq: 1,
                  effect: 'You gain +8% DR when at least 1 ally is behind you (further from enemy spawn)',
                  apply: function(unit, hero) {
                      if (!unit.heroSkillBonuses) unit.heroSkillBonuses = {};
                      unit.heroSkillBonuses.frontlineDefenderDR = 0.08;
                  } }
            ],
            2: [
                { id: 'kael_A_2_1', name: 'Retribution', tier: 2, branch: 'A', cost: 1, levelReq: 5,
                  effect: 'When an adjacent ally takes damage, your next attack deals +15% bonus damage',
                  apply: function(unit, hero) {} },
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
                  apply: function(unit, hero) {} },
                { id: 'kael_A_3_2', name: 'Protective Stance', tier: 3, branch: 'A', cost: 2, levelReq: 9,
                  effect: 'You gain +8% DR. This increases to +15% DR when any adjacent ally is below 50% HP',
                  apply: function(unit, hero) {
                      unit.damageReduction = (unit.damageReduction || 0) + 0.08;
                  } }
            ],
            4: [
                { id: 'kael_A_4_1', name: 'Last Defender', tier: 4, branch: 'A', cost: 4, levelReq: 13,
                  effect: 'When you are the last surviving hero-equipped unit, gain +25% ATK and +18% DR for 8s',
                  apply: function(unit, hero) {} },
                { id: 'kael_A_4_2', name: 'Coordinated Defense', tier: 4, branch: 'A', cost: 4, levelReq: 13,
                  effect: 'When you cast an ability, all adjacent allies gain +12% DR for 3s',
                  apply: function(unit, hero) {} }
            ],
            5: [
                { id: 'kael_A_5_1', name: 'Unbreakable Oath', tier: 5, branch: 'A', cost: 5, levelReq: 17,
                  effect: 'Once per combat, when any hero-equipped ally would die, you absorb the killing blow instead (you take the damage, ally survives at 1 HP). You gain 50% DR for 3s after triggering',
                  apply: function(unit, hero) {} }
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
                  apply: function(unit, hero) {} }
            ],
            2: [
                { id: 'kael_B_2_1', name: 'Unified Defense', tier: 2, branch: 'B', cost: 1, levelReq: 5,
                  effect: 'All hero-equipped allies gain +5% CC resistance',
                  apply: function(unit, hero) {} },
                { id: 'kael_B_2_2', name: 'Shared Resolve', tier: 2, branch: 'B', cost: 1, levelReq: 5,
                  effect: 'When any ally dies, all surviving hero-equipped allies gain +6% ATK for 8s (stacks)',
                  apply: function(unit, hero) {} }
            ],
            3: [
                { id: 'kael_B_3_1', name: 'Tactical Positioning', tier: 3, branch: 'B', cost: 2, levelReq: 9,
                  effect: 'You gain +12% ATK if in front row, +12% DR if in back row. Adjacent allies gain half this bonus',
                  apply: function(unit, hero) {} },
                { id: 'kael_B_3_2', name: 'Coordinated Strike', tier: 3, branch: 'B', cost: 2, levelReq: 9,
                  effect: 'When you attack a target, nearest hero-equipped ally targeting the same enemy gains +8% ATK',
                  apply: function(unit, hero) {} }
            ],
            4: [
                { id: 'kael_B_4_1', name: 'Stalwart Bond', tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'All allies within 2 cells gain +6% DR. When you take damage, this aura radius expands to 3 cells for 2s',
                  apply: function(unit, hero) {} },
                { id: 'kael_B_4_2', name: 'Inspiring Leader', tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'When you cast an ability, all hero-equipped allies gain +8% ATK and +6% ability damage for 4s',
                  apply: function(unit, hero) {} }
            ],
            5: [
                { id: 'kael_B_5_1', name: 'Supreme Command', tier: 5, branch: 'B', cost: 5, levelReq: 17,
                  effect: 'Once per combat, activate to give all allies +18% ATK, +12% DR, and CC immunity for 4s',
                  apply: function(unit, hero) {} }
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
                  apply: function(unit, hero) {} }
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
                  apply: function(unit, hero) {} }
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
                  apply: function(unit, hero) {} },
                { id: 'lyric_B_1_2', name: 'Resource Extraction', tier: 1, branch: 'B', cost: 1, levelReq: 1,
                  effect: 'On kill, restore 18% max mana',
                  apply: function(unit, hero) {} }
            ],
            2: [
                { id: 'lyric_B_2_1', name: 'Exploit Weakness', tier: 2, branch: 'B', cost: 1, levelReq: 5,
                  effect: 'You deal +15% damage to targets below 40% HP',
                  apply: function(unit, hero) {} },
                { id: 'lyric_B_2_2', name: 'Synergy Amplifier', tier: 2, branch: 'B', cost: 1, levelReq: 5,
                  effect: 'You count as +1 toward your primary archetype synergy',
                  apply: function(unit, hero) {
                      if (!unit.heroSkillBonuses) unit.heroSkillBonuses = {};
                      unit.heroSkillBonuses.extraArchetypeCount = 1;
                  } }
            ],
            3: [
                { id: 'lyric_B_3_1', name: 'Chain Efficiency', tier: 3, branch: 'B', cost: 2, levelReq: 9,
                  effect: 'On kill, nearest ally gains +10% ATK for 3s',
                  apply: function(unit, hero) {} },
                { id: 'lyric_B_3_2', name: 'Momentum', tier: 3, branch: 'B', cost: 2, levelReq: 9,
                  effect: 'On kill, you gain +8% ATK speed for 4s (stacks up to 5 times)',
                  apply: function(unit, hero) {} }
            ],
            4: [
                { id: 'lyric_B_4_1', name: 'Execution Bonus', tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'Your first 3 kills each combat restore 100% mana and grant +15% ATK for 5s',
                  apply: function(unit, hero) {} },
                { id: 'lyric_B_4_2', name: 'Hunting Bonus', tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'You gain +1% ATK per kill this combat, stacking infinitely (resets each new combat)',
                  apply: function(unit, hero) {} }
            ],
            5: [
                { id: 'lyric_B_5_1', name: "Utilitarian's Gift", tier: 5, branch: 'B', cost: 5, levelReq: 17,
                  effect: 'All hero-equipped allies gain +10% ATK and +10% ability damage. On your death, these bonuses double for 8s',
                  apply: function(unit, hero) {} }
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
                  apply: function(unit, hero) {} }
            ],
            2: [
                { id: 'ren_A_2_1', name: 'Endurance', tier: 2, branch: 'A', cost: 1, levelReq: 5,
                  effect: 'You gain +1.2% max HP regen per second (stacks with other regen)',
                  apply: function(unit, hero) {} },
                { id: 'ren_A_2_2', name: 'Absorption', tier: 2, branch: 'A', cost: 1, levelReq: 5,
                  effect: 'After taking 5 hits, you gain a shield equal to 14% max HP (refreshes after shield breaks + 5 more hits)',
                  apply: function(unit, hero) {} }
            ],
            3: [
                { id: 'ren_A_3_1', name: 'Stone Patience', tier: 3, branch: 'A', cost: 2, levelReq: 9,
                  effect: 'You gain +1% DR per 10 seconds of combat survived (caps at +10% at 100s)',
                  apply: function(unit, hero) {} },
                { id: 'ren_A_3_2', name: 'Thick Hide', tier: 3, branch: 'A', cost: 2, levelReq: 9,
                  effect: 'You gain +8% DR. This increases by +1% for every 10% HP you are missing',
                  apply: function(unit, hero) {
                      unit.damageReduction = (unit.damageReduction || 0) + 0.08;
                  } }
            ],
            4: [
                { id: 'ren_A_4_1', name: 'Unmovable Force', tier: 4, branch: 'A', cost: 4, levelReq: 13,
                  effect: 'You gain +15% damage reduction and cannot be slowed below 50% of normal movement speed',
                  apply: function(unit, hero) {
                      unit.damageReduction = (unit.damageReduction || 0) + 0.15;
                  } },
                { id: 'ren_A_4_2', name: 'Last Stand', tier: 4, branch: 'A', cost: 4, levelReq: 13,
                  effect: 'When you drop below 20% HP, you gain a shield equal to 25% of the damage you absorbed this combat, up to 30% of your max HP',
                  apply: function(unit, hero) {} }
            ],
            5: [
                { id: 'ren_A_5_1', name: 'Immovable', tier: 5, branch: 'A', cost: 5, levelReq: 17,
                  effect: 'Once per combat, when you drop below 15% HP, become immune to damage for 3s and heal 25% max HP. Then gain +18% DR for the rest of combat',
                  apply: function(unit, hero) {} }
            ]
        },
        B: {
            1: [
                { id: 'ren_B_1_1', name: 'Steady Presence', tier: 1, branch: 'B', cost: 1, levelReq: 1,
                  effect: 'Adjacent allies gain +6% HP',
                  apply: function(unit, hero) {} },
                { id: 'ren_B_1_2', name: 'Damage Magnet', tier: 1, branch: 'B', cost: 1, levelReq: 1,
                  effect: 'You absorb 10% of damage dealt to adjacent allies',
                  apply: function(unit, hero) {} }
            ],
            2: [
                { id: 'ren_B_2_1', name: 'Calming Aura', tier: 2, branch: 'B', cost: 1, levelReq: 5,
                  effect: 'Adjacent allies gain +6% CC resistance',
                  apply: function(unit, hero) {} },
                { id: 'ren_B_2_2', name: 'Stubborn Guard', tier: 2, branch: 'B', cost: 1, levelReq: 5,
                  effect: "When an adjacent ally is CC'd, you gain +12% ATK for 5s",
                  apply: function(unit, hero) {} }
            ],
            3: [
                { id: 'ren_B_3_1', name: 'Loyal Shield', tier: 3, branch: 'B', cost: 2, levelReq: 9,
                  effect: 'When your shield (from any source) breaks, adjacent allies gain a shield equal to 8% of their max HP',
                  apply: function(unit, hero) {} },
                { id: 'ren_B_3_2', name: 'Protective Presence', tier: 3, branch: 'B', cost: 2, levelReq: 9,
                  effect: 'Adjacent allies gain +8% DR. This increases to +12% DR when you are below 40% HP',
                  apply: function(unit, hero) {} }
            ],
            4: [
                { id: 'ren_B_4_1', name: 'Guardian Pulse', tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'Every 6s, you heal the lowest-HP adjacent ally for 12% of your max HP. Nearby enemies lose 3% ATK for 4s',
                  apply: function(unit, hero) {} },
                { id: 'ren_B_4_2', name: 'Anchor Chain', tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'When an adjacent ally takes damage, they gain +8% DR for 4s and you gain +6% lifesteal for 4s',
                  apply: function(unit, hero) {} }
            ],
            5: [
                { id: 'ren_B_5_1', name: 'Unshakeable Bond', tier: 5, branch: 'B', cost: 5, levelReq: 17,
                  effect: 'All allies within 2 cells gain +10% DR. When you take damage, reduce it by 15% and grant nearby allies +5% DR for 3s',
                  apply: function(unit, hero) {} }
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
                  apply: function(unit, hero) {} },
                { id: 'sera_A_2_2', name: 'Critical Precision', tier: 2, branch: 'A', cost: 1, levelReq: 5,
                  effect: 'You gain +12% crit chance. Crits apply a mark: marked targets take +10% damage from all sources for 3s',
                  apply: function(unit, hero) {
                      unit.critChance = (unit.critChance || 0) + 0.12;
                  } }
            ],
            3: [
                { id: 'sera_A_3_1', name: 'Exploit Opening', tier: 3, branch: 'A', cost: 2, levelReq: 9,
                  effect: "When target is CC'd (stun/root/freeze), your next attack deals +28% damage",
                  apply: function(unit, hero) {} },
                { id: 'sera_A_3_2', name: 'Weak Point', tier: 3, branch: 'A', cost: 2, levelReq: 9,
                  effect: 'You deal +6% damage for every 5% missing HP your target has, up to +30%',
                  apply: function(unit, hero) {} }
            ],
            4: [
                { id: 'sera_A_4_1', name: 'Burst Window', tier: 4, branch: 'A', cost: 4, levelReq: 13,
                  effect: 'Your first 2 ability casts each combat are guaranteed crits and ignore 20% DR',
                  apply: function(unit, hero) {} },
                { id: 'sera_A_4_2', name: 'Priority Strike', tier: 4, branch: 'A', cost: 4, levelReq: 13,
                  effect: 'Your attacks against enemies below 50% HP deal +25% damage and apply a debuff that increases their damage taken by +8% for 4s',
                  apply: function(unit, hero) {} }
            ],
            5: [
                { id: 'sera_A_5_1', name: 'Death Sentence', tier: 5, branch: 'A', cost: 5, levelReq: 17,
                  effect: 'Your first ability cast each combat is a guaranteed crit, ignores 30% DR, and if it kills the target, refund 60% mana and grant +15% ATK for 5s',
                  apply: function(unit, hero) {} }
            ]
        },
        B: {
            1: [
                { id: 'sera_B_1_1', name: 'Target Caller', tier: 1, branch: 'B', cost: 1, levelReq: 1,
                  effect: 'When you attack a target, nearest ally targeting the same enemy gains +10% ATK',
                  apply: function(unit, hero) {} },
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
                  apply: function(unit, hero) {} },
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
                  apply: function(unit, hero) {} },
                { id: 'sera_B_3_2', name: 'Weakpoint Exposure', tier: 3, branch: 'B', cost: 2, levelReq: 9,
                  effect: 'When you crit, nearby allies gain +8% crit chance for 3s',
                  apply: function(unit, hero) {} }
            ],
            4: [
                { id: 'sera_B_4_1', name: 'Battle Coordination', tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'All hero-equipped allies within 2 cells gain +6% ATK. When you crit, they gain +10% ATK speed for 2s',
                  apply: function(unit, hero) {} },
                { id: 'sera_B_4_2', name: 'Killsteal Synergy', tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'When any hero-equipped ally scores a kill, you gain +8% ATK for 4s and your next ability deals +15% damage',
                  apply: function(unit, hero) {} }
            ],
            5: [
                { id: 'sera_B_5_1', name: 'Perfect Execution', tier: 5, branch: 'B', cost: 5, levelReq: 17,
                  effect: 'All hero-equipped allies gain +7% crit chance. When any hero-equipped ally scores a kill, all other hero-equipped allies gain +12% ATK speed for 3s',
                  apply: function(unit, hero) {} }
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
                  apply: function(unit, hero) {} }
            ],
            2: [
                { id: 'maren_A_2_1', name: 'Emergency Care', tier: 2, branch: 'A', cost: 1, levelReq: 5,
                  effect: 'Heals on targets below 30% HP are +28% stronger (applies to all heal sources on you and your targets)',
                  apply: function(unit, hero) {} },
                { id: 'maren_A_2_2', name: 'Lifesteal Amplifier', tier: 2, branch: 'A', cost: 1, levelReq: 5,
                  effect: "You gain +8% lifesteal. If you already have lifesteal, it's +8% stronger",
                  apply: function(unit, hero) {
                      unit.lifesteal = (unit.lifesteal || 0) + 0.08;
                  } }
            ],
            3: [
                { id: 'maren_A_3_1', name: 'Purify', tier: 3, branch: 'A', cost: 2, levelReq: 9,
                  effect: 'When you heal an ally (from any source), remove 1 debuff from the target',
                  apply: function(unit, hero) {} },
                { id: 'maren_A_3_2', name: 'Vital Bond', tier: 3, branch: 'A', cost: 2, levelReq: 9,
                  effect: 'When you heal an adjacent ally, they gain +8% DR for 4s. You gain +6% ATK for 4s',
                  apply: function(unit, hero) {} }
            ],
            4: [
                { id: 'maren_A_4_1', name: 'Shared Vitality', tier: 4, branch: 'A', cost: 4, levelReq: 13,
                  effect: 'When you heal, the lowest-HP nearby ally gains 50% of the heal you receive, and you heal 30% of damage absorbed by adjacent shields',
                  apply: function(unit, hero) {} },
                { id: 'maren_A_4_2', name: 'Desperate Measures', tier: 4, branch: 'A', cost: 4, levelReq: 13,
                  effect: 'When any ally drops below 25% HP, instantly heal them for 20% of their max HP. Cooldown: 4s per target',
                  apply: function(unit, hero) {} }
            ],
            5: [
                { id: 'maren_A_5_1', name: 'Miracle', tier: 5, branch: 'A', cost: 5, levelReq: 17,
                  effect: 'Once per combat, when any hero-equipped ally drops below 10% HP, instantly heal them to 45% and grant 3s invulnerability',
                  apply: function(unit, hero) {} }
            ]
        },
        B: {
            1: [
                { id: 'maren_B_1_1', name: 'Shield Weave', tier: 1, branch: 'B', cost: 1, levelReq: 1,
                  effect: 'Your heals (from any source) also grant a shield equal to 12% of the heal amount (5s)',
                  apply: function(unit, hero) {} },
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
                  apply: function(unit, hero) {} },
                { id: 'maren_B_2_2', name: 'Kindred Spirit', tier: 2, branch: 'B', cost: 1, levelReq: 5,
                  effect: 'When you are healed, the lowest-HP adjacent ally is healed for 35% of the same amount',
                  apply: function(unit, hero) {} }
            ],
            3: [
                { id: 'maren_B_3_1', name: 'Absorb Pain', tier: 3, branch: 'B', cost: 2, levelReq: 9,
                  effect: 'You absorb 14% of damage dealt to the lowest-HP ally within 2 cells',
                  apply: function(unit, hero) {} },
                { id: 'maren_B_3_2', name: 'Guardian Shell', tier: 3, branch: 'B', cost: 2, levelReq: 9,
                  effect: 'When adjacent allies heal, they gain an additional shield equal to 8% of the heal amount. You gain +8% DR when shields are active on nearby allies',
                  apply: function(unit, hero) {} }
            ],
            4: [
                { id: 'maren_B_4_1', name: 'Fortified Presence', tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'All hero-equipped allies within 2 cells gain +8% shields received and healing received. When shields break on nearby allies, you gain +12% ATK for 3s',
                  apply: function(unit, hero) {} },
                { id: 'maren_B_4_2', name: 'Emergency Sanctuary', tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'When you cast an ability, create a protective zone for 4s that reduces all incoming damage to allies by 18% and doubles all healing in the zone',
                  apply: function(unit, hero) {} }
            ],
            5: [
                { id: 'maren_B_5_1', name: 'Sanctuary', tier: 5, branch: 'B', cost: 5, levelReq: 17,
                  effect: 'Once per combat, create a 2-cell radius zone around you that reduces all incoming damage to allies by 28% for 5s. During Sanctuary, all healing in the zone is tripled',
                  apply: function(unit, hero) {} }
            ]
        }
    },

    // ========== VOSS ==========
    voss: {
        A: {
            1: [
                { id: 'voss_A_1_1', name: 'War Cry', tier: 1, branch: 'A', cost: 1, levelReq: 1,
                  effect: 'You gain +3.5% ATK every 8s of combat (caps at +28% at ~64s)',
                  apply: function(unit, hero) {} },
                { id: 'voss_A_1_2', name: 'Battle Rhythm', tier: 1, branch: 'A', cost: 1, levelReq: 1,
                  effect: 'You gain +2.2% ATK speed every 10s of combat (caps at +18%)',
                  apply: function(unit, hero) {} }
            ],
            2: [
                { id: 'voss_A_2_1', name: 'Bloodlust', tier: 2, branch: 'A', cost: 1, levelReq: 5,
                  effect: 'You gain +8% lifesteal. Lifesteal increases by +1.2% per 10s of combat',
                  apply: function(unit, hero) {
                      unit.lifesteal = (unit.lifesteal || 0) + 0.08;
                  } },
                { id: 'voss_A_2_2', name: 'Combat Readiness', tier: 2, branch: 'A', cost: 1, levelReq: 5,
                  effect: 'You gain +1% DR per 10s of combat (caps at +10%) and +2% mana regen per 10s (caps at +20% mana/s)',
                  apply: function(unit, hero) {} }
            ],
            3: [
                { id: 'voss_A_3_1', name: 'Berserker Rage', tier: 3, branch: 'A', cost: 2, levelReq: 9,
                  effect: 'You gain +1.8% ATK per 10% HP missing (max +18% at low HP)',
                  apply: function(unit, hero) {} },
                { id: 'voss_A_3_2', name: 'Unstoppable Advance', tier: 3, branch: 'A', cost: 2, levelReq: 9,
                  effect: 'You become immune to Slow effects after 25s of combat. Your movement speed increases +3% per 10s of combat',
                  apply: function(unit, hero) {} }
            ],
            4: [
                { id: 'voss_A_4_1', name: 'Escalation', tier: 4, branch: 'A', cost: 4, levelReq: 13,
                  effect: 'Every 15s of combat, you permanently gain +8% ATK and +4% damage dealt. This stacks infinitely',
                  apply: function(unit, hero) {} },
                { id: 'voss_A_4_2', name: "Veteran's Strength", tier: 4, branch: 'A', cost: 4, levelReq: 13,
                  effect: 'After 40s of combat, you gain +20% ATK, +15% ATK speed, and +5% lifesteal. This bonus increases by +5% ATK every 10s of additional combat',
                  apply: function(unit, hero) {} }
            ],
            5: [
                { id: 'voss_A_5_1', name: "Warlord's Fury", tier: 5, branch: 'A', cost: 5, levelReq: 17,
                  effect: 'After 45s of combat, you enter Fury: +24% ATK, +24% ATK speed, +12% lifesteal. Kills during Fury extend it by 6s and grant +6% ATK permanently',
                  apply: function(unit, hero) {} }
            ]
        },
        B: {
            1: [
                { id: 'voss_B_1_1', name: 'First Blood', tier: 1, branch: 'B', cost: 1, levelReq: 1,
                  effect: 'Your first kill each combat grants +15% ATK for 6s',
                  apply: function(unit, hero) {} },
                { id: 'voss_B_1_2', name: 'Momentum', tier: 1, branch: 'B', cost: 1, levelReq: 1,
                  effect: 'On kill, you gain +10% ATK speed for 4s (stacks up to 5 times)',
                  apply: function(unit, hero) {} }
            ],
            2: [
                { id: 'voss_B_2_1', name: 'Intimidate', tier: 2, branch: 'B', cost: 1, levelReq: 5,
                  effect: 'On kill, nearby enemies (within 2 cells) lose 6% ATK for 5s',
                  apply: function(unit, hero) {} },
                { id: 'voss_B_2_2', name: 'War Banner', tier: 2, branch: 'B', cost: 1, levelReq: 5,
                  effect: 'On kill, all hero-equipped allies gain +6% ATK for 4s',
                  apply: function(unit, hero) {} }
            ],
            3: [
                { id: 'voss_B_3_1', name: 'Dominate', tier: 3, branch: 'B', cost: 2, levelReq: 9,
                  effect: 'On kill, you gain +4% permanent ATK for the rest of combat (stacks infinitely)',
                  apply: function(unit, hero) {} },
                { id: 'voss_B_3_2', name: 'Killing Spree', tier: 3, branch: 'B', cost: 2, levelReq: 9,
                  effect: 'Every kill refreshes your ability cooldown by 20% and grants +8% movement speed for 4s',
                  apply: function(unit, hero) {} }
            ],
            4: [
                { id: 'voss_B_4_1', name: 'Execution Cascade', tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'Every 2nd kill triggers a shockwave: 180% ATK damage to all enemies within 2 cells, and you gain +12% permanent ATK',
                  apply: function(unit, hero) {} },
                { id: 'voss_B_4_2', name: "Conqueror's Aura", tier: 4, branch: 'B', cost: 4, levelReq: 13,
                  effect: 'On kill, gain +8% ATK, and all allies within 2 cells gain +5% ATK for 5s. After 3 kills, your next ability refunds 50% mana',
                  apply: function(unit, hero) {} }
            ],
            5: [
                { id: 'voss_B_5_1', name: 'Conqueror', tier: 5, branch: 'B', cost: 5, levelReq: 17,
                  effect: 'Every 3rd kill triggers a shockwave: 200% ATK damage to all enemies within 2 cells, and all allies gain +12% ATK for 4s. Additional kills grant you +3% permanent ATK',
                  apply: function(unit, hero) {} }
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

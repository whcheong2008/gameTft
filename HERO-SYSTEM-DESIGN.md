# Hero System — Full Design

> 8 heroes. Story characters that equip onto units as an overlay (soul transfer). Heroes enable item equipping, gain XP, and have skill trees. B dies in R4; B's Fragment recoverable in R7.

---

## Hero Roster

| # | Name | Acquired | Role | Philosophy | Story Role |
|---|------|----------|------|------------|------------|
| 1 | **A** (Protagonist) | Start | Commander | Deontology — rules matter | The player's avatar. Leader. Always in party. |
| 2 | **B** (Best Friend) | Start | Amplifier | Utilitarianism — outcomes matter | The powerful friend. **Dies R4.** Fragment in R7. |
| 3 | **Kael** | R1 Boss | Shieldbearer | Loyal, protective | Tank/protector who joined early. Stays through the split. |
| 4 | **Lyra** | R2 Boss | Striker | Pragmatic, competitive | DPS specialist. Follows strength — leaves in R4, returns R5. |
| 5 | **Maren** | R3 Boss | Mender | Compassionate, conflicted | Healer. Torn by B's death. Leaves in R4, hardest to reunite in R5. |
| 6 | **Dax** | R4 (pre-B's death) | Trickster | Chaotic, adaptable | Assassin/utility. Joins right before everything falls apart. Stays with A. |
| 7 | **Sera** | R5 (reunion) | Enchanter | Idealistic, seeking redemption | Mage/support. Returns to the group carrying guilt. |
| 8 | **Voss** | R6 Boss | Warlord | Battle-hardened, practical | Late-game powerhouse. Respects A for surviving without B. |

### Availability Timeline
| Region | Available Heroes | Notes |
|--------|-----------------|-------|
| R1 | A, B | Tutorial with 2 heroes |
| R2 | A, B, Kael | Tank joins |
| R3 | A, B, Kael, Lyra | DPS joins |
| R4 early | A, B, Kael, Lyra, Maren, Dax | Full roster briefly |
| R4 mid | A, B, Kael, Lyra, Maren, Dax | B dies. Lyra and Maren leave |
| R4 late | A, Kael, Dax | Only 3 heroes. Hardest region. |
| R5 | A, Kael, Dax → +Lyra, Maren, Sera | Reunion arc. Regain heroes progressively |
| R6 | A, Kael, Lyra, Maren, Dax, Sera, Voss | 7 heroes |
| R7 | A, Kael, Lyra, Maren, Dax, Sera, Voss + B's Fragment | 7 heroes + fragment |
| R8 | Same as R7 | Final push |

---

## Skill Tree Design

Each hero has 2 branches with ~6-7 nodes each (12-14 total). Hero level cap: 20. Nodes unlock at specific levels. Players earn skill points on level-up (1 per level = 20 points total, can't max both branches). Most nodes cost 1 point, capstones cost 2.

**Nodes are hidden (shown as ?) until the level requirement is met.** Player discovers the tree as they play.

---

### Hero 1: A — The Commander
*"Lead by example. Your presence strengthens everyone."*

**Branch A: Vanguard Tactics** (frontline leadership)
| Node | Level | Cost | Effect |
|------|-------|------|--------|
| Rally Cry | 1 | 1 | Equipped unit gains +5% ATK. Adjacent allies gain +3% ATK |
| Hold the Line | 3 | 1 | Equipped unit gains +8% HP |
| Inspiring Presence | 5 | 1 | When equipped unit kills an enemy, nearby allies gain +10% ATK for 3s |
| Tactical Positioning | 8 | 1 | Equipped unit gains +10% ATK if in front row, +10% HP if in back row |
| Unyielding Will | 11 | 1 | Equipped unit gains +12% DR when below 40% HP |
| Commander's Resolve | 15 | 2 | Once per combat: when equipped unit drops below 20% HP, heal to 50% and gain 2s invulnerability |

**Branch B: Strategic Mind** (team-wide buffs)
| Node | Level | Cost | Effect |
|------|-------|------|--------|
| Battle Plan | 2 | 1 | Equipped unit's ability costs 8% less mana |
| Shared Wisdom | 4 | 1 | All hero-equipped allies gain +3% ATK and HP |
| Exploit Weakness | 7 | 1 | Equipped unit's attacks mark target: next ally hit deals +10% damage |
| Coordinated Strike | 10 | 1 | When equipped unit casts ability, nearest ally gains +15% ATK speed for 3s |
| Tactical Genius | 13 | 1 | All hero-equipped allies gain +1 starting mana per node invested in this branch |
| Supreme Command | 17 | 2 | Once per combat: activate to give all allies +20% ATK and +20% ATK speed for 5s |

---

### Hero 2: B — The Amplifier (Dies R4, Fragment R7)
*"The ends justify the means. Maximum output, whatever the cost."*

**B is the strongest hero during R1-R4.** Their tree amplifies raw power at a cost (HP sacrifice, self-damage). Losing B is mechanically devastating.

**Branch A: Overcharge** (boost at a cost)
| Node | Level | Cost | Effect |
|------|-------|------|--------|
| Power Surge | 1 | 1 | Equipped unit gains +8% ATK |
| Reckless Force | 3 | 1 | Equipped unit gains +15% ATK but loses 5% max HP |
| Mana Overflow | 5 | 1 | Equipped unit gains +20 starting mana |
| Sacrifice Engine | 8 | 1 | Equipped unit's abilities deal +12% damage. Unit takes 3% max HP as self-damage per cast |
| Critical Mass | 11 | 1 | Equipped unit gains +20% crit chance |
| Unleashed Potential | 15 | 2 | Equipped unit gains +30% ability damage. On death, explode for 300% ATK to nearby enemies |

**Branch B: Efficiency** (utility extraction)
| Node | Level | Cost | Effect |
|------|-------|------|--------|
| Optimize | 2 | 1 | Equipped unit gains +10% ATK speed |
| Resource Drain | 4 | 1 | Equipped unit's kills restore 15% max mana |
| Calculated Strike | 7 | 1 | Equipped unit gains +8% damage per unique archetype on the team (primary only) |
| Maximum Yield | 10 | 1 | Equipped unit gains +12% ATK. Nearby enemy kills heal equipped unit for 8% max HP |
| Synergy Amplifier | 13 | 1 | Equipped unit counts as +1 toward its primary archetype synergy |
| Utilitarian's Gift | 17 | 2 | All allies gain +5% ATK and +5% ability damage |

### B's Fragment (acquired R7)
*"A whisper of what was lost."*
- Cannot level up. Fixed at B's level when B died.
- Provides a **subset** of B's invested skill nodes (top 5 nodes only, chosen by player from B's unlocked tree)
- The fragment is weaker — all bonuses reduced by 40%
- Unique passive: "Echo of B" — once per combat, when equipped unit would die, delay death by 2s and deal 200% ATK to nearby enemies (B's last sacrifice, echoed)

---

### Hero 3: Kael — The Shieldbearer
*"No one falls while I stand."*

**Branch A: Iron Bulwark** (personal tankiness)
| Node | Level | Cost | Effect |
|------|-------|------|--------|
| Tough Skin | 1 | 1 | Equipped unit gains +10% HP |
| Shield Wall | 3 | 1 | Equipped unit starts combat with a shield equal to 10% max HP |
| Endurance | 5 | 1 | Equipped unit gains +6% DR |
| Reactive Armor | 8 | 1 | When equipped unit takes a hit >15% max HP, gain +8% DR for 3s |
| Stone Stance | 11 | 1 | Equipped unit gains +15% HP and +4% DR |
| Immortal Guard | 15 | 2 | Once per combat: when equipped unit drops below 10% HP, gain 80% DR for 3s and taunt all enemies |

**Branch B: Guardian Aura** (team protection)
| Node | Level | Cost | Effect |
|------|-------|------|--------|
| Protective Instinct | 2 | 1 | Adjacent allies gain +5% HP |
| Damage Soak | 4 | 1 | Equipped unit absorbs 10% of damage dealt to adjacent allies |
| Fortify | 7 | 1 | Equipped unit's shield effects also apply at 40% value to adjacent allies |
| Rally Shield | 10 | 1 | When equipped unit's shield breaks, grant adjacent allies a shield equal to 8% of their max HP |
| Bastion | 13 | 1 | Adjacent allies gain +5% DR |
| Unbreakable Line | 17 | 2 | All allies within 2 cells gain 10% DR. When equipped unit dies, grant all allies a 15% max HP shield |

---

### Hero 4: Lyra — The Striker
*"Hit first. Hit hardest. Win."*

**Branch A: Precision** (single-target burst)
| Node | Level | Cost | Effect |
|------|-------|------|--------|
| Sharp Focus | 1 | 1 | Equipped unit gains +6% ATK |
| Armor Pierce | 3 | 1 | Equipped unit's attacks ignore 8% of target DR |
| Lethal Precision | 5 | 1 | Equipped unit gains +10% crit chance |
| Critical Surge | 8 | 1 | Crits deal 15% more damage (additive to crit multiplier) |
| Execution | 11 | 1 | Equipped unit deals +15% damage to targets below 35% HP |
| Death Blow | 15 | 2 | Equipped unit's first ability cast each combat is a guaranteed crit and ignores 25% DR |

**Branch B: Momentum** (sustained DPS)
| Node | Level | Cost | Effect |
|------|-------|------|--------|
| Quick Strikes | 2 | 1 | Equipped unit gains +8% ATK speed |
| Battle Rhythm | 4 | 1 | Each attack grants +1% ATK speed (stacks up to 10%) |
| Adrenaline | 7 | 1 | On kill, equipped unit gains +12% ATK for 4s |
| Relentless | 10 | 1 | Equipped unit gains +5% ATK speed and +5% ATK |
| Chain Kill | 13 | 1 | On kill, equipped unit's next attack is a double-strike |
| Unstoppable Force | 17 | 2 | Equipped unit gains +1% ATK per second of combat (cap 25%). On kill, reset this timer to current value (doesn't lose stacks) |

---

### Hero 5: Maren — The Mender
*"Every life is worth saving. Every single one."*

**Branch A: Restoration** (raw healing power)
| Node | Level | Cost | Effect |
|------|-------|------|--------|
| Healing Touch | 1 | 1 | Equipped unit's heals are +10% stronger |
| Swift Recovery | 3 | 1 | Equipped unit gains +8% ATK speed (faster heal cycling) |
| Emergency Care | 5 | 1 | Equipped unit's heals on targets below 30% HP are +25% stronger |
| Rejuvenation | 8 | 1 | Equipped unit's heals apply a 3s regen effect (5% of heal amount per second) |
| Purify | 11 | 1 | Equipped unit's heals remove 1 debuff from the target |
| Miracle | 15 | 2 | Once per combat: equipped unit's next heal fully restores the target to max HP and grants 3s immunity to damage |

**Branch B: Barrier** (preventive protection)
| Node | Level | Cost | Effect |
|------|-------|------|--------|
| Shield Weave | 2 | 1 | Equipped unit's heals also grant a shield equal to 10% of heal amount (3s) |
| Mana Flow | 4 | 1 | Equipped unit gains +2 mana per second |
| Absorption Field | 7 | 1 | Equipped unit gains +8% element resist |
| Overheal Mastery | 10 | 1 | 30% of overhealing converts to permanent shield |
| Life Link | 13 | 1 | Equipped unit splits 15% of damage taken by lowest-HP ally onto itself |
| Sanctuary | 17 | 2 | Once per combat: create a zone (2-cell radius) that reduces all incoming damage by 30% for 4s |

---

### Hero 6: Dax — The Trickster
*"Rules are suggestions. Exploit everything."*

**Branch A: Shadow Arts** (evasion and stealth)
| Node | Level | Cost | Effect |
|------|-------|------|--------|
| Nimble | 1 | 1 | Equipped unit gains +8% dodge chance |
| Smoke Screen | 3 | 1 | At combat start, equipped unit gains stealth for 2s (untargetable) |
| Evasive Maneuvers | 5 | 1 | Equipped unit gains +12% move speed |
| Shadow Step | 8 | 1 | After dodging, equipped unit's next attack deals +25% damage |
| Vanish | 11 | 1 | When equipped unit drops below 40% HP, gain 1.5s stealth and +20% ATK speed |
| Phantom Strike | 15 | 2 | Every 4th attack, equipped unit teleports behind their target and deals +40% damage. Target is slowed 20% for 2s |

**Branch B: Exploitation** (debuffs and disruption)
| Node | Level | Cost | Effect |
|------|-------|------|--------|
| Cheap Shot | 2 | 1 | Equipped unit deals +10% damage to CC'd targets |
| Poison Blade | 4 | 1 | Equipped unit's attacks apply a 3s poison (3% ATK per second) |
| Expose Weakness | 7 | 1 | Equipped unit's attacks reduce target's DR by 5% for 4s (stacks up to 15%) |
| Disrupt | 10 | 1 | Equipped unit's ability casts silence the target for 1s |
| Sabotage | 13 | 1 | Equipped unit's attacks have 15% chance to reduce target's ATK by 10% for 3s |
| Master of Chaos | 17 | 2 | Equipped unit's attacks apply a random debuff every 5th hit (slow, poison, blind, or silence for 2s) |

---

### Hero 7: Sera — The Enchanter
*"Magic can fix what strength cannot."*

**Branch A: Arcane Power** (ability enhancement)
| Node | Level | Cost | Effect |
|------|-------|------|--------|
| Arcane Infusion | 1 | 1 | Equipped unit gains +8% ability damage |
| Mana Attunement | 3 | 1 | Equipped unit gains +15 starting mana |
| Spell Amplification | 5 | 1 | Equipped unit's ability AoE radius increased by 15% |
| Echo Cast | 8 | 1 | Equipped unit's ability has a 20% chance to cast again at 40% power (no mana cost) |
| Elemental Affinity | 11 | 1 | Equipped unit's element damage multiplier improved by +0.1 (1.3x → 1.4x advantage) |
| Arcane Mastery | 15 | 2 | Equipped unit's abilities cost 20% less mana. After casting, gain +15% ability damage for 4s (stacks) |

**Branch B: Enchantment** (buff allies)
| Node | Level | Cost | Effect |
|------|-------|------|--------|
| Inspire | 2 | 1 | Equipped unit grants nearest ally +5% ATK at combat start |
| Mana Gift | 4 | 1 | When equipped unit casts ability, nearest ally gains 10 mana |
| Enchant Weapons | 7 | 1 | Equipped unit grants 2 nearest allies +5% element damage |
| Arcane Shield | 10 | 1 | Equipped unit grants 2 nearest allies a shield equal to 5% their max HP at combat start |
| Spellweave | 13 | 1 | When equipped unit casts ability, nearest ally gains +10% ATK speed for 3s |
| Grand Enchantment | 17 | 2 | At combat start, all hero-equipped allies gain +8% ATK, +8% ability damage, and +8 starting mana |

---

### Hero 8: Voss — The Warlord
*"Strength respects strength. Prove yours."*

**Branch A: Brute Force** (raw offensive power)
| Node | Level | Cost | Effect |
|------|-------|------|--------|
| War Cry | 1 | 1 | Equipped unit gains +7% ATK |
| Cleave | 3 | 1 | Equipped unit's attacks deal 20% splash damage to adjacent enemies |
| Bloodlust | 5 | 1 | Equipped unit gains 8% lifesteal |
| Berserker Rage | 8 | 1 | Equipped unit gains +1.5% ATK for each 10% HP missing |
| Devastating Blow | 11 | 1 | Every 6th attack deals 50% bonus damage |
| Warlord's Fury | 15 | 2 | Equipped unit gains +20% ATK. Kills extend all active buffs on equipped unit by 2s |

**Branch B: Battle Command** (combat control)
| Node | Level | Cost | Effect |
|------|-------|------|--------|
| Intimidate | 2 | 1 | Equipped unit reduces nearby enemies' ATK by 5% |
| War Banner | 4 | 1 | Equipped unit grants +5% ATK to all allies within 2 cells |
| Charge! | 7 | 1 | At combat start, equipped unit dashes to furthest enemy, dealing 100% ATK and stunning 1s |
| Iron Discipline | 10 | 1 | Equipped unit gains +10% CC resist |
| Dominate | 13 | 1 | Equipped unit's kills cause nearby enemies to flee for 1s (move away) |
| Supreme Warlord | 17 | 2 | All hero-equipped allies gain +10% ATK and +10% HP. Equipped unit gains an additional +10% ATK for each dead ally |

---

## Skill Point Economy

- 20 levels, 1 point per level = 20 points total
- Each branch: 5 regular nodes (1pt each) + 1 capstone (2pts) = 7 points to complete a branch
- Both branches = 14 points. Player has 20, so can fully complete one branch and almost complete the other (6 remaining points = 5 regular nodes + not enough for capstone)
- This forces a choice: max one branch + partial other, or balanced investment in both
- **Respec**: Available at the hub for a gold cost (increases each time). Allows full redistribution.

## Hero XP

- Heroes gain XP when their equipped unit participates in combat (separate from unit XP)
- XP curve similar to unit XP but scaled for 20 levels
- Heroes level faster than units (since they're the transferable investment)
- XP per mission = `heroBaseXP * stageMultiplier` (roughly 1.5x unit XP rates)

---

## Implementation Notes

- Heroes are saved as separate objects in saveData (not embedded in units)
- Hero assignment: `saveData.heroes[heroId].assignedUnit = unitId`
- Unit lookup: check if any hero has this unit assigned
- Skill tree UI: show nodes as ? until level requirement met
- B's Fragment: special hero object with `isFragment: true`, reduced bonuses, no leveling
- Items: only equippable on units that have a hero assigned (`unit.heroId !== null`)

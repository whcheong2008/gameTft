# Archetype Synergy Rework Proposal

## Design Philosophy

**Core shift: team-wide buffs become archetype-scoped buffs.** Synergy bonuses primarily affect units that carry the archetype (primary or secondary). This makes stacking an archetype feel like investing in a *team identity* rather than a generic stat stick. Each archetype has 4 thresholds (2/4/6/8) creating a smooth escalation from "noticeable edge" to "game-warping capstone."

**Guiding principles:**
- **2-threshold** = a noticeable nudge that rewards early pairs. Easy to hit with just primaries.
- **4-threshold** = a strong, build-shaping bonus. Achievable mid-game with focused drafting.
- **6-threshold** = build-defining. Requires Awakened secondary archetypes or heavy primary commitment.
- **8-threshold** = game-warping capstone for min-maxers. Requires Transcendent units (primary counts as 2) and/or deep secondary archetype stacking.
- **No element overlap**: archetypes are about ROLE, elements are about POWER TYPE. Mystic is the one archetype adjacent to elements, so it focuses on *amplifying element effects* rather than raw element damage.
- **Rarer archetypes get slightly stronger per-tier**: Ranger (6), Mystic (6), Warden (6) have slightly juicier numbers than Guardian (8), Duelist (7).

---

## Analysis: Current Synergy Audit

| Archetype | Current Thresholds | Team-wide? | Issues |
|-----------|-------------------|------------|--------|
| Guardian | 2/4/6 | No (self) | Already archetype-scoped. Needs 8-threshold. |
| Warden | 2/4 | **Yes** (tenacity to allies) | Tenacity should be Warden-only. Needs 6/8. |
| Vanguard | 2/4 | **Partially** (front-row, not archetype) | Buffs any front-row unit. Should buff Vanguard units. |
| Duelist | 2/4/6 | No (self) | Already archetype-scoped. Needs 8-threshold. |
| Predator | 2/4 | No (self) | Already archetype-scoped. Needs 6/8. |
| Ranger | 2/4/6 | No (self) | Already archetype-scoped. Needs 8-threshold. |
| Sorcerer | 2/4/6 | No (self) | Already archetype-scoped. Needs 8-threshold. |
| Mystic | 2/4 | **Partially** (elemResist to team, debuff to enemies) | Resist should be Mystic-only. Needs 6/8. |
| Sage | 2/4/6 | **Yes** (teamRegenPct to all allies) | Regen should buff Sage healing output, not team-wide regen. |

---

## Synergy Definitions

### Guardian (2/4/6/8)
*Fantasy: "We don't die" -- shields, HP, damage reduction*

- **2**: Guardian units gain +250 HP and +5% damage reduction.
  ```js
  { desc: 'Guardians +250 HP +5% DR', hpBonus: 250, damageReduction: 0.05, scope: 'archetype' }
  ```
- **4**: Guardian units gain +550 HP, +10% DR, and generate a Shield equal to 8% of their max HP at combat start.
  ```js
  { desc: 'Guardians +550 HP +10% DR. Start with 8% HP shield', hpBonus: 550, damageReduction: 0.10, startShieldPct: 0.08, scope: 'archetype' }
  ```
- **6**: Guardian units gain +900 HP, +15% DR. When a Guardian's shield breaks, they gain 20% tenacity for 4s.
  ```js
  { desc: 'Guardians +900 HP +15% DR. Shield break: +20% tenacity 4s', hpBonus: 900, damageReduction: 0.15, startShieldPct: 0.08, shieldBreakTenacity: 0.20, shieldBreakTenacityDuration: 4, scope: 'archetype' }
  ```
- **8**: Guardian units gain +1300 HP, +20% DR. Start with a 15% HP shield. When a Guardian drops below 30% HP for the first time, they become invulnerable for 1.5s and taunt nearby enemies.
  ```js
  { desc: 'Guardians +1300 HP +20% DR. 15% HP shield. Below 30%: 1.5s invuln + taunt', hpBonus: 1300, damageReduction: 0.20, startShieldPct: 0.15, lastStandThreshold: 0.30, lastStandInvulnDuration: 1.5, lastStandTaunt: true, scope: 'archetype' }
  ```

### Warden (2/4/6/8)
*Fantasy: "You can't move" -- CC duration, CC immunity, lockdown*
*(Rarer archetype -- 6 primary units. Slightly stronger per-tier.)*

- **2**: Warden units gain +20% CC duration on their abilities. Wardens gain +15% tenacity.
  ```js
  { desc: 'Wardens +20% CC duration, +15% tenacity', ccDurationBonus: 0.20, tenacity: 0.15, scope: 'archetype' }
  ```
- **4**: Warden units gain +35% CC duration, +30% tenacity. Wardens are immune to the first CC they receive each combat.
  ```js
  { desc: 'Wardens +35% CC duration, +30% tenacity. Immune to first CC', ccDurationBonus: 0.35, tenacity: 0.30, wardenFirstCcImmune: true, scope: 'archetype' }
  ```
- **6**: Warden units gain +50% CC duration, +45% tenacity. When a Warden CCs an enemy, that enemy's attack speed is reduced by 20% for 3s.
  ```js
  { desc: 'Wardens +50% CC, +45% tenacity. CC applies -20% ATK spd 3s', ccDurationBonus: 0.50, tenacity: 0.45, ccAppliesAtkSpdSlow: 0.20, ccAtkSpdSlowDuration: 3, scope: 'archetype' }
  ```
- **8**: Warden units gain +65% CC duration, 60% tenacity (cap). When a Warden CCs an enemy, ALL enemies within 2 cells of the CC'd target are Rooted for 1s. Wardens are immune to all CC.
  ```js
  { desc: 'Wardens +65% CC, CC immune. CC spreads: root nearby 1s', ccDurationBonus: 0.65, tenacity: 0.60, wardenCcImmune: true, ccSpreadRoot: true, ccSpreadRadius: 2, ccSpreadDuration: 1, scope: 'archetype' }
  ```

### Vanguard (2/4/6/8)
*Fantasy: "First in, hit hard" -- charge bonuses, front-row power*
*(Rarer archetype -- 6 primary units. Slightly stronger per-tier.)*

- **2**: Vanguard units gain +200 HP and +20 ATK. Bonus doubles (+400 HP, +40 ATK) if the Vanguard is placed in the front row.
  ```js
  { desc: 'Vanguards +200 HP +20 ATK (x2 if front row)', hpBonus: 200, atkBonus: 20, frontRowMultiplier: 2, scope: 'archetype' }
  ```
- **4**: Vanguard units gain +400 HP, +35 ATK (x2 in front row). Vanguards deal 15% bonus damage for the first 5s of combat.
  ```js
  { desc: 'Vanguards +400 HP +35 ATK (x2 front). +15% dmg first 5s', hpBonus: 400, atkBonus: 35, frontRowMultiplier: 2, chargeDmgBonus: 0.15, chargeDuration: 5, scope: 'archetype' }
  ```
- **6**: Vanguard units gain +650 HP, +55 ATK (x2 in front row). First 5s: +25% damage. Vanguards gain 12% lifesteal.
  ```js
  { desc: 'Vanguards +650 HP +55 ATK (x2 front). Charge +25% dmg. 12% lifesteal', hpBonus: 650, atkBonus: 55, frontRowMultiplier: 2, chargeDmgBonus: 0.25, chargeDuration: 5, lifestealPct: 0.12, scope: 'archetype' }
  ```
- **8**: Vanguard units gain +950 HP, +80 ATK (x2 in front row). First 5s: +40% damage, attacks stun for 0.5s. Vanguards gain 20% lifesteal and are immune to Slow effects.
  ```js
  { desc: 'Vanguards +950 HP +80 ATK (x2 front). Charge +40% + 0.5s stun. 20% lifesteal. Slow immune', hpBonus: 950, atkBonus: 80, frontRowMultiplier: 2, chargeDmgBonus: 0.40, chargeDuration: 5, chargeStunDuration: 0.5, lifestealPct: 0.20, slowImmune: true, scope: 'archetype' }
  ```

### Duelist (2/4/6/8)
*Fantasy: "I win every fight" -- double-strike, lifesteal, can't miss*

- **2**: Duelist units gain 15% double-strike chance.
  ```js
  { desc: 'Duelists 15% double-strike', doubleStrikeChance: 0.15, scope: 'archetype' }
  ```
- **4**: Duelist units gain 30% double-strike chance and 10% lifesteal.
  ```js
  { desc: 'Duelists 30% double-strike, 10% lifesteal', doubleStrikeChance: 0.30, lifestealPct: 0.10, scope: 'archetype' }
  ```
- **6**: Duelist units gain 40% double-strike, 15% lifesteal. Duelist attacks cannot miss (ignores dodge/blind).
  ```js
  { desc: 'Duelists 40% double-strike, 15% lifesteal, can\'t miss', doubleStrikeChance: 0.40, lifestealPct: 0.15, cantMissAttacks: true, scope: 'archetype' }
  ```
- **8**: Duelist units gain 55% double-strike, 20% lifesteal, can't miss. Every 3rd attack is a guaranteed critical strike. Duelists gain +1% ATK per second of combat (capped at +40%).
  ```js
  { desc: 'Duelists 55% double-strike, 20% lifesteal, can\'t miss. Every 3rd: crit. +1% ATK/s (cap 40%)', doubleStrikeChance: 0.55, lifestealPct: 0.20, cantMissAttacks: true, guaranteedCritEveryN: 3, rampingAtkPctPerSec: 0.01, rampingAtkCap: 0.40, scope: 'archetype' }
  ```

### Predator (2/4/6/8)
*Fantasy: "Kill fast, move on" -- execute damage, speed, resets*

- **2**: Predator units gain +25% ATK speed and +15% bonus damage to enemies below 50% HP.
  ```js
  { desc: 'Predators +25% ATK spd, +15% dmg to <50% HP', atkSpdBoost: 0.25, executeDamageBonus: 0.15, executeThreshold: 0.50, scope: 'archetype' }
  ```
- **4**: Predator units gain +40% ATK speed, +25% execute damage. On kill, Predators dash to a new target.
  ```js
  { desc: 'Predators +40% ATK spd, +25% execute. Dash on kill', atkSpdBoost: 0.40, executeDamageBonus: 0.25, executeThreshold: 0.50, dashResetOnKill: true, scope: 'archetype' }
  ```
- **6**: Predator units gain +55% ATK speed, +35% execute damage, dash on kill. On kill, Predators gain 30% ATK for 4s (stacks).
  ```js
  { desc: 'Predators +55% ATK spd, +35% execute. Dash+frenzy on kill', atkSpdBoost: 0.55, executeDamageBonus: 0.35, executeThreshold: 0.50, dashResetOnKill: true, onKillAtkBuff: 0.30, onKillAtkBuffDuration: 4, scope: 'archetype' }
  ```
- **8**: Predator units gain +70% ATK speed, +50% execute damage. Dash and frenzy on kill. Execute threshold raised to 60% HP. On kill, refund 50% of ability mana.
  ```js
  { desc: 'Predators +70% ATK spd, +50% execute (<60%). Dash+frenzy+mana on kill', atkSpdBoost: 0.70, executeDamageBonus: 0.50, executeThreshold: 0.60, dashResetOnKill: true, onKillAtkBuff: 0.30, onKillAtkBuffDuration: 4, onKillManaRefundPct: 0.50, scope: 'archetype' }
  ```

### Ranger (2/4/6/8)
*Fantasy: "Death from distance" -- range, pierce, focused fire*
*(Rarer archetype -- 6 primary units. Slightly stronger per-tier.)*

- **2**: Ranger units gain +1 attack range and +15% bonus damage to the furthest enemy.
  ```js
  { desc: 'Rangers +1 range, +15% dmg to furthest', rangeBonus: 1, furthestDmgBonus: 0.15, scope: 'archetype' }
  ```
- **4**: Ranger units gain +1 range, +25% furthest damage, +15% ATK speed. Ranger attacks pierce, hitting 1 enemy behind the target.
  ```js
  { desc: 'Rangers +1 range, +25% furthest, +15% ATK spd, pierce 1', rangeBonus: 1, furthestDmgBonus: 0.25, atkSpdBoost: 0.15, pierceCount: 1, scope: 'archetype' }
  ```
- **6**: Ranger units gain +2 range, +35% furthest damage, +25% ATK speed. Pierce hits 2 enemies. Every 5th Ranger attack is a Focused Shot (guaranteed crit, ignores 30% DR).
  ```js
  { desc: 'Rangers +2 range, +35% furthest, +25% ATK spd, pierce 2. Every 5th: focused shot', rangeBonus: 2, furthestDmgBonus: 0.35, atkSpdBoost: 0.25, pierceCount: 2, focusedShotEveryN: 5, focusedShotIgnoreDR: 0.30, scope: 'archetype' }
  ```
- **8**: Ranger units gain +3 range, +50% furthest damage, +35% ATK speed. Pierce hits all enemies in a line. Every 3rd attack is a Focused Shot. Rangers mark their target -- marked enemies take 15% more damage from all sources.
  ```js
  { desc: 'Rangers +3 range, +50% furthest, pierce all. Mark target: +15% dmg taken', rangeBonus: 3, furthestDmgBonus: 0.50, atkSpdBoost: 0.35, pierceAll: true, focusedShotEveryN: 3, focusedShotIgnoreDR: 0.30, markTargetDmgAmp: 0.15, scope: 'archetype' }
  ```

### Sorcerer (2/4/6/8)
*Fantasy: "Spells win wars" -- ability damage, mana, cooldowns*

- **2**: Sorcerer units gain +15% ability damage and +10 starting mana.
  ```js
  { desc: 'Sorcerers +15% ability dmg, +10 starting mana', abilityDmgBonus: 0.15, startingManaBonus: 10, scope: 'archetype' }
  ```
- **4**: Sorcerer units gain +30% ability damage, +20 starting mana. Sorcerer abilities refund 10% of max mana on cast.
  ```js
  { desc: 'Sorcerers +30% ability dmg, +20 mana. Refund 10% on cast', abilityDmgBonus: 0.30, startingManaBonus: 20, abilityManaRefund: 0.10, scope: 'archetype' }
  ```
- **6**: Sorcerer units gain +50% ability damage, +30 starting mana, 15% mana refund. Sorcerer ability damage ignores 20% of target's damage reduction.
  ```js
  { desc: 'Sorcerers +50% ability, +30 mana, 15% refund. Spells ignore 20% DR', abilityDmgBonus: 0.50, startingManaBonus: 30, abilityManaRefund: 0.15, spellPenetration: 0.20, scope: 'archetype' }
  ```
- **8**: Sorcerer units gain +75% ability damage, +40 starting mana, 20% mana refund. Spells ignore 35% DR. After casting, Sorcerers gain +30% ATK speed for 3s (Arcane Surge). First cast each combat deals double damage.
  ```js
  { desc: 'Sorcerers +75% ability, +40 mana, 20% refund. 35% spell pen. Arcane Surge. First cast: x2', abilityDmgBonus: 0.75, startingManaBonus: 40, abilityManaRefund: 0.20, spellPenetration: 0.35, postCastAtkSpdBuff: 0.30, postCastAtkSpdDuration: 3, firstCastDoubleDamage: true, scope: 'archetype' }
  ```

### Mystic (2/4/6/8)
*Fantasy: "Elements amplified" -- element effects, element mastery*
*(Rarer archetype -- 6 primary units. Slightly stronger per-tier.)*
*Note: Mystic does NOT grant raw element damage % (that's element synergies' territory). Instead Mystic amplifies element effect DURATION and STATUS POTENCY, and grants element resist to Mystic units only.*

- **2**: Mystic units gain +20% element resist. Mystic abilities that apply element-based status effects (Burn, Freeze, Slow, etc.) have +20% increased duration.
  ```js
  { desc: 'Mystics +20% elem resist. Element status +20% duration', elemResist: 0.20, elemStatusDurationBonus: 0.20, scope: 'archetype' }
  ```
- **4**: Mystic units gain +35% element resist, +35% element status duration. Mystic abilities that apply element effects also reduce the target's element resist by 10% for 4s.
  ```js
  { desc: 'Mystics +35% elem resist, +35% status dur. Shred 10% elem resist 4s', elemResist: 0.35, elemStatusDurationBonus: 0.35, elemResistShred: 0.10, elemResistShredDuration: 4, scope: 'archetype' }
  ```
- **6**: Mystic units gain +50% element resist, +50% element status duration. Resist shred increases to 20%. Mystic units gain +15% ability damage per unique element on the team.
  ```js
  { desc: 'Mystics +50% elem resist, +50% status dur. 20% shred. +15% ability per unique element', elemResist: 0.50, elemStatusDurationBonus: 0.50, elemResistShred: 0.20, elemResistShredDuration: 4, abilityDmgPerElement: 0.15, scope: 'archetype' }
  ```
- **8**: Mystic units gain +65% element resist, +65% element status duration. 30% resist shred. +20% ability per unique element. Mystic abilities have a 25% chance to apply a second random element effect (Burn, Freeze, or Root for 2s) on hit.
  ```js
  { desc: 'Mystics +65% resist, +65% status. 30% shred. +20%/elem. 25% bonus element proc', elemResist: 0.65, elemStatusDurationBonus: 0.65, elemResistShred: 0.30, elemResistShredDuration: 4, abilityDmgPerElement: 0.20, randomElementProcChance: 0.25, randomElementProcDuration: 2, scope: 'archetype' }
  ```

### Sage (2/4/6/8)
*Fantasy: "No one falls" -- healing power, sustain, overheal*
*All bonuses affect Sage units' healing output. No team-wide passive regen.*

- **2**: Sage units gain +35% healing power (affects all healing they do).
  ```js
  { desc: 'Sages +35% healing power', healBonus: 0.35, scope: 'archetype' }
  ```
- **4**: Sage units gain +70% healing power. Sage heals also grant a Shield equal to 15% of the heal amount (2s duration).
  ```js
  { desc: 'Sages +70% healing. Heals grant 15% shield', healBonus: 0.70, healShieldPct: 0.15, healShieldDuration: 2, scope: 'archetype' }
  ```
- **6**: Sage units gain +110% healing power. Heals grant 25% shield (4s). Sage units gain +3 mana per second (faster ability cycling).
  ```js
  { desc: 'Sages +110% healing. 25% shield 4s. +3 mana/s', healBonus: 1.10, healShieldPct: 0.25, healShieldDuration: 4, passiveManaPerSec: 3, scope: 'archetype' }
  ```
- **8**: Sage units gain +160% healing power. Heals grant 35% shield (6s). +5 mana/s. Overhealing converts to a permanent Shield at 60% efficiency (persists until broken). Once per combat, when any ally would die, the strongest Sage intervenes -- the lethal hit is negated and the ally is healed to 25% HP.
  ```js
  { desc: 'Sages +160% healing. 35% shield 6s. +5 mana/s. Overheal->shield. Save an ally from death 1x', healBonus: 1.60, healShieldPct: 0.35, healShieldDuration: 6, passiveManaPerSec: 5, overhealToShieldPct: 0.60, deathSaveOnce: true, deathSaveHealPct: 0.25, scope: 'archetype' }
  ```

---

## Comparison Table

| Archetype | Old Thresholds | Old Scope | New Thresholds | New Scope | Key Changes |
|-----------|---------------|-----------|---------------|-----------|-------------|
| **Guardian** | 2/4/6 | Archetype | 2/4/6/8 | Archetype | Added start shield, shield-break tenacity, last-stand invuln capstone |
| **Warden** | 2/4 | Team (tenacity) | 2/4/6/8 | Archetype | Tenacity now Warden-only. Added CC spread, ATK speed slow on CC |
| **Vanguard** | 2/4 | Front-row (any) | 2/4/6/8 | Archetype | Now buffs Vanguard units (x2 if front row). Added charge bonus, lifesteal |
| **Duelist** | 2/4/6 | Archetype | 2/4/6/8 | Archetype | Added guaranteed crit every Nth, ramping ATK% capstone |
| **Predator** | 2/4 | Archetype | 2/4/6/8 | Archetype | Added on-kill frenzy, raised execute threshold at 8, mana refund capstone |
| **Ranger** | 2/4/6 | Archetype | 2/4/6/8 | Archetype | Added focused shot, mark target, pierce-all capstone |
| **Sorcerer** | 2/4/6 | Archetype | 2/4/6/8 | Archetype | Added spell penetration, Arcane Surge, first-cast-x2 capstone |
| **Mystic** | 2/4 | Partial team | 2/4/6/8 | Archetype | Removed raw elem dmg% (that's element synergy). Now amplifies status duration, shreds resist, procs extra elements |
| **Sage** | 2/4/6 | Team (regen) | 2/4/6/8 | Archetype | Removed team regen. Now heal-shield, passive mana, overheal->shield, death-save capstone |

---

## Reachability Notes

### By Game Phase

| Phase | Max Archetype Count | Reachable Thresholds | How |
|-------|-------------------|---------------------|-----|
| **Early game** (3-5 units) | 2-3 | **2** easily, **4** with luck | 2 primary archetype units on the board |
| **Mid game** (6-7 units) | 3-5 | **2** trivial, **4** common | Focused drafting of one archetype |
| **Late game** (8-9 units) | 4-6 | **4** easy, **6** with investment | Awakened units contribute secondary archetypes |
| **Ascension builds** (9 units, Transcendent) | 6-10 | **6** common, **8** achievable | Transcendent primary (counts as 2) + Awakened secondaries |

### Reachability by Archetype (Primary Count)

| Archetype | Primary Units | Ease of Reaching 4 | Ease of Reaching 6 | Ease of Reaching 8 |
|-----------|:------------:|:-------------------:|:-------------------:|:-------------------:|
| Guardian | 8 | Easy | Moderate | Moderate (many primaries) |
| Duelist | 7 | Easy | Moderate | Moderate |
| Predator | 7 | Easy | Moderate | Moderate |
| Sage | 7 | Easy | Moderate | Moderate |
| Sorcerer | 7 | Easy | Moderate | Moderate |
| Ranger | 6 | Moderate | Hard | Hard |
| Vanguard | 6 | Moderate | Hard | Hard |
| Mystic | 6 | Moderate | Hard | Hard |
| Warden | 6 | Moderate | Hard | Hard |

**Key insight**: Reaching 8 always requires either (a) multiple Transcendent units of that archetype, or (b) a mix of Transcendent primaries + Awakened secondaries. This is by design -- 8 is the "deep commitment" reward.

---

## Balance Considerations

### Power Budget Concerns

1. **Duelist 8 ramping ATK (+1%/s)**: Uncapped scaling is dangerous. In a 60s fight, that's +60% ATK. Combined with 55% double-strike and 20% lifesteal, Duelists become unkillable DPS monsters. **Mitigation**: The investment cost of reaching 8 Duelist is enormous (9 units, most must be Duelist archetype). If still too strong, cap the ramping at +40%.

2. **Sage 8 death-save**: A once-per-combat save is powerful but limited. The real power is the 160% heal bonus + overheal-to-permanent-shield, which makes Sage teams nearly unkillable in sustained fights. **Mitigation**: Burn and Poison reduce healing by 25-50%, which directly counters Sage stacking. Fire teams are the natural counter.

3. **Ranger 8 mark (+15% dmg from all sources)**: This is a team-wide debuff on the marked target, which bends the "archetype-scoped" rule. **Justification**: Rangers are rare (6 primary), reaching 8 is very hard, and the mark only affects the Ranger's current target -- not all enemies. It rewards focus-fire team comps.

4. **Warden 8 CC spread (root nearby enemies)**: Could create stunlock chains in combination with multiple CC abilities. **Mitigation**: Diminishing returns on CC (existing system) prevents infinite chains. The 1s root from spread is short and subject to DR. Also, Warden is rare (6 primary) so reaching 8 is very costly.

### Archetype Interaction Highlights

| Combo | Synergy |
|-------|---------|
| Guardian + Sage | Guardians tank forever with Sage overheal shields. Counter: Predator execute damage. |
| Predator + Duelist | Maximum sustained + burst DPS. Fragile -- no innate tankiness. Counter: Warden CC. |
| Sorcerer + Mystic | Ability damage + element amplification. Glass cannon mage comp. Counter: Guardian DR + Ranger focus-fire. |
| Vanguard + Warden | Unkillable frontline with CC chain. Low backline damage. Counter: Ranger pierce bypasses front. |
| Ranger + Predator | Backline DPS + cleanup. Vulnerable to assassin dive. Counter: Warden CC on divers. |

### Edge Cases

- **Mystic `abilityDmgPerElement`**: With 6 elements in the game, a 4-element team gives Mystics +60% (at 6-threshold) or +80% (at 8-threshold) ability damage. This is strong but requires sacrificing archetype depth for element diversity -- a meaningful trade-off.
- **Vanguard `frontRowMultiplier`**: If a Vanguard unit is placed in the back row (e.g., a Vanguard archer with secondary archetype), they still get the base bonus, just not doubled. This keeps the synergy functional for non-tank Vanguard units.
- **Sorcerer `firstCastDoubleDamage`**: Only applies to the first ability cast per Sorcerer per combat. Instant-cast or low-mana Sorcerers benefit most. This creates interesting draft decisions around mana costs.
- **Predator `executeThreshold` at 8 (60%)**: This means Predators deal +50% bonus damage to enemies below 60% HP. Combined with their ATK speed, enemies in the bottom half of HP melt instantly. Teams must either burst Predators down first or run enough healing to keep units above 60%.

### Migration Notes

The `scope: 'archetype'` property is new. The combat engine's synergy application code needs to be updated to check whether each unit has the relevant archetype (primary OR secondary) before applying bonuses. Currently some synergies implicitly apply to all allies -- those code paths need to be scoped.

The `frontRowMultiplier` for Vanguard replaces the old `frontHpBonus`/`frontAtkBonus` system. Instead of buffing any front-row unit, it buffs Vanguard units with a conditional multiplier based on row placement.

New combat-triggered effects (shield-break tenacity, CC spread, death-save, etc.) will require new hooks in the combat engine's event system. These should be implemented as combat event listeners, not hardcoded checks.

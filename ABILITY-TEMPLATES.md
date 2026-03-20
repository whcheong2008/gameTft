# Ability Playstyle Templates

> 25 templates that define recurring ability/passive patterns. Each element picks 4-5 of these as its "base playstyles," giving units within that element consistency while still allowing randomization of specific numbers, names, and flavor.

---

## How Templates Work

Each template defines:
- **Fantasy**: The player-facing identity ("I'm the DoT guy", "I'm the burst assassin")
- **Passive Pattern**: What the innate passive does mechanically
- **Ability Pattern**: What the active ability does (targeting, effects, shape)
- **Scaling Feel**: How the unit gets stronger over the fight (ramp, frontload, conditional)
- **Best Unit Types**: Which unit types (Warrior, Mage, etc.) this template fits naturally

When generating a unit, the system picks an element → picks one of that element's assigned templates → skins the template with element-appropriate flavor (burn for fire, slow for water, etc.).

---

## The 25 Templates

### — DAMAGE-OVER-TIME FAMILY —

#### 1. DoT Spreader
**Fantasy**: "Everything is slowly dying around me."
**Passive Pattern**: Auto-attacks apply a stacking or spreading DoT. Hitting already-afflicted targets amplifies the effect.
**Ability Pattern**: AoE that applies DoT to all hit. Bonus damage to targets already suffering DoT.
**Scaling Feel**: Slow ramp — gets devastating once multiple enemies are ticking.
**Best Types**: Mage, Archer, Warrior
**Element Fit**: Fire (burn), Water (corrosion/chill), Lightning (static buildup), Earth (poison thorns)

#### 2. DoT Detonator
**Fantasy**: "I set them up, then blow them up."
**Passive Pattern**: Attacks mark enemies with stacking debuff. At X stacks (or on ability cast), marks detonate for burst damage.
**Ability Pattern**: Single-target or small AoE that consumes all DoT/marks on targets, dealing bonus damage per tick/stack remaining.
**Scaling Feel**: Setup → payoff. Patience rewarded with huge spikes.
**Best Types**: Mage, Assassin
**Element Fit**: Fire (ignite → explode), Lightning (charge → discharge), Force (pressure → rupture)

#### 3. Aura Burner
**Fantasy**: "Stand near me and suffer."
**Passive Pattern**: Enemies within X cells take passive damage per second. Aura grows stronger or wider over time.
**Ability Pattern**: Pulse AoE centered on self. Amplifies aura temporarily or applies additional status.
**Scaling Feel**: Proximity-based steady damage. Rewards aggressive positioning.
**Best Types**: Tank, Warrior, Mage
**Element Fit**: Fire (heat aura), Lightning (static field), Force (crushing presence)

---

### — BURST DAMAGE FAMILY —

#### 4. Execute Striker
**Fantasy**: "I finish what others started."
**Passive Pattern**: Bonus damage against low-HP targets (below X% threshold). Kills grant a buff (mana, speed, attack reset).
**Ability Pattern**: High-multiplier single-target hit. Guaranteed crit or massive bonus if target is below threshold.
**Scaling Feel**: Frontloaded against weakened targets. Snowballs through resets on kill.
**Best Types**: Assassin, Warrior
**Element Fit**: Force (raw finishing power), Wind (swift execution), Water (drowning strike)

#### 5. Frontload Nuker
**Fantasy**: "My first hit wins the fight."
**Passive Pattern**: First attack or ability in combat deals massive bonus damage. Subsequent attacks are weaker until cooldown resets.
**Ability Pattern**: Huge single-target or cone damage. Often has a long mana cost but devastating first cast.
**Scaling Feel**: All-in opener. If first cast doesn't swing the fight, unit is weaker mid-combat.
**Best Types**: Mage, Assassin
**Element Fit**: Lightning (thunder strike), Fire (inferno blast), Force (meteor punch)

#### 6. Chain Killer
**Fantasy**: "Each kill makes the next one easier."
**Passive Pattern**: On kill, gain stacking buff (ATK, speed, crit). Buffs persist until combat ends or timer expires.
**Ability Pattern**: Dash or targeted strike. Refunds mana/cooldown on kill. Reposition to next target.
**Scaling Feel**: Snowball — weak start, terrifying if they start chaining.
**Best Types**: Assassin, Warrior
**Element Fit**: Wind (blitz kills), Lightning (chain lightning resets), Force (unstoppable momentum)

---

### — AREA CONTROL FAMILY —

#### 7. Zone Creator
**Fantasy**: "This area belongs to me now."
**Passive Pattern**: Attacks leave persistent ground effects (fire pools, ice patches, static fields) that damage or debuff enemies standing in them.
**Ability Pattern**: Create a large zone at target location. Zone persists for X seconds, dealing damage and/or applying CC to enemies inside.
**Scaling Feel**: Positional. Value depends on enemy movement and board state.
**Best Types**: Mage, Tank
**Element Fit**: Fire (lava zones), Water (whirlpools), Earth (quake fissures), Lightning (storm clouds)

#### 8. Crowd Puller
**Fantasy**: "Come here — all of you."
**Passive Pattern**: Attacks pull or slow enemies slightly, keeping them close. Taunt-like aggro manipulation.
**Ability Pattern**: AoE that pulls enemies toward a point (self or target location). Deals damage and applies CC (root, slow) after pull.
**Scaling Feel**: Setup enabler. Creates clumps for allied AoE to capitalize on.
**Best Types**: Tank, Warrior, Mage
**Element Fit**: Water (maelstrom pull), Earth (gravity well), Force (telekinetic pull)

#### 9. Terrain Shaper
**Fantasy**: "I reshape the battlefield."
**Passive Pattern**: Periodically creates obstacles or modifiers on the grid (walls, elevation, hazards). Changes pathing.
**Ability Pattern**: Create impassable terrain or buff zones. Allies in zone get bonuses, enemies get debuffs.
**Scaling Feel**: Strategic — value scales with player's positioning intelligence.
**Best Types**: Mage, Tank, Healer
**Element Fit**: Earth (rock walls), Wind (air currents), Water (frozen ground)

---

### — SUSTAINED DPS FAMILY —

#### 10. Ramping Attacker
**Fantasy**: "The longer I hit you, the harder I hit."
**Passive Pattern**: Each consecutive attack on same target increases damage by X% (stacking). Switching targets resets stacks.
**Ability Pattern**: Self-buff that increases attack speed or grants multi-hit for a duration. Amplifies the ramp.
**Scaling Feel**: Slow start, monster late-fight. Rewards being left alone to stack.
**Best Types**: Warrior, Archer, Assassin
**Element Fit**: Fire (heating up), Wind (building momentum), Lightning (overcharging), Force (relentless pressure)

#### 11. Multi-Striker
**Fantasy**: "I attack so many times you can't keep up."
**Passive Pattern**: Chance to double-strike (attack twice per attack cycle). Bonus effects on double-strike (lifesteal, mana gen, on-hit procs).
**Ability Pattern**: Unleash flurry of X attacks over short duration, each dealing reduced damage but proccing on-hit effects.
**Scaling Feel**: Consistent DPS through volume. Synergizes with on-hit items and lifesteal.
**Best Types**: Warrior, Assassin
**Element Fit**: Wind (rapid strikes), Lightning (crackling blows), Force (fist barrage)

#### 12. Drain Fighter
**Fantasy**: "I heal from hurting you."
**Passive Pattern**: Percentage of damage dealt converts to self-healing. Bonus healing when below HP threshold.
**Ability Pattern**: Deal damage to target(s) and heal self for percentage of damage dealt. May steal a stat (ATK, speed) from target.
**Scaling Feel**: Outlast-focused. Wins through attrition rather than burst.
**Best Types**: Warrior, Assassin, Healer
**Element Fit**: Water (life drain), Earth (rooted resilience), Force (battle sustain)

---

### — SUPPORT / BUFF FAMILY —

#### 13. Aura Buffer
**Fantasy**: "My team fights better just because I exist."
**Passive Pattern**: Nearby allies gain flat stat bonus (ATK, speed, crit, DR). Aura persists as long as unit is alive.
**Ability Pattern**: Pulse that temporarily amplifies the aura or grants an additional team-wide buff (shield, cleanse, mana).
**Scaling Feel**: Steady value. Stronger with more allies nearby.
**Best Types**: Healer, Tank, Warrior
**Element Fit**: Every element (flavored differently — fire = ATK aura, water = DR aura, etc.)

#### 14. Heal-and-Harm
**Fantasy**: "I heal my team and punish the enemy at the same time."
**Passive Pattern**: Healing abilities also deal damage to nearby enemies, or heals apply an offensive debuff to nearest enemy.
**Ability Pattern**: Heal ally/allies while simultaneously dealing damage or applying CC to enemy/enemies.
**Scaling Feel**: Dual-purpose value. Efficient but not best-in-class at either role.
**Best Types**: Healer, Mage
**Element Fit**: Fire (cauterizing heal + burn), Lightning (shock heal + stun), Force (holy strike)

#### 15. Shield Stacker
**Fantasy**: "My team is wrapped in armor."
**Passive Pattern**: Periodically grant self or nearby allies a small shield. Shields stack or refresh.
**Ability Pattern**: Grant large shield to self and/or allies. May also grant DR or CC resistance during shield duration.
**Scaling Feel**: Preventive — value realized when shields absorb meaningful damage.
**Best Types**: Tank, Healer
**Element Fit**: Earth (rock shields), Water (ice armor), Force (barrier), Wind (deflection)

---

### — CROWD CONTROL FAMILY —

#### 16. Lockdown Specialist
**Fantasy**: "You're not going anywhere."
**Passive Pattern**: Attacks have chance to root or slow. Rooted enemies take bonus damage from this unit.
**Ability Pattern**: Root or stun target(s) for significant duration. Apply damage amp or DR reduction to locked targets.
**Scaling Feel**: Control-focused. Enables team's damage dealers to freely hit locked targets.
**Best Types**: Mage, Tank, Archer
**Element Fit**: Earth (root), Water (freeze), Lightning (paralyze)

#### 17. Disruptor
**Fantasy**: "I break their formation and gameplan."
**Passive Pattern**: Attacks reduce enemy mana, silence briefly, or cancel channels. Anti-caster identity.
**Ability Pattern**: AoE silence or mana burn. May displace enemies (knockback, pull) to break positioning.
**Scaling Feel**: Anti-meta. Strongest against ability-heavy enemy comps.
**Best Types**: Assassin, Mage, Warrior
**Element Fit**: Wind (silence tornado), Lightning (EMP pulse), Force (mana crush)

#### 18. CC Chainer
**Fantasy**: "One stun leads to the next."
**Passive Pattern**: After applying CC, gain buff that makes next CC longer or apply a different CC type (stun → root → slow chain).
**Ability Pattern**: Apply CC to multiple targets in sequence or in AoE. Extended duration or cascading CC types.
**Scaling Feel**: Teamfight controller. Locks down key targets during critical windows.
**Best Types**: Tank, Mage, Warrior
**Element Fit**: Water (freeze chains), Earth (earthquake sequences), Lightning (chain stun)

---

### — EVASION / MOBILITY FAMILY —

#### 19. Dodge Tank
**Fantasy**: "You can't hit what you can't catch."
**Passive Pattern**: High base dodge. Dodged attacks trigger counter-effect (counter-attack, mana gain, speed boost).
**Ability Pattern**: Gain massive dodge buff for short duration. Counter-attack all dodged hits during window.
**Scaling Feel**: RNG-dependent but high ceiling. Incredible when dodges chain.
**Best Types**: Assassin, Warrior
**Element Fit**: Wind (natural fit), Water (slippery), Force (iron reflexes)

#### 20. Blink Striker
**Fantasy**: "I'm everywhere and nowhere."
**Passive Pattern**: After using ability, teleport to a new position (random or strategic). Gain brief invulnerability or stealth after teleport.
**Ability Pattern**: Teleport to target, deal damage, teleport back or to safety. May hit multiple targets during dashes.
**Scaling Feel**: Hard to pin down. Survivability through constant repositioning.
**Best Types**: Assassin, Mage
**Element Fit**: Wind (wind step), Lightning (flash), Force (phase shift)

---

### — TANK / SURVIVOR FAMILY —

#### 21. Revenge Tank
**Fantasy**: "Hit me. I dare you."
**Passive Pattern**: Reflect percentage of damage taken back to attacker. Gain stacking buff as HP drops (ATK, DR, or both).
**Ability Pattern**: Taunt enemies. During taunt, reflect amplified damage. May explode for damage proportional to damage absorbed.
**Scaling Feel**: Gets stronger as they get weaker. Punishes focus-fire.
**Best Types**: Tank, Warrior
**Element Fit**: Fire (molten revenge), Earth (thorny defense), Lightning (shock reflection)

#### 22. Unkillable Wall
**Fantasy**: "I just... don't die."
**Passive Pattern**: Self-healing triggers at HP thresholds. DR increases as HP decreases. May have revive or damage immunity phase.
**Ability Pattern**: Massive self-shield or self-heal. Brief invulnerability. May root self in place for enhanced tanking.
**Scaling Feel**: Pure stall. Buys time for carries to clean up.
**Best Types**: Tank
**Element Fit**: Earth (stone form), Water (regenerative), Force (indomitable will)

#### 23. Bodyguard
**Fantasy**: "Touch my carry and you deal with me."
**Passive Pattern**: Redirect damage from lowest-HP or nearest ally to self. Gain DR when protecting.
**Ability Pattern**: Leap to endangered ally, gain shield, taunt nearby enemies. May grant ally a shield too.
**Scaling Feel**: Positional — needs to be near the right ally. Incredible when protecting a carry.
**Best Types**: Tank, Warrior
**Element Fit**: Force (loyal guardian), Earth (stone sentinel), Wind (wind shield)

---

### — HYBRID / UNIQUE FAMILY —

#### 24. Summoner
**Fantasy**: "I bring friends to the fight."
**Passive Pattern**: Periodically summon a minor unit (low stats, short duration). Summons inherit element and apply on-hit effects.
**Ability Pattern**: Summon a stronger temporary unit or empower existing summons. Summons can tank, deal damage, or apply CC.
**Scaling Feel**: Board presence. Dilutes enemy targeting and adds bodies.
**Best Types**: Mage, Healer
**Element Fit**: Earth (stone golems), Fire (fire elementals), Water (water sprites), Lightning (ball lightning)

#### 25. Transformer
**Fantasy**: "I have two modes and I switch between them."
**Passive Pattern**: Toggle between two stances (offensive/defensive). Each stance has different stat bonuses and on-hit effects.
**Ability Pattern**: Switch stance. Gain burst of the new stance's theme (offense stance = burst damage, defense stance = shield + taunt).
**Scaling Feel**: Adaptable. Player positions based on which stance they want active.
**Best Types**: Warrior, Tank
**Element Fit**: Fire (flame form/ember form), Force (attack/defend), Water (wave/ice), Wind (gale/calm)

---

## Element → Template Assignments (With Cross-Element Overlaps)

Each element gets 5 templates. Templates are **shared across 2 elements** to create informal "bridge synergies" — when you pair two elements that share a template, units from both elements naturally combo even without formal synergy bonuses. Each element also has 1-2 **signature templates** (★) that are exclusive to that element, preserving its unique identity.

### Template Overlap Map

```
         Fire    Water   Earth   Wind    Lightning   Force
         ────    ─────   ─────   ────    ─────────   ─────
T1  DoT Spreader ★  │       │       │        │          │
T2  DoT Detonator ──┼───────┼───────┼────────●──────────┤  Fire ↔ Lightning
T3  Revenge Tank ───┼───────●───────┼────────┼──────────┤  Fire ↔ Earth
T4  Heal-and-Harm ──●───────┼───────┼────────┼──────────┤  Fire ↔ Water
T5  Execute Striker ─┼───────┼───────┼────────┼──────────●  Fire ↔ Force
T6  Crowd Puller ────● ★    │       │        │          │
T7  Shield Stacker ──●───────●───────┼────────┼──────────┤  Water ↔ Earth
T8  CC Chainer ──────●───────┼───────┼────────●──────────┤  Water ↔ Lightning
T9  Drain Fighter ───●───────┼───────●────────┼──────────┤  Water ↔ Wind
T10 Terrain Shaper ──┼───────● ★     │        │          │
T11 Lockdown Spec. ──┼───────●───────┼────────●──────────┤  Earth ↔ Lightning
T12 Unkillable Wall ─┼───────●───────┼────────┼──────────●  Earth ↔ Force
T13 Dodge Tank ──────┼───────┼───────● ★      │          │
T14 Chain Killer ────┼───────┼───────●────────●──────────┤  Wind ↔ Lightning
T15 Blink Striker ───┼───────┼───────●────────┼──────────●  Wind ↔ Force
T16 Multi-Striker ───┼───────┼───────● ★      │          │
T17 Frontload Nuker ─┼───────┼───────┼────────● ★        │
T18 Ramping Attacker ┼───────┼───────┼────────┼──────────● ★
T19 Bodyguard ───────┼───────┼───────┼────────┼──────────● ★
```

★ = Signature template (exclusive to that element)

### Fire — "Burn & Burst"
| # | Template | Type | Bridge | Element Flavor |
|---|----------|------|--------|----------------|
| 1 | **DoT Spreader** | ★ Signature | — | Burns spreading across the battlefield. Fire's core. |
| 2 | **DoT Detonator** | Bridge | ↔ Lightning | Stack ignite marks → detonate for burst. |
| 3 | **Revenge Tank** | Bridge | ↔ Earth | Molten armor — hit me and get scorched. |
| 4 | **Heal-and-Harm** | Bridge | ↔ Water | Cauterizing flame — heals allies, sears enemies. |
| 5 | **Execute Striker** | Bridge | ↔ Force | Blazing finisher — incinerates the wounded. |

*Fire connects to 4 elements. Only Wind has no bridge — fire and wind are thematic opposites here (patient burn vs hit-and-run speed).*

### Water — "Control & Sustain"
| # | Template | Type | Bridge | Element Flavor |
|---|----------|------|--------|----------------|
| 1 | **Crowd Puller** | ★ Signature | — | Maelstrom, whirlpool — drag them in. |
| 2 | **Shield Stacker** | Bridge | ↔ Earth | Ice armor, frost barriers, layered protection. |
| 3 | **CC Chainer** | Bridge | ↔ Lightning | Freeze chains — one frozen, then the next. |
| 4 | **Drain Fighter** | Bridge | ↔ Wind | Life siphon — sustain through stealing vitality. |
| 5 | **Heal-and-Harm** | Bridge | ↔ Fire | Healing tides that chill enemies caught in the wave. |

*Water connects to 4 elements. Only Force has no bridge — water's finesse clashes with Force's bluntness.*

### Earth — "Shields & Endurance"
| # | Template | Type | Bridge | Element Flavor |
|---|----------|------|--------|----------------|
| 1 | **Terrain Shaper** | ★ Signature | — | Raise rock walls, split the ground, reshape the field. |
| 2 | **Shield Stacker** | Bridge | ↔ Water | Stone armor, layered rock barriers. |
| 3 | **Revenge Tank** | Bridge | ↔ Fire | Thorny bark — hit me and get impaled. |
| 4 | **Unkillable Wall** | Bridge | ↔ Force | Stone form. Immovable. Unbreakable. |
| 5 | **Lockdown Specialist** | Bridge | ↔ Lightning | Roots that entangle, vines that bind. |

*Earth connects to 4 elements. Only Wind has no bridge — earth is immovable, wind is unstoppable. When you DO force them together via formal synergies, the clash creates an interesting team identity.*

### Wind — "Speed & Evasion"
| # | Template | Type | Bridge | Element Flavor |
|---|----------|------|--------|----------------|
| 1 | **Dodge Tank** | ★ Signature | — | Can't hit what you can't catch. |
| 2 | **Multi-Striker** | ★ Exclusive | — | Rapid wind slashes — attack speed fantasy. |
| 3 | **Chain Killer** | Bridge | ↔ Lightning | Blitz through enemies, kill resets, never stop moving. |
| 4 | **Blink Striker** | Bridge | ↔ Force | Teleport, strike, vanish. Wind mobility at its purest. |
| 5 | **Drain Fighter** | Bridge | ↔ Water | Siphoning wind — steal breath, steal life. |

*Wind has 2 exclusives, giving it the most distinct identity. Bridges to Lightning (speed), Force (aggression), and Water (sustain). No bridge to Fire or Earth — wind is the "loner" element that plays its own game.*

### Lightning — "Crits & Chain"
| # | Template | Type | Bridge | Element Flavor |
|---|----------|------|--------|----------------|
| 1 | **Frontload Nuker** | ★ Signature | — | One thunderbolt to rule them all. |
| 2 | **DoT Detonator** | Bridge | ↔ Fire | Build static charge → discharge devastating burst. |
| 3 | **CC Chainer** | Bridge | ↔ Water | Paralyze chains — stun cascading through the enemy team. |
| 4 | **Chain Killer** | Bridge | ↔ Wind | Chain lightning — each kill arcs to the next target. |
| 5 | **Lockdown Specialist** | Bridge | ↔ Earth | Electromagnetic bind — rooted by current. |

*Lightning is the most "social" element — bridges to 4 others. Fits its chain/arc theme: lightning naturally connects things. Only Force has no bridge, because Lightning is volatile and Force is steady.*

### Force — "Raw Power & Resilience"
| # | Template | Type | Bridge | Element Flavor |
|---|----------|------|--------|----------------|
| 1 | **Ramping Attacker** | ★ Signature | — | Relentless pressure that builds unstoppably. |
| 2 | **Bodyguard** | ★ Exclusive | — | Loyal protector. Touch my carry, deal with me. |
| 3 | **Unkillable Wall** | Bridge | ↔ Earth | Indomitable will — sheer refusal to fall. |
| 4 | **Execute Striker** | Bridge | ↔ Fire | Brute finisher — crush the weakened. |
| 5 | **Blink Striker** | Bridge | ↔ Wind | Phase shift — teleport through raw force of will. |

*Force has 2 exclusives like Wind, giving it a strong standalone identity. Bridges to Earth (tankiness), Fire (damage), and Wind (mobility). No bridge to Water or Lightning — Force is the "self-sufficient" element.*

---

## Cross-Element Bridge Synergies

When two elements share a template, units generated from that template naturally complement each other. Here are the 11 bridge pairs and what they feel like in practice:

### Damage Bridges
| Bridge | Shared Template | Synergy Fantasy |
|--------|----------------|-----------------|
| **Fire + Lightning** | DoT Detonator | "The Explosion Comp" — Fire stacks burns, Lightning stacks charge, both detonate simultaneously for synchronized burst. |
| **Fire + Force** | Execute Striker | "The Finisher Comp" — Fire weakens with burns, Force finishes with raw power. Complementary kill pipeline. |
| **Wind + Lightning** | Chain Killer | "The Blitz Comp" — Kill resets chain across the enemy backline. Both elements want to snowball through kills. |

### Control Bridges
| Bridge | Shared Template | Synergy Fantasy |
|--------|----------------|-----------------|
| **Water + Lightning** | CC Chainer | "The Lockdown Comp" — Freeze into paralyze into freeze. Enemies never get to act. |
| **Earth + Lightning** | Lockdown Specialist | "The Prison Comp" — Root + stun. Enemies can't move AND can't attack. |
| **Water + Earth** | Shield Stacker | "The Fortress Comp" — Ice armor + rock shields. Layers of protection. Unkillable frontline. |

### Sustain Bridges
| Bridge | Shared Template | Synergy Fantasy |
|--------|----------------|-----------------|
| **Water + Wind** | Drain Fighter | "The Siphon Comp" — Both elements sustain through damage. Hard to kill through attrition. |
| **Fire + Water** | Heal-and-Harm | "The Steam Comp" — Healing with collateral damage. Support units that also hurt. |
| **Earth + Force** | Unkillable Wall | "The Immovable Comp" — Tanks that simply refuse to die. Pure stall while carries clean up. |

### Aggression Bridges
| Bridge | Shared Template | Synergy Fantasy |
|--------|----------------|-----------------|
| **Wind + Force** | Blink Striker | "The Dive Comp" — Teleport assassins from two elements. Backline is never safe. |
| **Fire + Earth** | Revenge Tank | "The Thorns Comp" — Hit the frontline, take damage back. Punishes enemy aggression. |

### Unbridged Pairs (4 out of 15)
These element combos have NO shared template — they're "anti-synergy" pairs that don't naturally mesh. Fielding them together relies entirely on formal element/archetype synergies, not template overlap. This makes them harder to build but potentially surprising:

| Pair | Why No Bridge | What It Means |
|------|--------------|---------------|
| **Fire + Wind** | Burn is patient, Wind is impatient | Wind kills too fast for burns to tick. Requires deliberate "burn then blitz" sequencing. |
| **Water + Force** | Control vs brute force | Force doesn't need CC, Water doesn't need raw power. They solve problems differently. |
| **Earth + Wind** | Immovable vs unstoppable | Earth wants to stand still, Wind wants to move. Positioning tension. |
| **Lightning + Force** | Volatile vs steady | Lightning spikes randomly, Force builds predictably. Opposite risk profiles. |

*The 4 unbridged pairs aren't "bad" combos — they just require more creative team-building. A player who figures out Fire+Wind (burn then execute before ticks expire) gets rewarded for thinking outside the template system.*

---

## Template Usage Summary

| Template | Elements | Count |
|----------|----------|-------|
| DoT Spreader | Fire | 1 (signature) |
| DoT Detonator | Fire, Lightning | 2 |
| Revenge Tank | Fire, Earth | 2 |
| Heal-and-Harm | Fire, Water | 2 |
| Execute Striker | Fire, Force | 2 |
| Crowd Puller | Water | 1 (signature) |
| Shield Stacker | Water, Earth | 2 |
| CC Chainer | Water, Lightning | 2 |
| Drain Fighter | Water, Wind | 2 |
| Terrain Shaper | Earth | 1 (signature) |
| Lockdown Specialist | Earth, Lightning | 2 |
| Unkillable Wall | Earth, Force | 2 |
| Dodge Tank | Wind | 1 (signature) |
| Multi-Striker | Wind | 1 (exclusive) |
| Chain Killer | Wind, Lightning | 2 |
| Blink Striker | Wind, Force | 2 |
| Frontload Nuker | Lightning | 1 (signature) |
| Ramping Attacker | Force | 1 (signature) |
| Bodyguard | Force | 1 (exclusive) |

**19 templates active** out of 25 designed. The remaining 6 (Aura Burner, Zone Creator, Aura Buffer, Summoner, Transformer, Disruptor) are reserved for:
- Legendary/T5 units that break template rules
- Future element expansions
- Boss units or special event units
- Ascended form upgrades that shift a unit's template

---

## Template → Stat Tendency Matrix

Each template implies certain stat priorities. This helps auto-generation produce sensible stat spreads:

| Template | HP | ATK | AtkSpd | Range | MoveSpd | MaxMana |
|----------|-----|-----|--------|-------|---------|---------|
| DoT Spreader | Med | Med-High | Med | 2-4 | Med | Med |
| DoT Detonator | Low-Med | High | Med | 1-3 | Med | Med-High |
| Execute Striker | Low-Med | High | Med-Fast | 1 | Fast | Low |
| Frontload Nuker | Low | V.High | Slow | 3-4 | Slow | High |
| Chain Killer | Low | Med-High | Fast | 1 | V.Fast | Low |
| Crowd Puller | High | Low | Med | 1-2 | Med | High |
| Terrain Shaper | Med | Med | Med | 3 | Med | High |
| Ramping Attacker | Med-High | Med→High | Med | 1 | Med | Med |
| Multi-Striker | Med | Med | V.Fast | 1 | Med-Fast | Med |
| Drain Fighter | Med-High | Med-High | Med | 1 | Med | Med |
| Heal-and-Harm | Med | Med | Med | 2-3 | Med | Med-High |
| Shield Stacker | High | Low | Slow | 1-2 | Slow | High |
| Lockdown Specialist | Med | Med | Med | 2-3 | Med | Med-High |
| CC Chainer | Med-High | Low-Med | Med | 1-2 | Med | High |
| Dodge Tank | Med | Med | Fast | 1 | Fast | Med |
| Blink Striker | Low | High | Med | 1 | V.Fast | Low-Med |
| Revenge Tank | V.High | Low | Slow | 1 | Slow | High |
| Unkillable Wall | V.High | V.Low | Slow | 1 | V.Slow | V.High |
| Bodyguard | High | Low-Med | Med | 1 | Med | Med-High |

---

## Usage in HTML Prototype

When generating a unit:
```
1. Pick element (Fire/Water/Earth/Wind/Lightning/Force)
2. Look up that element's 5 assigned templates
3. Pick one template at random (or weighted by unit type)
4. Skin the template:
   - Name the passive/ability with element flavor
   - Apply element's status effect (burn/slow/shield/dodge/crit/raw)
   - Use the stat tendency row to generate base stats
   - Scale by tier (T1 = base, T5 = ~2.5x)
5. Result: A unit that feels consistent with its element's playstyle
```

Cross-element teams naturally discover bridge synergies when two units from different elements share the same underlying template. This rewards players for experimenting with element combos beyond just chasing formal synergy thresholds.

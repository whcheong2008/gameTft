# Ability Revision — Template-Based Unit Abilities

> Replaces the ad-hoc per-unit ability design with template-driven abilities. Every unit's passive and ability now derives from one of 19 templates, skinned with element flavor. This creates consistent playstyle identity within elements while enabling informal cross-element synergies through shared templates.

---

## Template Mechanical Specs

Each template defines a **passive pattern** and **ability pattern** with concrete mechanics. Element skinning changes the status effect and flavor but not the underlying math.

### Element Status Mapping

| Element | Primary Status | Secondary Status | Damage Flavor |
|---------|---------------|-----------------|---------------|
| Fire | Burn (DPS over time) | — | True damage ticks |
| Water | Slow (ATK speed reduction) | Freeze (hard CC) | Healing reduction |
| Earth | Root (movement CC) | Shield (allies) | DR stacking |
| Wind | Dodge buff (evasion) | Silence | ATK speed buff |
| Lightning | Stun (hard CC) | Crit chance buff | Chain damage |
| Force | DR reduction (on enemy) | Vulnerability | Flat bonus damage |

---

## Concrete Template Definitions

### T1. DoT Spreader (Fire★)
**Passive**: Auto-attacks apply [element_dot] to target. If target already afflicted, spread to 1 nearby unafflicted enemy.
**Ability**: AoE around target (2-cell). Deal X% ATK. Apply [element_dot] to all hit. +40% bonus damage to already-afflicted targets.
**Mana**: 65-80
**Fire skin**: Burn (DPS ticks). Spread = fire jumping to new fuel.

### T2. DoT Detonator (Fire ↔ Lightning)
**Passive**: Attacks apply stacking marks on target (max 5). Each mark adds 3% vulnerability.
**Ability**: Single-target or small AoE. Deal X% ATK. Consume all marks on targets hit — each consumed mark adds 30% bonus damage to the hit.
**Mana**: 60-75
**Fire skin**: Ignite marks → Conflagration detonation. **Lightning skin**: Static charges → Discharge burst.

### T3. Revenge Tank (Fire ↔ Earth)
**Passive**: Reflect X% of melee damage taken back to attacker. Gain +1% DR per 10% missing HP.
**Ability**: Taunt enemies within 2 cells for 2s. During taunt, reflect is doubled. On taunt end, explode for damage equal to X% of damage absorbed.
**Mana**: 80-90
**Fire skin**: Molten armor, lava explosion. **Earth skin**: Thorny bark, quake burst.

### T4. Heal-and-Harm (Fire ↔ Water)
**Passive**: When healing an ally, also deal X% ATK damage to nearest enemy and apply [element_status].
**Ability**: Heal lowest-HP ally for X% ATK. Simultaneously deal X% ATK damage to nearby enemies. If ally below 35% HP, healing is 50% stronger.
**Mana**: 70-80
**Fire skin**: Cauterizing flame heals + burn on enemies. **Water skin**: Healing tide + slow on enemies.

### T5. Execute Striker (Fire ↔ Force)
**Passive**: Bonus X% damage against targets below 40% HP. On kill, gain ATK buff (15%) for 4s.
**Ability**: High-multiplier single-target hit (X% ATK). If target below 40% HP, guaranteed crit. On kill, refund 50% mana.
**Mana**: 40-65
**Fire skin**: Blazing finisher, incinerate the weak. **Force skin**: Brute crusher, raw finishing power.

### T6. Crowd Puller (Water★)
**Passive**: Auto-attacks slow target move speed by X% for 2s. Consecutive hits on same target increase slow strength.
**Ability**: AoE centered on target location (2-cell). Pull all enemies 1 cell toward center. Deal X% ATK. Apply slow/freeze.
**Mana**: 75-90
**Water skin**: Whirlpool, maelstrom drag.

### T7. Shield Stacker (Water ↔ Earth)
**Passive**: Every 6s, grant self and nearest ally Shield equal to X% max HP. Shields refresh (don't waste if existing).
**Ability**: Grant self Shield equal to X% max HP. All nearby allies (2 cells) gain Shield equal to Y% max HP. Shields grant +5% DR while active.
**Mana**: 75-85
**Water skin**: Ice armor, frost barriers. **Earth skin**: Stone shields, rock armor.

### T8. CC Chainer (Water ↔ Lightning)
**Passive**: After applying hard CC, next attack within 3s applies a different CC type (stun→slow→root cycle or freeze→stun cycle). Duration scales with tier.
**Ability**: AoE CC. Apply hard CC to enemies in area. Each subsequent target hit gets a different CC type. Cascading lockdown.
**Mana**: 80-90
**Water skin**: Freeze cascade. **Lightning skin**: Paralyze chain.

### T9. Drain Fighter (Water ↔ Wind)
**Passive**: X% of damage dealt heals self. Below 40% HP, drain rate doubles.
**Ability**: Deal X% ATK to target. Heal self for 50% of damage dealt. Steal 10% of target's ATK for 4s (target loses it, you gain it).
**Mana**: 60-70
**Water skin**: Life siphon, tidal drain. **Wind skin**: Breath steal, vitality siphon.

### T10. Terrain Shaper (Earth★)
**Passive**: After casting ability, create a buff zone (2-cell, 5s) at cast location. Allies in zone gain +8% DR and regen 1% HP/s.
**Ability**: Create impassable terrain wall (2 cells wide) OR create hazard zone at target location. Enemies in zone take X% ATK/s and are slowed.
**Mana**: 80-90
**Earth skin**: Rock walls, fissures, quake zones.

### T11. Lockdown Specialist (Earth ↔ Lightning)
**Passive**: Attacks have X% chance to root/stun target for 1s. Locked targets take +12% damage from this unit.
**Ability**: Root/stun target(s) for X seconds. Apply vulnerability (15% damage amp) to locked targets for the duration.
**Mana**: 70-85
**Earth skin**: Vine entangle, root prison. **Lightning skin**: Electromagnetic bind, paralysis field.

### T12. Unkillable Wall (Earth ↔ Force)
**Passive**: At 50% HP, gain X% DR. At 25% HP, gain damage immunity for 1.5s (once per combat). Self-heal X% max HP over next 4s.
**Ability**: Gain Shield equal to X% max HP. Gain +15% DR for 6s. Root self for 3s (enhanced tanking stance).
**Mana**: 85-95
**Earth skin**: Stone form, petrified defense. **Force skin**: Indomitable will, unbreakable stance.

### T13. Dodge Tank (Wind★)
**Passive**: X% base dodge. Each dodge triggers a counter-effect: gain 10 mana and deal 40% ATK back to attacker.
**Ability**: Gain +40% dodge for 3s. During this window, counter-attacks deal 80% ATK and apply [element_status].
**Mana**: 55-70
**Wind skin**: Windwalk, untouchable evasion.

### T14. Chain Killer (Wind ↔ Lightning)
**Passive**: On kill, gain +20% ATK speed and +15% move speed for 4s. Stacks up to 3 times.
**Ability**: Dash to target, deal X% ATK. On kill, immediately dash to next lowest-HP enemy and strike again. Can chain up to 3 kills.
**Mana**: 40-50
**Wind skin**: Blitz strike, gale chain. **Lightning skin**: Arc dash, chain lightning.

### T15. Blink Striker (Wind ↔ Force)
**Passive**: After using ability, teleport 2 cells away from nearest enemy. Gain 25% dodge for 2s after teleport.
**Ability**: Teleport to target (prioritize backline), deal X% ATK. If target dies, teleport to safety. Brief stealth (1s) after kill.
**Mana**: 40-50
**Wind skin**: Wind step, phase dash. **Force skin**: Phase shift, raw displacement.

### T16. Multi-Striker (Wind★)
**Passive**: X% chance per auto-attack to strike twice. Double-strikes generate bonus mana (+5) and proc on-hit effects.
**Ability**: Unleash flurry — 4 rapid strikes over 1s, each dealing X% ATK. Each hit can proc double-strike passive.
**Mana**: 55-65
**Wind skin**: Rapid gale slashes, wind flurry.

### T17. Frontload Nuker (Lightning★)
**Passive**: First ability cast in combat deals 50% bonus damage. Subsequent casts have 10s cooldown penalty (+10 mana cost).
**Ability**: Massive damage to target and small AoE (1-cell splash). Deal X% ATK. Apply stun for 1s.
**Mana**: 70-85
**Lightning skin**: Thunderbolt, devastating first strike.

### T18. Ramping Attacker (Force★)
**Passive**: Each consecutive attack on same target increases damage by X% (stacks up to 6). Switching targets resets stacks.
**Ability**: Self-buff for 5s: gain +30% ATK speed, each attack adds 2 stacks instead of 1. Attacks during buff cannot miss.
**Mana**: 60-70
**Force skin**: Relentless pressure, unstoppable momentum.

### T19. Bodyguard (Force★)
**Passive**: Redirect 20% of damage dealt to nearest ally (within 2 cells) to self instead. Gain +5% DR while redirecting.
**Ability**: Leap to lowest-HP ally. Grant them Shield equal to X% of Bodyguard's max HP. Taunt enemies within 2 cells for 2s. Gain Shield equal to Y% own max HP.
**Mana**: 75-85
**Force skin**: Loyal guardian, iron protector.

---

## Unit → Template Mapping & Revised Abilities

### FIRE ELEMENT (10 units)
Templates: DoT Spreader★, DoT Detonator↔Lightning, Revenge Tank↔Earth, Heal-and-Harm↔Water, Execute Striker↔Force

---

#### 1. Flame Warrior — T1, Warrior, Duelist → **Execute Striker**

**Stats**: HP 600, ATK 50, AtkSpd 0.85, Range 1, MoveSpd 1.9, MaxMana 60

**Innate Passive — Heated Blows**: Deal 20% bonus damage to targets below 40% HP. On kill, gain +15% ATK for 4s.

**Ability — Blade Inferno** (60 mana): Slash target for 200% ATK. If target below 40% HP, guaranteed crit. On kill, refund 50% mana. Apply Burn (12 DPS, 3s).

**Evolved Form — Fire Berserker**: Bonus damage threshold rises to 50% HP. Blade Inferno deals 280% ATK and applies Burn (20 DPS, 4s).

---

#### 2. Ember Scout — T1, Assassin, Predator → **DoT Detonator**

**Stats**: HP 390, ATK 46, AtkSpd 0.5, Range 1, MoveSpd 3.9, MaxMana 45

**Innate Passive — Ignite Mark**: Attacks apply Ignite marks on target (max 5). Each mark adds 3% vulnerability.

**Ability — Conflagration** (45 mana): Dash to target, deal 180% ATK. Consume all Ignite marks — each consumed mark adds 30% bonus damage. Apply Burn (10 DPS, 3s).

**Evolved Form — Flame Rogue**: Marks apply 5% vulnerability each. Conflagration refunds 30 mana on kill and Burn increases to 18 DPS.

---

#### 3. Cinder Archer — T1, Archer, Ranger → **DoT Spreader**

**Stats**: HP 360, ATK 52, AtkSpd 0.7, Range 4, MoveSpd 2.0, MaxMana 55

**Innate Passive — Spreading Flames**: Auto-attacks apply Burn (8 DPS, 3s). If target already Burning, spread Burn to 1 nearby unafflicted enemy.

**Ability — Fire Arrow** (55 mana): AoE around target (2-cell). Deal 160% ATK. Apply Burn (12 DPS, 4s) to all hit. +40% bonus damage to already-Burning targets.

**Evolved Form — Blaze Marksman**: Spread hits 2 nearby enemies. Fire Arrow deals 220% ATK and Burn increases to 18 DPS.

---

#### 4. Fire Acolyte — T1, Healer, Sage → **Heal-and-Harm**

**Stats**: HP 420, ATK 28, AtkSpd 1.1, Range 2, MoveSpd 1.6, MaxMana 70

**Innate Passive — Cauterize**: When healing an ally, deal 60% ATK damage to nearest enemy and apply Burn (8 DPS, 2s).

**Ability — Sacred Flame** (70 mana): Heal lowest-HP ally for 140% ATK. Deal 100% ATK to all enemies within 2 cells. If ally below 35% HP, healing is 210% instead.

**Evolved Form — Ember Saint**: Cauterize hits 2 nearest enemies. Sacred Flame heals for 180% / 270% and applies Burn (12 DPS, 3s) to damaged enemies.

---

#### 5. Magma Knight — T2, Tank, Guardian → **Revenge Tank**

**Stats**: HP 880, ATK 35, AtkSpd 1.0, Range 1, MoveSpd 1.5, MaxMana 85

**Innate Passive — Molten Armor**: Reflect 15% of melee damage taken back to attacker as true fire damage. Gain +1% DR per 10% missing HP (max +10%).

**Ability — Magma Eruption** (85 mana): Taunt enemies within 2 cells for 2s. During taunt, reflect is doubled (30%). On taunt end, explode for 180% ATK to all nearby enemies. Apply Burn (15 DPS, 3s).

**Evolved Form — Volcano Titan**: Reflect increases to 22%. Magma Eruption taunts for 3s and explosion deals 260% ATK. Lava pool lingers 3s (20 DPS).

---

#### 6. Blaze Lancer — T2, Warrior, Vanguard → **DoT Spreader**

**Stats**: HP 720, ATK 55, AtkSpd 0.8, Range 1, MoveSpd 2.0, MaxMana 65

**Innate Passive — Burning Strikes**: Auto-attacks apply Burn (10 DPS, 3s). If target already Burning, spread to 1 nearby unafflicted enemy.

**Ability — Lance Barrage** (65 mana): AoE in a line (3 cells forward). Deal 180% ATK. Apply Burn (15 DPS, 4s) to all hit. +40% bonus damage to already-Burning targets.

**Evolved Form — Inferno Lancer**: Spread hits 2 enemies. Lance Barrage deals 250% ATK and Burn increases to 22 DPS. Line extends to 4 cells.

---

#### 7. Pyromancer — T3, Mage, Sorcerer → **DoT Detonator**

**Stats**: HP 520, ATK 75, AtkSpd 0.9, Range 3, MoveSpd 1.5, MaxMana 70

**Innate Passive — Pyromaniac**: Attacks apply Ignite marks on target (max 5). Each mark adds 4% vulnerability (higher than T1 due to tier).

**Ability — Infernal Detonation** (70 mana): Target area (2-cell radius). Deal 200% ATK. Consume all Ignite marks on all targets — each consumed mark adds 30% bonus damage. Apply Burn (20 DPS, 4s).

**Evolved Form — Arcane Inferno**: Marks apply 6% vulnerability. Detonation deals 300% ATK and leaves a fire zone (15 DPS, 4s) at impact.

---

#### 8. Inferno Fox — T3, Assassin, Mystic → **Execute Striker**

**Stats**: HP 480, ATK 72, AtkSpd 0.5, Range 1, MoveSpd 3.8, MaxMana 50

**Innate Passive — Foxfire Finish**: Deal 25% bonus damage to targets below 40% HP. On kill, gain +20% ATK and +15% move speed for 4s.

**Ability — Spirit Rush** (50 mana): Dash to lowest-HP enemy, deal 240% ATK. If target below 40% HP, guaranteed crit. On kill, refund 50% mana. Apply Burn (15 DPS, 3s).

**Evolved Form — Ninetail Blaze**: Threshold rises to 50% HP. Spirit Rush dashes through up to 2 additional nearby enemies (120% ATK each). Kill refund increases to 70%.

---

#### 9. Fire Dragon — T4, Mage, Warden → **DoT Spreader**

**Stats**: HP 1100, ATK 95, AtkSpd 0.9, Range 3, MoveSpd 1.5, MaxMana 80

**Innate Passive — Dragonfire Spread**: Auto-attacks apply Burn (18 DPS, 4s). If target already Burning, spread to 2 nearby unafflicted enemies (T4 premium spread).

**Ability — Breath Weapon** (80 mana): Cone AoE (3 cells forward, widening). Deal 260% ATK. Apply Burn (25 DPS, 5s) to all hit. +40% bonus damage to already-Burning targets. Stun closest hit for 1.5s (Warden CC contribution).

**Evolved Form — Elder Wyrm**: Spread to 3 enemies. Breath Weapon deals 360% ATK, Burn increases to 35 DPS, stun extends to 2s.

---

#### 10. Phoenix — T5, Mage, Mystic → **RESERVE: Transformer** (breaks template rules)

**Stats**: HP 950, ATK 110, AtkSpd 0.95, Range 3, MoveSpd 1.6, MaxMana 0

**Innate Passive — Eternal Flame**: While alive, all Fire allies gain +15% ATK and 8% lifesteal. Toggles between Blaze Form (offensive aura) and Ember Form (defensive aura) every 8s.

**Ability (Passive) — Rebirth**: On death, revive after 3s at 50% HP. Explode on revive for 150% ATK AoE. After revive, aura doubles for 6s.

**Evolved Form — Eternal Phoenix**: Aura grants +20% ATK / 12% lifesteal. Rebirth at 70% HP, explosion deals 250% ATK. Form toggle every 6s.

*T5 legendaries use reserve templates to feel special and rule-breaking.*

---

### WATER ELEMENT (10 units)
Templates: Crowd Puller★, Shield Stacker↔Earth, CC Chainer↔Lightning, Drain Fighter↔Wind, Heal-and-Harm↔Fire

---

#### 1. Tide Hunter — T1, Warrior, Vanguard → **Crowd Puller**

**Stats**: HP 640, ATK 48, AtkSpd 0.8, Range 1, MoveSpd 1.8, MaxMana 60

**Innate Passive — Undertow**: Auto-attacks slow target move speed by 12% for 2s. Consecutive hits on same target increase slow by 5% per stack (max 3).

**Ability — Tidal Pull** (60 mana): AoE centered on self (2-cell). Pull all enemies 1 cell toward self. Deal 150% ATK. Apply Slow (15% ATK speed, 3s).

**Evolved Form — Tsunami Blade**: Slow stacks to 4. Tidal Pull deals 220% ATK and applies 20% ATK speed slow. Pulled enemies briefly stunned (0.5s).

---

#### 2. Frost Archer — T1, Archer, Ranger → **CC Chainer**

**Stats**: HP 360, ATK 50, AtkSpd 0.7, Range 4, MoveSpd 1.95, MaxMana 55

**Innate Passive — Permafrost Chain**: After applying Slow, next attack within 3s applies Freeze (0.8s stun). After Freeze, next attack applies stronger Slow (25% for 3s). Cascading CC.

**Ability — Frost Cascade** (55 mana): Shoot ice projectile at target, dealing 170% ATK and applying Freeze (1s). Cascade to 2 nearby enemies — each gets Slow (20%, 3s).

**Evolved Form — Ice Sniper**: Chain cycle is faster (2s window). Frost Cascade Freezes primary for 1.5s and cascades to 3 enemies.

---

#### 3. Reef Stalker — T1, Assassin, Predator → **Drain Fighter**

**Stats**: HP 400, ATK 44, AtkSpd 0.5, Range 1, MoveSpd 3.8, MaxMana 45

**Innate Passive — Life Siphon**: 15% of damage dealt heals self. Below 40% HP, drain rate doubles to 30%.

**Ability — Depth Strike** (45 mana): Teleport behind target, deal 220% ATK. Heal self for 50% of damage dealt. Steal 10% of target's ATK for 4s.

**Evolved Form — Tidal Phantom**: Drain rate is 20% / 40%. Depth Strike steals 15% ATK and applies Slow (15%, 3s).

---

#### 4. Coral Priest — T2, Healer, Sage → **Heal-and-Harm**

**Stats**: HP 450, ATK 30, AtkSpd 1.1, Range 2, MoveSpd 1.5, MaxMana 75

**Innate Passive — Chilling Care**: When healing an ally, apply Slow (10% ATK speed, 2s) to nearest enemy.

**Ability — Tidal Blessing** (75 mana): Heal 2 lowest-HP allies for 150% ATK each. Deal 80% ATK to enemies within 2 cells and apply Slow (15%, 3s). If ally below 35%, healing is 225%.

**Evolved Form — Ocean Sage**: Slow hits 2 enemies. Tidal Blessing heals for 200% / 300% and cleanses one debuff per ally healed.

---

#### 5. Hydro Mage — T2, Mage, Sorcerer → **Crowd Puller**

**Stats**: HP 400, ATK 62, AtkSpd 0.95, Range 3, MoveSpd 1.4, MaxMana 70

**Innate Passive — Riptide**: Auto-attacks slow target move speed by 15% for 2s. Consecutive hits increase slow by 6% per stack (max 3).

**Ability — Maelstrom** (70 mana): Target area (2-cell radius). Pull all enemies 1 cell toward center. Deal 200% ATK. Apply Slow (20% ATK speed, 3s). Bonus: 25% more damage to already-slowed targets.

**Evolved Form — Abyssal Mage**: Pull strength increases to 2 cells. Maelstrom deals 280% ATK and applies 25% slow. Slowed enemies take 15% more ability damage.

---

#### 6. Shell Knight — T2, Tank, Guardian → **Shield Stacker**

**Stats**: HP 900, ATK 32, AtkSpd 1.0, Range 1, MoveSpd 1.4, MaxMana 80

**Innate Passive — Ice Armor**: Every 6s, grant self and nearest ally Shield equal to 10% max HP. Shields grant +5% DR while active.

**Ability — Shelled Stance** (80 mana): Gain Shield equal to 28% max HP. All allies within 2 cells gain Shield equal to 14% max HP. Shields grant +5% DR.

**Evolved Form — Armored Sentinel**: Passive shield is 14% max HP, triggers every 5s. Shelled Stance grants 35% / 18% shields and extends DR to +8%.

---

#### 7. Tidal Shaman — T3, Healer, Mystic → **Heal-and-Harm**

**Stats**: HP 480, ATK 45, AtkSpd 1.1, Range 2.5, MoveSpd 1.6, MaxMana 80

**Innate Passive — Tidal Wrath**: When healing an ally, deal 80% ATK damage to nearest enemy and apply Slow (12% ATK speed, 2s).

**Ability — Tidal Surge** (80 mana): Heal all allies within 3 cells for 160% ATK. Deal 120% ATK to all enemies within 3 cells. Apply Slow (18%, 4s). If any ally below 35% HP, healing is 240%.

**Evolved Form — Stormtide Oracle**: Wrath hits 2 enemies. Tidal Surge heals for 220% / 330% and slow increases to 25%.

---

#### 8. Riptide Blade — T3, Warrior, Duelist → **Drain Fighter**

**Stats**: HP 620, ATK 70, AtkSpd 0.8, Range 1, MoveSpd 1.8, MaxMana 65

**Innate Passive — Current Drain**: 18% of damage dealt heals self. Below 40% HP, drain rate doubles to 36%.

**Ability — Maelstrom Spin** (65 mana): Deal 190% ATK to nearby enemies. Heal self for 50% of damage dealt. Steal 12% of primary target's ATK for 5s. Apply Slow (20%, 3s).

**Evolved Form — Tsunami Warlord**: Drain rate is 25% / 50%. Maelstrom Spin deals 280% ATK and steals 18% ATK. Slowed enemies take +15% damage from this unit.

---

#### 9. Kraken — T4, Mage, Warden → **Crowd Puller**

**Stats**: HP 920, ATK 98, AtkSpd 0.9, Range 3, MoveSpd 1.3, MaxMana 85

**Innate Passive — Abyssal Grasp**: Auto-attacks slow target move speed by 20% for 2s. Consecutive hits increase slow by 8% per stack (max 4). T4 premium slow.

**Ability — Abyssal Maelstrom** (85 mana): Target area (3-cell radius). Pull all enemies 2 cells toward center over 4s. Deal 280% ATK total. Apply Slow (25% ATK speed, 4s). Stun enemies reaching center for 1s (Warden CC).

**Evolved Form — Abyssal Terror**: Maelstrom deals 400% ATK, pulls 3 cells, and stun extends to 1.5s. Slow increases to 30%.

---

#### 10. Leviathan — T5, Tank, Guardian → **RESERVE: Unkillable Wall** (premium version)

**Stats**: HP 1450, ATK 35, AtkSpd 1.0, Range 1, MoveSpd 1.2, MaxMana 0

**Innate Passive — Abyssal Depths**: At 50% HP, gain 15% DR. At 25% HP, gain 2s damage immunity (once per combat). Submerge every 10s (untargetable 1.5s), resurface dealing 120% ATK AoE.

**Ability (Passive) — Tidal Guardian**: Water allies gain 12% max HP and 8% DR. Enemies hitting Leviathan lose 8 mana. Start with Shield equal to 200.

**Evolved Form — Primordial Leviathan**: DR thresholds trigger earlier (60%/35%). Submerge every 7s. Tidal Guardian grants 15% HP and 12% DR.

---

### EARTH ELEMENT (10 units)
Templates: Terrain Shaper★, Shield Stacker↔Water, Revenge Tank↔Fire, Unkillable Wall↔Force, Lockdown Specialist↔Lightning

---

#### 1. Stone Guard — T1, Tank, Guardian → **Shield Stacker**

**Stats**: HP 750, ATK 32, AtkSpd 1.0, Range 1, MoveSpd 1.4, MaxMana 80

**Innate Passive — Stone Armor**: Every 6s, grant self and nearest ally Shield equal to 10% max HP. Shields grant +5% DR while active.

**Ability — Stone Barrier** (80 mana): Gain Shield equal to 28% max HP. Allies within 2 cells gain Shield equal to 15% max HP. All shields grant +5% DR.

**Evolved Form — Mountain Lord**: Passive shield is 14% max HP, triggers every 5s. Stone Barrier grants 35% / 20% shields with +8% DR.

---

#### 2. Bramble Knight — T1, Warrior, Vanguard → **Revenge Tank**

**Stats**: HP 640, ATK 48, AtkSpd 0.85, Range 1, MoveSpd 1.8, MaxMana 65

**Innate Passive — Thorny Hide**: Reflect 12% of melee damage taken back to attacker. Gain +1% DR per 10% missing HP (max +10%).

**Ability — Thorn Bash** (65 mana): Taunt enemies within 2 cells for 2s. During taunt, reflect is doubled (24%). On taunt end, deal 150% ATK to all nearby. Root hit enemies for 1s.

**Evolved Form — Ironwood Sentinel**: Reflect increases to 18%. Thorn Bash taunts for 2.5s and root extends to 1.5s. Explosion deals 220% ATK.

---

#### 3. Seedling Archer — T1, Archer, Ranger → **Lockdown Specialist**

**Stats**: HP 360, ATK 48, AtkSpd 0.7, Range 3, MoveSpd 2.0, MaxMana 55

**Innate Passive — Entangling Shots**: Attacks have 18% chance to root target for 1s. Rooted targets take +12% damage from this unit.

**Ability — Root Shot** (55 mana): Shoot projectile dealing 160% ATK. Root target for 1.5s. Apply vulnerability (15% damage amp) for the root duration. Grant self +15% ATK for 4s.

**Evolved Form — Thornwood Ranger**: Root chance increases to 25%. Root Shot roots for 2s and vulnerability increases to 20%.

---

#### 4. Earth Shaman — T2, Healer, Sage → **Shield Stacker**

**Stats**: HP 450, ATK 32, AtkSpd 1.1, Range 2.5, MoveSpd 1.5, MaxMana 75

**Innate Passive — Earthen Guard**: Every 6s, grant self and 2 nearest allies Shield equal to 8% max HP. Shields grant +5% DR.

**Ability — Earth's Blessing** (75 mana): Heal 2 lowest-HP allies for 150% ATK. Grant them Shield equal to 12% max HP with +5% DR. If ally below 35%, healing is 225%.

**Evolved Form — Gaia Priest**: Passive shields 3 allies at 11% max HP. Earth's Blessing heals for 200% / 300% and shields for 16%.

---

#### 5. Crystal Mage — T2, Mage, Guardian → **Lockdown Specialist**

**Stats**: HP 500, ATK 62, AtkSpd 0.95, Range 3, MoveSpd 1.5, MaxMana 70

**Innate Passive — Crystal Bind**: Attacks have 20% chance to root target for 1s. Rooted targets take +12% damage from this unit.

**Ability — Stalagmite Burst** (70 mana): Deal 200% ATK to target and adjacent enemies. Root all hit for 1.5s. Apply vulnerability (15% damage amp) during root. Grant allies in area Shield equal to 12% max HP.

**Evolved Form — Geomancer**: Root chance increases to 28%. Stalagmite Burst deals 280% ATK, roots for 2s, and shields for 16%.

---

#### 6. Mud Stalker — T2, Assassin, Predator → **Lockdown Specialist**

**Stats**: HP 420, ATK 48, AtkSpd 0.5, Range 1, MoveSpd 3.2, MaxMana 50

**Innate Passive — Mire Grip**: Attacks have 22% chance to root target for 1s. Rooted targets take +15% damage from this unit (assassin-tier damage amp).

**Ability — Subterranean Strike** (50 mana): Burrow for 1s, emerge at target dealing 220% ATK. Root target for 1.5s. Apply vulnerability (18% damage amp). Gain Shield equal to 12% max HP.

**Evolved Form — Quake Reaper**: Root chance increases to 30%. Subterranean Strike deals 300% ATK, roots for 2s, and emergence damages all nearby enemies.

---

#### 7. Golem — T3, Tank, Warden → **Unkillable Wall**

**Stats**: HP 1050, ATK 42, AtkSpd 1.0, Range 1, MoveSpd 1.2, MaxMana 90

**Innate Passive — Immovable Stone**: At 50% HP, gain 12% DR. At 25% HP, gain 1.5s damage immunity (once per combat). Self-heal 8% max HP over next 4s. Cannot be displaced.

**Ability — Defensive Stance** (90 mana): Gain Shield equal to 30% max HP. Gain +15% DR for 6s. Root self for 3s (enhanced tanking). Stun nearby enemies for 1.2s on activation (Warden CC).

**Evolved Form — Iron Colossus**: DR threshold triggers at 55% HP. Immunity lasts 2s. Defensive Stance grants 40% shield and +20% DR. Stun extends to 1.8s.

---

#### 8. Terra Sage — T3, Mage, Sorcerer → **Terrain Shaper**

**Stats**: HP 440, ATK 70, AtkSpd 0.9, Range 3, MoveSpd 1.5, MaxMana 80

**Innate Passive — Living Earth**: After casting ability, create buff zone (2-cell, 5s) at cast location. Allies in zone gain +8% DR and regen 1% HP/s.

**Ability — Earthen Barrage** (80 mana): Create hazard zone at target (2-cell, 4s). Enemies in zone take 50% ATK/s and are slowed 15%. Also launch 3 projectiles at highest-ATK enemies, each dealing 140% ATK.

**Evolved Form — Earthweaver**: Buff zone grants +12% DR and 1.5% regen. Hazard zone deals 70% ATK/s and slows 20%. Launches 5 projectiles.

---

#### 9. Ancient Treant — T4, Warrior, Duelist → **Revenge Tank**

**Stats**: HP 1200, ATK 70, AtkSpd 0.9, Range 1, MoveSpd 1.2, MaxMana 80

**Innate Passive — Deep Thorns**: Reflect 18% of melee damage taken back to attacker. Gain +1.5% DR per 10% missing HP (max +15%). Regen 1% HP/s while standing still.

**Ability — Nature's Wrath** (80 mana): Taunt enemies within 2 cells for 2.5s. During taunt, reflect is doubled (36%). On taunt end, deal 240% ATK to all nearby. Root hit enemies for 2s. Heal all Earth allies for 15% of damage dealt.

**Evolved Form — World Sentinel**: Reflect increases to 25%. Nature's Wrath taunts for 3s, deals 340% ATK, roots for 3s.

---

#### 10. World Tree — T5, Healer, Sage → **RESERVE: Summoner**

**Stats**: HP 1300, ATK 28, AtkSpd 1.2, Range 3, MoveSpd 1.3, MaxMana 0

**Innate Passive — Roots of Life**: Allies heal 1.2% max HP per second passively. Periodically summon Seedlings (small Earth units, 200 HP, 3s duration) that body-block and apply root on death.

**Ability (Passive) — Bloom of Life**: Every 8s, heal 3 lowest-HP allies for 250% ATK. Overhealing converts to Shield (60%). Nearby Earth allies gain +10% healing received.

**Evolved Form — Yggdrasil**: Regen 1.8% HP/s. Seedlings have 350 HP. Bloom heals 4 allies for 350% ATK every 6s. Shield conversion at 80%.

---

### WIND ELEMENT (10 units)
Templates: Dodge Tank★, Multi-Striker★, Chain Killer↔Lightning, Blink Striker↔Force, Drain Fighter↔Water

---

#### 1. Zephyr Scout — T1, Assassin, Predator → **Chain Killer**

**Stats**: HP 395, ATK 46, AtkSpd 0.5, Range 1, MoveSpd 4.0, MaxMana 40

**Innate Passive — Windchain**: On kill, gain +20% ATK speed and +15% move speed for 4s. Stacks up to 3 times.

**Ability — Swift Slash** (40 mana): Dash to target, deal 210% ATK. On kill, immediately dash to next lowest-HP enemy and strike again (180% ATK). Can chain up to 2 kills.

**Evolved Form — Storm Assassin**: Stacks grant +25% ATK speed. Swift Slash chains up to 3 kills and each chain hit applies Silence (1s).

---

#### 2. Wind Archer — T1, Archer, Ranger → **Multi-Striker**

**Stats**: HP 360, ATK 52, AtkSpd 0.7, Range 4, MoveSpd 2.1, MaxMana 55

**Innate Passive — Tailwind Flurry**: 18% chance per auto-attack to strike twice. Double-strikes generate +5 bonus mana.

**Ability — Pierce Shot** (55 mana): Unleash 4 rapid arrows over 1s, each dealing 55% ATK. Each hit can proc double-strike. Arrows pierce through enemies.

**Evolved Form — Gale Sniper**: Double-strike chance increases to 25%. Pierce Shot fires 5 arrows at 65% ATK each and grants +15% dodge for 3s.

---

#### 3. Gale Dancer — T1, Healer, Sage → **Drain Fighter**

**Stats**: HP 420, ATK 30, AtkSpd 1.1, Range 2.5, MoveSpd 2.2, MaxMana 70

**Innate Passive — Zephyr Siphon**: 12% of damage dealt by nearby allies (2 cells) heals the lowest-HP ally. Redirected sustain.

**Ability — Rejuvenating Breeze** (70 mana): Heal 2 lowest-HP allies for 140% ATK each. Drain 8% ATK from 2 nearest enemies for 4s (they lose it, allies gain it).

**Evolved Form — Stormweaver**: Siphon rate increases to 18%. Rejuvenating Breeze heals 3 allies for 180% ATK and drains 12% ATK.

---

#### 4. Wind Squire — T1, Warrior, Vanguard → **Dodge Tank**

**Stats**: HP 600, ATK 48, AtkSpd 0.8, Range 1, MoveSpd 1.95, MaxMana 60

**Innate Passive — Windwalk**: 12% base dodge. Each dodge triggers counter: gain 10 mana and deal 40% ATK back to attacker.

**Ability — Gust Guard** (60 mana): Gain +35% dodge for 3s. During this window, counter-attacks deal 80% ATK and apply Slow (12% move speed, 2s) to attackers.

**Evolved Form — Zephyr Warrior**: Base dodge increases to 18%. Gust Guard grants +45% dodge and counters deal 120% ATK.

---

#### 5. Sky Knight — T2, Warrior, Warden → **Dodge Tank**

**Stats**: HP 680, ATK 52, AtkSpd 0.85, Range 1, MoveSpd 1.9, MaxMana 70

**Innate Passive — Aegis Evasion**: 15% base dodge. Each dodge triggers counter: gain 10 mana and deal 50% ATK back. Nearby allies gain 5% dodge.

**Ability — Aegis Guard** (70 mana): Gain +40% dodge for 3s. During window, counter-attacks deal 100% ATK and grant nearby allies Shield equal to 8% of Sky Knight's max HP per dodge.

**Evolved Form — Aegis Paladin**: Base dodge 20%. Counter deals 80% ATK. Allies gain 8% dodge from aura. Shield per dodge increases to 12%.

---

#### 6. Gust Sentinel — T2, Tank, Guardian → **Blink Striker**

**Stats**: HP 850, ATK 32, AtkSpd 1.0, Range 1, MoveSpd 1.6, MaxMana 80

**Innate Passive — Deflection Shift**: After using ability, teleport 2 cells toward nearest endangered ally. Gain 20% dodge for 2s after teleport.

**Ability — Cyclone Guard** (80 mana): Teleport to lowest-HP ally. Grant them Shield equal to 20% of Sentinel's max HP. Gain Shield equal to 25% own max HP. Taunt enemies within 2 cells for 2s.

**Evolved Form — Tempest Guardian**: Teleport grants 30% dodge. Cyclone Guard shields increase to 28% / 32% and taunt extends to 2.5s.

*Note: Blink Striker adapted for Tank role — teleports defensively to protect allies rather than offensively.*

---

#### 7. Monsoon Caller — T3, Mage, Sorcerer → **Chain Killer**

**Stats**: HP 420, ATK 78, AtkSpd 0.9, Range 3, MoveSpd 1.8, MaxMana 70

**Innate Passive — Storm Momentum**: On kill (or assist), gain +20% ATK speed and +15% ability damage for 4s. Stacks up to 3.

**Ability — Tornado** (70 mana): Target enemy. Deal 220% ATK. On kill, immediately arc to next lowest-HP enemy for 180% ATK. Can chain up to 2 kills. Apply Silence (2s) to all hit.

**Evolved Form — Tempest Lord**: Stacks grant +30% ATK speed. Tornado deals 310% ATK, chains up to 3 kills, and Silence extends to 3s.

---

#### 8. Wind Duelist — T3, Warrior, Duelist → **Multi-Striker**

**Stats**: HP 620, ATK 68, AtkSpd 0.8, Range 1, MoveSpd 2.0, MaxMana 60

**Innate Passive — Dance of Blades**: 22% chance to strike twice. Double-strikes grant +5% dodge (stacks to 5, persists 6s).

**Ability — Cyclone Slash** (60 mana): Unleash 5 rapid slashes over 1.2s, each dealing 50% ATK. Each hit can proc double-strike. Gain +25% dodge for 3s during flurry.

**Evolved Form — Hurricane Blade**: Double-strike chance 30%. Cyclone Slash fires 6 slashes at 60% ATK each. Dodge during flurry increases to 40%.

---

#### 9. Storm Sovereign — T4, Assassin, Predator → **Chain Killer**

**Stats**: HP 740, ATK 100, AtkSpd 0.45, Range 1, MoveSpd 4.2, MaxMana 50

**Innate Passive — Lightning Speed**: On kill, gain +25% ATK speed, +20% move speed, and +15% ATK for 4s. Stacks up to 4 (T4 premium stacking).

**Ability — Thunder Cleave** (50 mana): Dash to lowest-HP enemy, deal 280% ATK. On kill, dash to next lowest-HP and deal 240% ATK. Can chain 3 kills. First hit applies Silence (1.5s).

**Evolved Form — Tempest Emperor**: Stacks to 5. Thunder Cleave deals 380% ATK primary, chains 4 kills, and applies Stun (0.8s) to each kill chain target.

---

#### 10. Void Wyrm — T5, Mage, Mystic → **RESERVE: Disruptor**

**Stats**: HP 820, ATK 125, AtkSpd 0.7, Range 4, MoveSpd 2.1, MaxMana 0

**Innate Passive — Reality Warp**: Auto-attacks teleport target 1 cell in random direction (3s cooldown per target). Attacks reduce target mana by 15.

**Ability (Passive) — Dimensional Rift**: When any ally casts ability, fire bolt at random enemy for 90% ATK and Silence them for 1s. Anti-caster specialist.

**Evolved Form — Dimensional Dragon**: Reality Warp teleports 2 cells and applies 15% ATK speed slow (3s). Dimensional Rift fires 2 bolts at 120% ATK with 1.5s Silence.

---

### LIGHTNING ELEMENT (10 units)
Templates: Frontload Nuker★, DoT Detonator↔Fire, CC Chainer↔Water, Chain Killer↔Wind, Lockdown Specialist↔Earth

---

#### 1. Spark Fencer — T1, Warrior, Duelist → **DoT Detonator**

**Stats**: HP 620, ATK 50, AtkSpd 0.85, Range 1, MoveSpd 1.9, MaxMana 60

**Innate Passive — Static Charge**: Attacks apply Static marks on target (max 5). Each mark adds 3% vulnerability.

**Ability — Crackle Slash** (60 mana): Slash target and adjacent enemies for 160% ATK. Consume all Static marks — each adds 30% bonus damage. Apply Stun (0.5s) if 3+ marks consumed.

**Evolved Form — Arc Duelist**: Marks apply 5% vulnerability. Crackle Slash deals 230% ATK and stuns for 1s at 3+ marks.

---

#### 2. Volt Runner — T1, Assassin, Predator → **Chain Killer**

**Stats**: HP 400, ATK 45, AtkSpd 0.5, Range 1, MoveSpd 4.0, MaxMana 40

**Innate Passive — Surge Chain**: On kill, gain +20% ATK speed, +15% move speed, and +10% crit chance for 4s. Stacks up to 3.

**Ability — Volt Dash** (40 mana): Dash through target, deal 210% ATK. On kill, immediately dash to next lowest-HP enemy for 180% ATK. Chain up to 2 kills. Crits chain 50 damage to nearby enemy.

**Evolved Form — Lightning Phantom**: Stacks grant +25% crit chance. Volt Dash chains 3 kills and crits deal chain damage to 2 nearby enemies.

---

#### 3. Thunder Archer — T1, Archer, Ranger → **Frontload Nuker**

**Stats**: HP 360, ATK 52, AtkSpd 0.7, Range 4, MoveSpd 2.0, MaxMana 55

**Innate Passive — Charged First Shot**: First ability cast in combat deals 50% bonus damage. Subsequent casts cost +10 mana.

**Ability — Lightning Arrow** (55 mana): Fire lightning bolt at target, dealing 200% ATK with 1-cell splash. Apply Stun (0.8s) to primary target. Crit chance +20% on this hit.

**Evolved Form — Storm Archer**: First cast bonus increases to 70%. Lightning Arrow deals 280% ATK, splash extends to 2 cells, stun extends to 1.2s.

---

#### 4. Pulse Mender — T1, Healer, Sage → **CC Chainer**

**Stats**: HP 430, ATK 28, AtkSpd 1.1, Range 2.5, MoveSpd 1.6, MaxMana 75

**Innate Passive — Defibrillator Chain**: After applying Stun (from abilities), next heal within 3s also applies Slow (15%, 2s) to nearest enemy. After Slow, next heal applies mini-Stun (0.5s). Cascading CC through healing.

**Ability — Shock Pulse** (75 mana): Heal lowest-HP ally for 145% ATK. Apply Stun (1s) to nearest enemy. Chain-heal to 1 nearby ally for 80% ATK. Chain-stun to 1 nearby enemy for 0.5s.

**Evolved Form — Storm Medic**: Chain cycle faster (2s window). Shock Pulse heals 2 allies and chain-stuns 2 enemies. Primary stun 1.5s.

---

#### 5. Tesla Knight — T2, Tank, Guardian → **Lockdown Specialist**

**Stats**: HP 900, ATK 35, AtkSpd 1.0, Range 1, MoveSpd 1.5, MaxMana 85

**Innate Passive — Electromagnetic Bind**: Attacks have 20% chance to stun target for 0.8s. Stunned targets take +12% damage from this unit.

**Ability — Tesla Barrier** (85 mana): Gain Shield equal to 25% max HP. Stun all enemies within 2 cells for 1s. Apply vulnerability (15% damage amp) to stunned targets. Allies within 1 cell gain Shield equal to 12% max HP.

**Evolved Form — Storm Bastion**: Stun chance 28%. Tesla Barrier stuns for 1.5s, vulnerability 20%, and shield range extends to 2 cells.

---

#### 6. Shock Mage — T2, Mage, Sorcerer → **Frontload Nuker**

**Stats**: HP 420, ATK 65, AtkSpd 0.95, Range 3, MoveSpd 1.5, MaxMana 70

**Innate Passive — Overload**: First ability cast in combat deals 50% bonus damage. Subsequent casts cost +10 mana. Ability crits deal chain damage to 1 nearby enemy (Lightning synergy).

**Ability — Chain Lightning** (70 mana): Fire bolt at target dealing 220% ATK with 1-cell splash. Chain to 2 nearby enemies for 60% of primary damage. Stun primary for 1s. Refund 20 mana on crit.

**Evolved Form — Tempest Mage**: First cast bonus 65%. Chain Lightning deals 300% ATK, chains to 3 enemies, stun 1.5s, refund 30 mana on crit.

---

#### 7. Ball Lightning — T3, Mage, Mystic → **DoT Detonator**

**Stats**: HP 480, ATK 75, AtkSpd 0.9, Range 3, MoveSpd 1.6, MaxMana 75

**Innate Passive — Rolling Thunder**: Attacks apply Static marks (max 5). Each mark adds 4% vulnerability. Marked enemies also take 10 chain DPS from nearby marked enemies (marks arc between close targets).

**Ability — Sphere Detonation** (75 mana): Target area (2-cell radius). Deal 200% ATK. Consume all Static marks on all targets — each adds 30% bonus damage. Apply Stun (1s) if 3+ marks consumed on any target. Chain arc damage doubles during detonation.

**Evolved Form — Plasma Core**: Marks add 6% vulnerability and arc DPS increases to 18. Sphere Detonation deals 300% ATK, stun at 2+ marks, arc damage triples.

---

#### 8. Thunder Warden — T3, Tank, Warden → **Lockdown Specialist**

**Stats**: HP 1000, ATK 45, AtkSpd 1.0, Range 1, MoveSpd 1.3, MaxMana 85

**Innate Passive — Overcharge Bind**: Attacks have 22% chance to stun target for 1s. Stunned targets take +15% damage from all sources (Warden-tier amp).

**Ability — Lightning Prison** (85 mana): Stun all enemies within 2 cells for 1.2s. Apply vulnerability (18% damage amp) for 3s. Gain +8% DR per Lightning ally for 5s.

**Evolved Form — Storm Fortress**: Stun chance 30%. Lightning Prison stuns for 1.8s, vulnerability 25%, DR per ally 10%. Extends to 3-cell radius.

---

#### 9. Thunderbird — T4, Warrior, Vanguard → **Chain Killer**

**Stats**: HP 820, ATK 88, AtkSpd 0.8, Range 1, MoveSpd 2.2, MaxMana 65

**Innate Passive — Storm Surge**: On kill, gain +25% ATK speed, +20% move speed, and guaranteed crit on next attack for 4s. Stacks up to 3.

**Ability — Lightning Descent** (65 mana): Dive to lowest-HP enemy, deal 260% ATK. On kill, immediately arc to next target for 220% ATK. Chain up to 3 kills. Stun adjacent enemies 0.8s per chain.

**Evolved Form — Roc of Storms**: Stacks to 4. Lightning Descent deals 360% ATK, chains 4 kills, stun extends to 1.2s.

---

#### 10. Storm Dragon — T5, Mage, Sorcerer → **RESERVE: Aura Burner**

**Stats**: HP 1000, ATK 130, AtkSpd 0.95, Range 3, MoveSpd 1.7, MaxMana 0

**Innate Passive — Superconductor**: All Lightning allies gain +18% crit chance. Enemies within 3 cells take 25 lightning damage per second (static field). Crits from Storm Dragon amplify field to 45 DPS for 3s.

**Ability (Passive) — Cataclysmic Storm**: Every 6s, strike random enemy with lightning dealing 300% ATK. Chain to all enemies within 2 cells for 50% damage. All chains have 50% crit chance.

**Evolved Form — Thunder God**: Aura grants +25% crit. Static field base 40 DPS, amplified 70 DPS. Cataclysmic Storm triggers every 4.5s, deals 450% ATK, chains at 70%.

---

### FORCE ELEMENT (10 units)
Templates: Ramping Attacker★, Bodyguard★, Unkillable Wall↔Earth, Execute Striker↔Fire, Blink Striker↔Wind

---

#### 1. Iron Soldier — T1, Warrior, Vanguard → **Ramping Attacker**

**Stats**: HP 630, ATK 52, AtkSpd 0.85, Range 1, MoveSpd 1.9, MaxMana 65

**Innate Passive — Relentless**: Each consecutive attack on same target increases damage by 6% (max 6 stacks, +36%). Switching targets resets.

**Ability — Power Strike** (65 mana): Self-buff for 5s: +25% ATK speed, each attack adds 2 stacks instead of 1. Attacks during buff cannot miss. Deal 160% ATK to current target.

**Evolved Form — Legionnaire**: Ramp increases to 8% per stack. Power Strike grants +30% ATK speed and +8% DR during buff.

---

#### 2. Shadow Blade — T1, Assassin, Predator → **Execute Striker**

**Stats**: HP 410, ATK 48, AtkSpd 0.5, Range 1, MoveSpd 3.9, MaxMana 45

**Innate Passive — Predator's Edge**: Deal 22% bonus damage to targets below 40% HP. On kill, gain +15% ATK for 4s.

**Ability — Killing Blow** (45 mana): Dash to target, deal 220% ATK. If target below 40% HP, guaranteed crit. On kill, refund 50% mana. Apply DR reduction (10%, 3s) to target.

**Evolved Form — Night Stalker**: Threshold rises to 50% HP. Killing Blow deals 300% ATK and steals 12% of target's ATK on kill.

---

#### 3. Steel Archer — T1, Archer, Ranger → **Ramping Attacker**

**Stats**: HP 370, ATK 50, AtkSpd 0.7, Range 4, MoveSpd 2.0, MaxMana 55

**Innate Passive — Steady Aim**: Each consecutive attack on same target increases damage by 7% (max 6 stacks, +42%). Standing still prevents stack decay.

**Ability — Piercing Shot** (55 mana): Self-buff for 5s: +20% ATK speed, attacks add 2 stacks instead of 1. Fire empowered shot dealing 180% ATK that pierces all enemies in line.

**Evolved Form — Ballista Archer**: Ramp increases to 9% per stack. Piercing Shot fires 2 empowered arrows and grants +10% DR during buff.

---

#### 4. War Cleric — T2, Healer, Sage → **Bodyguard**

**Stats**: HP 460, ATK 32, AtkSpd 1.1, Range 2, MoveSpd 1.6, MaxMana 75

**Innate Passive — Sworn Protector**: Redirect 15% of damage dealt to nearest ally (within 2 cells) to self instead. Gain +5% DR while redirecting.

**Ability — Holy Guard** (75 mana): Leap to lowest-HP ally. Heal them for 150% ATK. Grant them Shield equal to 15% of War Cleric's max HP. Taunt enemies within 2 cells for 2s.

**Evolved Form — Battle Priest**: Redirect 22%. Holy Guard heals for 200% ATK, shields for 20%, taunt for 2.5s.

---

#### 5. Battle Mage — T2, Mage, Sorcerer → **Blink Striker**

**Stats**: HP 420, ATK 68, AtkSpd 0.95, Range 3, MoveSpd 1.5, MaxMana 70

**Innate Passive — Force Phase**: After using ability, teleport 2 cells away from nearest enemy. Gain 20% dodge for 2s after teleport.

**Ability — Force Bolt** (70 mana): Teleport to target (or optimal casting position), deal 220% ATK. Knock target back 1 cell. If knock kills, teleport to safety. Apply DR reduction (12%, 3s).

**Evolved Form — Force Archmage**: Teleport grants 28% dodge. Force Bolt deals 310% ATK, knocks back 2 cells, DR reduction 18%.

---

#### 6. Shield Bearer — T2, Tank, Guardian → **Bodyguard**

**Stats**: HP 920, ATK 32, AtkSpd 1.0, Range 1, MoveSpd 1.5, MaxMana 85

**Innate Passive — Iron Vow**: Redirect 22% of damage dealt to nearest ally (within 2 cells) to self. Gain +6% DR while redirecting. If protected ally drops below 30% HP, redirect increases to 35%.

**Ability — Impenetrable Wall** (85 mana): Leap to lowest-HP ally. Grant them Shield equal to 20% of Shield Bearer's max HP. Gain Shield equal to 28% own max HP. Taunt enemies within 2 cells for 2s. Block next CC effect.

**Evolved Form — Bastion**: Redirect 30% / 45%. Impenetrable Wall shields increase to 25% / 35%. CC block extends to first 2 CC effects.

---

#### 7. Gladiator — T3, Warrior, Duelist → **Ramping Attacker**

**Stats**: HP 650, ATK 80, AtkSpd 0.8, Range 1, MoveSpd 1.9, MaxMana 60

**Innate Passive — Arena Master**: Each consecutive attack on same target increases damage by 8% (max 6 stacks, +48%). Every 3rd stack grants +10% lifesteal.

**Ability — Brutal Barrage** (60 mana): Self-buff for 5s: +35% ATK speed, attacks add 2 stacks instead of 1, cannot miss. Deal 220% ATK to current target. Apply DR reduction (15%, 4s).

**Evolved Form — Champion**: Ramp 10% per stack. Brutal Barrage grants +40% ATK speed. At max stacks, attacks stun for 0.5s.

---

#### 8. Fortress — T3, Tank, Warden → **Unkillable Wall**

**Stats**: HP 1100, ATK 40, AtkSpd 1.0, Range 1, MoveSpd 1.2, MaxMana 85

**Innate Passive — Unbreakable Will**: At 50% HP, gain 12% DR. At 25% HP, gain 1.5s damage immunity (once per combat). Self-heal 8% max HP over 4s. Immune to knockback and displacement.

**Ability — Defensive Stance** (85 mana): Gain Shield equal to 30% max HP. Gain +15% DR for 6s. Taunt nearby enemies for 2s. Reduce their ATK by 20% for duration (Warden debuff).

**Evolved Form — Citadel**: DR triggers at 55%. Immunity 2s. Defensive Stance grants 40% shield, +18% DR for 8s, taunt for 3s, ATK reduction 30%.

---

#### 9. Siege Engineer — T4, Mage, Mystic → **Blink Striker**

**Stats**: HP 520, ATK 92, AtkSpd 0.9, Range 3, MoveSpd 1.5, MaxMana 70

**Innate Passive — Siege Mobility**: After using ability, teleport 3 cells away from nearest enemy. Gain 25% dodge for 2s. Attacks from teleport position ignore 15% of target's DR.

**Ability — Artillery Strike** (70 mana): Teleport to optimal range, then target furthest enemy. Deal 300% ATK with 2-cell splash. Apply Slow (25%, 3s) in crater. Teleport to safety after firing. Apply vulnerability (15%, 3s).

**Evolved Form — War Architect**: Teleport grants 35% dodge. Artillery Strike deals 400% ATK, splash 3 cells, vulnerability 22%.

---

#### 10. Titan Lord — T5, Warrior, Duelist → **RESERVE: Transformer**

**Stats**: HP 1350, ATK 140, AtkSpd 0.9, Range 1, MoveSpd 1.8, MaxMana 0

**Innate Passive — Colossus**: Toggle between Assault Stance (+25% ATK, +15% ATK speed, attacks stun every 5th hit) and Fortress Stance (+25% max HP, +15% DR, reflect 15% melee damage). Toggles every 7s.

**Ability (Passive) — Earthshaker**: Every 7s, slam ground dealing 320% ATK in area. Current stance determines bonus: Assault = enemies take +20% damage for 5s. Fortress = allies gain Shield equal to 15% Titan Lord's max HP.

**Evolved Form — Cosmic Titan**: Stances grant 35% bonuses. Toggle every 5.5s. Earthshaker triggers every 5.5s, deals 480% ATK. Assault bonus = +30% damage amp. Fortress bonus = 22% shield.

---

## T5 Legendary Template Overrides

T5 units intentionally break the template system to feel special. They use **reserve templates** (the 6 unused templates from the main 25):

| Unit | Element | Reserve Template | Why |
|------|---------|-----------------|-----|
| Phoenix | Fire | Transformer | Dual form (Blaze/Ember) + Rebirth mechanic. No normal unit has forms. |
| Leviathan | Water | Unkillable Wall (premium) | Submerge mechanic is unique. Ultra-tank with untargetable phases. |
| World Tree | Earth | Summoner | Seedling summons + massive healing aura. Only summoner in the game. |
| Void Wyrm | Wind | Disruptor | Reality warping + mana drain + ability-triggered bolts. Anti-meta specialist. |
| Storm Dragon | Lightning | Aura Burner | Persistent damage field + team-wide crit aura. Walking death zone. |
| Titan Lord | Force | Transformer | Stance switching between offense and defense. Most versatile T5. |

*Legendaries using reserve templates means players can't "solve" them with template knowledge — they're always surprising.*

---

## Cross-Template Combo Examples

When building cross-element teams, shared templates create natural combos:

**Fire + Lightning (DoT Detonator bridge)**: Ember Scout stacks Ignite marks while Spark Fencer stacks Static marks. Both detonate on ability cast. Combined burst timing creates synchronized explosions.

**Water + Earth (Shield Stacker bridge)**: Shell Knight + Stone Guard layering Ice Armor and Stone Shields. Double the passive shield generation, double the active shield ability. Nearly impenetrable frontline.

**Wind + Lightning (Chain Killer bridge)**: Zephyr Scout and Volt Runner both chaining kills through the backline. One assassin gets a kill, gains stacks, the other finishes off weakened targets. Snowball synergy.

**Fire + Earth (Revenge Tank bridge)**: Magma Knight (molten reflect) + Bramble Knight (thorn reflect). Both punish attackers for hitting them. Combined with Earth shields keeping them alive, the frontline becomes a damage source.

**Water + Wind (Drain Fighter bridge)**: Reef Stalker + Gale Dancer both sustaining through combat. Water unit drains directly, Wind healer redirects team damage into heals. Outlast comp.

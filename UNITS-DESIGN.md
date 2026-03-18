# Unit System — Complete 60-Unit Roster Design

> Comprehensive design for a 60-unit auto-battler roster spanning 6 elements, 6 unit types, 9 archetypes, 5 tiers, and robust progression systems. Balances mono-element team building, synergy depth, and diverse playstyles.

---

## 1. Overview

### Design Goals

1. **Every unit feels unique**: Each has distinctive stats, innate passive, and ability combination.
2. **Full elemental coverage**: Every element has all 6 unit types represented across tiers.
3. **Deep tier progression**: All 5 cost tiers have enough units for meaningful draft decisions.
4. **Accessible to complex**: New players can win with simple synergies; veterans optimize archetype combos.
5. **Meta diversity**: Multiple viable team archetypes with different win conditions.
6. **Prismatic endgame**: Mono-element comps reward extreme commitment with the 10-piece threshold unlock.

### The Core Systems

**Three Layers of Identity**: Stats, Innate Passive, and Ability work together to define each unit.
- **Stats** define baseline power (HP, ATK, AtkSpd, Range, MoveSpd)
- **Innate Passive** (always-on) creates unique playstyle interactions
- **Ability** (mana-based or legendary passive) delivers the unit's big moment

**Element Synergy**: 6 elements with thresholds at 2/4/7/10. Max 10 units per element, encouraging mono-element plays while allowing flexibility.

**Archetype Synergy**: 9 archetypes with 2/4/6 (and some 2/4) thresholds. Cross-element team building revolves around archetype stacking.

**Unit Types**: 6 fundamental types (Warrior, Tank, Archer, Mage, Assassin, Healer) define role and stat spread.

**Ascension**: Post-evolution progression system providing long-term goals and power through Awakened → Exalted → Transcendent tiers.

**Bonds**: Named 2-unit and 3-unit synergies that add flavor and unique build rewards.

---

## 2. Element System

### The 6 Elements

| Element | Identity | Matchup Advantage | Weak To | Matchup Multiplier |
|---------|----------|-------------------|---------|------------------|
| **Fire** | Burn & Burst | Wind | Water | 1.3× dmg vs Wind, 0.7× vs Water |
| **Water** | Control & Sustain | Fire | Earth, Lightning | 1.3× vs Fire, 0.7× vs Earth/Lightning |
| **Earth** | Shields & Endurance | Water, Lightning | Wind | 1.3× vs Water/Lightning, 0.7× vs Wind |
| **Wind** | Speed & Evasion | Earth | Fire | 1.3× vs Earth, 0.7× vs Fire |
| **Lightning** | Crits & Chain | Water | Earth | 1.3× vs Water, 0.7× vs Earth |
| **Force** | Raw Power & Resilience | None | None | 1.0× vs all (neutral) |

### Element Synergy Bonuses

**Synergy Thresholds**: 2 / 4 / 7 / 10 (Prismatic)

#### Fire Synergy
- **(2)** Attacks apply Burn (10 DPS, 3s duration)
- **(4)** Burn damage 20 DPS. On enemy kill, corpse explodes for 15% of victim's max HP as AoE damage to adjacent enemies
- **(7)** Burn damage 35 DPS, 5s duration. Fire abilities apply Burn. Fire units gain +20% ATK. Kill explosions chain to nearby corpses
- **(10) Conflagration** All enemies start combat Burning (3% max HP/sec). Fire abilities cost 50% less mana. Burning enemy deaths explode for 200% ATK AoE. Fire units gain immunity to Burn

#### Water Synergy
- **(2)** Enemy attack speed -15%
- **(4)** Enemy attack speed -25%. Allies heal 1.5% max HP/s passively
- **(7)** Enemy attack speed -40%. Heal 3% max HP/s. Enemies below 40% HP deal 20% less damage
- **(10) Absolute Zero** Enemies permanently slowed 35%. Water abilities heal all allies for 20% of damage dealt. Enemies below 25% HP Frozen for 2s (once per enemy per combat)

#### Earth Synergy
- **(2)** Allies start combat with Shield equal to 15% max HP
- **(4)** Shield 25% max HP. +8% damage reduction
- **(7)** Shield 40% max HP. +15% DR. Shields regenerate 3%/sec when not taking damage
- **(10) Tectonic Fortress** Shield 60% max HP. +25% DR. Shields regen 5%/sec always. Every 8s, random enemy becomes Rooted (3s). Earth units cannot be critically hit

#### Wind Synergy
- **(2)** Allies gain +15% attack speed
- **(4)** +25% attack speed. +12% dodge chance
- **(7)** +40% attack speed. +25% dodge chance. Dodged attacks grant 10 mana and deal 40% ATK back as counter damage
- **(10) Eye of the Storm** +60% attack speed. +40% dodge chance. Abilities have 40% chance to cast twice. Dodges grant 15 mana and 80% ATK back

#### Lightning Synergy
- **(2)** Lightning units gain +10% crit chance. Crits chain 50 damage to 1 adjacent enemy
- **(4)** +18% crit chance. +15% crit damage. Chains hit 2 adjacent enemies
- **(7)** +30% crit chance. +30% crit damage. Chains hit 3 adjacent. Abilities have 15% chance to crit
- **(10) Superconductor** +50% crit chance. +60% crit damage. Abilities have 40% chance to chain to 2 extra targets. On crit, all enemies within 2 cells take 120 bonus lightning damage

#### Force Synergy
- **(2)** Force units gain +10% ATK and +10% max HP
- **(4)** +18% ATK. +18% max HP. Ignore 10% of enemy damage reduction
- **(7)** +30% ATK. +30% max HP. Ignore 20% DR. Force units gain immunity to first CC effect each combat
- **(10) Unstoppable** +50% ATK. +50% max HP. Ignore 40% DR. CC immunity first 6s of combat. Every 5th combined Force hit stuns target 1s. Force units revive once at 30% HP

### Prismatic Unlock (10-Piece Threshold)

Hitting a 10-piece element synergy is the ultimate endgame challenge. Here's how:
- **Maximum team size**: 9 units on board
- **Per element**: 10 total units in roster, so you can fit at most 9 (pick 9 of 10)
- **Evolved Tier-5 units count as 2** toward their element's synergy
- **Prismatic path**: 8 unique families (8 points) + 1 fully-evolved T5 (2 points) = 10 → Prismatic unlocked
  - Requires nearly full mono-element team AND a 3-star evolved legendary

**One Family, One Slot**: Base and evolved form of the same unit cannot both be fielded. Placing the evolved form auto-removes the base.

---

## 3. Archetype System

### 9 Archetypes

Archetypes provide cross-element synergy bonuses and define unit roles.

| Archetype | Threshold Bonuses | Identity |
|-----------|-------------------|----------|
| **Guardian** | 2/4/6: +200 HP → +500 HP, +5% DR → +800 HP, +12% DR | Pure HP sponges. Stacking Guardians creates unkillable walls. |
| **Warden** | 2/4: +15% CC duration, allies +10% tenacity → +30% CC dur, +25% tenacity, Wardens immune to first CC | CC-focused crowd control units. Long stuns, extended roots. |
| **Vanguard** | 2/4: Front-row allies +200 HP, +15 ATK → +500 HP, +30 ATK, +10% lifesteal | Aggressive frontliners. Reward proximity with offense. |
| **Duelist** | 2/4/6: +15% double-strike → +30%, +10% lifesteal → +40%, +15% lifesteal, attacks can't miss | Melee carries with guaranteed hits and multi-attack procs. |
| **Predator** | 2/4: +25% ATK speed, +15% dmg to <50% HP → +40% ATK speed, +25% dmg <50% HP, reset dash on kill | Assassins and low-HP hunters. Chain kills through weakness. |
| **Ranger** | 2/4/6: +1 range, +10% dmg to furthest → +1 range, +20% furthest, +15% ATK speed → +2 range, +30% furthest, attacks pierce | Ranged carries rewarded for distance. Pierce through formations. |
| **Sorcerer** | 2/4/6: +15% ability dmg, +10 starting mana → +30% ability dmg, +20 start mana → +50% ability dmg, +30 start mana, abilities refund 15% mana | Mages spam bigger abilities faster. |
| **Mystic** | 2/4: +20% element dmg, +15% element resist → +40% element dmg, +30% resist, enemies take 10% more element dmg | Element specialists amplify synergy damage and resist. |
| **Sage** | 2/4/6: +30% healing → +60% healing, allies regen 1% max HP/s → +100% healing, 2% regen, overhealing converts to shield (50%) | Healers sustain teams through damage. Scaling heals create long-game advantage. |

---

## 4. Full Roster — 60 Units Organized by Element

### FIRE ELEMENT (10 units)

---

#### **1. Flame Warrior** — Tier 1, Warrior, Duelist

**Stats**: HP 600, ATK 50, AtkSpd 0.85, Range 1, MoveSpd 1.9, MaxMana 65

**Innate Passive — Heated Blows**: Every 3rd auto-attack deals 25% bonus damage. Rewards consistent melee rhythm.

**Ability — Blade Inferno** (60 mana): Slash forward, dealing 150% ATK in a cone. Apply Burn (15 DPS, 3s) to all hit.

**Evolved Form — Fire Berserker**: Heated Blows triggers every 2.5 attacks and deals 40% bonus damage. Blade Inferno applies Burn (25 DPS, 4s).

---

#### **2. Ember Scout** — Tier 1, Assassin, Predator

**Stats**: HP 390, ATK 46, AtkSpd 0.5, Range 1, MoveSpd 3.9, MaxMana 45

**Innate Passive — First Blood**: First attack after entering combat deals 50% bonus damage. Assassin's burst opener.

**Ability — Ambush** (40 mana): Dash behind target, dealing 200% ATK and applying Burn (10 DPS, 3s). Refund 30 mana if it kills.

**Evolved Form — Flame Rogue**: First Blood deals 80% bonus and ignores 50% DR. Ambush refunds 50 mana on kill and applies 20 DPS Burn.

---

#### **3. Cinder Archer** — Tier 1, Archer, Ranger

**Stats**: HP 360, ATK 52, AtkSpd 0.7, Range 4, MoveSpd 2.0, MaxMana 55

**Innate Passive — Ignition**: Auto-attacks against Burning enemies deal 20% bonus damage. Pairs beautifully with Pyromancer.

**Ability — Fire Arrow** (50 mana): Next auto-attack empowered, deals 180% ATK and applies Burn (15 DPS, 3s).

**Evolved Form — Blaze Marksman**: Ignition bonus increases to 30% and applies 10 DPS Burn back to the archer. Fire Arrow fires 2 arrows (120% each).

---

#### **4. Fire Acolyte** — Tier 1, Healer, Sage

**Stats**: HP 420, ATK 28, AtkSpd 1.1, Range 2, MoveSpd 1.6, MaxMana 70

**Innate Passive — Cauterize**: Heals also apply Burn (8 DPS, 2s) to the nearest enemy. Healer that contributes to fire synergy.

**Ability — Sacred Flame** (70 mana): Heal lowest-HP ally for 140% ATK. If ally is below 35% HP, heal for 220% instead.

**Evolved Form — Ember Saint**: Cauterize affects 2 nearest enemies. Sacred Flame also grants healed ally +15% ATK for 4s.

---

#### **5. Magma Knight** — Tier 2, Tank, Guardian

**Stats**: HP 880, ATK 35, AtkSpd 1.0, Range 1, MoveSpd 1.5, MaxMana 85

**Innate Passive — Molten Armor**: When hit by melee attack, deals 15 fire damage back to attacker. Punishes aggressive enemy comps.

**Ability — Magma Eruption** (80 mana): Explode ground around self, dealing 160% ATK to nearby enemies and applying Burn (20 DPS, 3s). Gain Shield equal to 20% max HP.

**Evolved Form — Volcano Titan**: Molten Armor deals 25 damage and leaves a 3s lava pool (30 DPS). Magma Eruption creates larger AoE and grants Shield for 5s.

---

#### **6. Blaze Lancer** — Tier 2, Warrior, Vanguard

**Stats**: HP 720, ATK 55, AtkSpd 0.8, Range 1, MoveSpd 2.0, MaxMana 60

**Innate Passive — Momentum**: Consecutive hits on the same target increase damage by 8% per stack (max 5). Rewards focus firing.

**Ability — Lance Strike** (65 mana): Dash forward, dealing 180% ATK and applying Burn (12 DPS, 3s). Reset Momentum stacks.

**Evolved Form — Inferno Lancer**: Momentum stacks increase to 10% and grant 5% lifesteal per stack. Lance Strike hits all enemies in line.

---

#### **7. Pyromancer** — Tier 3, Mage, Sorcerer

**Stats**: HP 520, ATK 75, AtkSpd 0.9, Range 3, MoveSpd 1.5, MaxMana 65

**Innate Passive — Pyromaniac**: Burn effects on enemy hit by Pyromancer last 50% longer and deal 20% more DPS. Premium burn amplifier.

**Ability — Infernal Storm** (80 mana): Cast storm at location, dealing 200% ATK to all enemies in area over 3s. Apply Burn (25 DPS, 4s).

**Evolved Form — Arcane Inferno**: Pyromaniac burn effects last 70% longer and deal 35% more DPS. Infernal Storm creates persistent fire zones that reapply Burn on entry.

---

#### **8. Inferno Fox** — Tier 3, Assassin, Mystic

**Stats**: HP 480, ATK 72, AtkSpd 0.5, Range 1, MoveSpd 3.8, MaxMana 50

**Innate Passive — Foxfire**: Leaves fire trail when moving. Trail lasts 2.5s and deals 18 DPS to enemies on it. Terrain control.

**Ability — Spirit Rush** (60 mana): Dash 3 times to 3 different enemies over 1.5s, dealing 100% ATK each. Final target takes 200%.

**Evolved Form — Ninetail Blaze**: Foxfire trail lasts 4s, deals 30 DPS, and applies Burn (10 DPS, 2s). Spirit Rush dashes 5 times and applies Burn to all hit.

---

#### **9. Fire Dragon** — Tier 4, Mage, Warden

**Stats**: HP 1100, ATK 95, AtkSpd 0.9, Range 3, MoveSpd 1.5, MaxMana 80

**Innate Passive — Dragonfire Aura**: Enemies within 2 cells take 20 fire damage per second. Creates dangerous zone control.

**Ability — Breath Weapon** (80 mana): Breathe fire in a cone, dealing 250% ATK and applying Burn (30 DPS, 4s). Stun closest hit enemy for 1.5s.

**Evolved Form — Elder Wyrm**: Dragonfire Aura damage increased to 35 DPS and extends to 3-cell range. Breath Weapon cones extend further and stun all hit for 2s.

---

#### **10. Phoenix** — Tier 5, Mage, Mystic

**Stats**: HP 950, ATK 110, AtkSpd 0.95, Range 3, MoveSpd 1.6, MaxMana 0

**Innate Passive — Eternal Flame**: While alive, all Fire allies gain 15% ATK and 8% lifesteal. On revival, aura doubles for 6s.

**Ability (Passive) — Rebirth**: On death, revive after 3s at 50% HP. First revive always triggers; subsequent revivals trigger on kills (once per 4s). Explode on revive for 150% ATK in area.

**Evolved Form — Eternal Phoenix🔮🔥✨**: Eternal Flame aura extends to 3-cell range and grants +20% ATK and +12% lifesteal. Rebirth revives at 70% HP, and explosion deals 250% ATK.

---

### WATER ELEMENT (10 units)

---

#### **1. Tide Hunter** — Tier 1, Warrior, Vanguard

**Stats**: HP 640, ATK 48, AtkSpd 0.8, Range 1, MoveSpd 1.8, MaxMana 60

**Innate Passive — Undertow**: When Tide Hunter takes damage, the attacker is slowed 8% for 2.5s. Makes him a sticky frontline.

**Ability — Tidal Slash** (60 mana): Slash forward, dealing 160% ATK and applying Slow (15% attack speed, 3s) to all hit.

**Evolved Form — Tsunami Blade**: Undertow applies 12% slow and attacker loses 5 mana. Tidal Slash applies 20% slow and heals self for 30% of damage.

---

#### **2. Frost Archer** — Tier 1, Archer, Ranger

**Stats**: HP 360, ATK 50, AtkSpd 0.7, Range 4, MoveSpd 1.95, MaxMana 50

**Innate Passive — Chill**: Auto-attacks have 25% chance to slow target attack speed by 15% for 2s. Consistent control.

**Ability — Frost Shot** (55 mana): Shoot freeze projectile, dealing 170% ATK and applying Slow (20% AS, 3s). Frozen targets take 15% more damage for 4s.

**Evolved Form — Ice Sniper**: Chill triggers 35% of the time and slows 20% AS. Slowed targets take 12% more damage from all sources. Frost Shot applies 25% slow.

---

#### **3. Reef Stalker** — Tier 1, Assassin, Predator

**Stats**: HP 400, ATK 44, AtkSpd 0.5, Range 1, MoveSpd 3.8, MaxMana 40

**Innate Passive — Slippery**: After dashing, gain 20% dodge for 3s. Helps escape after assassination.

**Ability — Depth Strike** (45 mana): Teleport behind target, deal 220% ATK. If target is Slowed, deal 280% instead and reset dash cooldown.

**Evolved Form — Tidal Phantom**: Slippery grants 35% dodge and stealth for 2s. Depth Strike guarantees crit against Slowed enemies.

---

#### **4. Coral Priest** — Tier 2, Healer, Sage

**Stats**: HP 450, ATK 30, AtkSpd 1.1, Range 2, MoveSpd 1.5, MaxMana 75

**Innate Passive — Soothing Mists**: Allies within 2.5 cells passively heal 0.8% max HP per second. Aura healer.

**Ability — Tidal Blessing** (70 mana): Heal 2 lowest-HP allies for 150% ATK each. Grant them 10% DR for 4s.

**Evolved Form — Ocean Sage**: Soothing Mists heal 1.2% max HP/s and also apply Slow to enemies hitting nearby allies. Tidal Blessing cleanses one debuff.

---

#### **5. Hydro Mage** — Tier 2, Mage, Sorcerer

**Stats**: HP 400, ATK 62, AtkSpd 0.95, Range 3, MoveSpd 1.4, MaxMana 70

**Innate Passive — Torrent**: Abilities deal 18% bonus damage to Slowed targets. Synergizes with Water's slow theme.

**Ability — Hydro Bolt** (70 mana): Launch water blast at target, dealing 200% ATK and applying Slow (18% AS, 3s). Chain to 1 nearby slowed enemy for 120% damage.

**Evolved Form — Abyssal Mage**: Torrent bonus increases to 28%. Hydro Bolt chains to 2 enemies and applies 25% slow.

---

#### **6. Shell Knight** — Tier 2, Tank, Guardian

**Stats**: HP 900, ATK 32, AtkSpd 1.0, Range 1, MoveSpd 1.4, MaxMana 80

**Innate Passive — Shell Defense**: Start combat with Shield equal to 18% max HP. On taking damage above 15% of max HP, gain 8% DR for 3s.

**Ability — Shelled Stance** (75 mana): Gain Shield equal to 25% max HP. All Water allies gain Shield equal to 12% max HP.

**Evolved Form — Armored Sentinel**: Shell Defense grants 25% initial shield and 12% DR. Shelled Stance shields allies at range 3.

---

#### **7. Tidal Shaman** — Tier 3, Healer, Mystic

**Stats**: HP 480, ATK 45, AtkSpd 1.1, Range 2.5, MoveSpd 1.6, MaxMana 80

**Innate Passive — Scepter of Tides**: Heals also apply Slow (12% AS, 2s) to nearest enemy. Support that controls.

**Ability — Tidal Surge** (85 mana): Heal all Water allies for 160% ATK. They gain 15% dodge for 3s.

**Evolved Form — Stormtide Oracle**: Scepter of Tides applies 18% slow and Heal-Slow spreads to 2 nearest enemies. Tidal Surge heals for 200% and grants 25% dodge.

---

#### **8. Riptide Blade** — Tier 3, Warrior, Duelist

**Stats**: HP 620, ATK 70, AtkSpd 0.8, Range 1, MoveSpd 1.8, MaxMana 65

**Innate Passive — Current**: Attacks against Slowed enemies have 25% chance to grant +25% ATK for 3s. Reward synergy combos.

**Ability — Maelstrom Spin** (65 mana): Spin rapidly, dealing 180% ATK to nearby enemies and applying Slow (20% AS, 3s). Gain 20% lifesteal for 4s.

**Evolved Form — Tsunami Warlord**: Current trigger rate increases to 35% and grants +40% ATK. Maelstrom Spin applies 30% slow, heals for 35% of damage, and stuns Slowed enemies 0.5s.

---

#### **9. Kraken** — Tier 4, Mage, Warden

**Stats**: HP 920, ATK 98, AtkSpd 0.9, Range 3, MoveSpd 1.3, MaxMana 85

**Innate Passive — Ink Cloud**: Every 15s, release ink cloud (2-cell radius). Enemies in it have 35% miss chance for 3s. Self-defense zone.

**Ability — Maelstrom** (85 mana): Create whirlpool at target location (2-cell radius). Over 4s, deal 280% ATK total to enemies and pull them 1 cell toward center each second.

**Evolved Form — Abyssal Terror**: Ink Cloud triggers every 10s, lasts 4s, and extends to 3-cell radius. Maelstrom deals 400% ATK total, pulls 2 cells per second, and applies Slow.

---

#### **10. Leviathan** — Tier 5, Tank, Guardian

**Stats**: HP 1450, ATK 35, AtkSpd 1.0, Range 1, MoveSpd 1.2, MaxMana 0

**Innate Passive — Abyssal Depths**: Every 10s, submerge for 1.5s (untargetable, cannot attack). On resurfacing, deal 120% ATK to adjacent enemies and apply Slow (25% AS, 4s).

**Ability (Passive) — Tidal Guardian**: Water allies gain 12% max HP and 8% DR. Enemies hitting Leviathan lose 8 mana. Start combat with 200 shield.

**Evolved Form — Primordial Leviathan**: Abyssal Depths triggers every 7s, lasts 2.5s, and extends range to 2 cells. Tidal Guardian grants +15% max HP and +12% DR, and start with 400 shield.

---

### EARTH ELEMENT (10 units)

---

#### **1. Stone Guard** — Tier 1, Tank, Guardian

**Stats**: HP 750, ATK 32, AtkSpd 1.0, Range 1, MoveSpd 1.4, MaxMana 80

**Innate Passive — Fortify**: Gain 4% DR for every ally within 2.5 cells (max 20%). Rewards tight formations.

**Ability — Stone Barrier** (75 mana): Gain Shield equal to 28% max HP. Allies within 2 cells gain Shield equal to 15% max HP.

**Evolved Form — Mountain Lord**: Fortify provides 5% DR per ally. Stone Barrier shields increase to 35% and 18%, and DR stacks transfer.

---

#### **2. Bramble Knight** — Tier 1, Warrior, Vanguard

**Stats**: HP 640, ATK 48, AtkSpd 0.85, Range 1, MoveSpd 1.8, MaxMana 65

**Innate Passive — Thorns**: Melee attackers take 12 damage when hitting Bramble Knight. Punishes close combat.

**Ability — Thorn Bash** (65 mana): Deal 140% ATK and stun 1s. Gain Shield equal to 18% max HP. Nearby allies gain Shield equal to 10% max HP.

**Evolved Form — Ironwood Sentinel**: Thorns scale with missing HP (up to 25 damage). Thorn Bash stuns for 1.5s and shields all nearby allies.

---

#### **3. Seedling Archer** — Tier 1, Archer, Ranger

**Stats**: HP 360, ATK 48, AtkSpd 0.7, Range 3, MoveSpd 2.0, MaxMana 55

**Innate Passive — Overgrowth**: Every 6s in combat, gain a stack of +4% ATK (max 6 stacks, +24%). Scaling threat over time.

**Ability — Root Shot** (55 mana): Shoot projectile, dealing 160% ATK. Root target for 1.5s. Grant self +15% ATK per rooted enemy for 4s.

**Evolved Form — Thornwood Ranger**: Overgrowth stacks grant +5% ATK per stack. Root Shot roots for 2s and applies 15% slow.

---

#### **4. Earth Shaman** — Tier 2, Healer, Sage

**Stats**: HP 450, ATK 32, AtkSpd 1.1, Range 2.5, MoveSpd 1.5, MaxMana 75

**Innate Passive — Grounding**: Allies healed by Earth Shaman gain 12% CC resistance for 4s. Support that protects.

**Ability — Earth's Blessing** (70 mana): Heal 2 lowest-HP allies for 150% ATK. Grant them Shield equal to 12% max HP.

**Evolved Form — Gaia Priest**: Grounding provides 20% CC resistance and immunity to first CC per combat. Earth's Blessing heals for 180% and shields for 15%.

---

#### **5. Crystal Mage** — Tier 2, Mage, Guardian

**Stats**: HP 500, ATK 62, AtkSpd 0.95, Range 3, MoveSpd 1.5, MaxMana 70

**Innate Passive — Crystal Shell**: Start combat with Shield equal to 22% max HP. Shield reforms after 8s if broken. Tank mage.

**Ability — Stalagmite Burst** (70 mana): Deal 200% ATK to target and adjacent enemies. Root them 1.5s. Grant allies in area Shield equal to 15% max HP.

**Evolved Form — Geomancer**: Crystal Shell provides 30% initial shield. Stalagmite Burst damages in wider area and grants higher shields.

---

#### **6. Mud Stalker** — Tier 2, Assassin, Predator

**Stats**: HP 420, ATK 48, AtkSpd 0.5, Range 1, MoveSpd 3.2, MaxMana 45

**Innate Passive — Burrow**: At combat start, burrow underground for 2s (untargetable). Emerge at furthest enemy location. First attack after emerging is guaranteed crit.

**Ability — Subterranean Strike** (50 mana): Burrow for 1s, emerge at target location dealing 220% ATK. Root target 1.5s. Gain Shield equal to 15% max HP.

**Evolved Form — Quake Reaper**: Burrow emergence deals AoE damage to nearby enemies. Subterranean Strike roots for 2s and stuns for 0.5s.

---

#### **7. Golem** — Tier 3, Tank, Warden

**Stats**: HP 1050, ATK 42, AtkSpd 1.0, Range 1, MoveSpd 1.2, MaxMana 90

**Innate Passive — Immovable**: Cannot be knocked back, pulled, or displaced. Takes 12% reduced damage from AoE. Ultimate anchor.

**Ability — Ground Slam** (90 mana): Slam ground dealing 180% ATK to nearby enemies and stunning them 1.2s. Grant self 15% DR for 4s.

**Evolved Form — Iron Colossus**: Immovable reduces AoE damage by 18%. Ground Slam deals 250% ATK, stuns for 1.8s, and grants 22% DR to nearby allies.

---

#### **8. Terra Sage** — Tier 3, Mage, Sorcerer

**Stats**: HP 440, ATK 70, AtkSpd 0.9, Range 3, MoveSpd 1.5, MaxMana 75

**Innate Passive — Living Earth**: Every time Terra Sage casts ability, nearest ally gains Shield equal to 18% max HP. Offensive healer.

**Ability — Earthen Barrage** (80 mana): Launch 3 earth projectiles at 3 highest-ATK enemies, each dealing 140% ATK and reducing their ATK 18% for 4s.

**Evolved Form — Earthweaver**: Living Earth procs on every ability cast and grants allies 25% max HP shields. Earthen Barrage launches 5 projectiles and reduces ATK by 25%.

---

#### **9. Ancient Treant** — Tier 4, Warrior, Duelist

**Stats**: HP 1200, ATK 70, AtkSpd 0.9, Range 1, MoveSpd 1.2, MaxMana 80

**Innate Passive — Deep Roots**: Cannot be slowed below 75% of base move speed. Regenerate 1.2% max HP/sec while standing still. Slow bruiser.

**Ability — Nature's Wrath** (80 mana): Strike target dealing 220% ATK and rooting for 2s. Heal all Earth allies for 15% of damage dealt.

**Evolved Form — World Sentinel**: Deep Roots prevents all slows and grants 2% HP regen per second. Nature's Wrath deals 300% ATK, roots for 3s, and heals for 25% of damage.

---

#### **10. World Tree** — Tier 5, Healer, Sage

**Stats**: HP 1300, ATK 28, AtkSpd 1.2, Range 3, MoveSpd 1.3, MaxMana 0

**Innate Passive — Roots of Life**: Allies heal 1.2% max HP per second passively, even if silenced/stunned. Ultimate sustain anchor.

**Ability (Passive) — Bloom of Life**: Every 8s, nearby lowest-HP 3 allies heal for 250% ATK. Overhealing converts to Shield (60% of overheal). Nearby Earth allies gain +10% healing received.

**Evolved Form — Yggdrasil**: Roots of Life grants 1.8% max HP regen per second even during combat. Bloom of Life procs every 6s, heals 4 allies for 350% ATK, and overhealing shields at 80%.

---

### WIND ELEMENT (10 units)

---

#### **1. Zephyr Scout** — Tier 1, Assassin, Predator

**Stats**: HP 395, ATK 46, AtkSpd 0.5, Range 1, MoveSpd 4.0, MaxMana 45

**Innate Passive — Windwalk**: After killing target, gain 35% move speed for 2.5s. Chain kills through backline.

**Ability — Swift Slash** (40 mana): Dash to target, deal 210% ATK. Grant self 25% dodge for 3s.

**Evolved Form — Storm Assassin**: Windwalk grants 45% move speed and 20% dodge. Swift Slash resets on kill.

---

#### **2. Wind Archer** — Tier 1, Archer, Ranger

**Stats**: HP 360, ATK 52, AtkSpd 0.7, Range 4, MoveSpd 2.1, MaxMana 55

**Innate Passive — Tailwind**: Gain 6% attack speed for each Wind ally on team (including self). Rewards mono-wind.

**Ability — Pierce Shot** (55 mana): Shoot arrow that pierces through enemies, dealing 170% ATK to each. Grant self +18% ATK speed for 4s.

**Evolved Form — Gale Sniper**: Tailwind provides 8% AS per ally. Pierce Shot hits penetrate all enemies and grant dodge.

---

#### **3. Gale Dancer** — Tier 1, Healer, Sage

**Stats**: HP 420, ATK 30, AtkSpd 1.1, Range 2.5, MoveSpd 2.2, MaxMana 75

**Innate Passive — Zephyr's Grace**: After casting ability, gain 28% move speed for 3s. Enables repositioning.

**Ability — Rejuvenating Breeze** (70 mana): Heal 2 lowest-HP allies for 140% ATK each. Grant them +12% ATK speed for 4s.

**Evolved Form — Stormweaver**: Zephyr's Grace provides 35% move speed. Rejuvenating Breeze heals 3 allies and grants 18% ATK speed.

---

#### **4. Wind Squire** — Tier 1, Warrior, Vanguard

**Stats**: HP 600, ATK 48, AtkSpd 0.8, Range 1, MoveSpd 1.95, MaxMana 60

**Innate Passive — Momentum**: Gain +8% ATK speed after hitting. Stacks up to 4 times (32% ATK speed). Consecutive attacker.

**Ability — Gust Slash** (60 mana): Slash nearby enemies, dealing 140% ATK and applying +15% move speed to self and allies for 4s.

**Evolved Form — Zephyr Warrior**: Momentum stacks to 5 (40% ATK speed). Gust Slash grants 20% ATK speed.

---

#### **5. Sky Knight** — Tier 2, Warrior, Warden

**Stats**: HP 680, ATK 52, AtkSpd 0.85, Range 1, MoveSpd 1.9, MaxMana 65

**Innate Passive — Inspiring Presence**: Allies within 2.5 cells gain 6% damage bonus. Simple offensive aura.

**Ability — Aegis Guard** (70 mana): Block next incoming damage, redirect it as AoE around self. Grant nearby allies Shield equal to 15% max HP.

**Evolved Form — Aegis Paladin**: Inspiring Presence grants 8% bonus damage and 5% DR. Aegis Guard protects larger area.

---

#### **6. Gust Sentinel** — Tier 2, Tank, Guardian

**Stats**: HP 850, ATK 32, AtkSpd 1.0, Range 1, MoveSpd 1.6, MaxMana 85

**Innate Passive — Deflection**: 12% chance to deflect ranged attacks (bounce to random nearby enemy for 50% damage). Anti-archer.

**Ability — Cyclone Guard** (80 mana): Gain Shield equal 28% max HP. For 4s, redirect all projectiles targeting nearby allies to self.

**Evolved Form — Tempest Guardian**: Deflection triggers 20% and reflects 35% of absorbed damage. Cyclone Guard protects 3-cell radius.

---

#### **7. Monsoon Caller** — Tier 3, Mage, Sorcerer

**Stats**: HP 420, ATK 78, AtkSpd 0.9, Range 3, MoveSpd 1.8, MaxMana 70

**Innate Passive — Updraft**: Kills grant all Wind allies 10% ATK speed for 5s (stacks up to 4 times). Snowball effect.

**Ability — Tornado** (85 mana): Summon tornado at location. Deals 200% ATK over 3s to enemies in area (2-cell radius). Silence them 2s.

**Evolved Form — Tempest Lord**: Updraft now stacks up to 6 times (60% ATK speed) and allies keep stacks for 7s. Tornado is larger (3-cell radius), deals 300% ATK, and silences for 3s.

---

#### **8. Wind Duelist** — Tier 3, Warrior, Duelist

**Stats**: HP 620, ATK 68, AtkSpd 0.8, Range 1, MoveSpd 2.0, MaxMana 60

**Innate Passive — Dance of Blades**: Every attack grants +5% dodge (max 5 stacks). Evasion stacking.

**Ability — Cyclone Slash** (65 mana): Spin slash, dealing 190% ATK in area. Gain 30% dodge for 3s. Reset stacks.

**Evolved Form — Hurricane Blade**: Dance of Blades stacks grant 8% dodge per stack (max 8 stacks, 64% dodge). Cyclone Slash deals 260% ATK, grants 45% dodge, and applies Slow to hit enemies.

---

#### **9. Storm Sovereign** — Tier 4, Assassin, Predator

**Stats**: HP 740, ATK 100, AtkSpd 0.45, Range 1, MoveSpd 4.2, MaxMana 55

**Innate Passive — Lightning Speed**: First auto-attack after repositioning (dash, teleport) guarantees crit. Rewards ability usage.

**Ability — Thunder Cleave** (55 mana): Teleport to lowest-HP enemy and deal 280% ATK. Adjacent enemies take 100% ATK splash.

**Evolved Form — Tempest Emperor**: Lightning Speed guarantees crit and applies 15% slow. Thunder Cleave deals 380% ATK, splash extends to 2 cells, and resets on kill.

---

#### **10. Void Wyrm** — Tier 5, Mage, Mystic

**Stats**: HP 820, ATK 125, AtkSpd 0.7, Range 4, MoveSpd 2.1, MaxMana 0

**Innate Passive — Reality Warp**: Auto-attacks teleport target 1 cell in random direction (3s cooldown per target). Disrupts enemy positioning.

**Ability (Passive) — Dimensional Rift**: When any ally casts ability, fire bolt at random enemy for 90% ATK. Fires more often with ability-heavy teams.

**Evolved Form — Dimensional Dragon**: Reality Warp teleports target 2 cells and applies Slow (15% AS, 3s). Dimensional Rift fires 2 bolts at 120% ATK when allies cast, hitting random enemies.

---

### LIGHTNING ELEMENT (10 units) — NEW

---

#### **1. Spark Fencer** — Tier 1, Warrior, Duelist

**Stats**: HP 620, ATK 50, AtkSpd 0.85, Range 1, MoveSpd 1.9, MaxMana 65

**Innate Passive — Static Charge**: Attacks against enemies within 1 cell of another Lightning unit deal 18% bonus damage and chain 60 damage to them.

**Ability — Crackle Slash** (60 mana): Slash with electric arc, dealing 150% ATK to target and adjacent enemies. Apply chain bonus for 3s.

**Evolved Form — Arc Duelist**: Static Charge triggers 25% bonus to 2 targets. Crackle Slash chains damage scales with Lightning synergy level.

---

#### **2. Volt Runner** — Tier 1, Assassin, Predator

**Stats**: HP 400, ATK 45, AtkSpd 0.5, Range 1, MoveSpd 4.0, MaxMana 45

**Innate Passive — Dash Chain**: Each dash grants +20% crit chance for 2s (stacks). Assassin built for chaining dashes.

**Ability — Volt Dash** (45 mana): Dash through target, dealing 210% ATK and applying chain damage bonus. Reset dash cooldown if crits.

**Evolved Form — Lightning Phantom**: Dash Chain grants +25% crit and +10% move speed per stack. Volt Dash hits twice if it crits.

---

#### **3. Thunder Archer** — Tier 1, Archer, Ranger

**Stats**: HP 360, ATK 52, AtkSpd 0.7, Range 4, MoveSpd 2.0, MaxMana 55

**Innate Passive — Charged Shot**: Every 3 attacks, next attack is charged, deals 40% bonus damage and chains to 1 nearby enemy.

**Ability — Lightning Arrow** (55 mana): Shoot arrow that chains to enemies. Deal 170% ATK to each target hit.

**Evolved Form — Storm Archer**: Charged Shot triggers every 2 attacks and chains to 2 enemies. Lightning Arrow pierces and resets on crit.

---

#### **4. Pulse Mender** — Tier 1, Healer, Sage

**Stats**: HP 430, ATK 28, AtkSpd 1.1, Range 2.5, MoveSpd 1.6, MaxMana 75

**Innate Passive — Defibrillator**: Heals grant healed ally +8% crit chance for 3s. Healing that boosts offense.

**Ability — Shock Pulse** (70 mana): Heal lowest-HP ally for 145% ATK. Chain heal to 1 nearby ally for 80% ATK.

**Evolved Form — Storm Medic**: Defibrillator grants +12% crit and +5% ATK speed. Shock Pulse chain heals to 2 allies.

---

#### **5. Tesla Knight** — Tier 2, Tank, Guardian

**Stats**: HP 900, ATK 35, AtkSpd 1.0, Range 1, MoveSpd 1.5, MaxMana 85

**Innate Passive — Lightning Conductor**: Enemies hitting Tesla Knight within 1 cell gain +15% damage taken for 3s. Self-punishment field.

**Ability — Tesla Barrier** (80 mana): Gain Shield equal to 25% max HP. Allies within 1 cell gain Shield equal 12% max HP. Reflect 25% of absorbed damage.

**Evolved Form — Storm Bastion**: Lightning Conductor applies to 2-cell radius and scales with Lightning synergy. Tesla Barrier reflects 40% damage.

---

#### **6. Shock Mage** — Tier 2, Mage, Sorcerer

**Stats**: HP 420, ATK 65, AtkSpd 0.95, Range 3, MoveSpd 1.5, MaxMana 75

**Innate Passive — Electrocution**: Abilities have 18% chance to crit and chain to 1 additional target. Spell crit specialist.

**Ability — Chain Lightning** (70 mana): Cast lightning at target, chains to 2 nearby enemies. Deal 170% ATK to each. Refund 20 mana per crit.

**Evolved Form — Tempest Mage**: Electrocution triggers 25% and chains to 2 targets. Chain Lightning refunds 40 mana per crit.

---

#### **7. Ball Lightning** — Tier 3, Mage, Mystic

**Stats**: HP 480, ATK 75, AtkSpd 0.9, Range 3, MoveSpd 1.6, MaxMana 70

**Innate Passive — Rolling Thunder**: Creates persistent lightning orb (lasts 5s). Orb damages nearby enemies 15 DPS and enemies hitting it take +12% damage.

**Ability — Sphere Summoning** (80 mana): Summon ball lightning at location. It rolls toward enemies, dealing 180% ATK to each it hits and chaining damage.

**Evolved Form — Plasma Core**: Rolling Thunder orb lasts 8s, deals 25 DPS, enemies on it take +18% damage, and orb bounces between enemies. Sphere Summoning summons 2 balls and applies stronger chain.

---

#### **8. Thunder Warden** — Tier 3, Tank, Warden

**Stats**: HP 1000, ATK 45, AtkSpd 1.0, Range 1, MoveSpd 1.3, MaxMana 85

**Innate Passive — Overcharge**: Takes +8% crit chance damage (converts excess crits into stuns). Defensive unit that punishes attackers.

**Ability — Lightning Prison** (85 mana): Emit lightning that stuns nearby enemies 1s and applies chain damage to them. Grant self 8% DR per Lightning ally for 5s.

**Evolved Form — Storm Fortress**: Overcharge converts excess crits into 1s stuns and reflects 20% of damage converted. Lightning Prison extends to 2-cell radius, stuns for 1.5s, grants 10% DR per ally.

---

#### **9. Thunderbird** — Tier 4, Warrior, Vanguard

**Stats**: HP 820, ATK 88, AtkSpd 0.8, Range 1, MoveSpd 2.2, MaxMana 70

**Innate Passive — Aerial Superiority**: Gains +20% ATK and first attack each combat guarantees crit. Flying striker.

**Ability — Lightning Descent** (70 mana): Dive at lowest-HP enemy dealing 240% ATK and applying chain damage. Stun nearby enemies 0.8s.

**Evolved Form — Roc of Storms**: Aerial Superiority increases ATK by 30% and first hit guarantees crit and applies Slow. Lightning Descent deals 330% ATK, extends stun to 1.5s, and chains to nearby enemies.

---

#### **10. Storm Dragon** — Tier 5, Mage, Sorcerer

**Stats**: HP 1000, ATK 130, AtkSpd 0.95, Range 3, MoveSpd 1.7, MaxMana 0

**Innate Passive — Superconductor**: All Lightning allies gain +18% crit chance. When Storm Dragon crits, all nearby Lightning allies gain +25% ATK for 3s.

**Ability (Passive) — Cataclysmic Storm**: Every 6s, strike target with lightning dealing 300% ATK and chaining to all nearby enemies. All chains crit at 50% chance.

**Evolved Form — Thunder God**: Superconductor grants +25% crit chance to all Lightning allies. When Storm Dragon crits, chains strike all enemies within 3 cells for +40% ATK. Cataclysmic Storm triggers every 4.5s and deals 450% ATK.

---

### FORCE ELEMENT (10 units) — NEW

---

#### **1. Iron Soldier** — Tier 1, Warrior, Vanguard

**Stats**: HP 630, ATK 52, AtkSpd 0.85, Range 1, MoveSpd 1.9, MaxMana 65

**Innate Passive — Iron Skin**: Gain 6% DR per Force ally (including self). Stacks with Force synergy shields.

**Ability — Power Strike** (60 mana): Deliver devastating punch, dealing 160% ATK. Grant nearby allies +12% ATK for 3s.

**Evolved Form — Legionnaire**: Iron Skin provides 8% DR per ally and +5% HP. Power Strike applies DR reduction to targets hit.

---

#### **2. Shadow Blade** — Tier 1, Assassin, Predator

**Stats**: HP 410, ATK 48, AtkSpd 0.5, Range 1, MoveSpd 3.9, MaxMana 45

**Innate Passive — Shadow Step**: After kill, gain +25% move speed and dodge for 2s. Pure physical assassin.

**Ability — Killing Blow** (45 mana): Dash to target, deal 220% ATK. If target below 40% HP, guaranteed crit dealing 340% instead.

**Evolved Form — Night Stalker**: Shadow Step grants 35% move speed and 20% dodge. Killing Blow resets on kill and grants lifesteal.

---

#### **3. Steel Archer** — Tier 1, Archer, Ranger

**Stats**: HP 370, ATK 50, AtkSpd 0.7, Range 4, MoveSpd 2.0, MaxMana 55

**Innate Passive — Steady Aim**: Gain +8% damage per second standing still (max 40%). Immobile = damage.

**Ability — Piercing Shot** (55 mana): Fire arrow that pierces all enemies, dealing 170% ATK each. Apply 18% DR reduction to targets.

**Evolved Form — Ballista Archer**: Steady Aim stacks +10% damage. Piercing Shot fires 2 arrows and applies 25% DR reduction.

---

#### **4. War Cleric** — Tier 2, Healer, Sage

**Stats**: HP 460, ATK 32, AtkSpd 1.1, Range 2, MoveSpd 1.6, MaxMana 75

**Innate Passive — War Prayer**: Heals grant healed ally +8% ATK and +5% DR for 4s. Offensive healer.

**Ability — Holy Strike** (70 mana): Heal lowest-HP ally for 150% ATK. Deal 100% ATK damage to nearest enemy.

**Evolved Form — Battle Priest**: War Prayer grants +12% ATK and +8% DR. Holy Strike damages all nearby enemies.

---

#### **5. Battle Mage** — Tier 2, Mage, Sorcerer

**Stats**: HP 420, ATK 68, AtkSpd 0.95, Range 3, MoveSpd 1.5, MaxMana 75

**Innate Passive — Telekinetic Force**: Abilities ignore 12% of enemy DR. Magic scales with Force's penetration theme.

**Ability — Force Bolt** (75 mana): Hurl force projectile, dealing 210% ATK and knocking back target 1 cell. Reset projectile on kill.

**Evolved Form — Force Archmage**: Telekinetic Force ignores 18% DR and applies +8% damage. Force Bolt knocks back 2 cells.

---

#### **6. Shield Bearer** — Tier 2, Tank, Guardian

**Stats**: HP 920, ATK 32, AtkSpd 1.0, Range 1, MoveSpd 1.5, MaxMana 85

**Innate Passive — Fortified Defense**: Nearby allies gain 5% DR and start with Shield equal 10% max HP. Support tank.

**Ability — Impenetrable Wall** (80 mana): Gain Shield equal to 30% max HP. Grant nearby allies Shield equal to 15% max HP. Blocks next CC effect.

**Evolved Form — Bastion**: Fortified Defense provides 8% DR and 12% starting shield. Impenetrable Wall grants larger shields and CC immunity.

---

#### **7. Gladiator** — Tier 3, Warrior, Duelist

**Stats**: HP 650, ATK 80, AtkSpd 0.8, Range 1, MoveSpd 1.9, MaxMana 60

**Innate Passive — Arena Master**: Every 3 attacks, gain +40% ATK for next attack. Momentum-based burst.

**Ability — Brutal Strike** (65 mana): Perform powerful strike, dealing 220% ATK and applying 15% DR reduction to target for 4s.

**Evolved Form — Champion**: Arena Master triggers every 2 attacks and grants +60% ATK. Brutal Strike deals 320% ATK, applies 25% DR reduction, and stuns target 0.8s on kill.

---

#### **8. Fortress** — Tier 3, Tank, Warden

**Stats**: HP 1100, ATK 40, AtkSpd 1.0, Range 1, MoveSpd 1.2, MaxMana 85

**Innate Passive — Unbreakable Will**: Cannot be Rooted, Stunned, or Slowed below base move speed. CC-resistant tank.

**Ability — Defensive Stance** (85 mana): Gain +12% DR for 6s. Taunt nearby enemies for 2s and reduce their ATK by 20%.

**Evolved Form — Citadel**: Unbreakable Will grants immunity to all CC effects. Defensive Stance grants +18% DR for 8s, taunts at 2-cell range for 3s, and reduces ATK by 30%.

---

#### **9. Siege Engineer** — Tier 4, Mage, Mystic

**Stats**: HP 520, ATK 92, AtkSpd 0.9, Range 3, MoveSpd 1.5, MaxMana 75

**Innate Passive — War Machine**: Attacks ignore 15% of target's DR. Siege tactics.

**Ability — Artillery Strike** (75 mana): Target furthest enemy and deal 280% ATK. Create impact crater (40% slow, 3s) around target.

**Evolved Form — War Architect**: War Machine ignores 25% DR and applies 20% additional damage to targets hit. Artillery Strike deals 380% ATK, extends crater to 2-cell radius with 50% slow.

---

#### **10. Titan Lord** — Tier 5, Warrior, Duelist

**Stats**: HP 1350, ATK 140, AtkSpd 0.9, Range 1, MoveSpd 1.8, MaxMana 0

**Innate Passive — Colossus**: Gain +25% max HP. Every 5th hit stuns target 1s. First CC immunity per combat.

**Ability (Passive) — Earthshaker**: Every 7s, slam ground dealing 320% ATK in area. Enemies are rooted 2s and take 20% more damage for 5s. Nearby Force allies gain +15% ATK.

**Evolved Form — Cosmic Titan**: Colossus grants +35% max HP, and every 4th hit stuns for 1.5s. First CC immunity extends through first 8s. Earthshaker triggers every 5.5s, deals 480% ATK, roots for 3s, damage amp lasts 6s.

---

## 5. Roster Summary Tables

### Coverage Grid: Element × Type (60 units)

| | Warrior | Tank | Assassin | Archer | Mage | Healer |
|---|---|---|---|---|---|---|
| **Fire** | Flame Warrior (T1), Blaze Lancer (T2) | Magma Knight (T2) | Ember Scout (T1), Inferno Fox (T3) | Cinder Archer (T1) | Pyromancer (T3), Fire Dragon (T4), Phoenix (T5) | Fire Acolyte (T1) |
| **Water** | Tide Hunter (T1), Riptide Blade (T3) | Shell Knight (T2), Leviathan (T5) | Reef Stalker (T1) | Frost Archer (T1) | Hydro Mage (T2), Kraken (T4) | Coral Priest (T2), Tidal Shaman (T3) |
| **Earth** | Bramble Knight (T1), Ancient Treant (T4) | Stone Guard (T1), Golem (T3) | Mud Stalker (T2) | Seedling Archer (T1) | Crystal Mage (T2), Terra Sage (T3) | Earth Shaman (T2), World Tree (T5) |
| **Wind** | Wind Squire (T1), Sky Knight (T2), Wind Duelist (T3) | Gust Sentinel (T2) | Zephyr Scout (T1), Storm Sovereign (T4) | Wind Archer (T1) | Monsoon Caller (T3), Void Wyrm (T5) | Gale Dancer (T1) |
| **Lightning** | Spark Fencer (T1), Thunderbird (T4) | Tesla Knight (T2), Thunder Warden (T3) | Volt Runner (T1) | Thunder Archer (T1) | Shock Mage (T2), Ball Lightning (T3), Storm Dragon (T5) | Pulse Mender (T1) |
| **Force** | Iron Soldier (T1), Gladiator (T3), Titan Lord (T5) | Shield Bearer (T2), Fortress (T3) | Shadow Blade (T1) | Steel Archer (T1) | Battle Mage (T2), Siege Engineer (T4) | War Cleric (T2) |

### Archetype Distribution (60 units)

| Archetype | Count | Tier Distribution | Examples |
|-----------|-------|-------------------|----------|
| **Guardian** | 7 | T1: Stone Guard; T2: Magma Knight, Shell Knight, Crystal Mage, Tesla Knight, Shield Bearer; T3: Golem; T4: Ancient Treant, Leviathan; T5: World Tree | Pure tanks and defensive units. Stacking = wall. |
| **Warden** | 6 | T3: Golem, Thunder Warden; T4: Fire Dragon, Kraken; T5: Leviathan | CC-focused crowd control. Stuns and roots. |
| **Vanguard** | 6 | T1: Tide Hunter, Bramble Knight, Wind Squire, Iron Soldier; T2: Blaze Lancer, Sky Knight, Gust Sentinel; T4: Thunderbird | Aggressive frontliners. Front-row buffs. |
| **Duelist** | 7 | T1: Flame Warrior; T3: Riptide Blade, Wind Duelist; T4: Ancient Treant; T5: Phoenix, Titan Lord; T3: Gladiator | Melee carries. Double-strike, lifesteal. |
| **Predator** | 7 | T1: Ember Scout, Reef Stalker, Zephyr Scout, Volt Runner, Shadow Blade; T2: Mud Stalker; T4: Storm Sovereign; T5: Void Wyrm | Assassins and hunters. Chain kills. |
| **Ranger** | 6 | T1: Cinder Archer, Frost Archer, Seedling Archer, Wind Archer, Thunder Archer, Steel Archer | Ranged carries. Damage scaling with distance. |
| **Sorcerer** | 7 | T2: Hydro Mage, Shock Mage, Battle Mage; T3: Pyromancer, Terra Sage, Monsoon Caller; T5: Storm Dragon | Mage synergy. Ability spam and damage. |
| **Mystic** | 7 | T1: Fire Acolyte; T2: Gale Dancer; T3: Inferno Fox, Tidal Shaman, Ball Lightning, Siege Engineer; T5: Phoenix, Void Wyrm | Element specialists. Damage amp and resist. |
| **Sage** | 7 | T1: Gale Dancer; T2: Earth Shaman, Coral Priest, War Cleric; T3: Terra Sage, Monsoon Caller; T5: World Tree | Healers. Sustain and shields. |

**Total**: 7+6+6+7+7+6+7+7+7 = 60 ✓

### Tier Distribution (21/15/12/6/6 = 60 units)

| Tier | Count | Units by Element |
|------|-------|-------------------|
| **Tier 1** | 21 | Fire: 4 (Flame Warrior, Ember Scout, Cinder Archer, Fire Acolyte) • Water: 3 (Tide Hunter, Frost Archer, Reef Stalker) • Earth: 3 (Stone Guard, Bramble Knight, Seedling Archer) • Wind: 4 (Zephyr Scout, Wind Archer, Gale Dancer, Wind Squire) • Lightning: 4 (Spark Fencer, Volt Runner, Thunder Archer, Pulse Mender) • Force: 3 (Iron Soldier, Shadow Blade, Steel Archer) |
| **Tier 2** | 15 | Fire: 2 (Magma Knight, Blaze Lancer) • Water: 3 (Coral Priest, Hydro Mage, Shell Knight) • Earth: 3 (Earth Shaman, Crystal Mage, Mud Stalker) • Wind: 2 (Sky Knight, Gust Sentinel) • Lightning: 2 (Tesla Knight, Shock Mage) • Force: 3 (War Cleric, Battle Mage, Shield Bearer) |
| **Tier 3** | 12 | Fire: 2 (Pyromancer, Inferno Fox) • Water: 2 (Tidal Shaman, Riptide Blade) • Earth: 2 (Golem, Terra Sage) • Wind: 2 (Monsoon Caller, Wind Duelist) • Lightning: 2 (Ball Lightning, Thunder Warden) • Force: 2 (Gladiator, Fortress) |
| **Tier 4** | 6 | Fire: 1 (Fire Dragon) • Water: 1 (Kraken) • Earth: 1 (Ancient Treant) • Wind: 1 (Storm Sovereign) • Lightning: 1 (Thunderbird) • Force: 1 (Siege Engineer) |
| **Tier 5** | 6 | Fire: 1 (Phoenix) • Water: 1 (Leviathan) • Earth: 1 (World Tree) • Wind: 1 (Void Wyrm) • Lightning: 1 (Storm Dragon) • Force: 1 (Titan Lord) |

---

## 6. Ascension System

### Overview

Ascension is the post-evolution, long-term progression system. It gives endgame players reasons to keep investing in maxed units. Ascension is per-unit and provides permanent, meaningful power increases.

### Ascension Tiers

| Tier | Name | Requirement | Stat Boost | Reward |
|------|------|-------------|-----------|--------|
| **1** | Awakened | Unit at 3★ + 50 copies of that unit | +10% HP and ATK | Enhanced passive (minor) |
| **2** | Exalted | Awakened + 100 copies | +20% HP and ATK (cumulative) | Enhanced ability (minor) |
| **3** | Transcendent | Exalted + 200 copies + 5 essences of matching element | +35% HP and ATK (cumulative) | Unlock unique Ascension Trait |

### Ascension Traits (Tier 3 Only)

Each unit unlocks a unique passive ability at Transcendent that provides powerful additional effects:

**Examples**:
- **Flame Warrior (Transcendent) — Undying Flame**: When HP drops below 20%, gain Burn immunity and 25% lifesteal for 5s. Once per combat.
- **Stone Guard (Transcendent) — Bedrock**: Start with Shield equal to 50% max HP that cannot be pierced by true damage.
- **Phoenix (Transcendent) — Eternal**: Revive at 75% HP. On revival, also revive the most recently killed ally at 25% HP.

### Ascension Economy

Copy costs are deliberately high (50/100/200) to represent weeks-to-months of investment. Essences tie into the Forge economy.

### Visual Indicators

| Tier | Border | Name Color |
|------|--------|-----------|
| Base | White | White |
| 3★ (max practical) | Gold | Gold |
| Awakened | Teal glow | Teal |
| Exalted | Purple glow | Purple |
| Transcendent | Rainbow shimmer | Animated gradient |

---

## 7. Unit Bonds

### Overview

Bonds are named relationships between specific units granting bonus effects when deployed together. They add flavor and create build-around decisions.

### Bond Types

| Bond Type | Units Required | Bonus Strength |
|-----------|---|---|
| **Duo** | 2 specific units | Moderate (+10% stat or unique mechanic) |
| **Trio** | 3 specific units | Strong (+15% stat or powerful unique mechanic) |

### Bond List

#### Elemental Duos (Element-specific pairs)

| Bond Name | Units | Bonus |
|-----------|-------|-------|
| *Blazing Vanguard* | Flame Warrior + Magma Knight | Both gain +12% ATK and +6% DR |
| *Frozen Hunters* | Frost Archer + Tide Hunter | Frost Archer's slows last 50% longer on targets Tide Hunter attacks |
| *Stone Siblings* | Stone Guard + Golem | Both gain +250 HP. If one dies, survivor gains +30% ATK for rest of combat |
| *Gale Force* | Zephyr Scout + Wind Archer | Both gain +18% ATK speed. Wind Archer's piercing shots deal +12% more damage |
| *Electrified Pair* | Spark Fencer + Tesla Knight | Both gain +15% crit chance. Chain damage bounces between them for 50% increased damage |
| *Force Assault* | Iron Soldier + Titan Lord | Both gain +15% ATK and +10% DR. Titan's 5th hit stuns apply to Iron Soldier's attacks too |

#### Cross-Element Duos (Synergy bridges)

| Bond Name | Units | Bonus |
|-----------|-------|-------|
| *Elemental Clash* | Fire Dragon + Leviathan | Both gain +18% ATK. When either kills enemy, the other gains 25 mana |
| *Life and Death* | Phoenix + World Tree | World Tree heals increase by 25%. On Phoenix revival, World Tree heals all allies for 8% max HP |
| *Shadow and Light* | Ember Scout + Sky Knight | Ember Scout gains +12% crit chance. Sky Knight gains +120 HP. Both alive at end = all allies heal 12% max HP |
| *Storm and Stone* | Storm Dragon + Ancient Treant | Both gain +10% ability damage. When either casts, the other gains +8% DR for 3s |

#### Trios (3-unit synergies with powerful effects)

| Bond Name | Units | Bonus |
|-----------|-------|-------|
| *Inferno Legion* | Flame Warrior + Magma Knight + Pyromancer | All Fire allies gain +12% burn damage. Burns from these 3 deal 30% more DPS |
| *Ocean's Embrace* | Tide Hunter + Coral Priest + Leviathan | All Water allies heal 1.2% max HP/s. Water abilities slow 12% more. Enemies below 40% HP take +15% damage |
| *Mountain Fortress* | Stone Guard + Golem + Ancient Treant | All Earth allies start with Shield = 12% max HP. Earth tanks gain +18% DR. Shields regen 5%/s |
| *Storm Front* | Zephyr Scout + Storm Mage + Monsoon Caller | All Wind allies gain +12% ATK speed. Wind abilities have 18% increased AoE radius. Dodges grant +8 mana |
| *Lightning Nexus* | Spark Fencer + Tesla Knight + Storm Dragon | All Lightning allies gain +12% crit chance. Chain damage bounces 1 extra time. Crits generate 15 mana per unit |
| *Force Unbound* | Iron Soldier + Shield Bearer + Titan Lord | All Force allies gain +15% ATK and +8% DR. Every Force unit within 2 cells grants +5% to all Force stats (stacking) |

---

## 8. Team Size Progression & Barracks

### Slot Unlocking by Level

| Level | Team Slots | Unlock |
|-------|-----------|--------|
| 1 | 2 | Start |
| 2 | 3 | Natural progression |
| 4 | 4 | — |
| 6 | 5 | — |
| 8 | 6 | — |
| 10 | 7 | **Barracks Unlocks** |
| 11 | 8 | Barracks +1 |
| 12 | 9 | Barracks +2 (max) |

**Barracks**: At level 10, unlock a special bench building that grants +1 team slot per 2 barracks levels. Max +2 slots = 9 total on board.

**Mono-Element Ceiling**: With 10 units per element and max 9 board slots, you can fit at most 9/10 of an element. Evolved T5 units counting as 2 enables the Prismatic unlock.

---

## 9. Unit Stat Guidelines

### Type-Based Stat Profiles (Tier 1 Baseline)

| Type | HP | ATK | AtkSpd | Range | MoveSpd | Identity |
|------|----|----|--------|-------|---------|----------|
| **Warrior** | 600–650 | 45–55 | 0.75–0.90 | 1 | 1.8–2.2 | Versatile melee with consistent damage |
| **Tank** | 750–850 | 28–38 | 0.95–1.10 | 1 | 1.3–1.6 | Soak damage, create walls |
| **Archer** | 360–400 | 48–55 | 0.65–0.75 | 3–4 | 1.9–2.2 | Sustained ranged DPS |
| **Mage** | 400–450 | 60–75 | 0.85–1.05 | 3–4 | 1.3–1.8 | Ability-focused burst |
| **Assassin** | 390–420 | 44–50 | 0.45–0.55 | 1 | 3.8–4.2 | Backline burst, high speed |
| **Healer** | 420–470 | 28–35 | 1.05–1.25 | 2–3 | 1.3–2.0 | Keep team alive |

### Tier Scaling Multipliers

| Tier | HP Multiplier | ATK Multiplier | Example Power |
|------|---|---|---|
| T1 | 1.0× | 1.0× | 600 HP / 50 ATK |
| T2 | 1.18× | 1.20× | ~708 HP / 60 ATK |
| T3 | 1.45× | 1.45× | ~870 HP / 72.5 ATK |
| T4 | 1.75× | 1.75× | ~1050 HP / 87.5 ATK |
| T5 | 2.2× | 2.2× | ~1320 HP / 110 ATK |

**T5 Special**: Cost 5 units have MaxMana = 0 (passive abilities only, no mana). Evolved forms stay at MaxMana 0 (still passive-only). T5s are noticeably stronger baseline and gain ~15–20% power boost when evolved.

---

## 10. Passive and Ability Design Philosophy

### Passive Design Rules

1. **Must be unique** — No two units share the same passive effect
2. **Simple and describable** — One sentence max
3. **Relevant to playstyle** — Not a generic stat bonus; defines how the unit actually plays
4. **No duplication of ability** — Passive and ability serve different purposes
5. **Create item interactions** — Passives should synergize with items, team comps, and synergy thresholds

### Ability Design Rules

1. **Impactful and distinctive** — Each ability should feel like the unit's signature move
2. **Mana-based (T1–T4) or passive (T5)** — Low-cost units cost 40–70 mana; high-cost 70–95 mana
3. **Cooldown via mana** — No separate ability cooldown; mana economy enforces timing
4. **T5 passives always-on** — Legendary abilities trigger on timers (4–8s) or hit counters, not mana
5. **Follow status effect rules** — From COMBAT-DESIGN.md (Burn, Slow, Root, Stun, CC duration, etc.)

### Evolved Form Rules (All Tiers: T1–T5)

1. **Both passive AND ability enhanced** — Not a complete replacement
2. **Stat scaling by tier** — T1–T2: ~20–30% stronger; T3–T4: ~20–30% stronger; T5: ~15–20% stronger
3. **No new mechanics** — Evolved forms expand on base unit theme, not introduce entirely new playstyles
4. **Prismatic Path** — Evolved T5 units count as 2 toward element synergy, enabling the 10-piece Prismatic unlock

---

## 11. Designed Viable Team Comps

The following team archetypes should all be competitive:

### Fire Burst — Burn Snowball
**Core**: Flame Warrior, Cinder Archer, Pyromancer, Fire Dragon (or Inferno Fox)
**Synergies**: Fire (4), Duelist (2–4), Ranger (2)
**Win Condition**: Stack burn damage, trigger kill explosions, snowball into victory with Phoenix/Fire Dragon AoE

### Water Sustain — Attrition Warfare
**Core**: Tide Hunter, Coral Priest, Hydro Mage, Tidal Shaman, Leviathan
**Synergies**: Water (4–7), Guardian (2–4), Sage (2)
**Win Condition**: Slow enemy DPS to crawl speed, out-heal all damage, freeze key targets

### Earth Fortress — Maximum Defense
**Core**: Stone Guard, Bramble Knight, Golem, Earth Shaman, World Tree
**Synergies**: Earth (4–7), Guardian (4), Sage (2)
**Win Condition**: 60%+ shields, 25% DR, out-last enemies through shields and healing

### Wind Blitz — Speed & Evasion
**Core**: Zephyr Scout, Wind Archer, Monsoon Caller, Storm Sovereign
**Synergies**: Wind (4), Predator (2–4), Ranger (2)
**Win Condition**: 60% attack speed + 40% dodge, chain kills through backline before enemy frontline engages

### Lightning Chain — Crit & Cascades
**Core**: Spark Fencer, Tesla Knight, Shock Mage, Ball Lightning, Storm Dragon
**Synergies**: Lightning (4–7), Sorcerer (2–4), Guardian (2)
**Win Condition**: 50% crit chance, chains bounce 3+ times, each crit triggers another chain

### Force Assault — Raw Power
**Core**: Iron Soldier, Gladiator, Fortress, Titan Lord
**Synergies**: Force (4–7), Duelist (2–4), Vanguard (2)
**Win Condition**: 50% ATK increase, ignore enemy DR, Titan's 5th hit stun locks targets

### Sage Sustain — Healing Wall
**Core**: Coral Priest, Earth Shaman, Gale Dancer, War Cleric + 2 Sage carries
**Synergies**: Sage (4–6), mixed elements
**Win Condition**: 100%+ healing scaling, overhealing converts to shields, drown enemies in attrition

### Guardian Wall — HP & DR Stack
**Core**: Stone Guard, Magma Knight, Tesla Knight, Shell Knight, Ancient Treant, Leviathan + Gust Sentinel or Sky Knight
**Synergies**: Guardian (6), mixed elements
**Win Condition**: +800 HP and +12% DR across board, carries protected behind wall deal sustained damage

### Assassin Backline — Deletion Blitz
**Core**: Ember Scout, Zephyr Scout, Reef Stalker, Mud Stalker, Shadow Blade
**Synergies**: Predator (4), mixed elements
**Win Condition**: Eliminate enemy carries before frontline falls, chain kills through backline

### Mystic Damage Amp — Element Mastery
**Core**: Inferno Fox, Tidal Shaman, Crystal Mage, Ball Lightning, Siege Engineer + carries
**Synergies**: Mystic (4), 2+ elements
**Win Condition**: +40% element damage, +30% element resist, enemies take 10% more element damage

---

## 12. Future Expansion Hooks

### Designed But Not Yet Specified

- **Dual-element units**: Rare units counting toward 2 elements simultaneously, vulnerable to both weaknesses
- **Mythic tier (Cost 6)**: Ultra-rare units requiring special currency. 1 per team max.
- **Alternate evolutions**: Some T1–T2 units could have branching evolution paths (choose A or B)
- **Skin system**: Cosmetic variants of units with changed visuals but identical stats
- **Unit voicelines**: Short audio clips on ability cast, kill, death for character personality
- **Faction system**: 5th taxonomy layer grouping units by lore (separate from element/archetype)

### Cross-Document Notes

The 60 units in this document are the definitive roster. All abilities follow rules from COMBAT-DESIGN.md (mana costs, cast times, targeting, status effects). When implementing:
- This UNITS-DESIGN.md is authoritative for unit stats, passives, and ability names/descriptions
- COMBAT-DESIGN.md remains authoritative for combat engine rules and status effect mechanics
- Evolved unit stat scaling should follow the tier multipliers provided herein

---

## Appendix: Complete Unit Index

### Fire (10)
1. Flame Warrior (T1, Warrior, Duelist) — Melee carry
2. Ember Scout (T1, Assassin, Predator) — Backline burst
3. Cinder Archer (T1, Archer, Ranger) — Ranged DPS
4. Fire Acolyte (T1, Healer, Sage) — Support
5. Magma Knight (T2, Tank, Guardian) — Tank
6. Blaze Lancer (T2, Warrior, Vanguard) — Aggressive frontline
7. Pyromancer (T3, Mage, Sorcerer) — Burn amplifier
8. Inferno Fox (T3, Assassin, Mystic) — Element specialist assassin
9. Fire Dragon (T4, Mage, Warden) — CC carry
10. Phoenix (T5, Mage, Mystic) — Legendary reviver

### Water (10)
1. Tide Hunter (T1, Warrior, Vanguard) — Sticky frontline
2. Frost Archer (T1, Archer, Ranger) — Control archer
3. Reef Stalker (T1, Assassin, Predator) — Slippery assassin
4. Coral Priest (T2, Healer, Sage) — Aura healer
5. Hydro Mage (T2, Mage, Sorcerer) — Burst mage
6. Shell Knight (T2, Tank, Guardian) — Defensive tank
7. Tidal Shaman (T3, Healer, Mystic) — Control healer
8. Riptide Blade (T3, Warrior, Duelist) — Slowed-target hunter
9. Kraken (T4, Mage, Warden) — AoE CC mage
10. Leviathan (T5, Tank, Guardian) — Legendary tank

### Earth (10)
1. Stone Guard (T1, Tank, Guardian) — Pure tank
2. Bramble Knight (T1, Warrior, Vanguard) — Thorn frontline
3. Seedling Archer (T1, Archer, Ranger) — Scaling archer
4. Earth Shaman (T2, Healer, Sage) — CC-resistant healer
5. Crystal Mage (T2, Mage, Guardian) — Shielding mage
6. Mud Stalker (T2, Assassin, Predator) — Underground assassin
7. Golem (T3, Tank, Warden) — Immobile tank
8. Terra Sage (T3, Mage, Sorcerer) — Offensive support mage
9. Ancient Treant (T4, Warrior, Duelist) — Bruiser tank
10. World Tree (T5, Healer, Sage) — Legendary sustain

### Wind (10)
1. Zephyr Scout (T1, Assassin, Predator) — Fast assassin
2. Wind Archer (T1, Archer, Ranger) — Synergy archer
3. Gale Dancer (T1, Healer, Sage) — Speed healer
4. Wind Squire (T1, Warrior, Vanguard) — Speed warrior
5. Sky Knight (T2, Warrior, Warden) — Aura warrior
6. Gust Sentinel (T2, Tank, Guardian) — Anti-ranged tank
7. Monsoon Caller (T3, Mage, Sorcerer) — AoE mage
8. Wind Duelist (T3, Warrior, Duelist) — Evasion carry
9. Storm Sovereign (T4, Assassin, Predator) — Speed assassin
10. Void Wyrm (T5, Mage, Mystic) — Chaos mage

### Lightning (10)
1. Spark Fencer (T1, Warrior, Duelist) — Chain-strike warrior
2. Volt Runner (T1, Assassin, Predator) — Crit assassin
3. Thunder Archer (T1, Archer, Ranger) — Chain archer
4. Pulse Mender (T1, Healer, Sage) — Crit-boost healer
5. Tesla Knight (T2, Tank, Guardian) — Lightning tank
6. Shock Mage (T2, Mage, Sorcerer) — Chain mage
7. Ball Lightning (T3, Mage, Mystic) — Orb specialist
8. Thunder Warden (T3, Tank, Warden) — Overcharge tank
9. Thunderbird (T4, Warrior, Vanguard) — Aerial warrior
10. Storm Dragon (T5, Mage, Sorcerer) — Crit capstone

### Force (10)
1. Iron Soldier (T1, Warrior, Vanguard) — DR warrior
2. Shadow Blade (T1, Assassin, Predator) — Physical assassin
3. Steel Archer (T1, Archer, Ranger) — Steady archer
4. War Cleric (T2, Healer, Sage) — Offensive healer
5. Battle Mage (T2, Mage, Sorcerer) — Force mage
6. Shield Bearer (T2, Tank, Guardian) — Support tank
7. Gladiator (T3, Warrior, Duelist) — Arena carry
8. Fortress (T3, Tank, Warden) — CC-immune tank
9. Siege Engineer (T4, Mage, Mystic) — Siege specialist
10. Titan Lord (T5, Warrior, Duelist) — Physical capstone

---

**End of Document**

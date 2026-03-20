# Template System v2 — Unity Handoff

> This supersedes the previous template integration. The architecture changed significantly. Read this before porting.

---

## What Changed and Why

### v1 (Previous Integration)
One `executeAbility` function per template. All units sharing a template ran identical code. War Cleric and Shield Bearer both did the same "leap + shield + taunt" because they shared the `bodyguard` template.

**Problem**: 66 units collapsed into 19 identical ability functions. Units within the same template felt like clones.

### v2 (Current)
Each of the 132 units (66 base + 66 evolved) has its own unique ability function. The template now defines the **playstyle category** (what kind of unit this is), not the ability mechanics.

**Three independent layers:**

| Layer | What It Defines | Where It Lives |
|-------|----------------|----------------|
| **Element** | Auto-attack passive (burn, slow, shield, dodge, crit, DR reduction) | Element synergy system (already in main-v2.js, unchanged) |
| **Template** | Playstyle category — "this is a Chain Killer type unit" | `abilityTemplate` field on unit, used for classification and informal synergies |
| **Unit** | Unique active ability — specific mechanics, multipliers, effects | `UNIT_ABILITIES[unitKey]` function in ability-templates.js |

**Key insight**: The element handles the passive layer (Fire units burn on auto, Water units slow on auto — this comes from hitting element synergy (2) threshold). The template classifies the playstyle. The ability is handcrafted per unit.

---

## Architecture

### File: ability-templates.js

```
ELEMENT_STATUS_MAP     — Element → status effect mapping
TIER_SCALE             — Tier → scaling numbers (T1-T5)
getScale(cost, isEvo)  — Helper: returns scaling object for a tier

UNIT_ABILITIES = {
    flame_warrior: function(caster, target, enemies, allies, grid, atk, isEvolved) { ... },
    fire_berserker: function(...) { ... },  // evolved form
    ember_scout: function(...) { ... },
    // ... all 132 units
};

executeTemplateAbility(caster)     — Dispatcher: looks up UNIT_ABILITIES[caster.templateKey]
processTemplatePassive(caster, trigger, data)  — Currently minimal (element handles passives)
```

### File: units-templates.js

Each unit has an `abilityTemplate` field:
```javascript
flame_warrior: { ..., abilityTemplate: 'execute_striker', ... }
```

This field is used for:
- Classification (UI can show "Execute Striker" as a tag)
- Informal synergies (two units sharing a template pattern combo well)
- Balance analysis (compare all Execute Strikers across elements)

It is NOT used to dispatch ability execution. The ability dispatches via `UNIT_ABILITIES[caster.templateKey]` using the unit's key, not the template name.

### File: main-v2.js

Three integration points (all unchanged from v1):

**1. executeAbility (line ~3015)**
```javascript
if (caster.abilityTemplate && typeof executeTemplateAbility === 'function') {
    executeTemplateAbility(caster);
    return;
}
// Legacy switch fallback (never reached, all units have templates)
```

**2. Combat init (line ~166)**
```javascript
if (tmpl && tmpl.abilityTemplate) {
    su.abilityTemplate = tmpl.abilityTemplate;
}
```

**3. Passive hooks (lines ~1355-1395)**
```javascript
// processOnAttackPassive: calls processTemplatePassive(attacker, 'onHit', ...)
// processOnHitPassive: calls processTemplatePassive(defender, 'onTakeDamage', ...)
// processOnKillPassive: calls processTemplatePassive(killer, 'onKill', ...)
// processTickPassives: calls processTemplatePassive(unit, 'onTick', ...)
```

**4. Healer auto-heal (line ~6131)**
```javascript
// performAttack healer branch:
// - Converts auto-attack to dealHealing(ATK)
// - Generates +10 mana per heal
// - Fires processTemplatePassive(attacker, 'onHeal', {target, amount})
```

---

## Critical Rules for Unity

### 1. Healers Don't Auto-Attack

Healers target their lowest-HP% ally and heal instead of attacking. Their ATK stat feeds healing. See HEALER-FIX-HANDOFF.md for full details.

### 2. Element Owns the Passive

Auto-attack passives come from the element synergy system at the (2) threshold:
- Fire (2): Attacks apply Burn (10 DPS, 3s)
- Water (2): Enemy attack speed -15%
- Earth (2): Allies start with Shield (15% max HP)
- Wind (2): Allies gain +15% attack speed
- Lightning (2): +10% crit, crits chain 50 damage
- Force (2): +10% ATK and +10% max HP

This is NOT in ability-templates.js. It's in the synergy system (main-v2.js `applyElementBonuses`). The template does not add auto-attack effects.

### 3. Every Unit Has a Unique Ability

No two units share the same ability function. Even units on the same template (e.g., War Cleric and Shield Bearer, both `bodyguard`) have completely different ability mechanics:

- **War Cleric**: Heal lowest ally 130% ATK + small shield (8% ally HP) + AoE damage to nearby enemies + 2s taunt
- **Shield Bearer**: Leap to lowest ally + big shield (35% own HP) + 2s taunt + brief stun on nearby enemies

The template just says "both are protector-type units." The specifics differ.

### 4. Ability Multiplier Scaling

All abilities use `getScale(cost, isEvolved)` for tier-appropriate numbers:

| Tier | Base Mult | Evolved Mult | DoT DPS | CC Duration | Shield % |
|------|-----------|-------------|---------|-------------|----------|
| T1 | 1.8× | 2.34× | 10 | 1.2s | 15% |
| T2 | 1.9× | 2.57× | 15 | 1.5s | 20% |
| T3 | 2.1× | 2.94× | 21 | 1.75s | 24% |
| T4 | 2.6× | 3.77× | 26 | 2.0s | 28% |
| T5 | 3.2× | 4.80× | 37 | 2.5s | 37% |

T5 units (maxMana=0) use passive abilities — they never "cast." Their value comes from always-on effects handled in `processLegendaryAbilities` and `processTickPassives`.

### 5. Passive Trigger Types

| Trigger | When | Data | Used By |
|---------|------|------|---------|
| `onHit` | Unit lands auto-attack on enemy | `{target, damage}` | Mostly unused now (element handles it) |
| `onHeal` | Healer auto-heals an ally | `{target, amount}` | Heal-and-harm passive |
| `onTakeDamage` | Unit takes damage | `{attacker, damage}` | Revenge tank reflect |
| `onKill` | Unit kills an enemy | `{killed}` | Chain killer stacking |
| `onTick` | Every 0.1s | `{dt}` | Shield refresh timers |

---

## Files Modified (Complete List)

| File | Change | Lines |
|------|--------|-------|
| `js/ability-templates.js` | **Rewritten.** Old: 19 template functions. New: 132 per-unit ability functions + dispatcher. | ~1400 |
| `js/units-templates.js` | Added `abilityTemplate` field to all 132 unit entries (66 base + 66 evolved). | +132 fields |
| `js/units-abilities.js` | Updated all 132 ABILITY_DATA descriptions to match new per-unit abilities. | ~350 |
| `js/main-v2.js` | 4 changes: template dispatch in executeAbility, abilityTemplate init in combat prep, passive hooks, healer onHeal trigger + mana gen. | +30 lines |
| `game-v2.html` | Added `<script src="js/ability-templates.js">` in load order. | +1 line |

### Files NOT Modified
- `js/units-core.js` — Untouched
- `js/synergies.js` — Element synergy system untouched (handles auto-attack passives)
- `js/items.js` — Untouched
- `js/heroes.js` — Untouched
- All other JS files — Untouched

---

## Template → Unit Mapping (Full Reference)

### Fire (11 units)
| Unit | Tier | Type | Template | Ability Summary |
|------|------|------|----------|-----------------|
| Flame Warrior | T1 | Warrior | execute_striker | Slash, crit if target <40% HP, mana refund on kill |
| Ember Scout | T1 | Assassin | dot_detonator | Consume burn stacks for burst damage |
| Cinder Archer | T1 | Archer | dot_spreader | AoE fire arrows, bonus vs burning targets |
| Fire Acolyte | T1 | Healer | heal_and_harm | Heal ally + AoE burn damage to enemies |
| Magma Knight | T2 | Tank | revenge_tank | Taunt + reflect damage + explosion |
| Blaze Lancer | T2 | Warrior | dot_spreader | Dash through line, burn trail |
| Pyromancer | T3 | Mage | dot_detonator | AoE detonation of burn stacks |
| Inferno Fox | T3 | Assassin | execute_striker | Dash execute + multi-target on kill |
| Fire Dragon | T4 | Mage | dot_spreader | Cone AoE, massive burn spread |
| Ashen Watcher | T4 | Healer | heal_and_harm | Heal 2 allies + burn enemies + ATK buff |
| Phoenix | T5 | Mage | transformer | PASSIVE: Stance toggle + revive |

### Water (11 units)
| Unit | Tier | Type | Template | Ability Summary |
|------|------|------|----------|-----------------|
| Tide Hunter | T1 | Warrior | crowd_puller | AoE pull + slow |
| Frost Archer | T1 | Archer | cc_chainer | Freeze target + cascade slow to nearby |
| Reef Stalker | T1 | Assassin | drain_fighter | Dash + damage + lifesteal + ATK steal |
| Coral Priest | T2 | Healer | heal_and_harm | Heal 2 allies + slow enemies |
| Hydro Mage | T2 | Mage | crowd_puller | Vortex AoE pull + damage + slow |
| Shell Knight | T2 | Tank | shield_stacker | Shield self + shield allies |
| Tidal Shaman | T3 | Healer | heal_and_harm | Heal all nearby + damage enemies + slow |
| Riptide Blade | T3 | Warrior | drain_fighter | AoE spin + lifesteal + ATK steal |
| Kraken | T4 | Mage | crowd_puller | Massive AoE pull + stun on center |
| Abyssal Guardian | T4 | Tank | shield_stacker | Large shield self + shield all allies |
| Leviathan | T5 | Tank | unkillable_wall_premium | PASSIVE: Submerge + DR thresholds |

### Earth (11 units)
| Unit | Tier | Type | Template | Ability Summary |
|------|------|------|----------|-----------------|
| Stone Guard | T1 | Tank | shield_stacker | Shield self + allies + DR |
| Bramble Knight | T1 | Warrior | revenge_tank | Taunt + thorn reflect + root |
| Seedling Archer | T1 | Archer | lockdown_specialist | Root shot + vulnerability amp |
| Earth Shaman | T2 | Healer | shield_stacker | Heal allies + shield them |
| Crystal Mage | T2 | Mage | lockdown_specialist | AoE root + vulnerability + ally shields |
| Mud Stalker | T2 | Assassin | lockdown_specialist | Burrow + emerge root + shield self |
| Golem | T3 | Tank | unkillable_wall | Self shield + DR + stun nearby |
| Terra Sage | T3 | Mage | terrain_shaper | Create hazard zone + projectile barrage |
| Ancient Treant | T4 | Warrior | revenge_tank | Taunt + massive reflect + root + heal |
| Grove Warden | T4 | Archer | lockdown_specialist | Long-range root barrage + vulnerability |
| World Tree | T5 | Healer | summoner | PASSIVE: Team regen + summon seedlings |

### Wind (11 units)
| Unit | Tier | Type | Template | Ability Summary |
|------|------|------|----------|-----------------|
| Zephyr Scout | T1 | Assassin | chain_killer | Dash + kill → chain to next target |
| Wind Archer | T1 | Archer | multi_striker | 4 rapid arrows, each can crit |
| Gale Dancer | T1 | Healer | drain_fighter | Heal ally + drain enemy ATK |
| Wind Squire | T1 | Warrior | dodge_tank | Dodge buff + AoE counter-slash |
| Sky Knight | T2 | Warrior | dodge_tank | Dodge buff + ally shield on counter |
| Gust Sentinel | T2 | Tank | blink_striker | Teleport to ally + shield + taunt |
| Monsoon Caller | T3 | Mage | chain_killer | Hit + chain on kill + silence |
| Wind Duelist | T3 | Warrior | multi_striker | 5-hit flurry + dodge during |
| Storm Sovereign | T4 | Assassin | chain_killer | Dash chain 3 kills + massive stacking |
| Tempest Weaver | T4 | Mage | blink_striker | Teleport + damage + escape + shield |
| Void Wyrm | T5 | Mage | disruptor | PASSIVE: Bolt on ally cast + mana drain |

### Lightning (11 units)
| Unit | Tier | Type | Template | Ability Summary |
|------|------|------|----------|-----------------|
| Spark Fencer | T1 | Warrior | dot_detonator | Slash + consume static marks for burst |
| Volt Runner | T1 | Assassin | chain_killer | Dash + kill chain + crit buff |
| Thunder Archer | T1 | Archer | frontload_nuker | Massive first shot + splash + stun |
| Pulse Mender | T1 | Healer | cc_chainer | Heal ally + stun enemy + chain CC |
| Tesla Knight | T2 | Tank | lockdown_specialist | Stun + vulnerability + self shield |
| Shock Mage | T2 | Mage | frontload_nuker | Big bolt + chain splash + stun |
| Ball Lightning | T3 | Mage | dot_detonator | AoE mark detonation + chain arcs |
| Thunder Warden | T3 | Tank | lockdown_specialist | AoE stun + vulnerability + DR |
| Thunderbird | T4 | Warrior | chain_killer | Dive + kill chain + crit |
| Voltfang Stalker | T4 | Assassin | chain_killer | Dash chain + crit + stealth |
| Storm Dragon | T5 | Mage | aura_burner | PASSIVE: Crit aura + periodic lightning |

### Force (11 units)
| Unit | Tier | Type | Template | Ability Summary |
|------|------|------|----------|-----------------|
| Iron Soldier | T1 | Warrior | ramping_attacker | ATK buff + accelerating damage |
| Shadow Blade | T1 | Assassin | execute_striker | Dash + execute low-HP + ATK steal |
| Steel Archer | T1 | Archer | ramping_attacker | Stack-based empowered shot + pierce |
| War Cleric | T2 | Healer | bodyguard | Heal ally + small shield + AoE damage |
| Battle Mage | T2 | Mage | blink_striker | Damage + escape teleport + self shield |
| Shield Bearer | T2 | Tank | bodyguard | Leap to ally + big shield + taunt + stun |
| Gladiator | T3 | Warrior | ramping_attacker | Stack-boosted hit + ATK speed buff |
| Fortress | T3 | Tank | unkillable_wall | Self shield + DR + taunt + ATK reduction |
| Siege Engineer | T4 | Mage | blink_striker | AoE artillery + escape + slow zone |
| Iron Duelist | T4 | Warrior | execute_striker | Heavy execute + ATK buff on kill |
| Titan Lord | T5 | Warrior | transformer | PASSIVE: Stance toggle + periodic slam |

---

## Stat Adjustments (Applied by Tester Session)

The tester session made 131 stat changes to `units-templates.js` that are already baked in:

**Tier Scaling Multipliers** (applied to base HP and ATK):
- T2: ×1.15
- T3: ×1.25
- T4: ×1.35
- T5: ×1.50

**Healer Systemic Buff**: All 9 healers got ATK ×1.4 and MaxMana −15

**Specific Nerfs**: Shock Mage (ATK −15%, Mana +15), Wind Archer (ATK −18%), Steel Archer (ATK −12%), Gladiator (ATK −12%), Iron Soldier (ATK −15%), Storm Sovereign (ATK −10%), Terra Sage (ATK −12%), Hydro Mage (ATK −10%)

**Specific Buffs**: Leviathan (HP +20%, ATK +30%), Phoenix (ATK +25%), World Tree (ATK +50%), Gust Sentinel (HP +15%, Mana −15), Fortress/Golem (Mana −15), Ancient Treant (ATK +15%), Siege Engineer/Tempest Weaver/Monsoon Caller/Pyromancer/Ball Lightning/Battle Mage (ATK +10%)

These adjustments are in `units-templates.js` and carry through to Unity. The base stat values in the file are the post-adjustment values.

---

## Healer Combat Rules (Critical)

Healers are fundamentally different from all other unit types. See `HEALER-FIX-HANDOFF.md` for full details. Summary:

1. **Auto-attacks heal allies** — target is lowest-HP% ally, ATK converts to healing, no damage dealt
2. **Mana from heals** — +10 mana per auto-heal (was missing, now fixed)
3. **onHeal passive trigger** — fires after each auto-heal so templates like heal_and_harm work
4. **Healer abilities should heal** — the active ability must include healing or shielding for allies

---

## Test Results

```
90 passed, 1 "failed" (high-mana tank doesn't cast in short test fight — not a bug)
0 runtime errors across all 66 units
66/66 units deal damage/heal/shield
All 6 element mirror matches run clean
T3 team beats T1 team (4243 vs 1893 damage)
```

---

## Known Design Issues (Not Bugs)

These are flagged in the balance report and should be addressed in Unity through ability redesign. Use the process in `processes/UNIT-ABILITY-REWORK.md` to fix these:

1. **Gale Dancer** (Wind healer) on `drain_fighter` — self-sustain only, no team heal in ability. Should be `heal_and_harm`.
2. **Pulse Mender** (Lightning healer) on `cc_chainer` — pure CC, add heal component to ability.
3. **Gust Sentinel** (Wind tank) on `blink_striker` — offensive teleport, no shields/CC/DR. Should be `bodyguard` or `shield_stacker`.
4. **Fortress/Golem** on `unkillable_wall` — self-preservation only. Add ally shield component.
5. **Leviathan** (T5 tank) on `unkillable_wall_premium` — no team-wide impact for a legendary. Add CC or ally buff aura.
6. **Phoenix** (T5 mage) on `transformer` — 7s toggle too slow. Reduce to 5s or add burst on switch.

---

## Related Documents

| Doc | Purpose |
|-----|---------|
| `HEALER-FIX-HANDOFF.md` | Healer auto-heal mechanic, onHeal trigger, mana gen fix |
| `ABILITY-TEMPLATES.md` | Template design overview, bridge synergies, overlap map |
| `ABILITY-REVISION.md` | Original per-unit ability specs (design reference) |
| `processes/UNIT-ABILITY-REWORK.md` | Step-by-step process for reworking any unit's ability |
| `units/TESTING-RECOMMENDATIONS.md` | How to properly test balance (use real engine, not regex simulator) |
| `units/BALANCE-REPORT.md` | Latest balance numbers (v3, post stat adjustments) |

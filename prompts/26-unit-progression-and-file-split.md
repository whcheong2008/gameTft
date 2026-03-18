# Prompt 26 — Unit Progression System + units.js File Split

> **Purpose**: Add unit XP/leveling, ascension system (Awakened/Exalted/Transcendent), secondary archetypes, unit bonds, power rating, and combat benchmarks. Also split `units.js` into smaller files for maintainability.
>
> **Branch**: Work on `main` directly (or create `feature/unit-progression` if you prefer).
>
> **Pattern**: All `var`, global scope, NO ES modules, NO import/export. Match existing code style.
>
> **Read before starting**: `js/units.js` (all data structures), `UNITS-DESIGN.md` (ascension section), `COMBAT-DESIGN.md` (damage pipeline, mana system).

---

## Part A: Split units.js into Multiple Files

`units.js` is ~994 lines and growing. Split it into these files:

### File: `js/units-core.js`
Core systems that other files depend on:
- `ELEMENTS`, `ELEMENT_MATCHUPS`, `ELEMENT_SYNERGIES`
- `ARCHETYPES`
- `UNIT_TYPE_DESCRIPTIONS`
- `SHOP_POOL_KEYS` (move after templates are loaded)
- All functions: `createUnit()`, `getStarMultiplier()`, `upgradeUnit()`, `checkEvolutionRequirements()`, `checkEnemyEvolution()`, `evolveUnit()`, `getElementMultiplier()`, `getSellValue()`, `verifyRosterIntegrity()`

### File: `js/units-templates.js`
All template data:
- `UNIT_TEMPLATES` (60 base units)
- `EVOLVED_TEMPLATES` (60 evolved units)
- `EVOLUTIONS` (evolution requirements mapping)

### File: `js/units-abilities.js`
All ability and passive data:
- `ABILITY_DATA` (120 entries — 60 base + 60 evolved)
- `PASSIVE_DATA` (60 entries)
- `EVOLVED_PASSIVE_DATA` (60 entries)

### File: `js/units-bonds.js` (NEW)
Unit bond data (does not exist yet — create it):
- `UNIT_BONDS` — see Part E below

### File: `js/units-ascension.js` (NEW)
Ascension data and functions — see Part C below.

### Update game-v2.html
Replace the single `<script src="js/units.js">` with the split files in this load order:
```html
<script src="js/units-core.js"></script>
<script src="js/units-templates.js"></script>
<script src="js/units-abilities.js"></script>
<script src="js/units-bonds.js"></script>
<script src="js/units-ascension.js"></script>
```

`SHOP_POOL_KEYS` should be defined at the end of `units-templates.js` (after `UNIT_TEMPLATES` exists).

### Delete `js/units.js`
After splitting, delete the old file. Verify the game loads correctly.

---

## Part B: Unit XP and Levels

Units gain XP from combat and level up individually.

### Data Model
Add to each unit object (in `createUnit()` in `units-core.js`):
```javascript
level: 1,
xp: 0,
xpToNext: 100  // XP needed for next level
```

### XP Curve
- Level cap: 30
- XP to level up: `Math.floor(100 * Math.pow(1.12, level - 1))`
- This creates: Level 2 = 100 XP, Level 10 ≈ 277 XP, Level 20 ≈ 861 XP, Level 30 ≈ 2,675 XP
- Total XP for level 30 ≈ 15,000 XP

### XP Source
- After winning a mission, each **deployed** unit earns XP
- XP per mission = `baseXP * stageMultiplier`
- `baseXP`: 30 for region 1, scaling to 120 for region 8
- `stageMultiplier`: 1.0 for normal stages, 1.5 for boss stages
- Player level determines scaling — higher player level = harder content = more XP
- Units NOT on the deployed team earn ZERO XP

### Stat Scaling per Level
Each level grants +2% of base HP and ATK (additive with star multiplier):
```javascript
function getUnitStats(unit) {
    var tmpl = unit.evolved ? EVOLVED_TEMPLATES[unit.key] : UNIT_TEMPLATES[unit.key];
    var starMult = getStarMultiplier(unit.stars);
    var levelBonus = 1 + (unit.level - 1) * 0.02; // +2% per level above 1
    return {
        hp: Math.floor(tmpl.hp * starMult * levelBonus),
        attack: Math.floor(tmpl.attack * starMult * levelBonus)
    };
}
```

### Level-Up Processing
Create `grantXP(unit, amount)` function:
- Add XP to unit
- While XP >= xpToNext, level up (increment level, subtract xpToNext, recalculate xpToNext)
- Cap at level 30
- On level up, recalculate unit stats via `getUnitStats()`
- Return number of levels gained (for UI notification)

### Save Data
Unit level and XP must persist. Add `level` and `xp` fields to saved unit data. Add save migration to ensure old saves get `level: 1, xp: 0` on existing units.

---

## Part C: Ascension System

Ascension is a separate progression track from evolution. A unit can be both evolved AND ascended.

### Ascension Tiers

| Tier | Name | Requirements | Stat Bonus | Special |
|------|------|-------------|-----------|---------|
| 1 | Awakened | Level 15, 3★, 500g + 5 region essences | +10% HP/ATK | Gain secondary archetype (counts as 1) |
| 2 | Exalted | Level 25, Awakened, 2000g + 10 region essences + 1 mythic material | +20% HP/ATK (cumulative = 30%) | Ability scaling upgrade |
| 3 | Transcendent | Level 30, Exalted, 5000g + 20 region essences + 3 mythic materials | +35% HP/ATK (cumulative = 65%) | Primary archetype counts as 2 + new ability effect |

### Data Model
Add to `units-ascension.js`:

```javascript
var ASCENSION_TIERS = {
    awakened: {
        name: 'Awakened',
        requirements: { level: 15, stars: 3, gold: 500, essences: 5, mythicMaterials: 0 },
        statBonus: 0.10,
        description: 'Gain secondary archetype'
    },
    exalted: {
        name: 'Exalted',
        requirements: { level: 25, ascensionTier: 'awakened', gold: 2000, essences: 10, mythicMaterials: 1 },
        statBonus: 0.20,
        description: 'Ability scaling upgrade'
    },
    transcendent: {
        name: 'Transcendent',
        requirements: { level: 30, ascensionTier: 'exalted', gold: 5000, essences: 20, mythicMaterials: 3 },
        statBonus: 0.35,
        description: 'Primary archetype counts as 2, new ability effect'
    }
};
```

Add to each unit object: `ascensionTier: null` (then `'awakened'`, `'exalted'`, `'transcendent'`).

### Stat Calculation Update
Update `getUnitStats()` to include ascension:
```javascript
var ascensionBonus = getAscensionStatBonus(unit.ascensionTier); // 0, 0.10, 0.30, 0.65
return {
    hp: Math.floor(tmpl.hp * starMult * levelBonus * (1 + ascensionBonus)),
    attack: Math.floor(tmpl.attack * starMult * levelBonus * (1 + ascensionBonus))
};
```

### Ascension Functions
- `checkAscensionRequirements(saveData, unit, tier)` — verify level, stars, gold, materials
- `ascendUnit(saveData, unit, tier)` — consume materials, set ascensionTier, recalc stats
- `getAscensionStatBonus(tier)` — returns cumulative bonus (null=0, awakened=0.10, exalted=0.30, transcendent=0.65)

### Synergy Counting
When calculating archetype synergy counts for a team, modify the counting logic:
- Each unit contributes 1 to its primary archetype (or 2 if Transcendent)
- Each Awakened+ unit also contributes 1 to its secondary archetype
- This means a team of 9 units with several Awakened could reach 8+ in an archetype

---

## Part D: Secondary Archetype Assignments

Add `secondaryArchetype` field to every entry in `UNIT_TEMPLATES` (in `units-templates.js`). This is the archetype gained at Awakened tier.

### FIRE
| Unit Key | Primary | Secondary |
|----------|---------|-----------|
| flame_warrior | duelist | vanguard |
| ember_scout | predator | duelist |
| cinder_archer | ranger | sorcerer |
| fire_acolyte | sage | guardian |
| magma_knight | guardian | warden |
| blaze_lancer | vanguard | predator |
| pyromancer | sorcerer | mystic |
| inferno_fox | mystic | predator |
| fire_dragon | warden | sorcerer |
| phoenix | mystic | sage |

### WATER
| Unit Key | Primary | Secondary |
|----------|---------|-----------|
| tide_hunter | vanguard | warden |
| frost_archer | ranger | mystic |
| reef_stalker | predator | duelist |
| coral_priest | sage | ranger |
| hydro_mage | sorcerer | ranger |
| shell_knight | guardian | sage |
| tidal_shaman | mystic | sage |
| riptide_blade | duelist | vanguard |
| kraken | warden | sorcerer |
| leviathan | guardian | warden |

### EARTH
| Unit Key | Primary | Secondary |
|----------|---------|-----------|
| stone_guard | guardian | vanguard |
| bramble_knight | vanguard | guardian |
| seedling_archer | ranger | warden |
| earth_shaman | sage | mystic |
| crystal_mage | guardian | sorcerer |
| mud_stalker | predator | duelist |
| golem | warden | guardian |
| terra_sage | sorcerer | ranger |
| ancient_treant | duelist | warden |
| world_tree | sage | guardian |

### WIND
| Unit Key | Primary | Secondary |
|----------|---------|-----------|
| zephyr_scout | predator | duelist |
| wind_archer | ranger | predator |
| gale_dancer | sage | ranger |
| wind_squire | vanguard | duelist |
| sky_knight | warden | guardian |
| gust_sentinel | guardian | warden |
| monsoon_caller | sorcerer | mystic |
| wind_duelist | duelist | predator |
| storm_sovereign | predator | vanguard |
| void_wyrm | mystic | sorcerer |

### LIGHTNING
| Unit Key | Primary | Secondary |
|----------|---------|-----------|
| spark_fencer | duelist | sorcerer |
| volt_runner | predator | vanguard |
| thunder_archer | ranger | mystic |
| pulse_mender | sage | ranger |
| tesla_knight | guardian | warden |
| shock_mage | sorcerer | ranger |
| ball_lightning | mystic | sorcerer |
| thunder_warden | warden | guardian |
| thunderbird | vanguard | predator |
| storm_dragon | sorcerer | mystic |

### FORCE
| Unit Key | Primary | Secondary |
|----------|---------|-----------|
| iron_soldier | vanguard | sage |
| shadow_blade | predator | duelist |
| steel_archer | ranger | predator |
| war_cleric | sage | vanguard |
| battle_mage | sorcerer | warden |
| shield_bearer | guardian | sage |
| gladiator | duelist | vanguard |
| fortress | warden | guardian |
| siege_engineer | mystic | ranger |
| titan_lord | duelist | vanguard |

**Also add `secondaryArchetype` to `EVOLVED_TEMPLATES`** — each evolved form inherits the same secondary as its base form.

---

## Part E: Unit Bonds

Create `UNIT_BONDS` in `js/units-bonds.js`. Bonds give stat bonuses when specific unit pairs/trios are deployed together.

### Bond Data Structure
```javascript
var UNIT_BONDS = {
    // Elemental Duos (6 — one per element)
    fire_duo: {
        name: 'Blazing Partners',
        type: 'duo',
        units: ['flame_warrior', 'pyromancer'],
        bonus: { atkPct: 0.08 },
        description: '+8% ATK for both'
    },
    // ... define 6 elemental duos, 4 cross-element duos, 6 trios
};
```

### Bond Definitions
Design 16 bonds total:

**6 Elemental Duos** (one per element — pair two units of the same element):
- Fire: flame_warrior + pyromancer — +8% ATK
- Water: frost_archer + tidal_shaman — +8% healing power
- Earth: stone_guard + golem — +10% max HP
- Wind: zephyr_scout + wind_duelist — +10% ATK speed
- Lightning: spark_fencer + thunder_archer — +8% crit chance
- Force: gladiator + shield_bearer — +6% ATK and +6% HP

**4 Cross-Element Duos** (pair units of different elements):
- flame_warrior + frost_archer — "Fire & Ice" — +12% ability damage
- shadow_blade + zephyr_scout — "Silent Storm" — +15% move speed
- magma_knight + shell_knight — "Immovable Object" — +12% DR
- shock_mage + hydro_mage — "Conductor" — +15% mana gen

**6 Trios** (three units, gated behind Bond Hall L5):
- phoenix + leviathan + world_tree — "Elemental Trinity" — +15% all stats
- pyromancer + monsoon_caller + terra_sage — "Arcane Circle" — +20% ability damage
- ember_scout + reef_stalker + zephyr_scout — "Shadow Pack" — +12% ATK, +10% ATK speed
- magma_knight + golem + tesla_knight — "Iron Wall" — +15% HP, +8% DR
- fire_acolyte + coral_priest + gale_dancer — "Healing Light" — +25% healing power
- storm_dragon + void_wyrm + titan_lord — "Legendary Convergence" — +10% all stats, primary archetype +1 count

### Bond Application in Combat
At combat start:
1. Detect which bonds are active (all required units deployed)
2. Apply bond bonuses multiplied by Bond Hall `bondBonusMult`
3. Trio bonds only active if Bond Hall `trioBondsUnlocked` is true
4. Bond bonuses stack if multiple bonds are active

---

## Part F: Power Rating System

### Theoretical Power Rating (shown to player)
Create `calculatePowerRating(unit)` in `units-core.js`:

```javascript
function calculatePowerRating(unit) {
    var stats = getUnitStats(unit);
    var hpWeight = 0.4;
    var dpsWeight = 1.5;
    var abilityWeight = 0.8;

    var dps = stats.attack * (1 / unit.attackSpd); // attacks per second * damage
    var abilityValue = getAbilityPowerValue(unit); // see below
    var itemPower = getItemPowerContribution(unit); // sum of item stat bonuses

    var basePR = (stats.hp * hpWeight) + (dps * dpsWeight) + (abilityValue * abilityWeight) + itemPower;

    // Ascension multiplier
    var ascMult = 1 + getAscensionStatBonus(unit.ascensionTier);

    return Math.floor(basePR * ascMult);
}
```

`getAbilityPowerValue(unit)` estimates ability value:
- Look up `ABILITY_DATA[unit.key]`
- Parse the damage multiplier from desc (e.g., "200% ATK" = 2.0)
- Multiply by unit ATK
- Divide by mana cost (higher mana = less frequent = lower value)
- For T5 passives (MaxMana 0), use a fixed multiplier based on passive power

Also create `calculateTeamPowerRating(team)` — sum of all unit PRs plus synergy bonus estimate.

### Combat Benchmark Rating (dev tool)
Create `js/combat-benchmark.js` (loaded only for testing, NOT in game-v2.html by default):

```javascript
function runBenchmark(unitKey, options) {
    // options: { duration: 30, scenario: 'single_target' | 'aoe_5' | 'survivability', level: 30, stars: 3, ascension: null }
    // Creates a test unit at specified level/stars/ascension
    // Runs simulated combat for `duration` seconds
    // Returns: { dps, totalDamage, aoeDamage, survivalTime, healingDone }
}

function runArchetypeBenchmark(archetype) {
    // Run benchmarks for all units with this archetype (primary)
    // Return comparison table sorted by DPS
}

function runFullBenchmark() {
    // Run all units through all scenarios
    // Output table: unit | tier | archetype | singleDPS | aoeDPS | survivalTime | powerRating | combatRating
}
```

The benchmark uses the real combat engine functions (damage pipeline, mana, abilities) but in a headless mode (no DOM rendering). It should:
- Create a dummy enemy (or enemies for AoE) with standardized HP/DEF
- Let the unit auto-attack and cast abilities for the duration
- Track total damage dealt, healing done, and time-to-death
- **Combat Rating** = weighted score: `(singleDPS * 0.4) + (aoeDPS * 0.3) + (survivalScore * 0.3)`

Create a simple HTML test page `benchmark.html` that loads the game JS files + `combat-benchmark.js` and has buttons to run benchmarks with results displayed in a table.

---

## Part G: Save Migration

Bump save version to 7. Migration v6→v7:
- Add `level: 1, xp: 0, ascensionTier: null` to all existing units in roster
- Add `level: 1, xp: 0, ascensionTier: null` to all existing units in team slots
- No structural changes to saveData — just enriching existing unit objects

---

## Implementation Notes

- **File split first**: Do Part A before anything else. Verify the game loads and works identically after the split.
- **Load order matters**: `units-core.js` must load first (defines ELEMENTS, ARCHETYPES, functions), then `units-templates.js` (uses ELEMENTS), then `units-abilities.js`, then `units-bonds.js`, then `units-ascension.js`.
- The synergy counting logic (wherever archetype counts are tallied for synergy bonuses) needs to be updated to account for secondary archetypes and Transcendent double-counting. Search for where archetype synergy counts are calculated — likely in `main-v2.js` or `ui-v2.js`.
- The combat benchmark is a developer tool. Keep it separate from the main game. It should work by loading the same JS files the game uses.
- Commit when all parts work and the game loads without console errors.

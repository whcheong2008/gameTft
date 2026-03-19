# Prompt 33: Stage Expansion to 74 Stages (Progression Rework Implementation)

> **Purpose**: Expand the mission system from ~47 stages to 74 stages across 8 regions, aligned with PROGRESSION-REWORK.md rewards, XP scaling, and region progression. This prompt depends on **Prompt 31** (progression rework) being completed first — it assumes VE rewards, tiered drop weights, and XP scaling are already live.

> **Status**: Ready for implementation after Prompt 31 completes.

---

## Overview

This prompt expands `missions.js` from the current ~47-stage region structure to **74 complete stages** (9-9-9-9-10-10-10-8) with full stage data, enemy composition scaling, lock requirements, and reward integration. All stages map to STORY-STAGES.md for narrative context, though the worker only implements mission data structures — story dialogue/cutscenes are handled separately.

**Key dependencies:**
- Prompt 31 must be done first (VE currency, tiered star-up, gacha rates, XP curve)
- Stage names, types, and narrative beats from STORY-STAGES.md (already read)
- Lock requirements from MISSIONS-DESIGN.md (already read)
- Boss encounters from MISSIONS-DESIGN.md (some already implemented in Prompt 15/22, some need new definitions)
- Enemy evolution mechanics from existing `checkEnemyEvolution()` in units-ascension.js

**Pattern**: All `var`, global scope, NO ES modules. Self-contained and backward-compatible with existing save system (migration v6→v7 if needed).

---

## 1. STAGES Data Structure

Replace or expand the current `STAGES` array in `missions.js` with all 74 stages. Each stage must include:

```javascript
{
    id: 'r{region}_s{number}',          // e.g., 'r1_s1', 'r1_boss'
    region: 1–8,                         // Region number
    stageName: 'Descriptive name',       // From STORY-STAGES.md
    stageNumber: 1–10,                  // Sequence within region (1-9/10, or 'boss')
    description: 'Brief one-liner',     // From STORY-STAGES.md description
    requiredLevel: N,                   // See section 1.5 below
    lock: { /* lock object */ } or null, // See section 3 below
    encounterMechanic: null | 'mechanic_name', // From MISSIONS-DESIGN.md; most are null
    waves: [ /* wave objects */ ],      // See section 4 below
    boss: 'boss_key' | null,            // e.g., 'void_sovereign'; null for non-boss
    stageType: 'story|character|gameplay|boss', // From STORY-STAGES.md
    isBoss: true|false,                 // Convenience flag
    rewards: {
        ve: N,                          // Veil Essence (from PROGRESSION-REWORK table)
        xp: N,                          // XP (from PROGRESSION-REWORK XP table)
        unitDrops: N                    // Number of unit copies (from PROGRESSION-REWORK drop table)
    },
    dropWeights: {                      // Tier distribution for drops (from PROGRESSION-REWORK)
        t1: percentage,
        t2: percentage,
        // ... etc
    },
    firstClearReward: { /* optional */ }, // Feature unlock, if any; see section 5
    canRetry: true,                     // Always true; soft-locked by XP diminishing returns
}
```

### 1.1 Stage Names & Types

Use **STORY-STAGES.md** as the source of truth for stage names and types. For each region:

**Region 1 (9 stages: 8 story/character/gameplay + 1 boss)**
- R1S1: "First Steps" (story)
- R1S2: "Border Patrol" (character)
- R1S3: "The Crossing" (gameplay)
- R1S4: "Settling In" (story)
- R1S5: "Night Raid" (gameplay)
- R1S6: "The Family" (character)
- R1S7: "Otho's Notes" (story — clue #1)
- R1S8: "Into the Wild" (gameplay)
- R1 Boss: "The Veil Warden" (boss)

**Region 2 (9 stages: 8 + 1 boss)**
- R2S1: "The Road to the Barracks" (story — Mira joins)
- R2S2: "Hold the Line" (character)
- ... [Continue from STORY-STAGES.md lines 200+]
- R2 Boss: "The Archon" (boss)

**Regions 3–8**: Continue mapping from STORY-STAGES.md. For regions beyond the excerpt, use the stage-count structure (9-9-9-9-10-10-10-8) and infer:
- Every boss stage is the last stage of its region
- Other stages are a mix of story (2-3/region), character (2-3/region), and gameplay (2-3/region)
- Stage names follow the narrative arc described in STORY-STAGES.md (e.g., "The Barracks Trials" region has "Hold the Line", "Death from Afar", etc.)

### 1.2 Waves Per Stage

Wave structure from existing missions.js patterns, scaled by region:

| Stage Type | Waves | Budget Pattern | Notes |
|-----------|-------|----------------|-------|
| Regular (R1) | 2-3 | 3-4, 5-6, 7-8 | Low cost, ~L1-cost-1 units |
| Regular (R2) | 2-3 | 5-7, 8-10, 11-13 | Cost-1/cost-2 mix |
| Regular (R3) | 3-4 | 7-10, 10-13, 13-16, [16-19] | Cost-2/cost-3 |
| Regular (R4) | 3-4 | 10-13, 13-16, 16-20, [20-24] | Cost-3 prominent |
| Regular (R5) | 3-4 | 12-16, 16-20, 20-24, [24-28] | Cost-3/cost-4 |
| Regular (R6) | 3-4 | 14-18, 18-22, 22-26, [26-30] | Cost-4 common |
| Regular (R7) | 3-4 | 16-20, 20-24, 24-28, [28-32] | Cost-4/cost-5 |
| Regular (R8) | 4 | 18-22, 22-26, 26-30, 30-34 | Highest non-boss |
| Boss | 0 (handled separately) | — | Boss definition in `boss` field |

**Budget = unit cost × count** (e.g., budget 12 with maxCost 2 = four cost-2 units, or eight cost-1.5 units, or six cost-2 + two cost-1, etc.)

### 1.3 Required Level

Scales by region. Aim for progression such that a no-grind player hits expected levels (from PROGRESSION-REWORK.md XP curve):

| Region | First Stage | Boss Stage | Expected Player Level At Boss |
|--------|------------|-----------|------|
| R1 | 1 | 4 | 3 |
| R2 | 5 | 8 | 6 |
| R3 | 9 | 12 | 9 |
| R4 | 13 | 16 | 12 |
| R5 | 17 | 20 | 15 |
| R6 | 21 | 24 | 17 |
| R7 | 25 | 28 | 19 |
| R8 | 29 | — | 20 |

**Formula**: `requiredLevel = (region - 1) * 4 + stageWithinRegion`

Adjust if narrative suggests specific level gates (e.g., R4 might have a level 10 minimum for the crisis).

### 1.4 Veil Essence & XP Rewards

From **PROGRESSION-REWORK.md § Veil Essence Income Per Region**:

| Region | VE/Stage (avg 3★) | XP/Stage (at-level) | Unit Drops/Stage |
|--------|-------------------|-------------------|---|
| R1 | 200 | 80 | 2 |
| R2 | 350 | 130 | 2 |
| R3 | 550 | 200 | 2 |
| R4 | 750 | 280 | 3 |
| R5 | 1,000 | 380 | 3 |
| R6 | 1,300 | 500 | 3 |
| R7 | 1,600 | 650 | 3 |
| R8 | 2,000 | 800 | 4 |

**Apply** these as base rewards (3-star clear). Adjust for star rating:
- 1★ = 50% rewards
- 2★ = 75% rewards
- 3★ = 100% rewards

**XP diminishing returns** (from PROGRESSION-REWORK.md):
- At-level or below: 100%
- 1-2 levels above: 75%
- 3-4 levels above: 50%
- 5+ levels above: 25%

Implement this in the `calculateStageXP()` function (or equivalent). See section 6 for integration.

### 1.5 Drop Tier Weights

From **PROGRESSION-REWORK.md § Mission Unit Drops**:

| Region | Drops | T1 | T2 | T3 | T4 | T5 |
|--------|-------|-----|-----|-----|-----|-----|
| R1 | 2 | 70% | 30% | — | — | — |
| R2 | 2 | 50% | 40% | 10% | — | — |
| R3 | 2 | 30% | 35% | 35% | — | — |
| R4 | 3 | 15% | 25% | 45% | 15% | — |
| R5 | 3 | 5% | 15% | 40% | 35% | 5% |
| R6 | 3 | 5% | 10% | 30% | 40% | 15% |
| R7 | 3 | — | 5% | 20% | 45% | 30% |
| R8 | 4 | — | — | 15% | 45% | 40% |

Store in `stage.dropWeights` and use in mission reward generation. See section 6 for integration.

---

## 2. Region Structure (74 Stages Total)

Each region has a defined stage count, final boss, and optional region-level rewards (first-clear unlock).

### 2.1 Region Definitions

```javascript
var REGIONS = [
    {
        id: 1,
        name: 'The Frontier',
        stages: 9,  // 8 regular + 1 boss
        boss: 'veil_warden',
        firstClearReward: null  // or { type: 'buildingLevel', building: 'attunement_rite', level: 1 } if R1 unlock
    },
    {
        id: 2,
        name: 'The Barracks Trials',
        stages: 9,
        boss: 'archon',
        firstClearReward: null  // Example: { type: 'featureUnlock', feature: 'archetype_locks_understood' }
    },
    // ... continue through R8
];
```

### 2.2 Per-Region Stage Counts

| Region | Name | Stages | Boss |
|--------|------|--------|------|
| 1 | The Frontier | 9 | Veil Warden |
| 2 | The Barracks Trials | 9 | The Archon |
| 3 | The Synergy Trials | 9 | Twin Heralds |
| 4 | The Shattered Lands | 9 | Shattered Colossus |
| 5 | The Dual Convergence | 10 | Elemental Chimera |
| 6 | The Elemental Crucible | 10 | Prismatic Sentinel |
| 7 | The Proving Grounds | 10 | Arbiter of Trials |
| 8 | The Abyss Gate | 8 | Void Sovereign |
| **TOTAL** | | **74** | |

---

## 3. Lock System

Locks are **minimum count requirements** on team composition. They enforce the tutorial by requiring players to use specific systems. Grayed-out deploy button if unmet, with tooltip explaining the requirement.

### 3.1 Lock Types

From **MISSIONS-DESIGN.md § Lock System**:

```javascript
// Single archetype lock
{ type: 'archetype', value: 'guardian', count: 2 }
// "At least 2 Guardians"

// Archetype OR lock
{ type: 'archetype_or', value: ['predator', 'duelist'], count: 2 }
// "At least 2 Predators OR Duelists"

// Element lock
{ type: 'element', value: ['fire', 'water'], count: 2 }
// "At least 2 different elements"

// Element pair lock
{ type: 'element_pair', count: 2 }
// "Exactly 2 elements" (Dual Convergence region)

// Element threshold lock
{ type: 'element_threshold', count: 4 }
// "At least 4 different elements"

// No synergies lock
{ type: 'no_synergies' }
// "Maximum 1 of any single element" (disables element thresholds)

// Null
null
// No lock
```

### 3.2 Lock Assignment by Region

**Region 1**: No locks (all null)

**Region 2**: Single archetype locks
- R2S1: { type: 'archetype', value: 'guardian', count: 2 }
- R2S2: { type: 'archetype', value: 'ranger', count: 2 }
- R2S3: { type: 'archetype_or', value: ['sorcerer', 'mystic'], count: 2 }
- R2S4: { type: 'archetype_or', value: ['predator', 'duelist'], count: 2 }
- R2S5: { type: 'archetype', value: 'sage', count: 2 }
- R2S6-S8: null (no locks)
- R2 Boss: null

**Region 3**: Paired locks + element intro
- R3S1: { type: 'archetype', value: 'guardian', count: 2 } + { type: 'archetype', value: 'predator', count: 2 } (compound? or single with multi-value?)
- R3S2: { type: 'archetype', value: 'ranger', count: 2 } + { type: 'archetype', value: 'sage', count: 2 }
- R3S3: { type: 'element_pair', count: 2 } (two different elements)
- R3S4: { type: 'archetype', value: 'guardian', count: 3 } (or similar, deep stacking)
- R3S5-S8: null
- R3 Boss: null

**For compound locks (2+ constraints)**, the implementation should check all conditions. For simplicity in this pass, use nested lock objects:

```javascript
lock: {
    constraints: [
        { type: 'archetype', value: 'guardian', count: 2 },
        { type: 'archetype', value: 'predator', count: 2 }
    ]
}
```

Or flatten to a single constraint if gameplay testing suggests simpler is better.

**Region 4**: Encounter mechanics (no locks, handled separately)

**Region 5**: Dual-element locks
- All 10 stages: { type: 'element_pair', count: 2 }

**Region 6**: 4-element locks
- All 10 stages: { type: 'element_threshold', count: 4 }

**Region 7**: Mixed (locks + encounter mechanics, per MISSIONS-DESIGN.md)
- R7S1: { type: 'archetype', value: 'sage', count: 3 } + encounter: 'escalating_threat'
- R7S2: { type: 'no_synergies' } + encounter: 'reinforcement_pressure'
- R7S3: { type: 'archetype', value: 'predator', count: 2 }, { type: 'archetype', value: 'guardian', count: 2 } + encounter: 'protect_objective'
- R7S4: { type: 'element_threshold', count: 3 } + encounter: 'split_formation'
- R7S5: { type: 'archetype', value: 'guardian', count: 4 } + encounter: 'countdown' + encounter: 'vip_target'
- R7S6-S9: null
- R7 Boss: null

**Region 8**: No locks (all null). Difficulty via enemy power and encounter mechanics.

---

## 4. Enemy Composition & Waves

### 4.1 Enemy Scaling by Region

Enemies scale in level and tier distribution by region. **Enemy level = base level for region + stage offset**.

| Region | Base Enemy Level | Stage 1 | Stage Boss | Notes |
|--------|------------------|---------|-----------|-------|
| R1 | 1 | 1 | 4 | Low-tier mixed |
| R2 | 3 | 3 | 7 | Cost-1/cost-2 |
| R3 | 5 | 5 | 9 | Cost-2/cost-3 |
| R4 | 7 | 7 | 11 | Cost-3 common |
| R5 | 9 | 9 | 13 | Cost-3/cost-4 |
| R6 | 11 | 11 | 15 | Cost-4 common |
| R7 | 13 | 13 | 17 | Cost-4/cost-5 |
| R8 | 15 | 15 | 20 | Evolved units common |

**Stage offset within region**: +0 for stage 1, +1 for stage 2, ..., +{stageCount-1} for final boss.

**Enemy tier distribution**: Earlier stages use lower tiers (T1/T2), later stages mix higher tiers (T3/T4). R4+ includes evolved enemies (check `checkEnemyEvolution()` logic).

### 4.2 Wave Generation Function

Existing mission reward generation should be updated. In missions.js:

```javascript
function generateWaves(stage, playerLevel) {
    var waves = [];
    for (var i = 0; i < stage.waves.length; i++) {
        var waveDef = stage.waves[i];
        var wave = {
            budget: waveDef.budget,
            maxCost: waveDef.maxCost || 3,
            count: waveDef.count,
            units: generateWaveUnits(waveDef, stage.region, playerLevel)
        };
        waves.push(wave);
    }
    return waves;
}

function generateWaveUnits(waveDef, region, playerLevel) {
    // Generate enemy units matching waveDef.budget and maxCost
    // Use dropWeights (tier distribution) to determine unit tier
    // Apply evolution check for R4+ via checkEnemyEvolution()
    // Units start at base level + stage offset
    // Return array of unit objects
}
```

### 4.3 Encounter Mechanics

**Encounter mechanics** are optional modifiers on regular stages that add tactical puzzles. They're defined in MISSIONS-DESIGN.md § Encounter Mechanic Definitions and first appear in Region 4.

| Mechanic | Region 4 Stage | Reused In | Effect |
|----------|---|---|---|
| VIP Target | S1 | R7S3, R8S3, Colossus P1 | One enemy buffs/heals others; must be killed |
| Countdown | S2 | R7S5, R8S4, Colossus P2, Arbiter P3 | Enemy/structure charges wipe on timer |
| Reinforcement Pressure | S3 | R7S2, R8S2, Colossus P2 | Fixed spawn points produce enemies |
| Protect the Objective | S4 | R7S3, R8S4 | Friendly NPC must survive |
| Split Formation | S5 | R7S4, R8S3, Colossus P3, Arbiter P2 | Team forced into two groups |
| Escalating Threat | (implicit) | R7S1, R8S2 | Enemy ramps stats over time |

For **Prompt 33**, encounter mechanics are **not fully implemented** — they're stored as labels in the `stage.encounterMechanic` field, and the worker can add hooks/fields for future expansion. Full implementation (combat system changes) is deferred to a later prompt.

**Store as**:
```javascript
encounterMechanic: null | 'vip_target' | 'countdown' | 'reinforcement_pressure' | 'protect_objective' | 'split_formation' | 'escalating_threat'
```

---

## 5. Boss Encounters

8 boss definitions, all 2×2 grid size. Some are already implemented in Prompt 15/22; this prompt may add new ones or reference existing.

### 5.1 Boss Reconciliation

From **CONTINUITY.md**:
- `veil_warden` (R1) — Prompt 15 as `veil_guardian`, renamed here
- `archon` (R2) — NEW or Prompt 22
- `twin_heralds` (R3) — NEW or Prompt 22
- `shattered_colossus` (R4) — NEW or Prompt 22
- `elemental_chimera` (R5) — NEW or Prompt 22
- `prismatic_sentinel` (R6) — NEW or Prompt 22
- `arbiter_of_trials` (R7) — NEW or Prompt 22
- `void_sovereign` (R8) — Prompt 15, rewritten per MISSIONS-DESIGN.md

**For this prompt**: Reference existing boss keys if available. If a boss is missing, define a data structure (see 5.2) and note that full combat mechanics are implemented in a separate prompt.

### 5.2 Boss Data Structure

```javascript
var BOSSES = {
    veil_warden: {
        name: 'The Veil Warden',
        region: 1,
        gridSize: '2x2',
        phases: 1,
        keyMechanic: 'Telegraphed AoE',
        abilities: [
            {
                name: 'Ground Slam',
                cooldown: 10,
                range: 2,
                areaEffect: '2-cell AoE',
                telegraphy: '2s red zone warning',
                damage: 'moderate',
                trigger: 'periodic'
            },
            {
                name: 'Roar',
                trigger: '50% HP',
                effect: '+20% ATK (remainder of fight)',
                visual: 'Audio/visual cue'
            }
        ],
        phaseTransitions: [
            { hpThreshold: 50, transitionTime: 2 }
        ],
        tactics: 'No gimmicks. Teaches boss basics: big, telegraphed, dangerous.'
    },
    // ... continue for other 7 bosses
};
```

**Note**: If boss data is already in existing code (Prompt 15), reference that. This prompt's job is to ensure all 8 bosses have complete data structures and are correctly linked to their regions.

---

## 6. Integration with Existing Systems

### 6.1 Save Migration (v6 → v7)

Update `save.js` migration function to initialize any new fields:

```javascript
function migrateToV7(oldSave) {
    // ... existing migrations ...
    var save = oldSave;
    if (save.version < 7) {
        // Initialize 74-stage progress if migrating from v6
        if (!save.regionProgress) {
            save.regionProgress = {};
            for (var r = 1; r <= 8; r++) {
                save.regionProgress[r] = {};
                // For each stage in the region, add progress entry
                // { completed: false, bestStars: 0, unlockedAt: null }
            }
        }
        save.version = 7;
    }
    return save;
}
```

### 6.2 Mission Reward Calculation

Update mission completion handler to use new reward table:

```javascript
function calculateMissionRewards(stage, stars, playerLevel) {
    // Base rewards by stage
    var baseVE = stage.rewards.ve;
    var baseXP = stage.rewards.xp;
    var dropCount = stage.rewards.unitDrops;

    // Apply star multiplier
    var starMult = [0.5, 0.75, 1.0][stars - 1] || 1.0;
    var finalVE = Math.floor(baseVE * starMult);
    var finalXP = Math.floor(baseXP * starMult);

    // Apply XP diminishing returns
    var xpDiminish = getXPDiminishingReturnMultiplier(playerLevel, stage.region);
    finalXP = Math.floor(finalXP * xpDiminish);

    // Generate unit drops using dropWeights
    var unitDrops = [];
    for (var i = 0; i < dropCount; i++) {
        var tier = selectTierByWeight(stage.dropWeights);
        var unit = selectUnitByTier(tier);
        unitDrops.push(unit);
    }

    return {
        ve: finalVE,
        xp: finalXP,
        units: unitDrops
    };
}

function getXPDiminishingReturnMultiplier(playerLevel, region) {
    var expectedLevel = getExpectedLevelAtRegion(region);
    var levelDiff = playerLevel - expectedLevel;

    if (levelDiff <= 0) return 1.0;
    if (levelDiff <= 2) return 0.75;
    if (levelDiff <= 4) return 0.50;
    return 0.25;
}
```

### 6.3 Lock Validation

Implement `checkTeamMeetsLock()` in teams.js:

```javascript
function checkTeamMeetsLock(team, lock) {
    if (!lock) return true; // No lock

    if (lock.constraints) {
        // Compound lock: all constraints must pass
        return lock.constraints.every(function(constraint) {
            return checkTeamMeetsLock(team, constraint);
        });
    }

    if (lock.type === 'archetype') {
        var count = team.filter(function(u) {
            return u && u.archetype === lock.value;
        }).length;
        return count >= lock.count;
    }

    if (lock.type === 'archetype_or') {
        var count = team.filter(function(u) {
            return u && lock.value.indexOf(u.archetype) !== -1;
        }).length;
        return count >= lock.count;
    }

    if (lock.type === 'element') {
        var elements = {};
        team.forEach(function(u) {
            if (u) elements[u.element] = true;
        });
        return Object.keys(elements).length >= lock.count;
    }

    if (lock.type === 'element_pair') {
        var elements = {};
        team.forEach(function(u) {
            if (u) elements[u.element] = true;
        });
        return Object.keys(elements).length === 2;
    }

    if (lock.type === 'element_threshold') {
        var elements = {};
        team.forEach(function(u) {
            if (u) elements[u.element] = true;
        });
        return Object.keys(elements).length >= lock.count;
    }

    if (lock.type === 'no_synergies') {
        var elementCounts = {};
        team.forEach(function(u) {
            if (u) {
                elementCounts[u.element] = (elementCounts[u.element] || 0) + 1;
            }
        });
        return Object.values(elementCounts).every(function(c) { return c <= 1; });
    }

    return true; // Unknown lock type defaults to pass
}
```

### 6.4 Mission Selection UI

Update mission screen to display:
- Region name and stage number within region
- Lock requirement (if any) with tooltip
- Stage type and description
- Estimated enemy level and composition preview (via War Room intel, or simplified preview)
- Required team size gate (if relevant)
- Rewards on hover (VE, XP, unit drop tier distribution)

Disable deploy button if lock is not met.

### 6.5 Campaign Progress Tracking

Store per-stage progress:

```javascript
save.stageProgress = {
    'r1_s1': { completed: true, bestStars: 3, clearedAt: timestamp },
    'r1_s2': { completed: true, bestStars: 2, clearedAt: timestamp },
    'r1_boss': { completed: false, bestStars: 0, clearedAt: null },
    // ... 73 more
};
```

For **region completion**, check if all 9/10 stages in a region are `completed: true`.

---

## 7. Progression Feel & Tuning

### 7.1 Playtime Validation

Verify that a no-grind first playthrough aligns with PROGRESSION-REWORK.md playtime estimates:

| Activity | Target | Implementation |
|----------|--------|-----------------|
| Story first clear (74 stages, 1×) | ~9.7 hr | Combat time ~2.5 min/stage avg |
| Campaign with ~20% retries + grinding | ~11.9 hr | Retries tracked in star rating |
| First-clear + post-game gacha/grinding | ~25-30 hr | Grind mission integration |

**No hard validation needed** — this is for the orchestrator's planning. The worker should ensure numbers match the design (VE/stage, XP/stage, drops/stage as per tables above).

### 7.2 Boss Difficulty Scaling

Boss fights should feel like exam content:

- **R1 boss** (Veil Warden): Trivial. Teaches what a boss is.
- **R2–R3 bosses** (Archon, Twin Heralds): Hard. Punish 1-archetype teams.
- **R4 boss** (Shattered Colossus): Gauntlet. Tests encounter mechanic adaptation.
- **R5–R6 bosses** (Chimera, Sentinel): Hard. Demand element coverage.
- **R7 boss** (Arbiter): Punishing. Tests everything.
- **R8 boss** (Void Sovereign): DPS race. Enrage at 150s. Clearable at 4/7 threshold, comfortable at 10 (prismatic).

**Tuning** is done in boss data (Prompt 15/22). This prompt just ensures the stage structure is correct.

---

## 8. Open/Deferred Items

### 8.1 Hard Mode

Hard mode stages (post-campaign, higher difficulty) are not implemented in this prompt. They're deferred to a future feature. Placeholder structure:

```javascript
stage.hardMode = {
    unlocked: false,  // After first clear of region
    difficulty: 'hard',
    enemyLevelBoost: 2,
    rewards: {
        veMultiplier: 1.25,
        xpMultiplier: 1.25,
        dropMultiplier: 1.5
    }
};
```

### 8.2 Story Dialogue & Cutscenes

Stage names and types are defined; full dialogue/cutscene content is handled in a **separate story delivery system** (not this prompt). The worker only implements mission data structures.

### 8.3 Grind Mission Integration

Procedural grind missions are **separate from story stages**. They use the same reward scaling (80% of story rates) and enemy generation logic, but are not part of the 74-stage progression. Keep the existing grind mission system parallel.

### 8.4 Region Reward Unlocks

Some regions unlock features (e.g., "R3 first clear unlocks Forge L3"). These are noted as `firstClearReward` in stage definitions, but wired in a separate pass (not this prompt).

---

## 9. Implementation Checklist

- [ ] **STAGES array**: All 74 stages defined with complete data (id, region, name, description, level, lock, waves, boss, rewards, dropWeights)
- [ ] **REGIONS array**: 8 regions with stage counts, boss names, optional first-clear rewards
- [ ] **BOSSES definitions**: 8 boss data structures (or references to existing Prompt 15/22 bosses)
- [ ] **Wave budget generation**: Each stage has correct wave count, budget, and unit generation
- [ ] **Enemy scaling**: Enemy level = base + offset; tier distribution per region
- [ ] **Lock validation**: `checkTeamMeetsLock()` implemented for all lock types
- [ ] **Reward calculation**: `calculateMissionRewards()` applies star mult + XP diminishing returns + unit drops
- [ ] **Save migration**: v6 → v7 initializes new fields if needed
- [ ] **UI wiring**: Mission select screen displays regions, stages, locks, rewards
- [ ] **Deploy button gating**: Disabled if lock not met, with tooltip
- [ ] **Progress tracking**: Per-stage completion + best stars stored
- [ ] **Region completion**: Can detect when a region is fully cleared
- [ ] **Backward compatibility**: Existing save data still loads (graceful degradation)
- [ ] **No breaking changes**: Existing gacha, combat, team systems unchanged
- [ ] **Code pattern**: All `var`, global scope, NO ES modules
- [ ] **Self-contained**: mission.js expanded in-place; no new files unless necessary

---

## 10. Success Criteria

- [ ] All 74 stages have complete, non-null data
- [ ] VE/XP/drop rewards match PROGRESSION-REWORK.md tables exactly
- [ ] 8 regions are correctly structured with correct stage counts
- [ ] Locks are enforced on mission deploy (grayed out + tooltip if unmet)
- [ ] Enemy level/tier scaling matches region progression
- [ ] Boss encounters are linked and accessible
- [ ] Save migration handles old→new gracefully
- [ ] Mission select screen renders all regions and stages without errors
- [ ] Players can complete a full 74-stage campaign without data corruption
- [ ] XP diminishing returns formula applies correctly
- [ ] No syntax errors; all functions callable
- [ ] Playtime/progression feel aligns with 30-40 hour estimate

---

## 11. Related Prompts

- **Prompt 31** (Progression Rework): Must be done first. Implements VE currency, tiered star-up, gacha rates, XP curve.
- **Prompt 15/22** (Boss Framework): Existing boss data. This prompt references and validates.
- **Prompt 34** (Story Delivery): Will handle narrative scenes, dialogue, cutscenes for each stage.
- **Prompt 35** (Encounter Mechanics Combat): Will fully implement encounter mechanics in combat engine.


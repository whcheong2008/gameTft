# Prompt 22 — Phase 4: Region-Based Mission Expansion

> **Purpose**: Replace the current 14-mission linear story with the 8-region structure from MISSIONS-DESIGN.md. This is a major restructuring of `missions.js` that expands ~14 missions to ~45-50 stages with locks, encounter mechanics, and 8 new bosses.
>
> **Source of truth**: `MISSIONS-DESIGN.md` (entire document). For boss details not in MISSIONS-DESIGN.md, refer to `CONTENT-DESIGN.md` Sections 4-5.
>
> **Branch**: Work on `feature/phase4-regions` branch.
> ```bash
> cd "Game TFT"
> git checkout feature/phase4-regions
> ```
> All work happens on this branch. Commit when chunks are done.

---

## Context

**Current state**: `missions.js` has 14 `STORY_MISSIONS` with a 4-chapter overlay (`CHAPTERS`), 6 boss definitions in `BOSS_DATA`, wave generation via `generateMissionWave()`, 6 named captains in `ENEMY_CAPTAINS`, and grind mission support.

**Target state**: 8 regions with ~45-50 stages, lock system, 6 encounter mechanics, 8 bosses (from MISSIONS-DESIGN.md), region rewards, and all existing helpers preserved.

**Pattern**: All `var`, global scope, NO ES modules, NO import/export. Match existing code style in `missions.js`.

**Save version**: Currently v5. This prompt bumps to v6.

---

## Conflict Resolution Decisions (already made)

These decisions are final. Do not deviate.

1. **STORY_MISSIONS → STAGES**: The 14-entry `STORY_MISSIONS` array is replaced by a ~45-50 entry `STAGES` array. Add `var STORY_MISSIONS = STAGES;` alias for backward compatibility.

2. **CHAPTERS → REGIONS**: The 4-entry `CHAPTERS` object is replaced by an 8-entry `REGIONS` object. Region rewards replace chapter rewards. Delete the old `CHAPTERS` object and chapter helper functions (`getMissionChapter`, `isChapterComplete`, `isChapterRewardClaimed`, `claimChapterReward`, `getChapterStatuses`). Replace with region equivalents.

3. **Boss reconciliation**:
   - **Replace** `veil_guardian` with `veil_warden` (MISSIONS-DESIGN R1 boss — similar role, simpler mechanics)
   - **Keep** `infernal_wyvern`, `tidal_leviathan`, `stone_colossus`, `storm_phoenix` as-is — they become challenge mode bosses (no region references them)
   - **Update** `void_sovereign` to match MISSIONS-DESIGN spec (3 phases: Puppeteer→Commander→Unmaker with unit copying, board shrink, 150s enrage). Keep the existing `void_sovereign` key but rewrite the phases/abilities.
   - **Add 6 new bosses**: `archon`, `twin_heralds`, `shattered_colossus`, `elemental_chimera`, `prismatic_sentinel`, `arbiter_of_trials` — all from MISSIONS-DESIGN.md

4. **Captain reassignment**: Keep `ENEMY_CAPTAINS` and all captain functions. Reassign captain appearances to appropriate region stages:
   - `pyra` → Region 6 Stage 2 ("Fire and Stone", fire-biased enemies)
   - `nereus` → Region 5 Stage 2 ("Shifting Tides", wave-switching element enemies)
   - `gorath` → Region 6 Stage 4 ("Lightning Surge", earth counters lightning)
   - `sylph` → Region 7 Stage 2 ("Stripped Down", no element synergies)
   - `arbiter` → Region 7 Stage 5 ("Final Judgment", capstone stage)
   - `voidborn_champion` → Region 8 Stage 5 ("The Threshold", pre-boss gauntlet)

5. **storyProgress → regionProgress**: Save data changes from `storyProgress: <int>` to `regionProgress: { 1: { completed: [], bossCleared: false }, 2: { ... }, ... 8: { ... } }`. Also keep a `storyProgress` field for backward compat that tracks total stages cleared.

6. **Grind missions**: Preserved as-is. They're a separate system.

---

## Implementation Chunks

### Chunk A: Region & Lock System Data Structures

1. **Define `REGIONS` object** (replaces `CHAPTERS`):
```javascript
var REGIONS = {
    1: {
        name: 'The Frontier',
        subtitle: 'Basic combat, positioning',
        stageIds: ['r1_s1', 'r1_s2', 'r1_s3', 'r1_s4', 'r1_boss'],
        reward: { description: 'Unlock Summoning Circle upgrades + 1 free 10-pull', gold: 0, freeMultiRoll: 1 }
    },
    2: {
        name: 'The Barracks Trials',
        subtitle: 'Archetype roles',
        stageIds: ['r2_s1', 'r2_s2', 'r2_s3', 'r2_s4', 'r2_s5', 'r2_boss'],
        reward: { description: 'Unlock Evolution Lab + 500g + 1 random Cost-3 unit', gold: 500, randomUnit: { minCost: 3, maxCost: 3 } }
    },
    3: {
        name: 'The Synergy Trials',
        subtitle: 'Synergy pairing',
        stageIds: ['r3_s1', 'r3_s2', 'r3_s3', 'r3_s4', 'r3_boss'],
        reward: { description: 'Unlock Forge Level 3 (Transmute) + 1 essence of choice', gold: 0, essenceChoice: 1 }
    },
    4: {
        name: 'The Shattered Lands',
        subtitle: 'Adaptive combat',
        stageIds: ['r4_s1', 'r4_s2', 'r4_s3', 'r4_s4', 'r4_s5', 'r4_boss'],
        reward: { description: 'Unlock Forge Level 4 (Set Crafting) + 750g', gold: 750 }
    },
    5: {
        name: 'The Dual Convergence',
        subtitle: 'Element coverage',
        stageIds: ['r5_s1', 'r5_s2', 'r5_s3', 'r5_s4', 'r5_boss'],
        reward: { description: 'Unlock Gem Workshop + 1 random Cost-4 unit', gold: 0, randomUnit: { minCost: 4, maxCost: 4 } }
    },
    6: {
        name: 'The Elemental Crucible',
        subtitle: 'Multi-element orchestration',
        stageIds: ['r6_s1', 'r6_s2', 'r6_s3', 'r6_s4', 'r6_s5', 'r6_s6', 'r6_boss'],
        reward: { description: '1,000g + 2 essences of choice', gold: 1000, essenceChoice: 2 }
    },
    7: {
        name: 'The Proving Grounds',
        subtitle: 'Peak tactical challenge',
        stageIds: ['r7_s1', 'r7_s2', 'r7_s3', 'r7_s4', 'r7_s5', 'r7_boss'],
        reward: { description: 'Unlock Forge Level 5 (Ability Crafting) + Mythic Material', gold: 0, mythicMaterialChoice: 1 }
    },
    8: {
        name: 'The Abyss Gate',
        subtitle: 'Endgame mastery',
        stageIds: ['r8_s1', 'r8_s2', 'r8_s3', 'r8_s4', 'r8_s5', 'r8_s6', 'r8_boss'],
        reward: { description: 'Choice of any Cost-5 unit + 2,000g + Mythic Material', gold: 2000, randomUnit: { minCost: 5, maxCost: 5 }, mythicMaterialChoice: 1 }
    }
};
```

2. **Define `STAGES` array** — see Chunk B for all stages. Structure per stage:
```javascript
{
    id: 'r1_s1',
    region: 1,
    name: 'First Steps',
    description: '...',
    requiredLevel: 1,
    lock: null,  // or { type: 'archetype', value: 'guardian', count: 2 }
    encounterMechanic: null,  // or 'vip_target', 'countdown', etc.
    waves: [ { budget: 3, maxCost: 1, count: 2 } ],
    rewards: { gold: 30, xp: 50 }
}
```

Boss stages have `boss: 'boss_key'` and `waves: []` (same pattern as current boss missions).

3. **Backward compatibility alias**:
```javascript
var STORY_MISSIONS = STAGES;
```

4. **Lock type definitions** (for validation):
```javascript
var LOCK_TYPES = {
    archetype: 'Must have N units of specified archetype',
    archetype_pair: 'Must have N of archetype A + M of archetype B',
    archetype_or: 'Must have N of either archetype A or archetype B',
    element_count: 'Must have units from N different elements',
    element_dual: 'Must have exactly 2 different elements on team',
    element_min: 'Must have N different elements minimum',
    no_element_synergy: 'Max 1 unit of any single element',
    archetype_deep: 'Must have N units of one archetype (player choice)'
};
```

5. **Lock checking functions**:
```javascript
function checkLock(saveData, lock) {
    // Returns { passed: true/false, reason: 'string' }
    // lock is null → always passes
    // lock.type determines check logic
}

function getTeamArchetypeCounts(saveData) {
    // Returns { guardian: N, predator: N, ... } from current team
}

function getTeamElementCounts(saveData) {
    // Returns { fire: N, water: N, ... } from current team
}

function getUniqueElementCount(saveData) {
    // Returns number of distinct elements on current team
}
```

The team data comes from `saveData.team` — iterate slots, look up unit keys in `UNIT_TEMPLATES` / `EVOLVED_TEMPLATES`.

### Chunk B: All 8 Regions — Stage Definitions

Define all stages in the `STAGES` array. Read MISSIONS-DESIGN.md for exact stage names, descriptions, lock requirements, and encounter mechanics per stage.

**Wave budget scaling** (guidelines — tune as needed):
- Region 1: budgets 3–12, maxCost 1–2, counts 2–5, requiredLevel 1–4
- Region 2: budgets 8–18, maxCost 2–3, counts 3–6, requiredLevel 5–8
- Region 3: budgets 12–22, maxCost 2–4, counts 4–6, requiredLevel 8–11
- Region 4: budgets 15–28, maxCost 3–4, counts 4–7, requiredLevel 10–13
- Region 5: budgets 18–32, maxCost 3–5, counts 5–7, requiredLevel 12–15
- Region 6: budgets 22–40, maxCost 4–5, counts 5–7, requiredLevel 14–17
- Region 7: budgets 28–45, maxCost 4–5, counts 5–7, requiredLevel 16–19
- Region 8: budgets 35–60, maxCost 5, counts 6–7, requiredLevel 18–20

**Region 1** (4 stages + boss, no locks):
- r1_s1: "First Steps" — 2 waves
- r1_s2: "Border Patrol" — 2-3 waves
- r1_s3: "The Crossing" — 3 waves, first cost-2 enemies
- r1_s4: "Into the Wild" — 3 waves, some element bias
- r1_boss: "The Veil Warden" — boss: 'veil_warden'

**Region 2** (5 stages + boss, archetype locks):
- r2_s1: "Hold the Line" — lock: { type: 'archetype', value: 'guardian', count: 2 }
- r2_s2: "Death from Afar" — lock: { type: 'archetype', value: 'ranger', count: 2 }
- r2_s3: "The Arcane Barrage" — lock: { type: 'archetype_or', value: ['sorcerer', 'mystic'], count: 2 }
- r2_s4: "The Hunt" — lock: { type: 'archetype_or', value: ['predator', 'duelist'], count: 2 }
- r2_s5: "Restoration" — lock: { type: 'archetype', value: 'sage', count: 2 }
- r2_boss: "The Archon" — boss: 'archon'

**Region 3** (4 stages + boss, paired locks):
- r3_s1: "Shield and Fang" — lock: { type: 'archetype_pair', value: ['guardian', 'predator'], count: [2, 2] }
- r3_s2: "The Long Watch" — lock: { type: 'archetype_pair', value: ['ranger', 'sage'], count: [2, 2] }
- r3_s3: "Elemental Clash" — lock: { type: 'element_count', count: 2 } (minimum 2 different elements)
- r3_s4: "Deep Bonds" — lock: { type: 'archetype_deep', count: 3 }
- r3_boss: "The Twin Heralds" — boss: 'twin_heralds'

**Region 4** (5 stages + boss, encounter mechanics, no locks):
- r4_s1: "The Priority" — encounterMechanic: 'vip_target'
- r4_s2: "Against the Clock" — encounterMechanic: 'countdown'
- r4_s3: "Endless Tide" — encounterMechanic: 'reinforcement_pressure'
- r4_s4: "The Ward" — encounterMechanic: 'protect_objective'
- r4_s5: "The Growing Storm" — encounterMechanic: 'escalating_threat'
- r4_boss: "The Shattered Colossus" — boss: 'shattered_colossus'

**Region 5** (4 stages + boss, dual-element lock):
- r5_s1: "Fire and Ice" — lock: { type: 'element_dual' }
- r5_s2: "Shifting Tides" — lock: { type: 'element_dual' }, captain: 'nereus' on last wave
- r5_s3: "The Crucible Pair" — lock: { type: 'element_dual' }
- r5_s4: "Elemental Pressure" — lock: { type: 'element_dual' }
- r5_boss: "The Elemental Chimera" — boss: 'elemental_chimera'

**Region 6** (6 stages + boss, 4-element lock):
- r6_s1: "Four Winds" — lock: { type: 'element_min', count: 4 }
- r6_s2: "Fire and Stone" — lock: { type: 'element_min', count: 4 }, elementBias: ['fire', 'earth'], captain: 'pyra' on last wave
- r6_s3: "Storm and Sea" — lock: { type: 'element_min', count: 4 }, elementBias: ['water', 'wind']
- r6_s4: "Lightning Surge" — lock: { type: 'element_min', count: 4 }, elementBias: ['lightning', 'force'], captain: 'gorath' on last wave
- r6_s5: "The Full Spectrum" — lock: { type: 'element_min', count: 4 }, all 6 elements, evolved enemies
- r6_s6: "Crucible's Peak" — lock: { type: 'element_min', count: 4 }, full synergies, high star levels
- r6_boss: "The Prismatic Sentinel" — boss: 'prismatic_sentinel'

**Region 7** (5 stages + boss, locks + encounter mechanics):
- r7_s1: "Endurance Under Fire" — lock: { type: 'archetype', value: 'sage', count: 3 }, encounterMechanic: 'escalating_threat'
- r7_s2: "Stripped Down" — lock: { type: 'no_element_synergy' }, encounterMechanic: 'reinforcement_pressure', captain: 'sylph' on last wave
- r7_s3: "Divided Command" — lock: { type: 'archetype_pair', value: ['predator', 'guardian'], count: [2, 2] }, encounterMechanic: 'protect_objective'
- r7_s4: "Fractured Elements" — lock: { type: 'element_min', count: 3 }, encounterMechanic: 'split_formation'
- r7_s5: "Final Judgment" — lock: { type: 'archetype_deep', count: 4 }, encounterMechanic: 'countdown', also has VIP, captain: 'arbiter' on last wave
- r7_boss: "The Arbiter of Trials" — boss: 'arbiter_of_trials'

**Region 8** (6 stages + boss, no locks, extreme difficulty):
- r8_s1: "Descent" — no lock, high stats, full synergies, evolved enemies
- r8_s2: "The Gauntlet" — encounterMechanic: 'reinforcement_pressure' + 'escalating_threat' (combined)
- r8_s3: "Shattered Ground" — encounterMechanic: 'split_formation' + 'vip_target' (combined)
- r8_s4: "The Crucible Returns" — encounterMechanic: 'countdown' + 'protect_objective' (combined)
- r8_s5: "The Threshold" — full synergies, evolved, 4-5 waves, captain: 'voidborn_champion' on last wave
- r8_s6: "The Void's Edge" — void-element enemies (no element advantage)
- r8_boss: "The Eternal Throne" — boss: 'void_sovereign'

For stages with combined encounter mechanics, use an array: `encounterMechanic: ['reinforcement_pressure', 'escalating_threat']`.

**Wave configs**: Each stage needs wave objects with `budget`, `maxCost`, `count`, and optionally `elementBias`, `synergyBias`, `enemySynergies`, `enemyEvolutions`, `captain`. Use the budget scaling guidelines above. Boss stages have `waves: []` and `boss: 'key'`.

**Enemy design per MISSIONS-DESIGN.md**:
- Region 2 stages should have enemies that demonstrate WHY the locked archetype matters (e.g., r2_s1 has heavy melee rushers → Guardians absorb hits)
- Region 4 enemies are designed around the encounter mechanic (see MISSIONS-DESIGN.md for details)
- Region 5 enemies are mono-element per wave
- Region 6 enemies have active element synergies
- Region 8 enemies are full power: synergies, evolutions, high stars

### Chunk C: Encounter Mechanics System

Implement the 6 encounter mechanics from MISSIONS-DESIGN.md. These modify how waves work.

```javascript
var ENCOUNTER_MECHANICS = {
    vip_target: {
        name: 'VIP Target',
        desc: 'One enemy buffs/heals the rest. Kill it to stop the effect.',
        setup: function(waveState, stageData) {
            // Mark one enemy as VIP — gives +25% ATK buff + regen to allies
            // VIP has visual indicator (star emoji or similar)
        },
        tick: function(waveState, dt) {
            // Apply VIP buff to alive allies while VIP is alive
            // When VIP dies, remove buff from all allies
        }
    },
    countdown: {
        name: 'Countdown',
        desc: 'A structure charges a wipe ability. Destroy it before it fires.',
        setup: function(waveState, stageData) {
            // Spawn a Veil Crystal entity on enemy side
            // Crystal: high HP, doesn't attack, charges for 45s
            // Add countdown timer to waveState
        },
        tick: function(waveState, dt) {
            // Decrement timer. At 0, deal 80% current HP to all player units
            // If crystal destroyed, cancel timer
        }
    },
    reinforcement_pressure: {
        name: 'Reinforcement Pressure',
        desc: 'Spawn points produce new enemies at set intervals.',
        setup: function(waveState, stageData) {
            // Define 3 fixed spawn points on enemy grid
            // Set spawn timer (every 8s)
        },
        tick: function(waveState, dt) {
            // Every 8s, spawn low-tier enemy at each spawn point
            // Cap total spawned to prevent infinite
        }
    },
    protect_objective: {
        name: 'Protect the Objective',
        desc: 'A friendly NPC must survive all waves.',
        setup: function(waveState, stageData) {
            // Place friendly NPC on row 6 (player backline)
            // NPC has moderate HP, no attack, cannot move
            // Enemies prioritize NPC
        },
        tick: function(waveState, dt) {
            // Check NPC alive. If dead → mission failed
        }
    },
    split_formation: {
        name: 'Split Formation',
        desc: 'Team forced into two groups with a gap.',
        setup: function(waveState, stageData) {
            // Create 1-column gap in middle of grid
            // Push player units to either side based on current position
            // Gap column damages units that try to cross (pulse every 5s)
        },
        tick: function(waveState, dt) {
            // Pulse gap damage every 5s
        }
    },
    escalating_threat: {
        name: 'Escalating Threat',
        desc: 'One enemy gains stacking buffs over time.',
        setup: function(waveState, stageData) {
            // Mark one elite enemy as the escalator
            // Starts with low stats
        },
        tick: function(waveState, dt) {
            // Every 5s: +15% ATK, +10% attack speed to escalator
        }
    }
};
```

**Implementation notes:**
- Each mechanic stores its state on `waveState.mechanicState` (an object the combat engine can read)
- `setup()` is called when a wave begins (after enemies are generated)
- `tick()` is called each combat update tick
- The combat engine in `main-v2.js` already has a tick loop — add a single hook: `if (waveState.mechanicState && waveState.mechanicState.tick) waveState.mechanicState.tick(waveState, dt);`
- For combined mechanics (Region 8), both are set up and both tick
- Keep mechanic logic in `missions.js`. Only add minimal hooks in `main-v2.js` (the tick call above).

### Chunk D: 8 Boss Definitions

**Replace `veil_guardian`** with `veil_warden`. Keep the same key position in BOSS_DATA but update name/abilities:

```javascript
veil_warden: {
    name: 'Veil Warden',
    emoji: '👁️',
    element: null,
    size: [2, 2],
    baseHp: 5000,
    // ... single phase, Ground Slam (10s, 2-cell AoE on highest-HP), Roar (50% HP trigger, +20% ATK self-buff)
    phases: [{ hpThreshold: 1.0, abilities: [...] }],
    enrageTime: 90,
    loot: { gold: 250, xp: 500, firstClearGold: 500 }
}
```

**Keep** `infernal_wyvern`, `tidal_leviathan`, `stone_colossus`, `storm_phoenix` exactly as-is.

**Add 6 new bosses** (all from MISSIONS-DESIGN.md — read the doc for full ability specs):

1. **archon** (R2): Single phase with 3 rotating stances (Guardian=+40%DR+shield, Predator=dash+50%ATK, Sorcerer=3×3 AoE). Rotates every 15-20s.

2. **twin_heralds** (R3): TWO 1×2 boss units. Proximity buff (+30% ATK within 2 cells). Kill-order puzzle: survivor enrages (+100% ATK, -50% cooldowns). Melee Herald: Charge+Cleave. Magic Herald: Chain Lightning+Barrier.

3. **shattered_colossus** (R4): 3 phases cycling encounter mechanics.
   - Phase 1 (100-65%): VIP Target — Healing Crystal spawns, regens boss 2%/s
   - Phase 2 (65-30%): Countdown (30s Cataclysm Charge on arm, 5000 dmg to interrupt) + Reinforcements (2 Stone Shards every 10s)
   - Phase 3 (30-0%): Split Formation — grid splits, boss attacks both sides

4. **elemental_chimera** (R5): Single phase, continuous rotation. Elemental Shift every 20s (3s telegraph). Element Surge (2-cell AoE, current element). Absorption passive: heals from damage matching current element.

5. **prismatic_sentinel** (R6): Single phase, continuous rotation. Prismatic Shield every 15s (immune to one element, +50% vulnerable to another). Elemental Storm every 10s (AoE of immune element). Resonance Burst every 20s (bonus damage to player units matching immune element).

6. **arbiter_of_trials** (R7): 3 phases.
   - Phase 1 (100-65%): Suppression Field (all element synergies disabled). Judge's Gavel (8s, single-target on highest-ATK, 1.5s telegraph).
   - Phase 2 (65-30%): Split Formation + VIP healer add (1.5% boss HP/s heal). Element synergies re-enabled.
   - Phase 3 (30-0%): Countdown (25s to full wipe, deal damage threshold to interrupt). Accelerating Judgment (+10% attack speed every 5s).

**Update `void_sovereign`** (R8): Rewrite phases to match MISSIONS-DESIGN spec:
- Phase 1 "Puppeteer" (100-70%): Void Tendrils (8s, 3 random roots+damage), Elemental Mimicry (copies highest-damage player's element), Void Barrier (15% max HP shield every 20s)
- Phase 2 "Commander" (70-30%): Summon Void Champions (4 copies of random player units), Void Beam (10s, row attack, 2s telegraph), Dimensional Rift (20s, swaps 2 player + 2 champion positions)
- Phase 3 "Unmaker" (30-0%): Healing Suppression (-15% healing), Annihilation (12s, all take 70% ATK), Void Collapse (20s, remove 2 grid cells), Final Form (10% HP trigger: doubled ATK+speed)
- enrageTime: 150

**Twin Heralds special handling**: This boss spawns TWO 1×2 units. The `size` field should be `[1, 2]` and the boss data should include a `twinBoss: true` flag plus a `secondUnit` property with the Magic Herald's stats/abilities. The combat engine boss spawning logic will need to check for `twinBoss` and place both units.

### Chunk E: Region Functions & Save Migration

1. **Delete chapter functions**: Remove `getMissionChapter`, `isChapterComplete`, `isChapterRewardClaimed`, `claimChapterReward`, `getChapterStatuses`. Remove the `CHAPTERS` object.

2. **Add region functions**:
```javascript
function getStageRegion(stageId) { ... }
function isRegionComplete(saveData, regionNum) { ... }
function isRegionBossCleared(saveData, regionNum) { ... }
function isRegionRewardClaimed(saveData, regionNum) { ... }
function claimRegionReward(saveData, regionNum) { ... }
function getRegionStatuses(saveData) { ... }
function getStageByIndex(index) { return STAGES[index]; }
function getStageById(stageId) { ... }
function isStageUnlocked(saveData, stageId) {
    // A stage is unlocked if:
    // 1. It's in Region 1 (always unlocked)
    // 2. The previous stage in the same region is completed
    // 3. For first stage of Region N (N>1): Region N-1 boss is cleared
}
function isStageCompleted(saveData, stageId) { ... }
```

3. **Update `getAvailableStoryMissions()`** → rename to `getAvailableStages()` with an alias:
```javascript
function getAvailableStages(saveData) {
    var available = [];
    for (var i = 0; i < STAGES.length; i++) {
        var stage = STAGES[i];
        if (!isStageUnlocked(saveData, stage.id)) continue;
        if (saveData.player.level < stage.requiredLevel) continue;
        if (stage.lock && !checkLock(saveData, stage.lock).passed) {
            available.push({ stage: stage, index: i, locked: true, lockReason: checkLock(saveData, stage.lock).reason });
        } else {
            available.push({ stage: stage, index: i, locked: false });
        }
    }
    return available;
}
var getAvailableStoryMissions = getAvailableStages; // alias
```

4. **Update `completeStoryMission()`** → update to track region progress:
```javascript
function completeStoryMission(saveData, missionIndex, starRating) {
    var stage = STAGES[missionIndex];
    if (!stage) return;

    // Update legacy storyProgress
    if (missionIndex >= saveData.missions.storyProgress) {
        saveData.missions.storyProgress = missionIndex + 1;
    }

    // Update regionProgress
    var rNum = stage.region;
    if (!saveData.missions.regionProgress[rNum]) {
        saveData.missions.regionProgress[rNum] = { completed: [], bossCleared: false };
    }
    var rp = saveData.missions.regionProgress[rNum];
    if (rp.completed.indexOf(stage.id) < 0) {
        rp.completed.push(stage.id);
    }
    if (stage.boss) {
        rp.bossCleared = true;
    }

    // Star rating tracking
    if (!saveData.missions.starRatings) saveData.missions.starRatings = {};
    var prevStars = saveData.missions.starRatings[stage.id] || 0;
    if (starRating > prevStars) {
        saveData.missions.starRatings[stage.id] = starRating;
    }
}
```

5. **Save migration v5 → v6** (in `save.js`):
```javascript
// In the migration chain:
if (data.version < 6) {
    // Initialize regionProgress from old storyProgress
    if (!data.missions.regionProgress) {
        data.missions.regionProgress = {};
        for (var r = 1; r <= 8; r++) {
            data.missions.regionProgress[r] = { completed: [], bossCleared: false };
        }
    }
    // Map old storyProgress (0-14) to new region progress (best effort)
    var oldProgress = data.missions.storyProgress || 0;
    // Region 1: old missions 0-3 (4 stages)
    if (oldProgress >= 1) data.missions.regionProgress[1].completed.push('r1_s1');
    if (oldProgress >= 2) data.missions.regionProgress[1].completed.push('r1_s2');
    if (oldProgress >= 3) data.missions.regionProgress[1].completed.push('r1_s3');
    if (oldProgress >= 4) { data.missions.regionProgress[1].completed.push('r1_s4'); data.missions.regionProgress[1].completed.push('r1_boss'); data.missions.regionProgress[1].bossCleared = true; }
    // Region 2: old missions 4-6
    if (oldProgress >= 5) data.missions.regionProgress[2].completed.push('r2_s1');
    if (oldProgress >= 6) data.missions.regionProgress[2].completed.push('r2_s2');
    if (oldProgress >= 7) { data.missions.regionProgress[2].completed.push('r2_s3'); data.missions.regionProgress[2].completed.push('r2_s4'); data.missions.regionProgress[2].completed.push('r2_s5'); data.missions.regionProgress[2].completed.push('r2_boss'); data.missions.regionProgress[2].bossCleared = true; }
    // Region 3-4: old missions 7-10
    if (oldProgress >= 8) { data.missions.regionProgress[3].completed.push('r3_s1'); data.missions.regionProgress[3].completed.push('r3_s2'); }
    if (oldProgress >= 9) { data.missions.regionProgress[3].completed.push('r3_s3'); data.missions.regionProgress[3].completed.push('r3_s4'); data.missions.regionProgress[3].completed.push('r3_boss'); data.missions.regionProgress[3].bossCleared = true; }
    if (oldProgress >= 10) data.missions.regionProgress[4].completed.push('r4_s1');
    if (oldProgress >= 11) { data.missions.regionProgress[4].completed.push('r4_s2'); data.missions.regionProgress[4].completed.push('r4_s3'); data.missions.regionProgress[4].completed.push('r4_s4'); data.missions.regionProgress[4].completed.push('r4_s5'); data.missions.regionProgress[4].completed.push('r4_boss'); data.missions.regionProgress[4].bossCleared = true; }
    // Region 5-8: old missions 11-14
    if (oldProgress >= 12) { data.missions.regionProgress[5].completed.push('r5_s1'); data.missions.regionProgress[5].completed.push('r5_s2'); data.missions.regionProgress[5].completed.push('r5_s3'); data.missions.regionProgress[5].completed.push('r5_s4'); data.missions.regionProgress[5].completed.push('r5_boss'); data.missions.regionProgress[5].bossCleared = true; }
    if (oldProgress >= 13) { data.missions.regionProgress[6].completed.push('r6_s1'); data.missions.regionProgress[6].completed.push('r6_s2'); data.missions.regionProgress[6].completed.push('r6_s3'); data.missions.regionProgress[6].completed.push('r6_s4'); data.missions.regionProgress[6].completed.push('r6_s5'); data.missions.regionProgress[6].completed.push('r6_s6'); data.missions.regionProgress[6].completed.push('r6_boss'); data.missions.regionProgress[6].bossCleared = true; }
    if (oldProgress >= 14) {
        // Old missions 12-13 mapped to R7, mission 14 to R8 boss
        for (var rs = 1; rs <= 5; rs++) data.missions.regionProgress[7].completed.push('r7_s' + rs);
        data.missions.regionProgress[7].completed.push('r7_boss');
        data.missions.regionProgress[7].bossCleared = true;
        for (var rs2 = 1; rs2 <= 6; rs2++) data.missions.regionProgress[8].completed.push('r8_s' + rs2);
        data.missions.regionProgress[8].completed.push('r8_boss');
        data.missions.regionProgress[8].bossCleared = true;
    }

    // Initialize starRatings
    if (!data.missions.starRatings) data.missions.starRatings = {};

    // Convert chapter rewards to region rewards
    if (data.missions.chapterRewardsClaimed) {
        if (!data.missions.regionRewardsClaimed) data.missions.regionRewardsClaimed = [];
        // Map: chapter 1→region 1, chapter 2→region 2, chapter 3→region 3, chapter 4→region 5
        var chapterToRegion = { 1: 1, 2: 2, 3: 3, 4: 5 };
        for (var ci = 0; ci < data.missions.chapterRewardsClaimed.length; ci++) {
            var mappedRegion = chapterToRegion[data.missions.chapterRewardsClaimed[ci]];
            if (mappedRegion && data.missions.regionRewardsClaimed.indexOf(mappedRegion) < 0) {
                data.missions.regionRewardsClaimed.push(mappedRegion);
            }
        }
    }

    data.version = 6;
}
```

Also update `SAVE_VERSION` to 6 and add `regionProgress` and `starRatings` and `regionRewardsClaimed` to the default save data.

### Chunk F: Verification

1. `node -c js/missions.js` passes (syntax check)
2. `node -c js/save.js` passes
3. All stage IDs in STAGES are unique
4. All stage IDs referenced in REGIONS.stageIds exist in STAGES
5. All locks reference valid archetypes (from `ARCHETYPES` in units.js) or valid lock types
6. All boss keys in stages exist in BOSS_DATA
7. Region stage counts match MISSIONS-DESIGN.md (R1=5, R2=6, R3=5, R4=6, R5=5, R6=7, R7=6, R8=7 including boss stages)
8. Total stage count is 47 (37 regular + 2 optional + 8 boss = 47)
9. Lock checking functions handle all lock types
10. Captain assignments: 6 captains assigned to correct stages
11. Backward compatibility: `STORY_MISSIONS` alias exists and equals `STAGES`
12. `getAvailableStoryMissions` alias exists
13. Grind mission system untouched and still works

Write a verification script:
```bash
node -e "
var fs = require('fs');
eval(fs.readFileSync('js/units.js', 'utf8'));
eval(fs.readFileSync('js/save.js', 'utf8'));
eval(fs.readFileSync('js/items.js', 'utf8'));
eval(fs.readFileSync('js/missions.js', 'utf8'));
// Check stage IDs unique
var ids = STAGES.map(function(s) { return s.id; });
var unique = ids.filter(function(v,i,a) { return a.indexOf(v) === i; });
console.log('Stages:', ids.length, 'Unique:', unique.length, ids.length === unique.length ? 'OK' : 'DUPLICATES');
// Check all region stageIds exist
var regionKeys = Object.keys(REGIONS);
for (var r = 0; r < regionKeys.length; r++) {
    var reg = REGIONS[regionKeys[r]];
    for (var s = 0; s < reg.stageIds.length; s++) {
        var found = ids.indexOf(reg.stageIds[s]) >= 0;
        if (!found) console.log('MISSING stage:', reg.stageIds[s], 'in region', regionKeys[r]);
    }
}
// Check boss keys exist
for (var i = 0; i < STAGES.length; i++) {
    if (STAGES[i].boss && !BOSS_DATA[STAGES[i].boss]) {
        console.log('MISSING boss:', STAGES[i].boss, 'for stage', STAGES[i].id);
    }
}
// Check aliases
console.log('STORY_MISSIONS alias:', STORY_MISSIONS === STAGES ? 'OK' : 'FAIL');
console.log('Total stages:', STAGES.length);
console.log('Regions:', Object.keys(REGIONS).length);
console.log('Bosses in BOSS_DATA:', Object.keys(BOSS_DATA).length);
"
```

---

## Critical Notes

- **Do NOT modify `main-v2.js` or `ui-v2.js`** unless absolutely necessary for encounter mechanic hooks. Keep changes to `missions.js` and `save.js`.
- If encounter mechanics need a tick hook in `main-v2.js`, add only ONE small check: `if (typeof tickEncounterMechanics === 'function') tickEncounterMechanics(dt);` — define the function in `missions.js`.
- **Preserve `generateMissionWave()`** — wave generation logic works fine, just ensure it handles new stage wave configs.
- **Preserve `ENEMY_CAPTAINS` and `createCaptainUnit()`** — just update which stages reference them.
- **Preserve grind missions** — they're separate.
- **The `STORY_MISSIONS` alias** is critical — `ui-v2.js` and `main-v2.js` reference it.
- Read the full `MISSIONS-DESIGN.md` before starting — it has detailed descriptions for every stage.
- **Pattern**: All `var`, NO `let`/`const`, NO arrow functions, NO template literals. Global scope only.

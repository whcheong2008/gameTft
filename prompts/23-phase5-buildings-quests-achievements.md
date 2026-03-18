# Prompt 23 — Phase 5: Buildings, Daily Quests, Achievements

> **Purpose**: Add 3 new buildings (Gem Workshop, Mana Shrine, Bond Hall), daily quest system, and achievement system. These are progression polish features from PROGRESSION-DESIGN.md Section 6 (buildings), Section 7 (daily quests), and Section 9 (achievements).
>
> **Source of truth**: `PROGRESSION-DESIGN.md` Sections 6, 7, 9. For bond details: `UNITS-DESIGN.md`.
>
> **Branch**: Work on `feature/phase5-progression` branch.
> ```bash
> cd "Game TFT"
> git checkout feature/phase5-progression
> ```
>
> **SCOPE REMINDER** (from SCOPE.md): No stamina system, no premium currency (gems), no weekly quests, no weekly rotation, no weekly shop, no login calendar. Gold is the only currency. Convert any gem rewards to gold at 10g per gem.

---

## Context

**Current state**: `hub.js` defines 7 buildings (barracks, summoning_circle, training_ground, warehouse, war_room, evolution_lab, forge). No daily quests. No achievements. Save version is 5 (will be 6 after prompt 22 — work with whichever version you find).

**Pattern**: All `var`, global scope, NO ES modules, NO import/export. Match existing code style.

**Files to modify**: `hub.js` (buildings), `save.js` (save data + migration). Create NO new JS files — add quest/achievement data and functions to `hub.js`.

**Files NOT to modify**: `missions.js`, `main-v2.js`, `ui-v2.js` (UI will be wired later in a separate prompt).

---

## Implementation Chunks

### Chunk 1: Three New Buildings

Add to the `BUILDINGS` object in `hub.js`:

**Gem Workshop** (building key: `gem_workshop`):
```javascript
gem_workshop: {
    name: 'Gem Workshop',
    emoji: '💎',
    description: 'Socket, combine, and transmute gems',
    maxLevel: 5,
    upgradeCosts: [0, 500, 1200, 2500, 5000, 10000],
    effects: [
        'Locked — unlocks gem operations',
        'Gem inventory + gem socketing',
        'Gem combining (3→1) + gem removal',
        'Gem transmute (change type, keep rarity, 30g)',
        'Auto-socket suggestion for team',
        'Prismatic Forge: combine 3 different Epic gems → 1 Prismatic gem'
    ],
    prereq: { level: 12 }
}
```

**Mana Shrine** (building key: `mana_shrine`):
```javascript
mana_shrine: {
    name: 'Mana Shrine',
    emoji: '🔵',
    description: 'Passive bonuses to mana and ability power',
    maxLevel: 5,
    upgradeCosts: [0, 800, 2000, 4000, 8000, 15000],
    effects: [
        'Locked — unlocks mana bonuses',
        '+5 starting mana for all units',
        'Mana generation from attacks +10%',
        'Ability damage +5% (global)',
        'First ability cast costs 10% less mana',
        'Full mana bar grants +10% ATK until cast'
    ],
    prereq: { level: 15 }
}
```

**Bond Hall** (building key: `bond_hall`):
```javascript
bond_hall: {
    name: 'Bond Hall',
    emoji: '🤝',
    description: 'View and enhance unit bond bonuses',
    maxLevel: 5,
    upgradeCosts: [0, 600, 1500, 3500, 7000, 12000],
    effects: [
        'Locked — unlocks bond viewer',
        'View active bonds and bonuses',
        'Bond bonuses increased by 25%',
        'Unlock bond quests (earn extra gold)',
        'Bond bonuses increased by 50% total',
        'Unlock trio bonds (3-unit bonds active)'
    ],
    prereq: { level: 10 }
}
```

**Building bonus getter functions** — add these to `hub.js`:

```javascript
function getManaShrineBonuses(saveData) {
    var level = getBuildingLevel(saveData, 'mana_shrine');
    return {
        startingMana: level >= 1 ? 5 : 0,
        manaGenMult: level >= 2 ? 1.10 : 1.0,
        abilityDamageMult: level >= 3 ? 1.05 : 1.0,
        firstCastDiscount: level >= 4 ? 0.10 : 0,
        fullManaAtkBonus: level >= 5 ? 0.10 : 0
    };
}

function getBondHallBonuses(saveData) {
    var level = getBuildingLevel(saveData, 'bond_hall');
    return {
        canViewBonds: level >= 1,
        bondBonusMult: level >= 4 ? 1.50 : (level >= 2 ? 1.25 : 1.0),
        bondQuestsUnlocked: level >= 3,
        trioBondsUnlocked: level >= 5
    };
}

function getGemWorkshopCapabilities(saveData) {
    var level = getBuildingLevel(saveData, 'gem_workshop');
    return {
        canSocket: level >= 1,
        canCombine: level >= 2,
        canRemove: level >= 2,
        canTransmute: level >= 3,
        transmuteGoldCost: 30,
        canAutoSocket: level >= 4,
        canPrismaticForge: level >= 5
    };
}
```

**Update `canUpgradeBuilding()`** to check `prereq`:
```javascript
function canUpgradeBuilding(saveData, buildingId) {
    var level = getBuildingLevel(saveData, buildingId);
    var bld = BUILDINGS[buildingId];
    if (!bld || level >= bld.maxLevel) return false;
    if (bld.prereq) {
        if (bld.prereq.level && saveData.player.level < bld.prereq.level) return false;
    }
    var cost = bld.upgradeCosts[level + 1];
    return saveData.player.gold >= cost;
}
```

### Chunk 2: Daily Quest System

Add to `hub.js`:

**Quest pool definition**:
```javascript
var DAILY_QUEST_POOL = [
    {
        id: 'win_missions',
        name: 'Win 3 Missions',
        description: 'Complete any 3 missions',
        requirement: { type: 'missions_won', count: 3 },
        reward: { gold: 80 }
    },
    {
        id: 'deploy_element',
        name: 'Deploy Element Team',
        description: 'Use 3+ of one element in a mission',
        requirement: { type: 'element_deploy', count: 3 },
        reward: { gold: 60 }
    },
    {
        id: 'enhance_item',
        name: 'Enhance an Item',
        description: 'Perform any item enhancement',
        requirement: { type: 'enhance', count: 1 },
        reward: { gold: 50 }
    },
    {
        id: 'roll_units',
        name: 'Roll 20 Units',
        description: 'Perform 20 gacha pulls',
        requirement: { type: 'gacha_pulls', count: 20 },
        reward: { gold: 70 }
    },
    {
        id: 'three_star',
        name: '3-Star a Mission',
        description: 'Get 3 stars on any mission',
        requirement: { type: 'three_star', count: 1 },
        reward: { gold: 100 }
    },
    {
        id: 'evolve_unit',
        name: 'Evolve a Unit',
        description: 'Evolve any unit in the Evolution Lab',
        requirement: { type: 'evolve', count: 1 },
        reward: { gold: 80 }
    },
    {
        id: 'equip_items',
        name: 'Equip 3 Items',
        description: 'Equip items on 3 different units',
        requirement: { type: 'equip_items', count: 3 },
        reward: { gold: 40 }
    },
    {
        id: 'sell_items',
        name: 'Sell 5 Items',
        description: 'Sell any 5 items',
        requirement: { type: 'sell_items', count: 5 },
        reward: { gold: 40 }
    },
    {
        id: 'defeat_boss',
        name: 'Defeat a Boss',
        description: 'Clear any boss encounter',
        requirement: { type: 'boss_kill', count: 1 },
        reward: { gold: 120 }
    },
    {
        id: 'use_bond',
        name: 'Use a Bond Pair',
        description: 'Deploy 2+ bonded units in a mission',
        requirement: { type: 'bond_deploy', count: 1 },
        reward: { gold: 60 }
    }
];

var DAILY_COMPLETION_BONUS = { gold: 300 }; // Bonus for completing all 4 daily quests (gems converted to gold at 10g/gem: 100g + 200g = 300g)
```

**Daily quest functions**:
```javascript
function generateDailyQuests(saveData) {
    // Generates 4 random quests from pool (no duplicates)
    // Stores in saveData.dailyQuests = { date: 'YYYY-MM-DD', quests: [...], bonusClaimed: false }
    // Each quest: { id, progress: 0, completed: false, rewardClaimed: false }
    var today = new Date().toISOString().split('T')[0];
    if (saveData.dailyQuests && saveData.dailyQuests.date === today) return; // already generated

    var pool = DAILY_QUEST_POOL.slice(); // copy
    var selected = [];
    for (var i = 0; i < 4 && pool.length > 0; i++) {
        var idx = Math.floor(Math.random() * pool.length);
        selected.push({
            id: pool[idx].id,
            progress: 0,
            completed: false,
            rewardClaimed: false
        });
        pool.splice(idx, 1);
    }

    saveData.dailyQuests = {
        date: today,
        quests: selected,
        bonusClaimed: false
    };
}

function getDailyQuestStatus(saveData) {
    // Returns array of quest objects with pool data merged
    if (!saveData.dailyQuests) return [];
    var result = [];
    for (var i = 0; i < saveData.dailyQuests.quests.length; i++) {
        var q = saveData.dailyQuests.quests[i];
        var poolEntry = null;
        for (var j = 0; j < DAILY_QUEST_POOL.length; j++) {
            if (DAILY_QUEST_POOL[j].id === q.id) { poolEntry = DAILY_QUEST_POOL[j]; break; }
        }
        if (poolEntry) {
            result.push({
                id: q.id,
                name: poolEntry.name,
                description: poolEntry.description,
                requirement: poolEntry.requirement,
                reward: poolEntry.reward,
                progress: q.progress,
                target: poolEntry.requirement.count,
                completed: q.completed,
                rewardClaimed: q.rewardClaimed
            });
        }
    }
    return result;
}

function updateDailyQuestProgress(saveData, eventType, amount) {
    // Called by game systems when relevant events happen
    // eventType matches requirement.type
    // amount is how much to increment
    if (!saveData.dailyQuests) return;
    for (var i = 0; i < saveData.dailyQuests.quests.length; i++) {
        var q = saveData.dailyQuests.quests[i];
        if (q.completed) continue;
        var poolEntry = null;
        for (var j = 0; j < DAILY_QUEST_POOL.length; j++) {
            if (DAILY_QUEST_POOL[j].id === q.id) { poolEntry = DAILY_QUEST_POOL[j]; break; }
        }
        if (poolEntry && poolEntry.requirement.type === eventType) {
            q.progress = Math.min(q.progress + (amount || 1), poolEntry.requirement.count);
            if (q.progress >= poolEntry.requirement.count) {
                q.completed = true;
            }
        }
    }
}

function claimDailyQuestReward(saveData, questIndex) {
    // Claims reward for a completed quest
    if (!saveData.dailyQuests) return null;
    var q = saveData.dailyQuests.quests[questIndex];
    if (!q || !q.completed || q.rewardClaimed) return null;

    var poolEntry = null;
    for (var j = 0; j < DAILY_QUEST_POOL.length; j++) {
        if (DAILY_QUEST_POOL[j].id === q.id) { poolEntry = DAILY_QUEST_POOL[j]; break; }
    }
    if (!poolEntry) return null;

    q.rewardClaimed = true;
    saveData.player.gold += poolEntry.reward.gold;
    return poolEntry.reward;
}

function claimDailyCompletionBonus(saveData) {
    // Claims the bonus for finishing all 4 quests
    if (!saveData.dailyQuests || saveData.dailyQuests.bonusClaimed) return null;
    var allComplete = true;
    for (var i = 0; i < saveData.dailyQuests.quests.length; i++) {
        if (!saveData.dailyQuests.quests[i].completed) { allComplete = false; break; }
    }
    if (!allComplete) return null;

    saveData.dailyQuests.bonusClaimed = true;
    saveData.player.gold += DAILY_COMPLETION_BONUS.gold;
    return DAILY_COMPLETION_BONUS;
}

function areDailyQuestsAllComplete(saveData) {
    if (!saveData.dailyQuests) return false;
    for (var i = 0; i < saveData.dailyQuests.quests.length; i++) {
        if (!saveData.dailyQuests.quests[i].completed) return false;
    }
    return true;
}
```

### Chunk 3: Achievement System

Add to `hub.js`:

```javascript
var ACHIEVEMENTS = [
    // Combat
    { id: 'first_blood', category: 'combat', name: 'First Blood', description: 'Win your first mission', check: function(s) { return s.missions.storyProgress >= 1; }, reward: { gold: 50 } },
    { id: 'unscathed', category: 'combat', name: 'Unscathed', description: '3-star any mission', check: function(s) { return hasAnyThreeStar(s); }, reward: { gold: 100 } },
    { id: 'elemental_mastery', category: 'combat', name: 'Elemental Mastery', description: 'Win with a 6-piece element synergy', check: function(s) { return s.stats && s.stats.maxElementSynergy >= 6; }, reward: { gold: 200 } },
    { id: 'boss_slayer', category: 'combat', name: 'Boss Slayer', description: 'Defeat your first boss', check: function(s) { return s.stats && s.stats.bossesDefeated >= 1; }, reward: { gold: 300 } },
    { id: 'deathless', category: 'combat', name: 'Deathless', description: 'Complete any boss with no unit deaths', check: function(s) { return s.stats && s.stats.deathlessBossClears >= 1; }, reward: { gold: 500 } },
    { id: 'overkill', category: 'combat', name: 'Overkill', description: 'Deal 10,000 damage in a single hit', check: function(s) { return s.stats && s.stats.maxSingleHit >= 10000; }, reward: { gold: 200 } },
    { id: 'speed_demon', category: 'combat', name: 'Speed Demon', description: 'Win a mission in under 30 seconds', check: function(s) { return s.stats && s.stats.fastestWin <= 30; }, reward: { gold: 150 } },

    // Collection
    { id: 'collector_1', category: 'collection', name: 'Collector I', description: 'Own 10 unique units', check: function(s) { return countUniqueUnits(s) >= 10; }, reward: { gold: 200 } },
    { id: 'collector_2', category: 'collection', name: 'Collector II', description: 'Own 25 unique units', check: function(s) { return countUniqueUnits(s) >= 25; }, reward: { gold: 500 } },
    { id: 'collector_3', category: 'collection', name: 'Collector III', description: 'Own all 60 base units', check: function(s) { return countUniqueUnits(s) >= 60; }, reward: { gold: 1000 } },
    { id: 'evolution_pioneer', category: 'collection', name: 'Evolution Pioneer', description: 'Evolve your first unit', check: function(s) { return countEvolvedUnits(s) >= 1; }, reward: { gold: 200 } },
    { id: 'evolution_master', category: 'collection', name: 'Evolution Master', description: 'Evolve 10 different units', check: function(s) { return countEvolvedUnits(s) >= 10; }, reward: { gold: 1000 } },
    { id: 'bond_collector', category: 'collection', name: 'Bond Collector', description: 'Activate 5 different bonds in combat', check: function(s) { return s.stats && s.stats.uniqueBondsUsed >= 5; }, reward: { gold: 300 } },

    // Economy
    { id: 'big_spender', category: 'economy', name: 'Big Spender', description: 'Spend 10,000g total', check: function(s) { return s.stats && s.stats.totalGoldSpent >= 10000; }, reward: { gold: 500 } },
    { id: 'master_forger', category: 'economy', name: 'Master Forger', description: 'Perform 100 forge operations', check: function(s) { return s.stats && s.stats.forgeOperations >= 100; }, reward: { gold: 300 } },
    { id: 'enhancement_addict', category: 'economy', name: 'Enhancement Addict', description: 'Enhance items 50 times', check: function(s) { return s.stats && s.stats.enhancementsPerformed >= 50; }, reward: { gold: 200 } },
    { id: 'plus_ten_club', category: 'economy', name: '+10 Club', description: 'Reach +10 on any item', check: function(s) { return s.stats && s.stats.maxEnhanceLevel >= 10; }, reward: { gold: 1000 } },
    { id: 'mythic_wielder', category: 'economy', name: 'Mythic Wielder', description: 'Craft any mythic item', check: function(s) { return s.stats && s.stats.mythicsCrafted >= 1; }, reward: { gold: 500 } },
    { id: 'full_house', category: 'economy', name: 'Full House', description: 'Fill all 3 item slots on 5 units', check: function(s) { return countFullyEquippedUnits(s) >= 5; }, reward: { gold: 200 } },
    { id: 'gem_master', category: 'economy', name: 'Gem Master', description: 'Socket 20 gems into items', check: function(s) { return s.stats && s.stats.gemsSocketed >= 20; }, reward: { gold: 300 } },

    // Progression
    { id: 'level_10', category: 'progression', name: 'Level 10', description: 'Reach player level 10', check: function(s) { return s.player.level >= 10; }, reward: { gold: 300 } },
    { id: 'level_20', category: 'progression', name: 'Level 20', description: 'Reach player level 20', check: function(s) { return s.player.level >= 20; }, reward: { gold: 1000 } },
    { id: 'builder', category: 'progression', name: 'Builder', description: 'Max any building', check: function(s) { return hasMaxedBuilding(s); }, reward: { gold: 500 } },
    { id: 'architect', category: 'progression', name: 'Architect', description: 'Max all buildings', check: function(s) { return hasAllMaxedBuildings(s); }, reward: { gold: 2000 } }
];
```

**Achievement helper functions**:
```javascript
function countUniqueUnits(saveData) {
    var count = 0;
    if (saveData.roster) {
        for (var key in saveData.roster) {
            if (saveData.roster.hasOwnProperty(key) && saveData.roster[key] && saveData.roster[key].owned) count++;
        }
    }
    return count;
}

function countEvolvedUnits(saveData) {
    var count = 0;
    if (saveData.roster) {
        for (var key in saveData.roster) {
            if (key.indexOf('_evo') >= 0 && saveData.roster[key] && saveData.roster[key].owned) count++;
        }
    }
    return count;
}

function countFullyEquippedUnits(saveData) {
    // Count units with all 3 item slots filled
    var count = 0;
    if (saveData.team && saveData.team.slots) {
        for (var i = 0; i < saveData.team.slots.length; i++) {
            var slot = saveData.team.slots[i];
            if (slot && slot.unitKey && slot.items && slot.items.length >= 3) count++;
        }
    }
    return count;
}

function hasAnyThreeStar(saveData) {
    if (saveData.missions && saveData.missions.starRatings) {
        for (var id in saveData.missions.starRatings) {
            if (saveData.missions.starRatings[id] >= 3) return true;
        }
    }
    // Legacy check
    if (saveData.missions && saveData.missions.stars) {
        for (var i = 0; i < saveData.missions.stars.length; i++) {
            if (saveData.missions.stars[i] >= 3) return true;
        }
    }
    return false;
}

function hasMaxedBuilding(saveData) {
    var bkeys = Object.keys(BUILDINGS);
    for (var i = 0; i < bkeys.length; i++) {
        if (getBuildingLevel(saveData, bkeys[i]) >= BUILDINGS[bkeys[i]].maxLevel) return true;
    }
    return false;
}

function hasAllMaxedBuildings(saveData) {
    var bkeys = Object.keys(BUILDINGS);
    for (var i = 0; i < bkeys.length; i++) {
        if (getBuildingLevel(saveData, bkeys[i]) < BUILDINGS[bkeys[i]].maxLevel) return false;
    }
    return true;
}
```

**Achievement checking and claiming**:
```javascript
function checkAchievements(saveData) {
    // Returns array of newly earned achievement IDs
    if (!saveData.achievements) saveData.achievements = { earned: [], claimed: [] };
    var newlyEarned = [];
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
        var ach = ACHIEVEMENTS[i];
        if (saveData.achievements.earned.indexOf(ach.id) >= 0) continue; // already earned
        if (ach.check(saveData)) {
            saveData.achievements.earned.push(ach.id);
            newlyEarned.push(ach.id);
        }
    }
    return newlyEarned;
}

function claimAchievementReward(saveData, achievementId) {
    if (!saveData.achievements) return null;
    if (saveData.achievements.earned.indexOf(achievementId) < 0) return null; // not earned
    if (saveData.achievements.claimed.indexOf(achievementId) >= 0) return null; // already claimed

    var ach = null;
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
        if (ACHIEVEMENTS[i].id === achievementId) { ach = ACHIEVEMENTS[i]; break; }
    }
    if (!ach) return null;

    saveData.achievements.claimed.push(achievementId);
    saveData.player.gold += ach.reward.gold;
    return ach.reward;
}

function getAchievementStatus(saveData) {
    // Returns all achievements with earned/claimed status
    if (!saveData.achievements) saveData.achievements = { earned: [], claimed: [] };
    var result = [];
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
        var ach = ACHIEVEMENTS[i];
        result.push({
            id: ach.id,
            category: ach.category,
            name: ach.name,
            description: ach.description,
            reward: ach.reward,
            earned: saveData.achievements.earned.indexOf(ach.id) >= 0,
            claimed: saveData.achievements.claimed.indexOf(ach.id) >= 0
        });
    }
    return result;
}
```

### Chunk 4: Stats Tracking

Achievements need stats. Add a `stats` tracking object to save data and instrument key game actions.

**Default stats in save data** (add to `createDefaultSaveData()` in `save.js`):
```javascript
stats: {
    totalGoldSpent: 0,
    totalGoldEarned: 0,
    missionsCompleted: 0,
    bossesDefeated: 0,
    deathlessBossClears: 0,
    maxSingleHit: 0,
    fastestWin: 999999,
    maxElementSynergy: 0,
    forgeOperations: 0,
    enhancementsPerformed: 0,
    maxEnhanceLevel: 0,
    mythicsCrafted: 0,
    gemsSocketed: 0,
    uniqueBondsUsed: 0,
    totalGachaPulls: 0
}
```

**Tracking function** (add to `hub.js`):
```javascript
function trackStat(saveData, statName, value, mode) {
    // mode: 'add' (increment), 'max' (keep highest), 'min' (keep lowest), 'set' (overwrite)
    if (!saveData.stats) saveData.stats = {};
    var current = saveData.stats[statName] || 0;
    if (mode === 'add') {
        saveData.stats[statName] = current + value;
    } else if (mode === 'max') {
        saveData.stats[statName] = Math.max(current, value);
    } else if (mode === 'min') {
        if (current === 0) saveData.stats[statName] = value;
        else saveData.stats[statName] = Math.min(current, value);
    } else {
        saveData.stats[statName] = value;
    }
}
```

**Important**: This prompt only DEFINES the stat tracking infrastructure. The actual instrumentation hooks (calling `trackStat` and `updateDailyQuestProgress` from combat, gacha, forge, etc.) will be wired in a follow-up integration prompt. For now, just make sure all functions exist and save data has the right structure.

### Chunk 5: Save Data Migration

In `save.js`, update the save data defaults and add migration logic.

**Add to default save data**:
```javascript
// In createDefaultSaveData():
dailyQuests: null,   // populated on first hub visit
achievements: { earned: [], claimed: [] },
stats: { /* all the stats from Chunk 4 */ }
```

**Add to building defaults**:
```javascript
// In the buildings section of default save:
gem_workshop: 0,
mana_shrine: 0,
bond_hall: 0
```

**Migration** — detect missing fields and add them:
```javascript
// Add after existing migrations:
if (!data.buildings.gem_workshop && data.buildings.gem_workshop !== 0) data.buildings.gem_workshop = 0;
if (!data.buildings.mana_shrine && data.buildings.mana_shrine !== 0) data.buildings.mana_shrine = 0;
if (!data.buildings.bond_hall && data.buildings.bond_hall !== 0) data.buildings.bond_hall = 0;
if (!data.achievements) data.achievements = { earned: [], claimed: [] };
if (!data.stats) data.stats = {};
if (!data.dailyQuests) data.dailyQuests = null;
```

Do NOT bump save version here — prompt 22 may or may not have bumped it already. Just ensure new fields are added gracefully (check existence before setting). This is a safe migration pattern that doesn't depend on version numbers.

### Chunk 6: Verification

1. `node -c js/hub.js` passes
2. `node -c js/save.js` passes
3. All 10 buildings defined in BUILDINGS
4. All 10 daily quests in DAILY_QUEST_POOL
5. All ~25 achievements in ACHIEVEMENTS
6. All achievement check functions work without errors
7. Building prereqs checked correctly
8. Daily quest generation picks 4 unique quests
9. Save migration adds new fields without breaking existing data

Write a verification script:
```bash
node -e "
var fs = require('fs');
eval(fs.readFileSync('js/units.js', 'utf8'));
eval(fs.readFileSync('js/save.js', 'utf8'));
eval(fs.readFileSync('js/hub.js', 'utf8'));
console.log('Buildings:', Object.keys(BUILDINGS).length, Object.keys(BUILDINGS).length >= 10 ? 'OK' : 'FAIL');
console.log('Quest pool:', DAILY_QUEST_POOL.length, DAILY_QUEST_POOL.length >= 10 ? 'OK' : 'FAIL');
console.log('Achievements:', ACHIEVEMENTS.length, ACHIEVEMENTS.length >= 20 ? 'OK' : 'FAIL');
// Test quest generation
var testSave = createDefaultSaveData();
generateDailyQuests(testSave);
console.log('Daily quests generated:', testSave.dailyQuests.quests.length, testSave.dailyQuests.quests.length === 4 ? 'OK' : 'FAIL');
// Test achievement check
var newAch = checkAchievements(testSave);
console.log('Achievement check ran OK');
// Test building bonus getters
var mana = getManaShrineBonuses(testSave);
console.log('Mana Shrine bonuses:', JSON.stringify(mana));
var bond = getBondHallBonuses(testSave);
console.log('Bond Hall bonuses:', JSON.stringify(bond));
var gem = getGemWorkshopCapabilities(testSave);
console.log('Gem Workshop capabilities:', JSON.stringify(gem));
"
```

---

## Critical Notes

- **Do NOT modify `missions.js`, `main-v2.js`, or `ui-v2.js`**. This prompt is buildings/quests/achievements data + logic only.
- **Pattern**: All `var`, NO `let`/`const`, NO arrow functions, NO template literals. Global scope only.
- **Gem rewards → gold**: SCOPE.md says no premium currency. Convert all gem rewards to gold at 10g per gem.
- **No weekly content**: SCOPE.md defers weekly quests, weekly rotation, weekly shop. Only daily quests.
- **No login calendar**: SCOPE.md defers time-gated content. Skip daily login rewards.
- **Stats are infrastructure only**: This prompt defines tracking functions but doesn't wire them into existing game systems. That's a separate integration task.
- `hub.js` is loaded AFTER `units.js` and `save.js`, so it can reference unit data and save functions.

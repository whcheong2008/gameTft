// =============================================================================
// hub.js — Camp screen, building definitions, screen navigation
// =============================================================================

// ---- Screen Management ----

var SCREENS = ['hub', 'gacha', 'roster', 'team-builder', 'mission-select', 'combat', 'heroes'];
var currentScreen = 'hub';

// Prompt 77 (Phase 6.1, Task 1): screen-transition framework hooked centrally
// here -- a 180ms fade/slide-in on whichever screen becomes active. The
// visibility logic itself (inline display:block/none) is unchanged; the only
// addition is toggling the 'active' class (which the CSS already declared but
// never actually used, since the inline style already won the cascade) and
// re-triggering the '.sv-screen-enter' entrance animation via a forced
// reflow. Reduced-motion is handled entirely in CSS (the animation itself is
// wrapped in an `@media (prefers-reduced-motion: no-preference)` block in
// game-v2.html) so this function never needs to branch on it -- also what
// keeps this safe to call headlessly (tests/harness.js's element stub has no
// real layout, so classList.toggle()/offsetWidth are simply harmless no-ops).
function showScreen(screenId) {
    for (var i = 0; i < SCREENS.length; i++) {
        var el = document.getElementById('screen-' + SCREENS[i]);
        if (el) {
            var isTarget = (SCREENS[i] === screenId);
            el.style.display = isTarget ? 'block' : 'none';
            if (el.classList) {
                el.classList.toggle('active', isTarget);
                if (isTarget) {
                    el.classList.remove('sv-screen-enter');
                    // Force a reflow so re-adding the class restarts the CSS
                    // animation even when re-entering the same screen twice in a row.
                    if (typeof el.offsetWidth !== 'undefined') { void el.offsetWidth; }
                    el.classList.add('sv-screen-enter');
                }
            }
        }
    }
    currentScreen = screenId;
    renderCurrentScreen();
    // Prompt 81 (Phase 7): screen-change SFX + camp ambient music. One-line
    // hook -- js/audio.js's AUDIO.onScreenChange() owns the actual logic
    // (and skips 'combat', which gets its region/boss/endless-aware music
    // context from js/ui-combat.js's beginCombatScreen() instead).
    if (typeof AUDIO !== 'undefined' && AUDIO.onScreenChange) AUDIO.onScreenChange(screenId);
}

function renderCurrentScreen() {
    // Each screen has its own render function
    switch (currentScreen) {
        case 'hub': renderHubScreen(); break;
        case 'gacha': renderGachaScreen(); break;
        case 'roster': renderRosterScreen(); break;
        case 'team-builder': renderTeamBuilderScreen(); break;
        case 'mission-select': renderMissionSelectScreen(); break;
        case 'combat': /* combat rendering handled by combat loop */ break;
        case 'heroes': renderHeroScreen(); break;
    }
    // Always update top bar
    renderTopBar();
}

// ---- Building Definitions ----

var BUILDINGS = {
    sustained_bonds: {
        name: 'Sustained Bonds',
        emoji: '🤝',
        description: 'Increases team size capacity',
        maxLevel: 1,
        upgradeCosts: [0, 500],
        effects: [
            'Locked \u2014 unlocked at level 17',
            'Team size +1 (max 8)'
        ],
        prereq: { level: 17 }
    },
    attunement_rite: {
        name: 'Attunement Rite',
        emoji: '🔮',
        description: 'Summon Echoes from the Veil',
        maxLevel: 5,
        upgradeCosts: [0, 80, 200, 400, 800, 1500],
        effects: [
            'Standard rite rates',
            'Multi-rite: 10x for 450 VE (10% discount)',
            'Multi-rite: 10x for 420 VE (16% discount)',
            'Multi-rite: 10x for 400 VE (20% discount)',
            'Pity: guaranteed T3+ every 20 rites',
            'Pity: guaranteed T4+ every 30 rites'
        ]
    },
    essence_reservoir: {
        name: 'Essence Reservoir',
        emoji: '💧',
        description: 'Store and manage harvested Veil Essence',
        maxLevel: 5,
        upgradeCosts: [0, 50, 120, 300, 600, 1000],
        effects: [
            'Standard VE rewards',
            '+5% VE from missions, 12 item slots',
            '+10% VE, 14 item slots',
            '+15% VE, 16 item slots',
            '+20% VE, 18 item slots',
            '+25% VE, 20 item slots'
        ]
    },
    deep_resonance: {
        name: 'Deep Resonance',
        emoji: '🧬',
        description: 'Evolve Echoes into powerful new forms',
        maxLevel: 3,
        upgradeCosts: [0, 300, 800, 2000],
        effects: [
            'Locked \u2014 build to unlock evolution',
            'Can evolve units (500-2000 VE by tier)',
            'Evolution cost reduced by 25%',
            'Evolution cost reduced by 50%'
        ]
    },
    echo_shaping: {
        name: 'Echo Shaping',
        emoji: '🔨',
        description: 'Reshape Veil energy within items',
        maxLevel: 5,
        upgradeCosts: [0, 200, 500, 1000, 2000, 4000],
        effects: [
            'Locked \u2014 build to unlock forging',
            'Reroll: change item rarity (100 VE)',
            'Disassemble: break combined items (50 VE)',
            'Transmute: convert components (200 VE)',
            'Set Crafting: forge set items (500-1000 VE)',
            'Advanced Crafting: ability items + evolved gates (1000-2000 VE)'
        ]
    },
    prism_focus: {
        name: 'Prism Focus',
        emoji: '💎',
        description: 'Craft and socket crystallized Veil gems',
        maxLevel: 5,
        upgradeCosts: [0, 500, 1200, 2500, 5000, 10000],
        effects: [
            'Locked \u2014 unlocks gem operations',
            'Gem inventory + gem socketing',
            'Gem combining (3\u21921) + removal',
            'Gem transmute (change type, keep rarity)',
            'Auto-socket suggestion',
            'Prismatic Forge: combine 3 Epic gems \u2192 Prismatic'
        ],
        prereq: { level: 12 }
    },
    veil_wellspring: {
        name: 'Veil Wellspring',
        emoji: '🔵',
        description: 'Channel ambient Veil power for mana and ability',
        maxLevel: 5,
        upgradeCosts: [0, 800, 2000, 4000, 8000, 15000],
        effects: [
            'Locked \u2014 unlocks mana bonuses',
            '+5 starting mana for all units',
            'Mana generation from attacks +10%',
            'Ability damage +5% (global)',
            'First ability cast costs 10% less mana',
            'Full mana bar grants +10% ATK until cast'
        ],
        prereq: { level: 15 }
    },
    kindred_circle: {
        name: 'Kindred Circle',
        emoji: '👥',
        description: 'Where bonded Echoes train together',
        maxLevel: 5,
        upgradeCosts: [0, 600, 1500, 3500, 7000, 12000],
        effects: [
            'Locked \u2014 unlocks bond viewer',
            'View active bonds and bonuses',
            'Bond bonuses increased by 25%',
            'Unlock bond quests (extra VE)',
            'Bond bonuses increased by 50% total',
            'Unlock trio bonds (3-unit bonds active)'
        ],
        prereq: { level: 10 }
    }
};

// ---- Building Logic ----

function getBuildingLevel(saveData, buildingId) {
    return saveData.buildings[buildingId] || 0;
}

function getBuildingUpgradeCost(buildingId, currentLevel) {
    var bld = BUILDINGS[buildingId];
    if (!bld) return Infinity;
    if (currentLevel >= bld.maxLevel) return Infinity; // Already max
    return bld.upgradeCosts[currentLevel + 1] || Infinity;
}

function canUpgradeBuilding(saveData, buildingId) {
    var level = getBuildingLevel(saveData, buildingId);
    var bld = BUILDINGS[buildingId];
    if (!bld || level >= bld.maxLevel) return false;
    if (bld.prereq) {
        if (bld.prereq.level && saveData.player.level < bld.prereq.level) return false;
    }
    var cost = bld.upgradeCosts[level + 1];
    return saveData.player.veilEssence >= cost;
}

function upgradeBuilding(saveData, buildingId) {
    if (!canUpgradeBuilding(saveData, buildingId)) return false;

    var level = getBuildingLevel(saveData, buildingId);
    var cost = getBuildingUpgradeCost(buildingId, level);

    if (!spendGold(saveData, cost)) return false;

    saveData.buildings[buildingId] = level + 1;
    autoSave(saveData);
    return true;
}

function getBuildingEffect(buildingId, level) {
    var bld = BUILDINGS[buildingId];
    if (!bld) return '';
    return bld.effects[level] || bld.effects[0];
}

// ---- Building Bonus Getters ----

function getXPMultiplier(saveData) {
    // Training Ground removed — always 1.0x
    return 1.0;
}

function getGoldMultiplier(saveData) {
    var level = getBuildingLevel(saveData, 'essence_reservoir');
    return 1.0 + (level * 0.05);
}

// Alias for clarity
function getVeilEssenceMultiplier(saveData) {
    return getGoldMultiplier(saveData);
}

function getMultiRollDiscount(saveData) {
    var level = getBuildingLevel(saveData, 'attunement_rite');
    if (level >= 3) return 100;  // 400 VE instead of 500 VE
    if (level >= 2) return 80;   // 420 VE
    if (level >= 1) return 50;   // 450 VE
    return 0;
}

function getItemBenchSize(saveData) {
    var reservoirLevel = getBuildingLevel(saveData, 'essence_reservoir');
    return 10 + (reservoirLevel * 2); // 10 base + 2 per level, max 20 at level 5
}

function getWarRoomIntelLevel(saveData) {
    // War Room removed — always 0 (no intel)
    return 0;
}

function canEvolve(saveData) {
    return getBuildingLevel(saveData, 'deep_resonance') >= 1;
}

// Evolution VE cost by tier: T1=500, T2=750, T3=1000, T4=1500, T5=2000
var EVOLUTION_VE_COSTS = { 1: 500, 2: 750, 3: 1000, 4: 1500, 5: 2000 };

function getEvolutionGoldCost(saveData, templateKey) {
    var tmpl = UNIT_TEMPLATES[templateKey];
    if (!tmpl) return Infinity;
    var tier = tmpl.cost || 1;
    var baseCost = EVOLUTION_VE_COSTS[tier] || 500;
    var labLevel = getBuildingLevel(saveData, 'deep_resonance');
    if (labLevel >= 3) return Math.floor(baseCost * 0.5);
    if (labLevel >= 2) return Math.floor(baseCost * 0.75);
    return baseCost;
}

function getSustainedBondsBonus(saveData) {
    if (saveData.player.level < 17) return 0;
    var level = getBuildingLevel(saveData, 'sustained_bonds');
    return level >= 1 ? 1 : 0;
}

// ---- New Building Bonus Getters ----

function getManaShrineBonuses(saveData) {
    var level = getBuildingLevel(saveData, 'veil_wellspring');
    return {
        startingMana: level >= 1 ? 5 : 0,
        manaGenMult: level >= 2 ? 1.10 : 1.0,
        abilityDamageMult: level >= 3 ? 1.05 : 1.0,
        firstCastDiscount: level >= 4 ? 0.10 : 0,
        fullManaAtkBonus: level >= 5 ? 0.10 : 0
    };
}

function getBondHallBonuses(saveData) {
    var level = getBuildingLevel(saveData, 'kindred_circle');
    return {
        canViewBonds: level >= 1,
        bondBonusMult: level >= 4 ? 1.50 : (level >= 2 ? 1.25 : 1.0),
        bondHintsUnlocked: level >= 3,
        trioBondsUnlocked: level >= 5
    };
}

function getGemWorkshopCapabilities(saveData) {
    var level = getBuildingLevel(saveData, 'prism_focus');
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

// ---- Daily Quest System (REMOVED — doesn't fit single-player design) ----
// Old dailyQuests data in saves is harmless dead data.

// ---- Achievement System ----

// Achievement helper functions

function countUniqueUnits(saveData) {
    var count = 0;
    if (saveData.collection) {
        for (var key in saveData.collection) {
            if (saveData.collection.hasOwnProperty(key)) count++;
        }
    }
    return count;
}

function countEvolvedUnits(saveData) {
    var count = 0;
    if (saveData.collection) {
        for (var key in saveData.collection) {
            if (key.indexOf('_evo') >= 0 && saveData.collection[key]) count++;
        }
    }
    return count;
}

function countFullyEquippedUnits(saveData) {
    var count = 0;
    if (saveData.teams) {
        for (var t = 0; t < saveData.teams.length; t++) {
            var team = saveData.teams[t];
            if (team && team.slots) {
                for (var i = 0; i < team.slots.length; i++) {
                    var slot = team.slots[i];
                    if (slot && slot.key && slot.items && slot.items.length >= 3) count++;
                }
            }
        }
    }
    return count;
}

function hasAnyThreeStar(saveData) {
    if (saveData.missions && saveData.missions.storyStars) {
        for (var id in saveData.missions.storyStars) {
            if (saveData.missions.storyStars[id] >= 3) return true;
        }
    }
    if (saveData.missions && saveData.missions.grindBest) {
        for (var id2 in saveData.missions.grindBest) {
            if (saveData.missions.grindBest[id2] >= 3) return true;
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

var ACHIEVEMENTS = [
    // Combat
    { id: 'first_blood', category: 'combat', name: 'First Blood', description: 'Win your first mission', check: function(s) { return s.missions.storyProgress >= 1; }, reward: { veilEssence: 50 } },
    { id: 'unscathed', category: 'combat', name: 'Unscathed', description: '3-star any mission', check: function(s) { return hasAnyThreeStar(s); }, reward: { veilEssence: 100 } },
    { id: 'elemental_mastery', category: 'combat', name: 'Elemental Mastery', description: 'Win with a 6-piece element synergy', check: function(s) { return s.stats && s.stats.maxElementSynergy >= 6; }, reward: { veilEssence: 200 } },
    { id: 'boss_slayer', category: 'combat', name: 'Boss Slayer', description: 'Defeat your first boss', check: function(s) { return s.stats && s.stats.bossesDefeated >= 1; }, reward: { veilEssence: 300 } },
    { id: 'deathless', category: 'combat', name: 'Deathless', description: 'Complete any boss with no unit deaths', check: function(s) { return s.stats && s.stats.deathlessBossClears >= 1; }, reward: { veilEssence: 500 } },
    { id: 'overkill', category: 'combat', name: 'Overkill', description: 'Deal 10,000 damage in a single hit', check: function(s) { return s.stats && s.stats.maxSingleHit >= 10000; }, reward: { veilEssence: 200 } },
    { id: 'speed_demon', category: 'combat', name: 'Speed Demon', description: 'Win a mission in under 30 seconds', check: function(s) { return s.stats && s.stats.fastestWin <= 30; }, reward: { veilEssence: 150 } },

    // Collection
    { id: 'collector_1', category: 'collection', name: 'Collector I', description: 'Own 10 unique units', check: function(s) { return countUniqueUnits(s) >= 10; }, reward: { veilEssence: 200 } },
    { id: 'collector_2', category: 'collection', name: 'Collector II', description: 'Own 25 unique units', check: function(s) { return countUniqueUnits(s) >= 25; }, reward: { veilEssence: 500 } },
    { id: 'collector_3', category: 'collection', name: 'Collector III', description: 'Own all 66 base units', check: function(s) { return countUniqueUnits(s) >= 66; }, reward: { veilEssence: 1000 } },
    { id: 'evolution_pioneer', category: 'collection', name: 'Evolution Pioneer', description: 'Evolve your first unit', check: function(s) { return countEvolvedUnits(s) >= 1; }, reward: { veilEssence: 200 } },
    { id: 'evolution_master', category: 'collection', name: 'Evolution Master', description: 'Evolve 10 different units', check: function(s) { return countEvolvedUnits(s) >= 10; }, reward: { veilEssence: 1000 } },
    { id: 'bond_collector', category: 'collection', name: 'Bond Collector', description: 'Activate 5 different bonds in combat', check: function(s) { return s.stats && s.stats.uniqueBondsUsed >= 5; }, reward: { veilEssence: 300 } },

    // Economy
    { id: 'big_spender', category: 'economy', name: 'Big Spender', description: 'Spend 10,000 VE total', check: function(s) { return s.stats && s.stats.totalVeilEssenceSpent >= 10000; }, reward: { veilEssence: 500 } },
    { id: 'master_forger', category: 'economy', name: 'Master Forger', description: 'Perform 100 forge operations', check: function(s) { return s.stats && s.stats.forgeOperations >= 100; }, reward: { veilEssence: 300 } },
    { id: 'enhancement_addict', category: 'economy', name: 'Enhancement Addict', description: 'Enhance items 50 times', check: function(s) { return s.stats && s.stats.enhancementsPerformed >= 50; }, reward: { veilEssence: 200 } },
    { id: 'plus_ten_club', category: 'economy', name: '+10 Club', description: 'Reach +10 on any item', check: function(s) { return s.stats && s.stats.maxEnhanceLevel >= 10; }, reward: { veilEssence: 1000 } },
    { id: 'mythic_wielder', category: 'economy', name: 'Mythic Wielder', description: 'Craft any mythic item', check: function(s) { return s.stats && s.stats.mythicsCrafted >= 1; }, reward: { veilEssence: 500 } },
    { id: 'full_house', category: 'economy', name: 'Full House', description: 'Fill all 3 item slots on 5 units', check: function(s) { return countFullyEquippedUnits(s) >= 5; }, reward: { veilEssence: 200 } },
    { id: 'gem_master', category: 'economy', name: 'Gem Master', description: 'Socket 20 gems into items', check: function(s) { return s.stats && s.stats.gemsSocketed >= 20; }, reward: { veilEssence: 300 } },

    // Progression
    { id: 'level_10', category: 'progression', name: 'Level 10', description: 'Reach player level 10', check: function(s) { return s.player.level >= 10; }, reward: { veilEssence: 300 } },
    { id: 'level_20', category: 'progression', name: 'Level 20', description: 'Reach player level 20', check: function(s) { return s.player.level >= 20; }, reward: { veilEssence: 1000 } },
    { id: 'builder', category: 'progression', name: 'Builder', description: 'Max any building', check: function(s) { return hasMaxedBuilding(s); }, reward: { veilEssence: 500 } },
    { id: 'architect', category: 'progression', name: 'Architect', description: 'Max all buildings', check: function(s) { return hasAllMaxedBuildings(s); }, reward: { veilEssence: 2000 } }
];

function checkAchievements(saveData) {
    if (!saveData.achievements) saveData.achievements = { earned: [], claimed: [] };
    var newlyEarned = [];
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
        var ach = ACHIEVEMENTS[i];
        if (saveData.achievements.earned.indexOf(ach.id) >= 0) continue;
        if (ach.check(saveData)) {
            saveData.achievements.earned.push(ach.id);
            newlyEarned.push(ach.id);
        }
    }
    return newlyEarned;
}

function claimAchievementReward(saveData, achievementId) {
    if (!saveData.achievements) return null;
    if (saveData.achievements.earned.indexOf(achievementId) < 0) return null;
    if (saveData.achievements.claimed.indexOf(achievementId) >= 0) return null;

    var ach = null;
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
        if (ACHIEVEMENTS[i].id === achievementId) { ach = ACHIEVEMENTS[i]; break; }
    }
    if (!ach) return null;

    saveData.achievements.claimed.push(achievementId);
    saveData.player.veilEssence += (ach.reward.veilEssence || 0);
    return ach.reward;
}

function getAchievementStatus(saveData) {
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

// ---- Stats Tracking ----

function trackStat(saveData, statName, value, mode) {
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

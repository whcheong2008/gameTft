// =============================================================================
// units-bonds.js — Unit bond definitions and bond detection
// =============================================================================

var UNIT_BONDS = {
    // --- 6 Elemental Duos (one per element) ---
    fire_duo: {
        name: 'Blazing Partners',
        type: 'duo',
        units: ['flame_warrior', 'pyromancer'],
        bonus: { atkPct: 0.08 },
        description: '+8% ATK for both'
    },
    water_duo: {
        name: 'Frozen Harmony',
        type: 'duo',
        units: ['frost_archer', 'tidal_shaman'],
        bonus: { healPowerPct: 0.08 },
        description: '+8% healing power'
    },
    earth_duo: {
        name: 'Earthen Bond',
        type: 'duo',
        units: ['stone_guard', 'golem'],
        bonus: { hpPct: 0.10 },
        description: '+10% max HP'
    },
    wind_duo: {
        name: 'Gale Force',
        type: 'duo',
        units: ['zephyr_scout', 'wind_duelist'],
        bonus: { atkSpdPct: 0.10 },
        description: '+10% ATK speed'
    },
    lightning_duo: {
        name: 'Thunderstrike',
        type: 'duo',
        units: ['spark_fencer', 'thunder_archer'],
        bonus: { critChance: 0.08 },
        description: '+8% crit chance'
    },
    force_duo: {
        name: 'Ironclad Alliance',
        type: 'duo',
        units: ['gladiator', 'shield_bearer'],
        bonus: { atkPct: 0.06, hpPct: 0.06 },
        description: '+6% ATK and +6% HP'
    },

    // --- 4 Cross-Element Duos ---
    fire_and_ice: {
        name: 'Fire & Ice',
        type: 'duo',
        units: ['flame_warrior', 'frost_archer'],
        bonus: { abilityDmgPct: 0.12 },
        description: '+12% ability damage'
    },
    silent_storm: {
        name: 'Silent Storm',
        type: 'duo',
        units: ['shadow_blade', 'zephyr_scout'],
        bonus: { moveSpdPct: 0.15 },
        description: '+15% move speed'
    },
    immovable_object: {
        name: 'Immovable Object',
        type: 'duo',
        units: ['magma_knight', 'shell_knight'],
        bonus: { drPct: 0.12 },
        description: '+12% DR'
    },
    conductor: {
        name: 'Conductor',
        type: 'duo',
        units: ['shock_mage', 'hydro_mage'],
        bonus: { manaGenPct: 0.15 },
        description: '+15% mana gen'
    },

    // --- 6 Trios (gated behind Bond Hall L5) ---
    elemental_trinity: {
        name: 'Elemental Trinity',
        type: 'trio',
        units: ['phoenix', 'leviathan', 'world_tree'],
        bonus: { allStatsPct: 0.15 },
        description: '+15% all stats'
    },
    arcane_circle: {
        name: 'Arcane Circle',
        type: 'trio',
        units: ['pyromancer', 'monsoon_caller', 'terra_sage'],
        bonus: { abilityDmgPct: 0.20 },
        description: '+20% ability damage'
    },
    shadow_pack: {
        name: 'Shadow Pack',
        type: 'trio',
        units: ['ember_scout', 'reef_stalker', 'zephyr_scout'],
        bonus: { atkPct: 0.12, atkSpdPct: 0.10 },
        description: '+12% ATK, +10% ATK speed'
    },
    iron_wall: {
        name: 'Iron Wall',
        type: 'trio',
        units: ['magma_knight', 'golem', 'tesla_knight'],
        bonus: { hpPct: 0.15, drPct: 0.08 },
        description: '+15% HP, +8% DR'
    },
    healing_light: {
        name: 'Healing Light',
        type: 'trio',
        units: ['fire_acolyte', 'coral_priest', 'gale_dancer'],
        bonus: { healPowerPct: 0.25 },
        description: '+25% healing power'
    },
    legendary_convergence: {
        name: 'Legendary Convergence',
        type: 'trio',
        units: ['storm_dragon', 'void_wyrm', 'titan_lord'],
        bonus: { allStatsPct: 0.10, archetypeCountBonus: 1 },
        description: '+10% all stats, primary archetype +1 count'
    },

    // --- New T4 Bonds ---
    deep_and_shallow: {
        name: 'Deep & Shallow',
        type: 'duo',
        units: ['abyssal_guardian', 'tide_hunter'],
        bonus: { hpPct: 0.12 },
        description: '+12% HP. When Abyssal Guardian\'s Tidal Fortress activates, Tide Hunter gains +20% ATK for the duration.'
    },
    fire_and_ash: {
        name: 'Fire and Ash',
        type: 'duo',
        units: ['fire_dragon', 'ashen_watcher'],
        bonus: {},
        description: 'Fire Dragon\'s Dragonfire Aura heals allies for 5% of aura damage dealt. Ashen Watcher\'s heals on Burning allies are +20% stronger.'
    },
    eye_of_the_storm: {
        name: 'Eye of the Storm',
        type: 'trio',
        units: ['tempest_weaver', 'monsoon_caller', 'storm_sovereign'],
        bonus: { abilityDmgPct: 0.08 },
        description: 'Vortices and Monsoon zones merge: shared zones deal combined damage and grant combined buffs. All Wind allies gain +8% ability damage.'
    }
};

// Detect which bonds are active for a deployed team
// team: array of unit keys (base form keys)
// saveData: for checking Bond Hall level
// Returns array of active bond objects with applied bonuses
function detectActiveBonds(teamKeys, saveData) {
    var activeBonds = [];

    // Prompt 62: the Bond Hall building was renamed bond_hall -> kindred_circle
    // (see save.js:599's migration alias); saveData.buildings.bond_hall no
    // longer exists on migrated saves, so reading it here always produced 0 --
    // trioBondsUnlocked was permanently false and bondBonusMult was always 1.0x
    // regardless of the player's actual Bond Hall level. Delegate to
    // getBondHallBonuses() (hub.js), the single already-canonical source for
    // Bond Hall gating (used by the Bond Hall UI panel and now by combat --
    // see combat-core.js Task 3), instead of re-deriving a second, inconsistent
    // formula from a stale key.
    var bondBonusMult = 1.0;
    var trioBondsUnlocked = false;
    if (saveData && typeof getBondHallBonuses === 'function') {
        var bondHallInfo = getBondHallBonuses(saveData);
        bondBonusMult = bondHallInfo.bondBonusMult;
        trioBondsUnlocked = bondHallInfo.trioBondsUnlocked;
    } else if (saveData && saveData.buildings) {
        // Fallback for isolated contexts where hub.js hasn't loaded (shouldn't
        // happen in-game; kept defensive). Mirrors getBondHallBonuses' formula.
        var kcLevel = saveData.buildings.kindred_circle || 0;
        bondBonusMult = kcLevel >= 4 ? 1.50 : (kcLevel >= 2 ? 1.25 : 1.0);
        trioBondsUnlocked = kcLevel >= 5;
    }

    // Resolve base keys for evolved units
    var resolvedKeys = [];
    for (var i = 0; i < teamKeys.length; i++) {
        var key = teamKeys[i];
        // If it's an evolved key, find the base key
        var tmpl = EVOLVED_TEMPLATES[key];
        if (tmpl && tmpl.baseKey) {
            resolvedKeys.push(tmpl.baseKey);
        } else {
            resolvedKeys.push(key);
        }
    }

    var bondKeys = Object.keys(UNIT_BONDS);
    for (var b = 0; b < bondKeys.length; b++) {
        var bondId = bondKeys[b];
        var bond = UNIT_BONDS[bondId];

        // Skip trios if not unlocked
        if (bond.type === 'trio' && !trioBondsUnlocked) continue;

        // Check if all required units are deployed
        var allPresent = true;
        for (var u = 0; u < bond.units.length; u++) {
            if (resolvedKeys.indexOf(bond.units[u]) === -1) {
                allPresent = false;
                break;
            }
        }

        if (allPresent) {
            // Scale bonuses by bond hall multiplier
            var scaledBonus = {};
            var bonusKeys = Object.keys(bond.bonus);
            for (var bk = 0; bk < bonusKeys.length; bk++) {
                var key = bonusKeys[bk];
                if (key === 'archetypeCountBonus') {
                    scaledBonus[key] = bond.bonus[key]; // don't scale count bonuses
                } else {
                    scaledBonus[key] = bond.bonus[key] * bondBonusMult;
                }
            }

            activeBonds.push({
                id: bondId,
                name: bond.name,
                type: bond.type,
                units: bond.units,
                bonus: scaledBonus,
                description: bond.description
            });
        }
    }

    return activeBonds;
}

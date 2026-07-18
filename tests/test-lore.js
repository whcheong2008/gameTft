// =============================================================================
// tests/test-lore.js — Lore Codex data completeness + unlock rules (Prompt 63).
// Covers: every region/stage/base-unit/hero/bond has an entry (ids aligned with
// STAGES/UNIT_TEMPLATES/HERO_DATA/UNIT_BONDS), fresh-save unlock state, unlock
// triggers (stage clear -> region+stage, obtain -> unit, hero unlock -> hero,
// bond trigger -> bond, read-only w.r.t. bondsUsedSeen), and headless codex render.
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

module.exports = [
    // ---- Data completeness ----
    {
        name: 'WORLD_LORE has 2-4 entries',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const world = h.context.WORLD_LORE;
            assert.ok(Array.isArray(world), 'WORLD_LORE should be an array');
            assert.ok(world.length >= 2 && world.length <= 4, 'WORLD_LORE should have 2-4 entries, got ' + world.length);
            for (let i = 0; i < world.length; i++) {
                assert.ok(world[i].title && world[i].text, 'world entry #' + i + ' should have title and text');
            }
        }
    },
    {
        name: 'REGION_LORE has an entry for every region 1-8',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            for (let r = 1; r <= 8; r++) {
                const entry = h.context.REGION_LORE[r];
                assert.ok(entry, 'missing REGION_LORE entry for region ' + r);
                assert.ok(entry.title && entry.text, 'region ' + r + ' lore should have title and text');
            }
        }
    },
    {
        name: 'STAGE_LORE has an entry for every STAGES id, and no stray ids',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const stageIds = h.context.STAGES.map(function(s) { return s.id; });
            assert.equal(stageIds.length, 74, 'expected 74 stages in STAGES');

            const missing = stageIds.filter(function(id) {
                return !h.context.STAGE_LORE[id] || typeof h.context.STAGE_LORE[id] !== 'string' || h.context.STAGE_LORE[id].length === 0;
            });
            assert.deepEqual(missing, [], 'every STAGES id should have a non-empty STAGE_LORE entry');

            const loreKeys = Object.keys(h.context.STAGE_LORE);
            const stray = loreKeys.filter(function(k) { return stageIds.indexOf(k) === -1; });
            assert.deepEqual(stray, [], 'STAGE_LORE should not contain keys absent from STAGES (stale/typo ids)');
        }
    },
    {
        name: 'UNIT_LORE has an entry for every base UNIT_TEMPLATES key, and no stray keys',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const unitKeys = Object.keys(h.context.UNIT_TEMPLATES);
            assert.equal(unitKeys.length, 66, 'expected 66 base unit templates');

            const missing = unitKeys.filter(function(k) {
                return !h.context.UNIT_LORE[k] || typeof h.context.UNIT_LORE[k] !== 'string' || h.context.UNIT_LORE[k].length === 0;
            });
            assert.deepEqual(missing, [], 'every base unit should have a non-empty UNIT_LORE entry');

            const loreKeys = Object.keys(h.context.UNIT_LORE);
            const stray = loreKeys.filter(function(k) { return unitKeys.indexOf(k) === -1; });
            assert.deepEqual(stray, [], 'UNIT_LORE should not contain keys absent from UNIT_TEMPLATES (stale/typo ids, e.g. evolved forms)');
        }
    },
    {
        name: 'HERO_LORE has an entry for every HERO_DATA key',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const heroKeys = Object.keys(h.context.HERO_DATA);
            assert.equal(heroKeys.length, 6, 'expected 6 heroes');
            for (let i = 0; i < heroKeys.length; i++) {
                const k = heroKeys[i];
                assert.ok(h.context.HERO_LORE[k], 'missing HERO_LORE entry for ' + k);
            }
        }
    },
    {
        name: 'BOND_LORE has an entry for every UNIT_BONDS key, and no stray keys',
        fn: function() {
            const h = createHarness({ seed: 1 });
            h.loadScripts();
            const bondKeys = Object.keys(h.context.UNIT_BONDS);
            assert.ok(bondKeys.length >= 15, 'expected a substantial number of bonds, got ' + bondKeys.length);

            const missing = bondKeys.filter(function(k) {
                return !h.context.BOND_LORE[k] || typeof h.context.BOND_LORE[k] !== 'string' || h.context.BOND_LORE[k].length === 0;
            });
            assert.deepEqual(missing, [], 'every bond should have a non-empty BOND_LORE entry');

            const loreKeys = Object.keys(h.context.BOND_LORE);
            const stray = loreKeys.filter(function(k) { return bondKeys.indexOf(k) === -1; });
            assert.deepEqual(stray, [], 'BOND_LORE should not contain keys absent from UNIT_BONDS (stale/typo ids)');
        }
    },

    // ---- Unlock rules ----
    {
        name: 'fresh save: regions/stages/units/bonds all locked; only Kael+Lyric unlocked among heroes',
        fn: function() {
            const h = createHarness({ seed: 2 });
            const sd = h.freshSave();
            const lu = h.context.syncLoreUnlocks(sd);

            assert.deepEqual(Object.keys(lu.regions), [], 'no region should be unlocked on a fresh save');
            assert.deepEqual(Object.keys(lu.stages), [], 'no stage narration should be unlocked on a fresh save');
            assert.deepEqual(Object.keys(lu.bonds), [], 'no bond story should be unlocked on a fresh save');

            // Starter collection units ARE obtained on a fresh save, so their lore cards
            // should already be unlocked (10 starter units per createDefaultSaveData()).
            assert.equal(Object.keys(lu.units).length, Object.keys(sd.collection).length, 'unlocked units should mirror the starting collection');

            assert.equal(lu.heroes.kael, true, 'Kael should be unlocked from the start');
            assert.equal(lu.heroes.lyric, true, 'Lyric should be unlocked from the start');
            assert.ok(!lu.heroes.ren, 'Ren should be locked on a fresh save');
            assert.ok(!lu.heroes.sera, 'Sera should be locked on a fresh save');
            assert.ok(!lu.heroes.maren, 'Maren should be locked on a fresh save');
            assert.ok(!lu.heroes.voss, 'Voss should be locked on a fresh save');
        }
    },
    {
        name: 'clearing a stage unlocks its narration and its region entry',
        fn: function() {
            const h = createHarness({ seed: 3 });
            const sd = h.freshSave();

            sd.missions.stageProgress['r3_s2'] = { completed: true, bestStars: 2, clearedAt: Date.now() };
            const lu = h.context.syncLoreUnlocks(sd);

            assert.equal(lu.stages.r3_s2, true, 'r3_s2 narration should unlock once cleared');
            assert.equal(lu.regions['3'], true, 'region 3 codex entry should unlock on its first stage clear');
            assert.ok(!lu.regions['4'], 'unrelated region should remain locked');
        }
    },
    {
        name: 'obtaining a unit unlocks its lore card (evolved-key resolves to its base key)',
        fn: function() {
            const h = createHarness({ seed: 4 });
            const sd = h.freshSave();

            h.context.addUnitToCollection(sd, 'grove_warden');
            let lu = h.context.syncLoreUnlocks(sd);
            assert.equal(lu.units.grove_warden, true, 'grove_warden lore card should unlock once obtained');
            assert.ok(!lu.units.storm_dragon, 'unrelated unit should remain locked');

            // Simulate owning only the evolved form (worldroot_sentinel evolves from grove_warden).
            delete sd.collection.grove_warden;
            sd.collection.worldroot_sentinel = { stars: 3, copiesForNext: 0 };
            lu = h.context.syncLoreUnlocks(sd);
            assert.equal(lu.units.grove_warden, true, 'owning the evolved form should still unlock the base unit\'s lore card');
        }
    },
    {
        name: 'hero unlock (_unlocked flag) is reflected in loreUnlocks.heroes',
        fn: function() {
            const h = createHarness({ seed: 5 });
            const sd = h.freshSave();
            assert.ok(!h.context.syncLoreUnlocks(sd).heroes.ren, 'Ren starts locked');

            delete sd.heroes.data.ren._unlocked; // matches checkHeroUnlocks()'s own unlock pattern
            const lu = h.context.syncLoreUnlocks(sd);
            assert.equal(lu.heroes.ren, true, 'Ren should unlock once _unlocked is no longer false');
        }
    },
    {
        name: 'bond story unlocks by reading stats.bondsUsedSeen, and never writes to it',
        fn: function() {
            const h = createHarness({ seed: 6 });
            const sd = h.freshSave();
            sd.stats.bondsUsedSeen = ['fire_duo'];
            const before = sd.stats.bondsUsedSeen.slice();

            const lu = h.context.syncLoreUnlocks(sd);
            assert.equal(lu.bonds.fire_duo, true, 'fire_duo bond story should unlock once seen');
            assert.ok(!lu.bonds.water_duo, 'unrelated bond should remain locked');
            assert.deepEqual(sd.stats.bondsUsedSeen, before, 'syncLoreUnlocks must not mutate stats.bondsUsedSeen');
        }
    },
    {
        name: 'save migration backfills loreUnlocks on an old save missing the field',
        fn: function() {
            const h = createHarness({ seed: 7 });
            h.loadScripts();
            // migrateSave()'s loreUnlocks backfill runs unconditionally (not gated behind a
            // version check), so it's safe to call directly on an otherwise-current save
            // with the field stripped — no need to fake an ancient version number here.
            const legacy = h.context.createDefaultSaveData();
            delete legacy.loreUnlocks;

            const migrated = h.context.migrateSave(legacy);
            assert.ok(migrated.loreUnlocks, 'migrateSave should backfill loreUnlocks');
            assert.ok(migrated.loreUnlocks.regions && migrated.loreUnlocks.stages &&
                migrated.loreUnlocks.units && migrated.loreUnlocks.heroes && migrated.loreUnlocks.bonds,
                'backfilled loreUnlocks should have all 5 sub-buckets');
        }
    },

    // ---- Rendering ----
    {
        name: 'Lore Codex renders headlessly with no crash, across every tab, locked and unlocked',
        fn: function() {
            const h = createHarness({ seed: 8 });
            const sd = h.freshSave();

            assert.doesNotThrow(function() { h.context.showLoreCodex(); }, 'showLoreCodex() should not throw on a fresh (mostly-locked) save');

            const tabs = ['world', 'regions', 'units', 'heroes', 'bonds'];
            for (let i = 0; i < tabs.length; i++) {
                assert.doesNotThrow(function() {
                    h.context.renderLoreCodexTabBody(tabs[i], sd);
                }, 'tab "' + tabs[i] + '" should render without throwing on a locked save');
            }

            // Unlock everything and render again — silhouette branch AND full-content branch both exercised.
            for (let r = 1; r <= 8; r++) sd.loreUnlocks.regions[r] = true;
            const stageIds = h.context.STAGES.map(function(s) { return s.id; });
            for (let i = 0; i < stageIds.length; i++) sd.loreUnlocks.stages[stageIds[i]] = true;
            const unitKeys = Object.keys(h.context.UNIT_TEMPLATES);
            for (let i = 0; i < unitKeys.length; i++) sd.loreUnlocks.units[unitKeys[i]] = true;
            const heroKeys = Object.keys(h.context.HERO_DATA);
            for (let i = 0; i < heroKeys.length; i++) sd.loreUnlocks.heroes[heroKeys[i]] = true;
            const bondKeys = Object.keys(h.context.UNIT_BONDS);
            for (let i = 0; i < bondKeys.length; i++) sd.loreUnlocks.bonds[bondKeys[i]] = true;

            for (let i = 0; i < tabs.length; i++) {
                assert.doesNotThrow(function() {
                    h.context.renderLoreCodexTabBody(tabs[i], sd);
                }, 'tab "' + tabs[i] + '" should render without throwing on a fully-unlocked save');
            }
        }
    },
    {
        name: 'Stage list screen renders the stage narration flavor block without throwing',
        fn: function() {
            const h = createHarness({ seed: 9 });
            const sd = h.freshSave();
            sd.missions.stageProgress['r1_s1'] = { completed: true, bestStars: 1, clearedAt: Date.now() };

            h.context.selectedRegion = 1;
            h.context.missionScreenMode = 'stages';
            assert.doesNotThrow(function() { h.context.renderStageListScreen(); }, 'stage list should render with a mix of locked/unlocked narration');
        }
    }
];

// =============================================================================
// tests/test-save-export-import.js — save export/import (Prompt 82, Phase 8.3).
//
// The full click-a-file-input round trip needs a real browser (FileReader,
// Blob/URL download) -- verified by hand (see the Prompt 82 report). What's
// covered headlessly: uiExportSave()'s no-DOM fallback returns the exact live
// save as JSON (tests/harness.js's sandbox has no Blob/URL, so this exercises
// the same "environment doesn't support it" branch a real download would
// skip), and that the exported payload survives a full
// migrateSave()/validateSaveData() round trip unchanged -- the same pipeline
// uiImportSaveFile() itself calls.
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

module.exports = [
    {
        name: 'save export: uiExportSave() returns the live save as valid JSON (no-DOM fallback)',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.player.veilEssence = 12345;
            sd.collection.frost_archer = { stars: 3, copiesForNext: 2 };

            const payload = h.context.uiExportSave();
            assert.ok(typeof payload === 'string' && payload.length > 0, 'export should return a non-empty JSON string');

            let parsed;
            assert.doesNotThrow(function() { parsed = JSON.parse(payload); }, 'exported payload should be valid JSON');
            assert.equal(parsed.player.veilEssence, 12345, 'exported payload should reflect live save state');
            assert.equal(parsed.collection.frost_archer.stars, 3, 'exported payload should include collection edits');
            assert.equal(parsed.version, h.context.SAVE_VERSION, 'exported payload should carry the current save version');
        }
    },
    {
        name: 'save import round trip: an exported payload survives migrateSave()/validateSaveData() unchanged (the exact path uiImportSaveFile() uses)',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.player.level = 7;
            sd.player.veilEssence = 999;
            sd.collection.tide_hunter = { stars: 2, copiesForNext: 1 };
            sd.missions.storyProgress = 3;

            const payload = h.context.uiExportSave();
            const parsed = JSON.parse(payload);

            let migrated, validated;
            assert.doesNotThrow(function() { migrated = h.context.migrateSave(parsed); }, 'migrateSave should not throw on a freshly-exported save');
            assert.doesNotThrow(function() { validated = h.context.validateSaveData(migrated); }, 'validateSaveData should not throw on a freshly-exported save');

            assert.equal(validated.player.level, 7, 'player level should survive the round trip');
            assert.equal(validated.player.veilEssence, 999, 'veilEssence should survive the round trip');
            assert.equal(validated.collection.tide_hunter.stars, 2, 'collection edits should survive the round trip');
            assert.equal(validated.missions.storyProgress, 3, 'mission progress should survive the round trip');
            assert.equal(validated.version, h.context.SAVE_VERSION, 'round-tripped save should stay at the current version');
        }
    },
    {
        name: 'save import: importing a save that already completed onboarding does not resurrect the tutorial',
        fn: function() {
            const h = createHarness({ seed: 1 });
            const sd = h.freshSave();
            sd.onboarding.completed = true;
            const payload = h.context.uiExportSave();
            const parsed = JSON.parse(payload);
            const validated = h.context.validateSaveData(h.context.migrateSave(parsed));
            assert.equal(validated.onboarding.completed, true, 'a completed onboarding flag should survive export/import');
        }
    }
];

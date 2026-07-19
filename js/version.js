// =============================================================================
// version.js -- game version + build stamp (Prompt 82, Phase 8.3).
//
// GAME_VERSION is the human-facing semantic version, bumped by hand at each
// milestone tag (see MASTERPLAN.md's "Done when" tags). GAME_BUILD is a
// `git describe --tags --always --dirty` string baked in by running
// `node scripts/stamp-version.js` by hand before a deploy -- there is no
// build system (CLAUDE.md's "no build tools" rule), so this file is checked
// in with whatever GAME_BUILD the last manual stamp run produced. Read by
// js/ui-hub.js's renderHubSettingsVersion() (settings drawer) and by
// js/service-worker.js (cache-name versioning).
// =============================================================================

var GAME_VERSION = '0.14.0';
var GAME_BUILD = 'v1.0.0';

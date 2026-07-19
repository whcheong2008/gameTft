#!/usr/bin/env node
// =============================================================================
// scripts/stamp-version.js -- manual version-stamp helper (Prompt 82, Phase 8.3).
//
// NOT part of any build/CI pipeline (this project has no build system, per
// CLAUDE.md's "no build tools" rule) -- run by hand, once, right before a
// deploy: `node scripts/stamp-version.js`. Rewrites js/version.js's
// GAME_BUILD constant to the current `git describe --tags --always --dirty`
// output so the settings-drawer version display and the service worker's
// cache-name both reflect the exact commit that was deployed.
//
// Zero npm dependencies: Node built-ins only (fs, path, child_process).
// =============================================================================

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const VERSION_FILE = path.join(ROOT, 'js', 'version.js');

function getGitDescribe() {
    try {
        return execSync('git describe --tags --always --dirty', { cwd: ROOT, encoding: 'utf8' }).trim();
    } catch (e) {
        console.error('stamp-version.js: `git describe` failed (' + e.message + ') -- is this a git checkout?');
        process.exit(1);
    }
}

function main() {
    const build = getGitDescribe();
    let src = fs.readFileSync(VERSION_FILE, 'utf8');

    if (!/var GAME_BUILD = /.test(src)) {
        console.error('stamp-version.js: could not find "var GAME_BUILD = ..." in ' + VERSION_FILE);
        process.exit(1);
    }

    const updated = src.replace(
        /var GAME_BUILD = '[^']*';/,
        "var GAME_BUILD = '" + build.replace(/'/g, "\\'") + "';"
    );

    if (updated === src) {
        console.log('stamp-version.js: GAME_BUILD already up to date (' + build + ')');
        return;
    }

    fs.writeFileSync(VERSION_FILE, updated, 'utf8');
    console.log('stamp-version.js: GAME_BUILD -> ' + build + ' (' + VERSION_FILE + ')');
}

main();

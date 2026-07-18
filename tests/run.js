#!/usr/bin/env node
// =============================================================================
// tests/run.js — headless test runner. Zero npm dependencies.
//
// Discovers tests/test-*.js, each exporting an array of { name, fn } cases.
// A case that throws assert.KnownBugError is reported loudly as a KNOWN_BUG
// (a real game bug the test caught, deliberately not fixed here) rather than
// counted as a failure. Any other thrown error is a real test failure and
// makes the run exit non-zero.
//
// Usage: node tests/run.js [seed]
// =============================================================================

'use strict';

const fs = require('fs');
const path = require('path');
const assertMod = require('./assert');

const TESTS_DIR = __dirname;

function main() {
    const start = Date.now();

    const files = fs.readdirSync(TESTS_DIR)
        .filter(function(f) { return /^test-.*\.js$/.test(f); })
        .sort();

    if (files.length === 0) {
        console.error('No test-*.js files found in ' + TESTS_DIR);
        process.exit(1);
    }

    let totalPass = 0, totalFail = 0, totalKnown = 0;
    const failures = [];
    const knownBugs = [];
    const fileSummaries = [];

    for (let fi = 0; fi < files.length; fi++) {
        const file = files[fi];
        const full = path.join(TESTS_DIR, file);
        let cases;
        try {
            delete require.cache[require.resolve(full)];
            cases = require(full);
        } catch (e) {
            totalFail++;
            failures.push({ file: file, name: '(module load)', error: e });
            fileSummaries.push({ file: file, pass: 0, fail: 1, known: 0 });
            continue;
        }

        if (!Array.isArray(cases)) {
            totalFail++;
            failures.push({ file: file, name: '(module load)', error: new Error('module did not export an array of test cases') });
            fileSummaries.push({ file: file, pass: 0, fail: 1, known: 0 });
            continue;
        }

        let filePass = 0, fileFail = 0, fileKnown = 0;
        for (let ci = 0; ci < cases.length; ci++) {
            const c = cases[ci];
            const name = (c && c.name) || ('case #' + ci);
            try {
                if (!c || typeof c.fn !== 'function') {
                    throw new Error('test case missing fn()');
                }
                c.fn();
                filePass++; totalPass++;
            } catch (e) {
                if (e && e.name === 'KnownBugError') {
                    fileKnown++; totalKnown++;
                    knownBugs.push({ file: file, name: name, reason: e.message });
                } else {
                    fileFail++; totalFail++;
                    failures.push({ file: file, name: name, error: e });
                }
            }
        }

        fileSummaries.push({ file: file, pass: filePass, fail: fileFail, known: fileKnown });
    }

    console.log('');
    console.log('=== Test Suite Results ===');
    for (let i = 0; i < fileSummaries.length; i++) {
        const s = fileSummaries[i];
        const flag = s.fail > 0 ? ' ✗' : (s.known > 0 ? ' ⚠' : ' ✓');
        console.log(
            '  ' + s.file + ': ' + s.pass + ' passed, ' + s.fail + ' failed, ' + s.known + ' known-bug' + flag
        );
    }

    if (failures.length > 0) {
        console.log('');
        console.log('=== FAILURES (' + failures.length + ') ===');
        for (let i = 0; i < failures.length; i++) {
            const f = failures[i];
            console.log('  [' + f.file + '] ' + f.name);
            console.log('    ' + (f.error && f.error.message ? f.error.message : f.error));
            if (f.error && f.error.stack && process.env.TEST_VERBOSE) {
                console.log('    ' + f.error.stack.split('\n').slice(1, 4).join('\n    '));
            }
        }
    }

    if (knownBugs.length > 0) {
        console.log('');
        console.log('=== KNOWN_BUG (' + knownBugs.length + ') — flagged, not fixed, see worker report ===');
        for (let i = 0; i < knownBugs.length; i++) {
            const k = knownBugs[i];
            console.log('  ⚠ [' + k.file + '] ' + k.name + ': ' + k.reason);
        }
    }

    const elapsed = Date.now() - start;
    console.log('');
    console.log(
        'Total: ' + totalPass + ' passed, ' + totalFail + ' failed, ' + totalKnown + ' known-bug' +
        ' (' + (totalPass + totalFail + totalKnown) + ' cases) in ' + elapsed + 'ms'
    );

    process.exit(totalFail > 0 ? 1 : 0);
}

main();

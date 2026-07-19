#!/usr/bin/env node
// =============================================================================
// tests/perf-profile.js — headless performance profiler (Prompt 82, Phase 8.1).
//
// NOT part of `node tests/run.js` (a reporting tool, like tests/balance-sim.js,
// not a pass/fail assertion suite). Run directly: `node tests/perf-profile.js`
//
// Profiles the hot paths that ARE reachable headlessly (script boot cost, the
// pure combat-tick loop via tests/harness.js's runCombat()) and reports
// process.memoryUsage() heap growth across repeated missions to catch logic-
// side leaks (detached objects held by a stale reference, growing arrays,
// etc.) — as opposed to the render-side leak concerns (Pixi textures/
// Graphics/Text objects, WebGL contexts) which are browser-only and were
// verified by hand instead (see the Prompt 82 report).
//
// What this CANNOT measure (documented, not silently skipped):
//   - actual frame rate / GPU draw calls (no WebGL/Canvas in Node)
//   - real network load time (no browser cache/connection model in Node)
//   - Pixi object allocation (js/vendor/pixi.min.js is never loaded headlessly
//     — see tests/harness.js's getScriptLoadOrder())
// =============================================================================

'use strict';

const { createHarness } = require('./harness');

function fmtMs(ms) { return ms.toFixed(2) + 'ms'; }
function fmtMB(bytes) { return (bytes / (1024 * 1024)).toFixed(2) + 'MB'; }

// ---- a small reference team (mirrors tests/test-combat-golden.js's mixed5) ----
const REFERENCE_TEAM_3STAR = [
    { key: 'flame_warrior', row: 0, col: 0, stars: 3 },
    { key: 'stone_guard', row: 0, col: 2, stars: 3 },
    { key: 'frost_archer', row: 0, col: 4, stars: 3 },
    { key: 'pulse_mender', row: 0, col: 6, stars: 3 },
    { key: 'wind_squire', row: 0, col: 3, stars: 3 }
];
const REFERENCE_TEAM_DUO = [
    { key: 'flame_warrior', row: 0, col: 2 },
    { key: 'stone_guard', row: 0, col: 4 }
];

// A representative spread across the campaign: an easy early stage, a mid
// stage, and 2 boss fights (bosses are the most mechanically expensive
// combats — phase transitions, telegraphs, enrage checks every tick).
const PROFILE_STAGES = [
    { id: 'r1_s1', team: REFERENCE_TEAM_DUO, seed: 101 },
    { id: 'r2_s5', team: REFERENCE_TEAM_3STAR, seed: 202 },
    { id: 'r1_boss', team: REFERENCE_TEAM_3STAR, seed: 303 },
    { id: 'r4_boss', team: REFERENCE_TEAM_3STAR, seed: 404 }
];

function stageIndexById(h, id) {
    const idx = h.context.STAGES.findIndex(function(s) { return s.id === id; });
    if (idx < 0) throw new Error('stage id not found: ' + id);
    return idx;
}

function section(title) {
    console.log('\n=== ' + title + ' ===');
}

// ---- 1. Script boot cost (proxy for "everything that must run before the
// hub can render its first frame" — the same file list game-v2.html loads) ----
function profileScriptBoot() {
    section('Script boot (headless eval of the full script load order)');
    const runs = 5;
    const times = [];
    for (let i = 0; i < runs; i++) {
        const t0 = process.hrtime.bigint();
        const h = createHarness({ seed: 1 });
        h.loadScripts();
        const t1 = process.hrtime.bigint();
        times.push(Number(t1 - t0) / 1e6);
    }
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    console.log('  runs: ' + times.map(fmtMs).join(', '));
    console.log('  avg loadScripts(): ' + fmtMs(avg));
}

// ---- 2. Combat hot-path timing: ms per combatTick() call across a spread
// of representative stages (early/mid/boss). ----
function profileCombatHotPath() {
    section('Combat hot path (ms/tick across representative stages)');
    for (const stage of PROFILE_STAGES) {
        const h = createHarness({ seed: stage.seed });
        h.loadScripts();
        const stageIndex = stageIndexById(h, stage.id);
        const t0 = process.hrtime.bigint();
        const result = h.runCombat(stage.team, stageIndex);
        const t1 = process.hrtime.bigint();
        const totalMs = Number(t1 - t0) / 1e6;
        const perTick = result.ticks > 0 ? totalMs / result.ticks : 0;
        console.log(
            '  ' + stage.id.padEnd(10) + ' result=' + result.result.padEnd(5) +
            ' ticks=' + String(result.ticks).padStart(5) +
            ' total=' + fmtMs(totalMs).padStart(9) +
            ' avg/tick=' + fmtMs(perTick)
        );
    }
}

// ---- 3. Memory: run 20 missions, report heap growth. Node's GC is
// non-deterministic without --expose-gc, so this reports both raw growth
// (worst case, includes anything not yet collected) and, when run with
// `node --expose-gc tests/perf-profile.js`, a forced-GC number (the real
// signal for an actual leak vs. just uncollected garbage). ----
function profileMemory() {
    section('Memory: 20 missions (heap growth)');
    const hasGc = typeof global.gc === 'function';
    if (!hasGc) {
        console.log('  (run with `node --expose-gc tests/perf-profile.js` for a forced-GC delta; reporting raw heapUsed deltas below)');
    }

    const MISSION_COUNT = 20;
    const stage = PROFILE_STAGES[1]; // r2_s5, a representative mid-length fight
    const samples = [];

    if (hasGc) global.gc();
    const baseline = process.memoryUsage().heapUsed;

    for (let i = 0; i < MISSION_COUNT; i++) {
        const h = createHarness({ seed: 1000 + i });
        h.loadScripts();
        const stageIndex = stageIndexById(h, stage.id);
        h.runCombat(stage.team, stageIndex);
        if (hasGc) global.gc();
        samples.push(process.memoryUsage().heapUsed);
    }

    const final = samples[samples.length - 1];
    console.log('  baseline heapUsed: ' + fmtMB(baseline));
    console.log('  after 20 missions: ' + fmtMB(final) + ' (delta ' + fmtMB(final - baseline) + ')');

    // Trend check: compare growth in the first 5 vs last 5 missions. A real
    // leak grows roughly linearly forever; a one-time warmup cost (script
    // caches, V8 JIT, first-allocation object shapes) front-loads into the
    // first few runs and then flattens out.
    const first5Delta = samples[4] - baseline;
    const last5Delta = samples[19] - samples[14];
    console.log('  growth in missions 1-5:  ' + fmtMB(first5Delta));
    console.log('  growth in missions 15-20: ' + fmtMB(last5Delta));
    if (hasGc) {
        const verdict = last5Delta < first5Delta * 0.5 || last5Delta < 2 * 1024 * 1024
            ? 'flattening — consistent with warmup cost, not a leak'
            : 'NOT flattening — investigate for a leak';
        console.log('  verdict: ' + verdict);
    }
}

function main() {
    console.log('tests/perf-profile.js — Prompt 82 (Phase 8.1) headless performance profile');
    console.log('Node ' + process.version + (typeof global.gc === 'function' ? ' (--expose-gc active)' : ''));
    profileScriptBoot();
    profileCombatHotPath();
    profileMemory();
    console.log('\nDone. See the Prompt 82 report for interpretation + browser-side (Pixi/render) findings.');
}

main();

// =============================================================================
// tests/assert.js — tiny dependency-free assertion library for the test suite.
// =============================================================================

'use strict';

function AssertionError(message) {
    this.name = 'AssertionError';
    this.message = message;
    this.stack = (new Error(message)).stack;
}
AssertionError.prototype = Object.create(Error.prototype);
AssertionError.prototype.constructor = AssertionError;

// Thrown by assert.knownBug() to mark a test case as a known, un-fixed game
// bug rather than a harness/test failure. The runner reports these loudly
// but does not count them toward the fail count / exit code.
function KnownBugError(message) {
    this.name = 'KnownBugError';
    this.message = message;
    this.stack = (new Error(message)).stack;
}
KnownBugError.prototype = Object.create(Error.prototype);
KnownBugError.prototype.constructor = KnownBugError;

function fmt(v) {
    try {
        if (typeof v === 'function') return v.toString();
        return JSON.stringify(v);
    } catch (e) {
        return String(v);
    }
}

function ok(cond, msg) {
    if (!cond) throw new AssertionError(msg || ('expected truthy value, got ' + fmt(cond)));
}

function equal(actual, expected, msg) {
    if (actual !== expected) {
        throw new AssertionError((msg ? msg + ' — ' : '') + 'expected ' + fmt(expected) + ' but got ' + fmt(actual));
    }
}

function notEqual(actual, expected, msg) {
    if (actual === expected) {
        throw new AssertionError((msg ? msg + ' — ' : '') + 'expected value to differ from ' + fmt(expected));
    }
}

function close(actual, expected, tolerance, msg) {
    tolerance = tolerance === undefined ? 1e-6 : tolerance;
    if (typeof actual !== 'number' || typeof expected !== 'number' || Math.abs(actual - expected) > tolerance) {
        throw new AssertionError((msg ? msg + ' — ' : '') + 'expected ' + fmt(actual) + ' to be within ' + tolerance + ' of ' + fmt(expected));
    }
}

function deepEqual(actual, expected, msg) {
    const a = JSON.stringify(sortKeysDeep(actual));
    const b = JSON.stringify(sortKeysDeep(expected));
    if (a !== b) {
        throw new AssertionError((msg ? msg + ' — ' : '') + 'expected\n  ' + b + '\nbut got\n  ' + a);
    }
}

function sortKeysDeep(v) {
    if (Array.isArray(v)) return v.map(sortKeysDeep);
    if (v && typeof v === 'object') {
        const out = {};
        Object.keys(v).sort().forEach(function(k) { out[k] = sortKeysDeep(v[k]); });
        return out;
    }
    return v;
}

function throws(fn, msg) {
    try {
        fn();
    } catch (e) {
        return e;
    }
    throw new AssertionError(msg || 'expected function to throw');
}

function doesNotThrow(fn, msg) {
    try {
        fn();
    } catch (e) {
        throw new AssertionError((msg ? msg + ' — ' : '') + 'expected function not to throw, but it threw: ' + (e && e.message ? e.message : e));
    }
}

function inRange(actual, min, max, msg) {
    if (typeof actual !== 'number' || actual < min || actual > max) {
        throw new AssertionError((msg ? msg + ' — ' : '') + 'expected ' + fmt(actual) + ' to be within [' + min + ', ' + max + ']');
    }
}

function knownBug(reason) {
    throw new KnownBugError(reason);
}

module.exports = {
    ok: ok,
    equal: equal,
    notEqual: notEqual,
    close: close,
    deepEqual: deepEqual,
    throws: throws,
    doesNotThrow: doesNotThrow,
    inRange: inRange,
    knownBug: knownBug,
    AssertionError: AssertionError,
    KnownBugError: KnownBugError
};

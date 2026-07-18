// =============================================================================
// tests/harness.js — headless Node runner for the Shattered Veil game scripts.
// Zero npm dependencies: uses only Node built-ins (fs, path, vm).
//
// Responsibilities:
//   - Parse game-v2.html to discover the real <script src="..."> load order
//     (never hardcode it — it changes as the game evolves).
//   - Provide minimal browser shims (window, document, localStorage, timers)
//     that are safe no-ops, permissive enough that the game's UI rendering
//     code doesn't throw when driven headlessly.
//   - Provide a seedable PRNG that transparently replaces Math.random inside
//     the sandboxed game context, so combat/gacha/etc. are reproducible.
//   - Expose a small helper API (freshSave, getSaveData, runCombat) that
//     mirrors the real game flow for use by the test suites.
// =============================================================================

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const GAME_HTML = path.join(ROOT, 'game-v2.html');

// -----------------------------------------------------------------------
// Seeded RNG (mulberry32) — deterministic, fast, good-enough distribution
// for gameplay testing purposes.
// -----------------------------------------------------------------------

function mulberry32(seed) {
    let a = seed >>> 0;
    return function() {
        a |= 0;
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// -----------------------------------------------------------------------
// Script load order: parsed from game-v2.html, never hardcoded.
// -----------------------------------------------------------------------

function getScriptLoadOrder() {
    const html = fs.readFileSync(GAME_HTML, 'utf8');
    const re = /<script\s+src="([^"]+)"[^>]*>\s*<\/script>/g;
    const files = [];
    let m;
    while ((m = re.exec(html))) {
        let src = m[1];
        // Strip cache-busting query strings, e.g. "js/save.js?v=2"
        const qIdx = src.indexOf('?');
        if (qIdx >= 0) src = src.substring(0, qIdx);
        // js/vendor/ holds third-party libraries loaded as opaque browser
        // blobs (e.g. js/vendor/pixi.min.js, Prompt 68) -- never executed
        // headlessly. This is what makes "guard renderer registration
        // behind typeof PIXI !== 'undefined' so headless tests never need
        // it" (js/render-pixi.js) actually true: without this skip, the
        // harness would eval the real ~800KB pixi.min.js on every single
        // createHarness() call, which is both slow and pointless (nothing
        // headless ever needs a working WebGL/Canvas renderer). Vendor
        // files are trusted, checked-in, browser-only.
        if (src.indexOf('js/vendor/') === 0) continue;
        files.push(src);
    }
    return files;
}

// -----------------------------------------------------------------------
// Permissive DOM element stub.
//
// Real correctness of rendered HTML/CSS is out of scope for this harness —
// what matters is that the game's UI layer can be driven headlessly without
// throwing. Every element behaves like a generic, always-truthy DOM node:
// style/dataset/classList are real mutable objects, appendChild/removeChild
// maintain a real children array, and any method we didn't think to stub
// explicitly falls back to a safe no-op via a Proxy.
// -----------------------------------------------------------------------

function makeClassList(el) {
    const set = new Set();
    return {
        add: function() { for (let i = 0; i < arguments.length; i++) set.add(arguments[i]); },
        remove: function() { for (let i = 0; i < arguments.length; i++) set.delete(arguments[i]); },
        toggle: function(c, force) {
            if (force === undefined) {
                if (set.has(c)) { set.delete(c); return false; }
                set.add(c); return true;
            }
            if (force) set.add(c); else set.delete(c);
            return force;
        },
        contains: function(c) { return set.has(c); },
        get length() { return set.size; }
    };
}

function makeElement(tag) {
    const target = {
        tagName: String(tag || 'div').toUpperCase(),
        nodeType: 1,
        id: '',
        className: '',
        style: {},
        dataset: {},
        attributes: {},
        children: [],
        childNodes: [],
        parentNode: null,
        value: '',
        checked: false,
        disabled: false,
        scrollTop: 0,
        scrollHeight: 0,
        scrollWidth: 0,
        clientWidth: 0,
        clientHeight: 0,
        offsetWidth: 0,
        offsetHeight: 0,
        offsetTop: 0,
        offsetLeft: 0,
        _html: '',
        _text: ''
    };

    target.classList = makeClassList(target);

    target.appendChild = function(child) {
        if (!child) return child;
        target.children.push(child);
        target.childNodes.push(child);
        child.parentNode = target;
        return child;
    };
    target.removeChild = function(child) {
        let i = target.children.indexOf(child);
        if (i >= 0) target.children.splice(i, 1);
        i = target.childNodes.indexOf(child);
        if (i >= 0) target.childNodes.splice(i, 1);
        if (child) child.parentNode = null;
        return child;
    };
    target.remove = function() {
        if (target.parentNode) target.parentNode.removeChild(target);
    };
    target.insertBefore = function(node) {
        target.children.push(node);
        target.childNodes.push(node);
        node.parentNode = target;
        return node;
    };
    target.replaceChild = function(newNode, oldNode) {
        const i = target.children.indexOf(oldNode);
        if (i >= 0) target.children[i] = newNode;
        newNode.parentNode = target;
        return oldNode;
    };
    target.cloneNode = function() { return makeElement(tag); };
    target.setAttribute = function(k, v) { target.attributes[k] = v; if (k === 'id') target.id = v; };
    target.getAttribute = function(k) {
        return Object.prototype.hasOwnProperty.call(target.attributes, k) ? target.attributes[k] : null;
    };
    target.removeAttribute = function(k) { delete target.attributes[k]; };
    target.hasAttribute = function(k) { return Object.prototype.hasOwnProperty.call(target.attributes, k); };
    target.addEventListener = function() {};
    target.removeEventListener = function() {};
    target.dispatchEvent = function() { return true; };
    target.focus = function() {};
    target.blur = function() {};
    target.click = function() { if (typeof target.onclick === 'function') target.onclick(); };
    target.querySelector = function() { return makeElement('div'); };
    target.querySelectorAll = function() { return []; };
    target.getElementsByClassName = function() { return []; };
    target.getElementsByTagName = function() { return []; };
    target.getBoundingClientRect = function() {
        return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
    };

    Object.defineProperty(target, 'innerHTML', {
        get: function() { return target._html; },
        set: function(v) {
            target._html = v;
            // ".innerHTML = ''" is the common "clear all children" idiom.
            if (v === '') { target.children = []; target.childNodes = []; }
        }
    });
    Object.defineProperty(target, 'textContent', {
        get: function() { return target._text; },
        set: function(v) {
            target._text = v;
            if (v === '') { target.children = []; target.childNodes = []; }
        }
    });
    Object.defineProperty(target, 'innerText', {
        get: function() { return target._text; },
        set: function(v) { target._text = v; }
    });

    // Any property/method access we didn't anticipate becomes a safe no-op
    // function instead of throwing (the "permissive element stub" the spec
    // asks for).
    return new Proxy(target, {
        get: function(obj, prop) {
            if (prop in obj) return obj[prop];
            if (typeof prop === 'symbol') return undefined;
            return function() { return undefined; };
        },
        set: function(obj, prop, value) { obj[prop] = value; return true; }
    });
}

function makeDocument() {
    const byId = new Map();
    const doc = {
        getElementById: function(id) {
            if (!byId.has(id)) {
                const el = makeElement('div');
                el.id = id;
                byId.set(id, el);
            }
            return byId.get(id);
        },
        createElement: function(tag) { return makeElement(tag); },
        createTextNode: function(text) { const n = makeElement('#text'); n.textContent = text; return n; },
        createDocumentFragment: function() { return makeElement('#fragment'); },
        querySelector: function() { return makeElement('div'); },
        querySelectorAll: function() { return []; },
        getElementsByClassName: function() { return []; },
        getElementsByTagName: function() { return []; },
        addEventListener: function() {},
        removeEventListener: function() {},
        dispatchEvent: function() { return true; },
        activeElement: null,
        hidden: false,
        visibilityState: 'visible',
        readyState: 'complete',
        cookie: '',
        location: { href: 'file://test-harness', reload: function() {} },
        _byId: byId
    };
    doc.body = makeElement('body');
    doc.documentElement = makeElement('html');
    doc.head = makeElement('head');
    return doc;
}

function makeLocalStorage() {
    let store = Object.create(null);
    return {
        getItem: function(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
        setItem: function(k, v) { store[k] = String(v); },
        removeItem: function(k) { delete store[k]; },
        clear: function() { store = Object.create(null); },
        key: function(i) { return Object.keys(store)[i] || null; },
        get length() { return Object.keys(store).length; }
    };
}

// -----------------------------------------------------------------------
// Harness factory
// -----------------------------------------------------------------------

function createHarness(options) {
    options = options || {};
    const verbose = !!options.verbose || !!process.env.TEST_VERBOSE;

    const rngState = { fn: mulberry32(options.seed || 1) };
    const localStorageShim = makeLocalStorage();
    const doc = makeDocument();

    const quietConsole = {
        log: function() { if (verbose) console.log.apply(console, arguments); },
        info: function() { if (verbose) console.info.apply(console, arguments); },
        warn: function() { if (verbose) console.warn.apply(console, arguments); },
        error: function() { if (verbose) console.error.apply(console, arguments); },
        debug: function() { if (verbose) console.debug.apply(console, arguments); }
    };

    const sandbox = {
        console: quietConsole,
        localStorage: localStorageShim,
        sessionStorage: makeLocalStorage(),
        alert: function() {},
        confirm: function() { return true; },
        prompt: function() { return null; },
        requestAnimationFrame: function(cb) { if (typeof cb === 'function') cb(0); return 0; },
        cancelAnimationFrame: function() {},
        // setTimeout/setInterval are intentionally NOT auto-firing: the real
        // combat/animation loops recurse via setTimeout, and firing them
        // synchronously would blow the call stack. Nothing in the pure game
        // logic (combat-*.js, save.js, gacha.js, items.js, missions.js,
        // teams.js, units-*.js) relies on timers firing — only the visual
        // UI layer (ui-combat.js) does, and tests drive combat directly via
        // combatTick() instead of the setTimeout-based render loop.
        setTimeout: function() { return 0; },
        clearTimeout: function() {},
        setInterval: function() { return 0; },
        clearInterval: function() {},
        document: doc,
        navigator: { userAgent: 'node-test-harness' },
        location: { href: 'file://test-harness', reload: function() {} },
        performance: { now: function() { return Date.now(); } },
        JSON: JSON,
        Date: Date
    };
    sandbox.window = sandbox;
    sandbox.globalThis = sandbox;
    sandbox.self = sandbox;
    sandbox.addEventListener = function() {};
    sandbox.removeEventListener = function() {};
    sandbox.dispatchEvent = function() { return true; };

    // Seeded Math: inherit every real Math static (floor, pow, imul, ...)
    // but override random() to be deterministic under seed.
    const customMath = Object.create(Math);
    customMath.random = function() { return rngState.fn(); };
    sandbox.Math = customMath;

    const context = vm.createContext(sandbox);

    let loaded = false;

    function loadScripts() {
        if (loaded) return;
        const files = getScriptLoadOrder();
        if (files.length === 0) {
            throw new Error('harness: no <script src="..."> tags found in game-v2.html — load order parse failed');
        }
        for (let i = 0; i < files.length; i++) {
            const rel = files[i];
            const full = path.join(ROOT, rel);
            const code = fs.readFileSync(full, 'utf8');
            const script = new vm.Script(code, { filename: rel });
            script.runInContext(context);
        }
        loaded = true;
    }

    function setSeed(n) {
        rngState.fn = mulberry32(n);
    }

    // ---- freshSave: clear localStorage + boot the game exactly like a
    // first-time player would (loadGame() finds nothing -> createDefaultSaveData()).
    function freshSave() {
        loadScripts();
        localStorageShim.clear();
        context.initGameV2();
        return context.getSaveData();
    }

    function getSaveData() {
        return context.getSaveData();
    }

    // ---- runCombat: mirrors the real flow —
    // uiStartStoryMission -> startWaveCombat -> pump combatTick until result.
    // playerTeamSetup: array of { key, row, col, stars } placed on the active team.
    // Runs every wave of the mission (and heals/repositions between waves,
    // exactly like autoBattle() does in ui-combat.js) until the whole
    // mission resolves to a final win/loss/draw.
    function runCombat(playerTeamSetup, stageIndex) {
        loadScripts();
        const sd = freshSave();

        for (let i = 0; i < playerTeamSetup.length; i++) {
            const u = playerTeamSetup[i];
            sd.collection[u.key] = { stars: u.stars || 1, copiesForNext: 0 };
        }
        const team = context.getActiveTeam(sd);
        team.slots = playerTeamSetup.map(function(u) {
            return { key: u.key, row: u.row, col: u.col };
        });

        context.uiStartStoryMission(stageIndex);

        const dt = context.COMBAT_DT || 0.05;
        const log = [];
        let ticks = 0;
        const MAX_TICKS = 300000; // safety valve — 60s boss timeout / 0.05s tick = 1200 ticks/wave max normally

        function flushLog() {
            const logEl = doc.getElementById('combat-log');
            if (logEl && logEl.children && logEl.children.length) {
                for (let i = 0; i < logEl.children.length; i++) {
                    log.push(logEl.children[i].textContent);
                }
            }
        }

        function pumpWave() {
            while (context.combatState && context.combatState.running && ticks < MAX_TICKS) {
                context.combatTick(dt);
                ticks++;
            }
        }

        pumpWave();
        flushLog();

        let finalResult = context.combatState ? context.combatState.result : null;

        while (finalResult === 'win' && context.advanceWave()) {
            context.healBoardUnits();
            context.startWaveCombat();
            pumpWave();
            flushLog();
            finalResult = context.combatState ? context.combatState.result : null;
            if (finalResult !== 'win') break;
        }

        const survivors = context.combatState ? context.combatState.playerUnits.filter(function(u) {
            return u.hp > 0;
        }).length : 0;

        return {
            result: finalResult,
            ticks: ticks,
            log: log,
            survivors: survivors,
            saveData: sd
        };
    }

    return {
        context: context,
        loadScripts: loadScripts,
        setSeed: setSeed,
        freshSave: freshSave,
        getSaveData: getSaveData,
        runCombat: runCombat,
        localStorage: localStorageShim,
        document: doc
    };
}

module.exports = {
    createHarness: createHarness,
    mulberry32: mulberry32,
    getScriptLoadOrder: getScriptLoadOrder
};

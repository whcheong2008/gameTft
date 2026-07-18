// render-interface.js -- combat renderer registry + active-renderer resolution (Prompt 67)
//
// Phase 3.1 target architecture (MASTERPLAN.md § Phase 3): combat logic
// (js/combat-*.js) owns combatState, the tick loop timing values, and
// combatEvents. It never touches a renderer or the DOM directly -- see the
// Prompt 67 shims (spawnDamageNumber/flashAbilityCells/addCombatLog) at the
// bottom of js/combat-core.js. A "renderer" is the thing on the other side
// of that seam: it turns combatState + combatEvents into pixels.
//
// A renderer is a plain object with three methods:
//
//   init(container, combatState, context)
//     Called once when a wave's combat board is about to be shown (after
//     initCombat() has built combatState for that wave). `container` is the
//     DOM element combat visuals should render into (#combat-area).
//     `combatState` is the live global combat state object -- read-only from
//     the renderer's perspective, it changes out from under the renderer
//     every tick. `context` carries stage/mission metadata that doesn't live
//     on combatState itself:
//       { missionName, waveIndex, totalWaves, encounterMechanic, isBoss }
//     This is also where a renderer should subscribe to combatEvents
//     (js/combat-events.js) for discrete, non-per-frame effects -- e.g.
//     unitDamaged/unitHealed/floatingText -> floating combat numbers,
//     unitKilled -> death animation, abilityFlash -> cast/cell flash,
//     ccApplied -> status icon pulse. combatEvents.reset() runs inside
//     initCombat() before init() is called, wiping every listener from the
//     previous wave (same convention hero skill nodes use) -- so init() must
//     re-subscribe every wave, not just the first.
//
//   frame(dtMs)
//     Called once per animation frame while combat is active (driven by a
//     requestAnimationFrame loop in ui-combat.js, decoupled from the fixed-
//     step combat tick pump). Renderers re-read combatState fresh each call.
//
//   destroy()
//     Called when leaving the combat screen entirely. Must remove everything
//     the renderer added to the DOM/canvas and leave no dangling timers.
//
// Renderers never call INTO combat-*.js beyond reading combatState/
// combatEvents; combat-*.js never calls into a renderer. Headless callers
// (tests/run.js) never need to register or resolve a renderer at all --
// combatTick()/initCombat() work identically with zero renderers registered.

var RENDERERS = {};

function registerRenderer(name, renderer) {
    RENDERERS[name] = renderer;
}

// Prompt 71 (Phase 3.5, Task 3): js/render-dom.js is deleted -- RENDERERS
// only ever has 'pixi' registered now (and only when PIXI actually loaded;
// see js/render-pixi.js's `typeof PIXI !== 'undefined'` guard). There is no
// more DOM fallback to silently swap in when Pixi is unavailable/broken:
// js/render-pixi.js's pixiEnsureApp() shows a "this game requires WebGL"
// notice directly in that case instead of calling into this file at all.
// forceRendererDomFallback() is kept as a harmless no-op stub (rather than
// deleted outright) purely so any stray caller doesn't throw -- nothing in
// this codebase calls it as of this prompt.
function forceRendererDomFallback(reason) {
    if (typeof console !== 'undefined' && console.warn) {
        console.warn('render-interface.js: forceRendererDomFallback() is a no-op -- the DOM renderer was retired (Prompt 71). ' + (reason || ''));
    }
}

// Resolves the active renderer from the `?renderer=` query param (defaults
// to 'pixi' -- the only renderer since Prompt 71 retired js/render-dom.js).
// Safe to call in headless contexts where window/location may be absent or
// minimal (tests/harness.js's location stub has no `search`).
//
// An explicit `?renderer=dom` is a working, documented URL from Prompt 70
// that must not silently 404 into nothing -- it now falls back to pixi with
// a one-time console.warn (Task 3 spec: "explicit ?renderer=dom falls back
// to pixi with a warn"), rather than resolving to null the way any other
// unregistered name would.
var RENDERER_DOM_REQUEST_WARNED = false;

function getActiveRenderer() {
    var name = 'pixi';
    if (typeof window !== 'undefined' && window.location && window.location.search) {
        var m = window.location.search.match(/[?&]renderer=([^&]+)/);
        if (m) name = decodeURIComponent(m[1]);
    }
    if (name === 'dom') {
        if (!RENDERER_DOM_REQUEST_WARNED) {
            RENDERER_DOM_REQUEST_WARNED = true;
            if (typeof console !== 'undefined' && console.warn) {
                console.warn('render-interface.js: ?renderer=dom was retired (Prompt 71) -- running pixi instead.');
            }
        }
        name = 'pixi';
    }
    return RENDERERS[name] || null;
}

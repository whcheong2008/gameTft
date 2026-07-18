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

// Prompt 70 (Phase 3.4, Task 5): once true, getActiveRenderer() treats the
// default resolution as 'dom' regardless of RENDERERS.pixi's presence, for
// the rest of the session. Set by js/render-pixi.js's pixiEnsureApp() when
// PIXI.Application.init() rejects (WebGL unavailable/broken on this
// machine) -- see forceRendererDomFallback() below. `?renderer=pixi`
// explicitly in the URL still wins (a developer asking for pixi by name
// should see it try and fail loudly, not be silently overridden), matching
// the existing convention that an explicit query param always wins.
var RENDERER_DOM_FALLBACK_FORCED = false;

// Called once, from the renderer that failed at runtime (currently only
// js/render-pixi.js's WebGL init failure path). Idempotent -- a second
// caller (e.g. a second failed wave attempt) is a no-op, not a second
// console.warn spam.
function forceRendererDomFallback(reason) {
    if (RENDERER_DOM_FALLBACK_FORCED) return;
    RENDERER_DOM_FALLBACK_FORCED = true;
    if (typeof console !== 'undefined' && console.warn) {
        console.warn('render-interface.js: falling back to the DOM renderer for the rest of this session -- ' + (reason || 'the active renderer failed'));
    }
}

// Resolves the active renderer from the `?renderer=` query param (falls back
// to 'pixi' if absent -- Prompt 70 flips the default; 'dom' remains
// available as an explicit `?renderer=dom` opt-out). Safe to call in
// headless contexts where window/location may be absent or minimal
// (tests/harness.js's location stub has no `search`). Falls through to the
// 'dom' renderer whenever the resolved name isn't registered (e.g. PIXI
// never loaded -- js/render-pixi.js's registration is itself guarded behind
// `typeof PIXI !== 'undefined'`) or once forceRendererDomFallback() has
// fired for this session.
function getActiveRenderer() {
    var name = 'pixi';
    var explicit = false;
    if (typeof window !== 'undefined' && window.location && window.location.search) {
        var m = window.location.search.match(/[?&]renderer=([^&]+)/);
        if (m) { name = decodeURIComponent(m[1]); explicit = true; }
    }
    // Only the DEFAULT resolution (no `?renderer=` param at all) is affected
    // by a forced fallback -- an explicit `?renderer=pixi` must still try
    // pixi (and fail loudly again) rather than being silently rewritten.
    if (!explicit && name === 'pixi' && RENDERER_DOM_FALLBACK_FORCED) name = 'dom';
    return RENDERERS[name] || RENDERERS.dom || null;
}

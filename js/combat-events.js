// combat-events.js -- minimal global combat event bus (Prompt 60)
//
// A tiny pub/sub bus that combat-core/damage/status/abilities emit real
// combat events on. Hero skill nodes (js/heroes.js) subscribe to these at
// combat start to implement the ~84 previously-inert placeholder nodes.
//
// Must load BEFORE combat-core.js in game-v2.html.
//
// Events emitted (see js/combat-core.js, combat-damage.js, combat-status.js,
// combat-abilities.js for the exact emission sites):
//   combatStart ({ playerUnits, enemyUnits })
//   waveStart   ({ playerUnits, enemyUnits, waveIndex })
//   unitDamaged ({ source, target, amount, isCrit, shieldBroke })
//   unitHealed  ({ source, target, amount, overheal })
//   unitKilled  ({ killer, victim, amount })
//   ccApplied   ({ source, target, type })
//   abilityCast ({ caster, key })
//   tick        ({ dt })
//   combatEnd   ({ result })
//
// Prompt 67 (combat renderer abstraction) events -- these three exist purely
// so combat-*.js never has to call a DOM-drawing function by name. The
// logic-layer shims that emit them live in js/combat-core.js
// (spawnDamageNumber/flashAbilityCells/addCombatLog); the DOM renderer
// (js/render-dom.js) is the only subscriber today, but any renderer
// registered via js/render-interface.js can listen instead:
//   floatingText ({ row, col, text, type })   -- battlefield floating number
//   abilityFlash ({ cells, color, duration }) -- battlefield cell highlight
//   logMessage   ({ text, cls })              -- combat log line (chrome)
//
// These three are registered once via onPersistent() below (at script-load
// time in js/render-dom.js and js/ui-combat.js), NOT per-wave via on() --
// see onPersistent()'s own comment for why: initCombat() itself (e.g. a
// combat-start passive granting a shield) can emit them before a per-wave
// on() listener would have had a chance to re-register after reset().

var combatEvents = {
    _listeners: {},
    _persistentListeners: {},

    on: function(event, fn) {
        if (typeof fn !== 'function') return;
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(fn);
    },

    // Prompt 67: a listener registered here survives reset() (used by
    // combat-*.js renderer-facing events: floatingText/abilityFlash/
    // logMessage). Unlike on() -- reserved for genuinely per-wave consumers
    // like hero skill nodes, which MUST be wiped and re-registered every wave
    // so a previous wave's closures don't leak forward -- a renderer/chrome
    // subscriber's lifetime is the whole combat screen session (one or more
    // waves), and initCombat() can emit these events from within its own
    // per-wave setup (before initCombat() has even returned to the caller
    // that would otherwise re-register a per-wave on() listener). Register
    // once, at script load time, not per wave.
    onPersistent: function(event, fn) {
        if (typeof fn !== 'function') return;
        if (!this._persistentListeners[event]) this._persistentListeners[event] = [];
        this._persistentListeners[event].push(fn);
    },

    emit: function(event, payload) {
        var fns = this._listeners[event];
        var pFns = this._persistentListeners[event];
        if ((!fns || fns.length === 0) && (!pFns || pFns.length === 0)) return;
        // Snapshot the array: a listener may itself register new listeners
        // (e.g. a hero node reacting to combatStart) without corrupting the
        // iteration in progress.
        var snapshot = (fns || []).concat(pFns || []);
        for (var i = 0; i < snapshot.length; i++) {
            try {
                snapshot[i](payload);
            } catch (e) {
                if (typeof console !== 'undefined' && console.error) {
                    console.error('combatEvents listener error on "' + event + '":', e);
                }
            }
        }
    },

    reset: function() {
        this._listeners = {};
        // _persistentListeners intentionally NOT cleared here -- see onPersistent().
    }
};

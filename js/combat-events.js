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

var combatEvents = {
    _listeners: {},

    on: function(event, fn) {
        if (typeof fn !== 'function') return;
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(fn);
    },

    emit: function(event, payload) {
        var fns = this._listeners[event];
        if (!fns || fns.length === 0) return;
        // Snapshot the array: a listener may itself register new listeners
        // (e.g. a hero node reacting to combatStart) without corrupting the
        // iteration in progress.
        var snapshot = fns.slice();
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
    }
};

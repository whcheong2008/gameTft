// vfx-abilities.js -- Prompt 73 (Phase 4.3): per-ability VFX recipe registry +
// interpreter. Loads AFTER js/vfx.js (game-v2.html script order) so it can
// reuse vfx.js's global primitive registry (VFX.play) and its internal
// instance-scheduling primitives (vfxNewInstance/vfxRegister -- both plain
// globals in script-tag scope, not exported via the VFX object, but usable
// here the same way vfx.js's own primitive builders use them).
//
// Iron rules (see prompts/73-ability-vfx-coverage.md):
//   - Recipes are DATA (ABILITY_VFX below): { sel, radius/pierceSteps/
//     coneSteps/chainBounces, cast:[steps], travel:[steps], impact:[steps] }.
//     A step is { p: primitiveName, at: 'caster'|'target'|'cells'|'path'|
//     'each-target'|'chain'|'casterTarget', delay, stagger, ...primitiveOpts }.
//   - ZERO new event payload fields were needed on combat-abilities.js's
//     'abilityCast' ({caster,key}) -- caster.target is already the live
//     reference the ability logic itself reads, and every other piece of
//     targeting geometry (AoE cells, pierce beams, cone cells, chain bounce
//     order) is recomputed HERE by calling the exact same pure, read-only,
//     RNG-free helpers combat-abilities.js/grid.js already export as globals
//     (getUnitsInRadius, cellsInRange, hexRay, abilityPierceTargets,
//     abilityConeCells, hexDistance, getLowestHpUnits, getFurthestEnemy,
//     getLowestHpEnemy, getHighestAtkUnits, getAlliesOfElement,
//     findNearestAlly) -- so this file never asks combat-abilities.js to
//     compute or expose anything it doesn't already compute for its own
//     logic. combat-abilities.js/combat-boss.js/combat-legendary.js gained
//     only brand-new, purely-additive event emissions elsewhere (see their
//     own Prompt 73 comments) -- zero logic behavior changes, goldens
//     byte-identical.
//   - getRandomAlive() (combat-core.js) is the ONE targeting helper that
//     consumes Math.random() -- this file NEVER calls it (would both desync
//     from the real chosen targets AND burn an extra RNG draw, breaking
//     determinism). Abilities whose real target selection is
//     getRandomAlive-driven (inferno_fox/ninetail_blaze's multi-dash,
//     ball_lightning/plasma_core's opening bolt when no explicit target)
//     approximate with a safe, deterministic anchor (caster.target) -- see
//     the "RNG-safe approximations" list in the Prompt 73 report.
//   - This file's own scheduler (abilityVfxSchedule) reuses vfx.js's
//     existing vfxNewInstance/vfxRegister/VFX_R.active frame-tick contract
//     instead of hooking a second per-frame callback into render-pixi.js --
//     zero new frame-loop wiring, zero touch of the seeded RNG stream (all
//     per-step stagger/delay math is deterministic float arithmetic).
// =============================================================================

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

var ABILITY_VFX_GOLD = 0xFFD24A; // evolved-tier accent tint ("evolved = tint+aura", GRAPHICS-PLAN convention)
var ABILITY_VFX_AT_TYPES = ['caster', 'target', 'cells', 'path', 'each-target', 'chain', 'casterTarget'];

// ---------------------------------------------------------------------------
// Pure targeting-selector resolution -- every case below calls only
// read-only, RNG-free global helpers (see header). Returns {target, targets}.
// ---------------------------------------------------------------------------

function abilityVfxSides(unit) {
    if (!combatState) return { allies: [], enemies: [] };
    var allies = unit.side === 'player' ? combatState.playerUnits : combatState.enemyUnits;
    var enemies = unit.side === 'player' ? combatState.enemyUnits : combatState.playerUnits;
    return { allies: allies, enemies: enemies };
}

function abilityVfxResolveSel(sel, caster) {
    var sides = abilityVfxSides(caster);
    var target = null, targets = [];
    switch (sel) {
    case 'self':
        target = caster; targets = [caster];
        break;
    case 'lowestHpAlly':
        targets = (typeof getLowestHpUnits === 'function') ? getLowestHpUnits(sides.allies, 1) : [];
        target = targets[0] || caster;
        break;
    case 'lowestHpAllies2':
        targets = (typeof getLowestHpUnits === 'function') ? getLowestHpUnits(sides.allies, 2) : [];
        target = targets[0] || caster;
        break;
    case 'lowestHpAllies3':
        targets = (typeof getLowestHpUnits === 'function') ? getLowestHpUnits(sides.allies, 3) : [];
        target = targets[0] || caster;
        break;
    case 'lowestHpAllies4':
        targets = (typeof getLowestHpUnits === 'function') ? getLowestHpUnits(sides.allies, 4) : [];
        target = targets[0] || caster;
        break;
    case 'furthestEnemy':
        target = (typeof getFurthestEnemy === 'function') ? getFurthestEnemy(caster, sides.enemies) : null;
        targets = target ? [target] : [];
        break;
    case 'lowestHpEnemy':
        target = (typeof getLowestHpEnemy === 'function') ? getLowestHpEnemy(sides.enemies) : null;
        targets = target ? [target] : [];
        break;
    case 'highestAtkEnemies3':
        targets = (typeof getHighestAtkUnits === 'function') ? getHighestAtkUnits(sides.enemies, 3) : [];
        target = targets[0] || null;
        break;
    case 'highestAtkEnemies5':
        targets = (typeof getHighestAtkUnits === 'function') ? getHighestAtkUnits(sides.enemies, 5) : [];
        target = targets[0] || null;
        break;
    case 'nearestAlly':
        target = (typeof findNearestAlly === 'function') ? findNearestAlly(caster, sides.allies) : null;
        targets = target ? [target] : [];
        break;
    case 'waterAllies':
        targets = (typeof getAlliesOfElement === 'function') ? getAlliesOfElement(caster, 'water') : [];
        target = targets[0] || caster;
        break;
    case 'target':
    default:
        target = caster.target || null;
        targets = target ? [target] : [];
        break;
    }
    return { target: target, targets: targets };
}

// ---------------------------------------------------------------------------
// Context builder -- one per abilityCast, shared by every step in a recipe.
// Resolves the primary sel, then layers radius-AoE / pierce-line / cone /
// chain-bounce geometry on top when the recipe declares it. Every geometry
// helper called here is the SAME pure function combat-abilities.js's own
// logic calls (see header) -- this is a read, not a recompute-and-diverge.
// ---------------------------------------------------------------------------

function abilityVfxBuildContext(recipe, caster) {
    var base = abilityVfxResolveSel(recipe.sel || 'target', caster);
    var ctx = { caster: caster, target: base.target, targets: base.targets, cells: null, path: null };

    if (recipe.radius) {
        var anchorUnit = (recipe.anchor === 'caster') ? caster : (ctx.target || caster);
        var sides = abilityVfxSides(caster);
        var pool = (recipe.aoeOn === 'allies') ? sides.allies : sides.enemies;
        if (typeof getUnitsInRadius === 'function') {
            ctx.targets = getUnitsInRadius(anchorUnit.gridRow, anchorUnit.gridCol, recipe.radius, pool);
        }
        if (typeof cellsInRange === 'function') {
            ctx.cells = cellsInRange(anchorUnit.gridRow, anchorUnit.gridCol, Math.ceil(recipe.radius));
        }
        if (!ctx.target) ctx.target = anchorUnit;
    }

    if (recipe.pierceSteps && ctx.target) {
        if (typeof hexRay === 'function') {
            ctx.path = hexRay(caster.gridRow, caster.gridCol, ctx.target.gridRow, ctx.target.gridCol, recipe.pierceSteps);
        }
        if (combatState && combatState.grid && typeof abilityPierceTargets === 'function') {
            ctx.targets = abilityPierceTargets(caster, ctx.target, combatState.grid, recipe.pierceSteps);
        }
    }

    if (recipe.coneSteps && ctx.target) {
        if (typeof abilityConeCells === 'function') {
            ctx.path = abilityConeCells(caster, ctx.target, recipe.coneSteps);
            ctx.cells = ctx.path;
        }
        if (ctx.path && combatState && combatState.grid) {
            var coneTargets = [];
            for (var i = 0; i < ctx.path.length; i++) {
                var cell = ctx.path[i];
                var u = combatState.grid[cell.row] && combatState.grid[cell.row][cell.col];
                if (u && u.hp > 0 && u.side !== caster.side && coneTargets.indexOf(u) < 0) coneTargets.push(u);
            }
            ctx.targets = coneTargets;
        }
    }

    if (recipe.chainBounces && ctx.target) {
        var sides2 = abilityVfxSides(caster);
        var chained = [ctx.target];
        var last = ctx.target;
        for (var b = 0; b < recipe.chainBounces; b++) {
            var best = null, bestDist = 999;
            for (var j = 0; j < sides2.enemies.length; j++) {
                var e = sides2.enemies[j];
                if (e.hp > 0 && chained.indexOf(e) < 0 && typeof hexDistance === 'function') {
                    var d = hexDistance(last.gridRow, last.gridCol, e.gridRow, e.gridCol);
                    if (d <= (recipe.chainRange || 3) && d < bestDist) { bestDist = d; best = e; }
                }
            }
            if (!best) break;
            chained.push(best);
            last = best;
        }
        ctx.targets = chained;
    }

    return ctx;
}

// ---------------------------------------------------------------------------
// Step -> primitive-opts resolution.
// ---------------------------------------------------------------------------

function abilityVfxResolveStepOpts(step, ctx) {
    var opts = {};
    for (var k in step) {
        if (k === 'p' || k === 'at' || k === 'delay' || k === 'stagger' || k === 'sel' || k === 'maxCount') continue;
        opts[k] = step[k];
    }
    var anchor = ctx.target;
    if (step.sel) {
        var over = abilityVfxResolveSel(step.sel, ctx.caster);
        anchor = over.target;
    }
    switch (step.at) {
    case 'caster':
        opts.unit = ctx.caster; opts.row = ctx.caster.gridRow; opts.col = ctx.caster.gridCol;
        break;
    case 'target':
        if (anchor) { opts.unit = anchor; opts.row = anchor.gridRow; opts.col = anchor.gridCol; }
        break;
    case 'casterTarget':
        var ct = ctx.caster.target;
        if (ct) { opts.unit = ct; opts.row = ct.gridRow; opts.col = ct.gridCol; }
        break;
    case 'cells':
        opts.cells = ctx.cells || (anchor ? [{ row: anchor.gridRow, col: anchor.gridCol }] : []);
        break;
    case 'path':
        opts.cells = ctx.path || [];
        if (ctx.path && ctx.path.length) {
            opts.from = { row: ctx.caster.gridRow, col: ctx.caster.gridCol };
            opts.to = { row: ctx.path[ctx.path.length - 1].row, col: ctx.path[ctx.path.length - 1].col };
        }
        break;
    case 'chain':
        var pts = [{ row: ctx.caster.gridRow, col: ctx.caster.gridCol }];
        var list = (ctx.targets && ctx.targets.length) ? ctx.targets : (anchor ? [anchor] : []);
        for (var i = 0; i < list.length; i++) pts.push(list[i]);
        opts.points = pts;
        break;
    }
    if (step.p === 'projectile' || step.p === 'beam') {
        if (opts.fromUnit === undefined && opts.from === undefined) opts.fromUnit = ctx.caster;
        if (opts.toUnit === undefined && opts.to === undefined && anchor) opts.toUnit = anchor;
    }
    return opts;
}

// ---------------------------------------------------------------------------
// Step expansion ('each-target' fans a single step out over ctx.targets,
// each with its own stagger offset) + scheduling. Reuses vfx.js's own
// instance/frame-tick machinery (vfxNewInstance/vfxRegister -- plain globals
// in vfx.js's script-tag scope) rather than adding a second per-frame hook,
// so delayed steps retire and respect COMBAT_SPEED exactly like every other
// VFX instance. particleCost 0: the scheduler itself never counts against
// VFX_CAP -- only the primitives it eventually calls do.
// ---------------------------------------------------------------------------

function abilityVfxExpandSteps(steps, ctx) {
    var jobs = [];
    for (var s = 0; s < steps.length; s++) {
        var step = steps[s];
        if (!step) continue;
        var baseDelay = step.delay || 0;
        if (step.at === 'each-target') {
            var list;
            if (step.sel) {
                list = abilityVfxResolveSel(step.sel, ctx.caster).targets;
            } else {
                list = (ctx.targets && ctx.targets.length) ? ctx.targets : (ctx.target ? [ctx.target] : []);
            }
            var stagger = step.stagger || 0;
            var cap = step.maxCount || list.length;
            for (var i = 0; i < Math.min(list.length, cap); i++) {
                (function(unit, idx, step2) {
                    jobs.push({
                        delay: baseDelay + idx * stagger,
                        fn: function() {
                            var opts = {};
                            for (var k in step2) {
                                if (k === 'p' || k === 'at' || k === 'delay' || k === 'stagger' || k === 'sel' || k === 'maxCount') continue;
                                opts[k] = step2[k];
                            }
                            opts.unit = unit; opts.row = unit.gridRow; opts.col = unit.gridCol;
                            if (step2.p === 'projectile' || step2.p === 'beam') { opts.fromUnit = ctx.caster; opts.toUnit = unit; }
                            VFX.play(step2.p, opts);
                        }
                    });
                })(list[i], i, step);
            }
        } else {
            jobs.push({
                delay: baseDelay,
                fn: (function(step3) { return function() { VFX.play(step3.p, abilityVfxResolveStepOpts(step3, ctx)); }; })(step)
            });
        }
    }
    return jobs;
}

function abilityVfxFireJob(job) {
    try { job.fn(); } catch (e) {
        if (typeof console !== 'undefined' && console.error) console.error('vfx-abilities.js: step threw', e);
    }
}

function abilityVfxSchedule(jobs) {
    if (!jobs || jobs.length === 0) return;

    // Zero/negative-delay steps fire SYNCHRONOUSLY, right now -- no reason to
    // wait a render frame for the common case (most cast-phase steps have no
    // delay), and it means abilityCast's visible response has zero latency
    // just like Prompt 72's direct VFX.play() calls. Only steps with a real
    // positive delay need the frame-driven scheduler below.
    var deferred = [];
    for (var i = 0; i < jobs.length; i++) {
        if (jobs[i].delay > 0) deferred.push(jobs[i]); else abilityVfxFireJob(jobs[i]);
    }
    if (deferred.length === 0) return;

    if (typeof vfxNewInstance !== 'function' || typeof vfxRegister !== 'function') {
        // vfx.js not loaded (e.g. an isolated unit test) -- fire immediately;
        // VFX.play() itself is a safe no-op when PIXI isn't ready.
        for (var j = 0; j < deferred.length; j++) abilityVfxFireJob(deferred[j]);
        return;
    }

    var maxDelay = 0;
    for (var m = 0; m < deferred.length; m++) if (deferred[m].delay > maxDelay) maxDelay = deferred[m].delay;

    var inst = vfxNewInstance('abilityVfxScheduler', maxDelay + 0.05, 0);
    var fired = new Array(deferred.length);
    inst.update = function() {
        for (var k = 0; k < deferred.length; k++) {
            if (fired[k]) continue;
            if (inst.elapsed >= deferred[k].delay) {
                fired[k] = true;
                abilityVfxFireJob(deferred[k]);
            }
        }
    };
    vfxRegister(inst);
}

function abilityVfxRun(recipe, caster) {
    if (!recipe || !caster) return false;
    var ctx = abilityVfxBuildContext(recipe, caster);
    var allSteps = (recipe.cast || []).concat(recipe.travel || []).concat(recipe.impact || []);
    if (allSteps.length === 0) return false;
    abilityVfxSchedule(abilityVfxExpandSteps(allSteps, ctx));
    return true;
}

// ---------------------------------------------------------------------------
// Element + archetype DEFAULT recipes -- guarantees every one of the 132
// ability keys resolves to *something* even before/without an explicit
// entry (registry-completeness safety net; every key below DOES have an
// explicit entry, but ABILITY_VFX_RESOLVE still falls through to this for
// any unmapped key, e.g. future roster additions).
// ---------------------------------------------------------------------------

function abilityVfxDefaultRecipe(unit) {
    var element = (unit && unit.element) || 'force';
    var type = (unit && unit.type) || 'warrior';
    var ranged = !!(unit && unit.range > 1);

    if (type === 'healer') {
        return {
            sel: 'lowestHpAlly',
            cast: [{ p: 'aura', at: 'caster', element: element, duration: 0.3 }],
            travel: [],
            impact: [
                { p: 'rise', at: 'target', color: 0x44ee44, count: 7, duration: 0.6 },
                { p: 'shieldPop', at: 'target', color: 0x44ee44, duration: 0.35, delay: 0.05 }
            ]
        };
    }
    if (type === 'tank') {
        return {
            sel: 'self',
            cast: [{ p: 'shieldPop', at: 'caster', duration: 0.4 }],
            travel: [],
            impact: [{ p: 'nova', at: 'caster', element: element, radius: 1.4, duration: 0.4, delay: 0.05 }]
        };
    }
    return {
        sel: 'target',
        cast: [{ p: 'aura', at: 'caster', element: element, duration: 0.3 }],
        travel: ranged ? [{ p: 'projectile', at: 'target', element: element, duration: 0.18 }] : [],
        impact: [{ p: ranged ? 'burst' : 'slash', at: 'target', element: element, big: true, delay: ranged ? 0.18 : 0.03 }]
    };
}

function ABILITY_VFX_RESOLVE(key, unit) {
    if (ABILITY_VFX.hasOwnProperty(key)) return ABILITY_VFX[key];
    return abilityVfxDefaultRecipe(unit);
}

// ---------------------------------------------------------------------------
// Recipe factories -- shared shapes covering the recurring ability
// mechanics (single strike, cone, self/target AoE, dash, pierce, chain,
// heal, shield, zone, buff, multi-select). Each ability entry below either
// calls one of these with element + the SAME numeric parameters (radius/
// count/steps) combat-abilities.js's own case uses, or is fully bespoke for
// mechanics too distinct to share a shape. This is what makes "recipes are
// DATA" tractable at 132 entries: the factories return plain data objects,
// no per-ability logic.
// ---------------------------------------------------------------------------

var fx = {};

fx.strike = function(element, opts) {
    opts = opts || {};
    var ranged = !!opts.ranged;
    var travel = ranged ? [{ p: 'projectile', at: 'target', element: element, arc: !!opts.arc, duration: opts.travelDur || 0.16 }] : [];
    var impact = [{ p: ranged ? 'burst' : 'slash', at: 'target', element: element, big: !!opts.big, count: opts.count, delay: ranged ? (opts.travelDur || 0.16) : 0.03 }];
    if (opts.shake) impact.push({ p: 'shake', at: 'target', duration: 0.22, magnitude: opts.shake });
    return { sel: opts.sel || 'target', cast: [{ p: 'aura', at: 'caster', element: element, duration: 0.2 }], travel: travel, impact: impact };
};

fx.cone = function(element, opts) {
    opts = opts || {};
    return {
        sel: opts.sel || 'target', radius: opts.radius || 1, anchor: 'target', aoeOn: 'enemies',
        cast: [{ p: 'aura', at: 'caster', element: element, duration: 0.18 }],
        travel: [],
        impact: [
            { p: 'slash', at: 'target', element: element },
            { p: 'burst', at: 'each-target', element: element, count: opts.count || 7, big: !!opts.big, stagger: 0.03, delay: 0.02 }
        ]
    };
};

fx.selfAoe = function(element, opts) {
    opts = opts || {};
    return {
        sel: 'self', radius: opts.radius || 2, anchor: 'caster', aoeOn: 'enemies',
        cast: [{ p: 'groundDecal', at: 'cells', element: element, duration: 0.5, pulse: true }],
        travel: [],
        impact: [
            { p: 'nova', at: 'caster', element: element, radius: opts.radius || 2, duration: 0.45, delay: 0.05 },
            { p: 'burst', at: 'each-target', element: element, count: opts.count || 8, big: !!opts.big, delay: 0.08, stagger: 0.02 }
        ]
    };
};

fx.dash = function(element, opts) {
    opts = opts || {};
    return {
        sel: opts.sel || 'target',
        cast: [{ p: 'aura', at: 'caster', element: element, duration: 0.15 }],
        travel: [{ p: 'beam', at: 'target', element: element, duration: 0.12 }],
        impact: [
            { p: 'slash', at: 'target', element: element, delay: 0.12 },
            { p: 'burst', at: 'target', element: element, big: !!opts.big, delay: 0.14 }
        ]
    };
};

fx.pierce = function(element, opts) {
    opts = opts || {};
    return {
        sel: opts.sel || 'target', pierceSteps: opts.steps || 7,
        cast: [{ p: 'aura', at: 'caster', element: element, duration: 0.15 }],
        travel: [{ p: 'beam', at: 'path', element: element, duration: 0.22 }],
        impact: [{ p: 'burst', at: 'each-target', element: element, count: opts.count || 6, stagger: 0.03, delay: 0.1 }]
    };
};

fx.chain = function(element, opts) {
    opts = opts || {};
    var travel = (opts.ranged === false) ? [] : [{ p: 'projectile', at: 'target', element: element, duration: 0.15 }];
    return {
        sel: opts.sel || 'target', chainBounces: opts.bounces || 2, chainRange: opts.range || 3,
        cast: [{ p: 'aura', at: 'caster', element: element, duration: 0.15 }],
        travel: travel,
        impact: [
            { p: 'chain', at: 'chain', element: element, duration: 0.3, delay: 0.15 },
            { p: 'burst', at: 'each-target', element: element, count: opts.count || 6, stagger: 0.04, delay: 0.18 }
        ]
    };
};

fx.heal = function(element, opts) {
    opts = opts || {};
    var count = opts.allies || 1;
    var sel = count === 1 ? 'lowestHpAlly' : (count === 2 ? 'lowestHpAllies2' : (count === 3 ? 'lowestHpAllies3' : 'lowestHpAllies4'));
    var impact = [
        { p: 'rise', at: 'each-target', color: 0x44ee44, count: opts.count || 6, duration: 0.55, stagger: 0.05 },
        { p: 'shieldPop', at: 'each-target', color: 0x44ee44, duration: 0.3, delay: 0.05, stagger: 0.05 }
    ];
    if (opts.burnNearest) impact.push({ p: 'rise', at: 'casterTarget', element: 'fire', count: 4, duration: 0.4, delay: 0.1 });
    return { sel: sel, cast: [{ p: 'aura', at: 'caster', element: element, duration: 0.2 }], travel: [], impact: impact };
};

fx.shieldAoe = function(element, opts) {
    opts = opts || {};
    var impact = [{ p: 'aura', at: 'caster', element: element, duration: 0.35, delay: 0.05 }];
    if (opts.allies) impact.unshift({ p: 'shieldPop', at: 'each-target', color: 0x4488ff, duration: 0.3, stagger: 0.03, delay: 0.05 });
    return {
        sel: 'self', radius: opts.radius || 2, anchor: 'caster', aoeOn: 'allies',
        cast: [{ p: 'shieldPop', at: 'caster', duration: 0.4 }],
        travel: [],
        impact: impact
    };
};

fx.zoneAoe = function(element, opts) {
    opts = opts || {};
    var travel = (opts.ranged === false) ? [] : [{ p: 'projectile', at: 'target', element: element, arc: true, duration: 0.22 }];
    return {
        sel: opts.sel || 'target', radius: opts.radius || 2, anchor: 'target', aoeOn: 'enemies',
        cast: [{ p: 'aura', at: 'caster', element: element, duration: 0.2 }],
        travel: travel,
        impact: [
            { p: 'groundDecal', at: 'cells', element: element, duration: 0.6, pulse: true, delay: 0.18 },
            { p: 'nova', at: 'target', element: element, radius: opts.radius || 2, duration: 0.5, delay: 0.22 },
            { p: 'burst', at: 'each-target', element: element, count: opts.count || 7, stagger: 0.04, delay: 0.28 }
        ]
    };
};

fx.buffSelf = function(element, opts) {
    opts = opts || {};
    return {
        sel: 'self',
        cast: [{ p: 'aura', at: 'caster', element: element, duration: opts.duration || 0.5 }],
        travel: [],
        impact: opts.beacon ? [{ p: 'beacon', at: 'caster', element: element, duration: 0.4, delay: 0.1 }] : []
    };
};

fx.multiSelect = function(element, opts) {
    opts = opts || {};
    return {
        sel: opts.sel || 'highestAtkEnemies3',
        cast: [{ p: 'aura', at: 'caster', element: element, duration: 0.15 }],
        travel: [{ p: 'projectile', at: 'each-target', element: element, duration: 0.18, stagger: 0.06 }],
        impact: [{ p: 'burst', at: 'each-target', element: element, count: opts.count || 6, stagger: 0.06, delay: 0.22 }]
    };
};

fx.flurry = function(element, opts) {
    // Multi-dash abilities whose real target selection is getRandomAlive()
    // (RNG-driven -- see header) approximate with N staggered strikes on the
    // anchor target rather than re-drawing RNG. Documented judgment call.
    opts = opts || {};
    var hits = opts.hits || 3;
    var impact = [];
    for (var i = 0; i < hits; i++) {
        impact.push({ p: 'slash', at: 'target', element: element, delay: i * 0.12 });
        impact.push({ p: 'burst', at: 'target', element: element, big: i === hits - 1, count: 6, delay: i * 0.12 + 0.03 });
    }
    return { sel: opts.sel || 'target', cast: [{ p: 'aura', at: 'caster', element: element, duration: 0.15 }], travel: [], impact: impact };
};

// evolveRecipe: default "reuse base + intensity/gold-tint" for the majority
// of the 66 evolved abilities whose mechanics are a numeric upgrade of their
// base, not a shape change (the ~12 with a genuine shape change get bespoke
// entries below instead -- see the Prompt 73 report's "distinct-evolved" list).
function evolveRecipe(base, opts) {
    opts = opts || {};
    var mult = opts.mult || 1.15;
    var tint = (opts.tint === undefined) ? ABILITY_VFX_GOLD : opts.tint;
    function scaleStep(step) {
        if (!step) return step;
        var s = {};
        for (var k in step) s[k] = step[k];
        if (s.count) s.count = Math.ceil(s.count * mult);
        if (s.radius) s.radius = Math.round(s.radius * Math.min(mult, 1.3) * 100) / 100;
        if (s.big !== undefined) s.big = true;
        if (tint !== null && (s.p === 'burst' || s.p === 'rise' || s.p === 'nova')) s.accentTint = tint;
        return s;
    }
    function scaleList(list) {
        var out = [];
        for (var i = 0; i < (list || []).length; i++) out.push(scaleStep(list[i]));
        return out;
    }
    var r = {
        sel: base.sel, radius: base.radius, anchor: base.anchor, aoeOn: base.aoeOn,
        pierceSteps: base.pierceSteps, coneSteps: base.coneSteps,
        chainBounces: base.chainBounces, chainRange: base.chainRange
    };
    r.cast = scaleList(base.cast);
    r.travel = scaleList(base.travel);
    r.impact = scaleList(base.impact);
    if (tint !== null) {
        r.impact.push({ p: 'rise', at: 'target', color: tint, count: 3, duration: 0.35, delay: 0.05 });
    }
    return r;
}

// =============================================================================
// ABILITY_VFX -- the 132-entry registry (66 base + 66 evolved), grouped and
// commented to mirror combat-abilities.js's own tier headers exactly, so any
// mismatch is easy to spot on review.
// =============================================================================

var ABILITY_VFX = {};

// ===== FIRE T1 BASE =====
ABILITY_VFX.flame_warrior = fx.cone('fire', { radius: 1, count: 7 });
ABILITY_VFX.ember_scout   = fx.dash('fire', { sel: 'furthestEnemy', big: true });
ABILITY_VFX.cinder_archer = fx.buffSelf('fire', { duration: 0.4, beacon: true });
ABILITY_VFX.fire_acolyte  = fx.heal('fire', { allies: 1, count: 6, burnNearest: true });

// ===== WATER T1 BASE =====
ABILITY_VFX.tide_hunter   = fx.cone('water', { radius: 1, count: 7 });
ABILITY_VFX.frost_archer  = fx.strike('water', { ranged: true, arc: false, shake: 2 });
ABILITY_VFX.reef_stalker  = fx.dash('water', { sel: 'furthestEnemy' });
ABILITY_VFX.coral_priest  = fx.heal('water', { allies: 2, count: 6 });

// ===== EARTH T1 BASE =====
ABILITY_VFX.stone_guard      = fx.shieldAoe('earth', { radius: 2, allies: true });
ABILITY_VFX.bramble_knight   = { // strike + self/ally shield combo, bespoke (two distinct shapes in one cast)
    sel: 'target', radius: 1, anchor: 'caster', aoeOn: 'enemies',
    cast: [{ p: 'aura', at: 'caster', element: 'earth', duration: 0.18 }],
    travel: [],
    impact: [
        { p: 'burst', at: 'each-target', element: 'earth', count: 7, delay: 0.03 },
        { p: 'shieldPop', at: 'caster', duration: 0.35, delay: 0.1 }
    ]
};
ABILITY_VFX.seedling_archer   = fx.strike('earth', { ranged: true, shake: 2 });
ABILITY_VFX.earth_shaman      = fx.heal('earth', { allies: 2, count: 6 });

// ===== WIND T1 BASE =====
ABILITY_VFX.zephyr_scout  = fx.dash('wind', { big: true });
ABILITY_VFX.wind_archer   = fx.pierce('wind', { steps: 7, count: 6 });
ABILITY_VFX.gale_dancer   = fx.heal('wind', { allies: 2, count: 5 });
ABILITY_VFX.wind_squire   = fx.cone('wind', { radius: 1, count: 6 });

// ===== LIGHTNING T1 BASE =====
ABILITY_VFX.spark_fencer   = fx.cone('lightning', { radius: 1, count: 6 });
ABILITY_VFX.volt_runner    = fx.dash('lightning', { big: true });
ABILITY_VFX.thunder_archer = fx.chain('lightning', { bounces: 2, range: 3, count: 5 });
ABILITY_VFX.pulse_mender   = fx.heal('lightning', { allies: 1, count: 5 });

// ===== FORCE T1 BASE =====
ABILITY_VFX.iron_soldier  = fx.strike('force', { shake: 3 });
ABILITY_VFX.shadow_blade  = fx.dash('force', { big: true });
ABILITY_VFX.steel_archer  = fx.pierce('force', { steps: 7, count: 6 });

// ===== FIRE T1 EVOLVED =====
ABILITY_VFX.fire_berserker  = evolveRecipe(ABILITY_VFX.flame_warrior, { mult: 1.25 });
ABILITY_VFX.flame_rogue     = evolveRecipe(ABILITY_VFX.ember_scout, { mult: 1.2 });
ABILITY_VFX.cinder_marksman = { // 2 arrows -- distinct multi-shot shape from cinder_archer's single empowered swing
    sel: 'target',
    cast: [{ p: 'aura', at: 'caster', element: 'fire', duration: 0.15 }],
    travel: [
        { p: 'projectile', at: 'target', element: 'fire', duration: 0.14 },
        { p: 'projectile', at: 'target', element: 'fire', duration: 0.14, delay: 0.08 }
    ],
    impact: [
        { p: 'burst', at: 'target', element: 'fire', count: 6, delay: 0.14 },
        { p: 'rise', at: 'target', element: 'fire', count: 4, delay: 0.22, duration: 0.4 }
    ]
};
ABILITY_VFX.ember_saint = evolveRecipe(ABILITY_VFX.fire_acolyte, { mult: 1.15 });

// ===== WATER T1 EVOLVED =====
// tsunami_blade: DISTINCT (Task 2) -- tide_hunter's cone slash becomes a
// genuine 3-step LINE PIERCE in the evolved form (abilityPierceTargets, not
// getUnitsInRadius -- a real shape change, not just bigger numbers).
ABILITY_VFX.tsunami_blade = fx.pierce('water', { steps: 3, count: 5 });
ABILITY_VFX.ice_sniper    = evolveRecipe(ABILITY_VFX.frost_archer, { mult: 1.15 });
ABILITY_VFX.tidal_phantom = evolveRecipe(ABILITY_VFX.reef_stalker, { mult: 1.2 });
ABILITY_VFX.ocean_sage    = evolveRecipe(ABILITY_VFX.coral_priest, { mult: 1.15, allies: 3 });
ABILITY_VFX.ocean_sage.sel = 'lowestHpAllies3';

// ===== EARTH T1 EVOLVED =====
ABILITY_VFX.mountain_lord = { // DISTINCT (Task 2) -- adds a DR-transfer link beam from caster to shielded allies
    sel: 'self', radius: 2, anchor: 'caster', aoeOn: 'allies',
    cast: [{ p: 'shieldPop', at: 'caster', duration: 0.4 }],
    travel: [],
    impact: [
        { p: 'shieldPop', at: 'each-target', color: 0x4488ff, duration: 0.3, stagger: 0.03, delay: 0.05 },
        { p: 'chain', at: 'chain', element: 'earth', duration: 0.35, delay: 0.15 },
        { p: 'aura', at: 'caster', element: 'earth', duration: 0.35, delay: 0.05 }
    ]
};
ABILITY_VFX.ironwood_sentinel = evolveRecipe(ABILITY_VFX.bramble_knight, { mult: 1.15 });
ABILITY_VFX.thornwood_ranger  = evolveRecipe(ABILITY_VFX.seedling_archer, { mult: 1.15 });
ABILITY_VFX.gaia_priest       = evolveRecipe(ABILITY_VFX.earth_shaman, { mult: 1.2, allies: 3 });
ABILITY_VFX.gaia_priest.sel   = 'lowestHpAllies3';

// ===== WIND T1 EVOLVED =====
ABILITY_VFX.storm_assassin = evolveRecipe(ABILITY_VFX.zephyr_scout, { mult: 1.2 });
ABILITY_VFX.gale_sniper    = evolveRecipe(ABILITY_VFX.wind_archer, { mult: 1.15 });
ABILITY_VFX.stormweaver    = evolveRecipe(ABILITY_VFX.gale_dancer, { mult: 1.2, allies: 3 });
ABILITY_VFX.stormweaver.sel = 'lowestHpAllies3';
ABILITY_VFX.zephyr_warrior = evolveRecipe(ABILITY_VFX.wind_squire, { mult: 1.2, radius: 3 });

// ===== LIGHTNING T1 EVOLVED =====
ABILITY_VFX.arc_duelist       = evolveRecipe(ABILITY_VFX.spark_fencer, { mult: 1.2 });
ABILITY_VFX.lightning_phantom = { // DISTINCT (Task 2) -- adds a double-strike echo on crit (visualized unconditionally as flavor)
    sel: 'target',
    cast: [{ p: 'aura', at: 'caster', element: 'lightning', duration: 0.15 }],
    travel: [{ p: 'beam', at: 'target', element: 'lightning', duration: 0.1 }],
    impact: [
        { p: 'slash', at: 'target', element: 'lightning', delay: 0.1 },
        { p: 'burst', at: 'target', element: 'lightning', big: true, delay: 0.12 },
        { p: 'slash', at: 'target', element: 'lightning', color: ABILITY_VFX_GOLD, delay: 0.24 },
        { p: 'burst', at: 'target', element: 'lightning', color: ABILITY_VFX_GOLD, count: 8, delay: 0.27 }
    ]
};
ABILITY_VFX.storm_archer = evolveRecipe(ABILITY_VFX.thunder_archer, { mult: 1.15, bounces: 2 });
ABILITY_VFX.storm_medic  = evolveRecipe(ABILITY_VFX.pulse_mender, { mult: 1.2 });

// ===== FORCE T1 EVOLVED =====
ABILITY_VFX.legionnaire     = evolveRecipe(ABILITY_VFX.iron_soldier, { mult: 1.2 });
ABILITY_VFX.night_stalker   = { // DISTINCT (Task 2) -- adds a lifesteal drain-back visual (a "rise" of HP flowing to caster)
    sel: 'target',
    cast: [{ p: 'aura', at: 'caster', element: 'force', duration: 0.15 }],
    travel: [{ p: 'beam', at: 'target', element: 'force', duration: 0.12 }],
    impact: [
        { p: 'slash', at: 'target', element: 'force', delay: 0.12 },
        { p: 'burst', at: 'target', element: 'force', big: true, delay: 0.14 },
        { p: 'rise', at: 'target', color: 0x44ee44, count: 4, duration: 0.45, delay: 0.2 },
        { p: 'rise', at: 'caster', color: 0x44ee44, count: 4, duration: 0.35, delay: 0.32 }
    ]
};
ABILITY_VFX.ballista_archer = evolveRecipe(ABILITY_VFX.steel_archer, { mult: 1.2 });

// ===== FIRE T2 BASE =====
ABILITY_VFX.magma_knight = fx.selfAoe('fire', { radius: 2.5, count: 9, big: true });
ABILITY_VFX.blaze_lancer = fx.dash('fire', { big: true });

// ===== WATER T2 BASE =====
ABILITY_VFX.hydro_mage   = fx.chain('water', { bounces: 1, range: 3, count: 5, ranged: true });
ABILITY_VFX.shell_knight = { // shield self + all Water allies (not radius-bound) -- explicit waterAllies selector
    sel: 'self',
    cast: [{ p: 'shieldPop', at: 'caster', duration: 0.4 }],
    travel: [],
    impact: [{ p: 'shieldPop', at: 'each-target', sel: 'waterAllies', color: 0x4488ff, duration: 0.3, stagger: 0.03, delay: 0.05 }]
};

// ===== EARTH T2 BASE =====
ABILITY_VFX.crystal_mage = fx.cone('earth', { radius: 1, count: 8, ranged: true });
ABILITY_VFX.crystal_mage.travel = [{ p: 'projectile', at: 'target', element: 'earth', duration: 0.18 }];
ABILITY_VFX.mud_stalker  = fx.dash('earth', { sel: 'furthestEnemy', big: true });

// ===== WIND T2 BASE =====
ABILITY_VFX.sky_knight    = fx.shieldAoe('wind', { radius: 2.5, allies: true });
ABILITY_VFX.gust_sentinel = fx.shieldAoe('wind', { radius: 2.5, allies: false });

// ===== LIGHTNING T2 BASE =====
ABILITY_VFX.tesla_knight = fx.shieldAoe('lightning', { radius: 1, allies: true });
ABILITY_VFX.shock_mage   = fx.chain('lightning', { bounces: 2, range: 3, count: 6 });

// ===== FORCE T2 BASE =====
ABILITY_VFX.war_cleric = { // dual heal + strike shape -- heal beam at lowest-HP ally, dart at caster's engaged enemy
    sel: 'lowestHpAlly',
    cast: [{ p: 'aura', at: 'caster', element: 'force', duration: 0.2 }],
    travel: [],
    impact: [
        { p: 'rise', at: 'target', color: 0x44ee44, count: 5, duration: 0.5 },
        { p: 'shieldPop', at: 'target', color: 0x44ee44, duration: 0.3, delay: 0.05 },
        { p: 'burst', at: 'casterTarget', element: 'force', count: 5, delay: 0.15 }
    ]
};
ABILITY_VFX.battle_mage    = fx.strike('force', { ranged: true, shake: 4 });
ABILITY_VFX.shield_bearer  = fx.shieldAoe('force', { radius: 2.5, allies: true });

// ===== FIRE T2 EVOLVED =====
ABILITY_VFX.volcano_titan  = evolveRecipe(ABILITY_VFX.magma_knight, { mult: 1.3, radius: 3 });
ABILITY_VFX.inferno_lancer = evolveRecipe(ABILITY_VFX.blaze_lancer, { mult: 1.15 });

// ===== WATER T2 EVOLVED =====
ABILITY_VFX.abyssal_mage      = evolveRecipe(ABILITY_VFX.hydro_mage, { mult: 1.2, bounces: 2 });
ABILITY_VFX.armored_sentinel  = evolveRecipe(ABILITY_VFX.shell_knight, { mult: 1.15 });

// ===== EARTH T2 EVOLVED =====
ABILITY_VFX.geomancer     = evolveRecipe(ABILITY_VFX.crystal_mage, { mult: 1.2, radius: 3 });
ABILITY_VFX.quake_reaper  = { // DISTINCT (Task 2) -- mud_stalker's single-target crit becomes an AoE emerge (shape change)
    sel: 'furthestEnemy', radius: 2, anchor: 'target', aoeOn: 'enemies',
    cast: [{ p: 'aura', at: 'caster', element: 'earth', duration: 0.15 }],
    travel: [{ p: 'beam', at: 'target', element: 'earth', duration: 0.12 }],
    impact: [
        { p: 'groundDecal', at: 'cells', element: 'earth', duration: 0.5, pulse: true, delay: 0.12 },
        { p: 'nova', at: 'target', element: 'earth', radius: 2, duration: 0.45, delay: 0.15 },
        { p: 'burst', at: 'each-target', element: 'earth', count: 8, stagger: 0.03, delay: 0.2, big: true }
    ]
};

// ===== WIND T2 EVOLVED =====
ABILITY_VFX.aegis_paladin    = evolveRecipe(ABILITY_VFX.sky_knight, { mult: 1.2, radius: 3 });
ABILITY_VFX.tempest_guardian = evolveRecipe(ABILITY_VFX.gust_sentinel, { mult: 1.2, radius: 3 });

// ===== LIGHTNING T2 EVOLVED =====
ABILITY_VFX.storm_bastion = evolveRecipe(ABILITY_VFX.tesla_knight, { mult: 1.2, radius: 2 });
ABILITY_VFX.tempest_mage  = evolveRecipe(ABILITY_VFX.shock_mage, { mult: 1.2, bounces: 3 });

// ===== FORCE T2 EVOLVED =====
ABILITY_VFX.battle_priest = { // DISTINCT (Task 2) -- war_cleric's single-dart hit becomes a real AoE nova at caster
    sel: 'lowestHpAllies2',
    cast: [{ p: 'aura', at: 'caster', element: 'force', duration: 0.2 }],
    travel: [],
    impact: [
        { p: 'rise', at: 'each-target', color: 0x44ee44, count: 5, duration: 0.5, stagger: 0.05 },
        { p: 'shieldPop', at: 'each-target', color: 0x44ee44, duration: 0.3, delay: 0.05, stagger: 0.05 },
        { p: 'nova', at: 'caster', element: 'force', radius: 2, duration: 0.4, delay: 0.15 },
        { p: 'burst', at: 'caster', element: 'force', count: 8, delay: 0.2 }
    ]
};
ABILITY_VFX.force_archmage = evolveRecipe(ABILITY_VFX.battle_mage, { mult: 1.2 });
ABILITY_VFX.bastion        = evolveRecipe(ABILITY_VFX.shield_bearer, { mult: 1.2 });

// ===== COST 3 BASE =====
ABILITY_VFX.pyromancer     = fx.zoneAoe('fire', { radius: 2, count: 9, ranged: false, sel: 'target' });
ABILITY_VFX.inferno_fox    = fx.flurry('fire', { hits: 3 });
ABILITY_VFX.tidal_shaman   = { // heal ALL Water allies (unbounded, not a fixed-count select)
    sel: 'waterAllies',
    cast: [{ p: 'aura', at: 'caster', element: 'water', duration: 0.25 }],
    travel: [],
    impact: [{ p: 'rise', at: 'each-target', color: 0x44ee44, count: 5, duration: 0.5, stagger: 0.04 }]
};
ABILITY_VFX.riptide_blade  = fx.selfAoe('water', { radius: 2, count: 8 });
ABILITY_VFX.golem          = fx.selfAoe('earth', { radius: 2, count: 7, big: true });
ABILITY_VFX.terra_sage     = fx.multiSelect('earth', { sel: 'highestAtkEnemies3', count: 5 });
ABILITY_VFX.monsoon_caller = fx.zoneAoe('wind', { radius: 2, count: 8 });
ABILITY_VFX.wind_duelist   = fx.selfAoe('wind', { radius: 2, count: 8 });
ABILITY_VFX.ball_lightning = fx.chain('lightning', { bounces: 5, range: 2, count: 7 });
ABILITY_VFX.thunder_warden = fx.selfAoe('lightning', { radius: 2, count: 7 });
ABILITY_VFX.gladiator      = fx.strike('force', { big: true, shake: 4 });
ABILITY_VFX.fortress       = { // self buff + taunt zone (no damage) -- buff aura + warning decal, not a burst
    sel: 'self', radius: 2, anchor: 'caster', aoeOn: 'enemies',
    cast: [{ p: 'aura', at: 'caster', element: 'force', duration: 0.6 }],
    travel: [],
    impact: [{ p: 'groundDecal', at: 'cells', element: 'force', duration: 0.7, pulse: true, delay: 0.1 }]
};

// ===== COST 4 BASE (working) =====
ABILITY_VFX.fire_dragon = { // real mechanic is a cone (abilityConeCells), not a pierce line
    sel: 'target', coneSteps: 3,
    cast: [{ p: 'aura', at: 'caster', element: 'fire', duration: 0.2 }],
    travel: [{ p: 'beam', at: 'path', element: 'fire', duration: 0.2 }],
    impact: [
        { p: 'groundDecal', at: 'cells', element: 'fire', duration: 0.5, pulse: true, delay: 0.15 },
        { p: 'burst', at: 'each-target', element: 'fire', count: 8, big: true, stagger: 0.03, delay: 0.2 },
        { p: 'shake', at: 'target', duration: 0.3, magnitude: 5, delay: 0.2 }
    ]
};
ABILITY_VFX.kraken          = fx.zoneAoe('water', { radius: 2, count: 9, big: true });
ABILITY_VFX.ancient_treant  = fx.strike('earth', { big: true, shake: 4 });
ABILITY_VFX.storm_sovereign = { // teleport to lowest-HP enemy + splash
    sel: 'lowestHpEnemy', radius: 1, anchor: 'target', aoeOn: 'enemies',
    cast: [{ p: 'aura', at: 'caster', element: 'wind', duration: 0.15 }],
    travel: [{ p: 'beam', at: 'target', element: 'wind', duration: 0.12 }],
    impact: [
        { p: 'slash', at: 'target', element: 'wind', delay: 0.12 },
        { p: 'burst', at: 'each-target', element: 'wind', count: 8, big: true, stagger: 0.03, delay: 0.16 }
    ]
};
ABILITY_VFX.thunderbird = fx.chain('lightning', { sel: 'lowestHpEnemy', bounces: 2, range: 2, count: 7, ranged: false });
ABILITY_VFX.thunderbird.travel = [{ p: 'beam', at: 'target', element: 'lightning', duration: 0.12 }];
ABILITY_VFX.siege_engineer = fx.zoneAoe('force', { sel: 'furthestEnemy', radius: 2, count: 6, ranged: true });

// ===== COST 4 BASE (no executeAbility case yet -- see Prompt 73 report) =====
// These 6 units (one per element) have full ABILITY_DATA/mana-cast wiring
// but combat-abilities.js's switch has no matching `case` for them (falls
// through to `default: break;`), so their cast currently does nothing
// mechanically. abilityCast still fires for them (emitted unconditionally
// before the switch), so a themed recipe here is still worthwhile pure
// VFX polish -- it makes the cast read as real even though the numeric
// effect is a pre-existing gap this prompt does not fix (zero logic
// changes; flagged separately, not implemented here).
ABILITY_VFX.ashen_watcher   = fx.heal('fire', { allies: 1, count: 10 }); // "Pyre of Renewal" -- column of flame heal
ABILITY_VFX.abyssal_guardian = fx.selfAoe('water', { radius: 2, count: 8, big: true }); // "Tidal Fortress" zone slam
ABILITY_VFX.grove_warden    = fx.strike('earth', { ranged: true, shake: 2 }); // "Thornstorm" -- approximated as themed shots (real ability is 5 random projectiles; getRandomAlive is RNG-driven, see header)
ABILITY_VFX.tempest_weaver  = fx.strike('wind', { ranged: true, arc: true }); // "Cyclone Barrage" knockback bolt
ABILITY_VFX.voltfang_stalker = fx.dash('lightning', { sel: 'lowestHpEnemy', big: true }); // "Lightning Pounce"
ABILITY_VFX.iron_duelist    = fx.buffSelf('force', { duration: 0.4, beacon: true }); // "Decisive Strike" -- empowered next auto-attack

// ===== COST 5 (T5 legendary passives) =====
// Never fire via 'abilityCast' (maxMana 0 -- see combat-legendary.js), but
// still given a recipe here for registry completeness / consistency; the
// REAL signature-moment playback for these 6 (+6 evolved) goes through the
// new 'legendaryTrigger' event dispatcher below (Task 2).
ABILITY_VFX.phoenix     = fx.buffSelf('fire', { duration: 0.6, beacon: true });
ABILITY_VFX.leviathan   = fx.buffSelf('water', { duration: 0.6, beacon: true });
ABILITY_VFX.world_tree  = fx.buffSelf('earth', { duration: 0.6, beacon: true });
ABILITY_VFX.void_wyrm   = fx.buffSelf('wind', { duration: 0.6, beacon: true });
ABILITY_VFX.storm_dragon = fx.buffSelf('lightning', { duration: 0.6, beacon: true });
ABILITY_VFX.titan_lord  = fx.buffSelf('force', { duration: 0.6, beacon: true });

// ===== COST 3 EVOLVED =====
ABILITY_VFX.arcane_inferno   = evolveRecipe(ABILITY_VFX.pyromancer, { mult: 1.25, radius: 2 });
ABILITY_VFX.ninetail_blaze   = { // DISTINCT (Task 2) -- inferno_fox's 3 discrete dashes become a connected fire-trail flurry (5 hits, chained visually)
    sel: 'target',
    cast: [{ p: 'aura', at: 'caster', element: 'fire', duration: 0.15 }],
    travel: [],
    impact: [
        { p: 'slash', at: 'target', element: 'fire', delay: 0 },
        { p: 'rise', at: 'target', element: 'fire', count: 4, duration: 0.4, delay: 0.02 },
        { p: 'slash', at: 'target', element: 'fire', delay: 0.11 },
        { p: 'rise', at: 'target', element: 'fire', count: 4, duration: 0.4, delay: 0.13 },
        { p: 'slash', at: 'target', element: 'fire', delay: 0.22 },
        { p: 'rise', at: 'target', element: 'fire', count: 4, duration: 0.4, delay: 0.24 },
        { p: 'slash', at: 'target', element: 'fire', delay: 0.33 },
        { p: 'rise', at: 'target', element: 'fire', count: 4, duration: 0.4, delay: 0.35 },
        { p: 'slash', at: 'target', element: 'fire', delay: 0.44, color: ABILITY_VFX_GOLD },
        { p: 'burst', at: 'target', element: 'fire', big: true, count: 12, delay: 0.47, color: ABILITY_VFX_GOLD }
    ]
};
ABILITY_VFX.stormtide_oracle = evolveRecipe(ABILITY_VFX.tidal_shaman, { mult: 1.2 });
ABILITY_VFX.tsunami_warlord  = evolveRecipe(ABILITY_VFX.riptide_blade, { mult: 1.2 });
ABILITY_VFX.iron_colossus    = evolveRecipe(ABILITY_VFX.golem, { mult: 1.3, radius: 2 });
ABILITY_VFX.earthweaver      = evolveRecipe(ABILITY_VFX.terra_sage, { mult: 1.2 });
ABILITY_VFX.tempest_lord     = evolveRecipe(ABILITY_VFX.monsoon_caller, { mult: 1.3, radius: 3 });
ABILITY_VFX.hurricane_blade  = evolveRecipe(ABILITY_VFX.wind_duelist, { mult: 1.25, radius: 2 });
ABILITY_VFX.plasma_core      = { // DISTINCT (Task 2) -- ball_lightning's single orb becomes TWO simultaneous chained orbs
    sel: 'target',
    cast: [{ p: 'aura', at: 'caster', element: 'lightning', duration: 0.15 }],
    travel: [
        { p: 'projectile', at: 'target', element: 'lightning', duration: 0.14 },
        { p: 'projectile', at: 'target', element: 'lightning', duration: 0.14, delay: 0.05, color: ABILITY_VFX_GOLD }
    ],
    impact: [
        { p: 'chain', at: 'chain', element: 'lightning', duration: 0.3, delay: 0.16 },
        { p: 'chain', at: 'chain', element: 'lightning', color: ABILITY_VFX_GOLD, duration: 0.3, delay: 0.2 },
        { p: 'burst', at: 'each-target', element: 'lightning', count: 8, stagger: 0.04, delay: 0.22 }
    ],
    chainBounces: 3, chainRange: 2
};
ABILITY_VFX.storm_fortress = { // DISTINCT (Task 2) -- thunder_warden's simple self-pulse becomes a persistent lightning "prison" cage decal
    sel: 'self', radius: 2, anchor: 'caster', aoeOn: 'enemies',
    cast: [{ p: 'groundDecal', at: 'cells', element: 'lightning', duration: 0.9, pulse: true }],
    travel: [],
    impact: [
        { p: 'nova', at: 'caster', element: 'lightning', radius: 2, duration: 0.5, delay: 0.1 },
        { p: 'burst', at: 'each-target', element: 'lightning', count: 8, stagger: 0.03, delay: 0.15 }
    ]
};
ABILITY_VFX.champion = { // DISTINCT (Task 2) -- gladiator's single strike gains an on-kill shockwave ripple flourish
    sel: 'target',
    cast: [{ p: 'aura', at: 'caster', element: 'force', duration: 0.2 }],
    travel: [],
    impact: [
        { p: 'slash', at: 'target', element: 'force', big: true, delay: 0.03 },
        { p: 'shake', at: 'target', duration: 0.25, magnitude: 5, delay: 0.03 },
        { p: 'nova', at: 'target', element: 'force', radius: 1.5, duration: 0.35, delay: 0.16, color: ABILITY_VFX_GOLD },
        { p: 'burst', at: 'target', element: 'force', count: 10, delay: 0.2, color: ABILITY_VFX_GOLD }
    ]
};
ABILITY_VFX.citadel      = evolveRecipe(ABILITY_VFX.fortress, { mult: 1.2, radius: 2 });

// ===== COST 4 EVOLVED (working base) =====
ABILITY_VFX.elder_wyrm      = evolveRecipe(ABILITY_VFX.fire_dragon, { mult: 1.2, coneSteps: 4 });
ABILITY_VFX.abyssal_terror  = { // DISTINCT (Task 2) -- kraken's pulse zone gains a continuous inward-drag whirlpool feel
    sel: 'target', radius: 2, anchor: 'target', aoeOn: 'enemies',
    cast: [{ p: 'aura', at: 'caster', element: 'water', duration: 0.2 }],
    travel: [{ p: 'projectile', at: 'target', element: 'water', arc: true, duration: 0.22 }],
    impact: [
        { p: 'groundDecal', at: 'cells', element: 'water', duration: 0.9, pulse: true, delay: 0.18 },
        { p: 'nova', at: 'target', element: 'water', radius: 2.2, duration: 0.6, delay: 0.22 },
        { p: 'rise', at: 'each-target', element: 'water', count: 5, duration: 0.5, fall: true, stagger: 0.04, delay: 0.3 },
        { p: 'burst', at: 'target', element: 'water', big: true, count: 10, delay: 0.55 }
    ]
};
ABILITY_VFX.world_sentinel   = evolveRecipe(ABILITY_VFX.ancient_treant, { mult: 1.25 });
ABILITY_VFX.tempest_emperor  = evolveRecipe(ABILITY_VFX.storm_sovereign, { mult: 1.25, radius: 2 });
ABILITY_VFX.roc_of_storms    = evolveRecipe(ABILITY_VFX.thunderbird, { mult: 1.2 });
ABILITY_VFX.war_architect    = evolveRecipe(ABILITY_VFX.siege_engineer, { mult: 1.25, radius: 2 });

// ===== COST 4 EVOLVED (no executeAbility case yet -- see base-tier comment above) =====
ABILITY_VFX.phoenix_priest      = evolveRecipe(ABILITY_VFX.ashen_watcher, { mult: 1.2 });
ABILITY_VFX.hadal_colossus      = evolveRecipe(ABILITY_VFX.abyssal_guardian, { mult: 1.2, radius: 3 });
ABILITY_VFX.worldroot_sentinel  = { // DISTINCT (Task 2) -- grove_warden's themed shots gain persistent "seedling" hazard decals on each hit
    sel: 'target',
    cast: [{ p: 'aura', at: 'caster', element: 'earth', duration: 0.15 }],
    travel: [{ p: 'projectile', at: 'target', element: 'earth', arc: true, duration: 0.18 }],
    impact: [
        { p: 'burst', at: 'target', element: 'earth', big: true, delay: 0.18 },
        { p: 'groundDecal', at: 'target', element: 'earth', duration: 1.2, pulse: true, delay: 0.2 },
        { p: 'rise', at: 'target', element: 'earth', count: 4, duration: 0.4, delay: 0.25 }
    ]
};
ABILITY_VFX.stormweft_oracle    = evolveRecipe(ABILITY_VFX.tempest_weaver, { mult: 1.2 });
ABILITY_VFX.plasma_ravager      = evolveRecipe(ABILITY_VFX.voltfang_stalker, { mult: 1.25 });
ABILITY_VFX.warforged_champion  = evolveRecipe(ABILITY_VFX.iron_duelist, { mult: 1.2 });

// ===== COST 5 (T5 legendary passives, evolved) =====
// Same registry-completeness note as their base forms above -- real playback
// is via the 'legendaryTrigger' dispatcher (Task 2, below).
ABILITY_VFX.eternal_phoenix      = evolveRecipe(ABILITY_VFX.phoenix, { mult: 1.2 });
ABILITY_VFX.primordial_leviathan = evolveRecipe(ABILITY_VFX.leviathan, { mult: 1.2 });
ABILITY_VFX.yggdrasil            = evolveRecipe(ABILITY_VFX.world_tree, { mult: 1.2 });
ABILITY_VFX.dimensional_dragon   = evolveRecipe(ABILITY_VFX.void_wyrm, { mult: 1.2 });
ABILITY_VFX.thunder_god          = evolveRecipe(ABILITY_VFX.storm_dragon, { mult: 1.2 });
ABILITY_VFX.cosmic_titan         = evolveRecipe(ABILITY_VFX.titan_lord, { mult: 1.2 });

// =============================================================================
// Entry point 1: per-unit ability casts. Called from js/vfx.js's
// combatEvents.onPersistent('abilityCast', ...) handler (typeof-checked
// there so load order doesn't matter). Returns true when it played a
// recipe (explicit or element/archetype default) so the generic aura+
// beacon fallback in vfx.js is skipped for every one of the 132 keys.
// =============================================================================

function ABILITY_VFX_PLAY_CAST(p) {
    if (!p || !p.caster || !p.key) return false;
    var recipe = ABILITY_VFX_RESOLVE(p.key, p.caster);
    if (!recipe) return false;
    return abilityVfxRun(recipe, p.caster);
}

// =============================================================================
// Entry point 2 (Task 2, signature moments): the 6 T5 legendary passives.
// These never fire 'abilityCast' (maxMana 0 -- see combat-legendary.js), so
// they're driven off the new 'legendaryTrigger' event instead (payload
// already carries the real targets combat-legendary.js computed for its own
// damage/heal calls -- no re-derivation needed). Hand-tuned, bigger, one-off
// compositions built directly with abilityVfxSchedule rather than the
// sel/recipe machinery (the payload already IS the resolved context).
// =============================================================================

function abilityVfxLegendaryPhoenix(p) {
    var c = p.caster, targets = p.targets || [];
    var jobs = [
        { delay: 0,    fn: function() { VFX.play('groundDecal', { row: c.gridRow, col: c.gridCol, element: 'fire', duration: 0.9, pulse: true }); } },
        { delay: 0.05, fn: function() { VFX.play('aura', { unit: c, element: 'fire', duration: 1.0 }); } },
        { delay: 0.15, fn: function() { VFX.play('nova', { row: c.gridRow, col: c.gridCol, element: 'fire', radius: 2.6, duration: 0.65 }); } },
        { delay: 0.2,  fn: function() { VFX.play('burst', { row: c.gridRow, col: c.gridCol, element: 'fire', big: true, count: 20 }); } },
        { delay: 0.25, fn: function() { VFX.play('rise', { row: c.gridRow, col: c.gridCol, element: 'fire', count: 16, duration: 1.0 }); } }
    ];
    for (var i = 0; i < targets.length; i++) {
        (function(u, idx) { jobs.push({ delay: 0.3 + idx * 0.04, fn: function() { VFX.play('burst', { row: u.gridRow, col: u.gridCol, element: 'fire', big: true, count: 9 }); } }); })(targets[i], i);
    }
    abilityVfxSchedule(jobs);
}

function abilityVfxLegendaryLeviathan(p) {
    var c = p.caster, targets = p.targets || [];
    var jobs = [
        { delay: 0,    fn: function() { VFX.play('shieldPop', { unit: c, duration: 0.5, color: 0x4488ff }); } },
        { delay: 0.05, fn: function() { VFX.play('nova', { row: c.gridRow, col: c.gridCol, element: 'water', radius: 2.2, duration: 0.6 }); } },
        { delay: 0.1,  fn: function() { VFX.play('aura', { unit: c, element: 'water', duration: 0.8 }); } }
    ];
    for (var i = 0; i < targets.length; i++) {
        (function(u, idx) { jobs.push({ delay: 0.15 + idx * 0.03, fn: function() { VFX.play('shieldPop', { unit: u, duration: 0.35, color: 0x4488ff }); } }); })(targets[i], i);
    }
    abilityVfxSchedule(jobs);
}

function abilityVfxLegendaryWorldTree(p) {
    var c = p.caster, targets = p.targets || [];
    var jobs = [
        { delay: 0,    fn: function() { VFX.play('aura', { unit: c, element: 'earth', duration: 0.7 }); } },
        { delay: 0.05, fn: function() { VFX.play('beacon', { row: c.gridRow, col: c.gridCol, element: 'earth', duration: 0.6 }); } }
    ];
    for (var i = 0; i < targets.length; i++) {
        (function(u, idx) {
            jobs.push({ delay: 0.1 + idx * 0.06, fn: function() { VFX.play('rise', { row: u.gridRow, col: u.gridCol, color: 0x44ee44, count: 9, duration: 0.7 }); } });
            jobs.push({ delay: 0.15 + idx * 0.06, fn: function() { VFX.play('shieldPop', { unit: u, duration: 0.35, color: 0x44ee44 }); } });
        })(targets[i], i);
    }
    abilityVfxSchedule(jobs);
}

function abilityVfxLegendaryVoidWyrm(p) {
    var c = p.caster, targets = p.targets || [];
    var jobs = [{ delay: 0, fn: function() { VFX.play('aura', { unit: c, element: 'wind', duration: 0.4 }); } }];
    for (var i = 0; i < targets.length; i++) {
        (function(u, idx) {
            jobs.push({ delay: 0.03 + idx * 0.05, fn: function() { VFX.play('beam', { fromUnit: c, toUnit: u, element: 'wind', duration: 0.18 }); } });
            jobs.push({ delay: 0.2 + idx * 0.05, fn: function() { VFX.play('burst', { row: u.gridRow, col: u.gridCol, element: 'wind', count: 7 }); } });
        })(targets[i], i);
    }
    abilityVfxSchedule(jobs);
}

function abilityVfxLegendaryStormDragon(p) {
    var c = p.caster, target = p.target, targets = p.targets || [];
    var jobs = [{ delay: 0, fn: function() { VFX.play('aura', { unit: c, element: 'lightning', duration: 0.4 }); } }];
    if (target) {
        jobs.push({ delay: 0.05, fn: function() { VFX.play('beam', { fromUnit: c, toUnit: target, element: 'lightning', duration: 0.15 }); } });
        jobs.push({ delay: 0.2, fn: function() { VFX.play('burst', { row: target.gridRow, col: target.gridCol, element: 'lightning', big: true, count: 14 }); } });
    }
    jobs.push({ delay: 0.25, fn: function() { VFX.play('chain', { points: [c].concat(targets), element: 'lightning', duration: 0.35 }); } });
    for (var i = 0; i < targets.length; i++) {
        (function(u, idx) { jobs.push({ delay: 0.3 + idx * 0.04, fn: function() { VFX.play('burst', { row: u.gridRow, col: u.gridCol, element: 'lightning', count: 7, stagger: 0.03 }); } }); })(targets[i], i);
    }
    abilityVfxSchedule(jobs);
}

function abilityVfxLegendaryTitanLord(p) {
    var c = p.caster, targets = p.targets || [];
    var jobs = [
        { delay: 0,    fn: function() { VFX.play('groundDecal', { row: c.gridRow, col: c.gridCol, element: 'force', duration: 0.6, pulse: true }); } },
        { delay: 0.05, fn: function() { VFX.play('shake', { unit: c, duration: 0.3, magnitude: 6 }); } },
        { delay: 0.1,  fn: function() { VFX.play('nova', { row: c.gridRow, col: c.gridCol, element: 'force', radius: 2.4, duration: 0.55 }); } }
    ];
    for (var i = 0; i < targets.length; i++) {
        (function(u, idx) { jobs.push({ delay: 0.15 + idx * 0.03, fn: function() { VFX.play('burst', { row: u.gridRow, col: u.gridCol, element: 'force', big: true, count: 9 }); } }); })(targets[i], i);
    }
    abilityVfxSchedule(jobs);
}

var ABILITY_VFX_LEGENDARY_FN = {
    phoenix: abilityVfxLegendaryPhoenix, eternal_phoenix: abilityVfxLegendaryPhoenix,
    leviathan: abilityVfxLegendaryLeviathan, primordial_leviathan: abilityVfxLegendaryLeviathan,
    world_tree: abilityVfxLegendaryWorldTree, yggdrasil: abilityVfxLegendaryWorldTree,
    void_wyrm: abilityVfxLegendaryVoidWyrm, dimensional_dragon: abilityVfxLegendaryVoidWyrm,
    storm_dragon: abilityVfxLegendaryStormDragon, thunder_god: abilityVfxLegendaryStormDragon,
    titan_lord: abilityVfxLegendaryTitanLord, cosmic_titan: abilityVfxLegendaryTitanLord
};

if (typeof combatEvents !== 'undefined' && typeof combatEvents.onPersistent === 'function') {
    combatEvents.onPersistent('legendaryTrigger', function(p) {
        if (!p || !p.caster || !p.key) return;
        var fn = ABILITY_VFX_LEGENDARY_FN[p.key];
        if (typeof fn === 'function') {
            try { fn(p); } catch (e) {
                if (typeof console !== 'undefined' && console.error) console.error('vfx-abilities.js: legendaryTrigger handler threw', e);
            }
        }
    });
}

// =============================================================================
// Entry point 3 (Task 2, signature moments): the 8 story bosses. Layered ON
// TOP of vfx.js's generic bossTelegraphDetonate nova+burst (not a
// replacement -- see the ABILITY_VFX_PLAY_BOSS comment there), keyed by
// "<boss.name>::<ability.name>" against the `ability` field combat-boss.js
// now includes on the telegraph payload (Prompt 73 addition, already-
// computed reference, event DATA only). Only each boss's single most
// signature ability gets a hand-tuned entry; every other boss ability still
// reads fine via the generic decal.
// =============================================================================

function abilityVfxCellCentroid(cells) {
    if (!cells || cells.length === 0) return null;
    var r = 0, c = 0;
    for (var i = 0; i < cells.length; i++) { r += cells[i].row; c += cells[i].col; }
    return { row: Math.round(r / cells.length), col: Math.round(c / cells.length) };
}

var ABILITY_VFX_BOSS = {
    'Veil Warden::Ground Slam': function(p) {
        var c = abilityVfxCellCentroid(p.cells) || { row: p.boss.gridRow, col: p.boss.gridCol };
        abilityVfxSchedule([
            { delay: 0,    fn: function() { VFX.play('nova', { row: c.row, col: c.col, element: 'boss', radius: 2.6, duration: 0.6 }); } },
            { delay: 0.05, fn: function() { VFX.play('burst', { row: c.row, col: c.col, element: 'boss', big: true, count: 22 }); } },
            { delay: 0.08, fn: function() { VFX.play('shake', { unit: p.boss, duration: 0.35, magnitude: 6 }); } }
        ]);
    },
    'The Archon::Ground Pound': function(p) {
        var c = abilityVfxCellCentroid(p.cells) || { row: p.boss.gridRow, col: p.boss.gridCol };
        abilityVfxSchedule([
            { delay: 0,    fn: function() { VFX.play('groundDecal', { row: c.row, col: c.col, element: 'earth', duration: 0.6, pulse: true }); } },
            { delay: 0.05, fn: function() { VFX.play('nova', { row: c.row, col: c.col, element: 'earth', radius: 2.4, duration: 0.55 }); } },
            { delay: 0.1,  fn: function() { VFX.play('burst', { row: c.row, col: c.col, element: 'earth', big: true, count: 18 }); } }
        ]);
    },
    'The Twin Heralds::Chain Lightning': function(p) {
        var c = abilityVfxCellCentroid(p.cells) || { row: p.boss.gridRow, col: p.boss.gridCol };
        var targets = p.targetUnits || [];
        abilityVfxSchedule([
            { delay: 0,    fn: function() { VFX.play('chain', { points: [p.boss].concat(targets), element: 'lightning', duration: 0.4 }); } },
            { delay: 0.1,  fn: function() { VFX.play('burst', { row: c.row, col: c.col, element: 'lightning', big: true, count: 16 }); } }
        ]);
    },
    'The Shattered Colossus::Slam': function(p) {
        var c = abilityVfxCellCentroid(p.cells) || { row: p.boss.gridRow, col: p.boss.gridCol };
        abilityVfxSchedule([
            { delay: 0,    fn: function() { VFX.play('shake', { unit: p.boss, duration: 0.4, magnitude: 7 }); } },
            { delay: 0.04, fn: function() { VFX.play('nova', { row: c.row, col: c.col, element: 'earth', radius: 2.8, duration: 0.6 }); } },
            { delay: 0.1,  fn: function() { VFX.play('burst', { row: c.row, col: c.col, element: 'earth', big: true, count: 24 }); } }
        ]);
    },
    'The Elemental Chimera::Element Surge': function(p) {
        var c = abilityVfxCellCentroid(p.cells) || { row: p.boss.gridRow, col: p.boss.gridCol };
        var elem = (p.boss && p.boss.currentElement) || (p.boss && p.boss.element) || 'fire';
        abilityVfxSchedule([
            { delay: 0,    fn: function() { VFX.play('groundDecal', { row: c.row, col: c.col, element: elem, duration: 0.6, pulse: true }); } },
            { delay: 0.05, fn: function() { VFX.play('nova', { row: c.row, col: c.col, element: elem, radius: 2.4, duration: 0.55 }); } },
            { delay: 0.1,  fn: function() { VFX.play('burst', { row: c.row, col: c.col, element: elem, big: true, count: 18 }); } }
        ]);
    },
    'The Prismatic Sentinel::Elemental Storm': function(p) {
        var boss = p.boss, elem = (boss && boss.currentImmuneElement) || (boss && boss.element) || 'force';
        var jobs = [
            { delay: 0, fn: function() { VFX.play('aura', { unit: boss, element: elem, duration: 0.6 }); } },
            { delay: 0.1, fn: function() { VFX.play('nova', { row: boss.gridRow, col: boss.gridCol, element: elem, radius: 3, duration: 0.6 }); } }
        ];
        var targets = p.targetUnits || [];
        for (var i = 0; i < targets.length; i++) {
            (function(u, idx) { jobs.push({ delay: 0.15 + idx * 0.03, fn: function() { VFX.play('burst', { row: u.gridRow, col: u.gridCol, element: elem, count: 8 }); } }); })(targets[i], i);
        }
        abilityVfxSchedule(jobs);
    },
    'The Arbiter of Trials::Judges Gavel': function(p) {
        var targets = p.targetUnits || [];
        var u = targets[0];
        if (!u) return;
        abilityVfxSchedule([
            { delay: 0,    fn: function() { VFX.play('beam', { fromUnit: p.boss, toUnit: u, element: 'boss', duration: 0.2 }); } },
            { delay: 0.15, fn: function() { VFX.play('nova', { row: u.gridRow, col: u.gridCol, element: 'boss', radius: 1.8, duration: 0.4 }); } },
            { delay: 0.18, fn: function() { VFX.play('burst', { row: u.gridRow, col: u.gridCol, element: 'boss', big: true, count: 20 }); } },
            { delay: 0.2,  fn: function() { VFX.play('shake', { unit: u, duration: 0.4, magnitude: 8 }); } }
        ]);
    },
    'The Void Sovereign::Annihilation': function(p) {
        var boss = p.boss;
        var pool = (combatState && combatState.playerUnits) || [];
        var jobs = [
            { delay: 0, fn: function() { VFX.play('aura', { unit: boss, element: 'boss', duration: 0.8 }); } },
            { delay: 0.1, fn: function() { VFX.play('nova', { row: boss.gridRow, col: boss.gridCol, element: 'boss', radius: 4, duration: 0.7 }); } }
        ];
        for (var i = 0; i < pool.length; i++) {
            if (pool[i].hp > 0) {
                (function(u, idx) { jobs.push({ delay: 0.2 + idx * 0.02, fn: function() { VFX.play('burst', { row: u.gridRow, col: u.gridCol, element: 'boss', count: 8 }); } }); })(pool[i], i);
            }
        }
        abilityVfxSchedule(jobs);
    }
};

function ABILITY_VFX_PLAY_BOSS(p) {
    if (!p || !p.boss || !p.ability || !p.ability.name) return false;
    var bossName = (p.boss.bossData && p.boss.bossData.name) || p.boss.name;
    var key = bossName + '::' + p.ability.name;
    var fn = ABILITY_VFX_BOSS[key];
    if (typeof fn !== 'function') return false;
    try { fn(p); } catch (e) {
        if (typeof console !== 'undefined' && console.error) console.error('vfx-abilities.js: boss signature-moment handler threw', e);
    }
    return true;
}

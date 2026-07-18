// vfx.js -- VFX framework: particles/projectiles/on-hit/boss-telegraph effects
// (Prompt 72, Phase 4.1/4.2/4.3-boss-telegraph-only).
//
// Pixi-side, loads AFTER js/render-pixi.js (game-v2.html script order) so it
// can reuse render-pixi.js's already-established globals rather than
// duplicating them: boardToScreen()/PIXI_R (board-plane projection + layer
// refs), PIXI_ELEMENT_COLORS (canonical element palette), pixiHexPoints()
// (hex tile geometry), pixiGetCombatSpeed()/pixiRngNext() (the exact cosmetic
// PRNG/speed-scaling convention this file follows for its own timing).
//
// Iron rules (see prompts/72-vfx-framework.md):
//   - combat-*.js logic files gained event DATA only (new fields on existing
//     emits, two new event names) -- zero behavior change, goldens untouched.
//     See combat-damage.js (isAutoAttack/isAbility/shieldAbsorbed on
//     unitDamaged), combat-status.js (new statusApplied, additive alongside
//     the pre-existing hardCC-gated ccApplied), combat-boss.js (new
//     bossTelegraphStart/bossTelegraphDetonate).
//   - This file NEVER touches Math.random()/the seeded logic RNG stream --
//     every cosmetic random draw goes through vfxRngNext() below (which
//     itself prefers render-pixi.js's pixiRngNext() when present, falling
//     back to an independent local mulberry32 otherwise -- either way, never
//     the seeded stream combat-core.js owns).
//   - Every effect's lifetime is expressed in nominal (1x) seconds and
//     advanced by dtSec = (dtMs/1000) * COMBAT_SPEED, exactly like
//     render-pixi.js's own pixiTickFloatingText/pixiTickFlashCells -- so
//     effects visibly compress at 2x/4x instead of lagging behind combat.
//   - Hard cap: VFX_CAP live "particle units" across every effect combined
//     (not per primitive) -- oldest instance retired first when exceeded.
//
// Registry: VFX.play(primitiveName, opts) -- safe no-op (never throws, still
// returns a lightweight instance) when PIXI/the pixi Application isn't ready;
// builds real PIXI.Graphics/Container/Text nodes and mounts them into this
// file's own two layers (vfxEnsureLayers() below) once it is.
//
// RENDER_PIXI.frame() (js/render-pixi.js) calls VFX.frame(dtMs) once per
// frame, after its own per-unit redraw pass, so shake's token-jitter (the one
// primitive that mutates an EXISTING unit token rather than drawing its own
// display object) lands on top of that frame's already-computed "true"
// position rather than being stomped by it.

// ---------------------------------------------------------------------------
// Local cosmetic PRNG / combat-speed helpers -- thin wrappers around
// render-pixi.js's own (pixiRngNext/pixiGetCombatSpeed), with a
// self-contained fallback so this file never hard-crashes if load order
// were ever violated. Never reaches for Math.random().
// ---------------------------------------------------------------------------

var vfxRngState = (Date.now() % 2147483647) || 1;
function vfxRngNext() {
    if (typeof pixiRngNext === 'function') return pixiRngNext();
    vfxRngState |= 0;
    vfxRngState = (vfxRngState + 0x6D2B79F5) | 0;
    var t = vfxRngState;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function vfxSpeed() {
    if (typeof pixiGetCombatSpeed === 'function') return pixiGetCombatSpeed();
    return (typeof COMBAT_SPEED === 'number' && COMBAT_SPEED > 0) ? COMBAT_SPEED : 1;
}

// ---------------------------------------------------------------------------
// Element theming -- one entry per element (core color, accent, particle
// shape variant) built on top of render-pixi.js's canonical
// PIXI_ELEMENT_COLORS, plus two non-element cosmetic colors (heal green,
// boss/danger red) primitives may ask for by name instead of by element.
// ---------------------------------------------------------------------------

var VFX_HEAL_COLOR = 0x44ee44;
var VFX_DANGER_COLOR = 0xff3333;
var VFX_NEUTRAL_COLOR = 0xdddddd;

var VFX_ELEMENT_THEME = {
    fire:      { core: 0xFF4500, accent: 0xFFAA33, shape: 'spark' },
    water:     { core: 0x1E90FF, accent: 0x66CFFF, shape: 'drop'  },
    earth:     { core: 0x228B22, accent: 0x8BC34A, shape: 'shard' },
    wind:      { core: 0x87CEEB, accent: 0xE0FFFF, shape: 'wisp'  },
    lightning: { core: 0xFFD700, accent: 0xFFFFAA, shape: 'bolt'  },
    force:     { core: 0x9370DB, accent: 0xD8BFFF, shape: 'orb'   }
};

function vfxElementTheme(element) {
    if (element && VFX_ELEMENT_THEME.hasOwnProperty(element)) return VFX_ELEMENT_THEME[element];
    return { core: VFX_NEUTRAL_COLOR, accent: VFX_NEUTRAL_COLOR, shape: 'drop' };
}

function vfxElementColor(element) {
    if (element === 'boss') return VFX_DANGER_COLOR;
    if (element === 'heal') return VFX_HEAL_COLOR;
    return vfxElementTheme(element).core;
}

// Accepts either an explicit numeric/hex-string color (opts.color) or falls
// back to element theming (opts.element) -- the common "opts -> fill color"
// resolution every primitive below uses.
function vfxResolveColor(opts) {
    if (opts && opts.color !== undefined && opts.color !== null) {
        return (typeof pixiColorStringToHex === 'function') ? pixiColorStringToHex(opts.color) : opts.color;
    }
    return vfxElementColor(opts && opts.element);
}

// ---------------------------------------------------------------------------
// Board-plane position helpers -- routes through render-pixi.js's
// boardToScreen() (the one function every board-plane element uses) so VFX
// never drifts off the squashed camera projection. vfxResolvePoint() accepts
// either a live unit-like object (uses its CURRENT rendered token position
// via __pixiVis when available -- more accurate than gridRow/gridCol alone
// mid-move) or a plain {row, col} cell spec.
// ---------------------------------------------------------------------------

function vfxPos(row, col) {
    if (typeof boardToScreen === 'function') return boardToScreen(row, col);
    return { x: 0, y: 0, depthScale: 1 };
}

function vfxCellSize() {
    if (typeof PIXI_R !== 'undefined' && PIXI_R.cellW) return { w: PIXI_R.cellW, h: PIXI_R.cellH };
    return { w: 60, h: 60 };
}

function vfxUnitScreenPos(unit) {
    if (unit && unit.__pixiVis && unit.__pixiVis.container) {
        return { x: unit.__pixiVis.container.x, y: unit.__pixiVis.container.y };
    }
    if (unit && unit.gridRow !== undefined && unit.gridCol !== undefined) {
        var p = vfxPos(unit.gridRow, unit.gridCol);
        return { x: p.x, y: p.y };
    }
    return { x: 0, y: 0 };
}

function vfxResolvePoint(spec) {
    if (!spec) return { x: 0, y: 0 };
    if (spec.gridRow !== undefined && spec.gridCol !== undefined) return vfxUnitScreenPos(spec);
    if (spec.row !== undefined && spec.col !== undefined) {
        var p = vfxPos(spec.row, spec.col);
        return { x: p.x, y: p.y };
    }
    return { x: 0, y: 0 };
}

// ---------------------------------------------------------------------------
// Render-state: two layers of our own, inserted into render-pixi.js's
// existing stage the first time they're needed (vfxEnsureLayers) --
// decalLayer sits ABOVE the tile grid but BELOW unit tokens (ground-plane
// overlays like boss telegraphs/death fades read as "on the floor"),
// particleLayer sits ABOVE unit tokens but BELOW floatLayer (projectiles/
// bursts/auras read "in the air", floating damage numbers always stay
// topmost) -- exactly the ordering prompts/72-vfx-framework.md specifies.
// ---------------------------------------------------------------------------

var VFX_CAP = 400; // hard cap: live "particle units" across every effect combined

var VFX_R = {
    active: [],          // every live effect instance, oldest first (insertion order)
    liveParticles: 0,    // sum of .particleCost across VFX_R.active
    decalLayer: null,
    particleLayer: null,
    attachedApp: null,   // the PIXI.Application VFX_R.*Layer were last mounted into
    clock: 0
};

function vfxEnsureLayers() {
    if (typeof PIXI === 'undefined' || typeof PIXI.Container !== 'function') return false;
    if (typeof PIXI_R === 'undefined' || !PIXI_R.ready || !PIXI_R.app || !PIXI_R.app.stage) return false;
    if (VFX_R.attachedApp === PIXI_R.app && VFX_R.decalLayer && VFX_R.particleLayer) return true;

    var stage = PIXI_R.app.stage;
    VFX_R.decalLayer = new PIXI.Container();
    VFX_R.particleLayer = new PIXI.Container();
    try {
        if (PIXI_R.unitLayer && typeof stage.getChildIndex === 'function' && stage.children.indexOf(PIXI_R.unitLayer) >= 0) {
            stage.addChildAt(VFX_R.decalLayer, stage.getChildIndex(PIXI_R.unitLayer));
        } else {
            stage.addChild(VFX_R.decalLayer);
        }
        if (PIXI_R.floatLayer && stage.children.indexOf(PIXI_R.floatLayer) >= 0) {
            stage.addChildAt(VFX_R.particleLayer, stage.getChildIndex(PIXI_R.floatLayer));
        } else {
            stage.addChild(VFX_R.particleLayer);
        }
    } catch (e) {
        // Fallback: still-correct-enough top-of-stack mounting rather than a
        // hard failure if a future render-pixi.js refactor changes layer shape.
        if (VFX_R.decalLayer.parent === undefined || !VFX_R.decalLayer.parent) stage.addChild(VFX_R.decalLayer);
        if (VFX_R.particleLayer.parent === undefined || !VFX_R.particleLayer.parent) stage.addChild(VFX_R.particleLayer);
    }
    VFX_R.attachedApp = PIXI_R.app;
    return true;
}

// ---------------------------------------------------------------------------
// Effect instance lifecycle -- every primitive builder below produces one of
// these (vfxNewInstance), optionally attaches real display objects to it,
// sets .update(dtSec, clock), and registers it (vfxRegister) which enforces
// VFX_CAP by retiring the OLDEST live instance(s) first.
// ---------------------------------------------------------------------------

function vfxNewInstance(type, duration, particleCost) {
    return {
        type: type,
        elapsed: 0,
        duration: duration > 0 ? duration : 0.001,
        dead: false,
        particleCost: particleCost || 0,
        displayObjects: [],
        update: null
    };
}

function vfxRetire(inst) {
    if (!inst || inst.dead) return;
    inst.dead = true;
    VFX_R.liveParticles -= inst.particleCost;
    if (VFX_R.liveParticles < 0) VFX_R.liveParticles = 0;
    for (var i = 0; i < inst.displayObjects.length; i++) {
        var d = inst.displayObjects[i];
        try { if (d && typeof d.destroy === 'function') d.destroy(); } catch (e) {}
    }
    inst.displayObjects.length = 0;
}

function vfxEnforceCap() {
    while (VFX_R.liveParticles > VFX_CAP && VFX_R.active.length > 0) {
        vfxRetire(VFX_R.active[0]);
        VFX_R.active.shift();
    }
}

function vfxRegister(inst) {
    VFX_R.active.push(inst);
    VFX_R.liveParticles += inst.particleCost;
    vfxEnforceCap();
    return inst;
}

function vfxClearAll() {
    for (var i = 0; i < VFX_R.active.length; i++) vfxRetire(VFX_R.active[i]);
    VFX_R.active.length = 0;
    VFX_R.liveParticles = 0;
}

// ---------------------------------------------------------------------------
// Small drawing helpers shared by several primitives.
// ---------------------------------------------------------------------------

function vfxDrawDot(g, x, y, r, color, alpha, shape) {
    if (shape === 'shard' || shape === 'bolt') {
        g.poly([x, y - r, x + r, y, x, y - r * 0.15, x, y + r, x - r, y, x, y - r * 0.15]).fill({ color: color, alpha: alpha });
    } else {
        g.circle(x, y, r).fill({ color: color, alpha: alpha });
    }
}

function vfxHexAt(g, x, y, w, h, color, alpha, strokeColor, strokeAlpha) {
    var pts = (typeof pixiHexPoints === 'function') ? pixiHexPoints(x, y, w, h) :
        [x, y - h / 2, x + w / 2, y, x, y + h / 2, x - w / 2, y];
    g.poly(pts).fill({ color: color, alpha: alpha });
    if (strokeColor !== undefined) g.poly(pts).stroke({ width: 1.5, color: strokeColor, alpha: strokeAlpha === undefined ? alpha : strokeAlpha });
}

function vfxYSquash() {
    return (typeof PIXI_CAM_Y_SQUASH === 'number') ? PIXI_CAM_Y_SQUASH : 0.72;
}

// =============================================================================
// The ~12 composable primitives. Each is `function(opts) -> effectInstance`.
// Common opts: element (theme key), color (explicit override), duration
// (nominal 1x seconds).
// =============================================================================

// ---- projectile: point -> point travel, optional arc + trail ----
function vfxProjectile(opts) {
    opts = opts || {};
    var from = vfxResolvePoint(opts.fromUnit || opts.from);
    var to = vfxResolvePoint(opts.toUnit || opts.to);
    var color = vfxResolveColor(opts);
    var arc = !!opts.arc;
    var trail = opts.trail !== false;
    var duration = opts.duration || 0.15;

    var inst = vfxNewInstance('projectile', duration, trail ? 2 : 1);
    var head = null, trailG = null;
    if (vfxEnsureLayers() && typeof PIXI.Graphics === 'function') {
        head = new PIXI.Graphics();
        VFX_R.particleLayer.addChild(head);
        inst.displayObjects.push(head);
        if (trail) {
            trailG = new PIXI.Graphics();
            VFX_R.particleLayer.addChild(trailG);
            inst.displayObjects.push(trailG);
        }
    }
    var size = vfxCellSize();
    var arcHeight = size.h * vfxYSquash() * 0.55;
    var shape = vfxElementTheme(opts.element).shape;

    inst.update = function() {
        var t = Math.min(1, inst.elapsed / inst.duration);
        var x = from.x + (to.x - from.x) * t;
        var y = from.y + (to.y - from.y) * t;
        if (arc) y -= Math.sin(t * Math.PI) * arcHeight;
        if (!head) return;
        head.clear();
        vfxDrawDot(head, x, y, Math.max(3, size.w * 0.06), color, 0.95, shape);
        if (trailG) {
            trailG.clear();
            var tt = Math.max(0, t - 0.35);
            var tx = from.x + (to.x - from.x) * tt;
            var ty = from.y + (to.y - from.y) * tt;
            if (arc) ty -= Math.sin(tt * Math.PI) * arcHeight;
            trailG.moveTo(tx, ty).lineTo(x, y).stroke({ width: Math.max(1.5, size.w * 0.03), color: color, alpha: 0.4 });
        }
    };
    return vfxRegister(inst);
}

// ---- beam: instantaneous line flash ----
function vfxBeam(opts) {
    opts = opts || {};
    var from = vfxResolvePoint(opts.fromUnit || opts.from);
    var to = vfxResolvePoint(opts.toUnit || opts.to);
    var color = vfxResolveColor(opts);
    var duration = opts.duration || 0.2;

    var inst = vfxNewInstance('beam', duration, 1);
    var g = null;
    if (vfxEnsureLayers() && typeof PIXI.Graphics === 'function') {
        g = new PIXI.Graphics();
        VFX_R.particleLayer.addChild(g);
        inst.displayObjects.push(g);
    }
    var size = vfxCellSize();
    inst.update = function() {
        if (!g) return;
        var alpha = Math.max(0, 1 - inst.elapsed / inst.duration);
        g.clear();
        g.moveTo(from.x, from.y).lineTo(to.x, to.y).stroke({ width: Math.max(2, size.w * 0.08), color: color, alpha: alpha });
    };
    return vfxRegister(inst);
}

// ---- nova: ring expanding from a cell ----
function vfxNova(opts) {
    opts = opts || {};
    var p = vfxResolvePoint(opts.row !== undefined ? opts : (opts.unit || { row: opts.row, col: opts.col }));
    var color = vfxResolveColor(opts);
    var duration = opts.duration || 0.45;
    var maxRadius = (opts.radius || 0.9) * vfxCellSize().w;

    var inst = vfxNewInstance('nova', duration, 1);
    var g = null;
    if (vfxEnsureLayers() && typeof PIXI.Graphics === 'function') {
        g = new PIXI.Graphics();
        VFX_R.particleLayer.addChild(g);
        inst.displayObjects.push(g);
    }
    inst.update = function() {
        if (!g) return;
        var t = Math.min(1, inst.elapsed / inst.duration);
        var r = Math.max(2, maxRadius * t);
        var alpha = Math.max(0, (1 - t) * 0.85);
        g.clear();
        g.circle(p.x, p.y, r).stroke({ width: Math.max(2, r * 0.12), color: color, alpha: alpha });
    };
    return vfxRegister(inst);
}

// ---- burst: radial particle pop ----
function vfxBurst(opts) {
    opts = opts || {};
    var p = vfxResolvePoint(opts.row !== undefined ? opts : (opts.unit || { row: opts.row, col: opts.col }));
    var color = vfxResolveColor(opts);
    var theme = vfxElementTheme(opts.element);
    var big = !!opts.big;
    var count = opts.count || (big ? 14 : 7);
    var duration = opts.duration || (big ? 0.5 : 0.32);
    var spread = (big ? 0.85 : 0.5) * vfxCellSize().w;

    var inst = vfxNewInstance('burst', duration, count);
    var g = null;
    var particles = [];
    for (var i = 0; i < count; i++) {
        particles.push({
            ang: vfxRngNext() * Math.PI * 2,
            speed: 0.5 + vfxRngNext() * 0.5,
            size: 2 + vfxRngNext() * (big ? 3.5 : 2.2)
        });
    }
    if (vfxEnsureLayers() && typeof PIXI.Graphics === 'function') {
        g = new PIXI.Graphics();
        VFX_R.particleLayer.addChild(g);
        inst.displayObjects.push(g);
    }
    inst.update = function() {
        if (!g) return;
        var t = Math.min(1, inst.elapsed / inst.duration);
        var alpha = Math.max(0, 1 - t);
        g.clear();
        for (var i = 0; i < particles.length; i++) {
            var pt = particles[i];
            var dist = spread * pt.speed * t;
            var x = p.x + Math.cos(pt.ang) * dist;
            var y = p.y + Math.sin(pt.ang) * dist * vfxYSquash();
            vfxDrawDot(g, x, y, Math.max(1, pt.size * (1 - t * 0.4)), i % 3 === 0 ? theme.accent : color, alpha, theme.shape);
        }
    };
    return vfxRegister(inst);
}

// ---- groundDecal: tinted cell overlay, pulse + fade; single or multi-cell ----
function vfxGroundDecal(opts) {
    opts = opts || {};
    var cells = opts.cells || [{ row: opts.row, col: opts.col }];
    var color = vfxResolveColor(opts);
    var duration = opts.duration || 1.0;
    var pulse = !!opts.pulse;

    var inst = vfxNewInstance('groundDecal', duration, 1);
    var g = null;
    if (vfxEnsureLayers() && typeof PIXI.Graphics === 'function') {
        g = new PIXI.Graphics();
        VFX_R.decalLayer.addChild(g);
        inst.displayObjects.push(g);
    }
    inst.update = function(dtSec, clock) {
        if (!g) return;
        var t = inst.elapsed / inst.duration;
        var fadeIn = Math.min(1, inst.elapsed / 0.12);
        var fadeOut = 1 - Math.max(0, (t - 0.82) / 0.18);
        var baseAlpha = pulse ? (0.30 + Math.sin((clock || 0) * 6.2) * 0.14) : (0.5 - t * 0.35);
        var alpha = Math.max(0, baseAlpha * fadeIn * Math.min(1, fadeOut));
        g.clear();
        var size = vfxCellSize();
        var hexW = size.w * 0.94, hexH = size.h * vfxYSquash() * 0.94;
        for (var i = 0; i < cells.length; i++) {
            var p = vfxPos(cells[i].row, cells[i].col);
            vfxHexAt(g, p.x, p.y, hexW, hexH, color, alpha, color, alpha * 0.7);
        }
    };
    return vfxRegister(inst);
}

// ---- chain: zigzag bolt through a target list ----
function vfxChain(opts) {
    opts = opts || {};
    var specs = opts.points || opts.targets || [];
    var pts = [];
    for (var i = 0; i < specs.length; i++) pts.push(vfxResolvePoint(specs[i]));
    var color = vfxResolveColor(opts);
    var duration = opts.duration || 0.3;
    var size = vfxCellSize();

    var inst = vfxNewInstance('chain', duration, 1);
    var g = null;
    if (vfxEnsureLayers() && typeof PIXI.Graphics === 'function' && pts.length >= 2) {
        g = new PIXI.Graphics();
        VFX_R.particleLayer.addChild(g);
        inst.displayObjects.push(g);
        // Geometry is jittered once at creation (a static zigzag), only alpha animates.
        var jittered = [pts[0]];
        for (var s = 1; s < pts.length; s++) {
            var a = pts[s - 1], b = pts[s];
            var mx = (a.x + b.x) / 2 + (vfxRngNext() - 0.5) * size.w * 0.4;
            var my = (a.y + b.y) / 2 + (vfxRngNext() - 0.5) * size.h * 0.4;
            jittered.push({ x: mx, y: my });
            jittered.push(b);
        }
        inst._jittered = jittered;
    }
    inst.update = function() {
        if (!g || !inst._jittered) return;
        var alpha = Math.max(0, 1 - inst.elapsed / inst.duration);
        g.clear();
        g.moveTo(inst._jittered[0].x, inst._jittered[0].y);
        for (var i = 1; i < inst._jittered.length; i++) g.lineTo(inst._jittered[i].x, inst._jittered[i].y);
        g.stroke({ width: Math.max(1.5, size.w * 0.035), color: color, alpha: alpha });
    };
    return vfxRegister(inst);
}

// ---- aura: soft glow attached to a token for a duration, tracks its position ----
function vfxAura(opts) {
    opts = opts || {};
    var unit = opts.unit;
    var color = vfxResolveColor(opts);
    var duration = opts.duration || 0.4;

    var inst = vfxNewInstance('aura', duration, 1);
    var g = null;
    if (vfxEnsureLayers() && typeof PIXI.Graphics === 'function') {
        g = new PIXI.Graphics();
        VFX_R.particleLayer.addChild(g);
        inst.displayObjects.push(g);
    }
    var size = vfxCellSize();
    inst.update = function(dtSec, clock) {
        if (!g) return;
        var t = inst.elapsed / inst.duration;
        var alpha = Math.max(0, Math.sin(Math.min(1, t) * Math.PI)) * 0.55;
        var p = vfxUnitScreenPos(unit);
        var r = size.w * (0.42 + Math.sin((clock || 0) * 8) * 0.04);
        g.clear();
        g.circle(p.x, p.y, r).fill({ color: color, alpha: alpha * 0.5 });
        g.circle(p.x, p.y, r).stroke({ width: 2, color: color, alpha: alpha });
    };
    return vfxRegister(inst);
}

// ---- rise: particles float up (or, opts.fall, drift down) from a cell ----
function vfxRise(opts) {
    opts = opts || {};
    var p = vfxResolvePoint(opts.row !== undefined ? opts : (opts.unit || { row: opts.row, col: opts.col }));
    var color = vfxResolveColor(opts);
    var theme = vfxElementTheme(opts.element);
    var count = opts.count || 6;
    var duration = opts.duration || 0.6;
    var fall = !!opts.fall;
    var size = vfxCellSize();

    var inst = vfxNewInstance('rise', duration, count);
    var g = null;
    var particles = [];
    for (var i = 0; i < count; i++) {
        particles.push({
            ox: (vfxRngNext() - 0.5) * size.w * 0.6,
            delay: vfxRngNext() * 0.3,
            size: 1.5 + vfxRngNext() * 2
        });
    }
    if (vfxEnsureLayers() && typeof PIXI.Graphics === 'function') {
        g = new PIXI.Graphics();
        VFX_R.particleLayer.addChild(g);
        inst.displayObjects.push(g);
    }
    var travel = size.h * vfxYSquash() * 0.9 * (fall ? -1 : 1);
    inst.update = function() {
        if (!g) return;
        g.clear();
        for (var i = 0; i < particles.length; i++) {
            var pt = particles[i];
            var local = Math.max(0, Math.min(1, (inst.elapsed - pt.delay) / (inst.duration - pt.delay)));
            if (local <= 0) continue;
            var y = p.y - travel * local;
            var x = p.x + pt.ox;
            var alpha = Math.max(0, 1 - local);
            vfxDrawDot(g, x, y, pt.size, color, alpha, theme.shape);
        }
    };
    return vfxRegister(inst);
}

// ---- slash: arc swipe at target ----
function vfxSlash(opts) {
    opts = opts || {};
    var p = vfxResolvePoint(opts.row !== undefined ? opts : (opts.unit || { row: opts.row, col: opts.col }));
    var color = vfxResolveColor(opts);
    var duration = opts.duration || 0.18;
    var size = vfxCellSize();

    var inst = vfxNewInstance('slash', duration, 1);
    var g = null;
    if (vfxEnsureLayers() && typeof PIXI.Graphics === 'function') {
        g = new PIXI.Graphics();
        VFX_R.particleLayer.addChild(g);
        inst.displayObjects.push(g);
    }
    var angle = -0.7 + vfxRngNext() * 0.3; // slight per-hit variance
    var r = size.w * 0.42;
    inst.update = function() {
        if (!g) return;
        var t = Math.min(1, inst.elapsed / inst.duration);
        var alpha = Math.max(0, 1 - t);
        var sweep = 0.4 + t * 1.6;
        g.clear();
        g.moveTo(p.x + Math.cos(angle) * r, p.y + Math.sin(angle) * r * vfxYSquash());
        var steps = 5;
        for (var i = 1; i <= steps; i++) {
            var a = angle + (sweep * i / steps);
            g.lineTo(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r * vfxYSquash());
        }
        g.stroke({ width: Math.max(2, size.w * 0.07), color: color, alpha: alpha });
    };
    return vfxRegister(inst);
}

// ---- shieldPop: hex-shell shimmer ----
function vfxShieldPop(opts) {
    opts = opts || {};
    var unit = opts.unit;
    var p = unit ? vfxUnitScreenPos(unit) : vfxResolvePoint(opts.row !== undefined ? opts : { row: opts.row, col: opts.col });
    var color = opts.color !== undefined ? vfxResolveColor(opts) : 0x4488ff;
    var duration = opts.duration || 0.35;
    var size = vfxCellSize();

    var inst = vfxNewInstance('shieldPop', duration, 1);
    var g = null;
    if (vfxEnsureLayers() && typeof PIXI.Graphics === 'function') {
        g = new PIXI.Graphics();
        VFX_R.particleLayer.addChild(g);
        inst.displayObjects.push(g);
    }
    var hexW = size.w * 1.05, hexH = size.h * vfxYSquash() * 1.05;
    inst.update = function() {
        if (!g) return;
        var t = Math.min(1, inst.elapsed / inst.duration);
        var alpha = Math.max(0, 1 - t);
        var scale = 1 + t * 0.35;
        g.clear();
        vfxHexAt(g, p.x, p.y, hexW * scale, hexH * scale, color, alpha * 0.18, color, alpha * 0.9);
    };
    return vfxRegister(inst);
}

// ---- beacon: column of light flicker at a cell ----
function vfxBeacon(opts) {
    opts = opts || {};
    var p = vfxResolvePoint(opts.row !== undefined ? opts : (opts.unit || { row: opts.row, col: opts.col }));
    var color = vfxResolveColor(opts);
    var duration = opts.duration || 0.45;
    var size = vfxCellSize();

    var inst = vfxNewInstance('beacon', duration, 1);
    var g = null;
    if (vfxEnsureLayers() && typeof PIXI.Graphics === 'function') {
        g = new PIXI.Graphics();
        VFX_R.particleLayer.addChild(g);
        inst.displayObjects.push(g);
    }
    var height = size.h * vfxYSquash() * 3.2;
    inst.update = function(dtSec, clock) {
        if (!g) return;
        var t = Math.min(1, inst.elapsed / inst.duration);
        var flicker = 0.55 + Math.sin((clock || 0) * 30) * 0.15;
        var alpha = Math.max(0, (1 - t) * flicker);
        var w = size.w * 0.3;
        g.clear();
        g.rect(p.x - w / 2, p.y - height, w, height).fill({ color: color, alpha: alpha * 0.5 });
        g.rect(p.x - w * 0.15, p.y - height, w * 0.3, height).fill({ color: color, alpha: alpha });
    };
    return vfxRegister(inst);
}

// ---- shake: existing token jitter, NOT camera shake (Prompt 74) ----
function vfxShake(opts) {
    opts = opts || {};
    var unit = opts.unit;
    var duration = opts.duration || 0.25;
    var magnitude = opts.magnitude || 4;

    var inst = vfxNewInstance('shake', duration, 0);
    inst.update = function() {
        if (!unit || !unit.__pixiVis || !unit.__pixiVis.container) return;
        var falloff = Math.max(0, 1 - inst.elapsed / inst.duration);
        var vis = unit.__pixiVis;
        vis.container.x += (vfxRngNext() - 0.5) * 2 * magnitude * falloff;
        vis.container.y += (vfxRngNext() - 0.5) * 2 * magnitude * falloff;
    };
    return vfxRegister(inst);
}

// ---------------------------------------------------------------------------
// Registry.
// ---------------------------------------------------------------------------

var VFX_PRIMITIVES = {
    projectile: vfxProjectile,
    beam: vfxBeam,
    nova: vfxNova,
    burst: vfxBurst,
    groundDecal: vfxGroundDecal,
    chain: vfxChain,
    aura: vfxAura,
    rise: vfxRise,
    slash: vfxSlash,
    shieldPop: vfxShieldPop,
    beacon: vfxBeacon,
    shake: vfxShake
};

var VFX_PRIMITIVE_NAMES = ['projectile', 'beam', 'nova', 'burst', 'groundDecal', 'chain', 'aura', 'rise', 'slash', 'shieldPop', 'beacon', 'shake'];

var VFX = {
    CAP: VFX_CAP,
    PRIMITIVE_NAMES: VFX_PRIMITIVE_NAMES,

    // Safe no-op when the pixi app isn't ready: primitive builders above all
    // guard their own display-object creation behind vfxEnsureLayers(), so
    // this always returns a lightweight tracked instance and never throws.
    play: function(name, opts) {
        var builder = VFX_PRIMITIVES[name];
        if (typeof builder !== 'function') return null;
        try {
            return builder(opts || {});
        } catch (e) {
            if (typeof console !== 'undefined' && console.error) {
                console.error('vfx.js: primitive "' + name + '" threw', e);
            }
            return null;
        }
    },

    // Called once per rendered frame by RENDER_PIXI.frame() (js/render-pixi.js),
    // AFTER its own per-unit redraw pass -- see this file's header comment for
    // why that ordering matters to the shake primitive.
    frame: function(dtMs) {
        var dtSec = (dtMs / 1000) * vfxSpeed();
        VFX_R.clock += dtSec;
        vfxEnsureLayers();
        for (var i = VFX_R.active.length - 1; i >= 0; i--) {
            var inst = VFX_R.active[i];
            if (inst.dead) { VFX_R.active.splice(i, 1); continue; }
            inst.elapsed += dtSec;
            if (typeof inst.update === 'function') inst.update(dtSec, VFX_R.clock);
            if (inst.elapsed >= inst.duration) {
                vfxRetire(inst);
                VFX_R.active.splice(i, 1);
            }
        }
    },

    activeCount: function() { return VFX_R.active.length; },
    liveParticleCount: function() { return VFX_R.liveParticles; },
    reset: function() { vfxClearAll(); }
};

// ---------------------------------------------------------------------------
// Event wiring -- registered once at script-load time via
// combatEvents.onPersistent(), exactly like js/render-pixi.js's own
// floatingText/abilityFlash/abilityCast subscriptions (see combat-events.js's
// onPersistent() comment for why: initCombat() can emit combatStart/waveStart
// before a per-wave on() listener would have re-registered after reset()).
// ---------------------------------------------------------------------------

if (typeof combatEvents !== 'undefined' && typeof combatEvents.onPersistent === 'function') {

    // Clear every live effect at the start of each wave (including the
    // first) so nothing bleeds across a wave transition/reposition.
    combatEvents.onPersistent('waveStart', function() { vfxClearAll(); });

    // ---- Auto-attacks (Task 2): projectile for ranged, slash for melee,
    // both fired at hit-time (see this file's header + the worker report for
    // the "fast enough the disconnect is invisible" timing rationale) ----
    // ---- On-hit (Task 2): burst scaled by damage/crit on every hit,
    // shieldPop when a shield absorbed some of it ----
    combatEvents.onPersistent('unitDamaged', function(p) {
        if (!p || !p.target) return;
        if (p.isAutoAttack && p.source) {
            if ((p.source.range || 1) > 1) {
                var isMage = p.source.type === 'mage';
                VFX.play('projectile', {
                    fromUnit: p.source, toUnit: p.target, element: p.source.element,
                    arc: isMage, trail: true,
                    duration: isMage ? 0.17 : 0.13
                });
            } else {
                VFX.play('slash', { row: p.target.gridRow, col: p.target.gridCol, element: p.source.element });
            }
        }
        VFX.play('burst', {
            row: p.target.gridRow, col: p.target.gridCol,
            element: p.source && p.source.element, big: !!p.isCrit
        });
        if (p.shieldAbsorbed > 0) {
            VFX.play('shieldPop', { unit: p.target, row: p.target.gridRow, col: p.target.gridCol });
        }
    });

    // ---- On-hit (Task 2): green heal rise ----
    combatEvents.onPersistent('unitHealed', function(p) {
        if (!p || !p.target) return;
        VFX.play('rise', { row: p.target.gridRow, col: p.target.gridCol, color: VFX_HEAL_COLOR, count: 6 });
    });

    // ---- Casts (Task 2): generic aura pulse + beacon flicker (per-ability
    // spectacular mapping is Prompt 73; this is the universal fallback it
    // will replace/extend) ----
    combatEvents.onPersistent('abilityCast', function(p) {
        if (!p || !p.caster) return;
        VFX.play('aura', { unit: p.caster, element: p.caster.element, duration: 0.45 });
        VFX.play('beacon', { row: p.caster.gridRow, col: p.caster.gridCol, element: p.caster.element, duration: 0.45 });
    });

    // ---- Deaths (Task 2): dissolve burst + fading ground decal ----
    combatEvents.onPersistent('unitKilled', function(p) {
        if (!p || !p.victim) return;
        VFX.play('burst', { row: p.victim.gridRow, col: p.victim.gridCol, element: p.victim.element, big: true });
        VFX.play('groundDecal', { row: p.victim.gridRow, col: p.victim.gridCol, element: p.victim.element, duration: 1.1, pulse: false });
    });

    // ---- CC application (Task 2): small element-agnostic combo per type --
    // statusApplied fires for EVERY status (see combat-status.js), filtered
    // down to the 5 documented types here. ----
    var VFX_CC_TYPES = { stun: 1, freeze: 1, burn: 1, root: 1, silence: 1 };
    combatEvents.onPersistent('statusApplied', function(p) {
        if (!p || !p.target || !VFX_CC_TYPES.hasOwnProperty(p.type)) return;
        var row = p.target.gridRow, col = p.target.gridCol;
        switch (p.type) {
        case 'stun': // stars circle
            VFX.play('nova', { row: row, col: col, element: 'lightning', radius: 0.5, duration: 0.4 });
            VFX.play('burst', { row: row, col: col, element: 'lightning', count: 5, duration: 0.4 });
            break;
        case 'freeze': // ice shards
            VFX.play('burst', { row: row, col: col, element: 'water', count: 8, duration: 0.4 });
            VFX.play('shieldPop', { row: row, col: col, color: 0xbdeeff, duration: 0.4 });
            break;
        case 'burn': // ember rise
            VFX.play('rise', { row: row, col: col, element: 'fire', count: 5, duration: 0.55 });
            break;
        case 'root': // vines burst
            VFX.play('burst', { row: row, col: col, element: 'earth', count: 7, duration: 0.4 });
            break;
        case 'silence': // falling glyphs
            VFX.play('rise', { row: row, col: col, element: 'force', count: 5, duration: 0.5, fall: true });
            break;
        }
    });

    // ---- Boss telegraphs (Task 3): pulsing red groundDecal for the
    // telegraph window, then nova+burst on detonation ----
    combatEvents.onPersistent('bossTelegraphStart', function(p) {
        if (!p || !p.cells || p.cells.length === 0) return;
        VFX.play('groundDecal', { cells: p.cells, color: VFX_DANGER_COLOR, duration: p.duration || 1.5, pulse: true });
    });

    combatEvents.onPersistent('bossTelegraphDetonate', function(p) {
        if (!p || !p.cells) return;
        var cx = 0, cy = 0;
        for (var i = 0; i < p.cells.length; i++) {
            VFX.play('nova', { row: p.cells[i].row, col: p.cells[i].col, element: 'boss', duration: 0.4, radius: 0.65 });
            cx += p.cells[i].row; cy += p.cells[i].col;
        }
        if (p.cells.length > 0) {
            VFX.play('burst', { row: Math.round(cx / p.cells.length), col: Math.round(cy / p.cells.length), element: 'boss', big: true });
        }
    });
}

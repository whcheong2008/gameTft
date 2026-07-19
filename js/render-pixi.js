// render-pixi.js -- PixiJS combat renderer bootstrap (Prompt 68: Phase 3.2)
//
// PixiJS v8.19.0, vendored via `npm pack pixi.js@8` into js/vendor/pixi.min.js
// (npm pack only -- never curl arbitrary URLs). See js/vendor/pixi.min.js's
// own header comment for the exact build stamp; it exposes a global `PIXI`
// when loaded via a plain <script> tag (game-v2.html loads it before this
// file, before render-interface.js has finished registering).
//
// Registers RENDERERS.pixi (js/render-interface.js) with placeholder-art,
// real-information parity against js/render-dom.js: square 8x7 grid, tinted
// rounded-rect unit tokens with smooth cell-to-cell interpolation, chunking
// HP bars, floating combat text, status icon rows, cast/AoE flashes, death
// fade-out. Activated via ?renderer=pixi (js/render-interface.js resolves
// the query param); DOM stays the default renderer until Phase 3.4.
//
// Chrome reuse (per the Prompt 68 spec -- "do NOT rebuild in Pixi"): the
// encounter-mechanic banner/HUD are plain global functions defined in
// js/render-dom.js (renderEncounterMechanicBanner/updateEncounterMechanicHud)
// -- NOT methods on RENDER_DOM -- so this file calls them directly every
// frame exactly like js/render-dom.js's renderCombatBoard() does. The
// enrage-timer text and boss phase-transition flash are NOT standalone
// functions (they're inlined inside renderCombatBoard() itself, which this
// file must never call -- it rebuilds #combat-board's innerHTML and would
// destroy the mounted canvas) so those two small chrome bits are duplicated
// verbatim below, reading the same combatState fields renderCombatBoard()
// does.
//
// Registration is guarded behind `typeof PIXI !== 'undefined'` so headless
// tests never need the real library. js/vendor/pixi.min.js is skipped by
// tests/harness.js's script loader (see harness.js's getScriptLoadOrder():
// vendor/ files are browser-only blobs, never executed in the Node vm
// sandbox), so PIXI is normally undefined there; tests/test-renderer-
// boundary.js verifies registration by injecting a fake PIXI stub instead.
//
// Prompt 67 lesson applied: cosmetic randomness in this file (visual jitter,
// nothing gameplay-affecting) never touches the seeded logic Math.random()
// stream -- it uses its own tiny local PRNG (pixiRngNext below) so this
// renderer can never perturb golden-test determinism even if it were ever
// exercised under the seeded harness.

// ---- local cosmetic PRNG (mulberry32, seeded off wall-clock time; never
// touches Math.random(), which combat-core.js's seeded stream owns) ----
var pixiRngState = (Date.now() % 2147483647) || 1;
function pixiRngNext() {
    pixiRngState |= 0;
    pixiRngState = (pixiRngState + 0x6D2B79F5) | 0;
    var t = pixiRngState;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// ---- canonical element palette (GRAPHICS-SESSION-HANDOFF.md § Element
// Color Palette) -- deliberately NOT the same hex values as js/units-core.js's
// ELEMENTS[x].color (that palette is the pre-existing DOM casting-glow color,
// never reconciled with the canonical art-direction palette). The Pixi
// renderer uses the canonical one per the Prompt 68 spec. ----
var PIXI_ELEMENT_COLORS = {
    fire: 0xFF4500,
    water: 0x1E90FF,
    earth: 0x228B22,
    wind: 0x87CEEB,
    lightning: 0xFFD700,
    force: 0x9370DB
};
var PIXI_DEFAULT_TINT = 0x888899;

var PIXI_DMG_COLORS = {
    normal: 0xffffff,
    crit: 0xffdd00,
    dot: 0xff6633,
    heal: 0x44ee44,
    shield: 0x4488ff,
    dodge: 0x999999,
    ability: 0xff88ff,
    boss: 0xff4444
};

var PIXI_COLS = 7;
var PIXI_ROWS = 8;

// ---- renderer-private state (rebuilt per init(), Application reused
// across waves -- see RENDER_PIXI.init below for why) ----
var PIXI_R = {
    app: null,          // PIXI.Application, created lazily once, reused across waves
    ready: false,        // true once app.init()'s promise has resolved
    boardEl: null,        // #combat-board DOM element the canvas is mounted into
    platformLayer: null,  // PIXI.Container: Task 3 "platform frame" silhouette, painted BELOW gridLayer
    gridLayer: null,      // PIXI.Container: static tile background (rebuilt only on resize)
    markerLayer: null,    // PIXI.Container: death markers, added incrementally per wave
    unitLayer: null,      // PIXI.Container: per-unit tokens (sortable by row)
    fxLayer: null,        // PIXI.Container: ability-flash cell rects
    floatLayer: null,     // PIXI.Container: floating combat text, always topmost
    drawnMarkers: null,   // {row,col key -> true} for markerLayer, reset per wave
    cellW: 0,
    cellH: 0,
    lastGridW: -1,         // Prompt 71: per-instance grid-rebuild-needed tracker (was a module var)
    lastGridH: -1,
    clock: 0,             // Task 4: accumulated combat-speed-scaled seconds, drives idle bob phase
    hoveredUnit: null,     // Task 4: unit currently under the pointer (DOM tooltip + selection ring)
    // Prompt 71 (Phase 3.5, Task 2): wave-transition reposition-on-arena mode.
    // See pixiEnterRepositionMode()/pixiExitRepositionMode() below -- reuses
    // this exact combat render state/token set rather than a second Pixi
    // instance, since the combat arena is already mounted and frozen on the
    // last frame when the wave-transition overlay shows.
    repositionMode: false,
    repositionSelectedUnit: null,
    repositionClickCallback: null, // function(row, col) -- js/ui-combat.js's onWaveRepositionClick
    tileHitLayer: null,
    repositionHighlightLayer: null,
    // Prompt 76 (Phase 4.4 remainder + 4.5): combat-juice render-only state.
    // hitStopUntil is a wall-clock (Date.now()) timestamp -- see
    // pixiTriggerHitStop()/RENDER_PIXI.frame() below for why wall-clock
    // (not a combat-speed-scaled clock) is correct here: hit-stop freezes
    // the RENDERER for a fixed slice of real time, completely independent
    // of js/ui-combat.js's separate combatTick() pump.
    hitStopUntil: 0,
    shakeMagnitude: 0,     // current screen-shake amplitude (px), decays every frame
    unitBanners: []        // live "RAMPAGE!"-style floating banners (pixiTickUnitBanners)
};

// ---- Task 2 (Prompt 70, Phase 3.4): angled TFT-style camera projection ----
//
// 2D-cheap perspective illusion: the board plane is squashed vertically (as
// if viewed from a raised camera looking down at an angle) and unit tokens
// are scaled by a linear per-row depth factor (far/enemy-back rows smaller,
// near/player-front rows larger). boardToScreen() is the ONE function that
// applies this transform -- tiles, unit tokens, death markers, floating
// text, and ability-flash cells all route through it (or its bare
// cellToPixel() call for pre-squash math) so the whole board reads as a
// single consistent ground plane. Unlike grid.js's cellToPixel() (which
// returns a cell's top-left bounding-box corner, the convention every other
// renderer/caller of grid.js expects), boardToScreen() returns the cell's
// CENTER in screen space post-squash -- every call site below was migrated
// to that convention together, see the Prompt 70 report for the audit.
var PIXI_CAM_Y_SQUASH = 0.72;      // TUNABLE: vertical squash of the whole board plane
var PIXI_CAM_DEPTH_FAR = 0.92;     // TUNABLE: unit token scale on row 0 (enemy back row / farthest)
var PIXI_CAM_DEPTH_NEAR = 1.06;    // TUNABLE: unit token scale on row 7 (player front row / nearest)

// Linear interpolation of the depth-scale factor by row (0 = far, ROWS-1 = near).
function pixiRowDepthScale(row) {
    var t = PIXI_ROWS <= 1 ? 0 : row / (PIXI_ROWS - 1);
    return PIXI_CAM_DEPTH_FAR + (PIXI_CAM_DEPTH_NEAR - PIXI_CAM_DEPTH_FAR) * t;
}

// Full unsquashed board pixel height (matches pixiSizeBoard()'s packed-hex
// math) -- used to keep the squashed board vertically centered in its box
// rather than collapsing toward the top.
//
// Prompt 71 (Phase 3.5): both parameters now take an explicit render-state
// object (`rs` -- the same shape as PIXI_R: needs .cellW/.cellH) instead of
// reading the combat-only PIXI_R global directly, so js/ui-builder.js's
// builder-mode arena (its own PIXI_BUILDER_R state, a separate mounted Pixi
// Application) can reuse this exact projection math instead of duplicating
// it. `rs` defaults to PIXI_R when omitted so every pre-existing combat call
// site below (which never passed a second argument) keeps working unchanged.
function pixiFullBoardHeight(rs) {
    rs = rs || PIXI_R;
    return ((PIXI_ROWS - 1) * 0.75 + 1) * rs.cellH;
}

function boardToScreen(row, col, rs) {
    rs = rs || PIXI_R;
    var p = cellToPixel(row, col, rs.cellW, rs.cellH);
    var centerXRaw = p.x + rs.cellW / 2;
    var centerYRaw = p.y + rs.cellH / 2;
    var fullH = pixiFullBoardHeight(rs);
    var squashedH = fullH * PIXI_CAM_Y_SQUASH;
    var yOffset = (fullH - squashedH) / 2;
    return {
        x: centerXRaw,
        y: centerYRaw * PIXI_CAM_Y_SQUASH + yOffset,
        depthScale: pixiRowDepthScale(row)
    };
}

// ---- small helpers ----

function pixiLerp(a, b, t) { return a + (b - a) * t; }

// Prompt 82 (Phase 8.1): text/glyph re-render guards -- every PIXI.Text
// object rasterizes its content to a canvas and re-uploads it as a GPU
// texture whenever `.text` or a style property that affects layout (here,
// only fontSize) is assigned, even if the assigned value is unchanged from
// last frame. pixiRedrawToken/pixiRedrawBuilderToken reassign both every
// single frame for every on-board unit (emoji/name/pips/status/flag), but in
// steady state (no resize, no HP/status/name change) the actual VALUES are
// almost always identical frame-to-frame -- these two helpers cache the last
// value written directly on the PIXI.Text instance and skip the
// assignment (and the rasterization it triggers) when nothing changed.
// "cache by glyph+size" per the Prompt 82 spec: the cache key IS the
// glyph/size pair already implicitly, since a Text object never draws
// anything else.
function pixiSetTextIfChanged(textObj, value) {
    if (!textObj || textObj._pixiLastText === value) return;
    textObj._pixiLastText = value;
    textObj.text = value;
}

function pixiSetFontSizeIfChanged(textObj, size) {
    if (!textObj || !textObj.style || textObj._pixiLastFontSize === size) return;
    textObj._pixiLastFontSize = size;
    textObj.style.fontSize = size;
}

// Detaches AND destroys every child of a container (removeChildren() alone
// only detaches -- Text/Graphics objects hold GPU-side texture allocations
// that leak if not explicitly destroy()'d). Used at wave transitions and
// screen teardown -- the "no WebGL context/texture leak across waves"
// verification in the spec depends on this actually running.
function pixiDestroyAllChildren(container) {
    var kids = container.children.slice();
    for (var i = 0; i < kids.length; i++) {
        kids[i].destroy({ children: true });
    }
    container.removeChildren();
}

function pixiGetCombatSpeed() {
    return (typeof COMBAT_SPEED === 'number' && COMBAT_SPEED > 0) ? COMBAT_SPEED : 1;
}

function pixiUnitElementColor(unit) {
    if (unit.isBoss) return 0x552222;
    if (unit.element && PIXI_ELEMENT_COLORS.hasOwnProperty(unit.element)) {
        return PIXI_ELEMENT_COLORS[unit.element];
    }
    return PIXI_DEFAULT_TINT;
}

function pixiUnitEmoji(unit) {
    if (unit.isBoss) return unit.emoji || '👑';
    if (unit.element && typeof ELEMENTS !== 'undefined' && ELEMENTS[unit.element]) {
        return ELEMENTS[unit.element].emoji || '';
    }
    return '';
}

// ---- board (static grid tiles) ----
//
// Rebuilt only when the board's pixel size actually changes (init(), or a
// window resize mid-combat) -- NOT every frame. See pixiDrawDeathMarkers'
// comment for why a fresh Graphics/Text set every frame is a leak risk.

// Prompt 71: the "have the cell dimensions actually changed" tracker now
// lives ON the render-state object itself (rs.lastGridW/rs.lastGridH)
// instead of a pair of module-level vars, so a second concurrent Pixi
// instance (js/ui-builder.js's PIXI_BUILDER_R) tracks its own board size
// independently of combat's PIXI_R. init()/destroy() below (re)set these on
// PIXI_R exactly like the old module vars were reset.
function pixiMaybeRebuildGrid(rs) {
    rs = rs || PIXI_R;
    if (rs.cellW === rs.lastGridW && rs.cellH === rs.lastGridH) return;
    rs.lastGridW = rs.cellW;
    rs.lastGridH = rs.cellH;
    pixiBuildPlatform(rs);
    pixiBuildGrid(rs);
}

// Pointy-top hexagon vertex offsets from a cell's center, sized to the
// cellW x cellH bounding box cellToPixel() spaces cells at (flat left/right
// edges at x=+-cellW/2 for the E/W neighbors, vertex points at y=+-cellH/2
// for the N/S-less top/bottom). Not necessarily a perfectly regular hexagon
// (cellW/cellH aren't forced into the sqrt(3)/2 ratio a true regular hex
// needs -- they're independently derived from the container's pixel
// dimensions) but it tiles edge-to-edge correctly under cellToPixel()'s
// spacing, which is what actually matters for Phase 3.3 placeholder art
// (real hex tile art is a Phase 3.4 concern per MASTERPLAN.md).
function pixiHexPoints(cx, cy, cellW, cellH) {
    var hw = cellW / 2, qh = cellH / 4, hh = cellH / 2;
    return [
        cx, cy - hh,
        cx + hw, cy - qh,
        cx + hw, cy + qh,
        cx, cy + hh,
        cx - hw, cy + qh,
        cx - hw, cy - qh
    ];
}

// Task 3: a "platform frame" beneath the whole tile group -- a single
// darker, slightly larger silhouette the board visually sits ON, painted
// into its own layer (PIXI_R.platformLayer) BELOW gridLayer in the stage's
// child order (see pixiEnsureApp). Placeholder-art era: a soft rounded slab
// rather than a true hex silhouette (still reads as "the board has a base"
// without needing real platform art -- Phase 5 replaces this).
function pixiBuildPlatform(rs) {
    rs = rs || PIXI_R;
    if (!rs.platformLayer) return;
    pixiDestroyAllChildren(rs.platformLayer);

    // Bounding box of the four board corners in screen space (post-squash) --
    // row 7 (bottom, odd) is shifted +cellW/2 in x by cellToPixel()'s odd-r
    // offset, so the true corners (not just row/col extremes) must go through
    // boardToScreen() rather than being assumed from rs.cellW/H alone.
    var corners = [
        boardToScreen(0, 0, rs), boardToScreen(0, PIXI_COLS - 1, rs),
        boardToScreen(PIXI_ROWS - 1, 0, rs), boardToScreen(PIXI_ROWS - 1, PIXI_COLS - 1, rs)
    ];
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (var i = 0; i < corners.length; i++) {
        minX = Math.min(minX, corners[i].x);
        maxX = Math.max(maxX, corners[i].x);
        minY = Math.min(minY, corners[i].y);
        maxY = Math.max(maxY, corners[i].y);
    }
    var marginX = rs.cellW * 0.55, marginY = rs.cellH * PIXI_CAM_Y_SQUASH * 0.5;
    var plinthDepth = rs.cellH * PIXI_CAM_Y_SQUASH * 0.22; // TUNABLE: how "thick" the platform reads

    var x0 = minX - marginX, x1 = maxX + marginX;
    var y0 = minY - marginY, y1 = maxY + marginY;
    var radius = Math.min(24, marginX);

    var g = new PIXI.Graphics();
    // Front/side "plinth" face (darker, extends below the top face) -- gives
    // the platform apparent thickness/elevation.
    g.roundRect(x0, y0 + plinthDepth, x1 - x0, (y1 - y0), radius)
        .fill({ color: 0x060a12, alpha: 0.9 });
    // Top face of the platform (lighter, where the board actually sits).
    g.roundRect(x0, y0, x1 - x0, (y1 - y0), radius)
        .fill({ color: 0x0f1a2c, alpha: 0.85 })
        .stroke({ width: 1.5, color: 0x2a3a5e, alpha: 0.6 });
    rs.platformLayer.addChild(g);
}

function pixiBuildGrid(rs) {
    rs = rs || PIXI_R;
    pixiDestroyAllChildren(rs.gridLayer);
    var g = new PIXI.Graphics();
    var hexW = rs.cellW * 0.92;
    var hexH = rs.cellH * PIXI_CAM_Y_SQUASH * 0.92; // Task 2: tile height squashed with the board plane
    var lipDepth = rs.cellH * PIXI_CAM_Y_SQUASH * 0.16; // TUNABLE

    // Pass 1: darker bottom-edge "lip" under every tile (Task 2 elevation
    // illusion) -- drawn first so every real tile face (pass 2) paints over
    // any lip poking up from the row below it.
    for (var lr = 0; lr < PIXI_ROWS; lr++) {
        for (var lc = 0; lc < PIXI_COLS; lc++) {
            var lipCenter = boardToScreen(lr, lc, rs);
            var lhw = hexW / 2, lhh = hexH / 2;
            var lipFill = lr <= 3 ? 0x0d0505 : 0x05080f;
            g.poly([
                lipCenter.x - lhw * 0.8, lipCenter.y + lhh * 0.55,
                lipCenter.x + lhw * 0.8, lipCenter.y + lhh * 0.55,
                lipCenter.x + lhw * 0.55, lipCenter.y + lhh * 0.55 + lipDepth,
                lipCenter.x - lhw * 0.55, lipCenter.y + lhh * 0.55 + lipDepth
            ]).fill({ color: lipFill, alpha: 0.8 });
        }
    }

    // Pass 2: the tile faces themselves.
    for (var r = 0; r < PIXI_ROWS; r++) {
        for (var c = 0; c < PIXI_COLS; c++) {
            var center = boardToScreen(r, c, rs);
            var fill = r <= 3 ? 0x1a0a0a : 0x0a1628;
            g.poly(pixiHexPoints(center.x, center.y, hexW, hexH))
                .fill({ color: fill, alpha: 0.6 })
                .stroke({ width: 1, color: 0x333333, alpha: 0.5 });
        }
    }
    // Row 4 divider (enemy/player split), matching render-dom.js's border-top.
    // Positioned at the squashed midpoint between row 3 and row 4 (Task 2 --
    // every board-plane element routes through boardToScreen()/the squash).
    var dividerCenter3 = boardToScreen(3, 0, rs), dividerCenter4 = boardToScreen(4, 0, rs);
    var dividerY = (dividerCenter3.y + dividerCenter4.y) / 2;
    var dividerX0 = boardToScreen(0, 0, rs).x - rs.cellW / 2;
    var dividerW = rs.cellW * (PIXI_COLS + 0.5);
    g.rect(dividerX0, dividerY - 1, dividerW, 2).fill({ color: 0x555555, alpha: 0.8 });
    rs.gridLayer.addChild(g);
}

// Death markers are added incrementally (once per cell key, the first frame
// each appears) into their own layer rather than being torn down and
// rebuilt every frame -- rebuilding N PIXI.Text objects (each backed by a
// canvas-rendered glyph texture) 60 times a second is exactly the kind of
// per-frame allocation the "no leak across waves" verification step is
// meant to catch. PIXI_R.drawnMarkers is reset alongside the layer at every
// wave transition (see RENDER_PIXI.init/destroy).
function pixiDrawDeathMarkers(combatState) {
    if (!combatState.deathMarkers) return;
    for (var key in combatState.deathMarkers) {
        if (!combatState.deathMarkers.hasOwnProperty(key)) continue;
        if (PIXI_R.drawnMarkers[key]) continue;
        PIXI_R.drawnMarkers[key] = true;

        var parts = key.split(',');
        var r = parseInt(parts[0], 10);
        var c = parseInt(parts[1], 10);
        var t = new PIXI.Text({
            text: combatState.deathMarkers[key],
            anchor: 0.5,
            style: { fontSize: Math.floor(PIXI_R.cellH * PIXI_CAM_Y_SQUASH * 0.5), fill: 0xffffff }
        });
        t.alpha = 0.2;
        var markerCenter = boardToScreen(r, c); // Task 2: route through the board-plane projection
        t.x = markerCenter.x;
        t.y = markerCenter.y;
        PIXI_R.markerLayer.addChild(t);
    }
}

// ---- Task 4: hover inspection tooltip (DOM, not Pixi -- reuses the format
// js/render-dom.js's dead initCombatUnitTooltips() established: name, HP,
// ATK, element, plus stars/mana/items/statuses per the Prompt 70 spec) ----

function pixiTooltipEl() {
    var el = document.getElementById('pixi-unit-tooltip');
    if (!el) {
        el = document.createElement('div');
        el.id = 'pixi-unit-tooltip';
        el.style.cssText = 'position:fixed; background:#16213e; border:1px solid #444; ' +
            'border-radius:6px; padding:8px; font-size:11px; z-index:100; pointer-events:none; ' +
            'max-width:220px; line-height:1.4; display:none;';
        document.body.appendChild(el);
    }
    return el;
}

function pixiUnitTooltipHtml(unit) {
    var elemEmoji = pixiUnitEmoji(unit);
    var starsStr = unit.stars ? new Array(unit.stars + 1).join('★') : '';
    var manaStr = (unit.maxMana && unit.maxMana > 0) ?
        ('MP: ' + Math.floor(unit.currentMana || 0) + ' / ' + unit.maxMana) : '';
    var itemsStr = (unit.combatItems && unit.combatItems.length > 0) ? unit.combatItems.join(' ') : '';

    var statusStr = '';
    if (unit.statusEffects && unit.statusEffects.length > 0) {
        var seen = [];
        for (var i = 0; i < unit.statusEffects.length; i++) {
            var sType = unit.statusEffects[i].type;
            if (seen.indexOf(sType) < 0) seen.push(sType);
        }
        var iconParts = [];
        for (var j = 0; j < seen.length; j++) {
            iconParts.push((typeof STATUS_ICONS !== 'undefined' && STATUS_ICONS[seen[j]]) ? STATUS_ICONS[seen[j]] : seen[j]);
        }
        statusStr = iconParts.join(' ');
    }

    return '<div style="font-weight:bold;">' + elemEmoji + ' ' + (unit.name || 'Unit') +
        (starsStr ? ' <span style="color:#e2b714;">' + starsStr + '</span>' : '') + '</div>' +
        '<div>HP: ' + Math.max(0, Math.floor(unit.hp)) + ' / ' + unit.maxHp + '</div>' +
        (manaStr ? '<div style="color:#4488ff;">' + manaStr + '</div>' : '') +
        '<div>ATK: ' + unit.attack + '</div>' +
        (itemsStr ? '<div>Items: ' + itemsStr + '</div>' : '') +
        (statusStr ? '<div>Status: ' + statusStr + '</div>' : '<div style="color:#555;">No active statuses</div>');
}

function pixiShowUnitTooltip(unit, event) {
    var el = pixiTooltipEl();
    el.innerHTML = pixiUnitTooltipHtml(unit);
    el.style.display = 'block';
    if (event) pixiPositionUnitTooltip(event);
}

// `event` is a PixiJS FederatedPointerEvent -- .client is its browser
// client-coordinate Point (distinct from .global, which is stage/canvas-
// local coordinates), exactly what a `position: fixed` DOM tooltip needs.
function pixiPositionUnitTooltip(event) {
    if (!event || !event.client) return;
    var el = pixiTooltipEl();
    el.style.left = (event.client.x + 14) + 'px';
    el.style.top = (event.client.y + 14) + 'px';
}

function pixiHideUnitTooltip() {
    var el = document.getElementById('pixi-unit-tooltip');
    if (el) el.style.display = 'none';
}

// ---- Prompt 83 (Phase 5.6): portrait texture loading + token-face draw ----
//
// Lazy, per-combat: RENDER_PIXI.init() below calls pixiPreloadCombatPortraits()
// once per wave, kicking off PIXI.Assets.load() for every unit/boss actually
// fighting (per the spec: "lazy per-combat preload of the units actually
// fighting -- await before first frame or swap in when loaded"). This file
// takes the "swap in when loaded" half: loads are fire-and-forget promises,
// so the first frame(s) of a wave may still show the placeholder box+emoji
// while a texture is in flight; pixiApplyPortraitToToken() below is called
// every redraw and picks up the texture the instant it lands in
// PIXI_PORTRAIT_TEXTURES, no extra wiring needed. Builder-mode tokens (team
// builder + wave-transition reposition, js/ui-builder.js) never go through
// RENDER_PIXI.init() -- pixiUnitPortraitTexture()'s opportunistic
// pixiRequestPortraitTexture() call covers them too, just without the
// upfront batch.
//
// typeof PIXI.Sprite/PIXI.Assets guards (pixiPortraitsSupported()): the real
// vendored PixiJS (js/vendor/pixi.min.js) always has both, but several test
// files register a deliberately minimal fake PIXI stub (tests/test-vfx.js's
// makeFakePixi(), reused by tests/test-ability-vfx.js) that defines neither
// -- portrait support degrades to a total no-op there, which is exactly the
// "missing texture -> current placeholder rendering, must remain fully
// functional" contract this file has to satisfy for ANY PIXI-shaped object,
// real or stubbed. Because pixiCreateTokenBase() only creates the sprite/mask
// pair when pixiPortraitsSupported() was true AT TOKEN-CREATION time, every
// downstream check is a cheap `if (vis.portraitSprite)` rather than
// re-checking PIXI's shape every frame.
var PIXI_PORTRAIT_TEXTURES = {}; // url -> Texture | null (null = load failed)
var PIXI_PORTRAIT_LOADING = {};  // url -> true while a load is in flight

function pixiPortraitsSupported() {
    return typeof PIXI !== 'undefined' && typeof PIXI.Sprite === 'function' &&
        typeof PIXI.Assets !== 'undefined' && typeof PIXI.Assets.load === 'function';
}

function pixiRequestPortraitTexture(url) {
    if (!url || !pixiPortraitsSupported()) return;
    if (PIXI_PORTRAIT_TEXTURES.hasOwnProperty(url) || PIXI_PORTRAIT_LOADING[url]) return;
    PIXI_PORTRAIT_LOADING[url] = true;
    PIXI.Assets.load(url).then(function(tex) {
        PIXI_PORTRAIT_LOADING[url] = false;
        PIXI_PORTRAIT_TEXTURES[url] = tex || null;
    }).catch(function() {
        // Missing file (404) or decode failure -- cache as `null` so this
        // url is only ever attempted once, not retried every frame.
        PIXI_PORTRAIT_LOADING[url] = false;
        PIXI_PORTRAIT_TEXTURES[url] = null;
    });
}

// Called once per wave from RENDER_PIXI.init() -- see file-header comment
// above for why this is the "per-combat preload" half of the spec.
function pixiPreloadCombatPortraits(cs) {
    if (!cs || !pixiPortraitsSupported() || typeof getPortraitUrl !== 'function') return;
    var units = (cs.playerUnits || []).concat(cs.enemyUnits || []);
    for (var i = 0; i < units.length; i++) {
        if (!units[i] || !units[i].key) continue;
        var url = getPortraitUrl(units[i].key);
        if (url) pixiRequestPortraitTexture(url);
    }
}

// `unitLike` needs only `.key` (every combat unit -- including the boss
// object js/ui-combat.js's startMissionCombat() builds -- and every
// builder-mode unitLike, js/ui-builder.js's builderUnitLikeFromSlot(), carry
// one). Returns a real Texture when loaded, null while pending/failed/
// unsupported -- callers treat null exactly like "no portrait" (current
// placeholder rendering).
function pixiUnitPortraitTexture(unitLike) {
    if (!unitLike || !unitLike.key || !pixiPortraitsSupported() || typeof getPortraitUrl !== 'function') return null;
    var url = getPortraitUrl(unitLike.key);
    if (!url) return null;
    pixiRequestPortraitTexture(url); // opportunistic -- no-op once cached/in flight
    return PIXI_PORTRAIT_TEXTURES[url] || null;
}

// Draws (or hides) a token's portrait sprite for the current frame. `vis`
// must carry the `portraitSprite`/`portraitMask` pair pixiCreateTokenBase()
// only creates when portraits are supported (see above) -- callers must
// guard with `if (vis.portraitSprite)` before calling this, which doubles as
// this function's own no-texture-support short circuit. w/h is the token's
// current box (already accounts for boss span/evolved size). Returns true
// when a portrait was actually drawn -- callers use this to switch the base
// fill to a border-only outline (keeping the element-colored border per
// spec) instead of the flat tint box, and to hide the redundant element
// emoji glyph the portrait replaces.
function pixiApplyPortraitToToken(vis, unitLike, w, h) {
    var tex = pixiUnitPortraitTexture(unitLike);
    if (!tex) {
        vis.portraitSprite.visible = false;
        return false;
    }
    vis.portraitSprite.texture = tex;
    vis.portraitSprite.width = w;
    vis.portraitSprite.height = h;
    vis.portraitSprite.visible = true;
    vis.portraitMask.clear();
    vis.portraitMask.roundRect(-w / 2, -h / 2, w, h, 4).fill(0xffffff);
    return true;
}

// ---- unit-token factory (Prompt 71, Phase 3.5: reusable outside combat) ----
//
// pixiCreateTokenBase() builds the visual chrome every token needs regardless
// of context -- background box, element emoji, unit-name label, a hover-ring
// Graphics, and the hitArea/hover-tooltip/tap wiring -- against an explicit
// render-state object (`rs`: needs .hoveredUnit, matching the PIXI_R shape)
// and destination layer, rather than assuming PIXI_R.unitLayer. Two callers
// build on top of it:
//   pixiCreateVisual(unit)              combat tokens: adds hp/mana bars,
//                                        status icons, star pips, boss flags.
//   pixiCreateBuilderToken(...)         js/ui-builder.js's builder-mode arena
//                                        (team builder + wave-transition
//                                        reposition): adds a star-pip row and
//                                        an item-icon chip, no hp/mana bars.
// `onTap` (optional) is wired to Pixi's 'pointertap' -- combat tokens use it
// for reposition-mode clicks (see pixiEnterRepositionMode below); builder
// tokens use it for the pick-up/swap/move click model.
function pixiCreateTokenBase(unitLike, layer, rs, onTap) {
    var container = new PIXI.Container();

    // Prompt 83 (Phase 5.6): portrait sprite + its rounded-rect clip mask,
    // created only when this PIXI (real or stubbed) actually supports them --
    // see pixiPortraitsSupported()'s comment above. Added BELOW `base` on
    // purpose: `base` keeps drawing its border/cast-flash/phase-transition-
    // shimmer/enrage-glow overlays every frame (pixiRedrawToken/
    // pixiRedrawBuilderToken skip only the OPAQUE tint fill when a portrait
    // is active, per pixiApplyPortraitToToken's return value), so all of
    // that existing VFX composites on top of the art instead of being hidden
    // behind an opaque sprite -- "VFX/animations unchanged" per the spec.
    // Starts hidden; pixiApplyPortraitToToken() (called every redraw) reveals
    // it once a texture is actually available.
    var portraitSprite = null, portraitMask = null;
    if (pixiPortraitsSupported()) {
        portraitMask = new PIXI.Graphics();
        container.addChild(portraitMask);
        portraitSprite = new PIXI.Sprite();
        portraitSprite.anchor.set(0.5);
        portraitSprite.visible = false;
        portraitSprite.mask = portraitMask;
        container.addChild(portraitSprite);
    }

    var base = new PIXI.Graphics();
    container.addChild(base);

    var emojiText = new PIXI.Text({
        text: pixiUnitEmoji(unitLike),
        anchor: 0.5,
        style: { fontSize: 14, fill: 0xffffff }
    });
    container.addChild(emojiText);

    var nameText = new PIXI.Text({
        text: (unitLike.name || '').split(' ')[0],
        anchor: { x: 0.5, y: 0 },
        style: { fontSize: 8, fill: unitLike.side === 'enemy' ? 0xff6b6b : 0xdddddd }
    });
    container.addChild(nameText);

    // Element-colored selection ring, drawn under everything else added
    // above -- addChildAt(0) so hover highlighting never occludes the
    // token's own art/bars/text.
    var ring = new PIXI.Graphics();
    ring.visible = false;
    container.addChildAt(ring, 0);

    // Hover inspection -- Pixi pointer events drive a DOM tooltip
    // (pixiShowUnitTooltip/pixiHideUnitTooltip below) and this same ring.
    // hitArea is (re)sized every redraw (token size changes with depth
    // scale/boss span), so it starts as a small placeholder rect here.
    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.hitArea = new PIXI.Rectangle(-10, -10, 20, 20);
    if (rs) {
        container.on('pointerover', function(e) { rs.hoveredUnit = unitLike; pixiShowUnitTooltip(unitLike, e); });
        container.on('pointermove', function(e) { if (rs.hoveredUnit === unitLike) pixiPositionUnitTooltip(e); });
        container.on('pointerout', function() { if (rs.hoveredUnit === unitLike) { rs.hoveredUnit = null; pixiHideUnitTooltip(); } });
    }
    if (typeof onTap === 'function') {
        container.on('pointertap', function() { onTap(unitLike); });
    }

    layer.addChild(container);

    return { container: container, base: base, ring: ring, emojiText: emojiText, nameText: nameText, portraitSprite: portraitSprite, portraitMask: portraitMask };
}

// Builder-mode token (Task 1/Task 2): name/stars/items chip, no hp/mana bars.
// `layer`/`rs` are the caller's own render state (js/ui-builder.js's
// PIXI_BUILDER_R for the team-builder screen, or PIXI_R itself when reused
// for wave-transition reposition -- see pixiEnterRepositionMode). `unitLike`
// only needs .name/.element/.evolved/.stars/.combatItems/.side (a roster
// entry's derived stats object, or a live combat unit both satisfy this).
function pixiCreateBuilderToken(unitLike, layer, rs, onTap) {
    var t = pixiCreateTokenBase(unitLike, layer, rs, onTap);

    var starsText = new PIXI.Text({
        text: unitLike.stars ? new Array(unitLike.stars + 1).join('★') : '',
        anchor: { x: 0.5, y: 0 },
        style: { fontSize: 8, fill: 0xe2b714 }
    });
    t.container.addChild(starsText);
    t.starsText = starsText;

    var itemsText = new PIXI.Text({
        text: (unitLike.combatItems && unitLike.combatItems.length) ? unitLike.combatItems.join('') : '',
        anchor: { x: 0.5, y: 1 },
        style: { fontSize: 9, fill: 0xffffff }
    });
    t.container.addChild(itemsText);
    t.itemsText = itemsText;

    return t;
}

// Redraws a builder-mode token created above into cell (row,col) of the
// given render state `rs` -- shared by js/ui-builder.js's team-builder
// screen AND this file's own wave-transition reposition mode (Task 2), which
// draws its picked-up-for-swap selection the same way. `opts.dimmed` (enemy
// zone preview) and `opts.selected` (picked-up/held) toggle presentation
// only; the token's cell placement always comes from (row,col) via
// boardToScreen(), never from a lerp/animation (builder-mode tokens snap).
function pixiRedrawBuilderToken(vis, unitLike, row, col, rs, opts) {
    opts = opts || {};
    var pos = boardToScreen(row, col, rs);
    var w = rs.cellW - 6, h = rs.cellH * PIXI_CAM_Y_SQUASH - 6;

    vis.container.x = pos.x;
    vis.container.y = pos.y;
    vis.container.zIndex = 1000 - row;
    vis.container.scale.set(pos.depthScale, pos.depthScale);
    vis.container.alpha = opts.dimmed ? 0.35 : 1;

    var tint = pixiUnitElementColor(unitLike);
    vis.base.clear();
    // Prompt 83 (Phase 5.6): portrait fills the token when its texture has
    // loaded (vis.portraitSprite is only non-null when this file's PIXI
    // supports Sprite/Assets -- see pixiCreateTokenBase's comment); the base
    // fill drops to a border-only outline so the portrait shows through,
    // keeping the element-colored border. Falls straight back to the
    // original flat tint box otherwise -- unchanged behavior.
    var portraitDrawn = vis.portraitSprite ? pixiApplyPortraitToToken(vis, unitLike, w, h) : false;
    if (portraitDrawn) {
        vis.base.roundRect(-w / 2, -h / 2, w, h, 4).stroke({ width: 1.5, color: tint, alpha: 0.95 });
    } else {
        vis.base.roundRect(-w / 2, -h / 2, w, h, 4).fill({ color: tint, alpha: 0.85 });
    }
    if (unitLike.evolved) {
        vis.base.roundRect(-w / 2, -h / 2, w, h, 4).stroke({ width: 1.5, color: 0xe2b714, alpha: 0.9 });
    }
    if (opts.selected) {
        vis.base.roundRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4, 5).stroke({ width: 2.5, color: 0xffffff, alpha: 0.95 });
    }

    vis.emojiText.visible = !portraitDrawn;
    pixiSetTextIfChanged(vis.emojiText, pixiUnitEmoji(unitLike));
    pixiSetFontSizeIfChanged(vis.emojiText, Math.floor(h * 0.4));
    vis.emojiText.y = -h * 0.12;

    pixiSetTextIfChanged(vis.nameText, (unitLike.name || '').split(' ')[0]);
    vis.nameText.y = h * 0.02;

    if (vis.starsText) {
        pixiSetTextIfChanged(vis.starsText, unitLike.stars ? new Array(unitLike.stars + 1).join('★') : '');
        vis.starsText.y = h / 2 + 1;
    }
    if (vis.itemsText) {
        pixiSetTextIfChanged(vis.itemsText, (unitLike.combatItems && unitLike.combatItems.length) ? unitLike.combatItems.join('') : '');
        vis.itemsText.y = -h / 2 - 2;
    }

    vis.ring.clear();
    if (opts.selected || (rs && rs.hoveredUnit === unitLike)) {
        vis.ring.visible = true;
        var ringColor = opts.selected ? 0xffffff : pixiUnitElementColor(unitLike);
        vis.ring.roundRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8, 6).stroke({ width: opts.selected ? 3 : 2, color: ringColor, alpha: 0.95 });
    } else {
        vis.ring.visible = false;
    }
    pixiUpdateHitArea(vis, w, h);
}

// ---- Prompt 76 (Phase 4.4 remainder, Task 1): status visual upgrade ----
//
// Replaces the old emoji-only status row with animated overlays drawn
// directly ON the token for the 7 "big" status types, driven purely by
// `unit.statusEffects` each frame (render-side only -- no new combatEvents,
// no new fields; combat-status.js/combat-*.js are untouched this round per
// the file-scope boundary). Every draw below is deterministic math against
// PIXI_R.clock (the same combat-speed-scaled cosmetic clock idle-bob already
// uses) -- zero PRNG calls, so there's nothing here that could ever touch
// the seeded logic Math.random() stream even by accident.
var PIXI_STATUS_ANIMATED = { freeze: 1, stun: 1, burn: 1, root: 1, silence: 1, poison: 1, bleed: 1 };

function pixiUnitActiveStatusTypes(unit) {
    var types = [];
    if (!unit.statusEffects) return types;
    for (var i = 0; i < unit.statusEffects.length; i++) {
        var t = unit.statusEffects[i].type;
        if (types.indexOf(t) < 0) types.push(t);
    }
    return types;
}

// Small 8-point star polygon -- used by the "stunned" orbit overlay.
function pixiDrawStarShape(g, cx, cy, r, color, alpha) {
    var pts = [];
    for (var i = 0; i < 8; i++) {
        var ang = (i / 8) * Math.PI * 2 - Math.PI / 2;
        var rad = (i % 2 === 0) ? r : r * 0.42;
        pts.push(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad);
    }
    g.poly(pts).fill({ color: color, alpha: alpha });
}

// Draws every animated status overlay currently active on `unit` into `g`
// (a Graphics owned by that unit's token, cleared+redrawn every frame
// alongside the rest of pixiRedrawToken -- see vis.statusFxG below).
// `w`/`h` are this frame's token box (already accounts for boss span);
// `clock` is PIXI_R.clock (combat-speed-scaled cosmetic seconds).
function pixiDrawStatusOverlays(g, unit, w, h, clock) {
    g.clear();
    var types = pixiUnitActiveStatusTypes(unit);
    if (types.length === 0) return;
    var has = {};
    for (var i = 0; i < types.length; i++) has[types[i]] = true;

    // frozen: ice-block tint over the whole token + twinkling crystal shards
    if (has.freeze) {
        g.roundRect(-w / 2, -h / 2, w, h, 4).fill({ color: 0x99e6ff, alpha: 0.32 });
        var crystalCount = 4;
        for (var c = 0; c < crystalCount; c++) {
            var cAng = (c / crystalCount) * Math.PI * 2 + 0.4;
            var cx = Math.cos(cAng) * w * 0.32;
            var cy = Math.sin(cAng) * h * 0.32;
            var tw = w * 0.09;
            var twinkle = 0.5 + Math.sin(clock * 4 + c * 1.7) * 0.25;
            g.poly([cx, cy - tw, cx + tw * 0.55, cy, cx, cy + tw, cx - tw * 0.55, cy])
                .fill({ color: 0xd7f6ff, alpha: twinkle });
        }
    }

    // stunned: 3 stars orbiting above the token
    if (has.stun) {
        var starCount = 3;
        var orbitR = w * 0.42;
        for (var s = 0; s < starCount; s++) {
            var sAng = clock * 3.4 + (s / starCount) * Math.PI * 2;
            var sx = Math.cos(sAng) * orbitR;
            var sy = -h * 0.58 + Math.sin(sAng) * orbitR * 0.3;
            pixiDrawStarShape(g, sx, sy, w * 0.075, 0xffe14a, 0.95);
        }
    }

    // burning: looping ember rise
    if (has.burn) {
        var emberCount = 4;
        for (var e = 0; e < emberCount; e++) {
            var ePhase = (clock * 0.6 + e / emberCount) % 1;
            var ex = Math.sin(e * 12.9) * w * 0.28;
            var ey = h / 2 - ePhase * h * 1.1;
            var eAlpha = Math.max(0, 1 - ePhase) * 0.85;
            g.circle(ex, ey, Math.max(1, w * 0.045 * (1 - ePhase * 0.4))).fill({ color: 0xff7733, alpha: eAlpha });
        }
    }

    // rooted: vine-wrap arcs around the base
    if (has.root) {
        var vinePulse = 0.55 + Math.sin(clock * 2.4) * 0.15;
        g.ellipse(0, h * 0.28, w * 0.42, h * 0.14).stroke({ width: 2, color: 0x3fae3f, alpha: vinePulse });
        g.ellipse(0, h * 0.1, w * 0.36, h * 0.11).stroke({ width: 2, color: 0x6fd66f, alpha: vinePulse * 0.8 });
    }

    // silenced: crossed-out glyph pulse above the token
    if (has.silence) {
        var silAlpha = 0.5 + Math.sin(clock * 5) * 0.35;
        var sy0 = -h / 2 - 8;
        g.circle(0, sy0, w * 0.13).stroke({ width: 2, color: 0xbbbbee, alpha: silAlpha });
        g.moveTo(-w * 0.09, sy0 - w * 0.09).lineTo(w * 0.09, sy0 + w * 0.09).stroke({ width: 2, color: 0xbbbbee, alpha: silAlpha });
    }

    // poisoned / bleeding: dripping ticks (color distinguishes the two)
    if (has.poison || has.bleed) {
        var dripColor = has.poison ? 0x66dd44 : 0xdd3344;
        var dripCount = 3;
        for (var d = 0; d < dripCount; d++) {
            var dPhase = (clock * 0.9 + d / dripCount) % 1;
            var dx = Math.sin(d * 7.3) * w * 0.22;
            var dy = -h * 0.1 + dPhase * h * 0.75;
            var dAlpha = Math.max(0, 1 - dPhase) * 0.85;
            g.circle(dx, dy, Math.max(1, w * 0.035)).fill({ color: dripColor, alpha: dAlpha });
        }
    }
}

// ---- per-unit visual token (combat) ----

function pixiCreateVisual(unit) {
    var base0 = pixiCreateTokenBase(unit, PIXI_R.unitLayer, PIXI_R, function(u) {
        // Prompt 71 (Task 2): reposition-mode clicks route through the SAME
        // combat tokens the fight itself just used -- see the file header
        // comment on pixiCreateTokenBase for why this callback is a no-op
        // outside reposition mode (registering it unconditionally at token
        // creation, rather than only while reposition mode is active, avoids
        // having to rewire every existing token's handlers when a wave ends).
        if (PIXI_R.repositionMode && typeof PIXI_R.repositionClickCallback === 'function') {
            PIXI_R.repositionClickCallback(u.gridRow, u.gridCol);
        }
    });
    var container = base0.container, base = base0.base, ring = base0.ring, emojiText = base0.emojiText, nameText = base0.nameText;
    var portraitSprite = base0.portraitSprite, portraitMask = base0.portraitMask; // Prompt 83 (Phase 5.6)

    var hpBack = new PIXI.Graphics();
    var hpChunk = new PIXI.Graphics();
    var hpFront = new PIXI.Graphics();
    var shieldBar = new PIXI.Graphics();
    container.addChild(hpBack);
    container.addChild(hpChunk);
    container.addChild(hpFront);
    container.addChild(shieldBar);

    var manaBar = new PIXI.Graphics();
    container.addChild(manaBar);

    var pipsText = new PIXI.Text({
        text: '',
        anchor: { x: 0.5, y: 0 },
        style: { fontSize: 7, fill: 0xe2b714 }
    });
    container.addChild(pipsText);

    var statusText = new PIXI.Text({
        text: '',
        anchor: { x: 0.5, y: 1 },
        style: { fontSize: 8, fill: 0xffffff }
    });
    container.addChild(statusText);

    var flagText = new PIXI.Text({
        text: '',
        anchor: { x: 0.5, y: 0 },
        style: { fontSize: 7, fill: 0xff4444, fontWeight: 'bold' }
    });
    container.addChild(flagText);

    // Prompt 76 (Task 1): animated on-token status overlays -- drawn LAST so
    // it paints over the bars/pips/emoji beneath it (an ice tint dimming the
    // HP bar reads as "this unit is frozen", not a rendering bug).
    var statusFxG = new PIXI.Graphics();
    container.addChild(statusFxG);

    var vis = {
        container: container,
        base: base,
        ring: ring,
        emojiText: emojiText,
        nameText: nameText,
        portraitSprite: portraitSprite,
        portraitMask: portraitMask,
        hpBack: hpBack,
        hpChunk: hpChunk,
        hpFront: hpFront,
        shieldBar: shieldBar,
        manaBar: manaBar,
        pipsText: pipsText,
        statusText: statusText,
        flagText: flagText,
        statusFxG: statusFxG,
        row: unit.gridRow,
        col: unit.gridCol,
        segRow0: unit.gridRow, segCol0: unit.gridCol,
        segRowT: unit.gridRow, segColT: unit.gridCol,
        segDuration: 0, segElapsed: 0,
        dispHp: unit.maxHp > 0 ? (unit.hp / unit.maxHp) : 0,
        castFlashT: 0,
        alive: true,
        // Task 4: idle bob phase is per-unit so a full team doesn't breathe
        // in lockstep -- drawn from the LOCAL cosmetic PRNG (pixiRngNext),
        // never Math.random()/the seeded logic stream (Prompt 67 rule).
        idlePhase: pixiRngNext() * Math.PI * 2,
        // Task 4: wave-start drop/fade-in. spawnDelay staggers tokens created
        // in the same wave-init frame so the whole team doesn't pop in at
        // once; also drawn from the local PRNG for the same reason.
        spawnAge: 0,
        spawnDelay: pixiRngNext() * 0.22,
        spawnDuration: 0.32
    };
    // Attach directly to the unit object rather than a side Map -- keeps
    // this file ES5-style like the rest of the codebase and needs no
    // separate registry to garbage-collect: the visual dies with the unit
    // object when initCombat() builds a fresh combatState for the next wave.
    unit.__pixiVis = vis;
    return vis;
}

function pixiUpdateMovement(vis, unit, dtMs) {
    var speed = pixiGetCombatSpeed();
    if (unit.gridRow !== vis.segRowT || unit.gridCol !== vis.segColT) {
        // Target cell changed since last frame -- decide teleport vs. step.
        var jump = Math.sqrt(
            Math.pow(unit.gridRow - vis.row, 2) + Math.pow(unit.gridCol - vis.col, 2)
        );
        if (jump > 1.5) {
            // Dash/knockback/spawn repositioning -- snap instantly rather
            // than sliding across unrelated cells.
            vis.row = unit.gridRow;
            vis.col = unit.gridCol;
            vis.segDuration = 0;
        } else {
            // Normal one-cell step. unit.moveCooldown was just reset by
            // combat-core.js's moveUnit() caller to 1/effectiveMoveSpeed
            // (game-seconds for the next step) -- read as plain data (not a
            // function call into combat-*.js) to size this lerp segment so
            // faster unit types visibly move faster, matching the spec.
            vis.segRow0 = vis.row;
            vis.segCol0 = vis.col;
            vis.segDuration = Math.max(0.08, Math.min(1.5, unit.moveCooldown || 0.4));
            vis.segElapsed = 0;
        }
        vis.segRowT = unit.gridRow;
        vis.segColT = unit.gridCol;
    }

    if (vis.segDuration > 0) {
        vis.segElapsed += (dtMs / 1000) * speed;
        var t = vis.segElapsed / vis.segDuration;
        if (t >= 1) {
            vis.row = vis.segRowT;
            vis.col = vis.segColT;
            vis.segDuration = 0;
            vis._lerpPx = null;
        } else {
            // Prompt 69 hex migration: lerp in PIXEL space (via cellToPixel()
            // at the two integer endpoints), not raw fractional row/col.
            // odd-r's per-row x-offset is a step function of row parity, so
            // lerping fractional row/col and converting afterward would snap
            // sideways mid-transition on any move crossing an odd/even row
            // boundary -- lerping the already-converted pixel endpoints
            // avoids that entirely. vis.row/vis.col are left at their
            // pre-segment (start) values during the transition; they only
            // matter as jump-distance inputs above, not for positioning.
            //
            // Prompt 70 (Task 2): lerp through boardToScreen(), not the bare
            // cellToPixel(), so a mid-move token tracks the squashed board
            // plane instead of drifting off it mid-transition. boardToScreen()
            // returns cell CENTERS (not top-left corners), which is why
            // pixiRedrawToken below no longer adds +cellW/2 to this result.
            var segP0 = boardToScreen(vis.segRow0, vis.segCol0);
            var segPT = boardToScreen(vis.segRowT, vis.segColT);
            vis._lerpPx = pixiLerp(segP0.x, segPT.x, t);
            vis._lerpPy = pixiLerp(segP0.y, segPT.y, t);
        }
    } else {
        vis._lerpPx = null;
    }
}

var PIXI_HP_CHUNK_DECAY = 0.6; // fraction of bar per real second

function pixiRedrawToken(vis, unit, dtMs) {
    var span = unit.isBoss ? 2 : 1;
    var w = PIXI_R.cellW * span - 4;
    var h = PIXI_R.cellH * span - 4;
    var tint = pixiUnitElementColor(unit);

    var alive = unit.hp > 0 || unit.deathAnimating;
    vis.container.visible = alive;
    if (!alive) return;

    var depthScale;
    if (unit.isBoss) {
        // Center over the boss's 4 grid.js-canonical bossCells() (a hex
        // rhombus, not a square 2x2 block) by averaging their cell centers --
        // bosses don't move mid-combat in this engine (no dash/knockback
        // path targets isBoss units), so vis.row/vis.col are always the
        // boss's exact anchor cell, no lerp needed here. Prompt 70: routed
        // through boardToScreen() (board-plane squash) like everything else.
        var bCells = bossCells(vis.row, vis.col);
        var sumX = 0, sumY = 0, sumDepth = 0;
        for (var bci = 0; bci < bCells.length; bci++) {
            var bp = boardToScreen(bCells[bci].row, bCells[bci].col);
            sumX += bp.x;
            sumY += bp.y;
            sumDepth += bp.depthScale;
        }
        vis.container.x = sumX / bCells.length;
        vis.container.y = sumY / bCells.length;
        depthScale = sumDepth / bCells.length;
    } else {
        // boardToScreen()/the lerp above both return cell CENTERS already --
        // no more "+cellW/2, +cellH/2" centering needed here (Prompt 70).
        var pos = (vis._lerpPx !== null && vis._lerpPx !== undefined) ?
            { x: vis._lerpPx, y: vis._lerpPy } : boardToScreen(vis.row, vis.col);
        vis.container.x = pos.x;
        vis.container.y = pos.y;
        depthScale = pixiRowDepthScale(vis.row);
    }
    // Painter's order tie-break: per the Prompt 68 spec, lower rows draw
    // above higher rows -- larger zIndex wins in Pixi's sortableChildren.
    vis.container.zIndex = 1000 - unit.gridRow;

    // Task 4: idle bob/breath (scale-y only, ~2%) -- a per-unit phase from
    // the local cosmetic PRNG (vis.idlePhase, set once at token creation)
    // keeps a full team from breathing in lockstep. Suppressed while dying
    // or still playing the wave-start drop-in (both have their own scale).
    var bobScaleY = 1;
    var dying = !!unit.deathAnimating;
    var speedForAnim = pixiGetCombatSpeed();
    if (!dying) {
        bobScaleY = 1 + Math.sin(PIXI_R.clock * 3.2 + vis.idlePhase) * 0.02; // TUNABLE: 2% bob, ~3.2 rad/s
    }

    // Death fade-out (unchanged math, now composed with depth scale below).
    var deathScale = 1, alpha = 1;
    if (dying) {
        var deathPct = Math.max(0, (unit.deathTimer || 0) / 0.5);
        alpha = deathPct;
        deathScale = 0.5 + deathPct * 0.5;
    } else {
        // Task 4: wave-start drop/fade-in -- plays once per token (spawnAge
        // only advances while alive/not-dying, so a unit that spawns mid-
        // death-animation edge case can't replay it).
        vis.spawnAge += (dtMs / 1000) * speedForAnim;
        if (vis.spawnAge < vis.spawnDelay) {
            alpha = 0;
        } else if (vis.spawnAge < vis.spawnDelay + vis.spawnDuration) {
            var sp = (vis.spawnAge - vis.spawnDelay) / vis.spawnDuration;
            alpha = sp;
            vis.container.y -= 16 * (1 - sp); // TUNABLE: drop-in distance (px)
        }
    }
    vis.container.alpha = alpha;
    vis.container.scale.set(depthScale * deathScale, depthScale * deathScale * bobScaleY);

    vis.base.clear();
    // Prompt 83 (Phase 5.6): draw the portrait (if its texture has loaded)
    // filling the token; the base fill drops to a border-only outline so the
    // element-colored border is kept and the art shows through the hollow
    // center. Falls straight back to the original flat tint box when
    // unsupported/not-yet-loaded/no-art -- unchanged behavior.
    var portraitDrawn = vis.portraitSprite ? pixiApplyPortraitToToken(vis, unit, w, h) : false;
    if (portraitDrawn) {
        vis.base.roundRect(-w / 2, -h / 2, w, h, 4).stroke({ width: 2, color: tint, alpha: 0.95 });
    } else {
        vis.base.roundRect(-w / 2, -h / 2, w, h, 4).fill({ color: tint, alpha: 0.85 });
    }
    if (unit.evolved) {
        vis.base.roundRect(-w / 2, -h / 2, w, h, 4).stroke({ width: 1.5, color: 0xe2b714, alpha: 0.9 });
    }
    if (unit.isCasting) {
        vis.base.roundRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4, 5).stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
    }
    if (vis.castFlashT > 0) {
        vis.castFlashT -= dtMs / 1000;
        vis.base.roundRect(-w / 2, -h / 2, w, h, 4).fill({ color: 0xffffff, alpha: Math.max(0, vis.castFlashT / 0.3) * 0.5 });
    }

    // Prompt 76 (Task 2): boss phase-transition invulnerability shimmer -- a
    // fast white scan-line sweep across the token plus a pale overall tint,
    // active for the whole boss.phaseTransitioning window (combat-boss.js
    // already owns that flag/timer; this is a pure read, render-side only).
    if (unit.isBoss && unit.phaseTransitioning) {
        var shimmerT = (PIXI_R.clock * 2.2) % 1; // TUNABLE: sweep speed
        var shimmerX = -w / 2 + shimmerT * w;
        vis.base.roundRect(-w / 2, -h / 2, w, h, 4).fill({ color: 0xffffff, alpha: 0.12 });
        vis.base.rect(shimmerX - w * 0.08, -h / 2, w * 0.16, h).fill({ color: 0xffffff, alpha: 0.55 });
    }

    // Prompt 76 (Task 2): enrage persistent red rim-glow -- pulsing outline,
    // active for the rest of the fight once boss.enraged flips true.
    if (unit.isBoss && unit.enraged) {
        var enrageAlpha = 0.55 + Math.sin(PIXI_R.clock * 5) * 0.3; // TUNABLE: pulse speed/depth
        vis.base.roundRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6, 6).stroke({ width: 3, color: 0xff2222, alpha: enrageAlpha });
    }

    // Prompt 83: the element emoji is redundant (and visually cluttered) once
    // a real portrait is filling the token -- hidden rather than removed
    // (pixiRedrawBuilderToken does the same) so it just reappears if the
    // texture is ever missing on a later frame (it never is in practice --
    // PIXI_PORTRAIT_TEXTURES only ever moves from "pending" to a settled
    // value once -- but this keeps the two states trivially reversible).
    vis.emojiText.visible = !portraitDrawn;
    pixiSetTextIfChanged(vis.emojiText, pixiUnitEmoji(unit));
    pixiSetFontSizeIfChanged(vis.emojiText, Math.floor(h * 0.4));
    vis.emojiText.y = -h * 0.18;

    pixiSetTextIfChanged(vis.nameText, (unit.name || '').split(' ')[0]);
    vis.nameText.y = h * 0.02;

    // HP bar with a decaying "chunk" trail behind the live-value bar so
    // recent damage reads as a shrinking trailing chunk.
    var hpPct = unit.maxHp > 0 ? Math.max(0, unit.hp / unit.maxHp) : 0;
    if (hpPct < vis.dispHp) {
        vis.dispHp = Math.max(hpPct, vis.dispHp - PIXI_HP_CHUNK_DECAY * (dtMs / 1000));
    } else {
        vis.dispHp = hpPct;
    }
    var barW = w * 0.86;
    var barH = Math.max(2, h * 0.07);
    var barY = h / 2 - barH * 2.6;
    vis.hpBack.clear();
    vis.hpBack.rect(-barW / 2, barY, barW, barH).fill({ color: 0x222222, alpha: 0.9 });
    vis.hpChunk.clear();
    vis.hpChunk.rect(-barW / 2, barY, barW * vis.dispHp, barH).fill({ color: 0xff8844, alpha: 0.9 });
    vis.hpFront.clear();
    vis.hpFront.rect(-barW / 2, barY, barW * hpPct, barH).fill({ color: hpPct < 0.3 ? 0xff6b6b : 0x6bcb77, alpha: 1 });

    vis.shieldBar.clear();
    if (unit.shield && unit.shield > 0 && unit.maxHp > 0) {
        var shieldPct = Math.min(1 - hpPct, unit.shield / unit.maxHp);
        if (shieldPct > 0) {
            vis.shieldBar.rect(-barW / 2 + barW * hpPct, barY, barW * shieldPct, barH).fill({ color: 0x4488ff, alpha: 0.9 });
        }
    }

    vis.manaBar.clear();
    if (unit.maxMana && unit.maxMana > 0) {
        var manaPct = Math.max(0, Math.min(1, unit.currentMana / unit.maxMana));
        var manaY = barY + barH + 1;
        vis.manaBar.rect(-barW / 2, manaY, barW, barH * 0.7).fill({ color: 0x1a1a3a, alpha: 0.9 });
        vis.manaBar.rect(-barW / 2, manaY, barW * manaPct, barH * 0.7).fill({ color: 0x4488ff, alpha: 1 });
        vis.manaBar.visible = true;
    } else {
        vis.manaBar.visible = false;
    }

    // Star/tier pips.
    pixiSetTextIfChanged(vis.pipsText, unit.stars ? new Array(unit.stars + 1).join('★') : '');
    vis.pipsText.y = h / 2 + 1;

    // Prompt 76 (Task 1): the 7 "big" status types (frozen/stunned/burning/
    // rooted/silenced/poisoned/bleeding) now get an animated overlay ON the
    // token (pixiDrawStatusOverlays below) instead of a mini emoji icon --
    // the icon row is left for everything else (slow/taunt/atkMod/buffs/
    // etc.), still capped at 3 + a condensed "+N" overflow marker exactly
    // like before.
    var statusStr = '';
    if (unit.statusEffects && unit.statusEffects.length > 0) {
        var uniqueTypes = [];
        for (var si = 0; si < unit.statusEffects.length; si++) {
            var sType = unit.statusEffects[si].type;
            if (PIXI_STATUS_ANIMATED.hasOwnProperty(sType)) continue;
            if (uniqueTypes.indexOf(sType) < 0) uniqueTypes.push(sType);
        }
        var shown = uniqueTypes.slice(0, 3);
        for (var i = 0; i < shown.length; i++) {
            statusStr += (typeof STATUS_ICONS !== 'undefined' && STATUS_ICONS[shown[i]]) ? STATUS_ICONS[shown[i]] : '❓';
        }
        if (uniqueTypes.length > 3) statusStr += '+' + (uniqueTypes.length - 3);
    }
    pixiSetTextIfChanged(vis.statusText, statusStr);
    vis.statusText.y = -h / 2 - 2;

    // Prompt 76 (Task 1): animated on-token overlays, driven fresh every
    // frame straight off unit.statusEffects (render-side only).
    pixiDrawStatusOverlays(vis.statusFxG, unit, w, h, PIXI_R.clock);

    // Boss enrage/invulnerable flags -- can't "reuse DOM chrome" for text
    // baked into the token itself (Pixi draws its own token), so this is
    // duplicated informational content, not rebuilt presentation.
    var flag = '';
    if (unit.isBoss) {
        if (unit.phaseTransitioning) flag = 'INVULNERABLE';
        else if (unit.enraged) flag = 'ENRAGED';
    }
    pixiSetTextIfChanged(vis.flagText, flag);
    vis.flagText.y = -h / 2 - 12;

    // Task 4: hit area sized to this frame's token box (w/h change with
    // boss span; depth/bob are container.scale, which PIXI.Rectangle hit
    // testing already accounts for via the container's transform).
    pixiUpdateHitArea(vis, w, h);

    // Task 4: element-colored selection ring, shown for the hovered unit.
    // Prompt 71 (Task 2): a white ring instead marks the unit currently
    // picked up for wave-transition reposition (PIXI_R.repositionSelectedUnit).
    vis.ring.clear();
    var repoSelected = PIXI_R.repositionMode && PIXI_R.repositionSelectedUnit === unit;
    if (repoSelected || PIXI_R.hoveredUnit === unit) {
        vis.ring.visible = true;
        var ringColor = repoSelected ? 0xffffff : pixiUnitElementColor(unit);
        vis.ring.roundRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8, 6).stroke({ width: repoSelected ? 3 : 2, color: ringColor, alpha: 0.95 });
        if (!repoSelected) pixiShowUnitTooltip(unit);
    } else {
        vis.ring.visible = false;
    }
}

function pixiUpdateHitArea(vis, w, h) {
    vis.container.hitArea.x = -w / 2;
    vis.container.hitArea.y = -h / 2;
    vis.container.hitArea.width = w;
    vis.container.hitArea.height = h;
}

// ---- Task 2 (Prompt 71, Phase 3.5): wave-transition reposition-on-arena ----
//
// Between waves, ui-combat.js's showWaveTransition() used to swap in a
// separate flat DOM grid (renderWaveRepositionGrid). It now stays on the
// SAME arena the fight just used: the combat Pixi Application/tokens are
// still mounted and frozen on the last rendered frame (the render loop stops
// when combat ends, but PIXI_R.app/unit tokens are only torn down at the
// NEXT wave's init -- see RENDER_PIXI.init's comment), so reposition mode
// just adds click affordances on top of what's already drawn rather than
// building a second token set.
//
// js/ui-combat.js owns what a click MEANS (mutating combatBoard + the
// clicked unit's gridRow/gridCol, exactly like the pre-Prompt-71 DOM version
// did) via the `clickCallback` passed to pixiEnterRepositionMode(); this file
// only owns hit-testing and redrawing, per the renderer/chrome split the rest
// of this codebase follows.

// Builds one invisible interactive hex per player-side cell (combat rows
// 4-7 -- the only rows a wave-transition reposition ever touches) so an
// EMPTY cell is clickable too, not just occupied ones (which already get a
// pointertap from their own token, wired in pixiCreateVisual above).
function pixiBuildRepositionTileHits() {
    if (!PIXI_R.tileHitLayer) return;
    pixiDestroyAllChildren(PIXI_R.tileHitLayer);
    var hexW = PIXI_R.cellW * 0.92;
    var hexH = PIXI_R.cellH * PIXI_CAM_Y_SQUASH * 0.92;
    for (var r = 4; r < PIXI_ROWS; r++) {
        for (var c = 0; c < PIXI_COLS; c++) {
            (function(row, col) {
                var center = boardToScreen(row, col);
                var hit = new PIXI.Container();
                hit.x = center.x;
                hit.y = center.y;
                hit.eventMode = 'static';
                hit.cursor = 'pointer';
                hit.hitArea = new PIXI.Polygon(pixiHexPoints(0, 0, hexW, hexH));
                hit.on('pointertap', function() {
                    if (PIXI_R.repositionMode && typeof PIXI_R.repositionClickCallback === 'function') {
                        PIXI_R.repositionClickCallback(row, col);
                    }
                });
                PIXI_R.tileHitLayer.addChild(hit);
            })(r, c);
        }
    }
}

// Translucent gold tint over every player-side cell while a unit is picked
// up (PIXI_R.repositionSelectedUnit set) -- "these are the cells you can
// drop onto" (any of them: occupied cells swap, empty cells move). Cleared
// entirely when nothing is selected.
function pixiUpdateRepositionHighlights() {
    if (!PIXI_R.repositionHighlightLayer) return;
    pixiDestroyAllChildren(PIXI_R.repositionHighlightLayer);
    if (!PIXI_R.repositionSelectedUnit) return;
    var g = new PIXI.Graphics();
    var hexW = PIXI_R.cellW * 0.92;
    var hexH = PIXI_R.cellH * PIXI_CAM_Y_SQUASH * 0.92;
    for (var r = 4; r < PIXI_ROWS; r++) {
        for (var c = 0; c < PIXI_COLS; c++) {
            var center = boardToScreen(r, c);
            g.poly(pixiHexPoints(center.x, center.y, hexW, hexH)).fill({ color: 0xe2b714, alpha: 0.14 });
        }
    }
    PIXI_R.repositionHighlightLayer.addChild(g);
}

// Re-runs the exact same per-token update/redraw combat's own frame() loop
// uses (pixiUpdateMovement/pixiRedrawToken) for every surviving player unit,
// once, on demand -- there is no rAF loop driving frame() during the
// wave-transition overlay, so a reposition click needs an explicit redraw
// pass to show its effect. dtMs=0 keeps this a plain snap (no HP-chunk decay
// or idle-bob advance); any cross-row/col jump is >1.5 cells by construction
// (a real board move), so pixiUpdateMovement's jump-distance check always
// takes the instant-snap branch, never a lerped slide.
function pixiRedrawAfterReposition() {
    if (!PIXI_R.ready || typeof combatState === 'undefined' || !combatState) return;
    for (var i = 0; i < combatState.playerUnits.length; i++) {
        var unit = combatState.playerUnits[i];
        if (!unit || unit.hp <= 0) continue;
        var vis = unit.__pixiVis;
        if (!vis) continue;
        pixiUpdateMovement(vis, unit, 0);
        pixiRedrawToken(vis, unit, 0);
    }
}

// Called by js/ui-combat.js's showWaveTransition(). `clickCallback(row, col)`
// receives COMBAT grid coordinates (4-7), matching unit.gridRow/gridCol
// directly -- see the Prompt 71 report for why the pre-existing DOM version's
// 0-3 "team builder row" convention was a source of a latent (harmless,
// because it was overwritten every wave anyway) gridRow bug this version
// does not repeat.
function pixiEnterRepositionMode(clickCallback) {
    if (!PIXI_R.ready) return;
    PIXI_R.repositionMode = true;
    PIXI_R.repositionSelectedUnit = null;
    PIXI_R.repositionClickCallback = clickCallback || null;
    pixiBuildRepositionTileHits();
    pixiUpdateRepositionHighlights();
    pixiRedrawAfterReposition();
}

// Called by js/ui-combat.js's uiNextWave()/showMissionResults() (leaving the
// wave-transition overlay either way -- starting the next wave or ending the
// mission). Idempotent (safe to call when reposition mode was never entered,
// e.g. the mission-complete path).
function pixiExitRepositionMode() {
    PIXI_R.repositionMode = false;
    PIXI_R.repositionSelectedUnit = null;
    PIXI_R.repositionClickCallback = null;
    if (PIXI_R.tileHitLayer) pixiDestroyAllChildren(PIXI_R.tileHitLayer);
    if (PIXI_R.repositionHighlightLayer) pixiDestroyAllChildren(PIXI_R.repositionHighlightLayer);
}

// Called by js/ui-combat.js's onWaveRepositionClick() after it has decided
// whether this click is a "pick up" or a "drop" (it owns combatBoard/gridRow
// mutation; this file just needs to know the resulting selection to redraw
// the ring + refresh the highlight tint + snap tokens into their new cells).
function pixiSetRepositionSelection(rowColOrNull) {
    if (!rowColOrNull) {
        PIXI_R.repositionSelectedUnit = null;
    } else if (typeof combatState !== 'undefined' && combatState) {
        var found = null;
        for (var i = 0; i < combatState.playerUnits.length; i++) {
            var u = combatState.playerUnits[i];
            if (u.gridRow === rowColOrNull.row && u.gridCol === rowColOrNull.col) { found = u; break; }
        }
        PIXI_R.repositionSelectedUnit = found;
    }
    pixiUpdateRepositionHighlights();
    pixiRedrawAfterReposition();
}

// ---- combatEvents-driven cosmetic effects ----

function pixiSpawnFloatingText(payload) {
    if (!PIXI_R.ready || !PIXI_R.floatLayer) return;
    var color = PIXI_DMG_COLORS.hasOwnProperty(payload.type) ? PIXI_DMG_COLORS[payload.type] : PIXI_DMG_COLORS.normal;
    var big = payload.type === 'crit' || payload.type === 'boss';
    var t = new PIXI.Text({
        text: payload.text,
        anchor: 0.5,
        style: { fontSize: big ? 16 : 12, fill: color, fontWeight: 'bold', stroke: { color: 0x000000, width: 2 } }
    });
    var floatCenter = boardToScreen(payload.row, payload.col); // Task 2: board-plane projection
    t.x = floatCenter.x + (pixiRngNext() - 0.5) * PIXI_R.cellW * 0.4;
    t.y = floatCenter.y;
    t._pixiFloatAge = 0;
    PIXI_R.floatLayer.addChild(t);
}

function pixiTickFloatingText(dtMs) {
    if (!PIXI_R.floatLayer) return;
    var speed = pixiGetCombatSpeed();
    var children = PIXI_R.floatLayer.children.slice();
    for (var i = 0; i < children.length; i++) {
        var t = children[i];
        t._pixiFloatAge += (dtMs / 1000) * speed;
        var life = 0.8; // matches render-dom.js's floatUp keyframe duration
        var p = Math.min(1, t._pixiFloatAge / life);
        t.y -= (dtMs / 1000) * speed * 22;
        t.alpha = 1 - p;
        t.scale.set(p < 0.2 ? (1 + p * 0.5) : (1.1 - (p - 0.2) * 0.375));
        if (p >= 1) {
            PIXI_R.floatLayer.removeChild(t);
            t.destroy();
        }
    }
}

function pixiFlashCells(payload) {
    if (!PIXI_R.ready || !PIXI_R.fxLayer) return;
    var g = new PIXI.Graphics();
    for (var i = 0; i < payload.cells.length; i++) {
        var cell = payload.cells[i];
        var flashCenter = boardToScreen(cell.row, cell.col); // Task 2: board-plane projection
        g.poly(pixiHexPoints(flashCenter.x, flashCenter.y, PIXI_R.cellW * 0.9, PIXI_R.cellH * PIXI_CAM_Y_SQUASH * 0.9))
            .fill({ color: pixiColorStringToHex(payload.color), alpha: 0.35 });
    }
    PIXI_R.fxLayer.addChild(g);
    g._pixiFlashAge = 0;
    g._pixiFlashDuration = (payload.duration || 300) / 1000;
}

function pixiTickFlashCells(dtMs) {
    if (!PIXI_R.fxLayer) return;
    var speed = pixiGetCombatSpeed();
    var children = PIXI_R.fxLayer.children.slice();
    for (var i = 0; i < children.length; i++) {
        var g = children[i];
        g._pixiFlashAge += (dtMs / 1000) * speed;
        g.alpha = Math.max(0, 1 - g._pixiFlashAge / g._pixiFlashDuration);
        if (g._pixiFlashAge >= g._pixiFlashDuration) {
            PIXI_R.fxLayer.removeChild(g);
            g.destroy();
        }
    }
}

function pixiColorStringToHex(color) {
    if (typeof color === 'number') return color;
    if (typeof color !== 'string') return 0xffffff;
    var hex = color.replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    var n = parseInt(hex, 16);
    return isNaN(n) ? 0xffffff : n;
}

function pixiOnAbilityCast(payload) {
    if (!PIXI_R.ready || !payload || !payload.caster) return;
    var vis = payload.caster.__pixiVis;
    if (vis) vis.castFlashT = 0.3;
}

// Prompt 67: registered once, at script-load time, via combatEvents.
// onPersistent() -- NOT per-wave -- for the exact same reason
// js/render-dom.js registers floatingText/abilityFlash this way (initCombat()
// itself can emit these mid-setup, before a per-wave listener would have
// re-registered after combatEvents.reset()). abilityCast has no such
// mid-setup emission today, but registering it the same way keeps this file
// consistent with the one documented convention rather than introducing a
// second, easy-to-get-wrong pattern.
if (typeof combatEvents !== 'undefined' && typeof combatEvents.onPersistent === 'function') {
    combatEvents.onPersistent('floatingText', function(p) { pixiSpawnFloatingText(p); });
    combatEvents.onPersistent('abilityFlash', function(p) { pixiFlashCells(p); });
    combatEvents.onPersistent('abilityCast', function(p) { pixiOnAbilityCast(p); });
}

// =============================================================================
// Prompt 76 (Phase 4.5): combat juice -- hit-stop, screen shake, kill
// streaks, victory/defeat sequences. See the file header + prompts/
// 76-combat-juice.md for the iron rule this section exists to satisfy:
// hit-stop is a RENDER-FRAME-ONLY pause. js/ui-combat.js's combat tick pump
// (combatTick(), setTimeout-cadenced, COMBAT_TICK_MS) is a completely
// separate loop from this file's frame()/the requestAnimationFrame render
// loop -- nothing below ever calls combatTick(), mutates combatState, or
// touches Math.random()/the seeded logic RNG stream. The only randomness
// used (screen-shake jitter direction) goes through this file's own
// pixiRngNext() cosmetic PRNG, exactly like every other cosmetic effect in
// this file. See tests/test-vfx.js's "juice: hit-stop ..." test for the
// determinism proof (forces hit-stop permanently ON for an entire seeded
// combat and asserts tick count/result/survivors are byte-identical to a
// run where the renderer never runs at all).
// =============================================================================

// ---- hit-stop: 40-60ms render-frame freeze on kills / big crits ----------

var PIXI_HITSTOP_KILL_MS = 55;             // TUNABLE: render freeze on any kill
var PIXI_HITSTOP_CRIT_MS = 45;             // TUNABLE: render freeze on a qualifying big crit
var PIXI_HITSTOP_CRIT_HP_FRACTION = 0.14;  // TUNABLE: crit must deal >=14% of target maxHp to qualify as "big"

// Only ever EXTENDS the freeze window (never shortens an in-progress one) --
// two hit-stop-worthy events landing within the same ~50ms real-time window
// (e.g. a crit that's also the killing blow) should read as one slightly
// longer pause, not restart from zero on the second trigger.
function pixiTriggerHitStop(ms) {
    if (!(ms > 0)) return;
    var until = Date.now() + ms;
    if (until > PIXI_R.hitStopUntil) PIXI_R.hitStopUntil = until;
}

// ---- screen shake: small stage-container shake, amplitude by damage tier -

var PIXI_SHAKE_CAP = 16;               // TUNABLE: hard cap on shake amplitude (px)
var PIXI_SHAKE_DECAY_PER_SEC = 26;     // TUNABLE: decay rate (px/nominal-second), combat-speed-scaled

function pixiTriggerScreenShake(amount) {
    if (!(amount > 0)) return;
    PIXI_R.shakeMagnitude = Math.min(PIXI_SHAKE_CAP, PIXI_R.shakeMagnitude + amount);
}

// Applied to PIXI_R.app.stage itself (the root of every layer -- grid,
// tokens, VFX decal/particle layers all mounted as its children) so the
// whole "camera" punches together rather than shaking pieces independently.
// dtMs is the SAME (possibly hit-stop-clamped) value RENDER_PIXI.frame()
// received this call -- shake visibly pauses during a hit-stop window too,
// which reads as part of the same "impact" beat rather than two disjoint
// effects.
function pixiUpdateScreenShake(dtMs) {
    if (!PIXI_R.app || !PIXI_R.app.stage) return;
    if (PIXI_R.shakeMagnitude > 0.05) {
        var dtSec = (dtMs / 1000) * pixiGetCombatSpeed();
        PIXI_R.shakeMagnitude = Math.max(0, PIXI_R.shakeMagnitude - PIXI_SHAKE_DECAY_PER_SEC * dtSec);
        var mag = PIXI_R.shakeMagnitude;
        PIXI_R.app.stage.x = (pixiRngNext() - 0.5) * 2 * mag;
        PIXI_R.app.stage.y = (pixiRngNext() - 0.5) * 2 * mag * 0.6; // squashed like the board plane
    } else if (PIXI_R.app.stage.x !== 0 || PIXI_R.app.stage.y !== 0) {
        PIXI_R.shakeMagnitude = 0;
        PIXI_R.app.stage.x = 0;
        PIXI_R.app.stage.y = 0;
    }
}

// ---- kill streaks: 3+ kills within 2s by one unit -> "RAMPAGE" flourish --

var PIXI_KILLSTREAK_WINDOW_S = 2.0;    // TUNABLE: combat-time window (combatState.elapsed, speed-invariant)
var PIXI_KILLSTREAK_THRESHOLD = 3;     // TUNABLE: kills within the window to trigger

function pixiUnitBannerAnchor(unit) {
    if (unit.__pixiVis && unit.__pixiVis.container) return { x: unit.__pixiVis.container.x, y: unit.__pixiVis.container.y };
    var p = boardToScreen(unit.gridRow, unit.gridCol);
    return { x: p.x, y: p.y };
}

function pixiSpawnRampageFlourish(unit) {
    if (!PIXI_R.ready || !PIXI_R.floatLayer || typeof PIXI === 'undefined' || typeof PIXI.Text !== 'function') return;
    var anchor = pixiUnitBannerAnchor(unit);
    var t = new PIXI.Text({
        text: 'RAMPAGE!',
        anchor: 0.5,
        style: { fontSize: 14, fill: 0xffcc22, fontWeight: 'bold', stroke: { color: 0x330000, width: 3 } }
    });
    t.x = anchor.x;
    t.y = anchor.y - PIXI_R.cellH * 0.7;
    t._pixiBannerAge = 0;
    t._pixiBannerLife = 0.9; // TUNABLE
    t._pixiBannerUnit = unit;
    PIXI_R.floatLayer.addChild(t);
    PIXI_R.unitBanners.push(t);
}

// Ticks every live unit banner (currently just the RAMPAGE flourish, but
// written generically) -- same combat-speed-scaled convention as
// pixiTickFloatingText/pixiTickFlashCells.
function pixiTickUnitBanners(dtMs) {
    if (!PIXI_R.unitBanners || PIXI_R.unitBanners.length === 0) return;
    var speed = pixiGetCombatSpeed();
    for (var i = PIXI_R.unitBanners.length - 1; i >= 0; i--) {
        var t = PIXI_R.unitBanners[i];
        t._pixiBannerAge += (dtMs / 1000) * speed;
        var p = Math.min(1, t._pixiBannerAge / t._pixiBannerLife);
        if (t._pixiBannerUnit && t._pixiBannerUnit.__pixiVis && t._pixiBannerUnit.__pixiVis.container) {
            t.x = t._pixiBannerUnit.__pixiVis.container.x;
        }
        t.y -= (dtMs / 1000) * speed * 26;
        t.alpha = p < 0.15 ? (p / 0.15) : (1 - (p - 0.15) / 0.85);
        if (t.scale && typeof t.scale.set === 'function') t.scale.set(p < 0.15 ? (0.6 + p / 0.15 * 0.5) : 1.1);
        if (p >= 1) {
            PIXI_R.floatLayer.removeChild(t);
            if (typeof t.destroy === 'function') t.destroy();
            PIXI_R.unitBanners.splice(i, 1);
        }
    }
}

// ---- victory/defeat result sequences --------------------------------------

var PIXI_RESULT_VICTORY_MS = 1000;     // TUNABLE: victory slow-mo window (real ms)
var PIXI_RESULT_SLOWMO_FACTOR = 0.4;   // TUNABLE: render-interpolation slowdown during that window
var PIXI_RESULT_DEFEAT_MS = 650;       // TUNABLE: defeat desaturation fade window (real ms)
var PIXI_RESULT_GOLD_COLOR = 0xffd24a;

// Called by js/ui-combat.js's showMissionResults() BEFORE it reveals the
// results DOM -- `done()` must always eventually fire (it's what actually
// shows #combat-results), so every early-out path below calls it
// synchronously rather than silently swallowing the callback. Render-only:
// no combatState/save mutation happens in here, only cosmetic playback on
// top of whatever the final frame already looks like.
function pixiPlayResultSequence(victory, done) {
    var safeDone = function() { try { done(); } catch (e) {} };
    var renderer = (typeof getActiveRenderer === 'function') ? getActiveRenderer() : null;
    if (!renderer || typeof renderer.frame !== 'function' || !PIXI_R.ready ||
        typeof requestAnimationFrame !== 'function' || typeof combatState === 'undefined' || !combatState) {
        safeDone();
        return;
    }

    if (victory) {
        // Gold burst over every surviving player unit. Cosmetic-PRNG only
        // (vfx.js's own vfxRngNext()) -- guarded, this file never assumes
        // vfx.js is loaded.
        if (typeof VFX !== 'undefined' && typeof VFX.play === 'function') {
            for (var i = 0; i < combatState.playerUnits.length; i++) {
                var u = combatState.playerUnits[i];
                if (u.hp > 0) {
                    VFX.play('burst', { unit: u, row: u.gridRow, col: u.gridCol, color: PIXI_RESULT_GOLD_COLOR, big: true, count: 12, duration: 0.8 });
                }
            }
        }
        // Render-side interpolation slowdown: every frame for ~1s of real
        // time gets fed a QUARTER-SCALE dtMs (renderer.frame(), same seam
        // renderCombatFrame() normally drives) -- idle bob, HP-bar chunk
        // decay, floating text, and the gold burst above all visibly play
        // out at ~0.4x speed. combatTick()/combatState are never touched;
        // the fight is already fully resolved by the time this runs.
        //
        // Browsers may throttle/fully suspend requestAnimationFrame for a
        // backgrounded/invisible tab -- if that happened here, the rAF loop
        // below would never reach its own exit condition and the results
        // screen would never appear (a real softlock, not just a slow
        // animation). safeDoneOnce() + the setTimeout safety net guarantee
        // `done()` fires within a bounded real-time budget regardless.
        var finished = false;
        function safeDoneOnce() {
            if (finished) return;
            finished = true;
            safeDone();
        }
        var last = null, elapsedMs = 0;
        function slowMoStep(now) {
            if (finished) return;
            if (last === null) last = now;
            var realDt = now - last;
            last = now;
            elapsedMs += realDt;
            renderer.frame(realDt * PIXI_RESULT_SLOWMO_FACTOR);
            if (elapsedMs < PIXI_RESULT_VICTORY_MS) {
                requestAnimationFrame(slowMoStep);
            } else {
                safeDoneOnce();
            }
        }
        requestAnimationFrame(slowMoStep);
        setTimeout(safeDoneOnce, PIXI_RESULT_VICTORY_MS + 500); // TUNABLE safety-net buffer
    } else {
        // Defeat: desaturation fade over the frozen final frame -- pure CSS,
        // no render-loop involvement needed.
        var boardEl = (typeof document !== 'undefined') ? document.getElementById('combat-board') : null;
        if (boardEl && boardEl.style) {
            boardEl.style.transition = 'filter ' + PIXI_RESULT_DEFEAT_MS + 'ms ease-in';
            boardEl.style.filter = 'grayscale(0.9) brightness(0.6)';
        }
        setTimeout(function() {
            if (boardEl && boardEl.style) { boardEl.style.filter = ''; boardEl.style.transition = ''; }
            safeDone();
        }, PIXI_RESULT_DEFEAT_MS);
    }
}

// ---- combatEvents wiring for the juice triggers above ---------------------

if (typeof combatEvents !== 'undefined' && typeof combatEvents.onPersistent === 'function') {
    combatEvents.onPersistent('unitDamaged', function(p) {
        if (!p || !p.target || !(p.target.maxHp > 0)) return;
        var pct = p.amount / p.target.maxHp;
        if (p.isCrit && pct >= PIXI_HITSTOP_CRIT_HP_FRACTION) pixiTriggerHitStop(PIXI_HITSTOP_CRIT_MS);
        // Screen shake by damage tier (TUNABLE amplitudes) -- covers both
        // "big hits" and "boss slams" (a boss's own attacks/telegraphs
        // routinely clear the top tier against typical player maxHp).
        if (pct >= 0.30) pixiTriggerScreenShake(9);
        else if (pct >= 0.18) pixiTriggerScreenShake(5);
        else if (pct >= 0.10) pixiTriggerScreenShake(2.5);
    });

    combatEvents.onPersistent('unitKilled', function(p) {
        if (!p) return;
        pixiTriggerHitStop(PIXI_HITSTOP_KILL_MS);
        if (!p.killer) return;
        var killer = p.killer;
        var now = (typeof combatState !== 'undefined' && combatState) ? combatState.elapsed : 0;
        if (!killer._pixiRecentKills) killer._pixiRecentKills = [];
        killer._pixiRecentKills.push(now);
        for (var i = killer._pixiRecentKills.length - 1; i >= 0; i--) {
            if (now - killer._pixiRecentKills[i] > PIXI_KILLSTREAK_WINDOW_S) killer._pixiRecentKills.splice(i, 1);
        }
        if (killer._pixiRecentKills.length >= PIXI_KILLSTREAK_THRESHOLD) {
            if (!killer._pixiRampageShown) {
                killer._pixiRampageShown = true;
                pixiSpawnRampageFlourish(killer);
            }
        } else {
            killer._pixiRampageShown = false;
        }
    });

    // Detonation punch: a telegraphed boss AoE going off is exactly the kind
    // of "detonation" the spec calls out for screen shake.
    combatEvents.onPersistent('bossTelegraphDetonate', function(p) {
        pixiTriggerScreenShake(7); // TUNABLE
    });
}

// ---- chrome duplication (enrage timer text + boss phase-transition flash)
// -- see the file header comment for why these two small bits can't just
// call render-dom.js's renderCombatBoard() directly. ----

// Prompt 76 (Task 2): pulsing HUD timer in the last 10s -- toggles a CSS
// class (game-v2.html's .enrage-timer-pulse keyframe) rather than animating
// anything in JS; cheap to call every frame, no-ops safely if the element
// doesn't support classList (permissive test-harness DOM stub).
var PIXI_ENRAGE_PULSE_THRESHOLD_S = 10; // TUNABLE

function pixiUpdateEnrageTimer(combatState) {
    var timerEl = document.getElementById('enrage-timer');
    if (!timerEl) return;
    if (combatState.bossUnit && combatState.bossUnit.hp > 0 && !combatState.bossUnit.enraged) {
        var bossData = combatState.bossUnit.bossData || {};
        var enrageTime = bossData.enrageTime || 120;
        var timeLeft = enrageTime - combatState.elapsed;
        if (timeLeft > 0 && timeLeft <= 30) {
            timerEl.textContent = '⏱️ Enrage: ' + Math.ceil(timeLeft) + 's';
            if (timerEl.classList) {
                if (timeLeft <= PIXI_ENRAGE_PULSE_THRESHOLD_S) timerEl.classList.add('enrage-timer-pulse');
                else timerEl.classList.remove('enrage-timer-pulse');
            }
        } else {
            timerEl.textContent = '';
            if (timerEl.classList) timerEl.classList.remove('enrage-timer-pulse');
        }
    } else {
        timerEl.textContent = '';
        if (timerEl.classList) timerEl.classList.remove('enrage-timer-pulse');
    }
}

// Prompt 76 (Task 2): "PHASE N" sweep-in/out banner -- reuses the wave-
// banner CSS family (game-v2.html's .wave-banner-sweep/.wave-banner-boss,
// see js/ui-combat.js's showWaveBanner()) with its own boss-flavored variant
// rather than inventing a second animation language for the same visual
// idea. Chrome-only DOM, no gameplay reads/writes.
var PIXI_PHASE_BANNER_MS = 2000; // TUNABLE: how long the phase banner holds before removal

function showPhaseBanner(boss) {
    var area = document.getElementById('combat-area');
    if (!area || !area.appendChild) return;
    var banner = document.createElement('div');
    banner.className = 'wave-banner-sweep wave-banner-boss wave-banner-phase';
    banner.textContent = '⚡ ' + (boss.name || 'Boss') + ' — PHASE ' + (boss.currentPhase + 1);
    area.appendChild(banner);
    (function(el) {
        setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, PIXI_PHASE_BANNER_MS);
    })(banner);
}

var PIXI_PHASE_PUNCH_SHAKE = 9; // TUNABLE: camera-level punch amplitude on a phase transition

var pixiPhaseOverlayShownFor = null;
function pixiUpdatePhaseTransitionOverlay(combatState) {
    var bossList = combatState.enemyUnits.filter(function(u) { return u.isBoss && u.hp > 0; });
    for (var i = 0; i < bossList.length; i++) {
        var boss = bossList[i];
        if (boss.phaseTransitioning && boss.phaseTransitionTimer > 1.5 && pixiPhaseOverlayShownFor !== boss) {
            pixiPhaseOverlayShownFor = boss;
            var overlay = document.createElement('div');
            overlay.className = 'phase-transition-overlay';
            var area = document.getElementById('combat-area');
            if (area && area.appendChild) area.appendChild(overlay);
            (function(el) {
                setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 2000);
            })(overlay);
            // Task 2: banner sweep + a camera-level punch (Task 3's screen
            // shake) on the same edge-trigger as the existing flash overlay.
            showPhaseBanner(boss);
            pixiTriggerScreenShake(PIXI_PHASE_PUNCH_SHAKE);
        } else if (!boss.phaseTransitioning) {
            if (pixiPhaseOverlayShownFor === boss) pixiPhaseOverlayShownFor = null;
        }
    }
}

// ---- Application lifecycle ----

function pixiSizeBoard(rs) {
    rs = rs || PIXI_R;
    var boardEl = rs.boardEl;
    var w = boardEl.clientWidth || boardEl.offsetWidth || 490;
    var h = boardEl.clientHeight || boardEl.offsetHeight || 320;
    // Prompt 69 hex migration: a packed hex board's actual content footprint
    // is NOT PIXI_COLS*cellW x PIXI_ROWS*cellH like the old square grid --
    // odd rows extend an extra cellW/2 to the right (odd-r offset), and rows
    // pack at 0.75*cellH vertically (cellToPixel()'s row spacing), so the
    // full board is (COLS+0.5) cells wide and ((ROWS-1)*0.75 + 1) cells tall.
    // Dividing by those instead of the raw col/row counts sizes cells so the
    // packed hex board actually fills the container, instead of leaving a
    // dead gap at the right/bottom the way a naive w/COLS, h/ROWS would.
    rs.cellW = w / (PIXI_COLS + 0.5);
    rs.cellH = h / ((PIXI_ROWS - 1) * 0.75 + 1);
}

function pixiEnsureApp() {
    if (PIXI_R.app) return; // already created (reused across waves -- see init())

    var boardEl = document.getElementById('combat-board');
    PIXI_R.boardEl = boardEl;
    boardEl.style.minHeight = '320px';

    var app = new PIXI.Application();
    PIXI_R.app = app;

    app.init({
        resizeTo: boardEl,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        // Prompt 82 (Phase 8.1): capped at 2 -- an uncapped devicePixelRatio
        // on a 3x/4x-DPR device (common on phones/high-DPI monitors) roughly
        // quadruples the canvas's actual pixel fill-rate cost for a visual
        // difference nobody can see at this placeholder-art fidelity; 2x is
        // already crisp and keeps the steady-60fps-at-4x-combat-speed budget
        // (18 units + VFX) safe on mid-tier hardware.
        resolution: Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1)
    }).then(function() {
        // Guards against destroy() tearing this exact app down while
        // app.init()'s promise was still pending (screen left mid-mount) --
        // compares against the closure-local `app`, not a generation
        // counter, so it's correct regardless of how many init()/destroy()
        // cycles ran in between.
        if (PIXI_R.app !== app) return;

        app.canvas.style.position = 'absolute';
        app.canvas.style.top = '0';
        app.canvas.style.left = '0';
        app.canvas.style.zIndex = '1';
        boardEl.appendChild(app.canvas);

        // Task 3: platformLayer is added BEFORE gridLayer so its "platform
        // frame" silhouette always paints beneath the tile group.
        PIXI_R.platformLayer = new PIXI.Container();
        PIXI_R.gridLayer = new PIXI.Container();
        // Prompt 71 (Task 2): reposition-mode-only layers -- eligible-cell
        // tint (repositionHighlightLayer) and per-cell click targets
        // (tileHitLayer), both empty/inert outside reposition mode. Sit
        // above the grid tiles but below unitLayer so a token on top of a
        // cell still wins the pointer hit test over that cell's hit target.
        PIXI_R.repositionHighlightLayer = new PIXI.Container();
        PIXI_R.tileHitLayer = new PIXI.Container();
        PIXI_R.markerLayer = new PIXI.Container();
        PIXI_R.drawnMarkers = {};
        PIXI_R.unitLayer = new PIXI.Container();
        PIXI_R.unitLayer.sortableChildren = true;
        PIXI_R.fxLayer = new PIXI.Container();
        PIXI_R.floatLayer = new PIXI.Container();

        app.stage.addChild(PIXI_R.platformLayer);
        app.stage.addChild(PIXI_R.gridLayer);
        app.stage.addChild(PIXI_R.repositionHighlightLayer);
        app.stage.addChild(PIXI_R.tileHitLayer);
        app.stage.addChild(PIXI_R.markerLayer);
        app.stage.addChild(PIXI_R.unitLayer);
        app.stage.addChild(PIXI_R.fxLayer);
        app.stage.addChild(PIXI_R.floatLayer);

        pixiSizeBoard();
        pixiMaybeRebuildGrid();

        PIXI_R.ready = true;
    }).catch(function(err) {
        if (typeof console !== 'undefined' && console.error) {
            console.error('render-pixi.js: PIXI.Application.init() failed', err);
        }
        // Prompt 71 (Phase 3.5, Task 3): the DOM renderer this used to fall
        // back to (js/render-dom.js) is deleted -- pixi is now the only
        // registered renderer, so a WebGL init failure has nowhere to fall
        // back to. Show a clear "requires WebGL" notice instead of silently
        // leaving a dead canvas (PIXI_R.ready never becomes true, so frame()
        // would just no-op forever otherwise, per the old comment here).
        if (typeof pixiShowWebGLRequiredNotice === 'function') {
            pixiShowWebGLRequiredNotice(boardEl, err);
        }
    });
}

// Prompt 71 (Task 3): replaces combat with a plain DOM message when WebGL
// is unavailable/broken -- "no silent fallback to a deleted renderer" per
// the spec. `boardEl` is #combat-board (pixiEnsureApp's only caller today);
// js/ui-builder.js's builder-mode arena calls this too (with its own board
// element) if ITS PIXI.Application.init() rejects, so the message is written
// generically ("This game requires WebGL") rather than combat-specific.
function pixiShowWebGLRequiredNotice(boardEl, err) {
    if (!boardEl) return;
    var notice = document.createElement('div');
    notice.className = 'webgl-required-notice';
    notice.innerHTML = '<div class="webgl-required-icon">⚠️</div>' +
        '<div class="webgl-required-title">This game requires WebGL</div>' +
        '<div class="webgl-required-desc">Your browser or device could not start a WebGL context. ' +
        'Try updating your browser, enabling hardware acceleration, or using a different device.</div>';
    boardEl.innerHTML = '';
    boardEl.appendChild(notice);
}

var RENDER_PIXI = {
    // Second param named `cs`, not `combatState`, on purpose -- see
    // js/render-dom.js's RENDER_DOM.init for the same choice: this file
    // reads the live global `combatState` inside frame() every call (it
    // changes out from under the renderer every tick, per the documented
    // interface), so a local param named identically would shadow it and
    // invite bugs.
    init: function(container, cs, context) {
        pixiPhaseOverlayShownFor = null;
        PIXI_R.hoveredUnit = null; // Task 4: don't carry a hover/tooltip from the previous wave's now-destroyed token
        pixiHideUnitTooltip();

        // Prompt 83 (Phase 5.6): kick off portrait texture loads for every
        // unit fighting THIS wave, up front -- "lazy per-combat preload of
        // the units actually fighting" per the spec. Fire-and-forget: this
        // never blocks init() or delays the first frame() call, tokens just
        // draw their placeholder until pixiApplyPortraitToToken() picks up
        // the resolved texture on a later frame.
        pixiPreloadCombatPortraits(cs);

        // Prompt 76: combat-juice render state is per-wave-session cosmetic
        // only -- reset here so a hit-stop/shake left mid-flight by a wave
        // that just ended (or the previous mission entirely) never bleeds
        // into the next wave's very first frame.
        PIXI_R.hitStopUntil = 0;
        PIXI_R.shakeMagnitude = 0;
        PIXI_R.unitBanners = [];
        if (PIXI_R.app && PIXI_R.app.stage) { PIXI_R.app.stage.x = 0; PIXI_R.app.stage.y = 0; }

        // Player units are the SAME object references across every wave of
        // a mission (combatBoard/deployTeam() in ui-combat.js persists them
        // for HP/mana carry-over -- only enemy units are freshly created
        // per wave); initCombat() reuses them in place rather than
        // recreating them. Any stale __pixiVis left over from a previous
        // wave's now-destroyed containers (see the pixiDestroyAllChildren
        // calls below) must be cleared here, or frame() would try to draw
        // into a destroyed PIXI.Container next wave.
        if (cs) {
            var initUnits = (cs.playerUnits || []).concat(cs.enemyUnits || []);
            for (var iu = 0; iu < initUnits.length; iu++) {
                initUnits[iu].__pixiVis = null;
            }
        }

        // Reuse one PIXI.Application across waves (created once, lazily) --
        // avoids tearing down/recreating a WebGL context on every wave
        // transition, which is what the "prove no leak over 10 waves"
        // verification step in the spec is checking for. Per-wave state
        // (unit visuals, in-flight floats/flashes) IS torn down here.
        if (!PIXI_R.app) {
            pixiEnsureApp();
        } else if (PIXI_R.ready) {
            pixiDestroyAllChildren(PIXI_R.unitLayer);
            pixiDestroyAllChildren(PIXI_R.fxLayer);
            pixiDestroyAllChildren(PIXI_R.floatLayer);
            pixiDestroyAllChildren(PIXI_R.markerLayer);
            PIXI_R.drawnMarkers = {};
            pixiSizeBoard();
            pixiMaybeRebuildGrid();
        }
    },

    frame: function(dtMs) {
        if (!PIXI_R.ready || typeof combatState === 'undefined' || !combatState) return;

        // Prompt 76 (Task 3): hit-stop -- clamp the dtMs THIS FUNCTION
        // advances every downstream animation/clock by to 0 while a freeze
        // window is active. This never touches js/ui-combat.js's independent
        // combatTick() pump (a separate setTimeout loop that never calls into
        // this file) -- combat logic keeps ticking at its normal cadence
        // throughout; only what gets DRAWN stops changing for up to ~60ms of
        // real time. See tests/test-vfx.js's hit-stop determinism test.
        if (Date.now() < PIXI_R.hitStopUntil) dtMs = 0;

        // Task 4: idle-bob clock, scaled by COMBAT_SPEED like every other
        // cosmetic timer in this file (pixiTickFloatingText/pixiTickFlashCells).
        PIXI_R.clock += (dtMs / 1000) * pixiGetCombatSpeed();

        pixiSizeBoard();
        pixiMaybeRebuildGrid();

        var allUnits = combatState.playerUnits.concat(combatState.enemyUnits);
        for (var u = 0; u < allUnits.length; u++) {
            var unit = allUnits[u];
            if (unit.deathComplete) continue;
            if (unit.hp <= 0 && !unit.deathAnimating) continue;

            // Visual state is attached directly to the (per-wave) unit
            // object -- see pixiCreateVisual's comment for why this is
            // preferred over a side Map here. Units never leave
            // playerUnits/enemyUnits mid-wave (death just stops updating
            // them once deathComplete), so there is no mid-wave removal
            // case to handle -- only the wave-transition/destroy teardown
            // paths above/below need to reclaim visuals.
            var vis = unit.__pixiVis;
            if (!vis) vis = pixiCreateVisual(unit);
            pixiUpdateMovement(vis, unit, dtMs);
            pixiRedrawToken(vis, unit, dtMs);
        }

        pixiDrawDeathMarkers(combatState);

        pixiTickFloatingText(dtMs);
        pixiTickFlashCells(dtMs);
        pixiTickUnitBanners(dtMs);
        pixiUpdateScreenShake(dtMs);

        // Prompt 72 (VFX framework): ticked AFTER the per-unit redraw loop
        // above so js/vfx.js's `shake` primitive (the one primitive that
        // jitters an EXISTING token's container.x/y rather than drawing its
        // own display object) lands on top of this frame's already-computed
        // "true" position instead of being overwritten by it. Guarded --
        // js/vfx.js loads after this file but is still an optional add-on
        // (e.g. a future headless caller of RENDER_PIXI.frame() without it loaded).
        if (typeof VFX !== 'undefined' && typeof VFX.frame === 'function') VFX.frame(dtMs);

        if (typeof renderEncounterMechanicBanner === 'function') renderEncounterMechanicBanner();
        if (typeof updateEncounterMechanicHud === 'function') updateEncounterMechanicHud();
        pixiUpdateEnrageTimer(combatState);
        pixiUpdatePhaseTransitionOverlay(combatState);
        // Prompt 71 (Task 3): js/render-dom.js's own renderCombatBoard() used
        // to call this every frame; nothing called it for the pixi renderer
        // (the actual default since Prompt 70), so #combat-scoreboard was a
        // silent, permanently-empty no-op whenever pixi was active -- fixed
        // here rather than left to rot further now that render-dom.js (the
        // only renderer that ever DID call it) is gone.
        if (typeof renderCombatScoreboard === 'function') renderCombatScoreboard();
    },

    destroy: function() {
        // Prompt 72 (VFX framework): retire every live VFX instance before
        // the stage tree goes away -- app.destroy() below recursively
        // destroys VFX_R.decalLayer/particleLayer (mounted as children of
        // app.stage by js/vfx.js's vfxEnsureLayers()) either way, but this
        // also clears VFX_R.active/liveParticles bookkeeping and drops the
        // stale attachedApp reference so the NEXT combat screen's first
        // VFX.play() re-mounts fresh layers onto the next Application.
        if (typeof VFX !== 'undefined' && typeof VFX.reset === 'function') VFX.reset();

        // app.destroy(..., {children:true, texture:true, ...}) recursively
        // destroys the whole stage tree (every layer and everything in it)
        // in one pass -- no need to walk the layers manually first (doing
        // both risks a double-destroy() on the same child).
        if (PIXI_R.app) {
            try {
                PIXI_R.app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true, context: true });
            } catch (e) {
                if (typeof console !== 'undefined' && console.error) console.error('render-pixi.js: destroy() error', e);
            }
        }
        PIXI_R.app = null;
        PIXI_R.ready = false;
        PIXI_R.platformLayer = null;
        PIXI_R.gridLayer = null;
        PIXI_R.repositionHighlightLayer = null;
        PIXI_R.tileHitLayer = null;
        PIXI_R.markerLayer = null;
        PIXI_R.drawnMarkers = null;
        PIXI_R.unitLayer = null;
        PIXI_R.fxLayer = null;
        PIXI_R.floatLayer = null;
        PIXI_R.boardEl = null;
        PIXI_R.hoveredUnit = null;
        PIXI_R.clock = 0;
        PIXI_R.lastGridW = -1;
        PIXI_R.lastGridH = -1;
        PIXI_R.repositionMode = false;
        PIXI_R.repositionSelectedUnit = null;
        PIXI_R.repositionClickCallback = null;
        PIXI_R.hitStopUntil = 0;
        PIXI_R.shakeMagnitude = 0;
        PIXI_R.unitBanners = [];
        pixiHideUnitTooltip();

        var enrageTimer = document.getElementById('enrage-timer');
        if (enrageTimer) { enrageTimer.textContent = ''; if (enrageTimer.classList) enrageTimer.classList.remove('enrage-timer-pulse'); }
        var banner = document.getElementById('encounter-mechanic-banner');
        if (banner) banner.style.display = 'none';
        var hud = document.getElementById('encounter-mechanic-hud');
        if (hud) hud.style.display = 'none';
    }
};

if (typeof PIXI !== 'undefined' && typeof registerRenderer === 'function') {
    registerRenderer('pixi', RENDER_PIXI);
}

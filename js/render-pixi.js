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
    gridLayer: null,      // PIXI.Container: static tile background (rebuilt only on resize)
    markerLayer: null,    // PIXI.Container: death markers, added incrementally per wave
    drawnMarkers: null,   // {row,col key -> true} for markerLayer, reset per wave
    unitLayer: null,      // PIXI.Container: per-unit tokens (sortable by row)
    fxLayer: null,        // PIXI.Container: ability-flash cell rects
    floatLayer: null,     // PIXI.Container: floating combat text, always topmost
    cellW: 0,
    cellH: 0
};

// ---- small helpers ----

function pixiLerp(a, b, t) { return a + (b - a) * t; }

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

var pixiLastGridW = -1;
var pixiLastGridH = -1;

function pixiMaybeRebuildGrid() {
    if (PIXI_R.cellW === pixiLastGridW && PIXI_R.cellH === pixiLastGridH) return;
    pixiLastGridW = PIXI_R.cellW;
    pixiLastGridH = PIXI_R.cellH;
    pixiBuildGrid();
}

function pixiBuildGrid() {
    pixiDestroyAllChildren(PIXI_R.gridLayer);
    var g = new PIXI.Graphics();
    for (var r = 0; r < PIXI_ROWS; r++) {
        for (var c = 0; c < PIXI_COLS; c++) {
            var x = c * PIXI_R.cellW;
            var y = r * PIXI_R.cellH;
            var fill = r <= 3 ? 0x1a0a0a : 0x0a1628;
            g.rect(x + 1, y + 1, PIXI_R.cellW - 2, PIXI_R.cellH - 2)
                .fill({ color: fill, alpha: 0.6 })
                .stroke({ width: 1, color: 0x333333, alpha: 0.5 });
        }
    }
    // Row 4 divider (enemy/player split), matching render-dom.js's border-top.
    g.rect(0, 4 * PIXI_R.cellH - 1, PIXI_COLS * PIXI_R.cellW, 2).fill({ color: 0x555555, alpha: 0.8 });
    PIXI_R.gridLayer.addChild(g);
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
            style: { fontSize: Math.floor(PIXI_R.cellH * 0.5), fill: 0xffffff }
        });
        t.alpha = 0.2;
        t.x = c * PIXI_R.cellW + PIXI_R.cellW / 2;
        t.y = r * PIXI_R.cellH + PIXI_R.cellH / 2;
        PIXI_R.markerLayer.addChild(t);
    }
}

// ---- per-unit visual token ----

function pixiCreateVisual(unit) {
    var container = new PIXI.Container();

    var base = new PIXI.Graphics();
    container.addChild(base);

    var emojiText = new PIXI.Text({
        text: pixiUnitEmoji(unit),
        anchor: 0.5,
        style: { fontSize: 14, fill: 0xffffff }
    });
    container.addChild(emojiText);

    var nameText = new PIXI.Text({
        text: (unit.name || '').split(' ')[0],
        anchor: { x: 0.5, y: 0 },
        style: { fontSize: 8, fill: unit.side === 'enemy' ? 0xff6b6b : 0xdddddd }
    });
    container.addChild(nameText);

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

    PIXI_R.unitLayer.addChild(container);

    var vis = {
        container: container,
        base: base,
        emojiText: emojiText,
        nameText: nameText,
        hpBack: hpBack,
        hpChunk: hpChunk,
        hpFront: hpFront,
        shieldBar: shieldBar,
        manaBar: manaBar,
        pipsText: pipsText,
        statusText: statusText,
        flagText: flagText,
        row: unit.gridRow,
        col: unit.gridCol,
        segRow0: unit.gridRow, segCol0: unit.gridCol,
        segRowT: unit.gridRow, segColT: unit.gridCol,
        segDuration: 0, segElapsed: 0,
        dispHp: unit.maxHp > 0 ? (unit.hp / unit.maxHp) : 0,
        castFlashT: 0,
        alive: true
    };
    // Attach directly to the unit object (same convention render-dom.js
    // uses for unit._uid) rather than a side Map -- keeps this file ES5-
    // style like the rest of the codebase and needs no separate registry
    // to garbage-collect: the visual dies with the unit object when
    // initCombat() builds a fresh combatState for the next wave.
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
        } else {
            vis.row = pixiLerp(vis.segRow0, vis.segRowT, t);
            vis.col = pixiLerp(vis.segCol0, vis.segColT, t);
        }
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

    vis.container.x = vis.col * PIXI_R.cellW + (PIXI_R.cellW * span) / 2;
    vis.container.y = vis.row * PIXI_R.cellH + (PIXI_R.cellH * span) / 2;
    // Painter's order tie-break: per the Prompt 68 spec, lower rows draw
    // above higher rows -- larger zIndex wins in Pixi's sortableChildren.
    vis.container.zIndex = 1000 - unit.gridRow;

    // Death fade-out.
    if (unit.deathAnimating) {
        var deathPct = Math.max(0, (unit.deathTimer || 0) / 0.5);
        vis.container.alpha = deathPct;
        vis.container.scale.set(0.5 + deathPct * 0.5);
    } else {
        vis.container.alpha = 1;
        vis.container.scale.set(1);
    }

    vis.base.clear();
    vis.base.roundRect(-w / 2, -h / 2, w, h, 4).fill({ color: tint, alpha: 0.85 });
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

    vis.emojiText.text = pixiUnitEmoji(unit);
    vis.emojiText.style.fontSize = Math.floor(h * 0.4);
    vis.emojiText.y = -h * 0.18;

    vis.nameText.text = (unit.name || '').split(' ')[0];
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
    vis.pipsText.text = unit.stars ? new Array(unit.stars + 1).join('★') : '';
    vis.pipsText.y = h / 2 + 1;

    // Status icons: up to 3 unique types + overflow count (parity with DOM).
    var statusStr = '';
    if (unit.statusEffects && unit.statusEffects.length > 0) {
        var uniqueTypes = [];
        for (var si = 0; si < unit.statusEffects.length; si++) {
            var sType = unit.statusEffects[si].type;
            if (uniqueTypes.indexOf(sType) < 0) uniqueTypes.push(sType);
        }
        var shown = uniqueTypes.slice(0, 3);
        for (var i = 0; i < shown.length; i++) {
            statusStr += (typeof STATUS_ICONS !== 'undefined' && STATUS_ICONS[shown[i]]) ? STATUS_ICONS[shown[i]] : '❓';
        }
        if (uniqueTypes.length > 3) statusStr += '+' + (uniqueTypes.length - 3);
    }
    vis.statusText.text = statusStr;
    vis.statusText.y = -h / 2 - 2;

    // Boss enrage/invulnerable flags -- can't "reuse DOM chrome" for text
    // baked into the token itself (Pixi draws its own token), so this is
    // duplicated informational content, not rebuilt presentation.
    var flag = '';
    if (unit.isBoss) {
        if (unit.phaseTransitioning) flag = 'INVULNERABLE';
        else if (unit.enraged) flag = 'ENRAGED';
    }
    vis.flagText.text = flag;
    vis.flagText.y = -h / 2 - 12;
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
    t.x = payload.col * PIXI_R.cellW + PIXI_R.cellW / 2 + (pixiRngNext() - 0.5) * PIXI_R.cellW * 0.4;
    t.y = payload.row * PIXI_R.cellH + PIXI_R.cellH / 2;
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
        g.rect(cell.col * PIXI_R.cellW + 1, cell.row * PIXI_R.cellH + 1, PIXI_R.cellW - 2, PIXI_R.cellH - 2)
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

// ---- chrome duplication (enrage timer text + boss phase-transition flash)
// -- see the file header comment for why these two small bits can't just
// call render-dom.js's renderCombatBoard() directly. ----

function pixiUpdateEnrageTimer(combatState) {
    var timerEl = document.getElementById('enrage-timer');
    if (!timerEl) return;
    if (combatState.bossUnit && combatState.bossUnit.hp > 0 && !combatState.bossUnit.enraged) {
        var bossData = combatState.bossUnit.bossData || {};
        var enrageTime = bossData.enrageTime || 120;
        var timeLeft = enrageTime - combatState.elapsed;
        if (timeLeft > 0 && timeLeft <= 30) {
            timerEl.textContent = '⏱️ Enrage: ' + Math.ceil(timeLeft) + 's';
        } else {
            timerEl.textContent = '';
        }
    } else {
        timerEl.textContent = '';
    }
}

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
        } else if (!boss.phaseTransitioning) {
            if (pixiPhaseOverlayShownFor === boss) pixiPhaseOverlayShownFor = null;
        }
    }
}

// ---- Application lifecycle ----

function pixiSizeBoard() {
    var boardEl = PIXI_R.boardEl;
    var w = boardEl.clientWidth || boardEl.offsetWidth || 490;
    var h = boardEl.clientHeight || boardEl.offsetHeight || 320;
    PIXI_R.cellW = w / PIXI_COLS;
    PIXI_R.cellH = h / PIXI_ROWS;
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
        resolution: (typeof window !== 'undefined' && window.devicePixelRatio) || 1
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

        PIXI_R.gridLayer = new PIXI.Container();
        PIXI_R.markerLayer = new PIXI.Container();
        PIXI_R.drawnMarkers = {};
        PIXI_R.unitLayer = new PIXI.Container();
        PIXI_R.unitLayer.sortableChildren = true;
        PIXI_R.fxLayer = new PIXI.Container();
        PIXI_R.floatLayer = new PIXI.Container();

        app.stage.addChild(PIXI_R.gridLayer);
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
    });
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

        if (typeof renderEncounterMechanicBanner === 'function') renderEncounterMechanicBanner();
        if (typeof updateEncounterMechanicHud === 'function') updateEncounterMechanicHud();
        pixiUpdateEnrageTimer(combatState);
        pixiUpdatePhaseTransitionOverlay(combatState);
    },

    destroy: function() {
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
        PIXI_R.gridLayer = null;
        PIXI_R.markerLayer = null;
        PIXI_R.drawnMarkers = null;
        PIXI_R.unitLayer = null;
        PIXI_R.fxLayer = null;
        PIXI_R.floatLayer = null;
        PIXI_R.boardEl = null;
        pixiLastGridW = -1;
        pixiLastGridH = -1;

        var enrageTimer = document.getElementById('enrage-timer');
        if (enrageTimer) enrageTimer.textContent = '';
        var banner = document.getElementById('encounter-mechanic-banner');
        if (banner) banner.style.display = 'none';
        var hud = document.getElementById('encounter-mechanic-hud');
        if (hud) hud.style.display = 'none';
    }
};

if (typeof PIXI !== 'undefined' && typeof registerRenderer === 'function') {
    registerRenderer('pixi', RENDER_PIXI);
}

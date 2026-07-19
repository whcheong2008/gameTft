// ui-gacha.js -- summon screen + shop display (split from ui-v2.js)
//
// Prompt 78 (Phase 6.3): rebuilt the summon screen as a DOM/CSS "ceremony" --
// an altar scene (arena-backdrop recipe family, see js/ui-combat.js's
// buildArenaBackdrop()/js/ui-hub.js's buildHubCampBackdrop() for the same
// pattern) with a summon circle centerpiece, tier-colored card-flip reveals,
// and a collapsible rates/pity sv-panel. Presentation only: doSingleRoll()/
// doMultiRoll() (js/gacha.js) still run exactly when they always did (VE
// spend + collection mutation happen synchronously on click, same as
// before) -- only the reveal is staged visually.
//
// No JS timers anywhere in the reveal path (setTimeout is a deliberate
// no-op in tests/harness.js, so timer-gated reveals would never fire
// headlessly). Instead, every stage of the ceremony is a CSS transition
// with its delay set as an inline style per element (same pattern the
// original file already used for the multi-roll's animationDelay stagger),
// kicked off via the same "toggle a class, force a reflow, toggle it again"
// trick js/hub.js's showScreen() uses to restart its own transition. That
// means the full result set is always present in the DOM synchronously the
// instant uiDoSingleRoll()/uiDoMultiRoll() returns -- reduced-motion and
// full-motion produce the identical DOM, differing only in how the (CSS-
// only) transition/animation declarations play out, which is exactly what
// lets game-v2.html's `@media (prefers-reduced-motion: reduce)` block
// collapse everything to instant reveals without this file ever having to
// branch on the browser's reduced-motion media-query API in JS.

// ---- Gacha Screen: Altar Backdrop (Prompt 78) ----
// Same .arena-bd-horizon/.arena-bd-hexfield/.arena-bd-blob/.arena-bd-vignette
// layer recipe combat/team-builder/hub already use, themed as a mystic
// purple/gold summoning glow into a dedicated #gacha-altar-backdrop element.
// arenaBdHexPatternCss() lives in js/ui-combat.js, which loads AFTER this
// file -- safe because it's only ever called once the screen is actually
// rendered, by which point every script has finished loading (same
// reasoning as js/ui-hub.js's buildHubCampBackdrop()).
var GACHA_ALTAR_THEME = { glow: '#3a1a5e', accent: '#b388ff', blobA: '#1c0e30', blobB: '#241040', blobC: '#150a26' };

function buildGachaAltarBackdrop() {
    var el = document.getElementById('gacha-altar-backdrop');
    // Empty innerHTML is the "not built yet" signal (see buildHubCampBackdrop()
    // for why this is safer than a custom flag property under the test
    // harness's permissive element Proxy).
    if (!el || el.innerHTML) return;
    var theme = GACHA_ALTAR_THEME;
    var hexCss = (typeof arenaBdHexPatternCss === 'function')
        ? arenaBdHexPatternCss(theme.accent)
        : ('repeating-linear-gradient(60deg, ' + theme.accent + '22 0px, ' + theme.accent + '22 1px, transparent 1px, transparent 42px), ' +
           'repeating-linear-gradient(-60deg, ' + theme.accent + '22 0px, ' + theme.accent + '22 1px, transparent 1px, transparent 42px)');
    el.innerHTML =
        '<div class="arena-bd-horizon" style="background:radial-gradient(ellipse 90% 70% at 50% 18%, ' + theme.glow + 'cc 0%, transparent 70%);"></div>' +
        '<div class="arena-bd-hexfield" style="background-image:' + hexCss + ';"></div>' +
        '<div class="arena-bd-blob arena-bd-blob-a" style="background:' + theme.blobA + ';"></div>' +
        '<div class="arena-bd-blob arena-bd-blob-b" style="background:' + theme.blobB + ';"></div>' +
        '<div class="arena-bd-blob arena-bd-blob-c" style="background:' + theme.blobC + ';"></div>' +
        '<div class="arena-bd-vignette"></div>';
}

// ---- Gacha Screen: Ceremony DOM Skeleton (Prompt 78) ----
// Built once (idempotent -- same innerHTML-truthiness guard as
// buildHubCampBackdrop()) and reused across every renderGachaScreen() call.
// File scope forbids touching game-v2.html's <body> markup, so the whole
// altar/circle/panel/results structure is generated here instead -- the
// static markup only ever provided a bare `<div id="screen-gacha">`.
// Every element other code needs to reach keeps its original id
// (gacha-rates, btn-roll-1, btn-roll-10, gacha-roll-results, gacha-shop,
// gacha-pity-info) so renderShopUI() and js/hub.js's renderCurrentScreen()
// dispatch (`case 'gacha': renderGachaScreen();`) need zero changes.
//
// The "already built" guard can't reuse buildHubCampBackdrop()'s plain
// innerHTML-truthiness check: #screen-gacha itself is the *pre-existing*
// static container (its legacy children -- the old flat gacha-rates/
// gacha-controls/gacha-roll-results/gacha-shop markup -- are still sitting
// in game-v2.html's <body>, out of this prompt's file scope to remove), so
// in a real browser screen.innerHTML is already non-empty at page load,
// before this function ever runs. A getAttribute() marker is used instead
// -- real DOM attributes start unset regardless of whatever static content
// coexists, and tests/harness.js's element stub honors getAttribute()
// correctly too (a real `attributes` object, not the Proxy's
// never-set-custom-property trap -- see buildHubCampBackdrop()'s own
// comment for why a plain custom property would be unsafe here).
function ensureGachaCeremonyDom() {
    var screen = document.getElementById('screen-gacha');
    if (!screen || screen.getAttribute('data-gacha-ceremony-built')) return;
    screen.setAttribute('data-gacha-ceremony-built', '1');

    screen.innerHTML =
        '<div class="screen-title">🎲 Attunement Rite</div>' +
        '<div class="gacha-altar-scene">' +
            '<div id="gacha-altar-backdrop"></div>' +
            '<div class="gacha-altar-content" id="gacha-altar-content" onclick="skipGachaCeremonyAnim()">' +
                '<div class="gacha-summon-circle" id="gacha-summon-circle">' +
                    '<div class="gacha-summon-circle-ring"></div>' +
                    '<div class="gacha-summon-circle-glyphs"></div>' +
                    '<div class="gacha-summon-circle-core"></div>' +
                    '<div class="gacha-summon-hint">Tap to skip</div>' +
                '</div>' +
                '<div class="gacha-controls">' +
                    '<button class="gacha-btn sv-btn sv-btn-gold" id="btn-roll-1" onclick="event.stopPropagation(); uiDoSingleRoll();">Rite x1 (50 VE)</button>' +
                    '<button class="gacha-btn sv-btn sv-btn-primary" id="btn-roll-10" onclick="event.stopPropagation(); uiDoMultiRoll();">Rite x10 (450 VE)</button>' +
                '</div>' +
                '<div class="sv-panel gacha-rates-panel" id="gacha-rates-panel">' +
                    '<button type="button" class="sv-panel-header gacha-rates-toggle" onclick="event.stopPropagation(); toggleGachaRatesPanel();">' +
                        '<span>Rates &amp; Pity</span><span class="gacha-rates-caret">▾</span>' +
                    '</button>' +
                    '<div class="sv-panel-body gacha-rates-body">' +
                        '<div class="gacha-rates" id="gacha-rates"></div>' +
                        '<div class="gacha-pity-wrap" id="gacha-pity-info"></div>' +
                    '</div>' +
                '</div>' +
                '<div id="gacha-roll-results" class="gacha-results" style="display:none;"></div>' +
            '</div>' +
        '</div>' +
        '<div id="gacha-shop" class="gacha-results"></div>';

    buildGachaAltarBackdrop();

    // Cosmetic only (real-browser polish): let the charge keyframe hand
    // control back to the idle pulse once it finishes, instead of freezing
    // the circle in its "charged" pose forever. Never fires headlessly
    // (tests/harness.js's addEventListener() is a no-op) and nothing
    // depends on it firing.
    var circle = document.getElementById('gacha-summon-circle');
    if (circle && circle.addEventListener) {
        circle.addEventListener('animationend', function(e) {
            if (e && e.animationName === 'gachaCoreCharge' && circle.classList) {
                circle.classList.remove('is-charging');
            }
        });
    }
}

// Toggles the rates/pity sv-panel open/closed. Named (rather than an inline
// closure) so it's directly callable from tests, same as every other
// onclick="..." hook in this file.
function toggleGachaRatesPanel() {
    var panel = document.getElementById('gacha-rates-panel');
    if (panel && panel.classList) panel.classList.toggle('collapsed');
}

// Click-to-skip: a single delegated handler on the altar content wrapper
// (covers the summon circle, and clicking anywhere over the in-progress
// reveal) that just adds a class -- game-v2.html's P78 CSS block zeroes
// every transition/animation duration+delay under `.gacha-skip-anim`,
// snapping whatever's mid-flight straight to its end state. No JS timer to
// cancel because there never was one.
function skipGachaCeremonyAnim() {
    var altarContent = document.getElementById('gacha-altar-content');
    if (altarContent && altarContent.classList) altarContent.classList.add('gacha-skip-anim');
}

function renderGachaScreen() {
    ensureGachaCeremonyDom();

    var sd = getSaveData();
    var multiCost = getMultiRollCost(sd);

    // Update rates display
    var rates = document.getElementById('gacha-rates');
    rates.textContent = 'Current rates (Lv.' + sd.player.level + '): ' + formatTierWeights(sd.player.level);

    // Update button states
    document.getElementById('btn-roll-1').disabled = sd.player.veilEssence < ROLL_COST;
    var btn10 = document.getElementById('btn-roll-10');
    btn10.disabled = sd.player.veilEssence < multiCost;

    // Show discounted cost on multi-roll button
    if (multiCost < MULTI_ROLL_COST) {
        btn10.textContent = 'Rite x10 (' + multiCost + ' VE, was ' + MULTI_ROLL_COST + ' VE)';
    } else {
        btn10.textContent = 'Rite x10 (' + MULTI_ROLL_COST + ' VE)';
    }

    renderGachaPityBar(sd);

    // Render shop below gacha rolls
    if (typeof renderShopUI === 'function') {
        renderShopUI();
    }
}

// Pity progress as a `.sv-bar` (Prompt 78) -- same getPityConfig()/
// rollsSincePity data the old text-only readout used, just presented as a
// filled bar with a threshold marker instead of a sentence.
function renderGachaPityBar(sd) {
    var wrap = document.getElementById('gacha-pity-info');
    if (!wrap) return;

    var pityConfig = getPityConfig(sd);
    if (!pityConfig) {
        wrap.innerHTML = '';
        wrap.style.display = 'none';
        return;
    }

    wrap.style.display = 'block';
    var rollsSince = sd.stats.rollsSincePity || 0;
    var pct = Math.max(0, Math.min(100, (rollsSince / pityConfig.threshold) * 100));
    var remaining = Math.max(0, pityConfig.threshold - rollsSince);
    var nearPity = pct >= 80;

    wrap.innerHTML =
        '<div class="gacha-pity-label">Pity: guaranteed cost ' + pityConfig.minTier + '+ in ' + remaining + ' roll' + (remaining === 1 ? '' : 's') + '</div>' +
        '<div class="sv-bar sv-bar-gold gacha-pity-bar' + (nearPity ? ' is-near' : '') + '">' +
            '<div class="sv-bar-fill" style="width:' + pct + '%"></div>' +
            '<div class="gacha-pity-marker"></div>' +
        '</div>';
}

function uiDoSingleRoll() {
    var sd = getSaveData();
    var result = doSingleRoll(sd);
    if (!result.success) return;

    renderGachaScreen();
    renderTopBar();
    if (typeof onboardingOnGachaRoll === 'function') onboardingOnGachaRoll(); // Prompt 82

    runGachaSingleCeremony(result);
}

function uiDoMultiRoll() {
    var sd = getSaveData();
    var result = doMultiRoll(sd);
    if (!result.success) return;

    renderGachaScreen();
    renderTopBar();
    if (typeof onboardingOnGachaRoll === 'function') onboardingOnGachaRoll(); // Prompt 82

    runGachaMultiCeremony(result.results);
}

// ---- Single-roll ceremony (Prompt 78) ----
// Circle charge-up (~600ms) -> tier-colored burst + card flip reveal. The
// 600ms lives entirely in the card's inline transition-delay (CSS handles
// the wait), so this function is fully synchronous: by the time it
// returns, the revealed card element already exists in #gacha-roll-results
// with the correct unit data -- only its on-screen appearance is still
// mid-transition in a real browser.
function runGachaSingleCeremony(result) {
    // Prompt 81 (Phase 7): charge riser now, card-flip tick + tier-scaled
    // reveal sting timed to the card's own 0.6s CSS transition-delay below
    // (setTimeout is a real no-op in tests/harness.js -- never fires
    // headlessly, so this is inert in tests, matching the ceremony's own
    // "no JS timers in the reveal path" contract for anything that actually
    // gates visuals).
    if (typeof SFX !== 'undefined' && SFX.play) {
        SFX.play('rollCharge', {});
        var revealTier = (result.unitTemplate && (result.unitTemplate.cost || result.unitTemplate.baseCost)) || 1;
        setTimeout(function() {
            SFX.play('cardFlip', {});
            SFX.play('rollReveal', { tier: revealTier });
        }, 600);
    }

    var altarContent = document.getElementById('gacha-altar-content');
    if (altarContent && altarContent.classList) altarContent.classList.remove('gacha-skip-anim');

    var container = document.getElementById('gacha-roll-results');
    container.style.display = 'flex';
    container.innerHTML = '';

    var header = document.createElement('div');
    header.className = 'gacha-roll-header';
    header.textContent = 'Summoned 1 unit';
    container.appendChild(header);

    var slot = document.createElement('div');
    slot.className = 'gacha-card-slot gacha-single-slot';
    container.appendChild(slot);

    var unitCost = (result.unitTemplate && (result.unitTemplate.cost || result.unitTemplate.baseCost)) || 1;
    var burst = document.createElement('div');
    burst.className = 'gacha-burst gacha-burst-tier-' + unitCost;
    burst.style.transitionDelay = '0.6s';
    slot.appendChild(burst);

    var card = createGachaCard(result.unitKey, result.unitTemplate);
    card.classList.add('gacha-flip-card', 'is-facedown');
    card.style.transitionDelay = '0.6s';
    slot.appendChild(card);

    // Restart the circle's charge keyframe (remove/reflow/re-add, same
    // trick js/hub.js's showScreen() uses to re-trigger .sv-screen-enter).
    var circle = document.getElementById('gacha-summon-circle');
    if (circle && circle.classList) {
        circle.classList.remove('is-charging');
        if (typeof circle.offsetWidth !== 'undefined') { void circle.offsetWidth; }
        circle.classList.add('is-charging');
    }

    // Force one reflow so the browser actually paints the face-down/inert
    // burst state before the classes below flip -- without this the two
    // mutations can coalesce into a single style recalc and the transition
    // never visibly starts.
    if (typeof slot.offsetWidth !== 'undefined') { void slot.offsetWidth; }

    card.classList.remove('is-facedown');
    burst.classList.add('is-active');
}

// ---- Multi-roll ceremony (Prompt 78) ----
// Cards fly out face-down in the 2x5 grid, flip in sequence via a 120ms
// per-card transition-delay (same inline-style stagger idea the original
// file already used for animationDelay), tier bursts as above, then a
// new/dupes/highest-tier summary row.
function runGachaMultiCeremony(results) {
    // Prompt 81 (Phase 7): one charge riser for the whole multi-summon, then
    // a card-flip tick + tier-scaled reveal sting staggered per card at the
    // same 120ms-per-card delay the CSS transition-delay stagger below uses.
    if (typeof SFX !== 'undefined' && SFX.play) {
        SFX.play('rollCharge', {});
        for (var ci = 0; ci < results.length; ci++) {
            (function(r, delayMs) {
                var revealTier = (r.unitTemplate && (r.unitTemplate.cost || r.unitTemplate.baseCost)) || 1;
                setTimeout(function() {
                    SFX.play('cardFlip', {});
                    SFX.play('rollReveal', { tier: revealTier });
                }, delayMs);
            })(results[ci], ci * 120);
        }
    }

    var altarContent = document.getElementById('gacha-altar-content');
    if (altarContent && altarContent.classList) altarContent.classList.remove('gacha-skip-anim');

    var container = document.getElementById('gacha-roll-results');
    container.style.display = 'flex';
    container.innerHTML = '';

    var header = document.createElement('div');
    header.className = 'gacha-roll-header';
    header.textContent = 'Summoned ' + results.length + ' units!';
    container.appendChild(header);

    var grid = document.createElement('div');
    grid.className = 'gacha-multi-grid';
    container.appendChild(grid);

    var cardEls = [];
    var burstEls = [];
    for (var i = 0; i < results.length; i++) {
        var r = results[i];
        var slot = document.createElement('div');
        slot.className = 'gacha-card-slot';

        var unitCost = (r.unitTemplate && (r.unitTemplate.cost || r.unitTemplate.baseCost)) || 1;
        var delay = (i * 0.12) + 's';

        var burst = document.createElement('div');
        burst.className = 'gacha-burst gacha-burst-tier-' + unitCost;
        burst.style.transitionDelay = delay;
        slot.appendChild(burst);

        var card = createGachaCard(r.unitKey, r.unitTemplate);
        card.classList.add('gacha-flip-card', 'is-facedown');
        card.style.transitionDelay = delay;
        slot.appendChild(card);

        grid.appendChild(slot);
        cardEls.push(card);
        burstEls.push(burst);
    }

    if (typeof grid.offsetWidth !== 'undefined') { void grid.offsetWidth; }

    for (var j = 0; j < cardEls.length; j++) {
        cardEls[j].classList.remove('is-facedown');
        burstEls[j].classList.add('is-active');
    }

    appendGachaMultiSummary(container, results);
}

// new/dupes/highest-tier summary row, mirroring the exact isNew check
// createGachaCard() uses (collection state is already fully updated by the
// time doMultiRoll() returns, so this reads it fresh -- no new state).
function computeGachaMultiSummary(results) {
    var sd = getSaveData();
    var newCount = 0, dupeCount = 0, highestTier = 0, highestUnitName = '';
    for (var i = 0; i < results.length; i++) {
        var r = results[i];
        var entry = sd.collection[r.unitKey];
        var isNew = entry && entry.copiesForNext === 0 && entry.stars === 1;
        if (isNew) newCount++; else dupeCount++;

        var tmpl = r.unitTemplate;
        var cost = (tmpl && (tmpl.cost || tmpl.baseCost)) || 1;
        if (cost > highestTier) { highestTier = cost; highestUnitName = tmpl ? tmpl.name : ''; }
    }
    return { newCount: newCount, dupeCount: dupeCount, highestTier: highestTier, highestUnitName: highestUnitName };
}

function appendGachaMultiSummary(container, results) {
    var summary = computeGachaMultiSummary(results);
    var stars = '';
    for (var s = 0; s < summary.highestTier; s++) stars += '★';

    var row = document.createElement('div');
    row.className = 'gacha-multi-summary';
    row.id = 'gacha-multi-summary';
    row.innerHTML =
        '<span class="gacha-summary-chip gacha-summary-new">' + summary.newCount + ' new</span>' +
        '<span class="gacha-summary-chip gacha-summary-dupe">' + summary.dupeCount + ' dupe' + (summary.dupeCount === 1 ? '' : 's') + '</span>' +
        '<span class="gacha-summary-chip gacha-summary-highest">Best: ' + stars + ' ' + summary.highestUnitName + '</span>';
    container.appendChild(row);
}

function createGachaCard(unitKey, tmpl) {
    var sd = getSaveData();
    var entry = sd.collection[unitKey];
    var isNew = entry && entry.copiesForNext === 0 && entry.stars === 1;
    var isEvolved = !!EVOLVED_TEMPLATES[unitKey];
    var unitCost = tmpl.cost || tmpl.baseCost || 1;

    var tierStars = '';
    for (var s = 0; s < unitCost; s++) tierStars += '★';

    var div = document.createElement('div');
    div.className = 'gacha-card cost-' + unitCost;
    if (isEvolved) {
        div.style.border = '2px solid #e2b714';
        div.style.boxShadow = '0 0 10px rgba(226,183,20,0.3)';
    }
    div.innerHTML =
        (isNew ? '<div class="card-new-badge">NEW</div>' : '') +
        (isEvolved ? '<div class="card-evolved-badge">✨ EVO</div>' : '') +
        '<div class="card-element-icon">' + getElementEmoji(tmpl.element) + '</div>' +
        '<div class="card-unit-name">' + tmpl.name + '</div>' +
        '<div class="card-tier-stars">' + tierStars + '</div>' +
        '<div class="card-archetype">' + ARCHETYPES[tmpl.archetype].emoji + ' ' + ARCHETYPES[tmpl.archetype].name + '</div>';
    return div;
}

// ---- Shop Display (Prompt 20 Phase A4) ----

function renderShopUI() {
    var sd = getSaveData();
    var container = document.getElementById('gacha-shop');
    if (!container) return;

    // Initialize shop if empty
    if (!currentShopUnits || currentShopUnits.length === 0) {
        refreshShopUnits(sd.player.level);
    }

    container.innerHTML = '';

    var shopHeader = document.createElement('div');
    shopHeader.style.cssText = 'width:100%; display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; padding-bottom:6px; border-bottom:1px solid #2a3a5e;';
    shopHeader.innerHTML =
        '<span style="color:#aaa; font-size:13px; font-weight:bold;">Shop</span>' +
        '<button id="shop-refresh-btn" style="padding:4px 12px; border-radius:6px; border:1px solid #444; background:#222; color:#ccc; cursor:pointer; font-size:11px; transition:background 0.15s;">🔄 Refresh (' + SHOP_REFRESH_COST + ' VE)</button>';
    container.appendChild(shopHeader);

    for (var i = 0; i < 5; i++) {
        var unitKey = currentShopUnits[i];

        if (!unitKey) {
            var soldCard = document.createElement('div');
            soldCard.className = 'gacha-card';
            soldCard.style.cssText += 'opacity:0.3; border-style:dashed;';
            soldCard.innerHTML = '<div style="color:#555; font-size:12px; padding:20px 0;">Sold</div>';
            container.appendChild(soldCard);
            continue;
        }

        var tmpl = UNIT_TEMPLATES[unitKey];
        if (!tmpl) continue;

        var goldCost = UNIT_COSTS[tmpl.cost] || 30;
        var tierStars = '';
        for (var ts = 0; ts < tmpl.cost; ts++) tierStars += '★';
        var canAfford = sd.player.veilEssence >= goldCost;

        var card = document.createElement('div');
        card.className = 'gacha-card cost-' + tmpl.cost;
        card.style.cursor = canAfford ? 'pointer' : 'default';
        card.innerHTML =
            '<div class="card-element-icon">' + getElementEmoji(tmpl.element) + '</div>' +
            '<div class="card-unit-name">' + tmpl.name + '</div>' +
            '<div class="card-tier-stars">' + tierStars + '</div>' +
            '<div class="card-archetype">' + ARCHETYPES[tmpl.archetype].emoji + ' ' + ARCHETYPES[tmpl.archetype].name + '</div>' +
            '<button class="shop-buy-btn" data-slot="' + i + '" data-key="' + unitKey + '" data-cost="' + goldCost + '" style="margin-top:6px; padding:3px 12px; border-radius:6px; border:none; background:' + (canAfford ? '#2e7d32' : '#333') + '; color:' + (canAfford ? '#fff' : '#666') + '; cursor:' + (canAfford ? 'pointer' : 'default') + '; font-size:11px; font-weight:bold; transition:background 0.15s;"' + (canAfford ? '' : ' disabled') + '>' +
            'Buy ' + goldCost + ' VE</button>';

        container.appendChild(card);
    }

    // Bind buy buttons
    var buyBtns = container.querySelectorAll('.shop-buy-btn');
    for (var b = 0; b < buyBtns.length; b++) {
        buyBtns[b].addEventListener('click', function(e) {
            e.stopPropagation();
            var slot = parseInt(this.getAttribute('data-slot'));
            var key = this.getAttribute('data-key');
            var result = buyUnit(sd, key, slot);
            if (result.success) {
                renderShopUI();
                renderTopBar();
            }
        });
    }

    // Bind refresh button
    var refreshBtn = document.getElementById('shop-refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            var result = refreshShop(sd);
            if (result.success) {
                renderShopUI();
                renderTopBar();
            }
        });
    }
}

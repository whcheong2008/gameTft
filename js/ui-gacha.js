// ui-gacha.js -- summon screen + shop display (split from ui-v2.js)

// ---- Gacha Screen ----

function renderGachaScreen() {
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

    // Show pity counter
    var pityEl = document.getElementById('gacha-pity-info');
    if (!pityEl) {
        pityEl = document.createElement('div');
        pityEl.id = 'gacha-pity-info';
        pityEl.style.cssText = 'font-size:12px; color:#aaa; margin-top:6px;';
        var ratesParent = rates.parentNode;
        ratesParent.insertBefore(pityEl, rates.nextSibling);
    }
    var pityConfig = getPityConfig(sd);
    if (pityConfig) {
        var rollsSince = sd.stats.rollsSincePity || 0;
        var remaining = pityConfig.threshold - rollsSince;
        pityEl.textContent = 'Pity: guaranteed cost ' + pityConfig.minTier + '+ in ' + remaining + ' rolls';
        pityEl.style.display = 'block';
    } else {
        pityEl.style.display = 'none';
    }

    // Render shop below gacha rolls
    if (typeof renderShopUI === 'function') {
        renderShopUI();
    }
}

function uiDoSingleRoll() {
    var sd = getSaveData();
    var result = doSingleRoll(sd);
    if (!result.success) return;

    var container = document.getElementById('gacha-roll-results');
    container.style.display = 'flex';
    container.innerHTML = '<div class="gacha-roll-header">Summoned 1 unit</div>';
    container.appendChild(createGachaCard(result.unitKey, result.unitTemplate));

    renderGachaScreen();
    renderTopBar();
}

function uiDoMultiRoll() {
    var sd = getSaveData();
    var result = doMultiRoll(sd);
    if (!result.success) return;

    var container = document.getElementById('gacha-roll-results');
    container.style.display = 'flex';
    container.innerHTML = '<div class="gacha-roll-header">Summoned 10 units!</div>';
    for (var i = 0; i < result.results.length; i++) {
        var r = result.results[i];
        var card = createGachaCard(r.unitKey, r.unitTemplate);
        card.style.animationDelay = (i * 0.08) + 's';
        container.appendChild(card);
    }

    renderGachaScreen();
    renderTopBar();
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


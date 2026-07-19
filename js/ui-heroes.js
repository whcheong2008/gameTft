// ui-heroes.js -- hero management screens (split from ui-v2.js)
// Prompt 79 (Phase 6.4): restyled onto the design system (game-v2.html's
// "P79 COLLECTION" CSS block) -- structure/logic unchanged, presentation only.

// ---- P79 helper: hero portrait placeholder ----
// Heroes have no element, so this is a flat gold-tinted gradient rather than
// the elemental one units get -- id="hero-portrait-<heroKey>" is the stable
// hook for Phase 5 art, same convention as js/ui-roster.js's unit portraits.
function p79HeroPortraitHtml(heroKey, sizeClass) {
    return '<div id="hero-portrait-' + heroKey + '" class="p79-portrait' + (sizeClass ? ' ' + sizeClass : '') +
        '" style="background:radial-gradient(circle at 32% 26%, rgba(226,183,20,0.35), var(--sv-bg-0) 78%);">👑</div>';
}

// ---- Hero Management Screen (Philosophy-Based) ----

var selectedHeroKey = null;

function renderHeroScreen() {
    var sd = getSaveData();
    var container = document.getElementById('hero-screen-content');
    if (!container) return;
    container.innerHTML = '';

    // Hero list with status
    var heroList = document.createElement('div');
    heroList.style.cssText = 'display:flex; flex-direction:column; gap:8px; margin-bottom:12px;';

    for (var hKey in sd.heroes.data) {
        var heroState = sd.heroes.data[hKey];
        var heroData = HERO_DATA[hKey];
        if (!heroData) continue;

        // Skip unlocked=false heroes (not yet acquired)
        if (heroState._unlocked === false) continue;
        // Skip away heroes
        if (heroState._away) continue;

        var heroCard = document.createElement('div');
        heroCard.className = 'p79-hero-card' + (selectedHeroKey === hKey ? ' selected' : '');
        heroCard.onclick = (function(hk) {
            return function() { showHeroSkillTree(hk); };
        })(hKey);

        heroCard.innerHTML = p79HeroPortraitHtml(hKey);

        var body = document.createElement('div');
        body.className = 'p79-hero-card-body';

        var title = document.createElement('div');
        title.className = 'p79-card-name';
        title.style.fontSize = '14px';
        title.textContent = heroData.name + ' (Lv ' + heroState.level + ')';

        var philo = document.createElement('div');
        philo.className = 'text-gold';
        philo.style.cssText = 'font-size:11px; margin-bottom:2px;';
        philo.textContent = heroData.philosophy;

        var quote = document.createElement('div');
        quote.className = 'text-muted';
        quote.style.cssText = 'font-size:12px; font-style:italic; margin-bottom:4px;';
        quote.textContent = '"' + heroData.quote + '"';

        var desc = document.createElement('div');
        desc.className = 'text-muted';
        desc.style.cssText = 'font-size:10px; margin-bottom:4px;';
        desc.textContent = heroData.description;

        // XP bar
        var xpBarDiv = document.createElement('div');
        if (heroState.level < HERO_LEVEL_CAP && !heroState.isDead) {
            var xpNeeded = getHeroXPToNext(heroState.level);
            var xpPct = xpNeeded > 0 ? Math.floor((heroState.xp / xpNeeded) * 100) : 100;
            xpBarDiv.innerHTML = '<div class="sv-bar sv-bar-xp" style="margin-top:4px;"><div class="sv-bar-fill" style="width:' + xpPct + '%;"></div></div>' +
                '<div class="text-muted" style="font-size:9px;">' + heroState.xp + '/' + xpNeeded + ' XP</div>';
        } else if (heroState.isDead) {
            xpBarDiv.innerHTML = '<div class="text-red" style="font-size:9px;">FALLEN</div>';
        } else {
            xpBarDiv.innerHTML = '<div class="text-gold" style="font-size:9px;">MAX LEVEL</div>';
        }

        var status = document.createElement('div');
        status.style.cssText = 'font-size:11px; margin-top:4px;';
        if (heroState.isDead) {
            status.textContent = 'Lost in R4';
            status.className = 'text-red';
        } else if (heroState.assignedUnit) {
            status.textContent = 'Assigned to ' + getUnitDisplayName(heroState.assignedUnit);
            status.className = 'text-green';
        } else {
            status.textContent = 'Not assigned';
            status.className = 'text-muted';
        }

        // Equipment summary on hero card
        var equipDiv = document.createElement('div');
        equipDiv.style.cssText = 'font-size:10px; color:var(--sv-blue); margin-top:4px;';
        if (heroState.assignedUnit && !heroState.isDead) {
            var eqItems = getEquippedItems(sd, heroState.assignedUnit);
            if (eqItems.length > 0) {
                var eqParts = [];
                for (var eq = 0; eq < eqItems.length; eq++) {
                    eqParts.push(getItemEmoji(eqItems[eq]) + getItemName(eqItems[eq]));
                }
                equipDiv.innerHTML = '⚔ ' + eqParts.join(' · ');
            } else {
                equipDiv.innerHTML = '<span class="text-muted">No equipment</span>';
            }
        }

        body.appendChild(title);
        body.appendChild(philo);
        body.appendChild(quote);
        body.appendChild(desc);
        body.appendChild(xpBarDiv);
        body.appendChild(status);
        body.appendChild(equipDiv);
        heroCard.appendChild(body);
        heroList.appendChild(heroCard);
    }

    container.appendChild(heroList);

    // === EQUIPMENT OVERVIEW PANEL ===
    var eqOverview = document.createElement('div');
    eqOverview.className = 'sv-panel';
    eqOverview.style.cssText = 'margin-top:16px; padding:12px;';
    eqOverview.innerHTML = '<div style="font-weight:bold; color:var(--sv-gold); margin-bottom:8px; font-size:14px;">⚔ Equipment Overview</div>';

    var roster = getRoster(sd);
    var anyEquipment = false;

    for (var ri = 0; ri < roster.length; ri++) {
        var rUnit = roster[ri];
        var unitHeroKey = typeof getHeroKeyForUnit === 'function' ? getHeroKeyForUnit(sd, rUnit.key) : null;
        var unitItems = getEquippedItems(sd, rUnit.key);

        if (!unitHeroKey && unitItems.length === 0) continue;

        anyEquipment = true;
        var unitTmpl = rUnit.template;
        var heroLabel = unitHeroKey ? (' — ' + HERO_DATA[unitHeroKey].name) : ' — No Hero';
        var canEquip = !!unitHeroKey;

        var unitRow = document.createElement('div');
        unitRow.style.cssText = 'margin-bottom:8px; padding:6px; border-bottom:1px solid var(--sv-border);';

        var unitHeader = '<div style="font-size:12px; font-weight:bold; color:' + (canEquip ? 'var(--sv-text-2)' : 'var(--sv-text-3)') + ';">' +
            ELEMENTS[unitTmpl.element].emoji + ' ' + unitTmpl.name + ' ' + rUnit.stars + '★' +
            '<span class="text-gold" style="font-weight:normal;">' + heroLabel + '</span></div>';

        var slotNames = ['weapon', 'helm', 'chest', 'gauntlets', 'boots', 'offhand', 'accessory1', 'accessory2'];
        var slotLabels = { weapon: '⚔Wpn', helm: '\u{1F3A9}Hlm', chest: '\u{1F6E1}Chest', gauntlets: '\u{1F94A}Glt', boots: '\u{1F462}Bts', offhand: '\u{1F52E}Off', accessory1: '\u{1F48D}Acc1', accessory2: '\u{1F4FF}Acc2' };
        var slotsHtml = '<div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:4px;">';

        for (var si = 0; si < slotNames.length; si++) {
            var slotItem = getEquipmentInSlot(sd, rUnit.key, slotNames[si]);
            if (slotItem) {
                var rc = getItemRarityColor(slotItem);
                slotsHtml += '<div class="sv-chip" style="border-color:' + rc + ';">' +
                    '<span style="color:' + rc + ';">' + getItemEmoji(slotItem) + '</span> ' +
                    '<span style="color:var(--sv-text-2);">' + getItemName(slotItem) + '</span>' +
                    (slotItem.enhancement > 0 ? '<span class="text-green">+' + slotItem.enhancement + '</span>' : '') +
                    '</div>';
            } else if (canEquip) {
                slotsHtml += '<div class="sv-chip text-muted">' +
                    (slotLabels[slotNames[si]] || slotNames[si]) + ' —</div>';
            }
        }
        slotsHtml += '</div>';

        // Equip/unequip buttons for unequipped items
        var unequippedItems = sd.equipment && sd.equipment.inventory ? sd.equipment.inventory.filter(function(it) { return !it.equipped; }) : [];
        var equipBtnHtml = '';
        if (canEquip && unequippedItems.length > 0) {
            equipBtnHtml = '<button class="sv-btn hero-equip-btn" data-unit="' + rUnit.key + '" style="margin-top:4px; font-size:10px; padding:2px 8px;">Equip Item</button>';
        }

        unitRow.innerHTML = unitHeader + slotsHtml + equipBtnHtml;
        eqOverview.appendChild(unitRow);
    }

    if (!anyEquipment) {
        eqOverview.innerHTML += '<div class="text-muted" style="font-size:12px;">No hero-equipped units yet. Assign heroes to units to enable equipment.</div>';
    }

    container.appendChild(eqOverview);

    // Wire up equip buttons
    var equipBtns = container.querySelectorAll('.hero-equip-btn');
    for (var eb = 0; eb < equipBtns.length; eb++) {
        equipBtns[eb].addEventListener('click', (function(unitKey) {
            return function(e) {
                e.stopPropagation();
                showQuickEquipPanel(unitKey);
            };
        })(equipBtns[eb].getAttribute('data-unit')));
    }
}

function showQuickEquipPanel(unitKey) {
    var sd = getSaveData();
    var unitTmpl = UNIT_TEMPLATES[unitKey] || EVOLVED_TEMPLATES[unitKey];
    var unitName = unitTmpl ? unitTmpl.name : unitKey;

    var overlay = document.createElement('div');
    overlay.className = 'sv-modal-backdrop';
    overlay.style.display = 'flex';

    var panel = document.createElement('div');
    panel.className = 'sv-modal-panel p79-modal-md';

    panel.innerHTML = '<div style="font-weight:bold; color:var(--sv-gold); margin-bottom:12px; font-size:14px;">⚔ Equip Item on ' + unitName + '</div>';

    // Show currently equipped
    var equipped = getEquippedItems(sd, unitKey);
    if (equipped.length > 0) {
        panel.innerHTML += '<div class="text-muted" style="font-size:11px; margin-bottom:8px;">Currently Equipped:</div>';
        for (var ce = 0; ce < equipped.length; ce++) {
            var ceq = equipped[ce];
            var rc = getItemRarityColor(ceq);
            panel.innerHTML += '<div style="padding:4px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--sv-border);">' +
                '<span style="font-size:11px; color:' + rc + ';">' + getItemEmoji(ceq) + ' ' + getItemName(ceq) + ' [' + ceq.slot + ']</span>' +
                '<button class="sv-btn p79-btn-danger qe-unequip" data-item-id="' + ceq.id + '" style="font-size:10px; padding:1px 6px;">Unequip</button>' +
                '</div>';
        }
    }

    // Show available items
    var available = sd.equipment && sd.equipment.inventory ? sd.equipment.inventory.filter(function(it) { return !it.equipped; }) : [];
    if (available.length > 0) {
        panel.innerHTML += '<div class="text-muted" style="font-size:11px; margin-top:8px; margin-bottom:4px;">Available (' + available.length + '):</div>';
        for (var ai = 0; ai < available.length; ai++) {
            var avItem = available[ai];
            var arc = getItemRarityColor(avItem);
            var statDesc = typeof getItemStatDescription === 'function' ? getItemStatDescription(avItem) : '';
            panel.innerHTML += '<div class="qe-equip-item" data-item-id="' + avItem.id + '" style="padding:4px 6px; cursor:pointer; border-bottom:1px solid var(--sv-border); font-size:11px;">' +
                '<span style="color:' + arc + ';">' + getItemEmoji(avItem) + ' ' + getItemName(avItem) + '</span>' +
                ' <span class="text-muted">[' + avItem.slot + '] T' + (avItem.tier || '?') + '</span>' +
                (statDesc ? '<div class="text-muted" style="font-size:9px; margin-top:1px;">' + statDesc + '</div>' : '') +
                '</div>';
        }
    } else {
        panel.innerHTML += '<div class="text-muted" style="font-size:11px; margin-top:8px;">No unequipped items available.</div>';
    }

    var closeBtn = document.createElement('button');
    closeBtn.className = 'sv-btn';
    closeBtn.style.cssText = 'margin-top:12px; padding:8px 16px; font-size:12px;';
    closeBtn.textContent = 'Done';
    closeBtn.onclick = function() { overlay.remove(); renderHeroScreen(); };
    panel.appendChild(closeBtn);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // Wire equip clicks
    var equipItems = panel.querySelectorAll('.qe-equip-item');
    for (var ei = 0; ei < equipItems.length; ei++) {
        equipItems[ei].addEventListener('click', (function(itemId, uk, ov) {
            return function() {
                var sdd = getSaveData();
                var result = equipItem(sdd, itemId, uk);
                if (result.success) {
                    showToast('Equipped!');
                } else {
                    showToast(result.reason);
                }
                ov.remove();
                showQuickEquipPanel(uk);
            };
        })(equipItems[ei].getAttribute('data-item-id'), unitKey, overlay));
    }

    // Wire unequip clicks
    var unequipBtns = panel.querySelectorAll('.qe-unequip');
    for (var ui = 0; ui < unequipBtns.length; ui++) {
        unequipBtns[ui].addEventListener('click', (function(itemId, uk, ov) {
            return function() {
                var sdd = getSaveData();
                unequipItem(sdd, itemId);
                showToast('Unequipped!');
                ov.remove();
                showQuickEquipPanel(uk);
            };
        })(unequipBtns[ui].getAttribute('data-item-id'), unitKey, overlay));
    }
}

function getUnitDisplayName(unitKey) {
    var tmpl = UNIT_TEMPLATES[unitKey] || EVOLVED_TEMPLATES[unitKey];
    return tmpl ? tmpl.name : unitKey;
}

function showHeroSkillTree(heroKey) {
    var sd = getSaveData();
    var heroState = sd.heroes.data[heroKey];
    var heroData = HERO_DATA[heroKey];
    var tree = HERO_SKILL_TREES[heroKey];
    if (!heroState || !heroData || !tree) return;

    var overlay = document.createElement('div');
    overlay.className = 'sv-modal-backdrop';
    overlay.style.display = 'flex';

    var panel = document.createElement('div');
    panel.className = 'sv-modal-panel p79-modal-lg';

    // Header
    var pointsSpent = getHeroPointsSpent(heroState);
    var header = document.createElement('div');
    header.style.cssText = 'text-align:center; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid var(--sv-border);';
    header.innerHTML = p79HeroPortraitHtml(heroKey, 'p79-portrait-sm') +
        '<div style="font-size:20px; font-weight:bold; color:var(--sv-text-1); margin-top:6px;">' + heroData.name + '</div>' +
        '<div class="text-gold" style="font-size:12px;">' + heroData.philosophy + '</div>' +
        '<div class="text-muted" style="font-size:13px;">Lv ' + heroState.level + ' / 20</div>' +
        '<div class="text-gold" style="font-size:12px; margin-top:4px;">Points Available: ' + (20 - pointsSpent) + ' / 20</div>';

    // Assigned unit
    if (heroState.assignedUnit) {
        header.innerHTML += '<div class="text-green" style="font-size:11px; margin-top:4px;">Assigned to: ' + getUnitDisplayName(heroState.assignedUnit) + '</div>';
    }
    if (heroState.isDead) {
        header.innerHTML += '<div class="text-red" style="font-size:12px; margin-top:4px; font-weight:bold;">FALLEN - Skills preserved</div>';
    }
    panel.appendChild(header);

    // Two branches side by side -- rendered as .p79-skill-branch columns,
    // each tier a .p79-skill-tier with a connector line, each node a
    // .p79-skill-node "pip" whose ::before dot carries the
    // learned/available/locked state color (see the P79 COLLECTION CSS
    // block). Click wiring (investPoint) is unchanged.
    var branchesContainer = document.createElement('div');
    branchesContainer.style.cssText = 'display:flex; gap:12px; margin-bottom:16px;';

    var branchKeys = ['A', 'B'];
    for (var bi = 0; bi < branchKeys.length; bi++) {
        var branch = branchKeys[bi];
        var branchData = heroData.branches[branch];
        if (!branchData || !tree[branch]) continue;

        var branchPanel = document.createElement('div');
        branchPanel.className = 'p79-skill-branch';

        var branchTitle = document.createElement('div');
        branchTitle.style.cssText = 'font-weight:bold; font-size:12px; color:var(--sv-gold); margin-bottom:4px; text-align:center;';
        branchTitle.textContent = branch + ': ' + branchData.name;
        branchPanel.appendChild(branchTitle);

        var branchDesc = document.createElement('div');
        branchDesc.className = 'text-muted';
        branchDesc.style.cssText = 'font-size:9px; margin-bottom:8px; text-align:center;';
        branchDesc.textContent = branchData.description;
        branchPanel.appendChild(branchDesc);

        // Tiers 1-5
        for (var tier = 1; tier <= 5; tier++) {
            var tierNodes = tree[branch][tier];
            if (!tierNodes) continue;

            var tierDiv = document.createElement('div');
            tierDiv.className = 'p79-skill-tier';

            var tierLabel = document.createElement('div');
            tierLabel.className = 'text-muted';
            tierLabel.style.cssText = 'font-size:10px; margin-bottom:4px; font-weight:bold;';
            tierLabel.textContent = 'T' + tier + ' (Cost: ' + getHeroSkillCost(tier) + ', Req: L' + getHeroTierLevelReq(tier) + ')';
            tierDiv.appendChild(tierLabel);

            for (var ci = 0; ci < tierNodes.length; ci++) {
                var node = tierNodes[ci];
                var nodeDiv = document.createElement('div');

                var isInvested = heroState.investedNodes && heroState.investedNodes.indexOf(node.id) >= 0;
                var canInvest = !heroState.isDead && canUnlockNode(sd, heroKey, node.id);
                var levelLocked = heroState.level < node.levelReq;

                if (isInvested) {
                    nodeDiv.className = 'p79-skill-node is-learned';
                    nodeDiv.innerHTML = '<div style="color:var(--sv-green); font-weight:bold;">' + node.name + '</div><div style="font-size:9px; color:#8bc78b; margin-top:2px;">' + node.effect + '</div>';
                } else if (levelLocked) {
                    nodeDiv.className = 'p79-skill-node is-locked';
                    nodeDiv.textContent = '? (Requires Lv ' + node.levelReq + ')';
                } else if (canInvest) {
                    nodeDiv.className = 'p79-skill-node is-available';
                    nodeDiv.innerHTML = '<div style="color:var(--sv-blue);">' + node.name + '</div><div class="text-muted" style="font-size:9px; margin-top:2px;">' + node.effect + '</div>';
                    nodeDiv.onclick = (function(hk, nId, ov) {
                        return function() {
                            var sdd = getSaveData();
                            if (investPoint(sdd, hk, nId)) {
                                ov.remove();
                                showHeroSkillTree(hk);
                            }
                        };
                    })(heroKey, node.id, overlay);
                } else {
                    nodeDiv.className = 'p79-skill-node is-locked';
                    nodeDiv.innerHTML = '<div>' + node.name + '</div><div style="font-size:9px; color:#555; margin-top:2px;">' + node.effect + '</div>';
                }

                tierDiv.appendChild(nodeDiv);
            }

            branchPanel.appendChild(tierDiv);
        }

        branchesContainer.appendChild(branchPanel);
    }
    panel.appendChild(branchesContainer);

    // Buttons: Assign, Respec, Close
    var buttonDiv = document.createElement('div');
    buttonDiv.style.cssText = 'display:flex; gap:8px; justify-content:center; margin-top:12px; flex-wrap:wrap;';

    if (!heroState.isDead) {
        // Assign button
        var assignBtn = document.createElement('button');
        assignBtn.className = 'sv-btn sv-btn-primary';
        assignBtn.style.cssText = 'padding:8px 16px; font-size:12px;';
        assignBtn.textContent = heroState.assignedUnit ? 'Reassign' : 'Assign to Unit';
        assignBtn.onclick = (function(hk, ov) {
            return function() { ov.remove(); showHeroAssignPanel(hk); };
        })(heroKey, overlay);
        buttonDiv.appendChild(assignBtn);

        if (heroState.assignedUnit) {
            var unassignBtn = document.createElement('button');
            unassignBtn.className = 'sv-btn';
            unassignBtn.style.cssText = 'padding:8px 16px; font-size:12px;';
            unassignBtn.textContent = 'Unassign';
            unassignBtn.onclick = (function(hk, ov) {
                return function() { heroUnassign(hk); ov.remove(); renderHeroScreen(); };
            })(heroKey, overlay);
            buttonDiv.appendChild(unassignBtn);
        }
    }

    // Respec
    if (heroState.investedNodes && heroState.investedNodes.length > 0 && !heroState.isDead) {
        var respecCost = getRespecCost(heroState);
        var respecBtn = document.createElement('button');
        respecBtn.className = 'sv-btn';
        respecBtn.style.cssText = 'padding:8px 16px; font-size:12px;';
        respecBtn.textContent = 'Respec (' + respecCost + ' VE)';
        respecBtn.onclick = (function(hk, ov) {
            return function() {
                var sdd = getSaveData();
                if (respecHero(sdd, hk)) {
                    showToast('Hero reset!');
                    ov.remove();
                    showHeroSkillTree(hk);
                } else {
                    showToast('Not enough VE for respec');
                }
            };
        })(heroKey, overlay);
        buttonDiv.appendChild(respecBtn);
    }

    var closeBtn = document.createElement('button');
    closeBtn.className = 'sv-btn';
    closeBtn.style.cssText = 'padding:8px 16px; font-size:12px;';
    closeBtn.textContent = 'Done';
    closeBtn.onclick = function() { overlay.remove(); renderHeroScreen(); };
    buttonDiv.appendChild(closeBtn);

    panel.appendChild(buttonDiv);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
}

function heroUnassign(heroKey) {
    var sd = getSaveData();
    unassignHero(sd, heroKey);
    autoSave(sd);
}

function showHeroAssignPanel(heroKey) {
    var sd = getSaveData();

    var overlay = document.createElement('div');
    overlay.className = 'sv-modal-backdrop';
    overlay.style.display = 'flex';

    var panel = document.createElement('div');
    panel.className = 'sv-modal-panel';
    panel.style.maxHeight = '70vh';
    panel.style.overflowY = 'auto';

    panel.innerHTML = '<div style="font-weight:bold; color:var(--sv-gold); margin-bottom:12px; font-size:14px;">Assign ' + HERO_DATA[heroKey].name + ' to Unit</div>';

    var roster = getRoster(sd);
    for (var i = 0; i < roster.length; i++) {
        var r = roster[i];
        var existingHero = getHeroKeyForUnit(sd, r.key);
        var assignedLabel = '';
        if (existingHero) {
            var existingDef = HERO_DATA[existingHero];
            assignedLabel = existingDef ? ' <span style="color:#ff8844;">(' + existingDef.name + ')</span>' : '';
        }
        var unitDiv = document.createElement('div');
        unitDiv.style.cssText = 'padding:6px; cursor:pointer; border-bottom:1px solid var(--sv-border); font-size:12px;';
        unitDiv.innerHTML = ELEMENTS[r.template.element].emoji + ' ' + r.template.name + ' ' + r.stars + '★' + assignedLabel;
        unitDiv.onclick = (function(hk, uk, ov) {
            return function() {
                var sdd = getSaveData();
                assignHeroToUnit(sdd, hk, uk);
                ov.remove();
                renderHeroScreen();
            };
        })(heroKey, r.key, overlay);
        panel.appendChild(unitDiv);
    }

    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'sv-btn';
    cancelBtn.style.cssText = 'margin-top:12px; padding:8px 16px; font-size:12px;';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = function() { overlay.remove(); renderHeroScreen(); };
    panel.appendChild(cancelBtn);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
}

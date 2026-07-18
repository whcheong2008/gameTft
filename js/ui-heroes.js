// ui-heroes.js -- hero management screens (split from ui-v2.js)

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
        heroCard.style.cssText = 'background:#16213e; border:1px solid ' + (selectedHeroKey === hKey ? '#e2b714' : '#2a3a5e') + '; border-radius:8px; padding:12px; cursor:pointer;';
        heroCard.onclick = (function(hk) {
            return function() { showHeroSkillTree(hk); };
        })(hKey);

        var title = document.createElement('div');
        title.style.cssText = 'font-weight:bold; font-size:14px; margin-bottom:4px;';
        title.textContent = heroData.name + ' (Lv ' + heroState.level + ')';

        var philo = document.createElement('div');
        philo.style.cssText = 'font-size:11px; color:#e2b714; margin-bottom:2px;';
        philo.textContent = heroData.philosophy;

        var quote = document.createElement('div');
        quote.style.cssText = 'font-size:12px; color:#aaa; font-style:italic; margin-bottom:4px;';
        quote.textContent = '"' + heroData.quote + '"';

        var desc = document.createElement('div');
        desc.style.cssText = 'font-size:10px; color:#777; margin-bottom:4px;';
        desc.textContent = heroData.description;

        // XP bar
        var xpBarDiv = document.createElement('div');
        if (heroState.level < HERO_LEVEL_CAP && !heroState.isDead) {
            var xpNeeded = getHeroXPToNext(heroState.level);
            var xpPct = xpNeeded > 0 ? Math.floor((heroState.xp / xpNeeded) * 100) : 100;
            xpBarDiv.innerHTML = '<div style="background:#333; height:4px; border-radius:2px; margin-top:4px;">' +
                '<div style="background:#e2b714; height:100%; width:' + xpPct + '%; border-radius:2px;"></div></div>' +
                '<div style="font-size:9px; color:#888;">' + heroState.xp + '/' + xpNeeded + ' XP</div>';
        } else if (heroState.isDead) {
            xpBarDiv.innerHTML = '<div style="font-size:9px; color:#ff6666;">FALLEN</div>';
        } else {
            xpBarDiv.innerHTML = '<div style="font-size:9px; color:#e2b714;">MAX LEVEL</div>';
        }

        var status = document.createElement('div');
        status.style.cssText = 'font-size:11px; color:#888; margin-top:4px;';
        if (heroState.isDead) {
            status.textContent = 'Lost in R4';
            status.style.color = '#ff6666';
        } else if (heroState.assignedUnit) {
            status.textContent = 'Assigned to ' + getUnitDisplayName(heroState.assignedUnit);
            status.style.color = '#6bcb77';
        } else {
            status.textContent = 'Not assigned';
        }

        // Equipment summary on hero card
        var equipDiv = document.createElement('div');
        equipDiv.style.cssText = 'font-size:10px; color:#8bbcff; margin-top:4px;';
        if (heroState.assignedUnit && !heroState.isDead) {
            var eqItems = getEquippedItems(sd, heroState.assignedUnit);
            if (eqItems.length > 0) {
                var eqParts = [];
                for (var eq = 0; eq < eqItems.length; eq++) {
                    eqParts.push(getItemEmoji(eqItems[eq]) + getItemName(eqItems[eq]));
                }
                equipDiv.innerHTML = '\u2694 ' + eqParts.join(' · ');
            } else {
                equipDiv.innerHTML = '<span style="color:#666;">No equipment</span>';
            }
        }

        heroCard.appendChild(title);
        heroCard.appendChild(philo);
        heroCard.appendChild(quote);
        heroCard.appendChild(desc);
        heroCard.appendChild(xpBarDiv);
        heroCard.appendChild(status);
        heroCard.appendChild(equipDiv);
        heroList.appendChild(heroCard);
    }

    container.appendChild(heroList);

    // === EQUIPMENT OVERVIEW PANEL ===
    var eqOverview = document.createElement('div');
    eqOverview.style.cssText = 'margin-top:16px; padding:12px; background:#16213e; border:1px solid #2a3a5e; border-radius:8px;';
    eqOverview.innerHTML = '<div style="font-weight:bold; color:#e2b714; margin-bottom:8px; font-size:14px;">\u2694 Equipment Overview</div>';

    var roster = getRoster(sd);
    var anyEquipment = false;

    for (var ri = 0; ri < roster.length; ri++) {
        var rUnit = roster[ri];
        var unitHeroKey = typeof getHeroKeyForUnit === 'function' ? getHeroKeyForUnit(sd, rUnit.key) : null;
        var unitItems = getEquippedItems(sd, rUnit.key);

        if (!unitHeroKey && unitItems.length === 0) continue;

        anyEquipment = true;
        var unitTmpl = rUnit.template;
        var heroLabel = unitHeroKey ? (' \u2014 ' + HERO_DATA[unitHeroKey].name) : ' \u2014 No Hero';
        var canEquip = !!unitHeroKey;

        var unitRow = document.createElement('div');
        unitRow.style.cssText = 'margin-bottom:8px; padding:6px; border-bottom:1px solid #222;';

        var unitHeader = '<div style="font-size:12px; font-weight:bold; color:' + (canEquip ? '#ccc' : '#666') + ';">' +
            ELEMENTS[unitTmpl.element].emoji + ' ' + unitTmpl.name + ' ' + rUnit.stars + '\u2605' +
            '<span style="color:#e2b714; font-weight:normal;">' + heroLabel + '</span></div>';

        var slotNames = ['weapon', 'helm', 'chest', 'gauntlets', 'boots', 'offhand', 'accessory1', 'accessory2'];
        var slotLabels = { weapon: '\u2694Wpn', helm: '\u{1F3A9}Hlm', chest: '\u{1F6E1}Chest', gauntlets: '\u{1F94A}Glt', boots: '\u{1F462}Bts', offhand: '\u{1F52E}Off', accessory1: '\u{1F48D}Acc1', accessory2: '\u{1F4FF}Acc2' };
        var slotsHtml = '<div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:4px;">';

        for (var si = 0; si < slotNames.length; si++) {
            var slotItem = getEquipmentInSlot(sd, rUnit.key, slotNames[si]);
            if (slotItem) {
                var rc = getItemRarityColor(slotItem);
                slotsHtml += '<div style="padding:2px 5px; background:#1a2a4e; border:1px solid ' + rc + '; border-radius:3px; font-size:9px;">' +
                    '<span style="color:' + rc + ';">' + getItemEmoji(slotItem) + '</span> ' +
                    '<span style="color:#ccc;">' + getItemName(slotItem) + '</span>' +
                    (slotItem.enhancement > 0 ? '<span style="color:#6bcb77;">+' + slotItem.enhancement + '</span>' : '') +
                    '</div>';
            } else if (canEquip) {
                slotsHtml += '<div style="padding:2px 5px; background:#111; border:1px solid #333; border-radius:3px; font-size:9px; color:#555;">' +
                    (slotLabels[slotNames[si]] || slotNames[si]) + ' \u2014</div>';
            }
        }
        slotsHtml += '</div>';

        // Equip/unequip buttons for unequipped items
        var unequippedItems = sd.equipment && sd.equipment.inventory ? sd.equipment.inventory.filter(function(it) { return !it.equipped; }) : [];
        var equipBtnHtml = '';
        if (canEquip && unequippedItems.length > 0) {
            equipBtnHtml = '<button class="hero-equip-btn" data-unit="' + rUnit.key + '" style="margin-top:4px; font-size:10px; padding:2px 8px; background:#2a3a5e; color:#e2b714; border:1px solid #4a5a7e; border-radius:3px; cursor:pointer;">Equip Item</button>';
        }

        unitRow.innerHTML = unitHeader + slotsHtml + equipBtnHtml;
        eqOverview.appendChild(unitRow);
    }

    if (!anyEquipment) {
        eqOverview.innerHTML += '<div style="color:#666; font-size:12px;">No hero-equipped units yet. Assign heroes to units to enable equipment.</div>';
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
    overlay.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:1000;';

    var panel = document.createElement('div');
    panel.style.cssText = 'background:#1a1a2e; border:1px solid #444; border-radius:10px; padding:20px; max-width:500px; width:90%; max-height:80vh; overflow-y:auto;';

    panel.innerHTML = '<div style="font-weight:bold; color:#e2b714; margin-bottom:12px; font-size:14px;">\u2694 Equip Item on ' + unitName + '</div>';

    // Show currently equipped
    var equipped = getEquippedItems(sd, unitKey);
    if (equipped.length > 0) {
        panel.innerHTML += '<div style="font-size:11px; color:#888; margin-bottom:8px;">Currently Equipped:</div>';
        for (var ce = 0; ce < equipped.length; ce++) {
            var ceq = equipped[ce];
            var rc = getItemRarityColor(ceq);
            panel.innerHTML += '<div style="padding:4px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #222;">' +
                '<span style="font-size:11px; color:' + rc + ';">' + getItemEmoji(ceq) + ' ' + getItemName(ceq) + ' [' + ceq.slot + ']</span>' +
                '<button class="qe-unequip" data-item-id="' + ceq.id + '" style="font-size:10px; padding:1px 6px; background:#553333; color:#fff; border:1px solid #884444; border-radius:3px; cursor:pointer;">Unequip</button>' +
                '</div>';
        }
    }

    // Show available items
    var available = sd.equipment && sd.equipment.inventory ? sd.equipment.inventory.filter(function(it) { return !it.equipped; }) : [];
    if (available.length > 0) {
        panel.innerHTML += '<div style="font-size:11px; color:#888; margin-top:8px; margin-bottom:4px;">Available (' + available.length + '):</div>';
        for (var ai = 0; ai < available.length; ai++) {
            var avItem = available[ai];
            var arc = getItemRarityColor(avItem);
            var statDesc = typeof getItemStatDescription === 'function' ? getItemStatDescription(avItem) : '';
            panel.innerHTML += '<div class="qe-equip-item" data-item-id="' + avItem.id + '" style="padding:4px 6px; cursor:pointer; border-bottom:1px solid #222; font-size:11px;">' +
                '<span style="color:' + arc + ';">' + getItemEmoji(avItem) + ' ' + getItemName(avItem) + '</span>' +
                ' <span style="color:#888;">[' + avItem.slot + '] T' + (avItem.tier || '?') + '</span>' +
                (statDesc ? '<div style="font-size:9px; color:#666; margin-top:1px;">' + statDesc + '</div>' : '') +
                '</div>';
        }
    } else {
        panel.innerHTML += '<div style="font-size:11px; color:#666; margin-top:8px;">No unequipped items available.</div>';
    }

    var closeBtn = document.createElement('button');
    closeBtn.className = 'btn-secondary';
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
    overlay.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:1000;';

    var panel = document.createElement('div');
    panel.style.cssText = 'background:#1a1a2e; border:1px solid #444; border-radius:10px; padding:20px; max-width:700px; width:90%; max-height:80vh; overflow-y:auto;';

    // Header
    var pointsSpent = getHeroPointsSpent(heroState);
    var header = document.createElement('div');
    header.style.cssText = 'text-align:center; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid #333;';
    header.innerHTML = '<div style="font-size:20px; font-weight:bold;">' + heroData.name + '</div>' +
        '<div style="color:#e2b714; font-size:12px;">' + heroData.philosophy + '</div>' +
        '<div style="color:#aaa; font-size:13px;">Lv ' + heroState.level + ' / 20</div>' +
        '<div style="color:#e2b714; font-size:12px; margin-top:4px;">Points Available: ' + (20 - pointsSpent) + ' / 20</div>';

    // Assigned unit
    if (heroState.assignedUnit) {
        header.innerHTML += '<div style="color:#6bcb77; font-size:11px; margin-top:4px;">Assigned to: ' + getUnitDisplayName(heroState.assignedUnit) + '</div>';
    }
    if (heroState.isDead) {
        header.innerHTML += '<div style="color:#ff6666; font-size:12px; margin-top:4px; font-weight:bold;">FALLEN - Skills preserved</div>';
    }
    panel.appendChild(header);

    // Two branches side by side
    var branchesContainer = document.createElement('div');
    branchesContainer.style.cssText = 'display:flex; gap:12px; margin-bottom:16px;';

    var branchKeys = ['A', 'B'];
    for (var bi = 0; bi < branchKeys.length; bi++) {
        var branch = branchKeys[bi];
        var branchData = heroData.branches[branch];
        if (!branchData || !tree[branch]) continue;

        var branchPanel = document.createElement('div');
        branchPanel.style.cssText = 'flex:1; background:#16213e; border:1px solid #2a3a5e; border-radius:6px; padding:10px;';

        var branchTitle = document.createElement('div');
        branchTitle.style.cssText = 'font-weight:bold; font-size:12px; color:#e2b714; margin-bottom:4px; text-align:center;';
        branchTitle.textContent = branch + ': ' + branchData.name;
        branchPanel.appendChild(branchTitle);

        var branchDesc = document.createElement('div');
        branchDesc.style.cssText = 'font-size:9px; color:#888; margin-bottom:8px; text-align:center;';
        branchDesc.textContent = branchData.description;
        branchPanel.appendChild(branchDesc);

        // Tiers 1-5
        for (var tier = 1; tier <= 5; tier++) {
            var tierNodes = tree[branch][tier];
            if (!tierNodes) continue;

            var tierDiv = document.createElement('div');
            tierDiv.style.cssText = 'margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid #2a3a5e;';

            var tierLabel = document.createElement('div');
            tierLabel.style.cssText = 'font-size:10px; color:#888; margin-bottom:4px; font-weight:bold;';
            tierLabel.textContent = 'T' + tier + ' (Cost: ' + getHeroSkillCost(tier) + ', Req: L' + getHeroTierLevelReq(tier) + ')';
            tierDiv.appendChild(tierLabel);

            var choicesDiv = document.createElement('div');
            choicesDiv.style.cssText = 'display:flex; flex-direction:column; gap:4px;';

            for (var ci = 0; ci < tierNodes.length; ci++) {
                var node = tierNodes[ci];
                var nodeDiv = document.createElement('div');
                nodeDiv.style.cssText = 'padding:6px; border-radius:4px; font-size:10px; border:1px solid #444; background:#0d0d1a;';

                var isInvested = heroState.investedNodes && heroState.investedNodes.indexOf(node.id) >= 0;
                var canInvest = !heroState.isDead && canUnlockNode(sd, heroKey, node.id);
                var levelLocked = heroState.level < node.levelReq;

                if (isInvested) {
                    nodeDiv.style.background = '#1a3a1a';
                    nodeDiv.style.borderColor = '#6bcb77';
                    nodeDiv.style.color = '#6bcb77';
                    nodeDiv.style.fontWeight = 'bold';
                    nodeDiv.innerHTML = '<div>' + node.name + '</div><div style="font-size:9px; color:#8bc78b; margin-top:2px;">' + node.effect + '</div>';
                } else if (levelLocked) {
                    nodeDiv.style.color = '#666';
                    nodeDiv.textContent = '? (Requires Lv ' + node.levelReq + ')';
                } else if (canInvest) {
                    nodeDiv.style.cursor = 'pointer';
                    nodeDiv.style.borderColor = '#4488ff';
                    nodeDiv.innerHTML = '<div style="color:#88bbff;">' + node.name + '</div><div style="font-size:9px; color:#aaa; margin-top:2px;">' + node.effect + '</div>';
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
                    nodeDiv.style.color = '#666';
                    nodeDiv.innerHTML = '<div>' + node.name + '</div><div style="font-size:9px; color:#555; margin-top:2px;">' + node.effect + '</div>';
                }

                choicesDiv.appendChild(nodeDiv);
            }

            tierDiv.appendChild(choicesDiv);
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
        assignBtn.className = 'btn-primary';
        assignBtn.style.cssText = 'padding:8px 16px; font-size:12px;';
        assignBtn.textContent = heroState.assignedUnit ? 'Reassign' : 'Assign to Unit';
        assignBtn.onclick = (function(hk, ov) {
            return function() { ov.remove(); showHeroAssignPanel(hk); };
        })(heroKey, overlay);
        buttonDiv.appendChild(assignBtn);

        if (heroState.assignedUnit) {
            var unassignBtn = document.createElement('button');
            unassignBtn.className = 'btn-secondary';
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
        respecBtn.className = 'btn-secondary';
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
    closeBtn.className = 'btn-secondary';
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
    overlay.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:1000;';

    var panel = document.createElement('div');
    panel.style.cssText = 'background:#1a1a2e; border:1px solid #444; border-radius:10px; padding:20px; max-width:400px; width:90%; max-height:70vh; overflow-y:auto;';

    panel.innerHTML = '<div style="font-weight:bold; color:#e2b714; margin-bottom:12px; font-size:14px;">Assign ' + HERO_DATA[heroKey].name + ' to Unit</div>';

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
        unitDiv.style.cssText = 'padding:6px; cursor:pointer; border-bottom:1px solid #222; font-size:12px;';
        unitDiv.innerHTML = ELEMENTS[r.template.element].emoji + ' ' + r.template.name + ' ' + r.stars + '\u2605' + assignedLabel;
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
    cancelBtn.className = 'btn-secondary';
    cancelBtn.style.cssText = 'margin-top:12px; padding:8px 16px; font-size:12px;';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = function() { overlay.remove(); renderHeroScreen(); };
    panel.appendChild(cancelBtn);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
}


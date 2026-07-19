// ui-shared.js -- shared UI helpers: toasts, top bar, status icons, element emoji (split from ui-v2.js)

// ---- Status Effect Icon Map ----
var STATUS_ICONS = {
    burn:           '\uD83D\uDD25',
    poison:         '\u2620\uFE0F',
    bleed:          '\uD83E\uDE78',
    stun:           '\u2B50',
    freeze:         '\uD83E\uDDCA',
    silence:        '\uD83D\uDEAB',
    blind:          '\uD83C\uDF11',
    root:           '\uD83C\uDF3F',
    taunt:          '\uD83C\uDFAF',
    slow:           '\uD83D\uDC0C',
    dodgeBuff:      '\uD83D\uDCA8',
    atkBuff:        '\u2694\uFE0F',
    atkMod:         '\uD83D\uDCC9',
    drMod:          '\uD83D\uDEE1\uFE0F',
    spdMod:         '\u26A1',
    reflect:        '\uD83E\uDE9E',
    regen:          '\uD83D\uDC9A',
    healReduction:  '\uD83D\uDC94',
    vulnerability:  '\u26A0\uFE0F'
};

// ---- Toast Notification ----
// Prompt 77 (Phase 6.1, Task 1): migrated onto the design-system tokens
// (var(--sv-*) in place of literal hex) -- same element/animation/timing
// contract as before, just sourced from game-v2.html's :root tokens instead
// of hardcoded colors.

function showToast(message) {
    var toast = document.createElement('div');
    toast.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:var(--sv-gold); color:var(--sv-bg-1); padding:10px 20px; border-radius:var(--sv-radius-md); font-weight:bold; font-size:13px; z-index:9999; white-space:pre-line; text-align:center; box-shadow:var(--sv-shadow-lg); animation:toastIn 0.3s ease-out;';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(function() { toast.remove(); }, 500);
    }, 3000);
}

// ---- Confirm Dialog (non-blocking replacement for native confirm()) ----
// Migrated onto .sv-modal-backdrop/.sv-modal-panel/.sv-btn-primary/.sv-btn --
// same two-button contract (#confirm-ok/#confirm-cancel), same call signature.

function showConfirmDialog(message, onConfirm, onCancel) {
    var overlay = document.getElementById('confirm-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'confirm-overlay';
        overlay.className = 'sv-modal-backdrop';
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = '<div class="sv-modal-panel" style="text-align:center;">' +
        '<div style="font-size:14px; margin-bottom:16px; white-space:pre-line;">' + message + '</div>' +
        '<div style="display:flex; gap:10px; justify-content:center;">' +
        '<button id="confirm-ok" class="sv-btn sv-btn-primary" style="padding:8px 20px;">OK</button>' +
        '<button id="confirm-cancel" class="sv-btn" style="padding:8px 20px;">Cancel</button>' +
        '</div></div>';
    if (overlay.classList) overlay.classList.add('show');
    overlay.style.display = 'flex';
    document.getElementById('confirm-ok').onclick = function() {
        overlay.style.display = 'none';
        if (overlay.classList) overlay.classList.remove('show');
        onConfirm();
    };
    document.getElementById('confirm-cancel').onclick = function() {
        overlay.style.display = 'none';
        if (overlay.classList) overlay.classList.remove('show');
        if (onCancel) onCancel();
    };
}

// ---- Top Bar ----

function renderTopBar() {
    var sd = getSaveData();
    document.getElementById('player-level').textContent = 'Lv. ' + sd.player.level;
    document.getElementById('player-gold').textContent = '✨ ' + sd.player.veilEssence + ' VE';

    var levelCap = typeof getPlayerLevelCap === 'function' ? getPlayerLevelCap(sd) : 20;
    if (sd.player.level >= 20) {
        document.getElementById('player-xp').textContent = 'XP: MAX';
    } else if (sd.player.level >= levelCap) {
        document.getElementById('player-xp').textContent = 'XP: CAPPED (clear boss to raise)';
    } else {
        var xpForNext = getXPForLevel(sd.player.level + 1);
        document.getElementById('player-xp').textContent = 'XP: ' + sd.player.xp + '/' + xpForNext;
    }

    // Show back button unless on hub
    var backBtn = document.getElementById('nav-back');
    backBtn.style.display = (currentScreen === 'hub') ? 'none' : 'inline-block';
}

function goBack() {
    if (currentScreen === 'combat') return; // Can't leave mid-combat
    showScreen('hub');
}

// ---- Element Emoji Helper ----

function getElementEmoji(element) {
    if (ELEMENTS && ELEMENTS[element]) return ELEMENTS[element].emoji;
    var map = { 'fire': '🔥', 'water': '💧', 'earth': '🌿', 'wind': '💨', 'lightning': '⚡', 'force': '💪' };
    return map[element] || '❓';
}

function getElementColor(element) {
    var colorMap = {
        'fire': '#FF4500',
        'water': '#1E90FF',
        'earth': '#228B22',
        'wind': '#87CEEB',
        'lightning': '#FFD700',
        'force': '#9370DB'
    };
    return colorMap[element] || '#FFF';
}


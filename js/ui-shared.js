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

function showToast(message) {
    var toast = document.createElement('div');
    toast.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#e2b714; color:#1a1a2e; padding:10px 20px; border-radius:8px; font-weight:bold; font-size:13px; z-index:9999; white-space:pre-line; text-align:center; box-shadow:0 4px 12px rgba(0,0,0,0.5); animation:toastIn 0.3s ease-out;';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(function() { toast.remove(); }, 500);
    }, 3000);
}

// ---- Confirm Dialog (non-blocking replacement for native confirm()) ----

function showConfirmDialog(message, onConfirm, onCancel) {
    var overlay = document.getElementById('confirm-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'confirm-overlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:2000;';
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = '<div style="background:#1a1a2e; border:2px solid #e2b714; border-radius:10px; padding:20px; max-width:400px; text-align:center;">' +
        '<div style="font-size:14px; margin-bottom:16px; white-space:pre-line;">' + message + '</div>' +
        '<div style="display:flex; gap:10px; justify-content:center;">' +
        '<button id="confirm-ok" class="btn-primary" style="padding:8px 20px;">OK</button>' +
        '<button id="confirm-cancel" class="btn-secondary" style="padding:8px 20px;">Cancel</button>' +
        '</div></div>';
    overlay.style.display = 'flex';
    document.getElementById('confirm-ok').onclick = function() { overlay.style.display = 'none'; onConfirm(); };
    document.getElementById('confirm-cancel').onclick = function() { overlay.style.display = 'none'; if (onCancel) onCancel(); };
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


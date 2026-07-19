// =============================================================================
// onboarding.js -- first-session guided flow (Prompt 82, Phase 8.2).
//
// A fresh save currently drops the player on the hub with 10 starter units
// and zero guidance. This file adds a lightweight 5-step coachmark that
// points at the next thing to do -- never a full-screen blocking modal, and
// dismissable ("Skip Tutorial") at every step. State lives in
// saveData.onboarding (js/save.js: createDefaultSaveData() stamps it active
// for genuinely fresh saves; migrateSave()/validateSaveData() backfill any
// EXISTING save as already-completed so returning players never see it).
//
// Wiring: every hook below is a single `if (typeof onboardingX === 'function')`
// call added at the one real choke point for that action (matches the
// AUDIO.on*()/SFX.play() convention already used throughout the codebase),
// so this file's load position relative to its callers doesn't matter --
// none of them run before the full script list (including this file) has
// loaded. See:
//   js/hub.js         showScreen()            -> onboardingOnScreenChange()
//   js/ui-gacha.js     uiDoSingleRoll/MultiRoll -> onboardingOnGachaRoll()
//   js/ui-builder.js   renderTeamBuilderScreen() -> onboardingOnTeamBuilderRender()
//   js/ui-combat.js    beginCombatScreen()      -> onboardingOnCombatStart()
//   js/ui-combat.js    showMissionResults()     -> onboardingOnMissionResults()
//
// Step flow (index into ONBOARDING_STEPS):
//   0 summon_intro   -- hub, points at the Summon nav button.       advances on navigating to gacha
//   1 first_roll     -- gacha, points at the x1 Rite button.        advances on any successful roll
//   2 team_builder   -- team-builder, generic "place 3" prompt.     advances once the team has 3+ slots
//   3 first_mission  -- any non-combat screen, points at Missions.  advances once combat actually starts
//   4 results_upgrade-- shown on the results panel after a mission. completes on the next hub visit
// =============================================================================

var ONBOARDING_STEPS = [
    {
        id: 'summon_intro', screen: 'hub', highlightId: 'hub-nav-summon',
        text: 'Welcome, Warden. Tap Summon to call your first heroes from the Veil.'
    },
    {
        id: 'first_roll', screen: 'gacha', highlightId: 'btn-roll-1',
        text: 'Perform a Rite to summon a hero. A single Rite is a great place to start.'
    },
    {
        id: 'team_builder', screen: 'team-builder', highlightId: null,
        text: 'Place 3 units onto the arena to build your first team.'
    },
    {
        id: 'first_mission', screen: null, highlightId: 'hub-nav-missions',
        text: 'Head to Missions and start your first battle.'
    },
    {
        id: 'results_upgrade', screen: null, highlightId: null,
        text: 'Nicely done! Head back to camp and spend Veil Essence upgrading your buildings and units.'
    }
];

var ONBOARDING_LAST_HIGHLIGHT = null;

// ---- state helpers ----

function onboardingActive(sd) {
    sd = sd || (typeof getSaveData === 'function' ? getSaveData() : null);
    return !!(sd && sd.onboarding && !sd.onboarding.completed && !sd.onboarding.dismissed);
}

function onboardingAdvance(sd) {
    if (!sd || !sd.onboarding) return;
    sd.onboarding.step = Math.min(ONBOARDING_STEPS.length - 1, sd.onboarding.step + 1);
    if (typeof autoSave === 'function') autoSave(sd);
}

function onboardingComplete(sd) {
    if (!sd || !sd.onboarding) return;
    sd.onboarding.completed = true;
    onboardingHideOverlay();
    if (typeof autoSave === 'function') autoSave(sd);
}

function onboardingDismiss() {
    var sd = typeof getSaveData === 'function' ? getSaveData() : null;
    if (!sd || !sd.onboarding) return;
    sd.onboarding.dismissed = true;
    onboardingHideOverlay();
    if (typeof autoSave === 'function') autoSave(sd);
}

// ---- overlay (small fixed coachmark, never a blocking backdrop) ----

function onboardingSetHighlight(id) {
    if (ONBOARDING_LAST_HIGHLIGHT) {
        var prev = document.getElementById(ONBOARDING_LAST_HIGHLIGHT);
        if (prev && prev.classList) prev.classList.remove('onboarding-highlight');
    }
    ONBOARDING_LAST_HIGHLIGHT = id || null;
    if (id) {
        var el = document.getElementById(id);
        if (el && el.classList) el.classList.add('onboarding-highlight');
    }
}

function onboardingRenderOverlay(stepIndex) {
    var def = ONBOARDING_STEPS[stepIndex];
    var el = document.getElementById('onboarding-coachmark');
    if (!def || !el) return;
    var textEl = document.getElementById('onboarding-coachmark-text');
    if (textEl) textEl.textContent = def.text;
    el.style.display = 'flex';
    if (el.classList) el.classList.add('show');
    onboardingSetHighlight(def.highlightId);
}

function onboardingHideOverlay() {
    var el = document.getElementById('onboarding-coachmark');
    if (el) {
        el.style.display = 'none';
        if (el.classList) el.classList.remove('show');
    }
    onboardingSetHighlight(null);
}

// ---- hooks (called from the game's existing choke points) ----

function onboardingOnScreenChange(screenId) {
    var sd = typeof getSaveData === 'function' ? getSaveData() : null;
    if (!onboardingActive(sd)) { onboardingHideOverlay(); return; }

    var step = sd.onboarding.step;

    // Step 0 -> 1: reaching the gacha screen for the first time is itself
    // the "go summon" goal being met.
    if (step === 0 && screenId === 'gacha') {
        onboardingAdvance(sd);
        step = sd.onboarding.step;
    }

    // Step 4 -> completed: returning to the hub after seeing the results
    // pointer closes out the tutorial.
    if (step === 4 && screenId === 'hub') {
        onboardingComplete(sd);
        return;
    }

    // Combat itself never shows the coachmark (would clutter the HUD) --
    // onboardingOnCombatStart()/onboardingOnMissionResults() own that window.
    if (screenId === 'combat') { onboardingHideOverlay(); return; }

    var def = ONBOARDING_STEPS[step];
    if (!def || (def.screen && def.screen !== screenId)) {
        onboardingHideOverlay();
        return;
    }
    onboardingRenderOverlay(step);
}

function onboardingOnGachaRoll() {
    var sd = typeof getSaveData === 'function' ? getSaveData() : null;
    if (!onboardingActive(sd)) return;
    if (sd.onboarding.step === 1) {
        onboardingAdvance(sd);
        onboardingHideOverlay(); // next step's screen (team-builder) hasn't been reached yet
    }
}

function onboardingOnTeamBuilderRender(slotCount) {
    var sd = typeof getSaveData === 'function' ? getSaveData() : null;
    if (!onboardingActive(sd)) return;
    if (sd.onboarding.step === 2) {
        if (slotCount >= 3) {
            onboardingAdvance(sd);
            onboardingRenderOverlay(3);
        } else {
            onboardingRenderOverlay(2);
        }
    } else if (sd.onboarding.step === 3) {
        onboardingRenderOverlay(3);
    }
}

function onboardingOnCombatStart() {
    var sd = typeof getSaveData === 'function' ? getSaveData() : null;
    if (!onboardingActive(sd)) return;
    if (sd.onboarding.step === 3) onboardingAdvance(sd);
    onboardingHideOverlay();
}

function onboardingOnMissionResults() {
    var sd = typeof getSaveData === 'function' ? getSaveData() : null;
    if (!onboardingActive(sd)) return;
    if (sd.onboarding.step === 4) onboardingRenderOverlay(4);
}

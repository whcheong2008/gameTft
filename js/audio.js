// =============================================================================
// audio.js -- WebAudio engine: synthesized SFX + generative ambient music
// (Prompt 81, Phase 7).
//
// Iron rules (prompts/81-audio.md):
//   - ZERO downloaded assets, ZERO third-party audio libraries. Every sound in
//     this file is built live from oscillators/noise buffers/filters/
//     envelopes via the Web Audio API. (MASTERPLAN.md's Phase 7 write-up
//     mentions "vendored Howler" -- that's superseded by this prompt's
//     explicit constraint; the code here is the source of truth.)
//   - Combat cues wire through combatEvents ONLY (see the "Combat event
//     wiring" section below) -- js/combat-*.js gained zero edits. Where a cue
//     needs state combatEvents doesn't publish directly (boss phase/enrage
//     transitions), this file POLLS the existing global `combatState` inside
//     a 'tick' listener and tags a cosmetic-only `__audioXxx` marker property
//     onto the boss unit object -- the exact same "attach a private field to
//     a live unit object for presentation bookkeeping" pattern js/vfx.js
//     already established with `unit.__pixiVis`. Nothing combat logic reads
//     is ever touched.
//   - Every cosmetic random draw (pitch jitter, noise buffer content, motif
//     note choice/timing) goes through this file's own LOCAL PRNG
//     (audioRngNext() below) -- never Math.random(), so goldens/combat RNG
//     stay byte-identical whether audio is "on" or the AudioContext is
//     entirely absent (see tests/test-audio.js's isolation test).
//   - Headless-safe no-op: every public entry point (SFX.play/MUSIC.set/
//     AUDIO.*) early-returns without throwing when no AudioContext is
//     available (tests/harness.js never defines one) -- see
//     audioEnsureContext().
//   - Per-cue replaceability: SFX_REGISTRY[name].src / MUSIC_CONTEXTS[name].src
//     are optional file-URL overrides checked first, so licensed audio can
//     replace an individual cue later without touching this file's dispatch
//     logic. Nothing in this repo ever sets one today (zero downloaded
//     assets rule) -- the field just makes the swap trivial.
// =============================================================================

// -----------------------------------------------------------------------
// Local cosmetic PRNG (mulberry32) -- mirrors js/vfx.js's vfxRngNext()
// fallback exactly, but audio.js has no shared cosmetic RNG to prefer (VFX's
// is Pixi-specific), so this is always its own independent stream. Never
// reaches for Math.random().
// -----------------------------------------------------------------------

var audioRngState = (Date.now() % 2147483647) || 1;
function audioRngNext() {
    audioRngState |= 0;
    audioRngState = (audioRngState + 0x6D2B79F5) | 0;
    var t = audioRngState;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// jitter(range): multiplier in [1-range, 1+range], centered on 1.
function audioJitter(range) {
    return 1 + (audioRngNext() - 0.5) * 2 * (range === undefined ? 0.04 : range);
}

// -----------------------------------------------------------------------
// AudioContext singleton + master/music/sfx gain buses.
// -----------------------------------------------------------------------

var AUDIO_CTX = null;
var AUDIO_BUSES = { master: null, music: null, sfx: null };

function audioCtxCtor() {
    if (typeof AudioContext !== 'undefined') return AudioContext;
    if (typeof window !== 'undefined' && typeof window.webkitAudioContext !== 'undefined') return window.webkitAudioContext;
    return null;
}

// Lazily creates (once) the AudioContext + gain graph. Returns null -- never
// throws -- when no AudioContext constructor exists at all (the harness) or
// construction fails for any reason. Every public entry point below calls
// this first and bails out on null: that's the entire headless-safe-no-op
// contract in one place.
function audioEnsureContext() {
    if (AUDIO_CTX) return AUDIO_CTX;
    var Ctor = audioCtxCtor();
    if (!Ctor) return null;
    try {
        AUDIO_CTX = new Ctor();
        AUDIO_BUSES.master = AUDIO_CTX.createGain();
        AUDIO_BUSES.music = AUDIO_CTX.createGain();
        AUDIO_BUSES.sfx = AUDIO_CTX.createGain();
        AUDIO_BUSES.music.connect(AUDIO_BUSES.master);
        AUDIO_BUSES.sfx.connect(AUDIO_BUSES.master);
        AUDIO_BUSES.master.connect(AUDIO_CTX.destination);
        audioApplyVolumesToBuses();
    } catch (e) {
        AUDIO_CTX = null;
        AUDIO_BUSES = { master: null, music: null, sfx: null };
    }
    return AUDIO_CTX;
}

// -----------------------------------------------------------------------
// Settings: master/music/sfx volume (0-1) + mute, persisted on
// saveData.audio via js/save.js's "version-agnostic backfill" convention
// (see save.js's loreUnlocks/endless blocks for the precedent this follows --
// createDefaultSaveData() seeds the field, validateSaveData()/migrateSave()
// backfill it onto any save that predates this prompt, no version bump).
// -----------------------------------------------------------------------

var AUDIO_DEFAULT_SETTINGS = { masterVolume: 0.8, musicVolume: 0.7, sfxVolume: 0.9, muted: false };
var AUDIO_SETTINGS_CACHE = null;

// Returns a live reference to saveData.audio when a save is available (so
// mutating it and calling autoSave() persists), else a local fallback object
// that just won't be saved (headless callers / pre-boot UI probes).
function audioSettings() {
    var sd = (typeof getSaveData === 'function') ? getSaveData() : null;
    if (sd) {
        if (!sd.audio) sd.audio = { masterVolume: AUDIO_DEFAULT_SETTINGS.masterVolume, musicVolume: AUDIO_DEFAULT_SETTINGS.musicVolume, sfxVolume: AUDIO_DEFAULT_SETTINGS.sfxVolume, muted: AUDIO_DEFAULT_SETTINGS.muted };
        AUDIO_SETTINGS_CACHE = sd.audio;
        return sd.audio;
    }
    if (!AUDIO_SETTINGS_CACHE) {
        AUDIO_SETTINGS_CACHE = { masterVolume: AUDIO_DEFAULT_SETTINGS.masterVolume, musicVolume: AUDIO_DEFAULT_SETTINGS.musicVolume, sfxVolume: AUDIO_DEFAULT_SETTINGS.sfxVolume, muted: AUDIO_DEFAULT_SETTINGS.muted };
    }
    return AUDIO_SETTINGS_CACHE;
}

function audioPersistSettings() {
    var sd = (typeof getSaveData === 'function') ? getSaveData() : null;
    if (sd && typeof autoSave === 'function') autoSave(sd);
}

function audioApplyVolumesToBuses() {
    if (!AUDIO_CTX || !AUDIO_BUSES.master) return;
    var s = audioSettings();
    var now = AUDIO_CTX.currentTime;
    var masterVal = s.muted ? 0 : Math.max(0, Math.min(1, s.masterVolume));
    try {
        AUDIO_BUSES.master.gain.setValueAtTime(masterVal, now);
        AUDIO_BUSES.music.gain.setValueAtTime(Math.max(0, Math.min(1, s.musicVolume)), now);
        AUDIO_BUSES.sfx.gain.setValueAtTime(Math.max(0, Math.min(1, s.sfxVolume)), now);
    } catch (e) {}
}

// -----------------------------------------------------------------------
// Unlock-on-first-gesture: browsers start every AudioContext in a
// "suspended" state until a real user gesture resumes it. Registered once at
// script-load time; a true no-op headlessly since tests/harness.js's
// document.addEventListener() never actually fires a callback.
// -----------------------------------------------------------------------

function audioUnlockHandler() {
    var ctx = audioEnsureContext();
    if (ctx && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
        try { ctx.resume(); } catch (e) {}
    }
    if (typeof document !== 'undefined' && document.removeEventListener) {
        document.removeEventListener('pointerdown', audioUnlockHandler, true);
        document.removeEventListener('keydown', audioUnlockHandler, true);
        document.removeEventListener('touchstart', audioUnlockHandler, true);
    }
}
if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('pointerdown', audioUnlockHandler, true);
    document.addEventListener('keydown', audioUnlockHandler, true);
    document.addEventListener('touchstart', audioUnlockHandler, true);
}

// -----------------------------------------------------------------------
// Generic "button click" SFX: a single delegated capture-phase click
// listener instead of touching every onclick="..." handler in every UI file
// (the "event-driven where events exist" half of the spec's Task 2 UI
// bullet -- native DOM click bubbling IS the event here). Headless-safe/
// inert the same way as the unlock handler above.
// -----------------------------------------------------------------------

function audioGlobalClickHandler(e) {
    var el = e && e.target;
    var depth = 0;
    while (el && depth < 6) {
        var isButton = el.tagName === 'BUTTON';
        var hasBtnClass = typeof el.className === 'string' && el.className.indexOf('sv-btn') >= 0;
        if (isButton || hasBtnClass) {
            SFX.play('uiClick', {});
            return;
        }
        el = el.parentNode;
        depth++;
    }
}
if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('click', audioGlobalClickHandler, true);
}

// =============================================================================
// Low-level synthesis helpers. Every cue below is built from these four
// primitives: tone (oscillator + envelope), noiseBurst (filtered noise +
// envelope), arp (a short sequence of tones), and sweep (a tone whose
// frequency ramps over its own duration -- reused for whooshes/riser/swells).
// =============================================================================

function audioEnvGain(param, start, attack, decay, peak, sustain, release, totalDur) {
    if (typeof param.cancelScheduledValues === 'function') param.cancelScheduledValues(start);
    param.setValueAtTime(0.0001, start);
    param.linearRampToValueAtTime(Math.max(0.0001, peak), start + attack);
    param.linearRampToValueAtTime(Math.max(0.0001, sustain), start + attack + decay);
    var releaseStart = Math.max(start + attack + decay, start + totalDur - release);
    param.setValueAtTime(Math.max(0.0001, sustain), releaseStart);
    param.linearRampToValueAtTime(0.0001, releaseStart + release);
}

// opts: freq, freqEnd (optional exponential sweep target), type, duration,
// startOffset (seconds from now), attack/decay/sustain/release, gainPeak,
// detune.
function audioTone(ctx, bus, opts) {
    opts = opts || {};
    var start = ctx.currentTime + (opts.startOffset || 0);
    var duration = opts.duration || 0.2;
    var osc = ctx.createOscillator();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(Math.max(1, opts.freq || 440), start);
    if (opts.freqEnd && typeof osc.frequency.exponentialRampToValueAtTime === 'function') {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.freqEnd), start + duration);
    }
    if (opts.detune && osc.detune) osc.detune.value = opts.detune;
    var g = ctx.createGain();
    audioEnvGain(g.gain, start,
        opts.attack === undefined ? 0.005 : opts.attack,
        opts.decay === undefined ? 0.05 : opts.decay,
        opts.gainPeak === undefined ? 0.25 : opts.gainPeak,
        opts.sustain === undefined ? 0.0001 : opts.sustain,
        opts.release === undefined ? 0.08 : opts.release,
        duration);
    osc.connect(g);
    g.connect(bus);
    osc.start(start);
    osc.stop(start + duration + 0.05);
    return osc;
}

// Cached 1-second white-noise buffer (content drawn from the local PRNG, not
// Math.random) reused by every noise-based cue -- one buffer per live
// AudioContext.
var AUDIO_NOISE_BUFFER = null;
var AUDIO_NOISE_BUFFER_CTX = null;
function audioGetNoiseBuffer(ctx) {
    if (AUDIO_NOISE_BUFFER && AUDIO_NOISE_BUFFER_CTX === ctx) return AUDIO_NOISE_BUFFER;
    var sr = ctx.sampleRate || 44100;
    var len = Math.floor(sr * 1.0);
    var buf = ctx.createBuffer(1, len, sr);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = audioRngNext() * 2 - 1;
    AUDIO_NOISE_BUFFER = buf;
    AUDIO_NOISE_BUFFER_CTX = ctx;
    return buf;
}

// opts: filterType ('lowpass'/'highpass'/'bandpass'), filterFreq, Q,
// duration, startOffset, attack/decay/release, gainPeak.
function audioNoiseBurst(ctx, bus, opts) {
    opts = opts || {};
    var start = ctx.currentTime + (opts.startOffset || 0);
    var duration = opts.duration || 0.12;
    var src = ctx.createBufferSource();
    src.buffer = audioGetNoiseBuffer(ctx);
    src.loop = false;
    var filt = ctx.createBiquadFilter();
    filt.type = opts.filterType || 'bandpass';
    filt.frequency.value = opts.filterFreq || 800;
    if (opts.Q && filt.Q) filt.Q.value = opts.Q;
    var g = ctx.createGain();
    audioEnvGain(g.gain, start,
        opts.attack === undefined ? 0.001 : opts.attack,
        opts.decay === undefined ? 0.03 : opts.decay,
        opts.gainPeak === undefined ? 0.35 : opts.gainPeak,
        0.0001,
        opts.release === undefined ? 0.05 : opts.release,
        duration);
    src.connect(filt);
    filt.connect(g);
    g.connect(bus);
    src.start(start);
    src.stop(start + duration + 0.05);
    return src;
}

// A short ascending/descending sequence of tones. freqs: array of Hz.
function audioArp(ctx, bus, freqs, opts) {
    opts = opts || {};
    var noteDur = opts.noteDur || 0.14;
    var gap = opts.gap === undefined ? 0.09 : opts.gap;
    for (var i = 0; i < freqs.length; i++) {
        audioTone(ctx, bus, {
            freq: freqs[i], type: opts.type || 'triangle', duration: noteDur,
            startOffset: (opts.startOffset || 0) + i * gap,
            attack: 0.005, decay: noteDur * 0.35,
            gainPeak: opts.gainPeak === undefined ? 0.22 : opts.gainPeak,
            sustain: (opts.gainPeak === undefined ? 0.22 : opts.gainPeak) * 0.22,
            release: noteDur * 0.6
        });
    }
}

function audioNoteFreq(root, semitones) {
    return root * Math.pow(2, semitones / 12);
}

// -----------------------------------------------------------------------
// Per-element timbre table (6 elements -- matches js/vfx.js's
// VFX_ELEMENT_THEME key set) used by hitRanged/castWhoosh so each element
// reads as a distinct "family" rather than one generic hit sound.
// -----------------------------------------------------------------------

var AUDIO_ELEMENT_TONE = {
    fire:      { freq: 480,  type: 'sawtooth', filterType: 'lowpass'  },
    water:     { freq: 380,  type: 'sine',     filterType: 'lowpass'  },
    earth:     { freq: 150,  type: 'triangle', filterType: 'lowpass'  },
    wind:      { freq: 900,  type: 'sine',     filterType: 'highpass' },
    lightning: { freq: 1500, type: 'square',   filterType: 'highpass' },
    force:     { freq: 260,  type: 'triangle', filterType: 'bandpass' }
};
function audioElementTone(element) {
    return AUDIO_ELEMENT_TONE.hasOwnProperty(element) ? AUDIO_ELEMENT_TONE[element] : AUDIO_ELEMENT_TONE.force;
}

// =============================================================================
// SFX registry -- each entry is { synth: fn(ctx,bus,opts), cooldown (sec,
// default 40ms), src (optional file URL override) }.
// =============================================================================

var SFX_DEFAULT_COOLDOWN = 0.04; // 40ms
var SFX_MAX_CONCURRENT_VOICES = 20; // global polyphony cap ("4x combat shouldn't be a wall of noise")

// ---- UI cues ----

function sfxUiClick(ctx, bus, opts) {
    audioTone(ctx, bus, { freq: 900 * audioJitter(0.05), type: 'square', duration: 0.045, attack: 0.001, decay: 0.02, gainPeak: 0.10, release: 0.02 });
}

function sfxScreenChange(ctx, bus, opts) {
    audioTone(ctx, bus, { freq: 320, freqEnd: 560, type: 'sine', duration: 0.15, attack: 0.005, decay: 0.05, gainPeak: 0.14, release: 0.09 });
}

function sfxToast(ctx, bus, opts) {
    audioTone(ctx, bus, { freq: 740 * audioJitter(0.02), type: 'triangle', duration: 0.10, attack: 0.002, decay: 0.03, gainPeak: 0.13, release: 0.05 });
    audioTone(ctx, bus, { freq: 1040 * audioJitter(0.02), type: 'triangle', duration: 0.10, startOffset: 0.06, attack: 0.002, decay: 0.03, gainPeak: 0.11, release: 0.06 });
}

function sfxRollCharge(ctx, bus, opts) {
    // Rising sweep matching the ~600ms CSS charge animation, layered with a
    // bandpass noise riser for texture.
    audioTone(ctx, bus, { freq: 140, freqEnd: 900, type: 'sawtooth', duration: 0.6, attack: 0.05, decay: 0.2, gainPeak: 0.10, sustain: 0.05, release: 0.25 });
    var filt = { filterType: 'bandpass', filterFreq: 300, Q: 4, duration: 0.6, attack: 0.15, decay: 0.2, gainPeak: 0.08, release: 0.2 };
    audioNoiseBurst(ctx, bus, filt);
}

function sfxCardFlip(ctx, bus, opts) {
    audioNoiseBurst(ctx, bus, { filterType: 'highpass', filterFreq: 2200, Q: 1.2, duration: 0.05, attack: 0.001, decay: 0.015, gainPeak: 0.18, release: 0.02 });
}

// opts.tier: 1-5 (gacha unit cost). Ascending arpeggio scales in note count
// + brightness with tier; T5 gets an extra shimmer layer + noise sparkle.
function sfxRollReveal(ctx, bus, opts) {
    var tier = Math.max(1, Math.min(5, (opts && opts.tier) || 1));
    var root = 261.63 * Math.pow(2, tier * 0.08); // higher tiers sit a bit brighter
    var degrees = [0, 4, 7, 10, 12];
    var freqs = [];
    for (var i = 0; i < 2 + tier; i++) freqs.push(audioNoteFreq(root, degrees[i % degrees.length] + 12 * Math.floor(i / degrees.length)));
    audioArp(ctx, bus, freqs, { noteDur: 0.12, gap: 0.05, type: tier >= 4 ? 'sawtooth' : 'triangle', gainPeak: 0.14 + tier * 0.02 });
    if (tier >= 5) {
        audioTone(ctx, bus, { freq: root * 2, type: 'sine', duration: 0.9, attack: 0.02, decay: 0.3, gainPeak: 0.22, sustain: 0.08, release: 0.5, detune: 6 });
        audioNoiseBurst(ctx, bus, { filterType: 'highpass', filterFreq: 3500, Q: 0.7, duration: 0.5, attack: 0.01, decay: 0.15, gainPeak: 0.12, release: 0.3 });
    }
}

function sfxUpgradeSuccess(ctx, bus, opts) {
    audioArp(ctx, bus, [audioNoteFreq(392, 0), audioNoteFreq(392, 4), audioNoteFreq(392, 7)], { noteDur: 0.11, gap: 0.07, type: 'triangle', gainPeak: 0.18 });
}

function sfxItemEquip(ctx, bus, opts) {
    audioNoiseBurst(ctx, bus, { filterType: 'highpass', filterFreq: 2800, Q: 2, duration: 0.04, attack: 0.001, decay: 0.01, gainPeak: 0.16, release: 0.02 });
    audioTone(ctx, bus, { freq: 520 * audioJitter(0.03), type: 'square', duration: 0.08, startOffset: 0.015, attack: 0.002, decay: 0.02, gainPeak: 0.14, release: 0.05 });
}

function sfxAchievement(ctx, bus, opts) {
    audioArp(ctx, bus, [audioNoteFreq(440, 0), audioNoteFreq(440, 4), audioNoteFreq(440, 7), audioNoteFreq(440, 12)], { noteDur: 0.13, gap: 0.08, type: 'triangle', gainPeak: 0.22 });
}

// ---- Combat cues ----

function sfxHitMelee(ctx, bus, opts) {
    audioNoiseBurst(ctx, bus, { filterType: 'lowpass', filterFreq: 350 * audioJitter(0.15), Q: 0.8, duration: 0.09, attack: 0.001, decay: 0.02, gainPeak: 0.22, release: 0.05 });
    audioTone(ctx, bus, { freq: 110 * audioJitter(0.08), type: 'sine', duration: 0.08, attack: 0.001, decay: 0.02, gainPeak: 0.16, release: 0.05 });
}

// opts.element -> per-element timbre.
function sfxHitRanged(ctx, bus, opts) {
    var t = audioElementTone(opts && opts.element);
    audioTone(ctx, bus, { freq: t.freq * audioJitter(0.06), type: t.type, duration: 0.09, attack: 0.001, decay: 0.03, gainPeak: 0.18, release: 0.05 });
    audioNoiseBurst(ctx, bus, { filterType: t.filterType, filterFreq: t.freq * 1.4, Q: 1.5, duration: 0.06, attack: 0.001, decay: 0.015, gainPeak: 0.10, release: 0.03 });
}

function sfxCritAccent(ctx, bus, opts) {
    audioTone(ctx, bus, { freq: 1800 * audioJitter(0.05), type: 'square', duration: 0.05, attack: 0.001, decay: 0.01, gainPeak: 0.14, release: 0.03 });
}

function sfxShieldAbsorb(ctx, bus, opts) {
    audioTone(ctx, bus, { freq: 1100 * audioJitter(0.03), type: 'sine', duration: 0.16, attack: 0.005, decay: 0.05, gainPeak: 0.16, sustain: 0.04, release: 0.1, detune: 8 });
}

function sfxHealChime(ctx, bus, opts) {
    audioTone(ctx, bus, { freq: audioNoteFreq(523.25, 0), type: 'sine', duration: 0.14, attack: 0.01, decay: 0.04, gainPeak: 0.15, release: 0.09 });
    audioTone(ctx, bus, { freq: audioNoteFreq(523.25, 7), type: 'sine', duration: 0.16, startOffset: 0.06, attack: 0.01, decay: 0.04, gainPeak: 0.13, release: 0.11 });
}

// opts.element -> per-element whoosh (bandpass noise sweep + element tone).
function sfxCastWhoosh(ctx, bus, opts) {
    var t = audioElementTone(opts && opts.element);
    audioNoiseBurst(ctx, bus, { filterType: 'bandpass', filterFreq: t.freq * 0.8, Q: 2.5, duration: 0.22, attack: 0.02, decay: 0.08, gainPeak: 0.14, release: 0.12 });
    audioTone(ctx, bus, { freq: t.freq * 0.6, freqEnd: t.freq * 1.6, type: t.type, duration: 0.2, attack: 0.02, decay: 0.06, gainPeak: 0.10, release: 0.12 });
}

function sfxKillHit(ctx, bus, opts) {
    audioNoiseBurst(ctx, bus, { filterType: 'lowpass', filterFreq: 500, Q: 1, duration: 0.14, attack: 0.001, decay: 0.03, gainPeak: 0.24, release: 0.09 });
    audioTone(ctx, bus, { freq: 220, freqEnd: 90, type: 'triangle', duration: 0.16, attack: 0.001, decay: 0.03, gainPeak: 0.16, release: 0.1 });
}

function sfxRampageSting(ctx, bus, opts) {
    audioArp(ctx, bus, [audioNoteFreq(220, 0), audioNoteFreq(220, 3), audioNoteFreq(220, 6)], { noteDur: 0.09, gap: 0.05, type: 'sawtooth', gainPeak: 0.2 });
    audioNoiseBurst(ctx, bus, { filterType: 'highpass', filterFreq: 1800, Q: 1, duration: 0.15, attack: 0.001, decay: 0.03, gainPeak: 0.12, release: 0.08 });
}

function sfxBossTelegraphWarn(ctx, bus, opts) {
    audioTone(ctx, bus, { freq: 700, type: 'square', duration: 0.1, attack: 0.002, decay: 0.02, gainPeak: 0.16, release: 0.04 });
    audioTone(ctx, bus, { freq: 700, type: 'square', duration: 0.1, startOffset: 0.16, attack: 0.002, decay: 0.02, gainPeak: 0.16, release: 0.04 });
}

function sfxDetonation(ctx, bus, opts) {
    audioNoiseBurst(ctx, bus, { filterType: 'lowpass', filterFreq: 700, Q: 0.7, duration: 0.35, attack: 0.001, decay: 0.08, gainPeak: 0.32, release: 0.22 });
    audioTone(ctx, bus, { freq: 70, type: 'sine', duration: 0.4, attack: 0.001, decay: 0.1, gainPeak: 0.24, release: 0.28 });
}

function sfxPhaseTransition(ctx, bus, opts) {
    audioTone(ctx, bus, { freq: 700, freqEnd: 140, type: 'sawtooth', duration: 0.7, attack: 0.02, decay: 0.2, gainPeak: 0.2, sustain: 0.06, release: 0.4 });
    audioNoiseBurst(ctx, bus, { filterType: 'highpass', filterFreq: 2000, Q: 0.8, duration: 0.5, attack: 0.05, decay: 0.15, gainPeak: 0.1, release: 0.3 });
}

function sfxEnrageAlarm(ctx, bus, opts) {
    audioTone(ctx, bus, { freq: 500, freqEnd: 850, type: 'square', duration: 0.14, attack: 0.002, decay: 0.02, gainPeak: 0.2, release: 0.05 });
    audioTone(ctx, bus, { freq: 850, freqEnd: 500, type: 'square', duration: 0.14, startOffset: 0.16, attack: 0.002, decay: 0.02, gainPeak: 0.2, release: 0.05 });
    audioTone(ctx, bus, { freq: 500, freqEnd: 850, type: 'square', duration: 0.14, startOffset: 0.32, attack: 0.002, decay: 0.02, gainPeak: 0.2, release: 0.05 });
}

function sfxWaveStartDrum(ctx, bus, opts) {
    audioNoiseBurst(ctx, bus, { filterType: 'lowpass', filterFreq: 220, Q: 0.9, duration: 0.12, attack: 0.001, decay: 0.03, gainPeak: 0.22, release: 0.07 });
    audioTone(ctx, bus, { freq: 90, type: 'sine', duration: 0.1, attack: 0.001, decay: 0.02, gainPeak: 0.16, release: 0.06 });
}

function sfxVictoryFanfare(ctx, bus, opts) {
    audioArp(ctx, bus, [
        audioNoteFreq(261.63, 0), audioNoteFreq(261.63, 4), audioNoteFreq(261.63, 7),
        audioNoteFreq(261.63, 12), audioNoteFreq(261.63, 16)
    ], { noteDur: 0.16, gap: 0.1, type: 'triangle', gainPeak: 0.24 });
    audioTone(ctx, bus, { freq: audioNoteFreq(261.63, 12), type: 'sawtooth', duration: 0.8, startOffset: 0.5, attack: 0.02, decay: 0.2, gainPeak: 0.18, sustain: 0.08, release: 0.5 });
}

function sfxDefeatSwell(ctx, bus, opts) {
    audioTone(ctx, bus, { freq: 220, freqEnd: 110, type: 'sine', duration: 1.6, attack: 0.15, decay: 0.4, gainPeak: 0.18, sustain: 0.08, release: 1.0, detune: -8 });
    audioTone(ctx, bus, { freq: 165, freqEnd: 82, type: 'triangle', duration: 1.6, startOffset: 0.12, attack: 0.2, decay: 0.4, gainPeak: 0.12, sustain: 0.05, release: 1.0 });
}

var SFX_REGISTRY = {
    uiClick:            { synth: sfxUiClick,            cooldown: SFX_DEFAULT_COOLDOWN },
    screenChange:       { synth: sfxScreenChange,       cooldown: 0.15 },
    toast:              { synth: sfxToast,              cooldown: 0.1 },
    rollCharge:         { synth: sfxRollCharge,         cooldown: 0.5 },
    cardFlip:           { synth: sfxCardFlip,           cooldown: 0.03 },
    rollReveal:         { synth: sfxRollReveal,         cooldown: 0.06 },
    upgradeSuccess:     { synth: sfxUpgradeSuccess,     cooldown: 0.2 },
    itemEquip:          { synth: sfxItemEquip,          cooldown: 0.08 },
    achievement:        { synth: sfxAchievement,        cooldown: 0.3 },
    hitMelee:           { synth: sfxHitMelee,           cooldown: SFX_DEFAULT_COOLDOWN },
    hitRanged:          { synth: sfxHitRanged,          cooldown: SFX_DEFAULT_COOLDOWN },
    critAccent:         { synth: sfxCritAccent,         cooldown: SFX_DEFAULT_COOLDOWN },
    shieldAbsorb:       { synth: sfxShieldAbsorb,        cooldown: 0.06 },
    healChime:          { synth: sfxHealChime,          cooldown: 0.06 },
    castWhoosh:         { synth: sfxCastWhoosh,         cooldown: 0.06 },
    killHit:            { synth: sfxKillHit,            cooldown: 0.05 },
    rampageSting:       { synth: sfxRampageSting,       cooldown: 0.3 },
    bossTelegraphWarn:  { synth: sfxBossTelegraphWarn,  cooldown: 0.2 },
    detonation:         { synth: sfxDetonation,         cooldown: 0.1 },
    phaseTransition:    { synth: sfxPhaseTransition,    cooldown: 0.5 },
    enrageAlarm:        { synth: sfxEnrageAlarm,        cooldown: 1.0 },
    waveStartDrum:      { synth: sfxWaveStartDrum,      cooldown: 0.3 },
    victoryFanfare:     { synth: sfxVictoryFanfare,     cooldown: 1.0 },
    defeatSwell:        { synth: sfxDefeatSwell,        cooldown: 1.0 }
};
var SFX_NAMES = Object.keys(SFX_REGISTRY);

var AUDIO_LAST_PLAYED = {};  // cue name -> ctx.currentTime of last successful play
var AUDIO_VOICES = [];       // [{ endsAt }] -- polyphony bookkeeping, swept lazily

function audioSweepVoices(now) {
    for (var i = AUDIO_VOICES.length - 1; i >= 0; i--) {
        if (AUDIO_VOICES[i].endsAt <= now) AUDIO_VOICES.splice(i, 1);
    }
}

// A cached <audio>/MediaElementSource pool for src-backed cue overrides
// (Task 1's "per-cue replaceability" requirement). Nothing in this repo sets
// .src today (zero downloaded assets) -- this path exists purely so a future
// licensed-audio swap is a one-line registry edit, not a code change.
var AUDIO_SRC_ELEMENTS = {};
function audioPlaySrc(ctx, bus, name, src) {
    if (typeof Audio === 'undefined') return false;
    try {
        var el = AUDIO_SRC_ELEMENTS[src];
        if (!el) {
            el = new Audio(src);
            AUDIO_SRC_ELEMENTS[src] = el;
            if (typeof ctx.createMediaElementSource === 'function') {
                var node = ctx.createMediaElementSource(el);
                node.connect(bus);
            }
        }
        el.currentTime = 0;
        el.play();
        return true;
    } catch (e) {
        return false;
    }
}

var SFX = {
    NAMES: SFX_NAMES,

    // Safe no-op (never throws) when no AudioContext is available. Applies
    // the per-cue cooldown throttle + global polyphony cap, then either
    // plays a registered .src override or calls the cue's synth function.
    play: function(name, opts) {
        var entry = SFX_REGISTRY[name];
        if (!entry) return false;
        var ctx = audioEnsureContext();
        if (!ctx) return false;
        var now = ctx.currentTime;
        var cooldown = entry.cooldown === undefined ? SFX_DEFAULT_COOLDOWN : entry.cooldown;
        if (AUDIO_LAST_PLAYED[name] !== undefined && (now - AUDIO_LAST_PLAYED[name]) < cooldown) return false;
        audioSweepVoices(now);
        if (AUDIO_VOICES.length >= SFX_MAX_CONCURRENT_VOICES) return false;
        AUDIO_LAST_PLAYED[name] = now;
        try {
            if (entry.src) {
                audioPlaySrc(ctx, AUDIO_BUSES.sfx, name, entry.src);
            } else {
                entry.synth(ctx, AUDIO_BUSES.sfx, opts || {});
            }
        } catch (e) {
            if (typeof console !== 'undefined' && console.error) console.error('audio.js: SFX cue "' + name + '" threw', e);
            return false;
        }
        AUDIO_VOICES.push({ endsAt: now + 2.0 }); // conservative fixed voice-lifetime estimate, swept lazily
        return true;
    }
};

// =============================================================================
// MUSIC -- generative ambient system: layered detuned pads through a lowpass
// filter (with a slow LFO-driven amplitude "breathing" swell) + sparse motif
// notes drawn from a per-context scale/root table. 1.5s crossfade between
// contexts. No downloaded loops -- every note/pad is synthesized live from
// the same tone/noise primitives Task 2's SFX cues use.
// =============================================================================

var MUSIC_CONTEXTS = {
    camp:              { root: 220.00, scale: [0, 2, 4, 7, 9],          padType: 'sine',     tempo: 5.5, filterBase: 900  }, // A3 major pentatonic -- warm, unhurried
    'combat-calm':     { root: 196.00, scale: [0, 2, 3, 5, 7, 9, 10],   padType: 'triangle', tempo: 4.0, filterBase: 750 }, // G3 dorian -- alert but relaxed
    'combat-tense':    { root: 233.08, scale: [0, 1, 3, 5, 7, 8, 10],   padType: 'sawtooth', tempo: 2.8, filterBase: 600 }, // Bb3 phrygian -- tighter, edgier
    'combat-dark':     { root: 174.61, scale: [0, 1, 3, 4, 6, 8, 10],   padType: 'sawtooth', tempo: 2.2, filterBase: 420 }, // F3 locrian-ish -- dissonant, heavy
    boss:              { root: 146.83, scale: [0, 1, 4, 5, 7, 8, 11],   padType: 'sawtooth', tempo: 1.8, filterBase: 380 }, // D3 phrygian dominant -- aggressive
    endless:           { root: 196.00, scale: [0, 2, 4, 6, 8, 10],      padType: 'sine',     tempo: 2.0, filterBase: 500 }, // G3 whole-tone -- eerie, directionless
    'results-victory': { root: 261.63, scale: [0, 2, 4, 7, 9, 12],      padType: 'triangle', tempo: 6.0, filterBase: 1300 }, // C4 major -- triumphant
    'results-defeat':  { root: 130.81, scale: [0, 2, 3, 7, 8],          padType: 'sine',     tempo: 3.0, filterBase: 320 }  // C3 minor -- somber, slow
};

var MUSIC_R = {
    generation: 0,
    activeLayers: [], // [{ gain, filter, oscillators: [] }]
    current: null
};

function musicStopLayer(ctx, layer, fadeOutSec) {
    if (!ctx || !layer) return;
    var now = ctx.currentTime;
    try {
        if (typeof layer.gain.gain.cancelScheduledValues === 'function') layer.gain.gain.cancelScheduledValues(now);
        layer.gain.gain.setValueAtTime(layer.gain.gain.value === undefined ? 0.15 : layer.gain.gain.value, now);
        layer.gain.gain.linearRampToValueAtTime(0.0001, now + fadeOutSec);
    } catch (e) {}
    var stopAt = now + fadeOutSec + 0.1;
    for (var i = 0; i < layer.oscillators.length; i++) {
        try { layer.oscillators[i].stop(stopAt); } catch (e) {}
    }
}

function musicBuildPadLayer(ctx, bus, def) {
    var filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = def.filterBase;
    var g = ctx.createGain();
    g.gain.value = 0.0001;
    filt.connect(g);
    g.connect(bus);

    var voiceSpec = [
        { mult: 1, detune: -6 },
        { mult: 1, detune: 0 },
        { mult: 2, detune: 5 } // octave-up shimmer voice
    ];
    var oscs = [];
    for (var i = 0; i < voiceSpec.length; i++) {
        var o = ctx.createOscillator();
        o.type = def.padType;
        o.frequency.value = def.root * voiceSpec[i].mult;
        if (o.detune) o.detune.value = voiceSpec[i].detune;
        o.connect(filt);
        o.start();
        oscs.push(o);
    }

    // Slow amplitude "breathing" LFO modulating the pad's own gain param.
    var lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05 + audioRngNext() * 0.04;
    var lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);
    lfo.start();
    oscs.push(lfo);

    var now = ctx.currentTime;
    if (typeof g.gain.cancelScheduledValues === 'function') g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.15, now + 1.5);

    return { gain: g, filter: filt, oscillators: oscs };
}

// Recursive setTimeout scheduler (never requestAnimationFrame -- RAF fires
// SYNCHRONOUSLY in tests/harness.js's stub, so a self-recursing RAF loop
// would stack-overflow the very first time this ran headlessly; setTimeout's
// stub just returns 0 without ever invoking the callback, which is exactly
// the "safe no-op, never actually schedules anything headlessly" behavior
// this needs). `generation` guards against a superseded context's scheduler
// still firing after MUSIC.set() has already crossfaded to something else.
function musicScheduleMotif(ctx, bus, def, generation) {
    if (MUSIC_R.generation !== generation) return;
    if (audioRngNext() < 0.7) { // "sparse" motif -- not every beat plays a note
        var degIdx = Math.floor(audioRngNext() * def.scale.length);
        var octave = audioRngNext() < 0.5 ? 2 : 3;
        var freq = audioNoteFreq(def.root, def.scale[degIdx] + 12 * octave);
        audioTone(ctx, bus, { freq: freq, type: 'triangle', duration: 1.1, attack: 0.08, decay: 0.3, gainPeak: 0.08, sustain: 0.02, release: 0.7 });
    }
    var nextDelay = def.tempo * (0.6 + audioRngNext() * 0.9);
    setTimeout(function() { musicScheduleMotif(ctx, bus, def, generation); }, nextDelay * 1000);
}

var MUSIC = {
    CONTEXTS: Object.keys(MUSIC_CONTEXTS),

    // Crossfades to `context` over 1.5s. No-op if already the active
    // context. Headless-safe: with no AudioContext available, this just
    // records the intent (MUSIC.current() still reports correctly) without
    // building any audio graph or scheduling anything.
    set: function(context) {
        var def = MUSIC_CONTEXTS[context];
        if (!def) return false;
        if (MUSIC_R.current === context) return true;
        var ctx = audioEnsureContext();
        MUSIC_R.current = context;
        if (!ctx) return true;

        MUSIC_R.generation++;
        var myGen = MUSIC_R.generation;
        var oldLayers = MUSIC_R.activeLayers;
        MUSIC_R.activeLayers = [];
        for (var i = 0; i < oldLayers.length; i++) musicStopLayer(ctx, oldLayers[i], 1.5);

        if (def.src) {
            audioPlaySrc(ctx, AUDIO_BUSES.music, context, def.src);
            return true;
        }

        var layer = musicBuildPadLayer(ctx, AUDIO_BUSES.music, def);
        MUSIC_R.activeLayers.push(layer);
        var firstDelay = def.tempo * (0.3 + audioRngNext() * 0.5);
        setTimeout(function() { musicScheduleMotif(ctx, AUDIO_BUSES.music, def, myGen); }, firstDelay * 1000);
        return true;
    },

    stop: function() {
        var ctx = audioEnsureContext();
        if (ctx) {
            for (var i = 0; i < MUSIC_R.activeLayers.length; i++) musicStopLayer(ctx, MUSIC_R.activeLayers[i], 1.0);
        }
        MUSIC_R.activeLayers = [];
        MUSIC_R.current = null;
        MUSIC_R.generation++;
    },

    current: function() { return MUSIC_R.current; }
};

// =============================================================================
// AUDIO -- public settings/lifecycle API called from UI files (ui-hub.js's
// settings drawer, hub.js's showScreen(), ui-combat.js's combat-start/results
// choke points, endless.js/challenges.js's run-end choke points).
// =============================================================================

var AUDIO = {
    init: function() {
        audioSettings();
        audioEnsureContext();
        audioApplyVolumesToBuses();
    },

    getSettings: function() {
        var s = audioSettings();
        return { masterVolume: s.masterVolume, musicVolume: s.musicVolume, sfxVolume: s.sfxVolume, muted: !!s.muted };
    },

    setVolume: function(bus, value) {
        var s = audioSettings();
        value = Math.max(0, Math.min(1, Number(value)));
        if (isNaN(value)) return;
        if (bus === 'master') s.masterVolume = value;
        else if (bus === 'music') s.musicVolume = value;
        else if (bus === 'sfx') s.sfxVolume = value;
        else return;
        audioApplyVolumesToBuses();
        audioPersistSettings();
    },

    setMuted: function(muted) {
        var s = audioSettings();
        s.muted = !!muted;
        audioApplyVolumesToBuses();
        audioPersistSettings();
    },

    toggleMuted: function() {
        var s = audioSettings();
        AUDIO.setMuted(!s.muted);
    },

    // Called from js/hub.js's showScreen(screenId) -- one line, at the end
    // of the existing function. 'combat' is intentionally skipped: combat
    // music context is region/boss/endless-aware and set explicitly by
    // onCombatStart() below (called from beginCombatScreen(), which itself
    // calls showScreen('combat') first).
    onScreenChange: function(screenId) {
        if (screenId === 'combat') return;
        SFX.play('screenChange', {});
        MUSIC.set('camp');
    },

    // Called from js/ui-combat.js's beginCombatScreen(sd), after
    // showScreen('combat'). Resolves the region-tier/boss/endless music
    // context from the mission that was just set active (js/missions.js's
    // global `activeMission`) -- reads existing globals only, no combat-file
    // edits.
    onCombatStart: function(mission, sd) {
        var ctxName = 'combat-calm';
        if (mission && (mission.isEndless || mission.isChallengeSurvival)) {
            ctxName = 'endless';
        } else if (mission && (mission.boss || mission.stageType === 'boss')) {
            ctxName = 'boss';
        } else {
            var region = mission && mission.region;
            if (!region) {
                // Grind/most challenge missions carry no region -- fall back
                // to a player-level-derived tier so the ambient still tracks
                // rough difficulty instead of always defaulting to "calm".
                var lvl = (sd && sd.player && sd.player.level) || 1;
                region = lvl < 7 ? 2 : (lvl < 14 ? 5 : 7);
            }
            if (region <= 3) ctxName = 'combat-calm';
            else if (region <= 6) ctxName = 'combat-tense';
            else ctxName = 'combat-dark';
        }
        MUSIC.set(ctxName);
    },

    // Called from js/ui-combat.js's showMissionResults(victory, stars) --
    // the single choke point for every story/grind/challenge mission's true
    // end (win-at-last-wave or loss-at-any-wave; endless/survival use
    // onEndlessEnd() below instead since they never call showMissionResults).
    onMissionResults: function(victory, stars) {
        if (victory) {
            MUSIC.set('results-victory');
            SFX.play('victoryFanfare', { stars: stars });
        } else {
            MUSIC.set('results-defeat');
            SFX.play('defeatSwell', {});
        }
    },

    // Called from js/endless.js's finalizeEndlessRun(wasRetreat) and
    // js/challenges.js's finalizeSurvivalChallenge() -- both open-ended
    // "run until you die (or retreat)" modes with no discrete final-wave
    // victory the way story missions have (each floor/wave clear just loops
    // back into more 'endless' ambient, handled already by onCombatStart()/
    // MUSIC.set()'s own same-context no-op). A voluntary retreat isn't a
    // defeat -- only an actual death gets the low swell.
    onEndlessEnd: function(wasRetreat) {
        if (!wasRetreat) {
            MUSIC.set('results-defeat');
            SFX.play('defeatSwell', {});
        }
    }
};

// =============================================================================
// Combat event wiring -- registered once at script-load time via
// combatEvents.onPersistent(), exactly like js/vfx.js's own event wiring
// block (same rationale: initCombat() can emit combatStart/waveStart before
// a per-wave on() listener would have re-registered after reset()). Every
// combat-*.js logic file is untouched by this prompt -- everything below
// only ever READS existing globals (combatEvents payloads, the global
// `combatState`) and calls into SFX/MUSIC.
// =============================================================================

if (typeof combatEvents !== 'undefined' && typeof combatEvents.onPersistent === 'function') {

    // ---- Kill-streak ("rampage") tracking -- reset every wave, using
    // combatState.elapsed (deterministic sim time) rather than wall-clock so
    // this never introduces any real-time nondeterminism. ----
    var AUDIO_KILLSTREAK = { count: 0, lastKillAt: -999 };
    combatEvents.onPersistent('waveStart', function() {
        AUDIO_KILLSTREAK.count = 0;
        AUDIO_KILLSTREAK.lastKillAt = -999;
        SFX.play('waveStartDrum', {});
    });

    // ---- Auto-attacks + on-hit (melee thump / ranged per-element / crit
    // accent / shield absorb) ----
    combatEvents.onPersistent('unitDamaged', function(p) {
        if (!p || !p.target) return;
        if (p.isAutoAttack && p.source) {
            if ((p.source.range || 1) > 1) {
                SFX.play('hitRanged', { element: p.source.element });
            } else {
                SFX.play('hitMelee', {});
            }
        }
        if (p.isCrit) SFX.play('critAccent', {});
        if (p.shieldAbsorbed > 0) SFX.play('shieldAbsorb', {});
    });

    combatEvents.onPersistent('unitHealed', function(p) {
        if (!p || !p.target) return;
        SFX.play('healChime', {});
    });

    // ---- Casts: per-element whoosh ----
    combatEvents.onPersistent('abilityCast', function(p) {
        if (!p || !p.caster) return;
        SFX.play('castWhoosh', { element: p.caster.element });
    });

    // ---- Kills + rampage sting (3+ kills within a short combat-time window) ----
    combatEvents.onPersistent('unitKilled', function(p) {
        if (!p || !p.victim) return;
        SFX.play('killHit', {});
        var now = (typeof combatState !== 'undefined' && combatState) ? combatState.elapsed : 0;
        if (now - AUDIO_KILLSTREAK.lastKillAt < 3.5) AUDIO_KILLSTREAK.count++;
        else AUDIO_KILLSTREAK.count = 1;
        AUDIO_KILLSTREAK.lastKillAt = now;
        if (AUDIO_KILLSTREAK.count === 3) SFX.play('rampageSting', {});
    });

    // ---- Boss telegraphs ----
    combatEvents.onPersistent('bossTelegraphStart', function(p) {
        SFX.play('bossTelegraphWarn', {});
    });
    combatEvents.onPersistent('bossTelegraphDetonate', function(p) {
        SFX.play('detonation', {});
    });

    // ---- Boss phase transitions / enrage: no combatEvents payload publishes
    // these directly (see combat-boss.js's processBossTick()), so this polls
    // the existing global `combatState` inside the 'tick' listener and tags
    // a cosmetic-only marker property onto the boss unit -- the exact
    // pattern js/vfx.js already established with unit.__pixiVis. Reset every
    // wave so a fresh boss instance (or the same boss re-ticking after
    // reset()) is tracked from a clean slate. ----
    combatEvents.onPersistent('tick', function() {
        if (typeof combatState === 'undefined' || !combatState || !combatState.enemyUnits) return;
        var enemies = combatState.enemyUnits;
        for (var i = 0; i < enemies.length; i++) {
            var u = enemies[i];
            if (!u.isBoss) continue;
            if (u.__audioPhaseSeen === undefined) u.__audioPhaseSeen = u.currentPhase;
            if (u.currentPhase !== u.__audioPhaseSeen) {
                u.__audioPhaseSeen = u.currentPhase;
                SFX.play('phaseTransition', {});
            }
            if (u.__audioEnrageSeen === undefined) u.__audioEnrageSeen = false;
            if (u.enraged && !u.__audioEnrageSeen) {
                u.__audioEnrageSeen = true;
                SFX.play('enrageAlarm', {});
            }
        }
    });
}

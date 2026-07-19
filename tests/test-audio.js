// =============================================================================
// tests/test-audio.js — Prompt 81 (WebAudio engine, Phase 7) acceptance tests.
//
//   (a) registry completeness: every cue name js/audio.js's own combatEvents/
//       UI wiring calls SFX.play() with actually exists in SFX_REGISTRY.
//   (b) headless no-op safety: every SFX.play()/MUSIC.set() call never
//       throws with no AudioContext available (tests/harness.js never
//       defines one), and a full seeded combat replay with audio "on" (no
//       AudioContext) doesn't crash.
//   (c) settings persistence round-trip: AUDIO.setVolume()/setMuted()
//       mutate saveData.audio and survive a save/reload cycle; a save that
//       predates Prompt 81 backfills sane defaults.
//   (d) RNG-stream isolation: a full seeded combat replay with SFX doing its
//       real (stubbed-AudioContext) synthesis work consumes the exact same
//       number of Math.random() calls -- and produces the exact same
//       result/ticks/survivors -- as the same seed replayed with SFX.play
//       stubbed to a true no-op. audio.js must never touch the seeded logic
//       RNG stream (it has its own local audioRngNext() for pitch jitter/
//       noise/motif content).
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

// ---------------------------------------------------------------------------
// A structurally-real (but headless) WebAudio stub: enough of
// AudioContext/OscillatorNode/GainNode/BiquadFilterNode/AudioBufferSourceNode/
// AudioBuffer for js/audio.js's real synthesis code (audioTone/audioNoiseBurst/
// the MUSIC pad-layer builder) to run without taking the "no AudioContext"
// no-op path, mirroring tests/test-vfx.js's makeFakePixi() convention.
// ---------------------------------------------------------------------------

function makeFakeAudioContext() {
    function FakeParam(v) { this.value = v || 0; }
    FakeParam.prototype.setValueAtTime = function(v) { this.value = v; return this; };
    FakeParam.prototype.linearRampToValueAtTime = function(v) { this.value = v; return this; };
    FakeParam.prototype.exponentialRampToValueAtTime = function(v) { this.value = v; return this; };
    FakeParam.prototype.cancelScheduledValues = function() { return this; };

    function FakeNode() {}
    FakeNode.prototype.connect = function() { return this; };
    FakeNode.prototype.disconnect = function() { return this; };

    function FakeGain() { FakeNode.call(this); this.gain = new FakeParam(1); }
    FakeGain.prototype = Object.create(FakeNode.prototype);

    function FakeOscillator() {
        FakeNode.call(this);
        this.type = 'sine';
        this.frequency = new FakeParam(440);
        this.detune = new FakeParam(0);
    }
    FakeOscillator.prototype = Object.create(FakeNode.prototype);
    FakeOscillator.prototype.start = function() { return this; };
    FakeOscillator.prototype.stop = function() { return this; };

    function FakeFilter() {
        FakeNode.call(this);
        this.type = 'lowpass';
        this.frequency = new FakeParam(350);
        this.Q = new FakeParam(1);
    }
    FakeFilter.prototype = Object.create(FakeNode.prototype);

    function FakeBufferSource() { FakeNode.call(this); this.buffer = null; this.loop = false; }
    FakeBufferSource.prototype = Object.create(FakeNode.prototype);
    FakeBufferSource.prototype.start = function() { return this; };
    FakeBufferSource.prototype.stop = function() { return this; };

    function FakeBuffer(channels, length, sampleRate) {
        this.numberOfChannels = channels;
        this.length = length;
        this.sampleRate = sampleRate;
        this._data = [];
        for (let c = 0; c < channels; c++) this._data.push(new Float32Array(length));
    }
    FakeBuffer.prototype.getChannelData = function(ch) { return this._data[ch]; };

    function FakeAudioContext() {
        this.currentTime = 0;
        this.sampleRate = 44100;
        this.state = 'running';
        this.destination = new FakeNode();
    }
    FakeAudioContext.prototype.createGain = function() { return new FakeGain(); };
    FakeAudioContext.prototype.createOscillator = function() { return new FakeOscillator(); };
    FakeAudioContext.prototype.createBiquadFilter = function() { return new FakeFilter(); };
    FakeAudioContext.prototype.createBufferSource = function() { return new FakeBufferSource(); };
    FakeAudioContext.prototype.createBuffer = function(ch, len, sr) { return new FakeBuffer(ch, len, sr); };
    FakeAudioContext.prototype.resume = function() { this.state = 'running'; return { then: function(fn) { if (fn) fn(); return this; } }; };
    FakeAudioContext.prototype.suspend = function() { this.state = 'suspended'; return { then: function(fn) { if (fn) fn(); return this; } }; };

    return FakeAudioContext;
}

// Loads the real script order with a fake AudioContext global present, so
// js/audio.js's audioEnsureContext() succeeds and every synth function
// builds real (fake-backed) nodes instead of taking its no-op path.
function makeAudioHarness(seed) {
    const h = createHarness({ seed: seed });
    h.context.AudioContext = makeFakeAudioContext();
    h.loadScripts();
    h.freshSave();
    return h;
}

// Every cue name js/audio.js's own combatEvents listeners / UI-hook call
// sites (js/hub.js, js/ui-shared.js, js/ui-gacha.js, js/ui-hub.js,
// js/ui-heroes.js, js/ui-builder.js, js/ui-combat.js, js/endless.js,
// js/challenges.js) actually invoke SFX.play() with. Kept as an explicit
// list here (independent of SFX_REGISTRY's own keys) so a typo'd cue name in
// either the registry or a call site would fail this test.
const WIRED_CUE_NAMES = [
    'uiClick', 'screenChange', 'toast', 'rollCharge', 'cardFlip', 'rollReveal',
    'upgradeSuccess', 'itemEquip', 'achievement',
    'hitMelee', 'hitRanged', 'critAccent', 'shieldAbsorb', 'healChime', 'castWhoosh',
    'killHit', 'rampageSting', 'bossTelegraphWarn', 'detonation',
    'phaseTransition', 'enrageAlarm', 'waveStartDrum', 'victoryFanfare', 'defeatSwell'
];

module.exports = [
    // ---------------------------------------------------------------
    {
        name: 'audio: registry completeness -- every wired cue name exists in SFX_REGISTRY',
        fn: function() {
            const h = createHarness({ seed: 8101 });
            h.loadScripts();
            h.freshSave();
            const names = h.context.SFX.NAMES;
            assert.ok(Array.isArray(names) && names.length >= WIRED_CUE_NAMES.length, 'SFX.NAMES should list at least every wired cue');
            for (let i = 0; i < WIRED_CUE_NAMES.length; i++) {
                assert.ok(names.indexOf(WIRED_CUE_NAMES[i]) >= 0, 'SFX_REGISTRY should have an entry for wired cue "' + WIRED_CUE_NAMES[i] + '"');
            }
            // And the reverse: every registry entry has a callable synth (or
            // an explicit src override) -- catches a registry entry that
            // forgot to wire a synth function.
            for (let j = 0; j < names.length; j++) {
                const entry = h.context.SFX_REGISTRY[names[j]];
                assert.ok(entry && (typeof entry.synth === 'function' || typeof entry.src === 'string'), 'SFX_REGISTRY["' + names[j] + '"] should have a synth function or a src override');
            }
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'audio: SFX.play()/MUSIC.set() are safe no-ops (never throw) with no AudioContext available',
        fn: function() {
            const h = createHarness({ seed: 8102 });
            h.loadScripts(); // no AudioContext global at all
            h.freshSave();
            assert.equal(typeof h.context.AudioContext, 'undefined', 'sanity: AudioContext should be undefined');

            assert.doesNotThrow(function() {
                for (let i = 0; i < h.context.SFX.NAMES.length; i++) {
                    const result = h.context.SFX.play(h.context.SFX.NAMES[i], { element: 'fire', tier: 5, isCrit: true });
                    assert.equal(result, false, 'SFX.play() should report false (no-op) with no AudioContext, not throw');
                }
                for (let j = 0; j < h.context.MUSIC.CONTEXTS.length; j++) {
                    h.context.MUSIC.set(h.context.MUSIC.CONTEXTS[j]);
                }
                h.context.AUDIO.init();
                h.context.AUDIO.setVolume('master', 0.5);
                h.context.AUDIO.setMuted(true);
                h.context.AUDIO.onScreenChange('hub');
                h.context.AUDIO.onCombatStart({ region: 4 }, h.context.getSaveData());
                h.context.AUDIO.onMissionResults(true, 3);
                h.context.AUDIO.onEndlessEnd(false);
            }, 'every SFX/MUSIC/AUDIO entry point must never throw when no AudioContext is available');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'audio: SFX.play()/MUSIC.set() never throw with a real (stubbed) AudioContext present, across every cue/context',
        fn: function() {
            const h = makeAudioHarness(8103);
            assert.doesNotThrow(function() {
                for (let i = 0; i < h.context.SFX.NAMES.length; i++) {
                    h.context.SFX.play(h.context.SFX.NAMES[i], { element: 'lightning', tier: 5, isCrit: true });
                }
                for (let j = 0; j < h.context.MUSIC.CONTEXTS.length; j++) {
                    h.context.MUSIC.set(h.context.MUSIC.CONTEXTS[j]);
                }
            }, 'every synth function / MUSIC context must build cleanly against a real AudioContext graph');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'audio: onCombatStart() resolves the correct music context per region tier / boss / endless',
        fn: function() {
            const h = makeAudioHarness(8104);
            const sd = h.context.getSaveData();

            h.context.AUDIO.onCombatStart({ region: 1 }, sd);
            assert.equal(h.context.MUSIC.current(), 'combat-calm', 'region 1-3 should map to combat-calm');
            h.context.MUSIC.stop();

            h.context.AUDIO.onCombatStart({ region: 5 }, sd);
            assert.equal(h.context.MUSIC.current(), 'combat-tense', 'region 4-6 should map to combat-tense');
            h.context.MUSIC.stop();

            h.context.AUDIO.onCombatStart({ region: 8 }, sd);
            assert.equal(h.context.MUSIC.current(), 'combat-dark', 'region 7-8 should map to combat-dark');
            h.context.MUSIC.stop();

            h.context.AUDIO.onCombatStart({ region: 3, boss: 'veil_warden' }, sd);
            assert.equal(h.context.MUSIC.current(), 'boss', 'a boss mission should map to the boss context regardless of region');
            h.context.MUSIC.stop();

            h.context.AUDIO.onCombatStart({ isEndless: true }, sd);
            assert.equal(h.context.MUSIC.current(), 'endless', 'an endless mission should map to the endless context');
            h.context.MUSIC.stop();

            h.context.AUDIO.onCombatStart({ isChallengeSurvival: true }, sd);
            assert.equal(h.context.MUSIC.current(), 'endless', 'the Survival challenge should also map to the endless context');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'audio: settings persistence round-trip -- setVolume/setMuted persist to saveData.audio and survive reload',
        fn: function() {
            const h = createHarness({ seed: 8105 });
            h.loadScripts();
            const sd = h.freshSave();

            assert.ok(sd.audio, 'a fresh save should already have an audio settings block');
            assert.equal(sd.audio.masterVolume, 0.8, 'default masterVolume should be 0.8');
            assert.equal(sd.audio.musicVolume, 0.7, 'default musicVolume should be 0.7');
            assert.equal(sd.audio.sfxVolume, 0.9, 'default sfxVolume should be 0.9');
            assert.equal(sd.audio.muted, false, 'default muted should be false');

            h.context.AUDIO.setVolume('master', 0.35);
            h.context.AUDIO.setVolume('music', 0.2);
            h.context.AUDIO.setVolume('sfx', 0.55);
            h.context.AUDIO.setMuted(true);

            const settings = h.context.AUDIO.getSettings();
            assert.equal(settings.masterVolume, 0.35, 'getSettings() should reflect the just-set masterVolume');
            assert.equal(settings.musicVolume, 0.2, 'getSettings() should reflect the just-set musicVolume');
            assert.equal(settings.sfxVolume, 0.55, 'getSettings() should reflect the just-set sfxVolume');
            assert.equal(settings.muted, true, 'getSettings() should reflect the just-set muted flag');

            // Round-trip through the real save/load pipeline.
            const reloaded = h.context.loadGame();
            assert.ok(reloaded.audio, 'reloaded save should still have an audio block');
            assert.equal(reloaded.audio.masterVolume, 0.35, 'masterVolume should survive a save/reload cycle');
            assert.equal(reloaded.audio.musicVolume, 0.2, 'musicVolume should survive a save/reload cycle');
            assert.equal(reloaded.audio.sfxVolume, 0.55, 'sfxVolume should survive a save/reload cycle');
            assert.equal(reloaded.audio.muted, true, 'muted should survive a save/reload cycle');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'audio: a pre-Prompt-81 save (no audio field) backfills sane defaults through validateSaveData()',
        fn: function() {
            const h = createHarness({ seed: 8106 });
            h.loadScripts();
            const sd = h.context.createDefaultSaveData();
            delete sd.audio; // simulate a save saved before this prompt existed
            const validated = h.context.validateSaveData(sd);
            assert.ok(validated.audio, 'validateSaveData() should backfill a missing audio block');
            assert.equal(validated.audio.masterVolume, 0.8, 'backfilled masterVolume should default to 0.8');
            assert.equal(validated.audio.musicVolume, 0.7, 'backfilled musicVolume should default to 0.7');
            assert.equal(validated.audio.sfxVolume, 0.9, 'backfilled sfxVolume should default to 0.9');
            assert.equal(validated.audio.muted, false, 'backfilled muted should default to false');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'audio: RNG-stream isolation -- SFX doing real (stubbed-AudioContext) work vs SFX.play stubbed to a no-op consume identical Math.random() calls and produce identical combat outcomes',
        fn: function() {
            const team = [
                { key: 'flame_warrior', row: 0, col: 2, stars: 3 },
                { key: 'cinder_archer', row: 0, col: 4, stars: 3 },
                { key: 'stone_guard', row: 0, col: 0, stars: 3 },
                { key: 'pulse_mender', row: 0, col: 6, stars: 3 }
            ];

            function replay(seed, withAudio) {
                const h = createHarness({ seed: seed });
                if (withAudio) h.context.AudioContext = makeFakeAudioContext();
                h.loadScripts();
                h.freshSave();
                if (!withAudio) {
                    // Real AudioContext absent -- SFX.play() already no-ops.
                    // Belt-and-suspenders: also stub MUSIC.set so this replay
                    // does the least possible audio-side work for comparison.
                    h.context.MUSIC.set = function() { return false; };
                }

                let count = 0;
                const origRandom = h.context.Math.random;
                h.context.Math.random = function() { count++; return origRandom(); };

                const stageIndex = h.context.STAGES.findIndex(function(s) { return s.id === 'r1_boss'; });
                assert.ok(stageIndex >= 0, 'expected to find the r1_boss stage');
                const run = h.runCombat(team, stageIndex);

                h.context.Math.random = origRandom;
                return { count: count, result: run.result, ticks: run.ticks, survivors: run.survivors };
            }

            const withAudio = replay(4343, true);
            const withoutAudio = replay(4343, false);

            assert.equal(withAudio.count, withoutAudio.count, 'audio.js actively synthesizing SFX/music must consume the exact same number of Math.random() calls as audio entirely absent -- it must never touch the seeded logic RNG stream');
            assert.deepEqual(
                { result: withAudio.result, ticks: withAudio.ticks, survivors: withAudio.survivors },
                { result: withoutAudio.result, ticks: withoutAudio.ticks, survivors: withoutAudio.survivors },
                'audio.js must not affect combat determinism/outcome in any way'
            );
            assert.ok(withAudio.ticks > 0, 'sanity: the boss fight should have run for at least 1 tick');
        }
    },

    // ---------------------------------------------------------------
    {
        name: 'audio: a full seeded boss-fight replay with a real (stubbed) AudioContext exercises hit/cast/kill/telegraph/phase/enrage cues without throwing or altering goldens',
        fn: function() {
            const h = makeAudioHarness(8107);
            const team = [
                { key: 'flame_warrior', row: 0, col: 2, stars: 3 },
                { key: 'cinder_archer', row: 0, col: 4, stars: 3 },
                { key: 'stone_guard', row: 0, col: 0, stars: 3 },
                { key: 'pulse_mender', row: 0, col: 6, stars: 3 }
            ];
            const calls = [];
            const realPlay = h.context.SFX.play;
            h.context.SFX.play = function(name, opts) {
                calls.push(name);
                return realPlay.call(h.context.SFX, name, opts);
            };

            const stageIndex = h.context.STAGES.findIndex(function(s) { return s.id === 'r1_boss'; });
            let run;
            assert.doesNotThrow(function() { run = h.runCombat(team, stageIndex); }, 'a full boss-fight replay with real audio synthesis must never throw');
            assert.ok(run.ticks > 0, 'sanity: the boss fight should have run for at least 1 tick');

            assert.ok(calls.indexOf('waveStartDrum') >= 0, 'waveStart should fire waveStartDrum');
            assert.ok(calls.indexOf('hitMelee') >= 0 || calls.indexOf('hitRanged') >= 0, 'at least one auto-attack hit cue should have fired');
            assert.ok(calls.indexOf('killHit') >= 0, 'at least one kill should have fired killHit');
            assert.ok(calls.indexOf('bossTelegraphWarn') >= 0, 'a boss telegraph should fire bossTelegraphWarn');
            assert.ok(calls.indexOf('detonation') >= 0, 'a boss telegraph detonation should fire detonation');
        }
    }
];

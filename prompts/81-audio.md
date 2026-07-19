# Prompt 81 — Phase 7: Audio (Synthesized — Zero External Assets)

**Branch**: `feature/phase7-audio` (create from `main`)
**Read first**: `CLAUDE.md`, MASTERPLAN § Phase 7, `js/combat-events.js`, `js/vfx.js` (event
wiring precedent), `js/ui-shared.js`.

## Design constraint

NO downloaded assets and NO third-party audio libraries — everything is WebAudio, synthesized in
code. (Licensed music/SFX may replace individual cues later; the registry must make per-cue
replacement trivial: if a cue has an `src`, play the file; else call its synth function.)

## Task 1 — Engine (`js/audio.js`, NEW)

- Singleton on WebAudio: master → music + sfx gain buses; settings (master/music/sfx volume,
  mute) persisted via the save.js backfill convention; unlock-on-first-gesture handling
  (browsers block AudioContext until user input); safe no-op headlessly (no AudioContext in the
  harness).
- `SFX.play(name, opts)` registry: each cue is a small synth function (oscillators, noise
  buffers, envelopes, filters) rendered live; per-cue cooldown throttle (default 40ms) and a
  max-concurrent cap so 4× combat doesn't become white noise; pitch jitter from a LOCAL PRNG.
- `MUSIC.set(context)` generative ambient system: layered slow pads + sparse motif notes from a
  per-context scale/root table — contexts: camp, combat (per region tier: calm/tense/dark),
  boss, endless, results-victory, results-defeat. Crossfade 1.5s between contexts. Deterministic
  seeds not required (music is outside combat logic) but use the local PRNG anyway.

## Task 2 — Cue set + wiring

- UI (ui files: minimal one-line hooks, or event-driven where events exist): button click, screen
  change, toast, roll ceremony (charge riser, card flip tick, tier-scaled reveal sting — T5 gets
  a big one), upgrade success, item equip, achievement.
- Combat (via combatEvents only — no combat-file edits): melee hit (thump), ranged hit per
  element family (5-6 variants), crit accent, shield absorb, heal chime, ability cast whoosh per
  element, kill hit + rampage sting, boss telegraph warning, detonation, phase transition sting,
  enrage alarm, wave start drum, victory fanfare motif, defeat low swell.
- MUSIC.set called from screen transitions + combat start (region-aware) + boss/endless/results.

## Task 3 — Settings UI

Volume sliders (master/music/sfx) + mute in the existing settings drawer (ui-hub.js), styled on
the design system. Persisted.

## Task 4 — Tests + verify

- `tests/test-audio.js`: registry completeness (every wired cue name exists), headless no-op
  safety (all plays no-throw without AudioContext), settings persistence round-trip, combat with
  audio "enabled" (stub context) leaves goldens/RNG untouched (isolation test like VFX's).
- Suite green twice; goldens byte-identical.
- Browser (port 8125): after one click, camp ambient plays; roll ceremony sounds; a fight has
  hits/casts/kills audible and distinct at 1× and not a wall of noise at 4×; boss fight triggers
  telegraph/phase/enrage cues; victory fanfare; settings sliders work and persist. Report a
  subjective pass on each.

Commit as "Prompt 81: WebAudio engine, synthesized SFX + generative ambient music". Push.
Do not merge.

# Prompt 76 — Phase 4.4 (remainder) + 4.5: Status Polish + Combat Juice

**Branch**: `feature/phase4-juice` (create from `main`)
**Read first**: `CLAUDE.md`, `MASTERPLAN.md` § Phase 4, `js/vfx.js`, `js/vfx-abilities.js`,
`js/render-pixi.js`, `js/ui-combat.js`.
**File scope**: `js/vfx.js`, `js/vfx-abilities.js`, `js/render-pixi.js`, `js/ui-combat.js`,
`game-v2.html` (CSS), tests. Do NOT touch `js/combat-passives.js`, `js/combat-damage.js`,
`js/combat-abilities.js` beyond event-DATA — a parallel worker owns those. If you need a new
event, coordinate: emit sites in files you don't own are OFF LIMITS this round; derive from
existing events instead.

## Task 1 — Status visual upgrade (4.4 remainder)

Replace the emoji mini-icons above units with animated overlays ON the token: frozen = ice-block
tint + crystals, stunned = orbiting stars, burning = looping ember rise, rooted = vine wrap arcs,
silenced = crossed-out glyph pulse, poisoned/bleeding = dripping ticks. Driven by unit status
state each frame (render-side only). Keep the +N overflow condensed marker.

## Task 2 — Boss phase & enrage presentation (4.4 remainder)

Phase transitions: brief invulnerability shimmer + phase-name banner sweep + a camera-level punch
(see Task 3). Enrage: persistent red rim-glow on the boss token + pulsing HUD timer in the last 10s.

## Task 3 — Juice (4.5)

- **Hit-stop**: 40-60ms render-frame freeze on kills and crits above a damage threshold (render
  loop pause only — the logic tick must be COMPLETELY unaffected; implement in the render loop,
  never touch COMBAT_TICK).
- **Screen shake**: small stage-container shake on big hits/boss slams/detonations (amplitude by
  damage tier, `// TUNABLE`), respecting a hard cap and decaying quickly.
- **Wave banners**: "Wave N" sweep-in/out; boss waves get a distinct heavier banner.
- **Victory/defeat sequences**: victory = slow-mo last kill (render-side interpolation slowdown
  ~0.4× for 1s), gold burst over survivors, then results; defeat = desaturation fade before results.
- **Kill streaks**: 3+ kills within 2s by one unit → small "RAMPAGE" flourish over that unit.
- All effects: COMBAT_SPEED-aware, cosmetic-PRNG only, degrade under the particle cap.

## Task 4 — Tests + verify

- Extend `tests/test-vfx.js`: hit-stop never alters logic tick progression under seed (golden
  determinism run with juice enabled vs disabled — identical outcomes/ticks); shake/status overlay
  functions exist and no-op headlessly; RNG isolation still holds.
- Suite green twice; goldens byte-identical.
- Browser (port 8124): fight a boss to phase transition and enrage; verify status overlays on a
  CC-heavy fight; victory sequence plays; CPU-cost measurement as before (report ms/frame at 4×).

Report: what each juice effect looks like (brief), TUNABLEs, perf, RNG/determinism proof.

Commit as "Prompt 76: status overlays, boss presentation, combat juice". Push. Do not merge.

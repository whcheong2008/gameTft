# CLAUDE.md — Worker Conventions (Shattered Veil)

You are implementing one task of MASTERPLAN.md. Your spec is a `prompts/NN-*.md` file. Read it fully
before touching code. Do exactly what it says — nothing more. Out-of-scope improvements get reported,
not implemented.

## Code Rules (non-negotiable)

- **Plain script-tag JS**: all `var`, global scope, NO ES modules, NO `import`/`export`, no build tools.
- New files must be added to the `<script>` load order in `game-v2.html` (data before logic, logic before UI).
- Match surrounding code style. No frameworks, no npm dependencies unless the spec vendors a library.
- Save-format changes ONLY when the spec says so, always with a version bump + migration in `js/save.js`
  (current save version: 12).
- Never edit design docs (`*-DESIGN.md`, `MASTERPLAN.md`, `SCOPE.md`) unless the spec says so.
- **Never touch `Unity/`** — the Unity port is parked; it is not part of the build.

## Git Rules

- Work on the branch named in your spec (`feature/`, `fix/`, `polish/`, `balance/`).
- Never merge to `main` — the orchestrator does that after review.
- Commit in coherent chunks: "Prompt <NN>: <short description>".

## Source of Truth

| Topic | Document |
|---|---|
| Roadmap / current phase / locked decisions | MASTERPLAN.md |
| Implementation status | CONTINUITY.md |
| Testable values & formulas | GROUND-TRUTH.md |
| Combat rules | COMBAT-DESIGN.md (+ TEMPLATE-V2-HANDOFF.md, HEALER-FIX-HANDOFF.md) |
| Units / abilities | UNITS-DESIGN.md, ABILITY-REVISION.md, T4-EXPANSION.md |
| Heroes | HERO-REWORK.md, HERO-SYSTEM-DESIGN.md |
| Items | ITEMS-REDESIGN.md (Diablo-style rework — supersedes ITEMS-DESIGN.md) |
| Regions / stages / bosses | MISSIONS-DESIGN.md, STORY-STAGES-V2.md |
| Progression / economy | PROGRESSION-REWORK.md (supersedes PROGRESSION-DESIGN.md) |
| Art style / asset specs | GRAPHICS-PLAN.md, GRAPHICS-SESSION-HANDOFF.md |
| Known bugs | BUGS.md |

Where docs conflict: newer rework docs beat originals; **the code is the truth for what exists**;
MASTERPLAN.md beats everything for direction.

## Verification (before you report done)

1. `node tests/run.js` passes (once the harness exists, Phase 1+).
2. Open `game-v2.html` in a browser — zero console errors on load.
3. Exercise the specific flow you changed (your spec lists the steps).
4. Report honestly: what works, what you couldn't verify, anything surprising you found.

## Current Architecture (HTML game — the live product)

- `game-v2.html` — shell + CSS + script load order. (`game.html` is dead V1.)
- `js/units-core.js` / `units-templates.js` / `units-abilities.js` / `units-bonds.js` /
  `units-ascension.js` — unit data layer (66 base + 66 evolved)
- `js/ability-templates.js` — ability template classification + v2 per-unit functions
- `js/heroes.js` — 6 heroes, skill trees, availability
- `js/save.js` — localStorage persistence, migrations (v12), collection/team helpers
- `js/gacha.js`, `js/teams.js`, `js/hub.js`, `js/items.js` — systems
- `js/missions.js` — 8 regions, 74 stages, wave generation, rewards
- `js/ui-v2.js` — screen renderers (being split in Phase 0.2)
- `js/main-v2.js` — entry + combat engine (being split in Phase 0.2)
- `js/unit-simulator.js`, `simulator.html`, `test-combat.js`, `combat-benchmark.js`, `benchmark.html`
  — existing test/sim infrastructure (Phase 1 builds on these)

Combat state is ephemeral (never saved). Grid: 8 rows × 7 cols; rows 0–3 enemy, 4–7 player;
team builder row `r` maps to combat row `7 - r`. (Hex migration comes in Phase 3 — until then,
square-grid logic stands.)

# MASTERPLAN — Shattered Veil: Path to TFT-Grade Presentation

> The single authoritative roadmap from the current state to the end goal: a browser-based
> auto-battler with **Teamfight Tactics-level presentation**. Supersedes the phase lists in
> SCOPE.md, CONTINUITY.md, and UNITY-MIGRATION-PLAN.md where they conflict.
> Written 2026-07-18 after full project review. Built by worker agents under orchestrator supervision.

## Where We Actually Are

- **HTML game (`game-v2.html`) is core-complete and working**: 66 base + 66 evolved units with
  per-unit unique abilities (v2), 74 stages across 8 regions, 8 bosses, 6 heroes with skill trees,
  Diablo-style items + enhancement + gems, story/dialogue docs, 131 playtest stat adjustments,
  save v12. Verified loading clean 2026-07-18. **Not fully content-complete** — the 2026-07-18 code
  audit (PHASE2-AUDIT.md) found endless mode, challenge modes, in-game lore, and encounter mechanics
  absent, and hero skill trees mostly inert; Phase 2 closes these.
- **Unity port (`Unity/ShatteredVeil/`) is PARKED** — not deleted. Tracks A–D complete (209 C# files,
  all scenes with placeholders, asset pipeline). It stalled on editor/UI wiring pain, and Unity is not
  installed on the current dev machine, so nothing can be verified there. It remains the future mobile
  option; `GROUND-TRUTH.md` and the Track D asset manifest stay useful. **No new Unity work in this plan.**
- **Graphics**: this machine is the art PC (RTX 5080, ComfyUI at `D:\ComfyUI`). Style is locked
  ("Painterly Fantasy 2D", GRAPHICS-PLAN.md); anchor generation (G1) was in progress — fire Echo
  keepers already curated in `graphics/`.
- **Why the previous run stalled**: Unity editor friction + an art pipeline scoped around LoRA
  style-training. This plan removes both.

## End Goal Definition

A shippable single-player web game where a spectator watching combat says "this looks like TFT":

- **Angled hex arena** with per-region themed backgrounds, TFT-style camera perspective
- **Animated units**: idle / walk / attack / cast / death for every deployed unit
- **Combat spectacle**: projectiles, element-themed ability VFX, status visuals, boss telegraphs,
  floating damage numbers, health/mana bars that chunk
- **TFT-grade UI**: polished hub, gacha ceremony, drag-and-drop team builder on the arena
- **Audio**: contextual music + full SFX coverage
- **Shipped**: static hosting + PWA, 60fps on a mid-range laptop

## Locked Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Platform | **Web** (Unity parked for future mobile) | User decision 2026-07-18. Full verification loop exists here; Unity has none on this machine. |
| Renderer | **PixiJS v8**, vendored, script-tag loaded | WebGL batching + particles; fits the no-build-tool pattern. Combat board only — menu screens stay styled HTML/CSS. |
| Board | **Hex grid**, migrated in Phase 3 | TFT's visual signature. Risk: invalidates some playtested balance → simulator re-run is a gate. Fallback if hex plays badly: angled-isometric square. |
| Animation | **Pre-baked spritesheets from 6 shared rigs** (one per unit type) | 6 rigs × 5 anims, 132 unit *skins* as static art. Kills the per-unit animation explosion. |
| Art pipeline | ComfyUI batch generation per GRAPHICS-PLAN.md style bible; **no LoRA training** | Consistency from locked prompts + shared rigs + UI framing. Orchestrator drives ComfyUI via local API. |
| Evolved / Voidspawn | Evolved = tint+aura variants. Voidspawn keep independent designs (portraits), share rig skeletons by type | Preserves GRAPHICS-PLAN philosophy at sane cost. |
| Audio | Howler.js, vendored | Simple, no build step. |
| Code pattern | Plain `<script>` tags, global scope, `var` — unchanged | Proven across 57 worker prompts. |
| Logic/render split | Combat logic emits state + events; renderer consumes | Enables DOM→Pixi swap without touching rules; keeps headless testing possible. |
| Fallback chain | emoji → portrait chip → animated skin | Game stays shippable at every point of the art pipeline. |
| Assets in git | Final optimized assets (webp/atlases) in `assets/`; raw ComfyUI output stays in gitignored `graphics/` | Repo stays clonable. |

## Phase Overview

```
Phase 0  Foundation      file splits, worker conventions, repo hygiene          (small)
Phase 1  Test Harness    headless tests + CI on existing sim infrastructure     (small-medium)
Phase 2  Logic Closure   hero skill effects, gap audit, endless/challenges      (medium)
Phase 3  Renderer        Pixi combat layer, arena camera, hex migration         (large)
Phase 4  Spectacle       VFX framework, projectiles, ability/status/boss visuals (large)
Phase 5  Art Production  portraits + 6 rigs + 132 skins via ComfyUI pipeline    (large, parallel w/ 4)
Phase 6  UI Overhaul     design system, hub, gacha ceremony, HUD                (medium)
Phase 7  Audio           SFX + music                                            (small)
Phase 8  Ship            performance, onboarding, deploy, final balance         (medium)
```

Phases sequential except Phase 5, which runs parallel to 3–4 (art doesn't block code).
Tasks within a phase parallelize when they don't share files.
**Worker prompts continue the repo convention: `prompts/NN-*.md`, numbering from 58.**

---

## Phase 0 — Foundation

- **0.1 Masterplan docs** (orchestrator): this file + CLAUDE.md committed; CONTINUITY.md points here.
- **0.2 Monolith split**: `main-v2.js` (307KB) and `ui-v2.js` (233KB) → system-sized files
  (combat-core, combat-abilities, combat-status, combat-boss, combat-render, ui-hub, ui-gacha,
  ui-roster, ui-builder, ui-missions, ui-combat, ui-forge, ui-heroes…). Pure motion, no logic changes,
  update script load order. Target: no file over ~80KB.
- **0.3 Repo hygiene**: delete dead V1 files (combat.js, enemies.js, economy.js, shop.js, board.js,
  synergies.js, ui.js, main.js, game.html) — git history preserves them; gitignore `graphics/`.

**Done when**: game plays identically; CI-less smoke test passes. Tag `v0.6.0-foundation`.

## Phase 1 — Test Harness

Build on what exists (`test-combat.js`, `unit-simulator.js`, `simulator.html`, `combat-benchmark.js`).

- **1.1 Headless Node runner**: browser shims (localStorage, no-op DOM), loads scripts in order,
  `node tests/run.js`, zero npm dependencies.
- **1.2 Seedable RNG**: central `rng()` in logic paths; golden-file combat scenarios.
- **1.3 Core tests**: save migration chain (→v12), gacha distribution + pity, star-up (tiered copies),
  item generation/enhancement, synergy thresholds, economy invariants.
- **1.4 Balance simulator CLI**: headless wrapper around unit-simulator to auto-play content and
  report clear rates / income curves per stage.
- **1.5 GitHub Actions CI** on push.

**Done when**: CI green on main; combat reproducible under seed. This is the safety net that makes
weak-model development scale.

## Phase 2 — Logic Closure

Close the gaps between the code and what the design promises. ~~2.1 Gap audit~~ **DONE 2026-07-18 —
see PHASE2-AUDIT.md** (findings: endless/challenges/lore/encounter-mechanics absent; hero skills ~90%
inert; region rewards drop payouts; 7 achievements unobtainable. Daily quests stay removed and
ascension stays deferred — deliberate design decisions, not gaps.)

- **2.2 Combat event hooks + hero skill effects**: add the combat event framework (onAllyBelowHp,
  onAllyCCd, onLastSurvivor, …) that the 84 placeholder nodes need; implement all 108 nodes; delete
  the never-read `heroSkillBonuses` flag path or make combat consume it.
- **2.3 Encounter mechanics**: wire all 6 (`encounterMechanic` currently has zero consumers).
- **2.4 Region reward payouts**: `claimRegionReward` must pay `randomUnit` / `essenceChoice` /
  `mythicMaterialChoice`; fix stale building names in descriptions (no building unlocks — buildings
  stay VE/level-gated per current design).
- **2.5 Achievement pipeline**: wire `trackStat` call sites (boss kills, deathless clears, max hit,
  fastest win, element synergy, bonds used, forge ops) so all 24 achievements are obtainable.
- **2.6 Endless mode** (The Abyss): floors, modifiers, personal best.
- **2.7 Challenge modes**: Time Trial / Survival / Restricted Roster + the 4 orphaned element bosses
  (missions.js:1541–1658) as challenge fights.
- **2.8 Lore delivery**: codex screen, unit lore cards, bond stories, boss pre/post dialogue
  (content exists in STORY-*.md docs — this is a rendering + data-registration task).
- **2.9 Cleanups**: delete dead `js/ability-templates.js`; unify bond detection on `detectActiveBonds`;
  reconcile CONTINUITY.md claims with code.
- **2.10 Balance verification**: simulator run over all 74 stages; fix walls.

**Done when**: every designed system exists in code, tests green. Tag `v0.7.0-logic-complete`.

## Phase 3 — Renderer

- **3.1 Renderer abstraction**: combat logic emits state snapshots + event stream (spawn, move,
  attack, cast, damage, status, death); DOM renderer refactored behind the interface; logic loses
  all direct DOM access.
- **3.2 Pixi bootstrap**: vendored PixiJS, canvas layer, atlas loader, `?renderer=pixi|dom` toggle.
- **3.3 Hex migration**: axial coords, neighbors/BFS, range + AoE shapes remapped, team builder
  placement, golden tests deliberately re-based, simulator re-run gate (balance must stay sane).
- **3.4 Arena presentation**: angled camera projection, hex tiles, region backgrounds, interpolated
  movement, z-sorting, health/mana bars, floating text, hover inspection.
- **3.5 Team builder on the arena**: drag-and-drop on the angled hex board, bench strip, synergy sidebar.

**Done when**: full mission playable in Pixi at 60fps with placeholder sprites; DOM combat renderer
deleted. Tag `v0.8.0-arena`.

## Phase 4 — Spectacle

- **4.1 VFX framework**: particle system + data-driven registry mapping 132 abilities onto ~20
  composable primitives (projectile, beam, nova, chain, ground-decal, aura, impact), element-themed.
- **4.2 Projectiles + on-hit**: ranged travel time + impacts, melee swing flashes.
- **4.3 Ability VFX coverage**: all abilities mapped (batched ~30/task).
- **4.4 Status + boss visuals**: animated CC overlays, boss telegraph decals (1.5–2s warnings per
  design), phase transitions, enrage indicator.
- **4.5 Juice**: hit-stop, screen shake, wave banners, victory/defeat sequences.

**Done when**: a boss fight at 1× is readable and exciting to watch. Tag `v0.9.0-spectacle`.

## Phase 5 — Art Production (parallel with 3–4)

Orchestrator drives ComfyUI (local API, RTX 5080) using GRAPHICS-PLAN.md's locked style + prompts.
User curates keepers (taste gate). No LoRA training.

- **5.1 Finish anchors (G1)**: **HYBRID ART DIRECTION (user decision 2026-07-19)** — abstract
  elemental forms for T1-T2 Echoes (36 units; matches the curated fire keepers), painterly humanoid
  characters for T3-T5 Echoes + the 6 heroes. Lore framing: lesser Echoes are raw element; greater
  Echoes take form. Anchors needed per element: 1 abstract + 1 humanoid (fire abstract keepers
  exist). Voidspawn stay biological-alien per GRAPHICS-PLAN. Style bible: exact prompts + seeds
  recorded per keeper. Pipeline driver: `scripts/comfy-gen.js` (ComfyUI API, port 8188 —
  launch note: strip AVG's SSLKEYLOGFILE env var, see memory/START-COMFYUI.bat).
- **5.2 Portraits**: 132 Echo + 6 heroes + 8 bosses (Voidspawn portraits deferred until needed by UI).
- **5.3 Six type rigs**: Warrior/Tank/Archer/Mage/Assassin/Healer — idle/walk/attack/cast/death
  spritesheets. The only animated assets in the game.
- **5.4 Skin batches**: 132 Echo skins on their type rigs (batched by element×type); Voidspawn combat
  sprites via shared rigs + their portrait designs; evolved = tint+aura.
- **5.5 Environments**: 8 region arena backgrounds + camp.
- **5.6 Integration**: atlas packing, fallback chain live, `assets/` folder + manifest (adapt Track D's
  258-asset manifest from the Unity work).

**Done when**: full teams of distinct animated units fight in themed arenas; anything unfinished
falls back gracefully. Tag `v0.10.0-art`.

## Phase 6 — UI Overhaul

- **6.1 Design system**: palette (element colors are canonical in GRAPHICS-SESSION-HANDOFF.md),
  typography, panels/buttons, transitions.
- **6.2 Hub redesign**: visual base-camp scene with building states.
- **6.3 Gacha ceremony**: reveal animation, rarity build-up, multi-roll cascade.
- **6.4 Collection/forge/hero screens** restyled with portraits.
- **6.5 Combat HUD + results** restyled.

**Done when**: no screen looks like a developer prototype. Tag `v0.11.0-ui`.

## Phase 7 — Audio

- **7.1 Engine**: vendored Howler, music/SFX channels, settings persistence.
- **7.2 SFX pass**: UI, gacha ceremony, per-attack-type hits, per-element casts, kills, results.
- **7.3 Music**: camp, combat by region tier, boss, endless.

**Done when**: playing muted feels like something's missing. Tag `v0.12.0-audio`.

## Phase 8 — Ship

- **8.1 Performance**: atlas consolidation, draw-call audit, 60fps at 4× with full boards + VFX,
  <5s load, stable memory.
- **8.2 Onboarding**: first-session flow, region 1 tuning, lock system as tutorial.
- **8.3 Deploy**: GitHub Pages + PWA manifest + offline cache, save export/import, version display.
- **8.4 Final QA**: simulator sweep, full manual playthrough, zero P0/P1 in BUGS.md.

**Done when**: public URL playable end-to-end. Tag `v1.0.0`.

---

## Supervision Model

**Orchestrator** (strong model, this session): writes specs, spawns workers, reviews every diff,
runs the harness, browser-verifies, merges, updates CONTINUITY.md, drives ComfyUI, makes design calls.

**Workers** (Sonnet; Haiku for mechanical batches): one task per agent, spawned directly by the
orchestrator (no copy-paste launch prompts needed), on feature branches per repo convention.
Workers never merge to main and must leave `node tests/run.js` green (Phase 1+).

**Task protocol**: spec in `prompts/NN-*.md` → worker implements on branch → orchestrator reviews
diff, runs tests, smoke-tests in browser → merge or bounce with findings → CONTINUITY.md updated,
milestone tag at phase end.

**Escalation to the user**: art/audio taste sign-offs (anchor approval in 5.1 especially),
hex-vs-isometric call if the Phase 3.3 balance gate fails, and the public deploy in 8.3.

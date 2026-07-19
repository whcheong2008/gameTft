# Prompt 77 — Phase 6.1/6.2: Design System + Hub Redesign

**Branch**: `feature/phase6-hub` (create from `main`)
**Read first**: `CLAUDE.md`, `MASTERPLAN.md` § Phase 6, `game-v2.html` (current CSS), `js/ui-hub.js`,
`js/ui-shared.js`, GRAPHICS-SESSION-HANDOFF.md (canonical element palette), GRAPHICS-PLAN.md § UI
design section (style intent: dark fantasy, gold accents, painterly).

## Task 1 — Design system (CSS custom properties + components)

In `game-v2.html`'s stylesheet (single-file CSS stays — no build tools):
- **Tokens**: `--sv-bg-*` (3 depths), `--sv-panel`, `--sv-border`, `--sv-gold`, `--sv-text-*`
  (3 emphasis levels), per-element `--sv-el-fire` … (the canonical 6), rarity tier colors
  (T1 gray → T5 gold matching existing conventions), spacing scale, radius scale, 2 shadows.
- **Components** (classes, applied progressively): `.sv-panel` (bordered, gradient header),
  `.sv-btn` / `.sv-btn-primary` / `.sv-btn-gold` (hover/active/disabled states), `.sv-chip`
  (unit/item chips with rarity border), `.sv-bar` (hp/xp/progress), `.sv-tab`, `.sv-modal`
  (backdrop + panel + close), `.sv-tooltip`. Screen-transition framework: 180ms fade/slide
  between `showScreen` targets (hook centrally in `showScreen`, respect
  `prefers-reduced-motion`).
- Migrate `showToast` + `showConfirmDialog` (ui-shared.js) onto the system.
- Refactor the EXISTING screens' CSS to consume tokens (colors/spacing swapped to var()) without
  redesigning them — full restyles of other screens come in later prompts. No behavior changes.

## Task 2 — Hub redesign (ui-hub.js + CSS)

From button-grid to a base-camp scene, DOM/CSS only (no Pixi on the hub):
- Full-viewport layered backdrop (reuse the arena-backdrop recipe family: night-camp gradient,
  faint hex pattern, vignette, 2-3 silhouette layers).
- Buildings become an arranged "camp" of building cards at varied positions/sizes on the scene
  (absolute layout grid, responsive breakpoints; a simple curved path motif connecting them).
  Each card: icon, name, level pips, state (locked silhouette / upgradeable glow / maxed gold),
  hover lift + tooltip with current bonus, click → existing building panel (unchanged logic).
- Primary nav (Summon / Collection / Team / Missions / Codex / Item Bench) as a docked bottom bar
  with icons + labels; top bar (level/XP/VE) restyled on tokens.
- Achievements/Stats/Reset relocate into a settings drawer (gear icon, top-right).
- Daily reminder: NO daily quests exist (removed by design) — do not resurrect.

## Task 3 — Tests + verify

- `tests/test-ui-smoke.js` (new): headless render of hub + each major screen via showScreen with
  no exceptions; toast + confirm dialog function; screen-transition hook doesn't break headless.
- Suite green twice; goldens untouched (zero combat/logic edits).
- Browser (port 8124): hub reads as a camp scene at 1280×800 and 960px widths; every building
  panel opens; every nav route works; no console errors. Describe the layout in the report
  (orchestrator verifies visually).

Commit as "Prompt 77: design system tokens/components + hub camp redesign". Push. Do not merge.

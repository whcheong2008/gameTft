# Prompt 80 — Phase 6.5: Combat HUD, Results, Mission Select

**Branch**: `feature/phase6-hud` (create from `main`)
**Read first**: `CLAUDE.md`, MASTERPLAN § Phase 6, the design system in `game-v2.html`,
`js/ui-combat.js`, `js/ui-missions.js`.
**File scope**: those two ui files + a NEW clearly-marked CSS block appended at the END of
`game-v2.html`'s stylesheet (`/* ==== P80 HUD ==== */`). Parallel workers own ui-gacha and
ui-roster/items/heroes and their own blocks — touch nothing else. Zero logic changes; do NOT touch
render-pixi.js/vfx*.js; goldens byte-identical.

## Task

- **Region map / stage select**: region cards onto `.sv-panel` with element-tinted headers, star
  progress as pips, lock states with requirement text, boss stages badged; stage list rows with
  the lore blurb styled as flavor text; endless/challenge entry cards matching.
- **Combat chrome**: scoreboard drawer, synergy sidebars, log strip restyled on tokens (keep the
  collapse behavior); wave/encounter banners aligned with token typography; speed control and
  enrage timer as pill buttons.
- **Reposition + results**: reposition overlay instructions restyled; results screen as a proper
  sequence sheet — outcome header, star pips animating in, reward rows (VE/XP/items with rarity
  chips), MVP card, buttons as `.sv-btn-primary`/`.sv-btn`. Defeat variant desaturated styling.
- All CSS-driven, reduced-motion respected, presentation only.

## Tests + verify

New `tests/test-ui-hud.js`: mission select + stage list render headlessly; combat screen chrome
renders; results screen renders both outcomes with reward rows. Suite green twice; goldens
untouched; `git diff` confined to scope. Browser: full mission loop (select → builder → fight →
results) visually coherent, zero console errors.

Commit as "Prompt 80: combat HUD, results, mission select on design system". Push. Do not merge.

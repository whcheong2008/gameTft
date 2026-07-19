# Prompt 79 — Phase 6.4: Collection / Items / Heroes Screens

**Branch**: `feature/phase6-collection` (create from `main`)
**Read first**: `CLAUDE.md`, MASTERPLAN § Phase 6, the design system in `game-v2.html`,
`js/ui-roster.js`, `js/ui-items.js`, `js/ui-heroes.js`, `js/ui-lore.js`.
**File scope**: those four ui files + a NEW clearly-marked CSS block appended at the END of
`game-v2.html`'s stylesheet (`/* ==== P79 COLLECTION ==== */`). Parallel workers own ui-gacha,
ui-combat/ui-missions, and their own blocks — touch nothing else. Zero logic changes.

## Task

Restyle onto the design system (structure preserved, presentation upgraded):
- **Roster**: unit cards as `.sv-chip`-family tiles — element-colored frame, tier border color,
  star pips, evolved gold ring; filter/sort bar as `.sv-tab`s (keep existing filter logic);
  unit detail panel as an `.sv-modal` two-column sheet (portrait area placeholder box ready for
  Phase 5 art — give it a stable id `unit-portrait-<key>` and elemental gradient fallback).
- **Item bench / Echo Shaping (forge) / Gem Workshop**: panels onto `.sv-panel`/`.sv-tab`/`.sv-modal`,
  rarity borders from tier tokens, affix text hierarchy via text-emphasis tokens. Keep every
  existing operation's flow identical.
- **Heroes**: hero cards with portrait placeholder + skill tree onto tokens — tree nodes as
  connected pips (learned/available/locked states), keep exact click behavior.
- **Codex**: light pass — tokens + consistent tabs only.

## Tests + verify

New `tests/test-ui-collection.js`: each screen renders headlessly post-restyle; unit detail opens;
one forge op and one gem op still complete; hero node learn still works; portrait placeholder ids
present. Suite green twice; `git diff` confined to your scope. Browser: click through every screen,
zero console errors.

Commit as "Prompt 79: collection/items/heroes screens on design system". Push. Do not merge.

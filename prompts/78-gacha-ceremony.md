# Prompt 78 — Phase 6.3: Gacha Ceremony

**Branch**: `feature/phase6-gacha` (create from `main`)
**Read first**: `CLAUDE.md`, MASTERPLAN § Phase 6, the design system in `game-v2.html`
(`--sv-*` tokens, `.sv-*` components), `js/ui-gacha.js`, `js/gacha.js` (logic — do not change).
**File scope**: `js/ui-gacha.js` + a NEW clearly-marked CSS block appended at the END of
`game-v2.html`'s stylesheet (`/* ==== P78 GACHA ==== */`). Parallel workers own other ui files and
their own end-of-stylesheet blocks — touch nothing else.

## Task

Rebuild the summon experience as a ceremony (DOM/CSS on the design system; no Pixi):
- Altar scene: element-glow backdrop (arena-backdrop recipe family), the summon circle as the
  centerpiece, rates/pity presented in a collapsible `.sv-panel`.
- Single roll: circle charge-up (~600ms, skippable by click) → card flip reveal with tier-colored
  burst (T3+ get bigger flare; NEW units get a banner ribbon; evolved get gold treatment).
- Multi roll: cards fly out face-down in a 2×5 spread, flip in sequence (~120ms stagger,
  click-to-skip reveals all), tier bursts as above; summary row (new/dupes/highest tier) after.
- Pity progress presented as a `.sv-bar` with threshold marker.
- All animation CSS-driven, `prefers-reduced-motion` collapses to instant reveals. Logic calls
  (uiDoSingleRoll/uiDoMultiRoll and their result data) unchanged — presentation only.
- Free-multi-roll (region reward) button state preserved.

## Tests + verify

Extend `tests/test-ui-smoke.js` cases in your OWN new file `tests/test-ui-gacha.js` (don't edit the
shared smoke file — parallel workers): summon screen renders headlessly, roll flow completes and
collection updates, reveal elements exist, reduced-motion path renders instantly. Suite green twice;
zero logic diffs (`git diff` must show only ui-gacha.js, game-v2.html CSS block, your test file).
Browser: full single + multi roll ceremony, skip works, zero console errors.

Commit as "Prompt 78: gacha summon ceremony". Push. Do not merge.

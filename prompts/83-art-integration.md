# Prompt 83 — Phase 5.6: Art Integration (Portraits + Backgrounds Everywhere)

**Branch**: `feature/phase5-art-integration` (create from `main`)
**Read first**: `CLAUDE.md`, MASTERPLAN § Phase 5, `js/ui-roster.js` (`.p79-portrait` +
`unit-portrait-<key>` id scheme), `js/ui-heroes.js` (`hero-portrait-<key>`), `js/ui-gacha.js`
(reveal cards), `js/render-pixi.js` (token factory), `js/ui-combat.js` (`buildArenaBackdrop`),
`js/ui-hub.js` (`buildHubCampBackdrop`), `sw.js`.

## The assets (already committed on main before you branch)

- `assets/portraits/<unitKey>.webp` (one per base unit, 512-wide 2:3), `assets/portraits/hero_<heroKey>.webp`,
  `assets/portraits/boss_<bossKey>.webp`. Evolved units: NO separate file — reuse the base unit's
  portrait with the existing gold treatment (`baseKey` back-reference resolves it).
- `assets/backgrounds/region1..region8.webp` (1344×768) and `assets/backgrounds/camp.webp`.

## Task 1 — Asset helper (`js/assets.js`, NEW)

`getPortraitUrl(unitOrHeroOrBossKey)` (resolves evolved → base via EVOLVED_TEMPLATES baseKey;
returns null for unknown), `getBackgroundUrl(regionNumOrCamp)`. A tiny `PORTRAIT_KEYS` manifest
array (generate it from the actual files at implementation time — hardcoded list is fine, no fs
at runtime). Everything must degrade cleanly if a file 404s (the existing gradient/emoji
placeholders stay as fallback via `onerror` / Pixi load-catch).

## Task 2 — UI portraits

- `.p79-portrait` boxes (roster cards, collection grid, unit detail, hero cards): render the
  portrait as a `background-image` (cover) with the emoji fallback only when no file exists.
- Gacha reveal cards: portrait as the card face (keeps tier border/burst treatment).
- Boss portraits: region map boss badge tooltip/stage list boss rows + boss intro if one exists.
- Codex unit entries: unlocked entries show the portrait thumbnail.

## Task 3 — Pixi combat tokens

Token factory: load the unit's portrait as a texture (PIXI.Assets, lazy, per-combat preload of
the units actually fighting — await before first frame or swap in when loaded), draw it filling
the token base (rounded-rect mask), element-colored border kept, name/pips/bars unchanged.
Evolved units get the existing gold ring/tint over the same portrait. Bosses use boss portrait.
Missing texture → current placeholder rendering (must remain fully functional — some units may
lack files). VFX/animations unchanged. No logic changes; goldens byte-identical.

## Task 4 — Backgrounds

- `buildArenaBackdrop(regionNum)`: image layer (cover, darkened via overlay gradient for board
  readability) under the existing procedural layers (procedural becomes the tint/vignette on
  top + fallback when no image). Endless/challenges: region8 image with the neutral tint.
- `buildHubCampBackdrop()`: camp.webp layer, same treatment.
- Builder screen backdrop inherits arena treatment (it reuses the same recipe family).

## Task 5 — PWA + ship

- `sw.js`: confirm runtime caching covers `assets/` requests (cache-first on fetch); if the
  current implementation only serves the precache list, add runtime caching for `assets/`.
  Do NOT precache all portraits (too big) — cache on demand.
- Bump `GAME_VERSION` minor in js/version.js (stamp script stays manual/orchestrator-run).

## Tests + verify

- `tests/test-assets.js`: helper resolution (base/evolved/hero/boss/unknown), manifest entries
  are well-formed keys that exist in UNIT_TEMPLATES/HERO_DATA/BOSS_DATA, headless render of
  roster/detail/gacha with assets present doesn't throw, and combat with portrait tokens headless
  (stub PIXI) leaves goldens/RNG untouched.
- Suite green twice; goldens byte-identical.
- Browser (fresh port 8131+): roster shows real portraits; unit detail large portrait; gacha
  reveal shows portrait cards; a fight shows portrait tokens with bars/pips intact and VFX on
  top; boss fight shows boss art; region map/arena/hub show background art; a unit with its
  portrait file temporarily renamed still renders via fallback (test this explicitly, then
  restore). Zero console errors.

Report: integration points table, preload strategy, fallback proof, perf note (token texture
memory), test results.

Commit as "Prompt 83: portraits + backgrounds integrated across UI, combat, and backdrops".
Push. Do not merge.

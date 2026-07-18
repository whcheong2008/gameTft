# Prompt 63 — Phase 2.8: Lore Delivery + Blocking-Dialog Cleanup

**Branch**: `feature/phase2-lore` (create from `main`)
**Read first**: `CLAUDE.md`, `MASTERPLAN.md` § Phase 2, `PHASE2-AUDIT.md` item 3,
`STORY-DRAFT-V1.md` (world bible), `STORY-BEATS-CATALOG-V2.md` + `STORY-STAGES-V2.md` (stage
narration content), `CONTENT-DESIGN.md` § lore delivery, `UNITS-DESIGN.md` (unit lore),
`HERO-REWORK.md` (hero lore).
**File scope**: NEW files (`js/lore-data.js`, `js/ui-lore.js`), `js/ui-hub.js`, `js/ui-missions.js`,
`js/ui-roster.js`, `js/ui-heroes.js`, `js/ui-gacha.js`, `js/ui-builder.js`, `js/ui-items.js`,
`js/ui-shared.js`, `js/save.js` (unlock tracking only, follow its version-agnostic backfill
convention), `game-v2.html`, tests. Do NOT touch `js/combat-*.js`, `js/ui-combat.js`,
`js/missions.js`, `js/units-bonds.js`, `js/hub.js` — another worker owns those in parallel.

## Task 1 — Lore data layer (`js/lore-data.js`)

Extract into data (don't invent new canon — adapt from the docs listed above):
- World/region entries: 1 per region (8) + 2-4 world entries, sourced from STORY-DRAFT-V1.md.
- Stage narration: intro blurb per stage from STORY-STAGES-V2.md (these exist as production text —
  trim each to 1-3 sentences for in-game display; keep ids aligned with STAGES ids).
- Unit lore cards: 1-2 sentences per base unit (66). UNITS-DESIGN.md has flavor; where thin,
  write terse in-world flavor consistent with the docs.
- Hero entries: 6, from HERO-REWORK.md.
- Bond stories: one short paragraph per bond in units-bonds.js, unlocked by triggering the bond.

## Task 2 — Codex screen (`js/ui-lore.js`)

- "Codex" entry point on the hub screen (ui-hub.js) next to the existing Equipment Codex access.
- Tabs: World / Regions / Units / Heroes / Bonds. Locked entries show as silhouettes ("???").
- Unlock rules (tracked in save, backfill-style field `loreUnlocks`): region entries on first stage
  clear in that region; stage narrations viewable once the stage is cleared; unit cards when the
  unit is first obtained; hero entries when hero unlocked; bond stories when the bond first triggers
  (read the `stats.bondsUsedSeen` array — do not write it).
- Stage narration display: show the 1-3 sentence intro as part of the stage's entry in the stage
  list (ui-missions.js) — a small flavor block, not a modal takeover.

## Task 3 — Blocking-dialog cleanup

`alert()`/`confirm()` freeze the embedded verification browser and are bad UX. In YOUR file scope
only (the ui files listed above — leave ui-combat.js and any combat/hub/missions sites alone):
replace `alert(...)` with `showToast(...)` and `confirm(...)` with the existing `showConfirmDialog`
pattern (ui-hub.js has it; move it to ui-shared.js if needed for reuse — that move is in scope).
List every replaced call site in your report; if a site's control flow genuinely needs a synchronous
answer and can't be restructured cheaply, leave it and flag it.

## Task 4 — Tests

`tests/test-lore.js`: data completeness (every region/stage/base-unit/hero/bond has an entry, ids
align with STAGES/UNIT_TEMPLATES/HERO_DATA/UNIT_BONDS), unlock rules (fresh save: all locked;
simulate first-clear/obtain/bond-trigger → entry unlocks), no crash rendering codex headlessly.

## Verification

`node tests/run.js` fully green twice. Report: entry counts per category, unlock rule wiring points,
replaced dialog call sites, sample of 3 unit cards + 1 bond story for orchestrator tone review.

Commit as "Prompt 63: lore data + codex screen + blocking-dialog cleanup". Push. Do not merge.

# Prompt 67 — Phase 3.1: Combat Renderer Abstraction

**Branch**: `feature/phase3-renderer-abstraction` (create from `main`)
**Read first**: `CLAUDE.md`, `MASTERPLAN.md` § Phase 3 (the target architecture), `js/combat-events.js`,
`js/ui-combat.js`, `js/combat-core.js`.

## Goal

Decouple combat logic from the DOM completely, behind a renderer interface, so Phase 3.2 can drop in
a PixiJS renderer without touching game rules. Pure refactor — zero behavior change; goldens must
stay byte-identical.

## Target architecture

- **Logic layer** (`combat-*.js`): owns `combatState`, the tick loop timing values, and
  `combatEvents`. After this refactor, `grep -n "document\." js/combat-*.js` must return ZERO hits
  (the acceptance test — add it as a Node test case reading the files as text).
- **Renderer interface** (`js/render-interface.js`, NEW): documents + registers renderers.
  A renderer is an object: `{ init(container, combatState, context), frame(dtMs), destroy() }`,
  plus it subscribes to `combatEvents` for discrete effects (unitDamaged → floating number,
  unitKilled → death anim, abilityCast → cast flash, ccApplied → status icon pulse, plus the
  encounter-HUD events/state it needs). `context` carries stage/mission metadata (name, wave info,
  encounter mechanic, boss flag). Global registry: `RENDERERS = {dom: ...}` and
  `getActiveRenderer()` resolving `?renderer=` query param (default `dom`).
- **DOM renderer** (`js/render-dom.js`, NEW): today's rendering moved behind the interface.
  Everything visual that currently lives in `ui-combat.js` or leaks from combat files (board DOM,
  unit cells, hp/mana bars, floating damage numbers, status icons, encounter banner/HUD, boss
  telegraph visuals, wave banners, speed button label updates) moves here or stays in `ui-combat.js`
  strictly as *screen chrome* (scoreboard sidebar, combat log, results/transition overlays, buttons).
  Rule of thumb: things on/over the battlefield = renderer; panels around it = ui-combat chrome.
  Chrome may keep reading combatState directly but must not be called BY combat logic — it updates
  from the render loop or events.
- **Loop ownership**: the combat tick (setInterval logic pump) stays in logic; the render loop
  becomes `requestAnimationFrame` driving `renderer.frame(dt)` (and chrome updates). Speed control
  multiplies the logic tick as today.

## Constraints

- No behavior change. No visual redesign — the DOM renderer must look pixel-equivalent to today.
- Headless-safe: harness runs with no renderer at all (logic never requires one to exist).
- `game-v2.html` load order: render-interface after combat files, render-dom after ui files.
- Delete any now-dead DOM code paths you displace; report anything surprising.

## Tests

- New `tests/test-renderer-boundary.js`: (a) source-scan asserts zero `document.` in combat-*.js;
  (b) seeded combat runs headlessly to a result with NO renderer registered; (c) registering a stub
  renderer receives init → N frame calls → expected event callbacks (collect + assert counts for
  unitDamaged/unitKilled at minimum).
- Entire suite green; goldens byte-identical.

## Verification

`node tests/run.js` green twice. Also verify in a real browser (dev server: `node scripts/serve.js`,
http://localhost:8123 — never file://): full mission with combat, floating numbers, status icons,
encounter banner (force `STAGES[0].encounterMechanic='escalating_threat'` for the check), boss stage
(story boss), wave transitions, speed toggle, results screen — all identical to before. Shim
window.alert/confirm before driving the UI programmatically.

Report: what moved where (table), the renderer interface as implemented, any DOM access you found
in combat files and how it was rehomed, test results.

Commit as "Prompt 67: combat renderer abstraction — logic/DOM decoupling". Push. Do not merge.

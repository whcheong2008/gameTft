# Prompt 72 — Phase 4.1/4.2: VFX Framework + Projectiles & On-Hit Effects

**Branch**: `feature/phase4-vfx` (create from `main`)
**Read first**: `CLAUDE.md`, `MASTERPLAN.md` § Phase 4, `js/render-pixi.js` (layers, projection,
event subscriptions), `js/combat-events.js`, `js/units-abilities.js` + `js/combat-abilities.js`
(what abilities exist and what they emit), GRAPHICS-SESSION-HANDOFF.md (element palette).

## Goal

The VFX engine and its first consumers: every auto-attack and every ability produces a visible,
element-themed effect. Ability-SPECIFIC spectacular mappings for all 132 abilities come in
Prompt 73 — this prompt builds the machine and covers the universal cases.

## Task 1 — VFX framework (`js/vfx.js`, NEW; pixi-side, loads after render-pixi)

- A lightweight particle/effect system on its own layer(s) in the combat stage (above tiles, below
  floating text): pooled sprites/Graphics, per-effect update in `frame(dt)`, hard cap (~400 live
  particles, oldest culled), all positions via `boardToScreen`, all timing scaled by COMBAT_SPEED,
  cosmetic PRNG only (LOCAL, never the seeded stream).
- **~12 composable primitives**, each a function `(opts) => effectInstance`:
  `projectile` (point→point, speed, arc option, trail), `beam` (line flash),
  `nova` (ring expanding from cell), `burst` (radial particle pop),
  `groundDecal` (tinted cell overlay, pulse+fade), `chain` (zigzag bolt through a target list),
  `aura` (soft glow attached to a token, duration), `rise` (particles float up from token),
  `slash` (arc swipe at target), `shieldPop` (hex-shell shimmer), `beacon` (column of light),
  `shake` (token jitter, NOT camera — camera shake is Prompt 74).
- Element theming: one palette entry per element (core color, accent, particle shape variant)
  from the canonical palette; primitives take `element` and theme themselves.
- Registry: `VFX.play(primitiveName, opts)`; safe no-op when the pixi app isn't ready.

## Task 2 — Event wiring (universal effects)

Driven from combatEvents (extend emit payloads where needed — logic files may gain event DATA but
no behavior changes; goldens must stay byte-identical):
- **Auto-attacks**: ranged unit types (Archer, Mage) fire a `projectile` (element-themed; Mage gets
  arc + trail, Archer straight + fast) timed to land with the damage application (visual timing
  only — damage stays instant in logic; the projectile is fired backward-timed from the hit, or
  simply fast enough (~150ms) that the disconnect is invisible; document your choice).
  Melee types get a `slash` at the target on hit.
- **On-hit**: `burst` at the victim scaled by damage (crits bigger + flash), `shieldPop` when a
  shield absorbs, heal `rise` in green on unitHealed.
- **Casts**: generic cast flash upgraded — `aura` pulse + `beacon` flicker on abilityCast (the
  per-ability spectacular mapping replaces/extends this in Prompt 73).
- **Deaths**: dissolve `burst` + fading `groundDecal` (replaces the plain fade).
- **CC application**: small element-agnostic effect per ccApplied type (stun=stars circle,
  freeze=ice shards, burn=ember rise, root=vines burst, silence=falling glyphs — primitive
  combinations, no new art).

## Task 3 — Boss telegraphs (moved up from 4.4 because the decal primitive makes it cheap)

Boss telegraph danger zones (`startBossTelegraph` cell sets) render as pulsing red `groundDecal`s
for the telegraph duration, then a `nova`+`burst` on detonation. (This was deferred from Prompt 68's
parity list — close that gap.)

## Task 4 — Tests

- `tests/test-vfx.js`: headless with a PIXI stub — VFX.play returns instances for every primitive;
  event wiring smoke (seeded combat with a spy on VFX.play: projectiles fired for ranged attacks,
  bursts on damage, decals on boss telegraph); particle cap enforced (spawn 1000 → live ≤ cap);
  no call into the seeded RNG (instrument Math.random call count before/after a VFX-heavy replay —
  must be identical to a VFX-disabled run).
- Suite green twice; goldens byte-identical.

## Verification

Browser (port 8124): a mission with ranged+melee units — projectiles visibly fly, hits pop, crits
flash, heals rise; a mage-heavy fight stays ≥55fps at 4× speed (report); boss fight shows pulsing
telegraph decals then detonation; CC effects visible. Report FPS at 1×/4× with ~14 units.

Report: primitive list as implemented, event wiring table, timing choice for projectiles,
FPS numbers, cap behavior.

Commit as "Prompt 72: VFX framework, projectiles, on-hit effects, boss telegraph decals". Push.
Do not merge.

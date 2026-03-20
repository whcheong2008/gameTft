# Unity Animation Spec — Combat Token System

> How AI-generated portrait art becomes animated combat units in Unity.
> No sprite sheets needed — all animation is code-driven.

---

## Architecture Overview

```
Token GameObject
├── SpriteRenderer (the AI-generated token art, 256x256)
├── ParticleSystem (element-specific ambient particles)
├── ElementGlowShader (pulsing border glow via shader)
├── HealthBar (UI overlay)
├── ManaBar (UI overlay)
├── TierStars (UI overlay)
└── AnimationController (manages all tween/shader states)
```

---

## Animation States

### 1. IDLE
The default state. Unit is alive and waiting.

**All elements share:**
- Gentle Y-axis bob: `sin(time * 1.5) * 3px` — subtle floating feel
- Token scale pulse: `1.0 + sin(time * 2) * 0.02` — barely visible "breathing"
- Health/mana bars visible

**Fire Echo specific:**
- Particle: Orange-red ember particles drifting upward from token edge
- Shader: Border glow pulsing between 60-100% opacity, warm color
- Sprite: Slight rotation oscillation ±2° (flickering feel)

**Fire Voidspawn specific:**
- Particle: Dark smoke wisps + occasional orange spark from fissure points
- Shader: Internal glow pulse (slower than Echo, more like a heartbeat)
- Sprite: Very subtle scale pulse (expanding/contracting like breathing rock)

### 2. MOVE
Unit travels from current cell to target cell.

**All elements:**
- Tween position over 0.3-0.5s using DOTween or similar
- Ease: InOutQuad for smooth acceleration/deceleration

**Fire Echo:**
- Trail: Orange-red streak trail behind token (TrailRenderer or particle trail)
- Speed: Fast — fire is quick. 0.3s move time
- Effect: Ember burst at departure point, ember trail during move

**Fire Voidspawn:**
- Trail: Dark smoke trail with faint orange glow
- Speed: Slower — heavy. 0.5s move time
- Effect: Ground crack sprite at departure point (optional), rumble screen shake

### 3. ATTACK (basic auto-attack)
Unit damages a target.

**Sequence (all elements):**
1. Wind-up: Scale up 1.1x over 0.1s
2. Lunge: Move toward target 30% of distance over 0.1s
3. Impact: Flash target white for 0.05s, spawn damage number
4. Return: Ease back to original position over 0.2s

**Fire Echo:**
- Wind-up: Glow intensifies, embers accelerate upward
- Impact: Fire burst particle effect at target (orange-red expanding ring)
- Sound: Whoosh + crackle

**Fire Voidspawn:**
- Wind-up: Fissures glow brighter, smoke increases
- Impact: Magma splash particle at target (darker, heavier particles)
- Sound: Deep rumble + impact thud

### 4. ABILITY CAST
Unit uses a special ability. More dramatic than basic attack.

**Sequence (all elements):**
1. Cast buildup: 0.3s glow intensification + element particles spiral inward
2. Cast release: Screen flash (subtle), ability VFX plays
3. Recovery: 0.2s return to idle

**Fire Echo abilities (examples):**
- AoE: Expanding fire ring from caster position (orange-red ring shader)
- Single target: Fire beam connecting caster to target for 0.3s
- Buff: Flame aura appears on buffed allies for duration

**Fire Voidspawn abilities:**
- AoE: Magma eruption from ground at target area (dark particles + orange glow)
- Single target: Hurled magma boulder projectile
- Debuff: Smoldering ground effect at target location

### 5. HIT / TAKE DAMAGE
Unit receives damage.

**All elements:**
- Flash sprite white for 0.05s (shader tint)
- Slight knockback: Move 5px away from attacker, return over 0.15s
- Spawn floating damage number (color-coded)
- Health bar decreases (animated)

**Fire Echo:**
- Embers scatter outward briefly (disrupted)
- Glow dims momentarily then recovers

**Fire Voidspawn:**
- Crack flash — fissures briefly glow brighter (hit exposes more magma)
- Small rock fragments particle burst

### 6. DEATH
Unit is destroyed.

**Fire Echo:**
- Duration: 0.5s
- Sequence: Glow intensifies → embers accelerate outward → flame disperses into sparks → fade to nothing
- Particle: Large ember burst expanding outward, particles drift up and fade
- Shader: Alpha fade 1.0 → 0.0 over 0.5s
- Final: Ghost cell marker (faint element-colored circle on grid)

**Fire Voidspawn:**
- Duration: 0.7s (heavier, slower death)
- Sequence: Fissures flare bright → surface crumbles → collapses inward → magma pool left briefly
- Particle: Rock fragments falling + steam/smoke burst + orange glow fading
- Shader: Dissolve shader from top to bottom
- Final: Fading dark scorch mark on cell (0.5s then gone)

### 7. SPAWN / SUMMON
Unit first appears on the grid.

**Fire Echo:**
- Small ember spiral converges to center → flash → token appears at 0 alpha → fade in over 0.3s
- First idle bob slightly larger than normal, then settles

**Fire Voidspawn:**
- Ground cracks appear → magma seeps up → token rises from below → settles into position
- Smoke burst on arrival

---

## Element-Specific Particle Configurations

### Fire Echo Particles
```
Ambient (idle):
  - Shape: Cone, emitting upward from token edge
  - Rate: 8-12 particles/sec
  - Size: 2-5px, shrinking over lifetime
  - Color: #FF4500 → #FFD700 → transparent (over 1s lifetime)
  - Speed: 15-25 px/s upward
  - Gravity: -0.5 (drift upward)

Attack burst:
  - Shape: Sphere burst at impact point
  - Count: 20-30 particles
  - Size: 3-8px
  - Color: #FFFFFF → #FF4500 → transparent (over 0.3s)
  - Speed: 50-100 px/s outward

Death scatter:
  - Shape: Sphere burst from token center
  - Count: 40-60 particles
  - Size: 2-6px
  - Color: #FF4500 → #661a00 → transparent (over 1s)
  - Speed: 30-80 px/s outward + upward drift
```

### Fire Voidspawn Particles
```
Ambient (idle):
  - Shape: Edge emission from random fissure points
  - Rate: 4-6 particles/sec (less than Echo — heavier, less active)
  - Size: 3-8px
  - Color: #444444 (smoke) with occasional #FF4500 (spark)
  - Speed: 5-10 px/s upward (slow, heavy smoke)
  - Gravity: 0.2 (slightly pulled down)

Attack burst:
  - Shape: Cone toward target
  - Count: 15-25 particles
  - Size: 5-12px (larger chunks)
  - Color: #331100 → #FF4500 → #222222 (over 0.5s)
  - Speed: 40-80 px/s toward target

Death crumble:
  - Shape: Gravity-affected particles falling from token center
  - Count: 30-50 particles
  - Size: 4-10px (rock chunks)
  - Color: #222222 with #FF4500 edge glow → fade (over 1.2s)
  - Speed: 20-40 px/s, gravity 2.0 (falling debris)
```

---

## Shader Requirements

### Element Glow Shader
Applied to token border ring. Supports:
- `_GlowColor` (element primary color)
- `_GlowIntensity` (0-1, animated for pulse)
- `_GlowWidth` (border thickness)

### Flash Shader
For hit feedback:
- `_FlashColor` (white default)
- `_FlashAmount` (0-1, lerped quickly)

### Dissolve Shader
For death animations:
- `_DissolveAmount` (0-1, drives dissolve from edge inward or top to bottom)
- `_DissolveColor` (element color for dissolve edge glow)
- `_NoiseTexture` (noise map for organic dissolve pattern)

---

## Implementation Priority

1. **Idle** — most visible state, get this right first
2. **Death** — high emotional impact, second priority
3. **Attack** — core gameplay feedback
4. **Move** — essential for readability
5. **Ability** — can be simple initially, polish later
6. **Spawn** — nice to have, can be a simple fade-in initially

---

## Performance Notes

- Target: 56 tokens max on 8×7 grid (both teams full)
- Each token: 1 SpriteRenderer + 1 ParticleSystem + 2 UI overlays
- Budget: ~56 draw calls for tokens + ~56 particle systems
- Optimization: Pool particle systems, disable off-screen tokens
- Mobile consideration: Reduce particle counts by 50%, simplify shaders

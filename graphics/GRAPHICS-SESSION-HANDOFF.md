# Graphics Session Handoff — Shattered Veil (Updated 2026-03-19)

> Context document for continuing graphics work on the dedicated graphics PC. Created 2026-03-19 from the planning session, **updated same day** after initial art generation testing. Read this first in any new Cowork/Claude session on the graphics machine.

---

## What This Project Is

**Shattered Veil** is a 2D auto-battler being migrated from an HTML/JS prototype to Unity. The game has 132 playable units (Echoes), 132 enemy counterparts (Voidspawn), 6 story heroes, 8 bosses, and 8 regions of story content. All core game systems are implemented in HTML — the Unity port and graphics are the current work.

**This session's job**: AI-generated art production using Stable Diffusion (ComfyUI, local).

---

## ⚠️ CRITICAL DESIGN CHANGES (from initial testing)

The following changes were made during the first art generation session and **override** anything in the original GRAPHICS-PLAN.md that contradicts them:

### 1. Echoes are NOT humanoid
Echoes are **elemental spirits/constructs** — living embodiments of their element. They are NOT humans in armor, NOT warriors, NOT people. A Fire Echo is a sentient flame, a Water Echo is a living tidal force, etc. Each element has a **unique non-humanoid body form**.

### 2. Voidspawn are NOT humanoid either
Voidspawn are alien organisms/anomalies, also non-humanoid. They share their Echo counterpart's element but express it in a completely different way (e.g., Fire Echo = ascending flame wisp, Fire Voidspawn = dense cracked magma mass).

### 3. Two-model strategy
- **DreamShaper XL Lightning** → Heroes (Kael, Lyric, Ren, Sera, Maren, Voss), bosses, and any human characters. This model excels at photorealistic/painterly human portraits but fights hard against non-human subjects.
- **Juggernaut XL (or alternative)** → All Echoes and Voidspawn. DreamShaper kept generating humans no matter how we prompted it. A less portrait-biased model is needed for abstract elemental creatures.

### 4. Each element has a unique body archetype
Units are NOT all the same shape with different colors. Each element has a fundamentally different form:

| Element | Echo Form | Voidspawn Form |
|---------|-----------|----------------|
| Fire | Swirling ember flame construct | Dense cracked magma/obsidian mass |
| Water | Flowing liquid vortex | Deep-sea bioluminescent ooze |
| Earth | Growing crystal formation | Fossilized parasitic colony |
| Wind | Barely-visible air current wisp | Tattered insectoid swarm |
| Lightning | Precise geometric bolt construct | Chaotic nerve tangle |
| Force | Clean gravity well distortion | Broken reality fracture |

### 5. In-game combat: Portrait-token + Unity animation (AFK Arena style)
Units on the 8×7 battle grid use **portrait-based tokens with Unity-driven animation**, NOT sprite sheets. The AI-generated art is cropped/framed into tokens, and all movement/attacks/VFX are handled by Unity's particle systems, tweens, and shaders.

For elemental spirits this works especially well:
- Idle: glow pulsing, floating particles
- Move: streak/glide across grid
- Attack: flare up / expand with VFX burst on target
- Death: element-appropriate dissolve (embers scatter, water disperses, crystal shatters, etc.)

Token source resolution: **256×256** (not 128×128 as originally planned).

### 6. Structural rhyme approach
Each Echo-Voidspawn pair shares ONE subtle structural similarity. The rhyme is baked into the prompt (e.g., both Fire units share an S-curve flow and center core glow). It should only be noticeable when comparing side by side.

---

## Key Documents to Read

All in the same repo/folder as this file:

| Document | What It Contains |
|----------|-----------------|
| `GRAPHICS-PLAN.md` | **THE MASTER PLAN** — art style, asset specs, VFX plan, UI design, folder structure. **Note**: Some sections are outdated — see "Critical Design Changes" above. |
| `ANCHOR-PROMPTS-V2.md` | **THE CURRENT PROMPTS** — Complete prompt set for all 12 anchors (6 Echo + 6 Voidspawn) with the revised non-humanoid direction. **USE THESE, not the prompts in GRAPHICS-PLAN.md or the old handoff.** |
| `COMFYUI-SETUP-GUIDE.md` | Installation guide for ComfyUI + models. Setup is DONE on this machine. |
| `CONTINUITY.md` | Full project state — game systems, what's implemented, file structure, design decisions |
| `UNITS-DESIGN.md` | All 132 unit designs (stats, abilities, lore) |
| `HERO-REWORK.md` | 6 heroes: Kael, Lyric, Ren, Sera, Maren, Voss — philosophy-based design |
| `STORY-DRAFT-V1.md` | Story bible — world, characters, lore-mechanics bridge |
| `STORY-STAGES-V2.md` | 97KB production bible — environment descriptions for all 74 stages |
| `COMBAT-DESIGN.md` | Combat system details (relevant for VFX planning) |
| `ITEMS-DESIGN.md` | Item system (relevant for item icon/frame design) |

---

## Model Settings

### For Echoes & Voidspawn (Juggernaut XL or similar non-portrait model)

```
Checkpoint:  [chosen non-portrait-biased model]
Resolution:  768 × 1152 (2:3 portrait ratio)
Steps:       20-25
CFG:         4-5
Sampler:     dpmpp_sde
Scheduler:   karras
Batch size:  4 (RTX 5080 handles this easily)
```

### For Heroes & Human Characters (DreamShaper XL Lightning)

```
Checkpoint:  dreamshaperXL_lightningDPMSDE.safetensors
Resolution:  768 × 1152 (2:3 portrait ratio)
Steps:       8 (Lightning is optimized for few steps)
CFG:         2 (distilled models over-saturate at high CFG)
Sampler:     dpmpp_sde
Scheduler:   karras
Batch size:  4
```

For environments (16:9):
```
Resolution:  1920 × 1080
Same sampler/scheduler, use whichever model fits the subject
```

---

## What To Do Next — Phase G1: Anchor Characters

The immediate task is generating 12 anchor images (6 Echo + 6 Voidspawn) that lock the visual style. Everything else builds on these.

**Full prompts are in `ANCHOR-PROMPTS-V2.md`** — use that file, not the prompts below (which are just a summary).

### Generation Order

1. **Fire Echo** (ember flame construct) → **Fire Voidspawn** (volcanic mass) → Review pair
2. **Water Echo** (tidal vortex) → **Water Voidspawn** (abyssal ooze) → Review pair
3. **Earth Echo** (crystal formation) → **Earth Voidspawn** (fossil colony) → Review pair
4. **Wind Echo** (zephyr wisp) → **Wind Voidspawn** (static swarm) → Review pair
5. **Lightning Echo** (arc construct) → **Lightning Voidspawn** (nerve tangle) → Review pair
6. **Force Echo** (gravity well) → **Force Voidspawn** (reality fracture) → Review pair

### For Each Pair
1. Generate 4-8 variations of the Echo
2. Pick the best one — save seed + exact prompt
3. Generate 4-8 variations of the Voidspawn
4. Pick the best one — save seed + exact prompt
5. Place both side by side and verify:
   - Do they share the structural rhyme? (Should be subtle)
   - Are they obviously counterparts? (Should NOT be obvious)
   - Do they both feel like the same game world? (Should yes)
   - Are they clearly different elements from other pairs? (Should yes)

### After All 6 Pairs Are Approved
- Save all images, seeds, and prompts as the style bible
- Begin LoRA training for style-locking (separate LoRAs for Echoes vs Voidspawn)
- Move to Phase G2 (Heroes & Bosses with DreamShaper XL)

---

## Voidspawn Design Philosophy (Critical)

Voidspawn are NOT "corrupted versions" or "dark recolors" of Echoes. They are independently designed alien organisms that happen to share elemental affinity and ONE hidden structural similarity with their Echo counterpart.

**Rules:**
1. No recoloring — design from scratch
2. No evil tropes — no glowing red eyes, no spikes-everywhere, no purple-evil-energy
3. The element is metabolic — a Fire Voidspawn IS thermal, it doesn't "wear" fire
4. The replay tell — each pair shares ONE structural rhyme visible only when compared side-by-side
5. Voidspawn are NOT humanoid — alien organisms, geological formations, biological anomalies

**The "same but wrong" per element:**

| Element | Echo Expression | Voidspawn Expression |
|---------|----------------|---------------------|
| Fire | Light, ascending, radiating outward | Dense, heavy, containing heat inward |
| Water | Clear, flowing, refracting light | Opaque, stagnant, deep-sea pressure |
| Earth | Crystalline, geometric, growing | Fossilized, parasitic, decaying |
| Wind | Serene, barely there, gentle | Chaotic, buzzing, debris storm |
| Lightning | Precise, geometric, controlled | Organic, chaotic, overloaded |
| Force | Beautiful gravity, clean orbits | Broken geometry, spatial horror |

---

## Element Color Palette (canonical)

| Element   | Primary Hex | Color Name    |
|-----------|-------------|---------------|
| Fire      | `#FF4500`   | OrangeRed     |
| Water     | `#1E90FF`   | DodgerBlue    |
| Earth     | `#228B22`   | ForestGreen   |
| Wind      | `#87CEEB`   | SkyBlue       |
| Lightning | `#FFD700`   | Gold          |
| Force     | `#9370DB`   | MediumPurple  |

---

## Hardware on This Machine

- **CPU**: AMD Ryzen 9 9950X3D (16 cores / 32 threads)
- **GPU**: NVIDIA GeForce RTX 5080 (16GB VRAM)
- **OS**: Windows 11 Home

---

## Production Phase Overview

| Phase | What | Est. Scope |
|-------|------|-----------|
| **G1** (NOW) | 6 Echo + 6 Voidspawn anchors, style lock | 12 key images |
| G2 | Hero portraits (6) + Boss portraits (8) + boss tokens — **DreamShaper XL** | 22+ images |
| G3 | Echo batch production (132 portraits) — **Non-portrait model** | 132 images |
| G3B | Voidspawn batch production (132 portraits) — **Non-portrait model** | 132 images |
| G4 | Combat tokens (256×256, derived from portraits + element borders) | 264 tokens |
| G5 | Environment backgrounds (8 regions + camp) | 27 images |
| G6 | UI elements (panels, buttons, icons, frames) | ~60 assets |
| G7 | VFX & particles (Unity-side, code-driven) + token animation system | Shaders + prefabs |

---

## In-Game Token Pipeline (NEW)

The combat token system uses portrait art + Unity animation, inspired by AFK Arena:

1. **Generate portrait** at 768×1152 (full body, transparent background)
2. **Crop & frame** to 256×256 token with element-colored border
3. **Import to Unity** as sprite
4. **Add Unity-driven animation:**
   - Idle: particle effects (element-appropriate), subtle glow pulse, gentle float
   - Move: tween slide/streak across grid
   - Attack: quick lunge + VFX burst on target
   - Ability: larger VFX moment, possible brief zoom
   - Hit: flash white, knockback shake
   - Death: element dissolve (embers scatter, water disperses, crystal shatters, etc.)
5. **Element VFX layer** via Unity particle systems overlaid on token sprite

This means NO sprite sheet animation is needed — all motion comes from code.

---

## File Organization

Generated images should be organized into:
```
output/shattered-veil/
├── anchors/           ← Phase G1 anchor characters (current task)
│   ├── fire-echo/
│   ├── fire-voidspawn/
│   ├── water-echo/
│   ├── water-voidspawn/
│   ├── earth-echo/
│   ├── earth-voidspawn/
│   ├── wind-echo/
│   ├── wind-voidspawn/
│   ├── lightning-echo/
│   ├── lightning-voidspawn/
│   ├── force-echo/
│   └── force-voidspawn/
├── heroes/
├── echoes/fire/
├── echoes/water/
├── echoes/earth/
├── echoes/wind/
├── echoes/lightning/
├── echoes/force/
├── voidspawn/fire/
├── voidspawn/water/
├── voidspawn/earth/
├── voidspawn/wind/
├── voidspawn/lightning/
├── voidspawn/force/
├── bosses/
├── environments/
└── tokens/
```

---

## Lessons Learned from Initial Testing

1. **DreamShaper XL Lightning will always generate humans** — no matter how hard you negative-prompt against it. Don't waste time trying to make it generate non-humanoid creatures. Use it only for heroes/bosses.
2. **"Spirit" and "entity" still cue humanoid** — use words like "construct," "mass," "formation," "anomaly" instead.
3. **Lead with style, not subject** — put "digital painting, painterly fantasy illustration" early in the prompt.
4. **The structural rhyme needs to be in the prompt** — SD won't accidentally create matching compositions. Explicitly describe the shared element (e.g., "S-curved form," "hollow center," "branching from single point").
5. **Color hex codes in prompts help** — including `(#FF4500)` alongside the color description pushes the model toward the right hue.

---

## Contact / Continuity

- **Game repo**: https://github.com/whcheong2008/gameTft
- **Main branch tag**: `v0.5.0-session11-complete`
- **Planning session**: 2026-03-19 on Cowork
- **Art testing session**: 2026-03-19 on Cowork (this updated handoff)
- **Key design docs are in the repo root** — pull latest main to get them all

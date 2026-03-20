# Graphics Session Handoff — Shattered Veil

> Context document for continuing graphics work on the dedicated graphics PC. Created 2026-03-19 from the planning session. Read this first in any new Cowork/Claude session on the graphics machine.

---

## What This Project Is

**Shattered Veil** is a 2D auto-battler being migrated from an HTML/JS prototype to Unity. The game has 132 playable units (Echoes), 132 enemy counterparts (Voidspawn), 6 story heroes, 8 bosses, and 8 regions of story content. All core game systems are implemented in HTML — the Unity port and graphics are the current work.

**This session's job**: AI-generated art production using Stable Diffusion (ComfyUI, local).

---

## Key Documents to Read

All in the same repo/folder as this file:

| Document | What It Contains |
|----------|-----------------|
| `GRAPHICS-PLAN.md` | **THE MASTER PLAN** — art style, asset specs, Voidspawn design philosophy, production phases, VFX plan, UI design, folder structure, AI prompt templates. Read this first. |
| `COMFYUI-SETUP-GUIDE.md` | Installation guide for ComfyUI + models. Setup is DONE on this machine. |
| `CONTINUITY.md` | Full project state — game systems, what's implemented, file structure, design decisions |
| `UNITS-DESIGN.md` | All 132 unit designs (stats, abilities, lore) |
| `HERO-REWORK.md` | 6 heroes: Kael, Lyric, Ren, Sera, Maren, Voss — philosophy-based design |
| `STORY-DRAFT-V1.md` | Story bible — world, characters, lore-mechanics bridge |
| `STORY-STAGES-V2.md` | 97KB production bible — environment descriptions for all 74 stages |
| `COMBAT-DESIGN.md` | Combat system details (relevant for VFX planning) |
| `ITEMS-DESIGN.md` | Item system (relevant for item icon/frame design) |

---

## Decisions Already Made

### Art Style: "Painterly Fantasy 2D"
- Semi-realistic, painterly digital art — think AFK Arena portraits
- Dark fantasy atmosphere, muted palette with vibrant element accents
- NOT pixel art, NOT anime/chibi, NOT 3D
- Two visual poles: luminous crafted **Echoes** (player units) vs. alien biological **Voidspawn** (enemies)

### Art Creation Method: AI-Generated (Stable Diffusion, local)
- **ComfyUI** as the interface (installed on this machine)
- **DreamShaper XL Lightning** as the checkpoint model
  - File: `dreamshaperXL_lightningDPMSDE.safetensors`
  - This is a distilled model — uses fewer steps and lower CFG than standard SDXL
- **ControlNet** for Voidspawn pose-matching (OpenPose SDXL + Canny SDXL)
- **LoRA training** planned for style-locking after anchor characters are approved
- Manual cleanup in Photoshop/GIMP for every asset

### Scope
- **132 Echo portraits** (66 base + 66 evolved) — player units
- **132 Voidspawn portraits** (66 base + 66 evolved) — enemy units, independently designed
- **6 hero portraits** — Kael, Lyric, Ren, Sera, Maren, Voss
- **8 boss portraits + combat tokens** — with phase variants
- **8 region backgrounds** + camp background — 3-layer parallax
- **264 combat tokens** (128×128) — for the 8×7 battle grid
- **UI elements** — panels, buttons, icons, frames
- **VFX** — particles, shaders, damage numbers (code-driven, less art-dependent)

### Element Color Palette (canonical)
| Element   | Primary Hex | Color Name    |
|-----------|-------------|---------------|
| Fire      | `#FF4500`   | OrangeRed     |
| Water     | `#1E90FF`   | DodgerBlue    |
| Earth     | `#228B22`   | ForestGreen   |
| Wind      | `#87CEEB`   | SkyBlue       |
| Lightning | `#FFD700`   | Gold          |
| Force     | `#9370DB`   | MediumPurple  |

---

## ComfyUI Settings for DreamShaper XL Lightning

**IMPORTANT** — this model is a distilled variant. Standard SDXL settings will NOT work well.

```
Checkpoint:  dreamshaperXL_lightningDPMSDE.safetensors
Resolution:  768 × 1152 (2:3 portrait ratio for character art)
Steps:       8          (NOT 30 — Lightning is optimized for few steps)
CFG:         2          (NOT 7 — distilled models over-saturate at high CFG)
Sampler:     dpmpp_sde
Scheduler:   karras
Batch size:  4          (RTX 5080 handles this easily)
```

For environments (16:9):
```
Resolution:  1920 × 1080
Same sampler/steps/CFG settings
```

---

## What To Do Next — Phase G1: Anchor Characters

The immediate task is generating 12 anchor images (6 Echo + 6 Voidspawn) that lock the visual style for the entire game. Everything else builds on these.

### Step 1: Fire Echo Anchor

**Positive prompt:**
```
fantasy fire warrior, elite soldier-mage in ornate ember-forged armor,
warm orange glow emanating from chest and joints, controlled flame aura,
luminous and intentional design, crafted gauntlets with ember filigree,
strong determined stance, painterly digital art, dark fantasy illustration,
soft dramatic lighting from below, muted dark background with warm fire accents,
semi-realistic proportions, bust to waist portrait, 3/4 angle view,
highly detailed armor texture, clean professional character design,
game character art, transparent background
```

**Negative prompt:**
```
photo, photograph, 3d render, blurry, low quality, deformed, ugly,
text, watermark, signature, extra limbs, bad anatomy, extra fingers,
mutated hands, cartoonish, chibi, pixel art, anime, manga style,
glowing red eyes, spikes everywhere, demonic, evil aura, purple energy,
dark recolor, corrupted version, monster, creature, alien, insectoid,
cute, kawaii, simple, flat colors
```

Generate 4-8 variations. Pick the best "luminous crafted fire warrior."

### Step 2: Fire Voidspawn Anchor (counterpart)

**Positive prompt:**
```
alien biological creature, dark fantasy, fire element organism,
charred volcanic body with thermal fissures glowing from within,
organic weapon-limbs grown from body, chitin andite membrane,
bioluminescent deep orange-red markings along body ridges,
heat radiates from surface without visible flames,
otherworldly anatomy, NOT humanoid, creature ecosystem design,
painterly digital art, portrait view, detailed biological texture,
dark fantasy world, transparent background
```

**Negative prompt:**
```
photo, 3d render, blurry, low quality, text, watermark,
armor, weapon, humanoid, knight, soldier, evil, demonic,
glowing red eyes, spikes everywhere, purple energy,
dark recolor of human, corrupted version of human,
cartoon, chibi, cute
```

### Step 3: Review the pair
Place Fire Echo and Fire Voidspawn side by side. Check:
- Do they share a similar silhouette/pose? (Should yes — structural rhyme)
- Is it immediately obvious they're counterparts? (Should NOT be obvious)
- Do both feel like they belong in the same game world? (Should yes)

### Steps 4-13: Repeat for remaining 5 elements

**Echo anchors to generate:**
| Element | Unit | Description |
|---------|------|-------------|
| Water | T2 Mage (Whirlpool Mage) | Flowing robes, cool blue reflective energy, water droplets |
| Earth | T4 Tank (Abyssal Guardian) | Heavy stone/crystal armor, rooted stance, vine motifs |
| Wind | T1 Archer (Sky Archer) | Light translucent garb, feathered details, airy feel |
| Lightning | T3 Assassin (Thunderlord) | Crackling gold arcs, precise geometric energy, agile |
| Force | T5 Healer (Void Wyrm) | Most ornate, purple/silver, clean geometric gravitational |

**Voidspawn counterparts** — see GRAPHICS-PLAN.md § "The same but wrong spectrum per element" table for each element's Voidspawn aesthetic.

### Step 14: Style Lock
Once all 6 pairs are approved, save the best images as style references and the exact prompts/seeds used. These become the style bible for batch production.

---

## Voidspawn Design Philosophy (Critical — Read Before Generating)

Voidspawn are NOT "corrupted versions" or "dark recolors" of Echoes. They are independently designed alien creatures that happen to share elemental affinity and hidden structural similarities with their Echo counterparts.

**Rules:**
1. No recoloring — design from scratch
2. No evil tropes — no glowing red eyes, no spikes-everywhere, no purple-evil-energy
3. Biological, not mechanical — chitin, bone, membrane, crystallized void-matter
4. Element is metabolic — a Fire Voidspawn IS thermal, it doesn't "wear" fire
5. The replay tell — each pair shares ONE structural rhyme (pose, silhouette) visible only when compared side-by-side

Full design philosophy: GRAPHICS-PLAN.md § 2D

---

## Hardware on This Machine

- **CPU**: AMD Ryzen 9 9950X3D (16 cores / 32 threads)
- **GPU**: NVIDIA GeForce RTX 5080 (16GB VRAM)
- **OS**: Windows 11 Home
- Expect ~5-10 seconds per batch of 4 images at 768×1152

---

## Production Phase Overview

| Phase | What | Est. Scope |
|-------|------|-----------|
| **G1** (NOW) | 6 Echo + 6 Voidspawn anchors, style lock | 12 key images |
| G2 | Hero portraits (6) + Boss portraits (8) + boss tokens | 22+ images |
| G3 | Echo batch production (132 portraits) | 132 images |
| G3B | Voidspawn batch production (132 portraits) | 132 images |
| G4 | Combat tokens (264 Echo + Voidspawn) | 264 tokens |
| G5 | Environment backgrounds (8 regions + camp) | 27 images |
| G6 | UI elements (panels, buttons, icons, frames) | ~60 assets |
| G7 | VFX & particles (Unity-side, code-driven) | Shaders + prefabs |

Full details: GRAPHICS-PLAN.md § 4

---

## File Organization

Generated images should be organized into:
```
output/shattered-veil/
├── anchors/           ← Phase G1 anchor characters (current task)
├── heroes/
├── echoes/fire/       ← Sorted by element
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

Final approved assets go to the Unity project structure defined in GRAPHICS-PLAN.md § 5.

---

## Contact / Continuity

- **Game repo**: https://github.com/whcheong2008/gameTft
- **Main branch tag**: `v0.5.0-session11-complete`
- **Planning session**: 2026-03-19 on Cowork (this handoff document)
- **Key design docs are in the repo root** — pull latest main to get them all

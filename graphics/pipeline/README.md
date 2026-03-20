# Shattered Veil — Art Pipeline

> Complete workflow from AI-generated image to game-ready asset.
> This pipeline is **element-independent** — repeat the same steps for all 6 elements.

---

## Pipeline Steps

### Step 1: Generate Anchor Art (ComfyUI)
- Open `ANCHOR-PROMPTS-V2.md` for the element's prompt
- Generate 4-8 variations, pick the best
- Save the seed + exact prompt used
- **Output**: Raw 768×1152 PNG with black background

### Step 2: Generate Tier Variants
- Open `FIRE-TIER-PROMPTS.md` (or create equivalent for other elements)
- Generate T1-T5 variants following the tier complexity guide
- 11 units per element (T1×2, T2×3, T3×3, T4×2, T5×1)
- **Output**: 11 raw PNGs per element side (22 total per element)

### Step 3: Generate Evolved Variants
- Use base image as img2img input in ComfyUI
- Add evolved modifiers to prompt
- Denoising: 0.4-0.5
- **Output**: 11 evolved PNGs per element side (22 total per element)

### Step 4: Process into Tokens
- Run `token_processor.py` on each image:
  ```bash
  python token_processor.py raw_image.png fire --type echo --tier 3
  ```
- Or batch process a whole directory:
  ```bash
  python token_processor.py ./echoes/fire/ fire --type echo --tier 3 --batch
  ```
- **Output**: 256×256 circular PNG with element border + tier stars

### Step 5: Preview on Grid
- Open `grid_mockup.html` in a browser
- Replace CSS gradient tokens with actual token images to verify readability
- Check at multiple sizes (48px, 64px, 80px)
- **Verify**: Can you tell units apart at 64px display size?

### Step 6: Export to Unity
- Place tokens in Unity project: `Assets/Art/Tokens/{element}/`
- Import as Sprite (2D)
- Set pixels per unit: 256
- Apply to token prefab with AnimationController
- See `UNITY-ANIMATION-SPEC.md` for animation setup

---

## File Index

| File | Purpose |
|------|---------|
| `ANCHOR-PROMPTS-V2.md` | Anchor prompts for all 12 element pairs |
| `FIRE-TIER-PROMPTS.md` | Tier T1-T5 prompts for fire (template for other elements) |
| `token_processor.py` | Python script: raw image → 256×256 game token |
| `grid_mockup.html` | Browser mockup: preview tokens on 8×7 battle grid |
| `UNITY-ANIMATION-SPEC.md` | Unity animation spec: idle, attack, death, VFX, particles |
| `README.md` | This file |

---

## Per-Element Checklist

Repeat for: Fire, Water, Earth, Wind, Lightning, Force

- [ ] Anchor Echo generated + approved
- [ ] Anchor Voidspawn generated + approved
- [ ] Pair reviewed (structural rhyme check)
- [ ] T1-T5 Echo variants generated (11 units)
- [ ] T1-T5 Voidspawn variants generated (11 units)
- [ ] Evolved Echo variants generated (11 units)
- [ ] Evolved Voidspawn variants generated (11 units)
- [ ] All tokens processed (44 tokens per element)
- [ ] Grid preview verified at 64px
- [ ] Exported to Unity project

**Total per element**: 44 tokens (11 base echo + 11 evolved echo + 11 base voidspawn + 11 evolved voidspawn)
**Total all elements**: 264 tokens

# Graphics Production Plan — Shattered Veil

> Comprehensive graphics plan covering art style, asset pipeline, VFX systems, UI design, and production priority. All art will be AI-generated (Midjourney/Stable Diffusion/DALL-E) with manual cleanup and consistency passes.

---

## 1. Art Style Decision

### Recommended Style: "Painterly Fantasy 2D"

A semi-realistic, painterly 2D style — think **AFK Arena** or **Brown Dust** character portraits combined with cleaner, more readable combat sprites. This balances visual quality with AI-generation feasibility.

**Why this style for Shattered Veil:**

- **Narrative weight**: The story (Lyric's death, Kael's moral compromises, the Veil's corruption) demands emotional resonance. Pixel art reads "retro-cute" — painterly reads "serious fantasy." The tone matches.
- **AI generation strength**: Painterly/illustration is where current AI image tools produce their best, most consistent results. Pixel art from AI tends to be inconsistent at exact pixel level. Chibi requires very tight proportional consistency that AI struggles with across 132 characters.
- **Dual-layer approach**: Full **portrait illustrations** (bust/half-body) for menus and gacha reveals. Simplified **combat tokens** (smaller, top-down or 3/4 view icons) for the grid. This lets us use AI art where it shines (portraits) and use a more controlled pipeline for combat (smaller, stylized).
- **Evolved units**: Painterly style supports "same character, powered up" through color intensity shifts, additional details (armor, wings, aura effects), and glowing accents — all things AI handles well with prompt variations.

### Style Reference Keywords (for AI prompts)

```
Base style: "fantasy character illustration, painterly digital art, soft lighting,
             dark fantasy atmosphere, muted color palette with vibrant accents,
             semi-realistic proportions, detailed but not photorealistic"

Element accents:
  Fire:      warm oranges/reds, ember particles, flame wisps
  Water:     deep blues/teals, water droplets, flowing energy
  Earth:     forest greens/browns, stone textures, vine motifs
  Wind:      soft purples/cyans, air currents, feather details
  Lightning: gold/electric yellow, crackling arcs, sharp highlights
  Force:     deep purple/silver, geometric patterns, solid energy
```

### Color Palette

Established from the existing codebase — these are canonical:

| Element   | Primary     | Hex       | Secondary   | Usage                          |
|-----------|-------------|-----------|-------------|--------------------------------|
| Fire      | OrangeRed   | `#FF4500` | `#ff4444`   | Unit borders, ability VFX, UI  |
| Water     | DodgerBlue  | `#1E90FF` | `#4488ff`   | Unit borders, ability VFX, UI  |
| Earth     | ForestGreen | `#228B22` | `#44aa44`   | Unit borders, ability VFX, UI  |
| Wind      | SkyBlue     | `#87CEEB` | `#aa44ff`   | Unit borders, ability VFX, UI  |
| Lightning | Gold        | `#FFD700` | `#ffcc00`   | Unit borders, ability VFX, UI  |
| Force     | MediumPurple| `#9370DB` | `#cc8844`   | Unit borders, ability VFX, UI  |

**UI accent colors:**
- Rarity: White (Standard), Green (Uncommon), Blue (Rare), Purple (Epic), Orange/Gold (Legendary/Mythic)
- Damage numbers: White (normal), Yellow (crit), Red (DoT), Green (heal), Blue (shield)
- Health bars: Green → Yellow → Red gradient
- Mana bars: Deep blue fill
- Veil corruption: Dark purple/violet shimmer with occasional iridescence

---

## 2. Asset Categories & Specifications

### 2A. Character Portraits (132 total)

**Purpose**: Gacha reveal, roster, team builder, unit detail panel, hero assignment screen.

**Specifications:**
- **Resolution**: 512×768px (portrait orientation, 2:3 ratio) — generates well in AI, scales down cleanly
- **Format**: PNG with transparent background
- **Framing**: Bust to waist, character centered, slight 3/4 angle
- **Background**: Transparent (or simple element-colored gradient for gacha reveal)
- **Consistency markers**: Each portrait must include:
  - Visible element affinity (color accents in clothing/accessories/aura)
  - Archetype readability (Guardian = heavy armor, Predator = light/agile gear, Sorcerer = robes/staves, etc.)
  - Tier indicator via complexity (T1 = simple outfit, T5 = elaborate, ornate, glowing)
- **Evolved variants**: Same character with enhanced details — glowing eyes, additional armor/wings, element-colored aura, more saturated colors. Must be clearly the same person but "powered up."

**Production approach:**
1. Generate **style reference sheet** (6 characters, one per element) — iterate until consistent
2. Use reference sheet as img2img/style input for all subsequent characters
3. Generate in element batches (all 11 Fire, all 11 Water, etc.) for intra-element consistency
4. Each character: generate 4-8 variations, select best, manual cleanup in Photoshop/GIMP
5. Evolved variant: use base portrait as img2img input with "enhanced, glowing, powered up" modifiers

**Batch breakdown:**
| Batch | Count | Elements |
|-------|-------|----------|
| Fire base + evolved | 22 | 11 base characters × 2 |
| Water base + evolved | 22 | 11 base characters × 2 |
| Earth base + evolved | 22 | 11 base characters × 2 |
| Wind base + evolved | 22 | 11 base characters × 2 |
| Lightning base + evolved | 22 | 11 base characters × 2 |
| Force base + evolved | 22 | 11 base characters × 2 |
| **Total** | **132** | |

### 2B. Combat Tokens (132 + 8 bosses)

**Purpose**: Grid-based combat display on the 8×7 battlefield.

**Specifications:**
- **Resolution**: 128×128px (square, fits grid cells)
- **Format**: PNG with transparent background
- **Style**: Top-down 3/4 view, simplified version of the portrait — readable at small size
- **Requirements**:
  - Element border glow (2px colored border matching element)
  - Star indicator (1-3 small stars below token)
  - Must be distinguishable at 64×64 (half-size for dense grids)
  - Clear silhouette — each unit type (Warrior, Tank, Archer, Mage, Assassin, Healer) should have a distinct outline
- **Evolved tokens**: Same as base but with golden border overlay and subtle particle trail
- **Boss tokens**: 256×256px (2×2 grid cells), more detailed, multi-phase variants

**Production approach:**
- Option A: Generate from portraits using AI "chibi/token" style transfer
- Option B: Create a consistent token template per unit type, recolor per element, add unique details
- Option C: Use a sprite sheet generator tool — define silhouettes, apply element colors + details
- **Recommended: Option B** — most consistent results. Create 6 base silhouettes (one per unit type), then customize per character with element colors and small distinguishing details.

### 2C. Boss Art (8 bosses × 2-3 phases each)

**Purpose**: Boss encounters in combat (2×2 grid occupation), boss preview in mission select.

| Boss | Region | Visual Concept | Phases |
|------|--------|---------------|--------|
| Veil Warden | R1 | Corrupted stone guardian, 3m tall, void-cracked stone, ozone aura | 1 (basic) |
| Archon | R2 | Elemental energy crackling across stone skin, arena-born | 2 (stance-shift) |
| Twin Heralds | R3 | Two 1×2 entities, mirror imagery, complementary elements | 2 (kill-order puzzle) |
| Shattered Colossus | R4 | Massive broken statue reassembling, debris field | 3 (cycling mechanics) |
| Elemental Chimera | R5 | Multi-element beast, shifting colors/textures | 3 (element-shift) |
| Prismatic Sentinel | R6 | Crystalline humanoid, rotating color immunity | 3 (rotating vulnerability) |
| Arbiter of Trials | R7 | Judicial figure, imposing, constraint-themed | 2 (mid-fight rules) |
| Void Sovereign | R8 | The final boss — massive, copying units, board-shrinking | 3 (copy→shrink→DPS race) |

**Specifications:**
- **Portrait**: 768×768px for mission preview
- **Combat token**: 256×256px (occupies 2×2 cells)
- **Phase variants**: Color/texture shifts, additional effects, damage states
- **Format**: PNG transparent background

### 2D. Voidspawn Enemy Designs (66 base + 66 evolved variants)

**Purpose**: Enemy units on the battlefield. Voidspawn are the corrupted counterparts to the player's Echoes (summoned units).

**Core Design Philosophy — "Same bones, different skin":**

Voidspawn are NOT darkened/corrupted versions of player units. They are **independently designed creatures** that happen to share the same elemental affinity, combat role, and — if you look carefully — the same underlying structural archetype as their Echo counterpart. The connection should be invisible on first playthrough and a gut-punch on replay.

**How to achieve this:**

The trick is making the *structural* similarities subconscious while the *surface* differences are obvious. A Fire Echo warrior and its Fire Voidspawn counterpart should:
- Share the same **combat silhouette** (similar height, weapon hand, stance width) — for gameplay readability
- Share the same **elemental color family** — but the Voidspawn version is sickly, over-saturated, or chemically wrong (a Fire Echo glows warm orange; a Fire Voidspawn burns acrid yellow-green or deep magenta-red, still "fire" but wrong fire)
- Share **hidden structural echoes** — similar proportions, mirrored poses, analogous weapon shapes — but buried under completely different surface design (organic vs. geometric, armored vs. exposed, humanoid vs. bestial)
- Have **completely different surface aesthetics**: Echoes are luminous, intentional, crafted. Voidspawn are organic, involuntary, grown. Echoes wear armor. Voidspawn have carapace. Echoes carry weapons. Voidspawn have limbs that ARE weapons.

**The "same but wrong" spectrum per element:**

| Element | Echo Aesthetic | Voidspawn Aesthetic | Shared DNA (hidden) |
|---------|--------------|--------------------|--------------------|
| Fire | Warm flame, controlled burn, ember glow | Char, slag, volcanic fissure, heat-without-light | Both radiate from center outward |
| Water | Flowing, reflective, cool clarity | Stagnant, oozing, bioluminescent deep-sea | Both have fluid motion patterns |
| Earth | Solid, rooted, stone/wood/crystal | Calcified, parasitic growth, fossil-like | Both have weight and groundedness |
| Wind | Light, airy, feathered, translucent | Tattered, static-charged, insectoid wing | Both have vertical/upward movement |
| Lightning | Bright arcs, precise, geometric energy | Nerve-like tendrils, erratic sparks, overloaded | Both have branching patterns |
| Force | Clean geometric, gravitational, metallic | Warped geometry, impossible angles, gravity-sick | Both have spatial distortion |

**Design rules for Voidspawn:**
1. **No recoloring.** Every Voidspawn is designed from scratch, referencing its Echo counterpart only for hidden structural DNA.
2. **No "evil" tropes.** No glowing red eyes, no spikes-everywhere, no purple-evil-energy. Voidspawn look *alien*, not villainous. They're creatures of the Otherside, not Saturday morning cartoon bad guys.
3. **Biological, not mechanical.** Echoes can have armor and weapons. Voidspawn grow their own. Chitin, bone, membrane, crystallized void-matter.
4. **Element expressed differently.** A Fire Voidspawn doesn't have decorative flames — it IS thermal, its body radiates, its surface cracks with heat. The element is metabolic, not ornamental.
5. **Tier complexity still applies.** T1 Voidspawn are simple creatures. T5 Voidspawn are terrifyingly intricate.
6. **The replay tell.** Each Echo-Voidspawn pair should share exactly ONE "structural rhyme" that's noticeable only when you see them side by side: same silhouette, same gesture, mirrored pose, analogous anatomy. This is the moment that recontextualizes the entire war.

**Scope: 66 base designs, evolved Voidspawn derived from base.**
- 66 base Voidspawn (one per base unit) — fully original designs
- 66 evolved Voidspawn — built from base Voidspawn with additional corruption/growth (NOT from player evolved art). More mass, more developed features, additional limbs/growths. Same img2img approach as player evolved units.

**Specifications:**
- **Portrait**: 512×768px (same as Echo portraits) — for mission preview, enemy info panels
- **Combat token**: 128×128px (same as Echo tokens) — distinct silhouette from Echo counterpart
- **Format**: PNG with transparent background
- **Visual consistency**: All Voidspawn should feel like they belong to the same ecosystem, even across elements. There's a shared "Otherside biology" underlying all of them.

**Production approach:**
1. **Design 6 Voidspawn anchor designs** (one per element, T3 tier) alongside the 6 Echo anchors in Phase G1. This locks both aesthetics simultaneously.
2. **Generate in element batches** (all Fire Voidspawn together, etc.) — same as Echoes, for intra-element consistency.
3. **Use the Echo portrait as a structural skeleton** — not as img2img input (that would make the connection too obvious), but as a reference for pose, proportions, and silhouette that the AI prompt loosely mirrors.
4. **Separate LoRA or style embedding** for Voidspawn vs. Echoes. The two sets should have distinctly different "feels" even when using the same AI tool.
5. **Evolved Voidspawn**: Use base Voidspawn as img2img input with "more developed, additional growth, larger, more intricate" modifiers. The evolution relationship within Voidspawn mirrors the evolution relationship within Echoes.

**Batch breakdown:**
| Batch | Count | Notes |
|-------|-------|-------|
| Fire Voidspawn base (11) | 11 | Char/slag/volcanic aesthetic |
| Fire Voidspawn evolved (11) | 11 | From base via img2img |
| Water Voidspawn base + evolved (22) | 22 | Deep-sea/stagnant/bioluminescent |
| Earth Voidspawn base + evolved (22) | 22 | Calcified/parasitic/fossil |
| Wind Voidspawn base + evolved (22) | 22 | Insectoid/tattered/static |
| Lightning Voidspawn base + evolved (22) | 22 | Nerve-like/erratic/overloaded |
| Force Voidspawn base + evolved (22) | 22 | Warped geometry/impossible angles |
| **Total** | **132** | |

**AI Prompt Strategy — Voidspawn are a different "species":**

The key to making this work with AI generation is treating Voidspawn prompts as a completely separate creature design pipeline. Don't reference the Echo in the prompt. Instead, reference the Voidspawn aesthetic bible:

```
Voidspawn base style: "alien biological creature, dark fantasy, chitin and membrane,
                        organic weapon-limbs, bioluminescent {element_color} markings,
                        otherworldly anatomy, NOT humanoid armor, NOT evil/demonic,
                        ecosystem creature, painterly digital art, same universe as
                        [style_ref], transparent background"
```

Then for the structural rhyme, manually pose-match in post-processing or use ControlNet (Stable Diffusion) with the Echo's pose as a skeleton guide while generating completely different surface details.

### 2E. Environment/Background Art (8 regions + camp)

**Purpose**: Combat backgrounds, mission select screen, camp screen.

**Specifications:**
- **Resolution**: 1920×1080px (full HD, letterboxed on wider screens)
- **Format**: PNG or layered PSD (for parallax scrolling)
- **Parallax layers**: Background (sky/distant), midground (terrain), foreground (details) — 3 layers minimum

| Region | Setting (from STORY-STAGES-V2.md) | Key Visual Elements |
|--------|-----------------------------------|---------------------|
| R1 — Frontier | Rolling grasslands, wooden palisade, watchtower | Horizon shimmer (Veil), peaceful but wrong sky |
| R2 — Barracks | River valley, training grounds, stone archive | Military activity, flags, arena |
| R3 — Eastern Settlements | Farming country under siege, hillside settlement | Crystal formations, sky flickering |
| R4 — Contested Zone | Ridge overlooking corruption, dense sky-bruise | **Dramatic**: sky tumor, ground hum, darkest palette |
| R5 — Southern Reaches | Mixed terrain, Wellspring discovery | Mysterious energy, ancient ruins |
| R6 — Refugee Corridor | Camps, displacement, desperate defense | Warmth amid despair, fires, huddled figures |
| R7 — Approach | Military staging, seal preparation | Tension, organized chaos, Veil visible |
| R8 — The Veil | Final confrontation, reality-breaking | **Most dramatic**: sky splitting, ground breaking, void energy |
| Camp | Campfire, tents, practice areas | Warm, safe, intimate — contrast to combat |

**Veil progression**: The sky/atmosphere should visibly worsen from R1 to R8:
- R1: Normal sky, slight horizon shimmer
- R3: Occasional sky flickers
- R5: Constant shimmer, crystalline ground patches
- R7: Visible Veil presence, oppressive atmosphere
- R8: Reality breaking apart, void energy everywhere

### 2F. UI Elements

**Screens requiring UI design:**

| Screen | Key Components |
|--------|---------------|
| Camp (Hub) | Practice buttons (8 practices), navigation, VE display, hero portraits |
| Gacha/Attunement Rite | Pull animation, reveal sequence, unit card, rarity effects |
| Roster | Unit grid, filter tabs, sort options, unit cards |
| Team Builder | 4×7 grid, synergy sidebar, unit slots, hero assignment |
| Mission Select | Region map, stage list, lock indicators, star ratings |
| Combat HUD | Health/mana bars, status icons, speed controls, scoreboard |
| Unit Detail Panel | Portrait, stats, ability description, items, evolution info |
| Hero Management | Hero portrait, skill tree, branch selection, level/XP |
| Item/Equipment | 8 equipment slots, item cards, affixes, Echo Shaping UI |

**UI Style:**
- Dark fantasy theme — dark backgrounds (#1a1a2e or similar), subtle texture
- Element-colored accents for active/selected states
- Thin borders, soft glow effects for interactivity
- Font: Clean sans-serif for stats/numbers, serif accent for headers/names
- Button states: idle (muted), hover (brighten), pressed (element glow), disabled (greyed)

**UI Specifications:**
- Design at 1920×1080, scale with Canvas Scaler (reference resolution)
- All UI elements as 9-sliced sprites where possible (panels, buttons, frames)
- Icon set needed: 9 archetype icons, 6 element icons, status effect icons, item rarity frames

### 2G. VFX & Particle Effects

**Combat VFX (referenced from COMBAT-DESIGN.md §11):**

| Category | Assets Needed | Style |
|----------|--------------|-------|
| Damage numbers | Floating text prefab | Color-coded, size-scaled, fade-out |
| Health/mana bars | Thin bar sprites | Green→yellow→red gradient, blue mana fill |
| Status effect icons | ~15 icon sprites | Stun⭐, Silence🚫, Root🌿, Burn🔥, etc. |
| Ability cast glow | Element-colored glow shader | Brief flash on caster |
| Projectiles | Per-element projectile sprites (6) | Fire=fireball, Water=water bolt, etc. |
| AoE indicators | Circle/cone overlays | Red danger zones (boss telegraph), blue ally zones |
| Death animation | Dissolve/fade shader | 0.5s dissolve, ghost cell marker |
| Movement trail | Element-colored blur trail | Fast for assassin dash, subtle for normal |
| Crit flash | Screen-edge flash | Brief yellow flash |
| Shield visual | Blue border glow | Overlay on health bar |
| Burn particles | Orange flame wisps | Attach to burning unit |
| Poison particles | Green bubbles | Attach to poisoned unit |
| Bleed particles | Red drips | Attach to bleeding unit |
| Regen particles | Green plus signs | Float up from healing unit |
| Boss phase transition | Screen shake + color shift | 2s invulnerability window |
| Boss telegraph | Red cell highlights | 2s warning before AoE damage |

**Gacha VFX:**
- Pull animation: Veil energy swirling, crystal forming
- Reveal: Rarity-colored burst (white/green/blue/purple/gold)
- T5 reveal: Extended animation with screen flash, unique sound

**Camp/UI VFX:**
- Building/practice level-up: Sparkle effect
- Evolution: Golden transformation burst
- Star-up: Star appears and locks in with flash
- Echo Shaping: Item crafting energy swirl

### 2H. Animation Requirements

**Combat unit animations** (per unit, applied to combat token):

| Animation | Frames | Duration | Notes |
|-----------|--------|----------|-------|
| Idle | 4-6 | Loop 1s | Subtle breathing/bobbing |
| Attack | 3-4 | 0.3s | Quick strike motion |
| Ability cast | 4-6 | 0.5s | Element-colored glow buildup → release |
| Hit/damage | 2-3 | 0.2s | Flash red, slight knockback |
| Death | 4-6 | 0.5s | Dissolve/fade |
| Move | 2-4 | Per cell | Slight bob while moving |

**For AI-generated art, animations will primarily be achieved through:**
- Shader effects (glow, dissolve, color tint) rather than frame-by-frame
- Tweening (position, scale, rotation, alpha) via DOTween or Unity's animation system
- Particle systems overlaid on static sprites
- This is the practical approach — AI can't generate sprite sheets with frame-by-frame animation consistency

**Hero-specific animations:**
- Hero portrait "breathing" (subtle scale pulse) in management screen
- Skill unlock: branch lights up with hero-themed color
- Hero assignment: portrait slides into slot with element flash

---

## 3. AI Art Generation Pipeline

### 3.1 Tool Selection

| Tool | Best For | Consistency | Notes |
|------|----------|-------------|-------|
| **Midjourney** | Portraits, environments | High (with style refs) | Best quality for painterly fantasy |
| **Stable Diffusion (local)** | Batch generation, consistency | Medium-High (with LoRA) | Train a LoRA on approved reference images |
| **DALL-E 3** | Quick concepts, icons | Medium | Good for ideation, less control |
| **Photoshop/GIMP** | Cleanup, compositing | N/A | Post-processing all AI output |

**Recommended workflow:**
1. **Midjourney** for initial style exploration and hero/boss portraits (highest quality)
2. **Stable Diffusion with custom LoRA** for batch unit generation (consistency at scale)
3. **Manual cleanup** pass on everything (remove artifacts, fix hands, ensure readability)

### 3.2 Consistency Strategy

The #1 challenge with 132 AI-generated characters is **style drift**. Mitigations:

1. **Style reference sheet**: Generate 6 "anchor" characters (one per element, varying archetypes). These become the style bible. All subsequent generation references these.
2. **Element-batch generation**: Generate all Fire units together, all Water together, etc. Intra-batch consistency is higher than cross-batch.
3. **Prompt template system**: Standardized prompts with only the character-specific details varying:
   ```
   [STYLE_REF], [UNIT_NAME], [ELEMENT] element fantasy warrior,
   [ARCHETYPE_DESCRIPTION], [UNIT_TYPE] class, [TIER_COMPLEXITY],
   [ELEMENT_COLOR_ACCENTS], portrait, bust shot, transparent background,
   painterly digital art, dark fantasy, --ar 2:3 --style raw
   ```
4. **LoRA training** (Stable Diffusion): After approving the 6 anchor characters, train a LoRA on those + any other approved outputs. This locks the style for batch production.
5. **Post-processing template**: Standard Photoshop actions for border glow, element tint adjustment, background removal, size normalization.

### 3.3 Quality Gates

Every asset goes through:
1. **Generation**: AI produces 4-8 candidates
2. **Selection**: Best candidate chosen (element readability, archetype clarity, tier complexity)
3. **Cleanup**: Remove AI artifacts, fix anatomy issues, ensure transparent background
4. **Element check**: Element color accents visible and correct
5. **Readability check**: Distinguishable at target size (128×128 for combat, 512×768 for portrait)
6. **Evolved pairing**: Base and evolved placed side-by-side — must be recognizably the same character
7. **Batch review**: All units of same element reviewed together for consistency

---

## 4. Production Priority Order

### Phase G1: Style Foundation (this session / next session)

**Goal**: Establish the visual identity. Everything else builds on this.

| Task | Output | Est. Time |
|------|--------|-----------|
| Generate 6 Echo anchor character portraits (1 per element) | 6 PNG portraits | 2-3 hours |
| Generate 6 Voidspawn anchor creature designs (1 per element) | 6 PNG portraits | 3-4 hours |
| **Review Echo↔Voidspawn pairs** — verify structural rhyme is present but not obvious | Pass/fail per pair | 1-2 hours |
| Generate camp background concept | 1 environment PNG | 1 hour |
| Generate R1 combat background concept | 1 environment PNG | 1 hour |
| Design UI mockup for combat HUD | 1 mockup image | 1-2 hours |
| Design UI mockup for camp screen | 1 mockup image | 1-2 hours |
| Create element icon set (6 icons) | 6 PNG icons | 1 hour |
| Create archetype icon set (9 icons) | 9 PNG icons | 1 hour |
| **Define style guide document** with approved references | 1 MD file | 1 hour |

**Critical**: The 6 Echo and 6 Voidspawn anchors must be developed together. They define the two visual poles of the game — the clean luminous Echoes and the alien biological Voidspawn. Getting this duality right in Phase G1 saves massive rework later.

**Deliverable**: GRAPHICS-STYLE-GUIDE.md with approved reference images for BOTH Echoes and Voidspawn, color specs, typography choices, and UI patterns. This is the bible for all subsequent art production.

### Phase G2: Hero & Boss Portraits (highest impact)

**Goal**: The 6 story heroes and 8 bosses are the highest-visibility art in the game. These sell the experience.

| Task | Output | Est. Time |
|------|--------|-----------|
| 6 hero portraits (Kael, Lyric, Ren, Sera, Maren, Voss) | 6 PNG portraits (512×768) | 3-4 hours |
| 6 hero skill tree icons (branch identifiers) | 12 PNG icons | 1 hour |
| 8 boss portraits (mission preview) | 8 PNG portraits (768×768) | 4-5 hours |
| 8 boss combat tokens (phase 1) | 8 PNG tokens (256×256) | 2-3 hours |
| Boss phase variant tokens (phases 2-3) | ~14 PNG tokens | 3-4 hours |

### Phase G3: Unit Portraits (batch production)

**Goal**: All 132 character portraits for roster, gacha, and team builder.

| Batch | Count | Est. Time |
|-------|-------|-----------|
| Fire base (11) | 11 portraits | 2-3 hours |
| Fire evolved (11) | 11 portraits | 1-2 hours (img2img from base) |
| Water base + evolved (22) | 22 portraits | 3-4 hours |
| Earth base + evolved (22) | 22 portraits | 3-4 hours |
| Wind base + evolved (22) | 22 portraits | 3-4 hours |
| Lightning base + evolved (22) | 22 portraits | 3-4 hours |
| Force base + evolved (22) | 22 portraits | 3-4 hours |
| Quality review + cleanup pass | All 132 | 4-6 hours |

### Phase G3B: Voidspawn Portraits (batch production)

**Goal**: All 132 Voidspawn designs (66 base + 66 evolved) — the enemy side of the visual identity.

**Key difference from Echo production**: Voidspawn use a separate LoRA/style embedding. They're generated as original creature designs, not as modifications of Echoes. The structural rhyme with each Echo counterpart is achieved through pose reference (ControlNet or manual) and post-processing review — never through direct style transfer from the Echo portrait.

| Batch | Count | Est. Time |
|-------|-------|-----------|
| Fire Voidspawn base (11) | 11 creatures | 3-4 hours |
| Fire Voidspawn evolved (11) | 11 creatures | 2-3 hours (img2img from Voidspawn base) |
| Water Voidspawn base + evolved (22) | 22 creatures | 4-5 hours |
| Earth Voidspawn base + evolved (22) | 22 creatures | 4-5 hours |
| Wind Voidspawn base + evolved (22) | 22 creatures | 4-5 hours |
| Lightning Voidspawn base + evolved (22) | 22 creatures | 4-5 hours |
| Force Voidspawn base + evolved (22) | 22 creatures | 4-5 hours |
| **Structural rhyme review** — pair each Voidspawn with its Echo, verify hidden similarity | All 66 pairs | 3-4 hours |
| Quality + consistency pass | All 132 | 4-6 hours |

**Structural rhyme review process:**
1. Place Echo and Voidspawn side by side at full resolution
2. Check: Can you see the shared pose/proportions/silhouette? Good — the rhyme exists.
3. Check: Is it immediately obvious they're counterparts? If yes, the Voidspawn needs redesigning — the connection is too surface-level.
4. Check: If you squint or silhouette both, do they "rhyme"? That's the sweet spot.
5. Iterate on any pairs that fail either direction (too obvious or no connection at all).

### Phase G4: Combat Tokens

**Goal**: Grid-ready tokens for all units.

| Task | Output | Est. Time |
|------|--------|-----------|
| Create 6 Echo silhouette templates (per unit type) | 6 template PNGs | 2 hours |
| Generate/customize 66 Echo base tokens | 66 PNG tokens (128×128) | 4-6 hours |
| Generate 66 Echo evolved tokens (golden border + effects) | 66 PNG tokens | 3-4 hours |
| Create 6 Voidspawn silhouette templates (per unit type) | 6 template PNGs | 2 hours |
| Generate/customize 66 Voidspawn base tokens | 66 PNG tokens (128×128) | 4-6 hours |
| Generate 66 Voidspawn evolved tokens | 66 PNG tokens | 3-4 hours |
| Add element border glow to all (Echoes + Voidspawn) | Shader/overlay | 1 hour |
| **Readability test**: Echo vs Voidspawn tokens distinguishable at 64×64 | Pass/fail | 1 hour |

### Phase G5: Environments

**Goal**: 8 region combat backgrounds + camp background.

| Task | Output | Est. Time |
|------|--------|-----------|
| 8 region backgrounds (3-layer parallax) | 24 PNG layers | 6-8 hours |
| Camp background | 3 PNG layers | 1-2 hours |
| Mission select map (region overview) | 1 illustrated map | 2-3 hours |

### Phase G6: UI Implementation

**Goal**: Replace placeholder UI with styled components.

| Task | Output | Est. Time |
|------|--------|-----------|
| Panel/frame 9-slice sprites | ~10 PNG sprites | 2 hours |
| Button sprites (states: idle, hover, pressed, disabled) | ~8 sprite sets | 2 hours |
| Item rarity frames (5 tiers) | 5 PNG frames | 1 hour |
| Status effect icon set (15 icons) | 15 PNG icons | 2 hours |
| Gacha reveal sequence sprites/effects | 5 rarity tiers | 3 hours |
| Camp practice icons (8 practices) | 8 PNG icons | 1 hour |
| Star rating icons | 3 PNG sprites | 0.5 hours |

### Phase G7: VFX & Particles (can parallelize with G3-G6)

**Goal**: Combat VFX using Unity's particle system + shaders.

| Task | Output | Notes |
|------|--------|-------|
| Damage number prefab | 1 prefab + script | TextMeshPro, color-coded, pooled |
| Health/mana bar prefab | 1 prefab | Slider-based, color gradient shader |
| Element projectiles (6) | 6 particle systems | One per element |
| AoE indicator prefab | 1 prefab + shader | Red/blue zone overlay |
| Death dissolve shader | 1 shader | Dissolve effect on sprite |
| Ability cast glow shader | 1 shader | Element-colored bloom |
| Status effect particle set | 4 particle systems | Burn, Poison, Bleed, Regen |
| Boss telegraph overlay | 1 prefab | Grid cell highlight system |
| Screen shake component | 1 script | For boss transitions, crits |

**Note on VFX**: Most combat VFX can be built with Unity's built-in Particle System + Shader Graph (URP). These don't require external art — they're code/shader-driven. This means **VFX work can start immediately** regardless of character art progress.

---

## 5. Unity Integration Notes

### Folder Structure for Art Assets

```
unity/Assets/Art/
├── Portraits/
│   ├── Echoes/            (player units)
│   │   ├── Fire/          (22 PNGs: 11 base + 11 evolved)
│   │   ├── Water/         (22 PNGs)
│   │   ├── Earth/         (22 PNGs)
│   │   ├── Wind/          (22 PNGs)
│   │   ├── Lightning/     (22 PNGs)
│   │   └── Force/         (22 PNGs)
│   ├── Voidspawn/         (enemy units)
│   │   ├── Fire/          (22 PNGs: 11 base + 11 evolved)
│   │   ├── Water/         (22 PNGs)
│   │   ├── Earth/         (22 PNGs)
│   │   ├── Wind/          (22 PNGs)
│   │   ├── Lightning/     (22 PNGs)
│   │   └── Force/         (22 PNGs)
│   ├── Heroes/            (6 PNGs)
│   └── Bosses/            (8 PNGs)
├── Tokens/
│   ├── Echoes/            (132 PNGs, 128×128)
│   ├── Voidspawn/         (132 PNGs, 128×128)
│   └── Bosses/            (8 base + ~14 phase variants, 256×256)
├── Backgrounds/
│   ├── Combat/            (8 regions × 3 layers = 24 PNGs)
│   ├── Camp/              (3 layers)
│   └── MissionSelect/     (1 map PNG)
├── UI/
│   ├── Panels/            (9-slice frames)
│   ├── Buttons/           (state sprites)
│   ├── Icons/
│   │   ├── Elements/      (6 PNGs)
│   │   ├── Archetypes/    (9 PNGs)
│   │   ├── StatusEffects/ (15 PNGs)
│   │   ├── Practices/     (8 PNGs)
│   │   └── Misc/          (stars, rarity frames, etc.)
│   └── Gacha/             (reveal sequence assets)
├── VFX/
│   ├── Materials/
│   ├── Textures/
│   └── Shaders/
└── Sprites/
    └── Shared/            (common sprite atlas assets)
```

### Sprite Atlas Strategy
- Group by screen: Combat atlas, Camp atlas, Gacha atlas, UI atlas
- Combat atlas includes: all 132 tokens + boss tokens + status icons + VFX sprites
- Keep portraits OUT of atlases (they're large individual textures, loaded per-character)

### Import Settings for Art Assets
- **Portraits**: Texture Type=Sprite, Filter Mode=Bilinear, Max Size=1024, Compression=High Quality
- **Combat tokens**: Texture Type=Sprite, Filter Mode=Point (crisp at small sizes), Max Size=256, Pack into Sprite Atlas
- **Backgrounds**: Texture Type=Sprite, Filter Mode=Bilinear, Max Size=2048
- **UI elements**: Texture Type=Sprite, 9-slice configured, Pack into UI Atlas
- **All sprites**: Pixels Per Unit=100 (standard), Pivot=Center

### Addressables Setup
- Unit portraits loaded on-demand (gacha reveal, unit detail panel)
- Combat tokens for current battle loaded as a batch
- Region backgrounds loaded when entering region
- UI assets always loaded (small, frequently needed)

---

## 6. Audio Plan (Outline)

Audio is lower priority than visual art but should be planned now for later production.

### BGM (Background Music)

| Track | Mood | Loop Duration |
|-------|------|--------------|
| Camp theme | Warm, safe, contemplative | 2-3 min |
| Combat (normal) | Energetic, tactical | 2-3 min |
| Combat (boss) | Intense, dramatic, escalating per phase | 3-4 min |
| Gacha/Attunement | Mystical, anticipatory | 1-2 min |
| Story/cutscene (R1-R3) | Adventurous, hopeful | 2-3 min |
| Story/cutscene (R4) | Tragic, tense, emotional | 2-3 min |
| Story/cutscene (R5-R7) | Determined, rebuilding | 2-3 min |
| Story/cutscene (R8) | Epic, final, desperate | 3-4 min |

### SFX

| Category | Count | Examples |
|----------|-------|---------|
| UI | ~15 | Button click, tab switch, level up, star earned, error |
| Combat | ~20 | Hit (melee/ranged), crit, ability cast (per element), death, heal |
| Gacha | ~5 | Pull start, reveal (per rarity tier), T5 special |
| Items | ~5 | Equip, unequip, craft, enhance success/fail |

### Audio Source
- **AI-generated**: Suno, Udio, or similar for BGM drafts
- **Free SFX libraries**: Freesound.org, Mixkit, Sonniss GDC bundles
- **Commission**: If budget allows, commission 2-3 key tracks (camp, combat, R4/R8 story)

---

## 7. Risk Assessment & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| AI style drift across 132 Echo characters | High | High | LoRA training, batch generation, strict style refs, post-processing templates |
| AI style drift across 132 Voidspawn creatures | High | High | Separate Voidspawn LoRA, batch by element, "Otherside biology" consistency pass |
| Voidspawn↔Echo connection too obvious | High | High | Never use Echo as img2img input; generate Voidspawn independently; rhyme only through pose/silhouette |
| Voidspawn↔Echo connection nonexistent | Medium | Medium | Use ControlNet pose reference from Echo; post-production silhouette overlay check for each pair |
| Voidspawn look "generic evil" (dark recolor) | High | Medium | Enforce alien/biological design rules; no red eyes, no spikes-everywhere, no purple evil energy |
| AI generates inconsistent anatomy/hands | Medium | High | Manual cleanup pass on every asset, crop to bust for portraits |
| Combat tokens: Echoes vs Voidspawn not distinguishable | High | Medium | Different silhouette family (organic vs. crafted), distinct border treatment, readability test at 64×64 |
| Evolved units not recognizable as same character | High | Medium | Use base as img2img input, maintain face/hair, only modify outfit/aura |
| Total asset count (264 portraits + 264 tokens + bosses + environments) overwhelming | High | Medium | Strict phase ordering, batch production, accept "good enough" for T1-T2, perfectionism only for T4-T5 and heroes |
| Background art clashes with character art style | Medium | Medium | Generate backgrounds with same style keywords, review against character batch |
| VFX performance on mobile (future) | Medium | Low (PC first) | Use GPU particles, object pooling, LOD for effects |
| Portrait file sizes bloat game (now 264 portraits) | Medium | Medium | Addressables for on-demand loading, compress aggressively, Voidspawn atlas per region (only load enemies for current region) |

---

## 8. Dependencies & Parallel Work

### What can start NOW (no Unity code dependency):
- Art style exploration and anchor character generation (Phase G1)
- Hero portrait generation (Phase G2)
- Environment concept art (Phase G5 — start with R1 and Camp)
- UI mockups for all screens
- VFX planning and shader prototyping

### What needs Unity project scaffolded (Prompt 34 done):
- VFX particle system implementation (Phase G7)
- UI sprite slicing and atlas configuration (Phase G6)
- Sprite import and Addressables setup

### What needs game systems ported (Prompts 36+ done):
- Combat token integration (wire tokens to CombatUnit)
- Ability VFX triggering (needs AbilityExecutor events)
- Status effect icon display (needs StatusEffectSystem events)
- Boss phase visual transitions (needs BossSystem events)

### What needs story system (Track C):
- Cutscene art (character positioning, camera framing)
- Environmental storytelling pass (R1-R8 background details per stage)
- Character emotion variants (happy, angry, sad, determined — for dialogue scenes)

---

## 9. Quick Start — What To Do First

If you want to start producing graphics assets today:

1. **Pick an AI tool** and generate the 6 Echo anchor characters (one per element):
   - Fire T3 Warrior (mid-complexity, warm palette) — luminous, controlled flame spirit
   - Water T2 Mage (simpler, cool blues) — flowing, reflective energy
   - Earth T4 Tank (complex, greens/browns) — solid, rooted, crystalline
   - Wind T1 Archer (simple, light purples/cyans) — light, airy, translucent
   - Lightning T3 Assassin (mid-complexity, gold/electric) — bright arcs, precise
   - Force T5 Healer (most complex, purple/silver) — geometric, gravitational

2. **Immediately generate 6 Voidspawn counterparts** for the same elements/roles:
   - Fire T3 Voidspawn — char, slag, volcanic fissure, heat-without-light
   - Water T2 Voidspawn — stagnant, bioluminescent, deep-sea horror
   - Earth T4 Voidspawn — calcified, parasitic growth, fossil come alive
   - Wind T1 Voidspawn — insectoid, tattered membrane, static-charged
   - Lightning T3 Voidspawn — nerve-like tendrils, erratic overload
   - Force T5 Voidspawn — warped geometry, impossible angles, gravity-sick

3. **Review all 6 pairs side by side.** For each pair ask: "Do these share hidden structural DNA without being obviously related?" If the connection is too obvious, redesign the Voidspawn. If there's no connection at all, adjust the Voidspawn's pose/silhouette to rhyme more closely.

4. Generate Kael's portrait (the protagonist). He's Earth element, Protection philosophy, the team's frontline leader. His art sets the tone for the whole game.

5. Generate the R1 Frontier background — grasslands, palisade walls, horizon shimmer.

6. With those ~14 approved assets (6 Echo + 6 Voidspawn + Kael + R1 background), write the **GRAPHICS-STYLE-GUIDE.md** that all future generation references.

---

## 10. Missing Asset Checklist (from design doc audit)

Items identified during cross-reference with ITEMS-DESIGN.md, HERO-REWORK.md, and PROGRESSION-REWORK.md that need explicit coverage:

### Item Enhancement Visuals
Enhancement levels (+0 to +10) need visual indicators on equipped items:
- +0 to +3: No special effect
- +4 to +6: Subtle glow matching element color (shader)
- +7 to +9: Bright glow with particle trail (shader + particles)
- +10: Rainbow shimmer (same effect as Transcendent unit border)
- **Needs**: 3 enhancement glow shaders (subtle, bright, rainbow), applied to item frames in UI and combat tokens

### Gem Visuals
9 gem types × 4 rarities = up to 36 distinct gem icons:
- Ruby, Sapphire, Emerald, Topaz, Diamond, Amethyst, Opal, Onyx, Prismatic
- Each in Standard/Uncommon/Rare/Epic rarity (color saturation + border)
- **Needs**: 9 base gem icons (recolored per rarity), gem socket indicator on item tooltips

### Mythic Item Visual Identity
6 mythic items need unique visual treatment distinct from standard and ability items:
- Unique icon frame (gold + animated border?)
- Mythic items should feel legendary — more ornate than Epic rarity
- **Needs**: 1 mythic frame template, 6 unique mythic item icons

### Hero Assignment Indicator
How players see which unit has which hero assigned — design decision needed:
- Option A: Colored border matching hero's philosophy color
- Option B: Small hero portrait icon in corner of unit token
- Option C: Subtle aura/particle effect on unit
- **Recommended**: Option B (small portrait icon) — most readable at small sizes
- **Needs**: 6 mini hero icons (32×32), corner overlay positioning

### Hero Narrative State Visuals
Heroes have story-driven availability changes:
- Lyric dies permanently in R4 — portrait needs "deceased/unavailable" state (greyscale + veil overlay?)
- Sera/Maren leave temporarily in R4 — need "away" state (dimmed + absent icon?)
- **Needs**: 2 portrait overlay states (deceased, away), applied to hero management screen

### Camp Practice Visual Design
8 practice icons need thematic designs aligned to lore:
| Practice | Visual Concept |
|----------|---------------|
| Attunement Rite | Swirling veil energy, crystal focus |
| Sustained Bonds | Interlinked chain/thread motif |
| Essence Reservoir | Glowing vessel, contained energy |
| Echo Shaping | Anvil + resonance waves |
| Deep Resonance | Transformation cocoon, golden light |
| Prism Focus | Gem/crystal with light refraction |
| Veil Wellspring | Flowing energy spring |
| Kindred Circle | Connected silhouettes, bonding light |

### Enhancement Readability at Combat Token Size
Enhancement glows on 128×128 combat tokens need testing — the visual must be readable at half-size (64×64) alongside element border, star indicators, and evolved golden border. Risk of visual noise. Plan: use outline glow (outer border) not overlay glow (covering the token).

---

## Appendix A: Full Unit List for Art Production

Organized by element and tier. See `units-templates.js` for full stat blocks and descriptions.

### Fire (11 base + 11 evolved = 22)
- T1: Flame Warrior, Flame Shieldbearer, Cinder Archer, Fire Acolyte
- T2: Inferno Fox, Pyro Knight, Ember Scout
- T3: Salamander Sage, Blaze Berserker
- T4: Ashen Watcher (Sage/Healer)
- T5: Phoenix
- All 11 have evolved forms

### Water (11 base + 11 evolved = 22)
- T1: Aqua Sentinel, Tide Caller, Frost Archer, Stream Priestess
- T2: Coral Guardian, Depth Striker, Whirlpool Mage
- T3: Maelstrom Knight, Abyssal Weaver
- T4: Abyssal Guardian (Guardian/Tank)
- T5: Kraken
- All 11 have evolved forms

### Earth (11 base + 11 evolved = 22)
- T1: Stone Soldier, Clay Golem, Thorn Archer, Moss Healer
- T2: Mountain Lord, Iron Stomper, Root Mage
- T3: Terra Warden, Crystal Sage
- T4: Grove Warden (Ranger/Archer)
- T5: World Tree
- All 11 have evolved forms

### Wind (11 base + 11 evolved = 22)
- T1: Gale Striker, Breeze Shield, Sky Archer, Wind Dancer
- T2: Storm Assassin, Cloud Rider, Zephyr Mage
- T3: Typhoon Blade, Mistral Seer
- T4: Tempest Weaver (Sorcerer/Mage)
- T5: Storm Phoenix
- All 11 have evolved forms

### Lightning (11 base + 11 evolved = 22)
- T1: Spark Soldier, Thunder Guard, Bolt Archer, Static Healer
- T2: Lightning Fang, Charged Sentinel, Arc Mage
- T3: Thunderlord, Volt Sage
- T4: Voltfang Stalker (Predator/Assassin)
- T5: Storm Titan
- All 11 have evolved forms

### Force (11 base + 11 evolved = 22)
- T1: Steel Warrior, Iron Bulwark, Steel Archer, Force Mender
- T2: Kinetic Blade, Gravity Anchor, Psi Mage
- T3: Warp Striker, Null Sage
- T4: Iron Duelist (Duelist/Warrior)
- T5: Void Wyrm
- All 11 have evolved forms

### Bosses (8)
- Veil Warden, Archon, Twin Heralds, Shattered Colossus
- Elemental Chimera, Prismatic Sentinel, Arbiter of Trials, Void Sovereign

### Heroes (6)
- Kael (Protection), Lyric (Efficiency), Ren (Steadfast)
- Sera (Precision), Maren (Sustain), Voss (Momentum)

---

## Appendix B: Prompt Templates for AI Generation

### Character Portrait Template (Midjourney)
```
{character_name}, {element} element fantasy {unit_type},
{archetype_description}, {tier_visual_complexity},
{element_color} color accents in clothing and accessories,
portrait, bust to waist, 3/4 angle view, transparent background,
painterly digital art, dark fantasy atmosphere,
soft dramatic lighting, muted palette with vibrant {element_color} accents,
semi-realistic proportions, detailed armor/clothing --ar 2:3 --style raw --v 6
```

### Evolved Character Template
```
{character_name} Evolved form, same character as [base_ref],
enhanced armor with golden trim, glowing {element_color} eyes,
{element} energy aura, more ornate details, powered-up version,
portrait, bust to waist, 3/4 angle view, transparent background,
painterly digital art, dark fantasy atmosphere --ar 2:3 --style raw --v 6
```

### Boss Portrait Template
```
{boss_name}, massive {description}, {height} tall,
dark fantasy boss creature, {element_visual_effects},
intimidating presence, detailed texture,
painterly digital art, epic scale, dramatic lighting --ar 1:1 --style raw --v 6
```

### Environment Template
```
{region_name}, {description}, fantasy landscape,
{key_visual_elements}, {sky_condition},
wide establishing shot, atmospheric perspective,
painterly digital art, dark fantasy world, {mood} mood,
rich environmental detail --ar 16:9 --style raw --v 6
```

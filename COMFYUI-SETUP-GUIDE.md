# ComfyUI Setup Guide — Shattered Veil Art Pipeline

> Step-by-step guide to install Stable Diffusion (free, local, open-source) via ComfyUI on your Windows PC with NVIDIA GPU. Tailored for the Shattered Veil character art pipeline.

---

## Prerequisites

Before starting, confirm you have:
- **Windows 10 or 11**
- **NVIDIA GPU with 8GB+ VRAM** (RTX 3060 or better)
- **Up-to-date NVIDIA drivers** — check at https://www.nvidia.com/Download/index.aspx
- **At least 25GB free disk space** on an SSD (models are large files)
- **16GB+ system RAM** (32GB recommended for SDXL)

To check your GPU and VRAM: open Task Manager → Performance → GPU. Your VRAM is listed under "Dedicated GPU memory."

---

## Step 1: Install ComfyUI Desktop (Recommended Method)

ComfyUI Desktop is the easiest way to get started. It handles Python, CUDA, and dependencies automatically.

1. Go to **https://www.comfy.org/download**
2. Download the **Windows** installer
3. Run the installer — it will:
   - Install an isolated Python environment (won't conflict with your system Python)
   - Install PyTorch with CUDA support (for your NVIDIA GPU)
   - Set up the ComfyUI server and web interface
4. Launch ComfyUI Desktop when installation completes
5. It will open a browser window at **http://127.0.0.1:8188** — this is your workspace

**Note**: First launch takes a few minutes while it downloads dependencies. Be patient.

### Alternative: Portable Version (if Desktop doesn't work)

1. Go to **https://github.com/comfyanonymous/ComfyUI/releases**
2. Download the latest `ComfyUI_windows_portable_*.7z`
3. Extract with **7-Zip** (free: https://7-zip.org) to a folder on your SSD, e.g. `D:\ComfyUI\`
4. Navigate to the extracted folder
5. Double-click **`run_nvidia_gpu.bat`**
6. Browser opens at http://127.0.0.1:8188

---

## Step 2: Download Your First Model Checkpoint

The checkpoint is the core AI model that generates images. You need to download one and place it in the right folder.

### Recommended Checkpoint: DreamShaper XL

Best starting point for painterly fantasy illustration — versatile, good at characters and environments, handles both realistic and stylized output.

1. Go to **https://civitai.com/models/112902/dreamshaper-xl**
2. Download the latest version (`.safetensors` file, ~6.5GB)
3. Place it in: `ComfyUI/models/checkpoints/`
   - For Desktop install: check Settings for your models folder location
   - For Portable: it's inside your extracted `ComfyUI_windows_portable/ComfyUI/models/checkpoints/`

### Alternative Checkpoints (download later as needed)

| Model | Best For | Link |
|-------|----------|------|
| **Juggernaut XL** | All-around quality, very popular | civitai.com/models/133005 |
| **Illustrious XL** | Anime/illustration style | civitai.com/models/795765 |
| **Pony Diffusion XL** | Stylized 2D characters | civitai.com (search "Pony Diffusion") |
| **SDXL Base 1.0** | Vanilla foundation model | huggingface.co/stabilityai/stable-diffusion-xl-base-1.0 |

You can have multiple checkpoints installed and switch between them in ComfyUI.

---

## Step 3: Download a VAE (Visual Quality Boost)

The VAE (Variational Auto-Encoder) improves color accuracy and image sharpness. SDXL comes with one built-in, but an explicit one is better.

1. Go to **https://huggingface.co/stabilityai/sdxl-vae/tree/main**
2. Download `sdxl_vae.safetensors` (~335MB)
3. Place it in: `ComfyUI/models/vae/`

---

## Step 4: Test Your First Generation

Let's verify everything works before adding more tools.

1. Open ComfyUI in your browser (http://127.0.0.1:8188)
2. You should see a default workflow with connected nodes
3. In the **Load Checkpoint** node, select your DreamShaper XL model
4. In the **CLIP Text Encode (Positive)** node, type a test prompt:
   ```
   fantasy warrior character, fire element, glowing ember armor,
   painterly digital art, dark fantasy, portrait, bust shot,
   transparent background, detailed, soft dramatic lighting
   ```
5. In the **CLIP Text Encode (Negative)** node, type:
   ```
   photo, 3d render, blurry, low quality, deformed, ugly,
   text, watermark, signature, extra limbs, bad anatomy
   ```
6. In the **Empty Latent Image** node, set:
   - Width: **768**
   - Height: **1152** (this gives us the 2:3 portrait ratio for character art)
7. Click **Queue Prompt** (or press Ctrl+Enter)
8. Wait 15-45 seconds depending on your GPU
9. An image should appear in the preview node

**If it works** — congratulations, you have a working Stable Diffusion setup. Move to Step 5.

**If it fails:**
- Out of memory error → Reduce resolution to 512×768, or close other GPU-intensive apps
- No model found → Double-check the checkpoint file is in the correct `models/checkpoints/` folder
- CUDA error → Update your NVIDIA drivers

---

## Step 5: Install ComfyUI Manager (Essential Plugin Manager)

ComfyUI Manager lets you install custom nodes (plugins) with one click. You'll need this for ControlNet and other tools.

1. In ComfyUI, look for a **Manager** button in the top menu bar
   - If using ComfyUI Desktop, it may already be installed
2. If not installed:
   - Close ComfyUI
   - Open a terminal/command prompt in your ComfyUI folder
   - Navigate to `ComfyUI/custom_nodes/`
   - Run: `git clone https://github.com/ltdrdata/ComfyUI-Manager.git`
   - Restart ComfyUI
3. You should now see a **Manager** button in the interface

---

## Step 6: Install ControlNet (For Voidspawn Pose Matching)

ControlNet lets you control the pose/composition of generated images. This is critical for the Echo↔Voidspawn structural rhyme — you'll feed in an Echo's pose and generate a completely different creature with the same silhouette.

### 6A: Install the ControlNet Nodes

1. Click **Manager** → **Custom Nodes Manager**
2. Search for **"comfyui_controlnet_aux"**
3. Click **Install** on "ComfyUI's ControlNet Auxiliary Preprocessors"
4. Restart ComfyUI when prompted

### 6B: Download ControlNet Models

You need two ControlNet models for your workflow:

**OpenPose (for character poses):**
1. Go to **https://huggingface.co/thibaud/controlnet-openpose-sdxl-1.0/tree/main**
2. Download `diffusion_pytorch_model.safetensors` (~2.5GB)
3. Rename it to `controlnet-openpose-sdxl.safetensors` (for clarity)
4. Place in: `ComfyUI/models/controlnet/`

**Canny (for edge/outline control):**
1. Go to **https://huggingface.co/diffusers/controlnet-canny-sdxl-1.0/tree/main**
2. Download `diffusion_pytorch_model.safetensors`
3. Rename to `controlnet-canny-sdxl.safetensors`
4. Place in: `ComfyUI/models/controlnet/`

### 6C: Test ControlNet

1. In ComfyUI, right-click the canvas → **Add Node** → **ControlNet** → **Load ControlNet Model**
2. Select your OpenPose model
3. Add a **Apply ControlNet** node and connect it between your CLIP conditioning and the sampler
4. Load a reference image (any character pose image) as the ControlNet input
5. Set **strength** to 0.5-0.7 (lower = looser pose guidance)
6. Generate — the output should roughly follow the pose of your reference image

---

## Step 7: Set Up for Transparent Backgrounds

Your character art needs transparent backgrounds. ComfyUI can do this natively.

### Option A: Generate with white/solid background, then remove

1. Install the **"ComfyUI Layer Style"** or **"rembg"** node from Manager
2. Search Manager for "rembg" → Install
3. Add a **Remove Background** node after your image output
4. This uses AI background removal — very clean results

### Option B: Generate against a solid color and use chroma key

1. Add to your positive prompt: `solid white background` or `solid green background`
2. Post-process with any image editor to remove the background
3. Less clean than Option A but simpler workflow

**Recommended**: Option A with rembg. It's the most reliable for transparent character art.

---

## Step 8: Organize Your Models Folder

After all downloads, your folder structure should look like:

```
ComfyUI/
├── models/
│   ├── checkpoints/
│   │   └── dreamshaper-xl-v*.safetensors     (~6.5 GB)
│   ├── vae/
│   │   └── sdxl_vae.safetensors              (~335 MB)
│   ├── controlnet/
│   │   ├── controlnet-openpose-sdxl.safetensors (~2.5 GB)
│   │   └── controlnet-canny-sdxl.safetensors    (~2.5 GB)
│   ├── loras/                                 (empty for now — LoRAs go here later)
│   ├── upscale_models/                        (empty for now)
│   └── clip_vision/                           (empty for now)
├── custom_nodes/
│   ├── ComfyUI-Manager/
│   └── comfyui_controlnet_aux/
├── input/                                     (put reference images here)
└── output/                                    (generated images saved here)
```

**Total disk space**: ~12-15 GB for this initial setup.

---

## Step 9: Create Your Shattered Veil Workspace

Set up folders to keep your project organized:

```
Create these folders inside ComfyUI/input/:

ComfyUI/input/
├── shattered-veil/
│   ├── style-refs/        ← Approved anchor images go here (style bible)
│   ├── echo-refs/         ← Echo portraits used as pose references
│   ├── voidspawn-refs/    ← Voidspawn creature references
│   ├── environment-refs/  ← Environment reference images
│   └── prompts/           ← Text files with your prompt templates
```

And in the output folder:
```
ComfyUI/output/
├── shattered-veil/
│   ├── anchors/           ← Phase G1 anchor characters
│   ├── heroes/            ← Hero portraits
│   ├── echoes/            ← All Echo unit portraits
│   │   ├── fire/
│   │   ├── water/
│   │   ├── earth/
│   │   ├── wind/
│   │   ├── lightning/
│   │   └── force/
│   ├── voidspawn/         ← All Voidspawn portraits
│   │   ├── fire/
│   │   ├── water/
│   │   ├── earth/
│   │   ├── wind/
│   │   ├── lightning/
│   │   └── force/
│   ├── bosses/
│   ├── environments/
│   └── tokens/
```

---

## Step 10: Your First Shattered Veil Generation

Once everything is installed, try generating your first anchor character.

### Fire Echo Anchor (T3 Warrior — Blaze Berserker)

**Positive prompt:**
```
fantasy fire warrior character, semi-realistic painterly digital art,
glowing ember armor with orange-red flame accents, controlled burning aura,
luminous warm energy, crafted ornate equipment, determined expression,
dark fantasy atmosphere, portrait bust shot, 3/4 angle view,
soft dramatic lighting, muted background with vibrant fire-orange accents,
detailed armor and clothing, clean intentional design,
transparent background --ar 2:3
```

**Negative prompt:**
```
photo, 3d render, blurry, low quality, deformed, ugly, text, watermark,
signature, extra limbs, bad anatomy, extra fingers, mutated hands,
cartoonish, chibi, pixel art, anime eyes, glowing red eyes,
spikes, evil, demonic, dark recolor, corrupted
```

**Settings:**
- Resolution: 768 × 1152 (2:3 portrait)
- Steps: 30
- CFG Scale: 7
- Sampler: euler_ancestral or dpmpp_2m
- Scheduler: karras

Generate 4-8 variations (change the seed each time). Pick the best one — this becomes your Fire Echo style anchor.

### Fire Voidspawn Anchor (same tier/role, alien counterpart)

**Positive prompt:**
```
alien biological creature, dark fantasy, fire element organism,
charred volcanic body with thermal fissures glowing from within,
organic weapon-limbs grown from body, chitin and hardite membrane,
bioluminescent deep orange-red markings along body ridges,
heat radiates from surface without visible flames,
otherworldly anatomy, NOT humanoid, creature ecosystem design,
painterly digital art, portrait view, detailed biological texture,
same artistic quality as [use same style terms as Echo],
transparent background --ar 2:3
```

**Negative prompt:**
```
photo, 3d render, blurry, low quality, text, watermark,
armor, weapon, humanoid, knight, soldier, evil, demonic,
glowing red eyes, spikes everywhere, purple energy,
dark recolor of human, corrupted version of human,
cartoon, chibi, cute
```

**Same settings as above.** Generate 4-8 variations. Pick the best.

Then place them side-by-side and check: do they "rhyme" structurally without being obviously related?

---

## What Comes Next

After this initial setup, the next steps for your art pipeline are:

1. **Generate all 6 Echo + 6 Voidspawn anchor pairs** (Phase G1)
2. **Lock the style** — save the best prompts, settings, and seed numbers
3. **Train a LoRA** (later) — once you have ~20 approved Echo images, train a small style model using `kohya_ss` to lock consistency across all 132 characters
4. **Train a separate Voidspawn LoRA** — same process, different aesthetic
5. **Build reusable ComfyUI workflows** — save node configurations for "Echo portrait", "Voidspawn creature", "environment", "combat token" so batch generation is one-click

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Out of VRAM / CUDA out of memory | Reduce resolution to 512×768. Close other apps. Try adding `--lowvram` flag to launch. |
| Generation is very slow (>60s) | Make sure you're using GPU not CPU. Check that CUDA is detected (ComfyUI console shows "Using GPU: NVIDIA..."). |
| ComfyUI won't start | Re-run the installer. Check that NVIDIA drivers are up to date. |
| Model not showing in dropdown | Verify the `.safetensors` file is in the correct `models/` subfolder. Refresh the browser page. |
| Images look nothing like the prompt | Try increasing CFG scale (7-12). Make sure negative prompt excludes unwanted styles. Try a different checkpoint. |
| Colors look washed out | Load the SDXL VAE explicitly in your workflow (add a "Load VAE" node). |
| ControlNet has no effect | Increase strength (0.6-0.9). Make sure the ControlNet model matches your checkpoint type (SDXL ControlNet for SDXL checkpoint). |

---

## Cost Summary

| Item | Cost |
|------|------|
| ComfyUI | Free (open source) |
| Stable Diffusion models | Free (open source / CivitAI) |
| ControlNet models | Free (open source / HuggingFace) |
| VAE | Free |
| LoRA training tools (kohya_ss) | Free (install later) |
| **Total** | **$0** |

The only cost is your electricity and the time to learn the interface. Once comfortable, you can generate hundreds of images per day.

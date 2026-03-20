# Prompt for Codex/Claude: OneTrainer LoRA Setup

Copy everything below this line and paste it to your AI assistant:

---

I need help setting up OneTrainer to train an SDXL LoRA for my game art project (Shattered Veil). Here's what I need:

## What I'm training
A style LoRA for fire elemental spirit creatures — non-humanoid, painterly fantasy game art. I have 15-20 training images of flame/ember creatures on black backgrounds, all in a consistent painterly style. I want the LoRA to lock this style so I can generate more units that look consistent.

## My setup
- **GPU**: NVIDIA RTX 5080 (16GB VRAM)
- **OS**: Windows 11
- **OneTrainer**: Latest version, already installed
- **Base model**: Juggernaut XL (SDXL checkpoint) — located at: [FILL IN YOUR PATH, e.g. C:\ComfyUI\models\checkpoints\juggernautXL_v9.safetensors]
- **Training images**: [FILL IN YOUR PATH, e.g. C:\training\fire-echo\] — contains 15-20 PNG images

## IMPORTANT: Current settings are wrong
My OneTrainer is currently set to **SD1.5** and **Fine Tune**. I need to change these to:
- Model type: **SDXL**
- Training method: **LoRA**

## Settings I want to use

| Setting | Value |
|---------|-------|
| Model type | SDXL |
| Training method | LoRA |
| Base model | My Juggernaut XL checkpoint |
| LoRA rank | 32 |
| LoRA alpha | 16 |
| Learning rate | 0.0001 (1e-4) |
| Text encoder learning rate | 0.00005 (5e-5) |
| Batch size | 1 |
| Epochs | 12 |
| Resolution | 1024 |
| Optimizer | AdamW8bit |
| LR scheduler | Cosine with restarts |
| Mixed precision | fp16 |
| Save checkpoints every | 4 epochs |
| Output name | sv_fire_echo |

## Captioning
Each training image needs a matching .txt caption file. All captions should be identical:
```
sv_echo, sentient flame creature, fire elemental spirit, painterly fantasy illustration, game creature art, black background
```

The trigger word is `sv_echo`.

## What I need help with
1. Walk me through changing the OneTrainer settings from SD1.5/Fine Tune to SDXL/LoRA
2. Show me exactly which tabs and fields to fill in with the settings above
3. Help me set up the training data directory correctly (images + caption .txt files)
4. Help me create the caption .txt files for all my training images (they should all have the same caption)
5. Start the training
6. After training, tell me how to load the resulting LoRA in ComfyUI to test it

## How I'll test it
Once trained, I'll load the LoRA in ComfyUI with strength 0.7 and use this test prompt:
```
sv_echo, tiny flickering fire wisp, small sentient ember, barely formed fire spirit, single delicate flame tendril, faint warm amber glow, simple fragile shape, digital painting, painterly fantasy illustration, game creature art, black background, full body view
```

If the output looks like it belongs to the same visual family as my training images but is clearly a different/simpler creature, the LoRA worked.

---

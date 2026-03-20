"""
Shattered Veil — Token Processing Pipeline
============================================
Converts raw AI-generated portrait art into game-ready 256x256 combat tokens.

Usage:
    python token_processor.py <input_image> <element> [--type echo|voidspawn] [--tier 1-5]

Example:
    python token_processor.py fire_echo_anchor.png fire --type echo --tier 3
    python token_processor.py fire_voidspawn_anchor.png fire --type voidspawn --tier 3

Pipeline Steps:
    1. Load raw image (768x1152 or similar)
    2. Remove/replace background (assumes black or transparent bg)
    3. Center and fit into square canvas
    4. Scale to 256x256
    5. Add element-colored border ring
    6. Add tier indicator (star dots)
    7. Add subtle element glow effect
    8. Export as transparent PNG

Requirements:
    pip install Pillow
"""

import sys
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import math

# ============================================
# CANONICAL ELEMENT COLORS
# ============================================
ELEMENT_COLORS = {
    'fire':      {'primary': (255, 69, 0),    'glow': (255, 120, 30),  'hex': '#FF4500'},
    'water':     {'primary': (30, 144, 255),   'glow': (60, 160, 255),  'hex': '#1E90FF'},
    'earth':     {'primary': (34, 139, 34),    'glow': (60, 160, 60),   'hex': '#228B22'},
    'wind':      {'primary': (135, 206, 235),  'glow': (160, 220, 245), 'hex': '#87CEEB'},
    'lightning': {'primary': (255, 215, 0),    'glow': (255, 225, 60),  'hex': '#FFD700'},
    'force':     {'primary': (147, 112, 219),  'glow': (170, 140, 230), 'hex': '#9370DB'},
}

# Tier star counts
TIER_STARS = {1: 1, 2: 2, 3: 3, 4: 4, 5: 5}

# Token size
TOKEN_SIZE = 256
BORDER_WIDTH = 4
GLOW_RADIUS = 8


def load_image(path):
    """Load image and convert to RGBA."""
    img = Image.open(path).convert('RGBA')
    return img


def remove_black_background(img, threshold=30):
    """
    Replace near-black pixels with transparency.
    For images generated with 'black background' prompt.
    """
    data = img.getdata()
    new_data = []
    for pixel in data:
        r, g, b, a = pixel
        # If pixel is very dark (near black), make transparent
        if r < threshold and g < threshold and b < threshold:
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(pixel)
    img.putdata(new_data)
    return img


def fit_to_square(img, target_size):
    """
    Fit image into a square canvas, maintaining aspect ratio.
    Centers the image with transparent padding.
    """
    # Calculate scaling to fit within target
    w, h = img.size
    scale = min(target_size / w, target_size / h) * 0.85  # 85% of space for padding
    new_w = int(w * scale)
    new_h = int(h * scale)

    # Resize with high quality
    resized = img.resize((new_w, new_h), Image.LANCZOS)

    # Create square canvas
    canvas = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))

    # Center the image
    x = (target_size - new_w) // 2
    y = (target_size - new_h) // 2
    canvas.paste(resized, (x, y), resized)

    return canvas


def add_element_border(img, element, unit_type='echo'):
    """
    Add a circular element-colored border ring around the token.
    Echo borders are clean/bright. Voidspawn borders are slightly darker/rougher.
    """
    colors = ELEMENT_COLORS[element]
    size = img.size[0]

    # Create border layer
    border_layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(border_layer)

    color = colors['primary']
    if unit_type == 'voidspawn':
        # Darken the border slightly for voidspawn
        color = tuple(max(0, c - 40) for c in color)

    # Outer border circle
    draw.ellipse(
        [BORDER_WIDTH//2, BORDER_WIDTH//2, size - BORDER_WIDTH//2, size - BORDER_WIDTH//2],
        outline=color,
        width=BORDER_WIDTH
    )

    # Inner subtle glow circle
    glow_color = colors['glow'] + (80,)  # Semi-transparent glow
    draw.ellipse(
        [BORDER_WIDTH + 1, BORDER_WIDTH + 1, size - BORDER_WIDTH - 1, size - BORDER_WIDTH - 1],
        outline=glow_color,
        width=2
    )

    # Composite border on top of image
    result = Image.alpha_composite(img, border_layer)
    return result


def add_glow_effect(img, element):
    """Add a subtle element-colored outer glow."""
    colors = ELEMENT_COLORS[element]
    size = img.size[0]

    # Create glow layer - larger than token, then crop
    glow_size = size + GLOW_RADIUS * 4
    glow_layer = Image.new('RGBA', (glow_size, glow_size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)

    glow_color = colors['glow'] + (40,)  # Very transparent
    offset = GLOW_RADIUS * 2
    glow_draw.ellipse(
        [offset - GLOW_RADIUS, offset - GLOW_RADIUS,
         offset + size + GLOW_RADIUS, offset + size + GLOW_RADIUS],
        fill=glow_color
    )

    # Blur the glow
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=GLOW_RADIUS))

    # Crop back to token size (centered)
    glow_cropped = glow_layer.crop((offset, offset, offset + size, offset + size))

    # Composite: glow behind, then token on top
    result = Image.alpha_composite(glow_cropped, img)
    return result


def add_tier_stars(img, tier, element):
    """Add small star/dot indicators below the token center."""
    colors = ELEMENT_COLORS[element]
    draw = ImageDraw.Draw(img)
    size = img.size[0]

    star_count = TIER_STARS.get(tier, 3)
    star_radius = 4
    star_spacing = 14
    total_width = (star_count - 1) * star_spacing

    # Position stars near bottom of token
    y = size - 20
    start_x = (size - total_width) // 2

    for i in range(star_count):
        x = start_x + i * star_spacing
        # Star dot with glow
        draw.ellipse(
            [x - star_radius, y - star_radius, x + star_radius, y + star_radius],
            fill=colors['primary'],
            outline=(255, 255, 255, 200)
        )

    return img


def add_circular_mask(img):
    """Apply circular mask to make token round."""
    size = img.size[0]
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse([0, 0, size, size], fill=255)

    # Apply mask
    result = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    result.paste(img, (0, 0), mask)
    return result


def process_token(input_path, element, unit_type='echo', tier=3, output_path=None):
    """
    Full token processing pipeline.

    Args:
        input_path: Path to raw AI-generated image
        element: Element name (fire, water, earth, wind, lightning, force)
        unit_type: 'echo' or 'voidspawn'
        tier: 1-5 tier level
        output_path: Output path (auto-generated if None)
    """
    print(f"Processing: {input_path}")
    print(f"  Element: {element}, Type: {unit_type}, Tier: {tier}")

    # Step 1: Load
    img = load_image(input_path)
    print(f"  Loaded: {img.size}")

    # Step 2: Remove black background
    img = remove_black_background(img)
    print("  Background removed")

    # Step 3: Fit to square
    img = fit_to_square(img, TOKEN_SIZE)
    print(f"  Fit to {TOKEN_SIZE}x{TOKEN_SIZE}")

    # Step 4: Apply circular mask
    img = add_circular_mask(img)
    print("  Circular mask applied")

    # Step 5: Add glow effect (behind border)
    img = add_glow_effect(img, element)
    print("  Glow effect added")

    # Step 6: Add element border
    img = add_element_border(img, element, unit_type)
    print("  Element border added")

    # Step 7: Add tier stars
    img = add_tier_stars(img, tier, element)
    print(f"  Tier {tier} stars added")

    # Step 8: Export
    if output_path is None:
        base = os.path.splitext(os.path.basename(input_path))[0]
        output_path = f"token_{element}_{unit_type}_{base}_t{tier}.png"

    img.save(output_path, 'PNG')
    print(f"  Saved: {output_path}")
    print(f"  Final size: {img.size}")

    return output_path


def batch_process(input_dir, element, unit_type='echo', tier=3, output_dir=None):
    """Process all images in a directory."""
    if output_dir is None:
        output_dir = os.path.join(input_dir, 'tokens')
    os.makedirs(output_dir, exist_ok=True)

    for filename in os.listdir(input_dir):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            input_path = os.path.join(input_dir, filename)
            output_path = os.path.join(output_dir,
                f"token_{element}_{unit_type}_t{tier}_{filename}")
            if not output_path.endswith('.png'):
                output_path = os.path.splitext(output_path)[0] + '.png'
            process_token(input_path, element, unit_type, tier, output_path)


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)

    input_path = sys.argv[1]
    element = sys.argv[2].lower()

    # Parse optional args
    unit_type = 'echo'
    tier = 3
    output = None

    i = 3
    while i < len(sys.argv):
        if sys.argv[i] == '--type' and i + 1 < len(sys.argv):
            unit_type = sys.argv[i + 1]
            i += 2
        elif sys.argv[i] == '--tier' and i + 1 < len(sys.argv):
            tier = int(sys.argv[i + 1])
            i += 2
        elif sys.argv[i] == '--output' and i + 1 < len(sys.argv):
            output = sys.argv[i + 1]
            i += 2
        elif sys.argv[i] == '--batch':
            batch_process(input_path, element, unit_type, tier)
            sys.exit(0)
        else:
            i += 1

    if element not in ELEMENT_COLORS:
        print(f"Unknown element: {element}")
        print(f"Valid elements: {', '.join(ELEMENT_COLORS.keys())}")
        sys.exit(1)

    process_token(input_path, element, unit_type, tier, output)

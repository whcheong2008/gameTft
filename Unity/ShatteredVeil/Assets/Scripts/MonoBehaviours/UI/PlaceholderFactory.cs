using UnityEngine;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Generates colored placeholder sprites at runtime. No external asset files needed.
    /// </summary>
    public static class PlaceholderFactory
    {
        private static readonly int DefaultSize = 128;

        public static Color GetElementColor(string element)
        {
            switch (element?.ToLowerInvariant())
            {
                case "fire": return new Color(0.9f, 0.2f, 0.2f);
                case "water": return new Color(0.2f, 0.4f, 0.9f);
                case "earth": return new Color(0.2f, 0.7f, 0.3f);
                case "wind": return new Color(0.2f, 0.8f, 0.8f);
                case "lightning": return new Color(0.9f, 0.8f, 0.2f);
                case "force": return new Color(0.6f, 0.2f, 0.8f);
                default: return Color.gray;
            }
        }

        public static string GetElementAbbreviation(string element)
        {
            switch (element?.ToLowerInvariant())
            {
                case "fire": return "F";
                case "water": return "W";
                case "earth": return "E";
                case "wind": return "Wi";
                case "lightning": return "L";
                case "force": return "Fo";
                default: return "?";
            }
        }

        /// <summary>
        /// Create a unit placeholder sprite colored by element, sized by tier.
        /// </summary>
        public static Sprite CreateUnitSprite(string element, int tier)
        {
            int size = DefaultSize + (tier - 1) * 16; // T1=128, T5=192
            var color = GetElementColor(element);
            return CreateColoredSprite(size, size, color);
        }

        /// <summary>
        /// Create a generic colored square sprite.
        /// </summary>
        public static Sprite CreateIconSprite(Color color, string label)
        {
            return CreateColoredSprite(64, 64, color);
        }

        /// <summary>
        /// Create a gray dotted-outline sprite for empty slots.
        /// </summary>
        public static Sprite CreateSlotSprite()
        {
            int size = DefaultSize;
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
            tex.filterMode = FilterMode.Point;

            var bgColor = new Color(0.15f, 0.15f, 0.2f, 0.5f);
            var borderColor = new Color(0.5f, 0.5f, 0.5f, 0.8f);

            var pixels = new Color[size * size];
            for (int i = 0; i < pixels.Length; i++)
                pixels[i] = bgColor;

            // Draw dotted border
            for (int x = 0; x < size; x++)
            {
                for (int y = 0; y < size; y++)
                {
                    bool isBorder = x < 2 || x >= size - 2 || y < 2 || y >= size - 2;
                    if (isBorder && ((x + y) % 8 < 4))
                        pixels[y * size + x] = borderColor;
                }
            }

            tex.SetPixels(pixels);
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f));
        }

        private static Sprite CreateColoredSprite(int width, int height, Color color)
        {
            var tex = new Texture2D(width, height, TextureFormat.RGBA32, false);
            tex.filterMode = FilterMode.Point;

            var pixels = new Color[width * height];
            var borderColor = color * 0.6f;
            borderColor.a = 1f;

            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    bool isBorder = x < 2 || x >= width - 2 || y < 2 || y >= height - 2;
                    pixels[y * width + x] = isBorder ? borderColor : color;
                }
            }

            tex.SetPixels(pixels);
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, width, height), new Vector2(0.5f, 0.5f));
        }
    }
}

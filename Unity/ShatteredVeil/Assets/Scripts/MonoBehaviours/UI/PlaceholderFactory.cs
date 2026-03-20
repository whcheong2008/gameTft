using System.Collections.Generic;
using UnityEngine;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Runtime placeholder sprite generation for units, icons, and slots.
    /// No external assets needed — creates colored textures at runtime.
    /// </summary>
    public static class PlaceholderFactory
    {
        private static readonly Dictionary<string, Color> ElementColors = new Dictionary<string, Color>
        {
            { "Fire",      new Color(0.9f, 0.3f, 0.2f) },
            { "Water",     new Color(0.2f, 0.5f, 0.9f) },
            { "Earth",     new Color(0.6f, 0.5f, 0.2f) },
            { "Wind",      new Color(0.3f, 0.8f, 0.5f) },
            { "Lightning", new Color(0.9f, 0.8f, 0.2f) },
            { "Force",     new Color(0.7f, 0.3f, 0.8f) },
        };

        private static readonly Dictionary<string, string> ElementAbbrevs = new Dictionary<string, string>
        {
            { "Fire", "F" }, { "Water", "W" }, { "Earth", "E" },
            { "Wind", "Wi" }, { "Lightning", "L" }, { "Force", "Fo" },
        };

        public static Color GetElementColor(string element)
        {
            return ElementColors.TryGetValue(element, out var c) ? c : Color.gray;
        }

        public static string GetElementAbbrev(string element)
        {
            return ElementAbbrevs.TryGetValue(element, out var a) ? a : "?";
        }

        public static Sprite CreateUnitSprite(string element, int tier)
        {
            int size = 128 + (tier - 1) * 16; // T1=128, T5=192
            var color = GetElementColor(element);
            var tex = new Texture2D(size, size);
            var borderColor = color * 0.6f;
            borderColor.a = 1f;

            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    bool isBorder = x < 2 || x >= size - 2 || y < 2 || y >= size - 2;
                    tex.SetPixel(x, y, isBorder ? borderColor : color);
                }
            }

            tex.filterMode = FilterMode.Point;
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f));
        }

        public static Sprite CreateIconSprite(Color color, int size = 64)
        {
            var tex = new Texture2D(size, size);
            for (int y = 0; y < size; y++)
                for (int x = 0; x < size; x++)
                    tex.SetPixel(x, y, color);
            tex.filterMode = FilterMode.Point;
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f));
        }

        public static Sprite CreateSlotSprite(int size = 64)
        {
            var tex = new Texture2D(size, size);
            var bg = new Color(0.15f, 0.15f, 0.2f);
            var dot = new Color(0.4f, 0.4f, 0.5f);

            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    bool isBorder = x < 2 || x >= size - 2 || y < 2 || y >= size - 2;
                    bool isDotted = isBorder && ((x + y) % 4 < 2);
                    tex.SetPixel(x, y, isDotted ? dot : bg);
                }
            }

            tex.filterMode = FilterMode.Point;
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f));
        }
    }
}

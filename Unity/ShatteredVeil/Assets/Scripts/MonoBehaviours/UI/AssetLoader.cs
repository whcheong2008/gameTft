using UnityEngine;

namespace ShatteredVeil.Mono.UI
{
    public static class AssetLoader
    {
        public static Sprite LoadUnitPortrait(string unitId, string element, int tier)
        {
            string elementLower = element?.ToLower() ?? "fire";
            var sprite = Resources.Load<Sprite>("Art/Units/Base/" + elementLower + "/" + unitId);
            if (sprite == null)
                sprite = Resources.Load<Sprite>("Art/Units/Evolved/" + elementLower + "/" + unitId);
            if (sprite != null)
                return sprite;

            return PlaceholderFactory.CreateUnitSprite(element, tier);
        }

        public static Sprite LoadCharacterPortrait(string characterId, string expression)
        {
            var sprite = Resources.Load<Sprite>("Art/Characters/" + characterId + "/" + expression);
            if (sprite != null)
                return sprite;

            var color = PlaceholderFactory.GetElementColor(GetCharacterElement(characterId));
            return PlaceholderFactory.CreateIconSprite(color, 512);
        }

        public static Sprite LoadElementIcon(string element)
        {
            string elementLower = element?.ToLower() ?? "fire";
            var sprite = Resources.Load<Sprite>("Art/Icons/Elements/" + elementLower);
            if (sprite != null)
                return sprite;

            return PlaceholderFactory.CreateIconSprite(PlaceholderFactory.GetElementColor(element));
        }

        public static Sprite LoadArchetypeIcon(string archetype)
        {
            string arcLower = archetype?.ToLower() ?? "guardian";
            var sprite = Resources.Load<Sprite>("Art/Icons/Archetypes/" + arcLower);
            if (sprite != null)
                return sprite;

            return PlaceholderFactory.CreateIconSprite(Color.gray);
        }

        public static Sprite LoadIcon(string iconPath)
        {
            var sprite = Resources.Load<Sprite>(iconPath);
            if (sprite != null)
                return sprite;

            return PlaceholderFactory.CreateIconSprite(Color.gray);
        }

        public static Sprite LoadBackground(string bgPath)
        {
            var sprite = Resources.Load<Sprite>(bgPath);
            if (sprite != null)
                return sprite;

            var tex = new Texture2D(480, 854);
            var color = new Color(0.1f, 0.1f, 0.15f);
            for (int y = 0; y < 854; y++)
                for (int x = 0; x < 480; x++)
                    tex.SetPixel(x, y, color);
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, 480, 854), new Vector2(0.5f, 0.5f));
        }

        public static Sprite LoadBossSprite(int bossIndex)
        {
            var sprite = Resources.Load<Sprite>("Art/Bosses/boss_" + bossIndex);
            if (sprite != null)
                return sprite;

            var color = new Color(0.6f, 0.1f, 0.1f);
            return PlaceholderFactory.CreateIconSprite(color, 512);
        }

        private static string GetCharacterElement(string characterId)
        {
            switch (characterId)
            {
                case "kael": return "Earth";
                case "lyric": return "Wind";
                case "senna": return "Lightning";
                case "otho": return "Force";
                case "maren": return "Fire";
                case "mira": return "Water";
                case "torren": return "Earth";
                case "dren": return "Earth";
                default: return "Earth";
            }
        }
    }
}

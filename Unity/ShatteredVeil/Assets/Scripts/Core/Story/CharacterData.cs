using System.Collections.Generic;

namespace ShatteredVeil.Core.Story
{
    public class CharacterInfo
    {
        public string Id;
        public string DisplayName;
        public string Element;
        public string DefaultExpression;
        public string[] AvailableExpressions;
        public int JoinsAtRegion;
    }

    public static class CharacterData
    {
        private static readonly string[] StandardExpressions =
            { "neutral", "angry", "sad", "happy", "shocked", "determined" };

        public static readonly Dictionary<string, CharacterInfo> Characters =
            new Dictionary<string, CharacterInfo>
            {
                ["kael"] = new CharacterInfo
                {
                    Id = "kael",
                    DisplayName = "Kael",
                    Element = "Earth",
                    DefaultExpression = "neutral",
                    AvailableExpressions = StandardExpressions,
                    JoinsAtRegion = 1
                },
                ["lyric"] = new CharacterInfo
                {
                    Id = "lyric",
                    DisplayName = "Lyric",
                    Element = "Wind",
                    DefaultExpression = "happy",
                    AvailableExpressions = StandardExpressions,
                    JoinsAtRegion = 1
                },
                ["senna"] = new CharacterInfo
                {
                    Id = "senna",
                    DisplayName = "Senna",
                    Element = "Lightning",
                    DefaultExpression = "neutral",
                    AvailableExpressions = StandardExpressions,
                    JoinsAtRegion = 1
                },
                ["otho"] = new CharacterInfo
                {
                    Id = "otho",
                    DisplayName = "Otho",
                    Element = "Force",
                    DefaultExpression = "neutral",
                    AvailableExpressions = StandardExpressions,
                    JoinsAtRegion = 1
                },
                ["maren"] = new CharacterInfo
                {
                    Id = "maren",
                    DisplayName = "Maren",
                    Element = "Fire",
                    DefaultExpression = "determined",
                    AvailableExpressions = StandardExpressions,
                    JoinsAtRegion = 3
                },
                ["mira"] = new CharacterInfo
                {
                    Id = "mira",
                    DisplayName = "Mira",
                    Element = "Water",
                    DefaultExpression = "neutral",
                    AvailableExpressions = StandardExpressions,
                    JoinsAtRegion = 5
                },
                ["torren"] = new CharacterInfo
                {
                    Id = "torren",
                    DisplayName = "Captain Torren",
                    Element = "Earth",
                    DefaultExpression = "neutral",
                    AvailableExpressions = new[] { "neutral", "angry", "determined" },
                    JoinsAtRegion = 1
                },
                ["dren"] = new CharacterInfo
                {
                    Id = "dren",
                    DisplayName = "Dren",
                    Element = "Earth",
                    DefaultExpression = "neutral",
                    AvailableExpressions = new[] { "neutral", "happy", "shocked" },
                    JoinsAtRegion = 1
                },
                ["ren"] = new CharacterInfo
                {
                    Id = "ren",
                    DisplayName = "Ren",
                    Element = "Earth",
                    DefaultExpression = "neutral",
                    AvailableExpressions = new[] { "neutral", "determined" },
                    JoinsAtRegion = 2
                },
                ["sera"] = new CharacterInfo
                {
                    Id = "sera",
                    DisplayName = "Sera",
                    Element = "Lightning",
                    DefaultExpression = "neutral",
                    AvailableExpressions = StandardExpressions,
                    JoinsAtRegion = 2
                },
                ["voss"] = new CharacterInfo
                {
                    Id = "voss",
                    DisplayName = "Voss",
                    Element = "Force",
                    DefaultExpression = "neutral",
                    AvailableExpressions = new[] { "neutral", "determined" },
                    JoinsAtRegion = 7
                },
                ["harl"] = new CharacterInfo
                {
                    Id = "harl",
                    DisplayName = "Harl",
                    Element = "Earth",
                    DefaultExpression = "neutral",
                    AvailableExpressions = new[] { "neutral" },
                    JoinsAtRegion = 3
                },
                ["narrator"] = new CharacterInfo
                {
                    Id = "narrator",
                    DisplayName = "",
                    Element = "",
                    DefaultExpression = "neutral",
                    AvailableExpressions = new[] { "neutral" },
                    JoinsAtRegion = 1
                }
            };

        public static CharacterInfo Get(string characterId)
        {
            return Characters.TryGetValue(characterId, out var info) ? info : null;
        }

        public static bool Exists(string characterId)
        {
            return Characters.ContainsKey(characterId);
        }
    }
}

using System.Collections.Generic;

namespace ShatteredVeil.Core.Items
{
    public static class GemSystem
    {
        public const int CombineCost = 15;

        // Gem stat definitions from GROUND-TRUTH:
        // Ruby +100 HP, Sapphire +8 ATK, Emerald +5% DR, Topaz -0.05s AtkSpd
        // Diamond +8% Crit, Amethyst +10 Start Mana, Opal +10% Heal Power
        // Onyx +10% Tenacity, Prismatic +50 HP +5 ATK +3% Crit
        private static readonly Dictionary<GemType, StatModifier[]> GemStats = new Dictionary<GemType, StatModifier[]>
        {
            { GemType.Ruby, new[] { new StatModifier("flatHp", 100f) } },
            { GemType.Sapphire, new[] { new StatModifier("flatAtk", 8f) } },
            { GemType.Emerald, new[] { new StatModifier("dr", 5f) } },
            { GemType.Topaz, new[] { new StatModifier("atkSpeed", 0.05f) } },
            { GemType.Diamond, new[] { new StatModifier("critChance", 8f) } },
            { GemType.Amethyst, new[] { new StatModifier("startMana", 10f) } },
            { GemType.Opal, new[] { new StatModifier("healPower", 10f) } },
            { GemType.Onyx, new[] { new StatModifier("tenacity", 10f) } },
            { GemType.Prismatic, new[] { new StatModifier("flatHp", 50f), new StatModifier("flatAtk", 5f), new StatModifier("critChance", 3f) } }
        };

        // Rarity scaling: Standard 1.0x, Uncommon 1.25x, Rare 1.5x, Epic 2.0x
        private static readonly float[] RarityScaling = { 1.0f, 1.25f, 1.5f, 2.0f };

        public static float GetRarityScaling(GemRarity rarity)
        {
            int idx = (int)rarity;
            if (idx < 0 || idx >= RarityScaling.Length) return 1.0f;
            return RarityScaling[idx];
        }

        public static bool SocketGem(Equipment item, Gem gem, int socketIndex)
        {
            if (item == null || gem == null) return false;
            if (socketIndex < 0 || socketIndex >= item.Sockets.Length) return false;
            if (item.Sockets[socketIndex] != null) return false;
            item.Sockets[socketIndex] = gem;
            return true;
        }

        public static Gem RemoveGem(Equipment item, int socketIndex)
        {
            if (item == null) return null;
            if (socketIndex < 0 || socketIndex >= item.Sockets.Length) return null;
            var gem = item.Sockets[socketIndex];
            item.Sockets[socketIndex] = null;
            return gem;
        }

        public static Gem CombineGems(Gem a, Gem b, Gem c)
        {
            if (a == null || b == null || c == null) return null;
            // Must all be same type and same rarity
            if (a.Type != b.Type || b.Type != c.Type) return null;
            if (a.Rarity != b.Rarity || b.Rarity != c.Rarity) return null;
            // Cannot combine Epic (max rarity)
            if (a.Rarity == GemRarity.Epic) return null;

            var nextRarity = (GemRarity)((int)a.Rarity + 1);
            return new Gem(a.Type, nextRarity);
        }

        public static StatModifier[] GetGemStatBonuses(Gem gem)
        {
            if (gem == null) return System.Array.Empty<StatModifier>();
            if (!GemStats.TryGetValue(gem.Type, out var baseStats))
                return System.Array.Empty<StatModifier>();

            float scale = GetRarityScaling(gem.Rarity);
            var result = new StatModifier[baseStats.Length];
            for (int i = 0; i < baseStats.Length; i++)
            {
                result[i] = new StatModifier(baseStats[i].StatKey, baseStats[i].Value * scale);
            }
            return result;
        }

        /// <summary>
        /// Get base (unscaled) stat values for a gem type. Used for test verification.
        /// </summary>
        public static StatModifier[] GetBaseGemStats(GemType type)
        {
            if (!GemStats.TryGetValue(type, out var stats))
                return System.Array.Empty<StatModifier>();
            return stats;
        }
    }
}

using System.Collections.Generic;

namespace ShatteredVeil.Core.Items
{
    public static class EquipmentStatCalculator
    {
        /// <summary>
        /// Calculate total stat bonuses from all equipped items.
        /// Sums base stats, affix stats, enhancement bonuses, and gem bonuses.
        /// </summary>
        public static StatModifier[] CalculateEquipmentBonuses(Equipment[] equipped)
        {
            if (equipped == null || equipped.Length == 0)
                return System.Array.Empty<StatModifier>();

            var statMap = new Dictionary<string, float>();

            for (int i = 0; i < equipped.Length; i++)
            {
                var item = equipped[i];
                if (item == null) continue;

                // 1. Base stat with enhancement bonus
                float enhancePct = EnhancementSystem.GetStatBonusPct(item.EnhanceLevel);
                float baseStat = item.BaseStatValue * (1f + enhancePct);
                AddStat(statMap, GetPrimaryStatKey(item.Slot), baseStat);

                // 2. Affix stats
                if (item.Affixes != null)
                {
                    for (int a = 0; a < item.Affixes.Count; a++)
                    {
                        AddStat(statMap, item.Affixes[a].StatKey, item.Affixes[a].Value);
                    }
                }

                // 3. Gem bonuses
                if (item.Sockets != null)
                {
                    for (int g = 0; g < item.Sockets.Length; g++)
                    {
                        if (item.Sockets[g] == null) continue;
                        var gemBonuses = GemSystem.GetGemStatBonuses(item.Sockets[g]);
                        for (int b = 0; b < gemBonuses.Length; b++)
                        {
                            AddStat(statMap, gemBonuses[b].StatKey, gemBonuses[b].Value);
                        }
                    }
                }
            }

            // Convert to array
            var result = new StatModifier[statMap.Count];
            int idx = 0;
            foreach (var kvp in statMap)
            {
                result[idx++] = new StatModifier(kvp.Key, kvp.Value);
            }
            return result;
        }

        private static void AddStat(Dictionary<string, float> map, string key, float value)
        {
            if (string.IsNullOrEmpty(key)) return;
            if (map.ContainsKey(key))
                map[key] += value;
            else
                map[key] = value;
        }

        /// <summary>
        /// Map equipment slot to its primary stat key.
        /// Weapon/Gauntlets -> flatAtk, Helm/ChestArmor/OffHand -> flatHp,
        /// Boots -> atkSpeed, Accessory -> flatHp (generic)
        /// </summary>
        private static string GetPrimaryStatKey(ItemSlot slot)
        {
            switch (slot)
            {
                case ItemSlot.Weapon:
                case ItemSlot.Gauntlets:
                    return "flatAtk";
                case ItemSlot.Helm:
                case ItemSlot.ChestArmor:
                case ItemSlot.OffHand:
                    return "flatHp";
                case ItemSlot.Boots:
                    return "atkSpeed";
                case ItemSlot.Accessory1:
                case ItemSlot.Accessory2:
                    return "flatHp";
                default:
                    return "flatHp";
            }
        }
    }
}

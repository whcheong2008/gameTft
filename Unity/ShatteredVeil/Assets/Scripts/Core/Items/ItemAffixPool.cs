using System.Collections.Generic;

namespace ShatteredVeil.Core.Items
{
    public static class ItemAffixPool
    {
        private static readonly Dictionary<ItemSlot, AffixDefinition[]> Pool = new Dictionary<ItemSlot, AffixDefinition[]>
        {
            {
                ItemSlot.Weapon, new[]
                {
                    new AffixDefinition("flatAtk", 3, 15),
                    new AffixDefinition("atkPct", 3, 10),
                    new AffixDefinition("critChance", 3, 12),
                    new AffixDefinition("critDamage", 5, 20),
                    new AffixDefinition("atkSpeed", 0.02f, 0.08f),
                    new AffixDefinition("lifesteal", 2, 8),
                    new AffixDefinition("armorPen", 3, 10),
                    new AffixDefinition("startMana", 5, 15)
                }
            },
            {
                ItemSlot.Helm, new[]
                {
                    new AffixDefinition("flatHp", 30, 150),
                    new AffixDefinition("hpPct", 3, 10),
                    new AffixDefinition("dr", 2, 8),
                    new AffixDefinition("tenacity", 3, 12),
                    new AffixDefinition("elemResist", 3, 10),
                    new AffixDefinition("startMana", 5, 12),
                    new AffixDefinition("abilityDmg", 3, 8)
                }
            },
            {
                ItemSlot.ChestArmor, new[]
                {
                    new AffixDefinition("flatHp", 50, 200),
                    new AffixDefinition("hpPct", 4, 12),
                    new AffixDefinition("dr", 3, 10),
                    new AffixDefinition("flatAtk", 2, 8),
                    new AffixDefinition("healPower", 3, 10),
                    new AffixDefinition("regenPct", 0.3f, 1.0f)
                }
            },
            {
                ItemSlot.Gauntlets, new[]
                {
                    new AffixDefinition("flatAtk", 3, 12),
                    new AffixDefinition("atkPct", 3, 8),
                    new AffixDefinition("critChance", 3, 10),
                    new AffixDefinition("atkSpeed", 0.02f, 0.06f),
                    new AffixDefinition("lifesteal", 2, 6),
                    new AffixDefinition("onHitDmg", 3, 15),
                    new AffixDefinition("manaPerHit", 1, 5)
                }
            },
            {
                ItemSlot.Boots, new[]
                {
                    new AffixDefinition("atkSpeed", 0.02f, 0.08f),
                    new AffixDefinition("moveSpeed", 5, 15),
                    new AffixDefinition("dodge", 3, 10),
                    new AffixDefinition("tenacity", 3, 10),
                    new AffixDefinition("startMana", 5, 12),
                    new AffixDefinition("flatHp", 20, 80)
                }
            },
            {
                ItemSlot.OffHand, new[]
                {
                    new AffixDefinition("flatHp", 30, 150),
                    new AffixDefinition("dr", 2, 8),
                    new AffixDefinition("startShield", 30, 120),
                    new AffixDefinition("healPower", 5, 15),
                    new AffixDefinition("abilityDmg", 3, 8),
                    new AffixDefinition("startMana", 5, 12),
                    new AffixDefinition("tauntDuration", 0.5f, 1.5f)
                }
            },
            {
                ItemSlot.Accessory1, new[]
                {
                    new AffixDefinition("flatHp", 30, 120),
                    new AffixDefinition("flatAtk", 3, 12),
                    new AffixDefinition("atkSpeed", 0.02f, 0.06f),
                    new AffixDefinition("critChance", 3, 8),
                    new AffixDefinition("dr", 2, 6),
                    new AffixDefinition("startMana", 5, 12),
                    new AffixDefinition("tenacity", 3, 8),
                    new AffixDefinition("healPower", 3, 8),
                    new AffixDefinition("elemResist", 3, 8),
                    new AffixDefinition("allStatsPct", 1, 4)
                }
            },
            {
                ItemSlot.Accessory2, new[]
                {
                    new AffixDefinition("flatHp", 30, 120),
                    new AffixDefinition("flatAtk", 3, 12),
                    new AffixDefinition("atkSpeed", 0.02f, 0.06f),
                    new AffixDefinition("critChance", 3, 8),
                    new AffixDefinition("dr", 2, 6),
                    new AffixDefinition("startMana", 5, 12),
                    new AffixDefinition("tenacity", 3, 8),
                    new AffixDefinition("healPower", 3, 8),
                    new AffixDefinition("elemResist", 3, 8),
                    new AffixDefinition("allStatsPct", 1, 4)
                }
            }
        };

        public static AffixDefinition[] GetAffixesForSlot(ItemSlot slot)
        {
            return Pool.TryGetValue(slot, out var defs) ? defs : System.Array.Empty<AffixDefinition>();
        }

        public static List<Affix> RollAffixes(ItemSlot slot, int count, System.Random rng)
        {
            var defs = GetAffixesForSlot(slot);
            var result = new List<Affix>();
            if (count <= 0 || defs.Length == 0) return result;

            // Shuffle pick without duplicates
            var indices = new List<int>();
            for (int i = 0; i < defs.Length; i++) indices.Add(i);

            for (int i = 0; i < count && indices.Count > 0; i++)
            {
                int pick = rng.Next(indices.Count);
                var def = defs[indices[pick]];
                indices.RemoveAt(pick);

                float value = def.RangeMin + (float)(rng.NextDouble() * (def.RangeMax - def.RangeMin));
                // Round to 2 decimal places
                value = (float)System.Math.Round(value, 2);
                result.Add(new Affix(def.Key, value, def.RangeMin, def.RangeMax));
            }

            return result;
        }
    }
}

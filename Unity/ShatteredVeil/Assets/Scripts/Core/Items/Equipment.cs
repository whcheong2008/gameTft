using System.Collections.Generic;

namespace ShatteredVeil.Core.Items
{
    public class Equipment
    {
        public string Id;
        public ItemSlot Slot;
        public ItemTier Tier;
        public ItemRarity Rarity;
        public int EnhanceLevel;
        public int BaseStatValue;
        public List<Affix> Affixes;
        public Gem[] Sockets;
        public bool IsLocked;

        public Equipment()
        {
            Id = System.Guid.NewGuid().ToString();
            Affixes = new List<Affix>();
            Sockets = System.Array.Empty<Gem>();
        }
    }
}

namespace ShatteredVeil.Core.Items
{
    public class Gem
    {
        public GemType Type;
        public GemRarity Rarity;

        public Gem(GemType type, GemRarity rarity)
        {
            Type = type;
            Rarity = rarity;
        }
    }
}

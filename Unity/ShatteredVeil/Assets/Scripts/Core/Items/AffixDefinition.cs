namespace ShatteredVeil.Core.Items
{
    public class AffixDefinition
    {
        public string Key;
        public float RangeMin;
        public float RangeMax;

        public AffixDefinition(string key, float rangeMin, float rangeMax)
        {
            Key = key;
            RangeMin = rangeMin;
            RangeMax = rangeMax;
        }
    }
}

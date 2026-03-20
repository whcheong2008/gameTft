namespace ShatteredVeil.Core.Items
{
    public class Affix
    {
        public string StatKey;
        public float Value;
        public float RollMin;
        public float RollMax;

        public Affix(string statKey, float value, float rollMin, float rollMax)
        {
            StatKey = statKey;
            Value = value;
            RollMin = rollMin;
            RollMax = rollMax;
        }
    }
}

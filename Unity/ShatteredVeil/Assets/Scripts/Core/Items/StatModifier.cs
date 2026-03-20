namespace ShatteredVeil.Core.Items
{
    public class StatModifier
    {
        public string StatKey;
        public float Value;

        public StatModifier(string statKey, float value)
        {
            StatKey = statKey;
            Value = value;
        }
    }
}

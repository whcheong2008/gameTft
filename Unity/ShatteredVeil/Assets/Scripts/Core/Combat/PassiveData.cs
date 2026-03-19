using System.Collections.Generic;

namespace ShatteredVeil.Core.Combat
{
    public class PassiveData
    {
        public string Id;
        public string Name;
        public string Description;
        public PassiveTrigger Trigger;
        public Dictionary<string, float> Params;

        public float GetParam(string key, float defaultValue = 0f)
        {
            if (Params != null && Params.ContainsKey(key))
                return Params[key];
            return defaultValue;
        }

        public PassiveData()
        {
            Params = new Dictionary<string, float>();
        }
    }
}

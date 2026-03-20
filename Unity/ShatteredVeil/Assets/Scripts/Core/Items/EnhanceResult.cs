namespace ShatteredVeil.Core.Items
{
    public class EnhanceResult
    {
        public bool Success;
        public int NewLevel;
        public bool WasPity;

        public EnhanceResult(bool success, int newLevel, bool wasPity = false)
        {
            Success = success;
            NewLevel = newLevel;
            WasPity = wasPity;
        }
    }
}

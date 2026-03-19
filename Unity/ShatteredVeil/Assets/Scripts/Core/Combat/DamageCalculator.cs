namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Pure C# damage calculation — no Unity dependencies.
    /// Implements the 7-step damage pipeline from COMBAT-DESIGN.md.
    /// Placeholder — full implementation in Prompt 36.
    /// </summary>
    public static class DamageCalculator
    {
        public static float CalculateDamage(float atk, float def, float skillMultiplier, float elementMultiplier)
        {
            return atk * skillMultiplier * elementMultiplier * (1f - def / (def + 100f));
        }
    }
}

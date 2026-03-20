namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// 6x6 element matchup table. Data-driven lookup.
    /// Strong = 1.3, Weak = 0.7, Neutral = 1.0.
    /// </summary>
    public static class ElementSystem
    {
        // Row = attacker, Col = defender
        // Order: Fire=0, Water=1, Earth=2, Wind=3, Lightning=4, Force=5
        private static readonly float[,] Matchups = new float[6, 6]
        {
            //          Fire  Water Earth Wind  Ltn   Force
            /* Fire */  { 1.0f, 0.7f, 1.0f, 1.3f, 1.0f, 1.0f },
            /* Water */ { 1.3f, 1.0f, 0.7f, 1.0f, 0.7f, 1.0f },
            /* Earth */ { 1.0f, 1.3f, 1.0f, 0.7f, 1.3f, 1.0f },
            /* Wind */  { 0.7f, 1.0f, 1.3f, 1.0f, 1.0f, 1.0f },
            /* Ltn */   { 1.0f, 1.3f, 0.7f, 1.0f, 1.0f, 1.0f },
            /* Force */ { 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f },
        };

        public static float GetMultiplier(Element attacker, Element defender)
        {
            return Matchups[(int)attacker, (int)defender];
        }
    }
}

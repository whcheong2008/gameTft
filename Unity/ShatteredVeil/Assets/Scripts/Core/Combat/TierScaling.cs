namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Tier-based scaling factors for ability templates.
    /// Mirrors TIER_SCALE from ability-templates.js.
    /// </summary>
    public static class TierScaling
    {
        public struct ScaleFactors
        {
            public float AbilityMult;
            public float DotDps;
            public float CCDur;
            public float ShieldPct;
            public float PassiveStr;
        }

        // Base scaling per tier (from ability-templates.js TIER_SCALE)
        private static readonly float[] _abilityMult = { 0f, 1.8f, 1.9f, 2.1f, 2.6f, 3.2f };
        private static readonly float[] _dotDps      = { 0f, 10f,  15f,  21f,  26f,  37f  };
        private static readonly float[] _ccDur       = { 0f, 1.2f, 1.5f, 1.75f,2.0f, 2.5f };
        private static readonly float[] _shieldPct   = { 0f, 0.15f,0.20f,0.24f,0.28f,0.37f};
        private static readonly float[] _passiveStr  = { 0f, 1.0f, 1.1f, 1.2f, 1.3f, 1.5f };
        private static readonly float[] _evolvedBonus= { 0f, 1.3f, 1.35f,1.4f, 1.45f,1.5f };

        public static ScaleFactors Get(int tier, bool isEvolved = false)
        {
            int t = tier < 1 ? 1 : (tier > 5 ? 5 : tier);

            float aMult = _abilityMult[t];
            float dot   = _dotDps[t];
            float cc    = _ccDur[t];
            float sh    = _shieldPct[t];
            float ps    = _passiveStr[t];

            if (isEvolved)
            {
                float bonus = _evolvedBonus[t];
                aMult *= bonus;
                dot   *= bonus;
                cc    *= bonus;
                sh    *= bonus;
                ps    *= bonus;
            }

            return new ScaleFactors
            {
                AbilityMult = aMult,
                DotDps = dot,
                CCDur = cc,
                ShieldPct = sh,
                PassiveStr = ps
            };
        }

        public static float GetEvolvedBonus(int tier)
        {
            int t = tier < 1 ? 1 : (tier > 5 ? 5 : tier);
            return _evolvedBonus[t];
        }
    }
}

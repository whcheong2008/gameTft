using System;

namespace ShatteredVeil.Core.Economy
{
    /// <summary>
    /// Pure C# economy system for VE spending, XP, leveling, team size.
    /// Mirrors GROUND-TRUTH.md section 13.
    /// </summary>
    public class EconomySystem
    {
        private int veilEssence;
        private int playerLevel;
        private int currentXP;

        public event Action<int> OnVeilEssenceChanged;
        public event Action<int, int> OnXPChanged; // currentXP, xpToNext
        public event Action<int> OnLevelUp;

        // Starting VE from GROUND-TRUTH.md
        public const int StartingVE = 500;

        // XP curve from GROUND-TRUTH.md section 13
        private static readonly int[] XPPerLevel =
        {
            0,    // L1 (no XP needed)
            360,  // L2
            360,  // L3
            390,  // L4
            390,  // L5
            390,  // L6
            600,  // L7
            600,  // L8
            600,  // L9
            840,  // L10
            840,  // L11
            840,  // L12
            1266, // L13
            1267, // L14
            1267, // L15
            2500, // L16
            2500, // L17
            3250, // L18
            3250, // L19
            6400  // L20
        };

        // Team size by level from GROUND-TRUTH.md
        // L1=3, L4=4, L8=5, L12=6, L16=7, L17+SustainedBonds=8
        private static readonly int[] TeamSizeByLevel =
        {
            3, 3, 3,    // L1-3
            4, 4, 4, 4, // L4-7
            5, 5, 5, 5, // L8-11
            6, 6, 6, 6, // L12-15
            7, 7, 7, 7, 7 // L16-20
        };

        public EconomySystem(int veilEssence, int playerLevel, int currentXP)
        {
            this.veilEssence = veilEssence;
            this.playerLevel = Math.Max(1, Math.Min(20, playerLevel));
            this.currentXP = currentXP;
        }

        public int VeilEssence => veilEssence;
        public int PlayerLevel => playerLevel;
        public int CurrentXP => currentXP;
        public int MaxLevel => 20;

        public int GetXPToNextLevel()
        {
            if (playerLevel >= 20) return 0;
            int idx = playerLevel; // playerLevel is 1-based, XPPerLevel[0] is L1
            return idx < XPPerLevel.Length ? XPPerLevel[idx] : 0;
        }

        public int GetTeamSize()
        {
            int idx = Math.Max(0, Math.Min(TeamSizeByLevel.Length - 1, playerLevel - 1));
            return TeamSizeByLevel[idx];
        }

        public bool CanSpend(int amount) => veilEssence >= amount && amount > 0;

        public bool TrySpend(int amount)
        {
            if (!CanSpend(amount)) return false;
            veilEssence -= amount;
            OnVeilEssenceChanged?.Invoke(veilEssence);
            return true;
        }

        public void GrantVE(int amount)
        {
            if (amount <= 0) return;
            veilEssence += amount;
            OnVeilEssenceChanged?.Invoke(veilEssence);
        }

        public void SetVeilEssence(int ve)
        {
            veilEssence = ve;
            OnVeilEssenceChanged?.Invoke(ve);
        }

        public void AddXP(int xp)
        {
            if (playerLevel >= 20 || xp <= 0) return;
            currentXP += xp;
            int needed = GetXPToNextLevel();
            while (needed > 0 && currentXP >= needed && playerLevel < 20)
            {
                currentXP -= needed;
                playerLevel++;
                OnLevelUp?.Invoke(playerLevel);
                needed = GetXPToNextLevel();
            }
            OnXPChanged?.Invoke(currentXP, GetXPToNextLevel());
        }
    }
}

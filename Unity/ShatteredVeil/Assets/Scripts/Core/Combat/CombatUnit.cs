namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Runtime representation of a unit in combat.
    /// All stats are final computed values (base * star * level * ascension + bonuses).
    /// </summary>
    public class CombatUnit
    {
        // Identity
        public string UnitId;
        public string Name;
        public Element Element;
        public Archetype Archetype;
        public int Tier;
        public int Star;
        public Team Team;

        // Template system (Prompt 45 rework)
        public string AbilityTemplateId;  // e.g., "dot_spreader", "heal_and_harm"
        public string UnitType;            // "warrior", "healer", "tank", "assassin", "mage", "archer"
        public bool IsHealer => UnitType == "healer";

        // Core stats
        public int CurrentHP;
        public int MaxHP;
        public int ATK;
        public int DEF;
        public int SPD;
        public float CritChance;
        public float CritDamage;
        public int Mana;
        public int MaxMana;
        public int AttackRange;

        // Position
        public GridPosition Position;

        // State
        public bool IsAlive;
        public bool IsStunned;
        public bool IsFrozen;
        public bool IsTaunting;
        public bool IsSilenced;

        // Damage reduction (from synergies, items, etc.)
        public float DamageReduction;
        public float DodgeChance;

        // Shield
        public int Shield;

        // Status stubs (filled in Prompt 38)
        public int Stasis;
        public float ElemResist;
        public float Vulnerability;

        // Equipment / hero / synergy flat bonuses (applied at combat start)
        public int BonusHP;
        public int BonusATK;
        public int BonusDEF;
        public int BonusSPD;

        public CombatUnit()
        {
            IsAlive = true;
        }

        /// <summary>
        /// Create a simple combat unit with basic stats for testing.
        /// </summary>
        public static CombatUnit Create(string id, string name, Element element,
            int hp, int atk, int def, int spd, Team team)
        {
            return new CombatUnit
            {
                UnitId = id,
                Name = name,
                Element = element,
                Archetype = Archetype.Vanguard,
                Tier = 1,
                Star = 1,
                Team = team,
                CurrentHP = hp,
                MaxHP = hp,
                ATK = atk,
                DEF = def,
                SPD = spd,
                CritChance = 0f,
                CritDamage = 0.5f,
                Mana = 0,
                MaxMana = 100,
                AttackRange = 1,
                IsAlive = true,
                Position = new GridPosition(0, 0)
            };
        }
    }
}

namespace ShatteredVeil.Core.Economy
{
    /// <summary>
    /// Static building definitions for the 8 camp practices.
    /// Data from GROUND-TRUTH.md section 11 and js/hub.js BUILDINGS object.
    /// Pure C# — no Unity dependencies.
    /// </summary>
    public static class BuildingData
    {
        public static readonly BuildingDefinition[] All = new BuildingDefinition[]
        {
            new BuildingDefinition
            {
                Id = "sustained_bonds",
                Name = "Sustained Bonds",
                Description = "Increases team size capacity",
                MaxLevel = 1,
                UpgradeCosts = new int[] { 0, 500 },
                Effects = new string[]
                {
                    "Locked — unlocked at level 17",
                    "Team size +1 (max 8)"
                },
                PrereqLevel = 17
            },
            new BuildingDefinition
            {
                Id = "attunement_rite",
                Name = "Attunement Rite",
                Description = "Summon Echoes from the Veil",
                MaxLevel = 5,
                UpgradeCosts = new int[] { 0, 80, 200, 400, 800, 1500 },
                Effects = new string[]
                {
                    "Standard rite rates",
                    "Multi-rite: 10x for 450 VE (10% discount)",
                    "Multi-rite: 10x for 420 VE (16% discount)",
                    "Multi-rite: 10x for 400 VE (20% discount)",
                    "Pity: guaranteed T3+ every 20 rites",
                    "Pity: guaranteed T4+ every 30 rites"
                },
                PrereqLevel = 0
            },
            new BuildingDefinition
            {
                Id = "essence_reservoir",
                Name = "Essence Reservoir",
                Description = "Store and manage harvested Veil Essence",
                MaxLevel = 5,
                UpgradeCosts = new int[] { 0, 50, 120, 300, 600, 1000 },
                Effects = new string[]
                {
                    "Standard VE rewards",
                    "+5% VE from missions, 12 item slots",
                    "+10% VE, 14 item slots",
                    "+15% VE, 16 item slots",
                    "+20% VE, 18 item slots",
                    "+25% VE, 20 item slots"
                },
                PrereqLevel = 0
            },
            new BuildingDefinition
            {
                Id = "deep_resonance",
                Name = "Deep Resonance",
                Description = "Evolve Echoes into powerful new forms",
                MaxLevel = 3,
                UpgradeCosts = new int[] { 0, 300, 800, 2000 },
                Effects = new string[]
                {
                    "Locked — build to unlock evolution",
                    "Can evolve units (500-2000 VE by tier)",
                    "Evolution cost reduced by 25%",
                    "Evolution cost reduced by 50%"
                },
                PrereqLevel = 0
            },
            new BuildingDefinition
            {
                Id = "echo_shaping",
                Name = "Echo Shaping",
                Description = "Reshape Veil energy within items",
                MaxLevel = 5,
                UpgradeCosts = new int[] { 0, 200, 500, 1000, 2000, 4000 },
                Effects = new string[]
                {
                    "Locked — build to unlock forging",
                    "Reroll: change item rarity (100 VE)",
                    "Disassemble: break combined items (50 VE)",
                    "Transmute: convert components (200 VE)",
                    "Set Crafting: forge set items (500-1000 VE)",
                    "Advanced Crafting: ability items + evolved gates (1000-2000 VE)"
                },
                PrereqLevel = 0
            },
            new BuildingDefinition
            {
                Id = "prism_focus",
                Name = "Prism Focus",
                Description = "Craft and socket crystallized Veil gems",
                MaxLevel = 5,
                UpgradeCosts = new int[] { 0, 500, 1200, 2500, 5000, 10000 },
                Effects = new string[]
                {
                    "Locked — unlocks gem operations",
                    "Gem inventory + gem socketing",
                    "Gem combining (3>1) + removal",
                    "Gem transmute (change type, keep rarity)",
                    "Auto-socket suggestion",
                    "Prismatic Forge: combine 3 Epic gems > Prismatic"
                },
                PrereqLevel = 12
            },
            new BuildingDefinition
            {
                Id = "veil_wellspring",
                Name = "Veil Wellspring",
                Description = "Channel ambient Veil power for mana and ability",
                MaxLevel = 5,
                UpgradeCosts = new int[] { 0, 800, 2000, 4000, 8000, 15000 },
                Effects = new string[]
                {
                    "Locked — unlocks mana bonuses",
                    "+5 starting mana for all units",
                    "Mana generation from attacks +10%",
                    "Ability damage +5% (global)",
                    "First ability cast costs 10% less mana",
                    "Full mana bar grants +10% ATK until cast"
                },
                PrereqLevel = 15
            },
            new BuildingDefinition
            {
                Id = "kindred_circle",
                Name = "Kindred Circle",
                Description = "Where bonded Echoes train together",
                MaxLevel = 5,
                UpgradeCosts = new int[] { 0, 600, 1500, 3500, 7000, 12000 },
                Effects = new string[]
                {
                    "Locked — unlocks bond viewer",
                    "View active bonds and bonuses",
                    "Bond bonuses increased by 25%",
                    "Unlock bond quests (extra VE)",
                    "Bond bonuses increased by 50% total",
                    "Unlock trio bonds (3-unit bonds active)"
                },
                PrereqLevel = 10
            }
        };

        public static BuildingDefinition GetById(string id)
        {
            for (int i = 0; i < All.Length; i++)
            {
                if (All[i].Id == id) return All[i];
            }
            return null;
        }
    }

    public class BuildingDefinition
    {
        public string Id;
        public string Name;
        public string Description;
        public int MaxLevel;
        public int[] UpgradeCosts;
        public string[] Effects;
        public int PrereqLevel;

        public string GetEffect(int level)
        {
            if (level < 0 || level >= Effects.Length)
                return Effects.Length > 0 ? Effects[0] : "";
            return Effects[level];
        }

        public int GetUpgradeCost(int currentLevel)
        {
            int nextLevel = currentLevel + 1;
            if (nextLevel >= UpgradeCosts.Length || currentLevel >= MaxLevel)
                return int.MaxValue;
            return UpgradeCosts[nextLevel];
        }

        public bool IsPrereqMet(int playerLevel)
        {
            return PrereqLevel <= 0 || playerLevel >= PrereqLevel;
        }
    }
}

using System.Collections.Generic;

namespace ShatteredVeil.Core.Missions
{
    /// <summary>
    /// Static catalog of all 74 stages across 8 regions.
    /// Mirrors js/missions.js data — single source of truth for Unity.
    /// Structure: 9-9-9-9-10-10-10-8 stages per region.
    /// </summary>
    public static class MissionCatalog
    {
        private static StageData[] _stages;
        private static Dictionary<int, RegionData> _regions;
        private static Dictionary<string, StageData> _stageById;

        public static StageData[] AllStages
        {
            get
            {
                if (_stages == null) BuildCatalog();
                return _stages;
            }
        }

        public static Dictionary<int, RegionData> Regions
        {
            get
            {
                if (_regions == null) BuildCatalog();
                return _regions;
            }
        }

        public static StageData GetStage(string id)
        {
            if (_stageById == null) BuildCatalog();
            return _stageById.TryGetValue(id, out var stage) ? stage : null;
        }

        public static RegionData GetRegion(int regionNumber)
        {
            if (_regions == null) BuildCatalog();
            return _regions.TryGetValue(regionNumber, out var region) ? region : null;
        }

        public static int TotalStageCount => AllStages.Length;
        public static int RegionCount => 8;

        /// <summary>VE reward per normal stage by region.</summary>
        public static readonly Dictionary<int, int> VEPerStage = new Dictionary<int, int>
        {
            { 1, 200 }, { 2, 350 }, { 3, 550 }, { 4, 750 },
            { 5, 1000 }, { 6, 1300 }, { 7, 1600 }, { 8, 2000 }
        };

        /// <summary>Boss VE reward by region (2.5x normal).</summary>
        public static readonly Dictionary<int, int> BossVEPerRegion = new Dictionary<int, int>
        {
            { 1, 500 }, { 2, 700 }, { 3, 1100 }, { 4, 1500 },
            { 5, 2000 }, { 6, 2600 }, { 7, 3200 }, { 8, 4000 }
        };

        /// <summary>XP per stage by region.</summary>
        public static readonly Dictionary<int, int> XPPerStage = new Dictionary<int, int>
        {
            { 1, 80 }, { 2, 130 }, { 3, 200 }, { 4, 280 },
            { 5, 380 }, { 6, 500 }, { 7, 650 }, { 8, 800 }
        };

        private static void BuildCatalog()
        {
            var stages = new List<StageData>();

            // ===== REGION 1: The Frontier (9 stages) =====
            stages.Add(MakeStage("r1_s1", 1, "First Steps", 1, StageType.Story,
                "The Veil is thinnest at the frontier edge.", 1, null,
                false, null, new[] { W(3, 1, 2), W(4, 1, 2) },
                R(200, 80, 2), DW(70, 30, 0, 0, 0)));
            stages.Add(MakeStage("r1_s2", 1, "Border Patrol", 2, StageType.Character,
                "More creatures slip through, wave after wave.", 1, null,
                false, null, new[] { W(4, 1, 2), W(5, 1, 3), W(6, 1, 3) },
                R(200, 80, 2), DW(70, 30, 0, 0, 0)));
            stages.Add(MakeStage("r1_s3", 1, "The Crossing", 3, StageType.Gameplay,
                "Stronger creatures guard the ancient bridge.", 2, null,
                false, null, new[] { W(5, 2, 3), W(7, 2, 3), W(8, 2, 4) },
                R(200, 80, 2), DW(70, 30, 0, 0, 0)));
            stages.Add(MakeStage("r1_s4", 1, "Settling In", 4, StageType.Story,
                "Element-biased enemies test your positioning.", 2, null,
                false, null, new[] { W(6, 2, 3, "fire"), W(7, 2, 3, "water"), W(8, 2, 4) },
                R(200, 80, 2), DW(70, 30, 0, 0, 0)));
            stages.Add(MakeStage("r1_s5", 1, "Night Raid", 5, StageType.Gameplay,
                "Voidspawn attack the camp at night.", 3, null,
                false, null, new[] { W(6, 2, 3), W(7, 2, 4), W(8, 2, 4) },
                R(200, 80, 2), DW(70, 30, 0, 0, 0)));
            stages.Add(MakeStage("r1_s6", 1, "The Family", 6, StageType.Character,
                "A frontier family refuses to evacuate.", 3, null,
                false, null, new[] { W(7, 2, 3), W(8, 2, 4), W(8, 2, 4) },
                R(200, 80, 2), DW(70, 30, 0, 0, 0)));
            stages.Add(MakeStage("r1_s7", 1, "Otho's Notes", 7, StageType.Story,
                "Voidspawn emergence near the Veilborn quarter.", 3, null,
                false, null, new[] { W(7, 2, 3), W(8, 2, 4), W(8, 2, 4) },
                R(200, 80, 2), DW(70, 30, 0, 0, 0)));
            stages.Add(MakeStage("r1_s8", 1, "Into the Wild", 8, StageType.Gameplay,
                "Mixed creatures with elemental affinities.", 4, null,
                false, null, new[] { W(7, 2, 3, "fire"), W(8, 2, 4, "water"), W(8, 2, 4) },
                R(200, 80, 2), DW(70, 30, 0, 0, 0)));
            stages.Add(MakeStage("r1_boss", 1, "The Veil Warden", 9, StageType.Boss,
                "A corrupted entity guards the frontier gate.", 4, null,
                true, "veil_warden", new WaveConfig[0],
                R(500, 200, 2), DW(70, 30, 0, 0, 0)));

            // ===== REGION 2: The Barracks Trials (9 stages) =====
            stages.Add(MakeStage("r2_s1", 2, "The Road to the Barracks", 1, StageType.Story,
                "Guardians absorb the punishment so damage dealers survive.", 5,
                StageLock.Archetype("guardian", 2),
                false, null, new[] { W(5, 2, 3), W(7, 2, 3, null, "duelist") },
                R(350, 130, 2), DW(50, 40, 10, 0, 0)));
            stages.Add(MakeStage("r2_s2", 2, "Hold the Line", 2, StageType.Character,
                "Heavy melee rushers charge your backline.", 5,
                StageLock.Archetype("guardian", 2),
                false, null, new[] { W(6, 2, 3, null, "duelist"), W(8, 2, 4, null, "predator"), W(10, 3, 4, null, "duelist") },
                R(350, 130, 2), DW(50, 40, 10, 0, 0)));
            stages.Add(MakeStage("r2_s3", 2, "Death from Afar", 3, StageType.Gameplay,
                "Tanky but slow enemies lumber forward.", 6,
                StageLock.Archetype("ranger", 2),
                false, null, new[] { W(8, 2, 3, null, "guardian"), W(10, 3, 4, null, "guardian"), W(12, 3, 5, null, "guardian") },
                R(350, 130, 2), DW(50, 40, 10, 0, 0)));
            stages.Add(MakeStage("r2_s4", 2, "The Arcane Barrage", 4, StageType.Character,
                "Spread enemies with a healer in the back.", 6,
                StageLock.ArchetypeOr(new[] { "sorcerer", "mystic" }, 2),
                false, null, new[] { W(8, 2, 4, null, "sage"), W(10, 3, 5), W(13, 3, 5, null, "sage") },
                R(350, 130, 2), DW(50, 40, 10, 0, 0)));
            stages.Add(MakeStage("r2_s5", 2, "The Hunt", 5, StageType.Gameplay,
                "A dangerous backline carry hides behind tanks.", 7,
                StageLock.ArchetypeOr(new[] { "predator", "duelist" }, 2),
                false, null, new[] { W(10, 3, 4, null, "guardian"), W(12, 3, 5, null, "guardian"), W(13, 3, 5, null, "ranger") },
                R(350, 130, 2), DW(50, 40, 10, 0, 0)));
            stages.Add(MakeStage("r2_s6", 2, "Second Chances", 6, StageType.Character,
                "Multi-wave sustain check.", 7,
                StageLock.Archetype("sage", 2),
                false, null, new[] { W(8, 2, 3), W(10, 2, 4), W(10, 3, 4) },
                R(350, 130, 2), DW(50, 40, 10, 0, 0)));
            stages.Add(MakeStage("r2_s7", 2, "The Archive", 7, StageType.Story,
                "Voidspawn incursion near the archive.", 8, null,
                false, null, new[] { W(10, 3, 4), W(12, 3, 5) },
                R(350, 130, 2), DW(50, 40, 10, 0, 0)));
            stages.Add(MakeStage("r2_s8", 2, "Restoration", 8, StageType.Gameplay,
                "Final training exercise.", 8, null,
                false, null, new[] { W(8, 2, 3), W(10, 2, 4), W(10, 3, 4), W(12, 3, 5) },
                R(350, 130, 2), DW(50, 40, 10, 0, 0)));
            stages.Add(MakeStage("r2_boss", 2, "The Archon", 9, StageType.Boss,
                "Shifts between archetype stances.", 8, null,
                true, "archon", new WaveConfig[0],
                R(700, 300, 2), DW(50, 40, 10, 0, 0)));

            // ===== REGION 3: The Synergy Trials (9 stages) =====
            stages.Add(MakeStage("r3_s1", 3, "Shield and Fang", 1, StageType.Gameplay,
                "Balanced enemy comp with frontline and backline.", 9,
                StageLock.CompoundLock(new List<StageLock> { StageLock.Archetype("guardian", 2), StageLock.Archetype("predator", 2) }),
                false, null, new[] { W(8, 3, 4), W(10, 3, 4), W(13, 3, 5) },
                R(550, 200, 2), DW(30, 35, 35, 0, 0)));
            stages.Add(MakeStage("r3_s2", 3, "The Long Watch", 2, StageType.Story,
                "Aggressive fast rushers. Rangers and Sages needed.", 9,
                StageLock.CompoundLock(new List<StageLock> { StageLock.Archetype("ranger", 2), StageLock.Archetype("sage", 2) }),
                false, null, new[] { W(9, 3, 4, null, "predator"), W(11, 3, 5, null, "duelist"), W(13, 3, 5, null, "predator") },
                R(550, 200, 2), DW(30, 35, 35, 0, 0)));
            stages.Add(MakeStage("r3_s3", 3, "Elemental Clash", 3, StageType.Gameplay,
                "Mono-element enemies test your element coverage.", 10,
                StageLock.ElementCount(2),
                false, null, new[] { W(10, 3, 4, "fire"), W(12, 3, 5, "water"), W(14, 4, 5, "earth") },
                R(550, 200, 2), DW(30, 35, 35, 0, 0)));
            stages.Add(MakeStage("r3_s4", 3, "Cracks", 4, StageType.Story,
                "Deep stacking changes the game.", 10,
                StageLock.ArchetypeDeep(3),
                false, null, new[] { W(10, 3, 4), WS(12, 3, 5, true), WS(14, 4, 5, true) },
                R(550, 200, 2), DW(30, 35, 35, 0, 0)));
            stages.Add(MakeStage("r3_s5", 3, "Deep Bonds", 5, StageType.Gameplay,
                "Deep archetype synergy needed to crack it.", 11, null,
                false, null, new[] { W(11, 3, 5), W(13, 4, 5), W(16, 4, 6) },
                R(550, 200, 2), DW(30, 35, 35, 0, 0)));
            stages.Add(MakeStage("r3_s6", 3, "The Veteran", 6, StageType.Story,
                "Attacks track Veilborn headcount.", 11,
                StageLock.ElementCount(2),
                false, null, new[] { W(12, 3, 5), W(14, 4, 5), W(16, 4, 6) },
                R(550, 200, 2), DW(30, 35, 35, 0, 0)));
            stages.Add(MakeStage("r3_s7", 3, "Convergence", 7, StageType.Gameplay,
                "Multiple Voidspawn forces converging.", 12, null,
                false, null, new[] { W(12, 3, 5), W(14, 4, 5), W(16, 4, 6), W(19, 4, 6) },
                R(550, 200, 2), DW(30, 35, 35, 0, 0)));
            stages.Add(MakeStage("r3_s8", 3, "The Horizon", 8, StageType.Character,
                "Final sweep before the boss.", 12, null,
                false, null, new[] { W(13, 4, 5), W(15, 4, 5), W(16, 4, 6) },
                R(550, 200, 2), DW(30, 35, 35, 0, 0)));
            stages.Add(MakeStage("r3_boss", 3, "The Twin Heralds", 9, StageType.Boss,
                "Two bosses at once. Proximity buff and kill-order puzzle.", 12, null,
                true, "twin_heralds", new WaveConfig[0],
                R(1100, 500, 2), DW(30, 35, 35, 0, 0)));

            // ===== REGION 4: The Shattered Lands (9 stages) =====
            stages.Add(MakeStage("r4_s1", 4, "Thin Air", 1, StageType.Story,
                "Entering the Shattered Lands.", 13, null,
                false, null, new[] { W(10, 3, 4), W(13, 4, 5), W(16, 4, 5) },
                R(750, 280, 3), DW(15, 25, 45, 15, 0)));
            stages.Add(MakeStage("r4_s2", 4, "The Observatory", 2, StageType.Story,
                "Protect the observatory while Otho researches.", 13, null,
                false, null, new[] { W(11, 3, 5), W(14, 4, 5), W(16, 4, 6) },
                R(750, 280, 3), DW(15, 25, 45, 15, 0),
                new[] { EncounterMechanic.ProtectObjective }));
            stages.Add(MakeStage("r4_s3", 4, "The Sovereign's Shadow", 3, StageType.Story,
                "Retreat mission — the Sovereign regenerates enemies.", 14, null,
                false, null, new[] { W(13, 3, 5), W(16, 4, 5), W(20, 4, 6) },
                R(750, 280, 3), DW(15, 25, 45, 15, 0),
                new[] { EncounterMechanic.ReinforcementPressure }));
            stages.Add(MakeStage("r4_s4", 4, "The Silence", 4, StageType.Character,
                "The morning after the revelation.", 14, null,
                false, null, new[] { W(13, 4, 5), W(16, 4, 5), W(18, 4, 6) },
                R(750, 280, 3), DW(15, 25, 45, 15, 0)));
            stages.Add(MakeStage("r4_s5", 4, "Midnight", 5, StageType.Story,
                "Kael vs Lyric. The fracture.", 15, null,
                false, null, new[] { W(14, 4, 5), W(16, 4, 5), W(20, 4, 6) },
                R(750, 280, 3), DW(15, 25, 45, 15, 0)));
            stages.Add(MakeStage("r4_s6", 4, "The Priority", 6, StageType.Gameplay,
                "Kill the VIP healer.", 15, null,
                false, null, new[] { W(15, 4, 5), W(18, 4, 6), W(20, 4, 6) },
                R(750, 280, 3), DW(15, 25, 45, 15, 0),
                new[] { EncounterMechanic.VipTarget }));
            stages.Add(MakeStage("r4_s7", 4, "Against the Clock", 7, StageType.Gameplay,
                "Destroy the Veil Crystal before 45 seconds.", 16, null,
                false, null, new[] { W(16, 4, 5), W(18, 4, 6), W(20, 4, 6) },
                R(750, 280, 3), DW(15, 25, 45, 15, 0),
                new[] { EncounterMechanic.Countdown }));
            stages.Add(MakeStage("r4_s8", 4, "Endless Tide", 8, StageType.Gameplay,
                "Three spawn points produce new enemies.", 16, null,
                false, null, new[] { W(16, 4, 5), W(20, 4, 6), W(24, 4, 7) },
                R(750, 280, 3), DW(15, 25, 45, 15, 0),
                new[] { EncounterMechanic.ReinforcementPressure }));
            stages.Add(MakeStage("r4_boss", 4, "The Shattered Colossus", 9, StageType.Boss,
                "Cycles through encounter mechanics as phase transitions.", 16, null,
                true, "shattered_colossus", new WaveConfig[0],
                R(1500, 700, 3), DW(15, 25, 45, 15, 0)));

            // ===== REGION 5: The Dual Convergence (10 stages) =====
            stages.Add(MakeStage("r5_s1", 5, "The Theory", 1, StageType.Story,
                "Mono-element enemies challenge your dual-element team.", 17,
                StageLock.ElementDual(),
                false, null, new[] { W(12, 3, 5, "fire"), W(16, 4, 5, "water"), W(20, 4, 6) },
                R(1000, 380, 3), DW(5, 15, 40, 35, 5)));
            stages.Add(MakeStage("r5_s2", 5, "Mira's Touch", 2, StageType.Character,
                "Senna teaches Mira attunement.", 17,
                StageLock.ElementDual(),
                false, null, new[] { W(14, 4, 5, "earth"), W(18, 4, 6, "wind"), W(22, 5, 6) },
                R(1000, 380, 3), DW(5, 15, 40, 35, 5)));
            stages.Add(MakeStage("r5_s3", 5, "Shifting Tides", 3, StageType.Gameplay,
                "Each wave switches element.", 18,
                StageLock.ElementDual(),
                false, null, new[] { W(16, 4, 5, "earth"), W(20, 4, 6, "wind"), W(24, 5, 6) },
                R(1000, 380, 3), DW(5, 15, 40, 35, 5)));
            stages.Add(MakeStage("r5_s4", 5, "The River", 4, StageType.Story,
                "Mirror-match with dual-element enemies.", 18,
                StageLock.ElementDual(),
                false, null, new[] { WS(18, 4, 5, true), WS(22, 5, 6, true), WS(26, 5, 6, true) },
                R(1000, 380, 3), DW(5, 15, 40, 35, 5)));
            stages.Add(MakeStage("r5_s5", 5, "Silent March", 5, StageType.Character,
                "The group pushes on.", 19,
                StageLock.ElementDual(),
                false, null, new[] { W(18, 4, 5), W(22, 5, 6), W(24, 5, 6) },
                R(1000, 380, 3), DW(5, 15, 40, 35, 5)));
            stages.Add(MakeStage("r5_s6", 5, "Elemental Pressure", 6, StageType.Gameplay,
                "Escalating element diversity across waves.", 19,
                StageLock.ElementDual(),
                false, null, new[] { W(20, 4, 5, "lightning"), W(24, 5, 6), W(28, 5, 7) },
                R(1000, 380, 3), DW(5, 15, 40, 35, 5)));
            stages.Add(MakeStage("r5_s7", 5, "The Pack", 7, StageType.Gameplay,
                "A pack of evolved Voidspawn blocks the path.", 20,
                StageLock.ElementDual(),
                false, null, new[] { WE(22, 5, 5), WE(26, 5, 6), WE(28, 5, 6) },
                R(1000, 380, 3), DW(5, 15, 40, 35, 5)));
            stages.Add(MakeStage("r5_s8", 5, "Senna's Burden", 8, StageType.Character,
                "Senna can't sleep.", 20,
                StageLock.ElementDual(),
                false, null, new[] { W(24, 5, 6), W(28, 5, 6), W(28, 5, 7) },
                R(1000, 380, 3), DW(5, 15, 40, 35, 5)));
            stages.Add(MakeStage("r5_s9", 5, "Convergence Point", 9, StageType.Gameplay,
                "Hard pre-boss stage with enemy synergies.", 20,
                StageLock.ElementDual(),
                false, null, new[] { WS(24, 5, 5, true), WS(28, 5, 6, true), WS(32, 5, 7, true) },
                R(1000, 380, 3), DW(5, 15, 40, 35, 5)));
            stages.Add(MakeStage("r5_boss", 5, "The Elemental Chimera", 10, StageType.Boss,
                "Shifts between elements every 20s.", 20, null,
                true, "elemental_chimera", new WaveConfig[0],
                R(2000, 900, 3), DW(5, 15, 40, 35, 5)));

            // ===== REGION 6: The Elemental Crucible (10 stages) =====
            stages.Add(MakeStage("r6_s1", 6, "Four Winds", 1, StageType.Story,
                "Ease into 4-element team building.", 21,
                StageLock.ElementMin(4),
                false, null, new[] { W(14, 4, 5), W(18, 4, 6), W(22, 5, 6) },
                R(1300, 500, 3), DW(5, 10, 30, 40, 15)));
            stages.Add(MakeStage("r6_s2", 6, "Fire and Stone", 2, StageType.Story,
                "Fire and Earth enemies with active synergies.", 21,
                StageLock.ElementMin(4),
                false, null, new[] { WS(16, 4, 5, true, "fire"), WS(20, 5, 6, true, "earth"), WS(24, 5, 6, true, "fire") },
                R(1300, 500, 3), DW(5, 10, 30, 40, 15)));
            stages.Add(MakeStage("r6_s3", 6, "Storm and Sea", 3, StageType.Gameplay,
                "Water and Wind enemies with active synergies.", 22,
                StageLock.ElementMin(4),
                false, null, new[] { WS(18, 4, 5, true, "water"), WS(22, 5, 6, true, "wind"), WS(26, 5, 7, true) },
                R(1300, 500, 3), DW(5, 10, 30, 40, 15)));
            stages.Add(MakeStage("r6_s4", 6, "Mira's Question", 4, StageType.Story,
                "Lightning and Force enemies.", 22,
                StageLock.ElementMin(4),
                false, null, new[] { WS(20, 4, 5, true, "lightning"), WS(24, 5, 6, true, "force"), WS(26, 5, 7, true, "lightning") },
                R(1300, 500, 3), DW(5, 10, 30, 40, 15)));
            stages.Add(MakeStage("r6_s5", 6, "Lightning Surge", 5, StageType.Gameplay,
                "Lightning and Force enemies. Bring Earth.", 23,
                StageLock.ElementMin(4),
                false, null, new[] { WS(22, 4, 5, true, "lightning"), WS(26, 5, 6, true, "force"), WS(30, 5, 7, true, "lightning") },
                R(1300, 500, 3), DW(5, 10, 30, 40, 15)));
            stages.Add(MakeStage("r6_s6", 6, "The Weight", 6, StageType.Character,
                "Multi-wave endurance check.", 23,
                StageLock.ElementMin(4),
                false, null, new[] { WS(24, 5, 6, true), WS(28, 5, 6, true), WS(30, 5, 7, true) },
                R(1300, 500, 3), DW(5, 10, 30, 40, 15)));
            stages.Add(MakeStage("r6_s7", 6, "The Full Spectrum", 7, StageType.Gameplay,
                "All 6 elements represented.", 24,
                StageLock.ElementMin(4),
                false, null, new[] { WSE(26, 5, 6), WSE(30, 5, 7), WSE(30, 5, 7) },
                R(1300, 500, 3), DW(5, 10, 30, 40, 15)));
            stages.Add(MakeStage("r6_s8", 6, "Crucible's Peak", 8, StageType.Gameplay,
                "Hardest non-boss stage in region.", 24,
                StageLock.ElementMin(4),
                false, null, new[] { WSE(28, 5, 6), WSE(30, 5, 7), WSE(30, 5, 7) },
                R(1300, 500, 3), DW(5, 10, 30, 40, 15)));
            stages.Add(MakeStage("r6_s9", 6, "Looking East", 9, StageType.Character,
                "Final sweep before the Sentinel.", 24,
                StageLock.ElementMin(4),
                false, null, new[] { WS(28, 5, 6, true), WS(30, 5, 7, true), WS(30, 5, 7, true) },
                R(1300, 500, 3), DW(5, 10, 30, 40, 15)));
            stages.Add(MakeStage("r6_boss", 6, "The Prismatic Sentinel", 10, StageType.Boss,
                "Rotating element immunity and vulnerability.", 24, null,
                true, "prismatic_sentinel", new WaveConfig[0],
                R(2600, 1200, 3), DW(5, 10, 30, 40, 15)));

            // ===== REGION 7: The Proving Grounds (10 stages) =====
            stages.Add(MakeStage("r7_s1", 7, "Reunited", 1, StageType.Story,
                "Escalating threat tests healing endurance.", 25,
                StageLock.Archetype("sage", 3),
                false, null, new[] { W(16, 4, 5), W(20, 5, 6), W(24, 5, 6) },
                R(1600, 650, 3), DW(0, 5, 20, 45, 30),
                new[] { EncounterMechanic.EscalatingThreat }));
            stages.Add(MakeStage("r7_s2", 7, "Voss", 2, StageType.Story,
                "No element synergies allowed. Pure archetype power.", 25,
                StageLock.NoElementSynergy(),
                false, null, new[] { W(18, 4, 5), W(22, 5, 6), W(28, 5, 7) },
                R(1600, 650, 3), DW(0, 5, 20, 45, 30),
                new[] { EncounterMechanic.ReinforcementPressure }));
            stages.Add(MakeStage("r7_s3", 7, "Divided Command", 3, StageType.Gameplay,
                "Protect a friendly NPC while hunting a carry.", 26,
                StageLock.CompoundLock(new List<StageLock> { StageLock.Archetype("predator", 2), StageLock.Archetype("guardian", 2) }),
                false, null, new[] { W(20, 5, 5), W(24, 5, 6), W(28, 5, 7) },
                R(1600, 650, 3), DW(0, 5, 20, 45, 30),
                new[] { EncounterMechanic.ProtectObjective }));
            stages.Add(MakeStage("r7_s4", 7, "Nosebleed", 4, StageType.Character,
                "Element distribution puzzle with split formation.", 26,
                StageLock.ElementMin(3),
                false, null, new[] { W(22, 5, 5), W(26, 5, 6), W(28, 5, 7) },
                R(1600, 650, 3), DW(0, 5, 20, 45, 30),
                new[] { EncounterMechanic.SplitFormation }));
            stages.Add(MakeStage("r7_s5", 7, "Stripped Down", 5, StageType.Gameplay,
                "No element synergies allowed. Pure archetype power.", 27,
                StageLock.NoElementSynergy(),
                false, null, new[] { W(24, 5, 6), W(28, 5, 6), W(28, 5, 7) },
                R(1600, 650, 3), DW(0, 5, 20, 45, 30)));
            stages.Add(MakeStage("r7_s6", 7, "Fractures", 6, StageType.Character,
                "VIP + Countdown mechanics.", 27, null,
                false, null, new[] { W(24, 5, 6), W(28, 5, 7), W(28, 5, 7) },
                R(1600, 650, 3), DW(0, 5, 20, 45, 30),
                new[] { EncounterMechanic.VipTarget, EncounterMechanic.Countdown }));
            stages.Add(MakeStage("r7_s7", 7, "Fractured Elements", 7, StageType.Gameplay,
                "Forced split deployment.", 27,
                StageLock.ElementMin(3),
                false, null, new[] { W(26, 5, 5), W(28, 5, 6), W(32, 5, 7) },
                R(1600, 650, 3), DW(0, 5, 20, 45, 30),
                new[] { EncounterMechanic.SplitFormation }));
            stages.Add(MakeStage("r7_s8", 7, "Final Judgment", 8, StageType.Gameplay,
                "Deep archetype stacking vs countdown AND VIP.", 28,
                StageLock.ArchetypeDeep(4),
                false, null, new[] { W(28, 5, 6), W(32, 5, 7), W(32, 5, 7) },
                R(1600, 650, 3), DW(0, 5, 20, 45, 30),
                new[] { EncounterMechanic.Countdown, EncounterMechanic.VipTarget }));
            stages.Add(MakeStage("r7_s9", 7, "The Address", 9, StageType.Story,
                "Kael presents the seal plan.", 28, null,
                false, null, new[] { W(28, 5, 6), W(32, 5, 7), W(32, 5, 7) },
                R(1600, 650, 3), DW(0, 5, 20, 45, 30)));
            stages.Add(MakeStage("r7_boss", 7, "The Arbiter of Trials", 10, StageType.Boss,
                "Imposes constraints mid-fight.", 28, null,
                true, "arbiter_of_trials", new WaveConfig[0],
                R(3200, 1500, 3), DW(0, 5, 20, 45, 30)));

            // ===== REGION 8: The Abyss Gate (8 stages) =====
            stages.Add(MakeStage("r8_s1", 8, "Dawn", 1, StageType.Story,
                "The last morning. Maximum difficulty enemies.", 29, null,
                false, null, new[] { WSE(18, 5, 6), WSE(22, 5, 6), WSE(26, 5, 7), WSE(30, 5, 7) },
                R(2000, 800, 4), DW(0, 0, 15, 45, 40)));
            stages.Add(MakeStage("r8_s2", 8, "The Gauntlet", 2, StageType.Gameplay,
                "Reinforcement spawns plus escalating elite.", 29, null,
                false, null, new[] { WSE(20, 5, 6), WSE(24, 5, 7), WSE(30, 5, 7), WSE(34, 5, 7) },
                R(2000, 800, 4), DW(0, 0, 15, 45, 40),
                new[] { EncounterMechanic.ReinforcementPressure, EncounterMechanic.EscalatingThreat }));
            stages.Add(MakeStage("r8_s3", 8, "Shattered Ground", 3, StageType.Gameplay,
                "Team split plus a VIP on one side.", 29, null,
                false, null, new[] { WSE(22, 5, 6), WSE(26, 5, 7), WSE(30, 5, 7), WSE(34, 5, 7) },
                R(2000, 800, 4), DW(0, 0, 15, 45, 40),
                new[] { EncounterMechanic.SplitFormation, EncounterMechanic.VipTarget }));
            stages.Add(MakeStage("r8_s4", 8, "The Crucible Returns", 4, StageType.Gameplay,
                "Wipe timer AND a friendly NPC to protect.", 29, null,
                false, null, new[] { WSE(24, 5, 6), WSE(28, 5, 7), WSE(30, 5, 7), WSE(34, 5, 7) },
                R(2000, 800, 4), DW(0, 0, 15, 45, 40),
                new[] { EncounterMechanic.Countdown, EncounterMechanic.ProtectObjective }));
            stages.Add(MakeStage("r8_s5", 8, "The Threshold", 5, StageType.Character,
                "Maximum non-boss difficulty.", 29, null,
                false, null, new[] { WSE(26, 5, 6), WSE(30, 5, 7), WSE(30, 5, 7), WSE(34, 5, 7) },
                R(2000, 800, 4), DW(0, 0, 15, 45, 40)));
            stages.Add(MakeStage("r8_s6", 8, "The Void's Edge", 6, StageType.Gameplay,
                "Void-element enemies negate element advantages.", 29, null,
                false, null, new[] { WSE(28, 5, 6, "force"), WSE(30, 5, 7, "force"), WSE(34, 5, 7, "force"), WSE(34, 5, 7, "force") },
                R(2000, 800, 4), DW(0, 0, 15, 45, 40)));
            stages.Add(MakeStage("r8_s7", 8, "Before the End", 7, StageType.Character,
                "The final camp.", 29, null,
                false, null, new[] { WSE(28, 5, 6), WSE(30, 5, 7), WSE(34, 5, 7), WSE(34, 5, 7) },
                R(2000, 800, 4), DW(0, 0, 15, 45, 40)));
            stages.Add(MakeStage("r8_boss", 8, "The Eternal Throne", 8, StageType.Boss,
                "The Void Sovereign. Three phases.", 29, null,
                true, "void_sovereign", new WaveConfig[0],
                R(4000, 2000, 4), DW(0, 0, 15, 45, 40)));

            _stages = stages.ToArray();

            // Build lookup
            _stageById = new Dictionary<string, StageData>(_stages.Length);
            foreach (var s in _stages)
                _stageById[s.Id] = s;

            // Build regions
            _regions = new Dictionary<int, RegionData>
            {
                { 1, MakeRegion(1, "The Frontier", "Basic combat, positioning",
                    new[] { "r1_s1","r1_s2","r1_s3","r1_s4","r1_s5","r1_s6","r1_s7","r1_s8","r1_boss" },
                    new RegionReward { Description = "Unlock Summoning Circle upgrades + 1 free 10-pull", FreeMultiRoll = 1 }) },
                { 2, MakeRegion(2, "The Barracks Trials", "Archetype roles",
                    new[] { "r2_s1","r2_s2","r2_s3","r2_s4","r2_s5","r2_s6","r2_s7","r2_s8","r2_boss" },
                    new RegionReward { Description = "Unlock Evolution Lab + 500 VE + 1 random Cost-3 unit", VE = 500, RandomUnitMinCost = 3, RandomUnitMaxCost = 3 }) },
                { 3, MakeRegion(3, "The Synergy Trials", "Synergy pairing",
                    new[] { "r3_s1","r3_s2","r3_s3","r3_s4","r3_s5","r3_s6","r3_s7","r3_s8","r3_boss" },
                    new RegionReward { Description = "Unlock Forge Level 3 (Transmute) + 1 essence of choice", EssenceChoice = 1 }) },
                { 4, MakeRegion(4, "The Shattered Lands", "Adaptive combat",
                    new[] { "r4_s1","r4_s2","r4_s3","r4_s4","r4_s5","r4_s6","r4_s7","r4_s8","r4_boss" },
                    new RegionReward { Description = "Unlock Forge Level 4 (Set Crafting) + 750 VE", VE = 750 }) },
                { 5, MakeRegion(5, "The Dual Convergence", "Element coverage",
                    new[] { "r5_s1","r5_s2","r5_s3","r5_s4","r5_s5","r5_s6","r5_s7","r5_s8","r5_s9","r5_boss" },
                    new RegionReward { Description = "Unlock Gem Workshop + 1 random Cost-4 unit", RandomUnitMinCost = 4, RandomUnitMaxCost = 4 }) },
                { 6, MakeRegion(6, "The Elemental Crucible", "Multi-element orchestration",
                    new[] { "r6_s1","r6_s2","r6_s3","r6_s4","r6_s5","r6_s6","r6_s7","r6_s8","r6_s9","r6_boss" },
                    new RegionReward { Description = "1,000 VE + 2 essences of choice", VE = 1000, EssenceChoice = 2 }) },
                { 7, MakeRegion(7, "The Proving Grounds", "Peak tactical challenge",
                    new[] { "r7_s1","r7_s2","r7_s3","r7_s4","r7_s5","r7_s6","r7_s7","r7_s8","r7_s9","r7_boss" },
                    new RegionReward { Description = "Unlock Forge Level 5 (Ability Crafting) + Mythic Material", MythicMaterialChoice = 1 }) },
                { 8, MakeRegion(8, "The Abyss Gate", "Endgame mastery",
                    new[] { "r8_s1","r8_s2","r8_s3","r8_s4","r8_s5","r8_s6","r8_s7","r8_boss" },
                    new RegionReward { Description = "Choice of any Cost-5 unit + 2,000 VE + Mythic Material", VE = 2000, RandomUnitMinCost = 5, RandomUnitMaxCost = 5, MythicMaterialChoice = 1 }) }
            };
        }

        // ---- Helper factories ----

        private static StageData MakeStage(string id, int region, string name, int stageNumber,
            StageType type, string description, int requiredLevel, StageLock stageLock,
            bool isBoss, string bossKey, WaveConfig[] waves,
            StageRewards rewards, DropWeights dropWeights,
            EncounterMechanic[] mechanics = null)
        {
            return new StageData
            {
                Id = id,
                Region = region,
                Name = name,
                StageNumber = stageNumber,
                Type = type,
                Description = description,
                RequiredLevel = requiredLevel,
                Lock = stageLock ?? StageLock.None(),
                IsBoss = isBoss,
                CanRetry = true,
                BossKey = bossKey,
                Waves = new List<WaveConfig>(waves),
                Rewards = rewards,
                DropWeights = dropWeights,
                EncounterMechanics = mechanics ?? new[] { EncounterMechanic.None }
            };
        }

        private static RegionData MakeRegion(int num, string name, string subtitle, string[] stageIds, RegionReward reward)
        {
            return new RegionData
            {
                RegionNumber = num,
                Name = name,
                Subtitle = subtitle,
                StageIds = stageIds,
                Reward = reward
            };
        }

        // Wave config shorthand
        private static WaveConfig W(int budget, int maxCost, int count, string elemBias = null, string synBias = null)
            => new WaveConfig { Budget = budget, MaxCost = maxCost, Count = count, ElementBias = elemBias, SynergyBias = synBias };

        // Wave with enemy synergies
        private static WaveConfig WS(int budget, int maxCost, int count, bool enemySynergies, string elemBias = null)
            => new WaveConfig { Budget = budget, MaxCost = maxCost, Count = count, EnemySynergies = enemySynergies, ElementBias = elemBias };

        // Wave with enemy evolutions
        private static WaveConfig WE(int budget, int maxCost, int count)
            => new WaveConfig { Budget = budget, MaxCost = maxCost, Count = count, EnemyEvolutions = true };

        // Wave with both synergies and evolutions
        private static WaveConfig WSE(int budget, int maxCost, int count, string elemBias = null)
            => new WaveConfig { Budget = budget, MaxCost = maxCost, Count = count, EnemySynergies = true, EnemyEvolutions = true, ElementBias = elemBias };

        private static StageRewards R(int ve, int xp, int unitDrops)
            => new StageRewards { VE = ve, XP = xp, UnitDrops = unitDrops };

        private static DropWeights DW(int t1, int t2, int t3, int t4, int t5)
            => new DropWeights { T1 = t1, T2 = t2, T3 = t3, T4 = t4, T5 = t5 };
    }
}

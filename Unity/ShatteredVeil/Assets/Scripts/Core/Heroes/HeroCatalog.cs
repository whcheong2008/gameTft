using System.Collections.Generic;

namespace ShatteredVeil.Core.Heroes
{
    public static class HeroCatalog
    {
        private static readonly Dictionary<HeroId, HeroDefinition> _heroes
            = new Dictionary<HeroId, HeroDefinition>();

        public static int Count => _heroes.Count;
        public static int TotalNodes { get; private set; }

        static HeroCatalog()
        {
            RegisterKael();
            RegisterLyric();
            RegisterRen();
            RegisterSera();
            RegisterMaren();
            RegisterVoss();

            int total = 0;
            foreach (var hero in _heroes.Values)
            {
                foreach (var branch in hero.Branches)
                    total += branch.Nodes.Length;
            }
            TotalNodes = total;
        }

        public static HeroDefinition Get(HeroId id)
        {
            HeroDefinition def;
            return _heroes.TryGetValue(id, out def) ? def : null;
        }

        public static Dictionary<HeroId, HeroDefinition> GetAll()
        {
            return new Dictionary<HeroId, HeroDefinition>(_heroes);
        }

        public static bool Contains(HeroId id)
        {
            return _heroes.ContainsKey(id);
        }

        private static void Add(HeroDefinition def)
        {
            _heroes[def.Id] = def;
        }

        // ====================================================================
        // KAEL — Protection
        // ====================================================================
        private static void RegisterKael()
        {
            var def = new HeroDefinition
            {
                Id = HeroId.Kael,
                Name = "Kael",
                Philosophy = "Protection",
                AcquiredRegion = 1,
                AcquiredStage = 1,
                CanDie = false,
                Branches = new[]
                {
                    new SkillBranch("Guardian's Oath", "Personal protection of others", new[]
                    {
                        // T1
                        new SkillNode(1, 0, "Shield Ally",
                            "When an adjacent ally drops below 30% HP, grant them a shield equal to 8% of your max HP (once per ally per combat)"),
                        new SkillNode(1, 1, "Frontline Defender",
                            "You gain +8% DR when at least 1 ally is behind you"),
                        // T2
                        new SkillNode(2, 0, "Retribution",
                            "When an adjacent ally takes damage, your next attack deals +15% bonus damage"),
                        new SkillNode(2, 1, "Hold the Line",
                            "You gain +12% HP. Adjacent allies gain +6% HP"),
                        // T3
                        new SkillNode(3, 0, "Reactive Shielding",
                            "When an ally is CC'd, they instantly gain a shield equal to 10% of your max HP"),
                        new SkillNode(3, 1, "Protective Stance",
                            "You gain +8% DR. This increases to +15% DR when any adjacent ally is below 50% HP"),
                        // T4
                        new SkillNode(4, 0, "Last Defender",
                            "When you are the last surviving hero-equipped unit, gain +25% ATK and +18% DR for 8s"),
                        new SkillNode(4, 1, "Coordinated Defense",
                            "When you cast an ability, all adjacent allies gain +12% DR for 3s"),
                        // T5
                        new SkillNode(5, 0, "Unbreakable Oath",
                            "Once per combat, when any hero-equipped ally would die, you absorb the killing blow instead. You gain 50% DR for 3s after triggering"),
                    }),
                    new SkillBranch("Commander's Presence", "Team-wide aura based on ally survival", new[]
                    {
                        // T1
                        new SkillNode(1, 0, "Rallying Presence",
                            "All hero-equipped allies gain +4% ATK and +4% HP"),
                        new SkillNode(1, 1, "Strength in Numbers",
                            "All allies gain +2% ATK per surviving hero-equipped unit (max +10% at 5)"),
                        // T2
                        new SkillNode(2, 0, "Unified Defense",
                            "All hero-equipped allies gain +5% CC resistance"),
                        new SkillNode(2, 1, "Shared Resolve",
                            "When any ally dies, surviving hero-equipped allies gain +6% ATK for 8s (stacks)"),
                        // T3
                        new SkillNode(3, 0, "Tactical Positioning",
                            "You gain +12% ATK if in front row, +12% DR if in back row. Adjacent allies gain half this bonus"),
                        new SkillNode(3, 1, "Coordinated Strike",
                            "When you attack a target, nearest hero-equipped ally targeting same enemy gains +8% ATK"),
                        // T4
                        new SkillNode(4, 0, "Stalwart Bond",
                            "All allies within 2 cells gain +6% DR. When you take damage, aura radius expands to 3 cells for 2s"),
                        new SkillNode(4, 1, "Inspiring Leader",
                            "When you cast an ability, all hero-equipped allies gain +8% ATK and +6% ability damage for 4s"),
                        // T5
                        new SkillNode(5, 0, "Supreme Command",
                            "Once per combat, all allies gain +18% ATK, +12% DR, and CC immunity for 4s"),
                    })
                }
            };
            Add(def);
        }

        // ====================================================================
        // LYRIC — Efficiency
        // ====================================================================
        private static void RegisterLyric()
        {
            var def = new HeroDefinition
            {
                Id = HeroId.Lyric,
                Name = "Lyric",
                Philosophy = "Efficiency",
                AcquiredRegion = 1,
                AcquiredStage = 1,
                CanDie = true,
                DeathRegion = 4,
                DeathStage = 3,
                Branches = new[]
                {
                    new SkillBranch("Overcharge", "Power at a cost", new[]
                    {
                        // T1
                        new SkillNode(1, 0, "Power Surge",
                            "You gain +10% ATK but take 2% max HP as self-damage every 5s"),
                        new SkillNode(1, 1, "Mana Overflow",
                            "You start combat with +30 mana"),
                        // T2
                        new SkillNode(2, 0, "Reckless Force",
                            "You gain +18% ability damage. Abilities cost 5% max HP in addition to mana"),
                        new SkillNode(2, 1, "Sacrifice Engine",
                            "When you drop below 50% HP, gain +22% ATK for the rest of combat"),
                        // T3
                        new SkillNode(3, 0, "Critical Mass",
                            "You gain +12% crit chance. Crits deal self-damage equal to 3% max HP"),
                        new SkillNode(3, 1, "Accelerated Casting",
                            "You gain +15% attack speed. Your ability cooldown is 12% shorter"),
                        // T4
                        new SkillNode(4, 0, "Overload",
                            "You gain +20% damage dealt. You also take +15% damage from all sources"),
                        new SkillNode(4, 1, "Endgame Engine",
                            "When you score a kill, instantly restore 25% HP and 40% mana"),
                        // T5
                        new SkillNode(5, 0, "Unleashed Potential",
                            "You gain +28% ATK permanently. On death, explode for 350% ATK to all enemies within 2 cells"),
                    }),
                    new SkillBranch("Calculated Efficiency", "Rewards for fast kills", new[]
                    {
                        // T1
                        new SkillNode(1, 0, "Quick Kill",
                            "On kill, you gain +12% ATK speed for 4s"),
                        new SkillNode(1, 1, "Resource Extraction",
                            "On kill, restore 18% max mana"),
                        // T2
                        new SkillNode(2, 0, "Exploit Weakness",
                            "You deal +15% damage to targets below 40% HP"),
                        new SkillNode(2, 1, "Synergy Amplifier",
                            "You count as +1 toward your primary archetype synergy"),
                        // T3
                        new SkillNode(3, 0, "Chain Efficiency",
                            "On kill, nearest ally gains +10% ATK for 3s"),
                        new SkillNode(3, 1, "Momentum",
                            "On kill, you gain +8% ATK speed for 4s (stacks up to 5 times)"),
                        // T4
                        new SkillNode(4, 0, "Execution Bonus",
                            "Your first 3 kills each combat restore 100% mana and grant +15% ATK for 5s"),
                        new SkillNode(4, 1, "Hunting Bonus",
                            "You gain +1% ATK per kill this combat, stacking infinitely (resets each new combat)"),
                        // T5
                        new SkillNode(5, 0, "Utilitarian's Gift",
                            "All hero-equipped allies gain +10% ATK and +10% ability damage. On your death, these bonuses double for 8s"),
                    })
                }
            };
            Add(def);
        }

        // ====================================================================
        // REN — Steadfast
        // ====================================================================
        private static void RegisterRen()
        {
            var def = new HeroDefinition
            {
                Id = HeroId.Ren,
                Name = "Ren",
                Philosophy = "Steadfast",
                AcquiredRegion = 2,
                AcquiredStage = 1,
                CanDie = false,
                Branches = new[]
                {
                    new SkillBranch("Iron Endurance", "Personal tankiness that scales with time", new[]
                    {
                        // T1
                        new SkillNode(1, 0, "Tough Skin",
                            "You gain +12% HP"),
                        new SkillNode(1, 1, "Rooted Stance",
                            "While you have not moved for 4+ seconds, gain +10% DR"),
                        // T2
                        new SkillNode(2, 0, "Endurance",
                            "You gain +1.2% max HP regen per second"),
                        new SkillNode(2, 1, "Absorption",
                            "After taking 5 hits, gain a shield equal to 14% max HP (refreshes after break + 5 more hits)"),
                        // T3
                        new SkillNode(3, 0, "Stone Patience",
                            "You gain +1% DR per 10 seconds of combat survived (caps at +10% at 100s)"),
                        new SkillNode(3, 1, "Thick Hide",
                            "You gain +8% DR. This increases by +1% for every 10% HP you are missing"),
                        // T4
                        new SkillNode(4, 0, "Unmovable Force",
                            "You gain +15% DR and cannot be slowed below 50% of normal movement speed"),
                        new SkillNode(4, 1, "Last Stand",
                            "When you drop below 20% HP, gain a shield equal to 25% of damage absorbed this combat (max 30% max HP)"),
                        // T5
                        new SkillNode(5, 0, "Immovable",
                            "Once per combat, when you drop below 15% HP, become immune to damage for 3s, heal 25% max HP, then gain +18% DR for rest of combat"),
                    }),
                    new SkillBranch("Silent Anchor", "Nearby allies benefit from Ren's presence", new[]
                    {
                        // T1
                        new SkillNode(1, 0, "Steady Presence",
                            "Adjacent allies gain +6% HP"),
                        new SkillNode(1, 1, "Damage Magnet",
                            "You absorb 10% of damage dealt to adjacent allies"),
                        // T2
                        new SkillNode(2, 0, "Calming Aura",
                            "Adjacent allies gain +6% CC resistance"),
                        new SkillNode(2, 1, "Stubborn Guard",
                            "When an adjacent ally is CC'd, you gain +12% ATK for 5s"),
                        // T3
                        new SkillNode(3, 0, "Loyal Shield",
                            "When your shield breaks, adjacent allies gain a shield equal to 8% of their max HP"),
                        new SkillNode(3, 1, "Protective Presence",
                            "Adjacent allies gain +8% DR. This increases to +12% DR when you are below 40% HP"),
                        // T4
                        new SkillNode(4, 0, "Guardian Pulse",
                            "Every 6s, heal the lowest-HP adjacent ally for 12% of your max HP. Nearby enemies lose 3% ATK for 4s"),
                        new SkillNode(4, 1, "Anchor Chain",
                            "When an adjacent ally takes damage, they gain +8% DR for 4s and you gain +6% lifesteal for 4s"),
                        // T5
                        new SkillNode(5, 0, "Unshakeable Bond",
                            "All allies within 2 cells gain +10% DR. When you take damage, reduce it by 15% and grant nearby allies +5% DR for 3s"),
                    })
                }
            };
            Add(def);
        }

        // ====================================================================
        // SERA — Precision
        // ====================================================================
        private static void RegisterSera()
        {
            var def = new HeroDefinition
            {
                Id = HeroId.Sera,
                Name = "Sera",
                Philosophy = "Precision",
                AcquiredRegion = 3,
                AcquiredStage = 1,
                CanDie = false,
                LeaveRegion = 4,
                LeaveStage = 3,
                ReturnRegion = 5,
                ReturnStage = 8,
                Branches = new[]
                {
                    new SkillBranch("Execution", "Burst damage on priority targets", new[]
                    {
                        // T1
                        new SkillNode(1, 0, "Sharp Focus",
                            "You gain +8% ATK"),
                        new SkillNode(1, 1, "Armor Pierce",
                            "Your attacks ignore 10% of target's DR"),
                        // T2
                        new SkillNode(2, 0, "Finishing Blow",
                            "You deal +18% damage to targets below 35% HP"),
                        new SkillNode(2, 1, "Critical Precision",
                            "You gain +12% crit chance. Crits mark target: +10% damage from all sources for 3s"),
                        // T3
                        new SkillNode(3, 0, "Exploit Opening",
                            "When target is CC'd, your next attack deals +28% damage"),
                        new SkillNode(3, 1, "Weak Point",
                            "You deal +6% damage for every 5% missing HP your target has, up to +30%"),
                        // T4
                        new SkillNode(4, 0, "Burst Window",
                            "Your first 2 ability casts each combat are guaranteed crits and ignore 20% DR"),
                        new SkillNode(4, 1, "Priority Strike",
                            "Attacks against enemies below 50% HP deal +25% damage and apply +8% damage taken debuff for 4s"),
                        // T5
                        new SkillNode(5, 0, "Death Sentence",
                            "First ability each combat is guaranteed crit, ignores 30% DR. Kill refunds 60% mana and grants +15% ATK for 5s"),
                    }),
                    new SkillBranch("Tactical Awareness", "Team benefits from Sera's precision", new[]
                    {
                        // T1
                        new SkillNode(1, 0, "Target Caller",
                            "When you attack a target, nearest ally targeting same enemy gains +10% ATK"),
                        new SkillNode(1, 1, "Mana Efficiency",
                            "Your abilities cost 12% less mana"),
                        // T2
                        new SkillNode(2, 0, "Coordinated Burst",
                            "When you cast ability, nearest hero-equipped ally gains +15% ability damage for next cast"),
                        new SkillNode(2, 1, "Elemental Affinity",
                            "Your element damage multiplier is improved by +0.15"),
                        // T3
                        new SkillNode(3, 0, "Focus Fire",
                            "You mark your target. All hero-equipped allies targeting same marked enemy gain +8% ATK"),
                        new SkillNode(3, 1, "Weakpoint Exposure",
                            "When you crit, nearby allies gain +8% crit chance for 3s"),
                        // T4
                        new SkillNode(4, 0, "Battle Coordination",
                            "All hero-equipped allies within 2 cells gain +6% ATK. When you crit, they gain +10% ATK speed for 2s"),
                        new SkillNode(4, 1, "Killsteal Synergy",
                            "When any hero-equipped ally scores a kill, you gain +8% ATK for 4s and next ability deals +15% damage"),
                        // T5
                        new SkillNode(5, 0, "Perfect Execution",
                            "All hero-equipped allies gain +7% crit. Hero-ally kill grants all other hero-allies +12% ATK speed for 3s"),
                    })
                }
            };
            Add(def);
        }

        // ====================================================================
        // MAREN — Sustain
        // ====================================================================
        private static void RegisterMaren()
        {
            var def = new HeroDefinition
            {
                Id = HeroId.Maren,
                Name = "Maren",
                Philosophy = "Sustain",
                AcquiredRegion = 3,
                AcquiredStage = 1,
                CanDie = false,
                LeaveRegion = 4,
                LeaveStage = 3,
                ReturnRegion = 5,
                ReturnStage = 2,
                Branches = new[]
                {
                    new SkillBranch("Restoration", "Raw healing amplification", new[]
                    {
                        // T1
                        new SkillNode(1, 0, "Healing Touch",
                            "All healing you receive is +14% stronger"),
                        new SkillNode(1, 1, "Recovery Pulse",
                            "You heal adjacent allies for 2.5% of their max HP every 5s"),
                        // T2
                        new SkillNode(2, 0, "Emergency Care",
                            "Heals on targets below 30% HP are +28% stronger"),
                        new SkillNode(2, 1, "Lifesteal Amplifier",
                            "You gain +8% lifesteal. If you already have lifesteal, it's +8% stronger"),
                        // T3
                        new SkillNode(3, 0, "Purify",
                            "When you heal an ally, remove 1 debuff from the target"),
                        new SkillNode(3, 1, "Vital Bond",
                            "When you heal an adjacent ally, they gain +8% DR for 4s. You gain +6% ATK for 4s"),
                        // T4
                        new SkillNode(4, 0, "Shared Vitality",
                            "When you heal, the lowest-HP nearby ally gains 50% of the heal. You heal 30% of damage absorbed by adjacent shields"),
                        new SkillNode(4, 1, "Desperate Measures",
                            "When any ally drops below 25% HP, instantly heal them for 20% of their max HP (4s cooldown per target)"),
                        // T5
                        new SkillNode(5, 0, "Miracle",
                            "Once per combat, when any hero-equipped ally drops below 10% HP, heal them to 45% and grant 3s invulnerability"),
                    }),
                    new SkillBranch("Protective Warmth", "Overheal and shield mechanics", new[]
                    {
                        // T1
                        new SkillNode(1, 0, "Shield Weave",
                            "Your heals also grant a shield equal to 12% of the heal amount (5s)"),
                        new SkillNode(1, 1, "Mana Flow",
                            "You gain +2.5 mana per second"),
                        // T2
                        new SkillNode(2, 0, "Overheal Mastery",
                            "30% of overhealing converts to a permanent shield"),
                        new SkillNode(2, 1, "Kindred Spirit",
                            "When you are healed, the lowest-HP adjacent ally is healed for 35% of the same amount"),
                        // T3
                        new SkillNode(3, 0, "Absorb Pain",
                            "You absorb 14% of damage dealt to the lowest-HP ally within 2 cells"),
                        new SkillNode(3, 1, "Guardian Shell",
                            "When adjacent allies heal, they gain an additional shield equal to 8% of the heal. You gain +8% DR when shields are active on nearby allies"),
                        // T4
                        new SkillNode(4, 0, "Fortified Presence",
                            "Hero-equipped allies within 2 cells gain +8% shields and healing received. Shield break on nearby allies grants you +12% ATK for 3s"),
                        new SkillNode(4, 1, "Emergency Sanctuary",
                            "When you cast an ability, create a protective zone for 4s that reduces incoming damage by 18% and doubles healing in the zone"),
                        // T5
                        new SkillNode(5, 0, "Sanctuary",
                            "Once per combat, create a 2-cell radius zone for 5s: 28% damage reduction to allies, healing tripled in zone"),
                    })
                }
            };
            Add(def);
        }

        // ====================================================================
        // VOSS — Momentum
        // ====================================================================
        private static void RegisterVoss()
        {
            var def = new HeroDefinition
            {
                Id = HeroId.Voss,
                Name = "Voss",
                Philosophy = "Momentum",
                AcquiredRegion = 7,
                AcquiredStage = 1,
                CanDie = false,
                Branches = new[]
                {
                    new SkillBranch("Ramping Power", "Bonuses that grow over time", new[]
                    {
                        // T1
                        new SkillNode(1, 0, "War Cry",
                            "You gain +3.5% ATK every 8s of combat (caps at +28% at ~64s)"),
                        new SkillNode(1, 1, "Battle Rhythm",
                            "You gain +2.2% ATK speed every 10s of combat (caps at +18%)"),
                        // T2
                        new SkillNode(2, 0, "Bloodlust",
                            "You gain +8% lifesteal. Lifesteal increases by +1.2% per 10s of combat"),
                        new SkillNode(2, 1, "Combat Readiness",
                            "You gain +1% DR per 10s of combat (caps at +10%) and +2% mana regen per 10s (caps at +20% mana/s)"),
                        // T3
                        new SkillNode(3, 0, "Berserker Rage",
                            "You gain +1.8% ATK per 10% HP missing (max +18% at low HP)"),
                        new SkillNode(3, 1, "Unstoppable Advance",
                            "You become immune to Slow effects after 25s of combat. Movement speed +3% per 10s of combat"),
                        // T4
                        new SkillNode(4, 0, "Escalation",
                            "Every 15s of combat, permanently gain +8% ATK and +4% damage dealt. Stacks infinitely"),
                        new SkillNode(4, 1, "Veteran's Strength",
                            "After 40s of combat, gain +20% ATK, +15% ATK speed, +5% lifesteal. +5% ATK per 10s additional combat"),
                        // T5
                        new SkillNode(5, 0, "Warlord's Fury",
                            "After 45s of combat, enter Fury: +24% ATK, +24% ATK speed, +12% lifesteal. Kills extend 6s and grant +6% ATK permanently"),
                    }),
                    new SkillBranch("Kill Cascade", "Snowball on kills", new[]
                    {
                        // T1
                        new SkillNode(1, 0, "First Blood",
                            "First kill each combat grants +15% ATK for 6s"),
                        new SkillNode(1, 1, "Momentum",
                            "On kill, gain +10% ATK speed for 4s (stacks up to 5 times)"),
                        // T2
                        new SkillNode(2, 0, "Intimidate",
                            "On kill, nearby enemies within 2 cells lose 6% ATK for 5s"),
                        new SkillNode(2, 1, "War Banner",
                            "On kill, all hero-equipped allies gain +6% ATK for 4s"),
                        // T3
                        new SkillNode(3, 0, "Dominate",
                            "On kill, gain +4% permanent ATK for rest of combat (stacks infinitely)"),
                        new SkillNode(3, 1, "Killing Spree",
                            "Every kill refreshes ability cooldown by 20% and grants +8% movement speed for 4s"),
                        // T4
                        new SkillNode(4, 0, "Execution Cascade",
                            "Every 2nd kill triggers shockwave: 180% ATK to enemies within 2 cells, +12% permanent ATK"),
                        new SkillNode(4, 1, "Conqueror's Aura",
                            "On kill, gain +8% ATK, allies within 2 cells +5% ATK for 5s. 3rd kill refunds 50% mana on next ability"),
                        // T5
                        new SkillNode(5, 0, "Conqueror",
                            "Every 3rd kill triggers shockwave: 200% ATK to enemies within 2 cells, all allies +12% ATK for 4s. Additional kills grant +3% permanent ATK"),
                    })
                }
            };
            Add(def);
        }
    }
}

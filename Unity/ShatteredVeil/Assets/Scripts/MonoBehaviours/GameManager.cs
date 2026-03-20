using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using ShatteredVeil.Core.Economy;
using ShatteredVeil.Core.Gacha;
using ShatteredVeil.Core.Save;
using ShatteredVeil.Core.Teams;
using ShatteredVeil.Core.Units;
using ShatteredVeil.Data;
using ShatteredVeil.Mono.UI;

namespace ShatteredVeil.Mono
{
    /// <summary>
    /// Central game state manager. Persistent singleton (DontDestroyOnLoad).
    /// Holds all game systems, loads/saves via SaveManager, and auto-initializes
    /// scene controllers when scenes load.
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        // --- Game Systems ---
        public BuildingSystem BuildingSystem { get; private set; }
        public GachaSystem GachaSystem { get; private set; }
        public TeamBuilderSystem TeamBuilderSystem { get; private set; }

        // --- Data ---
        public SaveData SaveData { get; private set; }
        public Dictionary<string, IUnitData> UnitCatalog { get; private set; }
        public Dictionary<string, string> EvolutionMap { get; private set; }
        public Dictionary<string, OwnedUnit> Collection { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        /// <summary>
        /// Called by GameBootstrap after SaveManager is ready.
        /// </summary>
        public void InitializeFromSave(SaveData save)
        {
            SaveData = save;

            // 1. Load unit catalog from Resources
            LoadUnitCatalog();

            // 2. Build collection from save roster
            BuildCollectionFromSave();

            // 3. Initialize BuildingSystem
            var buildingLevels = new Dictionary<string, int>();
            if (save.Buildings != null)
            {
                foreach (var b in save.Buildings)
                    buildingLevels[b.BuildingId] = b.Level;
            }
            BuildingSystem = new BuildingSystem(buildingLevels, save.Player.Level, save.Player.VeilEssence);

            // 4. Initialize GachaSystem
            var unitsByTier = BuildUnitsByTier();
            GachaSystem = new GachaSystem(
                new Core.Gacha.GachaConfig(),
                unitsByTier,
                EvolutionMap,
                save.Player.Level,
                save.Player.VeilEssence,
                save.GachaStats.RollsSincePity,
                save.GachaStats.TotalRolls,
                Collection
            );

            // Apply building bonuses to gacha
            ApplyBuildingBonusesToGacha();

            // 5. Initialize TeamBuilderSystem
            var heroAssignments = new Dictionary<string, string>();
            if (save.Heroes != null)
            {
                foreach (var h in save.Heroes)
                {
                    if (!string.IsNullOrEmpty(h.AssignedUnitId))
                        heroAssignments[h.AssignedUnitId] = h.HeroId;
                }
            }
            int maxTeamSize = 8;
            TeamBuilderSystem = new TeamBuilderSystem(UnitCatalog, Collection, EvolutionMap, heroAssignments, maxTeamSize);

            // Load team slots from save
            if (save.Teams != null && save.Teams.Length > save.ActiveTeamIndex)
            {
                var team = save.Teams[save.ActiveTeamIndex];
                if (team.Slots != null)
                {
                    var slots = new List<Core.Teams.TeamSlot>();
                    foreach (var s in team.Slots)
                    {
                        slots.Add(new Core.Teams.TeamSlot { UnitId = s.UnitKey, Col = s.Col, Row = s.Row });
                    }
                    TeamBuilderSystem.LoadSlots(slots);
                }
            }

            // 6. Subscribe to scene loads
            SceneManager.sceneLoaded += OnSceneLoaded;

            // 7. Subscribe to game events for auto-save
            SubscribeToEvents();

            // 8. Set TopBar to real values
            UpdateTopBar();

            Debug.Log($"[GameManager] Initialized: Lv.{save.Player.Level}, {save.Player.VeilEssence} VE, " +
                      $"{UnitCatalog.Count} units in catalog, {Collection.Count} owned units");
        }

        private void OnDestroy()
        {
            SceneManager.sceneLoaded -= OnSceneLoaded;
            UnsubscribeFromEvents();
        }

        // ===== UNIT CATALOG =====

        private void LoadUnitCatalog()
        {
            UnitCatalog = new Dictionary<string, IUnitData>();
            EvolutionMap = new Dictionary<string, string>();

            var templates = Resources.LoadAll<UnitTemplate>("Units");
            Debug.Log($"[GameManager] Loaded {templates.Length} UnitTemplate assets from Resources/Units/");

            foreach (var t in templates)
            {
                if (string.IsNullOrEmpty(t.unitId)) continue;

                var data = new UnitData
                {
                    UnitId = t.unitId,
                    Name = t.displayName,
                    Tier = t.tier,
                    Element = t.element,
                    Archetype = t.archetype,
                    BaseHP = t.baseHP,
                    BaseATK = t.baseATK,
                    BaseDEF = 0,
                    BaseAtkSpeed = t.attackSpeed,
                    BaseSPD = 0,
                    BaseMana = t.maxMana,
                    BaseCritRate = 0.05f,
                    BaseCritDmg = 1.5f,
                    IsEvolved = t.isEvolved
                };
                UnitCatalog[t.unitId] = data;

                // Build evolution map
                if (!string.IsNullOrEmpty(t.evolvedFormId) && !t.isEvolved)
                {
                    EvolutionMap[t.unitId] = t.evolvedFormId;
                }
            }

            Debug.Log($"[GameManager] Unit catalog: {UnitCatalog.Count} units, {EvolutionMap.Count} evolution pairs");
        }

        private void BuildCollectionFromSave()
        {
            Collection = new Dictionary<string, OwnedUnit>();
            if (SaveData.Roster?.Units == null) return;

            foreach (var entry in SaveData.Roster.Units)
            {
                Collection[entry.TemplateKey] = new OwnedUnit
                {
                    UnitId = entry.TemplateKey,
                    Stars = entry.Stars,
                    Copies = entry.Count
                };
            }
        }

        private Dictionary<int, List<string>> BuildUnitsByTier()
        {
            var byTier = new Dictionary<int, List<string>>();
            for (int i = 1; i <= 5; i++)
                byTier[i] = new List<string>();

            foreach (var kvp in UnitCatalog)
            {
                var data = kvp.Value;
                if (data.IsEvolved) continue; // Only base units in gacha pool
                if (byTier.ContainsKey(data.Tier))
                    byTier[data.Tier].Add(data.UnitId);
            }

            return byTier;
        }

        // ===== SCENE INITIALIZATION =====

        private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
        {
            Debug.Log($"[GameManager] Scene loaded: {scene.name}");

            switch (scene.name)
            {
                case "Hub":
                    InitializeHub(scene);
                    break;
                case "Gacha":
                    InitializeGacha(scene);
                    break;
                case "Roster":
                    InitializeRoster(scene);
                    break;
                case "TeamBuilder":
                    InitializeTeamBuilder(scene);
                    break;
                case "MissionSelect":
                    // MissionSceneController works standalone
                    break;
                case "Combat":
                    // Placeholder — combat is not wired yet
                    break;
            }

            UpdateTopBar();
        }

        private void InitializeHub(Scene scene)
        {
            foreach (var go in scene.GetRootGameObjects())
            {
                var ctrl = go.GetComponentInChildren<HubSceneController>();
                if (ctrl != null)
                {
                    // Sync VE from gacha system back to building system
                    BuildingSystem.SetVeilEssence(SaveData.Player.VeilEssence);
                    BuildingSystem.SetPlayerLevel(SaveData.Player.Level);
                    ctrl.Initialize(BuildingSystem);
                    Debug.Log("[GameManager] HubSceneController initialized");
                    return;
                }
            }
        }

        private void InitializeGacha(Scene scene)
        {
            foreach (var go in scene.GetRootGameObjects())
            {
                var ctrl = go.GetComponentInChildren<GachaSceneController>();
                if (ctrl != null)
                {
                    // Sync VE
                    GachaSystem.SetVeilEssence(SaveData.Player.VeilEssence);
                    ctrl.Initialize(GachaSystem, UnitCatalog);
                    Debug.Log("[GameManager] GachaSceneController initialized");
                    return;
                }
            }
        }

        private void InitializeRoster(Scene scene)
        {
            foreach (var go in scene.GetRootGameObjects())
            {
                var ctrl = go.GetComponentInChildren<RosterSceneController>();
                if (ctrl != null)
                {
                    bool canEvolve = BuildingSystem.GetLevel("deep_resonance") >= 1;
                    double evoCostMult = BuildingSystem.GetEvolutionCostMultiplier();
                    ctrl.Initialize(GachaSystem, UnitCatalog, EvolutionMap, canEvolve, evoCostMult);
                    Debug.Log("[GameManager] RosterSceneController initialized");
                    return;
                }
            }
        }

        private void InitializeTeamBuilder(Scene scene)
        {
            foreach (var go in scene.GetRootGameObjects())
            {
                var ctrl = go.GetComponentInChildren<TeamBuilderSceneController>();
                if (ctrl != null)
                {
                    var availableHeroes = new Dictionary<string, string>();
                    if (SaveData.Heroes != null)
                    {
                        foreach (var h in SaveData.Heroes)
                        {
                            if (!h.IsAbsent && !h.IsDead)
                                availableHeroes[h.HeroId] = h.HeroId;
                        }
                    }
                    ctrl.Initialize(TeamBuilderSystem, UnitCatalog, Collection, availableHeroes);
                    Debug.Log("[GameManager] TeamBuilderSceneController initialized");
                    return;
                }
            }
        }

        // ===== TOP BAR =====

        private void UpdateTopBar()
        {
            var topBar = FindAnyObjectByType<TopBarController>();
            if (topBar == null) return;

            topBar.SetLevel(SaveData.Player.Level);
            topBar.SetCurrency(SaveData.Player.VeilEssence);

            int xpToNext = GetXPForNextLevel(SaveData.Player.Level);
            topBar.SetXP(SaveData.Player.XP, xpToNext);
        }

        private static int GetXPForNextLevel(int currentLevel)
        {
            // Simple XP curve: 100 * level * (level + 1) / 2
            return 100 * currentLevel;
        }

        // ===== EVENT HANDLING =====

        private void SubscribeToEvents()
        {
            GameEventBus.OnGoldChanged += HandleVEChanged;
            GameEventBus.OnLevelUp += HandleLevelUp;
            GameEventBus.OnXPChanged += HandleXPChanged;
            GameEventBus.OnBuildingUpgraded += HandleBuildingUpgraded;
            GameEventBus.OnUnitRolled += HandleUnitRolled;
            GameEventBus.OnUnitStarredUp += HandleUnitStarredUp;
            GameEventBus.OnTeamChanged += HandleTeamChanged;
        }

        private void UnsubscribeFromEvents()
        {
            GameEventBus.OnGoldChanged -= HandleVEChanged;
            GameEventBus.OnLevelUp -= HandleLevelUp;
            GameEventBus.OnXPChanged -= HandleXPChanged;
            GameEventBus.OnBuildingUpgraded -= HandleBuildingUpgraded;
            GameEventBus.OnUnitRolled -= HandleUnitRolled;
            GameEventBus.OnUnitStarredUp -= HandleUnitStarredUp;
            GameEventBus.OnTeamChanged -= HandleTeamChanged;
        }

        private void HandleVEChanged(int newVE)
        {
            SaveData.Player.VeilEssence = newVE;
            BuildingSystem.SetVeilEssence(newVE);
            // GachaSystem VE is updated internally by its own methods
            AutoSave();
        }

        private void HandleLevelUp(int newLevel)
        {
            SaveData.Player.Level = newLevel;
            BuildingSystem.SetPlayerLevel(newLevel);
            AutoSave();
        }

        private void HandleXPChanged(int newXP, int xpToNext)
        {
            SaveData.Player.XP = newXP;
            AutoSave();
        }

        private void HandleBuildingUpgraded(string buildingId, int newLevel)
        {
            // Update save data
            if (SaveData.Buildings != null)
            {
                foreach (var b in SaveData.Buildings)
                {
                    if (b.BuildingId == buildingId)
                    {
                        b.Level = newLevel;
                        break;
                    }
                }
            }

            // Sync VE from BuildingSystem back to save
            SaveData.Player.VeilEssence = BuildingSystem.GetVeilEssence();

            // Re-apply building bonuses to gacha
            ApplyBuildingBonusesToGacha();

            AutoSave();
        }

        private void HandleUnitRolled(string unitId)
        {
            SyncCollectionToSave();
            SyncGachaStatsToSave();
            AutoSave();
        }

        private void HandleUnitStarredUp(string unitId, int newStars)
        {
            SyncCollectionToSave();
            AutoSave();
        }

        private void HandleTeamChanged()
        {
            SyncTeamToSave();
            AutoSave();
        }

        // ===== SAVE SYNC =====

        private void SyncCollectionToSave()
        {
            var entries = new List<RosterEntry>();
            foreach (var kvp in Collection)
            {
                entries.Add(new RosterEntry
                {
                    TemplateKey = kvp.Key,
                    Count = kvp.Value.Copies,
                    Stars = kvp.Value.Stars,
                    CopiesForNext = 0
                });
            }
            SaveData.Roster = new RosterData { Units = entries.ToArray() };
        }

        private void SyncGachaStatsToSave()
        {
            SaveData.GachaStats.TotalRolls = GachaSystem.TotalRolls;
            SaveData.GachaStats.RollsSincePity = GachaSystem.RollsSincePity;
            SaveData.Player.VeilEssence = GachaSystem.VeilEssence;
        }

        private void SyncTeamToSave()
        {
            if (TeamBuilderSystem == null) return;
            var slots = TeamBuilderSystem.Slots;
            var teamSlots = new Core.Save.TeamSlot[slots.Count];
            for (int i = 0; i < slots.Count; i++)
            {
                teamSlots[i] = new Core.Save.TeamSlot
                {
                    UnitKey = slots[i].UnitId,
                    Col = slots[i].Col,
                    Row = slots[i].Row
                };
            }

            int idx = SaveData.ActiveTeamIndex;
            if (SaveData.Teams != null && idx < SaveData.Teams.Length)
            {
                SaveData.Teams[idx].Slots = teamSlots;
            }
        }

        private void ApplyBuildingBonusesToGacha()
        {
            int attunementLevel = BuildingSystem.GetLevel("attunement_rite");
            if (attunementLevel > 0)
            {
                int discount = BuildingSystem.GetMultiRollDiscount();
                GachaSystem.SetMultiRollDiscount(discount);

                // Pity improvements from attunement
                int pityThreshold = attunementLevel >= 3 ? 30 : (attunementLevel >= 1 ? 40 : 50);
                int pityMinTier = attunementLevel >= 5 ? 3 : (attunementLevel >= 2 ? 4 : 5);
                GachaSystem.SetPityOverride(pityThreshold, pityMinTier);
            }
        }

        private void AutoSave()
        {
            if (SaveManager.Instance != null)
            {
                SaveManager.Instance.AutoSave();
            }
        }
    }
}

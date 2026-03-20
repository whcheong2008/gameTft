using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;
using ShatteredVeil.Core.Gacha;
using ShatteredVeil.Core.Units;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Roster screen UI controller. Shows owned units grid, detail panel, star-up, sell, evolve.
    /// Mirrors js/ui-v2.js: renderRosterScreen, showUnitDetail, showSellPanel.
    /// </summary>
    public class RosterSceneController : MonoBehaviour
    {
        private GachaSystem gachaSystem;
        private Dictionary<string, IUnitData> unitCatalog;
        private Dictionary<string, string> evolutionMap; // base -> evolved
        private bool canEvolveBuildingUnlocked;
        private double evolutionCostMultiplier = 1.0;

        private Canvas canvas;
        private Text titleText;
        private Text statsText;
        private RectTransform gridContainer;
        private ScrollRect gridScroll;

        // Detail overlay
        private GameObject detailOverlay;

        // Sell overlay
        private GameObject sellOverlay;

        // Filter state
        private string filterElement = "all";
        private string sortMode = "tier";

        private static readonly Color GoldColor = new Color(0.886f, 0.718f, 0.078f);
        private static readonly Color DarkBg = new Color(0.06f, 0.06f, 0.1f);
        private static readonly Color PanelBg = new Color(0.08f, 0.08f, 0.14f);

        public void Initialize(GachaSystem system, Dictionary<string, IUnitData> catalog,
            Dictionary<string, string> evoMap, bool canEvolve = false, double evoCostMult = 1.0)
        {
            gachaSystem = system;
            unitCatalog = catalog ?? new Dictionary<string, IUnitData>();
            evolutionMap = evoMap ?? new Dictionary<string, string>();
            canEvolveBuildingUnlocked = canEvolve;
            evolutionCostMultiplier = evoCostMult;
            BuildUI();
            RefreshGrid();
        }

        private void BuildUI()
        {
            var canvasGO = new GameObject("RosterCanvas");
            canvasGO.transform.SetParent(transform);
            canvas = canvasGO.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 100;
            canvasGO.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            canvasGO.GetComponent<CanvasScaler>().referenceResolution = new Vector2(1080, 1920);
            canvasGO.AddComponent<GraphicRaycaster>();

            var root = CreatePanel(canvasGO.transform, "Root", DarkBg);
            root.anchorMin = Vector2.zero;
            root.anchorMax = Vector2.one;
            root.offsetMin = Vector2.zero;
            root.offsetMax = Vector2.zero;

            // Title
            titleText = CreateText(root, "Roster", 28, GoldColor);
            SetAnchors(titleText.rectTransform, 0, 0.93f, 1, 0.98f);

            // Stats
            statsText = CreateText(root, "", 14, new Color(0.7f, 0.7f, 0.8f));
            SetAnchors(statsText.rectTransform, 0.05f, 0.89f, 0.95f, 0.93f);

            // Filter buttons
            var filterPanel = CreatePanel(root, "Filters", Color.clear);
            SetAnchors(filterPanel, 0.02f, 0.84f, 0.98f, 0.89f);
            BuildFilterButtons(filterPanel);

            // Grid scroll
            var scrollGO = new GameObject("GridScroll");
            scrollGO.transform.SetParent(root, false);
            var scrollRect = scrollGO.AddComponent<RectTransform>();
            SetAnchors(scrollRect, 0.02f, 0.05f, 0.98f, 0.84f);
            gridScroll = scrollGO.AddComponent<ScrollRect>();
            scrollGO.AddComponent<Image>().color = PanelBg;

            var contentGO = new GameObject("Content");
            contentGO.transform.SetParent(scrollGO.transform, false);
            gridContainer = contentGO.AddComponent<RectTransform>();
            gridContainer.anchorMin = new Vector2(0, 1);
            gridContainer.anchorMax = new Vector2(1, 1);
            gridContainer.pivot = new Vector2(0.5f, 1);
            gridContainer.sizeDelta = new Vector2(0, 0);
            var layout = contentGO.AddComponent<GridLayoutGroup>();
            layout.cellSize = new Vector2(160, 220);
            layout.spacing = new Vector2(8, 8);
            layout.padding = new RectOffset(8, 8, 8, 8);
            layout.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
            layout.constraintCount = 5;
            var fitter = contentGO.AddComponent<ContentSizeFitter>();
            fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;

            gridScroll.content = gridContainer;
            gridScroll.horizontal = false;
            gridScroll.vertical = true;

            scrollGO.AddComponent<Mask>().showMaskGraphic = true;
        }

        private void BuildFilterButtons(RectTransform parent)
        {
            var hlg = parent.gameObject.AddComponent<HorizontalLayoutGroup>();
            hlg.spacing = 4;
            hlg.childAlignment = TextAnchor.MiddleLeft;
            hlg.childForceExpandWidth = false;
            hlg.childForceExpandHeight = true;

            string[] elements = { "all", "Fire", "Water", "Earth", "Wind", "Lightning", "Force" };
            foreach (var elem in elements)
            {
                var btnGO = new GameObject("Filter_" + elem);
                btnGO.transform.SetParent(parent, false);
                var img = btnGO.AddComponent<Image>();
                img.color = new Color(0.16f, 0.22f, 0.38f);
                var btn = btnGO.AddComponent<Button>();
                var le = btnGO.AddComponent<LayoutElement>();
                le.preferredWidth = elem == "all" ? 50 : 40;
                le.preferredHeight = 30;

                var txtGO = new GameObject("Text");
                txtGO.transform.SetParent(btnGO.transform, false);
                var txtRT = txtGO.AddComponent<RectTransform>();
                txtRT.anchorMin = Vector2.zero;
                txtRT.anchorMax = Vector2.one;
                txtRT.offsetMin = Vector2.zero;
                txtRT.offsetMax = Vector2.zero;
                var txt = txtGO.AddComponent<Text>();
                txt.text = elem == "all" ? "All" : PlaceholderFactory.GetElementAbbrev(elem);
                txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                txt.fontSize = 12;
                txt.color = elem == "all" ? Color.white : PlaceholderFactory.GetElementColor(elem);
                txt.alignment = TextAnchor.MiddleCenter;

                string captured = elem;
                btn.onClick.AddListener(() => { filterElement = captured; RefreshGrid(); });
            }
        }

        public void RefreshGrid()
        {
            if (gachaSystem == null) return;

            // Clear grid
            for (int i = gridContainer.childCount - 1; i >= 0; i--)
                Destroy(gridContainer.GetChild(i).gameObject);

            var collection = gachaSystem.GetCollection();
            int baseCount = 0;
            int evolvedCount = 0;

            // Build sorted list
            var units = new List<RosterEntry>();
            foreach (var kvp in collection)
            {
                var owned = kvp.Value;
                var unitData = unitCatalog.TryGetValue(kvp.Key, out var d) ? d : null;
                if (unitData == null) continue;

                if (filterElement != "all" && unitData.Element != filterElement) continue;

                bool isEvolved = evolutionMap.ContainsValue(kvp.Key);
                if (isEvolved) evolvedCount++; else baseCount++;

                int copiesNeeded = EvolutionSystem.GetCopiesNeeded(unitData.Tier);
                int spareCopies = EvolutionSystem.GetSpareCopies(owned.Copies);
                bool canStarUp = EvolutionSystem.CanStarUp(unitData.Tier, owned.Stars, owned.Copies);

                units.Add(new RosterEntry
                {
                    UnitId = kvp.Key,
                    Data = unitData,
                    Owned = owned,
                    IsEvolved = isEvolved,
                    CopiesNeeded = copiesNeeded,
                    SpareCopies = spareCopies,
                    CanStarUp = canStarUp
                });
            }

            // Sort
            if (sortMode == "tier")
                units.Sort((a, b) => b.Data.Tier.CompareTo(a.Data.Tier));
            else if (sortMode == "name")
                units.Sort((a, b) => string.Compare(a.Data.Name, b.Data.Name));
            else if (sortMode == "element")
                units.Sort((a, b) => string.Compare(a.Data.Element, b.Data.Element));

            // Update stats
            int totalInCatalog = unitCatalog.Count(u => !evolutionMap.ContainsValue(u.Key));
            statsText.text = $"Collected: {baseCount}/{totalInCatalog} units" +
                (evolvedCount > 0 ? $" | {evolvedCount} evolved" : "");

            // Create cards
            foreach (var entry in units)
            {
                CreateRosterCard(entry);
            }
        }

        private void CreateRosterCard(RosterEntry entry)
        {
            var cardGO = new GameObject("Card_" + entry.UnitId);
            cardGO.transform.SetParent(gridContainer, false);

            var cardBg = cardGO.AddComponent<Image>();
            cardBg.color = GetTierColor(entry.Data.Tier);

            if (entry.IsEvolved)
            {
                // Gold border for evolved
                var outline = cardGO.AddComponent<Outline>();
                outline.effectColor = GoldColor;
                outline.effectDistance = new Vector2(2, 2);
            }

            var layout = cardGO.AddComponent<VerticalLayoutGroup>();
            layout.padding = new RectOffset(4, 4, 4, 4);
            layout.spacing = 2;
            layout.childAlignment = TextAnchor.MiddleCenter;
            layout.childForceExpandWidth = true;
            layout.childForceExpandHeight = false;

            // Evolved badge
            if (entry.IsEvolved)
                AddLabel(cardGO.transform, "EVO", 10, GoldColor);

            // Stars
            string starsStr = new string('*', entry.Owned.Stars);
            AddLabel(cardGO.transform, starsStr, 14, GoldColor);

            // Element + archetype
            var elemColor = PlaceholderFactory.GetElementColor(entry.Data.Element);
            AddLabel(cardGO.transform, PlaceholderFactory.GetElementAbbrev(entry.Data.Element), 14, elemColor);

            // Name
            AddLabel(cardGO.transform, entry.Data.Name, 12, Color.white);

            // Tier info
            AddLabel(cardGO.transform, $"T{entry.Data.Tier}", 10, new Color(0.7f, 0.7f, 0.8f));

            // Stats
            double mult = UnitStatCalculator.GetStarMultiplier(entry.Owned.Stars);
            int hp = (int)(entry.Data.BaseHP * mult);
            int atk = (int)(entry.Data.BaseATK * mult);
            AddLabel(cardGO.transform, $"HP:{hp} ATK:{atk}", 9, new Color(0.8f, 0.8f, 0.8f));

            // Copies
            AddLabel(cardGO.transform, $"{entry.SpareCopies}/{entry.CopiesNeeded} copies", 10, new Color(0.6f, 0.6f, 0.7f));

            // Star-up button
            if (entry.CanStarUp)
            {
                var starUpGO = CreateSmallButton(cardGO.transform, "Star Up!", new Color(0.2f, 0.4f, 0.2f), GoldColor);
                string uid = entry.UnitId;
                starUpGO.GetComponent<Button>().onClick.AddListener(() => DoStarUp(uid));
            }

            // Sell button
            if (entry.SpareCopies > 0)
            {
                var sellGO = CreateSmallButton(cardGO.transform, $"Sell ({entry.SpareCopies})", new Color(0.4f, 0.2f, 0.2f), Color.white);
                string uid = entry.UnitId;
                sellGO.GetComponent<Button>().onClick.AddListener(() => ShowSellPanel(uid));
            }

            // Card click -> detail
            var clickBtn = cardGO.AddComponent<Button>();
            clickBtn.onClick.AddListener(() => ShowUnitDetail(entry.UnitId));
        }

        // --- Star-Up ---

        private void DoStarUp(string unitId)
        {
            var owned = gachaSystem.GetOwnedUnit(unitId);
            if (owned == null) return;

            var unitData = unitCatalog.TryGetValue(unitId, out var d) ? d : null;
            if (unitData == null) return;

            int stars = owned.Stars;
            int copies = owned.Copies;
            if (EvolutionSystem.TryStarUp(unitData.Tier, ref stars, ref copies))
            {
                owned.Stars = stars;
                owned.Copies = copies;
                GameEventBus.FireUnitStarredUp(unitId, stars);
                GameEventBus.FireToast($"{unitData.Name} starred up to {stars}!");
                RefreshGrid();
            }
        }

        // --- Sell Panel ---

        private void ShowSellPanel(string unitId)
        {
            var owned = gachaSystem.GetOwnedUnit(unitId);
            if (owned == null) return;

            var unitData = unitCatalog.TryGetValue(unitId, out var d) ? d : null;
            if (unitData == null) return;

            int maxSellable = EvolutionSystem.GetSpareCopies(owned.Copies);
            if (maxSellable <= 0) return;

            // Remove previous overlay
            if (sellOverlay != null) Destroy(sellOverlay);

            sellOverlay = new GameObject("SellOverlay");
            sellOverlay.transform.SetParent(canvas.transform, false);
            var overlayRT = sellOverlay.AddComponent<RectTransform>();
            overlayRT.anchorMin = Vector2.zero;
            overlayRT.anchorMax = Vector2.one;
            overlayRT.offsetMin = Vector2.zero;
            overlayRT.offsetMax = Vector2.zero;

            // Dark backdrop
            var bg = sellOverlay.AddComponent<Image>();
            bg.color = new Color(0, 0, 0, 0.7f);

            // Panel
            var panelGO = new GameObject("Panel");
            panelGO.transform.SetParent(sellOverlay.transform, false);
            var panelRT = panelGO.AddComponent<RectTransform>();
            panelRT.anchorMin = new Vector2(0.15f, 0.3f);
            panelRT.anchorMax = new Vector2(0.85f, 0.7f);
            panelRT.offsetMin = Vector2.zero;
            panelRT.offsetMax = Vector2.zero;
            panelGO.AddComponent<Image>().color = new Color(0.1f, 0.1f, 0.18f);

            var vLayout = panelGO.AddComponent<VerticalLayoutGroup>();
            vLayout.padding = new RectOffset(16, 16, 16, 16);
            vLayout.spacing = 8;
            vLayout.childAlignment = TextAnchor.MiddleCenter;
            vLayout.childForceExpandWidth = true;
            vLayout.childForceExpandHeight = false;

            AddLabel(panelGO.transform, $"Sell {unitData.Name} Copies", 18, GoldColor);
            AddLabel(panelGO.transform, $"Available: {maxSellable} copies", 14, Color.white);

            int sellCount = 1;
            var previewText = AddLabel(panelGO.transform, "", 14, Color.white);

            void UpdatePreview()
            {
                int veValue = EvolutionSystem.GetSellTotal(unitData.Tier, sellCount);
                previewText.text = $"Selling {sellCount} -> {veValue} VE";
            }
            UpdatePreview();

            // Amount buttons
            var amtPanel = new GameObject("AmtBtns");
            amtPanel.transform.SetParent(panelGO.transform, false);
            amtPanel.AddComponent<RectTransform>();
            var hlg = amtPanel.AddComponent<HorizontalLayoutGroup>();
            hlg.spacing = 8;
            hlg.childAlignment = TextAnchor.MiddleCenter;
            hlg.childForceExpandWidth = false;
            hlg.childForceExpandHeight = true;

            int[] amounts = { 1, 5, maxSellable };
            foreach (int amt in amounts)
            {
                if (amt <= 0 || amt > maxSellable) continue;
                string label = amt == maxSellable ? $"All ({amt})" : amt.ToString();
                var btnGO = CreateSmallButton(amtPanel.transform, label, new Color(0.16f, 0.22f, 0.38f), Color.white);
                int capturedAmt = amt;
                btnGO.GetComponent<Button>().onClick.AddListener(() => { sellCount = capturedAmt; UpdatePreview(); });
            }

            // Confirm + Cancel
            var actionPanel = new GameObject("Actions");
            actionPanel.transform.SetParent(panelGO.transform, false);
            actionPanel.AddComponent<RectTransform>();
            var aHlg = actionPanel.AddComponent<HorizontalLayoutGroup>();
            aHlg.spacing = 12;
            aHlg.childAlignment = TextAnchor.MiddleCenter;
            aHlg.childForceExpandWidth = false;
            aHlg.childForceExpandHeight = true;

            var confirmGO = CreateSmallButton(actionPanel.transform, "Confirm Sell", new Color(0.2f, 0.5f, 0.2f), Color.white);
            confirmGO.GetComponent<Button>().onClick.AddListener(() =>
            {
                int copies = owned.Copies;
                int earned = EvolutionSystem.SellCopies(unitData.Tier, sellCount, ref copies);
                if (earned >= 0)
                {
                    owned.Copies = copies;
                    gachaSystem.SetVeilEssence(gachaSystem.VeilEssence + earned);
                    GameEventBus.FireGoldChanged(gachaSystem.VeilEssence);
                    GameEventBus.FireToast($"Sold {sellCount} copies for {earned} VE");
                    Destroy(sellOverlay);
                    RefreshGrid();
                }
            });

            var cancelGO = CreateSmallButton(actionPanel.transform, "Cancel", new Color(0.4f, 0.2f, 0.2f), Color.white);
            cancelGO.GetComponent<Button>().onClick.AddListener(() => Destroy(sellOverlay));
        }

        // --- Unit Detail ---

        private void ShowUnitDetail(string unitId)
        {
            var owned = gachaSystem.GetOwnedUnit(unitId);
            if (owned == null) return;

            var unitData = unitCatalog.TryGetValue(unitId, out var d) ? d : null;
            if (unitData == null) return;

            if (detailOverlay != null) Destroy(detailOverlay);

            detailOverlay = new GameObject("DetailOverlay");
            detailOverlay.transform.SetParent(canvas.transform, false);
            var overlayRT = detailOverlay.AddComponent<RectTransform>();
            overlayRT.anchorMin = Vector2.zero;
            overlayRT.anchorMax = Vector2.one;
            overlayRT.offsetMin = Vector2.zero;
            overlayRT.offsetMax = Vector2.zero;

            var bg = detailOverlay.AddComponent<Image>();
            bg.color = new Color(0, 0, 0, 0.7f);

            var panelGO = new GameObject("Panel");
            panelGO.transform.SetParent(detailOverlay.transform, false);
            var panelRT = panelGO.AddComponent<RectTransform>();
            panelRT.anchorMin = new Vector2(0.1f, 0.15f);
            panelRT.anchorMax = new Vector2(0.9f, 0.85f);
            panelRT.offsetMin = Vector2.zero;
            panelRT.offsetMax = Vector2.zero;
            panelGO.AddComponent<Image>().color = new Color(0.1f, 0.1f, 0.18f);

            var vLayout = panelGO.AddComponent<VerticalLayoutGroup>();
            vLayout.padding = new RectOffset(20, 20, 20, 20);
            vLayout.spacing = 8;
            vLayout.childAlignment = TextAnchor.MiddleCenter;
            vLayout.childForceExpandWidth = true;
            vLayout.childForceExpandHeight = false;

            bool isEvolved = evolutionMap.ContainsValue(unitId);

            // Header
            if (isEvolved)
                AddLabel(panelGO.transform, "EVOLVED", 12, GoldColor);

            AddLabel(panelGO.transform, unitData.Name, 24, Color.white);

            // Element + archetype
            var elemColor = PlaceholderFactory.GetElementColor(unitData.Element);
            AddLabel(panelGO.transform, $"{unitData.Element} | {unitData.Archetype}", 14, elemColor);

            // Stars
            string stars = new string('*', owned.Stars);
            AddLabel(panelGO.transform, stars, 20, GoldColor);

            // Stats
            double mult = UnitStatCalculator.GetStarMultiplier(owned.Stars);
            int hp = (int)(unitData.BaseHP * mult);
            int atk = (int)(unitData.BaseATK * mult);
            int def = (int)(unitData.BaseDEF * mult);
            int spd = (int)(unitData.BaseSPD * mult);
            AddLabel(panelGO.transform, $"HP: {hp}  |  ATK: {atk}", 16, Color.white);
            AddLabel(panelGO.transform, $"DEF: {def}  |  SPD: {spd}", 14, new Color(0.8f, 0.8f, 0.8f));
            AddLabel(panelGO.transform, $"Crit: {unitData.BaseCritRate:P0}  |  AtkSpd: {unitData.BaseAtkSpeed:F2}s", 12, new Color(0.7f, 0.7f, 0.8f));

            // Copies info
            int copiesNeeded = EvolutionSystem.GetCopiesNeeded(unitData.Tier);
            int spareCopies = EvolutionSystem.GetSpareCopies(owned.Copies);
            AddLabel(panelGO.transform, $"Copies: {spareCopies}/{copiesNeeded} for next star", 12, new Color(0.6f, 0.6f, 0.7f));

            // Star-up button
            if (EvolutionSystem.CanStarUp(unitData.Tier, owned.Stars, owned.Copies))
            {
                var starUpGO = CreateSmallButton(panelGO.transform, $"Star Up to {owned.Stars + 1}", new Color(0.2f, 0.4f, 0.2f), GoldColor);
                starUpGO.GetComponent<Button>().onClick.AddListener(() =>
                {
                    DoStarUp(unitId);
                    Destroy(detailOverlay);
                    ShowUnitDetail(unitId);
                });
            }

            // Evolution button
            string baseId = null;
            foreach (var kvp in evolutionMap)
            {
                if (kvp.Key == unitId) { baseId = unitId; break; }
            }
            if (baseId != null && !isEvolved)
            {
                string evolvedId = evolutionMap[baseId];
                bool hasEvolution = evolvedId != null;
                int evoCost = EvolutionSystem.GetEvolutionCost(unitData.Tier, evolutionCostMultiplier);
                bool canEvo = EvolutionSystem.CanEvolve(unitData.Tier, owned.Stars, 5, hasEvolution, canEvolveBuildingUnlocked)
                    && gachaSystem.VeilEssence >= evoCost;

                if (canEvo && evoCost > 0)
                {
                    var evoGO = CreateSmallButton(panelGO.transform, $"Evolve ({evoCost} VE)", new Color(0.4f, 0.3f, 0.1f), GoldColor);
                    evoGO.GetComponent<Button>().onClick.AddListener(() =>
                    {
                        gachaSystem.SetVeilEssence(gachaSystem.VeilEssence - evoCost);
                        // Add evolved unit to collection
                        var evoOwned = gachaSystem.GetOwnedUnit(evolvedId);
                        if (evoOwned == null)
                        {
                            gachaSystem.GetCollection()[evolvedId] = new OwnedUnit { UnitId = evolvedId, Stars = 1, Copies = 1 };
                        }
                        GameEventBus.FireGoldChanged(gachaSystem.VeilEssence);
                        GameEventBus.FireToast($"{unitData.Name} evolved!");
                        Destroy(detailOverlay);
                        RefreshGrid();
                    });
                }
                else if (hasEvolution && !canEvolveBuildingUnlocked)
                {
                    AddLabel(panelGO.transform, "Deep Resonance required to evolve", 10, new Color(0.5f, 0.3f, 0.3f));
                }
            }

            // Close button
            var closeGO = CreateSmallButton(panelGO.transform, "Close", new Color(0.3f, 0.15f, 0.15f), Color.white);
            closeGO.GetComponent<Button>().onClick.AddListener(() => Destroy(detailOverlay));
        }

        // --- Helpers ---

        private struct RosterEntry
        {
            public string UnitId;
            public IUnitData Data;
            public OwnedUnit Owned;
            public bool IsEvolved;
            public int CopiesNeeded;
            public int SpareCopies;
            public bool CanStarUp;
        }

        private Color GetTierColor(int tier)
        {
            switch (tier)
            {
                case 1: return new Color(0.2f, 0.2f, 0.25f);
                case 2: return new Color(0.15f, 0.25f, 0.15f);
                case 3: return new Color(0.15f, 0.2f, 0.35f);
                case 4: return new Color(0.3f, 0.15f, 0.3f);
                case 5: return new Color(0.35f, 0.3f, 0.1f);
                default: return new Color(0.15f, 0.15f, 0.2f);
            }
        }

        private RectTransform CreatePanel(Transform parent, string name, Color color)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            go.AddComponent<Image>().color = color;
            return rt;
        }

        private Text CreateText(RectTransform parent, string text, int size, Color color)
        {
            var go = new GameObject("Text");
            go.transform.SetParent(parent, false);
            go.AddComponent<RectTransform>();
            var txt = go.AddComponent<Text>();
            txt.text = text;
            txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            txt.fontSize = size;
            txt.color = color;
            txt.alignment = TextAnchor.MiddleCenter;
            return txt;
        }

        private Text AddLabel(Transform parent, string text, int fontSize, Color color)
        {
            var go = new GameObject("Label");
            go.transform.SetParent(parent, false);
            var txt = go.AddComponent<Text>();
            txt.text = text;
            txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            txt.fontSize = fontSize;
            txt.color = color;
            txt.alignment = TextAnchor.MiddleCenter;
            var le = go.AddComponent<LayoutElement>();
            le.preferredHeight = fontSize + 6;
            return txt;
        }

        private GameObject CreateSmallButton(Transform parent, string label, Color bgColor, Color textColor)
        {
            var go = new GameObject("Btn");
            go.transform.SetParent(parent, false);
            go.AddComponent<RectTransform>();
            go.AddComponent<Image>().color = bgColor;
            go.AddComponent<Button>();
            var le = go.AddComponent<LayoutElement>();
            le.preferredHeight = 30;
            le.preferredWidth = 120;

            var txtGO = new GameObject("Text");
            txtGO.transform.SetParent(go.transform, false);
            var txtRT = txtGO.AddComponent<RectTransform>();
            txtRT.anchorMin = Vector2.zero;
            txtRT.anchorMax = Vector2.one;
            txtRT.offsetMin = Vector2.zero;
            txtRT.offsetMax = Vector2.zero;
            var txt = txtGO.AddComponent<Text>();
            txt.text = label;
            txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            txt.fontSize = 12;
            txt.color = textColor;
            txt.alignment = TextAnchor.MiddleCenter;

            return go;
        }

        private void SetAnchors(RectTransform rt, float xMin, float yMin, float xMax, float yMax)
        {
            rt.anchorMin = new Vector2(xMin, yMin);
            rt.anchorMax = new Vector2(xMax, yMax);
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
        }
    }
}

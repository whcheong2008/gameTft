using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using ShatteredVeil.Core.Gacha;
using ShatteredVeil.Core.Units;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Gacha screen UI controller. Creates UI procedurally at runtime.
    /// Mirrors js/ui-v2.js: renderGachaScreen, uiDoSingleRoll, uiDoMultiRoll, createGachaCard.
    /// </summary>
    public class GachaSceneController : MonoBehaviour
    {
        private GachaSystem gachaSystem;
        private Dictionary<string, IUnitData> unitCatalog;

        private Canvas canvas;
        private Text titleText;
        private Text ratesText;
        private Text pityText;
        private Text veText;
        private Button rollOneBtn;
        private Button rollTenBtn;
        private Text rollOneBtnText;
        private Text rollTenBtnText;
        private RectTransform resultsContainer;
        private ScrollRect resultsScroll;

        private static readonly Color GoldColor = new Color(0.886f, 0.718f, 0.078f);
        private static readonly Color DarkBg = new Color(0.06f, 0.06f, 0.1f);
        private static readonly Color PanelBg = new Color(0.08f, 0.08f, 0.14f);
        private static readonly Color ButtonBg = new Color(0.16f, 0.22f, 0.38f);

        /// <summary>
        /// Initialize with a GachaSystem and unit catalog.
        /// Call this after creating the controller.
        /// </summary>
        public void Initialize(GachaSystem system, Dictionary<string, IUnitData> catalog)
        {
            gachaSystem = system;
            unitCatalog = catalog ?? new Dictionary<string, IUnitData>();
            BuildUI();
            RefreshUI();
        }

        private void BuildUI()
        {
            // Canvas
            var canvasGO = new GameObject("GachaCanvas");
            canvasGO.transform.SetParent(transform);
            canvas = canvasGO.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 100;
            canvasGO.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            canvasGO.GetComponent<CanvasScaler>().referenceResolution = new Vector2(1080, 1920);
            canvasGO.AddComponent<GraphicRaycaster>();

            // Root panel
            var root = CreatePanel(canvasGO.transform, "Root", DarkBg);
            root.anchorMin = Vector2.zero;
            root.anchorMax = Vector2.one;
            root.offsetMin = Vector2.zero;
            root.offsetMax = Vector2.zero;

            // Title
            titleText = CreateText(root, "Veil Rite", 28, GoldColor);
            SetAnchors(titleText.rectTransform, 0, 0.92f, 1, 0.98f);

            // VE display
            veText = CreateText(root, "", 18, Color.white);
            SetAnchors(veText.rectTransform, 0, 0.88f, 1, 0.92f);

            // Rates display
            ratesText = CreateText(root, "", 14, new Color(0.7f, 0.7f, 0.8f));
            SetAnchors(ratesText.rectTransform, 0.05f, 0.83f, 0.95f, 0.88f);

            // Pity info
            pityText = CreateText(root, "", 12, new Color(0.6f, 0.6f, 0.7f));
            SetAnchors(pityText.rectTransform, 0.05f, 0.79f, 0.95f, 0.83f);

            // Roll buttons panel
            var btnPanel = CreatePanel(root, "BtnPanel", Color.clear);
            SetAnchors(btnPanel, 0.05f, 0.72f, 0.95f, 0.79f);

            // Roll x1 button
            var r1GO = CreateButton(btnPanel, "RollOne", "Rite x1 (50 VE)", ButtonBg, GoldColor);
            rollOneBtn = r1GO.GetComponent<Button>();
            rollOneBtnText = r1GO.GetComponentInChildren<Text>();
            var r1Rect = r1GO.GetComponent<RectTransform>();
            r1Rect.anchorMin = new Vector2(0, 0);
            r1Rect.anchorMax = new Vector2(0.48f, 1);
            r1Rect.offsetMin = Vector2.zero;
            r1Rect.offsetMax = Vector2.zero;
            rollOneBtn.onClick.AddListener(OnRollOneClicked);

            // Roll x10 button
            var r10GO = CreateButton(btnPanel, "RollTen", "Rite x10 (450 VE)", ButtonBg, GoldColor);
            rollTenBtn = r10GO.GetComponent<Button>();
            rollTenBtnText = r10GO.GetComponentInChildren<Text>();
            var r10Rect = r10GO.GetComponent<RectTransform>();
            r10Rect.anchorMin = new Vector2(0.52f, 0);
            r10Rect.anchorMax = new Vector2(1, 1);
            r10Rect.offsetMin = Vector2.zero;
            r10Rect.offsetMax = Vector2.zero;
            rollTenBtn.onClick.AddListener(OnRollTenClicked);

            // Results scroll area
            var scrollGO = new GameObject("ResultsScroll");
            scrollGO.transform.SetParent(root, false);
            var scrollRect = scrollGO.AddComponent<RectTransform>();
            SetAnchors(scrollRect, 0.02f, 0.05f, 0.98f, 0.71f);
            resultsScroll = scrollGO.AddComponent<ScrollRect>();
            scrollGO.AddComponent<Image>().color = PanelBg;

            // Scroll content
            var contentGO = new GameObject("Content");
            contentGO.transform.SetParent(scrollGO.transform, false);
            resultsContainer = contentGO.AddComponent<RectTransform>();
            resultsContainer.anchorMin = new Vector2(0, 1);
            resultsContainer.anchorMax = new Vector2(1, 1);
            resultsContainer.pivot = new Vector2(0.5f, 1);
            resultsContainer.sizeDelta = new Vector2(0, 0);
            var layout = contentGO.AddComponent<GridLayoutGroup>();
            layout.cellSize = new Vector2(160, 200);
            layout.spacing = new Vector2(10, 10);
            layout.padding = new RectOffset(10, 10, 10, 10);
            layout.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
            layout.constraintCount = 5;
            var fitter = contentGO.AddComponent<ContentSizeFitter>();
            fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;

            resultsScroll.content = resultsContainer;
            resultsScroll.horizontal = false;
            resultsScroll.vertical = true;

            // Viewport mask
            var viewport = scrollGO.AddComponent<Mask>();
            viewport.showMaskGraphic = true;
        }

        private void RefreshUI()
        {
            if (gachaSystem == null) return;

            veText.text = $"Veil Essence: {gachaSystem.VeilEssence}";

            // Rates
            ratesText.text = $"Rates (Lv.{gachaSystem.PlayerLevel}): {gachaSystem.FormatTierWeights()}";

            // Pity
            pityText.text = $"Pity: guaranteed T{gachaSystem.PityMinTier}+ in {gachaSystem.RollsUntilPity} rolls";

            // Button states
            rollOneBtn.interactable = gachaSystem.CanAffordSingleRoll();
            rollTenBtn.interactable = gachaSystem.CanAffordMultiRoll();

            rollOneBtnText.text = $"Rite x1 ({gachaSystem.SingleRollCost} VE)";
            int multiCost = gachaSystem.MultiRollCost;
            rollTenBtnText.text = $"Rite x10 ({multiCost} VE)";
        }

        private void OnRollOneClicked()
        {
            if (gachaSystem == null) return;
            var result = gachaSystem.DoSingleRoll();
            if (!result.Success) return;

            ClearResults();
            AddResultHeader("Summoned 1 unit");
            AddResultCard(result);
            RefreshUI();
            GameEventBus.FireUnitRolled(result.UnitId);
            GameEventBus.FireGoldChanged(gachaSystem.VeilEssence);
        }

        private void OnRollTenClicked()
        {
            if (gachaSystem == null) return;
            var result = gachaSystem.DoMultiRoll();
            if (!result.Success) return;

            ClearResults();
            AddResultHeader("Summoned 10 units!");
            for (int i = 0; i < result.Results.Length; i++)
            {
                AddResultCard(result.Results[i]);
            }
            RefreshUI();
            GameEventBus.FireGoldChanged(gachaSystem.VeilEssence);
        }

        private void ClearResults()
        {
            for (int i = resultsContainer.childCount - 1; i >= 0; i--)
                Destroy(resultsContainer.GetChild(i).gameObject);
        }

        private void AddResultHeader(string text)
        {
            var headerGO = new GameObject("Header");
            headerGO.transform.SetParent(resultsContainer, false);
            var headerText = headerGO.AddComponent<Text>();
            headerText.text = text;
            headerText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            headerText.fontSize = 20;
            headerText.color = GoldColor;
            headerText.alignment = TextAnchor.MiddleCenter;
        }

        private void AddResultCard(GachaPullResult result)
        {
            if (result == null || !result.Success) return;

            var unitData = unitCatalog.TryGetValue(result.UnitId, out var data) ? data : null;
            string unitName = unitData?.Name ?? result.UnitId;
            string element = unitData?.Element ?? "Force";
            int tier = unitData?.Tier ?? result.Tier;

            var cardGO = new GameObject("Card_" + result.UnitId);
            cardGO.transform.SetParent(resultsContainer, false);

            var cardBg = cardGO.AddComponent<Image>();
            cardBg.color = GetTierColor(tier);

            var layout = cardGO.AddComponent<VerticalLayoutGroup>();
            layout.padding = new RectOffset(6, 6, 6, 6);
            layout.spacing = 4;
            layout.childAlignment = TextAnchor.MiddleCenter;
            layout.childForceExpandWidth = true;
            layout.childForceExpandHeight = false;

            // NEW badge
            if (result.IsNew)
                AddCardLabel(cardGO.transform, "NEW", 12, Color.green);

            // Evolved badge
            if (result.IsEvolvedCopy)
                AddCardLabel(cardGO.transform, "EVO", 12, GoldColor);

            // Element icon
            AddCardLabel(cardGO.transform, PlaceholderFactory.GetElementAbbrev(element), 16, PlaceholderFactory.GetElementColor(element));

            // Name
            AddCardLabel(cardGO.transform, unitName, 13, Color.white);

            // Tier stars
            string tierStars = new string('*', tier);
            AddCardLabel(cardGO.transform, tierStars, 14, GoldColor);

            // Pity indicator
            if (result.PityTriggered)
                AddCardLabel(cardGO.transform, "PITY!", 10, new Color(1f, 0.5f, 0.2f));
        }

        private void AddCardLabel(Transform parent, string text, int fontSize, Color color)
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

        // --- UI Helpers ---

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
            var rt = go.AddComponent<RectTransform>();
            var txt = go.AddComponent<Text>();
            txt.text = text;
            txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            txt.fontSize = size;
            txt.color = color;
            txt.alignment = TextAnchor.MiddleCenter;
            return txt;
        }

        private GameObject CreateButton(RectTransform parent, string name, string label, Color bgColor, Color textColor)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            go.AddComponent<RectTransform>();
            var img = go.AddComponent<Image>();
            img.color = bgColor;
            go.AddComponent<Button>();

            var textGO = new GameObject("Text");
            textGO.transform.SetParent(go.transform, false);
            var textRT = textGO.AddComponent<RectTransform>();
            textRT.anchorMin = Vector2.zero;
            textRT.anchorMax = Vector2.one;
            textRT.offsetMin = Vector2.zero;
            textRT.offsetMax = Vector2.zero;
            var txt = textGO.AddComponent<Text>();
            txt.text = label;
            txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            txt.fontSize = 16;
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

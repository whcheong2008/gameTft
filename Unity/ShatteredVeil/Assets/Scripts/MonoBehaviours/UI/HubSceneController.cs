using System.Collections.Generic;
using ShatteredVeil.Core.Economy;
using UnityEngine;
using UnityEngine.UI;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Main controller for the Hub/Camp scene.
    /// Creates a scrollable grid of building cards, wires upgrade flow,
    /// and manages the building detail panel overlay.
    /// Mirrors js/ui-v2.js renderHubScreen().
    /// </summary>
    public class HubSceneController : MonoBehaviour
    {
        private BuildingSystem buildingSystem;
        private Canvas hubCanvas;
        private RectTransform contentRoot;
        private GameObject buildingGridContainer;
        private BuildingPanelController panelController;
        private readonly List<BuildingCardController> cards = new List<BuildingCardController>();

        private void Start()
        {
            // TODO: In production, BuildingSystem comes from SaveManager.
            // For now, create a default one for testing the UI.
            var levels = new Dictionary<string, int>();
            buildingSystem = new BuildingSystem(levels, 1, 500);

            CreateHubUI();
            RefreshGrid();

            buildingSystem.OnBuildingUpgraded += HandleBuildingUpgraded;
            GameEventBus.OnGoldChanged += HandleVEChanged;
            GameEventBus.OnLevelUp += HandleLevelUp;
        }

        private void OnDestroy()
        {
            if (buildingSystem != null)
                buildingSystem.OnBuildingUpgraded -= HandleBuildingUpgraded;
            GameEventBus.OnGoldChanged -= HandleVEChanged;
            GameEventBus.OnLevelUp -= HandleLevelUp;
        }

        /// <summary>
        /// Allows external code (e.g. SaveManager) to inject a BuildingSystem.
        /// </summary>
        public void Initialize(BuildingSystem system)
        {
            if (buildingSystem != null)
                buildingSystem.OnBuildingUpgraded -= HandleBuildingUpgraded;

            buildingSystem = system;
            buildingSystem.OnBuildingUpgraded += HandleBuildingUpgraded;
            RefreshGrid();
        }

        private void CreateHubUI()
        {
            // Hub canvas
            var canvasGo = new GameObject("HubCanvas");
            canvasGo.transform.SetParent(transform, false);
            hubCanvas = canvasGo.AddComponent<Canvas>();
            hubCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
            hubCanvas.sortingOrder = 100;
            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1080, 1920);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGo.AddComponent<GraphicRaycaster>();

            // Title
            var titleGo = new GameObject("Title");
            titleGo.transform.SetParent(canvasGo.transform, false);
            var titleText = titleGo.AddComponent<Text>();
            titleText.text = "Camp Practices";
            titleText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            titleText.fontSize = 42;
            titleText.color = new Color(0.886f, 0.718f, 0.078f); // Gold
            titleText.alignment = TextAnchor.MiddleCenter;
            titleText.fontStyle = FontStyle.Bold;
            var titleRt = titleText.rectTransform;
            titleRt.anchorMin = new Vector2(0, 1);
            titleRt.anchorMax = new Vector2(1, 1);
            titleRt.pivot = new Vector2(0.5f, 1);
            titleRt.anchoredPosition = new Vector2(0, -100);
            titleRt.sizeDelta = new Vector2(0, 60);

            // Scroll view for building grid
            var scrollGo = new GameObject("ScrollView");
            scrollGo.transform.SetParent(canvasGo.transform, false);
            var scrollImg = scrollGo.AddComponent<Image>();
            scrollImg.color = new Color(0, 0, 0, 0);
            var scrollRt = scrollImg.rectTransform;
            scrollRt.anchorMin = new Vector2(0.02f, 0.12f); // Leave room for bottom nav
            scrollRt.anchorMax = new Vector2(0.98f, 0.88f); // Leave room for title + top bar
            scrollRt.offsetMin = Vector2.zero;
            scrollRt.offsetMax = Vector2.zero;

            var scrollRect = scrollGo.AddComponent<ScrollRect>();
            scrollRect.horizontal = false;
            scrollRect.vertical = true;

            var mask = scrollGo.AddComponent<Mask>();
            mask.showMaskGraphic = false;

            // Content container (vertical layout)
            var contentGo = new GameObject("Content");
            contentGo.transform.SetParent(scrollGo.transform, false);
            contentRoot = contentGo.AddComponent<RectTransform>();
            contentRoot.anchorMin = new Vector2(0, 1);
            contentRoot.anchorMax = new Vector2(1, 1);
            contentRoot.pivot = new Vector2(0.5f, 1);
            contentRoot.anchoredPosition = Vector2.zero;

            var vlg = contentGo.AddComponent<VerticalLayoutGroup>();
            vlg.spacing = 16;
            vlg.padding = new RectOffset(16, 16, 16, 16);
            vlg.childForceExpandWidth = true;
            vlg.childForceExpandHeight = false;
            vlg.childControlWidth = true;
            vlg.childControlHeight = true;

            var csf = contentGo.AddComponent<ContentSizeFitter>();
            csf.verticalFit = ContentSizeFitter.FitMode.PreferredSize;

            scrollRect.content = contentRoot;
            buildingGridContainer = contentGo;

            // Building panel overlay (hidden by default)
            var panelGo = new GameObject("BuildingPanel");
            panelGo.transform.SetParent(canvasGo.transform, false);
            panelController = panelGo.AddComponent<BuildingPanelController>();
            panelController.Hide();
        }

        public void RefreshGrid()
        {
            // Clear existing cards
            foreach (var card in cards)
            {
                if (card != null && card.gameObject != null)
                    Destroy(card.gameObject);
            }
            cards.Clear();

            // Create a card for each building
            for (int i = 0; i < BuildingData.All.Length; i++)
            {
                var def = BuildingData.All[i];
                var cardGo = new GameObject("Card_" + def.Id);
                cardGo.transform.SetParent(buildingGridContainer.transform, false);

                var le = cardGo.AddComponent<LayoutElement>();
                le.preferredHeight = 160;

                var card = cardGo.AddComponent<BuildingCardController>();
                card.Setup(def, buildingSystem, OnCardClicked);
                cards.Add(card);
            }
        }

        private void OnCardClicked(string buildingId)
        {
            if (buildingSystem.HasDetailPanel(buildingId))
            {
                panelController.Show(buildingId, buildingSystem, OnUpgradeFromPanel);
            }
            else if (buildingSystem.CanUpgrade(buildingId))
            {
                var def = BuildingData.GetById(buildingId);
                int level = buildingSystem.GetLevel(buildingId);
                int cost = buildingSystem.GetUpgradeCost(buildingId);
                string msg = "Upgrade " + def.Name + " to Level " + (level + 1) + " for " + cost + " VE?";

                if (ConfirmDialogController.Instance != null)
                {
                    ConfirmDialogController.Instance.Show(msg, () =>
                    {
                        if (buildingSystem.TryUpgrade(buildingId))
                        {
                            GameEventBus.FireGoldChanged(buildingSystem.GetVeilEssence());
                            GameEventBus.FireToastRequested(def.Name + " upgraded to Level " + buildingSystem.GetLevel(buildingId));
                        }
                    });
                }
                else
                {
                    // Fallback: just upgrade directly
                    buildingSystem.TryUpgrade(buildingId);
                }
            }
        }

        private void OnUpgradeFromPanel(string buildingId)
        {
            if (buildingSystem.TryUpgrade(buildingId))
            {
                var def = BuildingData.GetById(buildingId);
                GameEventBus.FireGoldChanged(buildingSystem.GetVeilEssence());
                GameEventBus.FireToastRequested(def.Name + " upgraded to Level " + buildingSystem.GetLevel(buildingId));
                panelController.Refresh(buildingId, buildingSystem);
                RefreshGrid();
            }
        }

        private void HandleBuildingUpgraded(string buildingId, int newLevel)
        {
            RefreshGrid();
        }

        private void HandleVEChanged(int newAmount)
        {
            buildingSystem.SetVeilEssence(newAmount);
            RefreshGrid();
        }

        private void HandleLevelUp(int newLevel)
        {
            buildingSystem.SetPlayerLevel(newLevel);
            RefreshGrid();
        }
    }
}

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
    /// </summary>
    public class HubSceneController : MonoBehaviour
    {
        private BuildingSystem buildingSystem;
        private Canvas hubCanvas;
        private RectTransform contentRoot;
        private GameObject buildingGridContainer;
        private BuildingPanelController panelController;
        private readonly List<BuildingCardController> cards = new List<BuildingCardController>();

        private const float CardHeight = 100f;
        private const float CardSpacing = 10f;
        private const int CardPadding = 10;

        private void Start()
        {
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
            // Canvas — use landscape reference resolution
            var canvasGo = new GameObject("HubCanvas");
            canvasGo.transform.SetParent(transform, false);
            hubCanvas = canvasGo.AddComponent<Canvas>();
            hubCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
            hubCanvas.sortingOrder = 100;
            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1280, 720);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGo.AddComponent<GraphicRaycaster>();

            // Title bar
            var titleGo = new GameObject("Title");
            titleGo.transform.SetParent(canvasGo.transform, false);
            var titleText = titleGo.AddComponent<Text>();
            titleText.text = "Camp Practices";
            titleText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            titleText.fontSize = 28;
            titleText.color = new Color(0.886f, 0.718f, 0.078f);
            titleText.alignment = TextAnchor.MiddleCenter;
            titleText.fontStyle = FontStyle.Bold;
            var titleRt = titleText.rectTransform;
            titleRt.anchorMin = new Vector2(0, 1);
            titleRt.anchorMax = new Vector2(1, 1);
            titleRt.pivot = new Vector2(0.5f, 1);
            titleRt.anchoredPosition = new Vector2(0, -5);
            titleRt.sizeDelta = new Vector2(0, 40);

            // Viewport — separate GO for the Mask (not on the ScrollRect)
            var viewportGo = new GameObject("Viewport");
            viewportGo.transform.SetParent(canvasGo.transform, false);
            var vpImg = viewportGo.AddComponent<Image>();
            vpImg.color = new Color(0, 0, 0, 1);
            var vpRt = vpImg.rectTransform;
            vpRt.anchorMin = new Vector2(0.02f, 0.02f);
            vpRt.anchorMax = new Vector2(0.98f, 0.92f);
            vpRt.offsetMin = Vector2.zero;
            vpRt.offsetMax = Vector2.zero;
            var mask = viewportGo.AddComponent<Mask>();
            mask.showMaskGraphic = false;

            // Content container (children laid out manually — no ContentSizeFitter)
            var contentGo = new GameObject("Content");
            contentGo.transform.SetParent(viewportGo.transform, false);
            contentRoot = contentGo.AddComponent<RectTransform>();
            contentRoot.anchorMin = new Vector2(0, 1);
            contentRoot.anchorMax = new Vector2(1, 1);
            contentRoot.pivot = new Vector2(0.5f, 1);
            contentRoot.anchoredPosition = Vector2.zero;
            contentRoot.sizeDelta = new Vector2(0, 0);

            // ScrollRect on a separate invisible GO parented to the canvas
            var scrollGo = new GameObject("ScrollRect");
            scrollGo.transform.SetParent(canvasGo.transform, false);
            var scrollBg = scrollGo.AddComponent<Image>();
            scrollBg.color = new Color(0, 0, 0, 0);
            scrollBg.raycastTarget = true;
            var scrollRt = scrollBg.rectTransform;
            // Match the viewport area exactly
            scrollRt.anchorMin = new Vector2(0.02f, 0.02f);
            scrollRt.anchorMax = new Vector2(0.98f, 0.92f);
            scrollRt.offsetMin = Vector2.zero;
            scrollRt.offsetMax = Vector2.zero;

            var scrollRect = scrollGo.AddComponent<ScrollRect>();
            scrollRect.horizontal = false;
            scrollRect.vertical = true;
            scrollRect.content = contentRoot;
            scrollRect.viewport = vpRt;
            scrollRect.movementType = ScrollRect.MovementType.Clamped;
            scrollRect.scrollSensitivity = 20f;

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
            int count = BuildingData.All.Length;
            for (int i = 0; i < count; i++)
            {
                var def = BuildingData.All[i];
                var cardGo = new GameObject("Card_" + def.Id);
                cardGo.transform.SetParent(buildingGridContainer.transform, false);

                // Position each card manually — no LayoutGroup needed
                var cardRt = cardGo.AddComponent<RectTransform>();
                cardRt.anchorMin = new Vector2(0, 1);
                cardRt.anchorMax = new Vector2(1, 1);
                cardRt.pivot = new Vector2(0.5f, 1);
                float yPos = CardPadding + i * (CardHeight + CardSpacing);
                cardRt.anchoredPosition = new Vector2(0, -yPos);
                cardRt.sizeDelta = new Vector2(-CardPadding * 2, CardHeight);

                var card = cardGo.AddComponent<BuildingCardController>();
                card.Setup(def, buildingSystem, OnCardClicked);
                cards.Add(card);
            }

            // Set content height so ScrollRect knows how far to scroll
            float totalHeight = CardPadding * 2 + count * CardHeight + (count - 1) * CardSpacing;
            contentRoot.sizeDelta = new Vector2(0, totalHeight);
        }

        private void OnCardClicked(string buildingId)
        {
            Debug.Log("[Hub] Card clicked: " + buildingId);

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
                    if (buildingSystem.TryUpgrade(buildingId))
                    {
                        Debug.Log("[Hub] Upgraded " + buildingId);
                        RefreshGrid();
                    }
                }
            }
            else
            {
                Debug.Log("[Hub] Cannot upgrade " + buildingId + " (locked or insufficient VE)");
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

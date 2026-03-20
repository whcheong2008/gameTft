using System;
using ShatteredVeil.Core.Economy;
using UnityEngine;
using UnityEngine.UI;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Full-screen overlay panel for building details.
    /// Shows building info, upgrade button, capabilities checklist, and close button.
    /// Mirrors the building panels from js/ui-v2.js (showManaShrinePanel, showGemWorkshopPanel, etc).
    /// </summary>
    public class BuildingPanelController : MonoBehaviour
    {
        private GameObject panelRoot;
        private Image overlayImage;
        private Image panelBg;
        private Text titleText;
        private Text levelText;
        private Text descriptionText;
        private Text capabilitiesText;
        private Button upgradeButton;
        private Text upgradeButtonText;
        private Button closeButton;

        private string currentBuildingId;
        private Action<string> onUpgradeCallback;

        private void Awake()
        {
            CreatePanel();
        }

        private void CreatePanel()
        {
            // Root container (full-screen overlay)
            panelRoot = new GameObject("PanelRoot");
            panelRoot.transform.SetParent(transform, false);
            var rootRt = panelRoot.AddComponent<RectTransform>();
            rootRt.anchorMin = Vector2.zero;
            rootRt.anchorMax = Vector2.one;
            rootRt.offsetMin = Vector2.zero;
            rootRt.offsetMax = Vector2.zero;

            // Dark overlay
            overlayImage = panelRoot.AddComponent<Image>();
            overlayImage.color = new Color(0, 0, 0, 0.85f);

            // Panel background
            var panelGo = new GameObject("PanelBg");
            panelGo.transform.SetParent(panelRoot.transform, false);
            panelBg = panelGo.AddComponent<Image>();
            panelBg.color = new Color(0.1f, 0.1f, 0.18f);
            var panelRt = panelBg.rectTransform;
            panelRt.anchorMin = new Vector2(0.5f, 0.5f);
            panelRt.anchorMax = new Vector2(0.5f, 0.5f);
            panelRt.sizeDelta = new Vector2(900, 1100);

            // Title
            var titleGo = new GameObject("Title");
            titleGo.transform.SetParent(panelGo.transform, false);
            titleText = titleGo.AddComponent<Text>();
            titleText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            titleText.fontSize = 36;
            titleText.fontStyle = FontStyle.Bold;
            titleText.color = new Color(0.886f, 0.718f, 0.078f);
            titleText.alignment = TextAnchor.MiddleCenter;
            var titleRt = titleText.rectTransform;
            titleRt.anchorMin = new Vector2(0.05f, 0.88f);
            titleRt.anchorMax = new Vector2(0.75f, 0.96f);
            titleRt.offsetMin = Vector2.zero;
            titleRt.offsetMax = Vector2.zero;

            // Level
            var levelGo = new GameObject("Level");
            levelGo.transform.SetParent(panelGo.transform, false);
            levelText = levelGo.AddComponent<Text>();
            levelText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            levelText.fontSize = 24;
            levelText.color = new Color(0.67f, 0.67f, 0.67f);
            levelText.alignment = TextAnchor.MiddleRight;
            var levelRt = levelText.rectTransform;
            levelRt.anchorMin = new Vector2(0.6f, 0.88f);
            levelRt.anchorMax = new Vector2(0.95f, 0.96f);
            levelRt.offsetMin = Vector2.zero;
            levelRt.offsetMax = Vector2.zero;

            // Description
            var descGo = new GameObject("Description");
            descGo.transform.SetParent(panelGo.transform, false);
            descriptionText = descGo.AddComponent<Text>();
            descriptionText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            descriptionText.fontSize = 24;
            descriptionText.color = new Color(0.8f, 0.8f, 0.8f);
            descriptionText.alignment = TextAnchor.UpperLeft;
            var descRt = descriptionText.rectTransform;
            descRt.anchorMin = new Vector2(0.05f, 0.78f);
            descRt.anchorMax = new Vector2(0.95f, 0.87f);
            descRt.offsetMin = Vector2.zero;
            descRt.offsetMax = Vector2.zero;

            // Capabilities (multiline text)
            var capsGo = new GameObject("Capabilities");
            capsGo.transform.SetParent(panelGo.transform, false);
            capabilitiesText = capsGo.AddComponent<Text>();
            capabilitiesText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            capabilitiesText.fontSize = 22;
            capabilitiesText.color = Color.white;
            capabilitiesText.alignment = TextAnchor.UpperLeft;
            var capsRt = capabilitiesText.rectTransform;
            capsRt.anchorMin = new Vector2(0.05f, 0.25f);
            capsRt.anchorMax = new Vector2(0.95f, 0.77f);
            capsRt.offsetMin = Vector2.zero;
            capsRt.offsetMax = Vector2.zero;

            // Upgrade button
            var upgBtnGo = new GameObject("UpgradeButton");
            upgBtnGo.transform.SetParent(panelGo.transform, false);
            var upgBtnImg = upgBtnGo.AddComponent<Image>();
            upgBtnImg.color = new Color(0.886f, 0.718f, 0.078f);
            var upgBtnRt = upgBtnImg.rectTransform;
            upgBtnRt.anchorMin = new Vector2(0.1f, 0.12f);
            upgBtnRt.anchorMax = new Vector2(0.55f, 0.2f);
            upgBtnRt.offsetMin = Vector2.zero;
            upgBtnRt.offsetMax = Vector2.zero;

            upgradeButton = upgBtnGo.AddComponent<Button>();
            upgradeButton.onClick.AddListener(OnUpgradeClicked);

            var upgTextGo = new GameObject("Text");
            upgTextGo.transform.SetParent(upgBtnGo.transform, false);
            upgradeButtonText = upgTextGo.AddComponent<Text>();
            upgradeButtonText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            upgradeButtonText.fontSize = 24;
            upgradeButtonText.color = new Color(0.1f, 0.1f, 0.18f);
            upgradeButtonText.alignment = TextAnchor.MiddleCenter;
            upgradeButtonText.fontStyle = FontStyle.Bold;
            var upgTextRt = upgradeButtonText.rectTransform;
            upgTextRt.anchorMin = Vector2.zero;
            upgTextRt.anchorMax = Vector2.one;
            upgTextRt.offsetMin = Vector2.zero;
            upgTextRt.offsetMax = Vector2.zero;

            // Close button
            var closeBtnGo = new GameObject("CloseButton");
            closeBtnGo.transform.SetParent(panelGo.transform, false);
            var closeBtnImg = closeBtnGo.AddComponent<Image>();
            closeBtnImg.color = new Color(0.2f, 0.2f, 0.2f);
            var closeBtnRt = closeBtnImg.rectTransform;
            closeBtnRt.anchorMin = new Vector2(0.6f, 0.12f);
            closeBtnRt.anchorMax = new Vector2(0.9f, 0.2f);
            closeBtnRt.offsetMin = Vector2.zero;
            closeBtnRt.offsetMax = Vector2.zero;

            closeButton = closeBtnGo.AddComponent<Button>();
            closeButton.onClick.AddListener(Hide);

            var closeTextGo = new GameObject("Text");
            closeTextGo.transform.SetParent(closeBtnGo.transform, false);
            var closeText = closeTextGo.AddComponent<Text>();
            closeText.text = "Close";
            closeText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            closeText.fontSize = 24;
            closeText.color = Color.white;
            closeText.alignment = TextAnchor.MiddleCenter;
            closeText.fontStyle = FontStyle.Bold;
            var closeTextRt = closeText.rectTransform;
            closeTextRt.anchorMin = Vector2.zero;
            closeTextRt.anchorMax = Vector2.one;
            closeTextRt.offsetMin = Vector2.zero;
            closeTextRt.offsetMax = Vector2.zero;
        }

        public void Show(string buildingId, BuildingSystem system, Action<string> onUpgrade)
        {
            currentBuildingId = buildingId;
            onUpgradeCallback = onUpgrade;
            panelRoot.SetActive(true);
            Refresh(buildingId, system);
        }

        public void Refresh(string buildingId, BuildingSystem system)
        {
            var def = BuildingData.GetById(buildingId);
            if (def == null) return;

            int level = system.GetLevel(buildingId);
            bool isMax = system.IsMaxLevel(buildingId);
            bool canUp = system.CanUpgrade(buildingId);

            titleText.text = def.Name;
            titleText.color = GetPanelAccentColor(buildingId);
            levelText.text = "Level " + level + " / " + def.MaxLevel;
            descriptionText.text = def.Description;

            // Build capabilities checklist
            string caps = "";
            for (int i = 1; i < def.Effects.Length; i++)
            {
                bool unlocked = level >= i;
                string marker = unlocked ? "<color=#6bcb77>[OK]</color>" : "<color=#666666>[ ]</color>";
                string effectColor = unlocked ? "#6bcb77" : "#666666";
                caps += marker + " L" + i + ": <color=" + effectColor + ">" + def.Effects[i] + "</color>\n";
            }
            capabilitiesText.text = caps;

            // Upgrade button
            if (isMax)
            {
                upgradeButtonText.text = "MAX LEVEL";
                upgradeButton.interactable = false;
                upgradeButton.GetComponent<Image>().color = new Color(0.3f, 0.3f, 0.3f);
            }
            else
            {
                int cost = system.GetUpgradeCost(buildingId);
                upgradeButtonText.text = "Upgrade to L" + (level + 1) + " (" + cost + " VE)";
                upgradeButton.interactable = canUp;
                upgradeButton.GetComponent<Image>().color = canUp
                    ? GetPanelAccentColor(buildingId)
                    : new Color(0.3f, 0.3f, 0.3f);
            }

            // Panel border color
            panelBg.color = new Color(0.1f, 0.1f, 0.18f);
        }

        public void Hide()
        {
            panelRoot.SetActive(false);
            currentBuildingId = null;
            onUpgradeCallback = null;
        }

        private void OnUpgradeClicked()
        {
            if (currentBuildingId != null)
                onUpgradeCallback?.Invoke(currentBuildingId);
        }

        private static Color GetPanelAccentColor(string buildingId)
        {
            switch (buildingId)
            {
                case "deep_resonance": return new Color(0.886f, 0.718f, 0.078f);
                case "echo_shaping": return new Color(0.886f, 0.718f, 0.078f);
                case "prism_focus": return new Color(0.886f, 0.718f, 0.078f);
                case "veil_wellspring": return new Color(0.267f, 0.533f, 1f);
                case "kindred_circle": return new Color(0.267f, 0.667f, 0.533f);
                default: return new Color(0.886f, 0.718f, 0.078f);
            }
        }
    }
}

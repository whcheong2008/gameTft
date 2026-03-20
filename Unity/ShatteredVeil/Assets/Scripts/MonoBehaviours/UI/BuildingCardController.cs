using System;
using ShatteredVeil.Core.Economy;
using UnityEngine;
using UnityEngine.UI;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Individual building card in the hub grid.
    /// Shows building icon (placeholder color), name, level, effect, cost.
    /// Mirrors the building div creation in js/ui-v2.js renderHubScreen().
    /// </summary>
    public class BuildingCardController : MonoBehaviour
    {
        private Image background;
        private Image iconImage;
        private Text nameLabel;
        private Text levelLabel;
        private Text effectLabel;
        private Text costLabel;

        private string buildingId;
        private Action<string> onClickCallback;

        private static readonly Color CardBg = new Color(0.1f, 0.1f, 0.18f);
        private static readonly Color CardBgLocked = new Color(0.08f, 0.08f, 0.12f);
        private static readonly Color Gold = new Color(0.886f, 0.718f, 0.078f);
        private static readonly Color TextMuted = new Color(0.5f, 0.5f, 0.5f);

        public void Setup(BuildingDefinition def, BuildingSystem system, Action<string> onClick)
        {
            buildingId = def.Id;
            onClickCallback = onClick;

            CreateCard();
            Refresh(def, system);

            // Click handler
            var button = gameObject.AddComponent<Button>();
            button.onClick.AddListener(() => onClickCallback?.Invoke(buildingId));
        }

        private void CreateCard()
        {
            // Background
            background = gameObject.AddComponent<Image>();
            background.color = CardBg;

            // Icon placeholder (colored square by building type)
            var iconGo = new GameObject("Icon");
            iconGo.transform.SetParent(transform, false);
            iconImage = iconGo.AddComponent<Image>();
            var iconRt = iconImage.rectTransform;
            iconRt.anchorMin = new Vector2(0, 0.5f);
            iconRt.anchorMax = new Vector2(0, 0.5f);
            iconRt.pivot = new Vector2(0, 0.5f);
            iconRt.anchoredPosition = new Vector2(16, 0);
            iconRt.sizeDelta = new Vector2(80, 80);

            // Name
            var nameGo = new GameObject("Name");
            nameGo.transform.SetParent(transform, false);
            nameLabel = nameGo.AddComponent<Text>();
            nameLabel.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            nameLabel.fontSize = 28;
            nameLabel.fontStyle = FontStyle.Bold;
            nameLabel.color = Color.white;
            var nameRt = nameLabel.rectTransform;
            nameRt.anchorMin = new Vector2(0, 0.6f);
            nameRt.anchorMax = new Vector2(1, 0.95f);
            nameRt.offsetMin = new Vector2(112, 0);
            nameRt.offsetMax = new Vector2(-16, 0);

            // Level
            var levelGo = new GameObject("Level");
            levelGo.transform.SetParent(transform, false);
            levelLabel = levelGo.AddComponent<Text>();
            levelLabel.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            levelLabel.fontSize = 22;
            levelLabel.color = new Color(0.67f, 0.67f, 0.67f);
            var levelRt = levelLabel.rectTransform;
            levelRt.anchorMin = new Vector2(0, 0.35f);
            levelRt.anchorMax = new Vector2(0.5f, 0.6f);
            levelRt.offsetMin = new Vector2(112, 0);
            levelRt.offsetMax = Vector2.zero;

            // Effect
            var effectGo = new GameObject("Effect");
            effectGo.transform.SetParent(transform, false);
            effectLabel = effectGo.AddComponent<Text>();
            effectLabel.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            effectLabel.fontSize = 20;
            effectLabel.color = new Color(0.8f, 0.8f, 0.8f);
            var effectRt = effectLabel.rectTransform;
            effectRt.anchorMin = new Vector2(0, 0.05f);
            effectRt.anchorMax = new Vector2(0.65f, 0.35f);
            effectRt.offsetMin = new Vector2(112, 0);
            effectRt.offsetMax = Vector2.zero;

            // Cost
            var costGo = new GameObject("Cost");
            costGo.transform.SetParent(transform, false);
            costLabel = costGo.AddComponent<Text>();
            costLabel.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            costLabel.fontSize = 22;
            costLabel.alignment = TextAnchor.MiddleRight;
            var costRt = costLabel.rectTransform;
            costRt.anchorMin = new Vector2(0.5f, 0.05f);
            costRt.anchorMax = new Vector2(1, 0.35f);
            costRt.offsetMin = Vector2.zero;
            costRt.offsetMax = new Vector2(-16, 0);
        }

        public void Refresh(BuildingDefinition def, BuildingSystem system)
        {
            int level = system.GetLevel(def.Id);
            bool prereqLocked = system.IsPrereqLocked(def.Id);
            bool isMax = system.IsMaxLevel(def.Id);
            bool canUp = system.CanUpgrade(def.Id);

            // Icon color per building
            iconImage.color = GetBuildingColor(def.Id);

            if (prereqLocked)
            {
                background.color = CardBgLocked;
                var cg = gameObject.GetComponent<CanvasGroup>();
                if (cg == null) cg = gameObject.AddComponent<CanvasGroup>();
                cg.alpha = 0.5f;

                nameLabel.text = def.Name;
                levelLabel.text = "Locked";
                levelLabel.color = TextMuted;
                effectLabel.text = "Unlock at Player Level " + def.PrereqLevel;
                effectLabel.color = TextMuted;
                costLabel.text = "";
            }
            else
            {
                background.color = CardBg;
                var cg = gameObject.GetComponent<CanvasGroup>();
                if (cg != null) cg.alpha = 1f;

                nameLabel.text = def.Name;
                levelLabel.text = "Level " + level + " / " + def.MaxLevel;
                levelLabel.color = new Color(0.67f, 0.67f, 0.67f);
                effectLabel.text = def.GetEffect(level);
                effectLabel.color = new Color(0.8f, 0.8f, 0.8f);

                if (isMax)
                {
                    costLabel.text = "MAX";
                    costLabel.color = new Color(0.42f, 0.8f, 0.47f); // Green
                }
                else
                {
                    int cost = system.GetUpgradeCost(def.Id);
                    costLabel.text = cost + " VE";
                    costLabel.color = canUp ? Gold : TextMuted;
                }
            }
        }

        private static Color GetBuildingColor(string buildingId)
        {
            switch (buildingId)
            {
                case "sustained_bonds": return new Color(0.3f, 0.7f, 0.5f);
                case "attunement_rite": return new Color(0.6f, 0.2f, 0.8f);
                case "essence_reservoir": return new Color(0.2f, 0.5f, 0.9f);
                case "deep_resonance": return new Color(0.2f, 0.8f, 0.4f);
                case "echo_shaping": return new Color(0.8f, 0.5f, 0.2f);
                case "prism_focus": return new Color(0.7f, 0.3f, 0.9f);
                case "veil_wellspring": return new Color(0.2f, 0.4f, 0.9f);
                case "kindred_circle": return new Color(0.3f, 0.7f, 0.6f);
                default: return Color.gray;
            }
        }
    }
}

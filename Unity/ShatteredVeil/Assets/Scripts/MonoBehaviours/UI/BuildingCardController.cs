using System;
using ShatteredVeil.Core.Economy;
using UnityEngine;
using UnityEngine.UI;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Individual building card in the hub grid.
    /// Shows building icon (placeholder color), name, level, effect, cost.
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

        private static readonly Color CardBg = new Color(0.15f, 0.15f, 0.22f);
        private static readonly Color CardBgLocked = new Color(0.1f, 0.1f, 0.15f);
        private static readonly Color Gold = new Color(0.886f, 0.718f, 0.078f);
        private static readonly Color TextMuted = new Color(0.5f, 0.5f, 0.5f);

        public void Setup(BuildingDefinition def, BuildingSystem system, Action<string> onClick)
        {
            buildingId = def.Id;
            onClickCallback = onClick;

            CreateCard();
            Refresh(def, system);

            var button = gameObject.AddComponent<Button>();
            button.targetGraphic = background;
            button.onClick.AddListener(() => onClickCallback?.Invoke(buildingId));
        }

        private void CreateCard()
        {
            // Background
            background = gameObject.GetComponent<Image>();
            if (background == null)
                background = gameObject.AddComponent<Image>();
            background.color = CardBg;

            // Icon placeholder (colored square)
            var iconGo = new GameObject("Icon");
            iconGo.transform.SetParent(transform, false);
            iconImage = iconGo.AddComponent<Image>();
            var iconRt = iconImage.rectTransform;
            iconRt.anchorMin = new Vector2(0, 0.1f);
            iconRt.anchorMax = new Vector2(0, 0.9f);
            iconRt.pivot = new Vector2(0, 0.5f);
            iconRt.anchoredPosition = new Vector2(8, 0);
            iconRt.sizeDelta = new Vector2(60, 0);

            float textLeft = 80f;

            // Name
            nameLabel = CreateText("Name", transform, 18, FontStyle.Bold, Color.white);
            var nameRt = nameLabel.rectTransform;
            nameRt.anchorMin = new Vector2(0, 0.55f);
            nameRt.anchorMax = new Vector2(0.7f, 0.95f);
            nameRt.offsetMin = new Vector2(textLeft, 0);
            nameRt.offsetMax = Vector2.zero;

            // Level
            levelLabel = CreateText("Level", transform, 14, FontStyle.Normal, new Color(0.67f, 0.67f, 0.67f));
            var levelRt = levelLabel.rectTransform;
            levelRt.anchorMin = new Vector2(0, 0.3f);
            levelRt.anchorMax = new Vector2(0.4f, 0.55f);
            levelRt.offsetMin = new Vector2(textLeft, 0);
            levelRt.offsetMax = Vector2.zero;

            // Effect
            effectLabel = CreateText("Effect", transform, 13, FontStyle.Normal, new Color(0.8f, 0.8f, 0.8f));
            var effectRt = effectLabel.rectTransform;
            effectRt.anchorMin = new Vector2(0, 0.05f);
            effectRt.anchorMax = new Vector2(0.65f, 0.3f);
            effectRt.offsetMin = new Vector2(textLeft, 0);
            effectRt.offsetMax = Vector2.zero;

            // Cost
            costLabel = CreateText("Cost", transform, 16, FontStyle.Bold, Gold);
            costLabel.alignment = TextAnchor.MiddleRight;
            var costRt = costLabel.rectTransform;
            costRt.anchorMin = new Vector2(0.7f, 0.3f);
            costRt.anchorMax = new Vector2(1, 0.7f);
            costRt.offsetMin = Vector2.zero;
            costRt.offsetMax = new Vector2(-10, 0);
        }

        private static Text CreateText(string name, Transform parent, int fontSize, FontStyle style, Color color)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var text = go.AddComponent<Text>();
            text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            text.fontSize = fontSize;
            text.fontStyle = style;
            text.color = color;
            text.alignment = TextAnchor.MiddleLeft;
            text.horizontalOverflow = HorizontalWrapMode.Overflow;
            text.verticalOverflow = VerticalWrapMode.Truncate;
            return text;
        }

        public void Refresh(BuildingDefinition def, BuildingSystem system)
        {
            int level = system.GetLevel(def.Id);
            bool prereqLocked = system.IsPrereqLocked(def.Id);
            bool isMax = system.IsMaxLevel(def.Id);
            bool canUp = system.CanUpgrade(def.Id);

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
                effectLabel.text = "Req. Level " + def.PrereqLevel;
                effectLabel.color = TextMuted;
                costLabel.text = "";
            }
            else
            {
                background.color = CardBg;
                var cg = gameObject.GetComponent<CanvasGroup>();
                if (cg != null) cg.alpha = 1f;

                nameLabel.text = def.Name;
                levelLabel.text = "Lv " + level + "/" + def.MaxLevel;
                levelLabel.color = new Color(0.67f, 0.67f, 0.67f);
                effectLabel.text = def.GetEffect(level);
                effectLabel.color = new Color(0.8f, 0.8f, 0.8f);

                if (isMax)
                {
                    costLabel.text = "MAX";
                    costLabel.color = new Color(0.42f, 0.8f, 0.47f);
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

using UnityEngine;
using UnityEngine.UI;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Reusable unit display card with placeholder sprite, name, stars, tier badge, and element icon.
    /// </summary>
    public class UnitCardController : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private Image background;
        [SerializeField] private Image unitSprite;
        [SerializeField] private Text nameLabel;
        [SerializeField] private Text starsLabel;
        [SerializeField] private Text tierBadge;
        [SerializeField] private Image elementIcon;
        [SerializeField] private Text elementLabel;

        public void Setup(string unitName, string element, int tier, int stars)
        {
            var elemColor = PlaceholderFactory.GetElementColor(element);

            if (background != null)
            {
                var borderColor = elemColor;
                borderColor.a = 0.8f;
                background.color = borderColor;
            }

            if (unitSprite != null)
            {
                unitSprite.sprite = PlaceholderFactory.CreateUnitSprite(element, tier);
                unitSprite.color = Color.white;
            }

            if (nameLabel != null)
                nameLabel.text = unitName;

            if (starsLabel != null)
            {
                string starStr = "";
                for (int i = 0; i < stars; i++) starStr += "*";
                starsLabel.text = starStr;
            }

            if (tierBadge != null)
                tierBadge.text = "T" + tier;

            if (elementIcon != null)
                elementIcon.color = elemColor;

            if (elementLabel != null)
                elementLabel.text = PlaceholderFactory.GetElementAbbreviation(element);
        }
    }
}

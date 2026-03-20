using UnityEngine;
using UnityEngine.UI;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Persistent top bar showing player level, VE currency, and XP bar.
    /// Subscribes to GameEventBus for updates.
    /// </summary>
    public class TopBarController : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private Text levelText;
        [SerializeField] private Text currencyText;
        [SerializeField] private Text xpText;
        [SerializeField] private Image xpFill;
        [SerializeField] private GameObject backButton;

        private void OnEnable()
        {
            GameEventBus.OnGoldChanged += HandleGoldChanged;
            GameEventBus.OnXPChanged += HandleXPChanged;
            GameEventBus.OnLevelUp += HandleLevelUp;
        }

        private void OnDisable()
        {
            GameEventBus.OnGoldChanged -= HandleGoldChanged;
            GameEventBus.OnXPChanged -= HandleXPChanged;
            GameEventBus.OnLevelUp -= HandleLevelUp;
        }

        public void SetLevel(int level)
        {
            if (levelText != null)
                levelText.text = "Lv. " + level;
        }

        public void SetCurrency(int amount)
        {
            if (currencyText != null)
                currencyText.text = amount + " VE";
        }

        public void SetXP(int current, int toNext)
        {
            if (xpText != null)
                xpText.text = "XP: " + current + "/" + toNext;
            if (xpFill != null && toNext > 0)
                xpFill.fillAmount = (float)current / toNext;
        }

        public void SetBackButtonVisible(bool visible)
        {
            if (backButton != null)
                backButton.SetActive(visible);
        }

        public void OnBackClicked()
        {
            if (SceneRouter.Instance != null)
                SceneRouter.Instance.ReturnToHub();
        }

        private void HandleGoldChanged(int newAmount)
        {
            SetCurrency(newAmount);
        }

        private void HandleXPChanged(int newXP, int xpToNext)
        {
            SetXP(newXP, xpToNext);
        }

        private void HandleLevelUp(int newLevel)
        {
            SetLevel(newLevel);
        }
    }
}

using UnityEngine;
using UnityEngine.UI;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Persistent top bar showing player level, VE currency, and XP bar.
    /// Creates its own canvas (sortingOrder 300) so it overlays scene content.
    /// Subscribes to GameEventBus for live updates.
    /// Designed to live on the SceneRouter (DontDestroyOnLoad) so it persists across scenes.
    /// </summary>
    public class TopBarController : MonoBehaviour
    {
        private Text levelText;
        private Text currencyText;
        private Text xpText;
        private Image xpFill;
        private GameObject backButton;

        private static readonly Color GoldColor = new Color(0.886f, 0.718f, 0.078f);
        private static readonly Color BarBg = new Color(0.06f, 0.06f, 0.12f);

        private void Start()
        {
            BuildUI();
            // Set initial values
            SetLevel(1);
            SetCurrency(500);
            SetXP(0, 100);
            SetBackButtonVisible(false);
        }

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

        private void BuildUI()
        {
            // Canvas
            var canvasGo = new GameObject("TopBarCanvas");
            canvasGo.transform.SetParent(transform, false);
            var canvas = canvasGo.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 300; // Above scene canvases (100) and bottom nav (200)
            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1280, 720);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGo.AddComponent<GraphicRaycaster>();

            // Bar background
            var barGo = new GameObject("TopBar");
            barGo.transform.SetParent(canvasGo.transform, false);
            var barImg = barGo.AddComponent<Image>();
            barImg.color = BarBg;
            var barRt = barImg.rectTransform;
            barRt.anchorMin = new Vector2(0, 1);
            barRt.anchorMax = new Vector2(1, 1);
            barRt.pivot = new Vector2(0.5f, 1);
            barRt.anchoredPosition = Vector2.zero;
            barRt.sizeDelta = new Vector2(0, 50);

            // Back button (left side, hidden by default)
            backButton = new GameObject("BackBtn");
            backButton.transform.SetParent(barGo.transform, false);
            var backImg = backButton.AddComponent<Image>();
            backImg.color = new Color(0.16f, 0.22f, 0.38f);
            var backRt = backImg.rectTransform;
            backRt.anchorMin = new Vector2(0, 0);
            backRt.anchorMax = new Vector2(0, 1);
            backRt.pivot = new Vector2(0, 0.5f);
            backRt.anchoredPosition = new Vector2(5, 0);
            backRt.sizeDelta = new Vector2(50, 0);
            var backBtn = backButton.AddComponent<Button>();
            backBtn.onClick.AddListener(OnBackClicked);
            var backTxtGo = new GameObject("Text");
            backTxtGo.transform.SetParent(backButton.transform, false);
            var backTxtRt = backTxtGo.AddComponent<RectTransform>();
            backTxtRt.anchorMin = Vector2.zero;
            backTxtRt.anchorMax = Vector2.one;
            backTxtRt.offsetMin = Vector2.zero;
            backTxtRt.offsetMax = Vector2.zero;
            var backTxt = backTxtGo.AddComponent<Text>();
            backTxt.text = "<";
            backTxt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            backTxt.fontSize = 22;
            backTxt.color = Color.white;
            backTxt.alignment = TextAnchor.MiddleCenter;
            backButton.SetActive(false);

            // Level (left area)
            levelText = CreateBarText(barGo.transform, "LevelText", "Lv. 1",
                new Vector2(0.05f, 0), new Vector2(0.2f, 1), 18, GoldColor);

            // Currency (center)
            currencyText = CreateBarText(barGo.transform, "CurrencyText", "500 VE",
                new Vector2(0.35f, 0), new Vector2(0.65f, 1), 18, Color.white);

            // XP bar (right area)
            xpText = CreateBarText(barGo.transform, "XPText", "XP: 0/100",
                new Vector2(0.7f, 0), new Vector2(0.95f, 0.55f), 12, new Color(0.7f, 0.7f, 0.8f));

            // XP fill bar
            var xpBarBg = new GameObject("XPBarBg");
            xpBarBg.transform.SetParent(barGo.transform, false);
            var xpBgImg = xpBarBg.AddComponent<Image>();
            xpBgImg.color = new Color(0.15f, 0.15f, 0.2f);
            var xpBgRt = xpBgImg.rectTransform;
            xpBgRt.anchorMin = new Vector2(0.7f, 0.15f);
            xpBgRt.anchorMax = new Vector2(0.95f, 0.4f);
            xpBgRt.offsetMin = Vector2.zero;
            xpBgRt.offsetMax = Vector2.zero;

            var xpFillGo = new GameObject("XPFill");
            xpFillGo.transform.SetParent(xpBarBg.transform, false);
            xpFill = xpFillGo.AddComponent<Image>();
            xpFill.color = new Color(0.2f, 0.7f, 0.3f);
            xpFill.type = Image.Type.Filled;
            xpFill.fillMethod = Image.FillMethod.Horizontal;
            xpFill.fillAmount = 0f;
            var xpFillRt = xpFill.rectTransform;
            xpFillRt.anchorMin = Vector2.zero;
            xpFillRt.anchorMax = Vector2.one;
            xpFillRt.offsetMin = Vector2.zero;
            xpFillRt.offsetMax = Vector2.zero;
        }

        private Text CreateBarText(Transform parent, string name, string text,
            Vector2 anchorMin, Vector2 anchorMax, int fontSize, Color color)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            var txt = go.AddComponent<Text>();
            txt.text = text;
            txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            txt.fontSize = fontSize;
            txt.color = color;
            txt.alignment = TextAnchor.MiddleCenter;
            return txt;
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

        private void HandleGoldChanged(int newAmount) => SetCurrency(newAmount);
        private void HandleXPChanged(int newXP, int xpToNext) => SetXP(newXP, xpToNext);
        private void HandleLevelUp(int newLevel) => SetLevel(newLevel);
    }
}

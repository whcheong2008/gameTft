using System;
using UnityEngine;
using UnityEngine.UI;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Modal confirmation dialog with dark overlay, message text, and Confirm/Cancel buttons.
    /// </summary>
    public class ConfirmDialogController : MonoBehaviour
    {
        public static ConfirmDialogController Instance { get; private set; }

        [SerializeField] private Canvas dialogCanvas;
        [SerializeField] private Text messageText;
        [SerializeField] private Button confirmButton;
        [SerializeField] private Button cancelButton;
        [SerializeField] private Image overlay;

        private Action onConfirmCallback;
        private Action onCancelCallback;
        private GameObject dialogRoot;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
            CreateDialog();
            dialogRoot.SetActive(false);
        }

        private void CreateDialog()
        {
            // Canvas
            var canvasGo = new GameObject("ConfirmDialogCanvas");
            canvasGo.transform.SetParent(transform);
            dialogCanvas = canvasGo.AddComponent<Canvas>();
            dialogCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
            dialogCanvas.sortingOrder = 9500;
            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1080, 1920);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGo.AddComponent<GraphicRaycaster>();
            dialogRoot = canvasGo;

            // Dark overlay
            var overlayGo = new GameObject("Overlay");
            overlayGo.transform.SetParent(canvasGo.transform, false);
            overlay = overlayGo.AddComponent<Image>();
            overlay.color = new Color(0, 0, 0, 0.7f);
            var oRt = overlay.rectTransform;
            oRt.anchorMin = Vector2.zero;
            oRt.anchorMax = Vector2.one;
            oRt.offsetMin = Vector2.zero;
            oRt.offsetMax = Vector2.zero;

            // Dialog panel
            var panelGo = new GameObject("Panel");
            panelGo.transform.SetParent(canvasGo.transform, false);
            var panelImg = panelGo.AddComponent<Image>();
            panelImg.color = new Color(0.15f, 0.15f, 0.22f, 1f);
            var pRt = panelImg.rectTransform;
            pRt.anchorMin = new Vector2(0.5f, 0.5f);
            pRt.anchorMax = new Vector2(0.5f, 0.5f);
            pRt.sizeDelta = new Vector2(800, 400);

            // Message text
            var textGo = new GameObject("Message");
            textGo.transform.SetParent(panelGo.transform, false);
            messageText = textGo.AddComponent<Text>();
            messageText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            messageText.fontSize = 32;
            messageText.color = Color.white;
            messageText.alignment = TextAnchor.MiddleCenter;
            var tRt = messageText.rectTransform;
            tRt.anchorMin = new Vector2(0.05f, 0.4f);
            tRt.anchorMax = new Vector2(0.95f, 0.9f);
            tRt.offsetMin = Vector2.zero;
            tRt.offsetMax = Vector2.zero;

            // Confirm button
            confirmButton = CreateButton(panelGo.transform, "Confirm",
                new Vector2(-140, -140), new Color(0.2f, 0.7f, 0.3f));
            confirmButton.onClick.AddListener(OnConfirmClicked);

            // Cancel button
            cancelButton = CreateButton(panelGo.transform, "Cancel",
                new Vector2(140, -140), new Color(0.7f, 0.2f, 0.2f));
            cancelButton.onClick.AddListener(OnCancelClicked);
        }

        private Button CreateButton(Transform parent, string label, Vector2 position, Color color)
        {
            var btnGo = new GameObject(label + "Button");
            btnGo.transform.SetParent(parent, false);

            var img = btnGo.AddComponent<Image>();
            img.color = color;
            var rt = img.rectTransform;
            rt.anchorMin = new Vector2(0.5f, 0.5f);
            rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.anchoredPosition = position;
            rt.sizeDelta = new Vector2(240, 80);

            var textGo = new GameObject("Text");
            textGo.transform.SetParent(btnGo.transform, false);
            var text = textGo.AddComponent<Text>();
            text.text = label;
            text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            text.fontSize = 28;
            text.color = Color.white;
            text.alignment = TextAnchor.MiddleCenter;
            text.fontStyle = FontStyle.Bold;
            var trt = text.rectTransform;
            trt.anchorMin = Vector2.zero;
            trt.anchorMax = Vector2.one;
            trt.offsetMin = Vector2.zero;
            trt.offsetMax = Vector2.zero;

            return btnGo.AddComponent<Button>();
        }

        public void Show(string message, Action onConfirm, Action onCancel = null)
        {
            onConfirmCallback = onConfirm;
            onCancelCallback = onCancel;

            if (messageText != null)
                messageText.text = message;

            dialogRoot.SetActive(true);
        }

        public void Hide()
        {
            dialogRoot.SetActive(false);
            onConfirmCallback = null;
            onCancelCallback = null;
        }

        private void OnConfirmClicked()
        {
            var cb = onConfirmCallback;
            Hide();
            cb?.Invoke();
        }

        private void OnCancelClicked()
        {
            var cb = onCancelCallback;
            Hide();
            cb?.Invoke();
        }
    }
}

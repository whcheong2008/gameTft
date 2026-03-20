using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Toast notification system. Queues messages, shows up to 3 at once with fade animations.
    /// </summary>
    public class ToastController : MonoBehaviour
    {
        public static ToastController Instance { get; private set; }

        [SerializeField] private Canvas toastCanvas;
        [SerializeField] private float defaultDuration = 3f;
        [SerializeField] private float fadeTime = 0.3f;

        private const int MaxVisible = 3;
        private readonly List<ToastEntry> activeToasts = new List<ToastEntry>();
        private readonly Queue<string> pendingQueue = new Queue<string>();

        private class ToastEntry
        {
            public GameObject Go;
            public CanvasGroup Group;
            public float TimeRemaining;
        }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);

            if (toastCanvas == null)
            {
                toastCanvas = GetComponentInChildren<Canvas>();
                if (toastCanvas == null)
                {
                    var canvasGo = new GameObject("ToastCanvas");
                    canvasGo.transform.SetParent(transform);
                    toastCanvas = canvasGo.AddComponent<Canvas>();
                    toastCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
                    toastCanvas.sortingOrder = 9000;
                    var scaler = canvasGo.AddComponent<CanvasScaler>();
                    scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                    scaler.referenceResolution = new Vector2(1080, 1920);
                    scaler.matchWidthOrHeight = 0.5f;
                }
            }

            GameEventBus.OnToastRequested += HandleToastRequested;
        }

        private void OnDestroy()
        {
            GameEventBus.OnToastRequested -= HandleToastRequested;
            if (Instance == this) Instance = null;
        }

        private void HandleToastRequested(string message)
        {
            ShowToast(message);
        }

        public void ShowToast(string message, float duration = 0f)
        {
            if (duration <= 0f) duration = defaultDuration;

            if (activeToasts.Count >= MaxVisible)
            {
                pendingQueue.Enqueue(message);
                return;
            }

            SpawnToast(message, duration);
        }

        private void SpawnToast(string message, float duration)
        {
            var toastGo = new GameObject("Toast");
            toastGo.transform.SetParent(toastCanvas.transform, false);

            var group = toastGo.AddComponent<CanvasGroup>();
            group.alpha = 0f;

            var bg = toastGo.AddComponent<Image>();
            bg.color = new Color(0.886f, 0.718f, 0.078f, 1f); // Gold #e2b714

            var rt = bg.rectTransform;
            rt.anchorMin = new Vector2(0.5f, 1f);
            rt.anchorMax = new Vector2(0.5f, 1f);
            rt.pivot = new Vector2(0.5f, 1f);
            float yOffset = -40f - activeToasts.Count * 80f;
            rt.anchoredPosition = new Vector2(0, yOffset);
            rt.sizeDelta = new Vector2(800, 70);

            var textGo = new GameObject("Text");
            textGo.transform.SetParent(toastGo.transform, false);
            var text = textGo.AddComponent<Text>();
            text.text = message;
            text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            text.fontSize = 28;
            text.color = new Color(0.1f, 0.1f, 0.18f); // Dark text
            text.alignment = TextAnchor.MiddleCenter;
            text.fontStyle = FontStyle.Bold;

            var textRt = text.rectTransform;
            textRt.anchorMin = Vector2.zero;
            textRt.anchorMax = Vector2.one;
            textRt.offsetMin = new Vector2(16, 0);
            textRt.offsetMax = new Vector2(-16, 0);

            var entry = new ToastEntry
            {
                Go = toastGo,
                Group = group,
                TimeRemaining = duration
            };
            activeToasts.Add(entry);

            StartCoroutine(AnimateToast(entry));
        }

        private IEnumerator AnimateToast(ToastEntry entry)
        {
            // Fade in
            float elapsed = 0f;
            while (elapsed < fadeTime)
            {
                elapsed += Time.unscaledDeltaTime;
                entry.Group.alpha = Mathf.Clamp01(elapsed / fadeTime);
                yield return null;
            }
            entry.Group.alpha = 1f;

            // Wait
            while (entry.TimeRemaining > 0f)
            {
                entry.TimeRemaining -= Time.unscaledDeltaTime;
                yield return null;
            }

            // Fade out
            elapsed = 0f;
            while (elapsed < fadeTime)
            {
                elapsed += Time.unscaledDeltaTime;
                entry.Group.alpha = 1f - Mathf.Clamp01(elapsed / fadeTime);
                yield return null;
            }

            activeToasts.Remove(entry);
            Destroy(entry.Go);

            // Show next pending if any
            if (pendingQueue.Count > 0)
            {
                SpawnToast(pendingQueue.Dequeue(), defaultDuration);
            }
        }
    }
}

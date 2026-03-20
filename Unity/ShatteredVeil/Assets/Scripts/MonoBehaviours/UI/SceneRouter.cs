using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Manages scene transitions with fade-to-black. Singleton on a persistent GameObject.
    /// </summary>
    public class SceneRouter : MonoBehaviour
    {
        public static SceneRouter Instance { get; private set; }

        [SerializeField] private float fadeDuration = 0.3f;

        private Canvas fadeCanvas;
        private Image fadeImage;
        private string currentScene;
        private bool isTransitioning;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
            CreateFadeOverlay();
        }

        private void CreateFadeOverlay()
        {
            var fadeGo = new GameObject("FadeOverlay");
            fadeGo.transform.SetParent(transform);

            fadeCanvas = fadeGo.AddComponent<Canvas>();
            fadeCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
            fadeCanvas.sortingOrder = 9999;

            fadeGo.AddComponent<CanvasScaler>();
            fadeGo.AddComponent<GraphicRaycaster>();

            var imgGo = new GameObject("FadeImage");
            imgGo.transform.SetParent(fadeGo.transform, false);

            fadeImage = imgGo.AddComponent<Image>();
            fadeImage.color = new Color(0, 0, 0, 0);
            fadeImage.raycastTarget = false;

            var rt = fadeImage.rectTransform;
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;

            fadeCanvas.gameObject.SetActive(false);
        }

        public string CurrentScene => currentScene;

        /// <summary>
        /// Set the current scene name (used by GameBootstrap for the initial direct load).
        /// </summary>
        public void SetCurrentScene(string sceneName)
        {
            currentScene = sceneName;
        }

        public void LoadScene(string sceneName)
        {
            if (isTransitioning) return;
            StartCoroutine(TransitionTo(sceneName));
        }

        /// <summary>
        /// Unload a scene by name. Safe to call from MonoBehaviours living in that scene
        /// because this coroutine runs on the DontDestroyOnLoad SceneRouter.
        /// </summary>
        public void UnloadScene(string sceneName)
        {
            StartCoroutine(UnloadSceneCoroutine(sceneName));
        }

        private IEnumerator UnloadSceneCoroutine(string sceneName)
        {
            var scene = SceneManager.GetSceneByName(sceneName);
            if (scene.isLoaded)
            {
                yield return SceneManager.UnloadSceneAsync(scene);
                Debug.Log("[SceneRouter] Unloaded scene: " + sceneName);
            }
        }

        public void ReturnToHub()
        {
            LoadScene("Hub");
        }

        private IEnumerator TransitionTo(string sceneName)
        {
            isTransitioning = true;

            // Fade out
            yield return StartCoroutine(Fade(0f, 1f));

            // Unload current scene if any
            if (!string.IsNullOrEmpty(currentScene))
            {
                var unload = SceneManager.UnloadSceneAsync(currentScene);
                if (unload != null)
                    yield return unload;
            }

            // Load new scene additively
            yield return SceneManager.LoadSceneAsync(sceneName, LoadSceneMode.Additive);
            currentScene = sceneName;

            // Fade in
            yield return StartCoroutine(Fade(1f, 0f));

            isTransitioning = false;
        }

        private IEnumerator Fade(float from, float to)
        {
            fadeCanvas.gameObject.SetActive(true);
            fadeImage.raycastTarget = true;

            float elapsed = 0f;
            while (elapsed < fadeDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = Mathf.Clamp01(elapsed / fadeDuration);
                fadeImage.color = new Color(0, 0, 0, Mathf.Lerp(from, to, t));
                yield return null;
            }

            fadeImage.color = new Color(0, 0, 0, to);

            if (to <= 0f)
            {
                fadeImage.raycastTarget = false;
                fadeCanvas.gameObject.SetActive(false);
            }
        }
    }
}

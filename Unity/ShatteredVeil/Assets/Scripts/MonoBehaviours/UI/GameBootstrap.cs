using System.Collections;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem.UI;
using UnityEngine.SceneManagement;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Boot scene entry point. Initializes systems, attaches persistent UI
    /// (TopBar + BottomNav) to SceneRouter, then transitions to Hub.
    /// </summary>
    public class GameBootstrap : MonoBehaviour
    {
        private void Start()
        {
            // 1. GameEventBus is static, no init needed.
            GameEventBus.ClearAll();

            // 2. Ensure SceneRouter exists
            if (SceneRouter.Instance == null)
            {
                Debug.LogWarning("[GameBootstrap] SceneRouter not found. Ensure SceneRouter is in Boot scene.");
                return;
            }

            // 3. Attach persistent UI to SceneRouter (survives scene loads)
            AttachPersistentUI();

            // 4. Load Hub scene
            StartCoroutine(LoadHubDirect());
        }

        private void AttachPersistentUI()
        {
            var router = SceneRouter.Instance;

            // TopBar — persistent across all scenes
            if (router.GetComponent<TopBarController>() == null)
            {
                router.gameObject.AddComponent<TopBarController>();
                Debug.Log("[GameBootstrap] TopBarController attached to SceneRouter");
            }

            // BottomNav — persistent across all scenes
            if (router.GetComponent<BottomNavController>() == null)
            {
                router.gameObject.AddComponent<BottomNavController>();
                Debug.Log("[GameBootstrap] BottomNavController attached to SceneRouter");
            }

            // Ensure there's an EventSystem (it should exist in the scene, but just in case)
            if (EventSystem.current == null)
            {
                var esGo = new GameObject("EventSystem");
                DontDestroyOnLoad(esGo);
                esGo.AddComponent<EventSystem>();
                esGo.AddComponent<InputSystemUIInputModule>();
                Debug.Log("[GameBootstrap] Created persistent EventSystem");
            }
        }

        private IEnumerator LoadHubDirect()
        {
            var op = SceneManager.LoadSceneAsync("Hub", LoadSceneMode.Additive);
            if (op == null)
            {
                Debug.LogError("[GameBootstrap] Failed to start loading Hub scene");
                yield break;
            }
            yield return op;

            SceneRouter.Instance.SetCurrentScene("Hub");
            SceneRouter.Instance.UnloadScene("Boot");
        }
    }
}

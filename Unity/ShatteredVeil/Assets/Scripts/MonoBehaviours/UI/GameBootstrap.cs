using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Boot scene entry point. Initializes systems and transitions to Hub.
    /// Attach to a GameObject in Boot.unity.
    /// </summary>
    public class GameBootstrap : MonoBehaviour
    {
        private void Start()
        {
            // 1. GameEventBus is static, no init needed.
            GameEventBus.ClearAll();

            // 2. Ensure SceneRouter exists (it initializes itself in Awake)
            if (SceneRouter.Instance == null)
            {
                Debug.LogWarning("[GameBootstrap] SceneRouter not found. Ensure SceneRouter is in Boot scene.");
                return;
            }

            // 3. Load Hub scene directly (no fade needed on initial boot)
            StartCoroutine(LoadHubDirect());
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

            // Tell SceneRouter what the current scene is so future transitions work.
            // Then ask SceneRouter to unload Boot — we can't do it ourselves because
            // this MonoBehaviour lives in Boot and would be destroyed mid-coroutine.
            SceneRouter.Instance.SetCurrentScene("Hub");
            SceneRouter.Instance.UnloadScene("Boot");
        }
    }
}

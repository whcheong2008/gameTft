using System.Collections;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem.UI;
using UnityEngine.SceneManagement;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Boot scene entry point. Creates all persistent singletons,
    /// loads save data, initializes GameManager, then transitions to Hub.
    /// </summary>
    public class GameBootstrap : MonoBehaviour
    {
        private void Start()
        {
            GameEventBus.ClearAll();

            if (SceneRouter.Instance == null)
            {
                Debug.LogWarning("[GameBootstrap] SceneRouter not found.");
                return;
            }

            // Create persistent systems on SceneRouter's GameObject
            var routerGo = SceneRouter.Instance.gameObject;

            // SaveManager
            if (SaveManager.Instance == null)
            {
                routerGo.AddComponent<SaveManager>();
                Debug.Log("[GameBootstrap] SaveManager created");
            }

            // GameManager
            if (GameManager.Instance == null)
            {
                routerGo.AddComponent<GameManager>();
                Debug.Log("[GameBootstrap] GameManager created");
            }

            // TopBar
            if (routerGo.GetComponent<TopBarController>() == null)
            {
                routerGo.AddComponent<TopBarController>();
                Debug.Log("[GameBootstrap] TopBarController created");
            }

            // BottomNav
            if (routerGo.GetComponent<BottomNavController>() == null)
            {
                routerGo.AddComponent<BottomNavController>();
                Debug.Log("[GameBootstrap] BottomNavController created");
            }

            // ConfirmDialog
            if (ConfirmDialogController.Instance == null)
            {
                routerGo.AddComponent<ConfirmDialogController>();
                Debug.Log("[GameBootstrap] ConfirmDialogController created");
            }

            // Ensure EventSystem exists
            if (EventSystem.current == null)
            {
                var esGo = new GameObject("EventSystem");
                DontDestroyOnLoad(esGo);
                esGo.AddComponent<EventSystem>();
                esGo.AddComponent<InputSystemUIInputModule>();
            }

            // Load save and initialize GameManager
            var save = SaveManager.Instance.LoadOrCreateNew();
            GameManager.Instance.InitializeFromSave(save);

            // Load Hub
            StartCoroutine(LoadHubDirect());
        }

        private IEnumerator LoadHubDirect()
        {
            var op = SceneManager.LoadSceneAsync("Hub", LoadSceneMode.Additive);
            if (op == null)
            {
                Debug.LogError("[GameBootstrap] Failed to load Hub scene");
                yield break;
            }
            yield return op;

            SceneRouter.Instance.SetCurrentScene("Hub");
            SceneRouter.Instance.UnloadScene("Boot");
        }
    }
}

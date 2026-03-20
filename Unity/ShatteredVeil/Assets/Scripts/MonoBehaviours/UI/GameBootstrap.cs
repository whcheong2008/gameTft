using UnityEngine;

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
            // 1. Initialize SaveManager (load or create save)
            // SaveManager is initialized on its own (Prompt 44 — pending).
            // For now, just ensure it exists if present.

            // 2. GameEventBus is static, no init needed.
            GameEventBus.ClearAll();

            // 3. Transition to Hub scene
            if (SceneRouter.Instance != null)
            {
                SceneRouter.Instance.LoadScene("Hub");
            }
            else
            {
                Debug.LogWarning("[GameBootstrap] SceneRouter not found. Ensure SceneRouter is in Boot scene.");
            }
        }
    }
}

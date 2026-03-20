using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;
using ShatteredVeil.Core.Story;

namespace ShatteredVeil.Mono.UI.Story
{
    public class CombatDialogueController : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private GameObject _dialogueBar;
        [SerializeField] private TextMeshProUGUI _dialogueText;

        [Header("Settings")]
        [SerializeField] private float _displayDuration = 3f;
        [SerializeField] private float _fadeDuration = 0.5f;

        private readonly Queue<StoryBeat> _queue = new Queue<StoryBeat>();
        private readonly Dictionary<string, List<StoryBeat>> _triggerMap =
            new Dictionary<string, List<StoryBeat>>();
        private bool _isDisplaying;
        private CanvasGroup _canvasGroup;

        private void Awake()
        {
            if (_dialogueBar != null)
            {
                _canvasGroup = _dialogueBar.GetComponent<CanvasGroup>();
                if (_canvasGroup == null)
                    _canvasGroup = _dialogueBar.AddComponent<CanvasGroup>();
                _dialogueBar.SetActive(false);
            }
        }

        public void RegisterBeats(List<StoryBeat> combatBeats)
        {
            _triggerMap.Clear();
            if (combatBeats == null) return;

            foreach (var beat in combatBeats)
            {
                if (beat.Type != BeatType.CombatDialogue) continue;
                var trigger = beat.TriggerCondition ?? "turn_1";
                if (!_triggerMap.ContainsKey(trigger))
                    _triggerMap[trigger] = new List<StoryBeat>();
                _triggerMap[trigger].Add(beat);
            }
        }

        public void OnCombatTrigger(string trigger)
        {
            if (!_triggerMap.TryGetValue(trigger, out var beats)) return;

            foreach (var beat in beats)
                _queue.Enqueue(beat);

            if (!_isDisplaying)
                StartCoroutine(ProcessQueue());
        }

        public void Clear()
        {
            _queue.Clear();
            _triggerMap.Clear();
            _isDisplaying = false;
            if (_dialogueBar != null)
                _dialogueBar.SetActive(false);
        }

        private IEnumerator ProcessQueue()
        {
            _isDisplaying = true;

            while (_queue.Count > 0)
            {
                var beat = _queue.Dequeue();
                yield return StartCoroutine(DisplayBeat(beat));
            }

            _isDisplaying = false;
        }

        private IEnumerator DisplayBeat(StoryBeat beat)
        {
            if (_dialogueBar != null)
                _dialogueBar.SetActive(true);

            var character = CharacterData.Get(beat.CharacterId);
            string name = character != null ? character.DisplayName : beat.CharacterId ?? "";
            string display = string.IsNullOrEmpty(name)
                ? beat.Text
                : $"[{name}]: \"{beat.Text}\"";

            if (_dialogueText != null)
                _dialogueText.text = display;

            if (_canvasGroup != null)
                _canvasGroup.alpha = 1f;

            yield return new WaitForSeconds(_displayDuration);

            // Fade out
            float elapsed = 0f;
            while (elapsed < _fadeDuration)
            {
                elapsed += Time.deltaTime;
                if (_canvasGroup != null)
                    _canvasGroup.alpha = 1f - (elapsed / _fadeDuration);
                yield return null;
            }

            if (_dialogueBar != null)
                _dialogueBar.SetActive(false);
        }
    }
}

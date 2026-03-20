using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ShatteredVeil.Core.Story;

namespace ShatteredVeil.Mono.UI.Story
{
    public class DialogueBoxController : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private GameObject _dialoguePanel;
        [SerializeField] private Image _portraitImage;
        [SerializeField] private TextMeshProUGUI _nameText;
        [SerializeField] private TextMeshProUGUI _dialogueText;
        [SerializeField] private GameObject _advanceIndicator;

        [Header("Settings")]
        [SerializeField] private float _charsPerSecond = 30f;
        [SerializeField] private Color _defaultPortraitColor = Color.gray;

        private string _fullText;
        private bool _isTyping;
        private bool _skipRequested;
        private Action _onComplete;
        private Coroutine _typewriterCoroutine;

        public bool IsActive => _dialoguePanel != null && _dialoguePanel.activeSelf;

        public void Show(StoryBeat beat, Action onComplete)
        {
            _onComplete = onComplete;
            _fullText = beat.Text ?? "";

            if (_dialoguePanel != null)
                _dialoguePanel.SetActive(true);

            var character = CharacterData.Get(beat.CharacterId);
            if (_nameText != null)
                _nameText.text = character != null ? character.DisplayName : beat.CharacterId ?? "";

            UpdatePortrait(beat.CharacterId, beat.Expression ?? "neutral");

            if (_advanceIndicator != null)
                _advanceIndicator.SetActive(false);

            if (_typewriterCoroutine != null)
                StopCoroutine(_typewriterCoroutine);

            _typewriterCoroutine = StartCoroutine(TypewriterEffect());
        }

        public void Hide()
        {
            if (_dialoguePanel != null)
                _dialoguePanel.SetActive(false);
            if (_typewriterCoroutine != null)
            {
                StopCoroutine(_typewriterCoroutine);
                _typewriterCoroutine = null;
            }
            _isTyping = false;
        }

        public void OnTap()
        {
            if (_isTyping)
            {
                _skipRequested = true;
            }
            else
            {
                Hide();
                _onComplete?.Invoke();
            }
        }

        public void UpdateExpression(string characterId, string expression)
        {
            UpdatePortrait(characterId, expression);
        }

        private void UpdatePortrait(string characterId, string expression)
        {
            if (_portraitImage == null) return;

            var character = CharacterData.Get(characterId);
            if (character == null)
            {
                _portraitImage.color = _defaultPortraitColor;
                return;
            }

            _portraitImage.color = GetElementColor(character.Element, expression);
        }

        private Color GetElementColor(string element, string expression)
        {
            float brightness = expression == "angry" ? 0.8f :
                               expression == "sad" ? 0.5f :
                               expression == "happy" ? 1.0f :
                               expression == "shocked" ? 0.9f :
                               expression == "determined" ? 0.85f : 0.7f;

            switch (element?.ToLower())
            {
                case "fire": return new Color(brightness, brightness * 0.3f, 0.1f);
                case "water": return new Color(0.1f, brightness * 0.5f, brightness);
                case "earth": return new Color(brightness * 0.6f, brightness * 0.4f, 0.1f);
                case "wind": return new Color(0.4f, brightness, 0.4f);
                case "lightning": return new Color(brightness, brightness, 0.2f);
                case "force": return new Color(brightness * 0.6f, 0.2f, brightness);
                default: return new Color(brightness * 0.5f, brightness * 0.5f, brightness * 0.5f);
            }
        }

        private IEnumerator TypewriterEffect()
        {
            _isTyping = true;
            _skipRequested = false;

            if (_dialogueText != null)
                _dialogueText.text = "";

            float delay = _charsPerSecond > 0 ? 1f / _charsPerSecond : 0f;

            for (int i = 0; i < _fullText.Length; i++)
            {
                if (_skipRequested)
                {
                    if (_dialogueText != null)
                        _dialogueText.text = _fullText;
                    break;
                }

                if (_dialogueText != null)
                    _dialogueText.text = _fullText.Substring(0, i + 1);

                yield return new WaitForSeconds(delay);
            }

            _isTyping = false;

            if (_advanceIndicator != null)
                _advanceIndicator.SetActive(true);
        }
    }
}

using System;
using System.Collections;
using UnityEngine;
using TMPro;

namespace ShatteredVeil.Mono.UI.Story
{
    public class NarrationBoxController : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private GameObject _narrationPanel;
        [SerializeField] private TextMeshProUGUI _narrationText;
        [SerializeField] private GameObject _advanceIndicator;

        [Header("Settings")]
        [SerializeField] private float _charsPerSecond = 25f;

        private string _fullText;
        private bool _isTyping;
        private bool _skipRequested;
        private Action _onComplete;
        private Coroutine _typewriterCoroutine;

        public bool IsActive => _narrationPanel != null && _narrationPanel.activeSelf;

        public void Show(string text, Action onComplete)
        {
            _onComplete = onComplete;
            _fullText = text ?? "";

            if (_narrationPanel != null)
                _narrationPanel.SetActive(true);

            if (_advanceIndicator != null)
                _advanceIndicator.SetActive(false);

            if (_typewriterCoroutine != null)
                StopCoroutine(_typewriterCoroutine);

            _typewriterCoroutine = StartCoroutine(TypewriterEffect());
        }

        public void Hide()
        {
            if (_narrationPanel != null)
                _narrationPanel.SetActive(false);
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

        private IEnumerator TypewriterEffect()
        {
            _isTyping = true;
            _skipRequested = false;

            if (_narrationText != null)
                _narrationText.text = "";

            float delay = _charsPerSecond > 0 ? 1f / _charsPerSecond : 0f;

            for (int i = 0; i < _fullText.Length; i++)
            {
                if (_skipRequested)
                {
                    if (_narrationText != null)
                        _narrationText.text = _fullText;
                    break;
                }

                if (_narrationText != null)
                    _narrationText.text = _fullText.Substring(0, i + 1);

                yield return new WaitForSeconds(delay);
            }

            _isTyping = false;

            if (_advanceIndicator != null)
                _advanceIndicator.SetActive(true);
        }
    }
}

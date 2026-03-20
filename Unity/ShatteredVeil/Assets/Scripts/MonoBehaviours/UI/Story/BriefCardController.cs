using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace ShatteredVeil.Mono.UI.Story
{
    public class BriefCardController : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private GameObject _cardPanel;
        [SerializeField] private TextMeshProUGUI _cardText;
        [SerializeField] private Button _continueButton;

        [Header("Settings")]
        [SerializeField] private float _autoAdvanceDelay = 5f;

        private Action _onComplete;
        private Coroutine _autoAdvanceCoroutine;

        public bool IsActive => _cardPanel != null && _cardPanel.activeSelf;

        public void Show(string text, Action onComplete)
        {
            _onComplete = onComplete;

            if (_cardPanel != null)
                _cardPanel.SetActive(true);

            if (_cardText != null)
                _cardText.text = text ?? "";

            if (_continueButton != null)
            {
                _continueButton.onClick.RemoveAllListeners();
                _continueButton.onClick.AddListener(Advance);
            }

            if (_autoAdvanceCoroutine != null)
                StopCoroutine(_autoAdvanceCoroutine);

            _autoAdvanceCoroutine = StartCoroutine(AutoAdvance());
        }

        public void Hide()
        {
            if (_cardPanel != null)
                _cardPanel.SetActive(false);
            if (_autoAdvanceCoroutine != null)
            {
                StopCoroutine(_autoAdvanceCoroutine);
                _autoAdvanceCoroutine = null;
            }
        }

        public void OnTap()
        {
            Advance();
        }

        private void Advance()
        {
            Hide();
            _onComplete?.Invoke();
        }

        private IEnumerator AutoAdvance()
        {
            yield return new WaitForSeconds(_autoAdvanceDelay);
            Advance();
        }
    }
}

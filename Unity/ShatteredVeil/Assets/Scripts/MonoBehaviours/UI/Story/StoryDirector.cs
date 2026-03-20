using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using ShatteredVeil.Core.Story;

namespace ShatteredVeil.Mono.UI.Story
{
    public class StoryDirector : MonoBehaviour
    {
        [Header("Controllers")]
        [SerializeField] private DialogueBoxController _dialogueBox;
        [SerializeField] private NarrationBoxController _narrationBox;
        [SerializeField] private BriefCardController _briefCard;
        [SerializeField] private CombatDialogueController _combatDialogue;
        [SerializeField] private ScreenEffectController _screenEffect;

        [Header("Settings")]
        [SerializeField] private float _environmentDisplayDuration = 2f;

        private bool _isPlaying;
        public bool IsPlaying => _isPlaying;

        public void PlayPreMission(StoryScript script, Action onComplete)
        {
            if (script == null || script.PreMission == null || script.PreMission.Count == 0)
            {
                onComplete?.Invoke();
                return;
            }

            StartCoroutine(PlaySequence(script.PreMission, onComplete, script.EnvironmentDescription));
        }

        public void PlayPostMission(StoryScript script, Action onComplete)
        {
            if (script == null || script.PostMission == null || script.PostMission.Count == 0)
            {
                onComplete?.Invoke();
                return;
            }

            StartCoroutine(PlaySequence(script.PostMission, onComplete));
        }

        public void PlayDefeatDialogue(StoryScript script, Action onComplete)
        {
            if (script == null || script.DefeatDialogue == null || script.DefeatDialogue.Count == 0)
            {
                onComplete?.Invoke();
                return;
            }

            StartCoroutine(PlaySequence(script.DefeatDialogue, onComplete));
        }

        public void RegisterCombatDialogue(StoryScript script, CombatDialogueController controller = null)
        {
            var target = controller != null ? controller : _combatDialogue;
            if (target == null || script == null) return;
            target.RegisterBeats(script.CombatDialogue);
        }

        private IEnumerator PlaySequence(List<StoryBeat> beats, Action onComplete, string envDesc = null)
        {
            _isPlaying = true;

            if (!string.IsNullOrEmpty(envDesc) && _narrationBox != null)
            {
                _narrationBox.Show(envDesc, null);
                yield return new WaitForSeconds(_environmentDisplayDuration);
                _narrationBox.Hide();
            }

            foreach (var beat in beats)
            {
                yield return StartCoroutine(HandleBeat(beat));
            }

            _isPlaying = false;
            onComplete?.Invoke();
        }

        private IEnumerator HandleBeat(StoryBeat beat)
        {
            switch (beat.Type)
            {
                case BeatType.Dialogue:
                    yield return HandleDialogue(beat);
                    break;

                case BeatType.Narration:
                    yield return HandleNarration(beat);
                    break;

                case BeatType.BriefCard:
                    yield return HandleBriefCard(beat);
                    break;

                case BeatType.EnvironmentDesc:
                    yield return HandleNarration(beat);
                    break;

                case BeatType.CutsceneMarker:
                    yield return HandleCutsceneMarker(beat);
                    break;

                case BeatType.SetExpression:
                    HandleSetExpression(beat);
                    break;

                case BeatType.Pause:
                    yield return new WaitForSeconds(beat.Duration);
                    break;

                case BeatType.ScreenEffect:
                    yield return HandleScreenEffect(beat);
                    break;

                case BeatType.CombatDialogue:
                    // Queued for combat, not played in sequence
                    break;

                case BeatType.Choice:
                    // Future stub — treat as narration for now
                    yield return HandleNarration(beat);
                    break;
            }
        }

        private IEnumerator HandleDialogue(StoryBeat beat)
        {
            if (_dialogueBox == null) yield break;

            bool done = false;
            _dialogueBox.Show(beat, () => done = true);
            while (!done) yield return null;
        }

        private IEnumerator HandleNarration(StoryBeat beat)
        {
            if (_narrationBox == null) yield break;

            bool done = false;
            _narrationBox.Show(beat.Text, () => done = true);
            while (!done) yield return null;
        }

        private IEnumerator HandleBriefCard(StoryBeat beat)
        {
            if (_briefCard == null) yield break;

            bool done = false;
            _briefCard.Show(beat.Text, () => done = true);
            while (!done) yield return null;
        }

        private IEnumerator HandleCutsceneMarker(StoryBeat beat)
        {
            if (_briefCard == null) yield break;

            string text = $"[Cutscene: {beat.Text ?? "Scene"}]";
            bool done = false;
            _briefCard.Show(text, () => done = true);
            while (!done) yield return null;
        }

        private void HandleSetExpression(StoryBeat beat)
        {
            if (_dialogueBox != null)
                _dialogueBox.UpdateExpression(beat.CharacterId, beat.Expression);
        }

        private IEnumerator HandleScreenEffect(StoryBeat beat)
        {
            if (_screenEffect == null) yield break;

            bool done = false;
            _screenEffect.PlayEffect(beat.EffectType, beat.Duration, () => done = true);
            while (!done) yield return null;
        }
    }
}

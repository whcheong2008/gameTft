namespace ShatteredVeil.Core.Story
{
    public enum BeatType
    {
        Dialogue,
        Narration,
        BriefCard,
        EnvironmentDesc,
        CombatDialogue,
        Choice,
        CutsceneMarker,
        SetExpression,
        Pause,
        ScreenEffect
    }

    public class StoryBeat
    {
        public BeatType Type;
        public string CharacterId;
        public string Text;
        public string Expression;
        public float Duration;
        public string EffectType;
        public string TriggerCondition;
        public string[] Choices;

        public static StoryBeat Dialogue(string characterId, string text, string expression = "neutral")
        {
            return new StoryBeat
            {
                Type = BeatType.Dialogue,
                CharacterId = characterId,
                Text = text,
                Expression = expression
            };
        }

        public static StoryBeat Narration(string text)
        {
            return new StoryBeat
            {
                Type = BeatType.Narration,
                Text = text
            };
        }

        public static StoryBeat BriefCard(string text)
        {
            return new StoryBeat
            {
                Type = BeatType.BriefCard,
                Text = text
            };
        }

        public static StoryBeat Environment(string text)
        {
            return new StoryBeat
            {
                Type = BeatType.EnvironmentDesc,
                Text = text
            };
        }

        public static StoryBeat Combat(string characterId, string text, string trigger)
        {
            return new StoryBeat
            {
                Type = BeatType.CombatDialogue,
                CharacterId = characterId,
                Text = text,
                TriggerCondition = trigger
            };
        }

        public static StoryBeat Cutscene(string text)
        {
            return new StoryBeat
            {
                Type = BeatType.CutsceneMarker,
                Text = text
            };
        }

        public static StoryBeat Expression(string characterId, string expression)
        {
            return new StoryBeat
            {
                Type = BeatType.SetExpression,
                CharacterId = characterId,
                Expression = expression
            };
        }

        public static StoryBeat PauseBeat(float duration)
        {
            return new StoryBeat
            {
                Type = BeatType.Pause,
                Duration = duration
            };
        }

        public static StoryBeat Effect(string effectType, float duration = 1f)
        {
            return new StoryBeat
            {
                Type = BeatType.ScreenEffect,
                EffectType = effectType,
                Duration = duration
            };
        }
    }
}

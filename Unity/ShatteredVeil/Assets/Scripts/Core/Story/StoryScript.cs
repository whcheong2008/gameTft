using System.Collections.Generic;

namespace ShatteredVeil.Core.Story
{
    public class StoryScript
    {
        public string StageId;
        public string StageName;
        public string StageType;
        public string EnvironmentDescription;
        public List<StoryBeat> PreMission = new List<StoryBeat>();
        public List<StoryBeat> PostMission = new List<StoryBeat>();
        public List<StoryBeat> CombatDialogue = new List<StoryBeat>();
        public List<StoryBeat> DefeatDialogue = new List<StoryBeat>();
        public bool HasCutscene;

        public List<StoryBeat> GetCombatDialogueForTrigger(string trigger)
        {
            var results = new List<StoryBeat>();
            foreach (var beat in CombatDialogue)
            {
                if (beat.TriggerCondition == trigger)
                    results.Add(beat);
            }
            return results;
        }
    }
}

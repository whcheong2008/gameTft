using System.Collections.Generic;

namespace ShatteredVeil.Core.Story
{
    public static class StoryCatalog
    {
        private static readonly Dictionary<string, StoryScript> _scripts =
            new Dictionary<string, StoryScript>();

        public static StoryScript GetScript(string stageId) =>
            _scripts.TryGetValue(stageId, out var s) ? s : null;

        public static void Register(string stageId, StoryScript script) =>
            _scripts[stageId] = script;

        public static bool HasStory(string stageId) => _scripts.ContainsKey(stageId);

        public static int Count => _scripts.Count;

        public static void Clear() => _scripts.Clear();

        public static IEnumerable<string> AllStageIds => _scripts.Keys;
    }
}

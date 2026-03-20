using System.Collections.Generic;
using NUnit.Framework;
using ShatteredVeil.Core;

namespace ShatteredVeil.Tests.EditMode.Assets
{
    [TestFixture]
    public class AssetManifestTests
    {
        [Test]
        public void Manifest_Contains132UnitPortraitEntries()
        {
            int count = 0;
            foreach (var entry in AssetManifest.AllAssets)
                if (entry.Category == AssetCategory.UnitPortrait) count++;
            Assert.AreEqual(132, count, "Expected 132 unit portrait entries");
        }

        [Test]
        public void Manifest_Contains48CharacterPortraitEntries()
        {
            int count = 0;
            foreach (var entry in AssetManifest.AllAssets)
                if (entry.Category == AssetCategory.CharacterPortrait) count++;
            Assert.AreEqual(48, count, "Expected 48 character portrait entries (8 chars x 6 expressions)");
        }

        [Test]
        public void Manifest_Contains8BossEntries()
        {
            int count = 0;
            foreach (var entry in AssetManifest.AllAssets)
                if (entry.Category == AssetCategory.BossSprite) count++;
            Assert.AreEqual(8, count, "Expected 8 boss sprite entries");
        }

        [Test]
        public void Manifest_AllPathsAreUnique()
        {
            var paths = new HashSet<string>();
            var duplicates = new List<string>();
            foreach (var entry in AssetManifest.AllAssets)
            {
                if (!paths.Add(entry.Path))
                    duplicates.Add(entry.Path);
            }
            Assert.IsEmpty(duplicates,
                "Duplicate paths found: " + string.Join(", ", duplicates));
        }

        [Test]
        public void Manifest_AllIdsAreUnique()
        {
            var ids = new HashSet<string>();
            var duplicates = new List<string>();
            foreach (var entry in AssetManifest.AllAssets)
            {
                if (!ids.Add(entry.Id))
                    duplicates.Add(entry.Id);
            }
            Assert.IsEmpty(duplicates,
                "Duplicate IDs found: " + string.Join(", ", duplicates));
        }

        [Test]
        public void Manifest_AllEntriesHaveNonEmptyId()
        {
            foreach (var entry in AssetManifest.AllAssets)
            {
                Assert.IsNotEmpty(entry.Id, "Entry has empty Id");
            }
        }

        [Test]
        public void Manifest_AllEntriesHaveNonEmptyPath()
        {
            foreach (var entry in AssetManifest.AllAssets)
            {
                Assert.IsNotEmpty(entry.Path, "Entry {0} has empty Path", entry.Id);
            }
        }

        [Test]
        public void Manifest_UnitPortraitsHaveSize256()
        {
            foreach (var entry in AssetManifest.AllAssets)
            {
                if (entry.Category == AssetCategory.UnitPortrait)
                    Assert.AreEqual(256, entry.TargetSize, $"Unit {entry.Id} should have size 256");
            }
        }

        [Test]
        public void Manifest_CharacterPortraitsHaveSize512()
        {
            foreach (var entry in AssetManifest.AllAssets)
            {
                if (entry.Category == AssetCategory.CharacterPortrait)
                    Assert.AreEqual(512, entry.TargetSize, $"Character {entry.Id} should have size 512");
            }
        }

        [Test]
        public void Manifest_HasRealAsset_DefaultsFalse()
        {
            foreach (var entry in AssetManifest.AllAssets)
            {
                Assert.IsFalse(entry.HasRealAsset,
                    $"Entry {entry.Id} should default to HasRealAsset=false");
            }
        }

        [Test]
        public void Manifest_GetByCategory_ReturnsCorrectEntries()
        {
            var bosses = AssetManifest.GetByCategory(AssetCategory.BossSprite);
            Assert.AreEqual(8, bosses.Length);

            var units = AssetManifest.GetByCategory(AssetCategory.UnitPortrait);
            Assert.AreEqual(132, units.Length);
        }

        [Test]
        public void Manifest_GetById_ReturnsEntry()
        {
            var entry = AssetManifest.GetById("unit_flame_warrior");
            Assert.IsNotNull(entry);
            Assert.AreEqual("unit_flame_warrior", entry.Id);
            Assert.AreEqual(AssetCategory.UnitPortrait, entry.Category);
        }

        [Test]
        public void Manifest_GetById_ReturnsNullForUnknown()
        {
            var entry = AssetManifest.GetById("nonexistent_asset");
            Assert.IsNull(entry);
        }

        [Test]
        public void Manifest_ContainsAllSixElements()
        {
            var elements = new[] { "fire", "water", "earth", "wind", "lightning", "force" };
            foreach (var element in elements)
            {
                bool found = false;
                foreach (var entry in AssetManifest.AllAssets)
                {
                    if (entry.Category == AssetCategory.Icon && entry.Id == $"icon_element_{element}")
                    {
                        found = true;
                        break;
                    }
                }
                Assert.IsTrue(found, $"Missing element icon: {element}");
            }
        }

        [Test]
        public void Manifest_ContainsAllEightCharacters()
        {
            var characters = new[] { "kael", "lyric", "senna", "otho", "maren", "mira", "torren", "dren" };
            foreach (var charId in characters)
            {
                bool found = false;
                foreach (var entry in AssetManifest.AllAssets)
                {
                    if (entry.Category == AssetCategory.CharacterPortrait &&
                        entry.Id.StartsWith($"char_{charId}_"))
                    {
                        found = true;
                        break;
                    }
                }
                Assert.IsTrue(found, $"Missing character portraits: {charId}");
            }
        }
    }
}

using NUnit.Framework;
using UnityEngine;
using ShatteredVeil.Mono.UI;

namespace ShatteredVeil.Tests.EditMode.UI
{
    [TestFixture]
    public class PlaceholderFactoryTests
    {
        [Test]
        [TestCase("Fire")]
        [TestCase("Water")]
        [TestCase("Earth")]
        [TestCase("Wind")]
        [TestCase("Lightning")]
        [TestCase("Force")]
        public void CreateUnitSprite_ReturnsNonNull_ForEachElement(string element)
        {
            var sprite = PlaceholderFactory.CreateUnitSprite(element, 1);

            Assert.IsNotNull(sprite);
            Assert.IsNotNull(sprite.texture);
        }

        [Test]
        public void CreateUnitSprite_HigherTier_LargerTexture()
        {
            var spriteT1 = PlaceholderFactory.CreateUnitSprite("Fire", 1);
            var spriteT5 = PlaceholderFactory.CreateUnitSprite("Fire", 5);

            Assert.Greater(spriteT5.texture.width, spriteT1.texture.width);
        }

        [Test]
        public void CreateIconSprite_ReturnsCorrectDimensions()
        {
            var sprite = PlaceholderFactory.CreateIconSprite(Color.red, "Test");

            Assert.IsNotNull(sprite);
            Assert.AreEqual(64, sprite.texture.width);
            Assert.AreEqual(64, sprite.texture.height);
        }

        [Test]
        public void CreateSlotSprite_ReturnsNonNull()
        {
            var sprite = PlaceholderFactory.CreateSlotSprite();

            Assert.IsNotNull(sprite);
            Assert.IsNotNull(sprite.texture);
        }

        [Test]
        public void GetElementColor_ReturnsDistinctColors()
        {
            var fire = PlaceholderFactory.GetElementColor("Fire");
            var water = PlaceholderFactory.GetElementColor("Water");
            var earth = PlaceholderFactory.GetElementColor("Earth");

            Assert.AreNotEqual(fire, water);
            Assert.AreNotEqual(water, earth);
            Assert.AreNotEqual(fire, earth);
        }

        [Test]
        public void GetElementColor_UnknownElement_ReturnsGray()
        {
            var color = PlaceholderFactory.GetElementColor("Unknown");
            Assert.AreEqual(Color.gray, color);
        }

        [Test]
        public void GetElementAbbreviation_ReturnsCorrectAbbreviations()
        {
            Assert.AreEqual("F", PlaceholderFactory.GetElementAbbreviation("Fire"));
            Assert.AreEqual("W", PlaceholderFactory.GetElementAbbreviation("Water"));
            Assert.AreEqual("E", PlaceholderFactory.GetElementAbbreviation("Earth"));
            Assert.AreEqual("Wi", PlaceholderFactory.GetElementAbbreviation("Wind"));
            Assert.AreEqual("L", PlaceholderFactory.GetElementAbbreviation("Lightning"));
            Assert.AreEqual("Fo", PlaceholderFactory.GetElementAbbreviation("Force"));
            Assert.AreEqual("?", PlaceholderFactory.GetElementAbbreviation("Unknown"));
        }
    }
}

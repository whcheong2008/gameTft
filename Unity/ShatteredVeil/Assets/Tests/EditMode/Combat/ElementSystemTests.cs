using NUnit.Framework;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Tests.EditMode.Combat
{
    [TestFixture]
    public class ElementSystemTests
    {
        // Strong matchups → 1.3x
        [Test] public void Fire_StrongVs_Wind() => Assert.AreEqual(1.3f, ElementSystem.GetMultiplier(Element.Fire, Element.Wind));
        [Test] public void Water_StrongVs_Fire() => Assert.AreEqual(1.3f, ElementSystem.GetMultiplier(Element.Water, Element.Fire));
        [Test] public void Earth_StrongVs_Water() => Assert.AreEqual(1.3f, ElementSystem.GetMultiplier(Element.Earth, Element.Water));
        [Test] public void Earth_StrongVs_Lightning() => Assert.AreEqual(1.3f, ElementSystem.GetMultiplier(Element.Earth, Element.Lightning));
        [Test] public void Wind_StrongVs_Earth() => Assert.AreEqual(1.3f, ElementSystem.GetMultiplier(Element.Wind, Element.Earth));
        [Test] public void Lightning_StrongVs_Water() => Assert.AreEqual(1.3f, ElementSystem.GetMultiplier(Element.Lightning, Element.Water));

        // Weak matchups → 0.7x
        [Test] public void Fire_WeakVs_Water() => Assert.AreEqual(0.7f, ElementSystem.GetMultiplier(Element.Fire, Element.Water));
        [Test] public void Water_WeakVs_Earth() => Assert.AreEqual(0.7f, ElementSystem.GetMultiplier(Element.Water, Element.Earth));
        [Test] public void Water_WeakVs_Lightning() => Assert.AreEqual(0.7f, ElementSystem.GetMultiplier(Element.Water, Element.Lightning));
        [Test] public void Earth_WeakVs_Wind() => Assert.AreEqual(0.7f, ElementSystem.GetMultiplier(Element.Earth, Element.Wind));
        [Test] public void Wind_WeakVs_Fire() => Assert.AreEqual(0.7f, ElementSystem.GetMultiplier(Element.Wind, Element.Fire));
        [Test] public void Lightning_WeakVs_Earth() => Assert.AreEqual(0.7f, ElementSystem.GetMultiplier(Element.Lightning, Element.Earth));

        // Neutral matchups → 1.0x
        [Test] public void Fire_NeutralVs_Earth() => Assert.AreEqual(1.0f, ElementSystem.GetMultiplier(Element.Fire, Element.Earth));
        [Test] public void Fire_NeutralVs_Lightning() => Assert.AreEqual(1.0f, ElementSystem.GetMultiplier(Element.Fire, Element.Lightning));
        [Test] public void Wind_NeutralVs_Lightning() => Assert.AreEqual(1.0f, ElementSystem.GetMultiplier(Element.Wind, Element.Lightning));

        // Same element → 1.0x
        [Test] public void Fire_VsSelf() => Assert.AreEqual(1.0f, ElementSystem.GetMultiplier(Element.Fire, Element.Fire));
        [Test] public void Water_VsSelf() => Assert.AreEqual(1.0f, ElementSystem.GetMultiplier(Element.Water, Element.Water));
        [Test] public void Earth_VsSelf() => Assert.AreEqual(1.0f, ElementSystem.GetMultiplier(Element.Earth, Element.Earth));
        [Test] public void Wind_VsSelf() => Assert.AreEqual(1.0f, ElementSystem.GetMultiplier(Element.Wind, Element.Wind));
        [Test] public void Lightning_VsSelf() => Assert.AreEqual(1.0f, ElementSystem.GetMultiplier(Element.Lightning, Element.Lightning));
        [Test] public void Force_VsSelf() => Assert.AreEqual(1.0f, ElementSystem.GetMultiplier(Element.Force, Element.Force));

        // Force → always 1.0x both attacking and defending
        [Test] public void Force_AttackingFire() => Assert.AreEqual(1.0f, ElementSystem.GetMultiplier(Element.Force, Element.Fire));
        [Test] public void Force_AttackingWater() => Assert.AreEqual(1.0f, ElementSystem.GetMultiplier(Element.Force, Element.Water));
        [Test] public void Force_AttackingEarth() => Assert.AreEqual(1.0f, ElementSystem.GetMultiplier(Element.Force, Element.Earth));
        [Test] public void Force_AttackingWind() => Assert.AreEqual(1.0f, ElementSystem.GetMultiplier(Element.Force, Element.Wind));
        [Test] public void Force_AttackingLightning() => Assert.AreEqual(1.0f, ElementSystem.GetMultiplier(Element.Force, Element.Lightning));
        [Test] public void Fire_AttackingForce() => Assert.AreEqual(1.0f, ElementSystem.GetMultiplier(Element.Fire, Element.Force));
        [Test] public void Water_AttackingForce() => Assert.AreEqual(1.0f, ElementSystem.GetMultiplier(Element.Water, Element.Force));
        [Test] public void Earth_AttackingForce() => Assert.AreEqual(1.0f, ElementSystem.GetMultiplier(Element.Earth, Element.Force));
        [Test] public void Wind_AttackingForce() => Assert.AreEqual(1.0f, ElementSystem.GetMultiplier(Element.Wind, Element.Force));
        [Test] public void Lightning_AttackingForce() => Assert.AreEqual(1.0f, ElementSystem.GetMultiplier(Element.Lightning, Element.Force));
    }
}

using NUnit.Framework;
using ShatteredVeil.Mono.UI;

namespace ShatteredVeil.Tests.EditMode.UI
{
    [TestFixture]
    public class GameEventBusTests
    {
        [SetUp]
        public void SetUp()
        {
            GameEventBus.ClearAll();
        }

        [TearDown]
        public void TearDown()
        {
            GameEventBus.ClearAll();
        }

        [Test]
        public void Subscribe_FireEvent_HandlerCalledWithCorrectData()
        {
            int received = -1;
            GameEventBus.OnGoldChanged += (amount) => received = amount;

            GameEventBus.FireGoldChanged(500);

            Assert.AreEqual(500, received);
        }

        [Test]
        public void Unsubscribe_FireEvent_HandlerNotCalled()
        {
            int received = -1;
            void Handler(int amount) => received = amount;

            GameEventBus.OnGoldChanged += Handler;
            GameEventBus.OnGoldChanged -= Handler;

            GameEventBus.FireGoldChanged(999);

            Assert.AreEqual(-1, received);
        }

        [Test]
        public void MultipleSubscribers_AllReceiveEvent()
        {
            int countA = 0, countB = 0, countC = 0;
            GameEventBus.OnGoldChanged += (_) => countA++;
            GameEventBus.OnGoldChanged += (_) => countB++;
            GameEventBus.OnGoldChanged += (_) => countC++;

            GameEventBus.FireGoldChanged(100);

            Assert.AreEqual(1, countA);
            Assert.AreEqual(1, countB);
            Assert.AreEqual(1, countC);
        }

        [Test]
        public void FireEvent_ZeroSubscribers_NoException()
        {
            Assert.DoesNotThrow(() => GameEventBus.FireGoldChanged(100));
            Assert.DoesNotThrow(() => GameEventBus.FireXPChanged(50, 100));
            Assert.DoesNotThrow(() => GameEventBus.FireLevelUp(5));
            Assert.DoesNotThrow(() => GameEventBus.FireUnitRolled("test_unit"));
            Assert.DoesNotThrow(() => GameEventBus.FireUnitStarredUp("test_unit", 3));
            Assert.DoesNotThrow(() => GameEventBus.FireTeamChanged());
            Assert.DoesNotThrow(() => GameEventBus.FireItemEquipped("unit1", "item1"));
            Assert.DoesNotThrow(() => GameEventBus.FireCombatStarted());
            Assert.DoesNotThrow(() => GameEventBus.FireCombatTurnCompleted(1));
            Assert.DoesNotThrow(() => GameEventBus.FireCombatEnded(true, 3));
            Assert.DoesNotThrow(() => GameEventBus.FireSaveCompleted());
            Assert.DoesNotThrow(() => GameEventBus.FireToastRequested("test"));
        }

        [Test]
        public void XPChanged_ReceivesCorrectParameters()
        {
            int receivedXP = -1, receivedNext = -1;
            GameEventBus.OnXPChanged += (xp, next) => { receivedXP = xp; receivedNext = next; };

            GameEventBus.FireXPChanged(75, 150);

            Assert.AreEqual(75, receivedXP);
            Assert.AreEqual(150, receivedNext);
        }

        [Test]
        public void CombatEnded_ReceivesVictoryAndStars()
        {
            bool receivedVictory = false;
            int receivedStars = -1;
            GameEventBus.OnCombatEnded += (v, s) => { receivedVictory = v; receivedStars = s; };

            GameEventBus.FireCombatEnded(true, 3);

            Assert.IsTrue(receivedVictory);
            Assert.AreEqual(3, receivedStars);
        }

        [Test]
        public void ClearAll_RemovesAllSubscribers()
        {
            int received = 0;
            GameEventBus.OnGoldChanged += (_) => received++;
            GameEventBus.OnLevelUp += (_) => received++;

            GameEventBus.ClearAll();
            GameEventBus.FireGoldChanged(100);
            GameEventBus.FireLevelUp(5);

            Assert.AreEqual(0, received);
        }
    }
}

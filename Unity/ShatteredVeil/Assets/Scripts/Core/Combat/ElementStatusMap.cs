using System.Collections.Generic;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Maps each element to its associated status effects.
    /// Mirrors ELEMENT_STATUS_MAP from ability-templates.js.
    /// </summary>
    public static class ElementStatusMap
    {
        public class ElementEffects
        {
            public bool HasDot;
            public StatusEffectType? DotType;
            public bool HasCC;
            public StatusEffectType? CCType;
            public bool HasBuff;
            public StatusEffectType? BuffType;
            public bool HasDebuff;
            public StatusEffectType? DebuffType;
        }

        private static readonly Dictionary<Element, ElementEffects> _map;

        static ElementStatusMap()
        {
            _map = new Dictionary<Element, ElementEffects>
            {
                [Element.Fire] = new ElementEffects
                {
                    HasDot = true, DotType = StatusEffectType.Burn,
                    HasCC = false, CCType = null,
                    HasBuff = false, BuffType = null,
                    HasDebuff = false, DebuffType = null
                },
                [Element.Water] = new ElementEffects
                {
                    HasDot = false, DotType = null,
                    HasCC = true, CCType = StatusEffectType.Freeze,
                    HasBuff = false, BuffType = null,
                    HasDebuff = true, DebuffType = StatusEffectType.Slow
                },
                [Element.Earth] = new ElementEffects
                {
                    HasDot = false, DotType = null,
                    HasCC = true, CCType = StatusEffectType.Root,
                    HasBuff = true, BuffType = StatusEffectType.Shield,
                    HasDebuff = false, DebuffType = null
                },
                [Element.Wind] = new ElementEffects
                {
                    HasDot = false, DotType = null,
                    HasCC = true, CCType = StatusEffectType.Silence,
                    HasBuff = true, BuffType = StatusEffectType.Dodge,
                    HasDebuff = false, DebuffType = null
                },
                [Element.Lightning] = new ElementEffects
                {
                    HasDot = false, DotType = null,
                    HasCC = true, CCType = StatusEffectType.Stun,
                    HasBuff = false, BuffType = null,
                    HasDebuff = false, DebuffType = null
                },
                [Element.Force] = new ElementEffects
                {
                    HasDot = false, DotType = null,
                    HasCC = false, CCType = null,
                    HasBuff = false, BuffType = null,
                    HasDebuff = true, DebuffType = StatusEffectType.Vulnerability
                }
            };
        }

        public static ElementEffects Get(Element element)
        {
            return _map.TryGetValue(element, out var effects) ? effects : null;
        }

        public static StatusEffectType? GetDotType(Element element)
        {
            var e = Get(element);
            return e != null && e.HasDot ? e.DotType : null;
        }

        public static StatusEffectType? GetCCType(Element element)
        {
            var e = Get(element);
            return e != null && e.HasCC ? e.CCType : null;
        }

        public static StatusEffectType? GetBuffType(Element element)
        {
            var e = Get(element);
            return e != null && e.HasBuff ? e.BuffType : null;
        }

        public static StatusEffectType? GetDebuffType(Element element)
        {
            var e = Get(element);
            return e != null && e.HasDebuff ? e.DebuffType : null;
        }
    }
}

using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Reflection;
using System.Text;

namespace ShatteredVeil.Core.Save
{
    /// <summary>
    /// Lightweight JSON serializer/deserializer for save data.
    /// Supports: primitives, strings, arrays, List, Dictionary(string,T), and [Serializable] classes.
    /// No external dependencies — works in pure C# assemblies.
    /// </summary>
    public static class JsonHelper
    {
        public static string ToJson(object obj)
        {
            var sb = new StringBuilder();
            WriteValue(sb, obj);
            return sb.ToString();
        }

        public static T FromJson<T>(string json)
        {
            int index = 0;
            var value = ParseValue(json, ref index);
            return (T)ConvertToType(value, typeof(T));
        }

        #region Serialization

        private static void WriteValue(StringBuilder sb, object value)
        {
            if (value == null)
            {
                sb.Append("null");
                return;
            }

            var type = value.GetType();

            if (type == typeof(string))
            {
                WriteString(sb, (string)value);
            }
            else if (type == typeof(bool))
            {
                sb.Append((bool)value ? "true" : "false");
            }
            else if (type == typeof(int))
            {
                sb.Append(((int)value).ToString(CultureInfo.InvariantCulture));
            }
            else if (type == typeof(long))
            {
                sb.Append(((long)value).ToString(CultureInfo.InvariantCulture));
            }
            else if (type == typeof(float))
            {
                sb.Append(((float)value).ToString("R", CultureInfo.InvariantCulture));
            }
            else if (type == typeof(double))
            {
                sb.Append(((double)value).ToString("R", CultureInfo.InvariantCulture));
            }
            else if (type.IsArray)
            {
                WriteArray(sb, (Array)value);
            }
            else if (IsGenericDictionary(type))
            {
                WriteDictionary(sb, (IDictionary)value);
            }
            else if (type.IsClass && type.GetCustomAttribute<SerializableAttribute>() != null)
            {
                WriteObject(sb, value);
            }
            else
            {
                sb.Append(value.ToString());
            }
        }

        private static void WriteString(StringBuilder sb, string s)
        {
            sb.Append('"');
            foreach (char c in s)
            {
                switch (c)
                {
                    case '"': sb.Append("\\\""); break;
                    case '\\': sb.Append("\\\\"); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
                    default: sb.Append(c); break;
                }
            }
            sb.Append('"');
        }

        private static void WriteArray(StringBuilder sb, Array arr)
        {
            sb.Append('[');
            for (int i = 0; i < arr.Length; i++)
            {
                if (i > 0) sb.Append(',');
                WriteValue(sb, arr.GetValue(i));
            }
            sb.Append(']');
        }

        private static void WriteDictionary(StringBuilder sb, IDictionary dict)
        {
            sb.Append('{');
            bool first = true;
            foreach (DictionaryEntry entry in dict)
            {
                if (!first) sb.Append(',');
                first = false;
                WriteString(sb, entry.Key.ToString());
                sb.Append(':');
                WriteValue(sb, entry.Value);
            }
            sb.Append('}');
        }

        private static void WriteObject(StringBuilder sb, object obj)
        {
            sb.Append('{');
            var fields = obj.GetType().GetFields(BindingFlags.Public | BindingFlags.Instance);
            bool first = true;
            foreach (var field in fields)
            {
                if (!first) sb.Append(',');
                first = false;
                WriteString(sb, field.Name);
                sb.Append(':');
                WriteValue(sb, field.GetValue(obj));
            }
            sb.Append('}');
        }

        #endregion

        #region Parsing

        private static object ParseValue(string json, ref int index)
        {
            SkipWhitespace(json, ref index);
            if (index >= json.Length) return null;

            char c = json[index];

            if (c == '"') return ParseString(json, ref index);
            if (c == '{') return ParseObject(json, ref index);
            if (c == '[') return ParseArray(json, ref index);
            if (c == 't' || c == 'f') return ParseBool(json, ref index);
            if (c == 'n') return ParseNull(json, ref index);
            return ParseNumber(json, ref index);
        }

        private static string ParseString(string json, ref int index)
        {
            index++; // skip opening quote
            var sb = new StringBuilder();
            while (index < json.Length)
            {
                char c = json[index++];
                if (c == '"') return sb.ToString();
                if (c == '\\' && index < json.Length)
                {
                    char esc = json[index++];
                    switch (esc)
                    {
                        case '"': sb.Append('"'); break;
                        case '\\': sb.Append('\\'); break;
                        case 'n': sb.Append('\n'); break;
                        case 'r': sb.Append('\r'); break;
                        case 't': sb.Append('\t'); break;
                        case '/': sb.Append('/'); break;
                        case 'u':
                            if (index + 4 <= json.Length)
                            {
                                string hex = json.Substring(index, 4);
                                sb.Append((char)Convert.ToInt32(hex, 16));
                                index += 4;
                            }
                            break;
                        default: sb.Append(esc); break;
                    }
                }
                else
                {
                    sb.Append(c);
                }
            }
            return sb.ToString();
        }

        private static Dictionary<string, object> ParseObject(string json, ref int index)
        {
            var dict = new Dictionary<string, object>();
            index++; // skip {
            SkipWhitespace(json, ref index);

            if (index < json.Length && json[index] == '}')
            {
                index++;
                return dict;
            }

            while (index < json.Length)
            {
                SkipWhitespace(json, ref index);
                string key = ParseString(json, ref index);
                SkipWhitespace(json, ref index);
                if (index < json.Length && json[index] == ':') index++;
                SkipWhitespace(json, ref index);
                dict[key] = ParseValue(json, ref index);
                SkipWhitespace(json, ref index);
                if (index < json.Length && json[index] == ',')
                {
                    index++;
                    continue;
                }
                if (index < json.Length && json[index] == '}')
                {
                    index++;
                    break;
                }
            }
            return dict;
        }

        private static List<object> ParseArray(string json, ref int index)
        {
            var list = new List<object>();
            index++; // skip [
            SkipWhitespace(json, ref index);

            if (index < json.Length && json[index] == ']')
            {
                index++;
                return list;
            }

            while (index < json.Length)
            {
                SkipWhitespace(json, ref index);
                list.Add(ParseValue(json, ref index));
                SkipWhitespace(json, ref index);
                if (index < json.Length && json[index] == ',')
                {
                    index++;
                    continue;
                }
                if (index < json.Length && json[index] == ']')
                {
                    index++;
                    break;
                }
            }
            return list;
        }

        private static bool ParseBool(string json, ref int index)
        {
            if (json.Substring(index, 4) == "true")
            {
                index += 4;
                return true;
            }
            index += 5; // false
            return false;
        }

        private static object ParseNull(string json, ref int index)
        {
            index += 4;
            return null;
        }

        private static object ParseNumber(string json, ref int index)
        {
            int start = index;
            bool isFloat = false;

            if (index < json.Length && json[index] == '-') index++;
            while (index < json.Length && char.IsDigit(json[index])) index++;
            if (index < json.Length && json[index] == '.')
            {
                isFloat = true;
                index++;
                while (index < json.Length && char.IsDigit(json[index])) index++;
            }
            if (index < json.Length && (json[index] == 'e' || json[index] == 'E'))
            {
                isFloat = true;
                index++;
                if (index < json.Length && (json[index] == '+' || json[index] == '-')) index++;
                while (index < json.Length && char.IsDigit(json[index])) index++;
            }

            string numStr = json.Substring(start, index - start);

            if (isFloat)
                return double.Parse(numStr, CultureInfo.InvariantCulture);

            if (long.TryParse(numStr, NumberStyles.Integer, CultureInfo.InvariantCulture, out long l))
            {
                if (l >= int.MinValue && l <= int.MaxValue)
                    return (int)(int)l;
                return l;
            }
            return double.Parse(numStr, CultureInfo.InvariantCulture);
        }

        private static void SkipWhitespace(string json, ref int index)
        {
            while (index < json.Length && char.IsWhiteSpace(json[index]))
                index++;
        }

        #endregion

        #region Type Conversion

        private static object ConvertToType(object value, Type targetType)
        {
            if (value == null)
                return null;

            if (targetType == typeof(string))
                return value as string;

            if (targetType == typeof(int))
            {
                if (value is int i) return i;
                if (value is long l) return (int)l;
                if (value is double d) return (int)d;
                return Convert.ToInt32(value);
            }

            if (targetType == typeof(long))
            {
                if (value is long l) return l;
                if (value is int i) return (long)i;
                if (value is double d) return (long)d;
                return Convert.ToInt64(value);
            }

            if (targetType == typeof(float))
            {
                if (value is float f) return f;
                if (value is double d) return (float)d;
                if (value is int i) return (float)i;
                if (value is long l) return (float)l;
                return Convert.ToSingle(value);
            }

            if (targetType == typeof(double))
            {
                if (value is double d) return d;
                return Convert.ToDouble(value);
            }

            if (targetType == typeof(bool))
            {
                if (value is bool b) return b;
                return Convert.ToBoolean(value);
            }

            if (targetType.IsArray)
            {
                return ConvertToArray(value, targetType);
            }

            if (IsGenericDictionary(targetType))
            {
                return ConvertToDictionary(value, targetType);
            }

            if (targetType.IsClass && value is Dictionary<string, object> dict)
            {
                return ConvertToObject(dict, targetType);
            }

            return value;
        }

        private static object ConvertToArray(object value, Type arrayType)
        {
            var elementType = arrayType.GetElementType();

            if (value is List<object> list)
            {
                var arr = Array.CreateInstance(elementType, list.Count);
                for (int i = 0; i < list.Count; i++)
                {
                    arr.SetValue(ConvertToType(list[i], elementType), i);
                }
                return arr;
            }

            return Array.CreateInstance(elementType, 0);
        }

        private static object ConvertToDictionary(object value, Type dictType)
        {
            var valueType = dictType.GetGenericArguments()[1];
            var dict = (IDictionary)Activator.CreateInstance(dictType);

            if (value is Dictionary<string, object> sourceDict)
            {
                foreach (var kvp in sourceDict)
                {
                    dict[kvp.Key] = ConvertToType(kvp.Value, valueType);
                }
            }

            return dict;
        }

        private static object ConvertToObject(Dictionary<string, object> dict, Type type)
        {
            var obj = Activator.CreateInstance(type);
            var fields = type.GetFields(BindingFlags.Public | BindingFlags.Instance);

            foreach (var field in fields)
            {
                if (dict.TryGetValue(field.Name, out var val))
                {
                    field.SetValue(obj, ConvertToType(val, field.FieldType));
                }
            }

            return obj;
        }

        private static bool IsGenericDictionary(Type type)
        {
            return type.IsGenericType && type.GetGenericTypeDefinition() == typeof(Dictionary<,>);
        }

        #endregion
    }
}

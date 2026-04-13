# IOZEN Standard Library Reference 📚

Complete reference for built-in functions and modules.

## Table of Contents

1. [Built-in Functions](#built-in-functions)
   - [I/O](#io)
   - [String](#string)
   - [Array](#array)
   - [Math](#math)
   - [File](#file)
   - [JSON](#json)
2. [Global Constants](#global-constants)
3. [Type Conversion](#type-conversion)

---

## Built-in Functions

### I/O

#### `print`

Prints a value to standard output.

```iozen
print expression
```

**Parameters:**
- `expression` - Any value to print (integer, decimal, text, boolean, array)

**Examples:**
```iozen
print "Hello, World!"
print 42
print 3.14159
print true
print [1, 2, 3]
print variable_name
print "Result: " attach result
```

**Notes:**
- Automatically adds newline
- Converts non-text values to string representation
- Arrays print as `[item1, item2, ...]`

---

### String

#### `string_length`

Returns the length of a text value.

```iozen
string_length text_value returns integer
```

**Parameters:**
- `text_value` - The text to measure

**Returns:** Number of characters (UTF-8)

**Examples:**
```iozen
create variable len as integer with value string_length "Hello"    # 5
create variable len2 as integer with value string_length ""         # 0
create variable len3 as integer with value string_length "IOZEN"   # 5
```

---

#### `string_concat`

Concatenates two text values.

```iozen
string_concat a b returns text
```

**Parameters:**
- `a` - First text value
- `b` - Second text value

**Returns:** Combined text

**Examples:**
```iozen
create variable greeting as text with value string_concat "Hello" " World"   # "Hello World"
create variable name as text with value string_concat "IO" "ZEN"            # "IOZEN"
```

**Alternative:** Use `attach` operator:
```iozen
create variable msg as text with value "Hello" attach " " attach "World"
```

---

#### `substring`

Extracts a portion of a text value.

```iozen
substring text_value start_index length returns text
```

**Parameters:**
- `text_value` - Source text
- `start_index` - Starting position (0-based)
- `length` - Number of characters to extract

**Returns:** Substring

**Examples:**
```iozen
create variable text as text with value "Hello, World!"
create var result as text with value substring text 0 5      # "Hello"
create var result2 as text with value substring text 7 5     # "World"
```

**Notes:**
- Returns empty string if start_index >= length
- Returns up to available characters if length exceeds text

---

#### `string_indexOf`

Finds the first occurrence of a substring.

```iozen
string_indexOf text_value search_value returns integer
```

**Parameters:**
- `text_value` - Text to search in
- `search_value` - Substring to find

**Returns:** Index of first occurrence (0-based), or -1 if not found

**Examples:**
```iozen
create var idx as integer with value string_indexOf "Hello, World!" "World"    # 7
create var idx2 as integer with value string_indexOf "Hello, World!" "xyz"       # -1
```

---

#### `string_lastIndexOf`

Finds the last occurrence of a substring.

```iozen
string_lastIndexOf text_value search_value returns integer
```

**Returns:** Index of last occurrence (0-based), or -1 if not found

**Examples:**
```iozen
create var idx as integer with value string_lastIndexOf "ababab" "ab"    # 4
```

---

#### `string_contains`

Checks if text contains a substring.

```iozen
string_contains text_value search_value returns boolean
```

**Returns:** `true` if found, `false` otherwise

**Examples:**
```iozen
create var hasWorld as boolean with value string_contains "Hello, World!" "World"   # true
create var hasXyz as boolean with value string_contains "Hello, World!" "xyz"       # false
```

---

#### `string_split`

Splits text by delimiter.

```iozen
string_split text_value delimiter returns array of text
```

**Returns:** Array of substrings

**Examples:**
```iozen
create var parts as array of text with value string_split "a,b,c" ","
# parts = ["a", "b", "c"]
```

---

#### `string_join`

Joins array elements with delimiter.

```iozen
string_join array_of_text delimiter returns text
```

**Examples:**
```iozen
create var items as array of text with values ["a", "b", "c"]
create var joined as text with value string_join items ","    # "a,b,c"
```

---

### Array

#### `array_length`

Returns the number of elements in an array.

```iozen
array_length array_value returns integer
```

**Parameters:**
- `array_value` - Any array

**Returns:** Number of elements

**Examples:**
```iozen
create var arr as array of integer with values [1, 2, 3, 4, 5]
create var len as integer with value array_length arr    # 5

create var empty as array of text with values []
create var len2 as integer with value array_length empty # 0
```

---

#### `array_push`

Adds an element to the end of an array.

```iozen
array_push array_value element
```

**Parameters:**
- `array_value` - Array to modify
- `element` - Element to add

**Returns:** Nothing (modifies array in place)

**Examples:**
```iozen
create var arr as array of integer with values [1, 2, 3]
array_push arr 4
# arr is now [1, 2, 3, 4]
```

---

#### `array_pop`

Removes and returns the last element.

```iozen
array_pop array_value returns element_type
```

**Examples:**
```iozen
create var arr as array of integer with values [1, 2, 3]
create var last as integer with value array_pop arr
# last = 3, arr = [1, 2]
```

---

#### `array_insert`

Inserts element at specified index.

```iozen
array_insert array_value index element
```

**Examples:**
```iozen
create var arr as array of integer with values [1, 3]
array_insert arr 1 2
# arr is now [1, 2, 3]
```

---

#### `array_remove`

Removes element at specified index.

```iozen
array_remove array_value index
```

**Examples:**
```iozen
create var arr as array of integer with values [1, 2, 3]
array_remove arr 1
# arr is now [1, 3]
```

---

### Math

#### `abs`

Absolute value.

```iozen
abs value returns decimal
```

**Examples:**
```iozen
create var a as decimal with value abs -5.5    # 5.5
create var b as decimal with value abs 3.0     # 3.0
```

---

#### `floor`

Rounds down to nearest integer.

```iozen
floor value returns integer
```

**Examples:**
```iozen
create var f as integer with value floor 3.7    # 3
create var f2 as integer with value floor -1.5   # -2
```

---

#### `ceil`

Rounds up to nearest integer.

```iozen
ceil value returns integer
```

**Examples:**
```iozen
create var c as integer with value ceil 3.2     # 4
create var c2 as integer with value ceil -1.5   # -1
```

---

#### `round`

Rounds to nearest integer.

```iozen
round value returns integer
```

**Examples:**
```iozen
create var r as integer with value round 3.4    # 3
create var r2 as integer with value round 3.5   # 4
```

---

#### `sqrt`

Square root.

```iozen
sqrt value returns decimal
```

**Examples:**
```iozen
create var s as decimal with value sqrt 16     # 4.0
create var s2 as decimal with value sqrt 2     # 1.4142...
```

---

#### `pow`

Power/exponentiation.

```iozen
pow base exponent returns decimal
```

**Examples:**
```iozen
create var p as decimal with value pow 2 3     # 8.0
create var p2 as decimal with value pow 10 2   # 100.0
```

---

#### Trigonometry

| Function | Description | Domain | Range |
|----------|-------------|--------|-------|
| `sin x` | Sine | radians | [-1, 1] |
| `cos x` | Cosine | radians | [-1, 1] |
| `tan x` | Tangent | radians | (-∞, ∞) |
| `asin x` | Arcsine | [-1, 1] | radians |
| `acos x` | Arccosine | [-1, 1] | radians |
| `atan x` | Arctangent | (-∞, ∞) | radians |

**Examples:**
```iozen
create var s as decimal with value sin 0           # 0.0
create var c as decimal with value cos 0           # 1.0
create var pi as decimal with value 3.14159
create var s2 as decimal with value sin pi         # ~0.0
```

---

#### `log` / `log10` / `exp`

| Function | Description |
|----------|-------------|
| `log x` | Natural logarithm (base e) |
| `log10 x` | Logarithm base 10 |
| `exp x` | e^x (exponential) |

---

### File

#### `readFile`

Reads entire file as text.

```iozen
readFile path returns text
```

**Parameters:**
- `path` - File path (text)

**Returns:** File contents as text

**Errors:** Returns empty string if file not found (check with `fileExists` first)

**Examples:**
```iozen
create var content as text with value readFile "data.txt"
print content
```

---

#### `writeFile`

Writes text to file.

```iozen
writeFile path content
```

**Parameters:**
- `path` - File path (text)
- `content` - Text to write

**Returns:** Nothing

**Examples:**
```iozen
writeFile "output.txt" "Hello, File!"
writeFile "data.json" json_string
```

---

#### `fileExists`

Checks if file exists.

```iozen
fileExists path returns boolean
```

**Examples:**
```iozen
create var exists as boolean with value fileExists "config.txt"
if exists then
    create var config as text with value readFile "config.txt"
end
```

---

#### `appendFile`

Appends text to file.

```iozen
appendFile path content
```

**Examples:**
```iozen
appendFile "log.txt" "New log entry\n"
```

---

### JSON

#### `parseJSON`

Parses JSON string to value.

```iozen
parseJSON json_string returns any
```

**Returns:** Parsed value (integer, decimal, text, boolean, array, or struct)

**Examples:**
```iozen
create var json as text with value '{"name": "Alice", "age": 30}'
create var data as Person with value parseJSON json
print data.name    # "Alice"
```

---

#### `stringify`

Converts value to JSON string.

```iozen
stringify value returns text
```

**Examples:**
```iozen
create var person as Person
assign person.name with value "Bob"
assign person.age with value 25

create var json as text with value stringify person
# json = '{"name": "Bob", "age": 25}'
```

---

## Global Constants

### Math Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `PI` | 3.14159... | Ratio of circle circumference to diameter |
| `E` | 2.71828... | Euler's number, base of natural logarithm |

**Usage:**
```iozen
create var radius as decimal with value 5.0
create var circumference as decimal with value 2 * PI * radius
```

---

## Type Conversion

### Implicit Conversions

IOZEN performs limited implicit conversions:
- Integer to Decimal in mixed operations

### Explicit Conversions

#### `to_integer`

Converts value to integer.

```iozen
to_integer value returns integer
```

**Examples:**
```iozen
create var i as integer with value to_integer 3.7      # 3 (truncates)
create var i2 as integer with value to_integer "42"     # 42
```

---

#### `to_decimal`

Converts value to decimal.

```iozen
to_decimal value returns decimal
```

**Examples:**
```iozen
create var d as decimal with value to_decimal 5        # 5.0
create var d2 as decimal with value to_decimal "3.14"  # 3.14
```

---

#### `to_text`

Converts value to text.

```iozen
to_text value returns text
```

**Examples:**
```iozen
create var t as text with value to_text 42            # "42"
create var t2 as text with value to_text 3.14         # "3.14"
create var t3 as text with value to_text true         # "true"
```

---

## Quick Reference

### By Category

| Category | Functions |
|----------|-----------|
| **I/O** | `print` |
| **String** | `string_length`, `string_concat`, `substring`, `string_indexOf`, `string_lastIndexOf`, `string_contains`, `string_split`, `string_join` |
| **Array** | `array_length`, `array_push`, `array_pop`, `array_insert`, `array_remove` |
| **Math** | `abs`, `floor`, `ceil`, `round`, `sqrt`, `pow`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `log`, `log10`, `exp` |
| **File** | `readFile`, `writeFile`, `fileExists`, `appendFile` |
| **JSON** | `parseJSON`, `stringify` |
| **Convert** | `to_integer`, `to_decimal`, `to_text` |

---

See also:
- [Language Guide](../guide/language-guide.md) - Tutorial format
- [Syntax Reference](../reference/syntax.md) - Complete syntax
- [Examples](../examples/index.md) - Usage examples

# IOZEN Syntax Reference 📋

Complete syntax reference for the IOZEN programming language.

## Table of Contents

1. [Lexical Elements](#lexical-elements)
2. [Variables](#variables)
3. [Types](#types)
4. [Expressions](#expressions)
5. [Statements](#statements)
6. [Functions](#functions)
7. [Control Flow](#control-flow)
8. [Arrays](#arrays)
9. [Structs](#structs)
10. [Modules](#modules)
11. [Comments](#comments)

---

## Lexical Elements

### Keywords

| Keyword | Usage |
|---------|-------|
| `create` | Variable declaration |
| `variable` | Variable declaration (with create) |
| `constant` | Constant declaration (v1.1) |
| `as` | Type annotation |
| `with` | Value assignment in declaration |
| `value` | Part of "with value" |
| `assign` | Variable reassignment |
| `function` | Function definition |
| `takes` | Function parameters |
| `returns` | Return type |
| `return` | Return statement |
| `nothing` | Void type |
| `if` | Conditional |
| `then` | If block start |
| `otherwise` | Else/else if |
| `while` | While loop |
| `repeat` | While block |
| `for` | For loop |
| `from` | Range start |
| `to` | Range end |
| `in` | Iterator |
| `do` | For block |
| `end` | Block terminator |
| `type` | Struct definition |
| `is` | Struct body start |
| `use` | Module import |
| `export` | Module export |
| `break` | Loop exit |
| `continue` | Loop skip |
| `and` | Logical AND |
| `or` | Logical OR |
| `not` | Logical NOT |
| `mod` | Modulo operator |

### Literals

```iozen
# Integer
42
-17
0

# Decimal
3.14159
-0.5
2.0

# Text (string)
"Hello, World!"
"Line 1\nLine 2"
"Tab\there"

# Boolean
true
false

# Array
[1, 2, 3, 4, 5]
["a", "b", "c"]
[]
```

### Identifiers

- Start with letter or underscore
- Followed by letters, digits, or underscores
- Case-sensitive

```iozen
# Valid
name
userName
_name
name123
calculateTotal

# Invalid
123name      # Starts with digit
user-name    # Contains hyphen
my name      # Contains space
```

---

## Variables

### Declaration

```ebnf
declaration = "create" ("variable" | "constant") identifier "as" type ("with" "value" expression)?
```

```iozen
create variable x as integer
create variable x as integer with value 10
create variable name as text with value "Alice"
create variable arr as array of integer with values [1, 2, 3]
```

### Assignment

```ebnf
assignment = "assign" identifier "with" "value" expression
```

```iozen
assign x with value 20
assign name with value "Bob"
assign x with value x + 1
```

---

## Types

### Primitive Types

| Type | Description | Default Value |
|------|-------------|---------------|
| `integer` | 64-bit signed integer | 0 |
| `decimal` | 64-bit floating-point | 0.0 |
| `text` | UTF-8 string | "" |
| `boolean` | true/false | false |
| `nothing` | Void/Unit | - |

### Composite Types

```iozen
# Array
array of integer
array of text
array of decimal

# Struct (user-defined)
Person
Point
UserProfile
```

### Type Syntax

```ebnf
type = primitive_type | array_type | struct_type

primitive_type = "integer" | "decimal" | "text" | "boolean" | "nothing"

array_type = "array" "of" type

struct_type = identifier  # User-defined type name
```

---

## Expressions

### Primary Expressions

```ebnf
primary = literal | identifier | "(" expression ")" | array_literal
```

### Arithmetic Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `+` | Addition | `a + b` |
| `-` | Subtraction | `a - b` |
| `*` | Multiplication | `a * b` |
| `/` | Division | `a / b` |
| `mod` | Modulo | `a mod b` |

Precedence (high to low):
1. `*`, `/`, `mod`
2. `+`, `-`

### Comparison Operators

| Operator | Description |
|----------|-------------|
| `==` | Equal |
| `!=` | Not equal |
| `<` | Less than |
| `>` | Greater than |
| `<=` | Less or equal |
| `>=` | Greater or equal |

### Logical Operators

| Operator | Description |
|----------|-------------|
| `and` | Logical AND |
| `or` | Logical OR |
| `not` | Logical NOT (prefix) |

### String Concatenation

| Operator | Description | Example |
|----------|-------------|---------|
| `attach` | Concatenate | `"Hello" attach " " attach "World"` |

---

## Statements

### Expression Statement

```iozen
print "Hello"
callFunction 1 2
```

### Variable Declaration Statement

```iozen
create variable x as integer with value 10
```

### Assignment Statement

```iozen
assign x with value 20
```

### Return Statement

```iozen
return 42
return nothing
return a + b
```

### Block

```ebnf
block = { statement }
```

---

## Functions

### Function Definition

```ebnf
function_definition = "function" identifier 
                      ("takes" parameter_list)?
                      "returns" type
                      block
                      "end"

parameter_list = parameter { "," parameter }
parameter = identifier "as" type
```

```iozen
# No parameters
function greet returns nothing
    print "Hello"
end

# With parameters
function add takes a as integer, b as integer returns integer
    return a + b
end

# Multiple parameters, different types
function createUser takes name as text, age as integer, active as boolean returns text
    return name attach " (" attach age attach ")"
end
```

### Function Call

```ebnf
function_call = identifier argument_list
argument_list = expression { expression }
```

```iozen
greet
add 5 3
createUser "Alice" 30 true
```

### Return Types

| Return Type | Meaning |
|-------------|---------|
| `integer` | Returns integer value |
| `decimal` | Returns decimal value |
| `text` | Returns text value |
| `boolean` | Returns boolean value |
| `nothing` | No return value (procedure) |
| `array of T` | Returns array |
| Struct name | Returns struct instance |

---

## Control Flow

### If Statement

```ebnf
if_statement = "if" expression "then" block
               { "otherwise" "if" expression "then" block }
               [ "otherwise" block ]
               "end"
```

```iozen
# Simple if
if x > 0 then
    print "Positive"
end

# If-else
if x > 0 then
    print "Positive"
otherwise
    print "Not positive"
end

# If-else if-else
if x > 0 then
    print "Positive"
otherwise if x < 0 then
    print "Negative"
otherwise
    print "Zero"
end
```

### While Loop

```ebnf
while_statement = "while" expression "repeat" block "end"
```

```iozen
# Basic while
while i < 10 repeat
    print i
    assign i with value i + 1
end

# Infinite loop with break
while true repeat
    if condition then
        break
    end
end

# With continue
while i < 100 repeat
    assign i with value i + 1
    if i mod 2 == 0 then
        continue
    end
    print i    # Only odd numbers
end
```

### For Loop

```ebnf
for_statement = "for" identifier "from" expression "to" expression "do" block "end"
              | "for" identifier "in" expression "do" block "end"
```

```iozen
# Range-based
for i from 1 to 10 do
    print i
end

# Array iteration
for item in items do
    print item
end
```

### Break and Continue

```iozen
# Break - exit loop immediately
while true repeat
    if shouldStop then
        break
    end
end

# Continue - skip to next iteration
for i from 1 to 100 do
    if i mod 2 == 0 then
        continue    # Skip even numbers
    end
    print i
end
```

---

## Arrays

### Array Literal

```ebnf
array_literal = "[" [ expression { "," expression } ] "]"
```

```iozen
[1, 2, 3, 4, 5]
["apple", "banana", "cherry"]
[]
```

### Array Declaration

```iozen
create variable arr as array of integer with values [1, 2, 3]
create variable empty as array of text with values []
```

### Array Access

```ebnf
array_access = expression "[" expression "]"
```

```iozen
arr[0]      # First element
arr[1]      # Second element
arr[i + 1]  # Expression index
```

### Array Operations

```iozen
# Length
array_length arr

# Push
array_push arr 42

# Access with index
create variable first as integer with value arr[0]
```

---

## Structs

### Struct Definition

```ebnf
struct_definition = "type" identifier "is"
                    { field_definition }
                    "end"

field_definition = identifier "as" type
```

```iozen
type Person is
    name as text
    age as integer
    email as text
end
```

### Struct Instantiation

```iozen
create variable person as Person
```

### Field Access

```ebnf
field_access = expression "." identifier
```

```iozen
person.name
person.age
person.email
```

### Field Assignment

```iozen
assign person.name with value "Alice"
assign person.age with value 30
```

---

## Modules

### Export

```ebnf
export = "export" function_definition
```

```iozen
export function add takes a as integer, b as integer returns integer
    return a + b
end
```

### Import

```ebnf
import = "use" string_literal [ "as" identifier ]
```

```iozen
use "math_utils"
use "string_ops" as strings
```

---

## Comments

```iozen
# Single line comment

# Multi-line
# by using
# multiple # lines
```

---

## Complete Grammar (EBNF)

```ebnf
program = { statement }

statement = declaration
          | assignment
          | function_definition
          | if_statement
          | while_statement
          | for_statement
          | return_statement
          | expression_statement
          | struct_definition
          | import_statement
          | export_statement

declaration = "create" ("variable" | "constant") identifier "as" type ("with" "value" expression)?

assignment = "assign" (identifier | field_access | array_access) "with" "value" expression

expression = logical_or

logical_or = logical_and { "or" logical_and }

logical_and = equality { "and" equality }

equality = comparison { ("==" | "!=") comparison }

comparison = term { ("<" | ">" | "<=" | ">=") term }

term = factor { ("+" | "-") factor }

factor = unary { ("*" | "/" | "mod") unary }

unary = ("not" | "-") unary | primary

primary = literal
        | identifier
        | function_call
        | field_access
        | array_access
        | "(" expression ")"
        | array_literal

literal = integer | decimal | text | boolean | "nothing"

function_call = identifier { expression }

field_access = primary "." identifier

array_access = primary "[" expression "]"

type = "integer" | "decimal" | "text" | "boolean" | "nothing" | "array" "of" type | identifier
```

---

## Operator Precedence (High to Low)

1. `()` `[]` `.` - Grouping, access
2. `not` `-` (unary) - Unary operators
3. `*` `/` `mod` - Multiplicative
4. `+` `-` - Additive
5. `attach` - String concatenation
6. `<` `>` `<=` `>=` - Comparison
7. `==` `!=` - Equality
8. `and` - Logical AND
9. `or` - Logical OR

---

## Reserved Words

These cannot be used as identifiers:

```
and         array       as          assign
boolean     break       constant    continue
create      decimal     do          end
export      false       for         from
function    if          in          integer
is          mod         nothing     not
or          otherwise   repeat      return
returns     take        text        then
to          true        type        use
value       variable    while       with
```

---

See also:
- [Language Guide](../guide/language-guide.md) - Tutorial format
- [Standard Library](../stdlib/index.md) - Built-in functions
- [Examples](../examples/index.md) - Code samples

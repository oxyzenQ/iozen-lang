# IOZEN Language Guide 📖

A comprehensive guide to the IOZEN programming language.

## Table of Contents

1. [Introduction](#introduction)
2. [Basic Syntax](#basic-syntax)
3. [Variables and Types](#variables-and-types)
4. [Operators](#operators)
5. [Control Flow](#control-flow)
6. [Functions](#functions)
7. [Arrays](#arrays)
8. [Structs](#structs)
9. [Modules](#modules)
10. [Standard Library](#standard-library)
11. [Best Practices](#best-practices)

## Introduction

IOZEN is designed to be:
- **Readable**: Natural English-like syntax
- **Safe**: Memory safety through ownership
- **Fast**: Compiles to native code
- **Modern**: First-class functions, closures, modules

## Basic Syntax

### Comments

```iozen
# Single line comment

# IOZEN uses # for comments
# (similar to Python, shell scripts)
```

### Statements

Each statement ends with a newline (no semicolons needed):

```iozen
print "Hello"          # Valid
print "World"          # Valid

# This is also valid
print "Hello"
print "World"
```

### Case Sensitivity

IOZEN is case-sensitive:

```iozen
create variable Name as text      # Different from 'name'
create variable name as text       # Different from 'Name'
```

## Variables and Types

### Type System

IOZEN has explicit type declarations:

| Type | Description | Example |
|------|-------------|---------|
| `integer` | Whole numbers | `42`, `-10`, `0` |
| `decimal` | Floating-point | `3.14`, `-0.5` |
| `text` | Strings | `"Hello"`, `'World'` |
| `boolean` | True/False | `true`, `false` |
| `array of T` | Homogeneous arrays | `[1, 2, 3]` |
| Custom | User-defined structs | See [Structs](#structs) |

### Variable Declaration

```iozen
# Full syntax
create variable <name> as <type> with value <value>

# Examples
create variable age as integer with value 25
create variable name as text with value "Alice"
create variable pi as decimal with value 3.14159
create variable active as boolean with value true
```

### Variable Assignment

```iozen
create variable count as integer with value 0

# Reassign
assign count with value 10
assign count with value count + 1
```

### Constants (Future: v1.1)

```iozen
# Coming in v1.1
# create constant PI as decimal with value 3.14159
```

## Operators

### Arithmetic

```iozen
create variable a as integer with value 10
create variable b as integer with value 3

create variable sum as integer with value a + b      # 13
create variable diff as integer with value a - b     # 7
create variable prod as integer with value a * b     # 30
create variable quot as integer with value a / b     # 3
create variable rem as integer with value a mod b    # 1
```

### Comparison

```iozen
a == b     # Equal
a != b     # Not equal
a < b      # Less than
a > b      # Greater than
a <= b     # Less or equal
a >= b     # Greater or equal
```

### Logical

```iozen
x and y    # Logical AND
x or y     # Logical OR
not x      # Logical NOT
```

### String Concatenation

```iozen
create variable greeting as text with value "Hello"
create variable name as text with value "World"

print greeting attach ", " attach name attach "!"
# Output: Hello, World!
```

## Control Flow

### If/Else

```iozen
create variable score as integer with value 85

if score >= 90 then
    print "Grade: A"
otherwise if score >= 80 then
    print "Grade: B"
otherwise if score >= 70 then
    print "Grade: C"
otherwise
    print "Grade: F"
end
```

### While Loop

```iozen
# Basic while
create variable i as integer with value 0
while i < 5 repeat
    print i
    assign i with value i + 1
end

# With break/continue
create variable n as integer with value 0
while true repeat
    assign n with value n + 1
    
    if n == 3 then
        continue    # Skip this iteration
    end
    
    if n > 5 then
        break       # Exit loop
    end
    
    print n
end
```

### For Loop

```iozen
# Range-based for
for i from 1 to 10 do
    print i
end

# With step (if supported)
# for i from 10 to 1 step -1 do

# Array iteration
for item in array do
    print item
end
```

## Functions

### Function Definition

```iozen
# Basic function
function greet takes name as text returns nothing
    print "Hello, " attach name
end

# Function with return
function add takes a as integer, b as integer returns integer
    return a + b
end

# Multiple parameters
function createUser takes username as text, age as integer, active as boolean returns text
    return username attach " (" attach age attach " years old)"
end
```

### Function Calls

```iozen
# Direct call
greet "World"

# With arguments
print add 5 3

# As expression
create variable result as integer with value add 10 20
```

### Higher-Order Functions (Interpreter Only)

```iozen
# Functions as values (interpreter)
function apply takes f as function, x as integer returns integer
    return f x
end

function double takes x as integer returns integer
    return x * 2
end

print apply double 5    # Output: 10
```

**Note**: Higher-order functions work in interpreter. Full compiler support coming in v1.1.

## Arrays

### Creating Arrays

```iozen
# With values
create variable numbers as array of integer with values [1, 2, 3, 4, 5]
create variable names as array of text with values ["Alice", "Bob", "Carol"]

# Empty array
create variable empty as array of integer with values []
```

### Array Operations

```iozen
create variable arr as array of integer with values [10, 20, 30]

# Index access (0-based)
create variable first as integer with value arr[0]      # 10
create variable second as integer with value arr[1]     # 20

# Length
create variable len as integer with value array_length arr

# Push (add element)
array_push arr 40          # arr is now [10, 20, 30, 40]

# Pop (remove last)
# array_pop arr            # Coming in v1.1
```

### Iterating Arrays

```iozen
# Using for...in
for num in numbers do
    print num
end

# Using while with index
create variable i as integer with value 0
while i < array_length numbers repeat
    print numbers[i]
    assign i with value i + 1
end
```

## Structs

### Defining Structs

```iozen
type Person is
    name as text
    age as integer
    email as text
end

type Point is
    x as decimal
    y as decimal
end
```

### Creating Instances

```iozen
# Declare
create variable person as Person

# Assign fields
assign person.name with value "Alice"
assign person.age with value 30
assign person.email with value "alice@example.com"

# Print
print person.name attach " is " attach person.age attach " years old"
```

### Nested Structs

```iozen
type Address is
    street as text
    city as text
    zip as text
end

type Employee is
    name as text
    address as Address
    salary as decimal
end

create variable emp as Employee
assign emp.name with value "Bob"
assign emp.address.street with value "123 Main St"
assign emp.address.city with value "New York"
```

## Modules

### Creating Modules

File: `math_utils.iozen`
```iozen
# Export functions
export function square takes x as integer returns integer
    return x * x
end

export function cube takes x as integer returns integer
    return x * x * x
end

# Private function (not exported)
function helper takes x as integer returns integer
    return x + 1
end
```

### Using Modules

```iozen
# Import all exports
use "math_utils"

print square 5    # 25
print cube 3      # 27

# Import with alias
use "math_utils" as math

print math.square 5
```

### Module Resolution

1. Local file: `./module.iozen` or `module.iozen`
2. `iozen_modules/`: Installed packages
3. Standard library: Built-in modules

## Standard Library

### String Functions

```iozen
# Length
create variable len as integer with value string_length "Hello"    # 5

# Concatenation (also use 'attach')
create variable full as text with value string_concat "Hello" " World"

# Substring
# substring text start length    # Coming in v1.1

# Split
# split text delimiter           # Coming in v1.1
```

### Math Functions

```iozen
# Basic
create variable abs_val as decimal with value abs -5.5       # 5.5
create variable floor_val as integer with value floor 3.7   # 3
create variable ceil_val as integer with value ceil 3.2     # 4

# Power and root
create variable pow_val as decimal with value pow 2 3       # 8
create variable sqrt_val as decimal with value sqrt 16      # 4

# Trigonometry
create variable sin_val as decimal with value sin 0           # 0
create variable cos_val as decimal with value cos 0           # 1

# Constants
# PI, E                        # Coming in v1.1
```

### File I/O

```iozen
# Read file
create variable content as text with value readFile "data.txt"

# Write file
writeFile "output.txt" "Hello, File!"

# Check exists
create variable exists as boolean with value fileExists "data.txt"
```

### JSON

```iozen
# Parse JSON string to value
# parseJSON jsonString         # Coming in v1.1

# Convert value to JSON string
# stringify value              # Coming in v1.1
```

See [Standard Library Reference](../stdlib/index.md) for complete API.

## Best Practices

### Naming Conventions

```iozen
# Variables: camelCase
create variable userName as text
create variable totalCount as integer

# Functions: camelCase
function calculateTotal takes items as array of integer returns integer

# Types: PascalCase
type UserProfile is
    firstName as text
    lastName as text
end
```

### Code Organization

```iozen
# Group related functionality
# --- Input Validation ---
function isValidEmail takes email as text returns boolean
    # implementation
end

function isValidAge takes age as integer returns boolean
    # implementation
end

# --- Data Processing ---
function processUser takes user as User returns nothing
    # implementation
end
```

### Error Handling (Future: v1.1)

```iozen
# Coming in v1.1: try/catch
# try
#     riskyOperation
# catch error
#     print "Error: " attach error
# end
```

### Performance Tips

1. **Use compiler for production**: `iozen compile --target binary`
2. **Minimize interpreter use**: 100x slower than compiled
3. **Pre-size arrays**: When possible, allocate expected size
4. **Reuse variables**: Avoid unnecessary declarations

## Examples

See [Examples Gallery](../examples/index.md) for complete programs:
- Calculator
- Todo list
- File processor
- API client
- Game (text adventure)

## Next Steps

- [Syntax Reference](../reference/syntax.md) - Complete syntax
- [Standard Library](../stdlib/index.md) - All built-in functions
- [CLI Guide](../cli/index.md) - Command-line tools
- [Examples](../examples/index.md) - Sample code

Happy coding! 🎉

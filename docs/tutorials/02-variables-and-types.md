# Tutorial 2: Variables and Types 📦

Learn about IOZEN's type system and how to work with different data types.

## What You'll Learn

- The four basic types in IOZEN
- How to declare variables
- Type conversions
- Working with different data

## The Four Basic Types

IOZEN has four fundamental types:

| Type | Description | Example |
|------|-------------|---------|
| `integer` | Whole numbers | `42`, `-10`, `0` |
| `decimal` | Numbers with decimals | `3.14`, `-0.5` |
| `text` | Strings of characters | `"Hello"` |
| `boolean` | True or false values | `true`, `false` |

## Creating Variables

### Full Syntax

```iozen
create variable <name> as <type> with value <value>
```

### Examples by Type

```iozen
# Integer - for counting, whole numbers
create variable age as integer with value 25
create variable year as integer with value 2024
create variable count as integer with value 0

# Decimal - for measurements, calculations
create variable price as decimal with value 19.99
create variable pi as decimal with value 3.14159
create var temperature as decimal with value -5.5

# Text - for names, messages, data
create variable name as text with value "Alice Johnson"
create var message as text with value "Hello, World!"
create var empty as text with value ""

# Boolean - for flags, states, conditions
create var isActive as boolean with value true
create var hasPermission as boolean with value false
create var isValid as boolean with value true
```

## Working with Variables

### Reassigning Values

Use `assign` to change a variable's value:

```iozen
create var score as integer with value 0
print "Initial score: " attach score

assign score with value 10
print "After update: " attach score

assign score with value score + 5
print "After adding 5: " attach score
```

**Output:**
```
Initial score: 0
After update: 10
After adding 5: 15
```

### Variable Naming Rules

✅ **Good names:**
- `userName`
- `totalScore`
- `isLoggedIn`
- `maxAttempts`

❌ **Bad names:**
- `x` (too short, not descriptive)
- `123name` (can't start with number)
- `user name` (no spaces allowed)
- `total-score` (no hyphens)

## Type-Specific Operations

### Integer Operations

```iozen
create var a as integer with value 17
create var b as integer with value 5

print "a + b = " attach a + b      # 22
print "a - b = " attach a - b      # 12
print "a * b = " attach a * b      # 85
print "a / b = " attach a / b      # 3 (integer division)
print "a mod b = " attach a mod b  # 2 (remainder)
```

### Decimal Operations

```iozen
create var x as decimal with value 10.5
create var y as decimal with value 2.5

print "x + y = " attach x + y      # 13.0
print "x - y = " attach x - y      # 8.0
print "x * y = " attach x * y      # 26.25
print "x / y = " attach x / y      # 4.2
```

### Text Operations

```iozen
create var firstName as text with value "John"
create var lastName as text with value "Doe"

# Concatenation with attach
create var fullName as text with value firstName attach " " attach lastName
print fullName    # John Doe

# Using string functions
create var len as integer with value string_length fullName
print "Length: " attach len    # 8
```

### Boolean Operations

```iozen
create var sunny as boolean with value true
create var warm as boolean with value true
create var weekend as boolean with value false

# Logical AND
print "Go to beach? " attach sunny and warm    # true

# Logical OR
print "Day off? " attach weekend or sunny      # true

# Logical NOT
print "Is it raining? " attach not sunny        # false

# Combined
print "Good day? " attach (sunny and warm) or weekend
```

## Arrays - Collections of Values

Arrays store multiple values of the same type:

```iozen
# Array of integers
create var scores as array of integer with values [85, 92, 78, 95, 88]

# Array of text
create var fruits as array of text with values ["Apple", "Banana", "Cherry"]

# Access elements (0-based index)
print "First score: " attach scores[0]    # 85
print "Second fruit: " attach fruits[1]   # Banana

# Array length
create var count as integer with value array_length scores
print "Number of scores: " attach count   # 5

# Add element
array_push scores 90
print "Added new score. Total: " attach array_length scores
```

## Complete Example: Student Info System

```iozen
# Student Information System

print "=== Student Information ==="
print ""

# Basic info
create var studentName as text with value "Emma Wilson"
create var studentId as integer with value 12345
create var gpa as decimal with value 3.75
create var isEnrolled as boolean with value true

print "Name: " attach studentName
print "ID: " attach studentId
print "GPA: " attach gpa
print "Enrolled: " attach isEnrolled

# Grades array
create var grades as array of integer with values [92, 88, 95, 87, 90]

print ""
print "Grades:"
for grade in grades do
    print "  " attach grade
end

# Calculate average
create var sum as integer with value 0
for g in grades do
    assign sum with value sum + g
end

create var average as decimal with value to_decimal sum / to_decimal array_length grades
print ""
print "Average: " attach average

# Status check
print ""
if average >= 90.0 then
    print "Status: Excellent! 🌟"
otherwise if average >= 80.0 then
    print "Status: Good 👍"
otherwise
    print "Status: Needs improvement 📚"
end
```

## Type Conversion

Sometimes you need to convert between types:

```iozen
# Integer to Decimal
create var i as integer with value 42
create var d as decimal with value to_decimal i
print i attach " → " attach d    # 42 → 42.0

# Decimal to Integer (truncates)
create var price as decimal with value 19.99
create var wholePrice as integer with value to_integer price
print price attach " → " attach wholePrice    # 19.99 → 19

# Number to Text
create var age as integer with value 25
create var ageText as text with value to_text age
print "I am " attach ageText attach " years old"
```

## Best Practices

1. **Use descriptive names:**
   ```iozen
   # Good
   create var userAge as integer with value 25
   
   # Bad
   create var a as integer with value 25
   ```

2. **Choose appropriate types:**
   ```iozen
   # Use integer for counting
   create var itemCount as integer with value 10
   
   # Use decimal for measurements
   create var weight as decimal with value 68.5
   
   # Use boolean for states
   create var isComplete as boolean with value false
   ```

3. **Initialize with meaningful values:**
   ```iozen
   # Good - clear initial state
   create var total as integer with value 0
   
   # Avoid - magic numbers without context
   create var x as integer with value 42
   ```

## Exercise: Create a Profile

Create a program that stores and displays:
- Your name (text)
- Your age (integer)
- Your height in meters (decimal)
- Whether you like programming (boolean)
- Your top 3 favorite foods (array of text)

**Bonus:** Calculate and display your age in months.

## Next Tutorial

→ [Tutorial 3: Control Flow](03-control-flow.md)

## Quick Reference

| Type | Declaration Example |
|------|---------------------|
| Integer | `create var x as integer with value 10` |
| Decimal | `create var x as decimal with value 3.14` |
| Text | `create var x as text with value "Hello"` |
| Boolean | `create var x as boolean with value true` |
| Array | `create var x as array of integer with values [1,2,3]` |

| Operation | Syntax |
|-----------|--------|
| Reassign | `assign x with value newValue` |
| Arithmetic | `x + y`, `x - y`, `x * y`, `x / y`, `x mod y` |
| Concatenate | `text1 attach text2` |
| Convert | `to_integer x`, `to_decimal x`, `to_text x` |

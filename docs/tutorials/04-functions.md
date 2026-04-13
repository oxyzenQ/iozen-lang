# Tutorial 4: Functions 📦

Learn how to organize your code using functions.

## What You'll Learn

- Defining and calling functions
- Parameters and return values
- Function best practices

## What is a Function?

A function is a reusable block of code that performs a specific task. Think of it like a recipe - you define it once, then use it whenever you need it.

## Defining Functions

### Basic Function

```iozen
function sayHello returns nothing
    print "Hello, World!"
end

# Call the function
sayHello
```

### Function with Parameters

```iozen
function greet takes name as text returns nothing
    print "Hello, " attach name attach "!"
end

greet "Alice"
greet "Bob"
```

### Function with Return Value

```iozen
function double takes x as integer returns integer
    return x * 2
end

create var result as integer with value double 5
print result    # 10
```

### Complete Function Example

```iozen
function calculateArea takes length as decimal, width as decimal returns decimal
    return length * width
end

# Calculate areas
create var room1 as decimal with value calculateArea 5.0 4.0
print "Room 1 area: " attach room1 attach " sq meters"

create var room2 as decimal with value calculateArea 6.5 3.5
print "Room 2 area: " attach room2 attach " sq meters"
```

## Parameter Types and Return Types

### Different Type Combinations

```iozen
# Integer → Integer
function square takes n as integer returns integer
    return n * n
end

# Integer, Integer → Integer
function add takes a as integer, b as integer returns integer
    return a + b
end

# Decimal → Decimal
function circleArea takes radius as decimal returns decimal
    return 3.14159 * radius * radius
end

# Text → Nothing (procedure)
function printBanner takes title as text returns nothing
    print "=================="
    print title
    print "=================="
end

# Boolean, Integer → Text
function getStatus takes isActive as boolean, count as integer returns text
    if isActive then
        return "Active with " attach count attach " items"
    otherwise
        return "Inactive"
    end
end
```

## Multiple Parameters

```iozen
function createUser takes username as text, age as integer, isAdmin as boolean returns text
    create var role as text with value "User"
    if isAdmin then
        assign role with value "Admin"
    end
    return username attach " (" attach age attach ") - " attach role
end

print createUser "alice" 25 false
print createUser "bob" 30 true
```

## Functions Calling Functions

```iozen
function square takes x as integer returns integer
    return x * x
end

function sumOfSquares takes a as integer, b as integer returns integer
    return square a + square b
end

print sumOfSquares 3 4    # 9 + 16 = 25
```

## Recursive Functions

A function that calls itself:

```iozen
function factorial takes n as integer returns integer
    if n <= 1 then
        return 1
    end
    return n * factorial (n - 1)
end

print factorial 5    # 120 (5 × 4 × 3 × 2 × 1)
```

```iozen
function fibonacci takes n as integer returns integer
    if n <= 1 then
        return n
    end
    return fibonacci (n - 1) + fibonacci (n - 2)
end

# Print first 10 Fibonacci numbers
for i from 0 to 9 do
    print "F(" attach i attach ") = " attach fibonacci i
end
```

## Practical Examples

### Math Utilities

```iozen
function max takes a as integer, b as integer returns integer
    if a > b then
        return a
    end
    return b
end

function min takes a as integer, b as integer returns integer
    if a < b then
        return a
    end
    return b
end

function absolute takes x as integer returns integer
    if x < 0 then
        return -x
    end
    return x
end

print "Max of 10, 5: " attach max 10 5
print "Min of 10, 5: " attach min 10 5
print "Absolute of -7: " attach absolute -7
```

### Grade Calculator

```iozen
function getLetterGrade takes score as integer returns text
    if score >= 90 then
        return "A"
    otherwise if score >= 80 then
        return "B"
    otherwise if score >= 70 then
        return "C"
    otherwise if score >= 60 then
        return "D"
    otherwise
        return "F"
    end
end

function getGradeMessage takes grade as text returns text
    if grade == "A" then
        return "Excellent! 🌟"
    otherwise if grade == "B" then
        return "Good job! 👍"
    otherwise if grade == "C" then
        return "Satisfactory ✓"
    otherwise if grade == "D" then
        return "Needs improvement 📚"
    otherwise
        return "Failed 😢"
    end
end

# Test with different scores
create var scores as array of integer with values [95, 82, 75, 68, 55]

for score in scores do
    create var grade as text with value getLetterGrade score
    print score attach "% = " attach grade attach " - " attach getGradeMessage grade
end
```

### Shopping Cart

```iozen
type Item is
    name as text
    price as decimal
    quantity as integer
end

function calculateItemTotal takes item as Item returns decimal
    return item.price * to_decimal item.quantity
end

function formatPrice takes price as decimal returns text
    return "$" attach price
end

# Create items
create var apple as Item
assign apple.name with value "Apple"
assign apple.price with value 0.5
assign apple.quantity with value 10

create var bread as Item
assign bread.name with value "Bread"
assign bread.price with value 2.5
assign bread.quantity with value 2

# Calculate
create var appleTotal as decimal with value calculateItemTotal apple
create var breadTotal as decimal with value calculateItemTotal bread
create var grandTotal as decimal with value appleTotal + breadTotal

print "Receipt:"
print apple.name attach " x " attach apple.quantity attach " = " attach formatPrice appleTotal
print bread.name attach " x " attach bread.quantity attach " = " attach formatPrice breadTotal
print "----------------"
print "Total: " attach formatPrice grandTotal
```

## Best Practices

### 1. Use Descriptive Names

```iozen
# Good
function calculateCircleArea takes radius as decimal returns decimal

# Bad
function calc takes r as decimal returns decimal
```

### 2. Keep Functions Focused

```iozen
# Good - does one thing
function isValidEmail takes email as text returns boolean
    # Only validates email format
end

# Bad - does too much
function processUser takes email as text, name as text, age as integer returns nothing
    # Validates, saves to database, sends email, logs activity...
end
```

### 3. Comment When Needed

```iozen
# Calculate the nth Fibonacci number using recursion
function fibonacci takes n as integer returns integer
    # Base case
    if n <= 1 then
        return n
    end
    # Recursive case
    return fibonacci (n - 1) + fibonacci (n - 2)
end
```

### 4. Handle Edge Cases

```iozen
function divide takes a as decimal, b as decimal returns decimal
    if b == 0.0 then
        print "Error: Cannot divide by zero"
        return 0.0
    end
    return a / b
end
```

## Exercise: Build a Calculator

Create a calculator with these functions:
1. `add`, `subtract`, `multiply`, `divide`
2. `calculate` that takes two numbers and an operation (+, -, *, /)
3. A main function that demonstrates all operations

**Bonus:** Add power function using a loop.

## Common Patterns

### Validation Pattern

```iozen
function processIfValid takes input as text returns boolean
    if not isValid input then
        print "Invalid input"
        return false
    end
    # Process valid input
    return true
end
```

### Early Return Pattern

```iozen
function findUser takes users as array of text, target as text returns integer
    create var i as integer with value 0
    while i < array_length users repeat
        if users[i] == target then
            return i    # Found it!
        end
        assign i with value i + 1
    end
    return -1    # Not found
end
```

## Next Tutorial

→ [Tutorial 5: Arrays and Structs](05-arrays-and-structs.md)

## Quick Reference

| Element | Syntax |
|---------|--------|
| Define function | `function name takes p as type returns type ... end` |
| Call function | `functionName argument` |
| Return value | `return expression` |
| No parameters | `function name returns type ... end` |
| No return | `returns nothing` |

**Remember:**
- Functions make code reusable
- One function = one task
- Use descriptive names
- Always return something (or use `nothing`)

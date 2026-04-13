# IOZEN Examples Gallery 🎨

Collection of example programs showcasing IOZEN features.

## Table of Contents

1. [Hello World](#hello-world)
2. [Basic Programs](#basic-programs)
3. [Math & Algorithms](#math--algorithms)
4. [Data Structures](#data-structures)
5. [File I/O](#file-io)
6. [Modules](#modules)
7. [Project Templates](#project-templates)

---

## Hello World

### Simple Hello

```iozen
# hello_simple.iozen
print "Hello, World!"
```

**Run:**
```bash
iozen run hello_simple.iozen
```

---

### Personalized Greeting

```iozen
# hello_personal.iozen

create variable name as text with value "Developer"
create variable greeting as text with value "Welcome to IOZEN"

print greeting attach ", " attach name attach "!"
print "Today is a great day to code."
```

**Output:**
```
Welcome to IOZEN, Developer!
Today is a great day to code.
```

---

## Basic Programs

### Calculator

```iozen
# calculator.iozen

function add takes a as decimal, b as decimal returns decimal
    return a + b
end

function subtract takes a as decimal, b as decimal returns decimal
    return a - b
end

function multiply takes a as decimal, b as decimal returns decimal
    return a * b
end

function divide takes a as decimal, b as decimal returns decimal
    return a / b
end

# Test
create var x as decimal with value 10.0
create var y as decimal with value 3.0

print "Add: " attach add x y
print "Subtract: " attach subtract x y
print "Multiply: " attach multiply x y
print "Divide: " attach divide x y
```

---

### Temperature Converter

```iozen
# temperature.iozen

function celsiusToFahrenheit takes c as decimal returns decimal
    return c * 9.0 / 5.0 + 32.0
end

function fahrenheitToCelsius takes f as decimal returns decimal
    return (f - 32.0) * 5.0 / 9.0
end

# Convert 25°C to F
create var c as decimal with value 25.0
create var f as decimal with value celsiusToFahrenheit c

print c attach "°C = " attach f attach "°F"

# Convert 98.6°F to C
create var f2 as decimal with value 98.6
create var c2 as decimal with value fahrenheitToCelsius f2

print f2 attach "°F = " attach c2 attach "°C"
```

---

### Number Guessing Game

```iozen
# guessing_game.iozen

# Note: Random not yet implemented, using fixed number
create var secret as integer with value 42
create var guess as integer with value 0
create var attempts as integer with value 0

create var guesses as array of integer with values [10, 25, 40, 42]

for g in guesses do
    assign attempts with value attempts + 1
    
    if g == secret then
        print "Correct! You guessed it in " attach attempts attach " attempts!"
        break
    otherwise if g < secret then
        print g attach " is too low"
    otherwise
        print g attach " is too high"
    end
end
```

---

## Math & Algorithms

### Fibonacci Sequence

```iozen
# fibonacci.iozen

function fibonacci takes n as integer returns integer
    if n <= 1 then
        return n
    end
    return fibonacci (n - 1) + fibonacci (n - 2)
end

# Generate first 10 Fibonacci numbers
print "Fibonacci Sequence:"
for i from 0 to 9 do
    print "F(" attach i attach ") = " attach fibonacci i
end
```

**Output:**
```
Fibonacci Sequence:
F(0) = 0
F(1) = 1
F(2) = 1
F(3) = 2
F(4) = 3
...
```

---

### Factorial

```iozen
# factorial.iozen

function factorial takes n as integer returns integer
    if n <= 1 then
        return 1
    end
    return n * factorial (n - 1)
end

# Calculate factorials
for i from 1 to 10 do
    print i attach "! = " attach factorial i
end
```

---

### Prime Numbers (Sieve)

```iozen
# prime_sieve.iozen

function isPrime takes n as integer returns boolean
    if n < 2 then
        return false
    end
    
    create var i as integer with value 2
    while i * i <= n repeat
        if n mod i == 0 then
            return false
        end
        assign i with value i + 1
    end
    
    return true
end

# Find primes up to 50
print "Prime numbers up to 50:"
create var count as integer with value 0

for n from 2 to 50 do
    if isPrime n then
        print n
        assign count with value count + 1
    end
end

print "Found " attach count attach " prime numbers"
```

---

### Quadratic Equation Solver

```iozen
# quadratic.iozen

function solveQuadratic takes a as decimal, b as decimal, c as decimal returns nothing
    create var discriminant as decimal with value b * b - 4.0 * a * c
    
    print "Solving: " attach a attach "x² + " attach b attach "x + " attach c attach " = 0"
    
    if discriminant < 0.0 then
        print "No real solutions"
    otherwise if discriminant == 0.0 then
        create var x as decimal with value -b / (2.0 * a)
        print "One solution: x = " attach x
    otherwise
        create var x1 as decimal with value (-b + sqrt discriminant) / (2.0 * a)
        create var x2 as decimal with value (-b - sqrt discriminant) / (2.0 * a)
        print "Two solutions: x1 = " attach x1 attach ", x2 = " attach x2
    end
end

# Solve: x² - 5x + 6 = 0 (solutions: 2, 3)
solveQuadratic 1.0 -5.0 6.0
```

---

## Data Structures

### Student Records

```iozen
# students.iozen

type Student is
    name as text
    age as integer
    grades as array of integer
end

function averageGrade takes s as Student returns decimal
    create var sum as integer with value 0
    
    for g in s.grades do
        assign sum with value sum + g
    end
    
    return to_decimal sum / to_decimal array_length s.grades
end

function printStudent takes s as Student returns nothing
    print "Name: " attach s.name
    print "Age: " attach s.age
    print "Grades: " attach stringify s.grades
    print "Average: " attach averageGrade s
    print ""
end

# Create students
create var alice as Student
assign alice.name with value "Alice"
assign alice.age with value 20
assign alice.grades with values [85, 90, 78, 92]

create var bob as Student
assign bob.name with value "Bob"
assign bob.age with value 21
assign bob.grades with values [75, 82, 88, 79]

# Print records
printStudent alice
printStudent bob
```

---

### Stack Implementation

```iozen
# stack.iozen

type Stack is
    items as array of integer
    capacity as integer
end

function newStack takes cap as integer returns Stack
    create var s as Stack
    assign s.items with values []
    assign s.capacity with value cap
    return s
end

function push takes s as Stack, item as integer returns boolean
    if array_length s.items >= s.capacity then
        print "Stack overflow!"
        return false
    end
    
    array_push s.items item
    return true
end

function pop takes s as Stack returns integer
    if array_length s.items == 0 then
        print "Stack underflow!"
        return -1
    end
    
    return array_pop s.items
end

function peek takes s as Stack returns integer
    if array_length s.items == 0 then
        return -1
    end
    
    return s.items[array_length s.items - 1]
end

# Test stack
create var stack as Stack with value newStack 5

push stack 10
push stack 20
push stack 30

print "Top: " attach peek stack
print "Popped: " attach pop stack
print "Popped: " attach pop stack
```

---

### Linked List (Conceptual)

```iozen
# linked_list.iozen

type Node is
    data as integer
    next as integer  # Index to next node (simplified)
end

# Simplified array-based linked list
type LinkedList is
    nodes as array of Node
    head as integer
    size as integer
end

# Note: Full pointer-based linked list requires
# more advanced memory management (coming in v2.0)
```

---

## File I/O

### Read and Process File

```iozen
# file_processor.iozen

# Check if file exists
if fileExists "data.txt" then
    create var content as text with value readFile "data.txt"
    print "File content:"
    print content
    
    # Count lines (conceptual)
    print "Processing complete"
otherwise
    print "File not found: data.txt"
end
```

---

### Write Configuration

```iozen
# config_writer.iozen

# Create configuration file
create var config as text with value "# IOZEN Configuration
name=MyApp
version=1.0.0
debug=false
"

writeFile "config.ini" config
print "Configuration saved to config.ini"
```

---

### Log Writer

```iozen
# logger.iozen

function log takes message as text returns nothing
    create var timestamp as text with value "2024-01-15 10:30:00"  # Fixed for demo
    create var entry as text with value "[" attach timestamp attach "] " attach message attach "\n"
    
    appendFile "app.log" entry
    print "Logged: " attach message
end

log "Application started"
log "Processing request"
log "Application finished"
```

---

## Modules

### Math Utilities Module

File: `math_utils.iozen`
```iozen
# math_utils.iozen - Reusable math module

export function square takes x as integer returns integer
    return x * x
end

export function cube takes x as integer returns integer
    return x * x * x
end

export function max takes a as integer, b as integer returns integer
    if a > b then
        return a
    end
    return b
end

export function min takes a as integer, b as integer returns integer
    if a < b then
        return a
    end
    return b
end
```

---

### Using the Module

File: `main.iozen`
```iozen
# main.iozen - Using math_utils module

use "math_utils"

print "Square of 5: " attach square 5
print "Cube of 3: " attach cube 3
print "Max of 10, 20: " attach max 10 20
print "Min of 10, 20: " attach min 10 20
```

---

### String Utilities Module

File: `string_utils.iozen`
```iozen
# string_utils.iozen

export function repeat takes s as text, n as integer returns text
    create var result as text with value ""
    for i from 1 to n do
        assign result with value result attach s
    end
    return result
end

export function padLeft takes s as text, length as integer, padChar as text returns text
    create var sLen as integer with value string_length s
    if sLen >= length then
        return s
    end
    
    create var padding as text with value ""
    for i from 1 to length - sLen do
        assign padding with value padding attach padChar
    end
    return padding attach s
end
```

---

## Project Templates

### CLI Application Template

```iozen
# cli_app.iozen

function showHelp returns nothing
    print "Usage: app [command]"
    print "Commands:"
    print "  greet <name>  - Greet someone"
    print "  calc <expr>   - Calculate expression"
    print "  help          - Show this help"
end

function greet takes name as text returns nothing
    print "Hello, " attach name attach "!"
end

function calculate takes a as integer, op as text, b as integer returns integer
    if op == "+" then
        return a + b
    otherwise if op == "-" then
        return a - b
    otherwise if op == "*" then
        return a * b
    otherwise if op == "/" then
        return a / b
    end
    return 0
end

# Main entry point
function main returns integer
    print "CLI App v1.0"
    
    # Simulate command processing
    create var command as text with value "greet"
    create var arg as text with value "World"
    
    if command == "greet" then
        greet arg
    otherwise if command == "calc" then
        print calculate 10 "+" 5
    otherwise if command == "help" then
        showHelp
    otherwise
        print "Unknown command"
        showHelp
    end
    
    return 0
end

main
```

---

### Library Template

```iozen
# mylib.iozen - Library template

# Library metadata
# Name: mylib
# Version: 1.0.0
# Description: Sample IOZEN library

# Private helper function
function helper takes x as integer returns integer
    return x + 1
end

# Public API
export function publicFunction takes x as integer returns integer
    return helper x
end

export function anotherFunction takes a as integer, b as integer returns integer
    return a * b
end
```

---

### Web Server (Conceptual)

```iozen
# web_server.iozen - Conceptual HTTP server

# Note: Network I/O not yet implemented
# This shows the structure for when it's available

type Request is
    method as text
    path as text
    headers as array of text
end

type Response is
    status as integer
    body as text
end

function handleRequest takes req as Request returns Response
    create var res as Response
    
    if req.path == "/" then
        assign res.status with value 200
        assign res.body with value "Welcome to IOZEN Server!"
    otherwise if req.path == "/api/data" then
        assign res.status with value 200
        assign res.body with value "{\"data\": [1, 2, 3]}"
    otherwise
        assign res.status with value 404
        assign res.body with value "Not Found"
    end
    
    return res
end

# Server would start here
print "Server concept (networking coming in v1.3)"
```

---

## Advanced Examples

### Sorting Algorithms

```iozen
# sorting.iozen

function bubbleSort takes arr as array of integer returns array of integer
    create var n as integer with value array_length arr
    create var i as integer with value 0
    
    while i < n repeat
        create var j as integer with value 0
        while j < n - i - 1 repeat
            if arr[j] > arr[j + 1] then
                # Swap
                create var temp as integer with value arr[j]
                assign arr[j] with value arr[j + 1]
                assign arr[j + 1] with value temp
            end
            assign j with value j + 1
        end
        assign i with value i + 1
    end
    
    return arr
end

# Test
create var numbers as array of integer with values [64, 34, 25, 12, 22, 11, 90]
print "Before: " attach stringify numbers

assign numbers with value bubbleSort numbers
print "After: " attach stringify numbers
```

---

### Binary Search

```iozen
# binary_search.iozen

function binarySearch takes arr as array of integer, target as integer returns integer
    create var left as integer with value 0
    create var right as integer with value array_length arr - 1
    
    while left <= right repeat
        create var mid as integer with value left + (right - left) / 2
        
        if arr[mid] == target then
            return mid
        end
        
        if arr[mid] < target then
            assign left with value mid + 1
        otherwise
            assign right with value mid - 1
        end
    end
    
    return -1  # Not found
end

# Test
create var sorted as array of integer with values [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
create var target as integer with value 23
create var result as integer with value binarySearch sorted target

if result != -1 then
    print "Found " attach target attach " at index " attach result
otherwise
    print target attach " not found"
end
```

---

## Running Examples

All examples can be run with:

```bash
# Interpreted (development)
iozen run example.iozen

# Compiled (production)
iozen compile example.iozen --target binary
./example
```

---

## Contributing Examples

Have a cool example? Contribute it!

1. Create a new `.iozen` file
2. Add comments explaining the code
3. Include sample output
4. Submit a pull request

---

See also:
- [Getting Started](../guide/getting-started.md) - Learn the basics
- [Language Guide](../guide/language-guide.md) - Detailed tutorial
- [Standard Library](../stdlib/index.md) - Built-in functions

# Tutorial 3: Control Flow 🔄

Learn how to make decisions and repeat actions in IOZEN.

## What You'll Learn

- Making decisions with if/else
- Repeating actions with loops
- Controlling loop flow with break/continue

## If Statements - Making Decisions

### Basic If

```iozen
create var temperature as integer with value 25

if temperature > 30 then
    print "It's hot! 🌞"
end
```

### If-Else

```iozen
create var score as integer with value 75

if score >= 60 then
    print "You passed! 🎉"
otherwise
    print "You failed. Study more! 📚"
end
```

### If-Else If-Else

```iozen
create var grade as text with value "B"

if grade == "A" then
    print "Excellent work! 🌟"
otherwise if grade == "B" then
    print "Good job! 👍"
otherwise if grade == "C" then
    print "Not bad, keep trying! 💪"
otherwise if grade == "D" then
    print "You passed, but barely. 📖"
otherwise
    print "Failed. Need to retake. 😢"
end
```

### Comparison Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `==` | Equal to | `x == 5` |
| `!=` | Not equal to | `x != 0` |
| `<` | Less than | `x < 10` |
| `>` | Greater than | `x > 0` |
| `<=` | Less than or equal | `x <= 100` |
| `>=` | Greater than or equal | `x >= 18` |

### Logical Operators

```iozen
create var age as integer with value 20
create var hasLicense as boolean with value true

# AND - both must be true
if age >= 18 and hasLicense then
    print "You can drive! 🚗"
end

# OR - at least one must be true
create var isWeekend as boolean with value false
create var isHoliday as boolean with value true

if isWeekend or isHoliday then
    print "No work today! 🎉"
end

# NOT - reverses the condition
if not isWeekend then
    print "It's a weekday. 📅"
end

# Combined conditions
if age >= 16 and (hasLicense or isHoliday) then
    print "Special condition met"
end
```

## Real-World Example: Login System

```iozen
# Simple login validator

function validateLogin takes username as text, password as text, isAdmin as boolean returns text
    create var validUsername as text with value "alice"
    create var validPassword as text with value "secret123"
    
    if username == validUsername and password == validPassword then
        if isAdmin then
            return "Admin login successful"
        otherwise
            return "User login successful"
        end
    otherwise if username == "" or password == "" then
        return "Error: Username and password required"
    otherwise
        return "Error: Invalid credentials"
    end
end

# Test cases
print validateLogin "alice" "secret123" false
print validateLogin "alice" "wrong" false
print validateLogin "" "secret123" false
print validateLogin "alice" "secret123" true
```

## While Loops - Repeat While Condition is True

### Basic While

```iozen
# Count from 1 to 5
create var i as integer with value 1

while i <= 5 repeat
    print "Count: " attach i
    assign i with value i + 1
end

print "Done!"
```

### Countdown

```iozen
# Countdown from 10
create var count as integer with value 10

while count > 0 repeat
    print count attach "..."
    assign count with value count - 1
end

print "🚀 Blast off!"
```

### User Input Simulation

```iozen
# Simulate processing items

function processItems takes items as array of text returns nothing
    create var index as integer with value 0
    
    while index < array_length items repeat
        print "Processing: " attach items[index]
        # Simulate work
        assign index with value index + 1
    end
    
    print "All items processed!"
end

create var tasks as array of text with values ["Email", "Report", "Meeting", "Code Review"]
processItems tasks
```

## For Loops - Iterate Over Ranges

### Counting Up

```iozen
# Print 1 to 10
for n from 1 to 10 do
    print n
end
```

### Counting Down

```iozen
# Countdown (simulated with while for now)
create var n as integer with value 10
while n >= 1 repeat
    print n
    assign n with value n - 1
end
```

### With Step

```iozen
# Even numbers (simulated)
for n from 2 to 20 do
    if n mod 2 == 0 then
        print n
    end
end
```

## For-In Loops - Iterate Over Arrays

```iozen
# Iterate through array

# Fruits
create var fruits as array of text with values ["Apple", "Banana", "Cherry", "Date"]

print "Fruit list:"
for fruit in fruits do
    print "- " attach fruit
end

# Numbers with calculation
create var numbers as array of integer with values [10, 20, 30, 40, 50]

create var sum as integer with value 0
for num in numbers do
    assign sum with value sum + num
end

print ""
print "Sum: " attach sum
print "Average: " attach sum / array_length numbers
```

## Break and Continue

### Break - Exit Loop Early

```iozen
# Find first number divisible by 7

for n from 1 to 100 do
    if n mod 7 == 0 then
        print "Found: " attach n
        break    # Exit the loop immediately
    end
end

print "Search complete"
```

### Continue - Skip to Next Iteration

```iozen
# Print only odd numbers

for n from 1 to 20 do
    if n mod 2 == 0 then
        continue    # Skip even numbers
    end
    print n    # Only prints odd numbers
end
```

### Combined Example

```iozen
# Search for a specific item

function findItem takes items as array of text, target as text returns integer
    create var index as integer with value 0
    
    while index < array_length items repeat
        create var current as text with value items[index]
        
        # Skip empty items
        if current == "" then
            assign index with value index + 1
            continue
        end
        
        # Found it!
        if current == target then
            return index
        end
        
        assign index with value index + 1
    end
    
    return -1    # Not found
end

create var shoppingList as array of text with values ["Milk", "Eggs", "Bread", "Butter"]
create var position as integer with value findItem shoppingList "Bread"

if position != -1 then
    print "Found at position: " attach position
otherwise
    print "Item not found"
end
```

## Complete Example: Menu System

```iozen
# Simple menu system

function showMenu returns nothing
    print ""
    print "=== MAIN MENU ==="
    print "1. View Balance"
    print "2. Deposit"
    print "3. Withdraw"
    print "4. Exit"
    print "================"
end

function processChoice takes choice as integer, balance as decimal returns decimal
    if choice == 1 then
        print "Current balance: $" attach balance
        return balance
    otherwise if choice == 2 then
        create var amount as decimal with value 100.0
        print "Deposited: $" attach amount
        return balance + amount
    otherwise if choice == 3 then
        create var amount as decimal with value 50.0
        if amount <= balance then
            print "Withdrew: $" attach amount
            return balance - amount
        otherwise
            print "Insufficient funds!"
            return balance
        end
    otherwise if choice == 4 then
        print "Goodbye!"
        return balance
    otherwise
        print "Invalid choice"
        return balance
    end
end

# Simulate running the menu
create var currentBalance as decimal with value 500.0
create var running as boolean with value true
create var choice as integer with value 0

# Simulated choices
create var choices as array of integer with values [1, 2, 1, 3, 4]
create var choiceIndex as integer with value 0

while running repeat
    showMenu
    
    # Get next simulated choice
    if choiceIndex < array_length choices then
        assign choice with value choices[choiceIndex]
        assign choiceIndex with value choiceIndex + 1
        print "You selected: " attach choice
    otherwise
        assign running with value false
        break
    end
    
    if choice == 4 then
        assign running with value false
    end
    
    assign currentBalance with value processChoice choice currentBalance
    print ""
end

print "Final balance: $" attach currentBalance
```

## Exercise: Number Guessing Game

Create a simple number guessing game:

1. The "computer" picks a number (hardcoded for now)
2. The player has 5 attempts to guess
3. After each guess, tell them if it's too high or too low
4. If they guess right, congratulate them
5. If they run out of attempts, reveal the number

**Hints:**
- Use a while loop for attempts
- Use if/else to check the guess
- Use break to exit early if they win

## Common Patterns

### Counting Pattern

```iozen
create var count as integer with value 0
while count < target repeat
    # Do something
    assign count with value count + 1
end
```

### Accumulation Pattern

```iozen
create var sum as integer with value 0
for x in numbers do
    assign sum with value sum + x
end
```

### Search Pattern

```iozen
create var found as boolean with value false
create var i as integer with value 0

while i < array_length items and not found repeat
    if items[i] == target then
        assign found with value true
    otherwise
        assign i with value i + 1
    end
end
```

## Next Tutorial

→ [Tutorial 4: Functions](04-functions.md)

## Quick Reference

| Structure | Syntax |
|-----------|--------|
| If | `if condition then ... end` |
| If-Else | `if condition then ... otherwise ... end` |
| If-Else If | `if ... otherwise if ... otherwise ... end` |
| While | `while condition repeat ... end` |
| For Range | `for var from start to end do ... end` |
| For Array | `for var in array do ... end` |
| Break | `break` |
| Continue | `continue` |

| Operator | Meaning |
|----------|---------|
| `and` | Both must be true |
| `or` | At least one true |
| `not` | Reverse the condition |

# Tutorial 1: Your First IOZEN Program 🚀

Welcome to IOZEN! In this tutorial, you'll write your first program and learn the basics.

## What You'll Learn

- How to create an IOZEN project
- Basic syntax structure
- Running and compiling programs

## Step 1: Create a Project

Open your terminal and run:

```bash
iozen init hello_iozen
cd hello_iozen
```

This creates a new project with:
- `iozen.json` - Project configuration
- `main.iozen` - Your main program file
- `README.md` - Project documentation
- `iozen_modules/` - Where dependencies go

## Step 2: Open main.iozen

The default `main.iozen` looks like this:

```iozen
# hello_iozen — IOZEN Project
# Created with IOZEN CLI v1.0.0

print "Hello, World from hello_iozen!"

create variable version as text with value "1.0.0"
print "Running on IOZEN v" attach version

# Try writing your own code below:
create variable x as integer with value 10
create variable y as integer with value 20
print x attach " + " attach y attach " = " attach x + y
```

## Step 3: Run the Program

Run it in interpreted mode (fast for development):

```bash
iozen run main.iozen
```

**Output:**
```
⚙  Running main.iozen
Hello, World from hello_iozen!
Running on IOZEN v1.0.0
10 + 20 = 30
  ✔ Success
```

## Step 4: Modify the Program

Let's add a greeting function. Edit `main.iozen`:

```iozen
# hello_iozen — IOZEN Project

print "=== My First IOZEN Program ==="
print ""

# Function to greet someone
function greet takes name as text returns nothing
    print "Hello, " attach name attach "! Welcome to IOZEN."
end

# Call the function
greet "Developer"
greet "World"

# Variables
create var myName as text with value "Alice"
create var myAge as integer with value 25

print ""
print "My name is " attach myName
print "I am " attach myAge attach " years old"

# Simple math
create var a as integer with value 15
create var b as integer with value 7

print ""
print a attach " + " attach b attach " = " attach a + b
print a attach " - " attach b attach " = " attach a - b
print a attach " * " attach b attach " = " attach a * b
print a attach " / " attach b attach " = " attach a / b
```

## Step 5: Run Your Modified Program

```bash
iozen run main.iozen
```

**Output:**
```
=== My First IOZEN Program ===

Hello, Developer! Welcome to IOZEN.
Hello, World! Welcome to IOZEN.

My name is Alice
I am 25 years old

15 + 7 = 22
15 - 7 = 8
15 * 7 = 105
15 / 7 = 2
```

## Step 6: Compile to Native Binary

For production, compile to a native binary (100x faster!):

```bash
iozen compile main.iozen --target binary --output hello
./hello
```

## What You Learned

✅ Creating projects with `iozen init`  
✅ Running programs with `iozen run`  
✅ Basic print statements  
✅ Creating variables with `create var`  
✅ Defining functions with `function`  
✅ String concatenation with `attach`  
✅ Basic arithmetic operations  
✅ Compiling to native binary

## Exercises

Try these on your own:

1. **Change the greeting** - Modify the `greet` function to ask "How are you?"

2. **Add more math** - Calculate the area of a rectangle (length × width)

3. **Temperature conversion** - Convert Celsius to Fahrenheit using the formula: `F = C × 9/5 + 32`

4. **Personal info** - Create variables for your favorite color, food, and hobby, then print them

## Next Tutorial

→ [Tutorial 2: Variables and Types](02-variables-and-types.md)

## Quick Reference

| Task | Command |
|------|---------|
| Create project | `iozen init <name>` |
| Run program | `iozen run <file>` |
| Compile to binary | `iozen compile <file> --target binary` |
| Print | `print "message"` |
| Create variable | `create var name as type with value X` |
| Define function | `function name takes param as type returns type` |

Happy coding! 🎉

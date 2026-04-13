# Getting Started with IOZEN 🚀

Welcome! This guide will get you up and running with IOZEN in 5 minutes.

## Installation

### Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js
- GCC or Clang (for compiling to binaries)

### Install IOZEN

```bash
# Using Bun (fastest)
bun add -g iozen-lang

# Verify installation
iozen version
```

Expected output:
```
IOZEN v1.0.0
Safe, expressive systems programming language
```

## Your First Program

### 1. Create a New Project

```bash
iozen init hello_world
cd hello_world
```

This creates:
```
hello_world/
├── iozen.json      # Project manifest
├── main.iozen      # Entry point
├── README.md       # Project readme
└── iozen_modules/  # Dependencies
```

### 2. Run the Program

```bash
iozen run main.iozen
```

Output:
```
Hello, World from hello_world!
Running on IOZEN v1.0.0
10 + 20 = 30
```

### 3. Edit Your Code

Open `main.iozen` and modify it:

```iozen
# hello_world/main.iozen

print "Hello, World!"

# Variables
create variable name as text with value "IOZEN Developer"
print "Welcome, " attach name

# Simple math
create variable a as integer with value 15
create variable b as integer with value 25
print a attach " + " attach b attach " = " attach a + b

# Functions
function square takes x as integer returns integer
    return x * x
end

print "5 squared = " attach square 5
```

### 4. Compile to Native Binary

```bash
iozen compile main.iozen --target binary --output hello
./hello
```

**Performance boost**: 100x faster than interpreted! 🚀

## Language Basics

### Variables

```iozen
# Explicit type declaration
create variable count as integer with value 10
create variable message as text with value "Hello"
create variable active as boolean with value true

# Type inference (optional syntax coming in v1.1)
# create variable score = 100  # integer inferred
```

### Functions

```iozen
# Function with parameters and return type
function add takes a as integer, b as integer returns integer
    return a + b
end

# Function with no return (returns nothing)
function greet takes name as text returns nothing
    print "Hello, " attach name
end

# Calling functions
create variable result as integer with value add 5 3
greet "World"
```

### Control Flow

```iozen
# If/else
create variable age as integer with value 18

if age >= 18 then
    print "You are an adult"
otherwise
    print "You are a minor"
end

# While loop
create variable i as integer with value 0
while i < 5 repeat
    print "Count: " attach i
    assign i with value i + 1
end

# For loop
for n from 1 to 5 do
    print "Number: " attach n
end
```

### Arrays

```iozen
# Create array
create variable numbers as array of integer with values [1, 2, 3, 4, 5]

# Access elements
create variable first as integer with value numbers[0]
print "First: " attach first

# Array operations
create variable length as integer with value array_length numbers
print "Length: " attach length

# Iterate
for num in numbers do
    print "Number: " attach num
end
```

### Structs

```iozen
# Define struct
type Person is
    name as text
    age as integer
end

# Create instance
create variable person as Person
assign person.name with value "Alice"
assign person.age with value 30

print person.name attach " is " attach person.age attach " years old"
```

## Next Steps

- **[Language Guide](language-guide.md)** - Complete language tutorial
- **[Syntax Reference](../reference/syntax.md)** - All syntax details
- **[Standard Library](../stdlib/index.md)** - Built-in functions
- **[Examples](../examples/index.md)** - Sample programs

## Common Commands

```bash
# Run a program
iozen run file.iozen

# Compile to C code
iozen compile file.iozen --target c

# Compile to binary
iozen compile file.iozen --target binary

# Initialize project
iozen init project_name

# Install dependencies
iozen install

# List installed packages
iozen list

# Interactive shell
iozen repl
```

## Troubleshooting

### "command not found: iozen"

Make sure Bun/Node global bin directory is in your PATH:
```bash
export PATH="$HOME/.bun/bin:$PATH"
```

### Compilation errors

Ensure GCC or Clang is installed:
```bash
# Ubuntu/Debian
sudo apt-get install gcc

# macOS
xcode-select --install

# Verify
gcc --version
```

### Permission denied when running binary

```bash
chmod +x ./binary_name
./binary_name
```

## Getting Help

- 📖 [Full Documentation](../README.md)
- 🐛 [GitHub Issues](https://github.com/oxyzenQ/iozen-lang/issues)
- 💬 [Discussions](https://github.com/oxyzenQ/iozen-lang/discussions)

Happy coding! 🎉

<div align="center">

# IOZEN 🔷

**Safe, expressive systems programming with natural language syntax**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-v1.0.0-green?style=flat-square)]()
[![Bootstrap: TypeScript](https://img.shields.io/badge/bootstrap-TypeScript-3178C6?style=flat-square&logo=typescript)]()
[![Status](https://img.shields.io/badge/status-stable-success?style=flat-square)]()

> *IOZEN reads like English, compiles like C, performs like Rust.*

[Getting Started](docs/guide/getting-started.md) • [Documentation](docs/README.md) • [Examples](examples/README.md)

</div>

---

## What is IOZEN?

IOZEN is a systems programming language that combines **natural language syntax** with **native performance**. Code reads like English but compiles to efficient C code and native binaries.

```iozen
# Hello World in IOZEN
print "Hello, World!"

# Variables
create variable message as text with value "Welcome to IOZEN"
print message

# Functions
function greet takes name as text returns nothing
    print "Hello, " attach name attach "!"
end

greet "Developer"
```

### Key Features

- 🚀 **Native Performance** — Compiles to C code and native binaries (100x faster than interpreted)
- 📝 **Readable Syntax** — Natural English-like code that's self-documenting
- 📦 **Package Manager** — Built-in dependency management with `iozen.json`
- 🛡️ **Type Safety** — Static type checking with explicit type annotations
- 🔧 **Modern Tooling** — CLI with run, compile, build, and interactive REPL

### Key Principles

- **Clarity first** — Code should read like prose; `create variable x as integer with value 42`
- **Zero-cost abstractions** — High-level constructs compile to efficient machine code
- **Fast feedback** — Interpret for development, compile for production
- **Growing ecosystem** — Package manager and standard library included

## Quick Start

### Install

```bash
# Using Bun (recommended)
bun add -g iozen-lang

# Or clone for development
git clone https://github.com/oxyzenQ/iozen-lang.git
cd iozen-lang
```

### Create Your First Program

```bash
# Create a new project
iozen init hello_world
cd hello_world

# Project structure:
# hello_world/
# ├── iozen.json      # Project manifest
# ├── main.iozen      # Entry point
# ├── README.md       # Project readme
# └── iozen_modules/  # Dependencies
```

### Run and Compile

```bash
# Run interpreted (fast feedback)
iozen run main.iozen

# Compile to native binary (production)
iozen compile main.iozen --target binary --output hello
./hello
```

**Performance boost**: Compiled binaries are **100x faster** than interpreted code! 🚀

## v1.0 Features 🎉

IOZEN v1.0 is a complete, usable programming language with:

### Core Language ✅
- **Variables**: Explicit type declarations with `create variable`
- **Functions**: Parameters, return types, recursion
- **Control Flow**: if/else, while, for loops with break/continue
- **Arrays**: Dynamic arrays with push, length, iteration
- **Structs**: Custom types with field access
- **Modules**: Import/export for code organization

### Development Tools ✅
- **CLI**: `iozen run`, `compile`, `build`, `init`, `install`, `list`
- **REPL**: Interactive shell for experimentation
- **Package Manager**: `iozen.json` with dependencies
- **Compiler**: C backend producing native binaries

### Standard Library ✅
- **String**: length, concat, substring, indexOf, split, join
- **Math**: abs, sqrt, pow, sin, cos, floor, ceil
- **Array**: length, push, pop
- **File I/O**: readFile, writeFile, fileExists, appendFile
- **JSON**: parseJSON, stringify

## Language Examples

### Variables and Types
```iozen
create variable name as text with value "Alice"
create variable age as integer with value 30
create variable pi as decimal with value 3.14159
create variable active as boolean with value true

# Reassignment
assign age with value 31
```

### Functions
```iozen
function greet takes name as text returns nothing
    print "Hello, " attach name attach "!"
end

function add takes a as integer, b as integer returns integer
    return a + b
end

greet "World"
print add 5 3
```

### Control Flow
```iozen
if score >= 90 then
    print "Grade A"
otherwise if score >= 80 then
    print "Grade B"
otherwise
    print "Grade C"
end

# Loops
for i from 1 to 10 do
    print i
end

while running repeat
    # ...
end
```

### Arrays
```iozen
create var numbers as array of integer with values [1, 2, 3, 4, 5]

# Access
print numbers[0]

# Iterate
for n in numbers do
    print n
end

# Modify
array_push numbers 6
```

### Structs
```iozen
type Person is
    name as text
    age as integer
end

create var p as Person
assign p.name with value "Bob"
assign p.age with value 25

print p.name attach " is " attach p.age attach " years old"
```

### Modules
```iozen
# math_utils.iozen
export function square takes x as integer returns integer
    return x * x
end

# main.iozen
use "math_utils"
print square 5
```

### FizzBuzz — The Classic

```iozen
function fizzbuzz takes n as integer returns nothing
    for i from 1 to n do
        if i mod 15 == 0 then
            print "FizzBuzz"
        otherwise if i mod 3 == 0 then
            print "Fizz"
        otherwise if i mod 5 == 0 then
            print "Buzz"
        otherwise
            print i
        end
    end
end

fizzbuzz 100
```

### File I/O

```iozen
# Read and process a file
if fileExists "data.txt" then
    create var content as text with value readFile "data.txt"
    print content
end

# Write to file
writeFile "output.txt" "Hello, File!"

# Append to log
appendFile "app.log" "New entry\n"
```

## Features

| Feature | Description | Status |
|---|---|---|
| **Natural Language Syntax** | Keywords like `create variable`, `function`, `if/then/otherwise` make code self-documenting | ✅ v1.0 |
| **Native Compilation** | Compiles to C code and native binaries (100x faster) | ✅ v1.0 |
| **Type Safety** | Static typing with `integer`, `decimal`, `text`, `boolean`, `array` | ✅ v1.0 |
| **Package Manager** | `iozen init`, `install`, `list` with `iozen.json` | ✅ v1.0 |
| **Standard Library** | String, Math, Array, File I/O, JSON functions | ✅ v1.0 |
| **REPL** | Interactive shell for experimentation | ✅ v1.0 |
| **Memory Safety** | Ownership system (v1.1+) | 🔄 Planned |
| **Borrow Checker** | Compile-time borrow checking (v2.0) | 📋 Future |
| **Concurrency** | Async/await (v1.3) | 📋 Planned |
| **LLVM Backend** | Direct LLVM IR generation (v2.0) | 📋 Future |
| **Self-Hosting** | Compiler written in IOZEN (v2.0+) | 📋 Future |

## Language Comparison

| Aspect | IOZEN | Python | Rust | C |
|---|:---:|:---:|:---:|:---:|
| **Readability** | ★★★★★ | ★★★★★ | ★★★☆☆ | ★★☆☆☆ |
| **Performance** | ★★★★★ | ★★☆☆☆ | ★★★★★ | ★★★★★ |
| **Compilation** | AOT to native | Interpreted | AOT | AOT |
| **Type Safety** | Static | Dynamic | Static | Weak |
| **Learning Curve** | Low | Low | Steep | Medium |
| **Package Manager** | ✅ Built-in | ✅ pip | ✅ cargo | ❌ None |
| **Memory Management** | Manual (v1.0) | GC | Ownership | Manual |
| **Natural Syntax** | ✅ | Partial | ❌ | ❌ |
| **Native Binary** | ✅ | ❌ | ✅ | ✅ |
| **FFI (C interop)** | ✅ | Partial | ✅ | Native |

### IOZEN Positioning

**IOZEN sits between Python and Rust:**
- **Python users**: Get native performance without losing readability
- **Rust users**: Get similar performance with simpler syntax
- **C users**: Get modern features with familiar compilation model

## Roadmap

### v1.0 (June 2026) ✅ Current
- ✅ Core language: variables, functions, control flow, arrays, structs
- ✅ Native compilation: IOZEN → C → Binary
- ✅ Package manager: iozen.json, init, install, list
- ✅ Standard library: String, Math, File I/O, JSON
- ✅ Documentation: Complete guides and examples

### v1.1 (July-Aug 2026) 🔄 Planned
- Struct field access (`person.name`)
- Exception handling (try/catch)
- Closures in compiled code
- Package publishing

### v1.2 (Sep-Oct 2026) 📋 Planned
- LSP Server for IDE support
- Code formatter
- Debugger

### v1.3 (Nov-Dec 2026) 📋 Planned
- Async/await concurrency
- FFI (call C libraries)
- Network I/O

### v2.0 (2027) 🔮 Vision
- LLVM backend (no C intermediate)
- WebAssembly target
- Full borrow checker
- Self-hosting compiler

> The bootstrap language (TypeScript) doesn't determine the final language. Once self-hosting is achieved, TypeScript will be discarded entirely — just as Rust bootstrapped from OCaml.

## CLI Commands

```bash
# Create new project
iozen init <project-name>

# Run a program (interpreted)
iozen run <file.iozen>

# Compile to native binary
iozen compile <file.iozen> --target binary [--output <name>]

# Install dependencies
iozen install [<package-name>]

# List installed packages
iozen list

# Interactive REPL
iozen repl

# Debug: Show tokens
iozen tokens <file.iozen>

# Debug: Show AST
iozen ast <file.iozen>

# Show version
iozen version
```

### IOZEN vs Cargo

| IOZEN | Cargo | Description |
|---|---|---|
| `iozen init myproject` | `cargo new myproject` | Create new project |
| `iozen run main.iozen` | `cargo run` | Run project |
| `iozen compile main.iozen --target binary` | `cargo build --release` | Build release binary |
| `iozen install` | `cargo install` | Install dependencies |
| `iozen list` | `cargo list` | List packages |

## Standard Library

See full documentation at [docs/stdlib/index.md](docs/stdlib/index.md).

### Math Functions
`abs`, `sqrt`, `pow`, `sin`, `cos`, `floor`, `ceil`, `round`

### String Functions
`string_length`, `string_concat`, `substring`, `string_indexOf`, `string_contains`, `string_split`, `string_join`

### Array Functions
`array_length`, `array_push`

### File I/O
`readFile`, `writeFile`, `fileExists`, `appendFile`

### JSON
`parseJSON`, `stringify`

## Documentation

- **[Getting Started](docs/guide/getting-started.md)** - Install and first program
- **[Language Guide](docs/guide/language-guide.md)** - Complete language tutorial
- **[Syntax Reference](docs/reference/syntax.md)** - Full syntax documentation
- **[Standard Library](docs/stdlib/index.md)** - Built-in functions API
- **[CLI Reference](docs/cli/index.md)** - Command-line tools
- **[Examples](examples/README.md)** - Sample programs

## Project Structure

```
iozen/
├── bootstrap/           # Self-hosting compiler components
├── docs/               # Documentation
│   ├── guide/          # Tutorials
│   ├── reference/      # Syntax reference
│   ├── stdlib/         # Standard library docs
│   ├── cli/            # CLI documentation
│   └── examples/       # Example code
├── examples/           # Example programs
│   ├── basics/         # Beginner examples
│   ├── intermediate/   # Intermediate examples
│   └── advanced/       # Advanced examples
├── iozen-cli/          # CLI implementation
│   └── src/
│       └── cli.ts      # CLI entry point
├── src/lib/iozen/      # Core language implementation
│   ├── tokenizer_v2.ts # Lexer
│   ├── parser_v2.ts    # Parser
│   ├── interpreter_v2.ts # Interpreter
│   ├── compiler/       # C backend compiler
│   └── package_manager.ts # Package manager
├── tests/              # Test suite
├── CONTRIBUTING.md
├── LICENSE             # MIT
├── README.md           # This file
└── ROADMAP.md          # Project roadmap
```

## Contributing

We welcome contributions of all kinds — bug fixes, new features, documentation improvements, or even just ideas. Please read our [Contributing Guide](./CONTRIBUTING.md) to get started.

## License

IOZEN is released under the [MIT License](./LICENSE).

---

<div align="center">

**Built with ❤ by the IOZEN community**

*IOZEN reads like English, compiles like Rust.*

</div>

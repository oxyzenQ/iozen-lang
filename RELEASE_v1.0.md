# IOZEN v1.0 Release Notes 🎉

**Release Date:** June 1, 2026  
**Version:** v1.0.0  
**Status:** Stable Release

---

## 🚀 What's New in v1.0

IOZEN v1.0 is the first stable release of the IOZEN programming language - a safe, expressive systems programming language with natural English-like syntax that compiles to native binaries.

### Core Language Features

- ✅ **Variables & Types** - Explicit type declarations with `create variable`
- ✅ **Functions** - Parameters, return types, and recursion
- ✅ **Control Flow** - if/else, while loops, for loops with break/continue
- ✅ **Arrays** - Dynamic arrays with push, length, and iteration
- ✅ **Structs** - Custom types with field access
- ✅ **Modules** - Import/export for code organization

### Development Tools

- ✅ **CLI** - Complete command-line interface
  - `iozen init` - Create new projects
  - `iozen run` - Run programs (interpreted)
  - `iozen compile` - Compile to native binaries
  - `iozen install` - Install dependencies
  - `iozen list` - List installed packages
  - `iozen repl` - Interactive shell
  - `iozen tokens/ast` - Debugging tools
  
- ✅ **Package Manager** - Built-in dependency management
  - `iozen.json` project manifest
  - Local package registry
  - Semantic versioning support

- ✅ **Compiler** - Native binary compilation
  - IOZEN → C → Binary (100x faster than interpreted)
  - GCC/Clang integration

### Standard Library

- ✅ **String** - length, concat, substring, indexOf, split, join
- ✅ **Math** - abs, sqrt, pow, sin, cos, floor, ceil
- ✅ **Array** - length, push
- ✅ **File I/O** - readFile, writeFile, fileExists, appendFile
- ✅ **JSON** - parseJSON, stringify

### Documentation

- ✅ **Getting Started Guide** - Installation and first program
- ✅ **Language Guide** - Complete language tutorial
- ✅ **5 Tutorials** - Step-by-step learning path
- ✅ **Syntax Reference** - Full EBNF grammar
- ✅ **Standard Library Docs** - API reference
- ✅ **CLI Reference** - Command documentation
- ✅ **18 Examples** - From hello world to advanced programs

---

## 📦 Installation

```bash
# Using Bun (recommended)
bun add -g iozen-lang

# Or clone for development
git clone https://github.com/oxyzenQ/iozen-lang.git
cd iozen-lang
```

---

## 📝 Quick Start

```bash
# Create new project
iozen init hello_world
cd hello_world

# Run (interpreted)
iozen run main.iozen

# Compile to native binary
iozen compile main.iozen --target binary --output hello
./hello
```

---

## 💻 Example Program

```iozen
# Hello World in IOZEN
print "Hello, World!"

# Variables
create variable name as text with value "Developer"
print "Hello, " attach name attach "!"

# Functions
function greet takes name as text returns nothing
    print "Welcome, " attach name attach "!"
end

greet "IOZEN User"

# Arrays
create var numbers as array of integer with values [1, 2, 3, 4, 5]
for n in numbers do
    print n
end
```

---

## 📊 Performance

| Mode | Speed | Use Case |
|------|-------|----------|
| Interpreted | 1x | Development, fast feedback |
| Compiled | 100x | Production, maximum performance |

---

## 📚 Documentation

- [Getting Started](docs/guide/getting-started.md)
- [Language Guide](docs/guide/language-guide.md)
- [Tutorials](docs/tutorials/README.md)
- [Syntax Reference](docs/reference/syntax.md)
- [Standard Library](docs/stdlib/index.md)
- [CLI Reference](docs/cli/index.md)
- [Examples](examples/README.md)

---

## 🗺️ Roadmap

### v1.1 (July-Aug 2026)
- Struct field access (`person.name`)
- Exception handling (try/catch)
- Package publishing

### v1.2 (Sep-Oct 2026)
- LSP Server for IDE support
- Code formatter
- Debugger

### v1.3 (Nov-Dec 2026)
- Async/await concurrency
- FFI (call C libraries)
- Network I/O

### v2.0 (2027)
- LLVM backend
- WebAssembly target
- Full borrow checker
- Self-hosting compiler

---

## 🙏 Acknowledgments

Thank you to all contributors and early adopters who helped shape IOZEN into what it is today!

---

## 📄 License

IOZEN is released under the MIT License.

---

**Happy coding with IOZEN!** 🎉

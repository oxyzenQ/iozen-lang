<div align="center">

**Safe, expressive systems programming with natural language syntax**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-v0.1.0-orange?style=flat-square)]()
[![Bootstrap: TypeScript](https://img.shields.io/badge/bootstrap-TypeScript-3178C6?style=flat-square&logo=typescript)]()
[![Phase](https://img.shields.io/badge/phase-0%20%7C%201%20%7C%202%20%7C%203%20%7C%204%20%7C%205%20%7C%206%20%7C%207%20%7C%208-green?style=flat-square)]()

> *IOZEN reads like English, compiles like Rust.*

</div>

---

## What is IOZEN?

IOZEN is a systems programming language that combines **Rust-like memory safety** (ownership & borrowing) with **natural language syntax**. It provides compile-time memory guarantees *without* lifetime annotations, using readable keywords that make code self-documenting and accessible to a wider audience of developers.

The vision: a language as safe as Rust, but as readable as Python. A language where `create variable x as integer with value 42` replaces `let x: i32 = 42;` — not because symbols are bad, but because clarity should be the default.

### Key Principles

- **Memory safety without the pain** — ownership and borrowing enforced at compile time, no garbage collector, no lifetime annotations
- **Natural language first** — code that reads like prose; `when x is greater than 5 do` instead of `if x > 5 {`
- **Zero-cost abstractions** — high-level constructs compile down to efficient machine code
- **Self-hosting goal** — IOZEN's compiler will eventually be written in IOZEN itself

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ or [Bun](https://bun.sh/)
- Git

### Install

```bash
# Clone the repository
git clone https://github.com/iozen-lang/iozen.git
cd iozen

# Install dependencies
npm install
```

### Hello World

Create a file called `hello.iozen`:

```iozen
fn main() {
    print("Hello, World!")
}
```

### Run

```bash
# Using tsx (recommended)
npx tsx iozen-cli/src/run.ts run hello.iozen

# Or with bun
bun run iozen-cli/src/run.ts run hello.iozen
```

### Demo: Fastfetch Clone

IOZEN can now display system information:

```bash
npx tsx iozen-cli/src/run.ts run examples/fastfetch.iozen
```

Output:
```
  ╭─────────────── System Information ───────────────╮
  │                                                  │
  │  OS:       Linux                                 │
  │  Host:     desktop                               │
  │  User:     user                                  │
  │  CPU:      AMD Ryzen 5 5600G                     │
  │  RAM:      8GB / 16GB                            │
  │  Uptime:   3h 42m                                │
  │                                                  │
  ╰──────────────────────────────────────────────────╯
```

### Build Standalone Binary

```bash
bun run iozen-cli/src/cli.ts build main.iozen --output my_program
./my_program
```

## Week 1: v0.1 Features

IOZEN v0.1 can now compile and execute real programs!

### Features
- ✅ Functions: `fn main() { ... }`
- ✅ Print: `print("Hello")`
- ✅ String concatenation: `"OS: " + get_os()`
- ✅ Built-in system functions: `get_os()`, `get_cpu()`, `get_ram()`, `get_uptime()`

### Examples

**Hello World:**
```iozen
fn main() {
    print("Hello, World!")
}
```

**System Info:**
```iozen
fn main() {
    print("OS: " + get_os())
}
```

### Control Flow

```iozen
create variable score as integer with value 85

when score is greater than or equal to 90 do
    print "Grade: A"
otherwise when score is greater than or equal to 80 do
    print "Grade: B"
otherwise when score is greater than or equal to 70 do
    print "Grade: C"
otherwise do
    print "Grade: F"
end
```

### Loops

```iozen
# Repeat loop
repeat 5 times
    print "IOZEN is awesome!"
end

# While loop
create variable i as integer with value 0
while i is less than 5 do
    print "Count: " attach i
    increase i by 1
end

# For each loop
create variable fruits as list with value ["apple", "banana", "cherry"]
for each fruit in fruits do
    print "I like " attach fruit
end
```

### Structures

```iozen
structure Point
    field x as integer
    field y as integer
end

create variable origin as Point with x = 0 and y = 0
create variable target as Point with x = 3 and y = 4
print "Origin: (" attach origin.x attach ", " attach origin.y attach ")"
```

### Lists

```iozen
create variable numbers as list with value [10, 20, 30, 40, 50]
print "Count: " attach length(numbers)
print "Sum: " attach sum(numbers)
print "Sorted: " attach sort(numbers)

push(numbers, 60)
print "After push: " attach numbers
```

### Error Handling with Result Type

```iozen
function safe_divide with a as integer and b as integer returns integer
    when b equals 0 do
        return 0
    end
    return a / b
end

create variable result as integer with value safe_divide with 10 and 3
print "10 / 3 = " attach result
```

### FizzBuzz — The Classic

```iozen
function fizzbuzz with n as integer returns nothing
    create variable i as integer with value 1
    while i is less than or equal to n do
        create variable mod3 as integer with value i % 3
        create variable mod5 as integer with value i % 5

        when mod3 equals 0 and mod5 equals 0 do
            print i attach " → FizzBuzz"
        otherwise when mod3 equals 0 do
            print i attach " → Fizz"
        otherwise when mod5 equals 0 do
            print i attach " → Buzz"
        otherwise do
            print i attach " → " attach i
        end

        increase i by 1
    end
end

fizzbuzz with 30
```

## Features

| Feature | Description |
|---|---|
| **Natural Language Syntax** | Keywords like `create variable`, `when`, `otherwise`, `repeat`, `function` make code self-documenting |
| **Memory Safety** | Ownership and borrowing system inspired by Rust — no data races, no use-after-free |
| **No Lifetime Annotations** | Ownership rules enforced without explicit `'a` lifetime parameters |
| **Strong Static Typing** | `integer`, `float`, `boolean`, `text`, `character`, `list`, `pointer`, `address` |
| **Pattern Matching** | Powerful `when`/`otherwise`/`check` branching for expressive control flow |
| **Error Handling** | Built-in `Result` type for explicit, safe error propagation |
| **Algebraic Data Types** | `structure`, `enum`, `union` for modeling complex domains |
| **Generics** | Type parameters for reusable, type-safe abstractions |
| **Concurrency** | `task`, `send`, `receive`, `parallel` for safe concurrent programming |
| **FFI** | `declare external` to call C functions directly |
| **Self-Hosting Path** | Bootstrap compiler in TypeScript; self-hosting lexer already working |

## Language Comparison

| Aspect | IOZEN | Rust | C++ |
|---|:---:|:---:|:---:|
| **Readability** | ★★★★★ | ★★★☆☆ | ★★☆☆☆ |
| **Memory Safety** | ★★★★★ | ★★★★★ | ★★☆☆☆ |
| **No Lifetime Annotations** | ✅ | ❌ | N/A |
| **Learning Curve** | Low | Steep | Steep |
| **Ownership System** | ✅ | ✅ | ❌ |
| **Borrow Checker** | ✅ | ✅ | ❌ |
| **Natural Language Syntax** | ✅ | ❌ | ❌ |
| **Type Inference** | ✅ | ✅ | Partial |
| **Pattern Matching** | ✅ | ✅ | C++23 |
| **Error Propagation** | `Result` type | `Result`/`Option` | Exceptions |
| **Self-Hosting** | In progress | ✅ | ❌ |
| **Garbage Collector** | ❌ | ❌ | ❌ |
| **FFI (C interop)** | ✅ | ✅ | Native |

## Bootstrap Roadmap

IOZEN follows the classic bootstrapping path pioneered by languages like Rust (OCaml → Rust). TypeScript serves as the temporary bootstrap language — once IOZEN can compile itself, TypeScript will no longer be needed.

- [x] **Phase 0** — TypeScript bootstrap compiler (lexer, parser, tree-walking interpreter, CLI)
- [x] **Phase 1** — Self-hosting lexer written in IOZEN (`bootstrap/lexer.iozen`)
- [x] **Phase 2** — Self-hosting parser written in IOZEN (`bootstrap/parser.iozen`)
- [x] **Phase 3** — Self-hosting interpreter/codegen written in IOZEN
- [x] **Phase 4** — Full self-hosting: Static Semantic Type/Borrow Checking (`bootstrap/typechecker.iozen`)
- [x] **Phase 5** — Code Generation: IOZEN to C99 Compiler (`bootstrap/codegen_c.iozen`)
- [x] **Phase 6** — Unified Self-Hosting Compiler (`bootstrap/iozenc.iozen`)
- [x] **Phase 7** — First Real Tools: Calculator and Prime Sieve in IOZEN
- [x] **Phase 8** — Native Binary Compilation: IOZEN → C99 → Executable
- [ ] **Phase 9** — Full Self-Hosting: iozenc compiles itself completely

```
Source → Lexer → Parser → Typechecker → Codegen → C99 → Binary
          (1)      (2)        (4)          (5)      (8)
           \________________________________________/
                    iozenc.iozen (Phases 6-8) ✅
```

### Phase 6 Final Features

The IOZENC compiler now supports the full IOZEN language:

| Category | Features |
|----------|----------|
| **Comparisons** | `is greater than`, `is less than or equal to`, `equals`, symbolic operators |
| **Strings** | `attach` operator for concatenation |
| **Loops** | `repeat N times`, `for each item in list`, `while` |
| **Control Flow** | `when`/`otherwise`, `match`/`case`, `exit`, `continue` |
| **Functions** | Declaration, `with` style calls, recursion |
| **Error Handling** | `try`/`catch`/`throw` |
| **Types** | `integer`, `float`, `text`, `boolean`, `list`, `map` |
| **Compilation** | IOZEN → C99 → Native binary (via gcc/clang) |

> The bootstrap language doesn't determine the final language. Rust was bootstrapped from OCaml, Go from C, Zig from C++. Once self-hosting is achieved, the bootstrap language is discarded entirely.

## CLI Commands

```bash
# Run an IOZEN program
iozen run <file.iozen>

# Compile to standalone binary (requires Bun)
iozen build <file.iozen> [--output <name>]

# Create a new IOZEN project
iozen init <project-name>

# Inspect tokens (debugging)
iozen tokens <file.iozen>

# Inspect AST (debugging)
iozen ast <file.iozen>

# Show version
iozen version
```

### CLI vs Cargo Comparison

| IOZEN | Rust | Description |
|---|---|---|
| `iozen init myproject` | `cargo new myproject` | Create new project |
| `iozen run main.iozen` | `cargo run` | Run project |
| `iozen build main.iozen` | `cargo build --release` | Build binary |
| `iozen tokens main.iozen` | — | Inspect tokens |
| `iozen ast main.iozen` | — | Inspect AST |

## Built-in Functions

### Math
`abs`, `sqrt`, `floor`, `ceil`, `round`, `power`, `min`, `max`

### String
`length`, `uppercase`, `lowercase`, `trim`, `substring`, `contains`, `replace`, `split`, `char_at`, `ord`, `chr`

### List
`push`, `pop`, `sort`, `reverse`, `join`, `range`, `sum`, `length`

### Type Conversion
`to_integer`, `to_float`, `to_text`

## Project Structure

```
iozen/
├── bootstrap/
│   └── lexer.iozen              # Self-hosting lexer written in IOZEN (Phase 1)
├── iozen-cli/
│   ├── src/
│   │   └── cli.ts              # CLI entry point
│   └── examples/
│       ├── hello.iozen          # Hello World
│       ├── fibonacci.iozen      # Fibonacci sequence
│       ├── fizzbuzz.iozen       # FizzBuzz challenge
│       └── prime.iozen          # Prime number sieve
├── src/lib/iozen/
│   ├── index.ts                # Module exports
│   ├── tokens.ts               # Token type definitions (60+ tokens)
│   ├── lexer.ts                # Lexical analyzer / tokenizer
│   ├── ast.ts                  # AST node types (30+ nodes)
│   ├── parser.ts               # Recursive descent parser
│   ├── interpreter.ts          # Tree-walking interpreter (40+ built-ins)
│   └── environment.ts          # Lexical scoping & runtime environment
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── PULL_REQUEST_TEMPLATE.md
├── CONTRIBUTING.md
├── LICENSE                     # MIT
├── README.md
├── package.json
└── tsconfig.json
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

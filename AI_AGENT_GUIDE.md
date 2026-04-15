# 🤖 AI Agent Guide: IOZEN Language Project

> **For AI Agents:** Read this first before working on this codebase.
> **Last Updated:** April 15, 2026
> **Current Phase:** Native Compiler v2 (Turing Complete, Compiles to C → Native Binary)

---

## 🎯 Project Overview

**IOZEN** is a systems programming language experiment focusing on:
- Safe parallelism (work-stealing scheduler implemented)
- Type-driven memory safety model
- Fast execution with minimal runtime
- Natural language syntax

**Current Status:** Working compiler that compiles IOZEN → C99 → Native Binary

---

## ✅ What's DONE (Current State)

### Core Language (Interpreter + Compiler)
- Tokenizer v2, Parser v2, Interpreter v2 — all working
- **Full compiler pipeline**: IOZEN → Tokenizer → Parser → AST → IR → IR Optimizer → C Backend → Native Binary
- **82/82 compiler tests passing**
- **374/375 interpreter tests passing** (1 pre-existing edge case)

### Language Features (v2 Compiler)
- Variables: `let x = 10`, `let x: number = 42`
- Math operators: `+ - * / %`
- Comparison: `== != < > <= >=`
- Logical: `&& || !`
- Unary: `-` (negation), `!` (not)
- Boolean literals: `true`, `false`
- String literals: `"hello world"`
- **String+number coercion**: `"Count: " + x` auto-converts
- String concatenation: `"hello" + " " + "world"`
- If/else, else-if chains
- While loops, for loops
- Break and continue
- Functions with typed parameters and return values
- Recursive functions (fibonacci, etc.)
- **Arrays**: `[1, 2, 3]`, `arr[0]`, array push
- **Structs**: declaration, instantiation, field access, field mutation
- **Match expressions**: pattern matching with guards and wildcards
- **Enums**: `enum Color { Red, Green, Blue }`, `Color.Red` → integer constants
- **Lambdas/Closures**: `fn(x) { return x + 1 }`, captures variables from enclosing scope
- **Try/catch/throw**: exception handling via setjmp/longjmp in C
- Print function
- Comments: `// single line`

### Compiler Optimizations
- Constant propagation (loop-aware with back-edge detection)
- Dead code elimination (transitive usage analysis)
- Algebraic simplification (x+0→x, x*1→x, x*0→0, etc.)
- Constant folding at IR level
- Copy propagation through store/load chains
- Type inference for untyped declarations

### Compiler Infrastructure
- C keyword name mangling (double→iz_double, etc.)
- C99 compliant output with `_GNU_SOURCE`
- Integer modulo fix for C backend
- Dynamic struct types in C backend
- String-to-number coercion via `to_string` IR op

---

## 🏗️ Architecture

### Pipeline
```
.iozen file → tokenizer → parser → AST → IR → IR Optimizer → C Backend → gcc → Native Binary
```

### Key Files

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/iozen/tokenizer_v2.ts` | Lexical analysis | ✅ Working |
| `src/lib/iozen/parser_v2.ts` | Parse to AST | ✅ Working |
| `src/lib/iozen/interpreter_v2.ts` | Execute AST | ✅ Working |
| `src/lib/iozen/compiler/index.ts` | Compiler entry point | ✅ Working |
| `src/lib/iozen/compiler/ir.ts` | IR definitions | ✅ Working |
| `src/lib/iozen/compiler/ast-to-ir.ts` | AST to IR conversion | ✅ Working |
| `src/lib/iozen/compiler/ir-optimizer.ts` | IR optimization passes | ✅ Working |
| `src/lib/iozen/compiler/c-backend.ts` | IR to C99 codegen | ✅ Working |
| `iozen-cli/src/cli.ts` | CLI entry | ✅ Working |
| `src/lib/iozen/chase_lev.ts` | Work-stealing deque | ✅ Experimental |
| `src/lib/iozen/atomic_types.ts` | Type-driven safety | ✅ Experimental |
| `tests/test_compiler.ts` | Compiler test suite (82 tests) | ✅ 82/82 |

### Runtime Components (Advanced, Not Used in v0.4)
- **Chase-Lev deque:** Lock-free work-stealing queue
- **Shared memory model:** Type-driven atomic safety
- **Scheduler:** Work-stealing thread pool

**Note:** These runtime components exist but are NOT used by the current compiler pipeline. They were built first (unusual approach). The language is currently compiled via C backend.

---

## 🚀 How to Run

### Prerequisites
- Bun installed (`bun --version`)
- gcc or clang (for native binary compilation)

### Running Programs

```bash
# Compile and run as native binary
cd iozen-lang-dev
bun iozen-cli/src/cli.ts compile examples/hello.iozen --run

# Or just interpret
bun iozen-cli/src/cli.ts run examples/hello.iozen
```

### Running Tests

```bash
# Compiler tests (73 tests, end-to-end binary compilation)
bun tests/test_compiler.ts

# Full test suite (375 tests including interpreter)
bun tests/test_all.ts
```

---

## 📝 IOZEN Language Syntax (v0.4)

```iozen
// Variables with type inference
let x = 42
let name = "IOZEN"

// Functions with typed parameters
fn add(a: number, b: number): number {
    return a + b
}

// Structs
struct Point {
    x: number
    y: number
}

let p = Point { x: 10, y: 20 }
print(p.x)

// Match expressions (like Rust)
fn classify(n: number): string {
    match n {
        0 => "zero"
        1 => "one"
        _ => "many"
    }
}

// String+number coercion
print("Result: " + 42)

// Arrays
let arr = [1, 2, 3]
print(arr[0])

// Control flow
if (x > 0) {
    print("positive")
} else {
    print("non-positive")
}

// Loops
for (let i = 0; i < 10; i = i + 1) {
    if (i == 5) { break; }
}

// Boolean and logical ops
let flag = true && !false

// Enums
enum Color { Red, Green, Blue }
let c = Color.Red  // c = 0

// Closures/Lambdas
let adder = fn(x: number, y: number): number {
    return x + y
}
print(adder(3, 4))  // 7

// Try/catch
try {
    // risky code
} catch (e) {
    print("caught: " + e)
}
```

---

## 🔧 Built-in Functions

### System Info
- `get_os()`, `get_cpu()`, `get_ram()`, `get_disk()`, `get_shell()`, `get_resolution()`

### String Functions
- `length(str)`, `upper(str)`, `lower(str)`, `pad(str, len)`
- `split(str, delim)`, `join(arr, delim)`, `substring(str, start, end)`
- `indexOf(str, substr)`, `lastIndexOf(str, substr)`, `contains(str, substr)`

### Math Functions
- `round(n)`, `floor(n)`, `ceil(n)`, `abs(n)`
- `max(a, b)`, `min(a, b)`
- `sin(x)`, `cos(x)`, `sqrt(x)`, `pow(base, exp)`
- Constants: `pi`, `e`

### File I/O
- `readFile(path)`, `writeFile(path, content)`, `exists(path)`

---

## ⚠️ Important Notes for AI Agents

### 1. Two-Codebase Architecture
1. **Working v2 Pipeline** (current): tokenizer_v2, parser_v2, interpreter_v2, compiler/
2. **Advanced Runtime** (experimental): chase_lev, atomic_types, work_stealing_pool

**Focus on the v2 files for language work.**

### 2. Compilation Target
- Primary: C99 backend (current)
- Future: LLVM backend (v2.0)
- Runtime: Bun for development, gcc/clang for native binary

### 3. Current Limitations
- No module/import system yet
- Limited struct method dispatch (fields only)
- Match only supports literal patterns (no destructuring)
- No generic types
- Closures generated but not yet callable as first-class values (lambda_call not wired)

---

## 🎯 Next Steps

### High Priority
- Module system (import/export)
- Callable closures (lambda_call IR to C function pointer invocation)
- For-in loops

### Medium Priority
- Generic types
- SIMD vectorization
- LLVM backend
- Self-hosting compiler

### Low Priority
- GUI/REPL improvements
- Package manager improvements
- Standard library expansion

---

## 💬 User's Working Style

Based on previous sessions:
- Prefers **rapid iteration** ("gas week1", "gas all")
- Wants **working demos** over perfect code
- Uses **Bun** as primary runtime
- Appreciates **honest assessment** over sugar-coating
- Focuses on **tangible progress** (fastfetch clone as milestone)
- GitHub: `oxyzenQ` / `oxyzenQ/iozen-lang`

**Approach:** Keep it practical, show working output, don't over-engineer.

---

**End of AI Agent Guide**

*This guide ensures continuity if the user switches AI agents. Current state: IOZEN v0.4 is a working native compiler with structs, enums, match, closures, try/catch, arrays, and 82/82 tests passing.*

# 🤖 AI Agent Guide: IOZEN Language Project

> **For AI Agents:** Read this first before working on this codebase.
> **Last Updated:** April 12, 2026
> **Current Phase:** Week 3 Complete (Turing Complete Language)

---

## 🎯 Project Overview

**IOZEN** is a systems programming language experiment focusing on:
- Safe parallelism (work-stealing scheduler implemented)
- Type-driven memory safety model
- Fast execution with minimal runtime

**Current Status:** Working interpreter that can run real programs!

---

## ✅ What's DONE (Current State)

### Week 1: Basic Interpreter ✅
- Tokenizer v2 (`tokenizer_v2.ts`)
- Parser v2 (`parser_v2.ts`) 
- Interpreter v2 (`interpreter_v2.ts`)
- CLI that runs `.iozen` files

### Week 2: Variables & System Info ✅
- Variables: `let x = 10`
- Math operators: `+ - * / %`
- Comparison: `== != < > <= >=`
- Colors: `color("red", "text")`
- System functions: `get_os()`, `get_cpu()`, `get_ram()`, `get_disk()`, `get_shell()`, `get_resolution()`
- String functions: `length()`, `upper()`, `lower()`, `pad()`

### Week 3: Control Flow ✅ **(JUST COMPLETED)**
- `if/else` statements
- `while` loops
- `for` loops
- `break` and `continue`
- Return from functions
- **IOZEN is now TURING COMPLETE!**

---

## 🏗️ Architecture

### Pipeline
```
.iozen file → tokenizer → parser → interpreter → output
```

### Key Files

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/iozen/tokenizer_v2.ts` | Lexical analysis | ✅ Working |
| `src/lib/iozen/parser_v2.ts` | Parse to AST | ✅ Working |
| `src/lib/iozen/interpreter_v2.ts` | Execute AST | ✅ Working |
| `iozen-cli/src/cli.ts` | CLI entry | ✅ Working |
| `src/lib/iozen/chase_lev.ts` | Work-stealing deque | ✅ Implemented (not used) |
| `src/lib/iozen/atomic_types.ts` | Type-driven safety | ✅ Implemented (not used) |

### Runtime Components (Advanced, Not Used in v0.3)
- **Chase-Lev deque:** Lock-free work-stealing queue
- **Shared memory model:** Type-driven atomic safety
- **Scheduler:** Work-stealing thread pool

**Note:** These runtime components exist but are NOT used by the current interpreter. They were built first (unusual approach). The language is currently interpreted.

---

## 🚀 How to Run

### Prerequisites
- Bun installed (`bun --version`)
- Node.js for tsx fallback

### Running Programs

```bash
# Using Bun (RECOMMENDED)
cd /home/rezky/Desktop/iozen-lang
bun iozen-cli/src/cli.ts run examples/fastfetch.iozen

# Using tsx (fallback)
npx tsx iozen-cli/src/cli.ts run examples/fastfetch.iozen
```

### Working Examples

```bash
# Basic hello world
bun iozen-cli/src/cli.ts run examples/hello.iozen

# System info display (colors!)
bun iozen-cli/src/cli.ts run examples/fastfetch_v2.iozen

# Control flow demo (if/else, loops)
bun iozen-cli/src/cli.ts run examples/control_flow.iozen
```

---

## 📝 IOZEN Language Syntax (v0.3)

```iozen
// Comments start with //

fn main() {
    // Variables
    let name = "IOZEN"
    let version = 0.3
    
    // Print
    print("Hello, " + name)
    
    // If/else
    if (version >= 1.0) {
        print("Production ready!")
    } else if (version >= 0.5) {
        print("Getting there...")
    } else {
        print("Early development")
    }
    
    // While loop
    let count = 3
    while (count > 0) {
        print(count)
        count = count - 1
    }
    
    // For loop style (using while)
    let i = 0
    while (i < 5) {
        if (i == 3) {
            break  // exit loop
        }
        if (i % 2 == 0) {
            i = i + 1
            continue  // skip iteration
        }
        print("odd: " + i)
        i = i + 1
    }
    
    // System info
    print("OS: " + get_os())
    print("CPU: " + get_cpu())
    print("RAM: " + get_ram())
    
    // Colors
    print(color("green", "Success!"))
    print(color("red", "Error!"))
    
    // String functions
    print(upper("hello"))     // HELLO
    print(lower("WORLD"))     // world
    print(length("test"))     // 4
    print(pad("hi", 6))       // "  hi  "
    
    // Math
    let result = (10 + 5) * 2 / 3
    print(round(result))      // 10
}
```

---

## 🔧 Built-in Functions

### System Info
- `get_os()` - Returns "Linux", "macOS", or "Windows"
- `get_cpu()` - CPU model name
- `get_ram()` - "used / total" in GB
- `get_uptime()` - "Xh Ym" format
- `get_hostname()` - Computer name
- `get_user()` - Current username
- `get_shell()` - Shell name (zsh, bash, etc.)
- `get_disk()` - Disk usage "used / total"
- `get_resolution()` - Screen resolution "1920x1080"

### Colors (ANSI)
- `color(colorName, text)` - Wrap text with ANSI color
- Colors: `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`
- Bright variants: `brightRed`, `brightGreen`, `brightCyan`, etc.

### String Functions
- `length(str)` - String length
- `upper(str)` - To uppercase
- `lower(str)` - To lowercase
- `pad(str, length, char?)` - Center pad with char (default space)

### Math Functions
- `round(n)`, `floor(n)`, `ceil(n)`
- `abs(n)` - Absolute value
- `max(a, b)`, `min(a, b)`

---

## 🧪 Testing

### Quick Test
```bash
# Test all examples
bun iozen-cli/src/cli.ts run examples/hello.iozen
bun iozen-cli/src/cli.ts run examples/fastfetch.iozen
bun iozen-cli/src/cli.ts run examples/fastfetch_v2.iozen
bun iozen-cli/src/cli.ts run examples/control_flow.iozen
```

### Test Files Location
- `tests/v0.1/test_tokenizer.ts`
- `tests/v0.1/test_parser.ts`
- `tests/v0.1/test_interpreter.ts`

---

## 📁 Project Structure

```
iozen-lang/
├── iozen-cli/
│   └── src/
│       └── cli.ts              # CLI entry point
├── src/
│   └── lib/
│       └── iozen/
│           ├── tokenizer_v2.ts   # Lexer (WORKING)
│           ├── parser_v2.ts      # Parser (WORKING)
│           ├── interpreter_v2.ts # Interpreter (WORKING)
│           ├── chase_lev.ts     # Work-stealing deque (ADVANCED, unused)
│           ├── atomic_types.ts  # Type safety (ADVANCED, unused)
│           └── ...              # Other advanced runtime files
├── examples/
│   ├── hello.iozen              # Basic test
│   ├── fastfetch.iozen          # System info v1
│   ├── fastfetch_v2.iozen       # System info with colors
│   └── control_flow.iozen       # Turing complete demo
├── tests/
│   └── v0.1/
│       └── test_*.ts            # Unit tests
├── ROADMAP_v0.1.md              # Original roadmap
├── AI_AGENT_GUIDE.md           # This file!
└── README.md                    # User-facing docs
```

---

## ⚠️ Important Notes for AI Agents

### 1. Runtime vs Language
- **Language (interpreter):** Working and usable
- **Runtime (scheduler/memory):** Advanced but NOT integrated
- Current execution is purely interpreted, NOT using the work-stealing scheduler

### 2. Two Codebases in One
This repo contains TWO projects:
1. **Working Interpreter** (Week 1-3) - `tokenizer_v2.ts`, `parser_v2.ts`, `interpreter_v2.ts`
2. **Advanced Runtime** (Experimental) - `chase_lev.ts`, `atomic_types.ts`, `work_stealing_pool.ts`

**Focus on the v2 files for language work.**

### 3. Bun Compatibility
- Use `bun` to run (faster)
- If Bun fails, use `npx tsx` as fallback
- Some exports use `export type` for Bun compatibility

### 4. Current Limitations
- No arrays yet
- No structs/objects yet
- No modules/imports
- Functions can't return values properly (return statement works but limited)
- No compile-to-binary (interpreted only)

---

## 🎯 Next Steps (What to Build Next)

### Option 1: Week 4 - Arrays & Structs
- Add array syntax: `let arr = [1, 2, 3]`
- Add array indexing: `arr[0]`
- Add struct/object syntax

### Option 2: Polish & Release
- Write comprehensive README
- Create more examples
- Add error handling improvements
- Package for distribution

### Option 3: Integrate Runtime (HARD)
- Connect interpreter to work-stealing scheduler
- Enable parallel execution
- This is complex and not recommended yet

### Option 4: Compiler (HARD)
- Compile to JavaScript/Node.js
- Or compile to native via LLVM
- Major undertaking

**Recommended:** Option 1 or 2. Get language feature-complete before optimizing.

---

## 🤝 Working with This Codebase

### DO:
- ✅ Use the v2 pipeline (tokenizer_v2, parser_v2, interpreter_v2)
- ✅ Test with Bun: `bun iozen-cli/src/cli.ts run examples/hello.iozen`
- ✅ Look at examples in `examples/` folder for syntax reference
- ✅ Check `src/lib/iozen/index.ts` for exports

### DON'T:
- ❌ Touch the advanced runtime files (chase_lev, atomic_types) unless specifically asked
- ❌ Try to integrate scheduler with interpreter (complex task)
- ❌ Break existing examples
- ❌ Add features without testing

---

## 🆘 Need Help?

### Check These First:
1. `examples/` - Working code examples
2. `src/lib/iozen/interpreter_v2.ts` - Built-in functions at top
3. `src/lib/iozen/parser_v2.ts` - Grammar understanding
4. `tests/v0.1/` - How features are tested

### Common Issues:
- **"Token not found"** → Add to `tokenizer_v2.ts` KEYWORDS
- **"Expected )"** → Parser issue, check expression parsing
- **"Unknown function"** → Add to `interpreter_v2.ts` BUILTINS

---

## 📊 Project Metrics

| Metric | Value |
|--------|-------|
 Lines of Code | ~3000 (v2 pipeline) |
| Working Examples | 4 |
| Test Coverage | Basic |
| Runtime Components | 10+ (advanced, unused) |
| Current Phase | Week 3 Complete |
| Status | **Turing Complete** ✅ |

---

## 🔗 Quick Links

- **Examples:** `/home/rezky/Desktop/iozen-lang/examples/`
- **Core Language:** `/home/rezky/Desktop/iozen-lang/src/lib/iozen/*_v2.ts`
- **CLI:** `/home/rezky/Desktop/iozen-lang/iozen-cli/src/cli.ts`
- **Tests:** `/home/rezky/Desktop/iozen-lang/tests/v0.1/`

---

## 💬 User's Working Style

Based on previous sessions:
- Prefers **rapid iteration** ("gas week1", "gas all")
- Wants **working demos** over perfect code
- Uses **Bun** as primary runtime
- Appreciates **honest assessment** over sugar-coating
- Focuses on **tangible progress** (fastfetch clone as milestone)

**Approach:** Keep it practical, show working output, don't over-engineer.

---

**End of AI Agent Guide**

*This guide ensures continuity if the user switches AI agents. Current state: IOZEN v0.3 is a working, Turing-complete interpreted language.*

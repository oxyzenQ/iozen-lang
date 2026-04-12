# IOZEN Language Roadmap

> **Current Status:** v0.3 - Turing Complete Language ✅
> **Last Updated:** April 12, 2026
> **See Also:** `AI_AGENT_GUIDE.md` for technical details for AI agents

## 🎯 Project Overview

IOZEN is a systems programming language experiment with two parallel tracks:
1. **Working Interpreter** (Week 1-3 ✅ COMPLETE) - Usable language now!
2. **Advanced Runtime** (Experimental) - Work-stealing scheduler, memory safety model

## ✅ ACHIEVED: Working Language (v0.3)

IOZEN can now run real programs:

```iozen
fn main() {
    // Variables
    let name = "IOZEN"
    let version = 0.3

    // System info with colors
    print(color("cyan", "System Information"))
    print("OS: " + get_os())
    print("CPU: " + get_cpu())
    print("RAM: " + get_ram())

    // Control flow
    if (version >= 1.0) {
        print("Production ready!")
    } else {
        print("In development")
    }

    // Loops
    let i = 0
    while (i < 3) {
        print("Count: " + i)
        i = i + 1
    }
}
```

**Output:**
```
System Information
OS: Linux
CPU: AMD Ryzen 7 5800HS
RAM: 14GB / 15GB
In development
Count: 0
Count: 1
Count: 2
```

---

## ✅ COMPLETED: Week 1-3 Features

### Week 1: Core Language ✅
- ✅ Tokenizer, Parser, Interpreter (v2)
- ✅ CLI: `iozen run file.iozen`
- ✅ Functions, print statements
- ✅ String concatenation

### Week 2: Variables & System Info ✅
- ✅ Variables: `let x = 10`
- ✅ Math: `+ - * / %`
- ✅ Comparison: `== != < > <= >=`
- ✅ Colors: `color("red", "text")`
- ✅ System: `get_os()`, `get_cpu()`, `get_ram()`, `get_disk()`, `get_shell()`, `get_resolution()`
- ✅ String functions: `length()`, `upper()`, `lower()`, `pad()`

### Week 3: Control Flow ✅ **(TURING COMPLETE!)**
- ✅ `if/else` statements
- ✅ `while` loops
- ✅ `for` loops
- ✅ `break` and `continue`
- ✅ Return from functions
- ✅ Working examples: `fastfetch.iozen`, `control_flow.iozen`

## 🚀 HOW TO RUN

```bash
# Using Bun (recommended)
bun iozen-cli/src/cli.ts run examples/fastfetch_v2.iozen

# Examples
bun iozen-cli/src/cli.ts run examples/hello.iozen           # Basic
bun iozen-cli/src/cli.ts run examples/fastfetch.iozen       # System info
bun iozen-cli/src/cli.ts run examples/fastfetch_v2.iozen    # With colors
bun iozen-cli/src/cli.ts run examples/control_flow.iozen    # Loops demo
```

---

## 📅 ROADMAP: Future Phases

### Phase 4: Arrays & Structs (Next)
**Goal:** Add compound data types

Features:
- Arrays: `let arr = [1, 2, 3]`
- Array indexing: `arr[0]`, `arr[1] = 5`
- Array length: `arr.length`
- Structs/objects: `let person = { name: "John", age: 30 }`
- Field access: `person.name`

### Phase 5: Modules & Imports
**Goal:** Code organization

Features:
- Module system: `import { foo } from "./lib.iozen"`
- Export: `export fn helper() { ... }`
- Package manager basics

### Phase 6: Error Handling
**Goal:** Robust error management

Features:
- Result types
- Try/catch or error propagation
- Better error messages with line numbers

### Phase 7: Compile to Binary (Advanced)
**Goal:** Not interpreted anymore

Options:
- Compile to JavaScript/Node.js (easier)
- Compile to LLVM IR → native binary (harder)
- Use existing runtime components (chase_lev, atomic_types)

### Phase 8: Production Ready
**Goal:** Usable for real projects

Features:
- Standard library
- Tooling (formatter, linter)
- Documentation generator
- IDE support

### Phase 9: Rust-Level (Long-term)
**Goal:** Mature systems language

Reality check:
- Requires 3-5 years serious work
- Needs community
- LLVM backend stable
- Borrow checker or equivalent

**Current realistic target:** Phase 5-6 (usable language with modules)

---

## 🎁 Bonus Features (Already Done!)

All originally planned bonus features now completed:
- ✅ Basic colors in output - `color("red", "text")`
- ✅ More system info - `get_disk()`, `get_shell()`, `get_resolution()`
- ✅ Control flow - if/else, loops (beyond original scope!)

---

## 🚫 ANTI-GOALS (Don't Do These!)

- ❌ "Let me just add this one feature..." → NO. Finish current phase first.
- ❌ "I should refactor the parser first..." → NO. Current parser works.
- ❌ "Let me make the type system perfect..." → NO. Not needed yet.
- ❌ "I should add async/await..." → NO. Way out of scope.
- ❌ "I should integrate the scheduler now..." → NO. Language first, optimization later.
- ❌ "Let me rewrite everything..." → NO. Build on what works.

---

## ✅ Definition of Done (v0.3 ACHIEVED!)

```
☑️ iozen run examples/fastfetch.iozen produces output ✅
☑️ Output shows: OS, CPU, RAM, Uptime, Disk, Shell ✅
☑️ Colors work in output ✅
☑️ Control flow works (if/else, loops) ✅
☑️ Language is Turing complete ✅
☑️ Multiple working examples ✅
```

## 🎯 Next Definition of Done (v0.4)

```
☐ Arrays work: [1, 2, 3] and arr[0]
☐ Structs/objects work: { name: "value" }
☐ Can write useful programs with compound data
☐ Examples using arrays and structs
```

---

## 🏆 Success Metrics (ACHIEVED!)

**Week 1-3: All Metrics Met! ✅**

- ✅ Does fastfetch.iozen run? YES
- ✅ Can someone else clone and run it? YES (Bun/Node.js)
- ✅ Is there a demo to show? YES (4 working examples!)

**Additional Wins:**
- ✅ Turing complete language
- ✅ Colored output working
- ✅ Control flow (if/else, loops)
- ✅ Bun compatibility achieved

**Metrics for Next Phase:**
- ⬜ Can write array-based programs?
- ⬜ Can organize code with modules?
- ⬜ Can handle errors gracefully?

---

## 🚀 Daily Habit (Updated)

**Every day ask:**
1. Does this get me closer to **Phase 4 (Arrays/Structs)**?
2. Is this in scope?
3. Can I ship this today?

If answer to #1 is "no", stop and re-align.

**Current Focus:** Make language feature-complete before optimization.

---

## 🎯 The Real Goal (ACHIEVED!)

This was never about fastfetch.

It was about:
> **Proving IOZEN can compile and run real programs.**

**Now achieved:**
- ✅ A demo (fastfetch.iozen)
- ✅ Credibility (Turing complete language)
- ✅ Momentum (3 weeks of progress)
- ✅ Something to show/build on (working foundation)

**New Goal:**
> **Making IOZEN a practical, usable language.**

Next milestone: Arrays, structs, modules - features that make it useful for real tasks.

---

## 📚 Documentation Index

| File | Purpose |
|------|---------|
| `AI_AGENT_GUIDE.md` | Technical guide for AI agents |
| `ROADMAP_v0.1.md` | This file - project roadmap |
| `README.md` | User-facing documentation |
| `examples/` | Working code examples |

---

Ready? Say: **"gas week4"** (Arrays & Structs) or **"gas ship"** (Release v0.3)

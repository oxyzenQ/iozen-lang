# IOZEN Year 2 Roadmap: v2.0 Vision (2027) 🔮

## Overview

Year 2 transforms IOZEN from a capable systems language into a production-ready, self-hosted compiler with advanced features.

---

## 2027 Quarterly Plan

### Q1 2027 (Jan-Mar): LLVM Backend 🚀

**Goal:** Direct LLVM IR generation - 2x faster than C backend

**Deliverables:**
- [ ] LLVM IR generator (`src/lib/iozen/codegen/llvm/`)
- [ ] LLVM optimization passes integration
- [ ] Cross-compilation support (x86, ARM, RISC-V)
- [ ] Better error messages with LLVM diagnostics

**Key Features:**
```iozen
# Compiles directly to machine code
# No C intermediate step
# Aggressive LLVM optimizations
iozen compile main.iozen --target native --opt O3
```

---

### Q2 2027 (Apr-Jun): WebAssembly Target 🌐

**Goal:** Run IOZEN in browsers and Node.js

**Deliverables:**
- [ ] WebAssembly code generator
- [ ] WASI support for system calls
- [ ] Browser runtime library
- [ ] npm package for IOZEN WASM

**Use Cases:**
```javascript
// Use IOZEN in Node.js
const iozen = require('iozen-wasm');
const result = iozen.run('print "Hello from WASM!"');
```

```html
<!-- Use IOZEN in browser -->
<script type="iozen">
  print "Hello from browser!"
</script>
```

---

### Q3 2027 (Jul-Sep): Borrow Checker 🛡️

**Goal:** Memory safety without garbage collector

**Deliverables:**
- [ ] Ownership system implementation
- [ ] Borrow checker at compile time
- [ ] Lifetime analysis
- [ ] Move semantics

**New Syntax:**
```iozen
# Ownership - unique ownership
function takeOwnership takes value as text returns nothing
    print value    # value moved here
end                 # value dropped

# Borrowing - temporary access
function useReference takes value as ref text returns nothing
    print value    # borrowed, not moved
end                 # borrow ends

# Example
create var message as text with value "Hello"
useReference message    # borrow
print message           # still valid - we still own it
takeOwnership message   # move - we lose ownership
# print message        # ERROR: value moved
```

---

### Q4 2027 (Oct-Dec): Self-Hosting 🎯

**Goal:** IOZEN compiler written in IOZEN

**Deliverables:**
- [ ] Rewrite lexer in IOZEN
- [ ] Rewrite parser in IOZEN
- [ ] Rewrite type checker in IOZEN
- [ ] Rewrite code generator in IOZEN
- [ ] Bootstrap: IOZEN compiles itself

**Bootstrap Process:**
```
Phase 1: TypeScript compiler compiles IOZEN compiler (written in IOZEN)
         ↓
Phase 2: IOZEN compiler (binary) compiles itself
         ↓
Phase 3: Verify: both compilers produce identical output
         ↓
✅ Self-hosting achieved! TypeScript can be removed.
```

---

## v2.0 Feature Matrix

| Feature | v1.0 (2026) | v2.0 (2027) |
|---------|-------------|-------------|
| Backend | C code gen | LLVM IR + WASM |
| Performance | 100x vs interp | 200x vs interp |
| Memory Safety | Manual | Borrow checker |
| Concurrency | None | Async/await (v1.3) |
| Self-hosting | TypeScript | IOZEN |
| Platforms | Native | Native + Browser + Node |
| Package Ecosystem | Local registry | Global registry |
| IDE Support | Basic | LSP + Formatter + Debugger |

---

## v2.0 Language Features

### Advanced Type System

```iozen
# Generics (v2.1?)
function max<T> takes a as T, b as T returns T
    if a > b then return a end
    return b
end

# Pattern Matching (v2.1?)
match value
    case 0: print "zero"
    case 1..10: print "small"
    case n if n > 100: print "big"
    otherwise: print "other"
end

# Enums with data (v2.1?)
type Result<T, E> is
    Ok with value as T
    Err with error as E
end
```

### Concurrency

```iozen
# Async/await (v1.3)
function fetchData takes url as text returns Promise<text>
    # async HTTP request
end

async function main returns nothing
    create var data as text with value await fetchData "api.example.com"
    print data
end

# Parallel execution (v2.0)
parallel
    task 1: processChunk 1
    task 2: processChunk 2
    task 3: processChunk 3
end
```

---

## v2.0 Tooling

### IDE Integration

- **LSP Server**: Autocomplete, go-to-definition, rename
- **Formatter**: Consistent code style
- **Debugger**: Step-through debugging
- **Profiler**: Performance analysis

### Package Registry (Global)

```bash
# Publish package
iozen publish my-package --version 1.0.0

# Search packages
iozen search "web framework"

# Install from registry
iozen install my-package
```

---

## Migration Path

### v1.x → v2.0

**Breaking Changes:**
- None in core syntax
- Borrow checker adds new restrictions (for safety)
- Optional: migrate to new features

**Compatibility:**
- v1.x code runs on v2.0 compiler
- Gradual adoption of new features

---

## Success Metrics for v2.0

| Metric | Target |
|--------|--------|
| Compilation Speed | < 100ms for 1000 LOC |
| Binary Performance | Within 10% of C |
| Memory Safety | 100% compile-time verified |
| Self-hosting | Full bootstrap |
| Package Count | 100+ community packages |
| Contributors | 20+ active |

---

## Timeline

```
2027 Q1          2027 Q2          2027 Q3          2027 Q4
  |                |                |                |
  ▼                ▼                ▼                ▼
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  LLVM   │ → │   WASM  │ → │ Borrow  │ → │  Self-  │
│ Backend │    │ Target  │    │ Checker │    │ Hosting │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
     │              │              │              │
     └──────────────┴──────────────┴──────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │  IOZEN v2.0 │
                  │   RELEASE   │
                  │  Dec 2027   │
                  └─────────────┘
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| LLVM complexity | Use llvm-lite library |
| WASM limitations | WASI for system access |
| Borrow checker learning curve | Excellent error messages |
| Self-hosting effort | Incremental rewrite |

---

## The Vision

**By end of 2027, IOZEN will be:**

🚀 **Fast**: Compiles to native code in milliseconds  
🛡️ **Safe**: Memory safety without runtime cost  
🌐 **Portable**: Runs anywhere (native, browser, server)  
🎯 **Mature**: Self-hosted, production-ready  
📦 **Ecosystem**: Rich package registry  
🛠️ **Developer-friendly**: Excellent tooling  

**The goal: A language that rivals Rust in safety and C in performance, but with Python's readability.**

---

*Year 1 (2026): Foundation* ✅  
*Year 2 (2027): Excellence* 🔮

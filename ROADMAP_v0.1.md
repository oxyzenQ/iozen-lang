# IOZEN v0.1 Roadmap: Fastfetch Clone Target

## 🎯 Goal (2-4 Weeks)

IOZEN can compile and execute a simple fastfetch-like CLI program:

```iozen
fn main() {
    print("OS: " + get_os())
    print("CPU: " + get_cpu())
    print("RAM: " + get_ram())
    print("Uptime: " + get_uptime())
}
```

**Output:**
```
OS: Linux
CPU: AMD Ryzen 5 5600G
RAM: 16GB / 32GB
Uptime: 3h 42m
```

---

## ⚠️ SCOPE CUT (Important!)

### ❌ OUT OF SCOPE (for v0.1):
- ❌ Full memory safety (keep what we have, no new features)
- ❌ Complex parallelism (scheduler exists but not required for demo)
- ❌ Full module system (basic imports only)
- ❌ Optimized compiler (interpreter mode OK)
- ❌ Advanced types (structs, generics)

### ✅ IN SCOPE:
- ✅ Minimal parser (expressions, functions, calls)
- ✅ Basic runtime (print, string concat)
- ✅ System info functions (os, cpu, ram, uptime)
- ✅ CLI that compiles and runs .iozen files
- ✅ Simple fastfetch clone program

---

## 📅 Week-by-Week Breakdown

### Week 1: Core Parser + Basic Runtime

**Day 1-2: Minimal Parser**
```
Target: Parse simple expressions and functions

Input:
  fn main() {
    print("hello")
  }

Output: AST that represents this
```

Files to create:
- `src/lib/iozen/parser_v2.ts` - simplified parser
- `tests/v0.1/test_parser.ts` - parser tests

**Day 3-4: Basic Interpreter**
```
Target: Execute parsed AST

Can run:
  print("hello")
  let x = 5
  print(x)
  print("Value: " + x)
```

Files to create:
- `src/lib/iozen/interpreter_v2.ts` - minimal interpreter
- `tests/v0.1/test_interpreter.ts`

**Day 5-7: CLI Tool**
```
Target: iozen run file.iozen

$ iozen run hello.iozen
hello
```

Files to modify:
- `iozen-cli/src/cli.ts` - add "run" command

---

### Week 2: System Info + String Operations

**Day 8-10: String Operations**
```
Target: String concat, basic formatting

"OS: " + get_os()  // works
"CPU: " + cpu_name // works
```

**Day 11-14: System Info Functions**
```
Target: Built-in system info functions

get_os()      -> "Linux"
get_cpu()     -> "AMD Ryzen 5 5600G"
get_ram()     -> "16GB / 32GB"
get_uptime()  -> "3h 42m"
```

Files to create:
- `src/lib/iozen/builtins.ts` - system info functions
- `src/lib/iozen/system.ts` - OS interaction

Test:
```iozen
// test_system.iozen
fn main() {
    print("Testing system info:")
    print("OS: " + get_os())
}
```

---

### Week 3: Fastfetch Clone

**Day 15-18: Fastfetch Program**
```
Target: Complete fastfetch clone in IOZEN

File: examples/fastfetch.iozen
```

```iozen
fn main() {
    print("")
    print("  ╭─────────────── System Information ───────────────╮")
    print("  │                                                │")
    print("  │  OS:       " + pad(get_os(), 35) + "│")
    print("  │  CPU:      " + pad(get_cpu(), 35) + "│")
    print("  │  RAM:      " + pad(get_ram(), 35) + "│")
    print("  │  Uptime:   " + pad(get_uptime(), 35) + "│")
    print("  │                                                │")
    print("  ╰────────────────────────────────────────────────╯")
    print("")
}

fn pad(s, len) {
    while length(s) < len {
        s = s + " "
    }
    return s
}
```

**Day 19-21: Polish + Testing**
- Make sure it runs reliably
- Error messages clear
- Edge cases handled

---

### Week 4: Demo + Documentation

**Day 22-25: Documentation**
```
- README with install instructions
- Examples folder
- Simple tutorial
```

**Day 26-28: Final Polish**
```
- Clean up any remaining issues
- Make sure "iozen run examples/fastfetch.iozen" works
- Screenshot/video demo
```

---

## 🎁 Bonus (if time permits)

If ahead of schedule, add ONE of:
- [ ] Basic colors in output
- [ ] One more system info (disk usage, hostname)
- [ ] Config file support (simple JSON)

**NOT both. Pick one.**

---

## 🚫 ANTI-GOALS (Don't Do These!)

- ❌ "Let me just add this one feature..." → NO. Scope is locked.
- ❌ "I should refactor the parser first..." → NO. Current parser works.
- ❌ "Let me make the type system perfect..." → NO. Not needed for v0.1.
- ❌ "I should add async/await..." → NO. Way out of scope.

---

## ✅ Definition of Done

```
☑️ iozen run examples/fastfetch.iozen produces output
☑️ Output shows: OS, CPU, RAM, Uptime
☑️ README explains how to install and run
☑️ Repository is public (or ready to be)
☑️ Can show this to someone and they understand what it is
```

---

## 🏆 Success Metrics

**Not measured by:**
- Lines of code
- Number of features
- How "elegant" the code is

**Measured by:**
- ✅ Does fastfetch.iozen run?
- ✅ Can someone else clone and run it?
- ✅ Is there a demo to show?

---

## 🚀 Daily Habit

**Every day ask:**
1. Does this get me closer to fastfetch working?
2. Is this in scope?
3. Can I ship this today?

If answer to #1 is "no", stop and re-align.

---

## 🎯 The Real Goal

This isn't about fastfetch.

It's about:
> **Proving IOZEN can compile and run real programs.**

Once this works, you have:
- A demo
- Credibility
- Momentum
- Something to show/build on

**That's worth more than 10 half-finished features.**

---

Ready? Say: **"gas week1"**

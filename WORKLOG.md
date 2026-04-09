# IOZEN Language — Work Log

## Session 5: Phase 2 — Self-Hosting Parser
**Date**: 2026-04-09
**Commit**: 351ec1e

### Achievements
- **Phase 2 milestone reached**: Self-hosting parser in IOZEN is now functional
- Bootstrap parser (`bootstrap/parser.iozen`) successfully parses IOZEN token streams into AST
- Connected lexer+parser pipeline demo (`bootstrap/lexer_parser_demo.iozen`)
- README phase badge updated: 0|1|2

### New Language Features
1. **`continue` keyword** — Skip to next loop iteration in while/repeat/for-each
   - Added `Continue` token type, `ContinueNode` AST, `ContinueSignal` class
   - Implemented in execWhile, execRepeat, execForEach
2. **`with`-style function calls in expressions** — `func with arg1 and arg2`
   - Added in parsePostfix() after parenthesized call handler
   - Critical for self-hosting parser which uses this syntax heavily
3. **`equals` comparison operator** — `x equals "hello"` as `==` synonym
   - Was already mapped to TokenType.Equal, confirmed working in comparison parsing

### Bug Fixes
- CLI: Fixed missing `async` keyword on `cmdRepl()` function
- Bootstrap parser: Fixed `tok_expect` to check both `t[0]` and `t[1]`
- Bootstrap parser: Replaced JS `null` with IOZEN `nothing` keyword

### Bootstrap Parser Expansion
Added 5 new statement parsers to bootstrap/parser.iozen:
- `parse_match_stmt()` — Match expression with case/otherwise
- `parse_try_catch()` — Try/catch with optional binding
- `parse_throw_stmt()` — Throw expression
- `parse_import_stmt()` — Import module
- `parse_define_union()` — Union declaration

### Test Suite
- **216/216 passing** (14 new tests)
- 6 continue keyword tests
- 4 with-call function tests
- 4 equals comparison tests

## Session 6: Phase 3 — Self-Hosting Interpreter
**Date**: 2026-04-09
**Status**: Completed

### Achievements
- **Phase 3 milestone reached**: Self-hosting interpreter in IOZEN is fully functional.
- Implemented `bootstrap/interpreter.iozen` supporting core evaluation, control flow, functions, call stack, and environments.
- README Roadmap updated to reflect Phase 3 completion.

### Next Steps (Phase 4)
- Type checking system / AST validation
- Language engine stabilizations
- Ownership/borrowing implementation

## Session 7: Phase 4 & 5 — Typechecker, Ownership & C Codegen
**Date**: 2026-04-09
**Status**: Completed

### Achievements
- **Phase 4 milestone reached**: Semantic AST validation & Typechecker (`bootstrap/typechecker.iozen`).
- **Phase 4 Part 2**: Built the IOZEN Borrow Checker.
  - Implemented the `borrow` unary operator natively in the Lexer & Parser.
  - Typechecker tracks variable ownership and safely prevents reads of `moved_vars`.
- **Phase 5 milestone reached**: Native C Compiler Generation (`bootstrap/codegen_c.iozen`).
  - Implemented an IOZEN-to-C99 transpiler parsing `Literal`, `FunctionDecl`, `While`, `When`, etc.
  - Dynamically packages valid C code structures around an `int main()` block.

### Next Steps (Phase 6)
- Combine Lexer, Parser, Typechecker, and Codegen into a Single Compiler Pipeline `iozenc.iozen`.

## Session 8: Phase 6 — IOZENC Self-Hosting Compiler
**Date**: 2026-04-09
**Status**: Completed

### Achievements
- **Phase 6 milestone reached**: Unified self-hosting compiler `bootstrap/iozenc.iozen`.
- Full pipeline: Raw IOZEN source → Lexer (40 tokens) → Parser (4 statements) → C99 code generation.
- Successfully compiles IOZEN functions, variables, function calls, and print to valid C99.
- The IOZEN bootstrap journey is functionally complete.

## Session 9: Phase 6 Final - Complete Language Coverage
**Date**: 2026-04-09
**Status**: Completed

### Achievements
- **Phase 6 Final milestone reached**: Full language feature coverage in `bootstrap/iozenc.iozen`.
- Lexer expanded to 70+ keywords including: repeat, for each, match, try, catch, throw, structure, enum, union.
- Parser now supports:
  - Natural language comparisons: `is greater than`, `is less than or equal to`, `equals`
  - String concatenation: `attach` operator
  - Loops: `repeat N times`, `for each item in list`
  - Pattern matching: `match` with `case`/`otherwise`
  - Error handling: `try/catch/throw`
  - Flow control: `exit` (break), `continue`
- Codegen generates valid C99 for all new constructs:
  - `iozen_strcat()` helper for string concatenation
  - Type tracking for correct printf formats
  - ForEach compiled as C for-loop with array iteration
  - Match compiled as if-else chain
- Compiler successfully compiles complex IOZEN programs with functions, recursion, loops, and conditionals.

## Session 10: Phase 7 — First Real Tools
**Date**: 2026-04-09
**Status**: Completed

### Achievements
- **Phase 7 milestone reached**: First practical tools written in IOZEN.
- Created `tools/calculator.iozen` — A fully functional command-line calculator demonstrating:
  - Arithmetic operations: add, subtract, multiply, divide
  - Advanced functions: power, factorial (recursive)
  - Iterative Fibonacci sequence (optimized for large N)
  - Prime number checking with trial division
  - Natural language syntax: `attach` for string concatenation
  - Control flow: `repeat`, `while`, `when`
- Created `tools/prime_sieve.iozen` — Sieve of Eratosthenes implementation:
  - Efficient prime generation up to N using map-based tracking
  - Demonstrates algorithmic capabilities of IOZEN
  - Properly formatted output with grid layout
- Both tools run successfully in the IOZEN interpreter.

### Phase 7 Verification
| Tool | Features | Status |
|------|----------|--------|
| calculator.iozen | Math operations, functions, loops | ✅ Working |
| prime_sieve.iozen | Sieve algorithm, map operations | ✅ Working |

### Next Steps (Phase 8)
- Self-hosting compiler written in IOZEN (compile iozenc.iozen with iozenc)
- Expand standard library (file I/O, string operations, collections)
- Type inference improvements
- Memory management (ownership/borrow checker integration)
- Target: Compile IOZEN programs to native binaries

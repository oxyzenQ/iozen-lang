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
2. **`with`-style function calls in expressions** — `func with arg1 and arg2`
3. **`equals` comparison operator** — `x equals "hello"` as `==` synonym

### Bug Fixes
- CLI: Fixed missing `async` keyword on `cmdRepl()` function
- Bootstrap parser: Fixed `tok_expect` to check both `t[0]` and `t[1]`

### Test Suite
- **216/216 passing** (14 new tests)

## Session 6: Phase 3 — Self-Hosting Interpreter
**Date**: 2026-04-09
**Status**: Completed

### Achievements
- **Phase 3 milestone reached**: Self-hosting interpreter in IOZEN is fully functional.

## Session 7: Phase 4 & 5 — Typechecker, Ownership & C Codegen
**Date**: 2026-04-09
**Status**: Completed

### Achievements
- **Phase 4 milestone**: Semantic AST validation & Typechecker
- **Phase 4 Part 2**: Borrow Checker
- **Phase 5 milestone**: Native C Compiler Generation

## Session 8: Phase 6 — IOZENC Self-Hosting Compiler
**Date**: 2026-04-09
**Status**: Completed

## Session 9: Phase 6 Final — Complete Language Coverage
**Date**: 2026-04-09
**Status**: Completed

## Session 10: Phase 7 — First Real Tools
**Date**: 2026-04-09
**Status**: Completed

## Session 11: Phase 8 — Native Binary Compilation
**Date**: 2026-04-09
**Status**: Completed

## Session 12: Compiler v2 — IR Optimizer & C Backend Fixes
**Date**: 2026-04-15
**Commits**: 76605e0, c5f578b

### Achievements
- **73/73 compiler tests passing** (new comprehensive test suite)
- **374/375 interpreter tests passing** (1 pre-existing failure)
- Full end-to-end compilation: IOZEN → C99 → Native Binary → Execution
- All example files compile and run as native binaries

### New Files
- `src/lib/iozen/compiler/ir-optimizer.ts` — IR-level optimizer with:
  - Loop-aware constant propagation with back-edge detection
  - Algebraic simplification (x+0→x, x*1→x, x*0→0, x-0→x, x/1→x, x%1→0, !!x→x, -(-x)→x)
  - Constant folding at IR level (number, string, boolean operations)
  - Dead code elimination with transitive usage tracking
  - Copy propagation through store/load chains
- `tests/test_compiler.ts` — 73 tests covering:
  - Tokenizer & Parser (22), IR Generation (5), IR Optimizer (7)
  - C Code Generation (13), End-to-End Compile & Run (18)
  - Error Handling (2), Full Binary Pipeline (3), Real-World Examples (3)

### Major Bug Fixes
1. **C backend emitOperand()**: Added proper rendering of IRValue objects as C compound literals
   - Previously `String(irValue)` produced `[object Object]` in C code
2. **Loop-unsafe constant propagation**: Optimizer now detects loop back-edges and clears constant map
   - Previously propagated initial values across loop iterations causing infinite loops
3. **DCE missing array_push operands**: Track src1 and src2 of array_push instructions
   - Previously array element values were eliminated as dead code
4. **C keyword name mangling**: `double`, `float`, `int`, etc. → `iz_double`, `iz_float`, `iz_int`
   - Previously `fn double()` produced invalid C
5. **Integer modulo**: Cast to `(int)` for C's `%` operator (requires integer operands)
6. **String+number coercion**: Auto-convert numbers to strings in concatenation via `to_string` IR op
7. **Type inference**: Untyped variable declarations infer type from initializer expression
8. **GCC C99 compliance**: Added `_GNU_SOURCE` define, `-std=c99` flag
9. **DCE to_string tracking**: Mark `to_string` operands as used in dead code elimination

### Pipeline Status
```
IOZEN Source → Tokenizer → Parser → AST → IR (SSA-like) → IR Optimizer → C99 → Native Binary
```

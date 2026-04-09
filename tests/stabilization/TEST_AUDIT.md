# IOZEN Test Suite — Blind Spot Audit
**Date**: 2026-04-09
**Scope**: 10 existing tests + 7 bug class analysis

---

## Current 10 Tests Coverage

| Test | Coverage | Blind Spot? |
|------|----------|-------------|
| test_01_hello | Basic print | ⚠️ No edge cases |
| test_02_variables | Integer ops | ⚠️ No overflow, no shadowing |
| test_03_functions | Function calls | ⚠️ No early return, no nesting |
| test_04_loops | while/repeat | ⚠️ No empty body, no break |
| test_05_conditions | when/otherwise | ⚠️ No empty branches |
| test_06_recursion | Factorial | ⚠️ No deep recursion, no base case fail |
| test_07_strings | attach operator | ⚠️ No empty string, no long string |
| test_08_comparisons | Natural lang | ⚠️ No chained comparisons |
| test_09_lists | List operations | ⚠️ No empty list, no out of bounds |
| test_10_nested | Nested control | ⚠️ Only 2-level, not 4+ level |

**Overall Coverage**: ~60% (10/10 pass but shallow)

---

## 7 Bug Classes — Critical Blind Spots

### 1. EMPTY BLOCKS 🚨 HIGH RISK
**Risk**: Parser infinite loop, codegen syntax error
**Missing Tests**: Empty if/else, empty while, empty repeat
**Target**: 3 new tests

### 2. VARIABLE SHADOWING 🚨 HIGH RISK
**Risk**: Symbol resolution bug, wrong variable accessed
**Missing Tests**: Nested scope with same name
**Target**: 2 new tests

### 3. EARLY RETURN 🚨 MEDIUM RISK
**Risk**: Control flow merge bug, unreachable code
**Missing Tests**: Multiple returns, return in nested if
**Target**: 2 new tests

### 4. COMPLEX EXPRESSIONS 🚨 MEDIUM RISK
**Risk**: Operator precedence, associativity bug
**Missing Tests**: (a+b)*c, a+b*c+d, nested calls
**Target**: 2 new tests

### 5. TYPE BOUNDARIES 🚨 MEDIUM RISK
**Risk**: Integer overflow, float precision loss
**Missing Tests**: Max int, negative numbers, zero division
**Target**: 2 new tests

### 6. RECURSION EDGE CASES 🚨 MEDIUM RISK
**Risk**: Stack overflow, missing base case
**Missing Tests**: Deep recursion (100+), mutual recursion
**Target**: 2 new tests

### 7. FUNCTION CALL IN EXPRESSIONS 🚨 LOW RISK
**Risk**: Evaluation order, side effects
**Missing Tests**: f(g(x)), call in if condition
**Target**: 2 new tests

---

## Test Expansion Plan: 10 → 30

### Phase A: Edge Cases (11-15)
- test_11_empty_blocks.iozen
- test_12_shadowing.iozen
- test_13_early_return.iozen
- test_14_complex_expr.iozen
- test_15_type_boundary.iozen

### Phase B: Control Flow (16-20)
- test_16_deep_nesting.iozen
- test_17_recursion_edge.iozen
- test_18_function_in_expr.iozen
- test_19_short_circuit.iozen
- test_20_loop_control.iozen

### Phase C: Integration (21-25)
- test_21_mixed_types.iozen
- test_22_string_edge.iozen
- test_23_list_edge.iozen
- test_24_boolean_ops.iozen
- test_25_float_ops.iozen

### Phase D: Stress (26-30)
- test_26_large_program.iozen
- test_27_many_functions.iozen
- test_28_deep_callstack.iozen
- test_29_stress_memory.iozen
- test_30_random_mix.iozen

---

## Immediate Priority: Bug Class 1-5 (Critical)

Create tests 11-15 first before expanding to 30.

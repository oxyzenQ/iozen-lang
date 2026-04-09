# IOZEN Semantic Truth Audit
**Date**: 2026-04-09
**Scope**: Symbol table, scope resolution, semantic errors

---

## Executive Summary

**Verdict**: ⚠️ **SYMBOL TABLE HAS CRITICAL WEAKNESSES**

30 tests pass at output level, but semantic truth tests (31-35) expose fundamental bugs.

---

## Critical Bug 1: No Duplicate Declaration Detection 🚨

**Test**: test_34_duplicate_decl.iozen

**Code**:
```iozen
create variable x as integer with value 10
create variable x as integer with value 20  # Should ERROR
```

**Expected**: Compile error "Duplicate declaration of 'x' in same scope"

**Actual**: Silently overwrites with value 20

**Impact**: Silent data corruption, debugging nightmare

**Status**: 🔴 **CRITICAL BUG**

---

## Critical Bug 2: Scope Leaking (Global Modified by Local) 🚨

**Test**: test_33_mutation_scope.iozen

**Code**:
```iozen
create variable x as integer with value 10
when true equals true do
    create variable x as integer with value 100  # Should shadow
    set x to 200  # Should modify LOCAL x
end
print x  # Should be 10 (global unchanged)
```

**Expected Output**:
```
10
100
200
10  <- Global x unchanged
```

**Actual Output**:
```
10
100
200
200  <- BUG! Global x was modified!
```

**Impact**: Local scope leaks into global, data corruption

**Status**: 🔴 **CRITICAL BUG**

---

## Critical Bug 3: Function Returns Wrong Value 🚨

**Test**: test_31_symbol_identity.iozen

**Code**:
```iozen
function use_local returns integer
    create variable x as integer with value 50
    return x
end

print use_local
```

**Expected**: 50

**Actual**: `<function use_local>` (function object itself!)

**Impact**: Function local variables not accessible, return broken

**Status**: 🔴 **CRITICAL BUG**

---

## Bug 4: Missing Return Not Detected ⚠️

**Test**: test_32_return_path.iozen

**Code**:
```iozen
function incomplete_return with n as integer returns integer
    when n is greater than 0 do
        return n
    end
    # Missing return for n <= 0
end
```

**Expected**: Compile error "Not all code paths return a value"

**Actual**: Runtime returns undefined/nil

**Status**: 🟡 **MEDIUM BUG**

---

## Bug 5: Unresolved Symbols Not Detected ⚠️

**Test**: test_35_unresolved.iozen

**Code**:
```iozen
print undefined_var  # Should ERROR: undefined variable
```

**Expected**: Compile error "Undefined variable 'undefined_var'"

**Actual**: Runtime error or nil value

**Status**: 🟡 **MEDIUM BUG**

---

## Root Cause Analysis

### Current Symbol Table Implementation

The interpreter uses:
1. **String-based variable names** — no unique IDs
2. **Single flat scope** — no proper scope stack
3. **No declaration tracking** — can't detect duplicates
4. **Runtime resolution** — errors caught too late

### Missing Components

| Component | Status | Impact |
|-----------|--------|--------|
| Symbol ID system | ❌ Missing | Slow lookup, no identity |
| Scope stack | ❌ Broken | Scope leaking |
| Declaration table | ❌ Missing | No duplicate detection |
| Semantic checker | ❌ Missing | No static errors |
| Return path analysis | ❌ Missing | Missing returns |

---

## Phase 9.3 Roadmap: Symbol Table Stabilization

### 9.3.1 Symbol ID System
- Assign unique integer IDs to each symbol
- Map: name → ID, ID → metadata
- Scope-aware: same name in different scopes = different IDs

### 9.3.2 Scope Stack Fix
- Proper push/pop for each block
- Function scope isolation
- When/repeat/while scope isolation

### 9.3.3 Declaration Tracking
- Track all declarations per scope
- Detect duplicates at compile time
- Error on redeclaration

### 9.3.4 Semantic Pass
- After parsing, before execution
- Check all symbol references
- Verify return paths
- Report errors with line numbers

### 9.3.5 Test Validation
- Run tests 31-35 again
- All should now fail with proper errors (or correct behavior)

---

## Impact on Self-Hosting

**Current State**: Pseudo self-hosting only
- Can compile simple programs
- Complex programs fail silently
- Symbol bugs will corrupt the compiler itself

**After Fix**: True self-hosting possible
- Compiler can reliably compile itself
- Symbol discipline ensures correctness
- Foundation for incremental compilation

---

## Immediate Action Required

**Before any new features**:
1. ✅ Acknowledge bugs exist (DONE)
2. ⏳ Implement symbol ID system
3. ⏳ Fix scope stack
4. ⏳ Add semantic pass
5. ⏳ Validate with tests 31-35

**Do NOT proceed to Phase 10** until these bugs are fixed.

---

## Conclusion

The 30/30 test pass was **output-level validation only**.

Semantic truth audit reveals:
- 🔴 3 critical bugs (data corruption)
- 🟡 2 medium bugs (error detection)

**Phase 9.3 is mandatory**, not optional.

The compiler has good bones (IR layer, test suite), but needs semantic rigor before maturation.

---

**Audit Complete** ⚠️
**Action Required**: Symbol table stabilization
**Estimated Effort**: 2-3 sessions

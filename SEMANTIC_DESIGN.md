# Phase 9.3 — Symbol Table Stabilization Design
**Date**: 2026-04-09
**Goal**: Semantic correctness for self-hosting

---

## 1. Symbol Table Architecture (Minimal but Complete)

### 1.1 Symbol Entry Structure

```
Symbol {
    id: integer              -- unique global ID
    name: string              -- original name for error messages
    scope_id: integer         -- which scope owns this symbol
    type: string              -- "variable", "function", "parameter"
    data_type: string         -- "integer", "float", "text", etc
    is_initialized: boolean  -- has value been assigned?
}
```

### 1.2 Scope Structure

```
Scope {
    id: integer              -- unique scope ID
    parent_id: integer       -- parent scope (0 = global)
    symbols: map             -- name → symbol_id
    level: integer          -- nesting depth
}
```

### 1.3 Symbol Table (Global)

```
- next_symbol_id: integer   -- counter for unique IDs
- next_scope_id: integer   -- counter for scope IDs
- scopes: map              -- scope_id → Scope
- symbols: map             -- symbol_id → Symbol
- current_scope_id: int    -- active scope
```

---

## 2. Pipeline Modification

### Current Pipeline:
```
Source → Lexer → Parser → AST → IR → C → Binary
```

### New Pipeline:
```
Source → Lexer → Parser → AST → Symbol Pass → Resolved AST → IR → C → Binary
                                        ↑
                                   Semantic Check
```

### Symbol Pass (New Phase):

**Step 1: Declaration Collection**
- Traverse AST
- For each VariableDecl: create symbol, assign ID
- For each FunctionDecl: create symbol + parameter symbols
- Push/pop scopes at block boundaries

**Step 2: Duplicate Detection**
- When creating symbol, check if name exists in current scope
- If yes: ERROR "Duplicate declaration of 'x'"

**Step 3: Resolution**
- Replace all Identifier nodes with SymbolRef (by ID)
- Resolve function names in calls

**Step 4: Semantic Validation**
- Check all SymbolRefs resolve
- Check return paths complete
- Report undefined variables

---

## 3. IR Modification

### Current IRVariable:
```
{type: "IRVariable", name: "x"}
```

### New IRVariable:
```
{type: "IRSymbolRef", symbol_id: 12, name: "x"}
-- keep name for C codegen, but use ID for validation
```

### Backend Change:
IR-to-C codegen uses `symbol.name` for output, but compiler validates by `symbol_id`

---

## 4. Scope Stack Implementation

### Stack Operations:

```
function push_scope():
    new_scope = {id: next_scope++, parent: current_scope, symbols: {}}
    scopes[new_scope.id] = new_scope
    current_scope = new_scope.id

function pop_scope():
    current_scope = scopes[current_scope].parent_id

function lookup(name):
    # Search from current scope up to global
    scope_id = current_scope
    while scope_id != 0:
        scope = scopes[scope_id]
        if name in scope.symbols:
            return scope.symbols[name]
        scope_id = scope.parent_id
    return null  -- not found

function declare(name, type, data_type):
    # Check duplicate in current scope
    current = scopes[current_scope]
    if name in current.symbols:
        ERROR "Duplicate declaration"
    
    # Create new symbol
    symbol = {id: next_symbol++, name, scope_id: current_scope, type, data_type}
    symbols[symbol.id] = symbol
    current.symbols[name] = symbol.id
    return symbol.id
```

### Scope Boundaries:

- Global scope: program start (id=0)
- Function entry: push_scope()
- Function exit: pop_scope()
- Block entry (when/repeat/while): push_scope()
- Block exit: pop_scope()

---

## 5. Implementation Strategy

### 5.1 Phase A: Symbol Table Core
Create `bootstrap/symbol_table.iozen`:
- Symbol/Scope data structures
- Stack operations
- Declaration lookup

### 5.2 Phase B: Symbol Pass
Modify compiler to run symbol pass:
- Before AST→IR transformation
- Collect all declarations
- Detect duplicates
- Resolve all references

### 5.3 Phase C: Semantic Validation
Add validation layer:
- Undefined variable check
- Return path analysis
- Error reporting

### 5.4 Phase D: Integration
Update IR to use symbol IDs:
- Change IRVariable → IRSymbolRef
- Update C codegen
- Test with 31-35

---

## 6. Success Criteria

Tests 31-35 should now:
- **31**: Correct symbol identity across boundaries ✅
- **32**: ERROR on incomplete return path ⚠️
- **33**: No scope leaking (global stays 10) ✅
- **34**: ERROR on duplicate declaration ⚠️
- **35**: ERROR on undefined variable ⚠️

---

## 7. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing tests | Keep backward compatible (names still work) |
| Performance regression | String→ID is faster, not slower |
| Complexity explosion | Minimal design, only what's needed |
| Self-hosting failure | Test compiler compiling itself after fix |

---

## 8. Estimated Timeline

- Phase A (Symbol core): 1 session
- Phase B (Symbol pass): 1 session
- Phase C (Validation): 1 session
- Phase D (Integration): 1-2 sessions

**Total**: 4-5 sessions for solid symbol discipline

---

## Next Action

Start Phase A: Create symbol table core in `bootstrap/symbol_table.iozen`

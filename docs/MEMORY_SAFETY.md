# IOZEN Memory Safety Model (Phase 26)

## Overview

A minimal but powerful memory safety model for IOZEN's parallel runtime.
Not Rust-level complex, but enough to prevent data races.

## Core Philosophy

> "Shared mutable state is the root of all evil."
> — Make it explicit, make it safe.

## Design Principles

1. **Default: Thread-local**
   - All data is thread-local by default
   - No accidental sharing

2. **Explicit Sharing**
   - Must explicitly mark data as `shared`
   - Compiler tracks ownership

3. **Read/Write Separation**
   - Multiple readers OR single writer
   - Never both at once

4. **No Raw Pointers**
   - Safe references only
   - Compiler-enforced lifetime tracking

## Memory Model

### 1. Ownership Categories

```iozen
// Thread-local (default)
let x = 42
// x is owned by current thread, cannot escape

// Shared immutable (safe)
let shared const config = loadConfig()
// Multiple threads can read, no one can write

// Shared mutable (requires synchronization)
let shared atomic counter = 0
// Atomic operations only, no direct access

// Unique ownership (transfers between threads)
let unique buffer = new Buffer(1024)
sendToWorker(buffer)
// buffer is moved, no longer accessible here
```

### 2. Data Race Prevention

```iozen
// ✅ SAFE: Immutable shared data
let shared const data = [1, 2, 3]
parallel for item in data {
    print(item)  // All threads read, no writes
}

// ✅ SAFE: Atomic shared data
let shared atomic sum = 0
parallel for i in 0..1000 {
    atomic add sum, i  // Synchronized write
}

// ❌ ERROR: Unsynchronized shared mutable
let shared buffer = []
parallel for i in 0..100 {
    buffer.append(i)  // DATA RACE!
}
```

### 3. Borrowing Rules (Simplified Rust)

```iozen
// Immutable borrow: multiple readers allowed
fn readData(data: &[Int]) {
    // Can read data, cannot modify
}

// Mutable borrow: exclusive access
fn modifyData(data: &mut [Int]) {
    // Exclusive access, no other borrows allowed
}

// Move: transfer ownership
fn takeOwnership(data: [Int]) {
    // data is moved here, caller loses access
}
```

### 4. Thread Boundaries

```iozen
// Data crossing thread boundary
let data = [1, 2, 3, 4, 5]

// ❌ ERROR: Reference cannot escape thread
spawn worker {
    // data reference invalid here
    process(&data)  // COMPILE ERROR
}

// ✅ OK: Move ownership
spawn worker {
    let local = data  // Ownership transferred
    process(local)
}
// data is no longer accessible here

// ✅ OK: Shared immutable
let shared const sharedData = data
spawn worker {
    process(sharedData)  // Safe, read-only
}
```

## Implementation Strategy

### 1. Type System Extensions

```typescript
// New types in the compiler
enum Ownership {
    Owned,      // Thread-local, unique
    SharedConst, // Shared, immutable
    SharedAtomic, // Shared, atomic operations
    Unique      // Moves between threads
}

interface Type {
    ownership: Ownership;
    isMutable: boolean;
    // ... other fields
}
```

### 2. Compile-Time Checks

```typescript
// Check 1: No shared mutable without synchronization
function checkNoDataRaces(ast: AST): Diagnostic[] {
    const errors: Diagnostic[] = [];
    
    visit(ast, (node) => {
        if (isParallelLoop(node)) {
            const sharedVars = getSharedVariables(node);
            for (const var of sharedVars) {
                if (var.isMutable && !var.isAtomic) {
                    errors.push({
                        message: `Data race: mutable shared variable '${var.name}' in parallel loop`,
                        location: var.location,
                        fix: "Use 'atomic' or make 'const'"
                    });
                }
            }
        }
    });
    
    return errors;
}

// Check 2: Ownership transfer across threads
function checkOwnershipTransfer(ast: AST): Diagnostic[] {
    const errors: Diagnostic[] = [];
    
    visit(ast, (node) => {
        if (isSpawnStatement(node)) {
            const captured = getCapturedVariables(node);
            for (const var of captured) {
                if (var.ownership === Ownership.Owned) {
                    // Mark as moved
                    markMoved(var, node);
                } else if (var.ownership === Ownership.SharedConst) {
                    // OK, shared immutable
                } else {
                    errors.push({
                        message: `Cannot capture '${var.name}' in spawn: ` +
                                 `must be 'shared const' or movable`,
                        location: node.location
                    });
                }
            }
        }
    });
    
    return errors;
}

// Check 3: Use-after-move
function checkUseAfterMove(ast: AST): Diagnostic[] {
    const errors: Diagnostic[] = [];
    const movedVariables = new Set<string>();
    
    visit(ast, (node) => {
        if (isVariableUse(node)) {
            if (movedVariables.has(node.name)) {
                errors.push({
                    message: `Use of moved value: '${node.name}'`,
                    location: node.location,
                    fix: "Clone the value or don't move it"
                });
            }
        }
        
        if (isMoveOperation(node)) {
            movedVariables.add(node.variableName);
        }
    });
    
    return errors;
}
```

### 3. Runtime Support

```typescript
// Runtime ownership tracking
class OwnershipTracker {
    private ownershipMap = new Map<string, Ownership>();
    
    markOwned(name: string): void {
        this.ownershipMap.set(name, Ownership.Owned);
    }
    
    markSharedConst(name: string): void {
        this.ownershipMap.set(name, Ownership.SharedConst);
    }
    
    markSharedAtomic(name: string): void {
        this.ownershipMap.set(name, Ownership.SharedAtomic);
    }
    
    markMoved(name: string): void {
        this.ownershipMap.delete(name); // No longer accessible
    }
    
    getOwnership(name: string): Ownership | undefined {
        return this.ownershipMap.get(name);
    }
}
```

## Examples

### Safe Parallel Map

```iozen
fn parallelMap<T, R>(items: [T], fn: (T) -> R) -> [R] {
    let results = new Array<R>(items.length)
    
    parallel for i, item in items {
        // items is 'shared const' - safe to read
        // results[i] is atomic write - safe
        results[i] = fn(item)
    }
    
    return results
}
```

### Safe Parallel Reduce

```iozen
fn parallelSum(numbers: [Int]) -> Int {
    let shared atomic total = 0
    
    parallel for n in numbers {
        atomic add total, n
    }
    
    return total
}
```

### Producer-Consumer Pattern

```iozen
// Safe because ownership is transferred
fn producerConsumer() {
    let shared unique queue = new Queue<Task>()
    
    spawn producer {
        while true {
            let task = generateTask()
            queue.push(task)  // Ownership transferred to queue
        }
    }
    
    spawn consumer {
        while true {
            let task = queue.pop()  // Ownership transferred from queue
            process(task)
        }
    }
}
```

## Validation

Test that the safety model catches:

1. Data races in parallel loops
2. Use-after-move
3. Shared mutable without synchronization
4. Invalid ownership transfers

## Summary

This memory safety model:

- ✅ Prevents data races at compile time
- ✅ Simpler than Rust (no lifetimes)
- ✅ Explicit about sharing
- ✅ Minimal runtime overhead
- ✅ Enables fearless parallelism

Not as powerful as Rust, but **much simpler** while still safe.

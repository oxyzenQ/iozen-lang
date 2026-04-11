// ============================================================
// IOZEN Language — Ownership & Memory Safety System (Phase 26)
// ============================================================

/**
 * Phase 26: Memory Safety for Parallel Runtime
 *
 * A minimal but powerful memory safety model:
 * - Default: Thread-local ownership
 * - Explicit sharing with 'shared' keyword
 * - Atomic shared mutable state
 * - Ownership tracking across thread boundaries
 *
 * Prevents data races at compile time without Rust-level complexity.
 */

// ===== Ownership Types =====

export enum OwnershipKind {
  Owned = 'owned',           // Thread-local, unique ownership
  SharedConst = 'shared_const',   // Shared, immutable
  SharedAtomic = 'shared_atomic', // Shared, atomic operations only
  Moved = 'moved',           // Ownership transferred, no longer accessible
  Borrowed = 'borrowed',     // Temporarily borrowed
}

// ===== Variable Metadata =====

export interface VariableInfo {
  name: string;
  ownership: OwnershipKind;
  isMutable: boolean;
  isAtomic: boolean;
  declaredAt: { line: number; column: number };
  threadId?: number;        // Which thread owns this
}

// ===== Ownership Tracker =====

export class OwnershipTracker {
  private variables = new Map<string, VariableInfo>();
  private movedVariables = new Set<string>();
  protected currentThreadId = 0;
  private threadBoundaries = new Map<number, Set<string>>(); // Variables that crossed thread boundaries

  setCurrentThread(id: number): void {
    this.currentThreadId = id;
  }

  declareVariable(
    name: string,
    ownership: OwnershipKind,
    isMutable: boolean,
    isAtomic: boolean,
    location: { line: number; column: number }
  ): void {
    this.variables.set(name, {
      name,
      ownership,
      isMutable,
      isAtomic,
      declaredAt: location,
      threadId: this.currentThreadId
    });
  }

  getVariable(name: string): VariableInfo | undefined {
    return this.variables.get(name);
  }

  moveVariable(name: string): boolean {
    const variable = this.variables.get(name);
    if (!variable) return false;

    // Can only move owned variables
    if (variable.ownership !== OwnershipKind.Owned) {
      return false;
    }

    // Mark as moved
    variable.ownership = OwnershipKind.Moved;
    this.movedVariables.add(name);

    // Track that it crossed thread boundary
    if (!this.threadBoundaries.has(this.currentThreadId)) {
      this.threadBoundaries.set(this.currentThreadId, new Set());
    }
    this.threadBoundaries.get(this.currentThreadId)!.add(name);

    return true;
  }

  borrowVariable(name: string, mutable: boolean): boolean {
    const variable = this.variables.get(name);
    if (!variable) return false;

    // Cannot borrow moved variables
    if (variable.ownership === OwnershipKind.Moved) {
      return false;
    }

    // Cannot mutably borrow immutable variable
    if (mutable && !variable.isMutable) {
      return false;
    }

    // Track borrow
    variable.ownership = OwnershipKind.Borrowed;

    return true;
  }

  isMoved(name: string): boolean {
    return this.movedVariables.has(name);
  }

  canAccess(name: string): boolean {
    const variable = this.variables.get(name);
    if (!variable) return false;

    // Cannot access moved variables
    if (variable.ownership === OwnershipKind.Moved) {
      return false;
    }

    // Cannot access variables from other threads unless shared
    if (variable.threadId !== this.currentThreadId) {
      return variable.ownership === OwnershipKind.SharedConst ||
             variable.ownership === OwnershipKind.SharedAtomic;
    }

    return true;
  }

  isSafeForParallel(name: string): { safe: boolean; reason?: string } {
    const variable = this.variables.get(name);
    if (!variable) {
      return { safe: false, reason: `Variable '${name}' not found` };
    }

    // Shared const is always safe
    if (variable.ownership === OwnershipKind.SharedConst) {
      return { safe: true };
    }

    // Shared atomic is safe for atomic ops
    if (variable.ownership === OwnershipKind.SharedAtomic) {
      return { safe: true };
    }

    // Owned mutable is NOT safe in parallel (data race)
    if (variable.ownership === OwnershipKind.Owned && variable.isMutable) {
      return {
        safe: false,
        reason: `Mutable variable '${name}' could cause data race. ` +
                `Use 'shared const' or 'shared atomic'`
      };
    }

    // Moved is not accessible
    if (variable.ownership === OwnershipKind.Moved) {
      return {
        safe: false,
        reason: `Variable '${name}' was moved and is no longer accessible`
      };
    }

    return { safe: true };
  }

  getDiagnostics(): OwnershipDiagnostic[] {
    const diagnostics: OwnershipDiagnostic[] = [];

    // Check for use-after-move
    for (const [name, variable] of this.variables) {
      if (variable.ownership === OwnershipKind.Moved) {
        diagnostics.push({
          type: 'use_after_move',
          variable: name,
          message: `Variable '${name}' was moved and cannot be used again`,
          location: variable.declaredAt,
          severity: 'error'
        });
      }
    }

    return diagnostics;
  }

  getState(): string {
    const lines: string[] = ['Ownership State:'];
    for (const [name, info] of this.variables) {
      const status = info.ownership === OwnershipKind.Moved ? ' [MOVED]' : '';
      lines.push(`  ${name}: ${info.ownership}${info.isMutable ? ' (mut)' : ''}${status}`);
    }
    return lines.join('\n');
  }
}

// ===== Diagnostic Types =====

export interface OwnershipDiagnostic {
  type: 'data_race' | 'use_after_move' | 'invalid_share' | 'borrow_conflict';
  variable: string;
  message: string;
  location: { line: number; column: number };
  severity: 'error' | 'warning';
  fix?: string;
}

// ===== Data Race Detector =====

export class DataRaceDetector {
  private tracker: OwnershipTracker;
  private parallelContexts: Set<string> = new Set();

  constructor(tracker: OwnershipTracker) {
    this.tracker = tracker;
  }

  enterParallelContext(contextId: string): void {
    this.parallelContexts.add(contextId);
  }

  leaveParallelContext(contextId: string): void {
    this.parallelContexts.delete(contextId);
  }

  checkVariableAccess(name: string, isWrite: boolean): OwnershipDiagnostic | null {
    // Only check if we're in a parallel context
    if (this.parallelContexts.size === 0) {
      return null;
    }

    const variable = this.tracker.getVariable(name);
    if (!variable) {
      return null;
    }

    // Shared const: OK for reads, error for writes
    if (variable.ownership === OwnershipKind.SharedConst) {
      if (isWrite) {
        return {
          type: 'data_race',
          variable: name,
          message: `Cannot write to 'shared const' variable '${name}'`,
          location: variable.declaredAt,
          severity: 'error',
          fix: `Change to 'shared atomic' for mutable shared state`
        };
      }
      return null;
    }

    // Shared atomic: OK for atomic ops, error for direct access
    if (variable.ownership === OwnershipKind.SharedAtomic) {
      if (isWrite && !variable.isAtomic) {
        return {
          type: 'data_race',
          variable: name,
          message: `Direct write to 'shared atomic' variable '${name}' not allowed`,
          location: variable.declaredAt,
          severity: 'error',
          fix: `Use 'atomic add', 'atomic store', etc.`
        };
      }
      return null;
    }

    // Owned mutable in parallel: DATA RACE
    if (variable.ownership === OwnershipKind.Owned && variable.isMutable) {
      return {
        type: 'data_race',
        variable: name,
        message: `Potential data race: mutable variable '${name}' in parallel context`,
        location: variable.declaredAt,
        severity: 'error',
        fix: `Make 'shared const' (immutable) or 'shared atomic' (synchronized)`
      };
    }

    return null;
  }

  checkSpawn(capturedVars: string[]): OwnershipDiagnostic[] {
    const diagnostics: OwnershipDiagnostic[] = [];

    for (const name of capturedVars) {
      const variable = this.tracker.getVariable(name);
      if (!variable) continue;

      // Can only capture shared or move owned
      if (variable.ownership === OwnershipKind.Owned) {
        // This is a move, mark it
        const moved = this.tracker.moveVariable(name);
        if (!moved) {
          diagnostics.push({
            type: 'invalid_share',
            variable: name,
            message: `Cannot capture '${name}' in spawn: ownership transfer failed`,
            location: variable.declaredAt,
            severity: 'error'
          });
        }
      } else if (variable.ownership === OwnershipKind.SharedConst ||
                 variable.ownership === OwnershipKind.SharedAtomic) {
        // OK, shared variables can be accessed from any thread
      } else {
        diagnostics.push({
          type: 'invalid_share',
          variable: name,
          message: `Cannot capture '${name}' in spawn: ` +
                  `must be 'shared const' or movable`,
          location: variable.declaredAt,
          severity: 'error'
        });
      }
    }

    return diagnostics;
  }
}

// ===== Safe Shared Types =====

export class SafeSharedArray<T> {
  private buffer: SharedArrayBuffer;
  private view: Int32Array;
  private length: number;

  constructor(length: number) {
    this.buffer = new SharedArrayBuffer(length * 4);
    this.view = new Int32Array(this.buffer);
    this.length = length;
  }

  // Safe atomic read
  get(index: number): number {
    return Atomics.load(this.view, index);
  }

  // Safe atomic write
  set(index: number, value: number): void {
    Atomics.store(this.view, index, value);
  }

  // Safe atomic add
  add(index: number, value: number): number {
    return Atomics.add(this.view, index, value);
  }

  getLength(): number {
    return this.length;
  }
}

export class SafeAtomicCounter {
  private buffer: SharedArrayBuffer;
  private view: Int32Array;

  constructor(initial = 0) {
    this.buffer = new SharedArrayBuffer(4);
    this.view = new Int32Array(this.buffer);
    Atomics.store(this.view, 0, initial);
  }

  get(): number {
    return Atomics.load(this.view, 0);
  }

  set(value: number): void {
    Atomics.store(this.view, 0, value);
  }

  add(value: number): number {
    return Atomics.add(this.view, 0, value);
  }

  increment(): number {
    return Atomics.add(this.view, 0, 1);
  }
}

// ===== Validation Test =====

export function validateParallelSafety(
  tracker: OwnershipTracker,
  detector: DataRaceDetector,
  parallelVars: string[],
  isWriteAccess: boolean[]
): OwnershipDiagnostic[] {
  const diagnostics: OwnershipDiagnostic[] = [];

  detector.enterParallelContext('validation');

  for (let i = 0; i < parallelVars.length; i++) {
    const name = parallelVars[i];
    const isWrite = isWriteAccess[i];

    const diagnostic = detector.checkVariableAccess(name, isWrite);
    if (diagnostic) {
      diagnostics.push(diagnostic);
    }
  }

  detector.leaveParallelContext('validation');

  return diagnostics;
}

// ===== Hardened Safety Features =====

// 1. ALIASING CHECKER
// Detects when multiple mutable references to the same data exist
export class AliasingChecker {
  private aliases = new Map<string, Set<string>>(); // variable -> set of aliases
  private mutableAliases = new Set<string>();

  registerAlias(original: string, alias: string, isMutable: boolean): void {
    if (!this.aliases.has(original)) {
      this.aliases.set(original, new Set());
    }
    this.aliases.get(original)!.add(alias);

    if (isMutable) {
      this.mutableAliases.add(alias);
    }
  }

  checkAliasingConflict(var1: string, var2: string): boolean {
    // Check if var1 and var2 are aliases
    const aliases1 = this.aliases.get(var1);
    const aliases2 = this.aliases.get(var2);

    if (aliases1?.has(var2) || aliases2?.has(var1)) {
      return true;
    }

    // Check if they share a common alias
    if (aliases1 && aliases2) {
      for (const alias of aliases1) {
        if (aliases2.has(alias)) {
          return true;
        }
      }
    }

    return false;
  }

  hasMutableAlias(name: string): boolean {
    if (this.mutableAliases.has(name)) return true;

    const aliases = this.aliases.get(name);
    if (aliases) {
      for (const alias of aliases) {
        if (this.mutableAliases.has(alias)) {
          return true;
        }
      }
    }

    return false;
  }

  getDiagnostics(): OwnershipDiagnostic[] {
    const diagnostics: OwnershipDiagnostic[] = [];

    // Check for multiple mutable aliases
    for (const [original, aliases] of this.aliases) {
      const mutableCount = Array.from(aliases).filter(a => this.mutableAliases.has(a)).length;

      if (mutableCount > 1) {
        diagnostics.push({
          type: 'data_race',
          variable: original,
          message: `Multiple mutable aliases to '${original}' detected. ` +
                   `This can lead to data races.`,
          location: { line: 0, column: 0 },
          severity: 'error',
          fix: 'Ensure only one mutable reference exists at a time'
        });
      }
    }

    return diagnostics;
  }
}

// 2. ESCAPE ANALYSIS
// Tracks when references escape their original scope/thread
export class EscapeAnalyzer {
  private escapes = new Map<string, { toThread: number; atLocation: { line: number; column: number } }>();
  private scopeStack: string[][] = [[]]; // Stack of scopes, each containing variable names

  enterScope(): void {
    this.scopeStack.push([]);
  }

  leaveScope(): string[] {
    return this.scopeStack.pop() || [];
  }

  declareInScope(name: string): void {
    const currentScope = this.scopeStack[this.scopeStack.length - 1];
    currentScope.push(name);
  }

  checkEscape(name: string, toThread: number, location: { line: number; column: number }): OwnershipDiagnostic | null {
    // Check if variable escapes to another thread
    if (this.escapes.has(name)) {
      const previous = this.escapes.get(name)!;

      return {
        type: 'invalid_share',
        variable: name,
        message: `Variable '${name}' already escaped to thread ${previous.toThread}. ` +
                 `Cannot escape again to thread ${toThread}.`,
        location,
        severity: 'error',
        fix: 'Clone the value instead of moving twice'
      };
    }

    // Check if any alias escapes
    // (This would need integration with AliasingChecker)

    this.escapes.set(name, { toThread, atLocation: location });
    return null;
  }

  checkUseAfterEscape(name: string, location: { line: number; column: number }): OwnershipDiagnostic | null {
    if (this.escapes.has(name)) {
      const escape = this.escapes.get(name)!;

      return {
        type: 'use_after_move',
        variable: name,
        message: `Variable '${name}' escaped to thread ${escape.toThread} ` +
                 `and cannot be used here.`,
        location,
        severity: 'error',
        fix: 'Move ownership permanently or use shared reference'
      };
    }

    return null;
  }

  getEscapedVariables(): string[] {
    return Array.from(this.escapes.keys());
  }
}

// 3. STRICTER BORROWING RULES
// Enforces: &T (shared) vs &mut T (exclusive)
export class BorrowChecker {
  private activeBorrows = new Map<string, { mutable: boolean; count: number }>();
  private borrowStack: string[] = [];

  borrow(name: string, mutable: boolean): { allowed: boolean; diagnostic?: OwnershipDiagnostic } {
    const existing = this.activeBorrows.get(name);

    if (existing) {
      // Cannot mutably borrow if any borrow exists
      if (mutable) {
        return {
          allowed: false,
          diagnostic: {
            type: 'borrow_conflict',
            variable: name,
            message: `Cannot mutably borrow '${name}' while ${existing.count} ` +
                     `${existing.mutable ? 'mutable' : 'immutable'} borrow(s) exist.`,
            location: { line: 0, column: 0 },
            severity: 'error',
            fix: 'Drop existing borrows before mutable borrow'
          }
        };
      }

      // Cannot immutably borrow if mutable borrow exists
      if (existing.mutable) {
        return {
          allowed: false,
          diagnostic: {
            type: 'borrow_conflict',
            variable: name,
            message: `Cannot borrow '${name}' while mutable borrow exists.`,
            location: { line: 0, column: 0 },
            severity: 'error',
            fix: 'Drop mutable borrow before creating new borrow'
          }
        };
      }

      // Multiple immutable borrows are OK
      existing.count++;
    } else {
      this.activeBorrows.set(name, { mutable, count: 1 });
    }

    this.borrowStack.push(name);
    return { allowed: true };
  }

  releaseBorrow(name: string): void {
    const existing = this.activeBorrows.get(name);
    if (existing) {
      existing.count--;
      if (existing.count === 0) {
        this.activeBorrows.delete(name);
      }
    }

    // Remove from stack
    const index = this.borrowStack.lastIndexOf(name);
    if (index >= 0) {
      this.borrowStack.splice(index, 1);
    }
  }

  canWrite(name: string): boolean {
    const existing = this.activeBorrows.get(name);
    // Can write only if no borrows exist
    return !existing || existing.count === 0;
  }

  getActiveBorrows(): string[] {
    return Array.from(this.activeBorrows.keys());
  }
}

// ===== Enhanced Ownership Tracker (Hardened) =====

export class HardenedOwnershipTracker extends OwnershipTracker {
  aliasingChecker = new AliasingChecker();
  escapeAnalyzer = new EscapeAnalyzer();
  borrowChecker = new BorrowChecker();

  // Track all operations for comprehensive analysis
  private operationLog: { operation: string; variable: string; threadId: number; time: number }[] = [];

  logOperation(operation: string, variable: string): void {
    this.operationLog.push({
      operation,
      variable,
      threadId: this.currentThreadId,
      time: Date.now()
    });
  }

  // Comprehensive safety check
  comprehensiveCheck(name: string, isWrite: boolean, isParallel: boolean): OwnershipDiagnostic[] {
    const diagnostics: OwnershipDiagnostic[] = [];

    // 1. Basic ownership check
    const variable = this.getVariable(name);
    if (!variable) {
      diagnostics.push({
        type: 'data_race',
        variable: name,
        message: `Variable '${name}' not found`,
        location: { line: 0, column: 0 },
        severity: 'error'
      });
      return diagnostics;
    }

    // 2. Borrow check
    if (isWrite && !this.borrowChecker.canWrite(name)) {
      diagnostics.push({
        type: 'borrow_conflict',
        variable: name,
        message: `Cannot write to '${name}' while borrowed`,
        location: variable.declaredAt,
        severity: 'error'
      });
    }

    // 3. Escape check
    const escapeDiag = this.escapeAnalyzer.checkUseAfterEscape(name, variable.declaredAt);
    if (escapeDiag) {
      diagnostics.push(escapeDiag);
    }

    // 4. Aliasing check (for writes)
    if (isWrite && this.aliasingChecker.hasMutableAlias(name)) {
      diagnostics.push({
        type: 'data_race',
        variable: name,
        message: `Variable '${name}' has mutable aliases. ` +
                 `Concurrent modification may cause data races.`,
        location: variable.declaredAt,
        severity: 'error',
        fix: 'Ensure unique ownership before modification'
      });
    }

    // 5. Parallel context check
    if (isParallel) {
      if (variable.ownership === OwnershipKind.Owned && variable.isMutable) {
        diagnostics.push({
          type: 'data_race',
          variable: name,
          message: `Mutable variable '${name}' in parallel context. ` +
                   `Use 'shared const' or 'shared atomic'.`,
          location: variable.declaredAt,
          severity: 'error'
        });
      }
    }

    return diagnostics;
  }

  // Move with escape tracking
  moveVariableWithEscape(name: string, toThread: number): { success: boolean; diagnostics: OwnershipDiagnostic[] } {
    const diagnostics: OwnershipDiagnostic[] = [];
    const variable = this.getVariable(name);

    if (!variable) {
      return {
        success: false,
        diagnostics: [{
          type: 'invalid_share',
          variable: name,
          message: `Variable '${name}' not found`,
          location: { line: 0, column: 0 },
          severity: 'error'
        }]
      };
    }

    // Check for borrows
    if (this.borrowChecker.getActiveBorrows().includes(name)) {
      diagnostics.push({
        type: 'borrow_conflict',
        variable: name,
        message: `Cannot move '${name}' while borrowed`,
        location: variable.declaredAt,
        severity: 'error'
      });
    }

    // Check for previous escape
    const escapeDiag = this.escapeAnalyzer.checkEscape(name, toThread, variable.declaredAt);
    if (escapeDiag) {
      diagnostics.push(escapeDiag);
    }

    if (diagnostics.length > 0) {
      return { success: false, diagnostics };
    }

    // Perform the move
    const moved = super.moveVariable(name);
    if (!moved) {
      diagnostics.push({
        type: 'invalid_share',
        variable: name,
        message: `Failed to move '${name}'`,
        location: variable.declaredAt,
        severity: 'error'
      });
      return { success: false, diagnostics };
    }

    return { success: true, diagnostics: [] };
  }
}

// ===== Exports =====

export const Ownership = {
  Kind: OwnershipKind,
  Tracker: OwnershipTracker,
  HardenedTracker: HardenedOwnershipTracker,
  DataRaceDetector,
  AliasingChecker,
  EscapeAnalyzer,
  BorrowChecker,
  SafeSharedArray,
  SafeAtomicCounter,
  validateParallelSafety
};

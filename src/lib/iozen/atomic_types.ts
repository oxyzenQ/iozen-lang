// ============================================================
// IOZEN Language — Type-Driven Atomic Safety (Phase 26.2)
// ============================================================

/**
 * Type-Driven Atomic Safety
 * 
 * Core principle: SharedAtomic is a TYPE, not just a label.
 * 
 * This means:
 * - Direct assignment: FORBIDDEN at type level
 * - Direct read: FORBIDDEN at type level  
 * - Only atomic operations: ALLOWED
 * 
 * Example:
 * ```iozen
 * let shared atomic x = 0
 * 
 * x = 10        // ❌ COMPILE ERROR: Cannot assign to SharedAtomic
 * let y = x     // ❌ COMPILE ERROR: Cannot read SharedAtomic directly
 * 
 * atomic_store(x, 10)  // ✅ OK
 * let y = atomic_load(x)  // ✅ OK
 * ```
 */

import { OwnershipDiagnostic } from './ownership';

// ===== Atomic Type Wrapper =====

export class SharedAtomicType<T> {
  private buffer: SharedArrayBuffer;
  private view: Int32Array;
  private _type: 'atomic' = 'atomic'; // Type marker
  
  constructor(initialValue: number) {
    this.buffer = new SharedArrayBuffer(4);
    this.view = new Int32Array(this.buffer);
    Atomics.store(this.view, 0, initialValue);
  }
  
  // PRIVATE: Only accessible through atomic operations
  // This prevents direct read/write
  private get _internalView(): Int32Array {
    return this.view;
  }
  
  // Atomic operations - These are the ONLY way to access
  
  /** Atomic load - the only way to read */
  load(): number {
    return Atomics.load(this.view, 0);
  }
  
  /** Atomic store - the only way to write */
  store(value: number): void {
    Atomics.store(this.view, 0, value);
  }
  
  /** Atomic add */
  add(value: number): number {
    return Atomics.add(this.view, 0, value);
  }
  
  /** Atomic increment */
  increment(): number {
    return Atomics.add(this.view, 0, 1);
  }
  
  /** Atomic compare-exchange */
  compareExchange(expected: number, replacement: number): number {
    return Atomics.compareExchange(this.view, 0, expected, replacement);
  }
  
  getType(): string {
    return 'SharedAtomic';
  }
}

// ===== Type Checking System =====

export enum AtomicOperation {
  Load = 'atomic_load',
  Store = 'atomic_store',
  Add = 'atomic_add',
  Increment = 'atomic_inc',
  CompareExchange = 'atomic_cas'
}

export enum AccessType {
  Read = 'read',
  Write = 'write',
  Atomic = 'atomic'
}

export interface VariableType {
  name: string;
  baseType: 'int' | 'float' | 'bool' | 'array' | 'atomic';
  isAtomic: boolean;
  isShared: boolean;
}

export class AtomicTypeChecker {
  private variables = new Map<string, VariableType>();
  private diagnostics: OwnershipDiagnostic[] = [];
  
  declareVariable(name: string, type: VariableType): void {
    this.variables.set(name, type);
  }
  
  checkOperation(
    varName: string,
    operation: AccessType,
    location: { line: number; column: number }
  ): OwnershipDiagnostic | null {
    const variable = this.variables.get(varName);
    
    if (!variable) {
      return {
        type: 'data_race',
        variable: varName,
        message: `Variable '${varName}' not found`,
        location,
        severity: 'error'
      };
    }
    
    // TYPE-DRIVEN ENFORCEMENT
    // If variable is atomic, only atomic operations allowed
    
    if (variable.isAtomic) {
      if (operation === AccessType.Read) {
        // Direct read from atomic - FORBIDDEN
        return {
          type: 'data_race',
          variable: varName,
          message: `Cannot read SharedAtomic variable '${varName}' directly. ` +
                   `Use atomic_load(${varName}) instead.`,
          location,
          severity: 'error',
          fix: `Replace with: atomic_load(${varName})`
        };
      }
      
      if (operation === AccessType.Write) {
        // Direct write to atomic - FORBIDDEN
        return {
          type: 'data_race',
          variable: varName,
          message: `Cannot assign to SharedAtomic variable '${varName}' directly. ` +
                   `Use atomic_store(${varName}, value) or atomic_add(${varName}, value).`,
          location,
          severity: 'error',
          fix: `Replace with: atomic_store(${varName}, <value>)`
        };
      }
      
      // AccessType.Atomic is allowed
      return null;
    }
    
    return null;
  }
  
  checkAssignment(
    target: string,
    source: string | number,
    location: { line: number; column: number }
  ): OwnershipDiagnostic | null {
    const targetVar = this.variables.get(target);
    
    if (targetVar?.isAtomic) {
      return {
        type: 'data_race',
        variable: target,
        message: `Cannot assign to SharedAtomic variable '${target}'. ` +
                 `Use atomic_store(${target}, ${source}) instead.`,
        location,
        severity: 'error',
        fix: `Replace with: atomic_store(${target}, ${source})`
      };
    }
    
    // Also check if source is atomic (direct read)
    if (typeof source === 'string') {
      const sourceVar = this.variables.get(source);
      if (sourceVar?.isAtomic) {
        return {
          type: 'data_race',
          variable: source,
          message: `Cannot read SharedAtomic variable '${source}' directly in assignment. ` +
                   `Use atomic_load(${source}) instead.`,
          location,
          severity: 'error',
          fix: `Replace with: atomic_load(${source})`
        };
      }
    }
    
    return null;
  }
  
  checkFunctionCall(
    funcName: string,
    args: string[],
    location: { line: number; column: number }
  ): OwnershipDiagnostic[] {
    const diagnostics: OwnershipDiagnostic[] = [];
    
    for (const arg of args) {
      const argVar = this.variables.get(arg);
      
      if (argVar?.isAtomic) {
        // Passing atomic to function - risky
        // Unless function explicitly accepts atomic
        diagnostics.push({
          type: 'data_race',
          variable: arg,
          message: `Passing SharedAtomic variable '${arg}' to function '${funcName}' ` +
                   `may bypass atomic safety. Pass atomic value instead.`,
          location,
          severity: 'warning',
          fix: `Use atomic_load(${arg}) to pass value`
        });
      }
    }
    
    return diagnostics;
  }
  
  checkAlias(
    original: string,
    alias: string,
    location: { line: number; column: number }
  ): OwnershipDiagnostic | null {
    const originalVar = this.variables.get(original);
    
    if (originalVar?.isAtomic) {
      // Creating alias to atomic variable
      // This is dangerous - alias might bypass atomic ops
      return {
        type: 'data_race',
        variable: original,
        message: `Creating alias '${alias}' to SharedAtomic variable '${original}' ` +
                 `may bypass atomic safety.`,
        location,
        severity: 'error',
        fix: `Don't alias atomic variables. Use atomic operations directly.`
      };
    }
    
    return null;
  }
  
  getDiagnostics(): OwnershipDiagnostic[] {
    return this.diagnostics;
  }
}

// ===== Runtime Atomic Operations =====

export function atomic_load(atomic: SharedAtomicType<number>): number {
  return atomic.load();
}

export function atomic_store(atomic: SharedAtomicType<number>, value: number): void {
  atomic.store(value);
}

export function atomic_add(atomic: SharedAtomicType<number>, value: number): number {
  return atomic.add(value);
}

export function atomic_inc(atomic: SharedAtomicType<number>): number {
  return atomic.increment();
}

// ===== Atomic Type Exports =====

export const AtomicTypes = {
  SharedAtomic: SharedAtomicType,
  Checker: AtomicTypeChecker,
  Operations: AtomicOperation,
  AccessType
};

// ============================================================
// IOZEN IR Optimizer
// Constant propagation, algebraic simplification, and dead
// code elimination for the three-address code IR pipeline.
// ============================================================

import type { IRProgram, IRFunction, IRInstruction, IRValue, IROp } from './ir';

/**
 * IROptimizer — operates on the flat IR (not SSA) produced by ASTToIR.
 *
 * Passes (run iteratively until fixpoint):
 *   1. Constant propagation  — forward constant values through store->load chains
 *   2. Algebraic simplification -- fold identity operations (x+0, x*1, x*0, ...)
 *   3. Constant folding       -- evaluate binary/unary ops when both operands are constant
 *   4. Dead code elimination   -- remove instructions whose results are never used
 */
export class IROptimizer {
  private program: IRProgram;

  constructor(program: IRProgram, private enableLogging = false) {
    this.program = program;
  }

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  optimize(): void {
    for (const func of this.program.functions) {
      this.optimizeFunction(func);
    }
  }

  private optimizeFunction(func: IRFunction): void {
    let changed = true;
    let iterations = 0;
    const maxIterations = 20;

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      if (this.propagateConstants(func)) changed = true;
      if (this.algebraicSimplify(func))  changed = true;
      if (this.constantFold(func))       changed = true;
      if (this.eliminateDeadCode(func))  changed = true;
    }

    if (this.enableLogging) {
      console.log(`[IR Opt] ${func.name}: completed in ${iterations} iterations`);
    }
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  /** Find the instruction that defines a given variable (linear scan). */
  private findDef(func: IRFunction, name: string): IRInstruction | undefined {
    for (const inst of func.instructions) {
      if (inst.dest === name) return inst;
    }
    return undefined;
  }

  /** Check if v is an IRValue object (not a string variable name). */
  private isIRValue(v: any): v is IRValue {
    return v !== null && typeof v === 'object' && typeof v.type === 'string';
  }

  /** Extract numeric value from an IRValue, or undefined. */
  private numVal(v: IRValue | string | undefined): number | undefined {
    if (this.isIRValue(v) && v.type === 'number') return v.value as number;
    return undefined;
  }

  /** Extract boolean value from an IRValue, or undefined. */
  private boolVal(v: IRValue | string | undefined): boolean | undefined {
    if (this.isIRValue(v) && v.type === 'bool') return v.value as boolean;
    return undefined;
  }

  // ------------------------------------------------------------------
  // Pass 1 -- Constant Propagation (loop-aware)
  // ------------------------------------------------------------------

  private propagateConstants(func: IRFunction): boolean {
    let changed = false;
    const constants = new Map<string, IRValue>();
    const instructions = func.instructions;

    // Pre-compute: for each label, its position in the instruction array.
    // Also track which labels are loop headers (targets of back-edge gotos).
    const labelPositions = new Map<string, number>();
    for (let i = 0; i < instructions.length; i++) {
      if (instructions[i].op === 'label' && instructions[i].label) {
        labelPositions.set(instructions[i].label!, i);
      }
    }

    // Detect loop headers: labels that are targets of gotos appearing AFTER them
    const loopHeaders = new Set<string>();
    for (let i = 0; i < instructions.length; i++) {
      if (instructions[i].op === 'goto' && instructions[i].label) {
        const targetPos = labelPositions.get(instructions[i].label!);
        if (targetPos !== undefined && targetPos <= i) {
          loopHeaders.add(instructions[i].label!);
        }
      }
    }

    for (let i = 0; i < instructions.length; i++) {
      const inst = instructions[i];

      switch (inst.op) {
        case 'const': {
          if (inst.dest) constants.set(inst.dest, inst.src1 as IRValue);
          break;
        }

        case 'store': {
          const varName = String(inst.src1);
          // Check if the source is a known constant
          const c = (typeof inst.src2 === 'string') ? constants.get(inst.src2) : undefined;
          if (c) {
            constants.set(varName, c);
            instructions[i] = {
              op: 'const', dest: varName, src1: c,
              comment: `${varName} = ${JSON.stringify(c.value)} (propagated)`,
            };
            changed = true;
          } else {
            constants.delete(varName);
          }
          break;
        }

        case 'load': {
          const varName = String(inst.src1);
          const c = constants.get(varName);
          if (c && inst.dest) {
            constants.set(inst.dest, c);
            instructions[i] = {
              op: 'const', dest: inst.dest, src1: c,
              comment: `${inst.dest} = ${JSON.stringify(c.value)} (propagated from ${varName})`,
            };
            changed = true;
          } else if (inst.dest) {
            constants.delete(inst.dest);
          }
          break;
        }

        case 'add': case 'sub': case 'mul': case 'div': case 'mod':
        case 'eq':  case 'ne':  case 'lt': case 'le': case 'gt':  case 'ge':
        case 'and': case 'or': {
          // Propagate known constant operands
          if (typeof inst.src1 === 'string') {
            const c = constants.get(inst.src1);
            if (c) { inst.src1 = c; changed = true; }
          }
          if (typeof inst.src2 === 'string') {
            const c = constants.get(inst.src2);
            if (c) { inst.src2 = c; changed = true; }
          }
          if (inst.dest) constants.delete(inst.dest);
          break;
        }

        case 'neg': case 'not': {
          if (typeof inst.src1 === 'string') {
            const c = constants.get(inst.src1);
            if (c) { inst.src1 = c; changed = true; }
          }
          if (inst.dest) constants.delete(inst.dest);
          break;
        }

        case 'if': {
          // Only propagate into condition; do NOT convert to goto.
          if (typeof inst.src1 === 'string') {
            const c = constants.get(inst.src1);
            if (c) {
              inst.src1 = c;
              changed = true;
            }
          }
          break;
        }

        case 'call': {
          if (inst.args) {
            for (let a = 0; a < inst.args.length; a++) {
              if (typeof inst.args[a] === 'string') {
                const c = constants.get(inst.args[a]);
                if (c) { inst.args[a] = c; changed = true; }
              }
            }
          }
          if (inst.dest) constants.delete(inst.dest);
          break;
        }

        case 'concat': {
          if (typeof inst.src1 === 'string') {
            const c = constants.get(inst.src1);
            if (c) { inst.src1 = c; changed = true; }
          }
          if (typeof inst.src2 === 'string') {
            const c = constants.get(inst.src2);
            if (c) { inst.src2 = c; changed = true; }
          }
          if (inst.dest) constants.delete(inst.dest);
          break;
        }

        case 'goto': {
          // If this goto targets a loop header (back-edge), clear constants
          // because loop body variables may have been modified.
          if (inst.label && loopHeaders.has(inst.label)) {
            if (constants.size > 0) {
              constants.clear();
            }
          }
          break;
        }

        case 'label': {
          // When reaching a loop header, clear constants since the loop
          // may execute multiple times with different variable values.
          if (inst.label && loopHeaders.has(inst.label)) {
            if (constants.size > 0) {
              constants.clear();
            }
          }
          break;
        }

        default:
          break;
      }
    }

    return changed;
  }

  // ------------------------------------------------------------------
  // Pass 2 -- Algebraic Simplification
  // ------------------------------------------------------------------

  private algebraicSimplify(func: IRFunction): boolean {
    let changed = false;
    const instructions = func.instructions;

    for (let i = 0; i < instructions.length; i++) {
      const inst = instructions[i];
      const result = this.tryAlgebraicSimplify(func, inst);
      if (result !== null) {
        instructions[i] = result;
        changed = true;
      }
    }

    return changed;
  }

  private tryAlgebraicSimplify(func: IRFunction, inst: IRInstruction): IRInstruction | null {
    const { op, dest, src1, src2 } = inst;
    if (!dest) return null;

    switch (op) {
      case 'add':
        if (this.numVal(src2) === 0) return { op: 'load', dest, src1, comment: `${dest} = ${src1} (x+0->x)` };
        if (this.numVal(src1) === 0) return { op: 'load', dest, src1: src2, comment: `${dest} = ${src2} (0+x->x)` };
        break;

      case 'sub':
        if (this.numVal(src2) === 0) return { op: 'load', dest, src1, comment: `${dest} = ${src1} (x-0->x)` };
        break;

      case 'mul':
        if (this.numVal(src2) === 1) return { op: 'load', dest, src1, comment: `${dest} = ${src1} (x*1->x)` };
        if (this.numVal(src1) === 1) return { op: 'load', dest, src1: src2, comment: `${dest} = ${src2} (1*x->x)` };
        if (this.numVal(src2) === 0) return { op: 'const', dest, src1: { type: 'number', value: 0 }, comment: `${dest} = 0 (x*0->0)` };
        if (this.numVal(src1) === 0) return { op: 'const', dest, src1: { type: 'number', value: 0 }, comment: `${dest} = 0 (0*x->0)` };
        break;

      case 'div':
        if (this.numVal(src2) === 1) return { op: 'load', dest, src1, comment: `${dest} = ${src1} (x/1->x)` };
        break;

      case 'mod':
        if (this.numVal(src2) === 1) return { op: 'const', dest, src1: { type: 'number', value: 0 }, comment: `${dest} = 0 (x%1->0)` };
        break;

      case 'eq':
        if (typeof src1 === 'string' && typeof src2 === 'string' && src1 === src2)
          return { op: 'const', dest, src1: { type: 'bool', value: true }, comment: `${dest} = true (x==x)` };
        break;
      case 'ne':
        if (typeof src1 === 'string' && typeof src2 === 'string' && src1 === src2)
          return { op: 'const', dest, src1: { type: 'bool', value: false }, comment: `${dest} = false (x!=x)` };
        break;

      case 'and':
        if (this.boolVal(src2) === true)  return { op: 'load', dest, src1, comment: `${dest} = ${src1} (x&&true->x)` };
        if (this.boolVal(src1) === true)  return { op: 'load', dest, src1: src2, comment: `${dest} = ${src2} (true&&x->x)` };
        if (this.boolVal(src1) === false || this.boolVal(src2) === false)
          return { op: 'const', dest, src1: { type: 'bool', value: false }, comment: `${dest} = false (x&&false->false)` };
        break;
      case 'or':
        if (this.boolVal(src2) === false) return { op: 'load', dest, src1, comment: `${dest} = ${src1} (x||false->x)` };
        if (this.boolVal(src1) === false) return { op: 'load', dest, src1: src2, comment: `${dest} = ${src2} (false||x->x)` };
        if (this.boolVal(src1) === true || this.boolVal(src2) === true)
          return { op: 'const', dest, src1: { type: 'bool', value: true }, comment: `${dest} = true (x||true->true)` };
        break;

      case 'not': {
        // !!x -> x
        if (typeof src1 === 'string') {
          const operandInst = this.findDef(func, src1);
          if (operandInst && operandInst.op === 'not' && operandInst.src1) {
            return { op: 'load', dest, src1: operandInst.src1, comment: `${dest} = ${operandInst.src1} (!!x->x)` };
          }
        }
        break;
      }

      case 'neg': {
        // -(-x) -> x
        if (typeof src1 === 'string') {
          const operandInst = this.findDef(func, src1);
          if (operandInst && operandInst.op === 'neg' && operandInst.src1) {
            return { op: 'load', dest, src1: operandInst.src1, comment: `${dest} = ${operandInst.src1} (-(-x)->x)` };
          }
        }
        break;
      }
    }

    return null;
  }

  // ------------------------------------------------------------------
  // Pass 3 -- Constant Folding (IR-level)
  // ------------------------------------------------------------------

  private constantFold(func: IRFunction): boolean {
    let changed = false;
    const instructions = func.instructions;

    for (let i = 0; i < instructions.length; i++) {
      const inst = instructions[i];
      const result = this.tryConstantFold(inst);
      if (result !== null) {
        instructions[i] = result;
        changed = true;
      }
    }

    return changed;
  }

  private tryConstantFold(inst: IRInstruction): IRInstruction | null {
    const { op, dest } = inst;
    if (!dest) return null;

    const left = inst.src1 as IRValue | undefined;
    const right = inst.src2 as IRValue | undefined;

    // Both operands must be IRValue objects
    if (!this.isIRValue(left)) return null;

    // Unary operations
    if ((op === 'neg' || op === 'not') && !right) {
      const folded = this.foldUnary(op, left);
      if (folded !== null) {
        return { op: 'const', dest, src1: folded, comment: `${dest} = ${JSON.stringify(folded.value)} (folded)` };
      }
      return null;
    }

    // Binary: right must also be IRValue
    if (!this.isIRValue(right)) return null;

    const folded = this.foldBinary(op, left, right);
    if (folded !== null) {
      return { op: 'const', dest, src1: folded, comment: `${dest} = ${JSON.stringify(folded.value)} (folded)` };
    }

    return null;
  }

  private foldBinary(op: IROp, left: IRValue, right: IRValue): IRValue | null {
    // Number arithmetic
    if (left.type === 'number' && right.type === 'number') {
      const l = left.value as number;
      const r = right.value as number;
      switch (op) {
        case 'add': return { type: 'number', value: l + r };
        case 'sub': return { type: 'number', value: l - r };
        case 'mul': return { type: 'number', value: l * r };
        case 'div': return r !== 0 ? { type: 'number', value: l / r } : null;
        case 'mod': return r !== 0 ? { type: 'number', value: l % r } : null;
        case 'eq':  return { type: 'bool', value: l === r };
        case 'ne':  return { type: 'bool', value: l !== r };
        case 'lt':  return { type: 'bool', value: l < r };
        case 'le':  return { type: 'bool', value: l <= r };
        case 'gt':  return { type: 'bool', value: l > r };
        case 'ge':  return { type: 'bool', value: l >= r };
        default:    return null;
      }
    }

    // String operations
    if (left.type === 'string' && right.type === 'string') {
      const l = String(left.value);
      const r = String(right.value);
      switch (op) {
        case 'concat':
        case 'add':
          return { type: 'string', value: l + r };
        case 'eq': return { type: 'bool', value: l === r };
        case 'ne': return { type: 'bool', value: l !== r };
        default:  return null;
      }
    }

    // Boolean operations
    if (left.type === 'bool' && right.type === 'bool') {
      const l = left.value as boolean;
      const r = right.value as boolean;
      switch (op) {
        case 'and': return { type: 'bool', value: l && r };
        case 'or':  return { type: 'bool', value: l || r };
        case 'eq':  return { type: 'bool', value: l === r };
        case 'ne':  return { type: 'bool', value: l !== r };
        default:    return null;
      }
    }

    return null;
  }

  private foldUnary(op: IROp, operand: IRValue): IRValue | null {
    if (op === 'neg' && operand.type === 'number') {
      return { type: 'number', value: -(operand.value as number) };
    }
    if (op === 'not' && operand.type === 'bool') {
      return { type: 'bool', value: !(operand.value as boolean) };
    }
    return null;
  }

  // ------------------------------------------------------------------
  // Pass 4 -- Dead Code Elimination
  // ------------------------------------------------------------------

  /**
   * Remove instructions whose results are never consumed.
   *
   * Side-effecting instructions are always kept:
   *   print, call, store, array, ret, goto, if, label
   */
  private eliminateDeadCode(func: IRFunction): boolean {
    const instructions = func.instructions;

    // Step 1: Collect all variable names that are consumed
    const used = new Set<string>();

    const markUsed = (v: any): void => {
      if (typeof v === 'string') used.add(v);
    };

    for (const inst of instructions) {
      switch (inst.op) {
        case 'ret':   markUsed(inst.src1); break;
        case 'print': markUsed(inst.src1); break;
        case 'if': case 'if_not': markUsed(inst.src1); break;
        case 'add': case 'sub': case 'mul': case 'div': case 'mod':
        case 'eq': case 'ne': case 'lt': case 'le': case 'gt': case 'ge':
        case 'and': case 'or': case 'concat':
          markUsed(inst.src1); markUsed(inst.src2); break;
        case 'neg': case 'not': case 'load': case 'index': case 'to_string':
          markUsed(inst.src1); break;
        case 'call':
          if (inst.args) inst.args.forEach(markUsed); break;
        case 'store':
          markUsed(inst.src2); break;
        case 'array_push':
          markUsed(inst.src1); markUsed(inst.src2); break;
        default: break;
      }
    }

    // Step 2: Transitively mark sources of used variables
    let added = true;
    while (added) {
      added = false;
      for (const inst of instructions) {
        if (!inst.dest || !used.has(inst.dest)) continue;
        switch (inst.op) {
          case 'const': break;
          case 'load':
            if (typeof inst.src1 === 'string' && !used.has(inst.src1)) { used.add(inst.src1); added = true; }
            break;
          case 'add': case 'sub': case 'mul': case 'div': case 'mod':
          case 'eq': case 'ne': case 'lt': case 'le': case 'gt': case 'ge':
          case 'and': case 'or': case 'concat':
            if (typeof inst.src1 === 'string' && !used.has(inst.src1)) { used.add(inst.src1); added = true; }
            if (typeof inst.src2 === 'string' && !used.has(inst.src2)) { used.add(inst.src2); added = true; }
            break;
          case 'neg': case 'not': case 'to_string':
            if (typeof inst.src1 === 'string' && !used.has(inst.src1)) { used.add(inst.src1); added = true; }
            break;
          case 'call':
            if (inst.args) {
              for (const arg of inst.args) {
                if (typeof arg === 'string' && !used.has(arg)) { used.add(arg); added = true; }
              }
            }
            break;
          case 'store':
            if (typeof inst.src2 === 'string' && !used.has(inst.src2)) { used.add(inst.src2); added = true; }
            break;
          case 'array_push':
            if (typeof inst.src1 === 'string' && !used.has(inst.src1)) { used.add(inst.src1); added = true; }
            if (typeof inst.src2 === 'string' && !used.has(inst.src2)) { used.add(inst.src2); added = true; }
            break;
          case 'index':
            if (typeof inst.src1 === 'string' && !used.has(inst.src1)) { used.add(inst.src1); added = true; }
            if (typeof inst.src2 === 'string' && !used.has(inst.src2)) { used.add(inst.src2); added = true; }
            break;
        }
      }
    }

    // Step 3: Remove dead instructions
    const newInstructions: IRInstruction[] = [];
    let changed = false;

    for (const inst of instructions) {
      // Always keep essential instructions
      if (this.isEssential(inst)) {
        newInstructions.push(inst);
        continue;
      }
      // Keep if destination is used
      if (inst.dest && used.has(inst.dest)) {
        newInstructions.push(inst);
        continue;
      }
      // Dead -- remove
      changed = true;
    }

    func.instructions = newInstructions;
    return changed;
  }

  private isEssential(inst: IRInstruction): boolean {
    switch (inst.op) {
      case 'label': case 'goto': case 'if': case 'if_not':
      case 'ret': case 'print': case 'call': case 'store':
      case 'array': case 'array_push':
        return true;
      default:
        return false;
    }
  }
}

// ------------------------------------------------------------------
// Convenience export
// ------------------------------------------------------------------

export function optimizeIR(program: IRProgram): IRProgram {
  const optimizer = new IROptimizer(program);
  optimizer.optimize();
  return program;
}

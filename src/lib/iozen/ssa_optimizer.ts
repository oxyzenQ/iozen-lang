// ============================================================
// IOZEN Language — SSA Optimizer
// Phi-aware constant propagation and dead code elimination
// ============================================================

import type {
  SSAFunction,
  SSABasicBlock,
  SSAInstruction,
  SSAValue,
} from './ssa_ir';
import { createConstant, formatValue } from './ssa_ir';

/**
 * Phase 17.4-17.5: SSA Optimizer
 * 
 * Optimizations:
 * 1. Constant propagation (phi-aware)
 * 2. Dead code elimination (phi-aware)
 * 3. Trivial phi simplification
 */

export class SSAOptimizer {
  private func: SSAFunction;
  private constantValues = new Map<string, SSAValue>(); // varName_version -> constant value
  private usedVariables = new Set<string>(); // Set of used varName_version

  constructor(func: SSAFunction) {
    this.func = func;
  }

  optimize(): void {
    let changed = true;
    let iterations = 0;
    const maxIterations = 10;

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      // Phase 1: Constant propagation
      if (this.propagateConstants()) {
        changed = true;
      }

      // Phase 2: Simplify trivial phi nodes
      if (this.simplifyTrivialPhis()) {
        changed = true;
      }

      // Phase 3: Dead code elimination
      if (this.eliminateDeadCode()) {
        changed = true;
      }
    }

    console.log(`[SSA Opt] Optimization completed in ${iterations} iterations`);
  }

  // ===== Phase 17.4: Constant Propagation =====

  private propagateConstants(): boolean {
    let changed = false;
    this.constantValues.clear();

    // First pass: collect constant assignments
    for (const [_, block] of this.func.blocks) {
      for (const inst of block.instructions) {
        const key = this.getInstKey(inst);
        
        if (inst.kind === 'assign' && inst.src.kind === 'constant') {
          this.constantValues.set(key, inst.src);
        }
        // Phi node: if all incoming are same constant, propagate
        else if (inst.kind === 'phi') {
          const constValue = this.evaluatePhiConstant(inst);
          if (constValue) {
            this.constantValues.set(key, constValue);
            changed = true;
          }
        }
      }
    }

    // Second pass: replace uses with constants
    for (const [_, block] of this.func.blocks) {
      for (const inst of block.instructions) {
        changed = this.replaceWithConstant(inst) || changed;
      }
      
      // Also check terminator conditions
      if (block.terminator.kind === 'branch') {
        const constCond = this.getConstantValue(block.terminator.cond);
        if (constCond && constCond.kind === 'constant') {
          // Convert branch to jump if condition is constant
          const target = constCond.value ? block.terminator.trueBlock : block.terminator.falseBlock;
          block.terminator = { kind: 'jump', target };
          changed = true;
        }
      }
    }

    return changed;
  }

  private evaluatePhiConstant(inst: SSAInstruction & { kind: 'phi' }): SSAValue | null {
    let firstConst: SSAValue | null = null;
    
    for (const incoming of inst.incoming) {
      const constVal = this.getConstantValue(incoming.value);
      
      if (!constVal || constVal.kind !== 'constant') {
        return null; // Not all incoming are constants
      }
      
      if (firstConst === null) {
        firstConst = constVal;
      } else if (firstConst.value !== constVal.value) {
        return null; // Different constants
      }
    }
    
    return firstConst;
  }

  private getConstantValue(value: SSAValue): SSAValue | null {
    if (value.kind === 'constant') {
      return value;
    }
    
    if (value.kind === 'variable') {
      const key = `${value.name}_${value.version}`;
      return this.constantValues.get(key) || null;
    }
    
    return null;
  }

  private replaceWithConstant(inst: SSAInstruction): boolean {
    let changed = false;

    switch (inst.kind) {
      case 'assign':
        const constSrc = this.getConstantValue(inst.src);
        if (constSrc && inst.src.kind !== 'constant') {
          inst.src = constSrc;
          changed = true;
        }
        break;

      case 'binary':
        const constLeft = this.getConstantValue(inst.left);
        const constRight = this.getConstantValue(inst.right);
        
        if (constLeft && inst.left.kind !== 'constant') {
          inst.left = constLeft;
          changed = true;
        }
        if (constRight && inst.right.kind !== 'constant') {
          inst.right = constRight;
          changed = true;
        }
        
        // If both operands constant, fold
        if (constLeft?.kind === 'constant' && constRight?.kind === 'constant') {
          const folded = this.foldConstantBinary(inst.op, constLeft.value, constRight.value);
          if (folded !== null) {
            // Replace binary with assign of constant
            (inst as any).kind = 'assign';
            (inst as any).src = createConstant(folded);
            delete (inst as any).op;
            delete (inst as any).left;
            delete (inst as any).right;
            changed = true;
          }
        }
        break;

      case 'unary':
        const constOperand = this.getConstantValue(inst.operand);
        if (constOperand && inst.operand.kind !== 'constant') {
          inst.operand = constOperand;
          changed = true;
        }
        break;

      case 'call':
        for (let i = 0; i < inst.args.length; i++) {
          const constArg = this.getConstantValue(inst.args[i]);
          if (constArg && inst.args[i].kind !== 'constant') {
            inst.args[i] = constArg;
            changed = true;
          }
        }
        break;

      case 'phi':
        for (const incoming of inst.incoming) {
          const constIncoming = this.getConstantValue(incoming.value);
          if (constIncoming && incoming.value.kind !== 'constant') {
            incoming.value = constIncoming;
            changed = true;
          }
        }
        break;
    }

    return changed;
  }

  private foldConstantBinary(op: string, left: any, right: any): number | string | boolean | null {
    if (typeof left === 'number' && typeof right === 'number') {
      switch (op) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return right !== 0 ? left / right : null;
        case '%': return right !== 0 ? left % right : null;
        case '==': return left === right;
        case '!=': return left !== right;
        case '<': return left < right;
        case '>': return left > right;
        case '<=': return left <= right;
        case '>=': return left >= right;
      }
    }
    
    if (typeof left === 'string' && typeof right === 'string') {
      switch (op) {
        case '+': return left + right;
        case '==': return left === right;
        case '!=': return left !== right;
      }
    }
    
    if (typeof left === 'boolean' && typeof right === 'boolean') {
      switch (op) {
        case '==': return left === right;
        case '!=': return left !== right;
        case 'and': return left && right;
        case 'or': return left || right;
      }
    }
    
    return null;
  }

  // ===== Trivial Phi Simplification =====

  private simplifyTrivialPhis(): boolean {
    let changed = false;

    for (const [_, block] of this.func.blocks) {
      const newInstructions: SSAInstruction[] = [];
      
      for (const inst of block.instructions) {
        if (inst.kind === 'phi') {
          // Check if all incoming values are the same
          const uniqueValues = new Map<string, SSAValue>();
          
          for (const incoming of inst.incoming) {
            const key = this.valueKey(incoming.value);
            uniqueValues.set(key, incoming.value);
          }
          
          if (uniqueValues.size === 1) {
            // Trivial phi: phi(x, x, x) -> x
            // Replace with simple assignment
            const singleValue = uniqueValues.values().next().value;
            newInstructions.push({
              kind: 'assign',
              dest: inst.dest,
              destVer: inst.destVer,
              src: singleValue,
            });
            changed = true;
            continue;
          }
        }
        
        newInstructions.push(inst);
      }
      
      block.instructions = newInstructions;
    }

    return changed;
  }

  private valueKey(value: SSAValue): string {
    if (value.kind === 'constant') {
      return `const:${JSON.stringify(value.value)}`;
    }
    if (value.kind === 'variable') {
      return `var:${value.name}_${value.version}`;
    }
    return 'undef';
  }

  // ===== Phase 17.5: Dead Code Elimination =====

  private eliminateDeadCode(): boolean {
    let changed = false;
    this.usedVariables.clear();

    // Mark all variables used in terminators, returns, and side effects
    for (const [_, block] of this.func.blocks) {
      // Check terminator
      if (block.terminator.kind === 'return' && block.terminator.value) {
        this.markUsed(block.terminator.value);
      }
      if (block.terminator.kind === 'branch') {
        this.markUsed(block.terminator.cond);
      }

      // Check side-effect instructions (calls, stores)
      for (const inst of block.instructions) {
        if (inst.kind === 'call' || inst.kind === 'index_store' || inst.kind === 'field_store') {
          this.markInstructionUsed(inst);
        }
      }
    }

    // Backward propagation: mark variables used by used variables
    let added = true;
    while (added) {
      added = false;
      
      for (const [_, block] of this.func.blocks) {
        for (const inst of block.instructions) {
          const destKey = this.getInstKey(inst);
          
          if (this.usedVariables.has(destKey)) {
            // This instruction's result is used
            // Mark its operands as used
            if (this.markInstructionUsed(inst)) {
              added = true;
            }
          }
        }
      }
    }

    // Remove dead instructions
    for (const [_, block] of this.func.blocks) {
      const originalLength = block.instructions.length;
      
      block.instructions = block.instructions.filter(inst => {
        const key = this.getInstKey(inst);
        
        // Keep if:
        // - Has side effects
        // - Result is used
        // - Is a phi node (needed for control flow)
        if (inst.kind === 'call' || inst.kind === 'index_store' || inst.kind === 'field_store') {
          return true;
        }
        if (inst.kind === 'phi') {
          return true; // Keep phis for now
        }
        if (this.usedVariables.has(key)) {
          return true;
        }
        
        // Dead code
        return false;
      });
      
      if (block.instructions.length !== originalLength) {
        changed = true;
      }
    }

    return changed;
  }

  private markUsed(value: SSAValue): void {
    if (value.kind === 'variable') {
      const key = `${value.name}_${value.version}`;
      if (!this.usedVariables.has(key)) {
        this.usedVariables.add(key);
      }
    }
  }

  private markInstructionUsed(inst: SSAInstruction): boolean {
    let added = false;
    
    switch (inst.kind) {
      case 'assign':
        if (this.markAndCheckAdded(inst.src)) added = true;
        break;
      case 'binary':
        if (this.markAndCheckAdded(inst.left)) added = true;
        if (this.markAndCheckAdded(inst.right)) added = true;
        break;
      case 'unary':
        if (this.markAndCheckAdded(inst.operand)) added = true;
        break;
      case 'call':
        for (const arg of inst.args) {
          if (this.markAndCheckAdded(arg)) added = true;
        }
        break;
      case 'index_load':
        if (this.markAndCheckAdded(inst.array)) added = true;
        if (this.markAndCheckAdded(inst.index)) added = true;
        break;
      case 'index_store':
        if (this.markAndCheckAdded(inst.array)) added = true;
        if (this.markAndCheckAdded(inst.index)) added = true;
        if (this.markAndCheckAdded(inst.value)) added = true;
        break;
      case 'field_load':
        if (this.markAndCheckAdded(inst.obj)) added = true;
        break;
      case 'field_store':
        if (this.markAndCheckAdded(inst.obj)) added = true;
        if (this.markAndCheckAdded(inst.value)) added = true;
        break;
      case 'phi':
        for (const incoming of inst.incoming) {
          if (this.markAndCheckAdded(incoming.value)) added = true;
        }
        break;
    }
    
    return added;
  }

  private markAndCheckAdded(value: SSAValue): boolean {
    if (value.kind === 'variable') {
      const key = `${value.name}_${value.version}`;
      if (!this.usedVariables.has(key)) {
        this.usedVariables.add(key);
        return true;
      }
    }
    return false;
  }

  private getInstKey(inst: SSAInstruction): string {
    switch (inst.kind) {
      case 'assign':
      case 'binary':
      case 'unary':
      case 'call':
      case 'phi':
        return `${inst.dest}_${inst.destVer}`;
      default:
        return '';
    }
  }
}

export function optimizeSSAFunction(func: SSAFunction): void {
  const optimizer = new SSAOptimizer(func);
  optimizer.optimize();
}

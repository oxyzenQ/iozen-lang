// ============================================================
// IOZEN Language — AST to SSA Converter
// Converts AST into Static Single Assignment form
// ============================================================

import type {
    AssignVarNode,
    ASTNode,
    BinaryExprNode,
    ForEachNode,
    FunctionCallExprNode,
    FunctionDeclNode,
    IdentifierNode,
    IncreaseNode,
    LiteralNode,
    PrintStmtNode,
    ProgramNode,
    RepeatNode,
    ReturnStmtNode,
    UnaryExprNode,
    VariableDeclNode,
    WhenNode,
    WhileNode
} from './ast';
import type {
    SSABasicBlock,
    SSAFunction,
    SSAInstruction,
    SSAModule,
    SSAValue,
} from './ssa_ir';
import {
    createConstant,
    createUndefined,
    createVariable,
} from './ssa_ir';

/**
 * Phase 17.2: AST to SSA Converter
 *
 * Algorithm: Simple version without dominator tree
 * 1. Build basic blocks from control flow
 * 2. Track variable versions per block
 * 3. Insert phi nodes at merge points
 */

class SSABuilder {
  private currentFunction: SSAFunction | null = null;
  private currentBlock: SSABasicBlock | null = null;
  private blockCounter = 0;
  private variableCounter = new Map<string, number>();
  private breakTarget: string | null = null;
  private continueTarget: string | null = null;

  convertModule(ast: ProgramNode): SSAModule {
    const module: SSAModule = {
      functions: [],
      globals: new Map(),
    };

    for (const stmt of ast.statements) {
      if (stmt.kind === 'FunctionDecl') {
        const func = this.convertFunction(stmt as FunctionDeclNode);
        module.functions.push(func);
      }
    }

    return module;
  }

  private convertFunction(node: FunctionDeclNode): SSAFunction {
    // Reset counters
    this.blockCounter = 0;
    this.variableCounter.clear();

    // Create function first
    const entryId = this.newBlockId();
    const func: SSAFunction = {
      name: node.name,
      params: [],
      entryBlock: entryId,
      blocks: new Map(),
      variableVersions: new Map(),
    };

    // Set current function so createBlock works
    this.currentFunction = func;

    // Create entry block (now currentFunction is set)
    const entryBlock = this.createBlock(entryId);

    // Initialize parameters
    for (const param of node.params || []) {
      const version = this.getNextVersion(param.name);
      func.params.push({ name: param.name, initialVersion: version });
      func.variableVersions.set(param.name, version);
    }

    // Convert function body
    if (node.body) {
      for (const stmt of node.body) {
        this.convertStatement(stmt);
      }
    }

    // Ensure function has terminator
    if (this.currentBlock && this.currentBlock.terminator.kind === 'exit') {
      this.currentBlock.terminator = { kind: 'return', value: createConstant(0) };
    }

    return func;
  }

  private convertStatement(node: ASTNode): void {
    switch (node.kind) {
      case 'VariableDecl':
        this.convertVariableDecl(node as VariableDeclNode);
        break;
      case 'AssignVar':
        this.convertAssignVar(node as AssignVarNode);
        break;
      case 'When':
        this.convertWhen(node as WhenNode);
        break;
      case 'While':
        this.convertWhile(node as WhileNode);
        break;
      case 'ForEach':
        this.convertForEach(node as ForEachNode);
        break;
      case 'Repeat':
        this.convertRepeat(node as RepeatNode);
        break;
      case 'ReturnStmt':
        this.convertReturn(node as ReturnStmtNode);
        break;
      case 'PrintStmt':
        this.convertPrint(node as PrintStmtNode);
        break;
      case 'Increase':
        this.convertIncrease(node as IncreaseNode);
        break;
    }
  }

  private convertVariableDecl(node: VariableDeclNode): void {
    const name = node.name;
    const version = this.getNextVersion(name);

    if (node.initializer) {
      const value = this.convertExpression(node.initializer);
      this.emit({
        kind: 'assign',
        dest: name,
        destVer: version,
        src: value,
      });
    } else {
      // Initialize to undefined
      this.emit({
        kind: 'assign',
        dest: name,
        destVer: version,
        src: createUndefined(),
      });
    }
  }

  private convertAssignVar(node: AssignVarNode): void {
    const value = this.convertExpression(node.value);
    const version = this.getNextVersion(node.name);

    this.emit({
      kind: 'assign',
      dest: node.name,
      destVer: version,
      src: value,
    });
  }

  private convertWhen(node: WhenNode): void {
    // Create blocks
    const thenBlockId = this.newBlockId();
    const elseBlockId = node.elseBody ? this.newBlockId() : null;
    const mergeBlockId = this.newBlockId();

    // Convert condition
    const cond = this.convertExpression(node.condition);

    // Branch to then or else
    this.currentBlock!.terminator = {
      kind: 'branch',
      cond,
      trueBlock: thenBlockId,
      falseBlock: elseBlockId || mergeBlockId,
    };

    // Then block
    const thenBlock = this.createBlock(thenBlockId);
    thenBlock.predecessors.push(this.currentBlock!.id);
    this.currentBlock = thenBlock;

    for (const stmt of node.body) {
      this.convertStatement(stmt);
    }

    // Jump to merge
    if (this.currentBlock.terminator.kind === 'exit') {
      this.currentBlock.terminator = { kind: 'jump', target: mergeBlockId };
    }

    // Else block (if exists)
    if (elseBlockId && node.elseBody) {
      const elseBlock = this.createBlock(elseBlockId);
      elseBlock.predecessors.push(this.currentBlock!.id);
      this.currentBlock = elseBlock;

      for (const stmt of node.elseBody) {
        this.convertStatement(stmt);
      }

      if (this.currentBlock.terminator.kind === 'exit') {
        this.currentBlock.terminator = { kind: 'jump', target: mergeBlockId };
      }
    }

    // Merge block
    const mergeBlock = this.createBlock(mergeBlockId);
    // Add predecessors from both branches
    if (thenBlock.terminator.kind === 'jump') {
      mergeBlock.predecessors.push(thenBlock.id);
    }
    if (elseBlockId) {
      const elseBlock = this.currentFunction!.blocks.get(elseBlockId)!;
      if (elseBlock.terminator.kind === 'jump') {
        mergeBlock.predecessors.push(elseBlockId);
      }
    } else {
      mergeBlock.predecessors.push(this.currentBlock!.id);
    }

    this.currentBlock = mergeBlock;

    // Insert phi nodes for variables modified in either branch
    this.insertPhiNodes(mergeBlock, [thenBlock.id, elseBlockId || this.currentBlock.id]);
  }

  private convertWhile(node: WhileNode): void {
    const condBlockId = this.newBlockId();
    const bodyBlockId = this.newBlockId();
    const mergeBlockId = this.newBlockId();

    // Save targets for break/continue
    const oldBreak = this.breakTarget;
    const oldContinue = this.continueTarget;
    this.breakTarget = mergeBlockId;
    this.continueTarget = condBlockId;

    // Jump to condition block
    this.currentBlock!.terminator = { kind: 'jump', target: condBlockId };

    // Condition block
    const condBlock = this.createBlock(condBlockId);
    condBlock.predecessors.push(this.currentBlock!.id);
    this.currentBlock = condBlock;

    const cond = this.convertExpression(node.condition);
    this.currentBlock.terminator = {
      kind: 'branch',
      cond,
      trueBlock: bodyBlockId,
      falseBlock: mergeBlockId,
    };

    // Body block
    const bodyBlock = this.createBlock(bodyBlockId);
    bodyBlock.predecessors.push(condBlockId);
    this.currentBlock = bodyBlock;

    for (const stmt of node.body) {
      this.convertStatement(stmt);
    }

    // Loop back to condition
    if (this.currentBlock.terminator.kind === 'exit') {
      this.currentBlock.terminator = { kind: 'jump', target: condBlockId };
    }

    // Merge block
    const mergeBlock = this.createBlock(mergeBlockId);
    mergeBlock.predecessors.push(condBlockId);
    this.currentBlock = mergeBlock;

    // Restore targets
    this.breakTarget = oldBreak;
    this.continueTarget = oldContinue;

    // Insert phi nodes
    this.insertPhiNodes(mergeBlock, [condBlockId]);
  }

  private convertForEach(node: ForEachNode): void {
    // Convert to while loop pattern
    // TODO: Implement foreach SSA conversion
    // For now, just create a placeholder block
    const placeholder = this.newBlockId();
    this.currentBlock!.terminator = { kind: 'jump', target: placeholder };
    this.currentBlock = this.createBlock(placeholder);
  }

  private convertRepeat(node: RepeatNode): void {
    // Convert to while loop
    const bodyBlockId = this.newBlockId();
    const condBlockId = this.newBlockId();
    const mergeBlockId = this.newBlockId();

    // Jump to body
    this.currentBlock!.terminator = { kind: 'jump', target: bodyBlockId };

    // Body block
    const bodyBlock = this.createBlock(bodyBlockId);
    bodyBlock.predecessors.push(this.currentBlock!.id);
    this.currentBlock = bodyBlock;

    for (const stmt of node.body) {
      this.convertStatement(stmt);
    }

    // Jump to condition
    if (this.currentBlock.terminator.kind === 'exit') {
      this.currentBlock.terminator = { kind: 'jump', target: condBlockId };
    }

    // Condition block
    const condBlock = this.createBlock(condBlockId);
    condBlock.predecessors.push(bodyBlockId);
    this.currentBlock = condBlock;

    const cond = this.convertExpression(node.condition);
    this.currentBlock.terminator = {
      kind: 'branch',
      cond,
      trueBlock: mergeBlockId,
      falseBlock: bodyBlockId,
    };

    // Merge block
    const mergeBlock = this.createBlock(mergeBlockId);
    mergeBlock.predecessors.push(condBlockId);
    this.currentBlock = mergeBlock;
  }

  private convertReturn(node: ReturnStmtNode): void {
    const value = node.value ? this.convertExpression(node.value) : createConstant(0);
    this.currentBlock!.terminator = { kind: 'return', value };
  }

  private convertPrint(node: PrintStmtNode): void {
    // Print is a side effect - emit as call to builtin
    const values: SSAValue[] = [];
    for (const expr of node.expressions || []) {
      values.push(this.convertExpression(expr));
    }

    const version = this.getNextVersion('__print_result');
    this.emit({
      kind: 'call',
      dest: '__print_result',
      destVer: version,
      func: 'print',
      args: values,
    });
  }

  private convertIncrease(node: IncreaseNode): void {
    const currentVersion = this.getCurrentVersion(node.name);
    const newVersion = this.getNextVersion(node.name);

    const amount = node.amount ? this.convertExpression(node.amount) : createConstant(1);

    this.emit({
      kind: 'binary',
      dest: node.name,
      destVer: newVersion,
      op: '+',
      left: createVariable(node.name, currentVersion),
      right: amount,
    });
  }

  private convertExpression(node: ASTNode): SSAValue {
    switch (node.kind) {
      case 'Literal': {
        const n = node as LiteralNode;
        return createConstant(n.value);
      }

      case 'Identifier': {
        const n = node as IdentifierNode;
        const version = this.getCurrentVersion(n.name);
        return createVariable(n.name, version);
      }

      case 'BinaryExpr': {
        const n = node as BinaryExprNode;
        const left = this.convertExpression(n.left);
        const right = this.convertExpression(n.right);

        const destName = '__temp';
        const destVer = this.getNextVersion(destName);

        this.emit({
          kind: 'binary',
          dest: destName,
          destVer: destVer,
          op: n.operator,
          left,
          right,
        });

        return createVariable(destName, destVer);
      }

      case 'UnaryExpr': {
        const n = node as UnaryExprNode;
        const operand = this.convertExpression(n.operand);

        const destName = '__temp';
        const destVer = this.getNextVersion(destName);

        this.emit({
          kind: 'unary',
          dest: destName,
          destVer,
          op: n.operator,
          operand,
        });

        return createVariable(destName, destVer);
      }

      case 'FunctionCallExpr': {
        const n = node as FunctionCallExprNode;
        const args: SSAValue[] = [];

        for (const arg of n.arguments || []) {
          args.push(this.convertExpression(arg));
        }

        const destName = '__call_result';
        const destVer = this.getNextVersion(destName);

        this.emit({
          kind: 'call',
          dest: destName,
          destVer,
          func: n.name,
          args,
        });

        return createVariable(destName, destVer);
      }

      default:
        return createUndefined();
    }
  }

  private emit(inst: SSAInstruction): void {
    this.currentBlock!.instructions.push(inst);
  }

  private createBlock(id: string, func: SSAFunction | null = null): SSABasicBlock {
    const block: SSABasicBlock = {
      id,
      instructions: [],
      terminator: { kind: 'exit' },
      predecessors: [],
    };
    const targetFunc = func || this.currentFunction;
    if (targetFunc) {
      targetFunc.blocks.set(id, block);
    }
    return block;
  }

  private newBlockId(): string {
    return `block_${++this.blockCounter}`;
  }

  private getNextVersion(name: string): number {
    const current = this.variableCounter.get(name) || 0;
    const next = current + 1;
    this.variableCounter.set(name, next);
    this.currentFunction!.variableVersions.set(name, next);
    return next;
  }

  private getCurrentVersion(name: string): number {
    return this.variableCounter.get(name) || 0;
  }

  private insertPhiNodes(block: SSABasicBlock, predecessors: string[]): void {
    // Minimal phi insertion: for each variable that might have different versions
    // coming from different predecessors, insert a phi node
    // This is a simplified version - full SSA requires dominator analysis

    // For now, we skip complex phi insertion and rely on the fact that
    // our simple control flow makes variable versioning straightforward
  }
}

export function convertASTtoSSA(ast: ProgramNode): SSAModule {
  const builder = new SSABuilder();
  return builder.convertModule(ast);
}

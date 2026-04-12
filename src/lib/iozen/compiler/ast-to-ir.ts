// AST to IR Generator
// Converts IOZEN AST to Intermediate Representation

import type * as AST from '../parser_v2';
import type { IRProgram, IRValue } from './ir';
import { IRBuilder, createIRBuilder } from './ir';

export class ASTToIR {
  private builder: IRBuilder;
  private variableTypes: Map<string, IRValue['type']> = new Map();

  constructor() {
    this.builder = createIRBuilder();
  }

  generate(program: AST.Program): IRProgram {
    this.builder.reset();
    this.variableTypes.clear();

    // Process all statements at program level
    for (const stmt of program.body) {
      this.processGlobalStatement(stmt);
    }

    return this.builder.getProgram();
  }

  private processGlobalStatement(stmt: AST.Statement) {
    switch (stmt.type) {
      case 'FunctionDeclaration':
        this.generateFunction(stmt);
        break;
      case 'VariableDeclaration':
        // Global variable - store type and init value
        const type = this.mapType(stmt.typeAnnotation);
        this.variableTypes.set(stmt.name, type);
        // Globals will be initialized in main or as statics
        break;
      default:
        // Other global statements go into main function
        // For now, skip them (should collect and put in main)
        break;
    }
  }

  private generateFunction(func: AST.FunctionDeclaration) {
    const returnType = func.returnType ? this.mapType(func.returnType) : 'void';
    this.builder.newFunction(func.name, returnType);

    // Add parameters
    for (let i = 0; i < func.params.length; i++) {
      const paramName = func.params[i];
      const paramType = func.paramTypes && func.paramTypes[i]
        ? this.mapType(func.paramTypes[i])
        : 'ptr';
      this.builder.addParam(paramName, paramType);
      this.variableTypes.set(paramName, paramType);
    }

    // Generate function body
    for (const stmt of func.body) {
      this.generateStatement(stmt);
    }

    // Ensure function has return if needed
    const funcData = this.builder.getProgram().functions.find(f => f.name === func.name);
    if (funcData && funcData.instructions.length === 0) {
      this.builder.emitRet();
    }
  }

  private generateStatement(stmt: AST.Statement): string | undefined {
    switch (stmt.type) {
      case 'VariableDeclaration':
        return this.genVariableDeclaration(stmt);
      case 'AssignmentStatement':
        return this.genAssignment(stmt);
      case 'PrintStatement':
        return this.genPrint(stmt);
      case 'IfStatement':
        return this.genIf(stmt);
      case 'WhileStatement':
        return this.genWhile(stmt);
      case 'ForStatement':
        return this.genFor(stmt);
      case 'ReturnStatement':
        return this.genReturn(stmt);
      case 'BreakStatement':
      case 'ContinueStatement':
        // TODO: Implement loop control flow
        return undefined;
      case 'ExpressionStatement':
        return this.genExpression(stmt.expression);
      case 'TryStatement':
      case 'ThrowStatement':
        // TODO: Exception handling
        return undefined;
      case 'ImportStatement':
      case 'ExportStatement':
        // TODO: Module system
        return undefined;
      default:
        return undefined;
    }
  }

  private genVariableDeclaration(stmt: AST.VariableDeclaration): string {
    const type = this.mapType(stmt.typeAnnotation);
    const value = this.genExpression(stmt.initializer);

    this.builder.addLocal(stmt.name, type);
    this.variableTypes.set(stmt.name, type);

    if (value) {
      this.builder.emitStore(stmt.name, value);
    }

    return stmt.name;
  }

  private genAssignment(stmt: AST.AssignmentStatement): string {
    const value = this.genExpression(stmt.value);
    if (value) {
      this.builder.emitStore(stmt.name, value);
    }
    return stmt.name;
  }

  private genPrint(stmt: AST.PrintStatement): string {
    const value = this.genExpression(stmt.argument);
    this.builder.emitPrint(value || '""');
    return value || '';
  }

  private genIf(stmt: AST.IfStatement): string | undefined {
    const cond = this.genExpression(stmt.condition);
    const thenLabel = this.builder.newLabel('then');
    const elseLabel = this.builder.newLabel('else');
    const endLabel = this.builder.newLabel('endif');

    // Branch
    const notCond = this.builder.newTemp('bool');
    this.builder.emit({ op: 'not', dest: notCond, src1: cond, comment: `${notCond} = !${cond}` });
    this.builder.emit({ op: 'if', src1: notCond, label: stmt.elseBranch ? elseLabel : endLabel, comment: `if !${cond} goto ${stmt.elseBranch ? elseLabel : endLabel}` });

    // Then branch
    this.builder.emitLabel(thenLabel);
    for (const s of stmt.thenBranch) {
      this.generateStatement(s);
    }
    this.builder.emitGoto(endLabel);

    // Else branch
    if (stmt.elseBranch) {
      this.builder.emitLabel(elseLabel);
      for (const s of stmt.elseBranch) {
        this.generateStatement(s);
      }
    }

    this.builder.emitLabel(endLabel);
    return undefined;
  }

  private genWhile(stmt: AST.WhileStatement): string | undefined {
    const startLabel = this.builder.newLabel('while');
    const bodyLabel = this.builder.newLabel('while_body');
    const endLabel = this.builder.newLabel('while_end');

    this.builder.emitLabel(startLabel);
    const cond = this.genExpression(stmt.condition);
    this.builder.emit({ op: 'if', src1: cond, label: bodyLabel, comment: `if ${cond} goto ${bodyLabel}` });
    this.builder.emitGoto(endLabel);

    this.builder.emitLabel(bodyLabel);
    for (const s of stmt.body) {
      this.generateStatement(s);
    }
    this.builder.emitGoto(startLabel);

    this.builder.emitLabel(endLabel);
    return undefined;
  }

  private genFor(stmt: AST.ForStatement): string | undefined {
    // For now, desugar to while
    // TODO: Proper for loop with initializer, condition, increment
    return undefined;
  }

  private genReturn(stmt: AST.ReturnStatement): string | undefined {
    if (stmt.value) {
      const value = this.genExpression(stmt.value);
      this.builder.emitRet(value);
    } else {
      this.builder.emitRet();
    }
    return undefined;
  }

  private genExpression(expr: AST.Expression): string {
    switch (expr.type) {
      case 'NumberLiteral':
        const numTemp = this.builder.newTemp('number');
        this.builder.emitConst(numTemp, { type: 'number', value: expr.value });
        return numTemp;

      case 'StringLiteral':
        const strTemp = this.builder.newTemp('string');
        this.builder.emitConst(strTemp, { type: 'string', value: expr.value });
        return strTemp;

      case 'Identifier':
        const idTemp = this.builder.newTemp(this.variableTypes.get(expr.name) || 'ptr');
        this.builder.emitLoad(idTemp, expr.name);
        return idTemp;

      case 'BinaryExpression':
        return this.genBinary(expr);

      case 'CallExpression':
        return this.genCall(expr);

      case 'ArrayLiteral':
        return this.genArrayLiteral(expr);

      case 'StructLiteral':
        return this.genStructLiteral(expr);

      case 'ArrayAccess':
        return this.genArrayAccess(expr);

      case 'FieldAccess':
        return this.genFieldAccess(expr);

      default:
        return this.builder.newTemp('ptr');
    }
  }

  private genBinary(expr: AST.BinaryExpression): string {
    // Optimization: Constant folding - evaluate constant expressions at compile time
    const constResult = this.tryConstantFold(expr);
    if (constResult !== null) {
      const result = this.builder.newTemp(constResult.type);
      this.builder.emitConst(result, constResult);
      return result;
    }

    const left = this.genExpression(expr.left);
    const right = this.genExpression(expr.right);
    const result = this.builder.newTemp('number');

    const opMap: Record<string, 'add' | 'sub' | 'mul' | 'div' | 'mod' | 'eq' | 'ne' | 'lt' | 'le' | 'gt' | 'ge' | 'and' | 'or'> = {
      '+': 'add',
      '-': 'sub',
      '*': 'mul',
      '/': 'div',
      '%': 'mod',
      '==': 'eq',
      '!=': 'ne',
      '<': 'lt',
      '<=': 'le',
      '>': 'gt',
      '>=': 'ge',
      '&&': 'and',
      '||': 'or'
    };

    const op = opMap[expr.operator] || 'add';
    this.builder.emitBinary(op, result, left, right);
    return result;
  }

  // Constant folding optimization: try to evaluate expression at compile time
  private tryConstantFold(expr: AST.Expression): IRValue | null {
    if (expr.type !== 'BinaryExpression') return null;

    // Only fold if both operands are constants
    const left = this.getConstantValue(expr.left);
    const right = this.getConstantValue(expr.right);
    if (left === null || right === null) return null;

    // Both are constants - evaluate now
    const op = expr.operator;

    if (left.type === 'number' && right.type === 'number') {
      const l = left.value as number;
      const r = right.value as number;
      let result: number;

      switch (op) {
        case '+': result = l + r; break;
        case '-': result = l - r; break;
        case '*': result = l * r; break;
        case '/': result = r !== 0 ? l / r : 0; break;
        case '%': result = r !== 0 ? l % r : 0; break;
        default: return null;
      }

      return { type: 'number', value: result };
    }

    if (left.type === 'string' && right.type === 'string' && op === '+') {
      return { type: 'string', value: left.value + right.value };
    }

    return null;
  }

  private getConstantValue(expr: AST.Expression): IRValue | null {
    switch (expr.type) {
      case 'NumberLiteral':
        return { type: 'number', value: expr.value };
      case 'StringLiteral':
        return { type: 'string', value: expr.value };
      case 'BinaryExpression':
        // Recursively try to fold nested expressions
        return this.tryConstantFold(expr);
      default:
        return null;
    }
  }

  private genCall(expr: AST.CallExpression): string {
    const args = expr.arguments.map(arg => this.genExpression(arg));
    const result = this.builder.newTemp('ptr');
    this.builder.emitCall(result, expr.callee, args);
    return result;
  }

  private genArrayLiteral(expr: AST.ArrayLiteral): string {
    // TODO: Proper array literal handling
    const result = this.builder.newTemp('ptr');
    this.builder.emit({ op: 'array', dest: result, comment: 'array literal' });
    return result;
  }

  private genStructLiteral(expr: AST.StructLiteral): string {
    // TODO: Proper struct literal handling
    const result = this.builder.newTemp('ptr');
    this.builder.emit({ op: 'load', dest: result, comment: 'struct literal' });
    return result;
  }

  private genArrayAccess(expr: AST.ArrayAccess): string {
    const array = this.genExpression(expr.array);
    const index = this.genExpression(expr.index);
    const result = this.builder.newTemp('ptr');
    this.builder.emit({ op: 'index', dest: result, src1: array, src2: index, comment: `${result} = ${array}[${index}]` });
    return result;
  }

  private genFieldAccess(expr: AST.FieldAccess): string {
    const obj = this.genExpression(expr.object);
    const result = this.builder.newTemp('ptr');
    this.builder.emit({ op: 'field', dest: result, src1: obj, comment: `${result} = ${obj}.${expr.field}` });
    return result;
  }

  private mapType(type: string | null | undefined): IRValue['type'] {
    if (!type) return 'ptr';
    switch (type) {
      case 'number': return 'number';
      case 'string': return 'string';
      case 'bool': return 'bool';
      case 'void': return 'void';
      case 'array': return 'ptr';
      case 'function': return 'ptr';
      case 'any': return 'ptr';
      default: return 'ptr';
    }
  }
}

export function astToIR(program: AST.Program): IRProgram {
  const generator = new ASTToIR();
  return generator.generate(program);
}

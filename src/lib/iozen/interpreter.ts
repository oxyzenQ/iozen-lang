// ============================================================
// IOZEN Language — Interpreter (Tree-Walking)
// Executes IOZEN programs by walking the AST
// ============================================================

import { Lexer } from './lexer';
import { Parser } from './parser';
import { ParseError } from './parser';
import { Environment, RuntimeError, IOZENValue, IOZENResult, IOZENObject, IOZENMap, IOZENFunction } from './environment';
import type {
  ASTNode, ProgramNode, VariableDeclNode, FunctionDeclNode,
  StructureDeclNode, EnumDeclNode, PrintStmtNode, ReturnStmtNode,
  WhenNode, CheckNode, RepeatNode, WhileNode, ForEachNode,
  IncreaseNode, SetFieldNode, AssignVarNode, FunctionCallStmtNode, BlockNode,
  BinaryExprNode, UnaryExprNode, AttachExprNode, IdentifierNode,
  LiteralNode, FunctionCallExprNode, MemberAccessNode,
  IndexAccessNode, ListLiteralNode, HasValueNode, ValueInsideNode,
} from './ast';

// Special signal to unwind the call stack for return/exit
class ReturnSignal {
  constructor(public value: IOZENValue) {}
}

class ExitSignal {
  constructor(public target: string | null) {}
}

export class Interpreter {
  private env: Environment;
  private output: string[] = [];
  private maxIterations: number = 100000;
  private iterationCount: number = 0;
  private structureDefs: Map<string, { fields: { name: string; typeName: string }[] }> = new Map();
  private source: string = '';
  private sourceLines: string[] = [];

  constructor() {
    this.env = new Environment();
    this.registerBuiltins();
  }

  public run(source: string): { output: string[]; errors: string[] } {
    this.output = [];
    this.iterationCount = 0;
    this.source = source;
    this.sourceLines = source.split('\n');

    try {
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      this.executeBlock(ast.statements, this.env);
    } catch (e) {
      if (e instanceof ParseError) {
        return {
          output: [],
          errors: [this.formatParseError(e)],
        };
      }
      if (e instanceof RuntimeError) {
        return {
          output: this.output,
          errors: [this.formatRuntimeError(e)],
        };
      }
      if (e instanceof Error) {
        return {
          output: this.output,
          errors: [`Error: ${e.message}`],
        };
      }
      return {
        output: this.output,
        errors: [`Unknown error: ${String(e)}`],
      };
    }

    return { output: this.output, errors: [] };
  }

  private execute(node: ASTNode, env: Environment): void {
    this.checkIterationLimit();

    switch (node.kind) {
      case 'Program':
        this.executeBlock(node.statements, env);
        break;
      case 'VariableDecl':
        this.execVariableDecl(node as VariableDeclNode, env);
        break;
      case 'FunctionDecl':
        this.execFunctionDecl(node as FunctionDeclNode, env);
        break;
      case 'StructureDecl':
        this.execStructureDecl(node as StructureDeclNode);
        break;
      case 'EnumDecl':
        this.execEnumDecl(node as EnumDeclNode);
        break;
      case 'PrintStmt':
        this.execPrint(node as PrintStmtNode, env);
        break;
      case 'ReturnStmt':
        this.execReturn(node as ReturnStmtNode, env);
        break;
      case 'When':
        this.execWhen(node as WhenNode, env);
        break;
      case 'Check':
        this.execCheck(node as CheckNode, env);
        break;
      case 'Repeat':
        this.execRepeat(node as RepeatNode, env);
        break;
      case 'While':
        this.execWhile(node as WhileNode, env);
        break;
      case 'ForEach':
        this.execForEach(node as ForEachNode, env);
        break;
      case 'Increase':
        this.execIncrease(node as IncreaseNode, env);
        break;
      case 'SetField':
        this.execSetField(node as SetFieldNode, env);
        break;
      case 'AssignVar':
        this.execAssignVar(node as AssignVarNode, env);
        break;
      case 'FunctionCallStmt':
        this.execFunctionCallStmt(node as FunctionCallStmtNode, env);
        break;
      case 'Block':
        this.executeBlock(node.statements, env);
        break;
      default:
        // If it's an expression, evaluate it (side effects)
        this.evaluate(node, env);
        break;
    }
  }

  private executeBlock(statements: ASTNode[], env: Environment): void {
    for (const stmt of statements) {
      this.execute(stmt, env);
    }
  }

  // ---- Error Formatting ----

  private formatRuntimeError(e: RuntimeError): string {
    const lines: string[] = [];

    // Try to find the relevant name in the source for common error patterns
    const nameMatch = e.message.match(/"([^"]+)"/);
    let loc: { line: number; column: number } | null = null;
    if (nameMatch) {
      const name = nameMatch[1];
      loc = this.findNameInSource(name);
    }

    // If the error already has line info, use it
    if (e.line !== undefined && e.line > 0) {
      loc = { line: e.line, column: e.column };
    }

    // Check if we should add "did you mean?" for undefined variable/function errors
    const baseMessage = e.message.includes('\n')
      ? e.message  // already has suggestion embedded
      : this.enrichWithSuggestion(e.message);

    lines.push(`Runtime error: ${baseMessage}`);

    if (loc) {
      this.appendSourceContext(lines, loc.line, loc.column);
    }

    return lines.join('\n');
  }

  private enrichWithSuggestion(message: string): string {
    const nameMatch = message.match(/"(?:Undefined (?:variable|function): )?([^"]+)"/);
    if (!nameMatch) return message;

    // Handle patterns like: Undefined variable: "foo" or Undefined function: "foo"
    const undefMatch = message.match(/Undefined (?:variable|function):\s*"([^"]+)"/);
    if (undefMatch) {
      const name = undefMatch[1];
      const suggestion = this.suggestSimilar(name);
      if (suggestion) {
        return `${message}\n  Did you mean: "${suggestion}"?`;
      }
    }

    return message;
  }

  private formatParseError(e: ParseError): string {
    const lines: string[] = [];
    lines.push(`Parse error: ${e.message}`);
    this.appendSourceContext(lines, e.token.line, e.token.column);
    return lines.join('\n');
  }

  private appendSourceContext(lines: string[], lineNum: number, column?: number): void {
    const idx = lineNum - 1;
    if (idx < 0 || idx >= this.sourceLines.length) return;

    const lineContent = this.sourceLines[idx];
    lines.push(`  --> Line ${lineNum}` + (column ? `, Column ${column}` : ''));
    lines.push('    |');
    lines.push(`${String(lineNum).padStart(2)} | ${lineContent}`);

    if (column !== undefined && column > 0) {
      const pad = String(column).length + 5;
      lines.push(`${' '.repeat(pad)}|${' '.repeat(column - 1)}^`);
    }
  }

  private findNameInSource(name: string): { line: number; column: number } | null {
    // Search source lines for the name, excluding comments
    for (let i = 0; i < this.sourceLines.length; i++) {
      const line = this.sourceLines[i];
      // Skip comment-only lines
      const codePart = line.split('#')[0];
      const col = codePart.indexOf(name);
      if (col !== -1) {
        return { line: i + 1, column: col + 1 };
      }
    }
    return null;
  }

  // ---- Statement Executors ----

  private execVariableDecl(node: VariableDeclNode, env: Environment): void {
    let value: IOZENValue;

    if (node.value) {
      const evaluated = this.evaluate(node.value, env);

      // If the value is a __struct_init__ result, attach the declared class name
      if (evaluated && typeof evaluated === 'object' &&
          !(Array.isArray(evaluated)) &&
          node.value.kind === 'FunctionCallExpr' &&
          (node.value as FunctionCallExprNode).name === '__struct_init__') {
        // Tag it as an IOZEN object with the declared type name
        (evaluated as IOZENObject).__iozen_type = 'object';
        (evaluated as IOZENObject).__class_name = node.typeName;
      }

      value = evaluated;
    } else {
      // Default values based on type
      value = this.getDefaultValue(node.typeName);
    }

    env.define(node.name, value, node.isConstant);
  }

  private execFunctionDecl(node: FunctionDeclNode, env: Environment): void {
    const func: IOZENFunction = {
      __iozen_type: 'function',
      name: node.name,
      parameters: node.parameters,
      returnType: node.returnType,
      body: node.body,
      closure: env,
    };
    env.define(node.name, func);
  }

  private execStructureDecl(node: StructureDeclNode): void {
    this.structureDefs.set(node.name.toLowerCase(), { fields: node.fields });
  }

  private execEnumDecl(node: EnumDeclNode): void {
    // Register enum constructors in the environment
    for (const enumCase of node.cases) {
      env.define(enumCase.name, {
        __iozen_type: 'function',
        name: enumCase.name,
        parameters: enumCase.fields.map(f => ({ name: f.name, typeName: f.typeName, qualifiers: [] })),
        returnType: node.name,
        body: [],
        closure: env,
      });
    }
  }

  private execPrint(node: PrintStmtNode, env: Environment): void {
    const parts: string[] = [];
    for (const expr of node.expressions) {
      const val = this.evaluate(expr, env);
      parts.push(this.iozenValueToString(val));
    }
    this.output.push(parts.join(''));
  }

  private execReturn(node: ReturnStmtNode, env: Environment): void {
    const value = node.value ? this.evaluate(node.value, env) : null;
    throw new ReturnSignal(value);
  }

  private execWhen(node: WhenNode, env: Environment): void {
    for (const branch of node.branches) {
      const cond = this.evaluate(branch.condition, env);
      if (this.isTruthy(cond)) {
        this.executeBlock(branch.body, env);
        return;
      }
    }

    if (node.otherwise) {
      this.executeBlock(node.otherwise, env);
    }
  }

  private execCheck(node: CheckNode, env: Environment): void {
    const target = this.evaluate(node.target, env);

    if (target && typeof target === 'object' && (target as IOZENResult).__iozen_type === 'result') {
      const result = target as IOZENResult;

      for (const checkCase of node.cases) {
        if ((result.ok && checkCase.name === 'Ok') || (!result.ok && checkCase.name === 'Error')) {
          const caseEnv = env.child();

          if (checkCase.binding) {
            caseEnv.define(checkCase.binding, result.ok ? result.value! : result.error!);
          }

          this.executeBlock(checkCase.body, caseEnv);
          return;
        }
      }
    }
  }

  private execRepeat(node: RepeatNode, env: Environment): void {
    const count = Math.floor(this.toNumber(this.evaluate(node.count, env)));
    const envWithCounter = env.child();

    for (let i = 0; i < count; i++) {
      envWithCounter.define('__index__', i);
      try {
        this.executeBlock(node.body, envWithCounter);
      } catch (e) {
        if (e instanceof ExitSignal) {
          if (e.target === node.label || !e.target) break;
          throw e; // re-throw if targeting outer loop
        }
        throw e;
      }
    }
  }

  private execWhile(node: WhileNode, env: Environment): void {
    while (this.isTruthy(this.evaluate(node.condition, env))) {
      try {
        this.executeBlock(node.body, env);
      } catch (e) {
        if (e instanceof ExitSignal) throw e;
        throw e;
      }
    }
  }

  private execForEach(node: ForEachNode, env: Environment): void {
    const iterable = this.evaluate(node.iterable, env);

    if (Array.isArray(iterable)) {
      const childEnv = env.child();
      for (const item of iterable) {
        childEnv.define(node.variable, item);
        this.executeBlock(node.body, childEnv);
      }
    } else if (typeof iterable === 'string') {
      const childEnv = env.child();
      for (const ch of iterable) {
        childEnv.define(node.variable, ch);
        this.executeBlock(node.body, childEnv);
      }
    } else {
      throw new RuntimeError(`Cannot iterate over ${typeof iterable}`, ...this.findNodeLine('for each'));
    }
  }

  private execIncrease(node: IncreaseNode, env: Environment): void {
    const target = this.evaluate(node.target, env);
    const amount = this.toNumber(this.evaluate(node.amount, env));

    if (node.target.kind === 'Identifier') {
      const name = (node.target as IdentifierNode).name;
      const current = this.toNumber(env.get(name));
      env.set(name, current + amount);
    }
  }

  private execSetField(node: SetFieldNode, env: Environment): void {
    const targetName = node.fieldPath[0];
    const obj = env.get(targetName) as IOZENObject;

    if (node.fieldPath.length === 2) {
      obj[node.fieldPath[1]] = this.evaluate(node.value, env);
    } else {
      // Nested field access
      let current: IOZENValue = obj;
      for (let i = 1; i < node.fieldPath.length - 1; i++) {
        current = (current as IOZENObject)[node.fieldPath[i]];
      }
      (current as IOZENObject)[node.fieldPath[node.fieldPath.length - 1]] = this.evaluate(node.value, env);
    }
  }

  private execAssignVar(node: AssignVarNode, env: Environment): void {
    const value = this.evaluate(node.value, env);
    env.set(node.name, value);
  }

  private execFunctionCallStmt(node: FunctionCallStmtNode, env: Environment): void {
    this.callFunction(node.name, node.arguments, env);
  }

  // ---- Expression Evaluator ----

  private evaluate(node: ASTNode, env: Environment): IOZENValue {
    switch (node.kind) {
      case 'Literal':
        return (node as LiteralNode).value;

      case 'Identifier':
        return env.get((node as IdentifierNode).name);

      case 'BinaryExpr': {
        const b = node as BinaryExprNode;
        const left = this.evaluate(b.left, env);
        const right = this.evaluate(b.right, env);
        return this.evalBinary(b.operator, left, right);
      }

      case 'UnaryExpr': {
        const u = node as UnaryExprNode;
        const operand = this.evaluate(u.operand, env);
        return this.evalUnary(u.operator, operand);
      }

      case 'AttachExpr': {
        const a = node as AttachExprNode;
        const parts: string[] = [];
        for (const part of a.parts) {
          const val = this.evaluate(part, env);
          parts.push(this.iozenValueToString(val));
        }
        return parts.join('');
      }

      case 'FunctionCallExpr': {
        const f = node as FunctionCallExprNode;
        return this.callFunction(f.name, f.arguments, env);
      }

      case 'MemberAccess': {
        const m = node as MemberAccessNode;
        const obj = this.evaluate(m.object, env);
        if (obj && typeof obj === 'object' && m.field in obj) {
          return (obj as Record<string, IOZENValue>)[m.field];
        }
        throw new RuntimeError(`Cannot access field "${m.field}"`, ...this.findNameInSourceOrThrow(m.field));
      }

      case 'IndexAccess': {
        const i = node as IndexAccessNode;
        const obj = this.evaluate(i.object, env);
        const idx = Math.floor(this.toNumber(this.evaluate(i.index, env)));
        if (Array.isArray(obj)) {
          return obj[idx];
        }
        if (typeof obj === 'string') {
          return obj[idx];
        }
        throw new RuntimeError(`Cannot index ${typeof obj}`, ...this.findNodeLine('[]'));
      }

      case 'ListLiteral': {
        const l = node as ListLiteralNode;
        return l.elements.map(el => this.evaluate(el, env));
      }

      case 'HasValue': {
        const h = node as HasValueNode;
        const val = this.evaluate(h.expression, env);
        return val !== null && val !== undefined;
      }

      case 'ValueInside': {
        const v = node as ValueInsideNode;
        const val = this.evaluate(v.expression, env);
        if (val && typeof val === 'object' && (val as IOZENResult).__iozen_type === 'result') {
          return (val as IOZENResult).ok ? (val as IOZENResult).value! : null;
        }
        return val;
      }

      default:
        throw new RuntimeError(`Unknown expression kind: ${(node as ASTNode).kind}`);
    }
  }

  private evalBinary(op: string, left: IOZENValue, right: IOZENValue): IOZENValue {
    switch (op) {
      case '+':
        if (typeof left === 'string' || typeof right === 'string') {
          return String(left) + String(right);
        }
        return this.toNumber(left) + this.toNumber(right);
      case '-': return this.toNumber(left) - this.toNumber(right);
      case '*': return this.toNumber(left) * this.toNumber(right);
      case '/':
        if (this.toNumber(right) === 0) throw new RuntimeError('Division by zero', ...this.findNodeLine('/'));
        return this.toNumber(left) / this.toNumber(right);
      case '%': return this.toNumber(left) % this.toNumber(right);
      case '==': return left === right;
      case '!=': return left !== right;
      case '<': return this.toNumber(left) < this.toNumber(right);
      case '>': return this.toNumber(left) > this.toNumber(right);
      case '<=': return this.toNumber(left) <= this.toNumber(right);
      case '>=': return this.toNumber(left) >= this.toNumber(right);
      case 'and': return this.isTruthy(left) && this.isTruthy(right);
      case 'or': return this.isTruthy(left) || this.isTruthy(right);
      default:
        throw new RuntimeError(`Unknown operator: ${op}`, ...this.findNodeLine(op));
    }
  }

  private evalUnary(op: string, operand: IOZENValue): IOZENValue {
    switch (op) {
      case '-': return -this.toNumber(operand);
      case 'not': return !this.isTruthy(operand);
      default:
        throw new RuntimeError(`Unknown unary operator: ${op}`, ...this.findNodeLine(op));
    }
  }

  // ---- Function Calling ----

  private callFunction(name: string, argNodes: ASTNode[], env: Environment): IOZENValue {
    // Evaluate arguments
    const args = argNodes.map(a => this.evaluate(a, env));

    // Built-in functions (try all built-in routes first)
    if (name === '__struct_init__') {
      // Structure field initialization: pairs of [fieldName, fieldValue]
      const obj: IOZENObject = { __iozen_type: 'object', __class_name: 'Unknown' } as IOZENObject;
      for (let i = 0; i < args.length; i += 2) {
        const fieldName = String(args[i]);
        const fieldValue = i + 1 < args.length ? args[i + 1] : null;
        obj[fieldName] = fieldValue;
      }
      return obj;
    }
    if (this.callBuiltin(name, args)) {
      return this.env.get('__last_result__');
    }
    if (this.callBuiltinByName(name, args)) {
      return this.env.get('__last_result__');
    }

    // User-defined function
    let func: IOZENFunction | undefined;
    try {
      func = env.get(name) as IOZENFunction;
    } catch {
      // Function not found in env — fall through to error
    }

    if (func && func.__iozen_type === 'function') {
      if (func.body.length === 0) {
        // Enum constructor — create a result-like object
        if (args.length === 1) {
          return { __iozen_type: 'result', ok: true, value: args[0] } as IOZENResult;
        }
        return { __iozen_type: 'result', ok: false, error: String(args[0] || 'unknown error') } as IOZENResult;
      }

      // Create new scope for function
      const funcEnv = func.closure.child();

      // Bind parameters
      for (let i = 0; i < func.parameters.length && i < args.length; i++) {
        funcEnv.define(func.parameters[i].name, args[i]);
      }

      // Execute body
      try {
        this.executeBlock(func.body, funcEnv);
      } catch (e) {
        if (e instanceof ReturnSignal) {
          return e.value;
        }
        throw e;
      }

      return null;
    }

    // Unknown function — try as math/built-in
    if (this.callBuiltinByName(name, args)) {
      return this.env.get('__last_result__');
    }

    const suggestion = this.suggestSimilar(name);
    const msg = suggestion
      ? `Undefined function: "${name}"\n  Did you mean: "${suggestion}"?`
      : `Undefined function: "${name}"`;
    throw new RuntimeError(msg, ...this.findNameInSourceOrThrow(name));
  }

  // ---- Built-in Functions ----

  private registerBuiltins(): void {
    // Registered via callBuiltin
  }

  private callBuiltin(name: string, args: IOZENValue[]): boolean {
    switch (name.toLowerCase()) {
      case '__print__':
      case 'println': {
        const text = args.map(a => this.iozenValueToString(a)).join(' ');
        this.output.push(text);
        this.env.define('__last_result__', null);
        return true;
      }
      case '__size__': {
        const val = args[0];
        if (Array.isArray(val)) {
          this.env.define('__last_result__', val.length);
        } else if (typeof val === 'string') {
          this.env.define('__last_result__', val.length);
        } else {
          this.env.define('__last_result__', 0);
        }
        return true;
      }
      default:
        return false;
    }
  }

  private callBuiltinByName(name: string, args: IOZENValue[]): boolean {
    const n = name.toLowerCase();

    // Math functions
    if (n === 'abs' && args.length >= 1) {
      this.env.define('__last_result__', Math.abs(this.toNumber(args[0])));
      return true;
    }
    if (n === 'sqrt' && args.length >= 1) {
      this.env.define('__last_result__', Math.sqrt(this.toNumber(args[0])));
      return true;
    }
    if (n === 'floor' && args.length >= 1) {
      this.env.define('__last_result__', Math.floor(this.toNumber(args[0])));
      return true;
    }
    if (n === 'ceil' && args.length >= 1) {
      this.env.define('__last_result__', Math.ceil(this.toNumber(args[0])));
      return true;
    }
    if (n === 'round' && args.length >= 1) {
      this.env.define('__last_result__', Math.round(this.toNumber(args[0])));
      return true;
    }
    if (n === 'power' && args.length >= 2) {
      this.env.define('__last_result__', Math.pow(this.toNumber(args[0]), this.toNumber(args[1])));
      return true;
    }
    if (n === 'min' && args.length >= 2) {
      this.env.define('__last_result__', Math.min(this.toNumber(args[0]), this.toNumber(args[1])));
      return true;
    }
    if (n === 'max' && args.length >= 2) {
      this.env.define('__last_result__', Math.max(this.toNumber(args[0]), this.toNumber(args[1])));
      return true;
    }

    // String functions
    if (n === 'uppercase' && args.length >= 1) {
      this.env.define('__last_result__', String(args[0]).toUpperCase());
      return true;
    }
    if (n === 'lowercase' && args.length >= 1) {
      this.env.define('__last_result__', String(args[0]).toLowerCase());
      return true;
    }
    if (n === 'trim' && args.length >= 1) {
      this.env.define('__last_result__', String(args[0]).trim());
      return true;
    }
    if (n === 'substring' && args.length >= 3) {
      this.env.define('__last_result__', String(args[0]).substring(
        this.toNumber(args[1]), this.toNumber(args[2])
      ));
      return true;
    }
    if (n === 'contains' && args.length >= 2) {
      this.env.define('__last_result__', String(args[0]).includes(String(args[1])));
      return true;
    }
    if (n === 'replace' && args.length >= 3) {
      this.env.define('__last_result__', String(args[0]).replaceAll(String(args[1]), String(args[2])));
      return true;
    }
    if (n === 'split' && args.length >= 2) {
      this.env.define('__last_result__', String(args[0]).split(String(args[1])));
      return true;
    }
    if (n === 'char_at' && args.length >= 2) {
      this.env.define('__last_result__', String(args[0])[Math.floor(this.toNumber(args[1]))]);
      return true;
    }
    if (n === 'ord' && args.length >= 1) {
      const str = String(args[0]);
      this.env.define('__last_result__', str.length > 0 ? str.charCodeAt(0) : 0);
      return true;
    }
    if (n === 'chr' && args.length >= 1) {
      this.env.define('__last_result__', String.fromCharCode(Math.floor(this.toNumber(args[0]))));
      return true;
    }

    // Type conversion
    if ((n === 'to_integer' || n === 'int') && args.length >= 1) {
      this.env.define('__last_result__', parseInt(String(args[0]), 10));
      return true;
    }
    if (n === 'to_float' && args.length >= 1) {
      this.env.define('__last_result__', parseFloat(String(args[0])));
      return true;
    }
    if (n === 'to_text' && args.length >= 1) {
      this.env.define('__last_result__', String(args[0]));
      return true;
    }

    // List functions
    if (n === 'push' && args.length >= 2 && Array.isArray(args[0])) {
      (args[0] as IOZENValue[]).push(args[1]);
      this.env.define('__last_result__', args[0]);
      return true;
    }
    if (n === 'pop' && args.length >= 1 && Array.isArray(args[0])) {
      const arr = args[0] as IOZENValue[];
      this.env.define('__last_result__', arr.length > 0 ? arr.pop()! : null);
      return true;
    }
    if (n === 'sort' && args.length >= 1 && Array.isArray(args[0])) {
      this.env.define('__last_result__', [...(args[0] as IOZENValue[])].sort((a, b) => {
        const na = this.toNumber(a);
        const nb = this.toNumber(b);
        return na - nb;
      }));
      return true;
    }
    if (n === 'reverse' && args.length >= 1 && Array.isArray(args[0])) {
      this.env.define('__last_result__', [...(args[0] as IOZENValue[])].reverse());
      return true;
    }
    if (n === 'join' && args.length >= 1 && Array.isArray(args[0])) {
      const separator = args.length >= 2 ? String(args[1]) : '';
      this.env.define('__last_result__', (args[0] as IOZENValue[]).map(a => String(a)).join(separator));
      return true;
    }
    if (n === 'range' && args.length >= 2) {
      const start = this.toNumber(args[0]);
      const end = this.toNumber(args[1]);
      const step = args.length >= 3 ? this.toNumber(args[2]) : (start <= end ? 1 : -1);
      const arr: IOZENValue[] = [];
      if (step > 0) {
        for (let i = start; i < end; i += step) arr.push(i);
      } else if (step < 0) {
        for (let i = start; i > end; i += step) arr.push(i);
      }
      this.env.define('__last_result__', arr);
      return true;
    }
    if (n === 'sum' && args.length >= 1 && Array.isArray(args[0])) {
      this.env.define('__last_result__', (args[0] as IOZENValue[]).reduce((s, v) => s + this.toNumber(v), 0));
      return true;
    }
    if (n === 'length' && args.length >= 1) {
      const v = args[0];
      if (Array.isArray(v)) this.env.define('__last_result__', v.length);
      else if (typeof v === 'string') this.env.define('__last_result__', v.length);
      else this.env.define('__last_result__', 0);
      return true;
    }

    // Map functions
    if (n === 'map' && args.length >= 0) {
      const m: Record<string, IOZENValue> = { __iozen_type: 'map' as const };
      for (let i = 0; i < args.length; i += 2) {
        m[String(args[i])] = i + 1 < args.length ? args[i + 1] : null;
      }
      this.env.define('__last_result__', m);
      return true;
    }
    if (n === 'has_key' && args.length >= 2) {
      const m = args[0];
      if (typeof m === 'object' && m !== null && !Array.isArray(m) && (m as IOZENMap).__iozen_type === 'map') {
        const key = String(args[1]);
        this.env.define('__last_result__', key in m);
      } else {
        this.env.define('__last_result__', false);
      }
      return true;
    }
    if (n === 'get_key' && args.length >= 2) {
      const m = args[0];
      if (typeof m === 'object' && m !== null && !Array.isArray(m) && (m as IOZENMap).__iozen_type === 'map') {
        const key = String(args[1]);
        this.env.define('__last_result__', key in m ? (m as Record<string, IOZENValue>)[key] : null);
      } else {
        this.env.define('__last_result__', null);
      }
      return true;
    }
    if (n === 'set_key' && args.length >= 3) {
      const m = args[0];
      if (typeof m === 'object' && m !== null && !Array.isArray(m) && (m as IOZENMap).__iozen_type === 'map') {
        (m as Record<string, IOZENValue>)[String(args[1])] = args[2];
        this.env.define('__last_result__', m);
      } else {
        this.env.define('__last_result__', null);
      }
      return true;
    }
    if (n === 'keys' && args.length >= 1) {
      const m = args[0];
      if (typeof m === 'object' && m !== null && !Array.isArray(m) && (m as IOZENMap).__iozen_type === 'map') {
        const result = Object.keys(m).filter(k => !k.startsWith('__'));
        this.env.define('__last_result__', result);
      } else {
        this.env.define('__last_result__', []);
      }
      return true;
    }

    // List remove operations
    if (n === 'remove' && args.length >= 2 && Array.isArray(args[0])) {
      const arr = args[0] as IOZENValue[];
      const idx = Math.floor(this.toNumber(args[1]));
      if (idx >= 0 && idx < arr.length) {
        const removed = arr.splice(idx, 1);
        this.env.define('__last_result__', removed[0] !== undefined ? removed[0] : null);
      } else {
        this.env.define('__last_result__', null);
      }
      return true;
    }
    if (n === 'remove_last' && args.length >= 1 && Array.isArray(args[0])) {
      const arr = args[0] as IOZENValue[];
      this.env.define('__last_result__', arr.length > 0 ? arr.pop()! : null);
      return true;
    }

    // type_of builtin
    if (n === 'type_of' && args.length >= 1) {
      const v = args[0];
      if (v === null || v === undefined) {
        this.env.define('__last_result__', 'nothing');
      } else if (typeof v === 'number') {
        this.env.define('__last_result__', Number.isInteger(v) ? 'integer' : 'float');
      } else if (typeof v === 'string') {
        this.env.define('__last_result__', 'text');
      } else if (typeof v === 'boolean') {
        this.env.define('__last_result__', 'boolean');
      } else if (Array.isArray(v)) {
        this.env.define('__last_result__', 'list');
      } else if (typeof v === 'object') {
        if ((v as IOZENMap).__iozen_type === 'map') {
          this.env.define('__last_result__', 'map');
        } else if ((v as IOZENObject).__iozen_type === 'object') {
          this.env.define('__last_result__', 'object');
        } else if ((v as IOZENResult).__iozen_type === 'result') {
          this.env.define('__last_result__', 'result');
        } else if ((v as IOZENFunction).__iozen_type === 'function') {
          this.env.define('__last_result__', 'function');
        } else {
          this.env.define('__last_result__', 'object');
        }
      } else {
        this.env.define('__last_result__', 'nothing');
      }
      return true;
    }

    // Special IOZEN keywords that function as built-ins
    // Input / Output
    if (n === 'read_line' && args.length >= 0) {
      // Synchronous readline — placeholder (works in REPL)
      this.env.define('__last_result__', '');
      return true;
    }
    if (n === 'read_file' && args.length >= 1) {
      try {
        const { readFileSync } = require('node:fs');
        const content = readFileSync(String(args[0]), 'utf-8');
        this.env.define('__last_result__', content);
      } catch {
        throw new RuntimeError(`Cannot read file: "${args[0]}"`);
      }
      return true;
    }

    return false;
  }

  // ---- Type Helpers ----

  private isTruthy(value: IOZENValue): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.length > 0;
    return true;
  }

  private toNumber(value: IOZENValue): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'string') {
      const n = parseFloat(value);
      return isNaN(n) ? 0 : n;
    }
    return 0;
  }

  private iozenValueToString(value: IOZENValue): string {
    if (value === null || value === undefined) return 'nothing';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? value.toString() : value.toFixed(6).replace(/\.?0+$/, '');
    }
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return `[${value.map(v => this.iozenValueToString(v)).join(', ')}]`;
    if (typeof value === 'object') {
      if ((value as IOZENResult).__iozen_type === 'result') {
        const r = value as IOZENResult;
        return r.ok ? `Ok(${this.iozenValueToString(r.value!)})` : `Error("${r.error}")`;
      }
      if ((value as IOZENMap).__iozen_type === 'map') {
        const m = value as IOZENMap;
        const entries = Object.entries(m)
          .filter(([k]) => !k.startsWith('__'))
          .map(([k, v]) => `${k}: ${this.iozenValueToString(v)}`);
        return `{ ${entries.join(', ')} }`;
      }
      if ((value as IOZENObject).__iozen_type === 'object') {
        const obj = value as IOZENObject;
        const fields = Object.entries(obj)
          .filter(([k]) => !k.startsWith('__'))
          .map(([k, v]) => `${k}: ${this.iozenValueToString(v)}`);
        return `${obj.__class_name} { ${fields.join(', ')} }`;
      }
      if ((value as IOZENFunction).__iozen_type === 'function') {
        return `<function ${(value as IOZENFunction).name}>`;
      }
      return JSON.stringify(value);
    }
    if (typeof value === 'function') return '<function>';
    return String(value);
  }

  private getDefaultValue(typeName: string): IOZENValue {
    const t = typeName.toLowerCase();
    if (t.includes('integer') || t.includes('int')) return 0;
    if (t.includes('float')) return 0.0;
    if (t.includes('boolean') || t.includes('bool')) return false;
    if (t.includes('text') || t.includes('string')) return '';
    if (t.includes('character') || t.includes('char')) return '\0';
    if (t.includes('list') || t.includes('array')) return [];
    if (t.includes('pointer') || t.includes('address')) return null;
    if (t.includes('optional')) return null;
    return null;
  }

  private checkIterationLimit(): void {
    this.iterationCount++;
    if (this.iterationCount > this.maxIterations) {
      throw new RuntimeError('Execution limit exceeded (possible infinite loop)');
    }
  }

  // ---- Typo Suggestions ----

  private builtinNames: string[] = [
    'print', 'println', 'abs', 'sqrt', 'floor', 'ceil', 'round',
    'power', 'min', 'max', 'uppercase', 'lowercase', 'trim',
    'substring', 'contains', 'replace', 'split', 'join', 'char_at',
    'ord', 'chr', 'to_integer', 'int', 'to_float', 'to_text',
    'push', 'pop', 'sort', 'reverse', 'length', 'range', 'sum',
    'read_line', 'read_file',
    'map', 'remove', 'remove_last', 'type_of',
    'has_key', 'get_key', 'set_key', 'keys',
  ];

  private suggestSimilar(name: string): string | null {
    const targets = [...this.builtinNames];
    // Also collect user-defined function names from the environment
    this.collectFunctionNames(this.env, targets);

    let bestMatch: string | null = null;
    let bestDist = Infinity;

    for (const target of targets) {
      const dist = this.levenshtein(name.toLowerCase(), target.toLowerCase());
      if (dist <= 2 && dist < bestDist) {
        bestDist = dist;
        bestMatch = target;
      }
    }

    return bestMatch;
  }

  private collectFunctionNames(env: Environment, names: string[]): void {
    for (const name of env.names()) {
      if (!names.includes(name)) {
        names.push(name);
      }
    }
  }

  private levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () =>
      new Array(n + 1).fill(0)
    );

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost,
        );
      }
    }

    return dp[m][n];
  }

  /**
   * Helper: find a name/keyword in source and return [line, column] tuple
   * for use as spread arguments to RuntimeError constructor.
   */
  private findNameInSourceOrThrow(name: string): [number, number | undefined] {
    const loc = this.findNameInSource(name);
    return loc ? [loc.line, loc.column] : [];
  }

  private findNodeLine(hint: string): [number, number | undefined] {
    // For operators/symbols, search for the hint in source
    const loc = this.findNameInSource(hint);
    return loc ? [loc.line, loc.column] : [];
  }
}

// ---- Convenience API ----

export function executeIOZEN(source: string): { output: string[]; errors: string[] } {
  const interpreter = new Interpreter();
  return interpreter.run(source);
}

// ============================================================
// IOZEN Language — Interpreter (Tree-Walking)
// Executes IOZEN programs by walking the AST
// ============================================================

import * as fs from 'node:fs';
import type {
    AssignVarNode,
    ASTNode,
    AttachExprNode,
    BinaryExprNode,
    CheckNode,
    CompoundAssignNode,
    DestructureNode,
    EnumDeclNode,
    ExitNode,
    ForEachNode,
    FunctionCallExprNode,
    FunctionCallStmtNode,
    FunctionDeclNode,
    HasValueNode,
    IdentifierNode,
    ImportNode,
    IncreaseNode,
    IndexAccessNode,
    LambdaNode,
    ListCompNode,
    ListLiteralNode,
    LiteralNode,
    MapLiteralNode,
    MatchNode,
    MemberAccessNode,
    ModuleDeclNode,
    PipelineExprNode,
    PrintStmtNode,
    RepeatNode,
    ReturnStmtNode,
    SafeAccessNode,
    SetFieldNode,
    StructureDeclNode,
    TernaryExprNode,
    ThrowNode,
    TryCatchNode,
    UnaryExprNode,
    UnionDeclNode,
    ValueInsideNode,
    VariableDeclNode,
    WhenNode,
    WhileNode
} from './ast';
import { Environment, IOZENFunction, IOZENMap, IOZENObject, IOZENResult, IOZENValue, RuntimeError } from './environment';
import { Lexer } from './lexer';
import { ParseError, Parser } from './parser';

// Special signal to unwind the call stack for return/exit
class ReturnSignal {
  constructor(public value: IOZENValue) {}
}

class ThrowSignal {
  constructor(public value: IOZENValue) {}
}

class ExitSignal {
  constructor(public target: string | null) {}
}

class ContinueSignal {}

export class Interpreter {
  private env: Environment;
  private output: string[] = [];
  private maxIterations: number = 100000;
  private iterationCount: number = 0;
  private callDepth: number = 0;
  private maxCallDepth: number = 500;
  private structureDefs: Map<string, { fields: { name: string; typeName: string }[] }> = new Map();
  private source: string = '';
  private sourceLines: string[] = [];
  private sourceFilePath: string | null = null;
  private importedModules: Set<string> = new Set();

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
      case 'Import':
        this.execImport(node as ImportNode, env);
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
      case 'Exit':
        this.execExit(node as ExitNode);
        break;
      case 'Continue':
        throw new ContinueSignal();
      case 'Match':
        this.execMatch(node as MatchNode, env);
        break;
      case 'TryCatch':
        this.execTryCatch(node as TryCatchNode, env);
        break;
      case 'Throw':
        this.execThrow(node as ThrowNode, env);
        break;
      case 'Destructure':
        this.execDestructure(node as DestructureNode, env);
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
      case 'CompoundAssign':
        this.execCompoundAssign(node as CompoundAssignNode, env);
        break;
      case 'ModuleDecl':
        this.execModuleDecl(node as ModuleDeclNode, env);
        break;
      case 'UnionDecl':
        this.execUnionDecl(node as UnionDeclNode, env);
        break;
      case 'TypeAlias':
        // Type aliases are no-ops at runtime (for future type checking)
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
    // Phase 14.2: Use pretty format with source preview
    // Attach source and file info to error
    e.source = this.source;
    e.file = this.sourceFilePath ?? undefined;

    // If error has no line, try to find it
    if (e.line === undefined || e.line <= 0) {
      const nameMatch = e.message.match(/"([^"]+)"/);
      if (nameMatch) {
        const loc = this.findNameInSource(nameMatch[1]);
        if (loc) {
          e.line = loc.line;
          e.column = loc.column;
        }
      }
    }

    // Use pretty format
    return e.formatPretty();
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

  private execImport(node: ImportNode, env: Environment): void {
    // Resolve module path relative to current file
    let basePath = this.sourceFilePath || process.cwd();
    let modulePath = node.modulePath;

    // Add .iozen extension if not present
    if (!modulePath.endsWith('.iozen')) {
      modulePath = modulePath + '.iozen';
    }

    // Resolve relative to the current file's directory
    const { resolve, dirname } = require('node:path');
    const fullPath = resolve(dirname(basePath), modulePath);

    // Prevent circular imports
    const resolvedKey = resolve(fullPath);
    if (this.importedModules.has(resolvedKey)) return;
    this.importedModules.add(resolvedKey);

    try {
      const { readFileSync } = require('node:fs');
      const moduleSource = readFileSync(resolvedKey, 'utf-8');

      // Parse the imported module
      const lexer = new Lexer(moduleSource);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      // Execute in a child environment
      const moduleEnv = env.child();
      const savedFilePath = this.sourceFilePath;
      const savedSource = this.source;
      const savedLines = this.sourceLines;

      this.sourceFilePath = resolvedKey;
      this.source = moduleSource;
      this.sourceLines = moduleSource.split('\n');

      this.executeBlock(ast.statements, moduleEnv);

      // Restore state
      this.sourceFilePath = savedFilePath;
      this.source = savedSource;
      this.sourceLines = savedLines;

      // If specific names are requested, only expose those into current env
      if (node.importNames.length > 0) {
        for (const name of node.importNames) {
          if (moduleEnv.has(name)) {
            env.define(name, moduleEnv.get(name));
          }
        }
      } else {
        // Import all — expose non-private names
        // Functions and structures defined at module level are imported
        // (Variables starting with _ are considered private)
        for (const name of moduleEnv.names()) {
          if (!name.startsWith('__') && !name.startsWith('_')) {
            // Don't re-define names that already exist in current scope
            if (!env.has(name)) {
              env.define(name, moduleEnv.get(name));
            }
          }
        }
        // Also import structure definitions
        for (const [sName, sDef] of this.structureDefs) {
          // Already in structureDefs, no need to duplicate
        }
      }
    } catch (e) {
      if (e instanceof RuntimeError) {
        throw new RuntimeError(`Cannot import module "${node.modulePath}": ${e.message}`, ...this.findNameInSourceOrThrow(node.modulePath));
      }
      throw new RuntimeError(`Cannot import module "${node.modulePath}": ${String(e)}`, ...this.findNameInSourceOrThrow(node.modulePath));
    }
  }

  public setSourceFilePath(filePath: string): void {
    this.sourceFilePath = filePath;
  }

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

  private execModuleDecl(node: ModuleDeclNode, env: Environment): void {
    // Execute module body in a child environment
    const moduleEnv = env.child();
    this.executeBlock(node.body, moduleEnv);

    // Only expose declared names into parent scope
    if (node.exposedNames.length > 0) {
      for (const name of node.exposedNames) {
        if (moduleEnv.has(name)) {
          env.define(name, moduleEnv.get(name));
        }
      }
    } else {
      // If no expose clause, expose everything (public by default)
      for (const name of moduleEnv.names()) {
        if (!name.startsWith('__')) {
          env.define(name, moduleEnv.get(name));
        }
      }
    }
  }

  private execUnionDecl(node: UnionDeclNode, env: Environment): void {
    // Create constructor functions for each variant
    for (const variant of node.variants) {
      env.define(variant.name, {
        __iozen_type: 'function',
        name: variant.name,
        parameters: variant.typeName !== 'nothing' ? [{ name: 'value', typeName: variant.typeName, qualifiers: [] }] : [],
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
      let str = this.iozenValueToString(val);
      // String interpolation: replace {expr} patterns
      if (typeof val === 'string' && str.includes('{')) {
        str = this.interpolateString(str, env);
      }
      parts.push(str);
    }
    this.output.push(parts.join(''));
  }

  private interpolateString(str: string, env: Environment): string {
    // Replace {expr} patterns with their evaluated values
    return str.replace(/\{([^{}]+)\}/g, (match, expr) => {
      try {
        const lexer = new Lexer(expr);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        // Use parseExpression() directly instead of parse() (which expects statements)
        const parsed = parser.parseSingle();
        const val = this.evaluate(parsed, env);
        return this.iozenValueToString(val);
      } catch {
        return match; // If interpolation fails, leave as-is
      }
    });
  }

  private execExit(node: ExitNode): void {
    throw new ExitSignal(node.target);
  }

  private execThrow(node: ThrowNode, env: Environment): void {
    const val = node.value ? this.evaluate(node.value, env) : null;
    throw new ThrowSignal(val);
  }

  private execDestructure(node: DestructureNode, env: Environment): void {
    const val = this.evaluate(node.value, env);
    if (Array.isArray(val)) {
      // Destructure list: create variable a, b, c with value [1, 2, 3]
      for (let i = 0; i < node.names.length; i++) {
        env.define(node.names[i], i < val.length ? val[i] : null);
      }
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      // Destructure map/object: create variable a, b with value map("a", 1, "b", 2)
      for (const name of node.names) {
        if ((val as Record<string, IOZENValue>)[name] !== undefined) {
          env.define(name, (val as Record<string, IOZENValue>)[name]);
        } else {
          env.define(name, null);
        }
      }
    } else if (typeof val === 'string') {
      // Destructure string into characters
      for (let i = 0; i < node.names.length; i++) {
        env.define(node.names[i], i < val.length ? val[i] : null);
      }
    }
  }

  private execMatch(node: MatchNode, env: Environment): void {
    this.evalMatch(node, env);
  }

  private evalMatch(node: MatchNode, env: Environment): IOZENValue {
    const subject = this.evaluate(node.subject, env);

    for (const matchCase of node.cases) {
      const pattern = matchCase.pattern;

      if (matchCase.binding) {
        // Catch-all binding: always matches, bind the value
        const childEnv = env.child();
        childEnv.define(matchCase.binding, subject);
        return this.executeBlockAndReturn(matchCase.body, childEnv);
      } else if (pattern.kind === 'Literal' && pattern.type === 'null') {
        // Wildcard pattern (_): always matches, no binding
        return this.executeBlockAndReturn(matchCase.body, env);
      } else if (pattern.kind === 'Literal') {
        // Literal pattern matching
        const patternVal = this.evaluate(pattern, env);
        if (this.iozenValuesEqual(subject, patternVal)) {
          return this.executeBlockAndReturn(matchCase.body, env);
        }
      }
    }

    if (node.otherwise) {
      return this.executeBlockAndReturn(node.otherwise, env);
    }

    return null;
  }

  private executeBlockAndReturn(statements: ASTNode[], env: Environment): IOZENValue {
    for (const stmt of statements) {
      this.execute(stmt, env);
    }
    // Return the last computed result
    try {
      return this.env.get('__last_result__');
    } catch {
      return null;
    }
  }

  private execTryCatch(node: TryCatchNode, env: Environment): void {
    try {
      this.executeBlock(node.tryBody, env);
    } catch (e) {
      if (e instanceof ThrowSignal) {
        const childEnv = env.child();
        if (node.catchBinding) {
          childEnv.define(node.catchBinding, e.value);
        }
        this.executeBlock(node.catchBody, childEnv);
      } else if (e instanceof ReturnSignal) {
        throw e; // re-throw return signals
      } else if (e instanceof ExitSignal) {
        throw e; // re-throw exit signals
      } else if (e instanceof RuntimeError) {
        // Catch runtime errors too
        const childEnv = env.child();
        if (node.catchBinding) {
          childEnv.define(node.catchBinding, e.message);
        }
        this.executeBlock(node.catchBody, childEnv);
      } else {
        throw e;
      }
    }
  }

  private evalPipeline(node: PipelineExprNode, env: Environment): IOZENValue {
    let value = this.evaluate(node.stages[0], env);

    for (let i = 1; i < node.stages.length; i++) {
      const stage = node.stages[i];
      if (stage.kind === 'FunctionCallExpr') {
        const funcCall = stage as FunctionCallExprNode;
        // Wrap value as literal node and prepend as first argument
        const valueNode = this.wrapAsLiteral(value);
        const newArgs = [valueNode, ...funcCall.arguments];
        value = this.callFunction(funcCall.name, newArgs, env);
      } else if (stage.kind === 'Identifier') {
        // Bare function name in pipeline: value |> func_name
        const funcName = (stage as IdentifierNode).name;
        const valueNode = this.wrapAsLiteral(value);
        value = this.callFunction(funcName, [valueNode], env);
      } else {
        value = this.evaluate(stage, env);
      }
    }

    this.env.define('__last_result__', value);
    return value;
  }

  private wrapAsLiteral(value: IOZENValue): ASTNode {
    if (value === null) return { kind: 'Literal', type: 'null', value: null } as LiteralNode;
    if (typeof value === 'number') {
      return { kind: 'Literal', type: Number.isInteger(value) ? 'integer' : 'float', value } as LiteralNode;
    }
    if (typeof value === 'string') return { kind: 'Literal', type: 'text', value } as LiteralNode;
    if (typeof value === 'boolean') return { kind: 'Literal', type: 'boolean', value } as LiteralNode;
    return { kind: 'Literal', type: 'null', value } as LiteralNode;
  }

  private iozenValuesEqual(a: IOZENValue, b: IOZENValue): boolean {
    if (a === b) return true;
    if (a === null || b === null) return a === b;
    if (typeof a === 'number' && typeof b === 'number') return a === b;
    if (typeof a === 'string' && typeof b === 'string') return a === b;
    if (typeof a === 'boolean' && typeof b === 'boolean') return a === b;
    return false;
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
        if (e instanceof ContinueSignal) {
          continue; // skip rest of loop body, go to next iteration
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
        if (e instanceof ExitSignal) {
          if (!e.target) break; // untargeted exit breaks the while loop
          throw e; // targeted exit re-thrown for outer loops
        }
        if (e instanceof ContinueSignal) {
          continue; // skip rest of loop body, go to next iteration
        }
        throw e;
      }
    }
  }

  private execForEach(node: ForEachNode, env: Environment): void {
    const iterable = this.evaluate(node.iterable, env);

    if (Array.isArray(iterable)) {
      const childEnv = env.child();
      for (let idx = 0; idx < iterable.length; idx++) {
        const item = iterable[idx];
        childEnv.define(node.variable, item);
        if (node.indexVariable) {
          childEnv.define(node.indexVariable, idx);
        }
        try {
          this.executeBlock(node.body, childEnv);
        } catch (e) {
          if (e instanceof ExitSignal) {
            if (!e.target) break;
            throw e;
          }
          if (e instanceof ContinueSignal) {
            continue;
          }
          throw e;
        }
      }
    } else if (typeof iterable === 'string') {
      const childEnv = env.child();
      for (let idx = 0; idx < iterable.length; idx++) {
        const ch = iterable[idx];
        childEnv.define(node.variable, ch);
        if (node.indexVariable) {
          childEnv.define(node.indexVariable, idx);
        }
        try {
          this.executeBlock(node.body, childEnv);
        } catch (e) {
          if (e instanceof ExitSignal) {
            if (!e.target) break;
            throw e;
          }
          if (e instanceof ContinueSignal) {
            continue;
          }
          throw e;
        }
      }
    } else if (typeof iterable === 'object' && iterable !== null && !Array.isArray(iterable) && (iterable as IOZENMap).__iozen_type === 'map') {
      // Map iteration: for each key, value in my_map
      const mapObj = iterable as Record<string, IOZENValue>;
      const childEnv = env.child();
      for (const [key, val] of Object.entries(mapObj)) {
        if (key.startsWith('__')) continue;
        childEnv.define(node.variable, key);
        if (node.indexVariable) {
          childEnv.define(node.indexVariable, val);
        }
        try {
          this.executeBlock(node.body, childEnv);
        } catch (e) {
          if (e instanceof ExitSignal) { if (!e.target) break; throw e; }
          if (e instanceof ContinueSignal) { continue; }
          throw e;
        }
      }
    } else {
      throw new RuntimeError(`Cannot iterate over ${typeof iterable}`, ...this.findNodeLine('for each'));
    }
  }

  private execIncrease(node: IncreaseNode, env: Environment): void {
    const amount = this.toNumber(this.evaluate(node.amount, env));

    if (node.target.kind === 'Identifier') {
      const name = (node.target as IdentifierNode).name;
      const current = this.toNumber(env.get(name));
      env.set(name, current + amount);
    } else if (node.target.kind === 'MemberAccess') {
      const member = node.target as MemberAccessNode;
      const obj = this.evaluate(member.object, env) as IOZENObject;
      const current = this.toNumber(obj[member.field]);
      obj[member.field] = current + amount;
    } else if (node.target.kind === 'IndexAccess') {
      const idx = node.target as IndexAccessNode;
      const obj = this.evaluate(idx.object, env);
      const i = Math.floor(this.toNumber(this.evaluate(idx.index, env)));
      if (Array.isArray(obj)) {
        obj[i] = this.toNumber(obj[i]) + amount;
      }
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

  private execCompoundAssign(node: CompoundAssignNode, env: Environment): void {
    const current = env.get(node.name);
    const rhs = this.evaluate(node.value, env);
    let result: IOZENValue;
    switch (node.operator) {
      case '+=':
        if (typeof current === 'string' || typeof rhs === 'string') {
          result = String(current) + String(rhs);
        } else {
          result = this.toNumber(current) + this.toNumber(rhs);
        }
        break;
      case '-=': result = this.toNumber(current) - this.toNumber(rhs); break;
      case '*=':
        if (typeof current === 'string' && typeof rhs === 'number') {
          result = String(current).repeat(Math.max(0, Math.floor(rhs)));
        } else {
          result = this.toNumber(current) * this.toNumber(rhs);
        }
        break;
      case '/=': result = this.toNumber(current) / this.toNumber(rhs); break;
      case '%=': result = this.toNumber(current) % this.toNumber(rhs); break;
      default: result = null;
    }
    env.set(node.name, result);
    this.env.define('__last_result__', result);
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
        return this.evalBinary(b.operator, left, right, b);
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
        const idxVal = this.evaluate(i.index, env);
        // Check for map (string-keyed object)
        if (typeof obj === 'object' && obj !== null && !Array.isArray(obj) && (obj as IOZENMap).__iozen_type === 'map') {
          const key = String(idxVal);
          return (obj as Record<string, IOZENValue>)[key] ?? null;
        }
        // Array/string indexing
        const idx = Math.floor(this.toNumber(idxVal));
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

      case 'MapLiteral': {
        const m = node as MapLiteralNode;
        const mapObj: Record<string, IOZENValue> = { __iozen_type: 'map' as const };
        for (const entry of m.entries) {
          const key = String(this.evaluate(entry.key, env));
          mapObj[key] = this.evaluate(entry.value, env);
        }
        this.env.define('__last_result__', mapObj);
        return mapObj;
      }

      case 'ListComp': {
        const lc = node as ListCompNode;
        const iterable = this.evaluate(lc.iterable, env);
        const result: IOZENValue[] = [];
        if (Array.isArray(iterable)) {
          for (const item of iterable) {
            const childEnv = env.child();
            childEnv.define(lc.variable, item);
            result.push(this.evaluate(lc.expression, childEnv));
          }
        } else if (typeof iterable === 'string') {
          for (const ch of iterable) {
            const childEnv = env.child();
            childEnv.define(lc.variable, ch);
            result.push(this.evaluate(lc.expression, childEnv));
          }
        } else if (typeof iterable === 'object' && iterable !== null && !Array.isArray(iterable) && (iterable as IOZENMap).__iozen_type === 'map') {
            for (const [key, val] of Object.entries(iterable as Record<string, IOZENValue>)) {
              if (key.startsWith('__')) continue;
              const childEnv = env.child();
              childEnv.define(lc.variable, val);
              result.push(this.evaluate(lc.expression, childEnv));
            }
          }
        this.env.define('__last_result__', result);
        return result;
      }

      case 'TernaryExpr': {
        const t = node as TernaryExprNode;
        return this.isTruthy(this.evaluate(t.condition, env))
          ? this.evaluate(t.thenExpr, env)
          : this.evaluate(t.elseExpr, env);
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

      case 'Lambda': {
        const l = node as LambdaNode;
        const func: IOZENFunction = {
          __iozen_type: 'function',
          name: '<lambda>',
          parameters: l.parameters,
          returnType: l.returnType,
          body: l.body,
          closure: env,
        };
        return func;
      }

      case 'PipelineExpr': {
        return this.evalPipeline(node as PipelineExprNode, env);
      }

      case 'Match': {
        return this.evalMatch(node as MatchNode, env);
      }

      case 'SafeAccess': {
        const s = node as SafeAccessNode;
        const obj = this.evaluate(s.object, env);
        if (obj === null || obj === undefined) {
          return null;
        }
        if (typeof obj === 'object' && s.field in obj) {
          return (obj as Record<string, IOZENValue>)[s.field];
        }
        return null;
      }

      case 'ForceUnwrap': {
        const f = node as ForceUnwrapNode;
        const val = this.evaluate(f.expression, env);
        if (val === null || val === undefined) {
          throw new RuntimeError('Force unwrap on null value (value has nothing)');
        }
        return val;
      }

      case 'OrDefault': {
        const o = node as OrDefaultNode;
        const val = this.evaluate(o.expression, env);
        if (val === null || val === undefined) {
          return this.evaluate(o.defaultValue, env);
        }
        return val;
      }

      case 'Throw': {
        const t = node as ThrowNode;
        const val = t.value ? this.evaluate(t.value, env) : null;
        throw new ThrowSignal(val);
      }

      default:
        throw new RuntimeError(`Unknown expression kind: ${(node as ASTNode).kind}`);
    }
  }

  private evalBinary(op: string, left: IOZENValue, right: IOZENValue, node: ASTNode): IOZENValue {
    switch (op) {
      case '+':
        if (typeof left === 'string' || typeof right === 'string') {
          return String(left) + String(right);
        }
        return this.toNumber(left) + this.toNumber(right);
      case '-': return this.toNumber(left) - this.toNumber(right);
      case '*':
        if (typeof left === 'string' && typeof right === 'number') {
          return String(left).repeat(Math.max(0, Math.floor(right)));
        }
        if (typeof left === 'number' && typeof right === 'string') {
          return String(right).repeat(Math.max(0, Math.floor(left)));
        }
        return this.toNumber(left) * this.toNumber(right);
      case '/':
        if (this.toNumber(right) === 0) {
          const [line, col] = this.getNodeLocation(node);
          throw new RuntimeError('Division by zero', line, col);
        }
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
      case 'inside': {
        // Membership: value inside collection
        if (Array.isArray(right)) {
          return right.some(item => this.iozenValuesEqual(left, item));
        }
        if (typeof right === 'string') {
          return String(right).includes(String(left));
        }
        if (typeof right === 'object' && right !== null && !Array.isArray(right) && (right as IOZENMap).__iozen_type === 'map') {
          return String(left) in (right as Record<string, IOZENValue>);
        }
        return false;
      }
      default:
        throw new RuntimeError(`Unknown operator: ${op}`, ...this.findNodeLine(op));
    }
  }

  private evalUnary(op: string, operand: IOZENValue): IOZENValue {
    switch (op) {
      case '-': return -this.toNumber(operand);
      case 'not': return !this.isTruthy(operand);
      case 'borrow': return operand;
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
    if (this.callBuiltinByName(name, args, env)) {
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

      // Execute body (with recursion depth tracking)
      this.callDepth++;
      try {
        this.executeBlock(func.body, funcEnv);
      } catch (e) {
        this.callDepth--;
        if (e instanceof ReturnSignal) {
          return e.value;
        }
        throw e;
      }
      this.callDepth--;

      return null;
    }

    // Unknown function — try as math/built-in
    if (this.callBuiltinByName(name, args, env)) {
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

  private callBuiltinByName(name: string, args: IOZENValue[], env: Environment): boolean {
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

    // Type conversion - to_text only (to_integer/to_float moved to callBuiltinByName)
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
    // File I/O moved to callBuiltinByName (hardened versions)
    if (n === 'append_file' && args.length >= 2) {
      try {
        const { appendFileSync } = require('node:fs');
        appendFileSync(String(args[0]), String(args[1]), 'utf-8');
        this.env.define('__last_result__', true);
      } catch {
        throw new RuntimeError(`Cannot append to file: "${args[0]}"`);
      }
      return true;
    }
    if (n === 'delete_file' && args.length >= 1) {
      try {
        const { unlinkSync, existsSync } = require('node:fs');
        const path = String(args[0]);
        if (existsSync(path)) {
          unlinkSync(path);
          this.env.define('__last_result__', true);
        } else {
          this.env.define('__last_result__', false);
        }
      } catch {
        throw new RuntimeError(`Cannot delete file: "${args[0]}"`);
      }
      return true;
    }
    if (n === 'file_exists' && args.length >= 1) {
      try {
        const { existsSync } = require('node:fs');
        this.env.define('__last_result__', existsSync(String(args[0])));
      } catch {
        this.env.define('__last_result__', false);
      }
      return true;
    }

    // Debug / Testing
    if (n === 'assert' && args.length >= 1) {
      const condition = this.isTruthy(args[0]);
      if (!condition) {
        const message = args.length >= 2 ? String(args[1]) : 'Assertion failed';
        throw new RuntimeError(`Assertion failed: ${message}`);
      }
      this.env.define('__last_result__', true);
      return true;
    }
    if (n === 'panic' && args.length >= 1) {
      throw new RuntimeError(`Panic: ${String(args[0])}`);
    }

    // Random functions
    if (n === 'random_int' && args.length >= 2) {
      const min = Math.floor(this.toNumber(args[0]));
      const max = Math.floor(this.toNumber(args[1]));
      this.env.define('__last_result__', Math.floor(Math.random() * (max - min + 1)) + min);
      return true;
    }
    if (n === 'random_float' && args.length >= 0) {
      this.env.define('__last_result__', Math.random());
      return true;
    }
    if (n === 'random_choice' && args.length >= 1) {
      const arr = args[0];
      if (Array.isArray(arr) && arr.length > 0) {
        const idx = Math.floor(Math.random() * arr.length);
        this.env.define('__last_result__', arr[idx]);
      } else if (typeof arr === 'string' && arr.length > 0) {
        const idx = Math.floor(Math.random() * arr.length);
        this.env.define('__last_result__', arr[idx]);
      } else {
        this.env.define('__last_result__', null);
      }
      return true;
    }
    if (n === 'shuffle' && args.length >= 1 && Array.isArray(args[0])) {
      const arr = [...(args[0] as IOZENValue[])];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      this.env.define('__last_result__', arr);
      return true;
    }

    // Additional list functions
    if (n === 'index_of' && args.length >= 2) {
      const arr = args[0];
      const target = args[1];
      if (Array.isArray(arr)) {
        const idx = arr.indexOf(target);
        this.env.define('__last_result__', idx);
      } else if (typeof arr === 'string') {
        this.env.define('__last_result__', String(arr).indexOf(String(target)));
      } else {
        this.env.define('__last_result__', -1);
      }
      return true;
    }
    if (n === 'find' && args.length >= 2) {
      const arr = args[0];
      const target = args[1];
      if (Array.isArray(arr)) {
        const idx = arr.indexOf(target);
        this.env.define('__last_result__', idx >= 0 ? idx : null);
      } else {
        this.env.define('__last_result__', null);
      }
      return true;
    }
    if (n === 'contains_list' && args.length >= 2) {
      const arr = args[0];
      const target = args[1];
      if (Array.isArray(arr)) {
        this.env.define('__last_result__', arr.includes(target));
      } else {
        this.env.define('__last_result__', false);
      }
      return true;
    }
    if (n === 'slice' && args.length >= 2) {
      const arr = args[0];
      const start = Math.floor(this.toNumber(args[1]));
      const end = args.length >= 3 ? Math.floor(this.toNumber(args[2])) : undefined;
      if (Array.isArray(arr)) {
        this.env.define('__last_result__', arr.slice(start, end));
      } else if (typeof arr === 'string') {
        this.env.define('__last_result__', String(arr).slice(start, end));
      } else {
        this.env.define('__last_result__', null);
      }
      return true;
    }
    if (n === 'insert' && args.length >= 3 && Array.isArray(args[0])) {
      const arr = args[0] as IOZENValue[];
      const idx = Math.floor(this.toNumber(args[1]));
      arr.splice(idx, 0, args[2]);
      this.env.define('__last_result__', arr);
      return true;
    }
    if (n === 'flatten' && args.length >= 1 && Array.isArray(args[0])) {
      const result: IOZENValue[] = [];
      const flattenHelper = (items: IOZENValue[]) => {
        for (const item of items) {
          if (Array.isArray(item)) {
            flattenHelper(item);
          } else {
            result.push(item);
          }
        }
      };
      flattenHelper(args[0] as IOZENValue[]);
      this.env.define('__last_result__', result);
      return true;
    }
    if (n === 'map_list' && args.length >= 2 && Array.isArray(args[0])) {
      // map_list(arr, func_name) — apply function to each element
      const arr = args[0] as IOZENValue[];
      const func = this.resolveFunctionArg(args[1], env);
      const result: IOZENValue[] = [];
      for (const item of arr) {
        if (func && func.__iozen_type === 'function') {
          const funcEnv = func.closure.child();
          funcEnv.define(func.parameters[0]?.name || 'arg', item);
          try {
            this.executeBlock(func.body, funcEnv);
            result.push(null);
          } catch (e) {
            if (e instanceof ReturnSignal) {
              result.push(e.value);
            } else {
              throw e;
            }
          }
        }
      }
      this.env.define('__last_result__', result);
      return true;
    }
    if (n === 'filter_list' && args.length >= 2 && Array.isArray(args[0])) {
      // filter_list(arr, func_name) — keep elements where func returns true
      const arr = args[0] as IOZENValue[];
      const func = this.resolveFunctionArg(args[1], env);
      const result: IOZENValue[] = [];
      for (const item of arr) {
        if (func && func.__iozen_type === 'function') {
          const funcEnv = func.closure.child();
          funcEnv.define(func.parameters[0]?.name || 'arg', item);
          let shouldKeep = false;
          try {
            this.executeBlock(func.body, funcEnv);
          } catch (e) {
            if (e instanceof ReturnSignal) {
              shouldKeep = this.isTruthy(e.value);
            } else {
              throw e;
            }
          }
          if (shouldKeep) {
            result.push(item);
          }
        }
      }
      this.env.define('__last_result__', result);
      return true;
    }
    if (n === 'for_each_list' && args.length >= 2 && Array.isArray(args[0])) {
      // for_each_list(arr, func_name) — call func for each element (returns arr)
      const arr = args[0] as IOZENValue[];
      const func = this.resolveFunctionArg(args[1], env);
      for (const item of arr) {
        if (func && func.__iozen_type === 'function') {
          const funcEnv = func.closure.child();
          funcEnv.define(func.parameters[0]?.name || 'arg', item);
          try {
            this.executeBlock(func.body, funcEnv);
          } catch (e) {
            if (e instanceof ReturnSignal) {
              // Discard return value
            } else {
              throw e;
            }
          }
        }
      }
      this.env.define('__last_result__', arr);
      return true;
    }
    if (n === 'unique' && args.length >= 1 && Array.isArray(args[0])) {
      const arr = args[0] as IOZENValue[];
      const seen = new Set<string>();
      const result: IOZENValue[] = [];
      for (const item of arr) {
        const key = JSON.stringify(item);
        if (!seen.has(key)) {
          seen.add(key);
          result.push(item);
        }
      }
      this.env.define('__last_result__', result);
      return true;
    }

    // Additional string functions
    if (n === 'starts_with' && args.length >= 2) {
      this.env.define('__last_result__', String(args[0]).startsWith(String(args[1])));
      return true;
    }
    if (n === 'ends_with' && args.length >= 2) {
      this.env.define('__last_result__', String(args[0]).endsWith(String(args[1])));
      return true;
    }
    if (n === 'repeat_str' && args.length >= 2) {
      const count = Math.floor(this.toNumber(args[1]));
      this.env.define('__last_result__', String(args[0]).repeat(count));
      return true;
    }
    if (n === 'pad_left' && args.length >= 3) {
      const str = String(args[0]);
      const targetLen = Math.floor(this.toNumber(args[1]));
      const fillChar = String(args[2] || ' ');
      this.env.define('__last_result__', str.padStart(targetLen, fillChar));
      return true;
    }
    if (n === 'pad_right' && args.length >= 3) {
      const str = String(args[0]);
      const targetLen = Math.floor(this.toNumber(args[1]));
      const fillChar = String(args[2] || ' ');
      this.env.define('__last_result__', str.padEnd(targetLen, fillChar));
      return true;
    }
    if (n === 'strip' && args.length >= 1) {
      this.env.define('__last_result__', String(args[0]).trim());
      return true;
    }
    if (n === 'lines' && args.length >= 1) {
      const str = String(args[0]);
      this.env.define('__last_result__', str.split('\n'));
      return true;
    }
    if (n === 'format_num' && args.length >= 1) {
      const num = this.toNumber(args[0]);
      const decimals = args.length >= 2 ? Math.floor(this.toNumber(args[1])) : 2;
      this.env.define('__last_result__', num.toFixed(decimals));
      return true;
    }

    // Additional math functions
    if (n === 'log' && args.length >= 1) {
      this.env.define('__last_result__', Math.log(this.toNumber(args[0])));
      return true;
    }
    if (n === 'log10' && args.length >= 1) {
      this.env.define('__last_result__', Math.log10(this.toNumber(args[0])));
      return true;
    }
    if (n === 'sin' && args.length >= 1) {
      this.env.define('__last_result__', Math.sin(this.toNumber(args[0])));
      return true;
    }
    if (n === 'cos' && args.length >= 1) {
      this.env.define('__last_result__', Math.cos(this.toNumber(args[0])));
      return true;
    }
    if (n === 'tan' && args.length >= 1) {
      this.env.define('__last_result__', Math.tan(this.toNumber(args[0])));
      return true;
    }
    if (n === 'abs_int' && args.length >= 1) {
      this.env.define('__last_result__', Math.abs(Math.floor(this.toNumber(args[0]))));
      return true;
    }
    if (n === 'pi') {
      this.env.define('__last_result__', Math.PI);
      return true;
    }

    // Time functions
    if (n === 'current_time' && args.length >= 0) {
      this.env.define('__last_result__', Date.now());
      return true;
    }
    if (n === 'time_format' && args.length >= 1) {
      const ts = this.toNumber(args[0]);
      this.env.define('__last_result__', new Date(ts).toISOString());
      return true;
    }

    // Environment variables
    if (n === 'env_get' && args.length >= 1) {
      this.env.define('__last_result__', process.env[String(args[0])] || null);
      return true;
    }

    // Additional map functions
    if (n === 'values' && args.length >= 1) {
      const m = args[0];
      if (typeof m === 'object' && m !== null && !Array.isArray(m) && (m as IOZENMap).__iozen_type === 'map') {
        const result = Object.keys(m).filter(k => !k.startsWith('__')).map(k => (m as Record<string, IOZENValue>)[k]);
        this.env.define('__last_result__', result);
      } else {
        this.env.define('__last_result__', []);
      }
      return true;
    }
    if (n === 'remove_key' && args.length >= 2) {
      const m = args[0];
      if (typeof m === 'object' && m !== null && !Array.isArray(m) && (m as IOZENMap).__iozen_type === 'map') {
        const key = String(args[1]);
        const mapObj = m as Record<string, IOZENValue>;
        const existed = key in mapObj;
        delete mapObj[key];
        this.env.define('__last_result__', existed);
      } else {
        this.env.define('__last_result__', false);
      }
      return true;
    }
    if (n === 'map_size' && args.length >= 1) {
      const m = args[0];
      if (typeof m === 'object' && m !== null && !Array.isArray(m) && (m as IOZENMap).__iozen_type === 'map') {
        this.env.define('__last_result__', Object.keys(m).filter(k => !k.startsWith('__')).length);
      } else {
        this.env.define('__last_result__', 0);
      }
      return true;
    }
    if (n === 'has_value' && args.length >= 2) {
      const m = args[0];
      const target = args[1];
      if (Array.isArray(m)) {
        this.env.define('__last_result__', m.includes(target));
      } else if (typeof m === 'object' && m !== null && !Array.isArray(m) && (m as IOZENMap).__iozen_type === 'map') {
        this.env.define('__last_result__', Object.values(m).some(v => v === target));
      } else {
        this.env.define('__last_result__', false);
      }
      return true;
    }

    // map_set(map, key, value) — set a key in a map and return the map
    if (n === 'map_set' && args.length >= 3 && typeof args[0] === 'object' && args[0] !== null) {
      const m = args[0] as Record<string, IOZENValue>;
      const key = String(args[1]);
      m[key] = args[2];
      this.env.define('__last_result__', args[0]);
      return true;
    }

    // Print / Debug helpers
    if (n === 'inspect' && args.length >= 1) {
      const val = args[0];
      this.output.push(this.iozenValueToString(val));
      this.env.define('__last_result__', val);
      return true;
    }

    // ---- Aliases ----
    if (n === 'upper' && args.length >= 1) {
      this.env.define('__last_result__', String(args[0]).toUpperCase());
      return true;
    }
    if (n === 'pow' && args.length >= 2) {
      this.env.define('__last_result__', Math.pow(this.toNumber(args[0]), this.toNumber(args[1])));
      return true;
    }
    if (n === 'reverse_str' && args.length >= 1) {
      this.env.define('__last_result__', String(args[0]).split('').reverse().join(''));
      return true;
    }

    // ---- Higher-order builtins ----
    if (n === 'flat_map' && args.length >= 2 && Array.isArray(args[0])) {
      const arr = args[0] as IOZENValue[];
      const func = this.resolveFunctionArg(args[1], env);
      const result: IOZENValue[] = [];
      if (func && func.__iozen_type === 'function') {
        for (const item of arr) {
          const funcEnv = func.closure.child();
          funcEnv.define(func.parameters[0]?.name || 'arg', item);
          try {
            this.executeBlock(func.body, funcEnv);
          } catch (e) {
            if (e instanceof ReturnSignal) {
              const val = e.value;
              if (Array.isArray(val)) result.push(...val);
              else result.push(val);
            } else throw e;
          }
        }
      }
      this.env.define('__last_result__', result);
      return true;
    }
    if (n === 'any' && args.length >= 2 && Array.isArray(args[0])) {
      const arr = args[0] as IOZENValue[];
      const func = this.resolveFunctionArg(args[1], env);
      if (func && func.__iozen_type === 'function') {
        for (const item of arr) {
          const funcEnv = func.closure.child();
          funcEnv.define(func.parameters[0]?.name || 'arg', item);
          try {
            this.executeBlock(func.body, funcEnv);
          } catch (e) {
            if (e instanceof ReturnSignal) {
              if (this.isTruthy(e.value)) {
                this.env.define('__last_result__', true);
                return true;
              }
            } else throw e;
          }
        }
      }
      this.env.define('__last_result__', false);
      return true;
    }
    if (n === 'all' && args.length >= 2 && Array.isArray(args[0])) {
      const arr = args[0] as IOZENValue[];
      const func = this.resolveFunctionArg(args[1], env);
      if (func && func.__iozen_type === 'function') {
        for (const item of arr) {
          const funcEnv = func.closure.child();
          funcEnv.define(func.parameters[0]?.name || 'arg', item);
          try {
            this.executeBlock(func.body, funcEnv);
          } catch (e) {
            if (e instanceof ReturnSignal) {
              if (!this.isTruthy(e.value)) {
                this.env.define('__last_result__', false);
                return true;
              }
            } else throw e;
          }
        }
      }
      this.env.define('__last_result__', true);
      return true;
    }
    if (n === 'reduce' && args.length >= 3 && Array.isArray(args[0])) {
      const arr = args[0] as IOZENValue[];
      let acc = args[2];
      const func = this.resolveFunctionArg(args[1], env);
      if (func && func.__iozen_type === 'function') {
        for (const item of arr) {
          const funcEnv = func.closure.child();
          funcEnv.define(func.parameters[0]?.name || 'acc', acc);
          funcEnv.define(func.parameters[1]?.name || 'item', item);
          try {
            this.executeBlock(func.body, funcEnv);
          } catch (e) {
            if (e instanceof ReturnSignal) acc = e.value;
            else throw e;
          }
        }
      }
      this.env.define('__last_result__', acc);
      return true;
    }
    if (n === 'first' && args.length >= 1 && Array.isArray(args[0])) {
      const arr = args[0] as IOZENValue[];
      this.env.define('__last_result__', arr.length > 0 ? arr[0] : null);
      return true;
    }
    if (n === 'last' && args.length >= 1 && Array.isArray(args[0])) {
      const arr = args[0] as IOZENValue[];
      this.env.define('__last_result__', arr.length > 0 ? arr[arr.length - 1] : null);
      return true;
    }
    if (n === 'chunk' && args.length >= 2 && Array.isArray(args[0])) {
      const arr = args[0] as IOZENValue[];
      const size = Math.floor(this.toNumber(args[1]));
      const result: IOZENValue[] = [];
      for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
      }
      this.env.define('__last_result__', result);
      return true;
    }

    // ---- System aliases ----
    if (n === 'clock') {
      this.env.define('__last_result__', Date.now());
      return true;
    }
    if (n === 'args' || n === 'arguments') {
      this.env.define('__last_result__', process.argv.slice(2));
      return true;
    }
    // ---- System (remaining) ----
    if (n === 'system' && args.length >= 1) {
      const { execSync } = require('node:child_process');
      try {
        const result = execSync(String(args[0]), { encoding: 'utf-8', timeout: 30000 });
        this.output.push(result.trimEnd());
        this.env.define('__last_result__', 0);
      } catch (e: any) {
        this.env.define('__last_result__', e.status ?? 1);
      }
      return true;
    }
    if (n === 'sleep' && args.length >= 1) {
      const ms = Math.floor(this.toNumber(args[0]));
      const { execSync } = require('node:child_process');
      execSync(`sleep ${ms / 1000}`, { timeout: ms + 1000 });
      this.env.define('__last_result__', true);
      return true;
    }

    // ---- Format / Utility ----
    if (n === 'format' && args.length >= 1) {
      let template = String(args[0]);
      for (let i = 1; i < args.length; i++) {
        template = template.replace('{}', this.iozenValueToString(args[i]));
      }
      this.env.define('__last_result__', template);
      return true;
    }
    if (n === 'typeof' && args.length >= 1) {
      const v = args[0];
      if (v === null || v === undefined) this.env.define('__last_result__', 'nothing');
      else if (typeof v === 'number') this.env.define('__last_result__', Number.isInteger(v) ? 'integer' : 'float');
      else if (typeof v === 'string') this.env.define('__last_result__', 'text');
      else if (typeof v === 'boolean') this.env.define('__last_result__', 'boolean');
      else if (Array.isArray(v)) this.env.define('__last_result__', 'list');
      else this.env.define('__last_result__', 'object');
      return true;
    }
    if (n === 'zip' && args.length >= 2 && Array.isArray(args[0]) && Array.isArray(args[1])) {
      const a = args[0] as IOZENValue[];
      const b = args[1] as IOZENValue[];
      const result: IOZENValue[] = [];
      const len = Math.min(a.length, b.length);
      for (let i = 0; i < len; i++) result.push([a[i], b[i]]);
      this.env.define('__last_result__', result);
      return true;
    }
    if (n === 'enumerate' && args.length >= 1 && Array.isArray(args[0])) {
      const arr = args[0] as IOZENValue[];
      const result: IOZENValue[] = [];
      for (let i = 0; i < arr.length; i++) result.push([i, arr[i]]);
      this.env.define('__last_result__', result);
      return true;
    }
    if (n === 'takewhile' && args.length >= 2 && Array.isArray(args[0])) {
      const arr = args[0] as IOZENValue[];
      const func = this.resolveFunctionArg(args[1], env);
      const result: IOZENValue[] = [];
      if (func && func.__iozen_type === 'function') {
        for (const item of arr) {
          const funcEnv = func.closure.child();
          funcEnv.define(func.parameters[0]?.name || 'arg', item);
          try { this.executeBlock(func.body, funcEnv); }
          catch (e) { if (e instanceof ReturnSignal && !this.isTruthy(e.value)) break; else if (e instanceof ReturnSignal) result.push(item); else throw e; }
        }
      }
      this.env.define('__last_result__', result);
      return true;
    }
    if (n === 'dropwhile' && args.length >= 2 && Array.isArray(args[0])) {
      const arr = args[0] as IOZENValue[];
      const func = this.resolveFunctionArg(args[1], env);
      const result: IOZENValue[] = [];
      let dropping = true;
      if (func && func.__iozen_type === 'function') {
        for (const item of arr) {
          if (dropping) {
            const funcEnv = func.closure.child();
            funcEnv.define(func.parameters[0]?.name || 'arg', item);
            try { this.executeBlock(func.body, funcEnv); }
            catch (e) { if (e instanceof ReturnSignal) { if (this.isTruthy(e.value)) continue; else dropping = false; } else throw e; }
          }
          result.push(item);
        }
      }
      this.env.define('__last_result__', result);
      return true;
    }
    if (n === 'count_by' && args.length >= 1 && Array.isArray(args[0])) {
      const arr = args[0] as IOZENValue[];
      const counts: IOZENValue = { __iozen_type: 'map' as const };
      for (const item of arr) {
        const key = String(item);
        if ((counts as Record<string, IOZENValue>)[key] === undefined) {
          (counts as Record<string, IOZENValue>)[key] = 1;
        } else {
          (counts as Record<string, IOZENValue>)[key] = (this.toNumber((counts as Record<string, IOZENValue>)[key]) + 1);
        }
      }
      this.env.define('__last_result__', counts);
      return true;
    }
    if (n === 'contains_any' && args.length >= 2 && Array.isArray(args[0]) && Array.isArray(args[1])) {
      const haystack = args[0] as IOZENValue[];
      const needles = args[1] as IOZENValue[];
      this.env.define('__last_result__', needles.some(n => haystack.includes(n)));
      return true;
    }
    if (n === 'to_map' && args.length >= 1 && Array.isArray(args[0])) {
      const pairs = args[0] as IOZENValue[];
      const m: IOZENValue = { __iozen_type: 'map' as const };
      for (const pair of pairs) {
        if (Array.isArray(pair) && pair.length >= 2) {
          (m as Record<string, IOZENValue>)[String(pair[0])] = pair[1];
        }
      }
      this.env.define('__last_result__', m);
      return true;
    }
    if (n === 'clamp' && args.length >= 3) {
      const val = this.toNumber(args[0]);
      const lo = this.toNumber(args[1]);
      const hi = this.toNumber(args[2]);
      this.env.define('__last_result__', Math.max(lo, Math.min(val, hi)));
      return true;
    }
    if (n === 'interleave' && args.length >= 2 && Array.isArray(args[0]) && Array.isArray(args[1])) {
      const a = args[0] as IOZENValue[];
      const b = args[1] as IOZENValue[];
      const result: IOZENValue[] = [];
      const len = Math.max(a.length, b.length);
      for (let i = 0; i < len; i++) {
        if (i < a.length) result.push(a[i]);
        if (i < b.length) result.push(b[i]);
      }
      this.env.define('__last_result__', result);
      return true;
    }
    if (n === 'join_map' && args.length >= 2 && Array.isArray(args[0])) {
      const arr = args[0] as IOZENValue[];
      const func = this.resolveFunctionArg(args[1], env);
      const separator = args.length >= 3 ? String(args[2]) : '';
      const parts: string[] = [];
      if (func && func.__iozen_type === 'function') {
        for (const item of arr) {
          const funcEnv = func.closure.child();
          funcEnv.define(func.parameters[0]?.name || 'arg', item);
          try { this.executeBlock(func.body, funcEnv); }
          catch (e) { if (e instanceof ReturnSignal) parts.push(String(e.value)); else throw e; }
        }
      }
      this.env.define('__last_result__', parts.join(separator));
      return true;
    }

    // ---- Additional math constants ----
    if (n === 'e' && args.length === 0) {
      this.env.define('__last_result__', Math.E);
      return true;
    }
    if (n === 'trunc' && args.length >= 1) {
      this.env.define('__last_result__', Math.trunc(this.toNumber(args[0])));
      return true;
    }
    if (n === 'mod' && args.length >= 2) {
      this.env.define('__last_result__', this.toNumber(args[0]) % this.toNumber(args[1]));
      return true;
    }
    if (n === 'log2' && args.length >= 1) {
      this.env.define('__last_result__', Math.log2(this.toNumber(args[0])));
      return true;
    }
    if (n === 'atan' && args.length >= 1) {
      this.env.define('__last_result__', Math.atan(this.toNumber(args[0])));
      return true;
    }
    if (n === 'asin' && args.length >= 1) {
      this.env.define('__last_result__', Math.asin(this.toNumber(args[0])));
      return true;
    }
    if (n === 'acos' && args.length >= 1) {
      this.env.define('__last_result__', Math.acos(this.toNumber(args[0])));
      return true;
    }
    if (n === 'sign' && args.length >= 1) {
      const v = this.toNumber(args[0]);
      this.env.define('__last_result__', v > 0 ? 1 : v < 0 ? -1 : 0);
      return true;
    }
    if (n === 'gcd' && args.length >= 2) {
      let a = Math.abs(Math.floor(this.toNumber(args[0])));
      let b = Math.abs(Math.floor(this.toNumber(args[1])));
      while (b !== 0) { [a, b] = [b, a % b]; }
      this.env.define('__last_result__', a);
      return true;
    }
    if (n === 'lcm' && args.length >= 2) {
      let a = Math.abs(Math.floor(this.toNumber(args[0])));
      let b = Math.abs(Math.floor(this.toNumber(args[1])));
      const g = (x: number, y: number) => { while (y !== 0) { [x, y] = [y, x % y]; } return x; };
      this.env.define('__last_result__', (a / g(a, b)) * b);
      return true;
    }

    // ---- Additional list builtins ----
    if (n === 'take' && args.length >= 2 && Array.isArray(args[0])) {
      const count = Math.max(0, Math.floor(this.toNumber(args[1])));
      this.env.define('__last_result__', (args[0] as IOZENValue[]).slice(0, count));
      return true;
    }
    if (n === 'drop' && args.length >= 2 && Array.isArray(args[0])) {
      const count = Math.max(0, Math.floor(this.toNumber(args[1])));
      this.env.define('__last_result__', (args[0] as IOZENValue[]).slice(count));
      return true;
    }
    if (n === 'count' && args.length >= 2) {
      const arr = args[0];
      const target = args[1];
      if (Array.isArray(arr)) {
        let c = 0;
        for (const item of arr) { if (item === target) c++; }
        this.env.define('__last_result__', c);
      } else if (typeof arr === 'string') {
        let c = 0;
        const sub = String(target);
        for (const ch of arr) { if (ch === sub) c++; }
        this.env.define('__last_result__', c);
      } else {
        this.env.define('__last_result__', 0);
      }
      return true;
    }
    if (n === 'cycle' && args.length >= 2 && Array.isArray(args[0])) {
      const arr = args[0] as IOZENValue[];
      const times = Math.max(0, Math.floor(this.toNumber(args[1])));
      const result: IOZENValue[] = [];
      for (let i = 0; i < times; i++) result.push(...arr);
      this.env.define('__last_result__', result);
      return true;
    }
    if (n === 'is_empty' && args.length >= 1) {
      const v = args[0];
      if (v === null || v === undefined) { this.env.define('__last_result__', true); return true; }
      if (typeof v === 'string') { this.env.define('__last_result__', v.length === 0); return true; }
      if (Array.isArray(v)) { this.env.define('__last_result__', v.length === 0); return true; }
      if (typeof v === 'object' && (v as IOZENMap).__iozen_type === 'map') {
        this.env.define('__last_result__', Object.keys(v).filter(k => !k.startsWith('__')).length === 0);
        return true;
      }
      this.env.define('__last_result__', false);
      return true;
    }
    if (n === 'not_empty' && args.length >= 1) {
      const v = args[0];
      if (v === null || v === undefined) { this.env.define('__last_result__', false); return true; }
      if (typeof v === 'string') { this.env.define('__last_result__', v.length > 0); return true; }
      if (Array.isArray(v)) { this.env.define('__last_result__', v.length > 0); return true; }
      if (typeof v === 'object' && (v as IOZENMap).__iozen_type === 'map') {
        this.env.define('__last_result__', Object.keys(v).filter(k => !k.startsWith('__')).length > 0);
        return true;
      }
      this.env.define('__last_result__', true);
      return true;
    }
    if (n === 'find_index' && args.length >= 2) {
      const arr = args[0];
      const target = args[1];
      if (Array.isArray(arr)) {
        this.env.define('__last_result__', arr.indexOf(target));
      } else if (typeof arr === 'string') {
        this.env.define('__last_result__', String(arr).indexOf(String(target)));
      } else {
        this.env.define('__last_result__', -1);
      }
      return true;
    }
    if (n === 'nth' && args.length >= 2 && Array.isArray(args[0])) {
      const idx = Math.floor(this.toNumber(args[1]));
      const arr = args[0] as IOZENValue[];
      this.env.define('__last_result__', idx >= 0 && idx < arr.length ? arr[idx] : null);
      return true;
    }
    if (n === 'compact' && args.length >= 1 && Array.isArray(args[0])) {
      this.env.define('__last_result__', (args[0] as IOZENValue[]).filter(v => v !== null && v !== undefined));
      return true;
    }
    if (n === 'has' && args.length >= 2) {
      const arr = args[0];
      const target = args[1];
      if (Array.isArray(arr)) { this.env.define('__last_result__', arr.includes(target)); return true; }
      if (typeof arr === 'string') { this.env.define('__last_result__', String(arr).includes(String(target))); return true; }
      this.env.define('__last_result__', false);
      return true;
    }
    if (n === 'at' && args.length >= 2) {
      const arr = args[0];
      const idx = Math.floor(this.toNumber(args[1]));
      if (Array.isArray(arr)) { this.env.define('__last_result__', idx >= 0 && idx < arr.length ? arr[idx] : null); return true; }
      if (typeof arr === 'string') { this.env.define('__last_result__', arr[idx] !== undefined ? arr[idx] : null); return true; }
      this.env.define('__last_result__', null);
      return true;
    }

    // ---- Additional string builtins ----
    if (n === 'words' && args.length >= 1) {
      this.env.define('__last_result__', String(args[0]).split(/\s+/).filter(Boolean));
      return true;
    }
    if (n === 'reverse_string' && args.length >= 1) {
      this.env.define('__last_result__', String(args[0]).split('').reverse().join(''));
      return true;
    }
    if (n === 'repeat' && args.length >= 2) {
      this.env.define('__last_result__', String(args[0]).repeat(Math.max(0, Math.floor(this.toNumber(args[1])))));
      return true;
    }

    // Standard Library Functions
    if (n === 'len' && args.length >= 1) {
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
    if (n === 'to_string' && args.length >= 1) {
      const val = args[0];
      if (typeof val === 'number') {
        this.env.define('__last_result__', String(val));
      } else if (typeof val === 'boolean') {
        this.env.define('__last_result__', String(val));
      } else if (typeof val === 'string') {
        this.env.define('__last_result__', val);
      } else if (Array.isArray(val)) {
        this.env.define('__last_result__', `[list of ${val.length} elements]`);
      } else {
        this.env.define('__last_result__', String(val));
      }
      return true;
    }
    if (n === 'substr' && args.length >= 3) {
      const str = String(args[0]);
      const start = this.toNumber(args[1]);
      const end = this.toNumber(args[2]);

      // Bounds checking
      if (start < 0) {
        throw new RuntimeError(`substr: start index cannot be negative (${start})`);
      }
      if (end < start) {
        throw new RuntimeError(`substr: end index (${end}) cannot be less than start index (${start})`);
      }
      if (start > str.length) {
        throw new RuntimeError(`substr: start index (${start}) out of bounds (string length: ${str.length})`);
      }

      this.env.define('__last_result__', str.substring(start, end));
      return true;
    }
    if (n === 'contains' && args.length >= 2) {
      const str = String(args[0]);
      const substr = String(args[1]);
      this.env.define('__last_result__', str.includes(substr));
      return true;
    }

    // Additional String Functions
    if (n === 'split' && args.length >= 2) {
      const str = String(args[0]);
      const sep = String(args[1]);
      this.env.define('__last_result__', str.split(sep));
      return true;
    }
    if (n === 'join' && args.length >= 2 && Array.isArray(args[0])) {
      const list = args[0] as IOZENValue[];
      const sep = String(args[1]);
      this.env.define('__last_result__', list.map(String).join(sep));
      return true;
    }
    if (n === 'trim' && args.length >= 1) {
      this.env.define('__last_result__', String(args[0]).trim());
      return true;
    }
    if (n === 'upper' && args.length >= 1) {
      this.env.define('__last_result__', String(args[0]).toUpperCase());
      return true;
    }
    if (n === 'lower' && args.length >= 1) {
      this.env.define('__last_result__', String(args[0]).toLowerCase());
      return true;
    }
    if (n === 'starts_with' && args.length >= 2) {
      const str = String(args[0]);
      const prefix = String(args[1]);
      this.env.define('__last_result__', str.startsWith(prefix));
      return true;
    }
    if (n === 'ends_with' && args.length >= 2) {
      const str = String(args[0]);
      const suffix = String(args[1]);
      this.env.define('__last_result__', str.endsWith(suffix));
      return true;
    }

    // Type Conversion
    if (n === 'to_integer' && args.length >= 1) {
      const val = args[0];
      if (typeof val === 'number') {
        this.env.define('__last_result__', Math.floor(val));
      } else if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        if (isNaN(parsed)) {
          throw new RuntimeError(`Cannot convert "${val}" to integer: invalid format`);
        }
        this.env.define('__last_result__', parsed);
      } else if (typeof val === 'boolean') {
        this.env.define('__last_result__', val ? 1 : 0);
      } else {
        throw new RuntimeError(`Cannot convert ${typeof val} to integer`);
      }
      return true;
    }
    if (n === 'to_float' && args.length >= 1) {
      const val = args[0];
      if (typeof val === 'number') {
        this.env.define('__last_result__', val);
      } else if (typeof val === 'string') {
        const parsed = parseFloat(val);
        if (isNaN(parsed)) {
          throw new RuntimeError(`Cannot convert "${val}" to float: invalid format`);
        }
        this.env.define('__last_result__', parsed);
      } else if (typeof val === 'boolean') {
        this.env.define('__last_result__', val ? 1.0 : 0.0);
      } else {
        throw new RuntimeError(`Cannot convert ${typeof val} to float`);
      }
      return true;
    }

    // File I/O Functions
    if (n === 'read_file' && args.length >= 1) {
      const path = String(args[0]);
      if (!fs.existsSync(path)) {
        throw new RuntimeError(`File not found: "${path}"`);
      }
      try {
        const content = fs.readFileSync(path, 'utf-8');
        this.env.define('__last_result__', content);
      } catch (e: any) {
        throw new RuntimeError(`Cannot read file "${path}": ${e.message}`);
      }
      return true;
    }
    if (n === 'write_file' && args.length >= 2) {
      const path = String(args[0]);
      const content = String(args[1]);
      try {
        fs.writeFileSync(path, content, 'utf-8');
        this.env.define('__last_result__', true);
      } catch (e: any) {
        throw new RuntimeError(`Cannot write to file "${path}": ${e.message}`);
      }
      return true;
    }
    if (n === 'file_exists' && args.length >= 1) {
      const path = String(args[0]);
      this.env.define('__last_result__', fs.existsSync(path));
      return true;
    }
    if (n === 'delete_file' && args.length >= 1) {
      const path = String(args[0]);
      if (!fs.existsSync(path)) {
        throw new RuntimeError(`Cannot delete: file not found "${path}"`);
      }
      try {
        fs.unlinkSync(path);
        this.env.define('__last_result__', true);
      } catch (e: any) {
        throw new RuntimeError(`Cannot delete file "${path}": ${e.message}`);
      }
      return true;
    }

    return false;
  }

  // ---- Type Helpers ----

  /** Resolve a value that may be a function object or a string name to an IOZENFunction. */
  private resolveFunctionArg(rawArg: IOZENValue, env: Environment): IOZENFunction | null {
    if (rawArg && typeof rawArg === 'object' && rawArg.__iozen_type === 'function') {
      return rawArg as IOZENFunction;
    }
    if (typeof rawArg === 'string') {
      const func = env.get(rawArg);
      if (func && typeof func === 'object' && func.__iozen_type === 'function') {
        return func as IOZENFunction;
      }
    }
    return null;
  }

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
    if (this.callDepth > this.maxCallDepth) {
      throw new RuntimeError(`Maximum call depth (${this.maxCallDepth}) exceeded (possible infinite recursion)`);
    }
  }

  // ---- Typo Suggestions ----

  private builtinNames: string[] = [
    // Core
    'print', 'println', 'inspect', 'assert', 'panic',
    // Math
    'abs', 'abs_int', 'sqrt', 'floor', 'ceil', 'round', 'trunc',
    'power', 'pow', 'min', 'max', 'mod', 'sign',
    'log', 'log2', 'log10', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
    'gcd', 'lcm', 'pi', 'e',
    'clamp', 'format_num',
    // String
    'uppercase', 'lowercase', 'upper', 'trim', 'strip',
    'substring', 'contains', 'replace', 'split', 'join', 'char_at',
    'ord', 'chr', 'to_text', 'to_integer', 'int', 'to_float',
    'starts_with', 'ends_with', 'repeat_str', 'repeat', 'repeat_string',
    'pad_left', 'pad_right', 'lines', 'words',
    'reverse_str', 'reverse_string', 'index_of', 'find_index',
    'format', 'count',
    // Type
    'type_of', 'typeof',
    // List
    'push', 'pop', 'sort', 'reverse', 'length', 'range', 'sum',
    'remove', 'remove_last', 'remove_key',
    'index_of', 'find', 'contains_list', 'slice', 'insert',
    'flatten', 'unique', 'compact',
    'first', 'last', 'chunk', 'take', 'drop', 'nth', 'at', 'has',
    'cycle', 'is_empty', 'not_empty', 'count_by',
    'contains_any', 'interleave', 'zip', 'enumerate',
    // Higher-order
    'map_list', 'filter_list', 'for_each_list',
    'flat_map', 'any', 'all', 'reduce',
    'takewhile', 'dropwhile', 'join_map',
    // Map
    'map', 'has_key', 'get_key', 'set_key', 'keys', 'values',
    'map_size', 'has_value', 'map_set', 'to_map',
    // File I/O
    'read_line', 'read_file', 'write_file', 'append_file',
    'delete_file', 'file_exists',
    // Random
    'random_int', 'random_float', 'random_choice', 'shuffle',
    // Time
    'current_time', 'clock', 'time_format',
    // System
    'env_get', 'env_set', 'args', 'arguments', 'system', 'sleep',
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

  /**
   * Phase 14.1: Get location from AST node if available
   * Returns [line, column] tuple from node.location or undefined
   */
  private getNodeLocation(node: ASTNode): [number, number | undefined] {
    const loc = (node as any).location;
    if (loc && typeof loc.line === 'number' && typeof loc.column === 'number') {
      return [loc.line, loc.column];
    }
    return [];
  }
}

// ---- Convenience API ----

export function executeIOZEN(source: string): { output: string[]; errors: string[] } {
  const interpreter = new Interpreter();
  return interpreter.run(source);
}

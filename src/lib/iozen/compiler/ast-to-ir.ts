// AST to IR Generator
// Converts IOZEN AST to Intermediate Representation

import type * as AST from '../parser_v2';
import type { IRProgram, IRValue, IRStructDef } from './ir';
import { IRBuilder, createIRBuilder } from './ir';

export class ASTToIR {
  private builder: IRBuilder;
  private variableTypes: Map<string, IRValue['type']> = new Map();
  private structDefs: Map<string, { fields: { name: string; typeName: string }[] }> = new Map();
  private enumDefs: Map<string, Map<string, number>> = new Map();
  private loopLabels: { start: string; end: string }[] = [];

  constructor() {
    this.builder = createIRBuilder();
  }

  generate(program: AST.Program): IRProgram {
    this.builder.reset();
    this.variableTypes.clear();
    this.structDefs.clear();
    this.enumDefs.clear();

    // Process all statements at program level
    for (const stmt of program.body) {
      this.processGlobalStatement(stmt);
    }

    // Register struct definitions in IR program
    for (const [name, def] of this.structDefs) {
      const irDef: IRStructDef = {
        name,
        fields: def.fields.map(f => ({ name: f.name, type: this.mapType(f.typeName) }))
      };
      this.builder.getProgram().structs.set(name, irDef);
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
      case 'StructDeclaration':
        // Register struct definition for type tracking
        this.structDefs.set(stmt.name, { fields: stmt.fields });
        break;
      case 'EnumDeclaration':
        // Register enum definition - variants map to integer constants
        {
          const variantMap = new Map<string, number>();
          for (let i = 0; i < stmt.variants.length; i++) {
            variantMap.set(stmt.variants[i], i);
            this.variableTypes.set(`${stmt.name}.${stmt.variants[i]}`, 'number');
          }
          this.enumDefs.set(stmt.name, variantMap);
        }
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
        return this.genBreak();
      case 'ContinueStatement':
        return this.genContinue();
      case 'ExpressionStatement':
        return this.genExpression(stmt.expression);
      case 'TryStatement':
        return this.genTry(stmt as AST.TryStatement);
      case 'ThrowStatement':
        return this.genThrow(stmt as AST.ThrowStatement);
      case 'ImportStatement':
      case 'ExportStatement':
        // TODO: Module system
        return undefined;
      case 'FieldAssignment':
        return this.genFieldAssignment(stmt as AST.FieldAssignment);
      default:
        return undefined;
    }
  }

  private genVariableDeclaration(stmt: AST.VariableDeclaration): string {
    let type = this.mapType(stmt.typeAnnotation);
    
    // If no explicit type annotation, infer from initializer
    if (type === 'ptr' && stmt.typeAnnotation === null && stmt.initializer) {
      type = this.inferType(stmt.initializer);
    }
    
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

    // Push loop labels for break/continue
    this.loopLabels.push({ start: startLabel, end: endLabel });

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

    // Pop loop labels
    this.loopLabels.pop();
    return undefined;
  }

  private genFor(stmt: AST.ForStatement): string | undefined {
    // Desugar for loop to: init; while (cond) { body; increment; }

    // 1. Initializer (if present)
    if (stmt.initializer) {
      if (stmt.initializer.type === 'VariableDeclaration') {
        this.genVariableDeclaration(stmt.initializer);
      } else {
        this.genExpression(stmt.initializer.expression);
      }
    }

    // 2. While loop structure
    const startLabel = this.builder.newLabel('for');
    const bodyLabel = this.builder.newLabel('for_body');
    const endLabel = this.builder.newLabel('for_end');

    // Push loop labels for break/continue
    this.loopLabels.push({ start: startLabel, end: endLabel });

    // Check condition
    this.builder.emitLabel(startLabel);
    if (stmt.condition) {
      const cond = this.genExpression(stmt.condition);
      this.builder.emit({ op: 'if', src1: cond, label: bodyLabel, comment: `if ${cond} goto ${bodyLabel}` });
    }
    this.builder.emitGoto(endLabel);

    // Body
    this.builder.emitLabel(bodyLabel);
    for (const s of stmt.body) {
      this.generateStatement(s);
    }

    // 3. Increment (if present)
    if (stmt.increment) {
      // Check for assignment increment (e.g., i = i + 1)
      const assignTarget = (stmt.increment as any).__assignTarget;
      if (assignTarget) {
        const value = this.genExpression(stmt.increment);
        this.builder.emitStore(assignTarget, value);
      } else {
        this.genExpression(stmt.increment);
      }
    }
    this.builder.emitGoto(startLabel);

    this.builder.emitLabel(endLabel);

    // Pop loop labels
    this.loopLabels.pop();
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

  private genBreak(): string | undefined {
    if (this.loopLabels.length === 0) {
      throw new Error('Break statement outside of loop');
    }
    const labels = this.loopLabels[this.loopLabels.length - 1];
    this.builder.emitGoto(labels.end);
    return undefined;
  }

  private genContinue(): string | undefined {
    if (this.loopLabels.length === 0) {
      throw new Error('Continue statement outside of loop');
    }
    const labels = this.loopLabels[this.loopLabels.length - 1];
    this.builder.emitGoto(labels.start);
    return undefined;
  }

  private genTry(stmt: AST.TryStatement): string | undefined {
    // Generate IR for try/catch/finally:
    //
    // Without finally:
    //   try_start catch_label:
    //     ... tryBody ...
    //   goto try_end_label
    //   catch_label:
    //     e = caught_exception  (if catchParam)
    //     ... catchBody ...
    //   try_end_label:
    //
    // With finally:
    //   try_start catch_label:
    //     ... tryBody ...
    //   goto finally_label
    //   catch_label:
    //     e = caught_exception  (if catchParam)
    //     ... catchBody ...
    //   finally_label:
    //     ... finallyBody ...
    //   try_end_label:

    const catchLabel = this.builder.newLabel('catch');
    const tryEndLabel = this.builder.newLabel('try_end');

    // try_start: marks beginning of try block, with catch handler label
    this.builder.emit({ op: 'try_start', label: catchLabel, comment: `try_start -> ${catchLabel}` });

    // Generate try body
    for (const s of stmt.tryBody) {
      this.generateStatement(s);
    }

    // Skip catch if no exception was thrown
    if (stmt.finallyBody && stmt.finallyBody.length > 0) {
      // If finally exists, goto finally_label (finally runs after try success)
      const finallyLabel = this.builder.newLabel('finally');
      this.builder.emitGoto(finallyLabel);

      // catch_label:
      this.builder.emitLabel(catchLabel);

      if (stmt.catchBody && stmt.catchParam) {
        // Bind the caught exception to catchParam
        this.builder.addLocal(stmt.catchParam, 'ptr');
        this.variableTypes.set(stmt.catchParam, 'ptr');
        // Load the caught exception value from the global exception variable
        this.builder.emitLoad(stmt.catchParam, '__iz_exception_value');
        // Generate catch body
        for (const s of stmt.catchBody) {
          this.generateStatement(s);
        }
      } else if (stmt.catchBody) {
        // catch without parameter
        for (const s of stmt.catchBody) {
          this.generateStatement(s);
        }
      }

      // finally_label:
      this.builder.emitLabel(finallyLabel);
      for (const s of stmt.finallyBody) {
        this.generateStatement(s);
      }

      // try_end_label:
      this.builder.emitLabel(tryEndLabel);
    } else {
      // No finally — try body falls through to try_end
      this.builder.emitGoto(tryEndLabel);

      // catch_label:
      this.builder.emitLabel(catchLabel);

      if (stmt.catchBody && stmt.catchParam) {
        // Bind the caught exception to catchParam
        this.builder.addLocal(stmt.catchParam, 'ptr');
        this.variableTypes.set(stmt.catchParam, 'ptr');
        // Load the caught exception value from the global exception variable
        this.builder.emitLoad(stmt.catchParam, '__iz_exception_value');
        // Generate catch body
        for (const s of stmt.catchBody) {
          this.generateStatement(s);
        }
      } else if (stmt.catchBody) {
        // catch without parameter
        for (const s of stmt.catchBody) {
          this.generateStatement(s);
        }
      }

      // try_end_label:
      this.builder.emitLabel(tryEndLabel);
    }

    return undefined;
  }

  private genThrow(stmt: AST.ThrowStatement): string | undefined {
    const value = this.genExpression(stmt.value);
    this.builder.emit({ op: 'throw', src1: value, comment: `throw ${value}` });
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

      case 'BooleanLiteral':
        const boolTemp = this.builder.newTemp('bool');
        this.builder.emitConst(boolTemp, { type: 'bool', value: (expr as any).value });
        return boolTemp;

      case 'UnaryExpression':
        return this.genUnary(expr as any);

      case 'LogicalExpression':
        return this.genLogical(expr as any);

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

      case 'MatchExpression':
        return this.genMatchExpression(expr as any);

      case 'LambdaExpression':
        return this.genLambda(expr as any);

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

    let left = this.genExpression(expr.left);
    let right = this.genExpression(expr.right);

    // String concatenation with type coercion: "str" + number or number + "str"
    if (expr.operator === '+') {
      const leftType = this.inferType(expr.left);
      const rightType = this.inferType(expr.right);

      if (leftType === 'string' || rightType === 'string') {
        // At least one operand is a string — use concat with auto-conversion
        if (leftType === 'number') {
          const converted = this.builder.newTemp('string');
          this.builder.emit({ op: 'to_string', dest: converted, src1: left, comment: `${converted} = to_string(${left})` });
          left = converted;
        }
        if (rightType === 'number') {
          const converted = this.builder.newTemp('string');
          this.builder.emit({ op: 'to_string', dest: converted, src1: right, comment: `${converted} = to_string(${right})` });
          right = converted;
        }
        const result = this.builder.newTemp('string');
        this.builder.emit({ op: 'concat', dest: result, src1: left, src2: right, comment: `${result} = ${left} concat ${right}` });
        return result;
      }
    }

    const isComparison = ['==', '!=', '<', '<=', '>', '>='].includes(expr.operator);
    const result = this.builder.newTemp(isComparison ? 'bool' : 'number');

    const opMap: Record<string, 'add' | 'sub' | 'mul' | 'div' | 'mod' | 'eq' | 'ne' | 'lt' | 'le' | 'gt' | 'ge'> = {
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
    };

    const op = opMap[expr.operator] || 'add';
    this.builder.emitBinary(op, result, left, right);
    return result;
  }

  private genUnary(expr: any): string {
    const operand = this.genExpression(expr.operand);
    const result = this.builder.newTemp(expr.operator === '!' ? 'bool' : 'number');
    if (expr.operator === '-') {
      this.builder.emit({ op: 'neg', dest: result, src1: operand, comment: `${result} = -${operand}` });
    } else if (expr.operator === '!') {
      this.builder.emit({ op: 'not', dest: result, src1: operand, comment: `${result} = !${operand}` });
    }
    return result;
  }

  private genLogical(expr: any): string {
    const left = this.genExpression(expr.left);
    const right = this.genExpression(expr.right);
    const result = this.builder.newTemp('bool');
    const op = expr.operator === '&&' ? 'and' : 'or';
    this.builder.emit({ op: op as any, dest: result, src1: left, src2: right, comment: `${result} = ${left} ${expr.operator} ${right}` });
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
    // Create array and push all elements
    const result = this.builder.newTemp('ptr');
    this.builder.emit({ op: 'array', dest: result, comment: 'array literal' });

    // Push each element
    for (const elem of expr.elements) {
      const elemValue = this.genExpression(elem);
      this.builder.emit({ op: 'array_push', src1: result, src2: elemValue, comment: `push ${elemValue} to ${result}` });
    }

    return result;
  }

  private genStructLiteral(expr: AST.StructLiteral): string {
    // Allocate struct
    const result = this.builder.newTemp('ptr');
    this.builder.emitStructAlloc(result, expr.name || '__anon');

    // Store each field
    for (const field of expr.fields) {
      const value = this.genExpression(field.value);
      this.builder.emitFieldStore(result, field.name, value);
    }

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
    // Check for enum variant access: EnumType.Variant -> integer constant
    if (expr.object.type === 'Identifier') {
      const enumName = expr.object.name;
      const variantName = expr.field;
      const enumDef = this.enumDefs.get(enumName);
      if (enumDef && enumDef.has(variantName)) {
        const value = enumDef.get(variantName)!;
        const result = this.builder.newTemp('number');
        this.builder.emitConst(result, { type: 'number', value });
        return result;
      }
    }

    // Regular struct field access
    const obj = this.genExpression(expr.object);
    const result = this.builder.newTemp('ptr');
    this.builder.emitFieldLoad(result, obj, expr.field);
    return result;
  }

  private lambdaCounter = 0;

  private genLambda(expr: any): string {
    // Closures are compiled as:
    // 1. A closure struct: { captured vars }
    // 2. A static function: fn_lambda_N(iz_closure_env_t* env, params...)
    // 3. The lambda value is represented as an index into a lambda table

    const lambdaId = this.lambdaCounter++;
    const funcName = `__lambda_${lambdaId}`;
    const captures = expr.captures || [];
    const params = expr.params || [];

    // Generate the lambda function
    this.builder.newFunction(funcName, 'void');

    // First parameter is always the closure environment (iz_value_t)
    const envParam = '__env';
    this.builder.addParam(envParam, 'ptr');

    // Add user parameters
    for (let i = 0; i < params.length; i++) {
      const paramName = params[i];
      const paramType = expr.paramTypes && expr.paramTypes[i]
        ? this.mapType(expr.paramTypes[i])
        : 'ptr';
      this.builder.addParam(paramName, paramType);
    }

    // Unpack captured variables from the environment
    // The environment is an iz_value_t array where each captured var is at its index
    for (let i = 0; i < captures.length; i++) {
      const captureName = captures[i];
      const captureType = this.variableTypes.get(captureName) || 'ptr';
      this.builder.addLocal(captureName, captureType);
      // Emit: captureName = iz_array_get(env, i)
      const tempIdx = this.builder.newTemp('number');
      this.builder.emitConst(tempIdx, { type: 'number', value: i });
      this.builder.emit({ op: 'index', dest: captureName, src1: envParam, src2: tempIdx,
        comment: `${captureName} = env[${i}]` });
    }

    // Generate body
    for (const stmt of expr.body) {
      this.generateStatement(stmt);
    }

    // Generate return if needed
    const funcData = this.builder.getProgram().functions.find(f => f.name === funcName);
    if (funcData && !funcData.instructions.some(i => i.op === 'ret')) {
      this.builder.emitRet();
    }

    // Now generate code in the caller to create the closure
    // For now, we represent a lambda as its function name (string constant)
    // The C backend will handle creating the closure struct
    const result = this.builder.newTemp('ptr');
    this.builder.emit({ op: 'lambda_alloc', dest: result, src1: funcName,
      label: captures.join(','), comment: `${result} = lambda ${funcName} captures=[${captures.join(',')}]` });

    return result;
  }

  private genMatchExpression(expr: any): string {
    // Lower match expression to nested if-else chain:
    // match subject {
    //   val1 => body1
    //   val2 => body2
    //   _ => default
    // }
    // becomes:
    //   result = uninitialized
    //   if (subject == val1) goto match_arm_0
    //   if (subject == val2) goto match_arm_1
    //   goto match_default
    // match_arm_0:
    //   result = body1
    //   goto match_end
    // match_arm_1:
    //   result = body2
    //   goto match_end
    // match_default:
    //   result = default
    // match_end:

    const subject = this.genExpression(expr.subject);
    const resultTemp = this.builder.newTemp('ptr');
    const endLabel = this.builder.newLabel('match_end');
    const defaultLabel = this.builder.newLabel('match_default');

    // Generate labels for each arm
    const armLabels = expr.arms.map((_, i: number) => this.builder.newLabel(`match_arm_${i}`));

    // Emit comparison jumps for each arm with a pattern
    for (let i = 0; i < expr.arms.length; i++) {
      const arm = expr.arms[i];

      if (arm.guard) {
        // Guard clause: if guard is true, goto this arm
        // Also bind the subject if there's a binding name
        if (arm.binding) {
          this.builder.emitStore(arm.binding, subject);
        }
        const guardResult = this.genExpression(arm.guard);
        this.builder.emit({ op: 'if', src1: guardResult, label: armLabels[i], comment: `if guard goto ${armLabels[i]}` });
      } else if (arm.pattern) {
        // Literal pattern: compare subject to pattern value
        if (arm.binding) {
          this.builder.emitStore(arm.binding, subject);
        }
        const patternValue = this.genExpression(arm.pattern);
        const cmpTemp = this.builder.newTemp('bool');
        this.builder.emit({ op: 'eq', dest: cmpTemp, src1: subject, src2: patternValue, comment: `${cmpTemp} = ${subject} == ${patternValue}` });
        this.builder.emit({ op: 'if', src1: cmpTemp, label: armLabels[i], comment: `if ${cmpTemp} goto ${armLabels[i]}` });
      } else {
        // Wildcard (no pattern) — this arm is reached by fallthrough from goto default
        // or is the first arm (acts like a default)
        if (i === 0 && expr.arms.length === 1) {
          // Only a single wildcard arm, just jump to it
          this.builder.emitGoto(armLabels[i]);
        }
        // Otherwise, this is handled by the default fallthrough
      }
    }

    // Jump to default
    this.builder.emitGoto(defaultLabel);

    // Emit arm bodies
    for (let i = 0; i < expr.arms.length; i++) {
      const arm = expr.arms[i];
      this.builder.emitLabel(armLabels[i]);
      const armResult = this.genExpression(arm.result);
      this.builder.emitStore(resultTemp, armResult);
      this.builder.emitGoto(endLabel);
    }

    // Default label: assign first wildcard arm's result, or error
    this.builder.emitLabel(defaultLabel);
    // Find a wildcard arm to use as default
    const defaultArm = expr.arms.find((a: any) => !a.pattern && !a.guard);
    if (defaultArm) {
      if (defaultArm.binding) {
        this.builder.emitStore(defaultArm.binding, subject);
      }
      const defaultResult = this.genExpression(defaultArm.result);
      this.builder.emitStore(resultTemp, defaultResult);
    } else {
      // No default arm — emit a null value
      this.builder.emitConst(resultTemp, { type: 'string', value: '' });
    }

    // End label
    this.builder.emitLabel(endLabel);

    return resultTemp;
  }

  private genFieldAssignment(stmt: AST.FieldAssignment): string {
    const obj = this.genExpression(stmt.object);
    const value = this.genExpression(stmt.value);
    this.builder.emitFieldStore(obj, stmt.field, value);
    return obj;
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
      default: {
        // Check if it's a known struct type
        if (this.structDefs.has(type)) return 'ptr';
        return 'ptr';
      }
    }
  }

  /** Infer the type of an expression at compile time (best effort) */
  private inferType(expr: AST.Expression): IRValue['type'] {
    switch (expr.type) {
      case 'NumberLiteral': return 'number';
      case 'StringLiteral': return 'string';
      case 'BooleanLiteral': return 'bool';
      case 'Identifier': {
        // Check variable types map
        const vtype = this.variableTypes.get(expr.name);
        if (vtype) return vtype;
        // Check if it's a known string variable
        return 'ptr'; // unknown
      }
      case 'BinaryExpression': {
        // If + has a string operand, result is string
        if (expr.operator === '+') {
          if (this.inferType(expr.left) === 'string' || this.inferType(expr.right) === 'string') {
            return 'string';
          }
        }
        if (['==', '!=', '<', '<=', '>', '>='].includes(expr.operator)) return 'bool';
        return 'number';
      }
      case 'UnaryExpression': return expr.operator === '!' ? 'bool' : 'number';
      case 'LogicalExpression': return 'bool';
      case 'CallExpression': {
        // Check if function has a known return type
        const callee = expr.callee;
        if (typeof callee === 'string') {
          // Some builtins return known types
          if (['get_os', 'get_cpu', 'get_ram', 'get_disk', 'get_shell',
               'get_resolution', 'upper', 'lower', 'pad', 'substring',
               'join', 'readFile'].includes(callee)) return 'string';
          if (['length', 'arrayLen'].includes(callee)) return 'number';
        }
        return 'ptr';
      }
      case 'ArrayLiteral': return 'ptr';
      case 'StructLiteral': return 'ptr';
      default: return 'ptr';
    }
  }
}

export function astToIR(program: AST.Program): IRProgram {
  const generator = new ASTToIR();
  return generator.generate(program);
}

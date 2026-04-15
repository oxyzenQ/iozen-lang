// Day 4: Minimal Interpreter
// Target: Execute AST - print("Hello") actually prints!
// NO OVERENGINEERING - just execute what we parse

import {
    BinaryExpression,
    CallExpression,
    Expression,
    ForStatement,
    FunctionDeclaration,
    IfStatement,
    PrintStatement,
    Program,
    Statement,
    WhileStatement
} from './parser_v2';

// Control flow exception types
class BreakException extends Error {}
class ContinueException extends Error {}
class ReturnException extends Error {
    constructor(public value: any) {
        super();
    }
}

// Week 8: Runtime errors with better messages
export class RuntimeError extends Error {
    constructor(
        message: string,
        public line?: number,
        public column?: number
    ) {
        super(line !== undefined
            ? `Runtime Error at line ${line}, column ${column}: ${message}`
            : `Runtime Error: ${message}`);
        this.name = 'RuntimeError';
    }
}

// Error handling for try/catch
class ThrowException extends Error {
    constructor(public value: any) {
        super();
    }
}

// ANSI color codes
const COLORS: Record<string, string> = {
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
  reset: '\x1b[0m'
};

// Built-in system info functions
const BUILTINS: Record<string, (...args: any[]) => any> = {
  // Week 1: System info
  get_os: () => {
    const platform = process.platform;
    if (platform === 'linux') return 'Linux';
    if (platform === 'darwin') return 'macOS';
    if (platform === 'win32') return 'Windows';
    return platform;
  },

  get_cpu: () => {
    const os = require('os');
    return os.cpus()[0]?.model || 'Unknown CPU';
  },

  get_ram: () => {
    const os = require('os');
    const total = Math.round(os.totalmem() / 1024 / 1024 / 1024);
    const free = Math.round(os.freemem() / 1024 / 1024 / 1024);
    const used = total - free;
    return `${used}GB / ${total}GB`;
  },

  get_uptime: () => {
    const os = require('os');
    const uptime = os.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  },

  get_hostname: () => {
    const os = require('os');
    return os.hostname();
  },

  get_user: () => {
    return process.env.USER || process.env.USERNAME || 'unknown';
  },

  // Week 2: New system info
  get_shell: () => {
    return process.env.SHELL?.split('/').pop() || process.env.ComSpec?.split('\\').pop() || 'unknown';
  },

  get_disk: () => {
    try {
      const { execSync } = require('child_process');
      if (process.platform === 'linux') {
        const output = execSync('df -h / | tail -1', { encoding: 'utf-8' });
        const parts = output.trim().split(/\s+/);
        if (parts.length >= 3) {
          return `${parts[2]} / ${parts[1]}`;
        }
      }
      return 'N/A';
    } catch {
      return 'N/A';
    }
  },

  get_resolution: () => {
    try {
      const { execSync } = require('child_process');
      if (process.platform === 'linux') {
        const output = execSync('xrandr | grep "*" | head -1', { encoding: 'utf-8' });
        const match = output.match(/(\d+x\d+)/);
        return match ? match[1] : 'N/A';
      }
      return 'N/A';
    } catch {
      return 'N/A';
    }
  },

  // Week 2: Color function
  color: (colorName: string, text: string) => {
    const code = COLORS[colorName] || COLORS.reset;
    return `${code}${text}${COLORS.reset}`;
  },

  // Week 2: String functions
  length: (str: string) => {
    return String(str).length;
  },

  upper: (str: string) => {
    return String(str).toUpperCase();
  },

  lower: (str: string) => {
    return String(str).toLowerCase();
  },

  pad: (str: string, length: number, char: string = ' ') => {
    const s = String(str);
    if (s.length >= length) return s;
    const padLen = length - s.length;
    const leftPad = Math.floor(padLen / 2);
    const rightPad = padLen - leftPad;
    return char.repeat(leftPad) + s + char.repeat(rightPad);
  },

  // Week 2: Math functions
  round: (n: number) => Math.round(Number(n)),
  floor: (n: number) => Math.floor(Number(n)),
  ceil: (n: number) => Math.ceil(Number(n)),
  abs: (n: number) => Math.abs(Number(n)),
  max: (a: number, b: number) => Math.max(Number(a), Number(b)),
  min: (a: number, b: number) => Math.min(Number(a), Number(b)),

  // Week 5: Array functions
  arrayLen: (arr: any[]) => {
    return Array.isArray(arr) ? arr.length : 0;
  },

  arrayPush: (arr: any[], item: any) => {
    if (Array.isArray(arr)) {
      arr.push(item);
      return arr;
    }
    return [item];
  },

  // Week 5: String methods
  contains: (str: string, substr: string) => {
    return String(str).includes(String(substr));
  },

  startsWith: (str: string, substr: string) => {
    return String(str).startsWith(String(substr));
  },

  endsWith: (str: string, substr: string) => {
    return String(str).endsWith(String(substr));
  },

  trim: (str: string) => {
    return String(str).trim();
  },

  replace: (str: string, search: string, replace: string) => {
    return String(str).replace(String(search), String(replace));
  },

  split: (str: string, separator: string) => {
    return String(str).split(String(separator));
  },

  join: (arr: any[], separator: string = ",") => {
    return Array.isArray(arr) ? arr.join(String(separator)) : String(arr);
  },

  // Week 5: Type conversion
  str: (value: any) => {
    return String(value);
  },

  toNumber: (value: any) => {
    const n = Number(value);
    return isNaN(n) ? 0 : n;
  },

  parseInt: (value: any) => {
    return parseInt(String(value), 10) || 0;
  },

  parseFloat: (value: any) => {
    return parseFloat(String(value)) || 0;
  },

  // Week 5: Random functions
  random: () => {
    return Math.random();
  },

  randomInt: (min: number, max: number) => {
    const mn = Math.ceil(Number(min));
    const mx = Math.floor(Number(max));
    return Math.floor(Math.random() * (mx - mn + 1)) + mn;
  },

  // Week 5: Date/Time functions
  now: () => {
    return Date.now();
  },

  dateString: () => {
    return new Date().toLocaleDateString();
  },

  timeString: () => {
    return new Date().toLocaleTimeString();
  },

  // Week 5: File I/O (basic)
  readFile: (path: string) => {
    try {
      const fs = require('fs');
      return fs.readFileSync(String(path), 'utf-8');
    } catch (e) {
      return `[error reading file: ${e.message}]`;
    }
  },

  writeFile: (path: string, content: string) => {
    try {
      const fs = require('fs');
      fs.writeFileSync(String(path), String(content), 'utf-8');
      return true;
    } catch (e) {
      return false;
    }
  },

  fileExists: (path: string) => {
    try {
      const fs = require('fs');
      return fs.existsSync(String(path));
    } catch {
      return false;
    }
  },

  // Week 7: Higher-order functions
  map: (arr: any[], fnName: string) => {
    if (!Array.isArray(arr)) return [];
    // This is a placeholder - in real implementation, would call user function
    return arr.map((item, index) => `[mapped:${fnName}(${item})]`);
  },

  filter: (arr: any[], fnName: string) => {
    if (!Array.isArray(arr)) return [];
    // This is a placeholder - in real implementation, would call user function
    return arr.filter((item, index) => true);
  },

  reduce: (arr: any[], fnName: string, initial: any) => {
    if (!Array.isArray(arr)) return initial;
    // This is a placeholder - in real implementation, would call user function
    return initial;
  },

  // Week 9: Math functions
  sin: (x: number) => Math.sin(Number(x)),
  cos: (x: number) => Math.cos(Number(x)),
  tan: (x: number) => Math.tan(Number(x)),
  sqrt: (x: number) => Math.sqrt(Number(x)),
  pow: (base: number, exp: number) => Math.pow(Number(base), Number(exp)),
  abs: (x: number) => Math.abs(Number(x)),
  min: (a: number, b: number) => Math.min(Number(a), Number(b)),
  max: (a: number, b: number) => Math.max(Number(a), Number(b)),
  floor: (x: number) => Math.floor(Number(x)),
  ceil: (x: number) => Math.ceil(Number(x)),
  round: (x: number) => Math.round(Number(x)),
  pi: () => Math.PI,
  e: () => Math.E,

  // Week 11: JSON functions
  parseJSON: (str: string) => {
    try {
      return JSON.parse(String(str));
    } catch (e) {
      return null;
    }
  },
  stringify: (value: unknown) => {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return 'null';
    }
  },

  // Week 11: File I/O functions
  readFile: (path: string) => {
    try {
      return require('fs').readFileSync(String(path), 'utf-8');
    } catch (e) {
      return null;
    }
  },
  writeFile: (path: string, content: string) => {
    try {
      require('fs').writeFileSync(String(path), String(content));
      return true;
    } catch (e) {
      return false;
    }
  },
  exists: (path: string) => {
    try {
      return require('fs').existsSync(String(path));
    } catch (e) {
      return false;
    }
  },

  // Week 9: String functions
  contains: (str: string, substr: string) => String(str).includes(String(substr)),
  startsWith: (str: string, substr: string) => String(str).startsWith(String(substr)),
  endsWith: (str: string, substr: string) => String(str).endsWith(String(substr)),
  trim: (str: string) => String(str).trim(),
  toUpper: (str: string) => String(str).toUpperCase(),
  toLower: (str: string) => String(str).toLowerCase(),
  replace: (str: string, oldStr: string, newStr: string) => String(str).replace(String(oldStr), String(newStr)),
  repeat: (str: string, count: number) => String(str).repeat(Number(count)),
  charAt: (str: string, index: number) => String(str).charAt(Number(index)),

  // Week 11: New string methods
  split: (str: string, separator: string) => String(str).split(String(separator)),
  join: (arr: string[], separator: string) => Array.isArray(arr) ? arr.join(String(separator)) : "",
  substring: (str: string, start: number, end?: number) => {
    const s = String(str);
    const st = Number(start);
    const en = end !== undefined ? Number(end) : s.length;
    return s.substring(st, en);
  },
  indexOf: (str: string, search: string) => String(str).indexOf(String(search)),
  lastIndexOf: (str: string, search: string) => String(str).lastIndexOf(String(search)),

  // Week 9: Array functions
  includes: (arr: any[], item: any) => Array.isArray(arr) ? arr.includes(item) : false,
  find: (arr: any[], fnName: string) => {
    if (!Array.isArray(arr)) return null;
    // Placeholder - would call user function
    return arr[0] ?? null;
  },
  findIndex: (arr: any[], fnName: string) => {
    if (!Array.isArray(arr)) return -1;
    // Placeholder - would call user function
    return 0;
  },
  sort: (arr: any[]) => {
    if (!Array.isArray(arr)) return [];
    return [...arr].sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      return String(a).localeCompare(String(b));
    });
  },
  reverse: (arr: any[]) => {
    if (!Array.isArray(arr)) return [];
    return [...arr].reverse();
  },
  slice: (arr: any[], start: number, end?: number) => {
    if (!Array.isArray(arr)) return [];
    return arr.slice(Number(start), end !== undefined ? Number(end) : undefined);
  },
  concat: (arr1: any[], arr2: any[]) => {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) return [];
    return [...arr1, ...arr2];
  }
};

// Function value with closure
class FunctionValue {
  constructor(
    public declaration: FunctionDeclaration,
    public closure: Map<string, any>
  ) {}
}

// Execution context
class ExecutionContext {
  variables: Map<string, any> = new Map();
  functions: Map<string, FunctionDeclaration> = new Map();

  setVariable(name: string, value: any): void {
    this.variables.set(name, value);
  }

  getVariable(name: string): any {
    return this.variables.get(name);
  }

  setFunction(name: string, func: FunctionDeclaration): void {
    this.functions.set(name, func);
  }

  getFunction(name: string): FunctionDeclaration | undefined {
    return this.functions.get(name);
  }
}

export class MinimalInterpreter {
  private context: ExecutionContext;

  constructor() {
    this.context = new ExecutionContext();
  }

  execute(program: Program): void {
    // First pass: register all functions
    for (const stmt of program.body) {
      if (stmt.type === 'FunctionDeclaration') {
        this.context.setFunction(stmt.name, stmt);
      }
    }

    // Find and execute main
    const mainDecl = this.context.getFunction('main');
    if (!mainDecl) {
      throw new Error('No main() function found');
    }

    const main = new FunctionValue(mainDecl, new Map());
    this.executeFunction(main, []);
  }

  private executeFunction(func: FunctionValue, args: any[]): any {
    // Save current scope
    const prevVariables = new Map(this.context.variables);

    // Restore captured closure scope (for closures)
    this.context.variables = new Map(func.closure);

    // Set parameters
    for (let i = 0; i < func.declaration.params.length; i++) {
      this.context.setVariable(func.declaration.params[i], args[i]);
    }

    // Execute body
    let returnValue: any = undefined;
    try {
      for (const stmt of func.declaration.body) {
        this.executeStatement(stmt);
      }
    } catch (e) {
      if (e instanceof ReturnException) {
        returnValue = e.value;
      } else {
        throw e;
      }
    } finally {
      // Restore original scope
      this.context.variables = prevVariables;
    }
    return returnValue;
  }

  private executeStatement(stmt: Statement): void {
    switch (stmt.type) {
      case 'PrintStatement':
        this.executePrint(stmt);
        break;
      case 'ExpressionStatement':
        this.evaluateExpression(stmt.expression);
        break;
      case 'VariableDeclaration':
        this.executeVariableDeclaration(stmt);
        break;
      case 'AssignmentStatement':
        const assignValue = this.evaluateExpression(stmt.value);
        this.context.setVariable(stmt.name, assignValue);
        break;
      case 'IfStatement':
        this.executeIfStatement(stmt);
        break;
      case 'WhileStatement':
        this.executeWhileStatement(stmt);
        break;
      case 'ForStatement':
        this.executeForStatement(stmt);
        break;
      case 'BreakStatement':
        throw new BreakException();
      case 'ContinueStatement':
        throw new ContinueException();
      case 'ReturnStatement':
        const returnValue = stmt.value ? this.evaluateExpression(stmt.value) : undefined;
        throw new ReturnException(returnValue);
      case 'ImportStatement':
        this.executeImport(stmt);
        break;
      case 'ExportStatement':
        this.executeExport(stmt);
        break;
      case 'TryStatement':
        this.executeTryCatch(stmt);
        break;
      case 'ThrowStatement':
        const throwValue = this.evaluateExpression(stmt.value);
        throw new ThrowException(throwValue);
      case 'FunctionDeclaration':
        // Create function value with closure (captures current scope)
        const funcValue = new FunctionValue(stmt, new Map(this.context.variables));
        this.context.setVariable(stmt.name, funcValue);
        this.context.setFunction(stmt.name, stmt);
        break;
      default:
        // Skip other statements
        break;
    }
  }

  private executeImport(stmt: ImportStatement): void {
    // For now, just mark imports as placeholders
    // In a real implementation, this would load and parse the module file
    for (const name of stmt.names) {
      this.context.setVariable(name, `[imported from ${stmt.path}]`);
    }
  }

  private executeExport(stmt: ExportStatement): void {
    // For now, just execute the declaration
    // In a real module system, this would mark the declaration as exported
    this.executeStatement(stmt.declaration);
  }

  private executeTryCatch(stmt: TryStatement): void {
    try {
      this.executeBlock(stmt.tryBody);
    } catch (e) {
      if (e instanceof ThrowException) {
        if (stmt.catchBody) {
          // Create new scope for catch
          const prevVariables = new Map(this.context.variables);

          // Set the error parameter if present
          if (stmt.catchParam) {
            this.context.setVariable(stmt.catchParam, e.value);
          }

          try {
            this.executeBlock(stmt.catchBody);
          } finally {
            // Restore scope
            this.context.variables = prevVariables;
          }
        }
      } else {
        // Re-throw non-ThrowException errors
        throw e;
      }
    } finally {
      if (stmt.finallyBody) {
        this.executeBlock(stmt.finallyBody);
      }
    }
  }

  private executeIfStatement(stmt: IfStatement): void {
    const condition = this.evaluateExpression(stmt.condition);
    if (this.isTruthy(condition)) {
      this.executeBlock(stmt.thenBranch);
    } else if (stmt.elseBranch) {
      this.executeBlock(stmt.elseBranch);
    }
  }

  private executeWhileStatement(stmt: WhileStatement): void {
    while (this.isTruthy(this.evaluateExpression(stmt.condition))) {
      try {
        this.executeBlock(stmt.body);
      } catch (e) {
        if (e instanceof BreakException) break;
        if (e instanceof ContinueException) continue;
        throw e;
      }
    }
  }

  private executeForStatement(stmt: ForStatement): void {
    // Execute initializer
    if (stmt.initializer) {
      if (stmt.initializer.type === 'VariableDeclaration') {
        this.executeVariableDeclaration(stmt.initializer);
      } else {
        this.evaluateExpression(stmt.initializer.expression);
      }
    }

    // Loop
    while (true) {
      // Check condition
      if (stmt.condition && !this.isTruthy(this.evaluateExpression(stmt.condition))) {
        break;
      }

      try {
        this.executeBlock(stmt.body);
      } catch (e) {
        if (e instanceof BreakException) break;
        if (e instanceof ContinueException) {
          // Execute increment and continue
          if (stmt.increment) {
            this.evaluateExpression(stmt.increment);
          }
          continue;
        }
        throw e;
      }

      // Execute increment
      if (stmt.increment) {
        this.evaluateExpression(stmt.increment);
      }
    }
  }

  private executeBlock(statements: Statement[]): void {
    for (const stmt of statements) {
      this.executeStatement(stmt);
    }
  }

  private isTruthy(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.length > 0;
    return true;
  }

  private executeVariableDeclaration(stmt: any): void {
    const value = this.evaluateExpression(stmt.initializer);
    this.context.setVariable(stmt.name, value);
  }

  private executePrint(stmt: PrintStatement): void {
    const value = this.evaluateExpression(stmt.argument);
    console.log(value);
  }

  private evaluateExpression(expr: Expression): any {
    switch (expr.type) {
      case 'StringLiteral':
        return expr.value;

      case 'NumberLiteral':
        return expr.value;

      case 'BooleanLiteral':
        return expr.value;

      case 'UnaryExpression':
        const operand = this.evaluateExpression(expr.operand);
        if (expr.operator === '-') return -Number(operand);
        if (expr.operator === '!') return !this.isTruthy(operand);
        return `[unsupported unary: ${expr.operator}]`;

      case 'LogicalExpression':
        const lval = this.evaluateExpression(expr.left);
        if (expr.operator === '&&') return this.isTruthy(lval) ? this.evaluateExpression(expr.right) : lval;
        if (expr.operator === '||') return this.isTruthy(lval) ? lval : this.evaluateExpression(expr.right);
        return `[unsupported logical: ${expr.operator}]`;

      case 'Identifier':
        return this.context.getVariable(expr.name) ?? `[unknown:${expr.name}]`;

      case 'BinaryExpression':
        return this.evaluateBinary(expr);

      case 'CallExpression':
        return this.evaluateCall(expr);

      case 'ArrayLiteral':
        return expr.elements.map(e => this.evaluateExpression(e));

      case 'StructLiteral':
        const obj: Record<string, any> = {};
        for (const field of expr.fields) {
          obj[field.name] = this.evaluateExpression(field.value);
        }
        return obj;

      case 'ArrayAccess':
        const arr = this.evaluateExpression(expr.array);
        const idx = this.evaluateExpression(expr.index);
        if (Array.isArray(arr)) {
          return arr[idx] ?? `[index out of bounds: ${idx}]`;
        }
        return `[not an array]`;

      case 'FieldAccess':
        const obj2 = this.evaluateExpression(expr.object);
        if (obj2 && typeof obj2 === 'object' && expr.field in obj2) {
          return obj2[expr.field];
        }
        return `[field not found: ${expr.field}]`;

      case 'MatchExpression':
        return this.evaluateMatch(expr as any);

      default:
        return `[unknown expression]`;
    }
  }

  private evaluateMatch(expr: any): any {
    const subject = this.evaluateExpression(expr.subject);
    const arms: any[] = expr.arms;

    for (const arm of arms) {
      // Check pattern match
      let matched = false;

      if (arm.guard) {
        // Guard clause: bind subject and evaluate guard
        if (arm.binding) {
          this.context.setVariable(arm.binding, subject);
        }
        const guardResult = this.evaluateExpression(arm.guard);
        matched = this.isTruthy(guardResult);
      } else if (arm.pattern) {
        // Literal pattern: compare subject to pattern value
        const patternValue = this.evaluateExpression(arm.pattern);
        matched = subject === patternValue;
        // For number comparison, also try numeric equality
        if (!matched && typeof subject === 'number' && typeof patternValue === 'number') {
          matched = subject === patternValue;
        }
      } else {
        // Wildcard: always matches
        matched = true;
      }

      if (matched) {
        // Bind the subject value if there's a binding
        if (arm.binding) {
          this.context.setVariable(arm.binding, subject);
        }
        return this.evaluateExpression(arm.result);
      }
    }

    // No arm matched (shouldn't happen with wildcard, but just in case)
    return null;
  }

  private evaluateBinary(expr: BinaryExpression): any {
    const left = this.evaluateExpression(expr.left);
    const right = this.evaluateExpression(expr.right);
    const leftNum = Number(left);
    const rightNum = Number(right);
    const areBothNumbers = !isNaN(leftNum) && !isNaN(rightNum);

    switch (expr.operator) {
      case '+':
        if (areBothNumbers) return leftNum + rightNum;
        return String(left) + String(right);
      case '-':
        if (areBothNumbers) return leftNum - rightNum;
        return `[cannot subtract strings]`;
      case '*':
        if (areBothNumbers) return leftNum * rightNum;
        return `[cannot multiply strings]`;
      case '/':
        if (areBothNumbers) {
          if (rightNum === 0) return `[division by zero]`;
          return Math.floor(leftNum / rightNum); // Integer division
        }
        return `[cannot divide strings]`;
      case '%':
        if (areBothNumbers) return leftNum % rightNum;
        return `[cannot modulo strings]`;
      case '==':
        return left === right;
      case '!=':
        return left !== right;
      case '<':
        if (areBothNumbers) return leftNum < rightNum;
        return String(left) < String(right);
      case '>':
        if (areBothNumbers) return leftNum > rightNum;
        return String(left) > String(right);
      case '<=':
        if (areBothNumbers) return leftNum <= rightNum;
        return String(left) <= String(right);
      case '>=':
        if (areBothNumbers) return leftNum >= rightNum;
        return String(left) >= String(right);
      default:
        return `[unsupported operator: ${expr.operator}]`;
    }
  }

  private evaluateCall(expr: CallExpression): any {
    // Check for built-in functions
    const builtin = BUILTINS[expr.callee];
    if (builtin) {
      const args = expr.arguments.map(arg => this.evaluateExpression(arg));
      return builtin(...args);
    }

    // Check for user-defined functions by name
    const userFunc = this.context.getFunction(expr.callee);
    if (userFunc) {
      const args = expr.arguments.map(arg => this.evaluateExpression(arg));
      const funcValue = new FunctionValue(userFunc, new Map(this.context.variables));
      return this.executeFunction(funcValue, args);
    }

    // Check for function values stored in variables (closures)
    const funcValue = this.context.getVariable(expr.callee);
    if (funcValue instanceof FunctionValue) {
      const args = expr.arguments.map(arg => this.evaluateExpression(arg));
      return this.executeFunction(funcValue, args);
    }

    return `[unknown function: ${expr.callee}]`;
  }
}

// Helper function
export function execute(program: Program): void {
  const interpreter = new MinimalInterpreter();
  interpreter.execute(program);
}

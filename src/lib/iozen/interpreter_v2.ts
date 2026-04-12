// Day 4: Minimal Interpreter
// Target: Execute AST - print("Hello") actually prints!
// NO OVERENGINEERING - just execute what we parse

import {
    BinaryExpression,
    CallExpression,
    Expression,
    FunctionDeclaration,
    PrintStatement,
    Program,
    Statement
} from './parser_v2';

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
  min: (a: number, b: number) => Math.min(Number(a), Number(b))
};

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
    const main = this.context.getFunction('main');
    if (!main) {
      throw new Error('No main() function found');
    }

    this.executeFunction(main, []);
  }

  private executeFunction(func: FunctionDeclaration, args: any[]): void {
    // Create new scope for function
    const prevVariables = new Map(this.context.variables);

    // Set parameters
    for (let i = 0; i < func.params.length; i++) {
      this.context.setVariable(func.params[i], args[i]);
    }

    // Execute body
    for (const stmt of func.body) {
      this.executeStatement(stmt);
    }

    // Restore scope
    this.context.variables = prevVariables;
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
      default:
        // Skip other statements
        break;
    }
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

      case 'Identifier':
        return this.context.getVariable(expr.name) ?? `[unknown:${expr.name}]`;

      case 'BinaryExpression':
        return this.evaluateBinary(expr);

      case 'CallExpression':
        return this.evaluateCall(expr);

      default:
        return `[unknown expression]`;
    }
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

    // Check for user-defined functions
    const userFunc = this.context.getFunction(expr.callee);
    if (userFunc) {
      const args = expr.arguments.map(arg => this.evaluateExpression(arg));
      // For Day 4, we don't capture return values from user functions
      this.executeFunction(userFunc, args);
      return undefined;
    }

    return `[unknown function: ${expr.callee}]`;
  }
}

// Helper function
export function execute(program: Program): void {
  const interpreter = new MinimalInterpreter();
  interpreter.execute(program);
}

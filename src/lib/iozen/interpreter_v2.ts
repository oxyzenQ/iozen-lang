// Day 4: Minimal Interpreter
// Target: Execute AST - print("Hello") actually prints!
// NO OVERENGINEERING - just execute what we parse

import {
  Program,
  Statement,
  Expression,
  FunctionDeclaration,
  PrintStatement,
  StringLiteral,
  NumberLiteral,
  Identifier,
  BinaryExpression,
  CallExpression
} from './parser_v2';

// Built-in system info functions
const BUILTINS: Record<string, () => string> = {
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
  }
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
      default:
        // Skip other statements for Day 4
        break;
    }
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
  
  private evaluateBinary(expr: BinaryExpression): string {
    const left = this.evaluateExpression(expr.left);
    const right = this.evaluateExpression(expr.right);
    
    // For Day 4, only support string concatenation with +
    if (expr.operator === '+') {
      return String(left) + String(right);
    }
    
    return `[unsupported operator: ${expr.operator}]`;
  }
  
  private evaluateCall(expr: CallExpression): any {
    // Check for built-in functions
    const builtin = BUILTINS[expr.callee];
    if (builtin) {
      return builtin();
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

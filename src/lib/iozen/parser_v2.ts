// Day 3: Simple Parser
// Target: Parse tokens into AST for fn main() { print("...") }
// NO OVERENGINEERING - just what we need

import { Token, TokenType } from './tokenizer_v2';

// AST Node Types
export interface Program {
  type: 'Program';
  body: Statement[];
}

export interface FunctionDeclaration {
  type: 'FunctionDeclaration';
  name: string;
  params: string[];
  body: Statement[];
}

export interface PrintStatement {
  type: 'PrintStatement';
  argument: Expression;
}

export interface ExpressionStatement {
  type: 'ExpressionStatement';
  expression: Expression;
}

export type Statement = 
  | FunctionDeclaration
  | PrintStatement
  | ExpressionStatement;

export type Expression =
  | StringLiteral
  | NumberLiteral
  | Identifier
  | BinaryExpression
  | CallExpression;

export interface StringLiteral {
  type: 'StringLiteral';
  value: string;
}

export interface NumberLiteral {
  type: 'NumberLiteral';
  value: number;
}

export interface Identifier {
  type: 'Identifier';
  name: string;
}

export interface BinaryExpression {
  type: 'BinaryExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface CallExpression {
  type: 'CallExpression';
  callee: string;
  arguments: Expression[];
}

export class MinimalParser {
  private tokens: Token[];
  private position: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Program {
    const statements: Statement[] = [];

    while (!this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
    }

    return {
      type: 'Program',
      body: statements
    };
  }

  private parseStatement(): Statement | null {
    // Skip newlines
    while (this.match('NEWLINE')) {}

    if (this.isAtEnd()) return null;

    // Function declaration
    if (this.check('FN')) {
      return this.parseFunctionDeclaration();
    }

    // Print statement
    if (this.check('PRINT')) {
      return this.parsePrintStatement();
    }

    // Expression statement
    return this.parseExpressionStatement();
  }

  private parseFunctionDeclaration(): FunctionDeclaration {
    this.consume('FN', 'Expected "fn"');
    
    const name = this.consume('IDENT', 'Expected function name').value;
    
    this.consume('LPAREN', 'Expected "(" after function name');
    
    // Parameters (for v0.1, we'll keep it simple - no params or just handle main())
    const params: string[] = [];
    
    if (!this.check('RPAREN')) {
      // Parse parameter
      const param = this.consume('IDENT', 'Expected parameter name').value;
      params.push(param);
      
      // For now, ignore multiple params
      while (this.match('COMMA')) {
        const extraParam = this.consume('IDENT', 'Expected parameter name').value;
        params.push(extraParam);
      }
    }
    
    this.consume('RPAREN', 'Expected ")" after parameters');
    this.consume('LBRACE', 'Expected "{" before function body');

    // Parse function body
    const body: Statement[] = [];
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) {
        body.push(stmt);
      }
    }

    this.consume('RBRACE', 'Expected "}" after function body');

    return {
      type: 'FunctionDeclaration',
      name,
      params,
      body
    };
  }

  private parsePrintStatement(): PrintStatement {
    this.consume('PRINT', 'Expected "print"');
    this.consume('LPAREN', 'Expected "(" after print');

    const argument = this.parseExpression();

    this.consume('RPAREN', 'Expected ")" after print argument');

    // Skip optional newline after statement
    this.match('NEWLINE');

    return {
      type: 'PrintStatement',
      argument
    };
  }

  private parseExpressionStatement(): ExpressionStatement {
    const expression = this.parseExpression();

    return {
      type: 'ExpressionStatement',
      expression
    };
  }

  private parseExpression(): Expression {
    return this.parseAdditive();
  }

  private parseAdditive(): Expression {
    let left = this.parsePrimary();

    while (this.match('PLUS')) {
      const operator = '+';
      const right = this.parsePrimary();
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right
      };
    }

    return left;
  }

  private parsePrimary(): Expression {
    // String literal
    if (this.match('STRING')) {
      return {
        type: 'StringLiteral',
        value: this.previous().value
      };
    }

    // Number literal
    if (this.match('NUMBER')) {
      return {
        type: 'NumberLiteral',
        value: parseInt(this.previous().value)
      };
    }

    // Identifier or function call
    if (this.match('IDENT')) {
      const name = this.previous().value;

      // Check if it's a function call
      if (this.match('LPAREN')) {
        const args: Expression[] = [];
        
        if (!this.check('RPAREN')) {
          args.push(this.parseExpression());
          while (this.match('COMMA')) {
            args.push(this.parseExpression());
          }
        }

        this.consume('RPAREN', 'Expected ")" after arguments');

        return {
          type: 'CallExpression',
          callee: name,
          arguments: args
        };
      }

      // Just an identifier
      return {
        type: 'Identifier',
        name
      };
    }

    // Keywords that can be identifiers (like main)
    if (this.check('MAIN')) {
      this.advance();
      return {
        type: 'Identifier',
        name: 'main'
      };
    }

    throw new Error(`Unexpected token: ${this.peek().type} at line ${this.peek().line}`);
  }

  // Helper methods
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.position++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private peek(): Token {
    return this.tokens[this.position];
  }

  private previous(): Token {
    return this.tokens[this.position - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new Error(`${message}. Got ${this.peek().type} at line ${this.peek().line}`);
  }
}

// Helper function
export function parse(tokens: Token[]): Program {
  const parser = new MinimalParser(tokens);
  return parser.parse();
}

// Pretty print AST (for debugging)
export function printAST(node: any, indent = 0): void {
  const prefix = '  '.repeat(indent);
  
  if (!node) {
    console.log(`${prefix}null`);
    return;
  }

  if (typeof node === 'string' || typeof node === 'number') {
    console.log(`${prefix}${node}`);
    return;
  }

  if (Array.isArray(node)) {
    console.log(`${prefix}[`);
    for (const item of node) {
      printAST(item, indent + 1);
    }
    console.log(`${prefix}]`);
    return;
  }

  console.log(`${prefix}${node.type} {`);
  
  for (const [key, value] of Object.entries(node)) {
    if (key === 'type') continue;
    console.log(`${prefix}  ${key}:`);
    printAST(value, indent + 2);
  }
  
  console.log(`${prefix}}`);
}

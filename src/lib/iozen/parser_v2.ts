// Day 3: Simple Parser
// Target: Parse tokens into AST for fn main() { print("...") }
// NO OVERENGINEERING - just what we need

import { Token, TokenType } from './tokenizer_v2';

// Week 8: Better error messages
export class ParseError extends Error {
  constructor(
    message: string,
    public line: number,
    public column: number
  ) {
    super(`${message} at line ${line}, column ${column}`);
    this.name = 'ParseError';
  }
}

// AST Node Types
export interface Program {
  type: 'Program';
  body: Statement[];
}

export interface FunctionDeclaration {
  type: 'FunctionDeclaration';
  name: string;
  params: string[];
  paramTypes?: TypeAnnotation[]; // Week 9: Optional param types
  returnType?: TypeAnnotation; // Week 9: Optional return type
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

// Week 9: Type annotations
export type TypeAnnotation = 'number' | 'string' | 'bool' | 'any' | 'void' | 'array' | 'function' | null;

export interface VariableDeclaration {
  type: 'VariableDeclaration';
  name: string;
  initializer: Expression;
  isConst: boolean;
  typeAnnotation?: TypeAnnotation; // Week 9: Optional type
}

// Week 8: Assignment statement for reassigning variables
export interface AssignmentStatement {
  type: 'AssignmentStatement';
  name: string;
  value: Expression;
}

export interface IfStatement {
  type: 'IfStatement';
  condition: Expression;
  thenBranch: Statement[];
  elseBranch: Statement[] | null;
}

export interface WhileStatement {
  type: 'WhileStatement';
  condition: Expression;
  body: Statement[];
}

export interface ForStatement {
  type: 'ForStatement';
  initializer: VariableDeclaration | ExpressionStatement | null;
  condition: Expression | null;
  increment: Expression | null;
  body: Statement[];
}

export interface BreakStatement {
  type: 'BreakStatement';
}

export interface ContinueStatement {
  type: 'ContinueStatement';
}

export interface ReturnStatement {
  type: 'ReturnStatement';
  value: Expression | null;
}

export interface ImportStatement {
  type: 'ImportStatement';
  names: string[];
  path: string;
}

export interface ExportStatement {
  type: 'ExportStatement';
  declaration: FunctionDeclaration | VariableDeclaration | ExpressionStatement;
}

export interface TryStatement {
  type: 'TryStatement';
  tryBody: Statement[];
  catchParam: string | null;
  catchBody: Statement[] | null;
  finallyBody: Statement[] | null;
}

export interface ThrowStatement {
  type: 'ThrowStatement';
  value: Expression;
}

export type Statement =
  | FunctionDeclaration
  | PrintStatement
  | ExpressionStatement
  | VariableDeclaration
  | AssignmentStatement
  | FieldAssignment
  | StructDeclaration
  | EnumDeclaration
  | IfStatement
  | WhileStatement
  | ForStatement
  | BreakStatement
  | ContinueStatement
  | ReturnStatement
  | ImportStatement
  | ExportStatement
  | TryStatement
  | ThrowStatement;

export type Expression =
  | StringLiteral
  | NumberLiteral
  | BooleanLiteral
  | Identifier
  | BinaryExpression
  | LogicalExpression
  | UnaryExpression
  | CallExpression
  | ArrayLiteral
  | StructLiteral
  | ArrayAccess
  | FieldAccess
  | MatchExpression
  | LambdaExpression;

export interface BooleanLiteral {
  type: 'BooleanLiteral';
  value: boolean;
}

export interface LogicalExpression {
  type: 'LogicalExpression';
  operator: '&&' | '||';
  left: Expression;
  right: Expression;
}

export interface UnaryExpression {
  type: 'UnaryExpression';
  operator: '-' | '!';
  operand: Expression;
}

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

export interface ArrayLiteral {
  type: 'ArrayLiteral';
  elements: Expression[];
}

export interface StructLiteral {
  type: 'StructLiteral';
  name: string;  // struct type name (e.g., "Point")
  fields: { name: string; value: Expression }[];
}

export interface ArrayAccess {
  type: 'ArrayAccess';
  array: Expression;
  index: Expression;
}

export interface FieldAccess {
  type: 'FieldAccess';
  object: Expression;
  field: string;
}

export interface FieldAssignment {
  type: 'FieldAssignment';
  object: Expression;
  field: string;
  value: Expression;
}

export interface StructDeclaration {
  type: 'StructDeclaration';
  name: string;
  fields: { name: string; typeName: string }[];
}

export interface EnumDeclaration {
  type: 'EnumDeclaration';
  name: string;
  variants: string[];
}

export interface MatchArm {
  pattern: Expression | null;   // null for wildcard (_)
  binding: string | null;       // optional binding name (e.g., n in `n when ...`)
  guard: Expression | null;     // optional when guard clause
  result: Expression;
}

export interface MatchExpression {
  type: 'MatchExpression';
  subject: Expression;
  arms: MatchArm[];
}

export interface LambdaExpression {
  type: 'LambdaExpression';
  params: string[];
  paramTypes?: TypeAnnotation[];
  body: Statement[];
  captures: string[]; // variables captured from enclosing scope
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

  private skipTerminators() {
    while (this.match('NEWLINE') || this.match('SEMICOLON')) {}
  }

  private parseStatement(): Statement | null {
    // Skip newlines and semicolons
    while (this.match('NEWLINE') || this.match('SEMICOLON')) {}

    if (this.isAtEnd()) return null;

    // Control flow
    if (this.check('IF')) {
      return this.parseIfStatement();
    }
    if (this.check('WHILE')) {
      return this.parseWhileStatement();
    }
    if (this.check('FOR')) {
      return this.parseForStatement();
    }
    if (this.check('BREAK')) {
      this.advance();
      this.match('NEWLINE');
      this.match('SEMICOLON');
      return { type: 'BreakStatement' };
    }
    if (this.check('CONTINUE')) {
      this.advance();
      this.match('NEWLINE');
      this.match('SEMICOLON');
      return { type: 'ContinueStatement' };
    }
    if (this.check('RETURN')) {
      return this.parseReturnStatement();
    }

    // Import statement
    if (this.check('IMPORT')) {
      return this.parseImportStatement();
    }

    // Export statement
    if (this.check('EXPORT')) {
      return this.parseExportStatement();
    }

    // Try-catch-finally statement
    if (this.check('TRY')) {
      return this.parseTryStatement();
    }

    // Throw statement
    if (this.check('THROW')) {
      return this.parseThrowStatement();
    }

    // Variable declaration (let or const)
    if (this.check('LET') || this.check('CONST')) {
      return this.parseVariableDeclaration();
    }

    // Assignment statement (identifier = expression)
    if (this.check('IDENT')) {
      const nextPos = this.position + 1;
      if (nextPos < this.tokens.length && this.tokens[nextPos].type === 'EQ') {
        const name = this.consume('IDENT', 'Expected variable name').value;
        this.consume('EQ', 'Expected "=" in assignment');
        const value = this.parseExpression();
        this.match('NEWLINE'); // Optional newline
        return { type: 'AssignmentStatement', name, value };
      }
      // Field assignment: expr.field = value
      // Look ahead for IDENT DOT IDENT EQ
      if (nextPos < this.tokens.length && this.tokens[nextPos].type === 'DOT') {
        const dotNext = nextPos + 1;
        if (dotNext < this.tokens.length && this.tokens[dotNext].type === 'IDENT') {
          const eqPos = dotNext + 1;
          if (eqPos < this.tokens.length && this.tokens[eqPos].type === 'EQ') {
            const objName = this.consume('IDENT', 'Expected object name').value;
            this.consume('DOT', 'Expected "."');
            const fieldName = this.consume('IDENT', 'Expected field name').value;
            this.consume('EQ', 'Expected "=" in field assignment');
            const value = this.parseExpression();
            this.match('NEWLINE');
            return {
              type: 'FieldAssignment',
              object: { type: 'Identifier', name: objName },
              field: fieldName,
              value
            };
          }
        }
      }
    }

    // Struct declaration
    if (this.check('STRUCT')) {
      return this.parseStructDeclaration();
    }

    // Enum declaration
    if (this.check('ENUM')) {
      return this.parseEnumDeclaration();
    }

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

  private parseIfStatement(): IfStatement {
    this.consume('IF', 'Expected "if"');
    this.consume('LPAREN', 'Expected "(" after "if"');
    const condition = this.parseExpression();
    this.consume('RPAREN', 'Expected ")" after condition');

    const thenBranch = this.parseBlock();

    let elseBranch: Statement[] | null = null;
    if (this.match('ELSE')) {
      if (this.check('IF')) {
        // else if → wrap nested if as single-statement else branch
        elseBranch = [this.parseIfStatement()];
      } else {
        elseBranch = this.parseBlock();
      }
    }

    return {
      type: 'IfStatement',
      condition,
      thenBranch,
      elseBranch
    };
  }

  private parseWhileStatement(): WhileStatement {
    this.consume('WHILE', 'Expected "while"');
    this.consume('LPAREN', 'Expected "(" after "while"');
    const condition = this.parseExpression();
    this.consume('RPAREN', 'Expected ")" after condition');

    const body = this.parseBlock();

    return {
      type: 'WhileStatement',
      condition,
      body
    };
  }

  private parseForStatement(): ForStatement {
    this.consume('FOR', 'Expected "for"');
    this.consume('LPAREN', 'Expected "(" after "for"');

    // Part 1: Initializer (optional)
    let initializer: VariableDeclaration | ExpressionStatement | null = null;
    if (this.check('LET') || this.check('CONST')) {
      initializer = this.parseVariableDeclaration();
    } else if (!this.check('SEMICOLON') && !this.check('RPAREN')) {
      // Expression as initializer
      const expr = this.parseExpression();
      initializer = { type: 'ExpressionStatement', expression: expr };
    }

    // Simple for with just expression: for (x) { ... }
    if (this.check('RPAREN')) {
      this.advance();
      const body = this.parseBlock();
      return {
        type: 'ForStatement',
        initializer,
        condition: null,
        increment: null,
        body
      };
    }

    // C-style for loop: for (init; cond; inc) { ... }
    // After initializer, expect semicolon
    if (this.check('SEMICOLON')) {
      this.advance(); // consume ;
    }

    // Part 2: Condition (optional)
    let condition: Expression | null = null;
    if (!this.check('SEMICOLON')) {
      condition = this.parseExpression();
    }
    this.consume('SEMICOLON', 'Expected ";" after for condition');

    // Part 3: Increment (optional)
    // Parse as statement to support assignments (e.g., i = i + 1)
    let increment: Expression | null = null;
    if (!this.check('RPAREN')) {
      // Try to parse as assignment statement, then extract the expression
      const stmt = this.parseStatement();
      if (stmt && stmt.type === 'AssignmentStatement') {
        // Wrap assignment as expression-like for the IR generator
        increment = stmt.value;
        // Store the assignment target in a way the IR generator can use
        (increment as any).__assignTarget = stmt.name;
      } else if (stmt && stmt.type === 'ExpressionStatement') {
        increment = stmt.expression;
      }
    }
    this.consume('RPAREN', 'Expected ")" after for clause');

    const body = this.parseBlock();

    return {
      type: 'ForStatement',
      initializer,
      condition,
      increment,
      body
    };
  }

  private parseReturnStatement(): ReturnStatement {
    this.consume('RETURN', 'Expected "return"');
    let value: Expression | null = null;
    if (!this.check('NEWLINE') && !this.check('RBRACE') && !this.check('SEMICOLON')) {
      value = this.parseExpression();
    }
    this.match('NEWLINE'); // Optional newline
    this.match('SEMICOLON'); // Optional semicolon
    return {
      type: 'ReturnStatement',
      value
    };
  }

  private parseImportStatement(): ImportStatement {
    this.consume('IMPORT', 'Expected "import"');
    this.consume('LBRACE', 'Expected "{" after import');

    const names: string[] = [];
    if (!this.check('RBRACE')) {
      do {
        names.push(this.consume('IDENT', 'Expected import name').value);
      } while (this.match('COMMA'));
    }

    this.consume('RBRACE', 'Expected "}" after import names');
    this.consume('FROM', 'Expected "from" after import names');

    const path = this.consume('STRING', 'Expected import path').value;

    return {
      type: 'ImportStatement',
      names,
      path
    };
  }

  private parseExportStatement(): ExportStatement {
    this.consume('EXPORT', 'Expected "export"');

    // Export can be: export fn, export let, export const
    let declaration: FunctionDeclaration | VariableDeclaration | ExpressionStatement;

    if (this.check('FN')) {
      declaration = this.parseFunctionDeclaration();
    } else if (this.check('LET') || this.check('CONST')) {
      declaration = this.parseVariableDeclaration();
    } else {
      declaration = { type: 'ExpressionStatement', expression: this.parseExpression() };
    }

    return {
      type: 'ExportStatement',
      declaration
    };
  }

  private parseTryStatement(): TryStatement {
    this.consume('TRY', 'Expected "try"');
    const tryBody = this.parseBlock();

    let catchParam: string | null = null;
    let catchBody: Statement[] | null = null;

    if (this.match('CATCH')) {
      if (this.match('LPAREN')) {
        catchParam = this.consume('IDENT', 'Expected catch parameter').value;
        this.consume('RPAREN', 'Expected ")" after catch parameter');
      }
      catchBody = this.parseBlock();
    }

    let finallyBody: Statement[] | null = null;
    if (this.match('FINALLY')) {
      finallyBody = this.parseBlock();
    }

    return {
      type: 'TryStatement',
      tryBody,
      catchParam,
      catchBody,
      finallyBody
    };
  }

  private parseThrowStatement(): ThrowStatement {
    this.consume('THROW', 'Expected "throw"');
    const value = this.parseExpression();
    return {
      type: 'ThrowStatement',
      value
    };
  }

  private parseStructDeclaration(): StructDeclaration {
    this.consume('STRUCT', 'Expected "struct"');
    const name = this.consume('IDENT', 'Expected struct name').value;
    this.consume('LBRACE', 'Expected "{" after struct name');

    const fields: { name: string; typeName: string }[] = [];
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      // Skip optional newlines
      while (this.match('NEWLINE') || this.match('SEMICOLON')) {}
      if (this.check('RBRACE') || this.isAtEnd()) break;

      const fieldName = this.consume('IDENT', 'Expected field name').value;
      this.consume('COLON', 'Expected ":" after field name');
      // Parse type annotation
      let typeName = 'any';
      if (this.check('NUMBER_TYPE')) {
        this.advance();
        typeName = 'number';
      } else if (this.check('STRING_TYPE')) {
        this.advance();
        typeName = 'string';
      } else if (this.check('BOOL_TYPE')) {
        this.advance();
        typeName = 'bool';
      } else if (this.check('IDENT')) {
        typeName = this.advance().value; // Could be a struct type name
      } else {
        throw new ParseError(`Expected type after field "${fieldName}"`, this.peek().line, this.peek().column);
      }
      fields.push({ name: fieldName, typeName });
      // Skip optional comma or newline
      this.match('COMMA');
      this.match('NEWLINE');
    }

    this.consume('RBRACE', 'Expected "}" after struct fields');
    return {
      type: 'StructDeclaration',
      name,
      fields
    };
  }

  private parseEnumDeclaration(): EnumDeclaration {
    this.consume('ENUM', 'Expected "enum"');
    const name = this.consume('IDENT', 'Expected enum name').value;
    this.consume('LBRACE', 'Expected "{" after enum name');

    const variants: string[] = [];
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      // Skip optional comma or newline
      while (this.match('COMMA') || this.match('NEWLINE') || this.match('SEMICOLON')) {}
      if (this.check('RBRACE') || this.isAtEnd()) break;

      const variant = this.consume('IDENT', 'Expected enum variant name');
      variants.push(variant.value);

      // Skip optional comma or newline after variant
      this.match('COMMA');
      this.match('NEWLINE');
      this.match('SEMICOLON');
    }

    this.consume('RBRACE', 'Expected "}" after enum variants');
    return {
      type: 'EnumDeclaration',
      name,
      variants
    };
  }

  private parseBlock(): Statement[] {
    this.consume('LBRACE', 'Expected "{"');
    const statements: Statement[] = [];

    while (!this.check('RBRACE') && !this.isAtEnd()) {
      // Skip optional statement terminators (newlines and semicolons)
      while (this.match('NEWLINE') || this.match('SEMICOLON')) {}
      if (this.check('RBRACE') || this.isAtEnd()) break;

      const stmt = this.parseStatement();
      if (stmt) statements.push(stmt);
    }

    this.consume('RBRACE', 'Expected "}"');
    return statements;
  }

  private parseVariableDeclaration(): VariableDeclaration {
    const isConst = this.check('CONST');
    this.advance(); // consume let or const

    const name = this.consume('IDENT', 'Expected variable name').value;

    // Week 9: Optional type annotation
    let typeAnnotation: TypeAnnotation = null;
    if (this.match('COLON')) {
      typeAnnotation = this.parseTypeAnnotation();
    }

    this.consume('EQ', 'Expected "=" after variable name');
    const initializer = this.parseExpression();

    // Skip optional newline
    this.match('NEWLINE');

    return {
      type: 'VariableDeclaration',
      name,
      initializer,
      isConst,
      typeAnnotation
    };
  }

  // Week 9: Parse type annotation
  private parseTypeAnnotation(): TypeAnnotation {
    if (this.check('NUMBER_TYPE')) {
      this.advance();
      return 'number';
    }
    if (this.check('STRING_TYPE')) {
      this.advance();
      return 'string';
    }
    if (this.check('BOOL_TYPE')) {
      this.advance();
      return 'bool';
    }
    if (this.check('ANY_TYPE')) {
      this.advance();
      return 'any';
    }
    if (this.check('VOID_TYPE')) {
      this.advance();
      return 'void';
    }
    // Check for array type: number[] or string[]
    if (this.check('IDENT')) {
      const typeName = this.peek().value;
      if (typeName === 'array') {
        this.advance();
        return 'array';
      }
      if (typeName === 'function') {
        this.advance();
        return 'function';
      }
    }
    throw new ParseError(`Expected type annotation`, this.peek().line, this.peek().column);
  }

  private parseFunctionDeclaration(): FunctionDeclaration {
    this.consume('FN', 'Expected "fn"');

    // Accept IDENT or MAIN as function name
    let name: string;
    if (this.check('IDENT')) {
      name = this.consume('IDENT', 'Expected function name').value;
    } else if (this.check('MAIN')) {
      this.advance();
      name = 'main';
    } else {
      throw new ParseError(`Expected function name. Got ${this.peek().type}`, this.peek().line, this.peek().column);
    }

    this.consume('LPAREN', 'Expected "(" after function name');

    // Parse parameters with optional type annotations
    const params: string[] = [];
    const paramTypes: TypeAnnotation[] = []; // Week 9: Param types
    if (!this.check('RPAREN')) {
      do {
        const param = this.consume('IDENT', 'Expected parameter name').value;
        params.push(param);

        // Week 9: Optional param type annotation
        let paramType: TypeAnnotation = null;
        if (this.match('COLON')) {
          paramType = this.parseTypeAnnotation();
        }
        paramTypes.push(paramType);
      } while (this.match('COMMA'));
    }

    this.consume('RPAREN', 'Expected ")" after parameters');

    // Week 9: Optional return type annotation
    let returnType: TypeAnnotation = null;
    if (this.match('COLON')) {
      returnType = this.parseTypeAnnotation();
    }

    this.consume('LBRACE', 'Expected "{" before function body');

    // Parse function body
    const body: Statement[] = [];
    while (!this.check('RBRACE') && !this.isAtEnd()) {
      // Skip optional statement terminators
      while (this.match('NEWLINE') || this.match('SEMICOLON')) {}
      if (this.check('RBRACE') || this.isAtEnd()) break;

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
      paramTypes,
      returnType,
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

    // Skip optional newline after expression
    this.match('NEWLINE');

    return {
      type: 'ExpressionStatement',
      expression
    };
  }

  private parseExpression(): Expression {
    return this.parseLogical();
  }

  private parseLogical(): Expression {
    let left = this.parseEquality();

    while (this.match('AMPAMP', 'PIPEPIPE')) {
      const operator = this.previous().value as '&&' | '||';
      const right = this.parseEquality();
      left = {
        type: 'LogicalExpression',
        operator,
        left,
        right
      };
    }

    return left;
  }

  private parseEquality(): Expression {
    let left = this.parseComparison();

    while (this.match('EQEQ', 'BANGEQ')) {
      const operator = this.previous().value;
      const right = this.parseComparison();
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right
      };
    }

    return left;
  }

  private parseComparison(): Expression {
    let left = this.parseTerm();

    while (this.match('LT', 'GT', 'LTEQ', 'GTEQ')) {
      const operator = this.previous().value;
      const right = this.parseTerm();
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right
      };
    }

    return left;
  }

  private parseTerm(): Expression {
    let left = this.parseFactor();

    while (this.match('PLUS', 'MINUS')) {
      const operator = this.previous().value;
      const right = this.parseFactor();
      left = {
        type: 'BinaryExpression',
        operator,
        left,
        right
      };
    }

    return left;
  }

  private parseFactor(): Expression {
    let left = this.parsePrimary();

    while (this.match('STAR', 'SLASH', 'PERCENT')) {
      const operator = this.previous().value;
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
    // Boolean literals
    if (this.match('TRUE')) {
      return { type: 'BooleanLiteral', value: true };
    }
    if (this.match('FALSE')) {
      return { type: 'BooleanLiteral', value: false };
    }

    // String literal
    if (this.match('STRING')) {
      return { type: 'StringLiteral', value: this.previous().value };
    }

    // Number literal
    if (this.match('NUMBER')) {
      return { type: 'NumberLiteral', value: parseFloat(this.previous().value) };
    }

    // Unary expressions: -x, !x
    if (this.match('MINUS', 'BANG')) {
      const operator = this.previous().value as '-' | '!';
      const operand = this.parsePrimary();
      return { type: 'UnaryExpression', operator, operand };
    }

    // Array literal: [1, 2, 3]
    if (this.match('LBRACKET')) {
      const elements: Expression[] = [];

      if (!this.check('RBRACKET')) {
        do {
          elements.push(this.parseExpression());
        } while (this.match('COMMA'));
      }

      this.consume('RBRACKET', 'Expected "]" after array elements');
      return { type: 'ArrayLiteral', elements };
    }

    // Anonymous struct literal: { name: "John", age: 30 }
    if (this.match('LBRACE')) {
      // Check if this is a struct literal (has colons) or a block
      if (this.check('IDENT') && this.peekNext('COLON')) {
        const fields: { name: string; value: Expression }[] = [];

        do {
          const fieldName = this.consume('IDENT', 'Expected field name').value;
          this.consume('COLON', 'Expected ":" after field name');
          const fieldValue = this.parseExpression();
          fields.push({ name: fieldName, value: fieldValue });
        } while (this.match('COMMA'));

        this.consume('RBRACE', 'Expected "}" after struct fields');
        return { type: 'StructLiteral', name: '', fields };
      }

      // It's a block - but we're in expression context, this is an error
      throw new ParseError('Unexpected "{" in expression context', this.peek().line, this.peek().column);
    }

    // Parenthesized expression
    if (this.match('LPAREN')) {
      const expr = this.parseExpression();
      this.consume('RPAREN', 'Expected ")" after expression');
      return expr;
    }

    // Match expression: match expr { arm => result, ... }
    if (this.check('MATCH')) {
      return this.parseMatchExpression();
    }

    // Lambda expression: fn(x, y) { body }
    if (this.check('FN') && !this.isAtStartOfStatement()) {
      return this.parseLambdaExpression();
    }

    // Function call, array access, field access, or identifier
    if (this.check('IDENT')) {
      let expr: Expression = { type: 'Identifier', name: this.advance().value };

      // Handle chaining: arr[0].field or obj.method()
      while (true) {
        if (this.match('LBRACKET')) {
          // Array access: arr[index]
          const index = this.parseExpression();
          this.consume('RBRACKET', 'Expected "]" after index');
          expr = { type: 'ArrayAccess', array: expr, index };
        } else if (this.match('LBRACE') && expr.type === 'Identifier') {
          // Named struct instantiation: Point { x: 10, y: 20 }
          if (this.check('IDENT') && this.peekNext('COLON')) {
            const fields: { name: string; value: Expression }[] = [];
            do {
              const fieldName = this.consume('IDENT', 'Expected field name').value;
              this.consume('COLON', 'Expected ":" after field name');
              const fieldValue = this.parseExpression();
              fields.push({ name: fieldName, value: fieldValue });
            } while (this.match('COMMA'));
            this.consume('RBRACE', 'Expected "}" after struct fields');
            expr = { type: 'StructLiteral', name: expr.name, fields };
          } else {
            // Not a struct literal (e.g., match x { ... }) — put back LBRACE and stop chaining
            this.position--;
            break;
          }
        } else if (this.match('DOT')) {
          // Field access: obj.field
          const fieldName = this.consume('IDENT', 'Expected field name after "."').value;

          if (this.match('LPAREN')) {
            // Method call: obj.method(args)
            const args: Expression[] = [];
            if (!this.check('RPAREN')) {
              do {
                args.push(this.parseExpression());
              } while (this.match('COMMA'));
            }
            this.consume('RPAREN', 'Expected ")" after arguments');

            // For now, method calls become regular calls with object as first arg
            // Or we could create a MethodCall expression type
            // Simpler: just create a CallExpression with special handling
            expr = {
              type: 'CallExpression',
              callee: fieldName,
              arguments: [expr, ...args]
            };
          } else {
            // Simple field access
            expr = { type: 'FieldAccess', object: expr, field: fieldName };
          }
        } else if (this.match('LPAREN')) {
          // Regular function call
          const args: Expression[] = [];
          if (!this.check('RPAREN')) {
            do {
              args.push(this.parseExpression());
            } while (this.match('COMMA'));
          }
          this.consume('RPAREN', 'Expected ")" after arguments');

          // If expr was an identifier, use its name as callee
          // Otherwise, this is a complex call expression (not supported yet)
          if (expr.type === 'Identifier') {
            expr = {
              type: 'CallExpression',
              callee: expr.name,
              arguments: args
            };
          } else {
            throw new ParseError('Complex call expressions not supported', this.peek().line, this.peek().column);
          }
        } else {
          break;
        }
      }

      return expr;
    }

    throw new ParseError(`Unexpected token: ${this.peek().type}`, this.peek().line, this.peek().column);
  }

  /** Check if current position looks like the start of a statement (not an expression) */
  private isAtStartOfStatement(): boolean {
    if (this.position === 0) return true;
    // If the previous token is a statement terminator, we're at start of statement
    const prev = this.tokens[this.position - 1];
    return prev.type === 'NEWLINE' || prev.type === 'SEMICOLON' ||
           prev.type === 'LBRACE' || prev.type === 'EOF';
  }

  private parseLambdaExpression(): LambdaExpression {
    this.consume('FN', 'Expected "fn"');
    this.consume('LPAREN', 'Expected "(" after fn');

    const params: string[] = [];
    const paramTypes: TypeAnnotation[] = [];

    if (!this.check('RPAREN')) {
      do {
        const paramName = this.consume('IDENT', 'Expected parameter name').value;
        params.push(paramName);
        // Optional type annotation
        if (this.match('COLON')) {
          paramTypes.push(this.parseTypeAnnotation());
        } else {
          paramTypes.push(null);
        }
      } while (this.match('COMMA'));
    }

    this.consume('RPAREN', 'Expected ")" after lambda parameters');

    // Optional return type
    if (this.match('COLON')) {
      this.parseTypeAnnotation(); // consume but don't store for now
    }

    const body = this.parseBlock();

    // Analyze captures: find identifiers in body that aren't params
    // Simple analysis - collect all identifiers that aren't params
    const captures = this.analyzeLambdaCaptures(body, params);

    return {
      type: 'LambdaExpression',
      params,
      paramTypes,
      body,
      captures
    };
  }

  /** Simple capture analysis - find free variables in lambda body */
  private analyzeLambdaCaptures(body: Statement[], params: string[]): string[] {
    const captures = new Set<string>();
    const paramSet = new Set(params);

    const collectFromExpr = (expr: Expression): void => {
      if (!expr) return;
      switch (expr.type) {
        case 'Identifier':
          if (!paramSet.has(expr.name)) captures.add(expr.name);
          break;
        case 'BinaryExpression':
          collectFromExpr(expr.left);
          collectFromExpr(expr.right);
          break;
        case 'LogicalExpression':
          collectFromExpr(expr.left);
          collectFromExpr(expr.right);
          break;
        case 'UnaryExpression':
          collectFromExpr(expr.operand);
          break;
        case 'CallExpression':
          expr.arguments.forEach(collectFromExpr);
          break;
        case 'ArrayLiteral':
          expr.elements.forEach(collectFromExpr);
          break;
        case 'ArrayAccess':
          collectFromExpr(expr.array);
          collectFromExpr(expr.index);
          break;
        case 'FieldAccess':
          collectFromExpr(expr.object);
          break;
        case 'MatchExpression':
          collectFromExpr(expr.subject);
          expr.arms.forEach(arm => {
            if (arm.pattern) collectFromExpr(arm.pattern);
            if (arm.guard) collectFromExpr(arm.guard);
            collectFromExpr(arm.result);
          });
          break;
      }
    };

    const collectFromStmt = (stmt: Statement): void => {
      if (!stmt) return;
      switch (stmt.type) {
        case 'VariableDeclaration':
          collectFromExpr(stmt.initializer);
          break;
        case 'AssignmentStatement':
          collectFromExpr(stmt.value);
          break;
        case 'PrintStatement':
          collectFromExpr(stmt.argument);
          break;
        case 'IfStatement':
          collectFromExpr(stmt.condition);
          stmt.thenBranch.forEach(collectFromStmt);
          if (stmt.elseBranch) stmt.elseBranch.forEach(collectFromStmt);
          break;
        case 'WhileStatement':
          collectFromExpr(stmt.condition);
          stmt.body.forEach(collectFromStmt);
          break;
        case 'ForStatement':
          if (stmt.condition) collectFromExpr(stmt.condition);
          stmt.body.forEach(collectFromStmt);
          break;
        case 'ReturnStatement':
          if (stmt.value) collectFromExpr(stmt.value);
          break;
        case 'ExpressionStatement':
          collectFromExpr(stmt.expression);
          break;
        case 'ThrowStatement':
          collectFromExpr(stmt.value);
          break;
        case 'FieldAssignment':
          collectFromExpr(stmt.object);
          collectFromExpr(stmt.value);
          break;
      }
    };

    body.forEach(collectFromStmt);
    return Array.from(captures);
  }

  private parseMatchExpression(): Expression {
    this.consume('MATCH', 'Expected "match"');
    const subject = this.parseExpression();
    this.consume('LBRACE', 'Expected "{" after match subject');

    const arms: MatchArm[] = [];

    while (!this.check('RBRACE') && !this.isAtEnd()) {
      // Skip optional newlines between arms
      while (this.match('NEWLINE') || this.match('SEMICOLON')) {}
      if (this.check('RBRACE') || this.isAtEnd()) break;

      // Parse pattern
      let pattern: Expression | null = null;
      let binding: string | null = null;

      if (this.check('IDENT') && this.peek().value === '_') {
        // Wildcard pattern: _
        this.advance(); // consume _
        pattern = null;
      } else if (this.check('NUMBER')) {
        pattern = { type: 'NumberLiteral', value: parseFloat(this.advance().value) };
      } else if (this.check('STRING')) {
        pattern = { type: 'StringLiteral', value: this.advance().value };
      } else if (this.check('TRUE')) {
        this.advance();
        pattern = { type: 'BooleanLiteral', value: true };
      } else if (this.check('FALSE')) {
        this.advance();
        pattern = { type: 'BooleanLiteral', value: false };
      } else if (this.check('IDENT')) {
        // Identifier binding: `n when n < 0 => ...`
 // Check if it's a guard pattern (IDENT followed by IDENT("when"))
        const nextPos = this.position + 1;
        if (nextPos < this.tokens.length && 
            this.tokens[nextPos].type === 'IDENT' && 
            this.tokens[nextPos].value === 'when') {
          // This is a binding with guard: `n when condition => ...`
          binding = this.advance().value; // consume the binding name
          pattern = null; // wildcard with binding
        } else {
          // Treat as wildcard with binding (matches anything)
          binding = this.advance().value;
          pattern = null;
        }
      } else {
        throw new ParseError(
          `Expected match pattern (literal, _, or identifier). Got ${this.peek().type}`,
          this.peek().line,
          this.peek().column
        );
      }

      // Parse optional guard: when condition
      let guard: Expression | null = null;
      if (this.check('IDENT') && this.peek().value === 'when') {
        this.advance(); // consume 'when'
        guard = this.parseExpression();
      }

      // Consume =>
      this.consume('ARROW', 'Expected "=>" in match arm');

      // Parse result expression
      const result = this.parseExpression();
      arms.push({ pattern, binding, guard, result });

      // Skip optional comma between arms
      this.match('COMMA');
      // Skip optional newlines
      while (this.match('NEWLINE') || this.match('SEMICOLON')) {}
    }

    this.consume('RBRACE', 'Expected "}" to close match expression');

    return { type: 'MatchExpression', subject, arms };
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

  private peekNext(expectedType: TokenType): boolean {
    const nextPos = this.position + 1;
    if (nextPos >= this.tokens.length) return false;
    return this.tokens[nextPos].type === expectedType;
  }

  private previous(): Token {
    return this.tokens[this.position - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new ParseError(`${message}. Got ${this.peek().type}`, this.peek().line, this.peek().column);
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

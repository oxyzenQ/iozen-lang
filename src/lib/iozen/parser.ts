// ============================================================
// IOZEN Language — Parser (Recursive Descent)
// Converts token stream into Abstract Syntax Tree (AST)
// ============================================================

import type {
    ASTNode,
    AttachExprNode,
    BinaryExprNode,
    BlockNode,
    CheckCaseNode,
    CheckNode,
    CompoundAssignNode,
    ContinueNode,
    DestructureNode,
    EnumCaseNode,
    EnumDeclNode,
    ExitNode,
    FieldNode,
    ForceUnwrapNode,
    ForEachNode,
    FunctionCallExprNode,
    FunctionCallStmtNode,
    FunctionDeclNode,
    FunctionParamNode,
    HasValueNode,
    IdentifierNode,
    ImportNode,
    IncreaseNode,
    LabelNode,
    LambdaNode,
    ListCompNode,
    ListLiteralNode,
    LiteralNode,
    MapLiteralNode,
    MatchCaseNode,
    MatchNode,
    MemberAccessNode,
    ModuleDeclNode,
    PipelineExprNode,
    PrintStmtNode,
    ProgramNode,
    RepeatNode,
    ReturnStmtNode,
    SafeAccessNode,
    SetFieldNode,
    StructureDeclNode,
    TernaryExprNode,
    ThrowNode,
    TryCatchNode,
    TypeAliasNode,
    UnaryExprNode,
    UnionDeclNode,
    ValueInsideNode,
    VariableDeclNode,
    WhenBranchNode,
    WhenNode,
    WhileNode
} from './ast';
import { Token, TokenType } from './tokens';

export class ParseError extends Error {
  constructor(message: string, public token: Token) {
    super(message);
    this.name = 'ParseError';
  }
}

export class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    // Filter out newlines and comments — IOZEN uses newlines as statement terminators
    this.tokens = tokens.filter(
      t => t.type !== TokenType.Newline && t.type !== TokenType.Comment
    );
  }

  public parse(): ASTNode {
    const statements: ASTNode[] = [];

    while (!this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
    }

    return { kind: 'Program', statements } as ProgramNode;
  }

  /** Parse a single expression (used by string interpolation) */
  public parseSingle(): ASTNode {
    return this.parseExpression();
  }

  // ---- Statement Parsing ----

  private parseStatement(): ASTNode | null {
    this.skipNewlines();

    if (this.isAtEnd()) return null;

    const token = this.peek();

    switch (token.type) {
      case TokenType.Import:
        return this.parseImport();
      case TokenType.Create:
        return this.parseVariableDecl();
      case TokenType.Constant:
        return this.parseVariableDecl(true);
      case TokenType.Function:
        return this.parseFunctionDecl();
      case TokenType.Define:
        return this.parseDefineDecl();
      case TokenType.Print:
        return this.parsePrint();
      case TokenType.Return:
        return this.parseReturn();
      case TokenType.When:
        return this.parseWhen();
      case TokenType.Check:
        return this.parseCheck();
      case TokenType.Repeat:
        return this.parseRepeat();
      case TokenType.While:
        return this.parseWhile();
      case TokenType.For:
        return this.parseForEach();
      case TokenType.Label:
        return this.parseLabel();
      case TokenType.Exit:
        return this.parseExit();
      case TokenType.Continue:
        return this.parseContinue();
      case TokenType.Match:
        return this.parseMatch();
      case TokenType.Try:
        return this.parseTryCatch();
      case TokenType.Throw:
        return this.parseThrow();
      case TokenType.Increase:
        return this.parseIncrease();
      case TokenType.Decrease:
        return this.parseDecrease();
      case TokenType.Set:
        return this.parseSetField();
      case TokenType.Unsafe:
        return this.parseUnsafeBlock();
      case TokenType.Module:
        return this.parseModule();
      default:
        // Try to parse as expression statement (function call)
        return this.parseExpressionStatement();
    }
  }

  private parseImport(): ASTNode {
    this.consume(TokenType.Import, 'Expected "import"');

    // import "path" — string literal as module path
    if (this.check(TokenType.StringLiteral)) {
      const path = this.advance().value;
      return {
        kind: 'Import',
        modulePath: path,
        importNames: [],
      } as ImportNode;
    }

    // import <name1>, <name2> from <module_path>
    const importNames: string[] = [];

    // Check for "import X, Y from module" pattern
    if (this.check(TokenType.Identifier) && this.peekAt(1).type === TokenType.Comma) {
      // Multiple names before "from"
      while (true) {
        importNames.push(this.consumeName('Expected import name').value);
        if (!this.match(TokenType.Comma)) break;
      }
      this.consume(TokenType.From, 'Expected "from"');
    } else if (this.check(TokenType.Identifier) && this.peekAt(1).type === TokenType.From) {
      // Single name before "from"
      importNames.push(this.consumeName('Expected import name').value);
      this.consume(TokenType.From, 'Expected "from"');
    }

    // Module path: identifier(.identifier)*
    const parts: string[] = [this.consumeName('Expected module name').value];
    while (this.match(TokenType.Dot)) {
      parts.push(this.consumeName('Expected module name').value);
    }

    return {
      kind: 'Import',
      modulePath: parts.join('/'),
      importNames,
    } as ImportNode;
  }

  private parseVariableDecl(isConstant: boolean = false): ASTNode {
    if (isConstant) {
      this.consume(TokenType.Constant, 'Expected "constant"');
    } else {
      this.consume(TokenType.Create, 'Expected "create"');
      // Handle "create constant variable X" or "create constant X" syntax
      if (this.check(TokenType.Constant)) {
        this.advance(); // consume "constant"
        isConstant = true;
      }
    }

    // variable <name> [, <name2>, <name3>, ...]   (destructuring)
    // For "create constant X", "variable" keyword is optional
    if (isConstant && this.check(TokenType.Identifier)) {
      // "create constant X" — skip "variable" keyword
    } else {
      this.consume(TokenType.Variable, 'Expected "variable"');
    }
    const firstName = this.consumeName('Expected variable name').value;

    // Check for destructuring: multiple names separated by commas
    // e.g., create variable a, b, c as list with value [1, 2, 3]
    const names: string[] = [firstName];
    if (this.check(TokenType.Comma)) {
      while (this.match(TokenType.Comma)) {
        const nextName = this.consumeName('Expected variable name after comma').value;
        names.push(nextName);
      }
    }

    // as <type>
    const qualifiers: string[] = [];
    let typeName = 'unknown';

    if (this.match(TokenType.As)) {
      // Check for qualifiers before type
      while (this.isTypeQualifier() && !this.isTypeKeyword()) {
        qualifiers.push(this.advance().value.toLowerCase());
      }

      // Check for generic: Box of integer
      typeName = this.parseTypeName();

      // Check for "of type T" (generic param)
      if (this.match(TokenType.Of) && this.match(TokenType.Type)) {
        // Generic type parameter — consume but we'll handle it as part of typeName
        const param = this.consume(TokenType.Identifier, 'Expected type parameter').value;
        typeName += `<${param}>`;
      }
    }

    // with value <expr>
    let value: ASTNode | null = null;
    if (this.match(TokenType.With)) {
      if (this.check(TokenType.Value)) {
        this.consume(TokenType.Value, 'Expected "value"');
        value = this.parseExpression();
      } else {
        // Structure field initialization: with x = 0 and y = 0
        // Pattern: Identifier "=" expr ("and" Identifier "=" expr)*
        if (this.check(TokenType.Identifier) && this.peekAt(1).type === TokenType.Assign) {
          value = this.parseFieldInit();
        } else {
          // Otherwise treat as a value expression
          value = this.parseExpression();
        }
      }
    } else if (!isConstant) {
      // Variables can be declared without value (default to nothing/zero)
    } else {
      // Constants MUST have an initial value
      throw new ParseError('Constant must have an initial value (use "with value ...")', this.peek());
    }

    // Destructuring: if multiple names, wrap as DestructureNode
    if (names.length > 1 && value) {
      return { kind: 'Destructure', names, value } as DestructureNode;
    }

    // Phase 14.1: Capture location from first token
    const start = this.tokens[this.pos - 1];

    return {
      kind: 'VariableDecl',
      name: firstName,
      names: [],
      typeName,
      qualifiers,
      value,
      isConstant,
      location: start ? { line: start.line, column: start.column } : undefined,
    } as VariableDeclNode;
  }

  private parseTypeName(): string {
    const parts: string[] = [];

    // First part: type keyword or identifier
    if (this.isTypeKeyword()) {
      parts.push(this.advance().value.toLowerCase());
    } else if (this.peek().type === TokenType.Identifier) {
      parts.push(this.advance().value);
    } else {
      parts.push('unknown');
    }

    // Handle composed types like "pointer to integer", "list of integer"
    while (true) {
      if (this.match(TokenType.To) || this.match(TokenType.Of)) {
        if (this.isTypeKeyword()) {
          parts.push(this.advance().value.toLowerCase());
        } else if (this.peek().type === TokenType.Identifier) {
          parts.push(this.advance().value);
        }
      } else if (this.match(TokenType.Pointer)) {
        parts.push('pointer');
        if (this.match(TokenType.To)) {
          if (this.isTypeKeyword()) {
            parts.push(this.advance().value.toLowerCase());
          } else if (this.peek().type === TokenType.Identifier) {
            parts.push(this.advance().value);
          }
        }
      } else {
        break;
      }
    }

    return parts.join(' ');
  }

  private parseFunctionDecl(): ASTNode {
    this.consume(TokenType.Function, 'Expected "function"');
    const name = this.consumeName('Expected function name').value;

    // Parameters: with param1 as type, param2 as type
    // OR: (param1, param2, ...)
    const parameters: FunctionParamNode[] = [];
    if (this.match(TokenType.With)) {
      // "with" style: with param1 as type and param2 as type
      // Parse parameters
      while (true) {
        const qualifiers: string[] = [];

        // Check for qualifiers
        while (this.isTypeQualifier() && this.peek().type !== TokenType.As) {
          qualifiers.push(this.advance().value.toLowerCase());
        }

        if (this.peek().type !== TokenType.Identifier && !this.isTypeKeyword()) break;

        const paramName = this.consumeName('Expected parameter name').value;
        this.consume(TokenType.As, 'Expected "as" after parameter name');
        const paramType = this.parseTypeName();
        parameters.push({ name: paramName, typeName: paramType, qualifiers });

        // More parameters? (comma or "and" separator)
        if (this.match(TokenType.Comma)) continue;
        if (this.check(TokenType.And)) {
          this.advance(); // consume "and"
          continue;
        }
        break;
      }
    } else if (this.match(TokenType.LeftParen)) {
      // Parenthesized style: function name(param1, param2, ...)
      while (!this.check(TokenType.RightParen) && !this.isAtEnd()) {
        const qualifiers: string[] = [];
        if (this.peek().type !== TokenType.Identifier && !this.isTypeKeyword()) break;

        const paramName = this.consumeName('Expected parameter name').value;
        parameters.push({ name: paramName, typeName: 'auto', qualifiers });

        if (!this.match(TokenType.Comma)) break;
      }
      this.consume(TokenType.RightParen, 'Expected ")"');
    }

    // Returns <type>
    let returnType = 'nothing';
    const returnQualifiers: string[] = [];
    if (this.match(TokenType.Returns)) {
      while (this.isTypeQualifier() && !this.isTypeKeyword()) {
        returnQualifiers.push(this.advance().value.toLowerCase());
      }
      returnType = this.parseTypeName();
    }

    // Body
    const body: ASTNode[] = [];
    while (!this.check(TokenType.End) && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }
    this.consume(TokenType.End, 'Expected "end" to close function');

    return {
      kind: 'FunctionDecl',
      name,
      parameters,
      returnType,
      returnQualifiers,
      body,
    } as FunctionDeclNode;
  }

  private parseDefineDecl(): ASTNode {
    const next = this.peekAt(1);
    const nextNext = this.peekAt(2);

    if (next.type === TokenType.Structure) {
      return this.parseStructureDecl();
    } else if (next.type === TokenType.Enum) {
      return this.parseEnumDecl();
    } else if (next.type === TokenType.Union) {
      return this.parseUnionDecl();
    } else if (next.type === TokenType.Type) {
      return this.parseTypeAlias();
    }

    throw new ParseError('Expected "structure", "enum", "union", or "type" after "define"', this.peek());
  }

  private parseStructureDecl(): ASTNode {
    this.consume(TokenType.Define, 'Expected "define"');
    this.consume(TokenType.Structure, 'Expected "structure"');
    const name = this.consume(TokenType.Identifier, 'Expected structure name').value;

    // Generic type parameters: "of type T"
    const typeParams: string[] = [];
    if (this.match(TokenType.Of) && this.match(TokenType.Type)) {
      typeParams.push(this.consume(TokenType.Identifier, 'Expected type parameter').value);
    }

    // Fields
    const fields: FieldNode[] = [];
    while (this.check(TokenType.Field) && !this.isAtEnd()) {
      this.consume(TokenType.Field, 'Expected "field"');
      const fieldName = this.consume(TokenType.Identifier, 'Expected field name').value;
      this.consume(TokenType.As, 'Expected "as" after field name');
      const fieldType = this.parseTypeName();
      fields.push({ name: fieldName, typeName: fieldType });
    }

    this.consume(TokenType.End, 'Expected "end" to close structure');

    return { kind: 'StructureDecl', name, fields, typeParams } as StructureDeclNode;
  }

  private parseEnumDecl(): ASTNode {
    this.consume(TokenType.Define, 'Expected "define"');
    this.consume(TokenType.Enum, 'Expected "enum"');
    const name = this.consume(TokenType.Identifier, 'Expected enum name').value;

    const cases: EnumCaseNode[] = [];
    while (this.check(TokenType.Case) && !this.isAtEnd()) {
      this.consume(TokenType.Case, 'Expected "case"');
      const caseName = this.consume(TokenType.Identifier, 'Expected case name').value;

      const fields: { name: string; typeName: string }[] = [];
      if (this.match(TokenType.With)) {
        // case fields: "value as integer"
        while (true) {
          const f = this.consume(TokenType.Identifier, 'Expected field name').value;
          this.consume(TokenType.As, 'Expected "as"');
          const t = this.parseTypeName();
          fields.push({ name: f, typeName: t });
          if (!this.match(TokenType.Comma)) break;
        }
      }

      cases.push({ name: caseName, fields });
    }

    this.consume(TokenType.End, 'Expected "end" to close enum');

    return { kind: 'EnumDecl', name, cases } as EnumDeclNode;
  }

  private parsePrint(): ASTNode {
    this.consume(TokenType.Print, 'Expected "print"');
    const expressions: ASTNode[] = [this.parseExpression()];

    // Support "attach" chains for multi-part print
    while (this.check(TokenType.Attach)) {
      this.advance();
      expressions.push(this.parseExpression());
    }

    return { kind: 'PrintStmt', expressions } as PrintStmtNode;
  }

  private parseReturn(): ASTNode {
    this.consume(TokenType.Return, 'Expected "return"');
    let value: ASTNode | null = null;

    if (!this.check(TokenType.End) && !this.check(TokenType.Otherwise) && !this.isAtEnd()) {
      value = this.parseExpression();
    }

    return { kind: 'ReturnStmt', value } as ReturnStmtNode;
  }

  private parseWhen(): ASTNode {
    this.consume(TokenType.When, 'Expected "when"');
    // parseExpression handles the full condition including comparisons
    // (e.g., "n is less than or equal to 1" is handled by parseComparison)
    const condition = this.parseExpression();
    this.consume(TokenType.Do, 'Expected "do" after when condition');

    const branches: WhenBranchNode[] = [{
      kind: 'WhenBranch',
      condition,
      body: this.parseBlockBody(),
    }];

    // "otherwise when" chains
    while (this.check(TokenType.Otherwise)) {
      this.advance();
      if (this.check(TokenType.When)) {
        this.advance();
        const cond = this.parseExpression();
        this.consume(TokenType.Do, 'Expected "do"');
        branches.push({
          kind: 'WhenBranch',
          condition: cond,
          body: this.parseBlockBody(),
        });
      } else {
        // "otherwise do"
        this.consume(TokenType.Do, 'Expected "do"');
        const otherwiseBody = this.parseBlockBody();
        this.consume(TokenType.End, 'Expected "end"');
        return { kind: 'When', branches, otherwise: otherwiseBody } as WhenNode;
      }
    }

    this.consume(TokenType.End, 'Expected "end"');
    return { kind: 'When', branches, otherwise: null } as WhenNode;
  }

  private parseCheck(): ASTNode {
    this.consume(TokenType.Check, 'Expected "check"');
    this.consume(TokenType.Value, 'Expected "value"');
    this.consume(TokenType.Of, 'Expected "of"');
    const target = this.parseExpression();

    const cases: CheckCaseNode[] = [];

    while (this.check(TokenType.Case)) {
      this.consume(TokenType.Case, 'Expected "case"');
      const name = this.consume(TokenType.Identifier, 'Expected case name').value;

      let binding: string | null = null;
      if (this.match(TokenType.With)) {
        binding = this.consume(TokenType.Identifier, 'Expected binding name').value;
      }

      this.consume(TokenType.Do, 'Expected "do"');
      const body = this.parseBlockBody();
      cases.push({ name, binding, body });
    }

    this.consume(TokenType.End, 'Expected "end"');
    return { kind: 'Check', target, cases } as CheckNode;
  }

  private parseRepeat(): ASTNode {
    this.consume(TokenType.Repeat, 'Expected "repeat"');
    const count = this.parseExpression();
    this.consume(TokenType.Times, 'Expected "times"');
    this.consume(TokenType.Do, 'Expected "do"');

    let label: string | null = null;
    const body = this.parseBlockBody();

    this.consume(TokenType.End, 'Expected "end"');
    return { kind: 'Repeat', count, label, body } as RepeatNode;
  }

  private parseWhile(): ASTNode {
    this.consume(TokenType.While, 'Expected "while"');
    const condition = this.parseExpression();
    this.consume(TokenType.Do, 'Expected "do"');
    const body = this.parseBlockBody();
    this.consume(TokenType.End, 'Expected "end"');
    return { kind: 'While', condition, body } as WhileNode;
  }

  private parseForEach(): ASTNode {
    this.consume(TokenType.For, 'Expected "for"');
    this.consume(TokenType.Each, 'Expected "each"');
    const variable = this.consume(TokenType.Identifier, 'Expected variable name').value;

    // Check for indexed for-each: for each item, index in items
    let indexVariable: string | null = null;
    if (this.match(TokenType.Comma)) {
      indexVariable = this.consume(TokenType.Identifier, 'Expected index variable name').value;
    }

    this.consume(TokenType.In, 'Expected "in"');
    const iterable = this.parseExpression();
    this.consume(TokenType.Do, 'Expected "do"');
    const body = this.parseBlockBody();
    this.consume(TokenType.End, 'Expected "end"');
    return { kind: 'ForEach', variable, indexVariable, iterable, body } as ForEachNode;
  }

  private parseLabel(): ASTNode {
    this.consume(TokenType.Label, 'Expected "label"');
    const name = this.consume(TokenType.Identifier, 'Expected label name').value;
    return { kind: 'Label', name } as LabelNode;
  }

  private parseExit(): ASTNode {
    this.consume(TokenType.Exit, 'Expected "exit"');
    let target: string | null = null;
    if (this.peek().type === TokenType.Identifier) {
      target = this.advance().value;
    }
    return { kind: 'Exit', target } as ExitNode;
  }

  private parseContinue(): ASTNode {
    this.consume(TokenType.Continue, 'Expected "continue"');
    return { kind: 'Continue' } as ContinueNode;
  }

  private parseMatch(): ASTNode {
    this.consume(TokenType.Match, 'Expected "match"');
    const subject = this.parseExpression();

    const cases: MatchCaseNode[] = [];
    let otherwise: ASTNode[] | null = null;

    while (this.check(TokenType.Case) || this.check(TokenType.Otherwise)) {
      if (this.check(TokenType.Case)) {
        this.advance(); // consume 'case'

        // Parse pattern: literal, identifier (catch-all), or _ (wildcard)
        let pattern: ASTNode;
        let binding: string | null = null;

        const tok = this.peek();
        if (tok.type === TokenType.Identifier && tok.value === '_') {
          this.advance();
          pattern = { kind: 'Literal', type: 'null', value: null } as LiteralNode;
        } else if (this.isLiteralToken(tok)) {
          pattern = this.parsePrimary();
        } else {
          // Catch-all binding: case x do ...
          binding = tok.value;
          pattern = { kind: 'Identifier', name: tok.value } as IdentifierNode;
          this.advance();
        }

        this.consume(TokenType.Do, 'Expected "do" after match case');
        const body: ASTNode[] = [];
        while (!this.check(TokenType.End) && !this.check(TokenType.Case) && !this.check(TokenType.Otherwise) && !this.isAtEnd()) {
          const stmt = this.parseStatement();
          if (stmt) body.push(stmt);
        }
        this.consume(TokenType.End, 'Expected "end" to close match case');

        cases.push({ kind: 'MatchCase', pattern, binding, body } as MatchCaseNode);
      } else if (this.check(TokenType.Otherwise)) {
        this.advance(); // consume 'otherwise'
        this.consume(TokenType.Do, 'Expected "do" after otherwise');
        otherwise = [];
        while (!this.check(TokenType.End) && !this.isAtEnd()) {
          const stmt = this.parseStatement();
          if (stmt) otherwise.push(stmt);
        }
        this.consume(TokenType.End, 'Expected "end" to close otherwise');
      }
    }

    // consume final 'end' for the match block
    if (this.check(TokenType.End)) {
      this.advance();
    }

    return { kind: 'Match', subject, cases, otherwise } as MatchNode;
  }

  private parseTryCatch(): ASTNode {
    this.consume(TokenType.Try, 'Expected "try"');
    this.consume(TokenType.Do, 'Expected "do" after try');

    const tryBody: ASTNode[] = [];
    while (!this.check(TokenType.End) && !this.check(TokenType.Catch) && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) tryBody.push(stmt);
    }
    // consume optional "end" before "catch" (both styles supported)
    if (this.check(TokenType.End)) {
      this.advance();
    }

    this.consume(TokenType.Catch, 'Expected "catch"');
    let catchBinding: string | null = null;
    if (this.peek().type === TokenType.Identifier) {
      catchBinding = this.advance().value;
    }
    this.consume(TokenType.Do, 'Expected "do" after catch');

    const catchBody: ASTNode[] = [];
    while (!this.check(TokenType.End) && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) catchBody.push(stmt);
    }
    this.consume(TokenType.End, 'Expected "end" to close catch block');

    return { kind: 'TryCatch', tryBody, catchBinding, catchBody } as TryCatchNode;
  }

  private parseThrow(): ASTNode {
    this.consume(TokenType.Throw, 'Expected "throw"');
    let value: ASTNode | null = null;
    // Parse the thrown value if it's an expression (not a statement keyword)
    if (!this.isAtEnd() && !this.check(TokenType.End) && !this.check(TokenType.Newline)) {
      const tok = this.peek();
      // Only parse if it looks like an expression, not a statement keyword
      if (tok.type === TokenType.Identifier || tok.type === TokenType.IntegerLiteral ||
          tok.type === TokenType.FloatLiteral || tok.type === TokenType.StringLiteral ||
          tok.type === TokenType.BooleanLiteral || tok.type === TokenType.NothingLiteral ||
          tok.type === TokenType.Minus || tok.type === TokenType.Not ||
          tok.type === TokenType.LeftParen || tok.type === TokenType.LeftBracket) {
        value = this.parseExpression();
      }
    }
    return { kind: 'Throw', value } as ThrowNode;
  }

  private isLiteralToken(tok: Token): boolean {
    return tok.type === TokenType.IntegerLiteral ||
           tok.type === TokenType.FloatLiteral ||
           tok.type === TokenType.StringLiteral ||
           tok.type === TokenType.CharLiteral ||
           tok.type === TokenType.BooleanLiteral ||
           tok.type === TokenType.NothingLiteral;
  }

  private parseIncrease(): ASTNode {
    this.consume(TokenType.Increase, 'Expected "increase"');
    const target = this.parseExpression();
    this.consume(TokenType.By, 'Expected "by"');
    const amount = this.parseExpression();
    return { kind: 'Increase', target, amount } as IncreaseNode;
  }

  private parseDecrease(): ASTNode {
    this.consume(TokenType.Decrease, 'Expected "decrease"');
    const target = this.parseExpression();
    this.consume(TokenType.By, 'Expected "by"');
    const amount = this.parseExpression();
    // Decrease is just increase with negated amount
    return {
      kind: 'Increase',
      target,
      amount: { kind: 'UnaryExpr', operator: '-', operand: amount } as UnaryExprNode,
    } as IncreaseNode;
  }

  private parseSetField(): ASTNode {
    this.consume(TokenType.Set, 'Expected "set"');
    const targetName = this.consumeName('Expected target name').value;

    const fieldPath: string[] = [];
    let current: string | null = targetName;

    while (this.match(TokenType.Dot)) {
      fieldPath.push(current!);
      current = this.consumeName('Expected field name').value;
    }
    if (current) fieldPath.push(current);

    this.consume(TokenType.To, 'Expected "to"');
    const value = this.parseExpression();

    // Simple variable assignment: "set x to value" (no dot notation)
    if (fieldPath.length === 1) {
      return {
        kind: 'AssignVar',
        name: fieldPath[0],
        value,
      } as AssignVarNode;
    }

    const target = { kind: 'Identifier', name: fieldPath[0] } as IdentifierNode;

    return { kind: 'SetField', target, fieldPath, value } as SetFieldNode;
  }

  private parseUnsafeBlock(): ASTNode {
    this.consume(TokenType.Unsafe, 'Expected "unsafe"');
    this.consume(TokenType.Block, 'Expected "block"');

    const statements: ASTNode[] = [];
    while (!this.check(TokenType.End) && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) statements.push(stmt);
    }
    this.consume(TokenType.End, 'Expected "end" to close unsafe block');

    return { kind: 'Block', statements } as BlockNode;
  }

  private parseModule(): ASTNode {
    this.consume(TokenType.Module, 'Expected "module"');
    const name = this.consume(TokenType.Identifier, 'Expected module name').value;

    // Parse exposed names: expose name1, name2, ...
    const exposedNames: string[] = [];
    if (this.check(TokenType.Expose)) {
      this.advance(); // consume "expose"
      while (true) {
        exposedNames.push(this.consume(TokenType.Identifier, 'Expected exposed name').value);
        if (!this.match(TokenType.Comma)) break;
      }
    }

    // Module body: statements until "end"
    const body: ASTNode[] = [];
    while (!this.check(TokenType.End) && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }
    this.consume(TokenType.End, 'Expected "end" to close module');

    return { kind: 'ModuleDecl', name, exposedNames, body } as ModuleDeclNode;
  }

  private parseUnionDecl(): ASTNode {
    this.consume(TokenType.Define, 'Expected "define"');
    this.consume(TokenType.Union, 'Expected "union"');
    const name = this.consume(TokenType.Identifier, 'Expected union name').value;

    const variants: { name: string; typeName: string }[] = [];
    while (this.check(TokenType.Case) && !this.isAtEnd()) {
      this.consume(TokenType.Case, 'Expected "case"');
      const variantName = this.consume(TokenType.Identifier, 'Expected variant name').value;
      let typeName = 'nothing';
      if (this.match(TokenType.As)) {
        typeName = this.parseTypeName();
      }
      variants.push({ name: variantName, typeName });
    }

    this.consume(TokenType.End, 'Expected "end" to close union');
    return { kind: 'UnionDecl', name, variants } as UnionDeclNode;
  }

  private parseTypeAlias(): ASTNode {
    this.consume(TokenType.Define, 'Expected "define"');
    this.consume(TokenType.Type, 'Expected "type"');
    const name = this.consume(TokenType.Identifier, 'Expected type alias name').value;
    this.consume(TokenType.As, 'Expected "as"');
    const targetType = this.parseTypeName();
    this.consume(TokenType.End, 'Expected "end" to close type alias');
    return { kind: 'TypeAlias', name, targetType } as TypeAliasNode;
  }

  private parseExpressionStatement(): ASTNode | null {
    // Check for compound assignment: identifier += expr, etc.
    if (this.peek().type === TokenType.Identifier && !this.isAtEnd()) {
      const nextTok = this.peekAt(1);
      if (nextTok && (
        nextTok.type === TokenType.PlusAssign ||
        nextTok.type === TokenType.MinusAssign ||
        nextTok.type === TokenType.StarAssign ||
        nextTok.type === TokenType.SlashAssign ||
        nextTok.type === TokenType.PercentAssign
      )) {
        const name = this.advance().value;
        const opTok = this.advance();
        const value = this.parseExpression();
        return { kind: 'CompoundAssign', name, operator: opTok.value, value } as CompoundAssignNode;
      }
    }

    // Could be a function call statement
    const expr = this.parseExpression();

    // If it's a function call expression, make it a statement
    if (expr.kind === 'FunctionCallExpr') {
      const fce = expr as FunctionCallExprNode;
      return {
        kind: 'FunctionCallStmt',
        name: fce.name,
        arguments: fce.arguments,
      } as FunctionCallStmtNode;
    }

    // If it's a bare identifier at statement position, treat as zero-arg function call
    // This allows: `my_function` as a shorthand for `my_function with nothing`
    if (expr.kind === 'Identifier') {
      const id = expr as IdentifierNode;
      return {
        kind: 'FunctionCallStmt',
        name: id.name,
        arguments: [],
      } as FunctionCallStmtNode;
    }

    return expr;
  }

  private parseBlockBody(): ASTNode[] {
    const statements: ASTNode[] = [];
    while (
      !this.check(TokenType.End) &&
      !this.check(TokenType.Otherwise) &&
      !this.check(TokenType.Case) &&
      !this.isAtEnd()
    ) {
      const stmt = this.parseStatement();
      if (stmt) statements.push(stmt);
    }
    return statements;
  }

  // ---- Expression Parsing (Precedence Climbing) ----

  private parseExpression(): ASTNode {
    return this.parsePipeline();
  }

  // Pipeline: a |> f(b) |> g(c) → g(f(a, b), c)
  private parsePipeline(): ASTNode {
    let left = this.parseAttach();

    if (this.check(TokenType.Pipe)) {
      const stages: ASTNode[] = [left];
      while (this.check(TokenType.Pipe)) {
        this.advance();
        const stage = this.parseAttach();
        stages.push(stage);
      }
      return { kind: 'PipelineExpr', stages } as PipelineExprNode;
    }

    return left;
  }

  private parseAttach(): ASTNode {
    let left = this.parseOr();

    while (this.check(TokenType.Attach)) {
      this.advance();
      const right = this.parseOr();
      left = { kind: 'AttachExpr', parts: [left, right] } as AttachExprNode;
    }

    return left;
  }

  private parseOr(): ASTNode {
    let left = this.parseAnd();

    while (this.check(TokenType.Or)) {
      this.advance();
      const right = this.parseAnd();
      left = { kind: 'BinaryExpr', left, operator: 'or', right, location: { line: (left as any).location?.line ?? 1, column: (left as any).location?.column ?? 1 } } as BinaryExprNode;
    }

    return left;
  }

  private parseAnd(): ASTNode {
    let left = this.parseComparison();

    while (this.check(TokenType.And)) {
      this.advance();
      const right = this.parseComparison();
      left = { kind: 'BinaryExpr', left, operator: 'and', right, location: { line: (left as any).location?.line ?? 1, column: (left as any).location?.column ?? 1 } } as BinaryExprNode;
    }

    return left;
  }

  private parseComparison(): ASTNode {
    let left = this.parseAdditive();
    let matched = false;

    const compOps = [
      TokenType.Equals, TokenType.NotEquals,
      TokenType.LessThan, TokenType.GreaterThan,
      TokenType.LessOrEqual, TokenType.GreaterOrEqual,
    ];

    // Symbol comparison operators: ==, !=, <, >, <=, >=
    if (compOps.includes(this.peek().type)) {
      const op = this.parseComparisonOp();
      const right = this.parseAdditive();
      left = { kind: 'BinaryExpr', left, operator: op, right, location: { line: (left as any).location?.line ?? 1, column: (left as any).location?.column ?? 1 } } as BinaryExprNode;
      matched = true;
    }

    // "is" keyword for comparisons: x is greater than 5, x equals 10
    if (!matched && this.check(TokenType.Is)) {
      this.advance();
      const op = this.parseComparisonOp();
      const right = this.parseAdditive();
      left = { kind: 'BinaryExpr', left, operator: op, right, location: { line: (left as any).location?.line ?? 1, column: (left as any).location?.column ?? 1 } } as BinaryExprNode;
      matched = true;
    }

    // NL comparison keywords without preceding "is": x equals 10, x greater than 5
    if (!matched && (this.check(TokenType.Equal) || this.check(TokenType.Greater) || this.check(TokenType.Less))) {
      const op = this.parseComparisonOp();
      const right = this.parseAdditive();
      left = { kind: 'BinaryExpr', left, operator: op, right, location: { line: (left as any).location?.line ?? 1, column: (left as any).location?.column ?? 1 } } as BinaryExprNode;
      matched = true;
    }

    // "inside" keyword for membership: x inside [1, 2, 3]
    if (!matched && this.check(TokenType.Inside)) {
      this.advance();
      const right = this.parseAdditive();
      left = { kind: 'BinaryExpr', left, operator: 'inside', right, location: { line: (left as any).location?.line ?? 1, column: (left as any).location?.column ?? 1 } } as BinaryExprNode;
      matched = true;
    }

    return left;
  }

  private parseComparisonOp(): string {
    const token = this.peek();

    // Symbol operators (highest priority)
    if (token.type === TokenType.Equals) { this.advance(); return '=='; }
    if (token.type === TokenType.NotEquals) { this.advance(); return '!='; }
    if (token.type === TokenType.LessThan) { this.advance(); return '<'; }
    if (token.type === TokenType.GreaterThan) { this.advance(); return '>'; }
    if (token.type === TokenType.LessOrEqual) { this.advance(); return '<='; }
    if (token.type === TokenType.GreaterOrEqual) { this.advance(); return '>='; }

    // Natural language operators (tokenized as keywords: Greater, Less, Equal, Not)
    if (token.type === TokenType.Greater) {
      this.advance();
      if (this.check(TokenType.Than)) this.advance();
      // Check for "or equal to"
      if (this.check(TokenType.Or)) {
        this.advance();
        if (this.check(TokenType.Equal) || (this.check(TokenType.Identifier) && this.peek().value.toLowerCase() === 'equal')) this.advance();
        if (this.check(TokenType.To)) this.advance();
        return '>=';
      }
      return '>';
    }
    if (token.type === TokenType.Less) {
      this.advance();
      if (this.check(TokenType.Than)) this.advance();
      if (this.check(TokenType.Or)) {
        this.advance();
        if (this.check(TokenType.Equal) || (this.check(TokenType.Identifier) && this.peek().value.toLowerCase() === 'equal')) this.advance();
        if (this.check(TokenType.To)) this.advance();
        return '<=';
      }
      return '<';
    }
    if (token.type === TokenType.Equal) {
      this.advance();
      if (this.check(TokenType.To)) this.advance();
      return '==';
    }
    if (token.type === TokenType.Not) {
      this.advance();
      if (this.check(TokenType.Equal) || (this.check(TokenType.Identifier) && this.peek().value.toLowerCase() === 'equal')) this.advance();
      if (this.check(TokenType.To)) this.advance();
      return '!=';
    }

    // Identifier-based NL operators ("equals", "greater", "less", "not", "equal")
    if (token.type === TokenType.Identifier) {
      const word = token.value.toLowerCase();
      if (word === 'greater') {
        this.advance();
        if (this.check(TokenType.Than)) this.advance();
        if (this.check(TokenType.Or)) {
          this.advance();
          if (this.check(TokenType.Equal) || (this.check(TokenType.Identifier) && this.peek().value.toLowerCase() === 'equal')) this.advance();
          if (this.check(TokenType.To)) this.advance();
          return '>=';
        }
        return '>';
      }
      if (word === 'less') {
        this.advance();
        if (this.check(TokenType.Than)) this.advance();
        if (this.check(TokenType.Or)) {
          this.advance();
          if (this.check(TokenType.Equal) || (this.check(TokenType.Identifier) && this.peek().value.toLowerCase() === 'equal')) this.advance();
          if (this.check(TokenType.To)) this.advance();
          return '<=';
        }
        return '<';
      }
      if (word === 'equals' || word === 'equal') {
        this.advance();
        if (this.check(TokenType.To)) this.advance();
        return '==';
      }
      if (word === 'not') {
        this.advance();
        if (this.check(TokenType.Equal) || (this.check(TokenType.Identifier) && this.peek().value.toLowerCase() === 'equal')) this.advance();
        if (this.check(TokenType.To)) this.advance();
        return '!=';
      }
    }

    throw new ParseError(`Expected comparison operator, got ${token.value}`, token);
  }

  private parseAdditive(): ASTNode {
    let left = this.parseMultiplicative();

    while (this.check(TokenType.Plus) || this.check(TokenType.Minus)) {
      const op = this.advance().value;
      const right = this.parseMultiplicative();
      left = { kind: 'BinaryExpr', left, operator: op, right, location: { line: (left as any).location?.line ?? 1, column: (left as any).location?.column ?? 1 } } as BinaryExprNode;
    }

    return left;
  }

  private parseMultiplicative(): ASTNode {
    let left = this.parseUnary();

    while (this.check(TokenType.Star) || this.check(TokenType.Slash) || this.check(TokenType.Percent)) {
      const op = this.advance().value;
      const right = this.parseUnary();
      left = { kind: 'BinaryExpr', left, operator: op, right, location: { line: (left as any).location?.line ?? 1, column: (left as any).location?.column ?? 1 } } as BinaryExprNode;
    }

    return left;
  }

  private parseUnary(): ASTNode {
    if (this.check(TokenType.Minus) || this.check(TokenType.Not) || this.check(TokenType.Borrow)) {
      const op = this.advance().value;
      const operand = this.parseUnary();
      return { kind: 'UnaryExpr', operator: op, operand } as UnaryExprNode;
    }

    return this.parsePostfix();
  }

  private parsePostfix(): ASTNode {
    let expr = this.parsePrimary();

    while (true) {
      // Function call: expr(args)
      if (this.check(TokenType.LeftParen)) {
        this.advance();
        const args = this.parseArgumentList();
        this.consume(TokenType.RightParen, 'Expected ")"');

        if (expr.kind === 'Identifier') {
          expr = { kind: 'FunctionCallExpr', name: (expr as IdentifierNode).name, arguments: args } as FunctionCallExprNode;
        } else {
          expr = { kind: 'FunctionCallExpr', name: '__call__', arguments: [expr, ...args] } as FunctionCallExprNode;
        }
        continue;
      }

      // Function call with "with": expr with arg1 and arg2
      if (this.check(TokenType.With) && expr.kind === 'Identifier') {
        this.advance(); // consume "with"
        const args: ASTNode[] = [];
        // Parse first argument (use parseOr to avoid consuming "and" separators)
        args.push(this.parseOr());
        // Parse additional arguments separated by "and"
        while (this.check(TokenType.And)) {
          this.advance(); // consume "and"
          args.push(this.parseOr());
        }
        expr = { kind: 'FunctionCallExpr', name: (expr as IdentifierNode).name, arguments: args } as FunctionCallExprNode;
        continue;
      }

      // Member access: expr.field
      if (this.check(TokenType.Dot)) {
        this.advance();
        const field = this.consume(TokenType.Identifier, 'Expected field name').value;
        expr = { kind: 'MemberAccess', object: expr, field } as MemberAccessNode;
        continue;
      }

      // Safe member access: expr?.field
      if (this.check(TokenType.OptionalDot)) {
        this.advance();
        const field = this.consume(TokenType.Identifier, 'Expected field name').value;
        expr = { kind: 'SafeAccess', object: expr, field } as SafeAccessNode;
        continue;
      }

      // Index access: expr[index]
      if (this.check(TokenType.LeftBracket)) {
        this.advance();
        const index = this.parseExpression();
        this.consume(TokenType.RightBracket, 'Expected "]"');
        expr = { kind: 'IndexAccess', object: expr, index } as IndexAccessNode;
        continue;
      }

      // "has value" check (for Optional)
      if (this.check(TokenType.Has) && this.peekAt(1).type === TokenType.Value) {
        this.advance(); // has
        this.advance(); // value
        expr = { kind: 'HasValue', expression: expr } as HasValueNode;
        continue;
      }

      break;
    }

    return expr;
  }

  // Ternary expression (only callable from parenthesized context): expr when condition otherwise default
  private parseTernary(): ASTNode {
    let expr = this.parsePipeline();
    if (this.check(TokenType.When)) {
      this.advance();
      const condition = this.parsePipeline();
      this.consume(TokenType.Otherwise, 'Expected "otherwise" in ternary expression');
      const elseExpr = this.parseTernary(); // right-associative
      return { kind: 'TernaryExpr', condition, thenExpr: expr, elseExpr } as TernaryExprNode;
    }
    return expr;
  }

  private parsePrimary(): ASTNode {
    const token = this.peek();

    // Match expression (can be used as expression in certain contexts)
    if (token.type === TokenType.Match) {
      return this.parseMatch();
    }

    // Integer literal
    if (token.type === TokenType.IntegerLiteral) {
      this.advance();
      return { kind: 'Literal', type: 'integer', value: parseInt(token.value, 10) } as LiteralNode;
    }

    // Float literal
    if (token.type === TokenType.FloatLiteral) {
      this.advance();
      return { kind: 'Literal', type: 'float', value: parseFloat(token.value) } as LiteralNode;
    }

    // String literal
    if (token.type === TokenType.StringLiteral) {
      this.advance();
      return { kind: 'Literal', type: 'text', value: token.value } as LiteralNode;
    }

    // Character literal
    if (token.type === TokenType.CharLiteral) {
      this.advance();
      return { kind: 'Literal', type: 'character', value: token.value } as LiteralNode;
    }

    // Boolean literal
    if (token.type === TokenType.BooleanLiteral) {
      this.advance();
      return { kind: 'Literal', type: 'boolean', value: token.value.toLowerCase() === 'true' } as LiteralNode;
    }

    // Nothing literal
    if (token.type === TokenType.Nothing) {
      this.advance();
      return { kind: 'Literal', type: 'nothing', value: null } as LiteralNode;
    }

    // List literal: [1, 2, 3] or list comprehension: [expr for each var in iterable]
    if (token.type === TokenType.LeftBracket) {
      return this.parseListLiteral();
    }

    // Map literal: {key: value, ...}
    if (token.type === TokenType.LeftBrace) {
      return this.parseMapLiteral();
    }

    // Parenthesized expression (also enables ternary: (expr when cond otherwise default))
    if (token.type === TokenType.LeftParen) {
      this.advance();
      const expr = this.parseTernary();
      this.consume(TokenType.RightParen, 'Expected ")"');
      return expr;
    }

    // "force" keyword for unwrap
    if (token.type === TokenType.Expose) {
      this.advance();
      const expr = this.parseExpression();
      return { kind: 'ForceUnwrap', expression: expr } as ForceUnwrapNode;
    }

    // "size of" expression
    if (token.type === TokenType.Value && this.peekAt(1)?.type === TokenType.Inside) {
      this.advance(); // value
      this.advance(); // inside
      const expr = this.parsePostfix();
      return { kind: 'FunctionCallExpr', name: '__size__', arguments: [expr] } as FunctionCallExprNode;
    }

    // "value inside" expression
    if (token.type === TokenType.Value && this.peekAt(1)?.type === TokenType.Inside) {
      this.advance(); // value
      this.advance(); // inside
      const expr = this.parsePostfix();
      return { kind: 'ValueInside', expression: expr } as ValueInsideNode;
    }

    // Lambda: function with x as type returns type ... end
    if (token.type === TokenType.Function) {
      const next = this.peekAt(1);
      if (next.type === TokenType.With || next.type === TokenType.LeftParen) {
        return this.parseLambda();
      }
    }

    // Identifier (could be variable or function name)
    // Also allow type keywords to be used as identifiers (e.g., variable named "result")
    if (token.type === TokenType.Identifier || this.isTypeKeyword() || this.isLogicalKeyword()) {
      this.advance();

      // Check for function call style: name "with" args (IOZEN natural language calls)
      if (this.check(TokenType.With) || this.check(TokenType.To)) {
        return this.parseNaturalCall(token.value);
      }

      return { kind: 'Identifier', name: token.value } as IdentifierNode;
    }

    // "largest value in" / "smallest value in" — built-in functions
    if (token.type === TokenType.Print) {
      // "print" used as expression (unusual but possible)
      this.advance();
      const expr = this.parseExpression();
      return { kind: 'FunctionCallExpr', name: '__print__', arguments: [expr] } as FunctionCallExprNode;
    }

    throw new ParseError(`Unexpected token: ${token.value} (${token.type})`, token);
  }

  private parseLambda(): ASTNode {
    this.consume(TokenType.Function, 'Expected "function"');

    const parameters: FunctionParamNode[] = [];
    if (this.match(TokenType.With)) {
      // "with" style: with param1 as type and param2 as type
      while (true) {
        const qualifiers: string[] = [];
        while (this.isTypeQualifier() && this.peek().type !== TokenType.As) {
          qualifiers.push(this.advance().value.toLowerCase());
        }
        if (this.peek().type !== TokenType.Identifier && !this.isTypeKeyword()) break;

        const paramName = this.consumeName('Expected parameter name').value;
        this.consume(TokenType.As, 'Expected "as" after parameter name');
        const paramType = this.parseTypeName();
        parameters.push({ name: paramName, typeName: paramType, qualifiers });

        if (this.match(TokenType.Comma)) continue;
        if (this.check(TokenType.And)) {
          this.advance();
          continue;
        }
        break;
      }
    } else if (this.match(TokenType.LeftParen)) {
      while (!this.check(TokenType.RightParen) && !this.isAtEnd()) {
        const qualifiers: string[] = [];
        if (this.peek().type !== TokenType.Identifier && !this.isTypeKeyword()) break;
        const paramName = this.consumeName('Expected parameter name').value;
        parameters.push({ name: paramName, typeName: 'auto', qualifiers });
        if (!this.match(TokenType.Comma)) break;
      }
      this.consume(TokenType.RightParen, 'Expected ")"');
    }

    // Returns <type>
    let returnType = 'nothing';
    const returnQualifiers: string[] = [];
    if (this.match(TokenType.Returns)) {
      while (this.isTypeQualifier() && !this.isTypeKeyword()) {
        returnQualifiers.push(this.advance().value.toLowerCase());
      }
      returnType = this.parseTypeName();
    }

    // Body
    const body: ASTNode[] = [];
    while (!this.check(TokenType.End) && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }
    this.consume(TokenType.End, 'Expected "end" to close lambda');

    return {
      kind: 'Lambda',
      parameters,
      returnType,
      returnQualifiers,
      body,
    } as LambdaNode;
  }

  private parseNaturalCall(name: string): ASTNode {
    const args: ASTNode[] = [];

    // First argument must start with "with", "to", or "from"
    if (!this.check(TokenType.With) && !this.check(TokenType.To) && !this.check(TokenType.From)) {
      return { kind: 'Identifier', name } as IdentifierNode;
    }

    while (this.check(TokenType.With) || this.check(TokenType.To) || this.check(TokenType.From)) {
      this.advance(); // consume with/to/from
      const arg = this.parseAdditive();
      args.push(arg);

      // After each arg, check for more: "with", "to", "from", or "and"
      while (this.check(TokenType.And)) {
        this.advance(); // consume "and"

        // "and with ..." — named arg continues
        if (this.check(TokenType.With) || this.check(TokenType.To) || this.check(TokenType.From)) {
          break; // let outer while handle it
        }

        // "and 5" — bare argument
        const nextArg = this.parseAdditive();
        args.push(nextArg);
      }
    }

    return { kind: 'FunctionCallExpr', name, arguments: args } as FunctionCallExprNode;
  }

  private parseListLiteral(): ASTNode {
    this.consume(TokenType.LeftBracket, 'Expected "["');

    // Check for empty list
    if (this.check(TokenType.RightBracket)) {
      this.advance();
      return { kind: 'ListLiteral', elements: [] } as ListLiteralNode;
    }

    // Parse first expression
    const firstExpr = this.parseExpression();

    // Check for list comprehension: [expr for each x in list]
    if (this.check(TokenType.For)) {
      this.advance(); // consume 'for'
      this.consume(TokenType.Each, 'Expected "each" in list comprehension');
      const variable = this.consume(TokenType.Identifier, 'Expected variable name').value;
      this.consume(TokenType.In, 'Expected "in"');
      const iterable = this.parseExpression();
      this.consume(TokenType.RightBracket, 'Expected "]"');
      return { kind: 'ListComp', expression: firstExpr, variable, iterable } as ListCompNode;
    }

    // Normal list literal
    const elements: ASTNode[] = [firstExpr];
    while (this.match(TokenType.Comma)) {
      elements.push(this.parseExpression());
    }

    this.consume(TokenType.RightBracket, 'Expected "]"');
    return { kind: 'ListLiteral', elements } as ListLiteralNode;
  }

  private parseMapLiteral(): ASTNode {
    this.consume(TokenType.LeftBrace, 'Expected "{"');

    const entries: { key: ASTNode; value: ASTNode }[] = [];

    if (!this.check(TokenType.RightBrace)) {
      // Parse first entry: expression : expression
      const key = this.parseExpression();
      this.consume(TokenType.Colon, 'Expected ":" in map literal');
      const value = this.parseExpression();
      entries.push({ key, value });

      while (this.match(TokenType.Comma)) {
        if (this.check(TokenType.RightBrace)) break; // trailing comma
        const k = this.parseExpression();
        this.consume(TokenType.Colon, 'Expected ":" in map literal');
        const v = this.parseExpression();
        entries.push({ key: k, value: v });
      }
    }

    this.consume(TokenType.RightBrace, 'Expected "}"');
    return { kind: 'MapLiteral', entries } as MapLiteralNode;
  }

  private parseArgumentList(): ASTNode[] {
    const args: ASTNode[] = [];

    if (!this.check(TokenType.RightParen)) {
      args.push(this.parseExpression());
      while (this.match(TokenType.Comma)) {
        args.push(this.parseExpression());
      }
    }

    return args;
  }

  private parseFieldInit(): ASTNode {
    // Field-style initialization: with x = 0 and y = 0
    // Produces: FunctionCallExpr name='__struct_init__', args=[fieldName, value, ...]
    const parts: ASTNode[] = [];

    while (true) {
      const fieldName = this.consumeName('Expected field name').value;
      this.consume(TokenType.Assign, 'Expected "=" in field initialization');
      const fieldValue = this.parseAdditive();

      parts.push({ kind: 'Literal', type: 'text', value: fieldName } as LiteralNode);
      parts.push(fieldValue);

      if (!this.match(TokenType.And)) break;
    }

    return { kind: 'FunctionCallExpr', name: '__struct_init__', arguments: parts } as FunctionCallExprNode;
  }

  // ---- Helpers ----

  private consumeName(message: string): Token {
    const t = this.peek();
    if (t.type === TokenType.Identifier || this.isTypeKeyword() || this.isLogicalKeyword() ||
        t.type === TokenType.Label || t.type === TokenType.Case ||
        t.type === TokenType.Match || t.type === TokenType.Catch ||
        t.type === TokenType.Throw || t.type === TokenType.Exit ||
        t.type === TokenType.Module || t.type === TokenType.Expose ||
        t.type === TokenType.Start || t.type === TokenType.Wait ||
        t.type === TokenType.Send || t.type === TokenType.Receive) {
      return this.advance();
    }
    throw new ParseError(message, t);
  }

  private isTypeKeyword(): boolean {
    return [
      TokenType.Integer, TokenType.Float, TokenType.Boolean,
      TokenType.Character, TokenType.Text, TokenType.Pointer,
      TokenType.Address, TokenType.Nothing, TokenType.List,
      TokenType.Optional, TokenType.Result, TokenType.Map,
    ].includes(this.peek().type);
  }

  private isLogicalKeyword(): boolean {
    return [
      TokenType.And, TokenType.Or, TokenType.Not,
    ].includes(this.peek().type);
  }

  private isTypeQualifier(): boolean {
    return [
      TokenType.Mutable, TokenType.Immutable, TokenType.Owned,
      TokenType.Borrowed, TokenType.Reference, TokenType.Atomic,
    ].includes(this.peek().type);
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private peekAt(offset: number): Token {
    const idx = this.pos + offset;
    return idx < this.tokens.length ? this.tokens[idx] : this.tokens[this.tokens.length - 1];
  }

  private advance(): Token {
    if (this.isAtEnd()) return this.peek();
    return this.tokens[this.pos++];
  }

  private check(type: TokenType): boolean {
    return !this.isAtEnd() && this.peek().type === type;
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new ParseError(message, this.peek());
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private skipNewlines(): void {
    // Newlines already filtered out in constructor
  }
}

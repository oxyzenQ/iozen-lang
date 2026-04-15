// Day 2: Minimal Tokenizer
// Target: Recognize basic tokens for IOZEN v0.1
// NO OVERENGINEERING - just what we need for fastfetch

export type TokenType =
  | 'FN'           // fn
  | 'MAIN'         // main
  | 'PRINT'        // print
  | 'LET'          // let
  | 'CONST'        // const
  | 'IF'           // if
  | 'ELSE'         // else
  | 'WHILE'        // while
  | 'FOR'          // for
  | 'BREAK'        // break
  | 'CONTINUE'     // continue
  | 'RETURN'       // return
  | 'IMPORT'       // import
  | 'EXPORT'       // export
  | 'TRY'          // try
  | 'CATCH'        // catch
  | 'FINALLY'      // finally
  | 'THROW'        // throw
  | 'FROM'         // from
  | 'IDENT'        // identifier
  | 'STRING'       // "..."
  | 'NUMBER'       // 123
  | 'LPAREN'       // (
  | 'RPAREN'       // )
  | 'LBRACE'       // {
  | 'RBRACE'       // }
  | 'LBRACKET'     // [
  | 'RBRACKET'     // ]
  | 'DOT'          // .
  | 'COLON'        // :
  | 'ARROW'        // =>
  | 'PLUS'         // +
  | 'MINUS'        // -
  | 'STAR'         // *
  | 'SLASH'        // /
  | 'PERCENT'      // %
  | 'EQ'           // =
  | 'EQEQ'         // ==
  | 'BANGEQ'       // !=
  | 'LT'           // <
  | 'GT'           // >
  | 'LTEQ'         // <=
  | 'GTEQ'         // >=
  | 'COMMA'        // ,
  | 'SEMICOLON'    // ;
  | 'NEWLINE'      // \n
  | 'EOF'          // end of file
  | 'COMMENT'      // // ...
  | 'SKIP'         // whitespace
  // Week 9: Type tokens
  | 'NUMBER_TYPE'  // number
  | 'STRING_TYPE'  // string
  | 'BOOL_TYPE'    // bool
  | 'ANY_TYPE'     // any
  | 'VOID_TYPE'    // void
  | 'MATCH'        // match
  | 'AMPAMP'       // &&
  | 'PIPEPIPE'     // ||
  | 'TRUE'         // true
  | 'FALSE'        // false
  | 'BANG'         // !
  | 'STRUCT';      // struct

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

// Keywords
const KEYWORDS: Record<string, TokenType> = {
  'fn': 'FN',
  'main': 'MAIN',
  'print': 'PRINT',
  'let': 'LET',
  'const': 'CONST',
  'if': 'IF',
  'else': 'ELSE',
  'while': 'WHILE',
  'for': 'FOR',
  'break': 'BREAK',
  'continue': 'CONTINUE',
  'return': 'RETURN',
  'import': 'IMPORT',
  'export': 'EXPORT',
  'try': 'TRY',
  'catch': 'CATCH',
  'finally': 'FINALLY',
  'throw': 'THROW',
  'from': 'FROM',
  // Week 9: Type keywords
  'number': 'NUMBER_TYPE',
  'string': 'STRING_TYPE',
  'bool': 'BOOL_TYPE',
  'any': 'ANY_TYPE',
  'void': 'VOID_TYPE',
  'match': 'MATCH',
  'true': 'TRUE',
  'false': 'FALSE',
  'struct': 'STRUCT',
};

export class MinimalTokenizer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (!this.isAtEnd()) {
      const token = this.nextToken();
      if (token && token.type !== 'SKIP' && token.type !== 'COMMENT') {
        tokens.push(token);
      }
    }

    tokens.push({ type: 'EOF', value: '', line: this.line, column: this.column });
    return tokens;
  }

  private nextToken(): Token | null {
    this.skipWhitespace();

    if (this.isAtEnd()) return null;

    const startLine = this.line;
    const startCol = this.column;
    const char = this.peek();

    // Comments (both // and # styles)
    if (char === '/' && this.peekNext() === '/') {
      return this.comment(startLine, startCol);
    }
    if (char === '#') {
      return this.comment(startLine, startCol);
    }

    // String literals
    if (char === '"') {
      return this.string(startLine, startCol);
    }

    // Numbers
    if (this.isDigit(char)) {
      return this.number(startLine, startCol);
    }

    // Identifiers / Keywords
    if (this.isAlpha(char)) {
      return this.identifier(startLine, startCol);
    }

    // Two-character operators
    if (char === '&' && this.peekNext() === '&') {
      this.advance(); this.advance();
      return { type: 'AMPAMP', value: '&&', line: startLine, column: startCol };
    }
    if (char === '|' && this.peekNext() === '|') {
      this.advance(); this.advance();
      return { type: 'PIPEPIPE', value: '||', line: startLine, column: startCol };
    }
    if (char === '=' && this.peekNext() === '=') {
      this.advance(); this.advance();
      return { type: 'EQEQ', value: '==', line: startLine, column: startCol };
    }
    if (char === '=' && this.peekNext() === '>') {
      this.advance(); this.advance();
      return { type: 'ARROW', value: '=>', line: startLine, column: startCol };
    }
    if (char === '!' && this.peekNext() === '=') {
      this.advance(); this.advance();
      return { type: 'BANGEQ', value: '!=', line: startLine, column: startCol };
    }
    if (char === '<' && this.peekNext() === '=') {
      this.advance(); this.advance();
      return { type: 'LTEQ', value: '<=', line: startLine, column: startCol };
    }
    if (char === '>' && this.peekNext() === '=') {
      this.advance(); this.advance();
      return { type: 'GTEQ', value: '>=', line: startLine, column: startCol };
    }

    // Single-character tokens
    switch (char) {
      case '(': this.advance(); return { type: 'LPAREN', value: '(', line: startLine, column: startCol };
      case ')': this.advance(); return { type: 'RPAREN', value: ')', line: startLine, column: startCol };
      case '{': this.advance(); return { type: 'LBRACE', value: '{', line: startLine, column: startCol };
      case '}': this.advance(); return { type: 'RBRACE', value: '}', line: startLine, column: startCol };
      case '[': this.advance(); return { type: 'LBRACKET', value: '[', line: startLine, column: startCol };
      case ']': this.advance(); return { type: 'RBRACKET', value: ']', line: startLine, column: startCol };
      case '.': this.advance(); return { type: 'DOT', value: '.', line: startLine, column: startCol };
      case ':': this.advance(); return { type: 'COLON', value: ':', line: startLine, column: startCol };
      case '+': this.advance(); return { type: 'PLUS', value: '+', line: startLine, column: startCol };
      case '-': this.advance(); return { type: 'MINUS', value: '-', line: startLine, column: startCol };
      case '*': this.advance(); return { type: 'STAR', value: '*', line: startLine, column: startCol };
      case '/': this.advance(); return { type: 'SLASH', value: '/', line: startLine, column: startCol };
      case '%': this.advance(); return { type: 'PERCENT', value: '%', line: startLine, column: startCol };
      case '=': this.advance(); return { type: 'EQ', value: '=', line: startLine, column: startCol };
      case '<': this.advance(); return { type: 'LT', value: '<', line: startLine, column: startCol };
      case '>': this.advance(); return { type: 'GT', value: '>', line: startLine, column: startCol };
      case ',': this.advance(); return { type: 'COMMA', value: ',', line: startLine, column: startCol };
      case ';': this.advance(); return { type: 'SEMICOLON', value: ';', line: startLine, column: startCol };
      case '!': this.advance(); return { type: 'BANG', value: '!', line: startLine, column: startCol };
      case '=': this.advance(); return { type: 'EQ', value: '=', line: startLine, column: startCol };
      case '\n':
        this.advance();
        this.line++;
        this.column = 1;
        return { type: 'NEWLINE', value: '\n', line: startLine, column: startCol };
    }

    // Unknown character - skip
    this.advance();
    return { type: 'SKIP', value: char, line: startLine, column: startCol };
  }

  private string(line: number, col: number): Token {
    let value = '';
    this.advance(); // consume opening "
    while (!this.isAtEnd() && this.peek() !== '"') {
      if (this.peek() === '\\') {
        this.advance(); // consume backslash
        const next = this.advance();
        switch (next) {
          case 'n': value += '\n'; break;
          case 't': value += '\t'; break;
          case '"': value += '"'; break;
          case '\\': value += '\\'; break;
          default: value += '\\' + next; break;
        }
      } else {
        value += this.advance();
      }
    }
    if (this.isAtEnd()) {
      throw new Error(`Unterminated string at line ${line}, col ${col}`);
    }
    this.advance(); // consume closing "
    return { type: 'STRING', value, line, column: col };
  }

  private number(line: number, col: number): Token {
    let value = '';
    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      value += this.advance();
    }
    // Handle decimal point
    if (!this.isAtEnd() && this.peek() === '.' && this.isDigit(this.peekNext())) {
      value += this.advance(); // consume '.'
      while (!this.isAtEnd() && this.isDigit(this.peek())) {
        value += this.advance();
      }
    }
    return { type: 'NUMBER', value, line, column: col };
  }

  private identifier(line: number, col: number): Token {
    let value = '';

    while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
      value += this.advance();
    }

    const type = KEYWORDS[value] || 'IDENT';
    return { type, value, line, column: col };
  }

  private comment(line: number, col: number): Token {
    let value = '';

    // Skip the comment marker(s)
    if (this.peek() === '/') {
      // Skip //
      this.advance();
      this.advance();
    } else if (this.peek() === '#') {
      // Skip #
      this.advance();
    }

    while (!this.isAtEnd() && this.peek() !== '\n') {
      value += this.advance();
    }

    return { type: 'COMMENT', value, line, column: col };
  }

  private skipWhitespace(): void {
    while (!this.isAtEnd()) {
      const char = this.peek();
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
      } else {
        break;
      }
    }
  }

  private isAtEnd(): boolean {
    return this.position >= this.source.length;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source[this.position];
  }

  private peekNext(): string {
    if (this.position + 1 >= this.source.length) return '\0';
    return this.source[this.position + 1];
  }

  private advance(): string {
    const char = this.source[this.position];
    this.position++;
    this.column++;
    return char;
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_';
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}

// Helper function
export function tokenize(source: string): Token[] {
  const tokenizer = new MinimalTokenizer(source);
  return tokenizer.tokenize();
}

// Pretty print tokens (for debugging)
export function printTokens(tokens: Token[]): void {
  console.log('Tokens:');
  for (const token of tokens) {
    if (token.type === 'EOF') {
      console.log(`  ${token.type.padEnd(10)}`);
    } else {
      console.log(`  ${token.type.padEnd(10)} "${token.value}" (line ${token.line})`);
    }
  }
}

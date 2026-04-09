// ============================================================
// IOZEN Language — Lexer (Tokenizer)
// Converts IOZEN source code into a stream of tokens
// ============================================================

import { Token, TokenType, KEYWORDS, SYMBOLS } from './tokens';

export class Lexer {
  private source: string;
  private tokens: Token[] = [];
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(source: string) {
    this.source = source;
  }

  public tokenize(): Token[] {
    while (this.pos < this.source.length) {
      this.skipWhitespace();

      if (this.pos >= this.source.length) break;

      const ch = this.source[this.pos];

      // Line comments: # to end of line
      if (ch === '#' && (this.tokens.length === 0 || this.tokens[this.tokens.length - 1].type !== TokenType.Hash)) {
        this.readComment();
        continue;
      }

      // Newlines
      if (ch === '\n') {
        this.tokens.push(this.makeToken(TokenType.Newline, '\n'));
        this.advance();
        this.line++;
        this.column = 1;
        continue;
      }

      // Carriage return
      if (ch === '\r') {
        this.advance();
        continue;
      }

      // Multiline string literal: """..."""
      if (ch === '"' && this.source[this.pos + 1] === '"' && this.source[this.pos + 2] === '"') {
        this.readMultilineString();
        continue;
      }

      // String literal
      if (ch === '"') {
        this.readString();
        continue;
      }

      // Character literal
      if (ch === "'" && this.peekNext() !== undefined) {
        this.readChar();
        continue;
      }

      // Numbers
      if (this.isDigit(ch) || (ch === '0' && this.peekNext()?.toLowerCase() === 'x')) {
        this.readNumber();
        continue;
      }

      // Multi-char symbols first (to avoid consuming prefix)
      if (this.tryReadMultiCharSymbol()) continue;

      // Single-char symbols
      if (SYMBOLS[ch] !== undefined && ch !== '#') {
        this.tokens.push(this.makeToken(SYMBOLS[ch], ch));
        this.advance();
        continue;
      }

      // Identifiers and keywords
      if (this.isAlpha(ch) || ch === '_') {
        this.readIdentifier();
        continue;
      }

      // Unknown character — skip
      this.advance();
    }

    this.tokens.push(this.makeToken(TokenType.EOF, ''));
    return this.tokens;
  }

  private skipWhitespace(): void {
    while (this.pos < this.source.length) {
      const ch = this.source[this.pos];
      if (ch === ' ' || ch === '\t') {
        this.advance();
      } else {
        break;
      }
    }
  }

  private readComment(): void {
    const startCol = this.column;
    while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
      this.advance();
    }
    // We don't store comments in the token stream (they're ignored)
    // But we could: this.tokens.push(this.makeToken(TokenType.Comment, comment));
  }

  private readMultilineString(): void {
    this.advance(); this.advance(); this.advance(); // skip opening """
    let value = '';

    while (this.pos < this.source.length) {
      // Check for closing """
      if (this.source[this.pos] === '"' &&
          this.source[this.pos + 1] === '"' &&
          this.source[this.pos + 2] === '"') {
        this.advance(); this.advance(); this.advance(); // skip closing """
        break;
      }

      if (this.source[this.pos] === '\\') {
        this.advance();
        if (this.pos >= this.source.length) break;
        const escaped = this.source[this.pos];
        switch (escaped) {
          case 'n': value += '\n'; break;
          case 't': value += '\t'; break;
          case 'r': value += '\r'; break;
          case '\\': value += '\\'; break;
          case '"': value += '"'; break;
          default: value += escaped; break;
        }
        this.advance();
      } else {
        if (this.source[this.pos] === '\n') {
          this.line++;
          this.column = 1;
          value += '\n';
        } else {
          value += this.source[this.pos];
        }
        this.advance();
      }
    }

    this.tokens.push(this.makeToken(TokenType.StringLiteral, value));
  }

  private readString(): void {
    this.advance(); // skip opening "
    let value = '';

    while (this.pos < this.source.length && this.source[this.pos] !== '"') {
      if (this.source[this.pos] === '\\') {
        this.advance(); // skip backslash
        if (this.pos >= this.source.length) break;
        const escaped = this.source[this.pos];
        switch (escaped) {
          case 'n': value += '\n'; break;
          case 't': value += '\t'; break;
          case 'r': value += '\r'; break;
          case '\\': value += '\\'; break;
          case '"': value += '"'; break;
          default: value += escaped; break;
        }
        this.advance();
      } else {
        value += this.source[this.pos];
        this.advance();
      }
    }

    if (this.pos < this.source.length) {
      this.advance(); // skip closing "
    }

    this.tokens.push(this.makeToken(TokenType.StringLiteral, value));
  }

  private readChar(): void {
    this.advance(); // skip opening '
    let value = '';

    if (this.pos < this.source.length) {
      if (this.source[this.pos] === '\\') {
        this.advance();
        if (this.pos < this.source.length) {
          const escaped = this.source[this.pos];
          switch (escaped) {
            case 'n': value = '\n'; break;
            case 't': value = '\t'; break;
            case 'r': value = '\r'; break;
            case '\\': value = '\\'; break;
            case "'": value = "'"; break;
            default: value = escaped; break;
          }
          this.advance();
        }
      } else {
        value = this.source[this.pos];
        this.advance();
      }
    }

    if (this.pos < this.source.length && this.source[this.pos] === "'") {
      this.advance(); // skip closing '
    }

    this.tokens.push(this.makeToken(TokenType.CharLiteral, value));
  }

  private readNumber(): void {
    let numStr = '';

    // Hex literal: 0x...
    if (this.source[this.pos] === '0' && this.peekNext()?.toLowerCase() === 'x') {
      numStr += this.source[this.pos]; this.advance();
      numStr += this.source[this.pos]; this.advance();

      while (this.pos < this.source.length && this.isHexDigit(this.source[this.pos])) {
        numStr += this.source[this.pos];
        this.advance();
      }

      this.tokens.push(this.makeToken(TokenType.IntegerLiteral, parseInt(numStr, 16).toString()));
      return;
    }

    // Decimal number
    while (this.pos < this.source.length && this.isDigit(this.source[this.pos])) {
      numStr += this.source[this.pos];
      this.advance();
    }

    // Float literal
    if (this.pos < this.source.length && this.source[this.pos] === '.' &&
        this.pos + 1 < this.source.length && this.isDigit(this.source[this.pos + 1])) {
      numStr += this.source[this.pos]; this.advance();
      while (this.pos < this.source.length && this.isDigit(this.source[this.pos])) {
        numStr += this.source[this.pos];
        this.advance();
      }
      this.tokens.push(this.makeToken(TokenType.FloatLiteral, numStr));
      return;
    }

    this.tokens.push(this.makeToken(TokenType.IntegerLiteral, numStr));
  }

  private readIdentifier(): void {
    let id = '';
    while (this.pos < this.source.length && (this.isAlphaNumeric(this.source[this.pos]) || this.source[this.pos] === '_')) {
      id += this.source[this.pos];
      this.advance();
    }

    // Check if it's a keyword
    const lower = id.toLowerCase();
    if (KEYWORDS[lower] !== undefined) {
      this.tokens.push(this.makeToken(KEYWORDS[lower], id));
    } else {
      this.tokens.push(this.makeToken(TokenType.Identifier, id));
    }
  }

  private tryReadMultiCharSymbol(): boolean {
    // Check 2-char symbols
    if (this.pos + 1 < this.source.length) {
      const two = this.source.substring(this.pos, this.pos + 2);
      if (SYMBOLS[two] !== undefined) {
        this.tokens.push(this.makeToken(SYMBOLS[two], two));
        this.advance(); this.advance();
        return true;
      }
    }
    return false;
  }

  private advance(): void {
    this.pos++;
    this.column++;
  }

  private peekChar(): string {
    return this.source[this.pos];
  }

  private peekNext(): string | undefined {
    return this.source[this.pos + 1];
  }

  private makeToken(type: TokenType, value: string): Token {
    return { type, value, line: this.line, column: this.column };
  }

  private isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9';
  }

  private isHexDigit(ch: string): boolean {
    return this.isDigit(ch) || (ch.toLowerCase() >= 'a' && ch.toLowerCase() <= 'f');
  }

  private isAlpha(ch: string): boolean {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
  }

  private isAlphaNumeric(ch: string): boolean {
    return this.isAlpha(ch) || this.isDigit(ch);
  }
}

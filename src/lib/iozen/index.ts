// ============================================================
// IOZEN Language — Main Entry Point
// Exports the complete IOZEN language toolkit
// ============================================================

export type * from './ast';
export { Environment, RuntimeError } from './environment';
export { Interpreter, executeIOZEN } from './interpreter';
export { Lexer } from './lexer';
export { ParseError, Parser } from './parser';
export { KEYWORDS, SYMBOLS, Token, TokenType } from './tokens';

// Phase 17: SSA Form
export { convertASTtoSSA } from './ast_to_ssa';
export type * from './ssa_ir';
export * as SSA from './ssa_ir';

// Language metadata
export const IOZEN_VERSION = '0.1.0';
export const IOZEN_NAME = 'IOZEN';
export const IOZEN_DESCRIPTION = 'A safe, expressive systems programming language with natural syntax';

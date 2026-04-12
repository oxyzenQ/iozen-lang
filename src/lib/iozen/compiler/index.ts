// IOZEN Compiler v2.0
// Main entry point for compilation

import { parse } from '../parser_v2';
import { tokenize } from '../tokenizer_v2';
import { astToIR } from './ast-to-ir';
import { generateC } from './c-backend';

export interface CompileOptions {
  target: 'c' | 'binary';
  outputFile?: string;
  optimize?: boolean;
}

export interface CompileResult {
  success: boolean;
  output?: string;
  binaryPath?: string;
  errors: string[];
}

export function compile(source: string, options: CompileOptions): CompileResult {
  const errors: string[] = [];

  try {
    // Step 1: Tokenize
    const tokens = tokenize(source);

    // Step 2: Parse to AST
    const ast = parse(tokens);

    // Step 3: AST to IR
    const ir = astToIR(ast);

    // Step 4: Generate C code
    const cCode = generateC(ir);

    if (options.target === 'c') {
      return {
        success: true,
        output: cCode,
        errors: []
      };
    }

    // TODO: Compile C to binary using gcc/clang
    errors.push('Binary compilation not yet implemented. Use target: "c" for now.');

    return {
      success: false,
      errors
    };

  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
    return {
      success: false,
      errors
    };
  }
}

export function compileToC(source: string): string {
  const tokens = tokenize(source);
  const ast = parse(tokens);
  const ir = astToIR(ast);
  return generateC(ir);
}

// Re-export compiler modules
export { IRBuilder, createIRBuilder, IRProgram, IRFunction, IRInstruction } from './ir';
export { astToIR, ASTToIR } from './ast-to-ir';
export { generateC, CBackend } from './c-backend';

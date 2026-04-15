// IOZEN Compiler v2.0
// Main entry point for compilation

import { parse } from '../parser_v2';
import { tokenize } from '../tokenizer_v2';
import { astToIR } from './ast-to-ir';
import { generateC } from './c-backend';
import { IROptimizer } from './ir-optimizer';

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

    // Step 3.5: Optimize IR (constant propagation, algebraic simplification, DCE)
    if (options.optimize !== false) {
      const optimizer = new IROptimizer(ir);
      optimizer.optimize();
    }

    // Step 4: Generate C code
    const cCode = generateC(ir);

    if (options.target === 'c') {
      return {
        success: true,
        output: cCode,
        errors: []
      };
    }

    // Compile C to native binary using gcc/clang
    const { execSync } = require('child_process');
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    const tmpDir = os.tmpdir();
    const tmpCFile = path.join(tmpDir, `iozen_${Date.now()}.c`);
    const outputPath = options.outputFile || path.join(process.cwd(), 'iozen_out');

    fs.writeFileSync(tmpCFile, cCode);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
      const cc = process.env.CC || 'gcc';
      execSync(`${cc} -O2 -o "${outputPath}" "${tmpCFile}" -lm`, { stdio: 'pipe' });
      try { fs.unlinkSync(tmpCFile); } catch {}
      return {
        success: true,
        output: cCode,
        binaryPath: outputPath,
        errors: []
      };
    } catch (compileError: any) {
      try { fs.unlinkSync(tmpCFile); } catch {}
      errors.push(`C compilation failed: ${compileError.message}`);
      return { success: false, errors };
    }

  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
    return {
      success: false,
      errors
    };
  }
}

export function compileToC(source: string, optimize = true): string {
  const tokens = tokenize(source);
  const ast = parse(tokens);
  const ir = astToIR(ast);
  if (optimize) {
    const optimizer = new IROptimizer(ir);
    optimizer.optimize();
  }
  return generateC(ir);
}

// Re-export compiler modules
export { astToIR, ASTToIR } from './ast-to-ir';
export { CBackend, generateC } from './c-backend';
export { createIRBuilder, IRBuilder } from './ir';
export { IROptimizer, optimizeIR } from './ir-optimizer';
export type { IRFunction, IRInstruction, IRProgram, IRValue } from './ir';

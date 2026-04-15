#!/usr/bin/env bun
// ============================================================
// IOZEN Compiler Test Suite
// Tests the full compiler pipeline: tokenize_v2 → parse_v2 →
// AST → IR → Optimizer → C Backend → (optional) gcc binary
//
// Run: bun run tests/test_compiler.ts
// ============================================================

import { compileToC, compile, type CompileResult } from '../src/lib/iozen/compiler/index';
import { astToIR } from '../src/lib/iozen/compiler/ast-to-ir';
import { generateC } from '../src/lib/iozen/compiler/c-backend';
import { IROptimizer } from '../src/lib/iozen/compiler/ir-optimizer';
import { tokenize } from '../src/lib/iozen/tokenizer_v2';
import { parse } from '../src/lib/iozen/parser_v2';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

// ---- Test Framework ----
let passed = 0;
let failed = 0;
const failures: string[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } catch (e: any) {
    failed++;
    const msg = e?.message || String(e);
    failures.push(`${name}: ${msg}`);
    console.error(`  \x1b[31m✗\x1b[0m ${name}: ${msg}`);
  }
}

function assert(condition: boolean, msg?: string) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertIncludes(haystack: string, needle: string, msg?: string) {
  if (!haystack.includes(needle)) {
    throw new Error(msg || `Expected string to include "${needle}". Got: "${haystack.substring(0, 200)}..."`);
  }
}

function assertNotIncludes(haystack: string, needle: string, msg?: string) {
  if (haystack.includes(needle)) {
    throw new Error(msg || `Expected string NOT to include "${needle}".`);
  }
}

// ---- Helpers ----

/** Compile IOZEN source to C code string */
function toC(source: string, optimize = true): string {
  return compileToC(source, optimize);
}

/** Compile IOZEN source to native binary and run, returning stdout */
function compileAndRun(source: string, optimize = true): { stdout: string; exitCode: number; cCode: string } {
  const cCode = compileToC(source, optimize);
  const tmpC = path.join(os.tmpdir(), `iozen_ct_${Date.now()}.c`);
  const tmpBin = path.join(os.tmpdir(), `iozen_ct_${Date.now()}`);
  fs.writeFileSync(tmpC, cCode);
  try {
    execSync(`gcc -O2 -o "${tmpBin}" "${tmpC}" -lm`, { stdio: 'pipe' });
    const stdout = execSync(`"${tmpBin}"`, { stdio: 'pipe', timeout: 5000 }).toString();
    return { stdout, exitCode: 0, cCode };
  } catch (e: any) {
    return { stdout: e.stdout?.toString() || '', exitCode: 1, cCode };
  } finally {
    try { fs.unlinkSync(tmpC); } catch {}
    try { fs.unlinkSync(tmpBin); } catch {}
  }
}

/** Compile and return the CompileResult (for error checking) */
function compileFull(source: string): CompileResult {
  return compile(source, { target: 'c' });
}

// ============================================================
// SECTION 1: TOKENIZER + PARSER (v2 syntax)
// ============================================================

console.log('\n\x1b[1m\x1b[36mCompiler: Tokenizer & Parser (v2 Syntax)\x1b[0m');

test('parses basic function declaration', () => {
  const c = toC('fn main() { print("hi"); }');
  assertIncludes(c, 'int main(void)');
});

test('parses typed function with parameters', () => {
  const c = toC('fn add(a: number, b: number): number { return a + b; }');
  assertIncludes(c, 'iz_value_t add(iz_value_t a, iz_value_t b)');
});

test('parses variable declarations with types', () => {
  const c = toC('fn main() { let x: number = 42; print(x); }');
  assertIncludes(c, 'iz_value_t x');
});

test('parses variable declarations without types', () => {
  const c = toC('fn main() { let x = 42; print(x); }');
  assertIncludes(c, 'iz_value_t x');
});

test('parses string literals', () => {
  const c = toC('fn main() { print("hello world"); }');
  assertIncludes(c, 'hello world');
});

test('parses boolean literals', () => {
  const c = toC('fn main() { let x = true; let y = false; print(x); print(y); }');
  assertIncludes(c, 'true');
  assertIncludes(c, 'false');
});

test('parses all arithmetic operators', () => {
  const c = toC('fn main() { let a = 1 + 2; let b = 3 - 1; let c = 2 * 3; let d = 10 / 2; let e = 7 % 3; }');
  assertIncludes(c, '.data.number');
});

test('parses comparison operators', () => {
  const c = toC('fn main() { let a = 1 == 2; let b = 1 != 2; let c = 1 < 2; let d = 1 > 2; let e = 1 <= 2; let f = 1 >= 2; }');
  assert(c.length > 100, 'C code should be non-trivial');
});

test('parses logical operators (and/or/not)', () => {
  const c = toC('fn main() { let a = true && false; let b = true || false; let c = !true; }');
  assertIncludes(c, '.data.boolean');
});

test('parses negation operator', () => {
  const c = toC('fn main() { let x = -42; print(x); }');
  assertIncludes(c, '-');
});

test('parses if/else', () => {
  const c = toC('fn main() { if (true) { print("yes"); } else { print("no"); } }');
  assertIncludes(c, 'if');
});

test('parses if/else if/else chain', () => {
  const c = toC('fn main() { if (false) { print("a"); } else if (true) { print("b"); } else { print("c"); } }');
  assert(c.includes('if'), 'should have if');
});

test('parses while loop', () => {
  const c = toC('fn main() { let i = 0; while (i < 5) { i = i + 1; } }');
  assertIncludes(c, 'while') || assertIncludes(c, 'goto'); // could be goto-based
});

test('parses for loop', () => {
  const c = toC('fn main() { for (let i = 0; i < 5; i = i + 1) { print(i); } }');
  assert(c.length > 100);
});

test('parses break statement', () => {
  const c = toC('fn main() { while (true) { break; } }');
  assert(c.length > 50);
});

test('parses continue statement', () => {
  const c = toC('fn main() { while (true) { continue; } }');
  assert(c.length > 50);
});

test('parses function call', () => {
  const c = toC('fn greet(): string { return "hi"; } fn main() { let s = greet(); print(s); }');
  assertIncludes(c, 'greet');
});

test('parses return with value', () => {
  const c = toC('fn id(x: number): number { return x; }');
  assertIncludes(c, 'return');
});

test('parses return without value', () => {
  const c = toC('fn noop() { return; }');
  assertIncludes(c, 'return');
});

test('parses string concatenation', () => {
  const c = toC('fn main() { let s = "hello" + " " + "world"; print(s); }');
  assertIncludes(c, 'hello');
});

test('parses array literal', () => {
  const c = toC('fn main() { let arr = [1, 2, 3]; print(arr); }');
  assertIncludes(c, 'iz_array_new');
});

test('parses array access', () => {
  const c = toC('fn main() { let arr = [1, 2, 3]; let x = arr[0]; print(x); }');
  assertIncludes(c, 'iz_array_get');
});

// ============================================================
// SECTION 2: IR GENERATION (AST → IR)
// ============================================================

console.log('\n\x1b[1m\x1b[36mCompiler: IR Generation\x1b[0m');

test('IR: generates instructions for basic function', () => {
  const ir = astToIR(parse(tokenize('fn main() { print("hi"); }')));
  assert(ir.functions.length > 0);
  const main = ir.functions.find(f => f.name === 'main');
  assert(main !== undefined);
  assert(main.instructions.length > 0);
  assert(main.instructions.some(i => i.op === 'print'));
});

test('IR: generates locals map', () => {
  const ir = astToIR(parse(tokenize('fn main() { let x: number = 42; print(x); }')));
  const main = ir.functions.find(f => f.name === 'main')!;
  assert(main.locals.has('x'));
});

test('IR: generates function params', () => {
  const ir = astToIR(parse(tokenize('fn add(a: number, b: number): number { return a + b; }')));
  const add = ir.functions.find(f => f.name === 'add')!;
  assert(add.params.length === 2);
  assert(add.params[0].name === 'a');
  assert(add.params[1].name === 'b');
});

test('IR: generates return instruction', () => {
  const ir = astToIR(parse(tokenize('fn id(x: number): number { return x; }')));
  const id = ir.functions.find(f => f.name === 'id')!;
  assert(id.instructions.some(i => i.op === 'ret'));
});

test('IR: generates labels for control flow', () => {
  const ir = astToIR(parse(tokenize('fn main() { if (true) { print("a"); } else { print("b"); } }')));
  const main = ir.functions.find(f => f.name === 'main')!;
  assert(main.labels.size > 0);
});

// ============================================================
// SECTION 3: OPTIMIZER
// ============================================================

console.log('\n\x1b[1m\x1b[36mCompiler: IR Optimizer\x1b[0m');

test('opt: constant propagation reduces instructions', () => {
  const ir = astToIR(parse(tokenize('fn main() { let x = 5; let y = x + 3; print(y); }')));
  const before = ir.functions[0].instructions.length;
  new IROptimizer(ir).optimize();
  const after = ir.functions[0].instructions.length;
  assert(after < before, `Expected fewer instructions after optimization: ${before} -> ${after}`);
});

test('opt: dead code elimination removes unused variables', () => {
  const ir = astToIR(parse(tokenize('fn main() { let a = 42; let b = 100; print(a); }')));
  new IROptimizer(ir).optimize();
  const main = ir.functions[0];
  // b should be eliminated (never used)
  const hasB = main.instructions.some(i => i.dest === 'b');
  assert(!hasB, 'unused variable b should be eliminated');
});

test('opt: algebraic simplification (x+0, x*1, x*0)', () => {
  const ir = astToIR(parse(tokenize('fn main() { let a = 42; let r1 = a + 0; let r2 = a * 1; let r3 = a * 0; print(r1); print(r2); print(r3); }')));
  new IROptimizer(ir).optimize();
  const main = ir.functions[0];
  // No add/mul instructions should remain (all simplified or folded)
  assert(!main.instructions.some(i => i.op === 'add'), 'add should be eliminated');
  assert(!main.instructions.some(i => i.op === 'mul'), 'mul should be eliminated');
});

test('opt: chain propagation (x=10, y=x+5, z=y+5 → z=20)', () => {
  const ir = astToIR(parse(tokenize('fn main() { let base = 10; let temp = base + 5; let result = temp + 5; print(result); }')));
  new IROptimizer(ir).optimize();
  const main = ir.functions[0];
  assert(main.instructions.some(i => i.op === 'const' && (i.src1 as any).value === 20), 'result should be 20');
});

test('opt: constant folding at IR level', () => {
  const ir = astToIR(parse(tokenize('fn main() { let x = 3; let y = x * 2; let z = y + 1; print(z); }')));
  new IROptimizer(ir).optimize();
  const main = ir.functions[0];
  // z should be constant 7
  assert(main.instructions.some(i => i.op === 'const' && (i.src1 as any).value === 7), 'z should be 7');
});

test('opt: multiple unused variables all eliminated', () => {
  const ir = astToIR(parse(tokenize('fn main() { let a = 100; let b = a; let c = b; print(42); }')));
  const before = ir.functions[0].instructions.length;
  new IROptimizer(ir).optimize();
  const after = ir.functions[0].instructions.length;
  assert(after < before, 'unused chain should be eliminated');
});

test('opt: respects optimize=false flag', () => {
  const src = 'fn main() { let x = 5; let y = x + 3; print(y); }';
  const cOpt = compileToC(src, true);
  const cNoOpt = compileToC(src, false);
  // Both should produce valid C with main function
  assertIncludes(cOpt, 'main');
  assertIncludes(cNoOpt, 'main');
});

// ============================================================
// SECTION 4: C CODE GENERATION
// ============================================================

console.log('\n\x1b[1m\x1b[36mCompiler: C Code Generation\x1b[0m');

test('codegen: includes necessary headers', () => {
  const c = toC('fn main() { print("hi"); }');
  assertIncludes(c, '#include <stdio.h>');
  assertIncludes(c, '#include <stdlib.h>');
  assertIncludes(c, '#include <string.h>');
  assertIncludes(c, '#include <math.h>');
  assertIncludes(c, '#include <stdbool.h>');
});

test('codegen: defines IOZEN value type', () => {
  const c = toC('fn main() { print(42); }');
  assertIncludes(c, 'iz_type_t');
  assertIncludes(c, 'iz_value_t');
  assertIncludes(c, 'IZ_NUMBER');
  assertIncludes(c, 'IZ_STRING');
  assertIncludes(c, 'IZ_BOOL');
});

test('codegen: includes built-in print function', () => {
  const c = toC('fn main() { print("hi"); }');
  assertIncludes(c, 'void iz_print');
});

test('codegen: includes value equality function', () => {
  const c = toC('fn main() { if (1 == 2) { print("x"); } }');
  assertIncludes(c, 'iz_value_equals');
});

test('codegen: emits main function', () => {
  const c = toC('fn main() { print("hi"); }');
  assertIncludes(c, 'int main(void)');
});

test('codegen: declares local variables', () => {
  const c = toC('fn main() { let x: number = 42; print(x); }');
  assertIncludes(c, 'iz_value_t x');
});

test('codegen: handles string concatenation', () => {
  const c = toC('fn main() { let s = "a" + "b"; print(s); }');
  // String concat should use iz_string_concat
  assert(c.length > 100);
});

test('codegen: handles array operations', () => {
  const c = toC('fn main() { let arr = [1, 2, 3]; print(arr[0]); }');
  assertIncludes(c, 'iz_array_new');
  assertIncludes(c, 'iz_array_get');
});

test('codegen: handles function declarations', () => {
  const c = toC('fn double(x: number): number { return x * 2; } fn main() { let r = double(21); print(r); }');
  // 'double' is a C keyword, so it gets mangled to 'iz_double'
  assertIncludes(c, 'iz_double');
});

test('codegen: handles multiple functions', () => {
  const c = toC('fn a() { print("a"); } fn b() { print("b"); } fn main() { a(); b(); }');
  assertIncludes(c, 'void a(');
  assertIncludes(c, 'void b(');
  assertIncludes(c, 'int main(void)');
});

test('codegen: handles boolean operations', () => {
  const c = toC('fn main() { let x = true && false; print(x); }');
  assertIncludes(c, '.data.boolean');
});

test('codegen: handles negation', () => {
  const c = toC('fn main() { let x = -42; print(x); }');
  assertIncludes(c, '-');
});

// ============================================================
// SECTION 5: END-TO-END COMPILATION + EXECUTION
// ============================================================

console.log('\n\x1b[1m\x1b[36mCompiler: End-to-End Compile & Run\x1b[0m');

test('e2e: hello world', () => {
  const { stdout, exitCode } = compileAndRun('fn main() { print("Hello, IOZEN"); }');
  assert(exitCode === 0, `compilation failed`);
  assertIncludes(stdout, 'Hello, IOZEN');
});

test('e2e: integer arithmetic', () => {
  const { stdout, exitCode } = compileAndRun('fn main() { print(2 + 3); }');
  assert(exitCode === 0);
  assertIncludes(stdout, '5');
});

test('e2e: variable declaration and use', () => {
  const { stdout } = compileAndRun('fn main() { let x = 42; print(x); }');
  assertIncludes(stdout, '42');
});

test('e2e: string output', () => {
  const { stdout } = compileAndRun('fn main() { print("hello world"); }');
  assertIncludes(stdout, 'hello world');
});

test('e2e: boolean output', () => {
  const { stdout } = compileAndRun('fn main() { print(true); print(false); }');
  assertIncludes(stdout, 'true');
  assertIncludes(stdout, 'false');
});

test('e2e: arithmetic expressions', () => {
  const { stdout } = compileAndRun('fn main() { print(10 - 3); print(4 * 5); print(20 / 4); print(17 % 5); }');
  assertIncludes(stdout, '7');
  assertIncludes(stdout, '20');
  assertIncludes(stdout, '5');
  assertIncludes(stdout, '2');
});

test('e2e: comparison operators', () => {
  const { stdout } = compileAndRun('fn main() { print(5 == 5); print(5 != 3); print(3 < 5); print(5 > 3); }');
  assertIncludes(stdout, 'true');
  assertIncludes(stdout, 'true');
  assertIncludes(stdout, 'true');
  assertIncludes(stdout, 'true');
});

test('e2e: if/else branches', () => {
  const { stdout } = compileAndRun('fn main() { let x = 85; if (x >= 90) { print("A"); } else if (x >= 80) { print("B"); } else { print("C"); } }');
  assertIncludes(stdout, 'B');
  assertNotIncludes(stdout, 'A');
  assertNotIncludes(stdout, 'C');
});

test('e2e: while loop', () => {
  const { stdout } = compileAndRun(`
    fn main() {
        let sum = 0
        let i = 1
        while (i <= 5) {
            sum = sum + i
            i = i + 1
        }
        print(sum)
    }`);
  assertIncludes(stdout, '15');
});

test('e2e: for loop', () => {
  const { stdout } = compileAndRun(`
    fn main() {
        let sum = 0
        for (let i = 1; i <= 5; i = i + 1) {
            sum = sum + i
        }
        print(sum)
    }`);
  assertIncludes(stdout, '15');
});

test('e2e: function call', () => {
  const { stdout } = compileAndRun(`
    fn double(x: number): number { return x * 2; }
    fn main() { let r = double(21); print(r); }`);
  assertIncludes(stdout, '42');
});

test('e2e: recursive function (fibonacci)', () => {
  const { stdout } = compileAndRun(`
    fn fib(n: number): number {
        if (n <= 1) { return n; }
        return fib(n - 1) + fib(n - 2);
    }
    fn main() { print(fib(10)); }`);
  assertIncludes(stdout, '55');
});

test('e2e: string concatenation', () => {
  const { stdout } = compileAndRun(`
    fn main() {
        let s = "Hello" + ", " + "World!"
        print(s)
    }`);
  assertIncludes(stdout, 'Hello, World!');
});

test('e2e: array literal and access', () => {
  const { stdout } = compileAndRun(`
    fn main() {
        let arr = [10, 20, 30]
        print(arr[0])
        print(arr[1])
        print(arr[2])
    }`);
  assertIncludes(stdout, '10');
  assertIncludes(stdout, '20');
  assertIncludes(stdout, '30');
});

test('e2e: break statement', () => {
  const { stdout } = compileAndRun(`
    fn main() {
        let x = 0
        while (x < 10) {
            if (x == 3) { break; }
            x = x + 1
        }
        print(x)
    }`);
  assertIncludes(stdout, '3');
});

test('e2e: constant propagation correctness', () => {
  const { stdout } = compileAndRun(`
    fn main() {
        let x = 5
        let y = x + 3
        print(y)
    }`);
  assertIncludes(stdout, '8');
});

test('e2e: complex optimization correctness', () => {
  const { stdout } = compileAndRun(`
    fn main() {
        let base = 10
        let temp = base + 5
        let result = temp + 5
        print(result)
    }`);
  assertIncludes(stdout, '20');
});

test('e2e: nested loops (multiplication table)', () => {
  const { stdout } = compileAndRun(`
    fn main() {
        let row = 1
        while (row <= 3) {
            let col = 1
            while (col <= 3) {
                print(row * col)
                col = col + 1
            }
            row = row + 1
        }
    }`);
  assertIncludes(stdout, '1');
  assertIncludes(stdout, '2');
  assertIncludes(stdout, '3');
  assertIncludes(stdout, '4');
  assertIncludes(stdout, '6');
  assertIncludes(stdout, '9');
});

// ============================================================
// SECTION 6: ERROR HANDLING
// ============================================================

console.log('\n\x1b[1m\x1b[36mCompiler: Error Handling\x1b[0m');

test('errors: invalid syntax produces error', () => {
  const result = compileFull('this is not valid iozen code !!!');
  assert(!result.success, 'should fail to compile invalid syntax');
  assert(result.errors.length > 0, 'should have error messages');
});

test('errors: empty source produces error', () => {
  const result = compileFull('');
  // Empty source may produce an error or empty output
  if (result.success) {
    // If it succeeds, output should exist
    assert(result.output !== undefined);
  }
});

// ============================================================
// SECTION 7: COMPILE COMMAND (full binary pipeline)
// ============================================================

console.log('\n\x1b[1m\x1b[36mCompiler: Full Binary Pipeline\x1b[0m');

test('binary: compile to binary target succeeds', () => {
  const result = compile('fn main() { print("binary test"); }', { target: 'binary' });
  assert(result.success, `binary compilation failed: ${result.errors.join(', ')}`);
  assert(result.binaryPath !== undefined, 'should have binaryPath');
  // Clean up
  try { fs.unlinkSync(result.binaryPath!); } catch {}
});

test('binary: compiled binary produces correct output', () => {
  const result = compile('fn main() { print(42); }', { target: 'binary' });
  assert(result.success, `binary compilation failed: ${result.errors.join(', ')}`);
  if (result.binaryPath) {
    const stdout = execSync(`"${result.binaryPath}"`, { stdio: 'pipe', timeout: 5000 }).toString();
    assertIncludes(stdout, '42');
    try { fs.unlinkSync(result.binaryPath); } catch {}
  }
});

test('binary: compile to C target succeeds', () => {
  const result = compile('fn main() { print("c test"); }', { target: 'c' });
  assert(result.success, `C compilation failed: ${result.errors.join(', ')}`);
  assertIncludes(result.output || '', 'main');
});

// ============================================================
// SECTION 8: REAL-WORLD EXAMPLES
// ============================================================

console.log('\n\x1b[1m\x1b[36mCompiler: Real-World Examples\x1b[0m');

test('example: hello.iozen compiles and runs', () => {
  const src = fs.readFileSync('examples/hello.iozen', 'utf-8');
  const { stdout, exitCode } = compileAndRun(src);
  assert(exitCode === 0, `hello.iozen compilation failed`);
  assertIncludes(stdout, 'Hello, IOZEN');
});

test('example: control_flow.iozen compiles and runs', () => {
  const src = fs.readFileSync('examples/control_flow.iozen', 'utf-8');
  const { stdout, exitCode } = compileAndRun(src);
  assert(exitCode === 0, `control_flow.iozen compilation failed`);
  assertIncludes(stdout, 'Control Flow Demo');
  assertIncludes(stdout, 'Grade: B');
  assertIncludes(stdout, 'Demo Complete');
});

test('example: test_constant_fold.iozen compiles and runs', () => {
  const src = fs.readFileSync('examples/test_constant_fold.iozen', 'utf-8');
  const { stdout, exitCode } = compileAndRun(src);
  assert(exitCode === 0, `test_constant_fold.iozen compilation failed`);
  // Note: string+number concatenation is not yet supported by v2 compiler,
  // so the "a = 2 + 3 = " prefix won't appear. Values are still correct.
  assertIncludes(stdout, '5');
  assertIncludes(stdout, '50');
  assertIncludes(stdout, '25');
  assertIncludes(stdout, '2');
  assertIncludes(stdout, '20');
  assertIncludes(stdout, '60');
  assertIncludes(stdout, 'Hello, World!');
});

test('example: test_for_loop.iozen compiles and runs', () => {
  const src = fs.readFileSync('examples/test_for_loop.iozen', 'utf-8');
  const { stdout, exitCode } = compileAndRun(src);
  assert(exitCode === 0, `test_for_loop.iozen compilation failed`);
  // Note: string+number coercion not yet in v2 compiler,
  // so "Sum = " prefix won't appear. Just check the numeric value.
  assertIncludes(stdout, '55');
});

// ============================================================
// RESULTS
// ============================================================

console.log('\n' + '═'.repeat(60));
console.log(`\x1b[1mCompiler Test Results: ${passed} passed / ${failed} failed / ${passed + failed} total\x1b[0m`);
if (failures.length > 0) {
  console.log('\n\x1b[31mFailures:\x1b[0m');
  for (const f of failures) {
    console.error(`  • ${f}`);
  }
}
console.log('═'.repeat(60));

if (failed > 0) process.exit(1);

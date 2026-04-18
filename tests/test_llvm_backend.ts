// IOZEN LLVM Backend Tests
// Test the LLVM IR code generator

import { createLLVMGenerator } from '../src/lib/iozen/compiler/llvm/llvm-generator';
import { createIRBuilder, IRProgram } from '../src/lib/iozen/compiler/ir';

console.log('IOZEN LLVM Backend Tests\n');

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e: any) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${e.message}`);
    failed++;
  }
}

// Test 1: Basic LLVM module generation
test('llvm: generates basic module with type definitions', () => {
  const gen = createLLVMGenerator();
  const builder = createIRBuilder();
  
  builder.newFunction('main', 'void');
  builder.emitRet();
  
  const program = builder.getProgram();
  const llvm = gen.generate(program);
  
  if (!llvm.includes('%value = type opaque')) {
    throw new Error('Missing value type definition');
  }
  if (!llvm.includes('%str = type opaque')) {
    throw new Error('Missing string type definition');
  }
});

// Test 2: Function declaration
test('llvm: generates function declaration', () => {
  const gen = createLLVMGenerator();
  const builder = createIRBuilder();
  
  builder.newFunction('test_func', 'number');
  builder.addParam('x', 'number');
  builder.emitRet();
  
  const program = builder.getProgram();
  const llvm = gen.generate(program);
  
  if (!llvm.includes('define %value* @test_func(%value*)')) {
    throw new Error('Function declaration not generated correctly');
  }
});

// Test 3: Constant generation
test('llvm: generates constant number', () => {
  const gen = createLLVMGenerator();
  const builder = createIRBuilder();
  
  builder.newFunction('main', 'void');
  const temp = builder.newTemp('ptr');
  builder.emitConst(temp, { type: 'number', value: 42 });
  builder.emitRet();
  
  const program = builder.getProgram();
  const llvm = gen.generate(program);
  
  if (!llvm.includes('call %value* @iozen_number_new(double 42)')) {
    throw new Error('Constant number not generated correctly');
  }
});

// Test 4: String literal generation
test('llvm: generates string literal', () => {
  const gen = createLLVMGenerator();
  const builder = createIRBuilder();
  
  builder.newFunction('main', 'void');
  const temp = builder.newTemp('ptr');
  builder.emitConst(temp, { type: 'string', value: 'hello' });
  builder.emitRet();
  
  const program = builder.getProgram();
  const llvm = gen.generate(program);
  
  if (!llvm.includes('@.str.hello')) {
    throw new Error('String literal not generated');
  }
  // Check for the string content (escaped properly)
  if (!llvm.includes('hello')) {
    throw new Error('String content not correct');
  }
});

// Test 5: Arithmetic operations
test('llvm: generates add operation', () => {
  const gen = createLLVMGenerator();
  const builder = createIRBuilder();
  
  builder.newFunction('add', 'number');
  builder.addParam('a', 'number');
  builder.addParam('b', 'number');
  
  const result = builder.newTemp('ptr');
  builder.emitBinary('add', result, 'a', 'b');
  builder.emitRet(result);
  
  const program = builder.getProgram();
  const llvm = gen.generate(program);
  
  if (!llvm.includes('call %value* @iozen_add(%value* a, %value* b)')) {
    throw new Error('Add operation not generated correctly');
  }
});

// Test 6: Function call
test('llvm: generates function call', () => {
  const gen = createLLVMGenerator();
  const builder = createIRBuilder();
  
  builder.newFunction('main', 'void');
  builder.emitCall(undefined, 'print_value', ['arg1']);
  builder.emitRet();
  
  const program = builder.getProgram();
  const llvm = gen.generate(program);
  
  if (!llvm.includes('call %value* @print_value(%value* arg1)')) {
    throw new Error('Function call not generated correctly');
  }
});

// Test 7: Print statement
test('llvm: generates print instruction', () => {
  const gen = createLLVMGenerator();
  const builder = createIRBuilder();
  
  builder.newFunction('main', 'void');
  builder.emitPrint('msg');
  builder.emitRet();
  
  const program = builder.getProgram();
  const llvm = gen.generate(program);
  
  if (!llvm.includes('call void @print_value(%value* msg)')) {
    throw new Error('Print instruction not generated correctly');
  }
});

// Test 8: Control flow - labels and branches
test('llvm: generates labels and branches', () => {
  const gen = createLLVMGenerator();
  const builder = createIRBuilder();
  
  builder.newFunction('main', 'void');
  const L1 = builder.newLabel('L');
  const L2 = builder.newLabel('L');
  
  builder.emitGoto(L2);
  builder.emitLabel(L1);
  builder.emitRet();
  builder.emitLabel(L2);
  builder.emitRet();
  
  const program = builder.getProgram();
  const llvm = gen.generate(program);
  
  if (!llvm.includes('L0:')) {
    throw new Error('Label not generated');
  }
  if (!llvm.includes('br label %L1')) {
    throw new Error('Branch not generated');
  }
});

// Test 9: Multiple functions
test('llvm: generates multiple functions', () => {
  const gen = createLLVMGenerator();
  const builder = createIRBuilder();
  
  // First function
  builder.newFunction('func1', 'void');
  builder.emitRet();
  
  // Second function
  builder.newFunction('func2', 'number');
  builder.emitRet();
  
  const program = builder.getProgram();
  const llvm = gen.generate(program);
  
  if (!llvm.includes('define void @func1(')) {
    throw new Error('First function not generated');
  }
  if (!llvm.includes('define %value* @func2(')) {
    throw new Error('Second function not generated');
  }
});

// Test 10: External declarations
test('llvm: includes external function declarations', () => {
  const gen = createLLVMGenerator();
  const builder = createIRBuilder();
  
  builder.newFunction('main', 'void');
  builder.emitRet();
  
  const program = builder.getProgram();
  const llvm = gen.generate(program);
  
  if (!llvm.includes('declare void @print_value(%value*)')) {
    throw new Error('Missing print_value declaration');
  }
  if (!llvm.includes('declare %value* @iozen_alloc()')) {
    throw new Error('Missing alloc declaration');
  }
});

// Test 11: Comparison operations
test('llvm: generates comparison operations', () => {
  const gen = createLLVMGenerator();
  const builder = createIRBuilder();
  
  builder.newFunction('compare', 'bool');
  builder.addParam('a', 'number');
  builder.addParam('b', 'number');
  
  const result = builder.newTemp('bool');
  builder.emitBinary('eq', result, 'a', 'b');
  builder.emitRet(result);
  
  const program = builder.getProgram();
  const llvm = gen.generate(program);
  
  if (!llvm.includes('call i1 @iozen_eq(%value* a, %value* b)')) {
    throw new Error('Comparison operation not generated correctly');
  }
});

// Test 12: Logical operations
test('llvm: generates logical operations', () => {
  const gen = createLLVMGenerator();
  const builder = createIRBuilder();
  
  builder.newFunction('logic', 'bool');
  builder.addParam('a', 'bool');
  builder.addParam('b', 'bool');
  
  const result = builder.newTemp('bool');
  builder.emitBinary('and', result, 'a', 'b');
  builder.emitRet(result);
  
  const program = builder.getProgram();
  const llvm = gen.generate(program);
  
  if (!llvm.includes('call i1 @iozen_and(i1 a, i1 b)')) {
    throw new Error('Logical operation not generated correctly');
  }
});

// Test 13: Conditional branch with condition
test('llvm: generates conditional branch with condition', () => {
  const gen = createLLVMGenerator();
  const builder = createIRBuilder();
  
  builder.newFunction('test_if', 'void');
  const cond = builder.newTemp('bool');
  const L1 = builder.newLabel('L');
  const L2 = builder.newLabel('L');
  
  builder.emitIf(cond, L1, L2);
  builder.emitLabel(L1);
  builder.emitRet();
  builder.emitLabel(L2);
  builder.emitRet();
  
  const program = builder.getProgram();
  const llvm = gen.generate(program);
  
  if (!llvm.includes('br i1') || !llvm.includes('label %L0')) {
    throw new Error('Conditional branch not generated correctly');
  }
});

// Test 14: Struct field access
test('llvm: generates struct field access', () => {
  const gen = createLLVMGenerator();
  const builder = createIRBuilder();
  
  builder.newFunction('get_field', 'number');
  builder.addParam('s', 'ptr');
  
  const result = builder.newTemp('ptr');
  builder.emitStructGet(result, 's', 0);
  builder.emitRet(result);
  
  const program = builder.getProgram();
  const llvm = gen.generate(program);
  
  if (!llvm.includes('call %value* @iozen_struct_get(%value* s, i32 0)')) {
    throw new Error('Struct field access not generated correctly');
  }
});

// Test 15: Closure operations
test('llvm: generates closure operations', () => {
  const gen = createLLVMGenerator();
  const builder = createIRBuilder();
  
  builder.newFunction('make_closure', 'ptr');
  builder.addParam('func', 'ptr');
  builder.addParam('env', 'ptr');
  
  const result = builder.newTemp('ptr');
  builder.emitClosureNew(result, 'func', 'env');
  builder.emitRet(result);
  
  const program = builder.getProgram();
  const llvm = gen.generate(program);
  
  if (!llvm.includes('call %value* @iozen_closure_new(%value* func, %value* env)')) {
    throw new Error('Closure creation not generated correctly');
  }
});

// Test 16: Exception handling
test('llvm: generates exception handling instructions', () => {
  const gen = createLLVMGenerator();
  const builder = createIRBuilder();
  
  builder.newFunction('try_example', 'void');
  builder.addParam('exc', 'ptr');
  
  builder.emitThrow('exc');
  builder.emitRet();
  
  const program = builder.getProgram();
  const llvm = gen.generate(program);
  
  if (!llvm.includes('call void @iozen_throw(%value* exc)')) {
    throw new Error('Exception throw not generated correctly');
  }
});

console.log('\n' + '='.repeat(60));
console.log(`LLVM Backend Test Results: ${passed} passed / ${failed} failed / ${passed + failed} total`);
console.log('='.repeat(60));

if (failed > 0) {
  process.exit(1);
}

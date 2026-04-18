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

console.log('\n' + '='.repeat(60));
console.log(`LLVM Backend Test Results: ${passed} passed / ${failed} failed / ${passed + failed} total`);
console.log('='.repeat(60));

if (failed > 0) {
  process.exit(1);
}

// Day 3 Test: Simple Parser

import { tokenize } from '../../src/lib/iozen/tokenizer_v2';
import { parse, printAST } from '../../src/lib/iozen/parser_v2';

console.log('=== DAY 3: PARSER TEST ===\n');

const testCases = [
  {
    name: 'Simple function',
    code: `fn main() {
    print("Hello")
}`
  },
  {
    name: 'String concatenation',
    code: `fn main() {
    print("OS: " + get_os())
}`
  },
  {
    name: 'Multiple prints',
    code: `fn main() {
    print("Line 1")
    print("Line 2")
}`
  }
];

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  console.log(`\nTest: ${testCase.name}`);
  console.log('Code:', testCase.code.replace(/\n/g, '\\n'));
  
  try {
    // Tokenize
    const tokens = tokenize(testCase.code);
    
    // Parse
    const ast = parse(tokens);
    
    // Print AST
    console.log('AST:');
    printAST(ast);
    
    // Basic validation
    const hasFunction = ast.body.some((s: any) => s.type === 'FunctionDeclaration');
    const hasPrint = ast.body.some((s: any) => 
      s.type === 'FunctionDeclaration' && 
      s.body.some((b: any) => b.type === 'PrintStatement')
    );
    
    if (hasFunction && hasPrint) {
      console.log('✅ PASSED\n');
      passed++;
    } else {
      console.log('⚠️ Missing expected AST nodes\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ ERROR: ${err}\n`);
    failed++;
  }
}

console.log('\n=== SUMMARY ===');
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);

if (failed === 0) {
  console.log('\n✅ DAY 3 COMPLETE: Parser works!');
  process.exit(0);
} else {
  console.log('\n⚠️ Some tests failed');
  process.exit(1);
}

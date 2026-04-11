// Day 2 Test: Minimal Tokenizer

import { tokenize, printTokens } from '../../src/lib/iozen/tokenizer_v2';

console.log('=== DAY 2: TOKENIZER TEST ===\n');

const testCases = [
  {
    name: 'Simple hello',
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
    name: 'With comment',
    code: `// Test comment
fn main() {
    print("Test") // inline comment
}`
  }
];

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  console.log(`\nTest: ${testCase.name}`);
  console.log('Code:', testCase.code.replace(/\n/g, '\\n'));
  
  try {
    const tokens = tokenize(testCase.code);
    printTokens(tokens);
    
    // Basic validation
    const hasFn = tokens.some(t => t.type === 'FN');
    const hasMain = tokens.some(t => t.type === 'MAIN');
    const hasPrint = tokens.some(t => t.type === 'PRINT');
    const hasLParen = tokens.some(t => t.type === 'LPAREN');
    const hasRParen = tokens.some(t => t.type === 'RPAREN');
    
    if (hasFn && hasMain && hasPrint) {
      console.log('✅ PASSED\n');
      passed++;
    } else {
      console.log('⚠️ Missing expected tokens\n');
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
  console.log('\n✅ DAY 2 COMPLETE: Tokenizer works!');
  process.exit(0);
} else {
  console.log('\n⚠️ Some tests failed');
  process.exit(1);
}

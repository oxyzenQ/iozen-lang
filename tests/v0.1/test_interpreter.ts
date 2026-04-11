// Day 4 Test: Interpreter Execution

import { tokenize } from '../../src/lib/iozen/tokenizer_v2';
import { parse } from '../../src/lib/iozen/parser_v2';
import { execute } from '../../src/lib/iozen/interpreter_v2';

console.log('=== DAY 4: INTERPRETER TEST ===\n');

const testCases = [
  {
    name: 'Simple hello',
    code: `fn main() {
    print("Hello, IOZEN")
}`,
    expectedOutput: ['Hello, IOZEN']
  },
  {
    name: 'Multiple prints',
    code: `fn main() {
    print("Line 1")
    print("Line 2")
}`,
    expectedOutput: ['Line 1', 'Line 2']
  },
  {
    name: 'String concat',
    code: `fn main() {
    print("OS: " + "Linux")
}`,
    expectedOutput: ['OS: Linux']
  },
  {
    name: 'Built-in get_os',
    code: `fn main() {
    print("OS: " + get_os())
}`,
    expectedOutput: ['OS: Linux']
  },
  {
    name: 'Built-in get_cpu',
    code: `fn main() {
    print("CPU: " + get_cpu())
}`,
    expectedOutput: ['CPU:']
  }
];

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  console.log(`\nTest: ${testCase.name}`);
  console.log('Code:', testCase.code.replace(/\n/g, '\\n'));
  
  // Capture console output
  const originalLog = console.log;
  const outputs: string[] = [];
  console.log = (...args: any[]) => {
    outputs.push(args.join(' '));
  };
  
  try {
    // Tokenize -> Parse -> Execute
    const tokens = tokenize(testCase.code);
    const ast = parse(tokens);
    execute(ast);
    
    // Restore console
    console.log = originalLog;
    
    // Check output
    console.log('Output:', outputs);
    
    // For some tests, just check if output starts with expected
    let outputMatch = false;
    if (testCase.name === 'Built-in get_cpu') {
      // CPU output varies, just check it starts with "CPU:"
      outputMatch = outputs[0]?.startsWith('CPU:');
    } else {
      outputMatch = JSON.stringify(outputs) === JSON.stringify(testCase.expectedOutput);
    }
    
    if (outputMatch) {
      console.log('✅ PASSED\n');
      passed++;
    } else {
      console.log(`⚠️ Output mismatch. Expected: ${JSON.stringify(testCase.expectedOutput)}\n`);
      failed++;
    }
  } catch (err) {
    console.log = originalLog;
    console.log(`❌ ERROR: ${err}\n`);
    failed++;
  }
}

console.log('\n=== SUMMARY ===');
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);

if (failed === 0) {
  console.log('\n✅ DAY 4 COMPLETE: Interpreter works!');
  console.log('\nIOZEN can now execute code!');
  process.exit(0);
} else {
  console.log('\n⚠️ Some tests failed');
  process.exit(1);
}

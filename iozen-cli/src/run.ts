// Day 1: CLI Entry Point + File Reader + Minimal Execution
// Target: iozen run file.iozen → executes print statements

import * as fs from 'fs';
import * as path from 'path';

export function runCommand(args: string[]): void {
  if (args.length === 0) {
    console.log('Usage: iozen run <file.iozen>');
    process.exit(1);
  }
  
  const filePath = args[0];
  
  // Check file exists
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }
  
  // Check extension
  if (!filePath.endsWith('.iozen')) {
    console.error('Error: File must have .iozen extension');
    process.exit(1);
  }
  
  // Read file
  const code = fs.readFileSync(filePath, 'utf-8');
  
  // Execute
  executeMinimal(code);
}

// Minimal execution for Day 1
// Just handles print("...") statements inside fn main() { }
function executeMinimal(code: string): void {
  const lines = code.split('\n');
  let inMain = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//')) continue;
    
    // Track if we're in main function
    if (trimmed.startsWith('fn main()')) {
      inMain = true;
      continue;
    }
    
    // End of main
    if (inMain && trimmed === '}') {
      inMain = false;
      continue;
    }
    
    // Only execute if in main
    if (!inMain) continue;
    
    // Parse print("...")
    const printMatch = trimmed.match(/print\s*\(\s*"([^"]*)"\s*\)/);
    if (printMatch) {
      console.log(printMatch[1]);
    }
  }
}

// Direct execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'run') {
    runCommand(args.slice(1));
  } else {
    console.log('IOZEN v0.1 - Minimal Runtime');
    console.log('');
    console.log('Commands:');
    console.log('  iozen run <file.iozen>  - Run an IOZEN program');
    console.log('');
    console.log('Example:');
    console.log('  iozen run examples/hello.iozen');
  }
}

// Day 1: CLI Entry Point + File Reader
// Minimal implementation - NO OVERENGINEERING

import * as fs from 'fs';
import * as path from 'path';

// Simple run command
export function runFile(filePath: string): void {
  // Check file exists
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }
  
  // Read file
  const code = fs.readFileSync(filePath, 'utf-8');
  
  // Execute (minimal for Day 1)
  execute(code);
}

// Day 1: SUPER SIMPLE EXECUTION
// Just parse print statements for now
function execute(code: string): void {
  const lines = code.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//')) continue;
    
    // Skip function declarations (Day 1: just execute body)
    if (trimmed.startsWith('fn ')) continue;
    if (trimmed === '}') continue;
    if (trimmed === '{') continue;
    
    // Parse print("...")
    const printMatch = trimmed.match(/print\s*\(\s*"([^"]*)"\s*\)/);
    if (printMatch) {
      console.log(printMatch[1]);
      continue;
    }
    
    // Parse print with string concatenation (basic)
    const printConcatMatch = trimmed.match(/print\s*\(\s*"([^"]*)"\s*\+\s*(\w+)\s*\)/);
    if (printConcatMatch) {
      // For now, just print the string part + "[variable]"
      console.log(printConcatMatch[1] + '[variable:' + printConcatMatch[2] + ']');
      continue;
    }
    
    // Unknown statement - skip for Day 1
    if (trimmed && !trimmed.startsWith('//')) {
      // Silent skip for Day 1
    }
  }
}

// CLI entry
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2 || args[0] !== 'run') {
    console.log('Usage: iozen run <file>');
    process.exit(1);
  }
  
  const filePath = args[1];
  runFile(filePath);
}

// Day 4: CLI Entry Point + Full Pipeline
// Target: iozen run file.iozen → tokenize → parse → execute

import * as fs from 'fs';
import { execute } from '../../src/lib/iozen/interpreter_v2';
import { parse } from '../../src/lib/iozen/parser_v2';
import { tokenize } from '../../src/lib/iozen/tokenizer_v2';

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

  // Execute pipeline
  try {
    const tokens = tokenize(code);
    const ast = parse(tokens);
    execute(ast);
  } catch (err) {
    console.error(`Error: ${err}`);
    process.exit(1);
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

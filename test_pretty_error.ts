import { Interpreter } from './src/lib/iozen/interpreter';
import * as fs from 'fs';

const code = fs.readFileSync('tests/stabilization/test_54_error_real_location.iozen', 'utf8');
const interp = new Interpreter();
interp.setSourceFilePath('tests/stabilization/test_54_error_real_location.iozen');
const result = interp.run(code);

console.log('=== OUTPUT ===');
console.log(result.output.join('\n'));
console.log('');
console.log('=== ERRORS ===');
if (result.errors.length > 0) {
  result.errors.forEach(e => console.log(e));
} else {
  console.log('No errors');
}

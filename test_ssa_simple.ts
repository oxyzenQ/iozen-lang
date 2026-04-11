import { Lexer } from './src/lib/iozen/lexer';
import { Parser } from './src/lib/iozen/parser';
import { convertASTtoSSA } from './src/lib/iozen/ast_to_ssa';
import * as SSA from './src/lib/iozen/ssa_ir';

const code = `
function test_basic returns integer
    create variable x as integer with value 10
    return x
end
`;

console.log('=== Parsing ===');
const lexer = new Lexer(code);
const tokens = lexer.tokenize();
console.log(`Tokenized ${tokens.length} tokens`);

const parser = new Parser(tokens);
const ast = parser.parse();
console.log(`Parsed ${ast.statements.length} statements`);

console.log('');
console.log('=== Converting to SSA ===');
const ssa = convertASTtoSSA(ast);

console.log(`Converted ${ssa.functions.length} functions`);
console.log('');

for (const func of ssa.functions) {
  console.log(SSA.formatFunction(func));
  console.log('');
}

console.log('=== SSA Conversion Complete ===');

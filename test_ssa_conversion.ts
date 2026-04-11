import { Lexer, Parser, convertASTtoSSA, SSA } from './src/lib/iozen';

const code = `
function test_basic returns integer
    create variable x as integer with value 10
    create variable y as integer with value 20
    create variable z as integer with value x + y
    return z
end

function test_if returns integer
    create variable x as integer with value 10
    when x > 5 do
        set x to x + 1
    else
        set x to x - 1
    end
    return x
end

function test_while returns integer
    create variable i as integer with value 0
    while i < 10 do
        set i to i + 1
    end
    return i
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

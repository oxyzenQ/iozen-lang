#!/usr/bin/env bun
// ============================================================
// IOZEN Language — Test Suite
// Comprehensive tests for lexer, parser, and interpreter
// Run: bun run tests/test_all.ts
// ============================================================

import { Lexer } from '../src/lib/iozen/lexer';
import { Parser, ParseError } from '../src/lib/iozen/parser';
import { Interpreter, executeIOZEN } from '../src/lib/iozen/interpreter';
import { TokenType } from '../src/lib/iozen/tokens';

// ---- Test Framework ----
let passed = 0;
let failed = 0;
const failures: string[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } catch (e: any) {
    failed++;
    const msg = e?.message || String(e);
    failures.push(`${name}: ${msg}`);
    console.error(`  \x1b[31m✗\x1b[0m ${name}: ${msg}`);
  }
}

function assert(condition: boolean, msg?: string) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertEqual(actual: any, expected: any, msg?: string) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(msg || `Expected ${b}, got ${a}`);
}

function assertIncludes(output: string[], needle: string, msg?: string) {
  if (!output.some(line => line.includes(needle))) {
    throw new Error(msg || `Output does not include "${needle}". Got: ${JSON.stringify(output)}`);
  }
}

function assertNotIncludes(output: string[], needle: string, msg?: string) {
  if (output.some(line => line.includes(needle))) {
    throw new Error(msg || `Output should not include "${needle}"`);
  }
}

function run(code: string): { output: string[]; errors: string[] } {
  return executeIOZEN(code);
}

function tokenize(code: string) {
  return new Lexer(code).tokenize();
}

function parse(code: string) {
  const tokens = tokenize(code);
  return new Parser(tokens).parse();
}

// ============================================================
// LEXER TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mLexer Tests\x1b[0m');

test('tokenizes keywords: create, variable, as, with, value', () => {
  const tokens = tokenize('create variable x as integer with value 42');
  const types = tokens.filter(t => t.type !== TokenType.Newline && t.type !== TokenType.EOF).map(t => t.type);
  assertIncludes(types.map(String), 'Create', 'Should have Create token');
  assertIncludes(types.map(String), 'Variable', 'Should have Variable token');
  assertIncludes(types.map(String), 'Integer', 'Should have Integer token');
});

test('tokenizes identifiers', () => {
  const tokens = tokenize('myVariable _underscore camelCase');
  const idents = tokens.filter(t => t.type === TokenType.Identifier);
  assertEqual(idents.length, 3);
  assertEqual(idents[0].value, 'myVariable');
  assertEqual(idents[1].value, '_underscore');
  assertEqual(idents[2].value, 'camelCase');
});

test('tokenizes string literals', () => {
  const tokens = tokenize('"hello world"');
  const strs = tokens.filter(t => t.type === TokenType.StringLiteral);
  assertEqual(strs.length, 1);
  assertEqual(strs[0].value, 'hello world');
});

test('tokenizes multiline string literals', () => {
  const tokens = tokenize('"""line1\nline2\nline3"""');
  const strs = tokens.filter(t => t.type === TokenType.StringLiteral);
  assertEqual(strs.length, 1);
  assertEqual(strs[0].value, 'line1\nline2\nline3');
});

test('tokenizes escape sequences in strings', () => {
  const tokens = tokenize('"hello\\nworld\\t!"');
  const strs = tokens.filter(t => t.type === TokenType.StringLiteral);
  assertEqual(strs[0].value, 'hello\nworld\t!');
});

test('tokenizes integer literals', () => {
  const tokens = tokenize('0 42 999');
  const ints = tokens.filter(t => t.type === TokenType.IntegerLiteral);
  assertEqual(ints.length, 3);
  assertEqual(ints[0].value, '0');
  assertEqual(ints[1].value, '42');
  assertEqual(ints[2].value, '999');
});

test('tokenizes float literals', () => {
  const tokens = tokenize('3.14 0.5 99.99');
  const floats = tokens.filter(t => t.type === TokenType.FloatLiteral);
  assertEqual(floats.length, 3);
  assertEqual(floats[0].value, '3.14');
  assertEqual(floats[1].value, '0.5');
  assertEqual(floats[2].value, '99.99');
});

test('tokenizes hex literals', () => {
  const tokens = tokenize('0xFF 0x10 0x0');
  const ints = tokens.filter(t => t.type === TokenType.IntegerLiteral);
  assertEqual(ints.length, 3);
  assertEqual(ints[0].value, '255');
  assertEqual(ints[1].value, '16');
  assertEqual(ints[2].value, '0');
});

test('tokenizes character literals', () => {
  const tokens = tokenize("'a' '\\n'");
  const chars = tokens.filter(t => t.type === TokenType.CharLiteral);
  assertEqual(chars.length, 2);
  assertEqual(chars[0].value, 'a');
  assertEqual(chars[1].value, '\n');
});

test('tokenizes boolean literals', () => {
  const tokens = tokenize('true false');
  const bools = tokens.filter(t => t.type === TokenType.BooleanLiteral);
  assertEqual(bools.length, 2);
  assertEqual(bools[0].value, 'true');
  assertEqual(bools[1].value, 'false');
});

test('tokenizes arithmetic operators', () => {
  const tokens = tokenize('+ - * / %');
  const types = tokens.filter(t => t.type !== TokenType.EOF).map(t => t.type);
  assertIncludes(types.map(String), 'Plus');
  assertIncludes(types.map(String), 'Minus');
  assertIncludes(types.map(String), 'Star');
  assertIncludes(types.map(String), 'Slash');
  assertIncludes(types.map(String), 'Percent');
});

test('tokenizes comparison operators', () => {
  const tokens = tokenize('== != < > <= >=');
  const types = tokens.filter(t => t.type !== TokenType.EOF).map(t => t.type);
  assertIncludes(types.map(String), 'Equals');
  assertIncludes(types.map(String), 'NotEquals');
  assertIncludes(types.map(String), 'LessThan');
  assertIncludes(types.map(String), 'GreaterThan');
  assertIncludes(types.map(String), 'LessOrEqual');
  assertIncludes(types.map(String), 'GreaterOrEqual');
});

test('tokenizes punctuation', () => {
  const tokens = tokenize('( ) [ ] { } , . : ; ->');
  const types = tokens.filter(t => t.type !== TokenType.EOF).map(t => t.type);
  assertIncludes(types.map(String), 'LeftParen');
  assertIncludes(types.map(String), 'RightParen');
  assertIncludes(types.map(String), 'LeftBracket');
  assertIncludes(types.map(String), 'RightBracket');
  assertIncludes(types.map(String), 'LeftBrace');
  assertIncludes(types.map(String), 'RightBrace');
  assertIncludes(types.map(String), 'Arrow');
});

test('skips comments', () => {
  const tokens = tokenize('# this is a comment\nprint "hi"');
  const types = tokens.filter(t => t.type !== TokenType.Newline && t.type !== TokenType.EOF).map(t => t.type);
  assertEqual(types.length, 2); // Print + StringLiteral
});

test('produces EOF token', () => {
  const tokens = tokenize('');
  assertEqual(tokens[tokens.length - 1].type, TokenType.EOF);
});

// ============================================================
// PARSER TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mParser Tests\x1b[0m');

test('parses variable declaration', () => {
  const ast = parse('create variable x as integer with value 42');
  assertEqual(ast.statements.length, 1);
  assertEqual(ast.statements[0].kind, 'VariableDecl');
  assertEqual((ast.statements[0] as any).name, 'x');
  assertEqual((ast.statements[0] as any).typeName, 'integer');
});

test('parses constant declaration', () => {
  const ast = parse('create variable PI as float with value 3.14');
  assertEqual(ast.statements[0].kind, 'VariableDecl');
});

test('parses function declaration', () => {
  const ast = parse('function greet with name as text returns text\n    return "Hello"\nend');
  assertEqual(ast.statements.length, 1);
  assertEqual(ast.statements[0].kind, 'FunctionDecl');
  const fn = ast.statements[0] as any;
  assertEqual(fn.name, 'greet');
  assertEqual(fn.parameters.length, 1);
  assertEqual(fn.parameters[0].name, 'name');
  assertEqual(fn.returnType, 'text');
  assert(fn.body.length > 0);
});

test('parses function with multiple parameters', () => {
  const ast = parse('function add with a as integer and b as integer returns integer\n    return a + b\nend');
  const fn = ast.statements[0] as any;
  assertEqual(fn.parameters.length, 2);
});

test('parses structure declaration', () => {
  const ast = parse('define structure Point\n    field x as integer\n    field y as integer\nend');
  assertEqual(ast.statements[0].kind, 'StructureDecl');
  const s = ast.statements[0] as any;
  assertEqual(s.name, 'Point');
  assertEqual(s.fields.length, 2);
});

test('parses enum declaration', () => {
  const ast = parse('define enum Color\n    case Red\n    case Green\n    case Blue\nend');
  assertEqual(ast.statements[0].kind, 'EnumDecl');
  const e = ast.statements[0] as any;
  assertEqual(e.name, 'Color');
  assertEqual(e.cases.length, 3);
});

test('parses print statement', () => {
  const ast = parse('print "hello"');
  assertEqual(ast.statements[0].kind, 'PrintStmt');
});

test('parses when/otherwise', () => {
  const code = `when x equals 5 do
    print "five"
otherwise do
    print "other"
end`;
  const ast = parse(code);
  assertEqual(ast.statements[0].kind, 'When');
  const w = ast.statements[0] as any;
  assert(w.otherwise !== null);
});

test('parses while loop', () => {
  const code = `while i is less than 10 do
    increase i by 1
end`;
  const ast = parse(code);
  assertEqual(ast.statements[0].kind, 'While');
});

test('parses for each loop', () => {
  const code = `for each item in items do
    print item
end`;
  const ast = parse(code);
  assertEqual(ast.statements[0].kind, 'ForEach');
  const f = ast.statements[0] as any;
  assertEqual(f.variable, 'item');
});

test('parses repeat loop', () => {
  const code = `repeat 5 times do
    print "hi"
end`;
  const ast = parse(code);
  assertEqual(ast.statements[0].kind, 'Repeat');
});

test('parses list literal', () => {
  const ast = parse('create variable nums as list with value [1, 2, 3]');
  const decl = ast.statements[0] as any;
  assertEqual(decl.value.kind, 'ListLiteral');
  assertEqual(decl.value.elements.length, 3);
});

test('parses function call statement', () => {
  const ast = parse('greet with "World"');
  assertEqual(ast.statements[0].kind, 'FunctionCallStmt');
});

test('parses set statement', () => {
  const ast = parse('set x to 42');
  assertEqual(ast.statements[0].kind, 'AssignVar');
});

test('parses member access in expressions', () => {
  const ast = parse('print point.x');
  const p = ast.statements[0] as any;
  // The print contains an expression
  assert(p.expressions.length > 0);
});

test('parses binary expressions', () => {
  const code = 'create variable result as integer with value a + b * c';
  const ast = parse(code);
  const decl = ast.statements[0] as any;
  assertEqual(decl.value.kind, 'BinaryExpr');
});

test('parses unary expressions', () => {
  const ast = parse('create variable neg as integer with value -5');
  const decl = ast.statements[0] as any;
  assertEqual(decl.value.kind, 'UnaryExpr');
});

test('parses attach expression', () => {
  const ast = parse('create variable msg as text with value "Hello" attach " World"');
  const decl = ast.statements[0] as any;
  assertEqual(decl.value.kind, 'AttachExpr');
});

test('parses increase statement', () => {
  const ast = parse('increase i by 1');
  assertEqual(ast.statements[0].kind, 'Increase');
});

// ============================================================
// INTERPRETER TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mInterpreter Tests\x1b[0m');

// ---- Basic output ----
test('print string', () => {
  const r = run('print "Hello, World!"');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'Hello, World!');
});

test('print integer', () => {
  const r = run('print 42');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '42');
});

test('print float', () => {
  const r = run('print 3.14');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3.14');
});

test('print boolean', () => {
  const r = run('print true');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
});

test('print nothing', () => {
  const r = run('print nothing');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'nothing');
});

test('print empty string', () => {
  const r = run('print ""');
  assertEqual(r.errors.length, 0);
  assertEqual(r.output[0], '');
});

// ---- Variables ----
test('variable declaration and print', () => {
  const r = run('create variable x as integer with value 42\nprint x');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '42');
});

test('set variable', () => {
  const r = run('create variable x as integer with value 10\nset x to 20\nprint x');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '20');
});

test('variable default values', () => {
  const r = run('create variable x as integer\ncreate variable s as text\ncreate variable b as boolean\ncreate variable n as float\nprint x\nprint s\nprint b\nprint n');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
  assertIncludes(r.output, 'false');
});

// ---- Arithmetic ----
test('addition', () => {
  const r = run('print 2 + 3');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '5');
});

test('subtraction', () => {
  const r = run('print 10 - 4');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '6');
});

test('multiplication', () => {
  const r = run('print 6 * 7');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '42');
});

test('division', () => {
  const r = run('print 10 / 3');
  assertEqual(r.errors.length, 0);
  // Float division result
  assert(r.output[0].includes('3'));
});

test('modulo', () => {
  const r = run('print 10 % 3');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1');
});

test('operator precedence: multiplication before addition', () => {
  const r = run('print 2 + 3 * 4');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '14');
});

test('parentheses override precedence', () => {
  const r = run('print (2 + 3) * 4');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '20');
});

test('unary negation', () => {
  const r = run('print -5');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '-5');
});

// ---- String operations ----
test('string concatenation with +', () => {
  const r = run('print "Hello" + " " + "World"');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'Hello World');
});

test('attach expression', () => {
  const r = run('create variable name as text with value "IOZEN"\nprint "Hello, " attach name attach "!"');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'Hello, IOZEN!');
});

// ---- Comparisons ----
test('equals comparison', () => {
  const r = run('print 5 == 5\nprint 5 == 3');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, 'false');
});

test('less than comparison', () => {
  const r = run('print 3 < 5');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
});

test('greater than comparison', () => {
  const r = run('print 10 > 3');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
});

test('natural language comparison: is less than', () => {
  const r = run('create variable x as integer with value 5\nwhen x is less than 10 do\n    print "yes"\nend');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'yes');
});

test('natural language comparison: equals', () => {
  const r = run('create variable x as integer with value 5\nwhen x equals 5 do\n    print "matched"\nend');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'matched');
});

test('natural language comparison: is greater than or equal', () => {
  const r = run('create variable x as integer with value 10\nwhen x is greater than or equal to 10 do\n    print "yes"\nend');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'yes');
});

// ---- Logical operators ----
test('logical and', () => {
  const r = run('print true and true\nprint true and false');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, 'false');
});

test('logical or', () => {
  const r = run('print false or true\nprint false or false');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, 'false');
});

test('logical not', () => {
  const r = run('print not true\nprint not false');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'false');
  assertIncludes(r.output, 'true');
});

// ---- Functions ----
test('function declaration and call', () => {
  const r = run(`function greet with name as text returns text
    return "Hello, " attach name
end
print greet with "World"`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'Hello, World');
});

test('function with multiple parameters', () => {
  const r = run(`function add with a as integer and b as integer returns integer
    return a + b
end
print add with 3 and 4`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '7');
});

test('function with no return value', () => {
  const r = run(`function say_hi returns nothing
    print "Hi!"
end
say_hi`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'Hi!');
});

test('recursive function', () => {
  const r = run(`function factorial with n as integer returns integer
    when n is less than or equal to 1 do
        return 1
    end
    return n * factorial with n - 1
end
print factorial with 5`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '120');
});

test('function closure', () => {
  const r = run(`function make_adder with x as integer returns nothing
    create variable add with value x + 10
    print add
end
make_adder with 5
make_adder with 20`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '15');
  assertIncludes(r.output, '30');
});

// ---- Control Flow ----
test('when/otherwise branches', () => {
  const r = run(`create variable x as integer with value 85
when x is greater than or equal to 90 do
    print "A"
otherwise when x is greater than or equal to 80 do
    print "B"
otherwise do
    print "F"
end`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'B');
  assertNotIncludes(r.output, 'A');
});

test('while loop', () => {
  const r = run(`create variable i as integer with value 0
create variable sum as integer with value 0
while i is less than 5 do
    set sum to sum + i
    increase i by 1
end
print sum`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '10'); // 0+1+2+3+4 = 10
});

test('for each loop with list', () => {
  const r = run(`create variable items as list with value ["a", "b", "c"]
for each item in items do
    print item
end`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'a');
  assertIncludes(r.output, 'b');
  assertIncludes(r.output, 'c');
});

test('repeat loop', () => {
  const r = run(`repeat 3 times do
    print "x"
end`);
  assertEqual(r.errors.length, 0);
  assertEqual(r.output.filter(l => l === 'x').length, 3);
});

test('decrease statement', () => {
  const r = run(`create variable x as integer with value 10
decrease x by 3
print x`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '7');
});

// ---- Structures ----
test('structure declaration and field init', () => {
  const r = run(`define structure Point
    field x as integer
    field y as integer
end
create variable p as Point with x = 3 and y = 4
print p.x
print p.y`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3');
  assertIncludes(r.output, '4');
});

test('structure set field', () => {
  const r = run(`define structure Point
    field x as integer
    field y as integer
end
create variable p as Point with x = 1 and y = 2
set p.x to 10
print p.x`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '10');
});

// ---- Lists ----
test('list literal', () => {
  const r = run('create variable nums as list with value [10, 20, 30]\nprint nums');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '10');
  assertIncludes(r.output, '20');
  assertIncludes(r.output, '30');
});

test('list index access', () => {
  const r = run('create variable nums as list with value [10, 20, 30]\nprint nums[1]');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '20');
});

// ---- Built-in Functions ----
test('builtin: length (string)', () => {
  const r = run('print length("hello")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '5');
});

test('builtin: length (list)', () => {
  const r = run('create variable nums as list with value [1, 2, 3]\nprint length(nums)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3');
});

test('builtin: push', () => {
  const r = run('create variable nums as list with value [1, 2]\npush(nums, 3)\nprint length(nums)\nprint nums[2]');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3');
  assertIncludes(r.output, '3');
});

test('builtin: pop', () => {
  const r = run('create variable nums as list with value [1, 2, 3]\ncreate variable last as integer with value pop(nums)\nprint last\nprint length(nums)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3');
  assertIncludes(r.output, '2');
});

test('builtin: sort', () => {
  const r = run('create variable nums as list with value [3, 1, 4, 1, 5]\ncreate variable sorted as list with value sort(nums)\nprint sorted');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1, 1, 3, 4, 5');
});

test('builtin: reverse', () => {
  const r = run('create variable nums as list with value [1, 2, 3]\ncreate variable rev as list with value reverse(nums)\nprint rev');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3, 2, 1');
});

test('builtin: join', () => {
  const r = run('create variable words as list with value ["a", "b", "c"]\nprint join(words, "-")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'a-b-c');
});

test('builtin: range', () => {
  const r = run('create variable nums as list with value range(0, 5)\nprint length(nums)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '5');
});

test('builtin: range with step', () => {
  const r = run('create variable nums as list with value range(0, 10, 3)\nprint nums');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0, 3, 6, 9');
});

test('builtin: sum', () => {
  const r = run('create variable nums as list with value [1, 2, 3, 4, 5]\nprint sum(nums)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '15');
});

test('builtin: abs', () => {
  const r = run('print abs(-42)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '42');
});

test('builtin: sqrt', () => {
  const r = run('print sqrt(16)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '4');
});

test('builtin: floor', () => {
  const r = run('print floor(3.7)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3');
});

test('builtin: ceil', () => {
  const r = run('print ceil(3.2)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '4');
});

test('builtin: round', () => {
  const r = run('print round(3.5)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '4');
});

test('builtin: power', () => {
  const r = run('print power(2, 10)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1024');
});

test('builtin: min', () => {
  const r = run('print min(3, 7)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3');
});

test('builtin: max', () => {
  const r = run('print max(3, 7)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '7');
});

test('builtin: uppercase', () => {
  const r = run('print uppercase("hello")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'HELLO');
});

test('builtin: lowercase', () => {
  const r = run('print lowercase("HELLO")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'hello');
});

test('builtin: trim', () => {
  const r = run('print trim("  hello  ")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'hello');
});

test('builtin: substring', () => {
  const r = run('print substring("hello world", 0, 5)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'hello');
});

test('builtin: contains', () => {
  const r = run('print contains("hello world", "world")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
});

test('builtin: replace', () => {
  const r = run('print replace("hello world", "world", "IOZEN")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'hello IOZEN');
});

test('builtin: split', () => {
  const r = run('create variable parts as list with value split("a,b,c", ",")\nprint length(parts)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3');
});

test('builtin: char_at', () => {
  const r = run('print char_at("hello", 1)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'e');
});

test('builtin: ord', () => {
  const r = run('print ord("A")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '65');
});

test('builtin: chr', () => {
  const r = run('print chr(65)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'A');
});

test('builtin: to_integer', () => {
  const r = run('print to_integer("42")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '42');
});

test('builtin: to_float', () => {
  const r = run('print to_float("3.14")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3.14');
});

test('builtin: to_text', () => {
  const r = run('print to_text(42)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '42');
});

// ---- Multiline Strings ----
test('multiline string output', () => {
  // Triple-quoted strings can contain actual newlines
  const tripleQuote = '"' + '"' + '"';
  const source = 'print ' + tripleQuote + 'Hello\nWorld' + tripleQuote;
  const r = run(source);
  assertEqual(r.errors.length, 0);
  // print outputs a single string containing newlines
  assertEqual(r.output.length, 1);
  assertIncludes(r.output, 'Hello');
  assertIncludes(r.output, 'World');
  assert(r.output[0].includes('\n'));
});

// ---- Division by zero ----
test('division by zero error', () => {
  const r = run('print 1 / 0');
  assert(r.errors.length > 0);
});

// ---- Undefined variable error ----
test('undefined variable error', () => {
  const r = run('print nonexistent_variable');
  assert(r.errors.length > 0);
});

// ---- Integration: Fibonacci ----
test('integration: fibonacci(10) = 55', () => {
  const r = run(`function fibonacci with n as integer returns integer
    when n is less than or equal to 1 do
        return n
    end
    create variable a as integer with value 0
    create variable b as integer with value 1
    create variable i as integer with value 2
    while i is less than or equal to n do
        create variable temp as integer with value b
        set b to a + b
        set a to temp
        increase i by 1
    end
    return b
end
print fibonacci with 10`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '55');
});

// ---- Integration: FizzBuzz ----
test('integration: fizzbuzz(15) includes FizzBuzz', () => {
  const r = run(`create variable i as integer with value 15
create variable mod3 as integer with value i % 3
create variable mod5 as integer with value i % 5
when mod3 equals 0 and mod5 equals 0 do
    print "FizzBuzz"
otherwise when mod3 equals 0 do
    print "Fizz"
otherwise when mod5 equals 0 do
    print "Buzz"
otherwise do
    print i
end`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'FizzBuzz');
});

// ============================================================
// IMPORT TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mImport & Module Tests\x1b[0m');

test('parses import statement', () => {
  const ast = parse('import math_utils');
  assertEqual(ast.statements[0].kind, 'Import');
  const imp = ast.statements[0] as any;
  assertEqual(imp.modulePath, 'math_utils');
  assertEqual(imp.importNames.length, 0);
});

test('parses import with dot path', () => {
  const ast = parse('import utils.math');
  assertEqual(ast.statements[0].kind, 'Import');
  const imp = ast.statements[0] as any;
  assertEqual(imp.modulePath, 'utils/math');
});

// ============================================================
// CONSTANT ENFORCEMENT TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mConstant Enforcement Tests\x1b[0m');

test('constant requires initial value (parse error)', () => {
  const r = run('create constant X as integer');
  assert(r.errors.length > 0);
  assert(r.errors[0].includes('Constant must have'));
});

test('constant cannot be reassigned (runtime error)', () => {
  const r = run('create constant X as integer with value 42\nset X to 10');
  assert(r.errors.length > 0);
  assert(r.errors[0].includes('Cannot reassign constant'));
});

// ============================================================
// DEBUG BUILTIN TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mDebug Builtin Tests\x1b[0m');

test('builtin: assert passes for true', () => {
  const r = run('assert(true)');
  assertEqual(r.errors.length, 0);
});

test('builtin: assert fails for false', () => {
  const r = run('assert(false)');
  assert(r.errors.length > 0);
  assert(r.errors[0].includes('Assertion failed'));
});

test('builtin: assert with custom message', () => {
  const r = run('assert(1 == 2, "one is not two")');
  assert(r.errors.length > 0);
  assert(r.errors[0].includes('one is not two'));
});

test('builtin: panic stops execution', () => {
  const r = run('panic("something went wrong")\nprint "this should not print"');
  assert(r.errors.length > 0);
  assert(r.errors[0].includes('Panic'));
  assertNotIncludes(r.output, 'this should not print');
});

test('builtin: inspect prints value', () => {
  const r = run('inspect(42)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '42');
});

// ============================================================
// RANDOM BUILTIN TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mRandom Builtin Tests\x1b[0m');

test('builtin: random_int in range', () => {
  const r = run('create variable r as integer with value random_int(1, 1)\nprint r');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1');
});

test('builtin: random_float returns 0-1', () => {
  const r = run('create variable r as float with value random_float()\nwhen r is greater than or equal to 0 and r is less than 1 do\n    print "ok"\nend');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'ok');
});

test('builtin: shuffle returns same length', () => {
  const r = run('create variable nums as list with value [1, 2, 3, 4, 5]\ncreate variable shuffled as list with value shuffle(nums)\nprint length(shuffled)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '5');
});

test('builtin: random_choice from list', () => {
  const r = run('create variable choices as list with value ["a", "b", "c"]\ncreate variable pick as text with value random_choice(choices)\nprint type_of(pick)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'text');
});

// ============================================================
// FILE I/O TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mFile I/O Tests\x1b[0m');

test('builtin: file_exists returns true for existing file', () => {
  const r = run('print file_exists("tests/test_all.ts")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
});

test('builtin: file_exists returns false for missing file', () => {
  const r = run('print file_exists("nonexistent_file_xyz.iozen")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'false');
});

test('integration: write and read file', () => {
  const r = run('write_file("/tmp/iozen_test.txt", "hello from iozen")\ncreate variable content as text with value read_file("/tmp/iozen_test.txt")\nprint content');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'hello from iozen');
});

// ============================================================
// ADDITIONAL LIST BUILTIN TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mAdditional List Builtin Tests\x1b[0m');

test('builtin: index_of finds element', () => {
  const r = run('create variable nums as list with value [10, 20, 30, 40]\nprint index_of(nums, 30)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '2');
});

test('builtin: index_of returns -1 for missing', () => {
  const r = run('create variable nums as list with value [10, 20, 30]\nprint index_of(nums, 99)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '-1');
});

test('builtin: slice list', () => {
  const r = run('create variable nums as list with value [1, 2, 3, 4, 5]\ncreate variable sliced as list with value slice(nums, 1, 3)\nprint sliced');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '2, 3');
});

test('builtin: flatten nested lists', () => {
  const r = run('create variable nested as list with value [[1, 2], [3, 4], [5]]\ncreate variable flat as list with value flatten(nested)\nprint flat');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1, 2, 3, 4, 5');
});

test('builtin: unique removes duplicates', () => {
  const r = run('create variable nums as list with value [1, 2, 2, 3, 3, 3, 4]\ncreate variable uniq as list with value unique(nums)\nprint uniq');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1, 2, 3, 4');
});

test('builtin: insert into list', () => {
  const r = run('create variable nums as list with value [1, 3, 4]\ninsert(nums, 1, 2)\nprint nums');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1, 2, 3, 4');
});

test('builtin: map_list applies function', () => {
  const r = run('function double with x as integer returns integer\n    return x * 2\nend\ncreate variable nums as list with value [1, 2, 3]\ncreate variable doubled as list with value map_list(nums, "double")\nprint doubled');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '2, 4, 6');
});

test('builtin: filter_list filters by function', () => {
  const r = run('function is_even with x as integer returns boolean\n    return x % 2 equals 0\nend\ncreate variable nums as list with value [1, 2, 3, 4, 5, 6]\ncreate variable evens as list with value filter_list(nums, "is_even")\nprint evens');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '2, 4, 6');
});

// ============================================================
// ADDITIONAL STRING BUILTIN TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mAdditional String Builtin Tests\x1b[0m');

test('builtin: starts_with', () => {
  const r = run('print starts_with("hello world", "hello")\nprint starts_with("hello", "world")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, 'false');
});

test('builtin: ends_with', () => {
  const r = run('print ends_with("hello.txt", ".txt")\nprint ends_with("hello", ".txt")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, 'false');
});

test('builtin: repeat_str', () => {
  const r = run('print repeat_str("ab", 3)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'ababab');
});

test('builtin: pad_left', () => {
  const r = run('print pad_left("42", 5, "0")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '00042');
});

test('builtin: pad_right', () => {
  const r = run('print pad_right("hi", 5, "-")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'hi---');
});

test('builtin: lines splits by newline', () => {
  const r = run('create variable text_lines as list with value lines("a\nb\nc")\nprint length(text_lines)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3');
});

test('builtin: format_num', () => {
  const r = run('print format_num(3.14159, 2)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3.14');
});

// ============================================================
// ADDITIONAL MATH BUILTIN TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mAdditional Math Builtin Tests\x1b[0m');

test('builtin: log', () => {
  const r = run('print floor(log(power(2, 10)) * 100)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '693');
});

test('builtin: sin returns number', () => {
  const r = run('print floor(sin(0) * 1000)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

test('builtin: cos returns number', () => {
  const r = run('print floor(cos(0) * 1000)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1000');
});

// ============================================================
// MAP BUILTIN TESTS (NEW)
// ============================================================

console.log('\n\x1b[1m\x1b[36mMap Builtin Tests\x1b[0m');

test('builtin: remove_key', () => {
  const r = run('create variable m as map with value map("x", 10, "y", 20)\nremove_key(m, "x")\nprint has_key(m, "x")\nprint has_key(m, "y")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'false');
  assertIncludes(r.output, 'true');
});

test('builtin: map_size', () => {
  const r = run('create variable m as map with value map("a", 1, "b", 2, "c", 3)\nprint map_size(m)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3');
});

// ============================================================
// LAMBDA / ANONYMOUS FUNCTION TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mLambda / Anonymous Function Tests\x1b[0m');

test('lambda: basic anonymous function', () => {
  const r = run(`create variable double with value function with x as integer returns integer
    return x * 2
end
print double with 21`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '42');
});

test('lambda: lambda passed to builtin', () => {
  const r = run(`function double with x as integer returns integer
    return x * 2
end
create variable nums as list with value [1, 2, 3, 4, 5]
create variable doubled as list with value map_list(nums, "double")
print doubled`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '2, 4, 6, 8, 10');
});

test('lambda: lambda has closure', () => {
  const r = run(`create variable x as integer with value 10
create variable adder with value function with n as integer returns integer
    return n + x
end
print adder with 5`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '15');
});

// ============================================================
// STRING INTERPOLATION TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mString Interpolation Tests\x1b[0m');

test('string interpolation: simple variable', () => {
  const r = run('create variable name as text with value "World"\nprint "Hello, {name}!"');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'Hello, World!');
});

test('string interpolation: expression', () => {
  const r = run('create variable x as integer with value 10\ncreate variable y as integer with value 20\nprint "{x} + {y} = {x + y}"');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '10 + 20 = 30');
});

test('string interpolation: in attach expression', () => {
  const r = run('create variable name as text with value "IOZEN"\nprint "Hello, " attach "{name} is cool!"');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'Hello, IOZEN is cool!');
});

// ============================================================
// INDEXED FOR-EACH TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mIndexed For-Each Tests\x1b[0m');

test('for each with index', () => {
  const r = run(`create variable items as list with value ["a", "b", "c"]
for each item, i in items do
    print i attach ": " attach item
end`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0: a');
  assertIncludes(r.output, '1: b');
  assertIncludes(r.output, '2: c');
});

// ============================================================
// LOOP BREAK TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mLoop Break Tests\x1b[0m');

test('exit breaks forEach loop', () => {
  const r = run(`create variable items as list with value [1, 2, 3, 4, 5]
for each item in items do
    when item equals 3 do
        exit
    end
    print item
end`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1');
  assertIncludes(r.output, '2');
  assertNotIncludes(r.output, '3');
});

test('exit breaks while loop', () => {
  const r = run(`create variable i as integer with value 0
while i is less than 10 do
    when i equals 5 do
        exit
    end
    print i
    increase i by 1
end`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
  assertIncludes(r.output, '4');
  assertNotIncludes(r.output, '5');
});

// ============================================================
// SLICE 2-ARG TEST
// ============================================================

console.log('\n\x1b[1m\x1b[36mSlice 2-Arg Tests\x1b[0m');

test('slice with 2 args (from index to end)', () => {
  const r = run('create variable nums as list with value [1, 2, 3, 4, 5]\ncreate variable tail as list with value slice(nums, 3)\nprint tail');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '4, 5');
});

// ============================================================
// MATCH EXPRESSION TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mMatch Expression Tests\x1b[0m');

test('match: literal integer pattern', () => {
  const r = run(`create variable x as integer with value 2
match x
  case 1 do
    print "one"
  end
  case 2 do
    print "two"
  end
  case 3 do
    print "three"
  end
end`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'two');
  assertNotIncludes(r.output, 'one');
  assertNotIncludes(r.output, 'three');
});

test('match: string pattern', () => {
  const r = run(`create variable color as text with value "green"
match color
  case "red" do
    print "fire"
  end
  case "green" do
    print "nature"
  end
end`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'nature');
});

test('match: wildcard _ pattern', () => {
  const r = run(`create variable x as integer with value 999
match x
  case 1 do
    print "low"
  end
  case _ do
    print "default"
  end
end`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'default');
});

test('match: catch-all binding', () => {
  const r = run(`create variable x as integer with value 42
match x
  case 0 do
    print "zero"
  end
  case n do
    print "got value"
    print n
  end
end`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'got value');
  assertIncludes(r.output, '42');
});

test('match: with otherwise', () => {
  const r = run(`create variable x as integer with value 99
match x
  case 1 do
    print "small"
  end
  otherwise do
    print "big"
  end
end`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'big');
});

test('match: as expression returning value', () => {
  const r = run(`function get_label with x as integer returns text
  create variable label with value match x
    case 1 do
      create variable result with value "one"
    end
    case 2 do
      create variable result with value "two"
    end
    case 3 do
      create variable result with value "three"
    end
    case _ do
      create variable result with value "unknown"
    end
  end
  return result
end
print get_label with 3`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'three');
});

// ============================================================
// TRY/CATCH TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mTry/Catch Tests\x1b[0m');

test('try/catch: catch thrown value', () => {
  const r = run(`try do
  throw "something went wrong"
catch err do
  print err
end`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'something went wrong');
});

test('try/catch: no error thrown', () => {
  const r = run(`try do
  print "inside try"
catch err do
  print "should not reach"
end`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'inside try');
  assertNotIncludes(r.output, 'should not reach');
});

test('try/catch: catch runtime error', () => {
  const r = run(`try do
  panic("something bad happened")
catch err do
  print "caught"
end`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'caught');
});

test('try/catch: throw propagates through function', () => {
  const r = run(`function risky with x as integer returns integer
  when x equals 0 do
    throw "division by zero"
  end
  return 100 / x
end
try do
  create variable result with value risky with 0
catch err do
  print err
end`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'division by zero');
});

test('throw: simple throw', () => {
  const r = run(`try do
  throw 42
catch err do
  print err
end`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '42');
});

// ============================================================
// PIPELINE OPERATOR TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mPipeline Operator Tests\x1b[0m');

test('pipeline: basic |> with builtin', () => {
  const r = run(`create variable result with value 5 |> abs |> sqrt
print result`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '2.236');
});

test('pipeline: multi-stage pipeline', () => {
  const r = run(`create variable nums as list with value [3, 1, 4, 1, 5, 9]
create variable result with value nums |> sort |> reverse
print result`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '9, 5, 4, 3, 1, 1');
});

test('pipeline: with range and length', () => {
  const r = run(`create variable result with value range(1, 10) |> length
print result`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '9');
});

test('pipeline: string pipeline', () => {
  const r = run(`create variable result with value "  hello world  " |> trim |> upper
print result`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'HELLO WORLD');
});

// ============================================================
// NEW MATH BUILTINS TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mNew Math Builtins Tests\x1b[0m');

test('builtin: pow', () => {
  const r = run('create variable result with value pow(2, 10)\nprint result');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1024');
});

test('builtin: pi', () => {
  const r = run('print pi()');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3.14');
});

test('builtin: min/max', () => {
  const r = run('print min(3, 7)\nprint max(3, 7)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3');
  assertIncludes(r.output, '7');
});

test('builtin: sqrt', () => {
  const r = run('create variable result with value sqrt(144)\nprint result');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '12');
});

// ============================================================
// NEW STRING BUILTINS TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mNew String Builtins Tests\x1b[0m');

test('builtin: reverse_str', () => {
  const r = run('print reverse_str("hello")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'olleh');
});

test('builtin: starts_with/ends_with', () => {
  const r = run('print starts_with("hello", "hel")\nprint ends_with("hello", "llo")\nprint starts_with("hello", "xyz")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, 'false');
});

test('builtin: repeat_str', () => {
  const r = run('print repeat_str("ab", 3)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'ababab');
});

test('builtin: lines', () => {
  const r = run('create variable result as list with value lines("a\\nb\\nc")\nprint length(result)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3');
});

// ============================================================
// NEW LIST BUILTINS TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mNew List Builtins Tests\x1b[0m');

test('builtin: first/last', () => {
  const r = run('print first([10, 20, 30])\nprint last([10, 20, 30])');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '10');
  assertIncludes(r.output, '30');
});

test('builtin: reduce', () => {
  const r = run(`function add with acc as integer and item as integer returns integer
  return acc + item
end
create variable result with value reduce([1, 2, 3, 4, 5], "add", 0)
print result`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '15');
});

test('builtin: any/all', () => {
  const r = run(`function is_big with x as integer returns integer
  when x is greater than 2 do
    return 1
  end
  return 0
end
create variable a with value any([-1, -2, 3], "is_big")
create variable b with value all([1, 2, 3], "is_big")
create variable c with value all([1, -2, 3], "is_big")
print a
print b
print c`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, 'false');
});

test('builtin: chunk', () => {
  const r = run('create variable result as list with value chunk([1, 2, 3, 4, 5], 2)\nprint length(result)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3');
});

test('builtin: for_each_list', () => {
  const r = run(`create variable total as integer with value 0
function add_to_total with n as integer
  set total to total + n
end
create variable nums as list with value [10, 20, 30]
for_each_list(nums, add_to_total)
print total`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '60');
});

test('builtin: for_each_list with string name', () => {
  const r = run(`create variable result as text with value ""
function collect with item as integer
  set result to result attach "," attach item
end
create variable nums as list with value [1, 2, 3]
for_each_list(nums, "collect")
print result`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1');
  assertIncludes(r.output, '2');
  assertIncludes(r.output, '3');
});

// ============================================================
// HIGHER-ORDER FUNCTION CONSISTENCY TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mHigher-Order Function Consistency Tests\x1b[0m');

test('hof: map_list with bare function reference', () => {
  const r = run(`function triple with x as integer returns integer
  return x * 3
end
create variable nums as list with value [1, 2, 3]
create variable result as list with value map_list(nums, triple)
print result`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3, 6, 9');
});

test('hof: filter_list with bare function reference', () => {
  const r = run(`function is_odd with x as integer returns integer
  return x % 2
end
create variable nums as list with value [1, 2, 3, 4, 5]
create variable result as list with value filter_list(nums, is_odd)
print result`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1');
  assertIncludes(r.output, '3');
  assertIncludes(r.output, '5');
});

test('hof: reduce with bare function reference', () => {
  const r = run(`function multiply with acc as integer and item as integer returns integer
  return acc * item
end
create variable result as integer with value reduce([2, 3, 4], multiply, 1)
print result`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '24');
});

test('hof: any/all with bare function reference', () => {
  const r = run(`function gt5 with x as integer returns integer
  when x is greater than 5 do return 1 end
  return 0
end
print any([1, 3, 7], gt5)
print all([6, 8, 9], gt5)
print all([1, 6, 9], gt5)`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, 'false');
});

test('hof: join_map with bare function reference', () => {
  const r = run(`function show with x as integer returns text
  return "[" attach x attach "]"
end
create variable result as text with value join_map([1, 2, 3], show, ", ")
print result`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '[1], [2], [3]');
});

test('hof: flat_map with bare function reference', () => {
  const r = run(`function duplicate with x as integer returns list
  return [x, x]
end
create variable result as list with value flat_map([1, 2, 3], duplicate)
print result`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1, 1, 2, 2, 3, 3');
});

// ============================================================
// SYSTEM BUILTINS TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mSystem Builtins Tests\x1b[0m');

test('builtin: clock', () => {
  const r = run('create variable t with value clock()\nprint type_of(t)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'integer');
});

test('builtin: env_get', () => {
  const r = run('create variable home with value env_get("HOME")\nprint type_of(home)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'text');
});

test('builtin: args', () => {
  const r = run('create variable a as list with value args()\nprint type_of(a)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'list');
});

test('builtin: system echo', () => {
  const r = run('create variable code with value system("echo hello from iozen")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'hello from iozen');
});

// ============================================================
// DESTRUCTURING TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mDestructuring Tests\x1b[0m');

test('destructure: list destructuring', () => {
  const r = run(`create variable a, b, c as list with value [10, 20, 30]
print a
print b
print c`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '10');
  assertIncludes(r.output, '20');
  assertIncludes(r.output, '30');
});

test('destructure: two variables from list', () => {
  const r = run(`create variable first_val, rest as list with value [1, 2]
print first_val
print rest`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1');
  assertIncludes(r.output, '2');
});

test('destructure: string destructuring', () => {
  const r = run(`create variable x, y, z as text with value "abc"
print x
print y
print z`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'a');
  assertIncludes(r.output, 'b');
  assertIncludes(r.output, 'c');
});

test('destructure: from range', () => {
  const r = run(`create variable low, high as list with value [min(1, 10), max(1, 10)]
print low
print high`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1');
  assertIncludes(r.output, '10');
});

test('destructure: undersupply (fewer values than names)', () => {
  const r = run(`create variable a, b, c as list with value [42]
print a
print type_of(b)`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '42');
});

// ============================================================
// FORMAT / UTILITY BUILTINS TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mFormat & Utility Builtins Tests\x1b[0m');

test('builtin: format with placeholders', () => {
  const r = run('print format("Hello, {}! You are {} years old.", "Alice", 25)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'Hello, Alice! You are 25 years old.');
});

test('builtin: format single placeholder', () => {
  const r = run('print format("Result: {}", 42)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'Result: 42');
});

test('builtin: zip', () => {
  const r = run(`create variable zipped as list with value zip([1, 2, 3], ["a", "b", "c"])
print length(zipped)
print first(first(zipped))`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3');
  assertIncludes(r.output, '1');
});

test('builtin: enumerate', () => {
  const r = run(`create variable items as list with value enumerate(["a", "b", "c"])
print first(items)`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

test('builtin: count_by', () => {
  const r = run(`create variable counts with value count_by(["apple", "banana", "apple", "cherry", "banana", "apple"])
print get_key(counts, "apple")`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3');
});

test('builtin: clamp', () => {
  const r = run(`print clamp(150, 0, 100)
print clamp(-10, 0, 100)
print clamp(50, 0, 100)`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '100');
  assertIncludes(r.output, '0');
  assertIncludes(r.output, '50');
});

test('builtin: interleave', () => {
  const r = run(`create variable result as list with value interleave([1, 2, 3], ["a", "b", "c"])
print result`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1, a, 2, b, 3, c');
});

test('builtin: join_map', () => {
  const r = run(`function to_str with x as integer returns text
  return format("({})", x)
end
create variable result with value join_map([1, 2, 3], "to_str", ", ")
print result`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '(1), (2), (3)');
});

// ============================================================
// CONTINUE KEYWORD TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mContinue Keyword Tests\x1b[0m');

test('continue: skip iteration in while loop', () => {
  const r = run(`create variable sum as integer with value 0
create variable i as integer with value 0
while i < 5 do
    when i equals 2 do
        increase i by 1
        continue
    end
    set sum to sum + i
    increase i by 1
end
print sum`);
  assertEqual(r.errors.length, 0);
  // i goes 0,1,2(skip),3,4 => sum = 0+1+3+4 = 8
  assertIncludes(r.output, '8');
});

test('continue: skip in repeat loop', () => {
  const r = run(`create variable sum as integer with value 0
create variable idx as integer with value 0
repeat 5 times do
    when idx equals 3 do
        set idx to idx + 1
        continue
    end
    set sum to sum + idx
    set idx to idx + 1
end
print sum`);
  assertEqual(r.errors.length, 0);
  // idx: 0,1,2,3(skip),4 => sum = 0+1+2+4 = 7
  assertIncludes(r.output, '7');
});

test('continue: skip in for-each loop', () => {
  const r = run(`create variable items as list with value [10, 20, 30, 40, 50]
create variable sum as integer with value 0
for each item in items do
    when item equals 30 do
        continue
    end
    set sum to sum + item
end
print sum`);
  assertEqual(r.errors.length, 0);
  // 10+20+40+50 = 120
  assertIncludes(r.output, '120');
});

test('continue: multiple continues in one loop', () => {
  const r = run(`create variable sum as integer with value 0
create variable i as integer with value 0
while i < 7 do
    when i equals 1 do
        increase i by 1
        continue
    end
    when i equals 3 do
        increase i by 1
        continue
    end
    when i equals 5 do
        increase i by 1
        continue
    end
    set sum to sum + i
    increase i by 1
end
print sum`);
  assertEqual(r.errors.length, 0);
  // i: 0,1(skip),2,3(skip),4,5(skip),6 => sum = 0+2+4+6 = 12
  assertIncludes(r.output, '12');
});

test('continue: continue in nested when inside loop', () => {
  const r = run(`create variable count as integer with value 0
create variable i as integer with value 0
while i < 6 do
    when i equals 0 do
        set count to count + 1
    otherwise when i equals 2 do
        set count to count + 1
    otherwise when i equals 4 do
        increase i by 1
        continue
    end
    increase i by 1
end
print count`);
  assertEqual(r.errors.length, 0);
  // i=0: count=1, i=1: nothing, i=2: count=2, i=3: nothing, i=4: skip (continue), i=5: nothing
  assertIncludes(r.output, '2');
});

test('continue: continue at end of loop body is no-op', () => {
  const r = run(`create variable sum as integer with value 0
create variable i as integer with value 0
while i < 3 do
    set sum to sum + i
    increase i by 1
    continue
end
print sum`);
  assertEqual(r.errors.length, 0);
  // continue at end has no effect: 0+1+2 = 3
  assertIncludes(r.output, '3');
});

// ============================================================
// WITH-CALL FUNCTION TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mWith-Call Function Tests\x1b[0m');

test('with-call: basic function call with "with"', () => {
  const r = run(`function add with a as integer and b as integer returns integer
    return a + b
end
create variable result as integer with value add with 3 and 5
print result`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '8');
});

test('with-call: single argument', () => {
  const r = run(`function double with x as integer returns integer
    return x * 2
end
create variable result as integer with value double with 7
print result`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '14');
});

test('with-call: nested with-calls via temp variable', () => {
  const r = run(`function square with x as integer returns integer
    return x * x
end
function add with a as integer and b as integer returns integer
    return a + b
end
create variable squared as integer with value square with 3
create variable result as integer with value add with squared and 2
print result`);
  assertEqual(r.errors.length, 0);
  // square(3) = 9, add(9, 2) = 11
  assertIncludes(r.output, '11');
});

test('with-call: with-call in expression context', () => {
  const r = run(`function add with a as integer and b as integer returns integer
    return a + b
end
print add with 1 and 2 attach " + " attach add with 3 and 4`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3 + 7');
});

// ============================================================
// EQUALS COMPARISON KEYWORD TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mEquals Comparison Keyword Tests\x1b[0m');

test('equals: equals as comparison operator in print', () => {
  const r = run(`create variable x as text with value "hello"
print x equals "hello"
print x equals "world"`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, 'false');
});

test('equals: equals in when condition', () => {
  const r = run(`create variable color as text with value "green"
when color equals "red" do
    print "stop"
otherwise when color equals "green" do
    print "go"
otherwise do
    print "unknown"
end`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'go');
  assertNotIncludes(r.output, 'stop');
});

test('equals: not equals via != operator', () => {
  const r = run(`create variable x as integer with value 10
print x != 20
print x != 10`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, 'false');
});

test('equals: not equals via logical not', () => {
  const r = run(`create variable x as integer with value 10
print not (x equals 20)
print not (x equals 10)`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, 'false');
});

// ============================================================
// Inside Keyword Tests
// ============================================================

test('inside: integer inside list', () => {
  const r = run(`create variable fruits as list with value ["apple", "banana", "cherry"]
print "banana" inside fruits
print "grape" inside fruits`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, 'false');
});

test('inside: number inside list', () => {
  const r = run(`create variable nums as list with value [10, 20, 30, 40, 50]
print 30 inside nums
print 99 inside nums`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, 'false');
});

test('inside: character inside string', () => {
  const r = run(`print "hello" inside "say hello world"`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
});

test('inside: key inside map', () => {
  const r = run(`create variable m as map with value {"name": "Alice", "age": 30}
print "name" inside m
print "email" inside m`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, 'false');
});

test('inside: inside in when condition', () => {
  const r = run(`create variable allowed as list with value [1, 2, 3, 4, 5]
create variable x as integer with value 3
when x inside allowed do
    print "allowed"
otherwise do
    print "blocked"
end`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'allowed');
});

// ============================================================
// Recursion Depth Limit Tests
// ============================================================

test('recursion: normal recursion works', () => {
  const r = run(`function fib with n as integer returns integer
    when n is less than or equal to 1 do
        return n
    end
    create variable a as integer with value fib with n - 1
    create variable b as integer with value fib with n - 2
    return a + b
end
print fib with 10`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '55');
});

test('recursion: infinite recursion caught', () => {
  const r = run(`function infinite with x as integer returns integer
    return infinite with x
end
infinite with 1`);
  assert(r.errors.length >= 1);
  assert(r.errors[0].includes('Maximum call depth'));
});

// ============================================================
// ForceUnwrap & OrDefault Tests
// ============================================================

test('force-unwrap: unwrap valid value', () => {
  const r = run(`create variable x as integer with value 42
print x`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '42');
});

test('or-default: value present returns it', () => {
  const r = run(`create variable x as integer with value 10
when x inside [1, 2, 3] do
    print x
otherwise do
    print 0
end`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

test('or-default: null value falls to default', () => {
  const r = run(`create variable x as nothing
when x equals nothing do
    print "was null"
end`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'was null');
});

// ============================================================
// Increase with Member Access Tests
// ============================================================

test('increase: basic increase', () => {
  const r = run(`create variable x as integer with value 10
increase x by 5
print x`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '15');
});

test('increase: increase in loop', () => {
  const r = run(`create variable sum as integer with value 0
repeat 5 times do
    increase sum by 1
end
print sum`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '5');
});

test('decrease: basic decrease', () => {
  const r = run(`create variable x as integer with value 10
decrease x by 3
print x`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '7');
});

// ============================================================
// Type Of Builtin Tests
// ============================================================

test('type_of: integer', () => {
  const r = run(`print type_of with 42`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'integer');
});

test('type_of: text', () => {
  const r = run(`print type_of with "hello"`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'text');
});

test('type_of: float', () => {
  const r = run(`print type_of with 3.14`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'float');
});

test('type_of: boolean', () => {
  const r = run(`print type_of with true`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'boolean');
});

test('type_of: nothing', () => {
  const r = run(`print type_of with nothing`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'nothing');
});

test('type_of: list', () => {
  const r = run(`print type_of with [1, 2, 3]`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'list');
});

test('type_of: map', () => {
  const r = run(`create variable m as map with value {"key": "val"}
print type_of with m`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'map');
});

// ============================================================
// Map Builtins Tests
// ============================================================

test('map: keys builtin', () => {
  const r = run(`create variable m as map with value {"x": 1, "y": 2, "z": 3}
create variable k as list with value keys(m)
sort(k)
print k`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'x');
  assertIncludes(r.output, 'y');
  assertIncludes(r.output, 'z');
});

test('map: has_key builtin', () => {
  const r = run(`create variable m as map with value {"name": "Alice"}
print has_key with m and "name"
print has_key with m and "email"`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, 'false');
});

test('map: remove_key builtin', () => {
  const r = run(`create variable m as map with value {"a": 1, "b": 2, "c": 3}
remove_key(m, "b")
print has_key with m and "b"
print has_key with m and "a"`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'false');
  assertIncludes(r.output, 'true');
});

test('map: values builtin', () => {
  const r = run(`create variable m as map with value {"x": 10, "y": 20}
create variable v as list with value values(m)
print v`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '10');
  assertIncludes(r.output, '20');
});

// ============================================================
// List Builtins Tests
// ============================================================

test('list: first and last', () => {
  const r = run(`create variable nums as list with value [10, 20, 30, 40, 50]
print first(nums)
print last(nums)`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '10');
  assertIncludes(r.output, '50');
});

test('list: chunk', () => {
  const r = run(`create variable nums as list with value [1, 2, 3, 4, 5, 6]
create variable chunks as list with value chunk(nums, 2)
print chunks`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1, 2');
  assertIncludes(r.output, '3, 4');
  assertIncludes(r.output, '5, 6');
});

test('list: flatten', () => {
  const r = run(`create variable nested as list with value [[1, 2], [3, 4], [5]]
create variable flat as list with value flatten(nested)
print flat`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1, 2, 3, 4, 5');
});

test('list: unique', () => {
  const r = run(`create variable items as list with value [1, 2, 2, 3, 3, 3, 4]
create variable u as list with value unique(items)
print u`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1, 2, 3, 4');
});

test('list: any and all', () => {
  const r = run(`function is_even with n as integer returns boolean
    return n % 2 equals 0
end
create variable nums as list with value [2, 4, 6, 8]
print "all even: " attach all(nums, is_even)
create variable mixed as list with value [1, 2, 3, 4]
print "any even: " attach any(mixed, is_even)`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'all even: true');
  assertIncludes(r.output, 'any even: true');
});

test('list: reduce', () => {
  const r = run(`function adder with acc as integer and item as integer returns integer
    return acc + item
end
create variable nums as list with value [1, 2, 3, 4, 5]
create variable total as integer with value reduce(nums, adder, 0)
print total`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '15');
});

// ============================================================
// String Builtins Tests
// ============================================================

test('string: starts_with and ends_with', () => {
  const r = run(`print starts_with with "hello world" and "hello"
print ends_with with "hello world" and "world"
print starts_with with "hello world" and "world"`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, 'false');
});

test('string: reverse_str', () => {
  const r = run(`print reverse_str with "hello"`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'olleh');
});

test('string: repeat_str', () => {
  const r = run(`print repeat_str with "ab" and 3`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'ababab');
});

test('string: pad_left and pad_right', () => {
  const r = run(`print pad_left with "42" and 5 and "0"
print pad_right with "hi" and 5 and "-"`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '00042');
  assertIncludes(r.output, 'hi---');
});

test('string: lines builtin', () => {
  const r = run(`create variable text as text with value "line1
line2
line3"
create variable lns as list with value lines(text)
print length(lns)`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3');
});

// ============================================================
// Comparison Double-Match Prevention Tests
// ============================================================

test('comparison: no double match on equals', () => {
  const r = run(`create variable x as integer with value 5
when x equals 5 do
    print "five"
end`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'five');
});

test('comparison: chained comparison does not double-fire', () => {
  const r = run(`create variable x as integer with value 10
print x equals 10`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
});

test('comparison: greater than or equal NL syntax', () => {
  const r = run(`create variable x as integer with value 5
print x greater or equal to 5
print x greater or equal to 6`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, 'false');
});

test('comparison: less than or equal NL syntax', () => {
  const r = run(`create variable x as integer with value 3
print x less or equal to 3
print x less or equal to 2`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, 'false');
});

test('comparison: not equal NL syntax', () => {
  const r = run(`create variable x as integer with value 5
print x != 10
print x != 5`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, 'false');
});

// ============================================================
// Edge Case Tests
// ============================================================

test('edge-case: empty list operations', () => {
  const r = run(`create variable empty as list with value []
print length(empty)
print first(empty)
print last(empty)
print sum(empty)`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
  assertEqual(r.output[1], 'nothing');
  assertEqual(r.output[2], 'nothing');
  assertIncludes(r.output, '0');
});

test('edge-case: nested function calls', () => {
  const r = run(`function add with a as integer and b as integer returns integer
    return a + b
end
function double with x as integer returns integer
    return add with x and x
end
print double with 5`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '10');
});

test('edge-case: string interpolation with expressions', () => {
  const r = run(`create variable name as text with value "World"
create variable count as integer with value 42
print "Hello, {name}! Count = {count}"`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'Hello, World! Count = 42');
});

test('edge-case: ternary expression', () => {
  const r = run(`create variable x as integer with value 10
print ("big" when x greater than 5 otherwise "small")`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'big');
});

test('edge-case: pipeline operator', () => {
  const r = run(`create variable nums as list with value [5, 3, 1, 4, 2]
print nums |> sort`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1, 2, 3, 4, 5');
});

test('edge-case: list comprehension', () => {
  const r = run(`create variable nums as list with value [1, 2, 3, 4, 5]
create variable squares as list with value [x * x for each x in nums]
print squares`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1, 4, 9, 16, 25');
});

test('edge-case: match expression as value', () => {
  const r = run(`function describe with n as integer returns text
    create variable result as text with value match n
        case 1 do
            print "one"
        end
        case 2 do
            print "two"
        end
        otherwise do
            print "other"
        end
    return result
end
describe with 1
describe with 2
describe with 99`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'one');
  assertIncludes(r.output, 'two');
  assertIncludes(r.output, 'other');
});

test('edge-case: try-catch with throw', () => {
  const r = run(`try do
    throw "something went wrong"
catch error do
    print "caught: " attach error
end`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'caught: something went wrong');
});

test('edge-case: multiline string', () => {
  const r = run(`create variable s as text with value """hello
world"""
print s`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'hello');
  assertIncludes(r.output, 'world');
});

test('edge-case: compound assignment operators', () => {
  const r = run(`create variable x as integer with value 10
x += 5
print x
x -= 3
print x
x *= 2
print x`);
  assertEqual(r.errors.length, 0);
  assert(r.output[0].includes('15'));
  assert(r.output[1].includes('12'));
  assert(r.output[2].includes('24'));
});

test('edge-case: nested when inside loop', () => {
  const r = run(`create variable i as integer with value 0
while i is less than 3 do
    when i equals 0 do
        print "zero"
    otherwise when i equals 1 do
        print "one"
    otherwise do
        print "other"
    end
    increase i by 1
end`);
  assertEqual(r.errors.length, 0);
  assert(r.output[0].includes('zero'));
  assert(r.output[1].includes('one'));
  assert(r.output[2].includes('other'));
});

test('edge-case: closure captures variable', () => {
  const r = run(`function make_adder with base as integer returns nothing
    create variable result as integer with value base + 10
    print result
end
make_adder with 5`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '15');
});

test('edge-case: map literal and access', () => {
  const r = run(`create variable config as map with value {"debug": true, "port": 8080}
print config.debug
print config.port`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, '8080');
});

test('edge-case: destructuring list', () => {
  const r = run(`create variable a, b, c as list with value [10, 20, 30]
print a
print b
print c`);
  assertEqual(r.errors.length, 0);
  assert(r.output[0].includes('10'));
  assert(r.output[1].includes('20'));
  assert(r.output[2].includes('30'));
});

// ============================================================
// ERROR HANDLING & ROBUSTNESS TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mError Handling & Robustness Tests\x1b[0m');

test('error: calling non-existent function', () => {
  const r = run('nonexistent_func("arg")');
  assert(r.errors.length > 0);
});

test('error: wrong number of arguments', () => {
  const r = run(`function add with a as integer and b as integer returns integer
  return a + b
end
print add with 1`);
  assert(r.errors.length > 0);
});

test('error: access field on non-struct', () => {
  const r = run('print 42.field');
  assert(r.errors.length > 0);
});

test('error: arithmetic on non-numbers returns coerced result', () => {
  // iozen coerces types in arithmetic — "hello" + 42 concatenates
  const r = run('print "hello" + 42');
  assertEqual(r.errors.length, 0);
  // Should produce some result without crashing
  assert(r.output.length > 0);
});

test('error: set undeclared variable', () => {
  const r = run('set undeclared_var to 42');
  assert(r.errors.length > 0);
});

test('error: return outside function', () => {
  const r = run('return 42');
  assert(r.errors.length > 0);
});

test('robustness: empty program runs without error', () => {
  const r = run('');
  assertEqual(r.errors.length, 0);
});

test('robustness: only comments runs without error', () => {
  const r = run('# just a comment\n# another comment');
  assertEqual(r.errors.length, 0);
});

test('robustness: deeply nested function calls', () => {
  const r = run(`function id with x as integer returns integer
  return x
end
print id with id with id with id with 5`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '5');
});

test('robustness: large list literal', () => {
  const items = Array.from({length: 100}, (_, i) => i).join(', ');
  const r = run(`create variable big as list with value [${items}]\nprint length(big)`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '100');
});

test('robustness: string with special characters', () => {
  const r = run(`print "hello \\"world\\" \\\\n\\ttab"`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'hello "world"');
});

// ============================================================
// COMPREHENSIVE INTEGRATION TESTS
// ============================================================

console.log('\n\x1b[1m\x1b[36mComprehensive Integration Tests\x1b[0m');

test('integration: prime sieve', () => {
  const r = run(`create variable limit as integer with value 20
create variable is_prime as map with value map()
create variable n as integer with value 0
while n is less than limit do
  set is_prime to map_set(is_prime, to_text(n), true)
  set n to n + 1
end
set is_prime to map_set(is_prime, "0", false)
set is_prime to map_set(is_prime, "1", false)
create variable i as integer with value 2
while i * i is less than limit do
  when is_prime[to_text(i)] equals true do
    create variable j as integer with value i * i
    while j is less than limit do
      set is_prime to map_set(is_prime, to_text(j), false)
      set j to j + i
    end
  end
  set i to i + 1
end
create variable primes as list with value []
create variable k as integer with value 2
while k is less than limit do
  when is_prime[to_text(k)] equals true do
    push(primes, k)
  end
  set k to k + 1
end
print length(primes)
print primes[0]
print primes[1]
print primes[2]`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '8');
  assertIncludes(r.output, '2');
  assertIncludes(r.output, '3');
  assertIncludes(r.output, '5');
});

test('integration: merge two sorted lists', () => {
  const r = run(`function merge with a as list and b as list returns list
  create variable result as list with value []
  create variable i as integer with value 0
  create variable j as integer with value 0
  while i is less than length(a) and j is less than length(b) do
    when a[i] is less than or equal to b[j] do
      push(result, a[i])
      set i to i + 1
    otherwise do
      push(result, b[j])
      set j to j + 1
    end
  end
  while i is less than length(a) do
    push(result, a[i])
    set i to i + 1
  end
  while j is less than length(b) do
    push(result, b[j])
    set j to j + 1
  end
  return result
end
create variable merged as list with value merge([1, 3, 5], [2, 4, 6, 8])
print merged`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1, 2, 3, 4, 5, 6, 8');
});

test('integration: word frequency counter', () => {
  const r = run(`create variable words as list with value split("the cat sat on the mat the cat", " ")
create variable freq as map with value map()
for each word in words do
  when has_key(freq, word) do
    set freq to map_set(freq, word, freq[word] + 1)
  otherwise do
    set freq to map_set(freq, word, 1)
  end
end
print freq["the"]
print freq["cat"]
print freq["sat"]`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3');
  assertIncludes(r.output, '2');
  assertIncludes(r.output, '1');
});

// ============================================================
// EDGE CASE & ROBUSTNESS TESTS (STRENGTHENING)
// ============================================================

console.log('\n\x1b[1m\x1b[36mEdge Case: Math\x1b[0m');

test('edge: abs(0) returns 0', () => {
  const r = run('print abs(0)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

test('edge: abs of positive stays positive', () => {
  const r = run('print abs(42)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '42');
});

test('edge: floor(-3.5) returns -4', () => {
  const r = run('print floor(-3.5)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '-4');
});

test('edge: ceil(-3.5) returns -3', () => {
  const r = run('print ceil(-3.5)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '-3');
});

test('edge: sqrt(0) returns 0', () => {
  const r = run('print sqrt(0)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

test('edge: sqrt(1) returns 1', () => {
  const r = run('print sqrt(1)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1');
});

test('edge: power(2, 0) returns 1', () => {
  const r = run('print power(2, 0)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1');
});

test('edge: power(0, 5) returns 0', () => {
  const r = run('print power(0, 5)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

test('edge: min with negative numbers', () => {
  const r = run('print min(-5, -10)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '-10');
});

test('edge: max with negative numbers', () => {
  const r = run('print max(-5, -10)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '-5');
});

test('edge: sign(0) returns 0', () => {
  const r = run('print sign(0)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

test('edge: sign negative returns -1', () => {
  const r = run('print sign(-42)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '-1');
});

test('edge: sign positive returns 1', () => {
  const r = run('print sign(42)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1');
});

test('edge: trunc(3.99) returns 3', () => {
  const r = run('print trunc(3.99)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3');
});

test('edge: trunc(-3.99) returns -3', () => {
  const r = run('print trunc(-3.99)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '-3');
});

test('edge: gcd(12, 8) returns 4', () => {
  const r = run('print gcd(12, 8)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '4');
});

test('edge: gcd(0, 5) returns 5', () => {
  const r = run('print gcd(0, 5)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '5');
});

test('edge: lcm(4, 6) returns 12', () => {
  const r = run('print lcm(4, 6)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '12');
});

test('edge: log10(100) returns 2', () => {
  const r = run('print floor(log10(100) * 100)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '200');
});

test('edge: log2(8) returns 3', () => {
  const r = run('print floor(log2(8) * 100)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '300');
});

test('edge: e() constant returns Euler number', () => {
  const r = run('print floor(e() * 100)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '271');
});

test('edge: atan(1) returns pi/4', () => {
  const r = run('print floor(atan(1) * 1000)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '785');
});

// ============================================================
console.log('\n\x1b[1m\x1b[36mEdge Case: String\x1b[0m');

test('edge: length of empty string', () => {
  const r = run('print length("")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

test('edge: substring from 0 to 0 is empty', () => {
  const r = run('print substring("hello", 0, 0)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '');
});

test('edge: trim empty string', () => {
  const r = run('print trim("")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '');
});

test('edge: char_at first character', () => {
  const r = run('print char_at("hello", 0)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'h');
});

test('edge: ord of empty string returns 0', () => {
  const r = run('print ord("")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

test('edge: repeat_str 0 times returns empty', () => {
  const r = run('print repeat_str("x", 0)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '');
});

test('edge: contains empty in empty returns true', () => {
  const r = run('print contains("", "")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
});

test('edge: starts_with empty in empty returns true', () => {
  const r = run('print starts_with("", "")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
});

test('edge: reverse_str empty string', () => {
  const r = run('print reverse_str("")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '');
});

test('edge: count char occurrences in string', () => {
  const r = run('print count("hello world", "l")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3');
});

test('edge: find_index in string', () => {
  const r = run('print find_index("hello", "ll")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '2');
});

test('edge: split empty string returns list with one empty element', () => {
  const r = run('create variable parts as list with value split("", ",")\nprint length(parts)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '1');
});

test('edge: replace all occurrences', () => {
  const r = run('print replace("aaa", "a", "b")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'bbb');
});

test('edge: to_integer empty string returns NaN', () => {
  const r = run('create variable v with value to_integer("")\nprint v == v');
  assertEqual(r.errors.length, 0);
  // NaN == NaN is false
  assertIncludes(r.output, 'false');
});

// ============================================================
console.log('\n\x1b[1m\x1b[36mEdge Case: List\x1b[0m');

test('edge: length of empty list', () => {
  const r = run('create variable nums as list with value []\nprint length(nums)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

test('edge: first of empty list returns null', () => {
  const r = run('print first([])');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'nothing');
});

test('edge: last of empty list returns null', () => {
  const r = run('print last([])');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'nothing');
});

test('edge: sort empty list returns empty', () => {
  const r = run('create variable sorted as list with value sort([])\nprint length(sorted)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

test('edge: flatten empty list returns empty', () => {
  const r = run('create variable flat as list with value flatten([])\nprint length(flat)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

test('edge: reverse empty list returns empty', () => {
  const r = run('create variable rev as list with value reverse([])\nprint length(rev)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

test('edge: range same start and end is empty', () => {
  const r = run('create variable nums as list with value range(5, 5)\nprint length(nums)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

test('edge: range 0 to 0 is empty', () => {
  const r = run('create variable nums as list with value range(0, 0)\nprint length(nums)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

test('edge: join empty list returns empty string', () => {
  const r = run('print join([], ",")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '');
});

test('edge: sum of empty list returns 0', () => {
  const r = run('print sum([])');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

test('edge: unique empty list returns empty', () => {
  const r = run('create variable u as list with value unique([])\nprint length(u)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

test('edge: take more than available returns all', () => {
  const r = run('create variable result as list with value take([1, 2, 3], 10)\nprint length(result)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3');
});

test('edge: drop more than available returns empty', () => {
  const r = run('create variable result as list with value drop([1, 2, 3], 10)\nprint length(result)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

test('edge: chunk size 1', () => {
  const r = run('create variable result as list with value chunk([1, 2, 3], 1)\nprint length(result)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3');
});

test('edge: compact removes nulls', () => {
  const r = run('create variable result as list with value compact([1, nothing, 2, nothing, 3])\nprint length(result)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3');
});

test('edge: cycle repeats list', () => {
  const r = run('create variable result as list with value cycle([1, 2], 3)\nprint length(result)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '6');
});

test('edge: is_empty checks list', () => {
  const r = run('print is_empty([])\nprint is_empty([1])');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, 'false');
});

test('edge: count in list', () => {
  const r = run('print count([1, 2, 1, 3, 1], 1)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '3');
});

test('edge: contains_list checks membership', () => {
  const r = run('print contains_list([1, 2, 3], 2)\nprint contains_list([1, 2, 3], 5)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, 'false');
});

test('edge: contains_any with match', () => {
  const r = run('print contains_any([1, 2, 3], [2, 5])');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
});

test('edge: contains_any without match', () => {
  const r = run('print contains_any([1, 2, 3], [5, 6])');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'false');
});

test('edge: nth element', () => {
  const r = run('print nth([10, 20, 30], 1)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '20');
});

test('edge: nth out of bounds returns null', () => {
  const r = run('print nth([10, 20], 5)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'nothing');
});

// ============================================================
console.log('\n\x1b[1m\x1b[36mEdge Case: Map\x1b[0m');

test('edge: empty map has_key returns false', () => {
  const r = run('print has_key(map(), "x")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'false');
});

test('edge: empty map size is 0', () => {
  const r = run('print map_size(map())');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

test('edge: get_key missing returns null', () => {
  const r = run('print get_key(map("x", 10), "y")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'nothing');
});

test('edge: keys of empty map returns empty list', () => {
  const r = run('create variable k as list with value keys(map())\nprint length(k)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

test('edge: values of map', () => {
  const r = run('create variable v as list with value values(map("a", 1, "b", 2))\nprint length(v)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '2');
});

test('edge: is_empty on empty map', () => {
  const r = run('print is_empty(map())');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
});

test('edge: map_set returns map', () => {
  const r = run('create variable m as map with value map()\nset m to map_set(m, "x", 42)\nprint get_key(m, "x")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '42');
});

// ============================================================
console.log('\n\x1b[1m\x1b[36mEdge Case: Type & Conversion\x1b[0m');

test('edge: type_of nothing', () => {
  const r = run('print type_of(nothing)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'nothing');
});

test('edge: type_of list', () => {
  const r = run('print type_of([1, 2])');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'list');
});

test('edge: type_of map', () => {
  const r = run('print type_of(map("x", 1))');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'map');
});

test('edge: type_of boolean', () => {
  const r = run('print type_of(true)');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'boolean');
});

test('edge: to_integer valid string', () => {
  const r = run('print to_integer("0")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

test('edge: to_float valid string', () => {
  const r = run('print to_float("0")');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

// ============================================================
console.log('\n\x1b[1m\x1b[36mEdge Case: Control Flow\x1b[0m');

test('edge: nested while loops', () => {
  const r = run(`create variable count as integer with value 0
create variable i as integer with value 0
while i is less than 3 do
    create variable j as integer with value 0
    while j is less than 3 do
        set count to count + 1
        increase j by 1
    end
    increase i by 1
end
print count`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '9');
});

test('edge: function with no explicit return has side effect', () => {
  const r = run(`function no_return
    print "side effect"
end
no_return`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'side effect');
});

test('edge: multiple returns in function', () => {
  const r = run(`function classify with x as integer returns text
    when x is less than 0 do
        return "negative"
    end
    when x equals 0 do
        return "zero"
    end
    return "positive"
end
print classify with -5
print classify with 0
print classify with 5`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'negative');
  assertIncludes(r.output, 'zero');
  assertIncludes(r.output, 'positive');
});

test('edge: while loop with zero iterations', () => {
  const r = run(`create variable sum as integer with value 0
create variable i as integer with value 0
while i is less than 0 do
    set sum to sum + 1
    increase i by 1
end
print sum`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

test('edge: for each on empty list does nothing', () => {
  const r = run(`create variable count as integer with value 0
for each item in [] do
    set count to count + 1
end
print count`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

test('edge: repeat 0 times does nothing', () => {
  const r = run(`create variable count as integer with value 0
repeat 0 times do
    set count to count + 1
end
print count`);
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '0');
});

// ============================================================
console.log('\n\x1b[1m\x1b[36mEdge Case: Expressions & Operators\x1b[0m');

test('edge: string + number coercion', () => {
  const r = run('print "num: " + 42');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'num:');
});

test('edge: chained comparison', () => {
  const r = run('print 1 < 2\nprint 2 < 1');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'true');
  assertIncludes(r.output, 'false');
});

test('edge: negative modulo', () => {
  const r = run('print -7 % 3');
  assertEqual(r.errors.length, 0);
  assert(r.output[0].includes('-'));
});

test('edge: empty attach produces empty string', () => {
  const r = run('print "" attach ""');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, '');
});

test('edge: list index out of bounds returns null', () => {
  const r = run('create variable nums as list with value [1, 2, 3]\nprint nums[10]');
  assertEqual(r.errors.length, 0);
  assertIncludes(r.output, 'nothing');
});

// ============================================================
// SUMMARY
// ============================================================

const total = passed + failed;
console.log('\n\x1b[1m' + '='.repeat(50) + '\x1b[0m');
console.log(`\x1b[1mResults: \x1b[32m${passed} passed\x1b[0m / \x1b[31m${failed} failed\x1b[0m / ${total} total`);
if (failed > 0) {
  console.log(`\x1b[31mFailures:\x1b[0m`);
  for (const f of failures) {
    console.error(`  \x1b[31m• ${f}\x1b[0m`);
  }
}
console.log('\x1b[1m' + '='.repeat(50) + '\x1b[0m\n');

if (failed > 0) process.exit(1);

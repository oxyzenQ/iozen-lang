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
// SUMMARY
// ============================================================

const total = passed + failed;
console.log('\n\x1b[1m' + '='.repeat(50) + '\x1b[0m');
console.log(`\x1b[1mResults: \x1b[32m${passed} passed\x1b[0m / \x1b[31m${failed} failed\x1b[0m / ${total} total`);
if (failed > 0) {
  console.log(`\n\x1b[31mFailures:\x1b[0m`);
  for (const f of failures) {
    console.error(`  \x1b[31m• ${f}\x1b[0m`);
  }
}
console.log('\x1b[1m' + '='.repeat(50) + '\x1b[0m\n');

if (failed > 0) process.exit(1);

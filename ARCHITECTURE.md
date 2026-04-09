# IOZEN Language — Architecture Reference

## Overview
iozen-lang is a natural-language syntax programming language implemented as a tree-walking interpreter in TypeScript (Bun runtime). Goal: human-readable code with compiler-grade semantics.

## Project Structure
```
src/lib/iozen/
  ast.ts          (396 lines)  — AST node type definitions
  tokens.ts       (314 lines)  — TokenType enum + Token class
  lexer.ts        (319 lines)  — tokenizer (string → tokens)
  parser.ts       (1572 lines) — recursive descent parser (tokens → AST)
  environment.ts  (119 lines)  — scoped variable storage (parent chain)
  interpreter.ts  (2552 lines) — tree-walking interpreter + all builtins
  index.ts        (16 lines)   — barrel exports
tests/
  test_all.ts     (3398 lines) — ALL tests (375 total), run via bun
```

## Key Types
```typescript
IOZENValue = number | string | boolean | IOZENValue[] | IOZENMap | IOZENObject | IOZENFunction | IOZENResult | null

IOZENMap      = { __iozen_type: 'map', [key: string]: IOZENValue }
IOZENObject   = { __iozen_type: 'object', [field: string]: IOZENValue }
IOZENFunction = { __iozen_type: 'function', name, parameters, body, returnType, closure: Environment }
IOZENResult   = { __iozen_type: 'result', success: boolean, value, error }

Signal types: ReturnSignal, ExitSignal, ThrowSignal, BreakSignal, ContinueSignal
RuntimeError: has message + optional line/column
```

## Architecture Flow
```
Source Code → Lexer → Token[] → Parser → AST → Interpreter (tree-walk) → Output
```
- **Lexer**: handles keywords, identifiers, literals (int/float/hex/char/string/bool), operators, comments (#)
- **Parser**: recursive descent, natural language syntax (`create variable x as integer with value 42`)
- **Interpreter**: walks AST, uses `Environment` for scoped variables, `__last_result__` for expression results
- **Builtins**: registered in `callBuiltinByName()` (line ~1218-2310), result via `env.define('__last_result__', val)`
- **Function resolution**: `resolveFunctionArg()` handles both `IOZENFunction` objects and string name references
- **Error suggestions**: `suggestSimilar()` uses Levenshtein distance against `builtinNames` array

## IOZEN Syntax Quick Reference
```iozen
# Variables
create variable x as integer with value 42
create constant PI as float with value 3.14
set x to 10
increase x by 1
decrease x by 1

# Functions
function add with a as integer and b as integer returns integer
    return a + b
end
print add with 3 and 5          # function call via "with"

# Conditionals
when x equals 5 do
    print "five"
otherwise when x is greater than 10 do
    print "big"
otherwise do
    print "other"
end

# Match expression
match x
    case 1 do print "one" end
    case _ do print "other" end
end

# Loops
while i is less than 10 do ... end
for each item in items do ... end
for each item, i in items do ... end   # with index
repeat 5 times do ... end
exit            # break
continue        # skip iteration

# Print & I/O
print "hello", x, 42
print "Hello, {name}!"              # string interpolation

# Lists & Maps
create variable nums as list with value [1, 2, 3]
nums[0]                               # index access
create variable m as map with value map("key", value)

# Try/catch
try do
    throw "error message"
catch err do
    print err
end

# Pipeline
value |> builtin1 |> builtin2

# Anonymous functions
create variable double with value function with x as integer returns integer
    return x * 2
end
```

## Builtin Functions (100+)

### Math (32)
`abs`, `abs_int`, `sqrt`, `floor`, `ceil`, `round`, `trunc`, `power`, `pow`, `min`, `max`, `mod`, `sign`, `log`, `log2`, `log10`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `gcd`, `lcm`, `pi`, `e`, `clamp`, `format_num`, `atan`

### String (25)
`uppercase`, `lowercase`, `upper`, `trim`, `strip`, `substring`, `contains`, `replace`, `split`, `join`, `char_at`, `ord`, `chr`, `to_text`, `to_integer`, `int`, `to_float`, `starts_with`, `ends_with`, `repeat_str`, `pad_left`, `pad_right`, `lines`, `reverse_str`, `index_of`, `find_index`, `format`, `count`

### List (35)
`push`, `pop`, `sort`, `reverse`, `length`, `range`, `sum`, `remove`, `remove_last`, `remove_key`, `index_of`, `find`, `contains_list`, `slice`, `insert`, `flatten`, `unique`, `compact`, `first`, `last`, `chunk`, `take`, `drop`, `nth`, `cycle`, `is_empty`, `not_empty`, `count_by`, `contains_any`, `interleave`, `zip`, `enumerate`

### Higher-Order (10)
`map_list`, `filter_list`, `for_each_list`, `flat_map`, `any`, `all`, `reduce`, `takewhile`, `dropwhile`, `join_map`

### Map (10)
`map`, `has_key`, `get_key`, `set_key`, `keys`, `values`, `map_size`, `has_value`, `map_set`, `to_map`

### File I/O (6)
`read_line`, `read_file`, `write_file`, `append_file`, `delete_file`, `file_exists`

### System (6)
`env_get`, `args`, `arguments`, `system`, `sleep`, `clock`

### Debug (3)
`inspect`, `assert`, `panic`

### Type (2)
`type_of`, `typeof`

## Development Commands
```bash
bun run ./tests/test_all.ts     # Run all 375 tests
bun run src/cli.ts               # Start REPL
bun run src/cli.ts file.iozen    # Run .iozen file
```

## Phase Roadmap
- Phase 0-1: Interpreter (DONE — 375 tests, all passing)
- Phase 2: Compiler / Self-hosting parser (WIP)
- Phase 3: Ownership system (NEXT)
- Phase 4: Self-hosting (full compiler in iozen)

## Known Issues / Notes
- `has` is a keyword token — use `contains_list` for list membership checks
- `typeof` and `type_of` both exist (aliases)
- `upper` is alias for `uppercase`, `pow` for `power`, `int` for `to_integer`
- Builtins use `args.length >= N` guard pattern (not exact arity checking)
- Map type marker: `__iozen_type: 'map'` field on plain JS objects
- Function type marker: `__iozen_type: 'function'` field
- `__last_result__` env var stores last expression/function-call result

## Git
- Repo: `https://github.com/oxchin/iozen-lang.git`
- User: `oxchin`

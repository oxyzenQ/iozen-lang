// C Backend - Converts IOZEN IR to C Code

import type { IRFunction, IRInstruction, IRProgram, IRValue, IRStructDef } from './ir';

// C reserved keywords that might conflict with IOZEN identifiers
const C_KEYWORDS = new Set([
  'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
  'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if',
  'inline', 'int', 'long', 'register', 'restrict', 'return', 'short',
  'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union',
  'unsigned', 'void', 'volatile', 'while', '_Bool', '_Complex', '_Imaginary',
]);

/** Mangle an IOZEN identifier to a safe C identifier */
function mangleName(name: string): string {
  if (C_KEYWORDS.has(name)) return `iz_${name}`;
  return name;
}

export class CBackend {
  private output: string[] = [];
  private indent = 0;
  private stringLiterals: Map<string, string> = new Map();
  private stringCounter = 0;

  generate(program: IRProgram): string {
    this.output = [];
    this.indent = 0;
    this.stringLiterals.clear();
    this.stringCounter = 0;

    // Phase 1: Pre-scan all functions to collect string literals
    // We need to know all strings before we can emit forward declarations
    const tempOutput: string[] = [];
    const tempIndent = 0;

    // Save current state
    const savedOutput = this.output;
    const savedIndent = this.indent;

    // Process all functions to a temp buffer to collect strings
    this.output = [];
    this.indent = 1; // Function body indentation
    for (const func of program.functions) {
      this.emitFunction(func);
    }
    const functionBodies = this.output.join('\n');

    // Restore state for actual emission
    this.output = savedOutput;
    this.indent = savedIndent;

    // Phase 2: Emit in correct order

    // Header
    this.emitLine('#define _GNU_SOURCE 1');
    this.emitLine('#include <stdio.h>');
    this.emitLine('#include <stdlib.h>');
    this.emitLine('#include <string.h>');
    this.emitLine('#include <math.h>');
    this.emitLine('#include <stdbool.h>');
    this.emitLine('#include <setjmp.h>');
    this.emitLine('#include <sys/stat.h>');
    this.emitLine('');

    // IOZEN Value Type (union for dynamic typing)
    this.emitLine('// IOZEN Value Type (dynamic typing)');
    this.emitLine('typedef enum {');
    this.emitLine('  IZ_NUMBER,');
    this.emitLine('  IZ_STRING,');
    this.emitLine('  IZ_BOOL,');
    this.emitLine('  IZ_ARRAY,');
    this.emitLine('  IZ_STRUCT,');
    this.emitLine('  IZ_CLOSURE,');
    this.emitLine('  IZ_NULL');
    this.emitLine('} iz_type_t;');
    this.emitLine('');

    this.emitLine('typedef struct iz_value {');
    this.emitLine('  iz_type_t type;');
    this.emitLine('  union {');
    this.emitLine('    double number;');
    this.emitLine('    char* string;');
    this.emitLine('    bool boolean;');
    this.emitLine('    struct iz_array* array;');
    this.emitLine('    struct iz_struct* structure;');
    this.emitLine('    struct iz_closure* closure;');
    this.emitLine('  } data;');
    this.emitLine('} iz_value_t;');
    this.emitLine('');

    // Array type
    this.emitLine('typedef struct iz_array {');
    this.emitLine('  iz_value_t* items;');
    this.emitLine('  int length;');
    this.emitLine('  int capacity;');
    this.emitLine('} iz_array_t;');
    this.emitLine('');

    // Generic struct type (dynamic fields)
    this.emitLine('typedef struct iz_struct_field {');
    this.emitLine('  char* name;');
    this.emitLine('  iz_value_t value;');
    this.emitLine('  struct iz_struct_field* next;');
    this.emitLine('} iz_struct_field_t;');
    this.emitLine('');
    this.emitLine('typedef struct iz_struct {');
    this.emitLine('  char* type_name;');
    this.emitLine('  iz_struct_field_t* fields;');
    this.emitLine('} iz_struct_t;');
    this.emitLine('');

    // Closure type (function pointer + captured environment)
    this.emitLine('typedef struct iz_closure {');
    this.emitLine('  void (*func)(iz_value_t, ...);  // function pointer');
    this.emitLine('  struct iz_array* env;           // captured variables');
    this.emitLine('} iz_closure_t;');
    this.emitLine('');

    // Named struct C typedefs
    if (program.structs.size > 0) {
      this.emitLine('// Named struct type forward declarations');
      for (const [name, def] of program.structs) {
        this.emitLine(`typedef struct iz_${name} iz_${name}_t;`);
      }
      this.emitLine('');
    }

    // Exception handling globals (setjmp/longjmp)
    this.emitLine('// Exception handling (setjmp/longjmp)');
    this.emitLine('static jmp_buf iz_exception_buf;');
    this.emitLine('static iz_value_t iz_exception_value = { .type = IZ_NULL };');
    this.emitLine('static volatile int iz_has_exception = 0;');
    this.emitLine('');

    // String literals (collected in Phase 1)
    if (this.stringLiterals.size > 0) {
      this.emitLine('// String literals');
      for (const [id, str] of this.stringLiterals) {
        this.emitLine(`static const char* ${id} = ${JSON.stringify(str)};`);
      }
      this.emitLine('');
    }

    // Forward declarations for functions
    this.emitLine('// Forward declarations');
    for (const func of program.functions) {
      this.emitFunctionDecl(func);
    }
    this.emitLine('');

    // Forward declarations for string literals (defined at end)
    if (this.stringLiterals.size > 0) {
      this.emitLine('// String literal forward declarations');
      for (const id of this.stringLiterals.keys()) {
        this.emitLine(`extern const char* ${id};`);
      }
      this.emitLine('');
    }

    // Built-in functions
    this.emitBuiltins();
    this.emitLine('');

    // Function implementations (use pre-generated bodies)
    this.output.push(functionBodies);

    // Auto-generate main() if not present
    if (!program.functions.some(f => f.name === 'main')) {
      this.emitLine('');
      this.emitLine('// Auto-generated main entry point');
      this.emitLine('int main(void) {');
      this.indent++;
      // Call all user-defined functions as potential entry points
      for (const func of program.functions) {
        this.emitLine(`${mangleName(func.name)}();`);
      }
      this.emitLine('return 0;');
      this.indent--;
      this.emitLine('}');
      this.emitLine('');
    }

    return this.output.join('\n');
  }

  private isMainFunction(func: IRFunction): boolean {
    return func.name === 'main';
  }

  private hasMainFunction(program: IRProgram): boolean {
    return program.functions.some(f => f.name === 'main');
  }

  private emitFunctionDecl(func: IRFunction) {
    if (this.isMainFunction(func)) {
      this.emitLine(`int ${mangleName(func.name)}(void);`);
    } else {
      const params = func.params.map(p => `iz_value_t ${p.name}`).join(', ');
      const returnType = func.returnType === 'void' ? 'void' : 'iz_value_t';
      this.emitLine(`${returnType} ${mangleName(func.name)}(${params});`);
    }
  }

  private emitFunction(func: IRFunction) {
    if (this.isMainFunction(func)) {
      this.emitLine(`int ${mangleName(func.name)}(void) {`);
    } else {
      const params = func.params.map(p => `iz_value_t ${p.name}`).join(', ');
      const returnType = func.returnType === 'void' ? 'void' : 'iz_value_t';
      this.emitLine(`${returnType} ${mangleName(func.name)}(${params}) {`);
    }
    this.indent++;

    // Local variable declarations
    for (const [name, type] of func.locals) {
      if (!func.params.find(p => p.name === name)) {
        this.emitLine(`iz_value_t ${name} = { .type = IZ_NULL };`);
      }
    }

    if (func.locals.size > func.params.length) {
      this.emitLine('');
    }

    // Instructions
    for (const inst of func.instructions) {
      this.emitInstruction(inst);
    }

    // Ensure proper return
    if (this.isMainFunction(func) && !this.hasExplicitReturn(func)) {
      this.emitLine('return 0;');
    } else if (func.returnType === 'void' && !this.hasExplicitReturn(func)) {
      this.emitLine('return;');
    }

    this.indent--;
    this.emitLine('}');
    this.emitLine('');
  }

  /** Convert an IR operand (string variable name or IRValue object) to C code */
  private emitOperand(operand: any): string {
    if (typeof operand === 'string') {
      return operand;
    }
    if (operand && typeof operand === 'object' && operand.type) {
      switch (operand.type) {
        case 'number':
          return `(iz_value_t){ .type = IZ_NUMBER, .data.number = ${operand.value} }`;
        case 'string': {
          const strId = this.addStringLiteral(String(operand.value));
          return `(iz_value_t){ .type = IZ_STRING, .data.string = (char*)${strId} }`;
        }
        case 'bool':
          return `(iz_value_t){ .type = IZ_BOOL, .data.boolean = ${operand.value} }`;
        default:
          return `(iz_value_t){ .type = IZ_NULL }`;
      }
    }
    return String(operand);
  }

  private emitInstruction(inst: IRInstruction) {
    const indent = '  '.repeat(this.indent);

    if (inst.comment && !['label'].includes(inst.op)) {
      this.output.push(`${indent}// ${inst.comment}`);
    }

    switch (inst.op) {
      case 'label':
        this.output.push(`${inst.label}:`);
        break;

      case 'const':
        const value = inst.src1 as IRValue;
        if (inst.dest) {
          if (value.type === 'number') {
            this.output.push(`${indent}${inst.dest} = (iz_value_t){ .type = IZ_NUMBER, .data.number = ${value.value} };`);
          } else if (value.type === 'string') {
            const strId = this.addStringLiteral(value.value as string);
            this.output.push(`${indent}${inst.dest} = (iz_value_t){ .type = IZ_STRING, .data.string = (char*)${strId} };`);
          } else if (value.type === 'bool') {
            this.output.push(`${indent}${inst.dest} = (iz_value_t){ .type = IZ_BOOL, .data.boolean = ${value.value} };`);
          }
        }
        break;

      case 'load':
        if (inst.dest && inst.src1) {
          this.output.push(`${indent}${inst.dest} = ${this.emitOperand(inst.src1)};`);
        }
        break;

      case 'store':
        if (inst.src1 && inst.src2) {
          this.output.push(`${indent}${inst.src1} = ${this.emitOperand(inst.src2)};`);
        }
        break;

      case 'add':
      case 'sub':
      case 'mul':
      case 'div':
      case 'mod': {
        if (inst.dest && inst.src1 && inst.src2) {
          const left = this.emitOperand(inst.src1);
          const right = this.emitOperand(inst.src2);
          if (inst.op === 'mod') {
            // C modulo requires integer operands
            this.output.push(`${indent}${inst.dest} = (iz_value_t){ .type = IZ_NUMBER, .data.number = (int)${left}.data.number % (int)${right}.data.number };`);
          } else {
            const cOp = { add: '+', sub: '-', mul: '*', div: '/' }[inst.op];
            this.output.push(`${indent}${inst.dest} = (iz_value_t){ .type = IZ_NUMBER, .data.number = ${left}.data.number ${cOp} ${right}.data.number };`);
          }
        }
        break;
      }

      case 'eq':
        if (inst.dest && inst.src1 && inst.src2) {
          this.output.push(`${indent}${inst.dest} = (iz_value_t){ .type = IZ_BOOL, .data.boolean = iz_value_equals(${this.emitOperand(inst.src1)}, ${this.emitOperand(inst.src2)}) };`);
        }
        break;

      case 'ne':
        if (inst.dest && inst.src1 && inst.src2) {
          this.output.push(`${indent}${inst.dest} = (iz_value_t){ .type = IZ_BOOL, .data.boolean = !iz_value_equals(${this.emitOperand(inst.src1)}, ${this.emitOperand(inst.src2)}) };`);
        }
        break;

      case 'lt':
      case 'le':
      case 'gt':
      case 'ge': {
        const cmpOp = { lt: '<', le: '<=', gt: '>', ge: '>=' }[inst.op];
        if (inst.dest && inst.src1 && inst.src2) {
          this.output.push(`${indent}${inst.dest} = (iz_value_t){ .type = IZ_BOOL, .data.boolean = ${this.emitOperand(inst.src1)}.data.number ${cmpOp} ${this.emitOperand(inst.src2)}.data.number };`);
        }
        break;
      }

      case 'and':
      case 'or': {
        const logOp = inst.op === 'and' ? '&&' : '||';
        if (inst.dest && inst.src1 && inst.src2) {
          this.output.push(`${indent}${inst.dest} = (iz_value_t){ .type = IZ_BOOL, .data.boolean = ${this.emitOperand(inst.src1)}.data.boolean ${logOp} ${this.emitOperand(inst.src2)}.data.boolean };`);
        }
        break;
      }

      case 'not':
        if (inst.dest && inst.src1) {
          this.output.push(`${indent}${inst.dest} = (iz_value_t){ .type = IZ_BOOL, .data.boolean = !${this.emitOperand(inst.src1)}.data.boolean };`);
        }
        break;

      case 'neg':
        if (inst.dest && inst.src1) {
          this.output.push(`${indent}${inst.dest} = (iz_value_t){ .type = IZ_NUMBER, .data.number = -${this.emitOperand(inst.src1)}.data.number };`);
        }
        break;

      case 'concat': {
        if (inst.dest && inst.src1 && inst.src2) {
          // Need temporaries because emitOperand may return compound literals
          // which can't have .data.type accessed inline in C
          const tmpLeft = `${inst.dest}_cl`;
          const tmpRight = `${inst.dest}_cr`;
          this.output.push(`${indent}iz_value_t ${tmpLeft} = ${this.emitOperand(inst.src1)};`);
          this.output.push(`${indent}iz_value_t ${tmpRight} = ${this.emitOperand(inst.src2)};`);
          this.output.push(`${indent}${inst.dest}.type = IZ_STRING;`);
          this.output.push(`${indent}${inst.dest}.data.string = iz_string_concat(${tmpLeft}.type == IZ_STRING ? ${tmpLeft}.data.string : "", ${tmpRight}.type == IZ_STRING ? ${tmpRight}.data.string : "");`);
        }
        break;
      }

      case 'call': {
        const args = inst.args?.map(a => this.emitOperand(a)).join(', ') || '';
        // Map IOZEN built-in names to C wrapper functions (handle iz_value_t)
        const builtinMap: Record<string, string> = {
          // String functions
          'split': 'iz_split_wrapper',
          'join': 'iz_join_wrapper',
          'substring': 'iz_substring_wrapper',
          'indexOf': 'iz_indexOf_wrapper',
          'lastIndexOf': 'iz_lastIndexOf_wrapper',
          'contains': 'iz_contains_wrapper',
          // Array functions
          'arrayLen': 'iz_arrayLen_wrapper',
          'push': 'iz_array_push',
          'pop': 'iz_array_pop',
          // Math functions
          'sin': 'iz_sin_wrapper',
          'cos': 'iz_cos_wrapper',
          'sqrt': 'iz_sqrt_wrapper',
          'pow': 'iz_pow_wrapper',
          'abs': 'iz_abs_wrapper',
          'floor': 'iz_floor_wrapper',
          'ceil': 'iz_ceil_wrapper',
          // Constants
          'pi': 'iz_get_pi',
          'e': 'iz_get_e',
          // File I/O
          'readFile': 'iz_readFile_wrapper',
          'writeFile': 'iz_writeFile_wrapper',
          'exists': 'iz_exists_wrapper',
          // JSON
          'parseJSON': 'iz_parseJSON_wrapper',
          'stringify': 'iz_stringify_wrapper'
        };
        const funcName = builtinMap[String(inst.src1)] || mangleName(String(inst.src1));
        if (inst.dest) {
          this.output.push(`${indent}${inst.dest} = ${funcName}(${args});`);
        } else {
          this.output.push(`${indent}${funcName}(${args});`);
        }
        break;
      }

      case 'ret':
        if (inst.src1) {
          this.output.push(`${indent}return ${this.emitOperand(inst.src1)};`);
        } else {
          this.output.push(`${indent}return;`);
        }
        break;

      case 'if': {
        if (inst.src1 && inst.label) {
          const cond = this.emitOperand(inst.src1);
          // If the condition is already a C literal, we need to wrap it
          const condExpr = typeof inst.src1 === 'object' && inst.src1.type === 'bool'
            ? `${cond}.data.boolean`
            : `${cond}.data.boolean`;
          this.output.push(`${indent}if (${condExpr}) goto ${inst.label};`);
        }
        break;
      }

      case 'if_not':
        if (inst.src1 && inst.label) {
          const cond = this.emitOperand(inst.src1);
          const condExpr = typeof inst.src1 === 'object' && inst.src1.type === 'bool'
            ? `!${cond}.data.boolean`
            : `!${cond}.data.boolean`;
          this.output.push(`${indent}if (${condExpr}) goto ${inst.label};`);
        }
        break;

      case 'goto':
        if (inst.label) {
          this.output.push(`${indent}goto ${inst.label};`);
        }
        break;

      case 'print':
        if (inst.src1) {
          this.output.push(`${indent}iz_print(${this.emitOperand(inst.src1)});`);
        }
        break;

      case 'to_string':
        if (inst.dest && inst.src1) {
          // Convert number to string using snprintf
          this.output.push(`${indent}{`);
          this.indent++;
          this.output.push(`${indent}char* __buf = malloc(64);`);
          this.output.push(`${indent}iz_value_t __v = ${this.emitOperand(inst.src1)};`);
          this.output.push(`${indent}if (__v.type == IZ_NUMBER) snprintf(__buf, 64, "%g", __v.data.number);`);
          this.output.push(`${indent}else if (__v.type == IZ_BOOL) snprintf(__buf, 64, "%s", __v.data.boolean ? "true" : "false");`);
          this.output.push(`${indent}else snprintf(__buf, 64, "null");`);
          this.output.push(`${indent}${inst.dest} = (iz_value_t){ .type = IZ_STRING, .data.string = __buf };`);
          this.indent--;
          this.output.push(`${indent}}`);
        }
        break;

      case 'array':
        if (inst.dest) {
          this.output.push(`${indent}${inst.dest} = (iz_value_t){ .type = IZ_ARRAY, .data.array = iz_array_new() };`);
        }
        break;

      case 'array_push':
        if (inst.src1 && inst.src2) {
          this.output.push(`${indent}iz_array_push(${this.emitOperand(inst.src1)}.data.array, ${this.emitOperand(inst.src2)});`);
        }
        break;

      case 'index':
        if (inst.dest && inst.src1 && inst.src2) {
          this.output.push(`${indent}${inst.dest} = iz_array_get(${this.emitOperand(inst.src1)}.data.array, ${this.emitOperand(inst.src2)}.data.number);`);
        }
        break;

      case 'field':
        // Struct field load: dest = obj.field
        if (inst.dest && inst.src1 && inst.label) {
          this.output.push(`${indent}{`);
          this.output.push(`${indent}  iz_struct_t* __s = ${this.emitOperand(inst.src1)}.data.structure;`);
          this.output.push(`${indent}  iz_value_t __fv = iz_struct_get(__s, "${inst.label}");`);
          this.output.push(`${indent}  ${inst.dest} = __fv;`);
          this.output.push(`${indent}}`);
        }
        break;

      case 'field_store':
        // Struct field store: obj.field = value
        if (inst.src1 && inst.label && inst.src2) {
          this.output.push(`${indent}iz_struct_set(${this.emitOperand(inst.src1)}.data.structure, "${inst.label}", ${this.emitOperand(inst.src2)});`);
        }
        break;

      case 'struct_alloc':
        // Allocate a new struct: dest = struct_alloc(typeName)
        if (inst.dest && inst.src1) {
          this.output.push(`${indent}${inst.dest} = (iz_value_t){ .type = IZ_STRUCT, .data.structure = iz_struct_new("${inst.src1}") };`);
        }
        break;

      case 'phi':
        // SSA phi nodes - handled differently
        break;

      case 'try_start':
        // setjmp/longjmp based try-catch entry point
        if (inst.label) {
          this.output.push(`${indent}if (setjmp(iz_exception_buf) != 0) {`);
          this.output.push(`${indent}  iz_has_exception = 0;`);
          this.output.push(`${indent}  goto ${inst.label};`);
          this.output.push(`${indent}}`);
        }
        break;

      case 'throw':
        // Set exception value and longjmp back to try_start
        if (inst.src1) {
          const throwVal = this.emitOperand(inst.src1);
          this.output.push(`${indent}{`);
          this.output.push(`${indent}  iz_value_t __throw_val = ${throwVal};`);
          this.output.push(`${indent}  iz_exception_value = __throw_val;`);
          this.output.push(`${indent}  iz_has_exception = 1;`);
          this.output.push(`${indent}  longjmp(iz_exception_buf, 1);`);
          this.output.push(`${indent}}`);
        }
        break;

      case 'try_end':
        // try_end is a no-op marker; the actual label is emitted separately
        break;

      case 'lambda_alloc': {
        // Create a closure: { func_ptr, env_array }
        // src1 = function name, label = comma-separated capture list
        if (inst.dest && inst.src1) {
          const funcName = String(inst.src1);
          const captureList = inst.label ? inst.label.split(',').filter(s => s.length > 0) : [];
          const captureCount = captureList.length;

          // Allocate the closure struct
          this.output.push(`${indent}{`);
          this.output.push(`${indent}  iz_closure_t* __cl = malloc(sizeof(iz_closure_t));`);
          this.output.push(`${indent}  __cl->func = ${mangleName(funcName)};`);
          this.output.push(`${indent}  __cl->env = iz_array_new();`);

          // Push captured variable values into the environment
          for (const cap of captureList) {
            this.output.push(`${indent}  { iz_value_t __cv; if (${cap}.type != IZ_NULL) __cv = ${cap}; else __cv = (iz_value_t){.type=IZ_NULL}; iz_array_push(__cl->env, __cv); }`);
          }

          this.output.push(`${indent}  ${inst.dest} = (iz_value_t){ .type = IZ_CLOSURE, .data.closure = __cl };`);
          this.output.push(`${indent}}`);
        }
        break;
      }
    }
  }

  private emitBuiltins() {
    // Value equality helper
    this.emitLine('bool iz_value_equals(iz_value_t a, iz_value_t b) {');
    this.emitLine('  if (a.type != b.type) return false;');
    this.emitLine('  switch (a.type) {');
    this.emitLine('    case IZ_NUMBER: return a.data.number == b.data.number;');
    this.emitLine('    case IZ_STRING: return strcmp(a.data.string, b.data.string) == 0;');
    this.emitLine('    case IZ_BOOL: return a.data.boolean == b.data.boolean;');
    this.emitLine('    case IZ_NULL: return true;');
    this.emitLine('    default: return false;');
    this.emitLine('  }');
    this.emitLine('}');
    this.emitLine('');

    // Print function
    this.emitLine('// Built-in: print');
    this.emitLine('void iz_print(iz_value_t value) {');
    this.emitLine('  switch (value.type) {');
    this.emitLine('    case IZ_NUMBER:');
    this.emitLine('      printf("%g\\n", value.data.number);');
    this.emitLine('      break;');
    this.emitLine('    case IZ_STRING:');
    this.emitLine('      printf("%s\\n", value.data.string);');
    this.emitLine('      break;');
    this.emitLine('    case IZ_BOOL:');
    this.emitLine('      printf("%s\\n", value.data.boolean ? "true" : "false");');
    this.emitLine('      break;');
    this.emitLine('    case IZ_STRUCT:');
    this.emitLine('      printf("<%s struct>\\n", value.data.structure ? value.data.structure->type_name : "?");');
    this.emitLine('      break;');
    this.emitLine('    default:');
    this.emitLine('      printf("null\\n");');
    this.emitLine('  }');
    this.emitLine('}');
    this.emitLine('');

    // String functions
    this.emitLine('// Built-in: string operations');
    this.emitLine('int iz_string_length(const char* str) {');
    this.emitLine('  return str ? strlen(str) : 0;');
    this.emitLine('}');
    this.emitLine('');

    this.emitLine('char* iz_string_concat(const char* a, const char* b) {');
    this.emitLine('  int len = strlen(a) + strlen(b) + 1;');
    this.emitLine('  char* result = malloc(len);');
    this.emitLine('  strcpy(result, a);');
    this.emitLine('  strcat(result, b);');
    this.emitLine('  return result;');
    this.emitLine('}');
    this.emitLine('');

    this.emitLine('int iz_string_contains(const char* str, const char* substr) {');
    this.emitLine('  return strstr(str, substr) != NULL;');
    this.emitLine('}');
    this.emitLine('');

    this.emitLine('int iz_string_indexOf(const char* str, const char* substr) {');
    this.emitLine('  const char* pos = strstr(str, substr);');
    this.emitLine('  return pos ? (pos - str) : -1;');
    this.emitLine('}');
    this.emitLine('');

    // Array functions (EMIT BEFORE split/join which use them)
    this.emitLine('// Built-in: array operations');
    this.emitLine('iz_array_t* iz_array_new() {');
    this.emitLine('  iz_array_t* arr = malloc(sizeof(iz_array_t));');
    this.emitLine('  arr->items = malloc(16 * sizeof(iz_value_t));');
    this.emitLine('  arr->length = 0;');
    this.emitLine('  arr->capacity = 16;');
    this.emitLine('  return arr;');
    this.emitLine('}');
    this.emitLine('');

    this.emitLine('iz_value_t iz_array_get(iz_array_t* arr, int index) {');
    this.emitLine('  if (index >= 0 && index < arr->length) {');
    this.emitLine('    return arr->items[index];');
    this.emitLine('  }');
    this.emitLine('  return (iz_value_t){ .type = IZ_NULL };');
    this.emitLine('}');
    this.emitLine('');

    this.emitLine('void iz_array_push(iz_array_t* arr, iz_value_t value) {');
    this.emitLine('  if (arr->length >= arr->capacity) {');
    this.emitLine('    arr->capacity *= 2;');
    this.emitLine('    arr->items = realloc(arr->items, arr->capacity * sizeof(iz_value_t));');
    this.emitLine('  }');
    this.emitLine('  arr->items[arr->length++] = value;');
    this.emitLine('}');
    this.emitLine('');

    this.emitLine('int iz_array_length(iz_array_t* arr) {');
    this.emitLine('  return arr ? arr->length : 0;');
    this.emitLine('}');
    this.emitLine('');

    // Week 11: String split and join (uses array functions above)
    this.emitLine('iz_array_t* iz_string_split(const char* str, const char* delim) {');
    this.emitLine('  iz_array_t* arr = iz_array_new();');
    this.emitLine('  char* copy = strdup(str);');
    this.emitLine('  char* token = strtok(copy, delim);');
    this.emitLine('  while (token) {');
    this.emitLine('    iz_value_t val = { .type = IZ_STRING, .data.string = strdup(token) };');
    this.emitLine('    iz_array_push(arr, val);');
    this.emitLine('    token = strtok(NULL, delim);');
    this.emitLine('  }');
    this.emitLine('  free(copy);');
    this.emitLine('  return arr;');
    this.emitLine('}');
    this.emitLine('');

    this.emitLine('char* iz_string_join(iz_array_t* arr, const char* delim) {');
    this.emitLine('  if (!arr || arr->length == 0) return strdup("");');
    this.emitLine('  int total_len = 0;');
    this.emitLine('  for (int i = 0; i < arr->length; i++) {');
    this.emitLine('    if (arr->items[i].type == IZ_STRING) {');
    this.emitLine('      total_len += strlen(arr->items[i].data.string);');
    this.emitLine('    }');
    this.emitLine('  }');
    this.emitLine('  total_len += (arr->length - 1) * strlen(delim) + 1;');
    this.emitLine('  char* result = malloc(total_len);');
    this.emitLine("  result[0] = '\\0';");
    this.emitLine('  for (int i = 0; i < arr->length; i++) {');
    this.emitLine('    if (arr->items[i].type == IZ_STRING) {');
    this.emitLine('      if (i > 0) strcat(result, delim);');
    this.emitLine('      strcat(result, arr->items[i].data.string);');
    this.emitLine('    }');
    this.emitLine('  }');
    this.emitLine('  return result;');
    this.emitLine('}');
    this.emitLine('');

    this.emitLine('char* iz_string_substring(const char* str, int start, int end) {');
    this.emitLine('  int len = strlen(str);');
    this.emitLine('  if (start < 0) start = 0;');
    this.emitLine('  if (end > len) end = len;');
    this.emitLine('  if (end < start) end = start;');
    this.emitLine('  int sublen = end - start;');
    this.emitLine('  char* result = malloc(sublen + 1);');
    this.emitLine('  strncpy(result, str + start, sublen);');
    this.emitLine("  result[sublen] = '\\0';");
    this.emitLine('  return result;');
    this.emitLine('}');
    this.emitLine('');

    this.emitLine('int iz_string_lastIndexOf(const char* str, const char* substr) {');
    this.emitLine('  int len = strlen(str);');
    this.emitLine('  int sublen = strlen(substr);');
    this.emitLine('  if (sublen == 0) return len;');
    this.emitLine('  for (int i = len - sublen; i >= 0; i--) {');
    this.emitLine('    if (strncmp(str + i, substr, sublen) == 0) return i;');
    this.emitLine('  }');
    this.emitLine('  return -1;');
    this.emitLine('}');
    this.emitLine('');

    // Wrapper functions that take iz_value_t and extract raw values
    this.emitLine('// Wrapper functions for IOZEN type system');

    // split wrapper: iz_value_t -> iz_array_t wrapped in iz_value_t
    this.emitLine('iz_value_t iz_split_wrapper(iz_value_t str, iz_value_t delim) {');
    this.emitLine('  const char* s = (str.type == IZ_STRING) ? str.data.string : "";');
    this.emitLine('  const char* d = (delim.type == IZ_STRING) ? delim.data.string : ",";');
    this.emitLine('  iz_array_t* arr = iz_string_split(s, d);');
    this.emitLine('  return (iz_value_t){ .type = IZ_ARRAY, .data.array = arr };');
    this.emitLine('}');
    this.emitLine('');

    // join wrapper: iz_value_t, iz_value_t -> string wrapped in iz_value_t
    this.emitLine('iz_value_t iz_join_wrapper(iz_value_t arr, iz_value_t delim) {');
    this.emitLine('  iz_array_t* a = (arr.type == IZ_ARRAY) ? arr.data.array : NULL;');
    this.emitLine('  const char* d = (delim.type == IZ_STRING) ? delim.data.string : "";');
    this.emitLine('  char* result = iz_string_join(a, d);');
    this.emitLine('  return (iz_value_t){ .type = IZ_STRING, .data.string = result };');
    this.emitLine('}');
    this.emitLine('');

    // indexOf wrapper: iz_value_t, iz_value_t -> int wrapped in iz_value_t
    this.emitLine('iz_value_t iz_indexOf_wrapper(iz_value_t str, iz_value_t substr) {');
    this.emitLine('  const char* s = (str.type == IZ_STRING) ? str.data.string : "";');
    this.emitLine('  const char* sub = (substr.type == IZ_STRING) ? substr.data.string : "";');
    this.emitLine('  int result = iz_string_indexOf(s, sub);');
    this.emitLine('  return (iz_value_t){ .type = IZ_NUMBER, .data.number = result };');
    this.emitLine('}');
    this.emitLine('');

    // lastIndexOf wrapper
    this.emitLine('iz_value_t iz_lastIndexOf_wrapper(iz_value_t str, iz_value_t substr) {');
    this.emitLine('  const char* s = (str.type == IZ_STRING) ? str.data.string : "";');
    this.emitLine('  const char* sub = (substr.type == IZ_STRING) ? substr.data.string : "";');
    this.emitLine('  int result = iz_string_lastIndexOf(s, sub);');
    this.emitLine('  return (iz_value_t){ .type = IZ_NUMBER, .data.number = result };');
    this.emitLine('}');
    this.emitLine('');

    // substring wrapper
    this.emitLine('iz_value_t iz_substring_wrapper(iz_value_t str, iz_value_t start, iz_value_t end) {');
    this.emitLine('  const char* s = (str.type == IZ_STRING) ? str.data.string : "";');
    this.emitLine('  int st = (start.type == IZ_NUMBER) ? (int)start.data.number : 0;');
    this.emitLine('  int en = (end.type == IZ_NUMBER) ? (int)end.data.number : strlen(s);');
    this.emitLine('  char* result = iz_string_substring(s, st, en);');
    this.emitLine('  return (iz_value_t){ .type = IZ_STRING, .data.string = result };');
    this.emitLine('}');
    this.emitLine('');

    // contains wrapper
    this.emitLine('iz_value_t iz_contains_wrapper(iz_value_t str, iz_value_t substr) {');
    this.emitLine('  const char* s = (str.type == IZ_STRING) ? str.data.string : "";');
    this.emitLine('  const char* sub = (substr.type == IZ_STRING) ? substr.data.string : "";');
    this.emitLine('  int result = iz_string_contains(s, sub);');
    this.emitLine('  return (iz_value_t){ .type = IZ_BOOL, .data.boolean = result };');
    this.emitLine('}');
    this.emitLine('');

    // arrayLen wrapper
    this.emitLine('iz_value_t iz_arrayLen_wrapper(iz_value_t arr) {');
    this.emitLine('  iz_array_t* a = (arr.type == IZ_ARRAY) ? arr.data.array : NULL;');
    this.emitLine('  int result = iz_array_length(a);');
    this.emitLine('  return (iz_value_t){ .type = IZ_NUMBER, .data.number = result };');
    this.emitLine('}');
    this.emitLine('');

    // Week 11: Math wrapper functions
    this.emitLine('// Math wrapper functions');

    this.emitLine('iz_value_t iz_sin_wrapper(iz_value_t x) {');
    this.emitLine('  double v = (x.type == IZ_NUMBER) ? x.data.number : 0;');
    this.emitLine('  return (iz_value_t){ .type = IZ_NUMBER, .data.number = sin(v) };');
    this.emitLine('}');
    this.emitLine('');

    this.emitLine('iz_value_t iz_cos_wrapper(iz_value_t x) {');
    this.emitLine('  double v = (x.type == IZ_NUMBER) ? x.data.number : 0;');
    this.emitLine('  return (iz_value_t){ .type = IZ_NUMBER, .data.number = cos(v) };');
    this.emitLine('}');
    this.emitLine('');

    this.emitLine('iz_value_t iz_sqrt_wrapper(iz_value_t x) {');
    this.emitLine('  double v = (x.type == IZ_NUMBER) ? x.data.number : 0;');
    this.emitLine('  return (iz_value_t){ .type = IZ_NUMBER, .data.number = sqrt(v) };');
    this.emitLine('}');
    this.emitLine('');

    this.emitLine('iz_value_t iz_pow_wrapper(iz_value_t base, iz_value_t exp) {');
    this.emitLine('  double b = (base.type == IZ_NUMBER) ? base.data.number : 0;');
    this.emitLine('  double e = (exp.type == IZ_NUMBER) ? exp.data.number : 0;');
    this.emitLine('  return (iz_value_t){ .type = IZ_NUMBER, .data.number = pow(b, e) };');
    this.emitLine('}');
    this.emitLine('');

    this.emitLine('iz_value_t iz_abs_wrapper(iz_value_t x) {');
    this.emitLine('  double v = (x.type == IZ_NUMBER) ? x.data.number : 0;');
    this.emitLine('  return (iz_value_t){ .type = IZ_NUMBER, .data.number = fabs(v) };');
    this.emitLine('}');
    this.emitLine('');

    this.emitLine('iz_value_t iz_floor_wrapper(iz_value_t x) {');
    this.emitLine('  double v = (x.type == IZ_NUMBER) ? x.data.number : 0;');
    this.emitLine('  return (iz_value_t){ .type = IZ_NUMBER, .data.number = floor(v) };');
    this.emitLine('}');
    this.emitLine('');

    this.emitLine('iz_value_t iz_ceil_wrapper(iz_value_t x) {');
    this.emitLine('  double v = (x.type == IZ_NUMBER) ? x.data.number : 0;');
    this.emitLine('  return (iz_value_t){ .type = IZ_NUMBER, .data.number = ceil(v) };');
    this.emitLine('}');
    this.emitLine('');

    // Constants
    this.emitLine('iz_value_t iz_get_pi() {');
    this.emitLine('  return (iz_value_t){ .type = IZ_NUMBER, .data.number = M_PI };');
    this.emitLine('}');
    this.emitLine('');

    this.emitLine('iz_value_t iz_get_e() {');
    this.emitLine('  return (iz_value_t){ .type = IZ_NUMBER, .data.number = M_E };');
    this.emitLine('}');
    this.emitLine('');

    // Week 11: File I/O wrappers
    this.emitLine('// File I/O wrappers');

    this.emitLine('iz_value_t iz_readFile_wrapper(iz_value_t path) {');
    this.emitLine('  const char* p = (path.type == IZ_STRING) ? path.data.string : "";');
    this.emitLine('  FILE* f = fopen(p, "r");');
    this.emitLine('  if (!f) return (iz_value_t){ .type = IZ_NULL };');
    this.emitLine('  fseek(f, 0, SEEK_END);');
    this.emitLine('  long len = ftell(f);');
    this.emitLine('  fseek(f, 0, SEEK_SET);');
    this.emitLine('  char* buf = malloc(len + 1);');
    this.emitLine('  fread(buf, 1, len, f);');
    this.emitLine('  buf[len] = 0;');
    this.emitLine('  fclose(f);');
    this.emitLine('  return (iz_value_t){ .type = IZ_STRING, .data.string = buf };');
    this.emitLine('}');
    this.emitLine('');

    this.emitLine('iz_value_t iz_writeFile_wrapper(iz_value_t path, iz_value_t content) {');
    this.emitLine('  const char* p = (path.type == IZ_STRING) ? path.data.string : "";');
    this.emitLine('  const char* c = (content.type == IZ_STRING) ? content.data.string : "";');
    this.emitLine('  FILE* f = fopen(p, "w");');
    this.emitLine('  if (!f) return (iz_value_t){ .type = IZ_BOOL, .data.boolean = 0 };');
    this.emitLine('  fputs(c, f);');
    this.emitLine('  fclose(f);');
    this.emitLine('  return (iz_value_t){ .type = IZ_BOOL, .data.boolean = 1 };');
    this.emitLine('}');
    this.emitLine('');

    this.emitLine('iz_value_t iz_exists_wrapper(iz_value_t path) {');
    this.emitLine('  const char* p = (path.type == IZ_STRING) ? path.data.string : "";');
    this.emitLine('  struct stat st;');
    this.emitLine('  int result = stat(p, &st) == 0;');
    this.emitLine('  return (iz_value_t){ .type = IZ_BOOL, .data.boolean = result };');
    this.emitLine('}');
    this.emitLine('');

    // Week 11: JSON wrappers (simplified - returns input for now)
    this.emitLine('// JSON wrappers');

    this.emitLine('iz_value_t iz_parseJSON_wrapper(iz_value_t str) {');
    this.emitLine('  // Simplified: return the string as-is (full JSON parsing needs a library)');
    this.emitLine('  return str;');
    this.emitLine('}');
    this.emitLine('');

    this.emitLine('iz_value_t iz_stringify_wrapper(iz_value_t value) {');
    this.emitLine('  // Simplified: return placeholder (full JSON stringify needs a library)');
    this.emitLine('  char* buf = malloc(32);');
    this.emitLine('  if (value.type == IZ_NUMBER) {');
    this.emitLine('    sprintf(buf, "%g", value.data.number);');
    this.emitLine('  } else if (value.type == IZ_STRING) {');
    this.emitLine('    sprintf(buf, "\\"%s\\"", value.data.string);');
    this.emitLine('  } else if (value.type == IZ_BOOL) {');
    this.emitLine('    strcpy(buf, value.data.boolean ? "true" : "false");');
    this.emitLine('  } else {');
    this.emitLine('    strcpy(buf, "null");');
    this.emitLine('  }');
    this.emitLine('  return (iz_value_t){ .type = IZ_STRING, .data.string = buf };');
    this.emitLine('}');
    this.emitLine('');

    // Struct operations
    this.emitLine('// Struct operations (dynamic field map)');
    this.emitLine('iz_struct_t* iz_struct_new(const char* type_name) {');
    this.emitLine('  iz_struct_t* s = malloc(sizeof(iz_struct_t));');
    this.emitLine('  s->type_name = strdup(type_name);');
    this.emitLine('  s->fields = NULL;');
    this.emitLine('  return s;');
    this.emitLine('}');
    this.emitLine('');
    this.emitLine('void iz_struct_set(iz_struct_t* s, const char* field_name, iz_value_t value) {');
    this.emitLine('  if (!s) return;');
    this.emitLine('  iz_struct_field_t* f = s->fields;');
    this.emitLine('  while (f) {');
    this.emitLine('    if (strcmp(f->name, field_name) == 0) {');
    this.emitLine('      f->value = value;');
    this.emitLine('      return;');
    this.emitLine('    }');
    this.emitLine('    f = f->next;');
    this.emitLine('  }');
    this.emitLine('  f = malloc(sizeof(iz_struct_field_t));');
    this.emitLine('  f->name = strdup(field_name);');
    this.emitLine('  f->value = value;');
    this.emitLine('  f->next = s->fields;');
    this.emitLine('  s->fields = f;');
    this.emitLine('}');
    this.emitLine('');
    this.emitLine('iz_value_t iz_struct_get(iz_struct_t* s, const char* field_name) {');
    this.emitLine('  if (!s) return (iz_value_t){ .type = IZ_NULL };');
    this.emitLine('  iz_struct_field_t* f = s->fields;');
    this.emitLine('  while (f) {');
    this.emitLine('    if (strcmp(f->name, field_name) == 0) return f->value;');
    this.emitLine('    f = f->next;');
    this.emitLine('  }');
    this.emitLine('  return (iz_value_t){ .type = IZ_NULL };');
    this.emitLine('}');
    this.emitLine('');

  }

  private emitLine(line: string) {
    // Don't indent preprocessor directives, labels, or empty lines
    if (line === '' || line.startsWith('#') || line.startsWith('//') || 
        (line.endsWith(':') && !line.includes('('))) {
      this.output.push(line);
    } else {
      this.output.push('  '.repeat(this.indent) + line);
    }
  }

  private addStringLiteral(str: string): string {
    for (const [id, existing] of this.stringLiterals) {
      if (existing === str) return id;
    }
    const id = `str_${this.stringCounter++}`;
    this.stringLiterals.set(id, str);
    return id;
  }

  private hasExplicitReturn(func: IRFunction): boolean {
    return func.instructions.some(i => i.op === 'ret');
  }
}

export function generateC(program: IRProgram): string {
  const backend = new CBackend();
  return backend.generate(program);
}

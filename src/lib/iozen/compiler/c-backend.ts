// C Backend - Converts IOZEN IR to C Code

import { IRProgram, IRFunction, IRInstruction, IRValue } from './ir';

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

    // Header
    this.emitLine('#include <stdio.h>');
    this.emitLine('#include <stdlib.h>');
    this.emitLine('#include <string.h>');
    this.emitLine('#include <math.h>');
    this.emitLine('#include <stdbool.h>');
    this.emitLine('');

    // IOZEN Value Type (union for dynamic typing)
    this.emitLine('// IOZEN Value Type (dynamic typing)');
    this.emitLine('typedef enum {');
    this.emitLine('  IZ_NUMBER,');
    this.emitLine('  IZ_STRING,');
    this.emitLine('  IZ_BOOL,');
    this.emitLine('  IZ_ARRAY,');
    this.emitLine('  IZ_STRUCT,');
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

    // Forward declarations
    this.emitLine('// Forward declarations');
    for (const func of program.functions) {
      this.emitFunctionDecl(func);
    }
    this.emitLine('');

    // Built-in functions
    this.emitBuiltins();
    this.emitLine('');

    // String literals
    if (this.stringLiterals.size > 0) {
      this.emitLine('// String literals');
      for (const [id, str] of this.stringLiterals) {
        this.emitLine(`static const char* ${id} = ${JSON.stringify(str)};`);
      }
      this.emitLine('');
    }

    // Function implementations
    for (const func of program.functions) {
      this.emitFunction(func);
    }

    return this.output.join('\n');
  }

  private emitFunctionDecl(func: IRFunction) {
    const params = func.params.map(p => `iz_value_t ${p.name}`).join(', ');
    const returnType = func.returnType === 'void' ? 'void' : 'iz_value_t';
    this.emitLine(`${returnType} ${func.name}(${params});`);
  }

  private emitFunction(func: IRFunction) {
    const params = func.params.map(p => `iz_value_t ${p.name}`).join(', ');
    const returnType = func.returnType === 'void' ? 'void' : 'iz_value_t';
    
    this.emitLine(`${returnType} ${func.name}(${params}) {`);
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

    // Ensure return if void and no explicit return
    if (func.returnType === 'void' && !this.hasExplicitReturn(func)) {
      this.emitLine('return;');
    }

    this.indent--;
    this.emitLine('}');
    this.emitLine('');
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
          this.output.push(`${indent}${inst.dest} = ${inst.src1};`);
        }
        break;

      case 'store':
        if (inst.src1 && inst.src2) {
          this.output.push(`${indent}${inst.src1} = ${inst.src2};`);
        }
        break;

      case 'add':
      case 'sub':
      case 'mul':
      case 'div':
      case 'mod':
        const cOp = { add: '+', sub: '-', mul: '*', div: '/', mod: '%' }[inst.op];
        if (inst.dest && inst.src1 && inst.src2) {
          this.output.push(`${indent}${inst.dest} = (iz_value_t){ .type = IZ_NUMBER, .data.number = ${inst.src1}.data.number ${cOp} ${inst.src2}.data.number };`);
        }
        break;

      case 'eq':
      case 'ne':
      case 'lt':
      case 'le':
      case 'gt':
      case 'ge':
        const cmpOp = { eq: '==', ne: '!=', lt: '<', le: '<=', gt: '>', ge: '>=' }[inst.op];
        if (inst.dest && inst.src1 && inst.src2) {
          this.output.push(`${indent}${inst.dest} = (iz_value_t){ .type = IZ_BOOL, .data.boolean = ${inst.src1}.data.number ${cmpOp} ${inst.src2}.data.number };`);
        }
        break;

      case 'not':
        if (inst.dest && inst.src1) {
          this.output.push(`${indent}${inst.dest} = (iz_value_t){ .type = IZ_BOOL, .data.boolean = !${inst.src1}.data.boolean };`);
        }
        break;

      case 'call':
        const args = inst.args?.map(a => String(a)).join(', ') || '';
        if (inst.dest) {
          this.output.push(`${indent}${inst.dest} = ${inst.src1}(${args});`);
        } else {
          this.output.push(`${indent}${inst.src1}(${args});`);
        }
        break;

      case 'ret':
        if (inst.src1) {
          this.output.push(`${indent}return ${inst.src1};`);
        } else {
          this.output.push(`${indent}return;`);
        }
        break;

      case 'if':
        if (inst.src1 && inst.label) {
          this.output.push(`${indent}if (${inst.src1}.data.boolean) goto ${inst.label};`);
        }
        break;

      case 'goto':
        if (inst.label) {
          this.output.push(`${indent}goto ${inst.label};`);
        }
        break;

      case 'print':
        if (inst.src1) {
          this.output.push(`${indent}iz_print(${inst.src1});`);
        }
        break;

      case 'array':
        if (inst.dest) {
          this.output.push(`${indent}${inst.dest} = iz_array_new();`);
        }
        break;

      case 'index':
        if (inst.dest && inst.src1 && inst.src2) {
          this.output.push(`${indent}${inst.dest} = iz_array_get(${inst.src1}.data.array, ${inst.src2}.data.number);`);
        }
        break;

      case 'field':
        // TODO: Struct field access
        break;

      case 'phi':
        // SSA phi nodes - handled differently
        break;
    }
  }

  private emitBuiltins() {
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
    this.emitLine('    default:');
    this.emitLine('      printf("null\\n");');
    this.emitLine('  }');
    this.emitLine('}');
    this.emitLine('');

    // Array functions
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
  }

  private emitLine(line: string) {
    const indent = line.startsWith('#') || line.startsWith('//') || line.includes(':') || line === ''
      ? ''
      : '  '.repeat(this.indent);
    this.output.push(`${indent}${line}`);
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

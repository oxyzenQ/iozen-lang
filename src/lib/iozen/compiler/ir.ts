// IOZEN Intermediate Representation (IR)
// Simple three-address code style IR for compilation

export type IROp = 
  | 'const' | 'var' | 'param'
  | 'add' | 'sub' | 'mul' | 'div' | 'mod'
  | 'eq' | 'ne' | 'lt' | 'le' | 'gt' | 'ge'
  | 'and' | 'or' | 'not' | 'neg' | 'concat'
  | 'to_string'  // Convert number/bool to string for concatenation
  | 'load' | 'store'
  | 'call' | 'ret'
  | 'label' | 'goto' | 'if' | 'if_not'
  | 'print' | 'array' | 'array_push' | 'index' | 'field'
  | 'struct_alloc' | 'field_store'
  | 'throw' | 'try_start' | 'try_end'
  | 'lambda_alloc' | 'lambda_call'
  | 'phi';

export interface IRValue {
  type: 'number' | 'string' | 'bool' | 'void' | 'ptr';
  value?: any;
  name?: string; // For variables/temporaries
}

export interface IRInstruction {
  op: IROp;
  dest?: string; // Destination variable
  src1?: IRValue | string;
  src2?: IRValue | string;
  src3?: IRValue | string;
  label?: string; // For branches
  args?: (IRValue | string)[]; // For calls
  comment?: string;
}

export interface IRFunction {
  name: string;
  params: { name: string; type: IRValue['type'] }[];
  returnType: IRValue['type'];
  locals: Map<string, IRValue['type']>;
  instructions: IRInstruction[];
  labels: Set<string>;
}

export interface IRStructDef {
  name: string;
  fields: { name: string; type: IRValue['type'] }[];
}

export interface IRProgram {
  functions: IRFunction[];
  globals: Map<string, { type: IRValue['type']; init?: any }>;
  strings: Map<string, string>; // String literals for deduplication
  structs: Map<string, IRStructDef>; // Struct type definitions
}

// IR Builder for constructing IR
export class IRBuilder {
  private currentFunction: IRFunction | null = null;
  private tempCounter = 0;
  private labelCounter = 0;
  private program: IRProgram = {
    functions: [],
    globals: new Map(),
    strings: new Map(),
    structs: new Map()
  };

  newFunction(name: string, returnType: IRValue['type'] = 'void'): IRFunction {
    const func: IRFunction = {
      name,
      params: [],
      returnType,
      locals: new Map(),
      instructions: [],
      labels: new Set()
    };
    this.program.functions.push(func);
    this.currentFunction = func;
    this.tempCounter = 0;
    return func;
  }

  addParam(name: string, type: IRValue['type']) {
    if (!this.currentFunction) throw new Error('No current function');
    this.currentFunction.params.push({ name, type });
    this.currentFunction.locals.set(name, type);
  }

  addLocal(name: string, type: IRValue['type']): string {
    if (!this.currentFunction) throw new Error('No current function');
    this.currentFunction.locals.set(name, type);
    return name;
  }

  newTemp(type: IRValue['type'] = 'ptr'): string {
    if (!this.currentFunction) throw new Error('No current function');
    const temp = `t${this.tempCounter++}`;
    this.currentFunction.locals.set(temp, type);
    return temp;
  }

  newLabel(prefix = 'L'): string {
    return `${prefix}${this.labelCounter++}`;
  }

  emit(inst: IRInstruction) {
    if (!this.currentFunction) throw new Error('No current function');
    this.currentFunction.instructions.push(inst);
  }

  emitLabel(label: string) {
    this.emit({ op: 'label', label, comment: `Label ${label}` });
    if (this.currentFunction) {
      this.currentFunction.labels.add(label);
    }
  }

  // High-level emit helpers
  emitConst(dest: string, value: IRValue) {
    this.emit({ op: 'const', dest, src1: value, comment: `${dest} = ${JSON.stringify(value.value)}` });
  }

  emitBinary(op: 'add' | 'sub' | 'mul' | 'div' | 'mod' | 'eq' | 'ne' | 'lt' | 'le' | 'gt' | 'ge', 
             dest: string, left: string, right: string) {
    this.emit({ op, dest, src1: left, src2: right, comment: `${dest} = ${left} ${op} ${right}` });
  }

  emitLoad(dest: string, varName: string) {
    this.emit({ op: 'load', dest, src1: varName, comment: `${dest} = ${varName}` });
  }

  emitStore(varName: string, value: string) {
    this.emit({ op: 'store', src1: varName, src2: value, comment: `${varName} = ${value}` });
  }

  emitCall(dest: string | undefined, funcName: string, args: string[]) {
    this.emit({ op: 'call', dest, src1: funcName, args, comment: `${dest ? dest + ' = ' : ''}${funcName}(${args.join(', ')})` });
  }

  emitRet(value?: string) {
    this.emit({ op: 'ret', src1: value, comment: value ? `return ${value}` : 'return' });
  }

  emitBranch(cond: string, trueLabel: string, falseLabel: string) {
    this.emit({ op: 'if', src1: cond, label: trueLabel, comment: `if ${cond} goto ${trueLabel}` });
    this.emit({ op: 'goto', label: falseLabel, comment: `goto ${falseLabel}` });
  }

  emitGoto(label: string) {
    this.emit({ op: 'goto', label, comment: `goto ${label}` });
  }

  emitPrint(value: string) {
    this.emit({ op: 'print', src1: value, comment: `print ${value}` });
  }

  emitFieldLoad(dest: string, obj: string, field: string) {
    this.emit({ op: 'field', dest, src1: obj, label: field, comment: `${dest} = ${obj}.${field}` });
  }

  emitFieldStore(obj: string, field: string, value: string) {
    this.emit({ op: 'field_store', src1: obj, label: field, src2: value, comment: `${obj}.${field} = ${value}` });
  }

  emitStructAlloc(dest: string, structName: string) {
    this.emit({ op: 'struct_alloc', dest, src1: structName, comment: `${dest} = alloc ${structName}` });
  }

  getProgram(): IRProgram {
    return this.program;
  }

  reset() {
    this.program = {
      functions: [],
      globals: new Map(),
      strings: new Map(),
      structs: new Map()
    };
    this.currentFunction = null;
    this.tempCounter = 0;
    this.labelCounter = 0;
  }
}

export function createIRBuilder(): IRBuilder {
  return new IRBuilder();
}

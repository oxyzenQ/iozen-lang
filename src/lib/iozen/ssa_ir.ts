// ============================================================
// IOZEN Language — SSA IR (Static Single Assignment)
// Minimal but powerful SSA form for optimization
// ============================================================

/**
 * Phase 17: SSA IR
 * 
 * Design philosophy: Minimal but complete
 * - Basic blocks with explicit control flow
 * - Phi nodes for SSA form
 * - Three-address code instructions
 * - Easy to convert from/to AST
 */

// === SSA Values ===

export type SSAValue =
  | { kind: 'constant'; value: number | string | boolean | null }
  | { kind: 'variable'; name: string; version: number }
  | { kind: 'undefined' };

// === SSA Instructions (Three-address code) ===

export type SSAInstruction =
  // x = y
  | { kind: 'assign'; dest: string; destVer: number; src: SSAValue }
  // x = y op z
  | { kind: 'binary'; dest: string; destVer: number; op: string; left: SSAValue; right: SSAValue }
  // x = op y
  | { kind: 'unary'; dest: string; destVer: number; op: string; operand: SSAValue }
  // x = call f(args)
  | { kind: 'call'; dest: string; destVer: number; func: string; args: SSAValue[] }
  // x = phi(y1, y2, ...) - The key SSA instruction
  | { kind: 'phi'; dest: string; destVer: number; incoming: { value: SSAValue; block: string }[] }
  // x = y[index]
  | { kind: 'index_load'; dest: string; destVer: number; array: SSAValue; index: SSAValue }
  // y[index] = x
  | { kind: 'index_store'; array: SSAValue; index: SSAValue; value: SSAValue }
  // x = y.field
  | { kind: 'field_load'; dest: string; destVer: number; obj: SSAValue; field: string }
  // y.field = x
  | { kind: 'field_store'; obj: SSAValue; field: string; value: SSAValue };

// === Basic Block ===

export interface SSABasicBlock {
  id: string;
  instructions: SSAInstruction[];
  // Control flow
  terminator:
    | { kind: 'return'; value: SSAValue | null }
    | { kind: 'branch'; cond: SSAValue; trueBlock: string; falseBlock: string }
    | { kind: 'jump'; target: string }
    | { kind: 'exit' };
  // Predecessors (for phi node construction)
  predecessors: string[];
}

// === SSA Function ===

export interface SSAFunction {
  name: string;
  params: { name: string; initialVersion: number }[];
  entryBlock: string;
  blocks: Map<string, SSABasicBlock>;
  // Track variable versions
  variableVersions: Map<string, number>;
}

// === SSA Module ===

export interface SSAModule {
  functions: SSAFunction[];
  globals: Map<string, SSAValue>;
}

// === Helpers ===

export function createConstant(value: number | string | boolean | null): SSAValue {
  return { kind: 'constant', value };
}

export function createVariable(name: string, version: number): SSAValue {
  return { kind: 'variable', name, version };
}

export function createUndefined(): SSAValue {
  return { kind: 'undefined' };
}

export function formatValue(v: SSAValue): string {
  switch (v.kind) {
    case 'constant': return JSON.stringify(v.value);
    case 'variable': return `${v.name}_${v.version}`;
    case 'undefined': return 'undef';
  }
}

export function formatInstruction(inst: SSAInstruction): string {
  switch (inst.kind) {
    case 'assign':
      return `${inst.dest}_${inst.destVer} = ${formatValue(inst.src)}`;
    case 'binary':
      return `${inst.dest}_${inst.destVer} = ${formatValue(inst.left)} ${inst.op} ${formatValue(inst.right)}`;
    case 'unary':
      return `${inst.dest}_${inst.destVer} = ${inst.op} ${formatValue(inst.operand)}`;
    case 'call':
      return `${inst.dest}_${inst.destVer} = ${inst.func}(${inst.args.map(formatValue).join(', ')})`;
    case 'phi':
      const incoming = inst.incoming.map(i => `[${formatValue(i.value)}, ${i.block}]`).join(', ');
      return `${inst.dest}_${inst.destVer} = phi(${incoming})`;
    case 'index_load':
      return `${inst.dest}_${inst.destVer} = ${formatValue(inst.array)}[${formatValue(inst.index)}]`;
    case 'index_store':
      return `${formatValue(inst.array)}[${formatValue(inst.index)}] = ${formatValue(inst.value)}`;
    case 'field_load':
      return `${inst.dest}_${inst.destVer} = ${formatValue(inst.obj)}.${inst.field}`;
    case 'field_store':
      return `${formatValue(inst.obj)}.${inst.field} = ${formatValue(inst.value)}`;
  }
}

export function formatBlock(block: SSABasicBlock): string {
  const lines: string[] = [];
  lines.push(`${block.id}:`);
  
  if (block.predecessors.length > 0) {
    lines.push(`  ; preds: ${block.predecessors.join(', ')}`);
  }
  
  for (const inst of block.instructions) {
    lines.push(`  ${formatInstruction(inst)}`);
  }
  
  // Terminator
  const t = block.terminator;
  switch (t.kind) {
    case 'return':
      lines.push(`  return ${t.value ? formatValue(t.value) : ''}`);
      break;
    case 'branch':
      lines.push(`  br ${formatValue(t.cond)} ? ${t.trueBlock} : ${t.falseBlock}`);
      break;
    case 'jump':
      lines.push(`  jmp ${t.target}`);
      break;
    case 'exit':
      lines.push(`  exit`);
      break;
  }
  
  return lines.join('\n');
}

export function formatFunction(func: SSAFunction): string {
  const lines: string[] = [];
  const params = func.params.map(p => `${p.name}_${p.initialVersion}`).join(', ');
  lines.push(`function ${func.name}(${params}) {`);
  lines.push(`  entry: ${func.entryBlock}`);
  lines.push('');
  
  for (const [_, block] of func.blocks) {
    lines.push(formatBlock(block));
    lines.push('');
  }
  
  lines.push('}');
  return lines.join('\n');
}

export function formatModule(module: SSAModule): string {
  const lines: string[] = [];
  lines.push('=== SSA MODULE ===');
  lines.push('');
  
  for (const func of module.functions) {
    lines.push(formatFunction(func));
    lines.push('');
  }
  
  return lines.join('\n');
}

// ============================================================
// IOZEN Language — Environment (Variable Scoping)
// Manages lexical scoping for the IOZEN interpreter
// ============================================================

export type IOZENValue =
  | number
  | string
  | boolean
  | null
  | IOZENValue[]
  | IOZENObject
  | IOZENMap
  | IOZENFunction
  | IOZENResult;

export interface IOZENObject {
  __iozen_type: 'object';
  __class_name: string;
  [key: string]: IOZENValue;
}

export interface IOZENFunction {
  __iozen_type: 'function';
  name: string;
  parameters: { name: string; typeName: string; qualifiers: string[] }[];
  returnType: string;
  body: unknown[];
  closure: Environment;
}

export interface IOZENMap {
  __iozen_type: 'map';
  [key: string]: IOZENValue;
}

export interface IOZENResult {
  __iozen_type: 'result';
  ok: boolean;
  value?: IOZENValue;
  error?: string;
}

export class RuntimeError extends Error {
  public file?: string;
  public source?: string;

  constructor(
    message: string,
    public line?: number,
    public column?: number,
  ) {
    super(message);
    this.name = 'RuntimeError';
  }

  /**
   * Phase 14.2: Pretty error formatting with source preview
   */
  formatPretty(): string {
    const lines: string[] = [];

    // Header: ERROR: message
    lines.push(`ERROR: ${this.message}`);

    // Location: file:line:column
    const loc = this.file
      ? `${this.file}:${this.line ?? 1}:${this.column ?? 1}`
      : `line ${this.line ?? 1}, column ${this.column ?? 1}`;
    lines.push(` --> ${loc}`);
    lines.push('');

    // Source preview (if available)
    if (this.source && this.line) {
      const sourceLines = this.source.split('\n');
      const lineNum = this.line;
      const col = this.column ?? 1;

      // Previous line (context)
      if (lineNum > 1 && sourceLines[lineNum - 2]) {
        lines.push(`  ${String(lineNum - 1).padStart(4)} | ${sourceLines[lineNum - 2]}`);
      }

      // Current line (error line)
      const currentLine = sourceLines[lineNum - 1] || '';
      lines.push(`> ${String(lineNum).padStart(4)} | ${currentLine}`);

      // Caret pointer
      const caretSpace = ' '.repeat(6 + col);
      lines.push(`${caretSpace}^`);
    }

    return lines.join('\n');
  }
}

export class Environment {
  private vars: Map<string, { value: IOZENValue; isConstant: boolean }> = new Map();
  private parent: Environment | null;

  constructor(parent: Environment | null = null) {
    this.parent = parent;
  }

  public define(name: string, value: IOZENValue, isConstant: boolean = false): void {
    if (this.vars.has(name)) {
      const existing = this.vars.get(name)!;
      if (existing.isConstant) {
        throw new RuntimeError(`Cannot reassign constant "${name}"`);
      }
    }
    this.vars.set(name, { value, isConstant });
  }

  public get(name: string): IOZENValue {
    if (this.vars.has(name)) {
      return this.vars.get(name)!.value;
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new RuntimeError(`Undefined variable: "${name}"`);
  }

  public set(name: string, value: IOZENValue): void {
    if (this.vars.has(name)) {
      const entry = this.vars.get(name)!;
      if (entry.isConstant) {
        throw new RuntimeError(`Cannot reassign constant "${name}"`);
      }
      entry.value = value;
      return;
    }
    if (this.parent) {
      this.parent.set(name, value);
      return;
    }
    throw new RuntimeError(`Undefined variable: "${name}"`);
  }

  public has(name: string): boolean {
    if (this.vars.has(name)) return true;
    if (this.parent) return this.parent.has(name);
    return false;
  }

  public child(): Environment {
    return new Environment(this);
  }

  public names(): string[] {
    const result: string[] = [];
    if (this.parent) {
      result.push(...this.parent.names());
    }
    for (const key of this.vars.keys()) {
      if (!result.includes(key)) result.push(key);
    }
    return result;
  }
}

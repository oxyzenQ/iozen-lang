// ============================================================
// IOZEN Language — Token Definitions
// Full token type system for the IOZEN programming language
// ============================================================

export enum TokenType {
  // Literals
  IntegerLiteral = 'IntegerLiteral',
  FloatLiteral = 'FloatLiteral',
  StringLiteral = 'StringLiteral',
  CharLiteral = 'CharLiteral',
  BooleanLiteral = 'BooleanLiteral',
  NothingLiteral = 'NothingLiteral',

  // Identifiers & Keywords
  Identifier = 'Identifier',

  // --- Type keywords ---
  Integer = 'Integer',
  Float = 'Float',
  Boolean = 'Boolean',
  Character = 'Character',
  Text = 'Text',
  Pointer = 'Pointer',
  Address = 'Address',
  Nothing = 'Nothing',
  List = 'List',
  Optional = 'Optional',
  Result = 'Result',
  Map = 'Map',

  // --- Statement keywords ---
  Create = 'Create',
  Variable = 'Variable',
  Constant = 'Constant',
  Define = 'Define',
  Structure = 'Structure',
  Enum = 'Enum',
  Union = 'Union',
  Field = 'Field',
  Function = 'Function',
  Returns = 'Returns',
  End = 'End',
  Return = 'Return',
  Import = 'Import',
  Module = 'Module',
  Expose = 'Expose',

  // --- Control flow ---
  When = 'When',
  Otherwise = 'Otherwise',
  Do = 'Do',
  Check = 'Check',
  Case = 'Case',
  Repeat = 'Repeat',
  Times = 'Times',
  While = 'While',
  For = 'For',
  Each = 'Each',
  In = 'In',
  Label = 'Label',
  Exit = 'Exit',

  // --- Operators ---
  Plus = 'Plus',
  Minus = 'Minus',
  Star = 'Star',
  Slash = 'Slash',
  Percent = 'Percent',
  Equals = 'Equals',
  NotEquals = 'NotEquals',
  LessThan = 'LessThan',
  GreaterThan = 'GreaterThan',
  LessOrEqual = 'LessOrEqual',
  GreaterOrEqual = 'GreaterOrEqual',
  Assign = 'Assign',

  // --- Type qualifiers ---
  As = 'As',
  With = 'With',
  Value = 'Value',
  Mutable = 'Mutable',
  Immutable = 'Immutable',
  Owned = 'Owned',
  Borrowed = 'Borrowed',
  Reference = 'Reference',
  To = 'To',
  From = 'From',
  Of = 'Of',
  Type = 'Type',
  Holding = 'Holding',
  Unsafe = 'Unsafe',
  Block = 'Block',
  Declare = 'Declare',
  External = 'External',
  Library = 'Library',

  // --- Action keywords ---
  Print = 'Print',
  Attach = 'Attach',
  Increase = 'Increase',
  By = 'By',
  Decrease = 'Decrease',
  Set = 'Set',
  Send = 'Send',
  Receive = 'Receive',
  Wait = 'Wait',
  Start = 'Start',
  Task = 'Task',
  Parallel = 'Parallel',
  Atomic = 'Atomic',

  // --- Logical operators ---
  And = 'And',
  Or = 'Or',
  Not = 'Not',

  // --- Comparison helpers ---
  Is = 'Is',
  Has = 'Has',
  Inside = 'Inside',
  Than = 'Than',
  Equal = 'Equal',
  Greater = 'Greater',
  Less = 'Less',

  // Punctuation
  LeftParen = 'LeftParen',
  RightParen = 'RightParen',
  LeftBracket = 'LeftBracket',
  RightBracket = 'RightBracket',
  LeftBrace = 'LeftBrace',
  RightBrace = 'RightBrace',
  Comma = 'Comma',
  Dot = 'Dot',
  Colon = 'Colon',
  Semicolon = 'Semicolon',
  Arrow = 'Arrow',
  Hash = 'Hash',

  // Special
  EOF = 'EOF',
  Newline = 'Newline',
  Comment = 'Comment',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

// Keyword → TokenType mapping
export const KEYWORDS: Record<string, TokenType> = {
  // Types
  'integer': TokenType.Integer,
  'float': TokenType.Float,
  'boolean': TokenType.Boolean,
  'character': TokenType.Character,
  'text': TokenType.Text,
  'pointer': TokenType.Pointer,
  'address': TokenType.Address,
  'nothing': TokenType.Nothing,
  'list': TokenType.List,
  'optional': TokenType.Optional,
  'result': TokenType.Result,
  'map': TokenType.Map,

  // Statements
  'create': TokenType.Create,
  'variable': TokenType.Variable,
  'constant': TokenType.Constant,
  'define': TokenType.Define,
  'structure': TokenType.Structure,
  'enum': TokenType.Enum,
  'union': TokenType.Union,
  'field': TokenType.Field,
  'function': TokenType.Function,
  'returns': TokenType.Returns,
  'end': TokenType.End,
  'return': TokenType.Return,
  'import': TokenType.Import,
  'module': TokenType.Module,
  'expose': TokenType.Expose,

  // Control flow
  'when': TokenType.When,
  'otherwise': TokenType.Otherwise,
  'do': TokenType.Do,
  'check': TokenType.Check,
  'case': TokenType.Case,
  'repeat': TokenType.Repeat,
  'times': TokenType.Times,
  'while': TokenType.While,
  'for': TokenType.For,
  'each': TokenType.Each,
  'in': TokenType.In,
  'label': TokenType.Label,
  'exit': TokenType.Exit,

  // Type qualifiers
  'as': TokenType.As,
  'with': TokenType.With,
  'value': TokenType.Value,
  'mutable': TokenType.Mutable,
  'immutable': TokenType.Immutable,
  'owned': TokenType.Owned,
  'borrowed': TokenType.Borrowed,
  'reference': TokenType.Reference,
  'to': TokenType.To,
  'from': TokenType.From,
  'of': TokenType.Of,
  'type': TokenType.Type,
  'holding': TokenType.Holding,
  'unsafe': TokenType.Unsafe,
  'block': TokenType.Block,
  'declare': TokenType.Declare,
  'external': TokenType.External,
  'library': TokenType.Library,

  // Actions
  'print': TokenType.Print,
  'attach': TokenType.Attach,
  'increase': TokenType.Increase,
  'by': TokenType.By,
  'decrease': TokenType.Decrease,
  'set': TokenType.Set,
  'send': TokenType.Send,
  'receive': TokenType.Receive,
  'wait': TokenType.Wait,
  'start': TokenType.Start,
  'task': TokenType.Task,
  'parallel': TokenType.Parallel,
  'atomic': TokenType.Atomic,

  // Comparison helpers
  'is': TokenType.Is,
  'has': TokenType.Has,
  'inside': TokenType.Inside,
  'than': TokenType.Than,
  'equal': TokenType.Equal,
  'equals': TokenType.Equal,
  'greater': TokenType.Greater,
  'less': TokenType.Less,

  // Logical operators
  'and': TokenType.And,
  'or': TokenType.Or,
  'not': TokenType.Not,

  // Boolean literals
  'true': TokenType.BooleanLiteral,
  'false': TokenType.BooleanLiteral,
};

// Operator symbols → TokenType mapping
export const SYMBOLS: Record<string, TokenType> = {
  '+': TokenType.Plus,
  '-': TokenType.Minus,
  '*': TokenType.Star,
  '/': TokenType.Slash,
  '%': TokenType.Percent,
  '==': TokenType.Equals,
  '!=': TokenType.NotEquals,
  '<': TokenType.LessThan,
  '>': TokenType.GreaterThan,
  '<=': TokenType.LessOrEqual,
  '>=': TokenType.GreaterOrEqual,
  '=': TokenType.Assign,
  '(': TokenType.LeftParen,
  ')': TokenType.RightParen,
  '[': TokenType.LeftBracket,
  ']': TokenType.RightBracket,
  '{': TokenType.LeftBrace,
  '}': TokenType.RightBrace,
  ',': TokenType.Comma,
  '.': TokenType.Dot,
  ':': TokenType.Colon,
  ';': TokenType.Semicolon,
  '->': TokenType.Arrow,
  '#': TokenType.Hash,
};

export function tokenToString(token: Token): string {
  if (token.type === TokenType.EOF) return '<EOF>';
  if (token.type === TokenType.Newline) return '<Newline>';
  return `${token.type}("${token.value}")`;
}

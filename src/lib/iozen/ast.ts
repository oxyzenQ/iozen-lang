// ============================================================
// IOZEN Language — AST Node Definitions
// Abstract Syntax Tree node types for the IOZEN language
// ============================================================

// Phase 14.1: Source location tracking for real error messages
export interface SourceLocation {
  line: number;
  column: number;
  file?: string;
}

export type ASTNode =
  | ProgramNode
  | ImportNode
  | ExportNode
  | VariableDeclNode
  | FunctionDeclNode
  | StructureDeclNode
  | EnumDeclNode
  | PrintStmtNode
  | ReturnStmtNode
  | WhenNode
  | CheckNode
  | RepeatNode
  | WhileNode
  | ForEachNode
  | LabelNode
  | ExitNode
  | ContinueNode
  | IncreaseNode
  | SetFieldNode
  | AssignVarNode
  | FunctionCallStmtNode
  | BlockNode
  | BinaryExprNode
  | UnaryExprNode
  | AttachExprNode
  | IdentifierNode
  | LiteralNode
  | FunctionCallExprNode
  | MemberAccessNode
  | IndexAccessNode
  | ListLiteralNode
  | MapLiteralNode
  | ListCompNode
  | TernaryExprNode
  | CompoundAssignNode
  | ForceUnwrapNode
  | OrDefaultNode
  | HasValueNode
  | ValueInsideNode
  | LambdaNode
  | MatchNode
  | MatchCaseNode
  | TryCatchNode
  | ThrowNode
  | PipelineExprNode
  | DestructureNode
  | ModuleDeclNode
  | UnionDeclNode
  | SafeAccessNode
  | TypeAliasNode;

// ---- Program ----
export interface ProgramNode {
  kind: 'Program';
  statements: ASTNode[];
}

// ---- Import ----
export interface ImportNode {
  kind: 'Import';
  modulePath: string;
  importNames: string[];  // empty = import all
  location?: SourceLocation;
}

// ---- Export ----
export interface ExportNode {
  kind: 'Export';
  declaration: ASTNode;  // FunctionDecl, VariableDecl, etc.
  names: string[];       // names being exported
  location?: SourceLocation;
}

// ---- Declarations ----
export interface VariableDeclNode {
  kind: 'VariableDecl';
  name: string;
  names: string[];         // for destructuring: [a, b, c]
  typeName: string;
  qualifiers: string[];
  value: ASTNode | null;
  isConstant: boolean;
  location?: SourceLocation;  // Phase 14.1: Error location
}

export interface FunctionDeclNode {
  kind: 'FunctionDecl';
  name: string;
  parameters: FunctionParamNode[];
  returnType: string;
  returnQualifiers: string[];
  body: ASTNode[];
  location?: SourceLocation;  // Phase 14.1: Error location
}

export interface FunctionParamNode {
  name: string;
  typeName: string;
  qualifiers: string[];
}

export interface StructureDeclNode {
  kind: 'StructureDecl';
  name: string;
  fields: FieldNode[];
  typeParams: string[];
}

export interface FieldNode {
  name: string;
  typeName: string;
}

export interface EnumDeclNode {
  kind: 'EnumDecl';
  name: string;
  cases: EnumCaseNode[];
}

export interface EnumCaseNode {
  name: string;
  fields: { name: string; typeName: string }[];
}

// ---- Statements ----
export interface PrintStmtNode {
  kind: 'PrintStmt';
  expressions: ASTNode[];
}

export interface ReturnStmtNode {
  kind: 'ReturnStmt';
  value: ASTNode | null;
}

export interface WhenNode {
  kind: 'When';
  branches: WhenBranchNode[];
  otherwise: ASTNode[] | null;
}

export interface WhenBranchNode {
  kind: 'WhenBranch';
  condition: ASTNode;
  body: ASTNode[];
}

export interface CheckNode {
  kind: 'Check';
  target: ASTNode;
  cases: CheckCaseNode[];
}

export interface CheckCaseNode {
  name: string;
  binding: string | null;
  body: ASTNode[];
}

export interface RepeatNode {
  kind: 'Repeat';
  count: ASTNode;
  label: string | null;
  body: ASTNode[];
}

export interface WhileNode {
  kind: 'While';
  condition: ASTNode;
  body: ASTNode[];
}

export interface ForEachNode {
  kind: 'ForEach';
  variable: string;
  indexVariable: string | null;
  iterable: ASTNode;
  body: ASTNode[];
  parallel?: boolean;  // Phase 22: parallel for-each
}

export interface LabelNode {
  kind: 'Label';
  name: string;
}

export interface ExitNode {
  kind: 'Exit';
  target: string | null;
}

export interface ContinueNode {
  kind: 'Continue';
}

export interface IncreaseNode {
  kind: 'Increase';
  target: ASTNode;
  amount: ASTNode;
}

export interface SetFieldNode {
  kind: 'SetField';
  target: ASTNode;
  fieldPath: string[];
  value: ASTNode;
}

export interface AssignVarNode {
  kind: 'AssignVar';
  name: string;
  value: ASTNode;
}

export interface FunctionCallStmtNode {
  kind: 'FunctionCallStmt';
  name: string;
  arguments: ASTNode[];
}

export interface BlockNode {
  kind: 'Block';
  statements: ASTNode[];
}

// ---- Expressions ----
export interface BinaryExprNode {
  kind: 'BinaryExpr';
  left: ASTNode;
  operator: string;
  right: ASTNode;
  location?: SourceLocation;  // Phase 14.1: Error location
}

export interface UnaryExprNode {
  kind: 'UnaryExpr';
  operator: string;
  operand: ASTNode;
}

export interface AttachExprNode {
  kind: 'AttachExpr';
  parts: ASTNode[];
}

export interface IdentifierNode {
  kind: 'Identifier';
  name: string;
  location?: SourceLocation;  // Phase 14.1: Error location
}

export interface LiteralNode {
  kind: 'Literal';
  type: 'integer' | 'float' | 'text' | 'boolean' | 'character' | 'nothing' | 'list' | 'null';
  value: unknown;
}

export interface FunctionCallExprNode {
  kind: 'FunctionCallExpr';
  name: string;
  arguments: ASTNode[];
  location?: SourceLocation;  // Phase 14.1: Error location
}

export interface MemberAccessNode {
  kind: 'MemberAccess';
  object: ASTNode;
  field: string;
}

export interface IndexAccessNode {
  kind: 'IndexAccess';
  object: ASTNode;
  index: ASTNode;
}

export interface ListLiteralNode {
  kind: 'ListLiteral';
  elements: ASTNode[];
}

export interface MapLiteralNode {
  kind: 'MapLiteral';
  entries: { key: ASTNode; value: ASTNode }[];
}

export interface ListCompNode {
  kind: 'ListComp';
  expression: ASTNode;
  variable: string;
  iterable: ASTNode;
}

export interface TernaryExprNode {
  kind: 'TernaryExpr';
  condition: ASTNode;
  thenExpr: ASTNode;
  elseExpr: ASTNode;
}

export interface CompoundAssignNode {
  kind: 'CompoundAssign';
  name: string;
  operator: string;
  value: ASTNode;
}

export interface ForceUnwrapNode {
  kind: 'ForceUnwrap';
  expression: ASTNode;
}

export interface OrDefaultNode {
  kind: 'OrDefault';
  expression: ASTNode;
  defaultValue: ASTNode;
}

export interface HasValueNode {
  kind: 'HasValue';
  expression: ASTNode;
}

export interface ValueInsideNode {
  kind: 'ValueInside';
  expression: ASTNode;
}

// ---- Module Declaration ----
export interface ModuleDeclNode {
  kind: 'ModuleDecl';
  name: string;
  exposedNames: string[];
  body: ASTNode[];
}

// ---- Union Type ----
export interface UnionDeclNode {
  kind: 'UnionDecl';
  name: string;
  variants: { name: string; typeName: string }[];
}

// ---- Safe Access (Optional Chaining) ----
export interface SafeAccessNode {
  kind: 'SafeAccess';
  object: ASTNode;
  field: string;
}

// ---- Type Alias ----
export interface TypeAliasNode {
  kind: 'TypeAlias';
  name: string;
  targetType: string;
}

// ---- Destructuring ----
export interface DestructureNode {
  kind: 'Destructure';
  names: string[];
  value: ASTNode;
}

// ---- Match Expression ----
export interface MatchCaseNode {
  kind: 'MatchCase';
  pattern: ASTNode;
  binding: string | null;
  body: ASTNode[];
}

export interface MatchNode {
  kind: 'Match';
  subject: ASTNode;
  cases: MatchCaseNode[];
  otherwise: ASTNode[] | null;
}

// ---- Try/Catch ----
export interface TryCatchNode {
  kind: 'TryCatch';
  tryBody: ASTNode[];
  catchBinding: string | null;
  catchBody: ASTNode[];
}

export interface ThrowNode {
  kind: 'Throw';
  value: ASTNode | null;
}

// ---- Pipeline Expression ----
export interface PipelineExprNode {
  kind: 'PipelineExpr';
  stages: ASTNode[];
}

// ---- Lambda (Anonymous Function) ----
export interface LambdaNode {
  kind: 'Lambda';
  parameters: FunctionParamNode[];
  returnType: string;
  returnQualifiers: string[];
  body: ASTNode[];
}

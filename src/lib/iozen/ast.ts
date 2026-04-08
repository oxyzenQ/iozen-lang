// ============================================================
// IOZEN Language — AST Node Definitions
// Abstract Syntax Tree node types for the IOZEN language
// ============================================================

export type ASTNode =
  | ProgramNode
  | ImportNode
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
  | ForceUnwrapNode
  | OrDefaultNode
  | HasValueNode
  | ValueInsideNode;

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
}

// ---- Declarations ----
export interface VariableDeclNode {
  kind: 'VariableDecl';
  name: string;
  typeName: string;
  qualifiers: string[];
  value: ASTNode | null;
  isConstant: boolean;
}

export interface FunctionDeclNode {
  kind: 'FunctionDecl';
  name: string;
  parameters: FunctionParamNode[];
  returnType: string;
  returnQualifiers: string[];
  body: ASTNode[];
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
  iterable: ASTNode;
  body: ASTNode[];
}

export interface LabelNode {
  kind: 'Label';
  name: string;
}

export interface ExitNode {
  kind: 'Exit';
  target: string | null;
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

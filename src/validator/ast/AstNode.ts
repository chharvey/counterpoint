import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import type {SyntaxNode} from 'tree-sitter';
import {TypeErrorNotAssignable} from '../../index.ts';
import {memoizeGetter} from '../../lib/index.ts';
import type {TYPE} from '../../typer/index.ts';
import {
	stringifyAttributes,
	type Serializable,
	to_serializable,
} from '../../parser/index.ts';
import type {Validator} from '../Validator.ts';
import {
	Index,
	Key,
	ItemType,
	PropertyType,
	Property,
	Case,
	Block,
	Goal,
	TYPE as AST_TYPE,
	EXPR,
	STMT,
} from './index.ts';



/**
 * Type-check an expression to an assignee type.
 * Attempts to check subtyping rules first, but if failing, attempts to assign entry-by-entry
 * if the assigned expression is a variable collection literal.
 *
 * We want to be able to assign mutable collection literals to wider mutable types
 * so that we can mutate them with different values:
 * ```
 * val my_ints: mut Set.<int> = {42}; % <-- assignment should not fail
 * my_ints.put(43);
 * ```
 *
 * Normally, mutable Set types are invariant — that is, if `A` is a subtype of `B`,
 * then `mut Set.<A>` would be unassignable to `mut Set.<B>`.
 * However, when a Set *literal* such as `{a1, a2}` is assigned to a wider mutable type `mut Set.<B>`,
 * it’s too conservative to infer too narrow a type `mut Set.<A>`,
 * since we can predict it will be mutated later with elements of type `B`.
 * Therefore we want to allow the assignment, bypassing invariance.
 *
 * @final
 * @param  assigned      the expression assigned
 * @param  assignee_type the type of the assignee (the variable, bound property, or parameter being (re)assigned)
 * @param  node          the node where the assignment took place
 * @throws {TypeErrorNotAssignable} if the assigned expression’s type is not a subtype of the assignee’s type, and:
 *                       if the assigned expression is not a collection literal,
 *                       is not a reference object,
 *                       or is not entry-wise assignable
 */
export function typecheck_assign(
	assigned:      EXPR.Expression,
	assignee_type: TYPE.Type,
	node:          AstNode,
): void {
	if (!assigned.type().isSubtypeOf(assignee_type)) {
		if (assigned instanceof EXPR.Collection) {
			return assigned.assignTo(assignee_type);
		}
		throw new TypeErrorNotAssignable(assigned, assignee_type, node);
	}
}



interface AstNodeVisitorMethods<T> {
	visitIndex        (node: Index):        T;
	visitKey          (node: Key):          T;
	visitItemType     (node: ItemType):     T;
	visitPropertyType (node: PropertyType): T;
	visitProperty     (node: Property):     T;
	visitCase         (node: Case):         T;
	visitBlock        (node: Block):        T;
	visitGoal         (node: Goal):         T;

	visitTypeConstant        (typenode: AST_TYPE.Constant):        T;
	visitTypeAlias           (typenode: AST_TYPE.TypeAlias):       T;
	visitTypeTuple           (typenode: AST_TYPE.Tuple):           T;
	visitTypeRecord          (typenode: AST_TYPE.Record):          T;
	visitTypeList            (typenode: AST_TYPE.List):            T;
	visitTypeDict            (typenode: AST_TYPE.Dict):            T;
	visitTypeSet             (typenode: AST_TYPE.Set):             T;
	visitTypeMap             (typenode: AST_TYPE.Map):             T;
	visitTypeAccess          (typenode: AST_TYPE.Access):          T;
	visitTypeCall            (typenode: AST_TYPE.Call):            T;
	visitTypeOperationUnary  (typenode: AST_TYPE.OperationUnary):  T;
	visitTypeOperationBinary (typenode: AST_TYPE.OperationBinary): T;
	visitType                (typenode: AST_TYPE.Type):            T;

	visitExprConstant                   (expr: EXPR.Constant):                   T;
	visitVariable                       (expr: EXPR.Variable):                   T;
	visitExprTuple                      (expr: EXPR.Tuple):                      T;
	visitExprRecord                     (expr: EXPR.Record):                     T;
	visitExprList                       (expr: EXPR.List):                       T;
	visitExprDict                       (expr: EXPR.Dict):                       T;
	visitExprSet                        (expr: EXPR.Set):                        T;
	visitExprMap                        (expr: EXPR.Map):                        T;
	visitExprBlock                      (expr: EXPR.ExpressionBlock):            T;
	visitExprAccess                     (expr: EXPR.Access):                     T;
	visitExprCall                       (expr: EXPR.Call):                       T;
	visitClaim                          (expr: EXPR.Claim):                      T;
	visitOperationExprUnary             (expr: EXPR.OperationUnary):             T;
	visitOperationExprBinaryCast        (expr: EXPR.OperationBinaryCast):        T;
	visitOperationExprBinaryArithmetic  (expr: EXPR.OperationBinaryArithmetic):  T;
	visitOperationExprBinaryComparative (expr: EXPR.OperationBinaryComparative): T;
	visitOperationExprBinaryEquality    (expr: EXPR.OperationBinaryEquality):    T;
	visitOperationExprBinaryLogical     (expr: EXPR.OperationBinaryLogical):     T;
	visitOperationExprTernary           (expr: EXPR.OperationTernary):           T;
	visitSwitch                         (expr: EXPR.Switch):                     T;
	visitExpression                     (expr: EXPR.Expression):                 T;

	visitDeclType           (stmt: STMT.DeclarationType):       T;
	visitDeclVariable       (stmt: STMT.DeclarationVariable):   T;
	visitStmtExpr           (stmt: STMT.StatementExpression):   T;
	visitStmtClaim          (stmt: STMT.StatementClaim):        T;
	visitStmtReassignment   (stmt: STMT.StatementReassignment): T;
	visitStmtConditional    (stmt: STMT.StatementConditional):  T;
	visitStatementLoop      (stmt: STMT.StatementLoop):         T;
	visitStatementIteration (stmt: STMT.StatementIteration):    T;
	visitStatementBreak     (stmt: STMT.StatementBreak):        T;

	defaultVisit(node: AstNode): T;
}
export class AstNodeVisitor<T> {
	public constructor(private readonly methods: Partial<AstNodeVisitorMethods<T>>) {}

	/** @final */
	public visit(node: AstNode): T {
		switch (node.constructor) {
			case Index:        { return this.methods.visitIndex        ?.(node as Index)        ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case Key:          { return this.methods.visitKey          ?.(node as Key)          ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case ItemType:     { return this.methods.visitItemType     ?.(node as ItemType)     ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case PropertyType: { return this.methods.visitPropertyType ?.(node as PropertyType) ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case Property:     { return this.methods.visitProperty     ?.(node as Property)     ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case Case:         { return this.methods.visitCase         ?.(node as Case)         ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case Block:        { return this.methods.visitBlock        ?.(node as Block)        ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case Goal:         { return this.methods.visitGoal         ?.(node as Goal)         ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }

			case AST_TYPE.Constant:        { return this.methods.visitTypeConstant        ?.(node as AST_TYPE.Constant)        ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case AST_TYPE.TypeAlias:       { return this.methods.visitTypeAlias           ?.(node as AST_TYPE.TypeAlias)       ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case AST_TYPE.Tuple:           { return this.methods.visitTypeTuple           ?.(node as AST_TYPE.Tuple)           ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case AST_TYPE.Record:          { return this.methods.visitTypeRecord          ?.(node as AST_TYPE.Record)          ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case AST_TYPE.List:            { return this.methods.visitTypeList            ?.(node as AST_TYPE.List)            ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case AST_TYPE.Dict:            { return this.methods.visitTypeDict            ?.(node as AST_TYPE.Dict)            ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case AST_TYPE.Set:             { return this.methods.visitTypeSet             ?.(node as AST_TYPE.Set)             ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case AST_TYPE.Map:             { return this.methods.visitTypeMap             ?.(node as AST_TYPE.Map)             ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case AST_TYPE.Access:          { return this.methods.visitTypeAccess          ?.(node as AST_TYPE.Access)          ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case AST_TYPE.Call:            { return this.methods.visitTypeCall            ?.(node as AST_TYPE.Call)            ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case AST_TYPE.OperationUnary:  { return this.methods.visitTypeOperationUnary  ?.(node as AST_TYPE.OperationUnary)  ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case AST_TYPE.OperationBinary: { return this.methods.visitTypeOperationBinary ?.(node as AST_TYPE.OperationBinary) ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case AST_TYPE.Type:            { return this.methods.visitType                ?.(node as AST_TYPE.Type)            ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }

			case EXPR.Constant:                   { return this.methods.visitExprConstant                   ?.(node as EXPR.Constant)                   ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case EXPR.Variable:                   { return this.methods.visitVariable                       ?.(node as EXPR.Variable)                   ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case EXPR.Tuple:                      { return this.methods.visitExprTuple                      ?.(node as EXPR.Tuple)                      ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case EXPR.Record:                     { return this.methods.visitExprRecord                     ?.(node as EXPR.Record)                     ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case EXPR.List:                       { return this.methods.visitExprList                       ?.(node as EXPR.List)                       ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case EXPR.Dict:                       { return this.methods.visitExprDict                       ?.(node as EXPR.Dict)                       ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case EXPR.Set:                        { return this.methods.visitExprSet                        ?.(node as EXPR.Set)                        ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case EXPR.Map:                        { return this.methods.visitExprMap                        ?.(node as EXPR.Map)                        ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case EXPR.ExpressionBlock:            { return this.methods.visitExprBlock                      ?.(node as EXPR.ExpressionBlock)            ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case EXPR.Access:                     { return this.methods.visitExprAccess                     ?.(node as EXPR.Access)                     ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case EXPR.Call:                       { return this.methods.visitExprCall                       ?.(node as EXPR.Call)                       ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case EXPR.Claim:                      { return this.methods.visitClaim                          ?.(node as EXPR.Claim)                      ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case EXPR.OperationUnary:             { return this.methods.visitOperationExprUnary             ?.(node as EXPR.OperationUnary)             ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case EXPR.OperationBinaryCast:        { return this.methods.visitOperationExprBinaryCast        ?.(node as EXPR.OperationBinaryCast)        ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case EXPR.OperationBinaryArithmetic:  { return this.methods.visitOperationExprBinaryArithmetic  ?.(node as EXPR.OperationBinaryArithmetic)  ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case EXPR.OperationBinaryComparative: { return this.methods.visitOperationExprBinaryComparative ?.(node as EXPR.OperationBinaryComparative) ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case EXPR.OperationBinaryEquality:    { return this.methods.visitOperationExprBinaryEquality    ?.(node as EXPR.OperationBinaryEquality)    ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case EXPR.OperationBinaryLogical:     { return this.methods.visitOperationExprBinaryLogical     ?.(node as EXPR.OperationBinaryLogical)     ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case EXPR.OperationTernary:           { return this.methods.visitOperationExprTernary           ?.(node as EXPR.OperationTernary)           ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case EXPR.Switch:                     { return this.methods.visitSwitch                         ?.(node as EXPR.Switch)                     ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case EXPR.Expression:                 { return this.methods.visitExpression                     ?.(node as EXPR.Expression)                 ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }

			case STMT.DeclarationType:       { return this.methods.visitDeclType           ?.(node as STMT.DeclarationType)       ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case STMT.DeclarationVariable:   { return this.methods.visitDeclVariable       ?.(node as STMT.DeclarationVariable)   ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case STMT.StatementExpression:   { return this.methods.visitStmtExpr           ?.(node as STMT.StatementExpression)   ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case STMT.StatementClaim:        { return this.methods.visitStmtClaim          ?.(node as STMT.StatementClaim)        ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case STMT.StatementReassignment: { return this.methods.visitStmtReassignment   ?.(node as STMT.StatementReassignment) ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case STMT.StatementConditional:  { return this.methods.visitStmtConditional    ?.(node as STMT.StatementConditional)  ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case STMT.StatementLoop:         { return this.methods.visitStatementLoop      ?.(node as STMT.StatementLoop)         ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case STMT.StatementIteration:    { return this.methods.visitStatementIteration ?.(node as STMT.StatementIteration)    ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }
			case STMT.StatementBreak:        { return this.methods.visitStatementBreak     ?.(node as STMT.StatementBreak)        ?? this.methods.defaultVisit?.(node) ?? assert.fail('Missing implementation.'); }

			default: { return this.methods.defaultVisit?.(node) ?? assert.fail('Unexpected subclass.'); }
		}
	}
}



/**
 * An AstNode is a node in the Abstract Syntax Tree
 * and holds only the semantics of a parse node.
 *
 * An AstNode is an abstraction of a ParseNode, without syntactic details.
 * For example, the expression `5 + 2 * 3` can be represented by the following abstract tree:
 * ```xml
 * <Operation operator="+">
 * 	<Constant value="5"/>
 * 	<Operation operator="*">
 * 		<Constant value="2"/>
 * 		<Constant value="3"/>
 * 	</Operation>
 * </Operation>
 * ```
 *
 * Known subclasses:
 * - Index
 * - Key
 * - ItemType
 * - PropertyType
 * - Property
 * - Case
 * - Type
 * - Expression
 * - Statement
 * - Block
 * - Goal
 *
 * Known subinterfaces:
 * - Buildable
 */
export class AstNode implements Serializable {
	/** @implements Serializable */
	public readonly tagname:      string = this.constructor.name;
	/** @implements Serializable */
	public readonly source:       string;
	/** @implements Serializable */
	public readonly source_index: number;
	/** @implements Serializable */
	public readonly line_index:   number;
	/** @implements Serializable */
	public readonly col_index:    number;

	#parent?: AstNode;

	/**
	 * Construct a new AstNode object.
	 *
	 * @param start      The node in the parse tree to which this AstNode corresponds.
	 * @param attributes Any other attributes to attach.
	 * @param children   The set of child inputs that creates this AstNode.
	 */
	public constructor(
		protected readonly start_node: SyntaxNode,
		private   readonly attributes: Record<string, unknown> = {},
		public    readonly children:   readonly AstNode[] = [],
	) {
		const start: Serializable = to_serializable(start_node);

		this.source       = start.source;
		this.source_index = start.source_index;
		this.line_index   = start.line_index;
		this.col_index    = start.col_index;

		children.forEach((c) => {
			c.#parent = this;
		});
	}

	/** The unique parent node containing this node. */
	public get parent(): AstNode | undefined {
		return this.#parent;
	}

	@memoizeGetter
	public get validator(): Validator {
		return this.#parent!.validator;
	}

	/** @implements Serializable */
	public serialize(): string {
		const attributes = new Map<string, string>([
			['line',   (this.line_index + 1).toString()],
			['col',    (this.col_index  + 1).toString()],
			['source', this.source],
		]);
		Object.entries(this.attributes).forEach(([key, value]) => {
			attributes.set(key, `${ value }`);
		});
		const contents: string = this.children.map((child) => child.serialize()).join('');
		return `<${ this.tagname } ${ stringifyAttributes(attributes) }${ (contents) ? `>${ contents }</${ this.tagname }>` : '/>' }`;
	}

	/**
	 * Perform definite assignment phase of semantic analysis:
	 * - Check that all variables have been assigned before being used.
	 * - Check that no varaible is declared more than once.
	 * - Check that read-only variables are not reassigned.
	 */
	public varCheck(): void {
		return xjs.Array.forEachAggregated(this.children, (c) => c.varCheck());
	}

	/**
	 * Type-check the node as part of semantic analysis.
	 */
	public typeCheck(): void {
		return xjs.Array.forEachAggregated(this.children, (c) => c.typeCheck());
	}
}

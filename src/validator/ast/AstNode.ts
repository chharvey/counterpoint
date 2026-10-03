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



export abstract class AstNodeVisitor<T> {
	/* eslint-disable @stylistic/space-before-function-paren */
	public visitIndex        (node: Index):        T { return this.defaultVisit(node); }
	public visitKey          (node: Key):          T { return this.defaultVisit(node); }
	public visitItemType     (node: ItemType):     T { return this.defaultVisit(node); }
	public visitPropertyType (node: PropertyType): T { return this.defaultVisit(node); }
	public visitProperty     (node: Property):     T { return this.defaultVisit(node); }
	public visitCase         (node: Case):         T { return this.defaultVisit(node); }
	public visitBlock        (node: Block):        T { return this.defaultVisit(node); }
	public visitGoal         (node: Goal):         T { return this.defaultVisit(node); }

	public visitTypeConstant        (typenode: AST_TYPE.Constant):        T { return this.defaultVisit(typenode); }
	public visitTypeAlias           (typenode: AST_TYPE.TypeAlias):       T { return this.defaultVisit(typenode); }
	public visitTypeTuple           (typenode: AST_TYPE.Tuple):           T { return this.defaultVisit(typenode); }
	public visitTypeRecord          (typenode: AST_TYPE.Record):          T { return this.defaultVisit(typenode); }
	public visitTypeList            (typenode: AST_TYPE.List):            T { return this.defaultVisit(typenode); }
	public visitTypeDict            (typenode: AST_TYPE.Dict):            T { return this.defaultVisit(typenode); }
	public visitTypeSet             (typenode: AST_TYPE.Set):             T { return this.defaultVisit(typenode); }
	public visitTypeMap             (typenode: AST_TYPE.Map):             T { return this.defaultVisit(typenode); }
	public visitTypeAccess          (typenode: AST_TYPE.Access):          T { return this.defaultVisit(typenode); }
	public visitTypeCall            (typenode: AST_TYPE.Call):            T { return this.defaultVisit(typenode); }
	public visitTypeOperationUnary  (typenode: AST_TYPE.OperationUnary):  T { return this.defaultVisit(typenode); }
	public visitTypeOperationBinary (typenode: AST_TYPE.OperationBinary): T { return this.defaultVisit(typenode); }
	public visitTypeFunction        (typenode: AST_TYPE.Function):        T { return this.defaultVisit(typenode); }
	public visitType                (typenode: AST_TYPE.Type):            T { return this.defaultVisit(typenode); }

	public visitExprConstant                   (expr: EXPR.Constant):                   T { return this.defaultVisit(expr); }
	public visitTemplate                       (expr: EXPR.Template):                   T { return this.defaultVisit(expr); }
	public visitVariable                       (expr: EXPR.Variable):                   T { return this.defaultVisit(expr); }
	public visitExprTuple                      (expr: EXPR.Tuple):                      T { return this.defaultVisit(expr); }
	public visitExprRecord                     (expr: EXPR.Record):                     T { return this.defaultVisit(expr); }
	public visitExprList                       (expr: EXPR.List):                       T { return this.defaultVisit(expr); }
	public visitExprDict                       (expr: EXPR.Dict):                       T { return this.defaultVisit(expr); }
	public visitExprSet                        (expr: EXPR.Set):                        T { return this.defaultVisit(expr); }
	public visitExprMap                        (expr: EXPR.Map):                        T { return this.defaultVisit(expr); }
	public visitExprBlock                      (expr: EXPR.ExpressionBlock):            T { return this.defaultVisit(expr); }
	public visitExprAccess                     (expr: EXPR.Access):                     T { return this.defaultVisit(expr); }
	public visitExprCall                       (expr: EXPR.Call):                       T { return this.defaultVisit(expr); }
	public visitExprClaim                      (expr: EXPR.Claim):                      T { return this.defaultVisit(expr); }
	public visitOperationExprUnary             (expr: EXPR.OperationUnary):             T { return this.defaultVisit(expr); }
	public visitOperationExprBinaryCast        (expr: EXPR.OperationBinaryCast):        T { return this.defaultVisit(expr); }
	public visitOperationExprBinaryArithmetic  (expr: EXPR.OperationBinaryArithmetic):  T { return this.defaultVisit(expr); }
	public visitOperationExprBinaryComparative (expr: EXPR.OperationBinaryComparative): T { return this.defaultVisit(expr); }
	public visitOperationExprBinaryEquality    (expr: EXPR.OperationBinaryEquality):    T { return this.defaultVisit(expr); }
	public visitOperationExprBinaryLogical     (expr: EXPR.OperationBinaryLogical):     T { return this.defaultVisit(expr); }
	public visitOperationExprTernary           (expr: EXPR.OperationTernary):           T { return this.defaultVisit(expr); }
	public visitSwitch                         (expr: EXPR.Switch):                     T { return this.defaultVisit(expr); }
	public visitExprFunction                   (expr: EXPR.Function):                   T { return this.defaultVisit(expr); }
	public visitExpression                     (expr: EXPR.Expression):                 T { return this.defaultVisit(expr); }

	public visitDeclType           (stmt: STMT.DeclarationType):       T { return this.defaultVisit(stmt); }
	public visitDeclVariable       (stmt: STMT.DeclarationVariable):   T { return this.defaultVisit(stmt); }
	public visitDeclFunction       (stmt: STMT.DeclarationFunction):   T { return this.defaultVisit(stmt); }
	public visitStmtExpr           (stmt: STMT.StatementExpression):   T { return this.defaultVisit(stmt); }
	public visitStmtClaim          (stmt: STMT.StatementClaim):        T { return this.defaultVisit(stmt); }
	public visitStmtReassignment   (stmt: STMT.StatementReassignment): T { return this.defaultVisit(stmt); }
	public visitStmtConditional    (stmt: STMT.StatementConditional):  T { return this.defaultVisit(stmt); }
	public visitStatementLoop      (stmt: STMT.StatementLoop):         T { return this.defaultVisit(stmt); }
	public visitStatementIteration (stmt: STMT.StatementIteration):    T { return this.defaultVisit(stmt); }
	public visitStatementBreak     (stmt: STMT.StatementBreak):        T { return this.defaultVisit(stmt); }
	public visitStatementReturn    (stmt: STMT.StatementReturn):       T { return this.defaultVisit(stmt); }
	public visitStatement          (stmt: STMT.Statement):             T { return this.defaultVisit(stmt); }
	/* eslint-enable @stylistic/space-before-function-paren */

	public abstract defaultVisit(node: AstNode): T;

	/** @final */
	public visit(node: AstNode): T {
		switch (node.constructor) {
			case Index:        { return this.visitIndex        (node as Index); }
			case Key:          { return this.visitKey          (node as Key); }
			case ItemType:     { return this.visitItemType     (node as ItemType); }
			case PropertyType: { return this.visitPropertyType (node as PropertyType); }
			case Property:     { return this.visitProperty     (node as Property); }
			case Case:         { return this.visitCase         (node as Case); }
			case Block:        { return this.visitBlock        (node as Block); }
			case Goal:         { return this.visitGoal         (node as Goal); }

			case AST_TYPE.Constant:        { return this.visitTypeConstant        (node as AST_TYPE.Constant); }
			case AST_TYPE.TypeAlias:       { return this.visitTypeAlias           (node as AST_TYPE.TypeAlias); }
			case AST_TYPE.Tuple:           { return this.visitTypeTuple           (node as AST_TYPE.Tuple); }
			case AST_TYPE.Record:          { return this.visitTypeRecord          (node as AST_TYPE.Record); }
			case AST_TYPE.List:            { return this.visitTypeList            (node as AST_TYPE.List); }
			case AST_TYPE.Dict:            { return this.visitTypeDict            (node as AST_TYPE.Dict); }
			case AST_TYPE.Set:             { return this.visitTypeSet             (node as AST_TYPE.Set); }
			case AST_TYPE.Map:             { return this.visitTypeMap             (node as AST_TYPE.Map); }
			case AST_TYPE.Access:          { return this.visitTypeAccess          (node as AST_TYPE.Access); }
			case AST_TYPE.Call:            { return this.visitTypeCall            (node as AST_TYPE.Call); }
			case AST_TYPE.OperationUnary:  { return this.visitTypeOperationUnary  (node as AST_TYPE.OperationUnary); }
			case AST_TYPE.OperationBinary: { return this.visitTypeOperationBinary (node as AST_TYPE.OperationBinary); }
			case AST_TYPE.Function:        { return this.visitTypeFunction        (node as AST_TYPE.Function); }
			case AST_TYPE.Type:            { return this.visitType                (node as AST_TYPE.Type); }

			case EXPR.Constant:                   { return this.visitExprConstant                   (node as EXPR.Constant); }
			case EXPR.Template:                   { return this.visitTemplate                       (node as EXPR.Template); }
			case EXPR.Variable:                   { return this.visitVariable                       (node as EXPR.Variable); }
			case EXPR.Tuple:                      { return this.visitExprTuple                      (node as EXPR.Tuple); }
			case EXPR.Record:                     { return this.visitExprRecord                     (node as EXPR.Record); }
			case EXPR.List:                       { return this.visitExprList                       (node as EXPR.List); }
			case EXPR.Dict:                       { return this.visitExprDict                       (node as EXPR.Dict); }
			case EXPR.Set:                        { return this.visitExprSet                        (node as EXPR.Set); }
			case EXPR.Map:                        { return this.visitExprMap                        (node as EXPR.Map); }
			case EXPR.ExpressionBlock:            { return this.visitExprBlock                      (node as EXPR.ExpressionBlock); }
			case EXPR.Access:                     { return this.visitExprAccess                     (node as EXPR.Access); }
			case EXPR.Call:                       { return this.visitExprCall                       (node as EXPR.Call); }
			case EXPR.Claim:                      { return this.visitExprClaim                      (node as EXPR.Claim); }
			case EXPR.OperationUnary:             { return this.visitOperationExprUnary             (node as EXPR.OperationUnary); }
			case EXPR.OperationBinaryCast:        { return this.visitOperationExprBinaryCast        (node as EXPR.OperationBinaryCast); }
			case EXPR.OperationBinaryArithmetic:  { return this.visitOperationExprBinaryArithmetic  (node as EXPR.OperationBinaryArithmetic); }
			case EXPR.OperationBinaryComparative: { return this.visitOperationExprBinaryComparative (node as EXPR.OperationBinaryComparative); }
			case EXPR.OperationBinaryEquality:    { return this.visitOperationExprBinaryEquality    (node as EXPR.OperationBinaryEquality); }
			case EXPR.OperationBinaryLogical:     { return this.visitOperationExprBinaryLogical     (node as EXPR.OperationBinaryLogical); }
			case EXPR.OperationTernary:           { return this.visitOperationExprTernary           (node as EXPR.OperationTernary); }
			case EXPR.Switch:                     { return this.visitSwitch                         (node as EXPR.Switch); }
			case EXPR.Function:                   { return this.visitExprFunction                   (node as EXPR.Function); }
			case EXPR.Expression:                 { return this.visitExpression                     (node as EXPR.Expression); }

			case STMT.DeclarationType:       { return this.visitDeclType           (node as STMT.DeclarationType); }
			case STMT.DeclarationVariable:   { return this.visitDeclVariable       (node as STMT.DeclarationVariable); }
			case STMT.DeclarationFunction:   { return this.visitDeclFunction       (node as STMT.DeclarationFunction); }
			case STMT.StatementExpression:   { return this.visitStmtExpr           (node as STMT.StatementExpression); }
			case STMT.StatementClaim:        { return this.visitStmtClaim          (node as STMT.StatementClaim); }
			case STMT.StatementReassignment: { return this.visitStmtReassignment   (node as STMT.StatementReassignment); }
			case STMT.StatementConditional:  { return this.visitStmtConditional    (node as STMT.StatementConditional); }
			case STMT.StatementLoop:         { return this.visitStatementLoop      (node as STMT.StatementLoop); }
			case STMT.StatementIteration:    { return this.visitStatementIteration (node as STMT.StatementIteration); }
			case STMT.StatementBreak:        { return this.visitStatementBreak     (node as STMT.StatementBreak); }
			case STMT.StatementReturn:       { return this.visitStatementReturn    (node as STMT.StatementReturn); }
			case STMT.Statement:             { return this.visitStatement          (node as STMT.Statement); }

			default: { return this.defaultVisit(node); }
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
 * - ParameterFunction
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

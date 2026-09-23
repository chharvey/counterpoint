import * as assert from 'node:assert';
import type {
	Builder,
	OP,
} from '../../../index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {TYPE} from '../../../typer/index.ts';
import {STMT} from '../index.ts';
import {AstNode} from '../AstNode.ts';
import {
	Constant,
	Variable,
	Tuple,
	Record,
	List,
	Dict,
	Set,
	Map,
	ExpressionBlock,
	Access,
	Call,
	Claim,
	OperationUnary,
	OperationBinaryCast,
	OperationBinaryArithmetic,
	OperationBinaryComparative,
	OperationBinaryEquality,
	OperationBinaryLogical,
	OperationTernary,
	Switch,
} from './index.ts';



interface ExprVisitorMethods<T> {
	visitConstant                   (expr: Constant):                   T;
	visitVariable                   (expr: Variable):                   T;
	visitTuple                      (expr: Tuple):                      T;
	visitRecord                     (expr: Record):                     T;
	visitList                       (expr: List):                       T;
	visitDict                       (expr: Dict):                       T;
	visitSet                        (expr: Set):                        T;
	visitMap                        (expr: Map):                        T;
	visitExprBlock                  (expr: ExpressionBlock):            T;
	visitAccess                     (expr: Access):                     T;
	visitCall                       (expr: Call):                       T;
	visitClaim                      (expr: Claim):                      T;
	visitOperationUnary             (expr: OperationUnary):             T;
	visitOperationBinaryCast        (expr: OperationBinaryCast):        T;
	visitOperationBinaryArithmetic  (expr: OperationBinaryArithmetic):  T;
	visitOperationBinaryComparative (expr: OperationBinaryComparative): T;
	visitOperationBinaryEquality    (expr: OperationBinaryEquality):    T;
	visitOperationBinaryLogical     (expr: OperationBinaryLogical):     T;
	visitOperationTernary           (expr: OperationTernary):           T;
	visitSwitch                     (expr: Switch):                     T;

	defaultVisit(expr: Expression): T;
}
export class ExprVisitor<T> {
	public constructor(private readonly methods: Partial<ExprVisitorMethods<T>>) {}

	/** @final */
	public visit(expr: Expression): T {
		switch (expr.constructor) {
			case Constant:                   { return this.methods.visitConstant                   ?.(expr as Constant)                   ?? this.methods.defaultVisit?.(expr) ?? assert.fail('Missing implementation.'); }
			case Variable:                   { return this.methods.visitVariable                   ?.(expr as Variable)                   ?? this.methods.defaultVisit?.(expr) ?? assert.fail('Missing implementation.'); }
			case Tuple:                      { return this.methods.visitTuple                      ?.(expr as Tuple)                      ?? this.methods.defaultVisit?.(expr) ?? assert.fail('Missing implementation.'); }
			case Record:                     { return this.methods.visitRecord                     ?.(expr as Record)                     ?? this.methods.defaultVisit?.(expr) ?? assert.fail('Missing implementation.'); }
			case List:                       { return this.methods.visitList                       ?.(expr as List)                       ?? this.methods.defaultVisit?.(expr) ?? assert.fail('Missing implementation.'); }
			case Dict:                       { return this.methods.visitDict                       ?.(expr as Dict)                       ?? this.methods.defaultVisit?.(expr) ?? assert.fail('Missing implementation.'); }
			case Set:                        { return this.methods.visitSet                        ?.(expr as Set)                        ?? this.methods.defaultVisit?.(expr) ?? assert.fail('Missing implementation.'); }
			case Map:                        { return this.methods.visitMap                        ?.(expr as Map)                        ?? this.methods.defaultVisit?.(expr) ?? assert.fail('Missing implementation.'); }
			case ExpressionBlock:            { return this.methods.visitExprBlock                  ?.(expr as ExpressionBlock)            ?? this.methods.defaultVisit?.(expr) ?? assert.fail('Missing implementation.'); }
			case Access:                     { return this.methods.visitAccess                     ?.(expr as Access)                     ?? this.methods.defaultVisit?.(expr) ?? assert.fail('Missing implementation.'); }
			case Call:                       { return this.methods.visitCall                       ?.(expr as Call)                       ?? this.methods.defaultVisit?.(expr) ?? assert.fail('Missing implementation.'); }
			case Claim:                      { return this.methods.visitClaim                      ?.(expr as Claim)                      ?? this.methods.defaultVisit?.(expr) ?? assert.fail('Missing implementation.'); }
			case OperationUnary:             { return this.methods.visitOperationUnary             ?.(expr as OperationUnary)             ?? this.methods.defaultVisit?.(expr) ?? assert.fail('Missing implementation.'); }
			case OperationBinaryCast:        { return this.methods.visitOperationBinaryCast        ?.(expr as OperationBinaryCast)        ?? this.methods.defaultVisit?.(expr) ?? assert.fail('Missing implementation.'); }
			case OperationBinaryArithmetic:  { return this.methods.visitOperationBinaryArithmetic  ?.(expr as OperationBinaryArithmetic)  ?? this.methods.defaultVisit?.(expr) ?? assert.fail('Missing implementation.'); }
			case OperationBinaryComparative: { return this.methods.visitOperationBinaryComparative ?.(expr as OperationBinaryComparative) ?? this.methods.defaultVisit?.(expr) ?? assert.fail('Missing implementation.'); }
			case OperationBinaryEquality:    { return this.methods.visitOperationBinaryEquality    ?.(expr as OperationBinaryEquality)    ?? this.methods.defaultVisit?.(expr) ?? assert.fail('Missing implementation.'); }
			case OperationBinaryLogical:     { return this.methods.visitOperationBinaryLogical     ?.(expr as OperationBinaryLogical)     ?? this.methods.defaultVisit?.(expr) ?? assert.fail('Missing implementation.'); }
			case OperationTernary:           { return this.methods.visitOperationTernary           ?.(expr as OperationTernary)           ?? this.methods.defaultVisit?.(expr) ?? assert.fail('Missing implementation.'); }
			case Switch:                     { return this.methods.visitSwitch                     ?.(expr as Switch)                     ?? this.methods.defaultVisit?.(expr) ?? assert.fail('Missing implementation.'); }
			default:                         { return                                                                                        this.methods.defaultVisit?.(expr) ?? assert.fail('Unexpected subclass.'); }
		}
	}
}



/**
 * A sematic node representing a value expression.
 * Known subclasses:
 * - Constant
 * - Template
 * - Variable
 * - Collection
 * - ExpressionBlock
 * - Access
 * - Call
 * - Claim
 * - Operation
 * - Switch
 *
 * Known subinterfaces:
 * - Reassignable
 */
export abstract class Expression extends AstNode {
	/**
	 * Construct a new Expression from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new Expression representing the given source
	 */
	public static fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Expression {
		const statement_expr: STMT.StatementExpression = STMT.StatementExpression.fromSource(`${ src };`, config);
		assert.ok(statement_expr.expr, 'semantic statement expression should have 1 child');
		return statement_expr.expr;
	}

	/**
	 * @final
	 */
	public override typeCheck(): void {
		super.typeCheck();
		this.type(); // assert does not throw
	}

	/**
	 * The Type of this expression.
	 * @return the compile-time type of this node
	 */
	public abstract type(): TYPE.Type;

	/**
	 * Builds a high-level IR value from this AST node.
	 * @param  builder the IR-builder
	 * @return         an IR value
	 */
	public abstract build(builder: Builder): OP.Value;
}

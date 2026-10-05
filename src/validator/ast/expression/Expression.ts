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
	Template,
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
	Function as ExpressionFunction,
} from './index.ts';



export abstract class ExprVisitor<T> {
	/* eslint-disable @stylistic/space-before-function-paren */
	public visitConstant                   (expr: Constant):                   T { return this.defaultVisit(expr); }
	public visitTemplate                   (expr: Template):                   T { return this.defaultVisit(expr); }
	public visitVariable                   (expr: Variable):                   T { return this.defaultVisit(expr); }
	public visitTuple                      (expr: Tuple):                      T { return this.defaultVisit(expr); }
	public visitRecord                     (expr: Record):                     T { return this.defaultVisit(expr); }
	public visitList                       (expr: List):                       T { return this.defaultVisit(expr); }
	public visitDict                       (expr: Dict):                       T { return this.defaultVisit(expr); }
	public visitSet                        (expr: Set):                        T { return this.defaultVisit(expr); }
	public visitMap                        (expr: Map):                        T { return this.defaultVisit(expr); }
	public visitExprBlock                  (expr: ExpressionBlock):            T { return this.defaultVisit(expr); }
	public visitAccess                     (expr: Access):                     T { return this.defaultVisit(expr); }
	public visitCall                       (expr: Call):                       T { return this.defaultVisit(expr); }
	public visitClaim                      (expr: Claim):                      T { return this.defaultVisit(expr); }
	public visitOperationUnary             (expr: OperationUnary):             T { return this.defaultVisit(expr); }
	public visitOperationBinaryCast        (expr: OperationBinaryCast):        T { return this.defaultVisit(expr); }
	public visitOperationBinaryArithmetic  (expr: OperationBinaryArithmetic):  T { return this.defaultVisit(expr); }
	public visitOperationBinaryComparative (expr: OperationBinaryComparative): T { return this.defaultVisit(expr); }
	public visitOperationBinaryEquality    (expr: OperationBinaryEquality):    T { return this.defaultVisit(expr); }
	public visitOperationBinaryLogical     (expr: OperationBinaryLogical):     T { return this.defaultVisit(expr); }
	public visitOperationTernary           (expr: OperationTernary):           T { return this.defaultVisit(expr); }
	public visitSwitch                     (expr: Switch):                     T { return this.defaultVisit(expr); }
	public visitFunction                   (expr: ExpressionFunction):         T { return this.defaultVisit(expr); }
	/* eslint-enable @stylistic/space-before-function-paren */

	public abstract defaultVisit(expr: Expression): T;

	/** @final */
	public visit(expr: Expression): T {
		switch (expr.constructor) {
			case Constant:                   { return this.visitConstant                   (expr as Constant); }
			case Template:                   { return this.visitTemplate                   (expr as Template); }
			case Variable:                   { return this.visitVariable                   (expr as Variable); }
			case Tuple:                      { return this.visitTuple                      (expr as Tuple); }
			case Record:                     { return this.visitRecord                     (expr as Record); }
			case List:                       { return this.visitList                       (expr as List); }
			case Dict:                       { return this.visitDict                       (expr as Dict); }
			case Set:                        { return this.visitSet                        (expr as Set); }
			case Map:                        { return this.visitMap                        (expr as Map); }
			case ExpressionBlock:            { return this.visitExprBlock                  (expr as ExpressionBlock); }
			case Access:                     { return this.visitAccess                     (expr as Access); }
			case Call:                       { return this.visitCall                       (expr as Call); }
			case Claim:                      { return this.visitClaim                      (expr as Claim); }
			case OperationUnary:             { return this.visitOperationUnary             (expr as OperationUnary); }
			case OperationBinaryCast:        { return this.visitOperationBinaryCast        (expr as OperationBinaryCast); }
			case OperationBinaryArithmetic:  { return this.visitOperationBinaryArithmetic  (expr as OperationBinaryArithmetic); }
			case OperationBinaryComparative: { return this.visitOperationBinaryComparative (expr as OperationBinaryComparative); }
			case OperationBinaryEquality:    { return this.visitOperationBinaryEquality    (expr as OperationBinaryEquality); }
			case OperationBinaryLogical:     { return this.visitOperationBinaryLogical     (expr as OperationBinaryLogical); }
			case OperationTernary:           { return this.visitOperationTernary           (expr as OperationTernary); }
			case Switch:                     { return this.visitSwitch                     (expr as Switch); }
			case ExpressionFunction:         { return this.visitFunction                   (expr as ExpressionFunction); }

			default: { return this.defaultVisit(expr); }
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
 * - ExpressionFunction
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
		const statement_expr: STMT.StatementExpression = STMT.StatementExpression.fromSource(`${src};`, config);
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

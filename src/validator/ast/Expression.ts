import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import {
	VALUE,
	TYPE,
	type Optimizer,
	type IR,
	ErrorCode,
} from '../../index.ts';
import {assert_context_name} from '../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import {StatementExpression} from './index.ts';
import {AstNode} from './AstNode.ts';
import type {Buildable} from './Buildable.ts';



/**
 * Decorator for {@link Expression#build} method and any overrides.
 * First tries to compute the assessed value, and if successful, builds the assessed value.
 * Otherwise builds this node.
 * @implements MethodDecorator<Expression, Expression['build']>
 */
export function buildDeco(
	method:  Expression['build'],
	context: ClassMethodDecoratorContext<Expression, typeof method>,
): typeof method {
	assert_context_name(context, 'build');
	return function (this: Expression) {
		return this.fold()?.build(this.builder) ?? method.call(this);
	};
}



/**
 * Decorator for {@link Expression#type} method and any overrides.
 * Type-checks and re-throws any type errors first,
 * then computes assessed value (if applicable), and if successful,
 * returns a constant type equal to that assessed value.
 * @implements MethodDecorator<Expression, Expression['type']>
 */
export function typeDeco(
	method:  Expression['type'],
	context: ClassMethodDecoratorContext<Expression, typeof method>,
): typeof method {
	assert_context_name(context, 'type');
	return function (this: Expression) {
		const type: TYPE.Type = method.call(this); // type-check first, to re-throw any TypeErrors
		let value: VALUE.Value | null = null;
		try {
			value = this.fold();
		} catch (err) {
			if (err instanceof ErrorCode) {
				// ignore evaluation errors such as VoidError, NanError, etc.
				return TYPE.NOTHING;
			} else {
				throw err;
			}
		}
		if (!!value && value instanceof VALUE.Primitive) {
			return value.toType();
		}
		return type;
	};
}



/**
 * A sematic node representing an expression.
 * Known subclasses:
 * - Constant
 * - Template
 * - Variable
 * - CollectionLiteral
 * - ExpressionBlock
 * - Access
 * - Call
 * - Claim
 * - Operation
 */
export abstract class Expression extends AstNode implements Buildable {
	/**
	 * Construct a new Expression from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new Expression representing the given source
	 */
	public static fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Expression {
		const statement_expr: StatementExpression = StatementExpression.fromSource(`${ src };`, config);
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
	 * @inheritdoc
	 * @implements Buildable
	 */
	public abstract build(): binaryen.ExpressionRef;

	/**
	 * The Type of this expression.
	 * @return the compile-time type of this node
	 */
	public abstract type(): TYPE.Type;

	/**
	 * Lower this AST node to a high-level IR value.
	 * @param  optimizer the set of instructions to build the IR
	 * @return           an optimized value
	 */
	public abstract lower(optimizer: Optimizer): IR.Value;

	/**
	 * Assess the value of this node at compile-time, if possible.
	 * @return the computed value of this node, or an abrupt completion if the value cannot be computed by the compiler
	 */
	public abstract fold(): VALUE.Value | null;
}

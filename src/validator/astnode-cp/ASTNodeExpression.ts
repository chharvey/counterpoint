import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import {
	VALUE,
	TYPE,
	type Optimizer,
	type Lowerable,
	type IR,
	ErrorCode,
} from '../../index.ts';
import {assert_context_name} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import {ASTNodeStatementExpression} from './index.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {Buildable} from './Buildable.ts';



/**
 * Decorator for {@link ASTNodeExpression#lower} method and any overrides.
 * First tries to compute the assessed value, and if successful, lowers the assessed value.
 * Otherwise lowers this node.
 * @implements MethodDecorator<ASTNodeExpression, ASTNodeExpression['lower']>
 */
export function lowerDeco(
	method:  ASTNodeExpression['lower'],
	context: ClassMethodDecoratorContext<ASTNodeExpression, typeof method>,
): typeof method {
	assert_context_name(context, 'lower');
	return function (this: ASTNodeExpression, optimizer?: Optimizer) {
		return this.fold()?.lower() ?? method.call(this, optimizer);
	};
}



/**
 * Decorator for {@link ASTNodeExpression#build} method and any overrides.
 * First tries to compute the assessed value, and if successful, builds the assessed value.
 * Otherwise builds this node.
 * @implements MethodDecorator<ASTNodeExpression, ASTNodeExpression['build']>
 */
export function buildDeco(
	method:  ASTNodeExpression['build'],
	context: ClassMethodDecoratorContext<ASTNodeExpression, typeof method>,
): typeof method {
	assert_context_name(context, 'build');
	return function (this: ASTNodeExpression) {
		return this.fold()?.build(this.builder) ?? method.call(this);
	};
}



/**
 * Decorator for {@link ASTNodeExpression#type} method and any overrides.
 * Type-checks and re-throws any type errors first,
 * then computes assessed value (if applicable), and if successful,
 * returns a constant type equal to that assessed value.
 * @implements MethodDecorator<ASTNodeExpression, ASTNodeExpression['type']>
 */
export function typeDeco(
	method:  ASTNodeExpression['type'],
	context: ClassMethodDecoratorContext<ASTNodeExpression, typeof method>,
): typeof method {
	assert_context_name(context, 'type');
	return function (this: ASTNodeExpression) {
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
 * - ASTNodeConstant
 * - ASTNodeVariable
 * - ASTNodeTemplate
 * - ASTNodeCollectionLiteral
 * - ASTNodeExpressionBlock
 * - ASTNodeAccess
 * - ASTNodeCall
 * - ASTNodeClaim
 * - ASTNodeOperation
 */
export abstract class ASTNodeExpression extends ASTNodeCP implements Lowerable<IR.Value>, Buildable {
	/**
	 * Construct a new ASTNodeExpression from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new ASTNodeExpression representing the given source
	 */
	public static fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeExpression {
		const statement_expr: ASTNodeStatementExpression = ASTNodeStatementExpression.fromSource(`${ src };`, config);
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
	 * @implements Lowerable
	 */
	public abstract lower(optimizer?: Optimizer): IR.Value;

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
	 * Assess the value of this node at compile-time, if possible.
	 * @return the computed value of this node, or an abrupt completion if the value cannot be computed by the compiler
	 */
	public abstract fold(): VALUE.Value | null;
}

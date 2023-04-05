import * as assert from 'assert';
import type binaryen from 'binaryen';
import {
	OBJ,
	TYPE,
	type Builder,
	ErrorCode,
} from '../../index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import {ASTNodeStatementExpression} from './index.js';
import type {Buildable} from './Buildable.js';
import {ASTNodeCP} from './ASTNodeCP.js';



/**
 * A sematic node representing an expression.
 * Known subclasses:
 * - ASTNodeConstant
 * - ASTNodeVariable
 * - ASTNodeTemplate
 * - ASTNodeCollectionLiteral
 * - ASTNodeAccess
 * - ASTNodeCall
 * - ASTNodeClaim
 * - ASTNodeOperation
 */
export abstract class ASTNodeExpression extends ASTNodeCP implements Buildable {
	/**
	 * Decorator for {@link ASTNodeExpression#type} method and any overrides.
	 * Type-checks and re-throws any type errors first,
	 * then computes assessed value (if applicable), and if successful,
	 * returns a constant type equal to that assessed value.
	 * @implements MethodDecorator<ASTNodeExpression, ASTNodeExpression['type']>
	 */
	protected static typeDeco(
		method:   ASTNodeExpression['type'],
		_context: ClassMethodDecoratorContext<ASTNodeExpression, typeof method>,
	): typeof method {
		return function (this: ASTNodeExpression) {
			const type: TYPE.Type = method.call(this); // type-check first, to re-throw any TypeErrors
			if (this.validator.config.compilerOptions.constantFolding) {
				let value: OBJ.Object | null = null;
				try {
					value = this.fold();
				} catch (err) {
					if (err instanceof ErrorCode) {
						// ignore evaluation errors such as VoidError, NanError, etc.
						return TYPE.NEVER;
					} else {
						throw err;
					}
				}
				if (!!value && value instanceof OBJ.Primitive) {
					return value.toType();
				}
			}
			return type;
		};
	}

	/**
	 * Decorator for {@link ASTNodeExpression#build} method and any overrides.
	 * First tries to compute the assessed value, and if successful, builds the assessed value.
	 * Otherwise builds this node.
	 * @implements MethodDecorator<ASTNodeExpression, (this: ASTNodeExpression, builder: Builder) => binaryen.ExpressionRef>
	 */
	protected static buildDeco(
		method:   (this: ASTNodeExpression, builder: Builder) => binaryen.ExpressionRef,
		_context: ClassMethodDecoratorContext<ASTNodeExpression, typeof method>,
	): typeof method {
		return function (builder) {
			const value: OBJ.Object | null = (this.validator.config.compilerOptions.constantFolding) ? this.fold() : null;
			return (value) ? value.build(builder.module) : method.call(this, builder);
		};
	}

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
	 * @implements Buildable
	 */
	public abstract build(builder: Builder): binaryen.ExpressionRef;

	/**
	 * The Type of this expression.
	 * @return the compile-time type of this node
	 */
	public abstract type(): TYPE.Type;

	/**
	 * Assess the value of this node at compile-time, if possible.
	 * If {@link CPConfig|constant folding} is off, this should not be called.
	 * @return the computed value of this node, or an abrupt completion if the value cannot be computed by the compiler
	 */
	public abstract fold(): OBJ.Object | null;
}

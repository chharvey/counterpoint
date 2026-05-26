import * as assert from 'node:assert';
import type {
	Optimizer,
	IR,
} from '../../index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {
	VALUE,
	TYPE,
} from '../../typer/index.ts';
import {StatementExpression} from './index.ts';
import {AstNode} from './AstNode.ts';



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
	 * The Type of this expression.
	 * @return the compile-time type of this node
	 */
	public abstract type(): TYPE.Type;

	/**
	 * Builds a high-level IR value from this AST node.
	 * @param  optimizer the set of instructions to build the IR
	 * @return           an optimized value
	 */
	public abstract build(optimizer: Optimizer): IR.Value;

	/**
	 * Assess the value of this node at compile-time, if possible.
	 * @return the computed value of this node, or an abrupt completion if the value cannot be computed by the compiler
	 */
	public abstract fold(): VALUE.Value | null;
}

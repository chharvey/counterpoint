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



/**
 * A sematic node representing a value expression.
 * Known subclasses:
 * - Constant
 * - Template
 * - Variable
 * - Collection
 * - Access
 * - Call
 * - Claim
 * - Isset
 * - ExpressionBlock
 * - Operation
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

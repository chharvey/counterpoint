import * as assert from 'node:assert';
import type {
	VALUE,
	TYPE,
	Optimizer,
	IR,
} from '../../index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import {ASTNodeStatementExpression} from './index.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';



/**
 * A sematic node representing an expression.
 * Known subclasses:
 * - ASTNodeConstant
 * - ASTNodeTemplate
 * - ASTNodeVariable
 * - ASTNodeCollectionLiteral
 * - ASTNodeExpressionBlock
 * - ASTNodeAccess
 * - ASTNodeCall
 * - ASTNodeClaim
 * - ASTNodeOperation
 */
export abstract class ASTNodeExpression extends ASTNodeCP {
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

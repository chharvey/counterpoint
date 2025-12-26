import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import {assert_context_name} from '../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import {Block} from './index.ts';
import {AstNode} from './AstNode.ts';
import type {Foldable} from './Foldable.ts';
import type {Buildable} from './Buildable.ts';



/**
 * Decorator for {@link Statement#build} method and any overrides.
 * Returns `(nop)` if this node is foldable, else calls the `build()` method.
 * @implements MethodDecorator<Statement, Statement['build']>
 */
export function buildDeco(
	method:  Statement['build'],
	context: ClassMethodDecoratorContext<Statement, typeof method>,
): typeof method {
	assert_context_name(context, 'build');
	return function (this: Statement) {
		return this.isFoldable ? this.builder.module.nop() : method.call(this);
	};
}



/**
 * A sematic node representing a statement.
 * Known subclasses:
 * - Declaration
 * - StatementExpression
 * - StatementClaim
 * - StatementReassignment
 * - StatementConditional
 * - StatementLoop
 * - StatementIteration
 * - StatementBreak
 */
export abstract class Statement extends AstNode implements Foldable, Buildable {
	/**
	 * Construct a new Statement from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new Statement representing the given source
	 */
	public static fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Statement {
		const block: Block = Block.fromSource(`{ ${ src } }`, config);
		assert.strictEqual(block.children.length, 1, 'semantic block should have 1 child');
		return block.children[0];
	}


	/** @implements Foldable */
	public abstract get isFoldable(): boolean;

	/** @implements Foldable */
	public abstract get hasBottomType(): boolean;

	/** @implements Buildable */
	public abstract build(): binaryen.ExpressionRef;
}

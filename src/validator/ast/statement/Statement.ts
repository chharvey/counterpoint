import * as assert from 'node:assert';
import type {Builder} from '../../../index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {AstNode} from '../AstNode.ts';
import type {Buildable} from '../Buildable.ts';
import {Block} from '../Block.ts';



/**
 * A sematic node representing a statement.
 *
 * Known subclasses:
 * - Declaration
 * - StatementExpression
 * - StatementClaim
 * - StatementReassignment
 * - StatementConditional
 * - StatementBreakable
 * - StatementBreak
 */
export abstract class Statement extends AstNode implements Buildable {
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


	public abstract get hasBottomType(): boolean;

	/**
	 * @inheritdoc
	 * @implements Buildable
	 */
	public abstract build(builder: Builder): void;
}

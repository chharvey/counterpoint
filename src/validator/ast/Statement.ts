import * as assert from 'node:assert';
import type {
	Optimizer,
	IR,
} from '../../index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import {Block} from './index.ts';
import {AstNode} from './AstNode.ts';
import type {Foldable} from './Foldable.ts';
import type {Lowerable} from './Lowerable.ts';



/**
 * A sematic node representing a statement.
 *
 * Known subclasses:
 * - Declaration
 * - StatementExpression
 * - StatementClaim
 * - StatementReassignment
 * - StatementConditional
 * - StatementBreak
 */
export abstract class Statement extends AstNode implements Foldable, Lowerable {
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

	/**
	 * @inheritdoc
	 * @implements Lowerable
	 */
	public abstract lower(optimizer: Optimizer): void;
}



/**
 * A statement that is allowed to contain a `StatementBreak`.
 *
 * Known subclasses:
 * - StatementLoop
 * - StatementIteration
 */
export abstract class StatementBreakable extends Statement {
	#labelWhile?:    IR.Label;
	#labelEndwhile?: IR.Label;

	/** @final */
	public get labels(): {while: IR.Label | undefined, endwhile: IR.Label | undefined} {
		return {while: this.#labelWhile, endwhile: this.#labelEndwhile};
	}

	/** @final */
	protected set labelWhile(label: IR.Label) {
		this.#labelWhile = label;
	}

	/** @final */
	protected set labelEndwhile(label: IR.Label) {
		this.#labelEndwhile = label;
	}
}

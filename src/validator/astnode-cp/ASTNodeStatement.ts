import * as assert from 'assert';
import {
	CPConfig,
	CONFIG_DEFAULT,
	Instruction,
	Builder,
} from './package.js';
import {ASTNodeBlock} from './index.js';
import type {Buildable} from './Buildable.js';
import {ASTNodeCP} from './ASTNodeCP.js';



/**
 * A sematic node representing a statement.
 * Known subclasses:
 * - ASTNodeStatementExpression
 * - ASTNodeDeclaration
 */
export abstract class ASTNodeStatement extends ASTNodeCP implements Buildable {
	/**
	 * Construct a new ASTNodeStatement from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new ASTNodeStatement representing the given source
	 */
	public static fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeStatement {
		const block: ASTNodeBlock = ASTNodeBlock.fromSource(`{ ${ src } }`, config);
		assert.strictEqual(block.children.length, 1, 'semantic block should have 1 child');
		return block.children[0];
	}

	/** @implements Buildable */
	public abstract build(builder: Builder): Instruction;
}

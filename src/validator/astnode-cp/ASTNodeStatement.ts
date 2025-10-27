import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import {ASTNodeBlock} from './index.ts';
import type {Buildable} from './Buildable.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';



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
	public abstract build(): binaryen.ExpressionRef;
}

import * as assert from 'node:assert';
import type {
	Optimizer,
	Lowerable,
} from '../../index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import {ASTNodeBlock} from './index.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {Foldable} from './Foldable.ts';



/**
 * A sematic node representing a statement.
 *
 * Known subclasses:
 * - ASTNodeDeclaration
 * - ASTNodeStatementExpression
 * - ASTNodeStatementClaim
 * - ASTNodeStatementReassignment
 * - ASTNodeStatementConditional
 * - ASTNodeStatementBreakable
 * - ASTNodeStatementBreak
 */
export abstract class ASTNodeStatement extends ASTNodeCP implements Foldable, Lowerable {
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
 * - ASTNodeStatementLoop
 * - ASTNodeStatementIteration
 */
export abstract class StatementBreakable extends ASTNodeStatement {
	#labelWhile?:    string;
	#labelDo?:       string;
	#labelEndwhile?: string;

	/** @final */
	public get labels(): {
		while:    string | undefined,
		do:       string | undefined,
		endwhile: string | undefined,
	} {
		return {
			while:    this.#labelWhile,
			do:       this.#labelDo,
			endwhile: this.#labelEndwhile,
		};
	}

	/** @final */
	protected set labelWhile(label: string) {
		this.#labelWhile = label;
	}

	/** @final */
	protected set labelDo(label: string) {
		this.#labelDo = label;
	}

	/** @final */
	protected set labelEndwhile(label: string) {
		this.#labelEndwhile = label;
	}
}

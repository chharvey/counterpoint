import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import type {
	Optimizer,
	IR,
	Lowerable,
} from '../../index.ts';
import {assert_context_name} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import {ASTNodeBlock} from './index.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {Foldable} from './Foldable.ts';
import type {Buildable} from './Buildable.ts';



/**
 * Decorator for {@link ASTNodeStatement#build} method and any overrides.
 * Returns `(nop)` if this node is foldable, else calls the `build()` method.
 * @implements MethodDecorator<ASTNodeStatement, ASTNodeStatement['build']>
 */
export function buildDeco(
	method:  ASTNodeStatement['build'],
	context: ClassMethodDecoratorContext<ASTNodeStatement, typeof method>,
): typeof method {
	assert_context_name(context, 'build');
	return function (this: ASTNodeStatement) {
		return this.isFoldable ? this.builder.module.nop() : method.call(this);
	};
}



/**
 * A sematic node representing a statement.
 * Known subclasses:
 * - ASTNodeDeclaration
 * - ASTNodeStatementExpression
 * - ASTNodeStatementClaim
 * - ASTNodeStatementReassignment
 * - ASTNodeStatementConditional
 * - ASTNodeStatementLoop
 * - ASTNodeStatementIteration
 * - ASTNodeStatementBreak
 */
export abstract class ASTNodeStatement extends ASTNodeCP implements Foldable, Lowerable, Buildable {
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

	/**
	 * @inheritdoc
	 * @implements Buildable
	 */
	public abstract build(): binaryen.ExpressionRef;
}



export abstract class StatementBreakable extends ASTNodeStatement {
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

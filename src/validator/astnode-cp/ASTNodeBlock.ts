import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import {
	type NonemptyArray,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import {Validator} from '../Validator.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import {ASTNodeGoal} from './index.ts';
import type {Buildable} from './Buildable.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {ASTNodeStatement} from './ASTNodeStatement.ts';



export class ASTNodeBlock extends ASTNodeCP implements Buildable {
	/**
	 * Construct a new ASTNodeGoal from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new ASTNodeGoal representing the given source
	 */
	public static fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeBlock {
		const goal: ASTNodeGoal = ASTNodeGoal.fromSource(src, config);
		assert.ok(goal.block, 'semantic goal should have 1 child');
		return goal.block;
	}


	readonly #validator: Validator;

	public constructor(
		start_node: SyntaxNodeType<'block'>,
		public override readonly children: Readonly<NonemptyArray<ASTNodeStatement>>,
		config: CPConfig,
	) {
		super(start_node, {}, children);
		this.#validator = new Validator(config);
	}

	public override get validator(): Validator {
		return this.#validator;
	}

	/** @implements Buildable */
	@memoizeMethod
	public build(): binaryen.ExpressionRef {
		assert.ok(this.children.length, 'Expected ASTNodeBlock to contain at least 1 child.');
		return this.builder.module.block(null, this.children.map((stmt) => stmt.build()));
	}
}

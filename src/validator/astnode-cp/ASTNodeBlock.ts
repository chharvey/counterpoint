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
import {ASTNodeCP} from './ASTNodeCP.ts';
import {
	if_constant_folding,
	type Foldable,
} from './Foldable.ts';
import type {Buildable} from './Buildable.ts';
import type {ASTNodeStatement} from './ASTNodeStatement.ts';
import type {ASTNodeStatementConditional} from './ASTNodeStatementConditional.ts';



export class ASTNodeBlock extends ASTNodeCP implements Foldable, Buildable {
	/**
	 * Construct a new ASTNodeBlock from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new ASTNodeBlock representing the given source
	 */
	public static fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeBlock {
		const goal: ASTNodeGoal = ASTNodeGoal.fromSource(src, config);
		assert.ok(goal.block, 'semantic goal should have 1 child');
		return goal.block;
	}


	#validator?: Validator;

	public constructor(
		start_node: SyntaxNodeType<'block'>,
		public override readonly children: Readonly<NonemptyArray<ASTNodeStatement>>,
		private readonly config:           CPConfig,
	) {
		super(start_node, {}, children);
	}

	public override get validator(): Validator {
		this.#validator ??= new Validator(this.config, (this.parent as ASTNodeStatementConditional | ASTNodeGoal | undefined)?.validator);
		return this.#validator;
	}

	/** @implements Foldable */
	@if_constant_folding
	public get isFoldable(): boolean {
		return this.children.every((stmt) => stmt.isFoldable);
	}

	/** @implements Buildable */
	@memoizeMethod
	public build(): binaryen.ExpressionRef {
		assert.ok(this.children.length, 'Expected ASTNodeBlock to contain at least 1 statement.');
		return this.isFoldable
			? this.builder.module.nop()
			: this.builder.module.block(null, this.children.map((stmt) => stmt.build()));
	}
}

import * as assert from 'node:assert';
import type binaryen from 'binaryen';
import type {
	Optimizer,
	Lowerable,
} from '../../index.ts';
import {
	type NonemptyArray,
	memoizeMethod,
	memoizeGetter,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import {Validator} from '../Validator.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import {ASTNodeGoal} from './index.ts';
import {ASTNodeCP} from './ASTNodeCP.ts';
import type {Foldable} from './Foldable.ts';
import type {Buildable} from './Buildable.ts';
import type {ASTNodeExpressionBlock} from './ASTNodeExpressionBlock.ts';
import type {ASTNodeStatement} from './ASTNodeStatement.ts';
import type {ASTNodeStatementConditional} from './ASTNodeStatementConditional.ts';



export class ASTNodeBlock extends ASTNodeCP implements Foldable, Lowerable, Buildable {
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
		start_node: SyntaxNodeFamily<'block', ['break']>,
		public override readonly children: Readonly<NonemptyArray<ASTNodeStatement>>,
		private readonly config:           CPConfig,
	) {
		super(start_node, {}, children);
		assert.ok(this.children.length, 'Expected ASTNodeBlock to contain at least 1 statement.');
	}

	public override get validator(): Validator {
		this.#validator ??= new Validator(this.config, (this.parent as ASTNodeExpressionBlock | ASTNodeStatementConditional | ASTNodeGoal | undefined)?.validator);
		return this.#validator;
	}

	/** @implements Foldable */
	@memoizeGetter
	public get isFoldable(): boolean {
		return this.children.every((stmt) => stmt.isFoldable);
	}

	/** @implements Foldable */
	@memoizeGetter
	public get hasBottomType(): boolean {
		return this.children.some((c) => c.hasBottomType);
	}

	/**
	 * @inheritdoc
	 * @implements Lowerable
	 */
	@memoizeMethod
	public lower(optimizer: Optimizer): null {
		this.children.forEach((stmt) => {
			if ('lower' in stmt && typeof stmt.lower === 'function') {
				(stmt as Lowerable).lower(optimizer);
			}
		});
		return null;
	}

	/** @implements Buildable */
	@memoizeMethod
	public build(): binaryen.ExpressionRef {
		return this.isFoldable
			? this.builder.module.nop()
			: this.builder.module.block(null, this.children.map((stmt) => stmt.build()));
	}
}

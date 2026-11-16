import * as assert from 'node:assert';
import {
	type NonemptyArray,
	memoizeGetter,
} from '../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import {Validator} from '../Validator.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import {
	Goal,
	type STMT,
	EXPR,
} from './index.ts';
import {AstNode} from './AstNode.ts';
import {is_Functionlike} from './Functionlike.ts';



export class Block extends AstNode {
	/**
	 * Construct a new Block from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new Block representing the given source
	 */
	public static fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): Block {
		const goal: Goal = Goal.fromSource(src, config);
		assert.ok(goal.block, 'semantic goal should have 1 child');
		return goal.block;
	}

	/**
	 * Construct a new function Block from a source text and optionally a configuration.
	 * The source text must parse successfully.
	 * Useful when needing to parse `Block<?Break><+Return>`.
	 * @param src    the source text
	 * @param config the configuration
	 * @returns      a new Block representing the given source
	 */
	public static fromFunctionSource(src: string, config: CplConfig = CONFIG_DEFAULT): Block {
		return EXPR.Function.fromSource(`\\(): anything ${src}`, config).block;
	}


	public constructor(
		start_node: SyntaxNodeFamily<'block', ['break', 'return']>,
		public override readonly children: Readonly<NonemptyArray<STMT.Statement>>,
		private readonly config:           CplConfig,
	) {
		super(start_node, {}, children);
	}

	@memoizeGetter
	public override get validator(): Validator {
		const is_func_block: boolean = !!this.parent && is_Functionlike(this.parent);
		const v = new Validator(this.config, is_func_block ? undefined : this.parent?.validator);
		if (is_func_block) {
			this.parent!.validator.getAllSymbols().forEach((symb) => {
				// add all implicitly-captured symbols to the function block
				symb.persists && v.addSymbol(symb);
			});
		}
		return v;
	}
}

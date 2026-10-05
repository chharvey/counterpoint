import * as assert from 'node:assert';
import * as xjs from 'extrajs';
import type {Builder} from '../../index.ts';
import {
	type NonemptyArray,
	memoizeGetter,
	runOnceMethod,
} from '../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import {
	SymbolSchemaType,
	SymbolSchemaFunc,
} from '../index.ts';
import {Validator} from '../Validator.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import {
	Goal,
	STMT,
} from './index.ts';
import {AstNode} from './AstNode.ts';
import type {Buildable} from './Buildable.ts';



export class Block extends AstNode implements Buildable {
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


	public constructor(
		start_node: SyntaxNodeFamily<'block', ['break', 'return']>,
		public override readonly children: Readonly<NonemptyArray<STMT.Statement>>,
		private readonly config:           CplConfig,
		private readonly isFuncBlock:      boolean,
	) {
		super(start_node, {}, children);
	}

	@memoizeGetter
	public override get validator(): Validator {
		const v = new Validator(this.config, this.isFuncBlock ? undefined : this.parent?.validator);
		if (this.isFuncBlock) {
			this.parent?.validator.getAllSymbols().forEach((symb) => {
				// add all implicitly-captured symbols to the function block
				if (symb instanceof SymbolSchemaType || symb instanceof SymbolSchemaFunc) { // TODO: add a property of SymbolSchema
					v.addSymbol(symb);
				}
			});
		}
		return v;
	}

	@memoizeGetter
	public get hasBottomType(): boolean {
		return this.children.some((c) => c.hasBottomType);
	}

	public override varCheck(): void {
		xjs.Array.forEachAggregated(this.children.filter((stmt) => stmt instanceof STMT.DeclarationFunction), (fn) => fn.hoist());
		return super.varCheck();
	}

	/**
	 * @inheritdoc
	 * @implements Buildable
	 */
	@runOnceMethod
	public build(builder: Builder): void {
		return this.children.forEach((stmt) => stmt.build(builder));
	}
}

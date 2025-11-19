import binaryen from 'binaryen';
import * as xjs from 'extrajs';
import {
	TYPE,
	BinVect,
	TypeErrorNotAssignable,
} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import type {ASTNodeBlock} from './index.ts';
import {if_constant_folding} from './Foldable.ts';
import type {ASTNodeExpression} from './ASTNodeExpression.ts';
import {
	buildDeco,
	ASTNodeStatement,
} from './ASTNodeStatement.ts';



export class ASTNodeStatementLoop extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeStatementLoop {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeStatementLoop);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeType<'statement_loop'>,
		private readonly doFirst:   boolean,
		private readonly until:     boolean,
		public  readonly condition: ASTNodeExpression,
		public  readonly block:     ASTNodeBlock,
	) {
		super(start_node, {doFirst, until}, [condition, block]);
	}

	@if_constant_folding
	public override get isFoldable(): boolean {
		return !!this.condition.fold() && this.block.isFoldable;
	}

	public override varCheck(): void {
		// Do not call `super.varCheck()` as we VarCheck children in a different order.
		xjs.Array.forEachAggregated(this.doFirst ? [this.block, this.condition] : [this.condition, this.block], (c) => c.varCheck());
	}

	public override typeCheck(): void {
		super.typeCheck();
		const condition_type: TYPE.Type = this.condition.type();
		if (!condition_type.isSubtypeOf(TYPE.BOOL)) {
			throw new TypeErrorNotAssignable(condition_type, TYPE.BOOL, this.condition);
		}
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		/*
			;; if `doFirst`:
			(block $exit
				(loop $repeat
					‹body›
					(br_if $exit (not ‹cond›))
					br $repeat
				)
			)
			;; else:
			(block $exit
				(loop $repeat
					(br_if $exit (not ‹cond›))
					‹body›
					br $repeat
				)
			)
		*/
		const condition_build: binaryen.ExpressionRef = this.condition.build();
		const block_build:     binaryen.ExpressionRef = this.block.build();

		const condition_type:   TYPE.Type = this.condition.type();
		const condition_truthy: boolean   = condition_type.isSubtypeOf(TYPE.TRUE);
		const condition_falsy:  boolean   = condition_type.isSubtypeOf(TYPE.FALSE);

		if (!this.until && condition_truthy || this.until && condition_falsy) {
			// `while true…` or `until false…` -> replace condition check with just condition; always repeat
			return this.#buildBlock(this.builder.module.drop(condition_build), block_build, 'repeat');
		} else if (!this.until && condition_falsy || this.until && condition_truthy) {
			// `while false…` or `until true…` -> replace condition check with just condition; always exit
			return this.#buildBlock(this.builder.module.drop(condition_build), block_build, 'exit');
		}

		return this.#buildBlock(
			this.builder.module.br_if('exit', new BinVect(
				this.builder.module,
				this.until ? this.builder.module.call('vnot', [condition_build], binaryen.v128) : condition_build,
			).isSpecial(false)),
			block_build,
			'repeat',
		);
	}

	#buildBlock(condition_build: binaryen.ExpressionRef, block_build: binaryen.ExpressionRef, next_label: 'repeat' | 'exit'): binaryen.ExpressionRef {
		return this.builder.module.block('exit', [this.builder.module.loop('repeat', this.builder.module.block(null, (this.doFirst
			? [block_build, condition_build, this.builder.module.br(next_label)]
			: [condition_build, block_build, this.builder.module.br(next_label)]
		)))]);
	}
}

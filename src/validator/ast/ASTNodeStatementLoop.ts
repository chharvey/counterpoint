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
	memoizeGetter,
} from '../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import type {ASTNodeBlock} from './index.ts';
import type {ASTNodeExpression} from './ASTNodeExpression.ts';
import {
	buildDeco,
	ASTNodeStatement,
} from './ASTNodeStatement.ts';



export class ASTNodeStatementLoop extends ASTNodeStatement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): ASTNodeStatementLoop {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeStatementLoop);
		return statement;
	}


	#labelExit:   string = '';
	#labelRepeat: string = '';
	#labelBody:   string = '';

	public constructor(
		start_node: SyntaxNodeType<'statement_loop'>,
		private readonly doFirst:   boolean,
		private readonly until:     boolean,
		public  readonly condition: ASTNodeExpression,
		public  readonly block:     ASTNodeBlock,
	) {
		super(start_node, {doFirst, until}, [condition, block]);
	}


	@memoizeGetter
	public override get isFoldable(): boolean {
		return !!this.condition.fold() && this.block.isFoldable;
	}

	@memoizeGetter
	public override get hasBottomType(): boolean {
		return this.condition.type().isBottomType || this.block.hasBottomType;
	}

	public override varCheck(): void {
		// Do not call `super.varCheck()` as we VarCheck children in a different order.
		xjs.Array.forEachAggregated(this.doFirst ? [this.block, this.condition] : [this.condition, this.block], (c) => c.varCheck());
	}

	public override typeCheck(): void {
		super.typeCheck();
		if (!this.condition.type().isSubtypeOf(TYPE.BOOL)) {
			throw new TypeErrorNotAssignable(this.condition, TYPE.BOOL);
		}
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		const builder_block = this.builder.teeBlock(this);
		this.#labelExit   = `exit${   builder_block.index }`;
		this.#labelRepeat = `repeat${ builder_block.index }`;
		this.#labelBody   = `body${   builder_block.index }`;

		/*
			;; if `doFirst`:
			(block $exit
				(loop $repeat
					(block $body ‹body›) ;; `break;` --> `(br $exit)`, `skip;` --> `(br $body)`
					(br_if $exit (not ‹cond›))
					(br $repeat)
				)
			)
			;; else:
			(block $exit
				(loop $repeat
					(br_if $exit (not ‹cond›))
					(block $body ‹body›) ;; `break;` --> `(br $exit)`, `skip;` --> `(br $body)`
					(br $repeat)
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
			return this.#buildBlock(this.builder.module.drop(condition_build), block_build);
		} else if (!this.until && condition_falsy || this.until && condition_truthy) {
			// `while false…` or `until true…` -> replace condition check with just condition; always exit
			return this.#buildBlock(this.builder.module.drop(condition_build), block_build, true);
		}

		return this.#buildBlock(
			this.builder.module.br_if(this.#labelExit, new BinVect(
				this.builder.module,
				this.until ? this.builder.module.call('vnot', [condition_build], binaryen.v128) : condition_build,
			).isSpecial(false)),
			block_build,
		);
	}

	#buildBlock(build_test: binaryen.ExpressionRef, build_block: binaryen.ExpressionRef, while_false: boolean = false): binaryen.ExpressionRef {
		const mod: binaryen.Module = this.builder.module;
		const body: binaryen.ExpressionRef = mod.block(this.#labelBody, [build_block]);
		return mod.block(this.#labelExit, [mod.loop(this.#labelRepeat, mod.block(null, (this.doFirst
			? [body, build_test, mod.br(while_false ? this.#labelExit : this.#labelRepeat)]
			: [build_test, body, mod.br(while_false ? this.#labelExit : this.#labelRepeat)]
		)))]);
	}
}

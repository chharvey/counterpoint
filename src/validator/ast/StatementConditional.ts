import binaryen from 'binaryen';
import {
	TYPE,
	drop_then,
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
import type {SyntaxNodeFamily} from '../utils-private.ts';
import type {ASTNodeBlock} from './index.ts';
import type {ASTNodeExpression} from './Expression.ts';
import {
	buildDeco,
	ASTNodeStatement,
} from './Statement.ts';



export class ASTNodeStatementConditional extends ASTNodeStatement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): ASTNodeStatementConditional {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeStatementConditional);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'statement_conditional', ['unless', 'break']>,
		private readonly unless:       boolean,
		public  readonly condition:    ASTNodeExpression,
		public  readonly consequent:   ASTNodeBlock,
		public  readonly alternative?: ASTNodeBlock | ASTNodeStatementConditional,
	) {
		super(start_node, {unless}, alternative ? [condition, consequent, alternative] : [condition, consequent]);
	}

	@memoizeGetter
	public override get isFoldable(): boolean {
		const condition_type:   TYPE.Type = this.condition.type();
		const condition_truthy: boolean   = condition_type.isSubtypeOf(TYPE.TRUE);
		const condition_falsy:  boolean   = condition_type.isSubtypeOf(TYPE.FALSE);

		return !!this.condition.fold() && (
			/*
				- `if true…`  or `unless false…`, and consequent  is foldable                    -> sufficient
				- `if false…` or `unless true…`,  and alternative is foldable (or doesn’t exist) -> sufficient
			*/
			(!this.unless && condition_truthy || this.unless && condition_falsy)  && this.consequent.isFoldable ||
			(!this.unless && condition_falsy  || this.unless && condition_truthy) && (!this.alternative || !!this.alternative.isFoldable)
		);
	}

	@memoizeGetter
	public override get hasBottomType(): boolean {
		return this.condition.type().isBottomType || this.consequent.hasBottomType || (this.alternative?.hasBottomType ?? false);
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
		const condition_build:   binaryen.ExpressionRef = this.condition.build();
		const consequent_build:  binaryen.ExpressionRef = this.consequent.build();
		const alternative_build: binaryen.ExpressionRef = this.alternative?.build() ?? this.builder.module.nop();

		const condition_type:   TYPE.Type = this.condition.type();
		const condition_truthy: boolean   = condition_type.isSubtypeOf(TYPE.TRUE);
		const condition_falsy:  boolean   = condition_type.isSubtypeOf(TYPE.FALSE);

		if (!this.unless && condition_truthy || this.unless && condition_falsy) {
			// `if true…` or `unless false…` -> just return the consequent
			return drop_then(this.builder.module, [condition_build], consequent_build);
		} else if (!this.unless && condition_falsy || this.unless && condition_truthy) {
			// `if false…` or `unless true…` -> just return the alternative
			return drop_then(this.builder.module, [condition_build], alternative_build);
		}

		return this.builder.module.if(
			new BinVect(
				this.builder.module,
				this.unless ? this.builder.module.call('vnot', [condition_build], binaryen.v128) : condition_build,
			).isSpecial(true),
			consequent_build,
			alternative_build,
		);
	}
}

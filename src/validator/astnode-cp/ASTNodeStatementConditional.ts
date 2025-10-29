import binaryen from 'binaryen';
import {
	type VALUE,
	TYPE,
	BinVect,
	TypeErrorNotAssignable,
} from '../../index.ts';
import {assert_instanceof} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import type {ASTNodeBlock} from './index.ts';
import type {ASTNodeExpression} from './ASTNodeExpression.ts';
import {ASTNodeStatement} from './ASTNodeStatement.ts';



export class ASTNodeStatementConditional extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeStatementConditional {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeStatementConditional);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'statement_conditional', ['unless']>,
		private readonly unless:       boolean,
		public  readonly condition:    ASTNodeExpression,
		public  readonly consequent:   ASTNodeBlock,
		public  readonly alternative?: ASTNodeBlock | ASTNodeStatementConditional,
	) {
		super(start_node, {unless}, alternative ? [condition, consequent, alternative] : [condition, consequent]);
	}

	public override typeCheck(): void {
		super.typeCheck();
		const condition_type: TYPE.Type = this.condition.type();
		if (!condition_type.isSubtypeOf(TYPE.BOOL)) {
			throw new TypeErrorNotAssignable(condition_type, TYPE.BOOL, this.condition);
		}
	}

	public override build(): binaryen.ExpressionRef {
		let   condition_build:   binaryen.ExpressionRef = this.condition.build();
		const consequent_build:  binaryen.ExpressionRef = this.consequent.build();
		const alternative_build: binaryen.ExpressionRef = this.alternative?.build() ?? this.builder.module.nop();

		if (this.validator.config.compilerOptions.constantFolding) {
			const condition_fold: VALUE.Value | null = this.condition.fold();
			if (!this.unless && condition_fold?.isTruthy || this.unless && condition_fold && !condition_fold.isTruthy) {
				// `if true…` or `unless false…` -> build the consequent
				return consequent_build;
			} else if (!this.unless && condition_fold && !condition_fold.isTruthy || this.unless && condition_fold?.isTruthy) {
				// `if false…` or `unless true…` -> build the alternative
				return alternative_build;
			}
		}

		if (this.unless) {
			condition_build = this.builder.module.call('vnot', [condition_build], binaryen.v128);
		}
		return this.builder.module.if(
			new BinVect(this.builder.module, condition_build).isSpecial(true),
			consequent_build,
			alternative_build,
		);
	}
}

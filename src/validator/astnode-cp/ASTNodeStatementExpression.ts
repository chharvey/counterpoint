import type binaryen from 'binaryen';
import {VALUE} from '../../index.ts';
import {
	assert_instanceof,
	memoizeMethod,
} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeFamily} from '../utils-private.ts';
import {if_constant_folding} from './Foldable.ts';
import type {ASTNodeExpression} from './ASTNodeExpression.ts';
import {
	buildDeco,
	ASTNodeStatement,
} from './ASTNodeStatement.ts';



export class ASTNodeStatementExpression extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeStatementExpression {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeStatementExpression);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'statement_expression', ['break']>,
		public readonly expr?: ASTNodeExpression,
	) {
		super(start_node, {}, (expr) ? [expr] : void 0);
	}

	@if_constant_folding
	public override get isFoldable(): boolean {
		return !this.expr || !!this.expr.fold();
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		return this.builder.module.drop(this.validator.config.compilerOptions.constantFolding ? this.expr!.build() : this.expr?.build() ?? VALUE.NULL.build(this.builder));
	}
}

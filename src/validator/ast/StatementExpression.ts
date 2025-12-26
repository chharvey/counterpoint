import type binaryen from 'binaryen';
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
import type {ASTNodeExpression} from './Expression.ts';
import {
	buildDeco,
	ASTNodeStatement,
} from './Statement.ts';



export class ASTNodeStatementExpression extends ASTNodeStatement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): ASTNodeStatementExpression {
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

	@memoizeGetter
	public override get isFoldable(): boolean {
		return !this.expr || !!this.expr.fold();
	}

	@memoizeGetter
	public override get hasBottomType(): boolean {
		return this.expr?.type().isBottomType ?? false;
	}

	@memoizeMethod
	@buildDeco
	public override build(): binaryen.ExpressionRef {
		return this.builder.module.drop(this.expr!.build());
	}
}

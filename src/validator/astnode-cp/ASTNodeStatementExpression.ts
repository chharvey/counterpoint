import type binaryen from 'binaryen';
import {assert_instanceof} from '../../lib/index.ts';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.ts';
import type {SyntaxNodeType} from '../utils-private.ts';
import type {ASTNodeExpression} from './ASTNodeExpression.ts';
import {ASTNodeStatement} from './ASTNodeStatement.ts';



export class ASTNodeStatementExpression extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeStatementExpression {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert_instanceof(statement, ASTNodeStatementExpression);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeType<'statement_expression'>,
		public readonly expr?: ASTNodeExpression,
	) {
		super(start_node, {}, (expr) ? [expr] : void 0);
	}

	public override build(): binaryen.ExpressionRef {
		return !this.expr || (this.validator.config.compilerOptions.constantFolding && this.expr.fold())
			? this.builder.module.nop()
			: this.builder.module.drop(this.expr.build());
	}
}

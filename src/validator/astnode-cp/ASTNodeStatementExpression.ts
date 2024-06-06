import type binaryen from 'binaryen';
import {assert_instanceof} from '../../lib/index.js';
import {
	type CPConfig,
	CONFIG_DEFAULT,
} from '../../core/index.js';
import type {SyntaxNodeType} from '../utils-private.js';
import type {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeStatement} from './ASTNodeStatement.js';



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
		return (this.expr)
			? this.builder.module.drop(this.expr.build())
			: this.builder.module.nop();
	}
}

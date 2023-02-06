import * as assert from 'assert';
import type binaryen from 'binaryen';
import {
	Builder,
	CPConfig,
	CONFIG_DEFAULT,
	SyntaxNodeType,
} from './package.js';
import type {ASTNodeExpression} from './ASTNodeExpression.js';
import {ASTNodeStatement} from './ASTNodeStatement.js';



export class ASTNodeStatementExpression extends ASTNodeStatement {
	public static override fromSource(src: string, config: CPConfig = CONFIG_DEFAULT): ASTNodeStatementExpression {
		const statement: ASTNodeStatement = ASTNodeStatement.fromSource(src, config);
		assert.ok(statement instanceof ASTNodeStatementExpression);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeType<'statement_expression'>,
		public readonly expr?: ASTNodeExpression,
	) {
		super(start_node, {}, (expr) ? [expr] : void 0);
	}

	public override build(builder: Builder): binaryen.ExpressionRef {
		return (this.expr)
			? builder.module.drop(this.expr.build(builder))
			: builder.module.nop();
	}
}

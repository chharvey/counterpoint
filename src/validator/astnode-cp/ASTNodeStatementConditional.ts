import type binaryen from 'binaryen';
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
		start_node: SyntaxNodeFamily<'statement_conditional', ['if']>,
		private readonly condition:    ASTNodeExpression,
		private readonly consequent:   ASTNodeBlock,
		private readonly alternative?: ASTNodeBlock | ASTNodeStatementConditional,
	) {
		super(start_node, {}, alternative ? [condition, consequent, alternative] : [condition, consequent]);
	}

	public override build(): binaryen.ExpressionRef {
		throw new Error('not yet supported.');
	}
}

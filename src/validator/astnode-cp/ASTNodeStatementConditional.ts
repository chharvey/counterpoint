import type binaryen from 'binaryen';
import {
	TYPE,
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
		start_node: SyntaxNodeFamily<'statement_conditional', ['if']>,
		unless:     boolean,
		private readonly condition:    ASTNodeExpression,
		private readonly consequent:   ASTNodeBlock,
		private readonly alternative?: ASTNodeBlock | ASTNodeStatementConditional,
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
		throw new Error('not yet supported.');
	}
}

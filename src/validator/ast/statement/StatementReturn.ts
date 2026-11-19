import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import type * as EXPR from '../expression/index.ts';
import {Statement} from './Statement.ts';



export class StatementReturn extends Statement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): StatementReturn {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, StatementReturn);
		return statement;
	}


	public constructor(
		start_node: SyntaxNodeType<'statement_return'>,
		public readonly panic:      boolean,
		public readonly expression: EXPR.Expression | null,
	) {
		super(start_node, {panic}, expression ? [expression] : []);
	}
}

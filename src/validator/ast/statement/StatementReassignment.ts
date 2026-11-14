import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeFamily} from '../../utils-private.ts';
import type * as EXPR from '../expression/index.ts';
import {Statement} from './Statement.ts';



export class StatementReassignment extends Statement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): StatementReassignment {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, StatementReassignment);
		return statement;
	}


	public constructor(
		start_node: (
			| SyntaxNodeFamily<'statement_set',    ['break', 'return']>
			| SyntaxNodeFamily<'statement_delete', ['break', 'return']>
		),
		public readonly assignee:  EXPR.Variable | EXPR.Access,
		public readonly assigned?: EXPR.Expression,
	) {
		super(start_node, {}, [assignee, ...(assigned ? [assigned] : [])]);
	}
}

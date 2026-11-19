import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeFamily} from '../../utils-private.ts';
import type * as AST_TYPE from '../type/index.ts';
import type * as EXPR from '../expression/index.ts';
import {Statement} from './Statement.ts';



export class StatementClaim extends Statement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): StatementClaim {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, StatementClaim);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'statement_claim', ['break', 'return']>,
		public readonly assignee: EXPR.Variable | EXPR.Access,
		public readonly claimed_type: AST_TYPE.Type,
	) {
		super(start_node, {}, [assignee, claimed_type]);
	}
}

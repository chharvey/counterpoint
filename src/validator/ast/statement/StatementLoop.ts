import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeFamily} from '../../utils-private.ts';
import type {Block} from '../Block.ts';
import type * as EXPR from '../expression/index.ts';
import {Statement} from './Statement.ts';
import {StatementBreakable} from './StatementBreakable.ts';



export class StatementLoop extends StatementBreakable {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): StatementLoop {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, StatementLoop);
		return statement;
	}


	public constructor(
		start_node: SyntaxNodeFamily<'statement_loop', ['return']>,
		public readonly doFirst:   boolean,
		public readonly until:     boolean,
		public readonly condition: EXPR.Expression,
		public readonly block:     Block,
	) {
		super(start_node, {doFirst, until}, [condition, block]);
	}
}

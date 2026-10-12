import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import {Statement} from './Statement.ts';



export class StatementBreak extends Statement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): StatementBreak {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, StatementBreak);
		return statement;
	}


	public constructor(
		start_node: SyntaxNodeType<'statement_break'>,
		private readonly skip: boolean,
	) {
		super(start_node);
	}
}

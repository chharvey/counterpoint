import type {Builder} from '../../../index.ts';
import {
	assert_instanceof,
	memoizeGetter,
	runOnceMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeFamily} from '../../utils-private.ts';
import type * as EXPR from '../expression/index.ts';
import {Statement} from './Statement.ts';



export class StatementDelete extends Statement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): StatementDelete {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, StatementDelete);
		return statement;
	}


	public constructor(
		start_node: SyntaxNodeFamily<'statement_delete', ['break']>,
		public readonly assignee: EXPR.Variable | EXPR.Access,
	) {
		super(start_node, {}, [assignee]);
	}

	@memoizeGetter
	public override get hasBottomType(): boolean {
		throw new Error('Unsupported.');
	}

	public override varCheck(): void {
		throw new Error('Unsupported.');
	}

	public override typeCheck(): void {
		throw new Error('Unsupported.');
	}

	@runOnceMethod
	public override build(_builder: Builder): void {
		throw new Error('Unsupported.');
	}
}

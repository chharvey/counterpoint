import {
	type Builder,
	OP,
} from '../../../index.ts';
import {
	assert_instanceof,
	noopGetter,
	memoizeGetter,
	runOnceMethod,
} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import type {SyntaxNodeType} from '../../utils-private.ts';
import {Statement} from './Statement.ts';



export class StatementReturn extends Statement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): StatementReturn {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, StatementReturn);
		return statement;
	}


	public constructor(start_node: SyntaxNodeType<'statement_return'>) {
		super(start_node);
	}

	@noopGetter(memoizeGetter)
	public override get hasBottomType(): boolean {
		throw new Error('`StatementReturn#hasBottomType` not yet supported.');
	}

	@runOnceMethod
	public override build(builder: Builder): void {
		builder.terminateBlock(new OP.Goto('caller'));
		builder.initiateBlock(builder.newLabel(true));
	}
}

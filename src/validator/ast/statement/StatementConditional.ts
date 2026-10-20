import {TypeErrorNotAssignable} from '../../../index.ts';
import {assert_instanceof} from '../../../lib/index.ts';
import {
	type CplConfig,
	CONFIG_DEFAULT,
} from '../../../core/index.ts';
import {TYPE} from '../../../typer/index.ts';
import type {SyntaxNodeFamily} from '../../utils-private.ts';
import type {Block} from '../Block.ts';
import type * as EXPR from '../expression/index.ts';
import {Statement} from './Statement.ts';



export class StatementConditional extends Statement {
	public static override fromSource(src: string, config: CplConfig = CONFIG_DEFAULT): StatementConditional {
		const statement: Statement = Statement.fromSource(src, config);
		assert_instanceof(statement, StatementConditional);
		return statement;
	}

	public constructor(
		start_node: SyntaxNodeFamily<'statement_conditional', ['unless', 'break', 'return']>,
		public readonly unless:       boolean,
		public readonly condition:    EXPR.Expression,
		public readonly consequent:   Block,
		public readonly alternative?: Block | StatementConditional,
	) {
		super(start_node, {unless}, alternative ? [condition, consequent, alternative] : [condition, consequent]);
	}


	public override typeCheck(): void {
		super.typeCheck();
		if (!this.condition.type().isSubtypeOf(TYPE.BOOL)) {
			throw new TypeErrorNotAssignable(this.condition, TYPE.BOOL);
		}
	}
}
